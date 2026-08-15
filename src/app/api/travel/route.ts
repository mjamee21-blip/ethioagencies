import { NextResponse } from "next/server";
import { db } from "@/db";
import { travelRecords, workers } from "@/db/schema";
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
    let conditions = [eq(travelRecords.agencyId, agencyId)];

    if (status && status !== "all") {
      conditions.push(eq(travelRecords.status, status));
    }
    if (workerId && workerId !== "all") {
      conditions.push(eq(travelRecords.workerId, parseInt(workerId, 10)));
    }
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          ilike(travelRecords.flightNumber, searchTerm),
          ilike(travelRecords.departureAirport, searchTerm),
          ilike(travelRecords.arrivalAirport, searchTerm),
          ilike(travelRecords.ticketNumber, searchTerm)
        )
      );
    }

    const result = await db
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
      .where(and(...conditions))
      .orderBy(sql`${travelRecords.createdAt} DESC`);

    return NextResponse.json({ travelRecords: result });
  } catch (error: any) {
    console.error("Travel Records GET Error:", error);
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
    const { workerId, airline, flightNumber, departureAirport, arrivalAirport, departureTime, arrivalTime, ticketNumber, status } = body;

    if (!workerId || !flightNumber || !departureAirport || !arrivalAirport || !departureTime || !arrivalTime) {
      return NextResponse.json(
        { error: "Worker ID, flight number, departure/arrival airports, and departure/arrival times are required" },
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

    const finalFlightNumber = airline ? `${airline} - ${flightNumber}` : flightNumber;

    const [newRecord] = await db
      .insert(travelRecords)
      .values({
        agencyId,
        workerId: parseInt(workerId, 10),
        flightNumber: finalFlightNumber,
        departureAirport,
        arrivalAirport,
        departureTime: new Date(departureTime),
        arrivalTime: new Date(arrivalTime),
        ticketNumber: ticketNumber || null,
        status: status || "booked",
      })
      .returning();

    return NextResponse.json({ travelRecord: newRecord }, { status: 201 });
  } catch (error: any) {
    console.error("Travel Records POST Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
