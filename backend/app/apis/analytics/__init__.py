import os
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, timedelta
import databutton as db
from supabase import create_client, Client

# Supabase client initialization
# Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are in db.secrets
SUPABASE_URL = db.secrets.get("SUPABASE_URL")
SUPABASE_KEY = db.secrets.get("SUPABASE_SERVICE_ROLE_KEY")

def get_supabase_client():
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase URL or Key not configured in secrets.")
    return create_client(SUPABASE_URL, SUPABASE_KEY)

router = APIRouter(
    prefix="/api/v1/analytics",
    tags=["Analytics"]
)

# --- Pydantic Models (assuming these are defined above this snippet) --- #
# FunnelStage, PipelineStatsResponse definitions remain the same

class FunnelStage(BaseModel):
    name: str
    count: int
    value: Optional[float] = None # Example: MRR or deal value in this stage

class PipelineStatsResponse(BaseModel):
    total_leads: int = Field(..., description="Total number of leads.")
    total_deals: int = Field(..., description="Total number of deals (opportunities).")
    active_deals: int = Field(..., description="Number of deals currently active (not won or lost).")
    won_deals: int = Field(..., description="Number of deals marked as 'Won'.")
    lost_deals: int = Field(..., description="Number of deals marked as 'Lost'.")
    
    potential_mrr: float = Field(..., description="Total MRR from all active deals.")
    won_mrr: float = Field(..., description="Total MRR from all deals marked as 'Won'.")
    average_deal_value: float = Field(..., description="Average value of a deal (can be based on won or all active).")
    
    lead_to_deal_conversion_rate: float = Field(..., ge=0, le=1, description="Conversion rate from Lead to Deal (e.g., 0.25 for 25%).")
    deal_win_rate: float = Field(..., ge=0, le=1, description="Percentage of active/closed deals that are won (e.g., Won Deals / (Won Deals + Lost Deals)).")
    
    deal_volume_by_stage: List[FunnelStage] = Field(..., description="Number and value of deals in each defined pipeline stage.")
    
    average_time_in_stage: List[Dict[str, Any]] = Field(..., description="Average time deals spend in each stage. E.g., [{'stage_name': 'Discovery', 'average_days': 10}]")
    
    lead_sources_breakdown: List[Dict[str, Any]] = Field(..., description="Breakdown of leads by source. E.g., [{'source_name': 'Website', 'count': 50, 'percentage': 0.20}]")
    
    program_type_distribution: List[Dict[str, Any]] = Field(..., description="Distribution of deals/leads by program type. E.g., [{'program_name': 'PRIME', 'count': 30, 'percentage': 0.60}]")

# --- API Endpoints --- #

# Define active stages for easier filtering
ACTIVE_STAGES = ['Lead Qualification', 'Needs Analysis', 'Proposal Sent', 'Negotiation']
WON_STAGE = 'Closed Won'
LOST_STAGE = 'Closed Lost'

