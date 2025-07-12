# 🚀 NexusCRM - Sistema CRM Inteligente con IA para NGX

<div align="center">
  <img src="https://img.shields.io/badge/Status-Production%20Ready-success?style=for-the-badge" alt="Status">
  <img src="https://img.shields.io/badge/AI%20Powered-Claude%20Desktop-purple?style=for-the-badge" alt="AI Powered">
  <img src="https://img.shields.io/badge/Stack-React%20%7C%20FastAPI%20%7C%20Supabase-blue?style=for-the-badge" alt="Stack">
  <img src="https://img.shields.io/badge/Design-NGX%20GROK-black?style=for-the-badge" alt="Design">
</div>

## 📋 Descripción

**NexusCRM** es un sistema de gestión de relaciones con clientes (CRM) revolucionario que integra inteligencia artificial conversacional, analytics en tiempo real y automatización inteligente. Diseñado específicamente para el equipo interno de NGX, va más allá de un CRM tradicional al conectarse con el ecosistema de agentes HIE (Hybrid Intelligence Engine).

### 🌟 Características Principales

- **🤖 IA Conversacional**: Comandos naturales vía Claude Desktop
- **📊 Analytics en Tiempo Real**: Dashboard con métricas live
- **🔄 Integración GENESIS**: Tracking automático de uso de agentes HIE
- **💼 Pipeline Visual**: Kanban board con drag & drop
- **🚨 Alertas Inteligentes**: 6 tipos de alertas automáticas
- **📈 Predicción ML**: Churn risk y oportunidades de upsell
- **🎯 Auto-Upselling**: NGX_Closer.Agent para ventas automatizadas

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** + TypeScript
- **Tailwind CSS** + Shadcn/UI
- **Zustand** (State Management)
- **WebSocket** (Real-time updates)
- **Vite** (Build tool)

### Backend
- **FastAPI** + Python 3.9+
- **Pydantic v2** (Validation)
- **Supabase** (Database + Auth)
- **MCP Protocol** (AI Integration)

### IA & Analytics
- **Claude Desktop** (Conversational AI)
- **Model Context Protocol** (MCP)
- **Custom Analytics Engine**
- **Predictive ML Models**

## 🚀 Quick Start

### Prerrequisitos

- Node.js 18+
- Python 3.9+
- Supabase account
- Claude Desktop (para comandos IA)

### Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/270aldo/ngx.crm.git
cd ngx.crm
```

2. **Configurar variables de entorno**

Backend (`backend/.env`):
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GENESIS_WEBHOOK_SECRET=your_webhook_secret
NEXUS_CRM_BASE_URL=http://localhost:8001
```

Frontend (`frontend/.env`):
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

3. **Configurar base de datos**
```bash
# Ejecutar schemas en Supabase SQL Editor
database/schema.sql
database/agent_usage_schema.sql
```

4. **Instalar dependencias y ejecutar**

Backend:
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

MCP Server (para IA):
```bash
python nexus_crm_mcp_server.py
```

## 💬 Comandos IA Disponibles

### Gestión Básica
```bash
"Claude, crea un contacto para John Smith de TechCorp"
"¿Cómo está nuestro pipeline de ventas?"
"Genera el reporte diario del CRM"
"Muéstrame todos los deals en negociación"
```

### Analytics Avanzado
```bash
"¿Cómo está el uso de agentes HIE esta semana?"
"¿Hay clientes cerca de su límite de tokens?"
"Analiza patrones de uso del último mes"
"¿Qué clientes están en riesgo de churn?"
```

### Automatización
```bash
"Inicia secuencia de upgrade para usuario_123 a Elite"
"Genera propuestas de renewal para Q2"
"Activa campaña de reactivación para inactivos"
```

## 📊 Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    Claude Desktop                        │
│                  (Interfaz Conversacional)               │
└────────────────────────┬────────────────────────────────┘
                         │ MCP Protocol
┌────────────────────────▼────────────────────────────────┐
│                  NexusCRM Backend                        │
│            (FastAPI + Analytics Engine)                  │
└────────┬─────────────────────────────────┬──────────────┘
         │                                 │
┌────────▼────────┐              ┌─────────▼──────────┐
│  GENESIS Agents │              │   Supabase DB      │
│  (Usage Tracking)│              │  (PostgreSQL+RLS)  │
└─────────────────┘              └────────────────────┘
```

## 🔧 Configuración Avanzada

### Integración GENESIS

Para habilitar el tracking de agentes HIE:

1. En `GENESIS-NGX-AGENTS/backend/.env`:
```env
CRM_BASE_URL=http://localhost:8001
CRM_WEBHOOK_SECRET=your_webhook_secret
CRM_INTEGRATION_ENABLED=true
```

2. Verificar integración:
```bash
python test_system.py
```

### Configurar Claude Desktop

1. Copiar configuración:
```bash
cp claude_desktop_config.json ~/Library/Application\ Support/Claude/
```

2. Reiniciar Claude Desktop

3. El servidor MCP aparecerá en la lista de herramientas

## 📈 Métricas y KPIs

El sistema trackea automáticamente:

- **MRR** por tier de suscripción
- **Conversion Rate** de trials
- **Pipeline Velocity**
- **Agent Usage** (tokens, interacciones)
- **Churn Risk Score**
- **Upsell Opportunities**

## 🚨 Sistema de Alertas

### Tipos de Alertas
1. **Usage Limit Approaching** (80% del límite)
2. **Usage Limit Exceeded** (95%+ del límite)
3. **Churn Risk Detected** (basado en patrones)
4. **Upgrade Opportunity** (alto uso + tier bajo)
5. **Anomaly Detected** (patrones inusuales)
6. **Performance Degradation** (response time alto)

### Gestión de Alertas
```bash
"Claude, muéstrame las alertas activas"
"Marca la alerta XYZ como resuelta"
"¿Qué clientes necesitan atención urgente?"
```

## 🧪 Testing

```bash
# Test completo del sistema
python test_system.py

# Test de integración MCP
python test_mcp_integration.py

# Test de APIs
cd backend
python test_apis.py
```

## 📚 Documentación

- [Plan de Implementación](IMPLEMENTATION_PLAN_2025.md)
- [Integración con Agentes](README_AGENT_INTEGRATION.md)
- [Guía MCP](README_MCP_INTEGRATION.md)
- [API Documentation](API_DOCUMENTATION.md)
- [Deployment Guide](README_NGX_DEPLOYMENT.md)

## 🤝 Contribución

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Proprietary - NGX Internal Use Only

## 🏆 Créditos

- **Desarrollado para**: NGX Team
- **AI Assistant**: Claude (Anthropic)
- **Design System**: NGX GROK
- **Stack**: React + FastAPI + Supabase

## 📞 Soporte

- **Slack**: #nexuscrm-support
- **Email**: crm-support@ngx.com
- **Docs**: [crm.ngx.com/docs](https://crm.ngx.com/docs)

---

<div align="center">
  <p><strong>NexusCRM</strong> - Revolucionando la gestión comercial B2B con IA 🚀</p>
  <p>Hecho con ❤️ para el equipo NGX</p>
</div>