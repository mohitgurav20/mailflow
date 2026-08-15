import React, { useState } from 'react';
import { useMockStore } from '../../mock/mockStore';
import { ShieldCheck, Plus, Trash2 } from 'lucide-react';

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
    <div className="page-view">
      <div style={styles.topHeader}>
        <div>
          <h2 style={styles.title}>Departmental Administration & Audit Trail</h2>
          <p style={styles.subtitle}>
            Postal Circle embargo controls, bulk induction tools, and immutable audit trails.
          </p>
        </div>
      </div>

      <div className="grid-2">
        {/* Active Embargo Rules */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <h3 style={styles.cardTitle}>Active Postal Embargo Declarations</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
            {embargos.map((embargo) => (
              <div key={embargo.id} style={styles.embargoCard}>
                <div style={styles.embargoHeader}>
                  <span className="badge badge-warning">{embargo.regionCircle} Circle</span>
                  <button
                    onClick={() => removeEmbargoRule(embargo.id)}
                    style={styles.deleteBtn}
                  >
                    <Trash2 size={15} color="#DC2626" />
                  </button>
                </div>
                <p style={styles.reasonText}>{embargo.reason}</p>
                <div style={styles.embargoMeta}>
                  <span>Restricted: {embargo.restrictedMailClasses.join(', ')}</span>
                  <span>Until: {embargo.activeTo}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Add Embargo Form */}
          <h4 style={{ color: '#0F172A', marginBottom: '14px', fontSize: '15px' }}>Declare New Embargo</h4>
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
              <label style={styles.label}>Reason / Security Restriction</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Security Detention / Heavy Weather"
                style={styles.input}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '12px' }}>
              <Plus size={15} />
              <span>Declare Official Embargo</span>
            </button>
          </form>
        </div>

        {/* Audit Log Viewer */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <h3 style={styles.cardTitle}>Immutable Operations Audit Log</h3>
          <p style={{ ...styles.subtitle, marginBottom: '20px' }}>
            Every routing decision, capacity reservation, and blast-radius override is permanently recorded.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '480px', overflowY: 'auto' }}>
            {auditLogs.map((log) => (
              <div key={log.id} style={styles.logCard}>
                <div style={styles.logHeader}>
                  <span className="badge badge-air">{log.userRole}</span>
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
    color: '#0F172A',
    margin: '0 0 4px 0'
  },
  subtitle: {
    fontSize: '13.5px',
    color: '#475569',
    margin: 0
  },
  cardTitle: {
    fontSize: '16px',
    color: '#0F172A',
    marginBottom: '18px'
  },
  embargoCard: {
    background: '#FEF3C7',
    border: '1px solid #FCD34D',
    borderRadius: '6px',
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
    cursor: 'pointer'
  },
  reasonText: {
    fontSize: '13.5px',
    fontWeight: 700,
    color: '#92400E',
    margin: '0 0 8px 0'
  },
  embargoMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#B45309'
  },
  logCard: {
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '6px',
    padding: '12px 16px'
  },
  logHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px'
  },
  logTime: {
    fontSize: '11px',
    color: '#94A3B8'
  },
  logAction: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#0D47A1',
    margin: '0 0 4px 0'
  },
  logDetails: {
    fontSize: '12px',
    color: '#334155',
    margin: 0
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
