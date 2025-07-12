/**
 * NGX Agent Icons Component
 * Iconografía personalizada para los agentes HIE
 */

import React from 'react';
import { 
  Brain, 
  Flame, 
  Eye, 
  Sparkles, 
  Zap, 
  Heart, 
  Waves, 
  Activity,
  Compass,
  Shield,
  Network
} from 'lucide-react';

export const AGENT_ICONS: Record<string, React.FC<{ className?: string }>> = {
  // Frontend Agents
  NEXUS: Brain,      // Central Hub - Coordina todo
  BLAZE: Flame,      // Fitness & Energy
  SAGE: Eye,         // Wisdom & Nutrition
  NOVA: Sparkles,    // Innovation & Creativity
  EDGE: Zap,         // Peak Performance
  PULSE: Heart,      // Health & Wellness
  FLUX: Waves,       // Flow & Balance
  WAVE: Activity,    // Biometrics & Tracking
  SPARK: Compass,    // Motivation & Guidance
  
  // Backend Agents
  GUARDIAN: Shield,  // Security & Protection
  NODE: Network      // System Integration
};

export const AGENT_COLORS: Record<string, string> = {
  NEXUS: '#8B5CF6',     // Electric Violet
  BLAZE: '#F59E0B',     // Amber
  SAGE: '#10B981',      // Emerald
  NOVA: '#EC4899',      // Pink
  EDGE: '#3B82F6',      // Blue
  PULSE: '#EF4444',     // Red
  FLUX: '#6366F1',      // Indigo
  WAVE: '#14B8A6',      // Teal
  SPARK: '#F97316',     // Orange
  GUARDIAN: '#6B7280',  // Gray
  NODE: '#5B21B6'       // Deep Purple
};

export const AGENT_DESCRIPTIONS: Record<string, string> = {
  NEXUS: 'Hub central de coordinación y análisis',
  BLAZE: 'Optimización de fitness y energía física',
  SAGE: 'Nutrición inteligente y sabiduría alimentaria',
  NOVA: 'Innovación y soluciones creativas',
  EDGE: 'Rendimiento máximo y productividad',
  PULSE: 'Monitoreo de salud y bienestar',
  FLUX: 'Balance y flujo de vida',
  WAVE: 'Análisis de biomarcadores y tracking',
  SPARK: 'Motivación y guía personalizada',
  GUARDIAN: 'Seguridad y protección de datos',
  NODE: 'Integración de sistemas y sincronización'
};

interface AgentIconProps {
  agent: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

export const AgentIcon: React.FC<AgentIconProps> = ({ 
  agent, 
  size = 'md', 
  showLabel = false,
  animated = false,
  className = ''
}) => {
  const Icon = AGENT_ICONS[agent] || Brain;
  const color = AGENT_COLORS[agent] || '#8B5CF6';
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };
  
  const containerSizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };
  
  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <div 
        className={`
          ${containerSizeClasses[size]} 
          rounded-full flex items-center justify-center
          bg-gradient-to-br from-transparent to-current/10
          border border-current/20
          ${animated ? 'animate-ngx-pulse' : ''}
          hover:shadow-lg transition-all duration-300
        `}
        style={{ 
          color, 
          boxShadow: animated ? `0 0 20px ${color}40` : undefined 
        }}
      >
        <Icon className={sizeClasses[size]} />
      </div>
      {showLabel && (
        <span 
          className="text-xs font-josefin font-medium mt-2"
          style={{ color }}
        >
          {agent}
        </span>
      )}
    </div>
  );
};

interface AgentGridProps {
  agents?: string[];
  showBackend?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export const AgentGrid: React.FC<AgentGridProps> = ({ 
  agents,
  showBackend = false,
  size = 'md',
  animated = false
}) => {
  const displayAgents = agents || [
    ...AGENT_ICONS.frontend,
    ...(showBackend ? AGENT_ICONS.backend : [])
  ];
  
  return (
    <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
      {displayAgents.map((agent) => (
        <AgentIcon 
          key={agent}
          agent={agent}
          size={size}
          showLabel
          animated={animated}
        />
      ))}
    </div>
  );
};

export default AgentIcon;