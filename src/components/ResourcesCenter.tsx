import React from 'react';
import { 
  Plus, Search, Filter, BookOpen, Download, 
  FileText, FolderOpen, ExternalLink, Printer
} from 'lucide-react';
import { cn } from '../lib/utils';

interface ResourcesCenterProps {
  theme: 'light' | 'dark';
}

export default function ResourcesCenter({ theme }: ResourcesCenterProps) {
  const categories = [
    { name: 'Pháp lý dự án', count: 12, icon: BookOpen, color: 'text-indigo-500' },
    { name: 'Mẫu hợp đồng', count: 8, icon: FileText, color: 'text-emerald-500' },
    { name: 'Quy trình nội bộ', count: 5, icon: FolderOpen, color: 'text-amber-500' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight">Thư viện biểu mẫu</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Tra cứu pháp điển & Mẫu văn bản chuẩn</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {categories.map(cat => (
           <div key={cat.name} className={cn(
             "p-8 rounded-3xl border transition-all cursor-pointer group hover:scale-[1.02] active:scale-95",
             theme === 'dark' ? "bg-slate-900/40 border-slate-800/60" : "bg-white border-slate-200"
           )}>
              <div className={cn("p-3 rounded-2xl inline-block mb-6", cat.color, "bg-current bg-opacity-10")}>
                <cat.icon size={24} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest">{cat.name}</h3>
              <p className="text-xs text-slate-500 font-bold mt-1">{cat.count} tài liệu</p>
           </div>
         ))}
      </div>

      <div className={cn(
        "rounded-3xl border overflow-hidden",
        theme === 'dark' ? "bg-slate-900/40 border-slate-800/60" : "bg-white border-slate-200"
      )}>
        <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
           <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Tìm biểu mẫu..."
                className={cn(
                  "w-full pl-10 pr-4 py-2 rounded-xl text-xs font-bold outline-none",
                  theme === 'dark' ? "bg-slate-950 text-slate-200" : "bg-slate-50 text-slate-800"
                )}
              />
           </div>
           <button className="flex items-center gap-2 px-4 py-2 text-indigo-500 text-xs font-black uppercase tracking-widest hover:bg-indigo-500/10 rounded-xl transition-all">
              <Filter size={16} />
              Lọc kết quả
           </button>
        </div>

        <div className="divide-y divide-slate-800/30">
           {[1, 2, 3, 4, 5].map(i => (
             <div key={i} className="p-6 flex items-center justify-between group hover:bg-slate-800/10 transition-all">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-500">
                      <FileText size={20} />
                   </div>
                   <div>
                      <p className="text-xs font-bold uppercase tracking-tight">Biên bản bàn giao GCN - Mẫu {i}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Cập nhật: 12/03/2026 • 2.4 MB • PDF</p>
                   </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                   <button className="p-2 text-slate-500 hover:text-indigo-500 hover:bg-indigo-500/10 rounded-lg">
                      <Printer size={16} />
                   </button>
                   <button className="p-2 text-slate-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg">
                      <Download size={16} />
                   </button>
                   <button className="p-2 text-slate-500 hover:text-indigo-500 hover:bg-indigo-500/10 rounded-lg">
                      <ExternalLink size={16} />
                   </button>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
