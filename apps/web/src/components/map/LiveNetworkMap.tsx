import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useMockStore } from '../../mock/mockStore';
import { RealDataEngine, TrainRunningStatus, FlightTelemetry } from '../../services/real-data/realDataEngine';
import { 
  Navigation, AlertTriangle, Plane, Train, Truck, MapPin, Radio, Activity, Clock, ShieldCheck, Zap, Compass, Layers, Filter
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Component to auto-fit map bounds dynamically
const MapAutoFitter: React.FC<{ bounds: [number, number][] }> = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length >= 2) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 8 });
    }
  }, [bounds, map]);
  return null;
};

// Custom pulsing GPS package icon
const createPackageGpsIcon = (mode: string) => {
  const symbol = mode.includes('AIR') ? '✈️' : mode.includes('RAIL') ? '🚆' : mode.includes('WATER') ? '🚢' : '🚛';
  
  const svgHtml = `
    <div style="
      background: #E65100;
      color: #FFFFFF;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      border: 3px solid #FFFFFF;
      box-shadow: 0 4px 14px rgba(230, 81, 0, 0.5);
      animation: pulseGps 1.5s infinite;
    ">
      ${symbol}
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'gps-live-marker',
    iconSize: [38, 38],
    iconAnchor: [19, 19]
  });
};

// Hub Map Pin Icon
const createHubPinIcon = (type: string, status: string) => {
  const color = status === 'DISRUPTED' ? '#DC2626' : status === 'CONGESTED' ? '#D97706' : '#1E40AF';
  const label = type === 'NSH' ? '★' : '●';

  const svgHtml = `
    <div style="
      background: ${color};
      color: #FFFFFF;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 800;
      border: 2px solid #FFFFFF;
      box-shadow: 0 2px 6px rgba(0,0,0,0.25);
    ">
      ${label}
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'hub-pin-marker',
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  });
};

