'use client';

import Link from 'next/link';
import { Star, MapPin, Users, Wifi, Snowflake, Dumbbell, UtensilsCrossed, ShieldCheck, ArrowRight } from 'lucide-react';
import { Property, amenityIcons } from '@/lib/data';

const amenityIconMap: Record<string, React.ReactNode> = {
    'Wi-Fi': <Wifi size={14} />,
    'AC': <Snowflake size={14} />,
    'Gym': <Dumbbell size={14} />,
    'Meals': <UtensilsCrossed size={14} />,
    'CCTV': <ShieldCheck size={14} />,
};

export default function PropertyCard({ property }: { property: Property }) {
    const occupancyColor = property.occupancy > 90 ? '#FF6B6B' : property.occupancy > 75 ? '#FFA94D' : '#51CF66';

    return (
        <Link href={`/properties/${property.id}`} style={{ textDecoration: 'none' }}>
            <div className="card" style={{
                padding: 0,
                overflow: 'hidden',
                cursor: 'pointer',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
            }}>
                {/* Image placeholder */}
                <div style={{
                    height: 200,
                    background: `linear-gradient(135deg, ${getPropertyGradient(property.id)})`,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <div style={{
                        fontSize: '3rem',
                        opacity: 0.6,
                    }}>
                        🏠
                    </div>

                    {/* Badges */}
                    <div style={{
                        position: 'absolute', top: 12, left: 12,
                        display: 'flex', gap: 6,
                    }}>
                        <span className="badge badge-primary" style={{
                            background: 'rgba(108,92,231,0.85)',
                            backdropFilter: 'blur(8px)',
                            color: 'white',
                        }}>
                            {property.type}
                        </span>
                        {property.gender !== 'Unisex' && (
                            <span className="badge" style={{
                                background: property.gender === 'Female' ? 'rgba(253,121,168,0.85)' : 'rgba(0,206,201,0.85)',
                                color: 'white',
                                backdropFilter: 'blur(8px)',
                            }}>
                                {property.gender}
                            </span>
                        )}
                    </div>

                    {property.originalPrice && (
                        <div style={{
                            position: 'absolute', top: 12, right: 12,
                        }}>
                            <span className="badge" style={{
                                background: 'rgba(81, 207, 102, 0.9)',
                                color: 'white',
                                backdropFilter: 'blur(8px)',
                            }}>
                                {Math.round((1 - property.price / property.originalPrice) * 100)}% OFF
                            </span>
                        </div>
                    )}

                    {/* Occupancy bar */}
                    <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        padding: '8px 12px',
                        background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                        display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        <div style={{
                            flex: 1, height: 4, background: 'rgba(255,255,255,0.2)',
                            borderRadius: 2, overflow: 'hidden',
                        }}>
                            <div style={{
                                width: `${property.occupancy}%`,
                                height: '100%',
                                background: occupancyColor,
                                borderRadius: 2,
                            }} />
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)', whiteSpace: 'nowrap' }}>
                            {property.occupancy}% filled
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div style={{ padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <h3 style={{
                            fontFamily: 'Outfit',
                            fontSize: '1.05rem',
                            fontWeight: 600,
                            color: 'white',
                            lineHeight: 1.3,
                        }}>
                            {property.name}
                        </h3>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            background: 'rgba(255,193,7,0.1)',
                            padding: '4px 8px',
                            borderRadius: 6,
                            flexShrink: 0,
                        }}>
                            <Star size={13} fill="#FFC107" color="#FFC107" />
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FFC107' }}>{property.rating}</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                        <MapPin size={14} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{property.location}</span>
                    </div>

                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12,
                    }}>
                        <Users size={14} style={{ color: 'var(--secondary)' }} />
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{property.roomType}</span>
                    </div>

                    {/* Amenities */}
                    <div style={{
                        display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16, flex: 1,
                    }}>
                        {property.amenities.slice(0, 5).map(am => (
                            <span key={am} style={{
                                fontSize: '0.72rem',
                                color: 'var(--text-muted)',
                                background: 'var(--bg-surface)',
                                padding: '4px 8px',
                                borderRadius: 6,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                            }}>
                                {amenityIcons[am] || '•'} {am}
                            </span>
                        ))}
                        {property.amenities.length > 5 && (
                            <span style={{
                                fontSize: '0.72rem', color: 'var(--primary-light)',
                                padding: '4px 8px',
                            }}>
                                +{property.amenities.length - 5} more
                            </span>
                        )}
                    </div>

                    {/* Price & CTA */}
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        paddingTop: 14, borderTop: '1px solid var(--border)',
                    }}>
                        <div>
                            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white', fontFamily: 'Outfit' }}>
                                ₹{property.price.toLocaleString('en-IN')}
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>/month</span>
                            {property.originalPrice && (
                                <span style={{
                                    color: 'var(--text-muted)', fontSize: '0.8rem', textDecoration: 'line-through', marginLeft: 8,
                                }}>
                                    ₹{property.originalPrice.toLocaleString('en-IN')}
                                </span>
                            )}
                        </div>
                        <span className="btn-primary" style={{
                            padding: '8px 14px', fontSize: '0.8rem',
                            display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                            View <ArrowRight size={14} />
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

function getPropertyGradient(id: string): string {
    const gradients: Record<string, string> = {
        'prop-1': '#1a1a3a, #2d1b69',
        'prop-2': '#1a2a3a, #1b4b69',
        'prop-3': '#2a1a3a, #4b1b69',
        'prop-4': '#1a3a2a, #1b694b',
        'prop-5': '#3a2a1a, #694b1b',
        'prop-6': '#1a3a3a, #1b6969',
    };
    return gradients[id] || '#1a1a3a, #2d1b69';
}
