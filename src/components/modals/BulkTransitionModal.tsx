import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, Calendar, BookOpen, ArrowRight, AlertCircle, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface BulkTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedCount: number;
  unitCodes: string[];
  targetStepLabel: string;
  updateField: { key: string; label: string; isRequired?: boolean } | null;
  value: string;
  onChangeValue: (v: string) => void;
  location?: 'PHUONG' | 'TP_DANANG';
  onChangeLocation?: (v: 'PHUONG' | 'TP_DANANG') => void;
  refCode?: string;
  onChangeRefCode?: (v: string) => void;
  theme: 'light' | 'dark';
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  dateError?: string | null;
}

export default function BulkTransitionModal({
  isOpen,
  onClose,
  onConfirm,
  selectedCount,
  unitCodes,
  targetStepLabel,
  updateField,
  value,
  onChangeValue,
  location,
  onChangeLocation,
  refCode,
  onChangeRefCode,
  theme,
  showToast,
  dateError,
}: BulkTransitionModalProps) {
  if (!isOpen) return null;

  const isDateWarning = dateError?.startsWith('⚠️');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className={cn(
          "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-[70] rounded-[2.5rem] shadow-2xl border p-8 max-h-[90vh] overflow-y-auto custom-scrollbar",
          theme === 'dark' ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
        )}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight mb-1">Xác nhận chuyển bước</h2>
            <p className={cn("text-xs font-medium", theme === 'dark' ? "text-slate-400" : "text-slate-500")}>
              Bạn đang thực hiện thao tác hàng loạt cho {selectedCount} hồ sơ.
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className={cn("mb-6 p-4 rounded-2xl text-xs font-mono max-h-32 overflow-y-auto", theme === 'dark' ? "bg-slate-950 border border-slate-800" : "bg-slate-50 border border-slate-200")}>
          <div className="font-bold mb-2 uppercase tracking-wider text-xs text-indigo-500">Danh sách mã căn:</div>
          <div className="flex flex-wrap gap-2 text-slate-400">
            {unitCodes.join(", ")}
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-indigo-500/5 border border-indigo-500/10">
            <label className="block text-xs font-bold uppercase tracking-wider text-indigo-500 mb-2">Chuyển sang giai đoạn</label>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500 text-white rounded-lg">
                <ChevronRight size={16} />
              </div>
              <span className="font-bold text-sm uppercase">{targetStepLabel}</span>
            </div>
          </div>

          <div className="space-y-4">
            {updateField && (
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">
                  {updateField.label} {updateField.isRequired !== false ? '(Bắt buộc)' : '(Không bắt buộc)'}
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Calendar size={18} />
                  </div>
                  <input
                    type="date"
                    value={value}
                    max={(updateField?.key === 'bankCommitmentDeadline' || updateField?.key === 'commitmentDate') ? undefined : new Date().toISOString().split('T')[0]}
                    onChange={(e) => onChangeValue(e.target.value)}
                    className={cn(
                      "w-full pl-12 pr-4 py-4 rounded-3xl text-sm font-bold border outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all",
                      theme === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    )}
                  />
                </div>
              </div>
            )}

            {dateError && (
              <div className={cn(
                "p-4 rounded-3xl border text-xs flex items-start gap-2.5 font-bold leading-relaxed",
                isDateWarning 
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-500" 
                  : "bg-rose-500/10 border-rose-500/20 text-rose-500"
              )}>
                {isDateWarning ? <AlertTriangle size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
                <span className="flex-1">{dateError}</span>
              </div>
            )}

            {targetStepLabel?.toUpperCase().includes('2. TIẾP NHẬN') && (
              <div className={cn("space-y-3 p-4 rounded-2xl border", theme === 'dark' ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200")}>
                <label className={cn("block text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2", theme === 'dark' ? "text-amber-500" : "text-amber-700")}>
                  <BookOpen size={14} /> Danh mục hồ sơ gốc tham khảo
                </label>
                <div className={cn("space-y-3 text-xs font-medium", theme === 'dark' ? "text-slate-300" : "text-slate-700")}>
                  <p className="italic text-xs opacity-70 mb-2 underline decoration-amber-500/30">Danh sách các hồ sơ cần chuẩn bị:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>HĐMB/HĐCN Gốc</li>
                    <li>Văn bản chuyển nhượng</li>
                    <li>Lệ phí trước bạ</li>
                    <li>Sổ hộ khẩu/CCCD/ĐKKD</li>
                    <li>Các biên bản liên quan (Bàn giao, Quyết toán...)</li>
                  </ul>
                </div>
              </div>
            )}

            {(targetStepLabel?.toUpperCase().includes('B3:') || 
              targetStepLabel?.toUpperCase().includes('B4:') ||
              targetStepLabel?.toUpperCase().includes('GĐ2:') || 
              targetStepLabel?.toUpperCase().includes('GD2:') || 
              targetStepLabel?.toUpperCase().includes('GĐ3:') || 
              targetStepLabel?.toUpperCase().includes('GD3:') ||
              targetStepLabel?.toUpperCase().includes('NỘP VPĐK') || 
              targetStepLabel?.toUpperCase().includes('NOP VPDK') ||
              targetStepLabel?.toUpperCase().includes('THÔNG BÁO THUẾ') ||
              targetStepLabel?.toUpperCase().includes('THONG BAO THUE')) && (
              <>
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">
                    Nơi nộp hồ sơ (Bắt buộc)
                  </label>
                  <select
                    value={location}
                    onChange={(e) => onChangeLocation?.(e.target.value as 'PHUONG' | 'TP_DANANG')}
                    className={cn(
                      "w-full px-4 py-4 rounded-3xl text-sm font-bold border outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all",
                      theme === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    )}
                  >
                    <option value="PHUONG">Phường/Xã</option>
                    <option value="TP_DANANG">Tỉnh/Thành phố</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">
                    Mã hồ sơ / Số phiếu hẹn (Bắt buộc)
                  </label>
                  <input
                    type="text"
                    value={refCode}
                    onChange={(e) => onChangeRefCode?.(e.target.value)}
                    placeholder="Nhập mã hồ sơ / số phiếu hẹn..."
                    className={cn(
                      "w-full px-6 py-4 rounded-3xl text-sm font-bold border outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all",
                      theme === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    )}
                  />
                </div>
              </>
            )}
          </div>

          <p className="text-[10px] text-slate-400 italic ml-1">
            * Thông tin này sẽ được áp dụng cho toàn bộ {selectedCount} hồ sơ đã chọn.
          </p>
        </div>

        <div className="flex gap-4 mt-10">
          <button
            onClick={onClose}
            className={cn(
              "flex-1 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest border transition-all",
              theme === 'dark' ? "border-slate-800 text-slate-500 hover:bg-slate-800" : "border-slate-200 text-slate-500 hover:bg-slate-100"
            )}
          >
            Hủy bỏ
          </button>
          <button
            disabled={
              (updateField?.isRequired !== false && updateField && !value) || 
              (dateError && !isDateWarning) || false
            }
            onClick={() => {
              onConfirm();
            }}
            className={cn(
              "flex-1 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
              ((updateField && !value) || (dateError && !isDateWarning))
                ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-900/40"
            )}
          >
            Xác nhận & Chuyển <ArrowRight size={14} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
