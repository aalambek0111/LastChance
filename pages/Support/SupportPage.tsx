import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  Send,
  X,
  Ticket,
  Filter as FilterIcon,
} from 'lucide-react';

/**
 * SupportPage
 * - Adds a "Support Assistant" (offline, zero external API calls) that answers based on this page's knowledge base.
 * - Adds working UX for Search, Suggested results, and "Create Ticket" (local state).
 * - You can later replace `getAssistantReply()` with a real backend call (Supabase Edge Function, etc.).
 */

// Mock Data
const FAQS = [
  {
    question: 'How do I add a new tour?',
    answer:
      'Navigate to the Tours tab and click the "Create Tour" button in the top right corner. Fill in the required details like name, price, and duration.',
    tags: ['tours', 'create', 'setup'],
  },
  {
    question: 'Can I export my booking data?',
    answer:
      'Yes. Go to the Bookings page and click the "Export" button. You can download data in CSV or PDF format.',
    tags: ['bookings', 'export', 'csv', 'pdf'],
  },
  {
    question: 'How do I change my currency settings?',
    answer:
      'Go to Settings, then Workspace Settings. Select your preferred currency from the dropdown menu.',
    tags: ['settings', 'currency', 'workspace'],
  },
  {
    question: 'Is there a limit to the number of leads?',
    answer: 'No. The current plan allows unlimited lead tracking and management.',
    tags: ['leads', 'limits', 'plan'],
  },
] as const;

type TicketStatus = 'In Progress' | 'Resolved' | 'Closed';
type TicketRow = {
  id: string;
  subject: string;
  status: TicketStatus;
  date: string;
  lastUpdate: string;
};

const INITIAL_TICKETS: TicketRow[] = [
  { id: 'T-1024', subject: 'Integration with Stripe', status: 'In Progress', date: 'Oct 24, 2023', lastUpdate: '2h ago' },
  { id: 'T-1023', subject: 'Email notifications not sending', status: 'Resolved', date: 'Oct 22, 2023', lastUpdate: '1d ago' },
  { id: 'T-1020', subject: 'Billing invoice correction', status: 'Closed', date: 'Oct 15, 2023', lastUpdate: '1w ago' },
];

type KBType = 'faq' | 'guide' | 'video';
type KnowledgeItem = {
  id: string;
  type: KBType;
  title: string;
  content: string;
  tags: string[];
};

const GUIDES: KnowledgeItem[] = [
  {
    id: 'guide-getting-started',
    type: 'guide',
    title: 'Getting started: first setup checklist',
    content:
      'Add your first tour, create a few leads, then log a booking. Configure currency and timezone in Settings. Invite your team when you are ready.',
    tags: ['setup', 'getting started', 'tours', 'leads', 'bookings', 'settings'],
  },
  {
    id: 'guide-exporting',
    type: 'guide',
    title: 'Exporting data (CSV)',
    content:
      'Use Export buttons on list pages. For advanced reporting, build a custom report and export the results as CSV.',
    tags: ['export', 'csv', 'reporting', 'bookings', 'leads', 'tours'],
  },
  {
    id: 'guide-team',
    type: 'guide',
    title: 'Inviting team members',
    content:
      'Owners can invite new members. Once invitations are connected to authentication, members receive an email to set their password and join your workspace.',
    tags: ['team', 'invite', 'users', 'roles'],
  },
];

const VIDEOS: KnowledgeItem[] = [
  {
    id: 'video-tours',
    type: 'video',
    title: 'Create and manage tours (3 min)',
    content: 'Video walkthrough: create a tour, edit pricing, and mark tours active or draft.',
    tags: ['tours', 'video', 'create', 'edit'],
  },
  {
    id: 'video-bookings',
    type: 'video',
    title: 'Managing bookings (4 min)',
    content: 'Video walkthrough: add bookings, set status, and export.',
    tags: ['bookings', 'video', 'export', 'status'],
  },
];

type ChatRole = 'user' | 'assistant';
type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  ts: number;
  refs?: { title: string; id: string; type: KBType }[];
};

function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
}

