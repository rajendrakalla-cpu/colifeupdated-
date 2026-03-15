'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import {
    Search, SlidersHorizontal, MapPin, Grid3X3, List, X
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import PropertyCard from '@/components/PropertyCard';
import { properties as mockProperties } from '@/lib/data';
import { propertiesApi } from '@/lib/api';

export default function PropertiesPage() {
    return (
        <Suspense fallback={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div className="animate-pulse-glow" style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--primary)' }} />
            </div>
        }>
            <PropertiesContent />
        </Suspense>
    );
}

function PropertiesContent() {
    const searchParams = useSearchParams();
    const cityParam = searchParams.get('city') || '';
    const qParam = searchParams.get('search') || '';

    const [searchQuery, setSearchQuery] = useState(qParam);
    const [selectedCity, setSelectedCity] = useState(cityParam);
    const [selectedGender, setSelectedGender] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [priceRange, setPriceRange] = useState([0, 20000]);
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState('rating');
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [properties, setProperties] = useState(mockProperties);

    // Try to fetch properties from API, fallback to mock data
    useEffect(() => {
        const params: any = {};
        if (selectedCity) params.city = selectedCity;
        if (searchQuery) params.search = searchQuery;

        propertiesApi.search(params)
            .then(res => {
                const apiProps = res?.properties || res;
                if (Array.isArray(apiProps) && apiProps.length > 0) {
                    setProperties(apiProps);
                }
            })
            .catch(() => {
                // Keep mock data on failure — no-op
            });
    }, [selectedCity, searchQuery]);

    const allAmenities = ['Wi-Fi', 'AC', 'Laundry', 'Gym', 'Meals', 'Power Backup', 'Parking', 'CCTV', 'Swimming Pool', 'Coworking Space'];

    const filteredProperties = useMemo(() => {
        let result = [...properties];

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter((p: any) =>
                p.name.toLowerCase().includes(q) ||
                p.location?.toLowerCase().includes(q) ||
                p.city?.toLowerCase().includes(q)
            );
        }
        if (selectedCity) result = result.filter((p: any) => p.city === selectedCity);
        if (selectedGender) result = result.filter((p: any) => p.gender === selectedGender);
        if (selectedType) result = result.filter((p: any) => p.type === selectedType);
        result = result.filter((p: any) => p.price >= priceRange[0] && p.price <= priceRange[1]);
        if (selectedAmenities.length > 0) {
            result = result.filter((p: any) => selectedAmenities.every((a: string) => p.amenities?.includes(a)));
        }

        switch (sortBy) {
            case 'price-low': result.sort((a: any, b: any) => a.price - b.price); break;
            case 'price-high': result.sort((a: any, b: any) => b.price - a.price); break;
            case 'rating': result.sort((a: any, b: any) => b.rating - a.rating); break;
            case 'occupancy': result.sort((a: any, b: any) => a.occupancy - b.occupancy); break;
        }

        return result;
    }, [properties, searchQuery, selectedCity, selectedGender, selectedType, priceRange, selectedAmenities, sortBy]);

    const toggleAmenity = (amenity: string) => {
        setSelectedAmenities(prev =>
            prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
        );
    };

    const clearFilters = () => {
        setSelectedCity('');
        setSelectedGender('');
        setSelectedType('');
        setPriceRange([0, 20000]);
        setSelectedAmenities([]);
        setSearchQuery('');
    };

    const activeFilterCount = [selectedCity, selectedGender, selectedType].filter(Boolean).length + selectedAmenities.length;

    return (
        <div style={{ minHeight: '100vh' }}>
            {/* Header */}
            <div style={{
                background: 'var(--bg-card)',
                borderBottom: '1px solid var(--border)',
                padding: '24px',
                position: 'sticky',
                top: 72,
                zIndex: 100,
            }}>
                <div className="page-container">
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Search */}
                        <div style={{ flex: 1, minWidth: 250, position: 'relative' }}>
                            <Search size={18} style={{
                                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                                color: 'var(--text-muted)',
                            }} />
                            <input
                                className="input"
                                placeholder="Search by city, locality, or property name..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{ paddingLeft: 42 }}
                            />
                        </div>

                        {/* Quick Filters */}
                        <select className="input" value={selectedCity} onChange={e => setSelectedCity(e.target.value)}
                            style={{ width: 'auto', minWidth: 130 }}>
                            <option value="">All Cities</option>
                            {['Bangalore', 'Mumbai', 'Pune', 'Hyderabad'].map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>

                        <select className="input" value={sortBy} onChange={e => setSortBy(e.target.value)}
                            style={{ width: 'auto', minWidth: 130 }}>
                            <option value="rating">Top Rated</option>
                            <option value="price-low">Price: Low → High</option>
                            <option value="price-high">Price: High → Low</option>
                            <option value="occupancy">Most Available</option>
                        </select>

                        {/* Filter toggle */}
                        <button className="btn-secondary" onClick={() => setShowFilters(!showFilters)}
                            style={{ padding: '12px 18px', position: 'relative' }}>
                            <SlidersHorizontal size={16} />
                            Filters
                            {activeFilterCount > 0 && (
                                <span style={{
                                    position: 'absolute', top: -6, right: -6,
                                    width: 20, height: 20, borderRadius: '50%',
                                    background: 'var(--accent)', color: 'white',
                                    fontSize: '0.7rem', fontWeight: 700,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>

                        {/* View toggle */}
                        <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                            <button
                                onClick={() => setViewMode('grid')}
                                style={{
                                    padding: '10px 12px', background: viewMode === 'grid' ? 'var(--primary)' : 'transparent',
                                    border: 'none', color: 'white', cursor: 'pointer',
                                }}
                            >
                                <Grid3X3 size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                style={{
                                    padding: '10px 12px', background: viewMode === 'list' ? 'var(--primary)' : 'transparent',
                                    border: 'none', color: 'white', cursor: 'pointer',
                                }}
                            >
                                <List size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Expanded Filters */}
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}
                        >
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                                {/* Gender */}
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'block' }}>
                                        Gender
                                    </label>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        {['Male', 'Female', 'Unisex'].map(g => (
                                            <button key={g} className={selectedGender === g ? 'badge badge-primary' : 'badge'}
                                                onClick={() => setSelectedGender(selectedGender === g ? '' : g)}
                                                style={{
                                                    cursor: 'pointer', padding: '6px 14px', fontSize: '0.8rem', border: '1px solid var(--border)',
                                                    background: selectedGender === g ? 'rgba(108,92,231,0.2)' : 'transparent',
                                                    color: selectedGender === g ? 'var(--primary-light)' : 'var(--text-muted)',
                                                }}>
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Type */}
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'block' }}>
                                        Property Type
                                    </label>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        {['Co-Living', 'PG', 'Hostel', 'Studio'].map(t => (
                                            <button key={t} className={selectedType === t ? 'badge badge-primary' : 'badge'}
                                                onClick={() => setSelectedType(selectedType === t ? '' : t)}
                                                style={{
                                                    cursor: 'pointer', padding: '6px 14px', fontSize: '0.8rem', border: '1px solid var(--border)',
                                                    background: selectedType === t ? 'rgba(108,92,231,0.2)' : 'transparent',
                                                    color: selectedType === t ? 'var(--primary-light)' : 'var(--text-muted)',
                                                }}>
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Price Range */}
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'block' }}>
                                        Max Price: ₹{priceRange[1].toLocaleString('en-IN')}
                                    </label>
                                    <input
                                        type="range"
                                        min={3000}
                                        max={20000}
                                        step={500}
                                        value={priceRange[1]}
                                        onChange={e => setPriceRange([0, parseInt(e.target.value)])}
                                        style={{ width: '100%', accentColor: 'var(--primary)' }}
                                    />
                                </div>

                                {/* Amenities */}
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'block' }}>
                                        Amenities
                                    </label>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        {allAmenities.map(a => (
                                            <button key={a}
                                                onClick={() => toggleAmenity(a)}
                                                style={{
                                                    cursor: 'pointer', padding: '6px 14px', fontSize: '0.8rem',
                                                    borderRadius: 100, border: '1px solid var(--border)',
                                                    background: selectedAmenities.includes(a) ? 'rgba(0,206,201,0.15)' : 'transparent',
                                                    color: selectedAmenities.includes(a) ? 'var(--secondary)' : 'var(--text-muted)',
                                                }}>
                                                {a}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {activeFilterCount > 0 && (
                                <button
                                    onClick={clearFilters}
                                    className="btn-ghost"
                                    style={{ marginTop: 16, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 6 }}
                                >
                                    <X size={14} /> Clear all filters
                                </button>
                            )}
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Results */}
            <div className="page-container" style={{ padding: '32px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                        <h1 style={{ fontFamily: 'Outfit', fontSize: '1.5rem', fontWeight: 700, marginBottom: 4 }}>
                            {selectedCity || 'All'} Properties
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            {filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'} found
                        </p>
                    </div>
                </div>

                {filteredProperties.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
                        <div style={{ fontSize: '4rem', marginBottom: 16 }}>🏠</div>
                        <h3 style={{ fontFamily: 'Outfit', fontSize: '1.3rem', fontWeight: 600, marginBottom: 8 }}>
                            No properties found
                        </h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
                            Try adjusting your filters or search in a different area.
                        </p>
                        <button className="btn-primary" onClick={clearFilters}>Clear Filters</button>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(340px, 1fr))' : '1fr',
                        gap: 24,
                    }}>
                        {filteredProperties.map((property, i) => (
                            <motion.div
                                key={property.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08 }}
                            >
                                <PropertyCard property={property} />
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
