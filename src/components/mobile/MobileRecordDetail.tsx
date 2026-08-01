import React, { useState, useMemo, useRef } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useDataStore } from '../../stores/useDataStore';
import { Application, StepName, UserProfile, ScannedFile } from '../../types';
import { WORKFLOW_1_STEPS, WORKFLOW_2_STEPS, STEP_CONFIG } from '../../constants';
import { 
  Sparkles, X, Phone, MessageSquare, CheckCircle, ArrowRight, Loader2, Reply, Info, Check, Trash2, Camera, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { getRecordDept } from '../../utils/appUtils';

interface MobileRecordDetailProps {
  editAppInstance: Application;
  setEditAppInstance: (app: Application | null) => void;
  selectedApp: Application;
  setSelectedApp: (app: Application | null) => void;
  onUpdateApp: (app: Application) => void;
  currentUser: UserProfile;
  askConfirm: (title: string, message: string, onConfirm: () => void) => void;
  supabase?: any;
  onStepTransition: (nextStep: StepName, note?: string, overrideApp?: Application) => Promise<void>;
}

export default function MobileRecordDetail({
  editAppInstance,
  setEditAppInstance,
  selectedApp,
  setSelectedApp,
  onUpdateApp,
  currentUser,
  askConfirm,
  supabase,
  onStepTransition
}: MobileRecordDetailProps) {
  const [transitionTab, setTransitionTab] = useState<'info' | 'workflow' | 'document'>('info');
  const [transitionNote, setTransitionNote] = useState('');
  const [selectedBackwardStep, setSelectedBackwardStep] = useState<StepName | ''>('');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const appWorkflowSteps = useMemo(() => {
    if (!editAppInstance) return [];
    return editAppInstance.workflowType === 'Quy_trinh_2' ? WORKFLOW_2_STEPS : WORKFLOW_1_STEPS;
  }, [editAppInstance]);

  const currentStepIndex = useMemo(() => {
    if (!editAppInstance || appWorkflowSteps.length === 0) return -1;
    return appWorkflowSteps.indexOf(editAppInstance.currentStep);
  }, [editAppInstance, appWorkflowSteps]);

  const nextStepName = useMemo(() => {
    if (currentStepIndex === -1 || currentStepIndex >= appWorkflowSteps.length - 1) return null;
    if (editAppInstance?.isSelfService) return 'Hoan_Tat' as StepName;
    return appWorkflowSteps[currentStepIndex + 1];
  }, [currentStepIndex, appWorkflowSteps, editAppInstance?.isSelfService]);

  const backwardSteps = useMemo(() => {
    if (currentStepIndex <= 0) return [];
    return appWorkflowSteps.slice(0, currentStepIndex);
  }, [currentStepIndex, appWorkflowSteps]);

  const isUserAuthorizedToTransition = useMemo(() => {
    if (!editAppInstance || !currentUser) return false;
    
    const effectiveDept = getRecordDept(editAppInstance, STEP_CONFIG);

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

  const handleMoveForward = async () => {
    if (!editAppInstance || !nextStepName || !editAppInstance.id) return;
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
      setSelectedApp(updatedApp);
      setTransitionNote('');
      alert("Đã chuyển bước thành công!");
    } catch (error: any) {
      console.error(error);
      alert("Lỗi khi chuyển bước: " + (error.message || error));
    } finally {
      setIsTransitioning(false);
    }
  };

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
      setSelectedApp(updatedApp);
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

  if (!editAppInstance) return null;

  return (
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
            onClick={handleSaveChangesAndClose} 
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
                              const newSt = st.val as 'Processing' | 'Completed' | 'Error';
                              setEditAppInstance({ ...editAppInstance, status: newSt });
                              if (newSt === 'Error') {
                                setTransitionTab('workflow'); // force them to log issue
                              }
                            }}
                            className={cn(
                              "py-3 rounded-2xl flex flex-col items-center gap-1.5 transition-all text-[8px] font-black uppercase tracking-widest border",
                              isCurrent ? `bg-${st.color}-500/15 border-${st.color}-500/50 text-${st.color}-400 shadow-[0_0_15px_-3px_rgba(0,0,0,0.3)] shadow-${st.color}-500/20 scale-[1.02]` : "bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800 hover:text-white"
                            )}
                          >
                            {isCurrent && <Check size={12} className="stroke-[3px]" />}
                            {st.label}
                          </button>
                        );
                      })}
                  </div>
                </section>
            </div>
          )}

          {/* WORKFLOW TRANSITIONS TAB */}
          {transitionTab === 'workflow' && (
            <div className="space-y-6">
                
                {/* ACTION MODULE: FORWARD OR BACKWARD */}
                <div className="mb-4 text-left">
                  <h4 className="text-sm font-black text-white italic mb-3">Tác vụ Chuyển bước</h4>
                  
                  {isUserAuthorizedToTransition ? (
                    <div className="space-y-4">
                        {/* TIẾN LÊN (MOVE FORWARD) SECTION */}
                        {nextStepName ? (
                          <div className="bg-indigo-950/20 p-4 rounded-2xl border border-indigo-900/30 text-left">
                              <span className="text-[9px] px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-md font-black uppercase border border-indigo-500/20">Chuyển tiếp</span>
                              <p className="text-xs text-indigo-100 font-bold mt-2">
                                Bạn đang xác nhận hoàn thành bước <span className="text-indigo-400">{STEP_CONFIG[editAppInstance.currentStep]?.label}</span>. 
                                Hồ sơ sẽ được chuyển đến: <span className="text-indigo-300 bg-indigo-900/50 px-1 rounded">{STEP_CONFIG[nextStepName]?.label}</span>
                              </p>
                              
                              <div className="mt-3 space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Ghi chú xác nhận (Không bắt buộc)</label>
                                <textarea 
                                    value={transitionNote}
                                    onChange={(e) => setTransitionNote(e.target.value)}
                                    placeholder="Ghi chú nội bộ cho người nhận bước tiếp theo..."
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
                        <p className="text-[10px] font-semibold">Tài khoản hiện trường {currentUser.name} thuộc phòng ban {currentUser.dept}. Trạng thái hiện tại do bộ phận {getRecordDept(editAppInstance, STEP_CONFIG) || 'Hệ thống'} xử lý, do đó quyền hạn chuyển tiếp tạm khóa.</p>
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

          {/* DOCUMENTS VIEW TAB */}
          {transitionTab === 'document' && (
            <div className="space-y-6">
                
                <div className="grid grid-cols-2 gap-3">
                  {editAppInstance.scannedFiles && editAppInstance.scannedFiles.length > 0 ? (
                      editAppInstance.scannedFiles.map((file, idx) => {
                        const isImage = file.type.startsWith('image/');
                        const isPDF = file.type === 'application/pdf';
                        return (
                            <div key={`file-${idx}`} className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden text-left relative group">
                              <div className="aspect-[4/3] bg-slate-950 flex items-center justify-center relative overflow-hidden group-hover:bg-slate-900 transition-colors">
                                  {isImage ? (
                                    <img src={file.url} alt={file.name} className="w-full h-full object-cover opacity-80" loading="lazy" />
                                  ) : isPDF ? (
                                    <FileText size={24} className="text-rose-400" />
                                  ) : (
                                    <FileText size={24} className="text-slate-600" />
                                  )}
                                  
                                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                                  
                                  {/* DELETE BUTTON */}
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.id); }}
                                    className="absolute top-2 right-2 w-7 h-7 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all pt-[1px]"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                  
                                  <div className="absolute bottom-2 left-2 right-2">
                                    <p className="text-[8px] font-black uppercase text-indigo-300 font-mono truncate">{file.name}</p>
                                    <p className="text-[7px] text-slate-400 mt-0.5">{file.uploadDate}</p>
                                  </div>
                              </div>
                              <div className="p-2 border-t border-slate-800/50 flex gap-1">
                                  <a href={file.url} target="_blank" rel="noopener noreferrer" className="flex-1 py-1.5 bg-slate-950 hover:bg-slate-800 rounded-lg text-center text-[8px] font-bold text-slate-300 transition-colors">Theo dõi</a>
                                  <a href={file.url} download className="flex-1 py-1.5 bg-slate-950 hover:bg-slate-800 rounded-lg text-center text-[8px] font-bold text-slate-300 transition-colors">Lưu trữ</a>
                              </div>
                            </div>
                        );
                      })
                  ) : (
                      <div className="col-span-2 py-12 text-center rounded-[2rem] bg-indigo-900/10 border border-indigo-900/30 p-8">
                        <Camera size={32} className="mx-auto mb-3 text-indigo-500/50" />
                        <p className="text-xs font-black uppercase text-indigo-400 tracking-wider">Chưa có ảnh khảo sát</p>
                        <p className="text-[10px] text-slate-500 mt-1">Hồ sơ này chưa được quét mã hoặc đính kèm hiện trạng</p>
                      </div>
                  )}
                </div>

            </div>
          )}

      </div>
    </motion.div>
  );
}
