import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  X, 
  Search, 
  Check, 
  FileText, 
  RefreshCcw, 
  AlertCircle, 
  Camera, 
  GitMerge, 
  Upload,
  LayoutDashboard 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Application, Project, ScannedFile } from '../types';

interface FieldModeViewProps {
  applications: Application[];
  projects: Project[];
  onUpdateApp: (app: Application) => void;
  theme: 'light' | 'dark';
  onExit: () => void;
}

export default function FieldModeView({ 
  applications, 
  projects, 
  onUpdateApp, 
  theme, 
  onExit 
}: FieldModeViewProps) {
  const [search, setSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'issue'>('all');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredApps = useMemo(() => applications.filter(a => {
    const matchesSearch = String(a.unitCode || '').toLowerCase().includes(search.toLowerCase()) || 
                         String(a.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
                         String(a.projectName || '').toLowerCase().includes(search.toLowerCase()) ||
                         String(a.phoneNumber || '').toLowerCase().includes(search.toLowerCase());
    
    const projName = projects.find(p => p.id === selectedProject)?.name;
    const matchesProject = selectedProject === 'all' || a.projectName === projName;
    
    const matchesFilter = filterType === 'all' ? true : 
                         filterType === 'issue' ? a.status === 'Error' :
                         (a.currentStep !== 'Hoan_Tat' && a.status !== 'Completed');

    return matchesSearch && matchesProject && matchesFilter;
  }), [applications, search, selectedProject, filterType]);

  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 font-sans safe-area-inset overflow-x-hidden text-left">
       <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_-5px_rgba(245,158,11,0.5)] border border-white/20 shrink-0">
                <ShieldCheck className="text-white" size={20} strokeWidth={1.5} />
             </div>
             <div className="text-left">
                <h2 className="text-lg font-black italic">Field Portal</h2>
                <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Cập nhật hồ sơ hiện trường</p>
             </div>
          </div>
          <button onClick={onExit} className="p-2 bg-slate-900 rounded-xl border border-slate-800 text-slate-400">
             <X size={20} />
          </button>
       </header>

       <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar px-1">
          <button 
            onClick={() => setSelectedProject('all')}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border",
              selectedProject === 'all' ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20" : "bg-slate-900 border-slate-800 text-slate-500"
            )}
          >
            Tất cả dự án
          </button>
          {projects.map(p => (
            <button 
              key={p.id}
              onClick={() => setSelectedProject(p.id)}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border",
                selectedProject === p.id ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20" : "bg-slate-900 border-slate-800 text-slate-500"
              )}
            >
              {p.name}
            </button>
          ))}
       </div>

       <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input 
            type="text" 
            placeholder="Tìm mã căn / khách hàng..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:border-indigo-500 transition-all text-left"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
       </div>

       <div className="space-y-4 pb-24 text-left">
          {filteredApps.length > 0 ? (
            filteredApps.map(app => (
              <div 
                key={app.id} 
                onClick={() => setSelectedApp(app)}
                className={cn(
                  "bg-slate-900/40 p-5 rounded-[2rem] border transition-all relative overflow-hidden",
                  selectedIds.includes(app.id) ? "border-indigo-500 bg-indigo-500/5 shadow-lg shadow-indigo-500/10" : "border-slate-800"
                )}
              >
                  {selectedIds.includes(app.id) && (
                    <div className="absolute top-0 right-0 w-12 h-12 bg-indigo-600 flex items-center justify-center rounded-bl-3xl">
                      <Check size={16} className="text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <div 
                          onClick={(e) => toggleSelect(e, app.id)}
                          className={cn(
                            "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                            selectedIds.includes(app.id) ? "bg-indigo-600 border-indigo-500" : "border-slate-700 bg-slate-950"
                          )}
                        >
                          {selectedIds.includes(app.id) && <Check size={12} />}
                        </div>
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{app.unitCode}</span>
                        {app.loanStatus === 'Co_Vay' && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase bg-indigo-500/20 text-indigo-400 border border-indigo-500/20">Có vay</span>
                        )}
                        <span className={cn(
                          "text-[8px] px-2 py-0.5 rounded-md font-black uppercase",
                          app.status === 'Error' ? "bg-rose-500/20 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
                        )}>{app.status}</span>
                    </div>
                    <p className="text-sm font-bold truncate">{app.customerName}</p>
                    <div className="flex flex-col gap-1 mt-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-slate-500" />
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                          Dự án: <span className="text-slate-300">{app.projectName}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-indigo-500" />
                        <p className="text-[10px] text-indigo-400 font-black uppercase tracking-tighter">
                          Giai đoạn: <span className="text-indigo-300 italic">{app.currentStepLabel || 'Mới'}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/50">
                      <div className="flex items-center gap-3">
                        {app.scannedFiles && app.scannedFiles.length > 0 && (
                          <div className="flex items-center gap-1 text-[9px] font-black text-indigo-400 uppercase">
                            <FileText size={10} /> {app.scannedFiles.length} file
                          </div>
                        )}
                      </div>
                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{app.updatedAt ? new Date(app.updatedAt).toLocaleDateString() : ''}</p>
                    </div>
                  </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center opacity-30">
               <Search size={48} className="mx-auto mb-4" />
               <p className="text-xs font-black uppercase">Không tìm thấy hồ sơ</p>
            </div>
          )}
       </div>

       <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800 grid grid-cols-5 gap-1">
          <button 
            onClick={() => { setFilterType('all'); setSelectedProject('all'); }}
            className={cn("flex flex-col items-center gap-1 p-2 transition-all", filterType === 'all' && selectedProject === 'all' ? "text-indigo-400" : "text-slate-500")}
          >
             <LayoutDashboard size={18} />
             <span className="text-[7px] font-black uppercase">Tất cả</span>
          </button>
          <button 
            onClick={() => setFilterType('pending')}
            className={cn("flex flex-col items-center gap-1 p-2 transition-all", filterType === 'pending' ? "text-emerald-400 scale-110" : "text-slate-500")}
          >
             <RefreshCcw size={18} className={cn(filterType === 'pending' && "animate-spin-slow")} />
             <span className="text-[7px] font-black uppercase text-center leading-tight">Cần xử lý</span>
          </button>
          <button 
            onClick={() => setFilterType('issue')}
            className={cn("flex flex-col items-center gap-1 p-2 transition-all", filterType === 'issue' ? "text-rose-400" : "text-slate-500")}
          >
             <AlertCircle size={18} />
             <span className="text-[7px] font-black uppercase">Vướng mắc</span>
          </button>
          <button className="flex flex-col items-center gap-1 p-2 text-slate-500 group">
             <Camera size={18} className="group-active:scale-125 transition-transform" />
             <span className="text-[7px] font-black uppercase">Chụp ảnh</span>
          </button>
          <button 
            className={cn(
               "flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
               selectedIds.length > 0 ? "bg-indigo-600 text-white animate-pulse" : "text-slate-700 opacity-20 pointer-events-none"
            )}
            onClick={() => {
               (window as any).__openBulkDocsFromMobile = true;
               (window as any).__mobileSelectedIds = selectedIds;
            }}
          >
             <GitMerge size={18} />
             <span className="text-[7px] font-black uppercase text-center leading-tight">Gắn file ({selectedIds.length})</span>
          </button>
       </div>

       <AnimatePresence>
          {selectedApp && (
             <motion.div 
               initial={{ y: '100%' }}
               animate={{ y: 0 }}
               exit={{ y: '100%' }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="fixed inset-0 z-[200] bg-slate-950 p-6 flex flex-col text-left"
             >
                <header className="flex items-center justify-between mb-8">
                   <h2 className="text-xl font-black italic">Cập nhật hồ sơ</h2>
                   <button onClick={() => setSelectedApp(null)} className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-slate-500">
                      <X size={20} />
                   </button>
                </header>

                <div className="flex-1 overflow-y-auto space-y-8 custom-scrollbar">
                   <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 text-center">
                      <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Hồ sơ mục tiêu</p>
                      <h3 className="text-2xl font-black text-indigo-400 font-serif italic mb-1">{selectedApp.unitCode}</h3>
                      <div className="flex justify-center gap-2 mb-2">
                        <span className="text-[9px] px-2 py-0.5 bg-slate-800 text-slate-400 rounded-lg font-black uppercase">
                          {selectedApp.propertyType === 'Dat_Nen' ? 'Đất nền' : 'Căn hộ'}
                        </span>
                        <span className={cn(
                          "text-[9px] px-3 py-0.5 rounded-lg font-black uppercase",
                          selectedApp.loanStatus === 'Co_Vay' ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/20" : "bg-slate-800 text-slate-500"
                        )}>
                          {selectedApp.loanStatus === 'Co_Vay' ? 'Có vay' : 'Không vay'}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-300">{selectedApp.customerName}</p>
                   </div>

                   <section className="space-y-4">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Trạng thái công việc</p>
                      <div className="grid grid-cols-2 gap-3">
                         {[
                           { val: 'Processing', label: 'Đang xử lý' },
                           { val: 'Completed', label: 'Đã xong' },
                           { val: 'Error', label: 'Vướng mắc' }
                         ].map(st => (
                            <button 
                              key={st.val}
                              onClick={() => {
                                 onUpdateApp({ ...selectedApp, status: st.val as any });
                                 setSelectedApp(null);
                              }}
                              className={cn(
                                "py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                selectedApp.status === st.val ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-950 border-slate-800 text-slate-500"
                              )}
                            >
                               {st.label}
                            </button>
                         ))}
                      </div>
                   </section>

                   <section className="space-y-4">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Ảnh hiện trường / Hồ sơ scan</p>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="aspect-square bg-slate-900 border border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-3 active:scale-95 transition-all text-slate-500 border-dashed border-2 cursor-pointer">
                            <Camera size={32} />
                            <span className="text-[9px] font-black uppercase">Chụp ảnh mới</span>
                         </div>
                         <div className="aspect-square bg-slate-900 border border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-3 active:scale-95 transition-all text-slate-500 border-dashed border-2 cursor-pointer">
                            <Upload size={32} />
                            <span className="text-[9px] font-black uppercase">Tải tệp lên</span>
                         </div>
                      </div>
                   </section>
                </div>

                <div className="pt-6">
                   <button 
                     onClick={() => setSelectedApp(null)}
                     className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"
                   >
                      Hoàn tất & Đồng bộ
                   </button>
                </div>
             </motion.div>
          )}
       </AnimatePresence>

    </div>
  );
}
