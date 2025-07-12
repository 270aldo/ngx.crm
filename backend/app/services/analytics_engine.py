"""
Analytics Engine para procesamiento de métricas de uso de agentes.

Este módulo proporciona análisis en tiempo real y generación de insights
sobre el uso de los agentes HIE de NGX.
"""

import asyncio
import json
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from collections import defaultdict
import statistics

from core.database import get_database
from core.logging_config import get_logger

logger = get_logger(__name__)

@dataclass
class UsageMetrics:
    """Métricas agregadas de uso."""
    period_start: datetime
    period_end: datetime
    total_interactions: int
    total_tokens: int
    unique_users: int
    unique_sessions: int
    avg_response_time: float
    agent_breakdown: Dict[str, Any]
    tier_breakdown: Dict[str, Any]
    peak_hours: List[int]
    conversion_insights: Dict[str, Any]

@dataclass
class UserUsageInsight:
    """Insight de uso para un usuario específico."""
    user_id: str
    subscription_tier: str
    usage_score: float  # 0-100
    risk_level: str  # low, medium, high, critical
    recommendations: List[str]
    predicted_churn_probability: float
    upgrade_opportunity: bool
    efficiency_metrics: Dict[str, float]

@dataclass
class AgentPerformanceMetrics:
    """Métricas de rendimiento por agente."""
    agent_id: str
    total_interactions: int
    avg_response_time: float
    success_rate: float
    user_satisfaction: float
    token_efficiency: float  # tokens per successful interaction
    peak_usage_hours: List[int]
    most_common_use_cases: List[str]

