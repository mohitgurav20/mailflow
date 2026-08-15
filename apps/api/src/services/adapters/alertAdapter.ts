import { NotificationAlert, Consignment } from '@mailflow/shared-types';
import { DataStore } from '../store.js';
import { WebSocketGateway } from '../wsServer.js';

export class AlertAdapter {
  private static instance: AlertAdapter;
  private store: DataStore;
  private ws: WebSocketGateway;
  private resendApiKey: string | null = process.env.RESEND_API_KEY || null;

  private constructor() {
    this.store = DataStore.getInstance();
    this.ws = WebSocketGateway.getInstance();
  }

  public static getInstance(): AlertAdapter {
    if (!AlertAdapter.instance) {
      AlertAdapter.instance = new AlertAdapter();
    }
    return AlertAdapter.instance;
  }

  /**
   * Dispatches proactive alert to sender and recipient when ETA slips or disruption occurs.
   */
  public async sendAlert(params: {
    consignment: Consignment;
    alertType: NotificationAlert['alertType'];
    subject: string;
    messageBody: string;
    channel?: NotificationAlert['channel'];
  }): Promise<NotificationAlert> {
    const { consignment, alertType, subject, messageBody, channel = 'BOTH' } = params;

    const alertId = `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const trackingUrl = `https://mailflow.gov.in/track/${consignment.trackingToken}`;

    const notification: NotificationAlert = {
      id: alertId,
      consignmentId: consignment.id,
      trackingNumber: consignment.trackingNumber,
      recipientEmail: consignment.recipient.email || consignment.sender.email,
      recipientPhone: consignment.recipient.phone || consignment.sender.phone,
      alertType,
      subject,
      messageBody,
      channel,
      status: 'PENDING',
      trackingUrl
    };

    // If Resend API Key is provided, attempt live dispatch, otherwise log structured mock
    if (this.resendApiKey && notification.recipientEmail) {
      try {
        // Send email via Resend REST endpoint
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'India Post MailFlow <alerts@mailflow.gov.in>',
            to: [notification.recipientEmail],
            subject: `[India Post] ${subject}`,
            html: `
              <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
                <h2 style="color: #0f172a;">India Post Operational Dispatch Notice</h2>
                <p>Dear Citizen / Partner,</p>
                <p>Consignment <strong>${consignment.trackingNumber}</strong> (${consignment.mailClass}) update:</p>
                <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; border-left: 4px solid #ea580c; margin: 15px 0;">
                  <p style="margin: 0; font-size: 15px;">${messageBody}</p>
                </div>
                <p>Revised Estimated Delivery: <strong>${new Date(consignment.currentETA).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</strong></p>
                <a href="${trackingUrl}" style="display: inline-block; background: #0284c7; color: #fff; padding: 10px 18px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">Track Live Status</a>
                <p style="font-size: 12px; color: #64748b; margin-top: 20px;">Automated notification from MailFlow Decision Support System · Department of Posts</p>
              </div>
            `
          })
        });

        if (res.ok) {
          notification.status = 'SENT';
          notification.sentAt = new Date().toISOString();
        } else {
          notification.status = 'MOCKED';
          notification.sentAt = new Date().toISOString();
        }
      } catch (err) {
        notification.status = 'MOCKED';
        notification.sentAt = new Date().toISOString();
      }
    } else {
      notification.status = 'MOCKED';
      notification.sentAt = new Date().toISOString();
    }

    this.store.notifications.push(notification);

    // Broadcast live notification event via WebSocket
    this.ws.broadcast('NOTIFICATION_SENT', notification);

    return notification;
  }
}
