// Mock data for the CoLife platform

export interface Property {
    id: string;
    name: string;
    location: string;
    city: string;
    address: string;
    price: number;
    originalPrice?: number;
    type: 'Co-Living' | 'PG' | 'Hostel' | 'Studio';
    roomType: string;
    gender: 'Male' | 'Female' | 'Unisex';
    rating: number;
    reviewCount: number;
    occupancy: number;
    totalBeds: number;
    occupiedBeds: number;
    amenities: string[];
    images: string[];
    description: string;
    highlights: string[];
    availableFrom: string;
    deposit: number;
    lockIn: string;
    manager: {
        name: string;
        phone: string;
        avatar: string;
    };
}

export interface Testimonial {
    id: string;
    name: string;
    role: string;
    content: string;
    avatar: string;
    rating: number;
}

export const properties: Property[] = [
    {
        id: 'prop-1',
        name: 'CoLife Greenwood Heights',
        location: 'Koramangala, Bangalore',
        city: 'Bangalore',
        address: '42, 5th Block, Koramangala, Bangalore - 560095',
        price: 8500,
        originalPrice: 10000,
        type: 'Co-Living',
        roomType: 'Double Sharing',
        gender: 'Unisex',
        rating: 4.6,
        reviewCount: 234,
        occupancy: 87,
        totalBeds: 120,
        occupiedBeds: 104,
        amenities: ['Wi-Fi', 'AC', 'Laundry', 'Gym', 'Meals', 'Power Backup', 'Parking', 'CCTV'],
        images: ['/rooms/room1.jpg'],
        description: 'Experience premium co-living in the heart of Koramangala. Modern rooms with top-notch amenities, vibrant community spaces, and easy access to IT hubs. Perfect for working professionals.',
        highlights: ['5 min from Forum Mall', 'Near Jyoti Nivas College Metro', 'Rooftop Lounge', '24/7 Security'],
        availableFrom: '2026-03-01',
        deposit: 17000,
        lockIn: '3 months',
        manager: { name: 'Priya Sharma', phone: '+91 98765 43210', avatar: '' },
    },
    {
        id: 'prop-2',
        name: 'CoLife Nexus Hub',
        location: 'Whitefield, Bangalore',
        city: 'Bangalore',
        address: '15, ITPL Road, Whitefield, Bangalore - 560066',
        price: 7500,
        type: 'Co-Living',
        roomType: 'Triple Sharing',
        gender: 'Male',
        rating: 4.3,
        reviewCount: 189,
        occupancy: 92,
        totalBeds: 80,
        occupiedBeds: 74,
        amenities: ['Wi-Fi', 'AC', 'Meals', 'Power Backup', 'CCTV', 'Games Room'],
        images: ['/rooms/room2.jpg'],
        description: 'Located in the IT corridor of Whitefield, CoLife Nexus Hub offers affordable co-living with excellent connectivity. Walk to ITPL, Prestige Tech Park, and major IT campuses.',
        highlights: ['Walking distance to ITPL', 'Shuttle to Metro', 'Game Zone', 'Study Room'],
        availableFrom: '2026-03-15',
        deposit: 15000,
        lockIn: '3 months',
        manager: { name: 'Rahul Mehta', phone: '+91 98765 43211', avatar: '' },
    },
    {
        id: 'prop-3',
        name: 'CoLife Skyline Residency',
        location: 'HSR Layout, Bangalore',
        city: 'Bangalore',
        address: '23, Sector 3, HSR Layout, Bangalore - 560102',
        price: 9500,
        type: 'Co-Living',
        roomType: 'Single Room',
        gender: 'Female',
        rating: 4.8,
        reviewCount: 312,
        occupancy: 95,
        totalBeds: 60,
        occupiedBeds: 57,
        amenities: ['Wi-Fi', 'AC', 'Laundry', 'Gym', 'Meals', 'Power Backup', 'Yoga Studio', 'CCTV', 'Library'],
        images: ['/rooms/room3.jpg'],
        description: 'An exclusive women-only co-living space designed for comfort and safety. Premium amenities including yoga studio, library, and a vibrant girls-only community.',
        highlights: ['Women-only with premium security', 'Yoga & Meditation room', 'Organic meals', 'Book exchange library'],
        availableFrom: '2026-02-25',
        deposit: 19000,
        lockIn: '6 months',
        manager: { name: 'Ananya Rao', phone: '+91 98765 43212', avatar: '' },
    },
    {
        id: 'prop-4',
        name: 'CoLife Urban Nest',
        location: 'Andheri West, Mumbai',
        city: 'Mumbai',
        address: '78, Lokhandwala Complex, Andheri West, Mumbai - 400053',
        price: 12000,
        type: 'Co-Living',
        roomType: 'Double Sharing',
        gender: 'Unisex',
        rating: 4.5,
        reviewCount: 276,
        occupancy: 90,
        totalBeds: 100,
        occupiedBeds: 90,
        amenities: ['Wi-Fi', 'AC', 'Laundry', 'Meals', 'Power Backup', 'CCTV', 'Coworking Space'],
        images: ['/rooms/room4.jpg'],
        description: 'Mumbai\'s premium co-living destination with coworking spaces and a lively community. Steps away from Andheri station and the buzzing nightlife of Lokhandwala.',
        highlights: ['5 min to Andheri Metro', 'In-house Coworking', 'Rooftop BBQ area', 'Weekend events'],
        availableFrom: '2026-03-10',
        deposit: 24000,
        lockIn: '3 months',
        manager: { name: 'Vikram Singh', phone: '+91 98765 43213', avatar: '' },
    },
    {
        id: 'prop-5',
        name: 'CoLife Garden View',
        location: 'Baner, Pune',
        city: 'Pune',
        address: '56, Baner Road, Pune - 411045',
        price: 6500,
        type: 'PG',
        roomType: 'Triple Sharing',
        gender: 'Male',
        rating: 4.2,
        reviewCount: 145,
        occupancy: 78,
        totalBeds: 90,
        occupiedBeds: 70,
        amenities: ['Wi-Fi', 'Meals', 'Power Backup', 'CCTV', 'Parking'],
        images: ['/rooms/room5.jpg'],
        description: 'Affordable PG accommodation in Pune\'s thriving Baner area. Close to Hinjewadi IT Park with home-cooked meals and a friendly atmosphere.',
        highlights: ['15 min to Hinjewadi IT Park', 'Homestyle meals', 'Garden sit-out', 'Cricket ground nearby'],
        availableFrom: '2026-03-01',
        deposit: 13000,
        lockIn: '2 months',
        manager: { name: 'Sneha Patel', phone: '+91 98765 43214', avatar: '' },
    },
    {
        id: 'prop-6',
        name: 'CoLife Tech Square',
        location: 'Gachibowli, Hyderabad',
        city: 'Hyderabad',
        address: '90, Financial District, Gachibowli, Hyderabad - 500032',
        price: 7000,
        originalPrice: 8000,
        type: 'Co-Living',
        roomType: 'Double Sharing',
        gender: 'Unisex',
        rating: 4.4,
        reviewCount: 198,
        occupancy: 85,
        totalBeds: 150,
        occupiedBeds: 128,
        amenities: ['Wi-Fi', 'AC', 'Meals', 'Gym', 'Power Backup', 'CCTV', 'Swimming Pool'],
        images: ['/rooms/room6.jpg'],
        description: 'Next to Hyderabad\'s Financial District with top-class amenities. Ideal for techies working at Google, Amazon, Microsoft campuses nearby.',
        highlights: ['Walk to Financial District', 'Swimming Pool', 'Fully automated laundry', 'Movie screening room'],
        availableFrom: '2026-03-05',
        deposit: 14000,
        lockIn: '3 months',
        manager: { name: 'Arjun Reddy', phone: '+91 98765 43215', avatar: '' },
    },
];

