import React, { useState, useEffect, useRef } from 'react';
import { 
  Mail, 
  User, 
  Users,
  Calendar, 
  Clock, 
  Send, 
  Search, 
  Phone, 
  MoreVertical, 
  Paperclip, 
  ArrowLeft, 
  CheckCheck, 
  X, 
  Tag, 
  MapPin, 
  CalendarPlus, 
  Sparkles, 
  MessageCircle, 
  Pencil, 
  ChevronDown, 
  Shield, 
  Plus, 
  Globe, 
  DollarSign, 
  Bell, 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Map as MapIcon, 
  ToggleLeft, 
  ToggleRight,
  Image as ImageIcon,
  Upload,
  Trash2,
  Save,
  LayoutGrid,
  List,
  MoreHorizontal,
  AlignLeft,
  Copy,
  Archive,
  Star,
  Activity,
  Check,
  ChevronRight,
  Building,
  Settings,
  Lock,
  Filter
} from 'lucide-react';
import { RECENT_LEADS, UPCOMING_BOOKINGS, TOURS } from '../constants';
import CreateBookingModal from './CreateBookingModal';
import AddLeadModal from './AddLeadModal';
import { Booking, BookingStatus, LeadStatus, Lead } from '../types';
import { useI18n } from '../context/ThemeContext';

// --- Inbox Page ---
const INBOX_THREADS = [
  { 
    id: 1, 
    sender: 'Sarah Jenkins', 
    avatar: 'S', 
    color: 'bg-emerald-100 text-emerald-700',
    preview: 'Is the Sunset tour available this Friday?', 
    time: '10m ago', 
    unread: true,
    channel: 'Website',
    status: 'New',
    messages: [
      { id: 'm1', text: 'Hi there, I was looking at your website.', sender: 'client', time: '10:20 AM' },
      { id: 'm2', text: 'Is the Sunset tour available this Friday?', sender: 'client', time: '10:22 AM' }
    ]
  },
  { 
    id: 2, 
    sender: 'Marco Rossi', 
    avatar: 'M', 
    color: 'bg-blue-100 text-blue-700',
    preview: 'Thanks for the confirmation!', 
    time: '1h ago', 
    unread: false,
    channel: 'WhatsApp',
    status: 'Contacted',
    messages: [
      { id: 'm1', text: 'Hello Marco, just confirming your spot for the Historical Walk.', sender: 'me', time: 'Yesterday 4:00 PM' },
      { id: 'm2', text: 'Great, thank you!', sender: 'client', time: 'Yesterday 4:05 PM' },
      { id: 'm3', text: 'Can I bring my dog?', sender: 'client', time: '9:00 AM' },
      { id: 'm4', text: 'Yes, leashed dogs are welcome.', sender: 'me', time: '9:15 AM' },
      { id: 'm5', text: 'Thanks for the confirmation!', sender: 'client', time: '9:30 AM' }
    ]
  },
  { 
    id: 3, 
    sender: 'Booking.com', 
    avatar: 'B', 
    color: 'bg-purple-100 text-purple-700',
    preview: 'New reservation request #4829', 
    time: '3h ago', 
    unread: true,
    channel: 'Email',
    status: 'Qualified',
    messages: [
      { id: 'm1', text: 'New reservation request #4829 has been received.', sender: 'client', time: '1:00 PM' },
      { id: 'm2', text: 'Client: Emily Chen. Tour: Food & Wine Tasting.', sender: 'client', time: '1:00 PM' }
    ]
  },
  {
    id: 4,
    sender: 'David Smith',
    avatar: 'D',
    color: 'bg-orange-100 text-orange-700',
    preview: 'Can we change the date?',
    time: '5h ago',
    unread: false,
    channel: 'Referral',
    status: 'New',
    messages: [
      { id: 'm1', text: 'Hi, I booked for next Tuesday.', sender: 'client', time: '8:00 AM' },
      { id: 'm2', text: 'Something came up. Can we change the date to Wednesday?', sender: 'client', time: '8:05 AM' }
    ]
  }
];

const AI_SUGGESTIONS = [
  "Sure, we have availability.",
  "What dates work best for you?",
  "Can you share group size?"
];

interface InboxPageProps {
  onAddBooking?: (booking: Booking) => void;
  showToast?: (message: string) => void;
  searchTerm?: string;
  initialLeadName?: string | null;
}

