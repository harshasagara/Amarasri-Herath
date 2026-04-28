
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { getAdminRankings, getSystemConfig } from "@/app/actions";
import { StudentResult } from "@/types";
import { PROVINCES, DISTRICTS } from "@/lib/constants";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Trophy, MapPin, Search as SearchIcon, Globe, Building2, Brain, BookOpen, SlidersHorizontal } from "lucide-react";
import { SubjectAutocomplete } from "@/components/SubjectAutocomplete";
import { cn } from "@/lib/utils";

const RANK_STYLES = [
  { bg: "from-amber-400 to-yellow-500", shadow: "shadow-amber-500/40", text: "text-amber-400", badge: "bg-amber-400/20 text-amber-300 border border-amber-400/30" },
  { bg: "from-slate-300 to-slate-400", shadow: "shadow-slate-400/30", text: "text-slate-300", badge: "bg-slate-400/20 text-slate-300 border border-slate-400/30" },
  { bg: "from-orange-400 to-amber-500", shadow: "shadow-orange-400/30", text: "text-orange-400", badge: "bg-orange-400/20 text-orange-300 border border-orange-400/30" },
];

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState("island");
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
    let sortBy: "total_marks" | "iq_marks" | "gk_marks" = "total_marks";
    let filterProvince = undefined;
    let filterDistrict = undefined;

    if (activeTab.includes("province")) filterProvince = selectedProvince || PROVINCES[0];
    if (activeTab.includes("district")) filterDistrict = selectedDistrict || DISTRICTS[0];
    if (activeTab === "iq_ranking") sortBy = "iq_marks";
    if (activeTab === "gk_ranking") sortBy = "gk_marks";

    const response = await getAdminRankings({
      subject: (selectedSubject && selectedSubject !== "ALL_SUBJECTS") ? selectedSubject : undefined,
      province: filterProvince,
      district: filterDistrict,
      category: selectedCategory,
      sortBy
    });

    if (response.success) setData(response.data || []);
    setLoading(false);
  }, [activeTab, selectedProvince, selectedDistrict, selectedSubject, selectedCategory]);

  useEffect(() => {
    const checkConfig = async () => {
      const config = await getSystemConfig();
      if (config.ranking_mode) setRankingMode(config.ranking_mode);
      setViewRankings(config.view_rankings);
    };
    checkConfig();
    fetchData();

    const channel = supabase
      .channel('public-leaderboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students_results' }, () => { fetchData(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_config' }, (payload: any) => {
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
    return groups.map((student: any, index) => {
      const currentScore = activeTab === "iq_ranking" ? student.iq_marks :
        activeTab === "gk_ranking" ? student.gk_marks : student.total_marks;
      if (currentScore !== lastScore) { lastRank = index + 1; lastScore = currentScore; }
      return { ...student, rank: lastRank };
    });
  }, [data, activeTab]);

  const needsProvinceFilter = activeTab === "province";
  const needsDistrictFilter = activeTab === "district";

  const TABS = [
    { v: "island", l: "Island", icon: Globe },
    { v: "province", l: "Province", icon: MapPin },
    { v: "district", l: "District", icon: Building2 },
    { v: "iq_ranking", l: "IQ", icon: Brain },
    { v: "gk_ranking", l: "GK", icon: BookOpen },
  ];

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
      {/* Header */}
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
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.v;
            return (
              <button
                key={tab.v}
                onClick={() => setActiveTab(tab.v)}
                className={cn(
                  "relative flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all min-w-[70px]",
                  isActive ? "text-white" : "text-white/30 hover:text-white/60"
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

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Subject */}
          <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-5 hover:border-cyan-500/30 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <BookOpen className="w-3 h-3 text-cyan-400" />
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

          {/* Location */}
          <div className={cn(
            "rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-5 transition-all",
            (needsProvinceFilter || needsDistrictFilter) ? "hover:border-violet-500/30" : "opacity-30 pointer-events-none"
          )}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <MapPin className="w-3 h-3 text-violet-400" />
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white/50">
                {needsProvinceFilter ? "Province" : needsDistrictFilter ? "District" : "Location"}
              </p>
            </div>
            <Select
              value={needsProvinceFilter ? selectedProvince : selectedDistrict}
              onValueChange={needsProvinceFilter ? setSelectedProvince : setSelectedDistrict}
              disabled={!needsProvinceFilter && !needsDistrictFilter}
            >
              <SelectTrigger className="h-11 rounded-xl border border-white/10 bg-white/5 font-bold text-white/80 shadow-none">
                <SelectValue placeholder={needsProvinceFilter ? "Choose Province" : needsDistrictFilter ? "Choose District" : "Select tab first"} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-white/10 bg-slate-900 text-white shadow-2xl">
                {(needsProvinceFilter ? PROVINCES : DISTRICTS).map((item) => (
                  <SelectItem key={item} value={item} className="text-white/70 focus:bg-white/10 focus:text-white">{item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-5 hover:border-emerald-500/30 transition-all">
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
                  {cat === "ALL" ? "All" : cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm overflow-hidden">
          {/* Table Header Bar */}
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
              Results · <span className="text-cyan-400">{rankedData.length} Candidates</span>
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-28 gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
              </div>
              <p className="font-black text-white/30 uppercase tracking-widest text-[10px]">Computing Ranks...</p>
            </div>
          ) : rankedData.length === 0 ? (
            <div className="text-center py-24 px-10">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-5">
                <SearchIcon className="w-7 h-7 text-white/20" />
              </div>
              <h3 className="text-xl font-black text-white/60">No Results Found</h3>
              <p className="text-white/30 mt-2 font-medium text-sm">Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="w-full">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-white/10 hover:bg-transparent">
                      <TableHead className="w-[100px] text-center font-black uppercase tracking-widest text-[9px] py-5 text-white/30">Rank</TableHead>
                      <TableHead className="font-black uppercase tracking-widest text-[9px] text-white/30">Candidate</TableHead>
                      <TableHead className="font-black uppercase tracking-widest text-[9px] text-white/30">Location</TableHead>
                      <TableHead className="text-right font-black uppercase tracking-widest text-[9px] pr-10 text-white/30">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {rankedData.map((student, index) => {
                        const rs = RANK_STYLES[student.rank - 1];
                        return (
                          <motion.tr
                            key={index}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className={cn(
                              "group border-b border-white/5 last:border-0 transition-colors",
                              student.rank === 1 ? "bg-amber-500/5 hover:bg-amber-500/10" :
                              student.rank === 2 ? "bg-slate-400/5 hover:bg-slate-400/10" :
                              student.rank === 3 ? "bg-orange-400/5 hover:bg-orange-400/10" :
                              "hover:bg-white/5"
                            )}
                          >
                            <TableCell className="py-6">
                              <div className="flex justify-center">
                                {student.rank <= 3 ? (
                                  <div className={cn(
                                    "relative w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-sm shadow-xl bg-gradient-to-br",
                                    rs.bg, rs.shadow
                                  )}>
                                    <span>#{student.rank}</span>
                                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-950 border border-white/10 flex items-center justify-center">
                                      <Trophy className={cn("w-2.5 h-2.5", rs.text)} />
                                    </div>
                                  </div>
                                ) : (
                                  <span className="font-black text-white/30 text-lg tabular-nums">{student.rank}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-black text-white/60">
                                    {student.name?.charAt(0)?.toUpperCase() ?? "?"}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-black text-white text-base tracking-tight group-hover:text-cyan-300 transition-colors">
                                    {student.name}
                                  </p>
                                  {rankingMode === 'general' && (
                                    <span className={cn(
                                      "inline-block px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider mt-0.5",
                                      student.category === 'limited'
                                        ? "bg-violet-500/20 text-violet-300 border border-violet-500/20"
                                        : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/20"
                                    )}>
                                      {student.category}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm font-bold text-white/70">{student.district}</p>
                              <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mt-0.5">{student.province}</p>
                            </TableCell>
                            <TableCell className="text-right pr-10">
                              <span className={cn(
                                "inline-block py-1.5 px-5 rounded-xl font-black text-xl tabular-nums",
                                student.rank === 1 ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 shadow-lg shadow-amber-500/30" :
                                student.rank === 2 ? "bg-gradient-to-r from-slate-300 to-slate-400 text-slate-900 shadow-lg shadow-slate-400/20" :
                                student.rank === 3 ? "bg-gradient-to-r from-orange-400 to-amber-500 text-slate-900 shadow-lg shadow-orange-400/20" :
                                "bg-white/10 text-white/80 group-hover:bg-cyan-500/20 group-hover:text-cyan-300 transition-all"
                              )}>
                                {activeTab === "iq_ranking" ? student.iq_marks :
                                  activeTab === "gk_ranking" ? student.gk_marks :
                                    student.total_marks}
                              </span>
                            </TableCell>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-white/5">
                {rankedData.map((student, index) => {
                  const rs = RANK_STYLES[student.rank - 1];
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className={cn(
                        "p-4 flex items-center gap-4 transition-colors",
                        student.rank === 1 ? "bg-amber-500/5" :
                        student.rank === 2 ? "bg-slate-400/5" :
                        student.rank === 3 ? "bg-orange-400/5" : ""
                      )}
                    >
                      <div className="flex-shrink-0 w-12 flex justify-center">
                        {student.rank <= 3 ? (
                          <div className={cn(
                            "w-11 h-11 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-lg bg-gradient-to-br",
                            rs.bg
                          )}>
                            #{student.rank}
                          </div>
                        ) : (
                          <span className="font-black text-lg text-white/30 tabular-nums">{student.rank}</span>
                        )}
                      </div>

                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-black text-white text-sm truncate">{student.name}</p>
                          {rankingMode === 'general' && (
                            <span className={cn(
                              "flex-shrink-0 px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-tight",
                              student.category === 'limited'
                                ? "bg-violet-500/20 text-violet-300"
                                : "bg-cyan-500/20 text-cyan-300"
                            )}>
                              {student.category}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-wide mt-0.5">
                          {student.district} · {student.province}
                        </p>
                      </div>

                      <div className="flex-shrink-0">
                        <div className={cn(
                          "px-4 py-1.5 rounded-xl font-black text-base tabular-nums",
                          student.rank === 1 ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900" :
                          student.rank === 2 ? "bg-gradient-to-r from-slate-300 to-slate-400 text-slate-900" :
                          student.rank === 3 ? "bg-gradient-to-r from-orange-400 to-amber-500 text-slate-900" :
                          "bg-white/10 text-white/70"
                        )}>
                          {activeTab === "iq_ranking" ? student.iq_marks :
                            activeTab === "gk_ranking" ? student.gk_marks :
                              student.total_marks}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
