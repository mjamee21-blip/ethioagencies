import { NextResponse } from "next/server";
import { db } from "@/db";
import { workers, clients, recruitmentOrders, recruitmentCandidates, contracts, visas, travelRecords, invoices, payments, expenses, users } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getCurrentSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("reportType") || "revenue";
    const format = searchParams.get("format") || "json"; // json, csv, pdf

    const agencyId = session.agencyId;
    let data: any[] = [];
    let title = "";

    switch (reportType) {
      case "worker":
        title = "Worker Report";
        data = await db.select().from(workers).where(eq(workers.agencyId, agencyId));
        break;
      case "pipeline":
        title = "Recruitment Pipeline Report";
        data = await db
          .select({
            id: recruitmentCandidates.id,
            status: recruitmentCandidates.status,
            createdAt: recruitmentCandidates.createdAt,
            workerName: sql<string>`concat(${workers.firstName}, ' ', ${workers.lastName})`,
            position: recruitmentOrders.position,
            clientName: clients.name,
          })
          .from(recruitmentCandidates)
          .leftJoin(workers, eq(recruitmentCandidates.workerId, workers.id))
          .leftJoin(recruitmentOrders, eq(recruitmentCandidates.orderId, recruitmentOrders.id))
          .leftJoin(clients, eq(recruitmentOrders.clientId, clients.id))
          .where(eq(recruitmentCandidates.agencyId, agencyId));
        break;
      case "placement":
        title = "Placement Report";
        data = await db
          .select({
            id: contracts.id,
            contractNumber: contracts.contractNumber,
            startDate: contracts.startDate,
            endDate: contracts.endDate,
            salary: contracts.salary,
            status: contracts.status,
            workerName: sql<string>`concat(${workers.firstName}, ' ', ${workers.lastName})`,
            clientName: clients.name,
          })
          .from(contracts)
          .leftJoin(workers, eq(contracts.workerId, workers.id))
          .leftJoin(clients, eq(contracts.clientId, clients.id))
          .where(eq(contracts.agencyId, agencyId));
        break;
      case "client":
        title = "Client Report";
        data = await db.select().from(clients).where(eq(clients.agencyId, agencyId));
        break;
      case "visa":
        title = "Visa Report";
        data = await db
          .select({
            id: visas.id,
            visaNumber: visas.visaNumber,
            visaType: visas.visaType,
            expiryDate: visas.expiryDate,
            status: visas.status,
            workerName: sql<string>`concat(${workers.firstName}, ' ', ${workers.lastName})`,
          })
          .from(visas)
          .leftJoin(workers, eq(visas.workerId, workers.id))
          .where(eq(visas.agencyId, agencyId));
        break;
      case "revenue":
        title = "Revenue Report";
        data = await db.select().from(invoices).where(eq(invoices.agencyId, agencyId));
        break;
      case "outstanding":
        title = "Outstanding Payment Report";
        data = await db
          .select()
          .from(invoices)
          .where(and(eq(invoices.agencyId, agencyId), eq(invoices.status, "unpaid")));
        break;
      case "employee":
        title = "Employee Performance Report";
        data = await db.select().from(users).where(eq(users.agencyId, agencyId));
        break;
      default:
        title = "General Financial & Operation Report";
        data = await db.select().from(invoices).where(eq(invoices.agencyId, agencyId));
        break;
    }

    if (format === "csv") {
      if (data.length === 0) {
        return new NextResponse("No data available for export", { status: 200, headers: { "Content-Type": "text/csv" } });
      }
      const keys = Object.keys(data[0]);
      const csvRows = [
        keys.join(","),
        ...data.map(row => keys.map(k => `"${String((row as any)[k] ?? "").replace(/"/g, '""')}"`).join(","))
      ];
      const csvString = csvRows.join("\n");
      return new NextResponse(csvString, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${reportType}-report.csv"`,
        },
      });
    }

    if (format === "pdf") {
      // Return HTML formatted report suitable for printing / PDF export
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            h1 { color: #2563eb; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; font-size: 14px; }
            th { background-color: #f1f5f9; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p>Generated on: ${new Date().toISOString()}</p>
          <table>
            <thead>
              <tr>
                ${data.length > 0 ? Object.keys(data[0]).map(k => `<th>${k}</th>`).join("") : "<th>Details</th>"}
              </tr>
            </thead>
            <tbody>
              ${data.length > 0 ? data.map(row => `<tr>${Object.values(row).map(v => `<td>${v !== null && v !== undefined ? String(v) : ""}</td>`).join("")}</tr>`).join("") : "<tr><td>No records found</td></tr>"}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
        </html>
      `;
      return new NextResponse(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html",
        },
      });
    }

    return NextResponse.json({ reportType, title, data });
  } catch (error: any) {
    console.error("Reports API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
