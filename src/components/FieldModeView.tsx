import React, { useState, useMemo, useRef } from 'react';
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
  LayoutDashboard,
  Trash2,
  Eye,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Paperclip,
  CheckCircle,
  ArrowRight,
  Reply,
  Clock,
  Loader2,
  User,
  Info,
  QrCode,
  Phone,
  MessageSquare,
  ScanLine,
  Wifi,
  WifiOff
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Application, Project, ScannedFile, StepName, UserProfile } from '../types';
import { WORKFLOW_1_STEPS, WORKFLOW_2_STEPS, STEP_CONFIG } from '../constants';

interface FieldModeViewProps {
  applications: Application[];
  projects: Project[];
  onUpdateApp: (app: Application) => void;
  theme: 'light' | 'dark';
  onExit: () => void;
  supabase?: any;
  currentUser: UserProfile;
  onStepTransition: (nextStep: StepName, note?: string, overrideApp?: Application) => Promise<void>;
}

export default function FieldModeView({ 
  applications, 
  projects, 
  onUpdateApp, 
  theme, 
  onExit,
  supabase,
  currentUser,
  onStepTransition
}: FieldModeViewProps) {
  const [search, setSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'issue'>('all');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [editAppInstance, setEditAppInstance] = useState<Application | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Transition related state in drawer
  const [transitionTab, setTransitionTab] = useState<'info' | 'workflow' | 'document'>('info');
  const [transitionNote, setTransitionNote] = useState('');
  const [selectedBackwardStep, setSelectedBackwardStep] = useState<StepName | ''>('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // File upload state variables
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);

  // State variables for offline mode simulation and QR scanner mockup
  const [isOfflineSimulated, setIsOfflineSimulated] = useState(false);
  const [showQrScanModal, setShowQrScanModal] = useState(false);
  const [qrScanProgress, setQrScanProgress] = useState(0);
  const [qrScanResult, setQrScanResult] = useState('');

  // Input refs for file capture
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const confirmBtn = document.querySelector('[data-confirm-transition]') as HTMLButtonElement | null;
        if (confirmBtn && !confirmBtn.disabled) {
          confirmBtn.click();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Simulated high-tech QR barcode scanner action
  const handleStartQrScan = () => {
    setShowQrScanModal(true);
    setQrScanProgress(0);
    setQrScanResult('');
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setQrScanProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        if (filteredApps.length > 0) {
          // Select a random app to demonstrate match
          const randomApp = filteredApps[Math.floor(Math.random() * filteredApps.length)];
          const targetCode = randomApp.unitCode || 'SH-102';
          setQrScanResult(targetCode);
          setTimeout(() => {
            setSearch(targetCode);
            setShowQrScanModal(false);
          }, 1100);
        } else {
          setQrScanResult('QR_NOT_FOUND');
          setTimeout(() => {
            setShowQrScanModal(false);
          }, 1500);
        }
      }
    }, 120);
  };

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
    return applications.filter(a => {
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
  }, [applications, search, selectedProject, filterType, currentUser, allowedProjectNames, projects]);

  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // Open detailing modal
  const handleOpenDetailModal = (app: Application) => {
    setSelectedApp(app);
    setEditAppInstance(JSON.parse(JSON.stringify(app))); // Deep copy
    setTransitionTab('info');
    setTransitionNote('');
    setSelectedBackwardStep('');
  };

  // File upload handling for mobile
  const handleUploadedFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !editAppInstance || !supabase) {
      if (!supabase) {
        alert("Thông báo: Supabase chưa được cấu hình cho Field Portal này.");
      }
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(10);
    setActiveUploadId(editAppInstance.id ? String(editAppInstance.id) : null);

    try {
      const uploadedList: ScannedFile[] = [];
      const totalFiles = files.length;
      
      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        setUploadProgress(Math.floor(10 + (80 * (i / totalFiles))));

        const fileExt = file.name.split('.').pop() || 'png';
        const randomId = Math.random().toString(36).substring(2, 11);
        const fileName = `${editAppInstance.id}-${randomId}.${fileExt}`;
        const filePath = `${editAppInstance.unitCode}/${fileName}`;

        // Upload to database bucket "Documents-GCN"
        const { error: uploadError } = await supabase.storage
          .from('Documents-GCN')
          .upload(filePath, file, {
            cacheControl: '3600',
            contentType: file.type,
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Obtain Public URL
        const { data: { publicUrl } } = supabase.storage
          .from('Documents-GCN')
          .getPublicUrl(filePath);

        const newFile: ScannedFile = {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: file.type,
          url: publicUrl,
          path: filePath,
          uploadDate: new Date().toISOString().split('T')[0]
        };
        
        uploadedList.push(newFile);
      }

      const updatedFiles = [...(editAppInstance.scannedFiles || []), ...uploadedList];
      const updatedApp = {
        ...editAppInstance,
        scannedFiles: updatedFiles
      };

      setEditAppInstance(updatedApp);
      setUploadProgress(100);

      // Save sync with application
      onUpdateApp(updatedApp);
    } catch (error: any) {
      console.error('Mobile upload error:', error);
      alert('Có lỗi xảy ra khi tải tệp lên Supabase Storage: ' + (error.message || error));
    } finally {
      setIsUploading(false);
      setActiveUploadId(null);
      setTimeout(() => setUploadProgress(0), 1000);
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Delete uploaded file handler in mobile portal
  const handleDeleteFile = async (fileId: string) => {
    if (!editAppInstance) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) return;

    try {
      const fileToDelete = (editAppInstance.scannedFiles || []).find(f => f.id === fileId);
      const updatedFiles = (editAppInstance.scannedFiles || []).filter(f => f.id !== fileId);
      
      const updatedApp = {
        ...editAppInstance,
        scannedFiles: updatedFiles
      };

      setEditAppInstance(updatedApp);
      
      // Delete from storage if it has a path
      if (fileToDelete?.path && !fileToDelete.isShared && supabase) {
        await supabase.storage
          .from('Documents-GCN')
          .remove([fileToDelete.path]);
      }

      // Sync and save to database
      onUpdateApp(updatedApp);
    } catch (err) {
      console.error('Error deleting file on mobile:', err);
    }
  };

  // Complete edit and save everything
  const handleSaveChangesAndClose = () => {
    if (!editAppInstance) return;
    
    // Clean up issue details if status is not Error
    let finalApp = { ...editAppInstance };
    if (finalApp.status !== 'Error') {
      finalApp.issueType = 'None';
      finalApp.issueNotes = '';
      finalApp.issueSeverity = 'Minor';
      finalApp.issueStatus = 'RESOLVED';
    }

    onUpdateApp(finalApp);
    setSelectedApp(null);
    setEditAppInstance(null);
  };

  // 3. Workflow transitions handling
  const appWorkflowSteps = useMemo(() => {
    if (!editAppInstance) return [];
    return editAppInstance.workflowType === 'Quy_trinh_2' ? WORKFLOW_2_STEPS : WORKFLOW_1_STEPS;
  }, [editAppInstance]);

  const currentStepIndex = useMemo(() => {
    if (!editAppInstance || appWorkflowSteps.length === 0) return -1;
    return appWorkflowSteps.indexOf(editAppInstance.currentStep);
  }, [editAppInstance, appWorkflowSteps]);

  // Next step calculation
  const nextStepName = useMemo(() => {
    if (currentStepIndex === -1 || currentStepIndex >= appWorkflowSteps.length - 1) return null;
    // Self-service: luôn nhảy về Hoan_Tat
    if (editAppInstance?.isSelfService) return 'Hoan_Tat' as StepName;
    return appWorkflowSteps[currentStepIndex + 1];
  }, [currentStepIndex, appWorkflowSteps, editAppInstance?.isSelfService]);

  // Backward steps mapping (preceding steps)
  const backwardSteps = useMemo(() => {
    if (currentStepIndex <= 0) return [];
    return appWorkflowSteps.slice(0, currentStepIndex);
  }, [currentStepIndex, appWorkflowSteps]);

  // Authorized user checkpoint
  const isUserAuthorizedToTransition = useMemo(() => {
    if (!editAppInstance || !currentUser) return false;
    
    const roleDept = STEP_CONFIG[editAppInstance.currentStep]?.dept;
    const isSupportSpecial = (editAppInstance.projectName?.includes('hỗ trợ')) && (editAppInstance.currentStep === 'GD2_Cho_Nop_VPDK' || editAppInstance.currentStep === 'S3_Nop_VPDK');
    const effectiveDept = isSupportSpecial ? 'KT' : roleDept;

    if (
      currentUser.dept === 'ADMIN' || 
      currentUser.dept === 'DIRECTOR' || 
      currentUser.dept === 'MANAGER' || 
      currentUser.dept === 'MANAGER_ALL' ||
      (currentUser.dept === 'MANAGER_PTT' && effectiveDept === 'PTT') ||
      (currentUser.dept === 'MANAGER_KT' && effectiveDept === 'KT') ||
      (currentUser.dept === 'MANAGER_PTDA' && effectiveDept === 'PTDA')
    ) {
      return true;
    }
    
    return effectiveDept === currentUser.dept;
  }, [editAppInstance, currentUser]);

  // Execute Step Transition Forward
  const handleMoveForward = async () => {
    if (!editAppInstance || !nextStepName) return;
    setIsTransitioning(true);
    try {
      await onStepTransition(nextStepName, transitionNote || undefined, editAppInstance);
      
      // Update local state after successful parent transition
      const updatedApp = {
        ...editAppInstance,
        currentStep: nextStepName,
        status: (STEP_CONFIG[nextStepName]?.status || 'Processing') as any
      };
      
      setEditAppInstance(updatedApp);
      if (selectedApp) setSelectedApp(updatedApp);
      setTransitionNote('');
      alert("Đã chuyển bước thành công!");
    } catch (error: any) {
      console.error(error);
      alert("Lỗi khi chuyển bước: " + (error.message || error));
    } finally {
      setIsTransitioning(false);
    }
  };

  // Execute Step Transition Backward (Return/Reject)
  const handleMoveBackward = async () => {
    if (!editAppInstance || !selectedBackwardStep) {
      alert("Vui lòng chọn bước bạn muốn trả hồ sơ về.");
      return;
    }
    if (!transitionNote) {
      alert("Bắt buộc phải nhập Lý do trả hồ sơ / vướng mắc.");
      return;
    }

    setIsTransitioning(true);
    try {
      await onStepTransition(selectedBackwardStep, transitionNote, editAppInstance);
      
      // Update local state isRejected flag
      const updatedApp = {
        ...editAppInstance,
        currentStep: selectedBackwardStep,
        status: 'Error' as const,
        isRejected: true,
        rejectionReason: transitionNote,
        issueType: 'Sai sót Khác' as const,
        issueNotes: transitionNote,
        issueSeverity: 'Moderate' as const
      };

      setEditAppInstance(updatedApp);
      if (selectedApp) setSelectedApp(updatedApp);
      setTransitionNote('');
      setSelectedBackwardStep('');
      alert("Đã trả hồ sơ về bước trước thành công!");
    } catch (error: any) {
      console.error(error);
      alert("Lỗi khi trả hồ sơ về: " + (error.message || error));
    } finally {
      setIsTransitioning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 font-sans safe-area-inset overflow-x-hidden text-left relative">
       
       {/* HEADER */}
       <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-gradient-to-br from-indigo-505 to-indigo-700 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)] border border-white/20 shrink-0">
                <ShieldCheck className="text-white animate-pulse" size={20} strokeWidth={1.5} />
             </div>
             <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-lg font-black tracking-tight italic leading-tight">Field Portal</h2>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold tracking-tight">Mã: {currentUser.username}</span>
                </div>
                <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest leading-none mt-0.5">Dự án theo phân quyền của bạn</p>
             </div>
          </div>
          <button 
             onClick={onExit} 
             className="px-4 py-2 bg-slate-900 rounded-xl border border-slate-800 text-slate-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 active:bg-slate-800 active:text-white transition-all"
          >
             <X size={14} /> Thoát
          </button>
       </header>

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
                            Giai đoạn: <span className="text-white italic font-black">{matchedStep?.label || app.currentStepLabel || 'Mới'}</span>
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

       {/* HIDDEN CAMERA AND FILE CAPTURE INPUTS */}
       <input 
          type="file" 
          ref={cameraInputRef} 
          accept="image/*" 
          capture="environment" 
          className="hidden" 
          onChange={(e) => handleUploadedFiles(e.target.files)}
       />
       <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/*,application/pdf" 
          multiple 
          className="hidden" 
          onChange={(e) => handleUploadedFiles(e.target.files)}
       />

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
               if (fileInputRef.current) fileInputRef.current.click();
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
               (window as any).__openBulkDocsFromMobile = true;
               (window as any).__mobileSelectedIds = selectedIds;
               alert(`Đã truyền tải ${selectedIds.length} ID hồ sơ vào công vụ Gắn file hàng loạt. Bạn có thể sử dụng biểu tượng Gắn file từ phía ngoài.`);
            }}
          >
             <GitMerge size={18} />
             <span className="text-[8px] font-black uppercase tracking-wider whitespace-nowrap">Gắn ({selectedIds.length})</span>
          </button>
       </div>

       {/* DETAIL UPDATE DRAWER - INTEGRATED WITH PROCESS TIMELINE AND STEP TRANSITIONS */}
       <AnimatePresence>
          {selectedApp && editAppInstance && (
             <motion.div 
               initial={{ opacity: 0, y: '100%' }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: '100%' }}
               transition={{ type: 'spring', damping: 25, stiffness: 220 }}
               className="fixed inset-0 z-[200] bg-slate-950 flex flex-col text-left overflow-hidden h-full"
             >
                 {/* MOB DRAWER HEADER */}
                 <header className="p-5 border-b border-slate-900 flex items-center justify-between bg-slate-950/80 backdrop-blur-lg z-10 shrink-0">
                    <div className="flex items-center gap-2">
                       <Sparkles size={16} className="text-indigo-400 animate-pulse" />
                       <div>
                          <h2 className="text-base font-black italic tracking-wide">Quản lý & Chuyển bước</h2>
                          <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">GCN-ID: {String(editAppInstance.id).substring(0,8)}...</p>
                       </div>
                    </div>
                    <button 
                       onClick={() => { setSelectedApp(null); setEditAppInstance(null); }} 
                       className="p-3 bg-slate-900 hover:bg-slate-800 rounded-2xl border border-slate-800 text-slate-400 active:scale-95 transition-all"
                    >
                       <X size={20} />
                    </button>
                 </header>

                 {/* DYNAMIC TAB SWITCHER */}
                 <div className="px-5 py-2.5 bg-slate-900/40 border-b border-slate-900/60 flex gap-1 z-10 shrink-0">
                    <button
                      onClick={() => setTransitionTab('info')}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        transitionTab === 'info' ? "bg-slate-800 text-white border border-slate-700/50" : "text-slate-500 hover:text-slate-300"
                      )}
                    >
                      Khai báo
                    </button>
                    <button
                      onClick={() => setTransitionTab('workflow')}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative",
                        transitionTab === 'workflow' ? "bg-slate-800 text-white border border-slate-700/50" : "text-slate-500 hover:text-slate-300"
                      )}
                    >
                      Quy trình
                      {isUserAuthorizedToTransition && (
                        <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-indigo-500" />
                      )}
                    </button>
                    <button
                      onClick={() => setTransitionTab('document')}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        transitionTab === 'document' ? "bg-slate-800 text-white border border-slate-700/50" : "text-slate-500 hover:text-slate-300"
                      )}
                    >
                      Tài liệu ({editAppInstance.scannedFiles?.length || 0})
                    </button>
                 </div>

                 {/* SCROLLABLE DRAWER BODY */}
                 <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-28 text-left max-h-[calc(100vh-180px)]">
                    
                    {/* INFO TAB */}
                    {transitionTab === 'info' && (
                      <div className="space-y-6">
                         {/* APP CHASSIS DETAILS CARD */}
                         <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-950 rounded-3xl border border-slate-800/80 relative overflow-hidden text-center">
                            <span className="absolute top-2 right-4 text-[7px] text-slate-600 font-mono tracking-widest uppercase">Mã: {editAppInstance.unitCode}</span>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Mã căn hộ / Đất nền</p>
                            <h3 className="text-2xl font-black text-indigo-400 font-mono tracking-tight mb-2">{editAppInstance.unitCode}</h3>
                            
                            <div className="flex justify-center gap-1.5 mb-3 flex-wrap">
                              <span className="text-[8px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md font-black uppercase tracking-wider border border-slate-700/60">
                                {editAppInstance.propertyType === 'Dat_Nen' ? 'Đất nền' : 'Căn hộ'}
                              </span>
                              
                              <span className={cn(
                                "text-[8px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider",
                                editAppInstance.loanStatus === 'Co_Vay' ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/20" : "bg-slate-800 text-slate-400"
                              )}>
                                {editAppInstance.loanStatus === 'Co_Vay' ? 'Có vay' : 'Không vay'}
                              </span>

                              <span className="text-[8px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md font-black uppercase tracking-wider border border-slate-700/60">
                                {editAppInstance.projectName}
                              </span>
                            </div>
                            
                            <p className="text-sm font-bold text-slate-100">{editAppInstance.customerName}</p>
                            <div className="flex items-center justify-center gap-2 mt-2">
                               <span className="text-[10px] text-slate-400 font-mono font-bold leading-none">{editAppInstance.phoneNumber || 'SĐT: Không có'}</span>
                               {editAppInstance.phoneNumber && (
                                 <div className="flex gap-1.5 shrink-0">
                                    <a 
                                      href={`tel:${editAppInstance.phoneNumber}`}
                                      className="p-1 px-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-lg text-[8px] font-black uppercase tracking-wider flex items-center gap-1 transition-all border border-indigo-500/10 active:scale-95"
                                    >
                                       <Phone size={9} /> Gọi
                                    </a>
                                    <a 
                                      href={`sms:${editAppInstance.phoneNumber}`}
                                      className="p-1 px-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 rounded-lg text-[8px] font-black uppercase tracking-wider flex items-center gap-1 transition-all border border-emerald-500/10 active:scale-95"
                                    >
                                       <MessageSquare size={9} /> SMS
                                    </a>
                                 </div>
                               )}
                            </div>
                         </div>

                         {/* FIELD STATUS UPDATE */}
                         <section className="space-y-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Xét duyệt chất lượng hiện trường</p>
                            <div className="grid grid-cols-3 gap-2.5">
                               {[
                                 { val: 'Processing', label: 'Processing', color: 'indigo' },
                                 { val: 'Completed', label: 'Hoàn tất', color: 'emerald' },
                                 { val: 'Error', label: 'Vướng mắc', color: 'rose' }
                               ].map((st) => {
                                  const isCurrent = editAppInstance.status === st.val;
                                  return (
                                    <button 
                                      key={`edit-st-${st.val}`}
                                      onClick={() => {
                                        setEditAppInstance(prev => prev ? {
                                          ...prev,
                                          status: st.val as any
                                        } : null);
                                      }}
                                      className={cn(
                                        "py-3.5 px-1 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all text-center",
                                        isCurrent 
                                          ? st.color === 'indigo' ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/10"
                                            : st.color === 'emerald' ? "bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-600/10"
                                            : "bg-rose-600 border-rose-500 text-white shadow-md shadow-rose-600/10"
                                          : "bg-slate-900 border-slate-800/80 text-slate-400 active:bg-slate-800"
                                      )}
                                    >
                                       {st.label}
                                    </button>
                                  );
                               })}
                            </div>
                         </section>

                         {/* DYNAMIC VƯỚNG MẮC (ERROR) FORM IF CHOSEN STATUS == ERROR */}
                         <AnimatePresence>
                           {editAppInstance.status === 'Error' && (
                             <motion.div
                               initial={{ opacity: 0, height: 0 }}
                               animate={{ opacity: 1, height: 'auto' }}
                               exit={{ opacity: 0, height: 0 }}
                               transition={{ duration: 0.2 }}
                               className="space-y-4 bg-rose-500/5 p-4 rounded-3xl border border-rose-500/10"
                             >
                                <div className="flex items-center gap-2 mb-1">
                                  <AlertTriangle className="text-rose-500" size={16} />
                                  <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Khai báo chi tiết vướng mắc</p>
                                </div>

                                <div className="space-y-1.5 text-left">
                                  <label className="text-[9px] font-black uppercase tracking-widest text-rose-300 ml-1">Phân loại vướng mắc</label>
                                  <select
                                    value={editAppInstance.issueType || 'Sai sót Khác'}
                                    onChange={(e) => {
                                      setEditAppInstance(prev => prev ? {
                                        ...prev,
                                        issueType: e.target.value as any
                                      } : null);
                                    }}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-xs font-bold text-white focus:border-rose-500 outline-none"
                                  >
                                    <option value="None">Chưa lựa chọn</option>
                                    <option value="Sai sót nội bộ">Sai sót nội bộ</option>
                                    <option value="Sai sót khách hàng">Sai sót khách hàng</option>
                                    <option value="Sai sót cơ quan nhà nước">Sai sót cơ quan nhà nước</option>
                                    <option value="Sai sót chủ đầu tư">Sai sót chủ đầu tư</option>
                                    <option value="Sai sót Khác">Sai sót Khác</option>
                                  </select>
                                </div>

                                <div className="space-y-1.5 text-left">
                                  <label className="text-[9px] font-black uppercase tracking-widest text-rose-300 ml-1">Mức độ nghiêm trọng</label>
                                  <select
                                    value={editAppInstance.issueSeverity || 'Moderate'}
                                    onChange={(e) => {
                                      setEditAppInstance(prev => prev ? {
                                        ...prev,
                                        issueSeverity: e.target.value as any
                                      } : null);
                                    }}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-xs font-bold text-white focus:border-rose-500 outline-none"
                                  >
                                    <option value="Minor">Thấp / Nhẹ (Minor)</option>
                                    <option value="Moderate">Trung bình (Moderate)</option>
                                    <option value="Critical">Nghiêm trọng (Critical)</option>
                                  </select>
                                </div>

                                <div className="space-y-1.5 text-left">
                                  <label className="text-[9px] font-black uppercase tracking-widest text-rose-300 ml-1">Ghi chú & Nội dung vướng mắc</label>
                                  <textarea
                                    value={editAppInstance.issueNotes || ''}
                                    onChange={(e) => {
                                      setEditAppInstance(prev => prev ? {
                                        ...prev,
                                        issueNotes: e.target.value
                                      } : null);
                                    }}
                                    placeholder="Mô tả chi tiết vướng mắc, lỗi nghiệp vụ..."
                                    rows={3}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white focus:border-rose-500 outline-none placeholder-slate-600"
                                  />
                                </div>
                             </motion.div>
                           )}
                         </AnimatePresence>
                      </div>
                    )}

                    {/* PROCESS TIMELINE AND ACTION WORKFLOWS TAB */}
                    {transitionTab === 'workflow' && (
                      <div className="space-y-6">
                         
                         {/* WORKFLOW SUMMARY DETAILS */}
                         <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl flex items-start gap-3">
                            <Clock size={16} className="text-amber-500 mt-0.5 shrink-0" />
                            <div className="text-left text-xs text-slate-350">
                               <p className="font-bold text-slate-200">Giai đoạn hiện tại:</p>
                               <p className="text-amber-400 font-extrabold italic mt-0.5">{(STEP_CONFIG[editAppInstance.currentStep] || { label: editAppInstance.currentStep }).label}</p>
                               <p className="text-[9px] text-slate-500 mt-1 uppercase font-black">Bộ phận phối hợp: {(STEP_CONFIG[editAppInstance.currentStep] || { dept: 'Hệ thống' }).dept}</p>
                            </div>
                         </div>

                         {/* ACTIVE ACTIONS CARD BY ROLE PERMISSION STATUS */}
                         <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl border border-slate-800 relative z-0">
                            <div className="flex items-center gap-2 mb-3">
                              <User size={14} className="text-indigo-400" />
                              <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Quyền xử lý và chuyển bước</h4>
                            </div>

                            {/* USER STATUS ACCESS */}
                            <div className="flex items-center gap-2 mb-4 p-2 bg-slate-950/40 rounded-xl border border-slate-900">
                               <span className={cn(
                                 "w-2.5 h-2.5 rounded-full",
                                 isUserAuthorizedToTransition ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                               )} />
                               <p className="text-[10px] font-bold text-slate-300">
                                 {isUserAuthorizedToTransition 
                                    ? "Bạn được quyền thực hiện chuyển bước hồ sơ này." 
                                    : `Chỉ Quản lý hoặc Nhân viên bộ phận ${STEP_CONFIG[editAppInstance.currentStep]?.dept || 'Hệ thống'} được chuyển bước.`}
                               </p>
                            </div>

                            {isUserAuthorizedToTransition ? (
                              <div className="space-y-4">
                                 {/* CHUYỂN TIẾP TRƯỚC (MOVE FORWARD) SECTION */}
                                 {nextStepName ? (
                                    <div className="bg-indigo-950/20 p-4 rounded-2xl border border-indigo-900/30 text-left">
                                       <span className="text-[9px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-md font-black uppercase border border-indigo-500/20">{editAppInstance?.isSelfService ? "Hình thức nhảy bước" : "Chuyển tiếp giai đoạn"}</span>
                                       
                                       <div className="flex items-center gap-2 mt-2 py-1.5 px-2 bg-slate-950/70 rounded-xl border border-slate-900">
                                         <p className="text-[10px] font-bold text-indigo-300 truncate">
                                            Bước tiếp: <span className="text-white font-extrabold italic">{editAppInstance?.isSelfService ? "Chuyển thẳng đến Chờ bàn giao" : (STEP_CONFIG[nextStepName] || { label: nextStepName }).label}</span>
                                         </p>
                                       </div>

                                       <div className="space-y-1.5 mt-3">
                                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Ghi chú bàn giao mới (Tùy chọn)</label>
                                          <textarea 
                                             value={transitionNote}
                                             onChange={(e) => setTransitionNote(e.target.value)}
                                             placeholder="Nhập ghi chú bàn giao hoặc chứng chỉ cần lưu ý cho bộ phận sau..."
                                             rows={2}
                                             className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-bold text-white focus:border-indigo-500 outline-none placeholder-slate-600"
                                          />
                                       </div>

                                       <button 
                                          data-confirm-transition
                                          onClick={handleMoveForward}
                                          disabled={isTransitioning}
                                          className="w-full mt-3 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                                       >
                                          {isTransitioning ? (
                                             <>
                                               <Loader2 size={12} className="animate-spin" /> Đang đồng bộ...
                                             </>
                                          ) : (
                                             <>
                                               <CheckCircle size={14} /> {editAppInstance?.isSelfService ? "Chuyển thẳng đến Chờ bàn giao" : "Xác nhận chuyển bước"} <ArrowRight size={12} />
                                             </>
                                          )}
                                       </button>
                                    </div>
                                 ) : (
                                    <div className="py-4 text-center bg-emerald-500/5 rounded-2xl border border-emerald-500/10 text-emerald-400">
                                       <CheckCircle className="mx-auto mb-1" size={20} />
                                       <p className="text-[10px] font-black uppercase tracking-wider">Hồ sơ đã đạt bước hoàn tất</p>
                                    </div>
                                 )}

                                 {/* TRẢ LẠI / REJECT TRƯỚC (MOVE BACKWARD) SECTION */}
                                 {backwardSteps.length > 0 && (
                                   <div className="bg-rose-950/10 p-4 rounded-2xl border border-rose-900/20 text-left">
                                      <span className="text-[9px] px-2 py-0.5 bg-rose-500/10 text-rose-400 rounded-md font-black uppercase border border-rose-500/20">Trả lại / Yêu cầu khắc phục</span>
                                      
                                      <div className="space-y-2.5 mt-3">
                                         <div>
                                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Chọn bước trả về</label>
                                            <select
                                               value={selectedBackwardStep}
                                               onChange={e => setSelectedBackwardStep(e.target.value as StepName)}
                                               className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2.5 text-xs font-bold text-white focus:border-rose-500 outline-none mt-1"
                                            >
                                               <option value="">-- Chọn bước cần trả về --</option>
                                               {backwardSteps.map((st, idx) => (
                                                 <option key={`back-st-${st}-${idx}`} value={st}>
                                                    {(STEP_CONFIG[st] || { label: st }).label}
                                                 </option>
                                               ))}
                                            </select>
                                         </div>

                                         <div className="space-y-1">
                                            <label className="text-[9px] font-black uppercase text-rose-300 tracking-wider flex items-center gap-1">
                                               Lý do trả hồ sơ / vướng mắc <span className="text-rose-500 font-bold">*</span>
                                            </label>
                                            <textarea 
                                               value={selectedBackwardStep ? transitionNote : ''}
                                               onChange={(e) => setTransitionNote(e.target.value)}
                                               placeholder="Mô tả cụ thể và chính xác thông tin sai sót cần khắc phục..."
                                               disabled={!selectedBackwardStep}
                                               rows={2}
                                               className="w-full bg-slate-950 border border-slate-800 disabled:opacity-40 rounded-xl p-2.5 text-xs font-bold text-white focus:border-rose-500 outline-none placeholder-slate-600"
                                            />
                                         </div>

                                         <button 
                                            onClick={handleMoveBackward}
                                            disabled={isTransitioning || !selectedBackwardStep}
                                            className="w-full py-3 px-4 bg-rose-700/80 hover:bg-rose-600 disabled:opacity-35 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                                         >
                                            {isTransitioning ? (
                                               <>
                                                 <Loader2 size={12} className="animate-spin" /> Đang cập nhật...
                                               </>
                                            ) : (
                                               <>
                                                 <Reply size={13} className="rotate-180" /> Từ chối & Trả hồ sơ
                                               </>
                                            )}
                                         </button>
                                      </div>
                                   </div>
                                 )}
                              </div>
                            ) : (
                              <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-850 flex items-start gap-2 text-slate-500">
                                 <Info size={14} className="shrink-0 mt-0.5" />
                                 <p className="text-[10px] font-semibold">Tài khoản hiện trường {currentUser.name} thuộc phòng ban {currentUser.dept}. Trạng thái hiện tại do bộ phận {STEP_CONFIG[editAppInstance.currentStep]?.dept || 'Hệ thống'} xử lý, do đó quyền hạn chuyển tiếp tạm khóa.</p>
                              </div>
                            )}
                         </div>

                         {/* DYNAMIC VISUAL PROCESS TIMELINE */}
                         <section className="space-y-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Sơ đồ quy trình thực tế</p>
                            <div className="bg-slate-900/30 border border-slate-850/80 rounded-3xl p-5 relative">
                               <div className="absolute left-7.5 top-8 bottom-8 w-0.5 bg-slate-800" /> {/* Vertical line */}
                               
                               <div className="space-y-6 relative text-left">
                                  {appWorkflowSteps.map((stepKey, idx) => {
                                     const config = STEP_CONFIG[stepKey];
                                     const isCompleted = idx < currentStepIndex;
                                     const isCurrent = idx === currentStepIndex;
                                     const isFuture = idx > currentStepIndex;
                                     
                                     return (
                                       <div key={`timeline-${stepKey}-${idx}`} className="flex gap-4 items-start text-left relative">
                                          {/* Step circle indicator */}
                                          <div className={cn(
                                            "w-6.5 h-6.5 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 border z-10",
                                            isCompleted ? "bg-emerald-600 border-emerald-500 text-white" :
                                            isCurrent ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30 scale-110 animate-pulse" :
                                            "bg-slate-900 border-slate-800 text-slate-500"
                                          )}>
                                             {isCompleted ? <Check size={10} className="stroke-[3px]" /> : idx + 1}
                                          </div>
                                          
                                          {/* Step description detail */}
                                          <div className="flex-1 min-w-0 pt-0.5">
                                             <div className="flex items-center gap-1.5 flex-wrap">
                                               <h5 className={cn(
                                                 "text-xs font-black tracking-tight",
                                                 isCurrent ? "text-indigo-400 font-black tracking-tight" :
                                                 isCompleted ? "text-slate-300" : "text-slate-600/80"
                                               )}>
                                                  {config?.label || stepKey}
                                               </h5>
                                               {config?.dept && (
                                                 <span className={cn(
                                                   "text-[7px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider",
                                                   isCurrent ? "bg-indigo-500/25 text-indigo-300" : "bg-slate-800/40 text-slate-500"
                                                 )}>
                                                   {config.dept}
                                                 </span>
                                               )}
                                             </div>
                                             {config?.description && (
                                               <p className={cn(
                                                 "text-[9px] mt-0.5 leading-snug",
                                                 isCurrent ? "text-slate-350" : "text-slate-600"
                                               )}>
                                                  {config.description}
                                               </p>
                                             )}
                                          </div>
                                       </div>
                                     );
                                  })}
                               </div>
                            </div>
                         </section>

                      </div>
                    )}

                    {/* DOCK DOCUMENTS AND IMAGE CAPTURE TAB */}
                    {transitionTab === 'document' && (
                      <div className="space-y-6">
                         {/* PHOTO AND SCAN DOCUMENTS ATTACHMENTS */}
                         <section className="space-y-3">
                            <div className="flex items-center justify-between pl-2">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ảnh / Hồ sơ hiện trường</p>
                              <span className="text-[9px] text-slate-500 font-bold uppercase">{editAppInstance.scannedFiles?.length || 0} tệp</span>
                            </div>

                            {/* FILE UPLOAD ACCELERATOR BUTTONS */}
                            <div className="grid grid-cols-2 gap-3.5">
                               <button 
                                  onClick={() => {
                                    if (cameraInputRef.current) cameraInputRef.current.click();
                                  }}
                                  className="py-4 bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-3xl flex flex-col items-center justify-center gap-2 active:bg-slate-800 transition-all font-bold text-slate-400 hover:text-indigo-400"
                               >
                                  <Camera size={24} className="text-indigo-400" />
                                  <span className="text-[9px] font-black uppercase tracking-wider">Chụp ảnh mới</span>
                               </button>
                               <button 
                                  onClick={() => {
                                    if (fileInputRef.current) fileInputRef.current.click();
                                  }}
                                  className="py-4 bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-3xl flex flex-col items-center justify-center gap-2 active:bg-slate-800 transition-all font-bold text-slate-400 hover:text-indigo-400"
                               >
                                  <Upload size={24} className="text-indigo-400" />
                                  <span className="text-[9px] font-black uppercase tracking-wider">Tải ảnh/Tệp lên</span>
                               </button>
                            </div>

                            {/* LIST OF CURRENT FILES */}
                            {editAppInstance.scannedFiles && editAppInstance.scannedFiles.length > 0 ? (
                              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-3 divide-y divide-slate-800/60 overflow-y-auto">
                                {editAppInstance.scannedFiles.map((file, i) => (
                                  <div key={`file-list-item-${file.id || i}`} className="py-2.5 flex items-center justify-between text-left">
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                                      <Paperclip size={13} className="text-slate-400 shrink-0" />
                                      <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-200 truncate">{file.name}</p>
                                        <p className="text-[8px] text-slate-500 font-semibold uppercase">{file.uploadDate} • {(file.type || 'unknown').split('/').pop()?.toUpperCase()}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button 
                                        onClick={() => window.open(file.url, '_blank')}
                                        className="p-2 bg-slate-950 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white border border-slate-800"
                                        title="Xem tệp"
                                      >
                                        <Eye size={12} />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteFile(file.id)}
                                        className="p-2 bg-slate-950 hover:bg-rose-950/40 rounded-xl text-slate-500 hover:text-rose-400 border border-slate-800 hover:border-rose-950"
                                        title="Xóa tệp"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-8 text-center bg-slate-900/20 border border-slate-855 rounded-2xl text-slate-500 text-[10px] uppercase font-black">
                                Chưa có hồ sơ hoặc tệp tin đính kèm
                              </div>
                            )}
                         </section>
                      </div>
                    )}

                 </div>

                 {/* BOTTOM SAVE DRAWER ACTION BAR */}
                 <div className="absolute bottom-0 left-0 right-0 p-5 bg-slate-950/90 backdrop-blur-xl border-t border-slate-850 z-[250] flex flex-col gap-2 shrink-0">
                    <button 
                      onClick={handleSaveChangesAndClose}
                      className="w-full py-5 bg-indigo-650 bg-indigo-600 text-white rounded-[2.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                       <CheckCircle size={15} className="stroke-[2.5]" /> Lưu & Hoàn thành Cập nhật
                    </button>
                 </div>
             </motion.div>
          )}
       </AnimatePresence>

       {/* SIMULATED QR CODE SCANNER MODAL */}
       <AnimatePresence>
         {showQrScanModal && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[999] flex flex-col items-center justify-center p-6 text-center"
           >
              <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 to-slate-950 rounded-[2.5rem] border border-indigo-500/30 p-8 shadow-2xl relative overflow-hidden flex flex-col gap-6">
                 
                 {/* Laser Glow Effect */}
                 <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent blur-sm animate-pulse" style={{ top: `${qrScanProgress}%`, transition: 'top 0.12s linear' }} />
                 <div className="absolute inset-x-0 h-[2px] bg-indigo-500" style={{ top: `${qrScanProgress}%`, transition: 'top 0.12s linear' }} />

                 <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-2xl border border-slate-900">
                    <div className="flex items-center gap-2">
                       <ScanLine className="text-indigo-400" size={20} />
                       <h3 className="text-sm font-black uppercase tracking-wide text-left text-white leading-none">Máy quét QR hồ sơ</h3>
                    </div>
                    <button 
                      onClick={() => setShowQrScanModal(false)}
                      className="p-1 px-3 bg-slate-800 text-slate-350 hover:text-white rounded-full text-[10px] font-black uppercase tracking-wider transition-colors border border-slate-700/50"
                    >
                      Hủy
                    </button>
                 </div>

                 {/* Camera Target overlay design */}
                 <div className="aspect-square w-48 h-48 mx-auto border-2 border-indigo-500/40 rounded-3xl relative flex items-center justify-center bg-slate-950/60 transition-colors">
                    <div className="absolute top-3 left-3 w-4 h-4 border-t-4 border-l-4 border-indigo-400 rounded-tl-[4px]" />
                    <div className="absolute top-3 right-3 w-4 h-4 border-t-4 border-r-4 border-indigo-400 rounded-tr-[4px]" />
                    <div className="absolute bottom-3 left-3 w-4 h-4 border-b-4 border-l-4 border-indigo-400 rounded-bl-[4px]" />
                    <div className="absolute bottom-3 right-3 w-4 h-4 border-b-4 border-r-4 border-indigo-400 rounded-br-[4px]" />
                    
                    {qrScanResult ? (
                       <motion.div 
                         initial={{ scale: 0.5, opacity: 0 }}
                         animate={{ scale: 1, opacity: 1 }}
                         className="flex flex-col items-center gap-1"
                       >
                          <CheckCircle size={44} className="text-emerald-500 fill-emerald-500/10 animate-bounce" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 font-mono mt-1">Nạp Mã {qrScanResult}!</span>
                       </motion.div>
                    ) : (
                       <div className="flex flex-col items-center gap-2 text-slate-500">
                          <QrCode size={48} className="text-indigo-500/30 animate-pulse" />
                          <span className="text-[9px] uppercase tracking-widest font-black text-slate-500">Đang tìm mã QR...</span>
                       </div>
                    )}
                 </div>

                 {/* progress status block */}
                 <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                       <span className="uppercase tracking-wide">Trình tự cảm biến:</span>
                       <span className="font-mono text-indigo-400">{qrScanProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                       <div className="bg-indigo-500 h-full transition-all duration-150" style={{ width: `${qrScanProgress}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-500 italic">
                       {qrScanResult === 'QR_NOT_FOUND' ? "LỖI: Chưa phát hiện mã phù hợp" :
                        qrScanResult ? `Đã nạp thành công mã căn: ${qrScanResult}` :
                        "Xin đưa camera lại gần mã QR / Mã vạch dán trên tài liệu"}
                    </p>
                 </div>
              </div>
           </motion.div>
         )}
       </AnimatePresence>

    </div>
  );
}
