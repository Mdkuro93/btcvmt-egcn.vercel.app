import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, AlertCircle, X, CheckCircle2 } from 'lucide-react';
import { Application } from '../../types';
import { cn } from '../../lib/utils';

interface ImportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
  data: {
    toCreate: any[];
    toUpdate: any[];
    warnings: string[];
    errors: string[];
  } | null;
  theme: 'light' | 'dark';
}

const ImportPreviewModal: React.FC<ImportPreviewModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  data,
  theme
}) => {
  if (!isOpen || !data) return null;

  const { toCreate, toUpdate, warnings, errors } = data;
  
  const duplicateFileWarnings = warnings.filter(w => w.includes('File Excel có mã lô trùng'));
  const crossProjectWarnings = warnings.filter(w => w.includes('đã tồn tại tại dự án khác'));
  const otherWarnings = warnings.filter(w => !w.includes('File Excel có mã lô trùng') && !w.includes('đã tồn tại tại dự án khác'));

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className={cn(
          "w-full max-w-2xl rounded-[2rem] shadow-2xl border flex flex-col max-h-[85vh] overflow-hidden",
          theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"
        )}
      >
        <div className={cn(
          "p-6 border-b flex justify-between items-center",
          theme === 'light' ? "border-slate-100 bg-slate-50/50" : "border-slate-800 bg-slate-950/50"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center border",
              errors.length > 0 
                ? "bg-rose-500/10 border-rose-500/20 text-rose-500"
                : warnings.length > 0
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
            )}>
              {errors.length > 0 ? <AlertCircle size={20} /> : warnings.length > 0 ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
            </div>
            <div>
              <h2 className={cn("text-lg font-black uppercase tracking-tight", theme === 'light' ? "text-slate-900" : "text-white")}>
                Xác nhận Import Excel
              </h2>
              <p className={cn("text-xs font-semibold mt-1", theme === 'light' ? "text-slate-500" : "text-slate-400")}>
                Vui lòng kiểm tra dữ liệu trước khi xác nhận lưu.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-500/10 rounded-xl transition-all"
          >
            <X size={20} className={theme === 'light' ? "text-slate-400" : "text-slate-500"} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
             <div className={cn("p-4 rounded-2xl border", theme === 'light' ? "bg-slate-50 border-slate-100" : "bg-slate-800/50 border-slate-700/50")}>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Tạo mới</p>
                <p className={cn("text-2xl font-black", theme === 'light' ? "text-emerald-600" : "text-emerald-400")}>{toCreate.length} <span className="text-sm font-semibold opacity-50">hồ sơ</span></p>
             </div>
             <div className={cn("p-4 rounded-2xl border", theme === 'light' ? "bg-slate-50 border-slate-100" : "bg-slate-800/50 border-slate-700/50")}>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Cập nhật (Ghi đè)</p>
                <p className={cn("text-2xl font-black", theme === 'light' ? "text-indigo-600" : "text-indigo-400")}>{toUpdate.length} <span className="text-sm font-semibold opacity-50">hồ sơ</span></p>
             </div>
          </div>

          {errors.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 shadow-sm">
              <p className="font-semibold text-rose-700 mb-2 flex items-center gap-2">
                <AlertCircle size={16} /> Lỗi không thể Import ({errors.length}):
              </p>
              <ul className="list-disc pl-5 space-y-1">
                {errors.map((e, i) => (
                  <li key={`err-${e.substring(0, 10).replace(/[^a-zA-Z0-9]/g, "")}-${i}`} className="text-rose-600 text-sm font-medium">{e}</li>
                ))}
              </ul>
            </div>
          )}

          {duplicateFileWarnings.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 shadow-sm">
              <p className="font-semibold text-rose-700 mb-2 flex items-center gap-2">
                <AlertCircle size={16} /> Trùng trong file Excel (dòng đầu được giữ lại):
              </p>
              <ul className="space-y-1">
                {duplicateFileWarnings.map((w, i) => (
                  <li key={`dup-${w.substring(0, 10).replace(/[^a-zA-Z0-9]/g, "")}-${i}`} className="text-rose-600 text-sm font-medium">{w}</li>
                ))}
              </ul>
            </div>
          )}

          {crossProjectWarnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
              <p className="font-semibold text-amber-700 mb-2 flex items-center gap-2">
                <AlertTriangle size={16} /> Mã lô đã có ở dự án khác (kiểm tra lại):
              </p>
              <ul className="space-y-1 pl-2 border-l-2 border-amber-300">
                {crossProjectWarnings.map((w, i) => (
                  <li key={`cross-${w.substring(0, 10).replace(/[^a-zA-Z0-9]/g, "")}-${i}`} className="text-amber-700 text-sm font-medium leading-relaxed">{w}</li>
                ))}
              </ul>
            </div>
          )}

          {otherWarnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
              <p className="font-semibold text-amber-700 mb-2 flex items-center gap-2">
                <AlertTriangle size={16} /> Các cảnh báo khác:
              </p>
              <ul className="list-disc pl-5 space-y-1 border-amber-300">
                {otherWarnings.map((w, i) => (
                  <li key={`other-${w.substring(0, 10).replace(/[^a-zA-Z0-9]/g, "")}-${i}`} className="text-amber-700 text-sm font-medium">{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className={cn(
          "p-6 border-t flex justify-end gap-3",
          theme === 'light' ? "border-slate-100 bg-slate-50/50" : "border-slate-800 bg-slate-950/50"
        )}>
          <button
            onClick={onClose}
            className={cn(
              "px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm",
              theme === 'light'
                ? "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                : "bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700"
            )}
          >
            Hủy bỏ
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading || errors.length > 0 || (toCreate.length === 0 && toUpdate.length === 0)}
            className={cn(
              "px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
              errors.length > 0 ? "bg-slate-400" : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20"
            )}
          >
            {isLoading 
              ? 'Đang xử lý...'
              : crossProjectWarnings.length > 0 
                ? `Xác nhận dù có ${crossProjectWarnings.length} cảnh báo`
                : `Xác nhận Import (${toCreate.length + toUpdate.length} hồ sơ)`
            }
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ImportPreviewModal;
