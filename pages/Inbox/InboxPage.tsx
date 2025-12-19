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
  Globe,
  Zap,
  Loader2,
  BrainCircuit,
  ArrowUpRight,
  TrendingUp,
  Target,
  Flame,
  Lightbulb,
  ChevronUp,
  Wand2
} from 'lucide-react';
import { Booking, Lead, LeadStatus, Channel } from '../../types';
import CreateBookingModal from '../../components/modals/CreateBookingModal';
import { useI18n } from '../../context/ThemeContext';
import { AIService } from '../../services/aiService';

type ThreadStatus = 'Open' | 'Resolved';

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
      { id: 'm2', text: 'Is the Sunset tour available this Friday? We are a group of 4.', sender: 'client', time: '10:22 AM' },
      { id: 'm3', text: 'We were also wondering if the tour includes any refreshments or if we should bring our own?', sender: 'client', time: '10:25 AM' }
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
  }
];

const ChannelIcon = ({ channel, className = "w-3 h-3" }: { channel: Channel, className?: string }) => {
    switch (channel) {
        case 'WhatsApp': return <MessageCircle className={`${className} text-green-500 fill-green-500/10`} />;
        case 'Email': return <Mail className={`${className} text-blue-500`} />;
        case 'Website': return <Globe className={`${className} text-indigo-500`} />;
        default: return <MessageCircle className={`${className} text-gray-400`} />;
    }
};

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
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [inputText, setInputText] = useState('');
  const [localChatSearch, setLocalChatSearch] = useState('');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isAiPanelCollapsed, setIsAiPanelCollapsed] = useState(false);
  
  const [aiInsights, setAiInsights] = useState<{ summary: string; plan: string; sentiment: string; replies: string[] } | null>(null);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversationId, threads]);

  useEffect(() => {
    setAiInsights(null);
    setIsAiAnalyzing(false);
  }, [selectedConversationId]);

  const runAIAnalysis = async () => {
    const thread = threads.find(t => t.id === selectedConversationId);
    if (!thread) return;

    setIsAiAnalyzing(true);
    setAiInsights(null);
    
    try {
      const result = await AIService.analyzeConversation(thread.messages.map(m => ({
        role: m.sender === 'client' ? 'user' : 'me',
        text: m.text
      })));
      setAiInsights(result);
    } catch (err) {
      console.error("AI failed", err);
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const filteredThreads = useMemo(() => {
    return threads.filter(thread => {
        const query = localChatSearch.toLowerCase();
        const matchesLocalSearch = 
            thread.sender.toLowerCase().includes(query) || 
            thread.preview.toLowerCase().includes(query);
            
        const matchesGlobalSearch = 
            !searchTerm || 
            thread.sender.toLowerCase().includes(searchTerm.toLowerCase()) || 
            thread.preview.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesQueue = thread.status === activeQueue;
        return matchesLocalSearch && matchesGlobalSearch && matchesQueue;
    });
  }, [threads, localChatSearch, searchTerm, activeQueue]);

  const selectedThread = threads.find(t => t.id === selectedConversationId);

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
    setAiInsights(null);
  };

  const handleSmartReply = (reply: string) => {
    setInputText(reply);
  };

  const handleResolve = () => {
    if (!selectedConversationId) return;
    const nextStatus = activeQueue === 'Open' ? 'Resolved' : 'Open';
    setThreads(prev => prev.map(t => t.id === selectedConversationId ? { ...t, status: nextStatus } : t));
    setSelectedConversationId(null);
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <div className="flex-1 bg-white dark:bg-gray-800 flex overflow-hidden">
        
        {/* Left: Threads List */}
        <div className={`${selectedConversationId ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 flex-col border-r border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 z-0 shrink-0`}>
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('page_inbox_title')}</h2>
            <div className="flex bg-gray-50 dark:bg-gray-900/50 p-1 rounded-xl border border-gray-100 dark:border-gray-700">
               {(['Open', 'Resolved'] as ThreadStatus[]).map((q) => (
                  <button key={q} onClick={() => { setActiveQueue(q); setSelectedConversationId(null); }} className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-lg transition-all ${activeQueue === q ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm border border-gray-200 dark:border-gray-600' : 'text-gray-500'}`}>
                    {q === 'Open' ? <MessageSquare className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    {q}
                  </button>
               ))}
            </div>
            {/* Inbox-specific search bar */}
            <div className="relative group">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search chats..." 
                value={localChatSearch}
                onChange={(e) => setLocalChatSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-gray-400"
              />
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
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{thread.channel}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-gray-400">{thread.time}</span>
                </div>
                <p className={`text-xs mt-2 line-clamp-1 ${thread.unread ? 'text-gray-800 dark:text-gray-200 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>{thread.preview}</p>
              </div>
            ))}
            {filteredThreads.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-sm text-gray-500">No chats found matching your search.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Conversation Area */}
        {selectedThread ? (
          <div className="flex-1 flex flex-col bg-gray-50/30 dark:bg-gray-900/30 overflow-hidden relative">
            
            {/* Header */}
            <div className="h-14 px-6 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between shrink-0 z-20">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedConversationId(null)} className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full"><ArrowLeft className="w-5 h-5" /></button>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${selectedThread.color}`}>{selectedThread.avatar}</div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">{selectedThread.sender}</h3>
                  <div className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">Status: {selectedThread.leadStatus}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsBookingModalOpen(true)} 
                  className="px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center gap-2 shadow-sm shadow-indigo-200 dark:shadow-none transition-all active:scale-95"
                >
                  <CalendarPlus className="w-3.5 h-3.5" /> Draft Booking
                </button>
                <button onClick={handleResolve} className="px-3 py-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-[11px] font-bold flex items-center gap-2 transition-all">
                  <CheckCircle className="w-3.5 h-3.5" /> {selectedThread.status === 'Open' ? 'Resolve' : 'Reopen'}
                </button>
              </div>
            </div>

            {/* AI Agent HUD */}
            <div className="px-6 py-2 shrink-0 z-10 relative bg-white/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 backdrop-blur-sm">
               <div className={`transition-all duration-300 ${isAiPanelCollapsed ? 'h-8' : ''}`}>
                  <div className="flex items-center justify-between group">
                     <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-indigo-600 text-white">
                          <BrainCircuit className="w-3 h-3" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-white">AI Assistant</span>
                        
                        {!aiInsights && !isAiAnalyzing && (
                          <button 
                            onClick={runAIAnalysis}
                            className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full hover:bg-indigo-100 transition-colors"
                          >
                            <Wand2 className="w-2.5 h-2.5" /> Get Intelligence
                          </button>
                        )}

                        {isAiAnalyzing && (
                          <span className="flex items-center gap-1.5 text-[9px] font-bold text-indigo-500 animate-pulse">
                            <Loader2 className="w-2.5 h-2.5 animate-spin" /> Analyzing thread...
                          </span>
                        )}

                        {aiInsights && !isAiAnalyzing && (
                          <div className={`text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                             aiInsights.sentiment === 'Hot' ? 'bg-orange-500 text-white' : 'bg-emerald-500 text-white'
                          }`}>
                            {aiInsights.sentiment === 'Hot' ? <Flame className="w-2.5 h-2.5 fill-current" /> : <TrendingUp className="w-2.5 h-2.5" />}
                            {aiInsights.sentiment} Interest
                          </div>
                        )}
                     </div>
                     <div className="flex items-center gap-2">
                        {!isAiPanelCollapsed && aiInsights && (
                          <div className="flex items-center gap-3">
                             <button 
                              onClick={() => setAiInsights(null)} 
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
                             >
                              <X className="w-3 h-3" /> Clear
                             </button>
                          </div>
                        )}
                        <button onClick={() => setIsAiPanelCollapsed(!isAiPanelCollapsed)} className="p-1">
                          {isAiPanelCollapsed ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronUp className="w-3 h-3 text-gray-400" />}
                        </button>
                     </div>
                  </div>

                  {!isAiPanelCollapsed && aiInsights && (
                    <div className="mt-2 pb-2 animate-in slide-in-from-top-1 duration-200">
                       <p className="text-xs font-bold text-gray-800 dark:text-gray-100 leading-snug">{aiInsights.summary}</p>
                       <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 mt-1 italic">
                          <Target className="w-3 h-3 text-indigo-500" /> <span>Next Step: {aiInsights.plan}</span>
                       </div>
                    </div>
                  )}
               </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar scroll-smooth">
              {selectedThread.messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex flex-col max-w-[70%] ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.sender === 'me' 
                        ? 'bg-indigo-600 text-white rounded-br-none shadow-sm' 
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-700 rounded-bl-none shadow-sm'
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase mt-2 px-1 flex items-center gap-1.5">
                      {msg.sender === 'me' && <CheckCheck className="w-3 h-3 text-indigo-500" />}
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Section - Optimized for space */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-20">
              
              {/* Smart Replies - Only visible when insights generated */}
              {aiInsights && (
                <div className="flex gap-2 mb-3 overflow-x-auto pb-2 no-scrollbar items-center border-b border-gray-50 dark:border-gray-700/50 animate-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-2 pr-3 border-r border-gray-100 dark:border-gray-700 mr-1 shrink-0">
                    <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">AI Drafts</span>
                  </div>
                  
                  {aiInsights.replies.map((s, i) => (
                    <button 
                      key={i} 
                      onClick={() => handleSmartReply(s)} 
                      className="whitespace-nowrap px-4 py-1.5 rounded-full bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 text-[11px] font-bold border border-gray-200 dark:border-gray-600 transition-all hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 active:scale-95 shadow-sm"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Enhanced Form Input - Elastic design */}
              <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
                <div className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col transition-all focus-within:ring-4 focus-within:ring-indigo-500/5 focus-within:bg-white dark:focus-within:bg-gray-950 shadow-inner">
                  <textarea 
                    value={inputText} 
                    onChange={(e) => setInputText(e.target.value)} 
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && inputText.trim()) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }} 
                    placeholder="Write a message..." 
                    className="w-full bg-transparent border-none focus:ring-0 text-sm py-2.5 px-4 text-gray-900 dark:text-white placeholder-gray-400 font-medium custom-scrollbar min-h-[44px] max-h-[200px]" 
                    rows={1} 
                  />
                  <div className="flex items-center justify-between px-3 pb-2 pt-0.5 border-t border-gray-100/50 dark:border-gray-800/50">
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                        <Paperclip className="w-4 h-4" />
                      </button>
                      <span className="text-[9px] text-gray-400 font-bold uppercase ml-2">{inputText.length} chars</span>
                    </div>
                    <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter mr-2">Markdown ok</div>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" />
                </div>
                
                <div className="flex items-center gap-2">
                   {!aiInsights && !isAiAnalyzing && (
                    <button 
                      type="button"
                      onClick={runAIAnalysis}
                      className="p-3 bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-50 transition-all active:scale-95 shadow-sm"
                      title="Analyze with AI"
                    >
                      <Wand2 className="w-5 h-5" />
                    </button>
                  )}
                  <button 
                    type="submit" 
                    disabled={!inputText.trim()} 
                    className="p-3.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50 disabled:grayscale shrink-0"
                    title="Send Message"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-gray-50/50 dark:bg-gray-900/30 text-center p-8 animate-in fade-in">
            <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-sm border border-indigo-100 dark:border-indigo-900/30">
              <Mail className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Unified Inbox</h3>
            <p className="text-sm text-gray-500 max-w-xs mt-3 leading-relaxed font-medium">
              Manage your WhatsApp, Email, and Website inquiries. 
              <br/>
              Use the AI Assistant on-demand for drafting responses.
              <br/>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold mt-2 inline-block">Select a thread to start.</span>
            </p>
          </div>
        )}
      </div>
      <CreateBookingModal 
        isOpen={isBookingModalOpen} 
        onClose={() => setIsBookingModalOpen(false)} 
        leadName={selectedThread?.sender} 
        onBookingCreated={(b) => {
          if (onAddBooking) onAddBooking(b);
          if (showToast) showToast('Booking created successfully');
          setIsBookingModalOpen(false);
        }} 
      />
    </div>
  );
};

export default InboxPage;