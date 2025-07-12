import os
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime, date
from decimal import Decimal

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
    prefix="/api/v1/deals",
    tags=["Deals"]
)

# Pydantic Models
class DealBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    value_amount: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = Field("USD", max_length=3)
    deal_stage_id: UUID
    contact_id: Optional[UUID] = None
    lead_id: Optional[UUID] = None
    probability: Optional[int] = Field(None, ge=0, le=100)
    expected_close_date: Optional[date] = None
    assigned_to: Optional[UUID] = None
    custom_fields: Optional[dict] = None

class DealCreate(DealBase):
    pass

class DealUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    value_amount: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = Field(None, max_length=3)
    deal_stage_id: Optional[UUID] = None
    contact_id: Optional[UUID] = None
    lead_id: Optional[UUID] = None
    probability: Optional[int] = Field(None, ge=0, le=100)
    expected_close_date: Optional[date] = None
    assigned_to: Optional[UUID] = None
    custom_fields: Optional[dict] = None

class DealRead(DealBase):
    id: UUID
    closed_at: Optional[datetime] = None
    close_reason: Optional[str] = None
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DealWithDetails(DealRead):
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    stage_name: Optional[str] = None
    assigned_to_name: Optional[str] = None

# API Endpoints

@router.get("", response_model=List[DealWithDetails])
async def list_deals(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of records to return"),
    stage_id: Optional[UUID] = Query(None, description="Filter by stage"),
    contact_id: Optional[UUID] = Query(None, description="Filter by contact"),
    assigned_to: Optional[UUID] = Query(None, description="Filter by assigned user"),
    search: Optional[str] = Query(None, description="Search by deal name"),
    supabase: Client = Depends(get_supabase_client)
):
    """List deals with pagination and filtering"""
    try:
        query = supabase.table("deals").select(
            """
            id, name, value_amount, currency, deal_stage_id, contact_id, lead_id,
            probability, expected_close_date, closed_at, close_reason, assigned_to,
            custom_fields, created_by, created_at, updated_at,
            contacts(name, email),
            deal_stages(name),
            user_profiles!deals_assigned_to_fkey(full_name)
            """
        )
        
        # Apply filters
        if stage_id:
            query = query.eq("deal_stage_id", str(stage_id))
        if contact_id:
            query = query.eq("contact_id", str(contact_id))
        if assigned_to:
            query = query.eq("assigned_to", str(assigned_to))
        if search:
            query = query.ilike("name", f"%{search}%")
        
        # Apply pagination and ordering
        query = query.order("created_at", desc=True).range(skip, skip + limit - 1)
        
        response = query.execute()
        
        # Transform the response to include nested data in flat structure
        deals = []
        for deal_data in response.data or []:
            deal = DealWithDetails(
                **{k: v for k, v in deal_data.items() if k not in ['contacts', 'deal_stages', 'user_profiles']},
                contact_name=deal_data.get('contacts', {}).get('name') if deal_data.get('contacts') else None,
                contact_email=deal_data.get('contacts', {}).get('email') if deal_data.get('contacts') else None,
                stage_name=deal_data.get('deal_stages', {}).get('name') if deal_data.get('deal_stages') else None,
                assigned_to_name=deal_data.get('user_profiles', {}).get('full_name') if deal_data.get('user_profiles') else None
            )
            deals.append(deal)
        
        return deals
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching deals: {str(e)}")

@router.get("/{deal_id}", response_model=DealWithDetails)
async def get_deal(
    deal_id: UUID,
    supabase: Client = Depends(get_supabase_client)
):
    """Get a single deal by ID"""
    try:
        response = supabase.table("deals").select(
            """
            id, name, value_amount, currency, deal_stage_id, contact_id, lead_id,
            probability, expected_close_date, closed_at, close_reason, assigned_to,
            custom_fields, created_by, created_at, updated_at,
            contacts(name, email),
            deal_stages(name),
            user_profiles!deals_assigned_to_fkey(full_name)
            """
        ).eq("id", str(deal_id)).single().execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail=f"Deal with id {deal_id} not found")
        
        deal_data = response.data
        deal = DealWithDetails(
            **{k: v for k, v in deal_data.items() if k not in ['contacts', 'deal_stages', 'user_profiles']},
            contact_name=deal_data.get('contacts', {}).get('name') if deal_data.get('contacts') else None,
            contact_email=deal_data.get('contacts', {}).get('email') if deal_data.get('contacts') else None,
            stage_name=deal_data.get('deal_stages', {}).get('name') if deal_data.get('deal_stages') else None,
            assigned_to_name=deal_data.get('user_profiles', {}).get('full_name') if deal_data.get('user_profiles') else None
        )
        
        return deal
        
    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=f"Deal with id {deal_id} not found")
        raise HTTPException(status_code=500, detail=f"Error fetching deal: {str(e)}")

