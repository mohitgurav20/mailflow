import React, { useState } from 'react';
import { useMockStore } from '../../mock/mockStore';
import { BlastRadiusResult, DisruptionType, DisruptionSeverity } from '@mailflow/shared-types';
import { 
  AlertTriangle, Zap, CheckCircle2, RefreshCw, PlusCircle, ArrowRight, ShieldAlert, 
  Database, Radio, Wifi, Server, Activity, FileCheck, Truck, Plane, Train
} from 'lucide-react';

export const DisruptionCenter: React.FC = () => {
  const {
    disruptions,
    legs,
    toggleDisruption,
    addDisruption,
    calculateBlastRadius,
    executeBulkReroute
  } = useMockStore();

  const [activeTab, setActiveTab] = useState<'feed' | 'simulator' | 'api-guide'>('feed');
  const [selectedDisruptionId, setSelectedDisruptionId] = useState<string | null>(null);
  const [blastResult, setBlastResult] = useState<BlastRadiusResult | null>(null);
  const [isReroutedSuccess, setIsReroutedSuccess] = useState<boolean>(false);

  // New Disruption Form State
  const [simType, setSimType] = useState<DisruptionType>('AIR_CANCELLATION');
  const [simTitle, setSimTitle] = useState<string>('Severe Fog Warning — Northern Rail & Flight Grounding');
  const [simDesc, setSimDesc] = useState<string>('Visibility reduced to <50m. All commercial flights & RMS express trains delayed.');
  const [simLegId, setSimLegId] = useState<string>('leg-del-bom-air-1');
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
      affectedHubIds: ['hub-del'],
      severity: simSeverity,
      startTime: new Date().toISOString().replace('T', ' ').substring(0, 16),
      estimatedEndTime: '2026-08-16 18:00',
      active: true
    });

    setActiveTab('feed');
  };

  return (
    <div className="page-view" style={{ background: '#F8FAFC', padding: '24px', borderRadius: '12px' }}>
      {/* Header */}
      <div style={styles.topHeader}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#DC2626', padding: '8px', borderRadius: '8px', color: '#FFF' }}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 style={styles.title}>Disruption Command & Blast Radius Engine</h2>
              <p style={styles.subtitle}>
                Real-time incident impact calculation, automated Dijkstra re-routing, and live API integration architecture.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setActiveTab('feed')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'feed' ? '#0F172A' : '#E2E8F0',
              color: activeTab === 'feed' ? '#FFFFFF' : '#334155'
            }}
          >
            Active Incidents Feed ({disruptions.filter((d) => d.active).length})
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'simulator' ? '#0F172A' : '#E2E8F0',
              color: activeTab === 'simulator' ? '#FFFFFF' : '#334155'
            }}
          >
            What-If Scenario Simulator
          </button>
          <button
            onClick={() => setActiveTab('api-guide')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'api-guide' ? '#E65100' : '#E2E8F0',
              color: activeTab === 'api-guide' ? '#FFFFFF' : '#334155'
            }}
          >
            Real-Data API Connectors Guide
          </button>
        </div>
      </div>

      {activeTab === 'feed' && (
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px' }}>
          {/* Incident Feed List */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Live Incident Stream</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {disruptions.map((disruption) => (
                <div
                  key={disruption.id}
                  style={{
                    ...styles.incidentCard,
                    borderColor: disruption.active ? '#FCA5A5' : '#E2E8F0',
                    background: disruption.active ? '#FEF2F2' : '#F8FAFC'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={disruption.active ? styles.badgeActive : styles.badgeResolved}>
                      {disruption.active ? '● ACTIVE' : '✓ RESOLVED'}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#DC2626' }}>{disruption.severity}</span>
                  </div>

                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', margin: '4px 0' }}>{disruption.title}</h4>
                  <p style={{ fontSize: '12px', color: '#475569', margin: '0 0 12px 0', lineHeight: 1.4 }}>{disruption.description}</p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      onClick={() => toggleDisruption(disruption.id)}
                      style={styles.btnSecondary}
                    >
                      {disruption.active ? 'Mark Resolved' : 'Re-activate'}
                    </button>

                    {disruption.active && (
                      <button
                        onClick={() => handleComputeBlast(disruption.id)}
                        style={styles.btnBlast}
                      >
                        <Zap size={13} />
                        <span>Run Blast Radius</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Blast Radius Analysis & Re-route Proposal */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Blast-Radius Impact & Re-route Solver Analysis</h3>

            {!blastResult ? (
              <div style={styles.emptyState}>
                <AlertTriangle size={48} color="#DC2626" />
                <p style={{ marginTop: '14px', fontSize: '14px', color: '#334155', fontWeight: 600 }}>
                  Select an active incident on the left and click <strong>Run Blast Radius</strong> to calculate exact affected consignments and alternative routes.
                </p>
              </div>
            ) : (
              <div>
                <div style={styles.metricsGrid}>
                  <div style={styles.metricCard}>
                    <span style={styles.metricLabel}>Impacted Consignments</span>
                    <p style={styles.metricValueDanger}>{blastResult.totalConsignmentsAffected}</p>
                    <span style={styles.metricSub}>Articles requiring re-route</span>
                  </div>

                  <div style={styles.metricCard}>
                    <span style={styles.metricLabel}>Average Added Delay</span>
                    <p style={styles.metricValueWarning}>+{blastResult.avgAddedDelayHours.toFixed(1)} hrs</p>
                    <span style={styles.metricSub}>SLA impact window</span>
                  </div>

                  <div style={styles.metricCard}>
                    <span style={styles.metricLabel}>Disruption Scope</span>
                    <p style={styles.metricValue}>{blastResult.proposals.length} Re-routes</p>
                    <span style={styles.metricSub}>{blastResult.disruptionTitle}</span>
                  </div>
                </div>

                {isReroutedSuccess && (
                  <div style={styles.successBanner}>
                    <CheckCircle2 size={20} color="#15803D" />
                    <div>
                      <strong style={{ color: '#14532D', fontSize: '14px' }}>Bulk Re-route Handshake Executed Successfully!</strong>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#166534' }}>
                        {blastResult.totalConsignmentsAffected} consignments re-routed via alternative Dijkstra corridors. SMS notifications dispatched to citizens.
                      </p>
                    </div>
                  </div>
                )}

                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginTop: '24px', marginBottom: '12px' }}>
                  Alternative Multimodal Route Proposals
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {blastResult.proposals.map((prop, idx) => (
                    <div key={idx} style={styles.proposalCard}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#1E40AF', background: '#DBEAFE', padding: '3px 10px', borderRadius: '4px' }}>
                          Parcel: {prop.trackingNumber} ({prop.mailClass.replace('_', ' ')})
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#0284C7' }}>
                          Est. Delta Delay: +{prop.deltaEtaHours || 4}h
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', margin: '10px 0', flexWrap: 'wrap' }}>
                        {prop.newRouteOption?.legs?.map((leg) => (
                          <div key={leg.id || leg.mode} style={styles.legPill}>
                            <span>{leg.mode.includes('AIR') ? '✈️ Air Cargo' : leg.mode.includes('RAIL') ? '🚆 RMS Express' : '🚛 MMS Truck'}</span>
                          </div>
                        ))}
                      </div>

                      <p style={{ fontSize: '12px', color: '#334155', margin: 0, background: '#F8FAFC', padding: '10px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                        <strong>Rationale:</strong> {prop.newRouteOption?.rationale || 'Detour calculated via high-reliability RMS Rail corridor.'}
                      </p>
                    </div>
                  ))}
                </div>

                {!isReroutedSuccess && (
                  <button onClick={handleExecuteBulk} style={styles.btnExecuteBulk}>
                    <RefreshCw size={16} />
                    <span>Execute 1-Click Bulk Re-route for All {blastResult.totalConsignmentsAffected} Consignments</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'simulator' && (
        <div style={{ maxWidth: '750px', margin: '0 auto', background: '#FFFFFF', padding: '28px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
            What-If Disruption Scenario Injector
          </h3>
          <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px' }}>
            Inject artificial weather, flight cancellation, or highway disruption scenarios to test MailFlow resilience.
          </p>

          <form onSubmit={handleCreateSimulation} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={styles.label}>Disruption Category</label>
              <select value={simType} onChange={(e) => setSimType(e.target.value as any)} style={styles.select}>
                <option value="AIR_CANCELLATION">Air Cargo Flight Grounding</option>
                <option value="RAIL_DELAY">RMS Rail Express Delay / Fog</option>
                <option value="ROAD_BLOCK">MMS Highway Landslide / Blockage</option>
                <option value="WEATHER_ALERT">Severe Weather / Cyclone Alert</option>
              </select>
            </div>

            <div>
              <label style={styles.label}>Scenario Title</label>
              <input type="text" value={simTitle} onChange={(e) => setSimTitle(e.target.value)} style={styles.input} />
            </div>

            <div>
              <label style={styles.label}>Detailed Operational Context</label>
              <textarea value={simDesc} onChange={(e) => setSimDesc(e.target.value)} style={{ ...styles.input, height: '80px' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={styles.label}>Impacted Corridor Leg</label>
                <select value={simLegId} onChange={(e) => setSimLegId(e.target.value)} style={styles.select}>
                  {legs.map((leg) => (
                    <option key={leg.id} value={leg.id}>
                      {leg.id} ({leg.mode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={styles.label}>Severity Level</label>
                <select value={simSeverity} onChange={(e) => setSimSeverity(e.target.value as any)} style={styles.select}>
                  <option value="LOW">Low</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>

            <button type="submit" style={styles.btnExecuteBulk}>
              <PlusCircle size={16} />
              <span>Inject Scenario into Live Command Stream</span>
            </button>
          </form>
        </div>
      )}

      {activeTab === 'api-guide' && (
        <div style={{ maxWidth: '850px', margin: '0 auto', background: '#FFFFFF', padding: '32px', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ display: 'inline-flex', background: '#FFF3E0', padding: '12px', borderRadius: '12px', color: '#E65100', marginBottom: '10px' }}>
              <Server size={32} />
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
              Real-World Data Connectors & Integration Guide
            </h3>
            <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
              To connect MailFlow to live production infrastructure at India Post, replace mock engine data with these official REST/IoT APIs.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={styles.apiCard}>
              <Database size={20} color="#1E40AF" />
              <div>
                <h4 style={styles.apiTitle}>1. India Post IPPB Pincode DB</h4>
                <p style={styles.apiDesc}>Connects to central India Post Pincode & NSH/ICH directory DB for 1.64 lakh post office GPS locations.</p>
                <code style={styles.apiEndpoint}>GET https://api.ippb.gov.in/v1/pincodes/lookup</code>
              </div>
            </div>

            <div style={styles.apiCard}>
              <Train size={20} color="#D97706" />
              <div>
                <h4 style={styles.apiTitle}>2. Indian Railways FOIS / RMS API</h4>
                <p style={styles.apiDesc}>Real-time train status, RMS wagon capacity, and delay tracking via Center for Railway Information Systems (CRIS).</p>
                <code style={styles.apiEndpoint}>GET https://fois.indianrail.gov.in/api/v2/rms-wagons</code>
              </div>
            </div>

            <div style={styles.apiCard}>
              <Plane size={20} color="#0284C7" />
              <div>
                <h4 style={styles.apiTitle}>3. Air Cargo Flight Telemetry</h4>
                <p style={styles.apiDesc}>Live commercial flight schedules & cargo space availability via FlightRadar24 API & Air India Cargo.</p>
                <code style={styles.apiEndpoint}>GET https://api.flightradar24.com/v1/cargo-schedules</code>
              </div>
            </div>

            <div style={styles.apiCard}>
              <Truck size={20} color="#16A34A" />
              <div>
                <h4 style={styles.apiTitle}>4. MMS Vehicle FASTag & GPS API</h4>
                <p style={styles.apiDesc}>IoT GPS tracking on Mail Motor Service (MMS) trucks & NHAI FASTag toll station timestamps.</p>
                <code style={styles.apiEndpoint}>GET https://fastag.nhai.gov.in/api/v1/mms-fleet</code>
              </div>
            </div>
          </div>
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
    fontWeight: 800,
    color: '#0F172A',
    margin: 0
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748B',
    margin: '2px 0 0 0'
  },
  card: {
    background: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)'
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#0F172A',
    marginBottom: '16px'
  },
  incidentCard: {
    borderRadius: '10px',
    border: '1px solid',
    padding: '14px'
  },
  badgeActive: {
    background: '#FEE2E2',
    color: '#DC2626',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 800
  },
  badgeResolved: {
    background: '#DCFCE7',
    color: '#16A34A',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 800
  },
  severityTag: {
    fontSize: '11px',
    fontWeight: 800,
    color: '#DC2626'
  },
  btnSecondary: {
    background: '#F1F5F9',
    border: '1px solid #CBD5E1',
    color: '#334155',
    padding: '6px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  btnBlast: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: '#DC2626',
    color: '#FFFFFF',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer'
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px 24px',
    background: '#F8FAFC',
    borderRadius: '10px',
    border: '1px dashed #CBD5E1'
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '14px',
    marginBottom: '20px'
  },
  metricCard: {
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '14px'
  },
  metricLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#64748B',
    textTransform: 'uppercase'
  },
  metricValueDanger: {
    fontSize: '24px',
    fontWeight: 800,
    color: '#DC2626',
    margin: '4px 0 2px 0'
  },
  metricValueWarning: {
    fontSize: '24px',
    fontWeight: 800,
    color: '#D97706',
    margin: '4px 0 2px 0'
  },
  metricValue: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#0F172A',
    margin: '4px 0 2px 0'
  },
  metricSub: {
    fontSize: '11px',
    color: '#64748B'
  },
  successBanner: {
    display: 'flex',
    gap: '12px',
    background: '#DCFCE7',
    border: '1px solid #86EFAC',
    borderRadius: '8px',
    padding: '14px',
    marginBottom: '20px'
  },
  proposalCard: {
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '14px'
  },
  legPill: {
    background: '#F1F5F9',
    color: '#0F172A',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 600
  },
  btnExecuteBulk: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    background: '#16A34A',
    color: '#FFFFFF',
    padding: '14px',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '14px',
    border: 'none',
    cursor: 'pointer',
    marginTop: '20px',
    boxShadow: '0 4px 10px rgba(22, 163, 74, 0.25)'
  },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#475569',
    display: 'block',
    marginBottom: '6px'
  },
  input: {
    width: '100%',
    background: '#F8FAFC',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    padding: '10px',
    fontSize: '13px',
    color: '#0F172A',
    fontWeight: 600,
    outline: 'none'
  },
  select: {
    width: '100%',
    background: '#F8FAFC',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    padding: '10px',
    fontSize: '13px',
    color: '#0F172A',
    fontWeight: 600,
    outline: 'none'
  },
  apiCard: {
    display: 'flex',
    gap: '14px',
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '16px'
  },
  apiTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#0F172A',
    margin: '0 0 4px 0'
  },
  apiDesc: {
    fontSize: '12px',
    color: '#475569',
    margin: '0 0 8px 0',
    lineHeight: 1.4
  },
  apiEndpoint: {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '11px',
    background: '#EFF6FF',
    color: '#1E40AF',
    padding: '4px 8px',
    borderRadius: '4px'
  }
};
