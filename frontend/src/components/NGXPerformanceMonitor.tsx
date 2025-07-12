/**
 * NGX Performance Monitor Component
 * 
 * Componente para monitoreo en tiempo real del rendimiento
 * Muestra Core Web Vitals, métricas móviles y uso de memoria
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Smartphone, 
  Zap, 
  TrendingUp, 
  TrendingDown,
  Wifi,
  Battery,
  Cpu,
  HardDrive,
  Monitor,
  Clock,
  Eye,
  Settings
} from 'lucide-react';
import { useNGXOptimization, useNGXMobile, useNGXMemory } from '../hooks/useNGXOptimization';

interface PerformanceMetrics {
  lcp?: number;
  fid?: number;
  cls?: number;
  ttfb?: number;
  domContentLoaded?: number;
  loadComplete?: number;
}

export const NGXPerformanceMonitor: React.FC<{ 
  isVisible?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
}> = ({ 
  isVisible = false, 
  position = 'bottom-right',
  className = '' 
}) => {
  const { getMetrics, performanceScore } = useNGXOptimization();
  const { isMobile, orientation, isTouch } = useNGXMobile();
  const { memoryUsage } = useNGXMemory();
  
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [isExpanded, setIsExpanded] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState<any>(null);

  useEffect(() => {
    const updateMetrics = () => {
      const currentMetrics = getMetrics();
      setMetrics(currentMetrics.coreWebVitals);
      
      // Get connection info if available
      if ((navigator as any).connection) {
        setConnectionInfo((navigator as any).connection);
      }
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
  }, [getMetrics]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getMetricColor = (value: number, good: number, needs: number) => {
    if (value <= good) return 'text-green-400';
    if (value <= needs) return 'text-yellow-400';
    return 'text-red-400';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed ${positionClasses[position]} z-ngx-overlay transition-all duration-ngx-normal ${className}`}>
      <Card className={`${isExpanded ? 'w-80' : 'w-16'} transition-all duration-ngx-normal ngx-glass border border-ngx-border hover:border-ngx-border-hover`}>
        {/* Compact View */}
        {!isExpanded && (
          <CardContent 
            className="p-3 cursor-pointer"
            onClick={() => setIsExpanded(true)}
          >
            <div className="flex items-center justify-center">
              <Activity 
                className={`w-6 h-6 ${performanceScore !== null ? getScoreColor(performanceScore) : 'text-ngx-electric-violet'} animate-ngx-pulse`} 
              />
              {performanceScore !== null && (
                <Badge 
                  variant="ngx" 
                  className="absolute -top-2 -right-2 text-xs w-6 h-6 rounded-full flex items-center justify-center"
                >
                  {Math.round(performanceScore)}
                </Badge>
              )}
            </div>
          </CardContent>
        )}

        {/* Expanded View */}
        {isExpanded && (
          <>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                <span className="flex items-center text-ngx-gradient">
                  <Activity className="w-4 h-4 mr-2" />
                  NGX Performance
                </span>
                <div className="flex items-center space-x-2">
                  {performanceScore !== null && (
                    <Badge variant="ngx" className="text-xs">
                      {Math.round(performanceScore)}
                    </Badge>
                  )}
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="text-ngx-text-secondary hover:text-ngx-electric-violet transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 text-xs">
              {/* Core Web Vitals */}
              <div>
                <h4 className="font-medium mb-2 flex items-center">
                  <Zap className="w-3 h-3 mr-1 text-ngx-electric-violet" />
                  Core Web Vitals
                </h4>
                <div className="space-y-2">
                  {metrics.lcp && (
                    <div className="flex justify-between items-center">
                      <span>LCP:</span>
                      <span className={getMetricColor(metrics.lcp, 2500, 4000)}>
                        {(metrics.lcp / 1000).toFixed(1)}s
                      </span>
                    </div>
                  )}
                  {metrics.fid && (
                    <div className="flex justify-between items-center">
                      <span>FID:</span>
                      <span className={getMetricColor(metrics.fid, 100, 300)}>
                        {metrics.fid.toFixed(0)}ms
                      </span>
                    </div>
                  )}
                  {metrics.cls && (
                    <div className="flex justify-between items-center">
                      <span>CLS:</span>
                      <span className={getMetricColor(metrics.cls, 0.1, 0.25)}>
                        {metrics.cls.toFixed(3)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Device Info */}
              <div>
                <h4 className="font-medium mb-2 flex items-center">
                  <Smartphone className="w-3 h-3 mr-1 text-ngx-electric-violet" />
                  Device Info
                </h4>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span>Mobile:</span>
                    <Badge variant={isMobile ? "ngx" : "ngx-outline"} className="text-xs">
                      {isMobile ? 'YES' : 'NO'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Touch:</span>
                    <Badge variant={isTouch ? "ngx" : "ngx-outline"} className="text-xs">
                      {isTouch ? 'YES' : 'NO'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Orientation:</span>
                    <span className="text-ngx-text-secondary">{orientation}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Screen:</span>
                    <span className="text-ngx-text-secondary">
                      {window.innerWidth}×{window.innerHeight}
                    </span>
                  </div>
                </div>
              </div>

              {/* Memory Usage */}
              {memoryUsage && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <HardDrive className="w-3 h-3 mr-1 text-ngx-electric-violet" />
                    Memory Usage
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Used:</span>
                      <span className={getMetricColor(memoryUsage.percentage, 50, 80)}>
                        {formatBytes(memoryUsage.used)}
                      </span>
                    </div>
                    <Progress 
                      value={memoryUsage.percentage} 
                      className="h-1"
                    />
                    <div className="flex justify-between text-xs text-ngx-text-secondary">
                      <span>{memoryUsage.percentage.toFixed(1)}%</span>
                      <span>{formatBytes(memoryUsage.total)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Connection Info */}
              {connectionInfo && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <Wifi className="w-3 h-3 mr-1 text-ngx-electric-violet" />
                    Connection
                  </h4>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span>Type:</span>
                      <Badge variant="ngx-outline" className="text-xs">
                        {connectionInfo.effectiveType || 'Unknown'}
                      </Badge>
                    </div>
                    {connectionInfo.downlink && (
                      <div className="flex justify-between items-center">
                        <span>Speed:</span>
                        <span className="text-ngx-text-secondary">
                          {connectionInfo.downlink} Mbps
                        </span>
                      </div>
                    )}
                    {connectionInfo.rtt && (
                      <div className="flex justify-between items-center">
                        <span>RTT:</span>
                        <span className="text-ngx-text-secondary">
                          {connectionInfo.rtt}ms
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Loading Times */}
              <div>
                <h4 className="font-medium mb-2 flex items-center">
                  <Clock className="w-3 h-3 mr-1 text-ngx-electric-violet" />
                  Load Times
                </h4>
                <div className="space-y-1">
                  {metrics.ttfb && (
                    <div className="flex justify-between items-center">
                      <span>TTFB:</span>
                      <span className={getMetricColor(metrics.ttfb, 200, 500)}>
                        {metrics.ttfb.toFixed(0)}ms
                      </span>
                    </div>
                  )}
                  {metrics.domContentLoaded && (
                    <div className="flex justify-between items-center">
                      <span>DOM:</span>
                      <span className="text-ngx-text-secondary">
                        {(metrics.domContentLoaded / 1000).toFixed(1)}s
                      </span>
                    </div>
                  )}
                  {metrics.loadComplete && (
                    <div className="flex justify-between items-center">
                      <span>Complete:</span>
                      <span className="text-ngx-text-secondary">
                        {(metrics.loadComplete / 1000).toFixed(1)}s
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Tips */}
              <div className="pt-2 border-t border-ngx-border">
                <div className="flex items-center justify-center space-x-2 text-ngx-text-secondary">
                  <TrendingUp className="w-3 h-3" />
                  <span className="text-xs">NGX Optimized</span>
                </div>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
};

export default NGXPerformanceMonitor;