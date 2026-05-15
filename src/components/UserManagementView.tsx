import React from 'react';
import { Users, Plus, Shield, Search, MoreVertical, Edit2, Trash2, Key } from 'lucide-react';
import { UserProfile } from '../types';
import { cn } from '../lib/utils';

interface UserManagementViewProps {
  theme: 'light' | 'dark';
  users: UserProfile[];
  onAddUser: () => void;
  onEditUser: (user: UserProfile) => void;
  onDeleteUser: (id: string) => void;
  onResetPassword: (id: string) => void;
}

export default function UserManagementView({ 
  theme, users, onAddUser, onEditUser, onDeleteUser, onResetPassword 
}: UserManagementViewProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight">Quản trị nhân sự</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Quản lý quyền hạn & Tiếp cận hệ thống</p>
        </div>
        
        <button 
          onClick={onAddUser}
          className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20"
        >
          <Plus size={16} />
          Thêm người dùng
        </button>
      </div>

      <div className={cn(
        "rounded-3xl border overflow-hidden",
        theme === 'dark' ? "bg-slate-900/40 border-slate-800/60" : "bg-white border-slate-200"
      )}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={cn(
               "border-b text-[10px] font-black uppercase tracking-widest",
               theme === 'dark' ? "border-slate-800/60 text-slate-500" : "border-slate-100 text-slate-400"
            )}>
              <th className="px-6 py-4">Nhân viên</th>
              <th className="px-6 py-4">Phòng ban</th>
              <th className="px-6 py-4">Quyền hạn</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {users.map(user => (
              <tr key={user.id} className="group hover:bg-indigo-500/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold">{user.name}</p>
                      <p className="text-[10px] font-bold text-slate-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    {user.dept}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-indigo-500">
                    <Shield size={14} />
                    <span className="text-[10px] font-black uppercase tracking-wider">{user.permission}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-black uppercase",
                    user.status === 'Active' ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-500"
                  )}>
                    {user.status === 'Active' ? 'Hoạt động' : 'Khóa'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                   <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onResetPassword(user.id)} className="p-2 text-amber-500 hover:bg-amber-500/10 rounded-lg">
                         <Key size={14} />
                      </button>
                      <button onClick={() => onEditUser(user)} className="p-2 text-indigo-500 hover:bg-indigo-500/10 rounded-lg">
                         <Edit2 size={14} />
                      </button>
                      <button onClick={() => onDeleteUser(user.id)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg">
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
  );
}
