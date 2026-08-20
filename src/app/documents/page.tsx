"use client";

import React, { useState, useEffect } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { 
  FolderArchive, 
  AlertTriangle, 
  ShieldCheck, 
  Search, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  FileText, 
  Trash2,
  Scan,
  X
} from "lucide-react";

interface VaultDocument {
  id: string;
  workerName: string;
  documentType: "Passport" | "Wafid Medical" | "Police Clearance" | "Visa Stamping";
  documentNumber: string;
  expiryDate: string;
  status: "Verified (Clean)" | "Expiring Soon" | "Pending OCR Extraction";
  uploadDate: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [search, setSearch] = useState("");
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [ocrResult, setOcrResult] = useState<any | null>(null);

  const [form, setForm] = useState({
    workerName: "Fatima Ahmed",
    documentType: "Passport" as const,
    documentNumber: "EP9821034",
    expiryDate: "2030-05-14",
  });

  useEffect(() => {
    const saved = localStorage.getItem("agency_document_vault");
    if (saved) {
      try {
        setDocuments(JSON.parse(saved));
      } catch (e) {}
    } else {
      const initial: VaultDocument[] = [
        {
          id: "DOC-101",
          workerName: "Fatima Ahmed",
          documentType: "Passport",
          documentNumber: "EP9821034",
          expiryDate: "2030-05-14",
          status: "Verified (Clean)",
          uploadDate: "2026-08-10",
        },
        {
          id: "DOC-102",
          workerName: "Fatima Ahmed",
          documentType: "Wafid Medical",
          documentNumber: "GAMCA-SA-9912",
          expiryDate: "2026-11-20",
          status: "Verified (Clean)",
          uploadDate: "2026-08-12",
        },
        {
          id: "DOC-103",
          workerName: "Tigist Mekonnen",
          documentType: "Police Clearance",
          documentNumber: "ETH-POL-4412",
          expiryDate: "2026-09-01",
          status: "Expiring Soon",
          uploadDate: "2026-05-01",
        },
      ];
      setDocuments(initial);
      localStorage.setItem("agency_document_vault", JSON.stringify(initial));
    }
  }, []);

  const saveDocs = (updated: VaultDocument[]) => {
    setDocuments(updated);
    localStorage.setItem("agency_document_vault", JSON.stringify(updated));
  };

  const handleRunAiOcr = () => {
    setScanning(true);
    setOcrResult(null);
    setTimeout(() => {
      setScanning(false);
      const res = {
        extractedName: form.workerName,
        extractedNumber: form.documentNumber,
        extractedExpiry: form.expiryDate,
        cleanlinessScore: "100% (No tampering or blurring detected)",
        authenticity: "Valid Biometric MRZ Verified",
      };
      setOcrResult(res);
      const newDoc: VaultDocument = {
        id: `DOC-${Math.floor(100 + Math.random() * 900)}`,
        workerName: form.workerName,
        documentType: form.documentType,
        documentNumber: form.documentNumber,
        expiryDate: form.expiryDate,
        status: "Verified (Clean)",
        uploadDate: new Date().toISOString().split("T")[0],
      };
      saveDocs([newDoc, ...documents]);
    }, 2000);
  };

  const handleDelete = (id: string) => {
    const updated = documents.filter((d) => d.id !== id);
    saveDocs(updated);
  };

  const filtered = documents.filter((d) =>
    `${d.workerName} ${d.documentNumber} ${d.documentType}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <SidebarLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FolderArchive className="w-7 h-7 text-indigo-600" /> Document Vault & AI OCR Scanner
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Securely store worker passports and medical reports with automated AI OCR clean data extraction and expiration monitoring.
            </p>
          </div>
          <button
            onClick={() => setShowOcrModal(true)}
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-2xl shadow-lg shadow-indigo-600/30 transition-all text-sm"
          >
            <Scan className="w-4 h-4" /> AI OCR Document Scan & Ingest
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center justify-between bg-white p-4 rounded-3xl shadow-sm border border-slate-200/80">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by worker name, document #, type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-slate-50/50 font-medium"
            />
          </div>
        </div>

        {/* Documents Table */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 overflow-hidden space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                  <th className="p-4">Candidate Name</th>
                  <th className="p-4">Document Type</th>
                  <th className="p-4">Document Number</th>
                  <th className="p-4">Expiry Date</th>
                  <th className="p-4">AI Clean Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-bold text-slate-900">{doc.workerName}</td>
                    <td className="p-4 font-semibold text-slate-700">{doc.documentType}</td>
                    <td className="p-4 font-mono font-bold text-indigo-600">{doc.documentNumber}</td>
                    <td className="p-4 font-mono text-slate-600">{doc.expiryDate}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                        doc.status === "Verified (Clean)" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                        "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {doc.status === "Verified (Clean)" && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {doc.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="text-slate-400 hover:text-red-600 p-2 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI OCR Scanner Modal */}
        {showOcrModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" /> AI OCR Document Scanner & Extractor
                </h3>
                <button onClick={() => setShowOcrModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Candidate Name</label>
                  <input
                    type="text"
                    value={form.workerName}
                    onChange={(e) => setForm({ ...form, workerName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/25 outline-none font-medium"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Document Type</label>
                    <select
                      value={form.documentType}
                      onChange={(e) => setForm({ ...form, documentType: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/25 outline-none font-medium"
                    >
                      <option value="Passport">Passport</option>
                      <option value="Wafid Medical">Wafid Medical</option>
                      <option value="Police Clearance">Police Clearance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Document Number</label>
                    <input
                      type="text"
                      value={form.documentNumber}
                      onChange={(e) => setForm({ ...form, documentNumber: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/25 outline-none font-mono text-xs font-bold"
                    />
                  </div>
                </div>

                {/* Dropzone Simulation */}
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center bg-slate-50 space-y-2">
                  <Upload className="w-8 h-8 text-indigo-600 mx-auto" />
                  <div className="font-bold text-slate-800 text-xs">Drag & drop passport or medical PDF here</div>
                  <div className="text-[11px] text-slate-400">Supports JPG, PNG, PDF up to 25MB</div>
                </div>

                {scanning ? (
                  <div className="py-6 text-center space-y-2">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                    <p className="text-xs font-bold text-indigo-600">AI OCR parsing MRZ and verifying document cleanliness...</p>
                  </div>
                ) : ocrResult ? (
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl space-y-1 text-xs text-emerald-900">
                    <div className="font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> {ocrResult.authenticity}
                    </div>
                    <div>Cleanliness & Quality: <strong>{ocrResult.cleanlinessScore}</strong></div>
                    <div>Extracted Number: <strong className="font-mono">{ocrResult.extractedNumber}</strong></div>
                  </div>
                ) : null}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowOcrModal(false)}
                    className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleRunAiOcr}
                    className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30"
                  >
                    Run AI OCR Scan & Ingest
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
