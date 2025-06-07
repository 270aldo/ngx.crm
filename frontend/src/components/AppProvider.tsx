import type { ReactNode } from "react";
import { useEffect } from "react"; // Import useEffect
import { ThemeProvider } from "@/components/theme-provider"; //shadcn theme provider
import { Toaster } from "sonner"; // sonner toast provider
import { useAuthStore } from "../utils/authStore"; // Import the auth store

interface Props {
  children: ReactNode;
}

/**
 * A provider wrapping the whole app.
 *
 * You can add multiple providers here by nesting them,
 * and they will all be applied to the app.
 *
 */
export const AppProvider = ({ children }: Props) => {
  // Initialize Supabase auth listener on app load
  useEffect(() => {
    const unsubscribe = useAuthStore.getState().initializeAuthListener();
    return () => {
      unsubscribe(); // Cleanup listener on component unmount
    };
  }, []);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      {children}
      <Toaster richColors />
    </ThemeProvider>
  );
};