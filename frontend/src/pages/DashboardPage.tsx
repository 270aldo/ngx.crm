/**
 * NGX Executive Dashboard
 * Dashboard principal para el equipo NGX con KPIs y métricas clave
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Activity,
  Clock,
  AlertTriangle,
  BarChart3,
  Brain,
  Zap,
  Calendar,
  Target
} from 'lucide-react';
import { api } from '../services/api';
import { useStore } from '../store';
import { 
  TIER_PRICING, 
  HIE_AGENTS,
  type ExecutiveDashboardMetrics,
  type OperationalAlert 
} from '../types/subscription';
import PremiumProgramsTracker from '../components/PremiumProgramsTracker';
import { AgentIcon } from '../components/AgentIcons';
import LiveAgentUsage from '../components/LiveAgentUsage';

const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<ExecutiveDashboardMetrics | null>(null);
  const [alerts, setAlerts] = useState<OperationalAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('month');

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Cargar contactos y calcular métricas
      const [contacts, deals, leads] = await Promise.all([
        api.contacts.getAll(),
        api.deals.getAll(),
        api.leads.getAll()
      ]);

      // Calcular métricas (simulación - en producción vendría del backend)
      const calculatedMetrics = calculateMetrics(contacts, deals, leads);
      setMetrics(calculatedMetrics);

      // Generar alertas operacionales
      const operationalAlerts = generateAlerts(contacts, deals);
      setAlerts(operationalAlerts);

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (contacts: any[], deals: any[], leads: any[]): ExecutiveDashboardMetrics => {
    // Cálculo simulado de métricas
    const mrrByTier = {
      essential: contacts.filter(c => c.subscription_tier === 'essential').length * 79,
      pro: contacts.filter(c => c.subscription_tier === 'pro').length * 149,
      elite: contacts.filter(c => c.subscription_tier === 'elite').length * 199,
      prime: 0, // One-time payment
      longevity: 0 // One-time payment
    };

    const totalMRR = Object.values(mrrByTier).reduce((a, b) => a + b, 0);

    return {
      mrr: {
        total: totalMRR,
        byTier: mrrByTier,
        growth: 15.3 // Simulado
      },
      customers: {
        total: contacts.length,
        byTier: {
          essential: contacts.filter(c => c.subscription_tier === 'essential').length,
          pro: contacts.filter(c => c.subscription_tier === 'pro').length,
          elite: contacts.filter(c => c.subscription_tier === 'elite').length,
          prime: contacts.filter(c => c.subscription_tier === 'prime').length,
          longevity: contacts.filter(c => c.subscription_tier === 'longevity').length
        },
        inTrial: contacts.filter(c => c.subscription_status === 'trial').length,
        churnRisk: contacts.filter(c => c.subscription_status === 'active' && c.daily_queries_used === 0).length
      },
      trials: {
        active: leads.filter(l => l.status === 'qualified').length,
        conversionRate: 68.5, // Simulado
        avgDaysToConvert: 7.2 // Simulado
      },
      premiumPrograms: {
        active: {
          prime: contacts.filter(c => c.subscription_tier === 'prime' && c.program_week && c.program_week <= 20).length,
          longevity: contacts.filter(c => c.subscription_tier === 'longevity' && c.program_week && c.program_week <= 20).length
        },
        completed: {
          prime: 12, // Simulado
          longevity: 8 // Simulado
        },
        avgCompletionRate: 85.5 // Simulado
      },
      hieUsage: {
        totalQueries: 15420, // Simulado
        byAgent: {
          NEXUS: 3500,
          BLAZE: 2800,
          SAGE: 2300,
          NOVA: 1900,
          EDGE: 1500,
          PULSE: 1200,
          FLUX: 900,
          WAVE: 700,
          SPARK: 620,
          GUARDIAN: 0,
          NODE: 0
        },
        peakHours: [9, 14, 20] // Simulado
      }
    };
  };

  const generateAlerts = (contacts: any[], deals: any[]): OperationalAlert[] => {
    const alerts: OperationalAlert[] = [];
    
    // Trials expirando
    contacts
      .filter(c => c.subscription_status === 'trial' && c.trial_end_date)
      .forEach(contact => {
        const daysLeft = Math.ceil((new Date(contact.trial_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 3 && daysLeft > 0) {
          alerts.push({
            id: `trial-${contact.id}`,
            type: 'trial_expiring',
            priority: 'high',
            contactId: contact.id,
            contactName: contact.name,
            message: `Trial expira en ${daysLeft} días`,
            actionRequired: 'Contactar para conversión',
            dueDate: contact.trial_end_date,
            acknowledged: false
          });
        }
      });

    // Límites cercanos
    contacts
      .filter(c => c.subscription_tier && c.daily_queries_used)
      .forEach(contact => {
        const limit = contact.subscription_tier === 'essential' ? 12 : contact.subscription_tier === 'pro' ? 24 : Infinity;
        if (limit !== Infinity && contact.daily_queries_used >= limit * 0.8) {
          alerts.push({
            id: `limit-${contact.id}`,
            type: 'limit_approaching',
            priority: 'medium',
            contactId: contact.id,
            contactName: contact.name,
            message: `${contact.daily_queries_used}/${limit} consultas diarias usadas`,
            actionRequired: 'Sugerir upgrade',
            acknowledged: false
          });
        }
      });

    return alerts.slice(0, 5); // Top 5 alertas
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number, showSign = true) => {
    const formatted = `${value.toFixed(1)}%`;
    return showSign && value > 0 ? `+${formatted}` : formatted;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="ngx-spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-ngx-gradient font-josefin">NGX Executive Dashboard</h1>
          <p className="text-ngx-text-secondary mt-1">Sistema de agentes HIE + Coaching híbrido</p>
        </div>
        <div className="flex gap-2">
          {['day', 'week', 'month'].map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'ngx' : 'ngx-outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period as any)}
            >
              {period === 'day' ? 'Hoy' : period === 'week' ? 'Semana' : 'Mes'}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR Total */}
        <Card className="ngx-glass hover:border-ngx-electric-violet/50 transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-ngx-electric-violet" />
                MRR Total
              </span>
              <Badge variant="ngx" className="text-xs">
                {formatPercentage(metrics?.mrr.growth || 0)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-josefin">
              {formatCurrency(metrics?.mrr.total || 0)}
            </div>
            <div className="text-xs text-ngx-text-secondary mt-1">
              Meta: {formatCurrency(60000)}
            </div>
            <Progress 
              value={(metrics?.mrr.total || 0) / 600} 
              className="mt-2 h-1"
            />
          </CardContent>
        </Card>

        {/* Clientes Activos */}
        <Card className="ngx-glass hover:border-ngx-electric-violet/50 transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-ngx-electric-violet" />
                Clientes Activos
              </span>
              <Badge variant="ngx-outline" className="text-xs">
                {metrics?.customers.inTrial || 0} trials
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-josefin">
              {metrics?.customers.total || 0}
            </div>
            <div className="flex gap-4 mt-2">
              <div className="text-xs">
                <span className="text-ngx-text-secondary">Essential:</span> {metrics?.customers.byTier.essential || 0}
              </div>
              <div className="text-xs">
                <span className="text-ngx-text-secondary">Pro:</span> {metrics?.customers.byTier.pro || 0}
              </div>
              <div className="text-xs">
                <span className="text-ngx-text-secondary">Elite:</span> {metrics?.customers.byTier.elite || 0}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trial Conversion */}
        <Card className="ngx-glass hover:border-ngx-electric-violet/50 transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Target className="w-4 h-4 text-ngx-electric-violet" />
                Trial Conversion
              </span>
              <Badge variant={metrics?.trials.conversionRate >= 70 ? "ngx" : "ngx-outline"} className="text-xs">
                {metrics?.trials.conversionRate || 0}%
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-josefin">
              {metrics?.trials.active || 0} activos
            </div>
            <div className="text-xs text-ngx-text-secondary mt-1">
              Promedio: {metrics?.trials.avgDaysToConvert || 0} días
            </div>
          </CardContent>
        </Card>

        {/* Programas Premium */}
        <Card className="ngx-glass hover:border-ngx-electric-violet/50 transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-ngx-electric-violet" />
                Premium Programs
              </span>
              <Badge variant="ngx" className="text-xs">
                {metrics?.premiumPrograms.avgCompletionRate || 0}%
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-josefin">
              {(metrics?.premiumPrograms.active.prime || 0) + (metrics?.premiumPrograms.active.longevity || 0)}
            </div>
            <div className="flex gap-4 mt-2">
              <div className="text-xs">
                <span className="text-ngx-text-secondary">PRIME:</span> {metrics?.premiumPrograms.active.prime || 0}
              </div>
              <div className="text-xs">
                <span className="text-ngx-text-secondary">LONGEVITY:</span> {metrics?.premiumPrograms.active.longevity || 0}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MRR by Tier Chart */}
        <Card className="ngx-glass lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-josefin">
              <BarChart3 className="w-5 h-5 text-ngx-electric-violet" />
              MRR por Tier
            </CardTitle>
            <CardDescription>Ingresos recurrentes mensuales por nivel de suscripción</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(metrics?.mrr.byTier || {}).map(([tier, amount]) => {
                if (tier === 'prime' || tier === 'longevity') return null; // No MRR for programs
                const percentage = metrics ? (amount / metrics.mrr.total) * 100 : 0;
                return (
                  <div key={tier}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium capitalize">{tier}</span>
                      <span className="text-sm text-ngx-text-secondary">{formatCurrency(amount)}</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 pt-4 border-t border-ngx-border">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Revenue Total (inc. Premium)</span>
                <span className="text-lg font-bold text-ngx-electric-violet">
                  {formatCurrency((metrics?.mrr.total || 0) + 
                    ((metrics?.premiumPrograms.active.prime || 0) + (metrics?.premiumPrograms.active.longevity || 0)) * 3997 / 5)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operational Alerts */}
        <Card className="ngx-glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-josefin">
              <AlertTriangle className="w-5 h-5 text-ngx-electric-violet" />
              Alertas Operacionales
            </CardTitle>
            <CardDescription>Acciones requeridas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.length > 0 ? (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 rounded-lg border border-ngx-border hover:border-ngx-electric-violet/50 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          variant={alert.priority === 'high' ? 'ngx' : 'ngx-outline'}
                          className="text-xs"
                        >
                          {alert.type.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-ngx-text-secondary">{alert.contactName}</span>
                      </div>
                      <p className="text-sm">{alert.message}</p>
                      {alert.actionRequired && (
                        <p className="text-xs text-ngx-electric-violet mt-1">{alert.actionRequired}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-ngx-text-secondary text-center py-8">
                No hay alertas pendientes
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* HIE Usage Analytics */}
      <Card className="ngx-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-josefin">
            <Brain className="w-5 h-5 text-ngx-electric-violet" />
            HIE Agent Analytics
          </CardTitle>
          <CardDescription>Uso del sistema de agentes en las últimas 24 horas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {HIE_AGENTS.frontend.slice(0, 5).map((agent) => {
              const usage = metrics?.hieUsage.byAgent[agent] || 0;
              const percentage = metrics ? (usage / metrics.hieUsage.totalQueries) * 100 : 0;
              
              return (
                <div key={agent} className="text-center">
                  <div className="relative mb-2">
                    <AgentIcon agent={agent} size="lg" animated />
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-ngx-background px-2 py-1 rounded-full">
                      <span className="text-xs font-bold text-ngx-electric-violet">{percentage.toFixed(0)}%</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium font-josefin mt-4">{agent}</p>
                  <p className="text-xs text-ngx-text-secondary">{usage.toLocaleString()} queries</p>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 flex items-center justify-between p-4 rounded-lg bg-ngx-surface/50">
            <div>
              <p className="text-sm font-medium">Total Queries Hoy</p>
              <p className="text-2xl font-bold font-josefin text-ngx-electric-violet">
                {metrics?.hieUsage.totalQueries.toLocaleString() || 0}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">Peak Hours</p>
              <p className="text-sm text-ngx-text-secondary">
                {metrics?.hieUsage.peakHours.map(h => `${h}:00`).join(', ')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Agent Usage from GENESIS */}
      <div className="mt-8">
        <LiveAgentUsage />
      </div>

      {/* Premium Programs Tracker */}
      <div className="mt-8">
        <PremiumProgramsTracker />
      </div>
    </div>
  );
};

export default DashboardPage;