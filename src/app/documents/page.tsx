"use client";

import React, { useEffect, useState } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { FolderArchive, AlertTriangle, ShieldCheck, Search } from "lucide-react";

export default function DocumentsPage() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/workers")
      .then((res) => res.json())
      .then(async (data) => {
        const workerList = data.workers || [];
        // Fetch documents for each worker
        const enhanced = await Promise.all(
          workerList.map(async (w: any) => {
            const docRes = await fetch(`/api/workers/${w.id}/documents`);
            const docData = await docRes.json();
            return {
              ...w,
              documents: docData.documents || [],
            };
          })
        );
        setWorkers(enhanced);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Flatten all documents with worker info for document center view
  const allDocuments = workers.flatMap((w) =>
    (w.documents || []).map((d: any) => ({
      ...d,
      workerName: `${w.firstName} ${w.lastName}`,
      workerPassport: w.passportNumber,
    }))
  );

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Worker Document Center</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor all worker passports, medical clearances, visas, and expiry alerts.</p>
        </div>

        {/* Documents Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading document center...</div>
          ) : allDocuments.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No worker documents found. Register documents via worker profiles.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="p-4">Worker Name</th>
                    <th className="p-4">Document Type</th>
                    <th className="p-4">Document Number</th>
                    <th className="p-4">Expiry Date</th>
                    <th className="p-4">Status / Alert</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {allDocuments.map((doc: any) => (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-semibold text-slate-900">
                        {doc.workerName}
                        <span className="block text-xs font-normal text-slate-500 font-mono">{doc.workerPassport}</span>
                      </td>
                      <td className="p-4 font-medium text-slate-700 capitalize">{doc.documentType.replace("_", " ")}</td>
                      <td className="p-4 font-mono text-xs text-slate-600">{doc.documentNumber || "N/A"}</td>
                      <td className="p-4 text-slate-600">
                        {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : "No Expiry"}
                      </td>
                      <td className="p-4">
                        {doc.isExpired ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-red-500" /> Expired
                          </span>
                        ) : doc.isExpiringSoon ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-500" /> Expiring Soon
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-500" /> Valid
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
