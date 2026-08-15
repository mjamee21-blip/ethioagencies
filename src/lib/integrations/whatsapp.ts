import { ExternalIntegration, IntegrationSyncResult } from "./types";
import { notificationProvider } from "@/lib/notifications/provider";

export class WhatsAppIntegration implements ExternalIntegration {
  name = "whatsapp";

  async syncRecord(recordId: number, agencyId: number, payload?: any): Promise<IntegrationSyncResult> {
    try {
      const { to, message, templateName, templateData } = payload || {};
      if (!to) {
        throw new Error("Recipient 'to' phone number is required for WhatsApp integration");
      }

      const res = await notificationProvider.send({
        channel: "whatsapp",
        to,
        message,
        templateName,
        templateData,
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
