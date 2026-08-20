"use client";

import React, { useState, useEffect } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Trash2, 
  Edit, 
  Award, 
  Plane, 
  ShieldCheck,
  Sparkles,
  Download,
  Video,
  Mic,
  Volume2,
  FileSpreadsheet
} from "lucide-react";

interface Worker {
  id: string;
  firstName: string;
  lastName: string;
  nationality: string;
  passportNumber: string;
  passportExpiryDate: string;
  phone: string;
  gender: string;
  status: string;
  skills: string[];
  experienceYears: number;
  arabicLevel: string;
  cookingSkill: string;
  medicalStatus: string;
  musanedStatus: string;
  visaStatus: string;
  aiInterviewScore?: number;
  arabicFluencyScore?: number;
}

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [showCvModal, setShowCvModal] = useState(false);
  const [showAiInterviewModal, setShowAiInterviewModal] = useState(false);
  const [interviewEvaluating, setInterviewEvaluating] = useState(false);
  const [interviewResult, setInterviewResult] = useState<any | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    passportNumber: "",
    nationality: "Ethiopian",
    phone: "",
    gender: "female",
    status: "Available",
    passportExpiryDate: "2029-12-31",
    skills: "Housekeeping, Childcare, Cooking",
    experienceYears: "2",
    arabicLevel: "Intermediate",
    cookingSkill: "Arabic Cuisine & Ethiopian",
    medicalStatus: "Fit (GAMCA)",
    musanedStatus: "Ready",
    visaStatus: "Pending",
  });

  useEffect(() => {
    const saved = localStorage.getItem("agency_workers");
    if (saved) {
      try {
        setWorkers(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    } else {
      const initial: Worker[] = [
        {
          id: "W-101",
          firstName: "Fatima",
          lastName: "Ahmed",
          nationality: "Ethiopian",
          passportNumber: "EP9821034",
          passportExpiryDate: "2030-05-14",
          phone: "+251 91 123 4567",
          gender: "female",
          status: "Available",
          skills: ["Housekeeping", "Cooking", "Childcare"],
          experienceYears: 3,
          arabicLevel: "Good",
          cookingSkill: "Expert (Kabsa, Mandi, Sambusa)",
          medicalStatus: "Passed (GAMCA)",
          musanedStatus: "Contract Approved",
          visaStatus: "Stamped",
          aiInterviewScore: 92,
          arabicFluencyScore: 88,
        },
        {
          id: "W-102",
          firstName: "Tigist",
          lastName: "Mekonnen",
          nationality: "Ethiopian",
          passportNumber: "EP4452910",
          passportExpiryDate: "2029-11-20",
          phone: "+251 92 345 6789",
          gender: "female",
          status: "In Processing",
          skills: ["Cleaning", "Elderly Care"],
          experienceYears: 2,
          arabicLevel: "Basic",
          cookingSkill: "Intermediate",
          medicalStatus: "Pending",
          musanedStatus: "Draft",
          visaStatus: "Processing",
          aiInterviewScore: 84,
          arabicFluencyScore: 78,
        },
      ];
      setWorkers(initial);
      localStorage.setItem("agency_workers", JSON.stringify(initial));
    }
  }, []);

  const saveWorkers = (updated: Worker[]) => {
    setWorkers(updated);
    localStorage.setItem("agency_workers", JSON.stringify(updated));
  };

  const handleCreateWorker = (e: React.FormEvent) => {
    e.preventDefault();
    const newWorker: Worker = {
      id: `W-${Math.floor(100 + Math.random() * 900)}`,
      firstName: form.firstName,
      lastName: form.lastName,
      nationality: form.nationality,
      passportNumber: form.passportNumber,
      passportExpiryDate: form.passportExpiryDate,
      phone: form.phone,
      gender: form.gender,
      status: form.status,
      skills: form.skills.split(",").map((s) => s.trim()),
      experienceYears: Number(form.experienceYears),
      arabicLevel: form.arabicLevel,
      cookingSkill: form.cookingSkill,
      medicalStatus: form.medicalStatus,
      musanedStatus: form.musanedStatus,
      visaStatus: form.visaStatus,
      aiInterviewScore: 90,
      arabicFluencyScore: 85,
    };
    const updated = [newWorker, ...workers];
    saveWorkers(updated);
    setShowAddModal(false);
    setSelectedWorker(newWorker);
    setForm({
      firstName: "",
      lastName: "",
      passportNumber: "",
      nationality: "Ethiopian",
      phone: "",
      gender: "female",
      status: "Available",
      passportExpiryDate: "2029-12-31",
      skills: "Housekeeping, Childcare",
      experienceYears: "2",
      arabicLevel: "Intermediate",
      cookingSkill: "Arabic Cuisine",
      medicalStatus: "Fit (GAMCA)",
      musanedStatus: "Ready",
      visaStatus: "Pending",
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this worker record?")) return;
    const updated = workers.filter((w) => w.id !== id);
    saveWorkers(updated);
    if (selectedWorker?.id === id) setSelectedWorker(null);
  };

  const handleRunAiInterview = () => {
    setInterviewEvaluating(true);
    setInterviewResult(null);
    setTimeout(() => {
      setInterviewEvaluating(false);
      setInterviewResult({
        overallScore: 94,
        arabicProficiency: "88% (Conversational Domestic Arabic)",
        etiquetteRating: "96% (Polite, Professional)",
        hospitalityRating: "95% (Cooking & Infant Care Demonstrated)",
        recommendation: "Highly Recommended for Immediate Saudi Musaned Placement",
      });
    }, 2000);
  };

  const handleExportGovernmentPayload = (portal: "Musaned" | "Qiwa" | "Enjaz") => {
    const payload = filteredWorkers.map((w) => ({
      portal_target: portal,
      candidate_id: w.id,
      full_name_en: `${w.firstName} ${w.lastName}`,
      passport_no: w.passportNumber,
      nationality: w.nationality,
      profession: "Domestic Worker / Housemaid",
      wafid_medical_status: w.medicalStatus,
      musaned_contract_status: w.musanedStatus,
      visa_status: w.visaStatus,
      arabic_fluency_score: w.arabicFluencyScore || 85,
    }));

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Saudi_${portal}_Bulk_Export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const filteredWorkers = workers.filter((w) => {
    const matchesSearch =
      `${w.firstName} ${w.lastName} ${w.passportNumber} ${w.id}`
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || w.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <SidebarLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-7 h-7 text-indigo-600" /> Candidate Pool & AI Assessment Lab
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              AI-driven voice/video candidate evaluations, automatic Musaned CV generator, and 1-click Saudi government data packager.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Government Bulk Export Dropdown */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExportGovernmentPayload("Musaned")}
                className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-2xl text-xs shadow-md transition-all"
              >
                <Download className="w-3.5 h-3.5" /> Export Musaned JSON
              </button>
              <button
                onClick={() => handleExportGovernmentPayload("Enjaz")}
                className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2.5 rounded-2xl text-xs shadow-md transition-all"
              >
                <Download className="w-3.5 h-3.5" /> Export Enjaz Payload
              </button>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-2xl shadow-lg shadow-indigo-600/30 transition-all text-sm"
            >
              <Plus className="w-4 h-4" /> Add Candidate
            </button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-3xl shadow-sm border border-slate-200/80">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by candidate name, passport, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-slate-50/50 font-medium"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-slate-50/50 w-full md:w-auto font-bold text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="in processing">In Processing</option>
              <option value="deployed">Deployed</option>
            </select>
          </div>
        </div>

        {/* Workers Table & Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-black text-slate-600 uppercase tracking-wider">
                    <th className="p-4">Candidate</th>
                    <th className="p-4">Passport</th>
                    <th className="p-4">AI Score & Arabic</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredWorkers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 font-bold">
                        No candidates found. Click "Add Candidate" to register.
                      </td>
                    </tr>
                  ) : (
                    filteredWorkers.map((w) => (
                      <tr
                        key={w.id}
                        onClick={() => setSelectedWorker(w)}
                        className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                          selectedWorker?.id === w.id ? "bg-indigo-50/60" : ""
                        }`}
                      >
                        <td className="p-4">
                          <div className="font-black text-slate-900">
                            {w.firstName} {w.lastName}
                          </div>
                          <div className="text-xs text-slate-500 font-medium">
                            {w.nationality} • {w.gender} • {w.id}
                          </div>
                        </td>
                        <td className="p-4 font-mono text-xs text-slate-700 font-bold">
                          {w.passportNumber}
                        </td>
                        <td className="p-4">
                          <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-black px-2.5 py-1 rounded-xl border border-indigo-200">
                            <Sparkles className="w-3.5 h-3.5" /> AI Score: {w.aiInterviewScore || 90}%
                          </div>
                          <div className="text-[11px] text-slate-500 font-semibold mt-1">
                            Arabic: {w.arabicLevel} ({w.arabicFluencyScore || 85}%)
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black ${
                              w.status === "Available"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : w.status === "In Processing"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            }`}
                          >
                            {w.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedWorker(w);
                              setShowCvModal(true);
                            }}
                            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl text-xs font-black transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" /> Auto CV
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(w.id);
                            }}
                            className="text-slate-400 hover:text-red-600 p-2 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Selected Worker Panel */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 space-y-6">
            {selectedWorker ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      {selectedWorker.firstName} {selectedWorker.lastName}
                    </h2>
                    <p className="text-xs text-slate-500 font-mono font-medium">ID: {selectedWorker.id} • Passport: {selectedWorker.passportNumber}</p>
                  </div>
                  <button
                    onClick={() => setShowAiInterviewModal(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-2 rounded-2xl text-xs font-black shadow-md shadow-purple-600/30 flex items-center gap-1.5"
                  >
                    <Video className="w-3.5 h-3.5" /> AI Interview Lab
                  </button>
                </div>

                {/* Saudi Arabia Export Pipeline */}
                <div>
                  <h3 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
                    <Plane className="w-4 h-4 text-indigo-600" /> Saudi Export Milestones
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-medium">
                      <span className="text-slate-700 font-bold">GAMCA Medical Check</span>
                      <span className="text-emerald-600 font-black">{selectedWorker.medicalStatus}</span>
                    </div>
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-medium">
                      <span className="text-slate-700 font-bold">Musaned Contract</span>
                      <span className="text-indigo-600 font-black">{selectedWorker.musanedStatus}</span>
                    </div>
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-medium">
                      <span className="text-slate-700 font-bold">Enjaz Visa Stamping</span>
                      <span className="text-amber-600 font-black">{selectedWorker.visaStatus}</span>
                    </div>
                  </div>
                </div>

                {/* Assessment Skills */}
                <div>
                  <h3 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-600" /> AI Skill Assessment Score
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-slate-500 block font-semibold">AI Overall Score</span>
                      <span className="font-black text-indigo-600 text-base">{selectedWorker.aiInterviewScore || 90}%</span>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-slate-500 block font-semibold">Arabic Fluency</span>
                      <span className="font-black text-emerald-600 text-base">{selectedWorker.arabicFluencyScore || 85}%</span>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 col-span-2">
                      <span className="text-slate-500 block font-semibold">Cooking & Housekeeping</span>
                      <span className="font-bold text-slate-800 text-xs">{selectedWorker.cookingSkill}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-bold">Select a candidate to view AI assessment and export details.</p>
              </div>
            )}
          </div>
        </div>

        {/* AI Video/Voice Interview Lab Modal */}
        {showAiInterviewModal && selectedWorker && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-purple-600 text-white p-2 rounded-2xl font-black">AI</div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">AI Voice & Arabic Assessment Lab</h3>
                    <p className="text-xs text-slate-500 font-medium">Candidate: {selectedWorker.firstName} {selectedWorker.lastName}</p>
                  </div>
                </div>
                <button onClick={() => setShowAiInterviewModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Simulated Camera & Voice Prompt */}
              <div className="bg-slate-950 rounded-3xl p-6 text-white space-y-4 relative overflow-hidden border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-2 font-bold text-emerald-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span> Camera & Audio Feed Active
                  </span>
                  <span className="bg-slate-800 px-3 py-1 rounded-full font-mono text-[10px]">Session: AI-AUDIT-SA-992</span>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-2">
                  <div className="text-xs text-indigo-400 font-bold uppercase tracking-wider">AI Question Prompt (Arabic)</div>
                  <p className="text-sm font-semibold text-slate-100 font-sans">
                    "هل يمكنكِ التحدث عن خبرتكِ في الطهي ورعاية الأطفال؟"
                  </p>
                  <p className="text-xs text-slate-400 italic">
                    (English translation: Can you speak about your experience in cooking and childcare?)
                  </p>
                </div>

                {interviewEvaluating ? (
                  <div className="py-8 text-center space-y-3">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                    <p className="text-xs text-purple-300 font-bold">AI analyzing speech patterns, Arabic vocabulary, and confidence...</p>
                  </div>
                ) : interviewResult ? (
                  <div className="bg-purple-950/60 border border-purple-800/80 p-5 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-purple-300">Evaluation Completed</span>
                      <span className="text-lg font-black text-emerald-400">{interviewResult.overallScore}/100</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                      <div>Arabic Fluency: <strong className="text-white">{interviewResult.arabicProficiency}</strong></div>
                      <div>Etiquette: <strong className="text-white">{interviewResult.etiquetteRating}</strong></div>
                    </div>
                    <div className="text-xs text-emerald-400 font-bold bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-800/50">
                      {interviewResult.recommendation}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <button
                      onClick={handleRunAiInterview}
                      className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-purple-600/30 transition-all text-sm inline-flex items-center gap-2"
                    >
                      <Mic className="w-4 h-4" /> Start AI Candidate Evaluation
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowAiInterviewModal(false)}
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20"
                >
                  Save & Close Lab
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Candidate Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-slate-900">Register Candidate & Generate Bio-data</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateWorker} className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      required
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none font-medium"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Passport Number</label>
                    <input
                      type="text"
                      required
                      value={form.passportNumber}
                      onChange={(e) => setForm({ ...form, passportNumber: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none font-mono text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none font-medium"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Experience (Yrs)</label>
                    <input
                      type="number"
                      value={form.experienceYears}
                      onChange={(e) => setForm({ ...form, experienceYears: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Arabic Level</label>
                    <select
                      value={form.arabicLevel}
                      onChange={(e) => setForm({ ...form, arabicLevel: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none font-medium"
                    >
                      <option value="Basic">Basic</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Fluent">Fluent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Gender</label>
                    <select
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none font-medium"
                    >
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cooking Skill & Assessment</label>
                  <input
                    type="text"
                    value={form.cookingSkill}
                    onChange={(e) => setForm({ ...form, cookingSkill: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none font-medium"
                  />
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
                    Register Candidate
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Auto CV Modal */}
        {showCvModal && selectedWorker && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-indigo-600 text-white p-2 rounded-2xl font-black">CV</div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Official Musaned Bio-Data CV</h3>
                    <p className="text-xs text-slate-500 font-medium">Saudi Arabia Recruitment Export Document</p>
                  </div>
                </div>
                <button onClick={() => setShowCvModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6 border border-slate-200 p-6 rounded-3xl bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-2xl font-black text-slate-900">{selectedWorker.firstName} {selectedWorker.lastName}</h4>
                    <p className="text-sm text-indigo-600 font-bold">Position: Domestic Worker / Housemaid</p>
                  </div>
                  <div className="text-right text-xs text-slate-500 font-mono font-bold">
                    Candidate ID: {selectedWorker.id}<br/>
                    Nationality: {selectedWorker.nationality}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs bg-white p-4 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 block font-semibold">Passport No</span>
                    <span className="font-bold text-slate-800 font-mono">{selectedWorker.passportNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Passport Expiry</span>
                    <span className="font-bold text-slate-800">{selectedWorker.passportExpiryDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Phone</span>
                    <span className="font-bold text-slate-800">{selectedWorker.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Experience</span>
                    <span className="font-bold text-slate-800">{selectedWorker.experienceYears} Years</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Arabic Level</span>
                    <span className="font-bold text-slate-800">{selectedWorker.arabicLevel}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">GAMCA Medical</span>
                    <span className="font-bold text-emerald-600">{selectedWorker.medicalStatus}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md"
                >
                  Print / Download PDF
                </button>
                <button
                  onClick={() => setShowCvModal(false)}
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/30"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
