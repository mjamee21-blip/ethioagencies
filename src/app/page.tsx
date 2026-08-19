import React from "react";
import Link from "next/link";
import { 
  Users, 
  Briefcase, 
  Building2, 
  ShieldCheck, 
  Globe, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Cpu, 
  FileText, 
  Plane 
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 text-white p-2.5 rounded-2xl font-black text-xl shadow-lg shadow-indigo-600/30">
              RA
            </div>
            <div>
              <span className="font-black text-white text-lg tracking-tight">Agency OS</span>
              <span className="text-xs text-indigo-400 block font-semibold">Saudi Manpower SaaS</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-bold text-slate-300 hover:text-white px-4 py-2 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all inline-flex items-center gap-2"
            >
              Enter Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-6 overflow-hidden">
        <div className="absolute left-1/2 -translate-x-1/2 top-10 w-[800px] h-[400px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-400 px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase border border-indigo-500/20">
            <Sparkles className="w-3.5 h-3.5" /> Next-Gen Enterprise Operating System for Recruitment Agencies
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white leading-tight">
            Automating the A-to-Z Journey of <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Saudi Manpower Export</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto font-medium">
            Multi-tenant SaaS platform managing candidate registration, automated Musaned CV generation, Wafid GAMCA medical checks, Enjaz visa stamping, and flight deployments.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-indigo-600/30 transition-all text-base inline-flex items-center justify-center gap-3"
            >
              Launch Platform Dashboard <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/workers"
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold px-8 py-4 rounded-2xl border border-slate-800 transition-all text-base inline-flex items-center justify-center gap-3"
            >
              Explore Candidate Pool
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 px-6 border-t border-slate-900 bg-slate-900/50">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl font-black text-white tracking-tight">Built Specifically for Saudi Export Agencies</h2>
            <p className="text-slate-400 text-sm">Everything your agency needs to scale placements with absolute compliance and zero friction.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-900/80 p-8 rounded-3xl border border-slate-800/80 shadow-lg space-y-4 hover:border-indigo-500/50 transition-all">
              <div className="w-12 h-12 bg-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center font-black">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Auto Musaned CV Generation</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Register candidate bio-data, experience, and skills once to automatically generate professional Saudi-compliant CVs ready for instant export.
              </p>
            </div>

            <div className="bg-slate-900/80 p-8 rounded-3xl border border-slate-800/80 shadow-lg space-y-4 hover:border-indigo-500/50 transition-all">
              <div className="w-12 h-12 bg-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center font-black">
                <Plane className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">6-Stage Saudi Pipeline Kanban</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Seamlessly track candidates from Sourcing through Wafid Medical, Musadaqa Legalization, Enjaz/VFS, Flight Booked, to 90-Day Guarantee.
              </p>
            </div>

            <div className="bg-slate-900/80 p-8 rounded-3xl border border-slate-800/80 shadow-lg space-y-4 hover:border-indigo-500/50 transition-all">
              <div className="w-12 h-12 bg-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center font-black">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">E-Wakala & Job Orders</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Manage Saudi employer visa blocks, E-Wakalas, quota slot allocations, and salary terms with strict multi-tenant isolation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-12 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-2 rounded-xl font-black">RA</div>
            <span className="font-bold text-slate-400">Recruitment Agency OS</span>
          </div>
          <p>&copy; 2026 Ethio-Gulf Manpower Systems. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="hover:text-slate-300">Dashboard</Link>
            <Link href="/workers" className="hover:text-slate-300">Workers</Link>
            <Link href="/settings" className="hover:text-slate-300">Settings</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
