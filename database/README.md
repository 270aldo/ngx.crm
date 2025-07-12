# NexusCRM Database Setup

## Overview
NexusCRM uses Supabase (PostgreSQL) as its database. This directory contains the schema documentation and migration scripts.

## Files
- `schema.sql` - Complete database schema documentation
- `migrations/` - Migration scripts to update the database

## Initial Setup

1. **Create a Supabase Project**
   - Go to [Supabase](https://supabase.com)
   - Create a new project
   - Note your project URL and keys

2. **Run the Schema**
   - Go to SQL Editor in Supabase Dashboard
   - Copy the contents of `schema.sql`
   - Run the SQL to create all tables

3. **Run Migrations**
   - Run migrations in order (001, 002, etc.)
   - Each migration is idempotent (safe to run multiple times)

## Tables Overview

### Core Tables
- `user_profiles` - Extended user information
- `contacts` - Customer/prospect records
- `leads` - Potential customers
- `deals` - Sales opportunities
- `deal_stages` - Pipeline stages
- `tasks` - Todo items and activities
- `interactions` - Communication history
- `notes` - Free-form notes

### Supporting Tables
- `email_templates` - Reusable email templates
- `audit_logs` - Change tracking

## Security

### Row Level Security (RLS)
All tables have RLS enabled. Current policies:
- Users can view all data
- Users can only edit their own records
- Admins and managers can edit all records

### Roles
- `admin` - Full access
- `manager` - Team access
- `user` - Own records only

## Indexes
Key indexes are created for:
- Email lookups
- Date filtering
- Foreign key relationships
- Status filtering

## Triggers
- `update_updated_at_column` - Auto-updates timestamps
- `handle_new_user` - Creates user profile on signup

## Best Practices

1. **Always use UUIDs** for primary keys
2. **Include audit fields** (created_at, updated_at, created_by)
3. **Use JSONB** for flexible custom fields
4. **Add indexes** for frequently queried columns
5. **Enable RLS** on all tables

## Backup Strategy
1. Enable Point-in-Time Recovery in Supabase
2. Schedule regular backups
3. Test restore procedures monthly

## Migration Guidelines
1. Number migrations sequentially (001, 002, etc.)
2. Make migrations idempotent
3. Include rollback instructions
4. Test in staging first
5. Document breaking changes