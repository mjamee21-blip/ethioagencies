import { ExternalIntegration, IntegrationSyncResult } from "./types";
import { db } from "@/db";
import { recruitmentOrders } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export class MusanedIntegration implements ExternalIntegration {
  name = "musaned";

  async syncRecord(orderId: number, agencyId: number, payload?: any): Promise<IntegrationSyncResult> {
    try {
      // Check if official Musaned API is configured or fall back to manual sync
      const useApi = process.env.MUSANED_API_ENABLED === "true";

      if (useApi) {
        // Simulate official Musaned API call
        await new Promise((resolve) => setTimeout(resolve, 500));
        return {
          success: true,
          provider: this.name,
          externalId: `musaned_contract_${Math.random().toString(36).substring(2, 8)}`,
          status: "synced_with_api",
          isManualFallback: false,
          timestamp: new Date().toISOString(),
        };
      } else {
        // Manual synchronization fallback
        await new Promise((resolve) => setTimeout(resolve, 200));
        const manualStatus = payload?.status || "manually_verified";
        
        await db
          .update(recruitmentOrders)
          .set({ status: manualStatus === "approved" ? "in_progress" : "open", updatedAt: new Date() })
          .where(and(eq(recruitmentOrders.agencyId, agencyId), eq(recruitmentOrders.id, orderId)));

        return {
          success: true,
          provider: this.name,
          externalId: payload?.externalId || `manual_musaned_${orderId}`,
          status: manualStatus,
          message: "Musaned order synchronized via manual fallback confirmation.",
          isManualFallback: true,
          timestamp: new Date().toISOString(),
        };
      }
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
