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
  X,
  Archive,
  Star,
  Trash2,
  BellOff,
  Globe
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
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isAssigneeMenuOpen, setIsAssigneeMenuOpen] = useState(false);
  
  const assigneeMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (assigneeMenuRef.current && !assigneeMenuRef.current.contains(event.target as Node)) setIsAssigneeMenuOpen(false);
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) setIsMoreMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [selectedConversationId, threads]);
  useEffect(() => { setLocalSearchTerm(searchTerm); }, [searchTerm]);

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
      if (thread) { setSelectedConversationId(thread.id); setActiveQueue(thread.status); }
    }
  }, [initialLeadName]);

  const selectedThread = threads.find(t => t.id === selectedConversationId);
  const existingBooking = selectedThread ? bookings.find(b => b.clientName === selectedThread.sender) : undefined;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConversationId) return;
    const newMessage = { id: `m${Date.now()}`, text: inputText, sender: 'me', time: 'Just now' };
    setThreads(prev => prev.map(thread => {
      if (thread.id === selectedConversationId) {
        return { ...thread, messages: [...thread.messages, newMessage], preview: inputText, time: 'Just now', unread: false };
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
      const nextStatus = activeQueue === 'Open' ? 'Resolved' : 'Open';
      setThreads(prev => prev.map(t => t.id === selectedConversationId ? { ...t, status: nextStatus } : t));
      if (showToast) showToast(`Conversation marked as ${nextStatus}`);
      setSelectedConversationId(null);
  };

  const handleCall = () => {
      if (!selectedThread) return;
      if (showToast) showToast(`Initiating call with ${selectedThread.sender}...`);
  };

  const handleAction = (label: string) => {
      if (showToast) showToast(`${label} - feature coming soon.`);
      setIsMoreMenuOpen(false);
  };

  /* Fix: Added missing handleBookingCreated function to fix the build error */
  const handleBookingCreated = (booking: Booking) => {
    if (onAddBooking) onAddBooking(booking);
    if (showToast) showToast('Booking created successfully');
    setIsBookingModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto md:px-6 md:py-6 overflow-hidden w-full">
      <div className="flex-1 bg-white dark:bg-gray-800 md:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex overflow-hidden">
        <div className={`${selectedConversationId ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 flex-col border-r border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 z-0`}>
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('page_inbox_title')}</h2>
              <div className="flex bg-gray-100 dark:bg-gray-700/50 p-0.5 rounded-lg">
                <button onClick={() => setAssigneeFilter('All')} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${assigneeFilter === 'All' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>All</button>
                <button onClick={() => setAssigneeFilter('Mine')} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${assigneeFilter === 'Mine' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>Mine</button>
              </div>
            </div>
            <div className="flex bg-gray-50 dark:bg-gray-900/50 p-1 rounded-xl border border-gray-100 dark:border-gray-700">
               {(['Open', 'Resolved'] as ThreadStatus[]).map((q) => (
                  <button key={q} onClick={() => { setActiveQueue(q); setSelectedConversationId(null); }} className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-lg transition-all ${activeQueue === q ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm border border-gray-200 dark:border-gray-600' : 'text-gray-500'}`}>
                    {q === 'Open' ? <MessageSquare className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    {q}
                  </button>
               ))}
            </div>
            <div className="relative">
              <input type="text" placeholder="Search..." value={localSearchTerm} onChange={(e) => setLocalSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-lg text-sm outline-none" />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredThreads.map((thread) => (
              <div key={thread.id} onClick={() => setSelectedConversationId(thread.id)} className={`p-4 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors relative group ${selectedConversationId === thread.id ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${thread.color}`}>{thread.avatar}</div>
                        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-0.5 shadow-sm border border-gray-100 dark:border-gray-700"><ChannelIcon channel={thread.channel} className="w-3 h-3" /></div>
                    </div>
                    <div className="min-w-0">
                      <h4 className={`text-sm font-bold truncate ${thread.unread ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{thread.sender}</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{thread.channel} • @{thread.assignedTo.split(' ')[0]}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap">{thread.time}</span>
                </div>
                <p className={`text-xs mt-2 line-clamp-1 ${thread.unread ? 'text-gray-800 dark:text-gray-200 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>{thread.preview}</p>
              </div>
            ))}
          </div>
        </div>

        {selectedThread ? (
          <div className="flex-1 flex flex-col bg-gray-50/30 dark:bg-gray-900/30">
            <div className="h-16 px-6 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between shrink-0 z-10 shadow-sm">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedConversationId(null)} className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full"><ArrowLeft className="w-5 h-5" /></button>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${selectedThread.color}`}>{selectedThread.avatar}</div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">{selectedThread.sender}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase font-bold tracking-tight">
                    <span>{selectedThread.leadStatus} Lead</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <div className="relative" ref={assigneeMenuRef}>
                        <button onClick={() => setIsAssigneeMenuOpen(!isAssigneeMenuOpen)} className="flex items-center gap-1 hover:text-indigo-600 transition-colors">@{selectedThread.assignedTo.split(' ')[0]} <ChevronDown className="w-2 h-2" /></button>
                        {isAssigneeMenuOpen && (
                            <div className="absolute left-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-[60] overflow-hidden">
                                {TEAM_MEMBERS.map(m => (
                                    <button key={m.id} onClick={() => handleAssignMember(m.name)} className="w-full px-4 py-2 text-left text-xs font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-900/20">{m.name}</button>
                                ))}
                            </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleResolve} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${selectedThread.status === 'Open' ? 'bg-white text-gray-700' : 'bg-emerald-50 text-emerald-700'}`}>
                  {selectedThread.status === 'Open' ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  <span className="hidden sm:inline">{selectedThread.status === 'Open' ? 'Resolve' : 'Reopen'}</span>
                </button>
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                <button onClick={handleCall} className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg transition-colors"><Phone className="w-5 h-5" /></button>
                <div className="relative" ref={moreMenuRef}>
                    <button onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)} className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg transition-colors"><MoreVertical className="w-5 h-5" /></button>
                    {isMoreMenuOpen && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-[60] overflow-hidden">
                            <button onClick={() => handleAction('Star')} className="w-full px-4 py-2.5 text-left text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 flex items-center gap-2"><Star className="w-4 h-4" /> Star Thread</button>
                            <button onClick={() => handleAction('Snooze')} className="w-full px-4 py-2.5 text-left text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 flex items-center gap-2"><Clock className="w-4 h-4" /> Snooze</button>
                            <button onClick={() => handleAction('Mute')} className="w-full px-4 py-2.5 text-left text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 flex items-center gap-2"><BellOff className="w-4 h-4" /> Mute Alerts</button>
                            <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                            <button onClick={() => handleAction('Archive')} className="w-full px-4 py-2.5 text-left text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 flex items-center gap-2"><Archive className="w-4 h-4" /> Archive</button>
                            <button onClick={() => handleAction('Delete')} className="w-full px-4 py-2.5 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 className="w-4 h-4" /> Delete</button>
                        </div>
                    )}
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] dark:bg-none">
              {selectedThread.messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex flex-col max-w-[75%] ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-3 rounded-2xl text-sm ${msg.sender === 'me' ? 'bg-indigo-600 text-white rounded-br-none shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-700 rounded-bl-none'}`}>
                      {msg.text}
                    </div>
                    <span className="text-[10px] font-medium text-gray-400 uppercase mt-1">{msg.time}</span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
              <div className="flex gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar items-center">
                <div className="flex items-center gap-2 pr-3 border-r border-gray-100 dark:border-gray-700 mr-1 shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Smart Reply</span>
                </div>
                {AI_SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => setInputText(s)} className="whitespace-nowrap px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 text-xs font-bold border border-indigo-100 dark:border-indigo-800 transition-all active:scale-95">{s}</button>
                ))}
              </div>
              <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-400 hover:text-indigo-600 rounded-xl transition-all"><Paperclip className="w-5 h-5" /></button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={() => showToast && showToast('File attached.')} />
                <div className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl flex items-center px-4 py-2">
                  <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage(e)} placeholder="Type a message..." className="w-full bg-transparent border-none focus:ring-0 text-sm resize-none max-h-32" rows={1} />
                </div>
                <button type="submit" disabled={!inputText.trim()} className="p-3.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg active:scale-[0.97]"><Send className="w-5 h-5" /></button>
              </form>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-gray-50/50 dark:bg-gray-900/30 text-center p-8">
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-3xl flex items-center justify-center mb-6 border border-indigo-100 dark:border-indigo-800"><Mail className="w-10 h-10" /></div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Unified Inbox</h3>
            <p className="text-sm text-gray-500 max-w-sm mt-1">Select a conversation to start messaging across all your connected channels.</p>
          </div>
        )}
      </div>
      <CreateBookingModal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} leadName={selectedThread?.sender} onBookingCreated={handleBookingCreated} />
    </div>
  );
};

export default InboxPage;