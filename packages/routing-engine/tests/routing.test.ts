import test from 'node:test';
import assert from 'node:assert/strict';
import { MultimodalRoutingEngine } from '../src/engine.js';
import { Hub, Leg, DisruptionEvent, Consignment } from '@mailflow/shared-types';

const sampleHubs: Hub[] = [
  {
    id: 'hub-del',
    code: 'DEL-NSH',
    name: 'Delhi NSH',
    circle: 'Delhi Circle',
    tier: 'NSH',
    state: 'Delhi',
    latitude: 28.6139,
    longitude: 77.2090,
    processingCapacityKg: 50000,
    currentLoadKg: 10000,
    averageSortTimeMinutes: 30,
    operationalStatus: 'OPERATIONAL'
  },
  {
    id: 'hub-bom',
    code: 'BOM-NSH',
    name: 'Mumbai NSH',
    circle: 'Maharashtra Circle',
    tier: 'NSH',
    state: 'Maharashtra',
    latitude: 19.0760,
    longitude: 72.8777,
    processingCapacityKg: 50000,
    currentLoadKg: 12000,
    averageSortTimeMinutes: 30,
    operationalStatus: 'OPERATIONAL'
  },
  {
    id: 'hub-pnq',
    code: 'PNQ-ICH',
    name: 'Pune ICH',
    circle: 'Maharashtra Circle',
    tier: 'ICH',
    state: 'Maharashtra',
    latitude: 18.5204,
    longitude: 73.8567,
    processingCapacityKg: 20000,
    currentLoadKg: 4000,
    averageSortTimeMinutes: 20,
    operationalStatus: 'OPERATIONAL'
  },
  {
    id: 'hub-jai',
    code: 'JAI-NSH',
    name: 'Jaipur NSH',
    circle: 'Rajasthan Circle',
    tier: 'NSH',
    state: 'Rajasthan',
    latitude: 26.9124,
    longitude: 75.7873,
    processingCapacityKg: 25000,
    currentLoadKg: 5000,
    averageSortTimeMinutes: 25,
    operationalStatus: 'OPERATIONAL'
  },
  {
    id: 'hub-blr',
    code: 'BLR-NSH',
    name: 'Bengaluru NSH',
    circle: 'Karnataka Circle',
    tier: 'NSH',
    state: 'Karnataka',
    latitude: 12.9716,
    longitude: 77.5946,
    processingCapacityKg: 40000,
    currentLoadKg: 8000,
    averageSortTimeMinutes: 30,
    operationalStatus: 'OPERATIONAL'
  }
];

const sampleLegs: Leg[] = [
  {
    id: 'leg-del-bom-air',
    originHubId: 'hub-del',
    destHubId: 'hub-bom',
    mode: 'AIR',
    carrierName: 'Air India AI-860',
    serviceCode: 'AI-860',
    departureTime: '06:00',
    arrivalTime: '08:15',
    durationMinutes: 135,
    distanceKm: 1150,
    capacityKg: 5000,
    bookedKg: 1000,
    costPerKg: 25.0,
    baseCost: 150,
    carbonKgPerKg: 0.48,
    reliabilityScore: 0.95,
    cutoffTimeMinutesBeforeDeparture: 60,
    status: 'ACTIVE'
  },
  {
    id: 'leg-del-bom-rail',
    originHubId: 'hub-del',
    destHubId: 'hub-bom',
    mode: 'RAIL',
    carrierName: 'Mumbai Rajdhani 12952',
    serviceCode: '12952-RMS',
    departureTime: '16:55',
    arrivalTime: '08:35',
    durationMinutes: 940,
    distanceKm: 1380,
    capacityKg: 20000,
    bookedKg: 5000,
    costPerKg: 3.5,
    baseCost: 60,
    carbonKgPerKg: 0.08,
    reliabilityScore: 0.90,
    cutoffTimeMinutesBeforeDeparture: 90,
    status: 'ACTIVE'
  },
  {
    id: 'leg-del-jai-mms',
    originHubId: 'hub-del',
    destHubId: 'hub-jai',
    mode: 'MMS_ROAD',
    carrierName: 'Mail Motor Service DL-01',
    serviceCode: 'MMS-DL-01',
    departureTime: '07:00',
    arrivalTime: '12:00',
    durationMinutes: 300,
    distanceKm: 270,
    capacityKg: 8000,
    bookedKg: 2000,
    costPerKg: 1.8,
    baseCost: 35,
    carbonKgPerKg: 0.05,
    reliabilityScore: 0.96,
    cutoffTimeMinutesBeforeDeparture: 30,
    status: 'ACTIVE'
  },
  {
    id: 'leg-bom-pnq-mms',
    originHubId: 'hub-bom',
    destHubId: 'hub-pnq',
    mode: 'MMS_ROAD',
    carrierName: 'Mail Motor Service MH-01',
    serviceCode: 'MMS-MH-01',
    departureTime: '10:00',
    arrivalTime: '13:30',
    durationMinutes: 210,
    distanceKm: 150,
    capacityKg: 8000,
    bookedKg: 2000,
    costPerKg: 1.5,
    baseCost: 30,
    carbonKgPerKg: 0.04,
    reliabilityScore: 0.97,
    cutoffTimeMinutesBeforeDeparture: 30,
    status: 'ACTIVE'
  },
  {
    id: 'leg-bom-blr-air',
    originHubId: 'hub-bom',
    destHubId: 'hub-blr',
    mode: 'AIR',
    carrierName: 'IndiGo 6E-5301',
    serviceCode: '6E-5301',
    departureTime: '11:00',
    arrivalTime: '12:40',
    durationMinutes: 100,
    distanceKm: 840,
    capacityKg: 4000,
    bookedKg: 1500,
    costPerKg: 20.0,
    baseCost: 140,
    carbonKgPerKg: 0.44,
    reliabilityScore: 0.95,
    cutoffTimeMinutesBeforeDeparture: 60,
    status: 'ACTIVE'
  }
];

