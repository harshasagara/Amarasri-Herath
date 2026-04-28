"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, ArrowLeft, Send, Brain, Globe, Eye, Download, FileText } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import clsx from "clsx";
import { supabase } from "@/lib/supabase";

const OPTIONS = ["A", "B", "C", "D"];

function EntryExamContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = searchParams.get("type") === "gk" ? "gk" : "iq";
  
  const [answers, setAnswers] = useState<(number | null)[]>(Array(50).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState<number[]>(Array.from({ length: 50 }, (_, i) => (i * 3 + 1) % 4));
  const [submissionsDisabled, setSubmissionsDisabled] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);
  const [user, setUser] = useState<{nic: string, name: string} | null>(null);
  const [paperName, setPaperName] = useState<string | null>(null);
  const [paperData, setPaperData] = useState<string | null>(null); // base64 data URL
  const [viewingPaper, setViewingPaper] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("studentUser");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      router.push("/");
    }
  }, [router]);

  // Reset state or load existing submission when type changes
  useEffect(() => {
    if (!user) return;
    
    const isSubmitted = localStorage.getItem(`submitted${type.toUpperCase()}_${user.nic}`) === "true";
    if (isSubmitted) {
      setSubmitted(true);
      const savedAnswers = JSON.parse(localStorage.getItem(`studentAnswers${type.toUpperCase()}_${user.nic}`) || "[]");
      if (savedAnswers.length === 50) setAnswers(savedAnswers);
      const savedScores = JSON.parse(localStorage.getItem(`studentScores_${user.nic}`) || "{}");
      setScore(savedScores[type] || 0);
    } else {
      setAnswers(Array(50).fill(null));
      setSubmitted(false);
      setScore(0);
    }

    const disabled = localStorage.getItem("submissionsDisabled") === "true";
    setSubmissionsDisabled(disabled);

    // Load paper info + base64 data
    const paper = localStorage.getItem(`adminPaper${type.toUpperCase()}`);
    setPaperName(paper);
    const data = localStorage.getItem(`adminPaperData${type.toUpperCase()}`);
    setPaperData(data);

    window.scrollTo(0, 0);
  }, [type, user]);

  // View paper inline
  const handleViewPaper = () => {
    if (!paperData) return;
    setViewingPaper(true);
    window.scrollTo(0, 0);
  };

  // Download paper
  const handleDownloadPaper = () => {
    if (!paperData || !paperName) return;
    const a = document.createElement('a');
    a.href = paperData;
    a.download = paperName;
    a.click();
  };

  useEffect(() => {
    const keyName = type === "iq" ? "adminAnswerKeyIQ" : "adminAnswerKeyGK";
    const savedKey = localStorage.getItem(keyName);
    if (savedKey) setCorrectAnswers(JSON.parse(savedKey));
    else setCorrectAnswers(Array.from({ length: 50 }, (_, i) => (i * 3 + 1) % 4));
  }, [type]);

  // Handle Countdown effect
  useEffect(() => {
    if (redirectCountdown === null) return;
    if (redirectCountdown === 0) {
      if (type === "iq") router.push("/entry?type=gk");
      else router.push("/");
      return;
    }
    const timer = setTimeout(() => {
      setRedirectCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [redirectCountdown, type, router]);

  const handleSelect = (qIndex: number, optionIndex: number) => {
    if (submitted || submissionsDisabled) return;
    const newAnswers = [...answers];
    newAnswers[qIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    if (!user) return;
    if (answers.some((a) => a === null)) {
      if (!window.confirm("You haven't answered all 50 questions. Are you sure you want to submit?")) return;
    }

    let calculatedScore = 0;
    answers.forEach((ans, i) => {
      if (ans === correctAnswers[i]) calculatedScore += 2;
    });

    setScore(calculatedScore);
    setSubmitted(true);
    
    localStorage.setItem(`submitted${type.toUpperCase()}_${user.nic}`, "true");
    localStorage.setItem(`studentAnswers${type.toUpperCase()}_${user.nic}`, JSON.stringify(answers));

    const studentScoresStr = localStorage.getItem(`studentScores_${user.nic}`) || "{}";
    const studentScores = JSON.parse(studentScoresStr);
    studentScores[type] = calculatedScore;
    localStorage.setItem(`studentScores_${user.nic}`, JSON.stringify(studentScores));

    // --- SUPABASE INTEGRATION START ---
    const saveToSupabase = async () => {
      try {
        // 1. Get current data for this student to preserve the other score
        const { data: existing, error: fetchError } = await supabase
          .from('students_results')
          .select('*')
          .eq('nic', user.nic)
          .single();

        let iqMarks = type === "iq" ? calculatedScore : (existing?.iq_marks || 0);
        let gkMarks = type === "gk" ? calculatedScore : (existing?.gk_marks || 0);
        let totalMarks = iqMarks + gkMarks;

        // 2. Upsert the merged data
        const { error: upsertError } = await supabase
          .from('students_results')
          .upsert({
            nic: user.nic,
            name: user.name,
            province: (user as any).province || "Unknown",
            district: (user as any).district || "Unknown",
            subject: type.toUpperCase(),
            category: (user as any).category || "Open",
            iq_marks: iqMarks,
            gk_marks: gkMarks,
            total_marks: totalMarks
          }, { onConflict: 'nic' });

        if (upsertError) throw upsertError;
      } catch (err) {
        console.error("Supabase Save Error:", err);
      }
    };
    saveToSupabase();
    // --- SUPABASE INTEGRATION END ---

    const otherType = type === "iq" ? "gk" : "iq";
    const isOtherSubmitted = localStorage.getItem(`submitted${otherType.toUpperCase()}_${user.nic}`) === "true";

    if (isOtherSubmitted) {
      const iqScore = type === "iq" ? calculatedScore : (studentScores["iq"] || 0);
      const gkScore = type === "gk" ? calculatedScore : (studentScores["gk"] || 0);
      const totalScore = iqScore + gkScore; // IQ max 100 + GK max 100 = 200 total
      const examName = localStorage.getItem("adminExamName") || "Final Mock Exam";
      
      const historyStr = localStorage.getItem(`examHistory_${user.nic}`) || "[]";
      const history = JSON.parse(historyStr);
      
      history.unshift({
          id: `EXM-${Date.now()}`,
          name: examName,
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          score: totalScore,
          iqScore,
          gkScore,
          grade: totalScore >= 180 ? "A+" : totalScore >= 150 ? "A" : totalScore >= 120 ? "B" : "C",
          status: "completed"
      });
      localStorage.setItem(`examHistory_${user.nic}`, JSON.stringify(history));

      const leaderboardStr = localStorage.getItem("globalLeaderboard") || "[]";
      const leaderboard = JSON.parse(leaderboardStr);
      const lbIndex = leaderboard.findIndex((entry: any) => entry.nic === user.nic);
      if (lbIndex >= 0) {
        leaderboard[lbIndex].score = totalScore;
        leaderboard[lbIndex].iqScore = iqScore;
        leaderboard[lbIndex].gkScore = gkScore;
        leaderboard[lbIndex].level = totalScore >= 160 ? "Advanced" : totalScore >= 110 ? "Intermediate" : "Beginner";
      } else {
        leaderboard.push({
          nic: user.nic,
          name: user.name,
          score: totalScore,
          iqScore,
          gkScore,
          level: totalScore >= 160 ? "Advanced" : totalScore >= 110 ? "Intermediate" : "Beginner",
          avatar: user.name
        });
      }
      localStorage.setItem("globalLeaderboard", JSON.stringify(leaderboard));
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
    setRedirectCountdown(3);
  };

  const answeredCount = answers.filter((a) => a !== null).length;

  const paperMime = paperData ? paperData.split(';')[0].replace('data:', '') : '';
  const isPdf = paperMime === 'application/pdf';

  // ── PAPER VIEWER (inline, same tab) ──
  if (viewingPaper && paperData) {
    return (
      <div className="flex flex-col gap-0 w-full pb-0" style={{ minHeight: 'calc(100vh - 100px)' }}>
        {/* Top bar */}
        <div
          className="flex items-center justify-between gap-3 px-4 py-3 sticky top-[76px] z-30"
          style={{
            background: 'rgba(6,11,25,0.85)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(220,20,60,0.2)',
          }}
        >
          <button
            onClick={() => { setViewingPaper(false); window.scrollTo(0, 0); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#e2e8f0',
            }}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Answer Sheet
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 hidden sm:inline truncate max-w-[200px]">
              <FileText className="w-3 h-3 inline mr-1" />{paperName}
            </span>
            <button
              onClick={handleDownloadPaper}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{
                background: 'rgba(220,20,60,0.12)',
                border: '1px solid rgba(220,20,60,0.3)',
                color: '#DC143C',
              }}
            >
              <Download className="w-3.5 h-3.5" /> Download
            </button>
          </div>
        </div>

        {/* Paper content */}
        <div className="flex-1 w-full" style={{ minHeight: 'calc(100vh - 160px)' }}>
          {isPdf ? (
            <iframe
              src={paperData}
              title={`${type.toUpperCase()} Paper`}
              className="w-full border-0"
              style={{ minHeight: 'calc(100vh - 160px)', background: '#1a1a2e' }}
            />
          ) : (
            <div
              className="flex items-center justify-center p-6"
              style={{ minHeight: 'calc(100vh - 160px)', background: '#0a0a14' }}
            >
              <img
                src={paperData}
                alt={`${type.toUpperCase()} Paper`}
                className="max-w-full h-auto rounded-lg"
                style={{ maxHeight: 'calc(100vh - 200px)', boxShadow: '0 0 40px rgba(0,0,0,0.5)' }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 glass-panel hover:bg-slate-800 transition-colors rounded-xl">
            <ArrowLeft className="w-5 h-5 text-slate-300" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              {type === "iq" ? <Brain className="w-8 h-8 text-primary" /> : <Globe className="w-8 h-8 text-secondary" />}
              {type.toUpperCase()} <span className="text-slate-500">Answer Sheet</span>
            </h1>
            <p className="text-slate-500 mt-1">Submit your 50 answers for the {type.toUpperCase()} paper.</p>
          </div>
        </div>

        {paperName && (
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleViewPaper}
                disabled={!paperData}
                className="flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "rgba(30,41,59,0.8)", border: "1px solid rgba(100,116,139,0.4)", color: "#cbd5e1" }}
              >
                <Eye className="w-4 h-4" /> View Paper
              </button>
              <button
                onClick={handleDownloadPaper}
                disabled={!paperData}
                className="flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "rgba(220,20,60,0.1)", border: "1px solid rgba(220,20,60,0.3)", color: "#DC143C" }}
              >
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
            <p className="text-[10px] text-slate-600 flex items-center gap-1 pl-1">
              <FileText className="w-3 h-3" /> {paperName}
            </p>
          </div>
        )}
      </div>

      {submitted && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-8 text-center border-primary/30 relative overflow-hidden"
        >
          <h2 className="text-2xl font-bold mb-2">Paper Submitted!</h2>
          <p className="text-slate-500 mb-6">Your results have been recorded successfully.</p>
          
          <div className="flex items-center justify-center gap-8">
            <div className="flex flex-col items-center">
              <span className="text-6xl font-black text-primary">{score}</span>
              <span className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">Earned</span>
            </div>
            <div className="h-16 w-px bg-slate-800" />
            <div className="flex flex-col items-center">
              <span className="text-6xl font-black text-white">100</span>
              <span className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">Maximum</span>
            </div>
          </div>
          
          <div className="mt-8 flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 rounded-full border-2 border-t-primary border-r-primary border-b-transparent border-l-transparent animate-spin mb-2" />
            <p className="text-slate-400 text-sm font-medium">
              {type === "iq" 
                ? `Moving to GK in ${redirectCountdown ?? 3}s...` 
                : `Back to Dashboard in ${redirectCountdown ?? 3}s...`}
            </p>
          </div>
        </motion.div>
      )}

      {/* Progress Bar */}
      <div className="glass-panel p-4 sticky top-24 z-30 shadow-lg bg-slate-900/80 backdrop-blur-md border-slate-800">
        <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
          <span className="text-slate-500">Progress</span>
          <span className={clsx(type === "iq" ? "text-primary" : "text-secondary")}>{answeredCount} / 50</span>
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className={clsx("h-full transition-all duration-300", type === "iq" ? "bg-primary" : "bg-secondary")}
            style={{ width: `${(answeredCount / 50) * 100}%` }}
          />
        </div>
      </div>

      <div className="glass-panel p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-3">
          {Array.from({ length: 50 }).map((_, qIndex) => {
            const isCorrect = submitted && answers[qIndex] === correctAnswers[qIndex];
            const isWrong = submitted && answers[qIndex] !== null && answers[qIndex] !== correctAnswers[qIndex];

            return (
              <div key={qIndex} className="flex items-center gap-4 py-2 border-b border-slate-800/50 last:border-0">
                <div className="flex items-center gap-4">
                  <span className={clsx("font-black text-lg w-6", type === "iq" ? "text-slate-400" : "text-slate-900")}>{qIndex + 1}</span>
                </div>
                {submitted && (
                  <div className="w-4 flex justify-center">
                    {isCorrect ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-rose-500" />}
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  {OPTIONS.map((optText, optIndex) => {
                    const isSelected = answers[qIndex] === optIndex;
                    const isCorrectOption = submitted && correctAnswers[qIndex] === optIndex;
                    
                    return (
                      <label key={optIndex} className={clsx(
                        "relative flex items-center justify-center w-8 h-8 rounded-full border-2 cursor-pointer transition-all text-xs font-bold",
                        submitted ? "cursor-default" : "hover:border-slate-500",
                        isSelected && !submitted ? (type === "iq" ? "bg-primary border-primary text-white" : "bg-secondary border-secondary text-slate-900") : 
                        submitted && isCorrectOption ? "bg-emerald-500 border-emerald-500 text-white" :
                        submitted && isSelected && !isCorrectOption ? "bg-rose-500 border-rose-500 text-white" :
                        type === "iq" ? "border-slate-700 text-slate-500 bg-transparent" : "border-slate-300 text-slate-900 bg-slate-50"
                      )}>
                        <input type="radio" name={`q-${qIndex}`} checked={isSelected} onChange={() => handleSelect(qIndex, optIndex)} disabled={submitted || submissionsDisabled} className="hidden" />
                        <span>{optText}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!submitted && (
        <div className="flex justify-center mt-8 flex-col items-center gap-4">
          {submissionsDisabled && <div className="text-rose-400 font-bold text-sm bg-rose-500/10 px-4 py-2 rounded-lg border border-rose-500/20">Submissions closed.</div>}
          <button onClick={handleSubmit} disabled={submissionsDisabled} className={clsx("px-12 py-4 rounded-xl font-bold text-lg flex items-center gap-3 transition-all disabled:opacity-50", type === "iq" ? "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20" : "bg-secondary text-slate-900 hover:bg-secondary/90 shadow-lg shadow-secondary/20")}>
            <Send className="w-5 h-5" /> Submit {type.toUpperCase()} Answers
          </button>
        </div>
      )}
    </div>
  );
}

export default function EntryPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20 text-primary">Loading...</div>}>
      <EntryExamContent />
    </Suspense>
  );
}
