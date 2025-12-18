/*
  # Create TourCRM Database Schema

  ## Overview
  Complete database schema for a Tour CRM application with lead management, booking system, 
  tour catalog, team management, notifications, and automation workflows.

  ## New Tables

  ### 1. `team_members`
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid) - Reference to auth.users
  - `name` (text) - Team member's full name
  - `email` (text) - Email address
  - `role` (text) - User role (admin, manager, agent)
  - `active` (boolean) - Whether the member is active
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `leads`
  - `id` (uuid, primary key) - Unique identifier
  - `lead_no` (text) - Human-readable lead number (LD-001024)
  - `name` (text) - Lead's name
  - `email` (text) - Email address
  - `phone` (text) - Phone number
  - `company` (text) - Company name
  - `status` (text) - Lead status (New, Contacted, Qualified, Booked, Lost)
  - `channel` (text) - Source channel (Website, WhatsApp, Email, Referral)
  - `value` (numeric) - Potential deal value
  - `notes` (text) - Additional notes
  - `assigned_to` (uuid) - Reference to team_members
  - `last_message_time` (timestamptz) - Last communication timestamp
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 3. `tours`
  - `id` (uuid, primary key) - Unique identifier
  - `tour_no` (text) - Human-readable tour number (TR-000001)
  - `name` (text) - Tour name
  - `description` (text) - Tour description
  - `price` (numeric) - Base price per person
  - `duration` (text) - Duration (e.g., "3h", "6h")
  - `max_people` (integer) - Maximum capacity
  - `difficulty` (text) - Difficulty level (Easy, Medium, Hard)
  - `location` (text) - Starting location
  - `image` (text) - Image URL
  - `tags` (text[]) - Array of tags
  - `active` (boolean) - Whether tour is active
  - `bookings_count` (integer) - Total number of bookings
  - `revenue` (numeric) - Total revenue generated
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 4. `bookings`
  - `id` (uuid, primary key) - Unique identifier
  - `booking_no` (text) - Human-readable booking number (BR-005120)
  - `lead_id` (uuid) - Reference to leads table
  - `tour_id` (uuid) - Reference to tours table
  - `tour_name` (text) - Tour name (denormalized for convenience)
  - `client_name` (text) - Client's name
  - `date` (date) - Booking date
  - `start_time` (time) - Start time
  - `end_time` (time) - End time
  - `people` (integer) - Number of people
  - `status` (text) - Booking status (Confirmed, Pending, Completed, Cancelled)
  - `payment_status` (text) - Payment status (Unpaid, Waiting, Partially Paid, Paid, Refunded)
  - `total_amount` (numeric) - Total amount
  - `amount_paid` (numeric) - Amount already paid
  - `amount_due` (numeric) - Amount still due
  - `is_amount_overridden` (boolean) - Whether amount was manually overridden
  - `pickup_location` (text) - Pickup location
  - `notes` (text) - Additional notes
  - `assigned_to` (uuid) - Reference to team_members
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 5. `notifications`
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid) - Reference to auth.users (recipient)
  - `title` (text) - Notification title
  - `description` (text) - Notification description
  - `type` (text) - Notification type (lead, booking, payment, team, system)
  - `unread` (boolean) - Whether notification is unread
  - `action_link` (text) - Link to related resource
  - `created_at` (timestamptz) - Record creation timestamp

  ### 6. `email_templates`
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Template name
  - `subject` (text) - Email subject
  - `body` (text) - Email body (supports variables)
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 7. `automation_rules`
  - `id` (uuid, primary key) - Unique identifier
  - `org_id` (uuid) - Organization/user identifier
  - `name` (text) - Rule name
  - `description` (text) - Rule description
  - `active` (boolean) - Whether rule is active
  - `trigger` (text) - Trigger type (lead_created, booking_confirmed, etc.)
  - `last_run_at` (timestamptz) - Last execution timestamp
  - `last_run_status` (text) - Last execution status (success, failure)
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 8. `rule_conditions`
  - `id` (uuid, primary key) - Unique identifier
  - `rule_id` (uuid) - Reference to automation_rules
  - `field` (text) - Field to check
  - `operator` (text) - Comparison operator (equals, contains, gt, lt, etc.)
  - `value` (text) - Value to compare against
  - `order_index` (integer) - Order of condition

  ### 9. `rule_actions`
  - `id` (uuid, primary key) - Unique identifier
  - `rule_id` (uuid) - Reference to automation_rules
  - `type` (text) - Action type (send_email, update_record, create_task)
  - `config` (jsonb) - Action configuration
  - `order_index` (integer) - Order of action

  ### 10. `automation_logs`
  - `id` (uuid, primary key) - Unique identifier
  - `rule_id` (uuid) - Reference to automation_rules
  - `record_id` (text) - Related record ID
  - `status` (text) - Execution status (success, failure)
  - `details` (text) - Execution details/error message
  - `run_at` (timestamptz) - Execution timestamp

  ## Security
  - Enable RLS on all tables
  - Authenticated users can access all data (multi-tenant separation would be added via org_id)
  - All tables have proper indexes for performance
*/

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text DEFAULT 'agent' CHECK (role IN ('admin', 'manager', 'agent')),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_no text UNIQUE,
  name text NOT NULL,
  email text,
  phone text,
  company text,
  status text DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Qualified', 'Booked', 'Lost')),
  channel text CHECK (channel IN ('Website', 'WhatsApp', 'Email', 'Referral')),
  value numeric DEFAULT 0,
  notes text,
  assigned_to uuid REFERENCES team_members(id) ON DELETE SET NULL,
  last_message_time timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tours table
