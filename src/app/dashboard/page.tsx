"use client";

import React, { useEffect, useState } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { 
  Users, 
  UserCheck, 
  Briefcase, 
  Building2, 
  DollarSign, 
  AlertTriangle, 
  Activity, 
  Clock,
  ArrowUpRight,
  ShieldAlert
} from "lucide-react";
import Link from "next/link";

interface DashboardData {
  summary: {
    totalWorkers: number;
    availableWorkers: number;
    processingWorkers: number;
    deployedWorkers: number;
    activeClients: number;
    openOrders: number;
    pendingPayments: number;
    expiringDocuments: number;
    awaitingMedical: number;
    awaitingVisa: number;
  };
  pipeline: {
    nominated: number;
    shortlisted: number;
    interviewed: number;
    medical_pending: number;
    visa_processing: number;
    deployed: number;
  };
  actionRequired: Array<{
    id: string;
    title: string;
    description: string;
    severity: string;
    link: string;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </SidebarLayout>
    );
  }

  const summary = data?.summary || {
    totalWorkers: 0,
    availableWorkers: 0,
    processingWorkers: 0,
    deployedWorkers: 0,
    activeClients: 0,
    openOrders: 0,
    pendingPayments: 0,
    expiringDocuments: 0,
    awaitingMedical: 0,
    awaitingVisa: 0,
  };

  const pipeline = data?.pipeline || {
    nominated: 0,
    shortlisted: 0,
    interviewed: 0,
    medical_pending: 0,
    visa_processing: 0,
    deployed: 0,
  };

  const actionRequired = data?.actionRequired || [];

  return (
    <SidebarLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Recruitment Agency Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Overview of your agency operations, talent pool, pipeline, and urgent alerts.</p>
        </div>

        {/* Action Required Cards */}
        {actionRequired.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <ShieldAlert className="w-6 h-6 text-amber-600" />
              <h2 className="text-lg font-bold text-amber-900">Action Required Alerts</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {actionRequired.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-xl border border-amber-200/60 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">{item.title}</h3>
                    <p className="text-xs text-slate-600 mt-1">{item.description}</p>
                  </div>
                  <div className="mt-4">
                    <Link
                      href={item.link}
                      className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      Resolve now <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Workers</p>
                <h3 className="text-3xl font-black text-slate-900 mt-2">{summary.totalWorkers}</h3>
              </div>
              <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-slate-500 space-x-2">
              <span className="text-emerald-600 font-semibold">{summary.availableWorkers} available</span>
              <span>•</span>
              <span className="text-blue-600 font-semibold">{summary.processingWorkers} processing</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Clients</p>
                <h3 className="text-3xl font-black text-slate-900 mt-2">{summary.activeClients}</h3>
              </div>
              <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl">
                <Building2 className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-slate-500 space-x-2">
              <span className="text-emerald-600 font-semibold">{summary.openOrders} open orders</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Deployed Workers</p>
                <h3 className="text-3xl font-black text-slate-900 mt-2">{summary.deployedWorkers}</h3>
              </div>
              <div className="bg-purple-50 text-purple-600 p-3 rounded-xl">
                <UserCheck className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-slate-500 space-x-2">
              <span className="text-purple-600 font-semibold">Successfully placed</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Payments</p>
                <h3 className="text-3xl font-black text-slate-900 mt-2">${summary.pendingPayments.toLocaleString()}</h3>
              </div>
              <div className="bg-amber-50 text-amber-600 p-3 rounded-xl">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-slate-500 space-x-2">
              <span className="text-amber-600 font-semibold">{summary.expiringDocuments} expiring docs</span>
            </div>
          </div>
        </div>

        {/* Pipeline Summary & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900 text-lg">Recruitment Pipeline Breakdown</h3>
              <Link href="/pipeline" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                View Kanban Board →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-medium text-slate-500">Nominated</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{pipeline.nominated}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-medium text-slate-500">Shortlisted</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{pipeline.shortlisted}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-medium text-slate-500">Interviewed</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{pipeline.interviewed}</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                <p className="text-xs font-medium text-amber-700">Medical Pending</p>
                <p className="text-2xl font-black text-amber-900 mt-1">{pipeline.medical_pending}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <p className="text-xs font-medium text-blue-700">Visa Processing</p>
                <p className="text-2xl font-black text-blue-900 mt-1">{pipeline.visa_processing}</p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                <p className="text-xs font-medium text-emerald-700">Deployed</p>
                <p className="text-2xl font-black text-emerald-900 mt-1">{pipeline.deployed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-lg mb-4">Quick Operations</h3>
              <div className="space-y-3">
                <Link
                  href="/workers"
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 font-medium text-slate-700 text-sm transition-colors"
                >
                  <span>Add New Worker</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400" />
                </Link>
                <Link
                  href="/clients"
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 font-medium text-slate-700 text-sm transition-colors"
                >
                  <span>Register Client / Employer</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400" />
                </Link>
                <Link
                  href="/orders"
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 font-medium text-slate-700 text-sm transition-colors"
                >
                  <span>Create Recruitment Order</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400" />
                </Link>
              </div>
            </div>
            <div className="bg-indigo-50 p-4 rounded-xl mt-6">
              <p className="text-xs font-bold text-indigo-900">Recruitment Agency OS v1.0</p>
              <p className="text-xs text-indigo-700 mt-0.5">All multi-tenant operations active.</p>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
