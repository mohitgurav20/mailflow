import React from 'react';
import { useMockStore } from '../../mock/mockStore';
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  Zap,
  TrendingUp,
  ArrowUpRight,
  Clock,
  Activity,
  ShieldCheck,
  Building2
} from 'lucide-react';

export const ControlTower: React.FC = () => {
  const {
    hubs,
    consignments,
    disruptions,
    setActiveView,
    auditLogs
  } = useMockStore();

  const totalConsignments = consignments.length;
  const inTransitCount = consignments.filter((c) => c.status === 'IN_TRANSIT').length;
  const delayedRiskCount = consignments.filter((c) => c.isDelayedRisk).length;
  const activeDisruptions = disruptions.filter((d) => d.active);

  const avgWorkload = Math.round(
    hubs.reduce((acc, h) => acc + (h.currentWorkloadKg / h.capacityPerDayKg) * 100, 0) / hubs.length
  );

  return (
    <div className="page-view">
      {/* Official Top Banner */}
      <div style={styles.topBanner}>
        <div>
          <div style={styles.bannerHeaderRow}>
            <span className="badge badge-ok">OPERATIONAL DECISION CONSOLE</span>
            <span style={styles.bannerGovTag}>Ministry of Communications • Department of Posts</span>
          </div>
          <h2 style={styles.bannerTitle}>Operations Control Tower</h2>
          <p style={styles.bannerSubtitle}>
            Real-time multimodal transmission, dynamic rerouting, and capacity optimization across India Post's 1,64,999 network nodes.
          </p>
        </div>
        <button
          onClick={() => setActiveView('route-planner')}
          className="btn btn-primary"
          style={{ padding: '12px 22px', fontSize: '14px' }}
        >
          <Zap size={16} />
          <span>Induct Consignment / Route Engine</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid-4" style={{ marginBottom: '32px', marginTop: '8px' }}>
        {/* KPI 1 */}
        <div className="kpi-card">
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>Active Consignments</span>
            <div style={{ ...styles.iconBadge, background: '#DBEAFE', color: '#1E40AF' }}>
              <Package size={18} />
            </div>
          </div>
          <div style={styles.kpiValueGroup}>
            <span style={styles.kpiValue}>{totalConsignments}</span>
            <span style={styles.kpiSub}>{inTransitCount} In Transit</span>
          </div>
          <div style={styles.kpiProgressTrack}>
            <div style={{ ...styles.kpiProgressBar, width: '78%', background: 'linear-gradient(90deg,#1E40AF,#3B82F6)' }} />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="kpi-card">
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>On-Time SLA Rate</span>
            <div style={{ ...styles.iconBadge, background: '#DCFCE7', color: '#16A34A' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={styles.kpiValueGroup}>
            <span style={styles.kpiValue}>94.2%</span>
            <span style={{ ...styles.kpiSub, color: '#16A34A', fontWeight: 700 }}><span className="stat-up">+2.4%</span> vs Fixed Plan</span>
          </div>
          <div style={styles.kpiProgressTrack}>
            <div style={{ ...styles.kpiProgressBar, width: '94.2%', background: 'linear-gradient(90deg,#16A34A,#4ADE80)' }} />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="kpi-card">
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>Active Disruptions</span>
            <div style={{ ...styles.iconBadge, background: '#FEE2E2', color: '#DC2626' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div style={styles.kpiValueGroup}>
            <span style={{ ...styles.kpiValue, color: activeDisruptions.length > 0 ? '#DC2626' : '#16A34A' }}>{activeDisruptions.length}</span>
            <span style={{ ...styles.kpiSub, color: '#DC2626', fontWeight: 700 }}><span className="stat-down">{delayedRiskCount} Parcels Impacted</span></span>
          </div>
          <div style={styles.kpiProgressTrack}>
            <div style={{ ...styles.kpiProgressBar, width: `${Math.min(activeDisruptions.length * 25, 100)}%`, background: 'linear-gradient(90deg,#DC2626,#F87171)' }} />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="kpi-card">
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>Network Hub Capacity</span>
            <div style={{ ...styles.iconBadge, background: '#FFF3E0', color: '#E65100' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={styles.kpiValueGroup}>
            <span style={styles.kpiValue}>{avgWorkload}%</span>
            <span style={styles.kpiSub}>Avg across 25 Hubs</span>
          </div>
          <div style={styles.kpiProgressTrack}>
            <div style={{ ...styles.kpiProgressBar, width: `${avgWorkload}%`, background: 'linear-gradient(90deg,#E65100,#FDBA74)' }} />
          </div>
        </div>
      </div>

      {/* Main Grid: Active Disruptions & Activity Feed */}
      <div className="grid-3" style={{ marginBottom: '32px' }}>
        {/* Active Disruptions Panel */}
        <div className="glass-card" style={{ padding: '28px', gridColumn: 'span 2' }}>
          <div style={styles.sectionHeader}>
            <div>
              <h3 style={styles.sectionTitle}>Live Disruption Command Panel</h3>
              <p style={styles.sectionSub}>Active alerts triggering automated blast-radius re-routing</p>
            </div>
            <button
              onClick={() => setActiveView('disruption-center')}
              className="btn btn-secondary"
            >
              <span>Launch Simulator</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {activeDisruptions.length === 0 ? (
              <p style={{ color: '#64748B', fontSize: '14px' }}>No active network disruptions.</p>
            ) : (
              activeDisruptions.map((disruption) => (
                <div key={disruption.id} style={styles.disruptionCard}>
                  <div style={styles.disruptionHeader}>
                    <span className="badge badge-danger">{disruption.severity}</span>
                    <span style={styles.disruptionTitle}>{disruption.title}</span>
                  </div>
                  <p style={styles.disruptionDesc}>{disruption.description}</p>
                  <div style={styles.disruptionMeta}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <Clock size={13} /> Started: {disruption.startTime}
                    </span>
                    <button
                      onClick={() => setActiveView('disruption-center')}
                      style={styles.reRouteLink}
                    >
                      Compute Blast Radius & Reroute →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <div style={styles.sectionHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="#E65100" />
              <h3 style={styles.sectionTitle}>Real-time Audit Log</h3>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {auditLogs.slice(0, 5).map((log) => (
              <div key={log.id} style={styles.logItem}>
                <div style={styles.logDot} />
                <div>
                  <p style={styles.logAction}>{log.action.replace('_', ' ')}</p>
                  <p style={styles.logDetails}>{log.details}</p>
                  <span style={styles.logTime}>{log.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Network Overview Summary Section */}
      <div className="glass-card" style={{ padding: '28px' }}>
        <h3 style={{ fontSize: '17px', color: '#0F172A', marginBottom: '16px' }}>Network Operational Overview & Circle Breakdown</h3>
        <div className="grid-3">
          <div style={styles.overviewBox}>
            <Building2 size={24} color="#0D47A1" />
            <div>
              <h4 style={{ margin: 0, fontSize: '15px', color: '#0F172A' }}>23 Postal Circles</h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>1,64,999 Post Offices (~90% Rural Coverage)</p>
            </div>
          </div>

          <div style={styles.overviewBox}>
            <ShieldCheck size={24} color="#2E7D32" />
            <div>
              <h4 style={{ margin: 0, fontSize: '15px', color: '#0F172A' }}>Explainable Dijkstra Engine</h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>Capacity-aware multimodal routing (Air, Rail, Road, Water)</p>
            </div>
          </div>

          <div style={styles.overviewBox}>
            <Zap size={24} color="#E65100" />
            <div>
              <h4 style={{ margin: 0, fontSize: '15px', color: '#0F172A' }}>EWMA Self-Learning</h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>Dynamic reliability scores updated from recorded transit times</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  topBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderLeft: '5px solid #1E40AF',
    borderRadius: '10px',
    padding: '24px 28px',
    boxShadow: '0 1px 3px rgba(15,23,42,0.07), 0 4px 8px rgba(15,23,42,0.04)'
  },
  bannerHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px'
  },
  bannerGovTag: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#0D47A1',
    textTransform: 'uppercase',
    letterSpacing: '0.04em'
  },
  bannerTitle: {
    fontSize: '24px',
    color: '#0F172A',
    margin: '0 0 4px 0'
  },
  bannerSubtitle: {
    fontSize: '14px',
    color: '#475569',
    margin: 0
  },
  kpiCard: {
    padding: '20px'
  },
  kpiHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  kpiLabel: {
    fontSize: '11.5px',
    fontWeight: 700,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.04em'
  },
  iconBadge: {
    width: '36px',
    height: '36px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  kpiValueGroup: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '10px',
    marginBottom: '12px'
  },
  kpiValue: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '30px',
    fontWeight: 800,
    color: '#0F172A',
    letterSpacing: '-0.03em',
    lineHeight: 1,
  },
  kpiSub: {
    fontSize: '12px',
    color: '#64748B'
  },
  kpiProgressTrack: {
    height: '5px',
    backgroundColor: '#F1F5F9',
    borderRadius: '3px',
    overflow: 'hidden'
  },
  kpiProgressBar: {
    height: '100%',
    borderRadius: '3px'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  sectionTitle: {
    fontSize: '16px',
    color: '#0F172A',
    margin: 0
  },
  sectionSub: {
    fontSize: '12.5px',
    color: '#64748B',
    margin: '2px 0 0 0'
  },
  disruptionCard: {
    background: '#FFF5F5',
    border: '1px solid #FECDD3',
    borderRadius: '6px',
    padding: '16px'
  },
  disruptionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px'
  },
  disruptionTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#991B1B'
  },
  disruptionDesc: {
    fontSize: '13px',
    color: '#334155',
    margin: '0 0 12px 0'
  },
  disruptionMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
    color: '#64748B'
  },
  reRouteLink: {
    background: 'transparent',
    border: 'none',
    color: '#E65100',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: '12.5px'
  },
  logItem: {
    display: 'flex',
    gap: '12px',
    paddingBottom: '12px',
    borderBottom: '1px solid #F1F5F9'
  },
  logDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#E65100',
    marginTop: '6px'
  },
  logAction: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#0F172A',
    margin: 0
  },
  logDetails: {
    fontSize: '12px',
    color: '#475569',
    margin: '2px 0'
  },
  logTime: {
    fontSize: '11px',
    color: '#94A3B8'
  },
  overviewBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '16px 20px'
  }
};
