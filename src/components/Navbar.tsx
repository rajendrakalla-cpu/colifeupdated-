'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
    Home, Search, Building2, Menu, X,
    ChevronDown, LogIn, LogOut, User
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [cityDropdown, setCityDropdown] = useState(false);
    const pathname = usePathname();
    const { user, isLoggedIn, logout } = useAuth();

    const cities = ['Bangalore', 'Mumbai', 'Pune', 'Hyderabad', 'Delhi NCR', 'Chennai'];

    const isActive = (path: string) => pathname === path;

    const dashboardPath = user?.role === 'owner' ? '/dashboard/owner' :
        user?.role === 'admin' || user?.role === 'manager' ? '/dashboard/admin' :
            '/dashboard/tenant';

    return (
        <nav className="glass" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            padding: '0 24px',
        }}>
            <div style={{
                maxWidth: 1280,
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: 72,
            }}>
                {/* Logo */}
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                    <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background: 'var(--gradient-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.3rem',
                        fontWeight: 800,
                        color: 'white',
                        fontFamily: 'Outfit, sans-serif',
                    }}>
                        C
                    </div>
                    <span style={{
                        fontSize: '1.4rem',
                        fontWeight: 700,
                        fontFamily: 'Outfit, sans-serif',
                        color: 'white',
                    }}>
                        Co<span className="gradient-text">Life</span>
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                }}
                    className="desktop-nav"
                >
                    <Link href="/" className="btn-ghost" style={{
                        color: isActive('/') ? 'white' : undefined,
                        background: isActive('/') ? 'rgba(108,92,231,0.15)' : undefined,
                    }}>
                        <Home size={16} style={{ marginRight: 6, display: 'inline' }} />
                        Home
                    </Link>

                    <Link href="/properties" className="btn-ghost" style={{
                        color: isActive('/properties') ? 'white' : undefined,
                        background: isActive('/properties') ? 'rgba(108,92,231,0.15)' : undefined,
                    }}>
                        <Search size={16} style={{ marginRight: 6, display: 'inline' }} />
                        Explore
                    </Link>

                    {/* City Dropdown */}
                    <div style={{ position: 'relative' }}>
                        <button
                            className="btn-ghost"
                            onClick={() => setCityDropdown(!cityDropdown)}
                            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                            <Building2 size={16} />
                            Cities
                            <ChevronDown size={14} style={{
                                transition: 'transform 0.2s',
                                transform: cityDropdown ? 'rotate(180deg)' : 'rotate(0)',
                            }} />
                        </button>
                        {cityDropdown && (
                            <div className="glass" style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                minWidth: 180,
                                padding: 8,
                                borderRadius: 'var(--radius-sm)',
                                marginTop: 4,
                            }}>
                                {cities.map(city => (
                                    <a
                                        key={city}
                                        href={`/properties?city=${city}`}
                                        onClick={() => setCityDropdown(false)}
                                        className="city-dropdown-item"
                                        style={{
                                            display: 'block',
                                            padding: '10px 14px',
                                            color: 'var(--text-secondary)',
                                            textDecoration: 'none',
                                            borderRadius: 8,
                                            fontSize: '0.9rem',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        {city}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    {isLoggedIn && (
                        <Link href={dashboardPath} className="btn-ghost" style={{
                            color: pathname.startsWith('/dashboard') ? 'white' : undefined,
                            background: pathname.startsWith('/dashboard') ? 'rgba(108,92,231,0.15)' : undefined,
                        }}>
                            Dashboard
                        </Link>
                    )}
                </div>

                {/* Right Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} className="desktop-nav">
                    {isLoggedIn ? (
                        <>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '6px 14px', borderRadius: 12,
                                background: 'rgba(108,92,231,0.1)',
                            }}>
                                <div style={{
                                    width: 30, height: 30, borderRadius: 10,
                                    background: 'var(--gradient-primary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 700, color: 'white', fontSize: '0.8rem',
                                    fontFamily: 'Outfit',
                                }}>
                                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'white' }}>
                                    {user?.name?.split(' ')[0] || 'User'}
                                </span>
                            </div>
                            <button onClick={logout} className="btn-ghost" style={{ color: 'var(--accent)', padding: '8px 14px' }}>
                                <LogOut size={16} style={{ marginRight: 4 }} />
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/auth/login" className="btn-ghost">
                                <LogIn size={16} style={{ marginRight: 4 }} />
                                Login
                            </Link>
                            <Link href="/auth/register" className="btn-primary" style={{ padding: '10px 22px', fontSize: '0.9rem' }}>
                                Get Started
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="mobile-menu-btn"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    style={{
                        display: 'none',
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        padding: 8,
                    }}
                >
                    {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileOpen && (
                <div style={{
                    padding: '16px 0',
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                }}>
                    <Link href="/" className="btn-ghost" onClick={() => setMobileOpen(false)}>Home</Link>
                    <Link href="/properties" className="btn-ghost" onClick={() => setMobileOpen(false)}>Explore Properties</Link>
                    {isLoggedIn && (
                        <Link href={dashboardPath} className="btn-ghost" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                    )}
                    <div style={{ padding: '8px 0', display: 'flex', gap: 8 }}>
                        {isLoggedIn ? (
                            <button onClick={() => { logout(); setMobileOpen(false); }} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                                <LogOut size={16} style={{ marginRight: 4 }} /> Logout
                            </button>
                        ) : (
                            <>
                                <Link href="/auth/login" className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setMobileOpen(false)}>Login</Link>
                                <Link href="/auth/register" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setMobileOpen(false)}>Sign Up</Link>
                            </>
                        )}
                    </div>
                </div>
            )}

            <style jsx>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
            <style jsx global>{`
        .city-dropdown-item:hover {
          background: rgba(108,92,231,0.1) !important;
          color: white !important;
        }
      `}</style>
        </nav>
    );
}
