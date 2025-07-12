-- Sample Data for NexusCRM Testing
-- This file contains sample data for testing the CRM functionality

-- Note: This assumes the schema.sql has been run first

-- Insert sample user profiles (these would normally be created through Supabase Auth)
-- For testing, we'll create some sample UUIDs
DO $$
DECLARE
    ngx_admin_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    ngx_manager_id UUID := 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    ngx_user_id UUID := 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
BEGIN
    -- Insert sample user profiles
    INSERT INTO public.user_profiles (id, full_name, role, department, phone) VALUES
        (ngx_admin_id, 'NGX Admin', 'admin', 'Technology', '+1-555-0100'),
        (ngx_manager_id, 'NGX Manager', 'manager', 'Business Development', '+1-555-0101'),
        (ngx_user_id, 'NGX User', 'user', 'Sales', '+1-555-0102')
    ON CONFLICT (id) DO NOTHING;

    -- Insert sample contacts
    INSERT INTO public.contacts (name, email, phone, company, position, program_type, source, status, tags, created_by) VALUES
        ('John Smith', 'john.smith@techcorp.com', '+1-555-1001', 'TechCorp Inc', 'CTO', 'PRIME', 'Website', 'active', ARRAY['enterprise', 'tech'], ngx_user_id),
        ('Sarah Johnson', 'sarah.j@innovate.io', '+1-555-1002', 'Innovate Solutions', 'CEO', 'LONGEVITY', 'Referral', 'active', ARRAY['startup', 'ai'], ngx_user_id),
        ('Mike Chen', 'mike.chen@healthplus.com', '+1-555-1003', 'HealthPlus Corp', 'Head of Digital', 'CUSTOM', 'Conference', 'active', ARRAY['healthcare', 'digital'], ngx_user_id),
        ('Emily Rodriguez', 'emily.r@financetech.co', '+1-555-1004', 'FinanceTech Solutions', 'VP Technology', 'PRIME', 'LinkedIn', 'active', ARRAY['fintech', 'enterprise'], ngx_manager_id),
        ('David Thompson', 'david.t@retailmax.com', '+1-555-1005', 'RetailMax Group', 'IT Director', 'LONGEVITY', 'Cold Outreach', 'inactive', ARRAY['retail', 'legacy'], ngx_user_id)
    ON CONFLICT (email) DO NOTHING;

    -- Insert sample leads
    INSERT INTO public.leads (name, email, phone, company, source, program, status, score, assigned_to, notes, created_by) VALUES
        ('Alex Martinez', 'alex.m@startupx.com', '+1-555-2001', 'StartupX', 'Website', 'PRIME', 'new', 75, ngx_user_id, 'High potential lead from enterprise segment', ngx_user_id),
        ('Lisa Wang', 'lisa.wang@techventures.co', '+1-555-2002', 'Tech Ventures', 'Referral', 'LONGEVITY', 'contacted', 85, ngx_user_id, 'Very interested in AI solutions', ngx_user_id),
        ('Robert Brown', 'rob.brown@manufacturing.inc', '+1-555-2003', 'Manufacturing Inc', 'Trade Show', 'CUSTOM', 'qualified', 60, ngx_manager_id, 'Looking for automation solutions', ngx_manager_id),
        ('Jennifer Lee', 'jen.lee@healthsystems.org', '+1-555-2004', 'Health Systems LLC', 'LinkedIn', 'PRIME', 'new', 40, ngx_user_id, 'Early stage interest', ngx_user_id),
        ('Carlos Gonzalez', 'carlos.g@globalcorp.com', '+1-555-2005', 'Global Corp', 'Cold Email', 'LONGEVITY', 'contacted', 70, ngx_manager_id, 'Decision maker confirmed', ngx_manager_id)
    ON CONFLICT (email) DO NOTHING;

    -- Insert sample deals (linked to some contacts)
    INSERT INTO public.deals (name, value_amount, deal_stage_id, contact_id, probability, expected_close_date, assigned_to, created_by) VALUES
        ('TechCorp PRIME Implementation', 125000.00, (SELECT id FROM public.deal_stages WHERE name = 'Proposal Sent'), (SELECT id FROM public.contacts WHERE email = 'john.smith@techcorp.com'), 50, CURRENT_DATE + INTERVAL '30 days', ngx_user_id, ngx_user_id),
        ('Innovate Solutions AI Package', 75000.00, (SELECT id FROM public.deal_stages WHERE name = 'Negotiation'), (SELECT id FROM public.contacts WHERE email = 'sarah.j@innovate.io'), 75, CURRENT_DATE + INTERVAL '15 days', ngx_user_id, ngx_user_id),
        ('HealthPlus Custom Integration', 200000.00, (SELECT id FROM public.deal_stages WHERE name = 'Needs Analysis'), (SELECT id FROM public.contacts WHERE email = 'mike.chen@healthplus.com'), 25, CURRENT_DATE + INTERVAL '60 days', ngx_user_id, ngx_user_id),
        ('FinanceTech Enterprise Solution', 300000.00, (SELECT id FROM public.deal_stages WHERE name = 'Lead Qualification'), (SELECT id FROM public.contacts WHERE email = 'emily.r@financetech.co'), 10, CURRENT_DATE + INTERVAL '90 days', ngx_manager_id, ngx_manager_id),
        ('NGX Training Program', 50000.00, (SELECT id FROM public.deal_stages WHERE name = 'Closed Won'), NULL, 100, CURRENT_DATE - INTERVAL '5 days', ngx_manager_id, ngx_manager_id)
    ON CONFLICT DO NOTHING;

    -- Insert sample tasks
    INSERT INTO public.tasks (title, description, due_date, status, priority, assigned_to_user_id, related_contact_id, created_by_user_id) VALUES
        ('Follow up with TechCorp', 'Schedule demo for PRIME solution', CURRENT_DATE + INTERVAL '2 days', 'To Do', 'High', ngx_user_id, (SELECT id FROM public.contacts WHERE email = 'john.smith@techcorp.com'), ngx_user_id),
        ('Prepare Innovate Solutions proposal', 'Create detailed proposal for AI package', CURRENT_DATE + INTERVAL '1 day', 'In Progress', 'High', ngx_user_id, (SELECT id FROM public.contacts WHERE email = 'sarah.j@innovate.io'), ngx_user_id),
        ('Research HealthPlus requirements', 'Analyze custom integration needs', CURRENT_DATE + INTERVAL '5 days', 'To Do', 'Medium', ngx_user_id, (SELECT id FROM public.contacts WHERE email = 'mike.chen@healthplus.com'), ngx_user_id),
        ('FinanceTech discovery call', 'Initial needs assessment call', CURRENT_DATE + INTERVAL '3 days', 'To Do', 'Medium', ngx_manager_id, (SELECT id FROM public.contacts WHERE email = 'emily.r@financetech.co'), ngx_manager_id),
        ('Update CRM documentation', 'Document new features and processes', CURRENT_DATE + INTERVAL '7 days', 'To Do', 'Low', ngx_admin_id, NULL, ngx_admin_id)
    ON CONFLICT DO NOTHING;

    -- Insert sample interactions
    INSERT INTO public.interactions (type, channel, subject, summary, direction, contact_id, created_by) VALUES
        ('email', 'email', 'PRIME Solution Inquiry', 'Initial inquiry about PRIME implementation timeline and pricing', 'inbound', (SELECT id FROM public.contacts WHERE email = 'john.smith@techcorp.com'), ngx_user_id),
        ('call', 'phone', 'Discovery Call - AI Solutions', 'Discussed AI implementation strategy and budget approval process', 'outbound', (SELECT id FROM public.contacts WHERE email = 'sarah.j@innovate.io'), ngx_user_id),
        ('meeting', 'zoom', 'Custom Integration Planning', 'Technical requirements gathering for custom HealthPlus integration', 'outbound', (SELECT id FROM public.contacts WHERE email = 'mike.chen@healthplus.com'), ngx_user_id),
        ('email', 'email', 'Enterprise Solution Follow-up', 'Sent detailed enterprise package information and case studies', 'outbound', (SELECT id FROM public.contacts WHERE email = 'emily.r@financetech.co'), ngx_manager_id),
        ('note', 'internal', 'RetailMax Account Review', 'Account marked inactive due to lack of engagement over 6 months', 'internal', (SELECT id FROM public.contacts WHERE email = 'david.t@retailmax.com'), ngx_user_id)
    ON CONFLICT DO NOTHING;

    -- Insert sample notes
    INSERT INTO public.notes (content, contact_id, created_by) VALUES
        ('TechCorp has budget approved for Q1 implementation. Priority project for their digital transformation.', (SELECT id FROM public.contacts WHERE email = 'john.smith@techcorp.com'), ngx_user_id),
        ('Innovate Solutions CEO very impressed with AI demo. Ready to move forward quickly.', (SELECT id FROM public.contacts WHERE email = 'sarah.j@innovate.io'), ngx_user_id),
        ('HealthPlus needs extensive customization for HIPAA compliance. May require 6-month timeline.', (SELECT id FROM public.contacts WHERE email = 'mike.chen@healthplus.com'), ngx_user_id),
        ('FinanceTech requires board approval for enterprise deals over $250K. Next board meeting in 3 weeks.', (SELECT id FROM public.contacts WHERE email = 'emily.r@financetech.co'), ngx_manager_id)
    ON CONFLICT DO NOTHING;

END $$;