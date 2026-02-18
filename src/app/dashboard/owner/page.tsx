'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Home, Building2, BarChart3, CreditCard, Users, Settings,
    LogOut, TrendingUp, IndianRupee, BedDouble,
    Wrench, AlertCircle, ChevronRight, ArrowUpRight, Plus
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { propertiesApi, ticketsApi, bookingsApi, paymentsApi } from '@/lib/api';

export default function OwnerDashboard() {
    const { user, loading: authLoading, isLoggedIn, logout } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('overview');
    const [properties, setProperties] = useState<any[]>([]);
    const [tickets, setTickets] = useState<any[]>([]);
    const [dataLoading, setDataLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !isLoggedIn) {
            router.push('/auth/login');
        }
    }, [authLoading, isLoggedIn, router]);

    useEffect(() => {
        if (!isLoggedIn) return;
        const fetchData = async () => {
            try {
                const [propsRes, ticketsRes] = await Promise.allSettled([
                    propertiesApi.search(),
                    ticketsApi.getAll(),
                ]);
                if (propsRes.status === 'fulfilled') {
                    const p = (propsRes.value as any)?.properties || (propsRes.value as any) || [];
                    setProperties(Array.isArray(p) ? p : []);
                }
                if (ticketsRes.status === 'fulfilled') {
                    const t = (ticketsRes.value as any)?.tickets || (ticketsRes.value as any) || [];
                    setTickets(Array.isArray(t) ? t : []);
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
        { id: 'settings', icon: <Settings size={18} />, label: 'Settings' },
    ];

    const formatINR = (n: number) => {
        if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
        if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
        return `₹${n.toLocaleString('en-IN')}`;
    };

    const totalBeds = properties.length * 12;
    const occupiedBeds = Math.round(totalBeds * 0.87);
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
    const monthlyRevenue = properties.length * 285000;
    const pendingTickets = tickets.filter(t => t.status === 'open').length;

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
                            <button className="btn-primary" onClick={() => setActiveTab('properties')}>
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
                                                            <Link href={`/properties/${prop.id}`} className="btn-ghost" style={{ padding: '4px 12px', fontSize: '0.8rem', color: 'var(--primary-light)' }}>
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
                                            <Link href={`/properties/${prop.id}`} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '10px', display: 'flex' }}>
                                                Manage Property
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {(activeTab === 'revenue' || activeTab === 'tenants' || activeTab === 'settings') && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '80px 24px' }}>
                        <div style={{ fontSize: '4rem', marginBottom: 20 }}>
                            {activeTab === 'revenue' ? '📊' : activeTab === 'tenants' ? '👥' : '⚙️'}
                        </div>
                        <h2 style={{ fontFamily: 'Outfit', fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>
                            {activeTab === 'revenue' ? 'Revenue Analytics' : activeTab === 'tenants' ? 'Tenant Management' : 'Settings'}
                        </h2>
                        <p style={{ color: 'var(--text-muted)' }}>
                            This module is coming soon. Stay tuned!
                        </p>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
