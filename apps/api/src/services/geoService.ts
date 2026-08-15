import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Hub } from '@mailflow/shared-types';
import { DataStore } from './store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../../');
const pincodesPath = path.join(rootDir, 'data', 'pincodes.json');

export interface PinCodeInfo {
  prefix: string;
  circle: string;
  city: string;
  nearestHubId: string;
  lat: number;
  lng: number;
}

export class GeoService {
  private static instance: GeoService;
  private pinMappings: PinCodeInfo[] = [];
  private store: DataStore;

  private constructor() {
    this.store = DataStore.getInstance();
    this.loadPinCodes();
  }

  public static getInstance(): GeoService {
    if (!GeoService.instance) {
      GeoService.instance = new GeoService();
    }
    return GeoService.instance;
  }

  private loadPinCodes(): void {
    try {
      if (fs.existsSync(pincodesPath)) {
        this.pinMappings = JSON.parse(fs.readFileSync(pincodesPath, 'utf-8'));
      }
    } catch (err) {
      console.error('[GeoService] Error loading pincodes database:', err);
    }
  }

  /**
   * Resolves nearest Hub from any standard 6-digit Indian PIN code.
   */
  public resolveHubByPinCode(pinCode: string): Hub | undefined {
    const cleanPin = pinCode.trim().replace(/\s+/g, '');
    if (cleanPin.length < 2) return undefined;

    // Check specific 3-digit prefix (e.g. 744 for Port Blair)
    let match = this.pinMappings.find(p => cleanPin.startsWith(p.prefix) && p.prefix.length === 3);
    if (!match) {
      // Check standard 2-digit circle prefix
      const prefix2 = cleanPin.substring(0, 2);
      match = this.pinMappings.find(p => p.prefix === prefix2);
    }

    if (match) {
      return this.store.hubs.get(match.nearestHubId);
    }

    // Default fallback to Delhi NSH
    return this.store.hubs.get('hub-del');
  }

  /**
   * Calculates Great-Circle distance between two coordinates using Haversine formula (km).
   */
  public calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
