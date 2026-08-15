import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, agencies, roles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, createSessionToken, SESSION_COOKIE_NAME, UserRole } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      agencyName,
      agencySlug,
      name,
      email,
      password,
      phone,
      role = "AGENCY_OWNer",
    } = body;

    if (!agencyName || !agencySlug || !name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields: agencyName, agencySlug, name, email, password" },
        { status: 400 }
      );
    }

    // Check if agency slug already exists
    const [existingAgency] = await db
      .select()
      .from(agencies)
      .where(eq(agencies.slug, agencySlug))
      .limit(1);

    if (existingAgency) {
      return NextResponse.json(
        { error: "Agency slug already taken. Please choose another slug." },
        { status: 400 }
      );
    }

    // Check if user email already exists globally or within slug
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      return NextResponse.json(
        { error: "Email address already registered." },
        { status: 400 }
      );
    }

    // 1. Create Agency
    const [newAgency] = await db
      .insert(agencies)
      .values({
        name: agencyName,
        slug: agencySlug,
        email: email,
        phone: phone || null,
        status: "active",
      })
      .returning();

    // 2. Create default roles for the agency
    const [ownerRole] = await db
      .insert(roles)
      .values({
        agencyId: newAgency.id,
        name: "AGENCY_OWNER",
        description: "Full administrative access to agency",
      })
      .returning();

    await db.insert(roles).values([
      { agencyId: newAgency.id, name: "MANAGER", description: "Branch or department manager" },
      { agencyId: newAgency.id, name: "RECRUITMENT_OFFICER", description: "Recruitment and candidate officer" },
      { agencyId: newAgency.id, name: "DOCUMENT_OFFICER", description: "Visa and document officer" },
      { agencyId: newAgency.id, name: "ACCOUNTANT", description: "Financial and billing officer" },
    ]);

    // 3. Hash password
    const passwordHash = await hashPassword(password);

    // 4. Create User (Agency Owner)
    const [newUser] = await db
      .insert(users)
      .values({
        agencyId: newAgency.id,
        roleId: ownerRole.id,
        name,
        email,
        passwordHash,
        phone: phone || null,
        status: "active",
      })
      .returning();

    const tokenPayload = {
      userId: newUser.id,
      agencyId: newAgency.id,
      email: newUser.email,
      name: newUser.name,
      role: "AGENCY_OWNER" as UserRole,
      agencySlug: newAgency.slug,
    };

    const token = createSessionToken(tokenPayload);

    const response = NextResponse.json({
      success: true,
      message: "Agency and owner account registered successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: "AGENCY_OWNER",
        agencyId: newAgency.id,
        agencyName: newAgency.name,
        agencySlug: newAgency.slug,
      },
    }, { status: 201 });

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
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error during registration", details: error.message },
      { status: 500 }
    );
  }
}
