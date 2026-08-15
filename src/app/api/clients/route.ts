import { NextResponse } from "next/server";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq, and, ilike, or, sql } from "drizzle-orm";
import { getCurrentSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const country = searchParams.get("country");

    const agencyId = session.agencyId;
    let conditions = [eq(clients.agencyId, agencyId)];

    if (status && status !== "all") {
      conditions.push(eq(clients.status, status));
    }
    if (country && country !== "all") {
      conditions.push(eq(clients.country, country));
    }
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          ilike(clients.name, searchTerm),
          ilike(clients.contactPerson, searchTerm),
          ilike(clients.email, searchTerm),
          ilike(clients.phone, searchTerm)
        )
      );
    }

    const result = await db
      .select()
      .from(clients)
      .where(and(...conditions))
      .orderBy(sql`${clients.createdAt} DESC`);

    return NextResponse.json({ clients: result });
  } catch (error: any) {
    console.error("Clients GET Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, contactPerson, email, phone, country, address, status } = body;

    if (!name || !country) {
      return NextResponse.json(
        { error: "Client name and country are required" },
        { status: 400 }
      );
    }

    const agencyId = session.agencyId;

    const [newClient] = await db
      .insert(clients)
      .values({
        agencyId,
        name,
        contactPerson: contactPerson || null,
        email: email || null,
        phone: phone || null,
        country,
        address: address || null,
        status: status || "active",
      })
      .returning();

    return NextResponse.json({ client: newClient }, { status: 201 });
  } catch (error: any) {
    console.error("Clients POST Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
