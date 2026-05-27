const fs = require('fs');

let content = fs.readFileSync('src/components/Sidebar.tsx', 'utf-8');

const header = `import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Project } from '../types';
import { cn } from '../lib/utils';
import { 
  ChevronLeft, LayoutDashboard, Folders, FileText, PieChart, Database, UserCode, 
  Settings, LogOut, Sun, Moon, Hash, ChevronDown, CheckCircle, Activity, ChevronRight
} from 'lucide-react';

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
  handleLogout
}: any) => {

  const NAV_ITEMS = [
    { id: 'dashboard', label: 'TỔNG QUAN', icon: LayoutDashboard, depts: ['ALL'] },
    { id: 'applications', label: 'HỒ SƠ CẤP GCN', icon: Folders, depts: ['ALL'] },
    { id: 'projects', label: 'VÙNG & DỰ ÁN', icon: FileText, depts: ['PTT', 'ADMIN', 'BGD', 'PTCT'] },
    { id: 'reports', label: 'BÁO CÁO NHANH', icon: PieChart, depts: ['ALL'] },
    { id: 'resources', label: 'DANH MỤC THUẾ', icon: Database, depts: ['PTT', 'ADMIN', 'PTDA'] },
    { id: 'users', label: 'PHÂN QUYỀN', icon: UserCode, depts: ['ADMIN'] },
    { id: 'settings', label: 'SLA & CẤU HÌNH', icon: Settings, depts: ['ADMIN', 'PTT'] }
  ];

  const visibleNavItems = NAV_ITEMS.filter(it => it.depts.includes('ALL') || it.depts.includes(userRole));

  return (
<>
`;

const footer = `
</>
  );
};
`;

fs.writeFileSync('src/components/Sidebar.tsx', header + content.replace(/\{NAV_ITEMS\.filter[^\}]+\.map/g, "{visibleNavItems.map") + footer);
