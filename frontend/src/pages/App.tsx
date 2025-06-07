import React, { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Briefcase, BarChart2, Settings, Bell, UserCircle, LayoutDashboard, LogOut, ClipboardCheck, LayoutList } from "lucide-react";
import { useAuthStore } from "../utils/authStore"; // Import useAuthStore
import { toast } from "sonner";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/PipelinePage", label: "Pipeline", icon: LayoutList }, // Added PipelinePage
  { href: "/TasksPage", label: "Tasks", icon: ClipboardCheck }, // Added TasksPage
  { href: "/deals", label: "Deals", icon: Briefcase },
  { href: "/contacts", label: "Contacts", icon: UserCircle }, // Consider changing icon if UserCircle is for user profile
  { href: "/AnalyticsPage", label: "Analytics", icon: BarChart2 },
  { href: "/settings", label: "Settings", icon: Settings },
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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-foreground">Cargando...</p> {/* O un spinner real */}
      </div>
    );
  }

  // Si hay sesión, renderizar la app
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between h-16 px-6 border-b bg-background">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-primary">NexusCRM</h1>
        </div>
        <div className="flex items-center gap-4">
          <Input
            type="search"
            placeholder="Search (Cmd+K)..."
            className="w-64 h-9 text-sm bg-muted placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0"
          />
          <Button variant="ghost" size="icon" className="hover:text-primary">
            <Bell className="w-5 h-5" />
          </Button>
          {/* User profile/menu could go here */}
          <Button variant="ghost" size="icon" onClick={handleLogout} disabled={authLoading} className="hover:text-destructive">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar Navigation */}
        <aside className="w-64 p-4 space-y-4 border-r">
          <nav className="flex flex-col space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link to={item.href} key={item.label}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={`w-full justify-start ${isActive ? "text-primary hover:text-primary" : "hover:bg-muted hover:text-foreground"}`}
                  >
                    <Icon className="w-4 h-4 mr-2" /> {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area - Placeholder, will be replaced by <Outlet /> from react-router for nested routes */}
        <main className="flex-1 p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Pipeline Visualization Placeholder (col-span-2) */}
            <div className="p-6 rounded-lg shadow-md lg:col-span-2 bg-card min-h-[300px]">
              <h2 className="mb-4 text-lg font-semibold">Deal Pipeline</h2>
              <div className="h-full min-h-[200px] bg-muted rounded-md flex items-center justify-center">
                <p className="text-muted-foreground">Pipeline Visualization Area</p>
              </div>
            </div>

            {/* Summary Metrics Panel Placeholder (col-span-1) */}
            <div className="p-6 rounded-lg shadow-md bg-card min-h-[300px]">
              <h2 className="mb-4 text-lg font-semibold">Key Metrics</h2>
              <div className="space-y-4">
                <div className="p-4 rounded-md bg-muted">
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  <p className="text-2xl font-bold text-primary">--%</p>
                </div>
                <div className="p-4 rounded-md bg-muted">
                  <p className="text-sm text-muted-foreground">MRR</p>
                  <p className="text-2xl font-bold text-primary">$--,--</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
