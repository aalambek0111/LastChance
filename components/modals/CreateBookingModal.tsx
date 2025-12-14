
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, Calendar, MapPin, Users, FileText, Flag, User, CheckCircle, CreditCard, 
  MessageSquare, Activity, Send, Clock, History, ChevronRight, UserPlus, Info,
  RotateCcw, AlertCircle
} from 'lucide-react';
import { Booking, BookingStatus, PaymentStatus, Lead } from '../../types';
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

// Local Toast Component
const ModalToast = ({ message, onClose }: { message: string; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] bg-gray-900/90 text-white px-4 py-2.5 rounded-full shadow-xl text-sm font-medium flex items-center gap-2 animate-in fade-in zoom-in duration-300 backdrop-blur-sm border border-gray-700/50">
      <CheckCircle className="w-4 h-4 text-emerald-400" />
      {message}
    </div>
  );
};

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
    <div ref={wrapperRef} className="relative w-full">
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

// Specialized Lookup for Assignee
interface AssigneeLookupProps {
  label: string;
  users: TeamUser[];
  selectedUserName: string;
  onSelect: (userName: string) => void;
}

const AssigneeLookup: React.FC<AssigneeLookupProps> = ({ label, users, selectedUserName, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    const term = search.toLowerCase();
    return users.filter(u => 
      u.name.toLowerCase().includes(term) || 
      u.role.toLowerCase().includes(term)
    );
  }, [users, search]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch(''); // Reset search on close
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        setHighlightedIndex(0);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => (prev + 1) % filteredUsers.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev - 1 + filteredUsers.length) % filteredUsers.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredUsers[highlightedIndex]) {
          onSelect(filteredUsers[highlightedIndex].name);
          setIsOpen(false);
          setSearch('');
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect('');
    setSearch('');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const selectedUser = users.find(u => u.name === selectedUserName);

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1.5">
        {label}
      </label>
      
      <div 
        className={`relative flex items-center w-full border rounded-lg bg-white dark:bg-gray-700/50 transition-shadow ${
          isOpen ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-gray-300 dark:border-gray-600'
        }`}
        onClick={() => {
          if (!isOpen) {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 0);
          }
        }}
      >
        <div className="pl-3 flex items-center pointer-events-none">
          <UserPlus className="w-4 h-4 text-gray-400" />
        </div>

        {selectedUserName && !isOpen ? (
          <div className="flex-1 flex items-center justify-between py-2.5 px-3">
            <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
              {selectedUserName}
              {selectedUser && <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">({selectedUser.role})</span>}
            </span>
            <button 
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <input
            ref={inputRef}
            type="text"
            className="block w-full px-3 py-2.5 bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white sm:text-sm placeholder-gray-400"
            placeholder="Search team members..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setIsOpen(true);
              setHighlightedIndex(0);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
          />
        )}
      </div>

      {isOpen && (
        <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user, idx) => (
              <button
                key={user.id}
                type="button"
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex flex-col border-b border-gray-50 dark:border-gray-700 last:border-0 ${
                  idx === highlightedIndex 
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-900 dark:text-white' 
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onMouseEnter={() => setHighlightedIndex(idx)}
                onClick={() => {
                  onSelect(user.name);
                  setIsOpen(false);
                  setSearch('');
                }}
              >
                <span className="font-medium">{user.name}</span>
                <span className={`text-xs ${idx === highlightedIndex ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400'}`}>
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

// --- Main Modal Component ---

interface CreateBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead?: Lead | null;
  leadName?: string; // Fallback for simple name passing
  onBookingCreated?: (booking: Booking) => void;
  bookingToEdit?: Booking | null;
  onBookingUpdated?: (booking: Booking) => void;
  initialTab?: 'comments' | 'activity';
}

const CreateBookingModal: React.FC<CreateBookingModalProps> = ({ 
  isOpen, 
  onClose, 
  lead,
  leadName = '', 
  onBookingCreated,
  bookingToEdit,
  onBookingUpdated,
  initialTab = 'comments'
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
    notes: '',
    assignedTo: ''
  });

  // New Payment Fields State
  const [totalAmount, setTotalAmount] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [isAmountOverridden, setIsAmountOverridden] = useState(false);

  // Right Panel State (Edit Mode Only)
  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>(initialTab);
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Comment Composer State
  const [commentText, setCommentText] = useState('');
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  // Metadata State
  const metadata = useMemo(() => {
    if (!bookingToEdit) return null;
    return {
      createdAt: 'Oct 12, 2023 09:30 AM', // Mock
      updatedAt: 'Oct 24, 2023 04:15 PM', // Mock
      updatedBy: 'Alex Walker'
    };
  }, [bookingToEdit]);

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

  // --- Style Helpers for Payment Status ---
  const getPaymentColorClass = (status: PaymentStatus) => {
    switch (status) {
      case 'Paid':
        return 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
      case 'Partially Paid':
        return 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
      case 'Unpaid':
        return 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'Refunded':
        return 'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
      case 'Waiting':
        return 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default:
        return 'text-gray-900 dark:text-white bg-white dark:bg-gray-700/50 border-gray-300 dark:border-gray-600';
    }
  };

  const getPaymentIconColorClass = (status: PaymentStatus) => {
    switch (status) {
      case 'Paid': return 'text-emerald-500 dark:text-emerald-400';
      case 'Partially Paid': return 'text-amber-500 dark:text-amber-400';
      case 'Unpaid': return 'text-red-500 dark:text-red-400';
      case 'Refunded': return 'text-gray-500 dark:text-gray-400';
      case 'Waiting': return 'text-blue-500 dark:text-blue-400';
      default: return 'text-gray-400';
    }
  };

  // --- Effects ---

  // 1. Initialize Form & Load Data
  useEffect(() => {
    setActiveTab(initialTab);
    if (bookingToEdit) {
      setFormData({
        tourName: bookingToEdit.tourName,
        clientName: bookingToEdit.clientName,
        date: formatDateForInput(bookingToEdit.date),
        pax: bookingToEdit.people,
        status: bookingToEdit.status,
        paymentStatus: bookingToEdit.paymentStatus || 'Unpaid',
        pickupLocation: bookingToEdit.pickupLocation || '',
        notes: bookingToEdit.notes || '',
        assignedTo: bookingToEdit.assignedTo || ''
      });

      // Load Payment Details
      setTotalAmount(bookingToEdit.totalAmount ?? 0);
      setAmountPaid(bookingToEdit.amountPaid ?? 0);
      setIsAmountOverridden(bookingToEdit.isAmountOverridden ?? false);

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
      const defaultClientName = lead ? lead.name : (leadName && leadName !== 'New Client' ? leadName : '');
      
      setFormData({
        tourName: '',
        clientName: defaultClientName,
        date: new Date().toISOString().split('T')[0],
        pax: 2,
        status: 'Pending',
        paymentStatus: 'Unpaid',
        pickupLocation: '',
        notes: lead ? `Source: ${lead.channel}. ${lead.notes || ''}` : '',
        assignedTo: lead?.assignedTo || ''
      });
      setTotalAmount(0);
      setAmountPaid(0);
      setIsAmountOverridden(false);
      setActivities([]);
      setComments([]);
    }
  }, [bookingToEdit, isOpen, lead, leadName, initialTab]);

  // 2. Auto-calculate Total Amount based on Tour & Pax
  useEffect(() => {
    if (isAmountOverridden) return;

    const tour = TOURS.find(t => t.name === formData.tourName);
    const price = tour ? tour.price : 0;
    const pax = formData.pax || 0;
    const newTotal = price * pax;

    setTotalAmount(newTotal);
  }, [formData.tourName, formData.pax, isAmountOverridden]);

  // Derived Financials
  const amountDue = formData.paymentStatus === 'Refunded' ? 0 : Math.max(totalAmount - amountPaid, 0);

  // --- Handlers ---

  const handleTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    if (rawValue === '') {
      setTotalAmount(0);
      setIsAmountOverridden(true);
      return;
    }
    const val = parseFloat(rawValue);
    if (!isNaN(val) && val >= 0) {
      setTotalAmount(val);
      setIsAmountOverridden(true);
    }
  };

  const handleResetTotal = () => {
    const tour = TOURS.find(t => t.name === formData.tourName);
    const price = tour ? tour.price : 0;
    const pax = formData.pax || 0;
    setTotalAmount(price * pax);
    setIsAmountOverridden(false);
  };

  const handleAmountPaidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    if (rawValue === '') {
      setAmountPaid(0);
      return;
    }
    const val = parseFloat(rawValue);
    if (!isNaN(val) && val >= 0) {
      setAmountPaid(val);
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCommentText(val);

    // Simple mention detection
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
    if (!commentText.trim() || !bookingToEdit) return;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
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
          notes: bookingToEdit.notes || '',
          assignedTo: bookingToEdit.assignedTo || '',
          totalAmount: bookingToEdit.totalAmount,
          amountPaid: bookingToEdit.amountPaid
        };

        const hasChanged = (a: any, b: any) => String(a) !== String(b);

        if (hasChanged(original.tourName, formData.tourName)) 
          changes.push({ id: `a_${Date.now()}_1`, bookingId: bookingToEdit.id, field: 'Tour', from: original.tourName, to: formData.tourName, actorName: CURRENT_USER_NAME, timestamp: Date.now() });
        if (hasChanged(original.status, formData.status)) 
          changes.push({ id: `a_${Date.now()}_2`, bookingId: bookingToEdit.id, field: 'Status', from: original.status, to: formData.status, actorName: CURRENT_USER_NAME, timestamp: Date.now() });
        if (hasChanged(original.paymentStatus, formData.paymentStatus)) 
          changes.push({ id: `a_${Date.now()}_3`, bookingId: bookingToEdit.id, field: 'Payment Status', from: original.paymentStatus, to: formData.paymentStatus, actorName: CURRENT_USER_NAME, timestamp: Date.now() });
        if (hasChanged(original.date, formData.date)) 
          changes.push({ id: `a_${Date.now()}_4`, bookingId: bookingToEdit.id, field: 'Date', from: original.date, to: formData.date, actorName: CURRENT_USER_NAME, timestamp: Date.now() });
        if (hasChanged(original.pax, formData.pax)) 
          changes.push({ id: `a_${Date.now()}_5`, bookingId: bookingToEdit.id, field: 'Pax', from: original.pax, to: formData.pax, actorName: CURRENT_USER_NAME, timestamp: Date.now() });
        if (hasChanged(original.pickupLocation, formData.pickupLocation)) 
          changes.push({ id: `a_${Date.now()}_6`, bookingId: bookingToEdit.id, field: 'Pickup', from: original.pickupLocation, to: formData.pickupLocation, actorName: CURRENT_USER_NAME, timestamp: Date.now() });
        if (hasChanged(original.assignedTo, formData.assignedTo)) 
          changes.push({ id: `a_${Date.now()}_7`, bookingId: bookingToEdit.id, field: 'Assigned To', from: original.assignedTo || 'Unassigned', to: formData.assignedTo, actorName: CURRENT_USER_NAME, timestamp: Date.now() });
        if (original.totalAmount !== totalAmount)
          changes.push({ id: `a_${Date.now()}_8`, bookingId: bookingToEdit.id, field: 'Total Amount', from: original.totalAmount, to: totalAmount, actorName: CURRENT_USER_NAME, timestamp: Date.now() });
        if (original.amountPaid !== amountPaid)
          changes.push({ id: `a_${Date.now()}_9`, bookingId: bookingToEdit.id, field: 'Amount Paid', from: original.amountPaid, to: amountPaid, actorName: CURRENT_USER_NAME, timestamp: Date.now() });

        if (changes.length > 0) {
          const updatedActivities = [...changes, ...activities];
          setActivities(updatedActivities);
          localStorage.setItem(`booking_activities_${bookingToEdit.id}`, JSON.stringify(updatedActivities));
        }

        const updatedBooking: Booking = {
          ...bookingToEdit,
          tourName: formData.tourName,
          clientName: formData.clientName || 'Unknown Client',
          date: formData.date,
          people: formData.pax,
          status: formData.status,
          paymentStatus: formData.paymentStatus,
          pickupLocation: formData.pickupLocation,
          notes: formData.notes,
          assignedTo: formData.assignedTo,
          totalAmount: totalAmount,
          amountPaid: amountPaid,
          amountDue: amountDue,
          isAmountOverridden: isAmountOverridden
        };
        onBookingUpdated(updatedBooking);

      } else {
        // Create Mode
        const newBookingId = `B${Date.now()}`;
        
        // Initial Activity Log for creation from Lead
        const initialActivities: ActivityLogItem[] = [];
        if (lead) {
           initialActivities.push({
             id: `a_${Date.now()}_init`, 
             bookingId: newBookingId, 
             field: 'Origin', 
             from: 'Lead', 
             to: `Created from Lead: ${lead.name}`, 
             actorName: CURRENT_USER_NAME, 
             timestamp: Date.now() 
           });
           localStorage.setItem(`booking_activities_${newBookingId}`, JSON.stringify(initialActivities));
        }

        const newBooking: Booking = {
          id: newBookingId,
          leadId: lead?.id, // Link the lead ID if available
          tourName: formData.tourName,
          date: formData.date,
          clientName: formData.clientName || 'Unknown Client',
          people: formData.pax,
          status: formData.status,
          paymentStatus: formData.paymentStatus,
          pickupLocation: formData.pickupLocation,
          notes: formData.notes,
          assignedTo: formData.assignedTo,
          totalAmount: totalAmount,
          amountPaid: amountPaid,
          amountDue: amountDue,
          isAmountOverridden: isAmountOverridden
        };

        if (onBookingCreated) {
          onBookingCreated(newBooking);
        }
      }

      setToastMessage('Saved successfully');
      setShowToast(true);
      
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error) {
      setToastMessage('Save failed. Try again.');
      setShowToast(true);
    }
  };

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
        <div className={`relative bg-white dark:bg-gray-800 rounded-2xl w-full border border-gray-100 dark:border-gray-700 shadow-2xl transform transition-all flex flex-col ${bookingToEdit ? 'max-w-[95vw] lg:max-w-[1300px] h-[90vh]' : 'max-w-lg max-h-[90vh]'}`}>
          
          {showToast && <ModalToast message={toastMessage} onClose={() => setShowToast(false)} />}

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
            <div className={`flex-1 flex flex-col min-w-0 ${bookingToEdit ? 'lg:border-r border-gray-100 dark:border-gray-700' : ''}`}>
              <div className="flex-1 overflow-y-auto p-6 lg:p-8">
                <form id="booking-form" onSubmit={handleSubmit} className="space-y-4">
                  {/* Row 1: Client & Tour */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                  </div>

                  {/* Row 2: Date & Pax */}
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

                  {/* Row 3: Status & Payment Status */}
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
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1.5">Payment Status</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                           <CreditCard className={`w-4 h-4 ${getPaymentIconColorClass(formData.paymentStatus)}`} />
                        </div>
                        <select
                          className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm appearance-none font-medium transition-colors ${getPaymentColorClass(formData.paymentStatus)}`}
                          value={formData.paymentStatus}
                          onChange={e => setFormData({...formData, paymentStatus: e.target.value as PaymentStatus})}
                        >
                          <option value="Unpaid">Unpaid</option>
                          <option value="Waiting">Waiting</option>
                          <option value="Partially Paid">Partially Paid</option>
                          <option value="Paid">Paid</option>
                          <option value="Refunded">Refunded</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Payment Details Card */}
                  <div className="p-4 bg-gray-50/50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payment Details</h4>
                      {amountPaid > totalAmount && (
                        <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                          <AlertCircle className="w-3 h-3" />
                          <span>Paid exceeds total</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* Total Amount */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                            Total
                          </label>
                          {isAmountOverridden && (
                            <button 
                              type="button" 
                              onClick={handleResetTotal}
                              className="text-[10px] flex items-center gap-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                            >
                              <RotateCcw className="w-3 h-3" /> Reset
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 dark:text-gray-400 text-sm font-semibold">
                             $
                          </div>
                          <input 
                            type="number" 
                            min="0"
                            step="0.01"
                            className={`block w-full pl-8 pr-3 py-2.5 border rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                              isAmountOverridden 
                                ? 'border-indigo-300 dark:border-indigo-500/50 bg-indigo-50/20 dark:bg-indigo-900/10' 
                                : 'border-gray-300 dark:border-gray-600'
                            }`}
                            value={totalAmount === 0 ? '' : totalAmount}
                            onChange={handleTotalChange}
                          />
                          {isAmountOverridden && (
                            <span className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 px-1.5 py-0.5 rounded">Manual</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Amount Paid */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1.5">
                          Paid
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 dark:text-gray-400 text-sm font-semibold">
                             $
                          </div>
                          <input 
                            type="number" 
                            min="0"
                            step="0.01"
                            className="block w-full pl-8 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={amountPaid === 0 ? '' : amountPaid}
                            onChange={handleAmountPaidChange}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Amount Due & Hints */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-2.5 rounded-lg border border-gray-200 dark:border-gray-600">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Amount Due</span>
                        <span className={`text-base font-bold ${amountDue > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                          ${amountDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      
                      {/* Hint Logic */}
                      {formData.paymentStatus === 'Paid' && amountPaid < totalAmount && (
                        <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                          <span>"Paid" usually means Amount Paid equals Total.</span>
                          <button 
                            type="button"
                            onClick={() => setAmountPaid(totalAmount)}
                            className="text-amber-700 dark:text-amber-300 font-bold hover:underline"
                          >
                            Set to Total
                          </button>
                        </div>
                      )}
                      {amountPaid > 0 && amountDue === 0 && formData.paymentStatus !== 'Paid' && formData.paymentStatus !== 'Refunded' && (
                        <div className="flex items-center text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
                          <Info className="w-3 h-3 mr-1.5" />
                          <span>Amount fully paid. Consider changing status to <b>Paid</b>.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 4: Assigned To & Pickup */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <AssigneeLookup 
                      label="Assigned To"
                      users={TEAM_USERS}
                      selectedUserName={formData.assignedTo}
                      onSelect={(name) => setFormData({ ...formData, assignedTo: name })}
                    />

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
                
                {/* Metadata Footer (Inline for left col) */}
                {bookingToEdit && metadata && (
                  <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500 grid grid-cols-2 gap-y-1">
                    <div>
                      <span className="block text-gray-300 dark:text-gray-600 uppercase text-[10px] tracking-wider mb-0.5">Created</span>
                      {metadata.createdAt}
                    </div>
                    <div>
                      <span className="block text-gray-300 dark:text-gray-600 uppercase text-[10px] tracking-wider mb-0.5">Last Modified</span>
                      {metadata.updatedAt} by {metadata.updatedBy}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: TABS (Only visible when editing) */}
            {bookingToEdit && (
              <div className="flex-none w-full lg:w-[400px] flex flex-col bg-gray-50/50 dark:bg-gray-900/30 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700">
                {/* Tab Headers */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 sticky top-0 z-10">
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
                  {/* ... same content as before ... */}
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
          <div className="flex-none px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-end gap-3 rounded-b-2xl sticky bottom-0 z-20">
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
