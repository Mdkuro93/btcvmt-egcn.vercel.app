import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { 
  ChevronLeft, LayoutDashboard, Folders as Files, FileText, PieChart as FileBarChart, Database as Briefcase, UserCog as Users, 
  Settings, LogOut, Sun, Moon, Hash, ChevronDown, CheckCircle, Activity, ChevronRight, Folder, ShieldCheck, HelpCircle, MapIcon, Search,
  User, Building2
} from 'lucide-react';
import { Project } from '../types';
import { REGION_ORDER } from '../constants';

export const Sidebar = ({
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  theme,
  setTheme,
  activeTab,
  setActiveTab,
  userRole,
  isManagementEdit,
  projects,
  selectedProjectId,
  setSelectedProjectId,
  expandedSidebarRegions,
  setExpandedSidebarRegions,
  currentUser,
  realtimeStatus,
  handleLogout,
  isManagement,
  hasSettingsAccess,
  hasUserAccess,
  setIsFieldMode,
  visibleProjects,
  toggleSidebarRegion
}: any) => {

  const [projectSearch, setProjectSearch] = useState('');

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarCollapsed(true);
    }
  };

  const handleProjectClick = (projectId: string | null) => {
    setSelectedProjectId(projectId);
    if (activeTab !== 'applications' && activeTab !== 'reports') {
      setActiveTab('dashboard');
    }
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarCollapsed(true);
    }
  };

  return (
<>
      {/* Sidebar - Enhanced Blur and border */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isSidebarCollapsed 
            ? (typeof window !== 'undefined' && window.innerWidth < 1024 ? 0 : 80) 
            : 256,
          x: (isSidebarCollapsed && typeof window !== 'undefined' && window.innerWidth < 1024) ? -260 : 0
        }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
          "backdrop-blur-2xl border-r flex flex-col shrink-0 bg-[var(--color-bg-primary)] border-slate-700 shadow-2xl transition-all duration-300",
          "lg:relative fixed inset-y-0 left-0 h-full lg:z-40 z-50"
        )}
      >
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3.5 top-8 p-1.5 rounded-full bg-slate-700 border border-slate-600 text-slate-300 hover:text-[var(--color-text-primary)] hover:bg-slate-600 transition-colors z-50 shadow-md lg:block hidden"
        >
          <ChevronLeft size={16} className={cn("transition-transform duration-300", isSidebarCollapsed && "rotate-180")} />
        </button>
        <div className={cn(
          "p-4 sm:p-6 border-b mb-4 flex items-center gap-3 transition-colors",
          theme === 'light' 
            ? "border-slate-200 bg-gradient-to-br from-slate-100/30 to-transparent" 
            : "border-slate-800/50 bg-gradient-to-br from-slate-800/30 to-transparent",
          isSidebarCollapsed ? "px-5" : "px-4 sm:px-6"
        )}>
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_-5px_rgba(245,158,11,0.5)] border border-white/20 shrink-0">
            <ShieldCheck className="text-[var(--color-text-primary)]" size={24} strokeWidth={1.5} />
          </div>
          <AnimatePresence>
            {!isSidebarCollapsed && (
              <motion.div 
                initial={{ opacity: 0, width: 0 }} 
                animate={{ opacity: 1, width: 'auto' }} 
                exit={{ opacity: 0, width: 0 }} 
                className="overflow-hidden whitespace-nowrap"
              >
                 <h1 className="font-bold text-xl tracking-tight text-[var(--color-text-primary)] font-sans">GCN Tracker</h1>
                 <p className={cn("text-xs uppercase font-bold tracking-[0.2em] leading-none text-slate-400")}>Regional</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 flex flex-col overflow-y-auto lg:overflow-hidden px-4 space-y-1.5 custom-scrollbar">
          <div className="space-y-1 flex-shrink-0">
          <button 
            onClick={() => handleTabClick('dashboard')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 font-bold text-sm",
              isSidebarCollapsed ? "justify-center px-0" : "px-4",
              activeTab === 'dashboard'                
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-[var(--color-text-primary)] shadow-[0_0_15px_-3px_rgba(245,158,11,0.4)]" 
                : "text-slate-300 hover:bg-slate-700 hover:text-[var(--color-text-primary)]"
            )}
          >
            <LayoutDashboard size={18} />
            
            <AnimatePresence>
              {!isSidebarCollapsed && (
                <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="whitespace-nowrap overflow-hidden">
                  Dashboard
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          <button 
            onClick={() => handleTabClick('applications')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 font-bold text-sm",
              activeTab === 'applications' 
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-[var(--color-text-primary)] shadow-[0_0_15px_-3px_rgba(245,158,11,0.4)]" 
                : "text-slate-300 hover:bg-slate-700 hover:text-[var(--color-text-primary)]"
            )}
          >
            <Files size={18} />
            
            <AnimatePresence>
              {!isSidebarCollapsed && (
                <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="whitespace-nowrap overflow-hidden">
                  Quản lý Hồ sơ
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {isManagement && (
            <button 
              onClick={() => handleTabClick('reports')}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 font-bold text-sm",
                activeTab === 'reports' 
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-[var(--color-text-primary)] shadow-[0_0_15px_-3px_rgba(245,158,11,0.4)]" 
                  : "text-slate-300 hover:bg-slate-700 hover:text-[var(--color-text-primary)]"
              )}
            >
              <FileBarChart size={18} />
              
            <AnimatePresence>
              {!isSidebarCollapsed && (
                <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="whitespace-nowrap overflow-hidden">
                  Báo cáo & Thống kê
                </motion.span>
              )}
            </AnimatePresence>
            </button>
          )}

          <button 
            onClick={() => handleTabClick('resources')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 font-bold text-sm",
              activeTab === 'resources' 
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-[var(--color-text-primary)] shadow-[0_0_15px_-3px_rgba(245,158,11,0.4)]" 
                : "text-slate-300 hover:bg-slate-700 hover:text-[var(--color-text-primary)]"
            )}
          >
            <HelpCircle size={18} />
            
            <AnimatePresence>
              {!isSidebarCollapsed && (
                <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="whitespace-nowrap overflow-hidden">
                  Tra cứu & Biểu mẫu
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          
          {userRole === 'ADMIN' && (
            <>
              <button 
                onClick={() => handleTabClick('users')}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 font-bold text-sm",
                  activeTab === 'users' 
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-[var(--color-text-primary)] shadow-[0_0_15px_-3px_rgba(245,158,11,0.4)]" 
                    : "text-slate-300 hover:bg-slate-700 hover:text-[var(--color-text-primary)]"
                )}
              >
                <User size={18} />
                
            <AnimatePresence>
              {!isSidebarCollapsed && (
                <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="whitespace-nowrap overflow-hidden">
                  Quản trị Người dùng
                </motion.span>
              )}
            </AnimatePresence>
              </button>
              <button 
                onClick={() => handleTabClick('projects')}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 font-bold text-sm",
                  activeTab === 'projects' 
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-[var(--color-text-primary)] shadow-[0_0_15px_-3px_rgba(245,158,11,0.4)]" 
                    : "text-slate-300 hover:bg-slate-700 hover:text-[var(--color-text-primary)]"
                )}
              >
                <Building2 size={18} />
                
            <AnimatePresence>
              {!isSidebarCollapsed && (
                <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="whitespace-nowrap overflow-hidden">
                  Quản lý Dự án
                </motion.span>
              )}
            </AnimatePresence>
              </button>
              <button 
                onClick={() => handleTabClick('settings')}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 font-bold text-sm",
                  activeTab === 'settings' 
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-[var(--color-text-primary)] shadow-[0_0_15px_-3px_rgba(245,158,11,0.4)]" 
                    : "text-slate-300 hover:bg-slate-700 hover:text-[var(--color-text-primary)]"
                )}
              >
                <Settings size={18} />
                
            <AnimatePresence>
              {!isSidebarCollapsed && (
                <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="whitespace-nowrap overflow-hidden">
                  Cấu hình hệ thống
                </motion.span>
              )}
            </AnimatePresence>
              </button>
            </>
          )}

          <div className="pt-3 mt-3 border-t border-slate-700/50">
            <button 
              onClick={() => {
                setIsFieldMode(true);
                if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                  setIsSidebarCollapsed(true);
                }
              }}
              title="Field Portal (Mobile)"
              className={cn(
                "w-full flex items-center gap-3 py-2.5 px-4 rounded-xl transition-all duration-200 font-bold text-[11px] uppercase tracking-wider overflow-hidden",
                isSidebarCollapsed ? "justify-center px-0" : "px-4",
                "bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 hover:bg-indigo-600/20"
              )}
            >
              <LayoutDashboard size={14} className="shrink-0" />
              <AnimatePresence>
                {!isSidebarCollapsed && (
                  <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="whitespace-nowrap overflow-hidden">
                    Field Portal (Mobile)
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
          </div>

          <div className={cn("pt-4 border-t border-slate-700/50 mt-4 pb-2 transition-all flex-shrink-0", isSidebarCollapsed ? "px-4" : "px-6")}>
            <AnimatePresence mode="popLayout">
              {!isSidebarCollapsed ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Khu vực & Dự án</p>
                  </div>
                  <div className="relative mb-4 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={12} />
                    <input 
                      type="text"
                      placeholder="Tìm nhanh..."
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      className={cn(
                        "w-full bg-slate-800/20 border border-slate-800/50 rounded-xl pl-9 pr-4 py-2 text-[10px] font-bold focus:outline-none focus:border-festive-gold/30 transition-all",
                        theme === 'light' ? "bg-slate-100 border-slate-200 text-slate-900" : "text-white"
                      )}
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center mb-4">
                  <button onClick={() => setIsSidebarCollapsed(false)} className="p-2 text-slate-500 hover:text-white transition-colors" title="Tìm dự án">
                    <Search size={16} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="lg:flex-1 lg:overflow-y-auto overflow-visible custom-scrollbar px-1 space-y-4 pb-6">
            <button 
              onClick={() => handleProjectClick(null)}
              title="Tất cả dự án"
              className={cn(
                "w-full flex items-center gap-3 py-2.5 rounded-xl transition-all text-sm font-black uppercase tracking-tight overflow-hidden",
                isSidebarCollapsed ? "justify-center px-0" : "px-4",
                selectedProjectId === null 
                  ? (theme === 'light' ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200" : "bg-slate-800/80 text-festive-gold ring-1 ring-slate-700")
                  : (theme === 'light' ? "text-slate-500 hover:bg-slate-50" : "text-slate-400 hover:bg-slate-800/50")
              )}
            >
              <MapIcon size={16} className={cn("shrink-0", selectedProjectId === null ? (theme === 'light' ? "text-indigo-600" : "text-festive-gold") : "text-slate-500")} />
              <AnimatePresence>
                {!isSidebarCollapsed && (
                  <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="truncate whitespace-nowrap overflow-hidden">
                    Tất cả dự án
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            
            {(Object.entries(
              (visibleProjects || [])
                .filter(p => {
                  const matchesSearch = String(p.name || '').toLowerCase().includes(projectSearch.toLowerCase()) || 
                                      String(p.region || '').toLowerCase().includes(projectSearch.toLowerCase());
                  return matchesSearch;
                })
                .reduce((acc, p) => {
                  const reg = p.region || 'Khác';
                  if (!acc[reg]) acc[reg] = [];
                  acc[reg].push(p);
                  return acc;
                }, {} as Record<string, Project[]>)
            ) as [string, Project[]][])
            .sort(([a], [b]) => {
              const idxA = REGION_ORDER.indexOf(a);
              const idxB = REGION_ORDER.indexOf(b);
              if (idxA === -1 && idxB === -1) return a.localeCompare(b);
              if (idxA === -1) return 1;
              if (idxB === -1) return -1;
              return idxA - idxB;
            })
            .map(([region, regionProjects], regIndex) => (
              <div key={`side-reg-${region}-${regIndex}`} className="space-y-1">
                <button 
                  onClick={() => toggleSidebarRegion(region)}
                  title={region}
                  className={cn(
                    "w-full flex items-center justify-between py-2 rounded-xl transition-all group overflow-hidden",
                    isSidebarCollapsed ? "justify-center px-0" : "px-3",
                    theme === 'light' ? "hover:bg-slate-100" : "hover:bg-slate-800/40",
                    expandedSidebarRegions[region] && (theme === 'light' ? "bg-slate-100" : "bg-slate-800/30")
                  )}
                >
                  <div className={cn("flex items-center gap-2 overflow-hidden", isSidebarCollapsed && "justify-center")}>
                    <Folder size={16} className={cn(
                      "shrink-0 transition-colors",
                      expandedSidebarRegions[region] ? "text-festive-gold" : "text-slate-500"
                    )} />
                    <AnimatePresence>
                      {!isSidebarCollapsed && (
                        <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className={cn(
                          "text-xs font-bold uppercase tracking-wider truncate transition-colors whitespace-nowrap",
                          expandedSidebarRegions[region] ? (theme === 'light' ? "text-slate-900" : "text-white") : "text-slate-500"
                        )}>{region}</motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <AnimatePresence>
                    {!isSidebarCollapsed && (
                      <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}>
                        <ChevronDown size={10} className={cn(
                          "text-slate-600 transition-transform duration-300 shrink-0",
                          expandedSidebarRegions[region] ? "rotate-180" : "rotate-0"
                        )} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
                
                <AnimatePresence>
                  {expandedSidebarRegions[region] && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-1 pl-4"
                    >
                      {regionProjects.map((p, pIndex) => (
                        <button 
                          key={`sidebar-proj-${region}-${p.id}-${pIndex}`} 
                          title={p.name}
                          onClick={() => handleProjectClick(p.id)}
                          className={cn(
                            "w-full flex items-center gap-3 py-2.5 rounded-xl transition-all text-sm font-black group relative overflow-hidden",
                            isSidebarCollapsed ? "justify-center px-0 ml-[-12px]" : "px-4",
                            selectedProjectId === p.id 
                              ? (theme === 'light' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "bg-slate-800/80 text-festive-gold ring-1 ring-slate-700") 
                              : (theme === 'light' ? "text-slate-500 hover:bg-white hover:shadow-sm" : "text-slate-400 hover:bg-slate-800/50")
                          )}
                        >
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full shrink-0 transition-transform group-hover:scale-125",
                            selectedProjectId === p.id 
                              ? (theme === 'light' ? "bg-white" : "bg-festive-gold") 
                              : (theme === 'light' ? "bg-slate-300" : "bg-slate-700")
                          )} />
                          <AnimatePresence>
                            {!isSidebarCollapsed && (
                              <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="truncate max-w-[140px] uppercase tracking-tight whitespace-nowrap">
                                {p.name}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </nav>
      </motion.aside>
</>
  );
};
