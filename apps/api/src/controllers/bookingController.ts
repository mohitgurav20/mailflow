import { Request, Response } from 'express';
import { DataStore } from '../services/store.js';
import { AuditService } from '../services/auditService.js';
import { Booking } from '@mailflow/shared-types';

export class BookingController {
  public static listBookings(req: Request, res: Response): void {
    const store = DataStore.getInstance();
    res.json({
      success: true,
      count: store.bookings.size,
      data: store.getBookingsList()
    });
  }

  public static confirmBooking(req: Request, res: Response): void {
    try {
      const store = DataStore.getInstance();
      const audit = AuditService.getInstance();
      const { consignmentId, legId, carrierName, serviceCode, bookedWeightKg = 1.0, costINR = 100 } = req.body;

      if (!consignmentId || !legId) {
        res.status(400).json({ success: false, error: 'Missing consignmentId or legId' });
        return;
      }

      const id = `bk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const manifestNumber = `MNF-INPOST-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

      const booking: Booking = {
        id,
        bookingRef: `BK-${serviceCode || 'CARGO'}-${Date.now().toString().slice(-4)}`,
        consignmentId,
        legId,
        carrierName: carrierName || 'Scheduled Carrier',
        serviceCode: serviceCode || 'GEN-SVC',
        bookedWeightKg,
        costINR,
        status: 'CONFIRMED',
        manifestNumber,
        requestedAt: new Date().toISOString(),
        confirmedAt: new Date().toISOString(),
        notes: 'Handshake confirmed with transport agency EDI gateway'
      };

      store.bookings.set(id, booking);

      // Increment booked capacity on leg
      const leg = store.legs.get(legId);
      if (leg) {
        leg.bookedKg = Math.min(leg.capacityKg, leg.bookedKg + bookedWeightKg);
        store.legs.set(leg.id, leg);
      }

      audit.log({
        action: 'BOOKING_CONFIRMED',
        entityType: 'BOOKING',
        entityId: id,
        description: `Confirmed transport capacity booking ${booking.bookingRef} on ${carrierName} (Manifest ${manifestNumber}).`,
        newState: booking
      });

      res.status(201).json({
        success: true,
        data: booking
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error confirming booking'
      });
    }
  }
}
