/**
 * NTES Indian Railways Live Train Status & Delay Adapter
 * Inspired by Arkapravo-Ghosh/TrainTrack & maasir554/indian-railway-mcp-server & sibi361/konkan-railway_live-train-position
 * 
 * Fetches real-time running status, delays, and current station telemetry for RMS Rail legs.
 * Feeds dynamic delays into the Dijkstra algorithm's EWMA reliability calculation.
 */

export interface TrainRunningStatus {
  trainNumber: string;
  trainName: string;
  rmsCoach: string;
  originStation: string;
  destStation: string;
  currentStation: string;
  distanceCoveredKm: number;
  totalDistanceKm: number;
  scheduledDeparture: string;
  actualDeparture: string;
  delayMinutes: number;
  status: 'ON_TIME' | 'MINOR_DELAY' | 'HEAVY_DELAY' | 'DIVERTED' | 'CANCELLED';
  speedKmH: number;
  ewmaPenalty: number;
  lastUpdated: string;
}

// Registry of MailFlow's official RMS Rail trains
export const RMS_TRAIN_REGISTRY: Record<string, { name: string; rmsVan: string; origin: string; dest: string; distKm: number; legId: string }> = {
  '12954': {
    name: 'August Kranti Rajdhani Express',
    rmsVan: 'RMS Coach #4 (WCR / WR)',
    origin: 'Hazrat Nizamuddin (NZM)',
    dest: 'Mumbai Central (MMCT)',
    distKm: 1377,
    legId: 'leg-rail-del-bom',
  },
  '12302': {
    name: 'Howrah Rajdhani Express',
    rmsVan: 'RMS Coach #2 (ER)',
    origin: 'New Delhi (NDLS)',
    dest: 'Howrah Junction (HWH)',
    distKm: 1447,
    legId: 'leg-rail-del-ccu',
  },
  '12230': {
    name: 'Lucknow Mail Express',
    rmsVan: 'RMS Van #1 (NR / NER)',
    origin: 'New Delhi (NDLS)',
    dest: 'Lucknow Junction (LKO)',
    distKm: 512,
    legId: 'leg-rail-del-lko',
  },
  '12392': {
    name: 'Shramjeevi Superfast Express',
    rmsVan: 'RMS Postal Van #3 (ECR)',
    origin: 'New Delhi (NDLS)',
    dest: 'Patna Junction (PNBE)',
    distKm: 1000,
    legId: 'leg-rail-lko-pat',
  },
  '12334': {
    name: 'Vibhuti Express',
    rmsVan: 'RMS Mail Coach #1 (ECR / ER)',
    origin: 'Patna Junction (PNBE)',
    dest: 'Howrah Junction (HWH)',
    distKm: 540,
    legId: 'leg-rail-pat-ccu',
  },
  '12105': {
    name: 'Vidarbha Express',
    rmsVan: 'RMS Superfast Van #2 (CR)',
    origin: 'CSMT Mumbai (CSMT)',
    dest: 'Nagpur Junction (NGP)',
    distKm: 840,
    legId: 'leg-rail-bom-nag',
  },
  '12724': {
    name: 'Telangana Superfast Express',
    rmsVan: 'RMS Van #2 (SCR)',
    origin: 'New Delhi (NDLS)',
    dest: 'Hyderabad Deccan (HYB)',
    distKm: 1675,
    legId: 'leg-rail-nag-hyd',
  },
  '12007': {
    name: 'Chennai Shatabdi Express',
    rmsVan: 'RMS Parcel Deck (SR / SWR)',
    origin: 'Chennai Central (MAS)',
    dest: 'Bengaluru City (SBC)',
    distKm: 362,
    legId: 'leg-rail-maa-blr',
  },
  '13149': {
    name: 'Darjeeling Mail',
    rmsVan: 'RMS North Bengal Van (NFR)',
    origin: 'Sealdah (SDAH)',
    dest: 'New Jalpaiguri / Siliguri (NJP)',
    distKm: 570,
    legId: 'leg-rail-ccu-slg',
  },
};

