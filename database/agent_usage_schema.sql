-- Schema para tracking de uso de agentes NGX
-- Integración GENESIS → NexusCRM

-- Tabla principal de eventos de uso
CREATE TABLE IF NOT EXISTS agent_usage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    agent_id TEXT NOT NULL, -- NEXUS, BLAZE, SAGE, ARIA, CIPHER, ECHO, etc.
    session_id TEXT NOT NULL,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    response_time_ms INTEGER NOT NULL DEFAULT 0,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    subscription_tier TEXT NOT NULL DEFAULT 'essential',
    organization_id TEXT,
    context JSONB, -- Metadatos adicionales del contexto
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Índices para consultas frecuentes
    INDEX idx_agent_usage_events_user_id (user_id),
    INDEX idx_agent_usage_events_timestamp (timestamp),
    INDEX idx_agent_usage_events_agent_id (agent_id),
    INDEX idx_agent_usage_events_tier (subscription_tier),
    INDEX idx_agent_usage_events_user_timestamp (user_id, timestamp)
);

-- Tabla agregada diaria para optimizar consultas
CREATE TABLE IF NOT EXISTS agent_usage_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    user_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    total_interactions INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    avg_response_time DECIMAL(10,2) NOT NULL DEFAULT 0,
    subscription_tier TEXT NOT NULL DEFAULT 'essential',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint única por fecha-usuario-agente
    UNIQUE(date, user_id, agent_id),
    
    -- Índices
    INDEX idx_agent_usage_daily_date (date),
    INDEX idx_agent_usage_daily_user_id (user_id),
    INDEX idx_agent_usage_daily_agent_id (agent_id)
);

-- Tabla de alertas de uso
CREATE TABLE IF NOT EXISTS usage_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    alert_type TEXT NOT NULL, -- approaching_limit, limit_exceeded, anomaly_detected, upgrade_recommended
    message TEXT NOT NULL,
    threshold DECIMAL(10,2) NOT NULL, -- Umbral que disparó la alerta
    current_value DECIMAL(10,2) NOT NULL, -- Valor actual
    severity TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    auto_resolved BOOLEAN DEFAULT FALSE,
    metadata JSONB, -- Datos adicionales de la alerta
    
    -- Índices
    INDEX idx_usage_alerts_user_id (user_id),
    INDEX idx_usage_alerts_type (alert_type),
    INDEX idx_usage_alerts_severity (severity),
    INDEX idx_usage_alerts_triggered (triggered_at),
    INDEX idx_usage_alerts_unresolved (resolved_at) WHERE resolved_at IS NULL
);

-- Tabla de configuración de límites por tier
CREATE TABLE IF NOT EXISTS usage_tier_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_name TEXT NOT NULL UNIQUE, -- essential, pro, elite, prime, longevity
    monthly_token_limit INTEGER NOT NULL DEFAULT 0,
    daily_interaction_limit INTEGER NOT NULL DEFAULT 0,
    allowed_agents TEXT[] NOT NULL DEFAULT '{}', -- Array de agentes permitidos
    features JSONB, -- Características adicionales del tier
    pricing_monthly DECIMAL(10,2),
    pricing_total DECIMAL(10,2), -- Para programas
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insertar límites por tier inicial
INSERT INTO usage_tier_limits (tier_name, monthly_token_limit, daily_interaction_limit, allowed_agents, pricing_monthly, features) VALUES
('essential', 50000, 100, '["NEXUS", "BLAZE"]', 79, '{"support": "email", "response_time": "48h"}'),
('pro', 150000, 300, '["NEXUS", "BLAZE", "SAGE", "ARIA"]', 149, '{"support": "priority", "response_time": "24h"}'),
('elite', 500000, 1000, '["NEXUS", "BLAZE", "SAGE", "ARIA", "CIPHER", "ECHO"]', 199, '{"support": "dedicated", "response_time": "4h"}'),
('prime', 1000000, 2000, '["*"]', NULL, '{"support": "white_glove", "coaching": true, "response_time": "1h"}'),
('longevity', 1000000, 2000, '["*"]', NULL, '{"support": "white_glove", "research_access": true, "response_time": "1h"}')
ON CONFLICT (tier_name) DO NOTHING;

-- Vista para analytics rápidos
CREATE OR REPLACE VIEW agent_usage_analytics AS
SELECT 
    u.user_id,
    u.subscription_tier,
    DATE_TRUNC('day', u.timestamp) as usage_date,
    u.agent_id,
    COUNT(*) as interactions,
    SUM(u.tokens_used) as tokens_used,
    AVG(u.response_time_ms) as avg_response_time,
    COUNT(DISTINCT u.session_id) as unique_sessions,
    MAX(u.timestamp) as last_interaction
