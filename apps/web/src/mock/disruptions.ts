import { Disruption } from '@mailflow/shared-types';

export const INITIAL_DISRUPTIONS: Disruption[] = [
  {
    id: 'disruption-01',
    type: 'AIR_CANCELLATION',
    title: 'Severe Monsoonal Thunderstorm — Delhi Airport Grounding',
    description: 'Air India & IndiGo cargo flights grounded at IGIA Delhi. Flight AI-807 (DEL-BOM) cancelled.',
    affectedLegIds: ['leg-air-del-bom'],
    affectedHubIds: ['hub-delhi'],
    severity: 'CRITICAL',
    startTime: '2026-08-15 07:00',
    estimatedEndTime: '2026-08-15 19:00',
    active: true
  },
  {
    id: 'disruption-02',
    type: 'RAIL_DELAY',
    title: 'Northern Railway Freight Track Maintenance near Tundla',
    description: 'Signal upgrade causing 6+ hour delays on Lucknow Mail & Shramjeevi Express RMS coaches.',
    affectedLegIds: ['leg-rail-del-lko', 'leg-rail-lko-pat'],
    affectedHubIds: ['hub-lucknow'],
    severity: 'MODERATE',
    startTime: '2026-08-15 04:30',
    estimatedEndTime: '2026-08-15 22:00',
    active: true
  },
  {
    id: 'disruption-03',
    type: 'WEATHER_ALERT',
    title: 'Flooding on NH-27 Corridor (Siliguri - Guwahati)',
    description: 'River Teesta overflow restricting heavy commercial vehicles near Jalpaiguri.',
    affectedLegIds: ['leg-mms-slg-gau'],
    affectedHubIds: ['hub-siliguri', 'hub-guwahati'],
    severity: 'MODERATE',
    startTime: '2026-08-14 18:00',
    estimatedEndTime: '2026-08-16 12:00',
    active: true
  }
];
