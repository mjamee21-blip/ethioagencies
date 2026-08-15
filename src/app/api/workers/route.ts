import { NextResponse } from "next/server";
import { db } from "@/db";
import { workers, workerSkills, workerLanguages } from "@/db/schema";
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
    const nationality = searchParams.get("nationality");

    const agencyId = session.agencyId;
    let conditions = [eq(workers.agencyId, agencyId)];

    if (status && status !== "all") {
      conditions.push(eq(workers.status, status));
    }
    if (nationality && nationality !== "all") {
      conditions.push(eq(workers.nationality, nationality));
    }
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          ilike(workers.firstName, searchTerm),
          ilike(workers.lastName, searchTerm),
          ilike(workers.passportNumber, searchTerm),
          ilike(workers.phone, searchTerm)
        )
      );
    }

    const result = await db
      .select()
      .from(workers)
      .where(and(...conditions))
      .orderBy(sql`${workers.createdAt} DESC`);

    return NextResponse.json({ workers: result });
  } catch (error: any) {
    console.error("Workers GET Error:", error);
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
      skills, // array of { skillName, experienceYears, proficiencyLevel }
      languages, // array of { language, proficiency }
    } = body;

    if (!firstName || !lastName || !passportNumber) {
      return NextResponse.json(
        { error: "First name, last name, and passport number are required" },
        { status: 400 }
      );
    }

    const agencyId = session.agencyId;

    const [newWorker] = await db
      .insert(workers)
      .values({
        agencyId,
        firstName,
        lastName,
        middleName: middleName || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender: gender || null,
        nationality: nationality || "Ethiopian",
        passportNumber,
        passportExpiryDate: passportExpiryDate ? new Date(passportExpiryDate) : null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        status: status || "available",
        notes: notes || null,
      })
      .returning();

    // Insert skills if provided
    if (skills && Array.isArray(skills) && skills.length > 0) {
      for (const skill of skills) {
        if (skill.skillName) {
          await db.insert(workerSkills).values({
            agencyId,
            workerId: newWorker.id,
            skillName: skill.skillName,
            experienceYears: skill.experienceYears ? parseInt(skill.experienceYears, 10) : null,
            proficiencyLevel: skill.proficiencyLevel || null,
          });
        }
      }
    }

    // Insert languages if provided
    if (languages && Array.isArray(languages) && languages.length > 0) {
      for (const lang of languages) {
        if (lang.language) {
          await db.insert(workerLanguages).values({
            agencyId,
            workerId: newWorker.id,
            language: lang.language,
            proficiency: lang.proficiency || null,
          });
        }
      }
    }

    return NextResponse.json({ worker: newWorker }, { status: 201 });
  } catch (error: any) {
    console.error("Workers POST Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
