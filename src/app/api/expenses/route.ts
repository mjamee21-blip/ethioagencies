import { NextResponse } from "next/server";
import { db } from "@/db";
import { expenses } from "@/db/schema";
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
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const agencyId = session.agencyId;
    let conditions = [eq(expenses.agencyId, agencyId)];

    if (status && status !== "all") {
      conditions.push(eq(expenses.status, status));
    }
    if (category && category !== "all") {
      conditions.push(eq(expenses.category, category));
    }
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(ilike(expenses.description, searchTerm));
    }

    const result = await db
      .select()
      .from(expenses)
      .where(and(...conditions))
      .orderBy(sql`${expenses.createdAt} DESC`);

    return NextResponse.json({ expenses: result });
  } catch (error: any) {
    console.error("Expenses GET Error:", error);
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
    const { category, amount, currency, description, expenseDate, status } = body;

    if (!category || !amount || !expenseDate) {
      return NextResponse.json(
        { error: "Category, amount, and expense date are required" },
        { status: 400 }
      );
    }

    const agencyId = session.agencyId;

    const [newExpense] = await db
      .insert(expenses)
      .values({
        agencyId,
        category,
        amount: String(amount),
        currency: currency || "USD",
        description: description || null,
        expenseDate: new Date(expenseDate),
        status: status || "approved",
      })
      .returning();

    return NextResponse.json({ expense: newExpense }, { status: 201 });
  } catch (error: any) {
    console.error("Expenses POST Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
