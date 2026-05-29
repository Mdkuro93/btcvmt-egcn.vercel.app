import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Dept, UserPermission } from '../../types';
import { cn } from '../../lib/utils';
import { X, User, Key, Building, Phone, Save, CheckCircle, ArrowRight } from 'lucide-react';

export const UserManagementModal = ({
  isUserModalOpen,
  setIsUserModalOpen,
  theme,
  editUser,
  setEditUser,
  handleUpdateUser,
  handleCreateUser,
  newUser,
  setNewUser,
  projects
}: any) => {

  return (
<>
       {/* User Management Modal */}
       <AnimatePresence>
         {isUserModalOpen && (
           <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUserModalOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-slate-900 rounded-[2.5rem] p-8 border border-slate-700 z-[101] shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8">
                 <button onClick={() => setIsUserModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                    <ArrowRight className="rotate-45" size={24} />
                 </button>
              </div>

              <div className="mb-8">
                <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-600/20 mb-4">
                  <User size={32} className="text-white" />
                </div>
                <h3 className="text-2xl font-black text-white font-serif italic tracking-tight">
                  {editUser ? 'Chỉnh sửa tài khoản' : 'Tạo tài khoản mới'}
                </h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Phân quyền vả quản lý người dùng</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                   <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Quyền hạn truy cập</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { val: 'VIEW', label: 'Chỉ xem', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
                        { val: 'EDIT', label: 'Được sửa', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
                        { val: 'FULL', label: 'Toàn quyền', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' }
                      ].map(p => (
                        <button 
                          key={p.val}
                          type="button"
                          onClick={() => editUser ? setEditUser({...editUser, permission: p.val as UserPermission}) : setNewUser({...newUser, permission: p.val as UserPermission})}
                          className={cn(
                            "py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                            (editUser ? editUser.permission : newUser.permission) === p.val 
                              ? p.color + " ring-2 ring-offset-2 ring-offset-slate-900 ring-indigo-500/50" 
                              : "bg-slate-950 border-slate-800 text-slate-500"
                          )}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Họ và tên</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                      value={editUser ? editUser.name : newUser.name}
                      onChange={(e) => editUser ? setEditUser({...editUser, name: e.target.value}) : setNewUser({...newUser, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Username</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                      value={editUser ? editUser.username : newUser.username}
                      onChange={(e) => editUser ? setEditUser({...editUser, username: e.target.value}) : setNewUser({...newUser, username: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Email nội bộ</label>
                    <input 
                      type="email" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                      value={editUser ? editUser.email : newUser.email}
                      onChange={(e) => editUser ? setEditUser({...editUser, email: e.target.value}) : setNewUser({...newUser, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Mật khẩu</label>
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                      value={editUser ? editUser.password || '' : newUser.password}
                      onChange={(e) => editUser ? setEditUser({...editUser, password: e.target.value}) : setNewUser({...newUser, password: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Phòng ban / Vai trò</label>
                    <select 
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                      value={editUser ? editUser.dept : newUser.dept}
                      onChange={(e) => editUser ? setEditUser({...editUser, dept: e.target.value as Dept}) : setNewUser({...newUser, dept: e.target.value as Dept})}
                    >
                      <option value="PTT">Chuyên viên PTT</option>
                      <option value="KT">Chuyên viên Kế toán</option>
                      <option value="PTDA">Chuyên viên PTDA</option>
                      <option value="MANAGER_PTT">Quản lý bộ phận PTT (MANAGER_PTT)</option>
                      <option value="MANAGER_KT">Quản lý bộ phận KT (MANAGER_KT)</option>
                      <option value="MANAGER_PTDA">Quản lý bộ phận PTDA (MANAGER_PTDA)</option>
                      <option value="MANAGER_ALL">Quản lý cả 3 bộ phận (MANAGER_ALL)</option>
                      <option value="MANAGER">Trưởng phòng chung (MANAGER)</option>
                      <option value="DIRECTOR">Lãnh đạo Sunshine (Ban Lãnh đạo)</option>
                      <option value="ADMIN">Quản trị viên (Admin)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Trạng thái</label>
                    <select 
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                      value={editUser ? editUser.status : newUser.status}
                      onChange={(e) => editUser ? setEditUser({...editUser, status: e.target.value as any}) : setNewUser({...newUser, status: e.target.value as any})}
                    >
                      <option value="Active">Đang hoạt động</option>
                      <option value="Inactive">Ngừng kích hoạt</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Dự án được phân quyền</label>
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 max-h-40 overflow-y-auto custom-scrollbar grid grid-cols-2 gap-2">
                    {projects.map((project, index) => {
                      const isAssigned = editUser 
                        ? (editUser.assignedProjectIds || []).includes(project.id)
                        : newUser.assignedProjectIds.includes(project.id);
                      
                      return (
                        <label key={`project-assign-${project.id}-${index}`} className="flex items-center gap-2 p-2 hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors">
                          <input 
                            type="checkbox"
                            className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500/20"
                            checked={isAssigned}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              if (editUser) {
                                const currentIds = editUser.assignedProjectIds || [];
                                const nextIds = checked 
                                  ? [...currentIds, project.id]
                                  : currentIds.filter(id => id !== project.id);
                                setEditUser({...editUser, assignedProjectIds: nextIds});
                              } else {
                                const currentIds = newUser.assignedProjectIds;
                                const nextIds = checked 
                                  ? [...currentIds, project.id]
                                  : currentIds.filter(id => id !== project.id);
                                setNewUser({...newUser, assignedProjectIds: nextIds});
                              }
                            }}
                          />
                          <span className="text-xs text-slate-300 truncate">{project.name}</span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-600 italic px-1">Lưu ý: Admin/Lãnh đạo luôn có quyền xem tất cả dự án.</p>
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <button 
                  onClick={() => setIsUserModalOpen(false)}
                  className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-all"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={editUser ? handleUpdateUser : handleCreateUser}
                  className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold shadow-xl shadow-indigo-600/20 transition-all font-serif italic"
                >
                  {editUser ? 'Cập nhật tài khoản' : 'Kích hoạt tài khoản'}
                </button>
              </div>
            </motion.div>
           </>
         )}
       </AnimatePresence>
</>
  );
};
