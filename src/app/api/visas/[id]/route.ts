import { NextResponse } from "next/server";
import { db } from "@/db";
import { visas, workers } from "@/db/schema";
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

    const visaId = parseInt(params.id, 10);
    const agencyId = session.agencyId;

    const [visa] = await db
      .select({
        id: visas.id,
        agencyId: visas.agencyId,
        workerId: visas.workerId,
        visaNumber: visas.visaNumber,
        visaType: visas.visaType,
        issueDate: visas.issueDate,
        expiryDate: visas.expiryDate,
        status: visas.status,
        createdAt: visas.createdAt,
        updatedAt: visas.updatedAt,
        workerName: sql<string>`concat(${workers.firstName}, ' ', ${workers.lastName})`,
        passportNumber: workers.passportNumber,
      })
      .from(visas)
      .leftJoin(workers, eq(visas.workerId, workers.id))
      .where(and(eq(visas.id, visaId), eq(visas.agencyId, agencyId)));

    if (!visa) {
      return NextResponse.json({ error: "Visa record not found" }, { status: 404 });
    }

    return NextResponse.json({ visa });
  } catch (error: any) {
    console.error("Visa GET Error:", error);
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

    const visaId = parseInt(params.id, 10);
    const agencyId = session.agencyId;

    const [existing] = await db
      .select()
      .from(visas)
      .where(and(eq(visas.id, visaId), eq(visas.agencyId, agencyId)));

    if (!existing) {
      return NextResponse.json({ error: "Visa record not found" }, { status: 404 });
    }

    const body = await request.json();
    const { workerId, visaNumber, visaType, issueDate, expiryDate, status, externalRefNumber } = body;

    let finalVisaNumber = visaNumber || existing.visaNumber;
    if (externalRefNumber) {
      finalVisaNumber = `${visaNumber || existing.visaNumber} (Ref: ${externalRefNumber})`;
    }

    const [updated] = await db
      .update(visas)
      .set({
        workerId: workerId ? parseInt(workerId, 10) : existing.workerId,
        visaNumber: finalVisaNumber,
        visaType: visaType || existing.visaType,
        issueDate: issueDate !== undefined ? (issueDate ? new Date(issueDate) : null) : existing.issueDate,
        expiryDate: expiryDate ? new Date(expiryDate) : existing.expiryDate,
        status: status || existing.status,
        updatedAt: new Date(),
      })
      .where(and(eq(visas.id, visaId), eq(visas.agencyId, agencyId)))
      .returning();

    return NextResponse.json({ visa: updated });
  } catch (error: any) {
    console.error("Visa PUT Error:", error);
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

    const visaId = parseInt(params.id, 10);
    const agencyId = session.agencyId;

    const [existing] = await db
      .select()
      .from(visas)
      .where(and(eq(visas.id, visaId), eq(visas.agencyId, agencyId)));

    if (!existing) {
      return NextResponse.json({ error: "Visa record not found" }, { status: 404 });
    }

    await db
      .delete(visas)
      .where(and(eq(visas.id, visaId), eq(visas.agencyId, agencyId)));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Visa DELETE Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
