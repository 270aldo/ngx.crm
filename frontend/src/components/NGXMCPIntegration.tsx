/**
 * NGX MCP Integration Component
 * 
 * Componente que gestiona la integración con NGX_Closer.Agent
 * Muestra tier detection, ROI calculation, y recomendaciones en tiempo real
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  Target, 
  MessageCircle, 
  RefreshCw, 
  CheckCircle,
  AlertCircle,
  DollarSign,
  Users,
  BarChart3
} from 'lucide-react';
import { useNGXMCPBridge, TierDetectionResult, ConversationContext } from '../services/ngx-mcp-bridge';
import { toast } from 'sonner';

interface NGXMCPIntegrationProps {
  contactId?: string;
  dealId?: string;
  leadId?: string;
  className?: string;
}

export const NGXMCPIntegration: React.FC<NGXMCPIntegrationProps> = ({
  contactId,
  dealId,
  leadId,
  className = ''
}) => {
  const { bridge, detectTier, calculateROI, analyzeIntent, getRecommendations, connectionStatus } = useNGXMCPBridge();
  
  const [isConnected, setIsConnected] = useState(connectionStatus);
  const [tierResult, setTierResult] = useState<TierDetectionResult | null>(null);
  const [roiData, setROIData] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [conversationHistory, setConversationHistory] = useState<Array<{role: 'user' | 'assistant', content: string, timestamp: string}>>([]);
  const [userMessage, setUserMessage] = useState('');
  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
    company: '',
    occupation: '',
    age: 0,
    location: '',
    income_bracket: 'medium'
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Inicializar conexión con NGX_Closer.Agent
    const initializeConnection = async () => {
      try {
        const connected = await bridge.initialize();
        setIsConnected(connected);
        if (connected) {
          toast.success('Conectado con NGX_Closer.Agent');
          // Sincronizar datos CRM
          await bridge.syncCRMData();
        } else {
          toast.error('Error conectando con NGX_Closer.Agent');
        }
      } catch (error) {
        console.error('Error inicializando MCP:', error);
        toast.error('Error de conexión MCP');
      }
    };

    initializeConnection();
  }, []);

  const handleTierDetection = async () => {
    if (!isConnected) {
      toast.error('No hay conexión con NGX_Closer.Agent');
      return;
    }

    setIsLoading(true);
    try {
      const context: ConversationContext = {
        contact_id: contactId,
        deal_id: dealId,
        lead_id: leadId,
        conversation_history: conversationHistory,
        user_profile: userProfile
      };

      const result = await detectTier(context);
      if (result) {
        setTierResult(result);
        toast.success(`Tier detectado: ${result.recommended_tier.toUpperCase()}`);
        
        // Calcular ROI para el tier detectado
        const roiResult = await calculateROI(context, result.recommended_tier);
        setROIData(roiResult);
        
        // Obtener recomendaciones
        const recs = await getRecommendations(context);
        setRecommendations(recs);
      }
    } catch (error) {
      console.error('Error en tier detection:', error);
      toast.error('Error detectando tier óptimo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userMessage.trim() || !isConnected) return;

    const newMessage = {
      role: 'user' as const,
      content: userMessage,
      timestamp: new Date().toISOString()
    };

    setConversationHistory(prev => [...prev, newMessage]);
    setUserMessage('');

    try {
      const context: ConversationContext = {
        contact_id: contactId,
        deal_id: dealId,
        lead_id: leadId,
        conversation_history: [...conversationHistory, newMessage],
        user_profile: userProfile
      };

      // Analizar intención
      const intentAnalysis = await analyzeIntent(userMessage, context);
      if (intentAnalysis) {
        console.log('Intent Analysis:', intentAnalysis);
      }

      // Obtener respuesta del agente
      const agentResponse = await bridge.sendConversationContext(context);
      if (agentResponse) {
        const assistantMessage = {
          role: 'assistant' as const,
          content: agentResponse,
          timestamp: new Date().toISOString()
        };
        setConversationHistory(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error procesando mensaje:', error);
      toast.error('Error procesando mensaje');
    }
  };

  const getTierBadgeVariant = (tier: string) => {
    switch (tier) {
      case 'prime_premium': return 'ngx-prime';
      case 'longevity_premium': return 'ngx-longevity';
      case 'elite': return 'ngx-custom';
      case 'pro': return 'ngx';
      default: return 'ngx-outline';
    }
  };

  return (
    <div className={`space-y-ngx-6 ${className}`}>
      {/* Connection Status */}
      <Card className="border-l-4 border-l-ngx-electric-violet">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Brain className="w-5 h-5 mr-2 text-ngx-electric-violet" />
              NGX_Closer.Agent Integration
            </span>
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              <Badge variant={isConnected ? 'ngx' : 'destructive'}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* User Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Perfil del Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="Nombre"
              value={userProfile.name}
              onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))}
            />
            <Input
              placeholder="Email"
              value={userProfile.email}
              onChange={(e) => setUserProfile(prev => ({ ...prev, email: e.target.value }))}
            />
            <Input
              placeholder="Empresa"
              value={userProfile.company}
              onChange={(e) => setUserProfile(prev => ({ ...prev, company: e.target.value }))}
            />
            <Input
              placeholder="Ocupación"
              value={userProfile.occupation}
              onChange={(e) => setUserProfile(prev => ({ ...prev, occupation: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tier Detection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Detección de Tier NGX
            </span>
            <Button 
              onClick={handleTierDetection} 
              disabled={!isConnected || isLoading}
              variant="ngx"
              size="sm"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              Detectar Tier
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tierResult ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant={getTierBadgeVariant(tierResult.recommended_tier)} className="text-lg px-4 py-2">
                  {tierResult.recommended_tier.toUpperCase()}
                </Badge>
                <div className="text-right">
                  <p className="text-sm text-ngx-text-secondary">Confianza</p>
                  <p className="text-xl font-bold text-ngx-gradient">
                    {Math.round(tierResult.confidence * 100)}%
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Razonamiento:</p>
                <p className="text-sm text-ngx-text-secondary">{tierResult.reasoning}</p>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-ngx-text-secondary">Precio</p>
                  <p className="font-bold text-ngx-gradient">{tierResult.price_point}</p>
                </div>
                <div>
                  <p className="text-sm text-ngx-text-secondary">Sensibilidad</p>
                  <p className="font-bold">{tierResult.price_sensitivity}</p>
                </div>
                <div>
                  <p className="text-sm text-ngx-text-secondary">Upsell</p>
                  <p className="font-bold">{tierResult.upsell_potential}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-ngx-text-secondary py-8">
              Click "Detectar Tier" para analizar el cliente con IA NGX
            </p>
          )}
        </CardContent>
      </Card>

      {/* ROI Calculation */}
      {roiData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Proyección ROI Personalizada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 ngx-glass rounded-ngx-lg">
                <p className="text-sm text-ngx-text-secondary">ROI Mensual</p>
                <p className="text-2xl font-bold text-ngx-gradient">
                  {roiData.monthly_roi || roiData.annual_roi}%
                </p>
              </div>
              <div className="text-center p-4 ngx-glass rounded-ngx-lg">
                <p className="text-sm text-ngx-text-secondary">Payback</p>
                <p className="text-2xl font-bold text-ngx-gradient">
                  {roiData.payback_days} días
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Recomendaciones NGX
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recommendations.map((rec, index) => (
                <div key={index} className="flex items-start space-x-2 p-3 ngx-glass rounded-ngx-lg">
                  <TrendingUp className="w-4 h-4 text-ngx-electric-violet mt-0.5" />
                  <p className="text-sm">{rec}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conversation Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageCircle className="w-5 h-5 mr-2" />
            Chat con NGX Agent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Conversation History */}
            <div className="max-h-60 overflow-y-auto space-y-2">
              {conversationHistory.map((msg, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-ngx-lg ${
                    msg.role === 'user' 
                      ? 'bg-ngx-electric-violet/20 ml-auto max-w-[80%]' 
                      : 'ngx-glass mr-auto max-w-[80%]'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className="text-xs text-ngx-text-secondary mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="flex space-x-2">
              <Textarea
                placeholder="Escribir mensaje para NGX Agent..."
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                className="flex-1"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!userMessage.trim() || !isConnected}
                variant="ngx"
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NGXMCPIntegration;