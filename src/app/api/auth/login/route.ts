import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, agencies, roles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { verifyPassword, createSessionToken, SESSION_COOKIE_NAME, UserRole } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, agencySlug } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user across agencies or specific agency if agencySlug provided
    let userRecord;
    if (agencySlug) {
      const [agency] = await db
        .select()
        .from(agencies)
        .where(eq(agencies.slug, agencySlug))
        .limit(1);

      if (!agency) {
        return NextResponse.json({ error: "Agency not found" }, { status: 404 });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(and(eq(users.email, email), eq(users.agencyId, agency.id)))
        .limit(1);

      userRecord = user;
    } else {
      const foundUsers = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      userRecord = foundUsers[0];
    }

    if (!userRecord) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (userRecord.status !== "active") {
      return NextResponse.json({ error: "Account is inactive or suspended" }, { status: 403 });
    }

    const isValidPassword = await verifyPassword(password, userRecord.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Get agency info
    const [agency] = await db
      .select()
      .from(agencies)
      .where(eq(agencies.id, userRecord.agencyId))
      .limit(1);

    if (!agency || agency.status !== "active") {
      return NextResponse.json({ error: "Associated agency is inactive or suspended" }, { status: 403 });
    }

    // Determine role name (fallback to AGENCY_OWNER or RECRUITMENT_OFFICER based on setup)
    let roleName: UserRole = "RECRUITMENT_OFFICER";
    if (userRecord.roleId) {
      const [roleRec] = await db
        .select()
        .from(roles)
        .where(eq(roles.id, userRecord.roleId))
        .limit(1);
      if (roleRec) {
        roleName = roleRec.name.toUpperCase() as UserRole;
      }
    } else {
      // If no role assigned, check if user email matches agency owner or default
      roleName = "AGENCY_OWNER";
    }

    const tokenPayload = {
      userId: userRecord.id,
      agencyId: agency.id,
      email: userRecord.email,
      name: userRecord.name,
      role: roleName,
      agencySlug: agency.slug,
    };

    const token = createSessionToken(tokenPayload);

    const response = NextResponse.json({
      success: true,
      message: "Logged in successfully",
      user: {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        role: roleName,
        agencyId: agency.id,
        agencyName: agency.name,
        agencySlug: agency.slug,
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error during login" },
      { status: 500 }
    );
  }
}
