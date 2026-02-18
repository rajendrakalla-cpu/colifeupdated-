import Link from 'next/link';
import { Heart, Mail, Phone, MapPin, Instagram, Twitter, Linkedin, Youtube } from 'lucide-react';

const socialIcons = [
    { Icon: Instagram, label: 'Instagram' },
    { Icon: Twitter, label: 'Twitter' },
    { Icon: Linkedin, label: 'LinkedIn' },
    { Icon: Youtube, label: 'YouTube' },
];

export default function Footer() {
    return (
        <footer className="footer-root">
            <div style={{ maxWidth: 1280, margin: '0 auto' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 40,
                    marginBottom: 50,
                }}>
                    {/* Brand */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 12,
                                background: 'var(--gradient-primary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.3rem', fontWeight: 800, color: 'white', fontFamily: 'Outfit',
                            }}>C</div>
                            <span style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'Outfit', color: 'white' }}>
                                CoLife
                            </span>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: 20 }}>
                            India&apos;s smarter co-living platform. Find your perfect space, pay rent seamlessly, and join a vibrant community.
                        </p>
                        <div style={{ display: 'flex', gap: 12 }}>
                            {socialIcons.map(({ Icon, label }) => (
                                <a key={label} href="#" aria-label={label} className="footer-social">
                                    <Icon size={16} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 style={{ fontFamily: 'Outfit', fontSize: '1rem', fontWeight: 600, marginBottom: 16, color: 'white' }}>Explore</h4>
                        {['All Properties', 'Co-Living Spaces', 'PG Accommodations', 'Studios', 'Blog'].map(link => (
                            <a key={link} href="/properties" className="footer-link">
                                {link}
                            </a>
                        ))}
                    </div>

                    {/* Company */}
                    <div>
                        <h4 style={{ fontFamily: 'Outfit', fontSize: '1rem', fontWeight: 600, marginBottom: 16, color: 'white' }}>Company</h4>
                        {['About Us', 'Careers', 'Partner With Us', 'Press', 'Terms & Conditions', 'Privacy Policy'].map(link => (
                            <a key={link} href="#" className="footer-link">
                                {link}
                            </a>
                        ))}
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 style={{ fontFamily: 'Outfit', fontSize: '1rem', fontWeight: 600, marginBottom: 16, color: 'white' }}>Contact Us</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Phone size={16} style={{ color: 'var(--primary-light)' }} />
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>+91 1800 123 4567</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Mail size={16} style={{ color: 'var(--primary-light)' }} />
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>hello@colife.in</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                <MapPin size={16} style={{ color: 'var(--primary-light)', marginTop: 2, flexShrink: 0 }} />
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    WeWork Embassy TechVillage, Outer Ring Road, Bangalore 560103
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom */}
                <div style={{
                    borderTop: '1px solid var(--border)',
                    paddingTop: 24,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12,
                }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        © 2026 CoLife Technologies Pvt. Ltd. All rights reserved.
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                        Made with <Heart size={14} style={{ color: 'var(--accent)' }} /> in India
                    </p>
                </div>
            </div>
        </footer>
    );
}
