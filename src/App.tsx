import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from './stores/useAuthStore';
import { useToast } from './hooks/useToast';
import { useBulkActions } from './hooks/useBulkActions';
import { useApplicationFilters } from './hooks/useApplicationFilters';
import { useDashboardStats } from './hooks/useDashboardStats';
import { calculateSLA } from './utils/statusEngine';
import { diffDays } from './utils/dateUtils';
import { buildFlags } from './utils/flagUtils';
import { mapFromSnakeCase, mapToSnakeCase, mapUserFromSnakeCase, mapUserToSnakeCase, safeParse, mapNotificationToSnakeCase } from './utils/mappers';
import { calculateDaysDiff, calculateDaysBetweenDates, getPhaseIndex, getTaxStatus, getOverdueInfo, inferStepFromDates, validateDateSequence, validateSkippedSteps, generateUUID } from './utils/appUtils';
import { WorkflowEngine } from './utils/workflowEngine';
import { StatCard, StatusBadge, DetailCard, FestiveBranding, PrintStyles } from './components/AppSubComponents';

import { useExcelImport } from './hooks/useExcelImport';

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
  History as HistoryIcon,
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
  UserCheck,
  RefreshCw,
  CheckCircle
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
import HandoverTicketModal, { HandoverPrintContent } from './components/modals/HandoverTicketModal';
import BulkDocumentModal from './components/modals/BulkDocumentModal';
import BulkNoteModal from './components/modals/BulkNoteModal';
import ChangePasswordModal from './components/modals/ChangePasswordModal';
import SelfServiceHandoverModal from './components/modals/SelfServiceHandoverModal';
import FilePreviewModal from './components/modals/FilePreviewModal';
import BulkTransitionModal from './components/modals/BulkTransitionModal';
import BulkIssueModal from './components/modals/BulkIssueModal';
import BulkRejectModal from './components/modals/BulkRejectModal';
import ImportPreviewModal from './components/modals/ImportPreviewModal';
import { ApplicationDetailModal } from './components/modals/ApplicationDetailModal';
import { CreateApplicationModal } from './components/modals/CreateApplicationModal';
import { useModalStore } from './stores/useModalStore';
import { useDataStore, bulkSyncRecordsToSupabase, createAuditEntry, updateAppIssue, isSelfUpdate, registerSelfUpdate, fetchRecordDetail } from './stores/useDataStore';
import { UserManagementModal } from './components/modals/UserManagementModal';
import { Sidebar } from './components/Sidebar';
import { DashboardTab } from './components/tabs/DashboardTab';
import { ThemeRipple } from './components/ThemeRipple';
import { ApplicationsTab } from './components/tabs/ApplicationsTab';
import { ResourcesTab } from './components/tabs/ResourcesTab';
import { Routes, Route, Link } from 'react-router-dom';
import { ThemeToggle } from './components/ThemeToggle';
import { cn } from './lib/utils';
import { formatDate } from './utils/dateUtils';
import { motion, AnimatePresence } from 'motion/react';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';

const RECORD_LIGHT_SELECT = 'id, unit_code, project_name, customer_name, contract_signer_type, phone_number, property_type, loan_status, is_self_service, current_step, status, received_date, contract_signing_date, submission_date, tax_notification_date, tax_receipt_date, gcn_signed_date, gcn_received_date, customer_handover_date, accounting_handover_date, ptda_handover_date, bank_commitment_deadline, submission_location, vpdk_code, issue_type, issue_severity, issue_notes, is_rejected, workflow_type, created_at, assigned_to, tax_payment_status, scanned_files, rejection_count, rejection_reason, commitment_date, assigned_to_id, assigned_to_name, tax_vpdk_submission_date, gcn_number, kt_handover_to_ptda_date, tax_notification_received_date, tax_notice_provision_date, handover_apartment_date';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { MOCK_APPLICATIONS, PROJECTS, STEP_CONFIG as INITIAL_STEP_CONFIG, MOCK_USERS, WORKFLOW_1_STEPS, WORKFLOW_2_STEPS, getNextStep, CONST_QUY_TRINH_1, CONST_QUY_TRINH_2, REGION_ORDER } from './constants';
import { Application, UnitStatus, KPI, Dept, UserProfile, UserPermission, PropertyType, StepName, AppNotification, Project, ApplicationStepHistory, AuditTrailEntry, ScannedFile, IssueType, IssueSeverity, HandoverTemplate } from './types';

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
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl) {
  console.error("Cảnh báo: Chưa cấu hình VITE_SUPABASE_URL trong file .env");
}

if (!supabaseAnonKey) {
  console.error("Cảnh báo: Chưa cấu hình VITE_SUPABASE_ANON_KEY trong file .env");
}

// Đảm bảo URL hợp lệ
const SUPABASE_URL = (supabaseUrl || 'https://placeholder.supabase.co').trim().replace(/\/$/, '');
const SUPABASE_KEY = (supabaseAnonKey || 'placeholder-key').trim();

// Validate key trước khi tạo client
if (!SUPABASE_KEY) {
  console.error('[Config] VITE_SUPABASE_KEY chưa được cấu hình!');
}

