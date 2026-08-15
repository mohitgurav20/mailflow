# 📮 MailFlow — Intelligent Multimodal Mail Transmission Solution

**Smart India Hackathon 2024** | **Problem Statement ID**: `SIH260461`  
**Ministry / Organization**: Ministry of Communications — Department of Posts (India Post)  
**Category**: Transportation & Logistics · Operational Decision Console  

---

## 🚀 Executive Summary

India Post operates the world's largest postal network with **1,64,999 post offices** across 23 postal circles, processing millions of articles daily. When flights are cancelled, trains delayed, or highways congested, operational planners lack a real-time multimodal decision engine to identify affected consignments and recompute viable alternatives.

**MailFlow** solves this with an explainable, time-expanded multimodal decision engine:
1. **Dynamic Multimodal Routing**: Time-expanded graph search (Dijkstra) with capacity awareness, mail-class weight policies (Speed Post vs Bulk vs Registered), and plain-English operational rationales.
2. **Blast-Radius & Re-route Solver**: Instantly detects cascading failures when a leg/hub breaks, maps affected consignments, and re-solves optimal detours with $\Delta\text{ETA}$ calculations.
3. **EWMA Self-Learning Feedback Loop**: Dynamically adjusts future edge routing penalties using Exponentially Weighted Moving Average punctuality scores.
4. **Operations Control Tower & Live Map**: Interactive React/Vite dashboard, Leaflet network map, citizen tracking portal, and landing page.

---

## 🏗️ Repository Architecture

- `apps/web`: Person 2 Frontend Portal (Control Tower, Dijkstra UI, Leaflet Map, Landing Page, Analytics, Admin Console)
- `apps/api`: Person 1 Backend Services (Express REST API, WebSocket Gateway, Simulation Clock, Adapters)
- `packages/shared-types`: Shared Data Contracts (Hubs, Legs, Consignments, Disruptions, Embargoes)
- `packages/routing-engine`: Multimodal Dijkstra Routing Engine
