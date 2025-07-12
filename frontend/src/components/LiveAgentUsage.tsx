import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Activity, 
  Zap, 
  Clock, 
  Users, 
  AlertTriangle, 
  TrendingUp,
  Wifi,
  WifiOff 
} from 'lucide-react';

interface AgentUsageEvent {
  user_id: string;
  agent_id: string;
  tokens_used: number;
  subscription_tier: string;
  timestamp: string;
}

interface UsageAlert {
  id: string;
  user_id: string;
  alert_type: 'approaching_limit' | 'limit_exceeded' | 'anomaly_detected';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  triggered_at: string;
}

interface LiveUsageUpdate {
  event_type: 'usage_update' | 'alert_triggered' | 'limit_reached';
  data: any;
  timestamp: string;
}

interface AgentStats {
  agent_id: string;
  interactions_count: number;
  tokens_total: number;
  active_users: number;
  avg_response_time: number;
}

const LiveAgentUsage: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [agentStats, setAgentStats] = useState<AgentStats[]>([]);
  const [recentEvents, setRecentEvents] = useState<AgentUsageEvent[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<UsageAlert[]>([]);
  const [totalMetrics, setTotalMetrics] = useState({
    totalInteractions: 0,
    totalTokens: 0,
    activeUsers: 0,
    avgResponseTime: 0
  });
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  // Configuración de agentes NGX con iconografía
  const AGENT_CONFIG = {
    'NEXUS': { 
      name: 'NEXUS', 
      color: 'bg-purple-500', 
      icon: '🧠',
      description: 'Central Intelligence Hub'
    },
    'BLAZE': { 
      name: 'BLAZE', 
      color: 'bg-orange-500', 
      icon: '🔥',
      description: 'Performance Optimizer'
    },
    'SAGE': { 
      name: 'SAGE', 
      color: 'bg-green-500', 
      icon: '🧙‍♂️',
      description: 'Wisdom & Knowledge'
    },
    'ARIA': { 
      name: 'ARIA', 
      color: 'bg-blue-500', 
      icon: '🎵',
      description: 'Communication Expert'
    },
    'CIPHER': { 
      name: 'CIPHER', 
      color: 'bg-indigo-500', 
      icon: '🔐',
      description: 'Security & Analysis'
    },
    'ECHO': { 
      name: 'ECHO', 
      color: 'bg-teal-500', 
      icon: '📡',
      description: 'Response Amplifier'
    },
    'QUANTUM': { 
      name: 'QUANTUM', 
      color: 'bg-violet-500', 
      icon: '⚛️',
      description: 'Advanced Processing'
    },
    'NOVA': { 
      name: 'NOVA', 
      color: 'bg-yellow-500', 
      icon: '⭐',
      description: 'Innovation Engine'
    },
    'FLUX': { 
      name: 'FLUX', 
      color: 'bg-pink-500', 
      icon: '🌊',
      description: 'Adaptive Learning'
    },
    'VERTEX': { 
      name: 'VERTEX', 
      color: 'bg-red-500', 
      icon: '🔺',
      description: 'Data Processing'
    },
    'HELIX': { 
      name: 'HELIX', 
      color: 'bg-emerald-500', 
      icon: '🧬',
      description: 'Pattern Recognition'
    }
  };

  // Configuración de tiers
  const TIER_CONFIG = {
    'essential': { name: 'Essential', color: 'bg-gray-500', limit: 50000 },
    'pro': { name: 'Pro', color: 'bg-blue-500', limit: 150000 },
    'elite': { name: 'Elite', color: 'bg-purple-500', limit: 500000 },
    'prime': { name: 'PRIME', color: 'bg-gold-500', limit: 1000000 },
    'longevity': { name: 'LONGEVITY', color: 'bg-emerald-500', limit: 1000000 }
  };

  const connectWebSocket = () => {
    try {
      const wsUrl = `ws://localhost:8001/agent-usage/live`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected to agent usage feed');
        setIsConnected(true);
        
        // Enviar ping para mantener conexión activa
        if (wsRef.current) {
          wsRef.current.send(JSON.stringify({ type: 'ping' }));
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const update: LiveUsageUpdate = JSON.parse(event.data);
          handleLiveUpdate(update);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected from agent usage feed');
        setIsConnected(false);
        
        // Reconectar después de 5 segundos
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 5000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      setIsConnected(false);
    }
  };

  const handleLiveUpdate = (update: LiveUsageUpdate) => {
    switch (update.event_type) {
      case 'usage_update':
        handleUsageUpdate(update.data);
        break;
      case 'alert_triggered':
        handleAlertTriggered(update.data);
        break;
      case 'limit_reached':
        handleLimitReached(update.data);
        break;
    }
  };

  const handleUsageUpdate = (data: any) => {
    const event: AgentUsageEvent = {
      user_id: data.user_id,
      agent_id: data.agent_id,
      tokens_used: data.tokens_used,
      subscription_tier: data.subscription_tier,
      timestamp: new Date().toISOString()
    };

    // Actualizar eventos recientes (máximo 50)
    setRecentEvents(prev => [event, ...prev].slice(0, 50));

    // Actualizar estadísticas por agente
    setAgentStats(prev => {
      const existing = prev.find(stat => stat.agent_id === data.agent_id);
      if (existing) {
        return prev.map(stat => 
          stat.agent_id === data.agent_id
            ? {
                ...stat,
                interactions_count: stat.interactions_count + 1,
                tokens_total: stat.tokens_total + data.tokens_used,
                active_users: stat.active_users // Se actualizará desde el backend
              }
            : stat
        );
      } else {
        return [...prev, {
          agent_id: data.agent_id,
          interactions_count: 1,
          tokens_total: data.tokens_used,
          active_users: 1,
          avg_response_time: 0
        }];
      }
    });

    // Actualizar métricas totales
    setTotalMetrics(prev => ({
      totalInteractions: prev.totalInteractions + 1,
      totalTokens: prev.totalTokens + data.tokens_used,
      activeUsers: prev.activeUsers,
      avgResponseTime: prev.avgResponseTime
    }));
  };

  const handleAlertTriggered = (data: any) => {
    const alert: UsageAlert = {
      id: data.alert_id,
      user_id: data.user_id,
      alert_type: data.alert_type,
      message: data.message,
      severity: data.severity,
      triggered_at: new Date().toISOString()
    };

    setActiveAlerts(prev => [alert, ...prev].slice(0, 10));
  };

  const handleLimitReached = (data: any) => {
    // Manejar cuando un usuario alcanza su límite
    console.log('Limit reached for user:', data.user_id);
  };

  const dismissAlert = (alertId: string) => {
    setActiveAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  useEffect(() => {
    connectWebSocket();

    // Cargar datos iniciales
    const loadInitialData = async () => {
      try {
        const response = await fetch('/api/agent-usage/analytics/summary?days=1');
        if (response.ok) {
          const data = await response.json();
          // Procesar datos iniciales
          console.log('Initial analytics data:', data);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadInitialData();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header con estado de conexión */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Uso de Agentes HIE en Tiempo Real
        </h2>
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <Badge className="bg-green-100 text-green-800">
              <Wifi className="w-3 h-3 mr-1" />
              Conectado
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-800">
              <WifiOff className="w-3 h-3 mr-1" />
              Desconectado
            </Badge>
          )}
        </div>
      </div>

      {/* Métricas generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Interacciones</p>
                <p className="text-2xl font-bold">{formatNumber(totalMetrics.totalInteractions)}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tokens Totales</p>
                <p className="text-2xl font-bold">{formatNumber(totalMetrics.totalTokens)}</p>
              </div>
              <Zap className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Usuarios Activos</p>
                <p className="text-2xl font-bold">{totalMetrics.activeUsers}</p>
              </div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tiempo Resp. Prom.</p>
                <p className="text-2xl font-bold">{totalMetrics.avgResponseTime}ms</p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas activas */}
      {activeAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
              Alertas Activas ({activeAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeAlerts.map((alert) => (
                <Alert key={alert.id} className={getSeverityColor(alert.severity)}>
                  <AlertDescription className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{alert.message}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        Usuario: {alert.user_id} • {formatTimeAgo(alert.triggered_at)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissAlert(alert.id)}
                    >
                      ✕
                    </Button>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estadísticas por agente */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad por Agente HIE</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {agentStats
                .sort((a, b) => b.interactions_count - a.interactions_count)
                .map((stat) => {
                  const config = AGENT_CONFIG[stat.agent_id as keyof typeof AGENT_CONFIG];
                  return (
                    <div key={stat.agent_id} className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full ${config?.color || 'bg-gray-500'} flex items-center justify-center text-white text-sm`}>
                        {config?.icon || '🤖'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{stat.agent_id}</span>
                          <span className="text-sm text-gray-500">
                            {stat.interactions_count} interacciones
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatNumber(stat.tokens_total)} tokens • {stat.active_users} usuarios
                        </div>
                      </div>
                    </div>
                  );
                })}
              {agentStats.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  No hay actividad reciente de agentes
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actividad reciente */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentEvents.map((event, index) => {
                const config = AGENT_CONFIG[event.agent_id as keyof typeof AGENT_CONFIG];
                const tierConfig = TIER_CONFIG[event.subscription_tier as keyof typeof TIER_CONFIG];
                return (
                  <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                    <div className={`w-6 h-6 rounded-full ${config?.color || 'bg-gray-500'} flex items-center justify-center text-white text-xs`}>
                      {config?.icon || '🤖'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{event.agent_id}</span>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(event.timestamp)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        Usuario: {event.user_id.slice(-8)} • 
                        <Badge className={`ml-1 ${tierConfig?.color || 'bg-gray-500'} text-white`} size="sm">
                          {tierConfig?.name || event.subscription_tier}
                        </Badge>
                        • {event.tokens_used} tokens
                      </div>
                    </div>
                  </div>
                );
              })}
              {recentEvents.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  No hay eventos recientes
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LiveAgentUsage;