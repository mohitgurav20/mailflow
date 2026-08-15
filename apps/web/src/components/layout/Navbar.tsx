import React, { useEffect, useRef } from 'react';
import { useMockStore } from '../../mock/mockStore';
import { Clock, Shield, Pause, Play, Activity, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    simulationTime, isClockRunning, toggleClock,
    userRole, setUserRole, demoMode, toggleDemoMode,
    disruptions
  } = useMockStore();

  const activeDisruptionsCount = disruptions.filter((d) => d.active).length;

  // Scroll reveal on mount
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (navRef.current) {
      navRef.current.style.opacity = '0';
      navRef.current.style.transform = 'translateY(-8px)';
      requestAnimationFrame(() => {
        if (navRef.current) {
          navRef.current.style.transition = 'opacity 300ms ease, transform 300ms ease';
          navRef.current.style.opacity = '1';
          navRef.current.style.transform = 'translateY(0)';
        }
      });
    }
  }, []);

  return (
    <header ref={navRef} style={styles.headerContainer}>
      {/* National Tricolor Strip */}
      <div style={styles.tricolorStrip}>
        <div style={styles.saffron} />
        <div style={styles.white} />
        <div style={styles.green} />
      </div>

      <div style={styles.mainBar}>
        {/* Branding */}
        <div style={styles.brandGroup}>
          <img src="/emblem.png" alt="State Emblem of India" style={styles.emblemImg} />
          <div style={styles.dividerLine} />
          <div>
            <div style={styles.govLabel}>
              <span>भारत सरकार</span>
              <span style={styles.govLabelSep}>|</span>
              <span style={{ color: '#FF9933' }}>Government of India</span>
              <span style={styles.govLabelSep}>|</span>
              <span>डाक विभाग</span>
            </div>
            <h1 style={styles.title}>
              MailFlow <span style={styles.subTitle}>— Department of Posts</span>
            </h1>
            <p style={styles.tagline}>Dynamic Multimodal Transmission Solution · SIH260461</p>
          </div>
        </div>

        {/* Live Status Ticker */}
        <div style={styles.tickerWrapper}>
          <div style={styles.tickerLabel}>
            <Activity size={12} color="#FF9933" />
            <span>LIVE STATUS</span>
          </div>
          <div style={styles.tickerTrack}>
            {activeDisruptionsCount > 0 ? (
              <span style={styles.tickerAlert}>
                <AlertTriangle size={12} color="#F59E0B" />
                {activeDisruptionsCount} Active Network Disruptions · DEL Air Grounding · Northern Rail Delay · Dynamic Re-routing Active
              </span>
            ) : (
              <span style={styles.tickerOk}>
                <CheckCircle2 size={12} color="#10B981" />
                All 25 Hubs &amp; 120 Transport Legs Operational · SLA Normal
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div style={styles.controlsGroup}>
          {/* Simulation Clock */}
          <div style={styles.clockCard}>
            <Clock size={13} color="#93C5FD" />
            <span style={styles.clockTime}>
              {simulationTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <button
              onClick={toggleClock}
              style={styles.iconBtn}
              title={isClockRunning ? 'Pause simulation clock' : 'Resume simulation clock'}
            >
              {isClockRunning
                ? <Pause size={12} color="#FCD34D" />
                : <Play  size={12} color="#34D399" />}
            </button>
          </div>

          {/* Demo Mode */}
          <button
            onClick={toggleDemoMode}
            style={{
              ...styles.demoBtn,
              background: demoMode ? 'rgba(224,70,0,0.18)' : 'rgba(255,255,255,0.08)',
              borderColor: demoMode ? '#E65100' : 'rgba(255,255,255,0.18)',
              color: demoMode ? '#FDBA74' : '#CBD5E1',
            }}
          >
            <Zap size={13} color={demoMode ? '#FDBA74' : '#64748B'} />
            <span>Demo</span>
          </button>

          {/* Role Badge */}
          <select
            value={userRole}
            onChange={(e) => setUserRole(e.target.value as any)}
            style={styles.roleSelect}
          >
            <option value="OPERATIONS_MANAGER">Operations Mgr</option>
            <option value="DIVISIONAL_HEAD">Divisional Head</option>
            <option value="DRIVER">Driver</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
      </div>
    </header>
  );
};

const styles: Record<string, React.CSSProperties> = {
  headerContainer: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: '#0F172A',
    boxShadow: '0 2px 16px rgba(0,0,0,0.30)',
  },

  tricolorStrip: {
    display: 'flex',
    height: '4px',
  },
  saffron: { flex: 1, background: '#FF9933' },
  white:   { flex: 1, background: '#FFFFFF' },
  green:   { flex: 1, background: '#138808' },

  mainBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 28px',
    gap: '16px',
    minHeight: '68px',
  },

  brandGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexShrink: 0,
  },
  emblemImg: {
    height: '50px',
    width: 'auto',
    filter: 'brightness(1.05)',
  },
  dividerLine: {
    width: '1px',
    height: '48px',
    background: 'rgba(255,255,255,0.18)',
  },
  govLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '10.5px',
    fontWeight: 600,
    color: '#94A3B8',
    letterSpacing: '0.04em',
    marginBottom: '3px',
  },
  govLabelSep: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: '11px',
  },
  title: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#FFFFFF',
    letterSpacing: '-0.02em',
    lineHeight: 1.1,
    margin: 0,
  },
  subTitle: {
    fontSize: '14px',
    fontWeight: 400,
    color: '#64748B',
    letterSpacing: 0,
  },
  tagline: {
    fontSize: '10.5px',
    color: '#475569',
    marginTop: '3px',
    letterSpacing: '0.03em',
  },

  tickerWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flex: 1,
    maxWidth: '500px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '6px',
    padding: '7px 14px',
    overflow: 'hidden',
  },
  tickerLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '10px',
    fontWeight: 800,
    letterSpacing: '0.08em',
    color: '#FF9933',
    whiteSpace: 'nowrap',
    textTransform: 'uppercase',
  },
  tickerTrack: {
    overflow: 'hidden',
    flex: 1,
  },
  tickerAlert: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12.5px',
    fontWeight: 600,
    color: '#FCD34D',
  },
  tickerOk: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12.5px',
    fontWeight: 600,
    color: '#34D399',
  },

  controlsGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexShrink: 0,
  },
  clockCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: '6px',
    padding: '7px 12px',
  },
  clockTime: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '13px',
    fontWeight: 600,
    color: '#E2E8F0',
    letterSpacing: '0.05em',
  },
  iconBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
  },
  demoBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 14px',
    borderRadius: '6px',
    border: '1px solid',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 150ms ease',
  },
  roleSelect: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: '6px',
    color: '#E2E8F0',
    fontSize: '12.5px',
    fontWeight: 600,
    padding: '7px 12px',
    cursor: 'pointer',
    outline: 'none',
  },
};