export const InboxPage: React.FC<InboxPageProps> = ({ 
  onAddBooking, 
  showToast, 
  searchTerm = '', 
  initialLeadName 
}) => {
  const { t } = useI18n();
  // Lift threads to state to allow updates (e.g. sending messages)
  const [threads, setThreads] = useState(INBOX_THREADS);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [inputText, setInputText] = useState('');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  
  // File input ref for attachment
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync global search term to local state if needed
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  const filteredThreads = threads.filter(thread => 
    thread.sender.toLowerCase().includes(localSearchTerm.toLowerCase()) || 
    thread.preview.toLowerCase().includes(localSearchTerm.toLowerCase())
  );

  useEffect(() => {
    if (initialLeadName) {
      const thread = threads.find(t => t.sender.toLowerCase() === initialLeadName.toLowerCase());
      if (thread) {
        setSelectedConversationId(thread.id);
      }
    }
  }, [initialLeadName, threads]);

  const selectedThread = threads.find(t => t.id === selectedConversationId);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConversationId) return;
    
    const newMessage = { 
      id: `m${Date.now()}`, 
      text: inputText, 
      sender: 'me', 
      time: 'Just now' 
    };

    setThreads(prevThreads => prevThreads.map(thread => {
      if (thread.id === selectedConversationId) {
        return {
          ...thread,
          messages: [...thread.messages, newMessage]
        };
      }
      return thread;
    }));

    setInputText('');
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedConversationId) {
       const newMessage = { 
         id: `m${Date.now()}`, 
         text: `📎 Attachment: ${file.name}`, 
         sender: 'me', 
         time: 'Just now' 
       };

       setThreads(prevThreads => prevThreads.map(thread => {
         if (thread.id === selectedConversationId) {
           return {
             ...thread,
             messages: [...thread.messages, newMessage]
           };
         }
         return thread;
       }));
       
       if (showToast) showToast(`File "${file.name}" attached successfully`);
    }
    // Reset the input so the same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleBookingCreated = (booking: Booking) => {
    if (onAddBooking) onAddBooking(booking);
    if (showToast) showToast('Booking created successfully (mock)');
    setIsBookingModalOpen(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-7xl mx-auto md:px-6 md:py-6 overflow-hidden w-full">
      <div className="flex-1 bg-white dark:bg-gray-800 md:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex overflow-hidden">
        <div className={`${selectedConversationId ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 flex-col border-r border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 z-0`}>
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{t('page_inbox_title')}</h2>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search messages..." 
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredThreads.map((thread) => (
              <div 
                key={thread.id} 
                onClick={() => setSelectedConversationId(thread.id)}
                className={`p-4 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${selectedConversationId === thread.id ? 'bg-indigo-50 dark:bg-indigo-900/10' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${thread.color}`}>
                      {thread.avatar}
                    </div>
                    <div className="min-w-0">
                      <h4 className={`text-sm font-semibold truncate ${thread.unread ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                        {thread.sender}
                      </h4>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                         {thread.channel} • <span className={`w-1.5 h-1.5 rounded-full ${thread.unread ? 'bg-indigo-500' : 'bg-transparent'}`}></span>
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap ml-2">{thread.time}</span>
                </div>
                <p className={`text-sm mt-2 line-clamp-1 ${thread.unread ? 'text-gray-800 dark:text-gray-200 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                  {thread.preview}
                </p>
              </div>
            ))}
            {filteredThreads.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">No messages found matching "{localSearchTerm}".</div>
            )}
          </div>
        </div>

        {selectedThread ? (
          <div className={`${!selectedConversationId ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-gray-50/30 dark:bg-gray-900/30`}>
            <div className="h-16 px-6 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedConversationId(null)}
                  className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${selectedThread.color}`}>
                  {selectedThread.avatar}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">{selectedThread.sender}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="capitalize">{selectedThread.channel}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300 font-medium">
                      {selectedThread.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsBookingModalOpen(true)}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors mr-2"
                >
                  <CalendarPlus className="w-4 h-4" />
                  Create Booking
                </button>
                <button 
                  onClick={() => setIsBookingModalOpen(true)}
                  className="sm:hidden p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <CalendarPlus className="w-5 h-5" />
                </button>
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {selectedThread.messages.map((msg, idx) => {
                const isMe = msg.sender === 'me';
                return (
                  <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex flex-col max-w-[80%] md:max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm ${
                        isMe 
                          ? 'bg-indigo-600 text-white rounded-br-none' 
                          : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-600 rounded-bl-none'
                      }`}>
                        {msg.text}
                      </div>
                      <div className="flex items-center gap-1 mt-1 px-1">
                        <span className="text-[10px] text-gray-400">{msg.time}</span>
                        {isMe && <CheckCheck className="w-3 h-3 text-indigo-400" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
              <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide no-scrollbar">
                <div className="flex items-center gap-2 pr-2 border-r border-gray-200 dark:border-gray-700 mr-2 shrink-0">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">AI Assist</span>
                </div>
                {AI_SUGGESTIONS.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setInputText(suggestion)}
                    className="whitespace-nowrap px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-medium border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                {/* Hidden File Input */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileChange} 
                />
                <button 
                  type="button" 
                  onClick={handleAttachClick}
                  className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <div className="flex-1 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl flex items-center px-4 py-2 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    placeholder="Type your message..."
                    className="w-full bg-transparent border-none focus:ring-0 text-sm resize-none max-h-32 text-gray-900 dark:text-white placeholder-gray-400"
                    rows={1}
                  />
                </div>
                <button 
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-gray-50/50 dark:bg-gray-900/50 text-center p-8">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Select a conversation</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-xs">
              Choose a thread from the left to view details and reply to leads.
            </p>
          </div>
        )}
      </div>

      <CreateBookingModal 
        isOpen={isBookingModalOpen} 
        onClose={() => setIsBookingModalOpen(false)} 
        leadName={selectedThread?.sender}
        onBookingCreated={handleBookingCreated}
      />
    </div>
  );
};

// --- Leads Page ---
interface LeadsPageProps {
  searchTerm?: string;
  onOpenConversation?: (leadName: string) => void;
}

