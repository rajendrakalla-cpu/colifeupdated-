'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search, ArrowRight, Star, Shield, Zap, Users, Building2, CreditCard,
  Wrench, MessageCircle, ChevronRight, Sparkles, CheckCircle2, TrendingUp,
  MapPin, Phone, Bot
} from 'lucide-react';
import PropertyCard from '@/components/PropertyCard';
import { properties, testimonials, cities, stats } from '@/lib/data';

export default function HomePage() {
  const [searchCity, setSearchCity] = useState('');
  const [searchBudget, setSearchBudget] = useState('');

  const features = [
    { icon: <Search size={24} />, title: 'Smart Discovery', desc: 'AI-powered property search with map view, smart filters, and personalized recommendations.' },
    { icon: <Shield size={24} />, title: 'Verified Listings', desc: 'Every property physically verified. KYC-checked owners. No surprises at move-in.' },
    { icon: <CreditCard size={24} />, title: 'Seamless Payments', desc: 'Pay rent via UPI, cards, or auto-pay. Digital receipts, split payments, and deposit tracking.' },
    { icon: <Wrench size={24} />, title: 'Instant Maintenance', desc: 'Raise tickets in-app. Track SLA-based resolution. Rate the service quality.' },
    { icon: <Users size={24} />, title: 'Roommate Matching', desc: 'AI compatibility scoring based on lifestyle, habits, and preferences. Meet before you move.' },
    { icon: <MessageCircle size={24} />, title: 'Community & Support', desc: 'Events, notices, polls. 24/7 chatbot support with human escalation when needed.' },
  ];

  const howItWorks = [
    { step: '01', title: 'Search & Discover', desc: 'Browse verified properties using smart filters. Compare rooms, prices, and amenities.', icon: <Search size={28} /> },
    { step: '02', title: 'Book & Sign', desc: 'Reserve your room instantly. Complete KYC and sign your agreement digitally — all online.', icon: <CheckCircle2 size={28} /> },
    { step: '03', title: 'Move In & Live', desc: 'Smooth move-in with welcome kit. Pay rent, manage maintenance, and enjoy community life.', icon: <Sparkles size={28} /> },
  ];

  return (
    <div className="grid-bg">
      {/* ========== HERO SECTION ========== */}
      <section style={{
        position: 'relative',
        padding: '120px 24px 100px',
        overflow: 'hidden',
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
      }}>
        {/* Background orbs */}
        <div className="orb" style={{ width: 400, height: 400, background: 'var(--primary)', top: -100, right: -100 }} />
        <div className="orb" style={{ width: 300, height: 300, background: 'var(--secondary)', bottom: 50, left: -80 }} />
        <div className="orb" style={{ width: 200, height: 200, background: 'var(--accent)', top: '40%', left: '60%' }} />

        <div className="page-container" style={{ position: 'relative', zIndex: 1, width: '100%' }}>
          <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="badge badge-primary" style={{
                fontSize: '0.85rem',
                padding: '8px 20px',
                marginBottom: 24,
                display: 'inline-flex',
              }}>
                <Sparkles size={14} /> India&apos;s #1 Co-Living Platform
              </span>

              <h1 style={{
                fontFamily: 'Outfit',
                fontSize: 'clamp(2.5rem, 6vw, 4.2rem)',
                fontWeight: 800,
                lineHeight: 1.1,
                marginBottom: 24,
                marginTop: 16,
              }}>
                Find Your Perfect
                <br />
                <span className="gradient-text" style={{ display: 'inline-block' }}>
                  Co-Living Space
                </span>
              </h1>

              <p style={{
                fontSize: 'clamp(1rem, 2vw, 1.2rem)',
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                marginBottom: 40,
                maxWidth: 600,
                margin: '0 auto 40px',
              }}>
                Discover verified, fully-furnished co-living spaces across 12+ Indian cities.
                Book online, pay digitally, and join a vibrant community of professionals.
              </p>
            </motion.div>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="glass"
              style={{
                display: 'flex',
                gap: 12,
                padding: 8,
                borderRadius: 'var(--radius)',
                maxWidth: 700,
                margin: '0 auto 32px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: 2, minWidth: 180 }}>
                <select
                  className="input"
                  value={searchCity}
                  onChange={e => setSearchCity(e.target.value)}
                  style={{ border: 'none', background: 'transparent' }}
                >
                  <option value="">Select City</option>
                  {cities.map(c => (
                    <option key={c.name} value={c.name} style={{ background: 'var(--bg-card)' }}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 2, minWidth: 180 }}>
                <select
                  className="input"
                  value={searchBudget}
                  onChange={e => setSearchBudget(e.target.value)}
                  style={{ border: 'none', background: 'transparent' }}
                >
                  <option value="">Budget Range</option>
                  <option value="0-7000" style={{ background: 'var(--bg-card)' }}>Under ₹7,000</option>
                  <option value="7000-10000" style={{ background: 'var(--bg-card)' }}>₹7,000 – ₹10,000</option>
                  <option value="10000-15000" style={{ background: 'var(--bg-card)' }}>₹10,000 – ₹15,000</option>
                  <option value="15000+" style={{ background: 'var(--bg-card)' }}>₹15,000+</option>
                </select>
              </div>
              <Link href="/properties" className="btn-primary" style={{
                flex: 1, justifyContent: 'center', minWidth: 130,
              }}>
                <Search size={18} /> Search
              </Link>
            </motion.div>

            {/* Quick stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 40,
                flexWrap: 'wrap',
              }}
            >
              {stats.map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'Outfit', color: 'white' }}>{s.value}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========== CITIES SECTION ========== */}
      <section className="section" style={{ paddingTop: 40 }}>
        <div className="page-container">
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <span className="badge badge-secondary" style={{ marginBottom: 12, display: 'inline-flex' }}>
              <MapPin size={12} /> Available Cities
            </span>
            <h2 style={{ fontFamily: 'Outfit', fontSize: '2.2rem', fontWeight: 700, marginTop: 8 }}>
              Live In Your <span className="gradient-text-secondary">Favourite City</span>
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: 16,
          }}>
            {cities.map((city, i) => (
              <Link key={city.name} href={`/properties?city=${city.name}`} style={{ textDecoration: 'none' }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="card"
                  style={{ textAlign: 'center', padding: '28px 16px' }}
                >
                  <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>{city.image}</div>
                  <h3 style={{ fontFamily: 'Outfit', fontSize: '1.05rem', fontWeight: 600, marginBottom: 4 }}>{city.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{city.properties} properties</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FEATURED PROPERTIES ========== */}
      <section className="section">
        <div className="page-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span className="badge badge-accent" style={{ marginBottom: 12, display: 'inline-flex' }}>
                <TrendingUp size={12} /> Trending
              </span>
              <h2 style={{ fontFamily: 'Outfit', fontSize: '2.2rem', fontWeight: 700, marginTop: 8 }}>
                Featured <span className="gradient-text-accent">Properties</span>
              </h2>
              <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Hand-picked spaces loved by our community</p>
            </div>
            <Link href="/properties" className="btn-secondary" style={{ flexShrink: 0 }}>
              View All <ArrowRight size={16} />
            </Link>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 24,
          }}>
            {properties.slice(0, 3).map((property, i) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <PropertyCard property={property} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FEATURES SECTION ========== */}
      <section className="section" style={{ background: 'var(--bg-card)' }}>
        <div className="page-container">
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <span className="badge badge-primary" style={{ marginBottom: 12, display: 'inline-flex' }}>
              <Zap size={12} /> Why CoLife
            </span>
            <h2 style={{ fontFamily: 'Outfit', fontSize: '2.2rem', fontWeight: 700, marginTop: 8 }}>
              Everything You Need, <span className="gradient-text">One Platform</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', marginTop: 12, maxWidth: 550, margin: '12px auto 0' }}>
              From discovery to daily living — we&apos;ve built every tool to make co-living effortless.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 24,
          }}>
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card"
                style={{
                  display: 'flex',
                  gap: 18,
                  padding: '28px 24px',
                }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: 'rgba(108,92,231,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--primary-light)',
                  flexShrink: 0,
                }}>
                  {feature.icon}
                </div>
                <div>
                  <h3 style={{ fontFamily: 'Outfit', fontSize: '1.05rem', fontWeight: 600, marginBottom: 6 }}>
                    {feature.title}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="section">
        <div className="page-container">
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2 style={{ fontFamily: 'Outfit', fontSize: '2.2rem', fontWeight: 700 }}>
              How It <span className="gradient-text-secondary">Works</span>
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 32,
            maxWidth: 1000,
            margin: '0 auto',
          }}>
            {howItWorks.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                style={{ textAlign: 'center', position: 'relative' }}
              >
                <div style={{
                  width: 80, height: 80, borderRadius: 24,
                  background: 'var(--gradient-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px',
                  color: 'white',
                }}>
                  {item.icon}
                </div>
                <div style={{
                  fontFamily: 'Outfit', fontSize: '0.8rem', fontWeight: 700,
                  color: 'var(--primary-light)', marginBottom: 8,
                }}>
                  STEP {item.step}
                </div>
                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.2rem', fontWeight: 600, marginBottom: 8 }}>
                  {item.title}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  {item.desc}
                </p>
                {i < howItWorks.length - 1 && (
                  <div style={{
                    position: 'absolute',
                    top: 40,
                    right: -16,
                    color: 'var(--border)',
                    display: 'none',
                  }} className="step-arrow">
                    <ChevronRight size={24} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== TESTIMONIALS ========== */}
      <section className="section" style={{ background: 'var(--bg-card)' }}>
        <div className="page-container">
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <h2 style={{ fontFamily: 'Outfit', fontSize: '2.2rem', fontWeight: 700 }}>
              Loved by <span className="gradient-text">25,000+</span> Residents
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 24,
            maxWidth: 1000,
            margin: '0 auto',
          }}>
            {testimonials.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card"
                style={{ padding: 28 }}
              >
                <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={16} fill="#FFC107" color="#FFC107" />
                  ))}
                </div>
                <p style={{
                  color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7,
                  marginBottom: 20, fontStyle: 'italic',
                }}>
                  &ldquo;{t.content}&rdquo;
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: 'var(--gradient-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '1rem', color: 'white',
                  }}>
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{t.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA for Owners ========== */}
      <section className="section">
        <div className="page-container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass"
            style={{
              borderRadius: 'var(--radius-lg)',
              padding: '60px 40px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div className="orb" style={{ width: 200, height: 200, background: 'var(--accent)', top: -50, right: -50, opacity: 0.3 }} />
            <div className="orb" style={{ width: 150, height: 150, background: 'var(--secondary)', bottom: -40, left: -30, opacity: 0.3 }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <span className="badge badge-accent" style={{ marginBottom: 16, display: 'inline-flex' }}>
                <Building2 size={12} /> For Property Owners
              </span>
              <h2 style={{ fontFamily: 'Outfit', fontSize: '2rem', fontWeight: 700, marginTop: 8, marginBottom: 16 }}>
                List Your Property on CoLife
              </h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto 32px', lineHeight: 1.7 }}>
                Reach 25,000+ verified tenants. Automate rent collection, manage maintenance,
                and boost occupancy with AI-powered pricing.
              </p>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/auth/register" className="btn-accent">
                  List Your Property <ArrowRight size={16} />
                </Link>
                <Link href="#" className="btn-secondary">
                  <Phone size={16} /> Talk to Sales
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========== AI Features Teaser ========== */}
      <section className="section" style={{ background: 'var(--bg-card)' }}>
        <div className="page-container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 40,
            alignItems: 'center',
          }}>
            <div>
              <span className="badge badge-primary" style={{ marginBottom: 16, display: 'inline-flex' }}>
                <Bot size={12} /> AI-Powered
              </span>
              <h2 style={{ fontFamily: 'Outfit', fontSize: '2rem', fontWeight: 700, marginTop: 8, marginBottom: 20 }}>
                Smart Living, <span className="gradient-text">Smarter Platform</span>
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { title: 'Personalized Recommendations', desc: 'AI analyzes your preferences to suggest the perfect room' },
                  { title: 'Roommate Compatibility', desc: 'ML-based scoring matches you with like-minded roommates' },
                  { title: 'Dynamic Pricing', desc: 'Demand-aware pricing ensures you always get fair rates' },
                  { title: 'Predictive Maintenance', desc: 'We fix issues before they become problems' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: 'rgba(108,92,231,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, marginTop: 2,
                    }}>
                      <Sparkles size={14} style={{ color: 'var(--primary-light)' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 2 }}>{item.title}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              background: 'var(--gradient-primary)',
              borderRadius: 'var(--radius-lg)',
              padding: '50px 40px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{ fontSize: '4rem', marginBottom: 16 }}>🤖</div>
              <h3 style={{ fontFamily: 'Outfit', fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>
                CoLife AI Assistant
              </h3>
              <p style={{ opacity: 0.85, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 24 }}>
                Ask anything about properties, payments, maintenance, or community. Available 24/7.
              </p>
              <div className="glass-light" style={{
                borderRadius: 'var(--radius-sm)',
                padding: '14px 20px',
                textAlign: 'left',
                fontSize: '0.85rem',
                marginBottom: 12,
              }}>
                💬 &quot;Find me an AC room under ₹9K near HSR Layout with gym&quot;
              </div>
              <div className="glass-light" style={{
                borderRadius: 'var(--radius-sm)',
                padding: '14px 20px',
                textAlign: 'left',
                fontSize: '0.85rem',
              }}>
                🤖 &quot;Found 3 perfect matches! CoLife Skyline Residency is #1 with 4.8★...&quot;
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== Final CTA ========== */}
      <section className="section">
        <div className="page-container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Outfit', fontSize: '2.5rem', fontWeight: 800, marginBottom: 16 }}>
            Ready to Find Your New <span className="gradient-text">Home</span>?
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto 32px', fontSize: '1.1rem' }}>
            Join thousands of professionals who chose smarter living with CoLife.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/properties" className="btn-primary" style={{ padding: '14px 32px', fontSize: '1rem' }}>
              Explore Properties <ArrowRight size={18} />
            </Link>
            <Link href="/auth/register" className="btn-secondary" style={{ padding: '14px 32px', fontSize: '1rem' }}>
              Create Free Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
