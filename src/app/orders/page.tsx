"use client";

import React, { useState, useEffect } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { Briefcase, Plus, Search, Trash2, X, CheckCircle, FileText, Building2 } from "lucide-react";

interface Order {
  id: string;
  orderNumber: string;
  clientName: string;
  position: string;
  quantity: number;
  filledQuantity: number;
  salary: string;
  currency: string;
  status: string;
  wakalaNumber: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [form, setForm] = useState({
    clientName: "Riyadh Manpower Services Co.",
    wakalaNumber: `WAK-${Math.floor(100000 + Math.random() * 900000)}`,
    position: "Domestic Housemaid / Caregiver",
    quantity: "5",
    salary: "1500 SAR",
    currency: "SAR",
    status: "Open",
  });

  useEffect(() => {
    const saved = localStorage.getItem("agency_orders");
    if (saved) {
      try {
        setOrders(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    } else {
      const initial: Order[] = [
        {
          id: "ORD-501",
          orderNumber: "ORD-501",
          clientName: "Al-Jazirah Employment Agency (Riyadh)",
          position: "Domestic Housemaid",
          quantity: 10,
          filledQuantity: 4,
          salary: "1500 SAR",
          currency: "SAR",
          status: "Open",
          wakalaNumber: "WAK-992810",
        },
        {
          id: "ORD-502",
          orderNumber: "ORD-502",
          clientName: "Dammam Corporate Services",
          position: "Hospitality Cleaner / Cook",
          quantity: 5,
          filledQuantity: 5,
          salary: "1800 SAR",
          currency: "SAR",
          status: "Filled",
          wakalaNumber: "WAK-445192",
        },
      ];
      setOrders(initial);
      localStorage.setItem("agency_orders", JSON.stringify(initial));
    }
  }, []);

  const saveOrders = (updated: Order[]) => {
    setOrders(updated);
    localStorage.setItem("agency_orders", JSON.stringify(updated));
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const newOrder: Order = {
      id: `ORD-${Math.floor(100 + Math.random() * 900)}`,
      orderNumber: `ORD-${Math.floor(100 + Math.random() * 900)}`,
      clientName: form.clientName,
      position: form.position,
      quantity: Number(form.quantity),
      filledQuantity: 0,
      salary: form.salary,
      currency: form.currency,
      status: form.status,
      wakalaNumber: form.wakalaNumber,
    };
    const updated = [newOrder, ...orders];
    saveOrders(updated);
    setShowAddModal(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this recruitment order?")) return;
    const updated = orders.filter((o) => o.id !== id);
    saveOrders(updated);
    if (selectedOrder?.id === id) setSelectedOrder(null);
  };

  const filteredOrders = orders.filter((o) =>
    `${o.clientName} ${o.orderNumber} ${o.position} ${o.wakalaNumber}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Briefcase className="w-7 h-7 text-indigo-600" /> Saudi Recruitment Orders & E-Wakala
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage Saudi employer visa blocks, E-Wakalas, quota allocation, and recruitment terms.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all text-sm"
          >
            <Plus className="w-4 h-4" /> Create New Order / E-Wakala
          </button>
        </div>

        <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by client, order #, Wakala..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-slate-50/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="p-4">Order / E-Wakala</th>
                    <th className="p-4">Saudi Employer</th>
                    <th className="p-4">Position / Salary</th>
                    <th className="p-4">Slots</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No recruitment orders found.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((o) => (
                      <tr
                        key={o.id}
                        onClick={() => setSelectedOrder(o)}
                        className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                          selectedOrder?.id === o.id ? "bg-indigo-50/50" : ""
                        }`}
                      >
                        <td className="p-4">
                          <div className="font-semibold text-slate-900">{o.orderNumber}</div>
                          <div className="text-xs text-indigo-600 font-mono">Wakala: {o.wakalaNumber}</div>
                        </td>
                        <td className="p-4 text-slate-700 font-medium">
                          {o.clientName}
                        </td>
                        <td className="p-4">
                          <div className="text-slate-800 font-medium text-xs">{o.position}</div>
                          <div className="text-xs text-slate-500 font-mono">{o.salary}</div>
                        </td>
                        <td className="p-4 font-mono text-xs">
                          <span className="font-bold text-slate-800">{o.filledQuantity}</span> / {o.quantity}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            o.status === "Open" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-700"
                          }`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(o.id);
                            }}
                            className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg transition-colors"
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

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-6">
            {selectedOrder ? (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-bold text-slate-900">{selectedOrder.orderNumber}</h3>
                  <p className="text-xs text-indigo-600 font-mono">{selectedOrder.wakalaNumber}</p>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block">Saudi Client / Employer</span>
                    <span className="font-bold text-slate-800 text-sm">{selectedOrder.clientName}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block">Position</span>
                      <span className="font-bold text-slate-800">{selectedOrder.position}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block">Salary Terms</span>
                      <span className="font-bold text-slate-800 font-mono">{selectedOrder.salary}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block">Quota Slots Filled</span>
                    <span className="font-bold text-emerald-600 text-sm">{selectedOrder.filledQuantity} of {selectedOrder.quantity} Workers Assigned</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <Building2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">Select an order to view E-Wakala details.</p>
              </div>
            )}
          </div>
        </div>

        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900">New Saudi Job Order / E-Wakala</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateOrder} className="space-y-4 text-sm">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Saudi Client / Employer Name</label>
                  <input
                    type="text"
                    required
                    value={form.clientName}
                    onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">E-Wakala Number</label>
                    <input
                      type="text"
                      required
                      value={form.wakalaNumber}
                      onChange={(e) => setForm({ ...form, wakalaNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Quantity (Workers)</label>
                    <input
                      type="number"
                      required
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Position Required</label>
                  <input
                    type="text"
                    required
                    value={form.position}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Salary & Terms</label>
                  <input
                    type="text"
                    required
                    value={form.salary}
                    onChange={(e) => setForm({ ...form, salary: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none font-mono text-xs"
                  />
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
                    Save Order
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
