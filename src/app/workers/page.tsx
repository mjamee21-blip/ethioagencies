"use client";

import React, { useEffect, useState } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { Users, Plus, Search, Filter, FileText, CheckCircle, AlertCircle, X, Trash2, Edit } from "lucide-react";

interface Worker {
  id: number;
  firstName: string;
  lastName: string;
  nationality: string;
  passportNumber: string;
  passportExpiryDate: string;
  phone: string;
  status: string;
  gender: string;
}

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<any | null>(null);

  // New worker form state
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    passportNumber: "",
    nationality: "Ethiopian",
    phone: "",
    gender: "female",
    status: "available",
    passportExpiryDate: "",
  });

  const fetchWorkers = async () => {
    try {
      const res = await fetch(`/api/workers?status=${statusFilter}&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      setWorkers(data.workers || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [statusFilter, search]);

  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowAddModal(false);
        setForm({
          firstName: "",
          lastName: "",
          passportNumber: "",
          nationality: "Ethiopian",
          phone: "",
          gender: "female",
          status: "available",
          passportExpiryDate: "",
        });
        fetchWorkers();
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to create worker");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectWorker = async (id: number) => {
    try {
      const res = await fetch(`/api/workers/${id}`);
      const data = await res.json();
      setSelectedWorker(data.worker);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteWorker = async (id: number) => {
    if (!confirm("Are you sure you want to delete this worker?")) return;
    try {
      const res = await fetch(`/api/workers/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (selectedWorker?.id === id) setSelectedWorker(null);
        fetchWorkers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Worker Management</h1>
            <p className="text-sm text-slate-500 mt-1">Manage talent pool, passports, documents, and availability status.</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/25 transition-all text-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Worker
          </button>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, passport, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="processing">Processing</option>
              <option value="deployed">Deployed</option>
              <option value="blacklisted">Blacklisted</option>
            </select>
          </div>
        </div>

        {/* Workers Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading workers...</div>
          ) : workers.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No workers found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="p-4">Worker Name</th>
                    <th className="p-4">Passport</th>
                    <th className="p-4">Nationality</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {workers.map((worker) => (
                    <tr key={worker.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-semibold text-slate-900">
                        {worker.firstName} {worker.lastName}
                      </td>
                      <td className="p-4 text-slate-600 font-mono text-xs">{worker.passportNumber}</td>
                      <td className="p-4 text-slate-600">{worker.nationality || "Ethiopian"}</td>
                      <td className="p-4 text-slate-600">{worker.phone || "N/A"}</td>
                      <td className="p-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                          worker.status === "available" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          worker.status === "processing" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                          worker.status === "deployed" ? "bg-purple-50 text-purple-700 border border-purple-200" :
                          "bg-slate-100 text-slate-700"
                        }`}>
                          {worker.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleSelectWorker(worker.id)}
                          className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-semibold rounded-lg text-xs transition-colors"
                        >
                          Profile & Docs
                        </button>
                        <button
                          onClick={() => handleDeleteWorker(worker.id)}
                          className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
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

        {/* Add Worker Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900">Register New Worker</h2>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateWorker} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Passport Number *</label>
                    <input
                      type="text"
                      required
                      value={form.passportNumber}
                      onChange={(e) => setForm({ ...form, passportNumber: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Passport Expiry</label>
                    <input
                      type="date"
                      value={form.passportExpiryDate}
                      onChange={(e) => setForm({ ...form, passportExpiryDate: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nationality</label>
                    <input
                      type="text"
                      value={form.nationality}
                      onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
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
                    Save Worker
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Worker Detail / Documents Modal */}
        {selectedWorker && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    {selectedWorker.firstName} {selectedWorker.lastName}
                  </h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Passport: {selectedWorker.passportNumber}</p>
                </div>
                <button onClick={() => setSelectedWorker(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase">Status</span>
                    <p className="text-sm font-bold text-slate-900 capitalize mt-0.5">{selectedWorker.status}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase">Nationality</span>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedWorker.nationality || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase">Phone</span>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedWorker.phone || "N/A"}</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-900 text-base">Worker Documents & Compliance</h3>
                  </div>
                  {selectedWorker.documents && selectedWorker.documents.length > 0 ? (
                    <div className="space-y-2">
                      {selectedWorker.documents.map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                          <div>
                            <p className="font-semibold text-slate-900 capitalize text-sm">{doc.documentType.replace("_", " ")}</p>
                            <p className="text-xs text-slate-500 font-mono">No: {doc.documentNumber || "N/A"} • Status: {doc.status}</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            doc.status === "verified" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                          }`}>
                            {doc.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                      No documents uploaded yet for this worker.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedWorker(null)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
