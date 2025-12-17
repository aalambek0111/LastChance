
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Mail, 
  Search, 
  Phone, 
  MoreVertical, 
  Paperclip, 
  ArrowLeft, 
  CheckCheck, 
  CalendarPlus, 
  Sparkles, 
  Send,
  CalendarCheck,
  MessageSquare,
  CheckCircle,
  Clock,
  User,
  Instagram,
  MessageCircle,
  Filter,
  CheckCircle2,
  Inbox,
  UserPlus,
  ChevronDown,
  X
} from 'lucide-react';
import { Booking, Lead, LeadStatus, Channel } from '../../types';
import CreateBookingModal from '../../components/modals/CreateBookingModal';
import { useI18n } from '../../context/ThemeContext';

type ThreadStatus = 'Open' | 'Resolved';

const TEAM_MEMBERS = [
  { id: '1', name: 'Alex Walker', role: 'Owner' },
  { id: '2', name: 'Sarah Miller', role: 'Guide' },
  { id: '3', name: 'Mike Johnson', role: 'Driver' },
  { id: '4', name: 'Emily Davis', role: 'Support' },
];

const INBOX_THREADS = [
  { 
    id: 1, 
    sender: 'Sarah Jenkins', 
    avatar: 'S', 
    color: 'bg-emerald-100 text-emerald-700',
    preview: 'Is the Sunset tour available this Friday?', 
    time: '10m ago', 
    unread: true,
    channel: 'Website' as Channel,
    status: 'Open' as ThreadStatus,
    assignedTo: 'Alex Walker',
    leadStatus: 'New',
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
    channel: 'WhatsApp' as Channel,
    status: 'Open' as ThreadStatus,
    assignedTo: 'Alex Walker',
    leadStatus: 'Contacted',
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
    sender: 'Emily Chen', 
    avatar: 'E', 
    color: 'bg-purple-100 text-purple-700',
    preview: 'New reservation request #4829', 
    time: '3h ago', 
    unread: true,
    channel: 'Email' as Channel,
    status: 'Open' as ThreadStatus,
    assignedTo: 'Unassigned',
    leadStatus: 'Qualified',
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
    channel: 'Referral' as Channel,
    status: 'Resolved' as ThreadStatus,
    assignedTo: 'Alex Walker',
    leadStatus: 'New',
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

const ChannelIcon = ({ channel, className = "w-3 h-3" }: { channel: Channel, className?: string }) => {
    switch (channel) {
        case 'WhatsApp': return <MessageCircle className={`${className} text-green-500 fill-green-500/10`} />;
        case 'Email': return <Mail className={`${className} text-blue-500`} />;
        case 'Website': return <Globe className={`${className} text-indigo-500`} />;
        default: return <LinkIcon className={`${className} text-gray-400`} />;
    }
};

const LinkIcon = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
);

const Globe = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
);

interface InboxPageProps {
  onAddBooking?: (booking: Booking) => void;
  showToast?: (message: string) => void;
  searchTerm?: string;
  initialLeadName?: string | null;
  bookings: Booking[];
}

