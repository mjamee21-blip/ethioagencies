import { NextResponse } from "next/server";
import { db } from "@/db";
import { clients, recruitmentOrders, invoices } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentSession } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientId = parseInt(params.id, 10);
    if (isNaN(clientId)) {
      return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
    }

    const agencyId = session.agencyId;

    const [client] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, clientId), eq(clients.agencyId, agencyId)));

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const orders = await db
      .select()
      .from(recruitmentOrders)
      .where(and(eq(recruitmentOrders.clientId, clientId), eq(recruitmentOrders.agencyId, agencyId)));

    const clientInvoices = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.clientId, clientId), eq(invoices.agencyId, agencyId)));

    return NextResponse.json({
      client: {
        ...client,
        orders,
        invoices: clientInvoices,
      },
    });
  } catch (error: any) {
    console.error("Client GET Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientId = parseInt(params.id, 10);
    if (isNaN(clientId)) {
      return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
    }

    const agencyId = session.agencyId;
    const body = await request.json();

    const [existing] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, clientId), eq(clients.agencyId, agencyId)));

    if (!existing) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const { name, contactPerson, email, phone, country, address, status } = body;

    const [updated] = await db
      .update(clients)
      .set({
        name: name !== undefined ? name : existing.name,
        contactPerson: contactPerson !== undefined ? contactPerson : existing.contactPerson,
        email: email !== undefined ? email : existing.email,
        phone: phone !== undefined ? phone : existing.phone,
        country: country !== undefined ? country : existing.country,
        address: address !== undefined ? address : existing.address,
        status: status !== undefined ? status : existing.status,
        updatedAt: new Date(),
      })
      .where(and(eq(clients.id, clientId), eq(clients.agencyId, agencyId)))
      .returning();

    return NextResponse.json({ client: updated });
  } catch (error: any) {
    console.error("Client PUT Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientId = parseInt(params.id, 10);
    if (isNaN(clientId)) {
      return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
    }

    const agencyId = session.agencyId;

    const [existing] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, clientId), eq(clients.agencyId, agencyId)));

    if (!existing) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    await db.delete(clients).where(and(eq(clients.id, clientId), eq(clients.agencyId, agencyId)));

    return NextResponse.json({ success: true, message: "Client deleted successfully" });
  } catch (error: any) {
    console.error("Client DELETE Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
