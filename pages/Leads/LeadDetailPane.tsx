import React, { useState, useEffect } from 'react';
import { X, MessageCircle, Phone, Mail, Building, Save } from 'lucide-react';
import { Lead, LeadStatus } from '../../types';

interface LeadDetailPaneProps {
  lead: Lead;
  onClose: () => void;
  onSave: (l: Lead) => void;
  onOpenChat: () => void;
}

const LeadDetailPane: React.FC<LeadDetailPaneProps> = ({ lead, onClose, onSave, onOpenChat }) => {
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

export default LeadDetailPane;