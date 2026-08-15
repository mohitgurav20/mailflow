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
import './styles/theme.css';

const MainLayout: React.FC = () => {
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
        {renderView()}
      </div>
    </div>
  );
};

export function App() {
  const [appStarted, setAppStarted] = useState(false);

  if (!appStarted) {
    return (
      <LandingPage onEnterApp={() => setAppStarted(true)} />
    );
  }

  return (
    <MockStoreProvider>
      <MainLayout />
    </MockStoreProvider>
  );
}

export default App;
