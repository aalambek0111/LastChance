
import React, { useState, useEffect, useRef } from 'react';
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
  CalendarCheck
} from 'lucide-react';
import { Booking, Lead, LeadStatus } from '../../types';
import CreateBookingModal from '../../components/modals/CreateBookingModal';
import { useI18n } from '../../context/ThemeContext';

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

  // Check if current thread has an existing booking
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

  // Convert thread to partial Lead object for modal prefill
  const mockLeadFromThread: Lead | undefined = selectedThread ? {
    id: `temp_${selectedThread.id}`,
    name: selectedThread.sender,
    status: selectedThread.status as LeadStatus,
    channel: selectedThread.channel as any,
    lastMessageTime: selectedThread.time,
    notes: `Context from Inbox conversation.`
  } : undefined;

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
                {existingBooking ? (
                  <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-xs font-semibold rounded-lg transition-colors mr-2">
                    <CalendarCheck className="w-4 h-4" />
                    View Booking
                  </button>
                ) : (
                  <button 
                    onClick={() => setIsBookingModalOpen(true)}
                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors mr-2"
                  >
                    <CalendarPlus className="w-4 h-4" />
                    Create Booking
                  </button>
                )}
                
                <button 
                  onClick={() => setIsBookingModalOpen(true)}
                  className="sm:hidden p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  {existingBooking ? <CalendarCheck className="w-5 h-5 text-emerald-600" /> : <CalendarPlus className="w-5 h-5" />}
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
        lead={mockLeadFromThread}
        onBookingCreated={handleBookingCreated}
      />
    </div>
  );
};

export default InboxPage;
