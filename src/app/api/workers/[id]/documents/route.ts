import { NextResponse } from "next/server";
import { db } from "@/db";
import { workers, workerDocuments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentSession } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workerId = parseInt(params.id, 10);
    if (isNaN(workerId)) {
      return NextResponse.json({ error: "Invalid worker ID" }, { status: 400 });
    }

    const agencyId = session.agencyId;

    const documents = await db
      .select()
      .from(workerDocuments)
      .where(and(eq(workerDocuments.workerId, workerId), eq(workerDocuments.agencyId, agencyId)));

    // Calculate status and expiry alerts for documents
    const now = new Date();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    const enhancedDocs = documents.map(doc => {
      let computedStatus = doc.status;
      let isExpiringSoon = false;
      let isExpired = false;

      if (doc.expiryDate) {
        const expTime = new Date(doc.expiryDate).getTime();
        const diff = expTime - now.getTime();
        if (diff < 0) {
          isExpired = true;
          computedStatus = "expired";
        } else if (diff < thirtyDays) {
          isExpiringSoon = true;
        }
      }

      return {
        ...doc,
        computedStatus,
        isExpiringSoon,
        isExpired,
      };
    });

    return NextResponse.json({ documents: enhancedDocs });
  } catch (error: any) {
    console.error("Worker Documents GET Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workerId = parseInt(params.id, 10);
    if (isNaN(workerId)) {
      return NextResponse.json({ error: "Invalid worker ID" }, { status: 400 });
    }

    const agencyId = session.agencyId;
    const body = await request.json();
    const { documentType, documentNumber, fileUrl, issueDate, expiryDate, status } = body;

    if (!documentType || !fileUrl) {
      return NextResponse.json(
        { error: "Document type and file URL are required" },
        { status: 400 }
      );
    }

    // Verify worker belongs to tenant
    const [worker] = await db
      .select()
      .from(workers)
      .where(and(eq(workers.id, workerId), eq(workers.agencyId, agencyId)));

    if (!worker) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    const [newDoc] = await db
      .insert(workerDocuments)
      .values({
        agencyId,
        workerId,
        documentType,
        documentNumber: documentNumber || null,
        fileUrl,
        issueDate: issueDate ? new Date(issueDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        status: status || "pending",
      })
      .returning();

    return NextResponse.json({ document: newDoc }, { status: 201 });
  } catch (error: any) {
    console.error("Worker Documents POST Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
