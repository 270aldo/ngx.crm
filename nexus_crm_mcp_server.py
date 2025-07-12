#!/usr/bin/env python3
"""
NexusCRM MCP Server
Model Context Protocol server for NGX CRM system integration with Claude Desktop

This server exposes NexusCRM functionality as MCP tools, resources, and prompts,
allowing Claude to interact naturally with the CRM using conversational language.

Author: Claude AI Assistant
Created for: NGX Team
Version: 1.0.0
"""

import os
import json
import asyncio
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Union
from uuid import UUID, uuid4

from fastmcp import FastMCP
from pydantic import BaseModel, Field, EmailStr
from supabase import create_client, Client

# Initialize FastMCP server
mcp = FastMCP(
    name="NexusCRM",
    description="NGX CRM system integration for contact management, deals pipeline, leads tracking, and analytics"
)

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")

# Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# =====================================
# PYDANTIC MODELS FOR TYPE VALIDATION
# =====================================

class ContactInput(BaseModel):
    """Input model for creating/updating contacts"""
    name: str = Field(..., description="Full name of the contact")
    email: Optional[EmailStr] = Field(None, description="Email address")
    phone: Optional[str] = Field(None, description="Phone number")
    company: Optional[str] = Field(None, description="Company name")

class AgentUsageQuery(BaseModel):
    """Input model for agent usage queries"""
    user_id: Optional[str] = Field(None, description="Specific user ID to query")
    agent_id: Optional[str] = Field(None, description="Specific agent ID (NEXUS, BLAZE, SAGE, etc.)")
    subscription_tier: Optional[str] = Field(None, description="Filter by subscription tier")
    days: int = Field(7, description="Number of days to look back", ge=1, le=90)
    limit: int = Field(50, description="Maximum number of results", ge=1, le=1000)

class AlertInput(BaseModel):
    """Input model for alert management"""
    alert_id: str = Field(..., description="ID of the alert to manage")
    action: str = Field(..., description="Action to take: acknowledge, resolve, dismiss")
    position: Optional[str] = Field(None, description="Job position/title")
    program_type: Optional[str] = Field(None, description="NGX program type: PRIME, LONGEVITY, or CUSTOM")
    source: Optional[str] = Field(None, description="Lead source (Website, Referral, LinkedIn, etc.)")
    status: Optional[str] = Field("active", description="Contact status: active, inactive, or archived")
    tags: Optional[List[str]] = Field(None, description="Tags for categorization")

class DealInput(BaseModel):
    """Input model for creating/updating deals"""
    name: str = Field(..., description="Deal name/title")
    value_amount: Optional[float] = Field(None, description="Deal value in dollars")
    contact_id: Optional[str] = Field(None, description="Associated contact ID")
    probability: Optional[int] = Field(None, description="Success probability (0-100)")
    expected_close_date: Optional[str] = Field(None, description="Expected close date (YYYY-MM-DD)")
    stage: Optional[str] = Field(None, description="Deal stage name")

class LeadInput(BaseModel):
    """Input model for creating/updating leads"""
    name: str = Field(..., description="Lead name")
    email: Optional[EmailStr] = Field(None, description="Email address")
    phone: Optional[str] = Field(None, description="Phone number")
    company: Optional[str] = Field(None, description="Company name")
    source: str = Field(..., description="Lead source")
    program: Optional[str] = Field(None, description="Interested program")
    score: Optional[int] = Field(0, description="Lead score (0-100)")
    notes: Optional[str] = Field(None, description="Additional notes")

class TaskInput(BaseModel):
    """Input model for creating/updating tasks"""
    title: str = Field(..., description="Task title")
    description: Optional[str] = Field(None, description="Task description")
    due_date: Optional[str] = Field(None, description="Due date (YYYY-MM-DD)")
    priority: Optional[str] = Field("Medium", description="Priority: Low, Medium, High, Urgent")
    assigned_to: Optional[str] = Field(None, description="User ID to assign task to")
    contact_id: Optional[str] = Field(None, description="Related contact ID")

# =====================================
# UTILITY FUNCTIONS
# =====================================

def format_contact_data(contact: Dict[str, Any]) -> str:
    """Format contact data for display"""
    return f"""
📋 Contact: {contact.get('name', 'N/A')}
🏢 Company: {contact.get('company', 'N/A')}
📧 Email: {contact.get('email', 'N/A')}
📞 Phone: {contact.get('phone', 'N/A')}
🎯 Program: {contact.get('program_type', 'N/A')}
📍 Source: {contact.get('source', 'N/A')}
🏷️ Tags: {', '.join(contact.get('tags', []))}
📅 Created: {contact.get('created_at', 'N/A')}
"""

