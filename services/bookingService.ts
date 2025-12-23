import { supabase } from '../lib/supabase';

export interface CreateBookingInput {
  tour_id: string;
  client_name: string;
  email?: string;
  phone?: string;
  people: number;
  booking_date: string;
  start_time?: string;
  end_time?: string;
  status?: string;
  payment_status?: string;
  total_amount?: number;
  amount_paid?: number;
  pickup_location?: string;
  notes?: string;
  assigned_to?: string;
  lead_id?: string;
}

export interface CreateBookingTierInput {
  booking_id: string;
  tier_name: string;
  quantity: number;
  price_per_unit: number;
}

export const bookingService = {
  async createBooking(organizationId: string, data: CreateBookingInput) {
    const amount_due = (data.total_amount || 0) - (data.amount_paid || 0);

    const { data: result, error } = await supabase
      .from('bookings')
      .insert({
        organization_id: organizationId,
        tour_id: data.tour_id,
        client_name: data.client_name,
        email: data.email || null,
        phone: data.phone || null,
        people: data.people,
        booking_date: data.booking_date,
        start_time: data.start_time || null,
        end_time: data.end_time || null,
        status: data.status || 'Pending',
        payment_status: data.payment_status || 'Unpaid',
        total_amount: data.total_amount || 0,
        amount_paid: data.amount_paid || 0,
        amount_due: amount_due,
        pickup_location: data.pickup_location || null,
        notes: data.notes || null,
        assigned_to: data.assigned_to || null,
        lead_id: data.lead_id || null,
        created_by: (await supabase.auth.getUser()).data.user?.id,
        created_at: new Date().toISOString()
      })
      .select();

    if (error) throw error;
    return result?.[0];
  },

  async updateBooking(bookingId: string, data: Partial<CreateBookingInput>) {
    const amount_due =
      (data.total_amount || 0) - (data.amount_paid || 0);

    const { data: result, error } = await supabase
      .from('bookings')
      .update({
        client_name: data.client_name,
        email: data.email,
        phone: data.phone,
        people: data.people,
        booking_date: data.booking_date,
        start_time: data.start_time,
        end_time: data.end_time,
        status: data.status,
        payment_status: data.payment_status,
        total_amount: data.total_amount,
        amount_paid: data.amount_paid,
        amount_due: amount_due,
        pickup_location: data.pickup_location,
        notes: data.notes,
        assigned_to: data.assigned_to,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select();

    if (error) throw error;
    return result?.[0];
  },

  async deleteBooking(bookingId: string) {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', bookingId);

    if (error) throw error;
  },

  async getBookingsByOrganization(organizationId: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('organization_id', organizationId)
      .order('booking_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getBookingsByLead(leadId: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('lead_id', leadId)
      .order('booking_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createBookingTier(data: CreateBookingTierInput) {
    const { data: result, error } = await supabase
      .from('booking_tiers')
      .insert({
        booking_id: data.booking_id,
        tier_name: data.tier_name,
        quantity: data.quantity,
        price_per_unit: data.price_per_unit,
        created_at: new Date().toISOString()
      })
      .select();

    if (error) throw error;
    return result?.[0];
  },

  async deleteBookingTiers(bookingId: string) {
    const { error } = await supabase
      .from('booking_tiers')
      .delete()
      .eq('booking_id', bookingId);

    if (error) throw error;
  }
};
