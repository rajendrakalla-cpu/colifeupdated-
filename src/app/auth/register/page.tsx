'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { User, ArrowRight, Building2, Briefcase, Home, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { authApi } from '@/lib/api';

export default function RegisterPage() {
    const [userType, setUserType] = useState<string>('');
    const [formData, setFormData] = useState({
        name: '', phone: '', email: '', gender: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { register } = useAuth();

    const userTypes = [
        { id: 'TENANT', icon: <Home size={24} />, title: 'Tenant', desc: 'Looking for a co-living space' },
        { id: 'OWNER', icon: <Building2 size={24} />, title: 'Property Owner', desc: 'Want to list your property' },
        { id: 'ADMIN', icon: <Briefcase size={24} />, title: 'Property Manager', desc: 'Managing properties for owners' },
    ];

    const handleRegister = async () => {
        if (!formData.name || !formData.phone) return;
        setLoading(true);
        setError('');
        try {
            // First send OTP
            await authApi.sendOtp(`+91${formData.phone}`);
            // In dev mode, auto-verify with 123456
            const user = await register({
                phone: `+91${formData.phone}`,
                name: formData.name,
                role: userType,
            });
            const dashboardPath = userType === 'OWNER' ? '/dashboard/owner' :
                userType === 'ADMIN' ? '/dashboard/admin' : '/dashboard/tenant';
            window.location.href = dashboardPath;
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            position: 'relative',
            overflow: 'hidden',
        }}>
            <div className="orb" style={{ width: 300, height: 300, background: 'var(--accent)', top: -100, left: -100 }} />
            <div className="orb" style={{ width: 250, height: 250, background: 'var(--primary)', bottom: -50, right: -80 }} />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass"
                style={{
                    maxWidth: 520,
                    width: '100%',
                    borderRadius: 'var(--radius-lg)',
                    padding: '48px 36px',
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: 16,
                        background: 'var(--gradient-accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.6rem', fontWeight: 800, color: 'white', fontFamily: 'Outfit',
                        margin: '0 auto 16px',
                    }}>C</div>
                    <h1 style={{ fontFamily: 'Outfit', fontSize: '1.6rem', fontWeight: 700, marginBottom: 6 }}>
                        Join CoLife
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Create your account in 2 minutes
                    </p>
                </div>

                {error && (
                    <div style={{
                        padding: '10px 14px', marginBottom: 16, borderRadius: 'var(--radius-sm)',
                        background: 'rgba(253,121,168,0.1)', border: '1px solid rgba(253,121,168,0.3)',
                        color: 'var(--accent)', fontSize: '0.85rem',
                    }}>
                        {error}
                    </div>
                )}

                {!userType ? (
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 16, textAlign: 'center' }}>
                            I am a...
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {userTypes.map(ut => (
                                <motion.button
                                    key={ut.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setUserType(ut.id)}
                                    className="card"
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 16,
                                        cursor: 'pointer', textAlign: 'left', border: '1px solid var(--border)',
                                        padding: '20px',
                                    }}
                                >
                                    <div style={{
                                        width: 52, height: 52, borderRadius: 14,
                                        background: 'rgba(108,92,231,0.1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'var(--primary-light)', flexShrink: 0,
                                    }}>
                                        {ut.icon}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 2, color: 'white' }}>{ut.title}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{ut.desc}</div>
                                    </div>
                                    <ArrowRight size={18} style={{ color: 'var(--text-muted)' }} />
                                </motion.button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24,
                            padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                            background: 'rgba(108,92,231,0.1)', border: '1px solid rgba(108,92,231,0.2)',
                        }}>
                            <CheckCircle2 size={16} style={{ color: 'var(--primary-light)' }} />
                            <span style={{ color: 'var(--primary-light)', fontSize: '0.85rem', fontWeight: 500 }}>
                                Registering as {userTypes.find(u => u.id === userType)?.title}
                            </span>
                            <button onClick={() => setUserType('')} style={{
                                marginLeft: 'auto', background: 'none', border: 'none',
                                color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem',
                            }}>
                                Change
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: 6 }}>
                                    Full Name
                                </label>
                                <input className="input" placeholder="Enter your full name"
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: 6 }}>
                                    Mobile Number
                                </label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <div className="input" style={{ width: 70, textAlign: 'center', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                        +91
                                    </div>
                                    <input className="input" type="tel" placeholder="10-digit number"
                                        value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                        style={{ flex: 1 }} />
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: 6 }}>
                                    Email
                                </label>
                                <input className="input" type="email" placeholder="you@email.com"
                                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>

                            {userType === 'TENANT' && (
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: 6 }}>
                                        Gender
                                    </label>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        {['Male', 'Female', 'Other'].map(g => (
                                            <button key={g}
                                                onClick={() => setFormData({ ...formData, gender: g })}
                                                style={{
                                                    flex: 1, padding: '12px', borderRadius: 'var(--radius-sm)',
                                                    background: formData.gender === g ? 'rgba(108,92,231,0.15)' : 'var(--bg-surface)',
                                                    border: `1px solid ${formData.gender === g ? 'var(--primary)' : 'var(--border)'}`,
                                                    color: formData.gender === g ? 'var(--primary-light)' : 'var(--text-muted)',
                                                    cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem',
                                                }}>
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                className="btn-primary"
                                onClick={handleRegister}
                                disabled={!formData.name || !formData.phone || formData.phone.length !== 10 || loading}
                                style={{
                                    width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem',
                                    opacity: (!formData.name || !formData.phone || formData.phone.length !== 10) ? 0.5 : 1,
                                }}
                            >
                                {loading ? 'Creating Account...' : <>Create Account <ArrowRight size={16} /></>}
                            </button>
                        </div>

                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 16, lineHeight: 1.6 }}>
                            By creating an account, you agree to our{' '}
                            <a href="#" style={{ color: 'var(--primary-light)' }}>Terms</a> and{' '}
                            <a href="#" style={{ color: 'var(--primary-light)' }}>Privacy Policy</a>
                        </p>
                    </motion.div>
                )}

                <div style={{ marginTop: 24, textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Already have an account?{' '}
                        <Link href="/auth/login" style={{ color: 'var(--primary-light)', textDecoration: 'none', fontWeight: 600 }}>
                            Login
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
