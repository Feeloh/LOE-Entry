import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, MessageCircle, X, Loader2, User, Bot, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { EffortSubmission } from '../types';
import { aiService } from '../services/aiService';
import Markdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AiHistoryAssistantProps {
  history: EffortSubmission[];
  userName: string;
}

export function AiHistoryAssistant({ history, userName }: AiHistoryAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Hi ${userName.split(' ')[0]}! I'm your LOE Assistant. Ask me anything about your historical work allocations across projects.` }
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

    const response = await aiService.getHistoryChatResponse({
      history,
      query: userMessage,
      username: userName
    });

    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setLoading(false);
  };

  const clearChat = () => {
    setMessages([
      { role: 'assistant', content: `Hi ${userName.split(' ')[0]}! I'm your LOE Assistant. Ask me anything about your historical work allocations across projects.` }
    ]);
  };

  return (
    <>
      {/* Trigger Button */}
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
            className="fixed bottom-24 right-8 z-50 w-[90vw] sm:w-[400px] bg-white rounded-[24px] shadow-2xl border border-sidebar-base/10 overflow-hidden flex flex-col h-[500px]"
          >
            {/* Header */}
            <div className="p-4 bg-sidebar-base text-white flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-action-lime">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">History Assistant</h3>
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest leading-none mt-0.5">Powered by AI</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={clearChat}
                  className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all"
                  title="Clear conversation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth scrollbar-hide bg-slate-50/50"
            >
              {messages.map((m, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "flex flex-col max-w-[85%] gap-1",
                    m.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div className={cn(
                    "flex items-center gap-2 mb-1",
                    m.role === 'user' ? "flex-row-reverse" : "flex-row"
                  )}>
                    <div className={cn(
                      "w-6 h-6 rounded-lg flex items-center justify-center text-[10px]",
                      m.role === 'user' ? "bg-primary-base/10 text-primary-base" : "bg-sidebar-base/10 text-sidebar-base"
                    )}>
                      {m.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-text-muted/60">
                      {m.role === 'user' ? 'Me' : 'Assistant'}
                    </span>
                  </div>
                  <div className={cn(
                    "p-3 rounded-2xl text-xs lg:text-sm font-medium leading-relaxed shadow-sm",
                    m.role === 'user' 
                      ? "bg-primary-base text-white rounded-tr-none" 
                      : "bg-white border border-slate-200 text-text-main rounded-tl-none"
                  )}>
                    <div className="markdown-body font-sans">
                      <Markdown>{m.content}</Markdown>
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="mr-auto items-start flex flex-col gap-1 max-w-[85%]">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-sidebar-base/10 text-sidebar-base">
                      <Bot className="w-3 h-3 animate-bounce" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary-base animate-pulse">Thinking...</span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-2xl rounded-tl-none shadow-sm">
                    <Loader2 className="w-4 h-4 text-primary-base animate-spin" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-slate-100 flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about your work history..."
                className="flex-1 bg-slate-50 border-none focus:ring-2 focus:ring-sidebar-base/20 rounded-xl px-4 py-2.5 text-xs lg:text-sm font-medium placeholder:text-text-muted/40"
              />
              <button
                type="submit"
                disabled={!query.trim() || loading}
                className="w-10 h-10 bg-sidebar-base text-action-lime disabled:opacity-30 disabled:grayscale rounded-xl flex items-center justify-center shadow-lg transition-all active:scale-90"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
