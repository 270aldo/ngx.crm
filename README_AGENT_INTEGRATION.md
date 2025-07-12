# 🤖 Integración GENESIS × NexusCRM × NGX_Closer.Agent

## 🎯 Visión General

Este documento describe la integración completa entre los tres sistemas principales de NGX:

- **GENESIS**: Plataforma donde clientes usan los agentes HIE
- **NexusCRM**: Centro de comando para el equipo NGX
- **NGX_Closer.Agent**: Agente de ventas automatizado via MCP

## 🏗️ Arquitectura de Integración

```
[Clientes NGX] → [GENESIS Frontend] → [GENESIS Backend]
                                            ↓
                                    [Usage Events Webhook]
                                            ↓
                                      [NexusCRM Backend]
                                            ↓
                              [Analytics Engine + Alerts]
                                            ↓
                                    [NGX_Closer.Agent MCP]
                                            ↓
                                    [Claude Desktop Interface]
```

## 📊 Flujo de Datos en Tiempo Real

### 1. Captura de Eventos (GENESIS → NexusCRM)

**Archivo**: `GENESIS-NGX-AGENTS/backend/app/services/crm_integration.py`

```python
# Cada vez que un cliente usa un agente en GENESIS:
await track_agent_usage(
    user_id="cliente_123",
    agent_id="NEXUS",
    session_id="session_abc",
    tokens_used=150,
    response_time_ms=1200,
    subscription_tier="pro"
)
```

**Webhook Endpoint**: `POST /agent-usage/events`

### 2. Procesamiento Analytics (NexusCRM)

**Archivo**: `backend/app/apis/agent_usage/__init__.py`

- ✅ Validación de límites por tier
- ✅ Agregación de métricas diarias
- ✅ Detección de anomalías
- ✅ Generación de alertas automáticas
- ✅ Broadcasting WebSocket en tiempo real

### 3. Inteligencia Artificial (NGX_Closer.Agent)

**Archivo**: `nexus_crm_mcp_server.py`

Comandos naturales disponibles:

```bash
"Claude, ¿cómo está el uso de agentes esta semana?"
→ get_agent_usage_insights(days=7)

"¿Hay algún cliente cerca de su límite?"
→ get_usage_alerts()

"Analiza patrones de uso del último mes"
→ analyze_usage_patterns(days=30)

"Inicia secuencia de upgrade para usuario pro_user_123 a elite"
→ trigger_upsell_sequence(user_id="pro_user_123", recommended_tier="elite", reason="High usage pattern")
```

## 🛠️ Componentes Implementados

### 1. Backend Analytics Engine

**Archivos Principales**:
- `backend/app/apis/agent_usage/__init__.py` - API endpoints
- `backend/app/services/analytics_engine.py` - Motor de analytics
- `backend/app/services/intelligent_alerts.py` - Sistema de alertas
- `backend/app/services/genesis_webhook.py` - Manejo de webhooks

**Funcionalidades**:
- ✅ Tracking de uso por agente (NEXUS, BLAZE, SAGE, etc.)
- ✅ Límites por tier (Essential, Pro, Elite, PRIME, LONGEVITY)
- ✅ Alertas automáticas (80% y 95% de límite)
- ✅ Detección de anomalías con Z-score
- ✅ Predicción de churn basada en patrones
- ✅ Identificación de oportunidades de upgrade

### 2. Frontend Dashboard

**Archivo**: `frontend/src/components/LiveAgentUsage.tsx`

**Características**:
- ✅ Dashboard en tiempo real con WebSocket
- ✅ Métricas agregadas (interacciones, tokens, usuarios)
- ✅ Visualización por agente con iconografía
- ✅ Alertas en tiempo real
- ✅ Actividad reciente con timestamps
- ✅ Estados de tier con colores

### 3. Base de Datos

**Archivo**: `database/agent_usage_schema.sql`

**Tablas Principales**:
- `agent_usage_events` - Eventos individuales de uso
- `agent_usage_daily` - Agregados diarios optimizados
- `usage_alerts` - Sistema de alertas
- `usage_tier_limits` - Configuración de límites por tier

**Funciones SQL**:
- `calculate_usage_percentage()` - Calcula % de uso vs límites
- `detect_usage_anomalies()` - Detecta patrones anómalos

### 4. MCP Integration (NGX_Closer.Agent)

**Herramientas Añadidas**:

```python
@mcp.tool()
def get_agent_usage_insights(query: AgentUsageQuery) -> str:
    """Análisis comprehensivo de uso de agentes HIE"""

@mcp.tool()
def get_usage_alerts() -> str:
    """Alertas activas de límites y churn risk"""

@mcp.tool()
def trigger_upsell_sequence(user_id: str, recommended_tier: str, reason: str) -> str:
    """Inicia secuencia automática de upgrade"""

@mcp.tool()
def analyze_usage_patterns(days: int = 30) -> str:
    """Análisis de patrones para insights de negocio"""

@mcp.tool()
def manage_usage_alert(alert_input: AlertInput) -> str:
    """Gestión de alertas (acknowledge, resolve, dismiss)"""
```

**Prompts Especializados**:

```python
@mcp.prompt("agent_usage_report")
def generate_agent_usage_report() -> str:
    """Reporte ejecutivo de uso de agentes"""

@mcp.prompt("customer_health_check")
def generate_customer_health_check() -> str:
    """Assessment de salud de clientes basado en uso"""
```

## 🚀 Casos de Uso Prácticos

### Ejemplo 1: Monitoreo Diario

