import React from 'react';
import { motion } from 'motion/react';
import { Camera, FileText, Download, X, GitMerge, Eye } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ScannedFile } from '../../types';

export interface FilePreviewModalProps {
  file: ScannedFile;
  onClose: () => void;
  theme: 'light' | 'dark';
}

export default function FilePreviewModal({
  file,
  onClose,
  theme,
}: FilePreviewModalProps) {
  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf';

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-0 sm:p-4 bg-slate-950/90 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className={cn(
          "w-full h-full sm:h-[90vh] sm:max-w-5xl sm:rounded-[2.5rem] border overflow-hidden flex flex-col shadow-2xl relative",
          theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"
        )}
      >
        <div className="p-4 sm:p-6 border-b border-slate-800/10 flex items-center justify-between bg-slate-900/50 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              {isImage ? <Camera size={24} /> : <FileText size={24} />}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black text-white truncate max-w-[150px] sm:max-w-md">
                {file.name}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {file.uploadDate}
                </span>
                {file.isShared && (
                  <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg flex items-center gap-1">
                    <GitMerge size={10} /> [🔗 Tài liệu chung]
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={file.url}
              download={file.name}
              target="_blank"
              rel="noreferrer"
              className="p-3 rounded-2xl bg-slate-800 text-slate-400 hover:text-white transition-all flex items-center gap-2"
              title="Tải về"
            >
              <Download size={20} />
              <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Tải về</span>
            </a>
            <button
              onClick={onClose}
              className="p-3 rounded-2xl bg-slate-800 text-slate-400 hover:text-white transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-slate-950 flex items-center justify-center relative group">
          {isImage ? (
            <div className="w-full h-full flex items-center justify-center overflow-hidden">
              <motion.img
                src={file.url}
                alt={file.name}
                className="max-w-full max-h-full object-contain cursor-zoom-in"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                drag
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragElastic={0.1}
                referrerPolicy="no-referrer"
              />
            </div>
          ) : isPdf ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 relative">
              <iframe
                src={file.url}
                className="w-full h-full border-none z-10"
                title={file.name}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-slate-950/80 z-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                  Preview Mode enabled
                </p>
                <a
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  className="pointer-events-auto inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-full font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-indigo-600/40"
                >
                  <Eye size={16} /> Mở trong tab mới
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center p-12">
              <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-700">
                <FileText size={48} />
              </div>
              <p className="text-slate-400 font-bold mb-6">
                Định dạng tập tin này không hỗ trợ xem trực tuyến.
              </p>
              <a
                href={file.url}
                className="inline-flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 transition-all"
              >
                <Download size={18} /> Tải xuống tập tin
              </a>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