FROM agent_usage_events u
GROUP BY u.user_id, u.subscription_tier, DATE_TRUNC('day', u.timestamp), u.agent_id;

-- Vista para alertas activas
CREATE OR REPLACE VIEW active_usage_alerts AS
SELECT 
    a.*,
    c.name as contact_name,
    c.email as contact_email,
    c.company as contact_company
FROM usage_alerts a
LEFT JOIN contacts c ON a.contact_id = c.id
WHERE a.resolved_at IS NULL
ORDER BY a.triggered_at DESC;

-- Vista para uso mensual actual
CREATE OR REPLACE VIEW current_month_usage AS
SELECT 
    user_id,
    subscription_tier,
    agent_id,
    COUNT(*) as monthly_interactions,
    SUM(tokens_used) as monthly_tokens,
    AVG(response_time_ms) as avg_response_time,
    COUNT(DISTINCT DATE_TRUNC('day', timestamp)) as active_days,
    MIN(timestamp) as first_interaction,
    MAX(timestamp) as last_interaction
FROM agent_usage_events
WHERE timestamp >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY user_id, subscription_tier, agent_id;

-- Función para calcular porcentaje de uso
CREATE OR REPLACE FUNCTION calculate_usage_percentage(
    p_user_id TEXT,
    p_tier TEXT DEFAULT NULL
) RETURNS TABLE (
    usage_type TEXT,
    current_value INTEGER,
    limit_value INTEGER,
    percentage DECIMAL(5,2),
    status TEXT
) AS $$
BEGIN
    -- Si no se proporciona tier, obtenerlo del uso más reciente
    IF p_tier IS NULL THEN
        SELECT subscription_tier INTO p_tier
        FROM agent_usage_events
        WHERE user_id = p_user_id
        ORDER BY timestamp DESC
        LIMIT 1;
    END IF;

    -- Calcular uso de tokens mensual
    RETURN QUERY
    WITH monthly_usage AS (
        SELECT 
            SUM(tokens_used) as total_tokens,
            COUNT(*) as total_interactions
        FROM agent_usage_events
        WHERE user_id = p_user_id
        AND timestamp >= DATE_TRUNC('month', CURRENT_DATE)
    ),
    tier_limits AS (
        SELECT 
            monthly_token_limit,
            daily_interaction_limit
        FROM usage_tier_limits
        WHERE tier_name = p_tier
    )
    SELECT 
        'tokens'::TEXT,
        COALESCE(mu.total_tokens, 0)::INTEGER,
        tl.monthly_token_limit,
        ROUND((COALESCE(mu.total_tokens, 0)::DECIMAL / tl.monthly_token_limit) * 100, 2),
        CASE 
            WHEN COALESCE(mu.total_tokens, 0)::DECIMAL / tl.monthly_token_limit >= 0.9 THEN 'critical'
            WHEN COALESCE(mu.total_tokens, 0)::DECIMAL / tl.monthly_token_limit >= 0.75 THEN 'warning'
            ELSE 'ok'
        END::TEXT
    FROM monthly_usage mu
    CROSS JOIN tier_limits tl

    UNION ALL

    SELECT 
        'daily_interactions'::TEXT,
        COALESCE(daily_interactions, 0)::INTEGER,
        tl.daily_interaction_limit,
        ROUND((COALESCE(daily_interactions, 0)::DECIMAL / tl.daily_interaction_limit) * 100, 2),
        CASE 
            WHEN COALESCE(daily_interactions, 0)::DECIMAL / tl.daily_interaction_limit >= 0.9 THEN 'critical'
            WHEN COALESCE(daily_interactions, 0)::DECIMAL / tl.daily_interaction_limit >= 0.75 THEN 'warning'
            ELSE 'ok'
        END::TEXT
    FROM (
        SELECT COUNT(*) as daily_interactions
        FROM agent_usage_events
        WHERE user_id = p_user_id
        AND DATE_TRUNC('day', timestamp) = CURRENT_DATE
    ) daily
    CROSS JOIN tier_limits tl;
END;
$$ LANGUAGE plpgsql;

