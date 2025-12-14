
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { 
  X, Trash2, Save, Clock, Mail, Phone, Building2, Tag, 
  MessageCircle, UserPlus, Activity, MessageSquare, Send,
  History, ChevronRight, CalendarPlus, CalendarCheck, Info
} from 'lucide-react';
import { useI18n } from '../../context/ThemeContext';
import { Lead, LeadStatus, Booking } from '../../types';

// --- Types & Constants ---

type Tab = 'details' | 'comments' | 'activity';

interface ActivityLogItem {
  id: string;
  leadId: string;
  field: string;
  from: string | number | undefined;
  to: string | number | undefined;
  actorName: string;
  timestamp: number;
}

interface CommentItem {
  id: string;
  leadId: string;
  text: string;
  authorName: string;
  timestamp: number;
  mentions: string[];
}

interface TeamUser {
  id: string;
  name: string;
  role: string;
  email: string;
}

const TEAM_USERS: TeamUser[] = [
  { id: '1', name: 'Alex Walker', role: 'Owner', email: 'alex@wanderlust.com' },
  { id: '2', name: 'Sarah Miller', role: 'Guide', email: 'sarah@wanderlust.com' },
  { id: '3', name: 'Mike Johnson', role: 'Driver', email: 'mike@wanderlust.com' },
  { id: '4', name: 'Emily Davis', role: 'Support', email: 'emily@wanderlust.com' },
];

const CURRENT_USER_NAME = 'Alex Walker';

const STATUS_OPTIONS: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Booked', 'Lost'];

// --- Helper Component: Assignee Lookup ---

