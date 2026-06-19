import React, { ReactNode } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { UserProfile } from '../../types';

interface MobileLayoutProps {
  currentUser: UserProfile;
  onExit: () => void;
  children: ReactNode;
}

export default function MobileLayout({ currentUser, onExit, children }: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 font-sans safe-area-inset overflow-x-hidden text-left relative">
       {/* HEADER */}
       <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-gradient-to-br from-indigo-505 to-indigo-700 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)] border border-white/20 shrink-0">
                <ShieldCheck className="text-white animate-pulse" size={20} strokeWidth={1.5} />
             </div>
             <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-lg font-black tracking-tight italic leading-tight">Field Portal</h2>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold tracking-tight">Mã: {currentUser.username}</span>
                </div>
                <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest leading-none mt-0.5">Dự án theo phân quyền của bạn</p>
             </div>
          </div>
          <button 
             onClick={onExit} 
             className="px-4 py-2 bg-slate-900 rounded-xl border border-slate-800 text-slate-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 active:bg-slate-800 active:text-white transition-all"
          >
             <X size={14} /> Thoát
          </button>
       </header>

       {children}
    </div>
  );
}
