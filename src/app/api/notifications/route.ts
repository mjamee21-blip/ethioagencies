import { NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getCurrentSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agencyId = session.agencyId;
    const userId = session.userId;

    const result = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.agencyId, agencyId)))
      .orderBy(sql`${notifications.createdAt} DESC`);

    return NotificationsResponse(result);
  } catch (error: any) {
    console.error("Notifications GET Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

function NotificationsResponse(notificationsList: any[]) {
  return NextResponse.json({ notifications: notificationsList });
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, message, userId } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: "Title and message are required" },
        { status: 400 }
      );
    }

    const agencyId = session.agencyId;

    const [newNotif] = await db
      .insert(notifications)
      .values({
        agencyId,
        userId: userId ? parseInt(userId, 10) : session.userId,
        title,
        message,
        isRead: false,
      })
      .returning();

    return NextResponse.json({ notification: newNotif }, { status: 201 });
  } catch (error: any) {
    console.error("Notifications POST Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
