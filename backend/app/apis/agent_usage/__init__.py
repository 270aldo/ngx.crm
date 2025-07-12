"""
Router para tracking de uso de agentes NGX.

Este módulo proporciona endpoints para recibir eventos de uso de GENESIS
y generar analytics para el equipo interno de NGX.
"""

import asyncio
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
import json

from core.database import get_database
from core.auth import get_current_user

router = APIRouter(
    prefix="/agent-usage",
    tags=["agent-usage"],
    responses={401: {"description": "No autorizado"}},
)

# Modelos de datos
class AgentUsageEvent(BaseModel):
    """Evento de uso de agente desde GENESIS."""
    user_id: str
    contact_id: Optional[str] = None
    agent_id: str  # NEXUS, BLAZE, SAGE, etc.
    session_id: str
    tokens_used: int
    response_time_ms: int
    timestamp: datetime
    subscription_tier: str  # essential, pro, elite, prime, longevity
    organization_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class UsageStats(BaseModel):
    """Estadísticas de uso de agentes."""
    user_id: str
    total_interactions: int
    total_tokens: int
    agents_used: List[str]
    avg_response_time: float
    subscription_tier: str
    current_limits: Dict[str, int]
    usage_percentage: Dict[str, float]

class UsageAlert(BaseModel):
    """Alerta de uso."""
    id: str
    user_id: str
    alert_type: str  # approaching_limit, limit_exceeded, anomaly_detected
    message: str
    threshold: float
    current_value: float
    triggered_at: datetime
    severity: str  # low, medium, high, critical

class LiveUsageUpdate(BaseModel):
    """Update en tiempo real para el dashboard."""
    event_type: str  # usage_update, alert_triggered, limit_reached
    data: Dict[str, Any]
    timestamp: datetime

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                # Connection closed, remove it
                self.active_connections.remove(connection)

manager = ConnectionManager()

# Límites por tier (por mes)
TIER_LIMITS = {
    "essential": {
        "total_tokens": 50000,
        "agents": ["NEXUS", "BLAZE"],
        "max_sessions_daily": 100
    },
    "pro": {
        "total_tokens": 150000,
        "agents": ["NEXUS", "BLAZE", "SAGE", "ARIA"],
        "max_sessions_daily": 300
    },
    "elite": {
        "total_tokens": 500000,
        "agents": ["NEXUS", "BLAZE", "SAGE", "ARIA", "CIPHER", "ECHO"],
        "max_sessions_daily": 1000
    },
    "prime": {
        "total_tokens": 1000000,
        "agents": ["*"],  # Todos los agentes
        "max_sessions_daily": 2000
    },
    "longevity": {
        "total_tokens": 1000000,
        "agents": ["*"],
        "max_sessions_daily": 2000
    }
}

@router.post("/events", response_model=Dict[str, str])
async def receive_usage_event(
    event: AgentUsageEvent,
    background_tasks: BackgroundTasks,
    db=Depends(get_database)
) -> Dict[str, str]:
    """
    Recibe eventos de uso de agentes desde GENESIS.
    
    Este endpoint es llamado por webhooks de GENESIS cada vez que
    un usuario interactúa con un agente.
    """
    try:
        # Validar que el agente esté permitido para este tier
        user_limits = TIER_LIMITS.get(event.subscription_tier, {})
        allowed_agents = user_limits.get("agents", [])
        
        if allowed_agents != ["*"] and event.agent_id not in allowed_agents:
            raise HTTPException(
                status_code=400,
                detail=f"Agent {event.agent_id} not allowed for tier {event.subscription_tier}"
            )

        # Insertar evento en la base de datos
        query = """
        INSERT INTO agent_usage_events 
        (id, user_id, contact_id, agent_id, session_id, tokens_used, 
         response_time_ms, timestamp, subscription_tier, organization_id, context)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        """
        
        event_id = str(uuid.uuid4())
        await db.execute(
            query,
            event_id, event.user_id, event.contact_id, event.agent_id,
            event.session_id, event.tokens_used, event.response_time_ms,
            event.timestamp, event.subscription_tier, event.organization_id,
            json.dumps(event.context) if event.context else None
        )

        # Procesar analytics en background
        background_tasks.add_task(
            process_usage_analytics, 
            event, 
            db
        )

        # Enviar update en tiempo real
        background_tasks.add_task(
            broadcast_usage_update,
            LiveUsageUpdate(
                event_type="usage_update",
                data={
                    "user_id": event.user_id,
                    "agent_id": event.agent_id,
                    "tokens_used": event.tokens_used,
                    "subscription_tier": event.subscription_tier
                },
                timestamp=datetime.utcnow()
            )
        )

        return {
            "status": "success",
            "event_id": event_id,
            "message": "Usage event processed successfully"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process usage event: {str(e)}"
        )

