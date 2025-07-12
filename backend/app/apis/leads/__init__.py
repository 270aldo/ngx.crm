import os
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from uuid import UUID
from datetime import datetime

from supabase import create_client, Client

def get_supabase_credentials():
    """Get Supabase credentials from Databutton or environment variables"""
    supabase_url = None
    supabase_key = None
    
    # Try Databutton first (for deployed environment)
    try:
        import databutton as db
        supabase_url = db.secrets.get("SUPABASE_URL")
        supabase_key = db.secrets.get("SUPABASE_SERVICE_ROLE_KEY")
    except (ImportError, Exception):
        # Fallback to environment variables (for local development)
        pass
    
    # If Databutton didn't work, try environment variables
    if not supabase_url or not supabase_key:
        supabase_url = supabase_url or os.getenv("SUPABASE_URL")
        supabase_key = supabase_key or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    return supabase_url, supabase_key

def get_supabase_client():
    supabase_url, supabase_key = get_supabase_credentials()
    if not supabase_url or not supabase_key:
        raise HTTPException(status_code=500, detail="Supabase URL or Key not configured.")
    return create_client(supabase_url, supabase_key)

router = APIRouter(
    prefix="/api/v1/leads",
    tags=["Leads"]
)

# Pydantic Models
class LeadBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    company: Optional[str] = Field(None, max_length=255)
    source: str = Field(..., min_length=1, max_length=100)
    program: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = Field("new", pattern="^(new|contacted|qualified|converted|lost)$")
    score: Optional[int] = Field(0, ge=0, le=100)
    assigned_to: Optional[UUID] = None
    notes: Optional[str] = None
    custom_fields: Optional[dict] = None

class LeadCreate(LeadBase):
    pass

class LeadUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    company: Optional[str] = Field(None, max_length=255)
    source: Optional[str] = Field(None, min_length=1, max_length=100)
    program: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = Field(None, pattern="^(new|contacted|qualified|converted|lost)$")
    score: Optional[int] = Field(None, ge=0, le=100)
    assigned_to: Optional[UUID] = None
    notes: Optional[str] = None
    custom_fields: Optional[dict] = None

class LeadRead(LeadBase):
    id: UUID
    converted_to_contact_id: Optional[UUID] = None
    converted_at: Optional[datetime] = None
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class LeadWithDetails(LeadRead):
    assigned_to_name: Optional[str] = None
    converted_contact_name: Optional[str] = None

# API Endpoints

@router.get("", response_model=List[LeadWithDetails])
async def list_leads(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of records to return"),
    status: Optional[str] = Query(None, pattern="^(new|contacted|qualified|converted|lost)$"),
    assigned_to: Optional[UUID] = Query(None, description="Filter by assigned user"),
    source: Optional[str] = Query(None, description="Filter by source"),
    search: Optional[str] = Query(None, description="Search by name, email, or company"),
    supabase: Client = Depends(get_supabase_client)
):
    """List leads with pagination and filtering"""
    try:
        query = supabase.table("leads").select(
            """
            id, name, email, phone, company, source, program, status, score,
            assigned_to, notes, custom_fields, converted_to_contact_id, converted_at,
            created_by, created_at, updated_at,
            user_profiles!leads_assigned_to_fkey(full_name),
            contacts!leads_converted_to_contact_id_fkey(name)
            """
        )
        
        # Apply filters
        if status:
            query = query.eq("status", status)
        if assigned_to:
            query = query.eq("assigned_to", str(assigned_to))
        if source:
            query = query.eq("source", source)
        if search:
            query = query.or_(f"name.ilike.%{search}%,email.ilike.%{search}%,company.ilike.%{search}%")
        
        # Apply pagination and ordering
        query = query.order("created_at", desc=True).range(skip, skip + limit - 1)
        
        response = query.execute()
        
        # Transform the response to include nested data in flat structure
        leads = []
        for lead_data in response.data or []:
            lead = LeadWithDetails(
                **{k: v for k, v in lead_data.items() if k not in ['user_profiles', 'contacts']},
                assigned_to_name=lead_data.get('user_profiles', {}).get('full_name') if lead_data.get('user_profiles') else None,
                converted_contact_name=lead_data.get('contacts', {}).get('name') if lead_data.get('contacts') else None
            )
            leads.append(lead)
        
        return leads
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching leads: {str(e)}")

@router.get("/{lead_id}", response_model=LeadWithDetails)
async def get_lead(
    lead_id: UUID,
    supabase: Client = Depends(get_supabase_client)
):
    """Get a single lead by ID"""
    try:
        response = supabase.table("leads").select(
            """
            id, name, email, phone, company, source, program, status, score,
            assigned_to, notes, custom_fields, converted_to_contact_id, converted_at,
            created_by, created_at, updated_at,
            user_profiles!leads_assigned_to_fkey(full_name),
            contacts!leads_converted_to_contact_id_fkey(name)
            """
        ).eq("id", str(lead_id)).single().execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail=f"Lead with id {lead_id} not found")
        
        lead_data = response.data
        lead = LeadWithDetails(
            **{k: v for k, v in lead_data.items() if k not in ['user_profiles', 'contacts']},
            assigned_to_name=lead_data.get('user_profiles', {}).get('full_name') if lead_data.get('user_profiles') else None,
            converted_contact_name=lead_data.get('contacts', {}).get('name') if lead_data.get('contacts') else None
        )
        
        return lead
        
    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=f"Lead with id {lead_id} not found")
        raise HTTPException(status_code=500, detail=f"Error fetching lead: {str(e)}")

