'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import PropertyCard from './PropertyCard';
import { aiApi } from '@/lib/api';

export default function RecommendationsSection({ currentPropertyId }: { currentPropertyId: string }) {
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                // In a real app, this would use the user's ID
                const res = await aiApi.getRecommendations(3);
                const props = (res as any)?.map((r: any) => ({
                    ...r.property,
                    score: r.score,
                    reasons: r.reasons
                })) || [];

                // Filter out current property if it's in the list
                setRecommendations(props.filter((p: any) => p.id !== currentPropertyId).slice(0, 3));
            } catch (err) {
                console.error('Failed to fetch recommendations:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, [currentPropertyId]);

    if (loading || recommendations.length === 0) return null;

    return (
        <section style={{ marginTop: 60 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
                <div>
                    <span className="badge badge-primary" style={{ marginBottom: 12, display: 'inline-flex' }}>
                        <Sparkles size={12} /> AI Recommended
                    </span>
                    <h2 style={{ fontFamily: 'Outfit', fontSize: '1.8rem', fontWeight: 700, marginTop: 8 }}>
                        Similar <span className="gradient-text">Spaces</span> for You
                    </h2>
                    <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Based on your preferences and viewing history</p>
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: 24,
            }}>
                {recommendations.map((property, i) => (
                    <motion.div
                        key={property.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        style={{ position: 'relative' }}
                    >
                        {property.reasons?.[0] && (
                            <div style={{
                                position: 'absolute', top: -10, right: 20, zIndex: 10,
                                background: 'var(--gradient-primary)', color: 'white',
                                padding: '4px 12px', borderRadius: 100, fontSize: '0.7rem',
                                fontWeight: 700, boxShadow: '0 4px 12px rgba(108,92,231,0.3)',
                            }}>
                                {property.reasons[0]}
                            </div>
                        )}
                        <PropertyCard property={property} />
                    </motion.div>
                ))}
            </div>
        </section>
    );
}

// Add aiApi to lib/api.ts since it was missing
