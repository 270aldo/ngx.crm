/**
 * NGX MCP Bridge Service
 * 
 * Este servicio conecta NexusCRM con NGX_Closer.Agent via Model Context Protocol (MCP)
 * Permite integración bidireccional entre el CRM y el agente de ventas IA
 */

import { api } from './api';

// Tipos para el NGX_Closer Agent
export interface TierDetectionResult {
  recommended_tier: 'essential' | 'pro' | 'elite' | 'prime_premium' | 'longevity_premium';
  confidence: number;
  reasoning: string;
  price_point: string;
  upsell_potential: string;
  demographic_factors: Record<string, any>;
  behavioral_signals: string[];
  price_sensitivity: string;
  roi_projection?: {
    monthly_cost?: number;
    productivity_hours_gain?: number;
    monthly_productivity_value?: number;
    monthly_roi?: number;
    payback_days?: number;
    annual_value?: number;
    program_cost?: number;
    annual_productivity_value?: number;
    annual_roi?: number;
    monthly_equivalent_value?: number;
  };
}

export interface ConversationContext {
  contact_id?: string;
  deal_id?: string;
  lead_id?: string;
  conversation_history: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  user_profile: {
    name?: string;
    email?: string;
    company?: string;
    occupation?: string;
    age?: number;
    location?: string;
    income_bracket?: string;
  };
  current_tier?: string;
  detected_intent?: string;
  engagement_score?: number;
}

export interface MCPResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  source: 'ngx_closer_agent';
}

class NGXMCPBridge {
  private baseUrl: string;
  private isConnected: boolean = false;
  private retryCount: number = 0;
  private maxRetries: number = 3;

  constructor() {
    // URL del servidor MCP de NGX_Closer.Agent
    this.baseUrl = process.env.VITE_NGX_CLOSER_MCP_URL || 'http://localhost:8001/mcp';
  }

