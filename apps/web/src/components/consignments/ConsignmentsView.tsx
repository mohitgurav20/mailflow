import React, { useState } from 'react';
import { useMockStore } from '../../mock/mockStore';
import { Consignment } from '@mailflow/shared-types';
import { 
  Search, Package, Clock, CheckCircle2, AlertTriangle, ExternalLink, 
  MapPin, User, Building2, Calendar, FileText, ArrowRight, Truck, Plane, Train
} from 'lucide-react';

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
      c.receiverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.senderCity && c.senderCity.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.receiverCity && c.receiverCity.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesClass = selectedMailClass === 'ALL' || c.mailClass === selectedMailClass;

    return matchesSearch && matchesClass;
  });

  return (
    <div className="page-view" style={{ background: '#F8FAFC', padding: '24px', borderRadius: '12px' }}>
      {/* Top Header */}
      <div style={styles.topHeader}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#E65100', padding: '8px', borderRadius: '8px', color: '#FFF' }}>
              <Package size={20} />
            </div>
            <div>
              <h2 style={styles.title}>Consignments Register & Scan History Console</h2>
              <p style={styles.subtitle}>
                Official India Post consignment tracking, scan timelines, SLA countdowns, and address audit log.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsPublicTrackMode(!isPublicTrackMode)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: isPublicTrackMode ? '#0F172A' : '#E65100',
            color: '#FFFFFF',
            padding: '10px 18px',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '13px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            transition: 'all 0.2s'
          }}
        >
          <ExternalLink size={15} />
          <span>{isPublicTrackMode ? '← Back to Internal Operations Register' : 'View Citizen Public Tracking Portal'}</span>
        </button>
      </div>

      {!isPublicTrackMode ? (
        /* Internal Consignment Register Table */
        <div style={styles.mainCard}>
          {/* Filter Bar */}
          <div style={styles.filterBar}>
            <div style={styles.searchWrapper}>
              <Search size={16} color="#64748B" />
              <input
                type="text"
                placeholder="Search by Tracking No. (SP...), Sender Name, Addressee, Village, or City..."
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
              <option value="SPEED_POST">Speed Post (Priority 24h)</option>
              <option value="REGISTERED_PARCEL">Registered Parcel</option>
              <option value="BUSINESS_PARCEL">Business Bulk Parcel</option>
            </select>
          </div>

          {/* Consignments Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Tracking No.</th>
                  <th style={styles.th}>Mail Class</th>
                  <th style={styles.th}>Sender (Origin Address)</th>
                  <th style={styles.th}>Receiver (Destination)</th>
                  <th style={styles.th}>Weight</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Est. Delivery</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const originHub = hubs.find((h) => h.id === c.originHubId);
                  const destHub = hubs.find((h) => h.id === c.destHubId);

                  return (
                    <tr key={c.id} style={styles.trRow}>
                      <td style={styles.tdTracking}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Package size={14} color="#1E40AF" />
                          <span>{c.trackingNumber}</span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.badgeMailClass}>
                          {c.mailClass.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '13px' }}>
                          {c.senderName}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <MapPin size={10} color="#E65100" />
                          <span>{c.senderCity || originHub?.circle || 'Origin Postal Zone'}</span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '13px' }}>
                          {c.receiverName}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <MapPin size={10} color="#16A34A" />
                          <span>{c.receiverCity || destHub?.circle || 'Destination Zone'}</span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={{ fontWeight: 600, color: '#334155' }}>{c.weightKg} kg</span>
                      </td>
                      <td style={styles.td}>
                        {c.isDelayedRisk ? (
                          <span style={styles.badgeWarning}>⚠️ Delay Risk / Rerouted</span>
                        ) : c.status === 'DELIVERED' ? (
                          <span style={styles.badgeSuccess}>✓ Delivered</span>
                        ) : (
                          <span style={styles.badgeTransit}>⚡ In Transit</span>
                        )}
                      </td>
                      <td style={styles.tdEta}>
                        <Clock size={13} color="#0284C7" />
                        <span>{c.currentEta || 'Calculating...'}</span>
                      </td>
                      <td style={styles.td}>
                        <button
                          onClick={() => setSelectedConsignment(c)}
                          style={styles.btnAction}
                        >
                          View Full History →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Public Citizen Portal Mode */
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          <div style={styles.citizenBox}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <img src="/emblem.png" alt="Emblem of India" style={{ height: '60px', marginBottom: '12px' }} />
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
                Department of Posts — Citizen Parcel Tracking Portal
              </h3>
              <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
                Enter your 13-digit Speed Post or Registered Parcel tracking code to view live GPS scan history.
              </p>
            </div>

            {/* Search Input */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '28px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={18} color="#64748B" style={{ position: 'absolute', left: '16px', top: '14px' }} />
                <input
                  type="text"
                  placeholder="Enter Tracking Number (e.g. SP269904420IN)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={styles.citizenInput}
                />
              </div>
            </div>

            {filtered.length > 0 ? (
              <div style={styles.citizenCard}>
                <div style={styles.citizenHeader}>
                  <div>
                    <span style={styles.badgeMailClass}>{filtered[0].mailClass.replace('_', ' ')}</span>
                    <h4 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: '8px 0 4px 0', fontFamily: 'JetBrains Mono, monospace' }}>
                      {filtered[0].trackingNumber}
                    </h4>
                    <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
                      From: <strong>{filtered[0].senderName}</strong> ({filtered[0].senderCity || 'Origin'}) ➔ To: <strong>{filtered[0].receiverName}</strong> ({filtered[0].receiverCity || 'Destination'})
                    </p>
                  </div>

                  <div style={{ textAlign: 'right', background: '#EFF6FF', padding: '12px 16px', borderRadius: '10px', border: '1px solid #BFDBFE' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#1E40AF', textTransform: 'uppercase' }}>Estimated Delivery</span>
                    <p style={{ fontSize: '16px', fontWeight: 800, color: '#1E40AF', margin: '2px 0 0 0' }}>
                      {filtered[0].currentEta}
                    </p>
                  </div>
                </div>

                {filtered[0].isDelayedRisk && (
                  <div style={styles.citizenAlert}>
                    <AlertTriangle size={20} color="#D97706" />
                    <div>
                      <strong style={{ color: '#92400E', fontSize: '13px' }}>Proactive Route Reroute Notice</strong>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#B45309' }}>
                        {filtered[0].delayReason || 'Corridor disruption detected. MailFlow Dijkstra Engine has automatically rerouted this consignment to maintain SLA target.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <h4 style={{ fontSize: '15px', color: '#0F172A', marginTop: '24px', marginBottom: '16px', fontWeight: 700 }}>
                  📍 Official Scan Journey & GPS Checkpoints
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '8px' }}>
                  {filtered[0].timeline.map((event, idx) => (
                    <div key={event.id} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: idx === 0 ? '#DCFCE7' : '#F1F5F9',
                        border: idx === 0 ? '2px solid #16A34A' : '2px solid #94A3B8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <CheckCircle2 size={16} color={idx === 0 ? '#16A34A' : '#64748B'} />
                      </div>
                      <div style={{ background: '#F8FAFC', padding: '14px 18px', borderRadius: '10px', border: '1px solid #E2E8F0', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h5 style={{ margin: 0, color: '#0F172A', fontSize: '14px', fontWeight: 700 }}>{event.statusText}</h5>
                          <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>{event.timestamp}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={12} color="#E65100" />
                          <span>Facility: <strong>{event.location}</strong></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', background: '#F8FAFC', borderRadius: '12px', border: '1px border #E2E8F0' }}>
                <Package size={36} color="#94A3B8" />
                <p style={{ color: '#64748B', fontSize: '14px', marginTop: '8px' }}>No consignment found matching tracking search.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* High-Contrast Readable Modal for Scan History */}
      {selectedConsignment && (
        <div style={styles.modalOverlay} onClick={() => setSelectedConsignment(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#E65100', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  India Post Scan History Audit
                </span>
                <h3 style={{ margin: '4px 0 0 0', color: '#0F172A', fontSize: '18px', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>
                  {selectedConsignment.trackingNumber}
                </h3>
              </div>
              <button onClick={() => setSelectedConsignment(null)} style={styles.btnClose}>
                ✕
              </button>
            </div>

            {/* Consignment Sender / Addressee Breakdown */}
            <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0', margin: '16px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Sender Details</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>{selectedConsignment.senderName}</div>
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>📍 {selectedConsignment.senderCity || 'Origin Sub-Post Office'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Addressee Details</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>{selectedConsignment.receiverName}</div>
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>📍 {selectedConsignment.receiverCity || 'Destination Delivery PO'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#334155', marginBottom: '16px', background: '#FEF3C7', padding: '10px 14px', borderRadius: '8px', border: '1px solid #FCD34D' }}>
              <span>Weight: <strong>{selectedConsignment.weightKg} kg</strong></span>
              <span>•</span>
              <span>Mail Policy: <strong>{selectedConsignment.mailClass.replace('_', ' ')}</strong></span>
              <span>•</span>
              <span>ETA: <strong>{selectedConsignment.currentEta}</strong></span>
            </div>

            {/* Scan Journey Timeline */}
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '12px' }}>
              Detailed Scan Timeline & GPS Checkpoints
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
              {selectedConsignment.timeline.map((t) => (
                <div key={t.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', background: '#FFFFFF', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E65100', marginTop: '6px', flexShrink: 0 }} />
                  <div>
                    <h5 style={{ margin: 0, color: '#0F172A', fontSize: '13px', fontWeight: 700 }}>{t.statusText}</h5>
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                      📍 Location: <strong style={{ color: '#334155' }}>{t.location}</strong> | ⏰ Timestamp: <strong style={{ color: '#334155' }}>{t.timestamp}</strong>
                    </div>
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
  mainCard: {
    background: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)'
  },
  filterBar: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px'
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flex: 1,
    background: '#F8FAFC',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    padding: '0 14px'
  },
  searchInput: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    color: '#0F172A',
    fontSize: '13px',
    outline: 'none',
    padding: '10px 0',
    fontWeight: 500
  },
  selectInput: {
    background: '#F8FAFC',
    border: '1px solid #CBD5E1',
    color: '#0F172A',
    borderRadius: '8px',
    padding: '10px 14px',
    outline: 'none',
    fontSize: '13px',
    fontWeight: 600
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },
  thRow: {
    borderBottom: '2px solid #E2E8F0',
    background: '#F8FAFC'
  },
  th: {
    padding: '12px 14px',
    fontSize: '11px',
    fontWeight: 700,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  trRow: {
    borderBottom: '1px solid #F1F5F9',
    transition: 'background 0.15s'
  },
  td: {
    padding: '14px',
    fontSize: '13px',
    color: '#1E293B'
  },
  tdTracking: {
    padding: '14px',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '13px',
    fontWeight: 700,
    color: '#0F172A'
  },
  tdEta: {
    padding: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#0284C7'
  },
  badgeMailClass: {
    background: '#DBEAFE',
    color: '#1E40AF',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 700,
    display: 'inline-block'
  },
  badgeSuccess: {
    background: '#DCFCE7',
    color: '#15803D',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 700
  },
  badgeWarning: {
    background: '#FEF3C7',
    color: '#B45309',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 700
  },
  badgeTransit: {
    background: '#E0F2FE',
    color: '#0369A1',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 700
  },
  btnAction: {
    background: '#F1F5F9',
    border: '1px solid #CBD5E1',
    color: '#0F172A',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  citizenBox: {
    background: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '36px',
    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.08)'
  },
  citizenInput: {
    width: '100%',
    background: '#F8FAFC',
    border: '1px solid #CBD5E1',
    borderRadius: '10px',
    padding: '14px 14px 14px 44px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#0F172A',
    outline: 'none'
  },
  citizenCard: {
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '24px'
  },
  citizenHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: '16px',
    borderBottom: '1px solid #E2E8F0'
  },
  citizenAlert: {
    display: 'flex',
    gap: '12px',
    background: '#FEF3C7',
    border: '1px solid #FCD34D',
    borderRadius: '8px',
    padding: '14px',
    marginTop: '16px'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    width: '560px',
    maxWidth: '92vw',
    background: '#FFFFFF',
    padding: '28px',
    borderRadius: '14px',
    boxShadow: '0 20px 40px rgba(15, 23, 42, 0.25)',
    border: '1px solid #E2E8F0'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: '12px',
    borderBottom: '1px solid #E2E8F0'
  },
  btnClose: {
    background: '#F1F5F9',
    border: 'none',
    color: '#0F172A',
    fontSize: '16px',
    fontWeight: 700,
    borderRadius: '6px',
    width: '28px',
    height: '28px',
    cursor: 'pointer'
  }
};
