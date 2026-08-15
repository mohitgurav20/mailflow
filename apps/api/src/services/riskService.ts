import { Consignment, RiskScore, RiskLevel } from '@mailflow/shared-types';
import { DataStore } from './store.js';

export class RiskService {
  private static instance: RiskService;
  private store: DataStore;

  private constructor() {
    this.store = DataStore.getInstance();
  }

  public static getInstance(): RiskService {
    if (!RiskService.instance) {
      RiskService.instance = new RiskService();
    }
    return RiskService.instance;
  }

  /**
   * Calculates dynamic deadline breach risk score for a consignment.
   */
  public evaluateConsignmentRisk(consignment: Consignment, currentSimTime: Date = new Date()): RiskScore {
    const originalETA = new Date(consignment.originalETA);
    const currentETA = new Date(consignment.currentETA);
    const timeRemainingMs = originalETA.getTime() - currentSimTime.getTime();
    const deadlineMinutesRemaining = Math.round(timeRemainingMs / (60 * 1000));

    const estMinutesToDeliver = Math.round((currentETA.getTime() - currentSimTime.getTime()) / (60 * 1000));
    const bufferMinutes = deadlineMinutesRemaining - estMinutesToDeliver;

    // Remaining legs reliability average
    let avgDownstreamReliability = 0.90;
    if (consignment.selectedRouteOption) {
      const remainingLegs = consignment.selectedRouteOption.legs.slice(consignment.currentLegIndex);
      if (remainingLegs.length > 0) {
        const sum = remainingLegs.reduce((acc, leg) => {
          const score = this.store.legs.get(leg.legId)?.reliabilityScore || leg.reliabilityScore;
          return acc + score;
        }, 0);
        avgDownstreamReliability = sum / remainingLegs.length;
      }
    }

    // Risk factors
    let riskScore = 0.0;
    let riskFactor = 'On schedule with normal buffer';

    if (consignment.status === 'DELIVERED') {
      riskScore = 0.0;
      riskFactor = 'Consignment successfully delivered';
    } else if (bufferMinutes < -60) {
      riskScore = 0.95;
      riskFactor = `Severe SLA breach: ETA slipped by ${Math.abs(bufferMinutes)} minutes`;
    } else if (bufferMinutes < 0) {
      riskScore = 0.75;
      riskFactor = `Potential SLA breach: Current ETA exceeds target deadline by ${Math.abs(bufferMinutes)}m`;
    } else if (bufferMinutes < 60) {
      riskScore = 0.50;
      riskFactor = `Tight deadline buffer: only ${bufferMinutes}m margin remaining`;
    } else if (avgDownstreamReliability < 0.85) {
      riskScore = 0.40;
      riskFactor = `Downstream transport reliability is low (${Math.round(avgDownstreamReliability * 100)}%)`;
    } else {
      riskScore = 0.15;
      riskFactor = `Optimal transit: ${bufferMinutes}m buffer available`;
    }

    let riskLevel: RiskLevel = 'LOW';
    if (riskScore >= 0.8) riskLevel = 'CRITICAL';
    else if (riskScore >= 0.6) riskLevel = 'HIGH';
    else if (riskScore >= 0.35) riskLevel = 'MEDIUM';

    // Update consignment object
    consignment.riskScore = Math.round(riskScore * 100) / 100;
    consignment.riskLevel = riskLevel;

    return {
      consignmentId: consignment.id,
      trackingNumber: consignment.trackingNumber,
      currentRiskScore: consignment.riskScore,
      riskLevel,
      deadlineMinutesRemaining,
      estimatedMinutesToDeliver: Math.max(0, estMinutesToDeliver),
      bufferMinutes,
      primaryRiskFactor: riskFactor
    };
  }
}
