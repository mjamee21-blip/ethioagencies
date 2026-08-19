"use client";

import React, { useState, useEffect } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { Settings, Save, CheckCircle2, Shield, Bell, Globe, Database, Cpu } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    agencyName: "Ethio-Gulf Elite Recruitment Agency",
    email: "contact@ethio-gulf.com",
    phone: "+251 11 123 4567",
    address: "Bole Road, Addis Ababa, Ethiopia",
    musanedApiToken: "musaned_live_9988372615",
    enjazApiKey: "enjaz_sa_live_4455",
    whatsappApiKey: "wa_live_ethio_98127",
    gamcaIntegration: true,
    autoCvGeneration: true,
    defaultDestination: "Saudi Arabia",
    currency: "USD ($)",
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const local = localStorage.getItem("agency_settings");
    if (local) {
      try {
        setSettings(JSON.parse(local));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("agency_settings", JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <SidebarLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Settings className="w-7 h-7 text-indigo-600" /> Agency Settings & Integrations
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Configure your agency profile, Musaned & Enjaz API connections, and automated Saudi export workflows.
            </p>
          </div>
          {saved && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-sm font-medium border border-emerald-200 shadow-sm animate-fade-in">
              <CheckCircle2 className="w-4 h-4" /> Settings Saved Successfully!
            </div>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* General Info */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-500" /> General Agency Profile
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Agency Name</label>
                <input
                  type="text"
                  value={settings.agencyName}
                  onChange={(e) => setSettings({ ...settings, agencyName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none text-sm bg-slate-50/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Official Email</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none text-sm bg-slate-50/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none text-sm bg-slate-50/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Office Address</label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none text-sm bg-slate-50/50"
                />
              </div>
            </div>
          </div>

          {/* Saudi Export & Musaned Integrations */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-500" /> Saudi Arabia Export APIs & Musaned Integration
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Musaned API Token</label>
                <input
                  type="password"
                  value={settings.musanedApiToken}
                  onChange={(e) => setSettings({ ...settings, musanedApiToken: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none text-sm bg-slate-50/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Enjaz Visa Platform API Key</label>
                <input
                  type="password"
                  value={settings.enjazApiKey}
                  onChange={(e) => setSettings({ ...settings, enjazApiKey: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none text-sm bg-slate-50/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp Notification API Key</label>
                <input
                  type="password"
                  value={settings.whatsappApiKey}
                  onChange={(e) => setSettings({ ...settings, whatsappApiKey: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none text-sm bg-slate-50/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Default Destination Country</label>
                <select
                  value={settings.defaultDestination}
                  onChange={(e) => setSettings({ ...settings, defaultDestination: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none text-sm bg-slate-50/50"
                >
                  <option value="Saudi Arabia">Saudi Arabia</option>
                  <option value="UAE">UAE (Dubai/Abu Dhabi)</option>
                  <option value="Qatar">Qatar</option>
                  <option value="Jordan">Jordan</option>
                </select>
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.gamcaIntegration}
                  onChange={(e) => setSettings({ ...settings, gamcaIntegration: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-slate-700">Enable GAMCA (Wafid) Medical Examination Auto-Sync</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoCvGeneration}
                  onChange={(e) => setSettings({ ...settings, autoCvGeneration: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-slate-700">Enable Automatic AI CV & Bio-data Generation upon Worker Registration</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-xl shadow-lg shadow-indigo-600/30 transition-all text-sm"
            >
              <Save className="w-4 h-4" /> Save Agency Settings
            </button>
          </div>
        </form>
      </div>
    </SidebarLayout>
  );
}
