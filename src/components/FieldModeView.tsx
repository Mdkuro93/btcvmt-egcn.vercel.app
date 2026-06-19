import React, { useState, useMemo, useRef } from 'react';
import { useModalStore } from '../stores/useModalStore';
import MobileLayout from './mobile/MobileLayout';
import MobileRecordList from './mobile/MobileRecordList';
import MobileRecordDetail from './mobile/MobileRecordDetail';
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
  askConfirm: (title: string, message: string, onConfirm: () => void) => void;
  onOpenBulkDocs?: (ids: string[]) => void;
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
  askConfirm,
  onOpenBulkDocs,
  onStepTransition
}: FieldModeViewProps) {
  const [search, setSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'issue'>('all');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [editAppInstance, setEditAppInstance] = useState<Application | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
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
  const handleDeleteFile = (fileId: string) => {
    if (!editAppInstance) return;
    askConfirm(
      'Xóa tài liệu',
      'Bạn có chắc chắn muốn xóa tài liệu này?',
      async () => {
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
      }
    );
  };

  // 3. Complete edit and save everything
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

  return (
    <MobileLayout currentUser={currentUser} onExit={onExit}>
      <MobileRecordList 
        currentUser={currentUser}
        search={search}
        setSearch={setSearch}
        selectedProject={selectedProject}
        setSelectedProject={setSelectedProject}
        filterType={filterType}
        setFilterType={setFilterType}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        isOfflineSimulated={isOfflineSimulated}
        setIsOfflineSimulated={setIsOfflineSimulated}
        handleStartQrScan={handleStartQrScan}
        handleOpenDetailModal={handleOpenDetailModal}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        triggerFileSelect={() => {
          if (fileInputRef.current) fileInputRef.current.click();
        }}
        onOpenBulkDocs={onOpenBulkDocs}
      />

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

       {/* DETAIL UPDATE DRAWER - INTEGRATED WITH PROCESS TIMELINE AND STEP TRANSITIONS */}
       {selectedApp && editAppInstance && (
         <MobileRecordDetail
           editAppInstance={editAppInstance}
           setEditAppInstance={setEditAppInstance}
           selectedApp={selectedApp}
           setSelectedApp={setSelectedApp}
           onUpdateApp={onUpdateApp}
           currentUser={currentUser}
           askConfirm={askConfirm}
           supabase={supabase}
           onStepTransition={onStepTransition}
         />
       )}

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

    </MobileLayout>
  );
}
