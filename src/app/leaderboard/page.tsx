"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { getAdminRankings, getSystemConfig } from "@/app/actions";
import { StudentResult } from "@/types";
import { PROVINCES, DISTRICTS } from "@/lib/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Trophy, MapPin, Globe, Building2, Brain, BookOpen, SlidersHorizontal, Search as SearchIcon } from "lucide-react";
import { SubjectAutocomplete } from "@/components/SubjectAutocomplete";
import { cn } from "@/lib/utils";

const RANK_STYLES = [
  { bg: "from-amber-400 to-yellow-500", shadow: "shadow-amber-500/40", text: "text-amber-400", badge: "bg-amber-400/20 text-amber-300 border border-amber-400/30" },
  { bg: "from-slate-300 to-slate-400", shadow: "shadow-slate-400/30", text: "text-slate-300", badge: "bg-slate-400/20 text-slate-300 border border-slate-400/30" },
  { bg: "from-orange-400 to-amber-500", shadow: "shadow-orange-400/30", text: "text-orange-400", badge: "bg-orange-400/20 text-orange-300 border border-orange-400/30" },
];

export default function Leaderboard() {
  const [activeScope, setActiveScope] = useState("island");
  const [activeBasis, setActiveBasis] = useState("total");
  const [data, setData] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [rankingMode, setRankingMode] = useState<string>("general");
  const [viewRankings, setViewRankings] = useState<boolean>(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    let filterProvince = undefined;
    let filterDistrict = undefined;

    if (activeScope === "province") filterProvince = selectedProvince || PROVINCES[0];
    if (activeScope === "district") filterDistrict = selectedDistrict || DISTRICTS[0];
    
    const sortBy = activeBasis === "iq" ? "iq_marks" : (activeBasis === "gk" ? "gk_marks" : "total_marks");

    const response = await getAdminRankings({
      subject: (selectedSubject && selectedSubject !== "ALL_SUBJECTS") ? selectedSubject : undefined,
      province: filterProvince,
      district: filterDistrict,
      category: selectedCategory,
      sortBy
    });

    if (response.success) setData(response.data || []);
    setLoading(false);
  }, [activeScope, activeBasis, selectedProvince, selectedDistrict, selectedSubject, selectedCategory]);

  useEffect(() => {
    const init = async () => {
      const config = await getSystemConfig();
      if (config.ranking_mode) setRankingMode(config.ranking_mode);
      setViewRankings(config.view_rankings);
      fetchData();
    };
    init();

    const channel = supabase
      .channel('public-leaderboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students_results' }, () => { fetchData(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_config' }, (payload: { new: { ranking_mode?: string; view_rankings?: boolean } }) => {
        if (payload.new) {
          if (payload.new.ranking_mode) setRankingMode(payload.new.ranking_mode);
          if (payload.new.view_rankings !== undefined) setViewRankings(payload.new.view_rankings);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const rankedData = useMemo(() => {
    const groups: (Omit<StudentResult, 'nic' | 'subject'>)[] = [];
    const nameMap = new Map<string, number>();
    data.forEach((student: StudentResult) => {
      const key = `${student.nic}-${student.category}`;
      if (!nameMap.has(key)) {
        nameMap.set(key, groups.length);
        const { nic, subject, ...safeStudent } = student;
        groups.push(safeStudent);
      }
    });

    let lastScore = -1;
    let lastRank = 1;
    return groups.map((student: Omit<StudentResult, 'nic' | 'subject'>, index) => {
      const currentScore = activeBasis === "iq" ? (student as any).iq_marks :
        activeBasis === "gk" ? (student as any).gk_marks : (student as any).total_marks;
      if (currentScore !== lastScore) { lastRank = index + 1; lastScore = currentScore; }
      return { ...student, rank: lastRank };
    });
  }, [data, activeBasis]);

  const TABS = [
    { v: "island", l: "Island", icon: Globe, type: 'scope' },
    { v: "province", l: "Province", icon: MapPin, type: 'scope' },
    { v: "district", l: "District", icon: Building2, type: 'scope' },
    { v: "iq", l: "IQ", icon: Brain, type: 'basis' },
    { v: "gk", l: "GK", icon: BookOpen, type: 'basis' },
  ];

  const handleTabClick = (tab: any) => {
    if (tab.type === 'scope') {
      setActiveScope(tab.v);
      setActiveBasis("total"); // Default to total when switching levels
    } else {
      setActiveBasis(tab.v);
    }
  };

  if (!viewRankings) {
    return (
      <div className="w-full max-w-2xl mx-auto py-24 px-6 text-center">
        <div className="relative rounded-3xl p-16 border border-white/10 bg-white/5 backdrop-blur-xl flex flex-col items-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-violet-500/5" />
          <div className="relative z-10">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center mx-auto mb-8">
              <Trophy className="w-10 h-10 text-white/20" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight mb-4">Leaderboard Hidden</h2>
            <p className="text-white/40 font-medium leading-relaxed">The public leaderboard is currently restricted by the administrator.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-8 md:py-12 px-4 md:px-6">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 mb-2">MeritView AI</p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
            Student <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">Leaderboard</span>
          </h1>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live Rankings
        </div>
      </div>

      <div className="space-y-5">
        <div className="w-full max-w-4xl mx-auto mb-10 p-1.5 rounded-2xl bg-white/[0.12] border border-white/30 backdrop-blur-md grid grid-cols-6 md:flex items-center justify-between gap-1 shadow-2xl shadow-black/40">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.type === 'scope' ? (activeScope === tab.v && activeBasis === 'total') : (activeBasis === tab.v);
            return (
              <button
                key={tab.v}
                onClick={() => handleTabClick(tab)}
                className={cn(
                  "relative flex-1 flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all min-w-[80px]",
                  tab.v === "iq" || tab.v === "gk" ? "col-span-3 md:col-span-1" : "col-span-2 md:col-span-1",
                  isActive ? "text-white" : "text-white/85 hover:text-white"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="lbActiveTab"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 shadow-lg shadow-cyan-500/25"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <Icon className="w-3 h-3 relative z-10" />
                <span className="relative z-10">{tab.l}</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-30">
          <div className="relative z-30 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-5 hover:border-cyan-500/30 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Brain className="w-3 h-3 text-cyan-400" />
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white/50">Subject</p>
            </div>
            <SubjectAutocomplete
              defaultValue={selectedSubject}
              onSelect={setSelectedSubject}
              showAllOption={true}
              placeholder="All Subjects"
              className="h-11 border border-white/10 rounded-xl bg-white/5 text-white focus:bg-white/10 transition-all"
            />
          </div>

          <div className={cn(
            "relative z-20 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-5 transition-all",
            (activeScope !== 'island') ? "hover:border-violet-500/30" : "opacity-30 pointer-events-none"
          )}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <MapPin className="w-3 h-3 text-violet-400" />
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white/50">
                {activeScope === 'province' ? "Province" : activeScope === 'district' ? "District" : "Location"}
              </p>
            </div>
            <Select
              value={activeScope === 'province' ? selectedProvince : selectedDistrict}
              onValueChange={activeScope === 'province' ? setSelectedProvince : setSelectedDistrict}
              disabled={activeScope === 'island'}
            >
              <SelectTrigger className="h-11 rounded-xl border border-white/10 bg-white/5 font-bold text-white/80 shadow-none">
                <SelectValue placeholder={activeScope === 'province' ? "Choose Province" : activeScope === 'district' ? "Choose District" : "Islandwide View"} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-white/10 bg-slate-900 text-white shadow-2xl">
                {(activeScope === 'province' ? PROVINCES : DISTRICTS).map((item) => (
                  <SelectItem key={item} value={item} className="text-white/70 focus:bg-white/10 focus:text-white">{item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="relative z-10 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-5 hover:border-emerald-500/30 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <SlidersHorizontal className="w-3 h-3 text-emerald-400" />
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white/50">Category</p>
            </div>
            <div className="flex bg-black/30 p-1 rounded-xl border border-white/5 h-11">
              {["ALL", "Open", "limited"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "flex-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                    selectedCategory === cat
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20"
                      : "text-white/30 hover:text-white/60"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-panel p-1 border-white/10 min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Updating Leaderboard...</p>
            </div>
          ) : rankedData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                <SearchIcon className="w-8 h-8 text-white/20" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">No Results Found</h3>
              <p className="text-white/30 text-sm font-medium">Try adjusting your filters to find candidates.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
                {rankedData.slice(0, 3).map((student, idx) => (
                  <motion.div
                    key={student.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="relative group"
                  >
                    <div className={cn("absolute inset-0 rounded-[32px] blur-xl opacity-20 group-hover:opacity-40 transition-opacity bg-gradient-to-r", RANK_STYLES[idx].bg)} />
                    <div className="relative h-full glass-panel p-6 border-white/10 flex flex-col items-center text-center">
                      <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-2xl relative", RANK_STYLES[idx].bg)}>
                        <Trophy className="w-8 h-8 text-slate-900" />
                        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-xs font-black text-white">
                          #{student.rank}
                        </div>
                      </div>
                      <h4 className="text-lg font-black text-white mb-1">{student.name}</h4>
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">{student.district} · {student.province}</p>
                      
                      <div className="mt-auto w-full pt-4 border-t border-white/5 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                           <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{activeBasis === 'total' ? 'Total' : activeBasis.toUpperCase()} Score</span>
                           <span className={cn("text-xl font-black tabular-nums", RANK_STYLES[idx].text)}>
                              {activeBasis === "iq" ? student.iq_marks : activeBasis === "gk" ? student.gk_marks : student.total_marks}
                           </span>
                        </div>
                        <div className={cn("py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.15em]", RANK_STYLES[idx].badge)}>
                           {activeScope.toUpperCase()} RANK #{student.rank}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="p-4 space-y-2">
                {rankedData.slice(3).map((student, idx) => (
                  <motion.div
                    key={student.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (idx % 10) * 0.05 }}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center font-black text-white/30 text-sm tabular-nums group-hover:text-white transition-colors">
                      #{student.rank}
                    </div>
                    
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-black text-white text-sm truncate">{student.name}</p>
                        <span className={cn(
                          "flex-shrink-0 px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-tight",
                          student.category === 'limited' ? "bg-violet-500/20 text-violet-300" : "bg-cyan-500/20 text-cyan-300"
                        )}>
                          {student.category}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-white/30 uppercase tracking-wide mt-0.5">
                        {student.district} · {student.province}
                      </p>
                    </div>

                    <div className="flex-shrink-0 flex items-center gap-6">
                      <div className="hidden sm:flex flex-col items-end">
                         <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">
                            {activeBasis === 'total' ? 'Total Merit' : activeBasis.toUpperCase()}
                         </span>
                         <span className="font-black text-white/80 tabular-nums">
                            {activeBasis === "iq" ? student.iq_marks : activeBasis === "gk" ? student.gk_marks : student.total_marks}
                         </span>
                      </div>
                      <div className="px-4 py-1.5 rounded-xl bg-white/10 text-white/70 font-black text-base tabular-nums">
                        #{student.rank}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
