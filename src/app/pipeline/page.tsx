"use client";

import React, { useEffect, useState } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { Kanban, Plus, User, ArrowRight, ShieldCheck, X } from "lucide-react";

interface PipelineStages {
  nominated: any[];
  shortlisted: any[];
  interviewed: any[];
  medical_pending: any[];
  visa_processing: any[];
  deployed: any[];
  rejected: any[];
}

export default function PipelinePage() {
  const [stages, setStages] = useState<PipelineStages>({
    nominated: [],
    shortlisted: [],
    interviewed: [],
    medical_pending: [],
    visa_processing: [],
    deployed: [],
    rejected: [],
  });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [workers, setWorkers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");

  const fetchPipeline = async () => {
    try {
      const res = await fetch("/api/pipeline");
      const data = await res.json();
      if (data.stages) {
        setStages(data.stages);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchFormData = async () => {
    try {
      const [wRes, oRes] = await Promise.all([
        fetch("/api/workers?status=available"),
        fetch("/api/recruitment-orders?status=open"),
      ]);
      const wData = await wRes.json();
      const oData = await oRes.json();
      setWorkers(wData.workers || []);
      setOrders(oData.orders || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPipeline();
    fetchFormData();
  }, []);

  const handleMoveStage = async (candidateId: number, newStatus: string) => {
    try {
      const res = await fetch("/api/pipeline", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId, status: newStatus }),
      });
      if (res.ok) {
        fetchPipeline();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddToPipeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkerId || !selectedOrderId) {
      alert("Please select both a worker and an order");
      return;
    }
    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerId: parseInt(selectedWorkerId, 10),
          orderId: parseInt(selectedOrderId, 10),
          status: "nominated",
        }),
      });
      if (res.ok) {
        setShowAddModal(false);
        setSelectedWorkerId("");
        setSelectedOrderId("");
        fetchPipeline();
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to add candidate to pipeline");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const stageConfigs = [
    { key: "nominated", title: "Nominated", color: "bg-slate-100 text-slate-800 border-slate-200" },
    { key: "shortlisted", title: "Shortlisted", color: "bg-indigo-50 text-indigo-800 border-indigo-200" },
    { key: "interviewed", title: "Interviewed", color: "bg-purple-50 text-purple-800 border-purple-200" },
    { key: "medical_pending", title: "Medical Pending", color: "bg-amber-50 text-amber-800 border-amber-200" },
    { key: "visa_processing", title: "Visa Processing", color: "bg-blue-50 text-blue-800 border-blue-200" },
    { key: "deployed", title: "Deployed", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  ];

  const nextStageMap: Record<string, string> = {
    nominated: "shortlisted",
    shortlisted: "interviewed",
    interviewed: "medical_pending",
    medical_pending: "visa_processing",
    visa_processing: "deployed",
  };

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Recruitment Pipeline Kanban</h1>
            <p className="text-sm text-slate-500 mt-1">Track candidate progress from nomination through medical, visa, and deployment.</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/25 transition-all text-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> Nominate Candidate
          </button>
        </div>

        {/* Kanban Columns */}
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading pipeline board...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
            {stageConfigs.map((stage) => {
              const stageCandidates = (stages as any)[stage.key] || [];
              const nextStage = nextStageMap[stage.key];

              return (
                <div key={stage.key} className="bg-slate-100/70 rounded-2xl p-4 border border-slate-200/80 flex flex-col min-w-[260px]">
                  <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center justify-between mb-3 ${stage.color}`}>
                    <span>{stage.title}</span>
                    <span className="bg-white px-2 py-0.5 rounded-md text-slate-900 shadow-xs">
                      {stageCandidates.length}
                    </span>
                  </div>

                  <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)]">
                    {stageCandidates.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-400 italic bg-white/50 rounded-xl border border-dashed border-slate-200">
                        No candidates
                      </div>
                    ) : (
                      stageCandidates.map((cand: any) => (
                        <div key={cand.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                          <div>
                            <p className="font-bold text-slate-900 text-sm">
                              {cand.workerFirstName} {cand.workerLastName}
                            </p>
                            <p className="text-xs text-slate-500 font-mono">Pass: {cand.workerPassport}</p>
                          </div>
                          <div className="text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <span className="font-semibold text-slate-700">Order:</span> {cand.orderNumber} ({cand.clientName})
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <button
                              onClick={() => handleMoveStage(cand.id, "rejected")}
                              className="text-xs text-red-600 hover:text-red-800 font-semibold"
                            >
                              Reject
                            </button>
                            {nextStage && (
                              <button
                                onClick={() => handleMoveStage(cand.id, nextStage)}
                                className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded-lg"
                              >
                                Move <ArrowRight className="w-3 h-3 ml-1" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Candidate Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900">Nominate Worker to Pipeline</h2>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddToPipeline} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select Available Worker *</label>
                  <select
                    required
                    value={selectedWorkerId}
                    onChange={(e) => setSelectedWorkerId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium text-slate-700"
                  >
                    <option value="">Choose worker...</option>
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.firstName} {w.lastName} ({w.passportNumber})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select Open Recruitment Order *</label>
                  <select
                    required
                    value={selectedOrderId}
                    onChange={(e) => setSelectedOrderId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium text-slate-700"
                  >
                    <option value="">Choose order...</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.orderNumber} - {o.position} ({o.clientName})
                      </option>
                    ))}
                  </select>
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
                    Nominate
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
