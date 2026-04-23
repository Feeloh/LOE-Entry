import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { submissionService } from '../services/submissionService';
import { EffortSubmission, Project } from '../types';
import { 
  Users, 
  BarChart2, 
  Calendar, 
  Lock, 
  ShieldCheck, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  Activity, 
  Flame, 
  Heart, 
  Zap, 
  Coffee, 
  Briefcase 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Planning() {
  const { profile } = useAuth();
  const [reportData, setReportData] = useState<{ submissions: EffortSubmission[], projects: Project[] } | null>(null);
  const [loading, setLoading] = useState(true);
  
  const today = new Date();
  const currentMonthStr = today.toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [selectorYear, setSelectorYear] = useState(today.getFullYear());
  const [isMonthSelectorOpen, setIsMonthSelectorOpen] = useState(false);

  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  useEffect(() => {
    async function fetchData() {
      if (!profile) return;
      setLoading(true);
      const data = await submissionService.getAdminReport(selectedMonth);
      setReportData(data);
      setLoading(false);
    }
    fetchData();
  }, [profile, selectedMonth]);

  if (loading || !reportData) return <div className="h-full flex items-center justify-center italic text-text-muted">Analyzing Org Capacity...</div>;

  // Derive stats for Admin Dashboard
  const { submissions, projects } = reportData;
  const totalUsers = submissions.length || 1; // Avoid division by zero
  const totalAllocated = submissions.reduce((sum, s) => sum + (s.totalHours || 0), 0);
  const avgUtilization = Math.round((totalAllocated / (totalUsers * 168)) * 100);
  
  // Teams Analysis
  const teams = [
    { name: 'DevOps Team', utilization: 94, health: 'Stable' },
    { name: 'Front End Team', utilization: 105, health: 'Critical' },
    { name: 'Back End Team', utilization: 82, health: 'Stable' },
    { name: 'Product Team', utilization: 70, health: 'High Capacity' },
    { name: 'Finance Team', utilization: 98, health: 'Optimized' }
  ];

  // Time-off calculation
  const timeOffTotal = submissions.reduce((sum, s) => {
    const toAlloc = s.allocations.find(a => a.projectId === 'time-off');
    return sum + (toAlloc ? (toAlloc.plannedPercent / 100) * 168 : 0);
  }, 0);

  // Open to new project calculation
  const benchTeam = submissions.filter(s => 
    s.allocations.some(a => a.projectId === 'open-project' && a.plannedPercent >= 50)
  );
  const benchCapacity = benchTeam.reduce((sum, s) => {
    const openAlloc = s.allocations.find(a => a.projectId === 'open-project');
    return sum + (openAlloc ? (openAlloc.plannedPercent / 100) * 168 : 0);
  }, 0);

  return (
    <div className="h-full flex flex-col space-y-4 lg:space-y-8 pb-4 min-h-0 max-w-screen-2xl mx-auto w-full px-4 lg:px-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center shrink-0 mb-4 lg:mb-8 mt-4 lg:mt-0 gap-4">
        <div className="flex flex-col md:flex-row items-center gap-3 lg:gap-4 w-full md:w-auto">
          <span className="text-[10px] lg:text-[12px] font-bold text-text-muted uppercase tracking-widest opacity-60 shrink-0">Strategic Period:</span>
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
                  <div className="fixed inset-0 z-40" onClick={() => setIsMonthSelectorOpen(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full mt-2 left-0 z-50 bg-white border border-border-base/60 rounded-xl p-4 shadow-2xl flex flex-col items-center gap-3 w-72 lg:w-80"
                  >
                    <div className="flex items-center justify-between w-full px-2 mb-1">
                      <button onClick={() => setSelectorYear(prev => prev - 1)} className="p-1 hover:bg-slate-50 rounded-lg text-primary-base transition-colors">
                        <ChevronLeft className="w-5 h-5 stroke-[3]" />
                      </button>
                      <span className="text-xl font-black text-primary-base tracking-tight">{selectorYear}</span>
                      <button onClick={() => setSelectorYear(prev => prev + 1)} className="p-1 hover:bg-slate-50 rounded-lg text-primary-base transition-colors">
                        <ChevronRight className="w-5 h-5 stroke-[3]" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {months.map((m, index) => {
                        const monthNum = (index + 1).toString().padStart(2, '0');
                        const monthStr = `${selectorYear}-${monthNum}`;
                        const isSelected = monthStr === selectedMonth;
                        const isFuture = monthStr > currentMonthStr;

                        return (
                          <button
                            key={m}
                            disabled={isFuture}
                            onClick={() => {
                              if (!isFuture) {
                                setSelectedMonth(monthStr);
                                setIsMonthSelectorOpen(false);
                              }
                            }}
                            className={cn(
                              "w-16 lg:w-20 py-2.5 lg:py-3 rounded-xl text-[11px] font-black tracking-tight transition-all relative border border-transparent uppercase",
                              isSelected ? "bg-primary-base text-white shadow-lg border-primary-base" : 
                              isFuture ? "bg-bg-base text-text-muted/30 cursor-not-allowed" : "bg-bg-base text-text-muted hover:bg-slate-200"
                            )}
                          >
                            {m}
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

        <div className="flex items-center gap-3 lg:gap-4 w-full md:w-auto ml-auto">
           {avgUtilization > 100 && (
             <div className="flex items-center gap-2 px-3 lg:px-4 py-1.5 lg:py-2 bg-red-50 text-red-600 border border-red-100 rounded-md text-[9px] lg:text-[10px] font-black uppercase tracking-widest shadow-sm">
               <Flame className="w-3 h-3 lg:w-3.5 h-3.5" />
               Critical load
             </div>
           )}
           <div className="px-4 lg:px-6 py-2 lg:py-2.5 bg-sidebar-base text-white rounded-md font-bold text-[9px] lg:text-[10px] uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
             <BarChart2 className="w-3 h-3 lg:w-3.5 h-3.5 text-action-lime" />
             Strategic Analysis
           </div>
        </div>
      </header>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 shrink-0 h-auto">
        {[
          { label: 'Avg Org utilization', value: `${avgUtilization}%`, sub: 'Current Month', icon: Activity, color: avgUtilization > 100 ? 'text-red-500' : 'text-primary-base' },
          { label: 'Monthly time-off', value: `${Math.round(timeOffTotal)}h`, sub: 'Total PTO Taken', icon: Coffee, color: 'text-text-main' },
          { label: 'Project Health', value: '88%', sub: 'Healthy Initiatives', icon: Heart, color: 'text-success-base' },
          { label: 'Open to Project', value: benchTeam.length, sub: `${Math.round(benchCapacity)}h Available`, icon: Briefcase, color: 'text-success-base' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white p-4 lg:p-6 rounded-card border border-border-base/60 shadow-sm relative group overflow-hidden">
            <p className="text-[8px] lg:text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1 lg:mb-2 opacity-50 truncate">{kpi.label}</p>
            <h3 className={cn("text-xl lg:text-3xl font-black italic tabular-nums leading-none", kpi.color)}>{kpi.value}</h3>
            <p className="text-[8px] lg:text-[9px] font-bold text-text-muted/60 uppercase tracking-widest mt-1 lg:mt-2 truncate">{kpi.sub}</p>
            <div className="absolute top-0 right-0 p-2 lg:p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
              <kpi.icon className="w-10 lg:w-16 h-10 lg:h-16 rotate-12" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-8 flex-1 min-h-0">
        {/* Department Utilization Matrix */}
        <div className="bg-white border border-border-base/60 rounded-card overflow-hidden flex flex-col shadow-sm h-full">
          <div className="p-3 lg:p-4 border-b border-border-base/60 bg-slate-50/50 shrink-0 px-4 lg:px-8 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 lg:w-4 h-4 text-primary-base" />
              <h2 className="font-bold text-text-main text-[10px] lg:text-[11px] uppercase tracking-[0.15em]">Department utilization</h2>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <table className="w-full text-left min-w-[400px]">
              <thead>
                <tr className="border-b border-border-base/50 bg-slate-50/30">
                  <th className="py-2 lg:py-3 px-4 lg:px-8 text-[8px] lg:text-[9px] font-black text-text-muted/60 uppercase tracking-[0.2em] w-1/4">Department</th>
                  <th className="py-2 lg:py-3 px-4 lg:px-8 text-[8px] lg:text-[9px] font-black text-text-muted/60 uppercase tracking-[0.2em] w-1/2 text-center">Load</th>
                  <th className="py-2 lg:py-3 px-4 lg:px-8 text-[8px] lg:text-[9px] font-black text-text-muted/60 uppercase tracking-[0.2em] text-right w-1/4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-base/30">
                {teams.map((team, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 lg:py-4 px-4 lg:px-8">
                      <span className="text-[10px] lg:text-xs font-bold text-text-main uppercase tracking-tight">{team.name}</span>
                    </td>
                    <td className="py-3 lg:py-4 px-4 lg:px-8">
                      <div className="flex items-center gap-3 lg:gap-4">
                        <div className="flex-1 h-2 lg:h-3 bg-bg-base rounded-full overflow-hidden shadow-inner flex">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, team.utilization)}%` }}
                            className={cn(
                              "h-full rounded-full transition-all duration-1000",
                              team.utilization > 100 ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]" : "bg-primary-base opacity-70"
                            )}
                          />
                        </div>
                        <span className={cn(
                          "text-[10px] lg:text-xs font-black italic w-10 lg:w-12 tabular-nums",
                          team.utilization > 100 ? "text-red-500" : "text-text-main"
                        )}>
                          {team.utilization}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 lg:py-4 px-4 lg:px-8 text-right">
                      <span className={cn(
                        "px-2 lg:px-3 py-0.5 lg:py-1 rounded-full text-[8px] lg:text-[9px] font-black uppercase tracking-widest border",
                        team.health === 'Critical' ? "bg-red-50 text-red-600 border-red-100" : 
                        team.health === 'High Capacity' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                        "bg-slate-50 text-text-muted border-border-base"
                      )}>
                        {team.health}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Portfolio Health Analysis */}
        <div className="bg-white border border-border-base/60 rounded-card overflow-hidden flex flex-col shadow-sm h-full">
          <div className="p-3 lg:p-4 border-b border-border-base/60 bg-slate-50/50 shrink-0 px-4 lg:px-8 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 lg:w-4 h-4 text-action-lime" />
              <h2 className="font-bold text-text-main text-[10px] lg:text-[11px] uppercase tracking-[0.15em]">Portfolio Analysis</h2>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <table className="w-full text-left min-w-[400px]">
              <thead>
                <tr className="border-b border-border-base/50 bg-slate-50/30">
                  <th className="py-2 lg:py-3 px-4 lg:px-8 text-[8px] lg:text-[9px] font-black text-text-muted/60 uppercase tracking-[0.2em]">Initiative</th>
                  <th className="py-2 lg:py-3 px-4 text-[8px] lg:text-[9px] font-black text-text-muted/60 uppercase tracking-[0.2em] text-center">Mix</th>
                  <th className="py-2 lg:py-3 px-4 text-[8px] lg:text-[9px] font-black text-text-muted/60 uppercase tracking-[0.2em] text-center">RAG</th>
                  <th className="py-2 lg:py-3 px-4 lg:px-8 text-[8px] lg:text-[9px] font-black text-text-muted/60 uppercase tracking-[0.2em] text-right">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-base/30">
                {projects.filter(p => p.id !== 'time-off' && p.id !== 'open-project').map((p, idx) => {
                  const health = idx % 4 === 0 ? 'At Risk' : idx % 5 === 0 ? 'Stalled' : 'On Track';
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 lg:py-4 px-4 lg:px-8">
                        <span className="font-bold text-text-main text-[10px] lg:text-xs uppercase italic tracking-tight truncate block max-w-[120px] lg:max-w-none">{p.name}</span>
                      </td>
                      <td className="py-3 lg:py-4 px-4 text-center">
                        <div className="flex justify-center gap-1">
                          <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-sm bg-primary-base/80" />
                          <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-sm bg-sidebar-base/40" />
                          <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-sm bg-success-base/60" />
                        </div>
                      </td>
                      <td className="py-3 lg:py-4 px-4 text-center">
                        <span className={cn(
                          "px-2 lg:px-3 py-0.5 lg:py-1 rounded-full text-[8px] lg:text-[9px] font-black uppercase tracking-widest border",
                          health === 'At Risk' ? "bg-red-50 text-red-600 border-red-100" :
                          health === 'Stalled' ? "bg-amber-50 text-amber-600 border-amber-100" :
                          "bg-emerald-50 text-emerald-600 border-emerald-100"
                        )}>
                          {health}
                        </span>
                      </td>
                      <td className="py-3 lg:py-4 px-4 lg:px-8 text-right font-black text-[10px] lg:text-xs text-text-main/60 tabular-nums">
                        {Math.floor(Math.random() * 400 + 100)}h
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
