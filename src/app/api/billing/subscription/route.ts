import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { checkAgencyLimit } from "@/lib/billing/limits";
import { SAAS_PLANS } from "@/lib/billing/plans";

export async function GET(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agencyId = session.agencyId;

    let sub = await db.query.subscriptions.findFirst({
      where: (s, { eq }) => eq(s.agencyId, agencyId),
    });

    if (!sub) {
      // Create default trial subscription
      const periodStart = new Date();
      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + 14); // 14 days trial

      const [newSub] = await db
        .insert(subscriptions)
        .values({
          agencyId,
          planName: "BUSINESS",
          status: "trialing",
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        })
        .returning();
      sub = newSub;
    }

    const userLimits = await checkAgencyLimit(agencyId, "users");
    const workerLimits = await checkAgencyLimit(agencyId, "workers");

    return NextResponse.json({
      subscription: sub,
      plans: SAAS_PLANS,
      limits: {
        users: userLimits,
        workers: workerLimits,
      },
    });
  } catch (error: any) {
    console.error("Subscription GET Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
