# MailFlow REST & WebSocket API Specification
**Problem Statement ID**: SIH260461 (Ministry of Communication · Department of Posts)  
**Base URL**: `http://localhost:5000/api`  
**WebSocket Gateway**: `ws://localhost:5000`

---

## 1. Network Topology

### `GET /network/hubs`
Returns all 25 strategic India Post sorting and transit hubs (NSH, ICH, TMO, Parcel Hubs).

**Response (200 OK):**
```json
{
  "success": true,
  "count": 25,
  "data": [
    {
      "id": "hub-del",
      "code": "DEL-NSH",
      "name": "Delhi National Sorting Hub",
      "circle": "Delhi Postal Circle",
      "tier": "NSH",
      "state": "Delhi",
      "latitude": 28.6139,
      "longitude": 77.2090,
      "processingCapacityKg": 50000,
      "currentLoadKg": 14200,
      "averageSortTimeMinutes": 45,
      "operationalStatus": "OPERATIONAL"
    }
  ]
}
```

### `GET /network/legs`
Returns multimodal scheduled transport legs (Air, Rail RMS, Mail Motor Service Road, Hired Road, Water).

**Query Parameters:**
- `mode` (optional): `AIR`, `RAIL`, `MMS_ROAD`, `HIRED_ROAD`, `WATER`

### `GET /network/overview`
Returns high-level network operational health metrics.

---

## 2. Dynamic Multimodal Routing Brain

### `POST /routes/compute`
Calculates top 3 diverse, explainable multimodal routes using time-expanded Dijkstra search.

**Request Body:**
```json
{
  "originHubId": "hub-del",
  "destHubId": "hub-bom",
  "weightKg": 2.5,
  "mailClass": "SPEED_POST",
  "priority": "EXPRESS",
  "departureTime": "2026-08-15T06:00:00Z"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "originHub": { "id": "hub-del", "code": "DEL-NSH", "name": "Delhi National Sorting Hub" },
    "destHub": { "id": "hub-bom", "code": "BOM-NSH", "name": "Mumbai National Sorting Hub" },
    "weightKg": 2.5,
    "mailClass": "SPEED_POST",
    "options": [
      {
        "routeId": "route-1771158000-a1b2c",
        "rank": 1,
        "tag": "OPTIMAL",
        "mailClass": "SPEED_POST",
        "totalCost": 211.25,
        "totalDurationMinutes": 135,
        "departureTime": "2026-08-15T06:30:00.000Z",
        "estimatedDeliveryTime": "2026-08-15T08:45:00.000Z",
        "confidenceScore": 0.94,
        "carbonFootprintKg": 1.20,
        "legs": [
          {
            "legId": "leg-del-bom-air-1",
            "originHubId": "hub-del",
            "destHubId": "hub-bom",
            "mode": "AIR",
            "carrierName": "Air India Cargo AI-860",
            "serviceCode": "AI-860",
            "scheduledDeparture": "2026-08-15T06:30:00.000Z",
            "scheduledArrival": "2026-08-15T08:45:00.000Z",
            "durationMinutes": 135,
            "cost": 211.25,
            "reliabilityScore": 0.94
          }
        ],
        "rationale": "Selected High-speed dedicated Air Cargo (Air India Cargo AI-860). Delivers in 2.3h with a 94% reliability confidence score. Prioritizes SLA adherence while keeping handling cost at ₹211.25."
      }
    ]
  }
}
```

---

## 3. Consignment Operations & Induction

### `POST /consignments`
Inducts a single consignment, assigns optimal or selected route, generates tracking token, and logs audit record.

### `GET /consignments`
Lists all consignments with optional filters:
- `status`: `INDUCTED`, `IN_TRANSIT`, `AT_HUB`, `REROUTED`, `DELIVERED`, etc.
- `mailClass`: `SPEED_POST`, `REGISTERED`, `BULK_PARCEL`
- `hubId`: Filter by origin, destination, or current location.
- `search`: Search by tracking number, sender, or recipient.

### `GET /consignments/:id`
Returns full lifecycle details, real-time risk score, and chronological event history.

### `POST /consignments/bulk-upload`
Inducts multiple consignments from CSV format or JSON records in a single transactional batch.

---

## 4. Disruption Center & Blast Radius Re-solve

