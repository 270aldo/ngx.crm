/**
 * Premium Programs Tracker Component
 * Gestión de programas PRIME y LONGEVITY de 20 semanas
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar,
  Clock,
  User,
  Target,
  Gift,
  ChevronRight,
  Video,
  CheckCircle2,
  Circle,
  AlertCircle,
  Sparkles,
  Heart,
  Brain
} from 'lucide-react';
import { api } from '../services/api';
import type { ContactRead } from '../services/api';
import type { CoachingSession, PremiumBonus } from '../types/subscription';

interface ProgramParticipant extends ContactRead {
  coachingSessions?: CoachingSession[];
  premiumBonuses?: PremiumBonus[];
}

const PremiumProgramsTracker: React.FC = () => {
  const [participants, setParticipants] = useState<ProgramParticipant[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<'all' | 'prime' | 'longevity'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgramParticipants();
  }, []);

  const loadProgramParticipants = async () => {
    try {
      setLoading(true);
      const contacts = await api.contacts.getAll();
      
      // Filtrar solo participantes de programas premium
      const premiumParticipants = contacts.filter(
        c => c.subscription_tier === 'prime' || c.subscription_tier === 'longevity'
      );

      // Simular sesiones y bonos (en producción vendría del backend)
      const enrichedParticipants = premiumParticipants.map(p => ({
        ...p,
        coachingSessions: generateMockSessions(p),
        premiumBonuses: generateMockBonuses(p)
      }));

      setParticipants(enrichedParticipants);
    } catch (error) {
      console.error('Error loading participants:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockSessions = (participant: ContactRead): CoachingSession[] => {
    const sessions: CoachingSession[] = [];
    const currentWeek = participant.program_week || 1;
    const sessionsCompleted = Math.floor((currentWeek - 1) / 2); // 1 sesión cada 2 semanas

    for (let i = 1; i <= 10; i++) {
      const weekNumber = i * 2;
      sessions.push({
        id: `session-${participant.id}-${i}`,
        programType: participant.subscription_tier as 'prime' | 'longevity',
        sessionNumber: i,
        scheduledDate: new Date(Date.now() + (weekNumber - currentWeek) * 7 * 24 * 60 * 60 * 1000).toISOString(),
        completedDate: i <= sessionsCompleted ? new Date(Date.now() - (currentWeek - weekNumber) * 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        duration: i <= sessionsCompleted ? 45 + Math.floor(Math.random() * 15) : undefined,
        focusArea: getFocusArea(participant.subscription_tier as string, i)
      });
    }
    return sessions;
  };

  const generateMockBonuses = (participant: ContactRead): PremiumBonus[] => {
    return [
      {
        type: 'vip_session',
        value: 497,
        delivered: participant.program_week ? participant.program_week >= 1 : false,
        deliveredDate: participant.program_week && participant.program_week >= 1 ? 
          new Date(Date.now() - (participant.program_week - 1) * 7 * 24 * 60 * 60 * 1000).toISOString() : undefined
      },
      {
        type: 'elite_community',
        value: 997,
        delivered: participant.program_week ? participant.program_week >= 2 : false,
        deliveredDate: participant.program_week && participant.program_week >= 2 ? 
          new Date(Date.now() - (participant.program_week - 2) * 7 * 24 * 60 * 60 * 1000).toISOString() : undefined
      },
      {
        type: 'biohacking_kit',
        value: 297,
        delivered: participant.program_week ? participant.program_week >= 4 : false
      },
      {
        type: 'post_program_support',
        value: 597,
        delivered: false
      }
    ];
  };

  const getFocusArea = (program: string, sessionNumber: number): string => {
    const primeAreas = [
      'Evaluación inicial y metas',
      'Optimización de energía',
      'Gestión del estrés ejecutivo',
      'Productividad peak',
      'Liderazgo consciente',
      'Balance trabajo-vida',
      'Sistemas de alto rendimiento',
      'Resiliencia mental',
      'Estrategias de recuperación',
      'Maestría y sostenibilidad'
    ];

    const longevityAreas = [
      'Evaluación biomarcadores',
      'Protocolos nutricionales',
      'Optimización del sueño',
      'Ejercicio personalizado',
      'Gestión del estrés',
      'Suplementación estratégica',
      'Detox y regeneración',
      'Hormonas y metabolismo',
      'Longevidad cognitiva',
      'Plan de vida sostenible'
    ];

    return program === 'prime' ? primeAreas[sessionNumber - 1] : longevityAreas[sessionNumber - 1];
  };

  const getWeekPhase = (week: number): { phase: string; description: string } => {
    if (week <= 4) return { phase: 'Fundación', description: 'Estableciendo bases sólidas' };
    if (week <= 12) return { phase: 'Aceleración', description: 'Implementación intensiva' };
    return { phase: 'Maestría', description: 'Refinamiento y sostenibilidad' };
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-MX', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const filteredParticipants = participants.filter(p => {
    if (selectedProgram === 'all') return true;
    return p.subscription_tier === selectedProgram;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="ngx-spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-josefin">Premium Programs Tracker</h2>
          <p className="text-ngx-text-secondary">Gestión de programas PRIME y LONGEVITY de 20 semanas</p>
        </div>
        <div className="flex gap-2">
          {['all', 'prime', 'longevity'].map((filter) => (
            <Button
              key={filter}
              variant={selectedProgram === filter ? 'ngx' : 'ngx-outline'}
              size="sm"
              onClick={() => setSelectedProgram(filter as any)}
            >
              {filter === 'all' ? 'Todos' : filter.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* Participants Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredParticipants.map((participant) => {
          const currentWeek = participant.program_week || 1;
          const progress = (currentWeek / 20) * 100;
          const phase = getWeekPhase(currentWeek);
          const completedSessions = participant.coachingSessions?.filter(s => s.completedDate).length || 0;
          const nextSession = participant.coachingSessions?.find(s => !s.completedDate);
          
          return (
            <Card key={participant.id} className="ngx-glass hover:border-ngx-electric-violet/50 transition-all">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {participant.subscription_tier === 'prime' ? (
                        <Brain className="w-5 h-5 text-ngx-electric-violet" />
                      ) : (
                        <Heart className="w-5 h-5 text-ngx-deep-purple" />
                      )}
                      <span className="font-josefin">{participant.name}</span>
                      <Badge variant="ngx" className="ml-2">
                        {participant.subscription_tier?.toUpperCase()}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {participant.email} • {participant.company}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">Semana {currentWeek}/20</p>
                    <p className="text-xs text-ngx-text-secondary">{phase.phase}</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-ngx-text-secondary">Progreso del programa</span>
                    <span className="text-sm font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-ngx-text-secondary mt-1">{phase.description}</p>
                </div>

                {/* Sessions Status */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-ngx-surface/50">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-ngx-electric-violet" />
                    <span className="text-sm">Sesiones 1:1</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{completedSessions}/10</span>
                    {nextSession && (
                      <Badge variant="ngx-outline" className="text-xs">
                        Próxima: {formatDate(nextSession.scheduledDate!)}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Focus Areas */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Áreas de enfoque</p>
                  <div className="flex flex-wrap gap-1">
                    {participant.coachingSessions?.slice(0, 3).map((session) => (
                      <div key={session.id} className="flex items-center gap-1">
                        {session.completedDate ? (
                          <CheckCircle2 className="w-3 h-3 text-green-400" />
                        ) : (
                          <Circle className="w-3 h-3 text-ngx-text-secondary" />
                        )}
                        <span className="text-xs text-ngx-text-secondary">
                          {session.focusArea}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bonuses */}
                <div className="space-y-2">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Gift className="w-4 h-4 text-ngx-electric-violet" />
                    Bonos Premium
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {participant.premiumBonuses?.map((bonus) => (
                      <div
                        key={bonus.type}
                        className={`p-2 rounded-lg border ${
                          bonus.delivered 
                            ? 'border-green-400/50 bg-green-400/10' 
                            : 'border-ngx-border bg-ngx-surface/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs capitalize">
                            {bonus.type.replace(/_/g, ' ')}
                          </span>
                          {bonus.delivered ? (
                            <CheckCircle2 className="w-3 h-3 text-green-400" />
                          ) : (
                            <Circle className="w-3 h-3 text-ngx-text-secondary" />
                          )}
                        </div>
                        <p className="text-xs text-ngx-text-secondary mt-1">
                          ${bonus.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button variant="ngx" size="sm" className="flex-1">
                    <Calendar className="w-4 h-4 mr-1" />
                    Agendar Sesión
                  </Button>
                  <Button variant="ngx-outline" size="sm" className="flex-1">
                    Ver Detalles
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredParticipants.length === 0 && (
        <Card className="ngx-glass">
          <CardContent className="text-center py-12">
            <Sparkles className="w-12 h-12 text-ngx-electric-violet mx-auto mb-4 opacity-50" />
            <p className="text-ngx-text-secondary">
              No hay participantes activos en programas premium
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PremiumProgramsTracker;