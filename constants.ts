
import { Booking, KPIMetric, Lead } from './types';

// --- Shared Configuration Data ---

// Expanded Timezones with major cities (Focus: Europe & Asia)
export const TIMEZONES = [
  'UTC-12:00 (Baker Island)',
  'UTC-11:00 (Samoa)',
  'UTC-10:00 (Hawaii)',
  'UTC-09:00 (Alaska)',
  'UTC-08:00 (Los Angeles, Vancouver)',
  'UTC-07:00 (Denver, Edmonton)',
  'UTC-06:00 (Mexico City, Chicago)',
  'UTC-05:00 (New York, Toronto)',
  'UTC-04:00 (Santiago, Santo Domingo)',
  'UTC-03:00 (São Paulo, Buenos Aires)',
  'UTC-02:00 (Mid-Atlantic)',
  'UTC-01:00 (Azores)',
  'UTC+00:00 (London, Dublin, Lisbon)',
  'UTC+01:00 (Paris, Berlin, Rome, Madrid, Amsterdam)',
  'UTC+02:00 (Athens, Bucharest, Helsinki, Kyiv, Cairo, Jerusalem)',
  'UTC+03:00 (Moscow, Istanbul, Riyadh, Doha)',
  'UTC+03:30 (Tehran)',
  'UTC+04:00 (Dubai, Baku, Muscat)',
  'UTC+04:30 (Kabul)',
  'UTC+05:00 (Karachi, Tashkent, Male)',
  'UTC+05:30 (Mumbai, New Delhi, Colombo)',
  'UTC+05:45 (Kathmandu)',
  'UTC+06:00 (Dhaka, Almaty)',
  'UTC+06:30 (Yangon)',
  'UTC+07:00 (Bangkok, Hanoi, Jakarta, Phnom Penh)',
  'UTC+08:00 (Singapore, Hong Kong, Beijing, Kuala Lumpur, Taipei)',
  'UTC+09:00 (Tokyo, Seoul)',
  'UTC+09:30 (Adelaide, Darwin)',
  'UTC+10:00 (Sydney, Melbourne, Vladivostok)',
  'UTC+11:00 (Noumea)',
  'UTC+12:00 (Auckland, Fiji)',
];

// Expanded Currencies (Focus: Europe & Asia)
export const CURRENCIES = [
  'USD ($)', 'EUR (€)', 'GBP (£)', 
  'CHF (Fr)', 'SEK (kr)', 'NOK (kr)', 'DKK (kr)', 'PLN (zł)', 'CZK (Kč)', 'HUF (Ft)', 'ISK (kr)',
  'JPY (¥)', 'CNY (¥)', 'INR (₹)', 'RUB (₽)', 
  'AED (dh)', 'SAR (SR)', 'ILS (₪)', 'TRY (₺)', 'QAR (QR)',
  'SGD ($)', 'HKD ($)', 'KRW (₩)', 'THB (฿)', 
  'MYR (RM)', 'IDR (Rp)', 'PHP (₱)', 'VND (₫)', 'TWD (NT$)', 'PKR (₨)',
  'AUD (A$)', 'CAD (C$)', 'NZD ($)', 'BRL (R$)', 'MXN ($)', 'ZAR (R)'
];

// --- Mock Data ---

// Mock KPI Data
export const KPI_DATA: KPIMetric[] = [
  {
    id: 'kpi-1',
    label: 'New leads today',
    value: 12,
    trend: '+20%',
    trendUp: true,
  },
  {
    id: 'kpi-2',
    label: 'Unread conversations',
    value: 5,
    trend: '-2',
    trendUp: false, // In this context, down might be good, but for visual simplicity we'll handle trends generically
  },
  {
    id: 'kpi-3',
    label: 'Follow-ups today',
    value: 8,
  },
  {
    id: 'kpi-4',
    label: 'Upcoming tours (7 days)',
    value: 24,
    trend: '+4',
    trendUp: true,
  },
];

// Mock Leads Data
export const RECENT_LEADS: Lead[] = [
  {
    id: 'L001',
    leadNo: 'LD-001024',
    name: 'Sarah Jenkins',
    lastMessageTime: '10 mins ago',
    status: 'New',
    channel: 'Website',
    assignedTo: 'Alex Walker',
  },
  {
    id: 'L002',
    leadNo: 'LD-001023',
    name: 'Marco Rossi',
    lastMessageTime: '45 mins ago',
    status: 'Contacted',
    channel: 'WhatsApp',
    assignedTo: 'Sarah Miller',
  },
  {
    id: 'L003',
    leadNo: 'LD-001022',
    name: 'Emily Chen',
    lastMessageTime: '2 hours ago',
    status: 'New',
    channel: 'Email',
    assignedTo: 'Alex Walker',
  },
  {
    id: 'L004',
    leadNo: 'LD-001021',
    name: 'David Smith',
    lastMessageTime: '5 hours ago',
    status: 'Qualified',
    channel: 'Referral',
    assignedTo: 'Emily Davis',
  },
  {
    id: 'L005',
    leadNo: 'LD-001020',
    name: 'Anita Patel',
    lastMessageTime: '1 day ago',
    status: 'Contacted',
    channel: 'Website',
    assignedTo: 'Unassigned',
  },
];

