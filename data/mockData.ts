
import { Booking, KPIMetric, Lead, AppNotification, Tour } from '../types';

// Team Members for assignment
export const MOCK_TEAM_MEMBERS = [
  { id: '1', name: 'Alex Walker' },
  { id: '2', name: 'Sarah Miller' },
  { id: '3', name: 'Mike Johnson' },
  { id: '4', name: 'Emily Davis' },
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  { 
    id: 'n1', 
    title: 'New inquiry from WhatsApp', 
    description: 'Sarah Jenkins is interested in Sunset City Bike Tour.', 
    type: 'lead', 
    timestamp: Date.now() - 1000 * 60 * 10, // 10 mins ago
    unread: true 
  },
  { 
    id: 'n2', 
    title: 'Payment Received: $450', 
    description: 'Transaction from Marco Rossi was successful.', 
    type: 'payment', 
    timestamp: Date.now() - 1000 * 60 * 120, // 2 hours ago
    unread: true 
  },
  { 
    id: 'n3', 
    title: 'Booking Cancelled', 
    description: 'Private Boat Charter (Oct 27). 6 spots released.', 
    type: 'booking', 
    timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    unread: false 
  },
  { 
    id: 'n4', 
    title: '@Sarah Miller mentioned you', 
    description: 'Check the pickup notes for Booking #BR-5120.', 
    type: 'team', 
    timestamp: Date.now() - 1000 * 60 * 60 * 3, // 3 hours ago
    unread: false 
  }
];

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
    trendUp: false,
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
    id: '111',
    leadNo: 'LD-001024',
    name: 'Sarah Jenkins',
    lastMessageTime: '10 mins ago',
    status: 'New',
    channel: 'Website',
    assignedTo: 'Alex Walker',
  },
  {
    id: '222',
    leadNo: 'LD-001023',
    name: 'Marco Rossi',
    lastMessageTime: '45 mins ago',
    status: 'Contacted',
    channel: 'WhatsApp',
    assignedTo: 'Sarah Miller',
  },
  {
    id: '333',
    leadNo: 'LD-001022',
    name: 'Emily Chen',
    lastMessageTime: '2 hours ago',
    status: 'New',
    channel: 'Email',
    assignedTo: 'Alex Walker',
  },
  {
    id: '444',
    leadNo: 'LD-001021',
    name: 'David Smith',
    lastMessageTime: '5 hours ago',
    status: 'Qualified',
    channel: 'Referral',
    assignedTo: 'Emily Davis',
  },
  {
    id: '555',
    leadNo: 'LD-001020',
    name: 'Anita Patel',
    lastMessageTime: '1 day ago',
    status: 'Contacted',
    channel: 'Website',
    assignedTo: 'Unassigned',
  },
];

// Mock Bookings Data with Times
export const UPCOMING_BOOKINGS: Booking[] = [
  {
    id: 'b1',
    bookingNo: 'BR-005120',
    date: '2023-10-24', // ISO Date for Calendar
    startTime: '09:00',
    endTime: '12:00',
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
    id: 'b2',
    bookingNo: 'BR-005121',
    date: '2023-10-25',
    startTime: '14:00',
    endTime: '16:00',
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
    id: 'b3',
    bookingNo: 'BR-005122',
    date: '2023-10-25',
    startTime: '18:00',
    endTime: '22:00',
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
    id: 'b4',
    bookingNo: 'BR-005123',
    date: '2023-10-26',
    startTime: '08:00',
    endTime: '14:00',
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
    id: 'b5',
    bookingNo: 'BR-005124',
    date: '2023-10-27',
    startTime: '10:00',
    endTime: '16:00',
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
export const TOURS: Tour[] = [
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
      revenue: 12070,
      pricingTiers: [
        { name: 'Adult', price: 85 },
        { name: 'Child (under 12)', price: 45 },
        { name: 'Senior', price: 70 }
      ]
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
      revenue: 4005,
      pricingTiers: [
        { name: 'General Admission', price: 45 },
        { name: 'Student', price: 30 }
      ]
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
      revenue: 6720,
      pricingTiers: [
        { name: 'Adult (Alcohol included)', price: 120 },
        { name: 'Non-Alcoholic', price: 90 }
      ]
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
      revenue: 3040,
      pricingTiers: [
        { name: 'Hiker', price: 95 }
      ]
   },
];
