"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart2, TrendingUp, BrainCircuit, Globe } from "lucide-react";
import { getStudentHistory } from "@/app/actions";

interface ExamHistoryItem {
  id: string;
  exam_name: string;
  score: number;
  total_score: number;
  created_at: string;
}

export default function AnalyticsPage() {
  const [history, setHistory] = useState<ExamHistoryItem[]>([]);
  const [subjectScores, setSubjectScores] = useState({ iq: 0, gk: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const userStr = localStorage.getItem("studentUser");
      if (userStr) {
        const u = JSON.parse(userStr);
        
        // Fetch persistent history from Supabase
        const res = await getStudentHistory(u.nic);
        if (res.success && res.data) {
          setHistory(res.data);
          
          // Latest scores for breakdown
          if (res.data.length > 0) {
            const latest = res.data[0];
            setSubjectScores({ 
              iq: latest.iq_score ?? 0, 
              gk: latest.gk_score ?? 0 
            });
          }
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const bestScore = history.length > 0 ? Math.max(...history.map(h => h.total_score ?? 0)) : 0;
  const avgScore = history.length > 0 ? Math.round(history.reduce((acc, curr) => acc + (curr.total_score ?? 0), 0) / history.length) : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-4 border-white/5 border-t-cyan-500 animate-spin" />
        <p className="mt-4 text-slate-500 font-black uppercase tracking-widest text-[10px]">Synchronizing Data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-10 px-4">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
            <BarChart2 className="w-6 h-6 text-cyan-400" />
          </div>
          Performance <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">Analytics</span>
        </h1>
        <p className="text-slate-500 mt-2 font-medium">Real-time breakdown of your academic progress synchronized across all devices.</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: "Total Assessments", value: history.length, icon: <TrendingUp className="w-5 h-5 text-emerald-400" />, color: "#10b981" },
          { label: "Elite Best Score", value: bestScore || "—", icon: <BarChart2 className="w-5 h-5 text-cyan-400" />, color: "#06b6d4" },
          { label: "Global Average", value: avgScore || "—", icon: <Globe className="w-5 h-5 text-violet-400" />, color: "#8b5cf6" },
        ].map(s => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-6 flex flex-col gap-3 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               {s.icon}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{s.label}</p>
            <p className="text-4xl font-black text-white tracking-tight">{s.value}</p>
            <div className="h-1 w-12 rounded-full" style={{ background: s.color }} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Progress Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8 relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-white flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-emerald-400" /> Historical Performance
            </h2>
          </div>

          {history.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-600 gap-4">
              <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
                 <BarChart2 className="w-8 h-8 opacity-20" />
              </div>
              <p className="italic text-sm font-medium">Complete your first exam to see historical data.</p>
            </div>
          ) : (
            <div className="h-64 flex items-end gap-3 justify-start px-2">
              {history.slice(0, 8).reverse().map((d, i) => (
                <div key={d.id || i} className="flex flex-col items-center gap-3 flex-1 group" style={{ maxWidth: 80 }}>
                  <div className="relative w-full flex justify-center items-end" style={{ height: 200 }}>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all bg-white text-slate-950 text-[10px] font-black px-2 py-1 rounded-lg shadow-xl z-10 scale-90 group-hover:scale-100">
                      {d.total_score}/200
                    </div>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(d.total_score / 200) * 200}px` }}
                      transition={{ delay: 0.1 + i * 0.08, duration: 0.7, type: "spring" }}
                      className="w-full rounded-2xl relative shadow-lg"
                      style={{
                        background: `linear-gradient(to top, rgba(6,182,212,0.2), rgba(6,182,212,0.8))`,
                        maxWidth: 40,
                      }}
                    />
                  </div>
                  <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider truncate w-full text-center">
                    {new Date(d.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Subject Breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-panel p-8 flex flex-col gap-8">
          <h2 className="text-xl font-black text-white flex items-center gap-3">
            <BrainCircuit className="w-5 h-5 text-cyan-400" /> Subject Proficiency
          </h2>

          <div className="space-y-8">
            {/* IQ */}
            <div>
              <div className="flex justify-between text-xs font-black uppercase tracking-[0.15em] mb-3">
                <span className="text-white flex items-center gap-2">Intelligence (IQ)</span>
                <span className="text-cyan-400">{subjectScores.iq}<span className="text-slate-600 ml-1">/ 100</span></span>
              </div>
              <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${subjectScores.iq}%` }}
                  transition={{ delay: 0.4, duration: 1 }}
                  className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                />
              </div>
            </div>

            {/* GK */}
            <div>
              <div className="flex justify-between text-xs font-black uppercase tracking-[0.15em] mb-3">
                <span className="text-white flex items-center gap-2">General Knowledge (GK)</span>
                <span className="text-violet-400">{subjectScores.gk}<span className="text-slate-600 ml-1">/ 100</span></span>
              </div>
              <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${subjectScores.gk}%` }}
                  transition={{ delay: 0.6, duration: 1 }}
                  className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                />
              </div>
            </div>

            {/* Combined */}
            <div className="pt-4 border-t border-white/5">
              <div className="flex justify-between text-xs font-black uppercase tracking-[0.15em] mb-3">
                <span className="text-white flex items-center gap-2">Combined Merit Score</span>
                <span className="text-yellow-400">{subjectScores.iq + subjectScores.gk}<span className="text-slate-600 ml-1">/ 200</span></span>
              </div>
              <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden p-1">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${((subjectScores.iq + subjectScores.gk) / 200) * 100}%` }}
                  transition={{ delay: 0.8, duration: 1 }}
                  className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.2)]"
                />
              </div>
            </div>
          </div>

          <div className="mt-auto p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Cloud Synchronized Data Source</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
