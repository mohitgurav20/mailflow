import React, { useState } from 'react';
import { useMockStore } from '../../mock/mockStore';
import { MailClass, RouteOption } from '@mailflow/shared-types';
import { 
  Zap, ShieldCheck, DollarSign, Clock, ArrowRight, CheckCircle2, Info, Building,
  MapPin, Compass, Navigation, Truck, Plane, Train, Sparkles
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

export const RoutePlanner: React.FC = () => {
  const { hubs, computeRouteOptions, inductConsignment, setActiveView } = useMockStore();

  const [originHubId, setOriginHubId] = useState<string>('hub-del');
  const [destHubId, setDestHubId] = useState<string>('hub-bom');
  const [weightKg, setWeightKg] = useState<number>(3.5);
  const [mailClass, setMailClass] = useState<MailClass>('SPEED_POST');

  // Granular Location State
  const [senderState, setSenderState] = useState<string>('Delhi');
  const [senderDistrict, setSenderDistrict] = useState<string>('New Delhi');
  const [senderVillage, setSenderVillage] = useState<string>('Connaught Place Sub-Post Office (110001)');

  const [receiverState, setReceiverState] = useState<string>('Maharashtra');
  const [receiverDistrict, setReceiverDistrict] = useState<string>('Mumbai South');
  const [receiverVillage, setReceiverVillage] = useState<string>('Colaba Delivery PO (400005)');

  const [senderName, setSenderName] = useState<string>('Department of Commerce, Govt of India');
  const [receiverName, setReceiverName] = useState<string>('Director, TIFR Mumbai');

  const [computedOptions, setComputedOptions] = useState<RouteOption[] | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('opt-1');
  const [isInducted, setIsInducted] = useState<boolean>(false);
  const [inductedTrackingNum, setInductedTrackingNum] = useState<string>('');

  const originHub = hubs.find((h) => h.id === originHubId) || hubs[0];
  const destHub = hubs.find((h) => h.id === destHubId) || hubs[1];

  const handleComputeRoutes = (e: React.FormEvent) => {
    e.preventDefault();
    const options = computeRouteOptions(originHubId, destHubId, weightKg, mailClass);
    setComputedOptions(options);
    setSelectedRouteId(options[0]?.id || 'opt-1');
    setIsInducted(false);
  };

  const handleConfirmReservation = () => {
    if (!computedOptions) return;
    const chosenRoute = computedOptions.find((o) => o.id === selectedRouteId) || computedOptions[0];

    const newConsignment = inductConsignment(
      {
        senderName,
        senderCity: `${senderVillage}, ${senderDistrict}, ${senderState}`,
        receiverName,
        receiverCity: `${receiverVillage}, ${receiverDistrict}, ${receiverState}`,
        originHubId,
        destHubId,
        weightKg,
        mailClass,
        currentHubId: originHubId,
        targetSlaHours: mailClass === 'SPEED_POST' ? 24 : 48,
        originalEta: '',
        currentEta: '',
        assignedRouteLegIds: chosenRoute.legs.map((l) => l.id)
      },
      chosenRoute
    );

    setIsInducted(true);
    setInductedTrackingNum(newConsignment.trackingNumber);
  };

  const selectedRoute = computedOptions?.find((r) => r.id === selectedRouteId) || computedOptions?.[0];

  // Route map coordinates
  const mapPositions: [number, number][] = [
    [originHub.lat, originHub.lng],
    [destHub.lat, destHub.lng]
  ];
  const midLat = (originHub.lat + destHub.lat) / 2;
  const midLng = (originHub.lng + destHub.lng) / 2;

  return (
    <div className="page-view" style={{ background: '#F8FAFC', padding: '24px', borderRadius: '12px' }}>
      <div style={styles.topHeader}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#1E40AF', padding: '8px', borderRadius: '8px', color: '#FFF' }}>
              <Navigation size={20} />
            </div>
            <div>
              <h2 style={styles.title}>Multimodal Route Planner & GPS Network Engine</h2>
              <p style={styles.subtitle}>
                State ➔ District ➔ Village/Town ➔ Postal Hub Granular Routing Chain with Dijkstra Optimization.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px' }}>
        {/* Left Panel: Granular Address & Policy Inputs */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>📍 Granular Location & Parcel Inputs</h3>

          <form onSubmit={handleComputeRoutes} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Sender Address */}
            <div style={styles.addressBlock}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#E65100', textTransform: 'uppercase', marginBottom: '6px' }}>
                Sender Origin Location (State ➔ City ➔ Village)
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <div>
                  <label style={styles.label}>State</label>
                  <input type="text" value={senderState} onChange={(e) => setSenderState(e.target.value)} style={styles.input} />
                </div>
                <div>
                  <label style={styles.label}>District / City</label>
                  <input type="text" value={senderDistrict} onChange={(e) => setSenderDistrict(e.target.value)} style={styles.input} />
                </div>
              </div>

              <div>
                <label style={styles.label}>Town / Village / Sub-Post Office & Pincode</label>
                <input type="text" value={senderVillage} onChange={(e) => setSenderVillage(e.target.value)} style={styles.input} />
              </div>

              <div style={{ marginTop: '8px' }}>
                <label style={styles.label}>Nearest National / Intra-Circle Sorting Hub</label>
                <select value={originHubId} onChange={(e) => setOriginHubId(e.target.value)} style={styles.select}>
                  {hubs.map((hub) => (
                    <option key={hub.id} value={hub.id}>
                      {hub.name} ({hub.circle})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Receiver Address */}
            <div style={styles.addressBlockGreen}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#16A34A', textTransform: 'uppercase', marginBottom: '6px' }}>
                Addressee Destination Location (State ➔ City ➔ Village)
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <div>
                  <label style={styles.label}>State</label>
                  <input type="text" value={receiverState} onChange={(e) => setReceiverState(e.target.value)} style={styles.input} />
                </div>
                <div>
                  <label style={styles.label}>District / City</label>
                  <input type="text" value={receiverDistrict} onChange={(e) => setReceiverDistrict(e.target.value)} style={styles.input} />
                </div>
              </div>

              <div>
                <label style={styles.label}>Town / Village / Delivery PO & Pincode</label>
                <input type="text" value={receiverVillage} onChange={(e) => setReceiverVillage(e.target.value)} style={styles.input} />
              </div>

              <div style={{ marginTop: '8px' }}>
                <label style={styles.label}>Destination Sorting Hub</label>
                <select value={destHubId} onChange={(e) => setDestHubId(e.target.value)} style={styles.select}>
                  {hubs.map((hub) => (
                    <option key={hub.id} value={hub.id}>
                      {hub.name} ({hub.circle})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Policy & Weight */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={styles.label}>Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="1000"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>Mail Policy</label>
                <select value={mailClass} onChange={(e) => setMailClass(e.target.value as any)} style={styles.select}>
                  <option value="SPEED_POST">Speed Post (24h Priority)</option>
                  <option value="REGISTERED_PARCEL">Registered Parcel</option>
                  <option value="BUSINESS_PARCEL">Business Bulk Parcel</option>
                </select>
              </div>
            </div>

            <button type="submit" style={styles.btnCompute}>
              <Zap size={16} />
              <span>Compute Optimal Multimodal Routes</span>
            </button>
          </form>
        </div>

        {/* Right Panel: Computed Multimodal Route Options & GPS Map */}
        <div>
          {/* Granular Postal Chain Flow */}
          <div style={styles.chainCard}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', marginBottom: '8px' }}>
              6-Leg Granular Postal Transmission Chain
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              <div style={styles.chainNode}>📍 {senderVillage}</div>
              <ArrowRight size={14} color="#64748B" />
              <div style={styles.chainNode}>🏢 {senderDistrict} Sub-PO</div>
              <ArrowRight size={14} color="#64748B" />
              <div style={styles.chainNodeActive}>🏛️ {originHub.name}</div>
              <ArrowRight size={14} color="#E65100" />
              <div style={styles.chainNodeActive}>⚡ Multimodal Transit</div>
              <ArrowRight size={14} color="#E65100" />
              <div style={styles.chainNodeActive}>🏛️ {destHub.name}</div>
              <ArrowRight size={14} color="#64748B" />
              <div style={styles.chainNode}>📬 {receiverDistrict} Delivery PO</div>
              <ArrowRight size={14} color="#64748B" />
              <div style={styles.chainNode}>🏠 {receiverVillage}</div>
            </div>
          </div>

          {/* Interactive Route Map */}
          <div style={{ height: '220px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #CBD5E1', marginBottom: '20px', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
            <MapContainer center={[midLat, midLng]} zoom={5} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[originHub.lat, originHub.lng]}>
                <Popup>Origin Hub: {originHub.name}</Popup>
              </Marker>
              <Marker position={[destHub.lat, destHub.lng]}>
                <Popup>Destination Hub: {destHub.name}</Popup>
              </Marker>
              <Polyline positions={mapPositions} color="#E65100" weight={4} dashArray="6, 6" />
            </MapContainer>
          </div>

          {/* Computed Route Cards */}
          {computedOptions && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Dijkstra Ranked Route Recommendations ({computedOptions.length} Evaluated)
                </h3>
                {isInducted && (
                  <span style={styles.badgeSuccess}>
                    ✓ Inducted! Tracking No: {inductedTrackingNum}
                  </span>
                )}
              </div>

              {computedOptions.map((option, index) => {
                const isSelected = option.id === selectedRouteId;

                return (
                  <div
                    key={option.id}
                    onClick={() => setSelectedRouteId(option.id)}
                    style={{
                      ...styles.routeCard,
                      border: isSelected ? '2px solid #1E40AF' : '1px solid #E2E8F0',
                      boxShadow: isSelected ? '0 4px 12px rgba(30, 64, 175, 0.15)' : 'none'
                    }}
                  >
                    <div style={styles.routeHeader}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={index === 0 ? styles.badgeRank1 : index === 1 ? styles.badgeRank2 : styles.badgeRank3}>
                          Rank #{index + 1}
                        </span>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                          {option.title || `Option ${index + 1}: ${option.legs.map((l) => l.mode).join(' ➔ ')}`}
                        </h4>
                      </div>

                      <div style={{ display: 'flex', gap: '16px', fontSize: '13px', fontWeight: 700 }}>
                        <span style={{ color: '#0284C7' }}>⏱️ {option.totalDurationHours || 12}h SLA</span>
                        <span style={{ color: '#16A34A' }}>₹{option.totalCost}/kg</span>
                        <span style={{ color: '#E65100' }}>🌱 1.2 kg CO₂</span>
                      </div>
                    </div>

                    {/* Legs Detail */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '12px 0' }}>
                      {option.legs.map((leg) => (
                        <div key={leg.id || leg.mode} style={styles.legPill}>
                          <span>{leg.mode === 'COMMERCIAL_AIR' ? '✈️ Commercial Air' : leg.mode === 'RMS_RAIL' ? '🚆 RMS Express Rail' : leg.mode === 'SURFACE_WATER' ? '🚢 Coastal Cargo' : '🚛 Departmental MMS Road'}</span>
                          <span style={{ color: '#64748B', fontSize: '10px' }}>({leg.distanceKm || 450} km)</span>
                        </div>
                      ))}
                    </div>

                    {/* Explainable Rationale */}
                    <div style={styles.rationaleBox}>
                      <Info size={14} color="#1E40AF" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <p style={{ margin: 0, fontSize: '12px', color: '#1E293B', lineHeight: 1.5 }}>
                        <strong>Explainable Rationale:</strong> {option.rationale}
                      </p>
                    </div>
                  </div>
                );
              })}

              <button onClick={handleConfirmReservation} style={styles.btnReserve}>
                <CheckCircle2 size={18} />
                <span>Confirm & Reserve Capacity Handshake for Selected Route</span>
              </button>
            </div>
          )}
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
  card: {
    background: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)'
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#0F172A',
    marginBottom: '16px'
  },
  addressBlock: {
    background: '#FFF7ED',
    border: '1px solid #FFEDD5',
    padding: '12px',
    borderRadius: '8px'
  },
  addressBlockGreen: {
    background: '#F0FDF4',
    border: '1px solid #DCFCE7',
    padding: '12px',
    borderRadius: '8px'
  },
  label: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#475569',
    display: 'block',
    marginBottom: '4px'
  },
  input: {
    width: '100%',
    background: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    padding: '8px 10px',
    fontSize: '12px',
    color: '#0F172A',
    fontWeight: 600,
    outline: 'none'
  },
  select: {
    width: '100%',
    background: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    padding: '8px 10px',
    fontSize: '12px',
    color: '#0F172A',
    fontWeight: 600,
    outline: 'none'
  },
  btnCompute: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    background: '#E65100',
    color: '#FFFFFF',
    padding: '12px',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '13px',
    border: 'none',
    cursor: 'pointer',
    marginTop: '8px',
    boxShadow: '0 2px 6px rgba(230, 81, 0, 0.25)'
  },
  chainCard: {
    background: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    padding: '16px',
    marginBottom: '16px'
  },
  chainNode: {
    background: '#F1F5F9',
    color: '#475569',
    padding: '6px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 600,
    whiteSpace: 'nowrap'
  },
  chainNodeActive: {
    background: '#FFF3E0',
    border: '1px solid #FFE0B2',
    color: '#E65100',
    padding: '6px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 700,
    whiteSpace: 'nowrap'
  },
  routeCard: {
    background: '#FFFFFF',
    borderRadius: '10px',
    padding: '16px',
    cursor: 'pointer',
    transition: 'all 0.15s'
  },
  routeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  badgeRank1: {
    background: '#DCFCE7',
    color: '#15803D',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 800
  },
  badgeRank2: {
    background: '#DBEAFE',
    color: '#1E40AF',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 800
  },
  badgeRank3: {
    background: '#FEF3C7',
    color: '#B45309',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 800
  },
  legPill: {
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    color: '#0F172A',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  rationaleBox: {
    background: '#EFF6FF',
    border: '1px solid #BFDBFE',
    borderRadius: '6px',
    padding: '10px 12px',
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start'
  },
  btnReserve: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    background: '#1E40AF',
    color: '#FFFFFF',
    padding: '14px',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '14px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(30, 64, 175, 0.25)'
  },
  badgeSuccess: {
    background: '#DCFCE7',
    color: '#15803D',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 700
  }
};
