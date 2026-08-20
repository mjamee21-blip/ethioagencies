"use client";

import React, { useState, useEffect } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { 
  FileText, 
  Plus, 
  Search, 
  Trash2, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Users, 
  RefreshCw, 
  Calendar,
  X
} from "lucide-react";

interface Contract {
  id: string;
  contractNumber: string;
  workerName: string;
  passportNumber: string;
  clientName: string;
  position: string;
  deploymentDate: string;
  warrantyEndDate: string;
  daysRemaining: number;
  status: "Active Warranty" | "Completed 90-Days" | "Replacement Requested";
  replacementWorker?: string;
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [search, setSearch] = useState("");
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("agency_contracts");
    if (saved) {
      try {
        setContracts(JSON.parse(saved));
      } catch (e) {}
    } else {
      const initial: Contract[] = [
        {
          id: "CON-701",
          contractNumber: "SA-MUSANED-882190",
          workerName: "Fatima Ahmed",
          passportNumber: "EP9821034",
          clientName: "Riyadh Elite Manpower Services",
          position: "Domestic Housemaid",
          deploymentDate: "2026-07-01",
          warrantyEndDate: "2026-09-29",
          daysRemaining: 40,
          status: "Active Warranty",
        },
        {
          id: "CON-702",
          contractNumber: "SA-MUSANED-331902",
          workerName: "Selamawit Tadesse",
          passportNumber: "EP5519283",
          clientName: "Jeddah Hospitality Services",
          position: "Hospitality Cleaner",
          deploymentDate: "2026-05-10",
          warrantyEndDate: "2026-08-08",
          daysRemaining: 0,
          status: "Completed 90-Days",
        },
      ];
      setContracts(initial);
      localStorage.setItem("agency_contracts", JSON.stringify(initial));
    }
  }, []);

  const saveContracts = (updated: Contract[]) => {
    setContracts(updated);
    localStorage.setItem("agency_contracts", JSON.stringify(updated));
  };

  const handleRequestReplacement = (contract: Contract) => {
    setSelectedContract(contract);
    setShowReplacementModal(true);
  };

  const handleConfirmReplacement = (replacementName: string) => {
    if (!selectedContract) return;
    const updated = contracts.map((c) =>
      c.id === selectedContract.id
        ? {
            ...c,
            status: "Replacement Requested" as const,
            replacementWorker: replacementName,
          }
        : c
    );
    saveContracts(updated);
    setShowReplacementModal(false);
    setSelectedContract(null);
  };

  const filtered = contracts.filter((c) =>
    `${c.contractNumber} ${c.workerName} ${c.clientName} ${c.passportNumber}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <SidebarLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-indigo-600" /> 90-Day Saudi Labor Warranty & Contracts
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Mandatory Saudi Ministry of Human Resources (Musaned) 90-day replacement guarantee & probation management.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center justify-between bg-white p-4 rounded-3xl shadow-sm border border-slate-200/80">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search contract #, candidate, employer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-slate-50/50 font-medium"
            />
          </div>
        </div>

        {/* Contracts Table */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 overflow-hidden space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                  <th className="p-4">Musaned Contract #</th>
                  <th className="p-4">Deployed Candidate</th>
                  <th className="p-4">Saudi Sponsor / Client</th>
                  <th className="p-4">Warranty Period</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Warranty Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-mono font-bold text-indigo-600">{c.contractNumber}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{c.workerName}</div>
                      <div className="text-xs text-slate-500 font-mono">Passport: {c.passportNumber}</div>
                    </td>
                    <td className="p-4 font-semibold text-slate-800">{c.clientName}</td>
                    <td className="p-4">
                      <div className="text-xs font-bold text-slate-800">
                        {c.deploymentDate} &rarr; {c.warrantyEndDate}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        {c.daysRemaining > 0 ? `${c.daysRemaining} days left in warranty` : "Warranty Completed"}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        c.status === "Active Warranty" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                        c.status === "Completed 90-Days" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                        "bg-red-50 text-red-700 border border-red-200"
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {c.status === "Active Warranty" && (
                        <button
                          onClick={() => handleRequestReplacement(c)}
                          className="inline-flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors border border-red-200"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Match Replacement
                        </button>
                      )}
                      {c.status === "Replacement Requested" && (
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                          Replaced by {c.replacementWorker}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Replacement Matcher Modal */}
        {showReplacementModal && selectedContract && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-indigo-600" /> Match Saudi Replacement Candidate
                </h3>
                <button onClick={() => setShowReplacementModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-600">
                Under Saudi Labor Law (Musaned), sponsor <strong>{selectedContract.clientName}</strong> is eligible for an immediate replacement candidate for <strong>{selectedContract.workerName}</strong>.
              </p>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Select Available Qualified Replacement</label>
                <button
                  onClick={() => handleConfirmReplacement("Tigist Mekonnen (EP4452910)")}
                  className="w-full text-left p-4 rounded-2xl border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/50 transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-slate-900 text-sm">Tigist Mekonnen</div>
                    <div className="text-xs text-slate-500 font-mono">Passport: EP4452910 • 2 Yrs Exp • GAMCA Fit</div>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
                    Match 98%
                  </span>
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowReplacementModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
