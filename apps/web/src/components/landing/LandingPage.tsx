import React, { useEffect, useRef, useState } from 'react';

interface LandingPageProps {
  onEnterApp: () => void;
  onOpenCitizen?: () => void;
}

const stats = [
  { value: '1,64,999', label: 'Post Offices', sub: '~90% Rural India' },
  { value: '25', label: 'Smart Hubs', sub: 'GPS-tracked nodes' },
  { value: '120+', label: 'Transport Legs', sub: 'Air · Rail · Road · Water' },
  { value: '94.2%', label: 'On-Time SLA', sub: '+2.4% vs fixed plan' },
];

const features = [
  {
    icon: '🛣️',
    title: 'Multimodal Dijkstra Routing',
    desc: 'Capacity-aware shortest-path algorithm across Air, RMS Rail, MMS Road and Surface Water simultaneously — with plain-English rationale.',
    color: '#1E40AF',
    bg: '#DBEAFE',
  },
  {
    icon: '⚡',
    title: 'Blast-Radius Re-routing',
    desc: 'When a corridor fails, the engine auto-calculates every impacted consignment and bulk re-routes with a single approval click.',
    color: '#DC2626',
    bg: '#FEE2E2',
  },
  {
    icon: '📦',
    title: 'Real-Time Consignment Tracking',
    desc: 'Full scan-event timeline from induction to delivery. Public citizen portal with QR-code level visibility.',
    color: '#16A34A',
    bg: '#DCFCE7',
  },
  {
    icon: '📊',
    title: 'EWMA Self-Learning Analytics',
    desc: 'Exponentially Weighted Moving Average scores dynamically re-rank transport legs based on recorded performance.',
    color: '#D97706',
    bg: '#FEF3C7',
  },
  {
    icon: '🛡️',
    title: 'Postal Circle Embargo System',
    desc: 'Declare, manage and audit regional mail embargoes with immutable, tamper-proof audit trails per official DoP directives.',
    color: '#7C3AED',
    bg: '#EDE9FE',
  },
  {
    icon: '🗺️',
    title: 'Live Operational Network Map',
    desc: 'OpenStreetMap canvas with real-time disruption overlays, hub status indicators and mode-filtered corridor views.',
    color: '#0891B2',
    bg: '#CFFAFE',
  },
];

