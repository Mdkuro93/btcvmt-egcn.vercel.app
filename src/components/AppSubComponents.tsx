import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { Application, UnitStatus } from '../types';
import { formatDate } from '../utils/dateUtils';

export const StatCard = ({ title, value, icon: Icon, colorClass, delay, theme = 'dark', onClick, isActive }: { title: string, value: number | string, icon: any, colorClass: string, delay: number, theme?: 'light' | 'dark', onClick?: () => void, isActive?: boolean }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    onClick={onClick}
    className={cn(
      "p-6 rounded-[2.5rem] border flex flex-col gap-4 relative overflow-hidden transition-all group",
      onClick ? "cursor-pointer hover:scale-[1.02] active:scale-95" : "",
      isActive ? "ring-2 ring-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)] border-indigo-500/50" : "",
      theme === 'dark' 
        ? "bg-slate-900/80 backdrop-blur-xl border-slate-700/50 hover:border-festive-gold/30 shadow-2xl" 
        : "bg-white border-slate-200/60 hover:border-festive-gold/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
    )}
  >
    <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/5 rounded-full blur-2xl"></div>
    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-12", colorClass)}>
      <Icon size={28} className="text-white" />
    </div>
    <div>
      <p className={cn("text-xs font-bold uppercase tracking-wider mb-1", theme === 'dark' ? "text-slate-500" : "text-slate-500")}>{title}</p>
      <div className="flex items-center justify-between">
        <p className={cn("text-3xl font-black tracking-tighter", theme === 'dark' ? "text-white" : "text-slate-900")}>{value}</p>
        {onClick && <ArrowRight size={16} className={cn("transition-all", theme === 'dark' ? "text-slate-500 group-hover:text-festive-gold" : "text-slate-400 group-hover:text-festive-gold")} />}
      </div>
    </div>
  </motion.div>
);

