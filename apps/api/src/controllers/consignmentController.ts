import { Request, Response } from 'express';
import { DataStore } from '../services/store.js';
import { RoutingService } from '../services/routingService.js';
import { RiskService } from '../services/riskService.js';
import { AuditService } from '../services/auditService.js';
import { WebSocketGateway } from '../services/wsServer.js';
import { Consignment, RouteOption } from '@mailflow/shared-types';

export class ConsignmentController {
  public static listConsignments(req: Request, res: Response): void {
    const store = DataStore.getInstance();
    const { status, mailClass, hubId, search } = req.query;

    let items = store.getConsignmentsList();

    if (status) {
      items = items.filter(c => c.status === status);
    }
    if (mailClass) {
      items = items.filter(c => c.mailClass === mailClass);
    }
    if (hubId) {
      items = items.filter(c => c.originHubId === hubId || c.destHubId === hubId || c.currentHubId === hubId);
    }
    if (search) {
      const q = (search as string).toLowerCase();
      items = items.filter(
        c =>
          c.trackingNumber.toLowerCase().includes(q) ||
          c.sender.name.toLowerCase().includes(q) ||
          c.recipient.name.toLowerCase().includes(q)
      );
    }

    res.json({
      success: true,
      count: items.length,
      data: items
    });
  }

  public static getConsignment(req: Request, res: Response): void {
    const store = DataStore.getInstance();
    const { id } = req.params;
    const consignment = store.consignments.get(id);

    if (!consignment) {
      res.status(404).json({ success: false, error: `Consignment not found: ${id}` });
      return;
    }

    res.json({
      success: true,
      data: consignment
    });
  }

  public static inductConsignment(req: Request, res: Response): void {
    try {
      const store = DataStore.getInstance();
      const routing = RoutingService.getInstance();
      const riskService = RiskService.getInstance();
      const audit = AuditService.getInstance();
      const ws = WebSocketGateway.getInstance();

      const body = req.body;
      const {
        sender,
        recipient,
        originHubId,
        destHubId,
        weightKg = 1.0,
        mailClass = 'SPEED_POST',
        priority = 'STANDARD',
        declaredValueINR = 1000,
        contentsDescription = 'Standard Postal Packet',
        selectedRouteOption
      } = body;

      if (!originHubId || !destHubId || !sender || !recipient) {
        res.status(400).json({
          success: false,
          error: 'Missing required consignment induction fields.'
        });
        return;
      }

      // Check embargo
      const graph = routing.computeRoutes({ originHubId, destHubId, weightKg, mailClass });
      if (graph.options.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Cannot induct consignment: Destination is currently unreachable or embargoed.'
        });
        return;
      }

      const assignedRoute: RouteOption = selectedRouteOption || graph.options[0];
      const trackingNumber = `SP-IN-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const trackingToken = `trk-${Math.random().toString(36).substring(2, 10)}`;
      const id = `cs-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const now = new Date().toISOString();

      const consignment: Consignment = {
        id,
        trackingNumber,
        trackingToken,
        sender,
        recipient,
        originHubId,
        destHubId,
        currentHubId: originHubId,
        currentLegId: assignedRoute.legs[0]?.legId || null,
        weightKg,
        mailClass,
        priority,
        status: 'INDUCTED',
        declaredValueINR,
        contentsDescription,
        selectedRouteOption: assignedRoute,
        currentLegIndex: 0,
        inductionTime: now,
        originalETA: assignedRoute.estimatedDeliveryTime,
        currentETA: assignedRoute.estimatedDeliveryTime,
        etaSlipMinutes: 0,
        riskScore: 0.1,
        riskLevel: 'LOW',
        history: [
          {
            timestamp: now,
            locationHubId: originHubId,
            eventType: 'INDUCTED',
            description: `Consignment inducted at ${originHubId}. Route assigned via ${assignedRoute.legs.map(l => l.carrierName).join(' ➔ ')}.`,
            actor: req.body.operatorName || 'Induction Counter'
          }
        ],
        lastUpdated: now
      };

      riskService.evaluateConsignmentRisk(consignment);
      store.consignments.set(id, consignment);

