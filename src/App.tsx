import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useDashboardStats } from './modules/dashboard/useDashboardStats';
import { useToast } from './hooks/useToast';
import { useBulkActions } from './hooks/useBulkActions';
import { useApplicationFilters } from './hooks/useApplicationFilters';
import { calculateSLA } from './utils/statusEngine';
import { diffDays } from './utils/dateUtils';
import { buildFlags } from './utils/flagUtils';
import { mapFromSnakeCase, mapToSnakeCase, mapUserFromSnakeCase, mapUserToSnakeCase, safeParse } from './utils/mappers';
import { calculateDaysDiff, calculateDaysBetweenDates, getPhaseIndex, getTaxStatus, getOverdueInfo } from './utils/appUtils';
import { StatCard, StatusBadge, DetailCard, FestiveBranding, PrintStyles } from './components/AppSubComponents';

import { useExcelImport } from './hooks/useExcelImport';
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
import HandoverTicketModal from './components/modals/HandoverTicketModal';
import BulkDocumentModal from './components/modals/BulkDocumentModal';
import BulkNoteModal from './components/modals/BulkNoteModal';
import ChangePasswordModal from './components/modals/ChangePasswordModal';
import FilePreviewModal from './components/modals/FilePreviewModal';
import BulkTransitionModal from './components/modals/BulkTransitionModal';
import BulkIssueModal from './components/modals/BulkIssueModal';
import ImportPreviewModal from './components/modals/ImportPreviewModal';
import { ApplicationDetailModal } from './components/modals/ApplicationDetailModal';
import { CreateApplicationModal } from './components/modals/CreateApplicationModal';
import { UserManagementModal } from './components/modals/UserManagementModal';
import { Sidebar } from './components/Sidebar';
import { DashboardTab } from './components/tabs/DashboardTab';
import { ApplicationsTab } from './components/tabs/ApplicationsTab';
import { ResourcesTab } from './components/tabs/ResourcesTab';
import { Routes, Route, Link } from 'react-router-dom';
import ReportScreen from './pages/ReportScreen';
import { cn } from './lib/utils';
import { formatDate } from './utils/dateUtils';
import { motion, AnimatePresence } from 'motion/react';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
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
// Đảm bảo URL hợp lệ
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || 'https://eewikwqwtgmrlvyrfgit.supabase.co').trim().replace(/\/$/, '');

const JWT_ANON_KEY_STANDARD = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVld2lrd3F3dGdtcmx2eXJmZ2l0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MzkwOTUsImV4cCI6MjA5MzUxNTA5NX0.BaoDhOsVuVha0b8L-7caSE6vtrzmeIDdg7z2DLooCWc';

const getValidSupabaseKey = (): string => {
  // Validate if env variable is a valid JWT token
  const keyCandidate = import.meta.env.VITE_SUPABASE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (keyCandidate && keyCandidate.trim().startsWith('eyJ')) {
    return keyCandidate.trim();
  }
  return JWT_ANON_KEY_STANDARD;
};

const SUPABASE_KEY = getValidSupabaseKey();

// Validate key trước khi tạo client
if (!SUPABASE_KEY) {
  console.error('[Config] VITE_SUPABASE_KEY chưa được cấu hình!');
}

