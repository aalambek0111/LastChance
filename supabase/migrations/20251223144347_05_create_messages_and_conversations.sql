/*
  # Create Messages and Conversations

  1. New Tables
    - `conversations` - Grouping of related messages (one per lead)
    - `messages` - Individual messages in conversations
    - `conversation_participants` - Track who is in each conversation

  2. Security
    - Enable RLS on all tables
    - Organization members can view conversations for their organization
    - Only message sender and organization members can view/send messages

  3. Important Notes
    - Conversations are linked to leads
    - Supports multi-channel messaging (WhatsApp, Email, Website, etc.)
*/

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  channel text DEFAULT 'Website' CHECK (channel IN ('Website', 'WhatsApp', 'Email', 'Referral')),
  subject text,
  status text DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'archived')),
  assigned_to uuid REFERENCES team_members(id) ON DELETE SET NULL,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, lead_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id text NOT NULL,
  sender_name text,
  sender_type text DEFAULT 'client' CHECK (sender_type IN ('client', 'team')),
  content text NOT NULL,
  channel text DEFAULT 'Website',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  team_member_id uuid NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(conversation_id, team_member_id)
);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

-- Policies for conversations
CREATE POLICY "Organization members can view conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = conversations.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = conversations.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can update conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = conversations.organization_id
      AND organization_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = conversations.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Policies for messages
CREATE POLICY "Organization members can view messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations, organization_members
      WHERE messages.conversation_id = conversations.id
      AND organization_members.organization_id = conversations.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can create messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations, organization_members
      WHERE messages.conversation_id = conversations.id
      AND organization_members.organization_id = conversations.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can update messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations, organization_members
      WHERE messages.conversation_id = conversations.id
      AND organization_members.organization_id = conversations.organization_id
      AND organization_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations, organization_members
      WHERE messages.conversation_id = conversations.id
      AND organization_members.organization_id = conversations.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Policies for conversation participants
CREATE POLICY "Organization members can view participants"
  ON conversation_participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations, organization_members
      WHERE conversation_participants.conversation_id = conversations.id
      AND organization_members.organization_id = conversations.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can manage participants"
  ON conversation_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations, organization_members
      WHERE conversation_participants.conversation_id = conversations.id
      AND organization_members.organization_id = conversations.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );
