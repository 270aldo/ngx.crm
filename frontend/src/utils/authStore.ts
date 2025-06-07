import { create } from 'zustand';
import { supabase } from './supabaseClient';
import type { AuthSession, User } from '@supabase/supabase-js';

interface AuthState {
  session: AuthSession | null;
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  isInitialized: boolean; // To track if the initial auth state has been checked
  initializeAuthListener: () => () => void; // Returns the unsubscribe function
  signInWithPassword: (email: string, password: string) => Promise<void>;
  // signUpWithPassword: (email: string, password: string) => Promise<void>; // Optional: if you need registration
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  isLoading: false,
  error: null,
  isInitialized: false,

  initializeAuthListener: () => {
    set({ isLoading: true });
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, user: session?.user ?? null, isInitialized: true, isLoading: false });
    }).catch(error => {
      set({ error: error as Error, isInitialized: true, isLoading: false });
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        set({ session, user: session?.user ?? null, isLoading: false, isInitialized: true });
      }
    );
    return () => {
      authListener?.subscription.unsubscribe();
    };
  },

  signInWithPassword: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      set({ session: data.session, user: data.user, isLoading: false });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      // console.error("Sign in error:", error);
      throw error; // Re-throw to be caught in the component
    }
  },

  // Example for signUp - uncomment and adapt if needed
  // signUpWithPassword: async (email, password) => {
  //   set({ isLoading: true, error: null });
  //   try {
  //     const { data, error } = await supabase.auth.signUp({
  //       email,
  //       password,
  //       // options: { data: { full_name: 'Your Name' } } // example of additional data
  //     });
  //     if (error) throw error;
  //     // Depending on your Supabase settings (email confirmation), 
  //     // user might not be signed in immediately.
  //     // You might want to set session/user here or let onAuthStateChange handle it.
  //     set({ session: data.session, user: data.user, isLoading: false }); 
  //   } catch (error) {
  //     set({ error: error as Error, isLoading: false });
  //     throw error;
  //   }
  // },

  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ session: null, user: null, isLoading: false });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      // console.error("Sign out error:", error);
      throw error; // Re-throw to be caught in the component
    }
  },
}));

// Initialize the auth listener when the store is first imported/used.
// This is a common pattern, but consider calling it explicitly in your App's entry point (e.g., App.tsx or main.tsx)
// if you need more control over when it runs.
// const unsubscribe = useAuthStore.getState().initializeAuthListener();
// If you uncomment the above, make sure to handle unsubscription on app unmount if necessary.
