import { supabase } from '../lib/supabase';

export interface CreateLeadInput {
  name: string;
  email?: string;
  phone?: string;
  channel?: string;
  status?: string;
  company?: string;
  value?: number;
  notes?: string;
  assigned_to?: string;
}

export const leadService = {
  async createLead(organizationId: string, data: CreateLeadInput) {
    const { data: result, error } = await supabase
      .from('leads')
      .insert({
        organization_id: organizationId,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        channel: data.channel || 'Website',
        status: data.status || 'New',
        company: data.company || null,
        value: data.value || null,
        notes: data.notes || null,
        assigned_to: data.assigned_to || null,
        created_at: new Date().toISOString()
      })
      .select();

    if (error) throw error;
    return result?.[0];
  },

  async updateLead(leadId: string, data: Partial<CreateLeadInput>) {
    const { data: result, error } = await supabase
      .from('leads')
      .update({
        name: data.name,
        email: data.email,
        phone: data.phone,
        channel: data.channel,
        status: data.status,
        company: data.company,
        value: data.value,
        notes: data.notes,
        assigned_to: data.assigned_to,
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId)
      .select();

    if (error) throw error;
    return result?.[0];
  },

  async deleteLead(leadId: string) {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId);

    if (error) throw error;
  },

  async getLeadsByOrganization(organizationId: string) {
    const { data, error } = await supabase
      .from('leads')
      .select('*, team_members!leads_assigned_to_fkey(name)')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};
