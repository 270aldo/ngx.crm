"""
Sistema de alertas inteligentes para uso de agentes NGX.

Este módulo implementa un sistema avanzado de alertas que detecta patrones,
predice problemas y genera notificaciones proactivas para el equipo NGX.
"""

import asyncio
import json
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Any, Set
from dataclasses import dataclass, asdict
from enum import Enum
import uuid

from core.database import get_database
from core.logging_config import get_logger
from app.services.analytics_engine import analytics_engine

logger = get_logger(__name__)

class AlertType(Enum):
    """Tipos de alertas disponibles."""
    USAGE_LIMIT_APPROACHING = "usage_limit_approaching"
    USAGE_LIMIT_EXCEEDED = "usage_limit_exceeded"
    ANOMALY_DETECTED = "anomaly_detected"
    CHURN_RISK = "churn_risk"
    UPGRADE_OPPORTUNITY = "upgrade_opportunity"
    PERFORMANCE_DEGRADATION = "performance_degradation"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    AGENT_OVERLOAD = "agent_overload"
    USER_INACTIVE = "user_inactive"
    RAPID_USAGE_SPIKE = "rapid_usage_spike"

class AlertSeverity(Enum):
    """Niveles de severidad de alertas."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AlertChannel(Enum):
    """Canales de notificación."""
    EMAIL = "email"
    SLACK = "slack"
    WEBHOOK = "webhook"
    DASHBOARD = "dashboard"
    SMS = "sms"

@dataclass
class AlertRule:
    """Definición de una regla de alerta."""
    id: str
    name: str
    alert_type: AlertType
    conditions: Dict[str, Any]
    severity: AlertSeverity
    channels: List[AlertChannel]
    cooldown_minutes: int = 60
    enabled: bool = True
    created_at: datetime = None
    updated_at: datetime = None

@dataclass
class Alert:
    """Instancia de una alerta generada."""
    id: str
    rule_id: str
    alert_type: AlertType
    severity: AlertSeverity
    title: str
    message: str
    user_id: Optional[str]
    agent_id: Optional[str]
    metadata: Dict[str, Any]
    triggered_at: datetime
    resolved_at: Optional[datetime] = None
    acknowledged_at: Optional[datetime] = None
    acknowledged_by: Optional[str] = None
    channels_sent: List[AlertChannel] = None
    auto_resolved: bool = False

class IntelligentAlertsService:
    """
    Servicio de alertas inteligentes con machine learning básico.
    """
    
    def __init__(self):
        self.alert_rules: Dict[str, AlertRule] = {}
        self.active_alerts: Dict[str, Alert] = {}
        self.alert_history: List[Alert] = []
        self.notification_queue = asyncio.Queue()
        self.is_running = False
        
        # Thresholds configurables
        self.thresholds = {
            'usage_warning': 0.8,  # 80% de límite
            'usage_critical': 0.95,  # 95% de límite
            'churn_risk': 0.7,  # 70% probabilidad de churn
            'response_time_degradation': 5000,  # 5 segundos
            'anomaly_z_score': 2.5,  # Desviaciones estándar
            'inactivity_days': 7,  # Días sin actividad
            'spike_multiplier': 3.0  # 3x uso normal
        }
        
        self._initialize_default_rules()
    
    def _initialize_default_rules(self):
        """Inicializa reglas de alerta por defecto."""
        
        # Regla: Límite de uso aproximándose
        self.alert_rules["usage_approaching"] = AlertRule(
            id="usage_approaching",
            name="Límite de Uso Aproximándose",
            alert_type=AlertType.USAGE_LIMIT_APPROACHING,
            conditions={
                "usage_percentage": self.thresholds['usage_warning'],
                "tier": ["essential", "pro", "elite"]
            },
            severity=AlertSeverity.MEDIUM,
            channels=[AlertChannel.DASHBOARD, AlertChannel.EMAIL],
            cooldown_minutes=120
        )
        
        # Regla: Límite excedido
        self.alert_rules["usage_exceeded"] = AlertRule(
            id="usage_exceeded",
            name="Límite de Uso Excedido",
            alert_type=AlertType.USAGE_LIMIT_EXCEEDED,
            conditions={
                "usage_percentage": self.thresholds['usage_critical']
            },
            severity=AlertSeverity.CRITICAL,
            channels=[AlertChannel.DASHBOARD, AlertChannel.EMAIL, AlertChannel.SLACK],
            cooldown_minutes=60
        )
        
        # Regla: Riesgo de churn
        self.alert_rules["churn_risk"] = AlertRule(
            id="churn_risk",
            name="Riesgo de Churn Detectado",
            alert_type=AlertType.CHURN_RISK,
            conditions={
                "churn_probability": self.thresholds['churn_risk'],
                "tier": ["pro", "elite", "prime", "longevity"]
            },
            severity=AlertSeverity.HIGH,
            channels=[AlertChannel.DASHBOARD, AlertChannel.SLACK],
            cooldown_minutes=1440  # 24 horas
        )
        
        # Regla: Oportunidad de upgrade
        self.alert_rules["upgrade_opportunity"] = AlertRule(
            id="upgrade_opportunity",
            name="Oportunidad de Upgrade",
            alert_type=AlertType.UPGRADE_OPPORTUNITY,
            conditions={
                "usage_percentage": 0.85,
                "tier": ["essential", "pro"],
                "active_days": 15
            },
            severity=AlertSeverity.LOW,
            channels=[AlertChannel.DASHBOARD],
            cooldown_minutes=2880  # 48 horas
        )
        
        # Regla: Anomalía detectada
        self.alert_rules["anomaly"] = AlertRule(
            id="anomaly",
            name="Anomalía en Uso Detectada",
            alert_type=AlertType.ANOMALY_DETECTED,
            conditions={
                "z_score": self.thresholds['anomaly_z_score']
            },
            severity=AlertSeverity.MEDIUM,
            channels=[AlertChannel.DASHBOARD, AlertChannel.SLACK],
            cooldown_minutes=180
        )
        
        # Regla: Usuario inactivo
        self.alert_rules["user_inactive"] = AlertRule(
            id="user_inactive",
            name="Usuario Inactivo",
            alert_type=AlertType.USER_INACTIVE,
            conditions={
                "days_inactive": self.thresholds['inactivity_days'],
                "tier": ["pro", "elite", "prime", "longevity"]
            },
            severity=AlertSeverity.MEDIUM,
            channels=[AlertChannel.DASHBOARD, AlertChannel.EMAIL],
            cooldown_minutes=1440  # 24 horas
        )
    
    async def start_monitoring(self):
        """Inicia el sistema de monitoreo de alertas."""
        if self.is_running:
            return
            
        self.is_running = True
        logger.info("Starting intelligent alerts monitoring system")
        
        # Crear tasks para monitoreo continuo
        tasks = [
            asyncio.create_task(self._usage_monitor()),
            asyncio.create_task(self._anomaly_monitor()),
            asyncio.create_task(self._churn_risk_monitor()),
            asyncio.create_task(self._performance_monitor()),
            asyncio.create_task(self._notification_processor()),
            asyncio.create_task(self._alert_cleanup())
        ]
        
        try:
            await asyncio.gather(*tasks)
        except Exception as e:
            logger.error(f"Error in alerts monitoring: {e}")
            self.is_running = False
    
    async def stop_monitoring(self):
        """Detiene el sistema de monitoreo."""
        self.is_running = False
        logger.info("Stopping intelligent alerts monitoring system")
    
    async def _usage_monitor(self):
        """Monitor de uso de tokens y límites."""
        while self.is_running:
            try:
                await self._check_usage_limits()
                await asyncio.sleep(300)  # Cada 5 minutos
            except Exception as e:
                logger.error(f"Error in usage monitor: {e}")
                await asyncio.sleep(60)
    
    async def _check_usage_limits(self):
        """Verifica límites de uso para todos los usuarios."""
        try:
            db = await get_database()
            
            # Obtener uso actual de todos los usuarios activos
            current_month_start = datetime.now(timezone.utc).replace(
                day=1, hour=0, minute=0, second=0, microsecond=0
            )
            
            usage_query = """
            SELECT 
                user_id,
                subscription_tier,
                SUM(tokens_used) as monthly_tokens,
                COUNT(*) as monthly_interactions,
                COUNT(DISTINCT DATE(timestamp)) as active_days,
                MAX(timestamp) as last_activity
            FROM agent_usage_events 
            WHERE timestamp >= $1
            GROUP BY user_id, subscription_tier
            """
            
            results = await db.fetch(usage_query, current_month_start)
            
            # Límites por tier
            tier_limits = {
                'essential': 50000,
                'pro': 150000,
                'elite': 500000,
                'prime': 1000000,
                'longevity': 1000000
            }
            
            for row in results:
                user_id = row['user_id']
                tier = row['subscription_tier']
                monthly_tokens = row['monthly_tokens'] or 0
                limit = tier_limits.get(tier, 50000)
                usage_percentage = monthly_tokens / limit
                
                # Check approaching limit
                if (usage_percentage >= self.thresholds['usage_warning'] and 
                    usage_percentage < self.thresholds['usage_critical']):
                    
                    await self._trigger_alert(
                        rule_id="usage_approaching",
                        user_id=user_id,
                        title=f"Límite de uso aproximándose - {tier.upper()}",
                        message=f"Usuario {user_id} ha usado {usage_percentage:.1%} de su límite mensual ({monthly_tokens:,}/{limit:,} tokens)",
                        metadata={
                            'usage_percentage': usage_percentage,
                            'tokens_used': monthly_tokens,
                            'tokens_limit': limit,
                            'tier': tier,
                            'days_remaining': (datetime.now(timezone.utc).replace(month=datetime.now().month+1, day=1) - datetime.now(timezone.utc)).days
                        }
                    )
                
                # Check limit exceeded
                elif usage_percentage >= self.thresholds['usage_critical']:
                    await self._trigger_alert(
                        rule_id="usage_exceeded",
                        user_id=user_id,
                        title=f"Límite de uso EXCEDIDO - {tier.upper()}",
                        message=f"⚠️ Usuario {user_id} ha excedido su límite mensual ({usage_percentage:.1%} - {monthly_tokens:,}/{limit:,} tokens)",
                        metadata={
                            'usage_percentage': usage_percentage,
                            'tokens_used': monthly_tokens,
                            'tokens_limit': limit,
                            'tier': tier,
                            'overage': monthly_tokens - limit
                        }
                    )
                
                # Check upgrade opportunity
                elif (usage_percentage >= 0.85 and 
                      tier in ['essential', 'pro'] and 
                      row['active_days'] >= 15):
                    
                    await self._trigger_alert(
                        rule_id="upgrade_opportunity",
                        user_id=user_id,
                        title=f"Oportunidad de Upgrade - {user_id}",
                        message=f"Usuario activo {user_id} usando {usage_percentage:.1%} de su límite {tier}. Candidato para upgrade.",
                        metadata={
                            'usage_percentage': usage_percentage,
                            'current_tier': tier,
                            'suggested_tier': 'pro' if tier == 'essential' else 'elite',
                            'active_days': row['active_days']
                        }
                    )
                
        except Exception as e:
            logger.error(f"Error checking usage limits: {e}")
    
    async def _anomaly_monitor(self):
        """Monitor de anomalías en patrones de uso."""
        while self.is_running:
            try:
                await self._check_usage_anomalies()
                await asyncio.sleep(900)  # Cada 15 minutos
            except Exception as e:
                logger.error(f"Error in anomaly monitor: {e}")
                await asyncio.sleep(300)
    
    async def _check_usage_anomalies(self):
        """Detecta y alerta sobre anomalías en el uso."""
        try:
            anomalies = await analytics_engine.detect_usage_anomalies(7)
            
            for anomaly in anomalies:
                if anomaly['severity'] in ['high', 'critical']:
                    await self._trigger_alert(
                        rule_id="anomaly",
                        agent_id=anomaly.get('agent_id'),
                        title=f"Anomalía Detectada - {anomaly['type']}",
                        message=f"Anomalía en {anomaly['agent_id']}: {anomaly['description']}",
                        metadata=anomaly
                    )
                    
        except Exception as e:
            logger.error(f"Error checking anomalies: {e}")
    
    async def _churn_risk_monitor(self):
        """Monitor de riesgo de churn."""
        while self.is_running:
            try:
                await self._check_churn_risk()
                await asyncio.sleep(3600)  # Cada hora
            except Exception as e:
                logger.error(f"Error in churn risk monitor: {e}")
                await asyncio.sleep(600)
    
    async def _check_churn_risk(self):
        """Identifica usuarios con riesgo de churn."""
        try:
            db = await get_database()
            
            # Obtener usuarios activos del último mes
            one_month_ago = datetime.now(timezone.utc) - timedelta(days=30)
            
            users_query = """
            SELECT DISTINCT user_id, subscription_tier
            FROM agent_usage_events 
            WHERE timestamp >= $1 AND subscription_tier IN ('pro', 'elite', 'prime', 'longevity')
            """
            
            users = await db.fetch(users_query, one_month_ago)
            
            for user_row in users:
                user_id = user_row['user_id']
                tier = user_row['subscription_tier']
                
                # Generar insights para el usuario
                try:
                    insights = await analytics_engine.generate_user_insights(user_id)
                    
                    if (insights.predicted_churn_probability >= self.thresholds['churn_risk'] and
                        insights.risk_level in ['high', 'critical']):
                        
                        await self._trigger_alert(
                            rule_id="churn_risk",
                            user_id=user_id,
                            title=f"Riesgo de Churn - {tier.upper()}",
                            message=f"Usuario {user_id} tiene {insights.predicted_churn_probability:.1%} probabilidad de churn (score: {insights.usage_score:.1f})",
                            metadata={
                                'churn_probability': insights.predicted_churn_probability,
                                'usage_score': insights.usage_score,
                                'risk_level': insights.risk_level,
                                'recommendations': insights.recommendations,
                                'tier': tier
                            }
                        )
                        
                except Exception as e:
                    logger.warning(f"Error generating insights for user {user_id}: {e}")
                    
        except Exception as e:
            logger.error(f"Error checking churn risk: {e}")
    
    async def _performance_monitor(self):
        """Monitor de rendimiento de agentes."""
        while self.is_running:
            try:
                await self._check_agent_performance()
                await asyncio.sleep(1800)  # Cada 30 minutos
            except Exception as e:
                logger.error(f"Error in performance monitor: {e}")
                await asyncio.sleep(600)
    
    async def _check_agent_performance(self):
        """Verifica rendimiento de agentes."""
        try:
            agents = ['NEXUS', 'BLAZE', 'SAGE', 'ARIA', 'CIPHER', 'ECHO']
            
            for agent_id in agents:
                performance = await analytics_engine.analyze_agent_performance(agent_id, 1)
                
                # Check degradación de rendimiento
                if (performance.avg_response_time > self.thresholds['response_time_degradation'] and
                    performance.total_interactions > 10):
                    
                    await self._trigger_alert(
                        rule_id="performance_degradation",
                        agent_id=agent_id,
                        title=f"Degradación de Rendimiento - {agent_id}",
                        message=f"Agente {agent_id} muestra tiempo de respuesta elevado: {performance.avg_response_time:.0f}ms (interacciones: {performance.total_interactions})",
                        metadata={
                            'avg_response_time': performance.avg_response_time,
                            'total_interactions': performance.total_interactions,
                            'success_rate': performance.success_rate,
                            'threshold': self.thresholds['response_time_degradation']
                        }
                    )
                    
        except Exception as e:
            logger.error(f"Error checking agent performance: {e}")
    
    async def _trigger_alert(
        self,
        rule_id: str,
        title: str,
        message: str,
        user_id: Optional[str] = None,
        agent_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Dispara una nueva alerta."""
        try:
            rule = self.alert_rules.get(rule_id)
            if not rule or not rule.enabled:
                return
            
            # Check cooldown
            alert_key = f"{rule_id}_{user_id or agent_id or 'global'}"
            if await self._is_in_cooldown(alert_key, rule.cooldown_minutes):
                return
            
            # Crear nueva alerta
            alert = Alert(
                id=str(uuid.uuid4()),
                rule_id=rule_id,
                alert_type=rule.alert_type,
                severity=rule.severity,
                title=title,
                message=message,
                user_id=user_id,
                agent_id=agent_id,
                metadata=metadata or {},
                triggered_at=datetime.now(timezone.utc),
                channels_sent=[]
            )
            
            # Guardar alerta
            self.active_alerts[alert.id] = alert
            self.alert_history.append(alert)
            
            # Persistir en base de datos
            await self._save_alert_to_db(alert)
            
            # Encolar para notificación
            await self.notification_queue.put({
                'alert': alert,
                'channels': rule.channels
            })
            
            logger.info(f"Alert triggered: {title} (ID: {alert.id})")
            
        except Exception as e:
            logger.error(f"Error triggering alert: {e}")
    
    async def _is_in_cooldown(self, alert_key: str, cooldown_minutes: int) -> bool:
        """Verifica si una alerta está en período de cooldown."""
        try:
            db = await get_database()
            
            cooldown_threshold = datetime.now(timezone.utc) - timedelta(minutes=cooldown_minutes)
            
            recent_alert = await db.fetchrow("""
                SELECT id FROM usage_alerts 
                WHERE alert_type = $1 AND triggered_at > $2
                ORDER BY triggered_at DESC LIMIT 1
            """, alert_key, cooldown_threshold)
            
            return recent_alert is not None
            
        except Exception as e:
            logger.error(f"Error checking cooldown: {e}")
            return False
    
    async def _save_alert_to_db(self, alert: Alert):
        """Guarda la alerta en la base de datos."""
        try:
            db = await get_database()
            
            await db.execute("""
                INSERT INTO usage_alerts 
                (id, user_id, alert_type, message, threshold, current_value, 
                 triggered_at, severity, metadata)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            """, 
            alert.id, alert.user_id, alert.alert_type.value, alert.message,
            0.0, 0.0, alert.triggered_at, alert.severity.value,
            json.dumps(alert.metadata)
            )
            
        except Exception as e:
            logger.error(f"Error saving alert to database: {e}")
    
    async def _notification_processor(self):
        """Procesa la cola de notificaciones."""
        while self.is_running:
            try:
                # Procesar notificaciones pendientes
                notification = await asyncio.wait_for(
                    self.notification_queue.get(), 
                    timeout=1.0
                )
                
                await self._send_notifications(
                    notification['alert'],
                    notification['channels']
                )
                
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                logger.error(f"Error processing notifications: {e}")
                await asyncio.sleep(5)
    
    async def _send_notifications(self, alert: Alert, channels: List[AlertChannel]):
        """Envía notificaciones por los canales especificados."""
        sent_channels = []
        
        for channel in channels:
            try:
                success = False
                
                if channel == AlertChannel.EMAIL:
                    success = await self._send_email_notification(alert)
                elif channel == AlertChannel.SLACK:
                    success = await self._send_slack_notification(alert)
                elif channel == AlertChannel.WEBHOOK:
                    success = await self._send_webhook_notification(alert)
                elif channel == AlertChannel.DASHBOARD:
                    success = await self._send_dashboard_notification(alert)
                elif channel == AlertChannel.SMS:
                    success = await self._send_sms_notification(alert)
                
                if success:
                    sent_channels.append(channel)
                    
            except Exception as e:
                logger.error(f"Error sending notification via {channel.value}: {e}")
        
        # Actualizar canales enviados
        alert.channels_sent = sent_channels
        
        logger.info(f"Notifications sent for alert {alert.id} via {[c.value for c in sent_channels]}")
    
    async def _send_email_notification(self, alert: Alert) -> bool:
        """Envía notificación por email."""
        # Placeholder - implementar integración con servicio de email
        logger.info(f"Email notification: {alert.title}")
        return True
    
    async def _send_slack_notification(self, alert: Alert) -> bool:
        """Envía notificación a Slack."""
        # Placeholder - implementar integración con Slack
        logger.info(f"Slack notification: {alert.title}")
        return True
    
    async def _send_webhook_notification(self, alert: Alert) -> bool:
        """Envía notificación por webhook."""
        # Placeholder - implementar webhooks salientes
        logger.info(f"Webhook notification: {alert.title}")
        return True
    
    async def _send_dashboard_notification(self, alert: Alert) -> bool:
        """Envía notificación al dashboard (WebSocket)."""
        try:
            # Broadcast a WebSocket clients conectados
            from app.apis.agent_usage import manager
            
            notification_data = {
                'type': 'alert',
                'alert': {
                    'id': alert.id,
                    'title': alert.title,
                    'message': alert.message,
                    'severity': alert.severity.value,
                    'alert_type': alert.alert_type.value,
                    'triggered_at': alert.triggered_at.isoformat(),
                    'user_id': alert.user_id,
                    'agent_id': alert.agent_id,
                    'metadata': alert.metadata
                }
            }
            
            await manager.broadcast(json.dumps(notification_data))
            return True
            
        except Exception as e:
            logger.error(f"Error sending dashboard notification: {e}")
            return False
    
    async def _send_sms_notification(self, alert: Alert) -> bool:
        """Envía notificación por SMS."""
        # Placeholder - implementar integración con SMS
        logger.info(f"SMS notification: {alert.title}")
        return True
    
    async def _alert_cleanup(self):
        """Limpia alertas resueltas y antigas."""
        while self.is_running:
            try:
                current_time = datetime.now(timezone.utc)
                cutoff_time = current_time - timedelta(days=7)
                
                # Limpiar alertas antigas del historial en memoria
                self.alert_history = [
                    alert for alert in self.alert_history 
                    if alert.triggered_at > cutoff_time
                ]
                
                # Limpiar alertas activas resueltas
                resolved_alerts = [
                    alert_id for alert_id, alert in self.active_alerts.items()
                    if alert.resolved_at is not None
                ]
                
                for alert_id in resolved_alerts:
                    del self.active_alerts[alert_id]
                
                logger.debug(f"Alert cleanup: {len(resolved_alerts)} resolved alerts removed")
                
                await asyncio.sleep(3600)  # Cada hora
                
            except Exception as e:
                logger.error(f"Error in alert cleanup: {e}")
                await asyncio.sleep(600)
    
    async def get_active_alerts(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Obtiene alertas activas."""
        alerts = sorted(
            self.active_alerts.values(),
            key=lambda a: a.triggered_at,
            reverse=True
        )[:limit]
        
        return [asdict(alert) for alert in alerts]
    
    async def acknowledge_alert(self, alert_id: str, acknowledged_by: str) -> bool:
        """Marca una alerta como reconocida."""
        try:
            if alert_id in self.active_alerts:
                alert = self.active_alerts[alert_id]
                alert.acknowledged_at = datetime.now(timezone.utc)
                alert.acknowledged_by = acknowledged_by
                
                # Actualizar en base de datos
                db = await get_database()
                await db.execute("""
                    UPDATE usage_alerts 
                    SET acknowledged_at = $1, acknowledged_by = $2
                    WHERE id = $3
                """, alert.acknowledged_at, acknowledged_by, alert_id)
                
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error acknowledging alert {alert_id}: {e}")
            return False
    
    async def resolve_alert(self, alert_id: str, resolved_by: str) -> bool:
        """Marca una alerta como resuelta."""
        try:
            if alert_id in self.active_alerts:
                alert = self.active_alerts[alert_id]
                alert.resolved_at = datetime.now(timezone.utc)
                
                # Actualizar en base de datos
                db = await get_database()
                await db.execute("""
                    UPDATE usage_alerts 
                    SET resolved_at = $1
                    WHERE id = $2
                """, alert.resolved_at, alert_id)
                
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error resolving alert {alert_id}: {e}")
            return False

# Instancia global del servicio de alertas
intelligent_alerts_service = IntelligentAlertsService()