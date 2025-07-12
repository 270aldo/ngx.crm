import os
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from uuid import UUID, uuid4
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
    prefix="/api/v1/contacts",
    tags=["Contacts"]
)

# Pydantic Models
class ContactBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    company: Optional[str] = Field(None, max_length=255)
    position: Optional[str] = Field(None, max_length=255)
    program_type: Optional[str] = Field(None, pattern="^(PRIME|LONGEVITY|CUSTOM)$")
    source: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = Field("active", pattern="^(active|inactive|archived)$")
    tags: Optional[List[str]] = None
    custom_fields: Optional[dict] = None

class ContactCreate(ContactBase):
    pass

class ContactUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    company: Optional[str] = Field(None, max_length=255)
    position: Optional[str] = Field(None, max_length=255)
    program_type: Optional[str] = Field(None, pattern="^(PRIME|LONGEVITY|CUSTOM)$")
    source: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = Field(None, pattern="^(active|inactive|archived)$")
    tags: Optional[List[str]] = None
    custom_fields: Optional[dict] = None

class ContactRead(ContactBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UUID] = None

    class Config:
        from_attributes = True

# API Endpoints

@router.get("", response_model=List[ContactRead])
async def list_contacts(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of records to return"),
    search: Optional[str] = Query(None, description="Search by name, email, or company"),
    status: Optional[str] = Query(None, pattern="^(active|inactive|archived)$"),
    program_type: Optional[str] = Query(None, pattern="^(PRIME|LONGEVITY|CUSTOM)$"),
    supabase: Client = Depends(get_supabase_client)
):
    """List contacts with pagination and filtering"""
    try:
        query = supabase.table("contacts").select("*")
        
        # Apply filters
        if status:
            query = query.eq("status", status)
        if program_type:
            query = query.eq("program_type", program_type)
        if search:
            # Search across multiple fields
            query = query.or_(f"name.ilike.%{search}%,email.ilike.%{search}%,company.ilike.%{search}%")
        
        # Apply pagination and ordering
        query = query.order("created_at", desc=True).range(skip, skip + limit - 1)
        
        response = query.execute()
        return [ContactRead(**contact) for contact in response.data or []]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching contacts: {str(e)}")

@router.get("/{contact_id}", response_model=ContactRead)
async def get_contact(
    contact_id: UUID,
    supabase: Client = Depends(get_supabase_client)
):
    """Get a single contact by ID"""
    try:
        response = supabase.table("contacts").select("*").eq("id", str(contact_id)).single().execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail=f"Contact with id {contact_id} not found")
            
        return ContactRead(**response.data)
        
    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=f"Contact with id {contact_id} not found")
        raise HTTPException(status_code=500, detail=f"Error fetching contact: {str(e)}")

@router.post("", response_model=ContactRead, status_code=201)
async def create_contact(
    contact_data: ContactCreate,
    supabase: Client = Depends(get_supabase_client)
):
    """Create a new contact"""
    try:
        # Prepare data for insertion
        contact_dict = contact_data.model_dump(exclude_unset=True)
        
        # Check for duplicate email if provided
        if contact_dict.get("email"):
            existing = supabase.table("contacts").select("id").eq("email", contact_dict["email"]).execute()
            if existing.data:
                raise HTTPException(status_code=400, detail="Contact with this email already exists")
        
        response = supabase.table("contacts").insert(contact_dict).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create contact")
            
        return ContactRead(**response.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating contact: {str(e)}")

@router.patch("/{contact_id}", response_model=ContactRead)
async def update_contact(
    contact_id: UUID,
    contact_data: ContactUpdate,
    supabase: Client = Depends(get_supabase_client)
):
    """Update a contact"""
    try:
        # Get update data
        update_dict = contact_data.model_dump(exclude_unset=True)
        
        if not update_dict:
            raise HTTPException(status_code=400, detail="No update data provided")
            
        # Check for duplicate email if being updated
        if update_dict.get("email"):
            existing = supabase.table("contacts").select("id").eq("email", update_dict["email"]).neq("id", str(contact_id)).execute()
            if existing.data:
                raise HTTPException(status_code=400, detail="Another contact with this email already exists")
        
        response = supabase.table("contacts").update(update_dict).eq("id", str(contact_id)).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail=f"Contact with id {contact_id} not found")
            
        return ContactRead(**response.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating contact: {str(e)}")

@router.delete("/{contact_id}", status_code=204)
async def delete_contact(
    contact_id: UUID,
    supabase: Client = Depends(get_supabase_client)
):
    """Delete a contact"""
    try:
        # Check if contact has related records (deals, tasks, etc.)
        deals_response = supabase.table("deals").select("id").eq("contact_id", str(contact_id)).limit(1).execute()
        if deals_response.data:
            raise HTTPException(
                status_code=400, 
                detail="Cannot delete contact with associated deals. Please remove deals first."
            )
        
        response = supabase.table("contacts").delete().eq("id", str(contact_id)).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail=f"Contact with id {contact_id} not found")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting contact: {str(e)}")

@router.get("/{contact_id}/deals")
async def get_contact_deals(
    contact_id: UUID,
    supabase: Client = Depends(get_supabase_client)
):
    """Get all deals for a contact"""
    try:
        response = supabase.table("deals").select(
            "id, name, value_amount, deal_stage_id, created_at, closed_at, deal_stages(name)"
        ).eq("contact_id", str(contact_id)).order("created_at", desc=True).execute()
        
        return response.data or []
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching contact deals: {str(e)}")

@router.get("/{contact_id}/tasks")
async def get_contact_tasks(
    contact_id: UUID,
    supabase: Client = Depends(get_supabase_client)
):
    """Get all tasks for a contact"""
    try:
        response = supabase.table("tasks").select(
            "id, title, description, due_date, status, priority, created_at"
        ).eq("related_contact_id", str(contact_id)).order("due_date", desc=False).execute()
        
        return response.data or []
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching contact tasks: {str(e)}")

@router.get("/{contact_id}/interactions")
async def get_contact_interactions(
    contact_id: UUID,
    supabase: Client = Depends(get_supabase_client)
):
    """Get all interactions for a contact"""
    try:
        response = supabase.table("interactions").select(
            "id, type, channel, subject, summary, created_at"
        ).eq("contact_id", str(contact_id)).order("created_at", desc=True).execute()
        
        return response.data or []
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching contact interactions: {str(e)}")