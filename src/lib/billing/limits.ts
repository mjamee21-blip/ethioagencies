import { db } from "@/db";
import { subscriptions, users, workers } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { SAAS_PLANS, PlanName } from "./plans";

export async function checkAgencyLimit(agencyId: number, limitType: "users" | "workers"): Promise<{ allowed: boolean; current: number; max: number; plan: PlanName }> {
  // Get active subscription for agency
  const sub = await db.query.subscriptions.findFirst({
    where: (s, { and, eq }) => and(eq(s.agencyId, agencyId), eq(s.status, "active")),
  });

  const planName = (sub?.planName?.toUpperCase() || "STARTER") as PlanName;
  const plan = SAAS_PLANS[planName] || SAAS_PLANS.STARTER;
  const maxLimit = plan.limits[limitType];

  let currentCount = 0;
  if (limitType === "users") {
    const res = await db.select({ count: sql`count(*)` }).from(users).where(eq(users.agencyId, agencyId));
    currentCount = Number(res[0]?.count || 0);
  } else if (limitType === "workers") {
    const res = await db.select({ count: sql`count(*)` }).from(workers).where(eq(workers.agencyId, agencyId));
    currentCount = Number(res[0]?.count || 0);
  }

  return {
    allowed: currentCount < maxLimit,
    current: currentCount,
    max: maxLimit,
    plan: planName,
  };
}
