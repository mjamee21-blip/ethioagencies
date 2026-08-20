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
  Eye,
  UserPlus
} from "lucide-react";

interface ClientStaff {
  id: string;
  name: string;
  email: string;
  role: "Company HR Manager" | "Visa / PRO Officer" | "Branch Viewer";
}

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
  staffMembers: ClientStaff[];
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showPortalModal, setShowPortalModal] = useState(false);
  
  // Client Staff modal state inside portal
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: "", email: "", role: "Visa / PRO Officer" as const });

  const [form, setForm] = useState({
    companyName: "",
    crNumber: "",
    nitaqatStatus: "Platinum",
    contactPerson: "",
    phone: "",
    city: "Riyadh",
  });

  useEffect(() => {
    const saved = localStorage.getItem("agency_clients_v2");
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
          staffMembers: [
            { id: "S-1", name: "Ahmed Al-Mutairi", email: "ahmed@riyadh-elite.sa", role: "Company HR Manager" },
            { id: "S-2", name: "Sultan Al-Otaibi", email: "sultan@riyadh-elite.sa", role: "Visa / PRO Officer" },
          ],
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
          staffMembers: [
            { id: "S-3", name: "Faisal Al-Ghamdi", email: "faisal@jeddah-hosp.sa", role: "Company HR Manager" },
          ],
        },
      ];
      setClients(initial);
      localStorage.setItem("agency_clients_v2", JSON.stringify(initial));
    }
  }, []);

  const saveClients = (updated: Client[]) => {
    setClients(updated);
    localStorage.setItem("agency_clients_v2", JSON.stringify(updated));
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
      staffMembers: [
        { id: `S-${Date.now()}`, name: form.contactPerson, email: `contact@${form.companyName.toLowerCase().replace(/\s+/g, '')}.sa`, role: "Company HR Manager" }
      ],
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

  const handleAddClientStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !newStaff.name || !newStaff.email) return;
    const updatedStaffMember: ClientStaff = {
      id: `S-${Date.now()}`,
      ...newStaff,
    };
    const updatedClients = clients.map((c) => {
      if (c.id === selectedClient.id) {
        const updatedC = { ...c, staffMembers: [...c.staffMembers, updatedStaffMember] };
        setSelectedClient(updatedC);
        return updatedC;
      }
      return c;
    });
    saveClients(updatedClients);
    setNewStaff({ name: "", email: "", role: "Visa / PRO Officer" });
    setShowAddStaffModal(false);
  };

  const handleDeleteClientStaff = (staffId: string) => {
    if (!selectedClient) return;
    const updatedClients = clients.map((c) => {
      if (c.id === selectedClient.id) {
        const updatedC = { ...c, staffMembers: c.staffMembers.filter((s) => s.id !== staffId) };
        setSelectedClient(updatedC);
        return updatedC;
      }
      return c;
    });
    saveClients(updatedClients);
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
              <Building2 className="w-7 h-7 text-indigo-600" /> Saudi Employers & Client Portal with RBAC
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage Saudi sponsors, CR verification, and allow employers to manage their own staff and agents with specific permissions.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-2xl shadow-lg shadow-indigo-600/30 transition-all text-sm"
          >
            <Plus className="w-4 h-4" /> Add Saudi Employer
          </button>
        </div>

        {/* Search */}
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
                    <span className="text-slate-400 block font-medium">Company Staff</span>
                    <span className="font-bold text-emerald-600">{c.staffMembers.length} Agents</span>
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
                  <Eye className="w-3.5 h-3.5" /> Employer Portal & Staff RBAC
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

        {/* Live Employer Portal & Staff Management Modal */}
        {showPortalModal && selectedClient && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-4xl w-full p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5" /> Saudi Employer Portal & Sub-Agent Permissions
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

              {/* Employer's Staff & Agents RBAC */}
              <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Sponsor Staff & Agent Permissions</h4>
                    <p className="text-xs text-slate-500">Saudi employer can add HR managers, visa officers, and agents with specific permissions.</p>
                  </div>
                  <button
                    onClick={() => setShowAddStaffModal(true)}
                    className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-indigo-600/20"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Add Company Agent
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/80 text-slate-600 font-bold uppercase border-b border-slate-200">
                        <th className="p-3">Staff Name</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Role / Permission</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedClient.staffMembers.map((st) => (
                        <tr key={st.id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-900">{st.name}</td>
                          <td className="p-3 text-slate-600">{st.email}</td>
                          <td className="p-3">
                            <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-bold">
                              {st.role}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDeleteClientStaff(st.id)}
                              className="text-slate-400 hover:text-red-600 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setShowPortalModal(false)}
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/30"
                >
                  Close Portal View
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Client Staff Modal */}
        {showAddStaffModal && selectedClient && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-slate-900">Add Staff for {selectedClient.companyName}</h3>
                <button onClick={() => setShowAddStaffModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddClientStaff} className="space-y-4 text-sm">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Staff / Agent Name</label>
                  <input
                    type="text"
                    required
                    value={newStaff.name}
                    onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Role & Permissions</label>
                  <select
                    value={newStaff.role}
                    onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none font-medium"
                  >
                    <option value="Company HR Manager">Company HR Manager (Full access to orders & candidates)</option>
                    <option value="Visa / PRO Officer">Visa / PRO Officer (Manage Enjaz & E-Wakala blocks)</option>
                    <option value="Branch Viewer">Branch Viewer (Read-only status tracking)</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddStaffModal(false)}
                    className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/30"
                  >
                    Assign Staff Member
                  </button>
                </div>
              </form>
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