@router.post("", response_model=LeadRead, status_code=201)
async def create_lead(
    lead_data: LeadCreate,
    supabase: Client = Depends(get_supabase_client)
):
    """Create a new lead"""
    try:
        # Prepare data for insertion
        lead_dict = lead_data.model_dump(exclude_unset=True)
        
        # Convert UUID fields to strings
        if lead_dict.get("assigned_to"):
            lead_dict["assigned_to"] = str(lead_dict["assigned_to"])
        
        # Check for duplicate email if provided
        if lead_dict.get("email"):
            existing = supabase.table("leads").select("id").eq("email", lead_dict["email"]).execute()
            if existing.data:
                raise HTTPException(status_code=400, detail="Lead with this email already exists")
        
        response = supabase.table("leads").insert(lead_dict).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create lead")
            
        return LeadRead(**response.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating lead: {str(e)}")

@router.patch("/{lead_id}", response_model=LeadRead)
async def update_lead(
    lead_id: UUID,
    lead_data: LeadUpdate,
    supabase: Client = Depends(get_supabase_client)
):
    """Update a lead"""
    try:
        # Get update data
        update_dict = lead_data.model_dump(exclude_unset=True)
        
        if not update_dict:
            raise HTTPException(status_code=400, detail="No update data provided")
        
        # Convert UUID fields to strings
        if update_dict.get("assigned_to"):
            update_dict["assigned_to"] = str(update_dict["assigned_to"])
        
        # Check for duplicate email if being updated
        if update_dict.get("email"):
            existing = supabase.table("leads").select("id").eq("email", update_dict["email"]).neq("id", str(lead_id)).execute()
            if existing.data:
                raise HTTPException(status_code=400, detail="Another lead with this email already exists")
        
        response = supabase.table("leads").update(update_dict).eq("id", str(lead_id)).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail=f"Lead with id {lead_id} not found")
            
        return LeadRead(**response.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating lead: {str(e)}")

@router.post("/{lead_id}/convert", response_model=dict)
async def convert_lead_to_contact(
    lead_id: UUID,
    create_deal: bool = Query(False, description="Whether to create a deal for the new contact"),
    supabase: Client = Depends(get_supabase_client)
):
    """Convert a lead to a contact"""
    try:
        # Get the lead
        lead_response = supabase.table("leads").select("*").eq("id", str(lead_id)).single().execute()
        if not lead_response.data:
            raise HTTPException(status_code=404, detail=f"Lead with id {lead_id} not found")
        
        lead = lead_response.data
        
        # Check if already converted
        if lead.get("status") == "converted":
            raise HTTPException(status_code=400, detail="Lead is already converted")
        
        # Create contact from lead
        contact_data = {
            "name": lead["name"],
            "email": lead.get("email"),
            "phone": lead.get("phone"),
            "company": lead.get("company"),
            "program_type": lead.get("program"),
            "source": lead["source"],
            "custom_fields": lead.get("custom_fields", {})
        }
        
        contact_response = supabase.table("contacts").insert(contact_data).execute()
        if not contact_response.data:
            raise HTTPException(status_code=500, detail="Failed to create contact")
        
        contact = contact_response.data[0]
        
        # Update lead status and link to contact
        lead_update = {
            "status": "converted",
            "converted_to_contact_id": contact["id"],
            "converted_at": datetime.utcnow().isoformat()
        }
        
        supabase.table("leads").update(lead_update).eq("id", str(lead_id)).execute()
        
        result = {
            "message": "Lead converted successfully",
            "contact": contact,
            "lead_id": str(lead_id)
        }
        
        # Optionally create a deal
        if create_deal:
            # Get the first stage for new deals
            stages_response = supabase.table("deal_stages").select("id").order("pipeline_order").limit(1).execute()
            if stages_response.data:
                deal_data = {
                    "name": f"Deal for {lead['name']}",
                    "contact_id": contact["id"],
                    "lead_id": str(lead_id),
                    "deal_stage_id": stages_response.data[0]["id"]
                }
                
                deal_response = supabase.table("deals").insert(deal_data).execute()
                if deal_response.data:
                    result["deal"] = deal_response.data[0]
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error converting lead: {str(e)}")

@router.delete("/{lead_id}", status_code=204)
async def delete_lead(
    lead_id: UUID,
    supabase: Client = Depends(get_supabase_client)
):
    """Delete a lead"""
    try:
        response = supabase.table("leads").delete().eq("id", str(lead_id)).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail=f"Lead with id {lead_id} not found")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting lead: {str(e)}")

@router.get("/sources", response_model=List[dict])
async def get_lead_sources(
    supabase: Client = Depends(get_supabase_client)
):
    """Get all unique lead sources"""
    try:
        response = supabase.table("leads").select("source").execute()
        sources = list(set(item["source"] for item in response.data or [] if item.get("source")))
        return [{"name": source} for source in sorted(sources)]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching lead sources: {str(e)}")

@router.get("/stats", response_model=dict)
async def get_lead_stats(
    supabase: Client = Depends(get_supabase_client)
):
    """Get lead statistics"""
    try:
        # Get counts by status
        stats_response = supabase.table("leads").select("status").execute()
        
        stats = {
            "total": len(stats_response.data or []),
            "by_status": {}
        }
        
        for lead in stats_response.data or []:
            status = lead.get("status", "unknown")
            stats["by_status"][status] = stats["by_status"].get(status, 0) + 1
        
        # Calculate conversion rate
        converted = stats["by_status"].get("converted", 0)
        if stats["total"] > 0:
            stats["conversion_rate"] = converted / stats["total"]
        else:
            stats["conversion_rate"] = 0
        
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching lead stats: {str(e)}")