# 📮 MailFlow — Intelligent Multimodal Mail Transmission Solution

**Smart India Hackathon 2026** | **Problem Statement ID**: `SIH260461`  
**Ministry / Organization**: Ministry of Communication — Department of Posts (India Post)  
**Category**: Transportation & Logistics · Decision-Support Console  
**Ownership Scope**: **Person 1** (Full Backend + Routing Brain + Intelligence + Simulation + Alerts + Data)

---

## 🚀 Executive Summary

India Post operates the world's largest postal network with **1,64,999 post offices** across 23 postal circles, processing millions of articles daily. However, intermediate transmission routing between National Sorting Hubs (NSHs) and Intra-Circle Hubs (ICHs) remains largely static and schedule-driven. When flights are cancelled, trains delayed, or highways congested, operational planners lack a real-time multimodal decision engine to identify affected consignments and recompute viable alternatives.

**MailFlow** solves this with an explainable, time-expanded multimodal decision engine:
1. **Dynamic Multimodal Routing**: Time-expanded graph search (Dijkstra) with capacity awareness, mail-class weight policies (Speed Post vs Bulk vs Registered), and plain-English operational rationales.
2. **Blast-Radius & Re-route Solver**: Instantly detects cascading failures when a leg/hub breaks, maps affected consignments, and re-solves optimal detours with $\Delta\text{ETA}$ calculations.
3. **EWMA Self-Learning Feedback Loop**: Dynamically adjusts future edge routing penalties using Exponentially Weighted Moving Average punctuality scores.
4. **Proactive Citizen Alerts & Live Tracking**: Automatically fires alerts on route changes and revised ETAs with a public tracking portal.
5. **Real-Time Telemetry & Simulation**: Accelerated 5-minute operational day clock with WebSocket streaming.

---

## 🏛 Architecture & Ownership Split

```
mailflow/
├── packages/
│   ├── shared-types/      # [FROZEN CONTRACT] Full TypeScript models & interfaces
│   └── routing-engine/    # [PERSON 1] Time-expanded graph, multi-objective Dijkstra, rationale generator
├── apps/
│   ├── api/               # [PERSON 1] Express + TypeScript REST API, WebSockets, adapters, simulation
│   └── web/               # [PERSON 2] React console, interactive Leaflet map, Control Tower UX
├── data/
│   ├── hubs.json          # 25 Strategic Indian Postal Hubs (NSH, ICH, TMO, Parcel Hubs)
│   └── legs.json          # 120+ Scheduled Multimodal Legs (Air, Rail RMS, MMS Road, Freight, Water)
├── scripts/
│   ├── seed.ts            # Network graph validator & routing benchmark runner
│   ├── sim-clock.ts       # 5-minute accelerated operations day simulation
│   └── sample-induction.csv # Bulk consignment upload template
├── docs/
│   └── api.md             # Complete REST API and WebSocket specification
└── README.md
```

---

## ⚡ Quickstart & Setup

### Prerequisites
- Node.js `v18+` (Tested on Node `v24.14.1`)
- npm `v9+`

### 1. Install Dependencies & Build Packages
```bash
npm install
npm run build
```

### 2. Run Routing Engine Unit Tests
```bash
npm test
# or specifically for routing-engine
npm run test:engine
```

### 3. Verify Network Topology & Seed Data
```bash
npm run seed
```

### 4. Run Accelerated 5-Minute Full Ops Day Simulation
```bash
npm run sim
```

### 5. Start API Server & WebSocket Gateway
```bash
npm run dev:api
```
Server will start on:
- **HTTP REST API**: `http://localhost:5000/api`
- **WebSocket Stream**: `ws://localhost:5000`
- **Health Check**: `http://localhost:5000/api/health`

---

## 📡 REST API & WebSocket Highlights

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/health` | `GET` | System health check and status |
| `/api/network/hubs` | `GET` | 25 Strategic Indian Postal Hubs |
| `/api/network/legs` | `GET` | Multimodal transport legs (Air, Rail, MMS, Hired Road, Water) |
| `/api/routes/compute` | `POST` | Calculates top 3 ranked routes (Optimal, Fastest, Economical) |
| `/api/consignments` | `POST` | Inducts consignment and assigns optimal route |
| `/api/consignments/bulk-upload` | `POST` | Inducts batch consignments from CSV/JSON |
| `/api/disruptions` | `POST` | Triggers disruption & computes Blast Radius with $\Delta\text{ETA}$ proposals |
| `/api/disruptions/:id/resolve` | `POST` | Approves re-routing, sends proactive alerts, updates EWMA |
| `/api/bookings/confirm` | `POST` | Manifest handshake and carrier space reservation |
| `/api/reliability/scores` | `GET` | EWMA on-time punctuality scores and performance trends |
| `/api/embargoes` | `GET/POST` | Active hazardous goods and hub embargo policies |
| `/api/audit-logs` | `GET` | Full immutable audit trail of operational decisions |
| `/api/track/:token` | `GET` | Citizen tracking portal status & live timeline |
| `/api/simulation/start` | `POST` | Starts virtual simulation clock (1s = 10 min ops) |

See [docs/api.md](docs/api.md) for full request/response schemas.

---

## 🏆 Key Demonstration Scenarios (For Judges)

1. **Explainable Multimodal Optimization**:
   - Query `POST /api/routes/compute` for `SPEED_POST` from Delhi (`hub-del`) to Mumbai (`hub-bom`) $\to$ selects **Air Cargo AI-860** (Duration: 2.3h).
   - Query for `BULK_PARCEL` $\to$ selects **Mumbai Rajdhani 12952-RMS** (Low handling cost, high volume).
2. **One-Click Blast Radius & Reroute**:
   - Incur disruption on `leg-del-bom-air-1` (Flight Cancelled).
   - Blast Radius immediately flags all in-transit parcels, calculates alternative via **Rajdhani Express** + **IndiGo 6E-2055**, estimates revised ETA, and outputs clear English rationale.
3. **EWMA Reliability Self-Learning**:
   - On leg cancellation, leg reliability decreases dynamically (e.g. $0.94 \to 0.76$), automatically deprioritizing that carrier in future routing rounds.
>>>>>>> 5b9167c (feat: complete Person 1 backend, multimodal routing brain, simulation & APIs (SIH260461))
