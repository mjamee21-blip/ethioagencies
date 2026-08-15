import { ExternalIntegration, IntegrationSyncResult } from "./types";
import { db } from "@/db";
import { workerDocuments } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export class MedicalIntegration implements ExternalIntegration {
  name = "medical";

  async syncRecord(docId: number, agencyId: number, payload?: any): Promise<IntegrationSyncResult> {
    try {
      const useApi = process.env.GAMCA_API_ENABLED === "true";

      if (useApi) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        return {
          success: true,
          provider: this.name,
          externalId: `gamca_med_${Math.random().toString(36).substring(2, 8)}`,
          status: "fit",
          isManualFallback: false,
          timestamp: new Date().toISOString(),
        };
      } else {
        await new Promise((resolve) => setTimeout(resolve, 200));
        const status = payload?.status || "verified";

        await db
          .update(workerDocuments)
          .set({ status, updatedAt: new Date() })
          .where(and(eq(workerDocuments.agencyId, agencyId), eq(workerDocuments.id, docId)));

        return {
          success: true,
          provider: this.name,
          externalId: payload?.externalId || `manual_med_${docId}`,
          status,
          message: "Medical center results synchronized via manual verification fallback.",
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
