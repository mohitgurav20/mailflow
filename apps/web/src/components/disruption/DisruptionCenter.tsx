import React, { useState } from 'react';
import { useMockStore } from '../../mock/mockStore';
import { BlastRadiusResult, DisruptionType, DisruptionSeverity } from '@mailflow/shared-types';
import { AlertTriangle, Zap, CheckCircle2, RefreshCw, PlusCircle, ArrowRight, ShieldAlert } from 'lucide-react';

export const DisruptionCenter: React.FC = () => {
  const {
    disruptions,
    legs,
    toggleDisruption,
    addDisruption,
    calculateBlastRadius,
    executeBulkReroute
  } = useMockStore();

  const [activeTab, setActiveTab] = useState<'feed' | 'simulator'>('feed');
  const [selectedDisruptionId, setSelectedDisruptionId] = useState<string | null>(null);
  const [blastResult, setBlastResult] = useState<BlastRadiusResult | null>(null);
  const [isReroutedSuccess, setIsReroutedSuccess] = useState<boolean>(false);

  // New Disruption Form State
  const [simType, setSimType] = useState<DisruptionType>('AIR_CANCELLATION');
  const [simTitle, setSimTitle] = useState<string>('Severe Fog Warning — Northern Rail & Flight Grounding');
  const [simDesc, setSimDesc] = useState<string>('Visibility reduced to <50m. All commercial flights & RMS express trains delayed.');
  const [simLegId, setSimLegId] = useState<string>('leg-air-del-bom');
  const [simSeverity, setSimSeverity] = useState<DisruptionSeverity>('CRITICAL');

  const handleComputeBlast = (disruptionId: string) => {
    setSelectedDisruptionId(disruptionId);
    const res = calculateBlastRadius(disruptionId);
    setBlastResult(res);
    setIsReroutedSuccess(false);
  };

  const handleExecuteBulk = () => {
    if (!blastResult) return;
    executeBulkReroute(blastResult);
    setIsReroutedSuccess(true);
  };

  const handleCreateSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    addDisruption({
      type: simType,
      title: simTitle,
      description: simDesc,
      affectedLegIds: [simLegId],
      affectedHubIds: ['hub-delhi'],
      severity: simSeverity,
      startTime: new Date().toISOString().replace('T', ' ').substring(0, 16),
      estimatedEndTime: '2026-08-16 18:00',
      active: true
    });

    setActiveTab('feed');
  };

  return (
    <div className="page-view">
      <div style={styles.topHeader}>
        <div>
          <h2 style={styles.title}>Disruption Management & What-If Simulator</h2>
          <p style={styles.subtitle}>
            Real-time blast-radius calculation and automated dynamic re-routing when transport legs fail.
          </p>
        </div>

        <div style={styles.tabButtons}>
          <button
            onClick={() => setActiveTab('feed')}
            className={`btn ${activeTab === 'feed' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <AlertTriangle size={14} />
            <span>Active Incidents Feed ({disruptions.filter((d) => d.active).length})</span>
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`btn ${activeTab === 'simulator' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <PlusCircle size={14} />
            <span>What-If Scenario Simulator</span>
          </button>
        </div>
      </div>

      {activeTab === 'feed' ? (
        <div className="grid-3">
          {/* Incident Feed List */}
          <div className="glass-card" style={{ padding: '24px', gridColumn: 'span 1' }}>
            <h3 style={styles.cardTitle}>Live Network Incidents</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {disruptions.map((disruption) => (
                <div
                  key={disruption.id}
                  style={{
                    ...styles.incidentCard,
                    borderColor: disruption.active ? '#FECDD3' : '#E2E8F0',
                    background: disruption.active ? '#FFF5F5' : '#F8FAFC',
                    opacity: disruption.active ? 1 : 0.7
                  }}
                >
                  <div style={styles.incidentHeader}>
                    <span className={`badge ${disruption.active ? 'badge-danger' : 'badge-ok'}`}>
                      {disruption.active ? 'ACTIVE' : 'RESOLVED'}
                    </span>
                    <span style={styles.severityTag}>{disruption.severity}</span>
                  </div>

                  <h4 style={styles.incidentTitle}>{disruption.title}</h4>
                  <p style={styles.incidentDesc}>{disruption.description}</p>

                  <div style={styles.incidentActions}>
                    <button
                      onClick={() => toggleDisruption(disruption.id)}
                      className="btn btn-secondary"
                      style={{ padding: '5px 10px', fontSize: '11.5px' }}
                    >
                      {disruption.active ? 'Mark Resolved' : 'Re-activate'}
                    </button>

                    {disruption.active && (
                      <button
                        onClick={() => handleComputeBlast(disruption.id)}
                        className="btn btn-primary"
                        style={{ padding: '5px 12px', fontSize: '11.5px' }}
                      >
                        <Zap size={13} />
                        <span>Blast Radius</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Blast Radius Analysis & Re-route Proposal */}
          <div className="glass-card" style={{ padding: '28px', gridColumn: 'span 2' }}>
            <h3 style={styles.cardTitle}>Blast-Radius Impact & Re-route Analysis</h3>

            {!blastResult ? (
              <div style={styles.emptyState}>
                <AlertTriangle size={40} color="#DC2626" />
                <p style={{ marginTop: '12px', fontSize: '14px', color: '#475569' }}>
                  Select any active disruption on the left and click <strong>Blast Radius</strong> to run dynamic re-route calculation.
                </p>
              </div>
            ) : (
              <div>
                {/* Summary Metrics */}
                <div style={styles.metricsBox}>
                  <div>
                    <span style={styles.metricLabel}>Target Incident</span>
                    <h4 style={{ margin: 0, color: '#0F172A', fontSize: '15px' }}>{blastResult.disruptionTitle}</h4>
                  </div>
                  <div>
                    <span style={styles.metricLabel}>Parcels Impacted</span>
                    <span style={styles.metricValRed}>{blastResult.totalConsignmentsAffected}</span>
                  </div>
                  <div>
                    <span style={styles.metricLabel}>Est. Added Delay</span>
                    <span style={styles.metricValYellow}>+{blastResult.avgAddedDelayHours} hrs</span>
                  </div>
                </div>

                {/* Reroute Proposals Table */}
                <h4 style={{ color: '#0F172A', marginBottom: '14px', fontSize: '15px' }}>
                  Proposed Alternative Routes ({blastResult.proposals.length})
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                  {blastResult.proposals.map((prop) => (
                    <div key={prop.consignmentId} style={styles.proposalCard}>
                      <div style={styles.proposalHeader}>
                        <span style={styles.trackingNum}>{prop.trackingNumber}</span>
                        <span className="badge badge-air">{prop.mailClass.replace('_', ' ')}</span>
                        <span style={{ fontSize: '12.5px', color: '#16A34A', fontWeight: 700, marginLeft: 'auto' }}>
                          ΔETA: +{prop.deltaEtaHours}h
                        </span>
                      </div>

                      <p style={styles.propSub}>
                        Current Location: {prop.currentLocation} ➔ Destination: {prop.destination}
                      </p>

                      <div style={styles.newRouteBox}>
                        <span style={{ color: '#0D47A1', fontWeight: 700 }}>Proposed Reroute:</span>{' '}
                        {prop.newRouteOption.title} ({prop.newRouteOption.legs.map((l) => l.carrierName).join(' -> ')})
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bulk Action Bar */}
                {isReroutedSuccess ? (
                  <div style={styles.successBar}>
                    <CheckCircle2 size={20} color="#16A34A" />
                    <span>
                      Bulk Re-route Executed Successfully! Customer SMS/Email notifications triggered.
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={handleExecuteBulk}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '14px', fontSize: '14px' }}
                  >
                    <RefreshCw size={16} />
                    <span>Approve & Execute Bulk Re-route ({blastResult.proposals.length} Parcels)</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* What-If Simulator Drawer */
        <div className="glass-card" style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
          <h3 style={styles.cardTitle}>Simulate Hypothetical Disruption Scenario</h3>
          <p style={{ ...styles.subtitle, marginBottom: '24px' }}>
            Inject artificial flight cancellations, rail delays, or road blockages to test how the MailFlow Dijkstra engine recovers.
          </p>

          <form onSubmit={handleCreateSimulation} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={styles.label}>Disruption Category</label>
              <select
                value={simType}
                onChange={(e) => setSimType(e.target.value as any)}
                style={styles.input}
              >
                <option value="AIR_CANCELLATION">Air Cargo Cancellation / Grounding</option>
                <option value="RAIL_DELAY">Northern Rail Signal / Fog Delay</option>
                <option value="ROAD_BLOCK">Highway Landslide / Road Blockage</option>
                <option value="WEATHER_ALERT">Monsoonal Weather Alert</option>
              </select>
            </div>

            <div>
              <label style={styles.label}>Scenario Title</label>
              <input
                type="text"
                value={simTitle}
                onChange={(e) => setSimTitle(e.target.value)}
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>Detailed Description</label>
              <textarea
                value={simDesc}
                onChange={(e) => setSimDesc(e.target.value)}
                rows={3}
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>Affected Transport Leg</label>
              <select
                value={simLegId}
                onChange={(e) => setSimLegId(e.target.value)}
                style={styles.input}
              >
                {legs.map((leg) => (
                  <option key={leg.id} value={leg.id}>
                    {leg.carrierName} ({leg.code})
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '12px', padding: '12px' }}>
              <Zap size={16} />
              <span>Inject Scenario into Live Engine</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  topHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },
  title: {
    fontSize: '22px',
    color: '#0F172A',
    margin: '0 0 4px 0'
  },
  subtitle: {
    fontSize: '13.5px',
    color: '#475569',
    margin: 0
  },
  tabButtons: {
    display: 'flex',
    gap: '10px'
  },
  cardTitle: {
    fontSize: '16px',
    color: '#0F172A',
    marginBottom: '18px'
  },
  incidentCard: {
    border: '1px solid',
    borderRadius: '6px',
    padding: '16px'
  },
  incidentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  severityTag: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#DC2626'
  },
  incidentTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#0F172A',
    margin: '0 0 4px 0'
  },
  incidentDesc: {
    fontSize: '12.5px',
    color: '#475569',
    margin: '0 0 12px 0'
  },
  incidentActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    textAlign: 'center'
  },
  metricsBox: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr',
    gap: '18px',
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '18px',
    marginBottom: '24px'
  },
  metricLabel: {
    fontSize: '11.5px',
    color: '#64748B',
    display: 'block',
    marginBottom: '4px',
    fontWeight: 600
  },
  metricValRed: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#DC2626'
  },
  metricValYellow: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#D97706'
  },
  proposalCard: {
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '14px 18px'
  },
  proposalHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '6px'
  },
  trackingNum: {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '14px',
    fontWeight: 700,
    color: '#0F172A'
  },
  propSub: {
    fontSize: '12px',
    color: '#475569',
    margin: '0 0 8px 0'
  },
  newRouteBox: {
    fontSize: '12.5px',
    color: '#0F172A',
    background: '#FFFFFF',
    border: '1px solid #CBD5E1',
    padding: '8px 12px',
    borderRadius: '6px'
  },
  successBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: '#DCFCE7',
    border: '1px solid #86EFAC',
    color: '#15803D',
    fontWeight: 700,
    fontSize: '14px',
    borderRadius: '8px',
    padding: '14px 20px'
  },
  label: {
    display: 'block',
    fontSize: '11.5px',
    fontWeight: 700,
    color: '#64748B',
    marginBottom: '4px',
    textTransform: 'uppercase'
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '6px',
    background: '#FFFFFF',
    border: '1px solid #CBD5E1',
    color: '#0F172A',
    fontSize: '13.5px',
    outline: 'none'
  }
};