-- Función para detectar anomalías de uso
CREATE OR REPLACE FUNCTION detect_usage_anomalies(
    p_user_id TEXT,
    p_days_lookback INTEGER DEFAULT 7
) RETURNS TABLE (
    anomaly_type TEXT,
    description TEXT,
    severity TEXT,
    detected_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    WITH recent_usage AS (
        SELECT 
            DATE_TRUNC('day', timestamp) as usage_date,
            COUNT(*) as daily_interactions,
            SUM(tokens_used) as daily_tokens,
            AVG(response_time_ms) as avg_response_time
        FROM agent_usage_events
        WHERE user_id = p_user_id
        AND timestamp >= CURRENT_DATE - INTERVAL '%s days' % p_days_lookback
        GROUP BY DATE_TRUNC('day', timestamp)
    ),
    averages AS (
        SELECT 
            AVG(daily_interactions) as avg_interactions,
            AVG(daily_tokens) as avg_tokens,
            AVG(avg_response_time) as avg_response_time,
            STDDEV(daily_interactions) as stddev_interactions,
            STDDEV(daily_tokens) as stddev_tokens
        FROM recent_usage
    ),
    today_usage AS (
        SELECT 
            COUNT(*) as today_interactions,
            SUM(tokens_used) as today_tokens,
            AVG(response_time_ms) as today_response_time
        FROM agent_usage_events
        WHERE user_id = p_user_id
        AND DATE_TRUNC('day', timestamp) = CURRENT_DATE
    )
    -- Detectar picos de interacciones
    SELECT 
        'interaction_spike'::TEXT,
        FORMAT('Daily interactions (%s) exceed normal range by %s%%', 
               tu.today_interactions, 
               ROUND(((tu.today_interactions - av.avg_interactions) / av.avg_interactions) * 100))::TEXT,
        CASE 
            WHEN tu.today_interactions > av.avg_interactions + (2 * av.stddev_interactions) THEN 'high'
            ELSE 'medium'
        END::TEXT,
        NOW()
    FROM today_usage tu
    CROSS JOIN averages av
    WHERE tu.today_interactions > av.avg_interactions + av.stddev_interactions

    UNION ALL

    -- Detectar picos de tokens
    SELECT 
        'token_spike'::TEXT,
        FORMAT('Daily token usage (%s) exceed normal range by %s%%', 
               tu.today_tokens, 
               ROUND(((tu.today_tokens - av.avg_tokens) / av.avg_tokens) * 100))::TEXT,
        CASE 
            WHEN tu.today_tokens > av.avg_tokens + (2 * av.stddev_tokens) THEN 'high'
            ELSE 'medium'
        END::TEXT,
        NOW()
    FROM today_usage tu
    CROSS JOIN averages av
    WHERE tu.today_tokens > av.avg_tokens + av.stddev_tokens;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en agent_usage_daily
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agent_usage_daily_updated_at
    BEFORE UPDATE ON agent_usage_daily
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Índices adicionales para performance
CREATE INDEX IF NOT EXISTS idx_agent_usage_events_composite ON agent_usage_events(user_id, timestamp DESC, agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_usage_events_session ON agent_usage_events(session_id);
CREATE INDEX IF NOT EXISTS idx_usage_alerts_composite ON usage_alerts(user_id, alert_type, triggered_at DESC);

-- RLS (Row Level Security) policies
ALTER TABLE agent_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_usage_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_alerts ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios solo pueden ver sus propios datos
CREATE POLICY "Users can view own usage data" ON agent_usage_events
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view own daily usage" ON agent_usage_daily
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view own alerts" ON usage_alerts
    FOR SELECT USING (auth.uid()::text = user_id);

-- Policy: Solo el sistema puede insertar datos de uso
CREATE POLICY "System can insert usage events" ON agent_usage_events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update daily usage" ON agent_usage_daily
    FOR ALL WITH CHECK (true);

CREATE POLICY "System can manage alerts" ON usage_alerts
    FOR ALL WITH CHECK (true);

-- Comentarios para documentación
COMMENT ON TABLE agent_usage_events IS 'Eventos individuales de uso de agentes HIE desde GENESIS';
COMMENT ON TABLE agent_usage_daily IS 'Agregados diarios de uso para optimizar consultas de analytics';
COMMENT ON TABLE usage_alerts IS 'Alertas automáticas basadas en patrones de uso';
COMMENT ON TABLE usage_tier_limits IS 'Configuración de límites y características por tier de suscripción';

COMMENT ON FUNCTION calculate_usage_percentage IS 'Calcula porcentaje de uso actual vs límites del tier';
COMMENT ON FUNCTION detect_usage_anomalies IS 'Detecta patrones anómalos en el uso de agentes';