export const testimonials: Testimonial[] = [
    {
        id: '1',
        name: 'Aditi Raghavan',
        role: 'Software Engineer at Google',
        content: 'CoLife made my relocation to Bangalore seamless. The community is amazing, and the room quality exceeded my expectations. Paying rent is a breeze!',
        avatar: '',
        rating: 5,
    },
    {
        id: '2',
        name: 'Karthik Nair',
        role: 'Product Manager at Flipkart',
        content: 'I\'ve stayed in 3 different PGs before finding CoLife. The roommate matching actually worked – my roommate and I became great friends. Highly recommend!',
        avatar: '',
        rating: 5,
    },
    {
        id: '3',
        name: 'Meera Joshi',
        role: 'UX Designer at Swiggy',
        content: 'As a woman moving to a new city, safety was my priority. CoLife\'s women-only property with 24/7 security gave me total peace of mind. The community events are a bonus!',
        avatar: '',
        rating: 5,
    },
];

export const cities = [
    { name: 'Bangalore', properties: 142, image: '🏙️' },
    { name: 'Mumbai', properties: 98, image: '🌊' },
    { name: 'Pune', properties: 76, image: '🏔️' },
    { name: 'Hyderabad', properties: 89, image: '🕌' },
    { name: 'Delhi NCR', properties: 112, image: '🏛️' },
    { name: 'Chennai', properties: 64, image: '🏖️' },
];