export const LiveNetworkMap: React.FC = () => {
  const { consignments, hubs, legs } = useMockStore();

  const [selectedTrackingNo, setSelectedTrackingNo] = useState<string>(consignments[0]?.trackingNumber || '');
  const [modeFilter, setModeFilter] = useState<'ALL' | 'AIR' | 'RAIL' | 'ROAD'>('ALL');
  const [trainStatus, setTrainStatus] = useState<TrainRunningStatus | null>(null);
  const [flightStatus, setFlightStatus] = useState<FlightTelemetry | null>(null);

  const consignment = consignments.find((c) => c.trackingNumber === selectedTrackingNo) || consignments[0];
  const originHub = hubs.find((h) => h.id === consignment?.originHubId) || hubs[0];
  const destHub = hubs.find((h) => h.id === consignment?.destHubId) || hubs[1];

  const activeLeg = legs.find((l) => l.originHubId === originHub.id && l.destHubId === destHub.id) || legs[0];
  const modeName = activeLeg?.mode || 'MMS_ROAD';

  // Live telemetry fetch
  useEffect(() => {
    if (modeName === 'RMS_RAIL') {
      RealDataEngine.getTrainTelemetry('12954').then((res) => setTrainStatus(res));
    } else if (modeName === 'COMMERCIAL_AIR') {
      RealDataEngine.getFlightTelemetry(activeLeg?.code || 'AIR-DEL-BOM-101').then((res) => setFlightStatus(res));
    }
  }, [selectedTrackingNo, modeName, activeLeg]);

  // Current dynamic GPS location along origin -> destination route (65% progress)
  const currentProgress = 0.65;
  const currentLat = originHub.lat + (destHub.lat - originHub.lat) * currentProgress;
  const currentLng = originHub.lng + (destHub.lng - originHub.lng) * currentProgress;

  const bounds: [number, number][] = [
    [originHub.lat, originHub.lng],
    [destHub.lat, destHub.lng]
  ];

  const filteredLegs = legs.filter((l) => {
    if (modeFilter === 'AIR') return l.mode === 'COMMERCIAL_AIR';
    if (modeFilter === 'RAIL') return l.mode === 'RMS_RAIL';
    if (modeFilter === 'ROAD') return l.mode === 'MMS_ROAD' || l.mode === 'HIRED_ROAD';
    return true;
  });

  return (
    <div className="page-view" style={{ background: '#F8FAFC', padding: '24px', borderRadius: '12px' }}>
      {/* Top Header */}
      <div style={styles.topHeader}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#E65100', padding: '8px', borderRadius: '8px', color: '#FFF' }}>
              <Radio size={20} />
            </div>
            <div>
              <h2 style={styles.title}>Real-Time GPS Parcel Telemetry & Live Network Map</h2>
              <p style={styles.subtitle}>
                NTES Rail Live delays, OpenSky ADS-B flight vectors, 26 sorting hubs, and active GPS tracking stream.
              </p>
            </div>
          </div>
        </div>

        {/* Parcel Selector & Mode Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Mode Filter */}
          <div style={{ display: 'flex', background: '#E2E8F0', padding: '3px', borderRadius: '8px' }}>
            {(['ALL', 'AIR', 'RAIL', 'ROAD'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setModeFilter(m)}
                style={{
                  border: 'none',
                  background: modeFilter === m ? '#1E40AF' : 'transparent',
                  color: modeFilter === m ? '#FFF' : '#475569',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                {m}
              </button>
            ))}
          </div>

          <select
            value={selectedTrackingNo}
            onChange={(e) => setSelectedTrackingNo(e.target.value)}
            style={styles.select}
          >
            {consignments.map((c) => (
              <option key={c.id} value={c.trackingNumber}>
                {c.trackingNumber} ({c.senderCity || 'Origin'} ➔ {c.receiverCity || 'Dest'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Live Telemetry Card + Map */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px' }}>
        {/* Left Telemetry Panel */}
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={styles.badgeLive}>
              <span style={styles.pulseDot} /> LIVE TELEMETRY STREAM
            </span>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#0284C7', fontFamily: 'JetBrains Mono, monospace' }}>
              {consignment.trackingNumber}
            </span>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0' }}>
            {consignment.senderName}
          </h3>
          <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 16px 0' }}>
            Destination: <strong>{consignment.receiverName}</strong> ({destHub.name})
          </p>

          {/* Telemetry Metrics */}
          <div style={styles.telemetryGrid}>
            <div style={styles.telemetryItem}>
              <span style={styles.telLabel}>Live GPS Telemetry</span>
              <p style={styles.telValMono}>
                {currentLat.toFixed(4)}° N, {currentLng.toFixed(4)}° E
              </p>
            </div>

            <div style={styles.telemetryItem}>
              <span style={styles.telLabel}>Carrier & Mode</span>
              <p style={styles.telVal}>
                {modeName.includes('AIR') ? '✈️ ' + (flightStatus?.carrierName || 'Air India Cargo AI-807') : modeName.includes('RAIL') ? '🚆 ' + (trainStatus?.trainName || '12954 August Kranti Rajdhani') : '🚛 India Post MMS Truck (NH Corridor)'}
              </p>
            </div>

            {/* NTES or OpenSky Live Telemetry Box */}
            {modeName === 'RMS_RAIL' && trainStatus && (
              <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', padding: '10px', borderRadius: '8px' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#92400E', textTransform: 'uppercase' }}>
                  🚂 NTES Live Train Status
                </span>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#78350F', margin: '3px 0 0 0' }}>
                  {trainStatus.currentStation}
                </p>
                <p style={{ fontSize: '11px', color: trainStatus.delayMinutes > 0 ? '#DC2626' : '#16A34A', fontWeight: 800, margin: '2px 0 0 0' }}>
                  Delay: {trainStatus.delayMinutes === 0 ? 'Right Time (0m delay)' : `${trainStatus.delayMinutes} mins delay`}
                </p>
              </div>
            )}

            {modeName === 'COMMERCIAL_AIR' && flightStatus && (
              <div style={{ background: '#E0F2FE', border: '1px solid #BAE6FD', padding: '10px', borderRadius: '8px' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#0369A1', textTransform: 'uppercase' }}>
                  ✈️ OpenSky ADS-B Telemetry
                </span>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#0C4A6E', margin: '3px 0 0 0' }}>
                  Callsign: {flightStatus.callsign} ({flightStatus.aircraftType})
                </p>
                <p style={{ fontSize: '11px', color: '#0284C7', fontWeight: 800, margin: '2px 0 0 0' }}>
                  Cruising Speed: {flightStatus.velocityKmH} km/h · Altitude: {flightStatus.altitudeMeters}m
                </p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={styles.telemetryItem}>
                <span style={styles.telLabel}>Estimated ETA</span>
                <p style={styles.telValEta}>{consignment.currentEta || 'On Schedule'}</p>
              </div>

              <div style={styles.telemetryItem}>
                <span style={styles.telLabel}>Target SLA</span>
                <p style={styles.telValSpeed}>{consignment.targetSlaHours} hrs</p>
              </div>
            </div>
          </div>

          {/* Journey Progress Bar */}
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              <span>Transit Progress</span>
              <span>65%</span>
            </div>
            <div style={{ height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: '65%', height: '100%', background: '#E65100', borderRadius: '4px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748B', marginTop: '6px' }}>
              <span>{originHub.name}</span>
              <span>{destHub.name}</span>
            </div>
          </div>
        </div>

        {/* Right Panel: Leaflet GPS Map */}
        <div style={{ height: '580px', borderRadius: '14px', overflow: 'hidden', border: '1px solid #CBD5E1', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
          <MapContainer center={[22.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapAutoFitter bounds={bounds} />

            {/* Render all 26 Hubs */}
            {hubs.map((hub) => (
              <Marker
                key={hub.id}
                position={[hub.lat, hub.lng]}
                icon={createHubPinIcon(hub.type, hub.status)}
              >
                <Popup>
                  <div style={{ padding: '4px' }}>
                    <strong style={{ fontSize: '13px', color: '#0F172A' }}>{hub.name}</strong><br />
                    <span style={{ fontSize: '11px', color: '#64748B' }}>Code: {hub.code} · Circle: {hub.circle}</span><br />
                    <span style={{ fontSize: '11px', color: '#1E40AF', fontWeight: 700 }}>Type: {hub.type}</span><br />
                    <span style={{ fontSize: '11px', color: '#059669' }}>Capacity: {hub.capacityPerDayKg.toLocaleString()} kg/day</span><br />
                    <span style={{ fontSize: '11px', fontWeight: 800, color: hub.status === 'DISRUPTED' ? '#DC2626' : hub.status === 'CONGESTED' ? '#D97706' : '#16A34A' }}>
                      Status: {hub.status}
                    </span>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Active Consignment Route Polyline */}
            <Polyline positions={bounds} color="#E65100" weight={5} dashArray="8, 8" />

            {/* Live Package Marker */}
            <Marker position={[currentLat, currentLng]} icon={createPackageGpsIcon(modeName)}>
              <Popup>
                <div style={{ padding: '4px' }}>
                  <strong style={{ color: '#E65100' }}>📦 {consignment.trackingNumber}</strong><br />
                  GPS: {currentLat.toFixed(4)}° N, {currentLng.toFixed(4)}° E<br />
                  Carrier: {modeName}<br />
                  Route: {originHub.circle} ➔ {destHub.circle}
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      </div>
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
    fontWeight: 800,
    color: '#0F172A',
    margin: 0
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748B',
    margin: '2px 0 0 0'
  },
  select: {
    background: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#0F172A',
    outline: 'none'
  },
  card: {
    background: '#FFFFFF',
    borderRadius: '14px',
    border: '1px solid #E2E8F0',
    padding: '22px',
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)'
  },
  badgeLive: {
    background: '#DCFCE7',
    color: '#15803D',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  pulseDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#16A34A'
  },
  telemetryGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  telemetryItem: {
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '10px 12px'
  },
  telLabel: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#64748B',
    textTransform: 'uppercase'
  },
  telValMono: {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '13px',
    fontWeight: 800,
    color: '#0F172A',
    margin: '3px 0 0 0'
  },
  telVal: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#0F172A',
    margin: '3px 0 0 0'
  },
  telValSpeed: {
    fontSize: '13px',
    fontWeight: 800,
    color: '#E65100',
    margin: '3px 0 0 0'
  },
  telValEta: {
    fontSize: '13px',
    fontWeight: 800,
    color: '#0284C7',
    margin: '3px 0 0 0'
  }
};
