import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { 
  Files, CheckCircle2, Upload, FileSpreadsheet, Download, HelpCircle 
} from 'lucide-react';

export const ResourcesTab = ({
  activeTab,
  theme,
  userRole,
  handleDownloadTemplate,
  DOC_CHECKLIST_ITEMS
}: any) => {

  return (
<>
            {activeTab === 'resources' && (
              <motion.div 
                key="resources"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="max-w-6xl mx-auto space-y-12 pb-20 text-left"
              >
                <div className="relative p-12 rounded-[3.5rem] bg-indigo-600 overflow-hidden shadow-2xl">
                   <div className="absolute top-0 right-0 p-12 opacity-10">
                      <Files size={120} />
                   </div>
                   <div className="relative z-10 text-left space-y-4">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white/80 mb-2">
                        <CheckCircle2 size={12} /> Resource Center
                      </div>
                      <h2 className="text-xl font-black text-white font-serif italic tracking-tight">Tra cứu & Biểu mẫu</h2>
                      <p className="text-sm text-indigo-100 font-medium max-w-xl">Trung tâm tài nguyên tập trung dành cho Chuyên viên và Lãnh đạo. Tải xuống các biểu mẫu chuẩn hoặc cập nhật tài liệu mới nhất lên hệ thống.</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className={cn(
                    "backdrop-blur-md p-10 rounded-[3rem] border shadow-2xl transition-all",
                    theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900/40 border-slate-800/50"
                  )}>
                    <div className="flex items-center gap-5 mb-10">
                      <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <CheckCircle2 size={28} className="text-white" />
                      </div>
                      <div>
                        <h3 className={cn("text-2xl font-black font-serif italic tracking-tight", theme === 'light' ? "text-slate-900" : "text-white")}>Checklist Hồ sơ chuẩn</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Quy định bắt buộc chuẩn bị hồ sơ</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {DOC_CHECKLIST_ITEMS.map((item, idx) => (
                        <div key={`${item}-${idx}`} className={cn(
                          "flex items-center gap-4 p-5 rounded-2xl border transition-all group",
                          theme === 'light' ? "bg-slate-50 border-slate-100 hover:border-amber-200" : "bg-slate-950/30 border-slate-800/30 hover:border-amber-500/30"
                        )}>
                          <div className={cn(
                            "w-8 h-8 rounded-full border flex items-center justify-center text-[12px] font-black transition-all",
                            theme === 'light' ? "bg-white border-slate-200 text-slate-400 group-hover:text-amber-500" : "bg-slate-900 border-slate-800 text-slate-600 group-hover:text-amber-500"
                          )}>
                            {idx + 1}
                          </div>
                          <span className={cn("text-sm font-bold", theme === 'light' ? "text-slate-700" : "text-slate-300")}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-10">
                    <div className={cn(
                      "backdrop-blur-md p-10 rounded-[3rem] border shadow-2xl transition-all",
                      theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900/40 border-slate-800/50"
                    )}>
                      <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Files size={28} className="text-white" />
                          </div>
                          <div>
                            <h3 className={cn("text-2xl font-black font-serif italic tracking-tight", theme === 'light' ? "text-slate-900" : "text-white")}>Biểu mẫu & Dữ liệu</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Tài liệu số & Export</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 mb-8">
                        {(userRole === 'ADMIN' || userRole === 'KT') && (
                          <button 
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.onchange = (e: any) => {
                                const file = e.target.files[0];
                                if (file) alert(`Hệ thống đã nhận biểu mẫu: ${file.name}. Đang xử lý tải lên...`);
                              };
                              input.click();
                            }}
                            className="flex-1 px-4 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
                          >
                            <Upload size={16} /> Tải biểu mẫu mới
                          </button>
                        )}
                        {userRole === 'ADMIN' && (
                          <button 
                            onClick={() => handleDownloadTemplate('all_filtered')}
                            className="px-4 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 hover:bg-slate-50 transition-all font-bold"
                            title="Tải toàn bộ dữ liệu hồ sơ"
                          >
                            <FileSpreadsheet size={16} /> Data Export
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {[
                          { name: 'Mẫu 09/ĐK - Đơn đăng ký biến động', format: 'DOCX', size: '45KB' },
                          { name: 'Tờ khai lệ phí trước bạ nhà đất', format: 'PDF', size: '120KB' },
                          { name: 'Tờ khai thuế thu nhập cá nhân', format: 'PDF', size: '115KB' },
                          { name: 'Mẫu giấy ủy quyền nộp HS', format: 'DOCX', size: '32KB' }
                        ].map((doc, idx) => (
                          <button key={`resource-doc-${idx}`} className={cn(
                            "w-full flex items-center justify-between p-4 rounded-2xl border transition-all",
                            theme === 'light' ? "bg-slate-50 border-slate-100 hover:bg-slate-100" : "bg-slate-950/30 border-slate-800/30 hover:bg-slate-800/30"
                          )}>
                            <div className="flex items-center gap-3">
                              <div className={cn("text-[10px] font-black px-2 py-1 rounded-md", theme === 'light' ? "bg-slate-200 text-slate-600" : "bg-slate-800 text-slate-400")}>{doc.format}</div>
                              <span className={cn("text-sm font-medium", theme === 'light' ? "text-slate-700" : "text-slate-300")}>{doc.name}</span>
                            </div>
                            <Download size={16} className="text-slate-600" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={cn(
                      "backdrop-blur-md p-8 rounded-[2.5rem] border shadow-2xl flex items-center gap-6",
                      theme === 'light' ? "bg-white border-slate-200" : "bg-indigo-600/10 border-indigo-500/20"
                    )}>
                      <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-600/30 flex-shrink-0">
                        <HelpCircle size={32} className="text-white" />
                      </div>
                      <div>
                        <h3 className={cn("text-lg font-bold font-serif italic", theme === 'light' ? "text-slate-900" : "text-white")}>Cần hỗ trợ?</h3>
                        <p className={cn("text-xs leading-relaxed mt-1", theme === 'light' ? "text-slate-500" : "text-slate-400")}>Liên hệ phòng Công nghệ để được hướng dẫn sử dụng hoặc điều chỉnh phân quyền tài khoản của bạn.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
</>
  );
};