function normalize(s: string) {
  return (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function scoreMatch(query: string, item: KnowledgeItem) {
  const q = normalize(query);
  if (!q) return 0;

  const title = normalize(item.title);
  const content = normalize(item.content);
  const tags = item.tags.map(normalize);

  let score = 0;

  // Title matches matter most
  if (title.includes(q)) score += 8;

  // Word-by-word partial matching
  const qWords = q.split(' ').filter(Boolean);
  for (const w of qWords) {
    if (w.length < 2) continue;
    if (title.includes(w)) score += 3;
    if (content.includes(w)) score += 1;
    if (tags.some((t) => t.includes(w))) score += 2;
  }

  return score;
}

function buildKB(): KnowledgeItem[] {
  const faqItems: KnowledgeItem[] = FAQS.map((f, idx) => ({
    id: `faq_${idx + 1}`,
    type: 'faq',
    title: f.question,
    content: f.answer,
    tags: [...(f.tags || [])],
  }));

  return [...faqItems, ...GUIDES, ...VIDEOS];
}

function getAssistantReply(question: string, kb: KnowledgeItem[]) {
  const q = normalize(question);

  if (!q) {
    return {
      answer:
        'Type a question in the search box, for example "export bookings", "change currency", or "invite team member".',
      refs: [] as { title: string; id: string; type: KBType }[],
    };
  }

  const scored = kb
    .map((item) => ({ item, score: scoreMatch(q, item) }))
    .sort((a, b) => b.score - a.score);

  const top = scored.slice(0, 4).filter((x) => x.score > 0);
  const best = top[0];

  if (!best || best.score < 3) {
    const suggestions = top.slice(0, 3).map((x) => `• ${x.item.title}`).join('\n');
    return {
      answer:
        `I could not find an exact match in your help center yet.\n\nTry one of these topics:\n${suggestions || '• Getting started: first setup checklist\n• Exporting data (CSV)\n• Inviting team members'}\n\nIf you want, create a ticket and describe what you are trying to do.`,
      refs: top.slice(0, 3).map((x) => ({ title: x.item.title, id: x.item.id, type: x.item.type })),
    };
  }

  const primary = best.item;
  const secondary = top.slice(1, 3).map((x) => x.item);

  const nextSteps =
    secondary.length > 0
      ? `\n\nRelated:\n${secondary.map((s) => `• ${s.title}`).join('\n')}`
      : '';

  const answer = `${primary.content}${nextSteps}`;

  return {
    answer,
    refs: [primary, ...secondary].map((x) => ({ title: x.title, id: x.id, type: x.type })),
  };
}

const SupportPage: React.FC = () => {
  // FAQ accordion
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Search + assistant
  const kb = useMemo(() => buildKB(), []);
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState<'all' | KBType>('all');
  const [assistantAnswer, setAssistantAnswer] = useState<{ answer: string; refs: { title: string; id: string; type: KBType }[] } | null>(null);

  // Tickets (local)
  const [tickets, setTickets] = useState<TicketRow[]>(INITIAL_TICKETS);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketBody, setNewTicketBody] = useState('');

  // Chat
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: uid('m'),
      role: 'assistant',
      ts: Date.now(),
      text:
        'Hi! I am your Support Assistant. Ask me how to do something in TourCRM, or search the help center above.',
    },
  ]);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!chatOpen) return;
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatOpen, chatMessages.length]);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const filteredResults = useMemo(() => {
    const q = normalize(query);
    if (!q) return [];

    const list = kb
      .filter((item) => (activeType === 'all' ? true : item.type === activeType))
      .map((item) => ({ item, score: scoreMatch(q, item) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((x) => x.item);

    return list;
  }, [kb, query, activeType]);

  const runSearch = () => {
    const res = getAssistantReply(query, kb);
    setAssistantAnswer(res);
  };

  const openArticleFromRef = (refId: string) => {
    const found = kb.find((k) => k.id === refId);
    if (found) {
      setQuery(found.title);
      setActiveType('all');
      setAssistantAnswer(getAssistantReply(found.title, kb));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const createTicket = () => {
    const subject = newTicketSubject.trim();
    const body = newTicketBody.trim();
    if (!subject) return;

    const nextIdNum = 1100 + tickets.length + 1;
    const id = `T-${nextIdNum}`;

    const newRow: TicketRow = {
      id,
      subject: subject,
      status: 'In Progress',
      date: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' }),
      lastUpdate: 'just now',
    };

    setTickets([newRow, ...tickets]);
    setShowTicketModal(false);
    setNewTicketSubject('');
    setNewTicketBody('');

    setChatMessages((prev) => [
      ...prev,
      {
        id: uid('m'),
        role: 'assistant',
        ts: Date.now(),
        text:
          `Ticket created: ${id}\n\nWhat happened?\n${body || '(no details added)'}\n\nTip: add steps to reproduce, screenshots, and expected vs actual result.`,
      },
    ]);
  };

  const sendChat = () => {
    const text = chatInput.trim();
    if (!text) return;

    const userMsg: ChatMessage = { id: uid('m'), role: 'user', ts: Date.now(), text };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');

    const res = getAssistantReply(text, kb);
    const assistantMsg: ChatMessage = {
      id: uid('m'),
      role: 'assistant',
      ts: Date.now() + 1,
      text: res.answer,
      refs: res.refs,
    };

    window.setTimeout(() => {
      setChatMessages((prev) => [...prev, assistantMsg]);
    }, 250);
  };

  const ticketIcon = (status: TicketStatus) => {
    if (status === 'In Progress') return <Clock className="w-4 h-4" />;
    return <CheckCircle2 className="w-4 h-4" />;
  };

  const ticketIconWrap = (status: TicketStatus) => {
    const base = 'p-2 rounded-full';
    if (status === 'In Progress') return `${base} bg-amber-100 text-amber-600 dark:bg-amber-900/30`;
    if (status === 'Resolved') return `${base} bg-green-100 text-green-600 dark:bg-green-900/30`;
    return `${base} bg-gray-100 text-gray-600 dark:bg-gray-800`;
  };

  const ticketPill = (status: TicketStatus) => {
    const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    if (status === 'In Progress') return `${base} bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400`;
    if (status === 'Resolved') return `${base} bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400`;
    return `${base} bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300`;
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      {/* Hero Search Section */}
      <div className="bg-indigo-600 dark:bg-indigo-900 pt-12 pb-14 px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white px-3 py-1.5 rounded-full text-xs font-semibold mb-4">
            <Sparkles className="w-4 h-4" />
            Support Assistant (offline)
          </div>

          <h2 className="text-3xl font-bold text-white mb-3">How can we help you?</h2>
          <p className="text-indigo-100 mb-7">
            Search your help center. You can also ask the assistant and it will reply using the content in this page.
          </p>

          <div className="bg-white/10 rounded-2xl p-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') runSearch();
                  }}
                  type="text"
                  placeholder='Try "export bookings", "change currency", or "invite team"'
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl shadow-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/30"
                />
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
              </div>

              <button
                onClick={runSearch}
                className="px-4 py-3.5 rounded-xl bg-white text-indigo-700 font-semibold shadow-lg hover:bg-indigo-50 transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Ask Assistant
              </button>
            </div>

            {/* Filter pills */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-indigo-100 font-semibold flex items-center gap-1">
                  <FilterIcon className="w-3.5 h-3.5" />
                  Filter:
                </span>
                {(['all', 'faq', 'guide', 'video'] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setActiveType(k)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${
                      activeType === k ? 'bg-white text-indigo-700' : 'bg-white/10 text-white hover:bg-white/15'
                    }`}
                  >
                    {k === 'all' ? 'All' : k.toUpperCase()}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setChatOpen(true)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-indigo-500/30 text-white hover:bg-indigo-500/40 transition inline-flex items-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Open chat
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-8 -mt-8 pb-12">
        {/* Assistant Answer + Search Results */}
        {(assistantAnswer || filteredResults.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-bold text-gray-900 dark:text-white">Assistant Answer</h3>
                </div>
                <button
                  onClick={() => setAssistantAnswer(null)}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                  title="Hide"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6">
                {!assistantAnswer ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Search above to get an answer and suggested articles.
                  </p>
                ) : (
                  <>
                    <div className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line leading-relaxed">
                      {assistantAnswer.answer}
                    </div>

                    {assistantAnswer.refs?.length > 0 && (
                      <div className="mt-5">
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                          Recommended articles
                        </p>
                        <div className="flex flex-col gap-2">
                          {assistantAnswer.refs.map((r) => (
                            <button
                              key={r.id}
                              onClick={() => openArticleFromRef(r.id)}
                              className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                    {r.title}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Type: {r.type.toUpperCase()}
                                  </p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400 flex-none" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white">Search Results</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Matches in your help center content
                </p>
              </div>

              <div className="p-4">
                {filteredResults.length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    No results yet. Try searching for:
                    <div className="mt-2 space-y-1 text-xs">
                      <div className="px-2 py-1 rounded bg-gray-50 dark:bg-gray-700/40 inline-block">export bookings</div>
                      <div className="px-2 py-1 rounded bg-gray-50 dark:bg-gray-700/40 inline-block ml-2">change currency</div>
                      <div className="px-2 py-1 rounded bg-gray-50 dark:bg-gray-700/40 inline-block ml-2">invite team</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredResults.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => openArticleFromRef(r.id)}
                        className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{r.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{r.content}</p>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 flex-none">
                            {r.type.toUpperCase()}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick Link Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 hover:-translate-y-1 transition-transform duration-300">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
              <Book className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Documentation</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Guides for tours, leads, bookings, settings, and team management.
            </p>
            <button
              onClick={() => {
                setQuery('Getting started');
                runSearch();
              }}
              className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all"
            >
              Browse Articles <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 hover:-translate-y-1 transition-transform duration-300">
            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
              <PlayCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Video Tutorials</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Short walkthroughs for the most common workflows.</p>
            <button
              onClick={() => {
                setActiveType('video');
                setQuery('bookings');
                runSearch();
              }}
              className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all"
            >
              Watch Videos <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 hover:-translate-y-1 transition-transform duration-300">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Community Forum</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Share best practices with other tour agencies.</p>
            <a href="#" className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">
              Visit Community <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Tickets & FAQs */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Tickets */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Recent Support Tickets</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Tickets are stored locally for now. Connect to Supabase later to persist them.
                  </p>
                </div>
                <button
                  onClick={() => setShowTicketModal(true)}
                  className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-2 rounded-lg transition inline-flex items-center gap-2"
                >
                  <Ticket className="w-4 h-4" />
                  New ticket
                </button>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className={ticketIconWrap(ticket.status)}>{ticketIcon(ticket.status)}</div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{ticket.subject}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {ticket.id} • Last updated {ticket.lastUpdate}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={ticketPill(ticket.status)}>{ticket.status}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700 text-center">
                <button
                  onClick={() => setShowTicketModal(true)}
                  className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  + Create New Ticket
                </button>
              </div>
            </div>

            {/* FAQs */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between gap-4 mb-6">
                <h3 className="font-bold text-gray-900 dark:text-white">Frequently Asked Questions</h3>
                <button
                  onClick={() => {
                    setQuery('Getting started');
                    runSearch();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Ask the assistant
                </button>
              </div>

              <div className="space-y-4">
                {FAQS.map((faq, idx) => (
                  <div key={idx} className="border border-gray-100 dark:border-gray-700 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="w-full flex items-center justify-between p-4 text-left bg-gray-50/50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <span className="font-medium text-gray-900 dark:text-white text-sm">{faq.question}</span>
                      {openFaqIndex === idx ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                    {openFaqIndex === idx && (
                      <div className="p-4 bg-white dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-700 leading-relaxed">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Contact Cards */}
          <div className="space-y-6">
            <h3 className="font-bold text-gray-900 dark:text-white px-1">Contact Support</h3>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-start gap-4">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg text-indigo-600 dark:text-indigo-400">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-sm">Live Chat</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-3">
                  This is an offline assistant right now. Connect to a backend later for human chat.
                </p>
                <button
                  onClick={() => setChatOpen(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Start Chat
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-start gap-4">
              <div className="bg-pink-50 dark:bg-pink-900/20 p-3 rounded-lg text-pink-600 dark:text-pink-400">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-sm">Email Us</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-3">Response within 24 hours.</p>
                <a href="mailto:support@tourcrm.com" className="text-xs font-semibold text-pink-600 hover:underline">
                  support@tourcrm.com
                </a>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-start gap-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg text-amber-600 dark:text-amber-400">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-sm">Phone Support</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-3">For urgent issues (Premium only).</p>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">+1 (800) 123-4567</span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <h4 className="font-bold text-gray-900 dark:text-white text-sm">About the "free AI"</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                This assistant is free because it does not call any paid API. It only uses the help content inside this page.
                If you want real AI answers from your full system data later, you will need a backend (self-hosted open-source model, or a paid API).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Ticket Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowTicketModal(false)}
          />
          <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Create a support ticket</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Tip: include steps, expected result, and screenshots.
                </p>
              </div>
              <button
                onClick={() => setShowTicketModal(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Subject
                </label>
                <input
                  value={newTicketSubject}
                  onChange={(e) => setNewTicketSubject(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600 rounded-lg py-2.5 px-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder='Example: "Booking export is empty"'
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Details
                </label>
                <textarea
                  value={newTicketBody}
                  onChange={(e) => setNewTicketBody(e.target.value)}
                  rows={5}
                  className="w-full bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600 rounded-lg py-2.5 px-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="What were you trying to do? What happened instead?"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowTicketModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={createTicket}
                  disabled={!newTicketSubject.trim()}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Drawer */}
      {chatOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setChatOpen(false)} />

          <div className="relative w-full max-w-md h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">Support Assistant</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Offline - answers from your help content</p>
                </div>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-line ${
                      m.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    {m.text}

                    {m.role === 'assistant' && m.refs && m.refs.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/10">
                        <p className="text-[10px] font-bold opacity-70 uppercase tracking-wide mb-2">
                          References
                        </p>
                        <div className="flex flex-col gap-2">
                          {m.refs.slice(0, 3).map((r) => (
                            <button
                              key={r.id}
                              onClick={() => openArticleFromRef(r.id)}
                              className="text-left text-xs px-3 py-2 rounded-lg bg-white/70 dark:bg-gray-900/40 hover:bg-white dark:hover:bg-gray-900 transition border border-black/5 dark:border-white/10"
                            >
                              {r.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') sendChat();
                  }}
                  placeholder='Ask something, for example "How do I export bookings?"'
                  className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 px-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <button
                  onClick={sendChat}
                  className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition"
                  title="Send"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                Note: This is a free offline assistant. For real AI with your database, plug in a backend later.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportPage;
