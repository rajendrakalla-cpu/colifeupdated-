'use client';

import Script from 'next/script';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Home, Building2, BarChart3, CreditCard, Users, Settings,
    LogOut, TrendingUp, IndianRupee, BedDouble,
    Wrench, AlertCircle, ChevronRight, ArrowUpRight, Plus, ArrowLeft, CheckCircle2, Trash2
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { propertiesApi, ticketsApi, bookingsApi, paymentsApi } from '@/lib/api';

declare global {
    interface Window {
        google: any;
    }
}

export default function OwnerDashboard() {
    const { user, loading: authLoading, isLoggedIn, logout } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('overview');
    const [properties, setProperties] = useState<any[]>([]);
    const [tickets, setTickets] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [dataLoading, setDataLoading] = useState(true);

    // Add Property form state
    const [propertyForm, setPropertyForm] = useState({
        name: '', city: 'Bangalore', address: '', location: '', price: '', originalPrice: '',
        type: 'COLIVING', gender: 'UNISEX', deposit: '', lockIn: '3 months',
        description: '', availableFrom: '', lat: 0, lng: 0
    });
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
    const [rooms, setRooms] = useState([{ name: 'Room 101', type: 'Double Sharing', capacity: '2', price: '' }]);
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [formSuccess, setFormSuccess] = useState('');
    const [formError, setFormError] = useState('');

    const allAmenities = ['Wi-Fi', 'AC', 'Laundry', 'Gym', 'Meals', 'Power Backup', 'Parking', 'CCTV', 'Games Room', 'Yoga Studio', 'Library', 'Coworking Space', 'Swimming Pool', 'Study Room'];

    const toggleAmenity = (am: string) => {
        setSelectedAmenities(prev => prev.includes(am) ? prev.filter(a => a !== am) : [...prev, am]);
    };

    const addRoom = () => {
        setRooms(prev => [...prev, { name: `Room ${100 + prev.length + 1}`, type: 'Double Sharing', capacity: '2', price: '' }]);
    };

    const removeRoom = (i: number) => {
        if (rooms.length > 1) setRooms(prev => prev.filter((_, idx) => idx !== i));
    };

    const updateRoom = (i: number, field: string, value: string) => {
        setRooms(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
    };

    // Google Maps Autocomplete Initialization
    useEffect(() => {
        if (activeTab !== 'add-property' || !window.google) return;

        const input = document.getElementById('location-input') as HTMLInputElement;
        if (!input) return;

        const autocomplete = new window.google.maps.places.Autocomplete(input, {
            componentRestrictions: { country: 'in' },
            fields: ['formatted_address', 'geometry', 'name'],
        });

        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place.geometry && place.geometry.location) {
                setPropertyForm(prev => ({
                    ...prev,
                    location: place.name || prev.location,
                    address: place.formatted_address || prev.address,
                    lat: place.geometry!.location.lat(),
                    lng: place.geometry!.location.lng()
                }));
            }
        });
    }, [activeTab]);

    const handleCreateProperty = async () => {
        if (!propertyForm.name || !propertyForm.city || !propertyForm.address || !propertyForm.price) {
            setFormError('Please fill in all required fields.');
            return;
        }
        setFormSubmitting(true);
        setFormError('');
        try {
            await propertiesApi.create({
                ...propertyForm,
                amenities: selectedAmenities,
                rooms: rooms.map(r => ({ ...r, price: r.price || propertyForm.price })),
            });
            setFormSuccess('Property created successfully! It is now live for tenants.');
            // Reset form
            setPropertyForm({ name: '', city: 'Bangalore', address: '', location: '', price: '', originalPrice: '', type: 'COLIVING', gender: 'UNISEX', deposit: '', lockIn: '3 months', description: '', availableFrom: '', lat: 0, lng: 0 });
            setSelectedAmenities([]);
            setRooms([{ name: 'Room 101', type: 'Double Sharing', capacity: '2', price: '' }]);
            // Refresh properties list
            const propsRes = await propertiesApi.search();
            const p = (propsRes as any)?.properties || [];
            setProperties(Array.isArray(p) ? p : []);
            // Switch back to properties tab after 2s
            setTimeout(() => { setActiveTab('properties'); setFormSuccess(''); }, 2000);
        } catch (err: any) {
            setFormError(err.message || 'Failed to create property.');
        } finally {
            setFormSubmitting(false);
        }
    };

    useEffect(() => {
        if (!authLoading && !isLoggedIn) {
            router.push('/auth/login');
        }
    }, [authLoading, isLoggedIn, router]);

    useEffect(() => {
        if (!isLoggedIn) return;
        const fetchData = async () => {
            try {
                const [propsRes, ticketsRes, paymentsRes, bookingsRes] = await Promise.allSettled([
                    propertiesApi.search(),
                    ticketsApi.getAll(),
                    paymentsApi.getHistory(),
                    bookingsApi.getAll(),
                ]);
                if (propsRes.status === 'fulfilled') {
                    const p = (propsRes.value as any)?.properties || (propsRes.value as any) || [];
                    setProperties(Array.isArray(p) ? p : []);
                }
                if (ticketsRes.status === 'fulfilled') {
                    const t = (ticketsRes.value as any)?.tickets || (ticketsRes.value as any) || [];
                    setTickets(Array.isArray(t) ? t : []);
                }
                if (paymentsRes.status === 'fulfilled') {
                    const py = (paymentsRes.value as any)?.payments || [];
                    setPayments(Array.isArray(py) ? py : []);
                }
                if (bookingsRes.status === 'fulfilled') {
                    const bk = (bookingsRes.value as any)?.bookings || [];
                    setBookings(Array.isArray(bk) ? bk : []);
                }
            } catch { /* silent */ } finally {
                setDataLoading(false);
            }
        };
        fetchData();
    }, [isLoggedIn]);

    const tabs = [
        { id: 'overview', icon: <Home size={18} />, label: 'Overview' },
        { id: 'properties', icon: <Building2 size={18} />, label: 'Properties' },
        { id: 'revenue', icon: <BarChart3 size={18} />, label: 'Revenue' },
        { id: 'tenants', icon: <Users size={18} />, label: 'Tenants' },
        { id: 'tickets', icon: <Wrench size={18} />, label: 'Tickets' },
        { id: 'settings', icon: <Settings size={18} />, label: 'Settings' },
    ];

    const formatINR = (n: number) => {
        if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
        if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
        return `₹${n.toLocaleString('en-IN')}`;
    };

    const totalBeds = properties.reduce((s: number, p: any) => s + (p.totalBeds || 0), 0);
    const occupiedBeds = properties.reduce((s: number, p: any) => s + (p.occupiedBeds || 0), 0);
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
    const monthlyRevenue = payments.filter(p => p.status === 'CAPTURED').reduce((s: number, p: any) => s + p.amount, 0);
    const pendingTickets = tickets.filter(t => t.status === 'open' || t.status === 'OPEN').length;

    if (authLoading || (!isLoggedIn && !authLoading)) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="spinner" />
            </div>
        );
    }

    const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {API_KEY && (
                <Script
                    src={`https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places`}
                    strategy="lazyOnload"
                />
            )}
            {/* Sidebar */}
            <aside style={{
                width: 260, background: 'var(--bg-card)', borderRight: '1px solid var(--border)',
                padding: '24px 16px', display: 'flex', flexDirection: 'column', position: 'sticky', top: 72, height: 'calc(100vh - 72px)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 8px', marginBottom: 32 }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 14,
                        background: 'var(--gradient-secondary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, color: 'white', fontFamily: 'Outfit', fontSize: '1.1rem',
                    }}>{user?.name?.charAt(0) || 'O'}</div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{user?.name || 'Owner'}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Property Owner</div>
                    </div>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                    {tabs.map(tab => (
                        <button key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`sidebar-link ${activeTab === tab.id ? 'active' : ''}`}
                            style={{ textAlign: 'left', border: 'none', cursor: 'pointer', background: activeTab === tab.id ? undefined : 'transparent' }}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </nav>

                <button onClick={logout} className="sidebar-link" style={{
                    color: 'var(--accent)', marginTop: 'auto', border: 'none',
                    background: 'none', cursor: 'pointer', textAlign: 'left',
                }}>
                    <LogOut size={18} /> Logout
                </button>
            </aside>

            {/* Main */}
            <main style={{ flex: 1, padding: 32 }}>
                {activeTab === 'overview' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                            <div>
                                <h1 style={{ fontFamily: 'Outfit', fontSize: '1.6rem', fontWeight: 700, marginBottom: 4 }}>
                                    Owner Dashboard
                                </h1>
                                <p style={{ color: 'var(--text-muted)' }}>Welcome back, {user?.name?.split(' ')[0] || 'Owner'}. Here&apos;s your portfolio overview.</p>
                            </div>
                            <button className="btn-primary" onClick={() => setActiveTab('add-property')}>
                                <Plus size={16} /> Add Property
                            </button>
                        </div>

                        {dataLoading ? (
                            <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" /></div>
                        ) : (
                            <>
                                {/* KPI Cards */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
                                    <div className="stat-card">
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Monthly Revenue</span>
                                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(108,92,231,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-light)' }}>
                                                <IndianRupee size={18} />
                                            </div>
                                        </div>
                                        <div style={{ fontFamily: 'Outfit', fontSize: '1.6rem', fontWeight: 700 }}>
                                            {formatINR(monthlyRevenue)}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                                            <ArrowUpRight size={14} style={{ color: '#51CF66' }} />
                                            <span style={{ color: '#51CF66', fontSize: '0.8rem', fontWeight: 600 }}>+12.3%</span>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>vs last month</span>
                                        </div>
                                    </div>

                                    <div className="stat-card">
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Occupancy Rate</span>
                                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,206,201,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary)' }}>
                                                <BedDouble size={18} />
                                            </div>
                                        </div>
                                        <div style={{ fontFamily: 'Outfit', fontSize: '1.6rem', fontWeight: 700 }}>
                                            {occupancyRate}%
                                        </div>
                                        <div className="progress-bar" style={{ marginTop: 10 }}>
                                            <div className="progress-bar-fill" style={{ width: `${occupancyRate}%` }} />
                                        </div>
                                    </div>

                                    <div className="stat-card">
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Properties</span>
                                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(253,121,168,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                                                <Building2 size={18} />
                                            </div>
                                        </div>
                                        <div style={{ fontFamily: 'Outfit', fontSize: '1.6rem', fontWeight: 700 }}>
                                            {properties.length}
                                        </div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 6 }}>
                                            {totalBeds} total beds
                                        </div>
                                    </div>

                                    <div className="stat-card">
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Open Tickets</span>
                                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,193,7,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFC107' }}>
                                                <Wrench size={18} />
                                            </div>
                                        </div>
                                        <div style={{ fontFamily: 'Outfit', fontSize: '1.6rem', fontWeight: 700, color: pendingTickets > 0 ? '#FFC107' : 'var(--secondary)' }}>
                                            {pendingTickets}
                                        </div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 6 }}>
                                            {tickets.length} total tickets
                                        </div>
                                    </div>
                                </div>

                                {/* Property List */}
                                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', fontWeight: 600, marginBottom: 16 }}>Property Performance</h3>
                                {properties.length > 0 ? (
                                    <div className="table-container">
                                        <table>
                                            <thead><tr><th>Property</th><th>City</th><th>Type</th><th>Status</th><th>Action</th></tr></thead>
                                            <tbody>
                                                {properties.map(prop => (
                                                    <tr key={prop.id}>
                                                        <td style={{ fontWeight: 500, color: 'white' }}>{prop.name}</td>
                                                        <td>{prop.city}</td>
                                                        <td><span className="badge badge-info">{prop.type}</span></td>
                                                        <td><span className={`badge ${prop.isApproved ? 'badge-success' : 'badge-warning'}`}>{prop.isApproved ? 'Active' : 'Pending'}</span></td>
                                                        <td>
                                                            <Link href={`/dashboard/owner/properties/${prop.id}`} className="btn-ghost" style={{ padding: '4px 12px', fontSize: '0.8rem', color: 'var(--primary-light)' }}>
                                                                View <ChevronRight size={14} />
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                                        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🏠</div>
                                        <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>No properties yet. Add your first property!</p>
                                        <button className="btn-primary">
                                            <Plus size={16} /> Add Property
                                        </button>
                                    </div>
                                )}

                                {/* Recent Tickets */}
                                {tickets.length > 0 && (
                                    <div style={{ marginTop: 32 }}>
                                        <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', fontWeight: 600, marginBottom: 16 }}>Recent Tickets</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {tickets.slice(0, 5).map(t => (
                                                <div key={t.id} className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <div style={{ fontWeight: 500, marginBottom: 4 }}>{t.title}</div>
                                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{t.category} • {t.priority} priority</div>
                                                    </div>
                                                    <span className={`badge ${t.status === 'open' ? 'badge-warning' : t.status === 'resolved' ? 'badge-success' : 'badge-info'}`}>
                                                        {t.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </motion.div>
                )}

                {activeTab === 'properties' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h2 style={{ fontFamily: 'Outfit', fontSize: '1.5rem', fontWeight: 700 }}>My Properties</h2>
                            <button className="btn-primary" onClick={() => setActiveTab('add-property')}>
                                <Plus size={16} /> Add New
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                            {properties.map((prop, i) => (
                                <motion.div key={prop.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                        <div style={{
                                            height: 120, background: `linear-gradient(135deg, hsl(${240 + i * 30}, 40%, 20%), hsl(${260 + i * 30}, 50%, 30%))`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', opacity: 0.6,
                                        }}>🏠</div>
                                        <div style={{ padding: 20 }}>
                                            <h4 style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: 10 }}>{prop.name}</h4>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                                                <div>
                                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>City</div>
                                                    <div style={{ fontWeight: 600 }}>{prop.city}</div>
                                                </div>
                                                <div>
                                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Type</div>
                                                    <div style={{ fontWeight: 600 }}>{prop.type}</div>
                                                </div>
                                                <div>
                                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Gender</div>
                                                    <div style={{ fontWeight: 600 }}>{prop.gender}</div>
                                                </div>
                                                <div>
                                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Status</div>
                                                    <span className={`badge ${prop.isApproved ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>
                                                        {prop.isApproved ? 'Active' : 'Pending'}
                                                    </span>
                                                </div>
                                            </div>
                                            <Link href={`/dashboard/owner/properties/${prop.id}`} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '10px', display: 'flex' }}>
                                                Manage Property
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ───── ADD PROPERTY FORM ───── */}
                {activeTab === 'add-property' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                            <button className="btn-ghost" onClick={() => setActiveTab('properties')} style={{ padding: 8 }}>
                                <ArrowLeft size={20} />
                            </button>
                            <h2 style={{ fontFamily: 'Outfit', fontSize: '1.5rem', fontWeight: 700 }}>Add New Property</h2>
                        </div>

                        {formSuccess && (
                            <div style={{ padding: '14px 18px', marginBottom: 20, borderRadius: 'var(--radius-sm)', background: 'rgba(81,207,102,0.1)', border: '1px solid rgba(81,207,102,0.3)', color: '#51CF66', display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem' }}>
                                <CheckCircle2 size={18} /> {formSuccess}
                            </div>
                        )}
                        {formError && (
                            <div style={{ padding: '14px 18px', marginBottom: 20, borderRadius: 'var(--radius-sm)', background: 'rgba(253,121,168,0.1)', border: '1px solid rgba(253,121,168,0.3)', color: 'var(--accent)', fontSize: '0.9rem' }}>
                                {formError}
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                            {/* Left column - Property Details */}
                            <div className="card">
                                <h3 style={{ fontFamily: 'Outfit', fontWeight: 600, fontSize: '1.1rem', marginBottom: 20 }}>📋 Property Details</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Property Name *</label>
                                        <input className="input" placeholder="e.g. CoLife Sunshine Towers" value={propertyForm.name} onChange={e => setPropertyForm({ ...propertyForm, name: e.target.value })} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        <div>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: 6 }}>City *</label>
                                            <select className="input" value={propertyForm.city} onChange={e => setPropertyForm({ ...propertyForm, city: e.target.value })}>
                                                <option value="Bangalore">Bangalore</option>
                                                <option value="Mumbai">Mumbai</option>
                                                <option value="Delhi">Delhi</option>
                                                <option value="Hyderabad">Hyderabad</option>
                                                <option value="Pune">Pune</option>
                                                <option value="Chennai">Chennai</option>
                                                <option value="Gurgaon">Gurgaon</option>
                                                <option value="Noida">Noida</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Location Area</label>
                                            <input id="location-input" className="input" placeholder="Search neighborhood or landmark..." value={propertyForm.location} onChange={e => setPropertyForm({ ...propertyForm, location: e.target.value })} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gap: 12 }}>
                                        <div>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Full Address *</label>
                                            <input className="input" placeholder="42, 5th Block, Koramangala, Bangalore - 560095" value={propertyForm.address} onChange={e => setPropertyForm({ ...propertyForm, address: e.target.value })} />
                                        </div>
                                        {(propertyForm.lat !== 0 || propertyForm.lng !== 0) && (
                                            <div style={{ fontSize: '0.75rem', color: '#51CF66', display: 'flex', alignItems: 'center', gap: 6, marginTop: -6 }}>
                                                <CheckCircle2 size={12} /> Map coordinates captured automatically
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Description</label>
                                        <textarea className="input" rows={3} placeholder="Describe your property..." value={propertyForm.description} onChange={e => setPropertyForm({ ...propertyForm, description: e.target.value })} style={{ resize: 'vertical', minHeight: 80 }} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        <div>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Property Type *</label>
                                            <select className="input" value={propertyForm.type} onChange={e => setPropertyForm({ ...propertyForm, type: e.target.value })}>
                                                <option value="COLIVING">Co-Living</option>
                                                <option value="PG">PG</option>
                                                <option value="HOSTEL">Hostel</option>
                                                <option value="STUDIO">Studio</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Gender *</label>
                                            <select className="input" value={propertyForm.gender} onChange={e => setPropertyForm({ ...propertyForm, gender: e.target.value })}>
                                                <option value="UNISEX">Unisex</option>
                                                <option value="MALE">Male Only</option>
                                                <option value="FEMALE">Female Only</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Available From</label>
                                        <input className="input" type="date" value={propertyForm.availableFrom} onChange={e => setPropertyForm({ ...propertyForm, availableFrom: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            {/* Right column - Pricing & Amenities */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div className="card">
                                    <h3 style={{ fontFamily: 'Outfit', fontWeight: 600, fontSize: '1.1rem', marginBottom: 20 }}>💰 Pricing</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        <div>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Monthly Rent (₹) *</label>
                                            <input className="input" type="number" placeholder="8500" value={propertyForm.price} onChange={e => setPropertyForm({ ...propertyForm, price: e.target.value })} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Original Price (₹)</label>
                                            <input className="input" type="number" placeholder="10000" value={propertyForm.originalPrice} onChange={e => setPropertyForm({ ...propertyForm, originalPrice: e.target.value })} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Security Deposit (₹)</label>
                                            <input className="input" type="number" placeholder="17000" value={propertyForm.deposit} onChange={e => setPropertyForm({ ...propertyForm, deposit: e.target.value })} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Lock-in Period</label>
                                            <select className="input" value={propertyForm.lockIn} onChange={e => setPropertyForm({ ...propertyForm, lockIn: e.target.value })}>
                                                <option value="1 month">1 Month</option>
                                                <option value="3 months">3 Months</option>
                                                <option value="6 months">6 Months</option>
                                                <option value="12 months">12 Months</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="card">
                                    <h3 style={{ fontFamily: 'Outfit', fontWeight: 600, fontSize: '1.1rem', marginBottom: 16 }}>🏠 Amenities</h3>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {allAmenities.map(am => (
                                            <button key={am} onClick={() => toggleAmenity(am)} style={{
                                                padding: '8px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', cursor: 'pointer', border: '1px solid',
                                                background: selectedAmenities.includes(am) ? 'rgba(108,92,231,0.15)' : 'var(--bg-surface)',
                                                borderColor: selectedAmenities.includes(am) ? 'var(--primary)' : 'var(--border)',
                                                color: selectedAmenities.includes(am) ? 'var(--primary-light)' : 'var(--text-muted)',
                                                fontWeight: selectedAmenities.includes(am) ? 600 : 400,
                                            }}>
                                                {selectedAmenities.includes(am) ? '✓ ' : ''}{am}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Rooms configuration */}
                        <div className="card" style={{ marginTop: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h3 style={{ fontFamily: 'Outfit', fontWeight: 600, fontSize: '1.1rem' }}>🛏️ Room Configuration</h3>
                                <button className="btn-secondary" onClick={addRoom} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                                    <Plus size={14} /> Add Room
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {rooms.map((room, i) => (
                                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 120px 40px', gap: 10, alignItems: 'end' }}>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Room Name</label>
                                            <input className="input" value={room.name} onChange={e => updateRoom(i, 'name', e.target.value)} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Room Type</label>
                                            <select className="input" value={room.type} onChange={e => updateRoom(i, 'type', e.target.value)}>
                                                <option value="Single Room">Single Room</option>
                                                <option value="Double Sharing">Double Sharing</option>
                                                <option value="Triple Sharing">Triple Sharing</option>
                                                <option value="Four Sharing">Four Sharing</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Beds</label>
                                            <input className="input" type="number" min="1" max="8" value={room.capacity} onChange={e => updateRoom(i, 'capacity', e.target.value)} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Price (₹)</label>
                                            <input className="input" type="number" placeholder={propertyForm.price || '0'} value={room.price} onChange={e => updateRoom(i, 'price', e.target.value)} />
                                        </div>
                                        <button onClick={() => removeRoom(i)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 8, opacity: rooms.length === 1 ? 0.3 : 1 }} disabled={rooms.length === 1}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 12 }}>Beds will be auto-created based on room capacity.</p>
                        </div>

                        {/* Submit */}
                        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                            <button className="btn-ghost" onClick={() => setActiveTab('properties')} style={{ padding: '12px 24px' }}>
                                Cancel
                            </button>
                            <button className="btn-primary" onClick={handleCreateProperty} disabled={formSubmitting} style={{ padding: '12px 32px', fontSize: '1rem' }}>
                                {formSubmitting ? 'Creating...' : <><Plus size={16} /> Publish Property</>}
                            </button>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'tickets' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h2 style={{ fontFamily: 'Outfit', fontSize: '1.5rem', fontWeight: 700 }}>Ticket Board</h2>
                        </div>
                        {tickets.length === 0 ? (
                            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No tickets found.</div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                                {tickets.map(t => (
                                    <div key={t.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{t.title}</span>
                                            <span className={`badge ${t.status === 'open' ? 'badge-warning' : t.status === 'resolved' ? 'badge-success' : 'badge-info'}`}>{t.status}</span>
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{t.description}</div>
                                        <div style={{ display: 'flex', gap: 8, fontSize: '0.8rem', flexWrap: 'wrap' }}>
                                            <span className="badge badge-info">{t.category}</span>
                                            <span className="badge badge-warning">{t.priority}</span>
                                        </div>
                                        {t.status !== 'resolved' && (
                                            <button className="btn-secondary" style={{ marginTop: 'auto', justifyContent: 'center' }} onClick={() => alert('Opening ticket drawer for resolution...')}>
                                                Resolve Ticket
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'settings' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div style={{ marginBottom: 24 }}>
                            <h2 style={{ fontFamily: 'Outfit', fontSize: '1.5rem', fontWeight: 700 }}>Settings & Integrations</h2>
                        </div>
                        <div className="card" style={{ maxWidth: 600 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                                <div style={{ padding: 12, background: 'rgba(51, 154, 240, 0.1)', color: '#339af0', borderRadius: 12 }}>
                                    <CreditCard size={24} />
                                </div>
                                <div>
                                    <h3 style={{ fontFamily: 'Outfit', fontSize: '1.2rem', fontWeight: 600 }}>Bank Account Linking</h3>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Receive split payments automatically to your linked bank account via Razorpay.</div>
                                </div>
                            </div>

                            {user?.razorpayLinkedAccountId ? (
                                <div style={{ padding: 20, background: 'rgba(81, 207, 102, 0.1)', border: '1px solid rgba(81, 207, 102, 0.3)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <CheckCircle2 size={24} color="#51cf66" />
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'white' }}>Account Linked Successfully</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Account ID: {user.razorpayLinkedAccountId}</div>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={(e) => { e.preventDefault(); alert('Bank details submitted! This would call your backend to create a Razorpay Route account.'); }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Beneficiary Name</label>
                                        <input className="input" required placeholder="e.g. John Doe Enterprises" />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <div>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Account Number</label>
                                            <input className="input" required placeholder="1234567890" type="password" />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>IFSC Code</label>
                                            <input className="input" required placeholder="HDFC0001234" />
                                        </div>
                                    </div>
                                    <button type="submit" className="btn-primary" style={{ justifyContent: 'center', padding: 14 }}>
                                        Link Bank Account
                                    </button>
                                </form>
                            )}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'revenue' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h2 style={{ fontFamily: 'Outfit', fontSize: '1.4rem', fontWeight: 700, marginBottom: 24 }}>Revenue</h2>

                        {/* Summary cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
                            {[
                                { label: 'Total Collected', value: formatINR(payments.filter(p => p.status === 'CAPTURED').reduce((s: number, p: any) => s + p.amount, 0)), color: 'var(--secondary)' },
                                { label: 'Pending', value: formatINR(payments.filter(p => p.status === 'PENDING').reduce((s: number, p: any) => s + p.amount, 0)), color: '#FFC107' },
                                { label: 'Total Transactions', value: payments.length.toString(), color: 'var(--primary-light)' },
                            ].map(card => (
                                <div key={card.label} className="card" style={{ padding: '20px 24px' }}>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500, marginBottom: 8 }}>{card.label}</div>
                                    <div style={{ fontFamily: 'Outfit', fontSize: '1.5rem', fontWeight: 700, color: card.color }}>{card.value}</div>
                                </div>
                            ))}
                        </div>

                        {/* Payment ledger */}
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>Payment Ledger</div>
                            {payments.length === 0 ? (
                                <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>No payments yet</div>
                            ) : (
                                <div>
                                    {payments.map((p: any) => (
                                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderBottom: '1px solid var(--border)', gap: 12 }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: 2 }}>{p.tenant?.name || 'Tenant'}</div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                                    {p.booking?.room?.property?.name || '—'} • {p.invoiceType?.replace('_', ' ')} • {new Date(p.dueDate || p.createdAt).toLocaleDateString('en-IN')}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>₹{(p.amount || 0).toLocaleString('en-IN')}</div>
                                                <span style={{
                                                    fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                                                    background: p.status === 'CAPTURED' ? 'rgba(81,207,102,0.15)' : p.status === 'PENDING' ? 'rgba(255,193,7,0.15)' : 'rgba(253,121,168,0.15)',
                                                    color: p.status === 'CAPTURED' ? '#51CF66' : p.status === 'PENDING' ? '#FFC107' : '#FD79A8',
                                                }}>{p.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'tenants' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h2 style={{ fontFamily: 'Outfit', fontSize: '1.4rem', fontWeight: 700, marginBottom: 24 }}>Tenants</h2>
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>Active Bookings</div>
                            {bookings.length === 0 ? (
                                <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>No tenants yet</div>
                            ) : (
                                <div>
                                    {bookings.map((b: any) => (
                                        <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 24px', borderBottom: '1px solid var(--border)' }}>
                                            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                                                {(b.tenant?.name || 'T').charAt(0)}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{b.tenant?.name || 'Tenant'}</div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                                    {b.tenant?.phone} • {b.room?.property?.name || '—'} • {b.room?.name || '—'}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>₹{(b.amount || 0).toLocaleString('en-IN')}/mo</div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                                    from {new Date(b.startDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                                                </div>
                                            </div>
                                            <span style={{
                                                fontSize: '0.72rem', fontWeight: 600, padding: '3px 9px', borderRadius: 6, flexShrink: 0,
                                                background: b.status === 'CONFIRMED' ? 'rgba(81,207,102,0.15)' : 'rgba(255,193,7,0.15)',
                                                color: b.status === 'CONFIRMED' ? '#51CF66' : '#FFC107',
                                            }}>{b.status}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
