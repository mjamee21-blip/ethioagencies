import { NextResponse } from "next/server";
import { seedDatabase } from "@/db/seed";

export async function POST() {
  try {
    const result = await seedDatabase();
    return NextResponse.json({ success: true, message: "Database seeded successfully", ...result });
  } catch (error: any) {
    console.error("Seeding error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to seed database" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const result = await seedDatabase();
    return NextResponse.json({ success: true, message: "Database seeded successfully", ...result });
  } catch (error: any) {
    console.error("Seeding error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to seed database" }, { status: 500 });
  }
}
