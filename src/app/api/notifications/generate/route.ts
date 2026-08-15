import { NextResponse } from "next/server";
import { db } from "@/db";
import { notifications, workers, contracts, visas, invoices, workerDocuments } from "@/db/schema";
import { eq, and, lt, lte, isNull, sql } from "drizzle-orm";
import { getCurrentSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agencyId = session.agencyId;
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    let generatedCount = 0;

    // 1. Expiring Passports
    const expiringWorkers = await db
      .select()
      .from(workers)
      .where(
        and(
          eq(workers.agencyId, agencyId),
          lte(workers.passportExpiryDate, thirtyDaysFromNow),
          gtDate(workers.passportExpiryDate, now)
        )
      );

    for (const w of expiringWorkers) {
      const title = "Expiring Passport Reminder";
      const message = `Worker ${w.firstName} ${w.lastName}'s passport expires on ${w.passportExpiryDate?.toISOString().split('T')[0]}.`;
      
      // Check if similar notification already exists
      const [existing] = await db
        .select()
        .from(notifications)
        .where(and(eq(notifications.agencyId, agencyId), eq(notifications.title, title), sql`${notifications.message} LIKE ${'%' + w.firstName + '%'}`));

      if (!existing) {
        await db.insert(notifications).values({
          agencyId,
          userId: session.userId,
          title,
          message,
          isRead: false,
        });
        generatedCount++;
      }
    }

    // 2. Expiring Contracts
    const expiringContracts = await db
      .select()
      .from(contracts)
      .where(
        and(
          eq(contracts.agencyId, agencyId),
          eq(contracts.status, "active"),
          lte(contracts.endDate, thirtyDaysFromNow),
          gtDate(contracts.endDate, now)
        )
      );

    for (const c of expiringContracts) {
      const title = "Expiring Contract Reminder";
      const message = `Contract #${c.contractNumber} is set to expire on ${c.endDate?.toISOString().split('T')[0]}.`;
      
      const [existing] = await db
        .select()
        .from(notifications)
        .where(and(eq(notifications.agencyId, agencyId), eq(notifications.title, title), sql`${notifications.message} LIKE ${'%' + c.contractNumber + '%'}`));

      if (!existing) {
        await db.insert(notifications).values({
          agencyId,
          userId: session.userId,
          title,
          message,
          isRead: false,
        });
        generatedCount++;
      }
    }

    // 3. Overdue Invoices
    const overdueInvoices = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.agencyId, agencyId),
          eq(invoices.status, "unpaid"),
          lt(invoices.dueDate, now)
        )
      );

    for (const inv of overdueInvoices) {
      const title = "Payment Overdue Alert";
      const message = `Invoice #${inv.invoiceNumber} amount ${inv.currency} ${inv.amount} is overdue (Due: ${inv.dueDate.toISOString().split('T')[0]}).`;
      
      const [existing] = await db
        .select()
        .from(notifications)
        .where(and(eq(notifications.agencyId, agencyId), eq(notifications.title, title), sql`${notifications.message} LIKE ${'%' + inv.invoiceNumber + '%'}`));

      if (!existing) {
        await db.insert(notifications).values({
          agencyId,
          userId: session.userId,
          title,
          message,
          isRead: false,
        });
        generatedCount++;
      }
    }

    // 4. Visa Updates / Expiring Visas
    const expiringVisas = await db
      .select()
      .from(visas)
      .where(
        and(
          eq(visas.agencyId, agencyId),
          lte(visas.expiryDate, thirtyDaysFromNow),
          gtDate(visas.expiryDate, now)
        )
      );

    for (const v of expiringVisas) {
      const title = "Visa Expiry Reminder";
      const message = `Visa #${v.visaNumber} (${v.visaType}) is expiring on ${v.expiryDate.toISOString().split('T')[0]}.`;
      
      const [existing] = await db
        .select()
        .from(notifications)
        .where(and(eq(notifications.agencyId, agencyId), eq(notifications.title, title), sql`${notifications.message} LIKE ${'%' + v.visaNumber + '%'}`));

      if (!existing) {
        await db.insert(notifications).values({
          agencyId,
          userId: session.userId,
          title,
          message,
          isRead: false,
        });
        generatedCount++;
      }
    }

    return NextResponse.json({ success: true, generatedCount });
  } catch (error: any) {
    console.error("Notifications Generate Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

function gtDate(column: any, date: Date) {
  return sql`${column} > ${date}`;
}
