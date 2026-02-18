'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    LayoutDashboard, Users, Building2, CreditCard, AlertTriangle,
    BarChart3, Bell, Settings, LogOut, UserCheck,
    ShieldCheck, CheckCircle2, Clock, XCircle, ChevronRight,
    Search, Eye, IndianRupee
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { propertiesApi, ticketsApi, paymentsApi, notificationsApi } from '@/lib/api';

export default function AdminDashboard() {
    const { user, loading: authLoading, isLoggedIn, logout } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('overview');
    const [properties, setProperties] = useState<any[]>([]);
    const [tickets, setTickets] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!authLoading && !isLoggedIn) {
            router.push('/auth/login');
        }
    }, [authLoading, isLoggedIn, router]);

    useEffect(() => {
        if (!isLoggedIn) return;
        const fetchData = async () => {
            try {
                const [propsRes, ticketsRes, notifRes] = await Promise.allSettled([
                    propertiesApi.search(),
                    ticketsApi.getAll(),
                    notificationsApi.getAll(),
                ]);
                if (propsRes.status === 'fulfilled') {
                    const p = (propsRes.value as any)?.properties || (propsRes.value as any) || [];
                    setProperties(Array.isArray(p) ? p : []);
                }
                if (ticketsRes.status === 'fulfilled') {
                    const t = (ticketsRes.value as any)?.tickets || (ticketsRes.value as any) || [];
                    setTickets(Array.isArray(t) ? t : []);
                }
                if (notifRes.status === 'fulfilled') {
                    const n = (notifRes.value as any)?.notifications || (notifRes.value as any) || [];
                    setNotifications(Array.isArray(n) ? n : []);
                }
            } catch { /* silent */ } finally {
                setDataLoading(false);
            }
        };
        fetchData();
    }, [isLoggedIn]);

    const tabs = [
        { id: 'overview', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
        { id: 'properties', icon: <Building2 size={18} />, label: 'Properties' },
        { id: 'escalations', icon: <AlertTriangle size={18} />, label: 'Tickets' },
        { id: 'notifications', icon: <Bell size={18} />, label: 'Notifications' },
        { id: 'settings', icon: <Settings size={18} />, label: 'Settings' },
    ];

    const openTickets = tickets.filter(t => t.status === 'open').length;
    const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;
    const approvedProps = properties.filter(p => p.isApproved).length;
    const pendingProps = properties.filter(p => !p.isApproved).length;

    const filteredProperties = properties.filter(p =>
        !searchTerm || p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (authLoading || (!isLoggedIn && !authLoading)) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="spinner" />
            </div>
        );
    }

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
                        background: 'var(--gradient-accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, color: 'white', fontFamily: 'Outfit', fontSize: '1.1rem',
                    }}>{user?.name?.charAt(0) || 'A'}</div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{user?.name || 'Admin'}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Administrator</div>
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
                            {tab.id === 'escalations' && openTickets > 0 && (
                                <span style={{ marginLeft: 'auto', background: 'var(--accent)', color: 'white', borderRadius: 20, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700 }}>
                                    {openTickets}
                                </span>
                            )}
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
                        <div style={{ marginBottom: 32 }}>
                            <h1 style={{ fontFamily: 'Outfit', fontSize: '1.6rem', fontWeight: 700, marginBottom: 4 }}>
                                Admin Dashboard
                            </h1>
                            <p style={{ color: 'var(--text-muted)' }}>Platform overview and management</p>
                        </div>

                        {dataLoading ? (
                            <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" /></div>
                        ) : (
                            <>
                                {/* KPI Cards */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
                                    <div className="stat-card">
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Properties</span>
                                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(108,92,231,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-light)' }}>
                                                <Building2 size={18} />
                                            </div>
                                        </div>
                                        <div style={{ fontFamily: 'Outfit', fontSize: '1.6rem', fontWeight: 700 }}>
                                            {properties.length}
                                        </div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 6 }}>
                                            {approvedProps} approved, {pendingProps} pending
                                        </div>
                                    </div>

                                    <div className="stat-card">
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Open Tickets</span>
                                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,193,7,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFC107' }}>
                                                <AlertTriangle size={18} />
                                            </div>
                                        </div>
                                        <div style={{ fontFamily: 'Outfit', fontSize: '1.6rem', fontWeight: 700, color: openTickets > 0 ? '#FFC107' : 'inherit' }}>
                                            {openTickets}
                                        </div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 6 }}>
                                            {resolvedTickets} resolved
                                        </div>
                                    </div>

                                    <div className="stat-card">
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Verified Properties</span>
                                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(81,207,102,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#51CF66' }}>
                                                <ShieldCheck size={18} />
                                            </div>
                                        </div>
                                        <div style={{ fontFamily: 'Outfit', fontSize: '1.6rem', fontWeight: 700 }}>
                                            {approvedProps}
                                        </div>
                                        <div className="progress-bar" style={{ marginTop: 10 }}>
                                            <div className="progress-bar-fill" style={{ width: properties.length ? `${(approvedProps / properties.length) * 100}%` : '0%' }} />
                                        </div>
                                    </div>

                                    <div className="stat-card">
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Notifications</span>
                                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,206,201,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary)' }}>
                                                <Bell size={18} />
                                            </div>
                                        </div>
                                        <div style={{ fontFamily: 'Outfit', fontSize: '1.6rem', fontWeight: 700 }}>
                                            {notifications.length}
                                        </div>
                                    </div>
                                </div>

                                {/* Recent tickets */}
                                {tickets.length > 0 && (
                                    <>
                                        <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', fontWeight: 600, marginBottom: 16 }}>Recent Tickets</h3>
                                        <div className="table-container" style={{ marginBottom: 32 }}>
                                            <table>
                                                <thead><tr><th>Title</th><th>Category</th><th>Priority</th><th>Status</th></tr></thead>
                                                <tbody>
                                                    {tickets.slice(0, 10).map(t => (
                                                        <tr key={t.id}>
                                                            <td style={{ fontWeight: 500, color: 'white' }}>{t.title}</td>
                                                            <td><span className="badge badge-info">{t.category}</span></td>
                                                            <td>
                                                                <span className={`badge ${t.priority === 'high' ? 'badge-danger' : t.priority === 'medium' ? 'badge-warning' : 'badge-info'}`}>
                                                                    {t.priority}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className={`badge ${t.status === 'open' ? 'badge-warning' : 'badge-success'}`}>
                                                                    {t.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}

                                {/* Properties list */}
                                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', fontWeight: 600, marginBottom: 16 }}>Properties</h3>
                                {properties.length > 0 ? (
                                    <div className="table-container">
                                        <table>
                                            <thead><tr><th>Property</th><th>City</th><th>Type</th><th>Status</th><th>Action</th></tr></thead>
                                            <tbody>
                                                {properties.map(p => (
                                                    <tr key={p.id}>
                                                        <td style={{ fontWeight: 500, color: 'white' }}>{p.name}</td>
                                                        <td>{p.city}</td>
                                                        <td>{p.type}</td>
                                                        <td><span className={`badge ${p.isApproved ? 'badge-success' : 'badge-warning'}`}>{p.isApproved ? 'Approved' : 'Pending'}</span></td>
                                                        <td>
                                                            <Link href={`/properties/${p.id}`} className="btn-ghost" style={{ padding: '4px 12px', fontSize: '0.8rem', color: 'var(--primary-light)' }}>
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
                                        <p style={{ color: 'var(--text-muted)' }}>No properties found.</p>
                                    </div>
                                )}
                            </>
                        )}
                    </motion.div>
                )}

                {activeTab === 'properties' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h2 style={{ fontFamily: 'Outfit', fontSize: '1.5rem', fontWeight: 700 }}>All Properties</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '8px 16px' }}>
                                <Search size={16} style={{ color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    placeholder="Search properties..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ background: 'none', border: 'none', color: 'white', outline: 'none', fontSize: '0.9rem', width: 200 }}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                            {filteredProperties.map((p, i) => (
                                <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                    <div className="card" style={{ padding: 20 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                                            <h4 style={{ fontWeight: 600, fontSize: '1rem' }}>{p.name}</h4>
                                            <span className={`badge ${p.isApproved ? 'badge-success' : 'badge-warning'}`}>{p.isApproved ? 'Approved' : 'Pending'}</span>
                                        </div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>{p.city} • {p.type} • {p.gender}</div>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16, lineHeight: 1.5 }}>{p.description?.substring(0, 100)}...</p>
                                        <Link href={`/properties/${p.id}`} className="btn-ghost" style={{ fontSize: '0.85rem', color: 'var(--primary-light)' }}>
                                            <Eye size={14} /> View Details
                                        </Link>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'escalations' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h2 style={{ fontFamily: 'Outfit', fontSize: '1.5rem', fontWeight: 700, marginBottom: 24 }}>Maintenance Tickets</h2>
                        {tickets.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {tickets.map(t => (
                                    <div key={t.id} className="card" style={{ padding: '20px 24px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                                            <div>
                                                <h4 style={{ fontWeight: 600, marginBottom: 4 }}>{t.title}</h4>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t.description}</p>
                                            </div>
                                            <span className={`badge ${t.status === 'open' ? 'badge-warning' : t.status === 'resolved' ? 'badge-success' : 'badge-info'}`}>
                                                {t.status}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📁 {t.category}</span>
                                            <span style={{ fontSize: '0.8rem', color: t.priority === 'high' ? 'var(--accent)' : 'var(--text-muted)' }}>⚡ {t.priority}</span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📅 {new Date(t.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>✅</div>
                                <p style={{ color: 'var(--text-muted)' }}>No tickets found.</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {(activeTab === 'notifications' || activeTab === 'settings') && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '80px 24px' }}>
                        <div style={{ fontSize: '4rem', marginBottom: 20 }}>
                            {activeTab === 'notifications' ? '🔔' : '⚙️'}
                        </div>
                        <h2 style={{ fontFamily: 'Outfit', fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>
                            {activeTab === 'notifications' ? `Notifications (${notifications.length})` : 'Settings'}
                        </h2>
                        <p style={{ color: 'var(--text-muted)' }}>
                            {activeTab === 'notifications' ? 'Notification management coming soon.' : 'Settings module coming soon.'}
                        </p>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
