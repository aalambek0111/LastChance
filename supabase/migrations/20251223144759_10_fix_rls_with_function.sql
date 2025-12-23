/*
  # Fix RLS with Security Definer Function

  Create a helper function that bypasses RLS to check organization membership,
  then use it in policies to avoid infinite recursion.
*/

-- Create a security definer function to check if user is in an organization
CREATE OR REPLACE FUNCTION public.user_is_in_organization(org_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop all existing organization_members policies
DROP POLICY IF EXISTS "Users can view organization memberships" ON organization_members;
DROP POLICY IF EXISTS "System can create organization memberships" ON organization_members;
DROP POLICY IF EXISTS "Users can update organization memberships" ON organization_members;

-- Simple policy: users can see memberships in their own organizations
CREATE POLICY "View organization memberships"
  ON organization_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    public.user_is_in_organization(organization_id)
  );

-- Allow insertions (for signup trigger and admin operations)
CREATE POLICY "Create organization memberships"
  ON organization_members FOR INSERT
  WITH CHECK (true);

-- Update memberships
CREATE POLICY "Update organization memberships"
  ON organization_members FOR UPDATE
  TO authenticated
  USING (public.user_is_in_organization(organization_id))
  WITH CHECK (public.user_is_in_organization(organization_id));

-- Drop and recreate organizations policy
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;

CREATE POLICY "View organizations"
  ON organizations FOR SELECT
  TO authenticated
  USING (public.user_is_in_organization(id));
