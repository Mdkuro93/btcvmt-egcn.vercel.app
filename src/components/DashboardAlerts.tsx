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
           <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/10 overflow-hidden relative" onClick={() => onFilterChange('overdue')} style={{ cursor: 'pointer' }}>
              <p className="text-[8px] font-black text-rose-500 uppercase leading-none mb-1">Trễ hạn</p>
              <p className={cn("text-lg font-black", theme === 'dark' ? "text-white" : "text-slate-900")}>{stats.overdueCount}</p>
              <div className="absolute -right-2 -bottom-2 opacity-10">
                <Clock size={32} className="text-rose-500" />
              </div>
           </div>
           <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/10 overflow-hidden relative" onClick={() => onFilterChange('error')} style={{ cursor: 'pointer' }}>
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
