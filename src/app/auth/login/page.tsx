'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Phone, ArrowRight, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { authApi } from '@/lib/api';

export default function LoginPage() {
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();

    const handleSendOTP = async () => {
        if (phone.length === 10) {
            setLoading(true);
            setError('');
            try {
                await authApi.sendOtp(`+91${phone}`);
                setStep('otp');
            } catch (err: any) {
                setError(err.message || 'Failed to send OTP');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleVerifyOTP = async () => {
        if (otp.length === 6) {
            setLoading(true);
            setError('');
            try {
                const { user, isNew } = await login(`+91${phone}`, otp);
                if (isNew) {
                    window.location.href = '/auth/register';
                } else {
                    // Redirect based on role
                    const roleMap: Record<string, string> = {
                        'OWNER': 'owner',
                        'TENANT': 'tenant',
                        'ADMIN': 'admin',
                    };
                    const dashRole = roleMap[user.role] || user.role?.toLowerCase() || 'tenant';
                    window.location.href = `/dashboard/${dashRole}`;
                }
            } catch (err: any) {
                setError(err.message || 'Invalid OTP');
            } finally {
                setLoading(false);
            }
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
            <div className="orb" style={{ width: 300, height: 300, background: 'var(--primary)', top: -100, right: -100 }} />
            <div className="orb" style={{ width: 200, height: 200, background: 'var(--secondary)', bottom: 0, left: -50 }} />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass"
                style={{
                    maxWidth: 440,
                    width: '100%',
                    borderRadius: 'var(--radius-lg)',
                    padding: '48px 36px',
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: 16,
                        background: 'var(--gradient-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.6rem', fontWeight: 800, color: 'white', fontFamily: 'Outfit',
                        margin: '0 auto 16px',
                    }}>C</div>
                    <h1 style={{ fontFamily: 'Outfit', fontSize: '1.6rem', fontWeight: 700, marginBottom: 6 }}>
                        Welcome Back
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Login to your CoLife account
                    </p>
                </div>

                {/* Error message */}
                {error && (
                    <div style={{
                        padding: '10px 14px', marginBottom: 16, borderRadius: 'var(--radius-sm)',
                        background: 'rgba(253,121,168,0.1)', border: '1px solid rgba(253,121,168,0.3)',
                        color: 'var(--accent)', fontSize: '0.85rem',
                    }}>
                        {error}
                    </div>
                )}

                {step === 'phone' ? (
                    <div>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: 8 }}>
                            Mobile Number
                        </label>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                            <div className="input" style={{
                                width: 70, textAlign: 'center', flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--text-muted)',
                            }}>
                                🇮🇳 +91
                            </div>
                            <input
                                className="input"
                                type="tel"
                                placeholder="Enter 10-digit number"
                                value={phone}
                                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                maxLength={10}
                                style={{ flex: 1 }}
                            />
                        </div>
                        <button
                            className="btn-primary"
                            onClick={handleSendOTP}
                            disabled={phone.length !== 10 || loading}
                            style={{
                                width: '100%', justifyContent: 'center', padding: '14px',
                                opacity: phone.length !== 10 ? 0.5 : 1,
                            }}
                        >
                            {loading ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span className="animate-pulse-glow" style={{ width: 16, height: 16, borderRadius: '50%', background: 'white' }} />
                                    Sending OTP...
                                </span>
                            ) : (
                                <>Send OTP <ArrowRight size={16} /></>
                            )}
                        </button>
                    </div>
                ) : (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'rgba(0,206,201,0.1)', border: '1px solid rgba(0,206,201,0.2)' }}>
                            <Shield size={16} style={{ color: 'var(--secondary)' }} />
                            <span style={{ color: 'var(--secondary)', fontSize: '0.85rem' }}>OTP sent to +91 {phone}</span>
                        </div>

                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: 8 }}>
                            Enter OTP
                        </label>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                            {[0, 1, 2, 3, 4, 5].map(i => (
                                <input
                                    key={i}
                                    className="input"
                                    type="text"
                                    maxLength={1}
                                    value={otp[i] || ''}
                                    onChange={e => {
                                        const val = e.target.value;
                                        if (/^\d?$/.test(val)) {
                                            const newOtp = otp.split('');
                                            newOtp[i] = val;
                                            setOtp(newOtp.join(''));
                                            if (val && i < 5) {
                                                const next = e.target.parentElement?.children[i + 1] as HTMLInputElement;
                                                next?.focus();
                                            }
                                        }
                                    }}
                                    style={{
                                        textAlign: 'center', fontSize: '1.3rem', fontWeight: 700,
                                        padding: '12px 0', width: '100%',
                                    }}
                                />
                            ))}
                        </div>

                        <button
                            className="btn-primary"
                            onClick={handleVerifyOTP}
                            disabled={otp.length !== 6 || loading}
                            style={{
                                width: '100%', justifyContent: 'center', padding: '14px', marginBottom: 12,
                                opacity: otp.length !== 6 ? 0.5 : 1,
                            }}
                        >
                            {loading ? 'Verifying...' : <>Verify & Login <ArrowRight size={16} /></>}
                        </button>

                        <div style={{ textAlign: 'center' }}>
                            <button className="btn-ghost" onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                                style={{ fontSize: '0.85rem' }}>
                                ← Change number
                            </button>
                            <span style={{ color: 'var(--text-muted)', margin: '0 8px' }}>•</span>
                            <button className="btn-ghost" onClick={handleSendOTP} style={{ fontSize: '0.85rem', color: 'var(--primary-light)' }}>
                                Resend OTP
                            </button>
                        </div>
                    </motion.div>
                )}

                <div style={{ marginTop: 28, textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Don&apos;t have an account?{' '}
                        <Link href="/auth/register" style={{ color: 'var(--primary-light)', textDecoration: 'none', fontWeight: 600 }}>
                            Sign Up
                        </Link>
                    </p>
                </div>

                {/* Quick login hint */}
                <div style={{
                    marginTop: 20, textAlign: 'center', padding: '12px',
                    background: 'rgba(108,92,231,0.05)', borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(108,92,231,0.1)',
                }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        <Sparkles size={12} style={{ display: 'inline', marginRight: 4 }} />
                        Dev mode: Use OTP <strong>123456</strong> for any phone number
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
