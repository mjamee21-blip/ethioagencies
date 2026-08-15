import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { ocrService } from "@/lib/ocr/service";
import { db } from "@/db";
import { workers, workerDocuments } from "@/db/schema";

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, fileUrl, confirmedData } = body;

    // Action 1: Extract passport data from file/image URL or buffer stub
    if (action === "extract") {
      if (!fileUrl) {
        return NextResponse.json({ error: "fileUrl is required for OCR extraction" }, { status: 400 });
      }

      const result = await ocrService.extractPassport(fileUrl);
      if (!result.success) {
        return NextResponse.json({ error: result.error || "OCR extraction failed" }, { status: 422 });
      }

      return NextResponse.json({
        success: true,
        extractedData: result.data,
        rawText: result.rawText,
        confidence: result.confidence,
      });
    }

    // Action 2: Confirm and save extracted worker/passport data
    if (action === "confirm_and_save") {
      if (!confirmedData) {
        return NextResponse.json({ error: "confirmedData is required" }, { status: 400 });
      }

      const {
        firstName,
        lastName,
        middleName,
        passportNumber,
        dateOfBirth,
        nationality,
        issueDate,
        expiryDate,
        gender,
        fileUrl: docFileUrl,
      } = confirmedData;

      if (!firstName || !lastName || !passportNumber) {
        return NextResponse.json(
          { error: "First name, last name, and passport number are required" },
          { status: 400 }
        );
      }

      const agencyId = session.agencyId;

      // Check if worker already exists with this passport number in this agency
      const existing = await db.query.workers.findFirst({
        where: (w, { and, eq }) => and(eq(w.agencyId, agencyId), eq(w.passportNumber, passportNumber)),
      });

      let workerId: number;

      if (existing) {
        // Update existing worker or keep
        workerId = existing.id;
        await db
          .update(workers)
          .set({
            firstName,
            lastName,
            middleName: middleName || existing.middleName,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : existing.dateOfBirth,
            nationality: nationality || existing.nationality,
            passportExpiryDate: expiryDate ? new Date(expiryDate) : existing.passportExpiryDate,
            gender: gender || existing.gender,
            updatedAt: new Date(),
          })
          .where(eq(workers.id, workerId));
      } else {
        // Insert new worker
        const [newWorker] = await db
          .insert(workers)
          .values({
            agencyId,
            firstName,
            lastName,
            middleName: middleName || null,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            nationality: nationality || "Ethiopian",
            passportNumber,
            passportExpiryDate: expiryDate ? new Date(expiryDate) : null,
            gender: gender || null,
            status: "available",
          })
          .returning();
        workerId = newWorker.id;
      }

      // Record worker document
      if (docFileUrl) {
        await db.insert(workerDocuments).values({
          agencyId,
          workerId,
          documentType: "passport",
          documentNumber: passportNumber,
          fileUrl: docFileUrl,
          issueDate: issueDate ? new Date(issueDate) : null,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          status: "verified",
        });
      }

      return NextResponse.json({
        success: true,
        message: "Passport OCR data successfully confirmed and saved.",
        workerId,
      });
    }

    return NextResponse.json({ error: "Invalid action specified. Use 'extract' or 'confirm_and_save'." }, { status: 400 });
  } catch (error: any) {
    console.error("OCR API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
