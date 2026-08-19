"use client";

import React, { useState, useEffect } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { 
  Users, 
  Briefcase, 
  Building2, 
  DollarSign, 
  AlertTriangle, 
  Activity, 
  ArrowUpRight,
  ShieldAlert,
  CheckCircle2,
  FileText,
  Plane,
  Award
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
    setClientsCount(3);
  }, []);

  return (
    <SidebarLayout>
      <div className="space-y-8">
        <div className="border-b border-slate-200 pb-5">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Saudi Recruitment Agency OS Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">End-to-end manpower export lifecycle management for Saudi Arabia.</p>
        </div>

        {/* Urgent Alerts & Compliance Card */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <ShieldAlert className="w-6 h-6 text-amber-600" />
            <h2 className="text-lg font-bold text-amber-900">Urgent Alerts & Compliance</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-amber-200/60 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Document Expirations</span>
                <p className="text-sm font-semibold text-slate-900 mt-1">2 Candidate Passports expiring within 60 days</p>
              </div>
              <Link href="/workers" className="text-xs font-semibold text-indigo-600 hover:underline">
                Review <ArrowUpRight className="w-3.5 h-3.5 inline" />
              </Link>
            </div>
            <div className="bg-white p-4 rounded-xl border border-amber-200/60 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-red-700 uppercase tracking-wider">Visa / Embassy Status</span>
                <p className="text-sm font-semibold text-slate-900 mt-1">1 Enjaz Visa application requires medical re-check</p>
              </div>
              <Link href="/pipeline" className="text-xs font-semibold text-indigo-600 hover:underline">
                View <ArrowUpRight className="w-3.5 h-3.5 inline" />
              </Link>
            </div>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Candidates</p>
                <h3 className="text-3xl font-black text-slate-900 mt-2">{workersCount}</h3>
              </div>
              <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 text-xs text-emerald-600 font-semibold">
              {availableCount} available in talent pool
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">E-Wakala / Job Orders</p>
                <h3 className="text-3xl font-black text-slate-900 mt-2">{ordersCount}</h3>
              </div>
              <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl">
                <Briefcase className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 text-xs text-indigo-600 font-semibold">
              Active Saudi visa blocks
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Saudi Employers</p>
                <h3 className="text-3xl font-black text-slate-900 mt-2">{clientsCount}</h3>
              </div>
              <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl">
                <Building2 className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 text-xs text-indigo-600 font-semibold">
              Verified partner agencies
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Revenue</p>
                <h3 className="text-3xl font-black text-slate-900 mt-2">$24,500</h3>
              </div>
              <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 text-xs text-emerald-600 font-semibold">
              Musaned service contracts
            </div>
          </div>
        </div>

        {/* Saudi Recruitment Pipeline Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" /> Saudi Export Pipeline Breakdown
            </h3>
            <Link href="/pipeline" className="text-xs font-semibold text-indigo-600 hover:underline">
              Open Kanban Board &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-xs text-slate-500 font-medium block">Sourcing</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">12</span>
            </div>
            <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 text-center">
              <span className="text-xs text-indigo-700 font-medium block">Wafid Medical</span>
              <span className="text-2xl font-black text-indigo-900 mt-1 block">5</span>
            </div>
            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100 text-center">
              <span className="text-xs text-amber-700 font-medium block">Musadaqa</span>
              <span className="text-2xl font-black text-amber-900 mt-1 block">3</span>
            </div>
            <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 text-center">
              <span className="text-xs text-purple-700 font-medium block">Enjaz / VFS</span>
              <span className="text-2xl font-black text-purple-900 mt-1 block">4</span>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 text-center">
              <span className="text-xs text-emerald-700 font-medium block">Flight Booked</span>
              <span className="text-2xl font-black text-emerald-900 mt-1 block">2</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 text-white text-center">
              <span className="text-xs text-slate-300 font-medium block">90-Day Guarantee</span>
              <span className="text-2xl font-black text-white mt-1 block">18</span>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
