import React, { useMemo } from 'react';
import { 
  X, Search, QrCode, WifiOff, Wifi, Loader2, Check, FileText, 
  Reply, AlertTriangle, LayoutDashboard, RefreshCcw, AlertCircle, Camera, GitMerge 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Application, UserProfile } from '../../types';
import { STEP_CONFIG } from '../../constants';
import { useDataStore } from '../../stores/useDataStore';

interface MobileRecordListProps {
  currentUser: UserProfile;
  search: string;
  setSearch: (val: string) => void;
  selectedProject: string;
  setSelectedProject: (val: string) => void;
  filterType: 'all' | 'pending' | 'issue';
  setFilterType: (val: 'all' | 'pending' | 'issue') => void;
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  isOfflineSimulated: boolean;
  setIsOfflineSimulated: (val: boolean) => void;
  handleStartQrScan: () => void;
  handleOpenDetailModal: (app: Application) => void;
  isUploading: boolean;
  uploadProgress: number;
  triggerFileSelect: () => void;
  onOpenBulkDocs?: (ids: string[]) => void;
}

export default function MobileRecordList({
  currentUser,
  search,
  setSearch,
  selectedProject,
  setSelectedProject,
  filterType,
  setFilterType,
  selectedIds,
  setSelectedIds,
  isOfflineSimulated,
  setIsOfflineSimulated,
  handleStartQrScan,
  handleOpenDetailModal,
  isUploading,
  uploadProgress,
  triggerFileSelect,
  onOpenBulkDocs
}: MobileRecordListProps) {
  const { dashboardApps, projects } = useDataStore();

  // 1. Filter project based on user authorization (assignedProjectIds)
  const allowedProjects = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.dept === 'ADMIN') return projects;
    const assignedIds = currentUser.assignedProjectIds || [];
    return projects.filter(p => assignedIds.includes(p.id));
  }, [projects, currentUser]);

  const allowedProjectNames = useMemo(() => {
    return allowedProjects.map(p => p.name);
  }, [allowedProjects]);

  // 2. Filter application based on search, project filter, and user project authorization
  const filteredApps = useMemo(() => {
    return dashboardApps.filter(a => {
      // Must belong to user's authorized projects
      const isUserAdmin = currentUser?.dept === 'ADMIN';
      const matchesUserProject = isUserAdmin || allowedProjectNames.includes(a.projectName);
      if (!matchesUserProject) return false;

      // Search matching
      const matchesSearch = String(a.unitCode || '').toLowerCase().includes(search.toLowerCase()) || 
                           String(a.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
                           String(a.projectName || '').toLowerCase().includes(search.toLowerCase()) ||
                           String(a.phoneNumber || '').toLowerCase().includes(search.toLowerCase());
      
      // Filter by project tab selection
      const projName = projects.find(p => p.id === selectedProject)?.name;
      const matchesProject = selectedProject === 'all' || a.projectName === projName;
      
      // Filter by processing types
      const matchesFilter = filterType === 'all' ? true : 
                           filterType === 'issue' ? a.status === 'Error' :
                           (a.currentStep !== 'Hoan_Tat' && a.status !== 'Completed');

      return matchesSearch && matchesProject && matchesFilter;
    });
  }, [dashboardApps, search, selectedProject, filterType, currentUser, allowedProjectNames, projects]);

  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <>
      {/* PROJECT FILTER TAB BAR - Show only assigned/authorized projects */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar px-1">
         <button 
           onClick={() => setSelectedProject('all')}
           className={cn(
             "px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border",
             selectedProject === 'all' 
               ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20" 
               : "bg-slate-900 border-slate-800/80 text-slate-500 hover:text-slate-300"
           )}
         >
           Tất cả dự án ({allowedProjects.length})
         </button>
         {allowedProjects.map((p, index) => (
           <button 
             key={`proj-tab-${p.id}-${index}`}
             onClick={() => setSelectedProject(p.id)}
             className={cn(
               "px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border",
               selectedProject === p.id 
                 ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20" 
                 : "bg-slate-900 border-slate-800/80 text-slate-500 hover:text-slate-300"
             )}
           >
             {p.name}
           </button>
         ))}
      </div>

      {/* SEARCH BAR with QR Scan Code button & offline indicator toggle */}
      <div className="flex gap-2.5 mb-6">
         <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Tìm mã căn, vị trí, khách hàng..."
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-12 py-4 text-sm font-bold focus:border-indigo-500 transition-all text-left text-white placeholder-slate-500 outline-none"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search ? (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-white"
              >
                <X size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartQrScan}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-indigo-600/10 text-indigo-400 rounded-xl hover:bg-indigo-600/20 transition-all active:scale-95 border border-indigo-500/10"
                title="Quét mã QR sản phẩm/hồ sơ"
              >
                <QrCode size={16} />
              </button>
            )}
         </div>

         {/* OFFLINE TOGGLE BADGE - Clickable to demonstrate offline sync */}
         <button 
           onClick={() => setIsOfflineSimulated(!isOfflineSimulated)}
           className={cn(
             "px-3.5 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all active:scale-95 shrink-0",
             isOfflineSimulated 
               ? "bg-rose-500/10 border-rose-500/30 text-rose-400" 
               : "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
           )}
         >
           {isOfflineSimulated ? <WifiOff size={16} className="animate-pulse" /> : <Wifi size={16} />}
           <span className="text-[7.5px] font-black uppercase tracking-wider leading-none">
             {isOfflineSimulated ? "Ngoại tuyến" : "Trực tuyến"}
           </span>
         </button>
      </div>

      {/* UPLOADING INDICATION */}
      {isUploading && (
        <div className="mb-4 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-4 flex items-center justify-between text-indigo-400 gap-3">
          <div className="flex items-center gap-3">
            <Loader2 size={16} className="animate-spin" />
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-wider">Đang tải ảnh hiện trường...</p>
              <p className="text-[9px] text-slate-400">Vui lòng giữ kết nối Internet</p>
            </div>
          </div>
          <span className="text-xs font-black font-mono">{uploadProgress}%</span>
        </div>
      )}

      {/* INVENTORY LIST */}
      <div className="space-y-4 pb-28 text-left">
         {filteredApps.length > 0 ? (
           filteredApps.map((app, index) => {
             const borderThemeColor = app.status === 'Completed' ? 'border-l-emerald-500' :
                                      app.status === 'Error' ? 'border-l-rose-500 shadow-md shadow-rose-950/20' :
                                      'border-l-amber-500';

             const matchedStep = STEP_CONFIG[app.currentStep];

             return (
               <div 
                 key={`field-app-${app.id || app.unitCode || index}-${index}`} 
                 onClick={() => handleOpenDetailModal(app)}
                 className={cn(
                   "bg-slate-900/60 p-5 rounded-3xl border border-separate transition-all relative overflow-hidden flex flex-col gap-3 cursor-pointer select-none active:bg-slate-900 border-l-4",
                   borderThemeColor,
                   selectedIds.includes(String(app.id)) ? "border-indigo-500 bg-indigo-500/5 shadow-lg shadow-indigo-500/10" : "border-slate-800"
                 )}
               >
                   {selectedIds.includes(String(app.id)) && (
                     <div className="absolute top-0 right-0 w-12 h-12 bg-indigo-600 flex items-center justify-center rounded-bl-3xl">
                       <Check size={16} className="text-white font-bold" />
                     </div>
                   )}
                   
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-2 mb-2 flex-wrap">
                         <button 
                           onClick={(e) => toggleSelect(e, String(app.id))}
                           className={cn(
                             "w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0",
                             selectedIds.includes(String(app.id)) ? "bg-indigo-600 border-indigo-500 text-white" : "border-slate-700 bg-slate-950 text-transparent"
                           )}
                         >
                           <Check size={12} className="stroke-[3px]" />
                         </button>
                         
                         <span className="text-xs font-black text-white bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 tracking-wider font-mono">{app.unitCode}</span>
                         
                         {app.loanStatus === 'Co_Vay' && (
                           <span className="text-[8px] px-2 py-0.5 rounded-md font-black uppercase bg-indigo-500/20 text-indigo-400 border border-indigo-500/20">Có vay</span>
                         )}
                         
                         <span className={cn(
                           "text-[8px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider",
                           app.status === 'Completed' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                           app.status === 'Error' ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                           "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                         )}>
                           {app.status === 'Completed' ? 'Đã xong' : app.status === 'Error' ? 'Vướng mắc/Trả' : 'Đang Xử lý'}
                         </span>
                     </div>

                     <p className="text-sm font-bold text-slate-100 mb-2 truncate">{app.customerName}</p>

                     <div className="flex flex-col gap-1.5 bg-slate-950/40 p-3 rounded-2xl border border-slate-800/40">
                       <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight truncate">
                           Dự án: <span className="text-slate-200 font-black">{app.projectName}</span>
                         </p>
                       </div>
                       <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                         <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-tight">
                           Giai đoạn: <span className="text-white italic font-black">{matchedStep?.label || (app as any).currentStepLabel || 'Mới'}</span>
                         </p>
                       </div>

                       {app.isRejected && (
                         <div className="flex items-start gap-2 pt-1 border-t border-slate-850 mt-1">
                           <Reply size={11} className="text-rose-500 mt-0.5 shrink-0 rotate-180" />
                           <p className="text-[10px] text-rose-400 font-semibold line-clamp-2">
                             Bị từ trả: <span className="text-rose-300 italic">{app.rejectionReason || 'Chờ sửa chữa'}</span>
                           </p>
                         </div>
                       )}
                       {app.status === 'Error' && !app.isRejected && app.issueNotes && (
                         <div className="flex items-start gap-2 pt-1 border-t border-slate-800/20 mt-1">
                           <AlertTriangle size={12} className="text-rose-500 mt-0.5 shrink-0" />
                           <p className="text-[10px] text-rose-400 font-semibold line-clamp-2">
                             Vướng mắc: <span className="text-rose-300 italic">{app.issueNotes}</span>
                           </p>
                         </div>
                       )}
                     </div>

                     <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-800/50">
                       <div className="flex items-center gap-3">
                         {app.scannedFiles && app.scannedFiles.length > 0 ? (
                           <div className="flex items-center gap-1.5 text-[9px] font-black text-indigo-400 uppercase tracking-wider">
                             <FileText size={11} className="stroke-[2.5]" /> {app.scannedFiles.length} tệp đính kèm
                           </div>
                         ) : (
                           <div className="text-[9px] text-slate-600 uppercase font-black tracking-wider">0 tệp đính kèm</div>
                         )}
                       </div>
                       <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono">
                         {app.receivedDate || ''}
                       </p>
                     </div>
                   </div>
               </div>
             );
           })
         ) : (
           <div className="py-24 text-center rounded-[2rem] bg-slate-900/10 border border-slate-800/30 p-8">
              <Search size={44} className="mx-auto mb-3 text-slate-600" />
              <p className="text-xs font-black uppercase text-slate-500 tracking-wider">Không tìm thấy hồ sơ hiện trường</p>
              <p className="text-[10px] text-slate-600 mt-1">Sử dụng bộ lọc phân quyền hoặc thanh tìm kiếm</p>
           </div>
         )}
      </div>

      {/* FLOATING ACTION BOTTOM NAV BAR */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 grid grid-cols-5 gap-1 z-50 shadow-[0_-5px_30px_rgba(0,0,0,0.8)]">
         <button 
           onClick={() => { setFilterType('all'); setSelectedProject('all'); }}
           className={cn("flex flex-col items-center gap-1 p-2.5 transition-all text-center rounded-xl", filterType === 'all' && selectedProject === 'all' ? "text-indigo-400 font-bold bg-slate-900" : "text-slate-500")}
         >
            <LayoutDashboard size={18} />
            <span className="text-[8px] font-black uppercase tracking-wider">Tất cả</span>
         </button>
         <button 
           onClick={() => setFilterType('pending')}
           className={cn("flex flex-col items-center gap-1 p-2.5 transition-all text-center rounded-xl", filterType === 'pending' ? "text-emerald-400 bg-slate-900 font-bold" : "text-slate-500")}
         >
            <RefreshCcw size={18} className={cn(filterType === 'pending' && "animate-spin-slow")} />
            <span className="text-[8px] font-black uppercase tracking-wider">Đang Xử lý</span>
         </button>
         <button 
           onClick={() => setFilterType('issue')}
           className={cn("flex flex-col items-center gap-1 p-2.5 transition-all text-center rounded-xl", filterType === 'issue' ? "text-rose-400 bg-slate-900 font-bold" : "text-slate-500")}
         >
            <AlertCircle size={18} />
            <span className="text-[8px] font-black uppercase tracking-wider">Vướng mắc</span>
         </button>
         <button 
            onClick={() => {
              if (selectedIds.length === 0) {
                alert("Hãy chọn tối thiểu một hồ sơ ở danh sách trước!");
                return;
              }
              triggerFileSelect();
            }}
            className="flex flex-col items-center gap-1 p-2.5 text-slate-500 active:text-indigo-400 transition-all rounded-xl"
         >
            <Camera size={18} />
            <span className="text-[8px] font-black uppercase tracking-wider font-bold">Chụp ảnh</span>
         </button>
         <button 
           className={cn(
              "flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all",
              selectedIds.length > 0 ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "text-slate-600 opacity-20 pointer-events-none"
           )}
           onClick={() => {
              if (onOpenBulkDocs) {
                onOpenBulkDocs(selectedIds);
              } else {
                alert(`Đã truyền tải ${selectedIds.length} ID hồ sơ vào công vụ Gắn file hàng loạt. Bạn có thể sử dụng biểu tượng Gắn file từ phía ngoài.`);
              }
           }}
         >
            <GitMerge size={18} />
            <span className="text-[8px] font-black uppercase tracking-wider whitespace-nowrap">Gắn ({selectedIds.length})</span>
         </button>
      </div>
    </>
  );
}
