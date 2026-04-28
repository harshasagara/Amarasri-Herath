"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, ArrowLeft, Send, Brain, Globe, Eye, Download, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import clsx from "clsx";
import { supabase } from "@/lib/supabase/client";
import { addExamHistory } from "@/app/actions";

const OPTIONS = ["A", "B", "C", "D"];

function EntryExamContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = searchParams.get("type") === "gk" ? "gk" : "iq";
  
  const [answers, setAnswers] = useState<(number | null)[]>(Array(50).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState<number[]>(Array.from({ length: 50 }, (_, i) => (i * 3 + 1) % 4));
  const [submissionsDisabled, setSubmissionsDisabled] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);
  const [user, setUser] = useState<{nic: string, name: string, province: string, district: string, category: string} | null>(null);
  const [paperName, setPaperName] = useState<string | null>(null);
  const [paperData, setPaperData] = useState<string | null>(null);
  const [viewingPaper, setViewingPaper] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("studentUser");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      router.push("/");
    }
  }, [router]);

  useEffect(() => {
    if (!user) return;
    
    const checkSubmission = async () => {
      setLoading(true);
      // 1. Try local storage first for speed
      const localSubmitted = localStorage.getItem(`submitted${type.toUpperCase()}_${user.nic}`) === "true";
      if (localSubmitted) {
        const localScore = JSON.parse(localStorage.getItem(`studentScores_${user.nic}`) || "{}")[type] || 0;
        const localAnswers = JSON.parse(localStorage.getItem(`studentAnswers${type.toUpperCase()}_${user.nic}`) || "[]");
        setScore(localScore);
        if (localAnswers.length === 50) setAnswers(localAnswers);
        setSubmitted(true);
      }

      // 2. Sync with Supabase
      try {
        const { data, error } = await supabase
          .from('students_results')
          .select('iq_marks, gk_marks')
          .eq('nic', user.nic)
          .single();

        if (data) {
          const remoteScore = type === "iq" ? data.iq_marks : data.gk_marks;
          if (remoteScore !== null && remoteScore !== undefined) {
            setSubmitted(true);
            setScore(remoteScore);
            // Sync local storage if remote has it but local doesn't
            localStorage.setItem(`submitted${type.toUpperCase()}_${user.nic}`, "true");
            const scores = JSON.parse(localStorage.getItem(`studentScores_${user.nic}`) || "{}");
            scores[type] = remoteScore;
            localStorage.setItem(`studentScores_${user.nic}`, JSON.stringify(scores));
          }
        }
      } catch (err) {
        console.error("Sync Error:", err);
      } finally {
        setLoading(false);
      }
    };
    checkSubmission();

    const disabled = localStorage.getItem("submissionsDisabled") === "true";
    setSubmissionsDisabled(disabled);

    const paper = localStorage.getItem(`adminPaper${type.toUpperCase()}`);
    setPaperName(paper);
    const pdata = localStorage.getItem(`adminPaperData${type.toUpperCase()}`);
    setPaperData(pdata);

    window.scrollTo(0, 0);
  }, [type, user]);

  useEffect(() => {
    const keyName = type === "iq" ? "adminAnswerKeyIQ" : "adminAnswerKeyGK";
    const savedKey = localStorage.getItem(keyName);
    if (savedKey) setCorrectAnswers(JSON.parse(savedKey));
  }, [type]);

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

  const handleSubmit = async () => {
    if (!user) return;
    if (answers.some((a) => a === null)) {
      if (!window.confirm("You haven't answered all 50 questions. Are you sure you want to submit?")) return;
    }

    setSubmitting(true);
    let calculatedScore = 0;
    answers.forEach((ans, i) => {
      if (ans === correctAnswers[i]) calculatedScore += 2;
    });

    // 1. Save to local storage immediately
    localStorage.setItem(`submitted${type.toUpperCase()}_${user.nic}`, "true");
    localStorage.setItem(`studentAnswers${type.toUpperCase()}_${user.nic}`, JSON.stringify(answers));
    const scores = JSON.parse(localStorage.getItem(`studentScores_${user.nic}`) || "{}");
    scores[type] = calculatedScore;
    localStorage.setItem(`studentScores_${user.nic}`, JSON.stringify(scores));

    setScore(calculatedScore);
    setSubmitted(true);
    
    // 2. Save to Supabase
    try {
      const { data: existing } = await supabase
        .from('students_results')
        .select('*')
        .eq('nic', user.nic)
        .maybeSingle();

      let iqMarks = type === "iq" ? calculatedScore : (existing?.iq_marks || null);
      let gkMarks = type === "gk" ? calculatedScore : (existing?.gk_marks || null);
      let totalMarks = (iqMarks || 0) + (gkMarks || 0);

      const resultPayload = {
        nic: user.nic,
        name: user.name,
        province: user.province,
        district: user.district,
        category: user.category,
        iq_marks: iqMarks,
        gk_marks: gkMarks,
        total_marks: totalMarks,
        updated_at: new Date().toISOString()
      };

      if (existing) {
        await supabase.from('students_results').update(resultPayload).eq('nic', user.nic);
      } else {
        await supabase.from('students_results').insert(resultPayload);
      }

      await addExamHistory({
        nic: user.nic,
        exam_name: localStorage.getItem("adminExamName") || "General Mock Exam",
        type: type.toUpperCase(),
        score: calculatedScore,
        iq_score: iqMarks,
        gk_score: gkMarks,
        total_score: totalMarks,
        grade: calculatedScore >= 75 ? "A" : calculatedScore >= 65 ? "B" : calculatedScore >= 45 ? "C" : "S",
        created_at: new Date().toISOString()
      });

    } catch (err) {
      console.error("Submission Error:", err);
      alert("Error syncing with database. Your results are saved locally, but may not appear on the leaderboard yet.");
    } finally {
      setSubmitting(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setRedirectCountdown(3);
    }
  };

  const answeredCount = answers.filter((a) => a !== null).length;

  if (loading && !submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin mb-4" />
        <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Verifying Submission...</p>
      </div>
    );
  }

  if (viewingPaper && paperData) {
    return (
      <div className="flex flex-col gap-0 w-full pb-0" style={{ minHeight: 'calc(100vh - 100px)' }}>
        <div className="flex items-center justify-between gap-3 px-4 py-3 sticky top-[76px] z-30" style={{ background: 'rgba(6,11,25,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(220,20,60,0.2)' }}>
          <button onClick={() => { setViewingPaper(false); window.scrollTo(0, 0); }} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0' }}>
            <ArrowLeft className="w-4 h-4" /> Back to Answer Sheet
          </button>
          <div className="flex items-center gap-3 text-slate-500 text-xs font-bold truncate max-w-[200px]">
            <FileText className="w-3 h-3 inline mr-1" /> {paperName}
          </div>
        </div>
        <div className="flex-1 w-full bg-[#0a0a14]">
          <iframe src={paperData} className="w-full h-full border-0" style={{ minHeight: 'calc(100vh - 160px)' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full pb-20 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 glass-panel hover:bg-slate-800 transition-colors rounded-xl"><ArrowLeft className="w-5 h-5 text-slate-300" /></Link>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              {type === "iq" ? <Brain className="w-8 h-8 text-cyan-400" /> : <Globe className="w-8 h-8 text-fuchsia-400" />}
              {type.toUpperCase()} <span className="text-slate-500">Answer Sheet</span>
            </h1>
            <p className="text-slate-500 mt-1 font-bold text-xs uppercase tracking-widest">{user?.name} · {user?.nic}</p>
          </div>
        </div>

        {paperName && (
          <button onClick={() => setViewingPaper(true)} className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all flex items-center gap-2">
            <Eye className="w-4 h-4" /> View Paper
          </button>
        )}
      </div>

      {submitted && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-10 text-center border-emerald-500/30 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
          <h2 className="text-3xl font-black text-white tracking-tight mb-2">Assessment Completed</h2>
          <p className="text-slate-500 font-medium mb-8">Your results are recorded and synced with the cloud database.</p>
          
          <div className="flex items-center justify-center gap-12">
            <div className="flex flex-col items-center">
              <span className="text-6xl font-black text-emerald-400 tracking-tighter">{score}</span>
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-2">Score / 100</span>
            </div>
            <div className="h-16 w-px bg-white/5" />
            <div className="flex flex-col items-center">
              <span className="text-6xl font-black text-white/20 tracking-tighter">50</span>
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-2">Questions</span>
            </div>
          </div>
          
          <div className="mt-12 flex flex-col items-center gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-t-white border-r-white border-b-transparent border-l-transparent animate-spin mb-1" />
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
              {type === "iq" ? `Redirecting to GK in ${redirectCountdown ?? 3}s...` : `Returning to Dashboard in ${redirectCountdown ?? 3}s...`}
            </p>
          </div>
        </motion.div>
      )}

      {!submitted && (
        <>
          <div className="glass-panel p-5 sticky top-24 z-30 bg-slate-900/90 backdrop-blur-xl border-white/10 shadow-2xl">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] mb-3">
              <span className="text-slate-500">Progress</span>
              <span className={clsx(type === "iq" ? "text-cyan-400" : "text-fuchsia-400")}>{answeredCount} / 50 Answered</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className={clsx("h-full transition-all duration-500", type === "iq" ? "bg-cyan-500" : "bg-fuchsia-500")} style={{ width: `${(answeredCount / 50) * 100}%` }} />
            </div>
          </div>

          <div className="glass-panel p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-6">
              {Array.from({ length: 50 }).map((_, qIndex) => (
                <div key={qIndex} className="flex items-center gap-5 py-3 border-b border-white/5 last:border-0 group">
                  <span className="font-black text-xl text-white/10 group-hover:text-white/30 transition-colors w-8">{qIndex + 1}</span>
                  <div className="flex items-center gap-3">
                    {OPTIONS.map((optText, optIndex) => (
                      <label key={optIndex} className={clsx(
                        "w-9 h-9 rounded-full border-2 cursor-pointer transition-all flex items-center justify-center text-xs font-black",
                        answers[qIndex] === optIndex ? (type === "iq" ? "bg-cyan-500 border-cyan-500 text-white shadow-lg shadow-cyan-500/20" : "bg-fuchsia-500 border-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/20") : "border-white/10 text-white/40 hover:border-white/30 hover:text-white"
                      )}>
                        <input type="radio" name={`q-${qIndex}`} checked={answers[qIndex] === optIndex} onChange={() => handleSelect(qIndex, optIndex)} className="hidden" />
                        {optText}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 flex justify-center">
              <button 
                onClick={handleSubmit} 
                disabled={submitting}
                className={clsx("px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-2xl active:scale-[0.98] flex items-center gap-3", type === "iq" ? "bg-cyan-500 text-white hover:bg-cyan-400" : "bg-fuchsia-500 text-white hover:bg-fuchsia-400")}
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                Complete Assessment
              </button>
            </div>
          </div>
        </>
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