@router.post("", response_model=DealRead, status_code=201)
async def create_deal(
    deal_data: DealCreate,
    supabase: Client = Depends(get_supabase_client)
):
    """Create a new deal"""
    try:
        # Prepare data for insertion
        deal_dict = deal_data.model_dump(exclude_unset=True)
        
        # Convert UUID fields to strings
        for field in ['deal_stage_id', 'contact_id', 'lead_id', 'assigned_to']:
            if deal_dict.get(field):
                deal_dict[field] = str(deal_dict[field])
        
        # Validate that the stage exists
        stage_response = supabase.table("deal_stages").select("id").eq("id", deal_dict["deal_stage_id"]).execute()
        if not stage_response.data:
            raise HTTPException(status_code=400, detail="Invalid deal stage ID")
        
        # Validate contact exists if provided
        if deal_dict.get("contact_id"):
            contact_response = supabase.table("contacts").select("id").eq("id", deal_dict["contact_id"]).execute()
            if not contact_response.data:
                raise HTTPException(status_code=400, detail="Invalid contact ID")
        
        response = supabase.table("deals").insert(deal_dict).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create deal")
            
        return DealRead(**response.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating deal: {str(e)}")

@router.patch("/{deal_id}", response_model=DealRead)
async def update_deal(
    deal_id: UUID,
    deal_data: DealUpdate,
    supabase: Client = Depends(get_supabase_client)
):
    """Update a deal"""
    try:
        # Get update data
        update_dict = deal_data.model_dump(exclude_unset=True)
        
        if not update_dict:
            raise HTTPException(status_code=400, detail="No update data provided")
        
        # Convert UUID fields to strings
        for field in ['deal_stage_id', 'contact_id', 'lead_id', 'assigned_to']:
            if update_dict.get(field):
                update_dict[field] = str(update_dict[field])
        
        # Validate stage exists if being updated
        if update_dict.get("deal_stage_id"):
            stage_response = supabase.table("deal_stages").select("id").eq("id", update_dict["deal_stage_id"]).execute()
            if not stage_response.data:
                raise HTTPException(status_code=400, detail="Invalid deal stage ID")
        
        response = supabase.table("deals").update(update_dict).eq("id", str(deal_id)).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail=f"Deal with id {deal_id} not found")
            
        return DealRead(**response.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating deal: {str(e)}")

@router.patch("/{deal_id}/move")
async def move_deal_to_stage(
    deal_id: UUID,
    stage_id: UUID,
    supabase: Client = Depends(get_supabase_client)
):
    """Move a deal to a different stage"""
    try:
        # Validate stage exists
        stage_response = supabase.table("deal_stages").select("id, name, is_won, is_lost").eq("id", str(stage_id)).execute()
        if not stage_response.data:
            raise HTTPException(status_code=400, detail="Invalid deal stage ID")
        
        stage_info = stage_response.data[0]
        update_data = {"deal_stage_id": str(stage_id)}
        
        # If moving to won/lost stage, set closed_at
        if stage_info.get("is_won") or stage_info.get("is_lost"):
            update_data["closed_at"] = datetime.utcnow().isoformat()
        
        response = supabase.table("deals").update(update_data).eq("id", str(deal_id)).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail=f"Deal with id {deal_id} not found")
            
        return {"message": f"Deal moved to {stage_info['name']}", "deal": DealRead(**response.data[0])}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error moving deal: {str(e)}")

@router.delete("/{deal_id}", status_code=204)
async def delete_deal(
    deal_id: UUID,
    supabase: Client = Depends(get_supabase_client)
):
    """Delete a deal"""
    try:
        response = supabase.table("deals").delete().eq("id", str(deal_id)).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail=f"Deal with id {deal_id} not found")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting deal: {str(e)}")

@router.get("/stages", response_model=List[dict])
async def get_deal_stages(
    supabase: Client = Depends(get_supabase_client)
):
    """Get all deal stages"""
    try:
        response = supabase.table("deal_stages").select("*").order("pipeline_order").execute()
        return response.data or []
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching deal stages: {str(e)}")