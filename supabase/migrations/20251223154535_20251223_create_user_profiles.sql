/*
  # Create User Profiles Table

  1. New Tables
    - `profiles` - Store user profile information (name, email, avatar, etc.)

  2. Changes
    - Create profiles table with user information
    - Add user profile record when user signs up
    - Update organization creation trigger to use user data

  3. Security
    - Enable RLS on profiles table
    - Users can only view and update their own profile

  4. Important Notes
    - Profiles store the user's name and email for display throughout the app
    - Organization is created with the workspace name entered during signup
    - User's profile name comes from email name part or defaults to workspace name
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  org_id uuid;
  user_name text;
  workspace_name text;
BEGIN
  -- Extract user name from metadata or email
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    SPLIT_PART(NEW.email, '@', 1)
  );
  
  workspace_name := COALESCE(NEW.raw_user_meta_data->>'name', 'My Workspace');

  -- Create user profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, user_name)
  ON CONFLICT (id) DO UPDATE SET
    email = NEW.email,
    full_name = user_name;

  -- Create a default organization for the user using workspace name
  INSERT INTO public.organizations (name, slug, created_by)
  VALUES (
    workspace_name,
    'org-' || gen_random_uuid()::text,
    NEW.id
  )
  RETURNING id INTO org_id;

  -- Make the user an owner of their organization
  INSERT INTO public.organization_members (organization_id, user_id, role, status)
  VALUES (org_id, NEW.id, 'owner', 'active');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
