import React from 'react';
import { UnitStatus } from '../types';
import { cn } from '../lib/utils';

interface StatusBadgeProps {
  status: UnitStatus;
  className?: string;
}

const statusConfig: Record<string, { label: string, color: string }> = {
  Processing: { label: 'Đang chuẩn bị', color: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
  WaitingVPDK: { label: 'Chờ nộp VPĐK', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  Submitted: { label: 'Đã nộp VPĐK', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  TaxPending: { label: 'Chờ thông báo thuế', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
  TaxCompleted: { label: 'Đã có TB thuế', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  GCN_Issued: { label: 'Đã có GCN', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
  Completed: { label: 'Hoàn tất', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  Error: { label: 'Vướng mắc', color: 'bg-rose-500 text-white' },
  Draft: { label: 'Nháp', color: 'bg-slate-300 text-slate-600' }
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, color: 'bg-slate-100 text-slate-500' };
  
  return (
    <span className={cn(
      "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border whitespace-nowrap",
      config.color,
      className
    )}>
      {config.label}
    </span>
  );
}
