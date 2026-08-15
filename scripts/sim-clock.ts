import { DataStore } from '../apps/api/src/services/store.js';
import { RoutingService } from '../apps/api/src/services/routingService.js';
import { DisruptionService } from '../apps/api/src/services/disruptionService.js';
import { LearningService } from '../apps/api/src/services/learningService.js';
import { Consignment } from '@mailflow/shared-types';

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runSimClock() {
  console.log(`
================================================================================
  MailFlow - 5-Minute Accelerated Full-Day Operations & Disruption Simulation
  SIH260461 - Dynamic Mail Transmission Solution (Department of Posts)
================================================================================
  `);

  const store = DataStore.getInstance();
  const routing = RoutingService.getInstance();
  const disruptionService = DisruptionService.getInstance();
  const learning = LearningService.getInstance();

  let simTime = new Date('2026-08-15T06:00:00Z');
  console.log(`[T=06:00 AM IST] System Initialized. Inducting morning batch consignments across Indian hubs...`);

  // Induct sample consignments
  const batch = [
    { origin: 'hub-del', dest: 'hub-bom', weight: 2.5, mailClass: 'SPEED_POST' as const, id: 'SP-DEL-BOM-101', name: 'Govt Official Notification' },
    { origin: 'hub-del', dest: 'hub-bom', weight: 1.8, mailClass: 'SPEED_POST' as const, id: 'SP-DEL-BOM-102', name: 'Judicial Court Documents' },
    { origin: 'hub-del', dest: 'hub-pnq', weight: 3.0, mailClass: 'SPEED_POST' as const, id: 'SP-DEL-PNQ-201', name: 'Medical Lab Specimens' },
    { origin: 'hub-del', dest: 'hub-blr', weight: 2.2, mailClass: 'SPEED_POST' as const, id: 'SP-DEL-BLR-301', name: 'High-Value Electronics Component' },
    { origin: 'hub-ccu', dest: 'hub-gau', weight: 4.0, mailClass: 'SPEED_POST' as const, id: 'SP-CCU-GAU-401', name: 'Assam Tea Board Dispatch' },
    { origin: 'hub-bom', dest: 'hub-del', weight: 25.0, mailClass: 'BULK_PARCEL' as const, id: 'BP-BOM-DEL-501', name: 'Commercial Merchandise' },
    { origin: 'hub-maa', dest: 'hub-ixz', weight: 1.5, mailClass: 'SPEED_POST' as const, id: 'SP-MAA-IXZ-601', name: 'Emergency Island Medicine' }
  ];

  for (const item of batch) {
    const routeRes = routing.computeRoutes({
      originHubId: item.origin,
      destHubId: item.dest,
      weightKg: item.weight,
      mailClass: item.mailClass,
      departureTime: simTime.toISOString(),
      preferredModes: item.origin === 'hub-del' && item.dest === 'hub-bom' ? ['AIR'] : undefined
    });

    let route = routeRes.options[0];
    // For demo narrative, route DEL-BOM via AI-860 morning cargo flight
    if (item.id.startsWith('SP-DEL-BOM') && routeRes.options.length > 1) {
      const aiRoute = routeRes.options.find(o => o.legs.some(l => l.legId === 'leg-del-bom-air-1'));
      if (aiRoute) route = aiRoute;
    }
    const consignment: Consignment = {
      id: `cs-${item.id}`,
      trackingNumber: item.id,
      trackingToken: `tok-${item.id.toLowerCase()}`,
      sender: { name: 'Induction Point', pinCode: '110001', city: item.origin, email: 'sender@mailflow.gov.in' },
      recipient: { name: 'Recipient Office', pinCode: '400001', city: item.dest, email: 'citizen@example.gov.in' },
      originHubId: item.origin,
      destHubId: item.dest,
      currentHubId: item.origin,
      currentLegId: route?.legs[0]?.legId || null,
      weightKg: item.weight,
      mailClass: item.mailClass,
      priority: 'EXPRESS',
      status: 'INDUCTED',
      contentsDescription: item.name,
      selectedRouteOption: route,
      currentLegIndex: 0,
      inductionTime: simTime.toISOString(),
      originalETA: route?.estimatedDeliveryTime || new Date(simTime.getTime() + 10 * 3600000).toISOString(),
      currentETA: route?.estimatedDeliveryTime || new Date(simTime.getTime() + 10 * 3600000).toISOString(),
      etaSlipMinutes: 0,
      riskScore: 0.1,
      riskLevel: 'LOW',
      history: [
        {
          timestamp: simTime.toISOString(),
          locationHubId: item.origin,
          eventType: 'INDUCTED',
          description: `Inducted article ${item.id}. Assigned route: ${route?.legs.map(l => l.carrierName).join(' ➔ ')}`
        }
      ],
      lastUpdated: simTime.toISOString()
    };

    store.consignments.set(consignment.id, consignment);
    console.log(`  ✓ Inducted [${consignment.trackingNumber}] (${consignment.mailClass}) -> Route: ${route?.legs.map(l => l.carrierName).join(' ➔ ')} (ETA: ${new Date(consignment.currentETA).toLocaleTimeString()})`);
  }

  // Progress 1 hour
  await sleep(1500);
  simTime = new Date(simTime.getTime() + 60 * 60 * 1000);
  console.log(`\n[T=07:00 AM IST] Morning flights and mail express trains depart. Consignments transitioned to IN_TRANSIT.`);
  for (const c of store.consignments.values()) {
    c.status = 'IN_TRANSIT';
  }

  // Progress to 08:30 AM IST - Incur Disruption
  await sleep(2000);
  simTime = new Date(simTime.getTime() + 90 * 60 * 1000);
  console.log(`\n--------------------------------------------------------------------------------`);
  console.log(`[T=08:30 AM IST] ⚠️ CRITICAL DISRUPTION DETECTED`);
  console.log(`Carrier Alert: Air India AI-860 (DEL -> BOM) CANCELLED due to dense runway fog & tech maintenance.`);
  console.log(`--------------------------------------------------------------------------------`);

  const report = disruptionService.triggerDisruption({
    type: 'FLIGHT_CANCELLED',
    severity: 'CRITICAL',
    title: 'Air India AI-860 Cancelled (Delhi -> Mumbai)',
    description: 'Aircraft grounded due to visibility and technical inspection.',
    affectedHubId: 'hub-del',
    affectedLegId: 'leg-del-bom-air-1',
    impactDeltaMinutes: 300,
    startTime: simTime.toISOString(),
    expectedEndTime: new Date(simTime.getTime() + 6 * 3600000).toISOString(),
    status: 'ACTIVE',
    source: 'CARRIER_FEED'
  });

  console.log(`\n[BLAST RADIUS ENGINE RESULTS]:`);
  console.log(`  - Affected Consignments: ${report.affectedConsignmentsCount}`);
  console.log(`  - Total Affected Volume: ${report.totalVolumeWeightKg} kg`);
  console.log(`  - Average Delay Delta:   +${report.summary.averageDelayMinutes} minutes`);
  console.log(`  - Potential SLA Breaches: ${report.summary.slaBreachCount}`);

  console.log(`\n[DYNAMIC RE-ROUTE PROPOSALS GENERATED]:`);
  report.proposals.forEach((p, idx) => {
    console.log(`  ${idx + 1}. Consignment ${p.trackingNumber}:`);
    console.log(`     Original Route: AI-860 (Cancelled)`);
    console.log(`     New Route:      ${p.newRoute.legs.map(l => `${l.carrierName} (${l.mode})`).join(' ➔ ')}`);
    console.log(`     Revised ETA:    ${new Date(p.newETA).toLocaleTimeString()} (Delta: +${p.deltaMinutes}m, Cost Diff: ₹${p.costDifferenceINR})`);
    console.log(`     Rationale:      ${p.newRoute.rationale}`);
  });

  // Resolve Disruption
  await sleep(2500);
  console.log(`\n[T=08:45 AM IST] Operations Planner Approves Bulk Re-route Execution.`);
  const resolution = await disruptionService.resolveDisruption(report.disruptionId, { applyReroutes: true });
  console.log(`  ✓ Re-routed ${resolution.reroutedCount} consignments.`);
  console.log(`  ✓ Dispatched ${resolution.notificationsSent} proactive citizen email & SMS alerts.`);

  // Check updated EWMA reliability
  const aiScore = store.reliabilityScores.get('leg-del-bom-air-1');
  console.log(`\n[EWMA SELF-LEARNING UPDATE]:`);
  console.log(`  Leg: Air India AI-860 (DEL-BOM)`);
  console.log(`  Previous Baseline Reliability: ${aiScore?.baselineScore}`);
  console.log(`  Updated EWMA Reliability:      ${aiScore?.ewmaScore} (${aiScore?.trend})`);
  console.log(`  Total Trips Recorded:          ${aiScore?.totalTripsRecorded} (Cancelled: ${aiScore?.cancelledTrips})`);

  // Progress to afternoon/evening - Final Deliveries
  await sleep(2000);
  simTime = new Date(simTime.getTime() + 6 * 60 * 1000 * 60);
  console.log(`\n[T=04:45 PM IST] Consignments arrive at destination sorting hubs via alternative multimodal legs.`);
  for (const c of store.consignments.values()) {
    c.status = 'DELIVERED';
    c.currentHubId = c.destHubId;
    console.log(`  ✓ DELIVERED: [${c.trackingNumber}] at ${c.destHubId} (Slip: ${c.etaSlipMinutes}m, Risk: ${c.riskLevel})`);
  }

  console.log(`\n================================================================================`);
  console.log(`  Simulation Complete: Full Operational Day Finished with Zero Data Loss`);
  console.log(`  Full Audit Trail Logged: ${store.auditLogs.length} audit entries captured.`);
  console.log(`================================================================================\n`);
}

runSimClock().catch(err => {
  console.error('Simulation error:', err);
  process.exit(1);
});