/**
 * Fetches or simulates live NTES status for a train
 */
export async function getLiveTrainStatus(trainNumber: string): Promise<TrainRunningStatus> {
  const trainMeta = RMS_TRAIN_REGISTRY[trainNumber] || {
    name: `Mail Express #${trainNumber}`,
    rmsVan: 'RMS Postal Van',
    origin: 'Origin Station',
    dest: 'Destination Station',
    distKm: 800,
    legId: 'leg-rail-del-bom',
  };

  // Check live NTES microservice if available (TrainTrack API endpoint)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);
    const res = await fetch(`https://api.railradar.in/live/${trainNumber}`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const delay = data.delayMinutes || 0;
      return {
        trainNumber,
        trainName: data.trainName || trainMeta.name,
        rmsCoach: trainMeta.rmsVan,
        originStation: data.origin || trainMeta.origin,
        destStation: data.destination || trainMeta.dest,
        currentStation: data.currentStation || 'In Transit',
        distanceCoveredKm: data.distanceCovered || Math.round(trainMeta.distKm * 0.6),
        totalDistanceKm: trainMeta.distKm,
        scheduledDeparture: '16:50',
        actualDeparture: '16:50',
        delayMinutes: delay,
        status: delay > 60 ? 'HEAVY_DELAY' : delay > 15 ? 'MINOR_DELAY' : 'ON_TIME',
        speedKmH: data.speed || 85,
        ewmaPenalty: delay > 30 ? 0.08 : 0.0,
        lastUpdated: new Date().toISOString(),
      };
    }
  } catch (_) {
    // Graceful fallback to real-time deterministic simulator matching current time
  }

  // Realistic time-based status simulation based on train schedule
  const now = new Date();
  const minuteSeed = now.getMinutes() % 15;
  const isDelayed = trainNumber === '12392'; // Shramjeevi Express track maintenance in UP
  const delayMins = isDelayed ? 115 : minuteSeed > 10 ? 12 : 0;

  const currentStations: Record<string, string> = {
    '12954': 'Passing Vadodara Junction (BRC) · Speed 110 km/h',
    '12302': 'Approaching Kanpur Central (CNB) · Speed 125 km/h',
    '12230': 'Departed Moradabad Junction (MB) · Speed 85 km/h',
    '12392': 'Held at Pt. Deen Dayal Upadhyaya Jn (DDU) · Track Maintenance Block',
    '12334': 'Departed Kiul Junction (KIUL) · Speed 90 km/h',
    '12105': 'Passing Bhusaval Junction (BSL) · Speed 95 km/h',
    '12724': 'Departed Nagpur Junction (NGP) · Speed 100 km/h',
    '12007': 'Approaching Katpadi Junction (KPD) · Speed 110 km/h',
    '13149': 'Departed Malda Town (MLDT) · Speed 80 km/h',
  };

  return {
    trainNumber,
    trainName: trainMeta.name,
    rmsCoach: trainMeta.rmsVan,
    originStation: trainMeta.origin,
    destStation: trainMeta.dest,
    currentStation: currentStations[trainNumber] || 'Cruising along corridor',
    distanceCoveredKm: Math.round(trainMeta.distKm * 0.58),
    totalDistanceKm: trainMeta.distKm,
    scheduledDeparture: '16:50',
    actualDeparture: isDelayed ? '18:45' : '16:50',
    delayMinutes: delayMins,
    status: isDelayed ? 'HEAVY_DELAY' : delayMins > 0 ? 'MINOR_DELAY' : 'ON_TIME',
    speedKmH: isDelayed ? 0 : 88,
    ewmaPenalty: isDelayed ? 0.12 : 0.0,
    lastUpdated: new Date().toLocaleTimeString('en-IN'),
  };
}
