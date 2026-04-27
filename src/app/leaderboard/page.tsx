"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { 
  Trophy, 
  Search, 
  ChevronDown, 
  Filter, 
  Globe, 
  MapPin, 
  BookOpen, 
  Search as SearchIcon,
  Check,
  Award,
  Medal,
  RefreshCw,
  X,
  LayoutGrid,
  Table as TableIcon,
  Monitor,
  Smartphone
} from "lucide-react";
import clsx from "clsx";
import { supabase } from "@/lib/supabase";
import { PROVINCES, PROVINCE_DISTRICTS, ALL_DISTRICTS } from "@/lib/regions";

// --- Constants & Data ---

const SUBJECTS = [
  "Mathematics", "Science", "English", "Sinhala", "Tamil", "History", "Geography", 
  "Economics", "Accounting", "ICT", "Civics", "Buddhism", "Christianity", "Islam", 
  "Hinduism", "Agriculture", "Art", "Music", "Dancing", "Health Science", 
  "Political Science", "Business Studies", "Psychology", "Sociology", "Statistics"
];

interface StudentEntry {
  id: string;
  child_name: string;
  nic_number: string;
  province: string;
  district: string;
  subject: string;
  iq_score: number;
  gk_score: number;
  timestamp: string;
  rank?: number;
}

// --- Components ---