export const StatusBadge = ({ status, app, variant = 'default' }: { status: UnitStatus | string; app?: Application; variant?: 'default' | 'compact' }) => {
  let effectiveStatus: string = status;
  if (app) {
    if (app.currentStep === 'S3_Nop_VPDK' || app.currentStep === 'GD2_Cho_Nop_VPDK' || app.currentStep === 'GD3_Cho_TBThue') {
      effectiveStatus = (app.vpdkCode && app.submissionLocation && app.submissionDate) ? 'Submitted' : 'WaitingVPDK';
    } else if (app.currentStep === 'S5_Tai_Chinh_Khach_Hang' || app.currentStep === 'GD4_Cho_Nop_NVTC' || app.currentStep === 'GD4_Cho_KT_TiepNhan_LaySo') {
      effectiveStatus = app.taxReceiptDate ? 'TaxPaid' : 'TaxPaymentPending_Dynamic';
    } else if (app.currentStep === 'S5_1_PTDA_TiepNhan') {
       effectiveStatus = 'TaxPaid';
    } else if (['S6_Nhan_So_GCN', 'S7_PTDA_Ban_Giao', 'S7_1_PTT_Tiep_Nhan', 'GD5_Cho_Ky_In_GCN'].includes(app.currentStep)) {
      effectiveStatus = app.gcnSignedDate ? 'GCN_Issued' : 'GCN_SignPending_Dynamic';
    } else if (app.currentStep === 'S7_2_Ban_Giao_Khach' || app.currentStep === 'GD6_Cho_BG_Khach' || app.currentStep === 'GD5_Cho_PTT_TiepNhan_BG') {
       effectiveStatus = app.customerHandoverDate ? 'Completed' : 'WaitingHandover';
    }
  }

  const configs: Record<string, { label: string, classes: string }> = {
    Processing: { label: 'Đang chuẩn bị', classes: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' },
    WaitingVPDK: { label: 'Chờ nộp VPĐK', classes: 'bg-amber-500/10 text-amber-600 border border-amber-500/20' },
    Submitted: { label: 'Đã nộp VPĐK', classes: 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20' },
    TaxPending: { label: 'Chờ hoàn thành NVTC', classes: 'bg-rose-500/10 text-rose-600 border border-rose-500/20' },
    TaxPaymentPending_Dynamic: { label: 'Chờ nộp thuế', classes: 'bg-rose-500/10 text-rose-600 border border-rose-500/20' },
    TaxCompleted: { label: 'Đã hoàn thành NVTC', classes: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' },
    TaxPaid: { label: 'ĐÃ NỘP THUẾ', classes: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]' },
    GCN_SignPending_Dynamic: { label: 'Chờ ký/in GCN', classes: 'bg-sky-500/10 text-sky-600 border border-sky-500/20' },
    GCN_Issued: { label: 'Đã ra GCN', classes: 'bg-sky-500/10 text-sky-600 border border-sky-500/20' },
    WaitingHandover: { label: 'CHỜ BÀN GIAO', classes: 'bg-amber-500/10 text-amber-600 border border-amber-500/20 animate-pulse' },
    Completed: { label: 'Hoàn tất', classes: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' },
    Error: { label: 'Sai sót/Vướng', classes: 'bg-rose-500/10 text-rose-600 border border-rose-500/20' },
    Draft: { label: 'Nháp', classes: 'bg-slate-500/10 text-slate-600 border border-slate-500/20' },
  };

  const config = configs[effectiveStatus] || configs.Processing;
  return (
    <span className={cn(
      variant === 'compact' ? "px-1 py-0 rounded text-[9px] font-bold uppercase tracking-tighter" : "px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider",
      "whitespace-nowrap inline-block", 
      config.classes
    )}>
      {config.label}
    </span>
  );
};

export const DetailCard = ({ label, value, field, valueColor = 'text-white', editable = false, type = 'text', options, onChange, isEditing = false, theme = 'dark' }: { label: string, value?: string, field?: keyof Application, valueColor?: string, editable?: boolean, type?: string, options?: string[], onChange?: (val: any) => void, isEditing?: boolean, theme?: 'light' | 'dark' }) => {
  const active = editable && isEditing;
  const darkValueColor = valueColor === 'text-white' ? 'text-white' : valueColor;
  const lightValueColor = valueColor === 'text-white' ? 'text-slate-900' : valueColor;

  const todayStr = new Date().toISOString().split('T')[0];
  const isDeadlineStr = label.toLowerCase().includes('cam kết') || label.toLowerCase().includes('commitment');

  useEffect(() => {
    if (active && type === 'date' && !value && !isDeadlineStr && onChange) {
      onChange(todayStr);
    }
  }, [active, type, value, isDeadlineStr]);
  
  return (
    <div className={cn(
      "p-4 border rounded-2xl transition-all group backdrop-blur-sm relative overflow-hidden",
      active 
        ? "bg-emerald-500/5 border-emerald-500/30 ring-1 ring-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]" 
        : theme === 'dark' ? "bg-slate-950/40 border-slate-800" : "bg-slate-50/50 border-slate-200 shadow-sm"
    )}>
      {active && <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 blur-2xl -mr-8 -mt-8 rounded-full"></div>}
      
      <p className={cn(
        "text-xs font-bold uppercase mb-1.5 tracking-wider transition-colors leading-tight",
        active ? "text-emerald-500" : theme === 'dark' ? "text-slate-500" : "text-slate-500"
      )}>
        {label}
      </p>

      {active ? (
        <div className="relative z-10">
          {type === 'select' ? (
            <div className="relative">
              <select 
                className={cn(
                  "w-full border rounded-xl px-3 py-2 text-xs font-black text-emerald-400 outline-none focus:ring-2 focus:ring-emerald-500/30 appearance-none cursor-pointer",
                  theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                )}
                value={value || ''}
                onChange={(e) => onChange?.(e.target.value)}
              >
                {options ? (
                  options.map((opt, idx) => <option key={`${opt}-${idx}`} value={opt}>{opt}</option>)
                ) : field === 'submissionLocation' ? (
                  <>
                    <option value="PHUONG">Phường/Xã</option>
                    <option value="TP_DANANG">Tỉnh/Thành phố</option>
                  </>
                ) : field === 'taxPaymentStatus' ? (
                  <>
                    <option value="Unpaid">Chưa nộp</option>
                    <option value="Paid">Đã nộp</option>
                  </>
                ) : null}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none" />
            </div>
          ) : (
            <input 
              type={type}
              max={(type === 'date' && !isDeadlineStr) ? todayStr : undefined}
              className={cn(
                "w-full border rounded-xl px-3 py-1.5 text-xs font-black text-emerald-400 outline-none focus:ring-2 focus:ring-emerald-500/30",
                theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
              )}
              value={value || ''}
              onChange={(e) => onChange?.(e.target.value)}
            />
          )}
        </div>
      ) : (
        <p className={cn("text-xs font-bold truncate transition-colors", theme === 'dark' ? darkValueColor : lightValueColor)}>
          {type === 'date' ? formatDate(value) : (value || '---')}
        </p>
      )}
    </div>
  );
};

export const FestiveBranding = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
    {/* Animated Fireworks */}
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <motion.div
        key={`festive-fw-${i}`}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ 
          opacity: [0, 0.4, 0, 0.3, 0], 
          scale: [0, 1.2, 1, 1.1, 0.8],
          y: [0, -20, -10, -30, -15]
        }}
        transition={{ 
          duration: 4 + Math.random() * 2, 
          repeat: Infinity, 
          delay: i * 2,
          ease: "easeOut"
        }}
        className="absolute w-32 h-32"
        style={{ 
          left: `${10 + i * 15}%`, 
          top: `${5 + (i % 3) * 15}%` 
        }}
      >
        <div className="absolute inset-0 border-[0.5px] border-festive-gold/40 rounded-full blur-[2px]"></div>
        <div className="absolute inset-8 border-[0.5px] border-rose-400/30 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full blur-[1px] animate-pulse"></div>
      </motion.div>
    ))}

    {/* Background Overlay Tints */}
    <div className="absolute inset-0 bg-festive-dark/20 backdrop-blur-[1px]"></div>
    <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-festive-red/20 via-transparent to-transparent"></div>
    <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-festive-dark/60 to-transparent"></div>
  </div>
);

export const PrintStyles = () => (
  <style>{`
    @media print {
      @page { size: A4; margin: 20mm; }
      body * { visibility: hidden; }
      #print-section, #print-section * { visibility: visible; }
      #print-section {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        background: white !important;
        color: black !important;
        font-family: "Times New Roman", serif;
      }
      .no-print { display: none !important; }
    }
  `}</style>
);