def format_deal_data(deal: Dict[str, Any]) -> str:
    """Format deal data for display"""
    return f"""
💼 Deal: {deal.get('name', 'N/A')}
💰 Value: ${deal.get('value_amount', 0):,.2f}
📊 Probability: {deal.get('probability', 0)}%
📅 Close Date: {deal.get('expected_close_date', 'N/A')}
🎯 Stage: {deal.get('stage_name', 'N/A')}
👤 Contact: {deal.get('contact_name', 'N/A')}
"""

def format_lead_data(lead: Dict[str, Any]) -> str:
    """Format lead data for display"""
    return f"""
🎯 Lead: {lead.get('name', 'N/A')}
🏢 Company: {lead.get('company', 'N/A')}
📧 Email: {lead.get('email', 'N/A')}
📍 Source: {lead.get('source', 'N/A')}
⭐ Score: {lead.get('score', 0)}/100
📝 Status: {lead.get('status', 'N/A')}
📅 Created: {lead.get('created_at', 'N/A')}
"""

# =====================================
# MCP TOOLS (EXECUTABLE FUNCTIONS)
# =====================================

@mcp.tool
def create_contact(contact: ContactInput) -> str:
    """
    Create a new contact in the NGX CRM system.
    Use this to add new potential clients, customers, or business contacts.
    """
    try:
        # Prepare contact data
        contact_data = {
            "id": str(uuid4()),
            "name": contact.name,
            "email": contact.email,
            "phone": contact.phone,
            "company": contact.company,
            "position": contact.position,
            "program_type": contact.program_type,
            "source": contact.source,
            "status": contact.status or "active",
            "tags": contact.tags or [],
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Insert into Supabase
        result = supabase.table("contacts").insert(contact_data).execute()
        
        if result.data:
            return f"✅ Contact created successfully!\n{format_contact_data(result.data[0])}"
        else:
            return "❌ Failed to create contact. Please check the data and try again."
            
    except Exception as e:
        return f"❌ Error creating contact: {str(e)}"

@mcp.tool
def search_contacts(
    query: Optional[str] = None,
    company: Optional[str] = None,
    program_type: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 10
) -> str:
    """
    Search for contacts in the CRM system using various filters.
    Use this to find specific contacts or browse the contact database.
    """
    try:
        # Build query
        db_query = supabase.table("contacts").select("*")
        
        # Apply filters
        if query:
            # Search in name, email, or company
            db_query = db_query.or_(f"name.ilike.%{query}%,email.ilike.%{query}%,company.ilike.%{query}%")
        
        if company:
            db_query = db_query.ilike("company", f"%{company}%")
            
        if program_type:
            db_query = db_query.eq("program_type", program_type)
            
        if status:
            db_query = db_query.eq("status", status)
        
        # Execute query with limit
        result = db_query.limit(limit).execute()
        
        if result.data:
            contacts_list = []
            for contact in result.data:
                contacts_list.append(format_contact_data(contact))
            
            return f"📋 Found {len(result.data)} contact(s):\n\n" + "\n---\n".join(contacts_list)
        else:
            return "📭 No contacts found matching your criteria."
            
    except Exception as e:
        return f"❌ Error searching contacts: {str(e)}"

@mcp.tool
def update_contact(contact_id: str, updates: ContactInput) -> str:
    """
    Update an existing contact's information.
    Use this to modify contact details, change status, or update program assignments.
    """
    try:
        # Prepare update data (only non-None fields)
        update_data = {}
        for field, value in updates.dict(exclude_unset=True).items():
            if value is not None:
                update_data[field] = value
        
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        # Update in Supabase
        result = supabase.table("contacts").update(update_data).eq("id", contact_id).execute()
        
        if result.data:
            return f"✅ Contact updated successfully!\n{format_contact_data(result.data[0])}"
        else:
            return f"❌ Contact with ID {contact_id} not found."
            
    except Exception as e:
        return f"❌ Error updating contact: {str(e)}"

@mcp.tool
def create_deal(deal: DealInput) -> str:
    """
    Create a new deal/opportunity in the sales pipeline.
    Use this to track potential sales and revenue opportunities.
    """
    try:
        # Get default stage if not specified
        stage_id = None
        if deal.stage:
            stage_result = supabase.table("deal_stages").select("id").eq("name", deal.stage).execute()
            if stage_result.data:
                stage_id = stage_result.data[0]["id"]
        
        if not stage_id:
            # Get first stage as default
            default_stage = supabase.table("deal_stages").select("id").order("pipeline_order").limit(1).execute()
            if default_stage.data:
                stage_id = default_stage.data[0]["id"]
        
        # Prepare deal data
        deal_data = {
            "id": str(uuid4()),
            "name": deal.name,
            "value_amount": deal.value_amount,
            "contact_id": deal.contact_id,
            "deal_stage_id": stage_id,
            "probability": deal.probability or 10,
            "expected_close_date": deal.expected_close_date,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Insert into Supabase
        result = supabase.table("deals").insert(deal_data).execute()
        
        if result.data:
            return f"✅ Deal created successfully!\n{format_deal_data(result.data[0])}"
        else:
            return "❌ Failed to create deal. Please check the data and try again."
            
    except Exception as e:
        return f"❌ Error creating deal: {str(e)}"

@mcp.tool
def get_pipeline_status(stage: Optional[str] = None) -> str:
    """
    Get the current status of the sales pipeline.
    Use this to see all deals, their stages, and pipeline health.
    """
    try:
        # Build query for deals with stage information
        query = supabase.table("deals").select("""
            *,
            deal_stages(name, pipeline_order),
            contacts(name)
        """)
        
        if stage:
            query = query.eq("deal_stages.name", stage)
        
        result = query.execute()
        
        if result.data:
            # Group deals by stage
            stages = {}
            total_value = 0
            
            for deal in result.data:
                stage_name = deal.get("deal_stages", {}).get("name", "Unknown")
                if stage_name not in stages:
                    stages[stage_name] = {"deals": [], "total_value": 0, "count": 0}
                
                stages[stage_name]["deals"].append(deal)
                stages[stage_name]["count"] += 1
                if deal.get("value_amount"):
                    stages[stage_name]["total_value"] += deal["value_amount"]
                    total_value += deal["value_amount"]
            
            # Format pipeline report
            pipeline_report = f"📊 **NGX SALES PIPELINE REPORT**\n"
            pipeline_report += f"💰 Total Pipeline Value: ${total_value:,.2f}\n"
            pipeline_report += f"📈 Total Deals: {len(result.data)}\n\n"
            
            for stage_name, stage_data in stages.items():
                pipeline_report += f"🎯 **{stage_name}**\n"
                pipeline_report += f"   💼 Deals: {stage_data['count']}\n"
                pipeline_report += f"   💰 Value: ${stage_data['total_value']:,.2f}\n\n"
                
                for deal in stage_data["deals"][:3]:  # Show top 3 deals per stage
                    contact_name = deal.get("contacts", {}).get("name", "No contact") if deal.get("contacts") else "No contact"
                    pipeline_report += f"   • {deal['name']} - ${deal.get('value_amount', 0):,.2f} ({contact_name})\n"
                
                if len(stage_data["deals"]) > 3:
                    pipeline_report += f"   ... and {len(stage_data['deals']) - 3} more\n"
                pipeline_report += "\n"
            
            return pipeline_report
        else:
            return "📭 No deals found in the pipeline."
            
    except Exception as e:
        return f"❌ Error getting pipeline status: {str(e)}"

@mcp.tool
def move_deal_stage(deal_id: str, new_stage: str) -> str:
    """
    Move a deal to a different stage in the sales pipeline.
    Use this to progress deals through the sales process.
    """
    try:
        # Get stage ID
        stage_result = supabase.table("deal_stages").select("id").eq("name", new_stage).execute()
        
        if not stage_result.data:
            return f"❌ Stage '{new_stage}' not found. Available stages: Lead Qualification, Needs Analysis, Proposal Sent, Negotiation, Closed Won, Closed Lost"
        
        stage_id = stage_result.data[0]["id"]
        
        # Update deal
        result = supabase.table("deals").update({
            "deal_stage_id": stage_id,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", deal_id).execute()
        
        if result.data:
            return f"✅ Deal moved to '{new_stage}' successfully!"
        else:
            return f"❌ Deal with ID {deal_id} not found."
            
    except Exception as e:
        return f"❌ Error moving deal: {str(e)}"

@mcp.tool
def create_lead(lead: LeadInput) -> str:
    """
    Create a new lead in the CRM system.
    Use this to capture potential customers who have shown interest.
    """
    try:
        # Prepare lead data
        lead_data = {
            "id": str(uuid4()),
            "name": lead.name,
            "email": lead.email,
            "phone": lead.phone,
            "company": lead.company,
            "source": lead.source,
            "program": lead.program,
            "status": "new",
            "score": lead.score or 0,
            "notes": lead.notes,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Insert into Supabase
        result = supabase.table("leads").insert(lead_data).execute()
        
        if result.data:
            return f"✅ Lead created successfully!\n{format_lead_data(result.data[0])}"
        else:
            return "❌ Failed to create lead. Please check the data and try again."
            
    except Exception as e:
        return f"❌ Error creating lead: {str(e)}"

@mcp.tool
def convert_lead_to_contact(lead_id: str) -> str:
    """
    Convert a qualified lead into a contact.
    Use this when a lead is ready to become an active contact.
    """
    try:
        # Get lead data
        lead_result = supabase.table("leads").select("*").eq("id", lead_id).execute()
        
        if not lead_result.data:
            return f"❌ Lead with ID {lead_id} not found."
        
        lead = lead_result.data[0]
        
        # Create contact from lead
        contact_data = {
            "id": str(uuid4()),
            "name": lead["name"],
            "email": lead["email"],
            "phone": lead["phone"],
            "company": lead["company"],
            "program_type": lead.get("program"),
            "source": lead["source"],
            "status": "active",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Insert contact
        contact_result = supabase.table("contacts").insert(contact_data).execute()
        
        if contact_result.data:
            # Update lead as converted
            supabase.table("leads").update({
                "status": "converted",
                "converted_to_contact_id": contact_result.data[0]["id"],
                "converted_at": datetime.utcnow().isoformat()
            }).eq("id", lead_id).execute()
            
            return f"✅ Lead converted to contact successfully!\n{format_contact_data(contact_result.data[0])}"
        else:
            return "❌ Failed to convert lead to contact."
            
    except Exception as e:
        return f"❌ Error converting lead: {str(e)}"

@mcp.tool
def create_task(task: TaskInput) -> str:
    """
    Create a new task in the CRM system.
    Use this to assign follow-ups, reminders, or action items.
    """
    try:
        # Prepare task data
        task_data = {
            "id": str(uuid4()),
            "title": task.title,
            "description": task.description,
            "due_date": task.due_date,
            "status": "To Do",
            "priority": task.priority or "Medium",
            "assigned_to_user_id": task.assigned_to,
            "related_contact_id": task.contact_id,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Insert into Supabase
        result = supabase.table("tasks").insert(task_data).execute()
        
        if result.data:
            return f"✅ Task created successfully!\n📋 Task: {task.title}\n⏰ Due: {task.due_date or 'No due date'}\n🎯 Priority: {task.priority}\n📝 Status: To Do"
        else:
            return "❌ Failed to create task. Please check the data and try again."
            
    except Exception as e:
        return f"❌ Error creating task: {str(e)}"

@mcp.tool
def get_analytics_summary() -> str:
    """
    Get a comprehensive analytics summary of the CRM performance.
    Use this to understand business metrics, conversion rates, and performance KPIs.
    """
    try:
        # Get various metrics
        contacts_result = supabase.table("contacts").select("id, status, program_type, created_at").execute()
        leads_result = supabase.table("leads").select("id, status, score, created_at").execute()
        deals_result = supabase.table("deals").select("id, value_amount, deal_stage_id, created_at").execute()
        tasks_result = supabase.table("tasks").select("id, status, priority, created_at").execute()
        
        # Calculate metrics
        total_contacts = len(contacts_result.data) if contacts_result.data else 0
        active_contacts = len([c for c in contacts_result.data if c.get("status") == "active"]) if contacts_result.data else 0
        
        total_leads = len(leads_result.data) if leads_result.data else 0
        converted_leads = len([l for l in leads_result.data if l.get("status") == "converted"]) if leads_result.data else 0
        
        total_deals = len(deals_result.data) if deals_result.data else 0
        total_deal_value = sum([d.get("value_amount", 0) for d in deals_result.data]) if deals_result.data else 0
        
        total_tasks = len(tasks_result.data) if tasks_result.data else 0
        completed_tasks = len([t for t in tasks_result.data if t.get("status") == "Done"]) if tasks_result.data else 0
        
        # Calculate conversion rate
        conversion_rate = (converted_leads / total_leads * 100) if total_leads > 0 else 0
        
        # Format analytics report
        report = f"""
📊 **NGX CRM ANALYTICS DASHBOARD**
📅 Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

👥 **CONTACTS**
   Total: {total_contacts}
   Active: {active_contacts}
   Inactive: {total_contacts - active_contacts}

🎯 **LEADS**
   Total: {total_leads}
   Converted: {converted_leads}
   Conversion Rate: {conversion_rate:.1f}%

💼 **DEALS**
   Total: {total_deals}
   Pipeline Value: ${total_deal_value:,.2f}
   Avg Deal Size: ${(total_deal_value / total_deals):,.2f if total_deals > 0 else 0}

✅ **TASKS**
   Total: {total_tasks}
   Completed: {completed_tasks}
   Completion Rate: {(completed_tasks / total_tasks * 100):.1f}% if total_tasks > 0 else 0%

📈 **PROGRAM BREAKDOWN**
"""
        
        # Add program breakdown
        if contacts_result.data:
            programs = {}
            for contact in contacts_result.data:
                program = contact.get("program_type", "Not Specified")
                programs[program] = programs.get(program, 0) + 1
            
            for program, count in programs.items():
                report += f"   {program}: {count}\n"
        
        return report
        
    except Exception as e:
        return f"❌ Error generating analytics: {str(e)}"

# =====================================
# MCP RESOURCES (READABLE DATA)
# =====================================

@mcp.resource("contacts://recent")
def get_recent_contacts() -> str:
    """Get the 10 most recently created contacts"""
    try:
        result = supabase.table("contacts").select("*").order("created_at", desc=True).limit(10).execute()
        
        if result.data:
            contacts_list = []
            for contact in result.data:
                contacts_list.append(format_contact_data(contact))
            return "📋 **RECENT CONTACTS**\n\n" + "\n---\n".join(contacts_list)
        else:
            return "📭 No recent contacts found."
    except Exception as e:
        return f"❌ Error fetching recent contacts: {str(e)}"

@mcp.resource("deals://pipeline")
def get_pipeline_overview() -> str:
    """Get current deals pipeline overview"""
    try:
        result = supabase.table("deals").select("""
            *,
            deal_stages(name, pipeline_order),
            contacts(name)
        """).order("deal_stages(pipeline_order)").execute()
        
        if result.data:
            deals_list = []
            for deal in result.data:
                deal_info = deal.copy()
                deal_info["stage_name"] = deal.get("deal_stages", {}).get("name", "Unknown")
                deal_info["contact_name"] = deal.get("contacts", {}).get("name", "No contact") if deal.get("contacts") else "No contact"
                deals_list.append(format_deal_data(deal_info))
            return "💼 **DEALS PIPELINE**\n\n" + "\n---\n".join(deals_list)
        else:
            return "📭 No deals in pipeline."
    except Exception as e:
        return f"❌ Error fetching pipeline: {str(e)}"

@mcp.resource("leads://queue")
def get_leads_queue() -> str:
    """Get current leads queue requiring attention"""
    try:
        result = supabase.table("leads").select("*").eq("status", "new").order("score", desc=True).limit(15).execute()
        
        if result.data:
            leads_list = []
            for lead in result.data:
                leads_list.append(format_lead_data(lead))
            return "🎯 **LEADS QUEUE (New Leads)**\n\n" + "\n---\n".join(leads_list)
        else:
            return "📭 No new leads in queue."
    except Exception as e:
        return f"❌ Error fetching leads queue: {str(e)}"

@mcp.resource("tasks://pending")
def get_pending_tasks() -> str:
    """Get pending tasks requiring attention"""
    try:
        result = supabase.table("tasks").select("""
            *,
            contacts(name)
        """).neq("status", "Done").order("due_date").limit(20).execute()
        
        if result.data:
            tasks_list = []
            for task in result.data:
                contact_name = task.get("contacts", {}).get("name", "No contact") if task.get("contacts") else "No contact"
                task_info = f"""
📋 Task: {task.get('title', 'N/A')}
🎯 Priority: {task.get('priority', 'N/A')}
📅 Due: {task.get('due_date', 'No due date')}
📝 Status: {task.get('status', 'N/A')}
👤 Contact: {contact_name}
"""
                tasks_list.append(task_info)
            return "✅ **PENDING TASKS**\n\n" + "\n---\n".join(tasks_list)
        else:
            return "✨ No pending tasks found. Great job team!"
    except Exception as e:
        return f"❌ Error fetching pending tasks: {str(e)}"

# =====================================
# MCP PROMPTS (AUTOMATION TEMPLATES)
# =====================================

@mcp.prompt("daily_crm_report")
def generate_daily_report() -> str:
    """Generate a comprehensive daily CRM report for the NGX team"""
    return f"""
You are an AI assistant helping the NGX team with their daily CRM report. Please:

1. **Get Today's Overview**: Use get_analytics_summary() to get current metrics
2. **Check Pipeline Status**: Use get_pipeline_status() to review all deals
3. **Review New Leads**: Check leads://queue resource for new leads requiring attention
4. **Review Pending Tasks**: Check tasks://pending resource for overdue or urgent tasks

Then create a comprehensive daily report including:
- Key metrics and KPIs
- Pipeline health and deal progress
- New leads that need immediate attention
- Critical tasks requiring follow-up
- Recommendations for today's priorities

Format the report in a professional, actionable manner for the NGX team meeting.
"""

@mcp.prompt("lead_follow_up")
def generate_lead_followup(lead_name: str) -> str:
    """Generate a personalized follow-up strategy for a specific lead"""
    return f"""
You are helping the NGX team create a follow-up strategy for lead: {lead_name}

Please:

1. **Find the Lead**: Use search_contacts() to find information about {lead_name}
2. **Analyze Lead Data**: Review their score, source, company, and interaction history
3. **Create Follow-up Plan**: Based on their profile and NGX programs (PRIME, LONGEVITY, CUSTOM)

Generate a personalized follow-up strategy including:
- Recommended next actions
- Timeline for follow-up
- Suggested NGX program alignment
- Key talking points
- Task assignments for the team

Make it specific and actionable for the NGX sales process.
"""

@mcp.prompt("deal_forecast")
def generate_deal_forecast() -> str:
    """Generate a sales forecast based on current pipeline"""
    return f"""
You are creating a sales forecast for the NGX team. Please:

1. **Analyze Pipeline**: Use get_pipeline_status() to get all deals and their stages
2. **Calculate Projections**: Based on deal values, probabilities, and close dates
3. **Assess Pipeline Health**: Identify bottlenecks and opportunities

Create a forecast report including:
- Monthly/quarterly revenue projections
- Probability-weighted pipeline value
- Deals likely to close this month
- At-risk deals requiring attention
- Pipeline health assessment
- Recommendations for hitting targets

Focus on actionable insights for the NGX leadership team.
"""

@mcp.prompt("contact_summary")
def generate_contact_summary(contact_name: str) -> str:
    """Generate a comprehensive summary for a specific contact"""
    return f"""
You are preparing a comprehensive summary for contact: {contact_name}

Please:

1. **Find Contact**: Use search_contacts() to locate {contact_name}
2. **Gather Related Data**: Look for associated deals, tasks, and interaction history
3. **Analyze Relationship**: Review their engagement with NGX programs

Create a detailed contact summary including:
- Contact profile and company information
- NGX program engagement (PRIME, LONGEVITY, CUSTOM)
- Deal history and current opportunities
- Recent interactions and notes
- Pending tasks and follow-ups
- Relationship strength assessment
- Next best actions

Make it comprehensive for account management purposes.
"""

# =====================================
# 🚀 AGENT USAGE ANALYTICS TOOLS
# =====================================

@mcp.tool()
def get_agent_usage_insights(query: AgentUsageQuery) -> str:
    """
    Get comprehensive insights about agent usage from GENESIS platform.
    
    This tool provides detailed analytics about how customers are using
    the NGX HIE (Hybrid Intelligence Engine) agents.
    """
    try:
        import requests
        from datetime import datetime, timedelta
        
        # Build query parameters
        params = {
            'days': query.days,
            'limit': query.limit
        }
        
        if query.user_id:
            params['user_filter'] = query.user_id
        if query.agent_id:
            params['agent_filter'] = query.agent_id
        if query.subscription_tier:
            params['tier_filter'] = query.subscription_tier
        
        # Make request to analytics API
        response = requests.get(
            'http://localhost:8001/agent-usage/analytics/summary',
            params=params,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            
            # Format the response
            report = f"""
🤖 **AGENT USAGE ANALYTICS** ({query.days} days)

📊 **Overview:**
• Total Interactions: {data.get('total_interactions', 0):,}
• Total Tokens Used: {data.get('total_tokens', 0):,}
• Active Users: {data.get('active_users', 0):,}
• Avg Response Time: {data.get('avg_response_time', 0):.0f}ms

🎯 **Top Agents:**"""
            
            for agent_id, stats in data.get('agent_stats', {}).items():
                report += f"""
• {agent_id}: {stats.get('interactions', 0):,} interactions, {stats.get('tokens', 0):,} tokens"""
            
            report += f"""

📈 **By Subscription Tier:**"""
            
            for tier, stats in data.get('tier_stats', {}).items():
                report += f"""
• {tier.upper()}: {stats.get('interactions', 0):,} interactions, {stats.get('users', 0)} users"""
            
            if query.user_id:
                # Get specific user insights
                user_response = requests.get(
                    f'http://localhost:8001/agent-usage/stats/{query.user_id}',
                    timeout=10
                )
                
                if user_response.status_code == 200:
                    user_data = user_response.json()
                    report += f"""

👤 **User Insights for {query.user_id}:**
• Subscription Tier: {user_data.get('subscription_tier', 'Unknown').upper()}
• Total Interactions: {user_data.get('total_interactions', 0):,}
• Total Tokens: {user_data.get('total_tokens', 0):,}
• Usage Percentage: {user_data.get('usage_percentage', {}).get('tokens', 0):.1f}% of limit
• Agents Used: {', '.join(user_data.get('agents_used', []))}"""
            
            return report
            
        else:
            return f"❌ Error fetching agent usage data: {response.status_code}"
            
    except Exception as e:
        return f"❌ Error getting agent usage insights: {str(e)}"

@mcp.tool()
def get_usage_alerts() -> str:
    """
    Get current usage alerts and limit warnings for all customers.
    
    Shows customers approaching or exceeding their usage limits,
    churn risk alerts, and upgrade opportunities.
    """
    try:
        import requests
        
        # Get active alerts
        response = requests.get(
            'http://localhost:8001/agent-usage/alerts/active',
            timeout=10
        )
        
        if response.status_code == 200:
            alerts = response.json()
            
            if not alerts:
                return "✅ **NO ACTIVE ALERTS** - All customers within normal usage patterns!"
            
            report = f"🚨 **ACTIVE USAGE ALERTS** ({len(alerts)} alerts)\n\n"
            
            # Group alerts by severity
            critical_alerts = [a for a in alerts if a['severity'] == 'critical']
            high_alerts = [a for a in alerts if a['severity'] == 'high']
            medium_alerts = [a for a in alerts if a['severity'] == 'medium']
            
            if critical_alerts:
                report += "🔴 **CRITICAL ALERTS:**\n"
                for alert in critical_alerts:
                    report += f"• {alert['message']} (User: {alert.get('user_id', 'N/A')})\n"
                report += "\n"
            
            if high_alerts:
                report += "🟠 **HIGH PRIORITY:**\n"
                for alert in high_alerts:
                    report += f"• {alert['message']} (User: {alert.get('user_id', 'N/A')})\n"
                report += "\n"
            
            if medium_alerts:
                report += "🟡 **MEDIUM PRIORITY:**\n"
                for alert in medium_alerts[:5]:  # Show only first 5
                    report += f"• {alert['message']} (User: {alert.get('user_id', 'N/A')})\n"
                
                if len(medium_alerts) > 5:
                    report += f"... and {len(medium_alerts) - 5} more medium alerts\n"
            
            return report
            
        else:
            return f"❌ Error fetching usage alerts: {response.status_code}"
            
    except Exception as e:
        return f"❌ Error getting usage alerts: {str(e)}"

@mcp.tool()
def trigger_upsell_sequence(user_id: str, recommended_tier: str, reason: str) -> str:
    """
    Trigger an automated upsell sequence for a customer based on usage patterns.
    
    This integrates with NGX_Closer.Agent to initiate personalized upgrade proposals.
    """
    try:
        import requests
        from datetime import datetime
        
        # First, get user's current usage stats
        usage_response = requests.get(
            f'http://localhost:8001/agent-usage/stats/{user_id}',
            timeout=10
        )
        
        if usage_response.status_code != 200:
            return f"❌ Cannot find usage data for user {user_id}"
        
        usage_data = usage_response.json()
        current_tier = usage_data.get('subscription_tier', 'unknown')
        usage_percentage = usage_data.get('usage_percentage', {}).get('tokens', 0)
        
        # Trigger upsell sequence
        upsell_data = {
            'user_id': user_id,
            'current_tier': current_tier,
            'recommended_tier': recommended_tier,
            'reason': reason,
            'usage_percentage': usage_percentage,
            'triggered_by': 'crm_analytics',
            'triggered_at': datetime.utcnow().isoformat()
        }
        
        # Send to NGX_Closer.Agent system
        response = requests.post(
            'http://localhost:8001/agent-usage/trigger-upsell',
            json=upsell_data,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            
            return f"""
✅ **UPSELL SEQUENCE TRIGGERED**

👤 **User**: {user_id}
📈 **Current Tier**: {current_tier.upper()}
🎯 **Recommended Tier**: {recommended_tier.upper()}
📊 **Usage**: {usage_percentage:.1f}% of current limit
💡 **Reason**: {reason}

🤖 **NGX_Closer.Agent** will now:
• Analyze user's specific usage patterns
• Create personalized upgrade proposal
• Schedule optimal contact timing
• Track engagement and conversion

📧 **Expected Timeline**: Contact within 24-48 hours
🎯 **Success Probability**: {result.get('success_probability', 85)}%
"""
        else:
            return f"❌ Error triggering upsell sequence: {response.status_code}"
            
    except Exception as e:
        return f"❌ Error triggering upsell sequence: {str(e)}"

@mcp.tool()
def analyze_usage_patterns(days: int = 30) -> str:
    """
    Analyze usage patterns across all customers to identify trends and opportunities.
    
    Provides insights for business optimization and strategic decisions.
    """
    try:
        import requests
        
        # Get comprehensive analytics
        response = requests.get(
            f'http://localhost:8001/agent-usage/analytics/summary?days={days}',
            timeout=15
        )
        
        if response.status_code == 200:
            data = response.json()
            
            report = f"""
📊 **USAGE PATTERNS ANALYSIS** ({days} days)

🎯 **Key Insights:**
• Most Popular Agent: {data.get('top_agents', [['Unknown', {}]])[0][0] if data.get('top_agents') else 'N/A'}
• Peak Usage Hours: {', '.join(map(str, data.get('peak_hours', [])))}
• Fastest Growing Tier: {data.get('fastest_growing_tier', 'N/A')}

💰 **Revenue Opportunities:**
• Potential Upgrades: {data.get('potential_upgrades', 0)} customers
• Estimated Monthly Revenue: ${data.get('upgrade_revenue_potential', 0):,.2f}
• Churn Risk: {data.get('churn_risk_users', 0)} customers

🚀 **Agent Performance:**"""
            
            for agent_id, stats in data.get('agent_stats', {}).items():
                efficiency = stats.get('tokens', 0) / max(1, stats.get('interactions', 1))
                report += f"""
• {agent_id}: {stats.get('interactions', 0):,} uses, {efficiency:.1f} tokens/interaction"""
            
            report += f"""

📈 **Growth Trends:**
• Interactions Growth: {data.get('interaction_growth', 0):+.1f}%
• Token Usage Growth: {data.get('token_growth', 0):+.1f}%
• New User Growth: {data.get('user_growth', 0):+.1f}%

🎯 **Recommendations:**"""
            
            recommendations = []
            
            if data.get('potential_upgrades', 0) > 0:
                recommendations.append("• Launch targeted upgrade campaign for high-usage customers")
            
            if data.get('churn_risk_users', 0) > 0:
                recommendations.append("• Implement retention strategy for at-risk customers")
            
            if data.get('low_engagement_agents'):
                recommendations.append("• Promote underutilized agents with training content")
            
            if not recommendations:
                recommendations.append("• Continue monitoring for optimization opportunities")
            
            report += "\n" + "\n".join(recommendations)
            
            return report
            
        else:
            return f"❌ Error analyzing usage patterns: {response.status_code}"
            
    except Exception as e:
        return f"❌ Error analyzing usage patterns: {str(e)}"

@mcp.tool()
def manage_usage_alert(alert_input: AlertInput) -> str:
    """
    Manage usage alerts - acknowledge, resolve, or dismiss them.
    
    Helps the team track and respond to important usage notifications.
    """
    try:
        import requests
        
        # Send alert management request
        response = requests.post(
            f'http://localhost:8001/agent-usage/alerts/{alert_input.alert_id}/{alert_input.action}',
            json={'acknowledged_by': 'crm_user'},
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            
            action_messages = {
                'acknowledge': '✅ Alert acknowledged - marked as seen by team',
                'resolve': '🎯 Alert resolved - issue has been addressed',
                'dismiss': '❌ Alert dismissed - no action required'
            }
            
            return f"""
{action_messages.get(alert_input.action, '✅ Alert updated')}

🆔 **Alert ID**: {alert_input.alert_id}
⏰ **Action Time**: {result.get('timestamp', 'Now')}
👤 **Action By**: CRM User

📝 **Status**: {alert_input.action.capitalize()}d successfully
"""
        
        else:
            return f"❌ Error managing alert: {response.status_code}"
            
    except Exception as e:
        return f"❌ Error managing alert: {str(e)}"

# =====================================
# UPDATED PROMPTS WITH AGENT ANALYTICS
# =====================================

@mcp.prompt("agent_usage_report")
def generate_agent_usage_report() -> str:
    """Generate comprehensive agent usage report for NGX team"""
    return f"""
You are creating a comprehensive agent usage report for the NGX team. Please:

1. **Get Usage Overview**: Use get_agent_usage_insights() to get overall usage metrics
2. **Check Usage Alerts**: Use get_usage_alerts() to see any customer issues
3. **Analyze Patterns**: Use analyze_usage_patterns() to identify trends and opportunities
4. **Review Specific Users**: If there are high-usage customers, get their detailed insights

Then create a comprehensive report including:
- Executive summary of agent usage across the platform
- Customer health status and any urgent alerts
- Revenue opportunities from usage patterns
- Agent performance insights
- Recommendations for business optimization
- Action items for the team

Focus on actionable insights that help NGX optimize their HIE platform and grow revenue.
"""

@mcp.prompt("customer_health_check")
def generate_customer_health_check() -> str:
    """Generate customer health assessment based on agent usage"""
    return f"""
You are performing a customer health assessment for the NGX team. Please:

1. **Check Usage Alerts**: Use get_usage_alerts() to identify at-risk customers
2. **Analyze Usage Patterns**: Use analyze_usage_patterns() for overall health metrics
3. **Review High-Value Customers**: Focus on PRIME/LONGEVITY tier customers

Create a customer health report including:
- Customers at risk of churn (low usage, limit exceeded)
- High-value customers requiring attention
- Upgrade opportunities based on usage patterns
- Retention strategies for at-risk accounts
- Success metrics and healthy usage indicators

Prioritize by revenue impact and urgency for the NGX team.
"""

# =====================================
# SERVER STARTUP
# =====================================

if __name__ == "__main__":
    print("🚀 Starting NexusCRM MCP Server...")
    print("📊 NGX CRM Integration Active")
    print("🔗 Ready for Claude Desktop connection")
    
    # Run the server with stdio transport (for Claude Desktop)
    mcp.run(transport="stdio")