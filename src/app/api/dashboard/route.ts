import { NextResponse } from "next/server";
import { db } from "@/db";
import { workers, workerDocuments, clients, recruitmentOrders, recruitmentCandidates, invoices, visas, travelRecords } from "@/db/schema";
import { eq, and, sql, count, lt, gte } from "drizzle-orm";
import { getCurrentSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agencyId = session.agencyId;

    // 1. Worker Stats
    const allWorkers = await db.select().from(workers).where(eq(workers.agencyId, agencyId));
    const totalWorkers = allWorkers.length;
    const availableWorkers = allWorkers.filter(w => w.status === "available").length;
    const processingWorkers = allWorkers.filter(w => w.status === "processing").length;
    const deployedWorkers = allWorkers.filter(w => w.status === "deployed").length;

    // 2. Client & Order Stats
    const agencyClients = await db.select().from(clients).where(eq(clients.agencyId, agencyId));
    const activeClientsCount = agencyClients.filter(c => c.status === "active").length;

    const agencyOrders = await db.select().from(recruitmentOrders).where(eq(recruitmentOrders.agencyId, agencyId));
    const openOrdersCount = agencyOrders.filter(o => o.status === "open" || o.status === "in_progress").length;

    // 3. Financial Stats (Pending payments/invoices)
    const agencyInvoices = await db.select().from(invoices).where(eq(invoices.agencyId, agencyId));
    const pendingInvoices = agencyInvoices.filter(i => i.status === "unpaid" || i.status === "overdue");
    const pendingPaymentsAmount = pendingInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount || "0"), 0);

    // 4. Expiring Documents (within 30 days)
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const docs = await db.select().from(workerDocuments).where(eq(workerDocuments.agencyId, agencyId));
    const expiringDocsCount = docs.filter(d => {
      if (!d.expiryDate) return false;
      const expDate = new Date(d.expiryDate);
      return expDate >= now && expDate <= thirtyDaysFromNow;
    }).length;

    // Awaiting visa / medical / travel breakdown
    const candidates = await db.select().from(recruitmentCandidates).where(eq(recruitmentCandidates.agencyId, agencyId));
    const medicalPendingCount = candidates.filter(c => c.status === "medical_pending").length;
    const visaProcessingCount = candidates.filter(c => c.status === "visa_processing").length;

    // Pipeline stages breakdown
    const pipelineStages = {
      nominated: candidates.filter(c => c.status === "nominated").length,
      shortlisted: candidates.filter(c => c.status === "shortlisted").length,
      interviewed: candidates.filter(c => c.status === "interviewed").length,
      medical_pending: medicalPendingCount,
      visa_processing: visaProcessingCount,
      deployed: deployedWorkers,
    };

    // Action Required Cards
    const actionRequired = [];
    if (expiringDocsCount > 0) {
      actionRequired.push({
        id: "expiring-docs",
        title: "Expiring Worker Documents",
        description: `${expiringDocsCount} worker document(s) expiring within 30 days.`,
        severity: "warning",
        link: "/documents",
      });
    }
    if (medicalPendingCount > 0) {
      actionRequired.push({
        id: "medical-pending",
        title: "Medical Check Pendings",
        description: `${medicalPendingCount} candidate(s) awaiting medical clearance results.`,
        severity: "info",
        link: "/pipeline",
      });
    }
    if (pendingInvoices.length > 0) {
      actionRequired.push({
        id: "pending-payments",
        title: "Unpaid Client Invoices",
        description: `${pendingInvoices.length} invoice(s) pending payment ($${pendingPaymentsAmount.toLocaleString()}).`,
        severity: "danger",
        link: "/clients",
      });
    }

    return NextResponse.json({
      summary: {
        totalWorkers,
        availableWorkers,
        processingWorkers,
        deployedWorkers,
        activeClients: activeClientsCount,
        openOrders: openOrdersCount,
        pendingPayments: pendingPaymentsAmount,
        expiringDocuments: expiringDocsCount,
        awaitingMedical: medicalPendingCount,
        awaitingVisa: visaProcessingCount,
      },
      pipeline: pipelineStages,
      actionRequired,
    });
  } catch (error: any) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
