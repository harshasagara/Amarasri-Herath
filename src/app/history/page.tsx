"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { History, Search, Download, Award, Clock } from "lucide-react";
import clsx from "clsx";

export default function HistoryPage() {
  const [examHistory, setExamHistory] = useState<any[]>([]);

  useEffect(() => {
    const userStr = localStorage.getItem("studentUser");
    if (userStr) {
      const user = JSON.parse(userStr);
      const savedStr = localStorage.getItem(`examHistory_${user.nic}`);
      if (savedStr) {
        setExamHistory(JSON.parse(savedStr));
      }
    }
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <History className="w-8 h-8 text-secondary" />
            Exam <span className="text-gradient">History</span>
          </h1>
          <p className="text-gray-400 mt-1">Review past performance and download certificates</p>
        </div>
        
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-500" />
          </div>
          <input 
            type="text" 
            placeholder="Search exams..." 
            className="glass-input pl-10 w-full"
          />
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-sm font-medium text-gray-400">
          <div className="col-span-3">Exam Name</div>
          <div className="col-span-2 text-center">Date</div>
          <div className="col-span-2 text-center">Score</div>
          <div className="col-span-2 text-center">Grade</div>
          <div className="col-span-3 text-right">Actions</div>
        </div>
        
        <div className="flex flex-col">
          {examHistory.map((exam, i) => (
            <motion.div 
              key={exam.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-4 flex flex-col md:grid md:grid-cols-12 gap-4 md:items-center border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
            >
              <div className="col-span-3">
                <p className="font-bold text-white">{exam.name}</p>
                <p className="text-xs text-gray-400">{exam.id}</p>
              </div>
              
              <div className="col-span-2 text-left md:text-center text-sm text-gray-300">
                {exam.date}
              </div>
              
              <div className="col-span-2 flex items-center justify-start md:justify-center">
                {exam.status === "completed" ? (
                  <span className={clsx(
                    "text-lg font-bold",
                    exam.score! >= 90 ? "text-green-400" :
                    exam.score! >= 80 ? "text-primary" :
                    exam.score! >= 70 ? "text-yellow-400" : "text-red-400"
                  )}>
                    {exam.score}%
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-sm text-orange-400 bg-orange-400/10 px-2 py-1 rounded">
                    <Clock className="w-3 h-3" /> Pending
                  </span>
                )}
              </div>
              
              <div className="col-span-2 text-left md:text-center font-medium">
                {exam.status === "completed" ? exam.grade : "-"}
              </div>
              
              <div className="col-span-3 flex justify-start md:justify-end gap-2">
                <button 
                  disabled={exam.status !== "completed"}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Award className="w-4 h-4 text-yellow-400" />
                  View
                </button>
                <button 
                  disabled={exam.status !== "completed"}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  PDF
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