@router.get("/stats/{user_id}", response_model=UsageStats)
async def get_user_usage_stats(
    user_id: str,
    days: int = 30,
    current_user: str = Depends(get_current_user),
    db=Depends(get_database)
) -> UsageStats:
    """
    Obtiene estadísticas de uso para un usuario específico.
    """
    try:
        # Calcular fecha de inicio
        start_date = datetime.utcnow() - timedelta(days=days)

        # Query para obtener estadísticas
        query = """
        SELECT 
            COUNT(*) as total_interactions,
            SUM(tokens_used) as total_tokens,
            ARRAY_AGG(DISTINCT agent_id) as agents_used,
            AVG(response_time_ms) as avg_response_time,
            subscription_tier
        FROM agent_usage_events 
        WHERE user_id = $1 AND timestamp >= $2
        GROUP BY subscription_tier
        """

        result = await db.fetchrow(query, user_id, start_date)
        
        if not result:
            # Usuario sin uso reciente
            return UsageStats(
                user_id=user_id,
                total_interactions=0,
                total_tokens=0,
                agents_used=[],
                avg_response_time=0.0,
                subscription_tier="essential",
                current_limits=TIER_LIMITS["essential"],
                usage_percentage={}
            )

        tier = result["subscription_tier"]
        limits = TIER_LIMITS.get(tier, TIER_LIMITS["essential"])
        
        # Calcular porcentajes de uso
        usage_percentage = {
            "tokens": (result["total_tokens"] / limits["total_tokens"]) * 100,
            "interactions": min((result["total_interactions"] / limits.get("max_sessions_daily", 1000)) * 100, 100)
        }

        return UsageStats(
            user_id=user_id,
            total_interactions=result["total_interactions"],
            total_tokens=result["total_tokens"],
            agents_used=result["agents_used"] or [],
            avg_response_time=float(result["avg_response_time"] or 0),
            subscription_tier=tier,
            current_limits=limits,
            usage_percentage=usage_percentage
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get usage stats: {str(e)}"
        )

@router.get("/limits/{user_id}")
async def check_usage_limits(
    user_id: str,
    current_user: str = Depends(get_current_user),
    db=Depends(get_database)
) -> Dict[str, Any]:
    """
    Verifica si el usuario está cerca de sus límites.
    """
    try:
        stats = await get_user_usage_stats(user_id, 30, current_user, db)
        
        alerts = []
        status = "ok"
        
        # Check token usage
        token_usage = stats.usage_percentage.get("tokens", 0)
        if token_usage >= 90:
            status = "critical"
            alerts.append("Token limit almost reached (90%+)")
        elif token_usage >= 75:
            status = "warning"
            alerts.append("High token usage (75%+)")

        # Check interaction limits
        interaction_usage = stats.usage_percentage.get("interactions", 0)
        if interaction_usage >= 90:
            status = "critical" if status != "critical" else status
            alerts.append("Daily interaction limit almost reached")

        return {
            "user_id": user_id,
            "status": status,
            "usage_percentage": stats.usage_percentage,
            "limits": stats.current_limits,
            "alerts": alerts,
            "subscription_tier": stats.subscription_tier,
            "upgrade_recommended": token_usage > 80 or interaction_usage > 80
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check limits: {str(e)}"
        )

