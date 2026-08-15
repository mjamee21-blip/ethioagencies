import { NextResponse } from "next/server";
import { db } from "@/db";
import { recruitmentOrders, recruitmentCandidates, workers, clients } from "@/db/schema";
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

    const orderId = parseInt(params.id, 10);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const agencyId = session.agencyId;

    const [order] = await db
      .select({
        id: recruitmentOrders.id,
        agencyId: recruitmentOrders.agencyId,
        clientId: recruitmentOrders.clientId,
        orderNumber: recruitmentOrders.orderNumber,
        position: recruitmentOrders.position,
        quantity: recruitmentOrders.quantity,
        filledQuantity: recruitmentOrders.filledQuantity,
        salary: recruitmentOrders.salary,
        currency: recruitmentOrders.currency,
        requirements: recruitmentOrders.requirements,
        status: recruitmentOrders.status,
        createdAt: recruitmentOrders.createdAt,
        updatedAt: recruitmentOrders.updatedAt,
        clientName: clients.name,
      })
      .from(recruitmentOrders)
      .leftJoin(clients, eq(recruitmentOrders.clientId, clients.id))
      .where(and(eq(recruitmentOrders.id, orderId), eq(recruitmentOrders.agencyId, agencyId)));

    if (!order) {
      return NextResponse.json({ error: "Recruitment order not found" }, { status: 404 });
    }

    // Get candidates nominated/matched for this order
    const candidates = await db
      .select({
        id: recruitmentCandidates.id,
        orderId: recruitmentCandidates.orderId,
        workerId: recruitmentCandidates.workerId,
        status: recruitmentCandidates.status,
        notes: recruitmentCandidates.notes,
        createdAt: recruitmentCandidates.createdAt,
        workerFirstName: workers.firstName,
        workerLastName: workers.lastName,
        workerPassport: workers.passportNumber,
        workerStatus: workers.status,
      })
      .from(recruitmentCandidates)
      .leftJoin(workers, eq(recruitmentCandidates.workerId, workers.id))
      .where(and(eq(recruitmentCandidates.orderId, orderId), eq(recruitmentCandidates.agencyId, agencyId)));

    return NextResponse.json({
      order: {
        ...order,
        candidates,
      },
    });
  } catch (error: any) {
    console.error("Recruitment Order GET Error:", error);
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

    const orderId = parseInt(params.id, 10);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const agencyId = session.agencyId;
    const body = await request.json();

    const [existing] = await db
      .select()
      .from(recruitmentOrders)
      .where(and(eq(recruitmentOrders.id, orderId), eq(recruitmentOrders.agencyId, agencyId)));

    if (!existing) {
      return NextResponse.json({ error: "Recruitment order not found" }, { status: 404 });
    }

    const { clientId, orderNumber, position, quantity, filledQuantity, salary, currency, requirements, status } = body;

    const [updated] = await db
      .update(recruitmentOrders)
      .set({
        clientId: clientId !== undefined ? parseInt(clientId, 10) : existing.clientId,
        orderNumber: orderNumber !== undefined ? orderNumber : existing.orderNumber,
        position: position !== undefined ? position : existing.position,
        quantity: quantity !== undefined ? parseInt(quantity, 10) : existing.quantity,
        filledQuantity: filledQuantity !== undefined ? parseInt(filledQuantity, 10) : existing.filledQuantity,
        salary: salary !== undefined ? String(salary) : existing.salary,
        currency: currency !== undefined ? currency : existing.currency,
        requirements: requirements !== undefined ? requirements : existing.requirements,
        status: status !== undefined ? status : existing.status,
        updatedAt: new Date(),
      })
      .where(and(eq(recruitmentOrders.id, orderId), eq(recruitmentOrders.agencyId, agencyId)))
      .returning();

    return NextResponse.json({ order: updated });
  } catch (error: any) {
    console.error("Recruitment Order PUT Error:", error);
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

    const orderId = parseInt(params.id, 10);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const agencyId = session.agencyId;

    const [existing] = await db
      .select()
      .from(recruitmentOrders)
      .where(and(eq(recruitmentOrders.id, orderId), eq(recruitmentOrders.agencyId, agencyId)));

    if (!existing) {
      return NextResponse.json({ error: "Recruitment order not found" }, { status: 404 });
    }

    await db.delete(recruitmentOrders).where(and(eq(recruitmentOrders.id, orderId), eq(recruitmentOrders.agencyId, agencyId)));

    return NextResponse.json({ success: true, message: "Recruitment order deleted successfully" });
  } catch (error: any) {
    console.error("Recruitment Order DELETE Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
