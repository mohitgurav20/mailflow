/**
 * Unified Real-Data Integration Engine
 * Connects DIGIPIN, All-India Pincode Directory, NTES Rail Live, OpenSky ADS-B Air, and IMD Weather feeds.
 */

import { encodeDigipin, decodeDigipin, resolveDigipinToHub, DigipinInfo } from './digipinAdapter';
import { lookupPincode, PincodeRecord } from './pincodeAdapter';
import { getLiveTrainStatus, TrainRunningStatus, RMS_TRAIN_REGISTRY } from './railLiveAdapter';
import { getLiveFlightTelemetry, FlightTelemetry, AIR_CARGO_REGISTRY } from './airOpenSkyAdapter';
import { getHubLiveWeather, HubWeatherStatus } from './weatherImdAdapter';
import { Hub } from '@mailflow/shared-types';

export interface LocationResolutionResult {
  sourceType: 'PINCODE' | 'DIGIPIN' | 'CITY_NAME' | 'GPS';
  formattedAddress: string;
  townVillage?: string;
  district?: string;
  state?: string;
  pincode?: string;
  digipin?: string;
  lat: number;
  lng: number;
  circle: string;
  nearestHubId: string;
  nearestHubName: string;
}

export class RealDataEngine {
  /**
   * Reverse Geocode raw GPS Coordinates into Real Indian Address + DIGIPIN + Nearest Sorting Hub
   */
  public static async reverseGeocodeGps(
    lat: number,
    lng: number,
    allHubs: Hub[]
  ): Promise<LocationResolutionResult> {
    const digipin = encodeDigipin(lat, lng);

    // Find closest Hub
    let nearestHub = allHubs[0];
    let minDistance = Infinity;

    for (const hub of allHubs) {
      const dLat = hub.lat - lat;
      const dLng = hub.lng - lng;
      const distSq = dLat * dLat + dLng * dLng;
      if (distSq < minDistance) {
        minDistance = distSq;
        nearestHub = hub;
      }
    }

    // Try live OpenStreetMap Nominatim reverse geocode (with 1.5s timeout)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
        { signal: controller.signal, headers: { 'User-Agent': 'MailFlow-IndiaPost-SIH/1.0' } }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const state = addr.state || nearestHub.circle;
        const district = addr.state_district || addr.county || addr.city || nearestHub.circle;
        const town = addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.city || 'Postal Area';
        const postcode = addr.postcode || '';

        return {
          sourceType: 'GPS',
          formattedAddress: `${town}, ${district}, ${state}`,
          townVillage: `${town} (GPS: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`,
          district,
          state,
          pincode: postcode,
          digipin,
          lat,
          lng,
          circle: state,
          nearestHubId: nearestHub.id,
          nearestHubName: nearestHub.name,
        };
      }
    } catch (_) {
      // Fall through to offline hub mapping
    }

    // Fallback: Accurate geometric resolution based on nearest India Post Hub
    return {
      sourceType: 'GPS',
      formattedAddress: `GPS Location (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E), ${nearestHub.circle}`,
      townVillage: `GPS Point (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`,
      district: `${nearestHub.circle} Central`,
      state: nearestHub.circle,
      digipin,
      lat,
      lng,
      circle: nearestHub.circle,
      nearestHubId: nearestHub.id,
      nearestHubName: nearestHub.name,
    };
  }

  /**
   * Universal location resolver: accepts Pincode (e.g. "110001"), DIGIPIN (e.g. "28J-4K9-8L1"), or City name
   */
  public static async resolveLocation(
    input: string,
    allHubs: Hub[]
  ): Promise<LocationResolutionResult | null> {
    const trimmed = input.trim();

    // 1. Check if input is a 6-digit Pincode
    const pinDigits = trimmed.replace(/\D/g, '');
    if (pinDigits.length === 6 && /^\d{6}$/.test(pinDigits)) {
      const pinResult = await lookupPincode(pinDigits);
      if (pinResult) {
        const digipin = encodeDigipin(pinResult.lat, pinResult.lng);
        return {
          sourceType: 'PINCODE',
          formattedAddress: `${pinResult.officeName}, ${pinResult.district}, ${pinResult.state}`,
          townVillage: pinResult.officeName,
          district: pinResult.district,
          state: pinResult.state,
          pincode: pinDigits,
          digipin,
          lat: pinResult.lat,
          lng: pinResult.lng,
          circle: pinResult.circle,
          nearestHubId: pinResult.nearestHubId,
          nearestHubName: pinResult.nearestHubName,
        };
      }
    }

    // 2. Check if input is a DIGIPIN (e.g. 28J-4K9-8L1 or 28J4K98L12)
    const isDigipin = /^[23456789CFGHJKMP-]{6,12}$/i.test(trimmed);
    if (isDigipin) {
      const digipinResult = resolveDigipinToHub(trimmed, allHubs);
      if (digipinResult) {
        return {
          sourceType: 'DIGIPIN',
          formattedAddress: `DIGIPIN ${digipinResult.digipin} (${digipinResult.circle} Postal Circle)`,
          townVillage: `DIGIPIN Grid ${digipinResult.digipin}`,
          district: `${digipinResult.circle} Division`,
          state: digipinResult.circle,
          digipin: digipinResult.digipin,
          lat: digipinResult.lat,
          lng: digipinResult.lng,
          circle: digipinResult.circle,
          nearestHubId: digipinResult.nearestHubId,
          nearestHubName: digipinResult.nearestHubName,
        };
      }
    }

    // 3. Fallback: match by city/hub name
    const matchedHub = allHubs.find(
      (h) => h.name.toLowerCase().includes(trimmed.toLowerCase()) || h.circle.toLowerCase().includes(trimmed.toLowerCase())
    );
    if (matchedHub) {
      const digipin = encodeDigipin(matchedHub.lat, matchedHub.lng);
      return {
        sourceType: 'CITY_NAME',
        formattedAddress: `${matchedHub.name}, ${matchedHub.circle}`,
        townVillage: `${matchedHub.name} Postal Hub Area`,
        district: matchedHub.circle,
        state: matchedHub.circle,
        digipin,
        lat: matchedHub.lat,
        lng: matchedHub.lng,
        circle: matchedHub.circle,
        nearestHubId: matchedHub.id,
        nearestHubName: matchedHub.name,
      };
    }

    return null;
  }

  /**
   * Fetches real-time NTES live train status
   */
  public static async getTrainTelemetry(trainNumber: string): Promise<TrainRunningStatus> {
    return getLiveTrainStatus(trainNumber);
  }

  /**
   * Fetches real-time OpenSky ADS-B flight telemetry
   */
  public static async getFlightTelemetry(legCode: string): Promise<FlightTelemetry> {
    return getLiveFlightTelemetry(legCode);
  }

  /**
   * Fetches live IMD weather conditions
   */
  public static async getHubWeather(hubId: string, apiKey?: string): Promise<HubWeatherStatus> {
    return getHubLiveWeather(hubId, apiKey);
  }

  /**
   * Dynamic Dijkstra EWMA penalty calculation based on live telemetry feeds
   */
  public static calculateDynamicEwma(
    baseEwma: number,
    delayMinutes: number = 0,
    isWeatherDisrupted: boolean = false
  ): number {
    let penalty = 0;
    if (delayMinutes > 60) penalty += 0.15;
    else if (delayMinutes > 15) penalty += 0.06;

    if (isWeatherDisrupted) penalty += 0.20;

    return Math.max(0.40, Number((baseEwma - penalty).toFixed(2)));
  }
}

export * from './digipinAdapter';
export * from './pincodeAdapter';
export * from './railLiveAdapter';
export * from './airOpenSkyAdapter';
export * from './weatherImdAdapter';