const Dropdown = ({ label, options, value, onChange, icon: Icon, prominent = false }: any) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative group flex-1 min-w-[140px]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl transition-all duration-300",
          "border backdrop-blur-md shadow-sm",
          prominent 
            ? "bg-blue-600/10 border-blue-500/30 text-blue-400 hover:bg-blue-600/20" 
            : "bg-slate-900/40 border-white/5 text-slate-300 hover:bg-slate-900/60"
        )}
      >
        <div className="flex items-center gap-2 text-sm font-semibold truncate">
          {Icon && <Icon className="w-4 h-4 opacity-70 shrink-0" />}
          <span className="truncate">{value || label}</span>
        </div>
        <ChevronDown className={clsx("w-4 h-4 transition-transform duration-300 shrink-0", isOpen && "rotate-180")} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute left-0 right-0 mt-2 z-30 max-h-60 overflow-y-auto glass-panel border-white/10 shadow-2xl p-1 custom-scrollbar bg-slate-900/95"
            >
              {options.map((opt: string) => (
                <button
                  key={opt}
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                  }}
                  className={clsx(
                    "w-full text-left px-4 py-2.5 rounded-xl text-sm transition-colors mb-0.5",
                    value === opt ? "bg-blue-600/20 text-blue-400 font-bold" : "text-slate-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {opt}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const StyledToggle = ({ label, active, onToggle, color = "blue" }: any) => (
  <button
    onClick={onToggle}
    className="flex items-center gap-3 group px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all duration-300"
  >
    <div className={clsx(
      "w-9 h-5 rounded-full relative transition-all duration-500 ease-out",
      active ? (color === "blue" ? "bg-blue-600" : "bg-indigo-600") : "bg-slate-800"
    )}>
      <div className={clsx(
        "absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-500 ease-out shadow-lg",
        active ? "left-5" : "left-1"
      )} />
    </div>
    <span className={clsx(
      "text-[11px] font-black uppercase tracking-widest transition-colors",
      active ? "text-white" : "text-slate-500"
    )}>
      {label}
    </span>
  </button>
);

const FilterBadge = ({ label, value, onRemove }: any) => {
  if (!value || value === "Province" || value === "District" || value === "Island (Global)") return null;
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-wider"
    >
      <span>{label}: {value}</span>
      <button onClick={onRemove} className="hover:text-white transition-colors">
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  );
};

export default function LeaderboardPage() {
  const [data, setData] = useState<StudentEntry[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    province: "Province",
    district: "District",
    subject: "Mathematics"
  });
  const [toggles, setToggles] = useState({ iq: true, gk: true });
  const [loading, setLoading] = useState(true);
  const [isLandscape, setIsLandscape] = useState(false);

  // Check orientation for landscape optimization
  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight && window.innerWidth < 1024);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const { data: lbData, error } = await supabase
        .from('children_scores')
        .select('*')
        .order('iq_score', { ascending: false }); // Default sorting

      if (error) throw error;

      if (lbData) {
        // Calculate ranks based on total score (IQ + GK)
        const sortedData = lbData.map((item: any) => ({
          ...item,
          total_score: (item.iq_score || 0) + (item.gk_score || 0)
        })).sort((a, b) => b.total_score - a.total_score);

        const formattedData = sortedData.map((item: any, idx: number) => ({
          ...item,
          rank: idx + 1
        }));
        
        setData(formattedData);
      }
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();

    // Set up real-time subscription
    const channel = supabase
      .channel('leaderboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'children_scores' }, () => {
        fetchLeaderboard();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = item.child_name.toLowerCase().includes(search.toLowerCase()) || 
                           item.nic_number.toLowerCase().includes(search.toLowerCase());
      const matchesSubject = item.subject === filters.subject;
      const matchesProvince = filters.province === "Province" || item.province === filters.province;
      const matchesDistrict = filters.district === "District" || item.district === filters.district;
      
      return matchesSearch && matchesSubject && matchesProvince && matchesDistrict;
    });
  }, [data, search, filters]);

  const getRankBadge = (rank: number) => {
    switch(rank) {
      case 1: return <div className="w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center text-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)] ring-1 ring-yellow-500/20"><Trophy className="w-6 h-6" /></div>;
      case 2: return <div className="w-10 h-10 rounded-xl bg-slate-300/20 border border-slate-300/50 flex items-center justify-center text-slate-300 shadow-[0_0_20px_rgba(203,213,225,0.2)] ring-1 ring-slate-300/20"><Medal className="w-6 h-6" /></div>;
      case 3: return <div className="w-10 h-10 rounded-xl bg-orange-600/20 border border-orange-600/50 flex items-center justify-center text-orange-500 shadow-[0_0_20px_rgba(234,88,12,0.2)] ring-1 ring-orange-600/20"><Award className="w-6 h-6" /></div>;
      default: return <div className="w-10 h-10 flex items-center justify-center font-mono font-black text-slate-500 text-lg opacity-40">#{rank}</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200 pb-20 font-sans selection:bg-blue-500/30">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 md:px-8 pt-8 md:pt-12 space-y-8">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-8"
        >
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Real-time Analytics
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-none">
              Student <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-400">Leaderboard</span>
            </h1>
            <p className="text-slate-500 font-medium text-lg max-w-2xl">Visualizing academic excellence and performance across the island.</p>
          </div>

          <div className="relative w-full lg:w-[400px] group">
            <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-all duration-300" />
            <input 
              type="text"
              placeholder="Search Name or NIC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all backdrop-blur-xl shadow-inner placeholder:text-slate-600"
            />
          </div>
        </motion.div>

        {/* Filter & Control Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-6 border-white/[0.03] bg-slate-900/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-6"
        >
          <div className="flex flex-col xl:flex-row gap-6">
            {/* Location Selectors */}
            <div className="flex flex-wrap gap-4 flex-1">
              <Dropdown 
                label="Province" 
                options={["Province", ...PROVINCES]} 
                value={filters.province} 
                onChange={(v: string) => setFilters({...filters, province: v, district: "District"})} 
                icon={Globe}
              />
              <Dropdown 
                label="District" 
                options={["District", ...(filters.province === "Province" ? ALL_DISTRICTS : (PROVINCE_DISTRICTS[filters.province] || []))]} 
                value={filters.district} 
                onChange={(v: string) => setFilters({...filters, district: v})} 
                icon={MapPin}
              />
              <div className="w-full sm:w-auto xl:w-80">
                <Dropdown 
                  label="Subject" 
                  options={SUBJECTS} 
                  value={filters.subject} 
                  onChange={(v: string) => setFilters({...filters, subject: v})} 
                  icon={BookOpen}
                  prominent={true}
                />
              </div>
            </div>

            {/* View Controls & Refresh */}
            <div className="flex items-center gap-4 border-l border-white/5 pl-0 xl:pl-6">
              <StyledToggle 
                label="IQ" 
                active={toggles.iq} 
                onToggle={() => setToggles({...toggles, iq: !toggles.iq})} 
                color="blue"
              />
              <StyledToggle 
                label="GK" 
                active={toggles.gk} 
                onToggle={() => setToggles({...toggles, gk: !toggles.gk})} 
                color="indigo"
              />
              <button 
                onClick={fetchLeaderboard}
                className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all duration-300"
              >
                <RefreshCw className={clsx("w-5 h-5", loading && "animate-spin")} />
              </button>
            </div>
          </div>

          {/* Active Filters UI */}
          <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-white/[0.03]">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2 flex items-center gap-2">
              <Filter className="w-3 h-3" />
              Active Filters:
            </div>
            <AnimatePresence mode="popLayout">
              <FilterBadge label="Subject" value={filters.subject} onRemove={() => setFilters({...filters, subject: "Mathematics"})} />
              <FilterBadge label="Province" value={filters.province} onRemove={() => setFilters({...filters, province: "Province", district: "District"})} />
              <FilterBadge label="District" value={filters.district} onRemove={() => setFilters({...filters, district: "District"})} />
              {search && <FilterBadge label="Search" value={search} onRemove={() => setSearch("")} />}
            </AnimatePresence>
            {!search && filters.province === "Province" && filters.district === "District" && (
              <span className="text-[10px] font-bold text-slate-700 italic">None active (Showing Island-wide)</span>
            )}
          </div>
        </motion.div>

        {/* Main Table Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={clsx(
            "glass-panel border-white/[0.03] overflow-hidden bg-slate-900/40 shadow-2xl transition-all duration-700",
            isLandscape ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-transparent border-0 shadow-none" : "overflow-x-auto custom-scrollbar"
          )}
        >
          {isLandscape ? (
            // Specialized Grid View for Landscape Mode
            <LayoutGroup>
              <AnimatePresence mode="popLayout">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={`skeleton-${i}`} className="h-40 rounded-3xl bg-slate-900/50 animate-pulse border border-white/5" />
                  ))
                ) : filteredData.length > 0 ? (
                  filteredData.map((student, idx) => (
                    <motion.div 
                      key={student.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.4, delay: idx * 0.05 }}
                      className="glass-panel p-5 space-y-4 border-white/[0.05] group hover:border-blue-500/30 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          {getRankBadge(student.rank || 0)}
                          <div>
                            <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors truncate max-w-[120px]">{student.child_name}</h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{student.nic_number}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-white">{(student.iq_score || 0) + (student.gk_score || 0)}</span>
                          <p className="text-[10px] font-black text-blue-500 uppercase">Total Score</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                        {toggles.iq && (
                          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                            <p className="text-[9px] font-black text-slate-500 uppercase mb-1">IQ Score</p>
                            <p className="text-lg font-black text-slate-200">{student.iq_score}</p>
                          </div>
                        )}
                        {toggles.gk && (
                          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                            <p className="text-[9px] font-black text-slate-500 uppercase mb-1">GK Score</p>
                            <p className="text-lg font-black text-slate-200">{student.gk_score}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                ) : null}
              </AnimatePresence>
            </LayoutGroup>
          ) : (
            // Standard Table View
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-950/60 border-b border-white/[0.03] sticky top-0 z-10 backdrop-blur-2xl">
                  <th className="px-8 py-6 text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Rank</th>
                  <th className="px-8 py-6 text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Candidate Info</th>
                  <th className="px-8 py-6 text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Region Details</th>
                  <AnimatePresence mode="popLayout">
                    {toggles.iq && (
                      <motion.th 
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="px-8 py-6 text-xs font-black text-slate-500 uppercase tracking-[0.2em]"
                      >
                        IQ Score
                      </motion.th>
                    )}
                    {toggles.gk && (
                      <motion.th 
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="px-8 py-6 text-xs font-black text-slate-500 uppercase tracking-[0.2em]"
                      >
                        GK Score
                      </motion.th>
                    )}
                  </AnimatePresence>
                  <th className="px-8 py-6 text-xs font-black text-slate-500 uppercase tracking-[0.2em] text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                <AnimatePresence mode="popLayout">
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={`skeleton-${i}`} className="animate-pulse">
                        <td colSpan={6} className="px-8 py-8">
                          <div className="h-6 bg-slate-800/50 rounded-xl w-full" />
                        </td>
                      </tr>
                    ))
                  ) : filteredData.length > 0 ? (
                    filteredData.map((student, idx) => (
                      <motion.tr 
                        key={student.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.3, delay: idx * 0.02 }}
                        className={clsx(
                          "group hover:bg-blue-600/[0.03] transition-all duration-500 relative",
                          student.rank && student.rank <= 3 && "bg-white/[0.01]"
                        )}
                      >
                        <td className="px-8 py-8">
                          {getRankBadge(student.rank || 0)}
                        </td>
                        <td className="px-8 py-8">
                          <div className="space-y-1">
                            <span className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors block leading-tight">
                              {student.child_name}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{student.nic_number}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-700" />
                              <span className="text-[10px] font-bold text-blue-500/70">{student.subject}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-8">
                          <div className="space-y-0.5">
                            <span className="text-sm font-bold text-slate-200 block">{student.district}</span>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.1em]">{student.province} Province</span>
                          </div>
                        </td>
                        <AnimatePresence mode="popLayout">
                          {toggles.iq && (
                            <motion.td 
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="px-8 py-8"
                            >
                              <div className="px-4 py-2 rounded-xl bg-blue-500/5 border border-blue-500/10 inline-block">
                                <span className="text-lg font-black text-blue-400">{student.iq_score}</span>
                              </div>
                            </motion.td>
                          )}
                          {toggles.gk && (
                            <motion.td 
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="px-8 py-8"
                            >
                              <div className="px-4 py-2 rounded-xl bg-indigo-500/5 border border-indigo-500/10 inline-block">
                                <span className="text-lg font-black text-indigo-400">{student.gk_score}</span>
                              </div>
                            </motion.td>
                          )}
                        </AnimatePresence>
                        <td className="px-8 py-8 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-3xl font-black text-white group-hover:scale-110 transition-transform duration-500 origin-right">
                              {(student.iq_score || 0) + (student.gk_score || 0)}
                            </span>
                            <div className="w-12 h-1 bg-gradient-to-r from-transparent to-blue-500/30 mt-1 rounded-full" />
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  ) : null}
                </AnimatePresence>
              </tbody>
            </table>
          )}

          {/* Empty Results Illustration */}
          {!loading && filteredData.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-24 flex flex-col items-center justify-center text-center space-y-6"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
                <div className="relative w-24 h-24 rounded-3xl bg-slate-900 border border-white/5 flex items-center justify-center">
                  <Search className="w-10 h-10 text-slate-500" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">No results found</h3>
                <p className="text-slate-500 max-w-xs">We couldn't find any candidates matching your current filters or search criteria.</p>
              </div>
              <button 
                onClick={() => {
                  setFilters({ province: "Province", district: "District", subject: "Mathematics" });
                  setSearch("");
                }}
                className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-all"
              >
                Clear all filters
              </button>
            </motion.div>
          )}
          
          {/* Table Footer */}
          {!loading && (
            <div className="px-8 py-6 bg-slate-950/40 border-t border-white/[0.03] flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Total Results: <span className="text-white ml-1">{filteredData.length}</span>
                </div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest hidden md:flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Synced with Supabase Real-time
                </div>
              </div>
              
              {/* Device Visibility Toggle (Visual Indicator) */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5">
                <Monitor className={clsx("w-3.5 h-3.5 transition-colors", !isLandscape ? "text-blue-400" : "text-slate-600")} />
                <div className="w-[1px] h-3 bg-white/10 mx-1" />
                <Smartphone className={clsx("w-3.5 h-3.5 transition-colors", isLandscape ? "text-blue-400" : "text-slate-600")} />
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          border: 2px solid #070b14;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.3);
        }
      `}</style>
    </div>
  );
}
