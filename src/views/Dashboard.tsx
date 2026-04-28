import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { submissionService } from '../services/submissionService';
import { EffortSubmission, Project, Allocation, Message } from '../types';
import { Save, Send, Plus, Info, MessageSquare, AlertCircle, LayoutDashboard, ChevronLeft, ChevronRight, ChevronDown, Trash2, MoreHorizontal, ShieldCheck, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { ReminderBanner } from '../components/ReminderBanner';

export default function Dashboard() {
  const { profile } = useAuth();
  const [submission, setSubmission] = useState<EffortSubmission | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<EffortSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  const today = new Date();
  const currentMonth = today.toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectorYear, setSelectorYear] = useState(today.getFullYear());
  const [isMonthSelectorOpen, setIsMonthSelectorOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  useEffect(() => {
    async function fetchData() {
      if (!profile) return;
      setLoading(true);
      
      const [existing, allProjects, userSubmissions] = await Promise.all([
        submissionService.getCurrentSubmission(profile.uid, selectedMonth),
        submissionService.getProjects(),
        submissionService.getSubmissions(profile.uid)
      ]);

      setProjects(allProjects.filter(p => p.id !== 'time-off' && p.id !== 'open-project'));
      setAllSubmissions(userSubmissions);

      if (existing) {
        setSubmission(existing);
      } else {
        // Create initial placeholder if none exists
        const initialSubmission: Partial<EffortSubmission> = {
          userId: profile.uid,
          userName: profile.displayName,
          userRole: profile.role,
          month: selectedMonth,
          status: 'draft',
          allocations: [
            { projectId: 'time-off', projectName: 'Time-Off (PTO / Holidays)', role: '-', targetPercent: 0, plannedPercent: 0 },
            { projectId: 'open-project', projectName: 'Open to New Project', role: '-', targetPercent: 0, plannedPercent: 0 }
          ],
          totalHours: 0,
          messages: [
            {
              id: 'init-1',
              senderId: 'admin_user',
              senderName: 'System Admin',
              content: `The LOE reporting cycle for ${new Date(selectedMonth).toLocaleDateString([], { month: 'long', year: 'numeric' })} is now officially open. Please ensure all project allocations are accurately reflected before the submission deadline.`,
              timestamp: new Date(new Date().getTime() - 86400000).toISOString() // 1 day ago
            },
            {
              id: 'init-2',
              senderId: 'mock_manager_id',
              senderName: 'Team Lead',
              content: "Team, please verify your billable percentages against the project roadmaps. Any variances over 10% from the previous month require an audit note.",
              timestamp: new Date(new Date().getTime() - 43200000).toISOString() // 12 hours ago
            },
            {
              id: 'init-3',
              senderId: profile.uid,
              senderName: profile.displayName || 'Resource',
              content: "Initializing my monthly allocation matrix. I'll flag any capacity constraints once the BDC planning is finalized.",
              timestamp: new Date().toISOString()
            }
          ]
        };
        setSubmission(initialSubmission as EffortSubmission);
      }
      setLoading(false);
    }
    fetchData();
  }, [profile, selectedMonth]);

  useEffect(() => {
    if (submission?.id) {
      return submissionService.subscribeToMessages(submission.id, (msgs) => {
        setMessages(msgs);
        // Refresh submissions list when messages change as they might signal a status change from manager
        if (profile) {
          submissionService.getSubmissions(profile.uid).then(setAllSubmissions);
        }
      });
    } else {
      setMessages([]);
    }
  }, [submission?.id, profile]);

  const handleUpdateAllocation = (index: number, field: keyof Allocation, value: any) => {
    if (!submission) return;
    const newAllocations = [...submission.allocations];
    
    if (field === 'projectId') {
      const p = projects.find(proj => proj.id === value);
      newAllocations[index] = { 
        ...newAllocations[index], 
        projectId: value,
        projectName: p?.name || (value === '' ? '' : newAllocations[index].projectName)
      };
    } else {
      newAllocations[index] = { ...newAllocations[index], [field]: value };
    }
    
    setSubmission({ ...submission, allocations: newAllocations });
  };

  const handleAddProject = () => {
    if (!submission) return;
    const newAllocations: Allocation[] = [
      ...submission.allocations,
      { projectId: '', projectName: '', role: profile?.title || '', targetPercent: 0, plannedPercent: 0 }
    ];
    setSubmission({ ...submission, allocations: newAllocations });
  };

  const calculateTotal = () => {
    return submission?.allocations.reduce((sum, item) => sum + (Number(item.plannedPercent) || 0), 0) || 0;
  };

  const handleSave = async (isSubmit = false) => {
    if (!submission || !profile) return;
    setValidationError(null);

    if (isSubmit) {
      const invalidEntry = submission.allocations.find(a => !a.projectId || a.plannedPercent <= 0);
      if (invalidEntry) {
        setValidationError("All project entries must have an initiative selected and an allocation percentage greater than zero.");
        return;
      }
    }

    setSaving(true);
    try {
      const data = {
        ...submission,
        userRole: profile.role,
        userName: profile.displayName,
        status: isSubmit ? 'submitted' : submission.status,
        totalHours: 168 // Assuming standard month for demo
      };

      if (submission.id) {
        await submissionService.updateSubmission(submission.id, data);
      } else {
        const id = await submissionService.createSubmission(data);
        setSubmission({ ...data as EffortSubmission, id });
      }
      
      if (isSubmit) {
        setSubmission(prev => prev ? { ...prev, status: 'submitted' } : null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !submission?.id || !profile) return;
    await submissionService.sendMessage(submission.id, {
      senderId: profile.uid,
      senderName: profile.displayName || 'Me',
      content: newMessage
    });
    setNewMessage('');
  };

  if (loading) return <div className="h-full flex items-center justify-center italic text-text-muted">Initializing LOE Matrix...</div>;

  const totalAllocated = calculateTotal();
  const isLocked = submission?.status === 'approved' || submission?.status === 'submitted';
  const isRevisionRequested = submission?.status === 'needs_revision';
  const canEdit = !isLocked || isRevisionRequested;

  return (
    <div className="h-full flex flex-col space-y-4 lg:space-y-8 pb-4 min-h-0 max-w-screen-2xl mx-auto w-full px-2 lg:px-8">
      {profile?.role && <ReminderBanner role={profile.role} context="submission" />}
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
                          
                          const isCurrent = monthStr === currentMonth;
                          const isSelected = monthStr === selectedMonth;
                          const isNeedsRevision = subForMonth?.status === 'needs_revision';
                          const isDisabled = !isCurrent && !isNeedsRevision;

                          return (
                            <button
                              key={m}
                              disabled={isDisabled}
                              onClick={() => {
                                setSelectedMonth(monthStr);
                                setIsMonthSelectorOpen(false);
                              }}
                              className={cn(
                                "w-16 lg:w-20 py-2.5 lg:py-3 rounded-xl text-[11px] font-black tracking-tight transition-all relative border border-transparent uppercase",
                                isSelected 
                                  ? "bg-primary-base text-white shadow-lg border-primary-base" 
                                  : "bg-bg-base text-text-muted hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed",
                                isNeedsRevision && !isSelected && "border-amber-400"
                              )}
                            >
                              {m}
                              {isNeedsRevision && !isSelected && (
                                <span className="absolute -top-1 -right-1 w-2 lg:w-2.5 h-2 lg:h-2.5 bg-amber-500 rounded-full border-2 border-white shadow-sm" />
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

        <div className="flex items-center gap-3 lg:gap-4 w-full md:w-auto ml-auto">
          <button 
            disabled={saving || !canEdit}
            onClick={() => handleSave(false)}
            className="flex-1 md:flex-none px-6 lg:px-10 py-2.5 lg:py-3 bg-white border border-border-base/60 rounded-md font-bold text-[10px] lg:text-[11px] text-primary-base hover:bg-bg-base transition-all disabled:opacity-50 uppercase tracking-widest shadow-sm"
          >
            Save Draft
          </button>
          <button 
            disabled={saving || !canEdit}
            onClick={() => handleSave(true)}
            className="flex-1 md:flex-none px-6 lg:px-10 py-2.5 lg:py-3 bg-action-lime text-[#1E293B] rounded-md font-bold text-[10px] lg:text-[11px] hover:shadow-lg transition-all disabled:opacity-50 uppercase tracking-widest shadow-sm"
          >
            Submit LOE
          </button>
        </div>
      </header>

      {validationError && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-0 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-4 text-red-700 shadow-sm"
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-[11px] lg:text-xs font-bold uppercase tracking-wider">{validationError}</p>
          <button onClick={() => setValidationError(null)} className="ml-auto text-[10px] font-black uppercase tracking-widest hover:underline">Dismiss</button>
        </motion.div>
      )}

      <div className="flex-1 grid grid-cols-12 gap-4 lg:gap-8 min-h-0">
        {/* Main Entry Form */}
        <div className="col-span-8 flex flex-col min-h-0 order-none">
          <div className="bg-white border border-border-base/60 rounded-card overflow-hidden flex flex-col h-full shadow-sm">
            <div className="p-2 lg:p-4 border-b border-border-base/60 flex justify-between items-center bg-slate-50/50 shrink-0 px-2 lg:px-8">
              <h2 className="font-bold text-text-main text-[10px] lg:text-[11px] uppercase tracking-[0.15em] flex items-center gap-2">
                Project Allocation Matrix
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
                      <th className="py-3 lg:py-4 px-4 lg:px-8 text-[9px] lg:text-[10px] font-black text-text-muted/60 uppercase tracking-[0.2em] w-3/5">Project Name</th>
                      <th className="py-3 lg:py-4 px-4 text-[9px] lg:text-[10px] font-black text-text-muted/60 uppercase tracking-[0.2em] w-1/4">Allocation %</th>
                      <th className="py-3 lg:py-4 px-4 lg:px-8 text-[9px] lg:text-[10px] font-black text-text-muted/60 uppercase tracking-[0.2em] text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-base/40">
                    {submission?.allocations.map((alloc, idx) => {
                      const isSystem = alloc.projectId === 'time-off' || alloc.projectId === 'open-project';
                      return (
                        <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 lg:py-5 px-4 lg:px-8">
                            <div className="flex flex-col gap-1">
                              {isSystem ? (
                                <span className="font-bold text-text-main text-xs lg:text-sm tracking-tight">{alloc.projectName}</span>
                              ) : (
                                <select 
                                  disabled={!canEdit}
                                  value={alloc.projectId}
                                  onChange={(e) => handleUpdateAllocation(idx, 'projectId', e.target.value)}
                                  className="bg-transparent border-none p-0 font-bold text-text-main text-xs lg:text-sm focus:ring-0 w-full outline-none cursor-pointer tracking-tight"
                                >
                                  <option value="">Select Initiative</option>
                                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                              )}
                            </div>
                          </td>
                          <td className="py-4 lg:py-5 px-4">
                            <div className="flex items-center gap-2">
                              <input 
                                disabled={!canEdit}
                                type="number" 
                                max="100"
                                min="0"
                                value={alloc.plannedPercent} 
                                onChange={(e) => handleUpdateAllocation(idx, 'plannedPercent', parseInt(e.target.value) || 0)}
                                className="w-14 lg:w-16 h-8 lg:h-10 px-2 bg-white border border-border-base/60 rounded-md text-right text-xs lg:text-sm font-black text-text-main focus:border-primary-base focus:ring-4 focus:ring-primary-base/5 outline-none transition-all tabular-nums"
                              />
                              <span className="text-[10px] lg:text-xs text-text-muted font-bold">%</span>
                            </div>
                          </td>
                          <td className="py-4 lg:py-5 px-4 lg:px-8 text-center">
                            {!isSystem && canEdit ? (
                              <button 
                                onClick={() => {
                                  const newAllocations = [...(submission?.allocations || [])];
                                  newAllocations[idx] = { 
                                    ...newAllocations[idx], 
                                    projectId: '', 
                                    projectName: '', 
                                    role: '', 
                                    plannedPercent: 0 
                                  };
                                  if (submission) setSubmission({ ...submission, allocations: newAllocations });
                                }}
                                className="p-2 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-md transition-all inline-flex items-center justify-center"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <div className="p-2 text-text-muted/20 flex items-center justify-center">
                                <ShieldCheck className="w-4 h-4" />
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {canEdit && (
                <div className="p-6 lg:p-8 border-t border-border-base/50">
                  <button 
                    onClick={handleAddProject}
                    className="flex items-center gap-3 text-primary-base hover:text-primary-base/80 transition-all font-bold text-[10px] lg:text-[12px] uppercase tracking-widest"
                  >
                    <Plus className="w-3.5 h-3.5 lg:w-4 h-4" />
                    Add Project Line Item
                  </button>
                </div>
              )}
            </div>

            <div className="px-4 lg:px-8 py-4 lg:py-6 bg-slate-100/50 border-t border-border-base flex items-center gap-4 lg:gap-8 shrink-0">
              <div className="min-w-max text-[9px] lg:text-[10px] font-black text-text-muted/60 tracking-[0.2em] uppercase">Total Allocation:</div>
              <div className="flex-1 h-2 lg:h-3 bg-slate-200 rounded-full overflow-hidden flex">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${totalAllocated}%` }}
                  className={cn("h-full transition-all duration-500 rounded-full", totalAllocated > 100 ? "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]" : "bg-primary-base shadow-[0_0_12px_rgba(0,106,111,0.4)]")}
                />
              </div>
              <div className={cn("font-black text-xl lg:text-2xl w-16 lg:w-20 text-right italic tabular-nums tracking-tighter", totalAllocated > 100 ? "text-red-600" : "text-primary-base")}>
                {totalAllocated}%
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-4 flex flex-col min-h-0 bg-transparent">
          <div className="bg-white border border-border-base/60 rounded-card overflow-hidden flex flex-col h-full shadow-sm relative">
            <div className="p-2 lg:p-4 border-b border-border-base/60 flex items-center justify-between bg-white shrink-0 px-2 lg:px-8 z-20">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 lg:w-4 h-4 text-primary-base" />
                <h2 className="font-bold text-text-main text-[10px] lg:text-[11px] uppercase tracking-[0.15em]">Chat Panel</h2>
              </div>
              {messages.length > 0 && <Bell className="w-3 h-3 lg:w-3.5 h-3.5 text-success-base animate-pulse" />}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 lg:space-y-6 flex flex-col scrollbar-hide bg-slate-50/10 min-h-0 z-10">
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-text-muted opacity-20">
                  <AlertCircle className="w-6 h-6 lg:w-8 h-8 mb-4 border-2 border-dashed border-current rounded-full p-1" />
                  <p className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest leading-loose">No dynamic insights<br/>for this cycle</p>
                </div>
              ) : (
                <>
                  <div className="text-center pt-2 mb-2">
                    <span className="px-3 py-1 bg-white border border-border-base/40 rounded-full text-[8px] lg:text-[9px] font-black text-text-muted/40 uppercase tracking-[0.2em] shadow-sm">Audit timeline active</span>
                  </div>
                  {messages.map((msg, idx) => (
                    <div key={idx} className={cn(
                      "flex flex-col max-w-[85%] lg:max-w-[80%]",
                      msg.senderId === profile?.uid ? "ml-auto items-end" : "mr-auto items-start"
                    )}>
                      <div className="flex items-center gap-2 mb-1.5 px-1">
                         {msg.senderId !== profile?.uid && (
                           <div className="w-5 h-5 lg:w-6 h-6 rounded-full bg-slate-200 border border-border-base flex items-center justify-center text-[7px] lg:text-[8px] font-black text-text-muted italic shadow-sm">
                             {msg.senderName.charAt(0)}
                           </div>
                         )}
                         <span className="text-[8px] lg:text-[9px] font-black text-text-muted uppercase tracking-[0.28em] opacity-40">{msg.senderName}</span>
                         {msg.senderId === profile?.uid && (
                           <div className="w-5 h-5 lg:w-6 h-6 rounded-full bg-primary-base border border-white/20 flex items-center justify-center text-[7px] lg:text-[8px] font-black text-white italic shadow-sm">
                             {msg.senderName.charAt(0)}
                           </div>
                         )}
                      </div>
                      <div className={cn(
                        "p-3 lg:p-4 text-[11px] lg:text-[12px] leading-relaxed rounded-xl whitespace-pre-wrap shadow-sm",
                        msg.senderId === profile?.uid 
                          ? "bg-primary-base text-white rounded-tr-none" 
                          : "bg-white text-text-main border border-border-base rounded-tl-none shadow-[0_2px_4px_rgba(0,0,0,0.02)]"
                      )}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {submission?.status === 'submitted' && (
                <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest w-fit mx-auto shadow-sm">
                  DRAFT UPDATED
                </div>
              )}
            </div>

            <div className="p-4 lg:p-6 bg-slate-50/80 border-t border-border-base shrink-0">
              <div className="relative flex items-center group w-full">
                <input 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Note for audit log..."
                  className="w-full pl-5 lg:pl-6 pr-12 lg:pr-14 py-3 lg:py-3.5 bg-white border border-border-base/60 rounded-xl text-xs lg:text-[13px] font-medium focus:ring-4 focus:ring-primary-base/5 outline-none transition-all placeholder:text-text-muted/40 shadow-sm"
                />
                <button 
                  disabled={!newMessage.trim()}
                  onClick={handleSendMessage}
                  className="absolute right-1 lg:right-1.5 p-2 lg:p-2.5 text-primary-base hover:bg-primary-base hover:text-white transition-all disabled:opacity-20 rounded-full flex items-center justify-center translate-x-0"
                >
                  <Send className="w-4 h-4 lg:w-4.5 lg:h-4.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
