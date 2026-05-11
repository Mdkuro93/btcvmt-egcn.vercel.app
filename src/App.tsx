import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, Cell,
  PieChart, Pie, LabelList, Legend, AreaChart, Area
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
  Map,
  User,
  MoreVertical,
  History,
  RotateCcw,
  FileText,
  BookOpen,
  ChevronRight,
  Download,
  Upload,
  LogOut,
  AlertTriangle,
  HelpCircle,
  CreditCard,
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
  ChevronLeft,
  PlusCircle,
  FileBarChart,
  ClipboardList,
  Home,
  Check,
  Settings,
  Users,
  GitMerge,
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
import { motion, AnimatePresence } from 'motion/react';
import { createClient } from '@supabase/supabase-js';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { MOCK_APPLICATIONS, PROJECTS, STEP_CONFIG as INITIAL_STEP_CONFIG, MOCK_USERS, WORKFLOW_1_STEPS, WORKFLOW_2_STEPS, getNextStep, CONST_QUY_TRINH_1, CONST_QUY_TRINH_2 } from './constants';
import { Application, UnitStatus, KPI, Dept, UserProfile, UserPermission, PropertyType, StepName, AppNotification, Project, ApplicationStepHistory, AuditTrailEntry, ScannedFile, IssueType, IssueCategory, IssueSeverity } from './types';

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

const REGION_ORDER = ['Quảng Trị', 'Đà Nẵng', 'Quảng Ngãi', 'Khánh Hòa'];

// Supabase Configuration
const SUPABASE_URL = 'https://eewikwqwtgmrlvyrfgit.supabase.co';
const SUPABASE_KEY = 'sb_publishable_gKFEW2pn_2PAif9UkvMqGA_58E2Gj6z';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);


const mapFromSnakeCase = (item: any): Application => {
  return {
    id: item.id,
    unitCode: item.unit_code,
    projectName: item.project_name,
    workflowType: item.current_step?.startsWith('GD') || item.status?.startsWith('GD') ? 'Quy_trinh_1' : 'Quy_trinh_2',
    customerName: item.customer_name,
    contractSignerType: item.contract_signer_type,
    phoneNumber: item.phone_number,
    propertyType: item.property_type,
    loanStatus: item.loan_status,
    bankCommitmentDeadline: item.bank_commitment_deadline,
    reportUpdateDate: item.report_update_date,
    contractSigningDate: item.contract_signing_date,
    assignorGcnNumber: item.assignor_gcn_number,
    assignorGcnDate: item.assignor_gcn_date,
    isSelfService: item.is_self_service,
    submissionLocation: item.submission_location,
    vpdkCode: item.vpdk_code,
    currentStep: item.current_step || item.status,
    status: (INITIAL_STEP_CONFIG[item.current_step as string] || INITIAL_STEP_CONFIG[item.status as string])?.status || item.status || 'Processing',
    receivedDate: item.received_date,
    taxNotificationDate: item.tax_notification_date,
    taxNotificationReceivedDate: item.tax_notification_received_date,
    taxReceiptDate: item.tax_receipt_date,
    accountingHandoverDate: item.accounting_handover_date,
    submissionDate: item.submission_date,
    gcnReceivedDate: item.gcn_received_date,
    ptdaHandoverDate: item.ptda_handover_date,
    customerHandoverDate: item.customer_handover_date,
    isHandedOver: item.is_handed_over,
    handoverDate: item.handover_date,
    taxNoticeProvisionDate: item.tax_notice_provision_date,
    gcnSignedDate: item.gcn_signed_date,
    issueSource: item.issue_source,
    issueType: item.issue_type,
    issueSeverity: item.issue_severity,
    issueNotes: item.issue_notes,
    estimatedCompletionDate: item.estimated_completion_date,
    rejectionCount: item.rejection_count,
    isRejected: item.is_rejected,
    rejectionReason: item.rejection_reason,
    commitmentDate: item.commitment_date,
    taxPaymentStatus: item.tax_payment_status,
    history: typeof item.history === 'string' ? JSON.parse(item.history) : (item.history || []),
    checklist: typeof item.checklist === 'string' ? JSON.parse(item.checklist) : (item.checklist || {}),
    scannedFiles: typeof (item.scanned_files || item.scannedFiles) === 'string' 
      ? JSON.parse(item.scanned_files || item.scannedFiles) 
      : (item.scanned_files || item.scannedFiles || []),
    auditTrail: typeof (item.audit_trail || item.auditTrail) === 'string' 
      ? JSON.parse(item.audit_trail || item.auditTrail) 
      : (item.audit_trail || item.auditTrail || [])
  };
};

const mapToSnakeCase = (app: Application) => {
  return {
    id: app.id,
    unit_code: app.unitCode,
    project_name: app.projectName,
    customer_name: app.customerName,
    contract_signer_type: app.contractSignerType,
    phone_number: app.phoneNumber,
    property_type: app.propertyType,
    loan_status: app.loanStatus,
    bank_commitment_deadline: app.bankCommitmentDeadline,
    report_update_date: app.reportUpdateDate,
    contract_signing_date: app.contractSigningDate,
    assignor_gcn_number: app.assignorGcnNumber,
    assignor_gcn_date: app.assignorGcnDate,
    is_self_service: app.isSelfService,
    submission_location: app.submissionLocation,
    vpdk_code: app.vpdkCode,
    current_step: app.currentStep,
    status: app.currentStep, // Use step code as status for compatibility
    received_date: app.receivedDate,
    tax_notification_date: app.taxNotificationDate,
    tax_notification_received_date: app.taxNotificationReceivedDate,
    tax_receipt_date: app.taxReceiptDate,
    accounting_handover_date: app.accountingHandoverDate,
    submission_date: app.submissionDate,
    gcn_received_date: app.gcnReceivedDate,
    ptda_handover_date: app.ptdaHandoverDate,
    customer_handover_date: app.customerHandoverDate,
    is_handed_over: app.isHandedOver,
    handover_date: app.handoverDate,
    tax_notice_provision_date: app.taxNoticeProvisionDate,
    gcn_signed_date: app.gcnSignedDate,
    issue_source: app.issueSource,
    issue_type: app.issueType,
    issue_severity: app.issueSeverity,
    issue_notes: app.issueNotes,
    estimated_completion_date: app.estimatedCompletionDate,
    rejection_count: app.rejectionCount,
    is_rejected: app.isRejected,
    rejection_reason: app.rejectionReason,
    commitment_date: app.commitmentDate,
    tax_payment_status: app.taxPaymentStatus,
    history: app.history || [],
    checklist: app.checklist || {},
    scanned_files: app.scannedFiles || [],
    audit_trail: app.auditTrail || [],
    updated_at: new Date().toISOString()
  };
};

const mapUserFromSnakeCase = (item: any): UserProfile => {
  return {
    id: item.id,
    username: item.username,
    password: item.password,
    name: item.name,
    dept: item.dept,
    permission: item.permission,
    assignedProjectIds: item.assigned_project_ids || [],
    email: item.email,
    phoneNumber: item.phone_number,
    status: item.status
  };
};

const mapUserToSnakeCase = (user: UserProfile) => {
  return {
    id: user.id,
    username: user.username,
    password: user.password,
    name: user.name,
    dept: user.dept,
    permission: user.permission,
    assigned_project_ids: user.assignedProjectIds,
    email: user.email,
    phone_number: user.phoneNumber,
    status: user.status
  };
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
  const { error } = await supabase.from('records').upsert(snakeData);
  if (error) throw error;
  return true;
};

const formatDate = (val: string | Date | undefined) => {
    if (!val) return '---';
    // If it's already in dd/mm/yyyy format, return it
    if (typeof val === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(val)) return val;
    
    const date = new Date(val);
    if (isNaN(date.getTime())) {
      // If it's a string that doesn't look like ISO but might be something else
      return String(val);
    }
    
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

const formatExcelDate = (val: string | Date | undefined) => {
  if (!val) return '';
  const formatted = formatDate(val);
  return formatted === '---' ? '' : formatted;
};

const parseExcelDate = (val: any): string => {
  if (!val) return '';
  
  // Excel serial dates
  if (typeof val === 'number') {
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  }

  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed || trimmed === '---') return '';

    // Standardize delimiters to /
    const standardized = trimmed.replace(/[\.-]/g, '/');

    // Match dd/mm/yyyy
    const ddmm_yyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = standardized.match(ddmm_yyyy);
    if (match) {
      const d = match[1].padStart(2, '0');
      const m = match[2].padStart(2, '0');
      const y = match[3];
      return `${y}-${m}-${d}`;
    }

    // Match yyyy/mm/dd
    const yyyymm_dd = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/;
    const matchY = standardized.match(yyyymm_dd);
    if (matchY) {
      const y = matchY[1];
      const m = matchY[2].padStart(2, '0');
      const d = matchY[3].padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    // Attempt native date parse if it looks like ISO
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  }

  // Last resort
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return '';
};

