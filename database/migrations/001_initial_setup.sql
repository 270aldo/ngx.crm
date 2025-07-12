-- Migration: 001_initial_setup
-- Description: Initial database setup for NexusCRM
-- Date: 2024-01-21

-- This migration assumes you already have some tables from the exported Databutton app
-- It will add missing columns and tables to complete the CRM functionality

-- Add missing columns to existing tables if they don't exist
DO $$ 
BEGIN
    -- Add program_type to contacts if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contacts' AND column_name = 'program_type') THEN
        ALTER TABLE public.contacts ADD COLUMN program_type TEXT;
    END IF;

    -- Add custom_fields to contacts
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contacts' AND column_name = 'custom_fields') THEN
        ALTER TABLE public.contacts ADD COLUMN custom_fields JSONB DEFAULT '{}';
    END IF;

    -- Add tags to contacts
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contacts' AND column_name = 'tags') THEN
        ALTER TABLE public.contacts ADD COLUMN tags TEXT[];
    END IF;

    -- Add company to contacts
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contacts' AND column_name = 'company') THEN
        ALTER TABLE public.contacts ADD COLUMN company TEXT;
    END IF;

    -- Add position to contacts
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contacts' AND column_name = 'position') THEN
        ALTER TABLE public.contacts ADD COLUMN position TEXT;
    END IF;

    -- Add currency to deals
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'deals' AND column_name = 'currency') THEN
        ALTER TABLE public.deals ADD COLUMN currency TEXT DEFAULT 'USD';
    END IF;

    -- Add probability to deals
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'deals' AND column_name = 'probability') THEN
        ALTER TABLE public.deals ADD COLUMN probability INTEGER DEFAULT 0;
    END IF;

    -- Add expected_close_date to deals
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'deals' AND column_name = 'expected_close_date') THEN
        ALTER TABLE public.deals ADD COLUMN expected_close_date DATE;
    END IF;

    -- Add close_reason to deals
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'deals' AND column_name = 'close_reason') THEN
        ALTER TABLE public.deals ADD COLUMN close_reason TEXT;
    END IF;

    -- Add assigned_to to deals
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'deals' AND column_name = 'assigned_to') THEN
        ALTER TABLE public.deals ADD COLUMN assigned_to UUID;
    END IF;
END $$;

-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    department TEXT,
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    contact_id UUID REFERENCES public.contacts(id),
    lead_id UUID REFERENCES public.leads(id),
    deal_id UUID REFERENCES public.deals(id),
    created_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create email_templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    category TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    user_id UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON public.contacts(created_at);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON public.deals(deal_stage_id);
CREATE INDEX IF NOT EXISTS idx_deals_contact ON public.deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_interactions_contact ON public.interactions(contact_id);

-- Update deal stages to include probability and flags
UPDATE public.deal_stages SET probability = 10, is_won = false, is_lost = false WHERE name = 'Lead Qualification';
UPDATE public.deal_stages SET probability = 25, is_won = false, is_lost = false WHERE name = 'Needs Analysis';
UPDATE public.deal_stages SET probability = 50, is_won = false, is_lost = false WHERE name = 'Proposal Sent';
UPDATE public.deal_stages SET probability = 75, is_won = false, is_lost = false WHERE name = 'Negotiation';
UPDATE public.deal_stages SET probability = 100, is_won = true, is_lost = false WHERE name = 'Closed Won';
UPDATE public.deal_stages SET probability = 0, is_won = false, is_lost = true WHERE name = 'Closed Lost';

-- Add is_won and is_lost columns to deal_stages if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'deal_stages' AND column_name = 'is_won') THEN
        ALTER TABLE public.deal_stages ADD COLUMN is_won BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'deal_stages' AND column_name = 'is_lost') THEN
        ALTER TABLE public.deal_stages ADD COLUMN is_lost BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'deal_stages' AND column_name = 'probability') THEN
        ALTER TABLE public.deal_stages ADD COLUMN probability INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create a function to automatically create user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_profiles (id, full_name, role)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', 'user');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();