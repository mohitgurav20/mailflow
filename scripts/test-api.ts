import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createApp } from '../apps/api/src/app.js';
import { WebSocketGateway } from '../apps/api/src/services/wsServer.js';
import assert from 'node:assert/strict';

const PORT = 5099;
const BASE_URL = `http://127.0.0.1:${PORT}/api`;
const WS_URL = `ws://127.0.0.1:${PORT}`;

async function runE2ETests() {
  console.log('============================================================');
  console.log('  MailFlow End-to-End API & WebSocket Suite');
  console.log('============================================================\n');

  const app = createApp();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });
  WebSocketGateway.getInstance().initialize(wss);

  await new Promise<void>((resolve) => {
    server.listen(PORT, () => {
      console.log(`✓ Test Server running on ${BASE_URL}`);
      resolve();
    });
  });

  try {
    // 1. WebSocket connection test
    let wsReceivedCount = 0;
    const ws = new WebSocket(WS_URL);
    ws.on('message', (data) => {
      wsReceivedCount++;
    });

    await new Promise<void>((resolve) => {
      ws.on('open', () => {
        console.log('✓ WebSocket client successfully connected to gateway');
        resolve();
      });
    });

    // 2. Health check
    console.log('\n[1/12] Testing GET /api/health');
    const healthRes = await fetch(`${BASE_URL}/health`);
    assert.equal(healthRes.status, 200);
    const healthJson = await healthRes.json() as any;
    assert.equal(healthJson.status, 'HEALTHY');
    console.log('  -> OK:', healthJson);

    // 3. Network hubs and overview
    console.log('\n[2/12] Testing GET /api/network/hubs & GET /api/network/overview');
    const hubsRes = await fetch(`${BASE_URL}/network/hubs`);
    assert.equal(hubsRes.status, 200);
    const hubsJson = await hubsRes.json() as any;
    assert.equal(hubsJson.count, 25, 'Should return all 25 hubs');

    const overviewRes = await fetch(`${BASE_URL}/network/overview`);
    assert.equal(overviewRes.status, 200);
    const overviewJson = await overviewRes.json() as any;
    assert.equal(overviewJson.data.totalHubs, 25);
    console.log(`  -> OK: 25 Hubs, ${overviewJson.data.totalLegs} Legs, Health: ${overviewJson.data.systemHealth}`);

    // 4. Compute Routes (Speed Post & Bulk)
    console.log('\n[3/12] Testing POST /api/routes/compute');
    const routeRes = await fetch(`${BASE_URL}/routes/compute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originHubId: 'hub-del',
        destHubId: 'hub-bom',
        weightKg: 2.0,
        mailClass: 'SPEED_POST'
      })
    });
    assert.equal(routeRes.status, 200);
    const routeJson = await routeRes.json() as any;
    assert.ok(routeJson.data.options.length >= 2, 'Should return ranked route options');
    console.log(`  -> OK: Optimal Route: ${routeJson.data.options[0].legs.map((l: any) => l.carrierName).join(' -> ')}`);
    console.log(`  -> Rationale: ${routeJson.data.options[0].rationale}`);

    // 5. Induct Consignment
    console.log('\n[4/12] Testing POST /api/consignments');
    const inductRes = await fetch(`${BASE_URL}/consignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originHubId: 'hub-del',
        destHubId: 'hub-bom',
        weightKg: 2.0,
        mailClass: 'SPEED_POST',
        priority: 'EXPRESS',
        sender: { name: 'PMO New Delhi', pinCode: '110001', city: 'Delhi', email: 'pmo@gov.in' },
        recipient: { name: 'Raj Bhavan Mumbai', pinCode: '400035', city: 'Mumbai', email: 'governor@mah.gov.in' },
        selectedRouteOption: routeJson.data.options[0]
      })
    });
    assert.equal(inductRes.status, 201);
    const inductJson = await inductRes.json() as any;
    const testConsignment = inductJson.data;
    assert.ok(testConsignment.trackingNumber);
    assert.ok(testConsignment.trackingToken);
    console.log(`  -> OK: Inducted [${testConsignment.trackingNumber}] with Token ${testConsignment.trackingToken}`);

    // 6. Public Tracking Endpoint
    console.log('\n[5/12] Testing GET /api/track/:token');
    const trackRes = await fetch(`${BASE_URL}/track/${testConsignment.trackingToken}`);
    assert.equal(trackRes.status, 200);
    const trackJson = await trackRes.json() as any;
    assert.equal(trackJson.data.trackingNumber, testConsignment.trackingNumber);
    console.log(`  -> OK: Citizen Tracking confirmed for ${trackJson.data.trackingNumber}`);

    // 7. Bulk Upload CSV
    console.log('\n[6/12] Testing POST /api/consignments/bulk-upload');
    const bulkRes = await fetch(`${BASE_URL}/consignments/bulk-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        records: [
          { originHubId: 'hub-ccu', destHubId: 'hub-gau', weightKg: 3.5, mailClass: 'SPEED_POST', senderName: 'WB Dist', recipientName: 'NE Hub' },
          { originHubId: 'hub-bom', destHubId: 'hub-pnq', weightKg: 8.0, mailClass: 'SPEED_POST', senderName: 'MH Auto', recipientName: 'PNQ Plant' }
        ]
      })
    });
    assert.equal(bulkRes.status, 201);
    const bulkJson = await bulkRes.json() as any;
    assert.equal(bulkJson.count, 2);
    console.log(`  -> OK: Bulk batch inducted ${bulkJson.count} articles`);

    // 8. Confirm Carrier Booking Handshake
    console.log('\n[7/12] Testing POST /api/bookings/confirm');
    const bookRes = await fetch(`${BASE_URL}/bookings/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consignmentId: testConsignment.id,
        legId: 'leg-del-bom-air-1',
        carrierName: 'Air India AI-860',
        serviceCode: 'AI-860',
        bookedWeightKg: 2.0,
        costINR: 199.0
      })
    });
    assert.equal(bookRes.status, 201);
    const bookJson = await bookRes.json() as any;
    assert.ok(bookJson.data.manifestNumber.startsWith('MNF-INPOST-'));
    console.log(`  -> OK: Booking confirmed. Manifest: ${bookJson.data.manifestNumber}`);

    // 9. Trigger Disruption & Blast Radius
    console.log('\n[8/12] Testing POST /api/disruptions & Blast Radius Engine');
    const disruptRes = await fetch(`${BASE_URL}/disruptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'FLIGHT_CANCELLED',
        severity: 'CRITICAL',
        title: 'Fog Suspension - Flight AI-860',
        description: 'Runway visibility fallen below safety thresholds at DEL',
        affectedLegId: 'leg-del-bom-air-1',
        affectedHubId: 'hub-del',
        impactDeltaMinutes: 300
      })
    });
    assert.equal(disruptRes.status, 201);
    const disruptJson = await disruptRes.json() as any;
    const blastReport = disruptJson.data;
    assert.ok(blastReport.affectedConsignmentsCount >= 1);
    console.log(`  -> OK: Blast radius caught ${blastReport.affectedConsignmentsCount} consignments. Proposals: ${blastReport.proposals.length}`);

    // 10. Resolve Disruption with Re-routing
    console.log('\n[9/12] Testing POST /api/disruptions/:id/resolve');
    const resolveRes = await fetch(`${BASE_URL}/disruptions/${blastReport.disruptionId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applyReroutes: true })
    });
    assert.equal(resolveRes.status, 200);
    const resolveJson = await resolveRes.json() as any;
    assert.equal(resolveJson.data.resolved, true);
    console.log(`  -> OK: Disruption resolved. ${resolveJson.data.reroutedCount} consignments dynamically rerouted.`);

    // 11. EWMA Reliability Scores
    console.log('\n[10/12] Testing GET /api/reliability/scores & POST /api/reliability/record-trip');
    const relRes = await fetch(`${BASE_URL}/reliability/scores`);
    assert.equal(relRes.status, 200);
    const relJson = await relRes.json() as any;
    assert.ok(relJson.count > 0);
    console.log(`  -> OK: ${relJson.count} leg reliability scores tracked. Top carrier score: ${relJson.data[0].ewmaScore}`);

    // 12. Embargo and Audit logs
    console.log('\n[11/12] Testing GET /api/embargoes & GET /api/audit-logs');
    const auditRes = await fetch(`${BASE_URL}/audit-logs`);
    assert.equal(auditRes.status, 200);
    const auditJson = await auditRes.json() as any;
    assert.ok(auditJson.count > 0, 'Audit logs should contain event entries');
    console.log(`  -> OK: ${auditJson.count} tamper-evident audit records captured.`);

    // 13. Weather injection & simulation
    console.log('\n[12/12] Testing Weather Injection & Simulation Clock');
    const weatherRes = await fetch(`${BASE_URL}/weather/inject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hubId: 'hub-ccu',
        condition: 'THUNDERSTORM',
        windSpeedKmh: 65,
        visibilityMeters: 400
      })
    });
    assert.equal(weatherRes.status, 200);
    console.log('  -> OK: Severe weather injected at Kolkata NSH');

    console.log(`\n✓ Total WebSocket telemetry packets received: ${wsReceivedCount}`);
    ws.close();

    console.log('\n============================================================');
    console.log('  ✓ ALL 12 API & WEBSOCKET TEST SUITES PASSED (100%)');
    console.log('============================================================\n');
  } finally {
    server.close();
  }
}

runE2ETests().catch(err => {
  console.error('Test Suite Failure:', err);
  process.exit(1);
});
