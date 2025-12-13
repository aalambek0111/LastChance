import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, Calendar, MapPin, Users, FileText, Flag, User, CheckCircle, CreditCard, 
  MessageSquare, Activity, Send, Clock, History, ChevronRight 
} from 'lucide-react';
import { Booking, BookingStatus, PaymentStatus } from '../../types';
import { TOURS, RECENT_LEADS } from '../../data/mockData';

// --- Types for New Features ---

interface ActivityLogItem {
  id: string;
  bookingId: string;
  field: string;
  from: string | number | undefined;
  to: string | number | undefined;
  actorName: string;
  timestamp: number;
}

interface CommentItem {
  id: string;
  bookingId: string;
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

const CURRENT_USER_NAME = 'Alex Walker'; // Mock current user

// --- Helper Components ---

interface SearchableSelectProps {
  label: string;
  icon: React.ReactNode;
  options: { id: string | number; label: string; subLabel?: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ 
  label, 
  icon, 
  options, 
  value, 
  onChange, 
  placeholder 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm(value); 
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef, value]);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1.5">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
           {icon}
        </div>
        <input 
          type="text" 
          className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700/50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {isOpen && (
          <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex flex-col border-b border-gray-50 dark:border-gray-700 last:border-0"
                  onClick={() => {
                    onChange(opt.label);
                    setIsOpen(false);
                  }}
                >
                  <span className="font-medium">{opt.label}</span>
                  {opt.subLabel && <span className="text-xs text-gray-500 dark:text-gray-400">{opt.subLabel}</span>}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                No matching results
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main Modal Component ---

interface CreateBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadName?: string;
  onBookingCreated?: (booking: Booking) => void;
  bookingToEdit?: Booking | null;
  onBookingUpdated?: (booking: Booking) => void;
}

const CreateBookingModal: React.FC<CreateBookingModalProps> = ({ 
  isOpen, 
  onClose, 
  leadName = '', 
  onBookingCreated,
  bookingToEdit,
  onBookingUpdated
}) => {
  // Form State
  const [formData, setFormData] = useState({
    tourName: '',
    clientName: '',
    date: '',
    pax: 2,
    status: 'Pending' as BookingStatus,
    paymentStatus: 'Unpaid' as PaymentStatus,
    pickupLocation: '',
    notes: ''
  });

  // Right Panel State (Edit Mode Only)
  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>('comments');
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [comments, setComments] = useState<CommentItem[]>([]);
  
  // Comment Composer State
  const [commentText, setCommentText] = useState('');
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  // Helper to format date for input (YYYY-MM-DD)
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // --- Effects ---

  // 1. Initialize Form & Load Data
  useEffect(() => {
    if (bookingToEdit) {
      setFormData({
        tourName: bookingToEdit.tourName,
        clientName: bookingToEdit.clientName,
        date: formatDateForInput(bookingToEdit.date),
        pax: bookingToEdit.people,
        status: bookingToEdit.status,
        paymentStatus: bookingToEdit.paymentStatus || 'Unpaid',
        pickupLocation: bookingToEdit.pickupLocation || '',
        notes: bookingToEdit.notes || ''
      });

      // Load Activities
      const storedActivities = localStorage.getItem(`booking_activities_${bookingToEdit.id}`);
      if (storedActivities) setActivities(JSON.parse(storedActivities));
      else setActivities([]);

      // Load Comments
      const storedComments = localStorage.getItem(`booking_comments_${bookingToEdit.id}`);
      if (storedComments) setComments(JSON.parse(storedComments));
      else setComments([]);

    } else {
      // Create Mode Reset
      setFormData({
        tourName: '',
        clientName: leadName && leadName !== 'New Client' ? leadName : '',
        date: new Date().toISOString().split('T')[0],
        pax: 2,
        status: 'Pending',
        paymentStatus: 'Unpaid',
        pickupLocation: '',
        notes: ''
      });
      setActivities([]);
      setComments([]);
    }
  }, [bookingToEdit, isOpen, leadName]);

  // --- Handlers ---

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCommentText(val);

    // Simple mention detection: Check if word currently typing starts with @
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
    
    // Replace the incomplete mention with full name
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    const newTextBefore = textBeforeCursor.slice(0, lastAtIndex) + `@${userName} `;
    
    setCommentText(newTextBefore + textAfterCursor);
    setShowMentionList(false);
    commentInputRef.current?.focus();
  };

  const postComment = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!commentText.trim() || !bookingToEdit) return;

    // Find mentions in final text
    const mentionsFound = TEAM_USERS
        .filter(u => commentText.includes(`@${u.name}`))
        .map(u => u.name);

