import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  LayoutDashboard, 
  Files, 
  FileBarChart, 
  HelpCircle, 
  User, 
  Settings, 
  Search, 
  Map as MapIcon,
  Folder,
  ChevronDown,
  LogOut,
  Moon,
  Sun
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Project, UserProfile } from '../types';
import { REGION_ORDER } from '../constants';

interface SidebarProps {
  theme: 'light' | 'dark';
  activeTab: string;
  setActiveTab: (tab: any) => void;
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile | null) => void;
  onThemeToggle: () => void;
  projects: Project[];
  selectedProjectId: string | null;
  onProjectSelect: (id: string | null) => void;
}

export default function Sidebar({
  theme,
  activeTab,
  setActiveTab,
  currentUser,
  setCurrentUser,
  onThemeToggle,
  projects,
  selectedProjectId,
  onProjectSelect
}: SidebarProps) {
  const [projectSearch, setProjectSearch] = useState('');
  const [expandedRegions, setExpandedRegions] = useState<Record<string, boolean>>({});

  const userRole = currentUser.dept;

  const visibleProjects = useMemo(() => {
    let baseProjects = projects;
    if (userRole !== 'ADMIN' && userRole !== 'DIRECTOR') {
      baseProjects = projects.filter(p => currentUser.assignedProjectIds?.includes(p.id));
    }
    
    return baseProjects.filter(p => 
      p.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
      (p.region || '').toLowerCase().includes(projectSearch.toLowerCase())
    ).sort((a, b) => {
      const idxA = REGION_ORDER.indexOf(a.region || '');
      const idxB = REGION_ORDER.indexOf(b.region || '');
      if (idxA === -1 && idxB === -1) return (a.region || '').localeCompare(b.region || '');
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      if (idxA !== idxB) return idxA - idxB;
      return a.name.localeCompare(b.name);
    });
  }, [projects, currentUser, userRole, projectSearch]);

  const projectsByRegion = useMemo(() => {
    const grouped: Record<string, Project[]> = {};
    visibleProjects.forEach(p => {
      const region = p.region || 'Khác';
      if (!grouped[region]) grouped[region] = [];
      grouped[region].push(p);
    });
    return grouped;
  }, [visibleProjects]);

  const toggleRegion = (region: string) => {
    setExpandedRegions(prev => ({ ...prev, [region]: !prev[region] }));
  };

  const navItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'applications', label: 'Hồ sơ', icon: Files },
    { id: 'resources', label: 'Biểu mẫu', icon: Folder },
    { id: 'reports', label: 'Báo cáo', icon: FileBarChart },
    { id: 'users', label: 'Người dùng', icon: User, roles: ['ADMIN'] },
    { id: 'settings', label: 'Cấu hình', icon: Settings, roles: ['ADMIN'] },
  ];

  return (
    <aside className={cn(
      "w-64 flex flex-col border-r transition-all duration-300",
      theme === 'dark' ? "glass-card border-slate-800" : "glass-card border-slate-200"
    )}>
      {/* Brand */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-transparent">
        <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white font-black italic">S</div>
        <div>
          <h2 className="text-sm font-black uppercase tracking-tighter leading-none">Sunshine</h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">GCN Management</p>
        </div>
      </div>

      {/* User Info */}
      <div className="p-6">
        <div className={cn(
          "p-4 rounded-2xl flex items-center gap-3 transition-colors",
          theme === 'dark' ? "bg-slate-900/50 hover:bg-slate-800/50" : "bg-slate-100 hover:bg-slate-200"
        )}>
          <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold shadow-lg shadow-amber-500/20">
            {currentUser.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold truncate">{currentUser.name}</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase">{userRole}</p>
          </div>
          <button 
            onClick={() => setCurrentUser(null)}
            className="ml-auto p-2 text-slate-400 hover:text-rose-500 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 space-y-1 custom-scrollbar">
        {navItems.map(item => {
          if (item.roles && !item.roles.includes(userRole)) return null;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all relative group",
                isActive 
                  ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" 
                  : "text-slate-500 hover:bg-slate-800/10 hover:text-amber-500"
              )}
            >
              <item.icon size={18} />
              {item.label}
              {isActive && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
                />
              )}
            </button>
          );
        })}

        <div className="pt-6 pb-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-4 mb-2">Dự án</p>
          <div className="relative mx-4 mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input 
              type="text"
              placeholder="Tìm dự án..."
              className={cn(
                "w-full pl-9 pr-3 py-2 rounded-lg text-[10px] font-bold outline-none border transition-all",
                theme === 'dark' ? "bg-slate-900 border-slate-800 focus:border-amber-500" : "bg-white border-slate-200 focus:border-amber-500"
              )}
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
            />
          </div>

          <div className="space-y-1">
             <button 
               onClick={() => onProjectSelect(null)}
               className={cn(
                 "w-full flex items-center gap-3 px-4 py-2 rounded-lg text-[10px] font-bold transition-all",
                 !selectedProjectId ? "text-amber-500 bg-amber-500/10" : "text-slate-500 hover:bg-slate-800/10 hover:text-amber-500"
               )}
             >
               <MapIcon size={14} />
               Tất cả dự án
             </button>

             {(Object.entries(projectsByRegion) as [string, Project[]][]).map(([region, regionProjects]) => (
               <div key={region} className="space-y-0.5">
                  <button 
                    onClick={() => toggleRegion(region)}
                    className="w-full flex items-center justify-between px-4 py-2 text-[10px] font-bold text-slate-500 hover:text-amber-500 transition-colors group"
                  >
                    <span className="truncate">{region}</span>
                    <ChevronDown size={14} className={cn("transition-transform group-hover:text-amber-500", expandedRegions[region] && "rotate-180")} />
                  </button>
                  <AnimatePresence>
                    {expandedRegions[region] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden space-y-0.5 ml-4 border-l border-slate-800/50"
                      >
                        {regionProjects.map(proj => (
                          <button
                            key={proj.id}
                            onClick={() => onProjectSelect(proj.id)}
                            className={cn(
                              "w-full flex items-center gap-2 px-4 py-2 text-[10px] font-bold transition-all truncate text-left",
                              selectedProjectId === proj.id ? "text-amber-500" : "text-slate-500 hover:text-amber-400 hover:bg-slate-800/10 rounded-lg"
                            )}
                          >
                            <div className={cn("w-1 h-1 rounded-full", selectedProjectId === proj.id ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" : "bg-slate-700")} />
                            {proj.name}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>
             ))}
          </div>
        </div>
      </nav>

      {/* Theme Toggle */}
      <div className="p-4 border-t border-slate-800/50">
        <button 
          onClick={onThemeToggle}
          className={cn(
            "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all",
            theme === 'dark' ? "bg-slate-900 border border-slate-800" : "bg-slate-100 border border-slate-200"
          )}
        >
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Chế độ tối</span>
          {theme === 'dark' ? <Moon size={16} className="text-amber-500" /> : <Sun size={16} className="text-amber-500" />}
        </button>
      </div>
    </aside>
  );
}
