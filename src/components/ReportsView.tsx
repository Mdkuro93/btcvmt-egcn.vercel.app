import React, { useMemo } from 'react';
import { 
  BarChart2, PieChart as PieIcon, Download, 
  Calendar, Map, Filter, RefreshCcw 
} from 'lucide-react';
import { Application, Project } from '../types';
import { cn } from '../lib/utils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, Legend,
  PieChart, Pie
} from 'recharts';

interface ReportsViewProps {
  theme: 'light' | 'dark';
  applications: Application[];
  projects: Project[];
}

export default function ReportsView({ theme, applications, projects }: ReportsViewProps) {
  const chartData = useMemo(() => {
    // Logic for report charts
    return [];
  }, [applications]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight">Trung tâm phân tích</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Báo cáo dữ liệu & Hiệu năng hệ thống</p>
        </div>
        
        <div className="flex items-center gap-3">
           <button className={cn(
             "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
             theme === 'dark' ? "bg-slate-900 border-slate-800 text-slate-300" : "bg-white border-slate-200"
           )}>
             <Calendar size={16} />
             Tháng này
           </button>
           <button className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20">
             <Download size={16} />
             Xuất báo cáo
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className={cn(
           "lg:col-span-2 p-8 rounded-3xl border min-h-[400px]",
           theme === 'dark' ? "bg-slate-900/40 border-slate-800/60" : "bg-white border-slate-200"
         )}>
           <h3 className="text-sm font-black uppercase tracking-widest mb-8">Hiệu suất xử lý theo Dự án</h3>
           <div className="h-[300px] flex items-center justify-center text-slate-500 italic text-xs font-bold">
              Công cụ đồ thị đang được cập nhật...
           </div>
         </div>

         <div className={cn(
           "p-8 rounded-3xl border min-h-[400px]",
           theme === 'dark' ? "bg-slate-900/40 border-slate-800/60" : "bg-white border-slate-200"
         )}>
            <h3 className="text-sm font-black uppercase tracking-widest mb-8">SLA Vượt định mức</h3>
            <div className="space-y-4">
               {projects.slice(0, 5).map(p => (
                 <div key={p.id} className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase">
                       <span>{p.name}</span>
                       <span className="text-rose-500">12% Trễ</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                       <div className="h-full bg-rose-500 w-[12%]" />
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}
