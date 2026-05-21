import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { Project } from '../../types';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (p: Partial<Project>) => void;
  project: Project | null;
  theme: 'light' | 'dark';
}

const ProjectModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  project, 
  theme 
}: ProjectModalProps) => {
  const [formData, setFormData] = useState<Partial<Project>>({
    name: '',
    region: 'Quảng Trị',
    totalUnits: 0,
    workflowType: 'Quy_trinh_1'
  });

  useEffect(() => {
    if (project) {
      if (formData.name !== project.name || formData.region !== project.region || formData.totalUnits !== project.totalUnits || formData.workflowType !== project.workflowType) {
        setFormData(project);
      }
    } else if (isOpen) {
      if (formData.name !== '' || formData.totalUnits !== 0) {
        setFormData({
          name: '',
          region: 'Quảng Trị',
          totalUnits: 0,
          workflowType: 'Quy_trinh_1'
        });
      }
    }
  }, [project, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className={cn(
          "relative w-full max-w-lg rounded-[2.5rem] border shadow-2xl overflow-hidden",
          theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"
        )}
      >
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className={cn("text-2xl font-black italic font-serif", theme === 'light' ? "text-slate-900" : "text-white")}>
                {project ? 'Chỉnh sửa Dự án' : 'Tạo Dự án Mối'}
              </h2>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Thông tin vận hành hệ thống</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-500/10 transition-all">
              <X size={20} className="text-slate-500" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Tên dự án</label>
              <input 
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Sunshine Riverside"
                className={cn(
                  "w-full px-5 py-4 rounded-2xl border text-sm font-bold focus:outline-none transition-all",
                  theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500" : "bg-slate-950 border-slate-800 text-white focus:border-festive-gold"
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Khu vực / Tỉnh thành</label>
                <select 
                  value={formData.region}
                  onChange={e => setFormData({ ...formData, region: e.target.value })}
                  className={cn(
                    "w-full px-5 py-4 rounded-2xl border text-sm font-bold focus:outline-none transition-all",
                    theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-slate-950 border-slate-800 text-white"
                  )}
                >
                  <option value="Quảng Trị">Quảng Trị</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                  <option value="Quảng Ngãi">Quảng Ngãi</option>
                  <option value="Khánh Hòa">Khánh Hòa</option>
                  <option value="Gia Lai">Gia Lai</option>
                  <option value="Lâm Đồng">Lâm Đồng</option>
                  <option value="Đắk Lắk">Đắk Lắk</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Tổng số sản phẩm</label>
                <input 
                  type="number"
                  value={formData.totalUnits}
                  onChange={e => setFormData({ ...formData, totalUnits: parseInt(e.target.value) || 0 })}
                  className={cn(
                    "w-full px-5 py-4 rounded-2xl border text-sm font-bold focus:outline-none transition-all focus:border-indigo-500",
                    theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-slate-950 border-slate-800 text-white"
                  )}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 mt-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Loại quy trình</label>
                <select 
                  value={formData.workflowType || 'Quy_trinh_1'}
                  onChange={e => setFormData({ ...formData, workflowType: e.target.value as any })}
                  disabled={!!project}
                  className={cn(
                    "w-full px-5 py-4 rounded-2xl border text-sm font-bold focus:outline-none transition-all",
                    theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500" : "bg-slate-950 border-slate-800 text-white focus:border-festive-gold",
                    !!project && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <option value="Quy_trinh_1">Quy trình hỗ trợ (GD_)</option>
                  <option value="Quy_trinh_2">Quy trình thông thường (S_)</option>
                </select>
                {project && <p className="text-[9px] text-amber-500 font-bold mt-2 italic">* Không thể thay đổi quy trình sau khi dự án đã được tạo.</p>}
              </div>

              <div className="mt-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Danh mục hồ sơ gốc (Tham khảo)</label>
                <div className="space-y-2">
                  {(formData.originalDocumentChecklist || []).map((item, idx) => (
                    <div key={`${item}-${idx}`} className="flex gap-2">
                      <input 
                        type="text"
                        value={item}
                        onChange={e => {
                          const newList = [...(formData.originalDocumentChecklist || [])];
                          newList[idx] = e.target.value;
                          setFormData({ ...formData, originalDocumentChecklist: newList });
                        }}
                        placeholder="Tên hồ sơ..."
                        className={cn(
                          "flex-1 px-4 py-2 rounded-xl border text-xs font-bold transition-all focus:ring-1 focus:ring-indigo-500",
                          theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-slate-950 border-slate-800 text-white"
                        )}
                      />
                      <button 
                        onClick={() => {
                          const newList = (formData.originalDocumentChecklist || []).filter((_, i) => i !== idx);
                          setFormData({ ...formData, originalDocumentChecklist: newList });
                        }}
                        className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => setFormData({ ...formData, originalDocumentChecklist: [...(formData.originalDocumentChecklist || []), ''] })}
                    className="w-full py-2 border-2 border-dashed border-slate-700/50 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-indigo-500/50 hover:text-indigo-500 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={14} /> Thêm hạng mục hồ sơ
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-12">
            <button 
              onClick={onClose}
              className="flex-1 px-8 py-4 rounded-2xl text-[10px] font-black uppercase text-slate-500 hover:bg-slate-500/10 transition-all"
            >
              Hủy bỏ
            </button>
            <button 
              onClick={() => onSave(formData)}
              className="flex-1 px-8 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-emerald-600/20 hover:scale-105 active:scale-95 transition-all"
            >
              Lưu thông tin
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProjectModal;
