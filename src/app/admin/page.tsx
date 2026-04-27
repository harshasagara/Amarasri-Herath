"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, Save, Lock, Upload, Trash2, Edit3,
  Trophy, ArrowLeft, AlertTriangle, Eye, EyeOff,
} from "lucide-react";
import clsx from "clsx";

interface StudentEntry {
  nic: string;
  name: string;
  score: number;
  iqScore?: number;
  gkScore?: number;
  level: string;
  rank?: number;
}

export default function AdminPage() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState("");

  // "iq" | "gk" | "leaderboard"
  const [activeTab, setActiveTab] = useState<"iq" | "gk" | "leaderboard">("iq");

  const [examName, setExamName] = useState("Monthly Mock Exam");
  const [answerKeyIQ, setAnswerKeyIQ] = useState<(number | null)[]>(Array(50).fill(null));
  const [answerKeyGK, setAnswerKeyGK] = useState<(number | null)[]>(Array(50).fill(null));
  const [iqPaperName, setIqPaperName] = useState<string | null>(null);
  const [gkPaperName, setGkPaperName] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Leaderboard management state
  const [lbData, setLbData] = useState<StudentEntry[]>([]);
  const [lbEnabled, setLbEnabled] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StudentEntry | null>(null);

  const iqFileRef = useRef<HTMLInputElement>(null);
  const gkFileRef = useRef<HTMLInputElement>(null);

  const loadLb = useCallback(() => {
    const raw: StudentEntry[] = JSON.parse(localStorage.getItem("globalLeaderboard") || "[]");
    
    // Sort by score descending
    const sorted = [...raw].sort((a, b) => b.score - a.score);
    
    // Calculate ranks with tie-handling (same score = same rank)
    let currentRank = 1;
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i].score < sorted[i - 1].score) {
        currentRank = i + 1;
      }
      sorted[i].rank = currentRank;
    }

    setLbData(sorted);
    setLbEnabled(localStorage.getItem("leaderboardEnabled") === "true");
  }, []);

  useEffect(() => {
    const savedName = localStorage.getItem("adminExamName");
    if (savedName) setExamName(savedName);

    const savedIQ = localStorage.getItem("adminAnswerKeyIQ");
    if (savedIQ) setAnswerKeyIQ(JSON.parse(savedIQ));
    else setAnswerKeyIQ(Array.from({ length: 50 }, (_, i) => (i * 3 + 1) % 4));

    const savedGK = localStorage.getItem("adminAnswerKeyGK");
    if (savedGK) setAnswerKeyGK(JSON.parse(savedGK));
    else setAnswerKeyGK(Array.from({ length: 50 }, (_, i) => (i * 2 + 2) % 4));

    setIqPaperName(localStorage.getItem("adminPaperIQ"));
    setGkPaperName(localStorage.getItem("adminPaperGK"));

    loadLb();
  }, [loadLb]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "Sadaruwan2008") setIsAuthorized(true);
    else alert("Invalid Admin Password");
  };

  const currentKey = activeTab === "iq" ? answerKeyIQ : answerKeyGK;

  const handleSelect = (qIndex: number, optIndex: number) => {
    if (activeTab === "iq") {
      const newKey = [...answerKeyIQ];
      newKey[qIndex] = optIndex;
      setAnswerKeyIQ(newKey);
    } else if (activeTab === "gk") {
      const newKey = [...answerKeyGK];
      newKey[qIndex] = optIndex;
      setAnswerKeyGK(newKey);
    }
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem("adminExamName", examName);
    localStorage.setItem("adminAnswerKeyIQ", JSON.stringify(answerKeyIQ));
    localStorage.setItem("adminAnswerKeyGK", JSON.stringify(answerKeyGK));
    if (iqPaperName) localStorage.setItem("adminPaperIQ", iqPaperName);
    if (gkPaperName) localStorage.setItem("adminPaperGK", gkPaperName);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "iq" | "gk") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      try {
        localStorage.setItem(`adminPaperData${type.toUpperCase()}`, base64);
        localStorage.setItem(`adminPaperMime${type.toUpperCase()}`, file.type);
        localStorage.setItem(`adminPaper${type.toUpperCase()}`, file.name);
      } catch {
        alert("File is too large to store. Please use a smaller file (< 4MB).");
        return;
      }
      if (type === "iq") setIqPaperName(file.name);
      else setGkPaperName(file.name);
      setSaved(false);
    };
    reader.readAsDataURL(file);
  };

  const removePaper = (type: "iq" | "gk") => {
    if (type === "iq") {
      setIqPaperName(null);
      localStorage.removeItem("adminPaperIQ");
      localStorage.removeItem("adminPaperDataIQ");
      localStorage.removeItem("adminPaperMimeIQ");
    } else {
      setGkPaperName(null);
      localStorage.removeItem("adminPaperGK");
      localStorage.removeItem("adminPaperDataGK");
      localStorage.removeItem("adminPaperMimeGK");
    }
  };

  const handleEraseSubmissions = () => {
    if (window.confirm("ERASE SUBMISSIONS? This will reset the Leaderboard, Answer Sheets, and uploaded Papers. History will be kept.")) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith("submitted") ||
          key.startsWith("studentAnswers") ||
          key.startsWith("studentScores") ||
          key.startsWith("adminPaper") ||
          key === "globalLeaderboard"
        )) keysToRemove.push(key);
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      setIqPaperName(null);
      setGkPaperName(null);
      loadLb();
      alert("Submissions, Leaderboard, and Uploaded Papers have been reset.");
    }
  };

  const handleToggleSubmissions = () => {
    const currentState = localStorage.getItem("submissionsDisabled") === "true";
    localStorage.setItem("submissionsDisabled", (!currentState).toString());
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleToggleLeaderboard = () => {
    const next = !lbEnabled;
    localStorage.setItem("leaderboardEnabled", next.toString());
    setLbEnabled(next);
  };

  const confirmDelete = (s: StudentEntry) => setDeleteTarget(s);

  const executeDelete = () => {
    if (!deleteTarget) return;
    const raw: StudentEntry[] = JSON.parse(localStorage.getItem("globalLeaderboard") || "[]");
    const updated = raw.filter((s) => s.nic !== deleteTarget.nic);
    localStorage.setItem("globalLeaderboard", JSON.stringify(updated));
    setDeleteTarget(null);
    loadLb();
  };

  const isSubmissionsDisabled =
    typeof window !== "undefined" && localStorage.getItem("submissionsDisabled") === "true";

  if (!isAuthorized) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050810]">
        {/* Futuristic Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
          
          {/* Animated Grid lines */}
          <div className="absolute inset-0 opacity-[0.03]" 
            style={{ 
              backgroundImage: `linear-gradient(rgba(220,20,60,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(220,20,60,0.3) 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }} 
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full max-w-md px-6"
        >
          {/* Outer Glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 rounded-[2rem] blur-xl opacity-50" />
          
          <div className="relative glass-panel p-10 border-white/10 rounded-[2rem] flex flex-col gap-8 shadow-2xl">
            <div className="text-center flex flex-col gap-2">
              <motion.div 
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                className="w-20 h-20 bg-primary/10 rounded-2xl border border-primary/20 flex items-center justify-center mx-auto mb-4 relative group"
              >
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-0 group-hover:scale-100 transition-transform duration-500" />
                <Lock className="w-10 h-10 text-primary relative z-10" />
              </motion.div>
              
              <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">
                Secure <span className="text-primary">Gateway</span>
              </h1>
              <p className="text-slate-500 text-sm font-medium tracking-wide">
                ENTER ADMINISTRATIVE CLEARANCE CODE
              </p>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-6">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-primary/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
                <div className="relative flex flex-col gap-2">
                  <input
                    type="password"
                    autoFocus
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-slate-800"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••"
                  />
                  <div className="flex justify-between px-2">
                    <span className="text-[10px] text-slate-600 font-bold tracking-widest uppercase">Encryption: AES-256</span>
                    <span className="text-[10px] text-slate-600 font-bold tracking-widest uppercase">System: Secure</span>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="relative group overflow-hidden py-4 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-sm transition-all shadow-[0_0_20px_rgba(220,20,60,0.3)] hover:shadow-[0_0_30px_rgba(220,20,60,0.5)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                Authorize Access
              </motion.button>
            </form>

            <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
              <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Server Online
              </div>
              <div className="text-[9px] text-slate-600 leading-relaxed font-medium">
                Attempting unauthorized access will be logged and reported to the system administrator. Protocol 09-X enforced.
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  /* =============== LEADERBOARD MANAGEMENT TAB =============== */
  if (activeTab === "leaderboard") {
    return (
      <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-20 px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900/50 p-6 rounded-2xl border border-white/5 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab("iq")}
              className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white uppercase italic">
                Leaderboard <span className="text-primary">Registry</span>
              </h1>
              <div className="flex items-center gap-2">
                <Trophy className="w-3 h-3 text-yellow-500" />
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Entry Management & Access Control</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-black/30 p-2 pl-4 rounded-xl border border-white/5">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Public Status</span>
              <span className={clsx("text-xs font-bold", lbEnabled ? "text-emerald-400" : "text-rose-400")}>
                {lbEnabled ? "ACTIVE" : "RESTRICTED"}
              </span>
            </div>
            <button
              onClick={handleToggleLeaderboard}
              className={clsx("flex items-center gap-2 px-5 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all",
                lbEnabled 
                  ? "bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20" 
                  : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20"
              )}
            >
              {lbEnabled ? <><EyeOff className="w-3.5 h-3.5" /> Deactivate</> : <><Eye className="w-3.5 h-3.5" /> Publish</>}
            </button>
          </div>
        </div>

        {/* Delete confirm modal */}
        <AnimatePresence>
          {deleteTarget && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="glass-panel p-8 w-full max-w-sm flex flex-col gap-5 text-center"
              >
                <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
                <div>
                  <h2 className="text-xl font-bold text-white">Delete Entry?</h2>
                  <p className="text-slate-400 mt-2 text-sm">
                    Remove <span className="text-white font-bold">{deleteTarget.name}</span>
                    <br /><span className="font-mono text-xs text-slate-500">{deleteTarget.nic}</span>
                  </p>
                  <p className="text-rose-400 text-xs mt-2">This cannot be undone.</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    className="flex-1 py-3 rounded-xl font-bold"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeDelete}
                    className="flex-1 py-3 rounded-xl font-bold"
                    style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171" }}
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
        {lbData.length === 0 ? (
          <div className="glass-panel p-16 text-center text-slate-500 italic">
            No leaderboard entries yet.
          </div>
        ) : (
          <div className="glass-panel overflow-hidden">
            {/* Header row */}
            <div
              className="grid px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800"
              style={{ gridTemplateColumns: "40px 1fr 140px 70px 70px 90px 48px", background: "rgba(15,23,42,0.7)" }}
            >
              <div>#</div>
              <div>Name</div>
              <div>ID (NIC)</div>
              <div className="text-center">IQ</div>
              <div className="text-center">GK</div>
              <div className="text-right">Total</div>
              <div />
            </div>

            {lbData.map((s, i) => {
              const iq = s.iqScore ?? Math.round(s.score * 0.5);
              const gk = s.gkScore ?? Math.round(s.score * 0.5);
              return (
                <motion.div
                  key={s.nic}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="grid px-4 py-3 items-center border-b border-slate-800/50 last:border-0 hover:bg-white/[0.02] transition-colors"
                  style={{ gridTemplateColumns: "40px 1fr 140px 70px 70px 90px 48px" }}
                >
                  <span className="font-mono text-slate-500 font-bold text-sm">{s.rank}</span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-white truncate">{s.name}</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">{s.level}</span>
                  </div>
                  <span className="font-mono text-xs text-slate-400 truncate">{s.nic}</span>
                  <span className="text-center font-bold text-primary">{iq}</span>
                  <span className="text-center font-bold text-white">{gk}</span>
                  <div className="text-right flex flex-col items-end">
                    <span className="font-black text-white">{s.score}</span>
                    <span className="text-[9px] text-slate-600">/200</span>
                  </div>
                  <button
                    onClick={() => confirmDelete(s)}
                    className="flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:bg-rose-500/20"
                    style={{ border: "1px solid rgba(239,68,68,0.2)", color: "rgba(248,113,113,0.7)" }}
                    title="Delete entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              );
            })}

            <div className="px-4 py-2.5 text-xs text-slate-600 flex justify-between border-t border-slate-800"
              style={{ background: "rgba(15,23,42,0.5)" }}>
              <span>{lbData.length} entries</span>
              <span>IQ×2 + GK×2 = /200</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* =============== MAIN CONTROL PANEL =============== */
  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-20 px-4">
      {/* Professional Header / Status Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-slate-900/50 p-6 rounded-2xl border border-white/5 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
            <Settings className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white uppercase italic">
              Command <span className="text-primary">Center</span>
            </h1>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Administrator: Level 4 Clearance</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => { loadLb(); setActiveTab("leaderboard"); }}
            className="group flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all border relative overflow-hidden"
            style={{
              background: lbEnabled ? "rgba(234,179,8,0.1)" : "rgba(220,20,60,0.1)",
              border: `1px solid ${lbEnabled ? "rgba(234,179,8,0.35)" : "rgba(220,20,60,0.3)"}`,
              color: lbEnabled ? "#fbbf24" : "#DC143C",
            }}
          >
            <Trophy className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Leaderboard: {lbEnabled ? "LIVE" : "OFFLINE"}</span>
          </button>

          <button
            onClick={handleToggleSubmissions}
            className={clsx("flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border",
              isSubmissionsDisabled
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20"
                : "bg-orange-500/10 text-orange-500 border-orange-500/30 hover:bg-orange-500/20"
            )}
          >
            {isSubmissionsDisabled ? "Enable Submissions" : "Disable Submissions"}
          </button>

          <button
            onClick={handleEraseSubmissions}
            className="px-5 py-2.5 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/30 font-bold text-xs uppercase tracking-wider hover:bg-rose-500/20 transition-all"
          >
            Wipe Results
          </button>

          <button
            onClick={() => setIsAuthorized(false)}
            className="px-4 py-2.5 rounded-xl bg-white/5 text-slate-400 border border-white/10 font-bold text-xs uppercase tracking-wider hover:bg-white/10 hover:text-white transition-all"
          >
            Lock
          </button>
          
          <button
            onClick={handleSave}
            className="relative group px-6 py-2.5 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(220,20,60,0.2)]"
          >
            <Save className="w-4 h-4" /> {saved ? "DEPLOYED" : "COMMIT CHANGES"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-6 flex flex-col gap-4 border-white/5 bg-slate-900/40">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-primary" />
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Registry: Exam Name</label>
            </div>
            <span className="text-[9px] text-slate-600 font-mono">ID: EX-001</span>
          </div>
          <div className="flex gap-3 mt-2">
            <input 
              type="text" 
              value={examName} 
              onChange={(e) => setExamName(e.target.value)} 
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all" 
              placeholder="System Identity..."
            />
          </div>
        </div>

        <div className="glass-panel p-6 flex flex-col gap-4 border-white/5 bg-slate-900/40">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Upload className="w-4 h-4 text-primary" />
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Data Ingestion: Source Papers</label>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="flex flex-col gap-2">
              <input type="file" className="hidden" ref={iqFileRef} onChange={(e) => handleFileUpload(e, "iq")} />
              <button
                onClick={() => iqFileRef.current?.click()}
                className={clsx("group py-3 rounded-xl border border-white/10 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all",
                  iqPaperName ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-white/5 text-slate-400 hover:bg-white/10 hover:border-white/20"
                )}
              >
                <div className={clsx("w-1.5 h-1.5 rounded-full", iqPaperName ? "bg-emerald-500 animate-pulse" : "bg-slate-700")} />
                {iqPaperName ? "IQ: UPLOADED" : "UPLOAD IQ"}
              </button>
              {iqPaperName && (
                <div className="flex items-center justify-between px-2">
                  <span className="text-[9px] text-slate-500 truncate max-w-[100px] font-mono italic">{iqPaperName}</span>
                  <button onClick={() => removePaper("iq")} className="text-rose-500/70 hover:text-rose-400 transition-colors"><Trash2 className="w-3 h-3" /></button>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input type="file" className="hidden" ref={gkFileRef} onChange={(e) => handleFileUpload(e, "gk")} />
              <button
                onClick={() => gkFileRef.current?.click()}
                className={clsx("group py-3 rounded-xl border border-white/10 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all",
                  gkPaperName ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-white/5 text-slate-400 hover:bg-white/10 hover:border-white/20"
                )}
              >
                <div className={clsx("w-1.5 h-1.5 rounded-full", gkPaperName ? "bg-emerald-500 animate-pulse" : "bg-slate-700")} />
                {gkPaperName ? "GK: UPLOADED" : "UPLOAD GK"}
              </button>
              {gkPaperName && (
                <div className="flex items-center justify-between px-2">
                  <span className="text-[9px] text-slate-500 truncate max-w-[100px] font-mono italic">{gkPaperName}</span>
                  <button onClick={() => removePaper("gk")} className="text-rose-500/70 hover:text-rose-400 transition-colors"><Trash2 className="w-3 h-3" /></button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setActiveTab("iq")}
          className={clsx("px-10 py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs transition-all border",
            activeTab === "iq" ? "bg-primary text-white border-primary shadow-[0_0_15px_rgba(220,20,60,0.3)]" : "bg-white/5 text-slate-500 border-white/5 hover:bg-white/10"
          )}
        >
          IQ Data Matrix
        </button>
        <button
          onClick={() => setActiveTab("gk")}
          className={clsx("px-10 py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs transition-all border",
            activeTab === "gk" ? "bg-primary text-white border-primary shadow-[0_0_15px_rgba(220,20,60,0.3)]" : "bg-white/5 text-slate-500 border-white/5 hover:bg-white/10"
          )}
        >
          GK Data Matrix
        </button>
      </div>

      <div className="glass-panel p-10 border-white/5 bg-slate-900/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Settings className="w-32 h-32 text-white rotate-12" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-12 gap-y-4">
          {Array.from({ length: 50 }).map((_, qIndex) => (
            <div key={qIndex} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 group">
              <span className="text-slate-600 font-mono text-[10px] w-6 group-hover:text-primary transition-colors font-bold">
                {String(qIndex + 1).padStart(2, '0')}
              </span>
              <div className="flex gap-2">
                {["A", "B", "C", "D"].map((opt, i) => (
                  <button
                    key={opt}
                    onClick={() => handleSelect(qIndex, i)}
                    className={clsx("w-8 h-8 rounded-lg border text-[10px] font-black transition-all flex items-center justify-center",
                      currentKey[qIndex] === i
                        ? "bg-primary border-primary text-white shadow-[0_0_10px_rgba(220,20,60,0.4)]"
                        : "bg-black/20 border-white/10 text-slate-500 hover:border-white/30 hover:text-white"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
