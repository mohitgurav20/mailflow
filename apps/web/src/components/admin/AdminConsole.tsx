import React, { useState } from 'react';
import { useMockStore } from '../../mock/mockStore';
import { ShieldCheck, Plus, Trash2, Lock, ShieldAlert, FileText } from 'lucide-react';

export const AdminConsole: React.FC = () => {
  const { embargos, addEmbargoRule, removeEmbargoRule, auditLogs } = useMockStore();

  const [regionCircle, setRegionCircle] = useState<string>('Assam & North East');
  const [reason, setReason] = useState<string>('Severe Highway Flooding on NH-27');

  const handleAddEmbargo = (e: React.FormEvent) => {
    e.preventDefault();
    addEmbargoRule({
      regionCircle,
      restrictedMailClasses: ['BUSINESS_PARCEL', 'BULK_MAIL'],
      reason,
      activeFrom: new Date().toISOString().substring(0, 10),
      activeTo: '2026-08-20'
    });
    setReason('');
  };

  return (
    <div className="page-view" style={{ background: '#F8FAFC', padding: '24px', borderRadius: '12px' }}>
      <div style={styles.topHeader}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#0F172A', padding: '8px', borderRadius: '8px', color: '#FFF' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 style={styles.title}>Departmental Administration & Audit Trail</h2>
              <p style={styles.subtitle}>
                Postal Circle embargo controls, security detention rules, and immutable operations audit trail.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Active Embargo Rules */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Active Postal Embargo Declarations</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
            {embargos.map((embargo) => (
              <div key={embargo.id} style={styles.embargoCard}>
                <div style={styles.embargoHeader}>
                  <span style={styles.badgeWarning}>{embargo.regionCircle} Circle</span>
                  <button
                    onClick={() => removeEmbargoRule(embargo.id)}
                    style={styles.deleteBtn}
                  >
                    <Trash2 size={16} color="#DC2626" />
                  </button>
                </div>
                <p style={styles.reasonText}>{embargo.reason}</p>
                <div style={styles.embargoMeta}>
                  <span>Restricted: <strong>{embargo.restrictedMailClasses.join(', ')}</strong></span>
                  <span>Active Until: <strong>{embargo.activeTo}</strong></span>
                </div>
              </div>
            ))}
          </div>

          {/* Add Embargo Form */}
          <h4 style={{ color: '#0F172A', marginBottom: '14px', fontSize: '15px', fontWeight: 700 }}>
            Declare New Official Embargo
          </h4>
          <form onSubmit={handleAddEmbargo} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={styles.label}>Postal Circle</label>
              <input
                type="text"
                value={regionCircle}
                onChange={(e) => setRegionCircle(e.target.value)}
                style={styles.input}
              />
            </div>
            <div>
              <label style={styles.label}>Reason / Security Restriction Context</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Security Detention / Heavy Weather / Flooding"
                style={styles.input}
              />
            </div>
            <button type="submit" style={styles.btnSubmit}>
              <Plus size={16} />
              <span>Declare Official Embargo</span>
            </button>
          </form>
        </div>

        {/* Audit Log Viewer */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Immutable Operations Audit Trail</h3>
          <p style={{ ...styles.subtitle, marginBottom: '20px' }}>
            Every Dijkstra route optimization, capacity handshake, and blast-radius re-route is permanently logged.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '480px', overflowY: 'auto' }}>
            {auditLogs.map((log) => (
              <div key={log.id} style={styles.logCard}>
                <div style={styles.logHeader}>
                  <span style={styles.badgeRole}>{log.userRole}</span>
                  <span style={styles.logTime}>{log.timestamp}</span>
                </div>
                <h5 style={styles.logAction}>{log.action}</h5>
                <p style={styles.logDetails}>{log.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  topHeader: {
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
    fontSize: '16px',
    fontWeight: 800,
    color: '#0F172A',
    marginBottom: '16px'
  },
  embargoCard: {
    background: '#FEF3C7',
    border: '1px solid #FCD34D',
    borderRadius: '8px',
    padding: '14px'
  },
  embargoHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  deleteBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '4px'
  },
  reasonText: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#78350F',
    margin: '0 0 8px 0'
  },
  embargoMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: '#B45309'
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
  btnSubmit: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    background: '#0F172A',
    color: '#FFFFFF',
    padding: '12px',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '13px',
    border: 'none',
    cursor: 'pointer'
  },
  badgeWarning: {
    background: '#F59E0B',
    color: '#FFFFFF',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 800
  },
  badgeRole: {
    background: '#DBEAFE',
    color: '#1E40AF',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 700
  },
  logCard: {
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '12px'
  },
  logHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px'
  },
  logTime: {
    fontSize: '11px',
    color: '#64748B',
    fontWeight: 600
  },
  logAction: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#0F172A',
    margin: '0 0 4px 0'
  },
  logDetails: {
    fontSize: '12px',
    color: '#475569',
    margin: 0
  }
};
