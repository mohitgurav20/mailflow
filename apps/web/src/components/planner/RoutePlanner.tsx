import React, { useState } from 'react';
import { useMockStore } from '../../mock/mockStore';
import { MailClass, RouteOption } from '@mailflow/shared-types';
import { Zap, ShieldCheck, DollarSign, Clock, ArrowRight, CheckCircle2, Info, Building } from 'lucide-react';

export const RoutePlanner: React.FC = () => {
  const { hubs, computeRouteOptions, inductConsignment, setActiveView } = useMockStore();

  const [originHubId, setOriginHubId] = useState<string>('hub-delhi');
  const [destHubId, setDestHubId] = useState<string>('hub-mumbai');
  const [weightKg, setWeightKg] = useState<number>(3.5);
  const [mailClass, setMailClass] = useState<MailClass>('SPEED_POST');

  const [senderName, setSenderName] = useState<string>('Ministry of Science & Tech');
  const [receiverName, setReceiverName] = useState<string>('Director, TIFR Mumbai');

  const [computedOptions, setComputedOptions] = useState<RouteOption[] | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('opt-1');
  const [isInducted, setIsInducted] = useState<boolean>(false);
  const [inductedTrackingNum, setInductedTrackingNum] = useState<string>('');

  const handleComputeRoutes = (e: React.FormEvent) => {
    e.preventDefault();
    const options = computeRouteOptions(originHubId, destHubId, weightKg, mailClass);
    setComputedOptions(options);
    setSelectedRouteId(options[0]?.id || 'opt-1');
    setIsInducted(false);
  };

  const handleConfirmReservation = () => {
    if (!computedOptions) return;
    const chosenRoute = computedOptions.find((o) => o.id === selectedRouteId) || computedOptions[0];

    const originHub = hubs.find((h) => h.id === originHubId);
    const destHub = hubs.find((h) => h.id === destHubId);

    const newConsignment = inductConsignment(
      {
        senderName,
        senderCity: originHub?.circle || 'Origin',
        receiverName,
        receiverCity: destHub?.circle || 'Destination',
        originHubId,
        destHubId,
        weightKg,
        mailClass,
        currentHubId: originHubId,
        targetSlaHours: mailClass === 'SPEED_POST' ? 24 : 48,
        originalEta: '',
        currentEta: '',
        assignedRouteLegIds: chosenRoute.legs.map((l) => l.id)
      },
      chosenRoute
    );

    setIsInducted(true);
    setInductedTrackingNum(newConsignment.trackingNumber);
  };

  return (
    <div className="page-view">
      <div style={styles.topHeader}>
        <div>
          <h2 style={styles.title}>Dynamic Multimodal Route Planner & Optimizer</h2>
          <p style={styles.subtitle}>
            Time-expanded shortest path algorithm respecting live capacity constraints and EWMA reliability scores.
          </p>
        </div>
      </div>

      <div className="grid-3">
        {/* Induction Input Form */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={styles.formTitle}>Parcel Induction & Policy Inputs</h3>

          <form onSubmit={handleComputeRoutes} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={styles.label}>Origin National Sorting Hub</label>
              <select
                value={originHubId}
                onChange={(e) => setOriginHubId(e.target.value)}
                style={styles.input}
              >
                {hubs.map((hub) => (
                  <option key={hub.id} value={hub.id}>
                    {hub.name} ({hub.circle})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={styles.label}>Destination Sorting Hub</label>
              <select
                value={destHubId}
                onChange={(e) => setDestHubId(e.target.value)}
                style={styles.input}
              >
                {hubs.map((hub) => (
                  <option key={hub.id} value={hub.id}>
                    {hub.name} ({hub.circle})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={styles.label}>Parcel Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="1000"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>Mail Class Policy</label>
                <select
                  value={mailClass}
                  onChange={(e) => setMailClass(e.target.value as any)}
                  style={styles.input}
                >
                  <option value="SPEED_POST">Speed Post (24h Priority)</option>
                  <option value="REGISTERED_PARCEL">Registered Parcel</option>
                  <option value="BUSINESS_PARCEL">Business Bulk Parcel</option>
                </select>
              </div>
            </div>

            <div>
              <label style={styles.label}>Sender Info</label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>Addressee Info</label>
              <input
                type="text"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                style={styles.input}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
              <Zap size={15} />
              <span>Compute Optimal Multimodal Routes</span>
            </button>
          </form>
        </div>

        {/* Ranked Route Options Display */}
        <div className="glass-card" style={{ padding: '24px', gridColumn: 'span 2' }}>
          <h3 style={styles.formTitle}>3 Ranked Multimodal Options (Explainable Dijkstra)</h3>

          {!computedOptions ? (
            <div style={styles.emptyState}>
              <Info size={32} color="#D4AF37" />
              <p>Fill in the induction form and click <strong>Compute Optimal Multimodal Routes</strong> to evaluate options.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {computedOptions.map((opt) => {
                const isSelected = selectedRouteId === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedRouteId(opt.id)}
                    style={{
                      ...styles.routeCard,
                      borderColor: isSelected ? '#C41E3A' : 'rgba(255, 255, 255, 0.1)',
                      background: isSelected ? 'rgba(196, 30, 58, 0.08)' : 'rgba(30, 41, 59, 0.4)'
                    }}
                  >
                    <div style={styles.routeHeader}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={styles.rankBadge}>Rank #{opt.rank}</span>
                        <h4 style={styles.optTitle}>{opt.title}</h4>
                      </div>
                      <div style={styles.metricBadges}>
                        <span style={styles.metricChip}>
                          <Clock size={12} /> {opt.totalDurationHours}h SLA
                        </span>
                        <span style={styles.metricChip}>
                          <DollarSign size={12} /> ₹{opt.totalCost.toFixed(0)}
                        </span>
                        <span style={styles.metricChip}>
                          <ShieldCheck size={12} color="#10B981" /> {(opt.compositeReliability * 100).toFixed(0)}% EWMA
                        </span>
                      </div>
                    </div>

                    {/* Legs Journey Timeline */}
                    <div style={styles.legsRow}>
                      {opt.legs.map((leg, idx) => (
                        <React.Fragment key={leg.id}>
                          <div style={styles.legPill}>
                            <span className="badge" style={{ fontSize: '9px' }}>{leg.mode.replace('_', ' ')}</span>
                            <span style={styles.carrierName}>{leg.carrierName}</span>
                            <span style={styles.legCap}>Cap: {leg.availableCapacityKg}kg free</span>
                          </div>
                          {idx < opt.legs.length - 1 && <ArrowRight size={14} color="#94A3B8" />}
                        </React.Fragment>
                      ))}
                    </div>

                    {/* Rationale Explanation */}
                    <div style={styles.rationaleBox}>
                      <strong>Explainable Rationale:</strong> {opt.rationale}
                    </div>
                  </div>
                );
              })}

              {/* Handshake Booking Confirmation Bar */}
              <div style={styles.actionRow}>
                {isInducted ? (
                  <div style={styles.successBox}>
                    <CheckCircle2 size={20} color="#10B981" />
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, color: '#10B981' }}>
                        Handshake Confirmed! Parcel Inducted: {inductedTrackingNum}
                      </p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#94A3B8' }}>
                        Space reserved across chosen transport legs. Customer alert triggered.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveView('consignments')}
                      className="btn btn-secondary"
                      style={{ marginLeft: 'auto' }}
                    >
                      Track Parcel →
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleConfirmReservation}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px' }}
                  >
                    <CheckCircle2 size={16} />
                    <span>Confirm & Reserve Capacity Handshake for Selected Route</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  topHeader: {
    marginBottom: '20px'
  },
  title: {
    fontSize: '22px',
    color: '#FFFFFF',
    margin: '0 0 4px 0'
  },
  subtitle: {
    fontSize: '13px',
    color: '#94A3B8',
    margin: 0
  },
  formTitle: {
    fontSize: '15px',
    color: '#FFFFFF',
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    color: '#94A3B8',
    marginBottom: '4px',
    textTransform: 'uppercase'
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    background: 'rgba(15, 23, 42, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    color: '#FFFFFF',
    fontSize: '13px',
    outline: 'none'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    textAlign: 'center',
    color: '#94A3B8'
  },
  routeCard: {
    border: '1px solid',
    borderRadius: '8px',
    padding: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  routeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  rankBadge: {
    background: '#C41E3A',
    color: '#FFFFFF',
    fontSize: '10px',
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: '4px'
  },
  optTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#FFFFFF',
    margin: 0
  },
  metricBadges: {
    display: 'flex',
    gap: '8px'
  },
  metricChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#F8FAFC',
    background: 'rgba(255, 255, 255, 0.06)',
    padding: '4px 8px',
    borderRadius: '4px'
  },
  legsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
    marginBottom: '12px'
  },
  legPill: {
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(15, 23, 42, 0.7)',
    padding: '6px 10px',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.08)'
  },
  carrierName: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#F8FAFC'
  },
  legCap: {
    fontSize: '10px',
    color: '#10B981'
  },
  rationaleBox: {
    fontSize: '12px',
    color: '#CBD5E1',
    background: 'rgba(0, 0, 0, 0.25)',
    padding: '8px 12px',
    borderRadius: '6px',
    borderLeft: '3px solid #D4AF37'
  },
  actionRow: {
    marginTop: '16px'
  },
  successBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '8px',
    padding: '12px 16px'
  }
};