const LoginScreen = ({ onLogin, theme, onThemeToggle }: { onLogin: (user: UserProfile) => void, theme: 'light' | 'dark', onThemeToggle: () => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      alert('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
      return;
    }
    
    setIsLoading(true);
    console.log('Attempting login for:', username);
    
    try {
      // 1. Prioritize db check
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`username.eq.${username},email.eq.${username}`)
        .eq('password', password)
        .maybeSingle();

      if (error) {
        console.warn('Database error or table missing, falling back to local users:', error);
      }

      if (data) {
        console.log('Login successful via DB');
        onLogin(mapUserFromSnakeCase(data));
        return;
      }

      // 2. Hardcoded Fallbacks (MOCK_USERS + specific hardcoded overrides)
      const mockUser = MOCK_USERS.find(u => (u.username === username || u.email === username) && (u.password === password || password === '123456'));
      
      if (username === 'admin' && password === '123456') {
        console.log('Using hardcoded admin fallback');
        const defaultAdmin: UserProfile = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          username: 'admin',
          password: '123456',
          name: 'Hệ thống Admin',
          dept: 'ADMIN', // Highest level permission
          permission: 'FULL',
          assignedProjectIds: PROJECTS.map(p => p.id),
          email: 'admin@sunshine.vn',
          status: 'Active'
        };
        onLogin(defaultAdmin);
        return;
      }

      if (mockUser) {
        console.log('Using mock user fallback');
        onLogin(mockUser);
        return;
      }

      alert('Tên đăng nhập hoặc mật khẩu không chính xác!');
    } catch (err) {
      console.error('System login error:', err);
      alert('Đã xảy ra lỗi hệ thống khi đăng nhập!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn(
      "flex items-center justify-center min-h-screen px-4 relative overflow-hidden font-sans transition-colors duration-500",
      theme === 'dark' ? "bg-slate-950" : "bg-slate-50"
    )}>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-rose-500/5 pointer-events-none"></div>
      
      {/* Theme Toggle in Login */}
      <div className="absolute top-8 right-8">
        <button 
          onClick={onThemeToggle}
          className={cn(
            "p-3 rounded-2xl transition-all shadow-xl backdrop-blur-md border",
            theme === 'dark' ? "bg-slate-900/50 border-slate-700 text-festive-gold" : "bg-white/50 border-slate-200 text-amber-500"
          )}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "w-full max-w-md p-8 rounded-[2.5rem] backdrop-blur-2xl border shadow-2xl z-10",
          theme === 'dark' ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
        )}
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-festive-gold rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-festive-gold/20 mb-4 animate-pulse">
            <Building2 className="text-slate-950" size={32} />
          </div>
          <h1 className={cn("text-2xl font-black font-serif italic tracking-tight", theme === 'dark' ? "text-white" : "text-slate-900")}>GCN Tracker Login</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Hệ thống quản lý tình trạng cấp GCN QSDĐ VMT</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Tên đăng nhập / Email</label>
            <input 
              type="text" 
              placeholder="VD: admin"
              className={cn(
                "w-full rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-festive-gold/20 transition-all text-sm border",
                theme === 'dark' ? "bg-slate-950 border-slate-800 text-white placeholder:text-slate-700" : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-300"
              )}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Mật khẩu</label>
            <input 
              type="password" 
              placeholder="••••••••"
              className={cn(
                "w-full rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-festive-gold/20 transition-all text-sm border",
                theme === 'dark' ? "bg-slate-950 border-slate-800 text-white placeholder:text-slate-700" : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-300"
              )}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit"
            className="w-full bg-festive-gold text-slate-950 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-festive-gold/20 hover:scale-[1.02] active:scale-95 transition-all mt-4"
          >
            Đăng nhập
          </button>
        </form>
      </motion.div>
    </div>
  );
};

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Sub-components
const StatCard = ({ title, value, icon: Icon, colorClass, delay, theme = 'dark', onClick }: { title: string, value: number | string, icon: any, colorClass: string, delay: number, theme?: 'light' | 'dark', onClick?: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    onClick={onClick}
    className={cn(
      "p-6 rounded-[2.5rem] border flex flex-col gap-4 relative overflow-hidden transition-all group",
      onClick ? "cursor-pointer hover:scale-[1.02] active:scale-95" : "",
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
      <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] mb-1", theme === 'dark' ? "text-slate-500" : "text-slate-600")}>{title}</p>
      <div className="flex items-center justify-between">
        <p className={cn("text-3xl font-black font-serif italic tracking-tighter", theme === 'dark' ? "text-white" : "text-slate-900")}>{value}</p>
        {onClick && <ArrowRight size={16} className={cn("transition-all", theme === 'dark' ? "text-slate-500 group-hover:text-festive-gold" : "text-slate-400 group-hover:text-festive-gold")} />}
      </div>
    </div>
  </motion.div>
);

const StatusBadge = ({ status, app }: { status: UnitStatus | string; app?: Application }) => {
  let effectiveStatus: string = status;
  if (app) {
    if (app.currentStep === 'S3_Nop_VPDK') {
      effectiveStatus = (app.vpdkCode && app.submissionLocation && app.submissionDate) ? 'Submitted' : 'WaitingVPDK';
    } else if (app.currentStep === 'S5_Tai_Chinh_Khach_Hang') {
      effectiveStatus = app.taxReceiptDate ? 'TaxCompleted_Dynamic' : 'TaxPaymentPending_Dynamic';
    } else if (['S6_Nhan_So_GCN', 'S7_Ban_Giao_Luu_Kho'].includes(app.currentStep)) {
      effectiveStatus = app.gcnSignedDate ? 'GCN_Issued' : 'GCN_SignPending_Dynamic';
    }
  }

  const configs: Record<string, { label: string, classes: string }> = {
    Processing: { label: 'Đang chuẩn bị', classes: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' },
    WaitingVPDK: { label: 'Chờ nộp VPĐK', classes: 'bg-amber-500/10 text-amber-500 border border-amber-500/20' },
    Submitted: { label: 'Đã nộp VPĐK', classes: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' },
    TaxPending: { label: 'Chờ thông báo thuế', classes: 'bg-rose-500/10 text-rose-500 border border-rose-500/20' },
    TaxPaymentPending_Dynamic: { label: 'Chờ nộp thuế', classes: 'bg-rose-500/10 text-rose-500 border border-rose-500/20' },
    TaxCompleted: { label: 'Đã hoàn thành NVTC', classes: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' },
    TaxCompleted_Dynamic: { label: 'Đã nộp thuế', classes: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' },
    GCN_SignPending_Dynamic: { label: 'Chờ ký/in GCN', classes: 'bg-sky-500/10 text-sky-400 border border-sky-500/20' },
    GCN_Issued: { label: 'Đã ra GCN', classes: 'bg-sky-500/20 text-sky-500 border border-sky-500/30' },
    Completed: { label: 'Hoàn tất', classes: 'bg-success text-white font-bold shadow-lg shadow-success/20' },
    Error: { label: 'Sai sót/Vướng', classes: 'bg-error text-white font-bold animate-pulse' },
    Draft: { label: 'Nháp', classes: 'bg-slate-800 text-slate-400 border border-slate-700' },
  };

  const config = configs[effectiveStatus] || configs.Processing;
  return (
    <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", config.classes)}>
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
        "text-[10px] font-black uppercase mb-1.5 tracking-[0.15em] transition-colors leading-tight",
        active ? "text-emerald-400" : theme === 'dark' ? "text-slate-500" : "text-slate-500"
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
                  options.map(opt => <option key={opt} value={opt}>{opt}</option>)
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

const SettingsView = ({ 
  slaConfig, 
  setSlaConfig, 
  checklistTemplates, 
  setChecklistTemplates,
  stepConfig,
  setStepConfig,
  handoverTemplate,
  setHandoverTemplate,
  theme,
  onSaveConfig,
  isLoading,
  storageStats,
  isFetchingStorage,
  onRefreshStorage,
  onClearNotifications,
  onCleanupJunkFiles
}: { 
  slaConfig: Record<string, number>, 
  setSlaConfig: any, 
  checklistTemplates: string[], 
  setChecklistTemplates: any,
  stepConfig: any,
  setStepConfig: any,
  handoverTemplate: any,
  setHandoverTemplate: any,
  theme: 'light' | 'dark',
  onSaveConfig: (key: string, value: any) => Promise<void>,
  isLoading: boolean,
  storageStats: { totalSize: number, fileCount: number, folders: string[], dbSize: number },
  isFetchingStorage: boolean,
  onRefreshStorage: () => void,
  onClearNotifications: () => void,
  onCleanupJunkFiles: () => void
}) => {
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [workflowTab, setWorkflowTab] = useState<'GD' | 'S'>('S');
  const [showDisabledSteps, setShowDisabledSteps] = useState(false);
  const [workflowSequences, setWorkflowSequences] = useState<{ GD: string[], S: string[] }>({
    GD: CONST_QUY_TRINH_1,
    S: CONST_QUY_TRINH_2
  });

  const checkLogic = () => {
    const activeSteps = Object.entries(stepConfig)
      .filter(([key, config]: [string, any]) => config.active && (workflowTab === 'GD' ? key.startsWith('GD') : key.startsWith('S')))
      .sort(([a], [b]) => a.localeCompare(b));

    if (activeSteps.length < 2) {
      alert(`Quy trình ${workflowTab === 'GD' ? 'GCN' : 'Dự án mới'} quá ngắn hoặc chưa kích hoạt đủ bước.`);
      return;
    }

    // Basic continuity check based on numeric sequence in keys if possible
    let issues = [];
    activeSteps.forEach(([key], idx) => {
      if (idx > 0) {
        const prevNum = parseInt(activeSteps[idx-1][0].replace(/\D/g, '')) || 0;
        const currNum = parseInt(key.replace(/\D/g, '')) || 0;
        if (currNum < prevNum) {
          issues.push(`Thứ tự bước có thể không logic: ${activeSteps[idx-1][0]} đứng trước ${key}`);
        }
      }
    });

    if (issues.length > 0) {
      alert("Phát hiện các điểm cần lưu ý:\n- " + issues.join("\n- "));
    } else {
      alert(`Quy trình ${workflowTab === 'GD' ? 'GCN' : 'Dự án mới'} hợp lệ và tuân thủ luồng nghiệp vụ.`);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const storagePercentage = Math.min((storageStats.totalSize / (1024 * 1024 * 1024)) * 100, 100); // Assume 1GB limit for display logic

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      <header className="flex justify-between items-end">
        <div>
           <h2 className={cn("text-3xl font-black italic font-serif tracking-tight", theme === 'light' ? "text-slate-900" : "text-white")}>Cấu hình hệ thống</h2>
           <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Quản lý SLA, Checklist & Quy trình</p>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-widest animate-pulse">
            <RefreshCcw size={14} className="animate-spin" />
            Đang tải cấu hình...
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* SLA Config */}
        <section className={cn(
          "backdrop-blur-xl border rounded-[2.5rem] overflow-hidden group",
          theme === 'light' ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/40 border-slate-800"
        )}>
          <div className={cn(
            "p-8 border-b flex items-center justify-between",
            theme === 'light' ? "bg-slate-50/50 border-slate-100" : "bg-slate-900/50 border-slate-800"
          )}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <Clock className="text-amber-500" size={20} />
              </div>
              <h3 className={cn("text-base font-black uppercase tracking-tight", theme === 'light' ? "text-slate-900" : "text-white")}>Cấu hình SLA (Ngày)</h3>
            </div>
            <button 
              onClick={() => onSaveConfig('slaConfig', slaConfig)}
              className="px-4 py-2 bg-amber-600/10 text-amber-500 hover:bg-amber-600/20 border border-amber-600/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Lưu SLA
            </button>
          </div>
          <div className="p-8 space-y-4">
            {Object.entries(slaConfig).map(([step, days]) => (
              <div key={step} className={cn(
                "flex items-center justify-between p-4 rounded-2xl border group/item hover:border-amber-500/30 transition-all",
                theme === 'light' ? "bg-white border-slate-100 shadow-sm" : "bg-slate-950 border-slate-800"
              )}>
                <span className={cn("text-sm font-bold", theme === 'light' ? "text-slate-700" : "text-slate-300")}>{step}</span>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" 
                    value={days}
                    onChange={(e) => setSlaConfig({...slaConfig, [step]: parseInt(e.target.value) || 0})}
                    className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-center text-sm font-black text-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                  />
                  <span className="text-[10px] font-black text-slate-500 uppercase">Ngày</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Checklist Config */}
        <section className={cn(
          "backdrop-blur-xl border rounded-[2.5rem] overflow-hidden group",
          theme === 'light' ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/40 border-slate-800"
        )}>
          <div className={cn(
            "p-8 border-b flex items-center justify-between",
            theme === 'light' ? "bg-slate-50/50 border-slate-100" : "bg-slate-900/50 border-slate-800"
          )}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <ClipboardList className="text-emerald-500" size={20} />
              </div>
              <h3 className={cn("text-base font-black uppercase tracking-tight", theme === 'light' ? "text-slate-900" : "text-white")}>Danh mục Hồ sơ</h3>
            </div>
            <button 
              onClick={() => onSaveConfig('checklistTemplates', checklistTemplates)}
              className="px-4 py-2 bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600/20 border border-emerald-600/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Lưu Checklist
            </button>
          </div>
          <div className="p-8 space-y-6">
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Thêm hạng mục mới..."
                className={cn(
                  "flex-1 border rounded-2xl px-4 py-3 text-sm focus:ring-2 outline-none transition-all",
                  theme === 'light' ? "bg-white border-slate-200 text-slate-900 focus:ring-emerald-500/20" : "bg-slate-950 border-slate-800 text-slate-300 focus:ring-emerald-500/20"
                )}
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
              />
              <button 
                onClick={() => {
                  if (newChecklistItem.trim()) {
                    setChecklistTemplates([...checklistTemplates, newChecklistItem.trim()]);
                    setNewChecklistItem('');
                  }
                }}
                className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="space-y-2 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
              {checklistTemplates.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800 group/list">
                  <span className="text-xs text-slate-400 font-medium">{item}</span>
                  <button 
                    onClick={() => setChecklistTemplates(checklistTemplates.filter((_, i) => i !== idx))}
                    className="opacity-0 group-hover/list:opacity-100 p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Handover Template Config */}
        <section className={cn(
          "backdrop-blur-xl border rounded-[2.5rem] overflow-hidden group lg:col-span-2",
          theme === 'light' ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/40 border-slate-800"
        )}>
          <div className={cn(
            "p-8 border-b flex items-center justify-between",
            theme === 'light' ? "bg-slate-50/50 border-slate-100" : "bg-slate-900/50 border-slate-800"
          )}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <Printer className="text-indigo-500" size={20} />
              </div>
              <h3 className={cn("text-base font-black uppercase tracking-tight", theme === 'light' ? "text-slate-900" : "text-white")}>Cấu hình Mẫu Biên bản bàn giao</h3>
            </div>
            <button 
              onClick={() => onSaveConfig('handoverTemplate', handoverTemplate)}
              className="px-4 py-2 bg-indigo-600/10 text-indigo-500 hover:bg-indigo-600/20 border border-indigo-600/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Lưu Mẫu Biên bản
            </button>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Tên Công ty / Đơn vị</label>
                <input 
                  type="text" 
                  value={handoverTemplate.companyName}
                  onChange={(e) => setHandoverTemplate({...handoverTemplate, companyName: e.target.value})}
                  className={cn(
                    "w-full px-5 py-4 rounded-2xl border text-sm font-bold focus:outline-none focus:ring-2 transition-all shadow-sm",
                    theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-900 focus:ring-indigo-500/10 focus:border-indigo-500" : "bg-slate-950 border-slate-800 text-white focus:ring-indigo-500/10 focus:border-indigo-500"
                  )}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Tiêu đề phụ (Dự án/Địa điểm)</label>
                <input 
                  type="text" 
                  value={handoverTemplate.subTitle}
                  onChange={(e) => setHandoverTemplate({...handoverTemplate, subTitle: e.target.value})}
                  className={cn(
                    "w-full px-5 py-4 rounded-2xl border text-sm font-bold focus:outline-none focus:ring-2 transition-all shadow-sm",
                    theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-900 focus:ring-indigo-500/10 focus:border-indigo-500" : "bg-slate-950 border-slate-800 text-white focus:ring-indigo-500/10 focus:border-indigo-500"
                  )}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Mã hiệu văn bản</label>
                <input 
                  type="text" 
                  value={handoverTemplate.docCode}
                  onChange={(e) => setHandoverTemplate({...handoverTemplate, docCode: e.target.value})}
                  className={cn(
                    "w-full px-5 py-4 rounded-2xl border text-sm font-bold focus:outline-none focus:ring-2 transition-all shadow-sm",
                    theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-900 focus:ring-indigo-500/10 focus:border-indigo-500" : "bg-slate-950 border-slate-800 text-white focus:ring-indigo-500/10 focus:border-indigo-500"
                  )}
                />
              </div>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Tiêu đề chính của biên bản</label>
                <input 
                  type="text" 
                  value={handoverTemplate.title}
                  onChange={(e) => setHandoverTemplate({...handoverTemplate, title: e.target.value})}
                  className={cn(
                    "w-full px-5 py-4 rounded-2xl border text-sm font-bold focus:outline-none focus:ring-2 transition-all shadow-sm",
                    theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-900 focus:ring-indigo-500/10 focus:border-indigo-500" : "bg-slate-950 border-slate-800 text-white focus:ring-indigo-500/10 focus:border-indigo-500"
                  )}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Tiêu đề phụ 2 (Nội dung bàn giao)</label>
                <input 
                  type="text" 
                  value={handoverTemplate.subTitle2}
                  onChange={(e) => setHandoverTemplate({...handoverTemplate, subTitle2: e.target.value})}
                  className={cn(
                    "w-full px-5 py-4 rounded-2xl border text-sm font-bold focus:outline-none focus:ring-2 transition-all shadow-sm",
                    theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-900 focus:ring-indigo-500/10 focus:border-indigo-500" : "bg-slate-950 border-slate-800 text-white focus:ring-indigo-500/10 focus:border-indigo-500"
                  )}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Địa chỉ thực hiện bàn giao</label>
                <input 
                  type="text" 
                  value={handoverTemplate.address}
                  onChange={(e) => setHandoverTemplate({...handoverTemplate, address: e.target.value})}
                  className={cn(
                    "w-full px-5 py-4 rounded-2xl border text-sm font-bold focus:outline-none focus:ring-2 transition-all shadow-sm",
                    theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-900 focus:ring-indigo-500/10 focus:border-indigo-500" : "bg-slate-950 border-slate-800 text-white focus:ring-indigo-500/10 focus:border-indigo-500"
                  )}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Ghi chú chân trang 1</label>
                <input 
                  type="text" 
                  value={handoverTemplate.footerNote1}
                  onChange={(e) => setHandoverTemplate({...handoverTemplate, footerNote1: e.target.value})}
                  className={cn(
                    "w-full px-5 py-4 rounded-2xl border text-sm font-bold focus:outline-none focus:ring-2 transition-all shadow-sm",
                    theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-900 focus:ring-indigo-500/10 focus:border-indigo-500" : "bg-slate-950 border-slate-800 text-white focus:ring-indigo-500/10 focus:border-indigo-500"
                  )}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Ghi chú chân trang 2</label>
                <input 
                  type="text" 
                  value={handoverTemplate.footerNote2}
                  onChange={(e) => setHandoverTemplate({...handoverTemplate, footerNote2: e.target.value})}
                  className={cn(
                    "w-full px-5 py-4 rounded-2xl border text-sm font-bold focus:outline-none focus:ring-2 transition-all shadow-sm",
                    theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-900 focus:ring-indigo-500/10 focus:border-indigo-500" : "bg-slate-950 border-slate-800 text-white focus:ring-indigo-500/10 focus:border-indigo-500"
                  )}
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Storage Management Section */}
      <section className={cn(
        "bg-slate-900/40 backdrop-blur-xl border rounded-[2.5rem] overflow-hidden group",
        theme === 'light' ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/40 border-slate-800"
      )}>
        <div className={cn(
          "p-8 border-b flex items-center justify-between",
          theme === 'light' ? "bg-slate-50/50 border-slate-100" : "bg-slate-900/50 border-slate-800"
        )}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
              <FolderArchive className="text-orange-500" size={20} />
            </div>
            <h3 className={cn("text-base font-black uppercase tracking-tight", theme === 'light' ? "text-slate-900" : "text-white")}>Quản lý dung lượng Storage</h3>
          </div>
          <button 
            onClick={onRefreshStorage}
            disabled={isFetchingStorage}
            className={cn(
              "p-2 rounded-xl transition-all",
              theme === 'light' ? "hover:bg-slate-100" : "hover:bg-slate-800",
              isFetchingStorage && "animate-spin"
            )}
          >
            <RefreshCcw size={18} className={theme === 'light' ? "text-slate-600" : "text-slate-400"} />
          </button>
        </div>
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className={cn(
              "p-6 rounded-3xl border",
              theme === 'light' ? "bg-slate-50 border-slate-100" : "bg-slate-950 border-slate-800"
            )}>
              <div className="flex items-center gap-2 mb-2">
                <Database className="text-indigo-500" size={14} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Dung lượng Database</p>
              </div>
              <p className="text-2xl font-black text-indigo-500 font-mono tracking-tighter">
                {formatSize(storageStats.dbSize)}
              </p>
              <div className="mt-2 flex items-center gap-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                 <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Dữ liệu từ Supabase</span>
              </div>
            </div>
            
            <div className={cn(
              "p-6 rounded-3xl border",
              theme === 'light' ? "bg-slate-50 border-slate-100" : "bg-slate-950 border-slate-800"
            )}>
              <div className="flex items-center gap-2 mb-2">
                <FolderArchive className="text-orange-500" size={14} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Dung lượng Storage</p>
              </div>
              <p className="text-2xl font-black text-orange-500 font-mono tracking-tighter">
                {formatSize(storageStats.totalSize)}
              </p>
            </div>
            <div className={cn(
              "p-6 rounded-3xl border",
              theme === 'light' ? "bg-slate-50 border-slate-100" : "bg-slate-950 border-slate-800"
            )}>
              <div className="flex items-center gap-2 mb-2">
                <Files className="text-orange-500" size={14} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Số lượng tài liệu</p>
              </div>
              <p className="text-2xl font-black text-orange-500 font-mono tracking-tighter">
                {storageStats.fileCount} <span className="text-xs uppercase">Files</span>
              </p>
            </div>
            <div className={cn(
              "p-6 rounded-3xl border",
              theme === 'light' ? "bg-slate-50 border-slate-100" : "bg-slate-950 border-slate-800"
            )}>
              <div className="flex items-center gap-2 mb-2">
                <Layers className="text-orange-500" size={14} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Số thư mục dự án</p>
              </div>
              <p className="text-2xl font-black text-orange-500 font-mono tracking-tighter">
                {storageStats.folders.length} <span className="text-xs uppercase">Folders</span>
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Mức độ sử dụng (Ước tính)</span>
              <span className="text-xs font-black text-orange-400">{storagePercentage.toFixed(1)}% / 1GB (Spark Plan)</span>
            </div>
            <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${storagePercentage}%` }}
                className="h-full bg-linear-to-r from-orange-600 to-amber-400"
              />
            </div>
            <div className="flex gap-2 items-center text-[10px] text-slate-500 italic">
              <Info size={12} />
              <span>Lưu ý: Supabase Spark Plan cung cấp 1GB dung lượng Storage miễn phí.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Configuration */}
      <section className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] overflow-hidden group">
        <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <GitMerge className="text-indigo-500" size={20} />
            </div>
            <div>
               <h3 className="text-base font-black text-white uppercase tracking-tight">Cấu hình Quy trình Xử lý (Workflow)</h3>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Quản lý các bước thực hiện & SLA</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <button 
               onClick={checkLogic}
               className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
             >
               <ShieldCheck size={14} />
               Kiểm tra tính logic
             </button>
             <Settings className="text-slate-700 animate-spin-slow" size={20} />
          </div>
        </div>
        
        <div className="p-8">
           {/* Tabs */}
           <div className="flex gap-2 p-1 bg-slate-950/50 border border-slate-800 rounded-2xl mb-8 w-fit">
              <button 
                onClick={() => setWorkflowTab('GD')}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  workflowTab === 'GD' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-500 hover:text-slate-300"
                )}
              >
                Quy trình Hỗ trợ (GD_)
              </button>
              <button 
                onClick={() => setWorkflowTab('S')}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  workflowTab === 'S' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-500 hover:text-slate-300"
                )}
              >
                Quy trình Thông thường (S_)
              </button>
           </div>

          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest pl-4">Mã bước</th>
                  <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Tên hiển thị</th>
                  <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Phòng ban</th>
                  <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Trạng thái gắn kèm</th>
                  <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">SLA (Ngày)</th>
                  <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest pr-4">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {workflowSequences[workflowTab].map((key, index) => {
                  const config = (stepConfig as any)[key];
                  if (!config) return null;
                  
                  const handleMove = (index: number, direction: 'up' | 'down') => {
                    const newSequence = [...workflowSequences[workflowTab]];
                    const newIndex = direction === 'up' ? index - 1 : index + 1;
                    if (newIndex < 0 || newIndex >= newSequence.length) return;
                    [newSequence[index], newSequence[newIndex]] = [newSequence[newIndex], newSequence[index]];
                    setWorkflowSequences({...workflowSequences, [workflowTab]: newSequence});
                  };
                  
                  const handleRemove = (index: number) => {
                    if (confirm('Bạn có chắc muốn xóa bước này?')) {
                      const newSequence = workflowSequences[workflowTab].filter((_, i) => i !== index);
                      setWorkflowSequences({...workflowSequences, [workflowTab]: newSequence});
                    }
                  };
                  
                  return (
                    <tr key={`${workflowTab}-${key}`} className={cn(
                    "group/row hover:bg-slate-800/10 transition-colors",
                    !config.active && "opacity-40 grayscale"
                  )}>
                    <td className="py-4 pl-4 text-[10px] font-mono text-slate-500 flex items-center gap-2">
                       {key}
                       <div className="flex flex-col">
                          <button onClick={() => handleMove(index, 'up')} className="hover:text-indigo-400" disabled={index === 0}><ChevronUp size={10} /></button>
                          <button onClick={() => handleMove(index, 'down')} className="hover:text-indigo-400" disabled={index === workflowSequences[workflowTab].length - 1}><ChevronDown size={10} /></button>
                       </div>
                    </td>
                    <td className="py-4">
                      <input 
                        type="text" 
                        value={config.label}
                        onChange={(e) => setStepConfig({...stepConfig, [key]: {...config, label: e.target.value}})}
                        className="bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-indigo-500/50 outline-none w-full max-w-[180px] font-bold"
                      />
                    </td>
                    <td className="py-4">
                      <select 
                        value={config.dept}
                        onChange={(e) => setStepConfig({...stepConfig, [key]: {...config, dept: e.target.value}})}
                        className="bg-slate-950/50 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] font-black uppercase text-indigo-400 outline-none"
                      >
                        <option value="PTT">PTT</option>
                        <option value="KT">KT</option>
                        <option value="PTDA">PTDA</option>
                        <option value="MANAGER">MANAGER</option>
                        <option value="DIRECTOR">DIRECTOR</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td className="py-4">
                      <select 
                        value={config.status}
                        onChange={(e) => setStepConfig({...stepConfig, [key]: {...config, status: e.target.value}})}
                        className="bg-slate-950/50 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] font-black uppercase text-slate-400 outline-none"
                      >
                        <option value="Processing">Đang xử lý</option>
                        <option value="Submitted">Đã nộp hồ sơ</option>
                        <option value="TaxPending">Chờ TB Thuế</option>
                        <option value="TaxCompleted">Đã nộp thuế</option>
                        <option value="GCN_Issued">Đã có GCN</option>
                        <option value="Completed">Hoàn tất</option>
                      </select>
                    </td>
                    <td className="py-4">
                      <input 
                        type="number" 
                        value={config.slaDays || 0}
                        onChange={(e) => setStepConfig({...stepConfig, [key]: {...config, slaDays: parseInt(e.target.value) || 0}})}
                        className="w-16 bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-1.5 text-center text-xs font-black text-amber-500 outline-none"
                      />
                    </td>
                    <td className="py-4 pr-4 flex gap-2">
                       <button 
                         onClick={() => setStepConfig({
                           ...stepConfig, 
                           [key]: { ...config, active: !config.active }
                         })}
                         className={cn(
                           "flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                           config.active 
                             ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                             : "bg-slate-800 text-slate-500 border border-slate-700"
                         )}
                       >
                         {config.active ? <Check size={10} /> : <EyeOff size={10} />}
                         {config.active ? "Kích hoạt" : "Vô hiệu"}
                       </button>
                       <button onClick={() => handleRemove(index)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-full"><Trash2 size={12} /></button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-8 p-6 bg-indigo-500/5 rounded-3xl border border-indigo-500/10 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <Info size={18} className="text-indigo-400" />
                <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                  <strong>Chú ý:</strong> Thay đổi quy trình sẽ ảnh hưởng đến việc phân quyền hiển thị hồ sơ cho các phòng ban và cách tính toán KPI trên Dashboard. Hãy kiểm tra kỹ trước khi cập nhật.
                </p>
             </div>
             <button 
               onClick={() => {
                 onSaveConfig('stepConfig', stepConfig);
                 onSaveConfig('workflowSequences', workflowSequences);
               }}
               className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20"
             >
               Lưu quy trình lên Supabase
             </button>
          </div>
        </div>
      </section>

      {/* Maintenance Section */}
      <section className={cn(
        "bg-rose-500/5 backdrop-blur-xl border rounded-[2.5rem] overflow-hidden group border-rose-500/20",
        theme === 'light' ? "bg-rose-50/30 shadow-sm" : ""
      )}>
        <div className={cn(
          "p-8 border-b flex items-center justify-between border-rose-500/10",
          theme === 'light' ? "bg-rose-50/50" : "bg-rose-500/5"
        )}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
              <Trash2 className="text-rose-500" size={20} />
            </div>
            <h3 className={cn("text-base font-black uppercase tracking-tight", theme === 'light' ? "text-slate-900" : "text-white")}>Bảo trì & Dọn dẹp</h3>
          </div>
        </div>
        <div className="p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-3xl border border-rose-500/10 bg-rose-500/5">
            <div>
              <h4 className="text-sm font-black text-rose-500 uppercase tracking-widest mb-1">Dọn dẹp Thông báo hệ thống</h4>
              <p className="text-xs text-slate-500 font-medium">Xóa toàn bộ các thông báo cũ và hiện có trong hệ thống của tất cả người dùng.</p>
            </div>
            <button 
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ thông báo? Hành động này không thể hoàn tác.')) {
                  onClearNotifications();
                }
              }}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-rose-600/20 flex items-center gap-2 whitespace-nowrap active:scale-95"
            >
              <Trash2 size={14} />
              Xóa tất cả thông báo
            </button>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-3xl border border-rose-500/10 bg-rose-500/5">
            <div>
              <h4 className="text-sm font-black text-rose-500 uppercase tracking-widest mb-1">Dọn dẹp File rác</h4>
              <p className="text-xs text-slate-500 font-medium">Xóa các file trong storage không còn gắn với hồ sơ nào.</p>
            </div>
            <button 
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn dọn dẹp file rác? Hành động này không thể hoàn tác.')) {
                  onCleanupJunkFiles();
                }
              }}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-rose-600/20 flex items-center gap-2 whitespace-nowrap active:scale-95"
            >
              <Trash2 size={14} />
              Dọn dẹp file rác
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

const ReportsView = ({ 
  applications, 
  projects, 
  regions, 
  theme,
  setActiveTab,
  setDashboardFilter,
  setFilterLoanStatus,
  stepConfig,
  slaConfig
}: { 
  applications: Application[], 
  projects: Project[], 
  regions: string[], 
  theme: 'light' | 'dark',
  setActiveTab: (tab: any) => void,
  setDashboardFilter: (filter: any) => void,
  setFilterLoanStatus: (filter: any) => void,
  stepConfig: any,
  slaConfig: Record<string, number>
}) => {
  const [reportType, setReportType] = useState<'PROJECT' | 'REGION' | 'LOAN' | 'SLA' | 'PERFORMANCE'>('LOAN');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [selectedLoanProjectIds, setSelectedLoanProjectIds] = useState<string[]>(projects.map(p => p.id));

  // Management Objectives & KPIs mapping
  const reportConfig = {
    PROJECT: {
      title: "Hiệu suất Dự án",
      desc: "Mục tiêu: Đánh giá tiến độ pháp lý và tỷ lệ ra sổ của từng dự án thành viên.",
      kpis: ["Tỷ lệ hoàn thành (Target 100%)", "Hồ sơ vướng (Error Rate)", "Tốc độ xử lý"],
      roles: ["Lãnh đạo", "Trưởng phòng DA"]
    },
    REGION: {
      title: "Báo cáo quản trị theo địa bàn",
      desc: "Mục tiêu: Đánh giá hiệu quả phối hợp với các cơ quan chức năng tại địa phương.",
      kpis: ["Thời gian duyệt Thuế", "Tỷ lệ trả hồ sơ", "Volume hồ sơ theo khu vực"],
      roles: ["Giám đốc Vùng", "Lãnh đạo"]
    },
    LOAN: {
      title: "Tiến độ GCN bổ sung (Cam kết tín dụng)",
      desc: "Mục tiêu: Quản lý tiến độ cấp GCN cho các căn vay bổ sung theo cam kết tín dụng ngân hàng.",
      kpis: ["SLA Cam kết tín dụng", "Tỷ lệ hồ sơ vay đúng hạn", "Dư nợ rủi ro (Risk Score)"],
      roles: ["Phòng Tài chính", "Phòng Vay vốn", "Lãnh đạo"]
    },
    SLA: {
      title: "Phân tích SLA & Điểm nghẽn",
      desc: "Mục tiêu: Phát hiện tắc nghẽn quy trình, tối ưu hóa nguồn lực nhân sự.",
      kpis: ["Avg. TAT theo bước", "Max Delay Step", "Hiệu suất Bộ phận (Dept Efficiency)"],
      roles: ["QL Vận hành", "Trưởng phòng Thủ tục"]
    },
    PERFORMANCE: {
      title: "Quản trị Hiệu suất Chiến lược",
      desc: "Mục tiêu: Đánh giá năng lực xử lý (Workload Capacity) và tốc độ đáp ứng của từng nhân sự.",
      kpis: ["Tổng hồ sơ hoàn tất", "TAT Trung bình (Ngày)", "Biến động hiệu suất"],
      roles: ["MANAGER", "DIRECTOR", "ADMIN"]
    }
  };

  const stats = useMemo(() => {
    if (reportType === 'PROJECT') {
      return projects.map(p => {
        const apps = applications.filter(a => a.projectName === p.name);
        return {
          name: p.name,
          total: apps.length,
          completed: apps.filter(a => a.currentStep === 'Hoan_Tat').length,
          processing: apps.filter(a => a.currentStep !== 'Hoan_Tat').length,
          overdue: apps.filter(a => a.status === 'Error').length,
          efficiency: apps.length > 0 ? (apps.filter(a => a.currentStep === 'Hoan_Tat').length / apps.length) * 100 : 0
        };
      });
    } else if (reportType === 'REGION') {
      return REGION_ORDER.map(reg => {
        const apps = applications.filter(a => {
           const p = projects.find(proj => proj.name === a.projectName);
           return p?.region === reg;
        });
        return {
          name: reg,
          total: apps.length,
          completed: apps.filter(a => a.currentStep === 'Hoan_Tat').length,
          processing: apps.filter(a => a.currentStep !== 'Hoan_Tat').length,
          overdue: apps.filter(a => a.status === 'Error').length
        };
      });
    } else if (reportType === 'SLA') {
      // Dept Bottleneck Stats
      const depts = ['PTT', 'KT', 'PTDA'];
      return depts.map(dept => {
        const appsInDept = applications.filter(a => {
           const sc = stepConfig[a.currentStep];
           return sc?.dept === dept;
        });
        const totalApps = appsInDept.length;
        const delayedApps = appsInDept.filter(a => {
           const overdue = applications.filter(app => app.id === a.id).map(app => {
             const status = Object.keys(stepConfig).filter(s => stepConfig[s as StepName].dept === dept);
             // Simple approximation for bottleneck analysis
             return calculateDaysDiff(app.receivedDate) > 10;
           });
           return overdue[0];
        }).length;

        return {
          name: dept === 'PTT' ? 'Phòng Thủ tục' : dept === 'KT' ? 'Kế toán/Pháp lý' : 'PTDA/In sổ',
          total: totalApps,
          delayed: delayedApps,
          efficiency: totalApps > 0 ? Math.round(((totalApps - delayedApps) / totalApps) * 100) : 100
        };
      });
    } else if (reportType === 'PERFORMANCE') {
       // Mock aggregation from history
       const userStats: Record<string, { name: string, count: number, totalDays: number, completedCount: number }> = {};
       
       applications.forEach(app => {
         app.history.forEach(hist => {
           if (hist.performedBy && hist.performedByName) {
             if (!userStats[hist.performedBy]) {
               userStats[hist.performedBy] = { name: hist.performedByName, count: 0, totalDays: 0, completedCount: 0 };
             }
             userStats[hist.performedBy].count += 1;
             
             // Time calculation logic (simplified for mock data)
             if (hist.completedDate && hist.receivedDate) {
                const diff = calculateDaysBetweenDates(hist.receivedDate, hist.completedDate);
                userStats[hist.performedBy].totalDays += Math.max(0, diff);
             }
             
             if (hist.stepName.includes('Hoàn tất') || hist.stepName.includes('Bàn giao')) {
                userStats[hist.performedBy].completedCount += 1;
             }
           }
         });
       });
       
       return Object.entries(userStats).map(([id, s]) => ({
         name: s.name,
         total: s.count,
         completed: s.completedCount,
         avgTime: s.count > 0 ? parseFloat((s.totalDays / s.count).toFixed(1)) : 0,
         efficiency: s.count > 0 ? Math.round((s.completedCount / s.count) * 100) : 0
       }));
    }
    return [];
  }, [applications, projects, reportType, stepConfig]);

  // SLA Heatmap Data
  const slaStats = useMemo(() => {
    const steps = Object.keys(stepConfig).filter(s => s !== 'Hoan_Tat') as StepName[];
    return steps.map(step => {
      const appsAtStep = applications.filter(a => a.currentStep === step);
      const avgTime = appsAtStep.length > 0 ? (appsAtStep.reduce((acc, curr) => {
        return acc + calculateDaysDiff(curr.receivedDate);
      }, 0) / appsAtStep.length) : 0;
      
      return {
        step: stepConfig[step]?.label.split(':')[0],
        dept: stepConfig[step]?.dept,
        avgDays: parseFloat(avgTime.toFixed(1)),
        slaLimit: 7, // Default mock SLA
        isCritical: avgTime > 10
      };
    });
  }, [applications, stepConfig]);

  const loanApps = useMemo(() => {
    return applications.filter(a => 
      a.loanStatus === 'Co_Vay' && 
      selectedLoanProjectIds.includes(projects.find(p => p.name === a.projectName)?.id || '')
    );
  }, [applications, selectedLoanProjectIds, projects]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
           <div className="flex items-center gap-3 mb-1">
             <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <FileBarChart className="text-indigo-500" size={20} />
             </div>
             <h2 className={cn("text-3xl font-black italic font-serif tracking-tight", theme === 'light' ? "text-slate-900" : "text-white")}>
               Trung tâm Điều hành & Quản trị
             </h2>
           </div>
           <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em]">Hệ thống phân tích báo cáo rủi ro đa chiều</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className={cn(
            "flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 border",
            theme === 'light' ? "bg-white border-slate-200 text-slate-700" : "bg-slate-900 border-slate-800 text-slate-300"
          )}>
            <Download size={14} className="text-indigo-500" /> Export Business Intelligence
          </button>
        </div>
      </header>

      {/* Report Navigation */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(reportConfig) as Array<keyof typeof reportConfig>).map(type => (
          <button
            key={type}
            onClick={() => { setReportType(type); setSelectedItem(null); }}
            className={cn(
              "px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all tracking-[0.15em] border flex items-center gap-2 group",
              reportType === type 
                ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20" 
                : theme === 'light' ? "bg-white border-slate-200 text-slate-500 hover:border-slate-300" : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300"
            )}
          >
            {type === 'LOAN' && <AlertTriangle size={12} className={reportType === type ? "text-white" : "text-rose-500"} />}
            {reportConfig[type].title}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Analysis & Charts */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* Management Info Header */}
          <motion.div 
            key={reportType}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              "p-6 rounded-[2.5rem] border-l-4 border-indigo-500 shadow-xl",
              theme === 'light' ? "bg-white border-y border-r border-slate-200" : "bg-slate-900/60 border-y border-r border-slate-800"
            )}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className={cn("text-base font-black uppercase tracking-tight mb-1", theme === 'light' ? "text-slate-900" : "text-white")}>
                  {reportConfig[reportType].title}
                </h3>
                <p className="text-xs text-slate-500 font-medium italic">{reportConfig[reportType].desc}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Roles:</span>
                <div className="flex gap-1 justify-end">
                  {reportConfig[reportType].roles.map(r => (
                    <span key={r} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 text-[8px] font-black rounded-lg border border-indigo-500/20">{r}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-8 mt-6">
               {reportConfig[reportType].kpis.map((kpi, i) => (
                 <div key={i} className="space-y-1">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">{kpi}</p>
                    <div className="h-1 w-full bg-slate-800 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-indigo-500" style={{ width: `${80 - i * 15}%` }} />
                    </div>
                 </div>
               ))}
            </div>
          </motion.div>

          {/* Main Visualization Area */}
          <div className={cn(
             "rounded-[2.5rem] p-8 border shadow-2xl overflow-hidden relative",
             theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900/40 border-slate-800"
          )}>
            {reportType === 'LOAN' ? (
              <div className="space-y-6 text-left">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className={cn("text-sm font-black uppercase tracking-widest", theme === 'light' ? "text-slate-800" : "text-slate-200")}>Ưu tiên: Theo dõi tiến độ GCN - Hồ sơ Cam kết Tín dụng</h3>
                    <p className="text-[10px] text-slate-500 mt-1">Lọc theo dự án để theo dõi chi tiết điểm nóng.</p>
                  </div>
                  <div className="flex flex-wrap gap-4 items-center">
                    <button 
                      onClick={() => alert('Đang xuất báo cáo chi tiết các căn có vay (Excel)...')}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-900/20"
                    >
                      <Download size={14} /> Xuất BC Có Vay
                    </button>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-rose-500" />
                      <span className="text-[9px] font-black uppercase text-slate-500">{"Rủi ro trễ cam kết (SLA > 10 ngày)"}</span>
                    </div>
                  </div>
                </div>

                {/* Project Selection Multi-select equivalent */}
                <div className={cn(
                  "p-5 rounded-3xl border transition-all",
                  theme === 'light' ? "bg-slate-50 border-slate-200" : "bg-slate-950/20 border-slate-800/50"
                )}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Filter size={14} className="text-indigo-500" />
                      <span className={cn("text-[11px] font-black uppercase tracking-widest", theme === 'light' ? "text-slate-600" : "text-slate-400")}>Lựa chọn Dự án báo cáo:</span>
                    </div>
                    <div className="flex gap-2">
                       <button 
                         onClick={() => setSelectedLoanProjectIds(projects.map(p => p.id))}
                         className="text-[9px] font-black text-indigo-500 hover:underline uppercase tracking-widest"
                       >Chọn tất cả</button>
                       <span className="text-slate-700">|</span>
                       <button 
                         onClick={() => setSelectedLoanProjectIds([])}
                         className="text-[9px] font-black text-rose-500 hover:underline uppercase tracking-widest"
                       >Bỏ chọn</button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {projects.map(p => {
                      const isSelected = selectedLoanProjectIds.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedLoanProjectIds(selectedLoanProjectIds.filter(id => id !== p.id));
                            } else {
                              setSelectedLoanProjectIds([...selectedLoanProjectIds, p.id]);
                            }
                          }}
                          className={cn(
                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border flex items-center gap-2",
                            isSelected
                              ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                              : theme === 'light' ? "bg-white border-slate-200 text-slate-500 hover:border-slate-300" : "bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700"
                          )}
                        >
                          <div className={cn("w-1.5 h-1.5 rounded-full", isSelected ? "bg-white" : "bg-slate-600")} />
                          {p.name}
                        </button>
                      );
                    })}
                  </div>
                  {selectedLoanProjectIds.length === 0 && (
                    <p className="text-[10px] text-rose-500 font-bold mt-3 italic animate-pulse flex items-center gap-2">
                      <AlertTriangle size={12} /> Vui lòng chọn ít nhất một dự án để xem dữ liệu.
                    </p>
                  )}
                </div>

                {/* Progress Summary for Loan Customers */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-slate-950/40 p-6 rounded-3xl border border-slate-800/50 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                      <TrendingUp className="text-indigo-400" size={24} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Tổng căn có vay</p>
                      <p className="text-2xl font-black text-white italic">{loanApps.length}</p>
                    </div>
                  </div>
                  <div className="bg-slate-950/40 p-6 rounded-3xl border border-slate-800/50 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle2 className="text-emerald-400" size={24} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Đã ra sổ / Hoàn tất</p>
                      <p className="text-2xl font-black text-white italic">{loanApps.filter(a => a.status === 'Completed').length}</p>
                    </div>
                  </div>
                  <div className="bg-slate-950/40 p-6 rounded-3xl border border-slate-800/50 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                      <Clock className="text-amber-400" size={24} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Đang xử lý đúng hạn</p>
                      <p className="text-2xl font-black text-white italic">{loanApps.filter(a => a.status !== 'Completed' && !getOverdueInfo(a, stepConfig, slaConfig).isOverdue).length}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <div className={cn(
                     "p-6 rounded-[2rem] border overflow-hidden",
                     theme === 'light' ? "bg-slate-50 border-slate-100" : "bg-slate-950/40 border-slate-800"
                   )}>
                      <h4 className="text-[10px] font-black uppercase text-slate-500 mb-6 tracking-widest text-center">Phân bổ trạng thái Hồ sơ vay</h4>
                      <div className="h-[250px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                               <Pie
                                 data={[
                                   { name: 'Đang xử lý', value: loanApps.filter(a => a.status === 'Processing').length, color: '#6366f1' },
                                   { name: 'Đã nộp HS', value: loanApps.filter(a => a.status === 'Submitted').length, color: '#8b5cf6' },
                                   { name: 'Chờ Thuế', value: loanApps.filter(a => a.status === 'TaxPending').length, color: '#f59e0b' },
                                   { name: 'Hoàn tất', value: loanApps.filter(a => a.status === 'Completed').length, color: '#10b981' },
                                   { name: 'Sai sót', value: loanApps.filter(a => a.status === 'Error').length, color: '#f43f5e' }
                                 ].filter(d => d.value > 0)}
                                 innerRadius={60}
                                 outerRadius={80}
                                 paddingAngle={5}
                                 dataKey="value"
                               >
                                 {( [
                                   { name: 'Đang xử lý', value: loanApps.filter(a => a.status === 'Processing').length, color: '#6366f1' },
                                   { name: 'Đã nộp HS', value: loanApps.filter(a => a.status === 'Submitted').length, color: '#8b5cf6' },
                                   { name: 'Chờ Thuế', value: loanApps.filter(a => a.status === 'TaxPending').length, color: '#f59e0b' },
                                   { name: 'Hoàn tất', value: loanApps.filter(a => a.status === 'Completed').length, color: '#10b981' },
                                   { name: 'Sai sót', value: loanApps.filter(a => a.status === 'Error').length, color: '#f43f5e' }
                                 ].filter(d => d.value > 0)).map((entry: any, index: number) => (
                                   <Cell key={`cell-${index}`} fill={entry.color} />
                                 ))}
                               </Pie>
                               <ReTooltip 
                                 contentStyle={{ backgroundColor: theme === 'light' ? '#fff' : '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px' }}
                                 itemStyle={{ color: '#fff' }}
                               />
                               <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                            </PieChart>
                         </ResponsiveContainer>
                      </div>
                   </div>

                   <div className={cn(
                     "p-6 rounded-[2rem] border overflow-hidden",
                     theme === 'light' ? "bg-slate-50 border-slate-100" : "bg-slate-950/40 border-slate-800"
                   )}>
                      <h4 className="text-[10px] font-black uppercase text-slate-500 mb-6 tracking-widest text-center">Tiến độ hồ sơ vay theo giai đoạn</h4>
                      <div className="h-[250px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                              'S1_ChuanBi', 'S2_KT_Tiep_Nhan', 'S3_Nop_VPDK', 'S4_Cho_Thong_Bao_Thue', 'S5_Tai_Chinh_Khach_Hang', 'Hoan_Tat'
                            ].map(step => ({
                              name: stepConfig[step]?.label.split(':')[0] || step,
                              count: loanApps.filter(a => a.currentStep === step).length
                            }))}>
                               <XAxis dataKey="name" stroke="#94a3b8" fontSize={8} tickLine={false} axisLine={false} />
                               <YAxis stroke="#94a3b8" fontSize={8} tickLine={false} axisLine={false} />
                               <ReTooltip 
                                 cursor={{ fill: 'rgba(99,102,241,0.05)' }}
                                 contentStyle={{ backgroundColor: theme === 'light' ? '#fff' : '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px' }}
                                />
                               <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={20}>
                                 <LabelList dataKey="count" position="top" style={{ fontSize: '10px', fontWeight: 'bold' }} fill="#64748b" />
                               </Bar>
                            </BarChart>
                         </ResponsiveContainer>
                      </div>
                   </div>
                </div>

                <div className="overflow-x-auto rounded-3xl border border-slate-800/50">
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead className={theme === 'light' ? "bg-slate-50 border-b border-slate-100" : "bg-slate-950/50 border-b border-slate-800"}>
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Dự án & Mã căn</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Gói vay</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Tiến độ cấp GCN</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Ngày chậm</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Rủi ro Cam kết</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {loanApps.map(app => {
                        const days = calculateDaysDiff(app.receivedDate);
                        const isHighRisk = days > 10;
                        const isMediumRisk = days > 5 && days <= 10;

                        return (
                          <tr 
                            key={app.id} 
                            className={cn(
                              "transition-all cursor-pointer group",
                              theme === 'light' ? "hover:bg-slate-50" : "hover:bg-slate-800/30"
                            )}
                          >
                            <td className="px-6 py-5">
                               <p className={cn("text-xs font-black", theme === 'light' ? "text-slate-900" : "text-white")}>{app.projectName}</p>
                               <p className={cn("text-[9px] font-mono mt-0.5", theme === 'light' ? "text-slate-600 font-bold" : "text-slate-500")}>{app.unitCode} • {app.customerName}</p>
                            </td>
                            <td className="px-6 py-5">
                               <div className="flex items-center gap-2">
                                 <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-sm" />
                                 <span className="text-xs font-bold text-indigo-400">{app.loanStatus === 'Co_Vay' ? 'Có vay' : 'Không vay'}</span>
                               </div>
                            </td>
                            <td className="px-6 py-5 text-center">
                               <StatusBadge status={app.status} app={app} />
                               <p className="text-[8px] font-black text-slate-500 uppercase mt-1">{stepConfig[app.currentStep]?.label.split(':')[0]}</p>
                            </td>
                            <td className="px-6 py-5 text-center">
                               <span className={cn(
                                 "text-xs font-black p-2 rounded-xl transition-all",
                                 isHighRisk ? "bg-rose-500/10 text-rose-500 shadow-[inset_0_0_10px_rgba(244,63,94,0.1)]" : isMediumRisk ? "bg-amber-500/10 text-amber-500" : theme === 'light' ? "bg-slate-100 text-slate-500" : "bg-slate-900 text-slate-600"
                               )}>
                                 {days} Ngày {isHighRisk && "!!"}
                               </span>
                            </td>
                            <td className="px-6 py-5">
                               <div className="flex items-center justify-center">
                                 {isHighRisk ? (
                                   <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-500 text-white rounded-full text-[9px] font-black uppercase tracking-tighter animate-pulse">
                                     <AlertTriangle size={10} /> Trễ cam kết tín dụng
                                   </div>
                                 ) : isMediumRisk ? (
                                   <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-[9px] font-black uppercase tracking-tighter">
                                     Gần hạn chót
                                   </div>
                                 ) : (
                                   <CheckCircle2 size={16} className="text-emerald-500" />
                                 )}
                               </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : reportType === 'PERFORMANCE' ? (
              <div className="space-y-8 text-left animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className={cn("text-sm font-black uppercase tracking-widest", theme === 'light' ? "text-slate-800" : "text-slate-200")}>Bảng xếp hạng Hiệu suất Cá nhân (Năng lực xử lý)</h3>
                    <p className="text-[10px] text-slate-500 mt-1 italic font-medium">Phân tích cường độ công việc và thời gian đáp ứng (TAT) trung bình.</p>
                  </div>
                  <div className="flex bg-slate-950/20 p-1 rounded-xl border border-slate-800/30">
                     <button className="px-3 py-1.5 text-[9px] font-black uppercase rounded-lg bg-indigo-600 text-white shadow-lg">Tổng hợp</button>
                     <button className="px-3 py-1.5 text-[9px] font-black uppercase rounded-lg text-slate-500 hover:text-slate-300 transition-colors">Theo tháng</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className={cn(
                     "p-6 rounded-[2rem] border overflow-hidden",
                     theme === 'light' ? "bg-slate-50 border-slate-100" : "bg-slate-950/40 border-slate-800"
                   )}>
                      <h4 className="text-[10px] font-black uppercase text-slate-500 mb-6 tracking-widest text-center">Biểu đồ Năng lực (Hồ sơ/Nhân viên)</h4>
                      <div className="h-[350px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats} layout="vertical" margin={{ left: 20 }}>
                               <XAxis type="number" hide />
                               <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={100} axisLine={false} tickLine={false} />
                               <ReTooltip 
                                 cursor={{ fill: 'rgba(99,102,241,0.05)' }}
                                 contentStyle={{ 
                                   backgroundColor: theme === 'light' ? '#fff' : '#0f172a', 
                                   border: 'none', 
                                   borderRadius: '16px' 
                                 }}
                               />
                               <Bar dataKey="total" name="Khối lượng XL" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={24}>
                                 <LabelList dataKey="total" position="right" style={{ fontSize: '10px' }} fill="#6366f1" />
                               </Bar>
                               <Bar dataKey="completed" name="Hoàn tất" fill="#22c55e" radius={[0, 6, 6, 0]} barSize={24}>
                                 <LabelList dataKey="completed" position="right" style={{ fontSize: '10px' }} fill="#22c55e" />
                               </Bar>
                            </BarChart>
                         </ResponsiveContainer>
                      </div>
                   </div>
                   
                   <div className={cn(
                     "p-6 rounded-[2rem] border overflow-hidden",
                     theme === 'light' ? "bg-slate-50 border-slate-100" : "bg-slate-950/40 border-slate-800"
                   )}>
                      <h4 className="text-[10px] font-black uppercase text-slate-500 mb-6 tracking-widest text-center">Phân tích Tốc độ (TAT trung bình)</h4>
                      <div className="h-[350px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.slice().sort((a:any, b:any) => a.avgTime - b.avgTime)}>
                               <defs>
                                 <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                                   <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                 </linearGradient>
                               </defs>
                               <XAxis dataKey="name" stroke="#94a3b8" fontSize={8} axisLine={false} tickLine={false} />
                               <YAxis stroke="#94a3b8" fontSize={8} axisLine={false} tickLine={false} />
                               <ReTooltip 
                                 contentStyle={{ backgroundColor: theme === 'light' ? '#fff' : '#0f172a', border: 'none', borderRadius: '12px' }}
                               />
                               <Area type="monotone" dataKey="avgTime" name="Số ngày xử lý TB" stroke="#f59e0b" fillOpacity={1} fill="url(#colorAvg)" />
                            </AreaChart>
                         </ResponsiveContainer>
                      </div>
                   </div>
                </div>
                   
                <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Thống kê chi tiết Nhân viên</p>
                      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                         {stats.length > 0 ? stats.sort((a:any, b:any) => b.total - a.total).map((user: any, i: number) => (
                           <div key={i} className={cn(
                             "p-4 rounded-3xl border flex items-center justify-between transition-all group",
                             theme === 'light' ? "bg-white border-slate-200" : "bg-slate-950/40 border-slate-800 hover:border-indigo-500/30"
                           )}>
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-black italic">
                                   {(user.name || 'User').charAt(0)}
                                 </div>
                                 <div>
                                   <p className={cn("text-sm font-black", theme === 'light' ? "text-slate-900" : "text-white group-hover:text-indigo-400 transition-colors")}>{user.name || 'Unknown'}</p>
                                   <div className="flex items-center gap-2 mt-0.5">
                                      <span className={cn("text-[9px] font-black uppercase tracking-tighter", theme === 'light' ? "text-slate-400" : "text-slate-500")}>Hoàn tất:</span>
                                      <span className={cn("px-2 py-0.5 text-[8px] font-black rounded-lg", theme === 'light' ? "bg-emerald-100 text-emerald-600" : "bg-emerald-500/10 text-emerald-500")}>{user.completed} hồ sơ</span>
                                   </div>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className={cn("text-sm font-black italic", theme === 'light' ? "text-slate-900" : "text-slate-300")}>{user.avgTime} Ngày</p>
                                 <p className={cn("text-[8px] font-black uppercase", theme === 'light' ? "text-slate-400" : "text-slate-600")}>TAT Trung bình</p>
                              </div>
                           </div>
                         )) : (
                           <div className="h-full flex items-center justify-center py-20 border-2 border-dashed border-slate-800 rounded-[2rem]">
                              <p className="text-xs text-slate-600 font-bold uppercase tracking-widest italic">Chưa có dữ liệu thao tác</p>
                           </div>
                         )}
                      </div>
                   </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                   {stats.slice(0, 4).map((user: any, i: number) => (
                     <div key={i} className={cn(
                       "p-5 rounded-[2rem] border relative overflow-hidden group",
                       theme === 'light' ? "bg-slate-50" : "bg-slate-950/20 border-slate-800"
                     )}>
                        <div className="absolute top-0 right-0 p-3">
                           <Zap size={14} className="text-amber-500 opacity-20 group-hover:opacity-100 transition-all" />
                        </div>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{user.name}</p>
                        <p className={cn("text-xl font-black italic", theme === 'light' ? "text-slate-900" : "text-white")}>{user.total} HS</p>
                        <div className="w-full h-1 bg-slate-800 rounded-full mt-3 overflow-hidden">
                           <div className="h-full bg-indigo-500" style={{ width: `${user.efficiency}%` }} />
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            ) : reportType === 'SLA' ? (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={cn("text-sm font-black uppercase tracking-widest", theme === 'light' ? "text-slate-800" : "text-slate-200")}>Phân tích Bottleneck & Hiệu suất Bộ phận</h3>
                    <p className="text-[10px] text-slate-500 mt-1 italic">Các bước có thời gian trung bình (Avg TAT) cao nhất là điểm nghẽn của quy trình.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="h-[400px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={slaStats} layout="vertical" margin={{ left: 20 }}>
                          <XAxis type="number" hide />
                          <YAxis dataKey="step" type="category" stroke="#94a3b8" fontSize={10} width={100} axisLine={false} tickLine={false} />
                          <ReTooltip 
                            cursor={{ fill: 'rgba(99,102,241,0.05)' }}
                            contentStyle={{ 
                              backgroundColor: theme === 'light' ? '#fff' : '#0f172a', 
                              border: theme === 'light' ? '1px solid #e2e8f0' : '1px solid #1e293b', 
                              borderRadius: '16px' 
                            }}
                          />
                          <Bar dataKey="avgDays" name="Số ngày tb" radius={[0, 6, 6, 0]} barSize={20}>
                            {slaStats.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.isCritical ? '#f43f5e' : entry.avgDays > 5 ? '#f59e0b' : '#6366f1'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                   </div>
                   
                   <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Trách nhiệm Phòng ban & TAT</p>
                      <div className="space-y-3">
                         {slaStats.sort((a,b) => b.avgDays - a.avgDays).map((item, i) => (
                           <div key={i} className={cn(
                             "p-4 rounded-2xl border flex items-center justify-between transition-all group",
                             item.isCritical ? "bg-rose-500/5 border-rose-500/20" : "bg-slate-950/20 border-slate-800"
                           )}>
                              <div className="flex items-center gap-4">
                                 <div className={cn(
                                   "w-2 h-2 rounded-full",
                                   item.isCritical ? "bg-rose-500" : "bg-indigo-500"
                                 )} />
                                 <div>
                                   <p className={cn("text-xs font-black", theme === 'light' ? "text-slate-900" : "text-white group-hover:text-indigo-400 transition-colors")}>{item.step}</p>
                                   <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[9px] font-black text-slate-500 uppercase">Phụ trách:</span>
                                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[8px] font-black rounded-lg">{item.dept}</span>
                                   </div>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className={cn(
                                   "text-sm font-black italic",
                                   item.isCritical ? "text-rose-500" : "text-slate-300"
                                 )}>{item.avgDays} Ngày</p>
                                 <p className="text-[8px] font-black text-slate-600 uppercase">Avg. TAT</p>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
              </div>
            ) : (
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? "#e2e8f0" : "#ffffff10"} vertical={false} />
                    <XAxis dataKey="name" stroke="#475569" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                    <YAxis stroke="#475569" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                    <ReTooltip 
                      cursor={{ fill: theme === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)' }}
                      contentStyle={{ 
                        backgroundColor: theme === 'light' ? '#fff' : '#0f172a', 
                        border: theme === 'light' ? '1px solid #e2e8f0' : '1px solid #1e293b', 
                        borderRadius: '16px', 
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' 
                      }}
                      itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: theme === 'light' ? '#334155' : '#fff' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '30px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                    <Bar dataKey="processing" name="Đang xử lý" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} barSize={24} />
                    <Bar dataKey="completed" name="Hoàn tất" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                    <Bar dataKey="overdue" name="Chậm trễ" fill="#ef4444" radius={[4, 4, 4, 4]} barSize={10} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Key Metrics & Risk Radar */}
        <div className="space-y-8">
           {/* Total Health Score */}
           <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-900/20 relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-all duration-700"></div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-4">Sức khỏe Hệ thống</h4>
            <div className="flex items-end justify-between relative z-10">
              <p className="text-5xl font-black italic tracking-tighter">8.5</p>
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                <Activity size={32} />
              </div>
            </div>
            <p className="text-[10px] font-bold tracking-tight mt-4 opacity-70">CHỈ SỐ TỰ ĐỘNG DỰA TRÊN SLA & RỦI RO VỐN VAY</p>
          </div>

          <div className={cn(
            "border rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden transition-all",
            theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900/40 border-slate-800"
          )}>
             <div className="flex items-center justify-between mb-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Cảnh báo Rủi ro cao</h4>
                <AlertCircle size={14} className="text-rose-500" />
             </div>
             <div className="space-y-4">
                <div 
                  onClick={() => { setActiveTab('applications'); setDashboardFilter('OVERDUE'); }}
                  className="flex items-center justify-between p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20 cursor-pointer hover:bg-rose-500/20 transition-all transition-all"
                >
                   <span className="text-[10px] font-black text-rose-500 uppercase">{"Hồ sơ trễ hạn > 15 ngày"}</span>
                   <span className="text-sm font-black text-rose-500">{applications.filter(a => calculateDaysDiff(a.receivedDate) > 15).length}</span>
                </div>
                <div 
                  onClick={() => { setActiveTab('applications'); setFilterLoanStatus('Co_Vay'); }}
                  className="flex items-center justify-between p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 cursor-pointer hover:bg-amber-500/20 transition-all"
                >
                   <span className="text-[10px] font-black text-amber-500 uppercase">Vi phạm Cam kết cấp GCN</span>
                   <span className="text-sm font-black text-amber-500">{loanApps.filter(a => calculateDaysDiff(a.receivedDate) > 10).length}</span>
                </div>
             </div>
             <button className="w-full mt-6 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-[9px] font-black uppercase text-slate-500 hover:text-white transition-all">
                Xem danh sách điểm nóng
             </button>
          </div>

          <div className={cn(
            "border rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden transition-all",
            theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900/40 border-slate-800"
          )}>
             <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6 flex items-center justify-between">
                Ranking Dự án 
                <TrendingUp size={14} className="text-emerald-500" />
             </h4>
             <div className="space-y-6">
                {stats.slice(0, 4).sort((a,b) => b.completed - a.completed).map((p, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 italic">#{i+1}</div>
                    <div className="flex-1">
                       <p className={cn("text-xs font-black", theme === 'light' ? "text-slate-800" : "text-slate-200")}>{p.name}</p>
                       <p className="text-[9px] text-slate-500">{p.completed} hồ sơ hoàn tất</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const NotificationPanel = ({ notifications, taskReminders, onClose, onRead, onMarkAllRead, onAction, theme }: { 
  notifications: AppNotification[], 
  taskReminders: AppNotification[],
  onClose: () => void, 
  onRead: (id: string) => void, 
  onMarkAllRead: () => void,
  onAction: (appId?: string, notiId?: string) => void,
  theme: 'light' | 'dark' 
}) => {
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);

  const displayedNotifications = filterUnreadOnly 
    ? notifications.filter(n => !n.isRead) 
    : notifications;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className={cn(
        "absolute right-0 top-full mt-4 w-[420px] border rounded-[2.5rem] shadow-[0_30px_80px_rgba(0,0,0,0.4)] z-[100] overflow-hidden text-left transition-all",
        theme === 'dark' ? "bg-slate-950/95 border-slate-800 backdrop-blur-xl" : "bg-white/95 border-slate-200 shadow-2xl backdrop-blur-xl"
      )}
    >
      <div className={cn(
        "p-6 border-b transition-all",
        theme === 'dark' ? "border-slate-800 bg-slate-900/50 text-white" : "border-slate-100 bg-slate-50 text-slate-900"
      )}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest">Trung tâm Thông tin</h4>
            <div className="flex items-center gap-3 mt-1">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAllRead();
                }}
                className="text-[10px] text-indigo-500 hover:text-indigo-600 font-black uppercase tracking-tighter transition-colors"
              >
                Đọc tất cả
              </button>
              <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setFilterUnreadOnly(!filterUnreadOnly);
                }}
                className={cn(
                  "text-[10px] font-black uppercase tracking-tighter transition-colors",
                  filterUnreadOnly ? "text-rose-500" : "text-slate-500 hover:text-slate-700"
                )}
              >
                {filterUnreadOnly ? "Hiện tất cả" : "Chỉ chưa đọc"}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn(
              "text-[10px] px-2 py-0.5 rounded-full font-bold",
              (notifications.filter(n => !n.isRead).length + taskReminders.length) > 0 ? "bg-rose-500 text-white" : "bg-slate-500/20 text-slate-500"
            )}>
              {notifications.filter(n => !n.isRead).length + taskReminders.length} Mới
            </span>
            <button onClick={onClose} className="p-2 hover:bg-slate-500/10 rounded-xl transition-all">
              <X size={18} className="text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
        {/* Urgent Task Reminders Section */}
        {taskReminders.length > 0 && (
          <div className={cn(
            "p-2 bg-rose-500/[0.03] border-b",
            theme === 'dark' ? "border-slate-800" : "border-slate-100"
          )}>
            <div className="px-4 py-2 flex items-center gap-2">
              <AlertTriangle size={12} className="text-rose-500" />
              <span className="text-[9px] font-black uppercase tracking-widest text-rose-500">Việc cần làm ({taskReminders.length})</span>
            </div>
            <div className="space-y-1">
              {taskReminders.map(rem => (
                <div 
                  key={rem.id}
                  onClick={() => onAction(rem.appId)}
                  className={cn(
                    "p-4 rounded-3xl transition-all cursor-pointer group border mx-2 mb-1",
                    theme === 'dark' 
                      ? "bg-slate-900/40 border-slate-800 hover:bg-slate-900 hover:border-rose-500/30" 
                      : "bg-white border-slate-100 hover:border-rose-500/30 shadow-sm"
                  )}
                >
                  <div className="flex gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border",
                      rem.type === 'Urgent' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                    )}>
                      {rem.type === 'Urgent' ? <RotateCcw size={18} /> : <ClipboardCheck size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <p className={cn("text-xs font-black", theme === 'dark' ? "text-slate-200" : "text-slate-900")}>{rem.title}</p>
                        <span className="text-[8px] font-black uppercase text-rose-500">Xử lý ngay</span>
                      </div>
                      <p className={cn("text-[11px] leading-snug line-clamp-2", theme === 'dark' ? "text-slate-500" : "text-slate-400")}>{rem.message}</p>
                      <div className="mt-2 flex items-center gap-2">
                         <span className="text-[10px] font-black text-rose-500 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                           Tiến hành xử lý <ChevronRight size={10} />
                         </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-2">
          {displayedNotifications.length > 0 ? (
            displayedNotifications.map(n => (
              <div 
                key={n.id} 
                onClick={() => {
                   if (!n.isRead) onRead(n.id);
                   if (n.appId) onAction(n.appId, n.id);
                }}
                className={cn(
                  "p-5 rounded-[1.5rem] transition-all relative group cursor-pointer",
                  theme === 'dark' 
                    ? "hover:bg-white/5" 
                    : "hover:bg-slate-50",
                  !n.isRead && (theme === 'dark' ? "bg-indigo-500/5" : "bg-indigo-50/30")
                )}
              >
                <div className="flex gap-4">
                  <div className={cn(
                    "w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 transition-all",
                    n.isRead ? "bg-slate-300 dark:bg-slate-700 scale-75 opacity-50" : (n.type === 'Urgent' ? "bg-rose-500 shadow-lg shadow-rose-500/30" : n.type === 'Success' ? "bg-emerald-500" : "bg-indigo-500")
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className={cn("text-sm font-bold leading-tight mb-1", theme === 'dark' ? (n.isRead ? "text-slate-500" : "text-slate-100") : (n.isRead ? "text-slate-400" : "text-slate-900"))}>{n.title}</p>
                    </div>
                    <p className={cn("text-xs leading-relaxed line-clamp-2", theme === 'dark' ? (n.isRead ? "text-slate-600" : "text-slate-400") : (n.isRead ? "text-slate-400" : "text-slate-600"))}>{n.message}</p>
                    <div className="flex items-center justify-between mt-3">
                      <p className={cn("text-[10px] font-black uppercase tracking-tighter", theme === 'dark' ? "text-slate-600" : "text-slate-400")}>
                        {new Date(n.time).toLocaleString('vi-VN', { 
                          hour: '2-digit', 
                          minute: '2-digit', 
                          day: '2-digit', 
                          month: '2-digit' 
                        })}
                      </p>
                      {!n.isRead && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onRead(n.id);
                          }}
                          className={cn(
                            "p-1.5 rounded-lg transition-all shadow-sm",
                            theme === 'dark' ? "hover:bg-slate-800 bg-slate-950 border border-slate-800" : "hover:bg-white bg-slate-100 border border-slate-200"
                          )}
                          title="Đánh dấu đã đọc"
                        >
                          <Check size={14} className="text-indigo-500" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            !taskReminders.length && (
              <div className="p-16 text-center">
                <div className="w-20 h-20 bg-slate-500/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                  <BellOff size={32} className="text-slate-500 opacity-20" />
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{filterUnreadOnly ? "Không có thông báo chưa đọc" : "Hộp thư trống"}</p>
              </div>
            )
          )}
        </div>
      </div>

      <button className={cn(
        "w-full py-6 text-[10px] font-black uppercase tracking-[0.3em] transition-all border-t",
        theme === 'dark' 
          ? "text-slate-500 hover:text-white bg-slate-900/50 border-slate-800" 
          : "text-slate-500 hover:text-slate-900 bg-slate-50 border-slate-100"
      )}>
        Xem tất cả thông báo
      </button>
    </motion.div>
  );
};


const FieldModeView = ({ applications, projects, onUpdateApp, theme, onExit }: { applications: Application[], projects: Project[], onUpdateApp: (app: Application) => void, theme: 'light' | 'dark', onExit: () => void }) => {
  const [search, setSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  
  const filteredApps = applications.filter(a => 
    String(a.unitCode || '').toLowerCase().includes(search.toLowerCase()) || 
    String(a.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
    String(a.projectName || '').toLowerCase().includes(search.toLowerCase()) ||
    String(a.phoneNumber || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 font-sans safe-area-inset overflow-x-hidden text-left">
       <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <LayoutDashboard size={20} />
             </div>
             <div className="text-left">
                <h2 className="text-lg font-black italic">Field Portal</h2>
                <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Cập nhật hồ sơ hiện trường</p>
             </div>
          </div>
          <button onClick={onExit} className="p-2 bg-slate-900 rounded-xl border border-slate-800 text-slate-400">
             <X size={20} />
          </button>
       </header>

       <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input 
            type="text" 
            placeholder="Tìm mã căn / khách hàng..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:border-indigo-500 transition-all text-left"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
       </div>

       <div className="space-y-4 pb-24 text-left">
          {filteredApps.length > 0 ? (
            filteredApps.map(app => (
              <div 
                key={app.id} 
                onClick={() => setSelectedApp(app)}
                className="bg-slate-900/40 p-5 rounded-[2rem] border border-slate-800 flex items-center justify-between active:scale-[0.98] transition-all"
              >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{app.unitCode}</span>
                        {app.loanStatus === 'Co_Vay' && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase bg-indigo-500/20 text-indigo-400 border border-indigo-500/20">Có vay</span>
                        )}
                        <span className={cn(
                          "text-[8px] px-2 py-0.5 rounded-md font-black uppercase",
                          app.status === 'Error' ? "bg-rose-500/20 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
                        )}>{app.status}</span>
                    </div>
                    <p className="text-sm font-bold truncate">{app.customerName}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{app.projectName}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500">
                    <ChevronRight size={20} />
                  </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center opacity-30">
               <Search size={48} className="mx-auto mb-4" />
               <p className="text-xs font-black uppercase">Không tìm thấy hồ sơ</p>
            </div>
          )}
       </div>

       <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800 grid grid-cols-3 gap-2">
          <button className="flex flex-col items-center gap-1 p-2 text-indigo-400">
             <LayoutDashboard size={20} />
             <span className="text-[8px] font-black uppercase">Tất cả</span>
          </button>
          <button className="flex flex-col items-center gap-1 p-2 text-slate-500">
             <AlertCircle size={20} />
             <span className="text-[8px] font-black uppercase">Vướng mắc</span>
          </button>
          <button className="flex flex-col items-center gap-1 p-2 text-slate-500 group">
             <Camera size={20} className="group-active:scale-125 transition-transform" />
             <span className="text-[8px] font-black uppercase">Chụp ảnh</span>
          </button>
       </div>

       <AnimatePresence>
          {selectedApp && (
             <motion.div 
               initial={{ y: '100%' }}
               animate={{ y: 0 }}
               exit={{ y: '100%' }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="fixed inset-0 z-[200] bg-slate-950 p-6 flex flex-col text-left"
             >
                <header className="flex items-center justify-between mb-8">
                   <h2 className="text-xl font-black italic">Cập nhật hồ sơ</h2>
                   <button onClick={() => setSelectedApp(null)} className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-slate-500">
                      <X size={20} />
                   </button>
                </header>

                <div className="flex-1 overflow-y-auto space-y-8 custom-scrollbar">
                   <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 text-center">
                      <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Hồ sơ mục tiêu</p>
                      <h3 className="text-2xl font-black text-indigo-400 font-serif italic mb-1">{selectedApp.unitCode}</h3>
                      <div className="flex justify-center gap-2 mb-2">
                        <span className="text-[9px] px-2 py-0.5 bg-slate-800 text-slate-400 rounded-lg font-black uppercase">
                          {selectedApp.propertyType === 'Dat_Nen' ? 'Đất nền' : 'Căn hộ'}
                        </span>
                        <span className={cn(
                          "text-[9px] px-3 py-0.5 rounded-lg font-black uppercase",
                          selectedApp.loanStatus === 'Co_Vay' ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/20" : "bg-slate-800 text-slate-500"
                        )}>
                          {selectedApp.loanStatus === 'Co_Vay' ? 'Có vay' : 'Không vay'}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-300">{selectedApp.customerName}</p>
                   </div>

                   <section className="space-y-4">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Trạng thái công việc</p>
                      <div className="grid grid-cols-2 gap-3">
                         {[
                           { val: 'Processing', label: 'Đang xử lý' },
                           { val: 'Completed', label: 'Đã xong' },
                           { val: 'Error', label: 'Vướng mắc' }
                         ].map(st => (
                            <button 
                              key={st.val}
                              onClick={() => {
                                 onUpdateApp({ ...selectedApp, status: st.val as any });
                                 setSelectedApp(null);
                              }}
                              className={cn(
                                "py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                selectedApp.status === st.val ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-950 border-slate-800 text-slate-500"
                              )}
                            >
                               {st.label}
                            </button>
                         ))}
                      </div>
                   </section>

                   <section className="space-y-4">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Ảnh hiện trường / Hồ sơ scan</p>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="aspect-square bg-slate-900 border border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-3 active:scale-95 transition-all text-slate-500 border-dashed border-2 cursor-pointer">
                            <Camera size={32} />
                            <span className="text-[9px] font-black uppercase">Chụp ảnh mới</span>
                         </div>
                         <div className="aspect-square bg-slate-900 border border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-3 active:scale-95 transition-all text-slate-500 border-dashed border-2 cursor-pointer">
                            <Upload size={32} />
                            <span className="text-[9px] font-black uppercase">Tải tệp lên</span>
                         </div>
                      </div>
                   </section>
                </div>

                <div className="pt-6">
                   <button 
                     onClick={() => setSelectedApp(null)}
                     className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"
                   >
                      Hoàn tất & Đồng bộ
                   </button>
                </div>
             </motion.div>
          )}
       </AnimatePresence>

    </div>
  );
};

const ProjectManagementView = ({ projects, onCreate, onEdit, onDelete, theme }: { projects: Project[]; onCreate: () => void; onEdit: (p: Project) => void; onDelete: (id: string) => void; theme: 'light' | 'dark' }) => {
  const [pSearch, setPSearch] = useState('');

  const groupedProjects = useMemo(() => {
    return projects
      .filter(p => String(p.name || '').toLowerCase().includes(pSearch.toLowerCase()) || String(p.region || '').toLowerCase().includes(pSearch.toLowerCase()))
      .reduce((acc, p) => {
        const region = p.region || 'Các Dự án khác';
        if (!acc[region]) acc[region] = [];
        acc[region].push(p);
        return acc;
      }, {} as Record<string, Project[]>);
  }, [projects, pSearch]);

  const [expandedRegions, setExpandedRegions] = useState<Record<string, boolean>>(
    Object.keys(groupedProjects).reduce((acc, key) => ({ ...acc, [key]: true }), {})
  );

  const toggleRegion = (region: string) => {
    setExpandedRegions(prev => ({ ...prev, [region]: !prev[region] }));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-end text-left">
        <div>
           <h2 className={cn("text-3xl font-black italic font-serif tracking-tight", theme === 'light' ? "text-slate-900" : "text-white")}>Cây thư mục Dự án</h2>
           <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Quản lý theo khu vực & cụm dự án</p>
        </div>
        <div className="flex gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text"
              placeholder="Tìm dự án..."
              value={pSearch}
              onChange={(e) => setPSearch(e.target.value)}
              className={cn(
                "w-64 pl-12 pr-6 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-indigo-500 transition-all",
                theme === 'light' ? "bg-white border-slate-200 text-slate-900" : "bg-slate-950 border-slate-800 text-white"
              )}
            />
          </div>
          <div className={cn(
            "px-6 py-3 rounded-2xl border flex flex-col justify-center",
            theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900/40 border-slate-800"
          )}>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Tổng dự án</p>
            <p className={cn("text-xl font-black italic font-serif", theme === 'light' ? "text-slate-900" : "text-white")}>{projects.length}</p>
          </div>
          <button 
            onClick={onCreate}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-emerald-600/20 hover:scale-105 active:scale-95 transition-all outline-none"
          >
            <Plus size={16} /> Thêm dự án mới
          </button>
        </div>
      </header>

      <div className="space-y-6">
        {(Object.entries(groupedProjects) as [string, Project[]][])
          .sort(([a], [b]) => {
            const idxA = REGION_ORDER.indexOf(a);
            const idxB = REGION_ORDER.indexOf(b);
            if (idxA === -1 && idxB === -1) return a.localeCompare(b);
            if (idxA === -1) return 1;
            if (idxB === -1) return -1;
            return idxA - idxB;
          })
          .map(([region, regionProjects]) => (
          <div 
            key={region} 
            className={cn(
              "rounded-[2.5rem] border overflow-hidden transition-all duration-500",
              theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900/20 border-slate-800/50"
            )}
          >
            <button 
              onClick={() => toggleRegion(region)}
              className={cn(
                "w-full px-8 py-5 flex items-center justify-between group transition-colors",
                theme === 'light' ? "hover:bg-slate-50" : "hover:bg-slate-800/30"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                  expandedRegions[region] !== false ? "bg-festive-gold text-slate-900" : "bg-slate-800 text-slate-400"
                )}>
                  {expandedRegions[region] !== false ? <FolderOpen size={20} /> : <Folder size={20} />}
                </div>
                <div className="text-left">
                  <h3 className={cn("font-bold text-lg", theme === 'light' ? "text-slate-900" : "text-white")}>{region}</h3>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{regionProjects.length} Dự án thành viên</p>
                </div>
              </div>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300",
                expandedRegions[region] !== false ? "rotate-180" : "rotate-0",
                theme === 'light' ? "bg-slate-100 text-slate-400" : "bg-slate-800 text-slate-500"
              )}>
                <ChevronDown size={16} />
              </div>
            </button>

            <AnimatePresence>
              {expandedRegions[region] !== false && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-8 pb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4">
                    {regionProjects.map(project => (
                      <div 
                        key={project.id}
                        className={cn(
                          "p-6 rounded-[2rem] border transition-all group relative overflow-hidden",
                          theme === 'light' ? "bg-slate-50/50 border-slate-200" : "bg-slate-900/60 border-slate-700/50"
                        )}
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                            <Building2 size={24} />
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => onEdit(project)}
                              className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white transition-all"
                            >
                              <Settings size={14} />
                            </button>
                            <button 
                              onClick={() => onDelete(project.id)}
                              className="p-2 rounded-xl bg-slate-800/80 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        
                        <h3 className={cn("text-xl font-bold mb-2", theme === 'light' ? "text-slate-900" : "text-white")}>{project.name}</h3>
                        <div className="flex items-center gap-6 pt-6 border-t border-slate-800/30">
                           <div>
                             <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Mã dự án</p>
                             <p className={cn("text-sm font-mono font-bold", theme === 'light' ? "text-slate-700" : "text-slate-300")}>{project.id}</p>
                           </div>
                           <div>
                             <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Sản phẩm</p>
                             <p className={cn("text-sm font-bold", theme === 'light' ? "text-slate-700" : "text-slate-300")}>{project.totalUnits} Units</p>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

const HandoverTicketModal = ({ 
  isOpen, 
  onClose, 
  app, 
  theme 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  app: Application | null;
  theme: 'light' | 'dark'
}) => {
  if (!app) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={cn(
              "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] overflow-y-auto z-[70] rounded-[2.5rem] shadow-2xl border print:shadow-none print:border-none print:static print:translate-x-0 print:translate-y-0 print:max-h-none",
              theme === 'dark' ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
            )}
          >
            <div className="p-8 md:p-12 space-y-8 print:p-0">
               <div className="flex justify-between items-start border-b pb-6 border-slate-200/20 print:border-slate-800">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black font-serif italic tracking-tight text-festive-gold">BIÊN BẢN BÀN GIAO</h2>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Giấy chứng nhận Quyền sử dụng đất</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] font-mono opacity-60">Số: {app.unitCode}/{new Date().getFullYear()}/BBBG</p>
                    <p className="text-[10px] font-mono opacity-60">{new Date().toLocaleDateString('vi-VN')}</p>
                  </div>
               </div>

               <div className="space-y-6">
                 <div>
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-3 border-b border-indigo-500/10 pb-1">BÊN GIAO (PHÒNG THỦ TỤC - PTT)</h3>
                   <div className="grid grid-cols-2 gap-4 text-xs">
                     <div>
                       <p className="opacity-50 mb-0.5">Họ và tên người giao:</p>
                       <p className="font-bold">Ban QL Dự án {app.projectName}</p>
                     </div>
                     <div>
                       <p className="opacity-50 mb-0.5">Bộ phận:</p>
                       <p className="font-bold">Phòng Thủ tục hồ sơ</p>
                     </div>
                   </div>
                 </div>

                 <div>
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-3 border-b border-emerald-500/10 pb-1">BÊN NHẬN (KHÁCH HÀNG)</h3>
                   <div className="grid grid-cols-2 gap-4 text-xs">
                     <div>
                       <p className="opacity-50 mb-0.5">Họ và tên:</p>
                       <p className="font-bold">{app.customerName}</p>
                     </div>
                     <div>
                       <p className="opacity-50 mb-0.5">Số điện thoại:</p>
                       <p className="font-bold">{app.phoneNumber || '---'}</p>
                     </div>
                     <div className="col-span-2">
                       <p className="opacity-50 mb-0.5">Mã sản phẩm / Lô căn:</p>
                       <p className="font-bold text-lg">{app.unitCode} - Dự án {app.projectName}</p>
                     </div>
                   </div>
                 </div>

                 <div>
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 border-b border-slate-700 pb-1">DANH MỤC TÀI LIỆU BÀN GIAO</h3>
                   <table className="w-full text-xs border-collapse">
                     <thead>
                       <tr className="bg-slate-800/10 dark:bg-slate-800/50">
                         <th className="border border-slate-700/50 p-2 text-left">STT</th>
                         <th className="border border-slate-700/50 p-2 text-left text-[10px] uppercase">Loại tài liệu / Giấy tờ</th>
                         <th className="border border-slate-700/50 p-2 text-center text-[10px] uppercase">Số lượng</th>
                         <th className="border border-slate-700/50 p-2 text-left text-[10px] uppercase">Ghi chú</th>
                       </tr>
                     </thead>
                     <tbody>
                       <tr>
                         <td className="border border-slate-700/50 p-2 text-center">1</td>
                         <td className="border border-slate-700/50 p-2 font-bold">Giấy chứng nhận Quyền sử dụng Đất (GCN)</td>
                         <td className="border border-slate-700/50 p-2 text-center">01 bản gốc</td>
                         <td className="border border-slate-700/50 p-2 italic opacity-60">Kèm thông báo nộp thuế</td>
                       </tr>
                       <tr>
                         <td className="border border-slate-700/50 p-2 text-center">2</td>
                         <td className="border border-slate-700/50 p-2 pr-4 font-bold">Hồ sơ kỹ thuật / Biên bản đo đạc</td>
                         <td className="border border-slate-700/50 p-2 text-center">01 bộ</td>
                         <td className="border border-slate-700/50 p-2 italic opacity-60"></td>
                       </tr>
                       {app.isSelfService && (
                         <tr>
                           <td className="border border-slate-700/50 p-2 text-center">3</td>
                           <td className="border border-slate-700/50 p-2 font-bold">Tài liệu hướng dẫn sang tên</td>
                           <td className="border border-slate-700/50 p-2 text-center">01 bộ</td>
                           <td className="border border-slate-700/50 p-2 italic opacity-60">Khách hàng tự làm hồ sơ</td>
                         </tr>
                       )}
                     </tbody>
                   </table>
                 </div>

                 <div className="pt-8 grid grid-cols-2 gap-12">
                    <div className="text-center space-y-20">
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-60">ĐẠI DIỆN BÊN GIAO</p>
                       <p className="text-xs font-bold">(Ký và ghi rõ họ tên)</p>
                    </div>
                    <div className="text-center space-y-20">
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-60">ĐẠI DIỆN BÊN NHẬN</p>
                       <p className="text-xs font-bold">(Ký và ghi rõ họ tên)</p>
                    </div>
                 </div>

                 <div className="pt-10 border-t border-slate-800 border-dashed text-[9px] italic text-slate-500 text-center uppercase tracking-widest">
                    Vui lòng bảo quản cẩn thận giấy tờ gốc. Mọi khiếu nại sau khi ký biên bản này sẽ được xử lý theo quy định công ty.
                 </div>
               </div>

               <div className="flex gap-3 pt-6 print:hidden">
                 <button 
                   onClick={onClose}
                   className="flex-1 py-3 border border-slate-700 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-800 transition-colors"
                 >
                   Đóng lại
                 </button>
                 <button 
                   onClick={handlePrint}
                   className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-900/20 transition-all flex items-center justify-center gap-2"
                 >
                   <Printer size={16} /> In Phiếu BĐ
                 </button>
               </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const BulkTransitionModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  selectedCount,
  unitCodes,
  targetStepLabel,
  updateField,
  value,
  onChangeValue,
  location,
  onChangeLocation,
  refCode,
  onChangeRefCode,
  theme,
  showToast
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  selectedCount: number;
  unitCodes: string[];
  targetStepLabel: string;
  updateField: {key: string, label: string, isRequired?: boolean} | null;
  value: string;
  onChangeValue: (v: string) => void;
  location?: 'PHUONG' | 'TP_DANANG';
  onChangeLocation?: (v: 'PHUONG' | 'TP_DANANG') => void;
  refCode?: string;
  onChangeRefCode?: (v: string) => void;
  theme: 'light' | 'dark';
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className={cn(
          "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-[70] rounded-[2.5rem] shadow-2xl border p-8 max-h-[90vh] overflow-y-auto custom-scrollbar",
          theme === 'dark' ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
        )}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight mb-1">Xác nhận chuyển bước</h2>
            <p className={cn("text-xs font-medium", theme === 'dark' ? "text-slate-400" : "text-slate-500")}>
              Bạn đang thực hiện thao tác hàng loạt cho {selectedCount} hồ sơ.
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className={cn("mb-6 p-4 rounded-2xl text-xs font-mono max-h-32 overflow-y-auto", theme === 'dark' ? "bg-slate-950 border border-slate-800" : "bg-slate-50 border border-slate-200")}>
          <div className="font-bold mb-2 uppercase tracking-widest text-[10px] text-indigo-500">Danh sách mã căn:</div>
          <div className="flex flex-wrap gap-2 text-slate-400">
            {unitCodes.join(", ")}
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-indigo-500/5 border border-indigo-500/10">
            <label className="block text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2">Chuyển sang giai đoạn</label>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500 text-white rounded-lg">
                <ChevronRight size={16} />
              </div>
              <span className="font-black text-sm uppercase">{targetStepLabel}</span>
            </div>
          </div>

          <div className="space-y-4">
            {updateField && (
              <div className="space-y-3">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                  {updateField.label} {updateField.isRequired !== false ? '(Bắt buộc)' : '(Không bắt buộc)'}
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Calendar size={18} />
                  </div>
                  <input 
                    type="date"
                    value={value}
                    onChange={(e) => onChangeValue(e.target.value)}
                    className={cn(
                      "w-full pl-12 pr-4 py-4 rounded-3xl text-sm font-bold border outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all",
                      theme === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    )}
                  />
                </div>
              </div>
            )}

            {targetStepLabel?.toUpperCase().includes('2. TIẾP NHẬN') && (
              <div className={cn("space-y-3 p-4 rounded-2xl border", theme === 'dark' ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200")}>
                <label className={cn("block text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2", theme === 'dark' ? "text-amber-500" : "text-amber-700")}>
                  <BookOpen size={14} /> Danh mục hồ sơ gốc tham khảo
                </label>
                <div className={cn("space-y-3 text-xs font-medium", theme === 'dark' ? "text-slate-300" : "text-slate-700")}>
                  <p className="italic text-[10px] opacity-70 mb-2 underline decoration-amber-500/30">Danh sách các hồ sơ cần chuẩn bị:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>HĐMB/HĐCN Gốc</li>
                    <li>Văn bản chuyển nhượng</li>
                    <li>Lệ phí trước bạ</li>
                    <li>Sổ hộ khẩu/CCCD/ĐKKD</li>
                    <li>Các biên bản liên quan (Bàn giao, Quyết toán...)</li>
                  </ul>
                </div>
              </div>
            )}

            {(targetStepLabel?.toUpperCase().includes('4. THÔNG BÁO') || targetStepLabel?.toUpperCase().includes('3. NỘP VPĐK') || targetStepLabel?.toUpperCase().includes('3. NOP VPDK')) && (
              <>
                <div className="space-y-3">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                    Nơi nộp hồ sơ (Bắt buộc)
                  </label>
                  <select 
                    value={location}
                    onChange={(e) => onChangeLocation?.(e.target.value as 'PHUONG' | 'TP_DANANG')}
                    className={cn(
                      "w-full px-4 py-4 rounded-3xl text-sm font-bold border outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all",
                      theme === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    )}
                  >
                    <option value="PHUONG">Phường/Xã</option>
                    <option value="TP_DANANG">Tỉnh/Thành phố</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                    Mã hồ sơ / Số phiếu hẹn (Bắt buộc)
                  </label>
                  <input 
                    type="text"
                    value={refCode}
                    onChange={(e) => onChangeRefCode?.(e.target.value)}
                    placeholder="Nhập mã hồ sơ / số phiếu hẹn..."
                    className={cn(
                      "w-full px-6 py-4 rounded-3xl text-sm font-bold border outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all",
                      theme === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    )}
                  />
                </div>
              </>
            )}
          </div>

          <p className="text-[10px] text-slate-400 italic ml-1">
            * Thông tin này sẽ được áp dụng cho toàn bộ {selectedCount} hồ sơ đã chọn.
          </p>
        </div>

        <div className="flex gap-4 mt-10">
          <button 
            onClick={onClose}
            className={cn(
              "flex-1 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest border transition-all",
              theme === 'dark' ? "border-slate-800 text-slate-500 hover:bg-slate-800" : "border-slate-200 text-slate-500 hover:bg-slate-100"
            )}
          >
            Hủy bỏ
          </button>
          <button 
            disabled={
              (updateField?.isRequired !== false && updateField && !value) || false
            }
            onClick={() => {
              onConfirm();
            }}
            className={cn(
              "flex-1 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
              ((updateField && !value))
                ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700" 
                : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-900/40"
            )}
          >
            Xác nhận & Chuyển <ArrowRight size={14} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

const BulkIssueModal = ({
  isOpen,
  onClose,
  onConfirm,
  selectedCount,
  unitCodes,
  note,
  onChangeNote,
  issueType,
  onChangeIssueType,
  severity,
  onChangeSeverity,
  source,
  onChangeSource,
  theme
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedCount: number;
  unitCodes: string[];
  note: string;
  onChangeNote: (v: string) => void;
  issueType: IssueType;
  onChangeIssueType: (v: IssueType) => void;
  severity: IssueSeverity;
  onChangeSeverity: (v: IssueSeverity) => void;
  source: IssueCategory;
  onChangeSource: (v: IssueCategory) => void;
  theme: 'light' | 'dark';
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className={cn(
          "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl z-[70] rounded-[2.5rem] shadow-2xl border p-8 max-h-[90vh] overflow-y-auto custom-scrollbar",
          theme === 'dark' ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
        )}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight mb-1 text-rose-500">Báo cáo sai sót hàng loạt</h2>
            <p className={cn("text-xs font-medium", theme === 'dark' ? "text-slate-400" : "text-slate-500")}>
              Ghi nhận vướng mắc cho {selectedCount} hồ sơ đã chọn.
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className={cn("mb-6 p-4 rounded-2xl text-xs font-mono max-h-24 overflow-y-auto", theme === 'dark' ? "bg-slate-950 border border-slate-800" : "bg-slate-50 border border-slate-200")}>
          <div className="flex flex-wrap gap-2 text-slate-400">
            {unitCodes.join(", ")}
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Phân loại lỗi</label>
              <select 
                value={issueType}
                onChange={(e) => onChangeIssueType(e.target.value as IssueType)}
                className={cn(
                  "w-full px-4 py-3 rounded-2xl text-sm font-bold border outline-none focus:ring-2 focus:ring-rose-500/20 transition-all",
                  theme === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                )}
              >
                <option value="Paperwork">HS Pháp lý / Thủ tục</option>
                <option value="Financial">Tài chính / Công nợ / Thuế</option>
                <option value="Authority">Cơ quan nhà nước</option>
                <option value="Other">Khác (Internal / Project)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nguồn gốc vướng mắc</label>
              <select 
                value={source}
                onChange={(e) => onChangeSource(e.target.value as IssueCategory)}
                className={cn(
                  "w-full px-4 py-3 rounded-2xl text-sm font-bold border outline-none focus:ring-2 focus:ring-rose-500/20 transition-all",
                  theme === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                )}
              >
                <option value="None">-- Chưa phân loại --</option>
                <option value="Chu_Dau_Tu">Chủ đầu tư</option>
                <option value="Nha_Nuoc">Nhà nước</option>
                <option value="Noi_Bo">Nội bộ</option>
                <option value="Khach_Hang">Khách hàng</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Mức độ nghiêm trọng</label>
            <div className="flex gap-2">
              {(['Minor', 'Moderate', 'Critical'] as IssueSeverity[]).map(s => (
                <button
                  key={s}
                  onClick={() => onChangeSeverity(s)}
                  className={cn(
                    "flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all",
                    severity === s 
                      ? (s === 'Critical' ? "bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-900/20" : 
                         s === 'Moderate' ? "bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-900/20" : 
                         "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-900/20")
                      : (theme === 'dark' ? "bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600" : "bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300")
                  )}
                >
                  {s === 'Critical' ? 'Nghiêm trọng' : s === 'Moderate' ? 'Trung bình' : 'Nhẹ'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nội dung vướng mắc (Bắt buộc)</label>
            <textarea 
              value={note}
              onChange={(e) => onChangeNote(e.target.value)}
              placeholder="Mô tả chi tiết vướng mắc, sai sót là gì..."
              className={cn(
                "w-full px-6 py-4 rounded-3xl text-sm font-bold border outline-none focus:ring-2 focus:ring-rose-500/20 transition-all min-h-[120px] resize-none",
                theme === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
              )}
            />
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button 
            onClick={onClose}
            className={cn(
              "flex-1 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest border transition-all",
              theme === 'dark' ? "border-slate-800 text-slate-500 hover:bg-slate-800" : "border-slate-200 text-slate-500 hover:bg-slate-100"
            )}
          >
            Hủy bỏ
          </button>
          <button 
            disabled={!note.trim()}
            onClick={onConfirm}
            className={cn(
              "flex-1 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
              !note.trim()
                ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700" 
                : "bg-rose-600 text-white hover:bg-rose-500 shadow-xl shadow-rose-900/40"
            )}
          >
            Ghi nhận sai sót <AlertTriangle size={14} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

const ProjectModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  project, 
  theme 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (p: Partial<Project>) => void; 
  project: Project | null;
  theme: 'light' | 'dark'
}) => {
  const [formData, setFormData] = useState<Partial<Project>>({
    name: '',
    region: 'Quảng Trị',
    totalUnits: 0,
    workflowType: 'Quy_trinh_1'
  });

  useEffect(() => {
    if (project) {
      // Deep check or just name check to avoid loop if parent re-renders and passes "new" project
      if (formData.name !== project.name || formData.region !== project.region || formData.totalUnits !== project.totalUnits || formData.workflowType !== project.workflowType) {
        setFormData(project);
      }
    } else if (isOpen) {
      // Only reset if it's not already reset
      if (formData.name !== '' || formData.totalUnits !== 0) {
        setFormData({
          name: '',
          region: 'Quảng Trị',
          totalUnits: 0,
          workflowType: 'Quy_trinh_1'
        });
      }
    }
  }, [project, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className={cn(
          "relative w-full max-w-lg rounded-[2.5rem] border shadow-2xl overflow-hidden",
          theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"
        )}
      >
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className={cn("text-2xl font-black italic font-serif", theme === 'light' ? "text-slate-900" : "text-white")}>
                {project ? 'Chỉnh sửa Dự án' : 'Tạo Dự án Mới'}
              </h2>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Thông tin vận hành hệ thống</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-500/10 transition-all">
              <X size={20} className="text-slate-500" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Tên dự án</label>
              <input 
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Sunshine Riverside"
                className={cn(
                  "w-full px-5 py-4 rounded-2xl border text-sm font-bold focus:outline-none transition-all",
                  theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500" : "bg-slate-950 border-slate-800 text-white focus:border-festive-gold"
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Khu vực / Tỉnh thành</label>
                <select 
                  value={formData.region}
                  onChange={e => setFormData({ ...formData, region: e.target.value })}
                  className={cn(
                    "w-full px-5 py-4 rounded-2xl border text-sm font-bold focus:outline-none transition-all",
                    theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-slate-950 border-slate-800 text-white"
                  )}
                >
                  <option value="Quảng Trị">Quảng Trị</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                  <option value="Quảng Ngãi">Quảng Ngãi</option>
                  <option value="Khánh Hòa">Khánh Hòa</option>
                  <option value="Gia Lai">Gia Lai</option>
                  <option value="Lâm Đồng">Lâm Đồng</option>
                  <option value="Đắk Lắk">Đắk Lắk</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Tổng số sản phẩm</label>
                <input 
                  type="number"
                  value={formData.totalUnits}
                  onChange={e => setFormData({ ...formData, totalUnits: parseInt(e.target.value) || 0 })}
                  className={cn(
                    "w-full px-5 py-4 rounded-2xl border text-sm font-bold focus:outline-none transition-all focus:border-indigo-500",
                    theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-slate-950 border-slate-800 text-white"
                  )}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 mt-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Loại quy trình</label>
                <select 
                  value={formData.workflowType || 'Quy_trinh_1'}
                  onChange={e => setFormData({ ...formData, workflowType: e.target.value as any })}
                  disabled={!!project}
                  className={cn(
                    "w-full px-5 py-4 rounded-2xl border text-sm font-bold focus:outline-none transition-all",
                    theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500" : "bg-slate-950 border-slate-800 text-white focus:border-festive-gold",
                    !!project && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <option value="Quy_trinh_1">Quy trình hỗ trợ (GD_)</option>
                  <option value="Quy_trinh_2">Quy trình thông thường (S_)</option>
                </select>
                {project && <p className="text-[9px] text-amber-500 font-bold mt-2 italic">* Không thể thay đổi quy trình sau khi dự án đã được tạo.</p>}
              </div>

              <div className="mt-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Danh mục hồ sơ gốc (Tham khảo)</label>
                <div className="space-y-2">
                  {(formData.originalDocumentChecklist || []).map((item, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input 
                        type="text"
                        value={item}
                        onChange={e => {
                          const newList = [...(formData.originalDocumentChecklist || [])];
                          newList[idx] = e.target.value;
                          setFormData({ ...formData, originalDocumentChecklist: newList });
                        }}
                        placeholder="Tên hồ sơ..."
                        className={cn(
                          "flex-1 px-4 py-2 rounded-xl border text-xs font-bold transition-all focus:ring-1 focus:ring-indigo-500",
                          theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-slate-950 border-slate-800 text-white"
                        )}
                      />
                      <button 
                        onClick={() => {
                          const newList = (formData.originalDocumentChecklist || []).filter((_, i) => i !== idx);
                          setFormData({ ...formData, originalDocumentChecklist: newList });
                        }}
                        className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => setFormData({ ...formData, originalDocumentChecklist: [...(formData.originalDocumentChecklist || []), ''] })}
                    className="w-full py-2 border-2 border-dashed border-slate-700/50 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-indigo-500/50 hover:text-indigo-500 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={14} /> Thêm hạng mục hồ sơ
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-12">
            <button 
              onClick={onClose}
              className="flex-1 px-8 py-4 rounded-2xl text-[10px] font-black uppercase text-slate-500 hover:bg-slate-500/10 transition-all"
            >
              Hủy bỏ
            </button>
            <button 
              onClick={() => onSave(formData)}
              className="flex-1 px-8 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-emerald-600/20 hover:scale-105 active:scale-95 transition-all"
            >
              Lưu thông tin
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

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

const getPhaseIndex = (step: StepName) => {
  if (step === 'S1_ChuanBi') return 0;
  if (['S2_KT_Tiep_Nhan'].includes(step)) return 1;
  if (step === 'S3_Nop_VPDK') return 2;
  if (step === 'S4_Cho_Thong_Bao_Thue') return 3;
  if (step === 'S5_Tai_Chinh_Khach_Hang') return 4;
  if (step === 'S6_Nhan_So_GCN') return 5;
  if (['S7_Ban_Giao_Luu_Kho', 'Hoan_Tat'].includes(step)) return 6;
  return -1;
};

const getTaxStatus = (app: Application) => {
  if (app.status === 'Error') return { label: 'Sai sót/Vướng mắc', color: 'text-rose-500' };
  if (!app.taxNotificationReceivedDate) return { label: 'Chưa có TB thuế', color: 'text-slate-500' };
  if (!app.taxReceiptDate) return { label: 'Chưa hoàn thành', color: 'text-amber-500' };
  return { label: 'Hoàn thành', color: 'text-emerald-500' };
};

const getOverdueInfo = (app: Application, stepConfig: Record<string, any>, slaConfig: Record<string, number>) => {
  const currentStep = app.currentStep;
  const config = stepConfig[currentStep];
  if (!config || currentStep === 'Hoan_Tat') return { isOverdue: false, daysLate: 0 };

  const sla = slaConfig[config.label] || config.slaDays || 10;
  
  let comparisonDate: string | undefined;
  
  // Mapping current step to the date it started (or the date of the previous step)
  const mapping: Record<string, keyof Application> = {
    // Workflow 2
    S1_ChuanBi: 'contractSigningDate',
    S2_KT_Tiep_Nhan: 'receivedDate',
    S2_KT_Ban_giao: 'receivedDate',
    S3_Nop_VPDK: 'accountingHandoverDate', // Or receivedDate if not set
    S4_Cho_Thong_Bao_Thue: 'submissionDate',
    S5_Tai_Chinh_Khach_Hang: 'taxNotificationDate',
    S6_Nhan_So_GCN: 'taxReceiptDate',
    S7_Ban_Giao_Luu_Kho: 'gcnReceivedDate',
    
    // Workflow 1
    GD1_ChuanBi: 'contractSigningDate',
    GD1_Cho_KT_TiepNhan: 'receivedDate',
    GD2_Cho_Nop_VPDK: 'receivedDate',
    GD2_Cho_PTDA_TiepNhan: 'submissionDate',
    GD3_Cho_TBThue: 'submissionDate',
    GD4_Cho_Nop_NVTC: 'taxNotificationDate',
    GD5_Cho_GCN: 'taxReceiptDate',
    GD6_Cho_BG_Khach: 'gcnReceivedDate'
  };

  comparisonDate = app[mapping[currentStep] || 'receivedDate'] as string | undefined;
  
  if (comparisonDate) {
    const days = calculateDaysDiff(comparisonDate);
    if (days > sla) {
      return { isOverdue: true, daysLate: days - sla, label: `Trễ ${config.label}` };
    }
  }

  return { isOverdue: false, daysLate: 0 };
};

const UserManagementView = ({ users, onEdit, onDelete, onCreate, onResetPassword, theme }: { users: UserProfile[]; onEdit: (u: UserProfile) => void; onDelete: (id: string) => void; onCreate: () => void; onResetPassword: (u: UserProfile) => void; theme: 'light' | 'dark' }) => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <header className="flex justify-between items-end text-left">
      <div>
         <h2 className={cn("text-3xl font-black italic font-serif tracking-tight", theme === 'light' ? "text-slate-900" : "text-white")}>Quản trị người dùng</h2>
         <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Phân quyền & Điều phối dự án</p>
      </div>
      <button 
        onClick={onCreate}
        className="flex items-center gap-2 px-6 py-3 bg-festive-gold text-slate-900 rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-festive-gold/20 hover:scale-105 active:scale-95 transition-all outline-none"
      >
        <Plus size={16} /> Thêm tài khoản
      </button>
    </header>

    <div className={cn(
      "backdrop-blur-xl border rounded-[2.5rem] overflow-hidden shadow-2xl transition-all",
      theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900/40 border-slate-800"
    )}>
      <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
        <table className="w-full text-left">
          <thead>
            <tr className={cn(
              "border-b transition-all",
              theme === 'light' ? "bg-slate-50 border-slate-100" : "bg-slate-950/50 border-slate-800"
            )}>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Nhân sự</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Phòng ban</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest italic text-center">Quyền hạn</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest italic text-center">Dự án quản lý</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest italic text-center">Trạng thái</th>
              <th className="px-8 py-6 text-right"></th>
            </tr>
          </thead>
          <tbody className={cn(
            "divide-y transition-all",
            theme === 'light' ? "divide-slate-50" : "divide-slate-800/50"
          )}>
            {users.map(user => (
              <tr key={user.id} className={cn(
                "group transition-all",
                theme === 'light' ? "hover:bg-slate-50" : "hover:bg-slate-800/20"
              )}>
                <td className="px-8 py-5 text-left">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center text-sm font-black text-white italic shadow-inner">
                      {(user.name || 'User').split(' ').pop()?.charAt(0)}
                    </div>
                    <div>
                      <p className={cn("text-sm font-bold", theme === 'light' ? "text-slate-800" : "text-slate-100")}>{user.name || 'Unknown'}</p>
                      <p className="text-[10px] text-slate-500 font-mono italic">@{user.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className={cn(
                    "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all",
                    user.dept === 'ADMIN' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                    user.dept === 'DIRECTOR' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                    user.dept === 'MANAGER' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                    user.dept === 'PTT' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    user.dept === 'KT' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    user.dept === 'PTDA' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-slate-700 text-slate-400 border-slate-600'
                  )}>
                    {user.dept}
                  </span>
                </td>
                <td className="px-8 py-5 text-center">
                  <span className={cn(
                    "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border",
                    user.permission === 'FULL' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                    user.permission === 'EDIT' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  )}>
                    {user.permission === 'FULL' ? 'Toàn quyền' : user.permission === 'EDIT' ? 'Được sửa' : 'Chỉ xem'}
                  </span>
                </td>
                <td className="px-8 py-5 text-center">
                  <span className="text-xs font-black text-slate-500 italic">{(user.assignedProjectIds || []).length} Dự án</span>
                </td>
                <td className="px-8 py-5 text-center">
                   <div className="flex items-center justify-center gap-2">
                     <span className={cn("inline-block w-1.5 h-1.5 rounded-full shadow-sm", user.status === 'Active' ? 'bg-emerald-400 shadow-emerald-400/50' : 'bg-slate-600')} />
                     <span className="text-[10px] font-black uppercase text-slate-400">{user.status}</span>
                   </div>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                     <button 
                      onClick={() => onResetPassword(user)}
                      className="p-2 rounded-lg bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white transition-all shadow-lg border border-orange-500/20"
                      title="Reset mật khẩu"
                     >
                       <Key size={14} />
                     </button>
                     <button 
                      onClick={() => onEdit(user)}
                      className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all shadow-lg"
                     >
                       <Settings size={14} />
                     </button>
                     <button 
                      onClick={() => onDelete(user.id)}
                      className="p-2 rounded-lg bg-slate-800 text-rose-500/70 hover:bg-rose-500 hover:text-white transition-all shadow-lg"
                     >
                       <Trash2 size={14} />
                     </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

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

const HandoverRecord = ({ apps, user, template }: { apps: Application[], user: UserProfile | null, template: any }) => {
  const today = new Date();
  return (
    <div id="print-section" className="p-10 text-black bg-white min-h-screen">
      <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-4">
        <div>
          <h1 className="text-xl font-bold uppercase">{template.companyName}</h1>
          <p className="text-xs italic">{template.subTitle}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold">{template.docCode}</p>
          <p className="text-xs">Số: ....................</p>
        </div>
      </div>

      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold uppercase mt-4">{template.title}</h2>
        <h3 className="text-xl font-bold uppercase">{template.subTitle2}</h3>
        <p className="italic mt-2">Ngày {formatDate(today)}</p>
      </div>

      <div className="mb-6 space-y-2">
        <p><strong>Người giao:</strong> {user?.name || '................................'}</p>
        <p><strong>Bộ phận:</strong> {user?.dept || '................................'}</p>
        <p><strong>Địa chỉ:</strong> {template.address}</p>
      </div>

      <div className="mb-8">
        <table className="w-full border-collapse border border-black text-sm">
          <thead>
            <tr className="bg-gray-100 font-bold">
              <th className="border border-black px-2 py-2 w-12 text-center">STT</th>
              <th className="border border-black px-2 py-2 text-center">Mã lô/Căn</th>
              <th className="border border-black px-2 py-2 text-center">Chủ tài sản</th>
              <th className="border border-black px-2 py-2 text-center">Đối tượng</th>
              <th className="border border-black px-2 py-2 text-center">Dự án</th>
              <th className="border border-black px-2 py-2 text-center">Tình trạng</th>
              <th className="border border-black px-2 py-2 text-center">Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {apps.map((app, idx) => (
              <React.Fragment key={app.id}>
                <tr className="border-b border-black">
                  <td className="border border-black px-2 py-2 text-center">{idx + 1}</td>
                  <td className="border border-black px-2 py-2 font-bold">{app.unitCode}</td>
                  <td className="border border-black px-2 py-2">{app.customerName}</td>
                  <td className="border border-black px-2 py-2 text-center text-xs">{app.contractSignerType || 'Cá nhân'}</td>
                  <td className="border border-black px-2 py-2 text-xs">{app.projectName}</td>
                  <td className="border border-black px-2 py-2 text-center text-xs">Đã có GCN</td>
                  <td className="border border-black px-2 py-2 whitespace-nowrap">
                    {app.scannedFiles && app.scannedFiles.length > 0 && (
                      <div className="flex flex-col gap-0.5 text-[8px] italic">
                        {app.scannedFiles.map(f => (
                          <span key={f.id} className="truncate max-w-[100px]">• {f.name}</span>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
                {app.scannedFiles && app.scannedFiles.length > 0 && (
                  <tr className="no-print bg-slate-50 border-x border-black">
                    <td colSpan={7} className="px-10 py-1 text-[9px] text-blue-600">
                      <span className="font-bold text-gray-500 mr-2 italic">Liên kết tài liệu Số:</span>
                      {app.scannedFiles.map((f, fIdx) => (
                        <a 
                          key={f.id} 
                          href={f.url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="hover:underline mr-4 inline-flex items-center gap-1"
                        >
                          [{fIdx + 1}] {f.name}
                        </a>
                      ))}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {apps.length === 0 && Array.from({length: 5}).map((_, i) => (
              <tr key={i}>
                <td className="border border-black px-2 py-2 h-8"></td>
                <td className="border border-black px-2 py-2"></td>
                <td className="border border-black px-2 py-2"></td>
                <td className="border border-black px-2 py-2"></td>
                <td className="border border-black px-2 py-2"></td>
                <td className="border border-black px-2 py-2"></td>
                <td className="border border-black px-2 py-2"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 mt-16 text-center">
        <div>
          <p className="font-bold uppercase mb-20 text-sm">Người giao</p>
          <p className="font-bold italic">{user?.name}</p>
        </div>
        <div>
          <p className="font-bold uppercase mb-20 text-sm">Người nhận</p>
          <p className="italic">(Ký và ghi rõ họ tên)</p>
        </div>
      </div>

      <div className="mt-20 pt-10 text-[10px] italic border-t border-gray-200">
        <p>{template.footerNote1}</p>
        <p>{template.footerNote2}</p>
      </div>
    </div>
  );
};

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const [taskReminders, setTaskReminders] = useState<AppNotification[]>([]);
  const [isPrintingHandover, setIsPrintingHandover] = useState(false);
  const [printHandoverApps, setPrintHandoverApps] = useState<Application[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stepConfig, setStepConfig] = useState<Record<string, { label: string, dept: Dept, status: UnitStatus, slaDays?: number, active: boolean }>>(INITIAL_STEP_CONFIG);
  const [projects, setProjects] = useState<Project[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(true);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
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
  const [handoverTemplate, setHandoverTemplate] = useState(() => {
    const saved = localStorage.getItem('procedural_handover_template');
    return saved ? JSON.parse(saved) : {
      companyName: 'TẬP ĐOÀN SUNGROUP',
      subTitle: 'Vùng Đà Nẵng',
      docCode: 'Mẫu HC-09-BM04',
      title: 'BIÊN BẢN BÀN GIAO',
      subTitle2: 'Nội dung bàn giao',
      address: 'Phường Hòa Hiệp Nam, Quận Liên Chiểu, TP Đà Nẵng',
      footerNote1: 'Người bàn giao: Ký và ghi rõ họ tên.',
      footerNote2: 'Người nhận: Ký và ghi rõ họ tên.'
    };
  });
  
  const handleUpdatePassword = async () => {
    if (!currentUser) return;
    if (!passwordForm.newPassword) {
      showToast('Vui lòng nhập mật khẩu mới', 'warning');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('Mật khẩu xác nhận không khớp', 'error');
      return;
    }
    
    // Check current password (using direct comparison)
    if (passwordForm.currentPassword !== currentUser.password) {
      showToast('Mật khẩu hiện tại không chính xác', 'error');
      return;
    }

    setIsSavingApp(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          password: passwordForm.newPassword, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', currentUser.id);

      if (error) throw error;
      
      showToast('Đổi mật khẩu thành công!', 'success');
      setIsChangePasswordModalOpen(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      // Real-time synchronization will update the currentUser state across sessions
    } catch (error) {
      console.error('Update password error:', error);
      showToast('Lỗi khi đổi mật khẩu', 'error');
    } finally {
      setIsSavingApp(false);
    }
  };

  // Real-time synchronization for current user profile and records
  useEffect(() => {
    if (!currentUser?.id) return;

    const profileChannel = supabase
      .channel(`profile-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${currentUser.id}`,
        },
        (payload) => {
          console.log('Real-time profile sync:', payload.new);
          const updatedUser = mapUserFromSnakeCase(payload.new);
          setCurrentUser(updatedUser);
        }
      )
      .subscribe();

    // Subscribe to all changes in the 'records' table
    const recordsChannel = supabase
      .channel('public:records')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, and DELETE
          schema: 'public',
          table: 'records',
        },
        (payload) => {
          console.log('Real-time records sync:', payload.eventType, payload.new || payload.old);
          
          if (payload.eventType === 'INSERT') {
             const newApp = mapFromSnakeCase(payload.new);
             setApplications(prev => {
                if (prev.some(a => a.id === newApp.id)) return prev;
                return [newApp, ...prev];
             });
          } else if (payload.eventType === 'UPDATE') {
             const updatedApp = mapFromSnakeCase(payload.new);
             setApplications(prev => prev.map(a => a.id === updatedApp.id ? updatedApp : a));
          } else if (payload.eventType === 'DELETE') {
             const deletedId = payload.old.id;
             setApplications(prev => prev.filter(a => a.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(recordsChannel);
    };
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
            configMap[c.key] = typeof c.value === 'string' ? JSON.parse(c.value) : c.value;
          });
        }
          
        if (configData) {
          const currentSla = configMap.slaConfig || Object.values(INITIAL_STEP_CONFIG).reduce((acc: any, s: any) => ({ ...acc, [s.label]: 10 }), {});
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
          const currentProjects = configMap.projects || PROJECTS;

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

        // Fetch records is handled separately, just ensure pagination is triggered
        fetchApplications();
        
        setIsLoadingConfig(false);
        setIsInitialLoading(false);
      } catch (e) {
         console.error('Error initializing:', e);
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
      
      if (searchTerm) {
        query = query.or(`unit_code.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%,project_name.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%`);
      }

      if (selectedProjectId && selectedProject) {
        query = query.eq('project_name', selectedProject.name);
      }
      
      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1);
        
      if (error) throw error;
      
      console.log('Fetched data:', data);
      
      setApplications((data || []).map(mapFromSnakeCase));
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching paginated records:', error);
      showToast('Lỗi tải dữ liệu hồ sơ.', 'error');
    } finally {
      setIsLoadingApps(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchApplications();
    }, 500);
    
    return () => clearTimeout(handler);
  }, [searchTerm, currentPage, pageSize, selectedProjectId]);

  useEffect(() => {
    if (applications.length > 0) localStorage.setItem('procedural_apps', JSON.stringify(applications));
  }, [applications]);

  useEffect(() => {
    if (users.length > 0) localStorage.setItem('procedural_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (projects.length > 0) localStorage.setItem('procedural_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('procedural_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('procedural_current_user');
    }
  }, [currentUser]);

  const deleteAllNotificationsForRecord = async (recordId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('record_id', recordId);
      if (error) throw error;
      setNotifications(prev => prev.filter(n => n.appId !== recordId));
    } catch (error) {
      console.error('Error deleting notifications for record:', error);
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
    }
  };

  const createNotification = async (noti: Partial<AppNotification>) => {
    try {
      const snakeData = mapNotificationToSnakeCase(noti);
      const { error } = await supabase.from('notifications').insert(snakeData);
      if (error) throw error;
    } catch (error) {
      console.error('Error creating notification:', error);
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
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    fetchNotifications(currentUser.id);

    const channel = supabase
      .channel(`user-notifications-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`,
        },
        (payload: any) => {
          const newNoti = mapNotificationFromSnakeCase(payload.new);
          setNotifications(prev => [newNoti, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  // Load current user on boot
  useEffect(() => {
    const saved = localStorage.getItem('procedural_current_user');
    if (saved) {
      setCurrentUser(JSON.parse(saved));
    }
  }, []);
  // Automated Task Reminders
  useEffect(() => {
    if (!currentUser) return;
    
    const role = currentUser.dept;
    const reminders: AppNotification[] = [];

    applications.forEach(app => {
      const step = stepConfig[app.currentStep];
      if (!step) return;

      // 1. New apps needing attention (Step dept matches user dept)
      if (step.dept === role && app.status !== 'Completed') {
        const isNew = !app.history.find(h => h.performedBy === currentUser.id);
        
        if (app.status === 'Error' || app.isRejected) {
          reminders.push({
            id: `rem-err-${app.id}`,
            recipientId: currentUser.id,
            title: 'Khắc phục sai sót',
            message: `Lô ${app.unitCode} đang có lỗi hoặc bị trả về. Cần xử lý ngay.`,
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
            message: `Bạn có hồ sơ ${app.unitCode} mới chuyển đến giai đoạn ${step.label}.`,
            time: 'Chờ tiếp nhận',
            type: 'Warning',
            isRead: false,
            appId: app.id
          });
        }
      }

      // 2. SLA Check
      const overdueInfo = getOverdueInfo(app, stepConfig, slaConfig);
      if (overdueInfo.isOverdue) {
        reminders.push({
          id: `rem-sla-${app.id}`,
          recipientId: currentUser.id,
          title: 'Trễ hạn SLA',
          message: `Hồ sơ ${app.unitCode}: ${overdueInfo.label} (${overdueInfo.daysLate} ngày). Cần xử lý gấp.`,
          time: 'Quá hạn',
          type: 'Urgent',
          isRead: false,
          appId: app.id
        });
      }
    });

    setTaskReminders(reminders);
  }, [applications, currentUser, stepConfig]);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'applications' | 'users' | 'resources' | 'reports' | 'settings'>('dashboard');

  useEffect(() => {
    if (activeTab === 'settings') {
      fetchStorageUsage();
    }
  }, [activeTab]);
  const userRole = useMemo(() => currentUser?.dept || 'PTT', [currentUser]);
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
        setExpandedSections(['PTT_SECTION']);
      } else if (userRole === 'KT') {
        setExpandedSections(['KT_SECTION']);
      } else if (userRole === 'PTDA') {
        setExpandedSections(['PTDA_SECTION']);
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
  
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [projectSearch, setProjectSearch] = useState('');
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'warning' } | null>(null);
  const [isSavingApp, setIsSavingApp] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        if (selectedApp && !isEditing && currentUser?.permission !== 'VIEW') {
          e.preventDefault();
          setIsEditing(true);
          setEditApp(selectedApp);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedApp, isEditing, currentUser]);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [expandedSidebarRegions, setExpandedSidebarRegions] = useState<Record<string, boolean>>({});
  const [dashboardFilter, setDashboardFilter] = useState<'ALL' | 'OVERDUE' | 'ERROR' | 'COMPLETED' | 'PTT_PROCESSING' | 'PTT_HOLDING' | 'PTT_ISSUES' | 'PTT_TAX_UNPAID' | 'PTT_WAITING_HANDOVER' | 'KT_ALL' | 'KT_NEED_RECEIVE' | 'KT_PROCESSING' | 'KT_ISSUES' | 'PTDA_RECEIVED' | 'PTDA_NO_TAX' | 'PTDA_TAX_PENDING' | 'PTDA_GCN_WAITING' | 'PTDA_ISSUES'>('ALL');
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
  const [detailTab, setDetailTab] = useState<'Workflow' | 'Audit' | 'Documents'>('Workflow');
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

    const updatedApp = { ...app, ...editData };

    setIsSavingApp(true);
    try {
      await syncRecordToSupabase(updatedApp);
      
      setApplications(prev => prev.map(a => a.id === id ? updatedApp : a));
      if (selectedApp?.id === id) setSelectedApp(updatedApp);

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

  const [filterSLAStatus, setFilterSLAStatus] = useState<'ALL' | 'OVERDUE'>('ALL');
  const [isBulkNoteOpen, setIsBulkNoteOpen] = useState(false);
  const [bulkNoteText, setBulkNoteText] = useState('');
  
  const [isBulkIssueOpen, setIsBulkIssueOpen] = useState(false);
  const [bulkIssueNote, setBulkIssueNote] = useState('');
  const [bulkIssueType, setBulkIssueType] = useState<IssueType>('Other');
  const [bulkIssueSeverity, setBulkIssueSeverity] = useState<IssueSeverity>('Moderate');
  const [bulkIssueSource, setBulkIssueSource] = useState<IssueCategory>('None');

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

        const updated = { ...mergedApp, updated_at: nowStr };
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
        const { error } = await supabase.from('records').upsert(updatePayloads, { onConflict: 'id' });
        if (error) throw new Error(`Supabase error: ${error.message}`);
        
        setApplications(updatedAppsLocal);
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
  const [filterStep, setFilterStep] = useState<StepName | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<UnitStatus | 'ALL'>('ALL');
  const [filterLoanStatus, setFilterLoanStatus] = useState<'Co_Vay' | 'Khong_Vay' | 'ALL'>('ALL');
  const [filterSelfService, setFilterSelfService] = useState<'YES' | 'NO' | 'ALL'>('ALL');
  const [isShowFilters, setIsShowFilters] = useState(false);
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
    const sourceApps = selectedProjectId ? filteredByProjectApps : applications;

    if (userRole === 'ADMIN' || userRole === 'DIRECTOR') {
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
        app.issueNotes ? `[${app.issueType || 'Other'}] ${app.issueNotes}` : ''
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
        app.issueNotes ? `[${app.issueType || 'Other'}] ${app.issueNotes}` : ''
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

  const handleImportTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];
      const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      let updatedCount = 0;
      let createdCount = 0;

      const newApplications = [...applications];

      excelData.slice(1).forEach((row) => {
        if (!row || row.length < 2) return;
        const unitCode = row[1];
        if (!unitCode) return;

        if (userRole === 'ADMIN' || userRole === 'DIRECTOR') {
          const existingIndex = newApplications.findIndex(a => a.unitCode === unitCode);
          
          const app = existingIndex > -1 ? { ...newApplications[existingIndex] } : {
             id: `admin-imp-${Date.now()}-${Math.random()}`,
             unitCode: unitCode,
             history: [{ id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, stepName: 'Quản trị viên Import', dept: 'ADMIN', receivedDate: new Date().toISOString().split('T')[0] }]
          } as Application;

          app.projectName = row[0] || app.projectName || projects[0].name;
          app.customerName = row[2] || app.customerName || '---';
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

          if (existingIndex > -1) {
            newApplications[existingIndex] = app;
            updatedCount++;
          } else {
            app.status = 'Processing';
            app.currentStep = 'S1_ChuanBi';
            newApplications.push(app);
            createdCount++;
          }
        } else if (userRole === 'PTT') {
          const existingIndex = newApplications.findIndex(a => a.unitCode === unitCode);
          const app = existingIndex > -1 ? { ...newApplications[existingIndex] } : {
             id: `ptt-imp-${Date.now()}-${Math.random()}`,
             unitCode: unitCode,
             status: 'Processing',
             currentStep: 'S1_ChuanBi',
             history: [{ id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, stepName: 'PTT Import', dept: 'PTT', receivedDate: new Date().toISOString().split('T')[0] }]
          } as Application;

          app.projectName = row[0] || app.projectName || projects[0].name;
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

          if (existingIndex > -1) {
            newApplications[existingIndex] = app;
            updatedCount++;
          } else {
            newApplications.push(app);
            createdCount++;
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
              app.issueType = 'Other';
            }
            newApplications[idx] = app;
            updatedCount++;
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
              app.issueType = 'Other';
            }
            newApplications[idx] = app;
            updatedCount++;
          }
        }
      });

      setApplications(newApplications);
      showToast(`Hoàn tất nhập liệu: Cập nhật ${updatedCount} hồ sơ, Tạo mới ${createdCount} hồ sơ.`);
      setActiveTab('applications');
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

  const handleUpdateApp = async () => {
    if (!editApp || !selectedApp) return;
    setIsSavingApp(true);
    
    try {
      const auditEntry: AuditTrailEntry = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: currentUser?.id || 'admin',
        userName: currentUser?.name || 'Admin',
        timestamp: new Date().toLocaleString('vi-VN'),
        action: 'Cập nhật thông tin hồ sơ',
        changes: 'Chỉnh sửa bởi Admin/Quản lý'
      };

      const updatedApp = {
        ...editApp,
        auditTrail: [auditEntry, ...(editApp.auditTrail || [])]
      };

      await syncRecordToSupabase(updatedApp);

      setApplications(prev => prev.map(app => app.id === updatedApp.id ? updatedApp : app));
      setSelectedApp(updatedApp);
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

  const handleDeleteApp = async (id: string, code: string) => {
    if (userRole !== 'ADMIN') {
      showToast('Bạn không có quyền thực hiện thao tác này!', 'error');
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa hồ sơ căn ${code}? Thao tác này không thể hoàn tác.`)) {
      try {
        const { error } = await supabase
          .from('records')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setApplications(prev => prev.filter(app => app.id !== id));
        if (selectedApp?.id === id) {
          setSelectedApp(null);
          setIsEditing(false);
          setEditApp(null);
        }
        showToast('Đã xóa hồ sơ khỏi Supabase thành công', 'success');
      } catch (error) {
        console.error('Supabase delete error:', error);
        showToast('Lỗi khi xóa dữ liệu trên Supabase.', 'error');
      }
    }
  };

  const handleStepTransition = async (nextStep: StepName, note?: string) => {
    const app = editApp || selectedApp;
    if (!app) return;
    
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
        if (nextIdx > currentIdx + 1) {
          showToast('Không được nhảy cóc quá trình. Vui lòng chuyển đúng bước tuần tự.', 'error');
          // We can allow ADMIN/MANAGER to jump steps, but others must be step by step.
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
            showToast('Bắt buộc nhập Ngày nhận GNT / Nộp thuế trước khi chuyển bước.', 'warning');
            return;
          }
        }
        if (app.currentStep === 'S5_1_PTDA_TiepNhan' && nextStep === 'S6_Nhan_So_GCN') {
          if (!app.gcnSignedDate) {
            showToast('Bắt buộc nhập Ngày trình ký/In GCN trước khi chuyển bước.', 'warning');
            return;
          }
        }
        if (app.currentStep === 'S6_Nhan_So_GCN' && nextStep === 'S7_Ban_Giao_Luu_Kho') {
          if (!app.ptdaHandoverDate) {
            showToast('Bắt buộc nhập Ngày bàn giao GCN cho PTT trước khi chuyển bước.', 'warning');
            return;
          }
        }
        if (app.currentStep === 'S7_Ban_Giao_Luu_Kho' && nextStep === 'Hoan_Tat') {
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
          if (!app.submissionLocation || !app.vpdkCode || !app.submissionDate) {
            showToast('Yêu cầu nhập đầy đủ: Nơi nộp, Mã hồ sơ/Số phiếu hẹn và Ngày nộp VPĐK.', 'warning');
            return;
          }
        }
      }
    }

    // Smart logic for self-service: jump over intermediate processing steps
    let targetStep = nextStep;

    const intermediateSteps: StepName[] = [
      'S2_KT_Tiep_Nhan', 'S2_KT_Ban_giao', 'S3_Nop_VPDK',
      'S4_Cho_Thong_Bao_Thue', 'S5_Tai_Chinh_Khach_Hang', 'S6_Nhan_So_GCN', 'S7_Ban_Giao_Luu_Kho'
    ];
    if (app.isSelfService && intermediateSteps.includes(nextStep)) {
      targetStep = 'Hoan_Tat';
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
      if (targetStep === 'S2_KT_Tiep_Nhan' && !app.accountingHandoverDate) autoDates.accountingHandoverDate = nowStr;
      if (targetStep === 'S3_Nop_VPDK' && !app.submissionDate) autoDates.submissionDate = nowStr;
      
      if (targetStep === 'S4_Cho_Thong_Bao_Thue') {
        if (!app.taxNotificationDate) autoDates.taxNotificationDate = nowStr;
        if (!app.taxNoticeProvisionDate) autoDates.taxNoticeProvisionDate = nowStr;
      }
      if (targetStep === 'S5_1_PTDA_TiepNhan' && !app.taxReceiptDate) autoDates.taxReceiptDate = nowStr;
      if (targetStep === 'S6_Nhan_So_GCN' && !app.gcnSignedDate) autoDates.gcnSignedDate = nowStr;
      if (targetStep === 'S7_Ban_Giao_Luu_Kho' && !app.ptdaHandoverDate) autoDates.ptdaHandoverDate = nowStr;
      if (targetStep === 'Hoan_Tat' && !app.customerHandoverDate) autoDates.customerHandoverDate = nowStr;
    }

    // Auto handover status
    autoDates.isHandedOver = true;
    autoDates.handoverDate = nowStr;

    let targetStatus = (stepConfig[targetStep] || INITIAL_STEP_CONFIG[targetStep]).status;
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
      history: newHistory
    };

    try {
      await syncRecordToSupabase(updatedApp);
      await notifyNextDepartment(updatedApp, targetStep);

      // Cleanup notifications if complete
      if (targetStep === 'Hoan_Tat') {
        await deleteAllNotificationsForRecord(app.id);
      }

      setApplications(prev => prev.map(a => a.id === app.id ? updatedApp : a));
      setSelectedApp(updatedApp);
      setEditApp(null);
      setIsEditing(false);
      showToast(`Đã chuyển hồ sơ sang bước: ${(stepConfig[targetStep] || INITIAL_STEP_CONFIG[targetStep]).label} (Đã đồng bộ Supabase)`, 'success');
    } catch (error) {
      console.error('Supabase transition error:', error);
      showToast('Lỗi khi cập nhật trạng thái lên Supabase.', 'error');
    }
  };

  const handleBulkStepTransition = (nextStep: StepName, overrideIds?: string[]) => {
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
    else if (nextStep === 'S4_Cho_Thong_Bao_Thue') updateField = { key: 'taxNotificationReceivedDate', label: 'Ngày nhận TB Thuế' };
    else if (nextStep === 'S5_Tai_Chinh_Khach_Hang') updateField = { key: 'taxNoticeProvisionDate', label: 'Ngày cung cấp phiếu nộp tiền' };
    else if (nextStep === 'S5_1_PTDA_TiepNhan') updateField = { key: 'taxReceiptDate', label: 'Ngày nhận GNT / Nộp thuế', isRequired: true };
    else if (nextStep === 'S6_Nhan_So_GCN') updateField = { key: 'gcnSignedDate', label: 'Ngày trình ký/In GCN', isRequired: true };
    else if (nextStep === 'S7_Ban_Giao_Luu_Kho') updateField = { key: 'ptdaHandoverDate', label: 'Ngày bàn giao GCN cho PTT', isRequired: true };
    else if (nextStep === 'Hoan_Tat') updateField = { key: 'customerHandoverDate', label: 'Ngày BG GCN cho khách', isRequired: true };

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
    if (nextStep === 'S4_Cho_Thong_Bao_Thue' || nextStep === 'S3_Nop_VPDK') {
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
        const nextIdx = workflowSteps.indexOf(nextStep);
        
        if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
          if (nextIdx !== currentIdx + 1) {
            return app;
          }
        }

        actuallyUpdatedCount++;

        // Apply bulk date update if provided
        let appWithDate = { ...app };
        if (bulkTransitionField && dateValue) {
          (appWithDate as any)[bulkTransitionField.key] = dateValue;
        }

        if (nextStep === 'S4_Cho_Thong_Bao_Thue' || nextStep === 'S3_Nop_VPDK') {
          appWithDate.submissionLocation = location as any;
          appWithDate.vpdkCode = refCode;
        }

        // Check chronology for all selected apps
        const chronoError = validateDateSequence(appWithDate);
        if (chronoError) {
          chronoErrors.push(`Căn ${appWithDate.unitCode}: ${chronoError}`);
        }
        
        let targetStep = nextStep;

        const intermediateSteps: StepName[] = [
          'S2_KT_Tiep_Nhan', 'S2_KT_Ban_giao', 'S3_Nop_VPDK',
          'S4_Cho_Thong_Bao_Thue', 'S5_Tai_Chinh_Khach_Hang', 'S6_Nhan_So_GCN', 'S7_Ban_Giao_Luu_Kho'
        ];
        if (appWithDate.isSelfService && intermediateSteps.includes(nextStep)) {
          targetStep = 'Hoan_Tat';
        }
        
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
        
        if (targetStep === 'S4_Cho_Thong_Bao_Thue') {
          if (!appWithDate.taxNotificationDate) autoDates.taxNotificationDate = nowStr;
          if (!appWithDate.taxNoticeProvisionDate) autoDates.taxNoticeProvisionDate = nowStr;
        }
        if (targetStep === 'S5_1_PTDA_TiepNhan' && !appWithDate.taxReceiptDate) autoDates.taxReceiptDate = nowStr;
        if (targetStep === 'S6_Nhan_So_GCN') {
          // If we are at S6, we should have gcnSignedDate (set by bulk modal)
          if (!appWithDate.gcnSignedDate) autoDates.gcnSignedDate = nowStr;
        }
        if (targetStep === 'S7_Ban_Giao_Luu_Kho' && !appWithDate.ptdaHandoverDate) autoDates.ptdaHandoverDate = nowStr;
        if (targetStep === 'Hoan_Tat' && !appWithDate.customerHandoverDate) autoDates.customerHandoverDate = nowStr;

        // Auto handover logic
        autoDates.isHandedOver = true;
        autoDates.handoverDate = bulkTransitionField && dateValue ? dateValue : nowStr;

        let targetStatus = (stepConfig[targetStep] || INITIAL_STEP_CONFIG[targetStep]).status;
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
          history: newHistory
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
      const { error } = await supabase
        .from('records')
        .upsert(appsToSync.map(app => mapToSnakeCase(app)));

      if (error) throw error;

      // Notifications for bulk transition
      await Promise.all(appsToSync.map(app => notifyNextDepartment(app, app.currentStep)));

      // Cleanup notifications for finished apps
      if (nextStep === 'Hoan_Tat') {
        await Promise.all(selectedAppIds.map(id => deleteAllNotificationsForRecord(id)));
      }

      setApplications(updatedApps);
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

  const handleBulkReportIssue = async () => {
    if (selectedAppIds.length === 0 || !bulkIssueNote.trim()) return;

    try {
      const appsToUpdate = applications.filter(app => selectedAppIds.includes(app.id));
      const updatedApps = appsToUpdate.map(app => 
        updateAppIssue(app, bulkIssueNote, bulkIssueType, bulkIssueSource, bulkIssueSeverity)
      );

      setApplications(prev => prev.map(app => {
        const updated = updatedApps.find(u => u.id === app.id);
        return updated || app;
      }));

      // Sync to Supabase
      await Promise.all(updatedApps.map(app => syncRecordToSupabase(app)));

      showToast(`Đã ghi nhận vướng mắc cho ${selectedAppIds.length} hồ sơ.`, 'success');
      setIsBulkIssueOpen(false);
      setBulkIssueNote('');
      setSelectedAppIds([]);
    } catch (err) {
      console.error('Error reporting bulk issue:', err);
      showToast('Có lỗi xảy ra khi ghi nhận vướng mắc hàng loạt.', 'error');
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
      const { error } = await supabase
        .from('records')
        .delete()
        .in('id', selectedAppIds);

      if (error) throw error;

      setApplications(prev => prev.filter(app => !selectedAppIds.includes(app.id)));
      setSelectedAppIds([]);
      showToast(`Đã xóa hàng loạt ${count} hồ sơ khỏi Supabase thành công.`, 'success');
    } catch (error) {
      console.error('Supabase bulk delete error:', error);
      showToast('Lỗi khi xóa hàng loạt trên Supabase.', 'error');
    } finally {
      setIsSavingApp(false);
    }
  };

  const handleBulkUpdateNote = async () => {
    if (selectedAppIds.length === 0 || !bulkNoteText.trim()) return;
    setIsSavingApp(true);
    
    try {
      const updatedApps = applications.map(app => {
        if (selectedAppIds.includes(app.id)) {
          return { ...app, note: bulkNoteText };
        }
        return app;
      });

      const appsToSync = updatedApps.filter(app => selectedAppIds.includes(app.id));

      // Perform bulk upsert to Supabase
      const { error } = await supabase
        .from('records')
        .upsert(appsToSync.map(app => mapToSnakeCase(app)));

      if (error) throw error;

      setApplications(updatedApps);
      showToast(`Đã cập nhật ghi chú cho ${selectedAppIds.length} hồ sơ và đồng bộ Supabase thành công.`, 'success');
      setIsBulkNoteOpen(false);
      setBulkNoteText('');
      setSelectedAppIds([]);
    } catch (error) {
      console.error('Supabase bulk note update error:', error);
      showToast('Lỗi khi cập nhật ghi chú lên Supabase.', 'error');
    } finally {
      setIsSavingApp(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const app = editApp || selectedApp;
    if (!file || !app) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
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
        await syncRecordToSupabase(updatedApp);

        const updatedApps = applications.map(a => a.id === app.id ? updatedApp : a);
        setApplications(updatedApps);
        if (editApp && editApp.id === app.id) setEditApp(updatedApp);
        if (selectedApp && selectedApp.id === app.id) setSelectedApp(updatedApp);
        
        showToast(`Đã tải tài liệu "${file.name}" lên Supabase Storage thành công.`, 'success');
      } catch (error) {
        console.error('Supabase file upload error:', error);
        showToast('Lỗi khi tải tài liệu lên Supabase. Vui lòng kiểm tra quyền và bucket "Documents-GCN".', 'error');
      } finally {
        setIsSavingApp(false);
      }
    };
    reader.readAsArrayBuffer(file); // Changed from readAsDataURL since we are uploading the file object directly
    e.target.value = '';
  };

  const handleFileDelete = async (fileId: string) => {
    const app = editApp || selectedApp;
    if (!app || !window.confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) return;

    const fileToDelete = (app.scannedFiles || []).find(f => f.id === fileId);
    const updatedApp = {
      ...app,
      scannedFiles: (app.scannedFiles || []).filter(f => f.id !== fileId)
    };

    setIsSavingApp(true);
    try {
      // 1. Delete from Supabase Storage if path exists
      if (fileToDelete?.path) {
        const { error: storageError } = await supabase.storage
          .from('Documents-GCN')
          .remove([fileToDelete.path]);
        
        if (storageError) {
          console.warn('Storage delete warning:', storageError);
          // We continue anyway to update the record even if storage delete failed
        }
      }

      // 2. Update DB record
      await syncRecordToSupabase(updatedApp);

      const updatedApps = applications.map(a => a.id === app.id ? updatedApp : a);
      setApplications(updatedApps);
      if (editApp && editApp.id === app.id) setEditApp(updatedApp);
      if (selectedApp && selectedApp.id === app.id) setSelectedApp(updatedApp);
      showToast('Đã xóa tài liệu khỏi hệ thống thành công.', 'success');
    } catch (error) {
      console.error('Supabase file delete error:', error);
      showToast('Lỗi khi xóa tài liệu.', 'error');
    } finally {
      setIsSavingApp(false);
    }
  };

  const [previewFile, setPreviewFile] = useState<ScannedFile | null>(null);

  useEffect(() => {
    setPreviewFile(null);
  }, [selectedApp]);

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

  const updateAppIssue = (
    app: Application, 
    note: string, 
    type: IssueType = 'Other', 
    source: IssueCategory = 'None',
    severity: IssueSeverity = 'Moderate'
  ): Application => {
    const newHistory = [
      {
        id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        stepName: 'Ghi nhận Sai sót/Vướng mắc',
        dept: userRole as Dept,
        receivedDate: new Date().toISOString().split('T')[0],
        note: `[${source}] Vướng mắc mới: ${note}`,
        performedBy: currentUser?.id,
        performedByName: currentUser?.name
      },
      ...app.history
    ];

    return {
      ...app,
      status: 'Error' as const,
      issueNotes: note,
      issueType: type,
      issueSource: source,
      issueSeverity: severity,
      history: newHistory
    };
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
      await syncRecordToSupabase(updatedApp);

      setApplications(prev => prev.map(a => a.id === app.id ? updatedApp : a));
      setSelectedApp(updatedApp);
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
        note: 'Đã xử lý xong các sai sót/vướng mắc.',
        performedBy: currentUser?.id,
        performedByName: currentUser?.name
      },
      ...app.history
    ];

    const updatedApp = {
      ...app,
      status: stepConfig[app.currentStep]?.status || 'Processing',
      issueType: 'None',
      issueNotes: '',
      isRejected: false,
      history: newHistory
    };

    setIsSavingApp(true);
    try {
      await syncRecordToSupabase(updatedApp);

      setApplications(prev => prev.map(a => a.id === app.id ? updatedApp : a));
      setSelectedApp(updatedApp);
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
        history: newHistory
      };

      await syncRecordToSupabase(updatedApp);
      setApplications(prev => prev.map(a => a.id === appId ? updatedApp : a));
      setSelectedApp(updatedApp);
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
      ...updateAppIssue(app, reason, 'Paperwork'),
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

      const { error } = await supabase
        .from('records')
        .upsert(mapToSnakeCase(updatedApp));

      if (error) throw error;

      setApplications(prev => prev.map(a => a.id === app.id ? updatedApp : a));
      setSelectedApp(updatedApp);
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
    if (userRole === 'ADMIN' || userRole === 'DIRECTOR') return true;
    if (userRole === 'MANAGER') return false; // Managers are read-only

    // Custom restrictions
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
    if (userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'DIRECTOR') return true;

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

      // Auto-update issue type if notes are added
      if (field === 'issueNotes' && value) {
        if (!editApp.issueType || editApp.issueType === 'None') {
          nextApp.issueType = 'Other';
        }
        nextApp.status = 'Error';
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

          if (field === 'issueNotes' && value) {
            if (!app.issueType || app.issueType === 'None') {
              nextApp.issueType = 'Other';
            }
            nextApp.status = 'Error';
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
        history: [
          {
            id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            stepName: 'Chuẩn bị',
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

  const filteredByProjectApps = useMemo(() => {
    const hasProjectAssignments = currentUser?.assignedProjectIds && currentUser.assignedProjectIds.length > 0;
    
    const baseApps = applications.filter(app => {
      // If ADMIN and no specific projects assigned, show all. 
      // If has assignments, show ONLY assigned projects.
      if (userRole === 'ADMIN' && !hasProjectAssignments) return true;
      
      const project = projects.find(p => p.name === app.projectName);
      return project && (currentUser?.assignedProjectIds || []).includes(project.id);
    });

    if (!selectedProjectId) return baseApps;
    return baseApps.filter(app => app.projectName === selectedProject?.name);
  }, [selectedProjectId, selectedProject, applications, currentUser, userRole, projects]);

  const kpis: KPI = useMemo(() => {
    const processingApps = filteredByProjectApps.filter(a => {
      const step = stepConfig[a.currentStep] || INITIAL_STEP_CONFIG[a.currentStep];
      return step?.status !== 'Completed';
    });
    return {
      total: processingApps.length,
      // Aggregating by logical status from Step Config to include errors in their stages
      processing: filteredByProjectApps.filter(a => (stepConfig[a.currentStep]?.status || INITIAL_STEP_CONFIG[a.currentStep]?.status) === 'Processing').length,
      waitingVPDK: filteredByProjectApps.filter(a => (stepConfig[a.currentStep]?.status || INITIAL_STEP_CONFIG[a.currentStep]?.status) === 'WaitingVPDK').length,
      submitted: filteredByProjectApps.filter(a => (stepConfig[a.currentStep]?.status || INITIAL_STEP_CONFIG[a.currentStep]?.status) === 'Submitted').length,
      taxPending: filteredByProjectApps.filter(a => (stepConfig[a.currentStep]?.status || INITIAL_STEP_CONFIG[a.currentStep]?.status) === 'TaxPending').length,
      taxCompleted: filteredByProjectApps.filter(a => (stepConfig[a.currentStep]?.status || INITIAL_STEP_CONFIG[a.currentStep]?.status) === 'TaxCompleted').length,
      gcnIssued: filteredByProjectApps.filter(a => (stepConfig[a.currentStep]?.status || INITIAL_STEP_CONFIG[a.currentStep]?.status) === 'GCN_Issued').length,
      completed: filteredByProjectApps.filter(a => (stepConfig[a.currentStep]?.status || INITIAL_STEP_CONFIG[a.currentStep]?.status) === 'Completed').length,
      error: filteredByProjectApps.filter(a => a.status === 'Error').length,
      overdue: filteredByProjectApps.filter(a => getOverdueInfo(a, stepConfig, slaConfig).isOverdue).length,
      loanCount: processingApps.filter(a => a.loanStatus === 'Co_Vay').length,
      regularCount: processingApps.filter(a => a.loanStatus === 'Khong_Vay').length,
      rejectedCount: processingApps.filter(a => a.isRejected && a.currentStep === 'S1_ChuanBi').length,
    };
  }, [filteredByProjectApps, stepConfig, slaConfig]);

  const roleKpis = useMemo(() => {
    // Exclude completed records for active workload analysis
    const apps = filteredByProjectApps.filter(a => {
      const step = stepConfig[a.currentStep] || INITIAL_STEP_CONFIG[a.currentStep];
      return step?.status !== 'Completed';
    });
    
    // PTT
    // Requirement: PTT total should show ALL records (including completed)
    const pttTotal = filteredByProjectApps.length;
    const pttProcessing = apps.filter(a => a.status === 'Processing').length;
    const pttIssues = apps.filter(a => a.isRejected || a.status === 'Error').length;
    // PTT Tax Pending: Has tax notification (from PTDA) but not yet completed payment (no receipt date)
    const pttTaxPending = apps.filter(a => !!a.taxNotificationDate && !a.taxReceiptDate).length;
    const pttSlowest = apps.filter(a => stepConfig[a.currentStep]?.dept === 'PTT')
        .map(a => ({ ...a, overdue: getOverdueInfo(a, stepConfig, slaConfig) }))
        .filter(a => a.overdue.isOverdue)
        .sort((a, b) => (b.overdue.daysLate || 0) - (a.overdue.daysLate || 0))
        .slice(0, 5);

    // KT
    // Tổng số lượng hồ sơ đang thực hiện chưa hoàn thành (all records not complete)
    const ktTotal = apps.length;
    // Hồ sơ cần tiếp nhận: PTT đã chuyển nhưng KT chưa tiếp nhận (đang ở S2_KT_Tiep_Nhan)
    const ktNeedReceive = apps.filter(a => a.currentStep === 'S2_KT_Tiep_Nhan').length;
    // Hồ sơ đang xử lý: Đã tiếp nhận nhưng chưa bàn giao PTDA
    const ktProcessing = apps.filter(a => a.currentStep === 'S2_KT_Tiep_Nhan').length;
    // Hồ sơ sai sót
    const ktIssues = apps.filter(a => (a.isRejected || a.status === 'Error' || (a.issueType && a.issueType !== 'None')) && stepConfig[a.currentStep]?.dept === 'KT').length;

    // PTDA
    const ptdaApps = apps.filter(a => stepConfig[a.currentStep]?.dept === 'PTDA');
    // Hồ sơ đã tiếp nhận: Các hồ sơ tiếp nhận từ KT (bước 3.1)
    const ptdaReceived = apps.filter(a => a.currentStep === 'S2_KT_Ban_giao').length;
    // Chờ TB Thuế: các hồ sơ ở S3_Nop_VPDK
    const ptdaNoTax = apps.filter(a => a.currentStep === 'S3_Nop_VPDK').length;
    // Chờ hoàn thành NVTC: Các căn ở bước 5 chưa có ngày nhận GNT / Nộp thuế
    const ptdaTaxPending = apps.filter(a => a.currentStep === 'S5_Tai_Chinh_Khach_Hang' && !a.taxReceiptDate).length;
    // Chờ in/ký GCN: Các căn ở bước 6 chưa có ngày trình ký
    const ptdaGcnWaiting = apps.filter(a => a.currentStep === 'S6_Nhan_So_GCN' && !a.gcnSignedDate).length;
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
        const appsInDept = apps.filter(a => stepConfig[a.currentStep]?.dept === dept);
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
    const errorCount = apps.filter(a => a.status === 'Error').length;
    
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
    const loanApps = apps.filter(a => a.loanStatus === 'Co_Vay');
    const loanStatusStats = [
      { name: 'Đang xử lý', value: loanApps.filter(a => a.status === 'Processing').length, color: '#6366f1' },
      { name: 'Hoàn tất', value: loanApps.filter(a => a.status === 'Completed' || a.status === 'GCN_Issued').length, color: '#10b981' },
      { name: 'Vướng mắc', value: loanApps.filter(a => a.status === 'Error' || a.isRejected).length, color: '#f43f5e' },
      { name: 'Chờ duyệt', value: loanApps.filter(a => a.status === 'Pending').length, color: '#f59e0b' }
    ].filter(s => s.value > 0);

    return {
        loanStatusStats,
        ptt: { total: pttTotal, processing: pttProcessing, issues: pttIssues, taxPending: pttTaxPending, slowest: pttSlowest, waitingHandover: apps.filter(a => a.currentStep === 'S6_Nhan_So_GCN' && !a.customerHandoverDate).length },
        kt: {
            total: ktTotal,
            received: ktNeedReceive,
            processing: ktProcessing,
            issues: ktIssues
        },
        ptda: {
            received: ptdaReceived,
            noTax: ptdaNoTax,
            noTaxPaid: ptdaTaxPending,
            gcnWaiting: ptdaGcnWaiting,
            issues: ptdaIssues
        },
        admin: { slaStats: adminSlaStats, warnings: adminWarnings, deptStats }
    };
  }, [filteredByProjectApps, selectedProjectId, selectedProject, stepConfig, slaConfig]);

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
        const canCreate = userRole === 'ADMIN' || userRole === 'PTT';
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
    const getStageStats = (status: UnitStatus) => {
      const apps = filteredByProjectApps.filter(a => stepConfig[a.currentStep]?.status === status);
      return {
        total: apps.length,
        error: apps.filter(a => a.status === 'Error').length,
        normal: apps.filter(a => a.status !== 'Error').length,
      };
    };

    const processing = getStageStats('Processing');
    const waitingVPDK = getStageStats('WaitingVPDK');
    const submitted = getStageStats('Submitted');
    const taxPending = getStageStats('TaxPending');
    const taxCompleted = getStageStats('TaxCompleted');
    const gcnIssued = getStageStats('GCN_Issued');
    const completed = getStageStats('Completed');

    return [
      { 
        name: 'Đang chuẩn bị', 
        value: processing.total, 
        normal: processing.normal, 
        error: processing.error, 
        color: '#f59e0b' // Amber
      },
      { 
        name: 'CHỜ NỘP VPĐK', 
        value: waitingVPDK.total, 
        normal: waitingVPDK.normal, 
        error: waitingVPDK.error, 
        color: '#06b6d4' // Cyan
      },
      { 
        name: 'Đã nộp VPĐK', 
        value: submitted.total, 
        normal: submitted.normal, 
        error: submitted.error, 
        color: '#6366f1' // Indigo
      },
      { 
        name: 'CHỜ TB THUẾ', 
        value: taxPending.total, 
        normal: taxPending.normal, 
        error: taxPending.error, 
        color: '#f43f5e' // Rose
      },
      { 
        name: 'ĐÃ CÓ TB THUẾ', 
        value: taxCompleted.total, 
        normal: taxCompleted.normal, 
        error: taxCompleted.error, 
        color: '#fbbf24' // Yellow (Fixed color name overlap if any)
      },
      { 
        name: 'Đã có GCN', 
        value: gcnIssued.total, 
        normal: gcnIssued.normal, 
        error: gcnIssued.error, 
        color: '#0ea5e9' // Sky
      },
      { 
        name: 'Hoàn tất', 
        value: completed.total, 
        normal: completed.normal, 
        error: completed.error, 
        color: '#10b981' // Emerald
      },
    ];
  }, [filteredByProjectApps, stepConfig]);

  const overallPieData = useMemo(() => {
    const totalApps = filteredByProjectApps.length || 1;
    return chartData.map(d => ({
      name: d.name,
      value: d.value,
      percentage: Math.round((d.value / totalApps) * 100),
      color: d.color
    }));
  }, [chartData, filteredByProjectApps.length]);

  const filteredApps = filteredByProjectApps.filter(app => {
    const matchesSearch = String(app.unitCode || '').toLowerCase().includes(search.toLowerCase()) ||
      String(app.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
      String(app.projectName || '').toLowerCase().includes(search.toLowerCase());
    
    const matchesStep = filterStep === 'ALL' || app.currentStep === filterStep;
    const matchesStatus = filterStatus === 'ALL' || app.status === filterStatus;
    const matchesLoan = filterLoanStatus === 'ALL' || app.loanStatus === filterLoanStatus;
    const matchesSelfService = filterSelfService === 'ALL' || 
      (filterSelfService === 'YES' ? app.isSelfService === true : app.isSelfService !== true);
    const matchesSLA = filterSLAStatus === 'ALL' || (filterSLAStatus === 'OVERDUE' && getOverdueInfo(app, stepConfig, slaConfig).isOverdue);
    
    const matchesDashboardFilter = 
      dashboardFilter === 'ALL' ||
      (dashboardFilter === 'OVERDUE' && getOverdueInfo(app, stepConfig, slaConfig).isOverdue) ||
      (dashboardFilter === 'ERROR' && app.status === 'Error') ||
      (dashboardFilter === 'COMPLETED' && app.status === 'Completed') ||
      (dashboardFilter === 'PTT_PROCESSING' && app.status === 'Processing') ||
      (dashboardFilter === 'PTT_HOLDING' && stepConfig[app.currentStep]?.dept === 'PTT') ||
      (dashboardFilter === 'PTT_ISSUES' && (app.isRejected || app.status === 'Error')) ||
      (dashboardFilter === 'PTT_TAX_UNPAID' && !!app.taxNotificationDate && !app.taxReceiptDate) ||
      (dashboardFilter === 'PTT_WAITING_HANDOVER' && app.currentStep === 'S6_Nhan_So_GCN' && !app.customerHandoverDate) ||
      (dashboardFilter === 'KT_ALL' && true) ||
      (dashboardFilter === 'KT_NEED_RECEIVE' && app.currentStep === 'S2_KT_Tiep_Nhan') ||
      (dashboardFilter === 'KT_PROCESSING' && app.currentStep === 'S2_KT_Tiep_Nhan') ||
      (dashboardFilter === 'KT_ISSUES' && (app.isRejected || app.status === 'Error' || (app.issueType && app.issueType !== 'None')) && stepConfig[app.currentStep]?.dept === 'KT') ||
      (dashboardFilter === 'PTDA_RECEIVED' && app.currentStep === 'S2_KT_Ban_giao') ||
      (dashboardFilter === 'PTDA_NO_TAX' && app.currentStep === 'S3_Nop_VPDK') ||
      (dashboardFilter === 'PTDA_TAX_PENDING' && app.currentStep === 'S5_Tai_Chinh_Khach_Hang' && !app.taxReceiptDate) ||
      (dashboardFilter === 'PTDA_GCN_WAITING' && app.currentStep === 'S6_Nhan_So_GCN' && !app.gcnSignedDate) ||
      (dashboardFilter === 'PTDA_ISSUES' && (app.isRejected || app.status === 'Error' || (app.issueType && app.issueType !== 'None')) && stepConfig[app.currentStep]?.dept === 'PTDA');

    return matchesSearch && matchesStep && matchesStatus && matchesLoan && matchesSelfService && matchesDashboardFilter && matchesSLA;
  });

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
    }} />;
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
    <div className={cn(
      "flex h-screen w-full overflow-hidden font-sans relative transition-colors duration-500",
      theme === 'light' ? 'light bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-200'
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
      <aside className={cn(
        "w-64 backdrop-blur-2xl border-r flex flex-col shrink-0 z-20 relative transition-all",
        theme === 'light' ? "bg-white/80 border-slate-200 shadow-xl" : "bg-slate-900/60 border-slate-800/80 shadow-2xl"
      )}>
        <div className={cn(
          "p-6 border-b mb-4 transition-all",
          theme === 'light' 
            ? "border-slate-200 bg-gradient-to-br from-slate-100/30 to-transparent" 
            : "border-slate-800/50 bg-gradient-to-br from-slate-800/30 to-transparent"
        )}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-festive-gold rounded-xl flex items-center justify-center shadow-lg shadow-festive-gold/20">
              <Building2 className="text-festive-dark" size={24} />
            </div>
            <div>
               <h1 className="font-bold text-xl tracking-tight text-festive-gold font-serif italic">GCN Tracker</h1>
               <p className={cn("text-[10px] uppercase font-bold tracking-[0.3em] leading-none", theme === 'light' ? "text-slate-500" : "text-slate-400")}>Regional</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm",
              activeTab === 'dashboard' 
                ? "bg-festive-gold text-slate-900 shadow-lg shadow-festive-gold/20" 
                : (theme === 'light' ? "text-slate-500 hover:bg-slate-200/50 hover:text-slate-900" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200")
            )}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('applications')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm",
              activeTab === 'applications' 
                ? "bg-festive-gold text-slate-900 shadow-lg shadow-festive-gold/20" 
                : (theme === 'light' ? "text-slate-500 hover:bg-slate-100 hover:text-slate-900" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200")
            )}
          >
            <Files size={18} />
            Quản lý Hồ sơ
          </button>

          {(userRole === 'ADMIN' || userRole === 'DIRECTOR') && (
            <button 
              onClick={() => setActiveTab('reports')}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm",
                activeTab === 'reports' 
                  ? "bg-festive-gold text-slate-900 shadow-lg shadow-festive-gold/20" 
                  : (theme === 'light' ? "text-slate-500 hover:bg-slate-100 hover:text-slate-900" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200")
              )}
            >
              <FileBarChart size={18} />
              {userRole === 'ADMIN' || userRole === 'DIRECTOR' ? 'Báo cáo & Thống kê' : 'Báo cáo & Thống kê'}
            </button>
          )}

          <button 
            onClick={() => setActiveTab('resources')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm",
              activeTab === 'resources' 
                ? "bg-festive-gold text-slate-900 shadow-lg shadow-festive-gold/20" 
                : (theme === 'light' ? "text-slate-500 hover:bg-slate-100 hover:text-slate-900" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200")
            )}
          >
            <HelpCircle size={18} />
            Tra cứu & Biểu mẫu
          </button>
          
          {userRole === 'ADMIN' && (
            <>
              <button 
                onClick={() => setActiveTab('users')}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm",
                  activeTab === 'users' 
                    ? "bg-festive-gold text-slate-900 shadow-lg shadow-festive-gold/20" 
                    : (theme === 'light' ? "text-slate-500 hover:bg-slate-100 hover:text-slate-900" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200")
                )}
              >
                <User size={18} />
                Quản trị Người dùng
              </button>
              <button 
                onClick={() => setActiveTab('projects')}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm",
                  activeTab === 'projects' 
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" 
                    : (theme === 'light' ? "text-slate-500 hover:bg-slate-100 hover:text-slate-900" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200")
                )}
              >
                <Building2 size={18} />
                Quản lý Dự án
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm",
                  activeTab === 'settings' 
                    ? "bg-festive-gold text-slate-900 shadow-lg shadow-festive-gold/20" 
                    : (theme === 'light' ? "text-slate-500 hover:bg-slate-100 hover:text-slate-900" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200")
                )}
              >
                <Settings size={18} />
                Cấu hình hệ thống
              </button>
            </>
          )}

          <div className="pt-4 mt-4 border-t border-slate-800/10">
            <button 
              onClick={() => setIsFieldMode(true)}
              className={cn(
                "w-full flex items-center gap-3 px-8 py-4 rounded-2xl transition-all duration-200 font-black text-[10px] uppercase tracking-widest",
                "bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 hover:bg-indigo-600/20"
              )}
            >
              <LayoutDashboard size={14} />
              Field Portal (Mobile)
            </button>
          </div>

          <div className="pt-4 border-t border-slate-800/10 mt-4 px-6 pb-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Khu vực & Dự án</p>
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
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-4 space-y-4 pb-6">
            <button 
              onClick={() => setSelectedProjectId(null)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-black uppercase tracking-tight",
                selectedProjectId === null 
                  ? (theme === 'light' ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200" : "bg-slate-800/80 text-festive-gold ring-1 ring-slate-700")
                  : (theme === 'light' ? "text-slate-500 hover:bg-slate-50" : "text-slate-400 hover:bg-slate-800/50")
              )}
            >
              <Map size={16} className={selectedProjectId === null ? (theme === 'light' ? "text-indigo-600" : "text-festive-gold") : "text-slate-500"} />
              <span className="truncate whitespace-nowrap overflow-hidden">Tất cả dự án</span>
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
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all group",
                    theme === 'light' ? "hover:bg-slate-100" : "hover:bg-slate-800/40",
                    expandedSidebarRegions[region] && (theme === 'light' ? "bg-slate-100" : "bg-slate-800/30")
                  )}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Folder size={12} className={cn(
                      "shrink-0 transition-colors",
                      expandedSidebarRegions[region] ? "text-festive-gold" : "text-slate-500"
                    )} />
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest truncate transition-colors",
                      expandedSidebarRegions[region] ? (theme === 'light' ? "text-slate-900" : "text-white") : "text-slate-500"
                    )}>{region}</span>
                  </div>
                  <ChevronDown size={10} className={cn(
                    "text-slate-600 transition-transform duration-300 shrink-0",
                    expandedSidebarRegions[region] ? "rotate-180" : "rotate-0"
                  )} />
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
                          onClick={() => { 
                            setSelectedProjectId(p.id); 
                            if (activeTab !== 'applications' && activeTab !== 'reports') {
                              setActiveTab('dashboard'); 
                            }
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-black group relative overflow-hidden",
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
                          <span className="truncate max-w-[140px] uppercase tracking-tight">{p.name}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </nav>
      </aside>

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
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input 
                  type="text" 
                  placeholder="Tìm hồ sơ..." 
                  className={cn(
                    "pl-9 pr-4 py-2 rounded-full text-xs font-bold transition-all w-48 outline-none border",
                    theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-800 focus:ring-slate-200" : "bg-slate-950/50 border-slate-700/50 text-slate-200 focus:ring-festive-gold/20"
                  )}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              
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
                />
                <button 
                  onClick={() => document.getElementById('excel-import')?.click()}
                  className={cn(
                    "p-2.5 rounded-full border transition-all shadow-sm group relative",
                    theme === 'light' ? "bg-white border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200" : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30"
                  )}
                  title="Nhập từ Excel"
                >
                  <Upload size={18} />
                </button>
              </div>

              {(userRole === 'ADMIN' || userRole === 'PTT') && (
                <button 
                  onClick={() => {
                    const defaultProj = selectedProject?.name || (visibleProjects.length > 0 ? visibleProjects[0].name : projects[0].name);
                    setNewApp(prev => ({ ...prev, projectName: defaultProj }));
                    setIsCreateModalOpen(true);
                  }}
                  className="bg-festive-gold hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-festive-gold/10 transition-all active:scale-95"
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
                <p className={cn("text-xs font-black uppercase tracking-widest truncate", theme === 'light' ? "text-slate-900" : "text-white")}>{currentUser?.name}</p>
                <div className="flex items-center justify-end gap-2">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter truncate">Dept: {currentUser?.dept}</p>
                  <button 
                    onClick={() => setIsChangePasswordModalOpen(true)}
                    className="text-[9px] font-black text-indigo-500 hover:text-indigo-400 uppercase tracking-tighter transition-colors"
                  >
                    Đổi Pass
                  </button>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-festive-gold/10 border border-festive-gold/20 flex items-center justify-center text-festive-gold font-black text-xs shadow-lg shadow-festive-gold/5">
                {(currentUser?.name || 'User').split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <button 
                onClick={() => setCurrentUser(null)}
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
        <div className="flex-1 overflow-y-auto p-8 bg-transparent custom-scrollbar relative">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    <StatCard 
                      title="Tổng số lượng hồ sơ" 
                      value={roleKpis.ptt.total} 
                      icon={Files} 
                      colorClass="bg-blue-500 shadow-blue-500/40" 
                      delay={0.1} 
                      theme={theme} 
                      onClick={() => { 
                        setActiveTab('applications'); 
                        setDashboardFilter('ALL');
                        setFilterStep('ALL');
                        setFilterStatus('ALL');
                        setSearch('');
                      }}
                    />
                    <StatCard 
                      title="Hồ sơ đang xử lý" 
                      value={roleKpis.ptt.processing} 
                      icon={Activity} 
                      colorClass="bg-info shadow-info/40" 
                      delay={0.2} 
                      theme={theme} 
                      onClick={() => { 
                        setActiveTab('applications'); 
                        setDashboardFilter('PTT_PROCESSING');
                        setFilterStep('ALL');
                        setFilterStatus('Processing');
                        setSearch('');
                      }}
                    />
                    <StatCard 
                      title="Hồ sơ sai sót/vướng mắc" 
                      value={roleKpis.ptt.issues} 
                      icon={AlertTriangle} 
                      colorClass="bg-error shadow-error/40" 
                      delay={0.3} 
                      theme={theme} 
                      onClick={() => { 
                        setActiveTab('applications'); 
                        setDashboardFilter('PTT_ISSUES');
                        setFilterStep('ALL');
                        setFilterStatus('ALL');
                        setSearch('');
                      }}
                    />
                    <StatCard 
                      title="Chưa nộp NVTC" 
                      value={roleKpis.ptt.taxPending} 
                      icon={Clock} 
                      colorClass="bg-warning shadow-warning/40" 
                      delay={0.4} 
                      theme={theme} 
                      onClick={() => { 
                        setActiveTab('applications'); 
                        setDashboardFilter('PTT_TAX_UNPAID');
                        setFilterStep('ALL');
                        setFilterStatus('ALL');
                        setSearch('');
                      }}
                    />
                    <StatCard 
                      title="CHỜ BÀN GIAO KHÁCH" 
                      value={roleKpis.ptt.waitingHandover} 
                      icon={UserCheck} 
                      colorClass="bg-purple-500 shadow-purple-500/40" 
                      delay={0.5} 
                      theme={theme} 
                      onClick={() => { 
                        setActiveTab('applications'); 
                        setDashboardFilter('PTT_WAITING_HANDOVER');
                        setFilterStep('ALL');
                        setFilterStatus('ALL');
                        setSearch('');
                      }}
                    />
                  </div>
                )}

                {userRole === 'KT' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Tổng số lượng hồ sơ" value={roleKpis.kt.total} icon={Files} colorClass="bg-blue-500 shadow-blue-500/40" delay={0.1} theme={theme} onClick={() => { 
                      setActiveTab('applications'); 
                      setDashboardFilter('KT_ALL');
                      setFilterStep('ALL');
                      setFilterStatus('ALL');
                      setSearch('');
                    }} />
                    <StatCard title="Hồ sơ cần tiếp nhận" value={roleKpis.kt.received} icon={Files} colorClass="bg-info shadow-info/40" delay={0.15} theme={theme} onClick={() => { 
                      setActiveTab('applications'); 
                      setDashboardFilter('KT_NEED_RECEIVE');
                      setFilterStep('S2_KT_Tiep_Nhan');
                      setFilterStatus('ALL');
                      setSearch('');
                    }} />
                    <StatCard title="Hồ sơ đang xử lý" value={roleKpis.kt.processing} icon={Activity} colorClass="bg-cyan-500 shadow-cyan-500/40" delay={0.2} theme={theme} onClick={() => { 
                      setActiveTab('applications'); 
                      setDashboardFilter('KT_PROCESSING');
                      setFilterStep('S2_KT_Tiep_Nhan');
                      setFilterStatus('ALL');
                      setSearch('');
                    }} />
                    <StatCard title="Hồ sơ sai sót/vướng mắc" value={roleKpis.kt.issues} icon={AlertTriangle} colorClass="bg-error shadow-error/40" delay={0.25} theme={theme} onClick={() => { 
                      setActiveTab('applications'); 
                      setDashboardFilter('KT_ISSUES');
                      setFilterStep('ALL');
                      setFilterStatus('ALL');
                      setSearch('');
                    }} />
                  </div>
                )}

                {userRole === 'PTDA' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <StatCard title="Hồ sơ cần tiếp nhận" value={roleKpis.ptda.received} icon={Files} colorClass="bg-blue-500 shadow-blue-500/40" delay={0.05} theme={theme} onClick={() => { 
                      setActiveTab('applications'); 
                      setDashboardFilter('PTDA_RECEIVED');
                      setFilterStep('S2_KT_Ban_giao');
                      setFilterStatus('ALL');
                      setSearch('');
                    }} />
                    <StatCard title="Hồ sơ đang xử lý (Chờ nộp VPĐK)" value={roleKpis.ptda.noTax} icon={Clock} colorClass="bg-warning shadow-warning/40" delay={0.1} theme={theme} onClick={() => { 
                      setActiveTab('applications'); 
                      setDashboardFilter('PTDA_NO_TAX');
                      setFilterStep('S3_Nop_VPDK');
                      setFilterStatus('ALL');
                      setSearch('');
                    }} />
                    <StatCard title="Chờ hoàn thành NVTC" value={roleKpis.ptda.noTaxPaid} icon={CheckCircle2} colorClass="bg-warning shadow-warning/40" delay={0.15} theme={theme} onClick={() => { 
                      setActiveTab('applications'); 
                      setDashboardFilter('PTDA_TAX_PENDING');
                      setFilterStep('S5_Tai_Chinh_Khach_Hang');
                      setFilterStatus('ALL');
                      setSearch('');
                    }} />
                    <StatCard title="Chờ in/ký GCN" value={roleKpis.ptda.gcnWaiting} icon={FileText} colorClass="bg-info shadow-info/40" delay={0.2} theme={theme} onClick={() => { 
                      setActiveTab('applications'); 
                      setDashboardFilter('PTDA_GCN_WAITING');
                      setFilterStep('S6_Nhan_So_GCN');
                      setFilterStatus('ALL');
                      setSearch('');
                    }} />
                    <StatCard title="Hồ sơ sai sót/vướng mắc" value={roleKpis.ptda.issues} icon={AlertCircle} colorClass="bg-error shadow-error/40" delay={0.25} theme={theme} onClick={() => { 
                      setActiveTab('applications'); 
                      setDashboardFilter('PTDA_ISSUES');
                      setFilterStep('ALL');
                      setFilterStatus('ALL');
                      setSearch('');
                    }} />
                  </div>
                )}

                {(userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'DIRECTOR' || !userRole) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <StatCard 
                      title="Tổng số lượng căn" 
                      value={kpis.total} 
                      icon={Building2} 
                      colorClass="bg-indigo-600 shadow-indigo-600/40" 
                      delay={0.1} 
                      theme={theme} 
                      onClick={() => { setActiveTab('applications'); setDashboardFilter('ALL'); }}
                    />
                    <StatCard 
                      title="Trễ hạn xử lý" 
                      value={kpis.overdue} 
                      icon={AlertCircle} 
                      colorClass="bg-warning shadow-warning/40" 
                      delay={0.2} 
                      theme={theme} 
                      onClick={() => { setActiveTab('applications'); setDashboardFilter('OVERDUE'); }}
                    />
                    <StatCard 
                      title="Vướng / Sai sót" 
                      value={kpis.error} 
                      icon={AlertCircle} 
                      colorClass="bg-error shadow-error/40" 
                      delay={0.3} 
                      theme={theme} 
                      onClick={() => { setActiveTab('applications'); setDashboardFilter('ERROR'); }}
                    />
                    <StatCard 
                      title="Căn có vay" 
                      value={applications.filter(a => a.loanStatus === 'Co_Vay').length} 
                      icon={CreditCard} 
                      colorClass="bg-blue-600 shadow-blue-600/40" 
                      delay={0.4} 
                      theme={theme} 
                      onClick={() => { setActiveTab('reports'); setDashboardFilter('LOAN' as any); }}
                    />
                  </div>
                )}

                
                {/* Dashboard Critical Alert Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Slowest List for PTT */}
                      {userRole === 'PTT' ? (
                        <div className={cn(
                          "p-6 rounded-2xl border transition-all lg:col-span-2",
                          theme === 'light' ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/40 border-slate-800"
                        )}>
                           <h3 className={cn("font-bold mb-4 flex items-center gap-2", theme === 'light' ? "text-slate-900" : "text-white")}>
                             <AlertTriangle size={18} className="text-rose-500" />
                             Danh sách hồ sơ chậm nhất
                           </h3>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {roleKpis.ptt.slowest.map(app => (
                               <div key={app.id} className={cn(
                                 "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer",
                                 theme === 'light' ? "bg-slate-50 border-slate-100 hover:border-slate-200" : "bg-slate-950/40 border-slate-800/50 hover:border-slate-700"
                               )} onClick={() => { setActiveTab('applications'); setSearch(app.unitCode); }}>
                                 <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold text-xs shrink-0">
                                     {app.overdue.daysLate}d
                                   </div>
                                   <div className="truncate">
                                     <p className={cn("text-sm font-bold", theme === 'light' ? "text-slate-800" : "text-slate-200")}>{app.unitCode}</p>
                                     <p className="text-[10px] text-slate-500 truncate">{app.customerName} - {app.overdue.label}</p>
                                   </div>
                                 </div>
                                 <ChevronRight size={16} className="text-slate-700 shrink-0" />
                               </div>
                             ))}
                             {roleKpis.ptt.slowest.length === 0 && <p className="text-slate-500 text-xs italic text-center py-4 lg:col-span-2">Chưa có hồ sơ trễ hạn</p>}
                           </div>
                        </div>
                      ) : (
                        <>
                          <div className={cn(
                            "p-4 rounded-2xl border flex items-center justify-between transition-all",
                            theme === 'light' ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/80 border-slate-700 backdrop-blur-xl"
                          )}>
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-500 flex items-center justify-center">
                                <User size={20} />
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Khách hàng vay</p>
                                <p className={cn("text-xl font-bold", theme === 'light' ? "text-slate-900" : "text-white")}>{kpis.loanCount} <span className="text-xs text-slate-500 font-normal">Hồ sơ</span></p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-indigo-400 font-bold">{Math.round((kpis.loanCount/kpis.total)*100) || 0}%</p>
                              <div className={cn("w-24 h-1 rounded-full mt-1 overflow-hidden", theme === 'light' ? "bg-slate-100" : "bg-slate-800")}>
                                <div className="h-full bg-indigo-500" style={{ width: `${(kpis.loanCount/kpis.total)*100}%` }}></div>
                              </div>
                            </div>
                          </div>
                          <div className={cn(
                            "p-4 rounded-2xl border flex items-center justify-between transition-all",
                            theme === 'light' ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/80 border-slate-700 backdrop-blur-xl"
                          )}>
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-slate-500/20 text-slate-400 flex items-center justify-center">
                                <User size={20} />
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Sử dụng vốn tự có</p>
                                <p className={cn("text-xl font-bold", theme === 'light' ? "text-slate-900" : "text-white")}>{kpis.regularCount} <span className="text-xs text-slate-500 font-normal">Hồ sơ</span></p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-slate-400 font-bold">{Math.round((kpis.regularCount/kpis.total)*100) || 0}%</p>
                              <div className={cn("w-24 h-1 rounded-full mt-1 overflow-hidden", theme === 'light' ? "bg-slate-100" : "bg-slate-800")}>
                                <div className="h-full bg-slate-500" style={{ width: `${(kpis.regularCount/kpis.total)*100}%` }}></div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-1 space-y-8">
                    {/* Urgent Tasks Section */}
                    <section className={cn(
                      "backdrop-blur-xl border rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group h-full transition-all",
                      theme === 'light' 
                        ? "bg-white border-rose-100 shadow-rose-900/5" 
                        : "bg-slate-900/40 border-rose-500/20 shadow-2xl"
                    )}>
                      <div className="absolute top-0 right-0 p-8">
                         <AlertTriangle className="text-rose-500/40 animate-pulse" size={24} />
                      </div>
                      <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-6">Cảnh báo cấp bách</h3>
                      <div className="space-y-4">
                        {applications.filter(a => a.status === 'Error').slice(0, 4).map(app => (
                          <div key={app.id} className={cn(
                            "p-4 rounded-2xl border transition-all cursor-pointer group/task",
                            theme === 'light' 
                              ? "bg-rose-50/30 border-rose-100 hover:border-rose-300" 
                              : "bg-slate-950/50 border-rose-500/10 hover:border-rose-500/30"
                          )} onClick={() => { setSelectedApp(app); setActiveTab('applications'); }}>
                            <div className="flex justify-between items-start mb-2">
                              <p className={cn("text-sm font-black", theme === 'light' ? "text-slate-900" : "text-slate-200")}>{app.unitCode}</p>
                              <div className="flex flex-col gap-1 items-end">
                                <span className={cn(
                                  "text-[9px] font-bold px-2 py-0.5 rounded italic",
                                  app.issueSource === 'Khach_Hang' ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                                  app.issueSource === 'Nha_Nuoc' ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" :
                                  app.issueSource === 'Chu_Dau_Tu' ? "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20" :
                                  "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                )}>
                                  {app.issueSource === 'Khach_Hang' ? 'K.HÀNG' : 
                                   app.issueSource === 'Nha_Nuoc' ? 'NHÀ NƯỚC' : 
                                   app.issueSource === 'Chu_Dau_Tu' ? 'CĐT' : 
                                   'NỘI BỘ'}
                                </span>
                                <span className="text-[8px] font-black text-rose-500/70">{app.issueType || 'Vướng mắc'}</span>
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-500 font-bold mb-3 truncate">{app.projectName}</p>
                            <div className="flex items-center justify-between">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter italic truncate">{app.currentStep}</p>
                              <ArrowRight size={14} className="text-slate-600 group-hover/task:text-rose-500 transition-all translate-x-[-10px] opacity-0 group-hover/task:translate-x-0 group-hover/task:opacity-100" />
                            </div>
                          </div>
                        ))}
                        {applications.filter(a => a.status === 'Error').length === 0 && (
                          <div className="py-8 text-center">
                            <CheckCircle2 size={32} className="mx-auto text-emerald-500/30 mb-2" />
                            <p className="text-[10px] text-slate-600 font-bold italic">Tuyệt vời! Hệ thống ổn định</p>
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className={cn(
                    "lg:col-span-2 backdrop-blur-md p-8 rounded-[3rem] border transition-all duration-500",
                    theme === 'light' ? "bg-white border-slate-200 shadow-2xl shadow-slate-200/50" : "bg-slate-900/40 border-slate-800/50 shadow-2xl"
                  )}>
                    <div className="flex items-center justify-between mb-10">
                      <h3 className={cn("font-bold flex items-center gap-3 font-serif text-2xl italic", theme === 'light' ? "text-slate-900" : "text-white")}>
                        <LayoutDashboard size={20} className="text-amber-500" />
                        Tiến độ các giai đoạn
                      </h3>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-indigo-500" />
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Bình thường</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Sai sót</span>
                        </div>
                      </div>
                    </div>
                      <div className="h-[450px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                            data={chartData} 
                            margin={{ top: 30, right: 10, left: -20, bottom: 30 }}
                            barGap={8}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'light' ? "#f1f5f9" : "#ffffff08"} />
                            <XAxis 
                              dataKey="name" 
                              axisLine={false} 
                              tickLine={false} 
                              interval={0}
                              tick={(props: any) => {
                                const { x, y, payload } = props;
                                return (
                                  <g transform={`translate(${x},${y})`}>
                                    <text x={0} y={0} dy={16} textAnchor="middle" fill="#94a3b8" fontSize={9} fontWeight={900} className="uppercase tracking-tighter">
                                      {payload.value}
                                    </text>
                                  </g>
                                );
                              }}
                            />
                            <YAxis 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 10, fill: '#64748b', fontWeight: 800 }} 
                              allowDecimals={false}
                            />
                            <ReTooltip 
                              cursor={{ fill: theme === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.05)' }}
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className={cn(
                                      "p-5 rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border-none outline-none backdrop-blur-xl",
                                      theme === 'light' ? "bg-white/95 text-slate-800" : "bg-slate-900/95 text-white"
                                    )}>
                                      <div className="font-black italic mb-3 uppercase text-[11px] tracking-[0.2em] border-b border-indigo-500/20 pb-2 flex items-center gap-2">
                                        <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                                        {data.name}
                                      </div>
                                      <div className="space-y-2.5">
                                        <div className="flex justify-between gap-12 items-center">
                                          <div className="flex items-center gap-2.5">
                                            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/20" />
                                            <span className="text-slate-500 font-bold uppercase text-[10px] tracking-tight">Bình thường:</span>
                                          </div>
                                          <span className={cn("font-black italic text-sm", theme === 'light' ? "text-slate-950" : "text-white")}>{data.normal} căn</span>
                                        </div>
                                        <div className="flex justify-between gap-12 items-center">
                                          <div className="flex items-center gap-2.5">
                                            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-lg shadow-rose-500/20" />
                                            <span className="text-slate-500 font-bold uppercase text-[10px] tracking-tight">Sai sót:</span>
                                          </div>
                                          <span className="font-black italic text-sm text-rose-500">{data.error} căn</span>
                                        </div>
                                        <div className="mt-2 pt-2 border-t border-slate-700/20 flex justify-between gap-12 items-center">
                                          <span className="text-slate-500 font-black uppercase text-[10px] tracking-widest">Tổng cộng:</span>
                                          <span className={cn("font-black italic text-xl", theme === 'light' ? "text-indigo-600" : "text-indigo-400")}>{data.value}</span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar dataKey="normal" stackId="a" fill="#4f46e5" barSize={32} radius={[0, 0, 0, 0]} />
                            <Bar 
                              dataKey="error" 
                              stackId="a" 
                              fill="#ef4444" 
                              barSize={32} 
                              radius={[6, 6, 0, 0]} 
                              label={(props: any) => {
                                const { x, y, width, value } = props;
                                if (!value || value === 0) return null;
                                return (
                                  <text 
                                    x={x + width / 2} 
                                    y={y - 12} 
                                    fill={theme === 'light' ? '#334155' : '#cbd5e1'}
                                    textAnchor="middle" 
                                    fontSize={10} 
                                    fontWeight="900"
                                    className="font-mono"
                                  >
                                    {value}
                                  </text>
                                );
                              }} 
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                  <div className={cn(
                    "backdrop-blur-md p-8 rounded-[3rem] border transition-all duration-500 flex flex-col group divide-y divide-slate-800/10",
                    theme === 'light' ? "bg-white border-slate-200 shadow-2xl shadow-slate-200/50" : "bg-slate-900/40 border-slate-800/50 shadow-2xl"
                  )}>
                    <div className="pb-8">
                      <h3 className={cn("font-bold mb-6 font-serif text-xl italic flex items-center gap-3", theme === 'light' ? "text-slate-900" : "text-white")}>
                        <Filter size={18} className="text-amber-500" />
                        Tỷ lệ Trạng thái
                      </h3>
                      <div className="h-[220px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie 
                              data={overallPieData} 
                              cx="50%" 
                              cy="50%" 
                              innerRadius={65} 
                              outerRadius={85} 
                              paddingAngle={8} 
                              dataKey="value"
                              stroke="none"
                            >
                              {overallPieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <ReTooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className={cn(
                                      "p-3 rounded-xl shadow-2xl border-none outline-none",
                                      theme === 'light' ? "bg-white text-slate-800" : "bg-slate-900 text-white"
                                    )}>
                                      <p className="font-black uppercase text-[10px]">{data.name}</p>
                                      <p className="font-black italic text-indigo-500 text-lg">{data.percentage}%</p>
                                      <p className="text-[9px] text-slate-500 font-bold">{data.value} căn</p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mb-6">
                          <span className={cn("text-3xl font-black italic font-serif", theme === 'light' ? "text-slate-900" : "text-white")}>{kpis.total}</span>
                          <span className="text-[8px] uppercase font-black text-slate-500 mt-1">Hồ sơ</span>
                        </div>
                      </div>
                      <div className="mt-8 space-y-4">
                        {overallPieData.map((d) => (
                          <div key={d.name} className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-3">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                              <span className={cn("text-[10px] font-black uppercase tracking-tight", theme === 'light' ? "text-slate-500" : "text-slate-200")}>{d.name}</span>
                            </div>
                            <span className={cn("text-[10px] font-black italic", theme === 'light' ? "text-slate-900" : "text-white")}>{d.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-8">
                       <h3 className={cn("font-bold mb-6 font-serif text-xl italic flex items-center gap-3", theme === 'light' ? "text-slate-900" : "text-white")}>
                         <Wallet size={18} className="text-emerald-500" />
                         Trạng thái Căn có vay
                       </h3>
                       {roleKpis.loanStatusStats.length > 0 ? (
                         <div className="grid grid-cols-1 gap-4">
                            <div className="h-[120px] w-full relative">
                               <ResponsiveContainer width="100%" height="100%">
                                 <PieChart>
                                   <Pie data={roleKpis.loanStatusStats} cx="50%" cy="50%" innerRadius={40} outerRadius={55} paddingAngle={5} dataKey="value">
                                     {roleKpis.loanStatusStats.map((entry: any, index: number) => (
                                       <Cell key={`cell-loan-${index}`} fill={entry.color} />
                                     ))}
                                   </Pie>
                                 </PieChart>
                               </ResponsiveContainer>
                            </div>
                            <div className="flex flex-wrap gap-2">
                               {roleKpis.loanStatusStats.map((s: any) => (
                                 <div key={s.name} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/10 border border-slate-800/10">
                                   <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                                   <span className="text-[8px] text-slate-500 font-bold uppercase">{s.name}:</span>
                                   <span className={cn("text-[9px] font-black", theme === 'light' ? "text-slate-900" : "text-white")}>{s.value}</span>
                                 </div>
                               ))}
                            </div>
                         </div>
                       ) : (
                         <div className="py-10 text-center opacity-40">
                            <p className="text-[10px] italic">Không có dữ liệu căn có vay</p>
                         </div>
                       )}
                    </div>
                  </div>
                </div>

                {(userRole === 'ADMIN' || userRole === 'DIRECTOR') && (
                  <div className={cn(
                    "backdrop-blur-xl rounded-3xl shadow-2xl border transition-all overflow-hidden",
                    theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900/20 shadow-2xl border-slate-800/50"
                  )}>
                    <div className={cn("p-6 border-b flex items-center justify-between", theme === 'light' ? "border-slate-100 bg-slate-50" : "border-slate-800/50")}>
                      <div className="flex items-center gap-4">
                        <h3 className={cn("font-bold font-serif text-xl italic", theme === 'light' ? "text-slate-900" : "text-white")}>Hiệu suất Trách nhiệm Phòng ban theo ngày</h3>
                        <div className="flex items-center gap-2 bg-slate-800/20 rounded-lg p-1 border border-slate-700/30">
                          <Clock size={12} className="text-slate-500 ml-1" />
                          <span className="text-[10px] font-black uppercase text-slate-400 px-2 italic">Thời gian xử lý trung bình</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-8">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {roleKpis.admin.deptStats.map((dept, idx) => (
                          <div key={dept.dept} className={cn(
                            "p-6 rounded-[2.5rem] border transition-all hover:border-festive-gold/50 duration-300 relative overflow-hidden",
                            theme === 'light' ? "bg-slate-50 border-slate-100 shadow-sm" : "bg-slate-800/40 border-slate-700/30 shadow-xl"
                          )}>
                            <div className="flex justify-between items-start mb-6">
                              <div>
                                 <p className={cn("text-[9px] font-black uppercase tracking-widest leading-none mb-1", theme === 'light' ? "text-slate-400" : "text-slate-500")}>Phòng ban</p>
                                 <h4 className={cn("text-lg font-black italic", theme === 'light' ? "text-slate-900" : "text-white")}>{dept.label}</h4>
                              </div>
                              <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center", dept.color + " bg-opacity-10")}>
                                 <Layers size={18} className={dept.color.replace('bg-', 'text-')} />
                              </div>
                            </div>
                            
                            <div className="flex items-baseline gap-2 mb-4">
                              <span className={cn("text-4xl font-black italic font-serif", theme === 'light' ? "text-slate-900" : "text-white")}>{dept.avgDays}</span>
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ngày / Hồ sơ</span>
                            </div>

                            <div className="h-2 w-full bg-slate-800/20 rounded-full overflow-hidden mb-4">
                               <div className={cn("h-full rounded-full transition-all duration-1000", dept.color)} style={{ width: `${Math.min(100, (dept.avgDays / 15) * 100)}%` }} />
                            </div>
                            
                            <div className="flex justify-between items-center text-[10px]">
                               <span className="text-slate-500 font-bold uppercase tracking-tighter">Đang xử lý: {dept.count} căn</span>
                               <span className={cn("font-black italic px-2 py-0.5 rounded-lg", dept.avgDays > 10 ? "text-rose-500 bg-rose-500/10" : "text-emerald-500 bg-emerald-500/10")}>
                                 {dept.avgDays > 10 ? 'Cảnh báo chậm' : 'Tiến độ tốt'}
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
                            const projectApps = applications.filter(a => a.projectName === p.name);
                            const completed = projectApps.filter(a => a.status === 'Completed').length;
                            const progress = Math.round((completed / p.totalUnits) * 100);
                            
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
                                      "w-8 h-8 rounded-lg flex items-center justify-center transition-colors border",
                                      theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-400" : "bg-slate-800/50 border-slate-700/50 text-slate-500"
                                    )}>
                                      <Building2 size={16} />
                                    </div>
                                    <div>
                                      <p className={cn("text-sm font-bold", theme === 'light' ? "text-slate-900" : "text-white")}>{p.name}</p>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <MapPin size={8} className="text-slate-500" />
                                        <p className="text-[9px] text-slate-500 tracking-[0.15em] font-black uppercase">{p.region}</p>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center text-xs font-black text-slate-500 font-mono tracking-tighter">{p.totalUnits}</td>
                                <td className="px-6 py-4 text-center text-xs font-black text-slate-500 font-mono tracking-tighter">{completed}</td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-4">
                                    <div className="flex-1 min-w-[120px]">
                                      <div className="flex items-center justify-between mb-1.5">
                                        <span className={cn("text-[10px] font-black uppercase tracking-widest", theme === 'light' ? "text-slate-400" : "text-slate-500")}>Hoàn thành</span>
                                        <span className={cn("text-[10px] font-black font-mono", theme === 'light' ? "text-slate-700" : "text-white")}>{progress}%</span>
                                      </div>
                                      <div className={cn("h-2 rounded-full overflow-hidden border", theme === 'light' ? "bg-slate-100 border-slate-200" : "bg-slate-950/50 border-slate-800")}>
                                        <motion.div 
                                          initial={{ width: 0 }}
                                          animate={{ width: `${progress}%` }}
                                          className={cn("h-full shadow-lg transition-all", barColor, shadowColor)}
                                        />
                                      </div>
                                    </div>
                                    <div className={cn(
                                      "w-8 h-8 rounded-lg flex items-center justify-center transform group-hover:scale-110 group-hover:bg-festive-gold group-hover:text-slate-950 transition-all",
                                      theme === 'light' ? "bg-slate-100 text-slate-400" : "bg-slate-800/40 text-slate-600"
                                    )}>
                                      <ArrowRight size={14} />
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
                className="max-w-7xl mx-auto"
              >
                <div className={cn(
                  "backdrop-blur-md rounded-3xl shadow-2xl border transition-all overflow-hidden",
                  theme === 'light' ? "bg-white border-slate-200 shadow-slate-900/5" : "bg-slate-900/40 border-slate-800/50"
                )}>
                  <div className={cn("p-6 border-b", theme === 'light' ? "border-slate-100 shadow-inner bg-slate-50/50" : "border-slate-800/50")}>
                    <div className="flex flex-col gap-4 mb-4">
                      <div className="flex justify-between items-center">
                        <input 
                          type="text"
                          placeholder="Tìm theo Mã HS, Tên..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className={cn("px-4 py-2 rounded-full text-xs font-bold border outline-none", theme === 'light' ? "bg-white border-slate-200 text-slate-800" : "bg-slate-950 border-slate-800 text-white")}
                        />
                        <div className="flex items-center gap-4 text-[11px]">
                          <select 
                            value={pageSize}
                            onChange={(e) => {setPageSize(Number(e.target.value)); setCurrentPage(0);}}
                            className={cn("px-2 py-1 rounded-lg text-[10px]", theme === 'light' ? "bg-slate-100" : "bg-slate-800")}
                          >
                            <option value={20}>20 / trang</option>
                            <option value={50}>50 / trang</option>
                            <option value={100}>100 / trang</option>
                          </select>
                          <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} className="p-1 disabled:opacity-30">Trước</button>
                            <span className="font-bold">Trang {currentPage + 1}</span>
                            <button onClick={() => setCurrentPage(p => ( (p+1)*pageSize < totalCount ? p + 1 : p))} disabled={(currentPage+1)*pageSize >= totalCount} className="p-1 disabled:opacity-30">Sau</button>
                          </div>
                          <span className="text-slate-500 italic">Tổng: {totalCount} hồ sơ</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        {selectedAppIds.length > 0 && (
                          <button 
                            onClick={handleBulkPrint}
                            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                          >
                            <Printer size={14} />
                            In phiếu ({selectedAppIds.length})
                          </button>
                        )}
                        <button 
                          onClick={() => setIsShowFilters(!isShowFilters)}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border transition-all",
                            isShowFilters 
                              ? "bg-festive-gold text-slate-950 border-festive-gold" 
                              : (theme === 'light' ? "bg-white text-slate-600 border-slate-200 shadow-sm hover:bg-slate-50" : "bg-slate-950/40 text-slate-400 border-slate-800 hover:border-festive-gold/30")
                          )}
                        >
                          <Filter size={14} />
                          Lọc nâng cao
                        </button>

                        <button 
                          onClick={() => setIsSpreadsheetMode(!isSpreadsheetMode)}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border transition-all",
                            isSpreadsheetMode 
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20" 
                              : (theme === 'light' ? "bg-white text-slate-600 border-slate-200 shadow-sm hover:bg-slate-50" : "bg-slate-950/40 text-slate-400 border-slate-800 hover:border-indigo-500/30")
                          )}
                          title="Chế độ nhập liệu Spreadsheet (Excel-like)"
                        >
                          <FileSpreadsheet size={14} />
                          Nhập liệu nhanh
                        </button>
                      </div>
                      <div className="text-[11px] text-slate-500 italic">
                        Hiển thị {filteredApps.length} / {filteredByProjectApps.length} hồ sơ {selectedProject ? `thuộc ${selectedProject.name}` : 'toàn vùng'}
                      </div>
                    </div>

                    <AnimatePresence>
                      {isShowFilters && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className={cn(
                            "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t",
                            theme === 'light' ? "border-slate-100" : "border-slate-800/30"
                          )}>
                            <div className="space-y-2">
                              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Lọc theo dự án</label>
                              <select 
                                className={cn(
                                  "w-full rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-festive-gold/20 transition-all font-bold",
                                  theme === 'light' ? "bg-slate-50 border border-slate-200 text-slate-900" : "bg-slate-950 border border-slate-800 text-white"
                                )}
                                value={selectedProjectId || 'ALL'}
                                onChange={(e) => setSelectedProjectId(e.target.value === 'ALL' ? null : e.target.value)}
                              >
                                <option value="ALL">Tất cả dự án</option>
                                {projects.map(p => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-2">
                              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Trạng thái hồ sơ</label>
                              <select 
                                className={cn(
                                  "w-full rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-festive-gold/20 transition-all",
                                  theme === 'light' ? "bg-slate-50 border border-slate-200 text-slate-900" : "bg-slate-950 border border-slate-800 text-white"
                                )}
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as any)}
                              >
                                <option value="ALL">Tất cả trạng thái</option>
                                <option value="Processing">Đang xử lý</option>
                                <option value="Submitted">Đã nộp VPĐK</option>
                                <option value="TaxPending">Đang chờ thuế</option>
                                <option value="TaxCompleted">Đã xong thuế</option>
                                <option value="GCN_Issued">Đã có GCN</option>
                                <option value="Completed">Hoàn tất quy trình</option>
                              </select>
                            </div>

                            <div className="space-y-2">
                              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Giai đoạn hiện tại</label>
                              <select 
                                className={cn(
                                  "w-full rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-festive-gold/20 transition-all",
                                  theme === 'light' ? "bg-slate-50 border border-slate-200 text-slate-900" : "bg-slate-950 border border-slate-800 text-white"
                                )}
                                value={filterStep}
                                onChange={(e) => setFilterStep(e.target.value as any)}
                              >
                                <option value="ALL">Tất cả giai đoạn</option>
                                {Object.keys(stepConfig).filter(step => stepConfig[step].active).map(step => (
                                  <option key={step} value={step}>{stepConfig[step].label}</option>
                                ))}
                                <option value="Hoan_Tat">Hồ sơ đã hoàn tất</option>
                              </select>
                            </div>

                            <div className="space-y-2">
                              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Lọc theo lỗi</label>
                              <select 
                                className={cn(
                                  "w-full rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-festive-gold/20 transition-all",
                                  theme === 'light' ? "bg-slate-50 border border-slate-200 text-slate-900" : "bg-slate-950 border border-slate-800 text-white"
                                )}
                                value={filterStatus === 'Error' ? 'Error' : 'ALL'}
                                onChange={(e) => setFilterStatus(e.target.value === 'Error' ? 'Error' : 'ALL')}
                              >
                                <option value="ALL">Tất cả hồ sơ</option>
                                <option value="Error">Chỉ hồ sơ có lỗi/vướng</option>
                              </select>
                            </div>

                            <div className="space-y-2">
                              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Loại khách hàng</label>
                              <select 
                                className={cn(
                                  "w-full rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-festive-gold/20 transition-all",
                                  theme === 'light' ? "bg-slate-50 border border-slate-200 text-slate-900" : "bg-slate-950 border border-slate-800 text-white"
                                )}
                                value={filterLoanStatus}
                                onChange={(e) => setFilterLoanStatus(e.target.value as any)}
                              >
                                <option value="ALL">Tất cả (Vay + Vốn tự có)</option>
                                <option value="Co_Vay">Khách hàng vay</option>
                                <option value="Khong_Vay">Khách sử dụng vốn tự có</option>
                              </select>
                            </div>

                            <div className="space-y-2">
                              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Tự làm sổ</label>
                              <select 
                                className={cn(
                                  "w-full rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-festive-gold/20 transition-all",
                                  theme === 'light' ? "bg-slate-50 border border-slate-200 text-slate-900" : "bg-slate-950 border border-slate-800 text-white"
                                )}
                                value={filterSelfService}
                                onChange={(e) => setFilterSelfService(e.target.value as any)}
                              >
                                <option value="ALL">Tất cả</option>
                                <option value="YES">Khách tự làm</option>
                                <option value="NO">Công ty làm</option>
                              </select>
                            </div>

                            <div className="space-y-2">
                              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Tiến độ SLA</label>
                              <select 
                                className={cn(
                                  "w-full rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-festive-gold/20 transition-all",
                                  theme === 'light' ? "bg-slate-50 border border-slate-200 text-slate-900" : "bg-slate-950 border border-slate-800 text-white"
                                )}
                                value={filterSLAStatus}
                                onChange={(e) => setFilterSLAStatus(e.target.value as any)}
                              >
                                <option value="ALL">Tất cả tiến độ</option>
                                <option value="OVERDUE">Quá hạn SLA</option>
                              </select>
                            </div>

                            <div className="flex items-end">
                              <button 
                                onClick={() => {
                                  setSelectedProjectId(null);
                                  setFilterStatus('ALL');
                                  setFilterStep('ALL');
                                  setFilterLoanStatus('ALL');
                                  setFilterSelfService('ALL');
                                  setFilterSLAStatus('ALL');
                                  setSearch('');
                                }}
                                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                              >
                                Thiết lập lại bộ lọc
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Bulk Actions Bar (Floating) */}
                  <AnimatePresence>
                    {selectedAppIds.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-1 p-2 bg-slate-950 border border-slate-800 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl ring-1 ring-white/10"
                      >
                        <div className="flex items-center gap-3 px-4 mr-2 border-r border-slate-800">
                          <div className="w-8 h-8 rounded-full bg-festive-gold flex items-center justify-center text-slate-950 font-black text-xs">
                            {selectedAppIds.length}
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Đã chọn</span>
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
                              
                              // Step 7 Quy_trinh_2 custom logic
                              if (workflowType === 'Quy_trinh_2' && firstApp.currentStep === 'S7_Ban_Giao_Luu_Kho') {
                                 if (userRole === 'PTT' || userRole === 'ADMIN') {
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
                              
                              if (nextStep && (userRole === 'ADMIN' || userRole === 'MANAGER' || roleDept === userRole || (firstApp.currentStep === 'S1_ChuanBi' && userRole === 'PTT') || (firstApp.currentStep === 'GD1_ChuanBi' && userRole === 'PTT'))) {
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
                            className="w-10 h-10 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-all flex items-center justify-center border border-slate-700/50"
                            title="Ghi chú hàng loạt"
                          >
                            <MessageSquare size={16} />
                          </button>

                          <button 
                            onClick={() => setIsBulkIssueOpen(true)}
                            className="w-10 h-10 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-full transition-all flex items-center justify-center border border-rose-500/20"
                            title="Báo lỗi / Sai sót hàng loạt"
                          >
                            <AlertTriangle size={16} />
                          </button>

                          {(userRole === 'ADMIN' || userRole === 'DIRECTOR' || userRole === 'PTT') && (
                            <button 
                              onClick={handleBulkDelete}
                              className="w-10 h-10 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-full transition-all flex items-center justify-center border border-rose-500/20"
                              title="Xóa đã chọn"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}

                          <button 
                            onClick={() => setSelectedAppIds([])}
                            className="w-10 h-10 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-all flex items-center justify-center border border-slate-700/50 ml-2"
                            title="Hủy chọn"
                          >
                            <X size={16} />
                          </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className={cn(
                          "uppercase transition-all",
                          theme === 'light' ? "bg-slate-100 text-slate-500" : "bg-slate-950/30 text-slate-500"
                        )}>
                          <th className="px-4 py-4 w-10">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded border-slate-700 bg-slate-900 accent-festive-gold"
                              checked={selectedAppIds.length === applications.length && applications.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedAppIds(applications.map(a => a.id));
                                else setSelectedAppIds([]);
                              }}
                            />
                          </th>
                          <th className="px-6 py-4 text-[10px] font-bold tracking-widest font-mono italic">Mã lô/căn</th>
                          <th className="px-6 py-4 text-[10px] font-bold tracking-widest font-mono italic">Dự án</th>
                          <th className="px-6 py-4 text-[10px] font-bold tracking-widest font-mono italic">Khách hàng</th>
                          {isSpreadsheetMode ? (
                            EDITABLE_DATE_FIELDS.map(f => (
                              <th key={f.key} className="px-6 py-4 text-[10px] font-bold tracking-widest font-mono italic text-center whitespace-nowrap bg-indigo-500/5">{f.label}</th>
                            ))
                          ) : (
                            <>
                              <th className="px-6 py-4 text-[10px] font-bold tracking-widest font-mono italic">Đối tượng ký</th>
                              <th className="px-6 py-4 text-[10px] font-bold tracking-widest font-mono italic">Trạng thái</th>
                              {(userRole === 'PTT' || userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'DIRECTOR') && (
                                <th className="px-6 py-4 text-[10px] font-bold tracking-widest font-mono italic text-center">Nộp VPĐK</th>
                              )}
                              {(userRole === 'PTT' || userRole === 'KT' || userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'DIRECTOR') && (
                                <th className="px-6 py-4 text-[10px] font-bold tracking-widest font-mono italic text-center">Nộp thuế</th>
                              )}
                              {(userRole === 'PTDA' || userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'DIRECTOR') && (
                                <th className="px-6 py-4 text-[10px] font-bold tracking-widest font-mono italic text-center">Nhận sổ</th>
                              )}
                              <th className="px-6 py-4 text-[10px] font-bold tracking-widest font-mono italic text-center">BG Khách</th>
                            </>
                          )}
                          <th className="px-6 py-4 text-[10px] font-bold tracking-widest font-mono italic text-center text-indigo-400">Tài liệu</th>
                          <th className="px-6 py-4 text-[10px] font-bold tracking-widest font-mono italic text-center">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className={cn(
                        "divide-y transition-all",
                        theme === 'light' ? "text-slate-700 divide-slate-100" : "text-slate-300 divide-slate-800/40"
                      )}>
                        {applications.map(app => {
                          const overdue = getOverdueInfo(app, stepConfig, slaConfig);
                          return (
                            <tr 
                              key={app.id} 
                              className={cn(
                                "transition-colors cursor-pointer group border-b",
                                theme === 'light' 
                                  ? (selectedAppIds.includes(app.id) ? "bg-festive-gold/10" : "hover:bg-slate-50 border-slate-100") 
                                  : (selectedAppIds.includes(app.id) ? "bg-festive-gold/5" : "hover:bg-slate-800/30 border-slate-800/40")
                              )}
                            >
                              <td className="px-4 py-5" onClick={(e) => e.stopPropagation()}>
                                <input 
                                  type="checkbox" 
                                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 accent-festive-gold"
                                  checked={selectedAppIds.includes(app.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) setSelectedAppIds(prev => Array.from(new Set([...prev, app.id])));
                                    else setSelectedAppIds(prev => prev.filter(id => id !== app.id));
                                  }}
                                />
                              </td>
                              <td 
                                className="px-6 py-5" 
                                onDoubleClick={(e) => {
                                  e.stopPropagation();
                                  setQuickEditId(app.id);
                                  setQuickEditData({ unitCode: app.unitCode, customerName: app.customerName });
                                }}
                                onClick={() => quickEditId !== app.id && setSelectedApp(app)}
                              >
                                <div className="flex flex-col">
                                  {quickEditId === app.id ? (
                                    <input 
                                      autoFocus
                                      className={cn(
                                        "px-2 py-1 text-sm font-black font-mono rounded border outline-none focus:ring-1 focus:ring-festive-gold/50 w-full",
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
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-black text-festive-gold font-mono tracking-tight">{app.unitCode}</span>
                                      {app.isRejected && app.currentStep === 'S1_ChuanBi' && (
                                        <span className="animate-pulse flex items-center gap-1 text-[8px] bg-rose-500 text-white px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter">
                                          <RotateCcw size={8} /> Trả về
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  <span className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">
                                    SLA: {(stepConfig[app.currentStep] || INITIAL_STEP_CONFIG[app.currentStep])?.slaDays || 0} ngày
                                  </span>
                                  {overdue.isOverdue && (
                                    <span className={cn(
                                      "text-[9px] font-bold uppercase tracking-tighter flex items-center gap-1 mt-1",
                                      overdue.daysLate > 5 ? "text-red-500" :
                                      overdue.daysLate >= 3 ? "text-yellow-500" : "text-green-500"
                                    )}>
                                      <AlertTriangle size={10} /> {overdue.label} ({overdue.daysLate} ngày)
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-5" onClick={() => setSelectedApp(app)}>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                  {app.projectName}
                                </span>
                              </td>
                              <td 
                                className="px-6 py-5" 
                                onDoubleClick={(e) => {
                                  e.stopPropagation();
                                  setQuickEditId(app.id);
                                  setQuickEditData({ unitCode: app.unitCode, customerName: app.customerName });
                                }}
                                onClick={() => quickEditId !== app.id && setSelectedApp(app)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0",
                                    theme === 'light' ? "bg-slate-100 text-slate-400" : "bg-slate-800 text-slate-500"
                                  )}>
                                    <User size={14} />
                                  </div>
                                  <div className="flex flex-col flex-1 min-w-0">
                                    {quickEditId === app.id ? (
                                      <input 
                                        className={cn(
                                          "px-2 py-1 text-sm font-medium rounded border outline-none focus:ring-1 focus:ring-indigo-500/50 w-full",
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
                                      <span className={cn("text-sm font-medium truncate", theme === 'light' ? "text-slate-700" : "text-slate-300")}>{app.customerName}</span>
                                    )}
                                    <div className="flex gap-2 mt-1 items-center">
                                      <span className="text-[10px] text-slate-500 font-mono italic">{formatDate(app.receivedDate)}</span>
                                      {app.loanStatus === 'Co_Vay' && <span className="text-[8px] bg-indigo-500/20 text-indigo-400 px-1 rounded font-bold uppercase">Có vay</span>}
                                      {app.isSelfService && <span className="text-[8px] bg-amber-500/20 text-amber-500 px-1 rounded font-bold uppercase">Tự làm</span>}
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
                                        "px-2 py-2 border-x transition-all relative group/cell",
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
                                          "w-full bg-transparent border-none outline-none text-[11px] font-mono text-center placeholder:opacity-30",
                                          theme === 'light' ? "text-slate-700" : "text-slate-200",
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
                                  <td className="px-6 py-5" onClick={() => setSelectedApp(app)}>
                                    <span className={cn("text-xs font-medium", theme === 'light' ? "text-slate-600" : "text-slate-400")}>
                                      {app.contractSignerType || '---'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-5" onClick={() => setSelectedApp(app)}>
                                    <div className="flex flex-col gap-1.5">
                                      <StatusBadge status={app.status} app={app} />
                                      {(app.status === 'Error' || app.isRejected || (app.issueType && app.issueType !== 'None')) && (
                                        <div className="flex flex-col gap-1 group/issue">
                                          <div className="flex items-center gap-1.5">
                                            {app.issueSource && app.issueSource !== 'None' && (
                                              <span className={cn(
                                                "text-[8px] font-black uppercase px-1.5 py-0.5 rounded border leading-none shrink-0",
                                                app.issueSource === 'Chu_Dau_Tu' ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" :
                                                app.issueSource === 'Nha_Nuoc' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                                app.issueSource === 'Noi_Bo' ? "bg-slate-500/10 text-slate-500 border-slate-500/20" :
                                                "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                              )}>
                                                {app.issueSource === 'Chu_Dau_Tu' ? 'CĐT' : 
                                                 app.issueSource === 'Nha_Nuoc' ? 'Nhà nước' : 
                                                 app.issueSource === 'Noi_Bo' ? 'Nội bộ' : 'Khách'}
                                              </span>
                                            )}
                                            <span className={cn(
                                              "text-[9px] font-black uppercase truncate max-w-[100px]",
                                              app.issueSeverity === 'Critical' ? "text-rose-600 animate-bounce" : 
                                              app.issueSeverity === 'Moderate' ? "text-amber-500" : "text-slate-400"
                                            )}>
                                              {app.issueNotes || 'Vướng mắc'}
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  {(userRole === 'PTT' || userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'DIRECTOR') && (
                                    <td className="px-6 py-5 text-center" onClick={() => setSelectedApp(app)}>
                                      <span className={cn("text-[11px] font-mono", theme === 'light' ? "text-slate-400" : "text-slate-500")}>{formatDate(app.submissionDate)}</span>
                                    </td>
                                  )}
                                  {(userRole === 'PTT' || userRole === 'KT' || userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'DIRECTOR') && (
                                    <td className="px-6 py-5 text-center" onClick={() => setSelectedApp(app)}>
                                      <div className="flex flex-col items-center">
                                        <span className={cn("text-[11px] font-mono", theme === 'light' ? "text-slate-400" : "text-slate-500")}>
                                          {app.taxReceiptDate ? formatDate(app.taxReceiptDate) : (app.taxNotificationReceivedDate ? 'Chờ nộp' : '---')}
                                        </span>
                                        <span className={cn("text-[9px] font-bold uppercase", getTaxStatus(app).color)}>
                                          {getTaxStatus(app).label}
                                        </span>
                                      </div>
                                    </td>
                                  )}
                                  {(userRole === 'PTDA' || userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'DIRECTOR') && (
                                    <td className="px-6 py-5 text-center" onClick={() => setSelectedApp(app)}>
                                      <span className={cn("text-[11px] font-mono", theme === 'light' ? "text-slate-400" : "text-slate-500")}>{formatDate(app.gcnReceivedDate)}</span>
                                    </td>
                                  )}
                                  <td className="px-6 py-5 text-center" onClick={() => setSelectedApp(app)}>
                                    <span className={cn("text-[11px] font-mono", theme === 'light' ? "text-slate-400" : "text-slate-500")}>{formatDate(app.customerHandoverDate)}</span>
                                  </td>
                                </>
                              )}
                              <td className="px-6 py-5 text-center" onClick={() => setSelectedApp(app)}>
                                {app.scannedFiles && app.scannedFiles.length > 0 ? (
                                  <div className="flex flex-col items-center gap-1 group/doc">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover/doc:bg-indigo-500 group-hover/doc:text-white transition-all">
                                      <FileText size={14} />
                                    </div>
                                    <span className="text-[9px] font-black">{app.scannedFiles.length} file</span>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-700 font-black opacity-20 italic">Trống</span>
                                )}
                              </td>
                              <td className="px-6 py-5 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button 
                                    onClick={() => setSelectedApp(app)}
                                    className={cn(
                                      "p-2 rounded-lg transition-colors text-slate-500",
                                      theme === 'light' ? "hover:bg-slate-100" : "hover:bg-slate-800"
                                    )}
                                    title="Xem chi tiết"
                                  >
                                    <ChevronRight size={18} />
                                  </button>
                                  {userRole === 'ADMIN' && (
                                    <button 
                                      onClick={(e) => { 
                                        e.stopPropagation(); 
                                        handleDeleteApp(app.id, app.unitCode);
                                      }}
                                      className="p-2 rounded-lg text-slate-500 hover:text-rose-500 transition-colors"
                                      title="Xóa hồ sơ (Chỉ Admin)"
                                    >
                                      <Trash2 size={16} />
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

            {activeTab === 'projects' && (userRole === 'ADMIN' || userRole === 'DIRECTOR') && (
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
                  applications={filteredByProjectApps} 
                  projects={visibleProjects} 
                  regions={regions} 
                  theme={theme}
                  setActiveTab={setActiveTab}
                  setDashboardFilter={setDashboardFilter}
                  setFilterLoanStatus={setFilterLoanStatus}
                  stepConfig={stepConfig}
                  slaConfig={slaConfig}
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
                        <div key={idx} className={cn(
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
                          <button key={idx} className={cn(
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
                      
                      {currentUser?.permission !== 'VIEW' && (
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
                  {(userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'DIRECTOR') && (
                    <button 
                      onClick={() => setExpandedSections(expandedSections.length > 0 ? [] : ['PTT_SECTION', 'KT_SECTION', 'PTDA_SECTION', 'OTHER_SECTION'])}
                      className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase tracking-widest rounded-2xl transition-all border border-slate-700 mr-2"
                    >
                      {expandedSections.length > 0 ? 'Thu gọn' : 'Mở rộng tất cả'}
                    </button>
                  )}
                  {!isEditing ? (
                    currentUser?.permission !== 'VIEW' && (
                      <button 
                        onClick={() => {
                          setIsEditing(true);
                          setEditApp(selectedApp);
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-festive-gold hover:bg-amber-400 text-slate-900 text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-festive-gold/10"
                      >
                        <Edit3 size={16} />
                        Sửa hồ sơ
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
                        const currentPhase = getPhaseIndex((editApp || selectedApp).currentStep);
                        const isCompleted = idx < currentPhase || (editApp || selectedApp).currentStep === 'Hoan_Tat';
                        const isActive = idx === currentPhase && (editApp || selectedApp).currentStep !== 'Hoan_Tat';
                        
                        return (
                          <div key={label} className="flex flex-col items-center gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-700 text-sm font-black border-2",
                              isCompleted ? "bg-emerald-500 border-emerald-500 text-slate-900 rotate-12" : 
                              isActive ? "bg-indigo-600 border-indigo-400 text-white shadow-[0_0_30px_rgba(99,102,241,0.4)] scale-125 -rotate-3" : 
                              theme === 'dark' ? "bg-slate-900 border-slate-800 text-slate-700 hover:border-slate-700" : "bg-slate-100 border-slate-200 text-slate-400 hover:border-slate-300"
                            )}>
                              {isCompleted ? <Check size={24} /> : label}
                            </div>
                            <span className={cn(
                              "text-[10px] font-black uppercase tracking-widest absolute -bottom-2 whitespace-nowrap",
                              isActive ? "text-indigo-400" : isCompleted ? (theme === 'dark' ? "text-emerald-400" : "text-emerald-600") : (theme === 'dark' ? "text-slate-600" : "text-slate-400")
                            )}>
                              {label === '01' && 'Chuẩn bị'}
                              {label === '02' && 'Chờ nộp'}
                              {label === '03' && 'Nộp VPĐK'}
                              {label === '04' && 'Thông báo'}
                              {label === '05' && 'Tài chính'}
                              {label === '06' && 'Nhận sổ'}
                              {label === '07' && 'Bàn giao'}
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
                          {stepConfig[(editApp || selectedApp).currentStep]?.dept}
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
                               {/* Step 2: CHỜ NỘP VPĐK */}
                               <section className="space-y-4">
                                 <div className="flex items-center gap-2 border-b border-slate-800/30 pb-2">
                                   <div className="w-1 h-3 bg-emerald-500 rounded-full opacity-50"></div>
                                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Bước 2: CHỜ NỘP VPĐK (KT)</h4>
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

                               {/* Step 3: NỘP VPĐK */}
                               <section className="space-y-4">
                                 <div className="flex items-center gap-2 border-b border-slate-800/30 pb-2">
                                   <div className="w-1 h-3 bg-emerald-500 rounded-full opacity-50"></div>
                                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Bước 3: NỘP VPĐK (PTDA)</h4>
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

                               {/* Step 4: THÔNG BÁO THUẾ */}
                               <section className="space-y-4">
                                 <div className="flex items-center gap-2 border-b border-slate-800/30 pb-2">
                                   <div className="w-1 h-3 bg-emerald-500 rounded-full opacity-50"></div>
                                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Bước 4: THÔNG BÁO THUẾ (PTDA)</h4>
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
                                   <DetailCard theme={theme}
                                     label="Ngày cung cấp TB Thuế" 
                                     value={(editApp || selectedApp).taxNoticeProvisionDate} 
                                     type="date"
                                     editable={isFieldEditable('taxNoticeProvisionDate')}
                                     isEditing={isEditing}
                                     onChange={(val) => handleFieldChange('taxNoticeProvisionDate', val)}
                                   />
                                 </div>
                               </section>

                               {/* Step 5: NỘP THUẾ & TÀI CHÍNH */}
                               <section className="space-y-4">
                                 <div className="flex items-center gap-2 border-b border-slate-800/30 pb-2">
                                   <div className="w-1 h-3 bg-emerald-500 rounded-full opacity-50"></div>
                                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Bước 5: NỘP THUẾ & TÀI CHÍNH (KT)</h4>
                                 </div>
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                   <DetailCard theme={theme}
                                     label="Ngày nhận GNT / Nộp thuế" 
                                     value={(editApp || selectedApp).taxReceiptDate} 
                                     type="date"
                                     editable={isFieldEditable('taxReceiptDate')}
                                     isEditing={isEditing}
                                     onChange={(val) => handleFieldChange('taxReceiptDate', val)}
                                   />
                                 </div>
                               </section>

                               {/* Step 6: TRÌNH KÝ & NHẬN GCN */}
                               <section className="space-y-4">
                                 <div className="flex items-center gap-2 border-b border-slate-800/30 pb-2">
                                   <div className="w-1 h-3 bg-emerald-500 rounded-full opacity-50"></div>
                                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Bước 6: TRÌNH KÝ & NHẬN GCN (PTDA)</h4>
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

                               {/* Step 7: BÀN GIAO */}
                               <section className="space-y-4">
                                 <div className="flex items-center gap-2 border-b border-slate-800/30 pb-2">
                                   <div className="w-1 h-3 bg-emerald-500 rounded-full opacity-50"></div>
                                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Bước 7: BÀN GIAO</h4>
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
                        className={cn("flex flex-wrap items-center justify-between p-5 cursor-pointer hover:bg-slate-800/10 transition-colors", expandedSections.includes('OTHER_SECTION') && (theme === 'dark' ? "border-b border-slate-800" : "border-b border-slate-200"))}
                        onClick={() => toggleSection('OTHER_SECTION')}
                      >
                         <div className="flex items-center gap-3">
                             <div className="w-1.5 h-6 bg-slate-500 rounded-full"></div>
                             <h4 className={cn("text-sm font-black uppercase tracking-widest", theme === 'dark' ? "text-white" : "text-slate-900")}>3. Vướng mắc & Lịch sử Hồ sơ</h4>
                         </div>
                         <div className="flex items-center gap-4">
                            {expandedSections.includes('OTHER_SECTION') ? <ChevronUp size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
                         </div>
                      </div>
                      <AnimatePresence>
                        {expandedSections.includes('OTHER_SECTION') && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-6 space-y-6">
                               {/* Tabs for Issue Tracking/History/Documents */}
                               <div className="flex items-center gap-2 p-1 bg-slate-900/50 rounded-xl border border-slate-800 w-fit">
                                  <button 
                                    onClick={() => setDetailTab('workflow')}
                                    className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2", detailTab === 'workflow' ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300")}
                                  >
                                    <AlertTriangle size={14} /> Vướng mắc
                                  </button>
                                  <button 
                                    onClick={() => setDetailTab('audit')}
                                    className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2", detailTab === 'audit' ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300")}
                                  >
                                    <History size={14} /> Lịch sử xử lý
                                  </button>
                                  <button 
                                    onClick={() => setDetailTab('documents')}
                                    className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2", detailTab === 'documents' ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300")}
                                  >
                                    <FileText size={14} /> Tài liệu số
                                  </button>
                               </div>

                               {detailTab === 'workflow' && (
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
                                          label="Loại vướng mắc" 
                                          value={(editApp || selectedApp).issueType} 
                                          type="select"
                                          editable={isEditing}
                                          options={['None', 'Paperwork', 'Financial', 'Authority', 'Other']}
                                          isEditing={isEditing}
                                          onChange={(val) => handleFieldChange('issueType', val)}
                                        />
                                        <DetailCard theme={theme}
                                          label="Mức độ" 
                                          value={(editApp || selectedApp).issueSeverity} 
                                          type="select"
                                          editable={isEditing}
                                          options={['Low', 'Medium', 'High', 'Critical']}
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

                               {detailTab === 'audit' && (
                                  <div className="space-y-4">
                                    {((editApp || selectedApp).history || []).length > 0 ? (
                                      (editApp || selectedApp).history.map((hist, idx) => (
                                        <div key={hist.id || idx} className="flex gap-4 group">
                                          <div className="flex flex-col items-center">
                                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border", theme === 'dark' ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-500")}>
                                              {idx + 1}
                                            </div>
                                            {idx !== (editApp || selectedApp).history.length - 1 && <div className="w-px flex-1 bg-slate-800 my-1"></div>}
                                          </div>
                                          <div className="flex-1 pb-6">
                                            <div className="flex items-center justify-between mb-1">
                                              <p className="text-[11px] font-black text-indigo-400 uppercase tracking-wider">{hist.stepName}</p>
                                              <span className="text-[9px] text-slate-500 font-bold">{hist.receivedDate}</span>
                                            </div>
                                            <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800 group-hover:border-indigo-500/30 transition-colors">
                                              <p className="text-[11px] text-slate-300 leading-relaxed mb-2">{hist.note || 'Không có ghi chú.'}</p>
                                              <div className="flex items-center gap-3">
                                                <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-black uppercase tracking-tighter">Bộ phận: {hist.dept}</span>
                                                <span className="text-[9px] text-slate-500 italic">Người thực hiện: {hist.performedByName || 'Hệ thống'}</span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="py-10 text-center">
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Chưa có lịch sử xử lý</p>
                                      </div>
                                    )}
                                  </div>
                               )}

                               {detailTab === 'documents' && (
                                 <div className="space-y-6">
                                   <div className="flex items-center justify-between">
                                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Danh mục tài liệu số</p>
                                      <div className="relative">
                                        <input 
                                          type="file" 
                                          id="doc-upload" 
                                          className="hidden" 
                                          onChange={handleFileUpload}
                                          accept="image/*,.pdf"
                                        />
                                        <label 
                                          htmlFor="doc-upload"
                                          className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600/20 text-indigo-400 rounded-lg text-[9px] font-black uppercase hover:bg-indigo-600/30 transition-all border border-indigo-500/30 cursor-pointer"
                                        >
                                          <Upload size={12} /> Tải tệp lên
                                        </label>
                                      </div>
                                   </div>
                                   
                                   <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                      {((editApp || selectedApp).scannedFiles || []).length > 0 ? (
                                        (editApp || selectedApp).scannedFiles?.map((file) => (
                                          <div 
                                            key={file.id} 
                                            className={cn(
                                              "group/file p-3 bg-slate-900 rounded-2xl border transition-all cursor-pointer",
                                              previewFile?.id === file.id ? "border-festive-gold ring-1 ring-festive-gold/20" : "border-slate-800 hover:border-festive-gold/30"
                                            )}
                                            onClick={() => setPreviewFile(file)}
                                          >
                                            <div className="flex items-center gap-3 mb-2">
                                              <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center",
                                                file.type.startsWith('image/') ? "bg-emerald-500/10 text-emerald-400" : "bg-indigo-500/10 text-indigo-400"
                                              )}>
                                                {file.type.startsWith('image/') ? <Camera size={18} /> : <FileText size={18} />}
                                              </div>
                                              <div className="flex-1 overflow-hidden">
                                                <p className="text-[10px] font-bold text-slate-200 truncate">{file.name}</p>
                                                <p className="text-[8px] text-slate-600 font-black">{file.uploadDate}</p>
                                              </div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                              <span className="text-[9px] font-black text-festive-gold flex items-center gap-1">
                                                <Search size={10} /> Xem
                                              </span>
                                              <button 
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleFileDelete(file.id);
                                                }}
                                                className="p-1.5 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                              >
                                                <Trash2 size={12} />
                                              </button>
                                            </div>
                                          </div>
                                        ))
                                      ) : (
                                        <div className="col-span-full py-12 text-center bg-slate-900/40 rounded-[2rem] border-2 border-dashed border-slate-800">
                                          <Folder size={32} className="mx-auto text-slate-700 mb-3 opacity-30" />
                                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Chưa có tài liệu số</p>
                                        </div>
                                      )}
                                   </div>

                                   {previewFile && (
                                      <div className="mt-4 p-4 rounded-[2rem] border border-slate-800 bg-slate-950 relative overflow-hidden h-[450px] flex items-center justify-center group/preview">
                                        <div className="absolute top-4 right-4 z-20 flex gap-2">
                                           <a 
                                             href={previewFile.url} 
                                             download={previewFile.name}
                                             className="p-2 bg-slate-900/80 backdrop-blur-md rounded-xl text-slate-400 hover:text-white transition-all border border-slate-800"
                                           >
                                              <Download size={16} />
                                           </a>
                                           <button 
                                             onClick={() => setPreviewFile(null)}
                                             className="p-2 bg-slate-900/80 backdrop-blur-md rounded-xl text-slate-400 hover:text-rose-500 transition-all border border-slate-800"
                                           >
                                              <X size={16} />
                                           </button>
                                        </div>
                                        
                                        <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
                                          {renderFilePreview(previewFile)}
                                        </div>
                                      </div>
                                   )}
                                 </div>
                               )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                   </div>
                </div>
              </div>

                {/* Actions & Workflow Transition */}
              <div className="p-6 border-t border-slate-700 space-y-4 bg-slate-900/50">
                {!isEditing && (editApp || selectedApp).status !== 'Completed' && (
                  <div className="flex flex-col gap-3">
                    {/* Báo lỗi / Sai sót (Available for authorized reviewers only) */}
                    {['KT', 'PTDA', 'MANAGER', 'DIRECTOR', 'ADMIN'].includes(userRole) && (
                      <button 
                        onClick={() => {
                          const note = prompt("Vui lòng mô tả sai sót/vướng mắc:");
                          if (note) handleReportError(note);
                        }}
                        className="w-full py-2.5 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-bold hover:bg-rose-500/10 transition-all flex items-center justify-center gap-2"
                      >
                        <AlertTriangle size={14} />
                        Báo sai sót / Vướng mắc
                      </button>
                    )}

                    {/* Transition Logic */}
                    {(() => {
                      const app = editApp || selectedApp;
                      const role = userRole;
                      
                      // Nút phục hồi khi có lỗi
                      if (app.status === 'Error') {
                        return (
                          <button 
                            onClick={handleResolveError}
                            className="w-full py-3 bg-slate-700 text-white rounded-xl text-sm font-bold hover:bg-slate-600 transition-all flex items-center justify-center gap-2"
                          >
                            <CheckCircle2 size={16} /> Xác nhận đã khắc phục lỗi
                          </button>
                        );
                      }

                      let canAction = role === 'ADMIN' || role === 'DIRECTOR' || role === 'MANAGER' || (stepConfig[app.currentStep] || INITIAL_STEP_CONFIG[app.currentStep])?.dept === role;
                      if (app.currentStep === 'S7_Ban_Giao_Luu_Kho' && role === 'PTT') {
                        canAction = true;
                      }

                      if (!canAction) return null;

                      const nextStep = getNextStep(app.currentStep, app.workflowType || 'Quy_trinh_1');
                      const workflowType = app.workflowType || 'Quy_trinh_1';

                      // Bước 7 - Quy trình 2: Rút gọn - Ban giao luu kho
                      if (workflowType === 'Quy_trinh_2' && app.currentStep === 'S7_Ban_Giao_Luu_Kho') {
                        return (
                          <div className="flex flex-col gap-3">
                            {role === 'PTT' && (
                              <button 
                                onClick={() => {
                                  if (!app.customerHandoverDate) {
                                    showToast('Vui lòng nhập Ngày BG GCN cho khách trước khi hoàn tất.', 'warning');
                                    return;
                                  }
                                  handleBulkStepTransition('Hoan_Tat', [app.id]);
                                }}
                                className="w-full py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2"
                              >
                                Xác nhận đã nhận GCN & Giao khách <CheckCircle2 size={16} />
                              </button>
                            )}
                            {role !== 'PTT' && (
                               <p className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-slate-900 p-2 rounded-xl border border-slate-800">
                                 Đang chờ PTT xác nhận bàn giao cho khách
                               </p>
                            )}
                          </div>
                        );
                      }

                      if (nextStep) {
                        return (
                          <div className="flex flex-col gap-3">
                            <button 
                              onClick={() => {
                                 // Define standard steps that require bulk modal for dates
                                 const bulkSteps = ['S2_KT_Tiep_Nhan', 'S2_KT_Ban_giao', 'S3_Nop_VPDK', 'S4_Cho_Thong_Bao_Thue', 'S6_Nhan_So_GCN', 'S7_Ban_Giao_Luu_Kho', 'Hoan_Tat', 'GD1_Cho_KT_TiepNhan', 'GD2_Cho_PTDA_TiepNhan', 'GD2_Cho_Nop_VPDK', 'GD3_Cho_TBThue', 'GD5_Cho_PTDA_TiepNhan_KyGCN', 'GD6_Cho_BG_Khach'];
                                 if (bulkSteps.includes(nextStep)) {
                                   handleBulkStepTransition(nextStep, [app.id]);
                                 } else {
                                   handleStepTransition(nextStep);
                                 }
                              }}
                              className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-900/20 transition-all flex items-center justify-center gap-2"
                            >
                              Chuyển sang bước tiếp theo: {(stepConfig[nextStep] || INITIAL_STEP_CONFIG[nextStep])?.label} <ChevronRight size={16} />
                            </button>
                            
                            {/* Generic Reject Logic */}
                            {app.currentStep !== 'S1_ChuanBi' && app.currentStep !== 'GD1_ChuanBi' && (
                              <button 
                                onClick={() => {
                                  let returnStep = '';
                                  const steps = workflowType === 'Quy_trinh_2' ? WORKFLOW_2_STEPS : WORKFLOW_1_STEPS;
                                  const currentIdx = steps.indexOf(app.currentStep);
                                  if (currentIdx > 0) returnStep = steps[currentIdx - 1];
                                  
                                  const reason = prompt("Lý do trả hồ sơ / quay lại bước trước:");
                                  if (reason) {
                                     if (currentIdx === 1) { // Returning to first step
                                        handleRejectApp(reason);
                                     } else {
                                        // Standard revert: only use handleStepTransition with reason as note
                                        handleStepTransition(returnStep as StepName, reason);
                                     }
                                  }
                                }}
                                className="w-full py-3 bg-slate-500 text-white rounded-xl text-sm font-bold hover:bg-slate-600 shadow-lg transition-all flex items-center justify-center gap-2"
                              >
                                <RotateCcw size={16} /> Trả về bước trước
                              </button>
                            )}
                          </div>
                        );
                      }

                      // If no nextStep and currentStep is Hoan_Tat
                      if (app.currentStep === 'Hoan_Tat') {
                        return (
                           <div className="w-full py-3 bg-emerald-900/20 text-emerald-500 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                             <CheckCircle2 size={16} /> Đã hoàn tất quy trình
                           </div>
                        );
                      }

                      return null;
                    })()}

                  </div>
                )}

                <div>
                  {isEditing ? (
                    <button 
                      onClick={handleUpdateApp}
                      className="w-full py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-900/20 transition-all"
                    >
                      Lưu thay đổi
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        setIsEditing(true);
                        setEditApp(selectedApp);
                      }}
                      className="w-full py-3 bg-festive-gold text-slate-900 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-amber-400 shadow-lg shadow-festive-gold/10 transition-all font-serif"
                    >
                      {(userRole === 'PTT' || userRole === 'KT' || userRole === 'PTDA') ? 'Sửa/Nhập thông tin' : 'Sửa hồ sơ'}
                    </button>
                  )}
                </div>
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
                        <Map size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
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
      <AnimatePresence>
        {isBulkNoteOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/20">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">Ghi chú hàng loạt ({selectedAppIds.length})</h3>
                <button 
                  onClick={() => setIsBulkNoteOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-6">
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-3 tracking-widest pl-1">Nội dung ghi chú mới</p>
                <textarea 
                  autoFocus
                  className="w-full h-32 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none dark:text-slate-200"
                  placeholder="Nhập nội dung ghi chú cho tất cả hồ sơ đã chọn..."
                  value={bulkNoteText}
                  onChange={(e) => setBulkNoteText(e.target.value)}
                />
                <div className="mt-6 flex gap-3">
                  <button 
                    onClick={() => setIsBulkNoteOpen(false)}
                    className="flex-1 py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-800"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    onClick={handleBulkUpdateNote}
                    disabled={!bulkNoteText.trim()}
                    className="flex-[2] py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20"
                  >
                    Cập nhật ngay
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Change Password Modal */}
      <AnimatePresence>
        {isChangePasswordModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-slate-900 rounded-[2.5rem] p-8 border border-slate-700 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                 <div>
                   <h3 className="text-2xl font-black text-white font-serif italic tracking-tight">Đổi mật khẩu</h3>
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Cập nhật mật khẩu bảo mật hệ thống</p>
                 </div>
                 <button onClick={() => setIsChangePasswordModalOpen(false)} className="p-2 text-slate-500 hover:text-white transition-colors">
                   <X size={24} />
                 </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Mật khẩu hiện tại</label>
                  <input 
                    type="password" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-700"
                    placeholder="••••••••"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Mật khẩu mới</label>
                  <input 
                    type="password" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-700"
                    placeholder="••••••••"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Xác nhận mật khẩu mới</label>
                  <input 
                    type="password" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-700"
                    placeholder="••••••••"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <button 
                  onClick={() => setIsChangePasswordModalOpen(false)}
                  className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-all"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={handleUpdatePassword}
                  disabled={isSavingApp}
                  className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold shadow-xl shadow-indigo-600/20 transition-all font-serif italic flex items-center justify-center gap-2"
                >
                   {isSavingApp ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : <Save size={18} />}
                  Cập nhật mật khẩu
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
        source={bulkIssueSource}
        onChangeSource={setBulkIssueSource}
        theme={theme}
      />

      {/* Toast Notification */}
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
  );
}
