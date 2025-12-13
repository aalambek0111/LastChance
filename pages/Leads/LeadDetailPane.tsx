import React, { useEffect, useMemo, useState } from 'react';
import { X, Trash2, Save, Clock, Mail, Phone, Building2, Tag, MessageCircle, UserPlus } from 'lucide-react';
import { useI18n } from '../../context/ThemeContext';
import { Lead, LeadStatus } from '../../types';
import { MOCK_TEAM_MEMBERS } from '../../data/mockData';

const STATUS_OPTIONS: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Booked', 'Lost'];

interface LeadDetailPaneProps {
  lead: Lead;
  onClose: () => void;
  onSave: (updated: Lead) => void;
  onDelete: (id: string) => void;
  onOpenChat?: () => void;
}

const LeadDetailPane: React.FC<LeadDetailPaneProps> = ({ lead, onClose, onSave, onDelete, onOpenChat }) => {
  const { t } = useI18n();

  const getAny = (obj: any, key: string, fallback: any = '') => {
    const v = obj?.[key];
    return v === undefined || v === null ? fallback : v;
  };

  const [form, setForm] = useState(() => ({
    name: String(getAny(lead, 'name', '')),
    status: (getAny(lead, 'status', 'New') as LeadStatus) ?? 'New',
    channel: String(getAny(lead, 'channel', '')),
    email: String(getAny(lead, 'email', '')),
    phone: String(getAny(lead, 'phone', '')),
    company: String(getAny(lead, 'company', '')),
    value: String(getAny(lead, 'value', '')),
    notes: String(getAny(lead, 'notes', '')),
    assignedTo: String(getAny(lead, 'assignedTo', '')),
  }));

  useEffect(() => {
    setForm({
      name: String(getAny(lead, 'name', '')),
      status: (getAny(lead, 'status', 'New') as LeadStatus) ?? 'New',
      channel: String(getAny(lead, 'channel', '')),
      email: String(getAny(lead, 'email', '')),
      phone: String(getAny(lead, 'phone', '')),
      company: String(getAny(lead, 'company', '')),
      value: String(getAny(lead, 'value', '')),
      notes: String(getAny(lead, 'notes', '')),
      assignedTo: String(getAny(lead, 'assignedTo', '')),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(lead as any).id]);

  const isDirty = useMemo(() => {
    return (
      form.name !== String(getAny(lead, 'name', '')) ||
      form.status !== (getAny(lead, 'status', 'New') as LeadStatus) ||
      form.channel !== String(getAny(lead, 'channel', '')) ||
      form.email !== String(getAny(lead, 'email', '')) ||
      form.phone !== String(getAny(lead, 'phone', '')) ||
      form.company !== String(getAny(lead, 'company', '')) ||
      form.value !== String(getAny(lead, 'value', '')) ||
      form.notes !== String(getAny(lead, 'notes', '')) ||
      form.assignedTo !== String(getAny(lead, 'assignedTo', ''))
    );
  }, [form, lead]);

  const onChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const parsed = form.value.trim() === '' ? getAny(lead as any, 'value', '') : Number(form.value);
    const safeValue = typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : form.value;

    const updated: Lead = {
      ...(lead as any),
      name: form.name,
      status: form.status as LeadStatus,
      channel: form.channel,
      email: form.email,
      phone: form.phone,
      company: form.company,
      value: safeValue as any,
      notes: form.notes,
      assignedTo: form.assignedTo,
    };

    onSave(updated);
    onClose();
  };

  const handleDelete = () => {
    const ok = window.confirm('Delete this lead? This cannot be undone.');
    if (!ok) return;
    onDelete(String((lead as any).id));
    onClose();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between">
        <div>
          <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {t('lead_details_title') ?? 'Lead Details'}
          </div>
          <div className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
            {String(getAny(lead, 'name', 'Lead'))}
          </div>

          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            <span>{String(getAny(lead, 'lastMessageTime', ''))}</span>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <Tag className="w-4 h-4" />
            <span>{String(getAny(lead, 'channel', ''))}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenChat && (
            <button
              onClick={onOpenChat}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/40 text-indigo-600 dark:text-indigo-400"
              title="Message"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/40 text-gray-500 dark:text-gray-300"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto px-5 py-5 space-y-6">
        {/* Basic */}
        <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Name
              </label>
              <input
                value={form.name}
                onChange={(e) => onChange('name', e.target.value)}
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="Lead name"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => onChange('status', e.target.value)}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Channel
                </label>
                <input
                  value={form.channel}
                  onChange={(e) => onChange('channel', e.target.value)}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="Website, WhatsApp, Email..."
                />
              </div>
            </div>

            {/* Assigned To */}
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Assigned To
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserPlus className="h-4 w-4 text-gray-400" />
                </div>
                <select
                  value={form.assignedTo}
                  onChange={(e) => onChange('assignedTo', e.target.value)}
                  className="w-full pl-9 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none"
                >
                  <option value="">Unassigned</option>
                  {MOCK_TEAM_MEMBERS.map(member => (
                    <option key={member.id} value={member.name}>{member.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-3">
          <div className="text-sm font-bold text-gray-900 dark:text-white">Contact</div>

          <div className="grid grid-cols-1 gap-3">
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                value={form.email}
                onChange={(e) => onChange('email', e.target.value)}
                className="w-full pl-9 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="Email"
              />
            </div>

            <div className="relative">
              <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                value={form.phone}
                onChange={(e) => onChange('phone', e.target.value)}
                className="w-full pl-9 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="Phone"
              />
            </div>

            <div className="relative">
              <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                value={form.company}
                onChange={(e) => onChange('company', e.target.value)}
                className="w-full pl-9 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="Company (optional)"
              />
            </div>
          </div>
        </div>

        {/* Value + Notes */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Estimated Value
            </label>
            <input
              value={form.value}
              onChange={(e) => onChange('value', e.target.value)}
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => onChange('notes', e.target.value)}
              className="w-full min-h-[120px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              placeholder="Add context, preferences, special requests..."
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3">
        <button
          onClick={handleDelete}
          className="px-3 py-2 rounded-lg text-sm font-medium border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>

        <button
          onClick={handleSave}
          disabled={!isDirty}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          Save
        </button>
      </div>
    </div>
  );
};

export default LeadDetailPane;