test('MultimodalRoutingEngine - Speed Post chooses Air while Bulk Parcel chooses Rail', () => {
  const engine = new MultimodalRoutingEngine(sampleHubs, sampleLegs);

  // Speed Post test
  const speedPostRes = engine.computeRoutes({
    originHubId: 'hub-del',
    destHubId: 'hub-bom',
    weightKg: 2.0,
    mailClass: 'SPEED_POST',
    departureTime: '2026-08-15T04:00:00Z'
  });

  assert.ok(speedPostRes.options.length > 0, 'Should return route options');
  const optimalSpeed = speedPostRes.options[0];
  assert.equal(optimalSpeed.legs[0].mode, 'AIR', 'Speed Post should pick AIR mode for optimal route');
  assert.ok(optimalSpeed.rationale.length > 20, 'Should generate natural language rationale');

  // Bulk Parcel test
  const bulkRes = engine.computeRoutes({
    originHubId: 'hub-del',
    destHubId: 'hub-bom',
    weightKg: 50.0,
    mailClass: 'BULK_PARCEL',
    departureTime: '2026-08-15T04:00:00Z'
  });

  assert.ok(bulkRes.options.length > 0);
  const optimalBulk = bulkRes.options[0];
  assert.equal(optimalBulk.legs[0].mode, 'RAIL', 'Bulk Parcel should pick RAIL mode for cost efficiency');
  assert.ok(optimalBulk.totalCost < (sampleLegs[0].baseCost + sampleLegs[0].costPerKg * 50));
});

test('MultimodalRoutingEngine - Multi-leg transfer path (DEL -> BOM -> PNQ)', () => {
  const engine = new MultimodalRoutingEngine(sampleHubs, sampleLegs);

  const res = engine.computeRoutes({
    originHubId: 'hub-del',
    destHubId: 'hub-pnq',
    weightKg: 1.5,
    mailClass: 'SPEED_POST',
    departureTime: '2026-08-15T04:00:00Z'
  });

  assert.ok(res.options.length > 0);
  const route = res.options[0];
  assert.equal(route.legs.length, 2, 'Should have 2 legs: DEL->BOM and BOM->PNQ');
  assert.equal(route.legs[0].destHubId, 'hub-bom');
  assert.equal(route.legs[1].destHubId, 'hub-pnq');
});

