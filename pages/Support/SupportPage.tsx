import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  Search,
  Book,
  MessageCircle,
  Mail,
  Phone,
  ChevronRight,
  ExternalLink,
  LifeBuoy,
  PlayCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  Sparkles,
  Bot,
  Send,
  X,
  Plus,
  Loader2,
  FileText
} from 'lucide-react';
import { useI18n } from '../../context/ThemeContext';
import { GoogleGenAI } from '@google/genai';

type ContentType = 'ALL' | 'FAQ' | 'GUIDE' | 'VIDEO';

type KBItem = {
  id: string;
  type: Exclude<ContentType, 'ALL'>;
  title: string;
  summary: string;
  body: string;
  tags: string[];
};

const KB: KBItem[] = [
  {
    id: 'guide-setup',
    type: 'GUIDE',
    title: 'Getting started: first setup checklist',
    summary: 'Add your first tour, create leads, log bookings, and invite your team.',
    body:
      '1) Add your first tour (Tours > Create Tour)\n' +
      '2) Create a few leads (Leads > Add Lead)\n' +
      '3) Log your first booking (Bookings > Add Booking)\n' +
      '4) Configure currency & timezone (Settings)\n' +
      '5) Invite your team (Team > Invite Member)',
    tags: ['setup', 'getting started', 'onboarding'],
  },
  {
    id: 'faq-add-tour',
    type: 'FAQ',
    title: 'How do I add a new tour?',
    summary: 'Create a tour from the Tours page.',
    body:
      'Navigate to the Tours tab and click "Create Tour". Fill in name, price, duration, and status. Save changes.',
    tags: ['tours', 'create', 'product'],
  },
  {
    id: 'faq-export',
    type: 'FAQ',
    title: 'Can I export my booking data?',
    summary: 'Yes - export as CSV.',
    body:
      'Go to the Bookings page and click "Export". You can download the list and use it in Excel/Google Sheets.',
    tags: ['bookings', 'export', 'csv'],
  },
  {
    id: 'faq-currency',
    type: 'FAQ',
    title: 'How do I change my currency settings?',
    summary: 'Change it in Settings.',
    body:
      'Go to Settings > Workspace Settings. Select your preferred currency from the dropdown and save.',
    tags: ['settings', 'currency', 'workspace'],
  },
  {
    id: 'video-bookings',
    type: 'VIDEO',
    title: 'Bookings: create and manage',
    summary: 'Quick walkthrough for adding bookings and filtering the list.',
    body:
      'Video tutorial: Create a booking, assign pax, set pickup location, and filter by status/tour.',
    tags: ['video', 'bookings', 'filters'],
  },
];

type ChatMsg = { id: string; role: 'user' | 'model'; text: string };

const SYSTEM_INSTRUCTION = `You are the official TourCRM Support Assistant. 
You help tour agency owners manage their operations.

App Features:
1. Dashboard: Real-time KPIs (Leads, Unread chats, Follow-ups, Upcoming tours).
2. Inbox: Unified messaging for WhatsApp, Email, and Website leads. Uses AI Smart Replies.
3. Leads: Manage prospects. View modes: Table and Kanban. Features Activity Logs and internal comments.
4. Bookings: Manage confirmed and pending reservations. Handles pax capacity and pickup locations.
5. Tours: Your product catalog. Set price, duration, difficulty, and location.
6. Calendar: Drag-and-drop scheduling for tours and guides.
7. Team: Invite members with roles: Owner, Admin, Manager, Limited, Read Only.
8. Settings: Customize branding (logo/colors), currency, timezone, and layout.
9. Automations: Rules to auto-assign leads or send confirmation emails.
10. Data Import: Bulk upload Leads, Bookings, or Tours via CSV.

Guidelines:
- Be professional, helpful, and concise.
- If a user asks how to do something, provide step-by-step instructions based on the features above.
- If you don't know the answer, suggest they "Create a Support Ticket" using the button in the app.
- Mention that features like WhatsApp Alerts are "Coming Soon" if asked.`;

