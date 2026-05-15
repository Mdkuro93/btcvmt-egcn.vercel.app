import React from 'react';
import { cn } from '../lib/utils';

interface DetailCardProps {
  label: string;
  value: string | number;
  theme: 'light' | 'dark';
  className?: string;
  horizontal?: boolean;
}

export default function DetailCard({ label, value, theme, className, horizontal }: DetailCardProps) {
  return (
    <div className={cn(
      "p-4 rounded-2xl border transition-all",
      theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-200",
      horizontal && "flex items-center justify-between gap-4",
      className
    )}>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{label}</p>
      <p className="text-xs font-bold leading-relaxed">{value || '---'}</p>
    </div>
  );
}
