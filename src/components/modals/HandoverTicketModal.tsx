import React from 'react';
import { Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { Application } from '../../types';

interface HandoverTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  app: Application | null;
  theme: 'light' | 'dark';
}

const HandoverTicketModal = ({ 
  isOpen, 
  onClose, 
  app, 
  theme 
}: HandoverTicketModalProps) => {
  if (!app) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
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
              "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] overflow-y-auto z-[70] rounded-[2.5rem] shadow-2xl border print:shadow-none print:border-none print:static print:translate-x-0 print:translate-y-0 print:max-h-none",
              theme === 'dark' ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
            )}
          >
            <div className="p-8 md:p-12 space-y-8 print:p-0">
               <div className="flex justify-between items-start border-b pb-6 border-slate-200/20 print:border-slate-800">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black font-serif italic tracking-tight text-festive-gold">BIÊN BẢN BÀN GIAO</h2>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Giấy chứng nhận Quyền sử dụng đất</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] font-mono opacity-60">Số: {app.unitCode}/{new Date().getFullYear()}/BBBG</p>
                    <p className="text-[10px] font-mono opacity-60">{new Date().toLocaleDateString('vi-VN')}</p>
                  </div>
               </div>

               <div className="space-y-6">
                 <div>
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-3 border-b border-indigo-500/10 pb-1">BÊN GIAO (PHÒNG THỦ TỤC - PTT)</h3>
                   <div className="grid grid-cols-2 gap-4 text-xs">
                     <div>
                       <p className="opacity-50 mb-0.5">Họ và tên người giao:</p>
                       <p className="font-bold">Ban QL Dự án {app.projectName}</p>
                     </div>
                     <div>
                       <p className="opacity-50 mb-0.5">Bộ phận:</p>
                       <p className="font-bold">Phòng Thủ tục hồ sơ</p>
                     </div>
                   </div>
                 </div>

                 <div>
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-3 border-b border-emerald-500/10 pb-1">BÊN NHẬN (KHÁCH HÀNG)</h3>
                   <div className="grid grid-cols-2 gap-4 text-xs">
                     <div>
                       <p className="opacity-50 mb-0.5">Họ và tên:</p>
                       <p className="font-bold">{app.customerName}</p>
                     </div>
                     <div>
                       <p className="opacity-50 mb-0.5">Số điện thoại:</p>
                       <p className="font-bold">{app.phoneNumber || '---'}</p>
                     </div>
                     <div className="col-span-2">
                       <p className="opacity-50 mb-0.5">Mã sản phẩm / Lô căn:</p>
                       <p className="font-bold text-lg">{app.unitCode} - Dự án {app.projectName}</p>
                     </div>
                   </div>
                 </div>

                 <div>
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 border-b border-slate-700 pb-1">DANH MỤC TÀI LIỆU BÀN GIAO</h3>
                   <table className="w-full text-xs border-collapse">
                     <thead>
                       <tr className="bg-slate-800/10 dark:bg-slate-800/50">
                         <th className="border border-slate-700/50 p-2 text-left">STT</th>
                         <th className="border border-slate-700/50 p-2 text-left text-[10px] uppercase">Loại tài liệu / Giấy tờ</th>
                         <th className="border border-slate-700/50 p-2 text-center text-[10px] uppercase">Số lượng</th>
                         <th className="border border-slate-700/50 p-2 text-left text-[10px] uppercase">Ghi chú</th>
                       </tr>
                     </thead>
                     <tbody>
                       <tr>
                         <td className="border border-slate-700/50 p-2 text-center">1</td>
                         <td className="border border-slate-700/50 p-2 font-bold">Giấy chứng nhận Quyền sử dụng Đất (GCN)</td>
                         <td className="border border-slate-700/50 p-2 text-center">01 bản gốc</td>
                         <td className="border border-slate-700/50 p-2 italic opacity-60">Kèm thông báo nộp thuế</td>
                       </tr>
                       <tr>
                         <td className="border border-slate-700/50 p-2 text-center">2</td>
                         <td className="border border-slate-700/50 p-2 pr-4 font-bold">Hồ sơ kỹ thuật / Biên bản đo đạc</td>
                         <td className="border border-slate-700/50 p-2 text-center">01 bộ</td>
                         <td className="border border-slate-700/50 p-2 italic opacity-60"></td>
                       </tr>
                       {app.isSelfService && (
                         <tr>
                           <td className="border border-slate-700/50 p-2 text-center">3</td>
                           <td className="border border-slate-700/50 p-2 font-bold">Tài liệu hướng dẫn sang tên</td>
                           <td className="border border-slate-700/50 p-2 text-center">01 bộ</td>
                           <td className="border border-slate-700/50 p-2 italic opacity-60">Khách hàng tự làm hồ sơ</td>
                         </tr>
                       )}
                     </tbody>
                   </table>
                 </div>

                 <div className="pt-8 grid grid-cols-2 gap-12">
                    <div className="text-center space-y-20">
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-60">ĐẠI DIỆN BÊN GIAO</p>
                       <p className="text-xs font-bold">(Ký và ghi rõ họ tên)</p>
                    </div>
                    <div className="text-center space-y-20">
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-60">ĐẠI DIỆN BÊN NHẬN</p>
                       <p className="text-xs font-bold">(Ký và ghi rõ họ tên)</p>
                    </div>
                 </div>

                 <div className="pt-10 border-t border-slate-800 border-dashed text-[9px] italic text-slate-500 text-center uppercase tracking-widest">
                    Vui lòng bảo quản cẩn thận giấy tờ gốc. Mọi khiếu nại sau khi ký biên bản này sẽ được xử lý theo quy định công ty.
                 </div>
               </div>

               <div className="flex gap-3 pt-6 print:hidden">
                 <button 
                   onClick={onClose}
                   className="flex-1 py-3 border border-slate-700 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-800 transition-colors"
                 >
                   Đóng lại
                 </button>
                 <button 
                   onClick={handlePrint}
                   className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-900/20 transition-all flex items-center justify-center gap-2"
                 >
                   <Printer size={16} /> In Phiếu BĐ
                 </button>
               </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default HandoverTicketModal;
