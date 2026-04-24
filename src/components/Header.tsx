import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, LogOut, User, Shield, Users as UsersIcon } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { sessionStore } from '../lib/sessionStore';

interface HeaderProps {
  onNavigate: (id: string) => void;
}

export function Header({ onNavigate }: HeaderProps) {
  const { profile, logout, switchRole } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const currentMonth = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date());

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
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

  return (
    <header className="h-20 border-b border-border-base flex items-center justify-between px-10 bg-white sticky top-0 z-50 shadow-sm shadow-black/2">
      <div className="flex items-center gap-10 flex-1">
      </div>

      <div className="flex items-center gap-6">
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
