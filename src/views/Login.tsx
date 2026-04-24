import React from 'react';
import { useAuth } from '../components/AuthProvider';
import { UserRole } from '../types';
import { Users, Shield, Briefcase, Zap } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const { login } = useAuth();

  const personas: { role: UserRole; title: string; desc: string; icon: any; color: string }[] = [
    { 
      role: 'employee', 
      title: 'Employee', 
      desc: 'Submit and track your monthly project effort.', 
      icon: Users,
      color: 'bg-primary-base'
    },
    { 
      role: 'manager', 
      title: 'Team Lead', 
      desc: 'Review team submissions and manage project health.', 
      icon: Briefcase,
      color: 'bg-success-base'
    },
    { 
      role: 'admin', 
      title: 'Administrator', 
      desc: 'High-level resource planning and organizational insights.', 
      icon: Shield,
      color: 'bg-sidebar-base'
    }
  ];

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.05),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.02),transparent_40%)]">
      <div className="max-w-4xl w-full">
        <header className="text-center mb-16">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <div className="w-12 h-12 bg-sidebar-base rounded-xl flex items-center justify-center shadow-lg transform rotate-3">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl font-black text-text-main tracking-tighter uppercase italic">LOE</h1>
          </motion.div>
          <p className="text-text-muted font-bold uppercase tracking-[0.2em] text-xs">PixelEdge LOE Management</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {personas.map((p, idx) => (
            <motion.button
              key={p.role}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => login(p.role)}
              className="group bg-white p-8 rounded-card border border-border-base shadow-base hover:shadow-xl transition-all text-left flex flex-col items-start relative overflow-hidden"
            >
              <div className={`p-4 rounded-xl ${p.color} text-white mb-6 transform group-hover:scale-110 transition-transform group-hover:rotate-3`}>
                <p.icon className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-text-main uppercase italic mb-3 tracking-tight">{p.title}</h2>
              <p className="text-sm text-text-muted font-medium mb-8 leading-relaxed">
                {p.desc}
              </p>
              <div className="mt-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary-base">
                Select Persona ↗
              </div>
              
              {/* Decorative background element */}
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-bg-base/50 rounded-full blur-2xl group-hover:bg-primary-base/5 transition-colors" />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
