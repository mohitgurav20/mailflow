import { WeatherCondition, Hub } from '@mailflow/shared-types';
import { DataStore } from '../store.js';
import { WebSocketGateway } from '../wsServer.js';

export class WeatherAdapter {
  private static instance: WeatherAdapter;
  private store: DataStore;
  private ws: WebSocketGateway;
  private apiKey: string | null = process.env.OPENWEATHER_API_KEY || null;

  private constructor() {
    this.store = DataStore.getInstance();
    this.ws = WebSocketGateway.getInstance();
    this.initializeBaselineWeather();
  }

  public static getInstance(): WeatherAdapter {
    if (!WeatherAdapter.instance) {
      WeatherAdapter.instance = new WeatherAdapter();
    }
    return WeatherAdapter.instance;
  }

  private initializeBaselineWeather(): void {
    const hubs = this.store.getHubsList();
    for (const hub of hubs) {
      const condition: WeatherCondition = {
        hubId: hub.id,
        hubCode: hub.code,
        temperatureC: 28,
        condition: 'CLEAR',
        windSpeedKmh: 12,
        visibilityMeters: 9000,
        isDisruptive: false,
        recordedAt: new Date().toISOString()
      };

      this.store.weatherReports.set(hub.id, condition);
    }
  }

  public async fetchLiveWeatherForHub(hub: Hub): Promise<WeatherCondition> {
    if (this.apiKey) {
      try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${hub.latitude}&lon=${hub.longitude}&appid=${this.apiKey}&units=metric`;
        const res = await fetch(url);
        if (res.ok) {
          const data = (await res.json()) as any;
          const conditionType = this.mapWeatherCondition(data.weather[0]?.main || 'Clear');
          const visibility = data.visibility || 10000;
          const isDisruptive = visibility < 1000 || conditionType === 'THUNDERSTORM' || conditionType === 'FOG';

          const condition: WeatherCondition = {
            hubId: hub.id,
            hubCode: hub.code,
            temperatureC: Math.round(data.main?.temp || 28),
            condition: conditionType,
            windSpeedKmh: Math.round((data.wind?.speed || 3) * 3.6),
            visibilityMeters: visibility,
            isDisruptive,
            disruptionReason: isDisruptive ? `Severe ${conditionType} with visibility ${visibility}m` : undefined,
            recordedAt: new Date().toISOString()
          };

          this.store.weatherReports.set(hub.id, condition);
          if (isDisruptive) {
            this.ws.broadcast('WEATHER_ALERT', condition);
          }
          return condition;
        }
      } catch (err) {
        // fallback to stored condition
      }
    }

    return this.store.weatherReports.get(hub.id) || {
      hubId: hub.id,
      hubCode: hub.code,
      temperatureC: 30,
      condition: 'CLEAR',
      windSpeedKmh: 10,
      visibilityMeters: 8000,
      isDisruptive: false,
      recordedAt: new Date().toISOString()
    };
  }

  public injectWeatherEvent(hubId: string, event: Partial<WeatherCondition>): WeatherCondition | null {
    const hub = this.store.hubs.get(hubId);
    if (!hub) return null;

    const existing = this.store.weatherReports.get(hubId);
    const updated: WeatherCondition = {
      ...existing,
      hubId,
      hubCode: hub.code,
      temperatureC: event.temperatureC !== undefined ? event.temperatureC : (existing?.temperatureC || 26),
      condition: event.condition || 'THUNDERSTORM',
      windSpeedKmh: event.windSpeedKmh !== undefined ? event.windSpeedKmh : 55,
      visibilityMeters: event.visibilityMeters !== undefined ? event.visibilityMeters : 600,
      isDisruptive: event.isDisruptive !== undefined ? event.isDisruptive : true,
      disruptionReason: event.disruptionReason || 'Severe weather alert triggering operational delays',
      recordedAt: new Date().toISOString()
    };

    this.store.weatherReports.set(hubId, updated);
    this.ws.broadcast('WEATHER_ALERT', updated);
    return updated;
  }

  private mapWeatherCondition(main: string): WeatherCondition['condition'] {
    const lower = main.toLowerCase();
    if (lower.includes('rain')) return 'RAIN';
    if (lower.includes('thunder')) return 'THUNDERSTORM';
    if (lower.includes('fog') || lower.includes('mist')) return 'FOG';
    if (lower.includes('snow')) return 'SNOW';
    return 'CLEAR';
  }
}
