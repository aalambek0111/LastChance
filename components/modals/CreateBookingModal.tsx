
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X, Calendar, MapPin, Users, FileText, Flag, User, MessageSquare, Activity,
  ShieldCheck, Download, Trash2, Plus, PieChart, Percent, DollarSign,
  AlertTriangle, Save, CheckCircle2, RotateCcw, Info, File, UserPlus, Clock,
  CreditCard, Wallet, Tag, Loader2
} from 'lucide-react';
import { Booking, BookingStatus, PaymentStatus, Lead, Tour, TierSelection } from '../../types';
import { TOURS, RECENT_LEADS, UPCOMING_BOOKINGS } from '../../data/mockData';
import { bookingService } from '../../services/bookingService';
import { useTenant } from '../../context/TenantContext';

// --- Types for Internal Details ---

interface TeamUser {
  id: string;
  name: string;
  role: string;
  email: string;
}

const TEAM_USERS: TeamUser[] = [
  { id: '1', name: 'Alex Walker', role: 'Owner', email: 'alex@wanderlust.com' },
  { id: '2', name: 'Sarah Miller', role: 'Guide', email: 'sarah@wanderlust.com' },
  { id: '3', name: 'Mike Johnson', role: 'Driver', email: 'mike@wanderlust.com' },
  { id: '4', name: 'Emily Davis', role: 'Support', email: 'emily@wanderlust.com' },
];

const CURRENT_USER_NAME = 'Alex Walker';

