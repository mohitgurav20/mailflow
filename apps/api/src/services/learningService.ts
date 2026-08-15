import { ReliabilityScore, Leg } from '@mailflow/shared-types';
import { DataStore } from './store.js';
import { WebSocketGateway } from './wsServer.js';

export class LearningService {
  private static instance: LearningService;
  private store: DataStore;
  private ws: WebSocketGateway;

  private constructor() {
    this.store = DataStore.getInstance();
    this.ws = WebSocketGateway.getInstance();
  }

  public static getInstance(): LearningService {
    if (!LearningService.instance) {
      LearningService.instance = new LearningService();
    }
    return LearningService.instance;
  }

  /**
   * Updates EWMA on-time reliability score for a leg when a trip completes.
   * Formula: Score_t = alpha * TripPerformance + (1 - alpha) * Score_{t-1}
   * TripPerformance: 1.0 (on time, <= 15m delay), 0.5 (moderate delay <= 60m), 0.0 (severe delay > 60m or cancelled)
   */
  public recordTripPerformance(params: {
    legId: string;
    delayMinutes: number;
    wasCancelled?: boolean;
    timestamp?: string;
  }): ReliabilityScore | null {
    const { legId, delayMinutes, wasCancelled = false, timestamp = new Date().toISOString() } = params;
    const scoreObj = this.store.reliabilityScores.get(legId);
    const legObj = this.store.legs.get(legId);

    if (!scoreObj || !legObj) return null;

    let tripPerformance = 1.0;
    if (wasCancelled) {
      tripPerformance = 0.0;
      scoreObj.cancelledTrips += 1;
    } else if (delayMinutes > 60) {
      tripPerformance = 0.1;
      scoreObj.delayedTrips += 1;
    } else if (delayMinutes > 15) {
      tripPerformance = 0.6;
      scoreObj.delayedTrips += 1;
    } else {
      tripPerformance = 1.0;
      scoreObj.onTimeTrips += 1;
    }

    scoreObj.totalTripsRecorded += 1;
    scoreObj.lastTripTimestamp = timestamp;

    const oldScore = scoreObj.ewmaScore;
    const alpha = scoreObj.alpha || 0.2;
    const newScore = Math.round((alpha * tripPerformance + (1 - alpha) * oldScore) * 1000) / 1000;

    scoreObj.ewmaScore = Math.max(0.1, Math.min(1.0, newScore));
    scoreObj.averageDelayMinutes = Math.round(
      (scoreObj.averageDelayMinutes * (scoreObj.totalTripsRecorded - 1) + delayMinutes) / scoreObj.totalTripsRecorded
    );

    // Trend assessment
    if (newScore > oldScore + 0.02) {
      scoreObj.trend = 'IMPROVING';
    } else if (newScore < oldScore - 0.02) {
      scoreObj.trend = 'DEGRADING';
    } else {
      scoreObj.trend = 'STABLE';
    }

    // Sync updated score back to leg object for future route computations
    legObj.reliabilityScore = scoreObj.ewmaScore;
    this.store.legs.set(legId, legObj);
    this.store.reliabilityScores.set(legId, scoreObj);

    // Broadcast reliability update
    this.ws.broadcast('RELIABILITY_UPDATED', scoreObj);

    return scoreObj;
  }
}