@router.websocket("/live")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket para updates en tiempo real del dashboard.
    """
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
            # Echo back for health check
            await websocket.send_text(f"Echo: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@router.get("/analytics/summary")
async def get_analytics_summary(
    days: int = 7,
    current_user: str = Depends(get_current_user),
    db=Depends(get_database)
) -> Dict[str, Any]:
    """
    Genera resumen de analytics para el dashboard ejecutivo.
    """
    try:
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Métricas agregadas
        query = """
        SELECT 
            COUNT(DISTINCT user_id) as active_users,
            COUNT(*) as total_interactions,
            SUM(tokens_used) as total_tokens,
            AVG(response_time_ms) as avg_response_time,
            agent_id,
            subscription_tier
        FROM agent_usage_events 
        WHERE timestamp >= $1
        GROUP BY agent_id, subscription_tier
        """
        
        results = await db.fetch(query, start_date)
        
        # Procesar resultados
        agent_stats = {}
        tier_stats = {}
        total_metrics = {
            "active_users": 0,
            "total_interactions": 0,
            "total_tokens": 0,
            "avg_response_time": 0
        }
        
        for row in results:
            agent_id = row["agent_id"]
            tier = row["subscription_tier"]
            
            # Stats por agente
            if agent_id not in agent_stats:
                agent_stats[agent_id] = {
                    "interactions": 0,
                    "tokens": 0,
                    "users": set()
                }
            
            agent_stats[agent_id]["interactions"] += row["total_interactions"]
            agent_stats[agent_id]["tokens"] += row["total_tokens"]
            
            # Stats por tier
            if tier not in tier_stats:
                tier_stats[tier] = {
                    "interactions": 0,
                    "tokens": 0,
                    "users": 0
                }
            
            tier_stats[tier]["interactions"] += row["total_interactions"]
            tier_stats[tier]["tokens"] += row["total_tokens"]
            tier_stats[tier]["users"] += row["active_users"]

        return {
            "period_days": days,
            "agent_stats": agent_stats,
            "tier_stats": tier_stats,
            "top_agents": sorted(
                agent_stats.items(),
                key=lambda x: x[1]["interactions"],
                reverse=True
            )[:5],
            "generated_at": datetime.utcnow()
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate analytics: {str(e)}"
        )

# Background tasks
async def process_usage_analytics(event: AgentUsageEvent, db):
    """
    Procesa analytics y genera alertas si es necesario.
    """
    try:
        # Actualizar métricas diarias
        today = event.timestamp.date()
        
        upsert_query = """
        INSERT INTO agent_usage_daily 
        (date, user_id, agent_id, total_interactions, total_tokens, avg_response_time)
        VALUES ($1, $2, $3, 1, $4, $5)
        ON CONFLICT (date, user_id, agent_id) 
        DO UPDATE SET 
            total_interactions = agent_usage_daily.total_interactions + 1,
            total_tokens = agent_usage_daily.total_tokens + $4,
            avg_response_time = (agent_usage_daily.avg_response_time + $5) / 2
        """
        
        await db.execute(
            upsert_query,
            today, event.user_id, event.agent_id,
            event.tokens_used, event.response_time_ms
        )

        # Verificar si necesita generar alertas
        await check_and_generate_alerts(event, db)

    except Exception as e:
        print(f"Error processing analytics: {e}")

async def check_and_generate_alerts(event: AgentUsageEvent, db):
    """
    Verifica si el uso actual requiere generar alertas.
    """
    try:
        # Obtener uso del mes actual
        start_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        monthly_usage_query = """
        SELECT SUM(tokens_used) as monthly_tokens
        FROM agent_usage_events 
        WHERE user_id = $1 AND timestamp >= $2
        """
        
        result = await db.fetchrow(monthly_usage_query, event.user_id, start_month)
        monthly_tokens = result["monthly_tokens"] if result else 0
        
        # Obtener límites del tier
        limits = TIER_LIMITS.get(event.subscription_tier, TIER_LIMITS["essential"])
        token_limit = limits["total_tokens"]
        
        usage_percentage = (monthly_tokens / token_limit) * 100
        
        # Generar alerta si corresponde
        if usage_percentage >= 90 and usage_percentage < 100:
            await create_usage_alert(
                event.user_id,
                "approaching_limit",
                f"Token usage at {usage_percentage:.1f}% of monthly limit",
                90.0,
                usage_percentage,
                "high",
                db
            )
        elif usage_percentage >= 100:
            await create_usage_alert(
                event.user_id,
                "limit_exceeded",
                f"Monthly token limit exceeded ({usage_percentage:.1f}%)",
                100.0,
                usage_percentage,
                "critical",
                db
            )

    except Exception as e:
        print(f"Error checking alerts: {e}")

async def create_usage_alert(
    user_id: str,
    alert_type: str,
    message: str,
    threshold: float,
    current_value: float,
    severity: str,
    db
):
    """
    Crea una nueva alerta de uso.
    """
    try:
        alert_id = str(uuid.uuid4())
        
        insert_query = """
        INSERT INTO usage_alerts 
        (id, user_id, alert_type, message, threshold, current_value, 
         triggered_at, severity, resolved_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NULL)
        """
        
        await db.execute(
            insert_query,
            alert_id, user_id, alert_type, message,
            threshold, current_value, datetime.utcnow(), severity
        )

        # Broadcast alert
        await broadcast_usage_update(
            LiveUsageUpdate(
                event_type="alert_triggered",
                data={
                    "alert_id": alert_id,
                    "user_id": user_id,
                    "alert_type": alert_type,
                    "message": message,
                    "severity": severity
                },
                timestamp=datetime.utcnow()
            )
        )

    except Exception as e:
        print(f"Error creating alert: {e}")

async def broadcast_usage_update(update: LiveUsageUpdate):
    """
    Envía update a todos los clientes WebSocket conectados.
    """
    try:
        message = json.dumps({
            "event_type": update.event_type,
            "data": update.data,
            "timestamp": update.timestamp.isoformat()
        })
        
        await manager.broadcast(message)
    except Exception as e:
        print(f"Error broadcasting update: {e}")