      audit.log({
        action: 'CONSIGNMENT_INDUCTED',
        entityType: 'CONSIGNMENT',
        entityId: id,
        description: `Inducted consignment ${trackingNumber} (${mailClass}, ${weightKg}kg) from ${originHubId} to ${destHubId}.`
      });

      ws.broadcast('CONSIGNMENT_INDUCTED', consignment);

      res.status(201).json({
        success: true,
        data: consignment
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error inducting consignment'
      });
    }
  }

  public static bulkUploadCSV(req: Request, res: Response): void {
    try {
      const store = DataStore.getInstance();
      const routing = RoutingService.getInstance();
      const riskService = RiskService.getInstance();
      const audit = AuditService.getInstance();
      const ws = WebSocketGateway.getInstance();

      const { csvData, records } = req.body;
      const parsedRecords: any[] = records || [];

      // If raw CSV string passed
      if (typeof csvData === 'string' && parsedRecords.length === 0) {
        const lines = csvData.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const cols = lines[i].split(',').map(c => c.trim());
          const obj: any = {};
          headers.forEach((h, idx) => {
            obj[h] = cols[idx];
          });
          parsedRecords.push(obj);
        }
      }

      if (parsedRecords.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No valid records found in bulk upload.'
        });
        return;
      }

      const inducted: Consignment[] = [];

      for (const row of parsedRecords) {
        const originHubId = row.originHubId || 'hub-del';
        const destHubId = row.destHubId || 'hub-bom';
        const weightKg = parseFloat(row.weightKg) || 1.5;
        const mailClass = row.mailClass || 'SPEED_POST';

        const routeRes = routing.computeRoutes({ originHubId, destHubId, weightKg, mailClass });
        if (routeRes.options.length === 0) continue;

        const assignedRoute = routeRes.options[0];
        const trackingNumber = `SP-IN-BULK-${Math.floor(100000 + Math.random() * 900000)}`;
        const trackingToken = `trk-${Math.random().toString(36).substring(2, 10)}`;
        const id = `cs-bulk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const now = new Date().toISOString();

        const consignment: Consignment = {
          id,
          trackingNumber,
          trackingToken,
          sender: {
            name: row.senderName || 'Bulk Enterprise Sender',
            pinCode: row.senderPin || '110001',
            city: row.senderCity || 'New Delhi',
            email: row.senderEmail
          },
          recipient: {
            name: row.recipientName || 'Citizen Recipient',
            pinCode: row.recipientPin || '400001',
            city: row.recipientCity || 'Mumbai',
            email: row.recipientEmail
          },
          originHubId,
          destHubId,
          currentHubId: originHubId,
          currentLegId: assignedRoute.legs[0]?.legId || null,
          weightKg,
          mailClass,
          priority: row.priority || 'STANDARD',
          status: 'INDUCTED',
          declaredValueINR: parseFloat(row.declaredValueINR) || 2000,
          contentsDescription: row.contentsDescription || 'Bulk Commerce Dispatch',
          selectedRouteOption: assignedRoute,
          currentLegIndex: 0,
          inductionTime: now,
          originalETA: assignedRoute.estimatedDeliveryTime,
          currentETA: assignedRoute.estimatedDeliveryTime,
          etaSlipMinutes: 0,
          riskScore: 0.1,
          riskLevel: 'LOW',
          history: [
            {
              timestamp: now,
              locationHubId: originHubId,
              eventType: 'INDUCTED',
              description: `Bulk CSV induction. Assigned ${assignedRoute.legs.length}-leg route.`
            }
          ],
          lastUpdated: now
        };

        riskService.evaluateConsignmentRisk(consignment);
        store.consignments.set(id, consignment);
        inducted.push(consignment);
      }

      audit.log({
        action: 'BULK_CSV_INDUCTION',
        entityType: 'CONSIGNMENT',
        entityId: 'BULK_BATCH',
        description: `Successfully inducted ${inducted.length} consignments from bulk CSV stream.`
      });

      res.status(201).json({
        success: true,
        count: inducted.length,
        data: inducted
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error processing bulk CSV induction'
      });
    }
  }
}
