import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface StatCardProps {
  label: string;
  value: number;
  subValue: string;
  theme: 'light' | 'dark';
  color: 'indigo' | 'amber' | 'rose' | 'emerald' | 'cyan';
  icon: LucideIcon;
  urgent?: boolean;
}

const colorMaps = {
  indigo: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
  amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
  emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  cyan: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
};

export default function StatCard({ 
  label, value, subValue, theme, color, icon: Icon, urgent 
}: StatCardProps) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={cn(
        "p-6 rounded-3xl border transition-all relative overflow-hidden",
        theme === 'dark' ? "bg-slate-900/40 border-slate-800/60" : "bg-white border-slate-200",
        urgent && "border-rose-500/50 shadow-lg shadow-rose-500/10"
      )}
    >
      <div className={cn("inline-flex p-2.5 rounded-2xl mb-4", colorMaps[color])}>
        <Icon size={20} />
      </div>
      
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
        <div className="flex items-baseline gap-2">
           <h3 className="text-3xl font-black tracking-tighter">{value}</h3>
           {urgent && <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></div>}
        </div>
        <p className="text-[10px] font-bold text-slate-400">{subValue}</p>
      </div>

      {/* Background Accent */}
      <div className={cn(
        "absolute -right-4 -bottom-4 w-24 h-24 blur-3xl opacity-10 rounded-full",
        urgent ? "bg-rose-500" : `bg-${color}-500`
      )}></div>
    </motion.div>
  );
}
