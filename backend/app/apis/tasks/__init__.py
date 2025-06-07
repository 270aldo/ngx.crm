import os
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID, uuid4
from datetime import datetime

import databutton as db # To access secrets
from supabase import create_client, Client

# Initialize Supabase client
SUPABASE_URL = db.secrets.get("SUPABASE_URL")
SUPABASE_KEY = db.secrets.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    # This will help in debugging if secrets are not loaded correctly
    # In a production scenario, you might want to handle this more gracefully
    print("Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in secrets.")
    # Depending on your app's needs, you might raise an exception or have a fallback
    # For now, we'll allow it to proceed, but supabase client will be None
    supabase: Client | None = None
else:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

router = APIRouter(
    prefix="/api/v1/tasks",
    tags=["Tasks"]
)

# Pydantic Models
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = 'To Do'
    priority: Optional[str] = 'Medium'
    assigned_to_user_id: Optional[UUID] = None
    # created_by_user_id: UUID # This should likely be set based on the authenticated user
    related_lead_id: Optional[UUID] = None
    related_contact_id: Optional[UUID] = None
    related_deal_id: Optional[UUID] = None
    completed_at: Optional[datetime] = None

class TaskCreate(TaskBase):
    # In a real scenario, created_by_user_id would be extracted from JWT or similar
    # For now, let's make it optional or require it in the payload if not using auth context here
    created_by_user_id: Optional[UUID] = None # Example: Can be set by system or passed if no auth integration yet
    pass # Inherits all fields from TaskBase

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to_user_id: Optional[UUID] = None
    related_lead_id: Optional[UUID] = None
    related_contact_id: Optional[UUID] = None
    related_deal_id: Optional[UUID] = None
    completed_at: Optional[datetime] = None

