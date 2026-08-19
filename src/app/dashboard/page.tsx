"use client";

import React, { useState, useEffect } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { 
  Users, 
  Briefcase, 
  Building2, 
  DollarSign, 
  Activity, 
  ArrowUpRight,
  ShieldAlert,
  CheckCircle2,
  FileText,
  Plane,
  Award,
  TrendingUp,
  Globe,
  Sparkles
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [workersCount, setWorkersCount] = useState(0);
  const [availableCount, setAvailableCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [clientsCount, setClientsCount] = useState(0);

  useEffect(() => {
    const w = localStorage.getItem("agency_workers");
    const o = localStorage.getItem("agency_orders");
    if (w) {
      try {
        const parsed = JSON.parse(w);
        setWorkersCount(parsed.length);
        setAvailableCount(parsed.filter((x: any) => x.status === "Available").length);
      } catch (e) {}
    }
    if (o) {
      try {
        const parsed = JSON.parse(o);
        setOrdersCount(parsed.length);
      } catch (e) {}
    }
    setClientsCount(4);
  }, []);

  return (
    <SidebarLayout>
      <div className="space-y-8 pb-12">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-indigo-900/50">
          <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="space-y-2 z-10">
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 px-3.5 py-1 rounded-full text-xs font-bold border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5" /> Saudi Arabia Manpower Export OS v2.5
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">Agency Operations Hub</h1>
            <p className="text-slate-300 text-sm max-w-xl">
              Real-time multi-tenant monitoring of candidate assessments, Musaned contracts, Wafid medical checks, Enjaz visa status, and financial ledgers.
            </p>
          </div>
          <div className="flex items-center gap-3 z-10">
            <Link
              href="/workers"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-indigo-600/30 transition-all text-sm inline-flex items-center gap-2"
            >
              <Users className="w-4 h-4" /> Manage Candidates
            </Link>
            <Link
              href="/pipeline"
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-2xl backdrop-blur-md transition-all text-sm border border-white/10 inline-flex items-center gap-2"
            >
              <Activity className="w-4 h-4" /> Kanban Pipeline
            </Link>
          </div>
        </div>

        {/* Urgent Alerts & Compliance Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Urgent Compliance & Expiration Alerts</h2>
              <p className="text-xs text-slate-500">Action items requiring immediate recruitment officer intervention</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 flex items-center justify-between transition-all hover:border-indigo-300">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">Passport Expiry</span>
                <p className="text-sm font-bold text-slate-900">2 Candidate Passports expiring within 60 days</p>
              </div>
              <Link href="/workers" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3.5 py-2 rounded-xl transition-colors">
                Review &rarr;
              </Link>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 flex items-center justify-between transition-all hover:border-indigo-300">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">Visa / Embassy</span>
                <p className="text-sm font-bold text-slate-900">1 Enjaz Visa application requires medical re-check</p>
              </div>
              <Link href="/pipeline" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3.5 py-2 rounded-xl transition-colors">
                Resolve &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">Total Candidates</p>
                <h3 className="text-3xl font-black text-slate-900 mt-2">{workersCount}</h3>
              </div>
              <div className="bg-indigo-50 text-indigo-600 p-4 rounded-2xl">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
              <CheckCircle2 className="w-4 h-4" /> {availableCount} ready for deployment
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">E-Wakala / Orders</p>
                <h3 className="text-3xl font-black text-slate-900 mt-2">{ordersCount}</h3>
              </div>
              <div className="bg-indigo-50 text-indigo-600 p-4 rounded-2xl">
                <Briefcase className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
              <Globe className="w-4 h-4" /> Active Saudi visa blocks
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">Saudi Employers</p>
                <h3 className="text-3xl font-black text-slate-900 mt-2">{clientsCount}</h3>
              </div>
              <div className="bg-indigo-50 text-indigo-600 p-4 rounded-2xl">
                <Building2 className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
              <Award className="w-4 h-4" /> Verified partner agencies
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">Pending Revenue</p>
                <h3 className="text-3xl font-black text-slate-900 mt-2">$28,400</h3>
              </div>
              <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
              <TrendingUp className="w-4 h-4" /> Musaned contracts secured
            </div>
          </div>
        </div>

        {/* Saudi Recruitment Pipeline Breakdown */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" /> Saudi Export Pipeline Breakdown
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Live candidate progression across the 6 core export milestones</p>
            </div>
            <Link 
              href="/pipeline" 
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-colors inline-flex items-center gap-1.5"
            >
              Open Kanban Board &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/60 text-center">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Sourcing</span>
              <span className="text-3xl font-black text-slate-900 mt-2 block">12</span>
            </div>
            <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-center">
              <span className="text-xs text-indigo-700 font-bold uppercase tracking-wider block">Wafid Medical</span>
              <span className="text-3xl font-black text-indigo-900 mt-2 block">5</span>
            </div>
            <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-100 text-center">
              <span className="text-xs text-amber-700 font-bold uppercase tracking-wider block">Musadaqa</span>
              <span className="text-3xl font-black text-amber-900 mt-2 block">3</span>
            </div>
            <div className="p-5 rounded-2xl bg-purple-50/60 border border-purple-100 text-center">
              <span className="text-xs text-purple-700 font-bold uppercase tracking-wider block">Enjaz / VFS</span>
              <span className="text-3xl font-black text-purple-900 mt-2 block">4</span>
            </div>
            <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-center">
              <span className="text-xs text-emerald-700 font-bold uppercase tracking-wider block">Flight Booked</span>
              <span className="text-3xl font-black text-emerald-900 mt-2 block">2</span>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900 text-white text-center shadow-lg shadow-slate-900/10">
              <span className="text-xs text-slate-300 font-bold uppercase tracking-wider block">90-Day Guarantee</span>
              <span className="text-3xl font-black text-white mt-2 block">18</span>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
