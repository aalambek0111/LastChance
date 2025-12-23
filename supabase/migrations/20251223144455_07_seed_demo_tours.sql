/*
  # Seed Demo Tours and Templates

  This migration adds sample tours and email templates that can be
  used by any organization. Data is inserted dynamically based on
  organizations that exist in the database.

  Tour data will be available for all organizations to see (public tours).
*/

-- Create a function to seed tours for all organizations
CREATE OR REPLACE FUNCTION public.seed_demo_tours()
RETURNS void AS $$
DECLARE
  org record;
BEGIN
  -- For each organization, add sample tours if they don't exist
  FOR org IN SELECT DISTINCT organization_id FROM organization_members LOOP
    INSERT INTO tours (organization_id, tour_no, name, description, price, duration, max_people, difficulty, location, image_url, active, bookings_count, revenue)
    SELECT
      org.organization_id,
      tour_data.tour_no,
      tour_data.name,
      tour_data.description,
      tour_data.price,
      tour_data.duration,
      tour_data.max_people,
      tour_data.difficulty,
      tour_data.location,
      tour_data.image_url,
      tour_data.active,
      tour_data.bookings_count,
      tour_data.revenue
    FROM (VALUES
      ('TR-000001', 'Sunset City Bike Tour', 'Experience the city at golden hour on our premium electric bikes. Perfect for photography enthusiasts and couples. We provide helmets, water, and a local guide who knows the best spots.', 85::numeric, '3h', 8, 'Easy', 'Downtown Marina', 'https://images.unsplash.com/photo-1620302066845-314b98c92872?auto=format&fit=crop&q=80&w=200', true, 142, 12070::numeric),
      ('TR-000002', 'Historical Walk', 'A guided walk through the old town visiting key historical landmarks. Learn about the rich history and culture of the city.', 45::numeric, '2h', 15, 'Easy', 'Old Town Square', 'https://images.unsplash.com/photo-1590274780650-664448557c9a?auto=format&fit=crop&q=80&w=200', true, 89, 4005::numeric),
      ('TR-000003', 'Food & Wine Tasting', 'Sample the finest local delicacies and wines in this gastronomic adventure. Includes visits to 3 award-winning restaurants.', 120::numeric, '4h', 6, 'Easy', 'Vineyard District', 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=200', true, 56, 6720::numeric),
      ('TR-000004', 'Mountain Hike Level 2', 'Challenging hike with breathtaking views for experienced hikers. Proper hiking gear is required.', 95::numeric, '6h', 10, 'Hard', 'National Park', 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&q=80&w=200', false, 32, 3040::numeric)
    ) AS tour_data(tour_no, name, description, price, duration, max_people, difficulty, location, image_url, active, bookings_count, revenue)
    WHERE NOT EXISTS (
      SELECT 1 FROM tours t
      WHERE t.organization_id = org.organization_id
      AND t.tour_no = tour_data.tour_no
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add email templates for all organizations
CREATE OR REPLACE FUNCTION public.seed_demo_templates()
RETURNS void AS $$
DECLARE
  org record;
BEGIN
  FOR org IN SELECT DISTINCT organization_id FROM organization_members LOOP
    INSERT INTO email_templates (organization_id, name, subject, body, tags)
    SELECT
      org.organization_id,
      template.name,
      template.subject,
      template.body,
      template.tags
    FROM (VALUES
      ('Booking Confirmation', 'Your booking is confirmed', 'Dear {{customer_name}},\n\nYour booking for {{tour_name}} on {{booking_date}} is confirmed.\n\nBooking Details:\nBooking No: {{booking_no}}\nTour: {{tour_name}}\nDate: {{booking_date}}\nTime: {{start_time}} - {{end_time}}\nParticipants: {{people}}\n\nThank you!', ARRAY['customer_name', 'tour_name', 'booking_date', 'booking_no', 'start_time', 'end_time', 'people']),
      ('Welcome Email', 'Welcome to our tours!', 'Welcome {{customer_name}}!\n\nWe''re excited to have you explore our amazing tours.\n\nFeel free to reach out if you have any questions.', ARRAY['customer_name']),
      ('Payment Reminder', 'Payment reminder for your booking', 'Hi {{customer_name}},\n\nThis is a friendly reminder that payment of ${{amount}} is due for your {{tour_name}} booking.\n\nPlease complete your payment to secure your spot.\n\nThank you!', ARRAY['customer_name', 'amount', 'tour_name'])
    ) AS template(name, subject, body, tags)
    WHERE NOT EXISTS (
      SELECT 1 FROM email_templates et
      WHERE et.organization_id = org.organization_id
      AND et.name = template.name
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;
