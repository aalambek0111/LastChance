
export type FieldType = 'text' | 'number' | 'date' | 'select' | 'email' | 'phone' | 'textarea';

export interface LayoutField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  visible: boolean;
  isCore?: boolean;
  options?: string[]; // For select fields
}

export type ObjectType = 'Leads' | 'Bookings' | 'Tours';

export const DEFAULT_LAYOUTS: Record<ObjectType, LayoutField[]> = {
  Leads: [
    { id: 'name', label: 'Full Name', type: 'text', required: true, visible: true, isCore: true },
    { id: 'email', label: 'Email Address', type: 'email', required: true, visible: true, isCore: true },
    { id: 'phone', label: 'Phone Number', type: 'phone', required: false, visible: true, isCore: true },
    { id: 'company', label: 'Company / Organization', type: 'text', required: false, visible: true },
    { id: 'channel', label: 'Lead Source', type: 'select', required: false, visible: true, options: ['Website', 'Referral', 'Social Media', 'Walk-in', 'WhatsApp', 'Email'] },
    { id: 'value', label: 'Estimated Deal Value', type: 'number', required: false, visible: true },
    { id: 'notes', label: 'Internal Notes', type: 'textarea', required: false, visible: true },
  ],
  Bookings: [
    { id: 'client', label: 'Client Name', type: 'text', required: true, visible: true, isCore: true },
    { id: 'tour', label: 'Tour Selection', type: 'select', required: true, visible: true, isCore: true },
    { id: 'date', label: 'Booking Date', type: 'date', required: true, visible: true, isCore: true },
    { id: 'pax', label: 'Number of Guests', type: 'number', required: true, visible: true },
    { id: 'pickup', label: 'Pickup Location', type: 'text', required: false, visible: true },
    { id: 'payment', label: 'Payment Status', type: 'select', required: false, visible: true },
    { id: 'guide', label: 'Assigned Guide', type: 'select', required: false, visible: true },
  ],
  Tours: [
    { id: 't_name', label: 'Tour Name', type: 'text', required: true, visible: true, isCore: true },
    { id: 't_price', label: 'Base Price', type: 'number', required: true, visible: true, isCore: true },
    { id: 't_duration', label: 'Duration', type: 'text', required: false, visible: true },
    { id: 't_capacity', label: 'Max Capacity', type: 'number', required: false, visible: true },
    { id: 't_diff', label: 'Difficulty Level', type: 'select', required: false, visible: true },
    { id: 't_desc', label: 'Public Description', type: 'textarea', required: false, visible: true },
  ]
};

const STORAGE_KEY = 'tourcrm_layouts_v1';

export const LayoutService = {
  getLayout: (type: ObjectType): LayoutField[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed[type]) return parsed[type];
      }
    } catch (e) {
      console.error('Failed to load layouts', e);
    }
    return DEFAULT_LAYOUTS[type];
  },

  getAllLayouts: (): Record<ObjectType, LayoutField[]> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load layouts', e);
    }
    return DEFAULT_LAYOUTS;
  },

  saveLayout: (type: ObjectType, fields: LayoutField[]) => {
    const current = LayoutService.getAllLayouts();
    current[type] = fields;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  },
  
  resetDefaults: () => {
    localStorage.removeItem(STORAGE_KEY);
  }
};
