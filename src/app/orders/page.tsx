"use client";

import React, { useEffect, useState } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { Briefcase, Plus, Search, Trash2, X, CheckCircle } from "lucide-react";

interface Order {
  id: number;
  orderNumber: string;
  position: string;
  quantity: number;
  filledQuantity: number;
  salary: string;
  currency: string;
  status: string;
  clientName: string;
  clientId: number;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const [form, setForm] = useState({
    clientId: "",
    orderNumber: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
    position: "Housemaid",
    quantity: 1,
    salary: "450",
    currency: "USD",
    status: "open",
  });

  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/recruitment-orders?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      setOrders(data.orders || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/clients");
      const data = await res.json();
      setClients(data.clients || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchClients();
  }, [search]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/recruitment-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowAddModal(false);
        fetchOrders();
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to create order");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectOrder = async (id: number) => {
    try {
      const res = await fetch(`/api/recruitment-orders/${id}`);
      const data = await res.json();
      setSelectedOrder(data.order);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteOrder = async (id: number) => {
    if (!confirm("Are you sure you want to delete this recruitment order?")) return;
    try {
      const res = await fetch(`/api/recruitment-orders/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (selectedOrder?.id === id) setSelectedOrder(null);
        fetchOrders();
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
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Recruitment Orders & Demands</h1>
            <p className="text-sm text-slate-500 mt-1">Client demand orders, visa allocations, and candidate matching.</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/25 transition-all text-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> Create Order
          </button>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search orders by number or position..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No recruitment orders found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="p-4">Order #</th>
                    <th className="p-4">Client</th>
                    <th className="p-4">Position</th>
                    <th className="p-4">Quantity / Filled</th>
                    <th className="p-4">Salary</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-900">{order.orderNumber}</td>
                      <td className="p-4 font-semibold text-slate-800">{order.clientName || "Unknown Client"}</td>
                      <td className="p-4 text-slate-600">{order.position}</td>
                      <td className="p-4 text-slate-600 font-medium">
                        {order.filledQuantity} / {order.quantity}
                      </td>
                      <td className="p-4 text-slate-600">${order.salary} {order.currency}</td>
                      <td className="p-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
                          order.status === "open" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          order.status === "in_progress" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                          "bg-slate-100 text-slate-700"
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleSelectOrder(order.id)}
                          className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-semibold rounded-lg text-xs transition-colors"
                        >
                          Candidates
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Order Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900">Create Recruitment Order</h2>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateOrder} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Client / Employer *</label>
                  <select
                    required
                    value={form.clientId}
                    onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium text-slate-700"
                  >
                    <option value="">Select Client</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.country})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Order Number *</label>
                    <input
                      type="text"
                      required
                      value={form.orderNumber}
                      onChange={(e) => setForm({ ...form, orderNumber: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Position *</label>
                    <input
                      type="text"
                      required
                      value={form.position}
                      onChange={(e) => setForm({ ...form, position: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value, 10) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Salary</label>
                    <input
                      type="text"
                      value={form.salary}
                      onChange={(e) => setForm({ ...form, salary: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Currency</label>
                    <input
                      type="text"
                      value={form.currency}
                      onChange={(e) => setForm({ ...form, currency: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
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
                    Save Order
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Selected Order Candidates / Matching Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Order: {selectedOrder.orderNumber}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Position: {selectedOrder.position} • Client: {selectedOrder.clientName}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-slate-900 text-base mb-3">Nominated & Matched Candidates</h3>
                  {selectedOrder.candidates && selectedOrder.candidates.length > 0 ? (
                    <div className="space-y-2">
                      {selectedOrder.candidates.map((cand: any) => (
                        <div key={cand.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{cand.workerFirstName} {cand.workerLastName}</p>
                            <p className="text-xs text-slate-500 font-mono">Passport: {cand.workerPassport}</p>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 uppercase">
                            {cand.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                      No candidates currently matched or nominated for this order. Check the Pipeline Kanban to assign candidates.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800"
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
