import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Tag, FileText, UserPlus, DollarSign, Building } from 'lucide-react';
import { LeadStatus, NotificationType } from '../../types';
import { MOCK_TEAM_MEMBERS } from '../../data/mockData';
import { LayoutService, LayoutField } from '../../services/layoutService';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  addNotification?: (payload: { title: string; description?: string; type: NotificationType; actionLink?: string }) => void;
}

const AddLeadModal: React.FC<AddLeadModalProps> = ({ isOpen, onClose, addNotification }) => {
  const [layout, setLayout] = useState<LayoutField[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({
    status: 'New',
    assignedTo: ''
  });

  // Load layout on open
  useEffect(() => {
    if (isOpen) {
      const fields = LayoutService.getLayout('Leads');
      setLayout(fields.filter(f => f.visible));
      
      // Initialize form with defaults based on layout
      const initialData: Record<string, any> = { status: 'New', assignedTo: '' };
      fields.forEach(f => {
        initialData[f.id] = '';
      });
      setFormData(initialData);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('New Lead Submitted:', formData);
    
    if (addNotification) {
        addNotification({
            title: 'New Lead Inquired',
            description: `${formData.name || 'New Lead'} reached out.`,
            type: 'lead'
        });
    }
    onClose();
  };

  const renderField = (field: LayoutField) => {
    const commonClasses = "block w-full py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700/50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow";
    
    // Icon mapping
    let Icon = Tag;
    if (field.id === 'name') Icon = User;
    else if (field.id === 'email') Icon = Mail;
    else if (field.id === 'phone') Icon = Phone;
    else if (field.id === 'value') Icon = DollarSign;
    else if (field.id === 'notes') Icon = FileText;
    else if (field.id === 'company') Icon = Building;

    switch (field.type) {
      case 'textarea':
        return (
          <div className="relative">
            <div className="absolute left-3 top-3 pointer-events-none">
              <Icon className="h-4 w-4 text-gray-400" />
            </div>
            <textarea
              id={field.id}
              required={field.required}
              rows={3}
              className={`${commonClasses} pl-10 pr-3 resize-none`}
              placeholder={`Enter ${field.label.toLowerCase()}...`}
              value={formData[field.id] || ''}
              onChange={(e) => setFormData({...formData, [field.id]: e.target.value})}
            />
          </div>
        );
      
      case 'select':
        return (
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon className="h-4 w-4 text-gray-400" />
            </div>
            <select
              id={field.id}
              required={field.required}
              className={`${commonClasses} pl-10 pr-3 appearance-none`}
              value={formData[field.id] || ''}
              onChange={(e) => setFormData({...formData, [field.id]: e.target.value})}
            >
              <option value="">Select option</option>
              {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        );

      default:
        return (
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type={field.type}
              id={field.id}
              required={field.required}
              className={`${commonClasses} pl-10 pr-3`}
              placeholder={`Enter ${field.label.toLowerCase()}...`}
              value={formData[field.id] || ''}
              onChange={(e) => setFormData({...formData, [field.id]: e.target.value})}
            />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto" role="dialog" aria-modal="true">
      <div 
        className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      <div className="flex items-center justify-center min-h-screen p-4 text-center sm:p-0">
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:max-w-lg w-full border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh]">
          
          {/* Header */}
          <div className="flex-none bg-white dark:bg-gray-800 px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
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
          
          <div className="flex-1 overflow-y-auto p-6">
            <form id="add-lead-form" onSubmit={handleSubmit} className="space-y-5">
                {layout.map(field => (
                    <div key={field.id}>
                        <label htmlFor={field.id} className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        {renderField(field)}
                    </div>
                ))}

                {/* Static Status & Assigned To (Often separate from generic layout in CRM) */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">Status</label>
                        <div className="relative">
                            <select
                                className="block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700/50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm appearance-none"
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
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">Assigned To</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <UserPlus className="h-4 w-4 text-gray-400" />
                            </div>
                            <select
                                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700/50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm appearance-none"
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
            </form>
          </div>

          {/* Footer */}
          <div className="flex-none bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex flex-row-reverse gap-3 border-t border-gray-100 dark:border-gray-700">
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
