import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { submissionService } from '../services/submissionService';
import { EffortSubmission, Message } from '../types';
import { ChevronLeft, ChevronRight, ChevronDown, ShieldCheck, MoreHorizontal, AlertCircle, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function History() {
  const { profile } = useAuth();
  const [submission, setSubmission] = useState<EffortSubmission | null>(null);
  const [allSubmissions, setAllSubmissions] = useState<EffortSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const today = new Date();
  const currentMonth = today.toISOString().slice(0, 7);
  
  // For history, we default to the latest recorded month effectively
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectorYear, setSelectorYear] = useState(today.getFullYear());
  const [isMonthSelectorOpen, setIsMonthSelectorOpen] = useState(false);

  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  useEffect(() => {
    async function fetchData() {
      if (!profile) return;
      
      const userSubmissions = await submissionService.getSubmissions(profile.uid);
      const sortedSubmissions = [...userSubmissions].sort((a, b) => b.month.localeCompare(a.month));
      setAllSubmissions(sortedSubmissions);

      // If no month is selected yet, default to the latest submission if available
      if (!selectedMonth) {
        if (sortedSubmissions.length > 0) {
          setSelectedMonth(sortedSubmissions[0].month);
          setSelectorYear(new Date(sortedSubmissions[0].month).getFullYear());
        } else {
          setSelectedMonth(currentMonth);
        }
      }

      const existing = sortedSubmissions.find(s => s.month === (selectedMonth || currentMonth));
      setSubmission(existing || null);
      
      setLoading(false);
    }
    fetchData();
  }, [profile, selectedMonth, currentMonth]);

  useEffect(() => {
    if (submission?.id) {
      return submissionService.subscribeToMessages(submission.id, setMessages);
    } else {
      setMessages([]);
    }
  }, [submission?.id]);

  const calculateTotal = () => {
    return submission?.allocations.reduce((sum, item) => sum + (Number(item.plannedPercent) || 0), 0) || 0;
  };

  if (loading || !selectedMonth) return <div className="h-full flex items-center justify-center italic text-text-muted">Loading Audit Archives...</div>;

  const totalAllocated = calculateTotal();

  return (
    <div className="h-full flex flex-col space-y-4 lg:space-y-8 pb-4 min-h-0 max-w-screen-2xl mx-auto w-full px-2 lg:px-8">
      <header className="flex flex-row justify-between items-center shrink-0 mb-4 lg:mb-8 mt-4 lg:mt-0 gap-4">
        <div className="flex flex-row items-center gap-3 lg:gap-4 w-auto">
          <span className="text-[10px] lg:text-[12px] font-bold text-text-muted uppercase tracking-widest opacity-60 shrink-0">Reporting Period:</span>
          <div className="relative">
            <button 
              onClick={() => setIsMonthSelectorOpen(!isMonthSelectorOpen)}
              className="flex items-center gap-3 px-3 lg:px-4 py-2 lg:py-2.5 bg-white border border-border-base/60 rounded-md font-bold text-[11px] lg:text-xs text-text-main hover:bg-bg-base transition-all shadow-sm"
            >
              {selectedMonth ? new Date(selectedMonth).toLocaleDateString([], { month: 'long', year: 'numeric' }) : 'Select Month'}
              <ChevronDown className={cn("w-3 h-3 lg:w-4 h-4 transition-transform", isMonthSelectorOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {isMonthSelectorOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsMonthSelectorOpen(false)} 
                  />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full mt-2 left-0 z-50 bg-white border border-border-base/60 rounded-xl p-4 shadow-2xl flex flex-col items-center gap-3 w-72 lg:w-80"
                  >
                    <div className="flex items-center justify-between w-full px-2 mb-1">
                      <button 
                        onClick={() => setSelectorYear(prev => prev - 1)}
                        className="p-1 hover:bg-slate-50 rounded-lg text-primary-base transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5 stroke-[3]" />
                      </button>
                      <span className="text-xl font-black text-primary-base tracking-tight">{selectorYear}</span>
                      <button 
                        onClick={() => setSelectorYear(prev => prev + 1)}
                        className="p-1 hover:bg-slate-50 rounded-lg text-primary-base transition-colors"
                      >
                        <ChevronRight className="w-5 h-5 stroke-[3]" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {months.map((m, index) => {
                        const monthNum = (index + 1).toString().padStart(2, '0');
                        const monthStr = `${selectorYear}-${monthNum}`;
                        const subForMonth = allSubmissions.find(s => s.month === monthStr);
                        
                        const isSelected = monthStr === selectedMonth;
                        // History allows selecting any month that is in the past or has data
                        const isPast = monthStr <= currentMonth;
                        const hasData = !!subForMonth;

                        return (
                          <button
                            key={m}
                            disabled={!isPast && !hasData}
                            onClick={() => {
                              setSelectedMonth(monthStr);
                              setIsMonthSelectorOpen(false);
                            }}
                            className={cn(
                              "w-16 lg:w-20 py-2.5 lg:py-3 rounded-xl text-[11px] font-black tracking-tight transition-all relative border border-transparent uppercase",
                              isSelected 
                                ? "bg-primary-base text-white shadow-lg border-primary-base" 
                                : isPast || hasData
                                  ? "bg-bg-base text-text-muted hover:bg-slate-200" 
                                  : "bg-bg-base text-text-muted/20 cursor-not-allowed opacity-40"
                            )}
                          >
                            {m}
                            {hasData && !isSelected && (
                              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-primary-base/40 rounded-full" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-4 ml-auto">
          <div className="px-4 lg:px-6 py-2 lg:py-2.5 bg-slate-100 border border-border-base rounded-md font-bold text-[9px] lg:text-[10px] text-text-muted uppercase tracking-[0.2em] flex items-center gap-2 shadow-sm italic">
            <Lock className="w-3 h-3 lg:w-3.5 h-3.5 opacity-40" />
            Archive Locked
          </div>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-12 gap-4 lg:gap-8 min-h-0">
        {/* Main Historical View */}
        <div className="col-span-8 flex flex-col min-h-0 order-none">
          <div className="bg-white border border-border-base/60 rounded-card overflow-hidden flex flex-col h-full shadow-sm">
            <div className="p-3 lg:p-4 border-b border-border-base/60 flex justify-between items-center bg-slate-50/50 shrink-0 px-4 lg:px-8">
              <h2 className="font-bold text-text-main text-[10px] lg:text-[11px] uppercase tracking-[0.15em] flex items-center gap-2">
                Historical Allocation Matrix
              </h2>
              <button className="text-text-muted hover:text-text-main transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-0 flex-1 overflow-y-auto relative z-10 scrollbar-hide">
              {!submission ? (
                <div className="h-full flex flex-col items-center justify-center p-8 lg:p-12 text-center text-text-muted/40">
                   <AlertCircle className="w-10 h-10 lg:w-12 h-12 mb-4 opacity-10" />
                   <p className="text-[10px] lg:text-xs font-black uppercase tracking-widest italic leading-loose">
                     No verified archives<br/>for the selected period
                   </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="border-b border-border-base/50 bg-slate-50/30">
                        <th className="py-3 lg:py-4 px-4 lg:px-8 text-[9px] lg:text-[10px] font-black text-text-muted/60 uppercase tracking-[0.2em] w-3/4">Project Name</th>
                        <th className="py-3 lg:py-4 px-4 lg:px-8 text-[9px] lg:text-[10px] font-black text-text-muted/60 uppercase tracking-[0.2em] text-center w-1/4">Allocation %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-base/40">
                      {submission.allocations.map((alloc, idx) => (
                        <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 lg:py-5 px-4 lg:px-8">
                            <span className="font-bold text-text-main text-xs lg:text-sm tracking-tight">{alloc.projectName || 'Unassigned Project'}</span>
                          </td>
                          <td className="py-4 lg:py-5 px-4 lg:px-8 text-center">
                            <div className="inline-flex items-center gap-2">
                              <span className="text-xs lg:text-sm font-black text-text-main tabular-nums italic">{alloc.plannedPercent}</span>
                              <span className="text-[10px] lg:text-xs text-text-muted font-bold">%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {submission && (
              <div className="px-4 lg:px-8 py-4 lg:py-6 bg-slate-100/50 border-t border-border-base flex items-center gap-4 lg:gap-8 shrink-0">
                <div className="min-w-max text-[9px] lg:text-[10px] font-black text-text-muted/60 tracking-[0.2em] uppercase">Total Captured allocation:</div>
                <div className="flex-1 h-2 lg:h-3 bg-slate-200 rounded-full overflow-hidden flex">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${totalAllocated}%` }}
                    className={cn("h-full transition-all duration-500 rounded-full", totalAllocated > 100 ? "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]" : "bg-primary-base opacity-60 shadow-[0_0_12px_rgba(0,106,111,0.2)]")}
                  />
                </div>
                <div className={cn("font-black text-xl lg:text-2xl w-16 lg:w-20 text-right italic tabular-nums tracking-tighter opacity-60", totalAllocated > 100 ? "text-red-600 opacity-100" : "text-primary-base")}>
                  {totalAllocated}%
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Verification Archive */}
        <div className="col-span-4 flex flex-col min-h-0 bg-transparent">
          <div className="bg-white border border-border-base/60 rounded-card overflow-hidden flex flex-col h-full shadow-sm relative">
            <div className="p-3 lg:p-4 border-b border-border-base/60 flex items-center justify-between bg-white shrink-0 px-4 lg:px-8 z-20">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 lg:w-4 h-4 text-primary-base opacity-70" />
                <h2 className="font-bold text-text-main text-[10px] lg:text-[11px] uppercase tracking-[0.15em]">Archived Log</h2>
              </div>
              <Lock className="w-3 h-3 lg:w-3.5 h-3.5 text-text-muted/20" />
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 lg:space-y-6 flex flex-col scrollbar-hide bg-slate-50/10 min-h-0 z-10">
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-text-muted opacity-20">
                  <AlertCircle className="w-6 h-6 lg:w-8 h-8 mb-4 border-2 border-dashed border-current rounded-full p-1" />
                  <p className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest leading-loose">No archived insights<br/>for this period</p>
                </div>
              ) : (
                <>
                   <div className="text-center pt-2 mb-2">
                    <span className="px-3 py-1 bg-white border border-border-base/40 rounded-full text-[8px] lg:text-[9px] font-black text-text-muted/60 uppercase tracking-[0.2em] shadow-sm">Record Immutable</span>
                  </div>
                  {messages.map((msg, idx) => (
                    <div key={idx} className={cn(
                      "flex flex-col max-w-[85%] lg:max-w-[80%]",
                      msg.senderId === profile?.uid ? "ml-auto items-end" : "mr-auto items-start"
                    )}>
                      <div className="flex items-center gap-2 mb-1.5 px-1">
                         <span className="text-[8px] lg:text-[9px] font-black text-text-muted uppercase tracking-[0.28em] opacity-40">{msg.senderName}</span>
                      </div>
                      <div className={cn(
                        "p-3 lg:p-4 text-[11px] lg:text-[12px] leading-relaxed rounded-xl whitespace-pre-wrap shadow-sm",
                        msg.senderId === profile?.uid 
                          ? "bg-slate-100 text-text-main italic border border-slate-200 rounded-tr-none" 
                          : "bg-white text-text-main border border-border-base rounded-tl-none shadow-[0_2px_4px_rgba(0,0,0,0.02)]"
                      )}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="p-4 lg:p-6 bg-slate-50/80 border-t border-border-base shrink-0">
              <div className="flex items-center gap-4 bg-white/50 border border-border-base/40 p-3 lg:p-4 rounded-xl shadow-sm">
                <div className="w-8 h-8 lg:w-10 h-10 rounded-full bg-slate-100 border border-border-base flex items-center justify-center shrink-0 shadow-inner">
                  <Lock className="w-3.5 h-3.5 lg:w-4 h-4 text-text-muted/40" />
                </div>
                <div>
                  <p className="text-[10px] lg:text-[11px] font-black text-text-main uppercase tracking-[0.1em] leading-none mb-1 shadow-sm/0">HISTORY MODE ACTIVE</p>
                  <p className="text-[10px] lg:text-[11px] font-medium text-text-muted opacity-60">All communications are sealed and non-editable.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="shrink-0 pt-4 pb-2 text-center">
        <p className="text-[10px] font-bold text-text-muted opacity-40 uppercase tracking-[0.3em]">
          &copy; 2026 PixelEdge Inc. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
