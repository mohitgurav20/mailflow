import { Consignment } from '@mailflow/shared-types';

export const INITIAL_CONSIGNMENTS: Consignment[] = [
  {
    id: 'con-001',
    trackingNumber: 'SP892019482IN',
    senderName: 'Ministry of External Affairs',
    senderCity: 'New Delhi',
    receiverName: 'Consulate General of India',
    receiverCity: 'Mumbai',
    originHubId: 'hub-delhi',
    destHubId: 'hub-mumbai',
    weightKg: 2.5,
    mailClass: 'SPEED_POST',
    status: 'IN_TRANSIT',
    currentHubId: 'hub-delhi',
    currentLegId: 'leg-air-del-bom',
    targetSlaHours: 24,
    elapsedHours: 4,
    originalEta: '2026-08-15 14:00',
    currentEta: '2026-08-15 14:00',
    isDelayedRisk: false,
    assignedRouteLegIds: ['leg-air-del-bom'],
    timeline: [
      {
        id: 't1',
        timestamp: '2026-08-15 08:30',
        hubId: 'hub-delhi',
        hubName: 'Delhi NSH',
        statusText: 'Inducted & Weighed at Counter',
        location: 'Delhi NSH Counter'
      },
      {
        id: 't2',
        timestamp: '2026-08-15 09:15',
        hubId: 'hub-delhi',
        hubName: 'Delhi NSH',
        statusText: 'Bagged & Dispatched to Airport TMO',
        location: 'Delhi NSH Sorting Deck'
      }
    ]
  },
  {
    id: 'con-002',
    trackingNumber: 'BP401928374IN',
    senderName: 'UPSC Examination Division',
    senderCity: 'New Delhi',
    receiverName: 'Regional Officer UPSC',
    receiverCity: 'Kolkata',
    originHubId: 'hub-delhi',
    destHubId: 'hub-kolkata',
    weightKg: 450,
    mailClass: 'BUSINESS_PARCEL',
    status: 'IN_TRANSIT',
    currentHubId: 'hub-delhi',
    currentLegId: 'leg-air-del-ccu',
    targetSlaHours: 36,
    elapsedHours: 8,
    originalEta: '2026-08-15 20:00',
    currentEta: '2026-08-15 20:00',
    isDelayedRisk: false,
    assignedRouteLegIds: ['leg-air-del-ccu'],
    timeline: [
      {
        id: 't1',
        timestamp: '2026-08-15 04:00',
        hubId: 'hub-delhi',
        hubName: 'Delhi NSH',
        statusText: 'Bulk Parcel Container Loaded',
        location: 'Delhi NSH Dock 4'
      }
    ]
  },
  {
    id: 'con-003',
    trackingNumber: 'SP102938475IN',
    senderName: 'IIT Bombay Academic Cell',
    senderCity: 'Mumbai',
    receiverName: 'Registrar, IIT Guwahati',
    receiverCity: 'Guwahati',
    originHubId: 'hub-mumbai',
    destHubId: 'hub-guwahati',
    weightKg: 12.0,
    mailClass: 'SPEED_POST',
    status: 'DELAYED_RISK',
    currentHubId: 'hub-kolkata',
    currentLegId: 'leg-air-ccu-gau',
    targetSlaHours: 48,
    elapsedHours: 34,
    originalEta: '2026-08-16 10:00',
    currentEta: '2026-08-16 18:30',
    isDelayedRisk: true,
    delayReason: 'Connecting Flight 6E-512 Congestion at Kolkata Airport',
    assignedRouteLegIds: ['leg-air-bom-del', 'leg-air-del-ccu', 'leg-air-ccu-gau'],
    timeline: [
      {
        id: 't1',
        timestamp: '2026-08-14 11:00',
        hubId: 'hub-mumbai',
        hubName: 'Mumbai NSH',
        statusText: 'Inducted into Speed Post Network',
        location: 'Mumbai NSH'
      },
      {
        id: 't2',
        timestamp: '2026-08-15 02:30',
        hubId: 'hub-kolkata',
        hubName: 'Kolkata NSH',
        statusText: 'Arrived at Transit Hub',
        location: 'Kolkata NSH'
      }
    ]
  },
  {
    id: 'con-004',
    trackingNumber: 'RP554433221IN',
    senderName: 'Karnataka Textbook Society',
    senderCity: 'Bengaluru',
    receiverName: 'District Education Office',
    receiverCity: 'Hyderabad',
    originHubId: 'hub-bengaluru',
    destHubId: 'hub-hyderabad',
    weightKg: 180.0,
    mailClass: 'REGISTERED_PARCEL',
    status: 'IN_TRANSIT',
    currentHubId: 'hub-bengaluru',
    currentLegId: 'leg-mms-blr-hyd',
    targetSlaHours: 48,
    elapsedHours: 12,
    originalEta: '2026-08-16 06:00',
    currentEta: '2026-08-16 06:00',
    isDelayedRisk: false,
    assignedRouteLegIds: ['leg-mms-blr-hyd'],
    timeline: [
      {
        id: 't1',
        timestamp: '2026-08-15 01:00',
        hubId: 'hub-bengaluru',
        hubName: 'Bengaluru NSH',
        statusText: 'Dispatched via India Post MMS Truck',
        location: 'Bengaluru MMS Depot'
      }
    ]
  },
  {
    id: 'con-005',
    trackingNumber: 'SP776655443IN',
    senderName: 'High Court of Rajasthan',
    senderCity: 'Jaipur',
    receiverName: 'Supreme Court Registry',
    receiverCity: 'New Delhi',
    originHubId: 'hub-jaipur',
    destHubId: 'hub-delhi',
    weightKg: 1.2,
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
        id: 't1',
        timestamp: '2026-08-14 21:00',
        hubId: 'hub-jaipur',
        hubName: 'Jaipur ICH',
        statusText: 'Dispatched via MMS Night Service',
        location: 'Jaipur ICH'
      },
      {
        id: 't2',
        timestamp: '2026-08-15 05:45',
        hubId: 'hub-delhi',
        hubName: 'Delhi NSH',
        statusText: 'Out for Delivery by Postman',
        location: 'New Delhi GPO'
      },
      {
        id: 't3',
        timestamp: '2026-08-15 11:45',
        hubId: 'hub-delhi',
        hubName: 'Delhi NSH',
        statusText: 'Item Successfully Delivered',
        location: 'Supreme Court Counter'
      }
    ]
  }
];
