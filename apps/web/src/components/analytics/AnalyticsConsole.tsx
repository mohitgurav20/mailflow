import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

const modePerformanceData = [
  { mode: 'Commercial Air', onTimeRate: 96.4, costPerKg: 44, volumeKg: 18500 },
  { mode: 'RMS Rail', onTimeRate: 91.2, costPerKg: 9.5, volumeKg: 64000 },
  { mode: 'MMS Road Fleet', onTimeRate: 95.1, costPerKg: 7.2, volumeKg: 42000 },
  { mode: 'Surface Water', onTimeRate: 88.0, costPerKg: 4.0, volumeKg: 12000 }
];

const ewmaTrendData = [
  { day: 'Day 1', DelhiAir: 0.98, NorthernRail: 0.94, MMSRoad: 0.96 },
  { day: 'Day 2', DelhiAir: 0.97, NorthernRail: 0.91, MMSRoad: 0.95 },
  { day: 'Day 3', DelhiAir: 0.92, NorthernRail: 0.88, MMSRoad: 0.96 },
  { day: 'Day 4 (Disruption)', DelhiAir: 0.84, NorthernRail: 0.86, MMSRoad: 0.94 },
  { day: 'Day 5 (Recovered)', DelhiAir: 0.95, NorthernRail: 0.89, MMSRoad: 0.97 }
];

export const AnalyticsConsole: React.FC = () => {
  return (
    <div className="page-view">
      <div style={styles.topHeader}>
        <div>
          <h2 style={styles.title}>Analytics & EWMA Reliability Self-Learning</h2>
          <p style={styles.subtitle}>
            Exponentially Weighted Moving Average (EWMA) scores dynamically updating transport leg weights.
          </p>
        </div>
      </div>

      <div className="grid-2">
        {/* On-Time Performance by Mode */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <h3 style={styles.cardTitle}>On-Time SLA Performance by Mode (%)</h3>
          <div style={{ height: '320px', marginTop: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modePerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="mode" stroke="#64748B" fontSize={12} />
                <YAxis domain={[80, 100]} stroke="#64748B" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', borderRadius: '6px' }}
                />
                <Bar dataKey="onTimeRate" fill="#E65100" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* EWMA Score Evolution */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <h3 style={styles.cardTitle}>EWMA Reliability Score Evolution</h3>
          <div style={{ height: '320px', marginTop: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ewmaTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="day" stroke="#64748B" fontSize={12} />
                <YAxis domain={[0.8, 1.0]} stroke="#64748B" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', borderRadius: '6px' }}
                />
                <Line type="monotone" dataKey="DelhiAir" stroke="#0284C7" strokeWidth={3} />
                <Line type="monotone" dataKey="NorthernRail" stroke="#D97706" strokeWidth={3} />
                <Line type="monotone" dataKey="MMSRoad" stroke="#9333EA" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
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
    margin: 0
  }
};
