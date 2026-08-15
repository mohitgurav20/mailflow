import { Router } from 'express';
import { NetworkController } from '../controllers/networkController.js';
import { RouteController } from '../controllers/routeController.js';
import { ConsignmentController } from '../controllers/consignmentController.js';
import { DisruptionController } from '../controllers/disruptionController.js';
import { BookingController } from '../controllers/bookingController.js';
import { ReliabilityController } from '../controllers/reliabilityController.js';
import { EmbargoController } from '../controllers/embargoController.js';
import { AuditController } from '../controllers/auditController.js';
import { TrackingController } from '../controllers/trackingController.js';
import { SimulationController } from '../controllers/simulationController.js';
import { WeatherController } from '../controllers/weatherController.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'MailFlow API Core',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Network topology
router.get('/network/hubs', NetworkController.getHubs);
router.get('/network/legs', NetworkController.getLegs);
router.get('/network/overview', NetworkController.getOverview);
router.get('/network/pincode/:pincode', NetworkController.lookupPinCode);

// Routing Brain
router.post('/routes/compute', RouteController.computeRoutes);

// Consignments
router.get('/consignments', ConsignmentController.listConsignments);
router.get('/consignments/:id', ConsignmentController.getConsignment);
router.post('/consignments', ConsignmentController.inductConsignment);
router.post('/consignments/bulk-upload', ConsignmentController.bulkUploadCSV);

// Disruption Management & Blast Radius
router.get('/disruptions', DisruptionController.listDisruptions);
router.get('/disruptions/:id', DisruptionController.getDisruption);
router.post('/disruptions', DisruptionController.triggerDisruption);
router.post('/disruptions/:id/resolve', DisruptionController.resolveDisruption);

// Bookings & Capacity Manifest Handshake
router.get('/bookings', BookingController.listBookings);
router.post('/bookings/confirm', BookingController.confirmBooking);

// EWMA Reliability Learning Scores
router.get('/reliability/scores', ReliabilityController.getScores);
router.post('/reliability/record-trip', ReliabilityController.recordTrip);

// Embargo Rules
router.get('/embargoes', EmbargoController.listEmbargoes);
router.post('/embargoes', EmbargoController.createEmbargo);
router.patch('/embargoes/:id', EmbargoController.toggleEmbargo);

// Audit Trail
router.get('/audit-logs', AuditController.getLogs);

// Public Tracking
router.get('/track/:token', TrackingController.trackByToken);

// Simulation Engine
router.get('/simulation/state', SimulationController.getState);
router.post('/simulation/start', SimulationController.start);
router.post('/simulation/stop', SimulationController.stop);
router.post('/simulation/reset', SimulationController.reset);
router.post('/simulation/step', SimulationController.step);

// Weather Telemetry
router.get('/weather', WeatherController.getWeather);
router.post('/weather/inject', WeatherController.injectWeather);

export default router;