class TaskRead(TaskBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    created_by_user_id: Optional[UUID] = None # Reflecting it was optional in TaskCreate for now

    class Config:
        from_attributes = True # For compatibility with ORM objects

# --- API Endpoints --- #

@router.post("", response_model=TaskRead)
async def create_task(task_data: TaskCreate):
    if supabase is None:
        raise HTTPException(status_code=500, detail="Supabase client not initialized. Check secrets.")
    
    # Prepare data for Supabase. Pydantic models can convert UUIDs to str for JSON.
    # Supabase client typically handles this, but good to be aware.
    # created_by_user_id would ideally come from authenticated user context
    # For now, it's part of TaskCreate or can be set to a default if needed.
    
    # We need to ensure all UUIDs are strings if they are not None
    task_dict = task_data.model_dump(exclude_unset=True) # exclude_unset to only include provided fields

    # Convert UUID fields to string for Supabase if they are present
    for key in ['assigned_to_user_id', 'created_by_user_id', 'related_lead_id', 'related_contact_id', 'related_deal_id']:
        if key in task_dict and task_dict[key] is not None:
            task_dict[key] = str(task_dict[key])

    # Convert datetime fields to ISO string for Supabase if they are present
    if 'due_date' in task_dict and task_dict['due_date'] is not None and isinstance(task_dict['due_date'], datetime):
        task_dict['due_date'] = task_dict['due_date'].isoformat()
    if 'completed_at' in task_dict and task_dict['completed_at'] is not None and isinstance(task_dict['completed_at'], datetime):
        task_dict['completed_at'] = task_dict['completed_at'].isoformat()

    # Generate ID and timestamps manually for now, though Supabase can do this
    # task_dict['id'] = uuid4() # Supabase handles id generation if column has default gen_random_uuid()
    # task_dict['created_at'] = datetime.utcnow()
    # task_dict['updated_at'] = datetime.utcnow()
    # The DB schema has defaults for id, created_at, updated_at, so we don't need to set them here.

    try:
        response = supabase.table("tasks").insert(task_dict).execute()
    except Exception as e:
        print(f"Supabase error: {e}") # Log the detailed error
        raise HTTPException(status_code=500, detail=f"Error creating task in Supabase: {str(e)}") from e

    if not response.data:
        # This condition might need adjustment based on actual Supabase client behavior for errors
        # print(f"Supabase response error details: {response.error}") # Log Supabase specific error if available
        error_detail = "Failed to create task, no data returned."
        if hasattr(response, 'error') and response.error:
            error_detail = f"Failed to create task: {response.error.message if response.error.message else 'Unknown Supabase error'}"
        raise HTTPException(status_code=400, detail=error_detail)
    
    # Assuming the first item in data is the created task
    created_task_data = response.data[0]
    
    # Convert to TaskRead model. This helps validate the response from DB and structure it.
    # Supabase returns string UUIDs, Pydantic can parse them back to UUID objects.
    return TaskRead(**created_task_data)

# Placeholder for other endpoints (GET, PATCH, DELETE)

@router.get("", response_model=List[TaskRead])
async def list_tasks(
    status: Optional[str] = None,
    assigned_to_user_id: Optional[UUID] = None,
    related_lead_id: Optional[UUID] = None,
    related_contact_id: Optional[UUID] = None,
    related_deal_id: Optional[UUID] = None,
    limit: int = 20, # Default limit to 20 tasks
    offset: int = 0, # Default offset to 0
):
    if supabase is None:
        raise HTTPException(status_code=500, detail="Supabase client not initialized. Check secrets.")

    query = supabase.table("tasks").select("*")

    if status:
        query = query.eq("status", status)
    if assigned_to_user_id:
        query = query.eq("assigned_to_user_id", str(assigned_to_user_id))
    if related_lead_id:
        query = query.eq("related_lead_id", str(related_lead_id))
    if related_contact_id:
        query = query.eq("related_contact_id", str(related_contact_id))
    if related_deal_id:
        query = query.eq("related_deal_id", str(related_deal_id))
    
    query = query.limit(limit).offset(offset).order("created_at", desc=True) # Order by creation date, newest first

    try:
        response = query.execute()
    except Exception as e:
        print(f"Supabase error: {e}")
        raise HTTPException(status_code=500, detail=f"Error listing tasks from Supabase: {str(e)}") from e

    if not response.data:
        # It's okay to return an empty list if no tasks match the criteria
        return []

    # Convert list of dicts to list of TaskRead models
    tasks = [TaskRead(**task_data) for task_data in response.data]
    return tasks

@router.get("/{task_id}", response_model=TaskRead)
async def get_task(task_id: UUID):
    if supabase is None:
        raise HTTPException(status_code=500, detail="Supabase client not initialized. Check secrets.")

    try:
        response = supabase.table("tasks").select("*").eq("id", str(task_id)).single().execute()
    except Exception as e:
        print(f"Supabase error: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching task from Supabase: {str(e)}") from e

    if not response.data:
        raise HTTPException(status_code=404, detail=f"Task with id {task_id} not found")

    return TaskRead(**response.data)

@router.patch("/{task_id}", response_model=TaskRead)
async def update_task(task_id: UUID, task_update_data: TaskUpdate):
    if supabase is None:
        raise HTTPException(status_code=500, detail="Supabase client not initialized. Check secrets.")

    update_data_dict = task_update_data.model_dump(exclude_unset=True) # Only include fields that were actually provided

    if not update_data_dict:
        raise HTTPException(status_code=400, detail="No update data provided.")

    # Convert UUID fields to string for Supabase if they are present
    for key in ['assigned_to_user_id', 'related_lead_id', 'related_contact_id', 'related_deal_id']:
        if key in update_data_dict and update_data_dict[key] is not None:
            update_data_dict[key] = str(update_data_dict[key])

    # Convert datetime fields to ISO string for Supabase if they are present
    if 'due_date' in update_data_dict and update_data_dict['due_date'] is not None and isinstance(update_data_dict['due_date'], datetime):
        update_data_dict['due_date'] = update_data_dict['due_date'].isoformat()
    if 'completed_at' in update_data_dict and update_data_dict['completed_at'] is not None and isinstance(update_data_dict['completed_at'], datetime):
        update_data_dict['completed_at'] = update_data_dict['completed_at'].isoformat()
    
    # Add updated_at timestamp
    # update_data_dict['updated_at'] = datetime.utcnow() # The DB trigger handles this

    try:
        response = supabase.table("tasks").update(update_data_dict).eq("id", str(task_id)).execute()
    except Exception as e:
        print(f"Supabase error: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating task in Supabase: {str(e)}") from e

    if not response.data:
        # This could mean the task_id was not found, or other issues.
        # Supabase update usually returns data even if no rows matched, but let's be safe.
        # We should ideally check if the task exists first or rely on RLS to prevent unauthorized access.
        raise HTTPException(status_code=404, detail=f"Task with id {task_id} not found or no changes made.")

    return TaskRead(**response.data[0])

@router.delete("/{task_id}", status_code=204) # 204 No Content is typical for successful DELETE
async def delete_task(task_id: UUID):
    if supabase is None:
        raise HTTPException(status_code=500, detail="Supabase client not initialized. Check secrets.")

    try:
        # First, check if the task exists to provide a 404 if not found
        # Though Supabase delete won't error if ID doesn't exist, it's good practice for APIs.
        # However, for simplicity and to rely on RLS, we can directly attempt delete.
        # If RLS prevents deletion of a non-owned/non-visible task, Supabase might return empty data or an error.
        
        response = supabase.table("tasks").delete().eq("id", str(task_id)).execute()
    except Exception as e:
        print(f"Supabase error: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting task from Supabase: {str(e)}") from e

    # Check if any data was returned, which implies a row was deleted.
    # Supabase delete operation might return data of the deleted row(s).
    # If response.data is empty, it could mean the task_id was not found.
    if not response.data:
        # This check might need to be more robust depending on Supabase client exact behavior for deletes of non-existent IDs.
        # For now, if no data comes back, we assume it wasn't found or an RLS policy prevented it.
        raise HTTPException(status_code=404, detail=f"Task with id {task_id} not found or could not be deleted.")

    return # FastAPI will return 204 No Content due to status_code in decorator
