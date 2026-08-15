"use client";

import React, { useEffect, useState } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { FileBarChart, Download, Printer, Search } from "lucide-react";

export default function ReportsPage() {
  const [reportType, setReportType] = useState("revenue");
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async (type: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?reportType=${type}&format=json`);
      const data = await res.json();
      setReportData(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(reportType);
  }, [reportType]);

  const handleExportCSV = () => {
    window.open(`/api/reports?reportType=${reportType}&format=csv`, "_blank");
  };

  const handleExportPDF = () => {
    window.open(`/api/reports?reportType=${reportType}&format=pdf`, "_blank");
  };

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Comprehensive Reports & Analytics</h1>
            <p className="text-sm text-slate-500 mt-1">Generate worker, pipeline, placement, client, visa, revenue, and employee performance reports with CSV/PDF export.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center justify-center bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all text-sm"
            >
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/25 transition-all text-sm"
            >
              <Printer className="w-4 h-4 mr-2" /> Print / PDF View
            </button>
          </div>
        </div>

        {/* Report Selector */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Report Type:</span>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="revenue">Revenue Report (Invoices)</option>
              <option value="outstanding">Outstanding Payment Report</option>
              <option value="worker">Worker Report</option>
              <option value="pipeline">Recruitment Pipeline Report</option>
              <option value="placement">Placement Report (Contracts)</option>
              <option value="client">Client Report</option>
              <option value="visa">Visa Report</option>
              <option value="employee">Employee Performance Report</option>
            </select>
          </div>
        </div>

        {/* Report Display */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Generating report...</div>
          ) : !reportData || reportData.data?.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No records found for this report.</div>
          ) : (
            <div>
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">{reportData.title}</h2>
                <span className="text-xs font-semibold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full">
                  Total Records: {reportData.data.length}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {Object.keys(reportData.data[0]).map((key) => (
                        <th key={key} className="p-4">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {reportData.data.map((row: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        {Object.values(row).map((val: any, vIdx: number) => (
                          <td key={vIdx} className="p-4 text-slate-700">
                            {val !== null && val !== undefined ? String(val) : "N/A"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
