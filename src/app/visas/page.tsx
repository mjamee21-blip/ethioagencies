"use client";

import React, { useEffect, useState } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { ShieldCheck, Plus, Search, Trash2, X, RefreshCw } from "lucide-react";

interface Visa {
  id: number;
  visaNumber: string;
  visaType: string;
  issueDate: string;
  expiryDate: string;
  status: string;
  workerName: string;
  passportNumber: string;
}

export default function VisasPage() {
  const [visas, setVisas] = useState<Visa[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [workers, setWorkers] = useState<any[]>([]);

  const [form, setForm] = useState({
    workerId: "",
    visaNumber: "",
    externalRefNumber: "",
    visaType: "employment",
    issueDate: "",
    expiryDate: "",
    status: "PROCESSING",
  });

  const fetchData = async () => {
    try {
      const [resV, resW] = await Promise.all([
        fetch(`/api/visas?search=${encodeURIComponent(search)}&status=${statusFilter}`),
        fetch("/api/workers"),
      ]);
      const dataV = await resV.json();
      const dataW = await resW.json();

      setVisas(dataV.visas || []);
      setWorkers(dataW.workers || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/visas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowAddModal(false);
        setForm({
          workerId: "",
          visaNumber: "",
          externalRefNumber: "",
          visaType: "employment",
          issueDate: "",
          expiryDate: "",
          status: "PROCESSING",
        });
        fetchData();
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to create visa record");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSync = async (id: number) => {
    try {
      const res = await fetch(`/api/visas/${id}/sync`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchData();
      } else {
        alert(data.error || "Sync failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this visa record?")) return;
    try {
      const res = await fetch(`/api/visas/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    let bg = "bg-slate-100 text-slate-700 border-slate-200";
    if (s === "APPROVED") bg = "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (s === "PROCESSING" || s === "SUBMITTED") bg = "bg-amber-50 text-amber-700 border-amber-200";
    if (s === "REJECTED" || s === "EXPIRED") bg = "bg-red-50 text-red-700 border-red-200";
    return (
      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${bg}`}>
        {status}
      </span>
    );
  };

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Visa Tracking & Management</h1>
            <p className="text-sm text-slate-500 mt-1">Track worker visas, external reference numbers, status updates, and manual synchronization.</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/25 transition-all text-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Visa Record
          </button>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search visa number or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-semibold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="all">All Statuses</option>
              <option value="NOT_STARTED">NOT_STARTED</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="EXPIRED">EXPIRED</option>
            </select>
          </div>
        </div>

        {/* Visas Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading visas...</div>
          ) : visas.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No visa records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="p-4">Visa Number</th>
                    <th className="p-4">Worker</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Expiry Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {visas.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-semibold text-slate-900">{v.visaNumber}</td>
                      <td className="p-4 text-slate-700 font-medium">
                        {v.workerName || "N/A"} <br />
                        <span className="text-xs text-slate-400 font-normal">Passport: {v.passportNumber || "N/A"}</span>
                      </td>
                      <td className="p-4 text-slate-600 uppercase text-xs font-semibold">{v.visaType}</td>
                      <td className="p-4 text-slate-600 text-xs">
                        {v.issueDate ? `Issued: ${new Date(v.issueDate).toLocaleDateString()}` : ""} <br />
                        <span className="font-medium text-slate-800">Expires: {new Date(v.expiryDate).toLocaleDateString()}</span>
                      </td>
                      <td className="p-4">{getStatusBadge(v.status)}</td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleSync(v.id)}
                          title="Sync Status with Portal"
                          className="inline-flex items-center px-2.5 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Sync
                        </button>
                        <button
                          onClick={() => handleDelete(v.id)}
                          className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors inline-block"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900">Add Visa Record</h2>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Worker *</label>
                  <select
                    required
                    value={form.workerId}
                    onChange={(e) => setForm({ ...form, workerId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  >
                    <option value="">Select Worker</option>
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.firstName} {w.lastName} ({w.passportNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Visa Number *</label>
                    <input
                      type="text"
                      required
                      value={form.visaNumber}
                      onChange={(e) => setForm({ ...form, visaNumber: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">External Ref Number</label>
                    <input
                      type="text"
                      value={form.externalRefNumber}
                      onChange={(e) => setForm({ ...form, externalRefNumber: e.target.value })}
                      placeholder="e.g. MOI-98823"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Visa Type *</label>
                    <select
                      value={form.visaType}
                      onChange={(e) => setForm({ ...form, visaType: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    >
                      <option value="employment">Employment</option>
                      <option value="visit">Visit</option>
                      <option value="transit">Transit</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    >
                      <option value="NOT_STARTED">NOT_STARTED</option>
                      <option value="SUBMITTED">SUBMITTED</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="REJECTED">REJECTED</option>
                      <option value="EXPIRED">EXPIRED</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Date</label>
                    <input
                      type="date"
                      value={form.issueDate}
                      onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date *</label>
                    <input
                      type="date"
                      required
                      value={form.expiryDate}
                      onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-md shadow-indigo-600/20"
                  >
                    Save Visa Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
