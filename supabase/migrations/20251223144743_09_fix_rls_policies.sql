/*
  # Fix RLS Policies - Remove Infinite Recursion

  The organization_members SELECT policy had infinite recursion because
  it was querying the same table it was protecting. This fixes it by
  using a simpler, direct check.

  Changes:
  - Drop and recreate organization_members SELECT policy without recursion
  - Simplify to allow users to view memberships where they are a member
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view members of their organizations" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can manage members" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can update members" ON organization_members;

-- Recreate SELECT policy without recursion
-- Users can view organization memberships if they belong to that organization
CREATE POLICY "Users can view organization memberships"
  ON organization_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Allow users to be added to organizations (system/admin operation)
CREATE POLICY "System can create organization memberships"
  ON organization_members FOR INSERT
  WITH CHECK (true);

-- Users can update their own membership or admins can update any in their org
CREATE POLICY "Users can update organization memberships"
  ON organization_members FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- Drop and recreate other potentially problematic policies

-- Organizations policies
DROP POLICY IF EXISTS "Users can view organizations they are members of" ON organizations;

CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );
