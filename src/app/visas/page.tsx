"use client";

import React, { useState, useEffect } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { 
  FileText, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Fingerprint, 
  Building, 
  Search, 
  Plus, 
  Trash2,
  Plane,
  X
} from "lucide-react";

interface VisaAppointment {
  id: string;
  workerName: string;
  passportNumber: string;
  visaBlockNumber: string;
  enjazApplicationNumber: string;
  tasheelAppointmentDate: string;
  embassySubmissionDate: string;
  status: "Biometrics Completed" | "Scheduled at VFS Tasheel" | "Visa Stamped" | "Pending Medical";
}

export default function VisasPage() {
  const [appointments, setAppointments] = useState<VisaAppointment[]>([]);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const [form, setForm] = useState({
    workerName: "Fatima Ahmed",
    passportNumber: "EP9821034",
    visaBlockNumber: "1309827165",
    enjazApplicationNumber: "E-88912739",
    tasheelAppointmentDate: "2026-08-28",
    embassySubmissionDate: "2026-09-02",
    status: "Scheduled at VFS Tasheel",
  });

  useEffect(() => {
    const saved = localStorage.getItem("agency_visas");
    if (saved) {
      try {
        setAppointments(JSON.parse(saved));
      } catch (e) {}
    } else {
      const initial: VisaAppointment[] = [
        {
          id: "VFS-101",
          workerName: "Fatima Ahmed",
          passportNumber: "EP9821034",
          visaBlockNumber: "1309827165",
          enjazApplicationNumber: "E-88912739",
          tasheelAppointmentDate: "2026-08-28",
          embassySubmissionDate: "2026-09-02",
          status: "Visa Stamped",
        },
        {
          id: "VFS-102",
          workerName: "Tigist Mekonnen",
          passportNumber: "EP4452910",
          visaBlockNumber: "1309827165",
          enjazApplicationNumber: "E-44519283",
          tasheelAppointmentDate: "2026-09-05",
          embassySubmissionDate: "2026-09-10",
          status: "Scheduled at VFS Tasheel",
        },
      ];
      setAppointments(initial);
      localStorage.setItem("agency_visas", JSON.stringify(initial));
    }
  }, []);

  const saveAppointments = (updated: VisaAppointment[]) => {
    setAppointments(updated);
    localStorage.setItem("agency_visas", JSON.stringify(updated));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newA: VisaAppointment = {
      id: `VFS-${Math.floor(100 + Math.random() * 900)}`,
      workerName: form.workerName,
      passportNumber: form.passportNumber,
      visaBlockNumber: form.visaBlockNumber,
      enjazApplicationNumber: form.enjazApplicationNumber,
      tasheelAppointmentDate: form.tasheelAppointmentDate,
      embassySubmissionDate: form.embassySubmissionDate,
      status: form.status as any,
    };
    const updated = [newA, ...appointments];
    saveAppointments(updated);
    setShowAddModal(false);
  };

  const handleDelete = (id: string) => {
    const updated = appointments.filter((a) => a.id !== id);
    saveAppointments(updated);
  };

  const filtered = appointments.filter((a) =>
    `${a.workerName} ${a.passportNumber} ${a.enjazApplicationNumber} ${a.visaBlockNumber}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <SidebarLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Fingerprint className="w-7 h-7 text-indigo-600" /> VFS Tasheel Biometrics & Saudi Visa Tracker
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage Enjaz application numbers, VFS Tasheel fingerprinting appointments, and Saudi Embassy visa stamping schedules.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-2xl shadow-lg shadow-indigo-600/30 transition-all text-sm"
          >
            <Plus className="w-4 h-4" /> Book Biometrics Appointment
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center justify-between bg-white p-4 rounded-3xl shadow-sm border border-slate-200/80">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate, passport, Enjaz #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-slate-50/50 font-medium"
            />
          </div>
        </div>

        {/* Visa Table */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 overflow-hidden space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                  <th className="p-4">Candidate</th>
                  <th className="p-4">Enjaz App #</th>
                  <th className="p-4">Visa Block #</th>
                  <th className="p-4">VFS Tasheel Biometrics</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/50">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{a.workerName}</div>
                      <div className="text-xs text-slate-500 font-mono">Passport: {a.passportNumber}</div>
                    </td>
                    <td className="p-4 font-mono font-bold text-indigo-600">{a.enjazApplicationNumber}</td>
                    <td className="p-4 font-mono text-slate-700">{a.visaBlockNumber}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" /> {a.tasheelAppointmentDate}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Embassy Target: {a.embassySubmissionDate}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        a.status === "Visa Stamped" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                        a.status === "Biometrics Completed" ? "bg-indigo-50 text-indigo-700 border border-indigo-200" :
                        "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(a.id)}
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

        {/* Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-slate-900">Schedule VFS Tasheel Biometrics</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4 text-sm">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Candidate Name</label>
                  <input
                    type="text"
                    required
                    value={form.workerName}
                    onChange={(e) => setForm({ ...form, workerName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none font-medium"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Enjaz App Number</label>
                    <input
                      type="text"
                      required
                      value={form.enjazApplicationNumber}
                      onChange={(e) => setForm({ ...form, enjazApplicationNumber: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none font-mono text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Visa Block Number</label>
                    <input
                      type="text"
                      required
                      value={form.visaBlockNumber}
                      onChange={(e) => setForm({ ...form, visaBlockNumber: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none font-mono text-xs font-bold"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">VFS Appointment Date</label>
                    <input
                      type="date"
                      required
                      value={form.tasheelAppointmentDate}
                      onChange={(e) => setForm({ ...form, tasheelAppointmentDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Embassy Target Date</label>
                    <input
                      type="date"
                      required
                      value={form.embassySubmissionDate}
                      onChange={(e) => setForm({ ...form, embassySubmissionDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none font-medium"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/30"
                  >
                    Save Appointment
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
