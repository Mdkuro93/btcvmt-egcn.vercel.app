const fs = require('fs');

let content = fs.readFileSync('src/components/tabs/ApplicationsTab.tsx', 'utf-8');

const header = `import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { StatusBadge } from '../AppSubComponents';
import { 
  Building, Clock, FileText, CheckCircle, AlertTriangle, Play, FastForward, Inbox, ChevronDown, Check, Target, Activity, Zap,
  Search, Printer, Filter, X, FileSpreadsheet, Trash2, MessageSquare, GitMerge, RotateCcw, User, ArrowUp, ArrowDown, RefreshCcw
} from 'lucide-react';

export const ApplicationsTab = ({
  activeTab, 
  userRole, 
  theme, 
  isTableDense, 
  setIsTableDense, 
  searchQuery, 
  setSearchQuery, 
  bulkTransitionTarget, 
  setBulkTransitionTarget, 
  bulkTransitionLocation, 
  setBulkTransitionLocation, 
  bulkTransitionField, 
  setBulkTransitionField,
  dashboardApps,
  applications,
  dashboardFilter,
  selectedProject,
  projects,
  visibleApps,
  displayedApps,
  selectedRows,
  setSelectedRows,
  handleSelectApp,
  handleQuickSave,
  handleSpreadsheetChange,
  handleSpreadsheetPaste,
  handleDownloadTemplate,
  handleParseTemplate,
  handleBulkPrint,
  handleBulkDelete,
  handleBulkResolveIssues,
  handleToggleChecklist,
  setIsHandoverTicketOpen,
  setIsBulkDocumentModalOpen,
  setIsBulkNoteModalOpen,
  checklistTemplates,
  quickEditId,
  quickEditData,
  setQuickEditId,
  setQuickEditData,
  activeCell,
  setActiveCell,
  spreadsheetChanges,
  spreadsheetErrors,
  formErrors,
  conflictWarning,
  canCreate,
  canEdit,
  stepConfig,
  getTaxStatus,
  getOverdueInfo,
  calculateDaysDiff,
  selectedProjectId,
  setSelectedProjectId,
  filterStatus,
  setFilterStatus,
  filterLoanStatus,
  setFilterLoanStatus,
  filterSelfService,
  setFilterSelfService,
  filterIssue,
  setFilterIssue,
  filterSLAStatus,
  setFilterSLAStatus,
  selectedFlags,
  setSelectedFlags,
  sortConfig,
  setSortConfig,
  currentPage,
  setCurrentPage,
  pageSize,
  setPageSize,
  isFieldMode,
  setIsFieldMode,
  isAdvancedFiltersOpen,
  setIsAdvancedFiltersOpen,
  handleSort,
  paginatedApps,
  totalPages,
  tableRowRefs,
  highlightedAppId,
  selectedIndex,
  setSelectedIndex,
  lastSelectedIndex,
  setLastSelectedIndex,
  currentUser,
  userCanEdit,
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

fs.writeFileSync('src/components/tabs/ApplicationsTab.tsx', header + content + footer);
