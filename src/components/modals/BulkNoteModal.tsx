import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

export interface BulkNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedCount: number;
  bulkNoteText: string;
  onChangeBulkNoteText: (text: string) => void;
}

export default function BulkNoteModal({
  isOpen,
  onClose,
  onConfirm,
  selectedCount,
  bulkNoteText,
  onChangeBulkNoteText,
}: BulkNoteModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
          >
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/20">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Ghi chú hàng loạt ({selectedCount})
              </h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                id="bulk-note-modal-close-btn"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-[10px] text-slate-500 font-bold uppercase mb-3 tracking-widest pl-1">
                Nội dung ghi chú mới
              </p>
              <textarea
                autoFocus
                className="w-full h-32 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none dark:text-slate-200"
                placeholder="Nhập nội dung ghi chú cho tất cả hồ sơ đã chọn..."
                value={bulkNoteText}
                onChange={(e) => onChangeBulkNoteText(e.target.value)}
                id="bulk-note-modal-textarea"
              />
              <div className="mt-6 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-800"
                  id="bulk-note-modal-cancel-btn"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={onConfirm}
                  disabled={!bulkNoteText.trim()}
                  className="flex-[2] py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20"
                  id="bulk-note-modal-submit-btn"
                >
                  Cập nhật ngay
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
