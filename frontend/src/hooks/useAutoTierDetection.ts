/**
 * useAutoTierDetection Hook
 * 
 * Hook personalizado que automatiza la detección de tier usando NGX_Closer.Agent
 * Se ejecuta automáticamente cuando hay cambios en el perfil del contacto
 */

import { useState, useEffect, useCallback } from 'react';
import { useNGXMCPBridge, ConversationContext, TierDetectionResult } from '../services/ngx-mcp-bridge';
import { api } from '../services/api';
import { toast } from 'sonner';

interface AutoTierDetectionConfig {
  contactId?: string;
  dealId?: string;
  leadId?: string;
  autoDetect?: boolean;
  detectionTriggers?: {
    onProfileChange?: boolean;
    onConversationUpdate?: boolean;
    onScoreChange?: boolean;
  };
}

interface TierDetectionState {
  isDetecting: boolean;
  lastDetection: TierDetectionResult | null;
  detectionHistory: Array<{
    timestamp: string;
    result: TierDetectionResult;
    trigger: string;
  }>;
  confidence: number;
  recommendations: string[];
}

export const useAutoTierDetection = (config: AutoTierDetectionConfig) => {
  const { detectTier, getRecommendations, connectionStatus } = useNGXMCPBridge();
  
  const [state, setState] = useState<TierDetectionState>({
    isDetecting: false,
    lastDetection: null,
    detectionHistory: [],
    confidence: 0,
    recommendations: []
  });

  const [contactData, setContactData] = useState<any>(null);
  const [dealData, setDealData] = useState<any>(null);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);

  // Función para ejecutar la detección de tier
  const runTierDetection = useCallback(async (
    trigger: string = 'manual',
    customContext?: Partial<ConversationContext>
  ) => {
    if (!connectionStatus) {
      toast.error('NGX_Closer.Agent no está conectado');
      return null;
    }

    setState(prev => ({ ...prev, isDetecting: true }));

    try {
      // Preparar contexto de conversación
      const context: ConversationContext = {
        contact_id: config.contactId,
        deal_id: config.dealId,
        lead_id: config.leadId,
        conversation_history: conversationHistory,
        user_profile: {
          name: contactData?.name || '',
          email: contactData?.email || '',
          company: contactData?.company || '',
          occupation: contactData?.occupation || '',
          age: contactData?.age || 0,
          location: contactData?.location || '',
          income_bracket: contactData?.income_bracket || 'medium'
        },
        current_tier: contactData?.tier || dealData?.tier,
        detected_intent: contactData?.last_intent,
        engagement_score: contactData?.engagement_score || 0,
        ...customContext
      };

      // Ejecutar detección
      const result = await detectTier(context);
      
      if (result) {
        // Obtener recomendaciones
        const recommendations = await getRecommendations(context);
        
        // Actualizar estado
        setState(prev => ({
          ...prev,
          lastDetection: result,
          confidence: result.confidence,
          recommendations,
          detectionHistory: [
            ...prev.detectionHistory,
            {
              timestamp: new Date().toISOString(),
              result,
              trigger
            }
          ].slice(-10), // Mantener solo las últimas 10 detecciones
          isDetecting: false
        }));

        // Notificar resultado
        toast.success(
          `Tier detectado: ${result.recommended_tier.toUpperCase()} (${Math.round(result.confidence * 100)}% confianza)`,
          {
            description: `Trigger: ${trigger}`,
            duration: 5000
          }
        );

        return result;
      }
    } catch (error) {
      console.error('Error en detección automática de tier:', error);
      toast.error('Error detectando tier automáticamente');
    } finally {
      setState(prev => ({ ...prev, isDetecting: false }));
    }

    return null;
  }, [config, contactData, dealData, conversationHistory, detectTier, getRecommendations, connectionStatus]);

  // Cargar datos del contacto
  useEffect(() => {
    const loadContactData = async () => {
      if (!config.contactId) return;

      try {
        const contact = await api.contacts.getById(config.contactId);
        setContactData(contact);

        // Ejecutar detección automática si está habilitada
        if (config.autoDetect && config.detectionTriggers?.onProfileChange) {
          setTimeout(() => {
            runTierDetection('profile_load');
          }, 1000);
        }
      } catch (error) {
        console.error('Error cargando datos del contacto:', error);
      }
    };

    loadContactData();
  }, [config.contactId, config.autoDetect]);

  // Cargar datos del deal
  useEffect(() => {
    const loadDealData = async () => {
      if (!config.dealId) return;

      try {
        const deal = await api.deals.getById(config.dealId);
        setDealData(deal);

        // Ejecutar detección automática si está habilitada
        if (config.autoDetect && config.detectionTriggers?.onProfileChange) {
          setTimeout(() => {
            runTierDetection('deal_load');
          }, 1000);
        }
      } catch (error) {
        console.error('Error cargando datos del deal:', error);
      }
    };

    loadDealData();
  }, [config.dealId, config.autoDetect]);

  // Simular cambios en la conversación (esto se conectaría con un sistema real de chat)
  useEffect(() => {
    // Aquí se podría conectar con un sistema de chat real
    // Por ahora, simulamos algunos datos de conversación
    if (contactData && config.autoDetect) {
      const simulatedConversation = [
        {
          role: 'user' as const,
          content: `Hola, soy ${contactData.name} de ${contactData.company || 'mi empresa'}. Estoy interesado en optimizar nuestros procesos.`,
          timestamp: new Date().toISOString()
        }
      ];
      setConversationHistory(simulatedConversation);

      if (config.detectionTriggers?.onConversationUpdate) {
        setTimeout(() => {
          runTierDetection('conversation_update');
        }, 2000);
      }
    }
  }, [contactData, config.autoDetect]);

  // Función para forzar una nueva detección
  const forceDetection = useCallback(async (customContext?: Partial<ConversationContext>) => {
    return await runTierDetection('manual_force', customContext);
  }, [runTierDetection]);

  // Función para actualizar el contexto de conversación
  const updateConversationContext = useCallback((newMessages: any[]) => {
    setConversationHistory(prev => [...prev, ...newMessages]);
    
    if (config.autoDetect && config.detectionTriggers?.onConversationUpdate) {
      // Debounce para evitar demasiadas detecciones
      setTimeout(() => {
        runTierDetection('conversation_update');
      }, 1000);
    }
  }, [config.autoDetect, config.detectionTriggers?.onConversationUpdate, runTierDetection]);

  // Función para obtener insights sobre el tier actual
  const getTierInsights = useCallback(() => {
    if (!state.lastDetection) return null;

    const detection = state.lastDetection;
    
    return {
      tier: detection.recommended_tier,
      confidence: detection.confidence,
      pricePoint: detection.price_point,
      reasoning: detection.reasoning,
      strengths: detection.behavioral_signals.filter(signal => 
        signal.includes('high_budget') || signal.includes('urgency')
      ),
      concerns: detection.behavioral_signals.filter(signal => 
        signal.includes('low_budget') || signal.includes('objection')
      ),
      upsellOpportunity: detection.upsell_potential,
      roiProjection: detection.roi_projection
    };
  }, [state.lastDetection]);

  // Función para obtener recomendaciones de próximas acciones
  const getActionRecommendations = useCallback(() => {
    const insights = getTierInsights();
    if (!insights) return [];

    const recommendations = [...state.recommendations];

    // Agregar recomendaciones basadas en tier
    switch (insights.tier) {
      case 'prime_premium':
      case 'longevity_premium':
        recommendations.push(
          'Programar demo personalizada con C-level',
          'Preparar propuesta premium con ROI detallado',
          'Conectar con especialista de implementación'
        );
        break;
      case 'elite':
        recommendations.push(
          'Mostrar casos de éxito de clientes similares',
          'Preparar comparativa con competencia',
          'Agendar call con decision maker'
        );
        break;
      case 'pro':
        recommendations.push(
          'Enviar trial o demo gratuita',
          'Mostrar features específicos para su industria',
          'Preparar propuesta con pricing flexible'
        );
        break;
      default:
        recommendations.push(
          'Educar sobre valor y beneficios',
          'Mostrar plan de implementación gradual',
          'Ofrecer descuento por compromiso anual'
        );
    }

    // Agregar recomendaciones basadas en sensibilidad al precio
    if (insights.confidence > 0.8) {
      recommendations.push('Proceder con propuesta - alta confianza');
    } else if (insights.confidence > 0.6) {
      recommendations.push('Recopilar más información antes de propuesta');
    } else {
      recommendations.push('Realizar discovery call adicional');
    }

    return [...new Set(recommendations)]; // Remover duplicados
  }, [state.recommendations, getTierInsights]);

  return {
    // Estado
    isDetecting: state.isDetecting,
    lastDetection: state.lastDetection,
    detectionHistory: state.detectionHistory,
    confidence: state.confidence,
    recommendations: state.recommendations,
    
    // Datos de contexto
    contactData,
    dealData,
    conversationHistory,
    
    // Funciones
    forceDetection,
    updateConversationContext,
    getTierInsights,
    getActionRecommendations,
    
    // Estado de conexión
    isConnected: connectionStatus
  };
};

export default useAutoTierDetection;