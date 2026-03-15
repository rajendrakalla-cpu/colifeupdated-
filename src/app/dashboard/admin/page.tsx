'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    LayoutDashboard, Users, Building2, CreditCard, AlertTriangle,
    Bell, Settings, LogOut, ShieldCheck, CheckCircle2, XCircle, ChevronRight,
    Search, Eye, IndianRupee, Edit3, Ban, UserCheck, Percent, Save, X
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { adminApi, propertiesApi, ticketsApi } from '@/lib/api';
import { UserPlus, Plus } from 'lucide-react';

const formatINR = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function AdminDashboard() {
    const { user, loading: authLoading, isLoggedIn, logout } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('overview');

    // Data
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [properties, setProperties] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [tickets, setTickets] = useState<any[]>([]);
    const [revenueData, setRevenueData] = useState<{ totalRevenue: number; platformRevenue: number }>({ totalRevenue: 0, platformRevenue: 0 });
    const [dataLoading, setDataLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    // Modals
    const [editingUser, setEditingUser] = useState<any>(null);
    const [editingProperty, setEditingProperty] = useState<any>(null);
    const [editingPropertyData, setEditingPropertyData] = useState<any>(null);
    const [platformFee, setPlatformFee] = useState(5);
    const [actionProcessing, setActionProcessing] = useState(false);
    const [showCreateOwner, setShowCreateOwner] = useState(false);
    const [showAddProperty, setShowAddProperty] = useState(false);
    const [owners, setOwners] = useState<any[]>([]);
    const [resolvingTicketId, setResolvingTicketId] = useState<string | null>(null);
    const [chargeAmount, setChargeAmount] = useState('');

    useEffect(() => {
        if (!authLoading && !isLoggedIn) router.push('/auth/login');
    }, [authLoading, isLoggedIn, router]);

    useEffect(() => {
        if (!isLoggedIn) return;
        const fetchData = async () => {
            try {
                const [statsRes, propsRes, ticketsRes] = await Promise.allSettled([
                    adminApi.getStats(),
                    propertiesApi.search(),
                    ticketsApi.getAll(),
                ]);
                if (statsRes.status === 'fulfilled') setStats(statsRes.value);
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

    // Lazy load tab data
    useEffect(() => {
        if (activeTab === 'users' && users.length === 0) {
            adminApi.getUsers().then(res => setUsers(res.users || [])).catch(() => { });
        }
        if (activeTab === 'payments' && payments.length === 0) {
            adminApi.getPayments().then(res => {
                setPayments(res.payments || []);
                setRevenueData({ totalRevenue: res.totalRevenue ?? 0, platformRevenue: res.platformRevenue ?? 0 });
            }).catch(() => { });
        }
    }, [activeTab]);

    const handleApproveProperty = async (id: string, approve: boolean) => {
        setActionProcessing(true);
        try {
            await adminApi.updateProperty(id, { isApproved: approve, platformFeePercent: platformFee });
            setProperties(prev => prev.map(p => p.id === id ? { ...p, isApproved: approve, platformFeePercent: platformFee } : p));
            setEditingProperty(null);
        } catch { alert('Failed to update property'); }
        finally { setActionProcessing(false); }
    };

    const handleUpdateUser = async (id: string, data: any) => {
        setActionProcessing(true);
        try {
            const res = await adminApi.updateUser(id, data);
            setUsers(prev => prev.map(u => u.id === id ? { ...u, ...res.user } : u));
            setEditingUser(null);
        } catch { alert('Failed to update user'); }
        finally { setActionProcessing(false); }
    };

    const handleUpdateTicket = async (id: string, status: string, charge?: number) => {
        try {
            const payload: any = { status };
            if (charge && charge > 0) {
                payload.chargeAmount = charge;
            }
            await ticketsApi.update(id, payload);
            setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
            setResolvingTicketId(null);
            setChargeAmount('');
            if (charge && charge > 0) {
                alert(`Ticket resolved! ₹${charge} utility charge created for the tenant.`);
            }
        } catch { alert('Failed to update ticket'); }
    };

    const tabs = [
        { id: 'overview', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
        { id: 'users', icon: <Users size={18} />, label: 'Users' },
        { id: 'properties', icon: <Building2 size={18} />, label: 'Properties' },
        { id: 'payments', icon: <CreditCard size={18} />, label: 'Payments' },
        { id: 'tickets', icon: <AlertTriangle size={18} />, label: 'Tickets' },
    ];

    const filteredUsers = users.filter(u => {
        const matchesRole = !roleFilter || u.role === roleFilter;
        const matchesSearch = !searchTerm || u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.phone?.includes(searchTerm);
        return matchesRole && matchesSearch;
    });

    const pendingProps = properties.filter(p => !p.isApproved);
    const openTickets = tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;

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
                        background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, color: 'white', fontFamily: 'Outfit', fontSize: '1.1rem',
                    }}>{user?.name?.charAt(0) || 'A'}</div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{user?.name || 'Admin'}</div>
                        <div style={{ color: '#e74c3c', fontSize: '0.8rem', fontWeight: 600 }}>Super Admin</div>
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
                            {tab.id === 'properties' && pendingProps.length > 0 && (
                                <span style={{ marginLeft: 'auto', background: '#FFC107', color: '#000', borderRadius: 20, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700 }}>
                                    {pendingProps.length}
                                </span>
                            )}
                            {tab.id === 'tickets' && openTickets > 0 && (
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
                {/* ═══ TAB: OVERVIEW ═══ */}
                {activeTab === 'overview' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div style={{ marginBottom: 32 }}>
                            <h1 style={{ fontFamily: 'Outfit', fontSize: '1.6rem', fontWeight: 700, marginBottom: 4 }}>
                                Super Admin Dashboard
                            </h1>
                            <p style={{ color: 'var(--text-muted)' }}>Platform overview and management</p>
                        </div>

                        {dataLoading ? (
                            <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" /></div>
                        ) : (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
                                    {[
                                        { label: 'Total Users', value: stats?.totalUsers || 0, icon: <Users size={18} />, color: 'var(--primary-light)', bg: 'rgba(108,92,231,0.1)' },
                                        { label: 'Total Revenue', value: formatINR(stats?.totalRevenue || 0), icon: <IndianRupee size={18} />, color: '#51CF66', bg: 'rgba(81,207,102,0.1)' },
                                        { label: 'Occupancy', value: `${stats?.occupancyRate || 0}%`, icon: <Building2 size={18} />, color: 'var(--secondary)', bg: 'rgba(0,206,201,0.1)', sub: `${stats?.occupiedBeds || 0}/${stats?.totalBeds || 0} beds` },
                                        { label: 'Pending Approvals', value: stats?.pendingApprovals || 0, icon: <ShieldCheck size={18} />, color: '#FFC107', bg: 'rgba(255,193,7,0.1)' },
                                    ].map(card => (
                                        <div key={card.label} className="stat-card">
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{card.label}</span>
                                                <div style={{ width: 36, height: 36, borderRadius: 10, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>{card.icon}</div>
                                            </div>
                                            <div style={{ fontFamily: 'Outfit', fontSize: '1.6rem', fontWeight: 700 }}>{card.value}</div>
                                            {card.sub && <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 6 }}>{card.sub}</div>}
                                        </div>
                                    ))}
                                </div>

                                {/* Role Breakdown */}
                                {stats?.roleBreakdown && (
                                    <div className="card" style={{ padding: 24, marginBottom: 32 }}>
                                        <h3 style={{ fontFamily: 'Outfit', fontWeight: 600, marginBottom: 16 }}>User Breakdown</h3>
                                        <div style={{ display: 'flex', gap: 24 }}>
                                            {Object.entries(stats.roleBreakdown).map(([role, count]) => (
                                                <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{
                                                        width: 10, height: 10, borderRadius: '50%',
                                                        background: role === 'ADMIN' ? '#e74c3c' : role === 'OWNER' ? 'var(--primary-light)' : 'var(--secondary)',
                                                    }} />
                                                    <span style={{ fontSize: '0.9rem' }}>{role}: <strong>{count as number}</strong></span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Quick Actions */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                                    {[
                                        { label: 'Manage Users', tab: 'users', icon: <Users size={20} />, color: 'var(--primary)' },
                                        { label: 'Approve Properties', tab: 'properties', icon: <ShieldCheck size={20} />, color: '#FFC107' },
                                        { label: 'View Revenue', tab: 'payments', icon: <IndianRupee size={20} />, color: '#51CF66' },
                                        { label: 'Handle Tickets', tab: 'tickets', icon: <AlertTriangle size={20} />, color: 'var(--accent)' },
                                    ].map(action => (
                                        <button key={action.label} className="card" onClick={() => setActiveTab(action.tab)} style={{
                                            display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', border: '1px solid var(--border)', padding: 18, textAlign: 'left',
                                        }}>
                                            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${action.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: action.color }}>{action.icon}</div>
                                            <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{action.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </motion.div>
                )}

                {/* ═══ TAB: USERS ═══ */}
                {activeTab === 'users' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                            <h2 style={{ fontFamily: 'Outfit', fontSize: '1.5rem', fontWeight: 700 }}>User Management</h2>
                            <button className="btn-primary" onClick={() => setShowCreateOwner(true)} style={{ padding: '10px 18px', fontSize: '0.85rem' }}>
                                <UserPlus size={16} /> Add New Owner
                            </button>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '8px 16px' }}>
                                    <Search size={16} style={{ color: 'var(--text-muted)' }} />
                                    <input type="text" placeholder="Search users..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                        style={{ background: 'none', border: 'none', color: 'white', outline: 'none', fontSize: '0.9rem', width: 160 }} />
                                </div>
                                <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '8px 12px', color: 'white', fontSize: '0.85rem' }}>
                                    <option value="">All Roles</option>
                                    <option value="TENANT">Tenants</option>
                                    <option value="OWNER">Owners</option>
                                    <option value="ADMIN">Admins</option>
                                </select>
                            </div>
                        </div>

                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th><th>Phone</th><th>Role</th>
                                        <th>KYC</th><th>Active</th><th>Joined</th><th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(u => (
                                        <tr key={u.id}>
                                            <td style={{ fontWeight: 500, color: 'white' }}>{u.name}</td>
                                            <td>{u.phone}</td>
                                            <td>
                                                <span className={`badge ${u.role === 'ADMIN' ? 'badge-accent' : u.role === 'OWNER' ? 'badge-primary' : 'badge-info'}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${u.kycStatus === 'VERIFIED' ? 'badge-success' : u.kycStatus === 'REJECTED' ? 'badge-accent' : 'badge-warning'}`}>
                                                    {u.kycStatus}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{ color: u.isActive ? '#51CF66' : '#e74c3c', fontWeight: 600 }}>
                                                    {u.isActive ? '● Active' : '● Banned'}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.85rem' }}>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    {u.kycStatus === 'PENDING' && (
                                                        <button title="Verify KYC" onClick={() => handleUpdateUser(u.id, { kycStatus: 'VERIFIED' })}
                                                            style={{ background: 'rgba(81,207,102,0.1)', border: '1px solid rgba(81,207,102,0.3)', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', color: '#51CF66' }}>
                                                            <UserCheck size={14} />
                                                        </button>
                                                    )}
                                                    <button title={u.isActive ? 'Ban' : 'Unban'} onClick={() => handleUpdateUser(u.id, { isActive: !u.isActive })}
                                                        style={{ background: u.isActive ? 'rgba(231,76,60,0.1)' : 'rgba(81,207,102,0.1)', border: `1px solid ${u.isActive ? 'rgba(231,76,60,0.3)' : 'rgba(81,207,102,0.3)'}`, borderRadius: 8, padding: '4px 8px', cursor: 'pointer', color: u.isActive ? '#e74c3c' : '#51CF66' }}>
                                                        <Ban size={14} />
                                                    </button>
                                                    <button title="Edit" onClick={() => setEditingUser(u)}
                                                        style={{ background: 'rgba(108,92,231,0.1)', border: '1px solid rgba(108,92,231,0.3)', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', color: 'var(--primary-light)' }}>
                                                        <Edit3 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {/* ═══ TAB: PROPERTIES ═══ */}
                {activeTab === 'properties' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h2 style={{ fontFamily: 'Outfit', fontSize: '1.5rem', fontWeight: 700 }}>Property Management</h2>
                            <button className="btn-primary" onClick={() => {
                                setShowAddProperty(true);
                                if (owners.length === 0) adminApi.getUsers({ role: 'OWNER' }).then(r => setOwners(r.users || [])).catch(() => { });
                            }} style={{ padding: '10px 18px', fontSize: '0.85rem' }}>
                                <Plus size={16} /> Add Property
                            </button>
                        </div>

                        {/* Pending Approvals */}
                        {pendingProps.length > 0 && (
                            <>
                                <h3 style={{ fontFamily: 'Outfit', fontWeight: 600, marginBottom: 16, color: '#FFC107' }}>
                                    ⏳ Pending Approvals ({pendingProps.length})
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                                    {pendingProps.map(p => (
                                        <div key={p.id} className="card" style={{ padding: 20 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: 12 }}>
                                                <div>
                                                    <h4 style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: 4 }}>{p.name}</h4>
                                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{p.city} • {p.type} • {p.gender}</div>
                                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4 }}>{p.address}</div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px' }}>
                                                        <Percent size={14} style={{ color: 'var(--text-muted)' }} />
                                                        <input type="number" min="0" max="100" value={editingProperty === p.id ? platformFee : (p.platformFeePercent || 5)}
                                                            onChange={e => { setEditingProperty(p.id); setPlatformFee(Number(e.target.value)); }}
                                                            style={{ background: 'none', border: 'none', color: 'white', width: 40, textAlign: 'center', outline: 'none', fontSize: '0.9rem' }} />
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>fee</span>
                                                    </div>
                                                    <button onClick={() => handleApproveProperty(p.id, true)} disabled={actionProcessing}
                                                        className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                                                        <CheckCircle2 size={14} /> Approve
                                                    </button>
                                                    <button onClick={() => handleApproveProperty(p.id, false)} disabled={actionProcessing}
                                                        style={{ padding: '8px 16px', fontSize: '0.85rem', background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 10, cursor: 'pointer', color: '#e74c3c', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <XCircle size={14} /> Reject
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* All Properties */}
                        <h3 style={{ fontFamily: 'Outfit', fontWeight: 600, marginBottom: 16 }}>All Properties ({properties.length})</h3>
                        <div className="table-container">
                            <table>
                                <thead><tr><th>Property</th><th>City</th><th>Type</th><th>Price</th><th>Fee %</th><th>Status</th><th>Action</th></tr></thead>
                                <tbody>
                                    {properties.map(p => (
                                        <tr key={p.id}>
                                            <td style={{ fontWeight: 500, color: 'white' }}>{p.name}</td>
                                            <td>{p.city}</td>
                                            <td>{p.type}</td>
                                            <td>{formatINR(p.price)}</td>
                                            <td style={{ color: 'var(--primary-light)', fontWeight: 600 }}>{p.platformFeePercent || 5}%</td>
                                            <td><span className={`badge ${p.isApproved ? 'badge-success' : 'badge-warning'}`}>{p.isApproved ? '✓ Approved' : '⏳ Pending'}</span></td>
                                            <td>
                                                <button onClick={() => { setEditingPropertyData({ ...p }); setPlatformFee(p.platformFeePercent || 5); }}
                                                    style={{ padding: '4px 12px', fontSize: '0.8rem', color: 'var(--primary-light)', background: 'rgba(108,92,231,0.1)', border: '1px solid rgba(108,92,231,0.3)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <Edit3 size={14} /> Manage
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {/* ═══ TAB: PAYMENTS ═══ */}
                {activeTab === 'payments' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h2 style={{ fontFamily: 'Outfit', fontSize: '1.5rem', fontWeight: 700, marginBottom: 24 }}>Platform Revenue</h2>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, marginBottom: 32 }}>
                            <div className="stat-card" style={{ borderTop: '3px solid #51CF66' }}>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 8 }}>Total Revenue</div>
                                <div style={{ fontFamily: 'Outfit', fontSize: '1.8rem', fontWeight: 700, color: '#51CF66' }}>{formatINR(revenueData.totalRevenue)}</div>
                            </div>
                            <div className="stat-card" style={{ borderTop: '3px solid var(--primary-light)' }}>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 8 }}>Platform Earnings</div>
                                <div style={{ fontFamily: 'Outfit', fontSize: '1.8rem', fontWeight: 700, color: 'var(--primary-light)' }}>{formatINR(revenueData.platformRevenue)}</div>
                            </div>
                            <div className="stat-card" style={{ borderTop: '3px solid var(--secondary)' }}>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 8 }}>Total Transactions</div>
                                <div style={{ fontFamily: 'Outfit', fontSize: '1.8rem', fontWeight: 700 }}>{payments.length}</div>
                            </div>
                        </div>

                        <div className="table-container">
                            <table>
                                <thead><tr><th>Date</th><th>Tenant</th><th>Property</th><th>Type</th><th>Amount</th><th>Fee %</th><th>Status</th><th>Ref ID</th></tr></thead>
                                <tbody>
                                    {payments.map(p => (
                                        <tr key={p.id}>
                                            <td>{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                                            <td style={{ fontWeight: 500 }}>{p.tenant?.name || '—'}</td>
                                            <td>{p.booking?.room?.property?.name || '—'}</td>
                                            <td>
                                                <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                                                    {p.invoiceType === 'MONTHLY_RENT' ? '🏠 Rent' : p.invoiceType === 'UTILITY' ? '⚡ Utility' : p.invoiceType === 'MOVE_IN' ? '📦 Move-in' : p.invoiceType === 'SECURITY_DEPOSIT' ? '🔒 Deposit' : p.invoiceType}
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: 600 }}>{formatINR(p.amount)}</td>
                                            <td style={{ color: 'var(--primary-light)' }}>{p.booking?.room?.property?.platformFeePercent || 5}%</td>
                                            <td>
                                                <span className={`badge ${p.status === 'CAPTURED' ? 'badge-success' : p.status === 'PENDING' ? 'badge-warning' : 'badge-accent'}`}>
                                                    {p.status === 'CAPTURED' ? '✓ Paid' : p.status === 'PENDING' ? '⏳ Pending' : p.status}
                                                </span>
                                            </td>
                                            <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {p.razorpayPaymentId || p.razorpayOrderId || `#${p.id.slice(0, 8)}`}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {/* ═══ TAB: TICKETS ═══ */}
                {activeTab === 'tickets' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h2 style={{ fontFamily: 'Outfit', fontSize: '1.5rem', fontWeight: 700, marginBottom: 24 }}>Ticket Escalations</h2>
                        {tickets.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {tickets.map(t => (
                                    <div key={t.id} className="card" style={{ padding: '20px 24px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
                                            <div>
                                                <h4 style={{ fontWeight: 600, marginBottom: 4 }}>{t.title}</h4>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t.description}</p>
                                                {t.tenant && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>👤 {t.tenant.name}</span>}
                                            </div>
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                <span className={`badge ${t.status === 'OPEN' ? 'badge-warning' : t.status === 'RESOLVED' ? 'badge-success' : t.status === 'CLOSED' ? 'badge-primary' : 'badge-info'}`}>
                                                    {t.status?.replace('_', ' ')}
                                                </span>
                                                {(t.status === 'OPEN' || t.status === 'IN_PROGRESS') && resolvingTicketId !== t.id && (
                                                    <button onClick={() => { setResolvingTicketId(t.id); setChargeAmount(''); }}
                                                        style={{ background: 'rgba(81,207,102,0.1)', border: '1px solid rgba(81,207,102,0.3)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: '#51CF66', fontSize: '0.8rem', fontWeight: 600 }}>
                                                        ✓ Resolve
                                                    </button>
                                                )}
                                                {t.status === 'RESOLVED' && (
                                                    <button onClick={() => handleUpdateTicket(t.id, 'CLOSED')}
                                                        style={{ background: 'rgba(108,92,231,0.1)', border: '1px solid rgba(108,92,231,0.3)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: 'var(--primary-light)', fontSize: '0.8rem', fontWeight: 600 }}>
                                                        ✗ Close
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Inline Resolve + Charge */}
                                        {resolvingTicketId === t.id && (
                                            <div style={{ background: 'rgba(81,207,102,0.05)', border: '1px solid rgba(81,207,102,0.2)', borderRadius: 12, padding: 16, marginTop: 12 }}>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 10 }}>
                                                    💵 Optionally pass on a utility charge to the tenant:
                                                </p>
                                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                    <input type="number" placeholder="₹ Amount (leave empty = no charge)" value={chargeAmount}
                                                        onChange={e => setChargeAmount(e.target.value)}
                                                        style={{ flex: 1, padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, color: 'white', fontSize: '0.85rem' }} />
                                                    <button onClick={() => handleUpdateTicket(t.id, 'RESOLVED', chargeAmount ? Number(chargeAmount) : undefined)}
                                                        className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                                                        ✓ Resolve{chargeAmount ? ` + ₹${chargeAmount}` : ''}
                                                    </button>
                                                    <button onClick={() => setResolvingTicketId(null)}
                                                        className="btn-ghost" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📁 {t.category}</span>
                                            <span style={{ fontSize: '0.8rem', color: t.priority === 'HIGH' || t.priority === 'URGENT' ? 'var(--accent)' : 'var(--text-muted)' }}>⚡ {t.priority}</span>
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
            </main>

            {/* Edit User Modal */}
            {editingUser && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '100%', maxWidth: 480, position: 'relative' }}>
                        <button onClick={() => setEditingUser(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
                        <h2 style={{ fontFamily: 'Outfit', fontSize: '1.3rem', fontWeight: 600, marginBottom: 20 }}>Edit User</h2>
                        <form onSubmit={e => { e.preventDefault(); const fd = new FormData(e.currentTarget); handleUpdateUser(editingUser.id, Object.fromEntries(fd)); }}>
                            {['name', 'phone', 'email', 'aadhaarNumber'].map(field => (
                                <div key={field} style={{ marginBottom: 14 }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'capitalize' }}>{field.replace(/([A-Z])/g, ' $1')}</label>
                                    <input name={field} defaultValue={editingUser[field] || ''}
                                        style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, color: 'white', fontSize: '0.9rem' }} />
                                </div>
                            ))}
                            <div style={{ marginBottom: 14 }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Role</label>
                                <select name="role" defaultValue={editingUser.role}
                                    style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, color: 'white', fontSize: '0.9rem' }}>
                                    <option value="TENANT">Tenant</option>
                                    <option value="OWNER">Owner</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: 14 }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4 }}>KYC Status</label>
                                <select name="kycStatus" defaultValue={editingUser.kycStatus}
                                    style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, color: 'white', fontSize: '0.9rem' }}>
                                    <option value="PENDING">Pending</option>
                                    <option value="VERIFIED">Verified</option>
                                    <option value="REJECTED">Rejected</option>
                                </select>
                            </div>
                            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={actionProcessing}>
                                <Save size={16} /> Save Changes
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Property Modal */}
            {editingPropertyData && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '100%', maxWidth: 520, position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                        <button onClick={() => setEditingPropertyData(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
                        <h2 style={{ fontFamily: 'Outfit', fontSize: '1.3rem', fontWeight: 600, marginBottom: 20 }}>Manage Property</h2>
                        <form onSubmit={async e => {
                            e.preventDefault();
                            setActionProcessing(true);
                            try {
                                const fd = new FormData(e.currentTarget);
                                const data: any = {};
                                fd.forEach((val, key) => { data[key] = val; });
                                data.price = Number(data.price);
                                data.platformFeePercent = Number(data.platformFeePercent);
                                data.isApproved = data.isApproved === 'true';
                                if (data.deposit) data.deposit = Number(data.deposit);
                                await adminApi.updateProperty(editingPropertyData.id, data);
                                setProperties(prev => prev.map(p => p.id === editingPropertyData.id ? { ...p, ...data } : p));
                                setEditingPropertyData(null);
                            } catch { alert('Failed to update property'); }
                            finally { setActionProcessing(false); }
                        }}>
                            {[
                                { name: 'name', label: 'Property Name', type: 'text' },
                                { name: 'city', label: 'City', type: 'text' },
                                { name: 'address', label: 'Address', type: 'text' },
                                { name: 'location', label: 'Location/Area', type: 'text' },
                                { name: 'price', label: 'Monthly Rent (₹)', type: 'number' },
                                { name: 'deposit', label: 'Security Deposit (₹)', type: 'number' },
                                { name: 'description', label: 'Description', type: 'text' },
                            ].map(field => (
                                <div key={field.name} style={{ marginBottom: 14 }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4 }}>{field.label}</label>
                                    <input name={field.name} type={field.type} defaultValue={editingPropertyData[field.name] || ''}
                                        style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, color: 'white', fontSize: '0.9rem' }} />
                                </div>
                            ))}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Property Type</label>
                                    <select name="type" defaultValue={editingPropertyData.type}
                                        style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, color: 'white', fontSize: '0.9rem' }}>
                                        <option value="COLIVING">Co-Living</option>
                                        <option value="PG">PG</option>
                                        <option value="HOSTEL">Hostel</option>
                                        <option value="STUDIO">Studio</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Gender</label>
                                    <select name="gender" defaultValue={editingPropertyData.gender}
                                        style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, color: 'white', fontSize: '0.9rem' }}>
                                        <option value="MALE">Male</option>
                                        <option value="FEMALE">Female</option>
                                        <option value="UNISEX">Unisex</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Platform Fee %</label>
                                    <input name="platformFeePercent" type="number" min="0" max="100" defaultValue={editingPropertyData.platformFeePercent || 5}
                                        style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, color: 'white', fontSize: '0.9rem' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Approval Status</label>
                                    <select name="isApproved" defaultValue={String(editingPropertyData.isApproved)}
                                        style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, color: 'white', fontSize: '0.9rem' }}>
                                        <option value="true">✓ Approved</option>
                                        <option value="false">⏳ Pending</option>
                                    </select>
                                </div>
                            </div>

                            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={actionProcessing}>
                                <Save size={16} /> Save Changes
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Owner Modal */}
            {showCreateOwner && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '100%', maxWidth: 480, position: 'relative' }}>
                        <button onClick={() => setShowCreateOwner(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
                        <h2 style={{ fontFamily: 'Outfit', fontSize: '1.3rem', fontWeight: 600, marginBottom: 20 }}>Add New Owner</h2>
                        <form onSubmit={async e => {
                            e.preventDefault();
                            setActionProcessing(true);
                            try {
                                const fd = new FormData(e.currentTarget);
                                const data: any = { role: 'OWNER' };
                                fd.forEach((val, key) => { data[key] = val; });
                                data.role = 'OWNER';
                                const res = await adminApi.createUser(data);
                                setUsers(prev => [res.user, ...prev]);
                                setOwners(prev => [res.user, ...prev]);
                                setShowCreateOwner(false);
                                alert(`Owner "${res.user.name}" created successfully!`);
                            } catch (err: any) { alert(err.message || 'Failed to create owner'); }
                            finally { setActionProcessing(false); }
                        }}>
                            {[
                                { name: 'name', label: 'Full Name', type: 'text', required: true },
                                { name: 'phone', label: 'Phone Number', type: 'tel', required: true },
                                { name: 'email', label: 'Email', type: 'email', required: false },
                            ].map(field => (
                                <div key={field.name} style={{ marginBottom: 14 }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4 }}>{field.label} {field.required && '*'}</label>
                                    <input name={field.name} type={field.type} required={field.required}
                                        style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, color: 'white', fontSize: '0.9rem' }} />
                                </div>
                            ))}
                            <div style={{ marginBottom: 14 }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Gender</label>
                                <select name="gender" style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, color: 'white', fontSize: '0.9rem' }}>
                                    <option value="MALE">Male</option>
                                    <option value="FEMALE">Female</option>
                                </select>
                            </div>
                            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={actionProcessing}>
                                <UserPlus size={16} /> Create Owner
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Property Modal */}
            {showAddProperty && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '100%', maxWidth: 560, position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                        <button onClick={() => setShowAddProperty(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
                        <h2 style={{ fontFamily: 'Outfit', fontSize: '1.3rem', fontWeight: 600, marginBottom: 20 }}>Add New Property</h2>
                        <form onSubmit={async e => {
                            e.preventDefault();
                            setActionProcessing(true);
                            try {
                                const fd = new FormData(e.currentTarget);
                                const data: any = {};
                                fd.forEach((val, key) => { data[key] = val; });
                                if (!data.ownerId) { alert('Please select an owner'); setActionProcessing(false); return; }
                                const res = await propertiesApi.create(data);
                                setProperties(prev => [res, ...prev]);
                                setShowAddProperty(false);
                                alert(`Property "${data.name}" created and assigned!`);
                            } catch (err: any) { alert(err.message || 'Failed to create property'); }
                            finally { setActionProcessing(false); }
                        }}>
                            {/* Owner Selector */}
                            <div style={{ marginBottom: 14 }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Assign to Owner *</label>
                                <select name="ownerId" required
                                    style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, color: 'white', fontSize: '0.9rem' }}>
                                    <option value="">-- Select Owner --</option>
                                    {owners.map(o => <option key={o.id} value={o.id}>{o.name} ({o.phone})</option>)}
                                </select>
                            </div>

                            {[
                                { name: 'name', label: 'Property Name', type: 'text', required: true },
                                { name: 'address', label: 'Full Address', type: 'text', required: true },
                                { name: 'description', label: 'Description', type: 'text', required: false },
                            ].map(field => (
                                <div key={field.name} style={{ marginBottom: 14 }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4 }}>{field.label} {field.required && '*'}</label>
                                    <input name={field.name} type={field.type} required={field.required}
                                        style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, color: 'white', fontSize: '0.9rem' }} />
                                </div>
                            ))}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4 }}>City *</label>
                                    <select name="city" required style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, color: 'white', fontSize: '0.9rem' }}>
                                        <option value="Hyderabad">Hyderabad</option>
                                        <option value="Bangalore">Bangalore</option>
                                        <option value="Mumbai">Mumbai</option>
                                        <option value="Delhi">Delhi</option>
                                        <option value="Chennai">Chennai</option>
                                        <option value="Pune">Pune</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Monthly Rent (₹) *</label>
                                    <input name="price" type="number" required style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, color: 'white', fontSize: '0.9rem' }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Property Type *</label>
                                    <select name="type" required style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, color: 'white', fontSize: '0.9rem' }}>
                                        <option value="COLIVING">Co-Living</option>
                                        <option value="PG">PG</option>
                                        <option value="HOSTEL">Hostel</option>
                                        <option value="STUDIO">Studio</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Gender *</label>
                                    <select name="gender" required style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, color: 'white', fontSize: '0.9rem' }}>
                                        <option value="MALE">Male</option>
                                        <option value="FEMALE">Female</option>
                                        <option value="UNISEX">Unisex</option>
                                    </select>
                                </div>
                            </div>

                            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={actionProcessing}>
                                <Plus size={16} /> Create Property
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
