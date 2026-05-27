import React from 'react';
import { Plus, Key, Settings, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { UserProfile } from '../types';

interface UserManagementViewProps {
  users: UserProfile[];
  onEdit: (u: UserProfile) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
  onResetPassword: (u: UserProfile) => void;
  theme: 'light' | 'dark';
}

const UserManagementView = ({ 
  users, 
  onEdit, 
  onDelete, 
  onCreate, 
  onResetPassword, 
  theme 
}: UserManagementViewProps) => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <header className="flex justify-between items-end text-left">
      <div>
         <h2 className={cn("text-3xl font-black italic font-serif tracking-tight", theme === 'light' ? "text-slate-900" : "text-white")}>Quản trị người dùng</h2>
         <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Phân quyền & Điều phối dự án</p>
      </div>
      <button 
        onClick={onCreate}
        className="flex items-center gap-2 px-6 py-3 bg-festive-gold text-slate-900 rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-festive-gold/20 hover:scale-105 active:scale-95 transition-all outline-none"
      >
        <Plus size={16} /> Thêm tài khoản
      </button>
    </header>

    <div className={cn(
      "backdrop-blur-xl border rounded-[2.5rem] overflow-hidden shadow-2xl transition-all",
      theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900/40 border-slate-800"
    )}>
      <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
        <table className="w-full text-left">
          <thead>
            <tr className={cn(
              "border-b transition-all",
              theme === 'light' ? "bg-slate-50 border-slate-100" : "bg-slate-950/50 border-slate-800"
            )}>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Nhân sự</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Phòng ban</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest italic text-center">Quyền hạn</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest italic text-center">Dự án quản lý</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest italic text-center">Trạng thái</th>
              <th className="px-8 py-6 text-right"></th>
            </tr>
          </thead>
          <tbody className={cn(
            "divide-y transition-all",
            theme === 'light' ? "divide-slate-50" : "divide-slate-800/50"
          )}>
            {users.map((user, idx) => (
              <tr key={`${user.id}-${idx}`} className={cn(
                "group transition-all",
                theme === 'light' ? "hover:bg-slate-50" : "hover:bg-slate-800/20"
              )}>
                <td className="px-8 py-5 text-left">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center text-sm font-black text-white italic shadow-inner">
                      {(user.name || 'User').split(' ').pop()?.charAt(0)}
                    </div>
                    <div>
                      <p className={cn("text-sm font-bold", theme === 'light' ? "text-slate-800" : "text-slate-100")}>{user.name || 'Unknown'}</p>
                      <p className="text-[10px] text-slate-500 font-mono italic">@{user.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className={cn(
                    "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all",
                    user.dept === 'ADMIN' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                    user.dept === 'DIRECTOR' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                    user.dept === 'MANAGER' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                    user.dept === 'PTT' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    user.dept === 'KT' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    user.dept === 'PTDA' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-slate-700 text-slate-400 border-slate-600'
                  )}>
                    {user.dept}
                  </span>
                </td>
                <td className="px-8 py-5 text-center">
                  <span className={cn(
                    "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border",
                    user.permission === 'FULL' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                    user.permission === 'EDIT' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  )}>
                    {user.permission === 'FULL' ? 'Toàn quyền' : user.permission === 'EDIT' ? 'Được sửa' : 'Chỉ xem'}
                  </span>
                </td>
                <td className="px-8 py-5 text-center">
                  <span className="text-xs font-black text-slate-500 italic">{(user.assignedProjectIds || []).length} Dự án</span>
                </td>
                <td className="px-8 py-5 text-center">
                   <div className="flex items-center justify-center gap-2">
                     <span className={cn("inline-block w-1.5 h-1.5 rounded-full shadow-sm", user.status === 'Active' ? 'bg-emerald-400 shadow-emerald-400/50' : 'bg-slate-600')} />
                     <span className="text-[10px] font-black uppercase text-slate-400">{user.status}</span>
                   </div>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                     <button 
                      onClick={() => onResetPassword(user)}
                      className="p-2 rounded-lg bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white transition-all shadow-lg border border-orange-500/20"
                      title="Reset mật khẩu"
                     >
                       <Key size={14} />
                     </button>
                     <button 
                      onClick={() => onEdit(user)}
                      className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all shadow-lg"
                     >
                       <Settings size={14} />
                     </button>
                     <button 
                      onClick={() => onDelete(user.id)}
                      className="p-2 rounded-lg bg-slate-800 text-rose-500/70 hover:bg-rose-500 hover:text-white transition-all shadow-lg"
                     >
                       <Trash2 size={14} />
                     </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export default UserManagementView;
