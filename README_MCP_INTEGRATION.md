# 🔗 NexusCRM MCP Integration Guide

## Integración de Model Context Protocol con Claude Desktop para NGX

Esta guía te permitirá integrar NexusCRM con Claude Desktop usando Model Context Protocol (MCP), habilitando interacción natural con el CRM mediante lenguaje conversacional.

---

## 🎯 **¿Qué es MCP?**

Model Context Protocol (MCP) es un estándar abierto que permite a los asistentes de IA conectarse con sistemas de datos y herramientas empresariales. Con esta integración, podrás:

- **Hablar naturalmente con tu CRM**: "Claude, muéstrame los deals en negociación"
- **Automatizar tareas**: "Crea un contacto para John Smith de TechCorp"
- **Generar reportes**: "Dame un resumen de analytics de este mes"
- **Gestionar pipeline**: "Mueve el deal de HealthPlus a la etapa de propuesta"

---

## 🛠️ **Instalación Rápida**

### Paso 1: Instalar Dependencias
```bash
cd /Users/aldoolivas/Desktop/nexus-crm
python3 install_mcp_dependencies.py
```

### Paso 2: Configurar Variables de Entorno
```bash
# Copiar template de configuración
cp .env.example .env

# Editar con tus credenciales de Supabase
nano .env
```

Agregar tus credenciales:
```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

### Paso 3: Configurar Claude Desktop

**macOS:**
```bash
# Copiar configuración a Claude Desktop
cp claude_desktop_config.json ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Editar el archivo para ajustar las rutas:**
```json
{
  "mcpServers": {
    "nexus-crm": {
      "command": "python3",
      "args": [
        "/Users/aldoolivas/Desktop/nexus-crm/nexus_crm_mcp_server.py"
      ],
      "env": {
        "SUPABASE_URL": "https://tu-proyecto.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "tu_service_role_key"
      }
    }
  }
}
```

### Paso 4: Probar la Integración
```bash
python3 test_mcp_integration.py
```

### Paso 5: Reiniciar Claude Desktop
1. Cierra completamente Claude Desktop
2. Abre Claude Desktop nuevamente
3. Busca el ícono de herramientas MCP en la interfaz

---

## 🎮 **Funcionalidades Disponibles**

### 🛠️ **Tools (Herramientas Ejecutables)**

#### Gestión de Contactos
- `create_contact()` - Crear nuevos contactos
- `search_contacts()` - Buscar contactos con filtros
- `update_contact()` - Actualizar información

#### Pipeline de Deals
- `create_deal()` - Crear nuevas oportunidades
- `get_pipeline_status()` - Ver estado del pipeline
- `move_deal_stage()` - Mover deals entre etapas

#### Gestión de Leads
- `create_lead()` - Registrar nuevos leads
- `convert_lead_to_contact()` - Convertir leads calificados

#### Sistema de Tareas
- `create_task()` - Crear tareas y asignaciones

#### Analytics
- `get_analytics_summary()` - Obtener métricas y KPIs

### 📊 **Resources (Datos Accesibles)**

- `contacts://recent` - Contactos recientes
- `deals://pipeline` - Estado actual del pipeline
- `leads://queue` - Cola de leads pendientes
- `tasks://pending` - Tareas pendientes

### 🎯 **Prompts (Automatización)**

- `daily_crm_report` - Reporte diario automatizado
- `lead_follow_up` - Estrategia de seguimiento de leads
- `deal_forecast` - Pronóstico de ventas
- `contact_summary` - Resumen completo de contacto

---

## 💬 **Ejemplos de Uso en Claude Desktop**

### Gestión de Contactos
```
Usuario: "Claude, crea un contacto para Sarah Johnson de Innovate Solutions, 
         está interesada en el programa LONGEVITY y la conocimos en LinkedIn"

Claude: [Usa create_contact() automáticamente]
✅ Contact created successfully!
📋 Contact: Sarah Johnson
🏢 Company: Innovate Solutions
🎯 Program: LONGEVITY
📍 Source: LinkedIn
```

### Consultar Pipeline
```
Usuario: "¿Cómo está nuestro pipeline de ventas?"

Claude: [Usa get_pipeline_status() automáticamente]
📊 NGX SALES PIPELINE REPORT
💰 Total Pipeline Value: $750,000.00
📈 Total Deals: 5

🎯 Negotiation
   💼 Deals: 2
   💰 Value: $200,000.00
```

