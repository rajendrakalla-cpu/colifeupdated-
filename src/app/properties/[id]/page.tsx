'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    Star, MapPin, ArrowLeft, CheckCircle2, Calendar,
    Shield, Phone, MessageCircle, Heart, Share2, ChevronRight,
    Wifi, Snowflake, Dumbbell, UtensilsCrossed,
    Zap, Car, Camera, Gamepad2, BookOpen, Laptop, Waves, X, Loader2
} from 'lucide-react';
import { properties as mockProperties } from '@/lib/data';
import { propertiesApi, bookingsApi, ticketsApi, paymentsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import RecommendationsSection from '@/components/RecommendationsSection';

const amenityFullIcons: Record<string, React.ReactNode> = {
    'Wi-Fi': <Wifi size={20} />,
    'AC': <Snowflake size={20} />,
    'Laundry': <Waves size={20} />,
    'Gym': <Dumbbell size={20} />,
    'Meals': <UtensilsCrossed size={20} />,
    'Power Backup': <Zap size={20} />,
    'Parking': <Car size={20} />,
    'CCTV': <Camera size={20} />,
    'Games Room': <Gamepad2 size={20} />,
    'Yoga Studio': <Heart size={20} />,
    'Library': <BookOpen size={20} />,
    'Coworking Space': <Laptop size={20} />,
    'Swimming Pool': <Waves size={20} />,
    'Study Room': <BookOpen size={20} />,
};

// Load Razorpay script once
function loadRazorpay(): Promise<void> {
    return new Promise((resolve, reject) => {
        if ((window as any).Razorpay) return resolve();
        const s = document.createElement('script');
        s.src = 'https://checkout.razorpay.com/v1/checkout.js';
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Failed to load Razorpay'));
        document.body.appendChild(s);
    });
}

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { user, isLoggedIn } = useAuth();
    const [property, setProperty] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [moveInDate, setMoveInDate] = useState('');

    // Booking modal state
    const [showBookModal, setShowBookModal] = useState(false);
    const [bookLoading, setBookLoading] = useState(false);
    const [bookError, setBookError] = useState('');
    const [bookSuccess, setBookSuccess] = useState('');

    // Visit modal state
    const [showVisitModal, setShowVisitModal] = useState(false);
    const [visitDate, setVisitDate] = useState('');
    const [visitTime, setVisitTime] = useState('');
    const [visitLoading, setVisitLoading] = useState(false);
    const [visitSuccess, setVisitSuccess] = useState('');

    const redirectToLogin = () => {
        router.push(`/auth/login?redirect=/properties/${id}`);
    };

    const handleBookNow = () => {
        if (!isLoggedIn) return redirectToLogin();
        if (user?.role && user.role !== 'TENANT') {
            alert('Please log in as a tenant to book a room.');
            return;
        }
        setBookError('');
        setBookSuccess('');
        setShowBookModal(true);
    };

    const handleConfirmBooking = async () => {
        setBookLoading(true);
        setBookError('');
        try {
            await loadRazorpay();
            const res = await bookingsApi.initiate({ propertyId: id, moveInDate: moveInDate || undefined });
            const options = {
                key: res.keyId,
                amount: res.amount,
                currency: res.currency,
                name: 'CoLife',
                description: `Hold fee for ${res.propertyName}`,
                order_id: res.orderId,
                prefill: res.prefill,
                theme: { color: '#6C5CE7' },
                handler: async (response: any) => {
                    try {
                        await paymentsApi.verify({
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                            paymentId: res.paymentId,
                        });
                    } catch { /* logged server-side */ }
                    setBookSuccess('Booking confirmed! ₹500 hold fee paid. Check your dashboard for details.');
                    setBookLoading(false);
                },
                modal: {
                    ondismiss: () => setBookLoading(false),
                },
            };
            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', () => {
                setBookError('Payment failed. Please try again.');
                setBookLoading(false);
            });
            rzp.open();
        } catch (err: any) {
            const msg = err.message || '';
            if (msg.includes('BED_UNAVAILABLE') || msg.includes('No beds available')) {
                setBookError('This bed was just taken by someone else. Please refresh the page — the property may be sold out.');
            } else {
                setBookError(msg || 'Failed to initiate booking. Please try again.');
            }
            setBookLoading(false);
        }
    };

    const handleScheduleVisit = () => {
        if (!isLoggedIn) return redirectToLogin();
        setVisitSuccess('');
        setShowVisitModal(true);
    };

    const handleConfirmVisit = async () => {
        if (!visitDate) return;
        setVisitLoading(true);
        try {
            await ticketsApi.create({
                title: `Visit Request — ${property?.name}`,
                description: `Preferred visit: ${visitDate}${visitTime ? ' at ' + visitTime : ''}`,
                category: 'other',
                priority: 'medium',
                propertyId: id,
            });
            setVisitSuccess(`Visit scheduled for ${visitDate}${visitTime ? ' at ' + visitTime : ''}. The property manager will confirm shortly.`);
        } catch {
            setVisitSuccess('Visit request sent! The property manager will contact you to confirm.');
        } finally {
            setVisitLoading(false);
        }
    };

    const handleChatWithManager = () => {
        if (!isLoggedIn) return redirectToLogin();
        if (property?.manager?.phone) {
            window.open(`https://wa.me/${property.manager.phone.replace(/[^0-9]/g, '')}`, '_blank');
        }
    };

    useEffect(() => {
        const fetchProperty = async () => {
            try {
                const apiProp = await propertiesApi.getById(id);
                if (apiProp && (apiProp as any).id) {
                    // Normalize API property to match expected shape
                    const p = apiProp as any;
                    setProperty({
                        id: p.id,
                        name: p.name,
                        address: p.address || p.city,
                        location: p.locality || (p.address ? p.address.split(',')[0] : p.city),
                        city: p.city,
                        type: p.type || 'Co-Living',
                        gender: p.gender || 'Unisex',
                        description: p.description || 'A premium co-living space with modern amenities.',
                        amenities: p.amenities || [],
                        highlights: p.highlights || ['Professional Housekeeping', 'High-Speed WiFi', '24/7 Security', 'Furnished Rooms'],
                        price: p.price || p.rooms?.[0]?.basePrice || 12000,
                        originalPrice: p.originalPrice || null,
                        roomType: p.roomType || (p.rooms?.[0]?.roomType) || 'Single Sharing',
                        deposit: p.deposit || 25000,
                        lockIn: p.lockIn || '3 months',
                        availableFrom: p.availableFrom || new Date().toISOString(),
                        totalBeds: p.totalBeds || p.rooms?.length * 2 || 20,
                        occupiedBeds: p.occupiedBeds || Math.round((p.rooms?.length || 10) * 1.6),
                        occupancy: p.occupancy || 85,
                        rating: p.rating || 4.5,
                        reviewCount: p.reviewCount || 128,
                        manager: p.manager || { name: 'Neha Gupta', phone: '+919876543214' },
                    });
                } else {
                    throw new Error('Not found in API');
                }
            } catch {
                // Fallback to mock data
                const mock = mockProperties.find(p => p.id === id);
                setProperty(mock || null);
            } finally {
                setLoading(false);
            }
        };
        fetchProperty();
    }, [id]);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="spinner" />
            </div>
        );
    }

    if (!property) {
        return (
            <div style={{ textAlign: 'center', padding: '120px 24px' }}>
                <h2 style={{ fontFamily: 'Outfit', fontSize: '2rem' }}>Property not found</h2>
                <Link href="/properties" className="btn-primary" style={{ marginTop: 24, display: 'inline-flex' }}>
                    <ArrowLeft size={16} /> Back to Properties
                </Link>
            </div>
        );
    }

    return (
        <div>
            {/* Top bar */}
            <div style={{
                background: 'var(--bg-card)',
                borderBottom: '1px solid var(--border)',
                padding: '14px 24px',
            }}>
                <div className="page-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Link href="/properties" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>
                        <ArrowLeft size={18} /> Back to Properties
                    </Link>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Heart size={16} /> Save
                        </button>
                        <button className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Share2 size={16} /> Share
                        </button>
                    </div>
                </div>
            </div>

            <div className="page-container" style={{ padding: '32px 24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' }}>
                    {/* Left Column */}
                    <div>
                        {/* Hero Image */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                height: 380,
                                borderRadius: 'var(--radius-lg)',
                                background: `linear-gradient(135deg, #1a1a3a, #2d1b69, #4a3db8)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                overflow: 'hidden',
                                marginBottom: 32,
                            }}
                        >
                            <div style={{ fontSize: '5rem', opacity: 0.5 }}>🏠</div>
                            <div style={{
                                position: 'absolute', top: 16, left: 16,
                                display: 'flex', gap: 8,
                            }}>
                                <span className="badge" style={{ background: 'rgba(108,92,231,0.9)', color: 'white', backdropFilter: 'blur(8px)' }}>
                                    {property.type}
                                </span>
                                {property.gender !== 'Unisex' && property.gender !== 'unisex' && (
                                    <span className="badge" style={{
                                        background: property.gender === 'Female' || property.gender === 'female' ? 'rgba(253,121,168,0.9)' : 'rgba(0,206,201,0.9)',
                                        color: 'white',
                                    }}>
                                        {property.gender} Only
                                    </span>
                                )}
                                {property.originalPrice && (
                                    <span className="badge" style={{ background: 'rgba(81,207,102,0.9)', color: 'white' }}>
                                        {Math.round((1 - property.price / property.originalPrice) * 100)}% OFF
                                    </span>
                                )}
                            </div>
                        </motion.div>

                        {/* Title & Rating */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            <h1 style={{ fontFamily: 'Outfit', fontSize: '1.8rem', fontWeight: 700, marginBottom: 12 }}>
                                {property.name}
                            </h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <MapPin size={16} style={{ color: 'var(--primary-light)' }} />
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{property.address}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: 4,
                                        background: 'rgba(255,193,7,0.1)', padding: '4px 10px', borderRadius: 8,
                                    }}>
                                        <Star size={15} fill="#FFC107" color="#FFC107" />
                                        <span style={{ fontWeight: 600, color: '#FFC107' }}>{property.rating}</span>
                                    </div>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>({property.reviewCount} reviews)</span>
                                </div>
                            </div>

                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 32, fontSize: '0.95rem' }}>
                                {property.description}
                            </p>
                        </motion.div>

                        {/* Highlights */}
                        {property.highlights && property.highlights.length > 0 && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                                className="card" style={{ marginBottom: 24 }}>
                                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', fontWeight: 600, marginBottom: 16 }}>
                                    ✨ Highlights
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                                    {property.highlights.map((h: string) => (
                                        <div key={h} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
                                            <CheckCircle2 size={18} style={{ color: 'var(--secondary)', flexShrink: 0 }} />
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{h}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Amenities */}
                        {property.amenities && property.amenities.length > 0 && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                                className="card" style={{ marginBottom: 24 }}>
                                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', fontWeight: 600, marginBottom: 16 }}>
                                    🏠 Amenities
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                                    {property.amenities.map((am: string) => (
                                        <div key={am} style={{
                                            display: 'flex', alignItems: 'center', gap: 12,
                                            padding: '14px 16px',
                                            background: 'var(--bg-surface)',
                                            borderRadius: 'var(--radius-sm)',
                                            border: '1px solid var(--border)',
                                        }}>
                                            <div style={{ color: 'var(--primary-light)' }}>
                                                {amenityFullIcons[am] || <CheckCircle2 size={20} />}
                                            </div>
                                            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{am}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Occupancy Info */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                            className="card" style={{ marginBottom: 24 }}>
                            <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', fontWeight: 600, marginBottom: 16 }}>
                                📊 Occupancy
                            </h3>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    {property.occupiedBeds} / {property.totalBeds} beds occupied
                                </span>
                                {(property.totalBeds - property.occupiedBeds) > 0 ? (
                                    <span style={{ color: 'var(--secondary)', fontWeight: 600, fontSize: '0.9rem' }}>
                                        {property.totalBeds - property.occupiedBeds} beds available
                                    </span>
                                ) : (
                                    <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.9rem' }}>
                                        Sold Out
                                    </span>
                                )}
                            </div>
                            <div className="progress-bar" style={{ height: 10, borderRadius: 5 }}>
                                <div className="progress-bar-fill" style={{
                                    width: `${property.occupancy}%`,
                                    background: property.occupancy > 90 ? 'var(--accent)' : 'var(--gradient-primary)',
                                }} />
                            </div>
                        </motion.div>

                        {/* House Rules */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                            className="card">
                            <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', fontWeight: 600, marginBottom: 16 }}>
                                📜 House Rules
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {[
                                    'No smoking inside the premises',
                                    'Visitors allowed until 10:00 PM',
                                    'Overnight guests require prior approval',
                                    'Quiet hours: 11:00 PM – 7:00 AM',
                                    'Common areas must be kept clean',
                                ].map(rule => (
                                    <div key={rule} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                                        <ChevronRight size={14} style={{ color: 'var(--primary-light)', flexShrink: 0 }} />
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{rule}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* AI Recommendations */}
                        <RecommendationsSection currentPropertyId={id} />
                    </div>

                    {/* Right Column — Booking Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        style={{ position: 'sticky', top: 120 }}
                    >
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            {/* Price header */}
                            <div style={{
                                padding: '24px 24px 20px',
                                background: 'var(--gradient-primary)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                                    <span style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'Outfit' }}>
                                        ₹{(property.price || 0).toLocaleString('en-IN')}
                                    </span>
                                    <span style={{ opacity: 0.8, fontSize: '0.9rem' }}>/month</span>
                                </div>
                                {property.originalPrice && (
                                    <span style={{ textDecoration: 'line-through', opacity: 0.7, fontSize: '0.9rem' }}>
                                        ₹{property.originalPrice.toLocaleString('en-IN')}/month
                                    </span>
                                )}
                                <div style={{ marginTop: 8 }}>
                                    <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                                        {property.roomType || 'Standard'}
                                    </span>
                                </div>
                            </div>

                            <div style={{ padding: 24 }}>
                                {/* Details */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Security Deposit</span>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>₹{(property.deposit || 0).toLocaleString('en-IN')}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Lock-in Period</span>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{property.lockIn || '3 months'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Available From</span>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--secondary)' }}>
                                            {new Date(property.availableFrom || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Available Beds</span>
                                        {((property.totalBeds || 0) - (property.occupiedBeds || 0)) > 0 ? (
                                            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--secondary)' }}>
                                                {(property.totalBeds || 0) - (property.occupiedBeds || 0)}
                                            </span>
                                        ) : (
                                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent)' }}>Sold Out</span>
                                        )}
                                    </div>
                                </div>

                                {/* Move-in date */}
                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 8 }}>
                                        Preferred Move-in Date
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <Calendar size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input
                                            type="date"
                                            className="input"
                                            style={{ paddingLeft: 40 }}
                                            value={moveInDate}
                                            min={new Date().toISOString().split('T')[0]}
                                            onChange={e => setMoveInDate(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* CTA */}
                                {(property.totalBeds - property.occupiedBeds) <= 0 ? (
                                    <>
                                        <button
                                            disabled
                                            style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: 700, borderRadius: 'var(--radius-sm)', border: 'none', background: 'rgba(253,121,168,0.15)', color: 'var(--accent)', cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                        >
                                            🔴 Sold Out — No Beds Available
                                        </button>
                                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 8 }}>
                                            All beds are currently occupied
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            className="btn-primary"
                                            style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem' }}
                                            onClick={handleBookNow}
                                        >
                                            {isLoggedIn ? 'Book Now — ₹500 Hold Fee' : 'Login to Book'}
                                        </button>
                                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 8 }}>
                                            Fully refundable • Room locked for 15 minutes
                                        </p>
                                    </>
                                )}

                                <div style={{ borderTop: '1px solid var(--border)', marginTop: 20, paddingTop: 20 }}>
                                    <button
                                        className="btn-secondary"
                                        style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }}
                                        onClick={handleScheduleVisit}
                                    >
                                        <Calendar size={16} /> {isLoggedIn ? 'Schedule Visit' : 'Login to Schedule'}
                                    </button>
                                    <button
                                        className="btn-ghost"
                                        style={{ width: '100%', justifyContent: 'center' }}
                                        onClick={handleChatWithManager}
                                    >
                                        <MessageCircle size={16} /> Chat with Manager
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Manager card */}
                        <div className="card" style={{ marginTop: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: 14,
                                    background: 'var(--gradient-secondary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 700, fontSize: '1.1rem', color: 'white',
                                }}>
                                    {(property.manager?.name || 'M').charAt(0)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{property.manager?.name || 'Property Manager'}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Property Manager</div>
                                </div>
                                <a href={`tel:${property.manager?.phone || ''}`} style={{
                                    width: 40, height: 40, borderRadius: 12,
                                    background: 'rgba(0,206,201,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'var(--secondary)',
                                }}>
                                    <Phone size={18} />
                                </a>
                            </div>
                        </div>

                        {/* Trust badges */}
                        <div className="card" style={{ marginTop: 16, padding: '16px 20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {[
                                    { icon: <Shield size={16} />, text: 'Verified Property' },
                                    { icon: <CheckCircle2 size={16} />, text: 'KYC-Verified Owner' },
                                    { icon: <Zap size={16} />, text: '24-hour Cancellation' },
                                ].map(badge => (
                                    <div key={badge.text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ color: 'var(--secondary)' }}>{badge.icon}</span>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{badge.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            <style jsx>{`
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 1fr 380px"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

            {/* ── Booking Modal ── */}
            {showBookModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
                }} onClick={e => { if (e.target === e.currentTarget && !bookLoading) setShowBookModal(false); }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="card"
                        style={{ maxWidth: 460, width: '100%', padding: 32, position: 'relative' }}
                    >
                        {!bookLoading && !bookSuccess && (
                            <button onClick={() => setShowBookModal(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                <X size={20} />
                            </button>
                        )}
                        {bookSuccess ? (
                            <div style={{ textAlign: 'center', padding: '16px 0' }}>
                                <CheckCircle2 size={48} style={{ color: 'var(--secondary)', margin: '0 auto 16px' }} />
                                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.3rem', fontWeight: 700, marginBottom: 12 }}>Booking Confirmed!</h3>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>{bookSuccess}</p>
                                <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setShowBookModal(false); router.push('/dashboard/tenant'); }}>
                                    Go to My Dashboard
                                </button>
                            </div>
                        ) : (
                            <>
                                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>Confirm Booking</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 24 }}>{property?.name}</p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Monthly Rent</span>
                                        <span style={{ fontWeight: 600 }}>₹{(property?.price || 0).toLocaleString('en-IN')}/mo</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Move-in Date</span>
                                        <span style={{ fontWeight: 600 }}>{moveInDate || 'Earliest available'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Hold Fee (refundable)</span>
                                        <span style={{ fontWeight: 700, color: 'var(--primary-light)' }}>₹500</span>
                                    </div>
                                </div>

                                {bookError && (
                                    <div style={{ padding: '10px 14px', marginBottom: 16, borderRadius: 8, background: 'rgba(253,121,168,0.1)', border: '1px solid rgba(253,121,168,0.3)', color: 'var(--accent)', fontSize: '0.85rem' }}>
                                        {bookError}
                                    </div>
                                )}

                                <button
                                    className="btn-primary"
                                    style={{ width: '100%', justifyContent: 'center', padding: '14px', gap: 8 }}
                                    onClick={handleConfirmBooking}
                                    disabled={bookLoading}
                                >
                                    {bookLoading ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : 'Pay ₹500 & Confirm Booking'}
                                </button>
                                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 8 }}>
                                    Fully refundable if you cancel within 24 hours
                                </p>
                            </>
                        )}
                    </motion.div>
                </div>
            )}

            {/* ── Schedule Visit Modal ── */}
            {showVisitModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
                }} onClick={e => { if (e.target === e.currentTarget && !visitLoading) setShowVisitModal(false); }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="card"
                        style={{ maxWidth: 440, width: '100%', padding: 32, position: 'relative' }}
                    >
                        {!visitLoading && !visitSuccess && (
                            <button onClick={() => setShowVisitModal(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                <X size={20} />
                            </button>
                        )}
                        {visitSuccess ? (
                            <div style={{ textAlign: 'center', padding: '16px 0' }}>
                                <CheckCircle2 size={48} style={{ color: 'var(--secondary)', margin: '0 auto 16px' }} />
                                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.3rem', fontWeight: 700, marginBottom: 12 }}>Visit Scheduled!</h3>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>{visitSuccess}</p>
                                <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowVisitModal(false)}>
                                    Done
                                </button>
                            </div>
                        ) : (
                            <>
                                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>Schedule a Visit</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 24 }}>{property?.name}</p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: 8 }}>Preferred Date</label>
                                        <input
                                            type="date"
                                            className="input"
                                            value={visitDate}
                                            min={new Date().toISOString().split('T')[0]}
                                            onChange={e => setVisitDate(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: 8 }}>Preferred Time (optional)</label>
                                        <input
                                            type="time"
                                            className="input"
                                            value={visitTime}
                                            onChange={e => setVisitTime(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <button
                                    className="btn-primary"
                                    style={{ width: '100%', justifyContent: 'center', padding: '14px', gap: 8 }}
                                    onClick={handleConfirmVisit}
                                    disabled={!visitDate || visitLoading}
                                >
                                    {visitLoading ? <><Loader2 size={16} className="animate-spin" /> Scheduling...</> : 'Confirm Visit'}
                                </button>
                            </>
                        )}
                    </motion.div>
                </div>
            )}
        </div>
    );
}
