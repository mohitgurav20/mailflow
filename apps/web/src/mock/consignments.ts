import { Consignment } from '@mailflow/shared-types';

// Real-format India Post consignments
// Tracking numbers follow official India Post format: [SP/RP/BP] + 9 digits + [IN]
// Sender/Receiver names are realistic Indian citizens, institutions, and businesses
export const INITIAL_CONSIGNMENTS: Consignment[] = [
  // ── 1. Speed Post — Government Document (DEL → BOM) ──────────────────
  {
    id: 'con-001',
    trackingNumber: 'SP892019482IN',
    senderName: 'Priya Sharma',
    senderCity: 'New Delhi',
    receiverName: 'Rajesh Mehta',
    receiverCity: 'Mumbai',
    originHubId: 'hub-delhi',
    destHubId: 'hub-mumbai',
    weightKg: 0.4,
    mailClass: 'SPEED_POST',
    status: 'IN_TRANSIT',
    currentHubId: 'hub-delhi',
    currentLegId: 'leg-air-del-bom',
    targetSlaHours: 24,
    elapsedHours: 4,
    originalEta: '2026-08-16 10:00',
    currentEta: '2026-08-16 10:00',
    isDelayedRisk: false,
    assignedRouteLegIds: ['leg-air-del-bom'],
    timeline: [
      {
        id: 't1-001',
        timestamp: '2026-08-15 08:30',
        hubId: 'hub-delhi',
        hubName: 'Delhi NSH',
        statusText: 'Booked at counter. Weighed and billed.',
        location: 'New Delhi GPO, Sansad Marg'
      },
      {
        id: 't2-001',
        timestamp: '2026-08-15 09:15',
        hubId: 'hub-delhi',
        hubName: 'Delhi NSH',
        statusText: 'Bagged and dispatched to IGI Airport TMO.',
        location: 'Delhi National Sorting Hub'
      },
      {
        id: 't3-001',
        timestamp: '2026-08-15 11:40',
        hubId: 'hub-delhi',
        hubName: 'Delhi NSH',
        statusText: 'Loaded onto Air India Cargo AI-807. Ready for departure.',
        location: 'IGI Airport Cargo Terminal, T3'
      }
    ]
  },

  // ── 2. Business Parcel — UPSC Examination Material (DEL → CCU) ─────────
  {
    id: 'con-002',
    trackingNumber: 'BP401928374IN',
    senderName: 'UPSC Examination Division',
    senderCity: 'New Delhi',
    receiverName: 'Arun Kumar Bose',
    receiverCity: 'Kolkata',
    originHubId: 'hub-delhi',
    destHubId: 'hub-kolkata',
    weightKg: 3.2,
    mailClass: 'BUSINESS_PARCEL',
    status: 'IN_TRANSIT',
    currentHubId: 'hub-delhi',
    currentLegId: 'leg-air-del-ccu',
    targetSlaHours: 36,
    elapsedHours: 8,
    originalEta: '2026-08-16 18:00',
    currentEta: '2026-08-16 18:00',
    isDelayedRisk: false,
    assignedRouteLegIds: ['leg-air-del-ccu'],
    timeline: [
      {
        id: 't1-002',
        timestamp: '2026-08-15 06:00',
        hubId: 'hub-delhi',
        hubName: 'Delhi NSH',
        statusText: 'Bulk parcel inducted at sorting facility.',
        location: 'Delhi NSH, Dock 4'
      },
      {
        id: 't2-002',
        timestamp: '2026-08-15 07:30',
        hubId: 'hub-delhi',
        hubName: 'Delhi NSH',
        statusText: 'Manifested on Air India AI-702. Space reserved.',
        location: 'Delhi NSH Air Dispatch Section'
      }
    ]
  },

  // ── 3. Speed Post — Delayed Risk (BOM → GAU via CCU) ──────────────────
  {
    id: 'con-003',
    trackingNumber: 'SP102938475IN',
    senderName: 'Sunita Patel',
    senderCity: 'Mumbai',
    receiverName: 'Dhruv Borah',
    receiverCity: 'Guwahati',
    originHubId: 'hub-mumbai',
    destHubId: 'hub-guwahati',
    weightKg: 1.1,
    mailClass: 'SPEED_POST',
    status: 'DELAYED_RISK',
    currentHubId: 'hub-kolkata',
    currentLegId: 'leg-air-ccu-gau',
    targetSlaHours: 48,
    elapsedHours: 34,
    originalEta: '2026-08-16 10:00',
    currentEta: '2026-08-16 18:30',
    isDelayedRisk: true,
    delayReason: 'Connecting flight 6E-512 capacity constraints due to Monsoon Season surge at NSCBI Airport.',
    assignedRouteLegIds: ['leg-air-bom-del', 'leg-air-del-ccu', 'leg-air-ccu-gau'],
    timeline: [
      {
        id: 't1-003',
        timestamp: '2026-08-14 11:00',
        hubId: 'hub-mumbai',
        hubName: 'Mumbai NSH',
        statusText: 'Booked at Speed Post Centre. Priority tag applied.',
        location: 'Mumbai GPO, Fort'
      },
      {
        id: 't2-003',
        timestamp: '2026-08-14 13:45',
        hubId: 'hub-mumbai',
        hubName: 'Mumbai NSH',
        statusText: 'Dispatched via IndiGo Cargo 6E-204 to Delhi.',
        location: 'Mumbai NSH Air Export'
      },
      {
        id: 't3-003',
        timestamp: '2026-08-15 01:30',
        hubId: 'hub-kolkata',
        hubName: 'Kolkata NSH',
        statusText: 'Arrived Kolkata. Awaiting next available Guwahati flight.',
        location: 'Kolkata NSCBI Transit Hub'
      },
      {
        id: 't4-003',
        timestamp: '2026-08-15 06:00',
        hubId: 'hub-kolkata',
        hubName: 'Kolkata NSH',
        statusText: '⚠️ DELAY ALERT: 6E-512 overbooked — offloaded. Next slot 18:30.',
        location: 'Kolkata NSH Air Dispatch'
      }
    ]
  },

  // ── 4. Registered Parcel — On-Time (BLR → HYD via Road) ───────────────
  {
    id: 'con-004',
    trackingNumber: 'RP554433221IN',
    senderName: 'Kavita Reddy',
    senderCity: 'Bengaluru',
    receiverName: 'Suresh Naidu',
    receiverCity: 'Hyderabad',
    originHubId: 'hub-bengaluru',
    destHubId: 'hub-hyderabad',
    weightKg: 4.8,
    mailClass: 'REGISTERED_PARCEL',
    status: 'IN_TRANSIT',
    currentHubId: 'hub-bengaluru',
    currentLegId: 'leg-mms-blr-hyd',
    targetSlaHours: 72,
    elapsedHours: 12,
    originalEta: '2026-08-18 06:00',
    currentEta: '2026-08-18 06:00',
    isDelayedRisk: false,
    assignedRouteLegIds: ['leg-mms-blr-hyd'],
    timeline: [
      {
        id: 't1-004',
        timestamp: '2026-08-15 20:00',
        hubId: 'hub-bengaluru',
        hubName: 'Bengaluru NSH',
        statusText: 'Dispatched via India Post MMS Truck KA-03-M-7740 on NH-44.',
        location: 'Bengaluru MMS Depot, Yeshwanthpur'
      }
    ]
  },

  // ── 5. Speed Post — Delivered (JAI → DEL) ────────────────────────────
  {
    id: 'con-005',
    trackingNumber: 'SP776655443IN',
    senderName: 'Anita Sharma',
    senderCity: 'Jaipur',
    receiverName: 'Ramesh Gupta',
    receiverCity: 'New Delhi',
    originHubId: 'hub-jaipur',
    destHubId: 'hub-delhi',
    weightKg: 0.3,
    mailClass: 'SPEED_POST',
    status: 'DELIVERED',
    currentHubId: 'hub-delhi',
    targetSlaHours: 24,
    elapsedHours: 14,
    originalEta: '2026-08-15 12:00',
    currentEta: '2026-08-15 11:45',
    isDelayedRisk: false,
    assignedRouteLegIds: ['leg-mms-del-jai'],
    timeline: [
      {
        id: 't1-005',
        timestamp: '2026-08-14 21:00',
        hubId: 'hub-jaipur',
        hubName: 'Jaipur ICH',
        statusText: 'Booked. Dispatched on MMS Night Service.',
        location: 'Jaipur Head Post Office, MI Road'
      },
      {
        id: 't2-005',
        timestamp: '2026-08-15 05:45',
        hubId: 'hub-delhi',
        hubName: 'Delhi NSH',
        statusText: 'Arrived Delhi NSH. Sorted and handed to postman Beat No. 14.',
        location: 'New Delhi GPO'
      },
      {
        id: 't3-005',
        timestamp: '2026-08-15 11:45',
        hubId: 'hub-delhi',
        hubName: 'Delhi NSH',
        statusText: '✅ Delivered. Signed by recipient.',
        location: 'Connaught Place, New Delhi'
      }
    ]
  },

  // ── 6. Bulk Mail — Rerouted (LKO → CCU via Rail) ──────────────────────
  {
    id: 'con-006',
    trackingNumber: 'BP330012988IN',
    senderName: 'Uttar Pradesh Lok Seva Aayog',
    senderCity: 'Lucknow',
    receiverName: 'Mohan Chatterjee',
    receiverCity: 'Kolkata',
    originHubId: 'hub-lucknow',
    destHubId: 'hub-kolkata',
    weightKg: 18.5,
    mailClass: 'BULK_MAIL',
    status: 'REROUTED',
    currentHubId: 'hub-patna',
    currentLegId: 'leg-rail-pat-ccu',
    targetSlaHours: 96,
    elapsedHours: 28,
    originalEta: '2026-08-18 12:00',
    currentEta: '2026-08-19 06:00',
    isDelayedRisk: true,
    delayReason: 'Rail track maintenance on Lucknow–Patna sector. Auto-rerouted via Patna Junction.',
    assignedRouteLegIds: ['leg-rail-lko-pat', 'leg-rail-pat-ccu'],
    timeline: [
      {
        id: 't1-006',
        timestamp: '2026-08-14 18:00',
        hubId: 'hub-lucknow',
        hubName: 'Lucknow ICH',
        statusText: 'Bulk mail bags inducted. Manifest sealed.',
        location: 'Lucknow GPO, Hazratganj'
      },
      {
        id: 't2-006',
        timestamp: '2026-08-14 22:00',
        hubId: 'hub-lucknow',
        hubName: 'Lucknow ICH',
        statusText: 'Loaded onto Shramjeevi Express 12392 RMS Van.',
        location: 'Lucknow Junction RMS Section'
      },
      {
        id: 't3-006',
        timestamp: '2026-08-15 07:05',
        hubId: 'hub-patna',
        hubName: 'Patna ICH',
        statusText: '⚠️ REROUTED: Track block DEL-CCU direct. Rerouted via Patna Hub.',
        location: 'Patna Junction RMS'
      }
    ]
  },

  // ── 7. Speed Post — Inducted, not yet dispatched (MAA → BLR) ──────────
  {
    id: 'con-007',
    trackingNumber: 'SP441827365IN',
    senderName: 'Dr. Meenakshi Iyer',
    senderCity: 'Chennai',
    receiverName: 'Kiran Rao',
    receiverCity: 'Bengaluru',
    originHubId: 'hub-chennai',
    destHubId: 'hub-bengaluru',
    weightKg: 0.6,
    mailClass: 'SPEED_POST',
    status: 'INDUCTED',
    currentHubId: 'hub-chennai',
    targetSlaHours: 24,
    elapsedHours: 1,
    originalEta: '2026-08-16 08:00',
    currentEta: '2026-08-16 08:00',
    isDelayedRisk: false,
    assignedRouteLegIds: ['leg-rail-maa-blr'],
    timeline: [
      {
        id: 't1-007',
        timestamp: '2026-08-15 11:30',
        hubId: 'hub-chennai',
        hubName: 'Chennai NSH',
        statusText: 'Parcel booked. Assigned to Shatabdi Express 12007 RMS Van (06:00 tomorrow).',
        location: 'Chennai GPO, Anna Salai'
      }
    ]
  },

  // ── 8. Registered Parcel — Island Mail (CCU → Port Blair via Ship) ─────
  {
    id: 'con-008',
    trackingNumber: 'RP993827461IN',
    senderName: 'Amit Ghosh',
    senderCity: 'Kolkata',
    receiverName: 'Leela Nair',
    receiverCity: 'Port Blair',
    originHubId: 'hub-kolkata',
    destHubId: 'hub-portblair',
    weightKg: 6.2,
    mailClass: 'REGISTERED_PARCEL',
    status: 'IN_TRANSIT',
    currentHubId: 'hub-portblair',
    currentLegId: 'leg-water-ccu-ixz',
    targetSlaHours: 168,
    elapsedHours: 72,
    originalEta: '2026-08-18 08:00',
    currentEta: '2026-08-18 08:00',
    isDelayedRisk: false,
    assignedRouteLegIds: ['leg-water-ccu-ixz'],
    timeline: [
      {
        id: 't1-008',
        timestamp: '2026-08-12 10:00',
        hubId: 'hub-kolkata',
        hubName: 'Kolkata NSH',
        statusText: 'Booked. Island mail bag sealed for MV Swaraj Dweep.',
        location: 'Kolkata GPO, BBD Bagh'
      },
      {
        id: 't2-008',
        timestamp: '2026-08-12 08:00',
        hubId: 'hub-kolkata',
        hubName: 'Kolkata NSH',
        statusText: 'Loaded onto MV Swaraj Dweep at Kidderpore Dock. Voyage commenced.',
        location: 'Kolkata Port, Dock No. 7'
      }
    ]
  },

  // ── 9. Speed Post — Delivered Early (AMD → DEL) ───────────────────────
  {
    id: 'con-009',
    trackingNumber: 'SP665544332IN',
    senderName: 'Nilesh Shah',
    senderCity: 'Ahmedabad',
    receiverName: 'Pooja Agarwal',
    receiverCity: 'New Delhi',
    originHubId: 'hub-ahmedabad',
    destHubId: 'hub-delhi',
    weightKg: 0.8,
    mailClass: 'SPEED_POST',
    status: 'DELIVERED',
    currentHubId: 'hub-delhi',
    targetSlaHours: 24,
    elapsedHours: 18,
    originalEta: '2026-08-15 20:00',
    currentEta: '2026-08-15 17:30',
    isDelayedRisk: false,
    assignedRouteLegIds: ['leg-air-del-bom'],
    timeline: [
      {
        id: 't1-009',
        timestamp: '2026-08-14 23:30',
        hubId: 'hub-ahmedabad',
        hubName: 'Ahmedabad ICH',
        statusText: 'Booked and dispatched via IndiGo Cargo.',
        location: 'Ahmedabad GPO, Relief Road'
      },
      {
        id: 't2-009',
        timestamp: '2026-08-15 08:15',
        hubId: 'hub-delhi',
        hubName: 'Delhi NSH',
        statusText: 'Arrived Delhi. Out for delivery.',
        location: 'Delhi NSH'
      },
      {
        id: 't3-009',
        timestamp: '2026-08-15 17:30',
        hubId: 'hub-delhi',
        hubName: 'Delhi NSH',
        statusText: '✅ Delivered ahead of schedule.',
        location: 'Karol Bagh, New Delhi'
      }
    ]
  },

  // ── 10. Business Parcel — In Transit (HYD → MAA) ──────────────────────
  {
    id: 'con-010',
    trackingNumber: 'BP119922834IN',
    senderName: 'Telangana State Textbook Press',
    senderCity: 'Hyderabad',
    receiverName: 'Tamil Nadu School Education Dept.',
    receiverCity: 'Chennai',
    originHubId: 'hub-hyderabad',
    destHubId: 'hub-chennai',
    weightKg: 42.0,
    mailClass: 'BUSINESS_PARCEL',
    status: 'IN_TRANSIT',
    currentHubId: 'hub-hyderabad',
    targetSlaHours: 48,
    elapsedHours: 6,
    originalEta: '2026-08-17 12:00',
    currentEta: '2026-08-17 12:00',
    isDelayedRisk: false,
    assignedRouteLegIds: ['leg-rail-nag-hyd', 'leg-rail-maa-blr'],
    timeline: [
      {
        id: 't1-010',
        timestamp: '2026-08-15 06:00',
        hubId: 'hub-hyderabad',
        hubName: 'Hyderabad ICH',
        statusText: 'Heavy parcel inducted. MMS truck loading in progress.',
        location: 'Hyderabad GPO, Abids'
      }
    ]
  }
];
