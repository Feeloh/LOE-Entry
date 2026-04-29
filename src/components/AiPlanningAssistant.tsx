import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, MessageCircle, X, Loader2, Bot, Trash2, Zap, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { EffortSubmission, Project } from '../types';
import { aiService } from '../services/aiService';
import Markdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AiPlanningAssistantProps {
  submissions: EffortSubmission[];
  projects: Project[];
  insights: string | null;
  userName: string;
  selectedMonth: string;
}

export function AiPlanningAssistant({ submissions, projects, insights, userName, selectedMonth }: AiPlanningAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Hello ${userName.split(' ')[0]}. Strategic models for ${selectedMonth} are loaded. How can I assist with your resource planning today?` }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userMessage = query.trim();
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    const response = await aiService.getPlanningChatResponse({
      submissions,
      projects,
      insights,
      query: userMessage,
      username: userName,
      month: selectedMonth
    });

    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setLoading(false);
  };

  const clearChat = () => {
    setMessages([
      { role: 'assistant', content: `Chat reset. Strategic models for ${selectedMonth} remain active. I'm ready for your next planning query.` }
    ]);
  };

  return (
    <>
      {/* Floating Button for Planning */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-50 w-14 h-14 bg-sidebar-base text-action-lime rounded-full shadow-2xl flex items-center justify-center border border-white/10 group"
      >
        <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-action-lime opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-action-lime border-2 border-sidebar-base"></span>
        </span>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-8 z-50 w-[90vw] sm:w-[450px] bg-white rounded-[24px] shadow-3xl border border-sidebar-base/10 overflow-hidden flex flex-col h-[600px]"
          >
            {/* Header */}
            <div className="p-4 lg:p-5 bg-sidebar-base text-white flex items-center justify-between shadow-lg relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
              <div className="flex items-center gap-3 relative">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-action-lime ring-1 ring-white/10">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm lg:text-base">Planning Intelligence</h3>
                  <p className="text-[10px] font-black text-action-lime uppercase tracking-widest leading-none mt-1">Direct Strategic Query</p>
                </div>
              </div>
              <div className="flex items-center gap-1 relative">
                <button 
                  onClick={clearChat}
                  className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all"
                  title="Clear conversation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors border border-transparent hover:border-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-5 space-y-6 scroll-smooth bg-slate-50/30"
            >
              {messages.map((m, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "flex flex-col max-w-[90%] gap-1.5",
                    m.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div className={cn(
                    "flex items-center gap-2 mb-1",
                    m.role === 'user' ? "flex-row-reverse" : "flex-row"
                  )}>
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted/50">
                      {m.role === 'user' ? 'Admin' : 'Strategic Assistant'}
                    </span>
                  </div>
                  <div className={cn(
                    "p-4 rounded-2xl text-xs lg:text-[13px] font-medium leading-relaxed shadow-sm",
                    m.role === 'user' 
                      ? "bg-sidebar-base text-white rounded-tr-none" 
                      : "bg-white border border-slate-200 text-text-main rounded-tl-none font-sans"
                  )}>
                    <div className="markdown-body">
                      <Markdown>{m.content}</Markdown>
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="mr-auto items-start flex flex-col gap-1.5 max-w-[90%]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary-base animate-pulse">Running Simulation...</span>
                  </div>
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl rounded-tl-none shadow-sm min-w-[80px] flex justify-center">
                    <Loader2 className="w-5 h-5 text-primary-base animate-spin" />
                  </div>
                </div>
              )}
            </div>

            {/* Strategic Prompt Suggestions */}
            {!loading && messages.length < 3 && (
              <div className="px-5 py-2 flex gap-2 overflow-x-auto scrollbar-hide shrink-0 bg-white/50 border-t border-slate-100">
                {[
                  "Which project is most understaffed?",
                  "Who is currently over 100%?",
                  "Analyze total utilization"
                ].map(txt => (
                  <button
                    key={txt}
                    onClick={() => setQuery(txt)}
                    className="whitespace-nowrap px-3 py-1.5 bg-slate-100/80 hover:bg-primary-base hover:text-white rounded-full text-[10px] font-bold text-text-muted transition-all border border-slate-200"
                  >
                    {txt}
                  </button>
                ))}
              </div>
            )}

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-5 bg-white border-t border-slate-100 flex gap-3 shadow-[0_-5px_20px_rgba(0,0,0,0.02)]">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about project health or staffing..."
                className="flex-1 bg-slate-50 border-none focus:ring-2 focus:ring-sidebar-base/10 rounded-xl px-5 py-3 text-xs lg:text-[13px] font-medium placeholder:text-text-muted/30"
              />
              <button
                type="submit"
                disabled={!query.trim() || loading}
                className="w-12 h-12 bg-sidebar-base text-action-lime disabled:opacity-30 disabled:grayscale rounded-xl flex items-center justify-center shadow-xl transition-all hover:scale-105 active:scale-95"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
