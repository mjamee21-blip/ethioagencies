"client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@ethio-gulf.com");
  const [password, setPassword] = useState("Demo1234!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [seeding, setSeeding] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setSeeding(true);
    setError("");
    try {
      // 1. Seed database first
      const seedRes = await fetch("/api/seed");
      const seedData = await seedRes.json();
      if (!seedRes.ok && !seedData.success) {
        throw new Error("Failed to seed demo database");
      }

      // 2. Login as admin
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@ethio-gulf.com", password: "Demo1234!" }),
      });

      const loginData = await loginRes.json();
      if (!loginRes.ok) {
        throw new Error(loginData.error || "Demo login failed");
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      {/* DEMO MODE BANNER */}
      <div className="w-full max-w-md mb-6 rounded-lg bg-amber-500 text-white p-4 shadow-lg text-center">
        <div className="flex items-center justify-center gap-2 font-bold text-lg mb-1">
          <span>🚀 DEMO MODE ACTIVE</span>
        </div>
        <p className="text-sm opacity-95">
          Welcome to Recruitment Agency OS. Try out the pre-populated demo agency <strong>Ethio-Gulf Star Recruitment PLC</strong> with 30 workers, 10 clients, and full records!
        </p>
        <button
          onClick={handleQuickDemoLogin}
          disabled={seeding}
          className="mt-3 w-full rounded-md bg-white text-amber-900 font-bold py-2 px-4 shadow hover:bg-amber-100 transition disabled:opacity-50"
        >
          {seeding ? "Provisioning Demo Data & Logging In..." : "⚡ Quick Demo Login (Ethio-Gulf Star Admin)"}
        </button>
      </div>

      <div className="w-full max-w-md rounded-xl bg-white dark:bg-gray-800 p-8 shadow-xl border border-gray-200 dark:border-gray-700">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Recruitment Agency OS
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your agency workspace</p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary text-primary-foreground font-medium py-2.5 px-4 shadow hover:bg-primary/90 transition disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>Demo Credentials: admin@ethio-gulf.com / Demo1234!</p>
        </div>
      </div>
    </div>
  );
}
