import React, { useState } from 'react';
import { useMockStore } from '../../mock/mockStore';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend 
} from 'recharts';
import { TrendingUp, Award, Zap, ShieldCheck, PieChart, Activity, Clock, DollarSign } from 'lucide-react';

export const AnalyticsConsole: React.FC = () => {
  const { hubs, legs } = useMockStore();

  const [selectedModeFilter, setSelectedModeFilter] = useState<string>('ALL');

  // Circle-wise SLA Compliance Data
  const circleSlaData = [
    { circle: 'Delhi', sla: 96.4, total: 42100, delayed: 1515 },
    { circle: 'Maharashtra', sla: 94.8, total: 51200, delayed: 2662 },
    { circle: 'Karnataka', sla: 95.2, total: 38400, delayed: 1843 },
    { circle: 'West Bengal', sla: 92.1, total: 31000, delayed: 2449 },
    { circle: 'Tamil Nadu', sla: 96.1, total: 36800, delayed: 1435 },
    { circle: 'Telangana', sla: 95.7, total: 29400, delayed: 1264 },
    { circle: 'Gujarat', sla: 94.2, total: 34100, delayed: 1977 },
    { circle: 'UP', sla: 91.5, total: 48900, delayed: 4156 },
    { circle: 'Rajasthan', sla: 93.8, total: 27500, delayed: 1705 }
  ];

  // EWMA Historical Reliability Learning Evolution (Weekly)
  const ewmaEvolutionData = [
    { week: 'Week 1', air: 88.2, rail: 91.0, road: 84.5, overall: 87.9 },
    { week: 'Week 2', air: 89.5, rail: 92.4, road: 86.1, overall: 89.3 },
    { week: 'Week 3', air: 91.2, rail: 93.1, road: 88.2, overall: 90.8 },
    { week: 'Week 4', air: 93.4, rail: 94.8, road: 90.4, overall: 92.8 },
    { week: 'Week 5', air: 95.1, rail: 95.6, road: 92.1, overall: 94.2 }
  ];

  return (
    <div className="page-view" style={{ background: '#F8FAFC', padding: '24px', borderRadius: '12px' }}>
      {/* Top Header */}
      <div style={styles.topHeader}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#1E40AF', padding: '8px', borderRadius: '8px', color: '#FFF' }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <h2 style={styles.title}>EWMA Reliability & Network Analytics Console</h2>
              <p style={styles.subtitle}>
                Exponentially Weighted Moving Average historical reliability curves & Postal Circle SLA performance matrix.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={styles.metricCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={styles.metricLabel}>National SLA On-Time %</span>
            <Award size={18} color="#16A34A" />
          </div>
          <p style={styles.metricValuePrimary}>94.2%</p>
          <span style={{ fontSize: '11px', color: '#16A34A', fontWeight: 600 }}>↑ +1.8% vs last month</span>
        </div>

        <div style={styles.metricCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={styles.metricLabel}>Air Priority EWMA Score</span>
            <Zap size={18} color="#0284C7" />
          </div>
          <p style={styles.metricValueAir}>95.1%</p>
          <span style={{ fontSize: '11px', color: '#64748B' }}>Avg transit time: 2.4 hrs</span>
        </div>

        <div style={styles.metricCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={styles.metricLabel}>RMS Railway Reliability</span>
            <ShieldCheck size={18} color="#D97706" />
          </div>
          <p style={styles.metricValueRail}>95.6%</p>
          <span style={{ fontSize: '11px', color: '#64748B' }}>Highest historical stability</span>
        </div>

        <div style={styles.metricCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={styles.metricLabel}>Avg Multimodal Cost/Kg</span>
            <DollarSign size={18} color="#E65100" />
          </div>
          <p style={styles.metricValueOrange}>₹14.20</p>
          <span style={{ fontSize: '11px', color: '#16A34A', fontWeight: 600 }}>↓ -4.2% cost optimization</span>
        </div>
      </div>

      {/* Main Visual Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Postal Circle SLA Bar Chart */}
        <div style={styles.chartCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={styles.chartTitle}>Postal Circle On-Time SLA % Compliance</h3>
              <p style={styles.chartSub}>Target SLA: 95.0% threshold across 23 circles</p>
            </div>
          </div>

          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={circleSlaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="circle" stroke="#64748B" fontSize={11} />
                <YAxis domain={[80, 100]} stroke="#64748B" fontSize={11} />
                <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', color: '#0F172A', fontWeight: 600 }} />
                <Bar dataKey="sla" fill="#1E40AF" radius={[6, 6, 0, 0]} name="SLA %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* EWMA Historical Evolution Line Chart */}
        <div style={styles.chartCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={styles.chartTitle}>EWMA Self-Learning Reliability Evolution</h3>
              <p style={styles.chartSub}>Punctuality score evolution over 5 operational weeks</p>
            </div>
          </div>

          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ewmaEvolutionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="week" stroke="#64748B" fontSize={11} />
                <YAxis domain={[80, 100]} stroke="#64748B" fontSize={11} />
                <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', color: '#0F172A', fontWeight: 600 }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="air" stroke="#0284C7" strokeWidth={2.5} name="Air Priority" />
                <Line type="monotone" dataKey="rail" stroke="#D97706" strokeWidth={2.5} name="RMS Rail" />
                <Line type="monotone" dataKey="road" stroke="#16A34A" strokeWidth={2.5} name="MMS Road" />
                <Line type="monotone" dataKey="overall" stroke="#E65100" strokeWidth={3} name="Overall Network" />
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
    marginBottom: '20px'
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
  metricCard: {
    background: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    padding: '18px',
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)'
  },
  metricLabel: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#64748B',
    textTransform: 'uppercase'
  },
  metricValuePrimary: {
    fontSize: '26px',
    fontWeight: 800,
    color: '#16A34A',
    margin: '6px 0 2px 0'
  },
  metricValueAir: {
    fontSize: '26px',
    fontWeight: 800,
    color: '#0284C7',
    margin: '6px 0 2px 0'
  },
  metricValueRail: {
    fontSize: '26px',
    fontWeight: 800,
    color: '#D97706',
    margin: '6px 0 2px 0'
  },
  metricValueOrange: {
    fontSize: '26px',
    fontWeight: 800,
    color: '#E65100',
    margin: '6px 0 2px 0'
  },
  chartCard: {
    background: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)'
  },
  chartTitle: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#0F172A',
    margin: 0
  },
  chartSub: {
    fontSize: '12px',
    color: '#64748B',
    margin: '2px 0 0 0'
  }
};
