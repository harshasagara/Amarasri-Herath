"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LineChart, BarChart2, TrendingUp, BrainCircuit, Globe } from "lucide-react";
import clsx from "clsx";

export default function AnalyticsPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [user, setUser] = useState<{nic: string, name: string} | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("studentUser");
    if (userStr) {
      const u = JSON.parse(userStr);
      setUser(u);
      const hStr = localStorage.getItem(`examHistory_${u.nic}`);
      if (hStr) {
        // Reverse history to show chronological progress
        const h = JSON.parse(hStr).reverse();
        setHistory(h);
      }
    }
  }, []);

  // Calculate trends for the latest exam vs previous
  const getSubjectTrend = (type: 'iq' | 'gk') => {
    if (history.length < 2) return null;
    const latest = history[history.length - 1];
    const previous = history[history.length - 2];
    
    // We need subject specific scores. 
    // Wait, the history object currently saves total score.
    // Let's check the history object structure in entry/page.tsx
    // It saves: { id, name, date, score, grade, status }
    // To get subject breakdown, we might need to load studentScores_${nic} directly
    return null; 
  };

  // Let's load the raw subject scores for the breakdown
  const [subjectScores, setSubjectScores] = useState({ iq: 0, gk: 0 });
  useEffect(() => {
    if (user) {
      const sStr = localStorage.getItem(`studentScores_${user.nic}`);
      if (sStr) setSubjectScores(JSON.parse(sStr));
    }
  }, [user]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <LineChart className="w-8 h-8 text-primary" />
            Performance <span className="text-gradient">Analytics</span>
          </h1>
          <p className="text-gray-400 mt-1">Detailed breakdown of your academic progress</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Overall Progress Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6 min-h-[400px]"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-secondary" />
              Overall Progress
            </h2>
            {history.length >= 2 && (
              <span className={clsx(
                "text-sm font-medium px-2 py-1 rounded-md",
                history[history.length - 1].score >= history[history.length - 2].score 
                  ? "text-green-400 bg-green-400/10" 
                  : "text-red-400 bg-red-400/10"
              )}>
                {history[history.length - 1].score >= history[history.length - 2].score ? "↑" : "↓"} 
                {Math.abs(history[history.length - 1].score - history[history.length - 2].score)} Marks vs Last
              </span>
            )}
          </div>

          {history.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500 italic">
              Complete your first exam to see progress.
            </div>
          ) : (
            <div className="h-64 flex items-end gap-2 justify-between px-2">
              {history.map((d, i) => (
                <div key={d.id || i} className="flex flex-col items-center gap-2 w-full group">
                  <div className="relative w-full flex justify-center h-48 items-end">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${(d.score / 200) * 100}%` }}
                      transition={{ delay: 0.1 + i * 0.1, duration: 0.8, type: "spring" }}
                      className="w-full max-w-[40px] rounded-t-md bg-gradient-to-t from-primary/20 to-primary/80 relative group-hover:to-primary transition-all cursor-pointer"
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-black text-xs font-bold px-2 py-1 rounded whitespace-nowrap">
                        {d.score} / 200
                      </div>
                    </motion.div>
                  </div>
                  <span className="text-[10px] text-gray-500 font-medium rotate-45 mt-2 origin-left truncate w-12">{d.name}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Subject Breakdown */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-6"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-purple-400" />
              Subject Breakdown
            </h2>
          </div>

          <div className="flex flex-col gap-10">
            {/* IQ */}
            <div>
              <div className="flex justify-between text-sm mb-3">
                <span className="font-bold text-white flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-primary" /> IQ Sheet
                </span>
                <span className="text-primary font-bold">{subjectScores.iq} <span className="text-gray-500 text-xs font-medium">/ 100</span></span>
              </div>
              <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${subjectScores.iq}%` }}
                  transition={{ delay: 0.4, duration: 1 }}
                  className="h-full rounded-full bg-gradient-to-r from-primary/50 to-primary shadow-[0_0_15px_rgba(220,20,60,0.3)]"
                />
              </div>
            </div>

            {/* GK */}
            <div>
              <div className="flex justify-between text-sm mb-3">
                <span className="font-bold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-secondary" /> GK Sheet
                </span>
                <span className="text-secondary font-bold">{subjectScores.gk} <span className="text-gray-500 text-xs font-medium">/ 100</span></span>
              </div>
              <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${subjectScores.gk}%` }}
                  transition={{ delay: 0.6, duration: 1 }}
                  className="h-full rounded-full bg-gradient-to-r from-white/30 to-white/80 shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                />
              </div>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-gray-400 italic">
                * Scores reflect the latest submitted attempts for each paper type.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
