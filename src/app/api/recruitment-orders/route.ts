import { NextResponse } from "next/server";
import { db } from "@/db";
import { recruitmentOrders, clients } from "@/db/schema";
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
    let conditions = [eq(recruitmentOrders.agencyId, agencyId)];

    if (status && status !== "all") {
      conditions.push(eq(recruitmentOrders.status, status));
    }
    if (clientId && clientId !== "all") {
      conditions.push(eq(recruitmentOrders.clientId, parseInt(clientId, 10)));
    }
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          ilike(recruitmentOrders.orderNumber, searchTerm),
          ilike(recruitmentOrders.position, searchTerm)
        )
      );
    }

    const orders = await db
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
      .where(and(...conditions))
      .orderBy(sql`${recruitmentOrders.createdAt} DESC`);

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error("Recruitment Orders GET Error:", error);
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
    const { clientId, orderNumber, position, quantity, salary, currency, requirements, status } = body;

    if (!clientId || !orderNumber || !position || !quantity) {
      return NextResponse.json(
        { error: "Client ID, order number, position, and quantity are required" },
        { status: 400 }
      );
    }

    const agencyId = session.agencyId;

    // Verify client belongs to agency
    const [client] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, parseInt(clientId, 10)), eq(clients.agencyId, agencyId)));

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const [newOrder] = await db
      .insert(recruitmentOrders)
      .values({
        agencyId,
        clientId: parseInt(clientId, 10),
        orderNumber,
        position,
        quantity: parseInt(quantity, 10),
        filledQuantity: 0,
        salary: salary ? String(salary) : null,
        currency: currency || "USD",
        requirements: requirements || null,
        status: status || "open",
      })
      .returning();

    return NextResponse.json({ order: newOrder }, { status: 201 });
  } catch (error: any) {
    console.error("Recruitment Orders POST Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
