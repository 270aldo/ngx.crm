import { createClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseAnonKey } from "./supabaseConfig";

// Create a single Supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
