/**
 * DIGIPIN (Digital Postal Index Number) Adapter
 * Official Geo-Coded Addressing standard by Department of Posts, Government of India (INDIAPOST-gov/digipin)
 * 
 * Divides the bounding box of India (6°N to 37.5°N, 68.7°E to 97.25°E) into a hierarchical 4x4 alphanumeric grid.
 * Yields a 10-character code (e.g., '28J-4K9-8L1') that identifies any 4m x 4m location in India.
 */

// DIGIPIN 16-character alphanumeric symbol alphabet (omits confusing letters I, O, 0, 1)
const DIGIPIN_ALPHABET = '23456789CFGHJKMP';

// India Bounding Box coordinates
const BOUNDS = {
  minLat: 6.0,
  maxLat: 37.5,
  minLng: 68.7,
  maxLng: 97.25,
};

export interface DigipinInfo {
  digipin: string;
  lat: number;
  lng: number;
  nearestHubId: string;
  nearestHubName: string;
  circle: string;
  resolutionMeters: number;
}

/**
 * Encodes a latitude and longitude into an official 10-character DIGIPIN
 */
export function encodeDigipin(lat: number, lng: number, precision: number = 10): string {
  let minLat = BOUNDS.minLat;
  let maxLat = BOUNDS.maxLat;
  let minLng = BOUNDS.minLng;
  let maxLng = BOUNDS.maxLng;

  let code = '';

  for (let i = 0; i < precision; i++) {
    const latStep = (maxLat - minLat) / 4;
    const lngStep = (maxLng - minLng) / 4;

    const row = Math.min(3, Math.max(0, Math.floor((lat - minLat) / latStep)));
    const col = Math.min(3, Math.max(0, Math.floor((lng - minLng) / lngStep)));

    const charIndex = row * 4 + col;
    code += DIGIPIN_ALPHABET[charIndex];

    minLat += row * latStep;
    maxLat = minLat + latStep;
    minLng += col * lngStep;
    maxLng = minLng + lngStep;
  }

  // Format as 3-3-4 with hyphens (e.g. 28J-4K9-8L12)
  if (code.length >= 10) {
    return `${code.slice(0, 3)}-${code.slice(3, 6)}-${code.slice(6, 10)}`;
  }
  return code;
}

/**
 * Decodes a DIGIPIN string into latitude and longitude center coordinates
 */
export function decodeDigipin(digipinStr: string): { lat: number; lng: number } | null {
  const clean = digipinStr.replace(/[^23456789CFGHJKMPcfghjkmp]/gi, '').toUpperCase();
  if (clean.length < 4) return null;

  let minLat = BOUNDS.minLat;
  let maxLat = BOUNDS.maxLat;
  let minLng = BOUNDS.minLng;
  let maxLng = BOUNDS.maxLng;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const idx = DIGIPIN_ALPHABET.indexOf(char);
    if (idx === -1) return null;

    const row = Math.floor(idx / 4);
    const col = idx % 4;

    const latStep = (maxLat - minLat) / 4;
    const lngStep = (maxLng - minLng) / 4;

    minLat += row * latStep;
    maxLat = minLat + latStep;
    minLng += col * lngStep;
    maxLng = minLng + lngStep;
  }

  return {
    lat: Number(((minLat + maxLat) / 2).toFixed(6)),
    lng: Number(((minLng + maxLng) / 2).toFixed(6)),
  };
}

/**
 * Resolves a DIGIPIN to the nearest India Post Sorting Hub
 */
export function resolveDigipinToHub(
  digipin: string,
  hubs: { id: string; name: string; lat: number; lng: number; circle: string }[]
): DigipinInfo | null {
  const coords = decodeDigipin(digipin);
  if (!coords) return null;

  let nearestHub = hubs[0];
  let minDistance = Infinity;

  for (const hub of hubs) {
    const dLat = hub.lat - coords.lat;
    const dLng = hub.lng - coords.lng;
    const distSq = dLat * dLat + dLng * dLng;
    if (distSq < minDistance) {
      minDistance = distSq;
      nearestHub = hub;
    }
  }

  return {
    digipin: digipin.toUpperCase(),
    lat: coords.lat,
    lng: coords.lng,
    nearestHubId: nearestHub?.id || 'hub-delhi',
    nearestHubName: nearestHub?.name || 'Delhi National Sorting Hub',
    circle: nearestHub?.circle || 'Delhi',
    resolutionMeters: 4.0,
  };
}
