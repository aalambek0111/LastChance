import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, MapPin, Users, FileText, Flag, User } from 'lucide-react';
import { Booking } from '../../types';
import { TOURS, RECENT_LEADS } from '../../data/mockData';

interface CreateBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadName?: string;
  onBookingCreated?: (booking: Booking) => void;
  bookingToEdit?: Booking | null;
  onBookingUpdated?: (booking: Booking) => void;
}

// Helper Component for Searchable Dropdowns
interface SearchableSelectProps {
  label: string;
  icon: React.ReactNode;
  options: { id: string | number; label: string; subLabel?: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ 
  label, 
  icon, 
  options, 
  value, 
  onChange, 
  placeholder 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync internal search term with external value
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  // Handle click outside to close and reset search term if no selection made
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm(value); // Revert to last valid selected value
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef, value]);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1.5">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
           {icon}
        </div>
        <input 
          type="text" 
          className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700/50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {isOpen && (
          <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex flex-col border-b border-gray-50 dark:border-gray-700 last:border-0"
                  onClick={() => {
                    onChange(opt.label);
                    setIsOpen(false);
                  }}
                >
                  <span className="font-medium">{opt.label}</span>
                  {opt.subLabel && <span className="text-xs text-gray-500 dark:text-gray-400">{opt.subLabel}</span>}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                No matching results
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const CreateBookingModal: React.FC<CreateBookingModalProps> = ({ 
  isOpen, 
  onClose, 
  leadName = '', 
  onBookingCreated,
  bookingToEdit,
  onBookingUpdated
}) => {
  const [formData, setFormData] = useState({
    tourName: '',
    clientName: '',
    date: '',
    pax: 2,
    pickupLocation: '',
    notes: ''
  });

  // Prepare data for search fields
  const clientOptions = [
    ...RECENT_LEADS.map(lead => ({ id: lead.id, label: lead.name, subLabel: `${lead.channel} • ${lead.status}` })),
    { id: 'walk-in', label: 'Walk-in Client', subLabel: 'Direct Booking' }
  ];

  const tourOptions = TOURS.map(tour => ({ 
    id: tour.id, 
    label: tour.name, 
    subLabel: `${tour.duration} • $${tour.price}` 
  }));

  // Populate form when editing or reset when creating
  useEffect(() => {
    if (bookingToEdit) {
      setFormData({
        tourName: bookingToEdit.tourName,
        clientName: bookingToEdit.clientName,
        date: bookingToEdit.date,
        pax: bookingToEdit.people,
        pickupLocation: bookingToEdit.pickupLocation || '',
        notes: bookingToEdit.notes || ''
      });
    } else {
      setFormData({
        tourName: '',
        clientName: leadName && leadName !== 'New Client' ? leadName : '',
        date: new Date().toISOString().split('T')[0],
        pax: 2,
        pickupLocation: '',
        notes: ''
      });
    }
  }, [bookingToEdit, isOpen, leadName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (bookingToEdit && onBookingUpdated) {
      // Handle Update
      const updatedBooking: Booking = {
        ...bookingToEdit,
        tourName: formData.tourName,
        clientName: formData.clientName || 'Unknown Client',
        date: formData.date,
        people: formData.pax,
        pickupLocation: formData.pickupLocation,
        notes: formData.notes
      };
      onBookingUpdated(updatedBooking);
    } else {
      // Handle Create
      const newBooking: Booking = {
        id: `B${Date.now()}`,
        tourName: formData.tourName,
        date: formData.date,
        clientName: formData.clientName || 'Unknown Client',
        people: formData.pax,
        status: 'Pending',
        pickupLocation: formData.pickupLocation,
        notes: formData.notes
      };

      if (onBookingCreated) {
        onBookingCreated(newBooking);
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto" role="dialog" aria-modal="true">
      <div 
        className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md border border-gray-100 dark:border-gray-700 shadow-2xl transform transition-all">
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {bookingToEdit ? 'Edit Booking' : 'Create New Booking'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enter details below
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            {/* Searchable Client Selection */}
            <SearchableSelect 
              label="Client"
              icon={<User className="w-4 h-4 text-gray-400" />}
              options={clientOptions}
              value={formData.clientName}
              onChange={(val) => setFormData({ ...formData, clientName: val })}
              placeholder="Select a lead..."
            />

            {/* Searchable Tour Selection */}
            <SearchableSelect 
              label="Tour Name"
              icon={<Flag className="w-4 h-4 text-gray-400" />}
              options={tourOptions}
              value={formData.tourName}
              onChange={(val) => setFormData({ ...formData, tourName: val })}
              placeholder="Select a tour..."
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1.5">Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <Calendar className="w-4 h-4 text-gray-400" />
                  </div>
                  <input 
                    type="date" 
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700/50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1.5">Pax</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <Users className="w-4 h-4 text-gray-400" />
                  </div>
                  <input 
                    type="number" 
                    min="1"
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700/50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.pax}
                    onChange={e => setFormData({...formData, pax: parseInt(e.target.value)})}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1.5">Pickup Location</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <MapPin className="w-4 h-4 text-gray-400" />
                </div>
                <input 
                  type="text" 
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700/50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g. Hotel Grand Central"
                  value={formData.pickupLocation}
                  onChange={e => setFormData({...formData, pickupLocation: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1.5">Notes</label>
              <div className="relative">
                <div className="absolute left-3 top-3 pointer-events-none">
                   <FileText className="w-4 h-4 text-gray-400" />
                </div>
                <textarea 
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700/50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm resize-none"
                  rows={3}
                  placeholder="Dietary requirements, special requests..."
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                />
              </div>
            </div>

            <div className="pt-4 flex flex-row-reverse gap-3">
              <button 
                type="submit" 
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm active:scale-95"
              >
                {bookingToEdit ? 'Save Changes' : 'Create Booking'}
              </button>
              <button 
                type="button" 
                onClick={onClose} 
                className="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 py-2.5 rounded-lg text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateBookingModal;