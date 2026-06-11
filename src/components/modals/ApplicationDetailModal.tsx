import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Application,
  UserProfile,
  Dept,
  StepName,
  IssueType,
  IssueSeverity,
} from "../../types";
import { cn } from "../../lib/utils";
import {
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  FileText,
  Download,
  User,
  Activity,
  Edit3,
  Save,
  MapPin,
  Hash,
  Trash2,
  Printer,
  ChevronDown,
  ChevronUp,
  Upload,
  CheckSquare,
  Search,
  Eye,
  RotateCcw,
  Edit2,
  CheckCircle2,
  ChevronRight,
  AlertTriangle,
  Users,
  Check,
  Plus,
  Camera,
  History as HistoryIcon,
} from "lucide-react";
import { DetailCard, StatusBadge } from "../AppSubComponents";
import {
  WORKFLOW_1_STEPS,
  WORKFLOW_2_STEPS,
  STEP_CONFIG as INITIAL_STEP_CONFIG,
  getNextStep,
} from "../../constants";
import { getOverdueInfo, getPhaseIndex } from "../../utils/appUtils";

const formatLogTime = (timeStr: string) => {
  if (!timeStr) return "---";

  if (timeStr.includes(",") && timeStr.includes("/")) {
    const parts = timeStr.split(",");
    const timePart = parts[1] ? parts[1].trim() : "";
    const datePart = parts[0] ? parts[0].trim() : "";
    return timePart ? `${timePart} - ${datePart}` : datePart;
  }

  try {
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return timeStr;

    const d = date.getDate().toString().padStart(2, "0");
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const y = date.getFullYear();
    const hh = date.getHours().toString().padStart(2, "0");
    const mm = date.getMinutes().toString().padStart(2, "0");

    const isDateOnly =
      (timeStr.length <= 10 && !timeStr.includes(":")) ||
      (hh === "00" &&
        mm === "00" &&
        !timeStr.includes(":") &&
        !timeStr.includes("T"));

    if (isDateOnly) {
      return `${d}/${m}/${y}`;
    }

    return `${hh}:${mm} - ${d}/${m}/${y}`;
  } catch (e) {
    return timeStr;
  }
};