@router.get("/pipeline", response_model=PipelineStatsResponse)
async def get_pipeline_stats(range_filter: Optional[str] = None, supabase: Client = Depends(get_supabase_client)):
    try:
        # 1. Total Leads
        leads_query = supabase.table("leads").select("id", count="exact").execute()
        total_leads = leads_query.count if leads_query.count is not None else 0

        # 2. Deals data - Fetch all relevant deals once
        # Joins with deal_stages table, assuming it has a 'name' column for the stage name
        # and a foreign key relationship is set up from deals.deal_stage_id to deal_stages.id
        # 1. Fetch deals, ensuring lead_id is present
        deals_response = supabase.table("deals").select(
            "id, value_amount, created_at, lead_id, deal_stages(name)"
        ).execute()
        all_deals_data = deals_response.data if deals_response.data else []

        # 2. Collect all unique lead_ids from deals
        lead_ids = list(set(d['lead_id'] for d in all_deals_data if d.get('lead_id')))

        # 3. Fetch program information for these lead_ids
        leads_programs_map = {}
        if lead_ids:
            leads_response = supabase.table("leads").select("id, program").in_("id", lead_ids).execute()
            if leads_response.data:
                for lead_info in leads_response.data:
                    leads_programs_map[lead_info['id']] = lead_info.get('program', 'Unknown')
        
        # 4. Augment deals data with program information
        for deal in all_deals_data:
            deal['program_from_lead'] = leads_programs_map.get(deal.get('lead_id'), 'Unknown')
        
        total_deals = len(all_deals_data)

        # 3. Calculate deal metrics
        won_deals_list = [d for d in all_deals_data if d.get('deal_stages', {}).get('name') == WON_STAGE]
        lost_deals_list = [d for d in all_deals_data if d.get('deal_stages', {}).get('name') == LOST_STAGE]
        active_deals_list = [d for d in all_deals_data if d.get('deal_stages', {}).get('name') in ACTIVE_STAGES]

        won_deals_count = len(won_deals_list)
        lost_deals_count = len(lost_deals_list)
        active_deals_count = len(active_deals_list)

        potential_mrr = sum(d.get('value_amount', 0) or 0 for d in active_deals_list)
        won_mrr = sum(d.get('value_amount', 0) or 0 for d in won_deals_list)
        
        average_deal_value = (won_mrr / won_deals_count) if won_deals_count > 0 else 0
        
        lead_to_deal_conversion_rate = (total_deals / total_leads) if total_leads > 0 else 0
        deal_win_rate = (won_deals_count / (won_deals_count + lost_deals_count)) if (won_deals_count + lost_deals_count) > 0 else 0

        # --- Placeholder for more complex calculations (will be filled in next steps) ---
        deal_volume_by_stage_calc: List[FunnelStage] = []
        for stage_name in ACTIVE_STAGES:
            stage_deals = [d for d in active_deals_list if d.get('deal_stages', {}).get('name') == stage_name]
            deal_volume_by_stage_calc.append(
                FunnelStage(
                    name=stage_name, 
                    count=len(stage_deals),
                    value=sum(d.get('value_amount', 0) or 0 for d in stage_deals)
                )
            )

        # Placeholder for lead sources - requires fetching leads data with sources
        leads_data_for_sources = supabase.table("leads").select("id, source").execute().data or []
        source_counts: Dict[str, int] = {}
        for lead in leads_data_for_sources:
            source = lead.get('source', 'Unknown')
            source_counts[source] = source_counts.get(source, 0) + 1
        
        lead_sources_breakdown_calc = []
        total_source_leads = sum(source_counts.values())
        for source, count in source_counts.items():
            lead_sources_breakdown_calc.append({
                "source_name": source,
                "count": count,
                "percentage": (count / total_source_leads) if total_source_leads > 0 else 0
            })

        # Placeholder for program type distribution - assumes program_type is on deals table
        program_counts: Dict[str, int] = {}
        for deal in all_deals_data:
            program = deal.get('programa_from_lead', 'Unknown')
            program_counts[program] = program_counts.get(program, 0) + 1
        
        program_type_distribution_calc = []
        total_program_deals = sum(program_counts.values())
        for program, count in program_counts.items():
            program_type_distribution_calc.append({
                "program_name": program,
                "count": count,
                "percentage": (count / total_program_deals) if total_program_deals > 0 else 0
            })
            
        # Average time in stage - complex, using placeholder for now
        average_time_in_stage_calc = [
            {"stage_name": "Lead Qualification", "average_days": 7},
            {"stage_name": "Needs Analysis", "average_days": 10},
            {"stage_name": "Proposal Sent", "average_days": 12},
            {"stage_name": "Negotiation", "average_days": 8} 
        ]

        return PipelineStatsResponse(
            total_leads=total_leads,
            total_deals=total_deals,
            active_deals=active_deals_count,
            won_deals=won_deals_count,
            lost_deals=lost_deals_count,
            potential_mrr=potential_mrr,
            won_mrr=won_mrr,
            average_deal_value=average_deal_value,
            lead_to_deal_conversion_rate=lead_to_deal_conversion_rate,
            deal_win_rate=deal_win_rate,
            deal_volume_by_stage=deal_volume_by_stage_calc,
            average_time_in_stage=average_time_in_stage_calc, # Using placeholder
            lead_sources_breakdown=lead_sources_breakdown_calc,
            program_type_distribution=program_type_distribution_calc
        )

    except Exception as e:
        print(f"Error fetching pipeline stats from Supabase: {e}")
        # Fallback to mock data or raise error, for now raising error
        # You might want to return the mock_stats structure on error for frontend stability
        # For development, it's good to see the error.
        raise HTTPException(status_code=500, detail=f"An error occurred while fetching analytics data: {str(e)}") from e

# Remove or comment out the old mock data generation part if it was separate