const SupportPage: React.FC = () => {
  const { t } = useI18n();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ContentType>('ALL');
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantInput, setAssistantInput] = useState('');
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [chat, setChat] = useState<ChatMsg[]>([
    { id: 'a1', role: 'model', text: 'Hi! I am your TourCRM expert. How can I help you streamline your agency operations today?' }
  ]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chat, isAiLoading]);

  const toggleFaq = (index: number) => setOpenFaqIndex(openFaqIndex === index ? null : index);
  const filteredKb = useMemo(() => filter === 'ALL' ? KB : KB.filter(k => k.type === filter), [filter]);
  
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return filteredKb.filter(item => 
      item.title.toLowerCase().includes(q) || 
      item.summary.toLowerCase().includes(q) || 
      item.tags.some(tag => tag.toLowerCase().includes(q))
    ).slice(0, 6);
  }, [query, filteredKb]);

  const quickFaqs = useMemo(() => KB.filter(x => x.type === 'FAQ').slice(0, 6), []);

  const sendAssistantMessage = async () => {
    const text = assistantInput.trim();
    if (!text || isAiLoading) return;

    // Add user message to UI
    const userMsg: ChatMsg = { id: String(Date.now()), role: 'user', text };
    setChat(prev => [...prev, userMsg]);
    setAssistantInput('');
    setIsAiLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Prepare history for Gemini
      const contents = chat.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));
      contents.push({ role: 'user', parts: [{ text }] });

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
        }
      });

      const aiText = response.text || "I'm sorry, I couldn't process that request.";
      setChat(prev => [...prev, { id: String(Date.now() + 1), role: 'model', text: aiText }]);
    } catch (error) {
      console.error('Gemini API Error:', error);
      setChat(prev => [...prev, { 
        id: String(Date.now() + 1), 
        role: 'model', 
        text: "I'm having trouble connecting to my brain right now. Please try again or create a support ticket if the issue persists." 
      }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAction = (label: string) => alert(`Redirecting to ${label} center...`);

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      {/* Hero */}
      <div className="bg-indigo-600 dark:bg-indigo-950 pt-10 pb-16 px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-50 text-xs font-semibold mb-4">
            <Sparkles className="w-4 h-4" /> AI Support Enabled
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">How can we help you?</h2>
          <div className="bg-white/10 border border-white/10 rounded-2xl p-4 mt-8">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input value={query} onChange={e => setQuery(e.target.value)} type="text" placeholder="Search documentation..." className="w-full pl-11 pr-4 py-3.5 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none" />
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
              </div>
              <button onClick={() => setAssistantOpen(true)} className="px-6 py-3 rounded-xl bg-white text-indigo-700 font-bold text-sm hover:bg-indigo-50 transition flex items-center gap-2">
                <Bot className="w-4 h-4" /> Ask AI
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-8 -mt-10 pb-12 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div onClick={() => handleAction('Documentation')} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 hover:-translate-y-1 transition-all cursor-pointer group">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
              <Book className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Guides</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Master every feature with detailed docs.</p>
            <span className="text-indigo-600 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">Browse Articles <ChevronRight className="w-4 h-4" /></span>
          </div>
          <div onClick={() => handleAction('Tutorial')} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 hover:-translate-y-1 transition-all cursor-pointer group">
            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
              <PlayCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Video Walkthroughs</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Visual guides for quick setup.</p>
            <span className="text-indigo-600 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">Watch Videos <ChevronRight className="w-4 h-4" /></span>
          </div>
          <div onClick={() => handleAction('Community')} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 hover:-translate-y-1 transition-all cursor-pointer group">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Community Forum</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Connect with other agency owners.</p>
            <span className="text-indigo-600 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">Join Discussion <ExternalLink className="w-3 h-3" /></span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h3 className="font-bold text-gray-900 dark:text-white">Recent Articles</h3>
                <span className="text-xs text-gray-500 uppercase font-bold tracking-widest">{query.trim() ? `${results.length} results` : 'Search for specific topics'}</span>
              </div>
              <div className="p-6">
                {!query.trim() ? (
                  <div className="space-y-4">
                    {KB.slice(0, 3).map(r => (
                      <div key={r.id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition cursor-pointer">
                        <div className="flex justify-between">
                          <h4 className="font-bold text-gray-900 dark:text-white">{r.title}</h4>
                          <span className="text-[10px] font-black uppercase text-indigo-500">{r.type}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{r.summary}</p>
                      </div>
                    ))}
                  </div>
                ) : results.length > 0 ? (
                  results.map(r => (
                    <div key={r.id} className="p-4 rounded-xl border border-gray-200 mb-3">
                      <h4 className="font-bold text-gray-900 dark:text-white">{r.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{r.body}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No results found for "{query}". Try asking the AI Assistant instead.</p>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h3>
              <div className="space-y-4">
                {quickFaqs.map((faq, idx) => (
                  <div key={faq.id} className="border border-gray-100 dark:border-gray-700 rounded-lg overflow-hidden">
                    <button onClick={() => toggleFaq(idx)} className="w-full flex items-center justify-between p-4 text-left bg-gray-50/50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                      <span className="font-bold text-gray-900 dark:text-white text-sm">{faq.title}</span>
                      {openFaqIndex === idx ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {openFaqIndex === idx && <div className="p-4 bg-white dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-700 leading-relaxed">{faq.body}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="font-bold text-gray-900 dark:text-white px-1">Connect with Us</h3>
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-start gap-4">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg text-indigo-600 dark:text-indigo-400"><MessageCircle className="w-5 h-5" /></div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-sm">Live Assistance</h4>
                <p className="text-xs text-gray-500 mt-1 mb-3">Instant chat with our AI experts.</p>
                <button onClick={() => setAssistantOpen(true)} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors">Open Chat</button>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700"><h4 className="font-bold text-gray-900 dark:text-white text-sm">Open Support Tickets</h4></div>
              <div className="p-5 space-y-3">
                {[
                  { id: 'T-1024', subject: 'Integration help', status: 'Active', time: '2h ago' }
                ].map(ticket => (
                  <div key={ticket.id} className="p-3 rounded-lg border border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">{ticket.subject}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{ticket.id} • {ticket.time}</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">{ticket.status}</span>
                  </div>
                ))}
                <button onClick={() => setIsTicketModalOpen(true)} className="w-full mt-2 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all border border-dashed border-indigo-200">+ Create Ticket</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {assistantOpen && (
        <div className="fixed right-6 bottom-6 w-[400px] max-w-[92vw] z-50 animate-in slide-in-from-bottom-5">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-[500px]">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-indigo-600">
              <div className="flex items-center gap-3 text-white">
                <Bot className="w-5 h-5" />
                <h4 className="font-bold text-sm uppercase tracking-widest">Support Assistant</h4>
              </div>
              <button onClick={() => setAssistantOpen(false)} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
              {chat.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`p-3 rounded-2xl text-sm max-w-[85%] ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-none border border-gray-200 dark:border-gray-600'}`}>
                     {m.text}
                   </div>
                </div>
              ))}
              {isAiLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-2xl rounded-bl-none flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                    <span className="text-xs text-gray-500 font-medium">Assistant is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <form 
                onSubmit={(e) => { e.preventDefault(); sendAssistantMessage(); }}
                className="flex gap-2"
              >
                <input 
                  value={assistantInput} 
                  onChange={e => setAssistantInput(e.target.value)} 
                  disabled={isAiLoading}
                  placeholder="Type your question..." 
                  className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" 
                />
                <button 
                  type="submit"
                  disabled={!assistantInput.trim() || isAiLoading}
                  className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {isTicketModalOpen && (
        <CreateTicketModal 
          onClose={() => setIsTicketModalOpen(false)} 
          onSuccess={() => {
            alert('Ticket created successfully!');
            setIsTicketModalOpen(false);
          }} 
        />
      )}
    </div>
  );
};

const CreateTicketModal = ({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ subject: '', category: 'General', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(onSuccess, 1200);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create Support Ticket</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
           <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Subject</label>
              <input required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm" placeholder="Brief summary of the issue" />
           </div>
           <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Category</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm outline-none">
                 <option>General</option>
                 <option>Account & Billing</option>
                 <option>Tour Management</option>
                 <option>Integrations</option>
                 <option>Bug Report</option>
              </select>
           </div>
           <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Message</label>
              <textarea required rows={4} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm resize-none" placeholder="Describe your problem in detail..." />
           </div>
        </div>
        <div className="p-6 bg-gray-50/50 dark:bg-gray-900/50 flex gap-3">
           <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-bold text-gray-500">Cancel</button>
           <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg flex items-center justify-center gap-2">
             {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
             Submit Ticket
           </button>
        </div>
      </form>
    </div>
  );
};

export default SupportPage;