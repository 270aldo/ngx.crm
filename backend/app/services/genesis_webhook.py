"""
Servicio para configurar y manejar webhooks desde GENESIS.

Este módulo proporciona la infraestructura para recibir eventos de uso
de agentes desde el backend de GENESIS de manera segura y confiable.
"""

import hashlib
import hmac
import json
import time
from typing import Dict, Optional, Any
from fastapi import HTTPException, Request
import httpx
import asyncio
from datetime import datetime, timedelta

from core.settings import settings
from core.logging_config import get_logger

logger = get_logger(__name__)

class GenesisWebhookService:
    """
    Servicio para manejar webhooks de GENESIS.
    """
    
    def __init__(self):
        self.webhook_secret = settings.genesis_webhook_secret
        self.genesis_api_url = settings.genesis_api_url
        self.max_retries = 3
        self.retry_delay = 1  # segundos
        
    async def verify_webhook_signature(self, request: Request, payload: bytes) -> bool:
        """
        Verifica la firma del webhook para asegurar que viene de GENESIS.
        
        Args:
            request: Request object de FastAPI
            payload: Payload raw del webhook
            
        Returns:
            bool: True si la firma es válida
        """
        try:
            signature_header = request.headers.get("X-Genesis-Signature")
            if not signature_header:
                logger.warning("Webhook recibido sin signature header")
                return False
            
            # Formato esperado: "sha256=<hash>"
            if not signature_header.startswith("sha256="):
                logger.warning("Formato de signature inválido")
                return False
            
            expected_signature = signature_header[7:]  # Remover "sha256="
            
            # Calcular signature esperada
            calculated_signature = hmac.new(
                self.webhook_secret.encode('utf-8'),
                payload,
                hashlib.sha256
            ).hexdigest()
            
            # Comparación segura
            return hmac.compare_digest(expected_signature, calculated_signature)
            
        except Exception as e:
            logger.error(f"Error verificando signature del webhook: {e}")
            return False
    
    async def validate_webhook_timestamp(self, request: Request, tolerance_seconds: int = 300) -> bool:
        """
        Valida que el webhook no sea demasiado antiguo (previene replay attacks).
        
        Args:
            request: Request object
            tolerance_seconds: Tolerancia en segundos (default 5 minutos)
            
        Returns:
            bool: True si el timestamp es válido
        """
        try:
            timestamp_header = request.headers.get("X-Genesis-Timestamp")
            if not timestamp_header:
                return True  # No todos los webhooks tendrán timestamp
            
            webhook_timestamp = int(timestamp_header)
            current_timestamp = int(time.time())
            
            # Verificar que no sea muy antiguo ni muy futuro
            time_diff = abs(current_timestamp - webhook_timestamp)
            return time_diff <= tolerance_seconds
            
        except (ValueError, TypeError) as e:
            logger.warning(f"Timestamp inválido en webhook: {e}")
            return False
    
    def extract_usage_data(self, webhook_payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Extrae y valida datos de uso del payload del webhook.
        
        Args:
            webhook_payload: Payload del webhook desde GENESIS
            
        Returns:
            Dict con datos de uso procesados o None si es inválido
        """
        try:
            # Validar estructura básica
            required_fields = [
                "user_id", "agent_id", "session_id", 
                "tokens_used", "response_time_ms", "timestamp"
            ]
            
            for field in required_fields:
                if field not in webhook_payload:
                    logger.error(f"Campo requerido {field} no encontrado en webhook")
                    return None
            
            # Extraer y validar datos
            usage_data = {
                "user_id": str(webhook_payload["user_id"]),
                "agent_id": str(webhook_payload["agent_id"]).upper(),
                "session_id": str(webhook_payload["session_id"]),
                "tokens_used": int(webhook_payload["tokens_used"]),
                "response_time_ms": int(webhook_payload["response_time_ms"]),
                "timestamp": datetime.fromisoformat(webhook_payload["timestamp"].replace('Z', '+00:00')),
                "subscription_tier": webhook_payload.get("subscription_tier", "essential"),
                "organization_id": webhook_payload.get("organization_id"),
                "context": webhook_payload.get("context", {})
            }
            
            # Validaciones adicionales
            if usage_data["tokens_used"] < 0:
                logger.error("Tokens usados no puede ser negativo")
                return None
                
            if usage_data["response_time_ms"] < 0:
                logger.error("Tiempo de respuesta no puede ser negativo")
                return None
            
            # Validar agente
            valid_agents = [
                "NEXUS", "BLAZE", "SAGE", "ARIA", "CIPHER", 
                "ECHO", "QUANTUM", "NOVA", "FLUX", "VERTEX", "HELIX"
            ]
            if usage_data["agent_id"] not in valid_agents:
                logger.warning(f"Agente no reconocido: {usage_data['agent_id']}")
                # No es error crítico, permitir el procesamiento
            
            return usage_data
            
        except (ValueError, TypeError, KeyError) as e:
            logger.error(f"Error extrayendo datos de uso del webhook: {e}")
            return None
    
    async def send_webhook_response(
        self, 
        success: bool, 
        message: str, 
        event_id: Optional[str] = None,
        retry_after: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Genera respuesta estándar para el webhook.
        
        Args:
            success: Si el webhook fue procesado exitosamente
            message: Mensaje descriptivo
            event_id: ID del evento procesado
            retry_after: Segundos para retry (si es error temporal)
            
        Returns:
            Dict con la respuesta
        """
        response = {
            "success": success,
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
            "processor": "nexus-crm"
        }
        
        if event_id:
            response["event_id"] = event_id
            
        if retry_after:
            response["retry_after"] = retry_after
            
        return response
    
    async def register_webhook_with_genesis(self) -> bool:
        """
        Registra este endpoint como webhook en GENESIS.
        
        Returns:
            bool: True si el registro fue exitoso
        """
        try:
            webhook_config = {
                "url": f"{settings.nexus_crm_base_url}/agent-usage/events",
                "secret": self.webhook_secret,
                "events": ["agent.usage", "agent.session.end"],
                "active": True,
                "retry_policy": {
                    "max_retries": 3,
                    "retry_delay": 5,
                    "backoff_multiplier": 2
                }
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.genesis_api_url}/webhooks/register",
                    json=webhook_config,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    logger.info("Webhook registrado exitosamente en GENESIS")
                    return True
                else:
                    logger.error(f"Error registrando webhook: {response.status_code} - {response.text}")
                    return False
                    
        except Exception as e:
            logger.error(f"Error registrando webhook con GENESIS: {e}")
            return False
    
    async def test_webhook_connectivity(self) -> Dict[str, Any]:
        """
        Prueba la conectividad con GENESIS.
        
        Returns:
            Dict con resultados de la prueba
        """
        try:
            test_payload = {
                "test": True,
                "timestamp": datetime.utcnow().isoformat(),
                "source": "nexus-crm"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.genesis_api_url}/webhooks/test",
                    json=test_payload,
                    timeout=10.0
                )
                
                return {
                    "success": response.status_code == 200,
                    "status_code": response.status_code,
                    "response_time_ms": response.elapsed.total_seconds() * 1000,
                    "response_data": response.json() if response.status_code == 200 else response.text
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "response_time_ms": 0
            }
    
    async def handle_webhook_failure(
        self, 
        webhook_payload: Dict[str, Any], 
        error: Exception,
        attempt: int = 1
    ) -> None:
        """
        Maneja fallos en el procesamiento de webhooks con retry logic.
        
        Args:
            webhook_payload: Payload original del webhook
            error: Error que ocurrió
            attempt: Número de intento actual
        """
        try:
            if attempt < self.max_retries:
                logger.warning(f"Reintentando webhook processing (intento {attempt + 1}): {error}")
                
                # Delay exponencial
                delay = self.retry_delay * (2 ** attempt)
                await asyncio.sleep(delay)
                
                # Aquí podrías llamar nuevamente al procesamiento
                # o encolar en un sistema de retry más robusto
                
            else:
                logger.error(f"Webhook falló después de {self.max_retries} intentos: {error}")
                
                # Enviar a dead letter queue o notificar a administradores
                await self.send_to_dead_letter_queue(webhook_payload, error)
                
        except Exception as e:
            logger.error(f"Error en manejo de fallo de webhook: {e}")
    
    async def send_to_dead_letter_queue(
        self, 
        webhook_payload: Dict[str, Any], 
        error: Exception
    ) -> None:
        """
        Envía webhooks fallidos a una cola de reintentos.
        
        Args:
            webhook_payload: Payload del webhook fallido
            error: Error que causó el fallo
        """
        try:
            dead_letter_data = {
                "payload": webhook_payload,
                "error": str(error),
                "failed_at": datetime.utcnow().isoformat(),
                "retry_count": self.max_retries,
                "source": "genesis-webhook"
            }
            
            # Aquí podrías enviar a Redis, RabbitMQ, o simplemente log
            logger.error(f"Webhook enviado a dead letter queue: {json.dumps(dead_letter_data)}")
            
            # También podrías notificar al equipo
            await self.notify_webhook_failure(dead_letter_data)
            
        except Exception as e:
            logger.error(f"Error enviando webhook a dead letter queue: {e}")
    
    async def notify_webhook_failure(self, failure_data: Dict[str, Any]) -> None:
        """
        Notifica fallos críticos de webhooks al equipo.
        
        Args:
            failure_data: Datos del fallo
        """
        try:
            # Aquí podrías integrar con Slack, email, PagerDuty, etc.
            notification_message = (
                f"🚨 Webhook Failure Alert\n"
                f"Source: {failure_data.get('source', 'unknown')}\n"
                f"Failed at: {failure_data.get('failed_at')}\n"
                f"Error: {failure_data.get('error')}\n"
                f"Retry count: {failure_data.get('retry_count')}"
            )
            
            logger.critical(notification_message)
            
            # Enviar notificación real aquí
            # await send_slack_notification(notification_message)
            # await send_email_alert(notification_message)
            
        except Exception as e:
            logger.error(f"Error enviando notificación de fallo: {e}")
    
    async def get_webhook_stats(self, days: int = 7) -> Dict[str, Any]:
        """
        Obtiene estadísticas de webhooks procesados.
        
        Args:
            days: Días hacia atrás para las estadísticas
            
        Returns:
            Dict con estadísticas
        """
        try:
            # Aquí podrías consultar una base de datos de logs de webhooks
            # Por ahora retornamos datos de ejemplo
            
            return {
                "period_days": days,
                "total_webhooks_received": 0,
                "successful_webhooks": 0,
                "failed_webhooks": 0,
                "average_processing_time_ms": 0,
                "last_webhook_received": None,
                "webhook_health": "healthy"  # healthy, degraded, critical
            }
            
        except Exception as e:
            logger.error(f"Error obteniendo estadísticas de webhooks: {e}")
            return {
                "error": str(e),
                "webhook_health": "unknown"
            }

# Instancia global del servicio
genesis_webhook_service = GenesisWebhookService()