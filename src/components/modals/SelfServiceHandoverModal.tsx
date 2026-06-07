import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Check } from 'lucide-react';
import { Application } from '../../types';

export interface SelfServiceHandoverModalProps {
  isOpen: boolean;
  app: Application | null;
  onConfirm: (customerHandoverDate: string) => void;
  onClose: () => void;
}

export default function SelfServiceHandoverModal({
  isOpen,
  app,
  onConfirm,
  onClose,
}: SelfServiceHandoverModalProps) {
  const [handoverDate, setHandoverDate] = useState('');

  // Set default value as today when modal opens
  useEffect(() => {
    if (isOpen) {
      setHandoverDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen]);

  if (!app) return null;

  const today = new Date();
  const maxDateObj = new Date();
  maxDateObj.setDate(today.getDate() + 30);
  const maxDateStr = maxDateObj.toISOString().split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverDate) return;
    onConfirm(handoverDate);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-md bg-slate-900 rounded-[2.5rem] p-8 border border-slate-700 shadow-2xl"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex gap-3 items-center">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
                  <Calendar size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white font-serif italic tracking-tight leading-tight">
                    Hoàn tất hồ sơ Khách tự làm sổ
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                    Cập nhật ngày bàn giao GCN
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-500 hover:text-white transition-colors cursor-pointer"
                id="self-service-handover-modal-close-btn"
              >
                <X size={20} />
              </button>
            </div>

            {/* Application Mini Info & Badge */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 mb-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  Thông tin căn hộ
                </span>
                <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Khách tự làm sổ
                </span>
              </div>
              <div>
                <div className="text-lg font-bold text-white tracking-tight">
                  {app.unitCode}
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  Khách hàng: {app.customerName || 'N/A'}
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                  Ngày bàn giao GCN cho khách <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  className="w-full bg-slate-950 border border-slate-850 rounded-2xl px-5 py-4 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  value={handoverDate}
                  max={maxDateStr}
                  onChange={(e) => setHandoverDate(e.target.value)}
                  id="self-service-handover-date-input"
                />
                <p className="text-[11px] text-slate-500 leading-relaxed pl-1">
                  Hồ sơ sẽ được chuyển thẳng về trạng thái Hoàn Tất sau khi xác nhận.
                </p>
              </div>

              {/* Actions Footer */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-all text-sm uppercase tracking-wider"
                  id="self-service-handover-modal-cancel-btn"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={!handoverDate}
                  className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold shadow-xl shadow-indigo-600/20 transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2"
                  id="self-service-handover-modal-submit-btn"
                >
                  <Check size={16} />
                  Xác nhận hoàn tất
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
