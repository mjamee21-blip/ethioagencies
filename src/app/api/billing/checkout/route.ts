import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { stripeStub } from "@/lib/billing/stripe-stub";

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { planName } = body;

    if (!planName) {
      return NextResponse.json({ error: "planName is required" }, { status: 400 });
    }

    const checkout = await stripeStub.createCheckoutSession({
      agencyId: session.agencyId,
      planName,
      successUrl: "/billing?success=true",
      cancelUrl: "/billing?canceled=true",
    });

    return NextResponse.json(checkout);
  } catch (error: any) {
    console.error("Billing Checkout API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
