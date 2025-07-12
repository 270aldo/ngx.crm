/**
 * NGX 3D Pipeline Visualization Component
 * 
 * Visualización 3D revolucionaria del pipeline de ventas
 * Usando CSS 3D transforms y animaciones avanzadas
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Eye, 
  RotateCw, 
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Settings,
  Zap
} from 'lucide-react';

interface Deal3D {
  id: string;
  name: string;
  value: number;
  stage: string;
  probability: number;
  closeDate: string;
  contactName: string;
  tier: string;
}

interface Stage3D {
  name: string;
  deals: Deal3D[];
  totalValue: number;
  color: string;
  position: { x: number; y: number; z: number };
}

const NGX3DPipeline: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [hoveredDeal, setHoveredDeal] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  // Datos simulados del pipeline 3D
  const stages3D: Stage3D[] = [
    {
      name: 'Lead Qualification',
      deals: [
        { id: '1', name: 'TechCorp AI', value: 15000, stage: 'Lead Qualification', probability: 20, closeDate: '2024-12-25', contactName: 'John Smith', tier: 'pro' },
        { id: '2', name: 'StartupX', value: 8500, stage: 'Lead Qualification', probability: 15, closeDate: '2024-12-30', contactName: 'Maria Garcia', tier: 'essential' },
      ],
      totalValue: 23500,
      color: '#6366F1',
      position: { x: -300, y: 0, z: 0 }
    },
    {
      name: 'Discovery',
      deals: [
        { id: '3', name: 'MedCorp Solutions', value: 45000, stage: 'Discovery', probability: 40, closeDate: '2024-12-28', contactName: 'Dr. Johnson', tier: 'longevity_premium' },
        { id: '4', name: 'FinanceFlow', value: 22000, stage: 'Discovery', probability: 35, closeDate: '2025-01-05', contactName: 'Sarah Lee', tier: 'elite' },
      ],
      totalValue: 67000,
      color: '#8B5CF6',
      position: { x: -150, y: 0, z: 50 }
    },
    {
      name: 'Proposal',
      deals: [
        { id: '5', name: 'Enterprise Global', value: 85000, stage: 'Proposal', probability: 70, closeDate: '2024-12-22', contactName: 'Michael Chen', tier: 'prime_premium' },
      ],
      totalValue: 85000,
      color: '#F59E0B',
      position: { x: 0, y: 0, z: 100 }
    },
    {
      name: 'Negotiation',
      deals: [
        { id: '6', name: 'HealthTech Innovate', value: 55000, stage: 'Negotiation', probability: 85, closeDate: '2024-12-20', contactName: 'Dr. Patricia Wong', tier: 'longevity_premium' },
        { id: '7', name: 'AI Dynamics', value: 32000, stage: 'Negotiation', probability: 80, closeDate: '2024-12-24', contactName: 'Alex Rivera', tier: 'elite' },
      ],
      totalValue: 87000,
      color: '#10B981',
      position: { x: 150, y: 0, z: 50 }
    },
    {
      name: 'Closing',
      deals: [
        { id: '8', name: 'Fortune 500 Corp', value: 120000, stage: 'Closing', probability: 95, closeDate: '2024-12-18', contactName: 'Robert Taylor', tier: 'prime_premium' },
      ],
      totalValue: 120000,
      color: '#EF4444',
      position: { x: 300, y: 0, z: 0 }
    }
  ];

  // Animación automática
  useEffect(() => {
    if (!isAnimating) return;

    const animate = () => {
      setRotation(prev => ({
        x: prev.x + 0.2,
        y: prev.y + 0.5,
        z: prev.z + 0.1
      }));
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating]);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'prime_premium': return '#F59E0B';
      case 'longevity_premium': return '#10B981';
      case 'elite': return '#6366F1';
      case 'pro': return '#8B5CF6';
      default: return '#64748B';
    }
  };

  const getDealHeight = (value: number) => {
    return Math.max(20, Math.min(120, (value / 120000) * 100));
  };

  const toggleAnimation = () => {
    setIsAnimating(!isAnimating);
  };

  const resetView = () => {
    setRotation({ x: 0, y: 0, z: 0 });
    setSelectedStage(null);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Card className={`${isFullscreen ? 'fixed inset-4 z-50' : ''} border-l-4 border-l-ngx-electric-violet hover-ngx-glow ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center text-ngx-gradient">
            <BarChart3 className="w-5 h-5 mr-2" />
            NGX 3D Pipeline
          </span>
          <div className="flex items-center space-x-2">
            <Button onClick={toggleAnimation} variant="ngx-glass" size="sm">
              {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button onClick={resetView} variant="ngx-glass" size="sm">
              <RotateCw className="w-4 h-4" />
            </Button>
            <Button onClick={toggleFullscreen} variant="ngx-glass" size="sm">
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* 3D Visualization Container */}
          <div 
            ref={containerRef}
            className={`relative overflow-hidden ngx-glass rounded-ngx-xl border border-ngx-border ${
              isFullscreen ? 'h-[calc(100vh-200px)]' : 'h-96'
            }`}
            style={{
              perspective: '1000px',
              perspectiveOrigin: '50% 50%'
            }}
          >
            {/* 3D Scene */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg)`,
                transformStyle: 'preserve-3d',
                transition: isAnimating ? 'none' : 'transform 0.5s ease-out'
              }}
            >
              {/* Pipeline Stages */}
              {stages3D.map((stage, stageIndex) => (
                <div
                  key={stage.name}
                  className={`absolute cursor-pointer transition-all duration-500 ${
                    selectedStage === stage.name ? 'scale-110' : ''
                  }`}
                  style={{
                    transform: `translate3d(${stage.position.x}px, ${stage.position.y}px, ${stage.position.z}px)`,
                    transformStyle: 'preserve-3d'
                  }}
                  onClick={() => setSelectedStage(selectedStage === stage.name ? null : stage.name)}
                >
                  {/* Stage Platform */}
                  <div
                    className="relative rounded-ngx-lg border-2 transition-all duration-300 hover:shadow-ngx-glow-lg"
                    style={{
                      width: '120px',
                      height: '120px',
                      backgroundColor: `${stage.color}20`,
                      borderColor: stage.color,
                      boxShadow: selectedStage === stage.name ? `0 0 20px ${stage.color}` : 'none'
                    }}
                  >
                    {/* Stage Label */}
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs font-bold text-center">
                      <div className="ngx-glass px-2 py-1 rounded-ngx-md border border-ngx-border">
                        {stage.name}
                      </div>
                    </div>

                    {/* Deals as 3D Bars */}
                    <div className="absolute inset-2 flex justify-center items-end space-x-1">
                      {stage.deals.map((deal, dealIndex) => (
                        <div
                          key={deal.id}
                          className="relative cursor-pointer transition-all duration-300 hover:scale-110"
                          style={{
                            width: '16px',
                            height: `${getDealHeight(deal.value)}px`,
                            backgroundColor: getTierColor(deal.tier),
                            transform: `translateZ(${dealIndex * 10}px)`,
                            borderRadius: '2px 2px 0 0',
                            boxShadow: hoveredDeal === deal.id ? `0 0 10px ${getTierColor(deal.tier)}` : 'none'
                          }}
                          onMouseEnter={() => setHoveredDeal(deal.id)}
                          onMouseLeave={() => setHoveredDeal(null)}
                        >
                          {/* Deal Value Label */}
                          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold whitespace-nowrap">
                            {hoveredDeal === deal.id && (
                              <div className="ngx-glass px-2 py-1 rounded-ngx-sm border border-ngx-border text-center">
                                <div className="text-xs font-bold">{deal.name}</div>
                                <div className="text-xs text-ngx-text-secondary">
                                  ${(deal.value / 1000).toFixed(0)}k
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Stage Total Value */}
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center">
                      <div className="ngx-glass px-2 py-1 rounded-ngx-md border border-ngx-border">
                        <div className="text-xs font-bold text-ngx-gradient">
                          ${(stage.totalValue / 1000).toFixed(0)}k
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Connection Lines */}
                  {stageIndex < stages3D.length - 1 && (
                    <div
                      className="absolute top-1/2 -right-12 w-12 h-0.5 opacity-50"
                      style={{
                        backgroundColor: '#8B5CF6',
                        transform: 'translateY(-50%)'
                      }}
                    />
                  )}
                </div>
              ))}

              {/* 3D Grid */}
              <div className="absolute inset-0 pointer-events-none opacity-20">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={`grid-x-${i}`}
                    className="absolute h-px bg-ngx-electric-violet"
                    style={{
                      width: '800px',
                      left: '-400px',
                      top: `${i * 50}px`,
                      transform: 'rotateX(90deg)'
                    }}
                  />
                ))}
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={`grid-z-${i}`}
                    className="absolute w-px bg-ngx-electric-violet"
                    style={{
                      height: '800px',
                      top: '-400px',
                      left: `${i * 50 - 250}px`,
                      transform: 'rotateY(90deg)'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Control Overlay */}
            <div className="absolute top-4 right-4 ngx-glass p-3 rounded-ngx-lg border border-ngx-border">
              <div className="text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span>Total Pipeline:</span>
                  <span className="font-bold text-ngx-gradient">
                    ${(stages3D.reduce((sum, stage) => sum + stage.totalValue, 0) / 1000).toFixed(0)}k
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Deals:</span>
                  <span className="font-bold">
                    {stages3D.reduce((sum, stage) => sum + stage.deals.length, 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="absolute bottom-4 left-4 ngx-glass p-2 rounded-ngx-lg border border-ngx-border">
              <div className="text-xs text-ngx-text-secondary">
                <div className="flex items-center space-x-1">
                  <Eye className="w-3 h-3" />
                  <span>Click stages para detalles</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stage Details */}
          {selectedStage && (
            <div className="ngx-glass p-4 rounded-ngx-lg border border-ngx-border">
              <h4 className="font-bold text-ngx-gradient mb-3 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                {selectedStage} - Detalles
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stages3D.find(s => s.name === selectedStage)?.deals.map(deal => (
                  <div key={deal.id} className="p-3 ngx-glass rounded-ngx-md border border-ngx-border">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h5 className="font-medium text-sm">{deal.name}</h5>
                        <p className="text-xs text-ngx-text-secondary">{deal.contactName}</p>
                      </div>
                      <Badge 
                        variant={deal.tier === 'prime_premium' ? 'ngx-prime' : 
                               deal.tier === 'longevity_premium' ? 'ngx-longevity' : 
                               deal.tier === 'elite' ? 'ngx-custom' : 'ngx'}
                        className="text-xs"
                      >
                        {deal.tier.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-ngx-text-secondary">Valor:</span>
                        <div className="font-bold text-ngx-gradient">
                          ${(deal.value / 1000).toFixed(0)}k
                        </div>
                      </div>
                      <div>
                        <span className="text-ngx-text-secondary">Probabilidad:</span>
                        <div className="font-bold">{deal.probability}%</div>
                      </div>
                      <div>
                        <span className="text-ngx-text-secondary">Cierre:</span>
                        <div className="font-bold">
                          {new Date(deal.closeDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-ngx-text-secondary">Esperado:</span>
                        <div className="font-bold text-green-400">
                          ${((deal.value * deal.probability) / 100000).toFixed(0)}k
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tier Legend */}
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge variant="ngx-prime" className="text-xs">PRIME PREMIUM</Badge>
            <Badge variant="ngx-longevity" className="text-xs">LONGEVITY PREMIUM</Badge>
            <Badge variant="ngx-custom" className="text-xs">ELITE</Badge>
            <Badge variant="ngx" className="text-xs">PRO</Badge>
            <Badge variant="ngx-outline" className="text-xs">ESSENTIAL</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NGX3DPipeline;