const InboxPage: React.FC<InboxPageProps> = ({ 
  onAddBooking, 
  showToast, 
  searchTerm = '', 
  initialLeadName,
  bookings
}) => {
  const { t } = useI18n();
  const [threads, setThreads] = useState(INBOX_THREADS);
  const [activeQueue, setActiveQueue] = useState<ThreadStatus>('Open');
  const [assigneeFilter, setAssigneeFilter] = useState<'All' | 'Mine'>('All');
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [inputText, setInputText] = useState('');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  
  // Assignee popover state
  const [isAssigneeMenuOpen, setIsAssigneeMenuOpen] = useState(false);
  const assigneeMenuRef = useRef<HTMLDivElement>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (assigneeMenuRef.current && !assigneeMenuRef.current.contains(event.target as Node)) {
        setIsAssigneeMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversationId, threads]);

  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  const filteredThreads = useMemo(() => {
    return threads.filter(thread => {
        const matchesSearch = thread.sender.toLowerCase().includes(localSearchTerm.toLowerCase()) || 
                             thread.preview.toLowerCase().includes(localSearchTerm.toLowerCase());
        const matchesQueue = thread.status === activeQueue;
        const matchesAssignee = assigneeFilter === 'All' || (assigneeFilter === 'Mine' && thread.assignedTo === 'Alex Walker');
        
        return matchesSearch && matchesQueue && matchesAssignee;
    });
  }, [threads, localSearchTerm, activeQueue, assigneeFilter]);

  useEffect(() => {
    if (initialLeadName) {
      const thread = threads.find(t => t.sender.toLowerCase() === initialLeadName.toLowerCase());
      if (thread) {
        setSelectedConversationId(thread.id);
        setActiveQueue(thread.status);
      }
    }
  }, [initialLeadName]);

  const selectedThread = threads.find(t => t.id === selectedConversationId);
  const existingBooking = selectedThread 
    ? bookings.find(b => b.clientName === selectedThread.sender)
    : undefined;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConversationId) return;
    
    const newMessage = { 
      id: `m${Date.now()}`, 
      text: inputText, 
      sender: 'me', 
      time: 'Just now' 
    };

    setThreads(prev => prev.map(thread => {
      if (thread.id === selectedConversationId) {
        return {
          ...thread,
          messages: [...thread.messages, newMessage],
          preview: inputText,
          time: 'Just now',
          unread: false
        };
      }
      return thread;
    }));

    setInputText('');
  };

  const handleAssignMember = (memberName: string) => {
      if (!selectedConversationId) return;
      setThreads(prev => prev.map(t => t.id === selectedConversationId ? { ...t, assignedTo: memberName } : t));
      setIsAssigneeMenuOpen(false);
      if (showToast) showToast(`Thread assigned to ${memberName}`);
  };

  const handleResolve = () => {
      if (!selectedConversationId) return;
      const isCurrentlyOpen = activeQueue === 'Open';
      const nextStatus = isCurrentlyOpen ? 'Resolved' : 'Open';
      
      setThreads(prev => prev.map(t => t.id === selectedConversationId ? { ...t, status: nextStatus } : t));
      if (showToast) showToast(`Conversation marked as ${nextStatus}`);
      setSelectedConversationId(null);
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

       setThreads(prev => prev.map(thread => {
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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleBookingCreated = (booking: Booking) => {
    if (onAddBooking) onAddBooking(booking);
    setIsBookingModalOpen(false);
  };

  const mockLeadFromThread: Lead | undefined = selectedThread ? {
    id: `temp_${selectedThread.id}`,
    name: selectedThread.sender,
    status: selectedThread.leadStatus as LeadStatus,
    channel: selectedThread.channel,
    lastMessageTime: selectedThread.time,
    notes: `Context from Inbox conversation.`
  } : undefined;

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto md:px-6 md:py-6 overflow-hidden w-full">
      <div className="flex-1 bg-white dark:bg-gray-800 md:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex overflow-hidden">
        
        {/* --- LEFT SIDEBAR (THREADS) --- */}
        <div className={`${selectedConversationId ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 flex-col border-r border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 z-0`}>
          
          {/* Header & Tabs */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('page_inbox_title')}</h2>
              <div className="flex bg-gray-100 dark:bg-gray-700/50 p-0.5 rounded-lg">
                <button
                    onClick={() => setAssigneeFilter('All')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${assigneeFilter === 'All' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}
                >
                    All
                </button>
                <button
                    onClick={() => setAssigneeFilter('Mine')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${assigneeFilter === 'Mine' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}
                >
                    Mine
                </button>
              </div>
            </div>

            <div className="flex bg-gray-50 dark:bg-gray-900/50 p-1 rounded-xl border border-gray-100 dark:border-gray-700">
               {(['Open', 'Resolved'] as ThreadStatus[]).map((q) => (
                  <button
                    key={q}
                    onClick={() => { setActiveQueue(q); setSelectedConversationId(null); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-lg transition-all ${activeQueue === q ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-200 dark:border-gray-600' : 'text-gray-500 dark:text-gray-400'}`}
                  >
                    {q === 'Open' ? <MessageSquare className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    {q}
                    <span className="text-[10px] opacity-60">({threads.filter(t => t.status === q).length})</span>
                  </button>
               ))}
            </div>

            <div className="relative">
              <input 
                type="text" 
                placeholder="Search conversations..." 
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredThreads.map((thread) => (
              <div 
                key={thread.id} 
                onClick={() => setSelectedConversationId(thread.id)}
                className={`p-4 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors relative group ${selectedConversationId === thread.id ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${thread.color}`}>
                        {thread.avatar}
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-0.5 shadow-sm border border-gray-100 dark:border-gray-700">
                           <ChannelIcon channel={thread.channel} className="w-3 h-3" />
                        </div>
                    </div>
                    <div className="min-w-0">
                      <h4 className={`text-sm font-bold truncate ${thread.unread ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                        {thread.sender}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{thread.channel}</span>
                         {thread.assignedTo && thread.assignedTo !== 'Unassigned' && (
                            <>
                                <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                                <span className="text-[10px] text-gray-500 dark:text-gray-400 italic">@{thread.assignedTo.split(' ')[0]}</span>
                            </>
                         )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap">{thread.time}</span>
                    {thread.unread && (
                       <span className="w-2 h-2 bg-indigo-500 rounded-full shadow-sm shadow-indigo-500/50 animate-pulse" />
                    )}
                  </div>
                </div>
                <p className={`text-xs mt-2 line-clamp-1 ${thread.unread ? 'text-gray-800 dark:text-gray-200 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
                  {thread.preview}
                </p>
              </div>
            ))}
            {filteredThreads.length === 0 && (
              <div className="p-12 text-center flex flex-col items-center">
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-full mb-3 text-gray-400">
                    <Inbox className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">No messages</p>
                <p className="text-xs text-gray-500 mt-1">Nothing found in the {activeQueue.toLowerCase()} queue.</p>
              </div>
            )}
          </div>
        </div>

        {/* --- RIGHT SIDEBAR (CONVERSATION) --- */}
        {selectedThread ? (
          <div className={`${!selectedConversationId ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-gray-50/30 dark:bg-gray-900/30`}>
            
            {/* Thread Header */}
            <div className="h-16 px-6 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between shrink-0 z-10 shadow-sm">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedConversationId(null)}
                  className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${selectedThread.color}`}>
                  {selectedThread.avatar}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                    {selectedThread.sender}
                    <ChannelIcon channel={selectedThread.channel} className="w-3.5 h-3.5" />
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase font-bold tracking-tight">
                    <span>{selectedThread.leadStatus} Lead</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    
                    {/* INTERACTIVE ASSIGNEE PICKER */}
                    <div className="relative" ref={assigneeMenuRef}>
                        <button 
                            onClick={() => setIsAssigneeMenuOpen(!isAssigneeMenuOpen)}
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md transition-colors ${
                                selectedThread.assignedTo === 'Unassigned' 
                                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-dashed border-indigo-200 dark:border-indigo-800' 
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                            }`}
                        >
                            {selectedThread.assignedTo === 'Unassigned' ? (
                                <><UserPlus className="w-2.5 h-2.5" /> Claim</>
                            ) : (
                                <>@{selectedThread.assignedTo.split(' ')[0]} <ChevronDown className="w-2 h-2" /></>
                            )}
                        </button>

                        {isAssigneeMenuOpen && (
                            <div className="absolute left-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-[60] animate-in slide-in-from-top-1 duration-200">
                                <div className="p-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                                    Assign To
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                    {TEAM_MEMBERS.map(member => (
                                        <button
                                            key={member.id}
                                            onClick={() => handleAssignMember(member.name)}
                                            className={`w-full px-4 py-2 text-left text-xs font-semibold flex items-center justify-between hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors ${
                                                selectedThread.assignedTo === member.name ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/50' : 'text-gray-700 dark:text-gray-300'
                                            }`}
                                        >
                                            <div className="flex flex-col">
                                                <span>{member.name}</span>
                                                <span className="text-[9px] text-gray-400 font-normal">{member.role}</span>
                                            </div>
                                            {selectedThread.assignedTo === member.name && <CheckCircle2 className="w-3 h-3" />}
                                        </button>
                                    ))}
                                    <div className="border-t border-gray-50 dark:border-gray-700 my-1"></div>
                                    <button
                                        onClick={() => handleAssignMember('Unassigned')}
                                        className="w-full px-4 py-2 text-left text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2"
                                    >
                                        <X className="w-3 h-3" /> Unassign
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                
                <button 
                  onClick={handleResolve}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    selectedThread.status === 'Open' 
                      ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                  }`}
                  title={selectedThread.status === 'Open' ? "Close Conversation" : "Reopen Conversation"}
                >
                  {selectedThread.status === 'Open' ? <CheckCircle className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                  <span className="hidden sm:inline">{selectedThread.status === 'Open' ? 'Resolve' : 'Reopen'}</span>
                </button>

                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>

                {existingBooking ? (
                  <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-xs font-semibold rounded-lg transition-colors">
                    <CalendarCheck className="w-4 h-4" />
                    Booking
                  </button>
                ) : (
                  <button 
                    onClick={() => setIsBookingModalOpen(true)}
                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    <CalendarPlus className="w-4 h-4" />
                    Book
                  </button>
                )}
                
                <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] dark:bg-none">
              {selectedThread.messages.map((msg, idx) => {
                const isMe = msg.sender === 'me';
                return (
                  <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed ${
                        isMe 
                          ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-200 dark:shadow-none' 
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-700 rounded-bl-none'
                      }`}>
                        {msg.text}
                      </div>
                      <div className="flex items-center gap-1 mt-1.5 px-1">
                        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-tighter">{msg.time}</span>
                        {isMe && <CheckCheck className="w-3 h-3 text-indigo-400" />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Composer */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
              {/* Smart Assist Chips */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide no-scrollbar items-center">
                <div className="flex items-center gap-2 pr-3 border-r border-gray-100 dark:border-gray-700 mr-1 shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">AI Agent</span>
                </div>
                {AI_SUGGESTIONS.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setInputText(suggestion)}
                    className="whitespace-nowrap px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all active:scale-95"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileChange} 
                />
                <button 
                  type="button" 
                  onClick={handleAttachClick}
                  className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl flex items-center px-4 py-2 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    placeholder={`Reply via ${selectedThread.channel}...`}
                    className="w-full bg-transparent border-none focus:ring-0 text-sm resize-none max-h-32 text-gray-900 dark:text-white placeholder-gray-400 py-1.5"
                    rows={1}
                  />
                </div>
                <button 
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-3.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.97] flex items-center justify-center shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-gray-50/50 dark:bg-gray-900/30 text-center p-8">
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-indigo-100 dark:border-indigo-800">
              <Mail className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Omnichannel Inbox</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed">
              Select a thread from the left to reply. Messages from WhatsApp, Email, and Social channels appear here in real-time.
            </p>
          </div>
        )}
      </div>

      <CreateBookingModal 
        isOpen={isBookingModalOpen} 
        onClose={() => setIsBookingModalOpen(false)} 
        leadName={selectedThread?.sender}
        lead={mockLeadFromThread}
        onBookingCreated={handleBookingCreated}
      />
    </div>
  );
};

const RotateCcw = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
);

export default InboxPage;
