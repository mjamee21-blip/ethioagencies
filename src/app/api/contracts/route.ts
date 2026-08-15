import { NextResponse } from "next/server";
import { db } from "@/db";
import { contracts, workers, clients } from "@/db/schema";
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
    const workerId = searchParams.get("workerId");

    const agencyId = session.agencyId;
    let conditions = [eq(contracts.agencyId, agencyId)];

    if (status && status !== "all") {
      conditions.push(eq(contracts.status, status));
    }
    if (clientId && clientId !== "all") {
      conditions.push(eq(contracts.clientId, parseInt(clientId, 10)));
    }
    if (workerId && workerId !== "all") {
      conditions.push(eq(contracts.workerId, parseInt(workerId, 10)));
    }
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          ilike(contracts.contractNumber, searchTerm)
        )
      );
    }

    const result = await db
      .select({
        id: contracts.id,
        agencyId: contracts.agencyId,
        workerId: contracts.workerId,
        clientId: contracts.clientId,
        contractNumber: contracts.contractNumber,
        startDate: contracts.startDate,
        endDate: contracts.endDate,
        salary: contracts.salary,
        terms: contracts.terms,
        status: contracts.status,
        createdAt: contracts.createdAt,
        updatedAt: contracts.updatedAt,
        workerName: sql<string>`concat(${workers.firstName}, ' ', ${workers.lastName})`,
        clientName: clients.name,
      })
      .from(contracts)
      .leftJoin(workers, eq(contracts.workerId, workers.id))
      .leftJoin(clients, eq(contracts.clientId, clients.id))
      .where(and(...conditions))
      .orderBy(sql`${contracts.createdAt} DESC`);

    return NextResponse.json({ contracts: result });
  } catch (error: any) {
    console.error("Contracts GET Error:", error);
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
    const { workerId, clientId, contractNumber, startDate, endDate, salary, fee, currency, contractType, terms, status } = body;

    if (!workerId || !clientId || !contractNumber || !startDate) {
      return NextResponse.json(
        { error: "Worker ID, Client ID, Contract Number, and Start Date are required" },
        { status: 400 }
      );
    }

    const agencyId = session.agencyId;

    // Verify worker and client belong to agency
    const [worker] = await db
      .select()
      .from(workers)
      .where(and(eq(workers.id, parseInt(workerId, 10)), eq(workers.agencyId, agencyId)));

    const [client] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, parseInt(clientId, 10)), eq(clients.agencyId, agencyId)));

    if (!worker || !client) {
      return NextResponse.json({ error: "Worker or Client not found" }, { status: 404 });
    }

    const contractTerms = {
      ...(terms || {}),
      fee: fee || null,
      currency: currency || "USD",
      contractType: contractType || "employment",
    };

    const [newContract] = await db
      .insert(contracts)
      .values({
        agencyId,
        workerId: parseInt(workerId, 10),
        clientId: parseInt(clientId, 10),
        contractNumber,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        salary: salary ? String(salary) : null,
        terms: contractTerms,
        status: status || "active",
      })
      .returning();

    return NextResponse.json({ contract: newContract }, { status: 201 });
  } catch (error: any) {
    console.error("Contracts POST Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
