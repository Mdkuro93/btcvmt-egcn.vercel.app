import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save } from 'lucide-react';

export interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  passwordForm: {
    newPassword?: string;
    confirmPassword?: string;
  };
  onChangePasswordForm: (form: { newPassword: string; confirmPassword: string }) => void;
  isSaving: boolean;
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
  onConfirm,
  passwordForm,
  onChangePasswordForm,
  isSaving,
}: ChangePasswordModalProps) {
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
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black text-white font-serif italic tracking-tight">
                  Đổi mật khẩu
                </h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                  Cập nhật mật khẩu bảo mật hệ thống
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-500 hover:text-white transition-colors animate-none"
                id="change-password-modal-close-btn"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-700"
                  placeholder="••••••••"
                  value={passwordForm.newPassword || ''}
                  onChange={(e) =>
                    onChangePasswordForm({
                      newPassword: e.target.value,
                      confirmPassword: passwordForm.confirmPassword || '',
                    })
                  }
                  id="change-password-new-input"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-700"
                  placeholder="••••••••"
                  value={passwordForm.confirmPassword || ''}
                  onChange={(e) =>
                    onChangePasswordForm({
                      newPassword: passwordForm.newPassword || '',
                      confirmPassword: e.target.value,
                    })
                  }
                  id="change-password-confirm-input"
                />
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-all"
                id="change-password-modal-cancel-btn"
              >
                Hủy bỏ
              </button>
              <button
                onClick={onConfirm}
                disabled={isSaving}
                className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold shadow-xl shadow-indigo-600/20 transition-all font-serif italic flex items-center justify-center gap-2"
                id="change-password-modal-submit-btn"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                Cập nhật mật khẩu
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