export const LeadsPage: React.FC<LeadsPageProps> = ({ searchTerm = '', onOpenConversation }) => {
  const { t } = useI18n();
  const [leads, setLeads] = useState<Lead[]>(RECENT_LEADS);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  
  const KANBAN_COLUMNS: { id: LeadStatus; label: string; color: string }[] = [
    { id: 'New', label: t('leads_status_new'), color: 'bg-blue-500' },
    { id: 'Contacted', label: t('leads_status_contacted'), color: 'bg-amber-500' },
    { id: 'Qualified', label: t('leads_status_qualified'), color: 'bg-emerald-500' },
    { id: 'Booked', label: t('leads_status_booked'), color: 'bg-purple-500' },
    { id: 'Lost', label: t('leads_status_lost'), color: 'bg-gray-500' },
  ];

  const filteredLeads = leads.filter(lead => 
    lead.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const activeLead = leads.find(l => l.id === selectedLeadId);

  const handleUpdateLead = (updatedLead: Lead) => {
    setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
    setSelectedLeadId(null);
  };
  
  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    if (draggedLeadId) {
      setLeads(prev => prev.map(l => 
        l.id === draggedLeadId ? { ...l, status } : l
      ));
      setDraggedLeadId(null);
    }
  };

  return (
    <div className="relative h-full flex flex-col">
      {/* Lead Details Drawer */}
      {selectedLeadId && activeLead && (
        <>
            <div 
               className="fixed inset-0 z-[60] bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300"
               onClick={() => setSelectedLeadId(null)}
            />
            <div 
               className="fixed inset-y-0 right-0 z-[70] w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-gray-200 dark:border-gray-700"
            >
               <LeadDetailPane 
                  lead={activeLead} 
                  onClose={() => setSelectedLeadId(null)} 
                  onSave={handleUpdateLead}
                  onOpenChat={() => onOpenConversation && onOpenConversation(activeLead.name)}
               />
            </div>
        </>
      )}

      {/* Header Section */}
      <div className="flex-none p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('page_leads_title')}</h2>
          
          <div className="flex items-center gap-3">
            {/* View Switcher */}
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-md flex items-center gap-2 text-sm font-medium transition-all ${
                  viewMode === 'table' 
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-2 rounded-md flex items-center gap-2 text-sm font-medium transition-all ${
                  viewMode === 'kanban' 
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Kanban</span>
              </button>
            </div>

            <button 
              onClick={() => setIsAddLeadModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm whitespace-nowrap"
            >
              Add Lead
            </button>
          </div>
        </div>
      </div>
      
      {/* Content Section */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        {viewMode === 'table' ? (
          <div className="h-full overflow-y-auto px-6 lg:px-8 pb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-medium">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Channel</th>
                  <th className="px-6 py-3">Last Active</th>
                </tr>
              </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredLeads.map((lead) => (
                    <tr 
                      key={lead.id} 
                      onClick={() => setSelectedLeadId(lead.id)}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors ${selectedLeadId === lead.id ? 'bg-indigo-50 dark:bg-indigo-900/10' : ''}`}
                    >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{lead.name}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            lead.status === 'New' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                            lead.status === 'Contacted' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' :
                            lead.status === 'Qualified' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' :
                            lead.status === 'Booked' ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400' :
                            'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{lead.channel}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{lead.lastMessageTime}</td>
                    </tr>
                  ))}
                  {filteredLeads.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500 text-sm">
                          No leads found matching "{searchTerm}".
                        </td>
                      </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Kanban View Container */
          <div className="absolute inset-0 w-full h-full">
            <div className="h-full w-full overflow-x-auto overflow-y-hidden px-6 lg:px-8 pb-6">
              <div className="inline-flex min-w-full min-h-full rounded-2xl bg-white/95 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex flex-1 h-full gap-6 items-start p-4">
                  {KANBAN_COLUMNS.map((col) => {
                    const colLeads = filteredLeads.filter(l => l.status === col.id);
                    return (
                      <div 
                        key={col.id} 
                        className="flex-shrink-0 w-72 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900/40 rounded-2xl p-4 border border-gray-300 dark:border-gray-700 shadow-sm flex flex-col h-full max-h-full"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, col.id)}
                      >
                        <div className="flex items-center justify-between mb-3 px-1 pb-2 border-b border-dashed border-gray-300 dark:border-gray-700">
                          <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${col.color}`}></div>
                            <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm">{col.label}</span>
                            <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                              {colLeads.length}
                            </span>
                          </div>
                          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto space-y-3 min-h-[50px] pr-1">
                          {colLeads.map((lead) => (
                            <div
                              key={lead.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, lead.id)}
                              onClick={() => setSelectedLeadId(lead.id)}
                              className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500 transition-all group active:scale-95"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{lead.name}</h4>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                  <Tag className="w-3 h-3" />
                                  <span>{lead.channel}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                  <Clock className="w-3 h-3" />
                                  <span>{lead.lastMessageTime}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                          {colLeads.length === 0 && (
                            <div className="h-24 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center bg-gray-50/70 dark:bg-transparent text-gray-400 text-xs">
                              <span>Drag items here</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <AddLeadModal 
        isOpen={isAddLeadModalOpen} 
        onClose={() => setIsAddLeadModalOpen(false)} 
      />
    </div>
  );
};

// Helper Component for Lead Details
const LeadDetailPane = ({ lead, onClose, onSave, onOpenChat }: { lead: Lead, onClose: () => void, onSave: (l: Lead) => void, onOpenChat: () => void }) => {
   // Extended mock state for the edit form since Lead type is limited
   const [formData, setFormData] = useState({
      ...lead,
      email: 'contact@example.com',
      phone: '+1 (555) 123-4567',
      notes: '',
      value: 1250,
      company: 'Private Group'
   });

   // Generate deterministic mock data based on ID if empty
   useEffect(() => {
     setFormData({
       ...lead,
       email: `${lead.name.toLowerCase().replace(' ', '.')}@example.com`,
       phone: '+1 (555) ' + Math.floor(100 + Math.random() * 900) + '-' + Math.floor(1000 + Math.random() * 9000),
       notes: formData.notes || 'Looking for a private tour for family.',
       value: formData.value || Math.floor(Math.random() * 5000) + 500,
       company: formData.company || 'Private Client'
     });
   }, [lead.id]);

   return (
      <div className="h-full flex flex-col bg-white dark:bg-gray-800 shadow-2xl">
         {/* Header */}
         <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm z-10">
            <div>
               <h2 className="text-lg font-bold text-gray-900 dark:text-white">Lead Details</h2>
               <p className="text-xs text-gray-500 dark:text-gray-400">ID: {lead.id}</p>
            </div>
            <button 
               onClick={onClose}
               className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
               <X className="w-5 h-5" />
            </button>
         </div>

         {/* Content */}
         <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Hero Profile */}
            <div className="flex flex-col items-center text-center">
               <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center text-2xl font-bold mb-3">
                  {formData.name.charAt(0)}
               </div>
               <h3 className="text-xl font-bold text-gray-900 dark:text-white">{formData.name}</h3>
               <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{formData.company}</p>
               
               <div className="flex gap-2 w-full">
                  <button 
                     onClick={onOpenChat}
                     className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-medium transition-colors shadow-sm"
                  >
                     <MessageCircle className="w-4 h-4" /> Message
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-white py-2.5 rounded-xl font-medium transition-colors">
                     <Phone className="w-4 h-4" /> Call
                  </button>
               </div>
            </div>

            {/* Status & Value */}
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Status</label>
                  <select 
                     value={formData.status}
                     onChange={(e) => setFormData({...formData, status: e.target.value as LeadStatus})}
                     className="w-full bg-transparent font-semibold text-gray-900 dark:text-white outline-none"
                  >
                     <option>New</option>
                     <option>Contacted</option>
                     <option>Qualified</option>
                     <option>Booked</option>
                     <option>Lost</option>
                  </select>
               </div>
               <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Deal Value</label>
                  <div className="flex items-center">
                     <span className="text-gray-400 mr-1">$</span>
                     <input 
                        type="number"
                        value={formData.value}
                        onChange={(e) => setFormData({...formData, value: Number(e.target.value)})}
                        className="w-full bg-transparent font-semibold text-gray-900 dark:text-white outline-none"
                     />
                  </div>
               </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
               <h4 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">Contact Information</h4>
               <div className="space-y-3">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                        <Mail className="w-4 h-4" />
                     </div>
                     <input 
                        value={formData.email} 
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white border-b border-transparent hover:border-gray-200 focus:border-indigo-500 outline-none transition-colors py-1"
                     />
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                        <Phone className="w-4 h-4" />
                     </div>
                     <input 
                        value={formData.phone} 
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white border-b border-transparent hover:border-gray-200 focus:border-indigo-500 outline-none transition-colors py-1"
                     />
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                        <Building className="w-4 h-4" />
                     </div>
                     <input 
                        value={formData.company} 
                        onChange={(e) => setFormData({...formData, company: e.target.value})}
                        className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white border-b border-transparent hover:border-gray-200 focus:border-indigo-500 outline-none transition-colors py-1"
                     />
                  </div>
               </div>
            </div>

            {/* Notes */}
            <div className="space-y-3">
               <h4 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">Notes</h4>
               <textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={4}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none transition-all"
                  placeholder="Add private notes about this lead..."
               />
            </div>
         </div>

         {/* Footer */}
         <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm flex gap-3">
            <button 
               onClick={() => {
                  onSave({...formData, id: lead.id, channel: lead.channel, name: formData.name, status: formData.status as LeadStatus, lastMessageTime: lead.lastMessageTime});
               }}
               className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
            >
               <Save className="w-4 h-4" />
               Save Details
            </button>
         </div>
      </div>
   );
};

// --- Bookings Page ---
interface BookingsPageProps {
  bookings: Booking[];
  searchTerm?: string;
  onUpdateBooking?: (booking: Booking) => void;
}

export const BookingsPage: React.FC<BookingsPageProps> = ({ 
  bookings, 
  searchTerm = '', 
  onUpdateBooking 
}) => {
  const { t } = useI18n();
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [tourFilter, setTourFilter] = useState('All');

  // Get unique tour names for the filter dropdown
  const uniqueTours = Array.from(new Set(bookings.map(b => b.tourName))).sort();

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.tourName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
    const matchesTour = tourFilter === 'All' || b.tourName === tourFilter;
    
    return matchesSearch && matchesStatus && matchesTour;
  });

  return (
    <div className="p-6 lg:p-8 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('page_bookings_title')}</h2>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
             Export
          </button>
          <button 
             className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
             onClick={() => setEditingBooking({
                id: '', // Will be generated
                tourName: '',
                date: new Date().toISOString().split('T')[0],
                clientName: 'New Client',
                people: 2,
                status: 'Confirmed'
             } as Booking)}
          >
             Add Booking
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mr-2">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filter by:</span>
        </div>
        
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none"
        >
          <option value="All">All Status</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Pending">Pending</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Completed">Completed</option>
        </select>

        <select 
          value={tourFilter}
          onChange={(e) => setTourFilter(e.target.value)}
          className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none max-w-[200px]"
        >
          <option value="All">All Tours</option>
          {uniqueTours.map(tour => (
            <option key={tour} value={tour}>{tour}</option>
          ))}
        </select>
        
        {(statusFilter !== 'All' || tourFilter !== 'All') && (
           <button 
             onClick={() => { setStatusFilter('All'); setTourFilter('All'); }}
             className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 ml-auto font-medium"
           >
             Clear Filters
           </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex-1 overflow-y-auto">
        <table className="w-full text-left">
           <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-medium">
             <tr>
               <th className="px-6 py-4">Tour Info</th>
               <th className="px-6 py-4">Client</th>
               <th className="px-6 py-4">Status</th>
               <th className="px-6 py-4">Date</th>
               <th className="px-6 py-4 text-right">Actions</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
             {filteredBookings.map(booking => (
               <tr 
                 key={booking.id} 
                 onClick={() => setEditingBooking(booking)}
                 className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group"
               >
                 <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">{booking.tourName}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                       <Users className="w-3 h-3" /> {booking.people} Guests
                    </div>
                 </td>
                 <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {booking.clientName}
                 </td>
                 <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      booking.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30' :
                      booking.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30' :
                      booking.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30' :
                      'bg-gray-50 text-gray-700 border-gray-100 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                      {booking.status}
                    </span>
                 </td>
                 <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {booking.date}
                 </td>
                 <td className="px-6 py-4 text-right">
                    <button className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                       <Pencil className="w-4 h-4" />
                    </button>
                 </td>
               </tr>
             ))}
             {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 text-sm">
                    No bookings found.
                  </td>
                </tr>
             )}
           </tbody>
        </table>
      </div>

      {editingBooking && (
        <CreateBookingModal 
          isOpen={true} 
          onClose={() => setEditingBooking(null)} 
          bookingToEdit={editingBooking.id ? editingBooking : null} // Check ID to determine if editing or creating
          leadName={!editingBooking.id ? editingBooking.clientName : undefined}
          onBookingCreated={(b) => {
             // In a real app, this would append to list.
             // Since props are read-only here or handled by parent, we just close.
             if (onUpdateBooking) onUpdateBooking(b); // Reuse update for create in this mock
             setEditingBooking(null);
          }}
          onBookingUpdated={(b) => {
            if (onUpdateBooking) onUpdateBooking(b);
            setEditingBooking(null);
          }}
        />
      )}
    </div>
  );
};

// --- Team Page ---
const TEAM_MEMBERS = [
  { id: 1, name: 'Alex Walker', role: 'Owner & Guide', status: 'Active', email: 'alex@wanderlust.com' },
  { id: 2, name: 'Sarah Miller', role: 'Tour Guide', status: 'On Tour', email: 'sarah@wanderlust.com' },
  { id: 3, name: 'Mike Johnson', role: 'Driver', status: 'Active', email: 'mike@wanderlust.com' },
  { id: 4, name: 'Emily Davis', role: 'Admin Support', status: 'Away', email: 'emily@wanderlust.com' },
];

export const TeamPage = () => {
  const { t } = useI18n();
  return (
    <div className="p-6 lg:p-8">
      <div className="flex justify-between items-center mb-8">
         <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('page_team_title')}</h2>
         <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">Invite Member</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {TEAM_MEMBERS.map(member => (
            <div key={member.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col items-center text-center">
               <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full mb-4 flex items-center justify-center text-xl font-bold text-gray-400">
                  {member.name.charAt(0)}
               </div>
               <h3 className="font-bold text-lg text-gray-900 dark:text-white">{member.name}</h3>
               <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{member.role}</p>
               
               <div className="w-full pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                     member.status === 'Active' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                     member.status === 'On Tour' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                     'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                     {member.status}
                  </span>
                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                     <MoreHorizontal className="w-5 h-5" />
                  </button>
               </div>
            </div>
         ))}
      </div>
    </div>
  );
};

// --- Settings Page ---
export const SettingsPage = () => {
   const [settings, setSettings] = useState({
      orgName: 'Wanderlust Tours',
      contactEmail: 'alex@wanderlust.com',
      timezone: 'UTC-5 (EST)',
      currency: 'USD ($)',
      emailLeads: true,
      emailBookings: true,
      whatsappAlerts: false
   });
   const [isLoading, setIsLoading] = useState(false);
   const { language, setLanguage, t } = useI18n();

   const handleSave = () => {
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 1000);
   };

   return (
      <div className="relative flex flex-col h-full bg-gray-50 dark:bg-gray-900 overflow-hidden">
         <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-6 lg:p-8 space-y-8 pb-24">
               {/* Header */}
               <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('page_settings_title')}</h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your organization preferences and configurations.</p>
               </div>
               
               {/* Workspace Settings */}
               <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                           <Building className="w-5 h-5" />
                        </div>
                        <div>
                           <h3 className="text-lg font-bold text-gray-900 dark:text-white">Workspace Settings</h3>
                           <p className="text-sm text-gray-500 dark:text-gray-400">General information about your company.</p>
                        </div>
                     </div>
                  </div>
                  
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Organization Name</label>
                        <input 
                           type="text" 
                           value={settings.orgName}
                           onChange={(e) => setSettings({...settings, orgName: e.target.value})}
                           className="w-full p-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none" 
                        />
                        <p className="mt-1.5 text-xs text-gray-500">Shown on customer invoices and emails.</p>
                     </div>
                     <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Contact Email</label>
                        <input 
                           type="email" 
                           value={settings.contactEmail}
                           onChange={(e) => setSettings({...settings, contactEmail: e.target.value})}
                           className="w-full p-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none" 
                        />
                        <p className="mt-1.5 text-xs text-gray-500">Primary contact for system notifications.</p>
                     </div>
                     <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Default Timezone</label>
                        <div className="relative">
                           <Globe className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                           <select 
                              value={settings.timezone}
                              onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none appearance-none"
                           >
                              <option>UTC-8 (PST)</option>
                              <option>UTC-5 (EST)</option>
                              <option>UTC+0 (GMT)</option>
                              <option>UTC+1 (CET)</option>
                           </select>
                        </div>
                     </div>
                     <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Default Currency</label>
                        <div className="relative">
                           <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                           <select 
                              value={settings.currency}
                              onChange={(e) => setSettings({...settings, currency: e.target.value})}
                              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none appearance-none"
                           >
                              <option>USD ($)</option>
                              <option>EUR (€)</option>
                              <option>GBP (£)</option>
                           </select>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Language & Region */}
               <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                   <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                       <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                             <Globe className="w-5 h-5" />
                          </div>
                          <div>
                             <h3 className="text-lg font-bold text-gray-900 dark:text-white">Language & Region</h3>
                             <p className="text-sm text-gray-500 dark:text-gray-400">Manage your language preferences.</p>
                          </div>
                       </div>
                    </div>
                    <div className="p-6">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Interface Language</label>
                        <div className="flex gap-3">
                            <button 
                              onClick={() => setLanguage('en')}
                              className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${language === 'en' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300 ring-1 ring-indigo-500/20' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                            >
                                <span className="text-lg">🇺🇸</span>
                                <span className="font-medium">English</span>
                                {language === 'en' && <Check className="w-4 h-4 ml-1" />}
                            </button>
                            <button 
                              onClick={() => setLanguage('ru')}
                              className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${language === 'ru' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300 ring-1 ring-indigo-500/20' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                            >
                                <span className="text-lg">🇷🇺</span>
                                <span className="font-medium">Русский</span>
                                {language === 'ru' && <Check className="w-4 h-4 ml-1" />}
                            </button>
                        </div>
                    </div>
               </div>

               {/* Branding */}
               <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-50 dark:bg-pink-900/20 rounded-lg text-pink-600 dark:text-pink-400">
                           <ImageIcon className="w-5 h-5" />
                        </div>
                        <div>
                           <h3 className="text-lg font-bold text-gray-900 dark:text-white">Branding</h3>
                           <p className="text-sm text-gray-500 dark:text-gray-400">Customize the look and feel of your client communications.</p>
                        </div>
                     </div>
                  </div>
                  
                  <div className="p-6 flex flex-col md:flex-row gap-8 items-start">
                     <div className="flex-1 w-full">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Company Logo</label>
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group">
                           <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center text-indigo-500 mb-3 group-hover:scale-110 transition-transform">
                              <Upload className="w-5 h-5" />
                           </div>
                           <p className="text-sm font-medium text-gray-900 dark:text-white">Click to upload logo</p>
                           <p className="text-xs text-gray-500 mt-1">SVG, PNG, or JPG (max 2MB)</p>
                        </div>
                     </div>
                     <div className="flex-1 w-full">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Primary Color</label>
                        <div className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-900/50">
                           <div className="w-12 h-12 rounded-full bg-indigo-600 shadow-sm ring-4 ring-white dark:ring-gray-800"></div>
                           <div>
                              <p className="font-mono text-sm font-medium text-gray-900 dark:text-white">#4F46E5</p>
                              <p className="text-xs text-gray-500 mt-0.5">Used for buttons and highlights.</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Notifications */}
               <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600 dark:text-amber-400">
                           <Bell className="w-5 h-5" />
                        </div>
                        <div>
                           <h3 className="text-lg font-bold text-gray-900 dark:text-white">Notifications</h3>
                           <p className="text-sm text-gray-500 dark:text-gray-400">Control when and how you receive alerts.</p>
                        </div>
                     </div>
                  </div>
                  
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                     <div className="p-4 sm:p-6 flex items-center justify-between">
                        <div>
                           <p className="text-sm font-semibold text-gray-900 dark:text-white">New Lead Alerts</p>
                           <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Receive an email when a new lead is created.</p>
                        </div>
                        <button 
                           onClick={() => setSettings({...settings, emailLeads: !settings.emailLeads})}
                           className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${settings.emailLeads ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                        >
                           <span className={`translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.emailLeads ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                     </div>

                     <div className="p-4 sm:p-6 flex items-center justify-between">
                        <div>
                           <p className="text-sm font-semibold text-gray-900 dark:text-white">Booking Confirmations</p>
                           <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Receive an email when a booking is confirmed.</p>
                        </div>
                        <button 
                           onClick={() => setSettings({...settings, emailBookings: !settings.emailBookings})}
                           className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${settings.emailBookings ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                        >
                           <span className={`translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.emailBookings ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                     </div>

                     <div className="p-4 sm:p-6 flex items-center justify-between opacity-60">
                        <div>
                           <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">WhatsApp Alerts</p>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600">SOON</span>
                           </div>
                           <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Get instant notifications via WhatsApp Business.</p>
                        </div>
                        <button 
                           disabled
                           className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                        >
                           <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white dark:bg-gray-500 transition-transform" />
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         </div>
         
         {/* Sticky Footer */}
         <div className="sticky bottom-0 z-10 p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 flex justify-end">
             <button 
               onClick={handleSave}
               className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all shadow-sm active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
               disabled={isLoading}
            >
               {isLoading ? (
                  <>
                     <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                     Saving...
                  </>
               ) : (
                  <>
                     <Save className="w-4 h-4" />
                     Save Changes
                  </>
               )}
            </button>
         </div>
      </div>
   );
};

// Helper Component for Tour Editing Form
const TourEditForm = ({ tour, onSave }: { tour: typeof TOURS[0], onSave: (t: typeof TOURS[0]) => void }) => {
   const [formData, setFormData] = useState(tour);
   const [newTag, setNewTag] = useState('');

   useEffect(() => {
      setFormData(tour);
   }, [tour]);

   const addTag = () => {
      if (newTag && !formData.tags?.includes(newTag)) {
         setFormData({ ...formData, tags: [...(formData.tags || []), newTag] });
         setNewTag('');
      }
   };

   const removeTag = (tagToRemove: string) => {
      setFormData({ ...formData, tags: formData.tags?.filter(t => t !== tagToRemove) });
   };

   return (
      <>
         <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Hero Section */}
            <div className="space-y-4">
               <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                     <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tour Name</label>
                     <input 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="text-2xl font-bold text-gray-900 dark:text-white bg-transparent border-b border-transparent hover:border-gray-200 focus:border-indigo-500 focus:outline-none transition-all w-full pb-1"
                        placeholder="Tour Name"
                     />
                  </div>
                  <button 
                     onClick={() => setFormData({...formData, active: !formData.active})}
                     className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${formData.active ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                  >
                     <span
                        className={`${
                           formData.active ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-5 w-5 transform rounded-full bg-white transition-transform`}
                     />
                  </button>
               </div>
               <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className={formData.active ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-500'}>
                     {formData.active ? '● Live on site' : '● Draft mode'}
                  </span>
               </div>
            </div>

            {/* Analytics Cards */}
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                     <Activity className="w-3.5 h-3.5" /> Lifetime Bookings
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{formData.bookingsCount}</div>
               </div>
               <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                     <DollarSign className="w-3.5 h-3.5" /> Total Revenue
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">${formData.revenue?.toLocaleString()}</div>
               </div>
            </div>

            {/* Metadata Grid */}
            <div className="space-y-4">
               <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <List className="w-4 h-4" /> Tour Details
               </h3>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                     <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Price ($)</label>
                     <input 
                        type="number"
                        value={formData.price}
                        onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                        className="w-full p-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                     />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Duration</label>
                     <input 
                        type="text"
                        value={formData.duration}
                        onChange={e => setFormData({...formData, duration: e.target.value})}
                        className="w-full p-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                     />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Difficulty</label>
                     <select 
                        value={formData.difficulty || 'Easy'}
                        onChange={e => setFormData({...formData, difficulty: e.target.value})}
                        className="w-full p-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                     >
                        <option>Easy</option>
                        <option>Moderate</option>
                        <option>Hard</option>
                        <option>Expert</option>
                     </select>
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Max Group Size</label>
                     <input 
                        type="number"
                        value={formData.maxPeople || 0}
                        onChange={e => setFormData({...formData, maxPeople: Number(e.target.value)})}
                        className="w-full p-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                     />
                  </div>
               </div>
               
               <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Location</label>
                  <div className="relative">
                     <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                     <input 
                        type="text"
                        value={formData.location || ''}
                        onChange={e => setFormData({...formData, location: e.target.value})}
                        className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        placeholder="Meeting point or area"
                     />
                  </div>
               </div>
            </div>

            {/* Tags */}
            <div className="space-y-3">
               <label className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Tag className="w-4 h-4" /> Tags
               </label>
               <div className="flex flex-wrap gap-2">
                  {formData.tags?.map(tag => (
                     <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
                        {tag}
                        <button onClick={() => removeTag(tag)} className="hover:text-indigo-900 dark:hover:text-indigo-200"><X className="w-3 h-3" /></button>
                     </span>
                  ))}
                  <div className="flex items-center gap-2">
                     <input 
                        value={newTag}
                        onChange={e => setNewTag(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addTag()}
                        placeholder="Add tag..."
                        className="w-24 px-2 py-1 text-xs bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-indigo-500 outline-none transition-colors"
                     />
                     <button onClick={addTag} disabled={!newTag} className="text-indigo-600 disabled:opacity-50"><Plus className="w-4 h-4" /></button>
                  </div>
               </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
               <label className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <AlignLeft className="w-4 h-4" /> Description
               </label>
               <div className="relative">
                  <textarea 
                     value={formData.description || ''}
                     onChange={e => setFormData({...formData, description: e.target.value})}
                     rows={6}
                     className="w-full p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-sm leading-relaxed text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none resize-none transition-all placeholder-gray-400"
                     placeholder="Describe the tour experience, highlights, and requirements..."
                  />
                  <div className="absolute bottom-3 right-3 text-[10px] text-gray-400">
                     {formData.description?.length || 0} chars
                  </div>
               </div>
            </div>
         </div>
         
         {/* Footer */}
         <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm flex gap-3">
            <button 
               onClick={() => onSave(formData)} 
               className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
            >
               <Save className="w-4 h-4" />
               Save Changes
            </button>
            <button className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-medium transition-colors flex items-center justify-center">
               <Trash2 className="w-4 h-4" />
            </button>
         </div>
      </>
   );
};

// --- Tours Page ---
interface ToursPageProps {
  searchTerm?: string;
}

export const ToursPage: React.FC<ToursPageProps> = ({ searchTerm = '' }) => {
  const { t } = useI18n();
  const [tours, setTours] = useState(TOURS);
  const [selectedTour, setSelectedTour] = useState<typeof TOURS[0] | null>(null);

  const filteredTours = tours.filter(tour => 
    tour.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tour.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdateTour = (updatedTour: typeof TOURS[0]) => {
     setTours(prev => prev.map(t => t.id === updatedTour.id ? updatedTour : t));
     setSelectedTour(null);
  };

  return (
    <div className="flex h-full">
      {/* Tour List */}
      <div className={`${selectedTour ? 'hidden lg:block lg:w-1/3 border-r border-gray-200 dark:border-gray-700' : 'w-full'} overflow-y-auto bg-white dark:bg-gray-800`}>
         <div className="p-6 sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur z-10 border-b border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-1">
               <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('page_tours_title')}</h2>
               <button className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors">
                  <Plus className="w-5 h-5" />
               </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{filteredTours.length} Active Tours</p>
         </div>
         <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredTours.map(tour => (
               <div 
                  key={tour.id}
                  onClick={() => setSelectedTour(tour)}
                  className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors group ${selectedTour?.id === tour.id ? 'bg-indigo-50 dark:bg-indigo-900/10' : ''}`}
               >
                  <div className="flex gap-4">
                     <div className="w-20 h-20 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0 relative">
                        <img src={tour.image} alt={tour.name} className="w-full h-full object-cover" />
                        {!tour.active && (
                           <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
                              <span className="text-[10px] font-bold text-white uppercase tracking-wider">Draft</span>
                           </div>
                        )}
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                           <h3 className="font-bold text-gray-900 dark:text-white truncate pr-2">{tour.name}</h3>
                           <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">${tour.price}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-2">
                           <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {tour.duration}</span>
                           <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Max {tour.maxPeople}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                           {tour.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                 {tag}
                              </span>
                           ))}
                        </div>
                     </div>
                     <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* Edit Panel */}
      {selectedTour ? (
         <div className="flex-1 h-full overflow-hidden flex flex-col bg-white dark:bg-gray-800">
            <TourEditForm tour={selectedTour} onSave={handleUpdateTour} />
         </div>
      ) : (
         <div className="hidden lg:flex flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900 text-center p-8">
            <div>
               <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                  <MapIcon className="w-8 h-8" />
               </div>
               <h3 className="text-lg font-bold text-gray-900 dark:text-white">Select a tour</h3>
               <p className="text-gray-500 dark:text-gray-400 mt-1">View analytics and edit tour details.</p>
            </div>
         </div>
      )}
    </div>
  );
};

// --- Reports Page ---
export const ReportsPage = () => {
   const { t } = useI18n();
   return (
      <div className="p-6 lg:p-8 h-full overflow-y-auto">
         <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('page_reports_title')}</h2>
            <div className="flex gap-2">
               <select className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm rounded-lg px-3 py-2 outline-none">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                  <option>This Year</option>
               </select>
               <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                  Download PDF
               </button>
            </div>
         </div>

         {/* Stats Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
               { label: 'Total Revenue', value: '$24,500', change: '+12%', up: true, icon: DollarSign },
               { label: 'Bookings', value: '142', change: '+5%', up: true, icon: Calendar },
               { label: 'Avg. Order Value', value: '$172', change: '-2%', up: false, icon: BarChart3 },
               { label: 'Conversion Rate', value: '3.2%', change: '+0.4%', up: true, icon: TrendingUp },
            ].map((stat, i) => (
               <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                     <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-gray-500 dark:text-gray-400">
                        <stat.icon className="w-5 h-5" />
                     </div>
                     <span className={`text-xs font-semibold px-2 py-1 rounded-full ${stat.up ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
                        {stat.change}
                     </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
               </div>
            ))}
         </div>

         {/* Chart Placeholder */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-gray-900 dark:text-white">Revenue Overview</h3>
                  <div className="flex gap-4 text-sm">
                     <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                        <span className="text-gray-500">Current Period</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-700"></span>
                        <span className="text-gray-500">Previous Period</span>
                     </div>
                  </div>
               </div>
               <div className="h-64 flex items-end justify-between gap-2 px-2">
                  {[40, 65, 45, 80, 55, 70, 40, 60, 50, 75, 65, 85].map((h, i) => (
                     <div key={i} className="w-full bg-gray-100 dark:bg-gray-700/50 rounded-t-sm relative group">
                        <div 
                           className="absolute bottom-0 left-0 right-0 bg-indigo-500/80 dark:bg-indigo-500 rounded-t-sm transition-all duration-500 group-hover:bg-indigo-600"
                           style={{ height: `${h}%` }}
                        ></div>
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10">
                           ${h * 100}
                        </div>
                     </div>
                  ))}
               </div>
               <div className="flex justify-between mt-4 text-xs text-gray-400 font-medium uppercase">
                  <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                  <span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
               </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
               <h3 className="font-bold text-gray-900 dark:text-white mb-6">Top Performing Tours</h3>
               <div className="space-y-6">
                  {[
                     { name: 'Sunset City Bike Tour', val: 85, color: 'bg-blue-500' },
                     { name: 'Historical Walk', val: 62, color: 'bg-emerald-500' },
                     { name: 'Food & Wine Tasting', val: 45, color: 'bg-amber-500' },
                     { name: 'Mountain Hike', val: 30, color: 'bg-purple-500' },
                  ].map((item, i) => (
                     <div key={i}>
                        <div className="flex justify-between text-sm mb-2">
                           <span className="font-medium text-gray-700 dark:text-gray-300">{item.name}</span>
                           <span className="font-bold text-gray-900 dark:text-white">{item.val}%</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                           <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.val}%` }}></div>
                        </div>
                     </div>
                  ))}
               </div>
               <button className="w-full mt-8 py-2.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors border border-indigo-100 dark:border-indigo-900/30">
                  View Full Report
               </button>
            </div>
         </div>
      </div>
   );
};