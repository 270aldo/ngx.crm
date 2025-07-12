# NexusCRM API Documentation

## Base URL
```
Development: http://localhost:8000
Production: https://api.nexuscrm.ngx.com
```

## Authentication
All API endpoints require authentication via Supabase JWT tokens.

### Headers
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

## Endpoints

### Analytics API

#### Get Pipeline Statistics
```http
GET /routes/api/v1/analytics/pipeline
```

Query Parameters:
- `range_filter` (optional): Date range filter

Response:
```json
{
  "total_leads": 150,
  "total_deals": 45,
  "active_deals": 30,
  "won_deals": 10,
  "lost_deals": 5,
  "potential_mrr": 125000,
  "won_mrr": 50000,
  "average_deal_value": 5000,
  "lead_to_deal_conversion_rate": 0.3,
  "deal_win_rate": 0.67,
  "deal_volume_by_stage": [
    {
      "name": "Lead Qualification",
      "count": 8,
      "value": 40000
    }
  ],
  "average_time_in_stage": [
    {
      "stage_name": "Discovery",
      "average_days": 10
    }
  ],
  "lead_sources_breakdown": [
    {
      "source_name": "Website",
      "count": 50,
      "percentage": 0.33
    }
  ],
  "program_type_distribution": [
    {
      "program_name": "PRIME",
      "count": 30,
      "percentage": 0.67
    }
  ]
}
```

### Tasks API

#### List Tasks
```http
GET /routes/api/v1/tasks
```

Query Parameters:
- `status` (optional): Filter by status (To Do, In Progress, Done, Cancelled)
- `assigned_to_user_id` (optional): Filter by assigned user
- `related_contact_id` (optional): Filter by contact
- `related_deal_id` (optional): Filter by deal
- `limit` (default: 20): Number of results
- `offset` (default: 0): Pagination offset

Response:
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Follow up with client",
    "description": "Discuss pricing options",
    "due_date": "2024-01-25T10:00:00Z",
    "status": "To Do",
    "priority": "High",
    "assigned_to_user_id": "user-uuid",
    "related_contact_id": "contact-uuid",
    "created_at": "2024-01-20T10:00:00Z",
    "updated_at": "2024-01-20T10:00:00Z"
  }
]
```

#### Get Single Task
```http
GET /routes/api/v1/tasks/{task_id}
```

#### Create Task
```http
POST /routes/api/v1/tasks
```

Request Body:
```json
{
  "title": "Follow up with client",
  "description": "Discuss pricing options",
  "due_date": "2024-01-25T10:00:00Z",
  "status": "To Do",
  "priority": "High",
  "assigned_to_user_id": "user-uuid",
  "related_contact_id": "contact-uuid"
}
```

#### Update Task
```http
PATCH /routes/api/v1/tasks/{task_id}
```

Request Body (partial update):
```json
{
  "status": "In Progress",
  "priority": "Urgent"
}
```

#### Delete Task
```http
DELETE /routes/api/v1/tasks/{task_id}
```

Returns: 204 No Content

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Invalid request parameters"
}
```

### 401 Unauthorized
```json
{
  "detail": "Invalid or missing authentication token"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "An error occurred while processing the request"
}
```

## Rate Limiting
- Development: No rate limiting
- Production: 100 requests per minute per user

## Pagination
Most list endpoints support pagination using:
- `limit`: Number of results per page (max: 100)
- `offset`: Number of results to skip

## Filtering
List endpoints support filtering via query parameters.
Exact match filters are used unless otherwise specified.

## Sorting
List endpoints typically sort by creation date (newest first).
Some endpoints support custom sorting via `sort` parameter.

## Data Types

### Status Values
- Tasks: `To Do`, `In Progress`, `Done`, `Cancelled`
- Deals: Defined by deal_stages table
- Leads: `new`, `contacted`, `qualified`, `converted`, `lost`

### Priority Values
- `Low`, `Medium`, `High`, `Urgent`

### Date Format
All dates use ISO 8601 format: `YYYY-MM-DDTHH:mm:ssZ`

## Webhooks (Coming Soon)
Webhooks will be available for:
- Deal stage changes
- Task completion
- New lead creation

## API Versioning
The API uses URL versioning: `/api/v1/`
Breaking changes will increment the version number.

## SDK Support (Planned)
- Python SDK
- JavaScript/TypeScript SDK
- Go SDK