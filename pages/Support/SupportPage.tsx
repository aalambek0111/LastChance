import React, { useMemo, useState } from 'react';
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
} from 'lucide-react';
import { useI18n } from '../../context/ThemeContext';

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

function normalize(text: string) {
  return (text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreMatch(query: string, item: KBItem) {
  const q = normalize(query);
  if (!q) return 0;

  const hay = normalize([item.title, item.summary, item.body, item.tags.join(' ')].join(' '));
  if (!hay) return 0;

  const qTokens = q.split(' ').filter(Boolean);
  let score = 0;

  // Strong signals
  if (hay.includes(q)) score += 30;
  if (normalize(item.title).includes(q)) score += 25;

  // Token overlap
  for (const tok of qTokens) {
    if (tok.length < 2) continue;
    if (normalize(item.title).includes(tok)) score += 8;
    else if (normalize(item.summary).includes(tok)) score += 5;
    else if (hay.includes(tok)) score += 2;
  }

  return score;
}

function buildAssistantAnswer(query: string, matches: KBItem[]) {
  const q = normalize(query);
  if (!q) {
    return {
      text:
        'Ask me something like: "How do I add a tour?", "How to export bookings?", or "Where do I change currency?"',
      related: matches.slice(0, 2),
    };
  }

  if (!matches.length) {
    return {
      text:
        'I could not find an exact match in the help content yet. Try different keywords (example: "export", "currency", "invite").',
      related: [],
    };
  }

  const best = matches[0];
  const related = matches.slice(0, 2);

  return {
    text:
      `Here is what I found in **${best.title}**:\n\n` +
      `${best.body}\n\n` +
      `If you want, I can also suggest related articles.`,
    related,
  };
}

type ChatMsg = { id: string; role: 'user' | 'assistant'; text: string };

const SupportPage: React.FC = () => {
  const { t } = useI18n();

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ContentType>('ALL');

  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantInput, setAssistantInput] = useState('');
  const [chat, setChat] = useState<ChatMsg[]>([
    {
      id: 'a1',
      role: 'assistant',
      text:
        'Hi - I am your Support Assistant (offline). I can answer using the help content on this page. Ask me anything about Tours, Leads, Bookings, Settings, or Team.',
    },
  ]);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const filteredKb = useMemo(() => {
    if (filter === 'ALL') return KB;
    return KB.filter((k) => k.type === filter);
  }, [filter]);

  const results = useMemo(() => {
    const q = normalize(query);
    if (!q) return [];
    const scored = filteredKb
      .map((item) => ({ item, score: scoreMatch(q, item) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((x) => x.item);

    return scored;
  }, [query, filteredKb]);

  const assistant = useMemo(() => {
    return buildAssistantAnswer(query, results);
  }, [query, results]);

  const quickFaqs = useMemo(() => KB.filter((x) => x.type === 'FAQ').slice(0, 6), []);

  const sendAssistantMessage = () => {
    const text = assistantInput.trim();
    if (!text) return;

    const localResults = KB
      .map((item) => ({ item, score: scoreMatch(text, item) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((x) => x.item);

    const answer = buildAssistantAnswer(text, localResults);

    setChat((prev) => [
      ...prev,
      { id: crypto.randomUUID?.() ?? String(Date.now()), role: 'user', text },
      {
        id: crypto.randomUUID?.() ?? String(Date.now() + 1),
        role: 'assistant',
        text: answer.text,
      },
    ]);

    setAssistantInput('');
  };

  const Chip: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({
    active,
    onClick,
    label,
  }) => (
    <button
      onClick={onClick}
      className={[
        'px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border',
        active
          ? 'bg-white text-indigo-700 border-white'
          : 'bg-indigo-500/20 text-indigo-100 border-indigo-300/20 hover:bg-indigo-500/30',
      ].join(' ')}
      type="button"
    >
      {label}
    </button>
  );

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      {/* Hero */}
      <div className="bg-indigo-600 dark:bg-indigo-900 pt-10 pb-16 px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-50 text-xs font-semibold mb-4">
            <Sparkles className="w-4 h-4" />
            Support Assistant (offline)
          </div>

          <h2 className="text-3xl font-bold text-white mb-3">{t?.('How can we help you?') ?? 'Support'}</h2>
          <p className="text-indigo-100 mb-8">
            Search your help center. You can also ask the assistant and it will reply using the content in this page.
          </p>

          <div className="bg-white/10 border border-white/10 rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="relative flex-1">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  type="text"
                  placeholder="Search e.g. 'export bookings', 'change currency', 'invite team'..."
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/30"
                />
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAssistantOpen(true)}
                  className="px-4 py-3 rounded-xl bg-white text-indigo-700 font-semibold text-sm hover:bg-indigo-50 transition flex items-center gap-2"
                >
                  <Bot className="w-4 h-4" />
                  Ask Assistant
                </button>
                <button
                  type="button"
                  onClick={() => setAssistantOpen((v) => !v)}
                  className="px-4 py-3 rounded-xl bg-indigo-500/20 text-white font-semibold text-sm hover:bg-indigo-500/30 transition"
                >
                  {assistantOpen ? 'Close chat' : 'Open chat'}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              <span className="text-indigo-100 text-xs font-semibold mr-1">Filter:</span>
              <Chip active={filter === 'ALL'} onClick={() => setFilter('ALL')} label="All" />
              <Chip active={filter === 'FAQ'} onClick={() => setFilter('FAQ')} label="FAQ" />
              <Chip active={filter === 'GUIDE'} onClick={() => setFilter('GUIDE')} label="Guide" />
              <Chip active={filter === 'VIDEO'} onClick={() => setFilter('VIDEO')} label="Video" />
            </div>
          </div>
        </div>
      </div>

      {/* Main content (FIX: z-20 so it is never hidden under the hero) */}
      <div className="max-w-6xl mx-auto px-6 lg:px-8 -mt-10 pb-12 relative z-20">
        {/* Quick links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 hover:-translate-y-1 transition-transform duration-300">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
              <Book className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Documentation</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Guides for tours, leads, bookings, team, and settings.
            </p>
            <button className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">
              Browse Articles <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 hover:-translate-y-1 transition-transform duration-300">
            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
              <PlayCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Video Tutorials</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Quick walkthroughs for common workflows.
            </p>
            <button className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">
              Watch Videos <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 hover:-translate-y-1 transition-transform duration-300">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Community</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Share tips with other tour operators.
            </p>
            <button className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">
              Visit Community <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Results + Assistant answer */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left */}
          <div className="lg:col-span-2 space-y-8">
            {/* Assistant answer panel */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-bold text-gray-900 dark:text-white">Assistant Answer</h3>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200">
                  Offline
                </span>
              </div>

              <div className="p-6">
                <div className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                  {assistant.text}
                </div>

                {assistant.related.length > 0 && (
                  <div className="mt-5">
                    <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      Related
                    </div>
                    <div className="space-y-2">
                      {assistant.related.map((r) => (
                        <div
                          key={r.id}
                          className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-gray-900 dark:text-white">{r.title}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{r.summary}</div>
                            </div>
                            <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                              {r.type}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Search results */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h3 className="font-bold text-gray-900 dark:text-white">Search Results</h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {query.trim() ? `${results.length} match(es)` : 'Type to search'}
                </span>
              </div>

              <div className="p-6">
                {!query.trim() ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Try searching for “export”, “currency”, “invite”, or “create tour”.
                  </div>
                ) : results.length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    No results. Try different keywords.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {results.map((r) => (
                      <div
                        key={r.id}
                        className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">{r.title}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{r.summary}</div>
                          </div>
                          <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                            {r.type}
                          </span>
                        </div>
                        <div className="mt-3 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                          {r.body}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* FAQs */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h3>
              <div className="space-y-4">
                {quickFaqs.map((faq, idx) => (
                  <div key={faq.id} className="border border-gray-100 dark:border-gray-700 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="w-full flex items-center justify-between p-4 text-left bg-gray-50/50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                      type="button"
                    >
                      <span className="font-medium text-gray-900 dark:text-white text-sm">{faq.title}</span>
                      {openFaqIndex === idx ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                    {openFaqIndex === idx && (
                      <div className="p-4 bg-white dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-700 leading-relaxed">
                        {faq.body}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column - contact */}
          <div className="space-y-6">
            <h3 className="font-bold text-gray-900 dark:text-white px-1">Contact Support</h3>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-start gap-4">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg text-indigo-600 dark:text-indigo-400">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-sm">Live Chat</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-3">Available Mon-Fri, 9am - 5pm.</p>
                <button
                  onClick={() => setAssistantOpen(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"
                  type="button"
                >
                  Open Assistant Chat
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

            {/* Example "tickets" block (optional) */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                <h4 className="font-bold text-gray-900 dark:text-white text-sm">Recent Tickets</h4>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { id: 'T-1024', subject: 'Integration with Stripe', status: 'In Progress', lastUpdate: '2h ago' },
                  { id: 'T-1023', subject: 'Email notifications not sending', status: 'Resolved', lastUpdate: '1d ago' },
                ].map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={[
                          'p-2 rounded-full',
                          ticket.status === 'In Progress'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/30',
                        ].join(' ')}
                      >
                        {ticket.status === 'In Progress' ? <Clock className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{ticket.subject}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {ticket.id} - Last updated {ticket.lastUpdate}
                        </div>
                      </div>
                    </div>
                    <span
                      className={[
                        'text-[11px] font-bold px-2 py-1 rounded-full',
                        ticket.status === 'In Progress'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
                          : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300',
                      ].join(' ')}
                    >
                      {ticket.status}
                    </span>
                  </div>
                ))}
                <button
                  type="button"
                  className="w-full mt-1 px-3 py-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition"
                >
                  + Create New Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assistant Chat Drawer */}
      {assistantOpen && (
        <div className="fixed right-6 bottom-6 w-[380px] max-w-[92vw] z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">Support Assistant</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Offline - uses your help content</div>
                </div>
              </div>
              <button
                onClick={() => setAssistantOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition"
                type="button"
                aria-label="Close assistant"
              >
                <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            <div className="max-h-[360px] overflow-y-auto p-4 space-y-3">
              {chat.map((m) => (
                <div
                  key={m.id}
                  className={[
                    'text-sm rounded-2xl px-3 py-2 leading-relaxed whitespace-pre-wrap',
                    m.role === 'user'
                      ? 'bg-indigo-600 text-white ml-10'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200 mr-10',
                  ].join(' ')}
                >
                  {m.text}
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <input
                  value={assistantInput}
                  onChange={(e) => setAssistantInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') sendAssistantMessage();
                  }}
                  placeholder="Ask a question..."
                  className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
                <button
                  onClick={sendAssistantMessage}
                  className="px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center gap-2"
                  type="button"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
                Tip: Ask “export bookings”, “change currency”, “invite team”, “create tour”.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportPage;
