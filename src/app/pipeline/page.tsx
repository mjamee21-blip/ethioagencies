"use client";

import React, { useState, useEffect } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { Kanban, Plus, User, ArrowRight, ShieldCheck, X, CheckCircle2 } from "lucide-react";

interface PipelineCandidate {
  id: string;
  workerName: string;
  passport: string;
  stage: string;
  orderNumber: string;
  date: string;
}

export default function PipelinePage() {
  const [candidates, setCandidates] = useState<PipelineCandidate[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [workers, setWorkers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");

  const stages = [
    { key: "nominated", label: "Step 1: Nominated" },
    { key: "medical", label: "Step 2: GAMCA Medical" },
    { key: "musaned", label: "Step 3: Musaned Contract" },
    { key: "visa", label: "Step 4: Enjaz Visa Stamping" },
    { key: "deployed", label: "Step 5: Deployed (Saudi Arabia)" },
  ];

  useEffect(() => {
    const saved = localStorage.getItem("agency_pipeline");
    const savedWorkers = localStorage.getItem("agency_workers");
    const savedOrders = localStorage.getItem("agency_orders");

    if (saved) {
      try {
        setCandidates(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    } else {
      const initial: PipelineCandidate[] = [
        {
          id: "P-1",
          workerName: "Fatima Ahmed",
          passport: "EP9821034",
          stage: "visa",
          orderNumber: "ORD-501",
          date: "2026-08-10",
        },
        {
          id: "P-2",
          workerName: "Tigist Mekonnen",
          passport: "EP4452910",
          stage: "medical",
          orderNumber: "ORD-502",
          date: "2026-08-15",
        },
      ];
      setCandidates(initial);
      localStorage.setItem("agency_pipeline", JSON.stringify(initial));
    }

    if (savedWorkers) {
      try {
        setWorkers(JSON.parse(savedWorkers));
      } catch (e) {}
    }
    if (savedOrders) {
      try {
        setOrders(JSON.parse(savedOrders));
      } catch (e) {}
    }
  }, []);

  const saveCandidates = (updated: PipelineCandidate[]) => {
    setCandidates(updated);
    localStorage.setItem("agency_pipeline", JSON.stringify(updated));
  };

  const handleMove = (id: string, nextStage: string) => {
    const updated = candidates.map((c) => (c.id === id ? { ...c, stage: nextStage } : c));
    saveCandidates(updated);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const worker = workers.find((w) => w.id === selectedWorkerId);
    const order = orders.find((o) => o.id === selectedOrderId);
    if (!worker || !order) {
      alert("Please select both a candidate and an order.");
      return;
    }
    const newCandidate: PipelineCandidate = {
      id: `P-${Math.floor(100 + Math.random() * 900)}`,
      workerName: `${worker.firstName} ${worker.lastName}`,
      passport: worker.passportNumber,
      stage: "nominated",
      orderNumber: order.orderNumber,
      date: new Date().toISOString().split("T")[0],
    };
    const updated = [newCandidate, ...candidates];
    saveCandidates(updated);
    setShowAddModal(false);
    setSelectedWorkerId("");
    setSelectedOrderId("");
  };

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Kanban className="w-7 h-7 text-indigo-600" /> Saudi Recruitment Kanban Pipeline
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Track candidates from initial nomination through GAMCA medical, Musaned contract, Enjaz visa, to final deployment.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all text-sm"
          >
            <Plus className="w-4 h-4" /> Assign Candidate to Pipeline
          </button>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => {
            const list = candidates.filter((c) => c.stage === stage.key);
            return (
              <div key={stage.key} className="bg-slate-100/80 rounded-2xl p-4 flex flex-col min-w-[260px] border border-slate-200">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">{stage.label}</h3>
                  <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-bold">
                    {list.length}
                  </span>
                </div>
                <div className="space-y-3 flex-1">
                  {list.map((c) => (
                    <div key={c.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-2 hover:shadow-md transition-shadow">
                      <div className="font-bold text-slate-900 text-sm">{c.workerName}</div>
                      <div className="text-xs font-mono text-slate-500">Passport: {c.passport}</div>
                      <div className="text-xs font-medium text-indigo-600">Order: {c.orderNumber}</div>
                      
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">{c.date}</span>
                        <div className="flex gap-1">
                          {stage.key !== "deployed" && (
                            <button
                              onClick={() => {
                                const nextMap: any = { nominated: "medical", medical: "musaned", musaned: "visa", visa: "deployed" };
                                handleMove(c.id, nextMap[stage.key]);
                              }}
                              className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-2 py-1 rounded-lg font-medium flex items-center gap-1"
                            >
                              Next <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900">Assign Candidate to Order</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAdd} className="space-y-4 text-sm">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Select Candidate</label>
                  <select
                    required
                    value={selectedWorkerId}
                    onChange={(e) => setSelectedWorkerId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                  >
                    <option value="">Select Candidate...</option>
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.firstName} {w.lastName} ({w.passportNumber})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Select Recruitment Order</label>
                  <select
                    required
                    value={selectedOrderId}
                    onChange={(e) => setSelectedOrderId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                  >
                    <option value="">Select Order / Wakala...</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.orderNumber} - {o.clientName} ({o.position})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md shadow-indigo-600/20"
                  >
                    Add to Pipeline
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
