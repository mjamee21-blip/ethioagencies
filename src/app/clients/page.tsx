"use client";

import React, { useState, useEffect } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { 
  Building2, 
  Plus, 
  Search, 
  Trash2, 
  ExternalLink, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  FileText, 
  X, 
  Users, 
  Plane,
  Eye
} from "lucide-react";

interface Client {
  id: string;
  companyName: string;
  crNumber: string;
  nitaqatStatus: "Platinum" | "High Green" | "Medium Green";
  contactPerson: string;
  phone: string;
  city: string;
  activeOrders: number;
  deployedCandidates: number;
  portalAccessKey: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showPortalModal, setShowPortalModal] = useState(false);

  const [form, setForm] = useState({
    companyName: "",
    crNumber: "",
    nitaqatStatus: "Platinum",
    contactPerson: "",
    phone: "",
    city: "Riyadh",
  });

  useEffect(() => {
    const saved = localStorage.getItem("agency_clients");
    if (saved) {
      try {
        setClients(JSON.parse(saved));
      } catch (e) {}
    } else {
      const initial: Client[] = [
        {
          id: "CLI-101",
          companyName: "Riyadh Elite Manpower Services",
          crNumber: "1010892746",
          nitaqatStatus: "Platinum",
          contactPerson: "Sheikh Mansoor Al-Harbi",
          phone: "+966 50 123 4567",
          city: "Riyadh",
          activeOrders: 2,
          deployedCandidates: 14,
          portalAccessKey: "SA-PORTAL-RIYADH-9912",
        },
        {
          id: "CLI-102",
          companyName: "Jeddah Hospitality & Domestic Services",
          crNumber: "4030582910",
          nitaqatStatus: "High Green",
          contactPerson: "Eng. Tariq Al-Ghamdi",
          phone: "+966 55 987 6543",
          city: "Jeddah",
          activeOrders: 1,
          deployedCandidates: 8,
          portalAccessKey: "SA-PORTAL-JEDDAH-4412",
        },
        {
          id: "CLI-103",
          companyName: "Eastern Province Contracting & Staffing",
          crNumber: "2050392817",
          nitaqatStatus: "Medium Green",
          contactPerson: "Fahad Al-Dossary",
          phone: "+966 53 445 6677",
          city: "Dammam",
          activeOrders: 3,
          deployedCandidates: 22,
          portalAccessKey: "SA-PORTAL-DAMMAM-8831",
        },
      ];
      setClients(initial);
      localStorage.setItem("agency_clients", JSON.stringify(initial));
    }
  }, []);

  const saveClients = (updated: Client[]) => {
    setClients(updated);
    localStorage.setItem("agency_clients", JSON.stringify(updated));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newClient: Client = {
      id: `CLI-${Math.floor(100 + Math.random() * 900)}`,
      companyName: form.companyName,
      crNumber: form.crNumber,
      nitaqatStatus: form.nitaqatStatus as any,
      contactPerson: form.contactPerson,
      phone: form.phone,
      city: form.city,
      activeOrders: 1,
      deployedCandidates: 0,
      portalAccessKey: `SA-PORTAL-${form.city.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
    };
    const updated = [newClient, ...clients];
    saveClients(updated);
    setShowAddModal(false);
    setForm({
      companyName: "",
      crNumber: "",
      nitaqatStatus: "Platinum",
      contactPerson: "",
      phone: "",
      city: "Riyadh",
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this employer record?")) return;
    const updated = clients.filter((c) => c.id !== id);
    saveClients(updated);
    if (selectedClient?.id === id) setSelectedClient(null);
  };

  const filtered = clients.filter((c) =>
    `${c.companyName} ${c.crNumber} ${c.contactPerson} ${c.city}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <SidebarLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Building2 className="w-7 h-7 text-indigo-600" /> Saudi Employers & Client Portal
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage Saudi sponsor accounts, verified Commercial Registration (CR), Nitaqat tiers, and real-time client portals.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-2xl shadow-lg shadow-indigo-600/30 transition-all text-sm"
          >
            <Plus className="w-4 h-4" /> Add Saudi Employer
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center justify-between bg-white p-4 rounded-3xl shadow-sm border border-slate-200/80">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by company name, CR #, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-slate-50/50 font-medium"
            />
          </div>
        </div>

        {/* Client Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">{c.id}</span>
                    <h3 className="text-lg font-bold text-slate-900 mt-0.5">{c.companyName}</h3>
                    <p className="text-xs text-slate-500 font-medium">{c.city}, Kingdom of Saudi Arabia</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    c.nitaqatStatus === "Platinum" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                    c.nitaqatStatus === "High Green" ? "bg-teal-50 text-teal-700 border border-teal-200" :
                    "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}>
                    {c.nitaqatStatus}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block font-medium">CR Number</span>
                    <span className="font-mono font-bold text-slate-800">{c.crNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Contact Person</span>
                    <span className="font-bold text-slate-800">{c.contactPerson}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Active Orders</span>
                    <span className="font-bold text-indigo-600">{c.activeOrders} E-Wakalas</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Deployed</span>
                    <span className="font-bold text-emerald-600">{c.deployedCandidates} Workers</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    setSelectedClient(c);
                    setShowPortalModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-xl transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> Employer Live Portal
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="text-slate-400 hover:text-red-600 p-2 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Live Employer Portal Modal */}
        {showPortalModal && selectedClient && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-3xl w-full p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5" /> Saudi Employer Portal (Read-Only)
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mt-1">{selectedClient.companyName}</h3>
                  <p className="text-xs text-slate-500 font-mono font-medium">
                    Access Key: {selectedClient.portalAccessKey} • CR: {selectedClient.crNumber}
                  </p>
                </div>
                <button onClick={() => setShowPortalModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Candidate Journey Status Tracker for Employer */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900">Assigned Candidates & Deployment Progress</h4>
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">Fatima Ahmed</div>
                      <div className="text-xs text-slate-500 font-mono">Passport: EP9821034 • Position: Housemaid</div>
                    </div>
                    <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-200">
                      Visa Stamped (Flight Scheduled)
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">Tigist Mekonnen</div>
                      <div className="text-xs text-slate-500 font-mono">Passport: EP4452910 • Position: Caregiver</div>
                    </div>
                    <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-200">
                      Wafid Medical Cleared (Musaned Drafting)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => alert(`Client Portal URL: https://recruitment-agency-os.pages.dev/clients?portal=${selectedClient.portalAccessKey}`)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md"
                >
                  Copy Portal Share Link
                </button>
                <button
                  onClick={() => setShowPortalModal(false)}
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/30"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Employer Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-slate-900">Add Saudi Employer / Client</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4 text-sm">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Company / Sponsor Name</label>
                  <input
                    type="text"
                    required
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none font-medium"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">CR Number</label>
                    <input
                      type="text"
                      required
                      value={form.crNumber}
                      onChange={(e) => setForm({ ...form, crNumber: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none font-mono text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nitaqat Status</label>
                    <select
                      value={form.nitaqatStatus}
                      onChange={(e) => setForm({ ...form, nitaqatStatus: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none font-medium"
                    >
                      <option value="Platinum">Platinum</option>
                      <option value="High Green">High Green</option>
                      <option value="Medium Green">Medium Green</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Contact Person</label>
                    <input
                      type="text"
                      required
                      value={form.contactPerson}
                      onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">City</label>
                    <select
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none font-medium"
                    >
                      <option value="Riyadh">Riyadh</option>
                      <option value="Jeddah">Jeddah</option>
                      <option value="Dammam">Dammam</option>
                      <option value="Mecca">Mecca</option>
                      <option value="Medina">Medina</option>
                    </select>
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
                    Save Employer
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