// Mock Bookings Data
export const UPCOMING_BOOKINGS: Booking[] = [
  {
    id: 'B001',
    bookingNo: 'BR-005120',
    date: 'Oct 24, 2023',
    tourName: 'Sunset City Bike Tour',
    clientName: 'John Doe',
    people: 2,
    status: 'Confirmed',
    paymentStatus: 'Paid',
    assignedTo: 'Alex Walker',
    totalAmount: 170,
    amountPaid: 170,
    amountDue: 0,
    isAmountOverridden: false
  },
  {
    id: 'B002',
    bookingNo: 'BR-005121',
    date: 'Oct 25, 2023',
    tourName: 'Historical Walk',
    clientName: 'Alice Cooper',
    people: 4,
    status: 'Pending',
    paymentStatus: 'Waiting',
    assignedTo: 'Sarah Miller',
    totalAmount: 180,
    amountPaid: 0,
    amountDue: 180,
    isAmountOverridden: false
  },
  {
    id: 'B003',
    bookingNo: 'BR-005122',
    date: 'Oct 25, 2023',
    tourName: 'Food & Wine Tasting',
    clientName: 'Robert Langdon',
    people: 1,
    status: 'Confirmed',
    paymentStatus: 'Paid',
    assignedTo: 'Alex Walker',
    totalAmount: 120,
    amountPaid: 120,
    amountDue: 0,
    isAmountOverridden: false
  },
  {
    id: 'B004',
    bookingNo: 'BR-005123',
    date: 'Oct 26, 2023',
    tourName: 'Mountain Hike Level 2',
    clientName: 'Team Alpha',
    people: 8,
    status: 'Confirmed',
    paymentStatus: 'Unpaid',
    assignedTo: 'Mike Johnson',
    totalAmount: 760,
    amountPaid: 0,
    amountDue: 760,
    isAmountOverridden: false
  },
  {
    id: 'B005',
    bookingNo: 'BR-005124',
    date: 'Oct 27, 2023',
    tourName: 'Private Boat Charter',
    clientName: 'The Kardashians',
    people: 6,
    status: 'Cancelled',
    paymentStatus: 'Unpaid',
    assignedTo: 'Alex Walker',
    totalAmount: 1500,
    amountPaid: 0,
    amountDue: 1500,
    isAmountOverridden: true
  },
];

// Mock Tours Data
export const TOURS = [
   { 
      id: 1, 
      tourNo: 'TR-000001',
      name: 'Sunset City Bike Tour', 
      price: 85, 
      duration: '3h', 
      active: true, 
      description: 'Experience the city at golden hour on our premium electric bikes. Perfect for photography enthusiasts and couples. We provide helmets, water, and a local guide who knows the best spots.', 
      image: 'https://images.unsplash.com/photo-1620302066845-314b98c92872?auto=format&fit=crop&q=80&w=200',
      tags: ['Bike', 'City', 'Sunset', 'Photography'],
      maxPeople: 8,
      difficulty: 'Easy',
      location: 'Downtown Marina',
      bookingsCount: 142,
      revenue: 12070
   },
   { 
      id: 2, 
      tourNo: 'TR-000002',
      name: 'Historical Walk', 
      price: 45, 
      duration: '2h', 
      active: true, 
      description: 'A guided walk through the old town visiting key historical landmarks. Learn about the rich history and culture of the city.',
      image: 'https://images.unsplash.com/photo-1590274780650-664448557c9a?auto=format&fit=crop&q=80&w=200',
      tags: ['History', 'Walking', 'Culture'],
      maxPeople: 15,
      difficulty: 'Easy',
      location: 'Old Town Square',
      bookingsCount: 89,
      revenue: 4005
   },
   { 
      id: 3, 
      tourNo: 'TR-000003',
      name: 'Food & Wine Tasting', 
      price: 120, 
      duration: '4h', 
      active: true, 
      description: 'Sample the finest local delicacies and wines in this gastronomic adventure. Includes visits to 3 award-winning restaurants.',
      image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=200',
      tags: ['Food', 'Wine', 'Luxury'],
      maxPeople: 6,
      difficulty: 'Easy',
      location: 'Vineyard District',
      bookingsCount: 56,
      revenue: 6720
   },
   { 
      id: 4, 
      tourNo: 'TR-000004',
      name: 'Mountain Hike Level 2', 
      price: 95, 
      duration: '6h', 
      active: false, 
      description: 'Challenging hike with breathtaking views for experienced hikers. Proper hiking gear is required.',
      image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&q=80&w=200',
      tags: ['Hiking', 'Nature', 'Adventure'],
      maxPeople: 10,
      difficulty: 'Hard',
      location: 'National Park',
      bookingsCount: 32,
      revenue: 3040
   },
];
