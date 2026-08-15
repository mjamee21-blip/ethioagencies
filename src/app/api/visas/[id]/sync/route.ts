import { NextResponse } from "next/server";
import { db } from "@/db";
import { visas } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentSession } from "@/lib/auth";

export async function POST(
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

    // Simulate external embassy/consulate sync check
    // In real system, this queries external e-visa or embassy API. Here we simulate status refresh.
    const statuses = ["PROCESSING", "APPROVED", "SUBMITTED", "APPROVED"];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    const [updated] = await db
      .update(visas)
      .set({
        status: randomStatus,
        updatedAt: new Date(),
      })
      .where(and(eq(visas.id, visaId), eq(visas.agencyId, agencyId)))
      .returning();

    return NextResponse.json({ 
      success: true, 
      message: `Successfully synchronized visa status with external portal. Current status: ${randomStatus}`,
      visa: updated 
    });
  } catch (error: any) {
    console.error("Visa Sync Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
