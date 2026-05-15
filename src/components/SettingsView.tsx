import React from 'react';
import { Save, RefreshCcw, Database, Shield, Clock, BookOpen } from 'lucide-react';
import { Project, Dept, UnitStatus } from '../types';
import { cn } from '../lib/utils';

interface SettingsViewProps {
  theme: 'light' | 'dark';
  config: Record<string, { label: string, dept: Dept, status: UnitStatus, slaDays?: number, active: boolean }>;
  slaConfig: Record<string, number>;
  checklist: string[];
  projects: Project[];
  onSave: (type: string, data: any) => void;
}

export default function SettingsView({ 
  theme, config, slaConfig, checklist, projects, onSave 
}: SettingsViewProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight">Cấu hình hệ thống</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Tùy chỉnh quy trình & Tham số vận hành</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* SLA Config */}
        <div className={cn(
          "p-8 rounded-3xl border",
          theme === 'dark' ? "bg-slate-900/40 border-slate-800/60" : "bg-white border-slate-200"
        )}>
          <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-3">
                <Clock className="text-indigo-500" size={20} />
                <h3 className="text-sm font-black uppercase tracking-widest">Định mức SLA (Ngày)</h3>
             </div>
             <button className="p-2 text-indigo-500 hover:bg-indigo-500/10 rounded-lg">
                <Save size={18} />
             </button>
          </div>
          
          <div className="space-y-4">
             {Object.entries(slaConfig).slice(0, 8).map(([key, value]) => (
               <div key={key} className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">{key}</span>
                  <input 
                    type="number" 
                    defaultValue={value}
                    className={cn(
                      "w-20 px-3 py-1.5 rounded-lg text-xs font-bold text-center outline-none border transition-all",
                      theme === 'dark' ? "bg-slate-950 border-slate-800 focus:border-indigo-500" : "bg-slate-50 border-slate-200"
                    )}
                  />
               </div>
             ))}
          </div>
        </div>

        {/* Checklist Templates */}
        <div className={cn(
          "p-8 rounded-3xl border",
          theme === 'dark' ? "bg-slate-900/40 border-slate-800/60" : "bg-white border-slate-200"
        )}>
           <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-3">
                <BookOpen className="text-emerald-500" size={20} />
                <h3 className="text-sm font-black uppercase tracking-widest">Danh mục hồ sơ chuẩn</h3>
             </div>
             <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20">
                <RefreshCcw size={14} />
                Cập nhật
             </button>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
             {checklist.map((item, idx) => (
               <div key={idx} className={cn(
                 "p-3 rounded-xl text-xs font-medium border flex items-center justify-between group",
                 theme === 'dark' ? "bg-slate-950/50 border-slate-800/60" : "bg-slate-50 border-slate-200"
               )}>
                  <span className="truncate">{item}</span>
                  <button className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                     <RefreshCcw size={14} />
                  </button>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}
