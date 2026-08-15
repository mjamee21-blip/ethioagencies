import { NextResponse } from "next/server";
import { db } from "@/db";
import { workers, workerDocuments, workerSkills, workerLanguages } from "@/db/schema";
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

    const workerId = parseInt(params.id, 10);
    if (isNaN(workerId)) {
      return NextResponse.json({ error: "Invalid worker ID" }, { status: 400 });
    }

    const agencyId = session.agencyId;

    const [worker] = await db
      .select()
      .from(workers)
      .where(and(eq(workers.id, workerId), eq(workers.agencyId, agencyId)));

    if (!worker) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    const documents = await db
      .select()
      .from(workerDocuments)
      .where(and(eq(workerDocuments.workerId, workerId), eq(workerDocuments.agencyId, agencyId)));

    const skills = await db
      .select()
      .from(workerSkills)
      .where(and(eq(workerSkills.workerId, workerId), eq(workerSkills.agencyId, agencyId)));

    const languages = await db
      .select()
      .from(workerLanguages)
      .where(and(eq(workerLanguages.workerId, workerId), eq(workerLanguages.agencyId, agencyId)));

    return NextResponse.json({
      worker: {
        ...worker,
        documents,
        skills,
        languages,
      },
    });
  } catch (error: any) {
    console.error("Worker GET Error:", error);
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

    const workerId = parseInt(params.id, 10);
    if (isNaN(workerId)) {
      return NextResponse.json({ error: "Invalid worker ID" }, { status: 400 });
    }

    const agencyId = session.agencyId;
    const body = await request.json();

    const [existing] = await db
      .select()
      .from(workers)
      .where(and(eq(workers.id, workerId), eq(workers.agencyId, agencyId)));

    if (!existing) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    const {
      firstName,
      lastName,
      middleName,
      dateOfBirth,
      gender,
      nationality,
      passportNumber,
      passportExpiryDate,
      phone,
      email,
      address,
      status,
      notes,
    } = body;

    const [updated] = await db
      .update(workers)
      .set({
        firstName: firstName !== undefined ? firstName : existing.firstName,
        lastName: lastName !== undefined ? lastName : existing.lastName,
        middleName: middleName !== undefined ? middleName : existing.middleName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : existing.dateOfBirth,
        gender: gender !== undefined ? gender : existing.gender,
        nationality: nationality !== undefined ? nationality : existing.nationality,
        passportNumber: passportNumber !== undefined ? passportNumber : existing.passportNumber,
        passportExpiryDate: passportExpiryDate ? new Date(passportExpiryDate) : existing.passportExpiryDate,
        phone: phone !== undefined ? phone : existing.phone,
        email: email !== undefined ? email : existing.email,
        address: address !== undefined ? address : existing.address,
        status: status !== undefined ? status : existing.status,
        notes: notes !== undefined ? notes : existing.notes,
        updatedAt: new Date(),
      })
      .where(and(eq(workers.id, workerId), eq(workers.agencyId, agencyId)))
      .returning();

    return NextResponse.json({ worker: updated });
  } catch (error: any) {
    console.error("Worker PUT Error:", error);
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

    const workerId = parseInt(params.id, 10);
    if (isNaN(workerId)) {
      return NextResponse.json({ error: "Invalid worker ID" }, { status: 400 });
    }

    const agencyId = session.agencyId;

    const [existing] = await db
      .select()
      .from(workers)
      .where(and(eq(workers.id, workerId), eq(workers.agencyId, agencyId)));

    if (!existing) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    await db.delete(workers).where(and(eq(workers.id, workerId), eq(workers.agencyId, agencyId)));

    return NextResponse.json({ success: true, message: "Worker deleted successfully" });
  } catch (error: any) {
    console.error("Worker DELETE Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
