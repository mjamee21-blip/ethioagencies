import { ExternalIntegration, IntegrationSyncResult } from "./types";
import { notificationProvider } from "@/lib/notifications/provider";

export class SMSIntegration implements ExternalIntegration {
  name = "sms";

  async syncRecord(recordId: number, agencyId: number, payload?: any): Promise<IntegrationSyncResult> {
    try {
      const { to, message } = payload || {};
      if (!to || !message) {
        throw new Error("Recipient 'to' and 'message' are required for SMS integration");
      }

      const res = await notificationProvider.send({
        channel: "sms",
        to,
        message,
      });

      return {
        success: res.success,
        provider: this.name,
        externalId: res.messageId,
        status: res.success ? "sent" : "failed",
        isManualFallback: false,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        success: false,
        provider: this.name,
        status: "failed",
        error: error.message,
        isManualFallback: true,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