class AnalyticsEngine:
    """
    Motor de analytics para procesamiento de métricas de uso.
    """
    
    def __init__(self):
        self.cache_ttl = 300  # 5 minutos
        self.metrics_cache = {}
        self.insights_cache = {}
        
    async def calculate_usage_metrics(
        self, 
        start_date: datetime, 
        end_date: datetime,
        user_filter: Optional[str] = None,
        tier_filter: Optional[str] = None
    ) -> UsageMetrics:
        """
        Calcula métricas de uso para un período específico.
        
        Args:
            start_date: Fecha de inicio
            end_date: Fecha de fin
            user_filter: Filtrar por usuario específico
            tier_filter: Filtrar por tier específico
            
        Returns:
            Métricas de uso calculadas
        """
        try:
            db = await get_database()
            
            # Query base con filtros
            where_conditions = ["timestamp BETWEEN $1 AND $2"]
            params = [start_date, end_date]
            
            if user_filter:
                where_conditions.append(f"user_id = ${len(params) + 1}")
                params.append(user_filter)
            
            if tier_filter:
                where_conditions.append(f"subscription_tier = ${len(params) + 1}")
                params.append(tier_filter)
            
            where_clause = " AND ".join(where_conditions)
            
            # Query principal de métricas
            main_query = f"""
            SELECT 
                COUNT(*) as total_interactions,
                SUM(tokens_used) as total_tokens,
                COUNT(DISTINCT user_id) as unique_users,
                COUNT(DISTINCT session_id) as unique_sessions,
                AVG(response_time_ms) as avg_response_time,
                agent_id,
                subscription_tier,
                EXTRACT(HOUR FROM timestamp) as hour
            FROM agent_usage_events 
            WHERE {where_clause}
            GROUP BY agent_id, subscription_tier, EXTRACT(HOUR FROM timestamp)
            """
            
            results = await db.fetch(main_query, *params)
            
            # Procesar resultados
            total_interactions = sum(r['total_interactions'] for r in results)
            total_tokens = sum(r['total_tokens'] or 0 for r in results)
            unique_users = len(set(r['user_id'] for r in await db.fetch(
                f"SELECT DISTINCT user_id FROM agent_usage_events WHERE {where_clause}",
                *params
            )))
            unique_sessions = len(set(r['session_id'] for r in await db.fetch(
                f"SELECT DISTINCT session_id FROM agent_usage_events WHERE {where_clause}",
                *params
            )))
            
            # Calcular tiempo de respuesta promedio
            response_times = [r['avg_response_time'] for r in results if r['avg_response_time']]
            avg_response_time = statistics.mean(response_times) if response_times else 0
            
            # Breakdown por agente
            agent_breakdown = defaultdict(lambda: {
                'interactions': 0, 
                'tokens': 0, 
                'users': set(),
                'avg_response_time': 0
            })
            
            for r in results:
                agent_id = r['agent_id']
                agent_breakdown[agent_id]['interactions'] += r['total_interactions']
                agent_breakdown[agent_id]['tokens'] += r['total_tokens'] or 0
                
            # Convertir sets a counts
            for agent_id in agent_breakdown:
                agent_breakdown[agent_id]['users'] = len(agent_breakdown[agent_id]['users'])
            
            # Breakdown por tier
            tier_breakdown = defaultdict(lambda: {
                'interactions': 0, 
                'tokens': 0, 
                'users': set()
            })
            
            for r in results:
                tier = r['subscription_tier']
                tier_breakdown[tier]['interactions'] += r['total_interactions']
                tier_breakdown[tier]['tokens'] += r['total_tokens'] or 0
            
            # Convertir sets a counts
            for tier in tier_breakdown:
                tier_breakdown[tier]['users'] = len(tier_breakdown[tier]['users'])
            
            # Calcular horas pico
            hour_usage = defaultdict(int)
            for r in results:
                if r['hour'] is not None:
                    hour_usage[int(r['hour'])] += r['total_interactions']
            
            peak_hours = sorted(hour_usage.keys(), key=lambda h: hour_usage[h], reverse=True)[:3]
            
            # Insights de conversión
            conversion_insights = await self._calculate_conversion_insights(
                start_date, end_date, user_filter, tier_filter
            )
            
            return UsageMetrics(
                period_start=start_date,
                period_end=end_date,
                total_interactions=total_interactions,
                total_tokens=total_tokens,
                unique_users=unique_users,
                unique_sessions=unique_sessions,
                avg_response_time=avg_response_time,
                agent_breakdown=dict(agent_breakdown),
                tier_breakdown=dict(tier_breakdown),
                peak_hours=peak_hours,
                conversion_insights=conversion_insights
            )
            
        except Exception as e:
            logger.error(f"Error calculating usage metrics: {e}")
            raise
    
    async def generate_user_insights(self, user_id: str) -> UserUsageInsight:
        """
        Genera insights específicos para un usuario.
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Insights del usuario
        """
        try:
            db = await get_database()
            
            # Obtener datos del último mes
            end_date = datetime.now(timezone.utc)
            start_date = end_date - timedelta(days=30)
            
            # Query de uso del usuario
            user_query = """
            SELECT 
                COUNT(*) as interactions,
                SUM(tokens_used) as tokens,
                AVG(response_time_ms) as avg_response_time,
                subscription_tier,
                COUNT(DISTINCT agent_id) as agents_used,
                COUNT(DISTINCT DATE(timestamp)) as active_days,
                MIN(timestamp) as first_usage,
                MAX(timestamp) as last_usage
            FROM agent_usage_events 
            WHERE user_id = $1 AND timestamp >= $2
            GROUP BY subscription_tier
            """
            
            user_data = await db.fetchrow(user_query, user_id, start_date)
            
            if not user_data:
                # Usuario sin actividad reciente
                return UserUsageInsight(
                    user_id=user_id,
                    subscription_tier="unknown",
                    usage_score=0.0,
                    risk_level="critical",
                    recommendations=["Re-engage user with personalized content"],
                    predicted_churn_probability=0.95,
                    upgrade_opportunity=False,
                    efficiency_metrics={}
                )
            
            # Calcular score de uso (0-100)
            tier_limits = {
                'essential': 50000,
                'pro': 150000,
                'elite': 500000,
                'prime': 1000000,
                'longevity': 1000000
            }
            
            tier = user_data['subscription_tier']
            limit = tier_limits.get(tier, 50000)
            usage_percentage = (user_data['tokens'] / limit) * 100
            
            # Score basado en múltiples factores
            usage_score = min(100, (
                usage_percentage * 0.4 +  # 40% basado en uso de tokens
                (user_data['active_days'] / 30) * 100 * 0.3 +  # 30% basado en días activos
                (user_data['agents_used'] / 11) * 100 * 0.2 +  # 20% basado en diversidad de agentes
                min(100, (user_data['interactions'] / 100) * 100) * 0.1  # 10% basado en interacciones
            ))
            
            # Determinar nivel de riesgo
            if usage_score >= 80:
                risk_level = "low"
            elif usage_score >= 60:
                risk_level = "medium"
            elif usage_score >= 30:
                risk_level = "high"
            else:
                risk_level = "critical"
            
            # Predecir probabilidad de churn
            days_since_last = (end_date - user_data['last_usage']).days
            churn_probability = min(0.95, max(0.05, (
                (100 - usage_score) / 100 * 0.6 +
                (days_since_last / 30) * 0.4
            )))
            
            # Generar recomendaciones
            recommendations = []
            if usage_percentage > 80:
                recommendations.append(f"Consider upgrading to higher tier - using {usage_percentage:.1f}% of limit")
            if user_data['agents_used'] < 3:
                recommendations.append("Explore more agents to maximize value")
            if user_data['active_days'] < 15:
                recommendations.append("Increase engagement frequency")
            if user_data['avg_response_time'] > 2000:
                recommendations.append("Optimize queries for better performance")
            
            # Oportunidad de upgrade
            upgrade_opportunity = (
                usage_percentage > 70 and 
                tier in ['essential', 'pro'] and
                user_data['active_days'] > 20
            )
            
            # Métricas de eficiencia
            efficiency_metrics = {
                'tokens_per_interaction': user_data['tokens'] / max(1, user_data['interactions']),
                'interactions_per_day': user_data['interactions'] / max(1, user_data['active_days']),
                'agent_diversity': user_data['agents_used'] / 11,
                'engagement_consistency': user_data['active_days'] / 30
            }
            
            return UserUsageInsight(
                user_id=user_id,
                subscription_tier=tier,
                usage_score=usage_score,
                risk_level=risk_level,
                recommendations=recommendations,
                predicted_churn_probability=churn_probability,
                upgrade_opportunity=upgrade_opportunity,
                efficiency_metrics=efficiency_metrics
            )
            
        except Exception as e:
            logger.error(f"Error generating user insights for {user_id}: {e}")
            raise
    
    async def analyze_agent_performance(
        self, 
        agent_id: str, 
        days: int = 7
    ) -> AgentPerformanceMetrics:
        """
        Analiza el rendimiento de un agente específico.
        
        Args:
            agent_id: ID del agente
            days: Días hacia atrás para el análisis
            
        Returns:
            Métricas de rendimiento del agente
        """
        try:
            db = await get_database()
            
            end_date = datetime.now(timezone.utc)
            start_date = end_date - timedelta(days=days)
            
            # Query de rendimiento del agente
            perf_query = """
            SELECT 
                COUNT(*) as total_interactions,
                AVG(response_time_ms) as avg_response_time,
                SUM(tokens_used) as total_tokens,
                COUNT(DISTINCT user_id) as unique_users,
                EXTRACT(HOUR FROM timestamp) as hour,
                subscription_tier
            FROM agent_usage_events 
            WHERE agent_id = $1 AND timestamp >= $2
            GROUP BY EXTRACT(HOUR FROM timestamp), subscription_tier
            """
            
            results = await db.fetch(perf_query, agent_id, start_date)
            
            if not results:
                return AgentPerformanceMetrics(
                    agent_id=agent_id,
                    total_interactions=0,
                    avg_response_time=0.0,
                    success_rate=0.0,
                    user_satisfaction=0.0,
                    token_efficiency=0.0,
                    peak_usage_hours=[],
                    most_common_use_cases=[]
                )
            
            total_interactions = sum(r['total_interactions'] for r in results)
            total_tokens = sum(r['total_tokens'] or 0 for r in results)
            
            # Calcular tiempo de respuesta promedio
            response_times = [r['avg_response_time'] for r in results if r['avg_response_time']]
            avg_response_time = statistics.mean(response_times) if response_times else 0
            
            # Calcular eficiencia de tokens
            token_efficiency = total_tokens / max(1, total_interactions)
            
            # Calcular horas pico
            hour_usage = defaultdict(int)
            for r in results:
                if r['hour'] is not None:
                    hour_usage[int(r['hour'])] += r['total_interactions']
            
            peak_usage_hours = sorted(
                hour_usage.keys(), 
                key=lambda h: hour_usage[h], 
                reverse=True
            )[:3]
            
            # Simulación de métricas adicionales (en una implementación real,
            # estas vendrían de feedback de usuarios y métricas de éxito)
            success_rate = min(1.0, max(0.1, 1.0 - (avg_response_time / 10000)))
            user_satisfaction = min(1.0, max(0.1, 1.0 - (avg_response_time / 5000)))
            
            return AgentPerformanceMetrics(
                agent_id=agent_id,
                total_interactions=total_interactions,
                avg_response_time=avg_response_time,
                success_rate=success_rate,
                user_satisfaction=user_satisfaction,
                token_efficiency=token_efficiency,
                peak_usage_hours=peak_usage_hours,
                most_common_use_cases=[]  # Se implementaría con análisis de contexto
            )
            
        except Exception as e:
            logger.error(f"Error analyzing agent performance for {agent_id}: {e}")
            raise
    
    async def detect_usage_anomalies(
        self, 
        lookback_days: int = 7
    ) -> List[Dict[str, Any]]:
        """
        Detecta anomalías en patrones de uso.
        
        Args:
            lookback_days: Días hacia atrás para el análisis
            
        Returns:
            Lista de anomalías detectadas
        """
        try:
            db = await get_database()
            
            # Obtener datos de uso diario
            end_date = datetime.now(timezone.utc)
            start_date = end_date - timedelta(days=lookback_days)
            
            daily_usage_query = """
            SELECT 
                DATE(timestamp) as usage_date,
                COUNT(*) as daily_interactions,
                SUM(tokens_used) as daily_tokens,
                COUNT(DISTINCT user_id) as daily_users,
                agent_id
            FROM agent_usage_events 
            WHERE timestamp >= $1
            GROUP BY DATE(timestamp), agent_id
            ORDER BY usage_date, agent_id
            """
            
            results = await db.fetch(daily_usage_query, start_date)
            
            anomalies = []
            
            # Agrupar por agente
            agent_data = defaultdict(list)
            for r in results:
                agent_data[r['agent_id']].append({
                    'date': r['usage_date'],
                    'interactions': r['daily_interactions'],
                    'tokens': r['daily_tokens'],
                    'users': r['daily_users']
                })
            
            # Detectar anomalías por agente
            for agent_id, data in agent_data.items():
                if len(data) < 3:  # Necesitamos al menos 3 días de datos
                    continue
                
                # Calcular estadísticas
                interactions = [d['interactions'] for d in data]
                tokens = [d['tokens'] for d in data]
                
                if len(interactions) > 1:
                    mean_interactions = statistics.mean(interactions)
                    std_interactions = statistics.stdev(interactions) if len(interactions) > 1 else 0
                    
                    mean_tokens = statistics.mean(tokens)
                    std_tokens = statistics.stdev(tokens) if len(tokens) > 1 else 0
                    
                    # Detectar valores atípicos (más de 2 desviaciones estándar)
                    for i, d in enumerate(data):
                        if std_interactions > 0:
                            interaction_z_score = abs(d['interactions'] - mean_interactions) / std_interactions
                            if interaction_z_score > 2:
                                anomalies.append({
                                    'type': 'interaction_spike' if d['interactions'] > mean_interactions else 'interaction_drop',
                                    'agent_id': agent_id,
                                    'date': d['date'].isoformat(),
                                    'value': d['interactions'],
                                    'expected': mean_interactions,
                                    'severity': 'high' if interaction_z_score > 3 else 'medium',
                                    'description': f"Agent {agent_id} had {d['interactions']} interactions (expected ~{mean_interactions:.0f})"
                                })
                        
                        if std_tokens > 0:
                            token_z_score = abs(d['tokens'] - mean_tokens) / std_tokens
                            if token_z_score > 2:
                                anomalies.append({
                                    'type': 'token_spike' if d['tokens'] > mean_tokens else 'token_drop',
                                    'agent_id': agent_id,
                                    'date': d['date'].isoformat(),
                                    'value': d['tokens'],
                                    'expected': mean_tokens,
                                    'severity': 'high' if token_z_score > 3 else 'medium',
                                    'description': f"Agent {agent_id} used {d['tokens']} tokens (expected ~{mean_tokens:.0f})"
                                })
            
            return anomalies
            
        except Exception as e:
            logger.error(f"Error detecting usage anomalies: {e}")
            return []
    
    async def generate_executive_summary(
        self, 
        days: int = 7
    ) -> Dict[str, Any]:
        """
        Genera resumen ejecutivo de analytics.
        
        Args:
            days: Días hacia atrás para el resumen
            
        Returns:
            Resumen ejecutivo con métricas clave
        """
        try:
            end_date = datetime.now(timezone.utc)
            start_date = end_date - timedelta(days=days)
            
            # Obtener métricas principales
            metrics = await self.calculate_usage_metrics(start_date, end_date)
            
            # Detectar anomalías
            anomalies = await self.detect_usage_anomalies(days)
            
            # Calcular tendencias (comparar con período anterior)
            prev_start = start_date - timedelta(days=days)
            prev_metrics = await self.calculate_usage_metrics(prev_start, start_date)
            
            # Calcular cambios porcentuales
            interaction_change = self._calculate_percentage_change(
                prev_metrics.total_interactions, 
                metrics.total_interactions
            )
            
            token_change = self._calculate_percentage_change(
                prev_metrics.total_tokens, 
                metrics.total_tokens
            )
            
            user_change = self._calculate_percentage_change(
                prev_metrics.unique_users, 
                metrics.unique_users
            )
            
            # Top agentes
            top_agents = sorted(
                metrics.agent_breakdown.items(),
                key=lambda x: x[1]['interactions'],
                reverse=True
            )[:5]
            
            # Insights clave
            key_insights = []
            
            if interaction_change > 20:
                key_insights.append(f"Interacciones aumentaron {interaction_change:.1f}% - excelente crecimiento")
            elif interaction_change < -10:
                key_insights.append(f"Interacciones disminuyeron {abs(interaction_change):.1f}% - necesita atención")
            
            if len(anomalies) > 0:
                key_insights.append(f"Detectadas {len(anomalies)} anomalías en patrones de uso")
            
            if metrics.unique_users > prev_metrics.unique_users:
                key_insights.append(f"Aumento de {user_change:.1f}% en usuarios activos")
            
            return {
                'period': {
                    'start': start_date.isoformat(),
                    'end': end_date.isoformat(),
                    'days': days
                },
                'key_metrics': asdict(metrics),
                'trends': {
                    'interactions_change': interaction_change,
                    'tokens_change': token_change,
                    'users_change': user_change
                },
                'top_agents': top_agents,
                'anomalies_count': len(anomalies),
                'anomalies': anomalies[:5],  # Top 5 anomalías
                'key_insights': key_insights,
                'generated_at': datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error generating executive summary: {e}")
            raise
    
    async def _calculate_conversion_insights(
        self, 
        start_date: datetime, 
        end_date: datetime,
        user_filter: Optional[str] = None,
        tier_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Calcula insights de conversión y upselling.
        """
        try:
            # Simulación de insights de conversión
            # En una implementación real, esto analizaría cambios de tier,
            # patrones de uso que indican oportunidades de upsell, etc.
            
            return {
                'potential_upgrades': 0,
                'churn_risk_users': 0,
                'high_value_users': 0,
                'conversion_opportunities': []
            }
            
        except Exception as e:
            logger.error(f"Error calculating conversion insights: {e}")
            return {}
    
    def _calculate_percentage_change(self, old_value: float, new_value: float) -> float:
        """
        Calcula cambio porcentual entre dos valores.
        """
        if old_value == 0:
            return 100.0 if new_value > 0 else 0.0
        
        return ((new_value - old_value) / old_value) * 100

# Instancia global del analytics engine
analytics_engine = AnalyticsEngine()