```bash
# El equipo NGX cada mañana puede preguntar:
"Claude, genera el reporte diario de uso de agentes"

# Claude ejecutará:
# 1. get_agent_usage_insights(days=1)
# 2. get_usage_alerts()
# 3. analyze_usage_patterns(days=7)
# 4. Generará reporte comprehensivo con insights
```

### Ejemplo 2: Cliente Aproximándose al Límite

```bash
# Sistema detecta que cliente_pro_456 está en 85% de su límite
# Alerta automática se genera y aparece en dashboard

# Equipo NGX ve la alerta y pregunta:
"Claude, analiza el patrón de uso de cliente_pro_456"

# Claude obtiene insights específicos y recomienda:
"Cliente muestra uso consistente y alto engagement. 
Recomiendo upgrade a Elite. ¿Inicio secuencia de venta?"

# Equipo confirma:
"Sí, inicia upgrade para cliente_pro_456 a elite"

# Claude ejecuta trigger_upsell_sequence() y NGX_Closer.Agent 
# inicia contacto personalizado automatizado
```

### Ejemplo 3: Análisis de Churn Risk

```bash
# Sistema detecta patrón de bajo uso en cliente_elite_789
# Alerta de churn risk se genera

"Claude, ¿qué clientes están en riesgo de churn?"

# Claude identifica clientes con:
# - Bajo uso por días
# - Patrones de disminución
# - Elite/PRIME con usage < 30%

# Genera estrategia de retención automática
```

## 📊 Métricas y KPIs Disponibles

### Métricas en Tiempo Real
- **Interacciones totales** por día/semana/mes
- **Tokens consumidos** vs límites por tier
- **Usuarios activos** por tier
- **Tiempo de respuesta promedio** por agente
- **Uso por agente HIE** (NEXUS, BLAZE, SAGE, etc.)

### Alertas Inteligentes
- **Usage Limit Approaching** (80% de límite)
- **Usage Limit Exceeded** (95%+ de límite)
- **Churn Risk Detected** (bajo uso + patrón descendente)
- **Upgrade Opportunity** (alto uso + tier bajo)
- **Anomaly Detected** (patrones inusuales)
- **Performance Degradation** (response time alto)

### Business Intelligence
- **Conversion Rate** por tier
- **Revenue Opportunity** identificado por IA
- **Agent Performance** metrics
- **Customer Lifetime Value** prediction
- **Churn Probability** por cliente

## 🔧 Configuración y Deployment

### Variables de Entorno Requeridas

```bash
# NexusCRM Backend
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GENESIS_WEBHOOK_SECRET=shared_secret_with_genesis
NEXUS_CRM_BASE_URL=http://localhost:8001

# GENESIS Backend
CRM_BASE_URL=http://localhost:8001
CRM_WEBHOOK_SECRET=shared_secret_with_crm
CRM_INTEGRATION_ENABLED=true
```

### Pasos de Inicialización

1. **Base de Datos**:
```bash
# Ejecutar schema de agent usage
psql -d nexus_crm -f database/agent_usage_schema.sql
```

2. **Backend NexusCRM**:
```bash
cd backend
uvicorn main:app --reload --port 8001
```

3. **Backend GENESIS**:
```bash
cd GENESIS-NGX-AGENTS/backend
uvicorn main:app --reload --port 8000
```

4. **Frontend**:
```bash
cd frontend
npm run dev
```

5. **MCP Server**:
```bash
python nexus_crm_mcp_server.py
```

## 🎯 Próximos Pasos

### Fase 2: Machine Learning Avanzado
- [ ] Modelo predictivo de churn con 95% precisión
- [ ] Optimización automática de precios por uso
- [ ] Recomendaciones de agentes por industria
- [ ] Forecasting de demanda por agent

### Fase 3: Automatización Completa
- [ ] Auto-upselling sin intervención humana
- [ ] Balanceeo automático de carga entre agentes
- [ ] Optimización dinámica de response time
- [ ] Self-healing de performance issues

### Fase 4: Ecosystem Integration
- [ ] Integración con sistemas de facturación
- [ ] APIs públicas para partners
- [ ] Mobile apps con notificaciones push
- [ ] Voice commands para analytics

## 💰 ROI Proyectado

**Primer Año**:
- **+40%** en conversiones de upgrade automáticas
- **-25%** en churn rate con alertas predictivas
- **+30%** en revenue per user
- **-50%** en tiempo de gestión manual

**Métricas de Éxito**:
- Tiempo de respuesta a alertas: < 1 hora
- Precisión de predicciones: > 85%
- Automatización de tareas: > 80%
- Satisfacción del equipo NGX: > 95%

## 🔒 Seguridad y Compliance

- ✅ **Autenticación**: JWT + API Keys + HMAC signatures
- ✅ **Encriptación**: TLS 1.3 para toda comunicación
- ✅ **Rate Limiting**: Protección contra abuse
- ✅ **Audit Trail**: Log completo de eventos
- ✅ **Data Privacy**: GDPR/CCPA compliance
- ✅ **RLS**: Row Level Security en Supabase

---

## 🎉 Resultado Final

La integración completa GENESIS × NexusCRM × NGX_Closer.Agent crea un ecosistema único donde:

1. **Clientes** usan agentes HIE en GENESIS de forma natural
2. **Sistema** trackea automáticamente todo el uso en tiempo real
3. **IA** analiza patrones y predice oportunidades
4. **Equipo NGX** toma decisiones basadas en datos precisos
5. **Ventas** se automatizan con NGX_Closer.Agent inteligente

**El futuro de la gestión comercial B2B con IA está aquí para NGX** 🚀