export const amenityIcons: Record<string, string> = {
    'Wi-Fi': '📶',
    'AC': '❄️',
    'Laundry': '👕',
    'Gym': '💪',
    'Meals': '🍽️',
    'Power Backup': '🔋',
    'Parking': '🅿️',
    'CCTV': '📹',
    'Games Room': '🎮',
    'Yoga Studio': '🧘',
    'Library': '📚',
    'Coworking Space': '💻',
    'Swimming Pool': '🏊',
    'Study Room': '📖',
};

export const stats = [
    { label: 'Properties', value: '500+', icon: '🏠' },
    { label: 'Happy Tenants', value: '25,000+', icon: '😊' },
    { label: 'Cities', value: '12', icon: '🏙️' },
    { label: 'Avg Rating', value: '4.6★', icon: '⭐' },
];

// Dashboard mock data
export const dashboardStats = {
    tenant: {
        nextRent: { amount: 8500, dueDate: '2026-03-01', status: 'upcoming' as const },
        property: 'CoLife Greenwood Heights',
        room: 'Room 204-A',
        moveInDate: '2025-09-15',
        leaseEnd: '2026-09-14',
        maintenanceTickets: { open: 1, resolved: 8 },
        upcomingEvents: [
            { name: 'Movie Night', date: '2026-02-22', time: '7:00 PM' },
            { name: 'Weekend Potluck', date: '2026-02-24', time: '1:00 PM' },
        ],
    },
    owner: {
        totalProperties: 4,
        totalBeds: 320,
        occupiedBeds: 278,
        occupancyRate: 86.9,
        monthlyRevenue: 2450000,
        pendingPayments: 12,
        maintenanceOpen: 5,
        revenueData: [
            { month: 'Sep', revenue: 2100000 },
            { month: 'Oct', revenue: 2250000 },
            { month: 'Nov', revenue: 2380000 },
            { month: 'Dec', revenue: 2300000 },
            { month: 'Jan', revenue: 2420000 },
            { month: 'Feb', revenue: 2450000 },
        ],
        properties: [
            { name: 'Greenwood Heights', beds: 120, occupied: 104, revenue: 850000 },
            { name: 'Nexus Hub', beds: 80, occupied: 74, revenue: 520000 },
            { name: 'Tech Square', beds: 70, occupied: 62, revenue: 480000 },
            { name: 'Garden View', beds: 50, occupied: 38, revenue: 310000 },
        ],
    },
    admin: {
        totalUsers: 45230,
        activeProperties: 312,
        mtdRevenue: 24000000,
        overallOccupancy: 82,
        pendingApprovals: 5,
        kycReviews: 12,
        openEscalations: 3,
        fraudAlerts: 1,
        recentBookings: [
            { tenant: 'Rohit Kumar', property: 'Greenwood Heights', room: '305-B', date: '2026-02-17', amount: 8500, status: 'confirmed' },
            { tenant: 'Sneha Rao', property: 'Skyline Residency', room: '102-A', date: '2026-02-16', amount: 9500, status: 'confirmed' },
            { tenant: 'Amir Khan', property: 'Nexus Hub', room: '408-C', date: '2026-02-16', amount: 7500, status: 'pending' },
            { tenant: 'Priya Menon', property: 'Urban Nest', room: '210-A', date: '2026-02-15', amount: 12000, status: 'confirmed' },
            { tenant: 'Dev Patel', property: 'Tech Square', room: '506-B', date: '2026-02-15', amount: 7000, status: 'pending' },
        ],
    },
};
