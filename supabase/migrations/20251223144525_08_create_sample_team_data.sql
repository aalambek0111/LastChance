/*
  # Create Sample Team Members and Leads for New Organizations

  This trigger automatically creates sample team members, leads,
  bookings, and conversations when a new organization is created.
  This allows end-to-end testing without manual data entry.
*/

CREATE OR REPLACE FUNCTION public.seed_organization_demo_data()
RETURNS TRIGGER AS $$
DECLARE
  tour_ids uuid[];
  team_member_ids uuid[];
  lead_id uuid;
  booking_id uuid;
  conversation_id uuid;
  msg_id uuid;
  i integer;
BEGIN
  -- Get all tour IDs for this organization (should have been seeded by seed_demo_tours)
  SELECT ARRAY_AGG(id) INTO tour_ids
  FROM tours
  WHERE organization_id = NEW.id
  LIMIT 4;

  -- If no tours exist yet, create them
  IF tour_ids IS NULL OR array_length(tour_ids, 1) IS NULL THEN
    INSERT INTO tours (organization_id, tour_no, name, description, price, duration, max_people, difficulty, location, image_url, active, bookings_count, revenue)
    VALUES
      (NEW.id, 'TR-000001', 'Sunset City Bike Tour', 'Experience the city at golden hour on our premium electric bikes. Perfect for photography enthusiasts and couples.', 85, '3h', 8, 'Easy', 'Downtown Marina', 'https://images.unsplash.com/photo-1620302066845-314b98c92872?auto=format&fit=crop&q=80&w=200', true, 142, 12070),
      (NEW.id, 'TR-000002', 'Historical Walk', 'A guided walk through the old town visiting key historical landmarks. Learn about the rich history and culture of the city.', 45, '2h', 15, 'Easy', 'Old Town Square', 'https://images.unsplash.com/photo-1590274780650-664448557c9a?auto=format&fit=crop&q=80&w=200', true, 89, 4005),
      (NEW.id, 'TR-000003', 'Food & Wine Tasting', 'Sample the finest local delicacies and wines in this gastronomic adventure. Includes visits to 3 award-winning restaurants.', 120, '4h', 6, 'Easy', 'Vineyard District', 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=200', true, 56, 6720),
      (NEW.id, 'TR-000004', 'Mountain Hike Level 2', 'Challenging hike with breathtaking views for experienced hikers. Proper hiking gear is required.', 95, '6h', 10, 'Hard', 'National Park', 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&q=80&w=200', false, 32, 3040);

    SELECT ARRAY_AGG(id) INTO tour_ids
    FROM tours
    WHERE organization_id = NEW.id
    LIMIT 4;
  END IF;

  -- Create pricing tiers for tours
  INSERT INTO pricing_tiers (tour_id, name, price)
  SELECT tour_ids[1], 'Adult', 85 UNION ALL
  SELECT tour_ids[1], 'Child (under 12)', 45 UNION ALL
  SELECT tour_ids[1], 'Senior', 70 UNION ALL
  SELECT tour_ids[2], 'General Admission', 45 UNION ALL
  SELECT tour_ids[2], 'Student', 30 UNION ALL
  SELECT tour_ids[3], 'Adult (Alcohol included)', 120 UNION ALL
  SELECT tour_ids[3], 'Non-Alcoholic', 90 UNION ALL
  SELECT tour_ids[4], 'Hiker', 95
  ON CONFLICT DO NOTHING;

  -- Create tour tags
  INSERT INTO tour_tags (tour_id, tag)
  SELECT tour_ids[1], tag FROM UNNEST(ARRAY['Bike', 'City', 'Sunset', 'Photography']) AS tag
  UNION ALL
  SELECT tour_ids[2], tag FROM UNNEST(ARRAY['History', 'Walking', 'Culture']) AS tag
  UNION ALL
  SELECT tour_ids[3], tag FROM UNNEST(ARRAY['Food', 'Wine', 'Luxury']) AS tag
  UNION ALL
  SELECT tour_ids[4], tag FROM UNNEST(ARRAY['Hiking', 'Nature', 'Adventure']) AS tag
  ON CONFLICT DO NOTHING;

  -- Create sample team members
  INSERT INTO team_members (organization_id, name, email, role)
  VALUES
    (NEW.id, 'Alex Walker', 'alex@company.com', 'team_member'),
    (NEW.id, 'Sarah Miller', 'sarah@company.com', 'team_member'),
    (NEW.id, 'Mike Johnson', 'mike@company.com', 'team_member'),
    (NEW.id, 'Emily Davis', 'emily@company.com', 'team_member')
  RETURNING id INTO team_member_ids[1];

  -- Get all team member IDs
  SELECT ARRAY_AGG(id) INTO team_member_ids
  FROM team_members
  WHERE organization_id = NEW.id;

  -- Create sample leads
  INSERT INTO leads (organization_id, lead_no, name, email, phone, channel, status, assigned_to, last_message_time)
  VALUES
    (NEW.id, 'LD-001024', 'Sarah Jenkins', 'sarah.jenkins@email.com', '+1-555-0101', 'Website', 'New', team_member_ids[1], now() - interval '10 minutes'),
    (NEW.id, 'LD-001023', 'Marco Rossi', 'marco.rossi@email.com', '+1-555-0102', 'WhatsApp', 'Contacted', team_member_ids[2], now() - interval '45 minutes'),
    (NEW.id, 'LD-001022', 'Emily Chen', 'emily.chen@email.com', '+1-555-0103', 'Email', 'New', team_member_ids[1], now() - interval '2 hours'),
    (NEW.id, 'LD-001021', 'David Smith', 'david.smith@email.com', '+1-555-0104', 'Referral', 'Qualified', team_member_ids[4], now() - interval '5 hours'),
    (NEW.id, 'LD-001020', 'Anita Patel', 'anita.patel@email.com', '+1-555-0105', 'Website', 'Contacted', NULL, now() - interval '1 day');

  -- Create sample bookings
  INSERT INTO bookings (organization_id, booking_no, tour_id, lead_id, client_name, email, phone, people, booking_date, start_time, end_time, status, payment_status, assigned_to, total_amount, amount_paid, amount_due, is_amount_overridden, created_by)
  SELECT
    NEW.id,
    booking_data.booking_no,
    tour_ids[booking_data.tour_idx],
    (SELECT id FROM leads WHERE organization_id = NEW.id AND email = booking_data.lead_email LIMIT 1),
    booking_data.client_name,
    booking_data.email,
    booking_data.phone,
    booking_data.people,
    booking_data.booking_date,
    booking_data.start_time,
    booking_data.end_time,
    booking_data.status,
    booking_data.payment_status,
    team_member_ids[booking_data.tm_idx],
    booking_data.total_amount,
    booking_data.amount_paid,
    booking_data.amount_due,
    booking_data.is_amount_overridden,
    (SELECT user_id FROM organization_members WHERE organization_id = NEW.id AND role = 'owner' LIMIT 1)
  FROM (VALUES
    ('BR-005120', 1, 'john@email.com', 'John Doe', 'john@email.com', '+1-555-0201', 2, '2024-12-24'::date, '09:00'::time, '12:00'::time, 'Confirmed', 'Paid', 1, 170::numeric, 170::numeric, 0::numeric, false, 'sarah.jenkins@email.com'),
    ('BR-005121', 2, 'alice@email.com', 'Alice Cooper', 'alice@email.com', '+1-555-0202', 4, '2024-12-25'::date, '14:00'::time, '16:00'::time, 'Pending', 'Waiting', 2, 180::numeric, 0::numeric, 180::numeric, false, 'marco.rossi@email.com'),
    ('BR-005122', 3, NULL, 'Robert Langdon', 'robert@email.com', '+1-555-0203', 1, '2024-12-25'::date, '18:00'::time, '22:00'::time, 'Confirmed', 'Paid', 1, 120::numeric, 120::numeric, 0::numeric, false, NULL),
    ('BR-005123', 4, 'david.smith@email.com', 'Team Alpha', 'team@alpha.com', '+1-555-0204', 8, '2024-12-26'::date, '08:00'::time, '14:00'::time, 'Confirmed', 'Unpaid', 3, 760::numeric, 0::numeric, 760::numeric, false, 'david.smith@email.com'),
    ('BR-005124', 1, NULL, 'The Kardashians', 'contact@kardashians.com', '+1-555-0205', 6, '2024-12-27'::date, '10:00'::time, '16:00'::time, 'Cancelled', 'Unpaid', 1, 1500::numeric, 0::numeric, 1500::numeric, true, NULL)
  ) AS booking_data(booking_no, tour_idx, lead_email, client_name, email, phone, people, booking_date, start_time, end_time, status, payment_status, tm_idx, total_amount, amount_paid, amount_due, is_amount_overridden, temp_lead_email)
  ON CONFLICT (organization_id, booking_no) DO NOTHING;

  -- Create sample conversations and messages
  INSERT INTO conversations (organization_id, lead_id, channel, status, assigned_to, last_message_at)
  SELECT NEW.id, id, channel, 'open', (SELECT team_member_ids[1]), now() - interval '10 minutes'
  FROM leads
  WHERE organization_id = NEW.id
  ON CONFLICT (organization_id, lead_id) DO NOTHING;

  -- Add sample messages to conversations
  INSERT INTO messages (conversation_id, sender_id, sender_name, sender_type, content, channel)
  SELECT 
    c.id,
    'client_' || l.id,
    l.name,
    'client',
    'Hi there, I''m interested in your tours. Can you tell me more?',
    l.channel
  FROM conversations c
  JOIN leads l ON c.lead_id = l.id
  WHERE c.organization_id = NEW.id
  AND NOT EXISTS (SELECT 1 FROM messages m WHERE m.conversation_id = c.id);

  -- Create email templates
  INSERT INTO email_templates (organization_id, name, subject, body, tags)
  VALUES
    (NEW.id, 'Booking Confirmation', 'Your booking is confirmed', 'Dear {{customer_name}},\n\nYour booking for {{tour_name}} on {{booking_date}} is confirmed.\n\nBooking Details:\nBooking No: {{booking_no}}\nTour: {{tour_name}}\nDate: {{booking_date}}\nTime: {{start_time}} - {{end_time}}\nParticipants: {{people}}\n\nThank you!', ARRAY['customer_name', 'tour_name', 'booking_date', 'booking_no', 'start_time', 'end_time', 'people']),
    (NEW.id, 'Welcome Email', 'Welcome to our tours!', 'Welcome {{customer_name}}!\n\nWe''re excited to have you explore our amazing tours.\n\nFeel free to reach out if you have any questions.', ARRAY['customer_name']),
    (NEW.id, 'Payment Reminder', 'Payment reminder for your booking', 'Hi {{customer_name}},\n\nThis is a friendly reminder that payment of ${{amount}} is due for your {{tour_name}} booking.\n\nPlease complete your payment to secure your spot.\n\nThank you!', ARRAY['customer_name', 'amount', 'tour_name'])
  ON CONFLICT (organization_id, name) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to seed demo data when organization is created
DROP TRIGGER IF EXISTS seed_org_demo_data ON organizations;
CREATE TRIGGER seed_org_demo_data
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_organization_demo_data();
