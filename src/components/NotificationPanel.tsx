import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  RotateCcw, 
  ClipboardCheck, 
  ChevronRight, 
  Check, 
  BellOff 
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { AppNotification } from '../types';

interface NotificationPanelProps {
  notifications: AppNotification[];
  taskReminders: AppNotification[];
  onClose: () => void;
  onRead: (id: string) => void;
  onMarkAllRead: () => void;
  onAction: (appId?: string | number, notiId?: string) => void;
  theme: 'light' | 'dark';
}

export default function NotificationPanel({ 
  notifications, 
  taskReminders, 
  onClose, 
  onRead, 
  onMarkAllRead, 
  onAction, 
  theme 
}: NotificationPanelProps) {
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);

  const displayedNotifications = filterUnreadOnly 
    ? notifications.filter(n => !n.isRead) 
    : notifications;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className={cn(
        "absolute right-0 top-full mt-4 w-[420px] border rounded-[2.5rem] shadow-[0_30px_80px_rgba(0,0,0,0.4)] z-[100] overflow-hidden text-left transition-all",
        theme === 'dark' ? "bg-slate-950/95 border-slate-800 backdrop-blur-xl" : "bg-white/95 border-slate-200 shadow-2xl backdrop-blur-xl"
      )}
    >
      <div className={cn(
        "p-6 border-b transition-all",
        theme === 'dark' ? "border-slate-800 bg-slate-900/50 text-white" : "border-slate-100 bg-slate-50 text-slate-900"
      )}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest">Trung tâm Thông tin</h4>
            <div className="flex items-center gap-3 mt-1">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAllRead();
                }}
                className="text-[10px] text-indigo-500 hover:text-indigo-600 font-black uppercase tracking-tighter transition-colors"
              >
                Đọc tất cả
              </button>
              <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setFilterUnreadOnly(!filterUnreadOnly);
                }}
                className={cn(
                  "text-[10px] font-black uppercase tracking-tighter transition-colors",
                  filterUnreadOnly ? "text-rose-500" : "text-slate-500 hover:text-slate-700"
                )}
              >
                {filterUnreadOnly ? "Hiện tất cả" : "Chỉ chưa đọc"}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn(
               "text-[10px] px-2 py-0.5 rounded-full font-bold",
               (notifications.filter(n => !n.isRead).length + taskReminders.length) > 0 ? "bg-rose-500 text-white" : "bg-slate-500/20 text-slate-500"
            )}>
              {notifications.filter(n => !n.isRead).length + taskReminders.length} Mới
            </span>
            <button onClick={onClose} className="p-2 hover:bg-slate-500/10 rounded-xl transition-all">
              <X size={18} className="text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
        {/* Urgent Task Reminders Section */}
        {taskReminders.length > 0 && (
          <div className={cn(
            "p-2 bg-rose-500/[0.03] border-b",
            theme === 'dark' ? "border-slate-800" : "border-slate-100"
          )}>
            <div className="px-4 py-2 flex items-center gap-2">
              <AlertTriangle size={12} className="text-rose-500" />
              <span className="text-[9px] font-black uppercase tracking-widest text-rose-500">Việc cần làm ({taskReminders.length})</span>
            </div>
            <div className="space-y-1">
              {taskReminders.map((rem, index) => (
                <div 
                  key={`${rem.id}-${index}`}
                  onClick={() => onAction(rem.appId)}
                  className={cn(
                    "p-4 rounded-3xl transition-all cursor-pointer group border mx-2 mb-1",
                    theme === 'dark' 
                      ? "bg-slate-900/40 border-slate-800 hover:bg-slate-900 hover:border-rose-500/30" 
                      : "bg-white border-slate-100 hover:border-rose-500/30 shadow-sm"
                  )}
                >
                  <div className="flex gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border",
                      rem.type === 'Urgent' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                    )}>
                      {rem.type === 'Urgent' ? <RotateCcw size={18} /> : <ClipboardCheck size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <p className={cn("text-xs font-black", theme === 'dark' ? "text-slate-200" : "text-slate-900")}>{rem.title}</p>
                        <span className="text-[8px] font-black uppercase text-rose-500">Xử lý ngay</span>
                      </div>
                      <p className={cn("text-[11px] leading-snug line-clamp-2", theme === 'dark' ? "text-slate-500" : "text-slate-400")}>{rem.message}</p>
                      <div className="mt-2 flex items-center gap-2">
                         <span className="text-[10px] font-black text-rose-500 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                           Tiến hành xử lý <ChevronRight size={10} />
                         </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-2">
          {displayedNotifications.length > 0 ? (
            displayedNotifications.map((n, idx) => (
              <div 
                key={`${n.id || 'notif'}-${idx}`} 
                onClick={() => {
                   if (!n.isRead) onRead(n.id);
                   if (n.appId) onAction(n.appId, n.id);
                }}
                className={cn(
                  "p-5 rounded-[1.5rem] transition-all relative group cursor-pointer",
                  theme === 'dark' 
                    ? "hover:bg-white/5" 
                    : "hover:bg-slate-50",
                  !n.isRead && (theme === 'dark' ? "bg-indigo-500/5" : "bg-indigo-50/30")
                )}
              >
                <div className="flex gap-4">
                  <div className={cn(
                    "w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 transition-all",
                    n.isRead ? "bg-slate-300 dark:bg-slate-700 scale-75 opacity-50" : (n.type === 'Urgent' ? "bg-rose-500 shadow-lg shadow-rose-500/30" : n.type === 'Success' ? "bg-emerald-500" : "bg-indigo-500")
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className={cn("text-sm font-semibold leading-tight mb-1", theme === 'dark' ? (n.isRead ? "text-slate-500" : "text-slate-200") : (n.isRead ? "text-slate-400" : "text-slate-900"))}>{n.title}</p>
                    </div>
                    <p className={cn("text-xs leading-relaxed line-clamp-2", theme === 'dark' ? (n.isRead ? "text-slate-600" : "text-slate-400") : (n.isRead ? "text-slate-400" : "text-slate-600"))}>{n.message}</p>
                    <div className="flex items-center justify-between mt-3">
                      <p className={cn("text-[10px] font-bold uppercase tracking-wider", theme === 'dark' ? "text-slate-600" : "text-slate-400")}>
                        {new Date(n.time).toLocaleString('vi-VN', { 
                          hour: '2-digit', 
                          minute: '2-digit', 
                          day: '2-digit', 
                          month: '2-digit' 
                        })}
                      </p>
                      {!n.isRead && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onRead(n.id);
                          }}
                          className={cn(
                            "p-1.5 rounded-lg transition-all shadow-sm",
                            theme === 'dark' ? "hover:bg-slate-800 bg-slate-950 border border-slate-800" : "hover:bg-white bg-slate-100 border border-slate-200"
                          )}
                          title="Đánh dấu đã đọc"
                        >
                          <Check size={14} className="text-indigo-500" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            !taskReminders.length && (
              <div className="p-16 text-center">
                <div className="w-20 h-20 bg-slate-500/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                  <BellOff size={32} className="text-slate-500 opacity-20" />
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{filterUnreadOnly ? "Không có thông báo chưa đọc" : "Hộp thư trống"}</p>
              </div>
            )
          )}
        </div>
      </div>

      <button className={cn(
        "w-full py-6 text-[10px] font-black uppercase tracking-[0.3em] transition-all border-t",
        theme === 'dark' 
          ? "text-slate-500 hover:text-white bg-slate-900/50 border-slate-800" 
          : "text-slate-500 hover:text-slate-900 bg-slate-50 border-slate-100"
      )}>
        Xem tất cả thông báo
      </button>
    </motion.div>
  );
}
