import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { useMockStore } from '../../mock/mockStore';
import { TransportMode } from '@mailflow/shared-types';
import { Navigation, AlertTriangle, Plane, Train, Truck, Layers } from 'lucide-react';

const createHubIcon = (type: string, status: string) => {
  const color = status === 'DISRUPTED' ? '#DC2626' : status === 'CONGESTED' ? '#D97706' : '#0284C7';
  const size = type === 'NSH' ? 22 : 16;

  const svgIcon = `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#FFFFFF" stroke="${color}" stroke-width="3"/>
      <circle cx="12" cy="12" r="4" fill="${color}"/>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: 'custom-hub-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

export const LiveNetworkMap: React.FC = () => {
  const { hubs, legs } = useMockStore();
  const [selectedMode, setSelectedMode] = useState<string>('ALL');
  const [showDisruptionsOnly, setShowDisruptionsOnly] = useState<boolean>(false);

  const modeColors: Record<TransportMode, string> = {
    COMMERCIAL_AIR: '#0284C7',
    RMS_RAIL: '#D97706',
    MMS_ROAD: '#9333EA',
    HIRED_ROAD: '#16A34A',
    SURFACE_WATER: '#2563EB'
  };

  const filteredLegs = legs.filter((leg) => {
    if (showDisruptionsOnly && leg.status === 'ACTIVE') return false;
    if (selectedMode !== 'ALL' && leg.mode !== selectedMode) return false;
    return true;
  });

  return (
    <div className="page-view" style={{ padding: '32px 32px 0 32px' }}>
      {/* Control Overlay Bar */}
      <div style={styles.mapControls}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={styles.controlTitleGroup}>
            <Navigation size={18} color="#E65100" />
            <h3 style={styles.mapTitle}>Multimodal Network Control Map</h3>
          </div>

          {/* Filter Pills */}
          <div style={styles.filterGroup}>
            <button
              onClick={() => setSelectedMode('ALL')}
              style={{
                ...styles.filterBtn,
                background: selectedMode === 'ALL' ? '#E65100' : '#F1F5F9',
                color: selectedMode === 'ALL' ? '#FFFFFF' : '#475569'
              }}
            >
              <Layers size={14} />
              <span>All Modes</span>
            </button>
            <button
              onClick={() => setSelectedMode('COMMERCIAL_AIR')}
              style={{
                ...styles.filterBtn,
                background: selectedMode === 'COMMERCIAL_AIR' ? '#E0F2FE' : '#F1F5F9',
                color: selectedMode === 'COMMERCIAL_AIR' ? '#0284C7' : '#475569'
              }}
            >
              <Plane size={14} />
              <span>Air Corridor</span>
            </button>
            <button
              onClick={() => setSelectedMode('RMS_RAIL')}
              style={{
                ...styles.filterBtn,
                background: selectedMode === 'RMS_RAIL' ? '#FEF3C7' : '#F1F5F9',
                color: selectedMode === 'RMS_RAIL' ? '#D97706' : '#475569'
              }}
            >
              <Train size={14} />
              <span>RMS Rail</span>
            </button>
            <button
              onClick={() => setSelectedMode('MMS_ROAD')}
              style={{
                ...styles.filterBtn,
                background: selectedMode === 'MMS_ROAD' ? '#F3E8FF' : '#F1F5F9',
                color: selectedMode === 'MMS_ROAD' ? '#9333EA' : '#475569'
              }}
            >
              <Truck size={14} />
              <span>MMS Road</span>
            </button>
          </div>
        </div>

        {/* Disruption Toggle */}
        <button
          onClick={() => setShowDisruptionsOnly(!showDisruptionsOnly)}
          style={{
            ...styles.disruptionToggle,
            background: showDisruptionsOnly ? '#FEE2E2' : '#F1F5F9',
            borderColor: showDisruptionsOnly ? '#DC2626' : '#CBD5E1',
            color: showDisruptionsOnly ? '#DC2626' : '#0F172A'
          }}
        >
          <AlertTriangle size={14} color={showDisruptionsOnly ? '#DC2626' : '#64748B'} />
          <span>Disrupted Corridors Only</span>
        </button>
      </div>

      {/* Map Container */}
      <div style={styles.mapFrame} className="glass-card">
        <MapContainer
          center={[22.5937, 78.9629]}
          zoom={5}
          style={{ height: '100%', width: '100%', borderRadius: '8px' }}
          zoomControl={true}
        >
          {/* Light Mode CartoDB Tile Layer */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />

          {filteredLegs.map((leg) => {
            const origin = hubs.find((h) => h.id === leg.originHubId);
            const dest = hubs.find((h) => h.id === leg.destHubId);

            if (!origin || !dest) return null;

            const isDisrupted = leg.status === 'CANCELLED' || leg.status === 'BLOCKED';
            const color = isDisrupted ? '#DC2626' : modeColors[leg.mode] || '#0F172A';

            return (
              <Polyline
                key={leg.id}
                positions={[
                  [origin.lat, origin.lng],
                  [dest.lat, dest.lng]
                ]}
                pathOptions={{
                  color,
                  weight: isDisrupted ? 4 : 3,
                  dashArray: leg.mode === 'COMMERCIAL_AIR' ? '6, 8' : undefined,
                  opacity: isDisrupted ? 0.95 : 0.8
                }}
              >
                <Popup>
                  <div style={styles.popupContent}>
                    <div style={styles.popupHeader}>
                      <span className="badge" style={{ background: color, color: '#FFF' }}>
                        {leg.mode.replace('_', ' ')}
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>{leg.code}</span>
                    </div>
                    <p style={styles.popupTitle}>{leg.carrierName}</p>
                    <p style={styles.popupSub}>
                      {origin.name} ➔ {dest.name}
                    </p>
                    <div style={styles.popupMeta}>
                      <span>Duration: {leg.durationHours}h</span>
                      <span>Capacity Free: {leg.availableCapacityKg}kg</span>
                    </div>
                    {isDisrupted && (
                      <div style={{ marginTop: '8px', color: '#DC2626', fontSize: '12px', fontWeight: 700 }}>
                        Corridor Cancelled / Grounded
                      </div>
                    )}
                  </div>
                </Popup>
              </Polyline>
            );
          })}

          {hubs.map((hub) => (
            <React.Fragment key={hub.id}>
              {hub.status === 'DISRUPTED' && (
                <CircleMarker
                  center={[hub.lat, hub.lng]}
                  radius={18}
                  pathOptions={{ color: '#DC2626', fillColor: '#DC2626', fillOpacity: 0.2, weight: 1.5 }}
                />
              )}
              <Marker
                position={[hub.lat, hub.lng]}
                icon={createHubIcon(hub.type, hub.status)}
              >
                <Popup>
                  <div style={styles.popupContent}>
                    <div style={styles.popupHeader}>
                      <span className="badge badge-ok">{hub.type}</span>
                      <span style={{ fontSize: '11px', color: '#E65100', fontWeight: 700 }}>{hub.circle} Circle</span>
                    </div>
                    <h4 style={styles.popupTitle}>{hub.name}</h4>
                    <p style={styles.popupSub}>Hub Code: {hub.code}</p>
                    <div style={styles.popupMeta}>
                      <span>Workload: {hub.currentWorkloadKg} kg/day</span>
                      <span>Cap: {hub.capacityPerDayKg} kg</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  mapControls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    background: '#FFFFFF',
    padding: '14px 24px',
    borderRadius: '8px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)'
  },
  controlTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  mapTitle: {
    fontSize: '16px',
    color: '#0F172A',
    margin: 0
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginLeft: '20px'
  },
  filterBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '6px',
    border: '1px solid #E2E8F0',
    fontSize: '12.5px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s'
  },
  disruptionToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '6px',
    border: '1px solid',
    fontSize: '12.5px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  mapFrame: {
    height: 'calc(100vh - 200px)',
    width: '100%',
    padding: '4px',
    borderRadius: '8px',
    overflow: 'hidden'
  },
  popupContent: {
    padding: '4px',
    minWidth: '220px'
  },
  popupHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px'
  },
  popupTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#0F172A',
    margin: '0 0 2px 0'
  },
  popupSub: {
    fontSize: '12px',
    color: '#64748B',
    margin: '0 0 8px 0'
  },
  popupMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: '#334155',
    borderTop: '1px solid #E2E8F0',
    paddingTop: '6px'
  }
};