// --- Helper Components ---

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

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm(value); 
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef, value]);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div ref={wrapperRef} className="relative w-full">
      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1.5">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
           {icon}
        </div>
        <input 
          type="text" 
          className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700/50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {isOpen && (
          <div className="absolute z-[100] w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
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

// --- Main Modal Component ---

interface CreateBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead?: Lead | null;
  leadName?: string;
  onBookingCreated?: (booking: Booking) => void;
  bookingToEdit?: Booking | null;
  onBookingUpdated?: (booking: Booking) => void;
  initialTab?: 'comments' | 'activity' | 'documents';
}

const CreateBookingModal: React.FC<CreateBookingModalProps> = ({
  isOpen,
  onClose,
  lead,
  leadName = '',
  onBookingCreated,
  bookingToEdit,
  onBookingUpdated,
  initialTab = 'comments'
}) => {
  const { organizationId } = useTenant();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    tourName: '',
    clientName: '',
    date: '',
    startTime: '09:00',
    endTime: '12:00',
    pax: 2,
    status: 'Pending' as BookingStatus,
    paymentStatus: 'Unpaid' as PaymentStatus,
    pickupLocation: '',
    notes: '',
    assignedTo: '',
    partnerSource: '',
    commissionRate: '' as string | number,
    totalAmount: '' as string | number,
    amountPaid: '' as string | number
  });

  const [activeTab, setActiveTab] = useState<'comments' | 'activity' | 'documents'>(initialTab);
  const [isManualAmount, setIsManualAmount] = useState(false);
  
  // Complex Pricing State
  const [tierSelections, setTierSelections] = useState<TierSelection[]>([]);

  // --- Logic Hooks ---
  const activeTour = useMemo(() => TOURS.find(t => t.name === formData.tourName), [formData.tourName]);
  
  const availability = useMemo(() => {
    if (!formData.tourName || !formData.date) return null;
    const existingBookedCount = UPCOMING_BOOKINGS
      .filter(b => b.tourName === formData.tourName && b.date === formData.date && b.id !== bookingToEdit?.id)
      .reduce((acc, curr) => acc + curr.people, 0);
    const max = activeTour?.maxPeople || 20;
    return { left: max - existingBookedCount, max };
  }, [formData.tourName, formData.date, activeTour, bookingToEdit]);

  // --- Reset/Init Pricing Tiers when Tour Changes ---
  useEffect(() => {
    if (!bookingToEdit && activeTour) {
      if (activeTour.pricingTiers && activeTour.pricingTiers.length > 0) {
        // Initialize tiers with 0 quantity
        setTierSelections(activeTour.pricingTiers.map(t => ({
          tierName: t.name,
          quantity: 0,
          pricePerUnit: t.price
        })));
      } else {
        setTierSelections([]);
      }
    }
  }, [activeTour, bookingToEdit]);

  // --- Auto-calculation logic ---
  useEffect(() => {
    // Only auto-calc if not manually overridden OR if we are explicitly changing tier quantities
    if (!isManualAmount && activeTour && !bookingToEdit) {
      if (tierSelections.length > 0) {
        const calculatedTotal = tierSelections.reduce((acc, curr) => acc + (curr.quantity * curr.pricePerUnit), 0);
        const calculatedPax = tierSelections.reduce((acc, curr) => acc + curr.quantity, 0);
        
        setFormData(prev => ({
          ...prev,
          totalAmount: calculatedTotal,
          pax: calculatedPax > 0 ? calculatedPax : 1 // fallback to 1 to avoid empty field logic issues
        }));
      } else {
        // Legacy/Simple Mode
        setFormData(prev => ({
          ...prev,
          totalAmount: activeTour.price * (prev.pax || 0)
        }));
      }
    }
  }, [tierSelections, activeTour, formData.pax, isManualAmount, bookingToEdit]);

  // --- Financial Formulas ---
  const totals = useMemo(() => {
    const total = typeof formData.totalAmount === 'string' ? parseFloat(formData.totalAmount) || 0 : formData.totalAmount || 0;
    const paid = typeof formData.amountPaid === 'string' ? parseFloat(formData.amountPaid) || 0 : formData.amountPaid || 0;
    const rate = typeof formData.commissionRate === 'string' ? parseFloat(formData.commissionRate) || 0 : formData.commissionRate || 0;
    
    const due = total - paid;
    const commission = (total * (rate / 100));
    const net = total - commission;
    
    return { total, paid, due, commission, net };
  }, [formData.totalAmount, formData.amountPaid, formData.commissionRate]);

  useEffect(() => {
    if (bookingToEdit) {
      setFormData({
        tourName: bookingToEdit.tourName,
        clientName: bookingToEdit.clientName,
        date: bookingToEdit.date,
        startTime: bookingToEdit.startTime || '09:00',
        endTime: bookingToEdit.endTime || '12:00',
        pax: bookingToEdit.people,
        status: bookingToEdit.status,
        paymentStatus: bookingToEdit.paymentStatus || 'Unpaid',
        pickupLocation: bookingToEdit.pickupLocation || '',
        notes: bookingToEdit.notes || '',
        assignedTo: bookingToEdit.assignedTo || '',
        partnerSource: (bookingToEdit as any).partnerSource || '',
        commissionRate: (bookingToEdit as any).commissionRate ?? 0,
        totalAmount: bookingToEdit.totalAmount ?? 0,
        amountPaid: bookingToEdit.amountPaid ?? 0
      });
      // Load existing tier selections if available
      setTierSelections(bookingToEdit.tierSelections || []);
      setIsManualAmount(true);
    } else {
      setFormData({
        tourName: '',
        clientName: lead?.name || leadName || '',
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '12:00',
        pax: 2,
        status: 'Pending',
        paymentStatus: 'Unpaid',
        pickupLocation: '',
        notes: '',
        assignedTo: '',
        partnerSource: '',
        commissionRate: 0,
        totalAmount: 0,
        amountPaid: 0
      });
      setTierSelections([]);
      setIsManualAmount(false);
    }
  }, [bookingToEdit, isOpen, lead, leadName]);

  const handleUpdateTierQuantity = (index: number, newQty: number) => {
    const updated = [...tierSelections];
    updated[index].quantity = Math.max(0, newQty);
    setTierSelections(updated);
    setIsManualAmount(false); // Enable auto-calc
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!organizationId) {
      alert('Organization not found. Please refresh and try again.');
      return;
    }

    if (!formData.tourName) {
      alert('Please select a tour.');
      return;
    }

    setIsSaving(true);

    try {
      const tourId = TOURS.find(t => t.name === formData.tourName)?.id;
      if (!tourId) {
        alert('Selected tour not found.');
        return;
      }

      if (bookingToEdit) {
        await bookingService.updateBooking(bookingToEdit.id, {
          client_name: formData.clientName,
          email: formData.email,
          phone: formData.phone,
          people: formData.pax,
          booking_date: formData.date,
          start_time: formData.startTime,
          end_time: formData.endTime,
          status: formData.status as BookingStatus,
          payment_status: formData.paymentStatus as PaymentStatus,
          total_amount: totals.total,
          amount_paid: totals.paid,
          pickup_location: formData.pickupLocation,
          notes: formData.notes,
          assigned_to: formData.assignedTo
        });

        const finalBooking: Booking = {
          ...bookingToEdit,
          ...formData,
          commissionRate: typeof formData.commissionRate === 'string' ? parseFloat(formData.commissionRate) || 0 : formData.commissionRate,
          totalAmount: totals.total,
          amountPaid: totals.paid,
          amountDue: totals.due,
          people: formData.pax,
          tierSelections: tierSelections
        } as any;

        onBookingUpdated?.(finalBooking);
      } else {
        const newBooking = await bookingService.createBooking(organizationId, {
          tour_id: tourId,
          client_name: formData.clientName,
          email: formData.email,
          phone: formData.phone,
          people: formData.pax,
          booking_date: formData.date,
          start_time: formData.startTime,
          end_time: formData.endTime,
          status: formData.status as BookingStatus,
          payment_status: formData.paymentStatus as PaymentStatus,
          total_amount: totals.total,
          amount_paid: totals.paid,
          pickup_location: formData.pickupLocation,
          notes: formData.notes,
          assigned_to: formData.assignedTo,
          lead_id: lead?.id
        });

        if (tierSelections.length > 0 && newBooking?.id) {
          for (const tier of tierSelections) {
            await bookingService.createBookingTier({
              booking_id: newBooking.id,
              tier_name: tier.tierName,
              quantity: tier.quantity,
              price_per_unit: tier.pricePerUnit
            });
          }
        }

        const finalBooking: Booking = {
          ...newBooking,
          ...formData,
          id: newBooking?.id || `B${Date.now()}`,
          commissionRate: typeof formData.commissionRate === 'string' ? parseFloat(formData.commissionRate) || 0 : formData.commissionRate,
          totalAmount: totals.total,
          amountPaid: totals.paid,
          amountDue: totals.due,
          people: formData.pax,
          tierSelections: tierSelections
        } as any;

        onBookingCreated?.(finalBooking);
      }

      onClose();
    } catch (error: any) {
      console.error(error);
      alert(`Error saving booking: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] overflow-y-auto" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="flex items-center justify-center min-h-screen p-4">
        <div className={`relative bg-white dark:bg-gray-800 rounded-3xl w-full shadow-2xl transform transition-all flex flex-col border border-gray-100 dark:border-gray-700 overflow-hidden ${bookingToEdit ? 'max-w-6xl h-[85vh]' : 'max-w-lg'}`}>
          
          {/* Header */}
          <div className="flex-none flex justify-between items-center px-8 py-6 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {bookingToEdit ? `Edit Booking: ${bookingToEdit.bookingNo || bookingToEdit.id}` : 'New Booking'}
              </h3>
              <p className="text-xs text-gray-500 font-medium tracking-wide uppercase mt-1 opacity-70">Operations & Inventory Control</p>
            </div>
            <button onClick={onClose} className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
            
            {/* LEFT SIDE: MAIN FORM */}
            <div className={`flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar ${bookingToEdit ? 'lg:border-r border-gray-100 dark:border-gray-700' : ''}`}>
              
              {/* Entity Selections */}
              <div className="grid grid-cols-1 gap-6">
                <SearchableSelect 
                  label="Client"
                  icon={<User className="w-4 h-4 text-gray-400" />}
                  options={RECENT_LEADS.map(l => ({ id: l.id, label: l.name, subLabel: l.channel }))}
                  value={formData.clientName}
                  onChange={(val) => setFormData(p => ({ ...p, clientName: val }))}
                  placeholder="Find a lead..."
                />

                <SearchableSelect 
                  label="Tour Catalog Item"
                  icon={<Flag className="w-4 h-4 text-gray-400" />}
                  options={TOURS.map(t => ({ id: t.id, label: t.name, subLabel: t.pricingTiers ? `${t.pricingTiers.length} Options` : `$${t.price} / pax` }))}
                  value={formData.tourName}
                  onChange={(val) => setFormData(p => ({ ...p, tourName: val }))}
                  placeholder="Select a tour..."
                />
              </div>

              {/* Date & Pax (Logic Split) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Date</label>
                  <div className="relative">
                     <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                     <input 
                        type="date"
                        value={formData.date}
                        onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                        className="w-full pl-10 p-2.5 border rounded-xl dark:bg-gray-700/50 text-sm border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                     />
                  </div>
                </div>

                {/* PAX / TIER LOGIC */}
                <div className="space-y-1.5 relative">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    {tierSelections.length > 0 ? 'Guest Count' : 'Pax (Guests)'}
                  </label>
                  {tierSelections.length > 0 ? (
                    <div className="p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl space-y-2">
                      {tierSelections.map((tier, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-300 font-medium">{tier.tierName} <span className="text-xs text-gray-400">(${tier.pricePerUnit})</span></span>
                          <div className="flex items-center gap-2">
                            <button 
                              type="button"
                              onClick={() => handleUpdateTierQuantity(idx, tier.quantity - 1)}
                              className="w-6 h-6 flex items-center justify-center rounded bg-white dark:bg-gray-800 border hover:bg-gray-100 dark:hover:bg-gray-700"
                            >-</button>
                            <span className="w-4 text-center font-bold">{tier.quantity}</span>
                            <button 
                              type="button"
                              onClick={() => handleUpdateTierQuantity(idx, tier.quantity + 1)}
                              className="w-6 h-6 flex items-center justify-center rounded bg-white dark:bg-gray-800 border hover:bg-gray-100 dark:hover:bg-gray-700"
                            >+</button>
                          </div>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between text-xs font-bold text-gray-500">
                        <span>Total Guests:</span>
                        <span>{formData.pax}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <Users className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input 
                          type="number"
                          min="1"
                          value={formData.pax}
                          onChange={e => setFormData(p => ({ ...p, pax: parseInt(e.target.value) || 0 }))}
                          className={`w-full pl-10 p-2.5 border rounded-xl dark:bg-gray-700/50 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${availability && formData.pax > availability.left ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                      />
                    </div>
                  )}
                  
                  {availability && (
                    <div className="absolute -bottom-6 left-0 right-0 flex justify-between items-center px-1">
                       <span className={`text-[10px] font-bold uppercase tracking-tight ${availability.left <= 2 ? 'text-orange-600' : 'text-emerald-600'}`}>
                         {availability.left}/{availability.max} spots left
                       </span>
                       {formData.pax > availability.left && (
                         <span className="text-[9px] text-red-600 font-bold flex items-center gap-0.5 animate-pulse"><AlertTriangle className="w-2.5 h-2.5" /> OVERBOOKED</span>
                       )}
                    </div>
                  )}
                </div>
              </div>

              {/* CORE PRICING SECTION (Restored) */}
              <div className="pt-6 border-t border-gray-100 dark:border-gray-700 space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                   <CreditCard className="w-3.5 h-3.5" /> Pricing & Payment
                </h4>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Total Amount</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
                        <input 
                          type="number"
                          value={formData.totalAmount}
                          onChange={(e) => {
                            setFormData(p => ({ ...p, totalAmount: e.target.value }));
                            setIsManualAmount(true);
                          }}
                          className="w-full pl-9 p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold text-gray-900 dark:text-white"
                        />
                      </div>
                      {activeTour && !isManualAmount && (
                         <div className="mt-1 text-[9px] text-indigo-500 font-bold italic uppercase tracking-tighter flex items-center gap-1">
                           <RotateCcw className="w-2 h-2" /> Calculated from catalog
                         </div>
                      )}
                   </div>
                   <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Amount Paid</label>
                      <div className="relative">
                        <Wallet className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
                        <input 
                          type="number"
                          value={formData.amountPaid}
                          onChange={(e) => setFormData(p => ({ ...p, amountPaid: e.target.value }))}
                          className="w-full pl-9 p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold text-emerald-600"
                        />
                      </div>
                   </div>
                   <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-800 flex flex-col justify-center items-center">
                      <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">Amount Due</div>
                      <div className={`text-xl font-black ${totals.due > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                        ${totals.due.toFixed(2)}
                      </div>
                   </div>
                </div>
              </div>

              {/* Statuses */}
              <div className="grid grid-cols-2 gap-6 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Tour Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData(p => ({ ...p, status: e.target.value as BookingStatus }))}
                    className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700/50 text-sm font-semibold outline-none"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Payment Status</label>
                  <select
                    value={formData.paymentStatus}
                    onChange={e => setFormData(p => ({ ...p, paymentStatus: e.target.value as PaymentStatus }))}
                    className={`w-full p-2.5 border rounded-xl dark:bg-gray-700/50 text-sm font-bold ${formData.paymentStatus === 'Paid' ? 'border-emerald-500 text-emerald-600' : 'border-red-300 text-red-600'}`}
                  >
                    <option value="Unpaid">Unpaid</option>
                    <option value="Waiting">Waiting</option>
                    <option value="Paid">Paid</option>
                    <option value="Partially Paid">Partially Paid</option>
                  </select>
                </div>
              </div>

              {/* Financial Extras Section */}
              <div className="pt-6 border-t border-gray-100 dark:border-gray-700 space-y-4">
                 <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                   <PieChart className="w-3.5 h-3.5" /> Partner Commission
                 </h4>
                 <div className="bg-gray-50 dark:bg-gray-900/40 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                       <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Referral Partner</label>
                          <input 
                            placeholder="e.g. Hotel Marriott, Booking.com"
                            value={formData.partnerSource}
                            onChange={e => setFormData(p => ({ ...p, partnerSource: e.target.value }))}
                            className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                          />
                       </div>
                       <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Comm. %</label>
                          <div className="relative">
                            <Percent className="absolute right-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
                            <input 
                              type="number"
                              value={formData.commissionRate}
                              onChange={e => setFormData(p => ({ ...p, commissionRate: e.target.value }))}
                              className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                       </div>
                    </div>
                    
                    <div className="flex flex-col justify-center px-4">
                       <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Partner Payout</span>
                          <span className="font-bold text-red-500">-${totals.commission.toFixed(2)}</span>
                       </div>
                       <div className="h-px bg-gray-200 dark:bg-gray-700 my-2" />
                       <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">Net Revenue</span>
                          <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">${totals.net.toFixed(2)}</span>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Logistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Pickup Location</label>
                  <div className="relative">
                     <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                     <input 
                        value={formData.pickupLocation}
                        onChange={e => setFormData(p => ({ ...p, pickupLocation: e.target.value }))}
                        className="w-full pl-10 p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700/50 text-sm"
                        placeholder="Hotel, Pier, or Airport"
                     />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Assign Guide</label>
                  <select
                    value={formData.assignedTo}
                    onChange={e => setFormData(p => ({ ...p, assignedTo: e.target.value }))}
                    className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700/50 text-sm font-semibold"
                  >
                    <option value="">Unassigned</option>
                    {TEAM_USERS.map(u => <option key={u.id} value={u.name}>{u.name} ({u.role})</option>)}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Internal Notes</label>
                <textarea 
                  rows={3}
                  value={formData.notes}
                  onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Dietary requirements, special equipment, etc."
                  className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-2xl dark:bg-gray-700/50 text-sm resize-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* RIGHT SIDE: TABBED DETAILS (Chat, Vault, Log) */}
            {bookingToEdit && (
              <div className="w-full lg:w-[420px] flex flex-col bg-gray-50/50 dark:bg-gray-900/20 border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-gray-700">
                <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4">
                   {[
                     { id: 'comments', label: 'Chat', icon: MessageSquare },
                     { id: 'documents', label: 'Vault', icon: ShieldCheck },
                     { id: 'activity', label: 'Log', icon: Activity },
                   ].map(t => (
                     <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id as any)}
                        className={`flex-1 py-5 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center justify-center gap-2 transition-all ${
                          activeTab === t.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400'
                        }`}
                     >
                        <t.icon className="w-4 h-4" /> {t.label}
                     </button>
                   ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6 relative custom-scrollbar">
                   {activeTab === 'comments' && (
                     <div className="flex flex-col h-full">
                        <div className="flex-1 space-y-4 mb-20">
                           <div className="text-center py-12 opacity-30">
                              <MessageSquare className="w-12 h-12 mx-auto mb-3" />
                              <p className="text-sm font-bold uppercase tracking-widest">Team Chat</p>
                              <p className="text-xs mt-1">Start internal discussion about this booking.</p>
                           </div>
                        </div>
                        <div className="absolute bottom-6 left-6 right-6">
                           <div className="relative group">
                              <input placeholder="Mention team with @..." className="w-full pl-4 pr-12 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" />
                              <button className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-xl shadow-md"><Save className="w-4 h-4"/></button>
                           </div>
                        </div>
                     </div>
                   )}

                   {activeTab === 'documents' && (
                     <div className="space-y-6">
                        <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl p-10 text-center hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all cursor-pointer group">
                           <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                              <Plus className="w-8 h-8" />
                           </div>
                           <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Upload Files</p>
                           <p className="text-xs text-gray-500 mt-1">Passport scans, waivers, or permits.</p>
                        </div>

                        <div className="space-y-3">
                           <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm group">
                              <div className="flex items-center gap-4 min-w-0">
                                 <div className="p-2.5 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-xl"><File className="w-5 h-5" /></div>
                                 <div className="min-w-0">
                                    <p className="text-sm font-bold truncate text-gray-900 dark:text-white">Passport_Scan_Doe.pdf</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">1.2 MB • OCT 24</p>
                                 </div>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400"><Download className="w-4 h-4" /></button>
                                 <button className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500"><Trash2 className="w-4 h-4" /></button>
                              </div>
                           </div>
                        </div>
                     </div>
                   )}

                   {activeTab === 'activity' && (
                     <div className="space-y-8">
                        <div className="relative pl-8 border-l-2 border-gray-100 dark:border-gray-700 ml-2">
                           <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white dark:bg-gray-800 border-4 border-indigo-500" />
                           <div className="text-sm">
                              <span className="font-bold text-gray-900 dark:text-white">Alex Walker</span>
                              <span className="text-gray-500"> changed status to </span>
                              <span className="font-bold text-emerald-600">Confirmed</span>
                           </div>
                           <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                              <Clock className="w-3 h-3" /> 2 hours ago
                           </div>
                        </div>
                        <div className="relative pl-8 border-l-2 border-gray-100 dark:border-gray-700 ml-2">
                           <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white dark:bg-gray-800 border-4 border-gray-200 dark:border-gray-600" />
                           <div className="text-sm">
                              <span className="font-bold text-gray-900 dark:text-white">Sarah Miller</span>
                              <span className="text-gray-500"> updated Pickup Location </span>
                           </div>
                           <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                              <Clock className="w-3 h-3" /> Yesterday, 4:30 PM
                           </div>
                        </div>
                     </div>
                   )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex-none px-8 py-6 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-end gap-3 rounded-b-3xl">
             <button type="button" onClick={onClose} disabled={isSaving} className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50">Cancel</button>
             <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-10 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-extrabold shadow-xl shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
             >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    {bookingToEdit ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {bookingToEdit ? 'Update Booking' : 'Confirm Reservation'}
                  </>
                )}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBookingModal;
