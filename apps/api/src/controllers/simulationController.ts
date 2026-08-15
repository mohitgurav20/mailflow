import { Request, Response } from 'express';
import { SimulationService } from '../services/simulationService.js';

export class SimulationController {
  public static getState(req: Request, res: Response): void {
    const sim = SimulationService.getInstance();
    res.json({
      success: true,
      data: sim.getState()
    });
  }

  public static start(req: Request, res: Response): void {
    const sim = SimulationService.getInstance();
    const state = sim.startSimulation();
    res.json({
      success: true,
      message: 'Simulation clock started (1 real sec = 10 sim minutes).',
      data: state
    });
  }

  public static stop(req: Request, res: Response): void {
    const sim = SimulationService.getInstance();
    const state = sim.stopSimulation();
    res.json({
      success: true,
      message: 'Simulation clock stopped.',
      data: state
    });
  }

  public static reset(req: Request, res: Response): void {
    const sim = SimulationService.getInstance();
    const { scenario } = req.body;
    sim.resetSimulation(scenario || 'DELHI_MUMBAI_CORRIDOR_DISRUPTION');
    res.json({
      success: true,
      message: 'Simulation state reset with 20 fresh Indian Post consignments.',
      data: sim.getState()
    });
  }

  public static step(req: Request, res: Response): void {
    const sim = SimulationService.getInstance();
    const { deltaMinutes = 15 } = req.body;
    const state = sim.stepSimulation(parseInt(deltaMinutes, 10));
    res.json({
      success: true,
      data: state
    });
  }
}
