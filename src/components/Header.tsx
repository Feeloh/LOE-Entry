import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, LogOut, User, Shield, Users as UsersIcon, HelpCircle, X, Info } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { sessionStore } from '../lib/sessionStore';

interface HeaderProps {
  onNavigate: (id: string) => void;
  activeId: string;
}

const HELP_CONTENT: Record<string, { title: string; hint: string; description: string }> = {
  'dashboard': {
    title: 'Submission Portal',
    hint: 'Allocating Effort',
    description: 'Use the Matrix to distribute your monthly hours. The system automatically calculates your total utilization percentage based on 168 available hours. Remember to click "Submit Review" once finalized.'
  },
  'team-review': {
    title: 'Audit & Review',
    hint: 'Quality Assurance',
    description: 'Monitor your team\'s reporting status in real-time. Review specific entries, request revisions for discrepancies, or provide final approvals for the reporting period.'
  },
  'planning': {
    title: 'Strategic Analysis',
    hint: 'Resource Optimization',
    description: 'High-level overview of organizational health. Analyze department utilization targets versus actuals and identify potential talent bottlenecks in project delivery.'
  },
  'history': {
    title: 'LOE Archive',
    hint: 'Audit Trail',
    description: 'Access historical records of all submitted and approved LOEs. Use the lookup filter to find specific reporting periods or individual team member records.'
  }
};

export function Header({ onNavigate, activeId }: HeaderProps) {
  const { profile, logout, switchRole } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);
  const currentMonth = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date());

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
        setIsHelpOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleSwitch = (role: 'employee' | 'manager' | 'admin') => {
    switchRole(role);
    setIsMenuOpen(false);
    // Redirect to an appropriate view for the new role
    if (role === 'admin') {
      onNavigate('team-review');
    } else {
      onNavigate('dashboard');
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'manager': return 'Team Lead';
      default: return 'Employee';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-3.5 h-3.5" />;
      case 'manager': return <UsersIcon className="w-3.5 h-3.5" />;
      default: return <User className="w-3.5 h-3.5" />;
    }
  };

  const currentHelp = HELP_CONTENT[activeId] || HELP_CONTENT['dashboard'];

  return (
    <header className="h-20 border-b border-border-base flex items-center justify-between px-10 bg-white sticky top-0 z-50 shadow-sm shadow-black/2">
      <div className="flex items-center gap-10 flex-1">
      </div>

      <div className="flex items-center gap-6">
        {/* Help Center */}
        <div className="relative" ref={helpRef}>
          <button
            onClick={() => setIsHelpOpen(!isHelpOpen)}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all border border-transparent",
              isHelpOpen ? "bg-slate-100 border-slate-200 text-primary-base" : "text-text-muted hover:bg-slate-50 hover:text-text-main"
            )}
            title="Help Center"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          <AnimatePresence>
            {isHelpOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-80 bg-white border border-border-base rounded-2xl shadow-2xl overflow-hidden z-[60]"
              >
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary-base/10 flex items-center justify-center text-primary-base">
                        <Info className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-text-main text-sm">Help Center</h3>
                    </div>
                    <button 
                      onClick={() => setIsHelpOpen(false)}
                      className="p-1 hover:bg-slate-100 rounded-md transition-colors"
                    >
                      <X className="w-4 h-4 text-text-muted" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                      <p className="text-[10px] font-black text-primary-base uppercase tracking-[0.2em] mb-1">{currentHelp.hint}</p>
                      <h4 className="text-sm font-bold text-text-main mb-2">{currentHelp.title}</h4>
                      <p className="text-xs text-text-muted font-medium leading-relaxed">
                        {currentHelp.description}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button className="text-[10px] text-left font-bold text-primary-base hover:underline uppercase tracking-widest">
                        View Documentation &rarr;
                      </button>
                      <button className="text-[10px] text-left font-bold text-text-muted hover:text-text-main hover:underline uppercase tracking-widest">
                        Contact Support
                      </button>
                    </div>
                  </div>
                </div>
                <div className="bg-primary-dark/5 p-3 text-center border-t border-border-base/50">
                  <p className="text-[9px] font-bold text-text-muted opacity-60 uppercase tracking-widest">PixelEdge LOE System v1.4</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={cn(
              "flex items-center gap-3 bg-bg-base px-3 py-2 pl-2 pr-4 rounded-full border border-border-base transition-all hover:bg-slate-50 group",
              isMenuOpen ? "border-primary-base ring-2 ring-primary-base/5" : ""
            )}
          >
            <div className="w-8 h-8 rounded-full bg-sidebar-base flex items-center justify-center text-[10px] font-bold text-white uppercase italic border border-white/10 shrink-0">
              {profile?.displayName?.charAt(0) || 'U'}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-[11px] font-black text-text-muted uppercase tracking-widest leading-none mb-1 opacity-60">
                {getRoleLabel(profile?.role || 'employee')}
              </p>
              <p className="text-[13px] font-bold text-text-main truncate max-w-[120px] leading-none">
                {profile?.displayName || 'User Session'}
              </p>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-text-muted transition-transform duration-200", isMenuOpen && "rotate-180")} />
          </button>

          <AnimatePresence>
            {isMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-64 bg-white border border-border-base rounded-xl shadow-xl overflow-hidden z-50 py-2"
              >
                <div className="px-4 py-2 mb-2">
                  <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] opacity-40">Switch Persona</p>
                </div>
                
                {(['employee', 'manager', 'admin'] as const).filter(r => r !== profile?.role).map((r) => (
                  <button
                    key={r}
                    onClick={() => handleRoleSwitch(r)}
                    className="w-full px-4 py-3 text-left hover:bg-bg-base flex items-center gap-3 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-bg-base border border-border-base flex items-center justify-center text-text-muted group-hover:text-primary-base group-hover:border-primary-base/30 transition-all">
                      {getRoleIcon(r)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-text-main uppercase tracking-tight">{getRoleLabel(r)}</p>
                      <p className="text-[10px] text-text-muted font-medium">Switch to {r} view</p>
                    </div>
                  </button>
                ))}

                <div className="h-px bg-border-base my-2" />
                
                <button
                  onClick={logout}
                  className="w-full px-4 py-3 text-left hover:bg-red-50 flex items-center gap-3 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-400 group-hover:bg-red-100 transition-all">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-red-600 uppercase tracking-tight">Sign Out</p>
                    <p className="text-[10px] text-red-400 font-medium tracking-tight">Terminate session</p>
                  </div>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
