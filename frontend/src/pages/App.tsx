import React, { useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Briefcase, BarChart2, Settings, Bell, UserCircle, LayoutDashboard, LogOut, ClipboardCheck, LayoutList, Zap, Brain, Target, Mic, Cube } from "lucide-react";
import NGXVoiceInterface from "../components/NGXVoiceInterface";
import NGX3DPipeline from "../components/NGX3DPipeline";
import { useAuthStore } from "../utils/authStore"; // Import useAuthStore
import { toast } from "sonner";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, description: "Panel ejecutivo NGX" },
  { href: "/PipelinePage", label: "Pipeline", icon: LayoutList, description: "Gestión de oportunidades" },
  { href: "/TasksPage", label: "Tasks", icon: ClipboardCheck, description: "Tareas y seguimiento" },
  { href: "/deals", label: "Deals", icon: Briefcase, description: "Negociaciones activas" },
  { href: "/contacts", label: "Contacts", icon: UserCircle, description: "Base de contactos" },
  { href: "/AnalyticsPage", label: "Analytics", icon: BarChart2, description: "Insights inteligentes" },
  { href: "/settings", label: "Settings", icon: Settings, description: "Configuración" },
];

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, signOut, isLoading: authLoading, isInitialized } = useAuthStore();

  useEffect(() => {
    // Solo redirigir si el estado de autenticación ya se inicializó y no hay sesión
    if (isInitialized && !session) {
      navigate("/LoginPage"); // Changed to PascalCase
    }
  }, [session, navigate, isInitialized]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Has cerrado sesión exitosamente.");
      navigate("/LoginPage"); // Changed to PascalCase
    } catch (error) {
      toast.error("Error al cerrar sesión.");
      // console.error("Logout error:", error);
    }
  };

  // Si no se ha inicializado o no hay sesión (y estamos en proceso de redirigir), mostrar un loader o nada
  if (!isInitialized || !session) {
    // Podrías mostrar un spinner de carga aquí mientras isInitialized es false
    // o mientras session es null y la redirección de useEffect aún no ha ocurrido.
    return (
      <div className="flex items-center justify-center min-h-screen ngx-glass animate-ngx-pulse">
        <div className="text-center">
          <div className="ngx-spinner mb-4 mx-auto"></div>
          <p className="text-ngx-gradient font-ngx-primary font-semibold">Inicializando NGX CRM...</p>
        </div>
      </div>
    );
  }

  // Si hay sesión, renderizar la app
  return (
    <div className="flex flex-col min-h-screen bg-ngx-background text-ngx-text-primary">
      {/* NGX Header */}
      <header className="sticky top-0 z-ngx-overlay flex items-center justify-between h-16 px-ngx-6 border-b border-ngx-border ngx-glass backdrop-blur-ngx-strong">
        <div className="flex items-center space-x-ngx-3">
          <div className="w-8 h-8 rounded-ngx-lg ngx-gradient-primary flex items-center justify-center animate-ngx-glow">
            <Zap className="w-4 h-4 text-ngx-white" />
          </div>
          <h1 className="text-ngx-xl font-ngx-primary font-bold text-ngx-gradient">
            NGX CRM
          </h1>
          <span className="text-ngx-xs font-ngx-secondary text-ngx-text-secondary px-ngx-2 py-ngx-1 rounded-ngx-full bg-ngx-electric-violet/20">
            NEXUS
          </span>
        </div>
        <div className="flex items-center gap-ngx-4">
          <div className="relative">
            <Input
              type="search"
              placeholder="Buscar en NGX CRM (Cmd+K)..."
              className="w-80 h-10 ngx-glass border-ngx-border placeholder:text-ngx-text-secondary/60 focus:border-ngx-electric-violet focus:shadow-ngx-glow-sm transition-all duration-ngx-normal"
            />
            <Brain className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-ngx-electric-violet" />
          </div>
          <Button variant="ngx-glass" size="icon" className="hover:shadow-ngx-glow-sm">
            <Bell className="w-5 h-5" />
          </Button>
          <Button 
            variant="ngx-glass" 
            size="icon" 
            onClick={handleLogout} 
            disabled={authLoading} 
            className="hover:text-destructive hover:shadow-ngx-glow-sm border-red-500/20"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* NGX Sidebar Navigation */}
        <aside className="w-72 p-ngx-6 space-y-ngx-6 border-r border-ngx-border ngx-glass backdrop-blur-ngx-strong">
          <div className="space-y-ngx-4">
            <div className="text-center py-ngx-4">
              <div className="w-16 h-16 mx-auto rounded-ngx-full ngx-gradient-primary flex items-center justify-center mb-ngx-3 animate-ngx-float">
                <Target className="w-8 h-8 text-ngx-white" />
              </div>
              <h3 className="font-ngx-primary font-semibold text-ngx-gradient">Mission Control</h3>
              <p className="text-ngx-xs font-ngx-secondary text-ngx-text-secondary mt-1">Optimización total</p>
            </div>
            
            <nav className="flex flex-col space-y-ngx-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link to={item.href} key={item.label} className="group">
                    <Button
                      variant={isActive ? "ngx-gradient" : "ngx-glass"}
                      className={`w-full justify-start h-12 text-left transition-all duration-ngx-normal hover-ngx-lift ${
                        isActive 
                          ? "shadow-ngx-glow-md border-ngx-electric-violet" 
                          : "hover:border-ngx-border-hover hover:shadow-ngx-glow-sm"
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-ngx-3" /> 
                      <div className="flex-1">
                        <div className="font-ngx-primary font-medium">{item.label}</div>
                        <div className="text-ngx-xs text-ngx-text-secondary font-ngx-secondary">{item.description}</div>
                      </div>
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* NGX Main Content Area */}
        <main className="flex-1 p-ngx-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
