import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { StatusBadge } from '../AppSubComponents';
import { Application } from '../../types';
import { formatDate } from '../../utils/dateUtils';
import { getNextStep } from '../../constants';
import { calculateSLA } from '../../utils/statusEngine';
import { 
  Building, Clock, FileText, CheckCircle, AlertTriangle, Play, FastForward, Inbox, ChevronDown, Check, Target, Activity, Zap,
  Search, Printer, Filter, X, FileSpreadsheet, Trash2, MessageSquare, GitMerge, RotateCcw, User, ArrowUp, ArrowDown, RefreshCcw,
  Files, ChevronRight, AlertCircle, UserCheck
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
  selectedFlags = [],
  setSelectedFlags = () => {},
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
  hasUserAccess,
  setIsBulkNoteOpen,
  setIsBulkDocumentOpen,
  setIsBulkIssueOpen,
  users,
  isBulkAssignOpen,
  setIsBulkAssignOpen,
  bulkAssignUserId,
  setBulkAssignUserId,
  handleBulkAssign,
  canBulkAssign,
  assignableUsers,
  selectedAppIds,
  setSelectedAppIds,
  isSavingApp,
  isManagementEdit,
  isFieldEditable,
  filteredApps,
  isSpreadsheetMode,
  setIsSpreadsheetMode,
  EDITABLE_DATE_FIELDS,
  isLoadingApps,
  slaConfig,
  INITIAL_STEP_CONFIG,
  handleResolveIssue,
  setPreviewFile,
  handleDeleteApp,
  setSpreadsheetChanges,
  setSpreadsheetErrors,
  confirmSpreadsheetUpdates,
  totalCount,
  search,
  setSearch,
  setIsShowFilters,
  isShowFilters,
  setDashboardFilter,
  handleBulkStepTransition,
  handleBulkRejectApps,
  filterDept,
  setFilterDept
}: any) => {

  const currentVisibleApps = React.useMemo(() => 
    displayedApps.slice(currentPage * pageSize, (currentPage + 1) * pageSize),
    [displayedApps, currentPage, pageSize]
  );

  const masterCheckboxRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (masterCheckboxRef.current) {
      const allOnPageSelected = currentVisibleApps.length > 0 && currentVisibleApps.every(app => selectedRows.has(app.id));
      const someOnPageSelected = currentVisibleApps.some(app => selectedRows.has(app.id));
      masterCheckboxRef.current.indeterminate = !allOnPageSelected && someOnPageSelected;
    }
  }, [currentVisibleApps, selectedRows]);

  return (
<>
            {activeTab === 'applications' && (
              <motion.div 
                key="applications"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full"
              >
                <div className={cn(
                  "backdrop-blur-md rounded-3xl shadow-2xl border transition-all overflow-hidden",
                  theme === 'light' ? "bg-white border-slate-200 shadow-slate-900/5" : "bg-slate-900/40 border-slate-800/50"
                )}>
                  <div className={cn("p-2 lg:p-3 border-b", theme === 'light' ? "border-[var(--color-border-subtle)]/50 shadow-inner bg-[var(--color-bg-primary)]/30" : "border-slate-800/50")}>
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className={cn("flex flex-wrap items-center gap-2 text-[10px] sm:text-[11px]", theme === 'light' ? "text-[var(--color-text-primary)]" : "text-slate-200")}>
                          <select 
                            value={pageSize}
                            onChange={(e) => {setPageSize(Number(e.target.value)); setCurrentPage(0);}}
                            className={cn("px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg text-[10px] outline-none font-bold", theme === 'light' ? "bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)]" : "bg-slate-800 text-slate-200 border border-slate-700")}
                          >
                            <option value={20}>20 / trang</option>
                            <option value={50}>50 / trang</option>
                            <option value={100}>100 / trang</option>
                          </select>
                          <div className={cn("flex items-center gap-1 sm:gap-2 font-bold", theme === 'light' ? "text-slate-600" : "text-slate-400")}>
                            <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} className={cn("p-1 transition-colors disabled:opacity-30", theme === 'light' ? "hover:text-indigo-600" : "hover:text-festive-gold")}>Trước</button>
                            <span className={cn("px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px]", theme === 'light' ? "bg-slate-200/50 text-slate-900" : "bg-slate-800 text-white")}>T. {currentPage + 1}</span>
                            <button onClick={() => setCurrentPage(p => ( (p+1)*pageSize < totalCount ? p + 1 : p))} disabled={(currentPage+1)*pageSize >= totalCount} className={cn("p-1 transition-colors disabled:opacity-30", theme === 'light' ? "hover:text-indigo-600" : "hover:text-festive-gold")}>Sau</button>
                          </div>
                          <span className="text-slate-500 font-bold italic opacity-70">Tổng: {totalCount.toLocaleString()} hồ sơ</span>
                        </div>

                        {/* Search Input inline on mobile/desktop */}
                        <div className="relative group w-full sm:w-48" title="Ctrl+K để focus nhanh">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                          <input 
                            type="text" 
                            data-search-input
                            placeholder="Tìm kiếm nhanh..." 
                            className={cn(
                              "pl-8 pr-12 py-1 sm:py-1.5 rounded-full text-[10px] font-bold transition-all w-full outline-none border tracking-tight",
                              theme === 'light' ? "bg-white border-slate-200 text-slate-800 focus:border-indigo-500/50 shadow-sm" : "bg-slate-950/40 border-slate-800 text-slate-200 focus:border-festive-gold/50"
                            )}
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setCurrentPage(0); }}
                          />
                          <kbd className={cn("absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 pointer-events-none select-none rounded px-1.5 py-0.5 text-[8px] font-mono leading-none border font-bold shadow-sm", theme === 'light' ? "bg-slate-50 text-slate-400 border-slate-200" : "bg-slate-800 text-slate-500 border-slate-700")}>Ctrl K</kbd>
                        </div>
                      </div>

                      {/* Horizontal Ribbon on mobile, flex row on desktop */}
                      <div className="flex flex-nowrap lg:flex-wrap items-center gap-2 overflow-x-auto lg:overflow-visible custom-scrollbar -mx-1 px-1 py-1 w-full lg:w-auto shrink-0 select-none">
                        {/* Sort buttons */}
                        <div className="flex items-center gap-1 flex-nowrap shrink-0">
                          <span className={cn(
                            "text-[9px] font-black uppercase tracking-wider whitespace-nowrap mr-1",
                            theme === 'dark' ? "text-slate-500" : "text-slate-400"
                          )}>
                            Sắp xếp:
                          </span>
                          {([
                            { field: 'smart', label: '🎯 Thông minh' },
                            { field: 'status', label: '📊 Trạng thái' },
                            { field: 'unitCode', label: '🏠 Mã lô' },
                            { field: 'customerName', label: '👤 Tên KH' },
                          ] as const).map(({ field, label }, idx) => (
                            <button
                              key={`sort-btn-${field}-${idx}`}
                              onClick={() => setSortConfig(prev => ({
                                field,
                                direction: prev.field === field && 
                                  prev.direction === 'asc' ? 'desc' : 'asc'
                              }))}
                              className={cn(
                                "px-2 py-1 rounded-lg border text-[9px] font-black shrink-0 whitespace-nowrap",
                                "transition-all uppercase tracking-wider",
                                sortConfig.field === field
                                  ? theme === 'dark'
                                    ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-400"
                                    : "bg-indigo-50 border-indigo-200 text-indigo-600"
                                  : theme === 'dark'
                                    ? "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                                    : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                              )}
                            >
                              {label}
                              {sortConfig.field === field && (
                                <span className="ml-0.5">
                                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>

                        <div className="h-4 w-px bg-slate-700/30 mx-1 shrink-0 lg:block hidden" />

                        {/* Department Filter (New) */}
                        <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
                          <span className={cn(
                            "text-[9px] font-black uppercase tracking-wider whitespace-nowrap",
                            theme === 'dark' ? "text-slate-500" : "text-slate-400"
                          )}>
                            Bộ phận:
                          </span>
                          <select
                            value={filterDept || 'ALL'}
                            onChange={(e) => { setFilterDept(e.target.value); setCurrentPage(0); }}
                            className={cn(
                              "px-2.5 py-1 rounded-lg border text-[9px] font-black outline-none transition-all uppercase tracking-wider",
                              filterDept !== 'ALL'
                                ? theme === 'dark' ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-400" : "bg-indigo-50 border-indigo-200 text-indigo-600"
                                : theme === 'dark' ? "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                            )}
                          >
                            <option value="ALL">Tất cả bộ phận</option>
                            <option value="PTT">PTT</option>
                            <option value="PTDA">PTDA</option>
                            <option value="KT">KT</option>
                          </select>
                        </div>

                        <div className="h-4 w-px bg-slate-700/30 mx-1 shrink-0 lg:block hidden" />

                        {selectedAppIds.length > 0 && (
                          <button 
                            onClick={handleBulkPrint}
                            className="flex items-center gap-2 px-3 py-1 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95 transition-all shrink-0 whitespace-nowrap"
                          >
                            <Printer size={12} />
                            In ({selectedAppIds.length})
                          </button>
                        )}

                        <button 
                          onClick={() => setIsShowFilters(!isShowFilters)}
                          className={cn(
                            "flex items-center gap-2 px-2.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all hover:scale-[1.02] shrink-0 whitespace-nowrap",
                            isShowFilters || (selectedProjectId || filterStatus !== 'ALL' || filterLoanStatus !== 'ALL' || filterSelfService !== 'ALL' || filterSLAStatus !== 'ALL' || filterIssue !== 'ALL')
                              ? "bg-festive-gold text-slate-950 border-festive-gold shadow-lg shadow-festive-gold/15 font-black" 
                              : (theme === 'light' ? "bg-white text-slate-600 border-slate-200 shadow-sm hover:bg-slate-50" : "bg-slate-950/40 text-slate-400 border-slate-800 hover:border-festive-gold/30")
                          )}
                        >
                          <Filter size={12} />
                          Bộ lọc
                        </button>

                        <button 
                          onClick={() => setIsSpreadsheetMode(!isSpreadsheetMode)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all hover:scale-[1.02]",
                            isSpreadsheetMode 
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20" 
                              : (theme === 'light' ? "bg-white text-slate-600 border-slate-200 shadow-sm hover:bg-slate-50" : "bg-slate-950/40 text-slate-400 border-slate-800 hover:border-indigo-500/30")
                          )}
                          title="Chế độ nhập liệu Spreadsheet (Excel-like)"
                        >
                          <FileSpreadsheet size={12} />
                          Spreadsheet
                        </button>
                      </div>
                    </div>
                      <div className="text-[11px] text-slate-500 italic">
                        Hiển thị {displayedApps.length} hồ sơ trên trang / Tổng {totalCount} hồ sơ {selectedProject ? `thuộc ${selectedProject.name}` : 'toàn vùng'} (có lọc)
                      </div>

                      {/* Hiển thị dòng trạng thái filter */}
                      {(() => {
                        const activeFilters: Array<{ label: string, onClear: () => void }> = [];
                        
                        const projObj = projects.find(p => p.id === selectedProjectId);
                        if (projObj) {
                          activeFilters.push({
                            label: `Dự án: ${projObj.name}`,
                            onClear: () => { setSelectedProjectId(null); setCurrentPage(0); }
                          });
                        }
                        
                        if (filterStatus !== 'ALL') {
                          const statusLabels: Record<string, string> = {
                            Processing: 'ĐANG CHUẨN BỊ',
                            WaitingVPDK: 'CHỜ NỘP VPĐK',
                            TaxPending: 'CHỜ HOÀN THÀNH NVTC',
                            WaitingHandover: 'CHỜ BÀN GIAO',
                            TaxPaid: 'ĐÃ NỘP THUẾ',
                            Submitted: 'ĐÃ NỘP VPĐK',
                            Completed: 'HOÀN TẤT'
                          };
                          activeFilters.push({
                            label: `Trạng thái: ${statusLabels[filterStatus] || filterStatus}`,
                            onClear: () => { setFilterStatus('ALL'); setCurrentPage(0); }
                          });
                        }
                        
                        if (filterIssue !== 'ALL') {
                          activeFilters.push({
                            label: 'Chỉ hồ sơ lỗi/vướng',
                            onClear: () => { setFilterIssue('ALL'); setCurrentPage(0); }
                          });
                        }
                        
                        if (filterLoanStatus !== 'ALL') {
                          activeFilters.push({
                            label: filterLoanStatus === 'Co_Vay' ? 'Khách vay' : 'Vốn tự có',
                            onClear: () => { setFilterLoanStatus('ALL'); setCurrentPage(0); }
                          });
                        }
                        
                        if (filterSelfService !== 'ALL') {
                          activeFilters.push({
                            label: filterSelfService === 'YES' ? 'Khách tự làm' : 'Công ty làm',
                            onClear: () => { setFilterSelfService('ALL'); setCurrentPage(0); }
                          });
                        }
                        
                        if (filterSLAStatus !== 'ALL') {
                          activeFilters.push({
                            label: 'Quá hạn SLA',
                            onClear: () => { setFilterSLAStatus('ALL'); setCurrentPage(0); }
                          });
                        }
                        
                        if (filterDept && filterDept !== 'ALL') {
                          activeFilters.push({
                            label: `Bộ phận: ${filterDept}`,
                            onClear: () => { setFilterDept('ALL'); setCurrentPage(0); }
                          });
                        }
                        
                        if (dashboardFilter !== 'ALL') {
                          activeFilters.push({
                            label: `Dashboard: ${dashboardFilter}`,
                            onClear: () => { setDashboardFilter('ALL'); setCurrentPage(0); }
                          });
                        }
                        
                        if (search !== '') {
                          activeFilters.push({
                            label: `Từ khóa: "${search}"`,
                            onClear: () => { setSearch(''); setCurrentPage(0); }
                          });
                        }
                        
                        if (activeFilters.length === 0) return null;
                        
                        return (
                          <div className={cn(
                            "flex flex-wrap items-center gap-2 py-3 px-4 rounded-2xl text-xs font-semibold border mt-3 transition-all",
                            theme === 'light' ? "bg-slate-100 border-slate-200/60 text-slate-800" : "bg-slate-900/30 border-slate-800/40 text-slate-300"
                          )}>
                            <span className="font-bold whitespace-nowrap mr-1 opacity-70">Đang lọc:</span>
                            <div className="flex flex-wrap gap-2 items-center flex-1">
                              {activeFilters.map((act, idx) => (
                                <span 
                                  key={`filter-tag-item-${idx}-${act.label}`}
                                  className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold border transition-all shadow-sm",
                                    theme === 'light' ? "bg-white border-slate-300/40 text-slate-800" : "bg-slate-900/60 border-slate-800 text-slate-200"
                                  )}
                                >
                                  <span>{act.label}</span>
                                  <button 
                                    type="button" 
                                    onClick={act.onClear}
                                    className="hover:text-rose-500 rounded-full transition-all focus:outline-none p-0.5 ml-0.5"
                                  >
                                    <X size={10} />
                                  </button>
                                </span>
                              ))}
                              
                              <button
                                onClick={() => {
                                  setSelectedProjectId(null);
                                  setFilterStatus('ALL');
                                  setFilterLoanStatus('ALL');
                                  setFilterSelfService('ALL');
                                  setFilterSLAStatus('ALL');
                                  setFilterIssue('ALL');
                                  setFilterDept('ALL');
                                  if (typeof setSelectedFlags === 'function') {
                                    setSelectedFlags([]);
                                  }
                                  setSearch('');
                                  setDashboardFilter('ALL');
                                  setCurrentPage(0);
                                }}
                                className="ml-auto hover:underline text-[11px] font-black uppercase tracking-wider text-rose-500 hover:text-rose-400 transition-all flex items-center gap-1"
                              >
                                <X size={12} /> Xóa lọc
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>


                  
                  {/* Bulk Actions Bar (Floating) */}
                  <AnimatePresence>
                    {selectedAppIds.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className={cn(
                          "fixed bottom-8 sm:bottom-12 left-1/2 -translate-x-1/2 z-[60] flex flex-wrap sm:flex-nowrap items-center justify-center gap-1.5 p-2 rounded-2xl backdrop-blur-md border shadow-[0_-12px_40px_rgba(0,0,0,0.12)] transition-all",
                          theme === 'light' 
                            ? "bg-white/80 border-slate-200/60 text-slate-800 shadow-slate-200" 
                            : "bg-slate-900/80 border-slate-700/50 text-slate-200 shadow-black/40"
                        )}
                      >
                        <div className={cn(
                          "flex items-center gap-3 px-4 mr-2 border-r",
                          theme === 'light' ? "border-slate-200" : "border-slate-800"
                        )}>
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center font-black text-xs",
                            theme === 'light' ? "bg-indigo-500 text-white" : "bg-festive-gold text-slate-950"
                          )}>
                            {selectedAppIds.length}
                          </div>
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-wider",
                            theme === 'light' ? "text-slate-600" : "text-slate-500"
                          )}>Đã chọn</span>
                        </div>

                        <div className="flex items-center gap-1">
                          {(() => {
                            const selectedApps = applications.filter(a => selectedAppIds.includes(a.id));
                            if (selectedApps.length === 0) return null;
                            const firstApp = selectedApps[0];
                            const allSameStepAndWorkflow = selectedApps.every(a => a.currentStep === firstApp.currentStep && a.workflowType === firstApp.workflowType);
                            
                            if (allSameStepAndWorkflow) {
                              const workflowType = firstApp.workflowType || 'Quy_trinh_1';
                              const nextStep = getNextStep(firstApp.currentStep, workflowType);
                              const roleDept = (stepConfig[firstApp.currentStep] || INITIAL_STEP_CONFIG[firstApp.currentStep])?.dept;
                              const isSupportSpecial = (firstApp.projectName?.includes('hỗ trợ')) && (firstApp.currentStep === 'GD2_Cho_Nop_VPDK' || firstApp.currentStep === 'S3_Nop_VPDK');
                              const effectiveDept = isSupportSpecial ? 'KT' : roleDept;
                              
                              const canHandleStep = 
                                userRole === 'ADMIN' || 
                                userRole === 'DIRECTOR' || 
                                userRole === 'MANAGER' || 
                                userRole === 'MANAGER_ALL' ||
                                (userRole === 'MANAGER_PTT' && effectiveDept === 'PTT') ||
                                (userRole === 'MANAGER_KT' && effectiveDept === 'KT') ||
                                (userRole === 'MANAGER_PTDA' && effectiveDept === 'PTDA') ||
                                effectiveDept === userRole;
                              
                              const isPrivileged = ['ADMIN', 'DIRECTOR', 'MANAGER_ALL'].includes(userRole);
                              const hasTransitionPermission = canHandleStep || isPrivileged;

                              // Step 7.2 Quy_trinh_2 custom logic
                              if (workflowType === 'Quy_trinh_2' && firstApp.currentStep === 'S7_2_Ban_Giao_Khach') {
                                 if (hasTransitionPermission) {
                                    return (
                                       <button 
                                        disabled={!hasTransitionPermission}
                                        onClick={() => {
                                           if (!hasTransitionPermission) return;
                                           handleBulkStepTransition('Hoan_Tat');
                                        }}
                                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all"
                                      >
                                        Xác nhận Giao Khách & Hoàn tất
                                      </button>
                                    )
                                 }
                                 return null;
                              }
                              
                              const isTaxStep = firstApp.currentStep === 'S5_Tai_Chinh_Khach_Hang' || firstApp.currentStep === 'GD4_Cho_Nop_NVTC';
                              const isAllowedNext = hasTransitionPermission || 
                                (firstApp.currentStep === 'S1_ChuanBi' && userRole === 'PTT') || 
                                (firstApp.currentStep === 'GD1_ChuanBi' && userRole === 'PTT') ||
                                (isTaxStep && (userRole === 'PTT' || userRole === 'PTDA'));
                              if (nextStep && isAllowedNext) {
                                return (
                                  <>
                                    <button 
                                      disabled={!isAllowedNext}
                                      onClick={() => {
                                        if (!isAllowedNext) return;
                                        handleBulkStepTransition(nextStep);
                                      }}
                                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all shrink-0"
                                    >
                                      {firstApp.isSelfService ? "Chuyển thẳng đến Chờ bàn giao" : `Chuyển tiếp ${(stepConfig[nextStep] || INITIAL_STEP_CONFIG[nextStep])?.label}`} &rarr;
                                    </button>
                                     
                                    {/* Trả về hàng loạt */}
                                    { firstApp.currentStep !== 'S1_ChuanBi' && firstApp.currentStep !== 'GD1_ChuanBi' && (
                                        <button 
                                            disabled={!['PTT', 'KT', 'PTDA', 'MANAGER', 'DIRECTOR', 'ADMIN', 'MANAGER_ALL', 'MANAGER_PTT', 'MANAGER_KT', 'MANAGER_PTDA'].includes(userRole)}
                                            onClick={() => {
                                              if (!['PTT', 'KT', 'PTDA', 'MANAGER', 'DIRECTOR', 'ADMIN', 'MANAGER_ALL', 'MANAGER_PTT', 'MANAGER_KT', 'MANAGER_PTDA'].includes(userRole)) return;
                                              const reason = prompt("Lý do trả hồ sơ hàng loạt:");
                                              if (reason) {
                                                handleBulkRejectApps(reason);
                                              }
                                            }}
                                            className={cn(
                                              "w-10 h-10 rounded-full transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed border text-[10px] font-black uppercase tracking-widest shrink-0",
                                              theme === 'light' ? "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200 hover:text-slate-700" : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700"
                                            )}
                                            title="Trả về hàng loạt"
                                        >
                                            <RotateCcw size={16} />
                                        </button>
                                    )}
                                  </>
                                );
                              }
                            } else {
                              return <span className="text-[10px] font-bold text-slate-500 italic pr-4">Chọn các hồ sơ cùng bước/luồng để thao tác</span>;
                            }
                            return null;
                          })()}
                          
                          <button 
                            onClick={() => setIsBulkNoteOpen(true)}
                            className={cn(
                              "w-10 h-10 rounded-full transition-all flex items-center justify-center border",
                              theme === 'light' ? "bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border-slate-200" : "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700/50"
                            )}
                            title="Ghi chú hàng loạt"
                          >
                            <MessageSquare size={16} />
                          </button>

                          <button 
                            onClick={() => setIsBulkDocumentOpen(true)}
                            className="w-10 h-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full transition-all flex items-center justify-center shadow-lg shadow-indigo-600/20"
                            title="Đính kèm tài liệu chung"
                          >
                            <GitMerge size={16} />
                          </button>

                          {['PTT', 'KT', 'PTDA', 'MANAGER', 'DIRECTOR', 'ADMIN', 'MANAGER_ALL', 'MANAGER_PTT', 'MANAGER_KT', 'MANAGER_PTDA'].includes(userRole) && (
                            <button 
                              onClick={() => setIsBulkIssueOpen(true)}
                              className={cn(
                                "w-10 h-10 rounded-full transition-all flex items-center justify-center border",
                                theme === 'light' ? "bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border-rose-200" : "bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border-rose-500/20"
                              )}
                              title="Báo lỗi / Sai sót hàng loạt"
                            >
                              <AlertTriangle size={16} />
                            </button>
                          )}

                          {selectedAppIds.some(id => {
                            const a = applications.find(x => String(x.id) === String(id));
                            return a?.isRejected || a?.status === 'Error' || 
                                   (a?.issueType && a.issueType !== 'None');
                          }) && (
                            <button
                              onClick={handleBulkResolveIssues}
                              disabled={isSavingApp}
                              className={cn(
                                "w-10 h-10 rounded-full transition-all flex items-center justify-center border",
                                theme === 'light' 
                                  ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700 border-emerald-200" 
                                  : "bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white border-emerald-500/20"
                              )}
                              title="Xác nhận đã khắc phục"
                            >
                              {isSavingApp 
                                ? <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                : <CheckCircle size={16} />
                              }
                            </button>
                          )}

                          {(isManagementEdit || ['PTT', 'MANAGER_PTT'].includes(userRole)) && (
                            <button 
                              onClick={handleBulkDelete}
                              className={cn(
                                "w-10 h-10 rounded-full transition-all flex items-center justify-center border",
                                theme === 'light' ? "bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border-rose-200" : "bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border-rose-500/20"
                              )}
                              title="Xóa đã chọn"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}

                          {canBulkAssign && (
                            <button 
                              onClick={() => setIsBulkAssignOpen(true)}
                              className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-black uppercase tracking-wider border transition-all shrink-0",
                                theme === 'light' 
                                  ? "bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-indigo-200" 
                                  : "bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border-indigo-500/20"
                              )}
                              title={`Gán phụ trách cho ${selectedAppIds.length} hồ sơ`}
                            >
                              <UserCheck size={16} />
                            </button>
                          )}

                          <button 
                            onClick={() => {
                              setSelectedAppIds([]);
                              setSelectedRows(new Set());
                            }}
                            className={cn(
                              "w-10 h-10 rounded-full transition-all flex items-center justify-center border ml-2",
                              theme === 'light' ? "bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border-slate-200" : "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700/50"
                            )}
                            title="Hủy chọn"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className={cn(
                    "overflow-auto max-h-[calc(100vh-180px)] relative border-t border-slate-800/10 custom-scrollbar transition-all duration-300",
                    selectedAppIds.length > 0 && "pb-32 sm:pb-24"
                  )}>
                    <table className="w-full text-left border-separate border-spacing-0">
                      <thead className="sticky top-0 z-20">
                        <tr className={cn(
                          "transition-all border-b font-black uppercase tracking-tighter text-[10px]",
                          theme === 'light' ? "bg-slate-100 text-slate-500" : "bg-slate-950 text-slate-400"
                        )}>
                          <th className="px-2 py-2 w-10 border-b border-slate-800/10">
                            <input 
                              ref={masterCheckboxRef}
                              type="checkbox" 
                              className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 accent-festive-gold"
                              checked={currentVisibleApps.length > 0 && currentVisibleApps.every(app => selectedRows.has(app.id))}
                              onChange={(e) => {
                                const newSelection = new Set(selectedRows);
                                if (e.target.checked) {
                                  currentVisibleApps.forEach(app => newSelection.add(app.id));
                                } else {
                                  currentVisibleApps.forEach(app => newSelection.delete(app.id));
                                }
                                setSelectedRows(newSelection);
                                setSelectedAppIds(Array.from(newSelection));
                              }}
                            />
                          </th>
                          <th className="px-2 py-2 border-b border-slate-800/10">Mã căn</th>
                          <th className="px-2 py-2 border-b border-slate-800/10">Dự án</th>
                          <th className="px-2 py-2 border-b border-slate-800/10 max-w-[300px] w-[300px] min-w-[220px]">Khách hàng</th>
                          {isSpreadsheetMode ? (
                            EDITABLE_DATE_FIELDS.map((f, index) => (
                              <th key={`head-${f.key}-${index}`} className="px-2 py-2 text-center whitespace-nowrap bg-indigo-500/5 border-b border-slate-800/10">{f.label}</th>
                            ))
                          ) : (
                            <>
                              <th className="px-2 py-2 border-b border-slate-800/10">Loại lô</th>
                              <th className="px-2 py-2 border-b border-slate-800/10">Trạng thái</th>
                              <th className="px-2 py-2 text-center border-b border-slate-800/10">Bộ phận</th>
                              {(userRole === 'PTT' || isManagement) && (
                                <th className="px-2 py-2 text-center border-b border-slate-800/10">Nộp VPĐK</th>
                              )}
                              {(userRole === 'PTT' || userRole === 'KT' || isManagement) && (
                                <th className="px-2 py-2 text-center border-b border-slate-800/10">Nộp thuế</th>
                              )}
                              {(userRole === 'PTDA' || isManagement) && (
                                <th className="px-2 py-2 text-center border-b border-slate-800/10">Nhận sổ</th>
                              )}
                              <th className="px-2 py-2 text-center border-b border-slate-800/10">BG Khách</th>
                            </>
                          )}
                          <th className="px-2 py-2 text-center text-indigo-500 border-b border-slate-800/10">Files</th>
                          <th className="px-2 py-2 text-center border-b border-slate-800/10">Cmd</th>
                        </tr>
                      </thead>
                      <tbody className={cn(
                        "divide-y transition-all",
                        theme === 'light' ? "text-slate-700 divide-slate-100" : "text-slate-300 divide-slate-800/40"
                      )}>
                        {isLoadingApps ? (
                          <tr>
                            <td colSpan={13} className="px-6 py-12 text-center text-slate-500 italic">
                               <div className="flex flex-col items-center gap-4">
                                  <RefreshCcw className="animate-spin text-indigo-500" size={24} />
                                  <p className="text-xs font-black uppercase tracking-widest">Đang tải dữ liệu hồ sơ...</p>
                               </div>
                            </td>
                          </tr>
                        ) : displayedApps.length === 0 ? (
                          <tr>
                            <td colSpan={13} className="px-6 py-12 text-center text-slate-500 italic font-medium">
                               <div className="flex flex-col items-center gap-4 opacity-40">
                                  <Files size={40} />
                                  <p className="text-sm">Không tìm thấy hồ sơ nào phù hợp với bộ lọc hiện tại.</p>
                               </div>
                            </td>
                          </tr>
                        ) : currentVisibleApps.map((app, index) => {
                          const overdue = getOverdueInfo(app, stepConfig, slaConfig);
                          const isEven = index % 2 === 1;
                          const isFocused = selectedIndex === index;
                          const isSelected = selectedRows.has(app.id) || selectedAppIds.includes(app.id);
                          
                          return (
                            <tr 
                              id={`app-row-${app.id || 'new'}-${index}`}
                              key={`app-table-row-${app.id || 'new'}-${app.unitCode || 'none'}-${index}`} 
                              ref={el => tableRowRefs.current[index] = el}
                              className={cn(
                                "transition-all cursor-pointer group border-b relative h-[32px]",
                                isFocused && (theme === 'light' ? "bg-indigo-50/80 ring-1 ring-inset ring-indigo-500/20 z-10" : "bg-indigo-900/20 ring-1 ring-inset ring-indigo-400/30 z-10"),
                                !isFocused && isSelected && (theme === 'light' ? "bg-festive-gold/10" : "bg-festive-gold/15"),
                                theme === 'light' 
                                  ? (!isFocused && !isSelected ? (isEven ? "bg-slate-50/50 hover:bg-indigo-50/20 border-slate-100" : "bg-white hover:bg-indigo-50/20 border-slate-100") : "")
                                  : (!isFocused && !isSelected ? (isEven ? "bg-slate-900/20 hover:bg-indigo-950/20 border-slate-800/40" : "bg-transparent hover:bg-indigo-950/20 border-slate-800/40") : ""),
                                highlightedAppId === app.id && [
                                  theme === 'dark'
                                    ? 'ring-2 ring-inset ring-emerald-500/60 bg-emerald-500/5'
                                    : 'ring-2 ring-inset ring-emerald-400/60 bg-emerald-50/80'
                                ]
                              )}
                              onClick={(e) => {
                                setSelectedIndex(index);
                                if (e.shiftKey && lastSelectedIndex !== null) {
                                  const visibleApps = currentVisibleApps;
                                  const start = Math.min(lastSelectedIndex, index);
                                  const end = Math.max(lastSelectedIndex, index);
                                  const newSelection = new Set(selectedRows);
                                  for (let i = start; i <= end; i++) {
                                    newSelection.add(visibleApps[i].id);
                                  }
                                  setSelectedRows(newSelection);
                                  setSelectedAppIds(Array.from(newSelection));
                                } else if (e.ctrlKey || e.metaKey) {
                                  const newSelection = new Set(selectedRows);
                                  if (newSelection.has(app.id)) newSelection.delete(app.id);
                                  else newSelection.add(app.id);
                                  setSelectedAppIds(Array.from(newSelection));
                                  setLastSelectedIndex(index);
                                } else {
                                  const newSelection = new Set([app.id]);
                                  setSelectedRows(newSelection);
                                  setSelectedAppIds([app.id]);
                                  setLastSelectedIndex(index);
                                }
                              }}
                              onDoubleClick={() => handleSelectApp(app)}
                            >
                              <td className="px-2 py-0 text-center" onClick={(e) => e.stopPropagation()}>
                                <input 
                                  type="checkbox" 
                                  className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 accent-festive-gold"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    const newSelection = new Set(selectedRows);
                                    if (e.target.checked) {
                                      newSelection.add(app.id);
                                    } else {
                                      newSelection.delete(app.id);
                                    }
                                    setSelectedRows(newSelection);
                                    setSelectedAppIds(Array.from(newSelection));
                                  }}
                                />
                              </td>
                              <td 
                                className="px-2 py-0 text-[11px] tracking-tighter" 
                                onDoubleClick={(e) => {
                                  e.stopPropagation();
                                  setQuickEditId(app.id);
                                  setQuickEditData({ unitCode: app.unitCode, customerName: app.customerName });
                                }}
                              >
                                <div className="flex flex-col text-slate-600 dark:text-slate-300">
                                  {quickEditId === app.id ? (
                                    <input 
                                      autoFocus
                                      className={cn(
                                        "px-2 py-0 h-6 text-[11px] font-medium rounded border outline-none focus:ring-1 focus:ring-festive-gold/50 w-full",
                                        theme === 'light' ? "bg-white border-slate-300 text-slate-900" : "bg-slate-900 border-slate-700 text-festive-gold"
                                      )}
                                      value={quickEditData.unitCode ?? app.unitCode}
                                      onChange={(e) => setQuickEditData(prev => ({ ...prev, unitCode: e.target.value }))}
                                      onClick={(e) => e.stopPropagation()}
                                      onBlur={() => handleQuickSave(app.id)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleQuickSave(app.id);
                                        if (e.key === 'Escape') {
                                          setQuickEditId(null);
                                          setQuickEditData({});
                                        }
                                      }}
                                    />
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <span className={cn("text-[13px] font-medium", theme === 'light' ? "text-slate-900" : "text-white")}>{app.unitCode}</span>
                                      {app.isRejected && app.currentStep === 'S1_ChuanBi' && (
                                        <span className="animate-pulse flex items-center gap-1 text-[9px] bg-rose-500 text-white px-1 py-0.5 rounded-full font-medium uppercase tracking-tight">
                                          <RotateCcw size={8} /> Trả về
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {(() => {
                                    const slaResult = calculateSLA(app, stepConfig);
                                    if (app.currentStep === 'Hoan_Tat' || app.status === 'Completed') return null;
                                    
                                    if (slaResult.urgency === 'overdue') {
                                      return (
                                        <span className="text-[9px] font-medium inline-flex items-center gap-0.5 text-red-500 uppercase tracking-tighter mt-1">
                                          <AlertTriangle size={9} /> Trễ {slaResult.daysLate} ngày
                                        </span>
                                      );
                                    }
                                    if (slaResult.urgency === 'urgent') {
                                      return (
                                        <span className="text-[9px] font-medium inline-flex items-center gap-0.5 text-amber-500 uppercase tracking-tighter mt-1 animate-pulse">
                                          <Clock size={9} className="animate-spin" style={{ animationDuration: '3s' }} /> Còn {slaResult.daysLeft} ngày
                                        </span>
                                      );
                                    }
                                    if (slaResult.urgency === 'warning') {
                                      return (
                                        <span className="text-[9px] font-medium inline-flex items-center gap-0.5 text-yellow-500 uppercase tracking-tighter mt-1">
                                          <Clock size={9} /> Còn {slaResult.daysLeft} ngày
                                        </span>
                                      );
                                    }
                                    return (
                                      <span className="text-[9px] text-slate-500 font-medium uppercase mt-0.5">
                                        SLA: {(stepConfig[app.currentStep] || INITIAL_STEP_CONFIG[app.currentStep])?.slaDays || 0}d
                                      </span>
                                    );
                                  })()}
                                </div>
                              </td>
                              <td className="px-2 py-0">
                                <span className={cn("text-[10px] font-medium whitespace-normal break-words block max-w-[150px]", theme === 'light' ? "text-slate-600" : "text-slate-200")} title={app.projectName}>
                                  {app.projectName}
                                </span>
                              </td>
                              <td 
                                className="px-2 py-2 text-[11px] leading-tight max-w-[300px] w-[300px] min-w-[220px]" 
                                onDoubleClick={(e) => {
                                  e.stopPropagation();
                                  setQuickEditId(app.id);
                                  setQuickEditData({ unitCode: app.unitCode, customerName: app.customerName });
                                }}
                                onClick={() => quickEditId !== app.id && handleSelectApp(app)}
                              >
                                <div className="flex items-start gap-1.5">
                                  <div className={cn(
                                    "w-5 h-5 rounded-full flex items-center justify-center transition-all shrink-0 mt-0.5",
                                    theme === 'light' ? "bg-slate-100 text-slate-400" : "bg-slate-800 text-slate-500"
                                  )}>
                                    <User size={10} />
                                  </div>
                                  <div className="flex flex-col flex-1 min-w-0">
                                    {quickEditId === app.id ? (
                                      <input 
                                        className={cn(
                                          "px-2 py-0 h-6 text-[11px] font-medium rounded border outline-none focus:ring-1 focus:ring-indigo-500/50 w-full",
                                          theme === 'light' ? "bg-white border-slate-300 text-slate-900" : "bg-slate-900 border-slate-700 text-white"
                                        )}
                                        value={quickEditData.customerName ?? app.customerName}
                                        onChange={(e) => setQuickEditData(prev => ({ ...prev, customerName: e.target.value }))}
                                        onBlur={() => handleQuickSave(app.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') handleQuickSave(app.id);
                                          if (e.key === 'Escape') {
                                            setQuickEditId(null);
                                            setQuickEditData({});
                                          }
                                        }}
                                      />
                                    ) : (
                                      <span className={cn("text-xs font-semibold whitespace-normal break-words block", theme === 'light' ? "text-slate-800" : "text-slate-200")}>{app.customerName}</span>
                                    )}
                                    <div className="flex flex-wrap gap-1.5 mt-1 items-center">
                                      <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">{formatDate(app.receivedDate)}</span>
                                      {app.loanStatus === 'Co_Vay' && <span className="text-[9px] bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 px-1.5 py-0.5 rounded font-medium uppercase">Có vay</span>}
                                      {app.isSelfService && <span className="text-[9px] bg-amber-500/10 text-amber-500 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium uppercase">Tự làm</span>}
                                      {app.assignedToName && (
                                        <span className="text-[9px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                          👤 {app.assignedToName}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              {isSpreadsheetMode ? (
                                EDITABLE_DATE_FIELDS.map((f, fIdx) => {
                                  const val = spreadsheetChanges[app.id]?.[f.key as keyof Application] ?? (app[f.key as keyof Application] ? formatDate(app[f.key as keyof Application] as string) : '');
                                  const hasError = spreadsheetErrors[app.id]?.[f.key];
                                  const isChanged = spreadsheetChanges[app.id]?.hasOwnProperty(f.key);
                                  const isActive = activeCell?.id === app.id && activeCell?.field === f.key;
                                  
                                  const isEarly = ['GD1','GD2','GD3','GD4','S1','S2','S3','S4','S5'].some(prefix => (app.currentStep as string).startsWith(prefix));
                                  const isGcnWarning = f.key === 'gcnReceivedDate' && val && val !== '---' && val !== 'None' && String(val).trim() !== '' && isEarly;

                                  const isCellEditable = isFieldEditable ? isFieldEditable(f.key, app) : true;

                                  return (
                                    <td 
                                      key={`cell-field-${app.id || index}-${f.key}-${fIdx}`} 
                                      className={cn(
                                        "px-3 py-1.5 text-xs leading-tight border-x transition-all relative group/cell",
                                        theme === 'light' ? "border-slate-50" : "border-slate-800/20",
                                        isActive && isCellEditable
                                          ? (theme === 'light' 
                                              ? "ring-2 ring-indigo-500 bg-indigo-50/30 z-10 shadow-[0_0_15px_rgba(99,102,241,0.2)]" 
                                              : "ring-2 ring-indigo-400 bg-indigo-900/20 z-10 shadow-[0_0_15px_rgba(129,140,248,0.2)]") 
                                          : "",
                                        hasError ? "bg-rose-500/10" : (isGcnWarning ? "bg-orange-100 dark:bg-orange-900/30" : (isChanged ? "bg-emerald-500/5" : "")),
                                        !isCellEditable ? "bg-slate-150 dark:bg-slate-900/25 opacity-60" : ""
                                      )}
                                      onPaste={(e) => {
                                        if (isCellEditable) {
                                          handleSpreadsheetPaste(e, app.id, f.key);
                                        }
                                      }}
                                      onClick={() => {
                                        if (isCellEditable) {
                                          setActiveCell({ id: app.id, field: f.key });
                                        }
                                      }}
                                    >
                                      <div className="flex items-center justify-center gap-1 w-full relative group/warning">
                                        <input 
                                          type="text"
                                          placeholder={isCellEditable ? "dd/mm/yyyy" : "Khóa"}
                                          disabled={!isCellEditable}
                                          className={cn(
                                            "w-full bg-transparent border-none outline-none text-xs leading-tight font-medium text-center placeholder:opacity-30",
                                            theme === 'light' ? "text-slate-600" : "text-slate-300",
                                            isActive && isCellEditable ? "font-medium" : "",
                                            hasError ? "text-rose-500" : (isGcnWarning ? "text-orange-600 dark:text-orange-400 font-medium" : (isChanged ? "text-emerald-400 font-medium" : "")),
                                            !isCellEditable ? "opacity-45 cursor-not-allowed select-none" : ""
                                          )}
                                          value={val}
                                          onChange={(e) => handleSpreadsheetChange(app.id, f.key, e.target.value)}
                                          onKeyDown={(e) => {
                                            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Tab'].includes(e.key)) {
                                              const isTab = e.key === 'Tab';
                                              const isShiftTab = isTab && e.shiftKey;
                                              
                                              // ArrowUp/Down/Left/Right/Enter and Tab/ShiftTab
                                              e.preventDefault();
                                              const currentIdx = displayedApps.findIndex(a => a.id === app.id);
                                              const currentFldIdx = EDITABLE_DATE_FIELDS.findIndex(fd => fd.key === f.key);
                                              
                                              let nextId = app.id;
                                              let nextFld = f.key;
                                              const isLastRow = currentIdx === displayedApps.length - 1;
                                              const isFirstRow = currentIdx === 0;
                                              const isLastField = currentFldIdx === EDITABLE_DATE_FIELDS.length - 1;
                                              const isFirstField = currentFldIdx === 0;

                                              if (e.key === 'ArrowUp' && !isFirstRow) {
                                                nextId = displayedApps[currentIdx - 1].id;
                                              } else if ((e.key === 'ArrowDown' || e.key === 'Enter') && !isLastRow) {
                                                nextId = displayedApps[currentIdx + 1].id;
                                              } else if (e.key === 'ArrowLeft' && !isFirstField) {
                                                nextFld = EDITABLE_DATE_FIELDS[currentFldIdx - 1].key;
                                              } else if (e.key === 'ArrowRight' && !isLastField) {
                                                nextFld = EDITABLE_DATE_FIELDS[currentFldIdx + 1].key;
                                              } else if (isTab && !isShiftTab) {
                                                if (isLastField) {
                                                  if (!isLastRow) {
                                                    nextId = displayedApps[currentIdx + 1].id;
                                                    nextFld = EDITABLE_DATE_FIELDS[0].key;
                                                  }
                                                } else {
                                                  nextFld = EDITABLE_DATE_FIELDS[currentFldIdx + 1].key;
                                                }
                                              } else if (isShiftTab) {
                                                if (isFirstField) {
                                                  if (!isFirstRow) {
                                                    nextId = displayedApps[currentIdx - 1].id;
                                                    nextFld = EDITABLE_DATE_FIELDS[EDITABLE_DATE_FIELDS.length - 1].key;
                                                  }
                                                } else {
                                                  nextFld = EDITABLE_DATE_FIELDS[currentFldIdx - 1].key;
                                                }
                                              }

                                              if (nextId !== app.id || nextFld !== f.key) {
                                                setActiveCell({ id: nextId, field: nextFld });
                                              }
                                            }
                                          }}
                                          ref={(el) => {
                                            if (isActive && el) el.focus();
                                          }}
                                        />
                                        {isGcnWarning && (
                                          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center z-10 cursor-help">
                                            <AlertTriangle size={12} className="text-orange-500 dark:text-orange-400" />
                                            <div className="pointer-events-none absolute bottom-full mb-1 right-0 hidden group-hover/warning:block w-48 bg-orange-500 text-white text-[9px] px-2 py-1.5 rounded shadow-[0_0_15px_rgba(249,115,22,0.4)] z-50 whitespace-normal text-left leading-tight">
                                              Cảnh báo: Lô đất có ngày nhận sổ nhưng tiến độ thực tế chưa tới bước bàn giao. Vui lòng kiểm tra lại.
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      {hasError && (
                                        <div className="absolute top-0 right-0 p-1">
                                          <AlertCircle size={8} className="text-rose-500" />
                                          <div className="hidden group-hover/cell:block absolute top-6 right-0 bg-rose-500 text-white text-[9px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-50">
                                            {hasError}
                                          </div>
                                        </div>
                                      )}
                                    </td>
                                  );
                                })
                              ) : (
                                <>
                                  <td className="px-2 py-0 text-[10px] leading-tight text-slate-500 dark:text-slate-400">
                                    <span className="font-medium">
                                      {app.propertyType === 'Can_Ho' ? 'Căn hộ' : 'Đất nền'}
                                    </span>
                                  </td>
                                  <td className="px-2 py-0">
                                    <div className="flex flex-col gap-0.5">
                                      <div className="flex items-center gap-1.5 relative group/warn-status">
                                        <StatusBadge status={app.status} app={app} variant="compact" />
                                        {(() => {
                                          if (app.isSelfService) return null;
                                          const missingSteps: string[] = [];
                                          if (app.gcnReceivedDate && !app.submissionDate) missingSteps.push('Ngày nộp VPĐK');
                                          if (app.gcnReceivedDate && !app.taxNotificationDate) missingSteps.push('Ngày TB thuế');
                                          if (app.gcnReceivedDate && !app.taxReceiptDate) missingSteps.push('Ngày đóng thuế');
                                          if (app.gcnReceivedDate && !app.gcnSignedDate) missingSteps.push('Ngày ký GCN');

                                          if (app.gcnSignedDate && !app.submissionDate) missingSteps.push('Ngày nộp VPĐK');
                                          if (app.gcnSignedDate && !app.taxReceiptDate) missingSteps.push('Ngày đóng thuế');

                                          if (app.taxReceiptDate && !app.taxNotificationDate) missingSteps.push('Ngày TB thuế');
                                          if (app.taxReceiptDate && !app.submissionDate) missingSteps.push('Ngày nộp VPĐK');

                                          const uniqueMissing = [...new Set(missingSteps)];
                                          if (uniqueMissing.length > 0) {
                                            return (
                                              <div className="relative flex items-center z-35 cursor-help group/warn">
                                                <span className="text-amber-500 animate-pulse font-bold text-xs select-none">⚠️</span>
                                                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/warn:block w-64 bg-slate-900 border border-amber-500/30 text-white font-medium text-[10px] px-3 py-2 rounded-lg shadow-[0_5px_22px_rgba(0,0,0,0.6)] z-50 whitespace-normal text-left leading-normal">
                                                  <div className="font-bold text-amber-400 border-b border-slate-700/30 pb-1 mb-1 flex items-center gap-1">
                                                    <span>⚠️ CẢNH BÁO TIẾN ĐỘ</span>
                                                  </div>
                                                  <span className="text-slate-200">Thiếu thông tin: {uniqueMissing.join(', ')}</span>
                                                </div>
                                              </div>
                                            );
                                          }
                                          return null;
                                        })()}
                                      </div>
                                      {(app.status === 'Error' || app.isRejected || (app.issueType && app.issueType !== 'None')) && (
                                        <div className="flex items-center gap-1">
                                          <AlertTriangle size={8} className={cn(
                                            app.issueSeverity === 'Critical' ? "text-rose-600" : "text-amber-500"
                                          )} />
                                          <span className="text-[9px] font-medium truncate max-w-[80px] text-slate-400 uppercase tracking-tighter">
                                              {app.issueNotes || 'Vướng'}
                                          </span>
                                          {(userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'DIRECTOR') && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleResolveIssue(app.id);
                                              }}
                                              className={cn("flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-bold uppercase", theme === 'light' ? "bg-emerald-100 hover:bg-emerald-200 text-emerald-700" : "bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400")}
                                              title="Xác nhận đã khắc phục"
                                            >
                                              <CheckCircle size={8} />
                                              OK
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-2 py-0 text-center">
                                      {(() => {
                                        const isSupportSpecial = (app?.projectName?.includes('hỗ trợ') || app?.workflowType === 'Quy_trinh_1') && (app?.currentStep === 'GD2_Cho_Nop_VPDK' || app?.currentStep === 'S3_Nop_VPDK');
                                        const config = (stepConfig[app?.currentStep || ''] || INITIAL_STEP_CONFIG[app?.currentStep || '']);
                                        const dept = isSupportSpecial ? 'KT' : (config?.dept || '---');
                                        return (
                                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                            {dept}
                                          </span>
                                        );
                                      })()}
                                  </td>
                                  {(userRole === 'PTT' || isManagement) && (
                                    <td className="px-2 py-0 text-center">
                                      <span className={cn("text-[10px] leading-tight font-medium", theme === 'light' ? "text-slate-500" : "text-slate-400")}>{formatDate(app.submissionDate)}</span>
                                    </td>
                                  )}
                                  {(userRole === 'PTT' || userRole === 'KT' || isManagement) && (
                                    <td className="px-2 py-0 text-center">
                                      <div className="flex flex-col items-center">
                                        <span className={cn("text-[10px] leading-tight font-medium", theme === 'light' ? "text-slate-500" : "text-slate-400")}>
                                          {app.taxReceiptDate ? formatDate(app.taxReceiptDate) : (app.taxNotificationReceivedDate ? 'Chờ nộp' : '---')}
                                        </span>
                                        <span className={cn("text-[8px] px-1 py-[1px] mt-[1px] rounded font-medium uppercase", getTaxStatus(app).color)}>
                                          {getTaxStatus(app).label}
                                        </span>
                                      </div>
                                    </td>
                                  )}
                                  {(userRole === 'PTDA' || isManagement) && (
                                    <td className="px-2 py-0 text-center">
                                      {(() => {
                                        const hasGCNReceived = app.gcnReceivedDate && app.gcnReceivedDate !== '---' && app.gcnReceivedDate !== 'None' && String(app.gcnReceivedDate).trim() !== '';
                                        const hasGCNSigned = app.gcnSignedDate && app.gcnSignedDate !== '---' && app.gcnSignedDate !== 'None' && String(app.gcnSignedDate).trim() !== '';
                                        
                                        const finalGCNDate = hasGCNReceived ? app.gcnReceivedDate : (hasGCNSigned ? app.gcnSignedDate : null);
                                        
                                        return (
                                          <div className="flex flex-col items-center justify-center w-full">
                                            <span className={cn(
                                              "text-[10px] leading-tight font-medium", 
                                              theme === 'light' ? "text-slate-500" : "text-slate-400"
                                            )}>
                                              {finalGCNDate ? formatDate(finalGCNDate) : '--'}
                                            </span>
                                          </div>
                                        );
                                      })()}
                                    </td>
                                  )}
                                  <td className="px-2 py-0 text-center">
                                    <span className={cn("text-[10px] font-medium", theme === 'light' ? "text-slate-500" : "text-slate-400")}>{formatDate(app.customerHandoverDate)}</span>
                                  </td>
                                </>
                              )}
                              <td className="px-2 py-0 text-center" onClick={(e) => {
                                e.stopPropagation();
                                if (app.scannedFiles && app.scannedFiles.length > 0) {
                                  setPreviewFile(app.scannedFiles[0]);
                                } else {
                                  handleSelectApp(app);
                                }
                              }}>
                                {app.scannedFiles && app.scannedFiles.length > 0 ? (
                                  <div className="flex flex-col items-center group/doc cursor-pointer">
                                    <div className="w-5 h-5 rounded bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover/doc:bg-indigo-500 group-hover/doc:text-white transition-all">
                                      <FileText size={10} />
                                    </div>
                                    <span className="text-[8px] font-black">{app.scannedFiles.length} file</span>
                                  </div>
                                ) : (
                                  <span className="text-[9px] text-slate-700 font-bold opacity-20">---</span>
                                )}
                              </td>
                              <td className="px-2 py-0 text-center">
                                <div className="flex items-center justify-center gap-0.5">
                                  <button 
                                    onClick={() => handleSelectApp(app)}
                                    className="p-1 rounded transition-colors text-slate-500 hover:bg-indigo-500/10 hover:text-indigo-500"
                                    title="Xem"
                                  >
                                    <ChevronRight size={12} />
                                  </button>
                                  {userRole === 'ADMIN' && (
                                    <button 
                                      onClick={(e) => { 
                                        e.stopPropagation(); 
                                        handleDeleteApp(app.id, app.unitCode);
                                      }}
                                      className="p-1 rounded text-slate-500 hover:text-rose-500 transition-colors"
                                      title="Xóa"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  )}
                                </div>
                              </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {isSpreadsheetMode && (
                    <motion.div 
                      initial={{ y: 100 }}
                      animate={{ y: 0 }}
                      className={cn(
                        "sticky bottom-0 left-0 right-0 p-4 border-t backdrop-blur-md z-50 flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.1)]",
                        theme === 'light' ? "bg-white/95 border-slate-200" : "bg-slate-900/95 border-slate-800"
                      )}
                    >
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col text-left">
                          <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest leading-none mb-1">Chế độ nhập liệu Spreadsheet</span>
                          <span className="text-sm font-bold text-indigo-400">Review: {Object.keys(spreadsheetChanges).length} thay đổi</span>
                        </div>

                        <div className="h-8 w-[1px] bg-slate-700/50"></div>

                        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                          <div className="flex items-center gap-1.5">
                            <div className={cn("w-2 h-2 rounded-full", Object.keys(spreadsheetChanges).length > 0 ? "bg-emerald-400 animate-pulse" : "bg-slate-700")}></div>
                            <span>Đã thay đổi</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className={cn("w-2 h-2 rounded-full", Object.keys(spreadsheetErrors).length > 0 ? "bg-rose-500" : "bg-slate-700")}></div>
                            <span>Lỗi định dạng</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => {
                            setSpreadsheetChanges({});
                            setSpreadsheetErrors({});
                            setIsSpreadsheetMode(false);
                          }}
                          className={cn(
                            "px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all",
                            theme === 'light' ? "text-slate-600 hover:bg-slate-100" : "text-slate-400 hover:bg-slate-800"
                          )}
                        >
                          Hủy bỏ
                        </button>
                        <button 
                          onClick={confirmSpreadsheetUpdates}
                          disabled={Object.keys(spreadsheetErrors).length > 0 || Object.keys(spreadsheetChanges).length === 0}
                          className={cn(
                            "px-8 py-3 rounded-full text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl",
                            Object.keys(spreadsheetErrors).length > 0 || Object.keys(spreadsheetChanges).length === 0
                              ? "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed"
                              : "bg-festive-gold text-slate-950 shadow-festive-gold/20 hover:scale-[1.02] active:scale-95"
                          )}
                        >
                          Xác nhận cập nhật ({Object.keys(spreadsheetChanges).length})
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

      <AnimatePresence>
        {isBulkAssignOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={cn(
                "w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border",
                theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"
              )}
            >
              <div className={cn(
                "px-6 py-4 border-b flex justify-between items-center",
                theme === 'light' ? "border-slate-100 bg-slate-50" : "border-slate-800 bg-slate-950/20"
              )}>
                <h3 className={cn(
                  "text-sm font-black uppercase tracking-wider",
                  theme === 'light' ? "text-slate-800" : "text-slate-200"
                )}>
                  Gán nhân viên phụ trách ({selectedAppIds.length})
                </h3>
                <button
                  onClick={() => setIsBulkAssignOpen(false)}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                    theme === 'light' ? "text-slate-400 hover:bg-slate-100" : "text-slate-500 hover:bg-slate-800"
                  )}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-6">
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-3 tracking-widest pl-1">
                  Chọn nhân viên phụ trách nhận {selectedAppIds.length} hồ sơ
                </p>
                
                {currentUser && !['ADMIN', 'MANAGER_ALL', 'DIRECTOR'].includes(currentUser.dept) && (
                  <div className="text-[10px] text-amber-500 font-bold uppercase mb-3 tracking-wider pl-1">
                    Chỉ hiển thị nhân viên phòng ban {currentUser.dept.replace('MANAGER_', '')}
                  </div>
                )}
                
                <select
                  value={bulkAssignUserId}
                  onChange={(e) => setBulkAssignUserId(e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 rounded-2xl border text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 mb-4",
                    theme === 'light' 
                      ? "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500/50" 
                      : "bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500/50"
                  )}
                >
                  <option value="" className={theme === 'light' ? "bg-white text-slate-800" : "bg-slate-950 text-slate-200"}>-- Chọn nhân viên --</option>
                  {assignableUsers && assignableUsers.length > 0 ? (
                    assignableUsers.map((u: any, index: number) => (
                      <option 
                        key={`bulk-assign-usr-${u.id || index}-${index}`} 
                        value={u.id}
                        className={theme === 'light' ? "bg-white text-slate-800" : "bg-slate-900 text-slate-200"}
                      >
                        {u.name} ({u.dept})
                      </option>
                    ))
                  ) : (
                    <option disabled className={theme === 'light' ? "bg-white text-slate-800" : "bg-slate-900 text-slate-200"}>
                      Không có nhân viên trong phòng ban
                    </option>
                  )}
                </select>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setIsBulkAssignOpen(false)}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border",
                      theme === 'light' 
                        ? "text-slate-500 hover:bg-slate-100 border-slate-200" 
                        : "text-slate-400 hover:bg-slate-800 border-slate-800"
                    )}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={handleBulkAssign}
                    disabled={!bulkAssignUserId}
                    className="flex-[2] py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20"
                  >
                    Xác nhận gán
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

</>
  );
};
