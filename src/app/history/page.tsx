"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, Search, Brain, Globe, Trophy, Calendar, CheckCircle, Clock, X } from "lucide-react";
import clsx from "clsx";

interface ExamRecord {
  id: string;
  name: string;
  date: string;
  score: number;
  iqScore?: number;
  gkScore?: number;
  grade: string;
  status: string;
}

function GradeChip({ grade }: { grade: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    "A+": { bg: "bg-yellow-500/20 border-yellow-500/40 text-yellow-400", text: "A+" },
    "A":  { bg: "bg-emerald-500/20 border-emerald-500/40 text-emerald-400", text: "A" },
    "B":  { bg: "bg-blue-500/20 border-blue-500/40 text-blue-400", text: "B" },
    "C":  { bg: "bg-slate-500/20 border-slate-500/40 text-slate-400", text: "C" },
  };
  const s = map[grade] ?? map["C"];
  return (
    <span className={clsx("px-2.5 py-1 rounded-lg text-xs font-black border uppercase tracking-widest", s.bg)}>
      {s.text}
    </span>
  );
}

function CertificateModal({ exam, name, onClose }: { exam: ExamRecord; name: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md relative"
      >
        <button onClick={onClose} className="absolute -top-4 -right-4 z-10 w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>

        {/* Certificate */}
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: "linear-gradient(135deg, #0f1729 0%, #0a0e1f 100%)",
            border: "1px solid rgba(220,20,60,0.4)",
            boxShadow: "0 0 60px rgba(220,20,60,0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          {/* Top decoration */}
          <div className="flex justify-center gap-2 mb-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-1 h-1 rounded-full bg-primary/60" style={{ opacity: 0.4 + i * 0.15 }} />
            ))}
          </div>

          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">Certificate of Completion</p>
          <p className="text-[10px] font-bold text-slate-600 mb-6">Amarasri Herath Academy</p>

          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-primary" />
          </div>

          <h2 className="text-xl font-black text-white mb-1">{name}</h2>
          <p className="text-xs text-slate-500 mb-6">has successfully completed</p>
          <h3 className="text-lg font-bold text-primary mb-2">{exam.name}</h3>
          <p className="text-xs text-slate-500 mb-8 flex items-center justify-center gap-1">
            <Calendar className="w-3 h-3" /> {exam.date}
          </p>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="rounded-xl p-3" style={{ background: "rgba(220,20,60,0.1)", border: "1px solid rgba(220,20,60,0.2)" }}>
              <p className="text-xl font-black text-primary">{exam.iqScore ?? "—"}</p>
              <p className="text-[9px] text-slate-500 uppercase tracking-wider mt-1">IQ</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <p className="text-xl font-black text-white">{exam.gkScore ?? "—"}</p>
              <p className="text-[9px] text-slate-500 uppercase tracking-wider mt-1">GK</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)" }}>
              <p className="text-xl font-black text-yellow-400">{exam.score}</p>
              <p className="text-[9px] text-slate-500 uppercase tracking-wider mt-1">Total</p>
            </div>
          </div>

          <GradeChip grade={exam.grade} />

          {/* Bottom decoration */}
          <div className="flex justify-center gap-2 mt-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-1 h-1 rounded-full bg-primary/60" style={{ opacity: 0.4 + (4 - i) * 0.15 }} />
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function HistoryPage() {
  const [examHistory, setExamHistory] = useState<ExamRecord[]>([]);
  const [user, setUser] = useState<{ nic: string; name: string } | null>(null);
  const [search, setSearch] = useState("");
  const [selectedExam, setSelectedExam] = useState<ExamRecord | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("studentUser");
    if (userStr) {
      const u = JSON.parse(userStr);
      setUser(u);
      const saved = JSON.parse(localStorage.getItem(`examHistory_${u.nic}`) || "[]");
      setExamHistory(saved);
    }
  }, []);

  const filtered = examHistory.filter(e =>
    e.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <History className="w-8 h-8 text-white/60" />
            Exam <span className="text-gradient">History</span>
          </h1>
          <p className="text-slate-400 mt-1">Review all past exam submissions</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search exams..."
            className="glass-input pl-9 w-full text-sm"
          />
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="glass-panel p-16 text-center text-slate-500 italic">
          {examHistory.length === 0 ? "No exam history yet. Complete both papers to record your first attempt." : "No results match your search."}
        </div>
      )}

      {/* History Cards */}
      <div className="flex flex-col gap-3">
        {filtered.map((exam, i) => (
          <motion.div
            key={exam.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="glass-panel p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-white/20 transition-all"
          >
            {/* Status Icon */}
            <div className="flex-shrink-0">
              {exam.status === "completed"
                ? <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-emerald-400" /></div>
                : <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center"><Clock className="w-5 h-5 text-orange-400" /></div>}
            </div>

            {/* Exam Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-white truncate">{exam.name}</p>
                <GradeChip grade={exam.grade} />
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-xs text-slate-500 flex items-center gap-1"><Calendar className="w-3 h-3" />{exam.date}</span>
                <span className="text-[9px] font-mono text-slate-600">{exam.id}</span>
              </div>
            </div>

            {/* Scores */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="flex items-center gap-1.5 text-sm">
                <Brain className="w-3.5 h-3.5 text-primary" />
                <span className="font-bold text-primary">{exam.iqScore ?? "—"}</span>
                <span className="text-slate-600 text-xs">/100</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <Globe className="w-3.5 h-3.5 text-white/50" />
                <span className="font-bold text-white">{exam.gkScore ?? "—"}</span>
                <span className="text-slate-600 text-xs">/100</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                <span className="font-black text-yellow-400">{exam.score}</span>
                <span className="text-slate-600 text-xs">/200</span>
              </div>
            </div>

            {/* View Certificate */}
            {exam.status === "completed" && (
              <button
                onClick={() => setSelectedExam(exam)}
                className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                style={{ background: "rgba(220,20,60,0.1)", border: "1px solid rgba(220,20,60,0.3)", color: "#DC143C" }}
              >
                Certificate
              </button>
            )}
          </motion.div>
        ))}
      </div>

      {/* Certificate Modal */}
      <AnimatePresence>
        {selectedExam && user && (
          <CertificateModal exam={selectedExam} name={user.name} onClose={() => setSelectedExam(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
