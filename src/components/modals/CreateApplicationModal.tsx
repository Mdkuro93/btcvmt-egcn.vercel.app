import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Application, UserProfile, Project } from '../../types';
import { cn } from '../../lib/utils';
import { X, Home, Map as MapIcon, User, Key, Save, ChevronDown, Clock, Check, FileText } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
interface CreateApplicationModalProps {
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  theme: 'light' | 'dark';
  newApp: Partial<Application>;
  setNewApp: (app: Partial<Application>) => void;
  formErrors: Record<string, string>;
  projects?: Project[];
  handleCreateApp: () => void;
  isSavingApp: boolean;
  visibleProjects?: Project[];
}
export const CreateApplicationModal = ({
  isCreateModalOpen,
  setIsCreateModalOpen,
  theme,
  newApp,
  setNewApp,
  formErrors,
  visibleProjects,
  projects,
  handleCreateApp,
  isSavingApp
}: CreateApplicationModalProps) => {

  const displayProjects = visibleProjects || projects || [];
  const { showToast } = useToast();
  const toast = {
    error: (msg: string) => showToast(msg, 'error')
  };
  const formData = newApp;

  const handleSubmit = () => {
    if (!formData.receivedDate) {
      toast.error("Vui lòng nhập Ngày tiếp nhận hồ sơ! Đây là trường bắt buộc để tính toán hiệu suất (SLA) của các phòng ban.");
      return;
    }
    handleCreateApp();
  };

  return (
<>
      {/* Create Application Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60]"
              onClick={() => setIsCreateModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={cn(
                "fixed inset-0 m-auto w-full max-w-2xl h-fit max-h-[90vh] z-[70] rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] border flex flex-col overflow-hidden",
                theme === 'light' ? "bg-white border-slate-200" : "bg-[#1E293B] border-slate-700"
              )}
            >
              <div className={cn(
                "p-8 border-b flex items-center justify-between",
                theme === 'light' ? "bg-slate-50/50 border-slate-100" : "bg-slate-900/50 border-slate-800"
              )}>
                <div>
                  <h3 className={cn(
                    "text-2xl font-black italic font-serif tracking-tight",
                    theme === 'light' ? "text-slate-900" : "text-white"
                  )}>Tạo mới Hồ sơ GCN</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Khởi tạo quy trình cấp sổ mới</p>
                </div>
                <button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className={cn(
                    "p-3 rounded-full transition-colors",
                    theme === 'light' ? "hover:bg-slate-200 text-slate-500 hover:text-slate-900" : "hover:bg-slate-800 text-slate-400 hover:text-white"
                  )}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
                {/* Section 1: Thông tin cơ bản */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                    <h4 className={cn("text-[10px] font-black uppercase tracking-[0.2em]", theme === 'light' ? "text-slate-600" : "text-slate-400")}>Thông tin định danh</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5 flex-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Mã lô/căn <span className="text-rose-500">*</span></label>
                      <div className="relative group">
                        <Home size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                          type="text" 
                          placeholder="VD: A1.1205"
                          className={cn(
                            "w-full pl-10 pr-4 py-3 border rounded-2xl text-sm focus:ring-2 transition-all outline-none",
                            theme === 'light' ? "bg-white border-slate-200 text-slate-900 focus:bg-white" : "bg-slate-900 border-slate-800 text-slate-200",
                            formErrors.unitCode ? "border-rose-500 ring-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]" : "focus:ring-emerald-500/20"
                          )}
                          value={newApp.unitCode}
                          onChange={(e) => setNewApp({...newApp, unitCode: e.target.value})}
                        />
                      </div>
                      {formErrors.unitCode && <p className="text-[10px] text-rose-500 font-bold pl-1 italic">{formErrors.unitCode}</p>}
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Dự án</label>
                      <div className="relative group">
                        <MapIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                        <select 
                          className={cn(
                            "w-full pl-10 pr-10 py-3 border rounded-2xl text-sm focus:ring-2 transition-all outline-none appearance-none cursor-pointer",
                            theme === 'light' ? "bg-white border-slate-200 text-slate-900 focus:ring-emerald-500/20" : "bg-slate-900 border-slate-800 text-slate-200 focus:ring-emerald-500/20"
                          )}
                          value={newApp.projectName}
                          onChange={(e) => setNewApp({...newApp, projectName: e.target.value})}
                        >
                          {displayProjects.map((p, pIdx) => (
                            <option key={`create-proj-opt-${p.id || 'none'}-${pIdx}`} value={p.name}>{p.name}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5 flex-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Tên khách hàng <span className="text-rose-500">*</span></label>
                      <div className="relative group">
                        <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                          type="text" 
                          placeholder="VD: Nguyễn Văn A"
                          className={cn(
                            "w-full pl-10 pr-4 py-3 border rounded-2xl text-sm focus:ring-2 transition-all outline-none",
                            theme === 'light' ? "bg-white border-slate-200 text-slate-900 focus:bg-white" : "bg-slate-900 border-slate-800 text-slate-200",
                            formErrors.customerName ? "border-rose-500 ring-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]" : "focus:ring-emerald-500/20"
                          )}
                          value={newApp.customerName}
                          onChange={(e) => setNewApp({...newApp, customerName: e.target.value})}
                        />
                      </div>
                      {formErrors.customerName && <p className="text-[10px] text-rose-500 font-bold pl-1 italic">{formErrors.customerName}</p>}
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Đối tượng ký HĐCN</label>
                      <div className="relative group">
                        <Key size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                          type="text" 
                          placeholder="VD: Công ty A / Cá nhân B"
                          className={cn(
                            "w-full pl-10 pr-4 py-3 border rounded-2xl text-sm focus:ring-2 transition-all outline-none",
                            theme === 'light' ? "bg-white border-slate-200 text-slate-900 focus:bg-white focus:ring-emerald-500/20" : "bg-slate-900 border-slate-800 text-slate-200 focus:ring-emerald-500/20"
                          )}
                          value={newApp.contractSignerType}
                          onChange={(e) => setNewApp({...newApp, contractSignerType: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5 flex-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Số GCNQSDĐ</label>
                      <div className="relative group">
                        <FileText size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                          type="text" 
                          placeholder="Nhập số sổ đỏ / GCN"
                          className={cn(
                            "w-full pl-10 pr-4 py-3 border rounded-2xl text-sm focus:ring-2 transition-all outline-none",
                            theme === 'light' ? "bg-white border-slate-200 text-slate-900 focus:bg-white focus:ring-emerald-500/20" : "bg-slate-900 border-slate-800 text-slate-200 focus:ring-emerald-500/20"
                          )}
                          value={newApp.gcnNumber || ''}
                          onChange={(e) => setNewApp({...newApp, gcnNumber: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Ngày tiếp nhận <span className="text-rose-500">*</span></label>
                      <div className="relative group">
                        <Clock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                          type="date" 
                          className={cn(
                            "w-full pl-10 pr-4 py-3 border rounded-2xl text-sm focus:ring-2 transition-all outline-none",
                            theme === 'light' ? "bg-white border-slate-200 text-slate-900 focus:bg-white" : "bg-slate-900 border-slate-800 text-slate-200",
                            formErrors.receivedDate ? "border-rose-500 ring-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]" : "focus:ring-emerald-500/20"
                          )}
                          value={newApp.receivedDate || ''}
                          onChange={(e) => setNewApp({...newApp, receivedDate: e.target.value})}
                        />
                      </div>
                      {formErrors.receivedDate && <p className="text-[10px] text-rose-500 font-bold pl-1 italic">{formErrors.receivedDate}</p>}
                    </div>
                  </div>
                </div>

                {/* Section 2: Phân loại tài sản */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-4 bg-amber-500 rounded-full"></div>
                    <h4 className={cn("text-[10px] font-black uppercase tracking-[0.2em]", theme === 'light' ? "text-slate-600" : "text-slate-400")}>Phân loại tài sản</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Loại hình</label>
                       <div className={cn(
                         "flex p-1.5 rounded-2xl border",
                         theme === 'light' ? "bg-slate-100 border-slate-200" : "bg-slate-950 border-slate-800"
                       )}>
                         <button 
                           type="button" 
                           onClick={() => setNewApp({...newApp, propertyType: 'Dat_Nen'})}
                           className={cn(
                             "flex-1 py-2 text-[9px] font-black uppercase rounded-xl transition-all",
                             newApp.propertyType === 'Dat_Nen' 
                               ? (theme === 'light' ? "bg-white text-slate-900 shadow-md" : "bg-slate-800 text-white shadow-lg") 
                               : "text-slate-500 hover:text-slate-700"
                           )}
                         >Đất nền</button>
                         <button 
                           type="button" 
                           onClick={() => setNewApp({...newApp, propertyType: 'Can_Ho'})}
                           className={cn(
                             "flex-1 py-2 text-[9px] font-black uppercase rounded-xl transition-all",
                             newApp.propertyType === 'Can_Ho' 
                               ? (theme === 'light' ? "bg-white text-slate-900 shadow-md" : "bg-slate-800 text-white shadow-lg") 
                               : "text-slate-500 hover:text-slate-700"
                           )}
                         >Căn hộ</button>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Sử dụng gói vay</label>
                       <div className={cn(
                         "flex p-1.5 rounded-2xl border",
                         theme === 'light' ? "bg-slate-100 border-slate-200" : "bg-slate-950 border-slate-800"
                       )}>
                         <button 
                           type="button" 
                           onClick={() => setNewApp({...newApp, loanStatus: 'Co_Vay'})}
                           className={cn(
                             "flex-1 py-2 text-[9px] font-black uppercase rounded-xl transition-all",
                             newApp.loanStatus === 'Co_Vay' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-500 hover:text-indigo-600"
                           )}
                         >Có vay</button>
                         <button 
                           type="button" 
                           onClick={() => setNewApp({...newApp, loanStatus: 'Khong_Vay'})}
                           className={cn(
                             "flex-1 py-2 text-[9px] font-black uppercase rounded-xl transition-all",
                             newApp.loanStatus === 'Khong_Vay' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-500 hover:text-indigo-600"
                           )}
                         >Không vay</button>
                       </div>
                    </div>

                    {newApp.propertyType === 'Can_Ho' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-1.5 flex-1 col-span-2 pt-2 overflow-hidden"
                      >
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Ngày bàn giao căn hộ thực tế (Bắt buộc đối với Căn hộ)</label>
                        <div className="relative group">
                          <Clock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
                          <input 
                            type="date" 
                            className={cn(
                              "w-full pl-10 pr-4 py-3 border rounded-2xl text-sm focus:ring-2 transition-all outline-none",
                              theme === 'light' ? "bg-white border-slate-200 text-slate-900" : "bg-slate-900 border-slate-800 text-slate-200",
                              formErrors.handoverApartmentDate ? "border-rose-500 ring-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]" : "focus:ring-indigo-500/20"
                            )}
                            value={newApp.handoverApartmentDate || ''}
                            onChange={(e) => setNewApp({...newApp, handoverApartmentDate: e.target.value})}
                          />
                        </div>
                        {formErrors.handoverApartmentDate && <p className="text-[10px] text-rose-500 font-bold pl-1 italic">{formErrors.handoverApartmentDate}</p>}
                      </motion.div>
                    )}

                    {newApp.loanStatus === 'Co_Vay' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-1.5 flex-1 col-span-2 pt-2"
                      >
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Ngày cam kết hoàn thành (Ngân hàng)</label>
                        <div className="relative group">
                          <Clock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
                          <input 
                            type="date" 
                            className={cn(
                              "w-full pl-10 pr-4 py-3 border rounded-2xl text-sm focus:ring-2 transition-all outline-none",
                              theme === 'light' ? "bg-white border-slate-200 text-slate-900 focus:ring-indigo-500/20" : "bg-slate-900 border-slate-800 text-slate-200 focus:ring-indigo-500/20"
                            )}
                            value={newApp.commitmentDate}
                            onChange={(e) => setNewApp({...newApp, commitmentDate: e.target.value})}
                          />
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Section 3: Quy trình */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
                    <h4 className={cn("text-[10px] font-black uppercase tracking-[0.2em]", theme === 'light' ? "text-slate-600" : "text-slate-400")}>Cài đặt hình thức</h4>
                  </div>

                  <div className="flex gap-6">
                    <div className="flex-1">
                      <button 
                        onClick={() => setNewApp({...newApp, isSelfService: !newApp.isSelfService})}
                        className={cn(
                          "w-full py-4 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-3",
                          newApp.isSelfService 
                            ? "bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-600/20" 
                            : (theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100" : "bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-400")
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center transition-all",
                          newApp.isSelfService 
                            ? "bg-white border-white" 
                            : (theme === 'light' ? "border-slate-300" : "border-slate-800")
                        )}>
                          {newApp.isSelfService && <Check size={12} className="text-amber-600" />}
                        </div>
                        Khách tự làm sổ (Self-service)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className={cn(
                "p-8 border-t flex gap-4",
                theme === 'light' ? "border-slate-100 bg-slate-50/50" : "border-slate-850 bg-slate-900/50"
              )}>
                <button 
                  disabled={isSavingApp}
                  onClick={() => setIsCreateModalOpen(false)}
                  className={cn(
                    "flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50",
                    theme === 'light' ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  )}
                >
                  Hủy bỏ
                </button>
                <button 
                  disabled={isSavingApp}
                  onClick={handleSubmit}
                  className="flex-1 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-emerald-400 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:scale-100"
                >
                  {isSavingApp ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    'Khởi tạo hồ sơ'
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
</>
  );
};
