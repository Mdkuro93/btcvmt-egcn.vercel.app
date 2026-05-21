import React, { useState } from 'react';
import { X, Upload, GitMerge, RefreshCcw, PlusCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface BulkDocumentModalProps {
  onClose: () => void;
  onUpload: (file: File) => void;
  isUploading: boolean;
  theme: 'light' | 'dark';
}

const BulkDocumentModal = ({
  onClose,
  onUpload,
  isUploading,
  theme
}: BulkDocumentModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "w-full max-w-lg rounded-[2.5rem] border p-8 relative shadow-2xl",
          theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"
        )}
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-xl text-slate-500 hover:bg-slate-500/10 transition-all">
          <X size={20} />
        </button>
        
        <div className="mb-8 text-center pt-4">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-[1.5rem] flex items-center justify-center text-indigo-400 mx-auto mb-4">
            <GitMerge size={32} />
          </div>
          <h2 className="text-xl font-black italic tracking-tight">Cập nhật tài liệu chung</h2>
          <p className="text-xs text-slate-500 mt-2">File này sẽ được liên kết đồng bộ cho tất cả các hồ sơ đã chọn.</p>
        </div>

        <div className="space-y-6">
          <label className="block">
            <div className={cn(
              "border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer group",
              selectedFile ? "border-emerald-500/30 bg-emerald-500/5" : (theme === 'light' ? "border-slate-200 hover:border-indigo-500/30 hover:bg-indigo-500/5" : "border-slate-800 hover:border-indigo-500/30 hover:bg-indigo-500/5")
            )}>
              <Upload className={cn("transition-transform group-hover:-translate-y-1", selectedFile ? "text-emerald-500" : "text-slate-500")} size={32} />
              <div className="text-center">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">{selectedFile ? selectedFile.name : 'Chọn file hoặc chụp ảnh'}</p>
                <p className="text-[10px] text-slate-500 mt-1 font-bold italic">Hệ thống sẽ chỉ lưu 1 bản duy nhất</p>
              </div>
              <input 
                type="file" 
                className="hidden" 
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setSelectedFile(f);
                }} 
              />
            </div>
          </label>

          <div className="flex gap-4 pt-4">
            <button 
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase text-slate-500 hover:bg-slate-500/10 transition-all"
            >
              Hủy
            </button>
            <button 
              disabled={!selectedFile || isUploading}
              onClick={() => selectedFile && onUpload(selectedFile)}
              className={cn(
                "flex-1 py-4 rounded-2xl text-[10px] font-black uppercase shadow-xl transition-all flex items-center justify-center gap-2",
                selectedFile && !isUploading ? "bg-indigo-600 text-white shadow-indigo-600/20 hover:scale-[1.02]" : "bg-slate-800 text-slate-500 cursor-not-allowed"
              )}
            >
              {isUploading ? (
                <>
                  <RefreshCcw size={16} className="animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <PlusCircle size={16} />
                  Gắn tài liệu chung
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BulkDocumentModal;
