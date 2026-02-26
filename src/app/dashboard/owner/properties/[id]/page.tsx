'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Users, IndianRupee, BedDouble,
    Calendar, Phone, CheckCircle2, Link as IconLink
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { propertiesApi, paymentsApi, communityApi } from '@/lib/api';

export default function OwnerPropertyManagement() {
    const { user, loading: authLoading, isLoggedIn } = useAuth();
    const router = useRouter();
    const params = useParams();
    const propertyId = params.id as string;

    const [activeTab, setActiveTab] = useState<'overview' | 'beds' | 'payments' | 'community'>('overview');
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal state for rent collection
    const [isRentModalOpen, setIsRentModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [rentActionProcessing, setRentActionProcessing] = useState(false);

    // Modal state for bed assignment (Wizard)
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [wizardStep, setWizardStep] = useState(1);
    const [selectedBedToAssign, setSelectedBedToAssign] = useState<any>(null);
    const [assignedBooking, setAssignedBooking] = useState<any>(null);
    const [assignForm, setAssignForm] = useState({
        tenantName: '', tenantPhone: '', tenantEmail: '', tenantGender: 'MALE',
        rentAmount: '', securityDeposit: '', lockIn: '3 Months',
        startDate: new Date().toISOString().split('T')[0], aadhaarNumber: ''
    });
    const [assignProcessing, setAssignProcessing] = useState(false);

    // Modals for actions
    const [selectedBookingForAction, setSelectedBookingForAction] = useState<any>(null);
    const [isUtilityModalOpen, setIsUtilityModalOpen] = useState(false);
    const [utilityForm, setUtilityForm] = useState({ description: '', amount: '' });
    const [actionProcessing, setActionProcessing] = useState(false);

    const [isMoveOutModalOpen, setIsMoveOutModalOpen] = useState(false);
    const [moveOutStep, setMoveOutStep] = useState(1);
    const [moveOutForm, setMoveOutForm] = useState({ moveOutDate: new Date().toISOString().split('T')[0], deductions: '0' });
    const [moveOutResult, setMoveOutResult] = useState<any>(null);

    const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
    const [ledgerPayments, setLedgerPayments] = useState<any[]>([]);

    useEffect(() => {
        if (!isLoggedIn) return; // Wait for auth
        if (user?.role !== 'OWNER' && user?.role !== 'ADMIN') {
            router.push('/dashboard/tenant');
            return;
        }

        const fetchDetails = async () => {
            try {
                const res = await propertiesApi.getOwnerProperty(propertyId);
                setData(res);
            } catch (err: any) {
                console.error('Failed to load property details', err);
                setError('Failed to load property details.');
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [isLoggedIn, propertyId, user, router]);

    if (authLoading || loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="spinner" />
            </div>
        );
    }

    if (error || !data?.property) {
        return (
            <div style={{ padding: 40, textAlign: 'center' }}>
                <h2>{error || 'Property not found'}</h2>
                <button className="btn-secondary" onClick={() => router.push('/dashboard/owner')} style={{ marginTop: 20 }}>
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const { property, metrics, payments } = data;

    // Calculate total revenue from completed payments
    const totalRevenue = payments
        .filter((p: any) => p.status === 'COMPLETED' || p.status === 'CAPTURED')
        .reduce((sum: number, p: any) => sum + p.amount, 0);

    const formatINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

    const handleCollectRent = async (method: 'CASH' | 'LINK') => {
        if (!selectedBooking) return;
        setRentActionProcessing(true);
        try {
            await paymentsApi.collectRent({
                bookingId: selectedBooking.id,
                amount: property.price,
                method
            });
            // Refresh parent state
            const res = await propertiesApi.getOwnerProperty(propertyId);
            setData(res);
            setIsRentModalOpen(false);
            setSelectedBooking(null);
            alert(`Rent payment via ${method} processed successfully.`);
        } catch (err) {
            alert('Failed to process rent payment.');
        } finally {
            setRentActionProcessing(false);
        }
    };

    const handleAssignBedStep3 = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!selectedBedToAssign) return;

        setAssignProcessing(true);
        try {
            const res = await propertiesApi.assignBed(propertyId, {
                bedId: selectedBedToAssign.id,
                roomId: selectedBedToAssign.roomId,
                tenantName: assignForm.tenantName,
                tenantPhone: assignForm.tenantPhone,
                tenantEmail: assignForm.tenantEmail,
                tenantGender: assignForm.tenantGender,
                rentAmount: parseFloat(assignForm.rentAmount),
                securityDeposit: parseFloat(assignForm.securityDeposit || '0'),
                lockIn: assignForm.lockIn,
                startDate: assignForm.startDate,
                aadhaarNumber: assignForm.aadhaarNumber
            });

            setAssignedBooking(res.booking);
            setWizardStep(4);
        } catch (err) {
            alert('Failed to assign tenant. Please verify the details.');
        } finally {
            setAssignProcessing(false);
        }
    };

    const handleWizardPayment = async (method: 'CASH' | 'LINK') => {
        if (!assignedBooking) return;
        setAssignProcessing(true);
        try {
            const amountToCollect = parseFloat(assignForm.rentAmount) + parseFloat(assignForm.securityDeposit || '0');
            await paymentsApi.collectRent({
                bookingId: assignedBooking.id,
                amount: amountToCollect,
                method
            });

            alert(`Payment via ${method} processed successfully! Tenant is fully onboarded.`);
            closeWizard();
        } catch (err) {
            alert('Failed to process payment.');
        } finally {
            setAssignProcessing(false);
        }
    };

    const closeWizard = async () => {
        setIsAssignModalOpen(false);
        setTimeout(() => {
            setWizardStep(1);
            setAssignedBooking(null);
            setSelectedBedToAssign(null);
            setAssignForm({
                tenantName: '', tenantPhone: '', tenantEmail: '', tenantGender: 'MALE',
                rentAmount: '', securityDeposit: '', lockIn: '3 Months',
                startDate: new Date().toISOString().split('T')[0], aadhaarNumber: ''
            });
        }, 300);
        // Refresh properties to show new tenant
        const res = await propertiesApi.getOwnerProperty(propertyId);
        setData(res);
    };

    const handleAddUtility = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBookingForAction) return;
        setActionProcessing(true);
        try {
            // Find a pending payment to attach to, or create one?
            // Since the API requires paymentId, we'll try to find a pending one.
            const pendingPayment = payments.find((p: any) => p.bookingId === selectedBookingForAction.id && p.status === 'PENDING');
            if (!pendingPayment) {
                alert('No pending payment found to attach utility charge. An automatic system will create one first.');
                return;
            }
            await fetch('/api/payments/add-charge', {
                method: 'POST', body: JSON.stringify({
                    paymentId: pendingPayment.id,
                    description: utilityForm.description,
                    amount: parseFloat(utilityForm.amount),
                })
            });
            alert('Utility charge added successfully!');
            setIsUtilityModalOpen(false);
            const res = await propertiesApi.getOwnerProperty(propertyId);
            setData(res);
        } catch (err) {
            alert('Failed to add charge.');
        } finally {
            setActionProcessing(false);
        }
    };

    const handleTerminate = async () => {
        if (!selectedBookingForAction) return;
        setActionProcessing(true);
        try {
            const res = await fetch('/api/bookings/terminate', {
                method: 'POST', body: JSON.stringify({
                    bookingId: selectedBookingForAction.id,
                    moveOutDate: moveOutForm.moveOutDate,
                    deductions: parseFloat(moveOutForm.deductions) || 0
                })
            });
            const { data, success, error } = await res.json();
            if (!success) throw new Error(error);
            setMoveOutResult(data);
            setMoveOutStep(3);
        } catch (err: any) {
            alert('Failed to terminate: ' + err.message);
        } finally {
            setActionProcessing(false);
        }
    };

    return (
        <div style={{ padding: '24px 40px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <button className="btn-ghost" onClick={() => router.push('/dashboard/owner')} style={{ padding: 8 }}>
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 style={{ fontFamily: 'Outfit', fontSize: '1.8rem', fontWeight: 700 }}>{property.name}</h1>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{property.address}</div>
                </div>
                <span className={`badge ${property.isApproved ? 'badge-success' : 'badge-warning'}`} style={{ marginLeft: 'auto' }}>
                    {property.isApproved ? 'Active' : 'Pending Approval'}
                </span>
            </div>

            {/* Quick Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 32 }}>
                <div className="card stat-card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <div style={{ padding: 10, background: 'rgba(51, 154, 240, 0.1)', color: '#339af0', borderRadius: 8 }}>
                            <BedDouble size={20} />
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Occupancy</div>
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'Outfit' }}>
                        {metrics.occupiedBeds} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ {metrics.totalBeds} Beds</span>
                    </div>
                </div>

                <div className="card stat-card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <div style={{ padding: 10, background: 'rgba(81, 207, 102, 0.1)', color: '#51cf66', borderRadius: 8 }}>
                            <IndianRupee size={20} />
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Generated Revenue</div>
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'Outfit' }}>
                        {formatINR(totalRevenue)}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs" style={{ marginBottom: 24, display: 'flex', gap: 10, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                {['overview', 'beds', 'payments', 'community'].map(tab => (
                    <button
                        key={tab}
                        className={`btn-${activeTab === tab ? 'primary' : 'ghost'}`}
                        onClick={() => setActiveTab(tab as any)}
                        style={{ textTransform: 'capitalize' }}
                    >
                        {tab === 'beds' ? 'Room & Bed Management' : tab === 'community' ? '🎉 Community' : tab}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="card">
                        <h3 style={{ fontFamily: 'Outfit', fontWeight: 600, fontSize: '1.1rem', marginBottom: 16 }}>Property Configuration</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            <div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Property Type</div>
                                <div style={{ fontWeight: 500, marginTop: 4 }}>{property.type}</div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Gender Restrictions</div>
                                <div style={{ fontWeight: 500, marginTop: 4 }}>{property.gender}</div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Monthly Rent</div>
                                <div style={{ fontWeight: 500, marginTop: 4 }}>{formatINR(property.price)}</div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Security Deposit</div>
                                <div style={{ fontWeight: 500, marginTop: 4 }}>{formatINR(property.deposit)}</div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Amenities</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                                    {property.amenities.map((am: string) => (
                                        <span key={am} className="badge badge-info">{am}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {activeTab === 'beds' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    {property.rooms.map((room: any) => (
                        <div key={room.id} className="card" style={{ marginBottom: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 16 }}>
                                <div>
                                    <h3 style={{ fontFamily: 'Outfit', fontWeight: 600, fontSize: '1.2rem' }}>{room.name}</h3>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{room.type} • {formatINR(room.price)}/mo</div>
                                </div>
                                <div className="badge badge-info">{room.beds.filter((b: any) => b.isOccupied).length} / {room.capacity} Occupied</div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                                {room.beds.map((bed: any) => {
                                    const activeBooking = bed.bookings?.[0]; // Filtered by CONFIRMED in API
                                    return (
                                        <div key={bed.id} style={{
                                            padding: 16, borderRadius: 8,
                                            border: `1px solid ${bed.isOccupied ? 'var(--border)' : 'rgba(81, 207, 102, 0.4)'}`,
                                            background: bed.isOccupied ? 'var(--bg-card)' : 'rgba(81, 207, 102, 0.05)'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                                <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <BedDouble size={16} /> {bed.name}
                                                </div>
                                                <span className={`badge ${bed.isOccupied ? 'badge-warning' : 'badge-success'}`}>
                                                    {bed.isOccupied ? 'Occupied' : 'Vacant'}
                                                </span>
                                            </div>

                                            {bed.isOccupied && activeBooking ? (
                                                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed var(--border)' }}>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>Current Tenant</div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                            {activeBooking.tenant.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 600 }}>{activeBooking.tenant.name}</div>
                                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                <Phone size={12} /> {activeBooking.tenant.phone}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                                                        <button
                                                            className="btn-primary"
                                                            style={{ padding: '6px 12px', fontSize: '0.8rem', flex: 1, justifyContent: 'center' }}
                                                            onClick={() => {
                                                                setSelectedBooking(activeBooking);
                                                                setIsRentModalOpen(true);
                                                            }}
                                                        >
                                                            <IndianRupee size={14} /> Rent
                                                        </button>
                                                        <button
                                                            className="btn-secondary"
                                                            style={{ padding: '6px 12px', fontSize: '0.8rem', flex: 1, justifyContent: 'center' }}
                                                            onClick={() => {
                                                                setSelectedBookingForAction(activeBooking);
                                                                setIsUtilityModalOpen(true);
                                                            }}
                                                        >
                                                            + Utility
                                                        </button>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                                        <button
                                                            className="btn-ghost"
                                                            style={{ padding: '6px 12px', fontSize: '0.8rem', flex: 1, justifyContent: 'center', border: '1px solid var(--border)' }}
                                                            onClick={() => {
                                                                setLedgerPayments(payments.filter((p: any) => p.tenantId === activeBooking.tenant.id));
                                                                setIsLedgerModalOpen(true);
                                                            }}
                                                        >
                                                            Ledger
                                                        </button>
                                                        <button
                                                            className="btn-ghost"
                                                            style={{ padding: '6px 12px', fontSize: '0.8rem', flex: 1, justifyContent: 'center', color: 'var(--accent)', border: '1px solid rgba(253,121,168,0.3)' }}
                                                            onClick={() => {
                                                                setSelectedBookingForAction(activeBooking);
                                                                setMoveOutStep(1);
                                                                setIsMoveOutModalOpen(true);
                                                            }}
                                                        >
                                                            Move Out
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed rgba(81, 207, 102, 0.2)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                        Ready for new tenants. They can book this exact bed during checkout online, or you can manually assign it.
                                                    </div>
                                                    <button
                                                        className="btn-secondary"
                                                        style={{ padding: '6px 12px', fontSize: '0.8rem', justifyContent: 'center', borderColor: 'rgba(81, 207, 102, 0.4)', color: '#51cf66' }}
                                                        onClick={() => {
                                                            setSelectedBedToAssign({ ...bed, roomId: room.id, suggestedRent: room.price });
                                                            setAssignForm(prev => ({ ...prev, rentAmount: room.price.toString() }));
                                                            setIsAssignModalOpen(true);
                                                        }}
                                                    >
                                                        <Users size={14} /> Assign Tenant
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </motion.div>
            )
            }

            {
                activeTab === 'payments' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h3 style={{ fontFamily: 'Outfit', fontWeight: 600, fontSize: '1.2rem' }}>Payment History</h3>
                            </div>

                            {payments.length === 0 ? (
                                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                                    No payments recorded yet.
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500 }}>Date</th>
                                                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500 }}>Tenant</th>
                                                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500 }}>Room/Bed</th>
                                                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500 }}>Amount</th>
                                                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500 }}>Status</th>
                                                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500 }}>Ref ID</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {payments.map((p: any) => (
                                                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                    <td style={{ padding: '16px' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                                                    <td style={{ padding: '16px', fontWeight: 500 }}>{p.tenant?.name || 'Unknown'}</td>
                                                    <td style={{ padding: '16px', color: 'var(--text-muted)' }}>
                                                        {p.booking?.room?.name} • {p.booking?.bed?.name}
                                                    </td>
                                                    <td style={{ padding: '16px', fontWeight: 600 }}>{formatINR(p.amount)}</td>
                                                    <td style={{ padding: '16px' }}>
                                                        <span className={`badge ${p.status === 'CAPTURED' ? 'badge-success' : p.status === 'PENDING' ? 'badge-warning' : p.status === 'FAILED' ? 'badge-accent' : 'badge-primary'}`}>
                                                            {p.status === 'CAPTURED' ? '✓ Paid' : p.status === 'PENDING' ? '⏳ Pending' : p.status === 'FAILED' ? '✗ Failed' : p.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '16px', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                        {p.razorpayPaymentId || p.razorpayOrderId || `#${p.id.slice(0, 8)}`}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )
            }

            {/* Rent Collection Modal */}
            {
                isRentModalOpen && selectedBooking && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div className="card" style={{ width: '100%', maxWidth: 450, position: 'relative' }}>
                            <h2 style={{ fontFamily: 'Outfit', fontSize: '1.4rem', fontWeight: 600, marginBottom: 8 }}>Collect Rent</h2>
                            <div style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
                                Tenant: <strong>{selectedBooking.tenant.name}</strong> • Amount: <strong>{formatINR(property.price)}</strong>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <button
                                    className="btn-secondary"
                                    style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-start' }}
                                    onClick={() => handleCollectRent('LINK')}
                                    disabled={rentActionProcessing}
                                >
                                    <IconLink size={20} className="text-primary" />
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontWeight: 600 }}>Send Payment Link</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sends a Razorpay link to their phone via SMS.</div>
                                    </div>
                                </button>

                                <button
                                    className="btn-secondary"
                                    style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-start', border: '1px solid rgba(81, 207, 102, 0.4)' }}
                                    onClick={() => handleCollectRent('CASH')}
                                    disabled={rentActionProcessing}
                                >
                                    <CheckCircle2 size={20} color="#51cf66" />
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontWeight: 600 }}>Record Cash Payment</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Instantly marks rent as paid and updates revenue.</div>
                                    </div>
                                </button>
                            </div>

                            <button
                                style={{ width: '100%', marginTop: 24, padding: 12, background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                onClick={() => setIsRentModalOpen(false)}
                                disabled={rentActionProcessing}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )
            }

            {/* Tenant Assignment Wizard Modal */}
            {
                isAssignModalOpen && selectedBedToAssign && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
                        <div className="card" style={{ width: '100%', maxWidth: 550, position: 'relative', overflowY: 'auto', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <div>
                                    <h2 style={{ fontFamily: 'Outfit', fontSize: '1.4rem', fontWeight: 600 }}>Assign Tenant Wizard</h2>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        Step {wizardStep} of 4 • Assigning <strong>{selectedBedToAssign.name}</strong>
                                    </div>
                                </div>
                                <button className="btn-ghost" onClick={closeWizard} style={{ padding: 8 }}>X</button>
                            </div>

                            {/* Progress Bar */}
                            <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
                                {[1, 2, 3, 4].map(step => (
                                    <div key={step} style={{ height: 4, flex: 1, background: step <= wizardStep ? 'var(--primary)' : 'var(--border)', borderRadius: 2 }} />
                                ))}
                            </div>

                            {wizardStep === 1 && (
                                <form onSubmit={(e) => { e.preventDefault(); setWizardStep(2); }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>1. Personal Details</h3>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Full Name</label>
                                        <input type="text" className="input" required value={assignForm.tenantName} onChange={(e) => setAssignForm(p => ({ ...p, tenantName: e.target.value }))} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Phone Number</label>
                                        <input type="tel" className="input" pattern="[0-9]{10}" required value={assignForm.tenantPhone} onChange={(e) => setAssignForm(p => ({ ...p, tenantPhone: e.target.value }))} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email Address (Optional)</label>
                                        <input type="email" className="input" value={assignForm.tenantEmail} onChange={(e) => setAssignForm(p => ({ ...p, tenantEmail: e.target.value }))} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Gender</label>
                                        <select className="input" value={assignForm.tenantGender} onChange={(e) => setAssignForm(p => ({ ...p, tenantGender: e.target.value }))}>
                                            <option value="MALE">Male</option>
                                            <option value="FEMALE">Female</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                    </div>
                                    <button type="submit" className="btn-primary" style={{ marginTop: 12, justifyContent: 'center' }}>Next: Lease Details</button>
                                </form>
                            )}

                            {wizardStep === 2 && (
                                <form onSubmit={(e) => { e.preventDefault(); setWizardStep(3); }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>2. Lease Details</h3>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Check-in Date</label>
                                        <input type="date" className="input" required value={assignForm.startDate} onChange={(e) => setAssignForm(p => ({ ...p, startDate: e.target.value }))} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Monthly Rent</label>
                                            <input type="number" className="input" required min="0" value={assignForm.rentAmount} onChange={(e) => setAssignForm(p => ({ ...p, rentAmount: e.target.value }))} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Security Deposit</label>
                                            <input type="number" className="input" required min="0" value={assignForm.securityDeposit} onChange={(e) => setAssignForm(p => ({ ...p, securityDeposit: e.target.value }))} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Lock-in Period</label>
                                        <select className="input" value={assignForm.lockIn} onChange={(e) => setAssignForm(p => ({ ...p, lockIn: e.target.value }))}>
                                            <option value="1 Month">1 Month</option>
                                            <option value="3 Months">3 Months</option>
                                            <option value="6 Months">6 Months</option>
                                            <option value="12 Months">12 Months</option>
                                        </select>
                                    </div>

                                    <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                                        <button type="button" className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setWizardStep(1)}>Back</button>
                                        <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Next: KYC</button>
                                    </div>
                                </form>
                            )}

                            {wizardStep === 3 && (
                                <form onSubmit={handleAssignBedStep3} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>3. KYC & Documents</h3>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Aadhaar / PAN Number</label>
                                        <input type="text" className="input" required value={assignForm.aadhaarNumber} onChange={(e) => setAssignForm(p => ({ ...p, aadhaarNumber: e.target.value }))} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Upload Identity Document</label>
                                        <div style={{ border: '1px dashed var(--border)', padding: '30px 20px', textAlign: 'center', borderRadius: 8, color: 'var(--text-muted)' }}>
                                            No file uploaded yet. Click to select PDF or Image.
                                        </div>
                                        <div style={{ fontSize: '0.75rem', marginTop: 4, color: 'var(--text-secondary)' }}>(In this active demo, file uploading is simulated)</div>
                                    </div>

                                    <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                                        <button type="button" className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setWizardStep(2)} disabled={assignProcessing}>Back</button>
                                        <button type="submit" className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} disabled={assignProcessing}>
                                            {assignProcessing ? 'Creating Booking...' : 'Finalize & Map Tenant'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {wizardStep === 4 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                                        <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(81, 207, 102, 0.2)', color: '#51cf66', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                            <CheckCircle2 size={36} />
                                        </div>
                                        <h3 style={{ fontSize: '1.3rem', fontWeight: 600 }}>Booking Created!</h3>
                                        <div style={{ color: 'var(--text-secondary)' }}>The tenant is now successfully assigned to the bed.</div>
                                    </div>

                                    <div style={{ background: 'var(--bg-lighter)', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Monthly Rent:</span>
                                            <strong style={{ fontSize: '1.05rem' }}>{formatINR(parseFloat(assignForm.rentAmount))}</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Security Deposit:</span>
                                            <strong style={{ fontSize: '1.05rem' }}>{formatINR(parseFloat(assignForm.securityDeposit))}</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', alignItems: 'center' }}>
                                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Total Initial Payment:</span>
                                            <strong style={{ color: 'var(--primary-light)', fontSize: '1.3rem' }}>
                                                {formatINR(parseFloat(assignForm.rentAmount) + (parseFloat(assignForm.securityDeposit) || 0))}
                                            </strong>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
                                        <button className="btn-secondary" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'flex-start' }} onClick={() => handleWizardPayment('LINK')} disabled={assignProcessing}>
                                            <IconLink size={24} className="text-primary" />
                                            <div style={{ textAlign: 'left' }}>
                                                <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>Send Payment Link</div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Sends a Razorpay link to their phone via SMS.</div>
                                            </div>
                                        </button>

                                        <button className="btn-secondary" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'flex-start', border: '1px solid rgba(81, 207, 102, 0.4)', background: 'rgba(81, 207, 102, 0.05)' }} onClick={() => handleWizardPayment('CASH')} disabled={assignProcessing}>
                                            <CheckCircle2 size={24} color="#51cf66" />
                                            <div style={{ textAlign: 'left' }}>
                                                <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>Record Cash Payment</div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Instantly marks initial payment as collected.</div>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Utility Charge Modal */}
            {
                isUtilityModalOpen && selectedBookingForAction && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div className="card" style={{ width: '100%', maxWidth: 450 }}>
                            <h2 style={{ fontFamily: 'Outfit', fontSize: '1.4rem', fontWeight: 600, marginBottom: 8 }}>Add Utility Charge</h2>
                            <div style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
                                Tenant: <strong>{selectedBookingForAction.tenant.name}</strong>
                            </div>
                            <form onSubmit={handleAddUtility} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Description (e.g. Electricity Bill, Key Loss)</label>
                                    <input className="input" required value={utilityForm.description} onChange={(e) => setUtilityForm({ ...utilityForm, description: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Amount (₹)</label>
                                    <input className="input" type="number" required value={utilityForm.amount} onChange={(e) => setUtilityForm({ ...utilityForm, amount: e.target.value })} />
                                </div>
                                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                                    <button type="button" className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setIsUtilityModalOpen(false)}>Cancel</button>
                                    <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={actionProcessing}>
                                        {actionProcessing ? 'Adding...' : 'Add Charge'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Tenant Ledger Modal */}
            {
                isLedgerModalOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
                        <div className="card" style={{ width: '100%', maxWidth: 650, maxHeight: '80vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                                <h2 style={{ fontFamily: 'Outfit', fontSize: '1.4rem', fontWeight: 600 }}>Tenant Payment Ledger</h2>
                                <button className="btn-ghost" onClick={() => setIsLedgerModalOpen(false)} style={{ padding: 8 }}>X</button>
                            </div>
                            {ledgerPayments.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)' }}>No payment history found for this tenant.</p>
                            ) : (
                                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                            <th style={{ padding: '12px 8px' }}>Date</th>
                                            <th style={{ padding: '12px 8px' }}>Type</th>
                                            <th style={{ padding: '12px 8px' }}>Amount</th>
                                            <th style={{ padding: '12px 8px' }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ledgerPayments.map(p => (
                                            <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '12px 8px' }}>{new Date(p.dueDate || p.createdAt).toLocaleDateString()}</td>
                                                <td style={{ padding: '12px 8px' }}>{p.invoiceType || 'RENT'}</td>
                                                <td style={{ padding: '12px 8px', fontWeight: 600 }}>{formatINR(p.amount)}</td>
                                                <td style={{ padding: '12px 8px' }}>
                                                    <span className={`badge ${p.status === 'CAPTURED' || p.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>{p.status}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Move-Out Wizard Modal */}
            {
                isMoveOutModalOpen && selectedBookingForAction && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
                        <div className="card" style={{ width: '100%', maxWidth: 500 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                                <h2 style={{ fontFamily: 'Outfit', fontSize: '1.4rem', fontWeight: 600 }}>Move-Out Wizard</h2>
                                <button className="btn-ghost" onClick={() => setIsMoveOutModalOpen(false)} style={{ padding: 8 }}>X</button>
                            </div>

                            {moveOutStep === 1 && (
                                <form onSubmit={(e) => { e.preventDefault(); setMoveOutStep(2); }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Select Move-Out Date</label>
                                        <input className="input" type="date" required value={moveOutForm.moveOutDate} onChange={(e) => setMoveOutForm({ ...moveOutForm, moveOutDate: e.target.value })} />
                                    </div>
                                    <div style={{ background: 'rgba(255, 193, 7, 0.1)', padding: 12, borderRadius: 8, color: '#FFC107', fontSize: '0.85rem' }}>
                                        Warning: Terminating this booking will automatically free up <strong>{selectedBookingForAction.bed?.name}</strong> across your properties!
                                    </div>
                                    <button type="submit" className="btn-primary" style={{ justifyContent: 'center', padding: 14 }}>Next: Calculate Settlement</button>
                                </form>
                            )}

                            {moveOutStep === 2 && (
                                <form onSubmit={(e) => { e.preventDefault(); handleTerminate(); }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Security Deposit Hold:</span>
                                            <strong style={{ fontSize: '1.05rem', color: 'var(--bg-success)' }}>{formatINR(selectedBookingForAction.securityDeposit)}</strong>
                                        </div>
                                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Deductions (Damages/Unpaid Rent)</label>
                                        <input className="input" type="number" required value={moveOutForm.deductions} onChange={(e) => setMoveOutForm({ ...moveOutForm, deductions: e.target.value })} />
                                    </div>

                                    <div style={{ background: 'var(--bg-lighter)', padding: 16, borderRadius: 8, border: '1px solid var(--border)', marginTop: 10 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem' }}>
                                            <span style={{ fontWeight: 600 }}>Net Refund to Tenant:</span>
                                            <strong style={{ color: 'var(--primary-light)' }}>
                                                {formatINR((selectedBookingForAction.securityDeposit || 0) - parseFloat(moveOutForm.deductions || '0'))}
                                            </strong>
                                        </div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>Note: A negative refund indicates the tenant owes you.</p>
                                    </div>

                                    <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                                        <button type="button" className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setMoveOutStep(1)}>Back</button>
                                        <button type="submit" className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} disabled={actionProcessing}>
                                            {actionProcessing ? 'Processing...' : 'Confirm Termination'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {moveOutStep === 3 && moveOutResult && (
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(81, 207, 102, 0.2)', color: '#51cf66', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                        <CheckCircle2 size={36} />
                                    </div>
                                    <h3 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: 8 }}>Move-Out Processed!</h3>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
                                        The tenant has been moved out, and the bed is now available. Settlement payment recorded.
                                    </p>
                                    <button className="btn-primary" style={{ justifyContent: 'center', width: '100%' }} onClick={() => {
                                        setIsMoveOutModalOpen(false);
                                        const fetchIt = async () => {
                                            const res = await propertiesApi.getOwnerProperty(propertyId);
                                            setData(res);
                                        };
                                        fetchIt();
                                    }}>
                                        Done
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* ═══ TAB: COMMUNITY ═══ */}
            {activeTab === 'community' && (
                <CommunityTab propertyId={propertyId} isOwner={true} userId={user?.id} />
            )}
        </div>
    );
}

function CommunityTab({ propertyId, isOwner, userId }: { propertyId: string; isOwner: boolean; userId?: string }) {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [postType, setPostType] = useState<'ANNOUNCEMENT' | 'EVENT'>('ANNOUNCEMENT');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        communityApi.getFeed(propertyId).then(r => setPosts(r.posts || [])).catch(() => { }).finally(() => setLoading(false));
    }, [propertyId]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const fd = new FormData(e.currentTarget as HTMLFormElement);
            const data: any = {};
            fd.forEach((val, key) => { data[key] = val; });
            data.type = postType;
            const res = await communityApi.createPost(propertyId, data);
            setPosts(prev => [res.post, ...prev]);
            setShowForm(false);
        } catch { alert('Failed to create post'); }
        finally { setSubmitting(false); }
    };

    const handleDelete = async (postId: string) => {
        if (!confirm('Delete this post?')) return;
        try {
            await communityApi.deletePost(propertyId, postId);
            setPosts(prev => prev.filter(p => p.id !== postId));
        } catch { alert('Failed to delete'); }
    };

    const handleRsvp = async (postId: string, status: string) => {
        try {
            await communityApi.rsvp(propertyId, postId, status);
            const updated = await communityApi.getFeed(propertyId);
            setPosts(updated.posts || []);
        } catch { alert('Failed to RSVP'); }
    };

    const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, color: 'white', fontSize: '0.9rem' };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.3rem', fontWeight: 700 }}>Community Feed</h3>
                {isOwner && (
                    <button className="btn-primary" onClick={() => setShowForm(!showForm)} style={{ padding: '10px 18px', fontSize: '0.85rem' }}>
                        {showForm ? '✕ Cancel' : '+ New Post'}
                    </button>
                )}
            </div>

            {/* Create Form */}
            {showForm && (
                <div className="card" style={{ padding: 24, marginBottom: 24 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                        {(['ANNOUNCEMENT', 'EVENT'] as const).map(t => (
                            <button key={t} onClick={() => setPostType(t)}
                                className={`btn-${postType === t ? 'primary' : 'ghost'}`}
                                style={{ fontSize: '0.85rem' }}>
                                {t === 'ANNOUNCEMENT' ? '📢 Announcement' : '🎉 Event'}
                            </button>
                        ))}
                    </div>
                    <form onSubmit={handleCreate}>
                        <div style={{ marginBottom: 12 }}>
                            <input name="title" placeholder="Title" required style={inputStyle} />
                        </div>
                        <div style={{ marginBottom: 12 }}>
                            <textarea name="content" placeholder="What's happening?" required rows={3}
                                style={{ ...inputStyle, resize: 'vertical' }} />
                        </div>
                        {postType === 'EVENT' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                                <input name="eventDate" type="date" required style={inputStyle} />
                                <input name="eventTime" placeholder="Time (e.g. 7:00 PM)" style={inputStyle} />
                                <input name="eventVenue" placeholder="Venue (e.g. Rooftop)" style={inputStyle} />
                                <input name="maxAttendees" type="number" placeholder="Max Attendees" style={inputStyle} />
                            </div>
                        )}
                        <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={submitting}>
                            {submitting ? 'Publishing...' : 'Publish'}
                        </button>
                    </form>
                </div>
            )}

            {/* Feed */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" /></div>
            ) : posts.length === 0 ? (
                <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📢</div>
                    <p style={{ color: 'var(--text-muted)' }}>No posts yet. {isOwner ? 'Create the first post!' : 'Check back later!'}</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {posts.map(post => (
                        <div key={post.id} className="card" style={{ padding: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                                <div>
                                    <span className={`badge ${post.type === 'EVENT' ? 'badge-primary' : 'badge-info'}`} style={{ fontSize: '0.7rem', marginBottom: 8, display: 'inline-block' }}>
                                        {post.type === 'EVENT' ? '🎉 Event' : '📢 Announcement'}
                                    </span>
                                    <h4 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 4 }}>{post.title}</h4>
                                </div>
                                {isOwner && (
                                    <button onClick={() => handleDelete(post.id)}
                                        style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', color: '#e74c3c', fontSize: '0.75rem' }}>
                                        Delete
                                    </button>
                                )}
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 12, lineHeight: 1.6 }}>{post.content}</p>

                            {post.type === 'EVENT' && (
                                <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
                                    {post.eventDate && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📅 {new Date(post.eventDate).toLocaleDateString('en-IN')}</span>}
                                    {post.eventTime && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>🕐 {post.eventTime}</span>}
                                    {post.eventVenue && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📍 {post.eventVenue}</span>}
                                    <span style={{ fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: 600 }}>
                                        👥 {post._count?.rsvps || 0} {post.maxAttendees ? `/ ${post.maxAttendees}` : ''} going
                                    </span>
                                </div>
                            )}

                            {post.type === 'EVENT' && !isOwner && (
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {(['GOING', 'MAYBE', 'NOT_GOING'] as const).map(status => {
                                        const myRsvp = post.rsvps?.find((r: any) => r.userId === userId);
                                        const isActive = myRsvp?.status === status;
                                        return (
                                            <button key={status} onClick={() => handleRsvp(post.id, status)}
                                                className={isActive ? 'btn-primary' : 'btn-ghost'}
                                                style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
                                                {status === 'GOING' ? '✅ Going' : status === 'MAYBE' ? '🤔 Maybe' : '❌ Not Going'}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: 12, marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>By {post.author?.name || 'Owner'}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(post.createdAt).toLocaleDateString('en-IN')}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
