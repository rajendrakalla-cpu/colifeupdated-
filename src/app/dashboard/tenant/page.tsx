'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Home, CreditCard, Wrench, Calendar, Bell, MessageCircle,
    User, LogOut, ChevronRight, Clock, CheckCircle2, AlertCircle,
    Star, Users, PartyPopper, ClipboardList, Eye
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { bookingsApi, ticketsApi, notificationsApi, paymentsApi, propertiesApi } from '@/lib/api';

export default function TenantDashboard() {
    const { user, loading: authLoading, isLoggedIn, logout } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('overview');
    const [tickets, setTickets] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [ticketForm, setTicketForm] = useState({ title: '', description: '', category: 'electrical', priority: 'medium' });
    const [ticketSubmitting, setTicketSubmitting] = useState(false);
    const [ticketSuccess, setTicketSuccess] = useState('');

    // Redirect if not logged in
    useEffect(() => {
        if (!authLoading && !isLoggedIn) {
            router.push('/auth/login');
        }
    }, [authLoading, isLoggedIn, router]);

    // Fetch dashboard data
    useEffect(() => {
        if (!isLoggedIn) return;
        const fetchData = async () => {
            try {
                const [ticketsRes, bookingsRes, paymentsRes, notifRes] = await Promise.allSettled([
                    ticketsApi.getAll(),
                    bookingsApi.getAll(),
                    paymentsApi.getHistory(),
                    notificationsApi.getAll(),
                ]);
                if (ticketsRes.status === 'fulfilled') setTickets((ticketsRes.value as any)?.tickets || (ticketsRes.value as any) || []);
                if (bookingsRes.status === 'fulfilled') setBookings((bookingsRes.value as any)?.bookings || (bookingsRes.value as any) || []);
                if (paymentsRes.status === 'fulfilled') setPayments((paymentsRes.value as any)?.payments || (paymentsRes.value as any) || []);
                if (notifRes.status === 'fulfilled') setNotifications((notifRes.value as any)?.notifications || (notifRes.value as any) || []);
            } catch {
                // Silently handle — the dashboard still works with empty data
            } finally {
                setDataLoading(false);
            }
        };
        fetchData();
    }, [isLoggedIn]);

    const handleCreateTicket = async () => {
        if (!ticketForm.title.trim()) return;
        setTicketSubmitting(true);
        try {
            // Get first property ID for the ticket
            const propsRes = await propertiesApi.search();
            const props = (propsRes as any)?.properties || propsRes || [];
            const propId = Array.isArray(props) && props.length > 0 ? props[0].id : undefined;

            await ticketsApi.create({
                ...ticketForm,
                ...(propId && { propertyId: propId }),
            });
            setTicketSuccess('Ticket created successfully!');
            setTicketForm({ title: '', description: '', category: 'electrical', priority: 'medium' });
            // Refresh tickets
            const updatedTickets = await ticketsApi.getAll();
            const t = (updatedTickets as any)?.tickets || updatedTickets || [];
            setTickets(Array.isArray(t) ? t : []);
            setTimeout(() => {
                setShowTicketModal(false);
                setTicketSuccess('');
            }, 1500);
        } catch {
            setTicketSuccess('Failed to create ticket');
        } finally {
            setTicketSubmitting(false);
        }
    };

    if (authLoading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="animate-pulse-glow" style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--primary)' }} />
            </div>
        );
    }

    if (!isLoggedIn) return null;

    const userName = user?.name || 'User';
    const userInitial = userName.charAt(0).toUpperCase();
    const userRole = user?.role || 'tenant';
    const openTickets = tickets.filter(t => t.status !== 'RESOLVED' && t.status !== 'CLOSED').length;
    const resolvedTickets = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

    const tabs = [
        { id: 'overview', icon: <Home size={18} />, label: 'Overview' },
        { id: 'payments', icon: <CreditCard size={18} />, label: 'Payments' },
        { id: 'maintenance', icon: <Wrench size={18} />, label: 'Maintenance' },
        { id: 'community', icon: <Users size={18} />, label: 'Community' },
        { id: 'profile', icon: <User size={18} />, label: 'Profile' },
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar */}
            <aside style={{
                width: 260, background: 'var(--bg-card)', borderRight: '1px solid var(--border)',
                padding: '24px 16px', display: 'flex', flexDirection: 'column', position: 'sticky', top: 72, height: 'calc(100vh - 72px)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 8px', marginBottom: 32 }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 14,
                        background: 'var(--gradient-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, color: 'white', fontFamily: 'Outfit', fontSize: '1.1rem',
                    }}>{userInitial}</div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{userName}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'capitalize' }}>{userRole}</div>
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

                <button onClick={logout} className="sidebar-link" style={{ color: 'var(--accent)', marginTop: 'auto', border: 'none', cursor: 'pointer', background: 'transparent', textAlign: 'left' }}>
                    <LogOut size={18} /> Logout
                </button>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, padding: 32 }}>
                {activeTab === 'overview' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h1 style={{ fontFamily: 'Outfit', fontSize: '1.6rem', fontWeight: 700, marginBottom: 6 }}>
                            Welcome back, {userName}! 👋
                        </h1>
                        <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>
                            Here&apos;s your dashboard overview
                        </p>

                        {/* Stats row */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 32 }}>
                            <div className="stat-card">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                    <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(108,92,231,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-light)' }}>
                                        <Home size={20} />
                                    </div>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Active Bookings</span>
                                </div>
                                <div style={{ fontFamily: 'Outfit', fontSize: '1.5rem', fontWeight: 700 }}>
                                    {bookings.filter(b => b.status === 'CONFIRMED').length}
                                </div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 4 }}>
                                    {bookings.length} total bookings
                                </div>
                            </div>

                            <div className="stat-card" style={{ overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--gradient-accent)' }} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                    <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(253,121,168,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                                        <CreditCard size={20} />
                                    </div>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Payments</span>
                                </div>
                                <div style={{ fontFamily: 'Outfit', fontSize: '1.5rem', fontWeight: 700 }}>
                                    {payments.length}
                                </div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 4 }}>
                                    total transactions
                                </div>
                            </div>

                            <div className="stat-card">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                    <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(0,206,201,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary)' }}>
                                        <Wrench size={20} />
                                    </div>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Maintenance</span>
                                </div>
                                <div style={{ display: 'flex', gap: 20 }}>
                                    <div>
                                        <div style={{ fontFamily: 'Outfit', fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent)' }}>
                                            {openTickets}
                                        </div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Open</div>
                                    </div>
                                    <div>
                                        <div style={{ fontFamily: 'Outfit', fontSize: '1.3rem', fontWeight: 700, color: 'var(--secondary)' }}>
                                            {resolvedTickets}
                                        </div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Resolved</div>
                                    </div>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                    <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,193,7,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFC107' }}>
                                        <Bell size={20} />
                                    </div>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Notifications</span>
                                </div>
                                <div style={{ fontFamily: 'Outfit', fontSize: '1.3rem', fontWeight: 700 }}>
                                    {notifications.length}
                                </div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 4 }}>unread messages</div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', fontWeight: 600, marginBottom: 16 }}>Quick Actions</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 32 }}>
                            {[
                                { icon: <CreditCard size={20} />, label: 'Pay Rent', color: 'var(--primary)' },
                                { icon: <Wrench size={20} />, label: 'Raise Ticket', color: 'var(--accent)', onClick: () => setActiveTab('maintenance') },
                                { icon: <Eye size={20} />, label: 'Browse Properties', color: 'var(--secondary)', href: '/properties' },
                                { icon: <MessageCircle size={20} />, label: 'Chat Support', color: '#FFC107' },
                                { icon: <ClipboardList size={20} />, label: 'My Bookings', color: '#9B59B6', onClick: () => setActiveTab('payments') },
                                { icon: <Star size={20} />, label: 'Rate Property', color: '#E67E22' },
                            ].map(action => (
                                <button key={action.label} className="card"
                                    onClick={() => {
                                        if ('href' in action && action.href) router.push(action.href);
                                        else if ('onClick' in action && action.onClick) (action.onClick as () => void)();
                                    }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 12,
                                        cursor: 'pointer', border: '1px solid var(--border)',
                                        padding: '18px', textAlign: 'left',
                                    }}>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 12,
                                        background: `${action.color}15`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: action.color,
                                    }}>
                                        {action.icon}
                                    </div>
                                    <span style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                        {action.label}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Recent Tickets */}
                        {tickets.length > 0 && (
                            <>
                                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', fontWeight: 600, marginBottom: 16 }}>
                                    Recent Tickets
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {tickets.slice(0, 3).map(ticket => (
                                        <div key={ticket.id} className="card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{ticket.title}</div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 4 }}>{ticket.category} · {ticket.priority}</div>
                                            </div>
                                            <span className={`badge ${ticket.status === 'IN_PROGRESS' ? 'badge-accent' : ticket.status === 'RESOLVED' ? 'badge-success' : 'badge-primary'}`}>
                                                {ticket.status === 'IN_PROGRESS' ? <Clock size={12} /> : ticket.status === 'RESOLVED' ? <CheckCircle2 size={12} /> : null}
                                                {' '}{ticket.status?.replace('_', ' ')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </motion.div>
                )}

                {activeTab === 'payments' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h2 style={{ fontFamily: 'Outfit', fontSize: '1.5rem', fontWeight: 700, marginBottom: 24 }}>Payments & Bookings</h2>

                        {/* Bookings */}
                        <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', fontWeight: 600, marginBottom: 16 }}>My Bookings</h3>
                        {bookings.length > 0 ? (
                            <div className="table-container" style={{ marginBottom: 32 }}>
                                <table>
                                    <thead><tr><th>Property</th><th>Room</th><th>Status</th><th>Date</th></tr></thead>
                                    <tbody>
                                        {bookings.map(b => (
                                            <tr key={b.id}>
                                                <td style={{ fontWeight: 500, color: 'white' }}>{b.room?.property?.name || 'Property'}</td>
                                                <td>{b.room?.name || 'Room'}</td>
                                                <td><span className={`badge ${b.status === 'CONFIRMED' ? 'badge-success' : 'badge-primary'}`}>{b.status}</span></td>
                                                <td>{new Date(b.createdAt).toLocaleDateString('en-IN')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="card" style={{ padding: 32, textAlign: 'center', marginBottom: 32 }}>
                                <p style={{ color: 'var(--text-muted)' }}>No bookings yet. <Link href="/properties" style={{ color: 'var(--primary-light)' }}>Browse properties</Link></p>
                            </div>
                        )}

                        {/* Payment history */}
                        <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', fontWeight: 600, marginBottom: 16 }}>Payment History</h3>
                        {payments.length > 0 ? (
                            <div className="table-container">
                                <table>
                                    <thead><tr><th>Amount</th><th>Date</th><th>Status</th><th>Ref</th></tr></thead>
                                    <tbody>
                                        {payments.map(p => (
                                            <tr key={p.id}>
                                                <td style={{ fontWeight: 500, color: 'white' }}>₹{p.amount?.toLocaleString('en-IN')}</td>
                                                <td>{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                                                <td><span className={`badge ${p.status === 'CAPTURED' ? 'badge-success' : 'badge-primary'}`}><CheckCircle2 size={12} /> {p.status}</span></td>
                                                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{p.razorpayPaymentId || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="card" style={{ padding: 32, textAlign: 'center' }}>
                                <p style={{ color: 'var(--text-muted)' }}>No payment history yet</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'maintenance' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h2 style={{ fontFamily: 'Outfit', fontSize: '1.5rem', fontWeight: 700 }}>Maintenance Requests</h2>
                            <button className="btn-primary" onClick={() => setShowTicketModal(true)}>
                                <Wrench size={16} /> New Request
                            </button>
                        </div>

                        {tickets.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {tickets.map(ticket => (
                                    <div key={ticket.id} className="card" style={{ padding: 20 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'monospace' }}>#{ticket.id?.slice(0, 8)}</span>
                                                    <span className={`badge ${ticket.priority === 'HIGH' || ticket.priority === 'URGENT' ? 'badge-accent' : 'badge-primary'}`}>
                                                        {ticket.priority}
                                                    </span>
                                                    <span className="badge badge-secondary">{ticket.category}</span>
                                                </div>
                                                <h4 style={{ fontWeight: 600, fontSize: '1rem' }}>{ticket.title}</h4>
                                                {ticket.description && (
                                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>{ticket.description}</p>
                                                )}
                                            </div>
                                            <span className={`badge ${ticket.status === 'IN_PROGRESS' ? 'badge-accent' : ticket.status === 'RESOLVED' ? 'badge-success' : 'badge-primary'}`} style={{
                                                display: 'flex', alignItems: 'center', gap: 4,
                                            }}>
                                                {ticket.status === 'IN_PROGRESS' ? <Clock size={12} /> : ticket.status === 'RESOLVED' ? <CheckCircle2 size={12} /> : null}
                                                {ticket.status?.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: 20, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                            <span>Created: {new Date(ticket.createdAt).toLocaleDateString('en-IN')}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                                <Wrench size={36} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>No maintenance tickets yet</p>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Click &quot;New Request&quot; to raise your first ticket</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'community' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h2 style={{ fontFamily: 'Outfit', fontSize: '1.5rem', fontWeight: 700, marginBottom: 24 }}>Community</h2>

                        <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', fontWeight: 600, marginBottom: 16 }}>📢 Notices</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                            {notifications.length > 0 ? notifications.slice(0, 5).map(n => (
                                <div key={n.id} className="card" style={{ padding: 20, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: 10,
                                        background: 'rgba(108,92,231,0.1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                    }}>
                                        <Bell size={18} style={{ color: 'var(--primary-light)' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 4 }}>{n.title}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{n.message || n.body}</div>
                                    </div>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                        {new Date(n.createdAt).toLocaleDateString('en-IN')}
                                    </span>
                                </div>
                            )) : (
                                <div className="card" style={{ padding: 32, textAlign: 'center' }}>
                                    <p style={{ color: 'var(--text-muted)' }}>No notifications yet</p>
                                </div>
                            )}
                        </div>

                        <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', fontWeight: 600, marginBottom: 16 }}>🎉 Community Events</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                            {[
                                { name: 'Movie Night', date: 'Coming Soon', time: '7:00 PM', emoji: '🎬' },
                                { name: 'Weekend Potluck', date: 'Coming Soon', time: '1:00 PM', emoji: '🍕' },
                                { name: 'Sunday Cricket', date: 'Coming Soon', time: '6:30 AM', emoji: '🏏' },
                            ].map(event => (
                                <div key={event.name} className="card" style={{ padding: 20, textAlign: 'center' }}>
                                    <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>{event.emoji}</div>
                                    <h4 style={{ fontWeight: 600, marginBottom: 6 }}>{event.name}</h4>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 14 }}>{event.date} at {event.time}</div>
                                    <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
                                        RSVP ✓
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'profile' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h2 style={{ fontFamily: 'Outfit', fontSize: '1.5rem', fontWeight: 700, marginBottom: 24 }}>My Profile</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
                            <div className="card" style={{ padding: 28 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                                    <div style={{
                                        width: 64, height: 64, borderRadius: 18,
                                        background: 'var(--gradient-primary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 700, color: 'white', fontFamily: 'Outfit', fontSize: '1.5rem',
                                    }}>{userInitial}</div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '1.2rem', fontFamily: 'Outfit' }}>{userName}</div>
                                        <span className={`badge ${user?.kycStatus === 'VERIFIED' ? 'badge-success' : 'badge-primary'}`}>
                                            {user?.kycStatus === 'VERIFIED' ? 'KYC Verified ✓' : 'KYC Pending'}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {[
                                        { label: 'Phone', value: user?.phone || '—' },
                                        { label: 'Email', value: user?.email || '—' },
                                        { label: 'Gender', value: user?.gender || '—' },
                                        { label: 'Role', value: (user?.role || '—').charAt(0).toUpperCase() + (user?.role || '').slice(1) },
                                    ].map(field => (
                                        <div key={field.label} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{field.label}</span>
                                            <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{field.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="card" style={{ padding: 28 }}>
                                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', fontWeight: 600, marginBottom: 20 }}>📊 Activity Summary</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {[
                                        { label: 'Total Bookings', value: String(bookings.length) },
                                        { label: 'Active Bookings', value: String(bookings.filter(b => b.status === 'CONFIRMED').length) },
                                        { label: 'Tickets Raised', value: String(tickets.length) },
                                        { label: 'Open Tickets', value: String(openTickets) },
                                        { label: 'Payments Made', value: String(payments.length) },
                                    ].map(f => (
                                        <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{f.label}</span>
                                            <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{f.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </main>

            {/* Raise Ticket Modal */}
            {showTicketModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
                }} onClick={() => setShowTicketModal(false)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="card"
                        style={{ padding: 32, width: '100%', maxWidth: 480 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ fontFamily: 'Outfit', fontSize: '1.3rem', fontWeight: 700, marginBottom: 24 }}>
                            🔧 Raise a Ticket
                        </h3>

                        {ticketSuccess && (
                            <div style={{ padding: '10px 16px', borderRadius: 10, background: ticketSuccess.includes('success') ? 'rgba(81,207,102,0.1)' : 'rgba(253,121,168,0.1)', color: ticketSuccess.includes('success') ? '#51CF66' : 'var(--accent)', marginBottom: 16, fontSize: '0.9rem' }}>
                                {ticketSuccess}
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Title *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. AC not working"
                                    value={ticketForm.title}
                                    onChange={e => setTicketForm(f => ({ ...f, title: e.target.value }))}
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'white', fontSize: '0.9rem' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Description</label>
                                <textarea
                                    placeholder="Describe the issue in detail..."
                                    value={ticketForm.description}
                                    onChange={e => setTicketForm(f => ({ ...f, description: e.target.value }))}
                                    rows={3}
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'white', fontSize: '0.9rem', resize: 'vertical', fontFamily: 'inherit' }}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Category</label>
                                    <select
                                        value={ticketForm.category}
                                        onChange={e => setTicketForm(f => ({ ...f, category: e.target.value }))}
                                        style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'white', fontSize: '0.9rem' }}
                                    >
                                        <option value="electrical">Electrical</option>
                                        <option value="plumbing">Plumbing</option>
                                        <option value="furniture">Furniture</option>
                                        <option value="cleaning">Cleaning</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Priority</label>
                                    <select
                                        value={ticketForm.priority}
                                        onChange={e => setTicketForm(f => ({ ...f, priority: e.target.value }))}
                                        style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'white', fontSize: '0.9rem' }}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                                <button
                                    className="btn-ghost"
                                    onClick={() => setShowTicketModal(false)}
                                    style={{ flex: 1, justifyContent: 'center' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn-primary"
                                    onClick={handleCreateTicket}
                                    disabled={ticketSubmitting || !ticketForm.title.trim()}
                                    style={{ flex: 1, justifyContent: 'center', opacity: ticketSubmitting ? 0.6 : 1 }}
                                >
                                    {ticketSubmitting ? 'Submitting...' : 'Submit Ticket'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
