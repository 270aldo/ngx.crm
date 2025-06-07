import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "../utils/authStore"; // Ajusta la ruta si es necesario
import { toast } from "sonner";

export default function LoginPage() {
  const navigate = useNavigate();
  const { signInWithPassword, isLoading, error, session } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Por favor, ingresa tu email y contraseña.");
      return;
    }
    try {
      await signInWithPassword(email, password);
      // Listener en authStore debería actualizar el estado y redirigir o App.tsx manejará la redirección basada en sesión
    } catch (err) {
      // El error ya se maneja y se setea en el store, se podría mostrar aquí también si se desea.
      // toast.error(error?.message || "Error al iniciar sesión. Verifica tus credenciales.");
      // No es necesario mostrarlo aquí si el store lo maneja y tenemos un listener para errores global o en el form
    }
  };

  React.useEffect(() => {
    if (session) {
      navigate("/"); // Redirige a la página principal si ya hay sesión
    }
  }, [session, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center text-primary">NexusCRM Login</CardTitle>
          <CardDescription className="text-center">
            Ingresa tus credenciales para acceder a tu dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive text-center">{error.message}</p>
            )}
            <Button type="submit" className="w-full mt-2" disabled={isLoading}>
              {isLoading ? "Ingresando..." : "Ingresar"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col text-xs text-center">
            <p className="text-muted-foreground">
                Bienvenido al centro de comando de NexusCRM.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
