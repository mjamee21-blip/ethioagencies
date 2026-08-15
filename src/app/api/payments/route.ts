import { NextResponse } from "next/server";
import { db } from "@/db";
import { payments, invoices, clients } from "@/db/schema";
import { eq, and, ilike, or, sql } from "drizzle-orm";
import { getCurrentSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const invoiceId = searchParams.get("invoiceId");

    const agencyId = session.agencyId;
    let conditions = [eq(payments.agencyId, agencyId)];

    if (status && status !== "all") {
      conditions.push(eq(payments.status, status));
    }
    if (invoiceId && invoiceId !== "all") {
      conditions.push(eq(payments.invoiceId, parseInt(invoiceId, 10)));
    }
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          ilike(payments.referenceNumber, searchTerm),
          ilike(payments.paymentMethod, searchTerm)
        )
      );
    }

    const result = await db
      .select({
        id: payments.id,
        agencyId: payments.agencyId,
        invoiceId: payments.invoiceId,
        amount: payments.amount,
        currency: payments.currency,
        paymentMethod: payments.paymentMethod,
        referenceNumber: payments.referenceNumber,
        paymentDate: payments.paymentDate,
        status: payments.status,
        createdAt: payments.createdAt,
        invoiceNumber: invoices.invoiceNumber,
        clientName: clients.name,
      })
      .from(payments)
      .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(and(...conditions))
      .orderBy(sql`${payments.createdAt} DESC`);

    return NextResponse.json({ payments: result });
  } catch (error: any) {
    console.error("Payments GET Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { invoiceId, amount, currency, paymentMethod, referenceNumber, paymentDate, status } = body;

    if (!amount || !paymentMethod || !paymentDate) {
      return NextResponse.json(
        { error: "Amount, payment method, and payment date are required" },
        { status: 400 }
      );
    }

    const agencyId = session.agencyId;

    if (invoiceId) {
      const [invoice] = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.id, parseInt(invoiceId, 10)), eq(invoices.agencyId, agencyId)));

      if (!invoice) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }
    }

    const [newPayment] = await db
      .insert(payments)
      .values({
        agencyId,
        invoiceId: invoiceId ? parseInt(invoiceId, 10) : null,
        amount: String(amount),
        currency: currency || "USD",
        paymentMethod,
        referenceNumber: referenceNumber || null,
        paymentDate: new Date(paymentDate),
        status: status || "completed",
      })
      .returning();

    // If linked to an invoice, optionally mark invoice as paid if fully covered
    if (invoiceId) {
      await db
        .update(invoices)
        .set({ status: "paid", updatedAt: new Date() })
        .where(eq(invoices.id, parseInt(invoiceId, 10)));
    }

    return NextResponse.json({ payment: newPayment }, { status: 201 });
  } catch (error: any) {
    console.error("Payments POST Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
