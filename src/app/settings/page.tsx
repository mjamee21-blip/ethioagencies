"use client";

import React, { useState, useEffect } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { 
  Settings, 
  Building, 
  Users, 
  Cpu, 
  CreditCard, 
  Save, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Shield, 
  Mail, 
  Phone, 
  MapPin, 
  Upload,
  X
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "users" | "integrations" | "billing">("profile");
  const [saved, setSaved] = useState(false);

  // Tenant Profile
  const [profile, setProfile] = useState({
    agencyName: "Ethio-Gulf Elite Recruitment Agency",
    licenseNumber: "ETH-MOLSA-2024-8892",
    email: "admin@ethio-gulf.com",
    phone: "+251 11 123 4567",
    address: "Bole Road, Mega House 4th Floor, Addis Ababa, Ethiopia",
  });

  // Users & RBAC
  const [users, setUsers] = useState([
    { id: "1", name: "Abebe Bekele", email: "abebe@ethio-gulf.com", role: "Agency Admin" },
    { id: "2", name: "Tsehay Mulugeta", email: "tsehay@ethio-gulf.com", role: "Recruiter/Processing Agent" },
    { id: "3", name: "Mohammed Al-Otaibi", email: "mohammed@ethio-gulf.com", role: "Financial Controller" },
  ]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "Recruiter/Processing Agent" });

  // System & Integrations
  const [integrations, setIntegrations] = useState({
    whatsappApiKey: "wa_live_ethio_9812739182",
    smsApiKey: "sms_sa_live_88716",
    aiOcrEnabled: true,
    musanedAutoSync: true,
  });

  // Billing & Subscription
  const [billing] = useState({
    tier: "Enterprise Multi-Tenant SaaS",
    workerQuota: "500 Workers / Month",
    activeWorkersUsed: 142,
    nextBillingDate: "2026-09-15",
    status: "Active & Verified",
  });

  useEffect(() => {
    const savedData = localStorage.getItem("agency_settings_v2");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.profile) setProfile(parsed.profile);
        if (parsed.users) setUsers(parsed.users);
        if (parsed.integrations) setIntegrations(parsed.integrations);
      } catch (e) {}
    }
  }, []);

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { profile, users, integrations };
    localStorage.setItem("agency_settings_v2", JSON.stringify(payload));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;
    const added = [...users, { id: Date.now().toString(), ...newUser }];
    setUsers(added);
    setNewUser({ name: "", email: "", role: "Recruiter/Processing Agent" });
    setShowInviteModal(false);
    localStorage.setItem("agency_settings_v2", JSON.stringify({ profile, users: added, integrations }));
  };

  const handleDeleteUser = (id: string) => {
    const updated = users.filter((u) => u.id !== id);
    setUsers(updated);
    localStorage.setItem("agency_settings_v2", JSON.stringify({ profile, users: updated, integrations }));
  };

  return (
    <SidebarLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Settings className="w-7 h-7 text-indigo-600" /> Agency Settings & Configuration
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Multi-tenant agency profile, RBAC staff permissions, AI & WhatsApp integrations, and subscription billing.
            </p>
          </div>
          {saved && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-sm font-medium border border-emerald-200 shadow-sm animate-fade-in">
              <CheckCircle2 className="w-4 h-4" /> Changes Saved Successfully!
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 border-b border-slate-200 pb-px">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 px-5 py-3 rounded-t-xl font-semibold text-sm transition-colors border-b-2 ${
              activeTab === "profile"
                ? "border-indigo-600 text-indigo-600 bg-white shadow-sm"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Building className="w-4 h-4" /> Agency Profile
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-5 py-3 rounded-t-xl font-semibold text-sm transition-colors border-b-2 ${
              activeTab === "users"
                ? "border-indigo-600 text-indigo-600 bg-white shadow-sm"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Users className="w-4 h-4" /> Users & RBAC
          </button>
          <button
            onClick={() => setActiveTab("integrations")}
            className={`flex items-center gap-2 px-5 py-3 rounded-t-xl font-semibold text-sm transition-colors border-b-2 ${
              activeTab === "integrations"
                ? "border-indigo-600 text-indigo-600 bg-white shadow-sm"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Cpu className="w-4 h-4" /> System & Integrations
          </button>
          <button
            onClick={() => setActiveTab("billing")}
            className={`flex items-center gap-2 px-5 py-3 rounded-t-xl font-semibold text-sm transition-colors border-b-2 ${
              activeTab === "billing"
                ? "border-indigo-600 text-indigo-600 bg-white shadow-sm"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <CreditCard className="w-4 h-4" /> Billing & Subscription
          </button>
        </div>

        <form onSubmit={handleSaveAll} className="space-y-6">
          {/* Tab 1: Agency Profile */}
          {activeTab === "profile" && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6 animate-fade-in">
              <h2 className="text-lg font-bold text-slate-900">Tenant Agency Profile</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Agency Name</label>
                  <input
                    type="text"
                    value={profile.agencyName}
                    onChange={(e) => setProfile({ ...profile, agencyName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none bg-slate-50/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Official License Number (MOLSA)</label>
                  <input
                    type="text"
                    value={profile.licenseNumber}
                    onChange={(e) => setProfile({ ...profile, licenseNumber: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none bg-slate-50/50 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Support Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none bg-slate-50/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none bg-slate-50/50"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Office Address</label>
                  <input
                    type="text"
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none bg-slate-50/50"
                  />
                </div>
                <div className="md:col-span-2 border-t border-slate-100 pt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Agency Logo Upload</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center font-black text-indigo-600 text-xl">
                      RA
                    </div>
                    <label className="cursor-pointer inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
                      <Upload className="w-4 h-4" /> Upload New Logo
                      <input type="file" className="hidden" accept="image/*" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Users & Role Management (RBAC) */}
          {activeTab === "users" && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Staff Members & Role-Based Access Control (RBAC)</h2>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(true)}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-xl text-sm shadow-md shadow-indigo-600/20"
                >
                  <Plus className="w-4 h-4" /> Invite User
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                      <th className="p-4">Name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Assigned Role</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-semibold text-slate-900">{u.name}</td>
                        <td className="p-4 text-slate-600">{u.email}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            u.role === "Agency Admin" ? "bg-purple-50 text-purple-700 border border-purple-200" :
                            u.role === "Financial Controller" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                            "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id)}
                            className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg"
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
          )}

          {/* Tab 3: System & Integrations */}
          {activeTab === "integrations" && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6 animate-fade-in">
              <h2 className="text-lg font-bold text-slate-900">Notifications & AI Automation Integrations</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp Notification API Key</label>
                  <input
                    type="password"
                    value={integrations.whatsappApiKey}
                    onChange={(e) => setIntegrations({ ...integrations, whatsappApiKey: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-600 outline-none bg-slate-50/50"
                  />
                  <p className="text-xs text-slate-400 mt-1">Used for automated candidate interview reminders and flight departure alerts.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">SMS Gateway API Key</label>
                  <input
                    type="password"
                    value={integrations.smsApiKey}
                    onChange={(e) => setIntegrations({ ...integrations, smsApiKey: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-600 outline-none bg-slate-50/50"
                  />
                </div>
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={integrations.aiOcrEnabled}
                      onChange={(e) => setIntegrations({ ...integrations, aiOcrEnabled: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-slate-700">Enable AI OCR Passport Scanning & Auto-Fill</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={integrations.musanedAutoSync}
                      onChange={(e) => setIntegrations({ ...integrations, musanedAutoSync: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-slate-700">Enable Musaned & Enjaz Status Auto-Polling</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Billing & Subscription */}
          {activeTab === "billing" && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6 animate-fade-in">
              <h2 className="text-lg font-bold text-slate-900">SaaS Subscription & Quota Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-100 space-y-2">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Current Plan</span>
                  <div className="text-xl font-black text-slate-900">{billing.tier}</div>
                  <div className="text-xs text-slate-600">Status: <span className="font-semibold text-emerald-600">{billing.status}</span></div>
                </div>
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Worker Quota Utilization</span>
                  <div className="text-xl font-black text-slate-900">{billing.activeWorkersUsed} / 500 Used</div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: "28%" }}></div>
                  </div>
                  <div className="text-xs text-slate-500 text-right">Next billing date: {billing.nextBillingDate}</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-xl shadow-lg shadow-indigo-600/30 text-sm transition-all"
            >
              <Save className="w-4 h-4" /> Save All Changes
            </button>
          </div>
        </form>

        {/* Invite User Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900">Invite Staff Member</h3>
                <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleInviteUser} className="space-y-4 text-sm">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Assigned Role (RBAC)</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                  >
                    <option value="Agency Admin">Agency Admin</option>
                    <option value="Recruiter/Processing Agent">Recruiter/Processing Agent</option>
                    <option value="Financial Controller">Financial Controller</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md shadow-indigo-600/20"
                  >
                    Send Invitation
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
