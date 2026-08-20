"use client";

import React, { useState, useEffect } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { 
  Bell, 
  Send, 
  MessageSquare, 
  Smartphone, 
  CheckCircle2, 
  Clock, 
  Users, 
  Sparkles, 
  Filter, 
  Trash2,
  PhoneCall
} from "lucide-react";

interface BroadcastLog {
  id: string;
  recipient: string;
  phone: string;
  channel: "WhatsApp" | "SMS";
  template: string;
  status: "Delivered" | "Sent" | "Failed";
  timestamp: string;
  message: string;
}

export default function NotificationsPage() {
  const [channel, setChannel] = useState<"WhatsApp" | "SMS">("WhatsApp");
  const [selectedTemplate, setSelectedTemplate] = useState("visa_stamped");
  const [recipientName, setRecipientName] = useState("Fatima Ahmed");
  const [recipientPhone, setRecipientPhone] = useState("+251 91 123 4567");
  const [customNote, setCustomNote] = useState("");
  const [sentSuccess, setSentSuccess] = useState(false);

  const [logs, setLogs] = useState<BroadcastLog[]>([]);

  const templates: Record<string, { title: string; text: string }> = {
    interview_invite: {
      title: "Candidate Interview Invitation",
      text: "Dear {name}, you have been selected for an interview with the Saudi recruitment committee on tomorrow at 10:00 AM. Please bring your original passport.",
    },
    medical_passed: {
      title: "Wafid (GAMCA) Medical Cleared",
      text: "Congratulations {name}! Your Wafid GAMCA medical report is FIT. We are now proceeding with your Musaned contract generation.",
    },
    musaned_ready: {
      title: "Musaned E-Contract Ready for Signing",
      text: "Dear {name}, your electronic contract with the Saudi employer is ready on the Musaned platform. Please confirm your acceptance.",
    },
    visa_stamped: {
      title: "Enjaz / Saudi Visa Stamped",
      text: "Dear {name}, great news! Your Saudi work visa has been officially stamped by the Embassy. Flight schedule will be issued shortly.",
    },
    flight_departure: {
      title: "Flight Departure & Arrival Notice",
      text: "Dear {name}, your flight is booked on Ethiopian Airlines to Riyadh. Departure date: Aug 25 at 21:00. Airport reception arranged.",
    },
  };

  useEffect(() => {
    const savedLogs = localStorage.getItem("agency_broadcast_logs");
    if (savedLogs) {
      try {
        setLogs(JSON.parse(savedLogs));
      } catch (e) {}
    } else {
      const initial: BroadcastLog[] = [
        {
          id: "MSG-901",
          recipient: "Fatima Ahmed",
          phone: "+251 91 123 4567",
          channel: "WhatsApp",
          template: "Enjaz / Saudi Visa Stamped",
          status: "Delivered",
          timestamp: "2026-08-18 14:30",
          message: "Dear Fatima Ahmed, great news! Your Saudi work visa has been officially stamped by the Embassy.",
        },
        {
          id: "MSG-902",
          recipient: "Riyadh Manpower Co. (Employer)",
          phone: "+966 50 987 6543",
          channel: "SMS",
          template: "Flight Departure & Arrival Notice",
          status: "Delivered",
          timestamp: "2026-08-17 09:15",
          message: "Candidate Fatima Ahmed flight arriving in Riyadh King Khalid Airport on Aug 25.",
        },
      ];
      setLogs(initial);
      localStorage.setItem("agency_broadcast_logs", JSON.stringify(initial));
    }
  }, []);

  const getPreviewMessage = () => {
    const raw = templates[selectedTemplate]?.text || "";
    let msg = raw.replace("{name}", recipientName);
    if (customNote) {
      msg += ` Note: ${customNote}`;
    }
    return msg;
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog: BroadcastLog = {
      id: `MSG-${Math.floor(100 + Math.random() * 900)}`,
      recipient: recipientName,
      phone: recipientPhone,
      channel,
      template: templates[selectedTemplate]?.title || selectedTemplate,
      status: "Delivered",
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
      message: getPreviewMessage(),
    };

    const updated = [newLog, ...logs];
    setLogs(updated);
    localStorage.setItem("agency_broadcast_logs", JSON.stringify(updated));
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 3000);
  };

  const handleDeleteLog = (id: string) => {
    const updated = logs.filter((l) => l.id !== id);
    setLogs(updated);
    localStorage.setItem("agency_broadcast_logs", JSON.stringify(updated));
  };

  return (
    <SidebarLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <MessageSquare className="w-7 h-7 text-indigo-600" /> WhatsApp & SMS Broadcast Center
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Automated multi-channel notifications for candidates, medical clinics, and Saudi sponsors.
            </p>
          </div>
          {sentSuccess && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-2xl text-xs font-bold border border-emerald-200 shadow-sm animate-fade-in">
              <CheckCircle2 className="w-4 h-4" /> Broadcast Delivered Successfully!
            </div>
          )}
        </div>

        {/* Broadcast Sender & Live Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sender Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-6">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Send className="w-5 h-5 text-indigo-600" /> Send Broadcast Notification
            </h2>

            <form onSubmit={handleSendBroadcast} className="space-y-4 text-sm">
              {/* Channel Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Delivery Channel</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setChannel("WhatsApp")}
                    className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all border ${
                      channel === "WhatsApp"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-emerald-600" /> WhatsApp API
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannel("SMS")}
                    className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all border ${
                      channel === "SMS"
                        ? "bg-indigo-50 text-indigo-700 border-indigo-300 shadow-sm"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-indigo-600" /> SMS Gateway
                  </button>
                </div>
              </div>

              {/* Template Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Notification Template</label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none font-medium bg-slate-50/50"
                >
                  {Object.entries(templates).map(([key, t]) => (
                    <option key={key} value={key}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Recipient Name</label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none font-medium bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Phone Number (with Country Code)</label>
                  <input
                    type="text"
                    required
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none font-mono text-xs font-bold bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Custom Notes / Additional Instructions</label>
                <input
                  type="text"
                  placeholder="e.g. Please bring 4 passport-size photographs"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none font-medium bg-slate-50/50"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <Send className="w-4 h-4" /> Trigger Immediate Broadcast
                </button>
              </div>
            </form>
          </div>

          {/* Live Mobile Device Preview */}
          <div className="lg:col-span-5 flex flex-col justify-center items-center">
            <div className="w-full max-w-sm bg-slate-900 rounded-[40px] p-4 shadow-2xl border-4 border-slate-800 space-y-3">
              <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-2"></div>
              
              {/* Screen Content */}
              <div className="bg-slate-950 rounded-[28px] p-5 text-white min-h-[360px] flex flex-col justify-between border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      RA
                    </div>
                    <div>
                      <div className="font-bold text-xs">{channel} Broadcast</div>
                      <div className="text-[10px] text-slate-400 font-mono">{recipientPhone}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                    Connected
                  </span>
                </div>

                <div className="my-auto py-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs space-y-2 shadow-inner">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                      {templates[selectedTemplate]?.title}
                    </span>
                    <p className="text-slate-200 leading-relaxed font-medium">
                      {getPreviewMessage()}
                    </p>
                    <div className="text-[9px] text-slate-500 text-right pt-1">
                      Just now • Delivered ✓✓
                    </div>
                  </div>
                </div>

                <div className="text-center text-[10px] text-slate-500 border-t border-slate-800/80 pt-2">
                  Recipient: <span className="text-slate-300 font-bold">{recipientName}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Broadcast History Log */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" /> Real-time Delivery Audit Log
            </h2>
            <span className="text-xs text-slate-500 font-medium">Total Delivered: {logs.length}</span>
          </div>

          <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                  <th className="p-4">Message ID</th>
                  <th className="p-4">Recipient</th>
                  <th className="p-4">Channel</th>
                  <th className="p-4">Template</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-mono font-bold text-slate-700">{l.id}</td>
                    <td className="p-4 font-bold text-slate-900">
                      {l.recipient}
                      <span className="block text-[10px] text-slate-400 font-mono font-normal">{l.phone}</span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        l.channel === "WhatsApp" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                      }`}>
                        {l.channel}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-700">{l.template}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {l.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 font-mono">{l.timestamp}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDeleteLog(l.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded"
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
      </div>
    </SidebarLayout>
  );
}
