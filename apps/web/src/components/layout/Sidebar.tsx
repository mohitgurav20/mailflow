import React from 'react';
import { useMockStore } from '../../mock/mockStore';
import {
  LayoutDashboard, Map, Route, Siren, Package, BarChart3,
  Settings, Radio, Shield, ChevronRight
} from 'lucide-react';

type View = 'control-tower' | 'live-map' | 'route-planner' | 'disruption-center' | 'consignments' | 'analytics' | 'admin';

interface NavItem {
  id: View;
  label: string;
  sub: string;
  icon: React.ReactNode;
  badge?: string;
  badgeType?: 'danger' | 'ok' | 'primary';
}

const navItems: NavItem[] = [
  {
    id: 'control-tower',
    label: 'Control Tower',
    sub: 'Executive overview',
    icon: <LayoutDashboard size={18} />,
  },
  {
    id: 'live-map',
    label: 'Network Map',
    sub: '25 hubs · 120 legs',
    icon: <Map size={18} />,
  },
  {
    id: 'route-planner',
    label: 'Route Planner',
    sub: 'Dijkstra multi-modal',
    icon: <Route size={18} />,
  },
  {
    id: 'disruption-center',
    label: 'Disruption Center',
    sub: 'Blast radius · Re-route',
    icon: <Siren size={18} />,
    badge: 'ALERT',
    badgeType: 'danger',
  },
  {
    id: 'consignments',
    label: 'Consignments',
    sub: 'Track & scan timeline',
    icon: <Package size={18} />,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    sub: 'EWMA · SLA charts',
    icon: <BarChart3 size={18} />,
  },
  {
    id: 'admin',
    label: 'Admin Console',
    sub: 'Embargo · Audit log',
    icon: <Settings size={18} />,
  },
];

interface SidebarProps {
  activeView: View;
  onNavigate: (view: View) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate }) => {
  const { disruptions } = useMockStore();
  const activeDisruptions = disruptions.filter((d) => d.active).length;

  return (
    <nav style={styles.sidebar}>
      {/* System Status Pill */}
      <div style={styles.statusPill}>
        <div style={styles.statusDot} />
        <span style={styles.statusText}>System Operational</span>
        <span style={styles.statusTime}>India Post · SIH 2024</span>
      </div>

      {/* Nav Items */}
      <div style={styles.navList}>
        {navItems.map((item, i) => {
          const isActive = activeView === item.id;
          const isDisruptionItem = item.id === 'disruption-center';
          const effectiveBadge = isDisruptionItem && activeDisruptions > 0
            ? String(activeDisruptions)
            : item.badge;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                ...styles.navItem,
                ...(isActive ? styles.navItemActive : {}),
                animationDelay: `${i * 50}ms`,
              }}
              title={item.label}
            >
              {/* Active indicator bar */}
              {isActive && <div style={styles.activeBar} />}

              {/* Icon */}
              <span style={{
                ...styles.navIcon,
                color: isActive ? '#1E40AF' : '#64748B',
              }}>
                {item.icon}
              </span>

              {/* Labels */}
              <div style={styles.navLabels}>
                <span style={{
                  ...styles.navLabel,
                  color: isActive ? '#0F172A' : '#334155',
                  fontWeight: isActive ? 700 : 600,
                }}>
                  {item.label}
                </span>
                <span style={styles.navSub}>{item.sub}</span>
              </div>

              {/* Badge */}
              {effectiveBadge && (
                <span style={{
                  ...styles.navBadge,
                  background: item.badgeType === 'danger' ? '#FEE2E2' : '#DBEAFE',
                  color: item.badgeType === 'danger' ? '#DC2626' : '#1E40AF',
                  borderColor: item.badgeType === 'danger' ? 'rgba(220,38,38,0.25)' : 'rgba(30,64,175,0.25)',
                }}>
                  {effectiveBadge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div style={styles.sidebarFooter}>
        <div style={styles.footerRow}>
          <Shield size={13} color="#64748B" />
          <span style={styles.footerText}>Data Classification: RESTRICTED</span>
        </div>
        <div style={styles.footerRow}>
          <Radio size={13} color="#16A34A" />
          <span style={{ ...styles.footerText, color: '#16A34A', fontWeight: 700 }}>
            Live Mock Engine Active
          </span>
        </div>
        <p style={styles.footerVersion}>MailFlow v1.0.0 · SIH 260461</p>
      </div>
    </nav>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: '252px',
    minHeight: '100vh',
    background: '#FFFFFF',
    borderRight: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    padding: '16px 0',
    boxShadow: '2px 0 8px rgba(15,23,42,0.04)',
  },

  statusPill: {
    margin: '0 14px 16px',
    padding: '10px 14px',
    background: '#F0FDF4',
    border: '1px solid #BBF7D0',
    borderRadius: '8px',
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    gridTemplateRows: 'auto auto',
    columnGap: '8px',
    rowGap: '2px',
    alignItems: 'center',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#16A34A',
    boxShadow: '0 0 0 3px rgba(22,163,74,0.2)',
    gridRow: 'span 2',
    animation: 'pulse-dot 1.4s infinite',
  },
  statusText: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#15803D',
  },
  statusTime: {
    fontSize: '10.5px',
    color: '#4ADE80',
    fontWeight: 500,
  },

  navList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: '0 10px',
    flex: 1,
  },

  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    textAlign: 'left',
    position: 'relative',
    transition: 'all 150ms ease',
    width: '100%',
    animation: 'fadeInUp 300ms ease forwards',
    opacity: 0,
  },
  navItemActive: {
    background: '#EFF6FF',
    border: '1px solid #BFDBFE',
  },

  activeBar: {
    position: 'absolute',
    left: 0,
    top: '20%',
    bottom: '20%',
    width: '3px',
    borderRadius: '0 2px 2px 0',
    background: 'linear-gradient(to bottom, #1E40AF, #3B82F6)',
  },

  navIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: 'transparent',
    flexShrink: 0,
    transition: 'all 150ms ease',
  },

  navLabels: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
    flex: 1,
    minWidth: 0,
  },
  navLabel: {
    fontSize: '13px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: 1.3,
  },
  navSub: {
    fontSize: '10.5px',
    color: '#94A3B8',
    fontWeight: 400,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  navBadge: {
    padding: '2px 7px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 800,
    letterSpacing: '0.04em',
    border: '1px solid',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },

  sidebarFooter: {
    margin: '16px 14px 0',
    padding: '14px',
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  footerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  footerText: {
    fontSize: '11px',
    color: '#64748B',
    fontWeight: 600,
  },
  footerVersion: {
    fontSize: '10px',
    color: '#CBD5E1',
    fontWeight: 500,
    marginTop: '2px',
  },
};
