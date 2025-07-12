/**
 * NGX Voice Interface Component
 * 
 * Interfaz de voz avanzada para control hands-free del CRM
 * Integrado con NGX_Closer.Agent para comandos inteligentes
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Brain, 
  Zap, 
  Activity,
  Settings,
  Play,
  Pause
} from 'lucide-react';
import { useNGXMCPBridge } from '../services/ngx-mcp-bridge';
import { toast } from 'sonner';

interface VoiceCommand {
  command: string;
  confidence: number;
  timestamp: string;
  action?: string;
  parameters?: Record<string, any>;
}

interface VoiceInterfaceState {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  lastCommand: VoiceCommand | null;
  commandHistory: VoiceCommand[];
  voiceEnabled: boolean;
  speechEnabled: boolean;
}

export const NGXVoiceInterface: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { bridge, connectionStatus } = useNGXMCPBridge();
  
  const [state, setState] = useState<VoiceInterfaceState>({
    isListening: false,
    isProcessing: false,
    isSpeaking: false,
    lastCommand: null,
    commandHistory: [],
    voiceEnabled: false,
    speechEnabled: true
  });

  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [synthesis, setSynthesis] = useState<SpeechSynthesis | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Inicializar APIs de voz
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'es-ES';
      
      setRecognition(recognitionInstance);
      setState(prev => ({ ...prev, voiceEnabled: true }));
    }

    if ('speechSynthesis' in window) {
      setSynthesis(window.speechSynthesis);
    }

    // Inicializar AudioContext para visualización
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
    } catch (error) {
      console.warn('AudioContext no disponible:', error);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Configurar eventos de reconocimiento de voz
  useEffect(() => {
    if (!recognition) return;

    recognition.onstart = () => {
      setState(prev => ({ ...prev, isListening: true }));
      startAudioVisualization();
    };

    recognition.onend = () => {
      setState(prev => ({ ...prev, isListening: false }));
      stopAudioVisualization();
    };

    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      if (result.isFinal) {
        const command = result[0].transcript.trim();
        const confidence = result[0].confidence;
        
        processVoiceCommand({
          command,
          confidence,
          timestamp: new Date().toISOString()
        });
      }
    };

    recognition.onerror = (event) => {
      console.error('Error de reconocimiento de voz:', event.error);
      toast.error(`Error de voz: ${event.error}`);
      setState(prev => ({ ...prev, isListening: false }));
    };
  }, [recognition]);

  // Procesar comandos de voz
  const processVoiceCommand = useCallback(async (voiceCommand: VoiceCommand) => {
    setState(prev => ({ 
      ...prev, 
      isProcessing: true,
      lastCommand: voiceCommand,
      commandHistory: [voiceCommand, ...prev.commandHistory].slice(0, 10)
    }));

    try {
      // Analizar comando con NGX_Closer.Agent
      const response = await bridge.sendMCPRequest('/voice-command', {
        command: voiceCommand.command,
        confidence: voiceCommand.confidence,
        context: 'crm_interface'
      });

      if (response.success && response.data) {
        const { action, parameters, response: aiResponse } = response.data;
        
        // Ejecutar acción detectada
        await executeVoiceAction(action, parameters);
        
        // Responder con voz si está habilitado
        if (state.speechEnabled && aiResponse) {
          speak(aiResponse);
        }

        // Actualizar comando con acción detectada
        setState(prev => ({
          ...prev,
          lastCommand: {
            ...voiceCommand,
            action,
            parameters
          }
        }));

        toast.success(`Comando ejecutado: ${action}`);
      }
    } catch (error) {
      console.error('Error procesando comando de voz:', error);
      toast.error('Error procesando comando de voz');
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [bridge, state.speechEnabled]);

  // Ejecutar acciones basadas en comandos de voz
  const executeVoiceAction = async (action: string, parameters: any) => {
    switch (action) {
      case 'navigate_to_page':
        if (parameters.page) {
          window.location.href = `/${parameters.page}`;
        }
        break;
      
      case 'search_contacts':
        if (parameters.query) {
          // Implementar búsqueda de contactos
          console.log('Buscando contactos:', parameters.query);
        }
        break;
      
      case 'create_task':
        if (parameters.title) {
          // Implementar creación de tarea
          console.log('Creando tarea:', parameters.title);
        }
        break;
      
      case 'show_analytics':
        window.location.href = '/AnalyticsPage';
        break;
      
      case 'detect_tier':
        // Trigger tier detection
        console.log('Detectando tier para:', parameters.contactId);
        break;
      
      default:
        console.log('Acción no reconocida:', action);
    }
  };

  // Síntesis de voz
  const speak = (text: string) => {
    if (!synthesis || !state.speechEnabled) return;

    setState(prev => ({ ...prev, isSpeaking: true }));
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    
    utterance.onend = () => {
      setState(prev => ({ ...prev, isSpeaking: false }));
    };

    synthesis.speak(utterance);
  };

  // Visualización de audio
  const startAudioVisualization = () => {
    if (!analyserRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      
      analyser.getByteFrequencyData(dataArray);
      
      ctx!.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx!.fillRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = canvas.width / bufferLength;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        
        const hue = (i / bufferLength) * 360;
        ctx!.fillStyle = `hsla(${264}, 63%, 62%, ${barHeight / canvas.height})`;
        ctx!.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        
        x += barWidth;
      }
    };

    draw();
  };

  const stopAudioVisualization = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  // Control de escucha
  const toggleListening = () => {
    if (!recognition) return;

    if (state.isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  // Toggle síntesis de voz
  const toggleSpeech = () => {
    setState(prev => ({ ...prev, speechEnabled: !prev.speechEnabled }));
    if (state.isSpeaking && synthesis) {
      synthesis.cancel();
      setState(prev => ({ ...prev, isSpeaking: false }));
    }
  };

  if (!state.voiceEnabled) {
    return (
      <Card className={`border-l-4 border-l-yellow-500 ${className}`}>
        <CardContent className="py-6">
          <div className="text-center text-yellow-600">
            <MicOff className="w-8 h-8 mx-auto mb-2" />
            <p>Reconocimiento de voz no disponible en este navegador</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-l-4 border-l-ngx-electric-violet hover-ngx-glow ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center text-ngx-gradient">
            <Brain className="w-5 h-5 mr-2" />
            NGX Voice Control
          </span>
          <div className="flex items-center space-x-2">
            {connectionStatus ? (
              <Badge variant="ngx" className="animate-ngx-pulse">
                <Activity className="w-3 h-3 mr-1" />
                ACTIVE
              </Badge>
            ) : (
              <Badge variant="destructive">
                OFFLINE
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Audio Visualization */}
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={300}
              height={60}
              className="w-full h-15 rounded-ngx-lg ngx-glass border border-ngx-border"
            />
            {state.isListening && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-ngx-electric-violet animate-ngx-pulse"></div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex justify-center space-x-4">
            <Button
              onClick={toggleListening}
              disabled={!connectionStatus}
              variant={state.isListening ? "destructive" : "ngx"}
              size="lg"
              className="relative"
            >
              {state.isListening ? (
                <MicOff className="w-5 h-5 mr-2" />
              ) : (
                <Mic className="w-5 h-5 mr-2" />
              )}
              {state.isListening ? 'Parar' : 'Escuchar'}
              {state.isListening && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ngx-pulse"></div>
              )}
            </Button>

            <Button
              onClick={toggleSpeech}
              variant={state.speechEnabled ? "ngx" : "ngx-outline"}
              size="lg"
            >
              {state.speechEnabled ? (
                <Volume2 className="w-5 h-5 mr-2" />
              ) : (
                <VolumeX className="w-5 h-5 mr-2" />
              )}
              Voz
            </Button>
          </div>

          {/* Status */}
          <div className="text-center space-y-2">
            {state.isProcessing && (
              <div className="flex items-center justify-center space-x-2">
                <div className="ngx-spinner w-4 h-4"></div>
                <span className="text-sm text-ngx-text-secondary">Procesando comando...</span>
              </div>
            )}
            
            {state.isSpeaking && (
              <div className="flex items-center justify-center space-x-2">
                <Play className="w-4 h-4 text-ngx-electric-violet" />
                <span className="text-sm text-ngx-text-secondary">NGX respondiendo...</span>
              </div>
            )}
          </div>

          {/* Last Command */}
          {state.lastCommand && (
            <div className="ngx-glass p-4 rounded-ngx-lg">
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm font-medium">Último Comando:</span>
                <Badge variant="ngx-outline" className="text-xs">
                  {Math.round(state.lastCommand.confidence * 100)}%
                </Badge>
              </div>
              <p className="text-sm text-ngx-text-secondary mb-2">
                "{state.lastCommand.command}"
              </p>
              {state.lastCommand.action && (
                <Badge variant="ngx" className="text-xs">
                  Acción: {state.lastCommand.action}
                </Badge>
              )}
            </div>
          )}

          {/* Voice Commands Help */}
          <div className="ngx-glass p-4 rounded-ngx-lg">
            <h4 className="text-sm font-medium mb-3 flex items-center">
              <Zap className="w-4 h-4 mr-2 text-ngx-electric-violet" />
              Comandos Disponibles:
            </h4>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="flex justify-between">
                <span>"Ir a analytics"</span>
                <span className="text-ngx-text-secondary">Navegar a página</span>
              </div>
              <div className="flex justify-between">
                <span>"Buscar contacto [nombre]"</span>
                <span className="text-ngx-text-secondary">Buscar en CRM</span>
              </div>
              <div className="flex justify-between">
                <span>"Crear tarea [título]"</span>
                <span className="text-ngx-text-secondary">Nueva tarea</span>
              </div>
              <div className="flex justify-between">
                <span>"Detectar tier"</span>
                <span className="text-ngx-text-secondary">Análisis IA</span>
              </div>
              <div className="flex justify-between">
                <span>"Mostrar pipeline"</span>
                <span className="text-ngx-text-secondary">Ver deals</span>
              </div>
            </div>
          </div>

          {/* Command History */}
          {state.commandHistory.length > 0 && (
            <details className="ngx-glass p-4 rounded-ngx-lg">
              <summary className="text-sm font-medium cursor-pointer">
                Historial de Comandos ({state.commandHistory.length})
              </summary>
              <div className="mt-3 space-y-2 max-h-32 overflow-y-auto">
                {state.commandHistory.map((cmd, index) => (
                  <div key={index} className="text-xs p-2 bg-ngx-surface rounded border border-ngx-border">
                    <div className="flex justify-between items-start">
                      <span>"{cmd.command}"</span>
                      <span className="text-ngx-text-secondary">
                        {new Date(cmd.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {cmd.action && (
                      <div className="mt-1">
                        <Badge variant="ngx-outline" className="text-xs">
                          {cmd.action}
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NGXVoiceInterface;