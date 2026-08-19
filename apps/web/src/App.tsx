import React, { useState } from 'react';
import { MockStoreProvider, useMockStore } from './mock/mockStore';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { ControlTower } from './components/control-tower/ControlTower';
import { LiveNetworkMap } from './components/map/LiveNetworkMap';
import { RoutePlanner } from './components/planner/RoutePlanner';
import { DisruptionCenter } from './components/disruption/DisruptionCenter';
import { ConsignmentsView } from './components/consignments/ConsignmentsView';
import { AnalyticsConsole } from './components/analytics/AnalyticsConsole';
import { AdminConsole } from './components/admin/AdminConsole';
import { LandingPage } from './components/landing/LandingPage';
import { CitizenHome } from './components/citizen/CitizenHome';
import './i18n'; // Initialize i18n
import './styles/theme.css';

type AppScreen = 'landing' | 'citizen' | 'officer';

const OfficerLayout: React.FC<{ onSwitchToCitizen: () => void; onBackToHome: () => void }> = ({
  onSwitchToCitizen,
  onBackToHome,
}) => {
  const { activeView, setActiveView } = useMockStore();

  const renderView = () => {
    switch (activeView) {
      case 'control-tower':     return <ControlTower />;
      case 'live-map':          return <LiveNetworkMap />;
      case 'route-planner':     return <RoutePlanner />;
      case 'disruption-center': return <DisruptionCenter />;
      case 'consignments':      return <ConsignmentsView />;
      case 'analytics':         return <AnalyticsConsole />;
      case 'admin':             return <AdminConsole />;
      default:                  return <ControlTower />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar activeView={activeView as any} onNavigate={(v) => setActiveView(v)} />
      <div className="main-content">
        <Navbar />
        {/* Quick Mode Bar for Judges/Demo */}
        <div style={{
          background: '#0F172A',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          padding: '8px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: '#94A3B8'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              background: '#1E40AF',
              color: '#FFF',
              padding: '2px 8px',
              borderRadius: '4px',
              fontWeight: 800,
              fontSize: '10px'
            }}>
              OFFICER VIEW
            </span>
            <span>Postal Operations & Multimodal Dynamic Routing Console</span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onSwitchToCitizen}
              style={{
                background: '#FF6B00',
                color: '#FFF',
                border: 'none',
                padding: '5px 12px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              📮 Switch to Citizen Mode (Hindi/Voice/QR)
            </button>
            <button
              onClick={onBackToHome}
              style={{
                background: 'rgba(255,255,255,0.1)',
                color: '#CBD5E1',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              🏠 Home
            </button>
          </div>
        </div>

        {renderView()}
      </div>
    </div>
  );
};

export function App() {
  const [screen, setScreen] = useState<AppScreen>('landing');

  return (
    <MockStoreProvider>
      {screen === 'landing' && (
        <LandingPage
          onEnterApp={() => setScreen('officer')}
          onOpenCitizen={() => setScreen('citizen')}
        />
      )}

      {screen === 'citizen' && (
        <CitizenHome onSwitchToOfficer={() => setScreen('officer')} />
      )}

      {screen === 'officer' && (
        <OfficerLayout
          onSwitchToCitizen={() => setScreen('citizen')}
          onBackToHome={() => setScreen('landing')}
        />
      )}
    </MockStoreProvider>
  );
}

export default App;
