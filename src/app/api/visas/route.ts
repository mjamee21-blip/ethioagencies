import { NextResponse } from "next/server";
import { db } from "@/db";
import { visas, workers } from "@/db/schema";
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
    const workerId = searchParams.get("workerId");

    const agencyId = session.agencyId;
    let conditions = [eq(visas.agencyId, agencyId)];

    if (status && status !== "all") {
      conditions.push(eq(visas.status, status));
    }
    if (workerId && workerId !== "all") {
      conditions.push(eq(visas.workerId, parseInt(workerId, 10)));
    }
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          ilike(visas.visaNumber, searchTerm),
          ilike(visas.visaType, searchTerm)
        )
      );
    }

    const result = await db
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
      .where(and(...conditions))
      .orderBy(sql`${visas.createdAt} DESC`);

    return NextResponse.json({ visas: result });
  } catch (error: any) {
    console.error("Visas GET Error:", error);
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
    const { workerId, visaNumber, visaType, issueDate, expiryDate, status, externalRefNumber } = body;

    if (!workerId || !visaNumber || !visaType || !expiryDate) {
      return NextResponse.json(
        { error: "Worker ID, visa number, visa type, and expiry date are required" },
        { status: 400 }
      );
    }

    const agencyId = session.agencyId;

    const [worker] = await db
      .select()
      .from(workers)
      .where(and(eq(workers.id, parseInt(workerId, 10)), eq(workers.agencyId, agencyId)));

    if (!worker) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    const finalVisaNumber = externalRefNumber ? `${visaNumber} (Ref: ${externalRefNumber})` : visaNumber;

    const [newVisa] = await db
      .insert(visas)
      .values({
        agencyId,
        workerId: parseInt(workerId, 10),
        visaNumber: finalVisaNumber,
        visaType,
        issueDate: issueDate ? new Date(issueDate) : null,
        expiryDate: new Date(expiryDate),
        status: status || "PROCESSING",
      })
      .returning();

    return NextResponse.json({ visa: newVisa }, { status: 201 });
  } catch (error: any) {
    console.error("Visas POST Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
