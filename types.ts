
export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Booked' | 'Lost';
export type BookingStatus = 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled';
export type Channel = 'Website' | 'WhatsApp' | 'Email' | 'Referral';
export type PaymentStatus = 'Unpaid' | 'Waiting' | 'Partially Paid' | 'Paid' | 'Refunded';

export interface Lead {
  id: string;
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
  id: string;
  leadId?: string; // Reference to the origin lead
  date: string;
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
