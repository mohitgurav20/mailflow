import React, { useState } from 'react';
import { useMockStore } from '../../mock/mockStore';
import { Consignment } from '@mailflow/shared-types';
import { Search, Package, Clock, CheckCircle2, AlertTriangle, ExternalLink, ShieldCheck, Building2 } from 'lucide-react';

export const ConsignmentsView: React.FC = () => {
  const { consignments, hubs } = useMockStore();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedMailClass, setSelectedMailClass] = useState<string>('ALL');
  const [selectedConsignment, setSelectedConsignment] = useState<Consignment | null>(null);
  const [isPublicTrackMode, setIsPublicTrackMode] = useState<boolean>(false);

  const filtered = consignments.filter((c) => {
    const matchesSearch =
      c.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.receiverName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClass = selectedMailClass === 'ALL' || c.mailClass === selectedMailClass;

    return matchesSearch && matchesClass;
  });

  return (
    <div className="page-view">
      <div style={styles.topHeader}>
        <div>
          <h2 style={styles.title}>Consignments Register & Tracking Console</h2>
          <p style={styles.subtitle}>
            Live scan timelines, SLA countdowns, and proactive ETA updates for senders and addressees.
          </p>
        </div>

        <button
          onClick={() => setIsPublicTrackMode(!isPublicTrackMode)}
          className={`btn ${isPublicTrackMode ? 'btn-primary' : 'btn-secondary'}`}
        >
          <ExternalLink size={14} />
          <span>{isPublicTrackMode ? 'Switch to Operations Console' : 'View Citizen Public Tracking Portal'}</span>
        </button>
      </div>

      {!isPublicTrackMode ? (
        /* Internal Planner Table */
        <div className="glass-card" style={{ padding: '20px' }}>
          {/* Filter Bar */}
          <div style={styles.filterBar}>
            <div style={styles.searchWrapper}>
              <Search size={15} color="#94A3B8" />
              <input
                type="text"
                placeholder="Search by Tracking Number, Sender, or Addressee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>

            <select
              value={selectedMailClass}
              onChange={(e) => setSelectedMailClass(e.target.value)}
              style={styles.selectInput}
            >
              <option value="ALL">All Mail Classes</option>
              <option value="SPEED_POST">Speed Post</option>
              <option value="REGISTERED_PARCEL">Registered Parcel</option>
              <option value="BUSINESS_PARCEL">Business Parcel</option>
            </select>
          </div>

          {/* Table */}
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Tracking No.</th>
                <th style={styles.th}>Mail Class</th>
                <th style={styles.th}>Sender ➔ Receiver</th>
                <th style={styles.th}>Weight</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Current ETA</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const originHub = hubs.find((h) => h.id === c.originHubId);
                const destHub = hubs.find((h) => h.id === c.destHubId);

                return (
                  <tr key={c.id} style={styles.trRow}>
                    <td style={styles.tdTracking}>{c.trackingNumber}</td>
                    <td style={styles.td}>
                      <span className="badge badge-air">{c.mailClass.replace('_', ' ')}</span>
                    </td>
                    <td style={styles.td}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#FFFFFF' }}>
                        {c.senderName} ({originHub?.circle})
                      </div>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                        ➔ {c.receiverName} ({destHub?.circle})
                      </div>
                    </td>
                    <td style={styles.td}>{c.weightKg} kg</td>
                    <td style={styles.td}>
                      {c.isDelayedRisk ? (
                        <span className="badge badge-warning">At Risk / Rerouted</span>
                      ) : c.status === 'DELIVERED' ? (
                        <span className="badge badge-ok">Delivered</span>
                      ) : (
                        <span className="badge badge-road">In Transit</span>
                      )}
                    </td>
                    <td style={styles.tdEta}>
                      <Clock size={12} color="#38BDF8" />
                      <span>{c.currentEta}</span>
                    </td>
                    <td style={styles.td}>
                      <button
                        onClick={() => setSelectedConsignment(c)}
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '11px' }}
                      >
                        Scan History →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Public Citizen Tracking View */
        <div className="glass-card" style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <img src="/emblem.png" alt="State Emblem" style={{ height: '56px', width: 'auto', marginBottom: '8px' }} />
            <h3 style={{ fontSize: '19px', color: '#FFFFFF', margin: '4px 0 2px 0' }}>Department of Posts Citizen Portal</h3>
            <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>Official Multimodal Tracking & ETA Transparency Service</p>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
            <input
              type="text"
              placeholder="Enter Tracking Number (e.g. SP892019482IN)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ ...styles.searchInput, flex: 1, padding: '12px', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255, 255, 255, 0.15)' }}
            />
          </div>

          {filtered.length > 0 && (
            <div style={styles.citizenCard}>
              <div style={styles.citizenHeader}>
                <div>
                  <span className="badge badge-ok">{filtered[0].mailClass.replace('_', ' ')}</span>
                  <h4 style={{ fontSize: '18px', color: '#FFFFFF', margin: '6px 0 2px 0' }}>
                    {filtered[0].trackingNumber}
                  </h4>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', color: '#94A3B8' }}>Estimated Delivery</span>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: '#38BDF8', margin: 0 }}>
                    {filtered[0].currentEta}
                  </p>
                </div>
              </div>

              {filtered[0].isDelayedRisk && (
                <div style={styles.alertBanner}>
                  <AlertTriangle size={16} color="#F59E0B" />
                  <div>
                    <strong style={{ color: '#F59E0B' }}>Proactive Reroute Notice</strong>
                    <p style={{ margin: 0, fontSize: '11px', color: '#CBD5E1' }}>
                      {filtered[0].delayReason}
                    </p>
                  </div>
                </div>
              )}

              {/* Timeline Events */}
              <h4 style={{ color: '#FFFFFF', marginTop: '20px', marginBottom: '12px' }}>Official Journey Scans</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filtered[0].timeline.map((event) => (
                  <div key={event.id} style={styles.timelineItem}>
                    <div style={styles.timelineIcon}>
                      <CheckCircle2 size={16} color="#10B981" />
                    </div>
                    <div>
                      <h5 style={{ margin: 0, color: '#FFFFFF', fontSize: '13px' }}>{event.statusText}</h5>
                      <span style={{ fontSize: '11px', color: '#94A3B8' }}>{event.location} • {event.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Scan History */}
      {selectedConsignment && (
        <div style={styles.modalOverlay}>
          <div className="glass-card" style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, color: '#FFFFFF' }}>Scan Timeline: {selectedConsignment.trackingNumber}</h3>
              <button onClick={() => setSelectedConsignment(null)} className="btn btn-secondary" style={{ padding: '2px 8px' }}>
                ✕
              </button>
            </div>

            <div style={{ margin: '16px 0' }}>
              <p style={{ fontSize: '12px', color: '#94A3B8' }}>
                Mail Class: <strong>{selectedConsignment.mailClass}</strong> | Weight: <strong>{selectedConsignment.weightKg} kg</strong>
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {selectedConsignment.timeline.map((t) => (
                <div key={t.id} style={styles.modalTimelineItem}>
                  <div style={styles.logDot} />
                  <div>
                    <h5 style={{ margin: 0, color: '#F8FAFC', fontSize: '13px' }}>{t.statusText}</h5>
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>{t.location} | {t.timestamp}</span>
                  </div>
                </div>
              ))}
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
  filterBar: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px'
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
    background: 'rgba(15, 23, 42, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '6px',
    padding: '0 12px'
  },
  searchInput: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    color: '#FFFFFF',
    fontSize: '13px',
    outline: 'none',
    padding: '8px 0'
  },
  selectInput: {
    background: 'rgba(15, 23, 42, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    color: '#FFFFFF',
    borderRadius: '6px',
    padding: '8px 12px',
    outline: 'none'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },
  thRow: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
  },
  th: {
    padding: '12px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#94A3B8',
    textTransform: 'uppercase'
  },
  trRow: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
  },
  td: {
    padding: '12px',
    fontSize: '13px',
    color: '#F8FAFC'
  },
  tdTracking: {
    padding: '12px',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '13px',
    fontWeight: 700,
    color: '#FFFFFF'
  },
  tdEta: {
    padding: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#38BDF8'
  },
  citizenCard: {
    background: 'rgba(30, 41, 59, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '8px',
    padding: '24px'
  },
  citizenHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: '16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
  },
  alertBanner: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    background: 'rgba(245, 158, 11, 0.12)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    borderRadius: '6px',
    padding: '12px',
    marginTop: '16px'
  },
  timelineItem: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start'
  },
  timelineIcon: {
    marginTop: '2px'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    width: '500px',
    padding: '24px',
    borderRadius: '8px',
    animation: 'modalPopIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalTimelineItem: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start'
  },
  logDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: '#D4AF37',
    marginTop: '5px'
  }
};
