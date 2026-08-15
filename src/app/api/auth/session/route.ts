import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.userId,
        name: session.name,
        email: session.email,
        role: session.role,
        agencyId: session.agencyId,
        agencySlug: session.agencySlug,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { authenticated: false, error: "Error fetching session" },
      { status: 500 }
    );
  }
}
