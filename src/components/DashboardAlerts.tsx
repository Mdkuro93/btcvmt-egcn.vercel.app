import React from 'react';
import { AlertCircle, Wallet, Users, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

interface DashboardAlertsProps {
  theme: 'light' | 'dark';
  stats: {
    loanCount: number;
    regularCount: number;
    overdueCount: number;
    errorCount: number;
  };
  onFilterChange: (filter: string) => void;
}

export default function DashboardAlerts({ theme, stats, onFilterChange }: DashboardAlertsProps) {
  return (
    <div className="space-y-4">
      {/* Horizontal Compact Classification */}
      <div className={cn(
        "glass-card p-4 rounded-[24px] border transition-all flex items-center justify-around gap-4",
        theme === 'dark' ? "border-slate-800/60 shadow-xl" : "shadow-sm hover:shadow-md"
      )}>
        <button 
          onClick={() => onFilterChange('regular')}
          className="flex flex-col items-center gap-1 group"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
            <Wallet size={20} />
          </div>
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">Vốn tự có</span>
          <span className={cn("text-xl font-black", theme === 'dark' ? "text-white" : "text-slate-900")}>{stats.regularCount}</span>
        </button>

        <div className="w-px h-12 bg-slate-800/20" />

        <button 
          onClick={() => onFilterChange('loan')}
          className="flex flex-col items-center gap-1 group"
        >
          <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all">
            <Users size={20} />
          </div>
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">Vốn vay</span>
          <span className={cn("text-xl font-black", theme === 'dark' ? "text-white" : "text-slate-900")}>{stats.loanCount}</span>
        </button>
      </div>

      {/* Critical Alerts - More compact */}
      <div className={cn(
        "glass-card p-5 rounded-[24px] border border-rose-500/20 transition-all",
        theme === 'dark' ? "shadow-xl" : "shadow-sm"
      )}>
        <div className="flex items-center gap-2 mb-3">
           <AlertCircle className="text-rose-500" size={16} />
           <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-500">Cảnh báo SLA & Lỗi</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
           <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/10 overflow-hidden relative">
              <p className="text-[8px] font-black text-rose-500 uppercase leading-none mb-1">Trễ hạn</p>
              <p className={cn("text-lg font-black", theme === 'dark' ? "text-white" : "text-slate-900")}>{stats.overdueCount}</p>
              <div className="absolute -right-2 -bottom-2 opacity-10">
                <Clock size={32} className="text-rose-500" />
              </div>
           </div>
           <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/10 overflow-hidden relative">
              <p className="text-[8px] font-black text-amber-500 uppercase leading-none mb-1">Sai sót</p>
              <p className={cn("text-lg font-black", theme === 'dark' ? "text-white" : "text-slate-900")}>{stats.errorCount}</p>
              <div className="absolute -right-2 -bottom-2 opacity-10">
                <AlertTriangle size={32} className="text-amber-500" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
