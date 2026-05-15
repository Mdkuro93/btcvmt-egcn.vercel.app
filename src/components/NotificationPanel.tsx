import React from 'react';
import { Bell, Clock, AlertTriangle, CheckCircle2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { AppNotification } from '../types';

interface NotificationPanelProps {
  theme: 'light' | 'dark';
  notifications: AppNotification[];
  taskReminders: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onSelectApp: (appId: string) => void;
}

export default function NotificationPanel({ 
  theme, notifications, taskReminders, onMarkAsRead, onClearAll, onSelectApp 
}: NotificationPanelProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length + taskReminders.length;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center transition-all relative",
          theme === 'dark' ? "bg-slate-900 border-slate-800 hover:bg-slate-800" : "bg-white border-slate-200 hover:bg-slate-100"
        )}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-black flex items-center justify-center border-2 border-slate-950">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={cn(
                "absolute right-0 mt-3 w-80 max-h-[500px] flex flex-col rounded-3xl border shadow-2xl z-50 overflow-hidden",
                theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
              )}
            >
              <div className="p-4 border-b border-slate-800/50 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest">Thông báo</h3>
                <button onClick={onClearAll} className="p-2 text-slate-500 hover:text-rose-500">
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {unreadCount === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-xs font-bold text-slate-500 italic">Không có thông báo mới nào</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/30">
                    {taskReminders.map(rem => (
                      <div 
                        key={rem.id}
                        onClick={() => { onSelectApp(rem.appId || ''); setIsOpen(false); }}
                        className="p-4 bg-amber-500/5 hover:bg-amber-500/10 transition-colors cursor-pointer"
                      >
                         <div className="flex gap-3">
                            <Clock size={16} className="text-amber-500 shrink-0" />
                            <div>
                               <p className="text-xs font-bold text-amber-500 mb-1">{rem.title}</p>
                               <p className="text-[10px] text-slate-400 leading-relaxed font-medium">{rem.message}</p>
                               <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase">Hết hạn trong 24h</p>
                            </div>
                         </div>
                      </div>
                    ))}
                    {notifications.map(noti => (
                      <div 
                        key={noti.id}
                        onClick={() => { onMarkAsRead(noti.id); if(noti.appId) onSelectApp(noti.appId); setIsOpen(false); }}
                        className={cn(
                          "p-4 hover:bg-slate-800/10 transition-colors cursor-pointer",
                          !noti.isRead && "bg-indigo-500/5"
                        )}
                      >
                         <div className="flex gap-3">
                            {noti.type === 'Info' && <AlertTriangle size={16} className="text-indigo-500 shrink-0" />}
                            {noti.type === 'Warning' && <AlertTriangle size={16} className="text-amber-500 shrink-0" />}
                            {noti.type === 'Urgent' && <AlertTriangle size={16} className="text-rose-500 shrink-0" />}
                            {noti.type === 'Success' && <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />}
                            <div>
                               <p className="text-xs font-bold mb-1">{noti.title}</p>
                               <p className="text-[10px] text-slate-400 leading-relaxed font-medium">{noti.message}</p>
                               <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase">{noti.time}</p>
                            </div>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