const modes = [
  { label: 'Commercial Air', color: '#0284C7', icon: '✈' },
  { label: 'RMS Rail', color: '#D97706', icon: '🚂' },
  { label: 'MMS Road Fleet', color: '#16A34A', icon: '🚛' },
  { label: 'Surface Water', color: '#2563EB', icon: '⛵' },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp, onOpenCitizen }) => {
  const [scrollY, setScrollY] = useState(0);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.12 }
    );

    document.querySelectorAll('[data-reveal]').forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  const isVisible = (id: string) => visibleSections.has(id);
  const parallaxY = Math.min(scrollY * 0.35, 100);

  return (
    <div style={styles.page}>

      {/* ── HERO ── */}
      <section style={styles.hero}>
        {/* Animated background grid */}
        <div style={styles.heroBg} />
        <div style={{ ...styles.heroParallaxLayer, transform: `translateY(${parallaxY}px)` }} />

        {/* National tricolor top strip */}
        <div style={styles.tricolorStrip}>
          <div style={{ flex: 1, background: '#FF9933' }} />
          <div style={{ flex: 1, background: '#FFFFFF' }} />
          <div style={{ flex: 1, background: '#138808' }} />
        </div>

        <div style={styles.heroContent}>
          {/* Official Gov badge */}
          <div style={styles.govBadge}>
            <span style={{ color: '#FF9933', fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em' }}>
              GOVERNMENT OF INDIA
            </span>
            <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 8px' }}>·</span>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em' }}>
              MINISTRY OF COMMUNICATIONS · DEPARTMENT OF POSTS
            </span>
          </div>

          {/* Emblem with glow ring */}
          <div style={styles.emblemWrapper}>
            <div style={styles.emblemGlow} />
            <div style={styles.emblemGlow2} />
            <img
              src="/emblem.png"
              alt="State Emblem of India — Ashoka Lion Capital"
              style={styles.heroEmblem}
            />
          </div>

          {/* Main headline */}
          <h1 style={styles.heroTitle}>
            <span style={styles.heroTitleLine1}>MailFlow</span>
            <span style={styles.heroTitleLine2}>
              Dynamic Multimodal{' '}
              <span style={styles.heroAccent}>Transmission</span>
            </span>
            <span style={styles.heroTitleLine3}>Solution</span>
          </h1>

          <p style={styles.heroSubtitle}>
            Powered by Dijkstra's algorithm across{' '}
            <strong style={{ color: '#FDBA74' }}>Air · RMS Rail · MMS Road · Surface Water</strong>{' '}
            with real-time blast-radius re-routing, EWMA self-learning, and an immutable audit trail —
            purpose-built for India's 1,64,999 post office network.
          </p>

          {/* SIH badge */}
          <div style={styles.sihBadge}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#60A5FA' }}>
              SIH 260461
            </span>
            <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 10px' }}>|</span>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Smart India Hackathon 2024</span>
          </div>

          {/* CTA Buttons */}
          <div style={styles.ctaGroup}>
            <button
              onClick={onOpenCitizen}
              style={{
                ...styles.ctaPrimary,
                background: 'linear-gradient(135deg, #FF6B00 0%, #E65100 100%)',
                boxShadow: '0 4px 20px rgba(230, 81, 0, 0.45)',
              }}
            >
              <span>📮 Citizen Tracking Portal (Hindi / Voice / QR)</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>

            <button onClick={onEnterApp} style={styles.ctaSecondary}>
              <span>🖥️ Officer Operations Console</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>

          {/* Transport Mode Pills */}
          <div style={styles.modePills}>
            {modes.map((m, i) => (
              <div
                key={m.label}
                style={{
                  ...styles.modePill,
                  animationDelay: `${0.4 + i * 0.1}s`,
                  borderColor: `${m.color}40`,
                  background: `${m.color}15`,
                }}
              >
                <span style={{ fontSize: '14px' }}>{m.icon}</span>
                <span style={{ color: m.color, fontSize: '11.5px', fontWeight: 700 }}>{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={styles.scrollIndicator}>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>SCROLL</span>
          <div style={styles.scrollLine} />
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section
        id="stats-strip"
        data-reveal="true"
        style={{
          ...styles.statsStrip,
          opacity: isVisible('stats-strip') ? 1 : 0,
          transform: isVisible('stats-strip') ? 'translateY(0)' : 'translateY(28px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}
      >
        <div style={styles.tricolorAccent} />
        <div style={styles.statsGrid}>
          {stats.map((s, i) => (
            <div key={s.label} style={{ ...styles.statItem, animationDelay: `${i * 0.12}s` }}>
              <div style={styles.statValue}>{s.value}</div>
              <div style={styles.statLabel}>{s.label}</div>
              <div style={styles.statSub}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={styles.section}>
        <div
          id="features-header"
          data-reveal="true"
          style={{
            ...styles.sectionHeader,
            opacity: isVisible('features-header') ? 1 : 0,
            transform: isVisible('features-header') ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
          }}
        >
          <span style={styles.sectionTag}>CORE CAPABILITIES</span>
          <h2 style={styles.sectionTitle}>
            Built for{' '}
            <span style={styles.highlightSaffron}>India's Postal</span>{' '}
            Operations at Scale
          </h2>
          <p style={styles.sectionSub}>
            Every feature is engineered for the real-world constraints of India Post — remote hubs, multi-modal constraints, and operational resilience.
          </p>
        </div>

        <div style={styles.featuresGrid}>
          {features.map((f, i) => (
            <div
              key={f.title}
              id={`feature-${i}`}
              data-reveal="true"
              style={{
                ...styles.featureCard,
                opacity: isVisible(`feature-${i}`) ? 1 : 0,
                transform: isVisible(`feature-${i}`) ? 'translateY(0)' : 'translateY(32px)',
                transition: `opacity 0.6s ease ${i * 0.08}s, transform 0.6s ease ${i * 0.08}s`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(15,23,42,0.12)';
                (e.currentTarget as HTMLDivElement).style.borderColor = f.color + '60';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(15,23,42,0.06)';
                (e.currentTarget as HTMLDivElement).style.borderColor = '#E2E8F0';
              }}
            >
              <div style={{ ...styles.featureIconBox, background: f.bg, color: f.color }}>
                <span style={{ fontSize: '26px' }}>{f.icon}</span>
              </div>
              <h3 style={{ ...styles.featureTitle, color: f.color }}>{f.title}</h3>
              <p style={styles.featureDesc}>{f.desc}</p>
              <div style={{ ...styles.featureAccentLine, background: f.color }} />
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={styles.howItWorksSection}>
        <div style={styles.howItWorksInner}>
          <div
            id="how-header"
            data-reveal="true"
            style={{
              ...styles.sectionHeader,
              opacity: isVisible('how-header') ? 1 : 0,
              transform: isVisible('how-header') ? 'translateY(0)' : 'translateY(24px)',
              transition: 'opacity 0.6s ease, transform 0.6s ease',
              marginBottom: '56px',
            }}
          >
            <span style={styles.sectionTag}>HOW IT WORKS</span>
            <h2 style={{ ...styles.sectionTitle, color: '#FFFFFF' }}>
              From Induction to{' '}
              <span style={{ color: '#FF9933' }}>Delivery</span>
            </h2>
            <p style={{ ...styles.sectionSub, color: 'rgba(255,255,255,0.55)' }}>
              A real-time decision loop spanning the entire postal logistics chain.
            </p>
          </div>

          <div style={styles.stepsRow}>
            {[
              { num: '01', title: 'Consignment Inducted', desc: 'Parcel enters network at origin hub. System captures weight, mail class, destination.', color: '#FF9933' },
              { num: '02', title: 'Route Calculated', desc: 'Dijkstra engine ranks 3 multimodal paths by cost, time and capacity. Rationale generated.', color: '#4ADE80' },
              { num: '03', title: 'Space Reserved', desc: 'Capacity slot booked on chosen leg. Partner airline / rail / driver notified via API.', color: '#60A5FA' },
              { num: '04', title: 'Real-Time Monitoring', desc: 'Scan events update tracking timeline. EWMA scores update after each leg completes.', color: '#FDBA74' },
            ].map((step, i) => (
              <div
                key={step.num}
                id={`step-${i}`}
                data-reveal="true"
                style={{
                  ...styles.stepCard,
                  opacity: isVisible(`step-${i}`) ? 1 : 0,
                  transform: isVisible(`step-${i}`) ? 'translateY(0)' : 'translateY(28px)',
                  transition: `opacity 0.6s ease ${i * 0.12}s, transform 0.6s ease ${i * 0.12}s`,
                }}
              >
                <div style={{ ...styles.stepNum, color: step.color, borderColor: `${step.color}40`, background: `${step.color}12` }}>
                  {step.num}
                </div>
                <h4 style={{ ...styles.stepTitle, color: step.color }}>{step.title}</h4>
                <p style={styles.stepDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EMBLEM CTA ── */}
      <section
        id="cta-section"
        data-reveal="true"
        style={{
          ...styles.ctaSection,
          opacity: isVisible('cta-section') ? 1 : 0,
          transform: isVisible('cta-section') ? 'translateY(0)' : 'translateY(28px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}
      >
        <div style={styles.ctaInner}>
          <div style={styles.ctaEmblemWrapper}>
            <div style={styles.ctaGlowRing} />
            <img src="/emblem.png" alt="State Emblem" style={styles.ctaEmblem} />
          </div>

          <div style={styles.ctaText}>
            <span style={{ ...styles.sectionTag, color: '#FF9933', marginBottom: '12px', display: 'block' }}>
              SMART INDIA HACKATHON 2024 · PROBLEM ID SIH260461
            </span>
            <h2 style={styles.ctaTitle}>
              सत्यमेव जयते
            </h2>
            <p style={styles.ctaSubtitle}>Truth Alone Triumphs</p>
            <p style={styles.ctaBody}>
              A fully functional mock engine serving all Person 2 UI requirements — real Dijkstra routing,
              dynamic disruption blast-radius calculation, EWMA analytics, embargo management, and immutable audit trails.
              No mocks that skip logic. Every feature works end-to-end.
            </p>

            <div style={styles.ctaButtonGroup}>
              <button onClick={onEnterApp} style={styles.ctaBtnPrimary}>
                Enter Operations Console
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>

            <div style={styles.teamCredit}>
              Built with precision for{' '}
              <span style={{ color: '#FF9933', fontWeight: 700 }}>India Post</span>{' '}
              ·{' '}
              <span style={{ color: '#4ADE80', fontWeight: 700 }}>Department of Posts</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={styles.footer}>
        <div style={styles.footerTricolor}>
          <div style={{ flex: 1, background: '#FF9933' }} />
          <div style={{ flex: 1, background: '#FFFFFF' }} />
          <div style={{ flex: 1, background: '#138808' }} />
        </div>
        <div style={styles.footerContent}>
          <div style={styles.footerLeft}>
            <img src="/emblem.png" alt="State Emblem" style={{ height: '36px', marginBottom: '10px' }} />
            <p style={styles.footerBrand}>MailFlow</p>
            <p style={styles.footerSub}>Dynamic Multimodal Transmission Solution</p>
          </div>
          <div style={styles.footerMeta}>
            <span>SIH 260461 · Smart India Hackathon 2024</span>
            <span>Department of Posts · Ministry of Communications · Government of India</span>
          </div>
        </div>
      </footer>

      {/* Global CSS for landing animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        @keyframes emblemFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33%       { transform: translateY(-8px) rotate(0.5deg); }
          66%       { transform: translateY(-4px) rotate(-0.3deg); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50%       { opacity: 0.60; transform: scale(1.06); }
        }
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes gridScroll {
          from { background-position: 0 0; }
          to   { background-position: 40px 40px; }
        }
        @keyframes scrollBounce {
          0%, 100% { transform: scaleY(1); }
          50%       { transform: scaleY(0.5); }
        }
        @keyframes modePillIn {
          from { opacity: 0; transform: translateY(12px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes ctaGlow {
          0%, 100% { box-shadow: 0 0 24px rgba(255,153,51,0.3); }
          50%       { box-shadow: 0 0 48px rgba(255,153,51,0.55), 0 0 80px rgba(255,153,51,0.15); }
        }

        .hero-emblem { animation: emblemFloat 5s ease-in-out infinite; }
        .emblem-glow { animation: glowPulse 3s ease-in-out infinite; }
        .emblem-glow-2 { animation: glowPulse 3s ease-in-out infinite 1s; }
        .hero-title-line1 { animation: heroFadeUp 0.7s ease 0.1s both; }
        .hero-title-line2 { animation: heroFadeUp 0.7s ease 0.25s both; }
        .hero-title-line3 { animation: heroFadeUp 0.7s ease 0.38s both; }
        .hero-sub { animation: heroFadeUp 0.7s ease 0.5s both; }
        .hero-sih { animation: heroFadeUp 0.7s ease 0.6s both; }
        .hero-ctas { animation: heroFadeUp 0.7s ease 0.72s both; }
        .mode-pill { animation: modePillIn 0.5s ease both; }
        .cta-btn-primary { animation: ctaGlow 2.5s ease-in-out infinite; }
        .scroll-line { animation: scrollBounce 1.2s ease-in-out infinite; }
        .hero-bg-grid { animation: gridScroll 8s linear infinite; }

        .feature-card { transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease; }
      `}</style>
    </div>
  );
};

/* ── Styles ── */
const styles: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    background: '#F1F5F9',
    overflowX: 'hidden',
  },

  /* Hero */
  hero: {
    position: 'relative',
    minHeight: '100vh',
    background: '#0A0F1E',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroBg: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `
      radial-gradient(ellipse 80% 60% at 50% 0%, rgba(30,64,175,0.30) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 20% 80%, rgba(255,153,51,0.12) 0%, transparent 50%),
      radial-gradient(ellipse 40% 40% at 80% 70%, rgba(19,136,8,0.10) 0%, transparent 50%)
    `,
    zIndex: 0,
  },
  heroParallaxLayer: {
    position: 'absolute',
    inset: '-20%',
    backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
    backgroundSize: '40px 40px',
    zIndex: 0,
    transition: 'transform 0.05s linear',
  },
  tricolorStrip: {
    display: 'flex',
    height: '4px',
    width: '100%',
    flexShrink: 0,
    zIndex: 10,
  },
  heroContent: {
    position: 'relative',
    zIndex: 5,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '60px 24px 80px',
    maxWidth: '900px',
    textAlign: 'center',
  },
  govBadge: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '40px',
    padding: '8px 20px',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '100px',
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(8px)',
  },
  emblemWrapper: {
    position: 'relative',
    marginBottom: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemGlow: {
    position: 'absolute',
    width: '160px',
    height: '160px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255,153,51,0.4) 0%, transparent 70%)',
    className: 'emblem-glow',
  } as any,
  emblemGlow2: {
    position: 'absolute',
    width: '220px',
    height: '220px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(30,64,175,0.25) 0%, transparent 70%)',
    className: 'emblem-glow-2',
  } as any,
  heroEmblem: {
    height: '130px',
    width: 'auto',
    filter: 'drop-shadow(0 0 32px rgba(255,153,51,0.5)) drop-shadow(0 0 16px rgba(255,255,255,0.2))',
    position: 'relative',
    zIndex: 2,
  },
  heroTitle: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    marginBottom: '24px',
  },
  heroTitleLine1: {
    fontSize: 'clamp(52px, 8vw, 84px)',
    fontWeight: 900,
    color: '#FFFFFF',
    letterSpacing: '-0.04em',
    lineHeight: 1,
    display: 'block',
  },
  heroTitleLine2: {
    fontSize: 'clamp(20px, 3.5vw, 32px)',
    fontWeight: 400,
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: '-0.01em',
    display: 'block',
  },
  heroTitleLine3: {
    fontSize: 'clamp(20px, 3.5vw, 32px)',
    fontWeight: 700,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: '-0.02em',
    display: 'block',
  },
  heroAccent: {
    background: 'linear-gradient(135deg, #FF9933, #FDBA74)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  heroSubtitle: {
    fontSize: 'clamp(14px, 2vw, 17px)',
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 1.75,
    maxWidth: '680px',
    marginBottom: '20px',
  },
  sihBadge: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 16px',
    background: 'rgba(96,165,250,0.08)',
    border: '1px solid rgba(96,165,250,0.2)',
    borderRadius: '6px',
    marginBottom: '36px',
  },
  ctaGroup: {
    display: 'flex',
    gap: '14px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: '40px',
  },
  ctaPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    padding: '15px 32px',
    background: 'linear-gradient(135deg, #1E40AF, #3B82F6)',
    color: '#FFFFFF',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 700,
    fontSize: '15px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(30,64,175,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
    transition: 'all 0.2s ease',
  },
  ctaSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '15px 28px',
    background: 'rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.8)',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 600,
    fontSize: '15px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.14)',
    cursor: 'pointer',
    backdropFilter: 'blur(8px)',
    transition: 'all 0.2s ease',
  },
  modePills: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    justifyContent: 'center',
  },
  modePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    padding: '7px 14px',
    borderRadius: '100px',
    border: '1px solid',
    backdropFilter: 'blur(6px)',
    fontSize: '12px',
    fontWeight: 600,
  },
  scrollIndicator: {
    position: 'absolute',
    bottom: '32px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    zIndex: 5,
  },
  scrollLine: {
    width: '1.5px',
    height: '40px',
    background: 'linear-gradient(to bottom, rgba(255,255,255,0.5), transparent)',
    transformOrigin: 'top center',
  },

  /* Stats Strip */
  statsStrip: {
    background: '#FFFFFF',
    borderBottom: '1px solid #E2E8F0',
    position: 'relative',
    padding: '0',
  },
  tricolorAccent: {
    height: '4px',
    background: 'linear-gradient(90deg, #FF9933 33.33%, #FFFFFF 33.33%, #FFFFFF 66.66%, #138808 66.66%)',
    borderBottom: '1px solid #E2E8F0',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    maxWidth: '1100px',
    margin: '0 auto',
  },
  statItem: {
    padding: '36px 28px',
    borderRight: '1px solid #E2E8F0',
    textAlign: 'center',
  },
  statValue: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '36px',
    fontWeight: 800,
    color: '#0F172A',
    letterSpacing: '-0.03em',
    lineHeight: 1,
    marginBottom: '6px',
  },
  statLabel: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#1E40AF',
    marginBottom: '4px',
  },
  statSub: {
    fontSize: '12px',
    color: '#64748B',
  },

  /* Section */
  section: {
    padding: '96px 32px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  sectionHeader: {
    textAlign: 'center',
    marginBottom: '64px',
  },
  sectionTag: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: 800,
    letterSpacing: '0.1em',
    color: '#E65100',
    marginBottom: '14px',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 'clamp(28px, 4vw, 42px)',
    fontWeight: 800,
    color: '#0F172A',
    letterSpacing: '-0.03em',
    lineHeight: 1.2,
    marginBottom: '16px',
  },
  sectionSub: {
    fontSize: '16px',
    color: '#475569',
    maxWidth: '580px',
    margin: '0 auto',
    lineHeight: 1.7,
  },
  highlightSaffron: {
    background: 'linear-gradient(135deg, #E65100, #FF9933)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },

  /* Features */
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
  },
  featureCard: {
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '14px',
    padding: '28px',
    position: 'relative',
    overflow: 'hidden',
    cursor: 'default',
    boxShadow: '0 1px 4px rgba(15,23,42,0.06)',
  },
  featureIconBox: {
    width: '52px',
    height: '52px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  featureTitle: {
    fontSize: '15px',
    fontWeight: 700,
    marginBottom: '10px',
    lineHeight: 1.3,
  },
  featureDesc: {
    fontSize: '13.5px',
    color: '#475569',
    lineHeight: 1.65,
    marginBottom: '20px',
  },
  featureAccentLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '0%',
    height: '2px',
    borderRadius: '0 2px 0 0',
    transition: 'width 0.3s ease',
  },

  /* How It Works */
  howItWorksSection: {
    background: '#0A0F1E',
    padding: '96px 32px',
  },
  howItWorksInner: {
    maxWidth: '1100px',
    margin: '0 auto',
  },
  stepsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
  },
  stepCard: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '28px 22px',
  },
  stepNum: {
    fontSize: '28px',
    fontWeight: 800,
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: '-0.03em',
    marginBottom: '14px',
    width: '52px',
    height: '52px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '10px',
    border: '1px solid',
  },
  stepTitle: {
    fontSize: '14px',
    fontWeight: 700,
    marginBottom: '8px',
  },
  stepDesc: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.45)',
    lineHeight: 1.65,
  },

  /* Final CTA */
  ctaSection: {
    background: '#FFFFFF',
    padding: '96px 32px',
    borderTop: '1px solid #E2E8F0',
    borderBottom: '1px solid #E2E8F0',
  },
  ctaInner: {
    maxWidth: '900px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    gap: '64px',
  },
  ctaEmblemWrapper: {
    position: 'relative',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaGlowRing: {
    position: 'absolute',
    width: '180px',
    height: '180px',
    borderRadius: '50%',
    border: '2px solid rgba(255,153,51,0.3)',
    boxShadow: '0 0 40px rgba(255,153,51,0.2), inset 0 0 40px rgba(255,153,51,0.05)',
  },
  ctaEmblem: {
    height: '120px',
    width: 'auto',
    filter: 'drop-shadow(0 4px 24px rgba(230,81,0,0.3))',
    position: 'relative',
    zIndex: 2,
  },
  ctaText: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: '40px',
    fontWeight: 900,
    color: '#0F172A',
    letterSpacing: '-0.03em',
    lineHeight: 1.1,
    marginBottom: '4px',
  },
  ctaSubtitle: {
    fontSize: '14px',
    color: '#64748B',
    fontStyle: 'italic',
    marginBottom: '20px',
  },
  ctaBody: {
    fontSize: '14.5px',
    color: '#334155',
    lineHeight: 1.75,
    marginBottom: '32px',
  },
  ctaButtonGroup: {
    display: 'flex',
    gap: '14px',
    marginBottom: '24px',
  },
  ctaBtnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 28px',
    background: 'linear-gradient(135deg, #E65100, #c2410c)',
    color: '#FFFFFF',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 700,
    fontSize: '14px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(230,81,0,0.35)',
    transition: 'all 0.2s ease',
  },
  teamCredit: {
    fontSize: '13px',
    color: '#64748B',
  },

  /* Footer */
  footer: {
    background: '#0A0F1E',
  },
  footerTricolor: {
    display: 'flex',
    height: '4px',
  },
  footerContent: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '36px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  footerBrand: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#FFFFFF',
    marginBottom: '4px',
  },
  footerSub: {
    fontSize: '12px',
    color: '#475569',
  },
  footerMeta: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px',
    fontSize: '11.5px',
    color: '#334155',
    textAlign: 'right',
  },
};