  /**
   * Inicializar conexión con NGX_Closer.Agent
   */
  async initialize(): Promise<boolean> {
    try {
      const response = await this.sendMCPRequest('/health', {});
      this.isConnected = response.success;
      return this.isConnected;
    } catch (error) {
      console.error('Error inicializando MCP Bridge:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Detectar tier óptimo para un lead/contacto
   */
  async detectOptimalTier(context: ConversationContext): Promise<TierDetectionResult | null> {
    try {
      const response = await this.sendMCPRequest<TierDetectionResult>('/tier-detection', {
        user_message: context.conversation_history[context.conversation_history.length - 1]?.content || '',
        user_profile: context.user_profile,
        conversation_history: context.conversation_history
      });

      if (response.success && response.data) {
        // Actualizar el CRM con el tier detectado
        await this.updateCRMWithTierDetection(context, response.data);
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error detectando tier óptimo:', error);
      return null;
    }
  }

  /**
   * Enviar contexto de conversación al agente de ventas
   */
  async sendConversationContext(context: ConversationContext): Promise<string | null> {
    try {
      const response = await this.sendMCPRequest<{ response: string }>('/conversation', {
        context,
        action: 'get_sales_response'
      });

      if (response.success && response.data) {
        return response.data.response;
      }
      return null;
    } catch (error) {
      console.error('Error enviando contexto de conversación:', error);
      return null;
    }
  }

  /**
   * Calcular ROI personalizado para un contacto
   */
  async calculatePersonalizedROI(context: ConversationContext, tier: string): Promise<any> {
    try {
      const response = await this.sendMCPRequest('/roi-calculation', {
        user_profile: context.user_profile,
        tier,
        conversation_context: context.conversation_history
      });

      return response.success ? response.data : null;
    } catch (error) {
      console.error('Error calculando ROI personalizado:', error);
      return null;
    }
  }

  /**
   * Obtener recomendaciones de próximas acciones
   */
  async getNextActionRecommendations(context: ConversationContext): Promise<string[]> {
    try {
      const response = await this.sendMCPRequest<{ recommendations: string[] }>('/next-actions', {
        context
      });

      return response.success && response.data ? response.data.recommendations : [];
    } catch (error) {
      console.error('Error obteniendo recomendaciones:', error);
      return [];
    }
  }

  /**
   * Analizar sentimiento y intención del cliente
   */
  async analyzeClientIntent(message: string, context: ConversationContext): Promise<any> {
    try {
      const response = await this.sendMCPRequest('/intent-analysis', {
        message,
        context
      });

      return response.success ? response.data : null;
    } catch (error) {
      console.error('Error analizando intención del cliente:', error);
      return null;
    }
  }

  /**
   * Generar resumen inteligente de la conversación
   */
  async generateConversationSummary(context: ConversationContext): Promise<string | null> {
    try {
      const response = await this.sendMCPRequest<{ summary: string }>('/conversation-summary', {
        context
      });

      return response.success && response.data ? response.data.summary : null;
    } catch (error) {
      console.error('Error generando resumen:', error);
      return null;
    }
  }

  /**
   * Obtener métricas de performance del agente
   */
  async getAgentPerformanceMetrics(): Promise<any> {
    try {
      const response = await this.sendMCPRequest('/agent-metrics', {});
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Error obteniendo métricas del agente:', error);
      return null;
    }
  }

  /**
   * Sincronizar datos entre CRM y Agent
   */
  async syncCRMData(): Promise<boolean> {
    try {
      // Obtener datos del CRM
      const [contacts, deals, leads, tasks] = await Promise.all([
        api.contacts.getAll(),
        api.deals.getAll(),
        api.leads.getAll(),
        api.tasks.getAll()
      ]);

      // Enviar al agente para contexto
      const response = await this.sendMCPRequest('/sync-crm-data', {
        contacts,
        deals,
        leads,
        tasks,
        timestamp: new Date().toISOString()
      });

      return response.success;
    } catch (error) {
      console.error('Error sincronizando datos CRM:', error);
      return false;
    }
  }

  /**
   * Método privado para enviar requests MCP
   */
  private async sendMCPRequest<T = any>(endpoint: string, data: any): Promise<MCPResponse<T>> {
    if (!this.isConnected && this.retryCount < this.maxRetries) {
      await this.initialize();
      this.retryCount++;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VITE_NGX_MCP_TOKEN || 'ngx-mcp-token'}`
        },
        body: JSON.stringify({
          ...data,
          source: 'nexus_crm',
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`MCP Request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      this.retryCount = 0; // Reset retry count on success
      return result;
    } catch (error) {
      console.error(`Error en MCP request ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Actualizar CRM con información de tier detection
   */
  private async updateCRMWithTierDetection(
    context: ConversationContext, 
    tierResult: TierDetectionResult
  ): Promise<void> {
    try {
      // Actualizar contacto si existe
      if (context.contact_id) {
        await api.contacts.update(context.contact_id, {
          tier: tierResult.recommended_tier,
          tier_confidence: tierResult.confidence,
          tier_reasoning: tierResult.reasoning,
          price_sensitivity: tierResult.price_sensitivity,
          updated_at: new Date().toISOString()
        });
      }

      // Actualizar deal si existe
      if (context.deal_id) {
        await api.deals.update(context.deal_id, {
          recommended_tier: tierResult.recommended_tier,
          projected_value: tierResult.roi_projection?.monthly_cost || 0,
          confidence_score: tierResult.confidence,
          updated_at: new Date().toISOString()
        });
      }

      // Crear nota automática
      if (context.contact_id || context.deal_id) {
        const note = `NGX AI Tier Detection: ${tierResult.recommended_tier.toUpperCase()} (${Math.round(tierResult.confidence * 100)}% confidence)
        
Reasoning: ${tierResult.reasoning}
Price Sensitivity: ${tierResult.price_sensitivity}
Upsell Potential: ${tierResult.upsell_potential}

${tierResult.roi_projection ? `ROI Projection: ${tierResult.roi_projection.monthly_roi || tierResult.roi_projection.annual_roi}%` : ''}`;

        // Aquí podrías crear una nota en el CRM
        // await api.notes.create({ content: note, ... });
      }
    } catch (error) {
      console.error('Error actualizando CRM con tier detection:', error);
    }
  }

  /**
   * Estado de la conexión
   */
  get connectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Reconectar si es necesario
   */
  async reconnect(): Promise<boolean> {
    this.isConnected = false;
    this.retryCount = 0;
    return await this.initialize();
  }
}

// Singleton instance
export const ngxMCPBridge = new NGXMCPBridge();

// Hooks de React para usar el MCP Bridge
export const useNGXMCPBridge = () => {
  return {
    bridge: ngxMCPBridge,
    detectTier: (context: ConversationContext) => ngxMCPBridge.detectOptimalTier(context),
    calculateROI: (context: ConversationContext, tier: string) => 
      ngxMCPBridge.calculatePersonalizedROI(context, tier),
    analyzeIntent: (message: string, context: ConversationContext) => 
      ngxMCPBridge.analyzeClientIntent(message, context),
    getRecommendations: (context: ConversationContext) => 
      ngxMCPBridge.getNextActionRecommendations(context),
    syncData: () => ngxMCPBridge.syncCRMData(),
    connectionStatus: ngxMCPBridge.connectionStatus
  };
};

export default NGXMCPBridge;