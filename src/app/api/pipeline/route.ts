import { NextResponse } from "next/server";
import { db } from "@/db";
import { recruitmentCandidates, workers, recruitmentOrders, clients } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agencyId = session.agencyId;

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
        workerPhone: workers.phone,
        workerNationality: workers.nationality,
        orderNumber: recruitmentOrders.orderNumber,
        position: recruitmentOrders.position,
        clientId: recruitmentOrders.clientId,
        clientName: clients.name,
      })
      .from(recruitmentCandidates)
      .leftJoin(workers, eq(recruitmentCandidates.workerId, workers.id))
      .leftJoin(recruitmentOrders, eq(recruitmentCandidates.orderId, recruitmentOrders.id))
      .leftJoin(clients, eq(recruitmentOrders.clientId, clients.id))
      .where(eq(recruitmentCandidates.agencyId, agencyId));

    // Group candidates by stages
    const stages = {
      nominated: candidates.filter(c => c.status === "nominated"),
      shortlisted: candidates.filter(c => c.status === "shortlisted"),
      interviewed: candidates.filter(c => c.status === "interviewed"),
      medical_pending: candidates.filter(c => c.status === "medical_pending"),
      visa_processing: candidates.filter(c => c.status === "visa_processing"),
      deployed: candidates.filter(c => c.status === "deployed"),
      rejected: candidates.filter(c => c.status === "rejected"),
    };

    return NextResponse.json({ stages, allCandidates: candidates });
  } catch (error: any) {
    console.error("Pipeline GET Error:", error);
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
    const { orderId, workerId, status, notes } = body;

    if (!orderId || !workerId) {
      return NextResponse.json({ error: "Order ID and Worker ID are required" }, { status: 400 });
    }

    const agencyId = session.agencyId;

    const [newCandidate] = await db
      .insert(recruitmentCandidates)
      .values({
        agencyId,
        orderId: parseInt(orderId, 10),
        workerId: parseInt(workerId, 10),
        status: status || "nominated",
        notes: notes || null,
      })
      .returning();

    return NextResponse.json({ candidate: newCandidate }, { status: 201 });
  } catch (error: any) {
    console.error("Pipeline POST Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { candidateId, status, notes } = body;

    if (!candidateId || !status) {
      return NextResponse.json({ error: "Candidate ID and status are required" }, { status: 400 });
    }

    const agencyId = session.agencyId;

    const [existing] = await db
      .select()
      .from(recruitmentCandidates)
      .where(and(eq(recruitmentCandidates.id, parseInt(candidateId, 10)), eq(recruitmentCandidates.agencyId, agencyId)));

    if (!existing) {
      return NextResponse.json({ error: "Candidate not found in pipeline" }, { status: 404 });
    }

    const [updated] = await db
      .update(recruitmentCandidates)
      .set({
        status,
        notes: notes !== undefined ? notes : existing.notes,
        updatedAt: new Date(),
      })
      .where(and(eq(recruitmentCandidates.id, parseInt(candidateId, 10)), eq(recruitmentCandidates.agencyId, agencyId)))
      .returning();

    // If deployed, also update worker status to deployed
    if (status === "deployed") {
      await db
        .update(workers)
        .set({ status: "deployed", updatedAt: new Date() })
        .where(eq(workers.id, existing.workerId));
    }

    return NextResponse.json({ candidate: updated });
  } catch (error: any) {
    console.error("Pipeline PUT Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
