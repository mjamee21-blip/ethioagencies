import { NextResponse } from "next/server";
import { db } from "@/db";
import { invoices, clients } from "@/db/schema";
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
    const clientId = searchParams.get("clientId");

    const agencyId = session.agencyId;
    let conditions = [eq(invoices.agencyId, agencyId)];

    if (status && status !== "all") {
      conditions.push(eq(invoices.status, status));
    }
    if (clientId && clientId !== "all") {
      conditions.push(eq(invoices.clientId, parseInt(clientId, 10)));
    }
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(ilike(invoices.invoiceNumber, searchTerm));
    }

    const result = await db
      .select({
        id: invoices.id,
        agencyId: invoices.agencyId,
        clientId: invoices.clientId,
        invoiceNumber: invoices.invoiceNumber,
        amount: invoices.amount,
        taxAmount: invoices.taxAmount,
        currency: invoices.currency,
        dueDate: invoices.dueDate,
        status: invoices.status,
        createdAt: invoices.createdAt,
        updatedAt: invoices.updatedAt,
        clientName: clients.name,
      })
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(and(...conditions))
      .orderBy(sql`${invoices.createdAt} DESC`);

    return NextResponse.json({ invoices: result });
  } catch (error: any) {
    console.error("Invoices GET Error:", error);
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
    const { clientId, invoiceNumber, amount, taxAmount, currency, dueDate, status } = body;

    if (!clientId || !invoiceNumber || !amount || !dueDate) {
      return NextResponse.json(
        { error: "Client ID, invoice number, amount, and due date are required" },
        { status: 400 }
      );
    }

    const agencyId = session.agencyId;

    const [client] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, parseInt(clientId, 10)), eq(clients.agencyId, agencyId)));

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const [newInvoice] = await db
      .insert(invoices)
      .values({
        agencyId,
        clientId: parseInt(clientId, 10),
        invoiceNumber,
        amount: String(amount),
        taxAmount: taxAmount ? String(taxAmount) : "0.00",
        currency: currency || "USD",
        dueDate: new Date(dueDate),
        status: status || "unpaid",
      })
      .returning();

    return NextResponse.json({ invoice: newInvoice }, { status: 201 });
  } catch (error: any) {
    console.error("Invoices POST Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
