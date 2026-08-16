import { NextResponse } from "next/server";
import { db } from "@/db";
import { contracts, workers, clients } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
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

    const contractId = parseInt(params.id, 10);
    const agencyId = session.agencyId;

    const [contract] = await db
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
      .where(and(eq(contracts.id, contractId), eq(contracts.agencyId, agencyId)));

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    return NextResponse.json({ contract });
  } catch (error: any) {
    console.error("Contract GET Error:", error);
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

    const contractId = parseInt(params.id, 10);
    const agencyId = session.agencyId;

    const [existing] = await db
      .select()
      .from(contracts)
      .where(and(eq(contracts.id, contractId), eq(contracts.agencyId, agencyId)));

    if (!existing) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    const body = await request.json();
    const { workerId, clientId, contractNumber, startDate, endDate, salary, fee, currency, contractType, terms, status } = body;

    const contractTerms = {
      ...(typeof existing.terms === "object" && existing.terms !== null ? existing.terms : {}),
      ...(terms || {}),
      ...(fee !== undefined ? { fee } : {}),
      ...(currency !== undefined ? { currency } : {}),
      ...(contractType !== undefined ? { contractType } : {}),
    };

    const [updated] = await db
      .update(contracts)
      .set({
        workerId: workerId ? parseInt(workerId, 10) : existing.workerId,
        clientId: clientId ? parseInt(clientId, 10) : existing.clientId,
        contractNumber: contractNumber || existing.contractNumber,
        startDate: startDate ? new Date(startDate) : existing.startDate,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : existing.endDate,
        salary: salary !== undefined ? (salary ? String(salary) : null) : existing.salary,
        terms: contractTerms,
        status: status || existing.status,
        updatedAt: new Date(),
      })
      .where(and(eq(contracts.id, contractId), eq(contracts.agencyId, agencyId)))
      .returning();

    return NextResponse.json({ contract: updated });
  } catch (error: any) {
    console.error("Contract PUT Error:", error);
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

    const contractId = parseInt(params.id, 10);
    const agencyId = session.agencyId;

    const [existing] = await db
      .select()
      .from(contracts)
      .where(and(eq(contracts.id, contractId), eq(contracts.agencyId, agencyId)));

    if (!existing) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    await db
      .delete(contracts)
      .where(and(eq(contracts.id, contractId), eq(contracts.agencyId, agencyId)));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Contract DELETE Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
