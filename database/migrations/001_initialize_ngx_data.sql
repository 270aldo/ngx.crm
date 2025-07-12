-- NGX CRM Initial Data Migration
-- This migration sets up the initial data structure for NGX team

BEGIN;

-- Insert default deal stages if they don't exist
INSERT INTO public.deal_stages (name, pipeline_order, probability, is_won, is_lost) VALUES
    ('Lead Qualification', 1, 10, false, false),
    ('Needs Analysis', 2, 25, false, false),
    ('Proposal Sent', 3, 50, false, false),
    ('Negotiation', 4, 75, false, false),
    ('Closed Won', 5, 100, true, false),
    ('Closed Lost', 6, 0, false, true)
ON CONFLICT (pipeline_order) DO NOTHING;

-- Create NGX sample user profiles (these would normally be created through Supabase Auth)
-- These are test UUIDs for development purposes
INSERT INTO public.user_profiles (id, full_name, role, department, phone) VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'NGX Admin', 'admin', 'Technology', '+1-555-0100'),
    ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'NGX Manager', 'manager', 'Business Development', '+1-555-0101'),
    ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'NGX User', 'user', 'Sales', '+1-555-0102')
ON CONFLICT (id) DO NOTHING;

-- Insert sample contacts
INSERT INTO public.contacts (name, email, phone, company, position, program_type, source, status, tags, created_by) VALUES
    ('John Smith', 'john.smith@techcorp.com', '+1-555-1001', 'TechCorp Inc', 'CTO', 'PRIME', 'Website', 'active', ARRAY['enterprise', 'tech'], 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
    ('Sarah Johnson', 'sarah.j@innovate.io', '+1-555-1002', 'Innovate Solutions', 'CEO', 'LONGEVITY', 'Referral', 'active', ARRAY['startup', 'ai'], 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
    ('Mike Chen', 'mike.chen@healthplus.com', '+1-555-1003', 'HealthPlus Corp', 'Head of Digital', 'CUSTOM', 'Conference', 'active', ARRAY['healthcare', 'digital'], 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
    ('Emily Rodriguez', 'emily.r@financetech.co', '+1-555-1004', 'FinanceTech Solutions', 'VP Technology', 'PRIME', 'LinkedIn', 'active', ARRAY['fintech', 'enterprise'], 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
    ('David Thompson', 'david.t@retailmax.com', '+1-555-1005', 'RetailMax Group', 'IT Director', 'LONGEVITY', 'Cold Outreach', 'inactive', ARRAY['retail', 'legacy'], 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
ON CONFLICT (email) DO NOTHING;

-- Insert sample leads
INSERT INTO public.leads (name, email, phone, company, source, program, status, score, assigned_to, notes, created_by) VALUES
    ('Alex Martinez', 'alex.m@startupx.com', '+1-555-2001', 'StartupX', 'Website', 'PRIME', 'new', 75, 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'High potential lead from enterprise segment', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
    ('Lisa Wang', 'lisa.wang@techventures.co', '+1-555-2002', 'Tech Ventures', 'Referral', 'LONGEVITY', 'contacted', 85, 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Very interested in AI solutions', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
    ('Robert Brown', 'rob.brown@manufacturing.inc', '+1-555-2003', 'Manufacturing Inc', 'Trade Show', 'CUSTOM', 'qualified', 60, 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Looking for automation solutions', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
    ('Jennifer Lee', 'jen.lee@healthsystems.org', '+1-555-2004', 'Health Systems LLC', 'LinkedIn', 'PRIME', 'new', 40, 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Early stage interest', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
    ('Carlos Gonzalez', 'carlos.g@globalcorp.com', '+1-555-2005', 'Global Corp', 'Cold Email', 'LONGEVITY', 'contacted', 70, 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Decision maker confirmed', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
ON CONFLICT (email) DO NOTHING;

-- Insert sample deals (linked to contacts)
INSERT INTO public.deals (name, value_amount, deal_stage_id, contact_id, probability, expected_close_date, assigned_to, created_by) VALUES
    ('TechCorp PRIME Implementation', 125000.00, (SELECT id FROM public.deal_stages WHERE name = 'Proposal Sent'), (SELECT id FROM public.contacts WHERE email = 'john.smith@techcorp.com'), 50, CURRENT_DATE + INTERVAL '30 days', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
    ('Innovate Solutions AI Package', 75000.00, (SELECT id FROM public.deal_stages WHERE name = 'Negotiation'), (SELECT id FROM public.contacts WHERE email = 'sarah.j@innovate.io'), 75, CURRENT_DATE + INTERVAL '15 days', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
    ('HealthPlus Custom Integration', 200000.00, (SELECT id FROM public.deal_stages WHERE name = 'Needs Analysis'), (SELECT id FROM public.contacts WHERE email = 'mike.chen@healthplus.com'), 25, CURRENT_DATE + INTERVAL '60 days', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
    ('FinanceTech Enterprise Solution', 300000.00, (SELECT id FROM public.deal_stages WHERE name = 'Lead Qualification'), (SELECT id FROM public.contacts WHERE email = 'emily.r@financetech.co'), 10, CURRENT_DATE + INTERVAL '90 days', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
    ('NGX Training Program', 50000.00, (SELECT id FROM public.deal_stages WHERE name = 'Closed Won'), NULL, 100, CURRENT_DATE - INTERVAL '5 days', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
ON CONFLICT DO NOTHING;

-- Insert sample tasks
INSERT INTO public.tasks (title, description, due_date, status, priority, assigned_to_user_id, related_contact_id, created_by_user_id) VALUES
    ('Follow up with TechCorp', 'Schedule demo for PRIME solution', CURRENT_DATE + INTERVAL '2 days', 'To Do', 'High', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', (SELECT id FROM public.contacts WHERE email = 'john.smith@techcorp.com'), 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
    ('Prepare Innovate Solutions proposal', 'Create detailed proposal for AI package', CURRENT_DATE + INTERVAL '1 day', 'In Progress', 'High', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', (SELECT id FROM public.contacts WHERE email = 'sarah.j@innovate.io'), 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
    ('Research HealthPlus requirements', 'Analyze custom integration needs', CURRENT_DATE + INTERVAL '5 days', 'To Do', 'Medium', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', (SELECT id FROM public.contacts WHERE email = 'mike.chen@healthplus.com'), 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
    ('FinanceTech discovery call', 'Initial needs assessment call', CURRENT_DATE + INTERVAL '3 days', 'To Do', 'Medium', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', (SELECT id FROM public.contacts WHERE email = 'emily.r@financetech.co'), 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
    ('Update CRM documentation', 'Document new features and processes', CURRENT_DATE + INTERVAL '7 days', 'To Do', 'Low', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', NULL, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
ON CONFLICT DO NOTHING;

-- Insert sample interactions
INSERT INTO public.interactions (type, channel, subject, summary, direction, contact_id, created_by) VALUES
    ('email', 'email', 'PRIME Solution Inquiry', 'Initial inquiry about PRIME implementation timeline and pricing', 'inbound', (SELECT id FROM public.contacts WHERE email = 'john.smith@techcorp.com'), 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
    ('call', 'phone', 'Discovery Call - AI Solutions', 'Discussed AI implementation strategy and budget approval process', 'outbound', (SELECT id FROM public.contacts WHERE email = 'sarah.j@innovate.io'), 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
    ('meeting', 'zoom', 'Custom Integration Planning', 'Technical requirements gathering for custom HealthPlus integration', 'outbound', (SELECT id FROM public.contacts WHERE email = 'mike.chen@healthplus.com'), 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
    ('email', 'email', 'Enterprise Solution Follow-up', 'Sent detailed enterprise package information and case studies', 'outbound', (SELECT id FROM public.contacts WHERE email = 'emily.r@financetech.co'), 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
    ('note', 'internal', 'RetailMax Account Review', 'Account marked inactive due to lack of engagement over 6 months', 'internal', (SELECT id FROM public.contacts WHERE email = 'david.t@retailmax.com'), 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
ON CONFLICT DO NOTHING;

-- Insert sample notes
INSERT INTO public.notes (content, contact_id, created_by) VALUES
    ('TechCorp has budget approved for Q1 implementation. Priority project for their digital transformation.', (SELECT id FROM public.contacts WHERE email = 'john.smith@techcorp.com'), 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
    ('Innovate Solutions CEO very impressed with AI demo. Ready to move forward quickly.', (SELECT id FROM public.contacts WHERE email = 'sarah.j@innovate.io'), 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
    ('HealthPlus needs extensive customization for HIPAA compliance. May require 6-month timeline.', (SELECT id FROM public.contacts WHERE email = 'mike.chen@healthplus.com'), 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
    ('FinanceTech requires board approval for enterprise deals over $250K. Next board meeting in 3 weeks.', (SELECT id FROM public.contacts WHERE email = 'emily.r@financetech.co'), 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
ON CONFLICT DO NOTHING;

-- Update the schema to ensure RLS policies are properly set
-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can create contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can update their own contacts" ON public.contacts;

-- Create comprehensive RLS policies for contacts
CREATE POLICY "Allow authenticated users to view contacts" ON public.contacts
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to create contacts" ON public.contacts
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to update contacts" ON public.contacts
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to delete contacts" ON public.contacts
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Similar policies for other tables
CREATE POLICY "Allow authenticated users to view leads" ON public.leads
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to create leads" ON public.leads
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to update leads" ON public.leads
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to delete leads" ON public.leads
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Deals policies
CREATE POLICY "Allow authenticated users to view deals" ON public.deals
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to create deals" ON public.deals
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to update deals" ON public.deals
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to delete deals" ON public.deals
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Tasks policies
CREATE POLICY "Allow authenticated users to view tasks" ON public.tasks
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to create tasks" ON public.tasks
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to update tasks" ON public.tasks
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to delete tasks" ON public.tasks
    FOR DELETE USING (auth.uid() IS NOT NULL);

COMMIT;