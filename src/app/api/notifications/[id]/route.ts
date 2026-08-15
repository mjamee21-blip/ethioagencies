import { NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentSession } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notifId = parseInt(params.id, 10);
    const agencyId = session.agencyId;

    const [existing] = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.id, notifId), eq(notifications.agencyId, agencyId)));

    if (!existing) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const isRead = body.isRead !== undefined ? body.isRead : true;

    const [updated] = await db
      .update(notifications)
      .set({ isRead })
      .where(and(eq(notifications.id, notifId), eq(notifications.agencyId, agencyId)))
      .returning();

    return NextResponse.json({ notification: updated });
  } catch (error: any) {
    console.error("Notification PUT Error:", error);
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

    const notifId = parseInt(params.id, 10);
    const agencyId = session.agencyId;

    await db
      .delete(notifications)
      .where(and(eq(notifications.id, notifId), eq(notifications.agencyId, agencyId)));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Notification DELETE Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
