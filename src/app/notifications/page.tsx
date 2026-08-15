"use client";

import React, { useEffect, useState } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { Bell, CheckCheck, RefreshCw, Trash2 } from "lucide-react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications(data.notifications || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleGenerateReminders = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/notifications/generate", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        alert(`Generated ${data.generatedCount} new reminder notification(s).`);
        fetchNotifications();
      } else {
        alert(data.error || "Failed to generate reminders");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Notification Center</h1>
            <p className="text-sm text-slate-500 mt-1">Reminders for expiring passports, missing documents, expiring contracts, visa updates, and payment overdue.</p>
          </div>
          <button
            onClick={handleGenerateReminders}
            disabled={generating}
            className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/25 transition-all text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${generating ? "animate-spin" : ""}`} /> Generate Automated Reminders
          </button>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No notifications found. Click "Generate Automated Reminders" to check for expiries and alerts.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((n) => (
                <div key={n.id} className={`p-5 flex items-start justify-between gap-4 transition-colors ${n.isRead ? "bg-white" : "bg-indigo-50/40"}`}>
                  <div className="flex items-start space-x-4">
                    <div className={`p-2.5 rounded-xl mt-0.5 ${n.isRead ? "bg-slate-100 text-slate-500" : "bg-indigo-600 text-white"}`}>
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-bold text-slate-900">{n.title}</h3>
                        {!n.isRead && (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{n.message}</p>
                      <span className="text-xs text-slate-400 mt-2 block">{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!n.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(n.id)}
                        title="Mark as Read"
                        className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl transition-colors"
                      >
                        <CheckCheck className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(n.id)}
                      title="Delete"
                      className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
