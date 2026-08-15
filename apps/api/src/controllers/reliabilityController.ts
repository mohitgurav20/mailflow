import { Request, Response } from 'express';
import { DataStore } from '../services/store.js';
import { LearningService } from '../services/learningService.js';

export class ReliabilityController {
  public static getScores(req: Request, res: Response): void {
    const store = DataStore.getInstance();
    const mode = req.query.mode as string | undefined;

    let scores = store.getReliabilityScoresList();
    if (mode) {
      scores = scores.filter(s => s.mode === mode);
    }

    // Sort by highest reliability
    scores.sort((a, b) => b.ewmaScore - a.ewmaScore);

    res.json({
      success: true,
      count: scores.length,
      data: scores
    });
  }

  public static recordTrip(req: Request, res: Response): void {
    try {
      const learning = LearningService.getInstance();
      const { legId, delayMinutes = 0, wasCancelled = false } = req.body;

      if (!legId) {
        res.status(400).json({ success: false, error: 'Missing legId' });
        return;
      }

      const updatedScore = learning.recordTripPerformance({
        legId,
        delayMinutes: parseInt(delayMinutes, 10),
        wasCancelled: Boolean(wasCancelled)
      });

      if (!updatedScore) {
        res.status(404).json({ success: false, error: `Leg not found: ${legId}` });
        return;
      }

      res.json({
        success: true,
        data: updatedScore
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error recording trip performance'
      });
    }
  }
}
