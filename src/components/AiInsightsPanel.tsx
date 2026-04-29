import React, { useState } from 'react';
import { Sparkles, Brain, ArrowRight, Loader2, RefreshCw, AlertTriangle, TrendingUp, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { EffortSubmission, Project, UserRole } from '../types';
import { aiService } from '../services/aiService';
import Markdown from 'react-markdown';

interface AiInsightsPanelProps {
  submissions: EffortSubmission[];
  projects: Project[];
  selectedMonth: string;
  role?: UserRole;
  onInsightsGenerated?: (insights: string) => void;
}

export function AiInsightsPanel({ submissions, projects, selectedMonth, role, onInsightsGenerated }: AiInsightsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<string | null>(null);

  const generateInsights = async () => {
    // Show qualitative template context while waiting for real-time analysis
    const template = aiService.getInsightsTemplate(role || 'employee', selectedMonth);
    setInsights(template);

    setLoading(true);
    const result = await aiService.getResourceInsights({
      submissions,
      projects,
      month: selectedMonth,
      role
    });
    setInsights(result);
    if (onInsightsGenerated) onInsightsGenerated(result);
    setLoading(false);
  };

  return (
    <div className="relative z-40 mb-6 lg:mb-8">
      {!isOpen ? (
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => {
            setIsOpen(true);
            if (!insights) generateInsights();
          }}
          className="w-full p-4 lg:p-6 bg-sidebar-base rounded-card shadow-lg border border-primary-base/20 flex items-center justify-between group overflow-hidden relative"
        >
          {/* Subtle Texture Overlay */}
          <div className="absolute inset-0 bg-white/[0.02] pointer-events-none" />
          
          <div className="flex items-center gap-4 relative">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white/10 rounded-xl flex items-center justify-center text-action-lime ring-1 ring-white/10">
              <Sparkles className="w-5 h-5 lg:w-6 h-6" />
            </div>
            <div className="text-left">
              <h3 className="text-white font-bold text-sm lg:text-base tracking-tight">AI Resource Intelligence</h3>
              <p className="text-white/50 text-[10px] lg:text-xs font-bold uppercase tracking-[0.1em]">Analyze understaffing & predict bottle-necks</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-action-lime text-primary-dark rounded-xl text-[10px] lg:text-[11px] font-black uppercase tracking-wider shadow-sm group-hover:bg-white transition-all">
            Launch Assistant <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "bg-white border border-sidebar-base/20 rounded-card shadow-2xl overflow-hidden flex flex-col transition-all duration-300",
            !isCollapsed ? "min-h-[400px]" : "min-h-0"
          )}
        >
          <div className="p-4 lg:p-6 bg-sidebar-base text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <Brain className="w-5 h-5 lg:w-6 h-6 text-action-lime" />
              <div>
                <h3 className="font-bold text-sm lg:text-base">Strategic Insights Assistant</h3>
                <p className="text-[10px] lg:text-xs text-white/50 font-bold uppercase tracking-widest">{selectedMonth} Audit</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title={isCollapsed ? "Expand" : "Collapse"}
              >
                {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
              <button 
                onClick={generateInsights}
                disabled={loading}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh Audit"
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>

          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden flex flex-col flex-1"
              >
                <div className="flex-1 p-6 lg:p-8 overflow-y-auto max-h-[600px] scrollbar-hide">
                  {loading ? (
                    <div className="h-full flex flex-col items-center justify-center py-20 space-y-4">
                      <Loader2 className="w-8 h-8 text-primary-base animate-spin" />
                      <p className="text-xs font-bold text-text-muted uppercase tracking-[0.2em] animate-pulse">Consulting Strategic Models...</p>
                    </div>
                  ) : insights ? (
                    <div className="prose prose-sm max-w-none text-text-main font-sans font-medium leading-relaxed">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-start gap-3">
                            <TrendingUp className="w-5 h-5 text-emerald-600 mt-1" />
                            <div>
                              <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">Utilization</p>
                              <p className="text-xs text-emerald-900 font-bold leading-tight">Teams analyzed for optimal distribution</p>
                            </div>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 mt-1" />
                            <div>
                              <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">Staffing Gap</p>
                              <p className="text-xs text-amber-900 font-bold leading-tight">Critical projects identified for audit</p>
                            </div>
                        </div>
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
                            <Users className="w-5 h-5 text-blue-600 mt-1" />
                            <div>
                              <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-1">Forecasting</p>
                              <p className="text-xs text-blue-900 font-bold leading-tight">Q2 capacity roadmap generated</p>
                            </div>
                        </div>
                      </div>
                      <div className="markdown-body font-sans">
                        <Markdown>{insights}</Markdown>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-text-muted">
                      <p className="text-sm italic">Failed to load insights. Please try refreshing.</p>
                    </div>
                  )}
                </div>
                
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-[9px] font-bold text-text-muted/60 uppercase tracking-widest">Powered by Google Gemini 3 Flash Intelligence</p>
                  <div className="flex gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-success-base animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-base opacity-20" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-base opacity-20" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
