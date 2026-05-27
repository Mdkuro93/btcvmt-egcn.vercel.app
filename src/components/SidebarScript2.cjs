const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8').split('\n').slice(5486, 5861).join('\n');

const header = `import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { 
  ChevronLeft, LayoutDashboard, Folders as Files, FileText, PieChart as FileBarChart, Database as Briefcase, UserCode as Users, 
  Settings, LogOut, Sun, Moon, Hash, ChevronDown, CheckCircle, Activity, ChevronRight, Folder
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
  handleLogout,
  isManagement,
  hasSettingsAccess,
  hasUserAccess
}: any) => {

  return (
<>
`;

const footer = `
</>
  );
};
`;

fs.writeFileSync('src/components/Sidebar.tsx', header + content + footer);
