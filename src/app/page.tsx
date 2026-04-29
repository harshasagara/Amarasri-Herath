"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, LogOut, BrainCircuit, Globe, Trophy, Brain, User, ArrowRight, MapPin } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { PROVINCES, PROVINCE_DISTRICTS } from "@/lib/regions";
import { getStudentByNIC, upsertStudent, getStudentHistory } from "@/app/actions";
import { supabase } from "@/lib/supabase/client";

// ── AI Insight Card ───────────────────────────────────────────────────────────
function AIInsight({ iq, gk }: { iq: number | null; gk: number | null }) {
  const total = (iq ?? 0) + (gk ?? 0);
  const hasBoth = iq !== null && gk !== null;

  let message = "Complete both papers to unlock your AI performance insight.";
  let color = "#6366f1";
  let icon = "🤖";

  if (hasBoth) {
    if (total >= 180) { message = "Outstanding! You're in the top 5% of candidates. Elite performance across both papers."; color = "#fbbf24"; icon = "🏆"; }
    else if (total >= 160) { message = "Excellent work! A strong balanced performance. Push for 180+ to reach the Elite tier."; color = "#10b981"; icon = "🚀"; }
    else if (total >= 120) { message = "Good progress! Focus on your weaker paper to break into the High Achiever bracket."; color = "#3b82f6"; icon = "📈"; }
    else { message = "Keep practicing! Consistent effort will significantly improve your scores over time."; color = "#DC143C"; icon = "💪"; }
  } else if (iq !== null) {
    message = `IQ paper done (${iq}/100). Complete the GK paper to unlock your full AI insight.`;
    color = "#DC143C"; icon = "🧠";
  } else if (gk !== null) {
    message = `GK paper done (${gk}/100). Complete the IQ paper to unlock your full AI insight.`;
    color = "#6366f1"; icon = "🌍";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="w-full max-w-lg rounded-2xl p-4 flex items-start gap-3"
      style={{
        background: "rgba(8,14,30,0.65)",
        border: `1px solid ${color}30`,
        boxShadow: `0 0 20px ${color}10`,
      }}
    >
      <span className="text-2xl flex-shrink-0 mt-0.5">{icon}</span>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color }}>AI Insight</p>
        <p className="text-sm text-slate-300 leading-relaxed">{message}</p>
      </div>
    </motion.div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [user, setUser] = useState<{ nic: string; name: string; province: string; district: string; category: string } | null>(null);
  const [nic, setNic] = useState("");
  const [name, setName] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [category, setCategory] = useState("Open");
  
  const [loginStep, setLoginStep] = useState(1); // 1: NIC, 2: Details
  const [checkingNIC, setCheckingNIC] = useState(false);
  const [submissionsDisabled, setSubmissionsDisabled] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<any>(null);
  const [scores, setScores] = useState<{ iq: number | null; gk: number | null }>({ iq: null, gk: null });
  const [submittedIQ, setSubmittedIQ] = useState(false);
  const [submittedGK, setSubmittedGK] = useState(false);

  const loadAll = async (u: { nic: string }) => {
    // 1. Fetch scores from Supabase
    const { data: result } = await supabase
      .from('students_results')
      .select('iq_marks, gk_marks')
      .eq('nic', u.nic)
      .single();

    if (result) {
      setScores({ iq: result.iq_marks ?? null, gk: result.gk_marks ?? null });
      setSubmittedIQ(result.iq_marks !== null);
      setSubmittedGK(result.gk_marks !== null);
      
      // Sync to local storage for quick access in components
      localStorage.setItem(`submittedIQ_${u.nic}`, result.iq_marks !== null ? "true" : "false");
      localStorage.setItem(`submittedGK_${u.nic}`, result.gk_marks !== null ? "true" : "false");
      localStorage.setItem(`studentScores_${u.nic}`, JSON.stringify({ iq: result.iq_marks, gk: result.gk_marks }));
    }
  };

  useEffect(() => {
    const init = async () => {
      const cfg = await getSystemConfig();
      setConfig(cfg);
      
      const savedUser = localStorage.getItem("studentUser");
      if (savedUser) {
        try {
          const u = JSON.parse(savedUser);
          // Check if user object is complete (new format)
          if (u.nic && u.name && u.province && u.district && u.category) {
            setUser(u);
            loadAll(u);
          } else {
            // Stale user data, clear and force new login flow
            localStorage.removeItem("studentUser");
            setUser(null);
            setLoginStep(1);
          }
        } catch (e) {
          localStorage.removeItem("studentUser");
        }
      }
      setSubmissionsDisabled(localStorage.getItem("submissionsDisabled") === "true");
      setIsLoaded(true);
    };
    init();
    const channel = supabase
      .channel('system-config-updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'system_config' 
      }, (payload) => {
        if (payload.new) {
          setConfig(payload.new);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleNICCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nic) return;
    
    setCheckingNIC(true);
    setError(null);
    
    try {
      const res = await getStudentByNIC(nic);
      if (res.success && res.data) {
        // User exists, log them in automatically
        const existingUser = res.data;
        const userData = {
          nic: existingUser.nic,
          name: existingUser.name,
          province: existingUser.province,
          district: existingUser.district,
          category: existingUser.category
        };
        localStorage.setItem("studentUser", JSON.stringify(userData));
        setUser(userData);
        loadAll(userData);
      } else {
        // User is new, move to step 2
        setLoginStep(2);
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setCheckingNIC(false);
    }
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nic || !name || !province || !district) return;
    
    setError(null);
    const newUser = { nic, name: name.trim(), province, district, category };
    
    try {
      const res = await upsertStudent(newUser);
      if (res.success) {
        localStorage.setItem("studentUser", JSON.stringify(newUser));
        setUser(newUser);
        loadAll(newUser);
      } else {
        setError("Failed to register. Please try again.");
      }
    } catch (err) {
      setError("Something went wrong. Please check your connection.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("studentUser");
    setUser(null);
    setNic("");
    setName("");
    setProvince("");
    setDistrict("");
    setLoginStep(1);
    setScores({ iq: null, gk: null });
    setSubmittedIQ(false);
    setSubmittedGK(false);
  };

  if (!isLoaded) return null;

  // ── Login Form (Multi-Step) ──────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] py-12 px-4">
        <AnimatePresence mode="wait">
          {loginStep === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="glass-panel p-8 w-full max-w-md flex flex-col gap-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-violet-500" />
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-cyan-400" />
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight">Welcome Back</h1>
                <p className="text-slate-400 mt-2 text-sm">Enter your ID Number to continue.</p>
              </div>

              <form onSubmit={handleNICCheck} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/70 ml-1">Identity Number (NIC)</label>
                  <div className="relative">
                    <input 
                      required 
                      type="text" 
                      value={nic} 
                      onChange={(e) => setNic(e.target.value)} 
                      className="glass-input pl-11 h-14 text-lg font-bold tracking-wider" 
                      placeholder="e.g. 199912345678" 
                    />
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  </div>
                </div>

                {error && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold text-center">{error}</div>}

                <button 
                  type="submit" 
                  disabled={checkingNIC}
                  className="mt-2 h-14 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-black uppercase tracking-[0.2em] text-xs hover:shadow-lg hover:shadow-cyan-500/25 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                >
                  {checkingNIC ? (
                    <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <>Next Step <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-panel p-8 w-full max-w-lg flex flex-col gap-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500" />
              <div className="flex items-center gap-4 mb-2">
                <button onClick={() => setLoginStep(1)} className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                  <ArrowRight className="w-4 h-4 text-white rotate-180" />
                </button>
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight">Complete Profile</h1>
                  <p className="text-slate-400 text-xs">New identity detected. Please provide your details.</p>
                </div>
              </div>

              <form onSubmit={handleRegistration} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-400/70 ml-1">Full Name</label>
                  <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="glass-input h-12" placeholder="Full Name" />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-400/70 ml-1">Province</label>
                  <div className="relative">
                    <select required value={province} onChange={(e) => { setProvince(e.target.value); setDistrict(""); }} className="glass-input h-12 appearance-none bg-slate-900 pr-10">
                      <option value="">Select</option>
                      {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-400/70 ml-1">District</label>
                  <div className="relative">
                    <select required value={district} onChange={(e) => setDistrict(e.target.value)} className="glass-input h-12 appearance-none bg-slate-900 pr-10">
                      <option value="">Select</option>
                      {province && (PROVINCE_DISTRICTS[province] || []).map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-400/70 ml-1">Candidate Type / කාණ්ඩය</label>
                  <div className="flex bg-slate-950/50 p-1.5 rounded-xl border border-white/5 gap-2">
                    {["Open", "limited"].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={clsx(
                          "flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                          category === cat
                            ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg"
                            : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {error && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold text-center md:col-span-2">{error}</div>}

                <button type="submit" className="md:col-span-2 h-14 rounded-xl bg-white text-slate-950 font-black uppercase tracking-[0.2em] text-xs hover:bg-cyan-50 shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98]">
                  Complete Registration <CheckCircle className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const totalScore = (scores.iq ?? 0) + (scores.gk ?? 0);
  const bothDone = submittedIQ && submittedGK;

  return (
    <div className="flex flex-col items-center gap-6 md:gap-8 relative pb-8">
      {/* Logout */}
      <button onClick={handleLogout} className="absolute top-0 right-0 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">
        <LogOut className="w-3.5 h-3.5" /> Logout
      </button>

      {/* Welcome */}
      <div className="text-center pt-2">
        <h1 className="text-4xl font-black text-white tracking-tight mb-2">Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">{user.name}</span></h1>
        <p className="text-slate-500 text-lg font-medium">
          {submissionsDisabled ? "Exam period has ended. Thank you for participating." : "Select the answer sheet you wish to complete."}
        </p>
      </div>

      {/* Score Summary */}
      {(submittedIQ || submittedGK) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
          <div className="rounded-3xl p-6 relative overflow-hidden" style={{ background: "rgba(8,14,30,0.65)", border: "1px solid rgba(220,20,60,0.2)", boxShadow: "0 0 40px rgba(0,0,0,0.3)" }}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500/40 to-violet-500/40" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-6 text-center">Academic Performance Summary</p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-1"><Brain className="w-6 h-6 text-cyan-400" /></div>
                <span className="text-3xl font-black text-white tracking-tight">{submittedIQ ? (scores.iq ?? 0) : "—"}</span>
                <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">IQ / 100</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-1"><Globe className="w-6 h-6 text-white/80" /></div>
                <span className="text-3xl font-black text-white tracking-tight">{submittedGK ? (scores.gk ?? 0) : "—"}</span>
                <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">GK / 100</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-1"><Trophy className="w-6 h-6 text-yellow-400" /></div>
                <span className={clsx("text-3xl font-black tracking-tight", bothDone ? "text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 to-amber-500" : "text-slate-700")}>{bothDone ? totalScore : "—"}</span>
                <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Total / 200</span>
              </div>
            </div>
            {!bothDone && <div className="mt-6 p-3 rounded-xl bg-white/5 text-center text-[10px] font-bold text-white/40 uppercase tracking-widest">Complete both papers to unlock total ranking</div>}
          </div>
        </motion.div>
      )}


      <div className="w-full max-w-4xl px-4">
        {submissionsDisabled ? (
          <div className="flex flex-col items-center gap-8">
            <div className="glass-panel p-8 text-center text-slate-300 w-full max-w-lg border-white/5">
              <p className="font-bold text-lg">Submissions are now closed.</p>
              <p className="text-sm text-slate-500 mt-2">The examination window has officially ended. Please view your final standing on the leaderboard.</p>
            </div>
            <Link href="/leaderboard" className="px-10 py-4 rounded-2xl bg-white text-slate-950 font-black uppercase tracking-[0.2em] text-xs hover:bg-cyan-50 transition-all flex items-center gap-3 shadow-2xl">
              <Trophy className="w-4 h-4" /> View Leaderboard
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <Link href="/entry?type=iq" className={clsx("glass-panel p-8 md:p-12 flex flex-col items-center gap-6 transition-all group relative overflow-hidden", submittedIQ ? "opacity-60 grayscale-[0.5]" : "hover:border-cyan-500/40 hover:shadow-cyan-500/10")}>
              {submittedIQ && <div className="absolute top-4 right-4 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 z-10">COMPLETED</div>}
              <div className="p-5 rounded-2xl bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition-all duration-500 shadow-lg shadow-cyan-500/5"><BrainCircuit className="w-16 h-16" /></div>
              <div className="text-center">
                <h2 className="text-2xl font-black text-white tracking-tight">IQ Answer Sheet</h2>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.15em] mt-2">Intelligence Assessment</p>
                {submittedIQ && <div className="mt-6 font-black text-2xl text-cyan-400 tracking-tighter">{scores.iq ?? 0} <span className="text-[10px] text-slate-600 uppercase">Points</span></div>}
              </div>
            </Link>
            <Link href="/entry?type=gk" className={clsx("glass-panel p-8 md:p-12 flex flex-col items-center gap-6 transition-all group relative overflow-hidden", submittedGK ? "opacity-60 grayscale-[0.5]" : "hover:border-fuchsia-500/40 hover:shadow-fuchsia-500/10")}>
              {submittedGK && <div className="absolute top-4 right-4 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 z-10">COMPLETED</div>}
              <div className="p-5 rounded-2xl bg-fuchsia-500/10 text-fuchsia-400 group-hover:bg-fuchsia-500 group-hover:text-white transition-all duration-500 shadow-lg shadow-fuchsia-500/5"><Globe className="w-16 h-16" /></div>
              <div className="text-center">
                <h2 className="text-2xl font-black text-white tracking-tight">GK Answer Sheet</h2>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.15em] mt-2">General Knowledge</p>
                {submittedGK && <div className="mt-6 font-black text-2xl text-fuchsia-400 tracking-tighter">{scores.gk ?? 0} <span className="text-[10px] text-slate-600 uppercase">Points</span></div>}
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function CheckCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