const AssigneeLookup: React.FC<{
  value: string;
  onChange: (val: string) => void;
}> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedUser = TEAM_USERS.find(u => u.name === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredUsers = TEAM_USERS.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={wrapperRef} className="relative">
      <div 
        className={`relative flex items-center w-full border rounded-lg bg-white dark:bg-gray-800 transition-shadow cursor-text ${
          isOpen ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-gray-200 dark:border-gray-600'
        }`}
        onClick={() => {
          if (!isOpen) setIsOpen(true);
        }}
      >
        <div className="pl-3 flex items-center pointer-events-none">
          <UserPlus className="w-4 h-4 text-gray-400" />
        </div>

        {value && !isOpen ? (
          <div className="flex-1 flex items-center justify-between py-2 px-3">
            <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
              {value}
              {selectedUser && <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">({selectedUser.role})</span>}
            </span>
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <input
            type="text"
            className="block w-full px-3 py-2 bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white text-sm placeholder-gray-400"
            placeholder={value ? '' : "Assign to..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setIsOpen(true)}
          />
        )}
      </div>

      {isOpen && (
        <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex flex-col border-b border-gray-50 dark:border-gray-700 last:border-0"
                onClick={() => {
                  onChange(user.name);
                  setIsOpen(false);
                  setSearch('');
                }}
              >
                <span className="font-medium text-gray-900 dark:text-white">{user.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {user.role} • {user.email}
                </span>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
              No matching members
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- Main Component ---

interface LeadDetailPaneProps {
  lead: Lead;
  onClose: () => void;
  onSave: (updated: Lead) => void;
  onDelete: (id: string) => void;
  onOpenChat?: () => void;
  onCreateBooking?: () => void;
  relatedBookings?: Booking[];
  initialTab?: Tab;
}

const LeadDetailPane: React.FC<LeadDetailPaneProps> = ({ 
  lead, 
  onClose, 
  onSave, 
  onDelete, 
  onOpenChat,
  onCreateBooking,
  relatedBookings = [],
  initialTab = 'details'
}) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  // Form State
  const [form, setForm] = useState(() => ({
    name: lead.name,
    status: lead.status as LeadStatus,
    channel: lead.channel,
    email: (lead as any).email || '',
    phone: (lead as any).phone || '',
    company: (lead as any).company || '',
    value: String((lead as any).value || ''),
    notes: (lead as any).notes || '',
    assignedTo: lead.assignedTo || '',
  }));

  // Activity & Comments State
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [comments, setComments] = useState<CommentItem[]>([]);
  
  // Comment Input State
  const [commentText, setCommentText] = useState('');
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  // Load persisted data on mount/change
  useEffect(() => {
    setForm({
      name: lead.name,
      status: lead.status as LeadStatus,
      channel: lead.channel,
      email: (lead as any).email || '',
      phone: (lead as any).phone || '',
      company: (lead as any).company || '',
      value: String((lead as any).value || ''),
      notes: (lead as any).notes || '',
      assignedTo: lead.assignedTo || '',
    });

    const storedActivities = localStorage.getItem(`lead_activities_${lead.id}`);
    if (storedActivities) setActivities(JSON.parse(storedActivities));
    else setActivities([]);

    const storedComments = localStorage.getItem(`lead_comments_${lead.id}`);
    if (storedComments) setComments(JSON.parse(storedComments));
    else setComments([]);
    
    // Reset tab when lead changes (unless initialTab is provided in this render cycle which we rely on parent to key or reset)
    setActiveTab(initialTab);
  }, [lead.id, initialTab]);

  const isDirty = useMemo(() => {
    const original = {
      name: lead.name,
      status: lead.status,
      channel: lead.channel,
      email: (lead as any).email || '',
      phone: (lead as any).phone || '',
      company: (lead as any).company || '',
      value: String((lead as any).value || ''),
      notes: (lead as any).notes || '',
      assignedTo: lead.assignedTo || '',
    };
    return JSON.stringify(form) !== JSON.stringify(original);
  }, [form, lead]);

  const onChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // --- Actions ---

  const handleSave = () => {
    const original = {
      name: lead.name,
      status: lead.status,
      channel: lead.channel,
      email: (lead as any).email || '',
      phone: (lead as any).phone || '',
      company: (lead as any).company || '',
      value: String((lead as any).value || ''),
      notes: (lead as any).notes || '',
      assignedTo: lead.assignedTo || '',
    };

    // Detect changes for activity log
    const changes: ActivityLogItem[] = [];
    const fieldsToCheck = [
      { key: 'name', label: 'Name' },
      { key: 'status', label: 'Status' },
      { key: 'channel', label: 'Channel' },
      { key: 'assignedTo', label: 'Assignee' },
      { key: 'value', label: 'Value' },
      { key: 'company', label: 'Company' }
    ];

    fieldsToCheck.forEach(({ key, label }) => {
      const from = (original as any)[key];
      const to = (form as any)[key];
      if (String(from) !== String(to)) {
        changes.push({
          id: `a_${Date.now()}_${key}`,
          leadId: lead.id,
          field: label,
          from: from || 'Empty',
          to: to || 'Empty',
          actorName: CURRENT_USER_NAME,
          timestamp: Date.now()
        });
      }
    });

    if (changes.length > 0) {
      const updatedActivities = [...changes, ...activities];
      setActivities(updatedActivities);
      localStorage.setItem(`lead_activities_${lead.id}`, JSON.stringify(updatedActivities));
    }

    const parsedValue = form.value.trim() === '' ? 0 : Number(form.value);
    const updated: Lead = {
      ...lead,
      name: form.name,
      status: form.status as LeadStatus,
      channel: form.channel,
      assignedTo: form.assignedTo,
      // Pass extended fields as any since Lead type is strict in some contexts
      ...({
        email: form.email,
        phone: form.phone,
        company: form.company,
        value: Number.isFinite(parsedValue) ? parsedValue : 0,
        notes: form.notes
      } as any)
    };

    onSave(updated);
  };

  const handleDelete = () => {
    if (window.confirm('Delete this lead? This cannot be undone.')) {
      onDelete(lead.id);
      onClose();
    }
  };

  // --- Comment Logic ---

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCommentText(val);

    const cursorIndex = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorIndex);
    const words = textBeforeCursor.split(/\s/);
    const currentWord = words[words.length - 1];

    if (currentWord.startsWith('@')) {
      setShowMentionList(true);
      setMentionQuery(currentWord.slice(1));
    } else {
      setShowMentionList(false);
    }
  };

  const insertMention = (userName: string) => {
    const cursorIndex = commentInputRef.current?.selectionStart || 0;
    const textBeforeCursor = commentText.slice(0, cursorIndex);
    const textAfterCursor = commentText.slice(cursorIndex);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    const newTextBefore = textBeforeCursor.slice(0, lastAtIndex) + `@${userName} `;
    setCommentText(newTextBefore + textAfterCursor);
    setShowMentionList(false);
    commentInputRef.current?.focus();
  };

  const postComment = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!commentText.trim()) return;

    const mentionsFound = TEAM_USERS
        .filter(u => commentText.includes(`@${u.name}`))
        .map(u => u.name);

    const newComment: CommentItem = {
      id: `c_${Date.now()}`,
      leadId: lead.id,
      text: commentText,
      authorName: CURRENT_USER_NAME,
      timestamp: Date.now(),
      mentions: mentionsFound
    };

    const updatedComments = [newComment, ...comments];
    setComments(updatedComments);
    localStorage.setItem(`lead_comments_${lead.id}`, JSON.stringify(updatedComments));
    setCommentText('');
  };

  // --- Render Helpers ---

  const mentionFilteredUsers = TEAM_USERS.filter(u => 
    u.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const existingBooking = relatedBookings.find(b => b.leadId === lead.id || b.clientName === lead.name);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 shadow-2xl">
      {/* Header */}
      <div className="flex-none px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-start justify-between bg-white dark:bg-gray-800 z-10">
        <div>
          <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            {t('lead_details_title') ?? 'Lead Details'}
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
            {form.name || 'New Lead'}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span className={`px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300`}>
              {form.status}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Tag className="w-3 h-3" /> {form.channel}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {existingBooking ? (
             <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors text-sm font-medium">
               <CalendarCheck className="w-4 h-4" />
               View Booking
             </button>
          ) : (
             <button 
                onClick={onCreateBooking}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors text-sm font-medium"
             >
               <CalendarPlus className="w-4 h-4" />
               Create Booking
             </button>
          )}
          
          {onOpenChat && (
            <button onClick={onOpenChat} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-300" title="Message">
              <MessageCircle className="w-5 h-5" />
            </button>
          )}
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" title="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-none border-b border-gray-100 dark:border-gray-700 px-6 flex gap-6">
        {[
          { id: 'details', label: 'Details', icon: UserPlus },
          { id: 'comments', label: 'Comments', icon: MessageSquare, count: comments.length },
          { id: 'activity', label: 'Activity', icon: Activity }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30 dark:bg-gray-900/10">
        
        {/* DETAILS TAB */}
        {activeTab === 'details' && (
          <div className="space-y-6">
            {/* Core Info Card */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => onChange('name', e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => onChange('status', e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Channel</label>
                    <input
                      value={form.channel}
                      onChange={(e) => onChange('channel', e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Assigned To</label>
                  <AssigneeLookup 
                    value={form.assignedTo} 
                    onChange={(val) => onChange('assignedTo', val)} 
                  />
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">Contact</h4>
              <div className="space-y-3">
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    value={form.email}
                    onChange={(e) => onChange('email', e.target.value)}
                    className="w-full pl-9 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="Email Address"
                  />
                </div>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    value={form.phone}
                    onChange={(e) => onChange('phone', e.target.value)}
                    className="w-full pl-9 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="Phone Number"
                  />
                </div>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    value={form.company}
                    onChange={(e) => onChange('company', e.target.value)}
                    className="w-full pl-9 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="Company (Optional)"
                  />
                </div>
              </div>
            </div>

            {/* Deal Info */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">Deal Info</h4>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Estimated Value ($)</label>
                  <input
                    type="number"
                    value={form.value}
                    onChange={(e) => onChange('value', e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => onChange('notes', e.target.value)}
                    className="w-full min-h-[100px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                    placeholder="Add context, requirements, etc..."
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* COMMENTS TAB */}
        {activeTab === 'comments' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 space-y-4 mb-4">
              {comments.length === 0 ? (
                <div className="text-center py-10 text-gray-400 dark:text-gray-500">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No comments yet.</p>
                  <p className="text-xs">Start the conversation!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-300 shrink-0">
                      {comment.authorName.charAt(0)}
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg rounded-tl-none border border-gray-200 dark:border-gray-700 shadow-sm flex-1">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{comment.authorName}</span>
                        <span className="text-[10px] text-gray-400">{new Date(comment.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {comment.text.split(/(@\w+(?:\s\w+)?)/g).map((part, i) => 
                          part.startsWith('@') ? <span key={i} className="text-indigo-600 dark:text-indigo-400 font-medium">{part}</span> : part
                        )}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <div className="relative mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
              {showMentionList && (
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-40 overflow-y-auto z-10">
                  {mentionFilteredUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => insertMention(user.name)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex flex-col"
                    >
                      <span className="font-medium text-gray-900 dark:text-white">{user.name}</span>
                      <span className="text-xs text-gray-500">{user.role}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="relative">
                <textarea
                  ref={commentInputRef}
                  value={commentText}
                  onChange={handleCommentChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      postComment();
                    }
                  }}
                  placeholder="Write a comment... use @ to mention"
                  className="w-full pl-3 pr-10 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
                  rows={2}
                />
                <button 
                  onClick={postComment}
                  disabled={!commentText.trim()}
                  className="absolute right-2 bottom-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ACTIVITY TAB */}
        {activeTab === 'activity' && (
          <div className="space-y-0 relative">
            {activities.length === 0 ? (
              <div className="text-center py-10 text-gray-400 dark:text-gray-500">
                <History className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No activity recorded yet.</p>
              </div>
            ) : (
              activities.slice().reverse().map((activity, idx) => (
                <div key={activity.id} className="relative pl-6 pb-6 last:pb-0">
                  {idx !== activities.length - 1 && (
                    <div className="absolute left-[9px] top-6 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
                  )}
                  <div className="absolute left-0 top-1 w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-white dark:border-gray-900 ring-1 ring-gray-200 dark:ring-gray-700 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold text-gray-900 dark:text-white">{activity.actorName}</span>
                    <span className="text-gray-500 dark:text-gray-400"> changed </span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{activity.field}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 text-xs">
                    <span className="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 px-1.5 py-0.5 rounded line-through truncate max-w-[100px]">
                      {String(activity.from)}
                    </span>
                    <ChevronRight className="w-3 h-3 text-gray-400" />
                    <span className="bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 px-1.5 py-0.5 rounded truncate max-w-[100px]">
                      {String(activity.to)}
                    </span>
                  </div>
                  <div className="mt-1 text-[10px] text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(activity.timestamp).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer (Only for Details) */}
      {activeTab === 'details' && (
        <div className="flex-none px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 z-10 flex justify-between gap-3">
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
            className="flex-1 max-w-[140px] px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
};

export default LeadDetailPane;
