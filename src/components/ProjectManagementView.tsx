import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  FolderOpen, 
  Folder, 
  ChevronDown, 
  Building2, 
  Settings, 
  Trash2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Project } from '../types';
import { REGION_ORDER } from '../constants';

interface ProjectManagementViewProps {
  projects: Project[];
  onCreate: () => void;
  onEdit: (p: Project) => void;
  onDelete: (id: string) => void;
  theme: 'light' | 'dark';
}

export default function ProjectManagementView({ 
  projects, 
  onCreate, 
  onEdit, 
  onDelete, 
  theme 
}: ProjectManagementViewProps) {
  const [pSearch, setPSearch] = useState('');

  const groupedProjects = useMemo(() => {
    return projects
      .filter(p => String(p.name || '').toLowerCase().includes(pSearch.toLowerCase()) || String(p.region || '').toLowerCase().includes(pSearch.toLowerCase()))
      .reduce((acc, p) => {
        const region = p.region || 'Các Dự án khác';
        if (!acc[region]) acc[region] = [];
        acc[region].push(p);
        return acc;
      }, {} as Record<string, Project[]>);
  }, [projects, pSearch]);

  const [expandedRegions, setExpandedRegions] = useState<Record<string, boolean>>(
    Object.keys(groupedProjects).reduce((acc, key) => ({ ...acc, [key]: true }), {})
  );

  const toggleRegion = (region: string) => {
    setExpandedRegions(prev => ({ ...prev, [region]: !prev[region] }));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-end text-left">
        <div>
           <h2 className={cn("text-3xl font-black italic font-serif tracking-tight", theme === 'light' ? "text-slate-900" : "text-white")}>Cây thư mục Dự án</h2>
           <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Quản lý theo khu vực & cụm dự án</p>
        </div>
        <div className="flex gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text"
              placeholder="Tìm dự án..."
              value={pSearch}
              onChange={(e) => setPSearch(e.target.value)}
              className={cn(
                "w-64 pl-12 pr-6 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-indigo-500 transition-all",
                theme === 'light' ? "bg-white border-slate-200 text-slate-900" : "bg-slate-950 border-slate-800 text-white"
              )}
            />
          </div>
          <div className={cn(
            "px-6 py-3 rounded-2xl border flex flex-col justify-center",
            theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900/40 border-slate-800"
          )}>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Tổng dự án</p>
            <p className={cn("text-xl font-black italic font-serif", theme === 'light' ? "text-slate-900" : "text-white")}>{projects.length}</p>
          </div>
          <button 
            onClick={onCreate}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-emerald-600/20 hover:scale-105 active:scale-95 transition-all outline-none"
          >
            <Plus size={16} /> Thêm dự án mới
          </button>
        </div>
      </header>

      <div className="space-y-6">
        {(Object.entries(groupedProjects) as [string, Project[]][])
          .sort(([a], [b]) => {
            const idxA = REGION_ORDER.indexOf(a);
            const idxB = REGION_ORDER.indexOf(b);
            if (idxA === -1 && idxB === -1) return a.localeCompare(b);
            if (idxA === -1) return 1;
            if (idxB === -1) return -1;
            return idxA - idxB;
          })
          .map(([region, regionProjects], idx) => (
          <div 
             key={`${region}-${idx}`} 
             className={cn(
              "rounded-[2.5rem] border overflow-hidden transition-all duration-500",
              theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900/20 border-slate-800/50"
            )}
          >
            <button 
              onClick={() => toggleRegion(region)}
              className={cn(
                "w-full px-8 py-5 flex items-center justify-between group transition-colors",
                theme === 'light' ? "hover:bg-slate-50" : "hover:bg-slate-800/30"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                  expandedRegions[region] !== false ? "bg-festive-gold text-slate-900" : "bg-slate-800 text-slate-400"
                )}>
                  {expandedRegions[region] !== false ? <FolderOpen size={20} /> : <Folder size={20} />}
                </div>
                <div className="text-left">
                  <h3 className={cn("font-bold text-lg", theme === 'light' ? "text-slate-900" : "text-white")}>{region}</h3>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{regionProjects.length} Dự án thành viên</p>
                </div>
              </div>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300",
                expandedRegions[region] !== false ? "rotate-180" : "rotate-0",
                theme === 'light' ? "bg-slate-100 text-slate-400" : "bg-slate-800 text-slate-500"
              )}>
                <ChevronDown size={16} />
              </div>
            </button>

            <AnimatePresence>
              {expandedRegions[region] !== false && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-8 pb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4">
                    {regionProjects.map((project, pIdx) => (
                      <div 
                        key={`${project.id}-${pIdx}`}
                        className={cn(
                          "p-6 rounded-[2rem] border transition-all group relative overflow-hidden",
                          theme === 'light' ? "bg-slate-50/50 border-slate-200" : "bg-slate-900/60 border-slate-700/50"
                        )}
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                            <Building2 size={24} />
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => onEdit(project)}
                              className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white transition-all"
                            >
                              <Settings size={14} />
                            </button>
                            <button 
                              onClick={() => onDelete(project.id)}
                              className="p-2 rounded-xl bg-slate-800/80 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        
                        <h3 className={cn("text-xl font-bold mb-2", theme === 'light' ? "text-slate-900" : "text-white")}>{project.name}</h3>
                        <div className="flex items-center gap-6 pt-6 border-t border-slate-800/30">
                           <div>
                             <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Mã dự án</p>
                             <p className={cn("text-sm font-mono font-bold", theme === 'light' ? "text-slate-700" : "text-slate-300")}>{project.id}</p>
                           </div>
                           <div>
                             <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Sản phẩm</p>
                             <p className={cn("text-sm font-bold", theme === 'light' ? "text-slate-700" : "text-slate-300")}>{project.totalUnits} Units</p>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
