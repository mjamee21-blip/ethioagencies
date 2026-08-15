import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { getIntegration } from "@/lib/integrations";

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { provider, recordId, payload } = body;

    if (!provider || !recordId) {
      return NextResponse.json({ error: "provider and recordId are required" }, { status: 400 });
    }

    const integration = getIntegration(provider);
    const result = await integration.syncRecord(Number(recordId), session.agencyId, payload);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Integrations Sync API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
