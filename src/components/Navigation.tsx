import React from 'react';
import { LayoutDashboard, Users, BarChart2, History, Settings, HelpCircle, LogOut } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { cn } from '../lib/utils';

interface NavItem {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'LOE Entry', icon: LayoutDashboard, roles: ['employee', 'manager'] },
  { id: 'team-review', label: 'Team Review', icon: Users, roles: ['manager', 'admin'] },
  { id: 'planning', label: 'Planning', icon: BarChart2, roles: ['admin'] },
  { id: 'history', label: 'History', icon: History, roles: ['employee', 'manager'] },
];

interface NavigationProps {
  activeId: string;
  onNavigate: (id: string) => void;
}

export function Sidebar({ activeId, onNavigate }: NavigationProps) {
  const { profile } = useAuth();

  const filteredItems = NAV_ITEMS.filter(item => 
    profile && item.roles.includes(profile.role)
  );

  return (
    <div className="w-60 bg-sidebar-base text-white border-r border-border-base flex flex-col h-full overflow-hidden">
      <div className="p-8 border-b border-white/5">
        <h1 className="font-bold text-lg tracking-tight text-white mb-0.5">PixelEdge</h1>
        <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em]">LOE Dashboard</p>
      </div>

      <nav className="flex-1 py-6 space-y-1">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-8 py-3 transition-all duration-200 text-[13px] font-bold uppercase tracking-widest",
              activeId === item.id 
                ? "bg-white/10 text-white" 
                : "text-white/40 hover:text-white hover:bg-white/5"
            )}
          >
            <item.icon className={cn(
              "w-4 h-4",
              activeId === item.id ? "text-action-lime" : "text-white/30"
            )} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-8 border-t border-white/5">
        <div className="flex flex-col gap-1">
          <p className="text-[8px] text-white/30 uppercase tracking-[0.2em] font-black">Organization</p>
          <p className="text-[11px] font-bold text-action-lime uppercase tracking-widest">PixelEdge</p>
        </div>
      </div>
    </div>
  );
}
