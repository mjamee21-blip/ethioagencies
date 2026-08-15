import { NextResponse } from "next/server";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyIdStr = searchParams.get("agency_id");
    const plan = searchParams.get("plan");

    if (!agencyIdStr || !plan) {
      return NextResponse.json({ error: "Missing agency_id or plan parameter" }, { status: 400 });
    }

    const agencyId = parseInt(agencyIdStr, 10);
    const periodStart = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1); // 1 month subscription

    // Upsert subscription
    const existing = await db.query.subscriptions.findFirst({
      where: (s, { eq }) => eq(s.agencyId, agencyId),
    });

    if (existing) {
      await db
        .update(subscriptions)
        .set({
          planName: plan.toUpperCase(),
          status: "active",
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, existing.id));
    } else {
      await db.insert(subscriptions).values({
        agencyId,
        planName: plan.toUpperCase(),
        status: "active",
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      });
    }

    return NextResponse.redirect(new URL("/dashboard?billing=success", request.url));
  } catch (error: any) {
    console.error("Webhook Stub Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
