import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowLeft } from 'lucide-react';
import { cn } from '../../lib/utils';
import { StepName } from '../../types';

export interface BulkRejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (targetStepId: StepName, reason: string) => void;
  selectedCount: number;
  unitCodes: string[];
  availableSteps: { value: StepName; label: string }[];
  theme: 'light' | 'dark';
}

export default function BulkRejectModal({
  isOpen, onClose, onConfirm, selectedCount, unitCodes, availableSteps, theme
}: BulkRejectModalProps) {
  const [targetStep, setTargetStep] = React.useState<StepName | ''>('');
  const [reason, setReason] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      setTargetStep(availableSteps[0]?.value || '');
      setReason('');
    }
  }, [isOpen, availableSteps]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className={cn(
          "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-[70] rounded-[2.5rem] shadow-2xl border p-8",
          theme === 'dark' ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
        )}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight mb-1">Trả về hàng loạt</h2>
            <p className={cn("text-xs font-medium", theme === 'dark' ? "text-slate-400" : "text-slate-500")}>
              Bạn đang trả về {selectedCount} hồ sơ.
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className={cn("mb-6 p-4 rounded-2xl text-xs font-mono max-h-32 overflow-y-auto", theme === 'dark' ? "bg-slate-950 border border-slate-800" : "bg-slate-50 border border-slate-200")}>
          <div className="font-bold mb-2 uppercase tracking-wider text-xs text-indigo-500">Danh sách mã căn:</div>
          <div className="flex flex-wrap gap-2 text-slate-400 text-[13px] font-bold">
            {unitCodes.length > 0 ? unitCodes.join(", ") : "(Không có dữ liệu mã căn)"}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Trả về bước (Bắt buộc)
            </label>
            <select
              value={targetStep}
              onChange={(e) => setTargetStep(e.target.value as StepName)}
              className={cn(
                "w-full px-4 py-4 rounded-3xl text-sm font-bold border outline-none focus:ring-2 focus:ring-indigo-500/20",
                theme === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
              )}
            >
              {availableSteps.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-1 italic">
              Chỉ hiện các bước trước bước hiện tại của hồ sơ đầu tiên trong danh sách đã chọn.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Lý do trả về (Bắt buộc)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Nhập lý do trả hồ sơ..."
              className={cn(
                "w-full px-4 py-3 rounded-3xl text-sm font-medium border outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none",
                theme === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
              )}
            />
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            onClick={onClose}
            className={cn(
              "flex-1 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest border",
              theme === 'dark' ? "border-slate-800 text-slate-500 hover:bg-slate-800" : "border-slate-200 text-slate-500 hover:bg-slate-100"
            )}
          >
            Hủy bỏ
          </button>
          <button
            disabled={!targetStep || !reason.trim()}
            onClick={() => targetStep && onConfirm(targetStep as StepName, reason)}
            className={cn(
              "flex-1 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2",
              (!targetStep || !reason.trim())
                ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                : "bg-rose-600 text-white hover:bg-rose-500"
            )}
          >
            <ArrowLeft size={14} /> Xác nhận trả về
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
