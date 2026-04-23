import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { submissionService } from '../services/submissionService';
import { EffortSubmission, Message } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, RotateCcw, MessageSquare, AlertTriangle, Send, MoreHorizontal, ShieldCheck, Trash2, AlertCircle, Plus, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

export default function TeamReview() {
  const { profile } = useAuth();
  const [submissions, setSubmissions] = useState<EffortSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<EffortSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [acting, setActing] = useState(false);
  const [isRevisionMode, setIsRevisionMode] = useState(false);
  const commentInputRef = React.useRef<HTMLInputElement>(null);

  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.toISOString().slice(0, 7));
  const [selectorYear, setSelectorYear] = useState(today.getFullYear());
  const [isMonthSelectorOpen, setIsMonthSelectorOpen] = useState(false);
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  useEffect(() => {
    async function fetchSubmissions() {
      if (!profile) return;
      setLoading(true);
      const data = await submissionService.getTeamSubmissions(profile.uid, selectedMonth);
      setSubmissions(data);
      if (data.length > 0) setSelectedSubmission(data[0]);
      setLoading(false);
    }
    fetchSubmissions();
  }, [profile, selectedMonth]);

  useEffect(() => {
    if (selectedSubmission?.id) {
      return submissionService.subscribeToMessages(selectedSubmission.id, setMessages);
    }
  }, [selectedSubmission?.id]);

  const handleApprove = async () => {
    if (!selectedSubmission) return;
    setActing(true);
    await submissionService.approveSubmission(selectedSubmission.id);
    setSubmissions(submissions.map(s => s.id === selectedSubmission.id ? { ...s, status: 'approved' } : s));
    setSelectedSubmission({ ...selectedSubmission, status: 'approved' });
    setActing(false);
  };

  const handleRevision = async () => {
    if (!selectedSubmission || !newMessage.trim()) return;
    setActing(true);
    await submissionService.sendMessage(selectedSubmission.id, {
      senderId: profile?.uid || '',
      senderName: profile?.displayName || 'Manager',
      content: `REVISION REQUESTED: ${newMessage.trim()}`
    });
    await submissionService.requestRevision(selectedSubmission.id);
    setSubmissions(submissions.map(s => s.id === selectedSubmission.id ? { ...s, status: 'needs_revision' } : s));
    setSelectedSubmission({ ...selectedSubmission, status: 'needs_revision' });
    setNewMessage('');
    setIsRevisionMode(false);
    setActing(false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedSubmission?.id || !profile) return;
    await submissionService.sendMessage(selectedSubmission.id, {
      senderId: profile.uid,
      senderName: profile.displayName || 'Manager',
      content: newMessage
    });
    setNewMessage('');
  };

  useEffect(() => {
    if (isRevisionMode && commentInputRef.current) {
      commentInputRef.current.focus();
    }
  }, [isRevisionMode]);

  if (loading) return <div className="h-full flex items-center justify-center italic text-text-muted">Loading review queue...</div>;

  const isAdmin = profile?.role === 'admin';
  const isManagerEntry = selectedSubmission?.userRole === 'manager';
  const canApprove = !acting && selectedSubmission?.status !== 'approved' && selectedSubmission?.status !== 'draft' && (!isAdmin || isManagerEntry);
  const canInitiateRevision = !acting && selectedSubmission?.status !== 'approved' && selectedSubmission?.status !== 'draft' && (!isAdmin || isManagerEntry);

  return (
    <div className="h-full flex flex-col space-y-4 lg:space-y-8 pb-4 min-h-0 max-w-screen-2xl mx-auto w-full px-4 lg:px-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center shrink-0 mb-4 lg:mb-8 mt-4 lg:mt-0 gap-4">
        <div className="flex flex-col md:flex-row items-center justify-between w-full gap-4">
          <div className="flex items-center gap-3 lg:gap-4 w-full md:w-auto">
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
                          const isSelected = monthStr === selectedMonth;
                          const isFuture = monthStr > today.toISOString().slice(0, 7);

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
                                isSelected 
                                  ? "bg-primary-base text-white shadow-lg border-primary-base" 
                                  : isFuture ? "bg-bg-base text-text-muted/30 cursor-not-allowed" : "bg-bg-base text-text-muted hover:bg-slate-200"
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

          <div className="flex items-center gap-4 ml-auto md:ml-0">
            {selectedSubmission?.allocations.some(a => a.plannedPercent > 50) && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 bg-amber-50 px-3 lg:px-4 py-1.5 lg:py-2 rounded-md border border-amber-100 text-amber-700 shadow-sm animate-pulse"
              >
                <AlertCircle className="w-3 h-3 lg:w-4 h-4" />
                <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.15em]">Flag: High Concentration</span>
              </motion.div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4 lg:gap-8 min-h-0 mb-4">
        {/* Left: Team Roster */}
        <div className="xl:col-span-3 flex flex-col min-h-0 md:h-[400px] xl:h-auto">
          <div className="bg-white border border-border-base/60 rounded-card overflow-hidden shadow-sm flex flex-col h-full min-h-0">
            <div className="p-3 lg:p-4 border-b border-border-base/60 bg-slate-50/50 shrink-0 px-4 lg:px-8">
              <h3 className="font-bold text-text-main text-[10px] lg:text-[11px] uppercase tracking-[0.15em]">Team Overview</h3>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-hide divide-y divide-border-base/30">
              {submissions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSubmission(s)}
                  className={cn(
                    "w-full p-4 lg:p-5 px-4 lg:px-8 flex items-center gap-3 lg:gap-4 text-left transition-all group relative",
                    selectedSubmission?.id === s.id 
                      ? "bg-primary-base text-white" 
                      : "bg-white hover:bg-slate-50"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 lg:w-10 h-10 rounded-full flex items-center justify-center shrink-0 border font-black italic shadow-sm text-xs lg:text-sm",
                    selectedSubmission?.id === s.id ? "bg-white/20 border-white/20 text-white" : "bg-slate-100 border-border-base text-text-muted/60"
                  )}>
                    {s.userName?.charAt(0) || 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs lg:text-sm font-black tracking-tight truncate">{s.userName || 'Employee Name'}</p>
                    <span className={cn(
                      "text-[9px] lg:text-[10px] font-bold uppercase tracking-[0.2em] opacity-60",
                      selectedSubmission?.id === s.id ? "text-white/80" : (s.status === 'submitted' ? "text-primary-base" : s.status === 'approved' ? "text-success-base" : "text-amber-600")
                    )}>
                      {s.status === 'needs_revision' ? 'Revising' : s.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Detail View */}
        <div className="md:col-span-2 xl:col-span-6 flex flex-col min-h-0 order-first md:order-none xl:h-auto">
          <div className="bg-white border border-border-base/60 rounded-card overflow-hidden flex flex-col h-full min-h-0 shadow-sm">
            {selectedSubmission ? (
              <>
                <div className="p-3 lg:p-4 border-b border-border-base/60 flex justify-between items-center bg-slate-50/50 shrink-0 px-4 lg:px-8">
                  <h2 className="font-bold text-text-main text-[10px] lg:text-[11px] uppercase tracking-[0.15em] flex items-center gap-2">
                    Team Review & Allocation Matrix
                  </h2>
                  <button className="text-text-muted hover:text-text-main transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-0 flex-1 overflow-y-auto relative z-10 scrollbar-hide">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                      <thead>
                        <tr className="border-b border-border-base/50 bg-slate-50/30">
                          <th className="py-3 lg:py-4 px-4 lg:px-8 text-[9px] lg:text-[10px] font-black text-text-muted/60 uppercase tracking-[0.2em] w-3/5">Project Initiative</th>
                          <th className="py-3 lg:py-4 px-4 text-[9px] lg:text-[10px] font-black text-text-muted/60 uppercase tracking-[0.2em] text-center">Alloc %</th>
                          <th className="py-3 lg:py-4 px-4 lg:px-8 text-[9px] lg:text-[10px] font-black text-text-muted/60 uppercase tracking-[0.2em] text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-base/40">
                        {selectedSubmission.allocations.map((alloc, idx) => (
                          <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 lg:py-5 px-4 lg:px-8">
                              <span className="font-bold text-text-main text-xs lg:text-sm tracking-tight">{alloc.projectName}</span>
                            </td>
                            <td className="py-4 lg:py-5 px-4 text-center">
                              <span className="text-xs lg:text-sm font-black text-text-main tabular-nums">{alloc.plannedPercent}%</span>
                            </td>
                            <td className="py-4 lg:py-5 px-4 lg:px-8 text-center">
                               <button disabled className="p-2 text-text-muted/20 cursor-not-allowed group-hover:text-text-muted/40 transition-all inline-flex items-center justify-center">
                                 <Trash2 className="w-4 h-4" />
                               </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-4 lg:p-8">
                    <button className="flex items-center gap-3 text-primary-base hover:text-primary-base/80 transition-all font-bold text-[10px] lg:text-[12px] uppercase tracking-widest opacity-40 cursor-not-allowed">
                      <Plus className="w-3.5 h-3.5 lg:w-4 h-4" />
                      Add Project Line Item
                    </button>
                  </div>
                </div>

                <div className="p-4 lg:p-8 bg-slate-50 border-t border-border-base shrink-0 space-y-4 lg:space-y-6">
                  <div className="flex items-center gap-4 lg:gap-8">
                    <div className="min-w-max text-[9px] lg:text-[10px] font-black text-text-muted/60 tracking-[0.2em] uppercase">Total Allocation:</div>
                    <div className="flex-1 h-2 lg:h-3 bg-slate-200 rounded-full overflow-hidden flex">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${selectedSubmission.totalHours ? (selectedSubmission.totalHours / 1.68) : 100}%` }}
                        className="h-full transition-all duration-500 rounded-full bg-primary-base shadow-[0_0_12px_rgba(0,106,111,0.4)]"
                      />
                    </div>
                    <div className="font-black text-xl lg:text-2xl w-16 lg:w-20 text-right italic tabular-nums tracking-tighter text-primary-base">
                      {selectedSubmission.totalHours || 168}.0
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 w-full sm:w-auto">
                      <button 
                        disabled={!canInitiateRevision}
                        onClick={() => setIsRevisionMode(true)}
                        className={cn(
                          "w-full sm:w-auto px-6 lg:px-8 py-2.5 lg:py-3 bg-white border border-border-base text-primary-base rounded-md font-bold text-[10px] lg:text-[11px] hover:bg-bg-base transition-all disabled:opacity-30 uppercase tracking-widest shadow-sm",
                          isRevisionMode && "border-red-200 bg-red-50 text-red-600"
                        )}
                      >
                        Request Revision
                      </button>
                      <button 
                        disabled={!canApprove || isRevisionMode}
                        onClick={handleApprove}
                        className="w-full sm:w-auto px-8 lg:px-10 py-2.5 lg:py-3 bg-action-lime text-[#1E293B] rounded-md font-bold text-[10px] lg:text-[11px] hover:shadow-lg transition-all disabled:opacity-30 uppercase tracking-widest shadow-sm"
                      >
                        Approve Entry
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-text-muted p-6 lg:p-10 opacity-40 bg-slate-50/20">
                <div className="w-12 h-12 lg:w-16 h-16 border-4 border-dashed border-slate-200 rounded-full flex items-center justify-center mb-4 lg:mb-6">
                  <ShieldCheck className="w-6 h-6 lg:w-8 h-8 text-slate-200" />
                </div>
                <p className="text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] text-center leading-loose">Select detailed record<br/>for executive review</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Discussion */}
        <div className="xl:col-span-3 flex flex-col min-h-0 bg-transparent xl:h-auto">
          <div className={cn(
            "bg-white border border-border-base/60 rounded-card overflow-hidden flex flex-col h-full min-h-0 transition-all duration-300 shadow-sm",
            isRevisionMode ? "ring-2 ring-red-500/10 border-red-200" : ""
          )}>
            <div className={cn(
              "p-3 lg:p-4 border-b border-border-base/60 flex items-center justify-between bg-slate-50/50 shrink-0 px-4 lg:px-8",
              isRevisionMode && "bg-red-50/30"
            )}>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 lg:w-4 h-4 text-primary-base" />
                <h3 className="font-bold text-text-main text-[10px] lg:text-[11px] uppercase tracking-[0.15em]">Verification Log</h3>
              </div>
              {messages.length > 0 && !isRevisionMode && (
                <div className="w-1.5 h-1.5 lg:w-2 h-2 rounded-full bg-success-base shadow-[0_0_8px_#10B981]" />
              )}
              {isRevisionMode && (
                 <button 
                  onClick={() => setIsRevisionMode(false)}
                  className="text-[9px] font-black text-red-600 uppercase tracking-widest hover:underline"
                 >
                   Cancel
                 </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-4 lg:space-y-6 flex flex-col scrollbar-hide bg-slate-50/10 min-h-[300px]">
              {messages.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center opacity-20 italic text-[11px] uppercase font-bold tracking-widest text-text-muted">
                   <MessageSquare className="w-8 h-8 mb-4 opacity-50" />
                   No interactions recorded
                </div>
              )}
              {messages.length > 0 && (
                <div className="text-center mb-2">
                  <span className="text-[9px] lg:text-[10px] font-black text-text-muted/40 uppercase tracking-[0.2em]">Audit timeline active</span>
                </div>
              )}
              
              {messages.map((msg, idx) => (
                <div key={idx} className={cn(
                  "flex flex-col max-w-[95%] lg:max-w-[90%]",
                  msg.senderId === profile?.uid ? "ml-auto items-end" : "mr-auto items-start"
                )}>
                  <div className="flex items-center gap-2 mb-1.5">
                     {msg.senderId !== profile?.uid && (
                       <div className="w-5 h-5 lg:w-6 h-6 rounded-full bg-slate-200 border border-border-base flex items-center justify-center text-[7px] lg:text-[8px] font-black text-text-muted italic">
                         {msg.senderName.charAt(0)}
                       </div>
                     )}
                     <span className="text-[8px] lg:text-[9px] font-black text-text-muted uppercase tracking-[0.28em] opacity-40">{msg.senderName}</span>
                     {msg.senderId === profile?.uid && (
                       <div className="w-5 h-5 lg:w-6 h-6 rounded-full bg-primary-base border border-white/20 flex items-center justify-center text-[7px] lg:text-[8px] font-black text-white italic">
                         {msg.senderName.charAt(0)}
                       </div>
                     )}
                  </div>
                  <div className={cn(
                    "p-3 lg:p-4 text-[11px] lg:text-[12px] leading-relaxed rounded-xl whitespace-pre-wrap shadow-sm",
                    msg.senderId === profile?.uid 
                      ? "bg-primary-base text-white rounded-tr-none" 
                      : "bg-white text-text-main border border-border-base rounded-tl-none shadow-sm"
                  )}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            <div className={cn(
              "p-4 lg:p-6 bg-slate-50/80 border-t border-border-base shrink-0 transition-colors duration-500",
              isRevisionMode && "bg-red-50/50"
            )}>
              <div className="relative flex items-center group w-full">
                <input 
                  ref={commentInputRef}
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (isRevisionMode ? handleRevision() : handleSendMessage())}
                  placeholder={isRevisionMode ? "Reason for revision..." : "Note for audit log..."}
                  className={cn(
                    "w-full pl-5 lg:pl-6 pr-12 lg:pr-14 py-3 lg:py-3.5 bg-white border border-border-base/60 rounded-xl text-xs lg:text-[13px] font-medium focus:ring-4 focus:ring-primary-base/5 outline-none transition-all placeholder:text-text-muted/40 shadow-sm",
                    isRevisionMode && "border-red-200 focus:ring-red-500/10 focus:border-red-300"
                  )}
                />
                <button 
                  disabled={!newMessage.trim()}
                  onClick={() => isRevisionMode ? handleRevision() : handleSendMessage()}
                  className={cn(
                    "absolute right-1 lg:right-1.5 p-2 lg:p-2.5 transition-all disabled:opacity-20 rounded-full flex items-center justify-center",
                    isRevisionMode ? "text-red-700 bg-red-50 hover:bg-red-100" : "text-primary-base hover:bg-primary-base hover:text-white"
                  )}
                >
                  <Send className={cn("w-4 h-4 lg:w-4.5 lg:h-4.5", isRevisionMode && "text-red-600")} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