### Crear Leads
```
Usuario: "Registra un lead: Alex Martinez de StartupX, 
         vino por el website y tiene score 85"

Claude: [Usa create_lead() automáticamente]
✅ Lead created successfully!
🎯 Lead: Alex Martinez
🏢 Company: StartupX
⭐ Score: 85/100
```

### Generar Reportes
```
Usuario: "Dame un reporte diario del CRM"

Claude: [Usa daily_crm_report prompt]
📊 NGX CRM ANALYTICS DASHBOARD
👥 CONTACTS: 15 total, 12 active
🎯 LEADS: 8 total, 2 converted (25% conversion)
💼 DEALS: $750,000 pipeline value
```

---

## 🔧 **Comandos de Administración**

### Iniciar Servidor MCP
```bash
./start_mcp_server.sh
```

### Probar Conexión
```bash
python3 test_mcp_integration.py
```

### Ver Logs
```bash
tail -f logs/mcp_server_*.log
```

### Detener Servidor
```bash
pkill -f nexus_crm_mcp_server.py
```

---

## 🔍 **Resolución de Problemas**

### Problema: Claude Desktop no muestra herramientas MCP
**Solución:**
1. Verifica que el archivo de configuración esté en la ubicación correcta
2. Reinicia Claude Desktop completamente
3. Ejecuta `python3 test_mcp_integration.py` para verificar

### Problema: Error de conexión a Supabase
**Solución:**
1. Verifica las credenciales en `.env`
2. Asegúrate de que las credenciales están también en `claude_desktop_config.json`
3. Prueba la conexión: `python3 test_mcp_integration.py`

### Problema: Dependencias faltantes
**Solución:**
```bash
python3 install_mcp_dependencies.py
```

### Problema: Permisos de archivo
**Solución:**
```bash
chmod +x start_mcp_server.sh
chmod +x nexus_crm_mcp_server.py
```

---

## 📈 **Casos de Uso Avanzados NGX**

### Automatización de Seguimientos
```
"Claude, revisa todos los leads nuevos y crea tareas de seguimiento 
para los que tienen score mayor a 70"
```

### Análisis de Pipeline
```
"Analiza nuestro pipeline y dime qué deals están en riesgo de perderse"
```

### Reportes Ejecutivos
```
"Genera un reporte ejecutivo con métricas del mes y recomendaciones 
para el equipo de ventas"
```

### Gestión de Relaciones
```
"Muéstrame el historial completo de TechCorp y sugiere próximas acciones"
```

---

## 🎯 **Beneficios para NGX**

### **Productividad 10x**
- Tareas que tomaban 10 minutos ahora toman 30 segundos
- Automatización de reportes y seguimientos
- Menos tiempo en administración, más en ventas

### **Acceso Natural**
- Interacción con el CRM usando lenguaje natural
- No necesitas recordar interfaces complejas
- Claude entiende el contexto NGX (PRIME, LONGEVITY, CUSTOM)

### **Inteligencia Comercial**
- Analytics automáticos y reportes inteligentes
- Sugerencias de próximas acciones
- Identificación de oportunidades y riesgos

### **Escalabilidad**
- Sistema preparado para crecimiento del equipo
- Fácil adición de nuevas funcionalidades
- Integración con otros sistemas empresariales

---

## 📞 **Soporte y Recursos**

### Archivos de Configuración
- `nexus_crm_mcp_server.py` - Servidor MCP principal
- `claude_desktop_config.json` - Configuración para Claude Desktop
- `.env` - Variables de entorno (credenciales)

### Scripts de Utilidad
- `install_mcp_dependencies.py` - Instalador automático
- `test_mcp_integration.py` - Pruebas de integración
- `start_mcp_server.sh` - Iniciador del servidor

### Logs y Debugging
- `logs/mcp_server_*.log` - Logs del servidor MCP
- `backend/server.log` - Logs del backend API
- `frontend/frontend.log` - Logs del frontend

---

## 🚀 **Próximos Pasos**

1. **Completar instalación** siguiendo esta guía
2. **Probar funcionalidades básicas** con Claude Desktop
3. **Entrenar al equipo** en comandos naturales
4. **Personalizar prompts** para workflows NGX específicos
5. **Expandir integraciones** con otros sistemas empresariales

---

## 🎉 **¡Listo para Revolutionar tu CRM!**

Con esta integración, el equipo NGX tendrá acceso a un CRM inteligente que entiende lenguaje natural y automatiza tareas complejas. Claude Desktop se convierte en tu asistente personal de ventas, capaz de gestionar contactos, analizar pipelines y generar insights empresariales.

**¡El futuro de la gestión comercial está aquí!** 🚀