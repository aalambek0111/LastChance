
export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Booked' | 'Lost';
export type BookingStatus = 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled';
export type Channel = 'Website' | 'WhatsApp' | 'Email' | 'Referral';
export type PaymentStatus = 'Unpaid' | 'Waiting' | 'Partially Paid' | 'Paid' | 'Refunded';

export interface Lead {
  id: string; // Internal UUID
  leadNo?: string; // Human Readable (e.g. LD-0001)
  name: string;
  lastMessageTime: string; // ISO string or relative time string
  status: LeadStatus;
  channel: Channel;
  assignedTo?: string;
  // Extended fields used in mock data
  email?: string;
  phone?: string;
  company?: string;
  value?: number;
  notes?: string;
}

export interface Booking {
  id: string; // Internal UUID
  bookingNo?: string; // Human Readable (e.g. BR-0001)
  leadId?: string; // Reference to the origin lead
  date: string;
  // Time fields for Calendar
  startTime?: string; // "HH:mm" 24h format
  endTime?: string;   // "HH:mm" 24h format
  
  tourName: string;
  clientName: string;
  people: number;
  status: BookingStatus;
  paymentStatus?: PaymentStatus;
  notes?: string;
  pickupLocation?: string;
  assignedTo?: string;
  
  // Payment fields
  totalAmount?: number;
  amountPaid?: number;
  amountDue?: number; // Calculated/Read-only usually
  isAmountOverridden?: boolean;
}

export interface KPIMetric {
  id: string;
  label: string;
  value: string | number;
  trend?: string; // e.g., "+12%"
  trendUp?: boolean;
}

// --- Notification Types ---

export type NotificationType = 'lead' | 'booking' | 'payment' | 'team' | 'system';

export interface AppNotification {
  id: string;
  title: string;
  description?: string;
  type: NotificationType;
  timestamp: number;
  unread: boolean;
  actionLink?: string; // e.g., page ID or record ID
}

// --- Automation Types ---

export type TriggerType = 
  | 'lead_created' 
  | 'lead_updated' 
  | 'booking_created' 
  | 'booking_confirmed' 
  | 'booking_canceled';

export type ActionType = 'send_email' | 'update_record' | 'create_task';

export type Operator = 'equals' | 'not_equals' | 'contains' | 'gt' | 'lt' | 'is_empty' | 'is_not_empty';

export interface RuleCondition {
  id: string;
  field: string;
  operator: Operator;
  value: string;
}

export interface RuleAction {
  id: string;
  type: ActionType;
  config: Record<string, any>; // Flexible payload (templateId, targetField, value)
}

export interface AutomationRule {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  active: boolean;
  trigger: TriggerType;
  conditions: RuleCondition[];
  actions: RuleAction[];
  lastRunAt?: number;
  lastRunStatus?: 'success' | 'failure';
}

export interface AutomationLog {
  id: string;
  ruleId: string;
  runAt: number;
  status: 'success' | 'failure';
  details: string;
  recordId?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}