### `POST /disruptions`
Triggers an operational disruption (flight cancellation, train delay, road block, severe weather). Automatically computes the **Blast Radius** identifying all affected consignments and calculates dynamic re-route proposals with $\Delta\text{ETA}$.

**Request Body:**
```json
{
  "type": "FLIGHT_CANCELLED",
  "severity": "CRITICAL",
  "title": "Air India AI-860 Cancelled (Delhi -> Mumbai)",
  "description": "Dense fog at IGI airport below CAT-III mins",
  "affectedHubId": "hub-del",
  "affectedLegId": "leg-del-bom-air-1",
  "impactDeltaMinutes": 240
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "disruptionId": "disrupt-1771158000-88a1",
    "disruption": { ... },
    "affectedConsignmentsCount": 6,
    "totalVolumeWeightKg": 15.2,
    "proposals": [
      {
        "consignmentId": "cs-1001",
        "trackingNumber": "SP-IN-2026-1001",
        "currentHubId": "hub-del",
        "newRoute": { ... },
        "newETA": "2026-08-15T16:15:00.000Z",
        "deltaMinutes": 450,
        "costDifferenceINR": -52.0,
        "recommendedAction": "APPLY_REROUTE",
        "reason": "Disruption on Air India AI-860. Re-routed via Mumbai Rajdhani Exp (12952-RMS)."
      }
    ],
    "summary": {
      "averageDelayMinutes": 450,
      "additionalCostINR": -312.0,
      "slaBreachCount": 2
    }
  }
}
```

### `POST /disruptions/:id/resolve`
Approves bulk re-route proposals, updates consignment routes, sends proactive customer notifications (Resend email / SMS), updates EWMA reliability on the disrupted leg, and restores network status.

---

## 5. Capacity Bookings & Manifest Handshake

### `POST /bookings/confirm`
Confirms capacity reservation on carrier leg, increments booked weight, and generates formal EDI manifest number (`MNF-INPOST-...`).

---

## 6. EWMA Self-Learning Reliability

### `GET /reliability/scores`
Returns the EWMA on-time punctuality scores and performance trends (`IMPROVING`, `STABLE`, `DEGRADING`) across all legs.

### `POST /reliability/record-trip`
Records completed trip metrics (`delayMinutes`, `wasCancelled`), dynamically updating future route weights.

---

## 7. Embargo Engine & Audit Logs

### `GET /embargoes` & `POST /embargoes` & `PATCH /embargoes/:id`
Manages postal embargo rules (hazardous goods, security circulars, weather closures).

### `GET /audit-logs`
Returns tamper-evident audit logs with actor identity, action type, previous state, and new state.

---

## 8. Public Citizen Tracking

### `GET /track/:token`
Public unauthenticated tracking portal endpoint returning real-time status, timeline, map route legs, revised ETA, and carbon footprint.

---

## 9. Accelerated 5-Minute Simulation Clock

### `GET /simulation/state`
Returns active virtual simulation time, speed multiplier (60x), and active consignment counts.

### `POST /simulation/start`
Starts accelerated 5-minute full ops day simulation.

### `POST /simulation/stop`
Pauses simulation clock.

### `POST /simulation/reset`
Resets simulation with 20 fresh India Post consignments.

### `POST /simulation/step`
Steps simulation forward by `deltaMinutes` (e.g. 15 minutes).

---

## 10. WebSocket Gateway Protocol

Connect to `ws://localhost:5000`.

**Event Envelope:**
```json
{
  "type": "CONSIGNMENT_UPDATED",
  "payload": { ... },
  "timestamp": "2026-08-15T08:30:00.000Z"
}
```

**Supported Event Types:**
- `INITIAL_STATE`: Sent upon client connection.
- `CONSIGNMENT_INDUCTED`: New consignment inducted.
- `CONSIGNMENT_UPDATED`: Consignment transit location or status change.
- `CONSIGNMENT_DELIVERED`: Final delivery recorded.
- `DISRUPTION_TRIGGERED`: Live disruption and blast radius alert.
- `BLAST_RADIUS_COMPUTED`: Re-route proposals generated.
- `DISRUPTION_RESOLVED`: Re-route execution applied.
- `RELIABILITY_UPDATED`: EWMA score recalculation event.
- `WEATHER_ALERT`: Meteorological hazard detected.
- `NOTIFICATION_SENT`: Proactive email/SMS notification dispatch.
- `SIMULATION_TICK`: Virtual time advancement and telemetry state.
