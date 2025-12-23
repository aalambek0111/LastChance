# Supabase Setup Guide - TourCRM Dashboard

## Database Configuration

Your Supabase project is now fully configured with all necessary tables, relationships, and security policies for end-to-end testing.

**Project Details:**
- URL: https://pzvfoilrgkrqyeypjgub.supabase.co
- API Key: sb_publishable_hv6NqscxU5NB-ZGYRE48gw_ITPqIab2

## Tables Created

### 1. **Organizations & Team** (Multi-Tenant)
- `organizations` - Workspace containers for different businesses
- `organization_members` - Users in organizations with roles (owner, admin, member)
- `team_members` - Team members available for task assignment

**Auto-Features:**
- When a user signs up, an organization is automatically created
- User becomes owner of the organization
- Demo team members are automatically seeded

### 2. **Tours & Pricing**
- `tours` - Tour offerings with description, price, duration, difficulty
- `pricing_tiers` - Flexible pricing for different customer segments (Adult, Child, Senior, etc.)
- `tour_tags` - Tags for filtering and categorizing tours

**Demo Tours Included:**
- Sunset City Bike Tour ($85, 3h)
- Historical Walk ($45, 2h)
- Food & Wine Tasting ($120, 4h)
- Mountain Hike Level 2 ($95, 6h)

### 3. **Leads & Bookings**
- `leads` - Customer prospects/inquiries from various channels
- `bookings` - Confirmed tour reservations
- `booking_tiers` - Line items for bookings (e.g., 2 adults + 1 child)

**Channels Supported:**
- Website
- WhatsApp
- Email
- Referral

**Lead Statuses:**
- New, Contacted, Qualified, Booked, Lost

**Booking Statuses:**
- Pending, Confirmed, Completed, Cancelled

**Payment Statuses:**
- Unpaid, Waiting, Partially Paid, Paid, Refunded

### 4. **Messaging & Conversations**
- `conversations` - Grouped messages for each lead
- `messages` - Individual messages with sender info
- `conversation_participants` - Track team members in conversations

**Features:**
- Multi-channel support (Website, WhatsApp, Email, Referral)
- Conversation status tracking (open, resolved, archived)
- Message history with timestamps

### 5. **Notifications**
- `notifications` - User notifications for events
- Supports types: lead, booking, payment, team, system
- Read/unread tracking

### 6. **Automation & Templates**
- `automation_rules` - Workflow automation configurations
- `automation_logs` - Execution history
- `email_templates` - Email message templates with variables

**Supported Triggers:**
- lead_created
- lead_updated
- booking_created
- booking_confirmed
- booking_canceled

## Automatic Demo Data

When you create an account and sign up:

1. **Organization Created** - Automatically set up as owner
2. **Team Members Seeded** - 4 sample team members:
   - Alex Walker
   - Sarah Miller
   - Mike Johnson
   - Emily Davis

3. **Tours Added** - 4 sample tours with pricing tiers

4. **Sample Leads** - 5 leads with different statuses and channels:
   - Sarah Jenkins (New, Website)
   - Marco Rossi (Contacted, WhatsApp)
   - Emily Chen (New, Email)
   - David Smith (Qualified, Referral)
   - Anita Patel (Contacted, Website)

5. **Sample Bookings** - 5 bookings with different statuses:
   - BR-005120: Confirmed + Paid
   - BR-005121: Pending + Waiting for Payment
   - BR-005122: Confirmed + Paid
   - BR-005123: Confirmed + Unpaid
   - BR-005124: Cancelled

6. **Conversations** - Sample messages for each lead

7. **Email Templates** - 3 pre-built templates:
   - Booking Confirmation
   - Welcome Email
   - Payment Reminder

## Row Level Security (RLS)

All tables have comprehensive RLS policies:

- **Select**: Organization members can view their organization's data
- **Insert/Update**: Team members can create and modify records
- **Delete**: Only organization admins can delete records
- **Cross-table Access**: Nested policies prevent unauthorized access

## Testing Workflow

### End-to-End Testing Steps:

1. **Sign Up**
   - Go to the login page
   - Click "Create an account"
   - Fill in email and password
   - Organization automatically created

2. **Explore Dashboard**
   - View KPIs and recent activity
   - See sample leads and bookings
   - Check notifications

3. **Manage Leads**
   - View 5 sample leads
   - Update lead status
   - Assign to team members
   - View conversation history

4. **Create Booking**
   - Go to Bookings page
   - Click "New Booking"
   - Select tour from dropdown (pre-populated with 4 tours)
   - Set date, time, participants
   - Configure pricing tiers
   - Save booking

5. **Inbox & Messaging**
   - View conversation threads
   - Send/receive messages
   - Messages organized by channel
   - AI analysis available (requires Gemini API key)

6. **Calendar View**
   - See all bookings on calendar
   - Day/week/month views
   - Click to edit bookings

7. **Reports**
   - View revenue metrics
   - Booking status reports
   - Lead conversion analytics

8. **Settings**
   - Manage team members
   - Configure automations
   - Email templates
   - Layout customization

## Example Queries

If you need to query data directly in Supabase SQL Editor:

```sql
-- Get all leads for current organization
SELECT * FROM leads
WHERE organization_id = current_user_org_id
ORDER BY last_message_time DESC;

-- Get bookings by date range
SELECT b.*, t.name as tour_name, l.name as lead_name
FROM bookings b
JOIN tours t ON b.tour_id = t.id
LEFT JOIN leads l ON b.lead_id = l.id
WHERE b.organization_id = current_user_org_id
AND b.booking_date BETWEEN '2024-12-24' AND '2024-12-31'
ORDER BY b.booking_date;

-- Get payment summary
SELECT
  payment_status,
  COUNT(*) as count,
  SUM(total_amount) as revenue,
  SUM(amount_paid) as paid
FROM bookings
WHERE organization_id = current_user_org_id
GROUP BY payment_status;
```

## Available Actions

### In the App:

- ✅ Create, read, update, delete leads
- ✅ Create, read, update, delete bookings
- ✅ View and manage tours
- ✅ Send and receive messages
- ✅ Assign tasks to team members
- ✅ Track payment status
- ✅ View notifications
- ✅ Set up automation rules
- ✅ Create email templates
- ✅ Generate reports

## Notes

- All data is organization-scoped (multi-tenant)
- User roles: owner, admin, member
- RLS policies enforce data isolation
- Demo data is unique per organization
- Data persists across sessions
- All timestamps are in UTC

## Next Steps

1. **Sign up** with your email
2. **Explore** the dashboard with demo data
3. **Create** your own leads and bookings
4. **Manage** team assignments and workflow
5. **Customize** email templates for your business
6. **Set up** automation rules for workflow optimization

Enjoy testing your TourCRM dashboard! 🚀
