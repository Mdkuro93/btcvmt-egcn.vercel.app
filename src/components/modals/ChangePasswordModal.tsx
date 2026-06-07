import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save } from 'lucide-react';

export interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  passwordForm: {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  };
  onChangePasswordForm: (form: { currentPassword: string; newPassword: string; confirmPassword: string }) => void;
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
  const [error, setError] = useState('');

  // Reset error when form inputs or open state changes
  useEffect(() => {
    setError('');
  }, [passwordForm.currentPassword, passwordForm.newPassword, passwordForm.confirmPassword, isOpen]);

  const handleConfirmClick = () => {
    const current = (passwordForm.currentPassword || '').trim();
    const newPass = (passwordForm.newPassword || '').trim();
    const confirm = (passwordForm.confirmPassword || '').trim();

    if (!current) {
      setError("Vui lòng nhập mật khẩu hiện tại");
      return;
    }
    if (newPass.length < 8) {
      setError("Mật khẩu mới phải có ít nhất 8 ký tự");
      return;
    }
    if (newPass === current) {
      setError("Mật khẩu mới phải khác mật khẩu hiện tại");
      return;
    }
    if (newPass !== confirm) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    setError('');
    onConfirm();
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return null;
    if (password.length < 8) {
      return { level: 'weak', label: 'Yếu', color: 'bg-rose-500', width: 'w-1/3' };
    }
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasDigitOrSpecial = /[\d\W]/.test(password);

    if (hasLetter && hasDigitOrSpecial) {
      return { level: 'strong', label: 'Mạnh', color: 'bg-emerald-500', width: 'w-full' };
    } else {
      return { level: 'medium', label: 'Trung bình', color: 'bg-amber-500', width: 'w-2/3' };
    }
  };

  const strength = getPasswordStrength(passwordForm.newPassword || '');

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
                className="p-2 text-slate-500 hover:text-white transition-colors animate-none cursor-pointer"
                id="change-password-modal-close-btn"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Mật khẩu hiện tại */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                  Mật khẩu hiện tại <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-700"
                  placeholder="••••••••"
                  value={passwordForm.currentPassword || ''}
                  onChange={(e) =>
                    onChangePasswordForm({
                      currentPassword: e.target.value,
                      newPassword: passwordForm.newPassword || '',
                      confirmPassword: passwordForm.confirmPassword || '',
                    })
                  }
                  id="change-password-current-input"
                />
              </div>

              {/* Mật khẩu mới */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                  Mật khẩu mới <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-700"
                  placeholder="••••••••"
                  value={passwordForm.newPassword || ''}
                  onChange={(e) =>
                    onChangePasswordForm({
                      currentPassword: passwordForm.currentPassword || '',
                      newPassword: e.target.value,
                      confirmPassword: passwordForm.confirmPassword || '',
                    })
                  }
                  id="change-password-new-input"
                />

                {/* Password Strength Indicator */}
                {strength && (
                  <div className="mt-2 space-y-1.5 px-1 py-0.5">
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div className={`h-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Độ mạnh mật khẩu</span>
                      <span className={`text-[10px] font-black uppercase tracking-wider ${
                        strength.level === 'weak' ? 'text-rose-400' :
                        strength.level === 'medium' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {strength.label}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Xác nhận mật khẩu mới */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                  Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-700"
                  placeholder="••••••••"
                  value={passwordForm.confirmPassword || ''}
                  onChange={(e) =>
                    onChangePasswordForm({
                      currentPassword: passwordForm.currentPassword || '',
                      newPassword: passwordForm.newPassword || '',
                      confirmPassword: e.target.value,
                    })
                  }
                  id="change-password-confirm-input"
                />
              </div>

              {/* Inline Error Message */}
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-4 py-3 rounded-2xl font-bold">
                  {error}
                </div>
              )}
            </div>

            <div className="mt-8 flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-all cursor-pointer"
                id="change-password-modal-cancel-btn"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmClick}
                disabled={isSaving}
                className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold shadow-xl shadow-indigo-600/20 transition-all font-serif italic flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
