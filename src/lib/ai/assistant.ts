import { db } from "@/db";
import { workers, workerLanguages, workerSkills, clients, invoices, visas, recruitmentCandidates } from "@/db/schema";
import { eq, and, sql, lte, gte, ilike, inArray } from "drizzle-orm";

export interface AIChatResponse {
  answer: string;
  data?: any;
  pendingAction?: {
    actionType: string;
    description: string;
    payload: any;
  };
}

export async function processAgencyAIQuery(
  agencyId: number,
  query: string,
  confirmedAction?: any
): Promise<AIChatResponse> {
  const lowerQuery = query.toLowerCase();

  // If a confirmed action was provided, execute it
  if (confirmedAction) {
    const { actionType, payload } = confirmedAction;
    if (actionType === "update_worker_status") {
      const { workerId, newStatus } = payload;
      await db
        .update(workers)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(and(eq(workers.agencyId, agencyId), eq(workers.id, workerId)));

      return {
        answer: `Successfully updated Worker #${workerId} status to "${newStatus}".`,
      };
    }
    if (actionType === "update_visa_status") {
      const { visaId, newStatus } = payload;
      await db
        .update(visas)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(and(eq(visas.agencyId, agencyId), eq(visas.id, visaId)));

      return {
        answer: `Successfully updated Visa #${visaId} status to "${newStatus}".`,
      };
    }
  }

  // 1. Check mutating intent requiring confirmation
  if (
    lowerQuery.includes("move worker") ||
    lowerQuery.includes("update worker") ||
    lowerQuery.includes("change worker status") ||
    lowerQuery.includes("approve visa")
  ) {
    // Parse ID and status if possible, e.g. "Move Worker 123 to Visa Approved" or "deployed"
    const workerMatch = query.match(/worker\s+#?(\d+)/i);
    const visaMatch = query.match(/visa\s+#?(\d+)/i);

    if (workerMatch) {
      const workerId = parseInt(workerMatch[1], 10);
      let newStatus = "processing";
      if (lowerQuery.includes("deploy") || lowerQuery.includes("deployed")) newStatus = "deployed";
      else if (lowerQuery.includes("visa approved") || lowerQuery.includes("approved")) newStatus = "visa_approved";
      else if (lowerQuery.includes("processing")) newStatus = "processing";
      else if (lowerQuery.includes("available")) newStatus = "available";

      return {
        answer: `⚠️ Action Confirmation Required: Do you want to update Worker #${workerId} status to "${newStatus}"?`,
        pendingAction: {
          actionType: "update_worker_status",
          description: `Update Worker #${workerId} status to ${newStatus}`,
          payload: { workerId, newStatus },
        },
      };
    }

    if (visaMatch) {
      const visaId = parseInt(visaMatch[1], 10);
      return {
        answer: `⚠️ Action Confirmation Required: Do you want to update Visa #${visaId} status to "approved"?`,
        pendingAction: {
          actionType: "update_visa_status",
          description: `Update Visa #${visaId} status to approved`,
          payload: { visaId, newStatus: "approved" },
        },
      };
    }
  }

  // 2. Natural language queries over agency data with strict tenant isolation (agencyId)

  // Query: "How many workers are currently waiting for visas?" or similar
  if (lowerQuery.includes("waiting for visa") || lowerQuery.includes("visa pending") || lowerQuery.includes("how many workers...visa")) {
    const visaPendingWorkers = await db
      .select({ count: sql`count(*)` })
      .from(workers)
      .where(and(eq(workers.agencyId, agencyId), eq(workers.status, "processing")));

    const count = Number(visaPendingWorkers[0]?.count || 0);
    return {
      answer: `There are currently ${count} workers undergoing visa processing / waiting for visas in your agency.`,
      data: { count, status: "processing" },
    };
  }

  // Query: "Show workers whose passports expire within 60 days"
  if (lowerQuery.includes("passport") && (lowerQuery.includes("expire") || lowerQuery.includes("expiring"))) {
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

    const expiringWorkers = await db
      .select()
      .from(workers)
      .where(
        and(
          eq(workers.agencyId, agencyId),
          lte(workers.passportExpiryDate, sixtyDaysFromNow),
          gte(workers.passportExpiryDate, new Date())
        )
      );

    return {
      answer: `Found ${expiringWorkers.length} worker(s) whose passports expire within the next 60 days.`,
      data: expiringWorkers,
    };
  }

  // Query: "Find available Arabic-speaking nannies" or "Arabic-speaking"
  if (lowerQuery.includes("arabic") || lowerQuery.includes("nanny") || lowerQuery.includes("maid") || lowerQuery.includes("driver")) {
    // Find workers with Arabic language proficiency or skills
    const arabicWorkers = await db
      .select({
        worker: workers,
        lang: workerLanguages.language,
      })
      .from(workers)
      .innerJoin(workerLanguages, eq(workers.id, workerLanguages.workerId))
      .where(
        and(
          eq(workers.agencyId, agencyId),
          ilike(workerLanguages.language, "%Arabic%"),
          eq(workers.status, "available")
        )
      );

    return {
      answer: `Found ${arabicWorkers.length} available worker(s) who speak Arabic.`,
      data: arabicWorkers.map((w) => w.worker),
    };
  }

  // Query: "Which clients have unpaid invoices?"
  if (lowerQuery.includes("unpaid invoice") || lowerQuery.includes("clients have unpaid") || lowerQuery.includes("unpaid bills")) {
    const unpaidInvoices = await db
      .select({
        invoice: invoices,
        client: clients,
      })
      .from(invoices)
      .innerJoin(clients, eq(invoices.clientId, clients.id))
      .where(
        and(
          eq(invoices.agencyId, agencyId),
          inArray(invoices.status, ["unpaid", "overdue", "partially_paid"])
        )
      );

    return {
      answer: `Found ${unpaidInvoices.length} unpaid invoice(s) across your clients.`,
      data: unpaidInvoices,
    };
  }

  // Query: "How many workers were deployed this month?"
  if (lowerQuery.includes("deployed this month") || lowerQuery.includes("deployment")) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const deployedWorkers = await db
      .select({ count: sql`count(*)` })
      .from(workers)
      .where(
        and(
          eq(workers.agencyId, agencyId),
          eq(workers.status, "deployed"),
          gte(workers.updatedAt, startOfMonth)
        )
      );

    const count = Number(deployedWorkers[0]?.count || 0);
    return {
      answer: `${count} worker(s) have been deployed this month.`,
      data: { count, period: "this_month" },
    };
  }

  // General fallback search
  return {
    answer: `I am Agency AI, your recruitment operations assistant. I can answer queries regarding visa processing workers, expiring passports, Arabic-speaking candidates, unpaid client invoices, and monthly deployments. How can I help your agency today?`,
  };
}
