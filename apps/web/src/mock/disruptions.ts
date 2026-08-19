import { Disruption } from '@mailflow/shared-types';

// Real disruption scenarios based on India Post operational challenges
// Monsoon 2026 season disruptions, real route blockages, real weather corridors
export const INITIAL_DISRUPTIONS: Disruption[] = [
  {
    id: 'dis-001',
    type: 'WEATHER_ALERT',
    title: 'Monsoon Depression — Northeast Sector (Kolkata–Guwahati Corridor)',
    description:
      'IMD has issued Red Alert for heavy rainfall in Sub-Himalayan West Bengal and Assam districts. ' +
      'Road connectivity on NH-27 (Siliguri–Guwahati) severely affected. Average speed reduced to 20 km/h. ' +
      'Landslide risk at Garo Hills stretch. All MMS trucks held at Siliguri RMS pending IMD all-clear.',
    affectedLegIds: ['leg-mms-slg-gau', 'leg-mms-ccu-slg'],
    affectedHubIds: ['hub-siliguri', 'hub-guwahati'],
    severity: 'CRITICAL',
    startTime: '2026-08-14 06:00',
    estimatedEndTime: '2026-08-17 18:00',
    active: true
  },
  {
    id: 'dis-002',
    type: 'AIR_CANCELLATION',
    title: 'IndiGo 6E-512 Guwahati Flight Cancellation — Monsoon Diversion',
    description:
      'IndiGo Cargo flight 6E-512 (Kolkata–Guwahati) cancelled due to Gopinath Bordoloi Airport (LGB) ' +
      'temporary closure. Runway waterlogging reported. DGCA advisory in effect. ' +
      '14 Speed Post consignments offloaded at Kolkata NSCBI and held for rerouting.',
    affectedLegIds: ['leg-air-ccu-gau'],
    affectedHubIds: ['hub-guwahati'],
    severity: 'CRITICAL',
    startTime: '2026-08-15 08:00',
    estimatedEndTime: '2026-08-16 06:00',
    active: true
  },
  {
    id: 'dis-003',
    type: 'ROAD_BLOCK',
    title: 'NH-44 Security Convoy Restriction — Jammu Sector',
    description:
      'Ministry of Home Affairs has notified a mandatory 12-hour road clearance on NH-44 ' +
      '(Pathankot–Jammu) for security convoy movement on 15–18 August. All civilian cargo vehicles ' +
      'including India Post MMS trucks must obtain Army clearance before proceeding. ' +
      'Embargo declared on BUSINESS_PARCEL and BULK_MAIL for J&K circle.',
    affectedLegIds: ['leg-mms-ixc-jammu'],
    affectedHubIds: ['hub-jammu'],
    severity: 'MODERATE',
    startTime: '2026-08-15 00:00',
    estimatedEndTime: '2026-08-18 23:59',
    active: true
  },
  {
    id: 'dis-004',
    type: 'HUB_OVERFLOW',
    title: 'Mumbai NSH Capacity Alert — Peak Festive Season Pre-load',
    description:
      'Mumbai National Sorting Hub is operating at 94% capacity (136,300 kg vs 145,000 kg limit). ' +
      'Raksha Bandhan seasonal surge detected. Incoming bulk mail for Konkan region being temporarily ' +
      'rerouted through Pune ICH-PNQ to relieve pressure. Processing delays of 4–6 hours expected.',
    affectedLegIds: ['leg-air-bom-del', 'leg-air-bom-maa', 'leg-rail-bom-nag'],
    affectedHubIds: ['hub-mumbai'],
    severity: 'MODERATE',
    startTime: '2026-08-14 00:00',
    estimatedEndTime: '2026-08-16 18:00',
    active: true
  },
  {
    id: 'dis-005',
    type: 'RAIL_DELAY',
    title: 'Track Maintenance Block — Lucknow–Allahabad Section',
    description:
      'Indian Railways Engineering Department block on UP Main Line between Lucknow Junction and ' +
      'Allahabad Junction (11:00–15:00 hrs daily) for track doubling work. Shramjeevi Express 12392 ' +
      'running 2.5 hours late on average. RMS Van loadings at Lucknow delayed accordingly. ' +
      'Block in effect: 15 August to 20 August 2026.',
    affectedLegIds: ['leg-rail-lko-pat'],
    affectedHubIds: ['hub-lucknow', 'hub-patna'],
    severity: 'MINOR',
    startTime: '2026-08-15 11:00',
    estimatedEndTime: '2026-08-20 15:00',
    active: false
  },
  {
    id: 'dis-006',
    type: 'WEATHER_ALERT',
    title: 'Cyclone Watch — Bay of Bengal (Andaman & Nicobar Services)',
    description:
      'India Meteorological Department (IMD) has issued Cyclone Watch bulletin for north Bay of Bengal. ' +
      'MV Swaraj Dweep voyage from Kolkata to Port Blair suspended. Island mail build-up at ' +
      'Kolkata Port. Services expected to resume upon IMD advisory withdrawal.',
    affectedLegIds: ['leg-water-ccu-ixz'],
    affectedHubIds: ['hub-portblair', 'hub-kolkata'],
    severity: 'CRITICAL',
    startTime: '2026-08-13 00:00',
    estimatedEndTime: '2026-08-20 00:00',
    active: false
  }
];
