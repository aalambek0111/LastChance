import React, { useState } from 'react';
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
   CheckCircle2
} from 'lucide-react';
import { useI18n } from '../../context/ThemeContext';

// Mock Data
const FAQS = [
   { question: 'How do I add a new tour?', answer: 'Navigate to the Tours tab and click the "Create Tour" button in the top right corner. Fill in the required details like name, price, and duration.' },
   { question: 'Can I export my booking data?', answer: 'Yes, go to the Bookings page and click the "Export" button. You can download data in CSV or PDF format.' },
   { question: 'How do I change my currency settings?', answer: 'Go to Settings > Workspace Settings. You can select your preferred currency from the dropdown menu.' },
   { question: 'Is there a limit to the number of leads?', answer: 'No, our current plan allows for unlimited lead tracking and management.' },
];

const TICKETS = [
   { id: 'T-1024', subject: 'Integration with Stripe', status: 'In Progress', date: 'Oct 24, 2023', lastUpdate: '2h ago' },
   { id: 'T-1023', subject: 'Email notifications not sending', status: 'Resolved', date: 'Oct 22, 2023', lastUpdate: '1d ago' },
   { id: 'T-1020', subject: 'Billing invoice correction', status: 'Closed', date: 'Oct 15, 2023', lastUpdate: '1w ago' },
];

const SupportPage: React.FC = () => {
   const { t } = useI18n();
   const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

   const toggleFaq = (index: number) => {
      setOpenFaqIndex(openFaqIndex === index ? null : index);
   };

   return (
      <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
         {/* Hero Search Section */}
         <div className="bg-indigo-600 dark:bg-indigo-900 pt-12 pb-16 px-6 lg:px-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <div className="relative z-10 max-w-2xl mx-auto">
               <h2 className="text-3xl font-bold text-white mb-4">How can we help you?</h2>
               <p className="text-indigo-100 mb-8">Search our knowledge base or get in touch with our team.</p>
               <div className="relative">
                  <input 
                     type="text" 
                     placeholder="Search for articles, guides, and more..." 
                     className="w-full pl-12 pr-4 py-4 rounded-xl shadow-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/30"
                  />
                  <Search className="absolute left-4 top-4 w-6 h-6 text-gray-400" />
               </div>
            </div>
         </div>

         <div className="max-w-6xl mx-auto px-6 lg:px-8 -mt-8 pb-12">
            {/* Quick Link Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
               <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 hover:-translate-y-1 transition-transform duration-300">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                     <Book className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Documentation</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Detailed guides on how to use every feature of TourCRM.</p>
                  <a href="#" className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                     Browse Articles <ChevronRight className="w-4 h-4" />
                  </a>
               </div>
               
               <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 hover:-translate-y-1 transition-transform duration-300">
                  <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
                     <PlayCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Video Tutorials</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Step-by-step video walkthroughs for setting up your account.</p>
                  <a href="#" className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                     Watch Videos <ChevronRight className="w-4 h-4" />
                  </a>
               </div>

               <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 hover:-translate-y-1 transition-transform duration-300">
                  <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
                     <LifeBuoy className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Community Forum</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Connect with other tour agencies and share best practices.</p>
                  <a href="#" className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                     Visit Community <ExternalLink className="w-3 h-3" />
                  </a>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               {/* Left Column: Tickets & Contact */}
               <div className="lg:col-span-2 space-y-8">
                  {/* Recent Tickets */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                     <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900 dark:text-white">Recent Support Tickets</h3>
                        <button className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline">View All</button>
                     </div>
                     <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {TICKETS.map(ticket => (
                           <div key={ticket.id} className="p-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                 <div className={`p-2 rounded-full ${
                                    ticket.status === 'In Progress' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' :
                                    ticket.status === 'Resolved' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' :
                                    'bg-gray-100 text-gray-600 dark:bg-gray-800'
                                 }`}>
                                    {ticket.status === 'In Progress' ? <Clock className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                 </div>
                                 <div>
                                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{ticket.subject}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">ID: {ticket.id} • Last updated {ticket.lastUpdate}</p>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    ticket.status === 'In Progress' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' :
                                    ticket.status === 'Resolved' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                                    'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                 }`}>
                                    {ticket.status}
                                 </span>
                              </div>
                           </div>
                        ))}
                     </div>
                     <div className="p-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700 text-center">
                        <button className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                           + Create New Ticket
                        </button>
                     </div>
                  </div>

                  {/* FAQs */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                     <h3 className="font-bold text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h3>
                     <div className="space-y-4">
                        {FAQS.map((faq, idx) => (
                           <div key={idx} className="border border-gray-100 dark:border-gray-700 rounded-lg overflow-hidden">
                              <button 
                                 onClick={() => toggleFaq(idx)}
                                 className="w-full flex items-center justify-between p-4 text-left bg-gray-50/50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                              >
                                 <span className="font-medium text-gray-900 dark:text-white text-sm">{faq.question}</span>
                                 {openFaqIndex === idx ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
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
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-3">Available Mon-Fri, 9am - 5pm EST.</p>
                        <button className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors">Start Chat</button>
                     </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-start gap-4">
                     <div className="bg-pink-50 dark:bg-pink-900/20 p-3 rounded-lg text-pink-600 dark:text-pink-400">
                        <Mail className="w-5 h-5" />
                     </div>
                     <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">Email Us</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-3">Response within 24 hours.</p>
                        <a href="mailto:support@tourcrm.com" className="text-xs font-semibold text-pink-600 hover:underline">support@tourcrm.com</a>
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
               </div>
            </div>
         </div>
      </div>
   );
};

export default SupportPage;