export const ApplicationDetailModal = ({
  selectedApp,
  editApp,
  setSelectedApp,
  isEditing,
  setIsEditing,
  theme,
  userCanEdit,
  userRole,
  currentUser,
  stepConfig,
  expandedSections,
  setExpandedSections,
  detailTab,
  setDetailTab,
  handleFieldChange,
  conflictWarning,
  handleUpdateApp,
  handleDeleteApp,
  setIsHandoverTicketOpen,
  handleFileUpload,
  handleDeleteFile,
  setPreviewFile,
  handleResolveIssue,
  calculateDaysBetweenDates,
  formatDate,
  handleSingleOrBulkReportIssue,
  handleRejectApp,
  handleStepTransition,
  handleBulkStepTransition,
  handleResolveError,
  setEditApp,
  setConflictWarning,
  isManagement,
  isReportIssueFormOpen,
  setIsReportIssueFormOpen,
  reportIssueType,
  setReportIssueType,
  reportIssueSeverity,
  setReportIssueSeverity,
  reportIssueNote,
  setReportIssueNote,
  isFieldEditable,
  isFieldVisible,
  toggleSection,
  setPrintHandoverApps,
  setIsPrintingHandover,
  slaConfig,
}: any) => {
  const currentApp = editApp || selectedApp;

  const detailBackdropRef = React.useRef<HTMLDivElement>(null);
  const mousedownOnDetailBackdrop = React.useRef(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        const confirmBtn = document.querySelector(
          "[data-confirm-transition]",
        ) as HTMLButtonElement | null;
        if (confirmBtn && !confirmBtn.disabled) {
          confirmBtn.click();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isStep2OrLater = currentApp
    ? currentApp.workflowType === "Quy_trinh_2"
      ? [
          "S2_KT_Tiep_Nhan",
          "S2_KT_Ban_giao",
          "S3_Nop_VPDK",
          "S5_Tai_Chinh_Khach_Hang",
          "S5_1_PTDA_TiepNhan",
          "S6_Nhan_So_GCN",
          "S7_PTDA_Ban_Giao",
          "S7_1_PTT_Tiep_Nhan",
          "S7_2_Ban_Giao_Khach",
          "Hoan_Tat",
        ].includes(currentApp.currentStep)
      : [
          "GD1_Cho_KT_TiepNhan",
          "GD2_Cho_Nop_VPDK",
          "GD3_Nop_VPDK",
          "GD4_Cho_Nop_NVTC",
          "GD4_Cho_KT_TiepNhan_LaySo",
          "GD5_Cho_Ky_In_GCN",
          "GD5_Cho_GCN",
          "GD5_Cho_PTT_TiepNhan_BG",
          "GD6_Cho_BG_Khach",
          "Hoan_Tat",
        ].includes(currentApp.currentStep)
    : false;

  const isStep3OrLater = currentApp
    ? currentApp.workflowType === "Quy_trinh_2"
      ? [
          "S3_Nop_VPDK",
          "S5_Tai_Chinh_Khach_Hang",
          "S5_1_PTDA_TiepNhan",
          "S6_Nhan_So_GCN",
          "S7_PTDA_Ban_Giao",
          "S7_1_PTT_Tiep_Nhan",
          "S7_2_Ban_Giao_Khach",
          "Hoan_Tat",
        ].includes(currentApp.currentStep)
      : [
          "GD3_Nop_VPDK",
          "GD4_Cho_Nop_NVTC",
          "GD4_Cho_KT_TiepNhan_LaySo",
          "GD5_Cho_Ky_In_GCN",
          "GD5_Cho_GCN",
          "GD5_Cho_PTT_TiepNhan_BG",
          "GD6_Cho_BG_Khach",
          "Hoan_Tat",
        ].includes(currentApp.currentStep)
    : false;

  const isFinishedStep = currentApp
    ? currentApp.currentStep === "Hoan_Tat"
    : false;

  const isSupportSpecial =
    currentApp &&
    currentApp.projectName?.includes("hỗ trợ") &&
    (currentApp.currentStep === "GD2_Cho_Nop_VPDK" ||
      currentApp.currentStep === "S3_Nop_VPDK");
  const currentStepDept =
    currentApp &&
    (
      stepConfig[currentApp.currentStep] ||
      INITIAL_STEP_CONFIG[currentApp.currentStep]
    )?.dept;
  const effectiveDept = currentApp
    ? isSupportSpecial
      ? "KT"
      : currentStepDept
    : "";

  const isRoleDeptMatch = (() => {
    if (!currentUser || !currentApp) return false;
    const role = currentUser.dept;
    if (
      role === "ADMIN" ||
      role === "DIRECTOR" ||
      role === "MANAGER" ||
      role === "MANAGER_ALL"
    )
      return true;
    if (role === "MANAGER_PTT") return effectiveDept === "PTT";
    if (role === "MANAGER_KT") return effectiveDept === "KT";
    if (role === "MANAGER_PTDA") return effectiveDept === "PTDA";
    return true; // Keep true or false for other roles or standard specialists (field level isFieldEditable handles fields)
  })();

  const effectiveUserCanEdit = userCanEdit && isRoleDeptMatch;

  return (
    <>
      <AnimatePresence>
        {selectedApp && (
          <>
            <motion.div
              ref={detailBackdropRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onMouseDown={(e) => {
                if (e.target === detailBackdropRef.current) {
                  mousedownOnDetailBackdrop.current = true;
                } else {
                  mousedownOnDetailBackdrop.current = false;
                }
              }}
              onMouseUp={(e) => {
                if (
                  e.target === detailBackdropRef.current &&
                  mousedownOnDetailBackdrop.current
                ) {
                  setSelectedApp(null);
                }
                mousedownOnDetailBackdrop.current = false;
              }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={cn(
                "fixed right-0 top-0 bottom-0 w-full md:w-[750px] lg:w-[900px] z-50 shadow-2xl flex flex-col border-l",
                theme === "light"
                  ? "bg-slate-50 border-slate-200"
                  : "bg-[#1E293B] border-slate-700",
              )}
            >
              <div
                className={cn(
                  "p-4 sm:p-8 border-b flex flex-col md:flex-row items-start md:items-center justify-between gap-4",
                  theme === "light"
                    ? "bg-white border-slate-200"
                    : "bg-slate-900/50 border-slate-700",
                )}
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-sm font-black uppercase tracking-widest border border-indigo-500/20">
                      {(editApp || selectedApp).unitCode}
                    </span>
                    <StatusBadge
                      status={(editApp || selectedApp).status}
                      app={editApp || selectedApp}
                    />
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5",
                        theme === "light"
                          ? "bg-slate-100 text-slate-600 border-slate-200"
                          : "bg-slate-800 text-slate-300 border-slate-700",
                      )}
                    >
                      <Activity size={12} />
                      {stepConfig[(editApp || selectedApp).currentStep]
                        ?.label || (editApp || selectedApp).currentStep}
                    </span>
                  </div>
                  <h3
                    className={cn(
                      "text-2xl font-black italic font-serif",
                      theme === "light" ? "text-slate-900" : "text-slate-100",
                    )}
                  >
                    {(editApp || selectedApp).projectName}
                  </h3>
                  <p
                    className={cn(
                      "text-sm font-bold uppercase tracking-widest mt-1 flex items-center gap-2",
                      theme === "light" ? "text-slate-500" : "text-slate-400",
                    )}
                  >
                    <User
                      size={14}
                      className={
                        theme === "light" ? "text-slate-400" : "text-slate-50"
                      }
                    />
                    {(editApp || selectedApp).customerName}
                  </p>

                  {((editApp || selectedApp).isRejected ||
                    (editApp || selectedApp).status === "Error" ||
                    ((editApp || selectedApp).issueType &&
                      (editApp || selectedApp).issueType !== "None")) && (
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-error/10 border border-error/20 text-error rounded-lg">
                        <AlertTriangle size={14} className="animate-pulse" />
                        <span className="text-xs font-bold">
                          Vướng mắc:{" "}
                          {(editApp || selectedApp).issueNotes ||
                            "Có sai sót cần xử lý"}
                        </span>
                        {(editApp || selectedApp).rejectionCount > 0 && (
                          <span className="ml-2 text-[10px] font-mono bg-error/20 px-1.5 py-0.5 rounded">
                            Trả về: {(editApp || selectedApp).rejectionCount}{" "}
                            lần
                          </span>
                        )}
                      </div>

                      {(effectiveUserCanEdit ||
                        ["ADMIN", "DIRECTOR", "MANAGER_ALL"].includes(
                          userRole,
                        )) && (
                        <button
                          disabled={
                            !(
                              effectiveUserCanEdit ||
                              ["ADMIN", "DIRECTOR", "MANAGER_ALL"].includes(
                                userRole,
                              )
                            )
                          }
                          onClick={() => {
                            if (
                              !(
                                effectiveUserCanEdit ||
                                ["ADMIN", "DIRECTOR", "MANAGER_ALL"].includes(
                                  userRole,
                                )
                              )
                            )
                              return;
                            handleResolveIssue((editApp || selectedApp).id);
                          }}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <CheckCircle2 size={14} />
                          Xác nhận khắc phục xong
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {isManagement && (
                    <button
                      onClick={() =>
                        setExpandedSections(
                          expandedSections.length > 0
                            ? []
                            : [
                                "PTT_SECTION",
                                "KT_SECTION",
                                "PTDA_SECTION",
                                "OTHER_SECTION",
                              ],
                        )
                      }
                      className={cn(
                        "px-4 py-3 text-xs font-bold uppercase tracking-widest rounded-2xl transition-all border mr-2",
                        theme === "light"
                          ? "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700",
                      )}
                    >
                      {expandedSections.length > 0
                        ? "Thu gọn"
                        : "Mở rộng tất cả"}
                    </button>
                  )}
                  {!isEditing ? (
                    effectiveUserCanEdit && (
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setEditApp(selectedApp);
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-festive-gold hover:bg-amber-400 text-slate-900 text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-festive-gold/10"
                      >
                        <Edit3 size={16} />
                        Chỉnh sửa
                      </button>
                    )
                  ) : (
                    <div className="w-full flex flex-col">
                      {conflictWarning && (
                        <div
                          className={cn(
                            "flex items-start gap-2 px-4 py-3 rounded-2xl mb-4 border text-left",
                            theme === "dark"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/30 font-bold"
                              : "bg-amber-50 text-amber-700 border-amber-200",
                          )}
                        >
                          <AlertTriangle
                            size={16}
                            className="shrink-0 mt-0.5"
                          />
                          <div className="space-y-1">
                            <p className="font-bold text-sm">
                              Xung đột dữ liệu!
                            </p>
                            <p className="text-xs opacity-95 font-medium leading-relaxed">
                              {conflictWarning}
                            </p>
                            <div className="flex gap-2.5 pt-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditApp(selectedApp);
                                  setConflictWarning(null);
                                }}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md"
                              >
                                Tải lại version mới
                              </button>
                              <button
                                type="button"
                                onClick={() => setConflictWarning(null)}
                                className={cn(
                                  "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all",
                                  theme === "dark"
                                    ? "border-amber-400/20 text-amber-400 hover:bg-amber-400/10"
                                    : "border-amber-300 text-amber-800 hover:bg-amber-100",
                                )}
                              >
                                Vẫn lưu của tôi
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setEditApp(null);
                            setConflictWarning(null);
                          }}
                          className={cn(
                            "px-6 py-3 text-xs font-bold uppercase tracking-widest rounded-2xl transition-all border",
                            theme === "light"
                              ? "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200"
                              : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700",
                          )}
                        >
                          Hủy
                        </button>
                        <button
                          onClick={handleUpdateApp}
                          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
                        >
                          Lưu thay đổi
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setPrintHandoverApps([editApp || selectedApp]);
                      setIsPrintingHandover(true);
                    }}
                    className={cn(
                      "p-3 rounded-2xl transition-all border",
                      theme === "light"
                        ? "bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-indigo-100"
                        : "bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white border-indigo-500/20",
                    )}
                    title="In phiếu bàn giao"
                  >
                    <Printer size={18} />
                  </button>

                  {userRole === "ADMIN" && (
                    <button
                      onClick={() =>
                        handleDeleteApp(
                          (editApp || selectedApp).id,
                          (editApp || selectedApp).unitCode,
                        )
                      }
                      className={cn(
                        "p-3 rounded-2xl transition-all border",
                        theme === "light"
                          ? "bg-rose-50 hover:bg-rose-100 text-rose-500 border-rose-100"
                          : "bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border-rose-500/20",
                      )}
                      title="Xóa hồ sơ"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedApp(null);
                      setIsEditing(false);
                      setEditApp(null);
                    }}
                    className={cn(
                      "p-3 rounded-2xl transition-colors border border-transparent",
                      theme === "light"
                        ? "hover:bg-slate-100 text-slate-400 hover:border-slate-200"
                        : "hover:bg-slate-800 text-slate-500 hover:border-slate-700",
                    )}
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-10 custom-scrollbar">
                {(editApp || selectedApp).isRejected && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "p-4 border rounded-2xl flex items-start gap-4 mb-6",
                      theme === "light"
                        ? "bg-rose-50 border-rose-100"
                        : "bg-rose-500/10 border-rose-500/20",
                    )}
                  >
                    <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/20">
                      <RotateCcw size={20} className="text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">
                          Hồ sơ Cần bổ sung / Sửa đổi
                        </p>
                        <span className="text-[10px] font-mono text-rose-400 bg-rose-500/5 px-2 py-0.5 rounded border border-rose-500/10">
                          Lần {(editApp || selectedApp).rejectionCount}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "text-xs font-bold",
                          theme === "light"
                            ? "text-slate-800"
                            : "text-slate-200",
                        )}
                      >
                        {(editApp || selectedApp).rejectionReason}
                      </p>
                      <p
                        className={cn(
                          "text-[10px] mt-2 italic font-medium",
                          theme === "light"
                            ? "text-slate-500"
                            : "text-slate-500",
                        )}
                      >
                        Báo cáo bời bộ phận Kế toán. Vui lòng cập nhật thông tin
                        và bàn giao lại.
                      </p>
                    </div>
                  </motion.div>
                )}

                {(() => {
                  const overdueInfo = getOverdueInfo(
                    editApp || selectedApp,
                    stepConfig,
                    slaConfig,
                    true,
                  );
                  if (!overdueInfo.isOverdue) return null;
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-4 mb-6"
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                        <Clock size={20} className="text-slate-900" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
                            Hồ sơ quá hạn SLA xử lý
                          </p>
                        </div>
                        <p className="text-sm font-bold text-amber-400">
                          Trễ hạn bước: {overdueInfo.label} (
                          {overdueInfo.daysLate} ngày quá hạn)
                        </p>
                        <p className="text-[10px] text-slate-500 mt-2 italic font-medium">
                          Cảnh báo chậm trễ hiệu suất hệ thống. Vui lòng kiểm
                          tra tiến độ giải quyết hồ sơ.
                        </p>
                      </div>
                    </motion.div>
                  );
                })()}

                {/* Workflow Tracker - Wider Display */}
                <section
                  className={cn(
                    "p-8 rounded-[2.5rem] border relative overflow-hidden backdrop-blur-md",
                    theme === "dark"
                      ? "bg-slate-900/40 border-slate-800/50"
                      : "bg-white border-slate-200 shadow-sm",
                  )}
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -mr-32 -mt-32"></div>
                  <div className="flex items-center justify-between mb-8">
                    <h4
                      className={cn(
                        "text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2",
                        theme === "dark" ? "text-slate-500" : "text-slate-400",
                      )}
                    >
                      <Activity size={14} className="text-indigo-500" />
                      Bản đồ quy trình thực hiện
                    </h4>
                  </div>

                  <div className="relative pt-4 pb-12 px-6">
                    {/* Background Line */}
                    <div
                      className={cn(
                        "absolute top-[26px] left-10 right-10 h-1 rounded-full",
                        theme === "dark" ? "bg-slate-800" : "bg-slate-200",
                      )}
                    ></div>

                    <div className="flex justify-between relative z-10">
                      {["01", "02", "03", "04", "05", "06", "07"].map(
                        (label, idx) => {
                          const appData = editApp || selectedApp;
                          const currentPhase = getPhaseIndex(
                            appData.currentStep,
                          );
                          const isCompleted =
                            idx < currentPhase ||
                            appData.currentStep === "Hoan_Tat";
                          const isActive =
                            idx === currentPhase &&
                            appData.currentStep !== "Hoan_Tat";

                          // Nếu là Quy_trinh_1 thì không hiện label 07 (Hoàn tất không có icon riêng),
                          // Nhưng mà Hoan_Tat là phase 6, tức là index 6 (07).

                          return (
                            <div
                              key={`step-indicator-${label}-${idx}`}
                              className={cn(
                                "flex flex-col items-center gap-4",
                                appData.workflowType === "Quy_trinh_1" &&
                                  label === "07"
                                  ? "hidden"
                                  : "",
                              )}
                            >
                              <div
                                className={cn(
                                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-700 text-sm font-black border-2",
                                  isCompleted
                                    ? "bg-emerald-500 border-emerald-500 text-slate-900 rotate-12"
                                    : isActive
                                      ? "bg-indigo-600 border-indigo-400 text-white shadow-[0_0_30px_rgba(99,102,241,0.4)] scale-125 -rotate-3"
                                      : theme === "dark"
                                        ? "bg-slate-900 border-slate-800 text-slate-700 hover:border-slate-700"
                                        : "bg-slate-100 border-slate-200 text-slate-400 hover:border-slate-300",
                                )}
                              >
                                {isCompleted ? <Check size={24} /> : label}
                              </div>
                              <span
                                className={cn(
                                  "text-[10px] font-black uppercase tracking-widest absolute -bottom-2 whitespace-nowrap text-center max-w-[60px]",
                                  isActive
                                    ? "text-indigo-400"
                                    : isCompleted
                                      ? theme === "dark"
                                        ? "text-emerald-400"
                                        : "text-emerald-600"
                                      : theme === "dark"
                                        ? "text-slate-600"
                                        : "text-slate-400",
                                )}
                              >
                                {appData.workflowType === "Quy_trinh_1" ? (
                                  <>
                                    {label === "01" && "Chuẩn bị"}
                                    {label === "02" && "Nộp VPĐK"}
                                    {label === "03" && "TB Thuế"}
                                    {label === "04" && "Cấp SN/NVTC"}
                                    {label === "05" && "Lấy GCN"}
                                    {label === "06" && "Bàn Giao"}
                                  </>
                                ) : (
                                  <>
                                    {label === "01" && "Chuẩn bị"}
                                    {label === "02" && "Chờ nộp"}
                                    {label === "03" && "Nộp VPĐK"}
                                    {label === "04" && "Thông báo"}
                                    {label === "05" && "Tài chính"}
                                    {label === "06" && "Nhận sổ"}
                                    {label === "07" && "Bàn giao"}
                                  </>
                                )}
                              </span>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      className={cn(
                        "flex items-start gap-4 p-5 rounded-3xl border transition-colors",
                        theme === "dark"
                          ? "bg-indigo-500/5 border-indigo-500/10"
                          : "bg-indigo-50/50 border-indigo-100",
                      )}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-500 flex items-center justify-center shrink-0">
                        <Clock size={24} />
                      </div>
                      <div>
                        <p
                          className={cn(
                            "text-[10px] font-black uppercase tracking-widest mb-1.5 opacity-70",
                            theme === "dark"
                              ? "text-indigo-400"
                              : "text-indigo-600",
                          )}
                        >
                          Bước hiện tại:
                        </p>
                        <p
                          className={cn(
                            "text-base font-black uppercase tracking-tight",
                            theme === "dark"
                              ? "text-slate-100"
                              : "text-slate-900",
                          )}
                        >
                          {
                            stepConfig[(editApp || selectedApp).currentStep]
                              ?.label
                          }
                        </p>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "flex items-start gap-4 p-5 rounded-3xl border transition-colors",
                        theme === "dark"
                          ? "bg-slate-800/30 border-slate-700/30"
                          : "bg-slate-100/50 border-slate-200",
                      )}
                    >
                      <div
                        className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                          theme === "dark"
                            ? "bg-slate-800 text-slate-500"
                            : "bg-slate-200 text-slate-500",
                        )}
                      >
                        <Users size={24} />
                      </div>
                      <div>
                        <p
                          className={cn(
                            "text-[10px] font-black uppercase tracking-widest mb-1.5 opacity-70",
                            theme === "dark"
                              ? "text-slate-500"
                              : "text-slate-400",
                          )}
                        >
                          Phòng chủ trì:
                        </p>
                        <p
                          className={cn(
                            "text-base font-black uppercase tracking-tight",
                            theme === "dark"
                              ? "text-slate-300"
                              : "text-slate-700",
                          )}
                        >
                          {(() => {
                            const app = editApp || selectedApp;
                            const isSupportSpecial =
                              (app?.projectName?.includes("hỗ trợ") ||
                                app?.workflowType === "Quy_trinh_1") &&
                              (app?.currentStep === "GD2_Cho_Nop_VPDK" ||
                                app?.currentStep === "S3_Nop_VPDK");
                            return isSupportSpecial
                              ? "KT"
                              : stepConfig[app?.currentStep || ""]?.dept ||
                                  "---";
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="grid grid-cols-1 gap-6">
                  {/* PTT Section */}
                  <div
                    className={cn(
                      "border rounded-3xl overflow-hidden transition-all",
                      theme === "dark"
                        ? "border-slate-800 bg-slate-900/20"
                        : "border-slate-200 bg-white",
                    )}
                  >
                    <div
                      className={cn(
                        "flex flex-wrap items-center justify-between p-5 cursor-pointer transition-colors",
                        expandedSections.includes("PTT_SECTION") &&
                          (theme === "dark"
                            ? "border-b border-slate-800"
                            : "border-b border-slate-200"),
                        theme === "light"
                          ? "hover:bg-slate-50 text-slate-600"
                          : "hover:bg-indigo-500/5 text-slate-300",
                      )}
                      onClick={() => toggleSection("PTT_SECTION")}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                        <h4
                          className={cn(
                            "text-sm font-black uppercase tracking-widest",
                            theme === "dark" ? "text-white" : "text-slate-900",
                          )}
                        >
                          1. Thủ tục & Khách hàng (PTT)
                        </h4>
                      </div>
                      <div className="flex items-center gap-4">
                        {userRole === "PTT" && (
                          <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full font-black uppercase border border-indigo-500/20">
                            Vùng của bạn
                          </span>
                        )}
                        {expandedSections.includes("PTT_SECTION") ? (
                          <ChevronUp size={20} className="text-slate-500" />
                        ) : (
                          <ChevronDown size={20} className="text-slate-500" />
                        )}
                      </div>
                    </div>
                    <AnimatePresence>
                      {expandedSections.includes("PTT_SECTION") && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-6 space-y-10">
                            {/* Row 1: Master Info */}
                            <section className="space-y-6">
                              <div
                                className={cn(
                                  "flex items-center justify-between border-b pb-4",
                                  theme === "dark"
                                    ? "border-slate-800/50"
                                    : "border-slate-200",
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-1 h-6 bg-indigo-500 rounded-full opacity-50"></div>
                                  <h4
                                    className={cn(
                                      "text-sm font-black uppercase tracking-widest",
                                      theme === "dark"
                                        ? "text-slate-300"
                                        : "text-slate-700",
                                    )}
                                  >
                                    Thông tin Khách hàng
                                  </h4>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <DetailCard
                                  theme={theme}
                                  label="Mã lô/ căn"
                                  value={(editApp || selectedApp).unitCode}
                                  isEditing={isEditing}
                                />
                                <DetailCard
                                  theme={theme}
                                  label="Dự án"
                                  value={(editApp || selectedApp).projectName}
                                  isEditing={isEditing}
                                />
                                <DetailCard
                                  theme={theme}
                                  label="Tên khách hàng"
                                  value={(editApp || selectedApp).customerName}
                                  editable={isFieldEditable("customerName")}
                                  isEditing={isEditing}
                                  onChange={(val: string) =>
                                    handleFieldChange("customerName", val)
                                  }
                                />
                                <DetailCard
                                  theme={theme}
                                  label="Đối tượng ký HĐCN"
                                  value={
                                    (editApp || selectedApp).contractSignerType
                                  }
                                  editable={isFieldEditable(
                                    "contractSignerType",
                                  )}
                                  isEditing={isEditing}
                                  onChange={(val: string) =>
                                    handleFieldChange("contractSignerType", val)
                                  }
                                />
                                <DetailCard
                                  theme={theme}
                                  label="Số điện thoại"
                                  value={(editApp || selectedApp).phoneNumber}
                                  editable={isFieldEditable("phoneNumber")}
                                  isEditing={isEditing}
                                  onChange={(val: string) =>
                                    handleFieldChange("phoneNumber", val)
                                  }
                                />
                                <DetailCard
                                  theme={theme}
                                  label="Loại tài sản"
                                  value={
                                    (editApp || selectedApp).propertyType ===
                                    "Dat_Nen"
                                      ? "Quyền sử dụng đất (Nhà đất/Đất nền)"
                                      : "Căn hộ"
                                  }
                                  type="select"
                                  editable={isFieldEditable("propertyType")}
                                  isEditing={isEditing}
                                  options={[
                                    "Quyền sử dụng đất (Nhà đất/Đất nền)",
                                    "Căn hộ",
                                  ]}
                                  onChange={(val: string) =>
                                    handleFieldChange(
                                      "propertyType",
                                      val === "Căn hộ" ? "Can_Ho" : "Dat_Nen",
                                    )
                                  }
                                />
                                <DetailCard
                                  theme={theme}
                                  label="Sử dụng gói vay"
                                  value={
                                    (editApp || selectedApp).loanStatus ===
                                    "Co_Vay"
                                      ? "Có vay"
                                      : "Không vay"
                                  }
                                  type="select"
                                  editable={isFieldEditable("loanStatus")}
                                  isEditing={isEditing}
                                  options={["Có vay", "Không vay"]}
                                  onChange={(val: string) =>
                                    handleFieldChange(
                                      "loanStatus",
                                      val === "Có vay" ? "Co_Vay" : "Khong_Vay",
                                    )
                                  }
                                />
                                <DetailCard
                                  theme={theme}
                                  label="Ngày ký HĐCN/HĐMB"
                                  value={
                                    (editApp || selectedApp).contractSigningDate
                                  }
                                  type="date"
                                  editable={isFieldEditable(
                                    "contractSigningDate",
                                  )}
                                  isEditing={isEditing}
                                  onChange={(val: string) =>
                                    handleFieldChange(
                                      "contractSigningDate",
                                      val,
                                    )
                                  }
                                />
                                {(editApp || selectedApp).loanStatus ===
                                  "Co_Vay" && (
                                  <DetailCard
                                    theme={theme}
                                    label="Ngày cam kết hoàn thành (Ngân hàng)"
                                    value={
                                      (editApp || selectedApp)
                                        .bankCommitmentDeadline
                                    }
                                    type="date"
                                    editable={isFieldEditable(
                                      "bankCommitmentDeadline",
                                    )}
                                    isEditing={isEditing}
                                    onChange={(val: string) =>
                                      handleFieldChange(
                                        "bankCommitmentDeadline",
                                        val,
                                      )
                                    }
                                  />
                                )}
                                {((editApp || selectedApp).propertyType ===
                                  "Can_Ho" ||
                                  (editApp || selectedApp).property_type ===
                                    "Can_Ho") && (
                                  <DetailCard
                                    theme={theme}
                                    label="Ngày bàn giao căn hộ thực tế"
                                    value={
                                      (editApp || selectedApp)
                                        .handoverApartmentDate
                                    }
                                    type="date"
                                    editable={isFieldEditable(
                                      "handoverApartmentDate",
                                    )}
                                    isEditing={isEditing}
                                    onChange={(val: string) =>
                                      handleFieldChange(
                                        "handoverApartmentDate",
                                        val,
                                      )
                                    }
                                  />
                                )}
                              </div>
                            </section>

                            {/* Checklist - Visible to ADMIN/MANAGER/PTT */}
                            {isFieldVisible("checklist") && (
                              <section className="space-y-4">
                                <div className="flex items-center gap-3 border-b border-slate-800/30 pb-2">
                                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    Danh mục hồ sơ gốc
                                  </h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                                  {[
                                    "HĐMB/HĐCN Gốc",
                                    "Văn bản chuyển nhượng",
                                    "Lệ phí trước bạ",
                                    "Sổ hộ khẩu/CCCD",
                                    "Giấy xác nhận tình trạng hôn nhân",
                                  ].map((item, idx) => {
                                    const checklist =
                                      (editApp || selectedApp).checklist || {};
                                    const isChecked = !!checklist[item];
                                    return (
                                      <div
                                        key={`chk-${item}-${idx}`}
                                        onClick={() => {
                                          if (
                                            !isEditing ||
                                            !isFieldEditable("checklist")
                                          )
                                            return;
                                          handleFieldChange("checklist", {
                                            ...checklist,
                                            [item]: !isChecked,
                                          });
                                        }}
                                        className={cn(
                                          "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                                          isChecked
                                            ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                                            : "bg-slate-800/20 border-slate-800/50 text-slate-500 hover:border-slate-700",
                                        )}
                                      >
                                        <div
                                          className={cn(
                                            "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                                            isChecked
                                              ? "bg-indigo-500 border-indigo-500 text-white"
                                              : "border-slate-700",
                                          )}
                                        >
                                          {isChecked && (
                                            <Check size={12} strokeWidth={4} />
                                          )}
                                        </div>
                                        <span className="text-[11px] font-bold uppercase tracking-wide">
                                          {item}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </section>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* PROGRESS SECTION: TIẾN TRÌNH XỬ LÝ HỒ SƠ (Steps 2-7) */}
                  <div
                    className={cn(
                      "border rounded-3xl overflow-hidden transition-all",
                      theme === "dark"
                        ? "border-slate-800 bg-slate-900/20"
                        : "border-slate-200 bg-white",
                    )}
                  >
                    <div
                      className={cn(
                        "flex flex-wrap items-center justify-between p-5 cursor-pointer transition-colors",
                        expandedSections.includes("PROGRESS_SECTION") &&
                          (theme === "dark"
                            ? "border-b border-slate-800"
                            : "border-b border-slate-200"),
                        theme === "light"
                          ? "hover:bg-slate-50 text-slate-600"
                          : "hover:bg-emerald-500/5 text-slate-300",
                      )}
                      onClick={() => toggleSection("PROGRESS_SECTION")}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                        <h4
                          className={cn(
                            "text-sm font-black uppercase tracking-widest",
                            theme === "dark" ? "text-white" : "text-slate-900",
                          )}
                        >
                          2. TIẾN TRÌNH XỬ LÝ HỒ SƠ
                        </h4>
                      </div>
                      <div className="flex items-center gap-4">
                        {["KT", "PTDA"].includes(userRole) && (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full font-black uppercase border border-emerald-500/20">
                            Vùng trọng tâm của bạn
                          </span>
                        )}
                        {expandedSections.includes("PROGRESS_SECTION") ? (
                          <ChevronUp size={20} className="text-slate-500" />
                        ) : (
                          <ChevronDown size={20} className="text-slate-500" />
                        )}
                      </div>
                    </div>
                    <AnimatePresence>
                      {expandedSections.includes("PROGRESS_SECTION") && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-6 space-y-10">
                            {/* Step 2/GĐ1 */}
                            <section className="space-y-4">
                              <div className="flex items-center gap-2 border-b border-slate-800/30 pb-2">
                                <div className="w-1 h-3 bg-emerald-500 rounded-full opacity-50"></div>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                  {(editApp || selectedApp).workflowType ===
                                  "Quy_trinh_2"
                                    ? "Bước 2: CHỜ NỘP VPĐK (KT)"
                                    : "GĐ1: BÀN GIAO & TIẾP NHẬN"}
                                </h4>
                              </div>
                              {(editApp || selectedApp).workflowType === "Quy_trinh_2" && (editApp || selectedApp).ktHandoverToPtdaDate && (
                                <div className={cn(
                                  "mx-1 mb-4 p-3 rounded-xl border border-dashed flex items-center gap-3",
                                  theme === 'dark' ? "bg-indigo-500/5 border-indigo-500/20" : "bg-indigo-50 border-indigo-200"
                                )}>
                                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-500 shrink-0">
                                    <Clock size={16} />
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider uppercase mb-0.5">Ngày Kế toán bàn giao hồ sơ cho PTDA</p>
                                    <p className={cn("text-xs font-black", theme === 'dark' ? "text-indigo-400" : "text-indigo-600")}>
                                      {formatLogTime((editApp || selectedApp).ktHandoverToPtdaDate)}
                                    </p>
                                  </div>
                                </div>
                              )}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <DetailCard
                                  theme={theme}
                                  label={
                                    isStep2OrLater
                                      ? "(*) Ngày ký HĐCN/HĐMB"
                                      : "Ngày ký HĐCN/HĐMB"
                                  }
                                  value={
                                    (editApp || selectedApp).contractSigningDate
                                  }
                                  type="date"
                                  editable={isFieldEditable(
                                    "contractSigningDate",
                                  )}
                                  isEditing={isEditing}
                                  onChange={(val) =>
                                    handleFieldChange(
                                      "contractSigningDate",
                                      val,
                                    )
                                  }
                                />
                              </div>
                            </section>

                            {/* Step 3/GĐ2 */}
                            <section className="space-y-4">
                              <div className="flex items-center gap-2 border-b border-slate-800/30 pb-2">
                                <div className="w-1 h-3 bg-emerald-500 rounded-full opacity-50"></div>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                  {(editApp || selectedApp).workflowType ===
                                  "Quy_trinh_1"
                                    ? "GĐ2: NỘP VPĐK THEO DÕI THUẾ"
                                    : "Bước 3: NỘP VPĐK (PTDA)"}
                                </h4>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <DetailCard
                                  theme={theme}
                                  label={
                                    isStep3OrLater
                                      ? "(*) Nơi nộp hồ sơ"
                                      : "Nơi nộp hồ sơ"
                                  }
                                  value={
                                    (editApp || selectedApp)
                                      .submissionLocation === "TP_DANANG"
                                      ? "VPĐK Thành phố"
                                      : (editApp || selectedApp)
                                            .submissionLocation === "PHUONG"
                                        ? "VPĐK Quận/Huyện/Phường"
                                        : undefined
                                  }
                                  type="select"
                                  options={[
                                    "---",
                                    "VPĐK Thành phố",
                                    "VPĐK Quận/Huyện/Phường",
                                  ]}
                                  editable={isFieldEditable(
                                    "submissionLocation",
                                  )}
                                  isEditing={isEditing}
                                  onChange={(val) =>
                                    handleFieldChange(
                                      "submissionLocation",
                                      val === "VPĐK Thành phố"
                                        ? "TP_DANANG"
                                        : val === "VPĐK Quận/Huyện/Phường"
                                          ? "PHUONG"
                                          : null,
                                    )
                                  }
                                />
                                <DetailCard
                                  theme={theme}
                                  label={
                                    isStep3OrLater
                                      ? "(*) Mã HS / Số phiếu hẹn"
                                      : "Mã HS / Số phiếu hẹn"
                                  }
                                  value={(editApp || selectedApp).vpdkCode}
                                  editable={isFieldEditable("vpdkCode")}
                                  isEditing={isEditing}
                                  onChange={(val) =>
                                    handleFieldChange("vpdkCode", val)
                                  }
                                />
                                <DetailCard
                                  theme={theme}
                                  label={
                                    isStep3OrLater
                                      ? "(*) Ngày nộp VPĐK"
                                      : "Ngày nộp VPĐK"
                                  }
                                  value={
                                    (editApp || selectedApp).submissionDate
                                  }
                                  type="date"
                                  editable={isFieldEditable("submissionDate")}
                                  isEditing={isEditing}
                                  onChange={(val) =>
                                    handleFieldChange("submissionDate", val)
                                  }
                                />
                                {(editApp || selectedApp).workflowType ===
                                  "Quy_trinh_2" && (
                                  <DetailCard
                                    theme={theme}
                                    label={
                                      isStep3OrLater
                                        ? "(*) Ngày KT bàn giao PTDA"
                                        : "Ngày KT bàn giao PTDA"
                                    }
                                    value={
                                      (editApp || selectedApp)
                                        .ktHandoverToPtdaDate
                                    }
                                    type="date"
                                    editable={isFieldEditable(
                                      "ktHandoverToPtdaDate",
                                    )}
                                    isEditing={isEditing}
                                    onChange={(val) =>
                                      handleFieldChange(
                                        "ktHandoverToPtdaDate",
                                        val,
                                      )
                                    }
                                  />
                                )}
                              </div>
                            </section>

                            {/* Step 4/GĐ3 */}
                            <section className="space-y-4">
                              <div className="flex items-center gap-2 border-b border-slate-800/30 pb-2">
                                <div className="w-1 h-3 bg-emerald-500 rounded-full opacity-50"></div>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                  {(editApp || selectedApp).workflowType ===
                                  "Quy_trinh_1"
                                    ? "GĐ3: THÔNG BÁO THUẾ"
                                    : "Bước 4: THÔNG BÁO THUẾ (PTDA)"}
                                </h4>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <DetailCard
                                  theme={theme}
                                  label="Ngày TB Thuế"
                                  value={
                                    (editApp || selectedApp).taxNotificationDate
                                  }
                                  type="date"
                                  editable={isFieldEditable(
                                    "taxNotificationDate",
                                  )}
                                  isEditing={isEditing}
                                  onChange={(val) =>
                                    handleFieldChange(
                                      "taxNotificationDate",
                                      val,
                                    )
                                  }
                                />
                                {(editApp || selectedApp).workflowType !==
                                  "Quy_trinh_1" && (
                                  <DetailCard
                                    theme={theme}
                                    label="Ngày cung cấp TB Thuế"
                                    value={
                                      (editApp || selectedApp)
                                        .taxNoticeProvisionDate
                                    }
                                    type="date"
                                    editable={isFieldEditable(
                                      "taxNoticeProvisionDate",
                                    )}
                                    isEditing={isEditing}
                                    onChange={(val) =>
                                      handleFieldChange(
                                        "taxNoticeProvisionDate",
                                        val,
                                      )
                                    }
                                  />
                                )}
                              </div>
                            </section>

                            {/* Step 5/GĐ4 */}
                            <section className="space-y-4">
                              <div className="flex items-center gap-2 border-b border-slate-800/30 pb-2">
                                <div className="w-1 h-3 bg-emerald-500 rounded-full opacity-50"></div>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                  {(editApp || selectedApp).workflowType ===
                                  "Quy_trinh_1"
                                    ? "GĐ4: HOÀN THÀNH NVTC & LẤY SỔ"
                                    : "Bước 5: NỘP THUẾ & TÀI CHÍNH (KT)"}
                                </h4>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <DetailCard
                                  theme={theme}
                                  label="Ngày nhận/cung cấp GNT / Nộp thuế"
                                  value={
                                    (editApp || selectedApp).taxReceiptDate
                                  }
                                  type="date"
                                  editable={isFieldEditable("taxReceiptDate")}
                                  isEditing={isEditing}
                                  onChange={(val) =>
                                    handleFieldChange("taxReceiptDate", val)
                                  }
                                />
                              </div>
                            </section>

                            {/* Step 6/GĐ5 */}
                            <section className="space-y-4">
                              <div className="flex items-center gap-2 border-b border-slate-800/30 pb-2">
                                <div className="w-1 h-3 bg-emerald-500 rounded-full opacity-50"></div>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                  {(editApp || selectedApp).workflowType ===
                                  "Quy_trinh_1"
                                    ? "GĐ5: TRÌNH KÝ & NHẬN GCN THỰC TẾ"
                                    : "Bước 6: TRÌNH KÝ & NHẬN GCN (PTDA)"}
                                </h4>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <DetailCard
                                  theme={theme}
                                  label="Ngày trình ký/In GCN"
                                  value={(editApp || selectedApp).gcnSignedDate}
                                  type="date"
                                  editable={isFieldEditable("gcnSignedDate")}
                                  isEditing={isEditing}
                                  onChange={(val) =>
                                    handleFieldChange("gcnSignedDate", val)
                                  }
                                />
                                <DetailCard
                                  theme={theme}
                                  label="Ngày nhận GCN thực tế"
                                  value={
                                    (editApp || selectedApp).gcnReceivedDate
                                  }
                                  type="date"
                                  editable={isFieldEditable("gcnReceivedDate")}
                                  isEditing={isEditing}
                                  onChange={(val) =>
                                    handleFieldChange("gcnReceivedDate", val)
                                  }
                                />
                              </div>
                            </section>

                            {/* Step 7/GĐ6 */}
                            <section className="space-y-4">
                              <div className="flex items-center gap-2 border-b border-slate-800/30 pb-2">
                                <div className="w-1 h-3 bg-emerald-500 rounded-full opacity-50"></div>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                  {(editApp || selectedApp).workflowType ===
                                  "Quy_trinh_1"
                                    ? "GĐ6: BÀN GIAO KHÁCH HÀNG"
                                    : "Bước 7: BÀN GIAO"}
                                </h4>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <DetailCard
                                  theme={theme}
                                  label="Ngày bàn giao GCN cho PTT"
                                  value={
                                    (editApp || selectedApp).ptdaHandoverDate
                                  }
                                  type="date"
                                  editable={isFieldEditable("ptdaHandoverDate")}
                                  isEditing={isEditing}
                                  onChange={(val) =>
                                    handleFieldChange("ptdaHandoverDate", val)
                                  }
                                />
                                <DetailCard
                                  theme={theme}
                                  label={
                                    isFinishedStep
                                      ? "(*) Ngày BG GCN cho khách"
                                      : "Ngày BG GCN cho khách"
                                  }
                                  value={
                                    (editApp || selectedApp)
                                      .customerHandoverDate
                                  }
                                  type="date"
                                  editable={isFieldEditable(
                                    "customerHandoverDate",
                                  )}
                                  isEditing={isEditing}
                                  onChange={(val) =>
                                    handleFieldChange(
                                      "customerHandoverDate",
                                      val,
                                    )
                                  }
                                />
                              </div>
                            </section>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* VƯỚNG MẮC & LỊCH SỬ HỒ SƠ */}
                  <div
                    className={cn(
                      "border rounded-3xl overflow-hidden transition-all",
                      theme === "dark"
                        ? "border-slate-800 bg-slate-900/20"
                        : "border-slate-200 bg-white",
                    )}
                  >
                    <div
                      className={cn(
                        "flex flex-wrap items-center justify-between p-5 transition-colors",
                        theme === "dark"
                          ? "border-b border-slate-800"
                          : "border-b border-slate-200",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-slate-500 rounded-full"></div>
                        <h4
                          className={cn(
                            "text-sm font-black uppercase tracking-widest",
                            theme === "dark" ? "text-white" : "text-slate-900",
                          )}
                        >
                          3. Vướng mắc & Lịch sử Hồ sơ
                        </h4>
                      </div>
                    </div>
                    <div className="p-6 space-y-6">
                      {/* Tabs for Issue Tracking/History/Documents */}
                      <div
                        className={cn(
                          "flex flex-wrap items-center gap-2 p-1 rounded-xl transition-all w-fit",
                          theme === "light"
                            ? "bg-slate-100 border border-slate-200"
                            : "bg-slate-900/50 border border-slate-800",
                        )}
                      >
                        <button
                          onClick={() => setDetailTab("Issues")}
                          className={cn(
                            "px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2",
                            detailTab === "Issues"
                              ? "bg-rose-600 text-white shadow-lg"
                              : theme === "light"
                                ? "text-slate-500 hover:bg-slate-200"
                                : "text-slate-500 hover:text-slate-300",
                          )}
                        >
                          <AlertTriangle size={14} /> Vướng mắc
                        </button>
                        <button
                          onClick={() => setDetailTab("History")}
                          className={cn(
                            "px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2",
                            detailTab === "History"
                              ? "bg-indigo-600 text-white shadow-lg"
                              : theme === "light"
                                ? "text-slate-500 hover:bg-slate-200"
                                : "text-slate-500 hover:text-slate-300",
                          )}
                        >
                          <HistoryIcon size={14} /> Nhật ký & Lịch sử
                        </button>
                        <button
                          onClick={() => setDetailTab("Documents")}
                          className={cn(
                            "px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2",
                            detailTab === "Documents"
                              ? "bg-emerald-600 text-white shadow-lg"
                              : theme === "light"
                                ? "text-slate-500 hover:bg-slate-200"
                                : "text-slate-500 hover:text-slate-300",
                          )}
                        >
                          <FileText size={14} /> Tài liệu số
                        </button>
                      </div>

                      {detailTab === "Issues" && (
                        <div className="space-y-6">
                          <div
                            className={cn(
                              "p-5 rounded-2xl border space-y-4",
                              theme === "light"
                                ? "bg-rose-50 border-rose-100"
                                : "bg-rose-500/5 border-rose-500/20",
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <AlertTriangle
                                  size={16}
                                  className="text-rose-500"
                                />
                                <h4
                                  className={cn(
                                    "text-xs font-bold uppercase tracking-[0.2em]",
                                    theme === "light"
                                      ? "text-rose-700"
                                      : "text-rose-500",
                                  )}
                                >
                                  Cập nhật Vướng mắc & Sai sót
                                </h4>
                              </div>
                              {((editApp || selectedApp).status === "Error" ||
                                (editApp || selectedApp).isRejected) && (
                                <button
                                  onClick={handleResolveError}
                                  className={cn(
                                    "text-[9px] px-3 py-1 rounded-md font-bold uppercase border transition-all",
                                    theme === "light"
                                      ? "bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700 shadow-md shadow-emerald-200"
                                      : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-white",
                                  )}
                                >
                                  Đã khắc phục xong
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <DetailCard
                                theme={theme}
                                label="Phân loại Vướng mắc"
                                value={(editApp || selectedApp).issueType}
                                type="select"
                                editable={isEditing}
                                options={[
                                  "None",
                                  "Sai sót nội bộ",
                                  "Sai sót khách hàng",
                                  "Sai sót cơ quan nhà nước",
                                  "Sai sót chủ đầu tư",
                                  "Sai sót Khác",
                                ]}
                                isEditing={isEditing}
                                onChange={(val) =>
                                  handleFieldChange("issueType", val)
                                }
                              />
                              <DetailCard
                                theme={theme}
                                label="Mức độ"
                                value={(editApp || selectedApp).issueSeverity}
                                type="select"
                                editable={isEditing}
                                options={["Minor", "Moderate", "Critical"]}
                                isEditing={isEditing}
                                onChange={(val) =>
                                  handleFieldChange("issueSeverity", val)
                                }
                              />
                            </div>
                            <DetailCard
                              theme={theme}
                              label="Chi tiết vướng mắc / Ghi chú sai sót"
                              value={(editApp || selectedApp).issueNotes}
                              editable={isEditing}
                              isEditing={isEditing}
                              onChange={(val) =>
                                handleFieldChange("issueNotes", val)
                              }
                            />
                          </div>
                        </div>
                      )}

                      {detailTab === "History" && (
                        <div className="space-y-4">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[700px]">
                              <thead>
                                <tr
                                  className={cn(
                                    "border-b text-[10px] font-black uppercase tracking-wider",
                                    theme === "dark"
                                      ? "border-slate-800 text-slate-500"
                                      : "border-slate-200 text-slate-500",
                                  )}
                                >
                                  <th className="p-3 w-[180px]">Thời gian</th>
                                  <th className="p-3 w-[150px]">Người dùng</th>
                                  <th className="p-3">Nội dung & Hành động</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(() => {
                                  const app = selectedApp || editApp;
                                  if (!app) return null;
                                  const rawHistory =
                                    app.history && app.history.length > 0
                                      ? app.history
                                      : editApp?.history || [];
                                  const h = rawHistory.map((entry) => ({
                                    type: "history",
                                    id: entry.id,
                                    time: entry.receivedDate,
                                    user: entry.performedByName || "Hệ thống",
                                    action: `[Tiến độ] ${entry.stepName}`,
                                    content:
                                      entry.note || "Cập nhật bước xử lý",
                                  }));
                                  const rawAudit =
                                    app.auditTrail && app.auditTrail.length > 0
                                      ? app.auditTrail
                                      : editApp?.auditTrail || [];
                                  const a = rawAudit.map((entry) => ({
                                    type: "audit",
                                    id: entry.id,
                                    time: entry.timestamp,
                                    user: entry.userName,
                                    action: entry.action,
                                    content: entry.changes || "",
                                  }));

                                  const merged = [...h, ...a].sort((x, y) => {
                                    const dateX = new Date(
                                      x.time || 0,
                                    ).getTime();
                                    const dateY = new Date(
                                      y.time || 0,
                                    ).getTime();
                                    return dateY - dateX;
                                  });

                                  if (merged.length === 0)
                                    return (
                                      <tr>
                                        <td
                                          colSpan={3}
                                          className="p-10 text-center text-[10px] text-slate-500 font-black uppercase tracking-widest"
                                        >
                                          Chưa có lịch sử xử lý
                                        </td>
                                      </tr>
                                    );

                                  return merged.map((log, index) => (
                                    <tr
                                      key={`${log.type}-${log.id || "noid"}-${log.time || "notime"}-${index}`}
                                      className={cn(
                                        "border-b transition-colors group",
                                        theme === "dark"
                                          ? "border-slate-800/50 hover:bg-slate-800/20 text-slate-300"
                                          : "border-slate-100 hover:bg-slate-50 text-slate-700",
                                      )}
                                    >
                                      <td className="p-3 text-[11px] whitespace-nowrap align-top pt-4">
                                        <div className="font-bold">
                                          {formatLogTime(log.time)}
                                        </div>
                                      </td>
                                      <td className="p-3 text-[11px] font-bold text-indigo-400 align-top pt-4 whitespace-nowrap">
                                        {log.user}
                                      </td>
                                      <td className="p-3 text-[11px] py-4">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span
                                            className={cn(
                                              "px-2 py-0.5 rounded-md font-black text-[9px] uppercase tracking-tighter",
                                              log.content === "Đã khắc phục"
                                                ? "bg-emerald-500/10 text-emerald-500"
                                                : log.action.includes(
                                                      "[Hàng loạt]",
                                                    )
                                                  ? "bg-purple-500/10 text-purple-500"
                                                  : log.action.includes(
                                                        "[Tiến độ]",
                                                      )
                                                    ? "bg-emerald-500/10 text-emerald-500"
                                                    : "bg-indigo-500/10 text-indigo-500",
                                            )}
                                          >
                                            {log.action}
                                          </span>
                                        </div>
                                        <div
                                          className={cn(
                                            "text-[11px] leading-relaxed",
                                            theme === "dark"
                                              ? "text-slate-400"
                                              : "text-slate-600",
                                          )}
                                        >
                                          {log.content}
                                        </div>
                                      </td>
                                    </tr>
                                  ));
                                })()}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {detailTab === "Documents" && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                          <div className="flex items-center justify-between mb-2 text-left">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                              Danh sách tài liệu đã đính kèm
                            </h4>
                            <div className="relative">
                              <input
                                type="file"
                                id="doc-upload"
                                className="hidden"
                                onChange={handleFileUpload}
                              />
                              <button
                                onClick={() =>
                                  document.getElementById("doc-upload")?.click()
                                }
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
                              >
                                <Plus size={14} /> Tải tài liệu lên
                              </button>
                            </div>
                          </div>

                          {(editApp || selectedApp).scannedFiles &&
                          (editApp || selectedApp).scannedFiles!.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                              {(editApp || selectedApp).scannedFiles?.map(
                                (file, index) => (
                                  <div
                                    key={`${file.id || "scanned-file"}-${index}`}
                                    className={cn(
                                      "p-4 rounded-2xl border transition-all flex items-center justify-between group",
                                      theme === "dark"
                                        ? "bg-slate-800/40 border-slate-700 hover:border-indigo-500/50"
                                        : "bg-slate-50 border-slate-200 hover:border-indigo-300",
                                    )}
                                  >
                                    <div
                                      className="flex items-center gap-3 overflow-hidden cursor-pointer flex-1"
                                      onClick={() => setPreviewFile(file)}
                                    >
                                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                        {file.type.startsWith("image/") ? (
                                          <Camera size={20} />
                                        ) : (
                                          <FileText size={20} />
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                          <p
                                            className={cn(
                                              "text-xs font-bold truncate",
                                              theme === "dark"
                                                ? "text-white"
                                                : "text-slate-900",
                                            )}
                                          >
                                            {file.name}
                                          </p>
                                          {file.isShared && (
                                            <span
                                              className="text-[10px] text-indigo-400 font-bold shrink-0"
                                              title="Tài liệu chung"
                                            >
                                              🔗
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-tighter">
                                          {file.uploadDate}{" "}
                                          {file.isShared &&
                                            "• [🔗 Tài liệu chung]"}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => setPreviewFile(file)}
                                        className="p-2 bg-slate-100 dark:bg-slate-900 text-slate-500 hover:text-indigo-500 rounded-lg transition-all"
                                        title="Xem nhanh"
                                      >
                                        <Eye size={16} />
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDeleteFile(file.id)
                                        }
                                        className="p-2 bg-slate-100 dark:bg-slate-900 text-slate-400 hover:text-rose-500 rounded-lg transition-all"
                                        title="Xóa"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          ) : (
                            <div
                              className={cn(
                                "p-12 border-2 border-dashed rounded-3xl text-center",
                                theme === "dark"
                                  ? "border-slate-800 bg-slate-900/10"
                                  : "border-slate-200 bg-slate-50",
                              )}
                            >
                              <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                                <Upload size={32} className="text-slate-400" />
                              </div>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
                                Chưa có tài liệu số đính kèm
                              </p>
                              <p className="text-[10px] text-slate-400 mt-1 uppercase">
                                Vui lòng nhấp nút bên trên để bắt đầu tải lên
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  "p-6 border-t flex flex-wrap items-center gap-3 mt-auto sticky bottom-0 z-50",
                  theme === "light"
                    ? "bg-white border-slate-200"
                    : "bg-slate-950 border-slate-700",
                )}
              >
                {!isEditing &&
                (editApp || selectedApp).status !== "Completed" ? (
                  <>
                    <div className="flex items-center gap-2">
                      {/* Báo lỗi / Sai sót */}
                      {[
                        "PTT",
                        "KT",
                        "PTDA",
                        "MANAGER",
                        "DIRECTOR",
                        "ADMIN",
                        "MANAGER_ALL",
                        "MANAGER_PTT",
                        "MANAGER_KT",
                        "MANAGER_PTDA",
                      ].includes(userRole) && (
                        <div className="relative">
                          {!isReportIssueFormOpen ? (
                            <button
                              disabled={
                                ![
                                  "PTT",
                                  "KT",
                                  "PTDA",
                                  "MANAGER",
                                  "DIRECTOR",
                                  "ADMIN",
                                  "MANAGER_ALL",
                                  "MANAGER_PTT",
                                  "MANAGER_KT",
                                  "MANAGER_PTDA",
                                ].includes(userRole)
                              }
                              onClick={() => {
                                if (
                                  ![
                                    "PTT",
                                    "KT",
                                    "PTDA",
                                    "MANAGER",
                                    "DIRECTOR",
                                    "ADMIN",
                                    "MANAGER_ALL",
                                    "MANAGER_PTT",
                                    "MANAGER_KT",
                                    "MANAGER_PTDA",
                                  ].includes(userRole)
                                )
                                  return;
                                setIsReportIssueFormOpen(true);
                              }}
                              className="p-4 border border-rose-500/30 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-rose-900/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Báo sai sót"
                            >
                              <AlertTriangle size={20} />
                              <span className="text-[10px] font-black uppercase tracking-widest hidden lg:inline">
                                Báo lỗi
                              </span>
                            </button>
                          ) : (
                            <div
                              className={cn(
                                "absolute bottom-full mb-3 right-0 w-80 p-6 rounded-[2rem] border space-y-4 shadow-2xl z-[101]",
                                theme === "dark"
                                  ? "bg-slate-950 border-rose-500/30 shadow-black"
                                  : "bg-white border-rose-200 shadow-[0_12px_40px_rgba(244,63,94,0.15)]",
                              )}
                            >
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">
                                  Thông tin vướng mắc
                                </label>
                                <button
                                  onClick={() =>
                                    setIsReportIssueFormOpen(false)
                                  }
                                  className="text-slate-400 hover:text-rose-500 p-1"
                                >
                                  <X size={18} />
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <select
                                  value={reportIssueType}
                                  onChange={(e) =>
                                    setReportIssueType(
                                      e.target.value as IssueType,
                                    )
                                  }
                                  className={cn(
                                    "w-full p-3 rounded-xl border text-[10px] font-black uppercase",
                                    theme === "dark"
                                      ? "bg-slate-900 border-slate-700 text-white"
                                      : "bg-white border-slate-200 text-slate-900",
                                  )}
                                >
                                  <option value="Sai sót nội bộ">Nội bộ</option>
                                  <option value="Sai sót khách hàng">
                                    Khách hàng
                                  </option>
                                  <option value="Sai sót cơ quan nhà nước">
                                    CQNN
                                  </option>
                                  <option value="Sai sót chủ đầu tư">
                                    CĐT
                                  </option>
                                  <option value="Sai sót Khác">Khác</option>
                                </select>
                                <select
                                  value={reportIssueSeverity}
                                  onChange={(e) =>
                                    setReportIssueSeverity(
                                      e.target.value as IssueSeverity,
                                    )
                                  }
                                  className={cn(
                                    "w-full p-3 rounded-xl border text-[10px] font-black uppercase",
                                    theme === "dark"
                                      ? "bg-slate-900 border-slate-700 text-white"
                                      : "bg-white border-slate-200 text-slate-900",
                                  )}
                                >
                                  <option value="Critical">Khẩn cấp</option>
                                  <option value="Moderate">Vừa</option>
                                  <option value="Minor">Nhẹ</option>
                                </select>
                              </div>
                              <textarea
                                value={reportIssueNote}
                                onChange={(e) =>
                                  setReportIssueNote(e.target.value)
                                }
                                placeholder="Mô tả chi tiết sai sót..."
                                className={cn(
                                  "w-full p-4 rounded-2xl border text-xs font-bold min-h-[100px] outline-none focus:ring-2 focus:ring-rose-500/20",
                                  theme === "dark"
                                    ? "bg-slate-900 border-slate-800 text-white"
                                    : "bg-white border-slate-200 text-slate-900",
                                )}
                              />
                              <button
                                disabled={
                                  ![
                                    "PTT",
                                    "KT",
                                    "PTDA",
                                    "MANAGER",
                                    "DIRECTOR",
                                    "ADMIN",
                                    "MANAGER_ALL",
                                    "MANAGER_PTT",
                                    "MANAGER_KT",
                                    "MANAGER_PTDA",
                                  ].includes(userRole)
                                }
                                onClick={() => {
                                  if (
                                    ![
                                      "PTT",
                                      "KT",
                                      "PTDA",
                                      "MANAGER",
                                      "DIRECTOR",
                                      "ADMIN",
                                      "MANAGER_ALL",
                                      "MANAGER_PTT",
                                      "MANAGER_KT",
                                      "MANAGER_PTDA",
                                    ].includes(userRole)
                                  )
                                    return;
                                  handleSingleOrBulkReportIssue(
                                    [editApp || selectedApp].filter(
                                      Boolean,
                                    ) as Application[],
                                  );
                                }}
                                className="w-full py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 transition-all shadow-lg shadow-rose-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Xác nhận gửi báo cáo
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Trả về */}
                      {(editApp || selectedApp).currentStep !== "S1_ChuanBi" &&
                        (editApp || selectedApp).currentStep !==
                          "GD1_ChuanBi" && (
                          <button
                            disabled={
                              ![
                                "PTT",
                                "KT",
                                "PTDA",
                                "MANAGER",
                                "DIRECTOR",
                                "ADMIN",
                                "MANAGER_ALL",
                                "MANAGER_PTT",
                                "MANAGER_KT",
                                "MANAGER_PTDA",
                              ].includes(userRole)
                            }
                            onClick={() => {
                              if (
                                ![
                                  "PTT",
                                  "KT",
                                  "PTDA",
                                  "MANAGER",
                                  "DIRECTOR",
                                  "ADMIN",
                                  "MANAGER_ALL",
                                  "MANAGER_PTT",
                                  "MANAGER_KT",
                                  "MANAGER_PTDA",
                                ].includes(userRole)
                              )
                                return;
                              const app = selectedApp || editApp;
                              let returnStep = "";
                              const workflowType =
                                app.workflowType || "Quy_trinh_1";
                              const steps =
                                workflowType === "Quy_trinh_2"
                                  ? WORKFLOW_2_STEPS
                                  : WORKFLOW_1_STEPS;
                              const currentIdx = steps.indexOf(app.currentStep);
                              if (currentIdx > 0)
                                returnStep = steps[currentIdx - 1];

                              const reason = prompt(
                                "Lý do trả hồ sơ / quay lại bước trước:",
                              );
                              if (reason) {
                                if (currentIdx === 1) handleRejectApp(reason);
                                else
                                  handleStepTransition(
                                    returnStep as StepName,
                                    reason,
                                  );
                              }
                            }}
                            className={cn(
                              "p-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border",
                              theme === "light"
                                ? "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                                : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700",
                            )}
                            title="Trả về"
                          >
                            <RotateCcw size={20} />
                            <span className="text-[10px] font-black uppercase tracking-widest hidden lg:inline">
                              Trả về
                            </span>
                          </button>
                        )}

                      {/* Edit Icon */}
                      {effectiveUserCanEdit && (
                        <button
                          onClick={() => {
                            setEditApp(selectedApp);
                            setIsEditing(true);
                          }}
                          className="p-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
                          title="Sửa"
                        >
                          <Edit2 size={20} />
                          <span className="text-[10px] font-black uppercase tracking-widest hidden lg:inline">
                            Sửa hồ sơ
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Main Transition Action */}
                    <div className="flex-1">
                      {(() => {
                        const app = editApp || selectedApp;
                        const role = userRole;
                        if (app.status === "Error") {
                          const isSupportSpecial =
                            app.projectName?.includes("hỗ trợ") &&
                            (app.currentStep === "GD2_Cho_Nop_VPDK" ||
                              app.currentStep === "S3_Nop_VPDK");
                          const currentStepDept = (
                            stepConfig[app.currentStep] ||
                            INITIAL_STEP_CONFIG[app.currentStep]
                          )?.dept;
                          const effectiveDept = isSupportSpecial
                            ? "KT"
                            : currentStepDept;

                          let canAction =
                            role === "ADMIN" ||
                            role === "DIRECTOR" ||
                            role === "MANAGER" ||
                            role === "MANAGER_ALL" ||
                            (role === "MANAGER_PTT" &&
                              effectiveDept === "PTT") ||
                            (role === "MANAGER_KT" && effectiveDept === "KT") ||
                            (role === "MANAGER_PTDA" &&
                              effectiveDept === "PTDA") ||
                            effectiveDept === role;

                          return (
                            <button
                              disabled={!canAction}
                              onClick={() => {
                                if (!canAction) return;
                                handleResolveError();
                              }}
                              className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-500 shadow-xl shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <CheckCircle2 size={20} /> Xác nhận đã khắc phục
                              lỗi
                            </button>
                          );
                        }

                        const isSupportSpecial =
                          app.projectName?.includes("hỗ trợ") &&
                          (app.currentStep === "GD2_Cho_Nop_VPDK" ||
                            app.currentStep === "S3_Nop_VPDK");
                        const currentStepDept = (
                          stepConfig[app.currentStep] ||
                          INITIAL_STEP_CONFIG[app.currentStep]
                        )?.dept;
                        const effectiveDept = isSupportSpecial
                          ? "KT"
                          : currentStepDept;

                        let canAction =
                          role === "ADMIN" ||
                          role === "DIRECTOR" ||
                          role === "MANAGER" ||
                          role === "MANAGER_ALL" ||
                          (role === "MANAGER_PTT" && effectiveDept === "PTT") ||
                          (role === "MANAGER_KT" && effectiveDept === "KT") ||
                          (role === "MANAGER_PTDA" &&
                            effectiveDept === "PTDA") ||
                          effectiveDept === role;
                        const nextStep = app.isSelfService
                          ? app.currentStep === "Hoan_Tat"
                            ? null
                            : ("Hoan_Tat" as StepName)
                          : getNextStep(
                              app.currentStep,
                              app.workflowType || "Quy_trinh_1",
                            );

                        if (canAction && nextStep) {
                          const nextLabel = (
                            stepConfig[nextStep] ||
                            INITIAL_STEP_CONFIG[nextStep]
                          )?.label;
                          return (
                            <button
                              onClick={() => {
                                const bulkSteps = [
                                  "S2_KT_Tiep_Nhan",
                                  "S2_KT_Ban_giao",
                                  "S3_Nop_VPDK",
                                  "S5_Tai_Chinh_Khach_Hang",
                                  "S5_1_PTDA_TiepNhan",
                                  "S6_Nhan_So_GCN",
                                  "S7_PTDA_Ban_Giao",
                                  "S7_1_PTT_Tiep_Nhan",
                                  "S7_2_Ban_Giao_Khach",
                                  "Hoan_Tat",
                                  "GD1_Cho_KT_TiepNhan",
                                  "GD2_Cho_Nop_VPDK",
                                  "GD3_Nop_VPDK",
                                  "GD4_Cho_Nop_NVTC",
                                  "GD4_Cho_KT_TiepNhan_LaySo",
                                  "GD5_Cho_Ky_In_GCN",
                                  "GD5_Cho_GCN",
                                  "GD5_Cho_PTT_TiepNhan_BG",
                                  "GD6_Cho_BG_Khach",
                                ];
                                if (bulkSteps.includes(nextStep)) {
                                  handleBulkStepTransition(nextStep, [app.id]);
                                } else {
                                  handleStepTransition(nextStep);
                                }
                              }}
                              data-confirm-transition
                              className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] hover:bg-indigo-500 shadow-2xl shadow-indigo-900/40 transition-all flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 border-b-4 border-indigo-800"
                            >
                              {app.isSelfService ? (
                                <>
                                  Chuyển thẳng đến Chờ bàn giao{" "}
                                  <ChevronRight size={20} />
                                </>
                              ) : (
                                <>
                                  <span className="opacity-70">
                                    Chuyển tới:
                                  </span>{" "}
                                  {nextLabel} <ChevronRight size={20} />
                                </>
                              )}
                            </button>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </>
                ) : isEditing ? (
                  <div className="flex flex-col gap-4 w-full text-left">
                    {conflictWarning && (
                      <div
                        className={cn(
                          "flex items-start gap-2 px-4 py-3 rounded-2xl mb-2 border",
                          theme === "dark"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30 font-bold"
                            : "bg-amber-50 text-amber-700 border-amber-200",
                        )}
                      >
                        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-bold text-sm">Xung đột dữ liệu!</p>
                          <p className="text-xs opacity-95 font-medium leading-relaxed">
                            {conflictWarning}
                          </p>
                          <div className="flex gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditApp(selectedApp);
                                setConflictWarning(null);
                              }}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                            >
                              Tải lại version mới
                            </button>
                            <button
                              type="button"
                              onClick={() => setConflictWarning(null)}
                              className={cn(
                                "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all",
                                theme === "dark"
                                  ? "border-amber-400/20 text-amber-400 hover:bg-amber-400/10"
                                  : "border-amber-300 text-amber-800 hover:bg-amber-100",
                              )}
                            >
                              Vẫn lưu của tôi
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-4 w-full">
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditApp(null);
                          setConflictWarning(null);
                        }}
                        className={cn(
                          "flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border",
                          theme === "light"
                            ? "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                            : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700",
                        )}
                      >
                        Hủy bỏ
                      </button>
                      <button
                        onClick={handleUpdateApp}
                        className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-emerald-500 shadow-xl shadow-emerald-900/20 transition-all flex items-center justify-center gap-2"
                      >
                        <Save size={20} /> Lưu thay đổi hồ sơ
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
