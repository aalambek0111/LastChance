/*
  # Create Tours and Pricing Tiers

  1. New Tables
    - `tours` - Tour offerings
    - `pricing_tiers` - Flexible pricing for different customer segments

  2. Security
    - Enable RLS on both tables
    - Organization members can view tours
    - Only admins can manage tours

  3. Important Notes
    - Tours are organization-specific
    - Pricing tiers are linked to tours
    - Supports multi-tier pricing strategies
*/

CREATE TABLE IF NOT EXISTS tours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tour_no text,
  name text NOT NULL,
  description text,
  price numeric(10, 2) DEFAULT 0,
  duration text,
  max_people integer DEFAULT 1,
  difficulty text DEFAULT 'Easy',
  location text,
  image_url text,
  active boolean DEFAULT true,
  bookings_count integer DEFAULT 0,
  revenue numeric(15, 2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, tour_no)
);

CREATE TABLE IF NOT EXISTS pricing_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id uuid NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric(10, 2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tour_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id uuid NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  tag text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tour_id, tag)
);

-- Enable RLS
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_tags ENABLE ROW LEVEL SECURITY;

-- Policies for tours
CREATE POLICY "Organization members can view tours"
  ON tours FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = tours.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can create tours"
  ON tours FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = tours.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Organization admins can update tours"
  ON tours FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = tours.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = tours.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- Policies for pricing tiers
CREATE POLICY "Organization members can view pricing tiers"
  ON pricing_tiers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tours, organization_members
      WHERE pricing_tiers.tour_id = tours.id
      AND organization_members.organization_id = tours.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can manage pricing tiers"
  ON pricing_tiers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tours, organization_members
      WHERE pricing_tiers.tour_id = tours.id
      AND organization_members.organization_id = tours.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Organization admins can update pricing tiers"
  ON pricing_tiers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tours, organization_members
      WHERE pricing_tiers.tour_id = tours.id
      AND organization_members.organization_id = tours.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tours, organization_members
      WHERE pricing_tiers.tour_id = tours.id
      AND organization_members.organization_id = tours.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- Policies for tour tags
CREATE POLICY "Organization members can view tour tags"
  ON tour_tags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tours, organization_members
      WHERE tour_tags.tour_id = tours.id
      AND organization_members.organization_id = tours.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can manage tour tags"
  ON tour_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tours, organization_members
      WHERE tour_tags.tour_id = tours.id
      AND organization_members.organization_id = tours.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );
