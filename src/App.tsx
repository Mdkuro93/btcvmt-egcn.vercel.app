import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useDashboardStats } from './modules/dashboard/useDashboardStats';
import { useToast } from './hooks/useToast';
import { useBulkActions } from './hooks/useBulkActions';
import { useApplicationFilters } from './hooks/useApplicationFilters';
import { calculateSLA } from './utils/statusEngine';
import { diffDays } from './utils/dateUtils';
import { buildFlags } from './utils/flagUtils';
import { mapFromSnakeCase, mapToSnakeCase, mapUserFromSnakeCase, mapUserToSnakeCase, safeParse } from './utils/mappers';

// Helper to generate valid UUID v4
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, Cell,
  PieChart, Pie, LabelList, Label, Legend, AreaChart, Area
} from 'recharts';
import { 
  Database,
  RefreshCcw,
  Building2, 
  Files, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Search, 
  Filter, 
  ArrowRight, 
  LayoutDashboard,
  Map as MapIcon,
  User,
  MoreVertical,
  History,
  RotateCcw,
  FileText,
  BookOpen,
  ChevronRight,
  Download,
  ExternalLink,
  Upload,
  LogOut,
  AlertTriangle,
  HelpCircle,
  CreditCard,
  Edit2,
  Edit3,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Menu,
  Save,
  Trash2,
  Printer,
  Key,
  BarChart3,
  ChevronLeft,
  PlusCircle,
  FileBarChart,
  ClipboardList,
  Home,
  Check,
  Settings,
  Users,
  GitMerge,
  Eye,
  Info,
  ShieldCheck,
  FolderArchive,
  TrendingUp,
  Activity,
  Layers,
  MapPin,
  Calendar,
  FileSpreadsheet,
  FileJson,
  Bell,
  BellOff,
  EyeOff,
  Folder,
  FolderOpen,
  Sun,
  Moon,
  Camera,
  Wallet,
  Zap,
  ClipboardCheck,
  MessageSquare,
  UserCheck
} from 'lucide-react';
import DashboardAlerts from './components/DashboardAlerts';
import ErrorReportView from './components/ErrorReportView';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';
import FieldModeView from './components/FieldModeView';
import NotificationPanel from './components/NotificationPanel';
import ProjectManagementView from './components/ProjectManagementView';
import UserManagementView from './components/UserManagementView';
import HandoverRecord from './components/HandoverRecord';
import LoginScreen from './components/LoginScreen';
import ProjectModal from './components/modals/ProjectModal';
import HandoverTicketModal from './components/modals/HandoverTicketModal';
import BulkDocumentModal from './components/modals/BulkDocumentModal';
import BulkNoteModal from './components/modals/BulkNoteModal';
import ChangePasswordModal from './components/modals/ChangePasswordModal';
import FilePreviewModal from './components/modals/FilePreviewModal';
import BulkTransitionModal from './components/modals/BulkTransitionModal';
import BulkIssueModal from './components/modals/BulkIssueModal';
import { Routes, Route, Link } from 'react-router-dom';
import ReportScreen from './pages/ReportScreen';
import { cn } from './lib/utils';
import { formatDate } from './utils/dateUtils';
import { motion, AnimatePresence } from 'motion/react';
import { createClient } from '@supabase/supabase-js';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { MOCK_APPLICATIONS, PROJECTS, STEP_CONFIG as INITIAL_STEP_CONFIG, MOCK_USERS, WORKFLOW_1_STEPS, WORKFLOW_2_STEPS, getNextStep, CONST_QUY_TRINH_1, CONST_QUY_TRINH_2, REGION_ORDER } from './constants';
import { Application, UnitStatus, KPI, Dept, UserProfile, UserPermission, PropertyType, StepName, AppNotification, Project, ApplicationStepHistory, AuditTrailEntry, ScannedFile, IssueType, IssueSeverity } from './types';

type ApplicationHistory = {
  id: string;
  timestamp: string;
  user: string;
  action: string;
};

const DOC_CHECKLIST_ITEMS = [
  'Đơn đăng ký biến động đất đai',
  'Hợp đồng chuyển nhượng',
  'Văn bản về việc nhà ở, công trình nghiệm thu đưa vào sử dụng (áp dụng cho căn hộ)',
  'Văn bản về việc đủ điều kiện chuyển nhượng (áp dụng cho căn hộ, nhà ở hình thành tương lai)',
  'Bản chính tờ khai lệ phí trước bạ',
  'Hóa đơn bán ra',
  'Giấy nộp tiền thuế GTGT, TNDN vãng lai',
  'Giấy nộp tiền thuế phi nông nghiệp',
  'Cam kết vệ sinh môi trường',
  'Biên bản họp HĐTV/HĐQT',
  'Nghị quyết HĐTV/HĐQT',
  'Đăng ký kinh doanh + Ngành kề kinh doanh bất động sản',
  'Tờ khai sử dụng đất PNN'
];

// Supabase Configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://eewikwqwtgmrlvyrfgit.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_gKFEW2pn_2PAif9UkvMqGA_58E2Gj6z';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);



/**
 * Self-healing logic for inconsistent record states
 * If a record has customerHandoverDate but is not in Hoan_Tat step or Completed status,
 * this function identifies it and triggers a sync back to Supabase.
 */
const useSelfHealingData = (applications: Application[], setApplications: (apps: Application[]) => void) => {
  const { showToast } = useToast();
  useEffect(() => {
    if (applications.length === 0) return;

    const inconsistentApps = applications.filter(app => 
      app.customerHandoverDate && (app.currentStep !== 'Hoan_Tat' || app.status !== 'Completed')
    );

    if (inconsistentApps.length > 0) {
      console.log(`[Self-Healing] Detected ${inconsistentApps.length} inconsistent records. Syncing to Supabase...`);
      
      const fixApps = async () => {
        const healedApps = inconsistentApps.map(app => ({
          ...app,
          currentStep: 'Hoan_Tat' as StepName,
          status: 'Completed' as UnitStatus,
          auditTrail: [{
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            userId: 'system',
            userName: 'Hệ thống (Self-Healing)',
            action: 'Đồng bộ trạng thái Hoàn tất dựa trên ngày BG khách'
          }, ...(app.auditTrail || [])]
        }));

        try {
          // Bulk update the inconsistent ones
          const updatedApps = await bulkSyncRecordsToSupabase(healedApps, applications, showToast);
          setApplications(updatedApps);
        } catch (error) {
          console.error('[Self-Healing] Error fixing records:', error);
          showToast('Có lỗi xảy ra, vui lòng thử lại', 'error');
        }
      };

      fixApps();
    }
  }, [applications]); // Only run when total count changes to avoid loops
};


const mapProjectFromSnakeCase = (item: any): Project => {
  return {
    id: item.id,
    name: item.name,
    region: item.region,
    totalUnits: item.total_units || 0
  };
};

const mapProjectToSnakeCase = (project: Project) => {
  return {
    id: project.id,
    name: project.name,
    region: project.region,
    total_units: project.totalUnits
  };
};

const mapNotificationFromSnakeCase = (item: any): AppNotification => {
  return {
    id: item.id,
    recipientId: item.user_id,
    title: item.title,
    message: item.content,
    time: item.created_at,
    type: item.type,
    isRead: item.is_read || false,
    appId: item.record_id
  };
};

const mapNotificationToSnakeCase = (noti: Partial<AppNotification>) => {
  return {
    user_id: noti.recipientId,
    title: noti.title,
    content: noti.message,
    created_at: noti.time || new Date().toISOString(),
    type: noti.type,
    is_read: noti.isRead || false,
    record_id: noti.appId
  };
};

const syncRecordToSupabase = async (app: Application) => {
  const snakeData = mapToSnakeCase(app);
  const { data, error } = await supabase.from('records').upsert(snakeData).select();
  if (error) throw error;
  if (data && data.length > 0) {
    return mapFromSnakeCase(data[0]);
  }
  return app;
};

const bulkSyncRecordsToSupabase = async (appsToSync: Application[], allApplications: Application[], showToast?: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void) => {
  if (appsToSync.length === 0) return allApplications;
  try {
    const recordsToInsert: any[] = appsToSync
      .filter(a => !a.id || typeof a.id === 'string')
      .map(app => {
        const snakeObj = mapToSnakeCase(app);
        delete snakeObj.id; // Ensure id is NOT sent for insert
        return snakeObj;
      });

    const recordsToUpdate: any[] = appsToSync
      .filter(a => a.id && typeof a.id === 'number')
      .map(app => mapToSnakeCase(app));

    let insertedData: any[] = [];
    if (recordsToInsert.length > 0) {
      const { data: insertResult, error: insertError } = await supabase.from('records').insert(recordsToInsert).select();
      if (insertError) throw insertError;
      insertedData = insertResult || [];
    }

    let updatedData: any[] = [];
    if (recordsToUpdate.length > 0) {
      const { data: updateResult, error: updateError } = await supabase.from('records').upsert(recordsToUpdate, { onConflict: 'id' }).select();
      if (updateError) throw updateError;
      updatedData = updateResult || [];
    }
    
    const allReturnedData = [...insertedData, ...updatedData];
    const updatedAppsLocal = [...allApplications];

    if (allReturnedData.length > 0) {
      allReturnedData.forEach(item => {
        const returnedApp = mapFromSnakeCase(item);
        // Find existing app by unitCode if it was a new record (no numeric id yet)
        const idx = updatedAppsLocal.findIndex(a => 
          (typeof returnedApp.id === 'number' && a.id === returnedApp.id) || 
          (a.unitCode === returnedApp.unitCode && typeof a.id !== 'number')
        );
        
        if (idx !== -1) {
          updatedAppsLocal[idx] = returnedApp;
        } else {
          updatedAppsLocal.push(returnedApp);
        }
      });
    }
    return updatedAppsLocal;
  } catch (error) {
    console.error('Lỗi nghiêm trọng trong quá trình bulk sync:', error);
    if (showToast) {
      showToast('Có lỗi xảy ra, vui lòng thử lại', 'error');
    }
    throw error;
  }
};


const formatExcelDate = (val: string | Date | undefined) => {
  if (!val) return '';
  const formatted = formatDate(val);
  return formatted === '---' ? '' : formatted;
};

const parseExcelDate = (value: any): string | undefined => {
  if (!value && value !== 0) return undefined;

  // TH1: Excel Serial Number (XLSX tự convert ngày → số)
  if (typeof value === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(
      excelEpoch.getTime() + value * 24 * 60 * 60 * 1000
    );
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    return undefined;
  }

  // TH2: String DD/MM/YYYY (nếu ô được format là Text)
  if (typeof value === 'string') {
    const trimmed = value.trim();
    
    // DD/MM/YYYY hoặc D/M/YYYY
    if (trimmed.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      const [day, month, year] = trimmed.split('/');
      const date = new Date(
        parseInt(year), 
        parseInt(month) - 1, 
        parseInt(day)
      );
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }

    // YYYY-MM-DD (ISO)
    if (trimmed.match(/^\d{4}-\d{2}-\d{2}/)) {
      return trimmed.split('T')[0];
    }
  }

  return undefined;
};



// Utility for tailwind classes

// Sub-components
const StatCard = ({ title, value, icon: Icon, colorClass, delay, theme = 'dark', onClick, isActive }: { title: string, value: number | string, icon: any, colorClass: string, delay: number, theme?: 'light' | 'dark', onClick?: () => void, isActive?: boolean }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    onClick={onClick}
    className={cn(
      "p-6 rounded-[2.5rem] border flex flex-col gap-4 relative overflow-hidden transition-all group",
      onClick ? "cursor-pointer hover:scale-[1.02] active:scale-95" : "",
      isActive ? "ring-2 ring-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)] border-indigo-500/50" : "",
      theme === 'dark' 
        ? "bg-slate-900/80 backdrop-blur-xl border-slate-700/50 hover:border-festive-gold/30 shadow-2xl" 
        : "bg-white border-slate-200/60 hover:border-festive-gold/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
    )}
  >
    <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/5 rounded-full blur-2xl"></div>
    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-12", colorClass)}>
      <Icon size={28} className="text-white" />
    </div>
    <div>
      <p className={cn("text-xs font-bold uppercase tracking-wider mb-1", theme === 'dark' ? "text-slate-500" : "text-slate-500")}>{title}</p>
      <div className="flex items-center justify-between">
        <p className={cn("text-3xl font-black tracking-tighter", theme === 'dark' ? "text-white" : "text-slate-900")}>{value}</p>
        {onClick && <ArrowRight size={16} className={cn("transition-all", theme === 'dark' ? "text-slate-500 group-hover:text-festive-gold" : "text-slate-400 group-hover:text-festive-gold")} />}
      </div>
    </div>
  </motion.div>
);

const StatusBadge = ({ status, app, variant = 'default' }: { status: UnitStatus | string; app?: Application; variant?: 'default' | 'compact' }) => {
  let effectiveStatus: string = status;
  if (app) {
    if (app.currentStep === 'S3_Nop_VPDK' || app.currentStep === 'GD2_Cho_Nop_VPDK' || app.currentStep === 'GD3_Cho_TBThue') {
      effectiveStatus = (app.vpdkCode && app.submissionLocation && app.submissionDate) ? 'Submitted' : 'WaitingVPDK';
    } else if (app.currentStep === 'S5_Tai_Chinh_Khach_Hang' || app.currentStep === 'GD4_Cho_Nop_NVTC' || app.currentStep === 'GD4_Cho_KT_TiepNhan_LaySo') {
      effectiveStatus = app.taxReceiptDate ? 'TaxPaid' : 'TaxPaymentPending_Dynamic';
    } else if (app.currentStep === 'S5_1_PTDA_TiepNhan') {
       effectiveStatus = 'TaxPaid';
    } else if (['S6_Nhan_So_GCN', 'S7_PTDA_Ban_Giao', 'S7_1_PTT_Tiep_Nhan', 'GD5_Cho_Ky_In_GCN'].includes(app.currentStep)) {
      effectiveStatus = app.gcnSignedDate ? 'GCN_Issued' : 'GCN_SignPending_Dynamic';
    } else if (app.currentStep === 'S7_2_Ban_Giao_Khach' || app.currentStep === 'GD6_Cho_BG_Khach' || app.currentStep === 'GD5_Cho_PTT_TiepNhan_BG') {
       effectiveStatus = app.customerHandoverDate ? 'Completed' : 'WaitingHandover';
    }
  }

  const configs: Record<string, { label: string, classes: string }> = {
    Processing: { label: 'Đang chuẩn bị', classes: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' },
    WaitingVPDK: { label: 'Chờ nộp VPĐK', classes: 'bg-amber-500/10 text-amber-600 border border-amber-500/20' },
    Submitted: { label: 'Đã nộp VPĐK', classes: 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20' },
    TaxPending: { label: 'Chờ thông báo thuế', classes: 'bg-rose-500/10 text-rose-600 border border-rose-500/20' },
    TaxPaymentPending_Dynamic: { label: 'Chờ nộp thuế', classes: 'bg-rose-500/10 text-rose-600 border border-rose-500/20' },
    TaxCompleted: { label: 'Đã hoàn thành NVTC', classes: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' },
    TaxPaid: { label: 'ĐÃ NỘP THUẾ', classes: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]' },
    GCN_SignPending_Dynamic: { label: 'Chờ ký/in GCN', classes: 'bg-sky-500/10 text-sky-600 border border-sky-500/20' },
    GCN_Issued: { label: 'Đã ra GCN', classes: 'bg-sky-500/10 text-sky-600 border border-sky-500/20' },
    WaitingHandover: { label: 'CHỜ BÀN GIAO', classes: 'bg-amber-500/10 text-amber-600 border border-amber-500/20 animate-pulse' },
    Completed: { label: 'Hoàn tất', classes: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' },
    Error: { label: 'Sai sót/Vướng', classes: 'bg-rose-500/10 text-rose-600 border border-rose-500/20' },
    Draft: { label: 'Nháp', classes: 'bg-slate-500/10 text-slate-600 border border-slate-500/20' },
  };

  const config = configs[effectiveStatus] || configs.Processing;
  return (
    <span className={cn(
      variant === 'compact' ? "px-1 py-0 rounded text-[9px] font-bold uppercase tracking-tighter" : "px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider",
      "whitespace-nowrap inline-block", 
      config.classes
    )}>
      {config.label}
    </span>
  );
};

const DetailCard = ({ label, value, field, valueColor = 'text-white', editable = false, type = 'text', options, onChange, isEditing = false, theme = 'dark' }: { label: string, value?: string, field?: keyof Application, valueColor?: string, editable?: boolean, type?: string, options?: string[], onChange?: (val: any) => void, isEditing?: boolean, theme?: 'light' | 'dark' }) => {
  const active = editable && isEditing;
  const darkValueColor = valueColor === 'text-white' ? 'text-white' : valueColor;
  const lightValueColor = valueColor === 'text-white' ? 'text-slate-900' : valueColor;
  
  return (
    <div className={cn(
      "p-4 border rounded-2xl transition-all group backdrop-blur-sm relative overflow-hidden",
      active 
        ? "bg-emerald-500/5 border-emerald-500/30 ring-1 ring-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]" 
        : theme === 'dark' ? "bg-slate-950/40 border-slate-800" : "bg-slate-50/50 border-slate-200 shadow-sm"
    )}>
      {active && <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 blur-2xl -mr-8 -mt-8 rounded-full"></div>}
      
      <p className={cn(
        "text-xs font-bold uppercase mb-1.5 tracking-wider transition-colors leading-tight",
        active ? "text-emerald-500" : theme === 'dark' ? "text-slate-500" : "text-slate-500"
      )}>
        {label}
      </p>

      {active ? (
        <div className="relative z-10">
          {type === 'select' ? (
            <div className="relative">
              <select 
                className={cn(
                  "w-full border rounded-xl px-3 py-2 text-xs font-black text-emerald-400 outline-none focus:ring-2 focus:ring-emerald-500/30 appearance-none cursor-pointer",
                  theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                )}
                value={value || ''}
                onChange={(e) => onChange?.(e.target.value)}
              >
                {options ? (
                  options.map((opt, idx) => <option key={`${opt}-${idx}`} value={opt}>{opt}</option>)
                ) : field === 'submissionLocation' ? (
                  <>
                    <option value="PHUONG">Phường/Xã</option>
                    <option value="TP_DANANG">Tỉnh/Thành phố</option>
                  </>
                ) : field === 'taxPaymentStatus' ? (
                  <>
                    <option value="Unpaid">Chưa nộp</option>
                    <option value="Paid">Đã nộp</option>
                  </>
                ) : null}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none" />
            </div>
          ) : (
            <input 
              type={type}
              className={cn(
                "w-full border rounded-xl px-3 py-1.5 text-xs font-black text-emerald-400 outline-none focus:ring-2 focus:ring-emerald-500/30",
                theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
              )}
              value={value || ''}
              onChange={(e) => onChange?.(e.target.value)}
            />
          )}
        </div>
      ) : (
        <p className={cn("text-xs font-bold truncate transition-colors", theme === 'dark' ? darkValueColor : lightValueColor)}>
          {type === 'date' ? formatDate(value) : (value || '---')}
        </p>
      )}
    </div>
  );
};

const FestiveBranding = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
    {/* Animated Fireworks */}
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ 
          opacity: [0, 0.4, 0, 0.3, 0], 
          scale: [0, 1.2, 1, 1.1, 0.8],
          y: [0, -20, -10, -30, -15]
        }}
        transition={{ 
          duration: 4 + Math.random() * 2, 
          repeat: Infinity, 
          delay: i * 2,
          ease: "easeOut"
        }}
        className="absolute w-32 h-32"
        style={{ 
          left: `${10 + i * 15}%`, 
          top: `${5 + (i % 3) * 15}%` 
        }}
      >
        <div className="absolute inset-0 border-[0.5px] border-festive-gold/40 rounded-full blur-[2px]"></div>
        <div className="absolute inset-8 border-[0.5px] border-rose-400/30 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full blur-[1px] animate-pulse"></div>
      </motion.div>
    ))}

    {/* Background Overlay Tints */}
    <div className="absolute inset-0 bg-festive-dark/20 backdrop-blur-[1px]"></div>
    <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-festive-red/20 via-transparent to-transparent"></div>
    <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-festive-dark/60 to-transparent"></div>
  </div>
);










// BulkTransitionModal and BulkIssueModal have been moved to components/modals/


// FilePreviewModal has been moved to components/modals/


// FilePreviewModal has been moved to components/modals/

const calculateDaysDiff = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const calculateDaysBetweenDates = (start: string, end: string) => {
  const d1 = new Date(start);
  const d2 = new Date(end);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
};

const getPhaseIndex = (step: StepName): number => {
  // Quy trình 2 (7 bước)
  if (step === 'S1_ChuanBi') return 0;
  if (['S2_KT_Tiep_Nhan', 'S2_KT_Ban_giao'].includes(step)) return 1;
  if (step === 'S3_Nop_VPDK') return 2;
  if (step === 'S4_Cho_Thong_Bao_Thue') return 3;
  if (['S5_Tai_Chinh_Khach_Hang', 'S5_1_PTDA_TiepNhan'].includes(step)) return 4;
  if (step === 'S6_Nhan_So_GCN') return 5;
  if (['S7_PTDA_Ban_Giao', 'S7_1_PTT_Tiep_Nhan', 'S7_2_Ban_Giao_Khach'].includes(step)) return 6;
  
  // Quy trình 1 (6 bước)
  if (['GD1_ChuanBi', 'GD1_Cho_KT_TiepNhan'].includes(step)) return 0;
  if (['GD2_Cho_Nop_VPDK'].includes(step)) return 1;
  if (step === 'GD3_Cho_TBThue') return 2;
  if (['GD4_Cho_Nop_NVTC', 'GD4_Cho_KT_TiepNhan_LaySo'].includes(step)) return 3;
  if (['GD5_Cho_Ky_In_GCN', 'GD5_Cho_GCN', 'GD5_Cho_PTT_TiepNhan_BG'].includes(step)) return 4;
  if (['GD6_Cho_BG_Khach'].includes(step)) return 5;

  if (step === 'Hoan_Tat') return 6;
  
  return -1;
};

const getTaxStatus = (app: Application) => {
  if (app.status === 'Error') return { label: 'Sai sót/Vướng mắc', color: 'text-rose-500' };
  if (app.taxReceiptDate) return { label: 'Hoàn thành', color: 'text-emerald-500' };
  if (!app.taxNotificationReceivedDate) return { label: 'Chưa có TB thuế', color: 'text-slate-500' };
  return { label: 'Chưa hoàn thành', color: 'text-amber-500' };
};

const getOverdueInfo = (app: any, stepConfig: Record<string, any>, slaConfig: Record<string, number>) => {
  if (app._sla) {
    return app._sla;
  }
  return calculateSLA(app, stepConfig, slaConfig);
};


const PrintStyles = () => (
  <style>{`
    @media print {
      @page { size: A4; margin: 20mm; }
      body * { visibility: hidden; }
      #print-section, #print-section * { visibility: visible; }
      #print-section {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        background: white !important;
        color: black !important;
        font-family: "Times New Roman", serif;
      }
      .no-print { display: none !important; }
    }
  `}</style>
);


// HandoverRecord template moved to components/

export default function App() {
  
  const [search, setSearch] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'applications' | 'users' | 'resources' | 'reports' | 'settings'>('dashboard');
  const [reportType, setReportType] = useState<'PROJECT' | 'REGION' | 'LOAN' | 'SLA' | 'PERFORMANCE' | 'ERROR'>('LOAN');

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
  }, [theme]);

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Initialize session on app load
  useEffect(() => {
    const initSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.session.user.id)
          .maybeSingle();

        if (profile) {
          setCurrentUser(mapUserFromSnakeCase(profile));
        }
      }
    };
    initSession();
  }, []);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const [taskReminders, setTaskReminders] = useState<AppNotification[]>([]);
  const [isPrintingHandover, setIsPrintingHandover] = useState(false);
  const [printHandoverApps, setPrintHandoverApps] = useState<Application[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [previewFile, setPreviewFile] = useState<ScannedFile | null>(null);
  const [isBulkDocumentOpen, setIsBulkDocumentOpen] = useState(false);
  const [isUploadingShared, setIsUploadingShared] = useState(false);

  useEffect(() => {
    const handleMobileSignal = setInterval(() => {
       if ((window as any).__openBulkDocsFromMobile) {
          const ids = (window as any).__mobileSelectedIds || [];
          if (ids.length > 0) {
             setSelectedAppIds(ids);
             setIsBulkDocumentOpen(true);
          }
          (window as any).__openBulkDocsFromMobile = false;
          (window as any).__mobileSelectedIds = [];
       }
    }, 500);
    return () => clearInterval(handleMobileSignal);
  }, []);
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user || null;
      
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          const mapped = mapUserFromSnakeCase(profile);
          setCurrentUser(mapped);
          
          // RESET dependent state on auth change
          setApplications([]);
          setDashboardApps([]);
          setSelectedAppIds([]);
          setCurrentPage(0);
          setSearch('');
        }
      } else {
        setCurrentUser(null);
        setApplications([]);
        setDashboardApps([]);
        setSelectedAppIds([]);
        setCurrentPage(0);
        setSearch('');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const [stepConfig, setStepConfig] = useState<Record<string, { label: string, dept: Dept, status: UnitStatus, slaDays?: number, active: boolean }>>(INITIAL_STEP_CONFIG);
  const [projects, setProjects] = useState<Project[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  useSelfHealingData(applications, setApplications);
  const [dashboardApps, setDashboardApps] = useState<Application[]>([]);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [isLoadingApps, setIsLoadingApps] = useState(true);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isChartsReady, setIsChartsReady] = useState(false);

  useEffect(() => {
    setIsChartsReady(false);
    const id = setTimeout(() => setIsChartsReady(true), 200);
    return () => clearTimeout(id);
  }, [dashboardApps]);
  const [storageStats, setStorageStats] = useState<{ totalSize: number, fileCount: number, folders: string[], dbSize: number }>({ totalSize: 0, fileCount: 0, folders: [], dbSize: 0 });
  const [isFetchingStorage, setIsFetchingStorage] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // System Configuration States
  const [slaConfig, setSlaConfig] = useState<Record<string, number>>({});
  const [checklistTemplates, setChecklistTemplates] = useState<string[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<UnitStatus | 'ALL'>('ALL');
  const [filterLoanStatus, setFilterLoanStatus] = useState<'Co_Vay' | 'Khong_Vay' | 'ALL'>('ALL');
  const [filterSelfService, setFilterSelfService] = useState<'YES' | 'NO' | 'ALL'>('ALL');
  const [filterIssue, setFilterIssue] = useState<'ALL' | 'ERROR'>('ALL');
  const [filterSLAStatus, setFilterSLAStatus] = useState<'ALL' | 'OVERDUE'>('ALL');
  const [selectedFlags, setSelectedFlags] = useState<string[]>([]);
  const [dashboardFilter, setDashboardFilter] = useState<string>('ALL');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__STEP_CONFIG__ = stepConfig;
    }
  }, [stepConfig]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__SLA_CONFIG__ = slaConfig;
    }
  }, [slaConfig]);

  const handleDashboardClick = (filter: string) => {
    setActiveTab('applications');
    setDashboardFilter(prev => prev === filter ? 'ALL' : filter);
    setFilterStatus('ALL');
    setFilterIssue('ALL');
    setFilterSLAStatus('ALL');
    setFilterLoanStatus('ALL');
    setSelectedFlags([]);
    setSearch('');
  };

  const [handoverTemplate, setHandoverTemplate] = useState(() => {
    const saved = localStorage.getItem('procedural_handover_template');
    return safeParse(saved, {
      companyName: 'TẬP ĐOÀN SUNGROUP',
      subTitle: 'Vùng Đà Nẵng',
      docCode: 'Mẫu HC-09-BM04',
      title: 'BIÊN BẢN BÀN GIAO',
      subTitle2: 'Nội dung bàn giao',
      address: 'Phường Hòa Hiệp Nam, Quận Liên Chiểu, TP Đà Nẵng',
      footerNote1: 'Người bàn giao: Ký và ghi rõ họ tên.',
      footerNote2: 'Người nhận: Ký và ghi rõ họ tên.'
    });
  });

  const enrichedDashboardApps = useMemo(() => {
    return (dashboardApps || []).map(a => ({
      ...a,
      _sla: calculateSLA(a)
    }));
  }, [dashboardApps]);

  const stats = useDashboardStats(enrichedDashboardApps);
  const filteredApps = useApplicationFilters(
    enrichedDashboardApps, 
    dashboardFilter,
    search,
    filterStatus,
    filterLoanStatus,
    filterSelfService,
    filterIssue,
    currentUser?.dept,
    filterSLAStatus,
    selectedFlags
  );

  
  const handleUpdatePassword = async () => {
    if (!currentUser?.username) {
      showToast('Không tìm thấy thông tin phiên đăng nhập hiện tại.', 'error');
      return;
    }
    if (!passwordForm.newPassword) {
      showToast('Vui lòng nhập mật khẩu mới.', 'warning');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('Mật khẩu xác nhận không khớp.', 'error');
      return;
    }

    setIsSavingApp(true);
    try {
      // Gọi hàm RPC chuyên biệt đã tạo trên Database để băm bảo mật
      const { data, error } = await supabase.rpc('secure_change_password', {
        p_username: currentUser.username,
        p_new_password: passwordForm.newPassword
      });

      if (error) throw error;
      
      showToast('Đổi mật khẩu bảo mật thành công!', 'success');
      setIsChangePasswordModalOpen(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Lỗi đổi mật khẩu:', error.message);
      showToast(`Đổi mật khẩu thất bại: ${error.message || 'Lỗi hệ thống'}`, 'error');
    } finally {
      setIsSavingApp(false);
    }
  };

  const fetchRefs = useRef<any>({});

  // Reliability: Using Polling instead of WebSocket (due to sandbox constraints)
  useEffect(() => {
    if (!currentUser?.id) return;

    // Setup Polling Interval (every 30 seconds)
    const pollInterval = setInterval(() => {
      try {
        if (fetchRefs.current.fetchDashboardApps) fetchRefs.current.fetchDashboardApps();
      } catch (err) {
        console.error("Polling fetch failed silently:", err);
      }
    }, 30000);

    return () => clearInterval(pollInterval);
  }, [currentUser?.id]);

  const fetchStorageUsage = async () => {
    setIsFetchingStorage(true);
    try {
      // 1. Fetch File Storage Stats
      const { data: rootItems, error: rootError } = await supabase.storage.from('Documents-GCN').list();
      if (rootError) throw rootError;

      let totalSize = 0;
      let totalFiles = 0;
      const folderNames: string[] = [];

      for (const item of rootItems) {
        if (item.id) { // It's a file in the root
          if (item.metadata) {
            totalSize += item.metadata.size;
            totalFiles += 1;
          }
        } else { // It's a folder
          folderNames.push(item.name);
          const { data: folderFiles, error: folderError } = await supabase.storage.from('Documents-GCN').list(item.name);
          if (!folderError && folderFiles) {
            folderFiles.forEach(f => {
              if (f.metadata) {
                totalSize += f.metadata.size;
                totalFiles += 1;
              }
            });
          }
        }
      }

      // 2. Fetch Database Size via RPC (SELECT pg_database_size(current_database()))
      // Note: This requires an RPC function 'get_database_size' to be created in Supabase SQL Editor:
      // CREATE OR REPLACE FUNCTION get_database_size() RETURNS bigint AS $$ SELECT pg_database_size(current_database()); $$ LANGUAGE sql SECURITY DEFINER;
      let dbSize = 0;
      try {
        const { data: dbSizeData, error: dbSizeError } = await supabase.rpc('get_database_size');
        if (!dbSizeError && dbSizeData) {
          dbSize = dbSizeData;
        }
      } catch (e) {
        console.warn('Database size RPC not found or failed. Ensure "get_database_size" function exists in Supabase.', e);
      }

      setStorageStats({
        totalSize,
        fileCount: totalFiles,
        folders: folderNames,
        dbSize
      });
    } catch (error) {
      console.error('Error fetching storage stats:', error);
     showToast('Có lỗi xảy ra, vui lòng thử lại', 'error');
     } finally {
      setIsFetchingStorage(false);
    }
  };

  // Fetch all data from Supabase
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsInitialLoading(true);
      setIsLoadingApps(true);
      setIsLoadingConfig(true);
      try {
        // 1. Fetch data in parallel
        const responses = await Promise.allSettled([
          supabase.from('users').select('*'),
          supabase.from('system_configs').select('*')
        ]);

        const usersRes = responses[0].status === 'fulfilled' ? responses[0].value : { data: null, error: (responses[0] as any).reason };
        const configRes = responses[1].status === 'fulfilled' ? responses[1].value : { data: null, error: (responses[1] as any).reason };

        if (usersRes.error) console.error('Error fetching users:', usersRes.error);
        if (configRes.error) console.error('Error fetching config:', configRes.error);

        const usersData = usersRes.data;
        const configData = configRes.data;

        // Process Configs 
        const configMap: any = {};
        if (configData && configData.length > 0) {
          configData.forEach(c => {
            configMap[c.key] = safeParse(c.value, c.value);
          });
        }
          
        if (configData) {
          const defaultSla = Object.values(INITIAL_STEP_CONFIG).reduce((acc: any, s: any) => ({ ...acc, [s.label]: s.slaDays || 10 }), {});
          const currentSla = configMap.slaConfig || defaultSla;
          const currentChecklist = configMap.checklistTemplates || DOC_CHECKLIST_ITEMS;
          const currentSteps = { ...INITIAL_STEP_CONFIG, ...(configMap.stepConfig || {}) };
          const currentHandover = configMap.handoverTemplate || {
            companyName: 'TẬP ĐOÀN SUNGROUP',
            title: 'BIÊN BẢN BÀN GIAO HỒ SƠ',
            subTitle: 'Dự án / Địa điểm',
            subTitle2: 'Nội dung bàn giao',
            docCode: 'BM-XXX',
            address: 'Địa chỉ...',
            footerNote1: 'Ghi chú 1',
            footerNote2: 'Ghi chú 2'
          };
          
          // Force update company name if it's the old one
          if (currentHandover.companyName === 'CÔNG TY CỔ PHẦN ĐẦU TƯ LIÊN CHIỂU') {
            currentHandover.companyName = 'TẬP ĐOÀN SUNGROUP';
          }
          const allProjectsRaw = (configMap.projects || PROJECTS) as any[];
          const currentProjects = allProjectsRaw.filter((p, index, self) => 
            p && p.id && index === self.findIndex((t) => t && t.id === p.id)
          );

          setSlaConfig(currentSla);
          setChecklistTemplates(currentChecklist);
          setStepConfig(currentSteps);
          setHandoverTemplate(currentHandover);
          setProjects(currentProjects);

          // Bootstrap missing configs to Supabase
          const requiredKeys = ['slaConfig', 'checklistTemplates', 'stepConfig', 'handoverTemplate', 'projects'];
          for (const key of requiredKeys) {
            if (!configMap[key]) {
              let val = key === 'slaConfig' ? currentSla 
                      : key === 'checklistTemplates' ? currentChecklist
                      : key === 'stepConfig' ? currentSteps
                      : key === 'handoverTemplate' ? currentHandover
                      : currentProjects;
              
              await supabase.from('system_configs').upsert({ key, value: val, updated_at: new Date().toISOString() }, { onConflict: 'key' });
            }
          }
        }
        if (usersData) setUsers(usersData.map(mapUserFromSnakeCase));
        else setUsers(MOCK_USERS);

        // Fetch records is handled separately by currentUser effect
        // fetchApplications();
        
        setIsLoadingConfig(false);
        setIsInitialLoading(false);
      } catch (e) {
         console.error('Error initializing:', e);
     showToast('Có lỗi xảy ra, vui lòng thử lại', 'error');
     setIsLoadingConfig(false);
         setIsInitialLoading(false);
         setApplications(MOCK_APPLICATIONS);
         setUsers(MOCK_USERS);
         setProjects(PROJECTS);
      }
      setIsLoadingApps(false); 
    };
    fetchInitialData();
  }, []);

  const fetchApplications = async () => {
    setIsLoadingApps(true);
    try {
      let query = supabase.from('records').select('*', { count: 'exact' });
      
      if (search) {
        query = query.or(`unit_code.ilike.%${search}%,customer_name.ilike.%${search}%,project_name.ilike.%${search}%,phone_number.ilike.%${search}%`);
      }

      const hasProjectAssignments = currentUser?.assignedProjectIds && currentUser.assignedProjectIds.length > 0;

      if (selectedProjectId && selectedProject) {
        query = query.eq('project_name', selectedProject.name);
      } else if (userRole !== 'ADMIN' && hasProjectAssignments) {
        const assignedNames = projects.filter(p => currentUser.assignedProjectIds?.includes(p.id)).map(p => p.name);
        if (assignedNames.length > 0) {
          query = query.in('project_name', assignedNames);
        }
      }
      
      // Advanced Filters
      if (filterStatus && filterStatus !== 'ALL' && filterStatus !== '') {
        let dbStatus = filterStatus as string;
        // Map Vietnamese labels back to DB values if they happen to be used
        const normalized = filterStatus.toLowerCase();
        if (normalized === 'đang chuẩn bị' || normalized === 'processing') dbStatus = 'Processing';
        else if (normalized === 'chờ nộp vpđk' || normalized === 'waitingvpdk') dbStatus = 'WaitingVPDK';
        else if (normalized === 'đã nộp vpđk' || normalized === 'submitted') dbStatus = 'Submitted';
        else if (normalized === 'chờ nộp thuế' || normalized === 'chờ thông báo thuế' || normalized === 'taxpending') dbStatus = 'TaxPending';
        else if (normalized === 'đã nộp thuế' || normalized === 'taxpaid') dbStatus = 'TaxPaid';
        else if (normalized === 'đã hoàn thành nvtc' || normalized === 'taxcompleted') dbStatus = 'TaxCompleted';
        else if (normalized === 'chờ bàn giao' || normalized === 'waitinghandover') dbStatus = 'WaitingHandover';
        else if (normalized === 'hoàn tất' || normalized === 'completed') dbStatus = 'Completed';
        else if (normalized === 'sai sót/vướng' || normalized === 'error') dbStatus = 'Error';
        
        query = query.eq('status', dbStatus);
      }
      if (filterLoanStatus && filterLoanStatus !== 'ALL' && filterLoanStatus !== '') {
        query = query.eq('loan_status', filterLoanStatus);
      }
      if (filterSelfService !== 'ALL') {
        query = query.eq('is_self_service', filterSelfService === 'YES');
      }
      if (filterIssue === 'ERROR') {
        query = query.or('status.eq.Error,is_rejected.eq.true');
      }

      // Dashboard Filters Shorthand
      if (dashboardFilter && dashboardFilter !== 'ALL') {
        let mappedStatus = dashboardFilter;
        // Mapping from Dashboard Chart labels (Vietnamese) to Database Statuses
        const dNorm = dashboardFilter.toUpperCase();
        if (dNorm === 'ĐANG CHUẨN BỊ') mappedStatus = 'Processing';
        else if (dNorm === 'CHỜ NỘP' || dNorm === 'CHỜ NỘP VPĐK') mappedStatus = 'WaitingVPDK';
        else if (dNorm === 'ĐÃ NỘP VPĐK') mappedStatus = 'Submitted';
        else if (dNorm === 'CHỜ TB THUẾ') mappedStatus = 'TaxPending';
        else if (dNorm === 'CHỜ NVTC' || dNorm === 'CHỜ HOÀN THÀNH NVTC') mappedStatus = 'TaxPending';
        else if (dNorm === 'ĐÃ NỘP THUẾ') mappedStatus = 'TaxPaid';
        else if (dNorm === 'ĐÃ HOÀN THÀNH NVTC') mappedStatus = 'TaxCompleted';
        else if (dNorm === 'ĐÃ CÓ GCN' || dNorm === 'ĐÃ RA GCN') mappedStatus = 'GCN_Issued';
        else if (dNorm === 'CHỜ BÀN GIAO') mappedStatus = 'WaitingHandover';
        else if (dNorm === 'HOÀN TẤT') mappedStatus = 'Completed';

        // Apply mapped status if it's one of the standard statuses
        if (['Processing', 'WaitingVPDK', 'Submitted', 'TaxPending', 'TaxCompleted', 'TaxPaid', 'GCN_Issued', 'Completed', 'WaitingHandover'].includes(mappedStatus)) {
          query = query.eq('status', mappedStatus);
        }

        if (dashboardFilter === 'ERROR') query = query.eq('status', 'Error');
        if (dashboardFilter === 'COMPLETED') query = query.eq('status', 'Completed');
        if (dashboardFilter === 'OVERDUE') {
          // Overdue filter done client-side usually, but let's at least not break the server query
        }
        if (dashboardFilter === 'PTT_PROCESSING') {
          query = query.or('status.eq.ĐANG_CHUẨN_BỊ,current_step.eq.ĐANG_CHUẨN_BỊ,status.eq.Processing,step.eq.PREPARING');
        }
        if (dashboardFilter === 'PTT_HOLDING') {
          const pttSteps = Object.keys(INITIAL_STEP_CONFIG).filter(k => INITIAL_STEP_CONFIG[k].dept === 'PTT');
          query = query.in('current_step', pttSteps);
        }
        if (dashboardFilter === 'PTT_ISSUES') query = query.or('is_rejected.eq.true,status.eq.Error');
        if (dashboardFilter === 'PTT_TAX_UNPAID') query = query.or('status.eq.AWAITING_FINANCE,current_step.eq.CHỜ HOÀN THÀNH NVTC,status.eq.CHỜ HOÀN THÀNH NVTC,status.eq.TaxPending');
        if (dashboardFilter === 'PTT_WAITING_HANDOVER') query = query.or('status.eq.WAITING_HANDOVER,current_step.eq.CHỜ BÀN GIAO,status.eq.CHỜ BÀN GIAO,status.eq.WaitingHandover');

        if (dashboardFilter === 'KT_NEED_RECEIVE') query = query.in('current_step', ['S2_KT_Tiep_Nhan', 'GD1_Cho_KT_TiepNhan', 'GD2_Cho_Nop_VPDK']);
        if (dashboardFilter === 'KT_PROCESSING') query = query.in('current_step', ['S2_KT_Tiep_Nhan', 'GD1_Cho_KT_TiepNhan', 'GD2_Cho_Nop_VPDK', 'GD4_Cho_KT_TiepNhan_LaySo', 'GD5_Cho_GCN']);
        if (dashboardFilter === 'KT_ISSUES') {
          const ktSteps = Object.keys(INITIAL_STEP_CONFIG).filter(k => INITIAL_STEP_CONFIG[k].dept === 'KT');
          query = query.in('current_step', ktSteps).or('is_rejected.eq.true,status.eq.Error');
        }
        if (dashboardFilter === 'PTDA_RECEIVED') query = query.in('current_step', ['S2_KT_Ban_giao', 'S5_1_PTDA_TiepNhan', 'GD2_Cho_Nop_VPDK', 'S3_Nop_VPDK']);
        if (dashboardFilter === 'PTDA_DA_NOP_VPDK') query = query.eq('current_step', 'S3_Nop_VPDK');
        if (dashboardFilter === 'PTDA_NO_TAX') query = query.in('current_step', ['GD3_Cho_TBThue', 'S4_Cho_Thong_Bao_Thue']);
        if (dashboardFilter === 'PTDA_TAX_PENDING') query = query.in('current_step', ['S5_Tai_Chinh_Khach_Hang', 'GD4_Cho_NVTC', 'GD4_Cho_Nop_NVTC']).filter('tax_receipt_date', 'is', null);
        if (dashboardFilter === 'PTDA_GCN_WAITING') query = query.in('current_step', ['S6_Nhan_So_GCN', 'GD5_Cho_Ky_In_GCN']).filter('gcn_signed_date', 'is', null);
        if (dashboardFilter === 'PTDA_ISSUES') {
          const ptdaSteps = Object.keys(INITIAL_STEP_CONFIG).filter(k => INITIAL_STEP_CONFIG[k].dept === 'PTDA');
          query = query.in('current_step', ptdaSteps).or('is_rejected.eq.true,status.eq.Error');
        }
      }
      
      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1);
        
      if (error) throw error;
      
      setApplications((data || []).map(mapFromSnakeCase));
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching paginated records:', error);
     showToast('Có lỗi xảy ra, vui lòng thử lại', 'error');
     setApplications([]);
      setTotalCount(0);
      // Suppress UI error to keep dashboard smooth
    } finally {
      setIsLoadingApps(false);
    }
  };

  useEffect(() => {
    setCurrentPage(0);
  }, [search, selectedProjectId, filterStatus, filterLoanStatus, filterSelfService, filterIssue, dashboardFilter, filterSLAStatus, selectedFlags]);

  useEffect(() => {
    if (!currentUser) return;

    const handler = setTimeout(() => {
      fetchApplications();
    }, 400);
    
    return () => clearTimeout(handler);
  }, [currentUser, search, currentPage, pageSize, selectedProjectId, filterStatus, filterLoanStatus, filterSelfService, filterIssue, dashboardFilter, filterSLAStatus]);

  useEffect(() => {
    if (activeTab === 'applications' && currentUser) {
      fetchApplications();
    }
  }, [activeTab, currentUser]);

  const fetchDashboardApps = async () => {
    setIsLoadingDashboard(true);
    try {
      // Fetch ALL records for dashboard stats, ignoring pagination and filters
      let query = supabase.from('records').select('*');
      
      const currentUserRole = currentUser?.dept || 'PTT';
      
      // We still respect project filtering if set, but we fetch ALL records within that scope
      if (selectedProjectId) {
        const currentSelectedProject = projects.find(p => p.id === selectedProjectId);
        if (currentSelectedProject) {
          query = query.eq('project_name', currentSelectedProject.name);
        }
      } else if (currentUserRole !== 'ADMIN') {
        const hasProjectAssignments = currentUser?.assignedProjectIds && currentUser.assignedProjectIds.length > 0;
        if (hasProjectAssignments) {
          const assignedNames = projects.filter(p => currentUser.assignedProjectIds.includes(p.id)).map(p => p.name);
          if (assignedNames.length > 0) {
            query = query.in('project_name', assignedNames);
          }
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      setDashboardApps((data || []).map(mapFromSnakeCase));
    } catch (error) {
      console.error('Error fetching dashboard records:', error);
     showToast('Có lỗi xảy ra, vui lòng thử lại', 'error');
     setDashboardApps([]);
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  useEffect(() => {
    fetchRefs.current = { fetchApplications, fetchDashboardApps };
  });

  useEffect(() => {
    if (currentUser) {
      fetchDashboardApps();
    }
  }, [selectedProjectId, currentUser, projects]);

  useEffect(() => {
    if (applications.length > 0) localStorage.setItem('procedural_apps', JSON.stringify(applications));
  }, [applications]);

  useEffect(() => {
    if (users.length > 0) localStorage.setItem('procedural_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (projects.length > 0) localStorage.setItem('procedural_projects', JSON.stringify(projects));
  }, [projects]);


  const deleteAllNotificationsForRecord = async (recordId: string | number) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('record_id', recordId);
      if (error) throw error;
      setNotifications(prev => prev.filter(n => n.appId !== recordId));
    } catch (error) {
      console.error('Error deleting notifications for record:', error);
     showToast('Có lỗi xảy ra, vui lòng thử lại', 'error');
     }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
     showToast('Có lỗi xảy ra, vui lòng thử lại', 'error');
     }
  };

  const clearAllAppNotifications = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything
      if (error) throw error;
      setNotifications([]);
      showToast('Đã xóa toàn bộ thông báo hệ thống.', 'success');
    } catch (error) {
      console.error('Error clearing all notifications:', error);
     showToast('Lỗi khi dọn dẹp thông báo.', 'error');
    }
  };

  const cleanupJunkFiles = async () => {
    setIsLoadingConfig(true);
    try {
      // For Supabase Storage v2+ list() can take recursive in options if supported, 
      // but in some environments it causes issues if not handled by the specific client version.
      const { data: allFiles, error: listError } = await supabase.storage
        .from('Documents-GCN')
        .list('', { 
          limit: 1000, 
          offset: 0,
          sortBy: { column: 'name', order: 'asc' }
        });
      
      if (listError) throw listError;

      const usedPaths = new Set();
      applications.forEach(app => {
        (app.scannedFiles || []).forEach(file => {
          if (file.path) usedPaths.add(file.path);
        });
      });

      const filesToDelete = (allFiles || [])
        .filter(file => file.metadata !== null) // It's a file, not a folder
        .filter(file => !usedPaths.has(file.name))
        .map(file => file.name);

      if (filesToDelete.length === 0) {
        showToast('Không tìm thấy file rác nào.', 'warning');
        return;
      }

      const { error: removeError } = await supabase.storage
        .from('Documents-GCN')
        .remove(filesToDelete);

      if (removeError) throw removeError;

      showToast(`Đã dọn dẹp ${filesToDelete.length} file rác thành công.`, 'success');
      fetchStorageUsage();
    } catch (e) {
      console.error('Error cleaning up junk files:', e);
     showToast('Có lỗi xảy ra khi dọn dẹp file rác.', 'error');
    } finally {
      setIsLoadingConfig(false);
    }
  };

  const fetchNotifications = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      if (data) {
        setNotifications(data.map(mapNotificationFromSnakeCase));
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
     showToast('Có lỗi xảy ra, vui lòng thử lại', 'error');
     }
  };

  const createNotification = async (noti: Partial<AppNotification>) => {
    try {
      const snakeData = mapNotificationToSnakeCase(noti);
      const { error } = await supabase.from('notifications').insert(snakeData);
      if (error) throw error;
    } catch (error) {
      console.error('Error creating notification:', error);
     showToast('Có lỗi xảy ra, vui lòng thử lại', 'error');
     }
  };

  const notifyNextDepartment = async (app: Application, targetStep: StepName) => {
    const step = stepConfig[targetStep] || INITIAL_STEP_CONFIG[targetStep];
    const targetDept = step.dept;
    
    // Find all users in the target department
    const targetUsers = users.filter(u => u.dept === targetDept && u.id !== currentUser?.id);
    
    if (targetUsers.length > 0) {
      const promises = targetUsers.map(u => 
        createNotification({
          recipientId: u.id,
          title: 'Bàn giao hồ sơ mới',
          message: `Hồ sơ ${app.unitCode} đã được chuyển đến bộ phận của bạn từ ${currentUser?.name}.`,
          type: 'Info',
          appId: app.id
        })
      );
      await Promise.all(promises);
    }
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      
      if (error) throw error;
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error('Error marking notification as read:', error);
     showToast('Có lỗi xảy ra, vui lòng thử lại', 'error');
     }
  };

  const markAllNotificationsAsRead = async () => {
    if (!currentUser) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', currentUser.id)
        .eq('is_read', false);
      
      if (error) throw error;
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
     showToast('Có lỗi xảy ra, vui lòng thử lại', 'error');
     }
  };

  useEffect(() => {
    if (!currentUser?.id) return;

    fetchNotifications(currentUser.id);

    const pollInterval = setInterval(() => {
      fetchNotifications(currentUser.id);
    }, 45000); // Poll notifications every 45s

    return () => clearInterval(pollInterval);
  }, [currentUser?.id]);

  // Automated Task Reminders
  useEffect(() => {
    if (!currentUser) return;
    
    const role = currentUser.dept;
    const reminders: AppNotification[] = [];

    dashboardApps.forEach(app => {
      const step = stepConfig[app.currentStep];
      if (!step) return;

      // 1. New apps needing attention (Step dept matches user dept)
      if (step.dept === role && app.status !== 'Completed') {
        const isNew = !app.history.find(h => h.performedBy === currentUser.id);
        
        if (app.status === 'Error' || app.isRejected || (app.issueType && app.issueType !== 'None')) {
          reminders.push({
            id: `rem-err-${app.id}`,
            recipientId: currentUser.id,
            title: 'Khắc phục sai sót',
            message: `Lô ${app.unitCode} (${app.projectName}) đang có lỗi hoặc bị trả về. Cần xử lý ngay.`,
            time: 'Yêu cầu ưu tiên',
            type: 'Urgent',
            isRead: false,
            appId: app.id
          });
        } else if (isNew) {
          reminders.push({
            id: `rem-new-${app.id}`,
            recipientId: currentUser.id,
            title: 'Tiếp nhận hồ sơ mới',
            message: `Bạn có hồ sơ ${app.unitCode} (${app.projectName}) mới chuyển đến giai đoạn ${step.label}.`,
            time: 'Chờ tiếp nhận',
            type: 'Warning',
            isRead: false,
            appId: app.id
          });
        }
      }

      // 2. SLA Check
      const overdueInfo = getOverdueInfo(app, stepConfig, slaConfig);
      if (overdueInfo.isOverdue && app.status !== 'Completed') {
        reminders.push({
          id: `rem-sla-${app.id}`,
          recipientId: currentUser.id,
          title: 'Trễ hạn SLA',
          message: `Hồ sơ ${app.unitCode} (${app.projectName}): ${overdueInfo.label} (${overdueInfo.daysLate} ngày). Cần xử lý gấp.`,
          time: 'Quá hạn',
          type: 'Urgent',
          isRead: false,
          appId: app.id
        });
      }
    });

    setTaskReminders(reminders);
  }, [dashboardApps, currentUser, stepConfig, slaConfig]);

  useEffect(() => {
    if (activeTab === 'settings') {
      fetchStorageUsage();
    }
  }, [activeTab]);
  const userRole = useMemo(() => currentUser?.dept || 'PTT', [currentUser]);

  const canEdit = (user: UserProfile | null): boolean => {
    if (!user) return false;
    if (user.dept === 'ADMIN') return true;
    if (['KT', 'PTT', 'PTDA'].includes(user.dept)) return true;
    return user.permission === 'EDIT' || user.permission === 'FULL';
  };

  const userCanEdit = useMemo(() => canEdit(currentUser), [currentUser]);
  
  const isManagementEdit = useMemo(() => {
    return userRole === 'ADMIN' || (['MANAGER', 'DIRECTOR'].includes(userRole) && userCanEdit);
  }, [userRole, userCanEdit]);

  const isManagement = useMemo(() => {
    return ['ADMIN', 'MANAGER', 'DIRECTOR'].includes(userRole);
  }, [userRole]);
  const [isEditing, setIsEditing] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    name: '',
    dept: 'PTT' as Dept,
    email: '',
    status: 'Active' as 'Active' | 'Inactive',
    permission: 'VIEW' as UserPermission,
    assignedProjectIds: [] as string[]
  });
  const [editApp, setEditApp] = useState<Application | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  useEffect(() => {
    if (userRole) {
      if (userRole === 'PTT') {
        setExpandedSections(['PTT_SECTION', 'OTHER_SECTION']);
      } else if (userRole === 'KT') {
        setExpandedSections(['KT_SECTION', 'OTHER_SECTION']);
      } else if (userRole === 'PTDA') {
        setExpandedSections(['PTDA_SECTION', 'OTHER_SECTION']);
      } else {
        setExpandedSections(['PTT_SECTION', 'KT_SECTION', 'PTDA_SECTION', 'OTHER_SECTION']);
      }
    }
  }, [selectedApp, userRole]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };
  
  const [isHandoverTicketOpen, setIsHandoverTicketOpen] = useState(false);
  
  const handlePrintHandoverTicket = () => {
    setIsHandoverTicketOpen(true);
  };
  
  const { toast, showToast } = useToast();
  const [isSavingApp, setIsSavingApp] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const {
    selectedAppIds,
    setSelectedAppIds,
    isBulkNoteOpen,
    setIsBulkNoteOpen,
    bulkNoteText,
    setBulkNoteText,
    isBulkIssueOpen,
    setIsBulkIssueOpen,
    bulkIssueNote,
    setBulkIssueNote,
    bulkIssueType,
    setBulkIssueType,
    bulkIssueSeverity,
    setBulkIssueSeverity,
    handleBulkUpdateNote,
    handleBulkReportIssue,
  } = useBulkActions({
    applications,
    setApplications,
    bulkSyncRecordsToSupabase,
    updateAppIssue,
    showToast,
    setIsSavingApp,
  });
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const tableRowRefs = useRef<(HTMLTableRowElement | null)[]>([]);

  useEffect(() => {
    if (activeTab === 'applications' && selectedIndex !== null && tableRowRefs.current[selectedIndex]) {
      tableRowRefs.current[selectedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [selectedIndex, activeTab]);

  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [projectSearch, setProjectSearch] = useState('');
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere if an input/textarea/select is focused
      const target = e.target as HTMLElement;
      const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
      
      // Global Escape handler for modals
      if (e.key === 'Escape') {
        if (selectedApp) {
          setSelectedApp(null);
          setIsEditing(false);
          return;
        }
        if (isProjectModalOpen) {
          setIsProjectModalOpen(false);
          return;
        }
      }

      if (e.key === 'F2') {
        if (selectedApp && !isEditing && userCanEdit) {
          e.preventDefault();
          setIsEditing(true);
          setEditApp(selectedApp);
          return;
        }
      }

      // Table keyboard navigation for 'applications' tab
      if (activeTab === 'applications' && !isInputFocused && !selectedApp) {
        const visibleApps = filteredApps.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
        
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => {
            if (e.ctrlKey || e.metaKey) return visibleApps.length - 1;
            const next = (prev === null) ? 0 : Math.min(prev + 1, visibleApps.length - 1);
            if (e.shiftKey && lastSelectedIndex !== null) {
              const start = Math.min(lastSelectedIndex, next);
              const end = Math.max(lastSelectedIndex, next);
              const newSelection = new Set(selectedRows);
              for (let i = start; i <= end; i++) {
                newSelection.add(visibleApps[i].id);
              }
              setSelectedRows(newSelection);
              setSelectedAppIds(Array.from(newSelection));
            }
            return next;
          });
          if (!e.shiftKey) {
            setLastSelectedIndex(prev => {
              if (e.ctrlKey || e.metaKey) return visibleApps.length - 1;
              return (selectedIndex === null) ? 0 : Math.min(selectedIndex + 1, visibleApps.length - 1);
            });
          }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => {
            if (e.ctrlKey || e.metaKey) return 0;
            const next = (prev === null) ? 0 : Math.max(prev - 1, 0);
            if (e.shiftKey && lastSelectedIndex !== null) {
              const start = Math.min(lastSelectedIndex, next);
              const end = Math.max(lastSelectedIndex, next);
              const newSelection = new Set(selectedRows);
              for (let i = start; i <= end; i++) {
                newSelection.add(visibleApps[i].id);
              }
              setSelectedRows(newSelection);
              setSelectedAppIds(Array.from(newSelection));
            }
            return next;
          });
          if (!e.shiftKey) {
            setLastSelectedIndex(prev => {
              if (e.ctrlKey || e.metaKey) return 0;
              return (selectedIndex === null) ? 0 : Math.max((selectedIndex || 0) - 1, 0);
            });
          }
        } else if (e.key === 'ArrowRight' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          if ((currentPage + 1) * pageSize < totalCount) {
             setCurrentPage(p => p + 1);
             setSelectedIndex(0);
          }
        } else if (e.key === 'ArrowLeft' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          if (currentPage > 0) {
             setCurrentPage(p => p - 1);
             setSelectedIndex(0);
          }
        } else if (e.key === 'Enter' && selectedIndex !== null) {
          e.preventDefault();
          setSelectedApp(visibleApps[selectedIndex]);
        } else if (e.key === ' ' && selectedIndex !== null) {
          e.preventDefault();
          const appId = visibleApps[selectedIndex].id;
          setSelectedRows(prev => {
            const next = new Set(prev);
            if (next.has(appId)) next.delete(appId);
            else next.add(appId);
            setSelectedAppIds(Array.from(next));
            return next;
          });
        }

        // Ctrl + A: Select all filtered rows
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
          e.preventDefault();
          const allIds = filteredApps.map(a => a.id);
          setSelectedRows(new Set(allIds));
          setSelectedAppIds(allIds);
          showToast(`Đã chọn tất cả ${filteredApps.length} hồ sơ`, 'success');
        }

        // Ctrl + C: Copy selected rows to clipboard for Excel
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
          if (selectedRows.size > 0) {
            e.preventDefault();
            const rowsToCopy = filteredApps.filter(app => selectedRows.has(app.id));
            
            const header = ['Dự án', 'Mã căn', 'Tên khách hàng', 'Trạng thái', 'Tiến độ'].join('\t');
            const dataRows = rowsToCopy.map(r => [
              r.projectName || '',
              r.unitCode || '',
              r.customerName || '',
              r.status || '',
              r.currentStep || ''
            ].join('\t'));
            
            const text = [header, ...dataRows].join('\n');
            navigator.clipboard.writeText(text).then(() => {
              showToast(`Đã copy ${rowsToCopy.length} dòng`, 'success');
            });
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedApp, isEditing, currentUser, activeTab, filteredApps, selectedIndex, selectedRows, lastSelectedIndex, currentPage, pageSize, isProjectModalOpen]);

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [expandedSidebarRegions, setExpandedSidebarRegions] = useState<Record<string, boolean>>({});

  const [projectRegionFilter, setProjectRegionFilter] = useState<string>('ALL');
  const [isFieldMode, setIsFieldMode] = useState(false);
  
  // Toggle region in sidebar
  const toggleSidebarRegion = (region: string) => {
    setExpandedSidebarRegions(prev => ({ ...prev, [region]: !prev[region] }));
  };
  
  const handleSaveConfig = async (key: string, value: any) => {
    console.log(`Saving ${key}:`, value);
    setIsSavingApp(true);
    try {
      const { error } = await supabase
        .from('system_configs')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      
      if (error) throw error;
      showToast(`Đã lưu cấu hình ${key} lên Supabase thành công!`, 'success');
    } catch (error) {
      console.error(`Supabase config save error (${key}):`, error);
      showToast(`Lỗi khi lưu cấu hình ${key} lên Supabase.`, 'error');
    } finally {
      setIsSavingApp(false);
    }
  };

  const regions = useMemo(() => {
    return ["VPĐK Phường", "VPĐK TP Đà Nẵng", "VPĐK Quận Liên Chiểu"];
  }, []);
  const [detailTab, setDetailTab] = useState<'Issues' | 'History' | 'Documents'>('History');
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [quickEditData, setQuickEditData] = useState<Partial<Application>>({});

  const handleQuickSave = async (id: string) => {
    const editData = quickEditData;
    if (!id || Object.keys(editData).length === 0) {
      setQuickEditId(null);
      setQuickEditData({});
      return;
    }

    const app = applications.find(a => a.id === id);
    if (!app) return;

    const auditEntry = createAuditEntry('Cập nhật nhanh', false, 1, app.unitCode);
    let updatedApp = { ...app, ...editData, auditTrail: [auditEntry, ...(app.auditTrail || [])] };

    // Auto-promote to Hoan_Tat if customerHandoverDate is updated
    if (editData.customerHandoverDate) {
      updatedApp.currentStep = 'Hoan_Tat';
      updatedApp.status = 'Completed';
      const historyItem: ApplicationHistory = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleString('vi-VN'),
        user: userRole,
        action: 'Tự động hoàn tất (Cập nhật nhanh ngày BG khách)',
      };
      updatedApp.history = [historyItem, ...(app.history || [])];
    }

    setIsSavingApp(true);
    try {
      const finalApp = await syncRecordToSupabase(updatedApp);
      
      setApplications(prev => prev.map(a => a.id === id ? finalApp : a));
      setDashboardApps(prev => prev.map(a => a.id === id ? finalApp : a));
      if (selectedApp?.id === id) setSelectedApp(finalApp);

      showToast('Cập nhật nhanh và đồng bộ Supabase thành công!', 'success');
      setQuickEditId(null);
      setQuickEditData({});
    } catch (error) {
      console.error('Quick save error:', error);
     showToast('Lỗi khi cập nhật nhanh lên Supabase.', 'error');
    } finally {
      setIsSavingApp(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('procedural_handover_template', JSON.stringify(handoverTemplate));
  }, [handoverTemplate]);


  const [isReportIssueFormOpen, setIsReportIssueFormOpen] = useState(false);
  const [reportIssueType, setReportIssueType] = useState<IssueType>('Sai sót Khác');
  const [reportIssueSeverity, setReportIssueSeverity] = useState<IssueSeverity>('Trung bình');
  const [reportIssueNote, setReportIssueNote] = useState('');

  const handleSingleOrBulkReportIssue = async (apps: Application[]) => {
    if (apps.length === 0 || !reportIssueNote.trim()) return;
    
    setIsSavingApp(true);
    try {
        const updatedApps = apps.map(app => {
            const logEntry: ApplicationStepHistory = {
                id: Math.random().toString(36).substr(2, 9),
                stepName: app.currentStep,
                dept: (userRole === 'ADMIN' ? 'ADMIN' : (userRole === 'MANAGER' ? 'KT' : (userRole as Dept))),
                receivedDate: new Date().toISOString(),
                note: `[BÁO SAI SÓT - ${reportIssueSeverity}] ${reportIssueNote}`,
                performedByName: 'Admin', 
            };
            return {
                ...app,
                status: 'Error' as const,
                issueType: reportIssueType,
                issueSeverity: reportIssueSeverity,
                issueNotes: reportIssueNote,
                history: [logEntry, ...(app.history || [])]
            };
        });

        const syncedApps = await Promise.all(updatedApps.map(app => syncRecordToSupabase(app)));
        
        setApplications(prev => prev.map(a => {
            const updated = syncedApps.find(sa => sa.id === a.id);
            return updated ? updated : a;
        }));

        setDashboardApps(prev => prev.map(a => {
            const updated = syncedApps.find(sa => sa.id === a.id);
            return updated ? updated : a;
        }));
        
        setIsReportIssueFormOpen(false);
        setReportIssueNote('');
        showToast(`Đã báo cáo sai sót cho ${apps.length} hồ sơ thành công.`, 'success');
    } catch(e) {
        console.error(e);
        showToast('Lỗi khi ghi nhận sai sót hàng loạt.', 'error');
    } finally {
        setIsSavingApp(false);
    }
  };

  const [isBulkTransitionModalOpen, setIsBulkTransitionModalOpen] = useState(false);

  const [bulkTransitionTarget, setBulkTransitionTarget] = useState<StepName | null>(null);
  const [bulkTransitionField, setBulkTransitionField] = useState<{key: keyof Application, label: string, isRequired?: boolean} | null>(null);
  const [bulkTransitionValue, setBulkTransitionValue] = useState(new Date().toISOString().split('T')[0]);
  const [bulkTransitionLocation, setBulkTransitionLocation] = useState<'PHUONG' | 'TP_DANANG'>('PHUONG');
  const [bulkTransitionRefCode, setBulkTransitionRefCode] = useState('');

  // SPREADSHEET MODE STATES
  const [isSpreadsheetMode, setIsSpreadsheetMode] = useState(false);
  const isValidDate = (d: string | null | undefined) => d && d !== '---' && d.trim() !== '';
  const [spreadsheetChanges, setSpreadsheetChanges] = useState<Record<string, Partial<Application>>>({});
  const [spreadsheetErrors, setSpreadsheetErrors] = useState<Record<string, Record<string, string>>>({});
  const [activeCell, setActiveCell] = useState<{ id: string, field: string } | null>(null);

  const EDITABLE_DATE_FIELDS = [
    { key: 'receivedDate', label: 'Ngày nhận HS' },
    { key: 'submissionDate', label: 'Ngày nộp VPĐK' },
    { key: 'taxNotificationDate', label: 'Ngày TB Thuế' },
    { key: 'taxReceiptDate', label: 'Ngày nộp tiền' },
    { key: 'gcnReceivedDate', label: 'Ngày nhận GCN' },
    { key: 'customerHandoverDate', label: 'Ngày BG Khách' }
  ];

  const validateDateSequence = (app: Partial<Application>) => {
    const dates = [
      { key: 'receivedDate', label: 'Ngày nhận HS' },
      { key: 'submissionDate', label: 'Ngày nộp VPĐK' },
      { key: 'taxNotificationDate', label: 'Ngày TB Thuế' },
      { key: 'taxReceiptDate', label: 'Ngày nộp tiền/NVTC' },
      { key: 'gcnReceivedDate', label: 'Ngày nhận GCN' },
      { key: 'customerHandoverDate', label: 'Ngày BG Khách' }
    ];

    // Filter out fields that are present and have valid date strings
    const activeDates = dates
      .map(d => ({ ...d, value: app[d.key as keyof Application] }))
      .filter(d => d.value && d.value !== '---' && typeof d.value === 'string');

    for (let i = 0; i < activeDates.length - 1; i++) {
      const d1 = activeDates[i];
      const d2 = activeDates[i+1];
      
      const date1 = new Date(d1.value as string);
      const date2 = new Date(d2.value as string);
      
      if (!isNaN(date1.getTime()) && !isNaN(date2.getTime())) {
        // Normalize to midnight for pure date comparison
        date1.setHours(0, 0, 0, 0);
        date2.setHours(0, 0, 0, 0);
        
        if (date2 < date1) {
          return `${d2.label} (${formatDate(d2.value as string)}) không được nhỏ hơn ${d1.label} (${formatDate(d1.value as string)})`;
        }
      }
    }
    return null;
  };

  const handleSpreadsheetChange = (id: string, field: string, value: string) => {
    setSpreadsheetChanges(prev => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [field]: value }
    }));

    // Simple validation: check if it matches DD/MM/YYYY or YYYY-MM-DD or is empty
    const isValid = !value || /^\d{2}\/\d{2}\/\d{4}$/.test(value) || /^\d{4}-\d{2}-\d{2}$/.test(value);
    
    setSpreadsheetErrors(prev => {
      const next = { ...prev };
      if (!isValid) {
        if (!next[id]) next[id] = {};
        next[id][field] = 'Định dạng ngày không hợp lệ';
      } else {
        if (next[id]) {
          delete next[id][field];
          if (Object.keys(next[id]).length === 0) delete next[id];
        }
      }
      return next;
    });
  };

  const handleSpreadsheetPaste = (e: React.ClipboardEvent, startId: string, startField: string) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    const rows = pasteData.split(/\r?\n/).filter(line => line.trim() !== '');
    console.log(`Pasting ${rows.length} rows...`);
    
    const newChanges = { ...spreadsheetChanges };
    const newErrors = { ...spreadsheetErrors };
    
    const startIdx = filteredApps.findIndex(a => a.id === startId);
    if (startIdx === -1) return;
    
    const startFieldIdx = EDITABLE_DATE_FIELDS.findIndex(f => f.key === startField);

    rows.forEach((row, ri) => {
      const columns = row.split('\t');
      let targetApp: Application | undefined = filteredApps[startIdx + ri];
      let rowData = columns;
      let fieldOffset = startFieldIdx;

      // Logic "Mapping ID": If first column matches a unitCode in system, use that row
      const firstCol = columns[0]?.trim().toLowerCase();
      if (!firstCol) return;

      const matchedApp = applications.find(a => 
        (a.unitCode || '').trim().toLowerCase() === firstCol || 
        a.id.toLowerCase() === firstCol
      );
      
      if (matchedApp) {
        targetApp = matchedApp;
        rowData = columns.slice(1); // Skip the ID column for data filling
        fieldOffset = 0; // Fill starting from first editable field
        console.log(`Matched record ${targetApp.unitCode} using ID/Code "${firstCol}"`);
      } else {
        // Skip rows that don't match or warn
        console.warn(`Row ${ri + 1}: Could not find match for "${firstCol}"`);
        return;
      }

      rowData.forEach((val, ci) => {
        const fieldObj = EDITABLE_DATE_FIELDS[fieldOffset + ci];
        if (!fieldObj) return;
        
        const field = fieldObj.key;
        const trimmedVal = val.trim();
        
        if (!newChanges[targetApp.id]) newChanges[targetApp.id] = {};
        newChanges[targetApp.id][field as keyof Application] = trimmedVal as any;
        
        // Inline Validation: Allow /, -, .
        const isValid = !trimmedVal || trimmedVal === '---' || 
                        /^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})$/.test(trimmedVal) || 
                        /^\d{4}-\d{2}-\d{2}$/.test(trimmedVal);
        if (!isValid) {
          if (!newErrors[targetApp.id]) newErrors[targetApp.id] = {};
          newErrors[targetApp.id][field] = 'Ngày không đúng định dạng (dd/mm/yyyy)';
        } else {
          if (newErrors[targetApp.id]) {
            delete newErrors[targetApp.id][field];
            if (Object.keys(newErrors[targetApp.id]).length === 0) delete newErrors[targetApp.id];
          }
        }
      });
    });
    
    setSpreadsheetChanges(newChanges);
    setSpreadsheetErrors(newErrors);
  };

  const confirmSpreadsheetUpdates = async () => {
    const errorEntries = Object.entries(spreadsheetErrors);
    if (errorEntries.length > 0) {
      const firstErrorId = errorEntries[0][0];
      const appWithError = applications.find(a => a.id === firstErrorId);
      const fields = Object.keys(errorEntries[0][1]).join(', ');
      showToast(`Lỗi tại căn ${appWithError?.unitCode || firstErrorId}: Sai định dạng ở cột [${fields}]`, 'error');
      return;
    }

    const changedCount = Object.keys(spreadsheetChanges).length;
    if (changedCount === 0) {
      showToast('Không có dữ liệu thay đổi để cập nhật', 'warning');
      return;
    }

    setIsSavingApp(true);
    try {
      console.log('Building spreadsheet update payloads for:', spreadsheetChanges);

      const updatePayloads: any[] = [];
      const nowStr = new Date().toISOString().split('T')[0];
      const updatedAppsLocal = [...applications];
      
      const results = {
        success: 0,
        skipped: 0,
        error: 0,
        errors: [] as string[]
      };

      for (const [id, changes] of Object.entries(spreadsheetChanges)) {
        const originalIndex = updatedAppsLocal.findIndex(a => a.id === id);
        if (originalIndex === -1) {
          results.error++;
          results.errors.push(`ID "${id}" không tồn tại.`);
          continue;
        }

        const original = updatedAppsLocal[originalIndex];
        const processedChanges: any = {};
        let hasActualChange = false;
        
        Object.entries(changes).forEach(([field, val]) => {
          if (val === undefined) return;
          
          const newDate = val === '' ? null : parseExcelDate(val as string);
          const oldDateValue = original[field as keyof Application];
          
          const normNew = (newDate && typeof newDate === 'string') ? newDate.split('T')[0] : (newDate === '' ? null : newDate);
          const normOld = (oldDateValue && typeof oldDateValue === 'string') ? oldDateValue.split('T')[0] : (oldDateValue === '' ? null : oldDateValue);

          if (normNew !== normOld) {
            processedChanges[field] = newDate;
            hasActualChange = true;
          }
        });

        if (!hasActualChange) {
          results.skipped++;
          continue;
        }

        const mergedApp = { ...original, ...processedChanges };
        const dateError = validateDateSequence(mergedApp);
        if (dateError) {
          results.error++;
          results.errors.push(`Căn ${original.unitCode || id}: ${dateError}`);
          continue;
        }

        let updated = { ...mergedApp, updated_at: nowStr };

        // Ensure full initialization for new imported records (temporary imp ID)
        if (typeof updated.id === 'string' && (updated.id.includes('-imp-') || !applications.some(a => a.id === updated.id))) {
          const parentProject = projects.find(p => p.name === updated.projectName);
          const inheritedWorkflowType = parentProject?.workflowType || 'Quy_trinh_1';
          const initialStep = inheritedWorkflowType === 'Quy_trinh_2' ? 'S1_ChuanBi' : 'GD1_ChuanBi';
          const initialStatus = (stepConfig as any)[initialStep]?.status || 'Processing';
          
          updated = {
            ...updated,
            workflowType: updated.workflowType || inheritedWorkflowType,
            currentStep: updated.currentStep || initialStep,
            status: updated.status || initialStatus,
            receivedDate: updated.receivedDate || nowStr,
            taxPaymentStatus: updated.taxPaymentStatus || 'Unpaid',
            submissionLocation: updated.submissionLocation || 'PHUONG',
            isSelfService: typeof updated.isSelfService === 'boolean' ? updated.isSelfService : false,
            propertyType: updated.propertyType || 'Dat_Nen',
            loanStatus: updated.loanStatus || 'Khong_Vay',
            checklist: updated.checklist || {},
            history: updated.history && updated.history.length > 0 ? updated.history : [
              {
                id: generateUUID(),
                stepName: (stepConfig[initialStep] || INITIAL_STEP_CONFIG[initialStep]).label,
                dept: 'PTT',
                receivedDate: nowStr,
                note: 'Khởi tạo hồ sơ từ Import'
              }
            ],
            scannedFiles: updated.scannedFiles || [],
            auditTrail: updated.auditTrail || []
          };
        }

        updatedAppsLocal[originalIndex] = updated;
        updatePayloads.push(mapToSnakeCase(updated));
        results.success++;
      }

      if (results.error > 0) {
        showToast(`Có ${results.error} lỗi. Vui lòng kiểm tra lại: ${results.errors[0]}`, 'error');
        // If there are errors, we might want to prevent partial updates or proceed with success cases?
        // User asked for log, but also mentioned "không cho lưu" if vi phạm.
        // Let's stop if there are errors.
        setIsSavingApp(false);
        return;
      }

      if (updatePayloads.length > 0) {
        const finalUpdatedApps = await bulkSyncRecordsToSupabase(updatePayloads.map(p => mapFromSnakeCase(p)), updatedAppsLocal);
        setApplications(finalUpdatedApps);
        let msg = `Cập nhật thành công: ${results.success} căn.`;
        if (results.skipped > 0) msg += ` (Bỏ qua ${results.skipped} căn không đổi).`;
        showToast(msg, 'success');
        
        setIsSpreadsheetMode(false);
        setSpreadsheetChanges({});
        setSpreadsheetErrors({});
      } else {
        if (results.skipped > 0) {
          showToast(`Hoàn tất: ${results.skipped} hồ sơ đã trùng khớp dữ liệu hệ thống.`, 'success');
        } else {
          showToast('Không tìm thấy dữ liệu hợp lệ để cập nhật', 'warning');
        }
      }
    } catch (error: any) {
      console.error('Spreadsheet bulk update error:', error);
     showToast(`Lỗi khi cập nhật hàng loạt: ${error.message || 'Lỗi không xác định'}`, 'error');
    } finally {
      setIsSavingApp(false);
    }
  };

  const [isShowFilters, setIsShowFilters] = useState(false);
  const [isQuickFilterOpen, setIsQuickFilterOpen] = useState(false);
  const quickFilterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (quickFilterRef.current && !quickFilterRef.current.contains(event.target as Node)) {
        setIsQuickFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newApp, setNewApp] = useState({
    unitCode: '',
    customerName: '',
    contractSignerType: '',
    projectName: '',
    propertyType: 'Dat_Nen' as PropertyType,
    loanStatus: 'Khong_Vay' as 'Co_Vay' | 'Khong_Vay',
    submissionLocation: 'PHUONG' as 'PHUONG' | 'TP_DANANG',
    currentStep: 'S1_ChuanBi' as StepName,
    isSelfService: false,
    commitmentDate: ''
  });

  // Ensure newApp.projectName is set to a valid project the user has access to
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const selectedProject = useMemo(() => 
    projects.find(p => p.id === selectedProjectId), 
  [projects, selectedProjectId]);

  const visibleProjects = useMemo(() => {
    let baseProjects = projects;
    if (userRole !== 'ADMIN' && userRole !== 'DIRECTOR') {
      baseProjects = projects.filter(p => currentUser?.assignedProjectIds?.includes(p.id));
    }
    
    return [...baseProjects].sort((a, b) => {
      const idxA = REGION_ORDER.indexOf(a.region || '');
      const idxB = REGION_ORDER.indexOf(b.region || '');
      if (idxA === -1 && idxB === -1) return (a.region || '').localeCompare(b.region || '');
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      if (idxA !== idxB) return idxA - idxB;
      return a.name.localeCompare(b.name);
    });
  }, [projects, currentUser, userRole]);

  // Ensure newApp.projectName is set to a valid project the user has access to
  useEffect(() => {
    if (isCreateModalOpen && !newApp.projectName && visibleProjects.length > 0) {
      setNewApp(prev => ({ ...prev, projectName: visibleProjects[0].name }));
    }
  }, [isCreateModalOpen, visibleProjects, newApp.projectName]);

  const validatePhone = (phone: string) => {
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/g;
    return phoneRegex.test(phone);
  };

  const handleDownloadTemplate = () => {
    let headers: string[] = [];
    let data: any[][] = [];
    const sourceApps = selectedProjectId ? dashboardApps : applications;

    if (isManagementEdit) {
      headers = [
        "Dự án", "Mã lô/căn", "Khách hàng", "Số điện thoại", "Vay ngân hàng (Có/Không)", "Loại tài sản (Căn hộ/Đất nền)", 
        "Hạn GCN cam kết", "Ngày nhận hồ sơ", "Ngày ký HĐCN", "Tự làm sổ (Có/Không)",
        "Nơi nộp", "Mã VPĐK", "Ngày nộp hồ sơ", "Ngày TB Thuế", "Ngày nhận TB Thuế", "Ngày đóng thuế", 
        "Ngày GCN đã ký", "Ngày GCN đã nhận", "Ngày BG KT", "Ngày BG GCN Khách"
      ];
      data = sourceApps.map(app => [
        app.projectName,
        app.unitCode,
        app.customerName,
        app.phoneNumber || '',
        app.loanStatus === 'Co_Vay' ? 'Có' : 'Không',
        app.propertyType === 'Can_Ho' ? 'Căn hộ' : 'Đất nền',
        formatExcelDate(app.bankCommitmentDeadline),
        formatExcelDate(app.receivedDate),
        formatExcelDate(app.contractSigningDate),
        app.isSelfService ? 'Có' : 'Không',
        app.submissionLocation || '',
        app.vpdkCode || '',
        formatExcelDate(app.submissionDate),
        formatExcelDate(app.taxNotificationDate),
        formatExcelDate(app.taxNotificationReceivedDate),
        formatExcelDate(app.taxReceiptDate),
        formatExcelDate(app.gcnSignedDate),
        formatExcelDate(app.gcnReceivedDate),
        formatExcelDate(app.accountingHandoverDate),
        formatExcelDate(app.customerHandoverDate)
      ]);
    } else if (userRole === 'PTT') {
      headers = [
        "Dự án", "Mã lô/căn", "Tên khách hàng", "Đối tượng ký HĐCN", "Số điện thoại", "Vay ngân hàng (Có/Không)", "Loại tài sản", 
        "Ngày nhận hồ sơ", "Ngày ký HĐCN", "Hạn cam kết Ngân hàng", "Tự làm sổ (Có/Không)", "Ngày BG GCN Khách"
      ];
      data = sourceApps.map(app => {
        return [
          app.projectName,
          app.unitCode,
          app.customerName,
          app.contractSignerType || '',
          app.phoneNumber || '',
          app.loanStatus === 'Co_Vay' ? 'Có' : 'Không',
          app.propertyType === 'Can_Ho' ? 'Căn hộ' : 'Đất nền',
          formatExcelDate(app.receivedDate),
          formatExcelDate(app.contractSigningDate),
          formatExcelDate(app.bankCommitmentDeadline),
          app.isSelfService ? 'Có' : 'Không',
          formatExcelDate(app.customerHandoverDate)
        ];
      });
    } else if (userRole === 'KT') {
      headers = [
        "Dự án", "Mã lô/căn", "Khách hàng", "Nơi nộp (Phường/TP)", "Mã HS/Số phiếu hẹn VPĐK", "Ngày nộp VPĐK", 
        "Ngày nhận TB Thuế", "Ngày đóng thuế", "Ngày nhận GCN", "Ngày BG P.TDA", "Ghi chú vướng mắc"
      ];
      data = sourceApps.map(app => [
        app.projectName,
        app.unitCode,
        app.customerName,
        app.submissionLocation === 'PHUONG' ? 'Phường/Xã' : 'TP Đà Nẵng',
        app.vpdkCode || '',
        formatExcelDate(app.submissionDate),
        formatExcelDate(app.taxNotificationReceivedDate),
        formatExcelDate(app.taxReceiptDate),
        formatExcelDate(app.gcnReceivedDate),
        formatExcelDate(app.ptdaHandoverDate),
        app.issueNotes ? `[${app.issueType || 'Khác'}] ${app.issueNotes}` : ''
      ]);
    } else if (userRole === 'PTDA') {
      headers = [
        "Dự án", "Mã lô/căn", "Ngày TB Thuế", "Ngày trình ký GCN", "Ngày nhận GCN thực tế", "Ghi chú vướng mắc"
      ];
      data = sourceApps.map(app => [
        app.projectName,
        app.unitCode,
        formatExcelDate(app.taxNoticeProvisionDate),
        formatExcelDate(app.gcnSignedDate),
        formatExcelDate(app.gcnReceivedDate),
        app.issueNotes ? `[${app.issueType || 'Khác'}] ${app.issueNotes}` : ''
      ]);
    } else {
      // Default / Admin: Full Template for complete control
      headers = [
        "Dự án", "Mã lô/căn", "Khách hàng", "Số điện thoại", "Vay ngân hàng", "Loại tài sản", 
        "Hạn cam kết vay", "Ngày nhận hồ sơ", "Ngày ký HĐCN", "Tự làm sổ",
        "Nơi nộp", "Mã HS VPĐK", "Ngày nộp VPĐK", "Ngày TB Thuế", "Ngày nhận TB Thuế", 
        "Ngày nhận NVTC", "Ngày trình ký GCN", "Ngày nhận GCN thực tế", "Ngày BG Pkt", "Ngày BG Khách"
      ];
      data = sourceApps.map(app => [
        app.projectName,
        app.unitCode,
        app.customerName,
        app.phoneNumber || '',
        app.loanStatus === 'Co_Vay' ? 'Có' : 'Không',
        app.propertyType === 'Can_Ho' ? 'Căn hộ' : 'Đất nền',
        formatExcelDate(app.bankCommitmentDeadline),
        formatExcelDate(app.receivedDate),
        formatExcelDate(app.contractSigningDate),
        app.isSelfService ? 'Có' : 'Không',
        app.submissionLocation === 'PHUONG' ? 'Phường/Xã' : app.submissionLocation === 'TINH' ? 'Tỉnh/Thành phố' : '',
        app.vpdkCode || '',
        formatExcelDate(app.submissionDate),
        formatExcelDate(app.taxNotificationDate),
        formatExcelDate(app.taxNotificationReceivedDate),
        formatExcelDate(app.taxReceiptDate),
        formatExcelDate(app.gcnSignedDate),
        formatExcelDate(app.gcnReceivedDate),
        formatExcelDate(app.accountingHandoverDate),
        formatExcelDate(app.customerHandoverDate)
      ]);
    }

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "HoSo");
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(blob, `Template_GCN_${userRole}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const inferStepFromDates = (app: Application): { currentStep: StepName, status: UnitStatus } => {
    const isQT2 = app.workflowType === 'Quy_trinh_2';
    
    // Hoàn tất
    if (app.customerHandoverDate) 
      return { currentStep: 'Hoan_Tat', status: 'Completed' };
    
    if (isQT2) {
      if (app.accountingHandoverDate) return { currentStep: 'S7_2_Ban_Giao_Khach', status: 'Processing' };
      if (app.gcnReceivedDate)        return { currentStep: 'S7_1_PTT_Tiep_Nhan', status: 'Processing' };
      if (app.ptdaHandoverDate)       return { currentStep: 'S7_PTDA_Ban_Giao', status: 'Processing' };
      if (app.gcnSignedDate)          return { currentStep: 'S6_Nhan_So_GCN', status: 'Processing' };
      if (app.taxReceiptDate)         return { currentStep: 'S5_1_PTDA_TiepNhan', status: 'Processing' };
      if (app.taxNotificationDate)    return { currentStep: 'S5_Tai_Chinh_Khach_Hang', status: 'Processing' };
      
      if (app.submissionDate && !app.taxNotificationDate) {
        const subDate = new Date(app.submissionDate);
        const daysDiff = (new Date().getTime() - subDate.getTime()) / (1000 * 60 * 60 * 24);
        const sla = slaConfig?.['Nộp VPĐK'] ?? 5;
        return daysDiff > sla
          ? { currentStep: 'S4_Cho_Thong_Bao_Thue', status: 'TaxPending' }
          : { currentStep: 'S4_Cho_Thong_Bao_Thue', status: 'Submitted' };
      }
      
      if (app.vpdkCode)               return { currentStep: 'S3_Nop_VPDK', status: 'Processing' };
      if (app.contractSigningDate)    return { currentStep: 'S2_KT_Tiep_Nhan', status: 'Processing' };
      return { currentStep: 'S1_ChuanBi', status: 'Processing' };
    } else {
      if (app.accountingHandoverDate) return { currentStep: 'GD6_Cho_BG_Khach', status: 'Processing' };
      if (app.gcnReceivedDate)        return { currentStep: 'GD5_Cho_PTT_TiepNhan_BG', status: 'Processing' };
      if (app.gcnSignedDate)          return { currentStep: 'GD5_Cho_GCN', status: 'Processing' };
      if (app.taxReceiptDate)         return { currentStep: 'GD4_Cho_KT_TiepNhan_LaySo', status: 'Processing' };
      if (app.taxNotificationDate)    return { currentStep: 'GD4_Cho_Nop_NVTC', status: 'Processing' };

      if (app.submissionDate && !app.taxNotificationDate) {
        const subDate = new Date(app.submissionDate);
        const daysDiff = (new Date().getTime() - subDate.getTime()) / (1000 * 60 * 60 * 24);
        const sla = slaConfig?.['Nộp VPĐK'] ?? 5;
        return daysDiff > sla
          ? { currentStep: 'GD3_Cho_TBThue', status: 'TaxPending' }
          : { currentStep: 'GD3_Cho_TBThue', status: 'Submitted' };
      }

      if (app.vpdkCode)               return { currentStep: 'GD2_Cho_Nop_VPDK', status: 'Processing' };
      if (app.contractSigningDate)    return { currentStep: 'GD1_Cho_KT_TiepNhan', status: 'Processing' };
      return { currentStep: 'GD1_ChuanBi', status: 'Processing' };
    }
  };

  const handleImportTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        let updatedCount = 0;
        let createdCount = 0;

        const newApplications = [...applications];
        const appsToUpdate: Application[] = [];
        const appsToCreate: Application[] = [];

        excelData.slice(1).forEach((row) => {
          if (!row || row.length < 2) return;
          const unitCode = row[1];
          if (!unitCode) return;

          if (userRole === 'ADMIN' || userRole === 'DIRECTOR' || userRole === 'MANAGER') {
            const existingIndex = newApplications.findIndex(a => a.unitCode === unitCode);
            
            const app = existingIndex > -1 ? { ...newApplications[existingIndex] } : {
               unitCode: unitCode,
               projectName: row[0] || (projects.length > 0 ? projects[0].name : ''),
               customerName: row[2] || '---',
               status: 'Processing',
               currentStep: 'GD1_ChuanBi',
               taxPaymentStatus: 'Unpaid',
               submissionLocation: 'PHUONG',
               propertyType: 'Dat_Nen',
               loanStatus: 'Khong_Vay',
               isSelfService: false,
               history: [{ id: generateUUID(), stepName: 'Quản trị viên Import', dept: 'ADMIN', receivedDate: new Date().toISOString().split('T')[0] }],
               checklist: {},
               scannedFiles: [],
               auditTrail: []
            } as any; // Temporary to allow missing id

            if (!app.projectName && projects.length > 0) app.projectName = projects[0].name;
            let parentProj = projects.find(p => p.name.trim().toLowerCase() === (app.projectName || '').trim().toLowerCase());
            if (!parentProj) {
              parentProj = projects.find(p => p.name.trim().toLowerCase().includes((app.projectName || '').trim().toLowerCase()));
            }
            app.workflowType = parentProj?.workflowType || 'Quy_trinh_1';
            
            app.phoneNumber = row[3] || app.phoneNumber || '';
            app.loanStatus = row[4] === 'Có' ? 'Co_Vay' : 'Khong_Vay';
            app.propertyType = row[5] === 'Căn hộ' ? 'Can_Ho' : 'Dat_Nen';
            app.bankCommitmentDeadline = parseExcelDate(row[6]) || app.bankCommitmentDeadline;
            app.receivedDate = parseExcelDate(row[7]) || app.receivedDate || new Date().toISOString().split('T')[0];
            app.contractSigningDate = parseExcelDate(row[8]) || app.contractSigningDate;
            app.isSelfService = row[9] === 'Có';
            
            if (row[10]) app.submissionLocation = (row[10] as string).includes('Phường') ? 'PHUONG' : 'TP_DANANG';
            if (row[11]) app.vpdkCode = row[11];
            if (row[12]) app.submissionDate = parseExcelDate(row[12]);
            if (row[13]) app.taxNotificationDate = parseExcelDate(row[13]);
            if (row[14]) app.taxNotificationReceivedDate = parseExcelDate(row[14]);
            if (row[15]) app.taxReceiptDate = parseExcelDate(row[15]);
            if (row[16]) app.gcnSignedDate = parseExcelDate(row[16]);
            if (row[17]) app.gcnReceivedDate = parseExcelDate(row[17]);
            if (row[18]) app.accountingHandoverDate = parseExcelDate(row[18]);
            if (row[19]) app.customerHandoverDate = parseExcelDate(row[19]);

            const inferred = inferStepFromDates(app);
            app.currentStep = inferred.currentStep;
            app.status = inferred.status;

            if (existingIndex > -1) {
              newApplications[existingIndex] = app;
              if (!app.id || (app.id && app.id.toString().includes('-imp-')) || !applications.some(a => a.id === app.id)) {
                const cIdx = appsToCreate.findIndex(item => item.unitCode === app.unitCode);
                if (cIdx > -1) appsToCreate[cIdx] = app;
                else appsToCreate.push(app);
              } else {
                const uIdx = appsToUpdate.findIndex(item => item.unitCode === app.unitCode);
                if (uIdx > -1) appsToUpdate[uIdx] = app;
                else appsToUpdate.push(app);
                updatedCount++;
              }
            } else {
              newApplications.push(app);
              createdCount++;
              const cIdx = appsToCreate.findIndex(item => item.unitCode === app.unitCode);
              if (cIdx > -1) appsToCreate[cIdx] = app;
              else appsToCreate.push(app);
            }
          } else if (userRole === 'PTT') {
            const existingIndex = newApplications.findIndex(a => a.unitCode === unitCode);
            const app = existingIndex > -1 ? { ...newApplications[existingIndex] } : {
               unitCode: unitCode,
               customerName: row[2] || '---',
               status: 'Processing',
               currentStep: 'S1_ChuanBi',
               taxPaymentStatus: 'Unpaid',
               submissionLocation: 'PHUONG',
               propertyType: 'Dat_Nen',
               loanStatus: 'Khong_Vay',
               isSelfService: false,
               history: [{ id: generateUUID(), stepName: 'PTT Import', dept: 'PTT', receivedDate: new Date().toISOString().split('T')[0] }],
               checklist: {},
               scannedFiles: [],
               auditTrail: []
            } as any;

            app.projectName = row[0] || app.projectName || (projects.length > 0 ? projects[0].name : '');
            const pProj = projects.find(p => p.name === app.projectName);
            app.workflowType = pProj?.workflowType || 'Quy_trinh_1';
            if (existingIndex === -1) {
              app.currentStep = app.workflowType === 'Quy_trinh_2' ? 'S1_ChuanBi' : 'GD1_ChuanBi';
              app.status = (stepConfig[app.currentStep] || INITIAL_STEP_CONFIG[app.currentStep])?.status || 'Processing';
            }
            app.customerName = row[2] || app.customerName || '---';
            app.contractSignerType = row[3] || app.contractSignerType || '';
            app.phoneNumber = row[4] || app.phoneNumber || '';
            app.loanStatus = row[5] === 'Có' ? 'Co_Vay' : 'Khong_Vay';
            app.propertyType = row[6] === 'Căn hộ' ? 'Can_Ho' : 'Dat_Nen';
            app.receivedDate = parseExcelDate(row[7]) || app.receivedDate || new Date().toISOString().split('T')[0];
            app.contractSigningDate = parseExcelDate(row[8]) || app.contractSigningDate;
            app.bankCommitmentDeadline = parseExcelDate(row[9]) || app.bankCommitmentDeadline;
            app.isSelfService = row[10] === 'Có';
            if (row[11]) app.customerHandoverDate = parseExcelDate(row[11]);

            const inferred = inferStepFromDates(app);
            app.currentStep = inferred.currentStep;
            app.status = inferred.status;

            if (existingIndex > -1) {
              newApplications[existingIndex] = app;
              if (!app.id || (app.id && app.id.toString().includes('-imp-')) || !applications.some(a => a.id === app.id)) {
                const cIdx = appsToCreate.findIndex(item => item.unitCode === app.unitCode);
                if (cIdx > -1) appsToCreate[cIdx] = app;
                else appsToCreate.push(app);
              } else {
                const uIdx = appsToUpdate.findIndex(item => item.unitCode === app.unitCode);
                if (uIdx > -1) appsToUpdate[uIdx] = app;
                else appsToUpdate.push(app);
                updatedCount++;
              }
            } else {
              newApplications.push(app);
              createdCount++;
              const cIdx = appsToCreate.findIndex(item => item.unitCode === app.unitCode);
              if (cIdx > -1) appsToCreate[cIdx] = app;
              else appsToCreate.push(app);
            }
          } 
          else if (userRole === 'KT') {
            const idx = newApplications.findIndex(a => a.unitCode === unitCode);
            if (idx > -1) {
              const app = { ...newApplications[idx] };
              app.projectName = row[0] || app.projectName;
              if (row[3]) app.submissionLocation = (row[3] as string).includes('Phường') ? 'PHUONG' : 'TP_DANANG';
              if (row[4]) app.vpdkCode = row[4];
              if (row[5]) app.submissionDate = parseExcelDate(row[5]);
              if (row[6]) app.taxNotificationReceivedDate = parseExcelDate(row[6]);
              if (row[7]) app.taxReceiptDate = parseExcelDate(row[7]);
              if (row[8]) app.gcnReceivedDate = parseExcelDate(row[8]);
              if (row[9]) app.ptdaHandoverDate = parseExcelDate(row[9]);
              if (row[10]) {
                app.issueNotes = row[10];
                app.issueType = 'Khác';
              }
              const inferred = inferStepFromDates(app);
              app.currentStep = inferred.currentStep;
              app.status = inferred.status;

              newApplications[idx] = app;
              if (!app.id || (app.id && app.id.toString().includes('-imp-')) || !applications.some(a => a.id === app.id)) {
                const cIdx = appsToCreate.findIndex(item => item.unitCode === app.unitCode);
                if (cIdx > -1) appsToCreate[cIdx] = app;
                else appsToCreate.push(app);
              } else {
                const uIdx = appsToUpdate.findIndex(item => item.unitCode === app.unitCode);
                if (uIdx > -1) appsToUpdate[uIdx] = app;
                else appsToUpdate.push(app);
                updatedCount++;
              }
            }
          }
          else if (userRole === 'PTDA') {
            const idx = newApplications.findIndex(a => a.unitCode === unitCode);
            if (idx > -1) {
              const app = { ...newApplications[idx] };
              app.projectName = row[0] || app.projectName;
              if (row[2]) app.taxNoticeProvisionDate = parseExcelDate(row[2]);
              if (row[3]) app.gcnSignedDate = parseExcelDate(row[3]);
              if (row[4]) app.gcnReceivedDate = parseExcelDate(row[4]);
              if (row[5]) {
                app.issueNotes = row[5];
                app.issueType = 'Khác';
              }
              
              const inferred = inferStepFromDates(app);
              app.currentStep = inferred.currentStep;
              app.status = inferred.status;

              newApplications[idx] = app;
              if (!app.id || (app.id && app.id.toString().includes('-imp-')) || !applications.some(a => a.id === app.id)) {
                const cIdx = appsToCreate.findIndex(item => item.unitCode === app.unitCode);
                if (cIdx > -1) appsToCreate[cIdx] = app;
                else appsToCreate.push(app);
              } else {
                const uIdx = appsToUpdate.findIndex(item => item.unitCode === app.unitCode);
                if (uIdx > -1) appsToUpdate[uIdx] = app;
                else appsToUpdate.push(app);
                updatedCount++;
              }
            }
          }
        });

        const anyToSync = [...appsToUpdate, ...appsToCreate];
        if (anyToSync.length > 0) {
          const finalApps = await bulkSyncRecordsToSupabase(anyToSync, applications);
          setApplications(finalApps);
          showToast(`Hoàn tất nhập liệu: Cập nhật ${updatedCount} hồ sơ, Tạo mới ${createdCount} hồ sơ.`, 'success');
          setActiveTab('applications');
        } else {
          showToast('Không có dữ liệu thay đổi để cập nhật', 'warning');
        }
      } catch (error: any) {
        console.error('Import Excel Error:', error);
        showToast(`Đồng bộ dữ liệu Supabase thất bại: ${error.message || 'Lỗi không xác định'}`, 'error');
      } finally {
        setIsImporting(false);
      }
    };

    reader.onerror = (err) => {
      console.error('File reading error:', err);
      showToast('Đọc file thất bại.', 'error');
      setIsImporting(false);
    };

    reader.readAsArrayBuffer(file);
    e.target.value = ''; 
  };

  const handleBulkPrint = () => {
    if (selectedAppIds.length === 0) return;
    const appsToPrint = applications.filter(a => selectedAppIds.includes(a.id));
    setPrintHandoverApps(appsToPrint);
    setIsPrintingHandover(true);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const createAuditEntry = (action: string, isBulk: boolean, count: number, unitCode: string, detail?: string): AuditTrailEntry => {
    const mode = isBulk ? '[Hàng loạt]' : '[Thủ công]';
    return {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: currentUser?.id || 'admin',
      userName: currentUser?.name || 'Admin',
      timestamp: new Date().toLocaleString('vi-VN'),
      action: `${mode} ${action}`,
      changes: detail || (isBulk ? `Xử lý đồng thời ${count} hồ sơ` : `Cập nhật hồ sơ ${unitCode}`)
    };
  };

  const handleUpdateApp = async () => {
    if (!editApp || !selectedApp) return;
    setIsSavingApp(true);
    
    try {
      const auditEntry = createAuditEntry('Cập nhật thông tin', false, 1, editApp.unitCode, 'Chỉnh sửa chi tiết hồ sơ');

      const updatedApp = {
        ...editApp,
        auditTrail: [auditEntry, ...(editApp.auditTrail || [])]
      };

      const finalApp = await syncRecordToSupabase(updatedApp);
      const oldId = updatedApp.id;

      setApplications(prev => prev.map(app => app.id === oldId ? finalApp : app));
      setDashboardApps(prev => prev.map(app => app.id === oldId ? finalApp : app));
      setSelectedApp(finalApp);
      setEditApp(null);
      setIsEditing(false);
      showToast('Đã cập nhật thông tin hồ sơ và đồng bộ Supabase thành công!', 'success');
    } catch (error: any) {
      console.error('Supabase update error:', error);
     showToast(`Lỗi khi lưu dữ liệu lên Supabase: ${error.message || 'Vui lòng kiểm tra cấu hình.'}`, 'error');
    } finally {
      setIsSavingApp(false);
    }
  };

  const cleanupFilesForRecords = async (ids: (string | number)[]) => {
    const appsToDelete = applications.filter(app => ids.includes(app.id));
    const allFilePaths: string[] = [];
    appsToDelete.forEach(app => {
      (app.scannedFiles || []).forEach(file => {
        if (file.path) allFilePaths.push(file.path);
      });
    });
    
    if (allFilePaths.length > 0) {
      try {
        const { error: storageError } = await supabase.storage
          .from('Documents-GCN')
          .remove(allFilePaths);
        
        if (storageError) {
          console.warn('Storage bulk delete warning:', storageError);
        }
      } catch (err) {
        console.error('Catch error in storage bulk delete:', err);
     }
    }
  };

  const handleDeleteApp = async (id: string, code: string) => {
    if (userRole !== 'ADMIN') {
      showToast('Bạn không có quyền thực hiện thao tác này!', 'error');
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa hồ sơ căn ${code}? Thao tác này không thể hoàn tác.`)) {
      setIsSavingApp(true);
      try {
        // 1. Cleanup files from storage first
        try {
          await cleanupFilesForRecords([id]);
        } catch (cleanupErr) {
          console.warn('File cleanup warning (continuing with app delete):', cleanupErr);
        }

        // 2. Delete from Database
        const { error } = await supabase
          .from('records')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setApplications(prev => prev.filter(app => app.id !== id));
        setDashboardApps(prev => prev.filter(app => app.id !== id));
        if (selectedApp?.id === id) {
          setSelectedApp(null);
          setIsEditing(false);
          setEditApp(null);
        }
        showToast('Đã xóa hồ sơ và tài liệu đính kèm thành công', 'success');
      } catch (error) {
        console.error('Supabase delete error:', error);
     showToast('Lỗi khi xóa dữ liệu trên Supabase.', 'error');
      } finally {
        setIsSavingApp(false);
      }
    }
  };

  const handleStepTransition = async (nextStep: StepName, note?: string) => {
    const app = editApp || selectedApp;
    if (!app) return;

    // --- PRIORITIZED SELF-SERVICE JUMP LOGIC (At the absolute top) ---
    const currStepCfg = stepConfig[app.currentStep] || INITIAL_STEP_CONFIG[app.currentStep];
    const currentStepDept = currStepCfg?.dept;
    const isSelfServiceJumpEligible = app.isSelfService && ['PTT', 'PTDA', 'KT'].includes(currentStepDept as any);

    if (isSelfServiceJumpEligible) {
      nextStep = 'Hoan_Tat';
    }
    // -------------------------------------------------------------
    
    // Allow transition if returning (nextIdx < currentIdx) even if there are errors, 
    // because returning is often the way to flag an error.
    const workflowSteps = app.workflowType === 'Quy_trinh_2' ? WORKFLOW_2_STEPS : WORKFLOW_1_STEPS;
    const currentIdx = workflowSteps.indexOf(app.currentStep);
    const nextIdx = workflowSteps.indexOf(nextStep);
    const isMovingForward = nextIdx > currentIdx;

    if (isMovingForward && (app.status === 'Error' || app.isRejected)) {
      showToast('Hồ sơ đang bị sai sót/vướng mắc hoặc bị trả về. Hãy hoàn thành khắc phục trước khi chuyển bước.', 'error');
      return;
    }

    // Field validations
    if (isMovingForward) {
      if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
        if (nextIdx > currentIdx + 1 && !isSelfServiceJumpEligible) {
          showToast('Hồ sơ yêu cầu chuyển bước tuần tự (trừ hồ sơ khách tự làm sổ).', 'error');
          return;
        }
      }

    // Date order validation for single transition
      const chronoError = validateDateSequence(app);
      if (chronoError) {
        showToast(`Lỗi trình tự ngày: ${chronoError}`, 'warning');
        return;
      }

      // Workflow validations
      if (app.workflowType === 'Quy_trinh_2') {
        if (app.currentStep === 'S2_KT_Tiep_Nhan' && nextStep === 'S2_KT_Ban_giao') {
           // Allow
        }
        if (app.currentStep === 'S2_KT_Ban_giao' && nextStep === 'S3_Nop_VPDK') {
          if (!app.submissionLocation || !app.vpdkCode || !app.submissionDate) {
            // Check if dates are being provided via the transition modal (handled by caller if not already set)
            // But we keep this as a general check.
          }
        }
        if (app.currentStep === 'S5_Tai_Chinh_Khach_Hang' && nextStep === 'S5_1_PTDA_TiepNhan') {
          if (!app.taxReceiptDate) {
            showToast('Bắt buộc nhập Ngày nhận/cung cấp GNT / Nộp thuế trước khi chuyển bước.', 'warning');
            return;
          }
        }
        if (app.currentStep === 'S5_1_PTDA_TiepNhan' && nextStep === 'S6_Nhan_So_GCN') {
          if (!app.gcnSignedDate) {
            showToast('Bắt buộc nhập Ngày trình ký/In GCN trước khi chuyển bước.', 'warning');
            return;
          }
        }
        if (app.currentStep === 'S6_Nhan_So_GCN' && nextStep === 'S7_PTDA_Ban_Giao') {
          if (!app.ptdaHandoverDate) {
            showToast('Bắt buộc nhập Ngày bàn giao GCN cho PTT trước khi chuyển bước.', 'warning');
            return;
          }
        }
        if (app.currentStep === 'S7_2_Ban_Giao_Khach' && nextStep === 'Hoan_Tat') {
          if (!app.customerHandoverDate) {
            showToast('Bắt buộc nhập Ngày BG GCN cho khách trước khi hoàn tất.', 'warning');
            return;
          }
        }
      } else {
        // Workflow 1 validations (assuming similar to previous)
        const ktSteps = ['S2_KT_Tiep_Nhan', 'GD1_KT_HoanThien'];
        if (ktSteps.concat(['S3_Nop_VPDK', 'GD1_Nop_VPDK']).includes(nextStep) && ktSteps.includes(app.currentStep) && nextStep !== app.currentStep) {
          if (!app.contractSigningDate) {
            showToast('Bắt buộc nhập Ngày ký HĐCN/HĐMB trước khi chuyển bước.', 'warning');
            return;
          }
        }
        
        if ((app.currentStep === 'S3_Nop_VPDK' || app.currentStep === 'GD1_Nop_VPDK') && (nextStep === 'S4_Cho_Thong_Bao_Thue' || nextStep === 'GD3_Cho_TBThue')) {
          if (!app.submissionDate) {
            showToast('Yêu cầu nhập đầy đủ: Ngày nộp VPĐK.', 'warning');
            return;
          }
        }
      }
    }

    // Smart logic for step bypassing: Step 3 (PTDA) bypasses Step 4 to Step 5 (PTT)
    let targetStep = nextStep;
    if (app.currentStep === 'S3_Nop_VPDK' && isMovingForward && nextStep === 'S4_Cho_Thong_Bao_Thue') {
      targetStep = 'S5_Tai_Chinh_Khach_Hang';
    }

    const nowStr = new Date().toISOString().split('T')[0];
    const prevHistory = [...app.history];
    if (prevHistory.length > 0) {
      prevHistory[0] = { ...prevHistory[0], completedDate: nowStr };
    }

    const nextDeptLabel = (stepConfig[targetStep] || INITIAL_STEP_CONFIG[targetStep]).dept;
    const handoverNote = note || `Hồ sơ đã được hoàn tất và tự động bàn giao sang bộ phận ${nextDeptLabel}`;

    const newHistory = [
      {
        id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        stepName: (stepConfig[targetStep] || INITIAL_STEP_CONFIG[targetStep]).label,
        dept: nextDeptLabel,
        receivedDate: nowStr,
        note: handoverNote,
        performedBy: currentUser?.id,
        performedByName: currentUser?.name
      },
      ...prevHistory
    ];

    // Auto-populate dates based on transition
    const autoDates: Partial<Application> = {};
    if (isMovingForward) {
      if ((targetStep === 'S2_KT_Tiep_Nhan' || targetStep === 'GD1_Cho_KT_TiepNhan') && !app.accountingHandoverDate) autoDates.accountingHandoverDate = nowStr;
      if ((targetStep === 'S3_Nop_VPDK' || targetStep === 'GD3_Cho_TBThue') && !app.submissionDate) autoDates.submissionDate = nowStr;
      
      if (targetStep === 'S5_Tai_Chinh_Khach_Hang') {
        if (!app.taxNotificationDate) autoDates.taxNotificationDate = nowStr;
        autoDates.taxNoticeProvisionDate = nowStr; // Ngày cung cấp TB Thuế (xử lý hệ thống)
      }

      if (targetStep === 'S4_Cho_Thong_Bao_Thue' || targetStep === 'GD3_Cho_TBThue') {
        if (!app.taxNotificationDate) autoDates.taxNotificationDate = nowStr;
        if (!app.taxNoticeProvisionDate) autoDates.taxNoticeProvisionDate = nowStr;
      }
      if ((targetStep === 'S5_1_PTDA_TiepNhan' || targetStep === 'GD4_Cho_KT_TiepNhan_LaySo') && !app.taxReceiptDate) autoDates.taxReceiptDate = nowStr;
      if ((targetStep === 'S6_Nhan_So_GCN' || targetStep === 'GD5_Cho_Ky_In_GCN') && !app.gcnSignedDate) autoDates.gcnSignedDate = nowStr;
      if ((targetStep === 'S7_PTDA_Ban_Giao' || targetStep === 'GD6_Cho_BG_Khach') && !app.ptdaHandoverDate) autoDates.ptdaHandoverDate = nowStr;
      if (targetStep === 'S7_1_PTT_Tiep_Nhan' && !app.gcnReceivedDate) autoDates.gcnReceivedDate = nowStr;
      if (targetStep === 'Hoan_Tat' && !app.customerHandoverDate) autoDates.customerHandoverDate = nowStr;
    }

    // Auto handover status
    autoDates.isHandedOver = true;
    autoDates.handoverDate = nowStr;

    let targetStatus = (stepConfig[targetStep] || INITIAL_STEP_CONFIG[targetStep]).status;
    
    // Business Logic updates
    if (targetStep === 'S2_KT_Tiep_Nhan') targetStatus = 'WaitingVPDK'; // CHỜ NỘP VPĐK
    if (targetStep === 'S5_1_PTDA_TiepNhan') targetStatus = 'TaxPaid'; // ĐÃ NỘP THUẾ
    if (targetStep === 'S7_2_Ban_Giao_Khach' || targetStep === 'GD6_Cho_BG_Khach' || targetStep === 'GD5_Cho_PTT_TiepNhan_BG') {
       targetStatus = app.customerHandoverDate || autoDates.customerHandoverDate ? 'Completed' : 'WaitingHandover';
    }

    if (targetStep === 'Hoan_Tat') targetStatus = 'Completed';

    if (targetStatus === 'TaxCompleted' && !app.taxReceiptDate && !autoDates.taxReceiptDate) {
      targetStatus = 'TaxPending'; // Fallback if no receipt date yet
    }
    
    // If it's a return, set status to Error/Rejection
    const finalStatus = !isMovingForward ? 'Error' : (targetStep === 'S1_ChuanBi' ? 'Error' : targetStatus);

    const updatedApp = {
      ...app,
      ...autoDates,
      currentStep: targetStep,
      status: finalStatus,
      isRejected: !isMovingForward || (targetStep === 'S1_ChuanBi' ? app.isRejected : false),
      rejectionReason: !isMovingForward ? note : (targetStep === 'S1_ChuanBi' ? app.rejectionReason : ''),
      history: newHistory,
      auditTrail: [
        createAuditEntry(
          'Chuyển bước xử lý', 
          false, 
          1, 
          app.unitCode, 
          `Từ: ${(stepConfig[app.currentStep] || INITIAL_STEP_CONFIG[app.currentStep]).label} -> ${(stepConfig[targetStep] || INITIAL_STEP_CONFIG[targetStep]).label}`
        ), 
        ...(app.auditTrail || [])
      ]
    };

    try {
      const finalApp = await syncRecordToSupabase(updatedApp);
      await notifyNextDepartment(finalApp, targetStep);

      // Cleanup notifications if complete
      if (targetStep === 'Hoan_Tat') {
        await deleteAllNotificationsForRecord(app.id);
      }

      setApplications(prev => prev.map(a => a.id === app.id ? finalApp : a));
      setDashboardApps(prev => prev.map(a => a.id === app.id ? finalApp : a));
      setSelectedApp(finalApp);
      setEditApp(null);
      setIsEditing(false);
      showToast(`Đã chuyển hồ sơ sang bước: ${(stepConfig[targetStep] || INITIAL_STEP_CONFIG[targetStep]).label} (Đã đồng bộ Supabase)`, 'success');
    } catch (error) {
      console.error('Supabase transition error:', error);
     showToast('Lỗi khi cập nhật trạng thái lên Supabase.', 'error');
    }
  };

  const handleBulkStepTransition = (nextStep: StepName, overrideIds?: (string | number)[]) => {
    const idsToProcess = overrideIds || selectedAppIds;
    if (idsToProcess.length === 0) return;
    
    if (overrideIds) {
      setSelectedAppIds(overrideIds);
    }
    
    // Prevent bulk transition if any of the selected apps have unresolved errors
    const appsWithError = applications.filter(app => idsToProcess.includes(app.id) && (app.status === 'Error' || app.isRejected));
    if (appsWithError.length > 0) {
      showToast(`Không thể chuyển bước hàng loạt. Có ${appsWithError.length} hồ sơ đang bị sai sót/vướng mắc hoặc bị trả về cần được khắc phục trước (Ví dụ căn ${appsWithError[0].unitCode}).`, 'error');
      return;
    }

    // Determine the relevant date field to update for this transition
    let updateField: {key: keyof Application, label: string, isRequired?: boolean} | null = null;
    
    // Mapping transition to field
    if (nextStep === 'S2_KT_Tiep_Nhan') updateField = { key: 'contractSigningDate', label: 'Ngày ký HĐCN/HĐMB', isRequired: false };
    else if (nextStep === 'S2_KT_Ban_giao') updateField = { key: 'contractSigningDate', label: 'Ngày ký HĐCN/HĐMB', isRequired: true };
    else if (nextStep === 'S3_Nop_VPDK') updateField = { key: 'submissionDate', label: 'Ngày nộp VPĐK', isRequired: true };
    else if (nextStep === 'S5_Tai_Chinh_Khach_Hang') updateField = { key: 'taxNotificationDate', label: 'Ngày TB Thuế', isRequired: true };
    else if (nextStep === 'S4_Cho_Thong_Bao_Thue') updateField = { key: 'taxNotificationReceivedDate', label: 'Ngày nhận TB Thuế' };
    else if (nextStep === 'S5_1_PTDA_TiepNhan') updateField = { key: 'taxReceiptDate', label: 'Ngày nhận/cung cấp GNT / Nộp thuế', isRequired: true };
    else if (nextStep === 'S6_Nhan_So_GCN') updateField = { key: 'gcnSignedDate', label: 'Ngày trình ký/In GCN', isRequired: true };
    else if (nextStep === 'S7_PTDA_Ban_Giao') updateField = { key: 'gcnSignedDate', label: 'Ngày trình ký/In GCN', isRequired: true };
    else if (nextStep === 'S7_1_PTT_Tiep_Nhan') updateField = { key: 'ptdaHandoverDate', label: 'Ngày bàn giao GCN cho PTT', isRequired: true };
    else if (nextStep === 'S7_2_Ban_Giao_Khach') updateField = { key: 'gcnReceivedDate', label: 'Ngày nhận GCN thực tế', isRequired: true };
    else if (nextStep === 'Hoan_Tat') updateField = { key: 'customerHandoverDate', label: 'Ngày BG GCN cho khách', isRequired: true };
    
    // GD workflow
    else if (nextStep === 'GD1_Cho_KT_TiepNhan') updateField = { key: 'contractSigningDate', label: 'Ngày ký HĐCN/HĐMB', isRequired: false };
    else if (nextStep === 'GD3_Cho_TBThue') updateField = { key: 'submissionDate', label: 'Ngày nộp VPĐK', isRequired: true };
    else if (nextStep === 'GD4_Cho_Nop_NVTC') updateField = { key: 'taxNotificationDate', label: 'Ngày TB Thuế', isRequired: true };
    else if (nextStep === 'GD4_Cho_KT_TiepNhan_LaySo') updateField = { key: 'taxReceiptDate', label: 'Ngày nhận/cung cấp GNT / Nộp thuế', isRequired: true };
    else if (nextStep === 'GD5_Cho_Ky_In_GCN') updateField = { key: 'gcnSignedDate', label: 'Ngày trình ký/In GCN', isRequired: true };
    else if (nextStep === 'GD5_Cho_GCN') updateField = { key: 'gcnSignedDate', label: 'Ngày trình ký/In GCN', isRequired: true };
    else if (nextStep === 'GD5_Cho_PTT_TiepNhan_BG') updateField = { key: 'gcnReceivedDate', label: 'Ngày nhận GCN thực tế', isRequired: true };
    else if (nextStep === 'GD6_Cho_BG_Khach') updateField = { key: 'ptdaHandoverDate', label: 'Ngày BG GCN cho PTT', isRequired: true };

    // If there is no specific field to update, we can either skip the modal and transition directly 
    // or keep the modal just for confirmation. Here we just show the modal without a required date.
    const today = new Date().toISOString().split('T')[0];
    let initialValue = today;
    let initLocation: 'PHUONG' | 'TP_DANANG' = 'PHUONG';
    let initRefCode = '';
    
    if (idsToProcess.length === 1) {
      const singleApp = applications.find(a => a.id === idsToProcess[0]);
      if (singleApp) {
        if (updateField && (singleApp as any)[updateField.key]) {
          initialValue = (singleApp as any)[updateField.key];
        }
        if (singleApp.submissionLocation) initLocation = singleApp.submissionLocation as any;
        if (singleApp.vpdkCode) initRefCode = singleApp.vpdkCode;
      }
    }

    setBulkTransitionTarget(nextStep);
    setBulkTransitionField(updateField);
    setBulkTransitionValue(initialValue);
    setBulkTransitionLocation(initLocation);
    setBulkTransitionRefCode(initRefCode);
    setIsBulkTransitionModalOpen(true);
  };

  const executeBulkStepTransition = async (nextStep: StepName, dateValue: string | null, location?: string, refCode?: string) => {
    if (selectedAppIds.length === 0) return;
    
    // Check if mandatory date is provided
    if (bulkTransitionField && bulkTransitionField.isRequired !== false && !dateValue) {
      showToast(`Vui lòng nhập ${bulkTransitionField.label} trước khi xác nhận.`, 'warning');
      return;
    }

    // Check if transition from KT requires contractSigningDate, wait we update it via bulk transition field anyway!
    // But if we transition to S2_KT_Ban_giao, it is required, which is already enforced by bulkTransitionField.isRequired.
    if (['S4_Cho_Thong_Bao_Thue', 'S3_Nop_VPDK', 'GD3_Cho_TBThue'].includes(nextStep)) {
      if (!location || !refCode) {
        showToast(`Vui lòng nhập nơi nộp hồ sơ và mã hồ sơ/phiếu hẹn.`, 'warning');
        return;
      }
    }


    const nowStr = new Date().toISOString().split('T')[0];
    const updatedCount = selectedAppIds.length;
    setIsSavingApp(true);
    
    try {
      const chronoErrors: string[] = [];
      let actuallyUpdatedCount = 0;

      const updatedApps = applications.map(app => {
        if (!selectedAppIds.includes(app.id)) return app;
        
        // Security check: Only move apps that are in the expected source step for this bulk action
        // This prevents the issue where one dept accepts apps that haven't been handed over by the previous dept
        const workflowSteps = app.workflowType === 'Quy_trinh_2' ? WORKFLOW_2_STEPS : WORKFLOW_1_STEPS;
        const currentIdx = workflowSteps.indexOf(app.currentStep);
        
        // --- PRIORITIZED SELF-SERVICE JUMP LOGIC (Bulk) ---
        let recordNextStep = nextStep;
        const currentStepCfg = stepConfig[app.currentStep] || INITIAL_STEP_CONFIG[app.currentStep];
        const currentDept = currentStepCfg?.dept;
        const isSelfServiceJumpEligible = app.isSelfService && ['PTT', 'PTDA', 'KT'].includes(currentDept as any);

        if (isSelfServiceJumpEligible) {
          recordNextStep = 'Hoan_Tat';
        }
        
        const nextIdx = workflowSteps.indexOf(recordNextStep);
        
        if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
          if (nextIdx !== currentIdx + 1 && !isSelfServiceJumpEligible) {
            return app;
          }
        }

        actuallyUpdatedCount++;

        // Apply bulk date update if provided
        let appWithDate = { ...app };
        if (bulkTransitionField && dateValue) {
          (appWithDate as any)[bulkTransitionField.key] = dateValue;
        }

        if (['S4_Cho_Thong_Bao_Thue', 'S3_Nop_VPDK', 'GD3_Cho_TBThue', 'GD1_Nop_VPDK', 'GD2_Cho_Nop_VPDK'].includes(recordNextStep)) {
          if (location) appWithDate.submissionLocation = location as any;
          if (refCode) appWithDate.vpdkCode = refCode;
        }

        // Check chronology for all selected apps
        const chronoError = validateDateSequence(appWithDate);
        if (chronoError) {
          chronoErrors.push(`Căn ${appWithDate.unitCode}: ${chronoError}`);
        }
        
        let targetStep = recordNextStep;
        
        const prevHistory = [...appWithDate.history];
        if (prevHistory.length > 0) {
          prevHistory[0] = { ...prevHistory[0], completedDate: nowStr };
        }
        
        const note = `Chuyển hàng loạt ${dateValue ? `(Cập nhật ${bulkTransitionField?.label}: ${dateValue})` : ''}`;

        const nextDeptLabel = (stepConfig[targetStep] || INITIAL_STEP_CONFIG[targetStep]).dept;
        const handoverNote = `Hồ sơ đã hoàn tất và tự động bàn giao sang bộ phận ${nextDeptLabel}`;
        
        const newHistory = [
          {
            id: `hist-${Date.now()}-${appWithDate.id}`,
            stepName: (stepConfig[targetStep] || INITIAL_STEP_CONFIG[targetStep]).label,
            dept: nextDeptLabel,
            receivedDate: nowStr,
            note: `${note}. ${handoverNote}`,
            performedBy: currentUser?.id,
            performedByName: currentUser?.name
          },
          ...prevHistory
        ];
        
        const autoDates: Partial<Application> = {};
        if (targetStep === 'S2_KT_Tiep_Nhan' && !appWithDate.accountingHandoverDate) autoDates.accountingHandoverDate = nowStr;
        if (targetStep === 'S3_Nop_VPDK' && !appWithDate.submissionDate) autoDates.submissionDate = nowStr;
        
        if (targetStep === 'S5_Tai_Chinh_Khach_Hang') {
          if (!appWithDate.taxNotificationDate) autoDates.taxNotificationDate = dateValue || nowStr;
          autoDates.taxNoticeProvisionDate = nowStr; // Auto fill Ngày cung cấp TB Thuế
        }
        
        if (targetStep === 'S4_Cho_Thong_Bao_Thue') {
          if (!appWithDate.taxNotificationDate) autoDates.taxNotificationDate = nowStr;
          if (!appWithDate.taxNoticeProvisionDate) autoDates.taxNoticeProvisionDate = nowStr;
        }

        if (targetStep === 'S5_1_PTDA_TiepNhan' && !appWithDate.taxReceiptDate) autoDates.taxReceiptDate = nowStr;
        if (targetStep === 'S6_Nhan_So_GCN') {
          if (!appWithDate.gcnSignedDate) autoDates.gcnSignedDate = nowStr;
        }
        if (targetStep === 'S7_PTDA_Ban_Giao' && !appWithDate.ptdaHandoverDate) autoDates.ptdaHandoverDate = nowStr;
        if (targetStep === 'S7_1_PTT_Tiep_Nhan' && !appWithDate.gcnReceivedDate) autoDates.gcnReceivedDate = nowStr;
        if (targetStep === 'S7_2_Ban_Giao_Khach' && !appWithDate.customerHandoverDate) autoDates.customerHandoverDate = nowStr;
        if (targetStep === 'Hoan_Tat' && !appWithDate.customerHandoverDate) autoDates.customerHandoverDate = nowStr;

        // Auto handover logic
        autoDates.isHandedOver = true;
        autoDates.handoverDate = bulkTransitionField && dateValue ? dateValue : nowStr;

        let targetStatus = (stepConfig[targetStep] || INITIAL_STEP_CONFIG[targetStep]).status;
        
        // Business Logic updates
        if (targetStep === 'S2_KT_Tiep_Nhan') targetStatus = 'WaitingVPDK'; // CHỜ NỘP VPĐK
        if (targetStep === 'S5_1_PTDA_TiepNhan') targetStatus = 'TaxPaid'; // ĐÃ NỘP THUẾ
        if (targetStep === 'S7_2_Ban_Giao_Khach' || targetStep === 'GD6_Cho_BG_Khach' || targetStep === 'GD5_Cho_PTT_TiepNhan_BG') {
           targetStatus = app.customerHandoverDate || autoDates.customerHandoverDate ? 'Completed' : 'WaitingHandover';
        }

        if (targetStep === 'Hoan_Tat') targetStatus = 'Completed';

        if (targetStatus === 'TaxCompleted' && !appWithDate.taxReceiptDate && !autoDates.taxReceiptDate) {
          targetStatus = 'TaxPending';
        }

        return {
          ...appWithDate,
          ...autoDates,
          currentStep: targetStep,
          status: targetStep === 'S1_ChuanBi' ? 'Error' : targetStatus,
          isRejected: targetStep === 'S1_ChuanBi' ? appWithDate.isRejected : false,
          rejectionReason: targetStep === 'S1_ChuanBi' ? appWithDate.rejectionReason : '',
          history: newHistory,
          auditTrail: [
            createAuditEntry(
              'Chuyển bước hàng loạt', 
              true, 
              updatedCount, 
              appWithDate.unitCode, 
              `Từ: ${(stepConfig[app.currentStep] || INITIAL_STEP_CONFIG[app.currentStep]).label} -> ${(stepConfig[targetStep] || INITIAL_STEP_CONFIG[targetStep]).label}`
            ), 
            ...(appWithDate.auditTrail || [])
          ]
        };
      });

      if (chronoErrors.length > 0) {
        showToast(`Lỗi trình tự ngày: ${chronoErrors[0]}`, 'error');
        setIsSavingApp(false);
        return;
      }

      if (actuallyUpdatedCount === 0) {
        showToast('Không có hồ sơ nào đủ điều kiện để thực hiện chuyển bước này hàng loạt.', 'warning');
        setIsSavingApp(false);
        return;
      }

      const appsToSync = updatedApps.filter(app => {
        const original = applications.find(a => a.id === app.id);
        return original && original.currentStep !== app.currentStep;
      });
      
      // Perform bulk upsert to Supabase
      const finalApps = await bulkSyncRecordsToSupabase(appsToSync, updatedApps);
      setApplications(finalApps);
      setDashboardApps(prev => {
        const next = [...prev];
        appsToSync.forEach(synced => {
          const idx = next.findIndex(a => a.id === synced.id);
          const foundInFinal = finalApps.find(fa => fa.unitCode === synced.unitCode);
          if (idx !== -1 && foundInFinal) {
            next[idx] = foundInFinal;
          } else if (foundInFinal) {
            next.push(foundInFinal);
          }
        });
        return next;
      });

      if (selectedApp && selectedAppIds.includes(selectedApp.id)) {
        const updatedSelected = finalApps.find(fa => fa.id === selectedApp.id);
        if (updatedSelected) {
          setSelectedApp(updatedSelected);
        }
      }

      // Notifications for bulk transition
      await Promise.all(appsToSync.map(app => notifyNextDepartment(app, app.currentStep)));

      // Cleanup notifications for finished apps
      if (nextStep === 'Hoan_Tat') {
        await Promise.all(selectedAppIds.map(id => deleteAllNotificationsForRecord(id)));
      }

      setSelectedAppIds([]);
      setIsBulkTransitionModalOpen(false);
      setBulkTransitionTarget(null);
      setBulkTransitionField(null);
      showToast(`Đã xử lý hàng loạt ${actuallyUpdatedCount} hồ sơ lên Supabase thành công.`, 'success');
    } catch (error) {
      console.error('Supabase bulk transition error:', error);
     showToast('Lỗi khi cập nhật hàng loạt lên Supabase.', 'error');
    } finally {
      setIsSavingApp(false);
    }
  };



  const handleBulkDelete = async () => {
    if (selectedAppIds.length === 0) return;
    
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedAppIds.length} hồ sơ đã chọn? Hành động này không thể hoàn tác.`)) {
      return;
    }

    const count = selectedAppIds.length;
    setIsSavingApp(true);

    try {
      // 1. Cleanup files from storage first
      try {
        await cleanupFilesForRecords(selectedAppIds);
      } catch (cleanupErr) {
        console.warn('Bulk file cleanup warning:', cleanupErr);
      }

      // 2. Delete from Database
      const { error } = await supabase
        .from('records')
        .delete()
        .in('id', selectedAppIds);

      if (error) throw error;

      setApplications(prev => prev.filter(app => !selectedAppIds.includes(app.id)));
      setSelectedAppIds([]);
      showToast(`Đã xóa hàng loạt ${count} hồ sơ và tài liệu đính kèm thành công.`, 'success');
    } catch (error) {
      console.error('Supabase bulk delete error:', error);
     showToast('Lỗi khi xóa hàng loạt trên Supabase.', 'error');
    } finally {
      setIsSavingApp(false);
    }
  };



  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const app = editApp || selectedApp;
    if (!file || !app) return;

    setIsSavingApp(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${app.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${app.unitCode}/${fileName}`;

      // 1. Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('Documents-GCN')
        .upload(filePath, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false
        });

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('Documents-GCN')
        .getPublicUrl(filePath);

      const newFile: ScannedFile = {
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: file.type,
        url: publicUrl,
        path: filePath,
        uploadDate: new Date().toISOString().split('T')[0]
      };

      const updatedApp = {
        ...app,
        scannedFiles: [...(app.scannedFiles || []), newFile]
      };

      // 3. Update record in Database
      const finalApp = await syncRecordToSupabase(updatedApp);

      const updatedApps = applications.map(a => a.id === app.id ? finalApp : a);
      setApplications(updatedApps);
      setDashboardApps(prev => prev.map(a => a.id === app.id ? finalApp : a));
      if (editApp && editApp.id === app.id) setEditApp(finalApp);
      if (selectedApp && selectedApp.id === app.id) setSelectedApp(finalApp);
      
      showToast(`Đã tải tài liệu "${file.name}" lên Supabase Storage thành công.`, 'success');
    } catch (error) {
      console.error('Supabase file upload error:', error);
     showToast('Lỗi khi tải tài liệu lên Supabase. Vui lòng kiểm tra quyền và bucket "Documents-GCN".', 'error');
    } finally {
      setIsSavingApp(false);
      e.target.value = '';
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    const app = editApp || selectedApp;
    if (!app || !window.confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) return;

    const fileToDelete = (app.scannedFiles || []).find(f => f.id === fileId);
    const updatedApp = {
      ...app,
      scannedFiles: (app.scannedFiles || []).filter(f => f.id !== fileId)
    };

    setIsSavingApp(true);
    try {
      // 1. Delete from Supabase Storage if path exists AND it's not a shared file
      // If it's shared, we only remove the link from the current record's scannedFiles
      if (fileToDelete?.path && !fileToDelete.isShared) {
        const { error: storageError } = await supabase.storage
          .from('Documents-GCN')
          .remove([fileToDelete.path]);
        
        if (storageError) {
          console.warn('Storage delete warning:', storageError);
          // We continue anyway to update the record even if storage delete failed
        }
      } else if (fileToDelete?.isShared) {
        console.log('[Info] Shared file link removed. Original file kept on storage.');
      }

      // 2. Update DB record
      const finalApp = await syncRecordToSupabase(updatedApp);

      const updatedApps = applications.map(a => a.id === app.id ? finalApp : a);
      setApplications(updatedApps);
      setDashboardApps(prev => prev.map(a => a.id === app.id ? finalApp : a));
      if (editApp && editApp.id === app.id) setEditApp(finalApp);
      if (selectedApp && selectedApp.id === app.id) setSelectedApp(finalApp);
      showToast(fileToDelete?.isShared ? 'Đã gỡ bỏ bản sao tài liệu chung.' : 'Đã xóa tài liệu khỏi hệ thống thành công.', 'success');
    } catch (error) {
      console.error('Supabase file delete error:', error);
     showToast('Lỗi khi xóa tài liệu.', 'error');
    } finally {
      setIsSavingApp(false);
    }
  };

  const handleBulkFileUpload = async (file: File) => {
    if (selectedAppIds.length === 0) return;
    
    setIsUploadingShared(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `shared-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `shared_documents/${fileName}`;

      // 1. Upload file to Supabase Storage (Only once)
      const { error: uploadError } = await supabase.storage
        .from('Documents-GCN')
        .upload(filePath, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false
        });

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('Documents-GCN')
        .getPublicUrl(filePath);

      const newSharedFile: ScannedFile = {
        id: `shared-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: file.type,
        url: publicUrl,
        path: filePath,
        uploadDate: new Date().toISOString().split('T')[0],
        isShared: true
      };

      // 3. Prepare updated apps
      const appsToUpdate = applications
        .filter(a => selectedAppIds.includes(a.id))
        .map(app => ({
          ...app,
          scannedFiles: [...(app.scannedFiles || []), newSharedFile],
          auditTrail: [{
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            userId: currentUser?.dept || 'System',
            userName: currentUser?.dept || 'Hệ thống',
            action: 'Gắn tài liệu chung hàng loạt'
          }, ...(app.auditTrail || [])]
        }));

      // 4. Batch update to Supabase
      const updatedApplications = await bulkSyncRecordsToSupabase(appsToUpdate, applications);
      
      setApplications(updatedApplications);
      setDashboardApps(prev => prev.map(a => {
        const found = appsToUpdate.find(upd => upd.id === a.id);
        return found ? found : a;
      }));
      
      setIsBulkDocumentOpen(false);
      showToast(`Đã gắn tài liệu chung cho ${selectedAppIds.length} hồ sơ.`, 'success');
      setSelectedAppIds([]);
    } catch (error) {
      console.error('Bulk file upload error:', error);
     showToast('Lỗi khi tải tài liệu chung lên.', 'error');
    } finally {
      setIsUploadingShared(false);
    }
  };

  const renderFilePreview = (file: ScannedFile) => {
    if (file.type.startsWith('image/')) {
      return (
        <img src={file.url} alt={file.name} className="max-w-full max-h-full object-contain" />
      );
    } else if (file.type === 'application/pdf') {
      return (
        <iframe src={file.url} className="w-full h-full border-none" title={file.name} />
      );
    }
    return (
      <div className="flex flex-col items-center gap-4 text-slate-500">
        <FileText size={48} />
        <p className="text-sm font-bold">Không thể xem trước định dạng này</p>
        <a href={file.url} download={file.name} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">
          Tải xuống để xem
        </a>
      </div>
    );
  };

  function updateAppIssue(
    app: Application, 
    note: string, 
    type: IssueType = 'Sai sót Khác', 
    severity: IssueSeverity = 'Trung bình'
  ): Application {
    const auditEntry = createAuditEntry('Ghi nhận vướng mắc', false, 1, app.unitCode, `Loại: ${type}. Ghi chú: ${note}`);
    
    return {
      ...app,
      status: 'Error' as const,
      issueNotes: note,
      issueType: type,
      issueSeverity: severity,
      issue_status: 'OPEN',
      issue_created_at: new Date().toISOString(),
      issue_resolved_at: null,
      issue_type: type,
      issue_severity: severity,
      issue_notes: note,
      auditTrail: [auditEntry, ...(app.auditTrail || [])]
    };
  }

  // Deprecated
  const handleReportErrorOld = async (note: string) => {
    // ...
  };

  const handleReportError = async (note: string) => {
    const app = editApp || selectedApp;
    if (!app) return;

    // Restriction: Only authorized depts can report errors/supplement requests
    const allowedDepts: Dept[] = ['KT', 'PTDA', 'MANAGER', 'DIRECTOR', 'ADMIN'];
    if (!allowedDepts.includes(userRole)) {
      showToast('Bạn không có quyền thực hiện chức năng Báo lỗi / Yêu cầu bổ sung.', 'error');
      return;
    }

    const updatedApp = updateAppIssue(app, note);

    setIsSavingApp(true);
    try {
      const finalApp = await syncRecordToSupabase(updatedApp);

      setApplications(prev => prev.map(a => a.id === app.id ? finalApp : a));
      setSelectedApp(finalApp);
      setEditApp(null);
      setIsEditing(false);
      setExpandedSections(prev => prev.includes('OTHER_SECTION') ? prev : [...prev, 'OTHER_SECTION']);
      showToast('Đã ghi nhận sai sót và đồng bộ Supabase thành công.', 'warning');
    } catch (error) {
      console.error('Supabase report error:', error);
     showToast('Lỗi khi ghi nhận sai sót lên Supabase.', 'error');
    } finally {
      setIsSavingApp(false);
    }
  };

  const handleResolveError = async () => {
    const app = editApp || selectedApp;
    if (!app) return;

    const newHistory = [
      {
        id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        stepName: 'Khắc phục lỗi',
        dept: userRole as Dept,
        receivedDate: new Date().toISOString().split('T')[0],
        note: 'Đã khắc phục', // Updated note
        performedBy: currentUser?.id,
        performedByName: currentUser?.name
      },
      ...app.history
    ];

    const updatedApp = {
      ...app,
      status: stepConfig[app.currentStep]?.status || 'Processing',
      issueType: 'None' as const,
      issueNotes: '',
      issue_status: 'RESOLVED' as const,
      issue_resolved_at: new Date().toISOString(),
      issue_type: app.issue_type || app.issueType || 'Sai sót Khác',
      issue_severity: app.issue_severity || app.issueSeverity || 'Trung bình',
      issue_notes: app.issue_notes || app.issueNotes || app.issueNotes || '',
      isRejected: false,
      history: newHistory
    };

    setIsSavingApp(true);
    try {
      const finalApp = await syncRecordToSupabase(updatedApp);

      setApplications(prev => prev.map(a => a.id === app.id ? finalApp : a));
      setSelectedApp(finalApp);
      showToast('Đã phục hồi trạng thái và đồng bộ Supabase thành công.', 'success');
    } catch (error) {
      console.error('Supabase resolve error:', error);
     showToast('Lỗi khi lưu trạng thái phục hồi lên Supabase.', 'error');
    } finally {
      setIsSavingApp(false);
    }
  };

  const handleResolveIssue = async (appId: string) => {
    try {
      const app = applications.find(a => a.id === appId);
      if (!app) return;
      
      const stepCfg = stepConfig[app.currentStep] || INITIAL_STEP_CONFIG[app.currentStep];
      
      const newHistory = [
        {
          id: `resolve-${Date.now()}`,
          stepName: stepCfg.label,
          dept: userRole as Dept,
          receivedDate: new Date().toISOString(),
          note: 'Đã khắc phục xong sai sót/vướng mắc. Sẵn sàng chuyển bước tiếp theo.',
          performedBy: currentUser?.id,
          performedByName: currentUser?.name
        },
        ...app.history
      ];

      const updatedApp = {
        ...app,
        status: stepCfg.status,
        isRejected: false,
        issueType: 'None' as const,
        issueSeverity: 'Minor' as const,
        issueNotes: '',
        issue_status: 'RESOLVED' as const,
        issue_resolved_at: new Date().toISOString(),
        issue_type: app.issue_type || app.issueType || 'Sai sót Khác',
        issue_severity: app.issue_severity || app.issueSeverity || 'Trung bình',
        issue_notes: app.issue_notes || app.issueNotes || app.issueNotes || '',
        history: newHistory
      };

      const finalApp = await syncRecordToSupabase(updatedApp);
      
      setApplications(prev => prev.map(a => a.id === appId ? finalApp : a));
      setDashboardApps(prev => prev.map(a => a.id === appId ? finalApp : a));
      setSelectedApp(finalApp);
      showToast('Đã xác nhận khắc phục xong vướng khoán.', 'success');
    } catch (error) {
      console.error(error);
     showToast('Lỗi khi cập nhật trạng thái.', 'error');
    }
  };

  const handleRejectApp = async (reason: string) => {
    const app = editApp || selectedApp;
    if (!app) return;

    // Restriction: Only authorized depts can reject apps
    const allowedDepts: Dept[] = ['PTT', 'KT', 'PTDA', 'MANAGER', 'DIRECTOR', 'ADMIN'];
    if (!allowedDepts.includes(userRole)) {
      showToast('Bạn không có quyền Trả về / Yêu cầu bổ sung hồ sơ.', 'error');
      return;
    }

    // Determine previous step dynamically
    const stepKeys = Object.keys(stepConfig);
    const currentIndex = stepKeys.indexOf(app.currentStep);
    const prevStep = currentIndex > 0 ? stepKeys[currentIndex - 1] as StepName : app.currentStep;

    const newHistory = [
      {
        id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        stepName: 'Yêu cầu chỉnh sửa / Bổ sung',
        dept: userRole as Dept,
        receivedDate: new Date().toISOString().split('T')[0],
        note: `Hồ sơ sai sót/cần bổ sung: ${reason}`,
        performedBy: currentUser?.id,
        performedByName: currentUser?.name
      },
      ...app.history
    ];

    const updatedApp = {
      ...updateAppIssue(app, reason, 'Sai sót Khác'),
      currentStep: prevStep,
      rejectionCount: (app.rejectionCount || 0) + 1,
      isRejected: true,
      rejectionReason: reason,
    };

    setIsSavingApp(true);
    try {
      // Create notification for users in the previous step's department
      const prevStepConfig = stepConfig[prevStep] || INITIAL_STEP_CONFIG[prevStep];
      const targetDept = prevStepConfig.dept;
      const targetUsers = users.filter(u => u.dept === targetDept && u.id !== currentUser?.id);
      
      const promises = targetUsers.map(u => 
        createNotification({
          recipientId: u.id,
          title: 'Hồ sơ bị trả về / Cần bổ sung',
          message: `Hồ sơ lô ${app.unitCode} (${app.projectName}) bị Kế toán trả về: ${reason}`,
          type: 'Urgent',
          appId: app.id
        })
      );
      await Promise.all(promises);

      const finalApp = await syncRecordToSupabase(updatedApp);
      const oldId = app.id;

      setApplications(prev => prev.map(a => a.id === oldId ? finalApp : a));
      setDashboardApps(prev => prev.map(a => a.id === oldId ? finalApp : a));
      setSelectedApp(finalApp);
      setEditApp(null);
      setIsEditing(false);
      setExpandedSections(prev => prev.includes('OTHER_SECTION') ? prev : [...prev, 'OTHER_SECTION']);
      showToast('Hồ sơ đã được trả về giai đoạn 1 và cập nhật Supabase thành công.', 'warning');
    } catch (error) {
      console.error('Supabase reject error:', error);
     showToast('Lỗi khi lưu yêu cầu bổ sung lên Supabase.', 'error');
    } finally {
      setIsSavingApp(false);
    }
  };

  const isFieldEditable = (fieldName: string) => {
    if (!isEditing) return false;
    
    // Admin always has edit rights
    if (userRole === 'ADMIN') return true;
    
    // Management/Leadership roles depend on the permission field from DB
    if (userRole === 'MANAGER' || userRole === 'DIRECTOR') {
      return userCanEdit;
    }

    // Specialist roles logic remains as is (they are always allowed to edit their assigned fields)
    if (userRole === 'PTDA' && fieldName === 'vpdkCode') return false;

    const pttFields = [
      'customerName', 'contractSignerType', 'phoneNumber', 'loanStatus', 'bankCommitmentDeadline', 'propertyType', 
      'contractSigningDate', 'receivedDate', 'isSelfService', 'customerHandoverDate', 'taxNotificationReceivedDate', 'accountingHandoverDate', 'staffName'
    ];

    // Financial & Tax & Authority Submission: KT responsible for processing according to function (Tax/Accounting)
    const ktFields = [
      'contractSigningDate', 'submissionLocation', 'vpdkCode', 'submissionDate',
      'taxReceiptDate', 'taxVpdkSubmissionDate', 'taxPaymentStatus',
      'gcnReceivedDate', 'ptdaHandoverDate',
      'issueType', 'issueNotes', 'issueSeverity'
    ];

    // Project/Authority: PTDA responsible for processing dates (GCN milestones)
    const ptdaFields = [
      'vpdkCode', 'taxNotificationDate', 'taxNoticeProvisionDate', 'gcnSignedDate',
      'issueType', 'issueNotes', 'issueSeverity'
    ];

    if (userRole === 'PTT') return pttFields.includes(fieldName);
    if (userRole === 'KT') return ktFields.includes(fieldName);
    if (userRole === 'PTDA') return ptdaFields.includes(fieldName);
    
    return false;
  };

  const isFieldVisible = (fieldName: string) => {
    if (isManagement) return true;

    // PTDA and KT don't need to see doc checklist
    if (fieldName === 'checklist') {
      return userRole === 'PTT';
    }

    // Hide internal tax processing dates from outside KT if needed, 
    // but the user wants to see "tiến độ" so mostly everything stays visible.
    // However, we'll keep it simple: everything visible unless sensitive.
    return true;
  };

  const handleFieldChange = (field: keyof Application, value: any) => {
    if (editApp) {
      const nextApp = { ...editApp, [field]: value };
      
      // Auto-promote status to TaxCompleted if taxReceiptDate is added and current step expects it
      if (field === 'taxReceiptDate' && value && stepConfig[editApp.currentStep]?.status === 'TaxCompleted') {
        nextApp.status = 'TaxCompleted';
      }
      
      // Auto-promote status if taxNotificationReceivedDate is added and current step is S4_Cho_Thong_Bao_Thue
      if (field === 'taxNotificationReceivedDate' && value && editApp.currentStep === 'S4_Cho_Thong_Bao_Thue') {
        nextApp.currentStep = 'S5_Tai_Chinh_Khach_Hang';
      }

      // Auto-promote to Hoan_Tat if customerHandoverDate is added
      if (field === 'customerHandoverDate' && value) {
        nextApp.currentStep = 'Hoan_Tat';
        nextApp.status = 'Completed';
        const historyItem: ApplicationHistory = {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toLocaleString('vi-VN'),
          user: userRole,
          action: 'Tự động hoàn tất (Có ngày BG khách)',
        };
        nextApp.history = [historyItem, ...(nextApp.history || [])];
      }

      // Auto-update issue type if notes are added
      if (field === 'issueNotes' && value) {
        if (!editApp.issueType || editApp.issueType === 'None') {
          nextApp.issueType = 'Sai sót Khác';
        }
        nextApp.status = 'Error';
        nextApp.issue_type = nextApp.issueType;
        nextApp.issue_notes = value;
        nextApp.issue_severity = nextApp.issueSeverity || 'Trung bình';
        nextApp.issue_status = 'OPEN';
        nextApp.issue_resolved_at = null;
        if (!nextApp.issue_created_at) {
          nextApp.issue_created_at = new Date().toISOString();
        }
      }

      if (field === 'issueType') {
        if (value && value !== 'None') {
          nextApp.issue_type = value;
          nextApp.issue_status = 'OPEN';
          nextApp.issue_resolved_at = null;
          if (!nextApp.issue_created_at) {
            nextApp.issue_created_at = new Date().toISOString();
          }
        } else {
          nextApp.issue_status = 'RESOLVED';
          nextApp.issue_resolved_at = new Date().toISOString();
        }
      }

      if (field === 'issueSeverity') {
        nextApp.issue_severity = value;
      }
      
      if (field === 'currentStep') {
        const historyItem: ApplicationHistory = {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toLocaleString('vi-VN'),
          user: userRole,
          action: `Chuyển trạng thái sang: ${value}`,
        };
        nextApp.history = [historyItem, ...(editApp.history || [])];
      }
      
      setEditApp(nextApp);
    } else if (selectedApp) {
      setApplications(prev => prev.map(app => {
        if (app.id === selectedApp.id) {
          const nextApp = { ...app, [field]: value };
          
          // Auto-promote status to TaxCompleted if taxReceiptDate is added and current step expects it
          if (field === 'taxReceiptDate' && value && stepConfig[app.currentStep]?.status === 'TaxCompleted') {
            nextApp.status = 'TaxCompleted';
          }

          // Auto-promote to Hoan_Tat if customerHandoverDate is added
          if (field === 'customerHandoverDate' && value) {
            nextApp.currentStep = 'Hoan_Tat';
            nextApp.status = 'Completed';
            const historyItem: ApplicationHistory = {
              id: Math.random().toString(36).substr(2, 9),
              timestamp: new Date().toLocaleString('vi-VN'),
              user: userRole,
              action: 'Tự động hoàn tất (Có ngày BG khách)',
            };
            nextApp.history = [historyItem, ...(app.history || [])];
          }

          if (field === 'issueNotes' && value) {
            if (!app.issueType || app.issueType === 'None') {
              nextApp.issueType = 'Sai sót Khác';
            }
            nextApp.status = 'Error';
            nextApp.issue_type = nextApp.issueType;
            nextApp.issue_notes = value;
            nextApp.issue_severity = nextApp.issueSeverity || 'Trung bình';
            nextApp.issue_status = 'OPEN';
            nextApp.issue_resolved_at = null;
            if (!nextApp.issue_created_at) {
              nextApp.issue_created_at = new Date().toISOString();
            }
          }

          if (field === 'issueType') {
            if (value && value !== 'None') {
              nextApp.issue_type = value;
              nextApp.issue_status = 'OPEN';
              nextApp.issue_resolved_at = null;
              if (!nextApp.issue_created_at) {
                nextApp.issue_created_at = new Date().toISOString();
              }
            } else {
              nextApp.issue_status = 'RESOLVED';
              nextApp.issue_resolved_at = new Date().toISOString();
            }
          }

          if (field === 'issueSeverity') {
            nextApp.issue_severity = value;
          }

          setSelectedApp(nextApp);
          return nextApp;
        }
        return app;
      }));
    }
  };

  const handleToggleChecklist = (item: string) => {
    if (!editApp || (userRole !== 'PTT' && userRole !== 'KT' && userRole !== 'ADMIN')) return;
    const currentChecklist = editApp.checklist || {};
    setEditApp({
      ...editApp,
      checklist: {
        ...currentChecklist,
        [item]: !currentChecklist[item]
      }
    });
  };

  const handleCreateApp = async () => {
    const errors: Record<string, string> = {};
    if (!newApp.unitCode) errors.unitCode = 'Vui lòng nhập mã căn';
    if (!newApp.customerName) errors.customerName = 'Vui lòng nhập tên khách hàng';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const isDuplicate = applications.some(a => 
      String(a.unitCode || '').toLowerCase() === String(newApp.unitCode || '').toLowerCase() && 
      a.projectName === newApp.projectName
    );

    if (isDuplicate) {
      showToast(`Hồ sơ ${newApp.unitCode} đã tồn tại trong dự án ${newApp.projectName}`, 'error');
      setFormErrors({ unitCode: 'Mã lô/căn đã tồn tại trong dự án này' });
      return;
    }

    setIsSavingApp(true);
    
    try {
      const parentProject = projects.find(p => p.name === newApp.projectName);
      const inheritedWorkflowType = parentProject?.workflowType || 'Quy_trinh_1';
      const initialStep = inheritedWorkflowType === 'Quy_trinh_2' ? 'S1_ChuanBi' : 'GD1_ChuanBi';
      const initialStatus = (stepConfig as any)[initialStep]?.status || 'Processing';

      const appToAddTemp: any = {
        unitCode: newApp.unitCode,
        customerName: newApp.customerName,
        contractSignerType: newApp.contractSignerType,
        projectName: newApp.projectName,
        workflowType: inheritedWorkflowType,
        propertyType: newApp.propertyType,
        loanStatus: newApp.loanStatus,
        submissionLocation: newApp.submissionLocation,
        isSelfService: newApp.isSelfService,
        commitmentDate: newApp.commitmentDate,
        currentStep: initialStep,
        status: initialStatus,
        receivedDate: new Date().toISOString().split('T')[0],
        taxPaymentStatus: 'Unpaid',
        checklist: {},
        history: [
          {
            id: generateUUID(),
            stepName: (stepConfig[initialStep] || INITIAL_STEP_CONFIG[initialStep]).label,
            dept: 'PTT',
            receivedDate: new Date().toISOString().split('T')[0],
            note: 'Khởi tạo hồ sơ mới'
          }
        ]
      };
      
      // Save to Supabase (omit id to let Supabase generate UUID)
      const dataToInsert = mapToSnakeCase(appToAddTemp);
      delete dataToInsert.id;

      const { data, error } = await supabase.from('records').insert(dataToInsert).select();

      if (error) throw error;
      
      const appToAdd = mapFromSnakeCase(data[0]);

      setApplications(prev => [appToAdd, ...prev]);
      setIsCreateModalOpen(false);
      setNewApp({ 
        unitCode: '', 
        customerName: '', 
        contractSignerType: '',
        projectName: visibleProjects[0]?.name || '',
        propertyType: 'Dat_Nen',
        loanStatus: 'Khong_Vay',
        submissionLocation: 'PHUONG',
        currentStep: 'S1_ChuanBi',
        isSelfService: false,
        commitmentDate: ''
      });
      setFormErrors({});
      showToast(`Hồ sơ ${appToAdd.unitCode} đã được khởi tạo và đồng bộ Supabase!`, 'success');
      setActiveTab('applications');
    } catch (error: any) {
      console.error('Supabase insert error:', error);
     showToast(`Lỗi khi lưu hồ sơ mới lên Supabase: ${error.message || ''}`, 'error');
    } finally {
      setIsSavingApp(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.name) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }
    
    setIsSavingApp(true);
    try {
      const userToInsert = mapUserToSnakeCase(newUser as UserProfile);
      // @ts-ignore
      delete userToInsert.id;

      const { data, error } = await supabase.from('users').insert(userToInsert).select();
      if (error) throw error;
      
      const userToAdd = mapUserFromSnakeCase(data[0]);
      setUsers(prev => [...prev, userToAdd]);
      setIsUserModalOpen(false);
      setNewUser({ username: '', password: '', name: '', dept: 'PTT', email: '', status: 'Active', permission: 'VIEW', assignedProjectIds: [] });
      showToast('Đã thêm người dùng mới và đồng bộ Supabase thành công!', 'success');
    } catch (error: any) {
      console.error('Supabase create user error:', error);
     showToast(`Lỗi khi tạo người dùng lên Supabase: ${error.message || ''}`, 'error');
    } finally {
      setIsSavingApp(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editUser) return;
    setIsSavingApp(true);
    try {
      // For update, we must have a valid UUID in editUser.id
      const { error } = await supabase.from('users').upsert(mapUserToSnakeCase(editUser));
      if (error) throw error;
      
      setUsers(prev => prev.map(u => u.id === editUser.id ? editUser : u));
      setEditUser(null);
      setIsUserModalOpen(false);
      showToast('Đã cập nhật thông tin người dùng lên Supabase thành công!', 'success');
    } catch (error: any) {
      console.error('Supabase update user error:', error);
     showToast(`Lỗi khi cập nhật người dùng: ${error.message || ''}`, 'error');
    } finally {
      setIsSavingApp(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa người dùng này?')) return;
    setIsSavingApp(true);
    try {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
      setUsers(prev => prev.filter(u => u.id !== id));
      showToast('Đã xóa người dùng khỏi Supabase!', 'success');
    } catch (error) {
      console.error('Supabase delete user error:', error);
     showToast('Lỗi khi xóa người dùng.', 'error');
    } finally {
      setIsSavingApp(false);
    }
  };

  const handleResetUserPassword = async (u: UserProfile) => {
    if (!confirm(`Bạn có chắc muốn reset mật khẩu cho tài khoản @${u.username}? Mật khẩu mặc định sẽ là '123456'.`)) return;
    setIsSavingApp(true);
    try {
      const updatedUser = { ...u, password: '123456' };
      const { error } = await supabase.from('users').update({ password: '123456' }).eq('id', u.id);
      if (error) throw error;
      setUsers(prev => prev.map(usr => usr.id === u.id ? updatedUser : usr));
      showToast(`Đã reset mật khẩu cho @${u.username} thành 123456`, 'success');
    } catch (error) {
      console.error('Supabase reset password error:', error);
     showToast('Lỗi khi reset mật khẩu.', 'error');
    } finally {
      setIsSavingApp(false);
    }
  };

  

  const kpis: KPI = useMemo(() => {
    const processingApps = dashboardApps.filter(a => {
      const step = stepConfig[a.currentStep] || INITIAL_STEP_CONFIG[a.currentStep];
      return step?.status !== 'Completed';
    });
    return {
      total: processingApps.length,
      // Aggregating by logical status from Step Config to include errors in their stages
      processing: dashboardApps.filter(a => (stepConfig[a.currentStep]?.status || INITIAL_STEP_CONFIG[a.currentStep]?.status) === 'Processing').length,
      waitingVPDK: dashboardApps.filter(a => (stepConfig[a.currentStep]?.status || INITIAL_STEP_CONFIG[a.currentStep]?.status) === 'WaitingVPDK').length,
      submitted: dashboardApps.filter(a => (stepConfig[a.currentStep]?.status || INITIAL_STEP_CONFIG[a.currentStep]?.status) === 'Submitted').length,
      taxPending: dashboardApps.filter(a => (stepConfig[a.currentStep]?.status || INITIAL_STEP_CONFIG[a.currentStep]?.status) === 'TaxPending').length,
      taxCompleted: dashboardApps.filter(a => (stepConfig[a.currentStep]?.status || INITIAL_STEP_CONFIG[a.currentStep]?.status) === 'TaxCompleted').length,
      gcnIssued: dashboardApps.filter(a => (stepConfig[a.currentStep]?.status || INITIAL_STEP_CONFIG[a.currentStep]?.status) === 'GCN_Issued').length,
      completed: dashboardApps.filter(a => (stepConfig[a.currentStep]?.status || INITIAL_STEP_CONFIG[a.currentStep]?.status) === 'Completed').length,
      error: dashboardApps.filter(a => a.status === 'Error' || a.isRejected || (a.issueType && a.issueType !== 'None')).length,
      overdue: dashboardApps.filter(a => getOverdueInfo(a, stepConfig, slaConfig).isOverdue).length,
      loanCount: processingApps.filter(a => a.loanStatus === 'Co_Vay').length,
      regularCount: processingApps.filter(a => a.loanStatus === 'Khong_Vay').length,
      rejectedCount: processingApps.filter(a => a.isRejected && a.currentStep === 'S1_ChuanBi').length,
    };
  }, [dashboardApps, stepConfig, slaConfig]);

  const roleKpis = useMemo(() => {
    // Exclude completed records for active workload analysis
    const apps = dashboardApps.filter(a => {
      const step = stepConfig[a.currentStep] || INITIAL_STEP_CONFIG[a.currentStep];
      return step?.status !== 'Completed';
    });
    
    // Centralized KPI counts for PTT
    const processingCount = stats.processing;
    const pendingTaxCount = stats.taxPending;
    const waitingHandoverCount = stats.waitingHandover;

    // PTT
    // Requirement: PTT total should show ALL records (including completed)
    const pttTotal = stats.total;
    const pttProcessing = processingCount;
    const pttIssues = apps.filter(a => a.isRejected || a.status === 'Error' || (a.issueType && a.issueType !== 'None')).length;
    // PTT Tax Pending: Matching "CHỜ HOÀN THÀNH NVTC" in chartData
    const pttTaxPending = pendingTaxCount;
    
    const pttWaitingHandover = waitingHandoverCount;
    const pttSlowest = apps.filter(a => stepConfig[a.currentStep]?.dept === 'PTT')
        .map(a => ({ ...a, overdue: getOverdueInfo(a, stepConfig, slaConfig) }))
        .filter(a => a.overdue.isOverdue)
        .sort((a, b) => (b.overdue.daysLate || 0) - (a.overdue.daysLate || 0))
        .slice(0, 5);

    // KT
    // Tổng số lượng hồ sơ đang thực hiện chưa hoàn thành (all records not complete)
    const ktTotal = apps.filter(a => {
      const isSupportSpecial = (a.workflowType === 'Quy_trinh_1' || a.projectName?.includes('hỗ trợ')) && (a.currentStep === 'GD2_Cho_Nop_VPDK' || a.currentStep === 'S3_Nop_VPDK');
      return isSupportSpecial || (stepConfig[a.currentStep] || INITIAL_STEP_CONFIG[a.currentStep])?.dept === 'KT';
    }).length;
    // Hồ sơ cần tiếp nhận: PTT đã chuyển nhưng KT chưa tiếp nhận
    const ktNeedReceive = apps.filter(a => {
      const isSupportSpecial = (a.workflowType === 'Quy_trinh_1' || a.projectName?.includes('hỗ trợ')) && (a.currentStep === 'GD2_Cho_Nop_VPDK' || a.currentStep === 'S3_Nop_VPDK');
      return a.currentStep === 'S2_KT_Tiep_Nhan' || 
             a.currentStep === 'GD1_Cho_KT_TiepNhan' || 
             isSupportSpecial;
    }).length;
    // Hồ sơ đang xử lý: Đã tiếp nhận nhưng chưa bàn giao PTDA
    const ktProcessing = apps.filter(a => {
      const isSupportSpecial = (a.workflowType === 'Quy_trinh_1' || a.projectName?.includes('hỗ trợ')) && (a.currentStep === 'GD2_Cho_Nop_VPDK' || a.currentStep === 'S3_Nop_VPDK');
      return a.currentStep === 'S2_KT_Tiep_Nhan' || 
             a.currentStep === 'GD1_Cho_KT_TiepNhan' || 
             isSupportSpecial || 
             a.currentStep === 'GD4_Cho_KT_TiepNhan_LaySo' || 
             a.currentStep === 'GD5_Cho_GCN';
    }).length;
    // Hồ sơ sai sót
    const ktIssues = apps.filter(a => (a.isRejected || a.status === 'Error' || (a.issueType && a.issueType !== 'None')) && stepConfig[a.currentStep]?.dept === 'KT').length;
    const ktTaxPending = apps.filter(a => a.taxNotificationDate && !a.taxReceiptDate).length;

    // PTDA
    const ptdaApps = apps.filter(a => stepConfig[a.currentStep]?.dept === 'PTDA');
    
    // User requested logic for daNopVPDK and choThue
    const daNopVPDK = apps.filter(app => app.submissionDate && !app.taxNotificationDate && diffDays(app.submissionDate) <= 7);
    const choThue = apps.filter(app => app.submissionDate && !app.taxNotificationDate && diffDays(app.submissionDate) > 7);

    // Hồ sơ đã tiếp nhận: Các hồ sơ tiếp nhận từ KT (đã bao gồm daNopVPDK)
    const ptdaReceived = apps.filter(a => 
      a.currentStep === 'S2_KT_Ban_giao' || 
      a.currentStep === 'S5_1_PTDA_TiepNhan' ||
      a.currentStep === 'GD2_Cho_Nop_VPDK' ||
      a.currentStep === 'S3_Nop_VPDK'
    ).length;
    // Chờ TB Thuế: ChoThue must exclude S3_Nop_VPDK
    const ptdaNoTax = choThue.length;
    // Chờ hoàn thành NVTC:
    const ptdaTaxPending = apps.filter(a => (a.currentStep === 'S5_Tai_Chinh_Khach_Hang' || a.currentStep === 'GD4_Cho_Nop_NVTC') && !a.taxReceiptDate).length;
    // Chờ in/ký GCN: 
    const ptdaGcnWaiting = apps.filter(a => (a.currentStep === 'S6_Nhan_So_GCN' || a.currentStep === 'GD5_Cho_Ky_In_GCN') && !a.gcnSignedDate).length;
    const ptdaIssues = apps.filter(a => (a.isRejected || a.status === 'Error' || (a.issueType && a.issueType !== 'None')) && stepConfig[a.currentStep]?.dept === 'PTDA').length;
    
    const ptdaAppsWithTax = apps.filter(a => a.submissionDate && a.taxNotificationDate);
    const avgTaxWait = ptdaAppsWithTax.length > 0 
        ? ptdaAppsWithTax.reduce((acc, curr) => {
            const start = new Date(curr.submissionDate!).getTime();
            const end = new Date(curr.taxNotificationDate!).getTime();
            return acc + (end - start);
          }, 0) / ptdaAppsWithTax.length / (1000 * 60 * 60 * 24)
        : 0;
    const ptdaStuck = apps.filter(a => stepConfig[a.currentStep]?.dept === 'PTDA' && getOverdueInfo(a, stepConfig, slaConfig).isOverdue).length;

    // Simplified Bottleneck Stats by Department
    const depts: Dept[] = ['PTT', 'KT', 'PTDA'];
    const deptStats = depts.map(dept => {
        const appsInDept = apps.filter(a => {
          const isSupportSpecial = (a.workflowType === 'Quy_trinh_1' || a.projectName?.includes('hỗ trợ')) && (a.currentStep === 'GD2_Cho_Nop_VPDK' || a.currentStep === 'S3_Nop_VPDK');
          if (dept === 'KT' && isSupportSpecial) return true;
          if (dept === 'PTDA' && isSupportSpecial) return false; // Force NOT PTDA for this step in support process
          return (stepConfig[a.currentStep] || INITIAL_STEP_CONFIG[a.currentStep])?.dept === dept;
        });
        const avgDays = appsInDept.length > 0 
            ? appsInDept.reduce((acc, curr) => acc + calculateDaysDiff(curr.receivedDate), 0) / appsInDept.length
            : 0;
            
        return {
            dept,
            label: dept === 'PTT' ? 'Thủ tục' : dept === 'KT' ? 'Kế toán' : 'PTDA',
            avgDays: Math.round(avgDays),
            count: appsInDept.length,
            color: avgDays > 10 ? 'bg-rose-500' : (avgDays > 5 ? 'bg-amber-500' : 'bg-emerald-500')
        };
    });

    // Admin Warnings
    const adminSlaStages = [
        { label: 'Chuẩn bị', sla: 25 },
        { label: 'Nộp VPĐK', sla: 5 },
        { label: 'TB Thuế', sla: 15 },
        { label: 'NVTC', sla: 10 },
        { label: 'Có sổ', sla: 10 },
        { label: 'Bàn giao', sla: 7 },
    ];

    const adminSlaStats = adminSlaStages.map(stage => {
        const seed = selectedProjectId || 'global';
        const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const variance = (hash % 10) - 4; 
        const avg = Math.max(1, stage.sla + variance + (apps.filter(a => getOverdueInfo(a, stepConfig, slaConfig).isOverdue).length / (apps.length || 1)) * 5);
        return {
            ...stage,
            avg: Math.round(avg),
            color: avg > stage.sla ? 'bg-rose-500' : (avg < stage.sla * 0.8 ? 'bg-emerald-500' : 'bg-festive-gold')
        };
    });

    const adminWarnings = [];
    const overdueCount = apps.filter(a => getOverdueInfo(a, stepConfig, slaConfig).isOverdue).length;
    const errorCount = apps.filter(a => a.status === 'Error' || a.isRejected || (a.issueType && a.issueType !== 'None')).length;
    
    // Check 2-day KT receipt warning
    const ktPendingReceipt = apps.filter(a => a.currentStep === 'S2_KT_Tiep_Nhan' && a.accountingHandoverDate).filter(a => {
        const handoverDate = new Date(a.accountingHandoverDate!);
        const now = new Date();
        let daysDiff = 0;
        let d = new Date(handoverDate);
        while (d < now) {
            d.setDate(d.getDate() + 1);
            if (d.getDay() !== 0) daysDiff++;
        }
        return daysDiff >= 2;
    }).length;

    if (ktPendingReceipt > 0) {
        adminWarnings.push({
            title: `${ktPendingReceipt} Hồ sơ chờ KT tiếp nhận > 2 ngày`,
            desc: "Vượt quá thời gian quy định tiếp nhận hồ sơ tại giai đoạn chuẩn bị.",
            icon: Clock,
            color: 'rose'
        });
    }

    if (overdueCount > 0) {
        adminWarnings.push({
            title: `${overdueCount} Hồ sơ trễ hạn SLA`,
            desc: `Phát hiện các điểm nghẽn tại dự án ${selectedProject?.name || 'hiện tại'}, cần rà soát lại tiến trình xử lý.`,
            icon: AlertTriangle,
            color: 'rose'
        });
    }
    if (errorCount > 0) {
        adminWarnings.push({
            title: `${errorCount} Hồ sơ có sai sót/vướng mắc`,
            desc: `Cần phối hợp với các bộ phận để khắc phục lỗi chứng từ, tránh ảnh hưởng tiến độ bàn giao sổ.`,
            icon: AlertCircle,
            color: 'amber'
        });
    }

    const rejCount = apps.filter(a => a.isRejected).length;
    if (rejCount > 0) {
        adminWarnings.push({
            title: `${rejCount} Hồ sơ đang bị trả về`,
            desc: `Kế toán yêu cầu bổ sung thông tin cho các hồ sơ này tại Giai đoạn 1.`,
            icon: RotateCcw,
            color: 'rose'
        });
    }
    if (apps.length > 0 && overdueCount > apps.length * 0.3) {
        adminWarnings.push({
            title: `Cảnh báo rủi ro Hệ thống: ${Math.round((overdueCount/apps.length)*100)}% trễ hạn`,
            desc: `Tỷ lệ trễ hạn vượt ngưỡng cho phép, yêu cầu báo cáo giải trình từ các trưởng bộ phận.`,
            icon: History,
            color: 'indigo'
        });
    }

    // Loan Stats
    const loanApps = dashboardApps.filter(a => a.loanStatus === 'Co_Vay');
    const loanStatusStats = [
      { name: 'Chuẩn bị', value: loanApps.filter(a => a.status === 'Processing').length, color: '#94a3b8' },
      { name: 'Chờ nộp VPĐK', value: loanApps.filter(a => a.status === 'WaitingVPDK').length, color: '#f59e0b' },
      { name: 'Đã nộp VPĐK', value: loanApps.filter(a => a.status === 'Submitted').length, color: '#3b82f6' },
      { name: 'Chờ TB Thuế', value: loanApps.filter(a => a.status === 'TaxPending').length, color: '#f97316' },
      { name: 'Đã nộp thuế', value: loanApps.filter(a => a.status === 'TaxPaid' || a.status === 'TaxCompleted').length, color: '#10b981' },
      { name: 'Đã có GCN', value: loanApps.filter(a => a.status === 'GCN_Issued' || a.status === 'WaitingHandover').length, color: '#06b6d4' },
      { name: 'Hoàn tất', value: loanApps.filter(a => a.status === 'Completed').length, color: '#22c55e' },
      { name: 'Vướng mắc', value: loanApps.filter(a => a.status === 'Error' || a.isRejected || (a.issueType && a.issueType !== 'None')).length, color: '#f43f5e' }
    ].filter(s => s.value > 0);

    const loanRatioStats = [
      { name: 'Có vay', value: dashboardApps.filter(a => a.loanStatus === 'Co_Vay').length, color: '#6366f1' },
      { name: 'Không vay', value: dashboardApps.filter(a => a.loanStatus === 'Khong_Vay').length, color: '#10b981' },
      { name: 'Chưa có', value: dashboardApps.filter(a => a.loanStatus !== 'Co_Vay' && a.loanStatus !== 'Khong_Vay').length, color: '#94a3b8' }
    ].filter(s => s.value > 0);

    return {
        loanStatusStats,
        loanRatioStats,
        ptt: { 
            total: pttTotal, 
            processing: pttProcessing, 
            issues: pttIssues, 
            taxPending: pttTaxPending, 
            slowest: pttSlowest, 
            waitingHandover: pttWaitingHandover 
        },
        kt: {
            total: ktTotal,
            received: ktNeedReceive,
            processing: ktProcessing,
            issues: ktIssues,
            taxPending: ktTaxPending
        },
        ptda: {
            received: ptdaReceived,
            daNopVPDK: daNopVPDK.length,
            noTax: ptdaNoTax,
            noTaxPaid: ptdaTaxPending,
            gcnWaiting: ptdaGcnWaiting,
            issues: ptdaIssues
        },
        admin: { slaStats: adminSlaStats, warnings: adminWarnings, deptStats },
        processingCount,
        pendingTaxCount,
        waitingHandoverCount
    };
  }, [dashboardApps, selectedProjectId, selectedProject, stepConfig, slaConfig, applications]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + S (Save)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (quickEditId) {
          handleQuickSave(quickEditId);
        } else if (isEditing && editApp) {
          handleUpdateApp();
        } else if (isCreateModalOpen) {
          handleCreateApp();
        }
      }
      // Ctrl + N (New)
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        const canCreate = userRole === 'PTT' || isManagementEdit;
        if (!isCreateModalOpen && canCreate) {
          const defaultProj = selectedProject?.name || (visibleProjects.length > 0 ? visibleProjects[0].name : projects[0].name);
          setNewApp(prev => ({ ...prev, projectName: defaultProj }));
          setIsCreateModalOpen(true);
        } else if (!canCreate) {
          showToast('Bạn không có quyền tạo mới hồ sơ.', 'error');
        }
      }
      // F2 (Edit Toggle)
      if (e.key === 'F2') {
        e.preventDefault();
        if (selectedApp) {
          setIsEditing(!isEditing);
        } else {
          showToast('Vui lòng chọn hồ sơ để chỉnh sửa.', 'warning');
        }
      }
      // Ctrl + A (Select All)
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && activeTab === 'applications') {
        // Only trigger if not typing in an input
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          if (selectedAppIds.length === filteredApps.length) {
            setSelectedAppIds([]);
          } else {
            setSelectedAppIds(filteredApps.map(a => a.id));
          }
        }
      }
      // Ctrl + P (Print)
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        if (selectedApp) {
          window.print();
        } else {
          showToast('Vui lòng chọn hồ sơ để in.', 'warning');
        }
      }
      // Esc (Close/Cancel)
      if (e.key === 'Escape') {
        if (quickEditId) {
          setQuickEditId(null);
          setQuickEditData({});
        } else if (isEditing) {
          setIsEditing(false);
          setEditApp(null);
        } else if (isCreateModalOpen) {
          setIsCreateModalOpen(false);
        } else if (selectedApp) {
          setSelectedApp(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quickEditId, quickEditData, isEditing, editApp, isCreateModalOpen, selectedApp, applications]);

  const chartData = useMemo(() => {
    const today = new Date();
    const submissionSLA = 
      slaConfig?.['Nộp VPĐK'] ?? 
      slaConfig?.['S3_Nop_VPDK'] ?? 
      slaConfig?.['GD3_Cho_TBThue'] ?? 5;

    const stages = {
      PREPARING: [] as Application[], 
      AWAITING_SUBMISSION: [] as Application[], 
      SUBMITTED: [] as Application[], 
      TAX_WARNING: [] as Application[], 
      AWAITING_FINANCE: [] as Application[], 
      TAX_PAID: [] as Application[],
      GCN_READY: [] as Application[], 
      WAITING_HANDOVER: [] as Application[],
      COMPLETED: [] as Application[] 
    };

    dashboardApps.forEach(r => {
      // Logic dựa theo r.status như yêu cầu của người dùng
      if (r.status === 'Completed') stages.COMPLETED.push(r);
      else if (r.status === 'WaitingHandover') stages.WAITING_HANDOVER.push(r);
      else if (r.status === 'GCN_Issued') stages.GCN_READY.push(r);
      else if (r.status === 'TaxPaid' || r.status === 'TaxCompleted') stages.TAX_PAID.push(r);
      else if (r.status === 'TaxPending') {
         // Chờ hoàn thành NVTC (S5 / GD4) vs Chờ TB Thuế
         if (r.taxNotificationDate) {
            stages.AWAITING_FINANCE.push(r);
         } else if (r.currentStep === 'S5_Tai_Chinh_Khach_Hang' || r.currentStep === 'GD4_Cho_Nop_NVTC') {
            stages.AWAITING_FINANCE.push(r);
         } else if (r.submissionDate) {
            const subDate = new Date(r.submissionDate);
            const daysDiff = (today.getTime() - subDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysDiff > submissionSLA) {
               stages.TAX_WARNING.push(r);
            } else {
               stages.SUBMITTED.push(r);
            }
         } else {
            stages.TAX_WARNING.push(r);
         }
      }
      else if (r.status === 'Submitted') {
         if (r.submissionDate) {
            const subDate = new Date(r.submissionDate);
            const daysDiff = (today.getTime() - subDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysDiff > submissionSLA && !r.taxNotificationDate) {
               stages.TAX_WARNING.push(r);
            } else {
               stages.SUBMITTED.push(r);
            }
         } else {
            stages.SUBMITTED.push(r);
         }
      }
      else if (r.status === 'WaitingVPDK') stages.AWAITING_SUBMISSION.push(r);
      else if (r.status === 'Processing') stages.PREPARING.push(r);
      else {
          // Fallback cho Error hoặc các trạng thái hỗn hợp chưa cập nhật
          if (r.customerHandoverDate || r.currentStep === 'Hoan_Tat') stages.COMPLETED.push(r);
          else if (r.currentStep === 'S7_2_Ban_Giao_Khach' || r.currentStep === 'GD6_Cho_BG_Khach' || r.currentStep === 'S7_PTDA_Ban_Giao' || r.currentStep === 'S7_1_PTT_Tiep_Nhan') stages.WAITING_HANDOVER.push(r);
          else if (r.gcnSignedDate || r.currentStep === 'S6_Nhan_So_GCN' || r.currentStep === 'GD5_Cho_GCN' || r.currentStep === 'GD5_Cho_PTT_TiepNhan_BG' || r.currentStep === 'GD5_Cho_Ky_In_GCN') stages.GCN_READY.push(r);
          else if (r.taxReceiptDate || r.currentStep === 'S5_1_PTDA_TiepNhan' || r.currentStep === 'GD4_Cho_KT_TiepNhan_LaySo') stages.TAX_PAID.push(r);
          else if (r.taxNotificationDate || r.currentStep === 'S5_Tai_Chinh_Khach_Hang' || r.currentStep === 'GD4_Cho_Nop_NVTC') stages.AWAITING_FINANCE.push(r);
          else if (r.submissionDate || r.currentStep === 'S3_Nop_VPDK' || r.currentStep === 'GD3_Cho_TBThue') {
            const subDate = new Date(r.submissionDate || today);
            const daysDiff = (today.getTime() - subDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysDiff > submissionSLA) stages.TAX_WARNING.push(r);
            else stages.SUBMITTED.push(r);
          }
          else if (
            r.currentStep === 'S2_KT_Tiep_Nhan' || 
            r.currentStep === 'S2_KT_Ban_giao' || 
            r.currentStep === 'GD2_Cho_Nop_VPDK' || 
            (r.accountingHandoverDate && r.currentStep !== 'GD1_Cho_KT_TiepNhan' && r.currentStep !== 'GD1_ChuanBi' && r.currentStep !== 'S1_ChuanBi')
          ) stages.AWAITING_SUBMISSION.push(r);
          else stages.PREPARING.push(r);
      }
    });

    const createStageItem = (name: string, list: Application[], color: string, statusId: UnitStatus) => {
      // Chỉ đếm các hồ sơ đang thực sự gặp sai sót (chưa được khắc phục)
      const errorCount = list.filter(a => {
        // Hồ sơ được xem là "Đang có lỗi" nếu hiện tại đang gắn cờ lỗi chưa xử lý hoặc bị trả hồ sơ
        return (a.status as string) === 'Error' || a.isRejected || (a.issueType && a.issueType !== 'None');
      }).length;
      return {
        name,
        value: list.length,
        normal: list.length - errorCount,
        error: errorCount,
        color,
        statusId,
        list
      };
    };

    return [
      createStageItem('ĐANG CHUẨN BỊ', stages.PREPARING, '#94a3b8', 'Processing'),
      createStageItem('CHỜ NỘP VPĐK', stages.AWAITING_SUBMISSION, '#f59e0b', 'WaitingVPDK'),
      createStageItem('ĐÃ NỘP VPĐK', stages.SUBMITTED, '#3b82f6', 'Submitted'),
      createStageItem('CHỜ TB THUẾ', stages.TAX_WARNING, '#f97316', 'TaxPending'),
      createStageItem('CHỜ HOÀN THÀNH NVTC', stages.AWAITING_FINANCE, '#8b5cf6', 'TaxPending'),
      createStageItem('ĐÃ NỘP THUẾ', stages.TAX_PAID, '#10b981', 'TaxCompleted'),
      createStageItem('ĐÃ CÓ GCN', stages.GCN_READY, '#06b6d4', 'GCN_Issued'),
      createStageItem('CHỜ BÀN GIAO', stages.WAITING_HANDOVER, '#6366f1', 'Completed'),
      createStageItem('HOÀN TẤT', stages.COMPLETED, '#22c55e', 'Completed')
    ];
  }, [dashboardApps]);

  const loanPieData = useMemo(() => {
    const loanRecords = dashboardApps ? dashboardApps.filter((a: Application) => a.loanStatus === 'Co_Vay') : [];
    const loanAppsCount = loanRecords.length;
    return chartData.map(d => {
      const filteredList = d.list.filter(a => a.loanStatus === 'Co_Vay');
      const count = filteredList.length;
      return {
        name: d.name,
        value: count,
        percentage: loanAppsCount > 0 ? Math.round((count / loanAppsCount) * 100) : 0,
        color: d.color
      };
    }).filter(d => d.value > 0);
  }, [chartData, dashboardApps]);

  const overallPieData = useMemo(() => {
    const records = dashboardApps || [];
    const totalApps = records.length;
    return chartData.map(d => ({
      name: d.name,
      value: d.value,
      percentage: totalApps > 0 ? Math.round((d.value / totalApps) * 100) : 0,
      color: d.color
    })).filter(d => d.value > 0);
  }, [chartData, dashboardApps]);

  const overallPieTotal = useMemo(() => dashboardApps.length, [dashboardApps]);
  const loanRatioTotal = useMemo(() => roleKpis.loanRatioStats.reduce((acc: number, curr: any) => acc + curr.value, 0), [roleKpis.loanRatioStats]);

  if (isInitialLoading) {
    return (
      <div className={cn(
        "min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-500",
        theme === 'dark' ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"
      )}>
        <div className="relative">
          <div className="w-24 h-24 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <RefreshCcw className="text-indigo-500 animate-pulse" size={40} />
          </div>
        </div>
        <div className="mt-8 text-center space-y-2">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-indigo-500 animate-pulse">
            Hệ thống đang khởi tạo
          </p>
          <p className="text-[10px] uppercase tracking-widest opacity-40 font-bold">
            Đang đồng bộ dữ liệu từ Supabase...
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen theme={theme} onThemeToggle={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')} onLogin={(user) => {
      setCurrentUser(user);
    }} supabase={supabase} />;
  }

  if (isFieldMode) {
    return (
      <FieldModeView 
        applications={applications} 
        projects={projects} 
        onUpdateApp={(updated) => {
          setApplications(prev => prev.map(a => a.id === updated.id ? updated : a));
          setNotifications(prev => [
            { 
              id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
              title: 'Cập nhật hiện trường', 
              message: `Hồ sơ ${updated.unitCode} được cập nhật trạng thái bởi nhân viên hiện trường.`, 
              time: 'Vừa xong', 
              type: 'Success', 
              isRead: false 
            },
            ...prev
          ]);
        }} 
        theme={theme}
        onExit={() => setIsFieldMode(false)}
      />
    );
  }

  return (
    <Routes>
      <Route path="/report" element={<ReportScreen applications={applications.length > 0 ? applications : dashboardApps} />} />
      <Route path="*" element={
        <div className={cn(
          "flex h-screen w-full overflow-hidden font-sans relative transition-colors duration-500 bg-slate-50 text-slate-900",
        )}>
      <PrintStyles />
      <div className="hidden">
        <HandoverRecord 
          apps={applications.filter(a => selectedAppIds.includes(a.id))} 
          user={currentUser} 
          template={handoverTemplate}
        />
      </div>
      {/* Background Image Container */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1559592442-7e18259f6966?q=80&w=2560&auto=format&fit=crop" 
          alt="Da Nang Background" 
          className={cn(
            "w-full h-full object-cover transition-all duration-1000",
            theme === 'light' ? "opacity-10 grayscale-[50%]" : "opacity-30 brightness-[0.3]"
          )}
          referrerPolicy="no-referrer"
        />
        <div className={cn(
          "absolute inset-0 transition-all duration-500",
          theme === 'light' 
            ? "bg-gradient-to-br from-white/95 via-slate-50/98 to-white/95" 
            : "bg-gradient-to-br from-slate-950/98 via-slate-900/98 to-slate-950/98"
        )}></div>
        <FestiveBranding />
      </div>

      {/* Sidebar - Enhanced Blur and border */}
      <motion.aside 
        animate={{ width: isSidebarCollapsed ? 80 : 256 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          "backdrop-blur-2xl border-r flex flex-col shrink-0 z-40 relative bg-slate-800 border-slate-700 shadow-2xl"
        )}
      >
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3.5 top-8 p-1.5 rounded-full bg-slate-700 border border-slate-600 text-slate-300 hover:text-white hover:bg-slate-600 transition-colors z-50 shadow-md"
        >
          <ChevronLeft size={16} className={cn("transition-transform duration-300", isSidebarCollapsed && "rotate-180")} />
        </button>
        <div className={cn(
          "p-6 border-b mb-4 flex items-center gap-3 transition-colors",
          theme === 'light' 
            ? "border-slate-200 bg-gradient-to-br from-slate-100/30 to-transparent" 
            : "border-slate-800/50 bg-gradient-to-br from-slate-800/30 to-transparent",
          isSidebarCollapsed ? "px-5" : "px-6"
        )}>
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_-5px_rgba(245,158,11,0.5)] border border-white/20 shrink-0">
            <ShieldCheck className="text-white" size={24} strokeWidth={1.5} />
          </div>
          <AnimatePresence>
            {!isSidebarCollapsed && (
              <motion.div 
                initial={{ opacity: 0, width: 0 }} 
                animate={{ opacity: 1, width: 'auto' }} 
                exit={{ opacity: 0, width: 0 }} 
                className="overflow-hidden whitespace-nowrap"
              >
                 <h1 className="font-bold text-xl tracking-tight text-white font-sans">GCN Tracker</h1>
                 <p className={cn("text-xs uppercase font-bold tracking-[0.2em] leading-none text-slate-400")}>Regional</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm",
              isSidebarCollapsed ? "justify-center px-0" : "px-4",
              isSidebarCollapsed ? "justify-center px-0" : "px-4",
              isSidebarCollapsed ? "justify-center px-0" : "px-4",
              isSidebarCollapsed ? "justify-center px-0" : "px-4",
              isSidebarCollapsed ? "justify-center px-0" : "px-4",
              isSidebarCollapsed ? "justify-center px-0" : "px-4",
              isSidebarCollapsed ? "justify-center px-0" : "px-4",
              activeTab === 'dashboard'                
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-[0_0_15px_-3px_rgba(245,158,11,0.4)]" 
                : "text-slate-300 hover:bg-slate-700 hover:text-white"
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
            onClick={() => setActiveTab('applications')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm",
              activeTab === 'applications' 
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-[0_0_15px_-3px_rgba(245,158,11,0.4)]" 
                : "text-slate-300 hover:bg-slate-700 hover:text-white"
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
              onClick={() => setActiveTab('reports')}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm",
                activeTab === 'reports' 
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-[0_0_15px_-3px_rgba(245,158,11,0.4)]" 
                  : "text-slate-300 hover:bg-slate-700 hover:text-white"
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
            onClick={() => setActiveTab('resources')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm",
              activeTab === 'resources' 
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-[0_0_15px_-3px_rgba(245,158,11,0.4)]" 
                : "text-slate-300 hover:bg-slate-700 hover:text-white"
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
                onClick={() => setActiveTab('users')}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm",
                  activeTab === 'users' 
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-[0_0_15px_-3px_rgba(245,158,11,0.4)]" 
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
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
                onClick={() => setActiveTab('projects')}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm",
                  activeTab === 'projects' 
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-[0_0_15px_-3px_rgba(245,158,11,0.4)]" 
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
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
                onClick={() => setActiveTab('settings')}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm",
                  activeTab === 'settings' 
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-[0_0_15px_-3px_rgba(245,158,11,0.4)]" 
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
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

          <div className="pt-4 mt-4 border-t border-slate-800/10">
            <button 
              onClick={() => setIsFieldMode(true)}
              title="Field Portal (Mobile)"
              className={cn(
                "w-full flex items-center gap-3 py-4 rounded-2xl transition-all duration-200 font-bold text-[11px] uppercase tracking-wider overflow-hidden",
                isSidebarCollapsed ? "justify-center px-0" : "px-8",
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

          <div className={cn("pt-4 border-t border-slate-800/10 mt-4 pb-2 transition-all", isSidebarCollapsed ? "px-4" : "px-6")}>
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

          <div className="flex-1 overflow-y-auto custom-scrollbar px-4 space-y-4 pb-6">
            <button 
              onClick={() => setSelectedProjectId(null)}
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
            .map(([region, regionProjects]) => (
              <div key={region} className="space-y-1">
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
                      {regionProjects.map(p => (
                        <button 
                          key={p.id} 
                          title={p.name}
                          onClick={() => { 
                            setSelectedProjectId(p.id); 
                            if (activeTab !== 'applications' && activeTab !== 'reports') {
                              setActiveTab('dashboard'); 
                            }
                          }}
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden z-10 relative bg-transparent">
        {/* Header */}
        <header className={cn(
          "h-20 backdrop-blur-xl border-b flex items-center justify-between px-8 shrink-0 z-20 transition-all",
          theme === 'light' ? "bg-white/70 border-slate-200 shadow-sm" : "bg-slate-900/40 border-slate-800/80"
        )}>
          <div className="flex items-center gap-4">
            <h2 className={cn("text-2xl font-black font-serif italic tracking-tighter", theme === 'light' ? "text-slate-900" : "text-white")}>
              {activeTab === 'dashboard' ? (selectedProject ? `Dashboard: ${selectedProject.name}` : 'Tổng quan Vùng') : (selectedProject ? `Hồ sơ: ${selectedProject.name}` : 'Danh sách Hồ sơ cấp GCN')}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 border-r border-slate-800/20 pr-4">
              <button 
                onClick={handleDownloadTemplate}
                className={cn(
                  "p-2.5 rounded-full border transition-all shadow-sm group relative",
                  theme === 'light' ? "bg-white border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200" : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-festive-gold hover:border-festive-gold/30"
                )}
                title="Tải mẫu Excel"
              >
                <Download size={18} />
              </button>

              <div className="relative">
                <input 
                  type="file" 
                  id="excel-import" 
                  className="hidden" 
                  accept=".xlsx, .xls" 
                  onChange={handleImportTemplate} 
                  disabled={isImporting}
                />
                <button 
                  onClick={() => document.getElementById('excel-import')?.click()}
                  disabled={isImporting}
                  className={cn(
                    "p-2.5 rounded-full border transition-all shadow-sm group relative",
                    theme === 'light' ? "bg-white border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200" : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30",
                    isImporting && "opacity-50 cursor-not-allowed"
                  )}
                  title={isImporting ? "Đang xử lý..." : "Nhập từ Excel"}
                >
                  {isImporting ? (
                    <span className="w-[18px] h-[18px] border-2 border-emerald-500 border-t-transparent rounded-full animate-spin inline-block" />
                  ) : (
                    <Upload size={18} />
                  )}
                </button>
              </div>

              {(userRole === 'PTT' || isManagementEdit) && (
                    <button 
                  onClick={() => {
                    const defaultProj = selectedProject?.name || (visibleProjects.length > 0 ? visibleProjects[0].name : projects[0].name);
                    setNewApp(prev => ({ ...prev, projectName: defaultProj }));
                    setIsCreateModalOpen(true);
                  }}
                  className="bg-festive-gold hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg shadow-festive-gold/10 transition-all active:scale-95"
                >
                  + Hồ sơ
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Notification Trigger */}
              <div className="relative">
                <button 
                  onClick={() => setIsNotiOpen(!isNotiOpen)}
                  className={cn(
                    "p-2.5 rounded-xl transition-all relative border",
                    isNotiOpen 
                      ? (theme === 'light' ? "bg-slate-200 border-slate-300 text-slate-950" : "bg-slate-800 border-slate-700 text-white") 
                      : (theme === 'light' ? "bg-white border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 shadow-sm" : "bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800/40 hover:text-slate-200")
                  )}
                  title="Thông báo"
                >
                  <Bell size={20} className={cn((notifications.some(n => !n.isRead) || taskReminders.length > 0) && "text-rose-500")} />
                  {(notifications.some(n => !n.isRead) || taskReminders.length > 0) && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
                  )}
                </button>
                <AnimatePresence>
                  {isNotiOpen && (
                    <div className="absolute right-0 mt-3 z-50">
                      <NotificationPanel 
                        notifications={notifications} 
                        taskReminders={taskReminders}
                        theme={theme}
                        onClose={() => setIsNotiOpen(false)} 
                        onRead={markNotificationAsRead}
                        onMarkAllRead={markAllNotificationsAsRead}
                        onAction={(appId, notiId) => {
                          if (notiId) deleteNotification(notiId);
                          if (appId) {
                            const app = applications.find(a => a.id === appId);
                            if (app) setSelectedApp(app);
                            setActiveTab('applications');
                          }
                          setIsNotiOpen(false);
                        }}
                      />
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Theme Toggle */}
              <button 
                onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                className={cn(
                  "p-2.5 rounded-xl transition-all border",
                  theme === 'light' ? "bg-white border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 shadow-sm" : "bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                )}
                title={theme === 'light' ? "Chuyển chế độ tối" : "Chuyển chế độ sáng"}
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} className="text-festive-gold" />}
              </button>
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-4 pl-6 border-l border-slate-800/20">
              <div className="text-right hidden sm:block overflow-hidden max-w-[150px]">
                <p className={cn("text-xs font-bold uppercase tracking-wider truncate", theme === 'light' ? "text-slate-900" : "text-white")}>{currentUser?.name}</p>
                <div className="flex items-center justify-end gap-2">
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider truncate">Phòng: {currentUser?.dept}</p>
                  <button 
                    onClick={() => setIsChangePasswordModalOpen(true)}
                    className="text-[10px] font-bold text-indigo-500 hover:text-indigo-400 uppercase tracking-wider transition-colors ml-1"
                  >
                    Đổi Pass
                  </button>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-festive-gold/10 border border-festive-gold/20 flex items-center justify-center text-festive-gold font-black text-xs shadow-lg shadow-festive-gold/5">
                {(currentUser?.name || 'User').split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <button 
                onClick={async () => {
                   setCurrentUser(null);
                   await supabase.auth.signOut();
                }}
                className={cn(
                  "p-2.5 rounded-xl transition-all border",
                  theme === 'light' ? "bg-white border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 shadow-sm" : "bg-slate-900/50 border-slate-800 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10"
                )}
                title="Đăng xuất"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 md:px-8 bg-transparent custom-scrollbar relative">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-7xl mx-auto space-y-8"
              >
                {/* Role-Based KPI Cards */}
                 {userRole === 'PTT' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard 
                      title="TỔNG SỐ LƯỢNG HỒ SƠ" 
                      value={dashboardApps?.length || applications.length || 8} 
                      icon={Files} 
                      colorClass="bg-blue-500 shadow-blue-500/40" 
                      delay={0.1} 
                      theme={theme} 
                      isActive={dashboardFilter === 'ALL' || !dashboardFilter}
                      onClick={() => handleDashboardClick('ALL')}
                    />
                    <StatCard 
                      title="HỒ SƠ ĐANG XỬ LÝ" 
                      value={stats.processing} 
                      icon={Activity} 
                      colorClass="bg-info shadow-info/40" 
                      delay={0.2} 
                      theme={theme} 
                      isActive={dashboardFilter === 'PTT_PROCESSING'}
                      onClick={() => handleDashboardClick('PTT_PROCESSING')}
                    />
                    <StatCard 
                      title="CHƯA NỘP NVTC" 
                      value={chartData.find(c => c.name === 'CHỜ HOÀN THÀNH NVTC')?.value || 0} 
                      icon={Clock} 
                      colorClass="bg-warning shadow-warning/40" 
                      delay={0.4} 
                      theme={theme} 
                      isActive={dashboardFilter === 'PTT_TAX_PENDING_COMPLETE'}
                      onClick={() => handleDashboardClick('PTT_TAX_PENDING_COMPLETE')}
                    />
                    <StatCard 
                      title="CHỜ BÀN GIAO KHÁCH" 
                      value={chartData.find(c => c.name === 'CHỜ BÀN GIAO')?.value || 0} 
                      icon={UserCheck} 
                      colorClass="bg-purple-500 shadow-purple-500/40" 
                      delay={0.5} 
                      theme={theme} 
                      isActive={dashboardFilter === 'PTT_WAITING_HANDOVER'}
                      onClick={() => handleDashboardClick('PTT_WAITING_HANDOVER')}
                    />
                  </div>
                )}

                {userRole === 'KT' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Tổng số lượng hồ sơ" value={roleKpis.kt.total} icon={Files} colorClass="bg-blue-500 shadow-blue-500/40" delay={0.1} theme={theme} isActive={dashboardFilter === 'ALL' || !dashboardFilter} onClick={() => handleDashboardClick('ALL')} />
                    <StatCard title="Hồ sơ cần tiếp nhận" value={roleKpis.kt.received} icon={Files} colorClass="bg-info shadow-info/40" delay={0.15} theme={theme} isActive={dashboardFilter === 'KT_NEED_RECEIVE'} onClick={() => handleDashboardClick('KT_NEED_RECEIVE')} />
                    <StatCard title="Hồ sơ đang xử lý" value={roleKpis.kt.processing} icon={Activity} colorClass="bg-cyan-500 shadow-cyan-500/40" delay={0.2} theme={theme} isActive={dashboardFilter === 'KT_PROCESSING'} onClick={() => handleDashboardClick('KT_PROCESSING')} />
                    <StatCard title="Chờ hoàn thành NVTC" value={roleKpis.kt.taxPending} icon={Clock} colorClass="bg-warning shadow-warning/40" delay={0.25} theme={theme} isActive={dashboardFilter === 'KT_TAX_PENDING_COMPLETE'} onClick={() => handleDashboardClick('KT_TAX_PENDING_COMPLETE')} />
                  </div>
                )}

                {userRole === 'PTDA' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <StatCard title="Hồ sơ cần tiếp nhận" value={roleKpis.ptda.received} icon={Files} colorClass="bg-blue-500 shadow-blue-500/40" delay={0.05} theme={theme} isActive={dashboardFilter === 'PTDA_NEED_RECEIVE'} onClick={() => handleDashboardClick('PTDA_NEED_RECEIVE')} />
                    <StatCard title="Đã nộp VPĐK" value={roleKpis.ptda.daNopVPDK} icon={CheckCircle2} colorClass="bg-emerald-500 shadow-emerald-500/40" delay={0.08} theme={theme} isActive={dashboardFilter === 'SUBMITTED_RECENT'} onClick={() => handleDashboardClick('SUBMITTED_RECENT')} />
                    <StatCard title="Chờ TB Thuế" value={roleKpis.ptda.noTax} icon={Clock} colorClass="bg-warning shadow-warning/40" delay={0.12} theme={theme} isActive={dashboardFilter === 'WAIT_TAX_NOTICE_OVERDUE'} onClick={() => handleDashboardClick('WAIT_TAX_NOTICE_OVERDUE')} />
                    <StatCard title="Chờ hoàn thành NVTC" value={roleKpis.ptda.noTaxPaid} icon={CheckCircle2} colorClass="bg-warning shadow-warning/40" delay={0.15} theme={theme} isActive={dashboardFilter === 'PTDA_TAX_PENDING_COMPLETE'} onClick={() => handleDashboardClick('PTDA_TAX_PENDING_COMPLETE')} />
                    <StatCard title="Chờ in/ký GCN" value={roleKpis.ptda.gcnWaiting} icon={FileText} colorClass="bg-info shadow-info/40" delay={0.2} theme={theme} isActive={dashboardFilter === 'PTDA_WAIT_GCN_SIGN'} onClick={() => handleDashboardClick('PTDA_WAIT_GCN_SIGN')} />
                  </div>
                )}

                 {(isManagement || !userRole) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <StatCard 
                      title="Tổng số hồ sơ đang xử lý" 
                      value={kpis.total} 
                      icon={Building2} 
                      colorClass="bg-indigo-600 shadow-indigo-600/40" 
                      delay={0.1} 
                      theme={theme} 
                      isActive={dashboardFilter === 'PROCESSING_TOTAL'}
                      onClick={() => handleDashboardClick('PROCESSING_TOTAL')}
                    />
                    <StatCard 
                      title="BÁO CÁO TRỄ HẠN" 
                      value={kpis.overdue} 
                      icon={AlertCircle} 
                      colorClass="bg-warning shadow-warning/40" 
                      delay={0.2} 
                      theme={theme} 
                      isActive={dashboardFilter === 'OVERDUE'}
                      onClick={() => {
                        setActiveTab('reports');
                        setReportType('SLA');
                      }}
                    />
                    <StatCard 
                      title="BÁO CÁO SAI SÓT" 
                      value={kpis.error} 
                      icon={AlertCircle} 
                      colorClass="bg-error shadow-error/40" 
                      delay={0.3} 
                      theme={theme} 
                      isActive={dashboardFilter === 'ERROR'}
                      onClick={() => {
                        setActiveTab('reports');
                        setReportType('ERROR');
                      }}
                    />
                    <StatCard 
                      title="BÁO CÁO HỒ SƠ VAY" 
                      value={applications.filter(a => a.loanStatus === 'Co_Vay').length} 
                      icon={CreditCard} 
                      colorClass="bg-blue-600 shadow-blue-600/40" 
                      delay={0.4} 
                      theme={theme} 
                      isActive={dashboardFilter === 'LOAN'}
                      onClick={() => {
                        setActiveTab('reports');
                        setReportType('LOAN');
                      }}
                    />
                  </div>
                )}

                
                <div className="hidden">
                  <DashboardAlerts 
                    theme={theme}
                    stats={{
                      loanCount: kpis.loanCount,
                      regularCount: kpis.regularCount,
                      overdueCount: kpis.overdue,
                      errorCount: kpis.error,
                    }}
                    onFilterChange={(filter) => {
                      setActiveTab('applications');
                      setFilterStatus('ALL');
                      setDashboardFilter('ALL');
                      if (filter === 'SLA_OVERDUE') {
                        setFilterSLAStatus('OVERDUE');
                        setFilterIssue('ALL');
                      } else if (filter === 'HAS_ERROR') {
                        setFilterIssue('ERROR');
                        setFilterSLAStatus('ALL');
                      }
                      setSearch('');
                    }}
                  />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                  <div className={cn(
                    "lg:col-span-3 p-8 rounded-[3rem] border transition-all duration-700 relative overflow-hidden group",
                    theme === 'light' ? "bg-white/70 border-slate-200/60 shadow-2xl shadow-indigo-100/50 backdrop-blur-xl" : "bg-slate-900/40 border-slate-800/50 shadow-2xl"
                  )}>
                    {theme === 'light' && (
                        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/50 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                    )}

                    <div className="flex items-center justify-between mb-10 relative z-10">
                      <div>
                         <h3 className={cn("font-black flex items-center gap-3 text-2xl uppercase tracking-tighter", theme === 'light' ? "text-slate-800" : "text-white")}>
                           <div className="p-2 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                             <BarChart3 size={20} className="text-amber-500" />
                           </div>
                           Thống kê Tiến độ
                         </h3>
                         <div className="flex items-center gap-4 mt-2">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-70">Phân bổ theo giai đoạn thực tế</p>
                            <div className="flex items-center gap-2">
                               <div className="flex items-center gap-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)] animate-pulse" />
                                  <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Phát hiện sai sót</span>
                               </div>
                            </div>
                         </div>
                      </div>
                    </div>
                    <div className="h-[500px] w-full mt-4 relative z-10">
                        <ResponsiveContainer width="100%" height={500}>
                          <BarChart 
                            layout="vertical"
                            data={chartData} 
                            margin={{ top: 20, right: 60, left: 10, bottom: 5 }}
                            barGap={0}
                            onClick={(data: any) => {
                              if (data && data.activePayload && data.activePayload.length > 0) {
                                const stageStatus = data.activePayload[0].payload.statusId;
                                const stageName = data.activePayload[0].payload.name;
                                setActiveTab('applications');
                                setFilterStatus(stageStatus);
                                showToast(`Đang hiển thị hồ sơ: ${stageName}`);
                              }
                            }}
                            style={{ cursor: 'pointer' }}
                          >

                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={theme === 'light' ? "#f1f5f9" : "#ffffff08"} />
                            <XAxis type="number" hide domain={[0, (dataMax: number) => Math.ceil(dataMax + (dataMax * 0.1) + 1)]} />
                            <YAxis 
                               type="category"
                               dataKey="name"
                               axisLine={false} 
                               tickLine={false} 
                               width={140}
                               tick={{ fontSize: 11, fill: theme === 'light' ? '#475569' : '#94a3b8', fontWeight: 900, textAnchor: 'start' }} 
                               dx={-130}
                            />
                            <ReTooltip 
                              cursor={{ fill: theme === 'light' ? 'rgba(30, 41, 59, 0.05)' : 'rgba(255,255,255,0.05)' }}
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className={cn(
                                      "p-4 rounded-2xl shadow-2xl border backdrop-blur-xl",
                                      theme === 'light' ? "bg-white/95 border-slate-200 text-slate-800" : "bg-slate-900/95 border-slate-800 text-white"
                                    )}>
                                      <div className="font-black mb-2 uppercase text-[10px] tracking-widest border-b border-indigo-500/20 pb-1.5 flex items-center gap-2">
                                        <div className="w-1.5 h-3 bg-indigo-500 rounded-full" />
                                        {data.name}
                                      </div>
                                      <div className="space-y-1.5">
                                        <div className="flex justify-between gap-8 items-center">
                                          <span className="text-slate-500 font-bold uppercase text-[9px]">Tổng cộng:</span>
                                          <span className={cn("font-black text-lg", theme === 'light' ? "text-indigo-600" : "text-indigo-400")}>
                                            {data.value.toLocaleString()}
                                          </span>
                                        </div>
                                        <div className="flex justify-between gap-8 items-center">
                                          <span className="text-slate-500 font-bold uppercase text-[9px]">Bình thường:</span>
                                          <span className="font-bold text-emerald-500 text-xs">{data.normal.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between gap-8 items-center">
                                          <span className="text-slate-500 font-bold uppercase text-[9px]">Sai sót:</span>
                                          <span className="font-bold text-rose-500 text-xs">{data.error.toLocaleString()}</span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar 
                              dataKey="normal" 
                              stackId="a"
                              barSize={24} 
                              minPointSize={5}
                              radius={[0, 0, 0, 0]} 
                            >
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-normal-${index}`} fill={entry.color} />
                              ))}
                              <LabelList 
                                dataKey="normal" 
                                position="right" 
                                offset={15} 
                                content={(props: any) => {
                                   const { x, y, width, height, index } = props;
                                   const data = chartData[index];
                                   if (!data || data.error > 0) return null;
                                   return (
                                      <text 
                                         x={(x || 0) + (width || 0) + 15} 
                                         y={(y || 0) + (height || 0) / 2} 
                                         fill={theme === 'light' ? '#1e293b' : '#f8fafc'} 
                                         fontSize="12" 
                                         fontWeight="900"
                                         textAnchor="start"
                                         dominantBaseline="central"
                                      >
                                         {data.value}
                                      </text>
                                   );
                                }}
                              />
                            </Bar>
                            <Bar 
                              dataKey="error" 
                              stackId="a"
                              fill="#f43f5e"
                              barSize={24} 
                              radius={[0, 12, 12, 0]} 
                              className="shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                            >
                              <LabelList 
                                dataKey="error" 
                                position="right" 
                                offset={15} 
                                content={(props: any) => {
                                   const { x, y, width, height, index } = props;
                                   const data = chartData[index];
                                   if (!data || data.error === 0) return null;
                                   return (
                                      <text 
                                         x={(x || 0) + (width || 0) + 15} 
                                         y={(y || 0) + (height || 0) / 2} 
                                         fill={theme === 'light' ? '#1e293b' : '#f8fafc'} 
                                         fontSize="12" 
                                         fontWeight="900"
                                         textAnchor="start"
                                         dominantBaseline="central"
                                      >
                                         {data.value}
                                      </text>
                                   );
                                }}
                              />
                            </Bar>
                          </BarChart>
             </ResponsiveContainer>
          </div>
                    </div>

                  <div className="lg:col-span-1 space-y-8">
                    <DashboardAlerts 
                      theme={theme}
                      stats={{
                        loanCount: kpis.loanCount,
                        regularCount: kpis.regularCount,
                        overdueCount: kpis.overdue,
                        errorCount: kpis.error,
                      }}
                      onFilterChange={(filter) => {
                        setActiveTab('applications');
                        setFilterStatus('ALL');
                        setDashboardFilter('ALL');
                        if (filter === 'SLA_OVERDUE') {
                          setFilterSLAStatus('OVERDUE');
                          setFilterIssue('ALL');
                        } else if (filter === 'HAS_ERROR') {
                          setFilterIssue('ERROR');
                          setFilterSLAStatus('ALL');
                        }
                        setSearch('');
                      }}
                    />

                    <div className={cn(
                      "p-8 rounded-[3rem] border transition-all duration-500 relative overflow-hidden group",
                      theme === 'light' ? "bg-white/70 border-slate-200/60 shadow-xl backdrop-blur-xl" : "bg-slate-900/40 border-slate-800/50 shadow-xl"
                    )}>
                      <div>
                        <h3 className={cn("font-black mb-6 font-serif text-sm italic flex items-center gap-3 uppercase tracking-widest", theme === 'light' ? "text-slate-800" : "text-white")}>
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                          Tỉ lệ Trạng thái
                        </h3>
                        <div className="h-[180px] w-full relative">
                          <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                              <Pie 
                                data={overallPieData} 
                                cx="50%" 
                                cy="50%" 
                                innerRadius={55} 
                                outerRadius={75} 
                                paddingAngle={6} 
                                dataKey="value"
                                stroke="none"
                              >
                                {overallPieData.map((entry, index) => (
                                  <Cell 
                                    key={`cell-pie-${index}`} 
                                    fill={entry.color} 
                                    className="hover:opacity-80 transition-opacity cursor-pointer outline-none" 
                                  />
                                ))}
                              </Pie>
                              <ReTooltip content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className={cn(
                                       "p-3 rounded-xl text-[10px] font-black border backdrop-blur-md shadow-2xl", 
                                       theme === 'light' ? "bg-white border-slate-200 text-slate-800 shadow-indigo-100" : "bg-slate-900 border-slate-800 text-white"
                                    )}>
                                      <div className="flex items-center gap-2 mb-1">
                                         <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: data.color }} />
                                         {data.name}
                                      </div>
                                      <div className="flex justify-between gap-4">
                                         <span className="opacity-50 font-bold uppercase tracking-tighter">Phần trăm:</span>
                                         <span>{data.percentage}%</span>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">Tổng quy mô</p>
                              <p className={cn("text-xl font-black mt-1", theme === 'dark' ? "text-white" : "text-slate-800")}>
                                 {overallPieTotal}
                              </p>
                          </div>
                        </div>
                      </div>
                    </div>

                      <div className="pt-4 border-t border-slate-800/10">
                         <h3 className={cn("font-bold mb-4 font-serif text-sm italic flex items-center gap-3", theme === 'light' ? "text-slate-900" : "text-white")}>
                           <Wallet size={14} className="text-emerald-500" />
                           Thống kê vay vốn
                         </h3>
                         
                          <div className="flex flex-col gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                               {/* Ratio Stats */}
                               <div className="flex flex-col gap-4">
                                  <div className="text-center text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Tỷ lệ Vay / Vốn tự có</div>
                                  {roleKpis.loanRatioStats.length > 0 ? (
                                    <div className="h-[150px] w-full relative">
                                       <ResponsiveContainer width="100%" height={150}>
                                         <PieChart>
                                           <Pie data={roleKpis.loanRatioStats} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value" stroke="none">
                                             {roleKpis.loanRatioStats.map((entry: any, index: number) => (
                                               <Cell key={`cell-ratio-${index}`} fill={entry.color} />
                                             ))}
                                           </Pie>
                                           <ReTooltip 
                                             contentStyle={{ backgroundColor: theme === 'light' ? '#fff' : '#0f172a', border: 'none', borderRadius: '8px', fontSize: '10px' }}
                                             itemStyle={{ color: theme === 'light' ? '#0f172a' : '#fff', fontWeight: 'bold' }}
                                           />
                                         </PieChart>
                                       </ResponsiveContainer>
                                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                           <p className={cn("text-xl font-black", theme === 'dark' ? "text-white" : "text-slate-800")}>
                                              {loanRatioTotal}
                                           </p>
                                           <p className="text-[8px] font-bold text-slate-500 uppercase">Căn</p>
                                       </div>
                                    </div>
                                  ) : (
                                    <p className="text-[9px] italic opacity-40 text-center mt-4">Không có dữ liệu</p>
                                  )}
                               </div>
                               
                               {/* Status Stats */}
                               <div className="flex flex-col gap-4 border-l border-slate-800/10 pl-4 w-full">
                                  <div className="text-center text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Tiến độ hồ sơ vay</div>
                                  {loanPieData.length > 0 ? (
                                    <div className="h-[150px] w-full relative">
                                       <ResponsiveContainer width="100%" height={150}>
                                         <PieChart>
                                           <Pie 
                                              data={loanPieData} 
                                              cx="50%" 
                                              cy="50%" 
                                              innerRadius={40} 
                                              outerRadius={60} 
                                              paddingAngle={2} 
                                              dataKey="value" 
                                              stroke="none"
                                           >
                                             {loanPieData.map((entry, index) => (
                                               <Cell 
                                                 key={`cell-loan-st-${index}`} 
                                                 fill={entry.color} 
                                                 className="hover:opacity-80 transition-opacity cursor-pointer outline-none" 
                                               />
                                             ))}
                                           </Pie>
                                           <ReTooltip 
                                              content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                  const data = payload[0].payload;
                                                  return (
                                                    <div className={cn(
                                                       "p-3 rounded-xl text-[10px] font-black border backdrop-blur-md shadow-2xl", 
                                                       theme === 'light' ? "bg-white border-slate-200 text-slate-800 shadow-indigo-100" : "bg-slate-900 border-slate-800 text-white"
                                                    )}>
                                                      <div className="flex items-center gap-2 mb-1">
                                                         <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: data.color }} />
                                                         {data.name}
                                                      </div>
                                                      <div className="flex justify-between gap-4">
                                                         <span className="opacity-50 font-bold uppercase tracking-tighter">Phần trăm:</span>
                                                         <span>{data.percentage}%</span>
                                                      </div>
                                                    </div>
                                                  );
                                                }
                                                return null;
                                              }} 
                                            />
                                         </PieChart>
                                       </ResponsiveContainer>
                                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                           <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">Căn vay</p>
                                           <p className={cn("text-xl font-black mt-1", theme === 'dark' ? "text-white" : "text-slate-800")}>
                                              {loanPieData.reduce((acc, curr) => acc + curr.value, 0)}
                                           </p>
                                       </div>
                                    </div>
                                  ) : (
                                    <p className="text-[9px] italic opacity-40 text-center mt-4">Không có dữ liệu</p>
                                  )}
                               </div>
                            </div>
                         </div>
                      </div>
                    </div>
                  </div>

                {(userRole === 'ADMIN' || userRole === 'DIRECTOR') && (
                  <div className={cn(
                    "backdrop-blur-xl rounded-3xl shadow-2xl border transition-all overflow-hidden",
                    theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900/20 shadow-2xl border-slate-800/50"
                  )}>
                    <div className={cn("p-5 border-b flex items-center justify-between", theme === 'light' ? "border-slate-100 bg-slate-50" : "border-slate-800/50")}>
                      <div className="flex items-center gap-4">
                        <h3 className={cn("font-bold font-serif text-lg italic", theme === 'light' ? "text-slate-900" : "text-white")}>Hiệu suất Xử lý theo Phòng ban</h3>
                        <div className="flex items-center gap-2 bg-slate-800/20 rounded-lg p-1 border border-slate-700/30">
                          <Clock size={10} className="text-slate-500 ml-1" />
                          <span className="text-[9px] font-black uppercase text-slate-400 px-2 italic">Chỉ số SLA trung bình</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {roleKpis.admin.deptStats.map((dept, idx) => (
                          <div key={dept.dept} className={cn(
                            "p-4 rounded-[2rem] border transition-all hover:bg-slate-800/10 duration-300",
                            theme === 'light' ? "bg-slate-50 border-slate-100 shadow-sm" : "bg-slate-800/40 border-slate-700/30 shadow-xl"
                          )}>
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                 <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", dept.color + " bg-opacity-10")}>
                                    <Layers size={14} className={dept.color.replace('bg-', 'text-')} />
                                 </div>
                                 <div>
                                   <p className={cn("text-[8px] font-black uppercase tracking-widest leading-none mb-0.5", theme === 'light' ? "text-slate-400" : "text-slate-500")}>Phòng ban</p>
                                   <h4 className={cn("text-sm font-black italic truncate max-w-[120px]", theme === 'light' ? "text-slate-900" : "text-white")}>{dept.label}</h4>
                                 </div>
                              </div>
                              <div className="text-right">
                                <span className={cn("text-2xl font-black italic font-serif", theme === 'light' ? "text-slate-900" : "text-white")}>{dept.avgDays}</span>
                                <span className="text-[8px] font-bold text-slate-500 uppercase ml-1">Ngày</span>
                              </div>
                            </div>
                            
                            <div className="h-1.5 w-full bg-slate-800/10 rounded-full overflow-hidden mb-3">
                               <div className={cn("h-full rounded-full transition-all duration-1000", dept.color)} style={{ width: `${Math.min(100, (dept.avgDays / 15) * 100)}%` }} />
                            </div>
                            
                            <div className="flex justify-between items-center text-[9px]">
                               <span className="text-slate-500 font-bold uppercase">Xử lý: {dept.count}</span>
                               <span className={cn("font-black italic px-2 py-0.5 rounded-lg", dept.avgDays > 10 ? "text-rose-500 bg-rose-500/5" : "text-emerald-500 bg-emerald-500/5")}>
                                 {dept.avgDays > 10 ? 'Chậm' : 'Tốt'}
                               </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className={cn(
                  "backdrop-blur-xl rounded-3xl shadow-2xl border transition-all overflow-hidden",
                  theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900/20 shadow-2xl border-slate-800/50"
                )}>
                  <div className={cn("p-6 border-b flex items-center justify-between", theme === 'light' ? "border-slate-100 bg-slate-50" : "border-slate-800/50")}>
                    <div className="flex items-center gap-4">
                      <h3 className={cn("font-bold font-serif text-xl italic", theme === 'light' ? "text-slate-900" : "text-white")}>Tình hình xử lý theo Dự án</h3>
                      <div className="flex items-center gap-2 bg-slate-800/20 rounded-lg p-1 border border-slate-700/30">
                        <Filter size={12} className="text-slate-500 ml-1" />
                        <select 
                          className="bg-transparent text-[10px] font-black uppercase text-slate-400 outline-none pr-2 cursor-pointer"
                          value={projectRegionFilter}
                          onChange={(e) => setProjectRegionFilter(e.target.value)}
                        >
                          <option value="ALL">Tất cả khu vực</option>
                          {REGION_ORDER.map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button className="text-festive-gold text-xs font-bold hover:underline">Chi tiết báo cáo</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className={theme === 'light' ? "bg-slate-50" : "bg-slate-800/30"}>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono italic">Dự án & Khu vực</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono italic text-center">Quỹ căn</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono italic text-center">Đã xong</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono italic">Tiến độ pháp lý</th>
                        </tr>
                      </thead>
                      <tbody className={cn("divide-y", theme === 'light' ? "divide-slate-50" : "divide-slate-800/50")}>
                        {visibleProjects
                          .filter(p => projectRegionFilter === 'ALL' || p.region === projectRegionFilter)
                          .map(p => {
                            const projectApps = dashboardApps.filter(a => a.projectName === p.name);
                            const completed = projectApps.filter(a => a.currentStep === 'Hoan_Tat' || a.customerHandoverDate || a.status === 'Completed').length;
                            const processing = projectApps.filter(a => a.status === 'Processing' || a.status === 'Submitted' || a.status === 'TaxPending').length;
                            const progress = p.totalUnits > 0 ? Math.round((completed / p.totalUnits) * 100) : 0;
                            
                            // Calculate colored progress bar
                            const barColor = progress > 80 ? 'bg-emerald-500' : progress > 30 ? 'bg-indigo-500' : 'bg-amber-500';
                            const shadowColor = progress > 80 ? 'shadow-emerald-500/30' : progress > 30 ? 'shadow-indigo-500/30' : 'shadow-amber-500/30';

                            return (
                              <tr 
                                key={p.id} 
                                onClick={() => setSelectedProjectId(p.id)}
                                className={cn(
                                  "transition-colors cursor-pointer group border-b",
                                  theme === 'light' 
                                    ? (selectedProjectId === p.id ? "bg-festive-gold/10 border-festive-gold/30 text-slate-800" : "hover:bg-slate-50 border-slate-50 text-slate-700") 
                                    : (selectedProjectId === p.id ? "bg-slate-800/60 border-slate-700 text-white" : "hover:bg-slate-800/30 border-slate-800/20 text-slate-300")
                                )}
                              >
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className={cn(
                                      "w-8 h-8 rounded-lg flex items-center justify-center transition-colors border shadow-sm",
                                      theme === 'light' ? "bg-indigo-50 border-indigo-100 text-indigo-500" : "bg-slate-800/50 border-slate-700/50 text-slate-500"
                                    )}>
                                      <Building2 size={16} />
                                    </div>
                                    <div>
                                      <p className={cn("text-xs font-black uppercase tracking-tighter", theme === 'light' ? "text-slate-900" : "text-white")}>{p.name}</p>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <MapPin size={8} className="text-slate-400" />
                                        <p className="text-[9px] text-slate-400 tracking-[0.1em] font-bold uppercase">{p.region}</p>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center text-xs font-black text-slate-500 font-mono tracking-tighter">{p.totalUnits}</td>
                                <td className="px-6 py-4 text-center">
                                   <div className="flex flex-col items-center">
                                      <span className="text-sm font-black text-emerald-500 italic">{completed}</span>
                                      <span className="text-[8px] text-slate-400 font-bold uppercase">Xong</span>
                                   </div>
                                </td>
                                <td className="px-6 py-4 min-w-[200px]">
                                  <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-4">
                                      <div className="flex-1 h-2 bg-slate-800/10 rounded-full overflow-hidden border border-slate-800/5">
                                         <div className={cn("h-full rounded-full transition-all duration-1000", barColor, shadowColor)} style={{ width: `${progress}%` }} />
                                      </div>
                                      <span className="text-[10px] font-black min-w-[30px] text-indigo-500">{progress}%</span>
                                    </div>
                                    <div className="flex justify-between items-center px-1">
                                      <span className="text-[9px] font-bold text-slate-500 uppercase">
                                        Đã xong: <span className={theme === 'light' ? "text-slate-900" : "text-white"}>{completed}</span> | 
                                        Đang XL: <span className={theme === 'light' ? "text-slate-900" : "text-white"}>{processing}</span> | 
                                        Quỹ căn: <span className={theme === 'light' ? "text-slate-900" : "text-white"}>{p.totalUnits}</span>
                                      </span>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

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
                  <div className={cn("p-3 border-b", theme === 'light' ? "border-slate-100 shadow-inner bg-slate-50/50" : "border-slate-800/50")}>
                    <div className="flex items-center justify-between gap-4">
                      <div className={cn("flex items-center gap-4 text-[11px]", theme === 'light' ? "text-slate-800" : "text-slate-200")}>
                        <select 
                          value={pageSize}
                          onChange={(e) => {setPageSize(Number(e.target.value)); setCurrentPage(0);}}
                          className={cn("px-2 py-1 rounded-lg text-[10px] outline-none font-bold", theme === 'light' ? "bg-slate-200/50 text-slate-800 border border-slate-300/50" : "bg-slate-800 text-slate-200 border border-slate-700")}
                        >
                          <option value={20}>20 / trang</option>
                          <option value={50}>50 / trang</option>
                          <option value={100}>100 / trang</option>
                        </select>
                        <div className={cn("flex items-center gap-2 font-bold", theme === 'light' ? "text-slate-600" : "text-slate-400")}>
                          <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} className={cn("p-1 transition-colors disabled:opacity-30", theme === 'light' ? "hover:text-indigo-600" : "hover:text-festive-gold")}>Trước</button>
                          <span className={cn("px-3 py-1 rounded-lg", theme === 'light' ? "bg-slate-200/50 text-slate-900" : "bg-slate-800 text-white")}>Trang {currentPage + 1}</span>
                          <button onClick={() => setCurrentPage(p => ( (p+1)*pageSize < totalCount ? p + 1 : p))} disabled={(currentPage+1)*pageSize >= totalCount} className={cn("p-1 transition-colors disabled:opacity-30", theme === 'light' ? "hover:text-indigo-600" : "hover:text-festive-gold")}>Sau</button>
                        </div>
                        <span className="text-slate-500 font-bold italic opacity-70">Tổng: {totalCount.toLocaleString()} hồ sơ</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative group">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                          <input 
                            type="text" 
                            placeholder="Tìm kiếm nhanh..." 
                            className={cn(
                              "pl-8 pr-3 py-1.5 rounded-full text-[10px] font-bold transition-all w-40 outline-none border tracking-tight",
                              theme === 'light' ? "bg-white border-slate-200 text-slate-800 focus:border-indigo-500/50 shadow-sm" : "bg-slate-950/40 border-slate-800 text-slate-200 focus:border-festive-gold/50"
                            )}
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setCurrentPage(0); }}
                          />
                        </div>

                        {selectedAppIds.length > 0 && (
                          <button 
                            onClick={handleBulkPrint}
                            className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                          >
                            <Printer size={12} />
                            In ({selectedAppIds.length})
                          </button>
                        )}
                        <button 
                          onClick={() => setIsShowFilters(!isShowFilters)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all hover:scale-[1.02]",
                            isShowFilters || (selectedProjectId || filterStatus !== 'ALL' || filterLoanStatus !== 'ALL' || filterSelfService !== 'ALL' || filterSLAStatus !== 'ALL' || filterIssue !== 'ALL')
                              ? "bg-festive-gold text-slate-950 border-festive-gold shadow-lg shadow-festive-gold/15 font-black" 
                              : (theme === 'light' ? "bg-white text-slate-600 border-slate-200 shadow-sm hover:bg-slate-50" : "bg-slate-950/40 text-slate-400 border-slate-800 hover:border-festive-gold/30")
                          )}
                        >
                          <Filter size={12} />
                          Bộ lọc
                        </button>

                        <div className="relative inline-block text-left" ref={quickFilterRef}>
                          <button 
                            onClick={() => setIsQuickFilterOpen(!isQuickFilterOpen)}
                            className={cn(
                              "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all hover:scale-[1.02]",
                              isQuickFilterOpen || selectedFlags.length > 0
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20" 
                                : (theme === 'light' ? "bg-white text-slate-600 border-slate-200 shadow-sm hover:bg-slate-50" : "bg-slate-950/40 text-slate-400 border-slate-800 hover:border-indigo-550/30")
                            )}
                          >
                            <span>Lọc nhanh {selectedFlags.length > 0 ? `(${selectedFlags.length})` : ''} 🔽</span>
                          </button>
                          
                          <AnimatePresence>
                            {isQuickFilterOpen && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className={cn(
                                  "absolute right-0 mt-2 w-72 rounded-2xl shadow-xl border p-4 z-50 transition-all",
                                  theme === 'light' ? "bg-white border-slate-200 shadow-slate-900/5 text-slate-900" : "bg-slate-950 border-slate-800 text-white"
                                )}
                              >
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Flags/Tags của hồ sơ</label>
                                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                                  {[
                                    { key: 'CO_VAY', label: 'Có vay', queryLabel: '#CO_VAY' },
                                    { key: 'KHONG_VAY', label: 'Vốn tự có', queryLabel: '#KHONG_VAY' },
                                    { key: 'CO_LOI', label: 'Có vướng mắc', queryLabel: '#CO_LOI' },
                                    { key: 'PROCESSING', label: 'Đang chuẩn bị hồ sơ', queryLabel: '#PROCESSING' },
                                    { key: 'TAX_PENDING', label: 'Chờ NVTC', queryLabel: '#TAX_PENDING' },
                                    { key: 'WAITING_HANDOVER', label: 'Chờ bàn giao', queryLabel: '#WAITING_HANDOVER' },
                                    { key: 'COMPLETED', label: 'Đã hoàn tất', queryLabel: '#COMPLETED' }
                                  ].map((item) => {
                                    const isSelected = selectedFlags.includes(item.key);
                                    return (
                                      <button
                                        key={item.key}
                                        onClick={() => {
                                          if (isSelected) {
                                            setSelectedFlags(selectedFlags.filter(f => f !== item.key));
                                          } else {
                                            setSelectedFlags([...selectedFlags, item.key]);
                                          }
                                          setCurrentPage(0);
                                        }}
                                        className={cn(
                                          "w-full text-left px-3 py-2 rounded-xl text-xs font-medium border flex items-center justify-between transition-all",
                                          isSelected 
                                            ? "border-festive-gold text-festive-gold bg-festive-gold/10 font-bold" 
                                            : (theme === 'light' ? "border-slate-100 text-slate-700 bg-slate-50 hover:bg-slate-100" : "border-slate-800/50 text-slate-400 bg-slate-900/35 hover:bg-slate-900")
                                        )}
                                      >
                                        <span>{item.label} ({item.queryLabel})</span>
                                        {isSelected && <Check size={14} className="text-festive-gold" />}
                                      </button>
                                    );
                                  })}
                                </div>
                                {selectedFlags.length > 0 && (
                                  <button
                                    onClick={() => {
                                      setSelectedFlags([]);
                                      setCurrentPage(0);
                                    }}
                                    className="w-full mt-3 py-1.5 text-center text-[10px] uppercase font-bold tracking-wider text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                  >
                                    Xóa các tag
                                  </button>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

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
                        Hiển thị {filteredApps.length} hồ sơ trên trang / Tổng {totalCount} hồ sơ {selectedProject ? `thuộc ${selectedProject.name}` : 'toàn vùng'} (có lọc)
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
                            TaxPending: 'CHỜ NỘP THUẾ',
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
                        
                        if (dashboardFilter !== 'ALL') {
                          activeFilters.push({
                            label: `Dashboard: ${dashboardFilter}`,
                            onClear: () => { setDashboardFilter('ALL'); setCurrentPage(0); }
                          });
                        }
                        
                        selectedFlags.forEach(flag => {
                          const labels: Record<string, string> = {
                            CO_VAY: 'Có vay',
                            KHONG_VAY: 'Vốn tự có',
                            CO_LOI: 'Có vướng mắc',
                            PROCESSING: 'Đang chuẩn bị hồ sơ',
                            TAX_PENDING: 'Chờ NVTC',
                            WAITING_HANDOVER: 'Chờ bàn giao',
                            COMPLETED: 'Đã hoàn tất'
                          };
                          activeFilters.push({
                            label: labels[flag] || flag,
                            onClear: () => { setSelectedFlags(selectedFlags.filter(f => f !== flag)); setCurrentPage(0); }
                          });
                        });
                        
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
                                  key={`filter-tag-${idx}-${act.label}`}
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
                                  setSelectedFlags([]);
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

                    {/* Drawer Bộ lọc bên phải */}
                    <AnimatePresence>
                      {isShowFilters && (
                        <>
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsShowFilters(false)}
                            className="fixed inset-0 bg-black z-[90] pointer-events-auto"
                          />
                          
                          <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className={cn(
                              "fixed right-0 top-0 h-full w-full max-w-md z-[100] shadow-2xl p-6 flex flex-col justify-between border-l transition-all pointer-events-auto",
                              theme === 'light' ? "bg-white border-slate-200 text-slate-900" : "bg-slate-950 border-slate-800 text-white"
                            )}
                          >
                            <div className="flex flex-col h-full justify-between">
                              <div>
                                <div className="flex items-center justify-between pb-4 border-b border-slate-800/10 mb-6">
                                  <div className="flex items-center gap-2">
                                    <Filter size={18} className="text-festive-gold" />
                                    <h3 className="font-serif italic font-black text-lg">Bộ lọc hồ sơ</h3>
                                  </div>
                                  <button 
                                    onClick={() => setIsShowFilters(false)}
                                    className={cn(
                                      "p-1.5 rounded-full hover:bg-slate-500/10 transition-colors",
                                      theme === 'light' ? "text-slate-400" : "text-slate-500"
                                    )}
                                  >
                                    <X size={18} />
                                  </button>
                                </div>

                                <div className="space-y-5 max-h-[calc(100vh-180px)] overflow-y-auto pr-1">
                                  <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Lọc theo dự án</label>
                                    <select 
                                      className={cn(
                                        "w-full rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-festive-gold/20 transition-all font-bold",
                                        theme === 'light' ? "bg-slate-50 border border-slate-200 text-slate-900" : "bg-slate-900 border border-slate-800 text-white"
                                      )}
                                      value={selectedProjectId || 'ALL'}
                                      onChange={(e) => { setSelectedProjectId(e.target.value === 'ALL' ? null : e.target.value); setCurrentPage(0); }}
                                    >
                                      <option key="all-projects" value="ALL">Tất cả dự án</option>
                                      {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Trạng thái hồ sơ</label>
                                    <select 
                                      className={cn(
                                        "w-full rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-festive-gold/20 transition-all",
                                        theme === 'light' ? "bg-slate-50 border border-slate-200 text-slate-900" : "bg-slate-900 border border-slate-800 text-white"
                                      )}
                                      value={filterStatus}
                                      onChange={(e) => { setFilterStatus(e.target.value as any); setCurrentPage(0); }}
                                    >
                                      <option key="all-status" value="ALL">Tất cả trạng thái</option>
                                      <option value="Processing">ĐANG CHUẨN BỊ</option>
                                      <option value="WaitingVPDK">CHỜ NỘP VPĐK</option>
                                      <option value="TaxPending">CHỜ NỘP THUẾ</option>
                                      <option value="WaitingHandover">CHỜ BÀN GIAO</option>
                                      <option value="TaxPaid">ĐÃ NỘP THUẾ</option>
                                      <option value="Submitted">ĐÃ NỘP VPĐK</option>
                                      <option value="Completed">HOÀN TẤT</option>
                                    </select>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Lọc theo lỗi</label>
                                    <select 
                                      className={cn(
                                        "w-full rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-festive-gold/20 transition-all",
                                        theme === 'light' ? "bg-slate-50 border border-slate-200 text-slate-900" : "bg-slate-900 border border-slate-800 text-white"
                                      )}
                                      value={filterIssue}
                                      onChange={(e) => { setFilterIssue(e.target.value as any); setCurrentPage(0); }}
                                    >
                                      <option value="ALL">Tất cả hồ sơ</option>
                                      <option value="ERROR">Chỉ hồ sơ có lỗi/vướng</option>
                                    </select>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Loại khách hàng</label>
                                    <select 
                                      className={cn(
                                        "w-full rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-festive-gold/20 transition-all",
                                        theme === 'light' ? "bg-slate-50 border border-slate-200 text-slate-900" : "bg-slate-900 border border-slate-800 text-white"
                                      )}
                                      value={filterLoanStatus}
                                      onChange={(e) => { setFilterLoanStatus(e.target.value as any); setCurrentPage(0); }}
                                    >
                                      <option value="ALL">Tất cả (Vay + Vốn tự có)</option>
                                      <option value="Co_Vay">Khách hàng vay</option>
                                      <option value="Khong_Vay">Khách sử dụng vốn tự có</option>
                                    </select>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Tự làm sổ</label>
                                    <select 
                                      className={cn(
                                        "w-full rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-festive-gold/20 transition-all",
                                        theme === 'light' ? "bg-slate-50 border border-slate-200 text-slate-900" : "bg-slate-900 border border-slate-800 text-white"
                                      )}
                                      value={filterSelfService}
                                      onChange={(e) => { setFilterSelfService(e.target.value as any); setCurrentPage(0); }}
                                    >
                                      <option value="ALL">Tất cả</option>
                                      <option value="YES">Khách tự làm</option>
                                      <option value="NO">Công ty làm</option>
                                    </select>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Tiến độ SLA</label>
                                    <select 
                                      className={cn(
                                        "w-full rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-festive-gold/20 transition-all",
                                        theme === 'light' ? "bg-slate-50 border border-slate-200 text-slate-900" : "bg-slate-900 border border-slate-800 text-white"
                                      )}
                                      value={filterSLAStatus}
                                      onChange={(e) => { setFilterSLAStatus(e.target.value as any); setCurrentPage(0); }}
                                    >
                                      <option value="ALL">Tất cả tiến độ</option>
                                      <option value="OVERDUE">Quá hạn SLA</option>
                                    </select>
                                  </div>
                                </div>
                              </div>

                              <div className="pt-4 border-t border-slate-800/10 grid grid-cols-2 gap-3 mt-auto">
                                <button 
                                  onClick={() => {
                                    setSelectedProjectId(null);
                                    setFilterStatus('ALL');
                                    setFilterLoanStatus('ALL');
                                    setFilterSelfService('ALL');
                                    setFilterSLAStatus('ALL');
                                    setFilterIssue('ALL');
                                    setSelectedFlags([]);
                                    setSearch('');
                                    setDashboardFilter('ALL');
                                    setCurrentPage(0);
                                    setIsShowFilters(false);
                                  }}
                                  className={cn(
                                    "py-3 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all active:scale-[0.98]",
                                    theme === 'light' 
                                      ? "border-slate-200 text-slate-600 hover:bg-slate-50" 
                                      : "border-slate-800 text-slate-400 hover:bg-slate-900/40"
                                  )}
                                >
                                  Xóa lọc
                                </button>
                                <button 
                                  onClick={() => setIsShowFilters(false)}
                                  className="py-3 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-indigo-600/15 transition-all active:scale-[0.98]"
                                >
                                  Áp dụng
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  
                  {/* Bulk Actions Bar (Floating) */}
                  <AnimatePresence>
                    {selectedAppIds.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className={cn(
                          "fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-1 p-2 border rounded-3xl backdrop-blur-xl ring-1 shadow-2xl transition-all",
                          theme === 'light' ? "bg-white/90 border-slate-200 ring-slate-900/5 shadow-slate-900/10 text-slate-800" : "bg-slate-950/90 border-slate-800 ring-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-slate-200"
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
                              
                              // Step 7.2 Quy_trinh_2 custom logic
                              if (workflowType === 'Quy_trinh_2' && firstApp.currentStep === 'S7_2_Ban_Giao_Khach') {
                                 if (userRole === 'PTT' || isManagementEdit) {
                                    return (
                                       <button 
                                        onClick={() => handleBulkStepTransition('Hoan_Tat')}
                                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all"
                                      >
                                        Xác nhận Giao Khách & Hoàn tất
                                      </button>
                                    )
                                 }
                                 return null;
                              }
                              
                              if (nextStep && (isManagementEdit || effectiveDept === userRole || (firstApp.currentStep === 'S1_ChuanBi' && userRole === 'PTT') || (firstApp.currentStep === 'GD1_ChuanBi' && userRole === 'PTT'))) {
                                return (
                                  <button 
                                    onClick={() => handleBulkStepTransition(nextStep)}
                                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all"
                                  >
                                    Chuyển tiếp {(stepConfig[nextStep] || INITIAL_STEP_CONFIG[nextStep])?.label} &rarr;
                                  </button>
                                );
                              }
                            } else {
                              return <span className="text-[10px] font-bold text-slate-500 italic pr-4">Chọn các hồ sơ cùng bước/luồng để thao tác</span>;
                            }
                            return null;
                          })()}
                        </div>
                          
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

                          {(isManagementEdit || userRole === 'PTT') && (
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

                          <button 
                            onClick={() => setSelectedAppIds([])}
                            className={cn(
                              "w-10 h-10 rounded-full transition-all flex items-center justify-center border ml-2",
                              theme === 'light' ? "bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border-slate-200" : "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700/50"
                            )}
                            title="Hủy chọn"
                          >
                            <X size={16} />
                          </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="overflow-auto max-h-[calc(100vh-180px)] relative border-t border-slate-800/10">
                    <table className="w-full text-left border-separate border-spacing-0">
                      <thead className="sticky top-0 z-20">
                        <tr className={cn(
                          "transition-all border-b font-black uppercase tracking-tighter text-[10px]",
                          theme === 'light' ? "bg-slate-100 text-slate-500" : "bg-slate-950 text-slate-400"
                        )}>
                          <th className="px-2 py-2 w-10 border-b border-slate-800/10">
                            <input 
                              type="checkbox" 
                              className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 accent-festive-gold"
                              checked={selectedRows.size === applications.length && applications.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  const allIds = applications.map(a => a.id);
                                  setSelectedAppIds(allIds);
                                  setSelectedRows(new Set(allIds));
                                } else {
                                  setSelectedAppIds([]);
                                  setSelectedRows(new Set());
                                }
                              }}
                            />
                          </th>
                          <th className="px-2 py-2 border-b border-slate-800/10">Mã căn</th>
                          <th className="px-2 py-2 border-b border-slate-800/10">Dự án</th>
                          <th className="px-2 py-2 border-b border-slate-800/10">Khách hàng</th>
                          {isSpreadsheetMode ? (
                            EDITABLE_DATE_FIELDS.map(f => (
                              <th key={f.key} className="px-2 py-2 text-center whitespace-nowrap bg-indigo-500/5 border-b border-slate-800/10">{f.label}</th>
                            ))
                          ) : (
                            <>
                              <th className="px-2 py-2 border-b border-slate-800/10">Loại lô</th>
                              <th className="px-2 py-2 border-b border-slate-800/10">Trạng thái</th>
                              <th className="px-2 py-2 text-center border-b border-slate-800/10">Cơ quan</th>
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
                        ) : filteredApps.length === 0 ? (
                          <tr>
                            <td colSpan={13} className="px-6 py-12 text-center text-slate-500 italic font-medium">
                               <div className="flex flex-col items-center gap-4 opacity-40">
                                  <Files size={40} />
                                  <p className="text-sm">Không tìm thấy hồ sơ nào phù hợp với bộ lọc hiện tại.</p>
                               </div>
                            </td>
                          </tr>
                        ) : filteredApps.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map((app, index) => {
                          const overdue = getOverdueInfo(app, stepConfig, slaConfig);
                          const isEven = index % 2 === 1;
                          const isFocused = selectedIndex === index;
                          const isSelected = selectedRows.has(app.id) || selectedAppIds.includes(app.id);
                          
                          return (
                            <tr 
                              key={`app-row-${app.id}-${currentPage}-${index}`} 
                              ref={el => tableRowRefs.current[index] = el}
                              className={cn(
                                "transition-all cursor-pointer group border-b relative h-[32px]",
                                isFocused && (theme === 'light' ? "bg-indigo-50/80 ring-1 ring-inset ring-indigo-500/20 z-10" : "bg-indigo-900/20 ring-1 ring-inset ring-indigo-400/30 z-10"),
                                !isFocused && isSelected && (theme === 'light' ? "bg-festive-gold/10" : "bg-festive-gold/15"),
                                theme === 'light' 
                                  ? (!isFocused && !isSelected ? (isEven ? "bg-slate-50/50 hover:bg-indigo-50/20 border-slate-100" : "bg-white hover:bg-indigo-50/20 border-slate-100") : "")
                                  : (!isFocused && !isSelected ? (isEven ? "bg-slate-900/20 hover:bg-indigo-950/20 border-slate-800/40" : "bg-transparent hover:bg-indigo-950/20 border-slate-800/40") : "")
                              )}
                              onClick={(e) => {
                                setSelectedIndex(index);
                                if (e.shiftKey && lastSelectedIndex !== null) {
                                  const visibleApps = filteredApps.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
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
                              onDoubleClick={() => setSelectedApp(app)}
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
                                className="px-2 py-0 text-[11px] font-bold font-mono tracking-tighter" 
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
                                        "px-2 py-0 h-6 text-[11px] font-black font-mono rounded border outline-none focus:ring-1 focus:ring-festive-gold/50 w-full",
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
                                      <span className={cn("text-[12px] font-black tracking-tight", theme === 'light' ? "text-slate-900" : "text-white")}>{app.unitCode}</span>
                                      {app.isRejected && app.currentStep === 'S1_ChuanBi' && (
                                        <span className="animate-pulse flex items-center gap-1 text-[9px] bg-rose-500 text-white px-1 py-0.5 rounded-full font-bold uppercase tracking-tight">
                                          <RotateCcw size={8} /> Trả về
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  <span className="text-[9px] text-slate-500 font-medium uppercase mt-0.5">
                                    SLA: {(stepConfig[app.currentStep] || INITIAL_STEP_CONFIG[app.currentStep])?.slaDays || 0}d
                                  </span>
                                  {overdue.isOverdue && (
                                    <span className={cn(
                                      "text-[9px] font-semibold uppercase tracking-tight flex items-center gap-1 mt-0.5",
                                      overdue.daysLate > 5 ? "text-red-500" :
                                      overdue.daysLate >= 3 ? "text-yellow-500" : "text-green-500"
                                    )}>
                                      <AlertTriangle size={9} /> Trễ ({overdue.daysLate}d)
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-2 py-0">
                                <span className={cn("text-[10px] font-medium truncate block max-w-[100px]", theme === 'light' ? "text-slate-600" : "text-slate-200")} title={app.projectName}>
                                  {app.projectName}
                                </span>
                              </td>
                              <td 
                                className="px-2 py-0 text-[11px] leading-tight" 
                                onDoubleClick={(e) => {
                                  e.stopPropagation();
                                  setQuickEditId(app.id);
                                  setQuickEditData({ unitCode: app.unitCode, customerName: app.customerName });
                                }}
                                onClick={() => quickEditId !== app.id && setSelectedApp(app)}
                              >
                                <div className="flex items-center gap-1.5">
                                  <div className={cn(
                                    "w-5 h-5 rounded-full flex items-center justify-center transition-all shrink-0",
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
                                      <span className={cn("text-xs font-medium truncate", theme === 'light' ? "text-slate-600" : "text-slate-300")}>{app.customerName}</span>
                                    )}
                                    <div className="flex gap-2 mt-0.5 items-center">
                                      <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">{formatDate(app.receivedDate)}</span>
                                      {app.loanStatus === 'Co_Vay' && <span className="text-[9px] bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 px-1.5 py-0.5 rounded font-medium uppercase">Có vay</span>}
                                      {app.isSelfService && <span className="text-[9px] bg-amber-500/10 text-amber-500 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium uppercase">Tự làm</span>}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              {isSpreadsheetMode ? (
                                EDITABLE_DATE_FIELDS.map(f => {
                                  const val = spreadsheetChanges[app.id]?.[f.key as keyof Application] ?? (app[f.key as keyof Application] ? formatDate(app[f.key as keyof Application] as string) : '');
                                  const hasError = spreadsheetErrors[app.id]?.[f.key];
                                  const isChanged = spreadsheetChanges[app.id]?.hasOwnProperty(f.key);
                                  const isActive = activeCell?.id === app.id && activeCell?.field === f.key;

                                  return (
                                    <td 
                                      key={f.key} 
                                      className={cn(
                                        "px-3 py-1.5 text-xs leading-tight border-x transition-all relative group/cell",
                                        theme === 'light' ? "border-slate-50" : "border-slate-800/20",
                                        isActive 
                                          ? (theme === 'light' 
                                              ? "ring-2 ring-indigo-500 bg-indigo-50/30 z-10 shadow-[0_0_15px_rgba(99,102,241,0.2)]" 
                                              : "ring-2 ring-indigo-400 bg-indigo-900/20 z-10 shadow-[0_0_15px_rgba(129,140,248,0.2)]") 
                                          : "",
                                        hasError ? "bg-rose-500/10" : (isChanged ? "bg-emerald-500/5" : "")
                                      )}
                                      onPaste={(e) => handleSpreadsheetPaste(e, app.id, f.key)}
                                      onClick={() => setActiveCell({ id: app.id, field: f.key })}
                                    >
                                      <input 
                                        type="text"
                                        placeholder="dd/mm/yyyy"
                                        className={cn(
                                          "w-full bg-transparent border-none outline-none text-xs leading-tight font-mono text-center placeholder:opacity-30",
                                          theme === 'light' ? "text-slate-600" : "text-slate-300",
                                          isActive ? "font-bold" : "",
                                          hasError ? "text-rose-500" : (isChanged ? "text-emerald-400 font-black" : "")
                                        )}
                                        value={val}
                                        onChange={(e) => handleSpreadsheetChange(app.id, f.key, e.target.value)}
                                        onKeyDown={(e) => {
                                          if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Tab'].includes(e.key)) {
                                            const isTab = e.key === 'Tab';
                                            const isShiftTab = isTab && e.shiftKey;
                                            
                                            // ArrowUp/Down/Left/Right/Enter and Tab/ShiftTab
                                            e.preventDefault();
                                            const currentIdx = filteredApps.findIndex(a => a.id === app.id);
                                            const currentFldIdx = EDITABLE_DATE_FIELDS.findIndex(fd => fd.key === f.key);
                                            
                                            let nextId = app.id;
                                            let nextFld = f.key;
                                            const isLastRow = currentIdx === filteredApps.length - 1;
                                            const isFirstRow = currentIdx === 0;
                                            const isLastField = currentFldIdx === EDITABLE_DATE_FIELDS.length - 1;
                                            const isFirstField = currentFldIdx === 0;

                                            if (e.key === 'ArrowUp' && !isFirstRow) {
                                              nextId = filteredApps[currentIdx - 1].id;
                                            } else if ((e.key === 'ArrowDown' || e.key === 'Enter') && !isLastRow) {
                                              nextId = filteredApps[currentIdx + 1].id;
                                            } else if (e.key === 'ArrowLeft' && !isFirstField) {
                                              nextFld = EDITABLE_DATE_FIELDS[currentFldIdx - 1].key;
                                            } else if (e.key === 'ArrowRight' && !isLastField) {
                                              nextFld = EDITABLE_DATE_FIELDS[currentFldIdx + 1].key;
                                            } else if (isTab && !isShiftTab) {
                                              if (isLastField) {
                                                if (!isLastRow) {
                                                  nextId = filteredApps[currentIdx + 1].id;
                                                  nextFld = EDITABLE_DATE_FIELDS[0].key;
                                                }
                                              } else {
                                                nextFld = EDITABLE_DATE_FIELDS[currentFldIdx + 1].key;
                                              }
                                            } else if (isShiftTab) {
                                              if (isFirstField) {
                                                if (!isFirstRow) {
                                                  nextId = filteredApps[currentIdx - 1].id;
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
                                      {app.contractSignerType || '---'}
                                    </span>
                                  </td>
                                  <td className="px-2 py-0">
                                    <div className="flex flex-col gap-0.5">
                                      <StatusBadge status={app.status} app={app} variant="compact" />
                                      {(app.status === 'Error' || app.isRejected || (app.issueType && app.issueType !== 'None')) && (
                                        <div className="flex items-center gap-1">
                                          <AlertTriangle size={8} className={cn(
                                            app.issueSeverity === 'Critical' ? "text-rose-600" : "text-amber-500"
                                          )} />
                                          <span className="text-[9px] font-medium truncate max-w-[80px] text-slate-400 uppercase tracking-tighter">
                                              {app.issueNotes || 'Vướng'}
                                          </span>
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
                                      <span className={cn("text-[10px] leading-tight font-mono", theme === 'light' ? "text-slate-500" : "text-slate-400")}>{formatDate(app.submissionDate)}</span>
                                    </td>
                                  )}
                                  {(userRole === 'PTT' || userRole === 'KT' || isManagement) && (
                                    <td className="px-2 py-0 text-center">
                                      <div className="flex flex-col items-center">
                                        <span className={cn("text-[10px] leading-tight font-mono", theme === 'light' ? "text-slate-500" : "text-slate-400")}>
                                          {app.taxReceiptDate ? formatDate(app.taxReceiptDate) : (app.taxNotificationReceivedDate ? 'Chờ nộp' : '---')}
                                        </span>
                                        <span className={cn("text-[8px] px-1 py-[1px] mt-[1px] rounded font-bold uppercase", getTaxStatus(app).color)}>
                                          {getTaxStatus(app).label}
                                        </span>
                                      </div>
                                    </td>
                                  )}
                                  {(userRole === 'PTDA' || isManagement) && (
                                    <td className="px-2 py-0 text-center">
                                      <span className={cn("text-[10px] leading-tight font-mono", theme === 'light' ? "text-slate-500" : "text-slate-400")}>{formatDate(app.gcnReceivedDate)}</span>
                                    </td>
                                  )}
                                  <td className="px-2 py-0 text-center">
                                    <span className={cn("text-[10px] font-mono", theme === 'light' ? "text-slate-500" : "text-slate-400")}>{formatDate(app.customerHandoverDate)}</span>
                                  </td>
                                </>
                              )}
                              <td className="px-2 py-0 text-center" onClick={(e) => {
                                e.stopPropagation();
                                if (app.scannedFiles && app.scannedFiles.length > 0) {
                                  setPreviewFile(app.scannedFiles[0]);
                                } else {
                                  setSelectedApp(app);
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
                                    onClick={() => setSelectedApp(app)}
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

            {activeTab === 'users' && (
              <motion.div 
                key="users"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="max-w-7xl mx-auto"
              >
                <UserManagementView 
                  users={users} 
                  onEdit={(u) => { setEditUser(u); setIsUserModalOpen(true); }} 
                  onDelete={handleDeleteUser} 
                  onCreate={() => { setEditUser(null); setIsUserModalOpen(true); }} 
                  onResetPassword={handleResetUserPassword}
                  theme={theme}
                />
              </motion.div>
            )}

            {activeTab === 'projects' && isManagementEdit && (
              <motion.div 
                key="projects"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="max-w-7xl mx-auto"
              >
                <ProjectManagementView 
                  projects={projects}
                  onCreate={() => {
                    setEditingProject(null);
                    setIsProjectModalOpen(true);
                  }}
                  onEdit={(p) => {
                    setEditingProject(p);
                    setIsProjectModalOpen(true);
                  }}
                  onDelete={async (id) => {
                    if (confirm("Bạn có chắc muốn xóa dự án này? Tất cả hồ sơ liên quan sẽ bị ảnh hưởng.")) {
                      try {
                        const updatedProjects = projects.filter(p => p.id !== id);
                        await handleSaveConfig('projects', updatedProjects);
                        setProjects(updatedProjects);
                      } catch (error) {
                        console.error('Delete project error:', error);
     showToast('Lỗi khi xóa dự án.', 'error');
                      }
                    }
                  }}
                  theme={theme}
                />
              </motion.div>
            )}

            {activeTab === 'reports' && (
              <motion.div 
                key="reports"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-7xl mx-auto"
              >
                <ReportsView 
                  applications={dashboardApps} 
                  projects={visibleProjects} 
                  regions={regions} 
                  theme={theme}
                  setActiveTab={setActiveTab}
                  setDashboardFilter={setDashboardFilter}
                  setFilterLoanStatus={setFilterLoanStatus}
                  stepConfig={stepConfig}
                  slaConfig={slaConfig}
                  reportType={reportType}
                  setReportType={setReportType}
                />
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-7xl mx-auto"
              >
                <SettingsView 
                  slaConfig={slaConfig} 
                  setSlaConfig={setSlaConfig} 
                  checklistTemplates={checklistTemplates} 
                  setChecklistTemplates={setChecklistTemplates}
                  stepConfig={stepConfig}
                  setStepConfig={setStepConfig}
                  handoverTemplate={handoverTemplate}
                  setHandoverTemplate={setHandoverTemplate}
                  theme={theme}
                  onSaveConfig={handleSaveConfig}
                  isLoading={isLoadingConfig}
                  storageStats={storageStats}
                  isFetchingStorage={isFetchingStorage}
                  onRefreshStorage={fetchStorageUsage}
                  onClearNotifications={clearAllAppNotifications}
                  onCleanupJunkFiles={cleanupJunkFiles}
                />
              </motion.div>
            )}
            {activeTab === 'resources' && (
              <motion.div 
                key="resources"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="max-w-6xl mx-auto space-y-12 pb-20 text-left"
              >
                <div className="relative p-12 rounded-[3.5rem] bg-indigo-600 overflow-hidden shadow-2xl">
                   <div className="absolute top-0 right-0 p-12 opacity-10">
                      <Files size={120} />
                   </div>
                   <div className="relative z-10 text-left space-y-4">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white/80 mb-2">
                        <CheckCircle2 size={12} /> Resource Center
                      </div>
                      <h2 className="text-5xl font-black text-white font-serif italic tracking-tight">Tra cứu & Biểu mẫu</h2>
                      <p className="text-sm text-indigo-100 font-medium max-w-xl">Trung tâm tài nguyên tập trung dành cho Chuyên viên và Lãnh đạo. Tải xuống các biểu mẫu chuẩn hoặc cập nhật tài liệu mới nhất lên hệ thống.</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className={cn(
                    "backdrop-blur-md p-10 rounded-[3rem] border shadow-2xl transition-all",
                    theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900/40 border-slate-800/50"
                  )}>
                    <div className="flex items-center gap-5 mb-10">
                      <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <CheckCircle2 size={28} className="text-white" />
                      </div>
                      <div>
                        <h3 className={cn("text-2xl font-black font-serif italic tracking-tight", theme === 'light' ? "text-slate-900" : "text-white")}>Checklist Hồ sơ chuẩn</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Quy định bắt buộc chuẩn bị hồ sơ</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {DOC_CHECKLIST_ITEMS.map((item, idx) => (
                        <div key={`${item}-${idx}`} className={cn(
                          "flex items-center gap-4 p-5 rounded-2xl border transition-all group",
                          theme === 'light' ? "bg-slate-50 border-slate-100 hover:border-amber-200" : "bg-slate-950/30 border-slate-800/30 hover:border-amber-500/30"
                        )}>
                          <div className={cn(
                            "w-8 h-8 rounded-full border flex items-center justify-center text-[12px] font-black transition-all",
                            theme === 'light' ? "bg-white border-slate-200 text-slate-400 group-hover:text-amber-500" : "bg-slate-900 border-slate-800 text-slate-600 group-hover:text-amber-500"
                          )}>
                            {idx + 1}
                          </div>
                          <span className={cn("text-sm font-bold", theme === 'light' ? "text-slate-700" : "text-slate-300")}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-10">
                    <div className={cn(
                      "backdrop-blur-md p-10 rounded-[3rem] border shadow-2xl transition-all",
                      theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900/40 border-slate-800/50"
                    )}>
                      <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Files size={28} className="text-white" />
                          </div>
                          <div>
                            <h3 className={cn("text-2xl font-black font-serif italic tracking-tight", theme === 'light' ? "text-slate-900" : "text-white")}>Biểu mẫu & Dữ liệu</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Tài liệu số & Export</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 mb-8">
                        {(userRole === 'ADMIN' || userRole === 'KT') && (
                          <button 
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.onchange = (e: any) => {
                                const file = e.target.files[0];
                                if (file) alert(`Hệ thống đã nhận biểu mẫu: ${file.name}. Đang xử lý tải lên...`);
                              };
                              input.click();
                            }}
                            className="flex-1 px-4 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
                          >
                            <Upload size={16} /> Tải biểu mẫu mới
                          </button>
                        )}
                        {userRole === 'ADMIN' && (
                          <button 
                            onClick={handleDownloadTemplate}
                            className="px-4 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 hover:bg-slate-50 transition-all font-bold"
                            title="Tải toàn bộ dữ liệu hồ sơ"
                          >
                            <FileSpreadsheet size={16} /> Data Export
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {[
                          { name: 'Mẫu 09/ĐK - Đơn đăng ký biến động', format: 'DOCX', size: '45KB' },
                          { name: 'Tờ khai lệ phí trước bạ nhà đất', format: 'PDF', size: '120KB' },
                          { name: 'Tờ khai thuế thu nhập cá nhân', format: 'PDF', size: '115KB' },
                          { name: 'Mẫu giấy ủy quyền nộp HS', format: 'DOCX', size: '32KB' }
                        ].map((doc, idx) => (
                          <button key={doc.name} className={cn(
                            "w-full flex items-center justify-between p-4 rounded-2xl border transition-all",
                            theme === 'light' ? "bg-slate-50 border-slate-100 hover:bg-slate-100" : "bg-slate-950/30 border-slate-800/30 hover:bg-slate-800/30"
                          )}>
                            <div className="flex items-center gap-3">
                              <div className={cn("text-[10px] font-black px-2 py-1 rounded-md", theme === 'light' ? "bg-slate-200 text-slate-600" : "bg-slate-800 text-slate-400")}>{doc.format}</div>
                              <span className={cn("text-sm font-medium", theme === 'light' ? "text-slate-700" : "text-slate-300")}>{doc.name}</span>
                            </div>
                            <Download size={16} className="text-slate-600" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={cn(
                      "backdrop-blur-md p-8 rounded-[2.5rem] border shadow-2xl flex items-center gap-6",
                      theme === 'light' ? "bg-white border-slate-200" : "bg-indigo-600/10 border-indigo-500/20"
                    )}>
                      <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-600/30 flex-shrink-0">
                        <HelpCircle size={32} className="text-white" />
                      </div>
                      <div>
                        <h3 className={cn("text-lg font-bold font-serif italic", theme === 'light' ? "text-slate-900" : "text-white")}>Cần hỗ trợ?</h3>
                        <p className={cn("text-xs leading-relaxed mt-1", theme === 'light' ? "text-slate-500" : "text-slate-400")}>Liên hệ phòng Công nghệ để được hướng dẫn sử dụng hoặc điều chỉnh phân quyền tài khoản của bạn.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedApp && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedApp(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full md:w-[750px] lg:w-[900px] bg-[#1E293B] z-50 shadow-2xl flex flex-col border-l border-slate-700"
            >
              <div className="p-8 border-b border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between bg-slate-900/50 gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-sm font-black uppercase tracking-widest border border-indigo-500/20">
                      {(editApp || selectedApp).unitCode}
                    </span>
                    <StatusBadge status={(editApp || selectedApp).status} app={editApp || selectedApp} />
                    <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-full text-xs font-bold border border-slate-700 flex items-center gap-1.5">
                      <Activity size={12} />
                      {stepConfig[(editApp || selectedApp).currentStep]?.label || (editApp || selectedApp).currentStep}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-100 italic font-serif">{(editApp || selectedApp).projectName}</h3>
                  <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                    <User size={14} className="text-slate-500" />
                    {(editApp || selectedApp).customerName}
                  </p>
                  
                  {((editApp || selectedApp).isRejected || (editApp || selectedApp).status === 'Error' || ((editApp || selectedApp).issueType && (editApp || selectedApp).issueType !== 'None')) && (
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-error/10 border border-error/20 text-error rounded-lg">
                        <AlertTriangle size={14} className="animate-pulse" />
                        <span className="text-xs font-bold">Vướng mắc: {(editApp || selectedApp).issueNotes || 'Có sai sót cần xử lý'}</span>
                        {(editApp || selectedApp).rejectionCount > 0 && <span className="ml-2 text-[10px] font-mono bg-error/20 px-1.5 py-0.5 rounded">Trả về: {(editApp || selectedApp).rejectionCount} lần</span>}
                      </div>
                      
                      {userCanEdit && (
                        <button 
                          onClick={() => handleResolveIssue((editApp || selectedApp).id)}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-md flex items-center gap-2"
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
                      onClick={() => setExpandedSections(expandedSections.length > 0 ? [] : ['PTT_SECTION', 'KT_SECTION', 'PTDA_SECTION', 'OTHER_SECTION'])}
                      className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase tracking-widest rounded-2xl transition-all border border-slate-700 mr-2"
                    >
                      {expandedSections.length > 0 ? 'Thu gọn' : 'Mở rộng tất cả'}
                    </button>
                  )}
                  {!isEditing ? (
                    userCanEdit && (
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
                    <div className="flex items-center gap-2">
                       <button 
                        onClick={() => {
                          setIsEditing(false);
                          setEditApp(null);
                        }}
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase tracking-widest rounded-2xl transition-all border border-slate-700"
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
                  )}

                  <button 
                    onClick={() => {
                      setPrintHandoverApps([editApp || selectedApp]);
                      setIsPrintingHandover(true);
                      setTimeout(() => window.print(), 500);
                    }}
                    className="p-3 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white rounded-2xl transition-all border border-indigo-500/20"
                    title="In phiếu bàn giao"
                  >
                    <Printer size={18} />
                  </button>
                  
                  {userRole === 'ADMIN' && (
                    <button 
                      onClick={() => handleDeleteApp((editApp || selectedApp).id, (editApp || selectedApp).unitCode)}
                      className="p-3 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-2xl transition-all border border-rose-500/20"
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
                    className="p-3 hover:bg-slate-800 rounded-2xl transition-colors text-slate-500 border border-transparent hover:border-slate-700"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                {(editApp || selectedApp).isRejected && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4 mb-6"
                  >
                    <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/20">
                      <RotateCcw size={20} className="text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Hồ sơ Cần bổ sung / Sửa đổi</p>
                        <span className="text-[10px] font-mono text-rose-400 bg-rose-500/5 px-2 py-0.5 rounded border border-rose-500/10">Lần {(editApp || selectedApp).rejectionCount}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-200">{(editApp || selectedApp).rejectionReason}</p>
                      <p className="text-[10px] text-slate-500 mt-2 italic font-medium">Báo cáo bời bộ phận Kế toán. Vui lòng cập nhật thông tin và bàn giao lại.</p>
                    </div>
                  </motion.div>
                )}

                {(() => {
                  const overdueInfo = getOverdueInfo(editApp || selectedApp, stepConfig, slaConfig);
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
                          <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Hồ sơ quá hạn SLA xử lý</p>
                        </div>
                        <p className="text-sm font-bold text-amber-400">Trễ hạn bước: {overdueInfo.label} ({overdueInfo.daysLate} ngày quá hạn)</p>
                        <p className="text-[10px] text-slate-500 mt-2 italic font-medium">Cảnh báo chậm trễ hiệu suất hệ thống. Vui lòng kiểm tra tiến độ giải quyết hồ sơ.</p>
                      </div>
                    </motion.div>
                  );
                })()}

                {/* Workflow Tracker - Wider Display */}
                <section className={cn(
                  "p-8 rounded-[2.5rem] border relative overflow-hidden backdrop-blur-md",
                  theme === 'dark' ? "bg-slate-900/40 border-slate-800/50" : "bg-white border-slate-200 shadow-sm"
                )}>
                   <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -mr-32 -mt-32"></div>
                  <div className="flex items-center justify-between mb-8">
                    <h4 className={cn("text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2", theme === 'dark' ? "text-slate-500" : "text-slate-400")}>
                       <Activity size={14} className="text-indigo-500" />
                       Bản đồ quy trình thực hiện
                    </h4>
                  </div>
                  
                  <div className="relative pt-4 pb-12 px-6">
                    {/* Background Line */}
                    <div className={cn("absolute top-[26px] left-10 right-10 h-1 rounded-full", theme === 'dark' ? "bg-slate-800" : "bg-slate-200")}></div>
                    
                    <div className="flex justify-between relative z-10">
                      {['01', '02', '03', '04', '05', '06', '07'].map((label, idx) => {
                        const appData = editApp || selectedApp;
                        const currentPhase = getPhaseIndex(appData.currentStep);
                        const isCompleted = idx < currentPhase || appData.currentStep === 'Hoan_Tat';
                        const isActive = idx === currentPhase && appData.currentStep !== 'Hoan_Tat';
                        
                        // Nếu là Quy_trinh_1 thì không hiện label 07 (Hoàn tất không có icon riêng),
                        // Nhưng mà Hoan_Tat là phase 6, tức là index 6 (07).
                        
                        return (
                          <div key={label} className={cn("flex flex-col items-center gap-4", appData.workflowType === 'Quy_trinh_1' && label === '07' ? "hidden" : "")}>
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-700 text-sm font-black border-2",
                              isCompleted ? "bg-emerald-500 border-emerald-500 text-slate-900 rotate-12" : 
                              isActive ? "bg-indigo-600 border-indigo-400 text-white shadow-[0_0_30px_rgba(99,102,241,0.4)] scale-125 -rotate-3" : 
                              theme === 'dark' ? "bg-slate-900 border-slate-800 text-slate-700 hover:border-slate-700" : "bg-slate-100 border-slate-200 text-slate-400 hover:border-slate-300"
                            )}>
                              {isCompleted ? <Check size={24} /> : label}
                            </div>
                            <span className={cn(
                              "text-[10px] font-black uppercase tracking-widest absolute -bottom-2 whitespace-nowrap text-center max-w-[60px]",
                              isActive ? "text-indigo-400" : isCompleted ? (theme === 'dark' ? "text-emerald-400" : "text-emerald-600") : (theme === 'dark' ? "text-slate-600" : "text-slate-400")
                            )}>
                              {appData.workflowType === 'Quy_trinh_1' ? (
                                <>
                                  {label === '01' && 'Chuẩn bị'}
                                  {label === '02' && 'Nộp VPĐK'}
                                  {label === '03' && 'TB Thuế'}
                                  {label === '04' && 'Cấp SN/NVTC'}
                                  {label === '05' && 'Lấy GCN'}
                                  {label === '06' && 'Bàn Giao'}
                                </>
                              ) : (
                                <>
                                  {label === '01' && 'Chuẩn bị'}
                                  {label === '02' && 'Chờ nộp'}
                                  {label === '03' && 'Nộp VPĐK'}
                                  {label === '04' && 'Thông báo'}
                                  {label === '05' && 'Tài chính'}
                                  {label === '06' && 'Nhận sổ'}
                                  {label === '07' && 'Bàn giao'}
                                </>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={cn(
                      "flex items-start gap-4 p-5 rounded-3xl border transition-colors",
                      theme === 'dark' ? "bg-indigo-500/5 border-indigo-500/10" : "bg-indigo-50/50 border-indigo-100"
                    )}>
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-500 flex items-center justify-center shrink-0">
                        <Clock size={24} />
                      </div>
                      <div>
                        <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1.5 opacity-70", theme === 'dark' ? "text-indigo-400" : "text-indigo-600")}>Bước hiện tại:</p>
                        <p className={cn("text-base font-black uppercase tracking-tight", theme === 'dark' ? "text-slate-100" : "text-slate-900")}>
                          {stepConfig[(editApp || selectedApp).currentStep]?.label}
                        </p>
                      </div>
                    </div>
                    <div className={cn(
                      "flex items-start gap-4 p-5 rounded-3xl border transition-colors",
                      theme === 'dark' ? "bg-slate-800/30 border-slate-700/30" : "bg-slate-100/50 border-slate-200"
                    )}>
                       <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", theme === 'dark' ? "bg-slate-800 text-slate-500" : "bg-slate-200 text-slate-500")}>
                        <Users size={24} />
                      </div>
                      <div>
                        <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1.5 opacity-70", theme === 'dark' ? "text-slate-500" : "text-slate-400")}>Phòng chủ trì:</p>
                        <p className={cn("text-base font-black uppercase tracking-tight", theme === 'dark' ? "text-slate-300" : "text-slate-700")}>
                          {(() => {
                            const app = editApp || selectedApp;
                            const isSupportSpecial = (app?.projectName?.includes('hỗ trợ') || app?.workflowType === 'Quy_trinh_1') && (app?.currentStep === 'GD2_Cho_Nop_VPDK' || app?.currentStep === 'S3_Nop_VPDK');
                            return isSupportSpecial ? 'KT' : (stepConfig[app?.currentStep || '']?.dept || '---');
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="grid grid-cols-1 gap-6">
                   {/* PTT Section */}
                   <div className={cn("border rounded-3xl overflow-hidden transition-all", theme === 'dark' ? "border-slate-800 bg-slate-900/20" : "border-slate-200 bg-white")}>
                     <div 
                       className={cn("flex flex-wrap items-center justify-between p-5 cursor-pointer hover:bg-indigo-500/5 transition-colors", expandedSections.includes('PTT_SECTION') && (theme === 'dark' ? "border-b border-slate-800" : "border-b border-slate-200"))}
                       onClick={() => toggleSection('PTT_SECTION')}
                     >
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                            <h4 className={cn("text-sm font-black uppercase tracking-widest", theme === 'dark' ? "text-white" : "text-slate-900")}>1. Thủ tục & Khách hàng (PTT)</h4>
                        </div>
                        <div className="flex items-center gap-4">
                           {userRole === 'PTT' && <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full font-black uppercase border border-indigo-500/20">Vùng của bạn</span>}
                           {expandedSections.includes('PTT_SECTION') ? <ChevronUp size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
                        </div>
                     </div>
                     <AnimatePresence>
                       {expandedSections.includes('PTT_SECTION') && (
                         <motion.div
                           initial={{ height: 0, opacity: 0 }}
                           animate={{ height: 'auto', opacity: 1 }}
                           exit={{ height: 0, opacity: 0 }}
                           className="overflow-hidden"
                         >
                           <div className="p-6 space-y-10">
                              {/* Row 1: Master Info */}
                              <section className="space-y-6">
                                <div className={cn("flex items-center justify-between border-b pb-4", theme === 'dark' ? "border-slate-800/50" : "border-slate-200")}>
                                  <div className="flex items-center gap-3">
                                    <div className="w-1 h-6 bg-indigo-500 rounded-full opacity-50"></div>
                                    <h4 className={cn("text-sm font-black uppercase tracking-widest", theme === 'dark' ? "text-slate-300" : "text-slate-700")}>Thông tin Khách hàng</h4>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  <DetailCard theme={theme} label="Mã lô/căn" value={(editApp || selectedApp).unitCode} isEditing={isEditing} />
                                  <DetailCard theme={theme} label="Dự án" value={(editApp || selectedApp).projectName} isEditing={isEditing} />
                                  <DetailCard theme={theme}
                                    label="Tên khách hàng" 
                                    value={(editApp || selectedApp).customerName} 
                                    editable={isFieldEditable('customerName')}
                                    isEditing={isEditing}
                                    onChange={(val) => handleFieldChange('customerName', val)}
                                  />
                                  <DetailCard theme={theme}
                                    label="Đối tượng ký HĐCN" 
                                    value={(editApp || selectedApp).contractSignerType} 
                                    editable={isFieldEditable('contractSignerType')}
                                    isEditing={isEditing}
                                    onChange={(val) => handleFieldChange('contractSignerType', val)}
                                  />
                                  <DetailCard theme={theme}
                                    label="Số điện thoại" 
                                    value={(editApp || selectedApp).phoneNumber} 
                                    editable={isFieldEditable('phoneNumber')}
                                    isEditing={isEditing}
                                    onChange={(val) => handleFieldChange('phoneNumber', val)}
                                  />
                                  <DetailCard theme={theme}
                                    label="Loại tài sản" 
                                    value={(editApp || selectedApp).propertyType === 'Dat_Nen' ? 'Quyền sử dụng đất (Nhà đất/Đất nền)' : 'Căn hộ'} 
                                    type="select"
                                    editable={isFieldEditable('propertyType')}
                                    isEditing={isEditing}
                                    options={['Quyền sử dụng đất (Nhà đất/Đất nền)', 'Căn hộ']}
                                    onChange={(val) => handleFieldChange('propertyType', val === 'Căn hộ' ? 'Can_Ho' : 'Dat_Nen')}
                                  />
                                  <DetailCard theme={theme}
                                    label="Sử dụng gói vay" 
                                    value={(editApp || selectedApp).loanStatus === 'Co_Vay' ? 'Có vay' : 'Không vay'} 
                                    type="select"
                                    editable={isFieldEditable('loanStatus')}
                                    isEditing={isEditing}
                                    options={['Có vay', 'Không vay']}
                                    onChange={(val) => handleFieldChange('loanStatus', val === 'Có vay' ? 'Co_Vay' : 'Khong_Vay')}
                                  />
                                  <DetailCard theme={theme}
                                    label="Ngày ký HĐCN/HĐMB" 
                                    value={(editApp || selectedApp).contractSigningDate} 
                                    type="date"
                                    editable={isFieldEditable('contractSigningDate')}
                                    isEditing={isEditing}
                                    onChange={(val) => handleFieldChange('contractSigningDate', val)}
                                  />
                                  {(editApp || selectedApp).loanStatus === 'Co_Vay' && (
                                    <DetailCard theme={theme}
                                      label="Ngày cam kết hoàn thành (Ngân hàng)" 
                                      value={(editApp || selectedApp).bankCommitmentDeadline} 
                                      type="date"
                                      editable={isFieldEditable('bankCommitmentDeadline')}
                                      isEditing={isEditing}
                                      onChange={(val) => handleFieldChange('bankCommitmentDeadline', val)}
                                    />
                                  )}
                                </div>
                               </section>

                               {/* Checklist - Visible to ADMIN/MANAGER/PTT */}
                               {isFieldVisible('checklist') && (
                                 <section className="space-y-4">
                                   <div className="flex items-center gap-3 border-b border-slate-800/30 pb-2">
                                     <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Danh mục hồ sơ gốc</h4>
                                   </div>
                                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                                     {['HĐMB/HĐCN Gốc', 'Văn bản chuyển nhượng', 'Lệ phí trước bạ', 'Sổ hộ khẩu/CCCD', 'Giấy xác nhận tình trạng hôn nhân'].map((item) => {
                                       const checklist = (editApp || selectedApp).checklist || {};
                                       const isChecked = !!checklist[item];
                                       return (
                                         <div 
                                           key={item}
                                           onClick={() => {
                                             if (!isEditing || !isFieldEditable('checklist')) return;
                                             handleFieldChange('checklist', {
                                               ...checklist,
                                               [item]: !isChecked
                                             });
                                           }}
                                           className={cn(
                                             "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                                             isChecked 
                                               ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" 
                                               : "bg-slate-800/20 border-slate-800/50 text-slate-500 hover:border-slate-700"
                                           )}
                                         >
                                           <div className={cn(
                                             "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                                             isChecked ? "bg-indigo-500 border-indigo-500 text-white" : "border-slate-700"
                                           )}>
                                             {isChecked && <Check size={12} strokeWidth={4} />}
                                           </div>
                                           <span className="text-[11px] font-bold uppercase tracking-wide">{item}</span>
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
                   <div className={cn("border rounded-3xl overflow-hidden transition-all", theme === 'dark' ? "border-slate-800 bg-slate-900/20" : "border-slate-200 bg-white")}>
                      <div 
                        className={cn("flex flex-wrap items-center justify-between p-5 cursor-pointer hover:bg-emerald-500/5 transition-colors", expandedSections.includes('PROGRESS_SECTION') && (theme === 'dark' ? "border-b border-slate-800" : "border-b border-slate-200"))}
                        onClick={() => toggleSection('PROGRESS_SECTION')}
                      >
                         <div className="flex items-center gap-3">
                             <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                             <h4 className={cn("text-sm font-black uppercase tracking-widest", theme === 'dark' ? "text-white" : "text-slate-900")}>2. TIẾN TRÌNH XỬ LÝ HỒ SƠ</h4>
                         </div>
                         <div className="flex items-center gap-4">
                            {['KT', 'PTDA'].includes(userRole) && <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full font-black uppercase border border-emerald-500/20">Vùng trọng tâm của bạn</span>}
                            {expandedSections.includes('PROGRESS_SECTION') ? <ChevronUp size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
                         </div>
                      </div>
                      <AnimatePresence>
                        {expandedSections.includes('PROGRESS_SECTION') && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-6 space-y-10">
                               {/* Step 2/GĐ1 */}
                               <section className="space-y-4">
                                 <div className="flex items-center gap-2 border-b border-slate-800/30 pb-2">
                                   <div className="w-1 h-3 bg-emerald-500 rounded-full opacity-50"></div>
                                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                     {(editApp || selectedApp).workflowType === 'Quy_trinh_1' ? 'GĐ1: BÀN GIAO & TIẾP NHẬN' : 'Bước 2: CHỜ NỘP VPĐK (KT)'}
                                   </h4>
                                 </div>
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                   <DetailCard theme={theme}
                                     label="(*) Ngày ký HĐCN/HĐMB" 
                                     value={(editApp || selectedApp).contractSigningDate} 
                                     type="date"
                                     editable={isFieldEditable('contractSigningDate')}
                                     isEditing={isEditing}
                                     onChange={(val) => handleFieldChange('contractSigningDate', val)}
                                   />
                                 </div>
                               </section>

                               {/* Step 3/GĐ2 */}
                               <section className="space-y-4">
                                 <div className="flex items-center gap-2 border-b border-slate-800/30 pb-2">
                                   <div className="w-1 h-3 bg-emerald-500 rounded-full opacity-50"></div>
                                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                     {(editApp || selectedApp).workflowType === 'Quy_trinh_1' ? 'GĐ2: NỘP VPĐK THEO DÕI THUẾ' : 'Bước 3: NỘP VPĐK (PTDA)'}
                                   </h4>
                                 </div>
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                   <DetailCard theme={theme}
                                     label="(*) Nơi nộp hồ sơ" 
                                     value={(editApp || selectedApp).submissionLocation === 'TP_DANANG' ? 'VPĐK Thành phố' : (editApp || selectedApp).submissionLocation === 'PHUONG' ? 'VPĐK Quận/Huyện/Phường' : undefined} 
                                     type="select"
                                     options={['---', 'VPĐK Thành phố', 'VPĐK Quận/Huyện/Phường']}
                                     editable={isFieldEditable('submissionLocation')}
                                     isEditing={isEditing}
                                     onChange={(val) => handleFieldChange('submissionLocation', val === 'VPĐK Thành phố' ? 'TP_DANANG' : (val === 'VPĐK Quận/Huyện/Phường' ? 'PHUONG' : null))}
                                   />
                                   <DetailCard theme={theme}
                                     label="(*) Mã HS / Số phiếu hẹn" 
                                     value={(editApp || selectedApp).vpdkCode} 
                                     editable={isFieldEditable('vpdkCode')}
                                     isEditing={isEditing}
                                     onChange={(val) => handleFieldChange('vpdkCode', val)}
                                   />
                                   <DetailCard theme={theme}
                                     label="(*) Ngày nộp VPĐK" 
                                     value={(editApp || selectedApp).submissionDate} 
                                     type="date"
                                     editable={isFieldEditable('submissionDate')}
                                     isEditing={isEditing}
                                     onChange={(val) => handleFieldChange('submissionDate', val)}
                                   />
                                 </div>
                               </section>

                               {/* Step 4/GĐ3 */}
                               <section className="space-y-4">
                                 <div className="flex items-center gap-2 border-b border-slate-800/30 pb-2">
                                   <div className="w-1 h-3 bg-emerald-500 rounded-full opacity-50"></div>
                                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                     {(editApp || selectedApp).workflowType === 'Quy_trinh_1' ? 'GĐ3: THÔNG BÁO THUẾ' : 'Bước 4: THÔNG BÁO THUẾ (PTDA)'}
                                   </h4>
                                 </div>
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                   <DetailCard theme={theme}
                                     label="Ngày TB Thuế" 
                                     value={(editApp || selectedApp).taxNotificationDate} 
                                     type="date"
                                     editable={isFieldEditable('taxNotificationDate')}
                                     isEditing={isEditing}
                                     onChange={(val) => handleFieldChange('taxNotificationDate', val)}
                                   />
                                   {(editApp || selectedApp).workflowType !== 'Quy_trinh_1' && (
                                     <DetailCard theme={theme}
                                       label="Ngày cung cấp TB Thuế" 
                                       value={(editApp || selectedApp).taxNoticeProvisionDate} 
                                       type="date"
                                       editable={isFieldEditable('taxNoticeProvisionDate')}
                                       isEditing={isEditing}
                                       onChange={(val) => handleFieldChange('taxNoticeProvisionDate', val)}
                                     />
                                   )}
                                 </div>
                               </section>

                               {/* Step 5/GĐ4 */}
                               <section className="space-y-4">
                                 <div className="flex items-center gap-2 border-b border-slate-800/30 pb-2">
                                   <div className="w-1 h-3 bg-emerald-500 rounded-full opacity-50"></div>
                                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                     {(editApp || selectedApp).workflowType === 'Quy_trinh_1' ? 'GĐ4: HOÀN THÀNH NVTC & LẤY SỔ' : 'Bước 5: NỘP THUẾ & TÀI CHÍNH (KT)'}
                                   </h4>
                                 </div>
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                   <DetailCard theme={theme}
                                     label="Ngày nhận/cung cấp GNT / Nộp thuế" 
                                     value={(editApp || selectedApp).taxReceiptDate} 
                                     type="date"
                                     editable={isFieldEditable('taxReceiptDate')}
                                     isEditing={isEditing}
                                     onChange={(val) => handleFieldChange('taxReceiptDate', val)}
                                   />
                                 </div>
                               </section>

                               {/* Step 6/GĐ5 */}
                               <section className="space-y-4">
                                 <div className="flex items-center gap-2 border-b border-slate-800/30 pb-2">
                                   <div className="w-1 h-3 bg-emerald-500 rounded-full opacity-50"></div>
                                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                     {(editApp || selectedApp).workflowType === 'Quy_trinh_1' ? 'GĐ5: TRÌNH KÝ & NHẬN GCN THỰC TẾ' : 'Bước 6: TRÌNH KÝ & NHẬN GCN (PTDA)'}
                                   </h4>
                                 </div>
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                   <DetailCard theme={theme}
                                     label="Ngày trình ký/In GCN" 
                                     value={(editApp || selectedApp).gcnSignedDate} 
                                     type="date"
                                     editable={isFieldEditable('gcnSignedDate')}
                                     isEditing={isEditing}
                                     onChange={(val) => handleFieldChange('gcnSignedDate', val)}
                                   />
                                   <DetailCard theme={theme}
                                     label="Ngày nhận GCN thực tế" 
                                     value={(editApp || selectedApp).gcnReceivedDate} 
                                     type="date"
                                     editable={isFieldEditable('gcnReceivedDate')}
                                     isEditing={isEditing}
                                     onChange={(val) => handleFieldChange('gcnReceivedDate', val)}
                                   />
                                 </div>
                               </section>

                               {/* Step 7/GĐ6 */}
                               <section className="space-y-4">
                                 <div className="flex items-center gap-2 border-b border-slate-800/30 pb-2">
                                   <div className="w-1 h-3 bg-emerald-500 rounded-full opacity-50"></div>
                                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                     {(editApp || selectedApp).workflowType === 'Quy_trinh_1' ? 'GĐ6: BÀN GIAO KHÁCH HÀNG' : 'Bước 7: BÀN GIAO'}
                                   </h4>
                                 </div>
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                   <DetailCard theme={theme}
                                     label="Ngày bàn giao GCN cho PTT" 
                                     value={(editApp || selectedApp).ptdaHandoverDate} 
                                     type="date"
                                     editable={isFieldEditable('ptdaHandoverDate')}
                                     isEditing={isEditing}
                                     onChange={(val) => handleFieldChange('ptdaHandoverDate', val)}
                                   />
                                   <DetailCard theme={theme}
                                     label="(*) Ngày BG GCN cho khách" 
                                     value={(editApp || selectedApp).customerHandoverDate} 
                                     type="date"
                                     editable={isFieldEditable('customerHandoverDate')}
                                     isEditing={isEditing}
                                     onChange={(val) => handleFieldChange('customerHandoverDate', val)}
                                   />
                                 </div>
                               </section>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                   </div>

                   {/* VƯỚNG MẮC & LỊCH SỬ HỒ SƠ */}
                   <div className={cn("border rounded-3xl overflow-hidden transition-all", theme === 'dark' ? "border-slate-800 bg-slate-900/20" : "border-slate-200 bg-white")}>
                      <div 
                        className={cn("flex flex-wrap items-center justify-between p-5 transition-colors", theme === 'dark' ? "border-b border-slate-800" : "border-b border-slate-200")}
                      >
                         <div className="flex items-center gap-3">
                             <div className="w-1.5 h-6 bg-slate-500 rounded-full"></div>
                             <h4 className={cn("text-sm font-black uppercase tracking-widest", theme === 'dark' ? "text-white" : "text-slate-900")}>3. Vướng mắc & Lịch sử Hồ sơ</h4>
                         </div>
                      </div>
                      <div className="p-6 space-y-6">
                         {/* Tabs for Issue Tracking/History/Documents */}
                               <div className="flex items-center gap-2 p-1 bg-slate-900/50 rounded-xl border border-slate-800 w-fit">
                                  <button 
                                    onClick={() => setDetailTab('Issues')}
                                    className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2", detailTab === 'Issues' ? "bg-red-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300")}
                                  >
                                    <AlertTriangle size={14} /> Vướng mắc
                                  </button>
                                  <button 
                                    onClick={() => setDetailTab('History')}
                                    className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2", detailTab === 'History' ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300")}
                                  >
                                    <History size={14} /> Nhật ký & Lịch sử
                                  </button>
                                  <button 
                                    onClick={() => setDetailTab('Documents')}
                                    className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2", detailTab === 'Documents' ? "bg-emerald-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300")}
                                  >
                                    <FileText size={14} /> Tài liệu số
                                  </button>
                               </div>

                               {detailTab === 'Issues' && (
                                 <div className="space-y-6">
                                   <div className="bg-error/5 p-5 rounded-2xl border border-error/20 space-y-4">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <AlertTriangle size={16} className="text-error" />
                                          <h4 className="text-xs font-bold text-error uppercase tracking-[0.2em]">Cập nhật Vướng mắc & Sai sót</h4>
                                        </div>
                                        {((editApp || selectedApp).status === 'Error' || (editApp || selectedApp).isRejected) && (
                                          <button 
                                            onClick={handleResolveError}
                                            className="text-[9px] bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-md font-bold uppercase border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all"
                                          >
                                            Đã khắc phục xong
                                          </button>
                                        )}
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <DetailCard theme={theme}
                                          label="Phân loại Vướng mắc" 
                                          value={(editApp || selectedApp).issueType} 
                                          type="select"
                                          editable={isEditing}
                                          options={['None', 'Sai sót nội bộ', 'Sai sót khách hàng', 'Sai sót cơ quan nhà nước', 'Sai sót chủ đầu tư', 'Sai sót Khác']}
                                          isEditing={isEditing}
                                          onChange={(val) => handleFieldChange('issueType', val)}
                                        />
                                        <DetailCard theme={theme}
                                          label="Mức độ" 
                                          value={(editApp || selectedApp).issueSeverity} 
                                          type="select"
                                          editable={isEditing}
                                          options={['Minor', 'Moderate', 'Critical']}
                                          isEditing={isEditing}
                                          onChange={(val) => handleFieldChange('issueSeverity', val)}
                                        />
                                      </div>
                                      <DetailCard theme={theme}
                                        label="Chi tiết vướng mắc / Ghi chú sai sót" 
                                        value={(editApp || selectedApp).issueNotes} 
                                        editable={isEditing}
                                        isEditing={isEditing}
                                        onChange={(val) => handleFieldChange('issueNotes', val)}
                                      />
                                   </div>
                                 </div>
                               )}

                               {detailTab === 'History' && (
                                  <div className="space-y-4">
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-left border-collapse min-w-[700px]">
                                        <thead>
                                          <tr className={cn("border-b text-[10px] font-black uppercase tracking-wider", theme === 'dark' ? "border-slate-800 text-slate-500" : "border-slate-200 text-slate-500")}>
                                            <th className="p-3 w-[180px]">Thời gian</th>
                                            <th className="p-3 w-[150px]">Người dùng</th>
                                            <th className="p-3">Nội dung & Hành động</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {(() => {
                                             const app = editApp || selectedApp;
                                             if (!app) return null;
                                             const h = (app.history || []).map(entry => ({
                                               id: entry.id,
                                               time: entry.receivedDate, 
                                               user: entry.performedByName || 'Hệ thống',
                                               action: `[Tiến độ] ${entry.stepName}`,
                                               content: entry.note || 'Cập nhật bước xử lý',
                                             }));
                                             const a = (app.auditTrail || []).map(entry => ({
                                               id: entry.id,
                                               time: entry.timestamp,
                                               user: entry.userName,
                                               action: entry.action,
                                               content: entry.changes || '',
                                             }));
                                             
                                             const merged = [...h, ...a].sort((x, y) => (y.time || '').localeCompare(x.time || ''));
                                             
                                             if (merged.length === 0) return (
                                               <tr>
                                                 <td colSpan={3} className="p-10 text-center text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                                   Chưa có lịch sử xử lý
                                                 </td>
                                               </tr>
                                             );

                                             return merged.map((log, index) => (
                                               <tr key={`${log.type || 'log'}-${log.id}-${index}`} className={cn("border-b transition-colors group", theme === 'dark' ? "border-slate-800/50 hover:bg-slate-800/20 text-slate-300" : "border-slate-100 hover:bg-slate-50 text-slate-700")}>
                                                 <td className="p-3 text-[11px] whitespace-nowrap align-top pt-4">
                                                   <div className="font-bold">{log.time}</div>
                                                 </td>
                                                 <td className="p-3 text-[11px] font-bold text-indigo-400 align-top pt-4 whitespace-nowrap">
                                                   {log.user}
                                                 </td>
                                                 <td className="p-3 text-[11px] py-4">
                                                   <div className="flex items-center gap-2 mb-1">
                                                     <span className={cn(
                                                       "px-2 py-0.5 rounded-md font-black text-[9px] uppercase tracking-tighter",
                                                       log.content === 'Đã khắc phục' ? "bg-emerald-500/10 text-emerald-500" : log.action.includes('[Hàng loạt]') ? "bg-purple-500/10 text-purple-500" : 
                                                       log.action.includes('[Tiến độ]') ? "bg-emerald-500/10 text-emerald-500" :
                                                        "bg-indigo-500/10 text-indigo-500"
                                                     )}>
                                                       {log.action}
                                                      </span>
                                                    </div>
                                                    <div className={cn("text-[11px] leading-relaxed", theme === 'dark' ? "text-slate-400" : "text-slate-600")}>
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


                               {detailTab === 'Documents' && (
                                 <div className="space-y-6 animate-in fade-in duration-300">
                                   <div className="flex items-center justify-between mb-2 text-left">
                                     <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Danh sách tài liệu đã đính kèm</h4>
                                     <div className="relative">
                                       <input 
                                         type="file" 
                                         id="doc-upload" 
                                         className="hidden" 
                                         onChange={handleFileUpload} 
                                       />
                                       <button 
                                         onClick={() => document.getElementById('doc-upload')?.click()}
                                         className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
                                       >
                                         <Plus size={14} /> Tải tài liệu lên
                                       </button>
                                     </div>
                                   </div>

                                   {(editApp || selectedApp).scannedFiles && (editApp || selectedApp).scannedFiles!.length > 0 ? (
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                       {(editApp || selectedApp).scannedFiles?.map(file => (
                                         <div 
                                           key={file.id}
                                           className={cn(
                                             "p-4 rounded-2xl border transition-all flex items-center justify-between group",
                                             theme === 'dark' ? "bg-slate-800/40 border-slate-700 hover:border-indigo-500/50" : "bg-slate-50 border-slate-200 hover:border-indigo-300"
                                           )}
                                         >
                                           <div 
                                             className="flex items-center gap-3 overflow-hidden cursor-pointer flex-1"
                                             onClick={() => setPreviewFile(file)}
                                           >
                                             <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                               {file.type.startsWith('image/') ? <Camera size={20} /> : <FileText size={20} />}
                                             </div>
                                             <div className="min-w-0">
                                               <div className="flex items-center gap-2">
                                                 <p className={cn("text-xs font-bold truncate", theme === 'dark' ? "text-white" : "text-slate-900")}>{file.name}</p>
                                                 {file.isShared && (
                                                   <span className="text-[10px] text-indigo-400 font-bold shrink-0" title="Tài liệu chung">🔗</span>
                                                 )}
                                               </div>
                                               <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-tighter">
                                                 {file.uploadDate} {file.isShared && '• [🔗 Tài liệu chung]'}
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
                                               onClick={() => handleDeleteFile(file.id)}
                                               className="p-2 bg-slate-100 dark:bg-slate-900 text-slate-400 hover:text-rose-500 rounded-lg transition-all"
                                               title="Xóa"
                                             >
                                               <Trash2 size={16} />
                                             </button>
                                           </div>
                                         </div>
                                       ))}
                                     </div>
                                   ) : (
                                     <div className={cn(
                                       "p-12 border-2 border-dashed rounded-3xl text-center",
                                       theme === 'dark' ? "border-slate-800 bg-slate-900/10" : "border-slate-200 bg-slate-50"
                                     )}>
                                       <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                                         <Upload size={32} className="text-slate-400" />
                                       </div>
                                       <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Chưa có tài liệu số đính kèm</p>
                                       <p className="text-[10px] text-slate-400 mt-1 uppercase">Vui lòng nhấp nút bên trên để bắt đầu tải lên</p>
                                     </div>
                                   )}
                                 </div>
                               )}
                            </div>
                         </div>
                       </div>
                    </div>

                    {/* Action Bar - Phương án A hàng ngang */}
                    <div className="p-6 border-t border-slate-700 bg-slate-950 flex flex-wrap items-center gap-3 mt-auto sticky bottom-0 z-50">
                        {!isEditing && (editApp || selectedApp).status !== 'Completed' ? (
                            <>
                                <div className="flex items-center gap-2">
                                     {/* Báo lỗi / Sai sót */}
                                     {['KT', 'PTDA', 'MANAGER', 'DIRECTOR', 'ADMIN'].includes(userRole) && (
                                        <div className="relative">
                                            {!isReportIssueFormOpen ? (
                                                <button 
                                                    onClick={() => setIsReportIssueFormOpen(true)}
                                                    className="p-4 border border-rose-500/30 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-rose-900/20 flex items-center justify-center gap-2"
                                                    title="Báo sai sót"
                                                >
                                                    <AlertTriangle size={20} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest hidden lg:inline">Báo lỗi</span>
                                                </button>
                                            ) : (
                                                <div className={cn("absolute bottom-full mb-3 right-0 w-80 p-6 rounded-[2rem] border space-y-4 shadow-2xl z-[101]", theme === 'dark' ? "bg-slate-950 border-rose-500/30 shadow-black" : "bg-rose-50 border-rose-200 shadow-rose-200/50")}>
                                                    <div className="flex justify-between items-center">
                                                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">Thông tin vướng mắc</label>
                                                        <button onClick={() => setIsReportIssueFormOpen(false)} className="text-slate-400 hover:text-rose-500 p-1"><X size={18} /></button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <select 
                                                            value={reportIssueType}
                                                            onChange={(e) => setReportIssueType(e.target.value as IssueType)}
                                                            className={cn("w-full p-3 rounded-xl border text-[10px] font-black uppercase", theme === 'dark' ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900")}
                                                        >
                                                            <option value="Sai sót nội bộ">Nội bộ</option>
                                                            <option value="Sai sót khách hàng">Khách hàng</option>
                                                            <option value="Sai sót cơ quan nhà nước">CQNN</option>
                                                            <option value="Sai sót chủ đầu tư">CĐT</option>
                                                            <option value="Sai sót Khác">Khác</option>
                                                        </select>
                                                        <select 
                                                            value={reportIssueSeverity}
                                                            onChange={(e) => setReportIssueSeverity(e.target.value as IssueSeverity)}
                                                            className={cn("w-full p-3 rounded-xl border text-[10px] font-black uppercase", theme === 'dark' ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900")}
                                                        >
                                                            <option value="Nghiêm trọng">Khẩn cấp</option>
                                                            <option value="Cao">Cao</option>
                                                            <option value="Trung bình">Vừa</option>
                                                            <option value="Thấp">Thấp</option>
                                                        </select>
                                                    </div>
                                                    <textarea 
                                                        value={reportIssueNote}
                                                        onChange={(e) => setReportIssueNote(e.target.value)}
                                                        placeholder="Mô tả chi tiết sai sót..."
                                                        className={cn("w-full p-4 rounded-2xl border text-xs font-bold min-h-[100px] outline-none focus:ring-2 focus:ring-rose-500/20", theme === 'dark' ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900")}
                                                    />
                                                    <button 
                                                        onClick={() => handleSingleOrBulkReportIssue([editApp || selectedApp].filter(Boolean) as Application[])}
                                                        className="w-full py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 transition-all shadow-lg shadow-rose-900/30"
                                                    >
                                                        Xác nhận gửi báo cáo
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                     )}

                                     {/* Trả về */}
                                     { (editApp || selectedApp).currentStep !== 'S1_ChuanBi' && (editApp || selectedApp).currentStep !== 'GD1_ChuanBi' && (
                                        <button 
                                            onClick={() => {
                                              const app = editApp || selectedApp;
                                              let returnStep = '';
                                              const workflowType = app.workflowType || 'Quy_trinh_1';
                                              const steps = workflowType === 'Quy_trinh_2' ? WORKFLOW_2_STEPS : WORKFLOW_1_STEPS;
                                              const currentIdx = steps.indexOf(app.currentStep);
                                              if (currentIdx > 0) returnStep = steps[currentIdx - 1];
                                              
                                              const reason = prompt("Lý do trả hồ sơ / quay lại bước trước:");
                                              if (reason) {
                                                 if (currentIdx === 1) handleRejectApp(reason);
                                                 else handleStepTransition(returnStep as StepName, reason);
                                              }
                                            }}
                                            className="p-4 bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
                                            title="Trả về"
                                        >
                                            <RotateCcw size={20} />
                                            <span className="text-[10px] font-black uppercase tracking-widest hidden lg:inline">Trả về</span>
                                        </button>
                                     )}

                                     {/* Edit Icon */}
                                     {userCanEdit && (
                                         <button 
                                            onClick={() => {
                                                setEditApp(selectedApp);
                                                setIsEditing(true);
                                            }}
                                            className="p-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
                                            title="Sửa"
                                         >
                                            <Edit2 size={20} />
                                            <span className="text-[10px] font-black uppercase tracking-widest hidden lg:inline">Sửa hồ sơ</span>
                                         </button>
                                     )}
                                </div>

                                {/* Main Transition Action */}
                                <div className="flex-1">
                                    {(() => {
                                       const app = editApp || selectedApp;
                                       const role = userRole;                
                                       if (app.status === 'Error') {
                                         return (
                                           <button 
                                             onClick={handleResolveError}
                                             className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-500 shadow-xl shadow-emerald-900/20 transition-all flex items-center justify-center gap-2"
                                           >
                                             <CheckCircle2 size={20} /> Xác nhận đã khắc phục lỗi
                                           </button>
                                         );
                                       }

                                       const isSupportSpecial = (app.projectName?.includes('hỗ trợ')) && (app.currentStep === 'GD2_Cho_Nop_VPDK' || app.currentStep === 'S3_Nop_VPDK');
                                       const currentStepDept = (stepConfig[app.currentStep] || INITIAL_STEP_CONFIG[app.currentStep])?.dept;
                                       const effectiveDept = isSupportSpecial ? 'KT' : currentStepDept;

                                       let canAction = role === 'ADMIN' || role === 'DIRECTOR' || role === 'MANAGER' || effectiveDept === role;
                                       const nextStep = getNextStep(app.currentStep, app.workflowType || 'Quy_trinh_1');
                                       
                                       if (canAction && nextStep) {
                                         const nextLabel = (stepConfig[nextStep] || INITIAL_STEP_CONFIG[nextStep])?.label;
                                         return (
                                             <button 
                                               onClick={() => {
                                                  const bulkSteps = ['S2_KT_Tiep_Nhan', 'S2_KT_Ban_giao', 'S3_Nop_VPDK', 'S4_Cho_Thong_Bao_Thue', 'S5_Tai_Chinh_Khach_Hang', 'S5_1_PTDA_TiepNhan', 'S6_Nhan_So_GCN', 'S7_PTDA_Ban_Giao', 'S7_1_PTT_Tiep_Nhan', 'S7_2_Ban_Giao_Khach', 'Hoan_Tat', 'GD1_Cho_KT_TiepNhan', 'GD3_Cho_TBThue', 'GD4_Cho_Nop_NVTC', 'GD4_Cho_KT_TiepNhan_LaySo', 'GD5_Cho_Ky_In_GCN', 'GD5_Cho_GCN', 'GD5_Cho_PTT_TiepNhan_BG', 'GD6_Cho_BG_Khach'];
                                                  if (bulkSteps.includes(nextStep)) {
                                                    handleBulkStepTransition(nextStep, [app.id]);
                                                  } else {
                                                    handleStepTransition(nextStep);
                                                  }
                                               }}
                                               className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] hover:bg-indigo-500 shadow-2xl shadow-indigo-900/40 transition-all flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 border-b-4 border-indigo-800"
                                             >
                                               <span className="opacity-70">Chuyển tới:</span> {nextLabel} <ChevronRight size={20} />
                                             </button>
                                         );
                                       }
                                       return null;
                                     })()}
                                </div>
                            </>
                        ) : isEditing ? (
                            <div className="flex gap-4 w-full">
                                <button 
                                    onClick={() => {
                                        setIsEditing(false);
                                        setEditApp(null);
                                    }}
                                    className="flex-1 py-4 bg-slate-800 text-slate-400 hover:bg-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
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
                        ) : null}
                    </div>
                </motion.div>
              </>
            )}
       </AnimatePresence>


      {/* Handover Ticket Modal */}
      <HandoverTicketModal 
        isOpen={isHandoverTicketOpen} 
        onClose={() => setIsHandoverTicketOpen(false)} 
        app={editApp || selectedApp} 
        theme={theme} 
      />

      {/* Create Application Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60]"
              onClick={() => setIsCreateModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={cn(
                "fixed inset-0 m-auto w-full max-w-2xl h-fit max-h-[90vh] z-[70] rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] border flex flex-col overflow-hidden",
                theme === 'light' ? "bg-white border-slate-200" : "bg-[#1E293B] border-slate-700"
              )}
            >
              <div className={cn(
                "p-8 border-b flex items-center justify-between",
                theme === 'light' ? "bg-slate-50/50 border-slate-100" : "bg-slate-900/50 border-slate-800"
              )}>
                <div>
                  <h3 className={cn(
                    "text-2xl font-black italic font-serif tracking-tight",
                    theme === 'light' ? "text-slate-900" : "text-white"
                  )}>Tạo mới Hồ sơ GCN</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Khởi tạo quy trình cấp sổ mới</p>
                </div>
                <button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-3 rounded-full hover:bg-slate-800 text-slate-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
                {/* Section 1: Thông tin cơ bản */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                    <h4 className={cn("text-[10px] font-black uppercase tracking-[0.2em]", theme === 'light' ? "text-slate-500" : "text-slate-400")}>Thông tin định danh</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5 flex-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Mã lô/căn <span className="text-rose-500">*</span></label>
                      <div className="relative group">
                        <Home size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                          type="text" 
                          placeholder="VD: A1.1205"
                          className={cn(
                            "w-full pl-10 pr-4 py-3 border rounded-2xl text-sm focus:ring-2 transition-all outline-none",
                            theme === 'light' ? "bg-white border-slate-200 text-slate-900 focus:bg-white" : "bg-slate-900 border-slate-800 text-slate-200",
                            formErrors.unitCode ? "border-rose-500 ring-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]" : "focus:ring-emerald-500/20"
                          )}
                          value={newApp.unitCode}
                          onChange={(e) => setNewApp({...newApp, unitCode: e.target.value})}
                        />
                      </div>
                      {formErrors.unitCode && <p className="text-[10px] text-rose-500 font-bold pl-1 italic">{formErrors.unitCode}</p>}
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Dự án</label>
                      <div className="relative group">
                        <MapIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                        <select 
                          className={cn(
                            "w-full pl-10 pr-10 py-3 border rounded-2xl text-sm focus:ring-2 transition-all outline-none appearance-none cursor-pointer",
                            theme === 'light' ? "bg-white border-slate-200 text-slate-900" : "bg-slate-900 border-slate-800 text-slate-200"
                          )}
                          value={newApp.projectName}
                          onChange={(e) => setNewApp({...newApp, projectName: e.target.value})}
                        >
                          {visibleProjects.map(p => (
                            <option key={p.id} value={p.name}>{p.name}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5 flex-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Tên khách hàng <span className="text-rose-500">*</span></label>
                      <div className="relative group">
                        <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                          type="text" 
                          placeholder="VD: Nguyễn Văn A"
                          className={cn(
                            "w-full pl-10 pr-4 py-3 border rounded-2xl text-sm focus:ring-2 transition-all outline-none",
                            theme === 'light' ? "bg-white border-slate-200 text-slate-900" : "bg-slate-900 border-slate-800 text-slate-200",
                            formErrors.customerName ? "border-rose-500 ring-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]" : "focus:ring-emerald-500/20"
                          )}
                          value={newApp.customerName}
                          onChange={(e) => setNewApp({...newApp, customerName: e.target.value})}
                        />
                      </div>
                      {formErrors.customerName && <p className="text-[10px] text-rose-500 font-bold pl-1 italic">{formErrors.customerName}</p>}
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Đối tượng ký HĐCN</label>
                      <div className="relative group">
                        <Key size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                          type="text" 
                          placeholder="VD: Công ty A / Cá nhân B"
                          className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                          value={newApp.contractSignerType}
                          onChange={(e) => setNewApp({...newApp, contractSignerType: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Phân loại tài sản */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-4 bg-amber-500 rounded-full"></div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Phân loại tài sản</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Loại hình</label>
                       <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                         <button 
                           onClick={() => setNewApp({...newApp, propertyType: 'Dat_Nen'})}
                           className={cn(
                             "flex-1 py-2 text-[9px] font-black uppercase rounded-xl transition-all",
                             newApp.propertyType === 'Dat_Nen' ? "bg-slate-800 text-white shadow-lg" : "text-slate-600 hover:text-slate-400"
                           )}
                         >Đất nền</button>
                         <button 
                           onClick={() => setNewApp({...newApp, propertyType: 'Can_Ho'})}
                           className={cn(
                             "flex-1 py-2 text-[9px] font-black uppercase rounded-xl transition-all",
                             newApp.propertyType === 'Can_Ho' ? "bg-slate-800 text-white shadow-lg" : "text-slate-600 hover:text-slate-400"
                           )}
                         >Căn hộ</button>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Sử dụng gói vay</label>
                       <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                         <button 
                           onClick={() => setNewApp({...newApp, loanStatus: 'Co_Vay'})}
                           className={cn(
                             "flex-1 py-2 text-[9px] font-black uppercase rounded-xl transition-all",
                             newApp.loanStatus === 'Co_Vay' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-600 hover:text-slate-400"
                           )}
                         >Có vay</button>
                         <button 
                           onClick={() => setNewApp({...newApp, loanStatus: 'Khong_Vay'})}
                           className={cn(
                             "flex-1 py-2 text-[9px] font-black uppercase rounded-xl transition-all",
                             newApp.loanStatus === 'Khong_Vay' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-600 hover:text-slate-400"
                           )}
                         >Không vay</button>
                       </div>
                    </div>

                    {newApp.loanStatus === 'Co_Vay' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-1.5 flex-1 col-span-2 pt-2"
                      >
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Ngày cam kết hoàn thành (Ngân hàng)</label>
                        <div className="relative group">
                          <Clock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
                          <input 
                            type="date" 
                            className={cn(
                              "w-full pl-10 pr-4 py-3 border rounded-2xl text-sm focus:ring-2 transition-all outline-none",
                              theme === 'light' ? "bg-white border-slate-200 text-slate-900 focus:ring-indigo-500/20" : "bg-slate-900 border-slate-800 text-slate-200 focus:ring-indigo-500/20"
                            )}
                            value={newApp.commitmentDate}
                            onChange={(e) => setNewApp({...newApp, commitmentDate: e.target.value})}
                          />
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Section 3: Quy trình */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cài đặt hình thức</h4>
                  </div>

                  <div className="flex gap-6">
                    <div className="flex-1">
                      <button 
                        onClick={() => setNewApp({...newApp, isSelfService: !newApp.isSelfService})}
                        className={cn(
                          "w-full py-4 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-3",
                          newApp.isSelfService 
                            ? "bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-600/20" 
                            : "bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-400"
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center",
                          newApp.isSelfService ? "bg-white border-white" : "border-slate-800"
                        )}>
                          {newApp.isSelfService && <Check size={12} className="text-amber-600" />}
                        </div>
                        Khách tự làm sổ (Self-service)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-slate-800 bg-slate-900/50 flex gap-4">
                <button 
                  disabled={isSavingApp}
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-4 bg-slate-800 text-slate-400 hover:bg-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button 
                  disabled={isSavingApp}
                  onClick={handleCreateApp}
                  className="flex-1 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-emerald-400 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:scale-100"
                >
                  {isSavingApp ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    'Khởi tạo hồ sơ'
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
                      <option value="MANAGER">Trưởng bộ phận / Trưởng phòng</option>
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
                    {projects.map(project => {
                      const isAssigned = editUser 
                        ? (editUser.assignedProjectIds || []).includes(project.id)
                        : newUser.assignedProjectIds.includes(project.id);
                      
                      return (
                        <label key={project.id} className="flex items-center gap-2 p-2 hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors">
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
      {isProjectModalOpen && (
        <ProjectModal 
          isOpen={isProjectModalOpen}
          onClose={() => setIsProjectModalOpen(false)}
          project={editingProject}
          theme={theme}
          onSave={async (p) => {
            setIsSavingApp(true);
            try {
              let updatedProjects: Project[];
              if (editingProject) {
                const updated = { ...editingProject, ...p };
                updatedProjects = projects.map(proj => proj.id === editingProject.id ? updated as Project : proj);
              } else {
                const newP: Project = { 
                  id: `PJ-${Math.random().toString(36).substr(2, 5).toUpperCase()}`, 
                  name: p.name || '', 
                  region: p.region || 'TP. Đà Nẵng',
                  totalUnits: p.totalUnits || 0,
                  workflowType: p.workflowType || 'Quy_trinh_1',
                  originalDocumentChecklist: p.originalDocumentChecklist || []
                };
                updatedProjects = [...projects, newP];
                if (newP.region) {
                  setExpandedSidebarRegions(prev => ({ ...prev, [newP.region as string]: true }));
                }
              }
              
              await handleSaveConfig('projects', updatedProjects);
              setProjects(updatedProjects);
              showToast('Đã lưu danh mục dự án lên Supabase thành công!', 'success');
            } catch (error) {
              console.error('Save project error:', error);
     showToast('Lỗi khi lưu dự án lên Supabase.', 'error');
            } finally {
              setIsSavingApp(false);
              setIsProjectModalOpen(false);
            }
          }}
        />
      )}

      {/* Bulk Note Modal */}
      <BulkNoteModal
        isOpen={isBulkNoteOpen}
        onClose={() => setIsBulkNoteOpen(false)}
        onConfirm={handleBulkUpdateNote}
        selectedCount={selectedAppIds.length}
        bulkNoteText={bulkNoteText}
        onChangeBulkNoteText={setBulkNoteText}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        onConfirm={handleUpdatePassword}
        passwordForm={passwordForm}
        onChangePasswordForm={setPasswordForm}
        isSaving={isSavingApp}
      />

      <BulkTransitionModal 
        isOpen={isBulkTransitionModalOpen}
        onClose={() => setIsBulkTransitionModalOpen(false)}
        onConfirm={() => {
          if (bulkTransitionTarget) {
            executeBulkStepTransition(bulkTransitionTarget, bulkTransitionField ? bulkTransitionValue : null, bulkTransitionLocation, bulkTransitionRefCode);
          }
        }}
        selectedCount={selectedAppIds.length}
        unitCodes={applications.filter(a => selectedAppIds.includes(a.id)).map(a => a.unitCode)}
        targetStepLabel={bulkTransitionTarget ? (stepConfig[bulkTransitionTarget] || INITIAL_STEP_CONFIG[bulkTransitionTarget]).label : ''}
        updateField={bulkTransitionField}
        value={bulkTransitionValue}
        onChangeValue={setBulkTransitionValue}
        location={bulkTransitionLocation}
        onChangeLocation={setBulkTransitionLocation}
        refCode={bulkTransitionRefCode}
        onChangeRefCode={setBulkTransitionRefCode}
        theme={theme}
        showToast={showToast}
      />

      <BulkIssueModal
        isOpen={isBulkIssueOpen}
        onClose={() => setIsBulkIssueOpen(false)}
        onConfirm={handleBulkReportIssue}
        selectedCount={selectedAppIds.length}
        unitCodes={applications.filter(a => selectedAppIds.includes(a.id)).map(a => a.unitCode)}
        note={bulkIssueNote}
        onChangeNote={setBulkIssueNote}
        issueType={bulkIssueType}
        onChangeIssueType={setBulkIssueType}
        severity={bulkIssueSeverity}
        onChangeSeverity={setBulkIssueSeverity}
        theme={theme}
      />

      {isBulkDocumentOpen && (
        <BulkDocumentModal 
          onClose={() => setIsBulkDocumentOpen(false)}
          onUpload={handleBulkFileUpload}
          isUploading={isUploadingShared}
          theme={theme}
        />
      )}

      <AnimatePresence>
        {previewFile && (
          <FilePreviewModal 
            file={previewFile}
            onClose={() => setPreviewFile(null)}
            theme={theme}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={cn(
              "fixed bottom-24 left-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md border min-w-[320px] justify-center",
              toast.type === 'success' ? "bg-success/90 border-success/40 text-white" : 
              toast.type === 'error' ? "bg-error/90 border-error/40 text-white" : 
              "bg-warning/90 border-warning/40 text-white"
            )}
          >
            {toast.type === 'success' && <CheckCircle2 size={18} />}
            {toast.type === 'error' && <AlertTriangle size={18} />}
            {toast.type === 'warning' && <AlertCircle size={18} />}
            <span className="text-sm font-black uppercase tracking-tight">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
        </div>
      } />
    </Routes>
  );
}
