/**
 * AutoTierDetectionWidget Component
 * 
 * Widget inteligente que muestra la detección automática de tier
 * y proporciona insights accionables para el equipo de ventas
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain,
  Target,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Clock,
  Users,
  ArrowUp,
  ArrowDown,
  Minus,
  Lightbulb,
  Zap
} from 'lucide-react';
import { useAutoTierDetection } from '../hooks/useAutoTierDetection';
import { toast } from 'sonner';

interface AutoTierDetectionWidgetProps {
  contactId?: string;
  dealId?: string;
  leadId?: string;
  autoDetect?: boolean;
  showInsights?: boolean;
  showRecommendations?: boolean;
  className?: string;
}

export const AutoTierDetectionWidget: React.FC<AutoTierDetectionWidgetProps> = ({
  contactId,
  dealId,
  leadId,
  autoDetect = true,
  showInsights = true,
  showRecommendations = true,
  className = ''
}) => {
  const [showHistory, setShowHistory] = useState(false);
  
  const {
    isDetecting,
    lastDetection,
    detectionHistory,
    confidence,
    forceDetection,
    getTierInsights,
    getActionRecommendations,
    isConnected,
    contactData
  } = useAutoTierDetection({
    contactId,
    dealId,
    leadId,
    autoDetect,
    detectionTriggers: {
      onProfileChange: true,
      onConversationUpdate: true,
      onScoreChange: true
    }
  });

  const insights = getTierInsights();
  const recommendations = getActionRecommendations();

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'prime_premium': return 'text-amber-400';
      case 'longevity_premium': return 'text-emerald-400';
      case 'elite': return 'text-purple-400';
      case 'pro': return 'text-blue-400';
      default: return 'text-gray-400';
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

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return 'text-green-400';
    if (conf >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const handleForceDetection = async () => {
    try {
      await forceDetection();
      toast.success('Detección forzada completada');
    } catch (error) {
      toast.error('Error en detección forzada');
    }
  };

  if (!isConnected) {
    return (
      <Card className={`border-l-4 border-l-red-500 ${className}`}>
        <CardContent className="py-6">
          <div className="flex items-center justify-center text-red-400">
            <AlertTriangle className="w-5 h-5 mr-2" />
            NGX_Closer.Agent desconectado
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Tier Detection Card */}
      <Card className="border-l-4 border-l-ngx-electric-violet hover-ngx-glow">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center text-ngx-gradient">
              <Brain className="w-5 h-5 mr-2" />
              Auto Tier Detection
            </span>
            <div className="flex items-center space-x-2">
              {isDetecting && (
                <div className="ngx-spinner w-4 h-4"></div>
              )}
              <Button
                onClick={handleForceDetection}
                disabled={isDetecting}
                variant="ngx-glass"
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 ${isDetecting ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lastDetection ? (
            <div className="space-y-4">
              {/* Tier Result */}
              <div className="flex items-center justify-between">
                <div>
                  <Badge 
                    variant={getTierBadgeVariant(lastDetection.recommended_tier)} 
                    className="text-lg px-4 py-2 mb-2"
                  >
                    {lastDetection.recommended_tier.toUpperCase()}
                  </Badge>
                  <p className="text-sm text-ngx-text-secondary">
                    {lastDetection.price_point}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-ngx-electric-violet" />
                    <span className={`text-2xl font-bold ${getConfidenceColor(confidence)}`}>
                      {Math.round(confidence * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-ngx-text-secondary">Confianza</p>
                </div>
              </div>

              {/* Confidence Progress */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Precisión del modelo</span>
                  <span>{Math.round(confidence * 100)}%</span>
                </div>
                <Progress value={confidence * 100} className="h-2" />
              </div>

              {/* Reasoning */}
              <div className="p-3 ngx-glass rounded-ngx-lg">
                <p className="text-sm">
                  <strong>Razonamiento:</strong> {lastDetection.reasoning}
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 ngx-glass rounded-ngx-md">
                  <p className="text-xs text-ngx-text-secondary">Sensibilidad</p>
                  <p className="text-sm font-medium">{lastDetection.price_sensitivity}</p>
                </div>
                <div className="p-2 ngx-glass rounded-ngx-md">
                  <p className="text-xs text-ngx-text-secondary">Upsell</p>
                  <p className="text-sm font-medium">{lastDetection.upsell_potential}</p>
                </div>
                <div className="p-2 ngx-glass rounded-ngx-md">
                  <p className="text-xs text-ngx-text-secondary">Señales</p>
                  <p className="text-sm font-medium">{lastDetection.behavioral_signals.length}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 text-ngx-electric-violet mx-auto mb-4 opacity-50" />
              <p className="text-ngx-text-secondary mb-4">
                {isDetecting ? 'Analizando perfil...' : 'No hay detección disponible'}
              </p>
              {!isDetecting && (
                <Button onClick={handleForceDetection} variant="ngx">
                  <Zap className="w-4 h-4 mr-2" />
                  Iniciar Análisis
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights Card */}
      {showInsights && insights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-ngx-gradient">
              <TrendingUp className="w-5 h-5 mr-2" />
              Insights NGX
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* ROI Projection */}
              {insights.roiProjection && (
                <div className="p-3 ngx-glass rounded-ngx-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">ROI Proyectado</span>
                    <span className="text-lg font-bold text-ngx-gradient">
                      {insights.roiProjection.monthly_roi || insights.roiProjection.annual_roi}%
                    </span>
                  </div>
                  {insights.roiProjection.payback_days && (
                    <p className="text-xs text-ngx-text-secondary mt-1">
                      Payback: {insights.roiProjection.payback_days} días
                    </p>
                  )}
                </div>
              )}

              {/* Strengths & Concerns */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1 text-green-400" />
                    Fortalezas
                  </p>
                  {insights.strengths.length > 0 ? (
                    <div className="space-y-1">
                      {insights.strengths.slice(0, 3).map((strength, index) => (
                        <div key={index} className="text-xs p-2 bg-green-500/10 rounded border border-green-500/20">
                          {strength}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-ngx-text-secondary">No detectadas</p>
                  )}
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1 text-yellow-400" />
                    Preocupaciones
                  </p>
                  {insights.concerns.length > 0 ? (
                    <div className="space-y-1">
                      {insights.concerns.slice(0, 3).map((concern, index) => (
                        <div key={index} className="text-xs p-2 bg-yellow-500/10 rounded border border-yellow-500/20">
                          {concern}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-ngx-text-secondary">No detectadas</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations Card */}
      {showRecommendations && recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-ngx-gradient">
              <Lightbulb className="w-5 h-5 mr-2" />
              Próximas Acciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recommendations.slice(0, 5).map((rec, index) => (
                <div 
                  key={index} 
                  className="flex items-start space-x-3 p-3 ngx-glass rounded-ngx-lg hover:border-ngx-border-hover transition-all duration-ngx-normal cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-ngx-electric-violet/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-ngx-electric-violet">
                      {index + 1}
                    </span>
                  </div>
                  <p className="text-sm flex-1">{rec}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detection History */}
      {detectionHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center text-ngx-gradient">
                <Clock className="w-5 h-5 mr-2" />
                Historial
              </span>
              <Button
                onClick={() => setShowHistory(!showHistory)}
                variant="ngx-glass"
                size="sm"
              >
                {showHistory ? 'Ocultar' : 'Mostrar'}
              </Button>
            </CardTitle>
          </CardHeader>
          {showHistory && (
            <CardContent>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {detectionHistory.slice().reverse().map((detection, index) => (
                  <div key={index} className="flex items-center justify-between p-2 ngx-glass rounded-ngx-md text-sm">
                    <div>
                      <Badge variant={getTierBadgeVariant(detection.result.recommended_tier)} className="text-xs">
                        {detection.result.recommended_tier}
                      </Badge>
                      <span className="ml-2 text-xs text-ngx-text-secondary">
                        {new Date(detection.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs mr-2">
                        {Math.round(detection.result.confidence * 100)}%
                      </span>
                      <span className="text-xs text-ngx-text-secondary">
                        {detection.trigger}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
};

export default AutoTierDetectionWidget;