test('MultimodalRoutingEngine - Dynamic rerouting on disruption', () => {
  const engine = new MultimodalRoutingEngine(sampleHubs, sampleLegs);

  const disruption: DisruptionEvent = {
    id: 'disrupt-01',
    type: 'FLIGHT_CANCELLED',
    severity: 'CRITICAL',
    title: 'Air India AI-860 Grounded due to technical snag',
    description: 'Aircraft maintenance required',
    affectedLegId: 'leg-del-bom-air',
    impactDeltaMinutes: 300,
    startTime: new Date().toISOString(),
    expectedEndTime: new Date(Date.now() + 86400000).toISOString(),
    status: 'ACTIVE',
    source: 'CARRIER_FEED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  engine.updateDisruptions([disruption]);

  const testConsignment: Consignment = {
    id: 'cs-001',
    trackingNumber: 'SP-IN-2026-001',
    trackingToken: 'tok-abc-123',
    sender: { name: 'Ministry of Finance', pinCode: '110001', city: 'New Delhi' },
    recipient: { name: 'RBI Mumbai', pinCode: '400001', city: 'Mumbai' },
    originHubId: 'hub-del',
    destHubId: 'hub-bom',
    currentHubId: 'hub-del',
    weightKg: 2.0,
    mailClass: 'SPEED_POST',
    priority: 'EXPRESS',
    status: 'INDUCTED',
    currentLegIndex: 0,
    inductionTime: new Date().toISOString(),
    originalETA: new Date(Date.now() + 10000000).toISOString(),
    currentETA: new Date(Date.now() + 10000000).toISOString(),
    etaSlipMinutes: 0,
    riskScore: 0.1,
    riskLevel: 'LOW',
    history: [],
    lastUpdated: new Date().toISOString()
  };

  const proposal = engine.generateReRouteProposal(testConsignment, disruption);

  assert.ok(proposal !== null, 'Should generate a reroute proposal');
  assert.notEqual(proposal?.newRoute.legs[0].legId, 'leg-del-bom-air', 'Should bypass cancelled air leg');
  assert.equal(proposal?.newRoute.legs[0].legId, 'leg-del-bom-rail', 'Should divert to rail route');
});

test('MultimodalRoutingEngine - Capacity constraint saturation triggers alternative leg', () => {
  const customLegs: Leg[] = [
    {
      id: 'leg-del-bom-air-full',
      originHubId: 'hub-del',
      destHubId: 'hub-bom',
      mode: 'AIR',
      carrierName: 'Air India AI-860 (Saturated)',
      serviceCode: 'AI-860',
      departureTime: '06:00',
      arrivalTime: '08:15',
      durationMinutes: 135,
      distanceKm: 1150,
      capacityKg: 5000,
      bookedKg: 4995, // only 5kg available
      costPerKg: 25.0,
      baseCost: 150,
      carbonKgPerKg: 0.48,
      reliabilityScore: 0.95,
      cutoffTimeMinutesBeforeDeparture: 60,
      status: 'ACTIVE'
    },
    {
      id: 'leg-del-bom-rail-avail',
      originHubId: 'hub-del',
      destHubId: 'hub-bom',
      mode: 'RAIL',
      carrierName: 'Mumbai Rajdhani 12952 (Available)',
      serviceCode: '12952-RMS',
      departureTime: '16:55',
      arrivalTime: '08:35',
      durationMinutes: 940,
      distanceKm: 1380,
      capacityKg: 20000,
      bookedKg: 5000, // 15000kg available
      costPerKg: 3.5,
      baseCost: 60,
      carbonKgPerKg: 0.08,
      reliabilityScore: 0.90,
      cutoffTimeMinutesBeforeDeparture: 90,
      status: 'ACTIVE'
    }
  ];

  const engine = new MultimodalRoutingEngine(sampleHubs, customLegs);

  // Request for 20kg consignment (exceeds 5kg air capacity)
  const res = engine.computeRoutes({
    originHubId: 'hub-del',
    destHubId: 'hub-bom',
    weightKg: 20.0,
    mailClass: 'SPEED_POST',
    departureTime: '2026-08-15T04:00:00Z'
  });

  assert.ok(res.options.length > 0, 'Should find route');
  assert.equal(res.options[0].legs[0].legId, 'leg-del-bom-rail-avail', 'Should bypass saturated air leg and select rail');
});

test('MultimodalRoutingEngine - Active Embargo rules block affected destinations', () => {
  const engine = new MultimodalRoutingEngine(sampleHubs, sampleLegs);

  engine.updateEmbargoes([
    {
      id: 'emb-01',
      ruleCode: 'EMB-BOM-SECURITY',
      title: 'Emergency Hub Closure - Mumbai',
      affectedHubIds: ['hub-bom'],
      reason: 'Extreme Weather Flood Warning',
      effectiveFrom: new Date(Date.now() - 3600000).toISOString(),
      effectiveUntil: new Date(Date.now() + 86400000).toISOString(),
      isActive: true,
      createdBy: 'Safety Officer'
    }
  ]);

  // Attempt routing into embargoed hub BOM
  const res = engine.computeRoutes({
    originHubId: 'hub-del',
    destHubId: 'hub-bom',
    weightKg: 2.0,
    mailClass: 'SPEED_POST'
  });

  assert.equal(res.options.length, 0, 'Should return zero routes when destination hub is embargoed');
});