    const newComment: CommentItem = {
      id: `c_${Date.now()}`,
      bookingId: bookingToEdit.id,
      text: commentText,
      authorName: CURRENT_USER_NAME,
      timestamp: Date.now(),
      mentions: mentionsFound
    };

    const updatedComments = [newComment, ...comments];
    setComments(updatedComments);
    localStorage.setItem(`booking_comments_${bookingToEdit.id}`, JSON.stringify(updatedComments));
    setCommentText('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (bookingToEdit && onBookingUpdated) {
      // 1. Detect Changes for Activity Log
      const changes: ActivityLogItem[] = [];
      const original = {
        tourName: bookingToEdit.tourName,
        clientName: bookingToEdit.clientName,
        date: formatDateForInput(bookingToEdit.date),
        pax: bookingToEdit.people,
        status: bookingToEdit.status,
        paymentStatus: bookingToEdit.paymentStatus || 'Unpaid',
        pickupLocation: bookingToEdit.pickupLocation || '',
        notes: bookingToEdit.notes || ''
      };

      // Helper to compare values loosely
      const hasChanged = (a: any, b: any) => String(a) !== String(b);

      if (hasChanged(original.tourName, formData.tourName)) 
        changes.push({ id: `a_${Date.now()}_1`, bookingId: bookingToEdit.id, field: 'Tour', from: original.tourName, to: formData.tourName, actorName: CURRENT_USER_NAME, timestamp: Date.now() });
      if (hasChanged(original.status, formData.status)) 
        changes.push({ id: `a_${Date.now()}_2`, bookingId: bookingToEdit.id, field: 'Status', from: original.status, to: formData.status, actorName: CURRENT_USER_NAME, timestamp: Date.now() });
      if (hasChanged(original.paymentStatus, formData.paymentStatus)) 
        changes.push({ id: `a_${Date.now()}_3`, bookingId: bookingToEdit.id, field: 'Payment', from: original.paymentStatus, to: formData.paymentStatus, actorName: CURRENT_USER_NAME, timestamp: Date.now() });
      if (hasChanged(original.date, formData.date)) 
        changes.push({ id: `a_${Date.now()}_4`, bookingId: bookingToEdit.id, field: 'Date', from: original.date, to: formData.date, actorName: CURRENT_USER_NAME, timestamp: Date.now() });
      if (hasChanged(original.pax, formData.pax)) 
        changes.push({ id: `a_${Date.now()}_5`, bookingId: bookingToEdit.id, field: 'Pax', from: original.pax, to: formData.pax, actorName: CURRENT_USER_NAME, timestamp: Date.now() });
      if (hasChanged(original.pickupLocation, formData.pickupLocation)) 
        changes.push({ id: `a_${Date.now()}_6`, bookingId: bookingToEdit.id, field: 'Pickup', from: original.pickupLocation, to: formData.pickupLocation, actorName: CURRENT_USER_NAME, timestamp: Date.now() });

      // Save Activities
      if (changes.length > 0) {
        const updatedActivities = [...changes, ...activities];
        setActivities(updatedActivities); // update local state just in case
        localStorage.setItem(`booking_activities_${bookingToEdit.id}`, JSON.stringify(updatedActivities));
      }

      // 2. Update Booking
      const updatedBooking: Booking = {
        ...bookingToEdit,
        tourName: formData.tourName,
        clientName: formData.clientName || 'Unknown Client',
        date: formData.date,
        people: formData.pax,
        status: formData.status,
        paymentStatus: formData.paymentStatus,
        pickupLocation: formData.pickupLocation,
        notes: formData.notes
      };
      onBookingUpdated(updatedBooking);

    } else {
      // Create Mode
      const newBooking: Booking = {
        id: `B${Date.now()}`,
        tourName: formData.tourName,
        date: formData.date,
        clientName: formData.clientName || 'Unknown Client',
        people: formData.pax,
        status: formData.status,
        paymentStatus: formData.paymentStatus,
        pickupLocation: formData.pickupLocation,
        notes: formData.notes
      };

      if (onBookingCreated) {
        onBookingCreated(newBooking);
      }
    }

