
import React, { useState } from 'react';
import { X, User, Mail, Phone, Tag, FileText, UserPlus } from 'lucide-react';
import { LeadStatus, NotificationType } from '../../types';
import { MOCK_TEAM_MEMBERS } from '../../data/mockData';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  addNotification?: (payload: { title: string; description?: string; type: NotificationType; actionLink?: string }) => void;
}

const AddLeadModal: React.FC<AddLeadModalProps> = ({ isOpen, onClose, addNotification }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    channel: 'Website',
    status: 'New' as LeadStatus,
    assignedTo: '',
    notes: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('New Lead Submitted:', formData);
    
    // Trigger notification for the team
    if (addNotification) {
        addNotification({
            title: 'New Lead Inquired',
            description: `${formData.name} reached out via ${formData.channel}.`,
            type: 'lead'
        });
    }

    setFormData({ 
        name: '', 
        email: '', 
        phone: '', 
        channel: 'Website',
        status: 'New',
        assignedTo: '',
        notes: ''
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Background Overlay with Blur */}
      <div 
        className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      <div className="flex items-center justify-center min-h-screen p-4 text-center sm:p-0">
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:max-w-md w-full border border-gray-100 dark:border-gray-700">
          
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white" id="modal-title">
                Add New Lead
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Enter details to track a new opportunity.</p>
            </div>
            <button 
              onClick={onClose}
              className="bg-gray-50 dark:bg-gray-700 rounded-full p-1.5 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <form id="add-lead-form" onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="name"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700/50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow"
                  placeholder="e.g. Sarah Jenkins"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">
                Email Address <span className="text-gray-400 font-normal normal-case">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700/50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow"
                  placeholder="sarah@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            {/* Phone & Channel */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">
                  Phone <span className="text-gray-400 font-normal normal-case">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700/50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow"
                    placeholder="+1 (555)..."
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="channel" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">
                  Channel
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Tag className="h-4 w-4 text-gray-400" />
                  </div>
                  <select
                    id="channel"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700/50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow appearance-none"
                    value={formData.channel}
                    onChange={(e) => setFormData({...formData, channel: e.target.value})}
                  >
                    <option>Website</option>
                    <option>Referral</option>
                    <option>Social Media</option>
                    <option>Walk-in</option>
                    <option>WhatsApp</option>
                    <option>Email</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Status & Assigned To */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="status" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">
                    Status
                    </label>
                    <div className="relative">
                        <select
                            id="status"
                            className="block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700/50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow appearance-none"
                            value={formData.status}
                            onChange={(e) => setFormData({...formData, status: e.target.value as LeadStatus})}
                        >
                            <option value="New">New</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Qualified">Qualified</option>
                            <option value="Booked">Booked</option>
                            <option value="Lost">Lost</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label htmlFor="assignedTo" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">
                    Assigned To
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <UserPlus className="h-4 w-4 text-gray-400" />
                        </div>
                        <select
                            id="assignedTo"
                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700/50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow appearance-none"
                            value={formData.assignedTo}
                            onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
                        >
                            <option value="">Unassigned</option>
                            {MOCK_TEAM_MEMBERS.map(member => (
                                <option key={member.id} value={member.name}>{member.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">
                Notes <span className="text-gray-400 font-normal normal-case">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-3 pointer-events-none">
                  <FileText className="h-4 w-4 text-gray-400" />
                </div>
                <textarea
                  id="notes"
                  rows={3}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700/50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow resize-none"
                  placeholder="Add any additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex flex-row-reverse gap-3">
            <button
              type="submit"
              form="add-lead-form"
              className="inline-flex justify-center rounded-lg border border-transparent shadow-sm px-5 py-2.5 bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all active:scale-95"
            >
              Add Lead
            </button>
            <button
              type="button"
              className="inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm px-5 py-2.5 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddLeadModal;
