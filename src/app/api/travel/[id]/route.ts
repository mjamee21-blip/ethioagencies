import { NextResponse } from "next/server";
import { db } from "@/db";
import { travelRecords, workers } from "@/db/schema";
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

    const travelId = parseInt(params.id, 10);
    const agencyId = session.agencyId;

    const [record] = await db
      .select({
        id: travelRecords.id,
        agencyId: travelRecords.agencyId,
        workerId: travelRecords.workerId,
        flightNumber: travelRecords.flightNumber,
        departureAirport: travelRecords.departureAirport,
        arrivalAirport: travelRecords.arrivalAirport,
        departureTime: travelRecords.departureTime,
        arrivalTime: travelRecords.arrivalTime,
        ticketNumber: travelRecords.ticketNumber,
        status: travelRecords.status,
        createdAt: travelRecords.createdAt,
        updatedAt: travelRecords.updatedAt,
        workerName: sql<string>`concat(${workers.firstName}, ' ', ${workers.lastName})`,
        passportNumber: workers.passportNumber,
      })
      .from(travelRecords)
      .leftJoin(workers, eq(travelRecords.workerId, workers.id))
      .where(and(eq(travelRecords.id, travelId), eq(travelRecords.agencyId, agencyId)));

    if (!record) {
      return NextResponse.json({ error: "Travel record not found" }, { status: 404 });
    }

    return NextResponse.json({ travelRecord: record });
  } catch (error: any) {
    console.error("Travel Record GET Error:", error);
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

    const travelId = parseInt(params.id, 10);
    const agencyId = session.agencyId;

    const [existing] = await db
      .select()
      .from(travelRecords)
      .where(and(eq(travelRecords.id, travelId), eq(travelRecords.agencyId, agencyId)));

    if (!existing) {
      return NextResponse.json({ error: "Travel record not found" }, { status: 404 });
    }

    const body = await request.json();
    const { workerId, airline, flightNumber, departureAirport, arrivalAirport, departureTime, arrivalTime, ticketNumber, status } = body;

    let finalFlightNumber = flightNumber || existing.flightNumber;
    if (airline) {
      finalFlightNumber = `${airline} - ${flightNumber || existing.flightNumber}`;
    }

    const [updated] = await db
      .update(travelRecords)
      .set({
        workerId: workerId ? parseInt(workerId, 10) : existing.workerId,
        flightNumber: finalFlightNumber,
        departureAirport: departureAirport || existing.departureAirport,
        arrivalAirport: arrivalAirport || existing.arrivalAirport,
        departureTime: departureTime ? new Date(departureTime) : existing.departureTime,
        arrivalTime: arrivalTime ? new Date(arrivalTime) : existing.arrivalTime,
        ticketNumber: ticketNumber !== undefined ? ticketNumber : existing.ticketNumber,
        status: status || existing.status,
        updatedAt: new Date(),
      })
      .where(and(eq(travelRecords.id, travelId), eq(travelRecords.agencyId, agencyId)))
      .returning();

    return NextResponse.json({ travelRecord: updated });
  } catch (error: any) {
    console.error("Travel Record PUT Error:", error);
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

    const travelId = parseInt(params.id, 10);
    const agencyId = session.agencyId;

    const [existing] = await db
      .select()
      .from(travelRecords)
      .where(and(eq(travelRecords.id, travelId), eq(travelRecords.agencyId, agencyId)));

    if (!existing) {
      return NextResponse.json({ error: "Travel record not found" }, { status: 404 });
    }

    await db
      .delete(travelRecords)
      .where(and(eq(travelRecords.id, travelId), eq(travelRecords.agencyId, agencyId)));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Travel Record DELETE Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
