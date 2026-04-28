"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart2, TrendingUp, BrainCircuit, Globe } from "lucide-react";

export default function AnalyticsPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [subjectScores, setSubjectScores] = useState({ iq: 0, gk: 0 });
  const [user, setUser] = useState<{ nic: string; name: string } | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("studentUser");
    if (userStr) {
      const u = JSON.parse(userStr);
      setUser(u);
      const h = JSON.parse(localStorage.getItem(`examHistory_${u.nic}`) || "[]").reverse();
      setHistory(h);
      const s = JSON.parse(localStorage.getItem(`studentScores_${u.nic}`) || "{}");
      setSubjectScores({ iq: s.iq ?? 0, gk: s.gk ?? 0 });
    }
  }, []);

  const bestScore = history.length > 0 ? Math.max(...history.map(h => h.score ?? 0)) : 0;
  const avgScore = history.length > 0 ? Math.round(history.reduce((acc, curr) => acc + (curr.score ?? 0), 0) / history.length) : 0;

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <BarChart2 className="w-8 h-8 text-primary" />
          Performance <span className="text-gradient">Analytics</span>
        </h1>
        <p className="text-slate-400 mt-1">Detailed breakdown of your academic progress</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Exams Taken", value: history.length, icon: <TrendingUp className="w-5 h-5 text-emerald-400" />, color: "#10b981" },
          { label: "Best Score", value: bestScore || "—", icon: <BarChart2 className="w-5 h-5 text-primary" />, color: "#DC143C" },
          { label: "Average Score", value: avgScore || "—", icon: <Globe className="w-5 h-5 text-indigo-400" />, color: "#6366f1" },
        ].map(s => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-5 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              {s.icon}
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{s.label}</p>
            </div>
            <p className="text-2xl font-black text-white">{s.value}</p>
            <div className="h-px w-full rounded-full" style={{ background: `${s.color}40` }} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Progress Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Exam History
            </h2>
            {history.length >= 2 && (
              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${history[history.length - 1].score >= history[history.length - 2].score ? "text-emerald-400 bg-emerald-400/10" : "text-rose-400 bg-rose-400/10"}`}>
                {history[history.length - 1].score >= history[history.length - 2].score ? "↑" : "↓"}
                {" "}{Math.abs(history[history.length - 1].score - history[history.length - 2].score)} pts
              </span>
            )}
          </div>

          {history.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-500 italic text-sm">Complete your first exam to see history.</div>
          ) : (
            <div className="h-48 flex items-end gap-2 justify-start px-2">
              {history.map((d, i) => (
                <div key={d.id || i} className="flex flex-col items-center gap-1 flex-1 group" style={{ maxWidth: 60 }}>
                  <div className="relative w-full flex justify-center items-end" style={{ height: 160 }}>
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-black text-[10px] font-black px-2 py-0.5 rounded whitespace-nowrap z-10">
                      {d.score}/200
                    </div>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(d.score / 200) * 160}px` }}
                      transition={{ delay: 0.1 + i * 0.08, duration: 0.7, type: "spring" }}
                      className="w-full rounded-t-md relative"
                      style={{
                        background: `linear-gradient(to top, rgba(220,20,60,0.3), rgba(220,20,60,0.85))`,
                        maxWidth: 36,
                      }}
                    />
                  </div>
                  <span className="text-[8px] text-slate-600 font-bold truncate w-full text-center">{d.name?.substring(0, 6)}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Subject Breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-panel p-6 flex flex-col gap-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-400" /> Subject Breakdown
          </h2>

          {/* IQ */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-bold text-white flex items-center gap-2"><BrainCircuit className="w-4 h-4 text-primary" /> IQ Sheet</span>
              <span className="text-primary font-bold">{subjectScores.iq}<span className="text-slate-500 text-xs"> / 100</span></span>
            </div>
            <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${subjectScores.iq}%` }}
                transition={{ delay: 0.4, duration: 1 }}
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, rgba(220,20,60,0.5), #DC143C)" }}
              />
            </div>
          </div>

          {/* GK */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-bold text-white flex items-center gap-2"><Globe className="w-4 h-4 text-white/60" /> GK Sheet</span>
              <span className="text-white font-bold">{subjectScores.gk}<span className="text-slate-500 text-xs"> / 100</span></span>
            </div>
            <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${subjectScores.gk}%` }}
                transition={{ delay: 0.6, duration: 1 }}
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.2), rgba(255,255,255,0.7))" }}
              />
            </div>
          </div>

          {/* Combined */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-bold text-white flex items-center gap-2">🏆 Combined</span>
              <span className="text-yellow-400 font-bold">{subjectScores.iq + subjectScores.gk}<span className="text-slate-500 text-xs"> / 200</span></span>
            </div>
            <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((subjectScores.iq + subjectScores.gk) / 200) * 100}%` }}
                transition={{ delay: 0.8, duration: 1 }}
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #f59e0b80, #fbbf24)" }}
              />
            </div>
          </div>

          <div className="mt-auto p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <p className="text-[10px] text-slate-500 italic">* Scores reflect the latest submitted attempt for each paper.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
