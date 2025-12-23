/*
  # Create Organization Settings Table

  1. New Tables
    - `organization_settings` - Store organization-specific settings and preferences

  2. Columns
    - organization_id: Link to organizations table
    - billing_email: Email for billing notifications
    - contact_email: Primary contact email
    - timezone: Organization timezone (from signup)
    - currency: Organization currency (from signup)
    - primary_color: Brand color
    - font_family: Font preference
    - language: Interface language
    - logo_url: Logo file path
    - favicon_url: Favicon file path
    - And other integration/notification settings

  3. Security
    - Enable RLS
    - Only organization members can view/update their organization's settings

  4. Important Notes
    - Settings are created automatically when user signs up
    - Pre-populated with data from signup page (email, timezone, currency)
    - This replaces localStorage persistence with permanent database storage
*/

CREATE TABLE IF NOT EXISTS organization_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  billing_email text NOT NULL,
  contact_email text NOT NULL,
  timezone text DEFAULT 'UTC+00:00 (London, Dublin, Lisbon)',
  currency text DEFAULT 'USD ($)',
  primary_color text DEFAULT '#4F46E5',
  font_family text DEFAULT 'Inter (Default)',
  language text DEFAULT 'en',
  logo_url text,
  favicon_url text,
  email_leads_enabled boolean DEFAULT true,
  email_bookings_enabled boolean DEFAULT true,
  telegram_enabled boolean DEFAULT false,
  telegram_bot_token text DEFAULT '',
  whatsapp_enabled boolean DEFAULT false,
  whatsapp_token text DEFAULT '',
  whatsapp_phone_id text DEFAULT '',
  whatsapp_business_id text DEFAULT '',
  instagram_enabled boolean DEFAULT false,
  instagram_token text DEFAULT '',
  instagram_page_id text DEFAULT '',
  email_integration_enabled boolean DEFAULT false,
  email_smtp_host text DEFAULT 'smtp.gmail.com',
  email_smtp_port text DEFAULT '587',
  email_smtp_user text DEFAULT '',
  email_smtp_pass text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members can view settings"
  ON organization_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_settings.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can update settings"
  ON organization_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_settings.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_settings.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  org_id uuid;
  user_name text;
  workspace_name text;
  user_email text;
  user_timezone text;
  user_currency text;
BEGIN
  user_email := NEW.email;
  
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    SPLIT_PART(NEW.email, '@', 1)
  );
  
  workspace_name := COALESCE(NEW.raw_user_meta_data->>'name', 'My Workspace');
  user_timezone := COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC+00:00 (London, Dublin, Lisbon)');
  user_currency := COALESCE(NEW.raw_user_meta_data->>'currency', 'USD ($)');

  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, user_name)
  ON CONFLICT (id) DO UPDATE SET
    email = NEW.email,
    full_name = user_name;

  INSERT INTO public.organizations (name, slug, created_by)
  VALUES (
    workspace_name,
    'org-' || gen_random_uuid()::text,
    NEW.id
  )
  RETURNING id INTO org_id;

  INSERT INTO public.organization_members (organization_id, user_id, role, status)
  VALUES (org_id, NEW.id, 'owner', 'active');

  INSERT INTO public.organization_settings (
    organization_id,
    billing_email,
    contact_email,
    timezone,
    currency
  ) VALUES (
    org_id,
    user_email,
    user_email,
    user_timezone,
    user_currency
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