const ADMIN_SECRET = (
  import.meta.env.VITE_ADMIN_SECRET || 'Kuropk@93'
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

console.log('[Key Check]', {
  type: SUPABASE_KEY.startsWith('eyJ') ? 'JWT ✅' : 
        SUPABASE_KEY.startsWith('sb_') ? 'Publishable ⚠️ (Cần đổi sang JWT anon key để dùng Realtime RLS)' : 
        'Chưa cấu hình ❌',
  url: SUPABASE_URL
});



/**
 * Self-healing logic for inconsistent record states
 * If a record has customerHandoverDate but is not in Hoan_Tat step or Completed status,
 * this function identifies it and triggers a sync back to Supabase.
 */
const useSelfHealingData = (applications: Application[], setApplications: (apps: Application[]) => void) => {
  const { showToast } = useToast();
  const healingRef = useRef(false);

  useEffect(() => {
    if (applications.length === 0) return;
    if (healingRef.current) return;

    const inconsistentApps = applications.filter(app => 
      app.customerHandoverDate && (app.currentStep !== 'Hoan_Tat' || app.status !== 'Completed')
    );

    if (inconsistentApps.length === 0) return;

    healingRef.current = true;

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
        console.log(`[Self-Healing] Detected ${inconsistentApps.length} inconsistent records. Syncing to Supabase...`);
        // Bulk update the inconsistent ones
        const updatedApps = await bulkSyncRecordsToSupabase(healedApps, applications, showToast);
        setApplications(updatedApps);
      } catch (error) {
        console.error('[Self-Healing] Error fixing records:', error);
        showToast('Có lỗi xảy ra, vui lòng thử lại', 'error');
      } finally {
        setTimeout(() => {
          healingRef.current = false;
        }, 5000);
      }
    };

    fixApps();
  }, [applications]);
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
      const LIGHT_SELECT = [
        'id','unit_code','project_name','customer_name',
        'current_step','status','workflow_type',
        'contract_signing_date','submission_date',
        'tax_notification_date','tax_receipt_date',
        'gcn_signed_date','gcn_received_date',
        'customer_handover_date','accounting_handover_date',
        'ptda_handover_date','vpdk_code','loan_status',
        'is_self_service','property_type','contract_signer_type',
        'phone_number','received_date','bank_commitment_deadline',
        'submission_location','issue_type','issue_severity',
        'issue_notes','is_rejected','created_at'
      ].join(',');

      const { data: insertResult, error: insertError } = await supabase
        .from('records')
        .insert(recordsToInsert)
        .select(LIGHT_SELECT);
      if (insertError) throw insertError;
      insertedData = insertResult || [];
    }

    let updatedData: any[] = [];
    if (recordsToUpdate.length > 0) {
      const { error: updateError } = await supabase
        .from('records')
        .upsert(recordsToUpdate, { onConflict: 'id' });
      if (updateError) throw updateError;
      updatedData = recordsToUpdate;
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

// Sub-components moved to AppSubComponents.tsx











// Modals and Utils moved


// HandoverRecord template moved to components/

export default function App() {
  
  const [search, setSearch] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'applications' | 'users' | 'resources' | 'reports' | 'settings'>('dashboard');
  const [dashboardTab, setDashboardTab] = useState<'ALL' | 'SELF_SERVICE' | 'LOAN'>('ALL');
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

  const [stepConfig, setStepConfig] = useState<Record<string, { label: string, dept: Dept, status: UnitStatus, slaDays?: number, active: boolean }>>(INITIAL_STEP_CONFIG);
  const [projects, setProjects] = useState<Project[]>([]);
  const userRole = useMemo(() => currentUser?.dept || 'PTT', [currentUser]);

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
  const [applications, setApplications] = useState<Application[]>([]);
  const [dashboardApps, setDashboardApps] = useState<Application[]>([]);

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

  useSelfHealingData(applications, handleSetApplications);

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
    if (dashboardTab === 'SELF_SERVICE') {
      setFilterSelfService('YES');
      setFilterLoanStatus('ALL');
    } else if (dashboardTab === 'LOAN') {
      setFilterSelfService('ALL');
      setFilterLoanStatus('Co_Vay');
    } else {
      setFilterSelfService('ALL');
      setFilterLoanStatus('ALL');
    }
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
      let rpcSuccess = false;
      try {
        const { error: rpcError } = await supabase.rpc('secure_change_password', {
          p_username: currentUser.username,
          p_new_password: passwordForm.newPassword
        });
        if (!rpcError) {
          rpcSuccess = true;
        } else {
          console.warn('RPC change password not available or failed, using table fallback:', rpcError);
        }
      } catch (rpcCallErr) {
        console.warn('Supabase RPC call failed, trying direct table update:', rpcCallErr);
      }

      if (!rpcSuccess) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            password: passwordForm.newPassword, 
            is_first_login: false 
          })
          .eq('id', currentUser.id);
        if (updateError) throw updateError;
      }
      
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
      const timeoutId = setTimeout(() => {
        setIsInitialLoading(false);
        setIsLoadingApps(false);
        setIsLoadingConfig(false);
        showToast(
          '⚠️ Tải dữ liệu quá lâu. Kiểm tra kết nối.', 
          'error'
        );
      }, 15000);

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
                userRole === 'DIRECTOR' ||
                !projectName ||
                assignedNamesRef.current.includes(projectName);
              if (!isAllowed) return; // Bỏ qua nếu không có quyền xem project này
            }

            if (eventType === 'INSERT') {
              const newApp = mapFromSnakeCase(newRow);
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
              const updatedApp = mapFromSnakeCase(newRow);
              
              handleSetApplications(prev => prev.map(a => 
                a.id === updatedApp.id ? updatedApp : a
              ));
              handleSetDashboardApps(prev => prev.map(a => 
                a.id === updatedApp.id ? updatedApp : a
              ));

              const isSelfUpdated = selfUpdateRef.current.has(updatedApp.id as number);
              if (isSelfUpdated) {
                selfUpdateRef.current.delete(updatedApp.id as number);
              } else {
                showToast(
                  `📋 Hồ sơ ${updatedApp.unitCode} vừa được cập nhật bởi người khác`,
                  'info'
                );
              }

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
                return updatedApp;
              });
            }

            else if (eventType === 'DELETE') {
              const deletedId = oldRow.id;
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

  // Bộ hẹn giờ dự phòng (Fallback Polling) khi kênh Real-time WebSocket bị chặn trong môi trường iFrame Sandbox
  useEffect(() => {
    if (!currentUser || realtimeStatus === 'connected') return;

    // Tự động kéo dữ liệu (HTTP pull) định kỳ mỗi 60 giây để duy trì đồng bộ
    const fallbackPollInterval = setInterval(() => {
      // Không poll khi tab bị ẩn (tiết kiệm tài nguyên)
      if (document.hidden) return;

      console.log('🔄 Đang đồng bộ dữ liệu dự phòng qua HTTPS (WebSocket bị chặn hoặc mất kết nối)...');
      if (activeTab === 'applications') {
        fetchApplications();
      }
      fetchDashboardApps();
    }, 60000);

    return () => {
      clearInterval(fallbackPollInterval);
    };
  }, [currentUser, realtimeStatus, activeTab]);

  const fetchApplications = async () => {
    setIsLoadingApps(true);
    try {
      let query = supabase.from('records').select(`
        id, unit_code, project_name, customer_name,
        contract_signer_type, phone_number,
        property_type, loan_status, is_self_service,
        current_step, status, received_date,
        contract_signing_date, submission_date,
        tax_notification_date, tax_receipt_date,
        gcn_signed_date, gcn_received_date,
        customer_handover_date, accounting_handover_date,
        ptda_handover_date, bank_commitment_deadline,
        submission_location, vpdk_code,
        issue_type, issue_severity, issue_notes,
        is_rejected, workflow_type, created_at,
        assigned_to, tax_payment_status
      `, { count: 'exact' });
      
      if (search) {
        query = query.or(`unit_code.ilike.%${search}%,customer_name.ilike.%${search}%,project_name.ilike.%${search}%,phone_number.ilike.%${search}%`);
      }

      const hasProjectAssignments = currentUser?.assignedProjectIds && currentUser.assignedProjectIds.length > 0;

      if (selectedProjectId && selectedProject) {
        query = query.eq('project_name', selectedProject.name);
      } else if (userRole !== 'ADMIN' && userRole !== 'DIRECTOR' && hasProjectAssignments) {
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
              'S4_Cho_Thong_Bao_Thue', 'GD3_Cho_TBThue'
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
              'GD3_Cho_TBThue'
            ]);
        }
        else if (dashboardFilter === 'WAIT_TAX_NOTICE_OVERDUE') {
          query = query
            .not('submission_date', 'is', null)
            .filter('tax_notification_date', 'is', null)
            .in('current_step', [
              'S4_Cho_Thong_Bao_Thue',
              'GD3_Cho_TBThue'
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
            'GD3_Cho_TBThue', 'S4_Cho_Thong_Bao_Thue'
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
      
      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1);
        
      if (error) throw error;
      
      const fetchedApps = (data || []).map(mapFromSnakeCase);
      handleSetApplications(fetchedApps);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching paginated records:', error);
     showToast('Có lỗi xảy ra, vui lòng thử lại', 'error');
     handleSetApplications([]);
      setTotalCount(0);
      // Suppress UI error to keep dashboard smooth
    } finally {
      setIsLoadingApps(false);
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
      // Fetch ONLY necessary columns for dashboard stats, ignoring pagination and filters to optimize bandwidth
      let query = supabase.from('records').select(`
        id, status, current_step, project_name,
        workflow_type, submission_date,
        tax_notification_date, tax_receipt_date,
        gcn_signed_date, customer_handover_date,
        accounting_handover_date, is_self_service,
        loan_status, issue_type, is_rejected,
        property_type, customer_name, unit_code,
        received_date, contract_signer_type, phone_number,
        created_at
      `);
      
      const currentUserRole = currentUser?.dept || 'PTT';
      
      // We still respect project filtering if set, but we fetch ALL records within that scope
      if (selectedProjectId) {
        const currentSelectedProject = projects.find(p => p.id === selectedProjectId);
        if (currentSelectedProject) {
          query = query.eq('project_name', currentSelectedProject.name);
        }
      } else if (currentUserRole !== 'ADMIN' && currentUserRole !== 'DIRECTOR') {
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
      const fetched = (data || []).map(mapFromSnakeCase);
      handleSetDashboardApps(fetched);
    } catch (error) {
      console.error('Error fetching dashboard records:', error);
     showToast('Có lỗi xảy ra, vui lòng thử lại', 'error');
     handleSetDashboardApps([]);
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
      const snakeData: any = mapNotificationToSnakeCase(noti);
      delete snakeData.id; // explicitly remove id to let Supabase gen_random_uuid handle it
      const { error } = await supabase.from('notifications').insert(snakeData);
      if (error) {
        if (error.code === '23503') return;
        throw error;
      }
    } catch (error) {
      console.error('Error creating notification:', error);
     showToast('Có lỗi xảy ra, vui lòng thử lại', 'error');
     }
  };

  const notifyNextDepartment = async (app: Application, targetStep: StepName) => {
    const step = stepConfig[targetStep] || INITIAL_STEP_CONFIG[targetStep];
    const targetDept = step.dept;
    
    // Find all users in the target department
    const targetUsers = users.filter(u => 
      u.dept === targetDept && 
      u.id !== currentUser?.id &&
      typeof u.id === 'string' &&
      u.id.length === 36
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
  const [isEditing, setIsEditing] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const selfUpdateRef = useRef<Set<number>>(new Set());
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

  const isEditingRef = useRef(isEditing);
  const editAppRef = useRef(editApp);
  const selectedAppRef = useRef(selectedApp);

  useEffect(() => {
    isEditingRef.current = isEditing;
    editAppRef.current = editApp;
    selectedAppRef.current = selectedApp;
  }, [isEditing, editApp, selectedApp]);

  const handleSelectApp = useCallback(async (app: Application | null) => {
    setConflictWarning(null);
    if (!app) {
      setSelectedApp(null);
      return;
    }
    setSelectedApp(app);
    try {
      const { data, error } = await supabase
        .from('records')
        .select('scanned_files, history, audit_trail')
        .eq('id', app.id)
        .single();
      if (error) throw error;
      if (data) {
        setSelectedApp(prev => prev && prev.id === app.id ? {
          ...prev,
          scannedFiles: safeParse(data.scanned_files, []),
          history: safeParse(data.history, []),
          audit_trail: safeParse(data.audit_trail, []),
          auditTrail: safeParse(data.audit_trail, [])
        } : prev);
      }
    } catch (err) {
      console.error('Error fetching detail background:', err);
    }
  }, [supabase]);
  
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
  
  const [isHandoverTicketOpen, setIsHandoverTicketOpen] = useState(false);
  
  const handlePrintHandoverTicket = () => {
    setIsHandoverTicketOpen(true);
  };
  
  const { toast, showToast } = useToast();
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
        const visibleApps = displayedApps.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
        
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
          const allIds = displayedApps.map(a => a.id);
          setSelectedRows(new Set(allIds));
          setSelectedAppIds(allIds);
          showToast(`Đã chọn tất cả ${displayedApps.length} hồ sơ`, 'success');
        }

        // Ctrl + C: Copy selected rows to clipboard for Excel
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
          if (selectedRows.size > 0) {
            e.preventDefault();
            const rowsToCopy = displayedApps.filter(app => selectedRows.has(app.id));
            
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
  }, [selectedApp, isEditing, currentUser, activeTab, displayedApps, selectedIndex, selectedRows, lastSelectedIndex, currentPage, pageSize, isProjectModalOpen]);

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
      
      handleSetApplications(prev => prev.map(a => a.id === id ? finalApp : a));
      handleSetDashboardApps(prev => prev.map(a => a.id === id ? finalApp : a));
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
  const [reportIssueSeverity, setReportIssueSeverity] = useState<IssueSeverity>('Moderate');
  const [reportIssueNote, setReportIssueNote] = useState('');

  const handleSingleOrBulkReportIssue = async (apps: Application[]) => {
    if (apps.length === 0 || !reportIssueNote.trim()) return;
    
    setIsSavingApp(true);
    try {
        const updatedApps = apps.map(app => {
            const logEntry: ApplicationStepHistory = {
                id: Math.random().toString(36).substr(2, 9),
                stepName: app.currentStep,
                dept: (
                  userRole === 'ADMIN' ? 'ADMIN' : 
                  userRole === 'MANAGER' ? 'KT' : 
                  userRole === 'MANAGER_PTT' ? 'PTT' :
                  userRole === 'MANAGER_KT' ? 'KT' :
                  userRole === 'MANAGER_PTDA' ? 'PTDA' :
                  userRole === 'MANAGER_ALL' ? 'ADMIN' :
                  (userRole as Dept)
                ),
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
        
        handleSetApplications(prev => prev.map(a => {
            const updated = syncedApps.find(sa => sa.id === a.id);
            return updated ? updated : a;
        }));

        handleSetDashboardApps(prev => prev.map(a => {
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

  const bulkTransitionChronoError = useMemo(() => {
    if (!bulkTransitionField || !bulkTransitionValue || selectedAppIds.length === 0) return null;
    
    let firstError: string | null = null;
    let firstWarning: string | null = null;
    
    for (const id of selectedAppIds) {
      const app = applications.find(a => a.id === id);
      if (!app) continue;
      
      const appWithDate = { ...app, [bulkTransitionField.key]: bulkTransitionValue };
      if (['S4_Cho_Thong_Bao_Thue', 'S3_Nop_VPDK', 'GD3_Cho_TBThue', 'GD1_Nop_VPDK', 'GD2_Cho_Nop_VPDK'].includes(bulkTransitionTarget || '')) {
        if (bulkTransitionLocation) appWithDate.submissionLocation = bulkTransitionLocation as any;
        if (bulkTransitionRefCode) appWithDate.vpdkCode = bulkTransitionRefCode;
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
  }, [applications, selectedAppIds, bulkTransitionField, bulkTransitionValue, bulkTransitionTarget, bulkTransitionLocation, bulkTransitionRefCode]);

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

  function validateDateSequence(app: Partial<Application>) {
    const dates = [
      { key: 'receivedDate', label: 'Ngày nhận HS' },
      { key: 'accountingHandoverDate', label: 'Ngày KT tiếp nhận' },
      { key: 'contractSigningDate', label: 'Ngày ký HĐCN' },
      { key: 'submissionDate', label: 'Ngày nộp VPĐK' },
      { key: 'taxNotificationDate', label: 'Ngày TB Thuế' },
      { key: 'taxReceiptDate', label: 'Ngày nộp thuế/NVTC' },
      { key: 'gcnSignedDate', label: 'Ngày ký GCN' },
      { key: 'gcnReceivedDate', label: 'Ngày nhận GCN' },
      { key: 'ptdaHandoverDate', label: 'Ngày PTDA bàn giao' },
      { key: 'customerHandoverDate', label: 'Ngày BG Khách' }
    ];

    // Helper to check if a value is empty or invalid
    const isDateEmptyOrInvalid = (val: any) => {
      if (!val || val === '---' || typeof val !== 'string' || val.trim() === '') {
        return true;
      }
      const d = new Date(val);
      return isNaN(d.getTime());
    };

    // Find the latest non-empty date index in the expected chronology
    let maxFilledIdx = -1;
    for (let i = dates.length - 1; i >= 0; i--) {
      const val = app[dates[i].key as keyof Application];
      if (!isDateEmptyOrInvalid(val)) {
        maxFilledIdx = i;
        break;
      }
    }

    // If no dates are filled or only one date is filled, no chronological checks needed
    if (maxFilledIdx <= 0) {
      return null;
    }

    // Check if any date before maxFilledIdx is empty/invalid
    for (let i = 0; i < maxFilledIdx; i++) {
      const val = app[dates[i].key as keyof Application];
      if (isDateEmptyOrInvalid(val)) {
        // BYPASS validation! There are missing preceding milestones, allowing input without blocking
        return null;
      }
    }

    // Perform chronological order checks: d2 >= d1
    // Filter out fields that are present and have valid date strings up to maxFilledIdx
    const activeDates = dates
      .slice(0, maxFilledIdx + 1)
      .map(d => ({ ...d, value: app[d.key as keyof Application] }))
      .filter(d => !isDateEmptyOrInvalid(d.value));

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

    // Check future date
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    for (const d of dates) {
      const val = app[d.key as keyof Application];
      if (isDateEmptyOrInvalid(val)) {
        continue;
      }
      if (d.key === 'bankCommitmentDeadline' || d.key === 'commitmentDate') {
        continue;
      }
      const date = new Date(val as string);
      date.setHours(0, 0, 0, 0);
      if (!isNaN(date.getTime()) && date > today) {
        return `⚠️ Lưu ý: ${d.label} (${formatDate(val as string)}) là ngày trong tương lai`;
      }
    }

    return null;
  }

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

        if (processedChanges.gcnReceivedDate) {
          const isEarly = ['GD1','GD2','GD3','GD4','S1','S2','S3','S4','S5'].some(prefix => (updated.currentStep as string).startsWith(prefix));
          if (isEarly) {
            updated.issueType = 'Sai sót Khác';
            updated.issueNotes = (updated.issueNotes ? updated.issueNotes + '\n' : '') + 'Cảnh báo: Lệch tiến độ thực tế (Có ngày nhận GCN nhưng chưa tới bước bàn giao)';
            updated.issueSeverity = 'High';
            updated.status = 'Error';
            updated.issue_type = updated.issueType;
            updated.issue_notes = updated.issueNotes;
            updated.issue_severity = updated.issueSeverity;
            updated.issue_status = 'OPEN';
            updated.issue_resolved_at = null;
            if (!updated.issue_created_at) updated.issue_created_at = new Date().toISOString();
          }
        }

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
    bulkSyncRecordsToSupabase,
    supabase,
    userRole
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

    if (isManagementEdit) {
      headers = [
        "Dự án", "Mã lô/căn", "Khách hàng", "Đối tượng ký HĐCN", "Số điện thoại", "Vay ngân hàng (Có/Không)", "Loại tài sản (Căn hộ/Đất nền)", 
        "Hạn GCN cam kết", "Ngày nhận hồ sơ", "Ngày ký HĐCN", "Tự làm sổ (Có/Không)", "Ngày bàn giao sang KT",
        "Nơi nộp", "Mã VPĐK", "Ngày nộp hồ sơ", "Ngày TB Thuế", "Ngày nhận TB Thuế", "Ngày đóng thuế", 
        "Ngày GCN đã ký", "Ngày GCN đã nhận", "Ngày BG KT", "Ngày BG GCN Khách"
      ];
      data = sourceApps.map(app => [
        app.projectName,
        app.unitCode,
        app.customerName,
        app.contractSignerType || '',
        app.phoneNumber || '',
        app.loanStatus === 'Co_Vay' ? 'Có' : 'Không',
        app.propertyType === 'Can_Ho' ? 'Căn hộ' : 'Đất nền',
        formatExcelDate(app.bankCommitmentDeadline),
        formatExcelDate(app.receivedDate),
        formatExcelDate(app.contractSigningDate),
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
        formatExcelDate(app.accountingHandoverDate),
        formatExcelDate(app.customerHandoverDate)
      ]);
    } else if (userRole === 'PTT' || userRole === 'MANAGER_PTT') {
      headers = [
        "Dự án", "Mã lô/căn", "Tên khách hàng", "Đối tượng ký HĐCN", "Số điện thoại", "Vay ngân hàng (Có/Không)", "Loại tài sản", 
        "Ngày nhận hồ sơ", "Ngày ký HĐCN", "Hạn cam kết Ngân hàng", "Tự làm sổ (Có/Không)", "Ngày bàn giao sang KT", "Ngày nhận GCN", "Ngày BG GCN Khách",
        "Phân loại sai sót", "Mức độ sai sót", "Ghi chú sai sót"
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
        "Ngày TB Thuế", "Ngày nhận TB Thuế", "Ngày đóng thuế", "Ngày nhận GCN", "Ngày BG P.TDA", 
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
        formatExcelDate(app.gcnSignedDate),
        formatExcelDate(app.gcnReceivedDate),
        app.issueType && app.issueType !== 'None' ? app.issueType : '',
        app.issueSeverity || '',
        app.issueNotes || ''
      ]);
    } else {
      // Default / Admin: Full Template for complete control
      headers = [
        "Dự án", "Mã lô/căn", "Khách hàng", "Đối tượng ký HĐCN", "Số điện thoại", "Vay ngân hàng", "Loại tài sản", 
        "Hạn cam kết vay", "Ngày nhận hồ sơ", "Ngày ký HĐCN", "Tự làm sổ", "Ngày bàn giao sang KT",
        "Nơi nộp", "Mã HS VPĐK", "Ngày nộp VPĐK", "Ngày TB Thuế", "Ngày nhận TB Thuế", 
        "Ngày nhận NVTC", "Ngày trình ký GCN", "Ngày nhận GCN thực tế", "Ngày BG Pkt", "Ngày BG Khách"
      ];
      data = sourceApps.map(app => [
        app.projectName,
        app.unitCode,
        app.customerName,
        app.contractSignerType || '',
        app.phoneNumber || '',
        app.loanStatus === 'Co_Vay' ? 'Có' : 'Không',
        app.propertyType === 'Can_Ho' ? 'Căn hộ' : 'Đất nền',
        formatExcelDate(app.bankCommitmentDeadline),
        formatExcelDate(app.receivedDate),
        formatExcelDate(app.contractSigningDate),
        app.isSelfService ? 'Có' : 'Không',
        formatExcelDate(app.accountingHandoverDate),
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
    const dataEndRow = data.length + 1;

    // ADMIN/MANAGER/DIRECTOR
    if (['ADMIN', 'MANAGER', 'DIRECTOR', 'MANAGER_ALL'].includes(userRole)) {
      addDropdownValidation(worksheet, 'E', 2, dataEndRow, 
        ['Có', 'Không']);                    // Vay ngân hàng
      addDropdownValidation(worksheet, 'F', 2, dataEndRow, 
        ['Căn hộ', 'Đất nền']);             // Loại tài sản
      addDropdownValidation(worksheet, 'J', 2, dataEndRow, 
        ['Có', 'Không']);                    // Tự làm sổ
      addDropdownValidation(worksheet, 'K', 2, dataEndRow, 
        ['Phường/Xã', 'TP Đà Nẵng']);      // Nơi nộp
    }

    // PTT
    if (userRole === 'PTT' || userRole === 'MANAGER_PTT') {
      addDropdownValidation(worksheet, 'F', 2, dataEndRow,
        ['Có', 'Không']);                    // Vay ngân hàng
      addDropdownValidation(worksheet, 'G', 2, dataEndRow,
        ['Căn hộ', 'Đất nền']);             // Loại tài sản
      addDropdownValidation(worksheet, 'K', 2, dataEndRow,
        ['Có', 'Không']);                    // Tự làm sổ
      addDropdownValidation(worksheet, 'N', 2, dataEndRow,
        [...VALID_ISSUE_TYPES]);
      addDropdownValidation(worksheet, 'O', 2, dataEndRow,
        [...VALID_SEVERITIES]);
    }

    // KT
    if (userRole === 'KT' || userRole === 'MANAGER_KT') {
      addDropdownValidation(worksheet, 'D', 2, dataEndRow,
        ['Phường/Xã', 'TP Đà Nẵng']);      // Nơi nộp
      addDropdownValidation(worksheet, 'L', 2, dataEndRow,
        [...VALID_ISSUE_TYPES]);
      addDropdownValidation(worksheet, 'M', 2, dataEndRow,
        [...VALID_SEVERITIES]);
    }

    // PTDA
    if (userRole === 'PTDA' || userRole === 'MANAGER_PTDA') {
      addDropdownValidation(worksheet, 'H', 2, dataEndRow,
        [...VALID_ISSUE_TYPES]);
      addDropdownValidation(worksheet, 'I', 2, dataEndRow,
        [...VALID_SEVERITIES]);
    }

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
      if (editApp.id) {
        selfUpdateRef.current.add(editApp.id as number);
        setTimeout(() => {
          selfUpdateRef.current.delete(editApp.id as number);
        }, 2000);
      }

      const auditEntry = createAuditEntry('Cập nhật thông tin', false, 1, editApp.unitCode, 'Chỉnh sửa chi tiết hồ sơ');

      const updatedApp = {
        ...editApp,
        auditTrail: [auditEntry, ...(editApp.auditTrail || [])]
      };

      const finalApp = await syncRecordToSupabase(updatedApp);
      const oldId = updatedApp.id;

      handleSetApplications(prev => prev.map(app => app.id === oldId ? finalApp : app));
      handleSetDashboardApps(prev => prev.map(app => app.id === oldId ? finalApp : app));
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

        // 3. Verify thực sự đã xóa (RLS có thể chặn silently)
        const { data: checkData } = await supabase
          .from('records')
          .select('id')
          .eq('id', id)
          .maybeSingle();

        if (checkData) {
          throw new Error(
            'Xóa không thành công - có thể do quyền truy cập. ' +
            'Vui lòng kiểm tra lại hoặc liên hệ Admin.'
          );
        }

        handleSetApplications(prev => prev.filter(app => app.id !== id));
        handleSetDashboardApps(prev => prev.filter(app => app.id !== id));
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

  const handleStepTransition = async (nextStep: StepName, note?: string, overrideApp?: Application) => {
    const app = overrideApp || editApp || selectedApp;
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
        if (chronoError.startsWith('⚠️')) {
          showToast(chronoError, 'warning');
        } else {
          showToast(`Lỗi trình tự ngày: ${chronoError}`, 'warning');
          return;
        }
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

    // Auto-populate dates based on transition to minimize input effort
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

      handleSetApplications(prev => prev.map(a => a.id === app.id ? finalApp : a));
      handleSetDashboardApps(prev => prev.map(a => a.id === app.id ? finalApp : a));
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
    else if (nextStep === 'GD1_Cho_KT_TiepNhan') 
      updateField = { 
        key: 'accountingHandoverDate', 
        label: 'Ngày ký HĐCN/HĐMB',
        isRequired: false
      };
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
      const chronoWarnings: string[] = [];
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
          if (chronoError.startsWith('⚠️')) {
            chronoWarnings.push(`Căn ${appWithDate.unitCode}: ${chronoError}`);
          } else {
            chronoErrors.push(`Căn ${appWithDate.unitCode}: ${chronoError}`);
          }
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
        
        // Auto-populate dates based on transition to minimize input effort
        const autoDates: Partial<Application> = {};
        if ((targetStep === 'S2_KT_Tiep_Nhan' || targetStep === 'GD1_Cho_KT_TiepNhan') && !appWithDate.accountingHandoverDate) autoDates.accountingHandoverDate = nowStr;
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

        // GD Workflow Missing Auto Dates
        if (targetStep === 'GD3_Cho_TBThue' && !appWithDate.submissionDate) 
          autoDates.submissionDate = nowStr;
          
        if (targetStep === 'GD4_Cho_Nop_NVTC' && !appWithDate.taxNotificationDate) 
          autoDates.taxNotificationDate = nowStr;
          
        if (targetStep === 'GD4_Cho_KT_TiepNhan_LaySo' && !appWithDate.taxReceiptDate) 
          autoDates.taxReceiptDate = nowStr;
          
        if ((targetStep === 'GD5_Cho_Ky_In_GCN' || targetStep === 'GD5_Cho_GCN') && !appWithDate.gcnSignedDate) 
          autoDates.gcnSignedDate = nowStr;
          
        if (targetStep === 'GD5_Cho_PTT_TiepNhan_BG' && !appWithDate.gcnReceivedDate) 
          autoDates.gcnReceivedDate = nowStr;
          
        if (targetStep === 'GD6_Cho_BG_Khach' && !appWithDate.ptdaHandoverDate) 
          autoDates.ptdaHandoverDate = nowStr;

        // Auto handover logic
        autoDates.isHandedOver = true;
        autoDates.handoverDate = bulkTransitionField && dateValue ? dateValue : nowStr;

        let targetStatus = (stepConfig[targetStep] || INITIAL_STEP_CONFIG[targetStep]).status;
        
        // Business Logic updates
        if (targetStep === 'S2_KT_Tiep_Nhan' || targetStep === 'GD1_Cho_KT_TiepNhan') targetStatus = 'WaitingVPDK'; // CHỜ NỘP VPĐK
        if (targetStep === 'GD4_Cho_Nop_NVTC') targetStatus = 'TaxPending'; // CHỜ TB THUẾ / CHỜ ĐÓNG THUẾ
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
      handleSetApplications(finalApps);
      handleSetDashboardApps(prev => {
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
      if (chronoWarnings.length > 0) {
        showToast(`Các lưu ý ngày tương lai: ${chronoWarnings.slice(0, 3).join(', ')}${chronoWarnings.length > 3 ? '...' : ''}`, 'warning');
      }
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

      handleSetApplications(prev => prev.filter(app => !selectedAppIds.includes(app.id)));
      setSelectedAppIds([]);
      showToast(`Đã xóa hàng loạt ${count} hồ sơ và tài liệu đính kèm thành công.`, 'success');
    } catch (error) {
      console.error('Supabase bulk delete error:', error);
     showToast('Lỗi khi xóa hàng loạt trên Supabase.', 'error');
    } finally {
      setIsSavingApp(false);
    }
  };

  const handleBulkResolveIssues = async () => {
    const appsToResolve = applications.filter(a => 
      selectedRows.includes(String(a.id)) && 
      (a.isRejected || a.status === 'Error' || (a.issueType && a.issueType !== 'None'))
    );
    if (appsToResolve.length === 0) return;
    
    setIsSavingApp(true);
    let successCount = 0;
    for (const app of appsToResolve) {
      try {
        await handleResolveIssue(app.id);
        successCount++;
      } catch (e) {
        console.error(`Resolve error ${app.unitCode}:`, e);
      }
    }
    showToast(
      `Đã xác nhận khắc phục ${successCount}/` +
      `${appsToResolve.length} hồ sơ`,
      'success'
    );
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
      const finalApp = await syncRecordToSupabase(updatedApp);

      const updatedApps = applications.map(a => a.id === app.id ? finalApp : a);
      handleSetApplications(updatedApps);
      handleSetDashboardApps(prev => prev.map(a => a.id === app.id ? finalApp : a));
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
      handleSetApplications(updatedApps);
      handleSetDashboardApps(prev => prev.map(a => a.id === app.id ? finalApp : a));
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

  function updateAppIssue(
    app: Application, 
    note: string, 
    type: IssueType = 'Sai sót Khác', 
    severity: IssueSeverity = 'Moderate'
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
    const allowedDepts: string[] = ['KT', 'PTDA', 'MANAGER', 'DIRECTOR', 'ADMIN', 'MANAGER_ALL'];
    if (!allowedDepts.includes(userRole)) {
      showToast('Bạn không có quyền thực hiện chức năng Báo lỗi / Yêu cầu bổ sung.', 'error');
      return;
    }

    const updatedApp = updateAppIssue(app, note);

    setIsSavingApp(true);
    try {
      const finalApp = await syncRecordToSupabase(updatedApp);

      handleSetApplications(prev => prev.map(a => a.id === app.id ? finalApp : a));
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
      status: (stepConfig[app.currentStep]?.status || 'Processing') as any,
      issueType: 'None' as const,
      issueSeverity: 'Minor' as const,
      issueNotes: '',
      issue_status: 'RESOLVED' as const,
      issue_type: 'None',
      issue_severity: 'Minor',
      issue_notes: '',
      isRejected: false,
      history: newHistory
    };

    setIsSavingApp(true);
    try {
      const finalApp = await syncRecordToSupabase(updatedApp);

      handleSetApplications(prev => prev.map(a => a.id === app.id ? finalApp : a));
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
        issue_type: 'None',
        issue_severity: 'Minor',
        issue_notes: '',
        history: newHistory
      };

      const finalApp = await syncRecordToSupabase(updatedApp);
      
      handleSetApplications(prev => prev.map(a => a.id === appId ? finalApp : a));
      handleSetDashboardApps(prev => prev.map(a => a.id === appId ? finalApp : a));
      setSelectedApp(finalApp);
      showToast('Đã xác nhận khắc phục xong vướng mắc.', 'success');
    } catch (error) {
      console.error(error);
     showToast('Lỗi khi cập nhật trạng thái.', 'error');
    }
  };

  const handleRejectApp = async (reason: string) => {
    const app = editApp || selectedApp;
    if (!app) return;

    // Restriction: Only authorized depts can reject apps
    const allowedDepts: string[] = ['PTT', 'KT', 'PTDA', 'MANAGER', 'DIRECTOR', 'ADMIN', 'MANAGER_ALL'];
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

      handleSetApplications(prev => prev.map(a => a.id === oldId ? finalApp : a));
      handleSetDashboardApps(prev => prev.map(a => a.id === oldId ? finalApp : a));
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

  const isFieldEditable = (fieldName: string, appToCheck?: Application) => {
    if (!isEditing && !isSpreadsheetMode) return false;
    
    // Admin always has edit rights
    if (userRole === 'ADMIN') return true;
    
    // Management/Leadership roles depend on the permission field from DB
    if (userRole === 'MANAGER' || userRole === 'DIRECTOR' || userRole === 'MANAGER_ALL') {
      return userCanEdit;
    }

    // Specialist roles logic remains as is (they are always allowed to edit their assigned fields)
    if ((userRole === 'PTDA' || userRole === 'MANAGER_PTDA') && fieldName === 'vpdkCode') return false;

    const pttFields = [
      'customerName', 'contractSignerType', 'phoneNumber', 'loanStatus', 'bankCommitmentDeadline', 'propertyType', 
      'contractSigningDate', 'receivedDate', 'isSelfService', 'customerHandoverDate', 'taxNotificationReceivedDate', 'accountingHandoverDate', 'staffName',
      'gcnReceivedDate'
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

      // Check Lệch Tiến Độ Thực Tế cho GCN
      if (field === 'gcnReceivedDate' && value) {
        const isEarly = ['GD1','GD2','GD3','GD4','S1','S2','S3','S4','S5'].some(prefix => nextApp.currentStep.startsWith(prefix));
        if (isEarly) {
          nextApp.issueType = 'Sai sót Khác';
          nextApp.issueNotes = (nextApp.issueNotes ? nextApp.issueNotes + '\n' : '') + 'Cảnh báo: Lệch tiến độ thực tế (Có ngày nhận GCN nhưng chưa tới bước bàn giao)';
          nextApp.issueSeverity = 'High';
          nextApp.status = 'Error';
          nextApp.issue_type = nextApp.issueType;
          nextApp.issue_notes = nextApp.issueNotes;
          nextApp.issue_severity = nextApp.issueSeverity;
          nextApp.issue_status = 'OPEN';
          nextApp.issue_resolved_at = null;
          if (!nextApp.issue_created_at) nextApp.issue_created_at = new Date().toISOString();
        }
      }

      // Auto-promote for Self Service or Normal applications accordingly
      if (nextApp.isSelfService) {
        if (nextApp.customerHandoverDate || nextApp.status === 'Completed' || nextApp.currentStep === 'Hoan_Tat') {
          nextApp.currentStep = 'Hoan_Tat';
          nextApp.status = 'Completed';
        } else if (nextApp.gcnReceivedDate) {
          nextApp.currentStep = nextApp.workflowType === 'Quy_trinh_2' ? 'S7_2_Ban_Giao_Khach' : 'GD6_Cho_BG_Khach';
          nextApp.status = 'WaitingHandover';
        } else {
          nextApp.currentStep = nextApp.workflowType === 'Quy_trinh_2' ? 'S1_ChuanBi' : 'GD1_ChuanBi';
          nextApp.status = 'Processing';
        }
      } else {
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
        } else {
          if (nextApp.status !== 'Error') {
            nextApp.status = determineStatusFromStep(nextApp.currentStep);
          }
        }
      }

      // Auto-update issue type if notes are added
      if (field === 'issueNotes' && value) {
        if (!editApp.issueType || editApp.issueType === 'None') {
          nextApp.issueType = 'Sai sót Khác';
        }
        nextApp.status = 'Error';
        nextApp.issue_type = nextApp.issueType;
        nextApp.issue_notes = value;
        nextApp.issue_severity = nextApp.issueSeverity || 'Moderate';
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
      handleSetApplications(prev => prev.map(app => {
        if (app.id === selectedApp.id) {
          const nextApp = { ...app, [field]: value };
          
          // Auto-promote status to TaxCompleted if taxReceiptDate is added and current step expects it
          if (field === 'taxReceiptDate' && value && stepConfig[app.currentStep]?.status === 'TaxCompleted') {
            nextApp.status = 'TaxCompleted';
          }

          // Check Lệch Tiến Độ Thực Tế cho GCN
          if (field === 'gcnReceivedDate' && value) {
            const isEarly = ['GD1','GD2','GD3','GD4','S1','S2','S3','S4','S5'].some(prefix => nextApp.currentStep.startsWith(prefix));
            if (isEarly) {
              nextApp.issueType = 'Sai sót Khác';
              nextApp.issueNotes = (nextApp.issueNotes ? nextApp.issueNotes + '\n' : '') + 'Cảnh báo: Lệch tiến độ thực tế (Có ngày nhận GCN nhưng chưa tới bước bàn giao)';
              nextApp.issueSeverity = 'High';
              nextApp.status = 'Error';
              nextApp.issue_type = nextApp.issueType;
              nextApp.issue_notes = nextApp.issueNotes;
              nextApp.issue_severity = nextApp.issueSeverity;
              nextApp.issue_status = 'OPEN';
              nextApp.issue_resolved_at = null;
              if (!nextApp.issue_created_at) nextApp.issue_created_at = new Date().toISOString();
            }
          }

          // Auto-promote for Self Service or Normal applications accordingly
          if (nextApp.isSelfService) {
            if (nextApp.customerHandoverDate || nextApp.status === 'Completed' || nextApp.currentStep === 'Hoan_Tat') {
              nextApp.currentStep = 'Hoan_Tat';
              nextApp.status = 'Completed';
            } else if (nextApp.gcnReceivedDate) {
              nextApp.currentStep = nextApp.workflowType === 'Quy_trinh_2' ? 'S7_2_Ban_Giao_Khach' : 'GD6_Cho_BG_Khach';
              nextApp.status = 'WaitingHandover';
            } else {
              nextApp.currentStep = nextApp.workflowType === 'Quy_trinh_2' ? 'S1_ChuanBi' : 'GD1_ChuanBi';
              nextApp.status = 'Processing';
            }
          } else {
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
            } else {
              if (nextApp.status !== 'Error') {
                nextApp.status = determineStatusFromStep(nextApp.currentStep);
              }
            }
          }

          if (field === 'issueNotes' && value) {
            if (!app.issueType || app.issueType === 'None') {
              nextApp.issueType = 'Sai sót Khác';
            }
            nextApp.status = 'Error';
            nextApp.issue_type = nextApp.issueType;
            nextApp.issue_notes = value;
            nextApp.issue_severity = nextApp.issueSeverity || 'Moderate';
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

      handleSetApplications(prev => [appToAdd, ...prev]);
      handleSetDashboardApps(prev => [appToAdd, ...prev]);

      // Highlight hồ sơ vừa tạo
      if (appToAdd?.id) {
        setHighlightedAppId(appToAdd.id);
        setActiveTab('applications');
        setTimeout(() => {
          document.getElementById(`app-row-${appToAdd.id}`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
        setTimeout(() => setHighlightedAppId(null), 4000);
      }
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
      const { error } = await supabase.from('users').update(mapUserToSnakeCase(editUser)).eq('id', editUser.id);
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
    const pttProcessing = dashboardApps.filter(a => 
      a.currentStep === 'S1_ChuanBi' || 
      a.currentStep === 'GD1_ChuanBi' ||
      a.currentStep === 'GD1_Cho_KT_TiepNhan' ||
      a.currentStep === 'S2_KT_Tiep_Nhan'
    ).length;
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
    // Chờ in/ký GCN -> CHỜ BÀN GIAO: 
    const ptdaGcnWaiting = apps.filter(a => a.status === 'WaitingHandover' || a.currentStep === 'GD5_Cho_PTT_TiepNhan_BG').length;
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
        const avgDaysRaw = appsInDept.length > 0 
            ? appsInDept.reduce((acc, curr) => acc + (calculateDaysDiff(curr.receivedDate) || 0), 0) / appsInDept.length
            : 0;
        const avgDays = isNaN(avgDaysRaw) ? 0 : avgDaysRaw;
            
        return {
            dept,
            label: dept === 'PTT' ? 'Thủ tục' : dept === 'KT' ? 'Kế toán' : 'PTDA',
            avgDays: Math.round(avgDays) || 0,
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
            icon: HistoryIcon,
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

    const selfServiceApps = dashboardApps.filter(a => a.isSelfService);
    const selfServiceStatusStats = [
      { name: 'Chuẩn bị', value: selfServiceApps.filter(a => a.status === 'Processing').length, color: '#94a3b8' },
      { name: 'Chờ nộp VPĐK', value: selfServiceApps.filter(a => a.status === 'WaitingVPDK').length, color: '#f59e0b' },
      { name: 'Đã nộp VPĐK', value: selfServiceApps.filter(a => a.status === 'Submitted').length, color: '#3b82f6' },
      { name: 'Chờ TB Thuế', value: selfServiceApps.filter(a => a.status === 'TaxPending').length, color: '#f97316' },
      { name: 'Đã nộp thuế', value: selfServiceApps.filter(a => a.status === 'TaxPaid' || a.status === 'TaxCompleted').length, color: '#10b981' },
      { name: 'Đã có GCN', value: selfServiceApps.filter(a => a.status === 'GCN_Issued' || a.status === 'WaitingHandover').length, color: '#06b6d4' },
      { name: 'Hoàn tất', value: selfServiceApps.filter(a => a.status === 'Completed').length, color: '#22c55e' },
      { name: 'Vướng mắc', value: selfServiceApps.filter(a => a.status === 'Error' || a.isRejected || (a.issueType && a.issueType !== 'None')).length, color: '#f43f5e' }
    ].filter(s => s.value > 0);

    const selfServiceRatioStats = [
      { name: 'Khách tự làm', value: selfServiceApps.length, color: '#f59e0b' },
      { name: 'CĐT làm thay', value: (dashboardApps.length - selfServiceApps.length), color: '#3b82f6' }
    ].filter(s => s.value > 0);

    return {
        loanStatusStats,
        loanRatioStats,
        selfServiceStatusStats,
        selfServiceRatioStats,
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
      // Ctrl + A (Select All)
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && activeTab === 'applications') {
        // Only trigger if not typing in an input
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          if (selectedAppIds.length === displayedApps.length) {
            setSelectedAppIds([]);
          } else {
            setSelectedAppIds(displayedApps.map(a => a.id));
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

  const computeChartData = (appsList: Application[]) => {
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

    appsList.forEach(r => {
      // Ưu tiên cao nhất: Diện tự làm sổ
      if (r.isSelfService) {
        const hasHandover = r.customerHandoverDate && r.customerHandoverDate !== '---' && r.customerHandoverDate !== 'None' && String(r.customerHandoverDate).trim() !== '';
        const hasGcn = r.gcnReceivedDate && r.gcnReceivedDate !== '---' && r.gcnReceivedDate !== 'None' && String(r.gcnReceivedDate).trim() !== '';

        // Hoàn tất: có Ngày BG GCN Khách hoặc trạng thái hệ thống ghi nhận là Completed / Hoan_Tat
        if (r.status === 'Completed' || (r.currentStep as string) === 'Hoan_Tat' || hasHandover) {
          stages.COMPLETED.push(r);
        }
        // Đang chờ bàn giao khách (đã có GCN thực tế)
        else if (hasGcn) {
          stages.WAITING_HANDOVER.push(r);
        }
        // Đang chuẩn bị (trống cả ngày nhận GCN và ngày giao khách)
        else {
          stages.PREPARING.push(r);
        }
        return;
      }

      // Ưu tiên 1: Completed luôn thắng
      if (r.status === 'Completed' || r.currentStep === 'Hoan_Tat') {
        stages.COMPLETED.push(r);
      }
      // Ưu tiên 2: WaitingHandover
      else if (r.status === 'WaitingHandover' || [
        'S7_PTDA_Ban_Giao', 'S7_1_PTT_Tiep_Nhan', 
        'S7_2_Ban_Giao_Khach', 'GD5_Cho_PTT_TiepNhan_BG', 
        'GD6_Cho_BG_Khach'
      ].includes(r.currentStep)) {
        stages.WAITING_HANDOVER.push(r);
      }
      // Ưu tiên 3: GCN_Issued
      else if (r.status === 'GCN_Issued' || [
        'S6_Nhan_So_GCN', 'GD5_Cho_Ky_In_GCN', 'GD5_Cho_GCN'
      ].includes(r.currentStep)) {
        stages.GCN_READY.push(r);
      }
      // Ưu tiên 4: TaxCompleted / TaxPaid
      else if (r.status === 'TaxPaid' || r.status === 'TaxCompleted' ||
               r.currentStep === 'S5_1_PTDA_TiepNhan') {
        stages.TAX_PAID.push(r);
      }
      // Ưu tiên 5: AWAITING_FINANCE (CHỜ HOÀN THÀNH NVTC)
      else if (r.status === 'TaxPending' && r.taxNotificationDate) {
        stages.AWAITING_FINANCE.push(r);
      }
      else if ([
        'S5_Tai_Chinh_Khach_Hang', 'GD4_Cho_Nop_NVTC', 
        'GD4_Cho_KT_TiepNhan_LaySo'
      ].includes(r.currentStep)) {
        stages.AWAITING_FINANCE.push(r);
      }
      // Ưu tiên 6: SUBMITTED / TAX_WARNING (phân loại theo SLA)
      else if (r.status === 'Submitted' || r.status === 'TaxPending' ||
               r.submissionDate) {
        if (r.submissionDate && !r.taxNotificationDate) {
          const daysDiff = (today.getTime() - 
            new Date(r.submissionDate).getTime()) / (1000*60*60*24);
          if (daysDiff > submissionSLA)
            stages.TAX_WARNING.push(r);
          else
            stages.SUBMITTED.push(r);
        } else if (r.taxNotificationDate) {
          stages.AWAITING_FINANCE.push(r);
        } else {
          stages.SUBMITTED.push(r);
        }
      }
      // Ưu tiên 7: AWAITING_SUBMISSION (CHỜ NỘP VPĐK / CHỜ KT TIẾP NHẬN)
      else if (
        r.status === 'WaitingVPDK' ||
        (r.currentStep as string) === 'GD2_Cho_Nop_VPDK' ||
        (r.currentStep as string) === 'S2_KT_Ban_giao' ||
        (r.currentStep as string) === 'S2_KT_Tiep_Nhan' ||
        (r.currentStep as string) === 'GD1_Cho_KT_TiepNhan' ||
        (r.accountingHandoverDate && !r.submissionDate)
      ) {
        stages.AWAITING_SUBMISSION.push(r);
      }
      // Mặc định: PREPARING
      else {
        stages.PREPARING.push(r);
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
      createStageItem('CHỜ BÀN GIAO', stages.WAITING_HANDOVER, '#6366f1', 'WaitingHandover'),
      createStageItem('HOÀN TẤT', stages.COMPLETED, '#22c55e', 'Completed')
    ];
  };

  const chartData = useMemo(() => {
    return computeChartData(dashboardApps);
  }, [dashboardApps, slaConfig]);

  const progressChartData = useMemo(() => {
    if (dashboardTab === 'SELF_SERVICE') {
      return computeChartData(dashboardApps.filter(a => a.isSelfService));
    }
    if (dashboardTab === 'LOAN') {
      return computeChartData(dashboardApps.filter(a => a.loanStatus === 'Co_Vay'));
    }
    return chartData;
  }, [dashboardApps, chartData, dashboardTab, slaConfig]);

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
        supabase={supabase}
        currentUser={currentUser}
        onStepTransition={handleStepTransition}
        onUpdateApp={async (updated) => {
          handleSetApplications(prev => prev.map(a => a.id === updated.id ? updated : a));
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
          try {
            await syncRecordToSupabase(updated);
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden z-10 relative bg-transparent">
        {/* First Login Security Warning Banner */}
        {currentUser?.isFirstLogin && (
          <div className={cn(
            "px-6 py-3 flex items-center justify-between text-xs font-semibold select-none z-30 shadow-md",
            theme === 'light'
              ? "bg-amber-50 border-b border-amber-200 text-amber-800"
              : "bg-amber-950/40 border-b border-amber-500/20 text-amber-200"
          )}>
            <div className="flex items-center gap-2">
              <span className="text-sm">⚠️</span>
              <p>
                <span className="font-bold">CẢNH BÁO BẢO MẬT:</span> Đây là lần đầu tiên bạn đăng nhập hệ thống. Để đảm bảo an toàn cho dữ liệu hồ sơ, vui lòng thay đổi mật khẩu mặc định ngay lập tức.
              </p>
            </div>
            <button
              onClick={() => setIsChangePasswordModalOpen(true)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all whitespace-nowrap shrink-0",
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
                  onChange={handleParseTemplate} 
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

              {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
                <button
                  onClick={healExistingRecords}
                  disabled={isImporting || healDone}
                  className={cn(
                    "p-2.5 rounded-full border transition-all shadow-sm group relative",
                    healDone 
                      ? "opacity-40 cursor-not-allowed bg-slate-100 border-slate-200"
                      : theme === 'light' 
                        ? "bg-white border-slate-200 text-slate-400 hover:text-amber-600 hover:border-amber-200" 
                        : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-amber-400 hover:border-amber-500/30",
                    isImporting && "opacity-50 cursor-not-allowed"
                  )}
                  title={healDone ? "Đã đồng bộ xong" : "Đồng bộ lại trạng thái hồ sơ"}
                >
                  {isImporting ? (
                    <span className="w-[18px] h-[18px] border-2 border-amber-500 border-t-transparent rounded-full animate-spin inline-block" />
                  ) : healDone ? (
                    <CheckCircle size={18} />
                  ) : (
                    <RefreshCw size={18} />
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
              <div className="flex items-center">
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
      <DashboardTab
        key="dashboard-tab-view"
        activeTab={activeTab}
        userRole={userRole}
        dashboardApps={dashboardApps}
        applications={applications}
        theme={theme}
        dashboardFilter={dashboardFilter}
        handleDashboardClick={handleDashboardClick}
        stats={stats}
        chartData={chartData}
        monthlySlaData={[]}
        projectPerformance={[]}
        selectedProject={selectedProject}
        kpis={kpis}
        setActiveTab={setActiveTab}
        setFilterStatus={setFilterStatus}
        setDashboardFilter={setDashboardFilter}
        setFilterSLAStatus={setFilterSLAStatus}
        setFilterIssue={setFilterIssue}
        setSearch={setSearch}
        overallPieData={overallPieData}
        overallPieTotal={overallPieTotal}
        roleKpis={roleKpis}
        loanRatioTotal={loanRatioTotal}
        loanPieData={loanPieData}
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
        progressChartData={progressChartData}
        showToast={showToast}
      />
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
        selectedRows={selectedRows}
        setSelectedRows={setSelectedRows}
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
        selectedFlags={selectedFlags}
        setSelectedFlags={setSelectedFlags}
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
        quickFilterRef={quickFilterRef}
        setIsQuickFilterOpen={setIsQuickFilterOpen}
        isQuickFilterOpen={isQuickFilterOpen}
        setDashboardFilter={setDashboardFilter}
        handleBulkStepTransition={handleBulkStepTransition}
      />
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
      <ResourcesTab
        key="resources-tab-view"
        activeTab={activeTab}
        theme={theme}
        userRole={userRole}
        handleDownloadTemplate={handleDownloadTemplate}
        DOC_CHECKLIST_ITEMS={DOC_CHECKLIST_ITEMS}
      />
          </AnimatePresence>
        </div>
      </main>

      <ApplicationDetailModal
        selectedApp={selectedApp}
        editApp={editApp}
        setSelectedApp={setSelectedApp}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
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
      />

      <CreateApplicationModal
        isCreateModalOpen={isCreateModalOpen}
        setIsCreateModalOpen={setIsCreateModalOpen}
        theme={theme}
        newApp={newApp}
        setNewApp={setNewApp}
        formErrors={formErrors}
        visibleProjects={visibleProjects}
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
        dateError={bulkTransitionChronoError}
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
                        <option key="all-projects" value="ALL">Tất cả dự án</option>
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
                        <option key="all-status" value="ALL">Tất cả trạng thái</option>
                        <option value="Processing">ĐANG CHUẨN BỊ</option>
                        <option value="WaitingVPDK">CHỜ NỘP VPĐK</option>
                        <option value="TaxPending">CHỜ HOÀN THÀNH NVTC</option>
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

                <div className="pt-4 border-t border-slate-800/10 grid grid-cols-2 gap-3 mt-auto flex-shrink-0">
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
        </div>
      } />
    </Routes>
  );
}
