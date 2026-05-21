import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { IssueType, IssueSeverity } from '../../types';

export interface BulkIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedCount: number;
  unitCodes: string[];
  note: string;
  onChangeNote: (v: string) => void;
  issueType: IssueType;
  onChangeIssueType: (v: IssueType) => void;
  severity: IssueSeverity;
  onChangeSeverity: (v: IssueSeverity) => void;
  theme: 'light' | 'dark';
}

export default function BulkIssueModal({
  isOpen,
  onClose,
  onConfirm,
  selectedCount,
  unitCodes,
  note,
  onChangeNote,
  issueType,
  onChangeIssueType,
  severity,
  onChangeSeverity,
  theme,
}: BulkIssueModalProps) {
  if (!isOpen) return null;

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
          "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl z-[70] rounded-[2.5rem] shadow-2xl border p-8 max-h-[90vh] overflow-y-auto custom-scrollbar",
          theme === 'dark' ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
        )}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight mb-1 text-rose-500">Báo cáo sai sót hàng loạt</h2>
            <p className={cn("text-xs font-medium", theme === 'dark' ? "text-slate-400" : "text-slate-500")}>
              Ghi nhận vướng mắc cho {selectedCount} hồ sơ đã chọn.
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className={cn("mb-6 p-4 rounded-2xl text-xs font-mono max-h-24 overflow-y-auto", theme === 'dark' ? "bg-slate-950 border border-slate-800" : "bg-slate-50 border border-slate-200")}>
          <div className="flex flex-wrap gap-2 text-slate-400">
            {unitCodes.join(", ")}
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Phân loại lỗi</label>
              <select
                value={issueType}
                onChange={(e) => onChangeIssueType(e.target.value as IssueType)}
                className={cn(
                  "w-full px-4 py-3 rounded-2xl text-sm font-bold border outline-none focus:ring-2 focus:ring-rose-500/20 transition-all",
                  theme === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                )}
              >
                <option value="None">None</option>
                <option value="Sai sót nội bộ">Sai sót nội bộ</option>
                <option value="Sai sót khách hàng">Sai sót khách hàng</option>
                <option value="Sai sót cơ quan nhà nước">Sai sót cơ quan nhà nước</option>
                <option value="Sai sót chủ đầu tư">Sai sót chủ đầu tư</option>
                <option value="Sai sót Khác">Sai sót Khác</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Mức độ nghiêm trọng</label>
            <div className="flex gap-2">
              {(['Nghiêm trọng', 'Cao', 'Trung bình', 'Thấp'] as IssueSeverity[]).map((s) => (
                <button
                  key={`severity-${s}`}
                  type="button"
                  onClick={() => onChangeSeverity(s)}
                  className={cn(
                    "flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all",
                    severity === s
                      ? (s === 'Nghiêm trọng' ? "bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-900/20" :
                         s === 'Cao' ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-900/20" :
                         s === 'Trung bình' ? "bg-amber-400 border-amber-400 text-slate-900 shadow-lg shadow-amber-900/20" :
                         "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-900/20")
                      : (theme === 'dark' ? "bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600" : "bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300")
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nội dung vướng mắc (Bắt buộc)</label>
            <textarea
              value={note}
              onChange={(e) => onChangeNote(e.target.value)}
              placeholder="Mô tả chi tiết vướng mắc, sai sót là gì..."
              className={cn(
                "w-full px-6 py-4 rounded-3xl text-sm font-bold border outline-none focus:ring-2 focus:ring-rose-500/20 transition-all min-h-[120px] resize-none",
                theme === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
              )}
            />
          </div>
        </div>

        <div className="flex gap-4 mt-8">
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
            disabled={!note.trim()}
            onClick={onConfirm}
            className={cn(
              "flex-1 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
              !note.trim()
                ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                : "bg-rose-600 text-white hover:bg-rose-500 shadow-xl shadow-rose-900/40"
            )}
          >
            Ghi nhận sai sót <AlertTriangle size={14} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
