/*
  # Create Leads and Bookings

  1. New Tables
    - `leads` - Customer leads/prospects
    - `bookings` - Confirmed tour bookings
    - `booking_tiers` - Per-booking tier selection for flexible pricing

  2. Security
    - Enable RLS on all tables
    - Organization members can view leads and bookings
    - Organization members can create/update their own records

  3. Important Notes
    - Leads can be converted to bookings
    - Each booking can have multiple tier selections (e.g., 2 adults + 1 child)
    - Payment status tracks partial payments
*/

CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_no text,
  name text NOT NULL,
  email text,
  phone text,
  channel text DEFAULT 'Website' CHECK (channel IN ('Website', 'WhatsApp', 'Email', 'Referral')),
  status text DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Qualified', 'Booked', 'Lost')),
  assigned_to uuid REFERENCES team_members(id) ON DELETE SET NULL,
  value numeric(10, 2),
  notes text,
  last_message_time timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, lead_no)
);

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  booking_no text,
  tour_id uuid NOT NULL REFERENCES tours(id) ON DELETE RESTRICT,
  client_name text NOT NULL,
  email text,
  phone text,
  people integer DEFAULT 1,
  booking_date date NOT NULL,
  start_time time,
  end_time time,
  status text DEFAULT 'Pending' CHECK (status IN ('Confirmed', 'Pending', 'Completed', 'Cancelled')),
  payment_status text DEFAULT 'Unpaid' CHECK (payment_status IN ('Unpaid', 'Waiting', 'Partially Paid', 'Paid', 'Refunded')),
  assigned_to uuid REFERENCES team_members(id) ON DELETE SET NULL,
  total_amount numeric(15, 2),
  amount_paid numeric(15, 2) DEFAULT 0,
  amount_due numeric(15, 2),
  is_amount_overridden boolean DEFAULT false,
  pickup_location text,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, booking_no)
);

CREATE TABLE IF NOT EXISTS booking_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  tier_name text NOT NULL,
  quantity integer DEFAULT 1,
  price_per_unit numeric(10, 2),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_tiers ENABLE ROW LEVEL SECURITY;

-- Policies for leads
CREATE POLICY "Organization members can view leads"
  ON leads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = leads.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can create leads"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = leads.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can update leads"
  ON leads FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = leads.organization_id
      AND organization_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = leads.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can delete leads"
  ON leads FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = leads.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- Policies for bookings
CREATE POLICY "Organization members can view bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = bookings.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = bookings.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can update bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = bookings.organization_id
      AND organization_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = bookings.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can delete bookings"
  ON bookings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = bookings.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- Policies for booking tiers
CREATE POLICY "Organization members can view booking tiers"
  ON booking_tiers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings, organization_members
      WHERE booking_tiers.booking_id = bookings.id
      AND organization_members.organization_id = bookings.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can manage booking tiers"
  ON booking_tiers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings, organization_members
      WHERE booking_tiers.booking_id = bookings.id
      AND organization_members.organization_id = bookings.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can update booking tiers"
  ON booking_tiers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings, organization_members
      WHERE booking_tiers.booking_id = bookings.id
      AND organization_members.organization_id = bookings.organization_id
      AND organization_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings, organization_members
      WHERE booking_tiers.booking_id = bookings.id
      AND organization_members.organization_id = bookings.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );
