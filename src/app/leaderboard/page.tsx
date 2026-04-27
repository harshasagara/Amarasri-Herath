"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Medal
} from "lucide-react";
import clsx from "clsx";
import { supabase } from "@/lib/supabase";

// --- Constants & Data ---

const SUBJECTS = [
  "Mathematics", "Science", "English", "Sinhala", "Tamil", "History", "Geography", 
  "Economics", "Accounting", "ICT", "Civics", "Buddhism", "Christianity", "Islam", 
  "Hinduism", "Agriculture", "Art", "Music", "Dancing", "Health Science", 
  "Political Science", "Business Studies", "Psychology", "Sociology", "Statistics"
];

import { PROVINCES, PROVINCE_DISTRICTS, ALL_DISTRICTS } from "@/lib/regions";

interface StudentEntry {
  nic: string;
  name: string;
  score: number;
  iqScore: number;
  gkScore: number;
  subject: string;
  province: string;
  district: string;
  rank?: number;
}

// --- Components ---

const Dropdown = ({ label, options, value, onChange, icon: Icon, prominent = false }: any) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative group min-w-[160px]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl transition-all duration-300",
          "border backdrop-blur-md",
          prominent 
            ? "bg-blue-600/10 border-blue-500/30 text-blue-400 hover:bg-blue-600/20" 
            : "bg-slate-800/40 border-white/5 text-slate-300 hover:bg-slate-800/60"
        )}
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          {Icon && <Icon className="w-4 h-4 opacity-70" />}
          <span>{value || label}</span>
        </div>
        <ChevronDown className={clsx("w-4 h-4 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute left-0 right-0 mt-2 z-20 max-h-60 overflow-y-auto glass-panel border-white/10 shadow-2xl p-1 custom-scrollbar"
            >
              {options.map((opt: string) => (
                <button
                  key={opt}
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                  }}
                  className={clsx(
                    "w-full text-left px-4 py-2 rounded-lg text-sm transition-colors",
                    value === opt ? "bg-blue-600/20 text-blue-400 font-semibold" : "text-slate-400 hover:bg-white/5 hover:text-white"
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

const Toggle = ({ label, active, onToggle }: any) => (
  <button
    onClick={onToggle}
    className="flex items-center gap-3 group"
  >
    <div className={clsx(
      "w-10 h-5 rounded-full relative transition-all duration-300",
      active ? "bg-blue-600" : "bg-slate-700"
    )}>
      <div className={clsx(
        "absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300",
        active ? "left-6" : "left-1"
      )} />
    </div>
    <span className={clsx(
      "text-sm font-semibold tracking-wide transition-colors",
      active ? "text-blue-400" : "text-slate-500"
    )}>
      {label}
    </span>
  </button>
);

export default function LeaderboardPage() {
  const [data, setData] = useState<StudentEntry[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    island: "Island (Global)",
    province: "Province",
    district: "District",
    subject: "Mathematics" // Default prominent filter
  });
  const [toggles, setToggles] = useState({ iq: true, gk: true });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data: lbData, error } = await supabase
          .from('leaderboard')
          .select('*')
          .order('total_score', { ascending: false });

        if (error) throw error;

        if (lbData && lbData.length > 0) {
          const formattedData = lbData.map((item: any, idx: number) => ({
            ...item,
            score: item.total_score,
            iqScore: item.iq_score,
            gkScore: item.gk_score,
            rank: idx + 1
          }));
          setData(formattedData);
        } else {
          // Fallback to mock data for demonstration if DB is empty
          const mockData: StudentEntry[] = Array.from({ length: 15 }, (_, i) => ({
            nic: `ID-${1000 + i}`,
            name: ["Aruna Perera", "Kamal Silva", "Sunil Jayaweera", "Nimali Fernando"][i % 4] + ` ${i}`,
            score: 180 - i * 2,
            iqScore: 90 - i,
            gkScore: 90 - i,
            subject: "Mathematics",
            province: "Western",
            district: "Colombo",
            rank: i + 1
          }));
          setData(mockData);
        }
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();

    // Set up real-time subscription
    const channel = supabase
      .channel('leaderboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leaderboard' }, () => {
        fetchLeaderboard();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredData = data.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                         item.nic.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = item.subject === filters.subject;
    const matchesProvince = filters.province === "Province" || item.province === filters.province;
    const matchesDistrict = filters.district === "District" || item.district === filters.district;
    
    return matchesSearch && matchesSubject && matchesProvince && matchesDistrict;
  });

  const getRankBadge = (rank: number) => {
    switch(rank) {
      case 1: return <div className="w-8 h-8 rounded-lg bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]"><Trophy className="w-5 h-5" /></div>;
      case 2: return <div className="w-8 h-8 rounded-lg bg-slate-300/20 border border-slate-300/50 flex items-center justify-center text-slate-300 shadow-[0_0_15px_rgba(203,213,225,0.2)]"><Medal className="w-5 h-5" /></div>;
      case 3: return <div className="w-8 h-8 rounded-lg bg-orange-600/20 border border-orange-600/50 flex items-center justify-center text-orange-500 shadow-[0_0_15px_rgba(234,88,12,0.2)]"><Award className="w-5 h-5" /></div>;
      default: return <span className="text-slate-500 font-mono font-bold text-sm">#{rank}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-slate-200 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] shrink-0">
                <Trophy className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              Leaderboard
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Examination Leaderboard & Performance Analytics</p>
          </div>

          <div className="relative w-full md:w-80 group">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text"
              placeholder="Search candidate..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all backdrop-blur-xl"
            />
          </div>
        </motion.div>

        {/* Filter Bar */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-6 border-white/5 space-y-6 bg-slate-900/20 shadow-2xl"
        >
          <div className="flex flex-wrap items-center gap-4">
            <Dropdown 
              label="Global" 
              options={["Island (Global)"]} 
              value={filters.island} 
              onChange={(v: string) => setFilters({...filters, island: v})} 
              icon={Globe}
            />
            <Dropdown 
              label="Province" 
              options={["Province", ...PROVINCES]} 
              value={filters.province} 
              onChange={(v: string) => setFilters({...filters, province: v, district: "District"})} 
              icon={MapPin}
            />
            <Dropdown 
              label="District" 
              options={["District", ...(filters.province === "Province" ? ALL_DISTRICTS : (PROVINCE_DISTRICTS[filters.province] || []))]} 
              value={filters.district} 
              onChange={(v: string) => setFilters({...filters, district: v})} 
              icon={MapPin}
            />
            <div className="flex-grow min-w-[200px]">
              <Dropdown 
                label="Select Subject" 
                options={SUBJECTS} 
                value={filters.subject} 
                onChange={(v: string) => setFilters({...filters, subject: v})} 
                icon={BookOpen}
                prominent={true}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 pt-4 border-t border-white/5">
            <div className="flex items-center gap-6">
              <Toggle 
                label="IQ SCORE" 
                active={toggles.iq} 
                onToggle={() => setToggles({...toggles, iq: !toggles.iq})} 
              />
              <Toggle 
                label="GK SCORE" 
                active={toggles.gk} 
                onToggle={() => setToggles({...toggles, gk: !toggles.gk})} 
              />
            </div>
            <div className="sm:ml-auto text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 flex-wrap">
              <Filter className="w-3.5 h-3.5 shrink-0" />
              <span className="shrink-0">Active Filters:</span> 
              <span className="text-blue-500 truncate max-w-[150px] sm:max-w-[300px]">{filters.subject}</span>
            </div>
          </div>
        </motion.div>

        {/* Main Table Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel border-white/5 overflow-hidden bg-slate-900/40 shadow-2xl"
        >
          <div className="overflow-x-auto custom-scrollbar w-full">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-950/60 border-b border-white/5 sticky top-0 z-10 backdrop-blur-xl">
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Rank</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Candidate Name</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Subject</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">District / Province</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Total Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <AnimatePresence mode="popLayout">
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={`skeleton-${i}`} className="animate-pulse">
                        <td colSpan={5} className="px-6 py-8">
                          <div className="h-4 bg-slate-800/50 rounded-full w-full"></div>
                        </td>
                      </tr>
                    ))
                  ) : filteredData.length > 0 ? (
                    filteredData.map((student, idx) => (
                      <motion.tr 
                        key={student.nic}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ delay: idx * 0.03 }}
                        className={clsx(
                          "group transition-all duration-500 relative border-b border-white/[0.03] last:border-0",
                          student.rank && student.rank <= 3 ? "bg-blue-500/[0.02]" : "hover:bg-white/[0.02]"
                        )}
                      >
                        <td className="px-6 py-6 relative">
                          {/* Hover side indicator */}
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          {getRankBadge(student.rank || 0)}
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-white group-hover:text-blue-400 transition-colors duration-300 text-lg">
                              {student.name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-60">{student.nic}</span>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-xl bg-blue-500/5 border border-blue-500/10 text-blue-400 text-xs font-bold group-hover:border-blue-500/30 transition-colors duration-300">
                            <BookOpen className="w-3.5 h-3.5" />
                            {student.subject}
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors duration-300">{student.district}</span>
                            <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest opacity-50">{student.province} Province</span>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-3xl font-black text-white group-hover:text-blue-400 transition-colors duration-300 drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                              {student.score}
                            </span>
                            <div className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                              {toggles.iq && <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500/40" /> IQ: {student.iqScore}</span>}
                              {toggles.gk && <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-slate-500/40" /> GK: {student.gkScore}</span>}
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center text-slate-500 italic">
                        No candidates found matching your criteria.
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          
          {/* Table Footer */}
          {!loading && (
            <div className="px-6 py-4 bg-slate-950/40 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center sm:text-left">
              <div>Total Results: <span className="text-white">{filteredData.length}</span></div>
              <div className="flex items-center gap-4">
                <span className="hidden sm:inline">4K Precision UI</span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse hidden sm:inline"></span>
                <span>Real-time Data Sync</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </div>
  );
}
