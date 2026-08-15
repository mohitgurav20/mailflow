import { Request, Response } from 'express';
import { DataStore } from '../services/store.js';
import { WeatherAdapter } from '../services/adapters/weatherAdapter.js';

export class WeatherController {
  public static getWeather(req: Request, res: Response): void {
    const store = DataStore.getInstance();
    res.json({
      success: true,
      count: store.weatherReports.size,
      data: Array.from(store.weatherReports.values())
    });
  }

  public static injectWeather(req: Request, res: Response): void {
    try {
      const adapter = WeatherAdapter.getInstance();
      const { hubId, condition, temperatureC, visibilityMeters, windSpeedKmh, isDisruptive } = req.body;

      if (!hubId) {
        res.status(400).json({ success: false, error: 'hubId is required' });
        return;
      }

      const report = adapter.injectWeatherEvent(hubId, {
        condition,
        temperatureC,
        visibilityMeters,
        windSpeedKmh,
        isDisruptive: isDisruptive !== undefined ? isDisruptive : true,
        disruptionReason: `Injected meteorological hazard: ${condition || 'THUNDERSTORM'} at hub ${hubId}`
      });

      if (!report) {
        res.status(404).json({ success: false, error: `Hub not found: ${hubId}` });
        return;
      }

      res.json({
        success: true,
        data: report
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error updating weather'
      });
    }
  }
}
