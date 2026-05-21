import React, { useState } from 'react';
import { 
  Save, RefreshCcw, Database, Clock, ClipboardList, Plus, Trash2, Printer, 
  FolderArchive, Files, Layers, Info, GitMerge, Settings, ChevronUp, ChevronDown, 
  Check, EyeOff 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { CONST_QUY_TRINH_1, CONST_QUY_TRINH_2, STEP_CONFIG as INITIAL_STEP_CONFIG } from '../constants';

interface SettingsViewProps {
  slaConfig: Record<string, number>;
  setSlaConfig: any;
  checklistTemplates: string[];
  setChecklistTemplates: any;
  stepConfig: any;
  setStepConfig: any;
  handoverTemplate: any;
  setHandoverTemplate: any;
  theme: 'light' | 'dark';
  onSaveConfig: (key: string, value: any) => Promise<void>;
  isLoading: boolean;
  storageStats: { totalSize: number; fileCount: number; folders: string[]; dbSize: number };
  isFetchingStorage: boolean;
  onRefreshStorage: () => void;
  onClearNotifications: () => void;
  onCleanupJunkFiles: () => void;
}

export default function SettingsView({ 
  slaConfig, 
  setSlaConfig, 
  checklistTemplates, 
  setChecklistTemplates,
  stepConfig,
  setStepConfig,
  handoverTemplate,
  setHandoverTemplate,
  theme,
  onSaveConfig,
  isLoading,
  storageStats,
  isFetchingStorage,
  onRefreshStorage,
  onClearNotifications,
  onCleanupJunkFiles
}: SettingsViewProps) {
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [workflowTab, setWorkflowTab] = useState<'GD' | 'S'>('S');
  const [showDisabledSteps, setShowDisabledSteps] = useState(false);
  const [workflowSequences, setWorkflowSequences] = useState<{ GD: string[], S: string[] }>({
    GD: CONST_QUY_TRINH_1,
    S: CONST_QUY_TRINH_2
  });

  const checkLogic = () => {
    const activeSteps = Object.entries(stepConfig)
      .filter(([key, config]: [string, any]) => config.active && (workflowTab === 'GD' ? key.startsWith('GD') : key.startsWith('S')))
      .sort(([a], [b]) => a.localeCompare(b));

    if (activeSteps.length < 2) {
      alert(`Quy trình ${workflowTab === 'GD' ? 'GCN' : 'Dự án mới'} quá ngắn hoặc chưa kích hoạt đủ bước.`);
      return;
    }

    // Basic continuity check based on numeric sequence in keys if possible
    let issues = [];
    activeSteps.forEach(([key], idx) => {
      if (idx > 0) {
        const prevNum = parseInt(activeSteps[idx-1][0].replace(/\D/g, '')) || 0;
        const currNum = parseInt(key.replace(/\D/g, '')) || 0;
        if (currNum < prevNum) {
          issues.push(`Thứ tự bước có thể không logic: ${activeSteps[idx-1][0]} đứng trước ${key}`);
        }
      }
    });

    if (issues.length > 0) {
      alert("Phát hiện các điểm cần lưu ý:\n- " + issues.join("\n- "));
    } else {
      alert(`Quy trình ${workflowTab === 'GD' ? 'GCN' : 'Dự án mới'} hợp lệ và tuân thủ luồng nghiệp vụ.`);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const storagePercentage = Math.min((storageStats.totalSize / (1024 * 1024 * 1024)) * 100, 100); // Assume 1GB limit for display logic

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      <header className="flex justify-between items-end">
        <div>
           <h2 className={cn("text-3xl font-black italic font-serif tracking-tight", theme === 'light' ? "text-slate-900" : "text-white")}>Cấu hình hệ thống</h2>
           <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Quản lý SLA, Checklist & Quy trình</p>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-widest animate-pulse">
            <RefreshCcw size={14} className="animate-spin" />
            Đang tải cấu hình...
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* SLA Config */}
        <section className={cn(
          "backdrop-blur-xl border rounded-[2.5rem] overflow-hidden group",
          theme === 'light' ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/40 border-slate-800"
        )}>
          <div className={cn(
            "p-8 border-b flex items-center justify-between",
            theme === 'light' ? "bg-slate-50/50 border-slate-100" : "bg-slate-900/50 border-slate-800"
          )}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 font-serif">
                <Clock className="text-amber-500" size={20} />
              </div>
              <h3 className={cn("text-base font-black uppercase tracking-tight", theme === 'light' ? "text-slate-900" : "text-white")}>Cấu hình SLA (Ngày)</h3>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  if (confirm('Bạn có chắc muốn đặt lại SLA về mặc định hệ thống?')) {
                    const defaultSla = Object.values(INITIAL_STEP_CONFIG).reduce((acc: any, s: any) => ({ ...acc, [s.label]: s.slaDays || 10 }), {});
                    setSlaConfig(defaultSla);
                  }
                }}
                className="px-4 py-2 bg-slate-500/10 text-slate-500 hover:bg-slate-500/20 border border-slate-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Đặt lại mặc định
              </button>
              <button 
                onClick={() => onSaveConfig('slaConfig', slaConfig)}
                className="px-4 py-2 bg-amber-600/10 text-amber-500 hover:bg-amber-600/20 border border-amber-600/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Lưu SLA
              </button>
            </div>
          </div>
          <div className="p-8 space-y-8">
            {/* Workflow 2 (B - Bước) */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.2em] mb-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Quy trình 2 (Hồ sơ dự án - Bước B)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(slaConfig)
                  .filter(([label]) => {
                    if (label === 'ĐÃ HOÀN TẤT') return false;
                    // Find if this label belongs to a Workflow 2 step (starts with S)
                    const stepEntry = Object.entries(stepConfig || {}).find(([_, cfg]: any) => cfg.label === label);
                    return stepEntry ? stepEntry[0].startsWith('S') : label.startsWith('B');
                  })
                  .sort(([labelA], [labelB]) => {
                    const getNum = (s: string) => {
                      const match = s.match(/B(\d+(\.\d+)?)/);
                      return match ? parseFloat(match[1]) : 999;
                    };
                    return getNum(labelA) - getNum(labelB);
                  })
                  .map(([step, days]) => (
                    <div key={step} className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border group/item hover:border-amber-500/30 transition-all",
                      theme === 'light' ? "bg-white border-slate-100 shadow-sm" : "bg-slate-950 border-slate-800"
                    )}>
                      <span className={cn("text-xs font-bold", theme === 'light' ? "text-slate-700" : "text-slate-300")}>{step}</span>
                      <div className="flex items-center gap-3">
                        <input 
                          type="number" 
                          value={days}
                          onChange={(e) => setSlaConfig({...slaConfig, [step]: parseInt(e.target.value) || 0})}
                          className="w-14 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center text-xs font-black text-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                        />
                        <span className="text-[9px] font-black text-slate-500 uppercase">Ngày</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Workflow 1 (GD - Giai đoạn) */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.2em] mb-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Quy trình 1 (Hỗ trợ - Giai đoạn GĐ)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(slaConfig)
                  .filter(([label]) => {
                    if (label === 'ĐÃ HOÀN TẤT') return false;
                    // Find if this label belongs to a Workflow 1 step (starts with GD)
                    const stepEntry = Object.entries(stepConfig || {}).find(([_, cfg]: any) => cfg.label === label);
                    return stepEntry ? stepEntry[0].startsWith('GD') : label.startsWith('GĐ');
                  })
                  .sort(([labelA], [labelB]) => {
                    const getNum = (s: string) => {
                      const match = s.match(/GĐ(\d+)/) || s.match(/GD(\d+)/);
                      return match ? parseInt(match[1]) : 999;
                    };
                    return getNum(labelA) - getNum(labelB);
                  })
                  .map(([step, days]) => (
                    <div key={step} className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border group/item hover:border-emerald-500/30 transition-all",
                      theme === 'light' ? "bg-white border-slate-100 shadow-sm" : "bg-slate-950 border-slate-800"
                    )}>
                      <span className={cn("text-xs font-bold", theme === 'light' ? "text-slate-700" : "text-slate-300")}>{step}</span>
                      <div className="flex items-center gap-3">
                        <input 
                          type="number" 
                          value={days}
                          onChange={(e) => setSlaConfig({...slaConfig, [step]: parseInt(e.target.value) || 0})}
                          className="w-14 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center text-xs font-black text-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        />
                        <span className="text-[9px] font-black text-slate-500 uppercase">Ngày</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </section>

        {/* Checklist Config */}
        <section className={cn(
          "backdrop-blur-xl border rounded-[2.5rem] overflow-hidden group",
          theme === 'light' ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/40 border-slate-800"
        )}>
          <div className={cn(
            "p-8 border-b flex items-center justify-between",
            theme === 'light' ? "bg-slate-50/50 border-slate-100" : "bg-slate-900/50 border-slate-800"
          )}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <ClipboardList className="text-emerald-500" size={20} />
              </div>
              <h3 className={cn("text-base font-black uppercase tracking-tight", theme === 'light' ? "text-slate-900" : "text-white")}>Danh mục Hồ sơ</h3>
            </div>
            <button 
              onClick={() => onSaveConfig('checklistTemplates', checklistTemplates)}
              className="px-4 py-2 bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600/20 border border-emerald-600/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Lưu Checklist
            </button>
          </div>
          <div className="p-8 space-y-6">
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Thêm hạng mục mới..."
                className={cn(
                  "flex-1 border rounded-2xl px-4 py-3 text-sm focus:ring-2 outline-none transition-all",
                  theme === 'light' ? "bg-white border-slate-200 text-slate-900 focus:ring-emerald-500/20" : "bg-slate-950 border-slate-800 text-slate-300 focus:ring-emerald-500/20"
                )}
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
              />
              <button 
                onClick={() => {
                  if (newChecklistItem.trim()) {
                    setChecklistTemplates([...checklistTemplates, newChecklistItem.trim()]);
                    setNewChecklistItem('');
                  }
                }}
                className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="space-y-2 max-h-[355px] overflow-y-auto custom-scrollbar pr-2">
              {checklistTemplates.map((item, idx) => (
                <div key={`${item}-${idx}`} className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800 group/list">
                  <span className="text-xs text-slate-400 font-medium">{item}</span>
                  <button 
                    onClick={() => setChecklistTemplates(checklistTemplates.filter((_, i) => i !== idx))}
                    className="opacity-0 group-hover/list:opacity-100 p-1.5 text-rose-500 hover:bg-rose-50/10 rounded-lg transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Handover Template Config */}
        <section className={cn(
          "backdrop-blur-xl border rounded-[2.5rem] overflow-hidden group lg:col-span-2",
          theme === 'light' ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/40 border-slate-800"
        )}>
          <div className={cn(
            "p-8 border-b flex items-center justify-between",
            theme === 'light' ? "bg-slate-50/50 border-slate-100" : "bg-slate-900/50 border-slate-800"
          )}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <Printer className="text-indigo-500" size={20} />
              </div>
              <h3 className={cn("text-base font-black uppercase tracking-tight", theme === 'light' ? "text-slate-900" : "text-white")}>Cấu hình Mẫu Biên bản bàn giao</h3>
            </div>
            <button 
              onClick={() => onSaveConfig('handoverTemplate', handoverTemplate)}
              className="px-4 py-2 bg-indigo-600/10 text-indigo-500 hover:bg-indigo-600/20 border border-indigo-600/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Lưu Mẫu Biên bản
            </button>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Tên Công ty / Đơn vị</label>
                <input 
                  type="text" 
                  value={handoverTemplate.companyName}
                  onChange={(e) => setHandoverTemplate({...handoverTemplate, companyName: e.target.value})}
                  className={cn(
                    "w-full px-5 py-4 rounded-2xl border text-sm font-bold focus:outline-none focus:ring-2 transition-all shadow-sm",
                    theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-900 focus:ring-indigo-500/10 focus:border-indigo-500" : "bg-slate-950 border-slate-800 text-white focus:ring-indigo-500/10 focus:border-indigo-500"
                  )}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Tiêu đề phụ (Dự án/Địa điểm)</label>
                <input 
                  type="text" 
                  value={handoverTemplate.subTitle}
                  onChange={(e) => setHandoverTemplate({...handoverTemplate, subTitle: e.target.value})}
                  className={cn(
                    "w-full px-5 py-4 rounded-2xl border text-sm font-bold focus:outline-none focus:ring-2 transition-all shadow-sm",
                    theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-900 focus:ring-indigo-500/10 focus:border-indigo-500" : "bg-slate-950 border-slate-800 text-white focus:ring-indigo-500/10 focus:border-indigo-500"
                  )}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Mã hiệu văn bản</label>
                <input 
                  type="text" 
                  value={handoverTemplate.docCode}
                  onChange={(e) => setHandoverTemplate({...handoverTemplate, docCode: e.target.value})}
                  className={cn(
                    "w-full px-5 py-4 rounded-2xl border text-sm font-bold focus:outline-none focus:ring-2 transition-all shadow-sm",
                    theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-900 focus:ring-indigo-500/10 focus:border-indigo-500" : "bg-slate-950 border-slate-800 text-white focus:ring-indigo-500/10 focus:border-indigo-500"
                  )}
                />
              </div>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Tiêu đề chính của biên bản</label>
                <input 
                  type="text" 
                  value={handoverTemplate.title}
                  onChange={(e) => setHandoverTemplate({...handoverTemplate, title: e.target.value})}
                  className={cn(
                    "w-full px-5 py-4 rounded-2xl border text-sm font-bold focus:outline-none focus:ring-2 transition-all shadow-sm",
                    theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-900 focus:ring-indigo-500/10 focus:border-indigo-500" : "bg-slate-950 border-slate-800 text-white focus:ring-indigo-500/10 focus:border-indigo-500"
                  )}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Tiêu đề phụ 2 (Nội dung bàn giao)</label>
                <input 
                  type="text" 
                  value={handoverTemplate.subTitle2}
                  onChange={(e) => setHandoverTemplate({...handoverTemplate, subTitle2: e.target.value})}
                  className={cn(
                    "w-full px-5 py-4 rounded-2xl border text-sm font-bold focus:outline-none focus:ring-2 transition-all shadow-sm",
                    theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-900 focus:ring-indigo-500/10 focus:border-indigo-500" : "bg-slate-950 border-slate-800 text-white focus:ring-indigo-500/10 focus:border-indigo-500"
                  )}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Địa chỉ thực hiện bàn giao</label>
                <input 
                  type="text" 
                  value={handoverTemplate.address}
                  onChange={(e) => setHandoverTemplate({...handoverTemplate, address: e.target.value})}
                  className={cn(
                    "w-full px-5 py-4 rounded-2xl border text-sm font-bold focus:outline-none focus:ring-2 transition-all shadow-sm",
                    theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-900 focus:ring-indigo-500/10 focus:border-indigo-500" : "bg-slate-950 border-slate-800 text-white focus:ring-indigo-500/10 focus:border-indigo-500"
                  )}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Ghi chú chân trang 1</label>
                <input 
                  type="text" 
                  value={handoverTemplate.footerNote1}
                  onChange={(e) => setHandoverTemplate({...handoverTemplate, footerNote1: e.target.value})}
                  className={cn(
                    "w-full px-5 py-4 rounded-2xl border text-sm font-bold focus:outline-none focus:ring-2 transition-all shadow-sm",
                    theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-900 focus:ring-indigo-500/10 focus:border-indigo-500" : "bg-slate-950 border-slate-800 text-white focus:ring-indigo-500/10 focus:border-indigo-500"
                  )}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Ghi chú chân trang 2</label>
                <input 
                  type="text" 
                  value={handoverTemplate.footerNote2}
                  onChange={(e) => setHandoverTemplate({...handoverTemplate, footerNote2: e.target.value})}
                  className={cn(
                    "w-full px-5 py-4 rounded-2xl border text-sm font-bold focus:outline-none focus:ring-2 transition-all shadow-sm",
                    theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-900 focus:ring-indigo-500/10 focus:border-indigo-500" : "bg-slate-950 border-slate-800 text-white focus:ring-indigo-500/10 focus:border-indigo-500"
                  )}
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Storage Management Section */}
      <section className={cn(
        "bg-slate-900/40 backdrop-blur-xl border rounded-[2.5rem] overflow-hidden group",
        theme === 'light' ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/40 border-slate-800"
      )}>
        <div className={cn(
          "p-8 border-b flex items-center justify-between",
          theme === 'light' ? "bg-slate-50/50 border-slate-100" : "bg-slate-900/50 border-slate-800"
        )}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
              <FolderArchive className="text-orange-500" size={20} />
            </div>
            <h3 className={cn("text-base font-black uppercase tracking-tight", theme === 'light' ? "text-slate-900" : "text-white")}>Quản lý dung lượng Storage</h3>
          </div>
          <button 
            onClick={onRefreshStorage}
            disabled={isFetchingStorage}
            className={cn(
              "p-2 rounded-xl transition-all",
              theme === 'light' ? "hover:bg-slate-100" : "hover:bg-slate-800",
              isFetchingStorage && "animate-spin"
            )}
          >
            <RefreshCcw size={18} className={theme === 'light' ? "text-slate-600" : "text-slate-400"} />
          </button>
        </div>
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className={cn(
              "p-6 rounded-3xl border",
              theme === 'light' ? "bg-slate-50 border-slate-100" : "bg-slate-950 border-slate-800"
            )}>
              <div className="flex items-center gap-2 mb-2">
                <Database className="text-indigo-500" size={14} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Dung lượng Database</p>
              </div>
              <p className="text-2xl font-black text-indigo-500 font-mono tracking-tighter">
                {formatSize(storageStats.dbSize)}
              </p>
              <div className="mt-2 flex items-center gap-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                 <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Dữ liệu từ Supabase</span>
              </div>
            </div>
            
            <div className={cn(
              "p-6 rounded-3xl border",
              theme === 'light' ? "bg-slate-50 border-slate-100" : "bg-slate-950 border-slate-800"
            )}>
              <div className="flex items-center gap-2 mb-2">
                <FolderArchive className="text-orange-500" size={14} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Dung lượng Storage</p>
              </div>
              <p className="text-2xl font-black text-orange-500 font-mono tracking-tighter">
                {formatSize(storageStats.totalSize)}
              </p>
            </div>
            <div className={cn(
              "p-6 rounded-3xl border",
              theme === 'light' ? "bg-slate-50 border-slate-100" : "bg-slate-950 border-slate-800"
            )}>
              <div className="flex items-center gap-2 mb-2">
                <Files className="text-orange-500" size={14} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Số lượng tài liệu</p>
              </div>
              <p className="text-2xl font-black text-orange-500 font-mono tracking-tighter">
                {storageStats.fileCount} <span className="text-xs uppercase">Files</span>
              </p>
            </div>
            <div className={cn(
              "p-6 rounded-3xl border",
              theme === 'light' ? "bg-slate-50 border-slate-100" : "bg-slate-950 border-slate-800"
            )}>
              <div className="flex items-center gap-2 mb-2">
                <Layers className="text-orange-500" size={14} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Số thư mục dự án</p>
              </div>
              <p className="text-2xl font-black text-orange-500 font-mono tracking-tighter">
                {storageStats.folders.length} <span className="text-xs uppercase">Folders</span>
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Mức độ sử dụng (Ước tính)</span>
              <span className="text-xs font-black text-orange-400">{storagePercentage.toFixed(1)}% / 1GB (Spark Plan)</span>
            </div>
            <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${storagePercentage}%` }}
                className="h-full bg-linear-to-r from-orange-600 to-amber-400"
              />
            </div>
            <div className="flex gap-2 items-center text-[10px] text-slate-500 italic">
              <Info size={12} />
              <span>Lưu ý: Supabase Spark Plan cung cấp 1GB dung lượng Storage miễn phí.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Configuration */}
      <section className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] overflow-hidden group">
        <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 font-serif">
              <GitMerge className="text-indigo-500" size={20} />
            </div>
            <div>
               <h3 className="text-base font-black text-white uppercase tracking-tight">Cấu hình Quy trình Xử lý (Workflow)</h3>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Quản lý các bước thực hiện & SLA</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <button 
               onClick={checkLogic}
               className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
             >
               <Check className="text-amber-500" size={14} />
               Kiểm tra tính logic
             </button>
             <Settings className="text-slate-700 animate-spin-slow" size={20} />
          </div>
        </div>
        
        <div className="p-8">
           {/* Tabs */}
           <div className="flex gap-2 p-1 bg-slate-950/50 border border-slate-800 rounded-2xl mb-8 w-fit">
              <button 
                onClick={() => setWorkflowTab('GD')}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  workflowTab === 'GD' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-500 hover:text-slate-300"
                )}
              >
                Quy trình Hỗ trợ (GD_)
              </button>
              <button 
                onClick={() => setWorkflowTab('S')}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  workflowTab === 'S' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-500 hover:text-slate-300"
                )}
              >
                Quy trình Thông thường (S_)
              </button>
           </div>

          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left">
              <thead>
                <tr className={cn("border-b", theme === 'light' ? "border-slate-200" : "border-slate-800")}>
                  <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest pl-4">Mã bước</th>
                  <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Tên hiển thị</th>
                  <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Phòng ban</th>
                  <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Trạng thái gắn kèm</th>
                  <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">SLA (Ngày)</th>
                  <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest pr-4">Hành động</th>
                </tr>
              </thead>
              <tbody className={cn("divide-y", theme === 'light' ? "divide-slate-200" : "divide-slate-800/50")}>
                {workflowSequences[workflowTab].map((key, index) => {
                  const config = (stepConfig as any)[key];
                  if (!config) return null;
                  
                  const handleMove = (index: number, direction: 'up' | 'down') => {
                    const newSequence = [...workflowSequences[workflowTab]];
                    const newIndex = direction === 'up' ? index - 1 : index + 1;
                    if (newIndex < 0 || newIndex >= newSequence.length) return;
                    [newSequence[index], newSequence[newIndex]] = [newSequence[newIndex], newSequence[index]];
                    setWorkflowSequences({...workflowSequences, [workflowTab]: newSequence});
                  };
                  
                  const handleRemove = (index: number) => {
                    if (confirm('Bạn có chắc muốn xóa bước này?')) {
                      const newSequence = workflowSequences[workflowTab].filter((_, i) => i !== index);
                      setWorkflowSequences({...workflowSequences, [workflowTab]: newSequence});
                    }
                  };
                  
                  return (
                    <tr key={`${workflowTab}-${key}-${index}`} className={cn(
                      "group/row transition-colors",
                      theme === 'light' ? "hover:bg-slate-50" : "hover:bg-slate-800/10",
                      !config.active && "opacity-40 grayscale"
                    )}>
                    <td className="py-4 pl-4 text-[10px] font-mono text-slate-500 flex items-center gap-2">
                       {key}
                       <div className="flex flex-col">
                          <button onClick={() => handleMove(index, 'up')} className="hover:text-indigo-400" disabled={index === 0}><ChevronUp size={10} /></button>
                          <button onClick={() => handleMove(index, 'down')} className="hover:text-indigo-400" disabled={index === workflowSequences[workflowTab].length - 1}><ChevronDown size={10} /></button>
                       </div>
                    </td>
                    <td className="py-4">
                      <input 
                        type="text" 
                        value={config.label}
                        onChange={(e) => setStepConfig({...stepConfig, [key]: {...config, label: e.target.value}})}
                        className={cn(
                          "border rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500/50 outline-none w-full max-w-[180px] font-bold transition-colors",
                          theme === 'light' ? "bg-white border-slate-200 text-slate-900" : "bg-slate-950/50 border-slate-800 text-white"
                        )}
                      />
                    </td>
                    <td className="py-4">
                      <select 
                        value={config.dept}
                        onChange={(e) => setStepConfig({...stepConfig, [key]: {...config, dept: e.target.value}})}
                        className={cn(
                          "border rounded-lg px-2 py-1.5 text-[10px] font-black uppercase text-indigo-400 outline-none transition-colors",
                          theme === 'light' ? "bg-white border-slate-200" : "bg-slate-950/50 border-slate-800"
                        )}
                      >
                        <option value="PTT">PTT</option>
                        <option value="KT">KT</option>
                        <option value="PTDA">PTDA</option>
                        <option value="MANAGER">MANAGER</option>
                        <option value="DIRECTOR">DIRECTOR</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td className="py-4">
                      <select 
                        value={config.status}
                        onChange={(e) => setStepConfig({...stepConfig, [key]: {...config, status: e.target.value}})}
                        className={cn(
                          "border rounded-lg px-2 py-1.5 text-[10px] font-black uppercase text-slate-400 outline-none transition-colors",
                          theme === 'light' ? "bg-white border-slate-200" : "bg-slate-950/50 border-slate-800"
                        )}
                      >
                        <option value="Processing">Đang xử lý</option>
                        <option value="Submitted">Đã nộp hồ sơ</option>
                        <option value="TaxPending">Chờ TB Thuế</option>
                        <option value="TaxCompleted">Đã nộp thuế</option>
                        <option value="GCN_Issued">Đã có GCN</option>
                        <option value="Completed">Hoàn tất</option>
                      </select>
                    </td>
                    <td className="py-4">
                      <input 
                        type="number" 
                        value={config.slaDays || 0}
                        onChange={(e) => setStepConfig({...stepConfig, [key]: {...config, slaDays: parseInt(e.target.value) || 0}})}
                        className={cn(
                          "w-16 border rounded-lg px-3 py-1.5 text-center text-xs font-black text-amber-500 outline-none transition-colors",
                          theme === 'light' ? "bg-white border-slate-200" : "bg-slate-950/50 border-slate-800"
                        )}
                      />
                    </td>
                    <td className="py-4 pr-4 flex gap-2">
                       <button 
                         onClick={() => setStepConfig({
                           ...stepConfig, 
                           [key]: { ...config, active: !config.active }
                         })}
                         className={cn(
                           "flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                           config.active 
                             ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                             : cn(
                                "border",
                                theme === 'light' ? "bg-slate-100 text-slate-400 border-slate-200" : "bg-slate-800 text-slate-500 border-slate-700"
                              )
                          )}
                       >
                         {config.active ? <Check size={10} /> : <EyeOff size={10} />}
                         {config.active ? "Kích hoạt" : "Vô hiệu"}
                       </button>
                       <button onClick={() => handleRemove(index)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-full"><Trash2 size={12} /></button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className={cn(
            "mt-8 p-6 rounded-3xl border flex items-center justify-between",
            theme === 'light' ? "bg-indigo-50 border-indigo-100/50" : "bg-indigo-500/5 border-indigo-500/10"
          )}>
             <div className="flex items-center gap-3">
                <Info size={18} className="text-indigo-400" />
                <p className={cn("text-xs font-medium leading-relaxed max-w-2xl", theme === 'light' ? "text-slate-600" : "text-slate-400")}>
                  <strong>Chú ý:</strong> Thay đổi quy trình sẽ ảnh hưởng đến việc phân quyền hiển thị hồ sơ cho các phòng ban và cách tính toán KPI trên Dashboard. Hãy kiểm tra kỹ trước khi cập nhật.
                </p>
             </div>
             <button 
               onClick={() => {
                 onSaveConfig('stepConfig', stepConfig);
                 onSaveConfig('workflowSequences', workflowSequences);
               }}
               className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20"
             >
               Lưu quy trình lên Supabase
             </button>
          </div>
        </div>
      </section>

      {/* Maintenance Section */}
      <section className={cn(
        "bg-rose-500/5 backdrop-blur-xl border rounded-[2.5rem] overflow-hidden group border-rose-500/20",
        theme === 'light' ? "bg-rose-50/30 shadow-sm" : ""
      )}>
        <div className={cn(
          "p-8 border-b flex items-center justify-between border-rose-500/10",
          theme === 'light' ? "bg-rose-50/50" : "bg-rose-500/5"
        )}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
              <Trash2 className="text-rose-500" size={20} />
            </div>
            <h3 className={cn("text-base font-black uppercase tracking-tight", theme === 'light' ? "text-slate-900" : "text-white")}>Bảo trì & Dọn dẹp</h3>
          </div>
        </div>
        <div className="p-8 space-y-6">
          <div className={cn(
            "flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-3xl border",
            theme === 'light' ? "bg-rose-50 border-rose-100" : "bg-rose-500/5 border-rose-500/10"
          )}>
            <div>
              <h4 className="text-sm font-black text-rose-500 uppercase tracking-widest mb-1">Dọn dẹp Thông báo hệ thống</h4>
              <p className={cn("text-xs font-medium", theme === 'light' ? "text-slate-500" : "text-slate-400")}>Xóa toàn bộ các thông báo cũ và hiện có trong hệ thống của tất cả người dùng.</p>
            </div>
            <button 
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ thông báo? Hành động này không thể hoàn tác.')) {
                  onClearNotifications();
                }
              }}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-rose-600/20 flex items-center gap-2 whitespace-nowrap active:scale-95"
            >
              <Trash2 size={14} />
              Xóa tất cả thông báo
            </button>
          </div>
          <div className={cn(
            "flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-3xl border",
            theme === 'light' ? "bg-rose-50 border-rose-100" : "bg-rose-500/5 border-rose-500/10"
          )}>
            <div>
              <h4 className="text-sm font-black text-rose-500 uppercase tracking-widest mb-1">Dọn dẹp File rác</h4>
              <p className={cn("text-xs font-medium", theme === 'light' ? "text-slate-500" : "text-slate-400")}>Xóa các file trong storage không còn gắn với hồ sơ nào.</p>
            </div>
            <button 
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn dọn dẹp file rác? Hành động này không thể hoàn tác.')) {
                  onCleanupJunkFiles();
                }
              }}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-rose-600/20 flex items-center gap-2 whitespace-nowrap active:scale-95"
            >
              <Trash2 size={14} />
              Dọn dẹp file rác
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