    onClose();
  };

  // --- Render Helpers ---

  const clientOptions = [
    ...RECENT_LEADS.map(lead => ({ id: lead.id, label: lead.name, subLabel: `${lead.channel} • ${lead.status}` })),
    { id: 'walk-in', label: 'Walk-in Client', subLabel: 'Direct Booking' }
  ];

  const tourOptions = TOURS.map(tour => ({ 
    id: tour.id, 
    label: tour.name, 
    subLabel: `${tour.duration} • $${tour.price}` 
  }));

  const mentionFilteredUsers = TEAM_USERS.filter(u => 
    u.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto" role="dialog" aria-modal="true">
      <div 
        className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      <div className="flex items-center justify-center min-h-screen p-4">
        {/* Modal Container: wider if editing */}
        <div className={`relative bg-white dark:bg-gray-800 rounded-2xl w-full border border-gray-100 dark:border-gray-700 shadow-2xl transform transition-all flex flex-col max-h-[90vh] ${bookingToEdit ? 'max-w-5xl' : 'max-w-md'}`}>
          
          {/* Header */}
          <div className="flex-none flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {bookingToEdit ? `Edit Booking ${bookingToEdit.id}` : 'Create New Booking'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {bookingToEdit ? 'Update details, track activity, and collaborate.' : 'Enter details below to create a new record.'}
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
            
            {/* LEFT COLUMN: FORM */}
            <div className={`flex-1 overflow-y-auto p-6 ${bookingToEdit ? 'lg:border-r border-gray-100 dark:border-gray-700' : ''}`}>
              <form id="booking-form" onSubmit={handleSubmit} className="space-y-5">
                <SearchableSelect 
                  label="Client"
                  icon={<User className="w-4 h-4 text-gray-400" />}
                  options={clientOptions}
                  value={formData.clientName}
                  onChange={(val) => setFormData({ ...formData, clientName: val })}
                  placeholder="Select a lead..."
                />

                <SearchableSelect 
                  label="Tour Name"
                  icon={<Flag className="w-4 h-4 text-gray-400" />}
                  options={tourOptions}
                  value={formData.tourName}
                  onChange={(val) => setFormData({ ...formData, tourName: val })}
                  placeholder="Select a tour..."
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1.5">Date</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <Calendar className="w-4 h-4 text-gray-400" />
                      </div>
                      <input 
                        type="date" 
                        required
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700/50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={formData.date}
                        onChange={e => setFormData({...formData, date: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1.5">Pax</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <Users className="w-4 h-4 text-gray-400" />
                      </div>
                      <input 
                        type="number" 
                        min="1"
                        required
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700/50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={formData.pax}
                        onChange={e => setFormData({...formData, pax: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1.5">Status</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <CheckCircle className="w-4 h-4 text-gray-400" />
                      </div>
                      <select
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700/50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm appearance-none"
                        value={formData.status}
                        onChange={e => setFormData({...formData, status: e.target.value as BookingStatus})}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1.5">Payment</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <CreditCard className="w-4 h-4 text-gray-400" />
                      </div>
                      <select
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700/50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm appearance-none"
                        value={formData.paymentStatus}
                        onChange={e => setFormData({...formData, paymentStatus: e.target.value as PaymentStatus})}
                      >
                        <option value="Unpaid">Unpaid</option>
                        <option value="Waiting for payment">Waiting</option>
                        <option value="Paid">Paid</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1.5">Pickup Location</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                       <MapPin className="w-4 h-4 text-gray-400" />
                    </div>
                    <input 
                      type="text" 
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700/50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="e.g. Hotel Grand Central"
                      value={formData.pickupLocation}
                      onChange={e => setFormData({...formData, pickupLocation: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1.5">Notes</label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 pointer-events-none">
                       <FileText className="w-4 h-4 text-gray-400" />
                    </div>
                    <textarea 
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700/50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm resize-none"
                      rows={3}
                      placeholder="Dietary requirements, special requests..."
                      value={formData.notes}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* RIGHT COLUMN: TABS (Only visible when editing) */}
            {bookingToEdit && (
              <div className="flex-1 flex flex-col bg-gray-50/50 dark:bg-gray-900/30 min-h-[400px]">
                {/* Tab Headers */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6">
                  <button
                    onClick={() => setActiveTab('comments')}
                    className={`py-4 text-sm font-medium mr-6 border-b-2 transition-colors flex items-center gap-2 ${
                      activeTab === 'comments'
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    Comments
                    <span className="ml-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-0.5 px-2 rounded-full text-xs">
                      {comments.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('activity')}
                    className={`py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                      activeTab === 'activity'
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                    Activity
                  </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-6 relative">
                  
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
                            <div key={comment.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2">
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

                      {/* Comment Input */}
                      <div className="relative mt-auto">
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
                            onClick={() => postComment()}
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
                            {/* Timeline Line */}
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
                              <span className="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 px-1.5 py-0.5 rounded line-through">
                                {String(activity.from || 'Empty')}
                              </span>
                              <ChevronRight className="w-3 h-3 text-gray-400" />
                              <span className="bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 px-1.5 py-0.5 rounded">
                                {String(activity.to || 'Empty')}
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
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex-none px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-end gap-3 rounded-b-2xl">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              form="booking-form"
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm active:scale-95"
            >
              {bookingToEdit ? 'Save Changes' : 'Create Booking'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CreateBookingModal;