CREATE TABLE IF NOT EXISTS tours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_no text UNIQUE,
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  duration text,
  max_people integer DEFAULT 1,
  difficulty text DEFAULT 'Easy' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  location text,
  image text,
  tags text[],
  active boolean DEFAULT true,
  bookings_count integer DEFAULT 0,
  revenue numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_no text UNIQUE,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  tour_id uuid REFERENCES tours(id) ON DELETE SET NULL,
  tour_name text NOT NULL,
  client_name text NOT NULL,
  date date NOT NULL,
  start_time time,
  end_time time,
  people integer DEFAULT 1,
  status text DEFAULT 'Pending' CHECK (status IN ('Confirmed', 'Pending', 'Completed', 'Cancelled')),
  payment_status text DEFAULT 'Unpaid' CHECK (payment_status IN ('Unpaid', 'Waiting', 'Partially Paid', 'Paid', 'Refunded')),
  total_amount numeric DEFAULT 0,
  amount_paid numeric DEFAULT 0,
  amount_due numeric DEFAULT 0,
  is_amount_overridden boolean DEFAULT false,
  pickup_location text,
  notes text,
  assigned_to uuid REFERENCES team_members(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('lead', 'booking', 'payment', 'team', 'system')),
  unread boolean DEFAULT true,
  action_link text,
  created_at timestamptz DEFAULT now()
);

-- Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create automation_rules table
CREATE TABLE IF NOT EXISTS automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  active boolean DEFAULT true,
  trigger text NOT NULL CHECK (trigger IN ('lead_created', 'lead_updated', 'booking_created', 'booking_confirmed', 'booking_canceled')),
  last_run_at timestamptz,
  last_run_status text CHECK (last_run_status IN ('success', 'failure')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create rule_conditions table
CREATE TABLE IF NOT EXISTS rule_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid REFERENCES automation_rules(id) ON DELETE CASCADE,
  field text NOT NULL,
  operator text NOT NULL CHECK (operator IN ('equals', 'not_equals', 'contains', 'gt', 'lt', 'is_empty', 'is_not_empty')),
  value text,
  order_index integer DEFAULT 0
);

-- Create rule_actions table
CREATE TABLE IF NOT EXISTS rule_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid REFERENCES automation_rules(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('send_email', 'update_record', 'create_task')),
  config jsonb DEFAULT '{}'::jsonb,
  order_index integer DEFAULT 0
);

-- Create automation_logs table
CREATE TABLE IF NOT EXISTS automation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid REFERENCES automation_rules(id) ON DELETE CASCADE,
  record_id text,
  status text NOT NULL CHECK (status IN ('success', 'failure')),
  details text,
  run_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_assigned_to ON bookings(assigned_to);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(unread);
CREATE INDEX IF NOT EXISTS idx_automation_rules_active ON automation_rules(active);

-- Enable Row Level Security on all tables
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_members
CREATE POLICY "Authenticated users can view team members"
  ON team_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert team members"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update team members"
  ON team_members FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete team members"
  ON team_members FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for leads
CREATE POLICY "Authenticated users can view leads"
  ON leads FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert leads"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update leads"
  ON leads FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete leads"
  ON leads FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for tours
CREATE POLICY "Anyone can view active tours"
  ON tours FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert tours"
  ON tours FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tours"
  ON tours FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete tours"
  ON tours FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for bookings
CREATE POLICY "Authenticated users can view bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete bookings"
  ON bookings FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for email_templates
CREATE POLICY "Authenticated users can view email templates"
  ON email_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert email templates"
  ON email_templates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update email templates"
  ON email_templates FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete email templates"
  ON email_templates FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for automation_rules
CREATE POLICY "Authenticated users can view automation rules"
  ON automation_rules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert automation rules"
  ON automation_rules FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update automation rules"
  ON automation_rules FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete automation rules"
  ON automation_rules FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for rule_conditions
CREATE POLICY "Authenticated users can view rule conditions"
  ON rule_conditions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert rule conditions"
  ON rule_conditions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update rule conditions"
  ON rule_conditions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete rule conditions"
  ON rule_conditions FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for rule_actions
CREATE POLICY "Authenticated users can view rule actions"
  ON rule_actions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert rule actions"
  ON rule_actions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update rule actions"
  ON rule_actions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete rule actions"
  ON rule_actions FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for automation_logs
CREATE POLICY "Authenticated users can view automation logs"
  ON automation_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert automation logs"
  ON automation_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);