if (!import.meta.env.VITE_ADMIN_SECRET) {
  console.warn('[Config] VITE_ADMIN_SECRET chưa cấu hình');
}
const ADMIN_SECRET = (
  import.meta.env.VITE_ADMIN_SECRET || ''
).trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  global: {
    headers: {
      'x-admin-key': ADMIN_SECRET
    }
  },
  realtime: {
    params: { 
      eventsPerSecond: 10 
    }
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

if (import.meta.env.DEV) {
  console.log('[Key Check]', {
    type: SUPABASE_KEY.startsWith('eyJ') ? 'JWT ✅' : 
          SUPABASE_KEY.startsWith('sb_') ? 'Publishable ⚠️ (Cần đổi sang JWT anon key để dùng Realtime RLS)' : 
          'Chưa cấu hình ❌',
    url: SUPABASE_URL
  });
}



/**
 * Self-healing logic for inconsistent record states
 * If a record has customerHandoverDate but is not in Hoan_Tat step or Completed status,
 * this function identifies it and triggers a sync back to Supabase.
 */
const useSelfHealingData = (
  applications: Application[], 
  setApplications: (apps: Application[]) => void,
  registerSelfUpdate?: (idOrIds: (number | string) | (number | string)[]) => void
) => {
  const { showToast } = useToast();
  const healingRef = useRef(false);

  useEffect(() => {
    if (applications.length === 0) return;
    if (healingRef.current) return;
    
    // Disabled self-healing data that forcefully sets currentStep
    return;
  }, [applications]);
};


const mapProjectFromSnakeCase = (item: any): Project => {
  return {
    id: String(item.id),
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


// Function deleted as it is imported from useDataStore.ts

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

// Sub-components moved to AppSubComponents.tsx











// Modals and Utils moved


// HandoverRecord template moved to components/

const EMPTY_ARRAY: never[] = [];

export default function App() {
  const { currentUser, userRole, setCurrentUser } = useAuthStore();

  // Modal Store
  const {
    isCreateModalOpen, setIsCreateModalOpen,
    isUserModalOpen, setIsUserModalOpen,
    isProjectModalOpen, setIsProjectModalOpen,
    isBulkDocumentOpen, setIsBulkDocumentOpen,
    isBulkTransitionModalOpen, setIsBulkTransitionModalOpen,
    isChangePasswordModalOpen, setIsChangePasswordModalOpen,
    isHandoverTicketOpen, setIsHandoverTicketOpen,
    isUploadingShared, setIsUploadingShared,
    previewFile, setPreviewFile,
    selfServiceHandoverModal, setSelfServiceHandoverModal,
    isReportIssueFormOpen, setIsReportIssueFormOpen,
    editUser, setEditUser,
    editingProject, setEditingProject,
    editApp, setEditApp,
    selectedApp, setSelectedApp,
    confirmDialog, setConfirmDialog, askConfirm
  } = useModalStore();

  // Data Store
  const {
    applications, setApplications,
    dashboardApps, setDashboardApps,
    projects, setProjects,
    users, setUsers,
    notifications, setNotifications,
    taskReminders, setTaskReminders,
    stepConfig, setStepConfig,
    slaConfig, setSlaConfig,
    checklistTemplates, setChecklistTemplates,
    handoverTemplate, setHandoverTemplate,
    isLoadingApps, setIsLoadingApps,
    isLoadingDashboard, setIsLoadingDashboard,
    isLoadingConfig, setIsLoadingConfig,
    isInitialLoading, setIsInitialLoading,
    isAuthLoading, setIsAuthLoading,
    fetchInitialData, reportIssue,
    resolveIssue, resolveError, bulkResolveIssues, proposeException, approveException,
    stepTransition, rejectApp, bulkRejectApps,
    executeBulkStepTransition: executeBulkStepTransitionAction,
    createApp, updateApp, deleteApp, quickSave,
    syncRecord, bulkSync,
    createUser, updateUser, deleteUser, resetUserPassword, updatePassword
  } = useDataStore();
  const { toast, showToast } = useToast();
  
  const [search, setSearch] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const handleThemeToggle = useCallback((e: React.MouseEvent) => {
    const isDark = theme === 'dark';
    const nextTheme = isDark ? 'light' : 'dark';
    
    // View Transition implementation
    if (!(document as any).startViewTransition) {
      setTheme(nextTheme);
      return;
    }

    const x = e.clientX;
    const y = e.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = (document as any).startViewTransition(() => {
      setTheme(nextTheme);
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];

      document.documentElement.animate(
        {
          clipPath: clipPath,
        },
        {
          duration: 700,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
  }, [theme]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'applications' | 'users' | 'resources' | 'reports' | 'settings'>('dashboard');
  const [allApplicationsForExport, setAllApplicationsForExport] = useState<Application[]>([]);
  const [dashboardTab, setDashboardTab] = useState<'ALL' | 'SELF_SERVICE' | 'LOAN'>('ALL');
  const [reportType, setReportType] = useState<'PROJECT' | 'REGION' | 'LOAN' | 'SLA' | 'PERFORMANCE' | 'ERROR'>('LOAN');

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarCollapsed(true);
      } else {
        setIsSidebarCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
  }, [theme]);

  // Initialize session on app load
  useEffect(() => {
    const initSession = async () => {
      try {
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
      } catch (err) {
        console.error('Error in initSession:', err);
      } finally {
        setIsAuthLoading(false);
      }
    };
    initSession();
  }, []);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  // const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  // const [taskReminders, setTaskReminders] = useState<AppNotification[]>([]);
  const [isPrintingHandover, setIsPrintingHandover] = useState(false);
  const [printHandoverApps, setPrintHandoverApps] = useState<Application[]>([]);
  // const [users, setUsers] = useState<UserProfile[]>([]);
  // const [previewFile, setPreviewFile] = useState<ScannedFile | null>(null);
  // const [isBulkDocumentOpen, setIsBulkDocumentOpen] = useState(false);
  // const [isUploadingShared, setIsUploadingShared] = useState(false);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        showToast(
          'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.',
          'warning'
        );
      }
      if (event === 'TOKEN_REFRESHED' && session?.access_token) {
        supabase.realtime.setAuth(session.access_token);
        console.log('[Realtime] Token auto-refreshed ✅');
      }
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
          handleSetApplications([]);
          handleSetDashboardApps([]);
          setSelectedAppIds([]);
          setCurrentPage(0);
          setSearch('');
        }
      } else {
        setCurrentUser(null);
        handleSetApplications([]);
        handleSetDashboardApps([]);
        setSelectedAppIds([]);
        setCurrentPage(0);
        setSearch('');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // const [stepConfig, setStepConfig] = useState<Record<string, { label: string, dept: Dept, status: UnitStatus, slaDays?: number, active: boolean }>>(INITIAL_STEP_CONFIG);
  // const [projects, setProjects] = useState<Project[]>([]);

  const canEdit = (user: UserProfile | null): boolean => {
    if (!user) return false;
    if (user.dept === 'ADMIN') return true;
    if (['KT', 'PTT', 'PTDA', 'MANAGER_PTT', 'MANAGER_KT', 'MANAGER_PTDA', 'MANAGER_ALL'].includes(user.dept)) return true;
    return user.permission === 'EDIT' || user.permission === 'FULL';
  };

  const userCanEdit = useMemo(() => canEdit(currentUser), [currentUser]);
  
  const isManagementEdit = useMemo(() => {
    return userRole === 'ADMIN' || (['MANAGER', 'DIRECTOR', 'MANAGER_ALL'].includes(userRole) && userCanEdit);
  }, [userRole, userCanEdit]);

  const isManagement = useMemo(() => {
    return ['ADMIN', 'MANAGER', 'DIRECTOR', 'MANAGER_PTT', 'MANAGER_KT', 'MANAGER_PTDA', 'MANAGER_ALL'].includes(userRole);
  }, [userRole]);

  const hasSettingsAccess = useMemo(() => {
    return userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'MANAGER_ALL';
  }, [userRole]);

  const hasUserAccess = useMemo(() => {
    return userRole === 'ADMIN';
  }, [userRole]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };
  // const [applications, setApplications] = useState<Application[]>([]);
  // const [dashboardApps, setDashboardApps] = useState<Application[]>([]);

  const [sortConfig, setSortConfig] = useState<{
    field: 'status' | 'unitCode' | 'customerName' | 
           'createdAt' | 'smart';
    direction: 'asc' | 'desc';
  }>({ field: 'smart', direction: 'desc' });

  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedAppId, setHighlightedAppId] = useState<string | number | null>(null);

  const STATUS_PRIORITY: Record<string, number> = {
    'Error':          1,  // Vướng mắc lên đầu
    'Processing':     2,  // Đang chuẩn bị
    'WaitingVPDK':    3,  // Chờ nộp VPĐK
    'Submitted':      4,  // Đã nộp
    'TaxPending':     5,  // Chờ TB thuế / NVTC
    'TaxCompleted':   6,  // Đã nộp thuế
    'GCN_Issued':     7,  // Đã có GCN
    'WaitingHandover':8,  // Chờ bàn giao
    'Completed':      99  // Hoàn tất xuống cuối
  };

  const sortApplications = useCallback((apps: Application[]) => {
    return [...apps].sort((a, b) => {
      if (sortConfig.field === 'smart') {
        const pa = STATUS_PRIORITY[a.status] ?? 50;
        const pb = STATUS_PRIORITY[b.status] ?? 50;
        if (pa !== pb) return pa - pb;
        return (b.id as number) - (a.id as number);
      }
      if (sortConfig.field === 'unitCode') {
        const cmp = a.unitCode.localeCompare(
          b.unitCode, 'vi', { numeric: true }
        );
        return sortConfig.direction === 'asc' ? cmp : -cmp;
      }
      if (sortConfig.field === 'customerName') {
        const cmp = (a.customerName || '').localeCompare(
          b.customerName || '', 'vi'
        );
        return sortConfig.direction === 'asc' ? cmp : -cmp;
      }
      if (sortConfig.field === 'status') {
        const pa = STATUS_PRIORITY[a.status] ?? 50;
        const pb = STATUS_PRIORITY[b.status] ?? 50;
        return sortConfig.direction === 'asc' 
          ? pa - pb : pb - pa;
      }
      return sortConfig.direction === 'asc'
        ? (a.id as number) - (b.id as number)
        : (b.id as number) - (a.id as number);
    });
  }, [sortConfig.field, sortConfig.direction]);

  const handleSetApplications = useCallback((newDataOrUpdater: Application[] | ((prev: Application[]) => Application[])) => {
    setApplications(prev => {
      const incoming = typeof newDataOrUpdater === 'function' ? newDataOrUpdater(prev) : newDataOrUpdater;
      const uniqueMap = new Map();
      incoming.forEach(app => {
        if (app && app.id) uniqueMap.set(app.id, app);
      });
      return sortApplications(Array.from(uniqueMap.values()));
    });
  }, [sortApplications]);

  useSelfHealingData(applications, handleSetApplications, registerSelfUpdate);

  const handleSetDashboardApps = useCallback((newDataOrUpdater: Application[] | ((prev: Application[]) => Application[])) => {
    setDashboardApps(prev => {
      const incoming = typeof newDataOrUpdater === 'function' ? newDataOrUpdater(prev) : newDataOrUpdater;
      const uniqueMap = new Map();
      incoming.forEach(app => {
        if (app && app.id) uniqueMap.set(app.id, app);
      });
      return Array.from(uniqueMap.values());
    });
  }, []);
  // const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  // const [isLoadingApps, setIsLoadingApps] = useState(true);
  // const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  // const [isInitialLoading, setIsInitialLoading] = useState(true);
  // const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isChartsReady, setIsChartsReady] = useState(false);

  useEffect(() => {
    setIsChartsReady(false);
    const id = setTimeout(() => setIsChartsReady(true), 200);
    return () => clearTimeout(id);
  }, [dashboardApps]);
  const [storageStats, setStorageStats] = useState<{ totalSize: number, fileCount: number, folders: string[], dbSize: number }>({ totalSize: 0, fileCount: 0, folders: [], dbSize: 0 });
  const [isFetchingStorage, setIsFetchingStorage] = useState(false);
  // const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  // selfServiceHandoverModal moved to store

  // System Configuration States
  // const [slaConfig, setSlaConfig] = useState<Record<string, number>>({});
  // const [checklistTemplates, setChecklistTemplates] = useState<string[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<UnitStatus | 'ALL'>('ALL');
  const [filterLoanStatus, setFilterLoanStatus] = useState<'Co_Vay' | 'Khong_Vay' | 'ALL'>('ALL');
  const [filterSelfService, setFilterSelfService] = useState<'YES' | 'NO' | 'ALL'>('ALL');
  const [filterIssue, setFilterIssue] = useState<'ALL' | 'ERROR'>('ALL');
  const [filterSLAStatus, setFilterSLAStatus] = useState<'ALL' | 'OVERDUE'>('ALL');
  const [filterDept, setFilterDept] = useState<'ALL' | 'PTT' | 'PTDA' | 'KT'>('ALL');
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

  const handleDashboardClick = useCallback((filter: string) => {
    setActiveTab('applications');
    setDashboardFilter(prev => prev === filter ? 'ALL' : filter);
    setFilterStatus('ALL');
    setFilterIssue('ALL');
    setFilterSLAStatus('ALL');
    setFilterDept('ALL');
    setDashboardTab(currentTab => {
      if (currentTab === 'SELF_SERVICE') {
        setFilterSelfService('YES');
        setFilterLoanStatus('ALL');
      } else if (currentTab === 'LOAN') {
        setFilterSelfService('ALL');
        setFilterLoanStatus('Co_Vay');
      } else {
        setFilterSelfService('ALL');
        setFilterLoanStatus('ALL');
      }
      return currentTab;
    });
    setSearch('');
  }, []);

  // handoverTemplate moved to store

  const enrichedDashboardApps = useMemo(() => {
    return (dashboardApps || []).map(a => ({
      ...a,
      _sla: calculateSLA(a)
    }));
  }, [dashboardApps]);

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
    filterDept,
    stepConfig
  );

  const displayedApps = useMemo(() => {
    let result = sortApplications(filteredApps);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(a => 
        a.unitCode?.toLowerCase().includes(q) ||
        a.customerName?.toLowerCase().includes(q) ||
        a.projectName?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [filteredApps, sortConfig, searchQuery]);

  
  const handleUpdatePassword = async () => {
    if (!currentUser?.id) {
      showToast('Không tìm thấy thông tin phiên đăng nhập.', 'error');
      return;
    }
    if (!passwordForm.newPassword || !passwordForm.currentPassword) {
      showToast('Vui lòng nhập mật khẩu mới.', 'warning');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('Mật khẩu xác nhận không khớp.', 'error');
      return;
    }

    setIsSavingApp(true);
    const result = await updatePassword(currentUser.id, passwordForm.currentPassword, passwordForm.newPassword);
    
    if (result.success) {
      if (currentUser) {
        setCurrentUser({
          ...currentUser,
          isFirstLogin: false,
          password: passwordForm.newPassword
        });
      }
      try {
        await supabase
          .from('users')
          .update({ is_first_login: false })
          .eq('id', currentUser.id);
      } catch (dbErr) {
        console.warn('Could not persist is_first_login updates: ', dbErr);
      }
      showToast('Đổi mật khẩu bảo mật thành công!', 'success');
      setIsChangePasswordModalOpen(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      showToast(result.message, 'error');
    }
    setIsSavingApp(false);
  };

  const fetchRefs = useRef<any>({});
  const fetchRequestIds = useRef({ applications: 0, dashboard: 0 });

  // Moved down to fix realtimeStatus reference error

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
      const timeoutId = setTimeout(() => {
        setIsInitialLoading(false);
        setIsLoadingApps(false);
        setIsLoadingConfig(false);
        showToast(
          '⚠️ Tải dữ liệu quá lâu. Kiểm tra kết nối.', 
          'error'
        );
      }, 30000);

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
        else setUsers([]);

        // Fetch records is handled separately by currentUser effect
        // fetchApplications();
        
        setIsLoadingConfig(false);
        setIsInitialLoading(false);
      } catch (e) {
         console.error('Error initializing:', e);
         showToast('Có lỗi xảy ra, vui lòng thử lại', 'error');
         setIsLoadingConfig(false);
         setIsInitialLoading(false);
         handleSetApplications([]);
         setUsers([]);
      } finally {
        clearTimeout(timeoutId);
        setIsLoadingApps(false);
      }
    };
    fetchInitialData();
  }, []);

  const assignedNames = useMemo(() => {
    if (!currentUser || !projects.length) return [];
    return projects
      .filter(p => currentUser.assignedProjectIds?.includes(p.id))
      .map(p => p.name);
  }, [currentUser?.assignedProjectIds, projects]);

  const assignedNamesRef = useRef(assignedNames);
  useEffect(() => {
    assignedNamesRef.current = assignedNames;
  }, [assignedNames]);

  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'connecting' | 'error'>('connecting');
  const [realtimeReconnectKey, setRealtimeReconnectKey] = useState(0);

  useEffect(() => {
    if (!currentUser) return;

    let active = true;
    let retryTimeout: any = null;
    let retryCount = 0;
    const MAX_RETRY = 5;
    let recordsChannel: any = null;
    let notiChannel: any = null;

    const initRealtime = async () => {
      if (!active) return;
      setRealtimeStatus('connecting');

      try {
        // Dùng refreshSession thay vì getSession
        // để đảm bảo token luôn còn hạn
        const { data: { session } } = 
          await supabase.auth.getSession();
        
        if (session?.access_token) {
          // Refresh token trước khi set
          const { data: refreshed } = 
            await supabase.auth.refreshSession();
          const validToken = refreshed.session?.access_token 
            || session.access_token;
          
          supabase.realtime.setAuth(validToken);
          console.log('[Realtime] Auth token set:', 
            validToken.substring(0, 20) + '...');
        } else {
          console.warn('[Realtime] No session found');
          // Thử lại sau 3s nếu chưa có session
          setTimeout(() => {
            if (active) initRealtime();
          }, 3000);
          return;
        }
      } catch (err) {
        console.warn('[Realtime] Auth sync warning:', err);
      }

      // Subscribe thay đổi bảng records
      const channelId = `rt-records-${currentUser.id}`;
      console.log(`[Realtime] Initializing: ${channelId}`);

      recordsChannel = supabase
        .channel(channelId)
        .on(
          'postgres_changes',
          { 
            event: '*',
            schema: 'public', 
            table: 'records' 
          },
          (payload) => {
            if (!active) return;
            const { eventType, new: newRow, old: oldRow } = payload;

            // Filter theo project trong callback để tránh lỗi transport/RLS block subscription
            if (eventType !== 'DELETE') {
              const projectName = newRow?.project_name;
              const isAllowed = userRole === 'ADMIN' || 
                !projectName ||
                assignedNamesRef.current.includes(projectName);
              if (!isAllowed) return; // Bỏ qua nếu không có quyền xem project này
            }

            if (eventType === 'INSERT') {
              const newApp = mapFromSnakeCase(newRow);
              
              const isSelfUpdated = isSelfUpdate(newApp.id as number);
              if (isSelfUpdated) {
                return;
              }

              handleSetApplications(prev => {
                const exists = prev.some(a => a.id === newApp.id);
                if (exists) return prev;
                showToast(
                  `📋 Hồ sơ mới: ${newApp.unitCode} vừa được tạo`,
                  'info'
                );
                return [newApp, ...prev];
              });
              handleSetDashboardApps(prev => {
                if (prev.some(a => a.id === newApp.id)) return prev;
                return [newApp, ...prev];
              });
              setTotalCount(prev => prev + 1);
            }

            else if (eventType === 'UPDATE') {
              const prevApp = applications.find(a => a.id === newRow.id) || dashboardApps.find(a => a.id === newRow.id);
              const updatedApp = mapFromSnakeCase(newRow, prevApp);
              
              const isSelfUpdated = isSelfUpdate(updatedApp.id as number);
              if (isSelfUpdated) {
                return; // SKIP local update because it is already synchronized locally
              }

              handleSetApplications(prev => prev.map(a => 
                a.id === updatedApp.id ? updatedApp : a
              ));
              handleSetDashboardApps(prev => prev.map(a => 
                a.id === updatedApp.id ? updatedApp : a
              ));

              showToast(
                `📋 Hồ sơ ${updatedApp.unitCode} vừa được cập nhật bởi người khác`,
                'info'
              );

              // Nếu user đang xem/sửa hồ sơ này
              setSelectedApp(prev => {
                if (!prev || prev.id !== updatedApp.id) return prev;
                
                if (isEditingRef.current) {
                  const serverTime = new Date(updatedApp.updatedAt || 0);
                  const localTime = new Date(editAppRef.current?.updatedAt || 0);
                  if (serverTime > localTime) {
                    setConflictWarning(
                      `Hồ sơ này vừa được cập nhật lúc ` +
                      `${serverTime.toLocaleTimeString('vi-VN')}. ` +
                      `Lưu thay đổi của bạn sẽ ghi đè dữ liệu mới.`
                    );
                  }
                }
                
                // Giữ lại history/auditTrail từ RAM; fetch lại bất đồng bộ bên dưới
                return {
                  ...updatedApp,
                  history:    (prev.history?.length || 0) > 0 ? prev.history    : updatedApp.history,
                  auditTrail: (prev.auditTrail?.length || 0) > 0 ? prev.auditTrail : updatedApp.auditTrail,
                };
              });

              // Bất đồng bộ fetch lại history thật từ DB
              if (selectedAppRef.current?.id === newRow.id) {
                fetchRecordDetail(String(newRow.id), newRow.unit_code)
                  .then(detail => {
                    setSelectedApp(prev => {
                      if (!prev || prev.id !== newRow.id) return prev;
                      return {
                        ...prev,
                        history:    detail.history.length    > 0 ? detail.history    : prev.history,
                        auditTrail: detail.auditTrail.length > 0 ? detail.auditTrail : prev.auditTrail,
                      };
                    });
                  })
                  .catch(() => {}); // silent fallback — giữ nguyên RAM
              }
            }

            else if (eventType === 'DELETE') {
              const deletedId = oldRow.id;
              
              const isSelfDeleted = isSelfUpdate(deletedId as number);
              if (isSelfDeleted) {
                return; // SKIP local update
              }

              handleSetApplications(prev => 
                prev.filter(a => a.id !== deletedId)
              );
              handleSetDashboardApps(prev => 
                prev.filter(a => a.id !== deletedId)
              );
              setTotalCount(prev => Math.max(0, prev - 1));
              // Đóng panel nếu đang xem hồ sơ bị xóa
              setSelectedApp(prev => 
                prev?.id === deletedId ? null : prev
              );
            }
          }
        )
        .subscribe((status, err) => {
          if (!active) return;
          console.log(`[Realtime-Records] ${status}`, err || '');

          if (status === 'SUBSCRIBED') {
            console.log('✅ Realtime connected');
            setRealtimeStatus('connected');
            retryCount = 0;
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            const errStr = err ? (typeof err === 'object' ? JSON.stringify(err) : String(err)) : 'Unknown error';
            console.warn(`[Realtime Warning] ${errStr}`);
            
            // Detailed transport error logging
            if (errStr.includes('transport failure')) {
              console.warn('⚠️ Realtime transport failure. Proceeding with fallback mode.');
            }

            setRealtimeStatus('error');
            
            retryCount++;
            if (retryCount <= MAX_RETRY) {
              const delay = Math.min(30000, 3000 * Math.pow(2, retryCount - 1));
              console.log(`[Realtime] Reconnecting in ${delay}ms (Attempt ${retryCount}/${MAX_RETRY})...`);
              retryTimeout = setTimeout(() => {
                if (active) setRealtimeReconnectKey(p => p + 1);
              }, delay);
            } else {
              console.warn('[Realtime] Max retries reached. Falling back to polling mode only.');
            }
          }
        });

      // Subscribe thay đổi bảng notifications
      const notiChannelId = `rt-noti-${currentUser.id}`;
      notiChannel = supabase
        .channel(notiChannelId)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${String(currentUser.id)}`
          },
          (payload) => {
            if (!active) return;
            const newNoti = mapNotificationFromSnakeCase(payload.new);
            setNotifications(prev => {
              const exists = prev.some(n => n.id === newNoti.id);
              if (exists) return prev;
              return [newNoti, ...prev];
            });
            showToast(`🔔 Thông báo mới: ${newNoti.title}`, 'info');
          }
        )
        .subscribe();
    };

    initRealtime();

    // Cleanup khi logout hoặc unmount
    return () => {
      active = false;
      if (retryTimeout) clearTimeout(retryTimeout);
      if (recordsChannel) supabase.removeChannel(recordsChannel);
      if (notiChannel) supabase.removeChannel(notiChannel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, realtimeReconnectKey, userRole]); // assignedNames omitted to prevent infinite reconnect loops

  // Listen for reconnect-realtime event from useExcelImport
  useEffect(() => {
    const handleReconnect = () => {
      console.log("[Realtime] Reconnecting after import...");
      setRealtimeReconnectKey(prev => prev + 1);
    };
    window.addEventListener("reconnect-realtime", handleReconnect);
    return () => window.removeEventListener("reconnect-realtime", handleReconnect);
  }, []);

  // Unified background polling to prevent race conditions and flashing
  useEffect(() => {
    if (!currentUser?.id) return;

    const pollInterval = setInterval(() => {
      // Bỏ qua nếu tab bị ẩn hoặc websocket real-time đang hoạt động tốt
      if (document.hidden || realtimeStatus === 'connected') return;

      try {
        if (fetchRefs.current.fetchDashboardApps) fetchRefs.current.fetchDashboardApps(true);
        if (fetchRefs.current.fetchApplications && activeTab === 'applications') {
          fetchRefs.current.fetchApplications(true);
        }
      } catch (err) {
        console.error("Polling fetch failed silently:", err);
      }
    }, 30000);

    return () => clearInterval(pollInterval);
  }, [currentUser?.id, activeTab, realtimeStatus]);

  const fetchApplications = async (isBackground = false) => {
    if (!isBackground) {
      setIsLoadingApps(true);
    }
    const currentRequestId = ++fetchRequestIds.current.applications;

    const controller = new AbortController();
    let timeoutId: any;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        controller.abort();
        reject(new Error('TIMEOUT'));
      }, 60000);
    });

    try {
      let query = supabase.from('records').select(RECORD_LIGHT_SELECT, { count: 'estimated' });
      
      if (search) {
        query = query.or(`unit_code.ilike.%${search}%,customer_name.ilike.%${search}%,project_name.ilike.%${search}%,phone_number.ilike.%${search}%`);
      }

      const hasProjectAssignments = currentUser?.assignedProjectIds && currentUser.assignedProjectIds.length > 0;

      if (selectedProjectId && selectedProject) {
        query = query.eq('project_name', selectedProject.name);
      } else if (userRole !== 'ADMIN') {
        if (hasProjectAssignments) {
          const assignedNames = projects.filter(p => currentUser.assignedProjectIds?.includes(p.id)).map(p => p.name);
          if (assignedNames.length > 0) {
            query = query.in('project_name', assignedNames);
          } else {
            query = query.in('project_name', ['_NO_ACCESS_']);
          }
        } else {
          query = query.in('project_name', ['_NO_ACCESS_']);
        }
      }
      
      // Advanced Filters
      if (filterStatus && filterStatus !== 'ALL' && (filterStatus as string) !== '') {
        let dbStatus = filterStatus as string;
        // Map Vietnamese labels back to DB values if they happen to be used
        const normalized = filterStatus.toLowerCase();
        if (normalized === 'đang chuẩn bị' || normalized === 'processing') dbStatus = 'Processing';
        else if (normalized === 'chờ nộp vpđk' || normalized === 'waitingvpdk') dbStatus = 'WaitingVPDK';
        else if (normalized === 'đã nộp vpđk' || normalized === 'submitted') dbStatus = 'Submitted';
        else if (normalized === 'chờ thông báo thuế' || normalized === 'taxnoticepending') dbStatus = 'TaxNoticePending';
        else if (normalized === 'chờ nộp thuế' || normalized === 'chờ hoàn thành nvtc' || normalized === 'taxpending') dbStatus = 'TaxPending';
        else if (normalized === 'đã nộp thuế' || normalized === 'taxpaid') dbStatus = 'TaxPaid';
        else if (normalized === 'đã hoàn thành nvtc' || normalized === 'taxcompleted') dbStatus = 'TaxCompleted';
        else if (normalized === 'chờ bàn giao' || normalized === 'waitinghandover') dbStatus = 'WaitingHandover';
        else if (normalized === 'hoàn tất' || normalized === 'completed') dbStatus = 'Completed';
        else if (normalized === 'sai sót/vướng' || normalized === 'error') dbStatus = 'Error';
        
        if (dbStatus === 'Processing') {
          query = query
            .eq('status', 'Processing')
            .not('current_step', 'in', '("GD2_Cho_Nop_VPDK","S2_KT_Ban_giao","S2_KT_Tiep_Nhan","GD1_Cho_KT_TiepNhan")')
            .is('accounting_handover_date', null);
        } else if (dbStatus === 'WaitingVPDK') {
          query = query.or(
            'status.eq.WaitingVPDK,' +
            'current_step.eq.GD1_Cho_KT_TiepNhan,' +
            'current_step.eq.S2_KT_Tiep_Nhan,' +
            'current_step.eq.S2_KT_Ban_giao,' +
            'current_step.eq.GD1_Nop_VPDK,' +
            'current_step.eq.GD2_Cho_Nop_VPDK'
          );
        } else if (dbStatus === 'TaxNoticePending') {
          query = query.or(
            'status.eq.Submitted,' +
            'status.eq.TaxPending,' +
            'current_step.eq.S3_Nop_VPDK,' +
            'current_step.eq.GD3_Nop_VPDK,' +
            'current_step.eq.S4_Cho_Thong_Bao_Thue'
          );
        } else if (dbStatus === 'TaxPending') {
          query = query.or(
            'status.eq.TaxPending,' +
            'current_step.eq.S5_Tai_Chinh_Khach_Hang,' +
            'current_step.eq.GD4_Cho_Nop_NVTC,' +
            'current_step.eq.GD4_Cho_KT_TiepNhan_LaySo'
          );
        } else if (dbStatus === 'WaitingHandover') {
          query = query.or(
            'status.eq.WaitingHandover,' +
            'current_step.eq.S7_PTDA_Ban_Giao,' +
            'current_step.eq.S7_1_PTT_Tiep_Nhan,' +
            'current_step.eq.S7_2_Ban_Giao_Khach,' +
            'current_step.eq.GD5_Cho_PTT_TiepNhan_BG,' +
            'current_step.eq.GD6_Cho_BG_Khach'
          );
        } else if (dbStatus === 'TaxPaid') {
          query = query.or(
            'status.eq.TaxPaid,' +
            'status.eq.TaxCompleted,' +
            'current_step.eq.S5_1_PTDA_TiepNhan'
          );
        } else if (dbStatus === 'Submitted') {
          query = query.eq('status', 'Submitted');
        } else if (dbStatus === 'Completed') {
          query = query.eq('status', 'Completed');
        } else {
          query = query.eq('status', dbStatus);
        }
      }
      if (filterLoanStatus && filterLoanStatus !== 'ALL' && (filterLoanStatus as string) !== '') {
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
        const dNorm = dashboardFilter.toUpperCase().trim();

        if (dNorm === 'ĐANG CHUẨN BỊ') {
          query = query
            .eq('status', 'Processing')
            .not('current_step', 'in', '("GD2_Cho_Nop_VPDK","S2_KT_Ban_giao","S2_KT_Tiep_Nhan","GD1_Cho_KT_TiepNhan")')
            .is('accounting_handover_date', null);
        }
        else if (dNorm === 'CHỜ NỘP VPĐK') {
          query = query.or(
            'status.eq.WaitingVPDK,' +
            'current_step.eq.GD1_Cho_KT_TiepNhan,' +
            'current_step.eq.S2_KT_Tiep_Nhan,' +
            'current_step.eq.S2_KT_Ban_giao,' +
            'current_step.eq.GD1_Nop_VPDK,' +
            'current_step.eq.GD2_Cho_Nop_VPDK'
          );
        }
        else if (dNorm === 'ĐÃ NỘP VPĐK') {
          query = query.eq('status', 'Submitted');
        }
        else if (dNorm === 'CHỜ TB THUẾ') {
          query = query
            .not('submission_date', 'is', null)
            .filter('tax_notification_date', 'is', null)
            .in('current_step', [
              'S4_Cho_Thong_Bao_Thue', 'GD3_Nop_VPDK'
            ]);
        }
        else if (dNorm === 'CHỜ HOÀN THÀNH NVTC') {
          query = query
            .not('tax_notification_date', 'is', null)
            .filter('tax_receipt_date', 'is', null)
            .in('current_step', [
              'S5_Tai_Chinh_Khach_Hang',
              'GD4_Cho_Nop_NVTC',
              'GD4_Cho_KT_TiepNhan_LaySo'
            ]);
        }
        else if (dNorm === 'ĐÃ NỘP THUẾ') {
          query = query.in('status', ['TaxCompleted', 'TaxPaid']);
        }
        else if (dNorm === 'ĐÃ CÓ GCN') {
          query = query.eq('status', 'GCN_Issued');
        }
        else if (dNorm === 'CHỜ BÀN GIAO') {
          query = query.or(
            'status.eq.WaitingHandover,' +
            'current_step.eq.S7_PTDA_Ban_Giao,' +
            'current_step.eq.S7_1_PTT_Tiep_Nhan,' +
            'current_step.eq.S7_2_Ban_Giao_Khach,' +
            'current_step.eq.GD5_Cho_PTT_TiepNhan_BG,' +
            'current_step.eq.GD6_Cho_BG_Khach'
          );
        }
        else if (dNorm === 'HOÀN TẤT') {
          query = query.eq('status', 'Completed');
        }
        else if (dashboardFilter === 'SELF_SERVICE') {
          query = query.eq('is_self_service', true);
        }
        // Giữ nguyên các filter KPI card hiện có:
        else if (dashboardFilter === 'ERROR') {
          query = query.eq('status', 'Error');
        }
        else if (dashboardFilter === 'COMPLETED') {
          query = query.eq('status', 'Completed');
        }
        else if (dashboardFilter === 'PTT_TAX_PENDING_COMPLETE') {
          query = query
            .not('tax_notification_date', 'is', null)
            .filter('tax_receipt_date', 'is', null)
            .in('current_step', [
              'S5_Tai_Chinh_Khach_Hang',
              'GD4_Cho_Nop_NVTC',
              'GD4_Cho_KT_TiepNhan_LaySo'
            ]);
        }
        else if (dashboardFilter === 'KT_TAX_PENDING_COMPLETE') {
          query = query
            .not('tax_notification_date', 'is', null)
            .filter('tax_receipt_date', 'is', null);
        }
        else if (dashboardFilter === 'SUBMITTED_RECENT') {
          query = query
            .not('submission_date', 'is', null)
            .filter('tax_notification_date', 'is', null)
            .in('current_step', [
              'S3_Nop_VPDK',
              'S4_Cho_Thong_Bao_Thue',
              'GD3_Nop_VPDK'
            ]);
        }
        else if (dashboardFilter === 'WAIT_TAX_NOTICE_OVERDUE') {
          query = query
            .not('submission_date', 'is', null)
            .filter('tax_notification_date', 'is', null)
            .in('current_step', [
              'S4_Cho_Thong_Bao_Thue',
              'GD3_Nop_VPDK'
            ]);
        }
        else if (dashboardFilter === 'PTDA_TAX_PENDING_COMPLETE') {
          query = query
            .filter('tax_receipt_date', 'is', null)
            .in('current_step', [
              'S5_Tai_Chinh_Khach_Hang',
              'GD4_Cho_Nop_NVTC'
            ]);
        }
        else if (dashboardFilter === 'PTDA_WAIT_GCN_SIGN') {
          query = query.or('status.eq.WaitingHandover,current_step.eq.GD5_Cho_PTT_TiepNhan_BG');
        }
        else if (dashboardFilter === 'PROCESSING_TOTAL') {
          query = query.neq('status', 'Completed');
        }
        else if (dashboardFilter === 'PTT_PROCESSING') {
          query = query.in('current_step', [
            'S1_ChuanBi', 'GD1_ChuanBi',
            'GD1_Cho_KT_TiepNhan',
            'S2_KT_Tiep_Nhan'
          ]);
        }
        else if (dashboardFilter === 'PTT_HOLDING') {
          const pttSteps = Object.keys(INITIAL_STEP_CONFIG).filter(k => INITIAL_STEP_CONFIG[k].dept === 'PTT');
          query = query.in('current_step', pttSteps);
        }
        else if (dashboardFilter === 'PTT_ISSUES') {
          query = query.or('is_rejected.eq.true,status.eq.Error');
        }
        else if (dashboardFilter === 'PTT_TAX_UNPAID') {
          query = query.or(
            'status.eq.TaxPending,' +
            'current_step.eq.S5_Tai_Chinh_Khach_Hang,' +
            'current_step.eq.GD4_Cho_Nop_NVTC,' +
            'current_step.eq.GD4_Cho_KT_TiepNhan_LaySo'
          );
        }
        else if (dashboardFilter === 'PTT_WAITING_HANDOVER') {
          query = query.or(
            'status.eq.WaitingHandover,' +
            'current_step.eq.S7_2_Ban_Giao_Khach,' +
            'current_step.eq.GD6_Cho_BG_Khach,' +
            'current_step.eq.S7_1_PTT_Tiep_Nhan,' +
            'current_step.eq.GD5_Cho_PTT_TiepNhan_BG'
          );
        }
        else if (dashboardFilter === 'KT_NEED_RECEIVE') {
          query = query.or(
            'current_step.eq.GD1_Cho_KT_TiepNhan,' +
            'current_step.eq.S2_KT_Tiep_Nhan,' +
            'current_step.eq.GD2_Cho_Nop_VPDK,' +
            'current_step.eq.S3_Nop_VPDK'
          );
        }
        else if (dashboardFilter === 'KT_PROCESSING') {
          query = query.in('current_step', [
            'GD1_Cho_KT_TiepNhan',
            'S2_KT_Tiep_Nhan',
            'GD2_Cho_Nop_VPDK',
            'S3_Nop_VPDK',
            'GD4_Cho_KT_TiepNhan_LaySo',
            'GD5_Cho_GCN'
          ]);
        }
        else if (dashboardFilter === 'KT_ISSUES') {
          const ktSteps = Object.keys(INITIAL_STEP_CONFIG).filter(k => INITIAL_STEP_CONFIG[k].dept === 'KT');
          query = query.in('current_step', ktSteps).or('is_rejected.eq.true,status.eq.Error');
        }
        else if (dashboardFilter === 'PTDA_NEED_RECEIVE') {
          query = query.in('current_step', [
            'S2_KT_Ban_giao', 'S5_1_PTDA_TiepNhan',
            'GD2_Cho_Nop_VPDK', 'S3_Nop_VPDK'
          ]);
        }
        else if (dashboardFilter === 'PTDA_DA_NOP_VPDK') {
          query = query.eq('current_step', 'S3_Nop_VPDK');
        }
        else if (dashboardFilter === 'PTDA_NO_TAX') {
          query = query.in('current_step', [
            'GD3_Nop_VPDK', 'S4_Cho_Thong_Bao_Thue'
          ]);
        }
        else if (dashboardFilter === 'PTDA_TAX_PENDING') {
          query = query
            .in('current_step', [
              'S5_Tai_Chinh_Khach_Hang',
              'GD4_Cho_NVTC', 'GD4_Cho_Nop_NVTC'
            ])
            .filter('tax_receipt_date', 'is', null);
        }
        else if (dashboardFilter === 'PTDA_GCN_WAITING') {
          query = query
            .in('current_step', [
              'S6_Nhan_So_GCN', 'GD5_Cho_Ky_In_GCN'
            ])
            .filter('gcn_signed_date', 'is', null);
        }
        else if (dashboardFilter === 'PTDA_ISSUES') {
          const ptdaSteps = Object.keys(INITIAL_STEP_CONFIG).filter(k => INITIAL_STEP_CONFIG[k].dept === 'PTDA');
          query = query.in('current_step', ptdaSteps).or('is_rejected.eq.true,status.eq.Error');
        }
      }
      
      const queryPromise = query
        .order('created_at', { ascending: false })
        .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1)
        .abortSignal(controller.signal);
        
      const res = await Promise.race([queryPromise, timeoutPromise]);
      clearTimeout(timeoutId);
      const { data, count, error } = res as any;
         
      if (error) throw error;
      
      // Chống Race Condition: nếu có request mới hơn thì bỏ qua data từ request cũ này
      if (currentRequestId !== fetchRequestIds.current.applications) return;

      const fetchedApps = (data || []).map(mapFromSnakeCase);
      handleSetApplications(fetchedApps);
      setTotalCount(count || 0);
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (currentRequestId !== fetchRequestIds.current.applications) return;
      
      const isAbortOrTimeout = error?.message === 'TIMEOUT' || error?.name === 'AbortError' || error?.message?.includes('aborted');
      
      if (!isAbortOrTimeout) {
        console.error('Error fetching paginated records:', error);
        showToast('Có lỗi xảy ra khi tải dữ liệu, vui lòng thử lại', 'error');
      } else if (error?.message === 'TIMEOUT') {
        showToast('Kết nối mạng quá chậm hoặc server bận, vui lòng thử lại sau!', 'warning');
      }
      
      handleSetApplications([]);
      setTotalCount(0);
      // Suppress UI error to keep dashboard smooth
    } finally {
      if (currentRequestId === fetchRequestIds.current.applications) {
        setIsLoadingApps(false);
      }
    }
  };

  useEffect(() => {
    const onOffline = () => showToast(
      '⚠️ Mất kết nối mạng', 'warning'
    );
    const onOnline = () => {
      showToast('✅ Đã kết nối lại', 'success');
      fetchApplications();
    };
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  useEffect(() => {
    setCurrentPage(0);
  }, [search, selectedProjectId, filterStatus, filterLoanStatus, filterSelfService, filterIssue, dashboardFilter, filterSLAStatus]);

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

  const fetchDashboardApps = async (isBackground = false) => {
    if (!isBackground) {
      setIsLoadingDashboard(true);
    }
    const currentRequestId = ++fetchRequestIds.current.dashboard;

    const controller = new AbortController();
    let timeoutId: any;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        controller.abort();
        reject(new Error('TIMEOUT'));
      }, 60000);
    });

    try {
      // Fetch columns using RECORD_LIGHT_SELECT to optimize bandwidth and maintain consistency
      let query = supabase.from('records').select(RECORD_LIGHT_SELECT);
      
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
          } else {
            query = query.in('project_name', ['_NO_ACCESS_']);
          }
        } else {
          query = query.in('project_name', ['_NO_ACCESS_']);
        }
      }

      const queryPromise = query.abortSignal(controller.signal);

      const res = await Promise.race([queryPromise, timeoutPromise]);
      clearTimeout(timeoutId);
      const { data, error } = res as any;
      if (error) throw error;
      
      if (currentRequestId !== fetchRequestIds.current.dashboard) return;
      
      const fetched = (data || []).map(mapFromSnakeCase);
      handleSetDashboardApps(fetched);
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (currentRequestId !== fetchRequestIds.current.dashboard) return;
      
      const isAbortOrTimeout = error?.message === 'TIMEOUT' || error?.name === 'AbortError' || error?.message?.includes('aborted');
      
      if (!isAbortOrTimeout) {
        console.error('Error fetching dashboard records:', error);
        showToast('Có lỗi xảy ra khi tải dữ liệu dashboard, vui lòng thử lại', 'error');
      } else if (error?.message === 'TIMEOUT') {
        showToast('Kết nối mạng quá chậm hoặc server bận, vui lòng thử lại sau!', 'warning');
      }
      
      handleSetDashboardApps([]);
    } finally {
      if (currentRequestId === fetchRequestIds.current.dashboard) {
        setIsLoadingDashboard(false);
      }
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

  const fetchAllApplicationsForExport = async (): Promise<Application[]> => {
    let allRows: any[] = [];
    let from = 0;
    const batchSize = 500;
    while (true) {
      let query = supabase.from('records').select(RECORD_LIGHT_SELECT)
        .range(from, from + batchSize - 1);
      
      const currentUserRole = currentUser?.dept || 'PTT';
      const hasProjectAssignments = currentUser?.assignedProjectIds && currentUser.assignedProjectIds.length > 0;

      if (selectedProjectId && selectedProject) {
        query = query.eq('project_name', selectedProject.name);
      } else if (currentUserRole !== 'ADMIN') {
        if (hasProjectAssignments) {
          const assignedNames = projects.filter(p => currentUser.assignedProjectIds?.includes(p.id)).map(p => p.name);
          if (assignedNames.length > 0) {
            query = query.in('project_name', assignedNames);
          } else {
            query = query.in('project_name', ['_NO_ACCESS_']);
          }
        } else {
          query = query.in('project_name', ['_NO_ACCESS_']);
        }
      }

      const { data, error } = await query;
      if (error) {
        console.error('[fetchAllApplicationsForExport] Lỗi:', error);
        break;
      }
      if (!data || data.length === 0) break;
      allRows = allRows.concat(data);
      if (data.length < batchSize) break;
      from += batchSize;
    }
    return allRows.map(mapFromSnakeCase);
  };

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchAllApplicationsForExport().then(setAllApplicationsForExport);
    }
  }, [activeTab, selectedProjectId]);

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

  const bulkDeleteNotificationsForRecords = async (recordIds: (string | number)[]) => {
    if (recordIds.length === 0) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .in('record_id', recordIds);
      if (error) throw error;
      setNotifications(prev => prev.filter(n => n.appId ? !recordIds.includes(n.appId) : true));
    } catch (error) {
      console.error('Error deleting bulk notifications:', error);
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
    if (!noti.recipientId) return;

    try {
      // Validate recipient exists
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', noti.recipientId);
        
      if (checkError) {
        console.error('Error checking user existence:', checkError);
        return; // Safe fallback
      }
      
      if (!existingUsers || existingUsers.length === 0) {
        console.warn(`Bỏ qua gửi thông báo: user_id ${noti.recipientId} không tồn tại.`);
        return;
      }

      const snakeData: any = mapNotificationToSnakeCase(noti);
      delete snakeData.id; // explicitly remove id to let Supabase gen_random_uuid handle it
      const { error } = await supabase.from('notifications').insert(snakeData);
      if (error) {
        if (error.code === '23503') return;
        throw error;
      }
    } catch (error) {
      console.error('Error creating notification:', error);
      // Suppress toast as notifications are non-critical background jobs
    }
  };

  const notifyNextDepartment = async (app: Application, targetStep: StepName) => {
    const step = stepConfig[targetStep] || INITIAL_STEP_CONFIG[targetStep];
    const targetDept = step.dept;
    
    // Find matching project ID from app.projectId or app.projectName fallback
    const appProjectId = app.projectId || projects.find(p => p.name === app.projectName)?.id;
    
    // Find all users in the target department
    const targetUsers = users.filter(u => 
      u.dept === targetDept && 
      u.id !== currentUser?.id &&
      typeof u.id === 'string' &&
      u.id.length === 36 &&
      (appProjectId ? (u.assignedProjectIds || []).includes(appProjectId) : true)
    );
    
    if (targetUsers.length > 0) {
      // allSettled không throw dù có lỗi FK
      await Promise.allSettled(
        targetUsers.map(u => createNotification({
          recipientId: u.id,
          title: 'Bàn giao hồ sơ mới',
          message: `Hồ sơ ${app.unitCode} đã được chuyển đến bộ phận của bạn từ ${currentUser?.name}.`,
          type: 'Info',
          appId: app.id
        }))
      );
    }
  };

  const bulkNotifyNextDepartment = async (appsToSync: Application[], targetStep: StepName) => {
    const step = stepConfig[targetStep] || INITIAL_STEP_CONFIG[targetStep];
    const targetDept = step.dept;
    
    const notificationsToInsert: any[] = [];
    
    // Thu thập trước toàn bộ user_id dự kiến gửi thông báo, để xác thực 1 lần duy nhất
    // (tránh N+1 query), phòng trường hợp cache `users` trong store bị stale do user đã bị xóa
    const candidateUserIds = new Set<string>();
    appsToSync.forEach(app => {
      const appProjectId = app.projectId || projects.find(p => p.name === app.projectName)?.id;
      users.filter(u => 
        u.dept === targetDept && 
        u.id !== currentUser?.id &&
        typeof u.id === 'string' &&
        u.id.length === 36 &&
        (appProjectId ? (u.assignedProjectIds || []).includes(appProjectId) : true)
      ).forEach(u => candidateUserIds.add(u.id));
    });

    let validUserIds = new Set<string>();
    if (candidateUserIds.size > 0) {
      try {
        const { data: existingUsers, error: userCheckError } = await supabase
          .from('users')
          .select('id')
          .in('id', Array.from(candidateUserIds));
        if (userCheckError) {
          console.error('Lỗi kiểm tra user tồn tại trước khi gửi thông báo:', userCheckError);
        } else {
          validUserIds = new Set((existingUsers || []).map(u => u.id));
        }
      } catch (err) {
        console.error('Catch error khi kiểm tra user tồn tại:', err);
      }
    }

    const skippedUserIds = Array.from(candidateUserIds).filter(id => !validUserIds.has(id));
    if (skippedUserIds.length > 0) {
      console.warn(`Bỏ qua ${skippedUserIds.length} user_id không còn tồn tại trong hệ thống khi gửi thông báo hàng loạt:`, skippedUserIds);
    }
    
    appsToSync.forEach(app => {
      const appProjectId = app.projectId || projects.find(p => p.name === app.projectName)?.id;
      const targetUsers = users.filter(u => 
        u.dept === targetDept && 
        u.id !== currentUser?.id &&
        typeof u.id === 'string' &&
        u.id.length === 36 &&
        validUserIds.has(u.id) &&
        (appProjectId ? (u.assignedProjectIds || []).includes(appProjectId) : true)
      );
      
      targetUsers.forEach(u => {
        const noti = {
          recipientId: u.id,
          title: 'Bàn giao hồ sơ mới',
          message: `Hồ sơ ${app.unitCode} đã được chuyển đến bộ phận của bạn từ ${currentUser?.name}.`,
          type: 'Info' as const,
          appId: app.id
        };
        const snake = mapNotificationToSnakeCase(noti as any);
        if ((snake as any).id) delete (snake as any).id;
        notificationsToInsert.push(snake);
      });
    });

    let failedCount = 0;
    let lastError: any = null;

    if (notificationsToInsert.length > 0) {
      // Bắn tất cả request song song — nhanh hơn for...of tuần tự,
      // Promise.allSettled đảm bảo 1 request lỗi không ảnh hưởng các request khác.
      const notificationPromises = notificationsToInsert.map(async (noti) => {
        try {
          const { error } = await supabase.from('notifications').insert(noti);
          if (error) {
            if (error.code === '23503') {
              console.warn('Bỏ qua 1 notification do user không còn tồn tại (FK violation):', error.details);
              return { success: false, isUserDeleted: true };
            }
            console.error('Lỗi insert notification:', error);
            return { success: false, error };
          }
          return { success: true };
        } catch (err) {
          console.error('Catch error khi insert notification:', err);
          return { success: false, error: err };
        }
      });

      const results = await Promise.allSettled(notificationPromises);

      let fkViolations = 0;
      results.forEach(r => {
        if (r.status === 'fulfilled' && !r.value.success) {
          if (r.value.isUserDeleted) {
            fkViolations++;
          } else {
            failedCount++;
            if (r.value.error) lastError = r.value.error;
          }
        } else if (r.status === 'rejected') {
          failedCount++;
        }
      });
      
      const totalSkipped = skippedUserIds.length + fkViolations;
      const actualAttempts = notificationsToInsert.length - fkViolations;

      if (failedCount > 0 && failedCount === actualAttempts) {
        return { success: false, skippedCount: totalSkipped, error: lastError };
      }

      return { success: true, skippedCount: totalSkipped };
    }

    const totalSkipped = skippedUserIds.length + failedCount;

    if (failedCount > 0 && failedCount === notificationsToInsert.length) {
      return { success: false, skippedCount: totalSkipped, error: lastError };
    }

    return { success: true, skippedCount: totalSkipped };
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
        // Ước tính "mới" dựa trên receivedDate gần đây (trong 3 ngày)
        // vì không có history[] trong dashboardApps để check chính xác performedBy
        const receivedTime = app.receivedDate ? new Date(app.receivedDate).getTime() : 0;
        const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
        const isNew = receivedTime > 0 && (Date.now() - receivedTime) < threeDaysMs;
        
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
  const [isEditing, setIsEditing] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [dateErrors, setDateErrors] = useState<Record<string, string>>({});
  const [isBulkRejectModalOpen, setIsBulkRejectModalOpen] = useState(false);
  // const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  // const [isBulkTransitionModalOpen, setIsBulkTransitionModalOpen] = useState(false);
  // const [editUser, setEditUser] = useState<UserProfile | null>(null);
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
  // const [editApp, setEditApp] = useState<Application | null>(null);
  // const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const isEditingRef = useRef(isEditing);
  const editAppRef = useRef(editApp);
  const selectedAppRef = useRef(selectedApp);

  useEffect(() => {
    isEditingRef.current = isEditing;
    editAppRef.current = editApp;
    selectedAppRef.current = selectedApp;
  }, [isEditing, editApp, selectedApp]);

  // Keep selectedApp in sync with applications array for background sync updates
  useEffect(() => {
    if (selectedAppRef.current) {
      const updated = applications.find(a => a.id === selectedAppRef.current?.id);
      // We do a simple reference check here, because Zustand returns a new object if modified.
      if (updated && updated !== selectedAppRef.current) {
        setSelectedApp(updated);
      }
    }
  }, [applications]);

  const visibleProjects = useMemo(() => {
    let baseProjects = projects;
    if (userRole !== 'ADMIN') {
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

  const handleSelectApp = useCallback(async (app: Application | null) => {
    setConflictWarning(null);
    if (!app) {
      setSelectedApp(null);
      return;
    }

    // Guard: kiểm tra quyền xem dự án trước khi mở modal
    if (userRole !== 'ADMIN' && app.projectName) {
      const hasAccess = visibleProjects.some(p => p.name === app.projectName);
      if (!hasAccess) {
        showToast('Bạn không có quyền xem hồ sơ thuộc dự án này.', 'error');
        return;
      }
    }

    // Mở modal ngay với data hiện có (không chờ)
    setSelectedApp({ ...app, history: app.history || [], auditTrail: app.auditTrail || [] });
    // Fetch history + audit + full record bất đồng bộ
    const detail = await fetchRecordDetail(app.id!, app.unitCode);
    setSelectedApp(prev => {
      if (prev?.id !== app.id) return prev;
      
      const merged = { ...prev };
      
      // Merge fullApp trước (nếu có)
      if (detail.fullApp) {
        Object.entries(detail.fullApp).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            (merged as any)[key] = val;
          } else if ((merged as any)[key] === undefined || (merged as any)[key] === null) {
            (merged as any)[key] = val;
          }
        });
      }
      
      // Merge history và auditTrail
      merged.history = detail.history && detail.history.length > 0 ? detail.history : merged.history;
      merged.auditTrail = detail.auditTrail && detail.auditTrail.length > 0 ? detail.auditTrail : merged.auditTrail;
      
      return merged;
    });
  }, [userRole, visibleProjects, showToast]);

  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  useEffect(() => {
    if (userRole) {
      if (userRole === 'PTT' || userRole === 'MANAGER_PTT') {
        setExpandedSections(['PTT_SECTION', 'OTHER_SECTION']);
      } else if (userRole === 'KT' || userRole === 'MANAGER_KT') {
        setExpandedSections(['KT_SECTION', 'OTHER_SECTION']);
      } else if (userRole === 'PTDA' || userRole === 'MANAGER_PTDA') {
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
  
  // const [isHandoverTicketOpen, setIsHandoverTicketOpen] = useState(false);
  
  const handlePrintHandoverTicket = () => {
    setIsHandoverTicketOpen(true);
  };
  
  const [isSavingApp, setIsSavingApp] = useState(false);

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
    isBulkAssignOpen,
    setIsBulkAssignOpen,
    bulkAssignUserId,
    setBulkAssignUserId,
    handleBulkAssign,
    canBulkAssign,
    assignableUsers,
  } = useBulkActions({
    applications,
    setApplications,
    bulkSyncRecordsToSupabase: bulkSync,
    updateAppIssue,
    showToast,
    setIsSavingApp,
    users,
    currentUser,
  });
  const [selectedAppUnitCodes, setSelectedAppUnitCodes] = useState<Record<string, string>>({});

  useEffect(() => {
    setSelectedAppUnitCodes(prev => {
      const next = { ...prev };
      applications.forEach(a => {
        if (selectedAppIds.includes(a.id)) next[String(a.id)] = a.unitCode;
      });
      return next;
    });
  }, [selectedAppIds, applications]);

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

  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [projectSearch, setProjectSearch] = useState('');
  // const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shortcut 2 — Ctrl/Cmd+K focus vào ô tìm kiếm
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        return;
      }

      // Don't interfere if an input/textarea/select is focused
      const target = e.target as HTMLElement;
      const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
      
      // Global Escape handler for modals (Shortcut 1)
      if (e.key === 'Escape') {
        if (isUserModalOpen) {
          setIsUserModalOpen(false);
          return;
        }
        if (isProjectModalOpen) {
          setIsProjectModalOpen(false);
          return;
        }
        if (isBulkTransitionModalOpen) {
          setIsBulkTransitionModalOpen(false);
          return;
        }
        if (selfServiceHandoverModal) {
          setSelfServiceHandoverModal(null);
          return;
        }
        if (selectedApp) {
          setSelectedApp(null);
          setIsEditing(false);
          setDateErrors({});
          return;
        }
      }

      // Shortcut 3 — Arrow keys navigate giữa hồ sơ (chỉ active khi có selectedApp và không đang edit)
      if (selectedApp && !isEditing && !isInputFocused) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          const currentList = displayedApps || applications;
          if (currentList && currentList.length > 0) {
            const currentIdx = currentList.findIndex((a: any) => a.id === selectedApp.id);
            if (currentIdx !== -1) {
              const nextIdx = e.key === 'ArrowDown'
                ? Math.min(currentIdx + 1, currentList.length - 1)
                : Math.max(currentIdx - 1, 0);
              if (nextIdx !== currentIdx) {
                handleSelectApp(currentList[nextIdx]);
              }
            }
          }
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
        const visibleApps = displayedApps.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
        
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => {
            if (e.ctrlKey || e.metaKey) return visibleApps.length - 1;
            const next = (prev === null) ? 0 : Math.min(prev + 1, visibleApps.length - 1);
            if (e.shiftKey && lastSelectedIndex !== null) {
              const start = Math.min(lastSelectedIndex, next);
              const end = Math.max(lastSelectedIndex, next);
              setSelectedAppIds(prevIds => {
                const newSelection = new Set(prevIds);
                for (let i = start; i <= end; i++) {
                  if (visibleApps[i]) newSelection.add(visibleApps[i].id);
                }
                return Array.from(newSelection);
              });
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
              setSelectedAppIds(prevIds => {
                const newSelection = new Set(prevIds);
                for (let i = start; i <= end; i++) {
                  if (visibleApps[i]) newSelection.add(visibleApps[i].id);
                }
                return Array.from(newSelection);
              });
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
          handleSelectApp(visibleApps[selectedIndex]);
        } else if (e.key === ' ' && selectedIndex !== null) {
          e.preventDefault();
          const appId = visibleApps[selectedIndex]?.id;
          if (appId) {
            setSelectedAppIds(prev => {
              const next = new Set(prev);
              if (next.has(appId)) next.delete(appId);
              else next.add(appId);
              return Array.from(next);
            });
          }
        }
        // Ctrl + A: Select all filtered rows
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
          e.preventDefault();
          if (selectedAppIds.length === displayedApps.length) {
            setSelectedAppIds([]);
            showToast(`Đã bỏ chọn tất cả hồ sơ`, 'info');
          } else {
            const allIds = displayedApps.map(a => a.id);
            setSelectedAppIds(allIds);
            showToast(`Đã chọn tất cả ${displayedApps.length} hồ sơ`, 'success');
          }
        }

        // Ctrl + C: Copy selected rows to clipboard for Excel
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
          if (selectedAppIds.length > 0) {
            e.preventDefault();
            const selectedSet = new Set(selectedAppIds);
            const rowsToCopy = displayedApps.filter(app => selectedSet.has(app.id));
            
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
  }, [selectedApp, isEditing, currentUser, activeTab, displayedApps, selectedIndex, selectedAppIds, lastSelectedIndex, currentPage, pageSize, isProjectModalOpen, isUserModalOpen, isBulkTransitionModalOpen, selfServiceHandoverModal, applications]);

  // const [editingProject, setEditingProject] = useState<Project | null>(null);
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
    if (!id || Object.keys(quickEditData).length === 0) {
      setQuickEditId(null);
      setQuickEditData({});
      return;
    }
    setIsSavingApp(true);
    const result = await quickSave(id, quickEditData);
    if (result.success && result.finalApp) {
      if (selectedApp?.id === id) setSelectedApp(result.finalApp);
    }
    showToast(result.message, result.success ? 'success' : 'error');
    setQuickEditId(null);
    setQuickEditData({});
    setIsSavingApp(false);
  };

  useEffect(() => {
    localStorage.setItem('procedural_handover_template', JSON.stringify(handoverTemplate));
  }, [handoverTemplate]);


  // const [isReportIssueFormOpen, setIsReportIssueFormOpen] = useState(false);
  const [reportIssueType, setReportIssueType] = useState<IssueType>('Sai sót Khác');
  const [reportIssueSeverity, setReportIssueSeverity] = useState<IssueSeverity>('Moderate');
  const [reportIssueNote, setReportIssueNote] = useState('');

  const handleSingleOrBulkReportIssue = async (apps: Application[]) => {
    setIsSavingApp(true);
    const result = await reportIssue(apps, reportIssueType, reportIssueSeverity, reportIssueNote);
    if (result.success) {
      setIsReportIssueFormOpen(false);
      setReportIssueNote('');
    }
    showToast(result.message, result.success ? 'success' : 'error');
    setIsSavingApp(false);
  };

  const [bulkTransitionTarget, setBulkTransitionTarget] = useState<StepName | null>(null);
  const [bulkTransitionField, setBulkTransitionField] = useState<{key: keyof Application, label: string, isRequired?: boolean} | null>(null);
  const [bulkTransitionValue, setBulkTransitionValue] = useState(new Date().toISOString().split('T')[0]);
  const [bulkTransitionLocation, setBulkTransitionLocation] = useState<'PHUONG' | 'TP_DANANG'>('PHUONG');
  const [bulkTransitionRefCode, setBulkTransitionRefCode] = useState('');
  const [bulkTransitionKtHandover, setBulkTransitionKtHandover] = useState(new Date().toISOString().split('T')[0]);

  const availableStepsForBulkReject = useMemo(() => {
    const firstApp = applications.find(a => selectedAppIds.includes(a.id));
    if (!firstApp) return [];
    const workflowSteps = firstApp.workflowType === 'Quy_trinh_2' ? WORKFLOW_2_STEPS : WORKFLOW_1_STEPS;
    const currentIdx = workflowSteps.indexOf(firstApp.currentStep as StepName);
    return workflowSteps.slice(0, currentIdx)
      .map(s => ({ value: s, label: (stepConfig[s] || INITIAL_STEP_CONFIG[s])?.label || s }))
      .reverse();
  }, [applications, selectedAppIds, stepConfig]);

  const bulkTransitionChronoError = useMemo(() => {
    if (!bulkTransitionField || !bulkTransitionValue || selectedAppIds.length === 0) return null;
    
    let firstError: string | null = null;
    let firstWarning: string | null = null;
    
    for (const id of selectedAppIds) {
      const app = applications.find(a => a.id === id);
      if (!app) continue;
      
      const appWithDate = { ...app, [bulkTransitionField.key]: bulkTransitionValue };
      if (bulkTransitionTarget === 'S3_Nop_VPDK' && app.workflowType === 'Quy_trinh_2') {
        appWithDate.ktHandoverToPtdaDate = bulkTransitionKtHandover;
      }
      const vpdKSteps = ['S3_Nop_VPDK', 'GD3_Nop_VPDK'];
      if (vpdKSteps.includes(bulkTransitionTarget || '')) {
        if (bulkTransitionLocation !== undefined) appWithDate.submissionLocation = bulkTransitionLocation as any;
        if (bulkTransitionRefCode !== undefined) appWithDate.vpdkCode = bulkTransitionRefCode;
      }
      
      const err = validateDateSequence(appWithDate);
      if (err) {
        if (err.startsWith('⚠️')) {
          if (!firstWarning) firstWarning = err;
        } else {
          if (!firstError) firstError = `Căn ${app.unitCode}: ${err}`;
        }
      }
    }
    
    return firstError || firstWarning;
  }, [applications, selectedAppIds, bulkTransitionField, bulkTransitionValue, bulkTransitionTarget, bulkTransitionLocation, bulkTransitionRefCode, bulkTransitionKtHandover]);

  // SPREADSHEET MODE STATES
  const [isSpreadsheetMode, setIsSpreadsheetMode] = useState(false);
  const isValidDate = (d: string | null | undefined) => d && d !== '---' && d.trim() !== '';
  const [spreadsheetChanges, setSpreadsheetChanges] = useState<Record<string, Partial<Application>>>({});
  const [spreadsheetErrors, setSpreadsheetErrors] = useState<Record<string, Record<string, string>>>({});
  const [activeCell, setActiveCell] = useState<{ id: string, field: string } | null>(null);

  const EDITABLE_DATE_FIELDS = [
    { key: 'receivedDate', label: 'Ngày nhận HS' },
    { key: 'contractSigningDate', label: 'Ngày ký HĐCN' },
    { key: 'submissionDate', label: 'Ngày nộp VPĐK' },
    { key: 'taxNotificationDate', label: 'Ngày TB Thuế' },
    { key: 'taxReceiptDate', label: 'Ngày nộp tiền' },
    { key: 'gcnReceivedDate', label: 'Ngày nhận GCN' },
    { key: 'customerHandoverDate', label: 'Ngày BG Khách' }
  ];

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
    
    const startIdx = displayedApps.findIndex(a => a.id === startId);
    if (startIdx === -1) return;
    
    const startFieldIdx = EDITABLE_DATE_FIELDS.findIndex(f => f.key === startField);

    rows.forEach((row, ri) => {
      const columns = row.split('\t');
      let targetApp: Application | undefined = displayedApps[startIdx + ri];
      let rowData = columns;
      let fieldOffset = startFieldIdx;

      // Logic "Mapping ID": If first column matches a unitCode in system, use that row
      const firstCol = columns[0]?.trim().toLowerCase();
      if (!firstCol) return;

      const matchedApp = applications.find(a => 
        (a.unitCode || '').trim().toLowerCase() === firstCol || 
        (a.id !== undefined && String(a.id).toLowerCase() === firstCol)
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

      if (!targetApp || targetApp.id === undefined) return;
      const appIdStr = String(targetApp.id);

      rowData.forEach((val, ci) => {
        const fieldObj = EDITABLE_DATE_FIELDS[fieldOffset + ci];
        if (!fieldObj) return;
        
        const field = fieldObj.key;
        const trimmedVal = val.trim();
        
        if (!newChanges[appIdStr]) newChanges[appIdStr] = {};
        (newChanges[appIdStr] as any)[field] = trimmedVal;
        
        // Inline Validation: Allow /, -, .
        const isValid = !trimmedVal || trimmedVal === '---' || 
                        /^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})$/.test(trimmedVal) || 
                        /^\d{4}-\d{2}-\d{2}$/.test(trimmedVal);
        if (!isValid) {
          if (!newErrors[appIdStr]) {
            (newErrors as any)[appIdStr] = {};
          }
          (newErrors as any)[appIdStr][field] = 'Ngày không đúng định dạng (dd/mm/yyyy)';
        } else {
          if (newErrors[appIdStr]) {
            delete (newErrors as any)[appIdStr][field];
            if (Object.keys((newErrors as any)[appIdStr]).length === 0) {
              delete (newErrors as any)[appIdStr];
            }
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
        errors: [] as string[],
        warnings: [] as string[]
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
          if (dateError.startsWith('⚠️')) {
            results.warnings.push(`Căn ${original.unitCode || id}: ${dateError}`);
          } else {
            results.error++;
            results.errors.push(`Căn ${original.unitCode || id}: ${dateError}`);
            continue;
          }
        }

        let updated = { ...mergedApp, updated_at: nowStr };

        const auditEntry = createAuditEntry('Chỉnh sửa Grid lưới', false, 1, updated.unitCode, `Các trường chỉnh sửa: ${Object.keys(processedChanges).join(', ')}`);
        updated.auditTrail = [auditEntry, ...(updated.auditTrail || [])];

        // Removed inference from RUNTIME mode here.
        // Step and Status remain as they were in original unless modified via WorkflowEngine.

        if (processedChanges.gcnReceivedDate) {
          const isBypassed = updated.checklist?.['bypass_gcn'] === true;
          const isEarly = !isBypassed && ['GD1','GD2','GD3','GD4','S1','S2','S3','S4','S5'].some(prefix => (original.currentStep as string).startsWith(prefix));
          if (isEarly) {
            updated.issueType = 'Sai sót Khác';
            updated.issueNotes = (updated.issueNotes ? updated.issueNotes + '\n' : '') + 'Cảnh báo: Lệch tiến độ thực tế (Có ngày nhận GCN nhưng chưa tới bước bàn giao)';
            updated.issueSeverity = 'High';
            updated.status = 'Error';
            updated.issueStatus = 'OPEN';
            updated.issueResolvedAt = null;
            if (!updated.issueCreatedAt) updated.issueCreatedAt = new Date().toISOString();
          }
        }

        // Ensure full initialization for new imported records (temporary imp ID)
        if (typeof updated.id === 'string' && (updated.id.includes('-imp-') || !applications.some(a => a.id === updated.id))) {
          const parentProject = projects.find(p => p.name.toLowerCase() === updated.projectName?.toLowerCase());
          const inheritedWorkflowType = parentProject?.workflowType || 'Quy_trinh_1';
          const initialStep = inheritedWorkflowType === 'Quy_trinh_2' ? 'S1_ChuanBi' : 'GD1_ChuanBi';
          const initialStatus = (stepConfig as any)[initialStep]?.status || 'Processing';
          
          updated = {
            ...updated,
            workflowType: updated.workflowType || inheritedWorkflowType,
            currentStep: updated.currentStep || initialStep,
            status: updated.status || initialStatus,
            receivedDate: updated.receivedDate || '',
            taxPaymentStatus: updated.taxPaymentStatus || 'Unpaid',
            submissionLocation: updated.submissionLocation,
            isSelfService: typeof updated.isSelfService === 'boolean' ? updated.isSelfService : false,
            propertyType: updated.propertyType || 'Dat_Nen',
            loanStatus: updated.loanStatus || 'Khong_Vay',
            checklist: updated.checklist || {},
            history: updated.history && updated.history.length > 0 ? updated.history : [
              {
                id: generateUUID(),
                stepName: (stepConfig[initialStep] || INITIAL_STEP_CONFIG[initialStep]).label,
                dept: 'PTT',
                receivedDate: new Date().toISOString(),
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
        handleSetApplications(finalUpdatedApps);
        let msg = `Cập nhật thành công: ${results.success} căn.`;
        if (results.skipped > 0) msg += ` (Bỏ qua ${results.skipped} căn không đổi).`;
        if (results.warnings && results.warnings.length > 0) {
          msg += ` (${results.warnings.length} lưu ý)`;
          showToast(`Lưu ý ngày tương lai: ${results.warnings.slice(0, 3).join(', ')}${results.warnings.length > 3 ? '...' : ''}`, 'warning');
        }
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

  // const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newApp, setNewApp] = useState({
    unitCode: '',
    customerName: '',
    contractSignerType: '',
    projectName: '',
    propertyType: 'Dat_Nen' as PropertyType,
    loanStatus: 'Khong_Vay' as 'Co_Vay' | 'Khong_Vay',
    submissionLocation: undefined as 'PHUONG' | 'TP_DANANG' | undefined,
    currentStep: 'S1_ChuanBi' as StepName,
    isSelfService: false,
    commitmentDate: '',
    handoverApartmentDate: '',
    receivedDate: ''
  });

  // Ensure newApp.projectName is set to a valid project the user has access to
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const selectedProject = useMemo(() => 
    projects.find(p => p.id === selectedProjectId), 
  [projects, selectedProjectId]);

  const dashboardStats = useDashboardStats(selectedProjectId, selectedProject, dashboardTab);

  const {
    isImporting,
    importPreviewData,
    setImportPreviewData,
    handleDownloadTemplate: importDownloadTemplate,
    handleParseTemplate,
    handleConfirmImport,
    healDone,
    healExistingRecords
  } = useExcelImport({
    applications,
    projects,
    isManagementEdit,
    selectedProjectId,
    dashboardApps,
    slaConfig,
    showToast,
    fetchApplications,
    setApplications,
    setHighlightedAppId,
    setActiveTab,
    visibleProjects,
    bulkSyncRecordsToSupabase: bulkSync,
    supabase,
    userRole,
    currentUser
  });

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

  const VALID_ISSUE_TYPES = [
    'None', 'Sai sót nội bộ', 'Sai sót khách hàng',
    'Sai sót cơ quan nhà nước', 'Sai sót chủ đầu tư', 
    'Sai sót Khác'
  ] as const;
  
  const VALID_SEVERITIES = [
    'Minor', 'Moderate', 'Critical'
  ] as const;

  const addDropdownValidation = (
    worksheet: XLSX.WorkSheet,
    col: string,        // Ký tự cột: 'A', 'B', 'E'...
    startRow: number,   // Bắt đầu từ dòng data (thường là 2)
    endRow: number,     // Kết thúc (thường = data.length + 1)
    options: string[]   // Danh sách giá trị hợp lệ
  ) => {
    if (!worksheet['!dataValidations']) {
      worksheet['!dataValidations'] = [];
    }
    worksheet['!dataValidations'].push({
      sqref: `${col}${startRow}:${col}${endRow}`,
      type: 'list',
      formula1: `"${options.join(',')}"`,
      showDropDown: false,  // false = hiện dropdown arrow
      showErrorMessage: true,
      errorTitle: 'Giá trị không hợp lệ',
      error: `Vui lòng chọn một trong: ${options.join(', ')}`,
      errorStyle: 'stop'
    });
  };

  const validateExcelValue = (
    val: any,
    allowedValues: readonly string[],
    fieldName: string,
    rowIdx: number,
    warnings: string[]
  ) => {
    const strVal = (val || '').toString().trim();
    if (!strVal || strVal === '---') return undefined;
    if (allowedValues.includes(strVal as any)) return strVal;
    
    warnings.push(`⚠️ Dòng ${rowIdx + 2}: Giá trị "${strVal}" không hợp lệ cho cột ${fieldName} → bỏ qua`);
    return undefined;
  };

  const handleDownloadTemplate = () => {
    let headers: string[] = [];
    let data: any[][] = [];
    const sourceApps = selectedProjectId ? dashboardApps : applications;

    const getColumnLetter = (index: number): string => {
      let temp = index;
      let letter = '';
      while (temp >= 0) {
        letter = String.fromCharCode((temp % 26) + 65) + letter;
        temp = Math.floor(temp / 26) - 1;
      }
      return letter;
    };

    const normalizeStr = (str: any) => {
      if (!str) return '';
      return str.toString()
        .trim()
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9/()_-\s]/g, "");
    };

    const getHeaderColLetter = (headerName: string): string => {
      const normTarget = normalizeStr(headerName);
      const idx = headers.findIndex(h => normalizeStr(h).includes(normTarget));
      return idx !== -1 ? getColumnLetter(idx) : '';
    };

    if (isManagementEdit) {
      headers = [
        "Dự án", "Mã lô/căn", "Khách hàng", "Đối tượng ký HĐCN", "Số điện thoại", "Số GCNQSDĐ", "Vay ngân hàng (Có/Không)", "Loại tài sản (Căn hộ/Đất nền)", 
        "Hạn GCN cam kết", "Ngày nhận hồ sơ", "Ngày ký HĐCN", "Ngày bàn giao căn hộ", "Tự làm sổ (Có/Không)", "Ngày bàn giao sang KT",
        "Nơi nộp", "Mã VPĐK", "Ngày nộp hồ sơ", "Ngày TB Thuế", "Ngày nhận TB Thuế", "Ngày đóng thuế", 
        "Ngày GCN đã ký", "Ngày GCN đã nhận", "Ngày KT bàn giao PTDA", "Ngày nộp hồ sơ NVTC vào VPĐK", "Ngày cấp TB Thuế", "Ngày BG KT", "Ngày BG GCN Khách"
      ];
      data = sourceApps.map(app => [
        app.projectName,
        app.unitCode,
        app.customerName,
        app.contractSignerType || '',
        app.phoneNumber || '',
        app.gcnNumber || '',
        app.loanStatus === 'Co_Vay' ? 'Có' : 'Không',
        app.propertyType === 'Can_Ho' ? 'Căn hộ' : 'Đất nền',
        formatExcelDate(app.commitmentDate),
        formatExcelDate(app.receivedDate),
        formatExcelDate(app.contractSigningDate),
        formatExcelDate(app.handoverApartmentDate),
        app.isSelfService ? 'Có' : 'Không',
        formatExcelDate(app.accountingHandoverDate),
        app.submissionLocation || '',
        app.vpdkCode || '',
        formatExcelDate(app.submissionDate),
        formatExcelDate(app.taxNotificationDate),
        formatExcelDate(app.taxNotificationReceivedDate),
        formatExcelDate(app.taxReceiptDate),
        formatExcelDate(app.gcnSignedDate),
        formatExcelDate(app.gcnReceivedDate),
        formatExcelDate(app.ktHandoverToPtdaDate),
        formatExcelDate(app.taxVpdkSubmissionDate),
        formatExcelDate(app.taxNoticeProvisionDate),
        formatExcelDate(app.ptdaHandoverDate),
        formatExcelDate(app.customerHandoverDate)
      ]);
    } else if (userRole === 'PTT' || userRole === 'MANAGER_PTT') {
      headers = [
        "Dự án", "Mã lô/căn", "Tên khách hàng", "Đối tượng ký HĐCN", "Số điện thoại", "Số GCNQSDĐ", "Vay ngân hàng (Có/Không)", "Loại tài sản", 
        "Ngày nhận hồ sơ", "Ngày ký HĐCN", "Hạn cam kết Ngân hàng", "Ngày bàn giao căn hộ", "Tự làm sổ (Có/Không)", "Ngày bàn giao sang KT", "Ngày nhận GCN", "Ngày BG GCN Khách",
        "Phân loại sai sót", "Mức độ sai sót", "Ghi chú sai sót"
      ];
      data = sourceApps.map(app => {
        return [
          app.projectName,
          app.unitCode,
          app.customerName,
          app.contractSignerType || '',
          app.phoneNumber || '',
          app.gcnNumber || '',
          app.loanStatus === 'Co_Vay' ? 'Có' : 'Không',
          app.propertyType === 'Can_Ho' ? 'Căn hộ' : 'Đất nền',
          formatExcelDate(app.receivedDate),
          formatExcelDate(app.contractSigningDate),
          formatExcelDate(app.bankCommitmentDeadline),
          formatExcelDate(app.handoverApartmentDate),
          app.isSelfService ? 'Có' : 'Không',
          formatExcelDate(app.accountingHandoverDate),
          formatExcelDate(app.gcnReceivedDate),
          formatExcelDate(app.customerHandoverDate),
          app.issueType || '',
          app.issueSeverity || '',
          app.issueNotes || ''
        ];
      });
    } else if (userRole === 'KT' || userRole === 'MANAGER_KT') {
      headers = [
        "Dự án", "Mã lô/căn", "Khách hàng", "Nơi nộp (Phường/TP)", "Mã HS/Số phiếu hẹn VPĐK", "Ngày nộp VPĐK", 
        "Ngày TB Thuế", "Ngày nhận TB Thuế", "Ngày đóng thuế", "Ngày nhận GCN", "Ngày BG P.TDA", "Ngày KT bàn giao PTDA", "Ngày nộp hồ sơ NVTC vào VPĐK", "Ngày cấp TB Thuế", 
        "Phân loại sai sót", "Mức độ sai sót", "Ghi chú sai sót"
      ];
      data = sourceApps.map(app => [
        app.projectName,
        app.unitCode,
        app.customerName,
        app.submissionLocation === 'PHUONG' ? 'Phường/Xã' : 'TP Đà Nẵng',
        app.vpdkCode || '',
        formatExcelDate(app.submissionDate),
        formatExcelDate(app.taxNotificationDate),
        formatExcelDate(app.taxNotificationReceivedDate),
        formatExcelDate(app.taxReceiptDate),
        formatExcelDate(app.gcnReceivedDate),
        formatExcelDate(app.ptdaHandoverDate),
        formatExcelDate(app.ktHandoverToPtdaDate),
        formatExcelDate(app.taxVpdkSubmissionDate),
        formatExcelDate(app.taxNoticeProvisionDate),
        app.issueType || '',
        app.issueSeverity || '',
        app.issueNotes || ''
      ]);
    } else if (userRole === 'PTDA' || userRole === 'MANAGER_PTDA') {
      headers = [
        "Dự án", "Mã lô/căn",
        "Ngày TB Thuế",
        "Ngày cấp TB Thuế", 
        "Ngày đóng thuế",
        "Ngày KT bàn giao PTDA",
        "Ngày nộp hồ sơ NVTC vào VPĐK",
        "Ngày trình ký GCN",
        "Ngày nhận GCN thực tế",
        "Phân loại sai sót",
        "Mức độ sai sót",
        "Ghi chú sai sót"
      ];
      data = sourceApps.map(app => [
        app.projectName,
        app.unitCode,
        formatExcelDate(app.taxNotificationDate),
        formatExcelDate(app.taxNoticeProvisionDate),
        formatExcelDate(app.taxReceiptDate),
        formatExcelDate(app.ktHandoverToPtdaDate),
        formatExcelDate(app.taxVpdkSubmissionDate),
        formatExcelDate(app.gcnSignedDate),
        formatExcelDate(app.gcnReceivedDate),
        app.issueType && app.issueType !== 'None' ? app.issueType : '',
        app.issueSeverity || '',
        app.issueNotes || ''
      ]);
    } else {
      // Default / Admin: Full Template for complete control
      headers = [
        "Dự án", "Mã lô/căn", "Khách hàng", "Đối tượng ký HĐCN", "Số điện thoại", "Số GCNQSDĐ", "Vay ngân hàng", "Loại tài sản", 
        "Hạn cam kết vay", "Ngày nhận hồ sơ", "Ngày ký HĐCN", "Ngày bàn giao căn hộ", "Tự làm sổ", "Ngày bàn giao sang KT",
        "Nơi nộp", "Mã HS VPĐK", "Ngày nộp VPĐK", "Ngày TB Thuế", "Ngày nhận TB Thuế", 
        "Ngày nhận NVTC", "Ngày KT bàn giao PTDA", "Ngày nộp hồ sơ NVTC vào VPĐK", "Ngày cấp TB Thuế", "Ngày trình ký GCN", "Ngày nhận GCN thực tế", "Ngày BG Pkt", "Ngày BG Khách"
      ];
      data = sourceApps.map(app => [
        app.projectName,
        app.unitCode,
        app.customerName,
        app.contractSignerType || '',
        app.phoneNumber || '',
        app.gcnNumber || '',
        app.loanStatus === 'Co_Vay' ? 'Có' : 'Không',
        app.propertyType === 'Can_Ho' ? 'Căn hộ' : 'Đất nền',
        formatExcelDate(app.bankCommitmentDeadline),
        formatExcelDate(app.receivedDate),
        formatExcelDate(app.contractSigningDate),
        formatExcelDate(app.handoverApartmentDate),
        app.isSelfService ? 'Có' : 'Không',
        formatExcelDate(app.accountingHandoverDate),
        app.submissionLocation === 'PHUONG' ? 'Phường/Xã' : app.submissionLocation === 'TP_DANANG' ? 'Tỉnh/Thành phố' : '',
        app.vpdkCode || '',
        formatExcelDate(app.submissionDate),
        formatExcelDate(app.taxNotificationDate),
        formatExcelDate(app.taxNotificationReceivedDate),
        formatExcelDate(app.taxReceiptDate),
        formatExcelDate(app.ktHandoverToPtdaDate),
        formatExcelDate(app.taxVpdkSubmissionDate),
        formatExcelDate(app.taxNoticeProvisionDate),
        formatExcelDate(app.gcnSignedDate),
        formatExcelDate(app.gcnReceivedDate),
        formatExcelDate(app.ptdaHandoverDate),
        formatExcelDate(app.customerHandoverDate)
      ]);
    }

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const dataEndRow = data.length + 1;

    const addDropdownByHeaderName = (headerName: string, allowedValues: string[]) => {
      const colLetter = getHeaderColLetter(headerName);
      if (colLetter) {
        addDropdownValidation(worksheet, colLetter, 2, dataEndRow, allowedValues);
      }
    };

    addDropdownByHeaderName('Vay ngân hàng', ['Có', 'Không']);
    addDropdownByHeaderName('Loại tài sản', ['Căn hộ', 'Đất nền']);
    addDropdownByHeaderName('Tự làm sổ', ['Có', 'Không']);
    addDropdownByHeaderName('Nơi nộp', ['Phường/Xã', 'TP Đà Nẵng']);
    addDropdownByHeaderName('Phân loại sai sót', [...VALID_ISSUE_TYPES]);
    addDropdownByHeaderName('Mức độ sai sót', [...VALID_SEVERITIES]);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "HoSo");
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(blob, `Template_GCN_${userRole}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleBulkPrint = () => {
    if (selectedAppIds.length === 0) return;
    const appsToPrint = applications.filter(a => selectedAppIds.includes(a.id));
    setPrintHandoverApps(appsToPrint);
    setIsPrintingHandover(true);
  };

  const handleUpdateApp = async () => {
    if (!editApp || !selectedApp) return;

    const err = validateDateSequence(editApp);
    if (err) {
      showToast(err, 'error');
      return;
    }

    setIsSavingApp(true);
    const result = await updateApp(editApp);
    if (result.success && result.finalApp) {
      setSelectedApp(result.finalApp);
      setEditApp(null);
      setIsEditing(false);
      setDateErrors({});
    }
    showToast(result.message, result.success ? 'success' : 'error');
    setIsSavingApp(false);
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
    askConfirm(
      'Xác nhận xóa hồ sơ',
      `Bạn có chắc chắn muốn xóa hồ sơ căn ${code}? Thao tác này không thể hoàn tác.`,
      async () => {
        setIsSavingApp(true);
        const result = await deleteApp(id, code, cleanupFilesForRecords);
        if (result.success) {
          if (selectedApp?.id === id) {
            setSelectedApp(null);
            setIsEditing(false);
            setDateErrors({});
            setEditApp(null);
          }
        }
        showToast(result.message, result.success ? 'success' : 'error');
        setIsSavingApp(false);
      }
    );
  };

  const handleSelfServiceHandoverConfirm = (customerHandoverDate: string) => {
    if (!selfServiceHandoverModal) return;
    const { app, nextStep } = selfServiceHandoverModal;
    setSelfServiceHandoverModal(null);
    const updatedApp = {
      ...app,
      customerHandoverDate,
      customer_handover_date: customerHandoverDate
    };
    handleStepTransition(nextStep, undefined, updatedApp);
  };

  const handleStepTransition = async (nextStep: StepName, note?: string, overrideApp?: Application) => {
    const app = overrideApp || editApp || selectedApp;
    if (!app) return;

    const result = await stepTransition(app, nextStep, note, deleteAllNotificationsForRecord);

    if (result.requiresHandoverDate) {
      setSelfServiceHandoverModal({ app, nextStep });
      return;
    }

    if (!result.success) {
      showToast(result.message, (result.type as 'error' | 'warning') || 'error');
      return;
    }

    if (result.finalApp) {
      setSelectedApp(result.finalApp);
    }
    setEditApp(null);
    setIsEditing(false);
    setDateErrors({});
    showToast(result.message, 'success');
    if (result.warningMessage) {
      setTimeout(() => showToast(result.warningMessage!, 'warning'), 800);
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
    if (nextStep === 'S2_KT_Tiep_Nhan' || nextStep === 'S2_KT_Ban_giao') {
      updateField = { key: 'contractSigningDate', label: 'Ngày ký HĐCN/HĐMB', isRequired: true };
    }
    else if (nextStep === 'S3_Nop_VPDK') updateField = { key: 'submissionDate', label: 'Ngày nộp VPĐK', isRequired: true };
    else if (nextStep === 'S5_Tai_Chinh_Khach_Hang') updateField = { key: 'taxNotificationDate', label: 'Ngày TB Thuế', isRequired: true };
    else if (nextStep === 'S5_1_PTDA_TiepNhan') updateField = { key: 'taxReceiptDate', label: 'Ngày nhận/cung cấp GNT / Nộp thuế', isRequired: true };
    else if (nextStep === 'S6_Nhan_So_GCN') updateField = { key: 'gcnSignedDate', label: 'Ngày trình ký/In GCN', isRequired: true };
    else if (nextStep === 'S7_PTDA_Ban_Giao') updateField = { key: 'gcnSignedDate', label: 'Ngày trình ký/In GCN', isRequired: true };
    else if (nextStep === 'S7_1_PTT_Tiep_Nhan') updateField = { key: 'ptdaHandoverDate', label: 'Ngày bàn giao GCN cho PTT', isRequired: true };
    else if (nextStep === 'S7_2_Ban_Giao_Khach') updateField = { key: 'gcnReceivedDate', label: 'Ngày nhận GCN thực tế', isRequired: true };
    else if (nextStep === 'Hoan_Tat') updateField = { key: 'customerHandoverDate', label: 'Ngày BG GCN cho khách', isRequired: true };
    
    // GD workflow
    else if (nextStep === 'GD1_Cho_KT_TiepNhan') 
      updateField = { 
        key: 'contractSigningDate', 
        label: 'Ngày ký HĐCN/HĐMB',
        isRequired: false
      };
    else if (nextStep === 'GD2_Cho_Nop_VPDK')
      updateField = {
        key: 'contractSigningDate',
        label: 'Ngày ký HĐCN/HĐMB',
        isRequired: false
      };
    else if (nextStep === 'GD3_Nop_VPDK') updateField = { key: 'submissionDate', label: 'Ngày nộp VPĐK', isRequired: true };
    else if (nextStep === 'GD4_Cho_Nop_NVTC') updateField = { key: 'taxNotificationDate', label: 'Ngày TB Thuế', isRequired: true };
    else if (nextStep === 'GD4_Cho_KT_TiepNhan_LaySo') updateField = { key: 'taxReceiptDate', label: 'Ngày nhận/cung cấp GNT / Nộp thuế', isRequired: true };
    else if (nextStep === 'GD5_Cho_Ky_In_GCN') updateField = { key: 'gcnSignedDate', label: 'Ngày trình ký/In GCN', isRequired: true };
    else if (nextStep === 'GD5_Cho_GCN') updateField = { key: 'gcnSignedDate', label: 'Ngày trình ký/In GCN', isRequired: true };
    else if (nextStep === 'GD5_Cho_PTT_TiepNhan_BG') updateField = { key: 'gcnReceivedDate', label: 'Ngày nhận GCN thực tế', isRequired: true };
    else if (nextStep === 'GD6_Cho_BG_Khach') updateField = { key: 'ptdaHandoverDate', label: 'Ngày BG GCN cho PTT', isRequired: true };

    // If there is no specific field to update, we can either skip the modal and transition directly 
    // or keep the modal just for confirmation. Here we just show the modal without a required date.
    const today = new Date().toISOString().split('T')[0];
    let initialValue = '';
    let initLocation: 'PHUONG' | 'TP_DANANG' = 'PHUONG';
    let initRefCode = '';
    let initKtHandover = today;
    
    // Pre-fill existing value if records share a common value for that field
    const selectedRecords = applications.filter(a => idsToProcess.includes(a.id));
    // Đếm hồ sơ chưa có ngày để hiển thị thông báo trong modal
    let recordsWithoutDate = 0;

    if (updateField && selectedRecords.length > 0) {
      const fieldValues = selectedRecords.map(a => (a as any)[updateField!.key] || '');
      const uniqueValues = Array.from(new Set(fieldValues)).filter(v => v !== '');
      recordsWithoutDate = fieldValues.filter(v => v === '').length;

      if (uniqueValues.length === 1 && recordsWithoutDate === 0) {
        // Tất cả cùng 1 ngày → pre-fill ngày đó
        initialValue = uniqueValues[0] as string;
      } else if (uniqueValues.length === 1 && recordsWithoutDate > 0) {
        // Có ngày chung + một số hồ sơ trống → pre-fill ngày chung làm gợi ý
        initialValue = uniqueValues[0] as string;
      }
      // Nếu nhiều ngày khác nhau → initialValue = '' → user tự nhập ngày cho hồ sơ trống
    }

    setBulkTransitionTarget(nextStep);
    setBulkTransitionField(updateField);
    setBulkTransitionValue(initialValue);
    setBulkTransitionLocation(initLocation);
    setBulkTransitionRefCode(initRefCode);
    setBulkTransitionKtHandover(initKtHandover);
    setIsBulkTransitionModalOpen(true);
  };

  const executeBulkStepTransition = async (nextStep: StepName, dateValue: string | null, location?: string, refCode?: string, ktHandoverDate?: string) => {
    setIsSavingApp(true);

    const result = await executeBulkStepTransitionAction(
      selectedAppIds,
      nextStep,
      dateValue,
      bulkTransitionField,
      location,
      refCode,
      ktHandoverDate,
      bulkNotifyNextDepartment,
      bulkDeleteNotificationsForRecords
    );

    if (!result.success) {
      if (result.message) {
        showToast(result.message, (result.type as 'error' | 'warning') || 'error');
      }
      setIsSavingApp(false);
      return;
    }

    if (selectedApp && selectedAppIds.includes(selectedApp.id) && result.finalApps) {
      const updatedSelected = result.finalApps.find(fa => fa.id === selectedApp.id);
      if (updatedSelected) {
        setSelectedApp(updatedSelected);
      }
    }

    setSelectedAppIds([]);
    setIsBulkTransitionModalOpen(false);
    setBulkTransitionTarget(null);
    setBulkTransitionField(null);

    if (result.chronoWarnings && result.chronoWarnings.length > 0) {
      showToast(
        `Các lưu ý ngày tương lai: ${result.chronoWarnings.slice(0, 3).join(', ')}${result.chronoWarnings.length > 3 ? '...' : ''}`,
        'warning'
      );
    }

    showToast(result.message, (result.type as 'success' | 'warning') || 'success');
    setIsSavingApp(false);
  };



  const handleBulkDelete = async () => {
    if (selectedAppIds.length === 0) return;
    
    askConfirm(
      'Xác nhận xóa hàng loạt',
      `Bạn có chắc chắn muốn xóa ${selectedAppIds.length} hồ sơ đã chọn? Hành động này không thể hoàn tác.`,
      async () => {
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
          registerSelfUpdate(selectedAppIds);
          const { error } = await supabase
            .from('records')
            .delete()
            .in('id', selectedAppIds);

          if (error) throw error;

          // 3. Verify thực sự đã xóa
          const { data: remaining } = await supabase
            .from('records')
            .select('id')
            .in('id', selectedAppIds);

          if (remaining && remaining.length > 0) {
            throw new Error(
              `Chỉ xóa được ${count - remaining.length}/${count} hồ sơ. ` +
              `${remaining.length} hồ sơ bị từ chối - có thể do quyền truy cập.`
            );
          }

          // Cleanup notifications for deleted records
          await bulkDeleteNotificationsForRecords(selectedAppIds);

          handleSetApplications(prev => prev.filter(app => !selectedAppIds.includes(app.id)));
          setSelectedAppIds([]);
          showToast(`Đã xóa hàng loạt ${count} hồ sơ và tài liệu đính kèm thành công.`, 'success');
        } catch (error) {
          console.error('Supabase bulk delete error:', error);
          showToast('Lỗi khi xóa hàng loạt trên Supabase.', 'error');
        } finally {
          setIsSavingApp(false);
        }
      }
    );
  };

  const handleBulkResolveIssues = async () => {
    setIsSavingApp(true);
    const result = await bulkResolveIssues(new Set(selectedAppIds));
    showToast(result.message, result.success ? 'success' : 'error');
    setIsSavingApp(false);
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
      const auditEntry = createAuditEntry('Tải tài liệu', false, 1, app.unitCode, `Đã tải lên tài liệu "${file.name}"`);
      const appWithAudit = {
        ...updatedApp,
        auditTrail: [auditEntry, ...(updatedApp.auditTrail || [])]
      };
      const finalWithAudit = await syncRecord(appWithAudit);

      handleSetApplications(prev => prev.map(a => a.id === app.id ? finalWithAudit : a));
      handleSetDashboardApps(prev => prev.map(a => a.id === app.id ? finalWithAudit : a));
      if (editApp && editApp.id === app.id) setEditApp(finalWithAudit);
      if (selectedApp && selectedApp.id === app.id) setSelectedApp(finalWithAudit);
      
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
    if (!app) return;

    askConfirm(
      'Xác nhận xóa tài liệu',
      'Bạn có chắc chắn muốn xóa tài liệu này?',
      async () => {
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
          const auditEntry = createAuditEntry('Xóa tài liệu', false, 1, app.unitCode, `Đã xóa tài liệu "${fileToDelete?.name || 'Tài liệu'}"`);
          const appWithAudit = {
            ...updatedApp,
            auditTrail: [auditEntry, ...(updatedApp.auditTrail || [])]
          };
          const finalWithAudit = await syncRecord(appWithAudit);

          handleSetApplications(prev => prev.map(a => a.id === app.id ? finalWithAudit : a));
          handleSetDashboardApps(prev => prev.map(a => a.id === app.id ? finalWithAudit : a));
          if (editApp && editApp.id === app.id) setEditApp(finalWithAudit);
          if (selectedApp && selectedApp.id === app.id) setSelectedApp(finalWithAudit);
          showToast(fileToDelete?.isShared ? 'Đã gỡ bỏ bản sao tài liệu chung.' : 'Đã xóa tài liệu khỏi hệ thống thành công.', 'success');
        } catch (error) {
          console.error('Supabase file delete error:', error);
          showToast('Lỗi khi xóa tài liệu.', 'error');
        } finally {
          setIsSavingApp(false);
        }
      }
    );
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
            id: generateUUID(),
            timestamp: new Date().toISOString(),
            userId: currentUser?.dept || 'System',
            userName: currentUser?.dept || 'Hệ thống',
            action: 'Gắn tài liệu chung hàng loạt'
          }, ...(app.auditTrail || [])]
        }));

      // 4. Batch update to Supabase
      const updatedApplications = await bulkSync(appsToUpdate, applications);
      
      handleSetApplications(updatedApplications);
      handleSetDashboardApps(prev => prev.map(a => {
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



  // Deprecated
  const handleReportErrorOld = async (note: string) => {
    // ...
  };

  const handleReportError = async (note: string) => {
    const app = editApp || selectedApp;
    if (!app) return;

    // Restriction: Only authorized depts can report errors/supplement requests
    const allowedDepts: string[] = ['PTT', 'KT', 'PTDA', 'MANAGER', 'DIRECTOR', 'ADMIN', 'MANAGER_ALL', 'MANAGER_PTT', 'MANAGER_KT', 'MANAGER_PTDA'];
    if (!allowedDepts.includes(userRole)) {
      showToast('Bạn không có quyền thực hiện chức năng Báo lỗi / Yêu cầu bổ sung.', 'error');
      return;
    }

    const updatedApp = updateAppIssue(app, note);

    setIsSavingApp(true);
    try {
      const finalApp = await syncRecord(updatedApp);

      handleSetApplications(prev => prev.map(a => a.id === app.id ? finalApp : a));
      setSelectedApp(finalApp);
      setEditApp(null);
      setIsEditing(false);
      setDateErrors({});
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
    setIsSavingApp(true);
    const result = await resolveError(app);
    if (result.success && result.finalApp) {
      setSelectedApp(result.finalApp);
    }
    showToast(result.message, result.success ? 'success' : 'error');
    setIsSavingApp(false);
  };

  const handleResolveIssue = async (appId: string) => {
    const result = await resolveIssue(appId);
    if (result.success && result.finalApp) {
      setSelectedApp(result.finalApp);
    }
    showToast(result.message, result.success ? 'success' : 'error');
  };

  const handleProposeException = async (appId: string, reason: string) => {
    const result = await proposeException(appId, reason);
    if (result.success && result.finalApp) {
      setSelectedApp(result.finalApp);
    }
    showToast(result.message, result.success ? 'success' : 'error');
  };

  const handleApproveException = async (appId: string, notes: string) => {
    const result = await approveException(appId, notes);
    if (result.success && result.finalApp) {
      setSelectedApp(result.finalApp);
    }
    showToast(result.message, result.success ? 'success' : 'error');
  };

  const handleRejectApp = async (targetStepId: string, reason: string) => {
    const app = editApp || selectedApp;
    if (!app) return;

    setIsSavingApp(true);
    const result = await rejectApp(app, targetStepId as StepName, reason, createNotification);

    if (result.success && result.finalApp) {
      setSelectedApp(result.finalApp);
      setEditApp(null);
      setIsEditing(false);
      setDateErrors({});
      setExpandedSections(prev => prev.includes('OTHER_SECTION') ? prev : [...prev, 'OTHER_SECTION']);
    }
    showToast(result.message, result.success ? 'warning' : 'error');
    setIsSavingApp(false);
  };

  const handleBulkRejectApps = async (targetStepId: StepName, reason: string) => {
    if (selectedAppIds.length === 0) return;

    setIsSavingApp(true);
    const result = await bulkRejectApps(selectedAppIds, targetStepId, reason);
    if (result.success) {
      setSelectedAppIds([]);
      setIsBulkRejectModalOpen(false);
    }
    showToast(result.message, result.success ? 'warning' : 'error');
    setIsSavingApp(false);
  };

  const isFieldEditable = (fieldName: string, appToCheck?: Application) => {
    if (!isEditing && !isSpreadsheetMode) return false;
    
    // Admin always has edit rights
    if (userRole === 'ADMIN') return true;
    
    // Áp dụng cho tất cả role trừ ADMIN
    if (fieldName === 'isSelfService') {
      const app = appToCheck || editApp || selectedApp;
      if (!app) return true;
      const allowedSteps = [
        'GD1_ChuanBi', 'GD1_Cho_KT_TiepNhan', 'GD2_Cho_Nop_VPDK',
        'S1_ChuanBi', 'S2_KT_Tiep_Nhan', 'S2_KT_Ban_giao'
      ];
      return allowedSteps.includes(app.currentStep);
    }
    
    // Management/Leadership roles depend on the permission field from DB
    if (userRole === 'MANAGER' || userRole === 'DIRECTOR' || userRole === 'MANAGER_ALL') {
      return userCanEdit;
    }

    // Specialist roles logic remains as is (they are always allowed to edit their assigned fields)
    if ((userRole === 'PTDA' || userRole === 'MANAGER_PTDA') && fieldName === 'vpdkCode') return false;

    const pttFields = [
      'customerName', 'contractSignerType', 'phoneNumber', 'loanStatus', 'bankCommitmentDeadline', 'propertyType', 
      'contractSigningDate', 'receivedDate', 'isSelfService', 'customerHandoverDate', 'taxNotificationReceivedDate', 'accountingHandoverDate', 'staffName',
      'gcnReceivedDate', 'taxReceiptDate', 'handoverApartmentDate', 'gcnNumber'
    ];

    // Financial & Tax & Authority Submission: KT responsible for processing according to function (Tax/Accounting)
    const ktFields = [
      'contractSigningDate', 'submissionLocation', 'vpdkCode', 'submissionDate',
      'taxReceiptDate', 'taxVpdkSubmissionDate', 'taxPaymentStatus',
      'gcnReceivedDate', 'ptdaHandoverDate', 'ktHandoverToPtdaDate',
      'issueType', 'issueNotes', 'issueSeverity', 'gcnNumber'
    ];

    // Project/Authority: PTDA responsible for processing dates (GCN milestones)
    const ptdaFields = [
      'vpdkCode', 'taxNotificationDate', 'taxNoticeProvisionDate', 'gcnSignedDate', 'taxReceiptDate',
      'ktHandoverToPtdaDate',
      'issueType', 'issueNotes', 'issueSeverity', 'gcnNumber'
    ];

    if (userRole === 'PTT' || userRole === 'MANAGER_PTT') {
      if (!pttFields.includes(fieldName)) return false;
      const app = appToCheck || editApp || selectedApp;
      if (!app) return true;

      // Rule for customerHandoverDate (Ngày BG GCN Khách)
      if (fieldName === 'customerHandoverDate') {
        if (app.isSelfService) return true;
        // Company service: only in Step 7 handover or Hoan_Tat
        return app.currentStep === 'S7_2_Ban_Giao_Khach' || app.currentStep === 'GD6_Cho_BG_Khach' || app.currentStep === 'Hoan_Tat';
      }

      // Rule for gcnReceivedDate (Ngày nhận GCN)
      if (fieldName === 'gcnReceivedDate') {
        if (app.isSelfService) return true;
        // Company service: only in Step 6 / Step 7 or Hoan_Tat
        return ['S7_1_PTT_Tiep_Nhan', 'S7_2_Ban_Giao_Khach', 'GD5_Cho_PTT_TiepNhan_BG', 'GD6_Cho_BG_Khach', 'Hoan_Tat'].includes(app.currentStep);
      }

      return true;
    }
    if (userRole === 'KT' || userRole === 'MANAGER_KT') return ktFields.includes(fieldName);
    if (userRole === 'PTDA' || userRole === 'MANAGER_PTDA') return ptdaFields.includes(fieldName);
    
    return false;
  };

  const isFieldVisible = (fieldName: string) => {
    if (isManagement) return true;

    // PTDA and KT don't need to see doc checklist
    if (fieldName === 'checklist') {
      return userRole === 'PTT' || userRole === 'MANAGER_PTT';
    }

    // Hide internal tax processing dates from outside KT if needed, 
    // but the user wants to see "tiến độ" so mostly everything stays visible.
    // However, we'll keep it simple: everything visible unless sensitive.
    return true;
  };

  const determineStatusFromStep = (currentStep: StepName): UnitStatus => {
    if (currentStep === 'Hoan_Tat') return 'Completed';
    if (['S6_Nhan_So_GCN', 'GD5_Cho_Ky_In_GCN', 'GD5_Cho_GCN'].includes(currentStep)) return 'GCN_Issued';
    if (['S7_1_PTT_Tiep_Nhan', 'S7_PTDA_Ban_Giao', 'GD5_Cho_PTT_TiepNhan_BG', 'GD6_Cho_BG_Khach', 'S7_2_Ban_Giao_Khach'].includes(currentStep)) return 'WaitingHandover';
    return INITIAL_STEP_CONFIG[currentStep]?.status || 'Processing';
  };

  const DATE_SEQUENCE = [
    { key: 'contractSigningDate',    label: 'Ngày ký HĐCN' },
    { key: 'accountingHandoverDate', label: 'Ngày KT tiếp nhận' },
    { key: 'ktHandoverToPtdaDate',   label: 'Ngày KT bàn giao PTDA' },
    { key: 'submissionDate',         label: 'Ngày nộp VPĐK' },
    { key: 'taxNotificationDate',    label: 'Ngày TB Thuế' },
    { key: 'taxReceiptDate',         label: 'Ngày nhận GNT' },
    { key: 'gcnSignedDate',          label: 'Ngày trình ký GCN' },
    { key: 'gcnReceivedDate',        label: 'Ngày nhận GCN' },
    { key: 'ptdaHandoverDate',       label: 'Ngày bàn giao GCN cho PTT' },
    { key: 'customerHandoverDate',   label: 'Ngày bàn giao GCN cho KH' },
  ];

  const validateAllDates = (app: Partial<Application>) => {
    const errors: Record<string, string> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check ngày tương lai
    DATE_SEQUENCE.forEach(({ key, label }) => {
      const val = app[key as keyof Application] as string | undefined;
      if (val && val !== '---') {
        const d = new Date(val);
        d.setHours(0, 0, 0, 0);
        if (d > today) {
          errors[key] = `${label} không được là ngày trong tương lai`;
        }
      }
    });

    // Check thứ tự chuỗi ngày
    const activeDates = DATE_SEQUENCE
      .map(({ key, label }) => ({ key, label, value: app[key as keyof Application] as string }))
      .filter(({ value }) => value && value !== '---' && value !== '');

    for (let i = 0; i < activeDates.length - 1; i++) {
      const d1 = activeDates[i];
      const d2 = activeDates[i + 1];
      if (!errors[d1.key] && !errors[d2.key]) {
        const date1 = new Date(d1.value); date1.setHours(0,0,0,0);
        const date2 = new Date(d2.value); date2.setHours(0,0,0,0);
        if (date2 < date1) {
          errors[d2.key] = `Phải sau ${d1.label} (${d1.value.substring(0,10)})`;
        }
      }
    }

    setDateErrors(errors);
    return errors;
  };

  const handleFieldChange = (field: keyof Application, value: any) => {
    if (field === 'isSelfService' && value === true) {
      const app = editApp || selectedApp;
      if (app && !app.isSelfService) {
        const firstStep: StepName = app.workflowType === 'Quy_trinh_2'
          ? 'S1_ChuanBi'
          : 'GD1_ChuanBi';
        askConfirm(
          'Đổi sang Khách tự làm sổ',
          `Hồ sơ sẽ được đặt lại về bước đầu (${firstStep === 'S1_ChuanBi' ? 'S1 - Chuẩn bị' : 'GĐ1 - Chuẩn bị'}).\n` +
          `Toàn bộ dữ liệu đã nhập được giữ nguyên.\n` +
          `Thao tác này sẽ được ghi vào lịch sử hồ sơ.`,
          () => {
            const auditEntry = createAuditEntry(
              'Đổi loại hồ sơ: Công ty làm sổ → Khách tự làm sổ',
              false, 1, app.unitCode,
              `Hồ sơ được đặt lại về bước đầu (${firstStep === 'S1_ChuanBi' ? 'S1 - Chuẩn bị' : 'GĐ1 - Chuẩn bị'}) để xử lý theo quy trình tự làm sổ.`
            );
            const historyItem: any = {
              id: generateUUID(),
              timestamp: new Date().toISOString(),
              user: userRole,
              action: `Đổi loại hồ sơ: Công ty làm sổ → Khách tự làm sổ. Reset về bước: ${firstStep}`,
            };
            if (editApp) {
              const nextApp: Application = {
                ...editApp,
                isSelfService: true,
                currentStep: firstStep,
                status: 'Processing' as UnitStatus,
                history: [historyItem, ...(editApp.history || [])],
                auditTrail: [auditEntry, ...(editApp.auditTrail || [])]
              };
              setEditApp(nextApp);
            } else if (selectedApp) {
              handleSetApplications(prev => prev.map(a => {
                if (a.id === selectedApp.id) {
                  const nextApp: Application = {
                    ...a,
                    isSelfService: true,
                    currentStep: firstStep,
                    status: 'Processing' as UnitStatus,
                    history: [historyItem, ...(a.history || [])],
                    auditTrail: [auditEntry, ...(a.auditTrail || [])]
                  };
                  setSelectedApp(nextApp);
                  return nextApp;
                }
                return a;
              }));
            }
          }
        );
        return;
      }
    }

    // Helper: tách biệt 2 quy trình khi so sánh bước
    const GD_ORDER = [
      'GD1_ChuanBi','GD1_Cho_KT_TiepNhan','GD2_Cho_Nop_VPDK',
      'GD3_Nop_VPDK','GD4_Cho_Nop_NVTC','GD4_Cho_KT_TiepNhan_LaySo',
      'GD5_Cho_Ky_In_GCN','GD5_Cho_GCN','GD5_Cho_PTT_TiepNhan_BG',
      'GD6_Cho_BG_Khach','Hoan_Tat'
    ];
    const S_ORDER = [
      'S1_ChuanBi','S2_KT_Tiep_Nhan','S2_KT_Ban_giao','S3_Nop_VPDK',
      'S5_Tai_Chinh_Khach_Hang','S5_1_PTDA_TiepNhan','S6_Nhan_So_GCN',
      'S7_PTDA_Ban_Giao','S7_1_PTT_Tiep_Nhan','S7_2_Ban_Giao_Khach'
    ];
    const DATE_LABELS: Record<string, string> = {
      gcnSignedDate: 'Ngày trình ký/In GCN',
      taxReceiptDate: 'Ngày nhận GNT',
      submissionDate: 'Ngày nộp VPĐK',
      taxNotificationDate: 'Ngày ban hành thông báo thuế',
      gcnReceivedDate: 'Ngày nhận sổ',
    };
    const DATE_FIELDS = Object.keys(DATE_LABELS);

    // Helper: tạo history entry khi cập nhật ngày (dù có nhảy bước hay không)
    const makeDateHistoryItem = (label: string, val: string | null, unitCode: string) => ({
      id: generateUUID(),
      stepName: label,
      dept: 'PTT' as const,
      receivedDate: new Date().toISOString(),
      performedBy: userRole || 'SYSTEM_AUTO',
      performedByName: userRole || 'Hệ thống tự động',
      note: val ? `Điền ${label}: ${val}` : `Xóa trống ${label}`,
    });

    // Helper: tự động nhảy bước nếu ngày mới suy diễn được bước cao hơn
    const syncStep = (nextApp: any, sourceHistory: any[]) => {
      if (typeof inferStepFromDates !== 'function') return;
      const inferred = inferStepFromDates(nextApp, slaConfig, 'RUNTIME');
      const currentStep = nextApp.currentStep;
      const inferredStep = inferred.currentStep;
      const isGD = GD_ORDER.includes(currentStep) && GD_ORDER.includes(inferredStep);
      const isS  = S_ORDER.includes(currentStep)  && S_ORDER.includes(inferredStep);
      const shouldUpdate =
        (isGD && GD_ORDER.indexOf(inferredStep) > GD_ORDER.indexOf(currentStep)) ||
        (isS  && S_ORDER.indexOf(inferredStep)  > S_ORDER.indexOf(currentStep));
      if (shouldUpdate) {
        const stepHistoryItem: any = {
          id: generateUUID(),
          stepName: inferredStep,
          dept: stepConfig[inferredStep]?.dept || 'PTT',
          receivedDate: new Date().toISOString(),
          performedBy: userRole || 'SYSTEM_AUTO',
          performedByName: userRole || 'Hệ thống tự động',
          note: `Tự động chuyển bước từ ${currentStep} → ${inferredStep} do cập nhật ngày`,
        };
        nextApp.history     = [stepHistoryItem, ...sourceHistory];
        nextApp.currentStep = inferredStep;
        nextApp.status      = inferred.status;
      }
    };

    if (editApp) {
      const nextApp = { ...editApp, [field]: value };

      if (field === 'taxReceiptDate' && value && stepConfig[editApp.currentStep]?.status === 'TaxCompleted') {
        nextApp.status = 'TaxCompleted';
      }

      if (field === 'gcnReceivedDate' && value) {
        const isBypassed = nextApp.checklist?.['bypass_gcn'] === true;
        const isEarly = !isBypassed && ['GD1','GD2','GD3','GD4','S1','S2','S3','S4','S5'].some(prefix => nextApp.currentStep.startsWith(prefix));
        if (isEarly) {
          nextApp.issueType = 'Sai sót Khác';
          nextApp.issueNotes = (nextApp.issueNotes ? nextApp.issueNotes + '\n' : '') + 'Cảnh báo: Lệch tiến độ thực tế (Có ngày nhận GCN nhưng chưa tới bước bàn giao)';
          nextApp.issueSeverity = 'Critical';
          nextApp.status = 'Error';
          nextApp.issueStatus = 'OPEN';
          nextApp.issueResolvedAt = null;
          if (!nextApp.issueCreatedAt) nextApp.issueCreatedAt = new Date().toISOString();
        }
      }

      if (nextApp.isSelfService) {
        if (nextApp.customerHandoverDate || nextApp.status === 'Completed' || nextApp.currentStep === 'Hoan_Tat') {
          nextApp.status = 'Completed';
        } else if (nextApp.gcnReceivedDate) {
          nextApp.status = 'WaitingHandover';
        } else {
          nextApp.status = 'Processing';
        }
      } else {
        if (nextApp.status !== 'Error') {
          nextApp.status = determineStatusFromStep(nextApp.currentStep);
        }
      }

      if (field === 'issueNotes' && value) {
        if (!editApp.issueType || editApp.issueType === 'None') {
          nextApp.issueType = 'Sai sót Khác';
        }
        nextApp.status = 'Error';
        nextApp.issueStatus = 'OPEN';
        nextApp.issueResolvedAt = null;
        if (!nextApp.issueCreatedAt) nextApp.issueCreatedAt = new Date().toISOString();
      }

      if (field === 'issueType') {
        if (value && value !== 'None') {
          nextApp.issueStatus = 'OPEN';
          nextApp.issueResolvedAt = null;
          if (!nextApp.issueCreatedAt) nextApp.issueCreatedAt = new Date().toISOString();
        } else {
          nextApp.issueStatus = 'RESOLVED';
          nextApp.issueResolvedAt = new Date().toISOString();
        }
      }

      if (field === 'issueSeverity') {
        // issueSeverity is updated automatically via handleFieldChange above
      }

      if (field === 'currentStep') {
        const historyItem: any = {
          id: generateUUID(),
          timestamp: new Date().toISOString(),
          user: userRole,
          action: `Chuyển trạng thái sang: ${value}`,
        };
        nextApp.history = [historyItem, ...(editApp.history || [])];
      } else if (DATE_FIELDS.includes(field as string)) {
        const label = DATE_LABELS[field as string];
        // Ghi auditTrail dù có nhảy bước hay không
        const auditEntry = createAuditEntry(
          `Cập nhật ${label}`, false, 1, editApp.unitCode,
          value ? `Điền ${label}: ${value}` : `Xóa trống ${label}`
        );
        nextApp.auditTrail = [auditEntry, ...(editApp.auditTrail || [])];
        // Ghi history dù có nhảy bước hay không (fix kẽ hở 1)
        const dateHistoryItem = makeDateHistoryItem(label, value, editApp.unitCode);
        nextApp.history = [dateHistoryItem, ...(editApp.history || [])];
        // Thử nhảy bước nếu điều kiện thỏa (có thể ghi đè history với step mới)
        syncStep(nextApp, nextApp.history);
      }

      setEditApp(nextApp);
    } else if (selectedApp) {
      handleSetApplications(prev => prev.map(app => {
        if (app.id === selectedApp.id) {
          const nextApp = { ...app, [field]: value };

          if (field === 'taxReceiptDate' && value && stepConfig[app.currentStep]?.status === 'TaxCompleted') {
            nextApp.status = 'TaxCompleted';
          }

          if (field === 'gcnReceivedDate' && value) {
            const isBypassed = nextApp.checklist?.['bypass_gcn'] === true;
            const isEarly = !isBypassed && ['GD1','GD2','GD3','GD4','S1','S2','S3','S4','S5'].some(prefix => nextApp.currentStep.startsWith(prefix));
            if (isEarly) {
              nextApp.issueType = 'Sai sót Khác';
              nextApp.issueNotes = (nextApp.issueNotes ? nextApp.issueNotes + '\n' : '') + 'Cảnh báo: Lệch tiến độ thực tế (Có ngày nhận GCN nhưng chưa tới bước bàn giao)';
              nextApp.issueSeverity = 'Critical';
              nextApp.status = 'Error';
              nextApp.issueStatus = 'OPEN';
              nextApp.issueResolvedAt = null;
              if (!nextApp.issueCreatedAt) nextApp.issueCreatedAt = new Date().toISOString();
            }
          }

          if (nextApp.isSelfService) {
            if (nextApp.customerHandoverDate || nextApp.status === 'Completed' || nextApp.currentStep === 'Hoan_Tat') {
              nextApp.status = 'Completed';
            } else if (nextApp.gcnReceivedDate) {
              nextApp.status = 'WaitingHandover';
            } else {
              nextApp.status = 'Processing';
            }
          } else {
            if (nextApp.status !== 'Error') {
              nextApp.status = determineStatusFromStep(nextApp.currentStep);
            }
          }

          if (field === 'issueNotes' && value) {
            if (!app.issueType || app.issueType === 'None') {
              nextApp.issueType = 'Sai sót Khác';
            }
            nextApp.status = 'Error';
            nextApp.issueStatus = 'OPEN';
            nextApp.issueResolvedAt = null;
            if (!nextApp.issueCreatedAt) nextApp.issueCreatedAt = new Date().toISOString();
          }

          if (field === 'issueType') {
            if (value && value !== 'None') {
              nextApp.issueStatus = 'OPEN';
              nextApp.issueResolvedAt = null;
              if (!nextApp.issueCreatedAt) nextApp.issueCreatedAt = new Date().toISOString();
            } else {
              nextApp.issueStatus = 'RESOLVED';
              nextApp.issueResolvedAt = new Date().toISOString();
            }
          }

          if (field === 'issueSeverity') {
            // Updated via generic handler
          } else if (DATE_FIELDS.includes(field as string)) {
            const label = DATE_LABELS[field as string];
            // Ghi auditTrail dù có nhảy bước hay không
            const auditEntry = createAuditEntry(
              `Cập nhật ${label}`, false, 1, app.unitCode,
              value ? `Điền ${label}: ${value}` : `Xóa trống ${label}`
            );
            nextApp.auditTrail = [auditEntry, ...(app.auditTrail || [])];
            // Ghi history dù có nhảy bước hay không (fix kẽ hở 1)
            const dateHistoryItem = makeDateHistoryItem(label, value, app.unitCode);
            nextApp.history = [dateHistoryItem, ...(app.history || [])];
            // Thử nhảy bước nếu điều kiện thỏa (fix kẽ hở 2)
            syncStep(nextApp, nextApp.history);
          }

          setSelectedApp(nextApp);
          return nextApp;
        }
        return app;
      }));
    }

    if (DATE_SEQUENCE.some(d => d.key === field)) {
      const updatedApp = editApp ? { ...editApp, [field]: value } : { ...selectedApp, [field]: value };
      validateAllDates(updatedApp);
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
    if (!newApp.receivedDate) {
      errors.receivedDate = 'Vui lòng nhập Ngày tiếp nhận hồ sơ! Đây là trường bắt buộc để tính toán hiệu suất (SLA) của các phòng ban.';
    }
    if (newApp.propertyType === 'Can_Ho' && !newApp.handoverApartmentDate) {
      errors.handoverApartmentDate = 'Vui lòng chọn ngày bàn giao căn hộ thực tế';
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setIsSavingApp(true);

    const result = await createApp(newApp);

    if (!result.success) {
      showToast(result.message, 'error');
      if (result.message.includes('Mã lô/căn')) {
        setFormErrors({ unitCode: result.message });
      }
      setIsSavingApp(false);
      return;
    }

    if (result.app?.id) {
      setHighlightedAppId(result.app.id);
      setActiveTab('applications');
      setTimeout(() => {
        document.getElementById(`app-row-${result.app!.id}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
      setTimeout(() => setHighlightedAppId(null), 4000);
    }
    setIsCreateModalOpen(false);
    setNewApp({
      unitCode: '', customerName: '', contractSignerType: '',
      projectName: visibleProjects[0]?.name || '',
      propertyType: 'Dat_Nen', loanStatus: 'Khong_Vay',
      submissionLocation: undefined, currentStep: 'S1_ChuanBi',
      isSelfService: false, commitmentDate: '', handoverApartmentDate: '', receivedDate: ''
    });
    setFormErrors({});
    showToast(result.message, 'success');
    setActiveTab('applications');
    setIsSavingApp(false);
  };

  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.name) {
      showToast('Vui lòng điền đầy đủ thông tin', 'warning');
      return;
    }
    setIsSavingApp(true);
    const result = await createUser(newUser);
    if (result.success) {
      setIsUserModalOpen(false);
      setNewUser({ username: '', password: '', name: '', dept: 'PTT', email: '', status: 'Active', permission: 'VIEW', assignedProjectIds: [] });
    }
    showToast(result.message, result.success ? 'success' : 'error');
    setIsSavingApp(false);
  };

  const handleUpdateUser = async () => {
    if (!editUser) return;
    setIsSavingApp(true);
    const result = await updateUser(editUser);
    if (result.success) {
      setIsUserModalOpen(false);
      setEditUser(null);
    }
    showToast(result.message, result.success ? 'success' : 'error');
    setIsSavingApp(false);
  };

  const handleDeleteUser = async (id: string) => {
    askConfirm(
      'Xác nhận xóa tài khoản',
      'Bạn có chắc chắn muốn xóa tài khoản này? Thao tác không thể hoàn tác.',
      async () => {
        setIsSavingApp(true);
        const result = await deleteUser(id);
        showToast(result.message, result.success ? 'success' : 'error');
        setIsSavingApp(false);
      }
    );
  };

  const handleResetUserPassword = async (u: UserProfile) => {
    askConfirm(
      'Reset mật khẩu',
      `Bạn có chắc muốn reset mật khẩu cho tài khoản @${u.username}? Mật khẩu mặc định sẽ là '123456'.`,
      async () => {
        setIsSavingApp(true);
        // Note: the new resetUserPassword action takes userId and username as parameters
        const result = await resetUserPassword(u.id!, u.username);
        if (result.success) {
          // Sync local state as the result wrapper does not update local users list for this action specifically right now unless handled?
          // Oh, wait, reset password may not need to reflect locally if we don't display password, 
          // but if we do, local update should be run here:
          const updatedUser = { ...u, password: '123456' };
          setUsers(prev => prev.map(usr => usr.id === u.id ? updatedUser : usr));
        }
        showToast(result.message, result.success ? 'success' : 'error');
        setIsSavingApp(false);
      }
    );
  };

  

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
        const canCreate = userRole === 'PTT' || userRole === 'MANAGER_PTT' || isManagementEdit;
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
          setDateErrors({});
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

  const [isTableDense, setIsTableDense] = useState(false);
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);

  const visibleApps = useMemo(() => {
    return displayedApps.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  }, [displayedApps, currentPage, pageSize]);

  const paginatedApps = visibleApps;
  const totalPages = useMemo(() => {
    return Math.ceil(totalCount / pageSize);
  }, [totalCount, pageSize]);

  const handleSort = (field: any) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const setIsBulkDocumentModalOpen = setIsBulkDocumentOpen;
  const setIsBulkNoteModalOpen = setIsBulkNoteOpen;

  if (isInitialLoading || isAuthLoading) {
    return (
      <div className={cn(
        "min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-500",
        theme === 'dark' ? "bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]" : "bg-slate-50 text-slate-900"
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
    return (
      <LoginScreen 
        theme={theme} 
        onThemeToggle={handleThemeToggle} 
        onLogin={(user) => {
          setCurrentUser(user);
        }} 
        supabase={supabase} 
        totalApplicationsCount={applications.length}
        totalProjectsCount={projects.length}
      />
    );
  }

  if (isFieldMode) {
    return (
      <FieldModeView 
        applications={applications} 
        projects={projects} 
        supabase={supabase}
        currentUser={currentUser}
        onStepTransition={handleStepTransition}
        askConfirm={askConfirm}
        onOpenBulkDocs={(ids) => {
          setSelectedAppIds(ids);
          setIsBulkDocumentOpen(true);
        }}
        onUpdateApp={async (updated) => {
          handleSetApplications(prev => prev.map(a => a.id === updated.id ? updated : a));
          setNotifications(prev => [
            { 
              id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
              recipientId: currentUser?.id || 'all',
              title: 'Cập nhật hiện trường', 
              message: `Hồ sơ ${updated.unitCode} được cập nhật trạng thái bởi nhân viên hiện trường.`, 
              time: 'Vừa xong', 
              type: 'Success', 
              isRead: false 
            },
            ...prev
          ]);
          try {
            await syncRecord(updated);
          } catch (err) {
            console.error('Error syncing mobile update:', err);
          }
        }} 
        theme={theme}
        onExit={() => setIsFieldMode(false)}
      />
    );
  }

  return (
    <Routes>
      <Route path="*" element={
        <div className={cn(
          "flex h-screen w-full overflow-hidden font-sans relative transition-colors duration-700",
          theme === 'dark' ? "bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]" : "bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
        )}>
          <ThemeRipple theme={theme} />
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
            : "bg-gradient-to-br from-[var(--color-bg-primary)]/98 via-[var(--color-bg-secondary)]/98 to-[var(--color-bg-primary)]/98"
        )}></div>
        <FestiveBranding />
      </div>

      <Sidebar
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        theme={theme}
        setTheme={setTheme}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={userRole}
        isManagementEdit={isManagementEdit}
        projects={projects}
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={setSelectedProjectId}
        expandedSidebarRegions={expandedSidebarRegions}
        setExpandedSidebarRegions={setExpandedSidebarRegions}
        currentUser={currentUser}
        realtimeStatus={realtimeStatus}
        handleLogout={handleLogout}
        isManagement={isManagement}
        hasSettingsAccess={hasSettingsAccess}
        hasUserAccess={hasUserAccess}
        setIsFieldMode={setIsFieldMode}
        visibleProjects={visibleProjects}
        toggleSidebarRegion={toggleSidebarRegion}
      />

      {/* Mobile Drawer Backdrop overlay */}
      {/* Backdrop for Mobile */}
      {!isSidebarCollapsed && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsSidebarCollapsed(true)} 
          className="fixed inset-0 bg-slate-900/60 z-[45] lg:hidden backdrop-blur-sm transition-opacity duration-300"
        ></motion.div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden z-10 relative bg-transparent">
        {/* First Login Security Warning Banner */}
        {currentUser?.isFirstLogin && (
          <div className={cn(
            "px-4 py-3 sm:px-6 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] sm:text-xs font-semibold select-none z-30 shadow-md gap-2.5",
            theme === 'light'
              ? "bg-amber-50 border-b border-amber-200 text-amber-800"
              : "bg-amber-950/40 border-b border-amber-500/20 text-amber-200"
          )}>
            <div className="flex items-start sm:items-center gap-2">
              <span className="text-sm shrink-0">⚠️</span>
              <p className="leading-relaxed">
                <span className="font-bold">CẢNH BÁO BẢO MẬT:</span> Đây là lần đầu tiên bạn đăng nhập hệ thống. Để đảm bảo an toàn cho dữ liệu hồ sơ, vui lòng thay đổi mật khẩu mặc định ngay lập tức.
              </p>
            </div>
            <button
              onClick={() => setIsChangePasswordModalOpen(true)}
              className={cn(
                "w-full sm:w-auto px-3 py-2 sm:py-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all whitespace-nowrap shrink-0 text-center",
                theme === 'light'
                  ? "bg-amber-600 hover:bg-amber-700 text-white hover:shadow-md"
                  : "bg-amber-500 hover:bg-amber-400 text-slate-950 hover:shadow-md"
              )}
            >
              Đổi mật khẩu ngay
            </button>
          </div>
        )}

        {/* Header */}
        <header className={cn(
          "h-16 sm:h-20 backdrop-blur-xl border-b flex items-center justify-between px-4 sm:px-8 shrink-0 z-20 transition-all gap-2",
          theme === 'light' ? "bg-[var(--color-bg-secondary)]/80 border-[var(--color-border-subtle)] shadow-sm" : "bg-slate-900/40 border-slate-800/80"
        )}>
          <div className="flex items-center gap-3 overflow-hidden">
            <button
              onClick={() => setIsSidebarCollapsed(prev => !prev)}
              className="lg:hidden p-2 rounded-xl bg-slate-800/10 border border-[var(--color-border-subtle)] dark:border-slate-800 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shrink-0 active:scale-95 shadow-sm"
              aria-label="Toggle Menu"
            >
              <Menu size={20} />
            </button>
            <h2 className={cn("text-sm sm:text-base md:text-2xl font-black font-sans tracking-tight truncate max-w-[140px] xs:max-w-xs sm:max-w-none", theme === 'light' ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-primary)]")} title={activeTab === 'dashboard' ? (selectedProject ? `Dashboard: ${selectedProject.name}` : 'Tổng quan Vùng') : (selectedProject ? `Hồ sơ: ${selectedProject.name}` : 'Danh sách Hồ sơ cấp GCN')}>
              {activeTab === 'dashboard' ? (selectedProject ? `Dashboard: ${selectedProject.name}` : 'Tổng quan Vùng') : (selectedProject ? `Hồ sơ: ${selectedProject.name}` : 'Danh sách Hồ sơ cấp GCN')}
            </h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-6">
            <div className="flex items-center gap-1.5 sm:gap-2 border-r border-[var(--color-border-subtle)] dark:border-slate-800/40 pr-2 sm:pr-4">
              <button 
                onClick={handleDownloadTemplate}
                className={cn(
                  "p-2 sm:p-2.5 rounded-full border transition-all shadow-sm group relative",
                  theme === 'light' ? "bg-[var(--color-bg-secondary)] border-[var(--color-border-subtle)] text-slate-400 hover:text-indigo-600 hover:border-indigo-200" : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-festive-gold hover:border-festive-gold/30"
                )}
                title="Tải mẫu Excel"
              >
                <Download size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>

              <div className="relative">
                <input 
                  type="file" 
                  id="excel-import" 
                  className="hidden" 
                  accept=".xlsx, .xls" 
                  onChange={handleParseTemplate} 
                  disabled={isImporting}
                />
                <button 
                  onClick={() => document.getElementById('excel-import')?.click()}
                  disabled={isImporting}
                  className={cn(
                    "p-2 sm:p-2.5 rounded-full border transition-all shadow-sm group relative",
                    theme === 'light' ? "bg-[var(--color-bg-secondary)] border-[var(--color-border-subtle)] text-slate-400 hover:text-emerald-600 hover:border-emerald-200" : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30",
                    isImporting && "opacity-50 cursor-not-allowed"
                  )}
                  title={isImporting ? "Đang xử lý..." : "Nhập từ Excel"}
                >
                  {isImporting ? (
                    <span className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] border-2 border-emerald-500 border-t-transparent rounded-full animate-spin inline-block" />
                  ) : (
                    <Upload size={16} className="sm:w-[18px] sm:h-[18px]" />
                  )}
                </button>
              </div>

              {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
                <button
                  onClick={healExistingRecords}
                  disabled={isImporting || healDone}
                  className={cn(
                    "p-2 sm:p-2.5 rounded-full border transition-all shadow-sm group relative",
                    healDone 
                      ? "opacity-40 cursor-not-allowed bg-slate-100 border-[var(--color-border-subtle)]"
                      : theme === 'light' 
                        ? "bg-[var(--color-bg-secondary)] border-[var(--color-border-subtle)] text-slate-400 hover:text-amber-600 hover:border-amber-200" 
                        : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-amber-400 hover:border-amber-500/30",
                    isImporting && "opacity-50 cursor-not-allowed"
                  )}
                  title={healDone ? "Đã đồng bộ xong" : "Đồng bộ lại trạng thái hồ sơ"}
                >
                  {isImporting ? (
                    <span className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] border-2 border-amber-500 border-t-transparent rounded-full animate-spin inline-block" />
                  ) : healDone ? (
                    <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                  ) : (
                    <RefreshCw size={16} className="sm:w-[18px] sm:h-[18px]" />
                  )}
                </button>
              )}

              {(userRole === 'PTT' || userRole === 'MANAGER_PTT' || isManagementEdit) && (
                <button 
                  onClick={() => {
                    const defaultProj = selectedProject?.name || (visibleProjects.length > 0 ? visibleProjects[0].name : projects[0].name);
                    setNewApp(prev => ({ ...prev, projectName: defaultProj }));
                    setIsCreateModalOpen(true);
                  }}
                  className="bg-festive-gold hover:bg-amber-400 text-slate-950 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider shadow-lg transition-all active:scale-95 whitespace-nowrap"
                >
                  <span className="inline-block sm:hidden">+ HS</span>
                  <span className="hidden sm:inline-block">+ Hồ sơ</span>
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
                      ? (theme === 'light' ? "bg-slate-200 border-slate-300 text-slate-950" : "bg-slate-800 border-slate-700 text-[var(--color-text-primary)]") 
                      : (theme === 'light' ? "bg-[var(--color-bg-secondary)] border-[var(--color-border-subtle)] text-slate-500 hover:bg-slate-100 hover:text-[var(--color-text-primary)] shadow-sm" : "bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800/40 hover:text-[var(--color-text-primary)]")
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
                            if (app) handleSelectApp(app);
                            setActiveTab('applications');
                          }
                          setIsNotiOpen(false);
                        }}
                      />
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Realtime Status Indicator */}
              <div className="hidden md:flex items-center">
                <button 
                  type="button"
                  onClick={() => {
                    setRealtimeReconnectKey(prev => prev + 1);
                    showToast('Đang kết nối lại kênh truyền thời gian thực (Realtime)...', 'info');
                  }}
                  title={
                    realtimeStatus === 'connected' 
                      ? "Cập nhật tức thì khi có thay đổi"
                      : realtimeStatus === 'error'
                        ? "Tự động đồng bộ mỗi 60 giây (Bấm để thử kết nối lại)"
                        : "Đang kết nối..."
                  }
                  className={cn(
                    "flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider",
                    "px-2.5 py-1.5 rounded-full border transition-all duration-300",
                    realtimeStatus === 'connected'
                      ? theme === 'dark'
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                        : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                      : realtimeStatus === 'error'
                        ? theme === 'dark'
                          ? "bg-rose-500/10 text-rose-500 border-rose-500/30 hover:bg-rose-500/20 hover:scale-105 cursor-pointer"
                          : "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 hover:scale-105 cursor-pointer"
                        : "bg-slate-500/10 text-slate-400 border-slate-500/20 animate-pulse cursor-wait"
                  )}
                >
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    realtimeStatus === 'connected' 
                      ? "bg-emerald-500 animate-pulse"
                      : realtimeStatus === 'error'
                        ? "bg-rose-500 animate-bounce"
                        : "bg-slate-400 animate-pulse"
                  )}/>
                  {realtimeStatus === 'connected' ? 'Live' 
                    : realtimeStatus === 'error' ? 'Polling (60s)' 
                    : 'Kết nối...'}
                </button>
              </div>

              {/* Theme Toggle */}
              <ThemeToggle theme={theme} onToggle={handleThemeToggle} />
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-2 sm:gap-4 pl-2 sm:pl-6 border-l border-[var(--color-border-subtle)] dark:border-slate-800/20">
              <div className="text-right hidden sm:block overflow-hidden max-w-[150px]">
                <p className={cn("text-xs font-bold uppercase tracking-wider truncate", theme === 'light' ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-primary)]")}>{currentUser?.name}</p>
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
                  theme === 'light' ? "bg-[var(--color-bg-secondary)] border-[var(--color-border-subtle)] text-slate-400 hover:text-rose-600 hover:bg-rose-50 shadow-sm" : "bg-slate-900/50 border-slate-800 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10"
                )}
                title="Đăng xuất"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 md:px-8 md:py-6 bg-transparent custom-scrollbar relative">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <DashboardTab
                key="dashboard-tab-view"
                stats={dashboardStats}
                activeTab={activeTab}
                userRole={userRole}
                dashboardApps={dashboardApps}
                applications={applications}
                theme={theme}
                dashboardFilter={dashboardFilter}
                handleDashboardClick={handleDashboardClick}
                monthlySlaData={EMPTY_ARRAY}
                projectPerformance={EMPTY_ARRAY}
                selectedProject={selectedProject}
                setActiveTab={setActiveTab}
                setFilterStatus={setFilterStatus}
                setDashboardFilter={setDashboardFilter}
                setFilterSLAStatus={setFilterSLAStatus}
                setFilterIssue={setFilterIssue}
                setSearch={setSearch}
                projectRegionFilter={projectRegionFilter}
                setProjectRegionFilter={setProjectRegionFilter}
                REGION_ORDER={REGION_ORDER}
                visibleProjects={visibleProjects}
                setSelectedProjectId={setSelectedProjectId}
                selectedProjectId={selectedProjectId}
                isManagement={isManagement}
                setReportType={setReportType}
                dashboardTab={dashboardTab}
                setDashboardTab={setDashboardTab}
                showToast={showToast}
              />
            )}
            
            {activeTab === 'applications' && (
              <ApplicationsTab
                key="applications-tab-view"
                activeTab={activeTab} 
                userRole={userRole} 
                theme={theme} 
                isTableDense={isTableDense} 
                setIsTableDense={setIsTableDense} 
                searchQuery={searchQuery} 
                setSearchQuery={setSearchQuery} 
                bulkTransitionTarget={bulkTransitionTarget} 
                setBulkTransitionTarget={setBulkTransitionTarget} 
                bulkTransitionLocation={bulkTransitionLocation} 
                setBulkTransitionLocation={setBulkTransitionLocation} 
                bulkTransitionField={bulkTransitionField} 
                setBulkTransitionField={setBulkTransitionField}
                dashboardApps={dashboardApps}
                applications={applications}
                dashboardFilter={dashboardFilter}
                selectedProject={selectedProject}
                projects={projects}
                visibleApps={visibleApps}
                displayedApps={displayedApps}
                handleSelectApp={handleSelectApp}
                handleQuickSave={handleQuickSave}
                handleSpreadsheetChange={handleSpreadsheetChange}
                handleSpreadsheetPaste={handleSpreadsheetPaste}
                handleDownloadTemplate={handleDownloadTemplate}
                handleParseTemplate={handleParseTemplate}
                handleBulkPrint={handleBulkPrint}
                handleBulkDelete={handleBulkDelete}
                handleBulkResolveIssues={handleBulkResolveIssues}
                handleToggleChecklist={handleToggleChecklist}
                setIsHandoverTicketOpen={setIsHandoverTicketOpen}
                setIsBulkDocumentModalOpen={setIsBulkDocumentModalOpen}
                setIsBulkNoteModalOpen={setIsBulkNoteModalOpen}
                setIsBulkNoteOpen={setIsBulkNoteOpen}
                setIsBulkDocumentOpen={setIsBulkDocumentModalOpen}
                setIsBulkIssueOpen={setIsBulkIssueOpen}
                users={users}
                isBulkAssignOpen={isBulkAssignOpen}
                setIsBulkAssignOpen={setIsBulkAssignOpen}
                bulkAssignUserId={bulkAssignUserId}
                setBulkAssignUserId={setBulkAssignUserId}
                handleBulkAssign={handleBulkAssign}
                canBulkAssign={canBulkAssign}
                assignableUsers={assignableUsers}
                selectedAppIds={selectedAppIds}
                setSelectedAppIds={setSelectedAppIds}
                isSavingApp={isSavingApp}
                isManagementEdit={isManagementEdit}
                isFieldEditable={isFieldEditable}
                filteredApps={filteredApps}
                isSpreadsheetMode={isSpreadsheetMode}
                setIsSpreadsheetMode={setIsSpreadsheetMode}
                EDITABLE_DATE_FIELDS={EDITABLE_DATE_FIELDS}
                isLoadingApps={isLoadingApps}
                slaConfig={slaConfig}
                INITIAL_STEP_CONFIG={INITIAL_STEP_CONFIG}
                handleResolveIssue={handleResolveIssue}
                setPreviewFile={setPreviewFile}
                handleDeleteApp={handleDeleteApp}
                setSpreadsheetChanges={setSpreadsheetChanges}
                setSpreadsheetErrors={setSpreadsheetErrors}
                confirmSpreadsheetUpdates={confirmSpreadsheetUpdates}
                checklistTemplates={checklistTemplates}
                quickEditId={quickEditId}
                quickEditData={quickEditData}
                setQuickEditId={setQuickEditId}
                setQuickEditData={setQuickEditData}
                activeCell={activeCell}
                setActiveCell={setActiveCell}
                spreadsheetChanges={spreadsheetChanges}
                spreadsheetErrors={spreadsheetErrors}
                formErrors={formErrors}
                conflictWarning={conflictWarning}
                userCanEdit={userCanEdit}
                stepConfig={stepConfig}
                getTaxStatus={getTaxStatus}
                getOverdueInfo={getOverdueInfo}
                calculateDaysDiff={calculateDaysDiff}
                selectedProjectId={selectedProjectId}
                setSelectedProjectId={setSelectedProjectId}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                filterLoanStatus={filterLoanStatus}
                setFilterLoanStatus={setFilterLoanStatus}
                filterSelfService={filterSelfService}
                setFilterSelfService={setFilterSelfService}
                filterIssue={filterIssue}
                setFilterIssue={setFilterIssue}
                filterSLAStatus={filterSLAStatus}
                setFilterSLAStatus={setFilterSLAStatus}
                sortConfig={sortConfig}
                setSortConfig={setSortConfig}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                pageSize={pageSize}
                setPageSize={setPageSize}
                isFieldMode={isFieldMode}
                setIsFieldMode={setIsFieldMode}
                isAdvancedFiltersOpen={isAdvancedFiltersOpen}
                setIsAdvancedFiltersOpen={setIsAdvancedFiltersOpen}
                handleSort={handleSort}
                paginatedApps={paginatedApps}
                totalPages={totalPages}
                tableRowRefs={tableRowRefs}
                highlightedAppId={highlightedAppId}
                selectedIndex={selectedIndex}
                setSelectedIndex={setSelectedIndex}
                lastSelectedIndex={lastSelectedIndex}
                setLastSelectedIndex={setLastSelectedIndex}
                currentUser={currentUser}
                isManagement={isManagement}
                hasSettingsAccess={hasSettingsAccess}
                hasUserAccess={hasUserAccess}
                totalCount={totalCount}
                search={search}
                setSearch={setSearch}
                setIsShowFilters={setIsShowFilters}
                isShowFilters={isShowFilters}
                setDashboardFilter={setDashboardFilter}
                handleBulkStepTransition={handleBulkStepTransition}
                setIsBulkRejectModalOpen={setIsBulkRejectModalOpen}
                filterDept={filterDept}
                setFilterDept={setFilterDept}
              />
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

            {(activeTab as string) === 'projects' && isManagementEdit && (
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
                    askConfirm(
                      'Xóa dự án',
                      'Bạn có chắc muốn xóa dự án này? Tất cả hồ sơ liên quan sẽ bị ảnh hưởng.',
                      async () => {
                        try {
                          const updatedProjects = projects.filter(p => p.id !== id);
                          await handleSaveConfig('projects', updatedProjects);
                          setProjects(updatedProjects);
                        } catch (error) {
                          console.error('Delete project error:', error);
                          showToast('Lỗi khi xóa dự án.', 'error');
                        }
                      }
                    );
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
                  allApplications={allApplicationsForExport}
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
                  userRole={userRole}
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
                  askConfirm={askConfirm}
                />
              </motion.div>
            )}
            {activeTab === 'resources' && (
              <ResourcesTab
                key="resources-tab-view"
                activeTab={activeTab}
                theme={theme}
                userRole={userRole}
                handleDownloadTemplate={handleDownloadTemplate}
                DOC_CHECKLIST_ITEMS={DOC_CHECKLIST_ITEMS}
              />
            )}
          </AnimatePresence>
        </div>
      </main>

      <ApplicationDetailModal
        selectedApp={selectedApp}
        editApp={editApp}
        setSelectedApp={setSelectedApp}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        dateErrors={dateErrors}
        theme={theme}
        userCanEdit={userCanEdit}
        userRole={userRole}
        currentUser={currentUser}
        stepConfig={stepConfig}
        expandedSections={expandedSections}
        setExpandedSections={setExpandedSections}
        detailTab={detailTab}
        setDetailTab={setDetailTab}
        handleFieldChange={handleFieldChange}
        conflictWarning={conflictWarning}
        handleUpdateApp={handleUpdateApp}
        handleDeleteApp={handleDeleteApp}
        setIsHandoverTicketOpen={setIsHandoverTicketOpen}
        handleFileUpload={handleFileUpload}
        handleDeleteFile={handleDeleteFile}
        setPreviewFile={setPreviewFile}
        handleResolveIssue={handleResolveIssue}
        handleProposeException={handleProposeException}
        handleApproveException={handleApproveException}
        calculateDaysBetweenDates={calculateDaysBetweenDates}
        formatDate={formatDate}
        handleSingleOrBulkReportIssue={handleSingleOrBulkReportIssue}
        handleRejectApp={handleRejectApp}
        handleStepTransition={handleStepTransition}
        handleBulkStepTransition={handleBulkStepTransition}
        handleResolveError={handleResolveError}
        setEditApp={setEditApp}
        setConflictWarning={setConflictWarning}
        isManagement={isManagement}
        isReportIssueFormOpen={isReportIssueFormOpen}
        setIsReportIssueFormOpen={setIsReportIssueFormOpen}
        reportIssueType={reportIssueType}
        setReportIssueType={setReportIssueType}
        reportIssueSeverity={reportIssueSeverity}
        setReportIssueSeverity={setReportIssueSeverity}
        reportIssueNote={reportIssueNote}
        setReportIssueNote={setReportIssueNote}
        isFieldEditable={isFieldEditable}
        isFieldVisible={isFieldVisible}
        toggleSection={toggleSection}
        setPrintHandoverApps={setPrintHandoverApps}
        setIsPrintingHandover={setIsPrintingHandover}
        slaConfig={slaConfig}
      />
      {/* Handover Ticket Modal */}
      <HandoverTicketModal 
        isOpen={isHandoverTicketOpen} 
        onClose={() => setIsHandoverTicketOpen(false)} 
        app={editApp || selectedApp} 
        theme={theme} 
        template={handoverTemplate}
      />

      {/* Bulk Print View - Visible only during printing */}
      {isPrintingHandover && (
        <div className="fixed inset-0 bg-white z-[9999] overflow-auto print:static print:z-auto print:bg-white no-print-overlay">
          <div className="max-w-4xl mx-auto py-10 print:py-0">
            {printHandoverApps.map((app, index) => (
              <div key={`print-handover-${app.id || 'none'}-${index}`} className={cn("bg-white text-slate-900 mb-10 print:mb-0", index > 0 ? "break-before-page" : "")}>
                <HandoverPrintContent app={app} template={handoverTemplate} theme="light" />
              </div>
            ))}
          </div>
          <div className="fixed bottom-8 right-8 flex gap-4 print:hidden">
            <button 
              onClick={() => window.print()}
              className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2"
            >
              <Printer size={18} /> Xác nhận In ({printHandoverApps.length})
            </button>
            <button 
              onClick={() => setIsPrintingHandover(false)}
              className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all active:scale-95"
            >
              Thoát chế độ in
            </button>
          </div>
        </div>
      )}

      <CreateApplicationModal
        isCreateModalOpen={isCreateModalOpen}
        setIsCreateModalOpen={setIsCreateModalOpen}
        theme={theme}
        newApp={newApp as Partial<Application>}
        setNewApp={setNewApp as any}
        formErrors={formErrors}
        projects={visibleProjects}
        handleCreateApp={handleCreateApp}
        isSavingApp={isSavingApp}
      />

      <UserManagementModal
        isUserModalOpen={isUserModalOpen}
        setIsUserModalOpen={setIsUserModalOpen}
        theme={theme}
        editUser={editUser}
        setEditUser={setEditUser}
        handleUpdateUser={handleUpdateUser}
        handleCreateUser={handleCreateUser}
        newUser={newUser}
        setNewUser={setNewUser}
        projects={projects}
      />
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

      {/* Self Service Handover Modal */}
      <SelfServiceHandoverModal
        isOpen={selfServiceHandoverModal !== null}
        app={selfServiceHandoverModal ? selfServiceHandoverModal.app : null}
        onConfirm={handleSelfServiceHandoverConfirm}
        onClose={() => setSelfServiceHandoverModal(null)}
      />

      <BulkTransitionModal 
        isOpen={isBulkTransitionModalOpen}
        onClose={() => setIsBulkTransitionModalOpen(false)}
        onConfirm={() => {
          if (bulkTransitionTarget) {
            executeBulkStepTransition(bulkTransitionTarget, bulkTransitionField ? bulkTransitionValue : null, bulkTransitionLocation, bulkTransitionRefCode, bulkTransitionKtHandover);
          }
        }}
        selectedCount={selectedAppIds.length}
        unitCodes={selectedAppIds.map(id => selectedAppUnitCodes[String(id)]).filter(Boolean) as string[]}
        targetStepLabel={bulkTransitionTarget ? (stepConfig[bulkTransitionTarget] || INITIAL_STEP_CONFIG[bulkTransitionTarget]).label : ''}
        targetStep={bulkTransitionTarget}
        updateField={bulkTransitionField}
        value={bulkTransitionValue}
        onChangeValue={setBulkTransitionValue}
        location={bulkTransitionLocation}
        onChangeLocation={setBulkTransitionLocation}
        refCode={bulkTransitionRefCode}
        onChangeRefCode={setBulkTransitionRefCode}
        ktHandover={bulkTransitionKtHandover}
        onChangeKtHandover={setBulkTransitionKtHandover}
        theme={theme}
        showToast={showToast}
        dateError={bulkTransitionChronoError}
        isSelfService={applications.filter(a => selectedAppIds.includes(a.id)).some(a => a.isSelfService)}
      />

      <BulkRejectModal
        isOpen={isBulkRejectModalOpen}
        onClose={() => setIsBulkRejectModalOpen(false)}
        onConfirm={handleBulkRejectApps}
        selectedCount={selectedAppIds.length}
        unitCodes={selectedAppIds.map(id => selectedAppUnitCodes[String(id)]).filter(Boolean) as string[]}
        availableSteps={availableStepsForBulkReject}
        theme={theme}
      />

      <BulkIssueModal
        isOpen={isBulkIssueOpen}
        onClose={() => setIsBulkIssueOpen(false)}
        onConfirm={handleBulkReportIssue}
        selectedCount={selectedAppIds.length}
        unitCodes={selectedAppIds.map(id => selectedAppUnitCodes[String(id)]).filter(Boolean) as string[]}
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

      {importPreviewData && (
        <ImportPreviewModal
          isOpen={importPreviewData !== null}
          onClose={() => setImportPreviewData(null)}
          onConfirm={handleConfirmImport}
          data={importPreviewData}
          theme={theme}
          isLoading={isImporting}
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

      {/* Drawer Bộ lọc bên phải - Rendered here at the body root so it never gets cropped or limited by overflow-hidden containers */}
      <AnimatePresence>
        {isShowFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsShowFilters(false)}
              className="fixed inset-0 bg-black/50 z-[90] pointer-events-auto"
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
                        <option key="all-projects-filter" value="ALL">Tất cả dự án</option>
                        {visibleProjects.map((p, index) => (
                          <option key={`project-filter-${p.id}-${index}`} value={p.id}>{p.name}</option>
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
                        <option key="all-status-filter" value="ALL">Tất cả trạng thái</option>
                        <option value="Processing">ĐANG CHUẨN BỊ</option>
                        <option value="WaitingVPDK">CHỜ NỘP VPĐK</option>
                        <option value="Submitted">ĐÃ NỘP VPĐK</option>
                        <option value="TaxNoticePending">CHỜ THÔNG BÁO THUẾ</option>
                        <option value="TaxPending">CHỜ HOÀN THÀNH NVTC</option>
                        <option value="TaxPaid">ĐÃ NỘP THUẾ</option>
                        <option value="WaitingHandover">CHỜ BÀN GIAO</option>
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

                <div className="pt-4 border-t border-slate-800/10 grid grid-cols-2 gap-3 mt-auto flex-shrink-0">
                  <button 
                    onClick={() => {
                      setSelectedProjectId(null);
                      setFilterStatus('ALL');
                      setFilterLoanStatus('ALL');
                      setFilterSelfService('ALL');
                      setFilterSLAStatus('ALL');
                      setFilterIssue('ALL');
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

      {/* Confirm Dialog */}
      {confirmDialog?.isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 rounded-[2rem] p-8 border border-slate-700 shadow-2xl">
            <h3 className="text-lg font-black text-white mb-3">{confirmDialog.title}</h3>
            <p className="text-sm text-slate-400 mb-6 whitespace-pre-line">{confirmDialog.message}</p>
            <div className="flex gap-4">
              <button
                onClick={() => setConfirmDialog(null)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-sm"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      } />
    </Routes>
  );
}
