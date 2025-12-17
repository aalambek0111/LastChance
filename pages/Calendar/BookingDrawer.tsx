
import React, { useState, useEffect } from 'react';
import { 
  X, Calendar, Clock, MapPin, Users, FileText, User, 
  CheckCircle, AlertCircle, Trash2, Save 
} from 'lucide-react';
import { Booking, BookingStatus } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';

interface BookingDrawerProps {
  booking: Booking | null;
  onClose: () => void;
  onSave: (updated: Booking) => void;
  onDelete?: (id: string) => void;
}

const BookingDrawer: React.FC<BookingDrawerProps> = ({ booking, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState<Booking | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (booking) {
      setFormData({ ...booking });
      setIsEditing(false); // Reset edit mode on open
    } else {
      setFormData(null);
    }
  }, [booking]);

  if (!booking || !formData) return null;

  const handleChange = (field: keyof Booking, value: any) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSave = () => {
    if (formData) {
      onSave(formData);
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (onDelete && window.confirm('Are you sure you want to delete this booking?')) {
      onDelete(formData.id);
      onClose();
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 shadow-2xl">
      {/* Header */}
      <div className="flex-none px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-start justify-between bg-white dark:bg-gray-800 z-10">
        <div>
          <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            Booking Details
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
            {formData.tourName}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={formData.status} type="booking" />
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{formData.bookingNo || formData.id}</span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Date & Time */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" /> Date & Time
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Date</label>
              {isEditing ? (
                <input 
                  type="date" 
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <div className="font-medium text-gray-900 dark:text-white text-sm">{formData.date}</div>
              )}
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Time</label>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input 
                    type="time" 
                    value={formData.startTime || ''}
                    onChange={(e) => handleChange('startTime', e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span>-</span>
                  <input 
                    type="time" 
                    value={formData.endTime || ''}
                    onChange={(e) => handleChange('endTime', e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ) : (
                <div className="font-medium text-gray-900 dark:text-white text-sm">
                  {formData.startTime ? `${formData.startTime} - ${formData.endTime || '?'}` : 'All Day'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Client & Pax */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" /> Client Details
          </h3>
          <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Client Name</label>
              {isEditing ? (
                <input 
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => handleChange('clientName', e.target.value)}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <div className="font-medium text-gray-900 dark:text-white">{formData.clientName}</div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Pax</label>
                {isEditing ? (
                  <input 
                    type="number"
                    min="1"
                    value={formData.people}
                    onChange={(e) => handleChange('people', parseInt(e.target.value))}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                ) : (
                  <div className="font-medium text-gray-900 dark:text-white">{formData.people} Guests</div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Status</label>
                {isEditing ? (
                  <select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Confirmed">Confirmed</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                ) : (
                  <div className="font-medium text-gray-900 dark:text-white">{formData.status}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Logistics */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" /> Logistics
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Pickup Location</label>
              {isEditing ? (
                <input 
                  type="text"
                  value={formData.pickupLocation || ''}
                  onChange={(e) => handleChange('pickupLocation', e.target.value)}
                  placeholder="No pickup set"
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <div className="text-sm text-gray-700 dark:text-gray-300">{formData.pickupLocation || 'No pickup location set'}</div>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Assigned Guide</label>
              {isEditing ? (
                <input 
                  type="text"
                  value={formData.assignedTo || ''}
                  onChange={(e) => handleChange('assignedTo', e.target.value)}
                  placeholder="Unassigned"
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{formData.assignedTo || 'Unassigned'}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-400" /> Notes
          </h3>
          {isEditing ? (
            <textarea 
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={4}
              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Add internal notes..."
            />
          ) : (
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300 min-h-[80px]">
              {formData.notes || 'No notes available.'}
            </div>
          )}
        </div>

      </div>

      {/* Footer Actions */}
      <div className="flex-none px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex gap-3">
        {isEditing ? (
          <>
            <button 
              onClick={() => setIsEditing(false)}
              className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </>
        ) : (
          <>
            {onDelete && (
              <button 
                onClick={handleDelete}
                className="px-3 py-2 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button 
              onClick={() => setIsEditing(true)}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
            >
              Edit Booking
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default BookingDrawer;
