"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, LogOut, BrainCircuit, Globe, Trophy, Brain } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

import { PROVINCES, PROVINCE_DISTRICTS } from "@/lib/regions";

export default function Dashboard() {
  const [user, setUser] = useState<{ nic: string, name: string, province: string, district: string } | null>(null);
  const [nic, setNic] = useState("");
  const [name, setName] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [submissionsDisabled, setSubmissionsDisabled] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scores, setScores] = useState<{ iq: number | null; gk: number | null }>({ iq: null, gk: null });
  const [submittedIQ, setSubmittedIQ] = useState(false);
  const [submittedGK, setSubmittedGK] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("studentUser");
    if (savedUser) {
      const u = JSON.parse(savedUser);
      setUser(u);
      // Load scores
      const sc = JSON.parse(localStorage.getItem(`studentScores_${u.nic}`) || "{}");
      setScores({ iq: sc.iq ?? null, gk: sc.gk ?? null });
      setSubmittedIQ(localStorage.getItem(`submittedIQ_${u.nic}`) === "true");
      setSubmittedGK(localStorage.getItem(`submittedGK_${u.nic}`) === "true");
    }
    const disabled = localStorage.getItem("submissionsDisabled") === "true";
    setSubmissionsDisabled(disabled);
    setIsLoaded(true);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (nic && name && province && district) {
      const usersStr = localStorage.getItem("registeredUsers") || "{}";
      const registeredUsers = JSON.parse(usersStr);

      if (registeredUsers[nic]) {
        if (registeredUsers[nic].trim().toLowerCase() !== name.trim().toLowerCase()) {
          setError("The name entered does not match our records for this ID Number.");
          return;
        }
      } else {
        registeredUsers[nic] = name.trim();
        localStorage.setItem("registeredUsers", JSON.stringify(registeredUsers));
      }

      const newUser = { nic, name: name.trim(), province, district };
      localStorage.setItem("studentUser", JSON.stringify(newUser));
      setUser(newUser);

      // Load scores for new login
      const sc = JSON.parse(localStorage.getItem(`studentScores_${nic}`) || "{}");
      setScores({ iq: sc.iq ?? null, gk: sc.gk ?? null });
      setSubmittedIQ(localStorage.getItem(`submittedIQ_${nic}`) === "true");
      setSubmittedGK(localStorage.getItem(`submittedGK_${nic}`) === "true");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("studentUser");
    setUser(null);
    setScores({ iq: null, gk: null });
    setSubmittedIQ(false);
    setSubmittedGK(false);
  };

  if (!isLoaded) return null;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleLogin}
          className="glass-panel p-8 w-full max-w-md flex flex-col gap-6"
        >
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold text-white">Student Login</h1>
            <p className="text-slate-400 mt-2">Enter your credentials to access the exams.</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-300">ID Number (NIC)</label>
            <input
              required
              type="text"
              value={nic}
              onChange={(e) => setNic(e.target.value)}
              className="glass-input"
              placeholder="Enter NIC"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-300">Full Name</label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="glass-input"
              placeholder="Enter Full Name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-300">Province</label>
              <select 
                required
                value={province}
                onChange={(e) => {
                  setProvince(e.target.value);
                  setDistrict("");
                }}
                className="glass-input appearance-none bg-slate-900"
              >
                <option value="">Select</option>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-300">District</label>
              <select 
                required
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="glass-input appearance-none bg-slate-900"
              >
                <option value="">Select</option>
                {province && (PROVINCE_DISTRICTS[province] || []).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          <button type="submit" className="mt-4 py-3.5 rounded-xl bg-primary text-white font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
            <Lock className="w-5 h-5" /> Secure Login
          </button>
        </motion.form>
      </div>
    );
  }

  const totalScore = (scores.iq ?? 0) + (scores.gk ?? 0);
  const bothDone = submittedIQ && submittedGK;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] landscape:min-h-0 gap-6 md:gap-10 landscape:gap-4 relative">
      <button
        onClick={handleLogout}
        className="absolute top-0 right-0 flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <LogOut className="w-4 h-4" /> Logout
      </button>

      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">
          Welcome, <span className="text-primary">{user.name}</span>
        </h1>
        <p className="text-slate-400 text-lg">
          {submissionsDisabled
            ? "Exam period has ended. Thank you for participating."
            : "Select the answer sheet you wish to complete."}
        </p>
      </div>

      {/* Score summary card — shown when at least one paper done */}
      {(submittedIQ || submittedGK) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          <div
            className="rounded-2xl p-5"
            style={{
              background: "rgba(8,14,30,0.65)",
              border: "1px solid rgba(220,20,60,0.25)",
              boxShadow: "0 0 30px rgba(220,20,60,0.08)",
            }}
          >
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Your Score Summary</p>
            <div className="grid grid-cols-3 gap-4 text-center">
              {/* IQ */}
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-1">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <span className="text-2xl font-black text-primary">
                  {submittedIQ ? (scores.iq ?? 0) : "—"}
                </span>
                <span className="text-[10px] text-slate-500 font-bold uppercase">IQ / 100</span>
              </div>

              {/* GK */}
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-1">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-black text-white">
                  {submittedGK ? (scores.gk ?? 0) : "—"}
                </span>
                <span className="text-[10px] text-slate-500 font-bold uppercase">GK / 100</span>
              </div>

              {/* Total */}
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-1">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                </div>
                <span className={clsx("text-2xl font-black", bothDone ? "text-yellow-400" : "text-slate-500")}>
                  {bothDone ? totalScore : "—"}
                </span>
                <span className="text-[10px] text-slate-500 font-bold uppercase">Total / 200</span>
              </div>
            </div>

            {!bothDone && (
              <p className="text-center text-xs text-slate-600 mt-4">
                Complete both papers to see your total score.
              </p>
            )}
          </div>
        </motion.div>
      )}

      <div className="w-full max-w-4xl">
        {submissionsDisabled ? (
          <div className="flex flex-col items-center gap-8">
            <div className="glass-panel p-6 text-center text-slate-300 w-full max-w-lg border-slate-700">
              <p className="font-medium">Submissions are now closed.</p>
              <p className="text-sm text-slate-500 mt-1">Please view the global rankings on the leaderboard.</p>
            </div>
            <Link
              href="/leaderboard"
              className="px-10 py-4 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold uppercase tracking-widest hover:bg-slate-700 transition-colors flex items-center gap-3 shadow-sm"
            >
              <Trophy className="w-5 h-5 text-yellow-500" /> View Leaderboard
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <Link
              href="/entry?type=iq"
              className={clsx("glass-panel p-6 md:p-10 landscape:p-4 flex flex-col items-center gap-4 md:gap-6 landscape:gap-2 transition-all group relative", submittedIQ ? "opacity-70" : "hover:border-primary/40")}
            >
              {submittedIQ && (
                <div className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  ✓ Done
                </div>
              )}
              <div className="p-4 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <BrainCircuit className="w-12 h-12" />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold">IQ Answer Sheet</h2>
                <p className="text-slate-500 text-sm mt-1 uppercase tracking-tighter">Submit Intelligence Test</p>
                {submittedIQ && (
                  <p className="text-primary font-bold mt-2">Score: {scores.iq ?? 0} / 100</p>
                )}
              </div>
            </Link>

            <Link
              href="/entry?type=gk"
              className={clsx("glass-panel p-6 md:p-10 landscape:p-4 flex flex-col items-center gap-4 md:gap-6 landscape:gap-2 transition-all group relative", submittedGK ? "opacity-70" : "hover:border-secondary/40")}
            >
              {submittedGK && (
                <div className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  ✓ Done
                </div>
              )}
              <div className="p-4 rounded-xl bg-secondary/10 text-secondary group-hover:bg-secondary group-hover:text-white transition-colors">
                <Globe className="w-12 h-12" />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold">GK Answer Sheet</h2>
                <p className="text-slate-500 text-sm mt-1 uppercase tracking-tighter">Submit General Knowledge</p>
                {submittedGK && (
                  <p className="text-white font-bold mt-2">Score: {scores.gk ?? 0} / 100</p>
                )}
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
