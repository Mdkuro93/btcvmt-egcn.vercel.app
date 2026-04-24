import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, Cell,
  PieChart, Pie, LabelList, Legend
} from 'recharts';
import { 
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
  FileText,
  ChevronRight,
  Download,
  Upload,
  LogOut,
  AlertTriangle,
  HelpCircle,
  Plus,
  X,
  ChevronDown,
  Menu,
  Save,
  Trash2,
  Key,
  ChevronLeft,
  PlusCircle,
  FileBarChart,
  ClipboardList,
  Home,
  Check,
  Settings,
  Users,
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
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { MOCK_APPLICATIONS, PROJECTS, STEP_CONFIG, MOCK_USERS } from './constants';
import { Application, UnitStatus, KPI, Dept, UserProfile, PropertyType, StepName, AppNotification as Notification, Project, ApplicationStepHistory } from './types';

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

const LoginScreen = ({ onLogin, users, theme, onThemeToggle }: { onLogin: (user: UserProfile) => void, users: UserProfile[], theme: 'light' | 'dark', onThemeToggle: () => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.username === username || u.email === username);
    if (user && (user.password ? password === user.password : password === '123456')) {
      onLogin(user);
    } else if (!user) {
      alert('Tài khoản không tồn tại!');
    } else {
      alert('Mật khẩu không chính xác! (Gợi ý: 123456)');
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
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Hệ thống quản lý hồ sơ QSDĐ</p>
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

        <div className="mt-8 pt-6 border-t border-slate-800/50">
          <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-tight">Gợi ý đăng nhập Demo:</p>
          <div className="flex flex-wrap justify-center gap-2 mt-3">
            {users.map(u => (
              <button 
                key={u.id}
                onClick={() => setUsername(u.username)}
                className="text-[9px] px-2 py-1 bg-slate-800/50 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                {u.username}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Sub-components
const StatCard = ({ title, value, icon: Icon, colorClass, delay, theme = 'dark' }: { title: string, value: number | string, icon: any, colorClass: string, delay: number, theme?: 'light' | 'dark' }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className={cn(
      "p-5 rounded-3xl shadow-xl border flex flex-col gap-4 relative overflow-hidden transition-all",
      theme === 'dark' ? "bg-slate-900/40 backdrop-blur-md border-slate-800/50" : "bg-white border-slate-200"
    )}
  >
    <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/5 rounded-full blur-2xl"></div>
    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg", colorClass)}>
      <Icon size={24} className="text-white" />
    </div>
    <div>
      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">{title}</p>
      <p className={cn("text-3xl font-black font-serif italic tracking-tighter", theme === 'dark' ? "text-white" : "text-slate-900")}>{value}</p>
    </div>
  </motion.div>
);

const StatusBadge = ({ status }: { status: UnitStatus }) => {
  const configs: Record<UnitStatus, { label: string, classes: string }> = {
    Processing: { label: 'Đang xử lý', classes: 'bg-amber-500/10 text-amber-500 border border-amber-500/20' },
    Submitted: { label: 'Đã nộp VPĐK', classes: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' },
    TaxPending: { label: 'Chờ thông báo thuế', classes: 'bg-orange-500/10 text-orange-400 border border-orange-500/20' },
    TaxCompleted: { label: 'Đã hoàn thành NVTC', classes: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
    GCN_Issued: { label: 'Đã ra GCN', classes: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' },
    Completed: { label: 'Hoàn tất', classes: 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20' },
    Error: { label: 'Sai sót/Vướng', classes: 'bg-rose-600/20 text-rose-500 border border-rose-500/30' },
    Draft: { label: 'Nháp', classes: 'bg-slate-800 text-slate-400 border border-slate-700' },
  };

  const config = configs[status];
  return (
    <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", config.classes)}>
      {config.label}
    </span>
  );
};

const DetailCard = ({ label, value, field, valueColor = 'text-white', editable = false, type = 'text', options, onChange, isEditing = false }: { label: string, value?: string, field?: keyof Application, valueColor?: string, editable?: boolean, type?: string, options?: string[], onChange?: (val: any) => void, isEditing?: boolean }) => {
  const active = editable && isEditing;
  
  return (
    <div className={cn(
      "p-4 border rounded-2xl transition-all group backdrop-blur-sm relative overflow-hidden",
      active 
        ? "bg-emerald-500/5 border-emerald-500/30 ring-1 ring-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]" 
        : "bg-slate-950/40 border-slate-800"
    )}>
      {active && <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 blur-2xl -mr-8 -mt-8 rounded-full"></div>}
      
      <p className={cn(
        "text-[10px] font-black uppercase mb-1.5 tracking-[0.15em] transition-colors leading-tight",
        active ? "text-emerald-400" : "text-slate-500"
      )}>
        {label}
      </p>

      {active ? (
        <div className="relative z-10">
          {type === 'select' ? (
            <div className="relative">
              <select 
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-black text-emerald-400 outline-none focus:ring-2 focus:ring-emerald-500/30 appearance-none cursor-pointer"
                value={value || ''}
                onChange={(e) => onChange?.(e.target.value)}
              >
                {options ? (
                  options.map(opt => <option key={opt} value={opt}>{opt}</option>)
                ) : field === 'submissionLocation' ? (
                  <>
                    <option value="PHUONG">VPĐK Phường</option>
                    <option value="TP_DANANG">VPĐK TP Đà Nẵng</option>
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
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-black text-emerald-400 outline-none focus:ring-2 focus:ring-emerald-500/30"
              value={value || ''}
              onChange={(e) => onChange?.(e.target.value)}
            />
          )}
        </div>
      ) : (
        <p className={cn("text-xs font-bold truncate transition-colors", valueColor)}>
          {value || '---'}
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
    <div className="absolute inset-0 bg-festive-dark/40 backdrop-blur-[2px]"></div>
    <div className="absolute top-0 left-0 right-0 h-[60%] bg-gradient-to-b from-festive-red/40 via-transparent to-transparent"></div>
    <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-festive-dark to-transparent"></div>
  </div>
);

const SettingsView = ({ slaConfig, setSlaConfig, checklistTemplates, setChecklistTemplates }: { slaConfig: Record<string, number>, setSlaConfig: any, checklistTemplates: string[], setChecklistTemplates: any }) => {
  const [newChecklistItem, setNewChecklistItem] = useState('');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      <header className="flex justify-between items-end">
        <div>
           <h2 className="text-3xl font-black text-white italic font-serif tracking-tight">Cấu hình hệ thống</h2>
           <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Quản lý SLA, Checklist & Quy trình</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* SLA Config */}
        <section className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] overflow-hidden group">
          <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <Clock className="text-amber-500" size={20} />
              </div>
              <h3 className="text-base font-black text-white uppercase tracking-tight">Cấu hình SLA (Ngày)</h3>
            </div>
            <Activity className="text-slate-700" size={20} />
          </div>
          <div className="p-8 space-y-4">
            {Object.entries(slaConfig).map(([step, days]) => (
              <div key={step} className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800 group/item hover:border-amber-500/30 transition-all">
                <span className="text-sm font-bold text-slate-300">{step}</span>
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
        <section className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] overflow-hidden group">
          <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <ClipboardList className="text-emerald-500" size={20} />
              </div>
              <h3 className="text-base font-black text-white uppercase tracking-tight">Danh mục Hồ sơ</h3>
            </div>
            <Layers className="text-slate-700" size={20} />
          </div>
          <div className="p-8 space-y-6">
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Thêm hạng mục mới..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-300 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
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
      </div>
    </div>
  );
};

const ReportsView = ({ applications, projects, regions, theme }: { applications: Application[], projects: Project[], regions: string[], theme: 'light' | 'dark' }) => {
  const [reportType, setReportType] = useState<'PROJECT' | 'REGION' | 'DEPT'>('PROJECT');

  const stats = useMemo(() => {
    if (reportType === 'PROJECT') {
      return projects.map(p => {
        const apps = applications.filter(a => a.projectName === p.name);
        return {
          name: p.name,
          total: apps.length,
          completed: apps.filter(a => a.currentStep === 'Hoan_Tat').length,
          processing: apps.filter(a => a.currentStep !== 'Hoan_Tat').length,
          overdue: apps.filter(a => a.status === 'Error').length
        };
      });
    } else {
      return regions.map(r => {
        const apps = applications.filter(a => a.submissionLocation === (r === 'VPĐK Phường' ? 'PHUONG' : 'TP_DANANG'));
        return {
          name: r,
          total: apps.length,
          completed: apps.filter(a => a.currentStep === 'Hoan_Tat').length,
          processing: apps.filter(a => a.currentStep !== 'Hoan_Tat').length,
          overdue: apps.filter(a => a.status === 'Error').length
        };
      });
    }
  }, [applications, projects, regions, reportType]);

  const avgProcessingData = [
    { step: 'KT Hồ sơ', time: 1.5 },
    { step: 'Trình ký', time: 2.8 },
    { step: 'Nộp VPĐK', time: 0.5 },
    { step: 'Đợi Thuế', time: 12.4 },
    { step: 'Đóng Thuế', time: 2.1 },
    { step: 'In GCN', time: 4.2 },
  ];

  const exportPDF = () => {
    alert("Đang khởi tạo tệp PDF báo cáo...");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      <header className="flex justify-between items-end">
        <div>
           <h2 className="text-3xl font-black text-white italic font-serif tracking-tight">Báo cáo & Thống kê</h2>
           <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Phân tích hiệu suất & Tiến độ khu vực</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={exportPDF}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-[10px] font-black uppercase text-slate-300 hover:bg-slate-800 transition-all shadow-xl shadow-black/20"
          >
            <FileText size={14} className="text-rose-500" /> Xuất PDF
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-emerald-600/20 transition-all active:scale-95">
            <FileSpreadsheet size={14} /> Xuất Excel
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 text-left">
        <div className="lg:col-span-3 space-y-8">
          <div className={cn(
            "backdrop-blur-xl border rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group transition-all",
            theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900/40 border-slate-800"
          )}>
            <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity">
               <TrendingUp className="text-amber-500/50" />
            </div>
            <div className="flex items-center gap-4 mb-8">
              <button 
                onClick={() => setReportType('PROJECT')}
                className={cn(
                  "px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all tracking-widest border",
                  reportType === 'PROJECT' ? "bg-amber-500 border-amber-400 text-slate-950 shadow-lg shadow-amber-500/20" : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300"
                )}
              >Dự án</button>
              <button 
                onClick={() => setReportType('REGION')}
                className={cn(
                  "px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all tracking-widest border",
                  reportType === 'REGION' ? "bg-amber-500 border-amber-400 text-slate-950 shadow-lg shadow-amber-500/20" : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300"
                )}
              >Vùng (VPĐK)</button>
            </div>
            
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? "#e2e8f0" : "#1e293b"} vertical={false} />
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
                  <Bar dataKey="processing" name="Đang xử lý" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="completed" name="Hoàn tất" stackId="a" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="overdue" name="Chậm trễ" fill="#ef4444" radius={[6, 6, 6, 6]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Average Time Chart */}
          <div className={cn(
            "backdrop-blur-xl border rounded-[2.5rem] p-8 shadow-2xl transition-all",
            theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900/40 border-slate-800"
          )}>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <Clock size={16} className="text-indigo-500" />
              </div>
               Thời gian xử lý trung bình từng bước (Ngày)
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={avgProcessingData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? "#e2e8f0" : "#1e293b"} horizontal={false} />
                  <XAxis type="number" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis dataKey="step" type="category" stroke="#94a3b8" fontSize={10} fontWeight="black" width={80} axisLine={false} tickLine={false} />
                  <ReTooltip 
                    cursor={{ fill: theme === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)' }}
                    contentStyle={{ 
                      backgroundColor: theme === 'light' ? '#fff' : '#0f172a', 
                      border: theme === 'light' ? '1px solid #e2e8f0' : '1px solid #1e293b', 
                      borderRadius: '16px' 
                    }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: theme === 'light' ? '#334155' : '#fff' }}
                  />
                  <Bar dataKey="time" name="Ngày" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={16}>
                    {avgProcessingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.time > 10 ? '#f43f5e' : '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-[2.5rem] p-8 text-white shadow-xl shadow-emerald-900/20 relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-all duration-700"></div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-4">Tổng hoàn thành</h4>
            <div className="flex items-end justify-between relative z-10">
              <p className="text-5xl font-black italic tracking-tighter">{applications.filter(a => a.currentStep === 'Hoan_Tat').length}</p>
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                <CheckCircle2 size={32} />
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-white/20 relative z-10 flex items-center gap-2">
              <Activity size={14} className="text-emerald-300" />
              <p className="text-[10px] font-bold tracking-tight">+12% so với tháng trước</p>
            </div>
          </div>

          <div className={cn(
            "border rounded-[2.5rem] p-8 shadow-2xl transition-all",
            theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900/40 border-slate-800"
          )}>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6 flex items-center justify-between">
              Top Dự án 
              <Activity size={14} className="text-amber-500/50" />
            </h4>
            <div className="space-y-6">
              {projects.slice(0, 3).map((p, i) => (
                <div key={p.id} className="flex items-center gap-5">
                   <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-xs font-black text-amber-500 border border-slate-200 italic shadow-inner">#{i+1}</div>
                   <div className="flex-1">
                     <p className={cn("text-xs font-black tracking-tight", theme === 'light' ? "text-slate-800" : "text-slate-200")}>{p.name}</p>
                     <div className={cn("w-full h-1.5 rounded-full mt-2 overflow-hidden", theme === 'light' ? "bg-slate-100" : "bg-slate-950")}>
                       <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: i===0 ? '90%' : i===1 ? '75%' : '60%' }}
                        className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full" 
                       />
                     </div>
                   </div>
                </div>
              ))}
            </div>
          </div>

          <div className={cn(
            "border rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden transition-all",
            theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900/40 border-slate-800"
          )}>
             <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">Phân bổ Khu vực</h4>
             <div className="h-[220px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie 
                      data={[
                        { name: 'VPĐK Phường', value: 45 },
                        { name: 'VPĐK Thành phố', value: 35 },
                        { name: 'Khác', value: 20 },
                      ]}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill="#f59e0b" />
                      <Cell fill="#3b82f6" />
                      <Cell fill={theme === 'light' ? '#e2e8f0' : '#334155'} />
                    </Pie>
                    <ReTooltip 
                      contentStyle={{ 
                        backgroundColor: theme === 'light' ? '#fff' : '#0f172a', 
                        border: theme === 'light' ? '1px solid #e2e8f0' : '1px solid #1e293b', 
                        borderRadius: '12px' 
                      }}
                      itemStyle={{ color: theme === 'light' ? '#334155' : '#fff', fontWeight: 'bold' }}
                    />
                 </PieChart>
               </ResponsiveContainer>
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mt-4">
                 <p className={cn("text-xl font-black italic", theme === 'light' ? "text-slate-900" : "text-white")}>100%</p>
                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Hồ sơ</p>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};


const NotificationPanel = ({ notifications, onClose, onRead, theme }: { notifications: Notification[], onClose: () => void, onRead: (id: string) => void, theme: 'light' | 'dark' }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 10, scale: 0.95 }}
    className={cn(
      "absolute left-full ml-4 top-0 w-80 border rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] z-[100] overflow-hidden text-left transition-all",
      theme === 'dark' ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200 shadow-2xl"
    )}
  >
    <div className={cn(
      "p-5 border-b flex justify-between items-center transition-all",
      theme === 'dark' ? "border-slate-700 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-900"
    )}>
      <h4 className="text-xs font-black uppercase tracking-widest">Thông báo</h4>
      <div className="flex items-center gap-2">
        <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold">{notifications.filter(n => !n.isRead).length} Mới</span>
        <button onClick={onClose} className="p-1 hover:bg-slate-500/10 rounded-lg transition-all">
          <X size={14} className="text-slate-400" />
        </button>
      </div>
    </div>
    <div className="max-h-96 overflow-y-auto custom-scrollbar">
      {notifications.length > 0 ? (
        notifications.map(n => (
          <div 
            key={n.id} 
            onClick={() => onRead(n.id)}
            className={cn(
              "p-4 border-b cursor-pointer transition-all",
              theme === 'dark' 
                ? "border-slate-800 hover:bg-slate-800/80" 
                : "border-slate-100 hover:bg-slate-50",
              !n.isRead ? (theme === 'dark' ? "bg-indigo-500/10" : "bg-indigo-50/50") : "opacity-60"
            )}
          >
            <div className="flex gap-3">
              <div className={cn(
                "w-2 h-2 rounded-full mt-1.5 shrink-0",
                n.type === 'Urgent' ? "bg-rose-500" : n.type === 'Success' ? "bg-emerald-500" : "bg-blue-500"
              )} />
              <div>
                <p className={cn("text-xs font-bold", theme === 'dark' ? "text-slate-100" : "text-slate-900")}>{n.title}</p>
                <p className={cn("text-[10px] mt-0.5 leading-relaxed", theme === 'dark' ? "text-slate-400" : "text-slate-600")}>{n.message}</p>
                <p className={cn("text-[9px] mt-2 font-black uppercase tracking-tighter", theme === 'dark' ? "text-slate-500" : "text-slate-400")}>{n.time}</p>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="p-8 text-center text-slate-500">
          <BellOff size={32} className="mx-auto mb-2 opacity-20" />
          <p className="text-xs font-bold italic">Không có thông báo mới</p>
        </div>
      )}
    </div>
    <button className={cn(
      "w-full py-3 text-[10px] font-black uppercase tracking-widest transition-colors border-t",
      theme === 'dark' 
        ? "text-slate-400 hover:text-white bg-slate-900 border-slate-700" 
        : "text-slate-500 hover:text-slate-900 bg-slate-50 border-slate-200"
    )}>
      Xem tất cả
    </button>
  </motion.div>
);


const ProjectManagementView = ({ projects, onCreate, onEdit, onDelete, theme }: { projects: Project[]; onCreate: () => void; onEdit: (p: Project) => void; onDelete: (id: string) => void; theme: 'light' | 'dark' }) => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <header className="flex justify-between items-end text-left">
      <div>
         <h2 className={cn("text-3xl font-black italic font-serif tracking-tight", theme === 'light' ? "text-slate-900" : "text-white")}>Quản lý Dự án</h2>
         <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Thiết lập phạm vi vận hành hệ thống</p>
      </div>
      <button 
        onClick={onCreate}
        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-emerald-600/20 hover:scale-105 active:scale-95 transition-all outline-none"
      >
        <Plus size={16} /> Thêm dự án mới
      </button>
    </header>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map(project => (
        <div 
          key={project.id}
          className={cn(
            "p-6 rounded-[2rem] border transition-all group relative overflow-hidden",
            theme === 'light' ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/40 border-slate-800 shadow-2xl"
          )}
        >
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
              <Building2 size={24} />
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
              <button 
                onClick={() => onEdit(project)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-all"
              >
                <Settings size={14} />
              </button>
              <button 
                onClick={() => onDelete(project.id)}
                className="p-2 rounded-xl bg-slate-800 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          
          <h3 className={cn("text-xl font-bold mb-2", theme === 'light' ? "text-slate-900" : "text-white")}>{project.name}</h3>
          <p className="text-xs text-slate-500 font-medium mb-6 uppercase tracking-widest">{project.region}</p>
          
          <div className="flex items-center gap-6 pt-6 border-t border-slate-800/50">
             <div>
               <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Mã dự án</p>
               <p className={cn("text-sm font-mono font-bold", theme === 'light' ? "text-slate-700" : "text-slate-300")}>{project.id}</p>
             </div>
             <div>
               <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Loại hình</p>
               <p className={cn("text-sm font-bold", theme === 'light' ? "text-slate-700" : "text-slate-300")}>Chung cư/Phố</p>
             </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

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
                      {user.name.split(' ').pop()?.charAt(0)}
                    </div>
                    <div>
                      <p className={cn("text-sm font-bold", theme === 'light' ? "text-slate-800" : "text-slate-100")}>{user.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono italic">@{user.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className={cn(
                    "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all",
                    user.dept === 'ADMIN' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                    user.dept === 'PTT' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    user.dept === 'KT' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    user.dept === 'PTDA' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-slate-700 text-slate-400 border-slate-600'
                  )}>
                    {user.dept}
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

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', title: 'Hồ sơ trễ hạn', message: 'Lô A1.1205 đã quá hạn xử lý 2 ngày', time: '5 phút trước', type: 'Urgent', isRead: false },
    { id: '2', title: 'Cập nhật trạng thái', message: 'Căn hộ B2.0504 đã hoàn tất nộp thuế', time: '1 giờ trước', type: 'Success', isRead: false },
  ]);
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>(MOCK_USERS);
  const [projects, setProjects] = useState<Project[]>(PROJECTS);
  const [applications, setApplications] = useState<Application[]>(MOCK_APPLICATIONS);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'applications' | 'users' | 'resources' | 'reports' | 'settings'>('dashboard');
  const [userRole, setUserRole] = useState<Dept>('PTT');
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
    assignedProjectIds: [] as string[]
  });
  const [editApp, setEditApp] = useState<Application | null>(null);
  const [search, setSearch] = useState('');
  
  // System Configuration States
  const [slaConfig, setSlaConfig] = useState<Record<string, number>>({
    'Kiểm tra hồ sơ': 2,
    'Trình ký Văn bản': 3,
    'Nộp hồ sơ VPĐK': 1,
    'Chờ TB Thuế': 15,
    'Nộp tiền thuế': 3,
    'Chỉnh lý & In GCN': 5,
    'Hoàn tất bàn giao': 1
  });

  const [checklistTemplates, setChecklistTemplates] = useState<string[]>([
    'Đơn đăng ký biến động đất đai',
    'Hợp đồng chuyển nhượng',
    'Sổ đỏ gốc',
    'Căn cước công dân (sao y)',
    'Giấy xác nhận tình trạng hôn nhân/ĐKKH',
    'Tờ khai lệ phí trước bạ',
    'Tờ khai thuế thu nhập cá nhân'
  ]);

  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');

  const regions = useMemo(() => {
    return ["VPĐK Phường", "VPĐK TP Đà Nẵng", "VPĐK Quận Liên Chiểu"];
  }, []);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [detailTab, setDetailTab] = useState<'Workflow' | 'Audit'>('Workflow');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);
  const [filterStep, setFilterStep] = useState<StepName | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<UnitStatus | 'ALL'>('ALL');
  const [filterLoanStatus, setFilterLoanStatus] = useState<'Co_Vay' | 'Khong_Vay' | 'ALL'>('ALL');
  const [filterSelfService, setFilterSelfService] = useState<'YES' | 'NO' | 'ALL'>('ALL');
  const [isShowFilters, setIsShowFilters] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newApp, setNewApp] = useState({
    unitCode: '',
    customerName: '',
    projectName: PROJECTS[0].name,
    propertyType: 'Dat_Nen' as PropertyType,
    loanStatus: 'Khong_Vay' as 'Co_Vay' | 'Khong_Vay',
    submissionLocation: 'PHUONG' as 'PHUONG' | 'TP_DANANG',
    currentStep: 'GD1_ChuanBi' as StepName,
    isSelfService: false
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const calculateDaysDiff = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getPhaseIndex = (step: StepName) => {
    if (['GD1_ChuanBi', 'GD1_Cho_KT_TiepNhan'].includes(step)) return 0;
    if (['GD2_Cho_Nop_VPDK', 'GD2_Cho_PTDA_TiepNhan'].includes(step)) return 1;
    if (['GD3_Cho_TBThue'].includes(step)) return 2;
    if (['GD4_Cho_Nop_NVTC', 'GD4_Cho_KT_TiepNhan_LaySo'].includes(step)) return 3;
    if (['GD5_Cho_GCN', 'GD5_Cho_PTT_TiepNhan_BG'].includes(step)) return 4;
    if (['GD6_Cho_BG_Khach', 'Hoan_Tat'].includes(step)) return 5;
    return -1;
  };

  const getOverdueInfo = (app: Application) => {
    const phaseIndex = getPhaseIndex(app.currentStep);

    // SLA GĐ 1: HĐCN -> Bàn giao hồ sơ (25 ngày)
    if (phaseIndex === 0 && app.contractSigningDate && !app.accountingHandoverDate) {
      const days = calculateDaysDiff(app.contractSigningDate);
      if (days > 25) return { isOverdue: true, daysLate: days - 25, label: 'Trễ bàn giao HS (GĐ1)' };
    }

    // SLA GĐ 2: Tiếp nhận -> Nộp (5 ngày)
    if (phaseIndex === 1 && app.accountingHandoverDate && !app.submissionDate) {
      const days = calculateDaysDiff(app.accountingHandoverDate);
      if (days > 5) return { isOverdue: true, daysLate: days - 5, label: 'Trễ nộp VPĐK (GĐ2)' };
    }

    // SLA GĐ 3: Nộp -> TB Thuế (15 ngày)
    if (phaseIndex === 2 && app.submissionDate && !app.taxNotificationDate) {
      const days = calculateDaysDiff(app.submissionDate);
      if (days > 15) return { isOverdue: true, daysLate: days - 15, label: 'Trễ TB Thuế (GĐ3)' };
    }

    // SLA GĐ 4: TB Thuế -> NVTC (10 ngày)
    if (phaseIndex === 3 && app.taxNotificationDate && !app.taxReceiptDate) {
      const days = calculateDaysDiff(app.taxNotificationDate);
      if (days > 10) return { isOverdue: true, daysLate: days - 10, label: 'Trễ nộp thuế (GĐ4)' };
    }

    // SLA GĐ 5: Hoàn thành thuế -> Có sổ (10 ngày)
    if (phaseIndex === 4 && app.taxReceiptDate && !app.gcnReceivedDate) {
      const days = calculateDaysDiff(app.taxReceiptDate);
      if (days > 10) return { isOverdue: true, daysLate: days - 10, label: 'Trễ nhận GCN (GĐ5)' };
    }

    return { isOverdue: false, daysLate: 0 };
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/g;
    return phoneRegex.test(phone);
  };

  const handleDownloadTemplate = () => {
    let headers: string[] = [];
    let data: any[][] = [];
    const sourceApps = selectedProjectId ? filteredByProjectApps : applications;

    if (userRole === 'PTT') {
      headers = [
        "Dự án", "Mã lô/căn", "Khách hàng", "Sử dụng gói vay", "Loại tài sản", 
        "Ngày nhận hồ sơ", "Ngày ký HĐCN", "Ngày BG HS nội bộ", "Tự làm sổ", "Ngày BG GCN Khách"
      ];
      data = sourceApps.map(app => [
        app.projectName,
        app.unitCode,
        app.customerName,
        app.loanStatus === 'Co_Vay' ? 'Có' : 'Không',
        app.propertyType === 'Can_Ho' ? 'Căn hộ' : 'Đất nền',
        app.receivedDate || '',
        app.contractSigningDate || '',
        app.accountingHandoverDate || '',
        app.isSelfService ? 'Có' : 'Không',
        app.customerHandoverDate || ''
      ]);
    } else if (userRole === 'KT') {
      headers = [
        "Dự án", "Mã lô/căn", "Khách hàng", "Nơi nộp", "Mã HS/Số phiếu hẹn VPĐK", "Ngày nộp VPĐK", 
        "Ngày ban hành TB Thuế", "Ngày nhận TB Thuế", "Ngày nhận Giấy nộp tiền", "Ngày nhận GCN", "Ngày BG GCN PTT",
        "Trạng thái nộp thuế", "Sai sót vướng mắc"
      ];
      data = sourceApps.map(app => [
        app.projectName,
        app.unitCode,
        app.customerName,
        app.submissionLocation === 'PHUONG' ? 'Phường' : 'TP Đà Nẵng',
        app.vpdkCode || '',
        app.submissionDate || '',
        app.taxNotificationDate || '',
        app.taxNotificationReceivedDate || '',
        app.taxReceiptDate || '',
        app.gcnReceivedDate || '',
        app.ptdaHandoverDate || '',
        app.taxPaymentStatus === 'Paid' ? 'Đã nộp' : 'Chưa nộp',
        app.issueNotes ? `[${app.issueType || 'Other'}] ${app.issueNotes}` : ''
      ]);
    } else if (userRole === 'PTDA') {
      headers = [
        "Dự án", "Mã lô/căn", "Ngày cung cấp TB Thuế", "Ngày trình ký/In GCN", "Sai sót vướng mắc"
      ];
      data = sourceApps.map(app => [
        app.projectName,
        app.unitCode,
        app.taxNoticeProvisionDate || '',
        app.gcnSignedDate || '',
        app.issueNotes ? `[${app.issueType || 'Other'}] ${app.issueNotes}` : ''
      ]);
    } else {
      // Default / Admin
      headers = [
        "Dự án", "Mã lô/căn", "Khách hàng", "Ngày nộp VPĐK", "Ngày nhận sổ", "BG Khách"
      ];
      data = sourceApps.map(app => [
        app.projectName,
        app.unitCode,
        app.customerName,
        app.submissionDate || '',
        app.gcnReceivedDate || '',
        app.customerHandoverDate || ''
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
      const bstr = evt.target?.result;
      const workbook = XLSX.read(bstr, { type: 'binary' });
      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];
      const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      const pttFields = ['customerName', 'phoneNumber', 'contractSigningDate', 'submissionLocation', 'isSelfService', 'customerHandoverDate', 'vpdkCode', 'submissionDate'];
      const ktFields = ['taxNotificationDate', 'taxNotificationReceivedDate', 'taxReceiptDate', 'taxPaymentStatus'];
      const ptdaFields = ['gcnReceivedDate', 'ptdaHandoverDate', 'accountingHandoverDate'];

      let updatedCount = 0;
      let createdCount = 0;

      const newApplications = [...applications];

      excelData.slice(1).forEach((row) => {
        if (userRole === 'PTT') {
          const unitCode = row[1];
          if (!unitCode) return;
          const existingIndex = newApplications.findIndex(a => a.unitCode === unitCode);
          const app = existingIndex > -1 ? { ...newApplications[existingIndex] } : {
             id: `imported-${Date.now()}-${Math.random()}`,
             unitCode: unitCode,
             customerName: row[2] || '---',
             projectName: row[0] || PROJECTS[0].name,
             loanStatus: row[3] === 'Có' ? 'Co_Vay' : 'Khong_Vay',
             propertyType: row[4] === 'Căn hộ' ? 'Can_Ho' : 'Dat_Nen',
             currentStep: 'GD1_ChuanBi',
             status: 'Processing',
             receivedDate: row[5] || new Date().toISOString().split('T')[0],
             contractSigningDate: row[6],
             isSelfService: row[7] === 'Có',
             customerHandoverDate: row[8],
             taxPaymentStatus: 'Unpaid' as any,
             history: [{ id: `hist-${Date.now()}`, stepName: 'Khởi tạo (Import)', dept: 'PTT', receivedDate: new Date().toISOString().split('T')[0] }]
          } as Application;

          if (existingIndex > -1) {
            app.projectName = row[0] || app.projectName;
            app.customerName = row[2] || app.customerName;
            app.loanStatus = row[3] === 'Có' ? 'Co_Vay' : 'Khong_Vay';
            app.propertyType = row[4] === 'Căn hộ' ? 'Can_Ho' : 'Dat_Nen';
            app.receivedDate = row[5] || app.receivedDate;
            app.contractSigningDate = row[6] || app.contractSigningDate;
            app.accountingHandoverDate = row[7] || app.accountingHandoverDate;
            app.isSelfService = row[8] === 'Có';
            app.customerHandoverDate = row[9] || app.customerHandoverDate;
            newApplications[existingIndex] = app;
            updatedCount++;
          } else {
            newApplications.push(app);
            createdCount++;
          }
        } 
        else if (userRole === 'KT') {
          const unitCode = row[1];
          if (!unitCode) return;
          const idx = newApplications.findIndex(a => a.unitCode === unitCode);
          if (idx > -1) {
            const app = { ...newApplications[idx] };
            app.projectName = row[0] || app.projectName;
            app.submissionLocation = row[3] === 'Phường' ? 'PHUONG' : 'TP_DANANG';
            app.vpdkCode = row[4] || app.vpdkCode;
            app.submissionDate = row[5] || app.submissionDate;
            app.taxNotificationDate = row[6] || app.taxNotificationDate;
            app.taxNotificationReceivedDate = row[7] || app.taxNotificationReceivedDate;
            app.taxReceiptDate = row[8] || app.taxReceiptDate;
            app.gcnReceivedDate = row[9] || app.gcnReceivedDate;
            app.ptdaHandoverDate = row[10] || app.ptdaHandoverDate;
            app.taxPaymentStatus = row[11] === 'Đã nộp' ? 'Paid' : 'Unpaid';
            if (row[12]) {
              app.issueNotes = row[12];
              app.issueType = 'Other';
            }
            newApplications[idx] = app;
            updatedCount++;
          }
        }
        else if (userRole === 'PTDA') {
          const unitCode = row[1];
          if (!unitCode) return;
          const idx = newApplications.findIndex(a => a.unitCode === unitCode);
          if (idx > -1) {
            const app = { ...newApplications[idx] };
            app.projectName = row[0] || app.projectName;
            app.taxNoticeProvisionDate = row[2] || app.taxNoticeProvisionDate;
            app.gcnSignedDate = row[3] || app.gcnSignedDate;
            if (row[4]) {
              app.issueNotes = row[4];
              app.issueType = 'Other';
            }
            newApplications[idx] = app;
            updatedCount++;
          }
        }
      });

      setApplications(newApplications);
      alert(`Hoàn tất nhập liệu: Cập nhật ${updatedCount} hồ sơ, Tạo mới ${createdCount} hồ sơ. (Lưu ý: Chỉ các cột thuộc quyền hạn ${userRole} mới được ghi đè)`);
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; 
  };

  const handleUpdateApp = () => {
    if (!editApp) return;
    setApplications(prev => prev.map(app => app.id === editApp.id ? editApp : app));
    setSelectedApp(editApp);
    setIsEditing(false);
    alert('Đã cập nhật thông tin hồ sơ thành công!');
  };

  const handleStepTransition = (nextStep: StepName) => {
    const app = editApp || selectedApp;
    if (!app) return;

    // Smart logic for self-service: jump over intermediate processing steps
    let targetStep = nextStep;
    const intermediateSteps: StepName[] = [
      'GD1_Cho_KT_TiepNhan', 'GD2_Cho_Nop_VPDK', 'GD2_Cho_PTDA_TiepNhan',
      'GD3_Cho_TBThue', 'GD4_Cho_Nop_NVTC', 'GD4_Cho_KT_TiepNhan_LaySo',
      'GD5_Cho_GCN', 'GD5_Cho_PTT_TiepNhan_BG'
    ];
    if (app.isSelfService && intermediateSteps.includes(nextStep)) {
      targetStep = 'GD6_Cho_BG_Khach';
    }

    const newHistory = [
      {
        id: `hist-${Date.now()}`,
        stepName: STEP_CONFIG[targetStep].label,
        dept: STEP_CONFIG[targetStep].dept,
        receivedDate: new Date().toISOString().split('T')[0]
      },
      ...app.history
    ];

    const updatedApp = {
      ...app,
      currentStep: targetStep,
      status: STEP_CONFIG[targetStep].status,
      history: newHistory
    };

    setApplications(prev => prev.map(a => a.id === app.id ? updatedApp : a));
    setSelectedApp(updatedApp);
    setEditApp(null);
    setIsEditing(false);
    alert(`Đã chuyển hồ sơ sang bước: ${STEP_CONFIG[targetStep].label}`);
  };

  const handleBulkStepTransition = (nextStep: StepName) => {
    if (selectedAppIds.length === 0) return;
    
    const nowStr = new Date().toISOString().split('T')[0];
    const updatedCount = selectedAppIds.length;
    
    setApplications(prev => prev.map(app => {
      if (!selectedAppIds.includes(app.id)) return app;
      
      // Smart logic for self-service: jump over intermediate processing steps
      let targetStep = nextStep;
      const intermediateSteps: StepName[] = [
        'GD1_Cho_KT_TiepNhan', 'GD2_Cho_Nop_VPDK', 'GD2_Cho_PTDA_TiepNhan',
        'GD3_Cho_TBThue', 'GD4_Cho_Nop_NVTC', 'GD4_Cho_KT_TiepNhan_LaySo',
        'GD5_Cho_GCN', 'GD5_Cho_PTT_TiepNhan_BG'
      ];
      if (app.isSelfService && intermediateSteps.includes(nextStep)) {
        targetStep = 'GD6_Cho_BG_Khach';
      }
      
      const newHistory = [
        {
          id: `hist-${Date.now()}-${app.id}`,
          stepName: STEP_CONFIG[targetStep].label,
          dept: STEP_CONFIG[targetStep].dept,
          receivedDate: nowStr,
          note: 'Chuyển hàng loạt'
        },
        ...app.history
      ];
      
      return {
        ...app,
        currentStep: targetStep,
        status: STEP_CONFIG[targetStep].status,
        history: newHistory
      };
    }));
    
    setSelectedAppIds([]);
    alert(`Đã xử lý hàng loạt ${updatedCount} hồ sơ.`);
  };

  const handleReportError = (note: string) => {
    const app = editApp || selectedApp;
    if (!app) return;

    const newHistory = [
      {
        id: `hist-${Date.now()}`,
        stepName: 'Báo lỗi/Sai sót',
        dept: userRole,
        receivedDate: new Date().toISOString().split('T')[0],
        note
      },
      ...app.history
    ];

    const updatedApp = {
      ...app,
      status: 'Error' as const,
      // currentStep remains the same to keep it in the current stage
      history: newHistory
    };

    setApplications(prev => prev.map(a => a.id === app.id ? updatedApp : a));
    setSelectedApp(updatedApp);
    setEditApp(null);
    setIsEditing(false);
    alert('Đã ghi nhận sai sót tại bước này.');
  };

  const handleResolveError = () => {
    const app = editApp || selectedApp;
    if (!app) return;

    const newHistory = [
      {
        id: `hist-${Date.now()}`,
        stepName: 'Khắc phục lỗi',
        dept: userRole,
        receivedDate: new Date().toISOString().split('T')[0],
        note: 'Đã xử lý xong các sai sót/vướng mắc.'
      },
      ...app.history
    ];

    const updatedApp = {
      ...app,
      status: STEP_CONFIG[app.currentStep]?.status || 'Processing',
      history: newHistory
    };

    setApplications(prev => prev.map(a => a.id === app.id ? updatedApp : a));
    setSelectedApp(updatedApp);
    alert('Đơn hàng đã được phục hồi trạng thái xử lý.');
  };

  const isFieldEditable = (fieldName: string) => {
    if (!isEditing) return false;
    if (userRole === 'ADMIN') return true;

    // Master & Procedural: PTT responsible for initial collection and master data
    const pttFields = [
      'customerName', 'loanStatus', 'propertyType', 
      'contractSigningDate', 'receivedDate', 'isSelfService'
    ];

    // Financial & Tax & Authority Submission: KT now responsible for VPDK submission too
    const ktFields = [
      'submissionLocation', 'vpdkCode', 'submissionDate',
      'taxNotificationDate', 'taxNotificationReceivedDate', 
      'taxReceiptDate', 'taxPaymentStatus', 
      'issueType', 'issueNotes'
    ];

    // Project/Authority: PTDA responsible for GCN receiving and signing progress
    const ptdaFields = [
      'taxNoticeProvisionDate', 'gcnSignedDate',
      'gcnReceivedDate', 'ptdaHandoverDate', 'accountingHandoverDate',
      'customerHandoverDate', 'issueType', 'issueNotes'
    ];

    if (userRole === 'PTT') return pttFields.includes(fieldName);
    if (userRole === 'KT') return ktFields.includes(fieldName);
    if (userRole === 'PTDA') return ptdaFields.includes(fieldName);
    if (userRole === 'MANAGER') return false; // Managers are read-only
    
    return false;
  };

  const isFieldVisible = (fieldName: string) => {
    if (userRole === 'ADMIN' || userRole === 'MANAGER') return true;

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
          if (field === 'issueNotes' && value) {
            if (!app.issueType || app.issueType === 'None') {
              nextApp.issueType = 'Other';
            }
            nextApp.status = 'Error';
          }
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

  const handleCreateApp = () => {
    const errors: Record<string, string> = {};
    if (!newApp.unitCode) errors.unitCode = 'Vui lòng nhập mã căn';
    if (!newApp.customerName) errors.customerName = 'Vui lòng nhập tên khách hàng';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const appToAdd: Application = {
      id: `app-${Date.now()}`,
      unitCode: newApp.unitCode,
      customerName: newApp.customerName,
      projectName: newApp.projectName,
      propertyType: newApp.propertyType,
      loanStatus: newApp.loanStatus,
      submissionLocation: newApp.submissionLocation,
      isSelfService: newApp.isSelfService,
      currentStep: 'GD1_ChuanBi',
      status: 'Processing',
      receivedDate: new Date().toISOString().split('T')[0],
      taxPaymentStatus: 'Unpaid',
      history: [
        {
          id: `hist-${Date.now()}`,
          stepName: 'GĐ1: Đang chuẩn bị hồ sơ',
          dept: 'PTT',
          receivedDate: new Date().toISOString().split('T')[0],
          note: 'Khởi tạo hồ sơ mới'
        }
      ]
    };

    setApplications(prev => [appToAdd, ...prev]);
    setIsCreateModalOpen(false);
    setNewApp({ 
      unitCode: '', 
      customerName: '', 
      projectName: PROJECTS[0].name,
      propertyType: 'Dat_Nen',
      loanStatus: 'Khong_Vay',
      submissionLocation: 'PHUONG',
      currentStep: 'GD1_ChuanBi',
      isSelfService: false
    });
    setFormErrors({});
    alert('Hồ sơ mới đã được khởi tạo thành công!');
  };

  const handleCreateUser = () => {
    if (!newUser.username || !newUser.name) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }
    const userToAdd: UserProfile = {
      id: `user-${Date.now()}`,
      ...newUser,
    };
    setUsers(prev => [...prev, userToAdd]);
    setIsUserModalOpen(false);
    setNewUser({ username: '', password: '', name: '', dept: 'PTT', email: '', status: 'Active', assignedProjectIds: [] });
  };

  const handleUpdateUser = () => {
    if (!editUser) return;
    setUsers(prev => prev.map(u => u.id === editUser.id ? editUser : u));
    setEditUser(null);
    setIsUserModalOpen(false);
  };

  const selectedProject = useMemo(() => 
    PROJECTS.find(p => p.id === selectedProjectId), 
  [selectedProjectId]);

  const visibleProjects = useMemo(() => {
    if (userRole === 'ADMIN' || userRole === 'MANAGER') return PROJECTS;
    if (!currentUser?.assignedProjectIds || currentUser.assignedProjectIds.length === 0) return PROJECTS; 
    return PROJECTS.filter(p => currentUser.assignedProjectIds?.includes(p.id));
  }, [currentUser, userRole]);

  const filteredByProjectApps = useMemo(() => {
    const baseApps = (userRole === 'ADMIN' || userRole === 'MANAGER') 
      ? applications 
      : applications.filter(app => {
          const project = PROJECTS.find(p => p.name === app.projectName);
          return project && (currentUser?.assignedProjectIds || []).includes(project.id);
        });

    if (!selectedProjectId) return baseApps;
    return baseApps.filter(app => app.projectName === selectedProject?.name);
  }, [selectedProjectId, selectedProject, applications, currentUser, userRole]);

  const kpis: KPI = useMemo(() => {
    return {
      total: filteredByProjectApps.length,
      // Aggregating by logical status from Step Config to include errors in their stages
      processing: filteredByProjectApps.filter(a => STEP_CONFIG[a.currentStep]?.status === 'Processing').length,
      submitted: filteredByProjectApps.filter(a => STEP_CONFIG[a.currentStep]?.status === 'Submitted').length,
      taxPending: filteredByProjectApps.filter(a => STEP_CONFIG[a.currentStep]?.status === 'TaxPending').length,
      taxCompleted: filteredByProjectApps.filter(a => STEP_CONFIG[a.currentStep]?.status === 'TaxCompleted').length,
      gcnIssued: filteredByProjectApps.filter(a => STEP_CONFIG[a.currentStep]?.status === 'GCN_Issued').length,
      completed: filteredByProjectApps.filter(a => STEP_CONFIG[a.currentStep]?.status === 'Completed').length,
      error: filteredByProjectApps.filter(a => a.status === 'Error').length,
      overdue: filteredByProjectApps.filter(a => getOverdueInfo(a).isOverdue).length,
      loanCount: filteredByProjectApps.filter(a => a.loanStatus === 'Co_Vay').length,
      regularCount: filteredByProjectApps.filter(a => a.loanStatus === 'Khong_Vay').length,
    };
  }, [filteredByProjectApps]);

  const roleKpis = useMemo(() => {
    const apps = filteredByProjectApps;
    
    // PTT
    const pttHolding = apps.filter(a => STEP_CONFIG[a.currentStep]?.dept === 'PTT').length;
    const pttMissingDocs = apps.filter(a => {
        const checklistCount = Object.values(a.checklist || {}).filter(v => v).length;
        return checklistCount < DOC_CHECKLIST_ITEMS.length;
    }).length;
    const pttTaxPending = apps.filter(a => a.currentStep === 'GD4_Cho_Nop_NVTC' && a.taxPaymentStatus === 'Unpaid').length;
    const pttSlowest = apps.filter(a => STEP_CONFIG[a.currentStep]?.dept === 'PTT')
        .map(a => ({ ...a, overdue: getOverdueInfo(a) }))
        .filter(a => a.overdue.isOverdue)
        .sort((a, b) => (b.overdue.daysLate || 0) - (a.overdue.daysLate || 0))
        .slice(0, 5);

    // KT
    const ktReceived = apps.filter(a => STEP_CONFIG[a.currentStep]?.dept === 'KT').length;
    const ktGrouping = apps.filter(a => a.currentStep === 'GD2_Cho_Nop_VPDK').length;
    const ktSubmitted = apps.filter(a => !!a.submissionDate).length;
    const ktPrinting = apps.filter(a => a.status === 'GCN_Issued').length;
    const ktGcnReceived = apps.filter(a => !!a.gcnReceivedDate).length;

    // PTDA
    const ptdaNoTax = apps.filter(a => a.currentStep === 'GD3_Cho_TBThue').length;
    const ptdaAppsWithTax = apps.filter(a => a.submissionDate && a.taxNotificationDate);
    const avgTaxWait = ptdaAppsWithTax.length > 0 
        ? ptdaAppsWithTax.reduce((acc, curr) => {
            const start = new Date(curr.submissionDate!).getTime();
            const end = new Date(curr.taxNotificationDate!).getTime();
            return acc + (end - start);
          }, 0) / ptdaAppsWithTax.length / (1000 * 60 * 60 * 24)
        : 0;
    const ptdaStuck = apps.filter(a => STEP_CONFIG[a.currentStep]?.dept === 'PTDA' && getOverdueInfo(a).isOverdue).length;

    // Admin Specific - SLA Stats & Warnings
    const adminSlaStages = [
        { label: 'GĐ1: Chuẩn bị', sla: 25 },
        { label: 'GĐ2: Nộp VPĐK', sla: 5 },
        { label: 'GĐ3: TB Thuế', sla: 15 },
        { label: 'GĐ4: NVTC', sla: 10 },
        { label: 'GĐ5: Có sổ', sla: 10 },
    ];

    const adminSlaStats = adminSlaStages.map(stage => {
        const seed = selectedProjectId || 'global';
        const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const variance = (hash % 10) - 4; 
        const avg = Math.max(1, stage.sla + variance + (apps.filter(a => getOverdueInfo(a).isOverdue).length / (apps.length || 1)) * 5);
        return {
            ...stage,
            avg: Math.round(avg),
            color: avg > stage.sla ? 'bg-rose-500' : (avg < stage.sla * 0.8 ? 'bg-emerald-500' : 'bg-festive-gold')
        };
    });

    const adminWarnings = [];
    const overdueCount = apps.filter(a => getOverdueInfo(a).isOverdue).length;
    const errorCount = apps.filter(a => a.status === 'Error').length;
    
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
    if (apps.length > 0 && overdueCount > apps.length * 0.3) {
        adminWarnings.push({
            title: `Cảnh báo rủi ro Hệ thống: ${Math.round((overdueCount/apps.length)*100)}% trễ hạn`,
            desc: `Tỷ lệ trễ hạn vượt ngưỡng cho phép, yêu cầu báo cáo giải trình từ các trưởng bộ phận.`,
            icon: History,
            color: 'indigo'
        });
    }

    return {
        ptt: { holding: pttHolding, missingDocs: pttMissingDocs, taxPending: pttTaxPending, slowest: pttSlowest },
        kt: { received: ktReceived, grouping: ktGrouping, submitted: ktSubmitted, printing: ktPrinting, gcnReceived: ktGcnReceived },
        ptda: { noTax: ptdaNoTax, avgTaxWait: Math.round(avgTaxWait), stuck: ptdaStuck },
        admin: { slaStats: adminSlaStats, warnings: adminWarnings }
    };
  }, [filteredByProjectApps, selectedProjectId, selectedProject]);

  const chartData = useMemo(() => {
    const getStageStats = (status: UnitStatus) => {
      const apps = filteredByProjectApps.filter(a => STEP_CONFIG[a.currentStep]?.status === status);
      return {
        total: apps.length,
        error: apps.filter(a => a.status === 'Error').length,
        normal: apps.filter(a => a.status !== 'Error').length,
      };
    };

    const processing = getStageStats('Processing');
    const submitted = getStageStats('Submitted');
    const taxPending = getStageStats('TaxPending');
    const taxCompleted = getStageStats('TaxCompleted');
    const gcnIssued = getStageStats('GCN_Issued');
    const completed = getStageStats('Completed');

    return [
      { name: 'Đang xử lý', value: processing.total, normal: processing.normal, error: processing.error, color: '#f59e0b' },
      { name: 'Đã nộp VPĐK', value: submitted.total, normal: submitted.normal, error: submitted.error, color: '#6366f1' },
      { name: 'Chờ thuế', value: taxPending.total, normal: taxPending.normal, error: taxPending.error, color: '#fb923c' },
      { name: 'Xong thuế', value: taxCompleted.total, normal: taxCompleted.normal, error: taxCompleted.error, color: '#10b981' },
      { name: 'Đã có GCN', value: gcnIssued.total, normal: gcnIssued.normal, error: gcnIssued.error, color: '#06b6d4' },
      { name: 'Hoàn tất', value: completed.total, normal: completed.normal, error: completed.error, color: '#059669' },
    ];
  }, [filteredByProjectApps]);

  const filteredApps = filteredByProjectApps.filter(app => {
    const matchesSearch = app.unitCode.toLowerCase().includes(search.toLowerCase()) ||
      app.customerName.toLowerCase().includes(search.toLowerCase()) ||
      app.projectName.toLowerCase().includes(search.toLowerCase());
    
    const matchesStep = filterStep === 'ALL' || app.currentStep === filterStep;
    const matchesStatus = filterStatus === 'ALL' || app.status === filterStatus;
    const matchesLoan = filterLoanStatus === 'ALL' || app.loanStatus === filterLoanStatus;
    const matchesSelfService = filterSelfService === 'ALL' || 
      (filterSelfService === 'YES' ? app.isSelfService === true : app.isSelfService !== true);
    
    return matchesSearch && matchesStep && matchesStatus && matchesLoan && matchesSelfService;
  });

  if (!currentUser) {
    return <LoginScreen users={users} theme={theme} onThemeToggle={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')} onLogin={(user) => {
      setCurrentUser(user);
      setUserRole(user.dept);
    }} />;
  }

  return (
    <div className={cn(
      "flex h-screen overflow-hidden font-sans relative transition-colors duration-500",
      theme === 'light' ? 'light bg-slate-50 text-slate-900' : 'bg-festive-dark text-slate-200'
    )}>
      {/* Background Image Container */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1559592442-7e18259f6966?q=80&w=2560&auto=format&fit=crop" 
          alt="Da Nang Background" 
          className={cn(
            "w-full h-full object-cover transition-all duration-1000",
            theme === 'light' ? "opacity-10 grayscale-[50%]" : "opacity-30 brightness-50"
          )}
          referrerPolicy="no-referrer"
        />
        <div className={cn(
          "absolute inset-0 transition-all duration-500",
          theme === 'light' 
            ? "bg-gradient-to-br from-white/90 via-slate-50/95 to-white/90" 
            : "bg-gradient-to-br from-slate-950/90 via-slate-900/95 to-slate-950/90"
        )}></div>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "w-64 backdrop-blur-3xl border-r flex flex-col shrink-0 z-10 relative transition-all",
        theme === 'light' ? "bg-white/60 border-slate-200" : "bg-slate-900/40 border-slate-800/50"
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
          {/* Notifications Trigger */}
          <div className="relative mb-2">
            <button 
              onClick={() => setIsNotiOpen(!isNotiOpen)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm",
                isNotiOpen 
                  ? (theme === 'light' ? "bg-slate-200 text-slate-950" : "bg-slate-800 text-white") 
                  : (theme === 'light' ? "text-slate-500 hover:bg-slate-100 hover:text-slate-900" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200")
              )}
            >
              <div className="flex items-center gap-3">
                <Bell size={18} className={notifications.some(n => !n.isRead) ? "text-rose-500 animate-bounce" : ""} />
                Thông báo
              </div>
              {notifications.some(n => !n.isRead) && (
                <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                  {notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </button>
            <AnimatePresence>
              {isNotiOpen && (
                <NotificationPanel 
                  notifications={notifications} 
                  onClose={() => setIsNotiOpen(false)} 
                  onRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? {...n, isRead: true} : n))}
                  theme={theme}
                />
              )}
            </AnimatePresence>
          </div>

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

          {(userRole === 'ADMIN' || userRole === 'PTDA') && (
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
              Báo cáo & Thống kê
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

          <div className="pt-4 border-t border-slate-800/50 mt-4 px-4 pb-2">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Dự án</p>
          </div>
          <button 
            onClick={() => setSelectedProjectId(null)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-bold",
              selectedProjectId === null ? "bg-slate-800/80 text-festive-gold ring-1 ring-slate-700" : "text-slate-400 hover:bg-slate-800/50"
            )}
          >
            <Map size={16} />
            <span className="truncate">Tất cả dự án</span>
          </button>
          {visibleProjects.map(p => (
            <button 
              key={p.id} 
              onClick={() => setSelectedProjectId(p.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-bold",
                selectedProjectId === p.id ? "bg-slate-800/80 text-festive-gold ring-1 ring-slate-700" : "text-slate-400 hover:bg-slate-800/50"
              )}
            >
              <Map size={16} />
              <span className="truncate">{p.name}</span>
            </button>
          ))}
        </nav>

        <div className={cn(
          "p-4 border-t space-y-3 transition-all",
          theme === 'light' ? "border-slate-200" : "border-slate-800/50"
        )}>
          {/* Theme Toggle Button */}
          <button 
            onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 font-bold text-[10px] uppercase tracking-widest outline-none border",
              theme === 'light' ? "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200" : "bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800"
            )}
          >
            {theme === 'dark' ? <Sun size={14} className="text-festive-gold" /> : <Moon size={14} className="text-indigo-500" />}
            {theme === 'dark' ? 'Giao diện Sáng' : 'Giao diện Tối'}
          </button>

          <div className={cn(
            "p-3 rounded-2xl border flex items-center gap-3 transition-all",
            theme === 'light' ? "bg-white border-slate-200 shadow-sm" : "bg-slate-950/40 border-slate-800"
          )}>
            <div className="w-10 h-10 rounded-xl bg-festive-gold/20 flex items-center justify-center text-festive-gold font-black text-xs border border-festive-gold/20">
              {currentUser?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className={cn("text-xs font-bold truncate", theme === 'light' ? "text-slate-900" : "text-white")}>{currentUser?.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate">
                  Dept: <span className="text-festive-gold">{currentUser?.dept}</span>
                </p>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setCurrentUser(null)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-bold text-rose-400 border border-rose-500/10 hover:bg-rose-500/10 transition-all uppercase tracking-widest"
          >
            <LogOut size={12} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden z-10 relative">
        {/* Header */}
        <header className={cn(
          "h-20 backdrop-blur-lg border-b flex items-center justify-between px-8 shrink-0 transition-all",
          theme === 'light' ? "bg-white/60 border-slate-200" : "bg-slate-900/20 border-slate-800/50"
        )}>
          <div className="flex items-center gap-4">
            <h2 className={cn("text-2xl font-black font-serif italic tracking-tighter", theme === 'light' ? "text-slate-900" : "text-white")}>
              {activeTab === 'dashboard' ? (selectedProject ? `Dashboard: ${selectedProject.name}` : 'Tổng quan Vùng') : (selectedProject ? `Hồ sơ: ${selectedProject.name}` : 'Danh sách Hồ sơ cấp GCN')}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Tìm mã căn, khách..." 
                className="pl-10 pr-4 py-2 bg-slate-950/50 border border-slate-700/50 rounded-full text-sm text-slate-200 focus:ring-2 focus:ring-festive-gold/20 transition-all w-64 outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 border-x border-slate-800/50 px-4 h-10">
              <button 
                onClick={handleDownloadTemplate}
                className="p-2.5 rounded-full bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-festive-gold hover:border-festive-gold/30 transition-all shadow-sm group relative"
                title="Tải mẫu Excel"
              >
                <Download size={18} />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 border border-festive-gold/20 text-[10px] text-festive-gold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Tải mẫu Excel</span>
              </button>
              <label className="p-2.5 rounded-full bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-festive-gold hover:border-festive-gold/30 transition-all shadow-sm cursor-pointer group relative" title="Nhập liệu Excel">
                <Upload size={18} />
                <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImportTemplate} />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 border border-festive-gold/20 text-[10px] text-festive-gold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Nhập liệu Excel</span>
              </label>
            </div>

            <button 
              onClick={() => {
                const defaultProj = selectedProject?.name || (visibleProjects.length > 0 ? visibleProjects[0].name : PROJECTS[0].name);
                setNewApp(prev => ({ ...prev, projectName: defaultProj }));
                setIsCreateModalOpen(true);
              }}
              className="bg-festive-gold hover:bg-amber-400 text-slate-950 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest shadow-xl shadow-festive-gold/10 transition-all active:scale-95"
            >
              + Tạo mới hồ sơ
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-transparent custom-scrollbar relative">
          <FestiveBranding />
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Hồ sơ đang giữ" value={roleKpis.ptt.holding} icon={Files} colorClass="bg-indigo-500" delay={0.1} theme={theme} />
                    <StatCard title="Thiếu giấy tờ" value={roleKpis.ptt.missingDocs} icon={AlertTriangle} colorClass="bg-amber-500" delay={0.2} theme={theme} />
                    <StatCard title="Chưa xong NVTC" value={roleKpis.ptt.taxPending} icon={Clock} colorClass="bg-rose-500" delay={0.3} theme={theme} />
                    <StatCard title="Hồ sơ hoàn tất" value={kpis.completed} icon={CheckCircle2} colorClass="bg-emerald-500" delay={0.4} theme={theme} />
                  </div>
                )}

                {userRole === 'KT' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Hồ sơ đã tiếp nhận" value={roleKpis.kt.received} icon={Files} colorClass="bg-indigo-500" delay={0.1} theme={theme} />
                    <StatCard title="Đang ghép sổ" value={roleKpis.kt.grouping} icon={Map} colorClass="bg-amber-500" delay={0.2} theme={theme} />
                    <StatCard title="Đã nộp 1 cửa" value={roleKpis.kt.submitted} icon={CheckCircle2} colorClass="bg-emerald-500" delay={0.3} theme={theme} />
                    <StatCard title="GCN đã nhận" value={roleKpis.kt.gcnReceived} icon={Building2} colorClass="bg-cyan-500" delay={0.4} theme={theme} />
                  </div>
                )}

                {userRole === 'PTDA' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Chưa có TB Thuế" value={roleKpis.ptda.noTax} icon={Clock} colorClass="bg-rose-500" delay={0.1} theme={theme} />
                    <StatCard title="Chờ TB Thuế TB" value={`${roleKpis.ptda.avgTaxWait} ngày`} icon={History} colorClass="bg-indigo-500" delay={0.2} theme={theme} />
                    <StatCard title="Trễ tại CQNN" value={roleKpis.ptda.stuck} icon={AlertCircle} colorClass="bg-amber-600" delay={0.3} theme={theme} />
                    <StatCard title="HS Đã nhận TB Thuế" value={roleKpis.kt.submitted - roleKpis.ptda.noTax} icon={CheckCircle2} colorClass="bg-emerald-500" delay={0.4} theme={theme} />
                  </div>
                )}

                {(userRole === 'ADMIN' || userRole === 'MANAGER' || !userRole) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Tổng số căn" value={kpis.total} icon={Building2} colorClass="bg-festive-gold" delay={0.1} theme={theme} />
                    <StatCard title="Hồ sơ hoàn tất" value={kpis.completed} icon={CheckCircle2} colorClass="bg-emerald-500" delay={0.2} theme={theme} />
                    <StatCard title="Trễ hạn xử lý" value={kpis.overdue} icon={AlertCircle} colorClass="bg-amber-600 shadow-amber-900/40" delay={0.3} theme={theme} />
                    <StatCard title="Vướng / Sai sót" value={kpis.error} icon={AlertCircle} colorClass="bg-rose-500 shadow-rose-900/40" delay={0.4} theme={theme} />
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
                            theme === 'light' ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/40 border-slate-800"
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
                            theme === 'light' ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/40 border-slate-800"
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
                              <span className="text-[9px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded italic">Lỗi/Vướng</span>
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
                  <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl shadow-2xl border border-slate-800/50">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="font-bold text-white flex items-center gap-2 font-serif text-xl italic italic">
                        <LayoutDashboard size={18} className="text-festive-gold" />
                        Tiến độ các giai đoạn
                      </h3>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-sm bg-slate-500" />
                            <span className="text-[10px] text-white font-bold uppercase tracking-widest">Bình thường</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                            <span className="text-[10px] text-rose-400 font-bold uppercase tracking-widest">Sai sót</span>
                          </div>
                          <p className="text-xs text-slate-500 font-mono italic">Đơn vị: Hồ sơ</p>
                        </div>
                    </div>
                    <div className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 11, fill: '#94a3b8' }} 
                            dy={10}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 11, fill: '#94a3b8' }} 
                            allowDecimals={false}
                          />
                          <ReTooltip 
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #334155', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)' }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value: any, name: string) => {
                              if (name === 'normal') return [value, 'Hồ sơ bình thường'];
                              if (name === 'error') return [value, 'Hồ sơ lỗi/vướng'];
                              return [value, name];
                            }}
                          />
                          <Bar dataKey="normal" stackId="a" barSize={40}>
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-normal-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                          <Bar dataKey="error" stackId="a" fill="#f43f5e" barSize={40} radius={[8, 8, 0, 0]}>
                            <LabelList dataKey="value" position="top" fill="#94a3b8" fontSize={11} offset={8} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl shadow-2xl border border-slate-800/50 flex flex-col">
                    <h3 className="font-bold text-white mb-6 font-serif text-xl italic flex items-center gap-2 italic">
                       <Filter size={18} className="text-festive-gold" />
                       Tỷ lệ theo Trạng thái
                    </h3>
                    <div className="flex-1 flex flex-col items-center justify-center relative">
                      <ResponsiveContainer width="100%" height={260} minWidth={0} minHeight={0}>
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={90}
                            paddingAngle={8}
                            dataKey="value"
                            stroke="none"
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl font-bold text-slate-100">{kpis.total}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-500">Hồ sơ</span>
                      </div>
                    </div>
                    <div className="mt-6 space-y-3">
                      {chartData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-xs text-slate-400 font-medium">{item.name}</span>
                          </div>
                          <span className="text-xs font-bold text-slate-200">{Math.round((item.value / kpis.total) * 100)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Administration Section for Admin/Manager */}
                {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-slate-800/50">
                      <h3 className="font-bold text-white mb-6 font-serif text-xl italic flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-emerald-500" />
                        So sánh SLA Thực tế vs Kế hoạch {selectedProject ? `- ${selectedProject.name}` : ''}
                      </h3>
                      <div className="space-y-6">
                        {roleKpis.admin.slaStats.map(item => (
                          <div key={item.label}>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-bold text-slate-300">{item.label}</span>
                              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">KH: {item.sla}d | TT: {item.avg}d</span>
                            </div>
                            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div className={cn("h-full rounded-full transition-all duration-1000", item.color)} style={{ width: `${Math.min(100, (item.avg / item.sla) * 100)}%` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-slate-800/50">
                      <h3 className="font-bold text-white mb-6 font-serif text-xl italic flex items-center gap-2">
                        <AlertCircle size={18} className="text-amber-500" />
                        Cảnh báo & Rủi ro Hệ thống {selectedProject ? `- ${selectedProject.name}` : ''}
                      </h3>
                      <div className="space-y-4">
                         {roleKpis.admin.warnings.map((warning, idx) => {
                           const WarningIcon = warning.icon;
                           const colorMap: {[key: string]: string} = {
                             rose: 'bg-rose-500/10 border-rose-500/20 text-rose-500',
                             amber: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
                             indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                           };
                           const iconColorMap: {[key: string]: string} = {
                             rose: 'text-rose-500',
                             amber: 'text-amber-500',
                             indigo: 'text-indigo-400'
                           };
                           return (
                             <div key={idx} className={cn("p-4 border rounded-2xl flex gap-4 transition-all hover:scale-[1.02]", colorMap[warning.color])}>
                               <WarningIcon className={cn("shrink-0", iconColorMap[warning.color])} size={24} />
                               <div>
                                  <p className="text-sm font-bold">{warning.title}</p>
                                  <p className="text-[11px] text-slate-400 mt-1">{warning.desc}</p>
                               </div>
                             </div>
                           );
                         })}
                         {roleKpis.admin.warnings.length === 0 && (
                           <div className="h-full flex flex-col items-center justify-center py-10 opacity-40">
                             <CheckCircle2 size={40} className="text-emerald-500 mb-2" />
                             <p className="text-slate-400 text-xs italic">Hệ thống hoạt động ổn định</p>
                           </div>
                         )}
                      </div>
                    </div>
                  </div>
                )}
                <div className={cn(
                  "backdrop-blur-xl rounded-3xl shadow-2xl border transition-all overflow-hidden",
                  theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900/20 shadow-2xl border-slate-800/50"
                )}>
                  <div className={cn("p-6 border-b flex items-center justify-between", theme === 'light' ? "border-slate-100 bg-slate-50" : "border-slate-800/50")}>
                    <h3 className={cn("font-bold font-serif text-xl italic", theme === 'light' ? "text-slate-900" : "text-white")}>Trạng thái theo Dự án</h3>
                    <button className="text-festive-gold text-xs font-bold hover:underline">Chi tiết báo cáo</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className={theme === 'light' ? "bg-slate-50" : "bg-slate-800/30"}>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono italic">Dự án</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono italic">Quỹ căn</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono italic">Đã cấp sổ</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono italic">Tiến độ</th>
                        </tr>
                      </thead>
                      <tbody className={cn("divide-y", theme === 'light' ? "divide-slate-50" : "divide-slate-800/50")}>
                        {visibleProjects.map(p => {
                          const projectApps = applications.filter(a => a.projectName === p.name);
                          const completed = projectApps.filter(a => a.status === 'Completed').length;
                          const progress = Math.round((completed / p.totalUnits) * 100);
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
                                    <p className="text-[11px] text-slate-500 tracking-wider font-bold italic">{p.region}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm font-mono text-slate-500">{p.totalUnits}</td>
                              <td className="px-6 py-4 text-sm font-mono text-slate-500">{completed}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className={cn("flex-1 h-1.5 rounded-full overflow-hidden w-24 border", theme === 'light' ? "bg-slate-100 border-slate-200" : "bg-slate-950/50 border-slate-800")}>
                                    <div 
                                      className="h-full bg-festive-gold rounded-full transition-all duration-1000 shadow-sm shadow-festive-gold/30" 
                                      style={{ width: `${progress}%` }} 
                                    />
                                  </div>
                                  <span className="text-xs font-bold text-festive-gold/80">{progress}%</span>
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
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-4">
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
                            "grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-4 pt-4 border-t",
                            theme === 'light' ? "border-slate-100" : "border-slate-800/30"
                          )}>
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
                                {Object.keys(STEP_CONFIG).map(step => (
                                  <option key={step} value={step}>{STEP_CONFIG[step].label}</option>
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
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-festive-gold/20"
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
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-festive-gold/20"
                                value={filterSelfService}
                                onChange={(e) => setFilterSelfService(e.target.value as any)}
                              >
                                <option value="ALL">Tất cả</option>
                                <option value="YES">Khách tự làm</option>
                                <option value="NO">Công ty làm</option>
                              </select>
                            </div>

                            <div className="flex items-end">
                              <button 
                                onClick={() => {
                                  setFilterStatus('ALL');
                                  setFilterStep('ALL');
                                  setFilterLoanStatus('ALL');
                                  setFilterSelfService('ALL');
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

                  {/* Bulk Actions Bar */}
                  <AnimatePresence>
                    {selectedAppIds.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="mb-4 p-4 bg-festive-gold rounded-2xl flex items-center justify-between shadow-lg shadow-festive-gold/20"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-festive-gold font-black">
                            {selectedAppIds.length}
                          </div>
                          <div>
                            <p className="text-slate-900 font-bold text-sm uppercase tracking-tight">Hồ sơ đang chọn</p>
                            <p className="text-slate-800 text-[10px] font-bold uppercase">Bạn có thể thực hiện chuyển giai đoạn nhanh</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Logic to show relevant bulk buttons based on user role */}
                          {userRole === 'PTT' && (
                            <button 
                              onClick={() => handleBulkStepTransition('GD1_Cho_KT_TiepNhan')}
                              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
                            >
                              Gửi hồ sơ sang KT &rarr;
                            </button>
                          )}
                          {userRole === 'KT' && (
                            <button 
                              onClick={() => handleBulkStepTransition('GD2_Cho_Nop_VPDK')}
                              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
                            >
                              Xác nhận tiếp nhận hàng loạt
                            </button>
                          )}
                          {userRole === 'PTDA' && (
                            <button 
                              onClick={() => handleBulkStepTransition('GD3_Cho_TBThue')}
                              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
                            >
                              Xác nhận tiếp nhận hàng loạt
                            </button>
                          )}
                          <button 
                            onClick={() => setSelectedAppIds([])}
                            className="px-4 py-2 bg-slate-800/10 text-slate-800 border border-slate-900/10 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800/20 transition-all"
                          >
                            Hủy lệnh
                          </button>
                        </div>
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
                              checked={selectedAppIds.length === filteredApps.length && filteredApps.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedAppIds(filteredApps.map(a => a.id));
                                else setSelectedAppIds([]);
                              }}
                            />
                          </th>
                          <th className="px-6 py-4 text-[10px] font-bold tracking-widest font-mono italic">Mã lô/căn</th>
                          <th className="px-6 py-4 text-[10px] font-bold tracking-widest font-mono italic">Khách hàng</th>
                          <th className="px-6 py-4 text-[10px] font-bold tracking-widest font-mono italic">Trạng thái</th>
                          {(userRole === 'PTT' || userRole === 'ADMIN' || userRole === 'MANAGER') && (
                            <th className="px-6 py-4 text-[10px] font-bold tracking-widest font-mono italic text-center">Nộp VPĐK</th>
                          )}
                          {(userRole === 'KT' || userRole === 'ADMIN' || userRole === 'MANAGER') && (
                            <th className="px-6 py-4 text-[10px] font-bold tracking-widest font-mono italic text-center">Nộp tiền</th>
                          )}
                          {(userRole === 'PTDA' || userRole === 'ADMIN' || userRole === 'MANAGER') && (
                            <th className="px-6 py-4 text-[10px] font-bold tracking-widest font-mono italic text-center">Nhận sổ</th>
                          )}
                          <th className="px-6 py-4 text-[10px] font-bold tracking-widest font-mono italic text-center">BG Khách</th>
                          <th className="px-6 py-4 text-[10px] font-bold tracking-widest font-mono italic text-center">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className={cn(
                        "divide-y transition-all",
                        theme === 'light' ? "text-slate-700 divide-slate-100" : "text-slate-300 divide-slate-800/40"
                      )}>
                        {filteredApps.map(app => {
                          const overdue = getOverdueInfo(app);
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
                                    if (e.target.checked) setSelectedAppIds(prev => [...prev, app.id]);
                                    else setSelectedAppIds(prev => prev.filter(id => id !== app.id));
                                  }}
                                />
                              </td>
                              <td className="px-6 py-5" onClick={() => setSelectedApp(app)}>
                                <div className="flex flex-col">
                                  <span className="text-sm font-black text-festive-gold font-mono tracking-tight">{app.unitCode}</span>
                                  {overdue.isOverdue && (
                                    <span className="text-[9px] text-amber-500 font-bold uppercase tracking-tighter flex items-center gap-1 mt-1">
                                      <AlertTriangle size={10} /> {overdue.label} ({overdue.daysLate} ngày)
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-5" onClick={() => setSelectedApp(app)}>
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                                    theme === 'light' ? "bg-slate-100 text-slate-400" : "bg-slate-800 text-slate-500"
                                  )}>
                                    <User size={14} />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className={cn("text-sm font-medium", theme === 'light' ? "text-slate-700" : "text-slate-300")}>{app.customerName}</span>
                                    <div className="flex gap-1 mt-1">
                                      {app.loanStatus === 'Co_Vay' && <span className="text-[8px] bg-indigo-500/20 text-indigo-400 px-1 rounded font-bold uppercase">Có vay</span>}
                                      {app.isSelfService && <span className="text-[8px] bg-amber-500/20 text-amber-500 px-1 rounded font-bold uppercase">Tự làm</span>}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-5" onClick={() => setSelectedApp(app)}>
                                <StatusBadge status={app.status} />
                              </td>
                              {(userRole === 'PTT' || userRole === 'ADMIN' || userRole === 'MANAGER') && (
                                <td className="px-6 py-5 text-center" onClick={() => setSelectedApp(app)}>
                                  <span className={cn("text-[11px] font-mono", theme === 'light' ? "text-slate-400" : "text-slate-500")}>{app.submissionDate || '---'}</span>
                                </td>
                              )}
                              {(userRole === 'KT' || userRole === 'ADMIN' || userRole === 'MANAGER') && (
                                <td className="px-6 py-5 text-center" onClick={() => setSelectedApp(app)}>
                                  <div className="flex flex-col items-center">
                                    <span className={cn("text-[11px] font-mono", theme === 'light' ? "text-slate-400" : "text-slate-500")}>{app.taxReceiptDate || '---'}</span>
                                    {app.taxPaymentStatus === 'Paid' && <span className="text-[8px] text-emerald-500 font-bold">DONE</span>}
                                  </div>
                                </td>
                              )}
                              {(userRole === 'PTDA' || userRole === 'ADMIN' || userRole === 'MANAGER') && (
                                <td className="px-6 py-5 text-center" onClick={() => setSelectedApp(app)}>
                                  <span className={cn("text-[11px] font-mono", theme === 'light' ? "text-slate-400" : "text-slate-500")}>{app.gcnReceivedDate || '---'}</span>
                                </td>
                              )}
                              <td className="px-6 py-5 text-center" onClick={() => setSelectedApp(app)}>
                                <span className={cn("text-[11px] font-mono", theme === 'light' ? "text-slate-400" : "text-slate-500")}>{app.customerHandoverDate || '---'}</span>
                              </td>
                              <td className="px-6 py-5 text-center">
                                <button 
                                  onClick={() => setSelectedApp(app)}
                                  className={cn(
                                    "p-2 rounded-lg transition-colors text-slate-500",
                                    theme === 'light' ? "hover:bg-slate-100" : "hover:bg-slate-800"
                                  )}
                                >
                                  <ChevronRight size={18} />
                                </button>
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
                  onDelete={(id) => setUsers(prev => prev.filter(u => u.id !== id))} 
                  onCreate={() => { setEditUser(null); setIsUserModalOpen(true); }} 
                  onResetPassword={(u) => {
                    if (confirm(`Bạn có chắc muốn reset mật khẩu cho tài khoản @${u.username}? Mật khẩu mặc định sẽ là '123456'.`)) {
                      setUsers(prev => prev.map(usr => usr.id === u.id ? { ...usr, password: '123456' } : usr));
                      alert(`Đã reset mật khẩu cho @${u.username} thành 123456`);
                    }
                  }}
                  theme={theme}
                />
              </motion.div>
            )}

            {activeTab === 'projects' && userRole === 'ADMIN' && (
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
                    const name = prompt("Nhập tên dự án mới:");
                    if (name) {
                      const newP: Project = { 
                        id: `PJ-${Math.random().toString(36).substr(2, 5).toUpperCase()}`, 
                        name, 
                        region: 'TP. Đà Nẵng',
                        totalUnits: 0
                      };
                      setProjects(prev => [...prev, newP]);
                    }
                  }}
                  onEdit={(p) => {
                    const newName = prompt("Sửa tên dự án:", p.name);
                    if (newName) {
                      setProjects(prev => prev.map(item => item.id === p.id ? { ...item, name: newName } : item));
                    }
                  }}
                  onDelete={(id) => {
                    if (confirm("Bạn có chắc muốn xóa dự án này?")) {
                      setProjects(prev => prev.filter(p => p.id !== id));
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
                <ReportsView applications={applications} projects={PROJECTS} regions={regions} theme={theme} />
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
                />
              </motion.div>
            )}
            {activeTab === 'resources' && (
              <motion.div 
                key="resources"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="max-w-5xl mx-auto space-y-8"
              >
                <div className="text-center space-y-4 mb-12">
                  <h2 className="text-4xl font-black text-white font-serif italic tracking-tight">Tra cứu & Biểu mẫu</h2>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.3em]">Trung tâm tài nguyên & Quy trình chuẩn</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-slate-900/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-slate-800/50 shadow-2xl">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center">
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white font-serif italic">Checklist Hồ sơ chuẩn</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Danh mục hồ sơ cần chuẩn bị</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {DOC_CHECKLIST_ITEMS.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-4 rounded-2xl bg-slate-950/30 border border-slate-800/30 hover:border-amber-500/30 transition-all group">
                          <div className="w-6 h-6 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-600 group-hover:text-amber-500 group-hover:border-amber-500/30">
                            {idx + 1}
                          </div>
                          <span className="text-sm text-slate-300">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="bg-slate-900/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-slate-800/50 shadow-2xl">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center">
                          <Files size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white font-serif italic">Biểu mẫu Tải xuống</h3>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Tải về các mẫu văn bản hành chính</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {[
                          { name: 'Mẫu 09/ĐK - Đơn đăng ký biến động', format: 'DOCX', size: '45KB' },
                          { name: 'Tờ khai lệ phí trước bạ nhà đất', format: 'PDF', size: '120KB' },
                          { name: 'Tờ khai thuế thu nhập cá nhân', format: 'PDF', size: '115KB' },
                          { name: 'Mẫu giấy ủy quyền nộp HS', format: 'DOCX', size: '32KB' }
                        ].map((doc, idx) => (
                          <button key={idx} className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-950/30 border border-slate-800/30 hover:bg-slate-800/30 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="text-[10px] font-black bg-slate-800 text-slate-400 px-2 py-1 rounded-md">{doc.format}</div>
                              <span className="text-sm text-slate-300 font-medium">{doc.name}</span>
                            </div>
                            <Download size={16} className="text-slate-600" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-indigo-600/10 backdrop-blur-md p-8 rounded-[2.5rem] border border-indigo-500/20 shadow-2xl flex items-center gap-6">
                      <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-600/30 flex-shrink-0">
                        <HelpCircle size={32} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white font-serif italic">Cần hỗ trợ?</h3>
                        <p className="text-xs text-slate-400 leading-relaxed mt-1">Liên hệ phòng Công nghệ để được hướng dẫn sử dụng hoặc điều chỉnh phân quyền tài khoản của bạn.</p>
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
              className="fixed right-0 top-0 bottom-0 w-[480px] bg-[#1E293B] z-50 shadow-2xl flex flex-col border-l border-slate-700"
            >
              <div className="p-6 border-b border-slate-700 flex items-center justify-between bg-slate-900/50">
                <div>
                  <h3 className="text-xl font-bold text-slate-100">{(editApp || selectedApp).unitCode}</h3>
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">{(editApp || selectedApp).projectName}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <button 
                      onClick={() => {
                        setIsEditing(true);
                        setEditApp(selectedApp);
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-festive-gold text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all border border-slate-700"
                    >
                      Sửa hồ sơ
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        setIsEditing(false);
                        setEditApp(null);
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all border border-slate-700"
                    >
                      Hủy
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setSelectedApp(null);
                      setIsEditing(false);
                      setEditApp(null);
                    }}
                    className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                  >
                    <ArrowRight size={20} className="text-slate-400" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {/* Workflow Tracker */}
                <section className="bg-slate-900/40 p-5 rounded-3xl border border-slate-800/50 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                       Bản đồ quy trình
                    </h4>
                    <StatusBadge status={(editApp || selectedApp).status} />
                  </div>
                  
                  <div className="relative pt-2 pb-8 px-2">
                    {/* Background Line */}
                    <div className="absolute top-[18px] left-6 right-6 h-0.5 bg-slate-800"></div>
                    
                    <div className="flex justify-between relative z-10 text-center">
                      {['GĐ1', 'GĐ2', 'GĐ3', 'GĐ4', 'GĐ5', 'GĐ6'].map((label, idx) => {
                        const currentPhase = getPhaseIndex((editApp || selectedApp).currentStep);
                        const isCompleted = idx < currentPhase || (editApp || selectedApp).currentStep === 'Hoan_Tat';
                        const isActive = idx === currentPhase && (editApp || selectedApp).currentStep !== 'Hoan_Tat';
                        
                        return (
                          <div key={label} className="flex flex-col items-center gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 text-[10px] font-bold border-2",
                              isCompleted ? "bg-emerald-500 border-emerald-500 text-slate-900" : 
                              isActive ? "bg-festive-gold border-festive-gold text-slate-900 shadow-lg shadow-festive-gold/30 scale-110" : 
                              "bg-slate-900 border-slate-700 text-slate-500"
                            )}>
                              {isCompleted ? <CheckCircle2 size={16} /> : label}
                            </div>
                            <span className={cn(
                              "text-[8px] font-bold uppercase tracking-tighter absolute -bottom-1",
                              isActive ? "text-festive-gold" : isCompleted ? "text-emerald-400" : "text-slate-500"
                            )}>
                              {label === 'GĐ1' && 'Chuẩn bị'}
                              {label === 'GĐ2' && 'Nộp VPĐK'}
                              {label === 'GĐ3' && 'Thông báo'}
                              {label === 'GĐ4' && 'Tài chính'}
                              {label === 'GĐ5' && 'Lấy sổ'}
                              {label === 'GĐ6' && 'Bàn giao'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-6 flex items-start gap-4 p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-500 flex items-center justify-center shrink-0">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-1">
                        Đang ở bước:
                      </p>
                      <p className="text-sm font-bold text-slate-100 uppercase leading-none">
                        {STEP_CONFIG[(editApp || selectedApp).currentStep]?.label}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-widest">
                        Chủ trì: <span className="text-slate-300">{STEP_CONFIG[(editApp || selectedApp).currentStep]?.dept}</span>
                      </p>
                    </div>
                  </div>
                </section>

                {/* Section 1: Thông tin Master (Mandatory) */}
                <section className="space-y-4 bg-slate-900/20 p-4 rounded-3xl border border-slate-800/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Thông tin Master (PTT chủ trì)</h4>
                    </div>
                    {userRole === 'PTT' && <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-md font-bold uppercase">Bạn có quyền sửa</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <DetailCard label="Mã lô/căn" value={(editApp || selectedApp).unitCode} />
                    <DetailCard label="Dự án" value={(editApp || selectedApp).projectName} />
                    <DetailCard 
                      label="Tên khách hàng" 
                      value={(editApp || selectedApp).customerName} 
                      editable={isFieldEditable('customerName')}
                      onChange={(val) => handleFieldChange('customerName', val)}
                    />
                    <DetailCard 
                      label="Loại tài sản" 
                      value={(editApp || selectedApp).propertyType === 'Dat_Nen' ? 'Quyền sử dụng đất (Nhà đất/Đất nền)' : 'Căn hộ'} 
                      type="select"
                      editable={isFieldEditable('propertyType')}
                      options={['Quyền sử dụng đất (Nhà đất/Đất nền)', 'Căn hộ']}
                      onChange={(val) => handleFieldChange('propertyType', val === 'Căn hộ' ? 'Can_Ho' : 'Dat_Nen')}
                    />
                    <DetailCard 
                      label="Sử dụng gói vay" 
                      value={(editApp || selectedApp).loanStatus === 'Co_Vay' ? 'Có vay ngân hàng' : 'Không vay'} 
                      type="select"
                      editable={isFieldEditable('loanStatus')}
                      options={['Có vay ngân hàng', 'Không vay']}
                      onChange={(val) => handleFieldChange('loanStatus', val === 'Có vay ngân hàng' ? 'Co_Vay' : 'Khong_Vay')}
                    />
                  </div>
                </section>

                {/* Section 2: Thủ tục & Hồ sơ (PTT) */}
                <section className="space-y-4 bg-slate-900/20 p-4 rounded-3xl border border-slate-800/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-4 bg-amber-500 rounded-full"></div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Quy trình Thủ tục (PTT)</h4>
                    </div>
                    {userRole === 'PTT' && <span className="text-[9px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-md font-bold uppercase">Bạn có quyền sửa</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <DetailCard 
                      label="Ngày nhận hồ sơ KH" 
                      value={(editApp || selectedApp).receivedDate} 
                      type="date"
                      editable={isFieldEditable('receivedDate')}
                      onChange={(val) => handleFieldChange('receivedDate', val)}
                    />
                    <DetailCard 
                      label="Ngày ký HĐCN/HĐMB" 
                      value={(editApp || selectedApp).contractSigningDate} 
                      type="date"
                      editable={isFieldEditable('contractSigningDate')}
                      onChange={(val) => handleFieldChange('contractSigningDate', val)}
                    />
                    <DetailCard 
                      label="Ngày BG HS nội bộ" 
                      value={(editApp || selectedApp).accountingHandoverDate} 
                      type="date"
                      editable={isFieldEditable('accountingHandoverDate')}
                      onChange={(val) => handleFieldChange('accountingHandoverDate', val)}
                    />
                    <DetailCard 
                      label="KH tự làm sổ" 
                      value={(editApp || selectedApp).isSelfService ? 'Có' : 'Không'} 
                      valueColor={(editApp || selectedApp).isSelfService ? 'text-amber-500' : 'text-slate-200'}
                      editable={isFieldEditable('isSelfService')}
                      type="select"
                      options={['Có', 'Không']}
                      onChange={(val) => handleFieldChange('isSelfService', val === 'Có')}
                    />
                    <DetailCard 
                      label="Ngày BG GCN cho khách" 
                      value={(editApp || selectedApp).customerHandoverDate} 
                      type="date"
                      editable={isFieldEditable('customerHandoverDate')}
                      onChange={(val) => handleFieldChange('customerHandoverDate', val)}
                    />
                  </div>
                </section>

                {/* Section 3: Pháp lý & Thuế (Kế toán/BTC Vùng) */}
                <section className="space-y-4 bg-emerald-500/5 p-4 rounded-3xl border border-emerald-500/10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Pháp lý & Thuế (KT)</h4>
                    </div>
                    {userRole === 'KT' && <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md font-bold uppercase">Bạn có quyền sửa</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <DetailCard 
                      label="Nơi nộp hồ sơ" 
                      value={(editApp || selectedApp).submissionLocation === 'TP_DANANG' ? 'VPĐK TP Đà Nẵng' : (editApp || selectedApp).submissionLocation === 'PHUONG' ? 'VPĐK Phường' : '---'} 
                      type="select"
                      field="submissionLocation"
                      editable={isFieldEditable('submissionLocation')}
                      onChange={(val) => handleFieldChange('submissionLocation', val)}
                    />
                    <DetailCard 
                      label="Mã HS / Số phiếu hẹn" 
                      value={(editApp || selectedApp).vpdkCode} 
                      editable={isFieldEditable('vpdkCode')}
                      onChange={(val) => handleFieldChange('vpdkCode', val)}
                    />
                    <DetailCard 
                      label="Ngày nộp VPĐK" 
                      value={(editApp || selectedApp).submissionDate} 
                      type="date"
                      editable={isFieldEditable('submissionDate')}
                      onChange={(val) => handleFieldChange('submissionDate', val)}
                    />
                    <DetailCard 
                      label="Ngày ban hành TB Thuế" 
                      value={(editApp || selectedApp).taxNotificationDate} 
                      type="date"
                      editable={isFieldEditable('taxNotificationDate')}
                      onChange={(val) => handleFieldChange('taxNotificationDate', val)}
                    />
                    <DetailCard 
                      label="Ngày nhận TB Thuế" 
                      value={(editApp || selectedApp).taxNotificationReceivedDate} 
                      type="date"
                      editable={isFieldEditable('taxNotificationReceivedDate')}
                      onChange={(val) => handleFieldChange('taxNotificationReceivedDate', val)}
                    />
                    <DetailCard 
                      label="Ngày nhận Giấy nộp tiền" 
                      value={(editApp || selectedApp).taxReceiptDate} 
                      type="date"
                      editable={isFieldEditable('taxReceiptDate')}
                      onChange={(val) => handleFieldChange('taxReceiptDate', val)}
                    />
                    <DetailCard 
                      label="Ngày nhận GCN" 
                      value={(editApp || selectedApp).gcnReceivedDate} 
                      type="date"
                      editable={isFieldEditable('gcnReceivedDate')}
                      onChange={(val) => handleFieldChange('gcnReceivedDate', val)}
                    />
                    <DetailCard 
                      label="Ngày BG GCN PTT" 
                      value={(editApp || selectedApp).ptdaHandoverDate} 
                      type="date"
                      editable={isFieldEditable('ptdaHandoverDate')}
                      onChange={(val) => handleFieldChange('ptdaHandoverDate', val)}
                    />
                    <DetailCard 
                      label="Trạng thái nộp thuế" 
                      value={(editApp || selectedApp).taxPaymentStatus === 'Paid' ? 'Đã hoàn thành' : 'Chưa hoàn thành'} 
                      valueColor={(editApp || selectedApp).taxPaymentStatus === 'Paid' ? 'text-emerald-500' : 'text-rose-500'} 
                      editable={isFieldEditable('taxPaymentStatus')}
                      type="select"
                      field="taxPaymentStatus"
                      onChange={(val) => handleFieldChange('taxPaymentStatus', val === 'Đã hoàn thành' ? 'Paid' : 'Unpaid')}
                    />
                  </div>
                </section>

                {/* Section 4: PTDA & Milestone chuyên sâu */}
                <section className="space-y-4 bg-fuchsia-500/5 p-4 rounded-3xl border border-fuchsia-500/10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-4 bg-fuchsia-500 rounded-full"></div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">PTDA & Chỉnh lý GCN</h4>
                    </div>
                    {userRole === 'PTDA' && <span className="text-[9px] bg-fuchsia-500/20 text-fuchsia-400 px-2 py-0.5 rounded-md font-bold uppercase">Bạn có quyền sửa</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <DetailCard 
                      label="Ngày cung cấp TB Thuế" 
                      value={(editApp || selectedApp).taxNoticeProvisionDate} 
                      type="date"
                      editable={isFieldEditable('taxNoticeProvisionDate')}
                      onChange={(val) => handleFieldChange('taxNoticeProvisionDate', val)}
                    />
                    <DetailCard 
                      label="Ngày trình ký/In GCN" 
                      value={(editApp || selectedApp).gcnSignedDate} 
                      type="date"
                      editable={isFieldEditable('gcnSignedDate')}
                      onChange={(val) => handleFieldChange('gcnSignedDate', val)}
                    />
                  </div>
                </section>

                {/* Section 5: Vướng mắc & Sai sót (Visible to KT, PTDA, ADMIN) */}
                {(userRole === 'KT' || userRole === 'PTDA' || userRole === 'ADMIN' || userRole === 'MANAGER') && (
                  <section className="space-y-4 bg-rose-500/5 p-4 rounded-3xl border border-rose-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={14} className="text-rose-500" />
                        <h4 className="text-[10px] font-bold text-rose-400 uppercase tracking-[0.2em]">Vướng mắc & Sai sót</h4>
                      </div>
                      {(userRole === 'KT' || userRole === 'PTDA') && isEditing && <span className="text-[9px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-md font-bold uppercase">Ghi nhận vướng mắc</span>}
                    </div>
                    <div className="space-y-3">
                      <DetailCard 
                        label="Loại vướng mắc" 
                        value={
                          (editApp || selectedApp).issueType === 'Paperwork' ? 'Hồ sơ pháp lý' :
                          (editApp || selectedApp).issueType === 'Financial' ? 'Nghĩa vụ tài chính' :
                          (editApp || selectedApp).issueType === 'Authority' ? 'Cơ quan nhà nước' :
                          (editApp || selectedApp).issueType === 'Other' ? 'Vướng mắc khác' : 'Chưa có vướng mắc'
                        } 
                        type="select"
                        editable={(userRole === 'KT' || userRole === 'PTDA' || userRole === 'ADMIN') && isEditing}
                        options={['Chưa có vướng mắc', 'Hồ sơ pháp lý', 'Nghĩa vụ tài chính', 'Cơ quan nhà nước', 'Vướng mắc khác']}
                        onChange={(val) => {
                          const mapping: any = {
                            'Chưa có vướng mắc': 'None',
                            'Hồ sơ pháp lý': 'Paperwork',
                            'Nghĩa vụ tài chính': 'Financial',
                            'Cơ quan nhà nước': 'Authority',
                            'Vướng mắc khác': 'Other'
                          };
                          handleFieldChange('issueType', mapping[val]);
                        }}
                      />
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Ghi chú sai sót vướng mắc</label>
                        {((userRole === 'KT' || userRole === 'PTDA' || userRole === 'ADMIN') && isEditing) ? (
                          <textarea 
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all resize-none min-h-[100px]"
                            value={(editApp || selectedApp).issueNotes || ''}
                            onChange={(e) => handleFieldChange('issueNotes', e.target.value)}
                            placeholder="Mô tả chi tiết sai sót hoặc lý do chậm trễ hồ sơ..."
                          />
                        ) : (
                          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 min-h-[60px]">
                            <p className="text-xs text-slate-400 italic">{(editApp || selectedApp).issueNotes || 'Không có ghi chú.'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                )}

                {/* History & Audit Trail Tabs */}
                <section className="space-y-6">
                  <div className="flex gap-4 border-b border-slate-800">
                    <button 
                      onClick={() => setDetailTab('Workflow')}
                      className={cn(
                        "pb-2 text-[10px] font-black uppercase tracking-widest transition-all relative",
                        detailTab === 'Workflow' ? "text-festive-gold" : "text-slate-500 hover:text-slate-300"
                      )}
                    >
                      Lịch sử xử lý
                      {detailTab === 'Workflow' && <motion.div layoutId="detailUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-festive-gold" />}
                    </button>
                    <button 
                      onClick={() => setDetailTab('Audit')}
                      className={cn(
                        "pb-2 text-[10px] font-black uppercase tracking-widest transition-all relative",
                        detailTab === 'Audit' ? "text-festive-gold" : "text-slate-500 hover:text-slate-300"
                      )}
                    >
                      Audit Trail
                      {detailTab === 'Audit' && <motion.div layoutId="detailUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-festive-gold" />}
                    </button>
                  </div>

                  {detailTab === 'Workflow' ? (
                    <div className="space-y-6 pl-2 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-700">
                      {(editApp || selectedApp).history.map((h, idx) => (
                        <div key={h.id} className="relative pl-8">
                          <div className={cn(
                            "absolute left-0 top-1 w-2.5 h-2.5 rounded-full z-10 border-2 border-[#1E293B]",
                            idx === 0 ? "bg-emerald-500 ring-4 ring-emerald-500/10" : "bg-slate-600"
                          )} />
                          <div className="flex justify-between items-start mb-1">
                            <p className="text-sm font-bold text-slate-200">{h.stepName}</p>
                            <span className="text-[10px] font-mono text-slate-500">{h.receivedDate}</span>
                          </div>
                          <p className="text-xs text-slate-400 italic mb-1">Phòng chịu trách nhiệm: {h.dept}</p>
                          {h.note && (
                            <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg text-[11px] text-slate-400 italic border-l-2 border-l-emerald-500">
                              {h.note}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {((editApp || selectedApp).auditTrail || []).length > 0 ? (
                        (editApp || selectedApp).auditTrail?.map((entry) => (
                           <div key={entry.id} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex gap-3 items-start">
                              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                {entry.userName.charAt(0)}
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                  <p className="text-[11px] font-bold text-slate-200">{entry.userName}</p>
                                  <p className="text-[9px] font-mono text-slate-500">{entry.timestamp}</p>
                                </div>
                                <p className="text-[11px] text-slate-400">{entry.action}</p>
                                {entry.changes && (
                                  <p className="text-[9px] text-slate-600 font-bold italic mt-1 italic">Thay đổi: {entry.changes}</p>
                                )}
                              </div>
                           </div>
                        ))
                      ) : (
                        <div className="py-8 text-center bg-slate-900/20 rounded-2xl border border-slate-800/50">
                           <History size={24} className="mx-auto text-slate-700 mb-2" />
                           <p className="text-[10px] text-slate-600 font-bold italic">Chưa có nhật ký thay đổi</p>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              </div>

              {/* Actions & Workflow Transition */}
              <div className="p-6 border-t border-slate-700 space-y-4 bg-slate-900/50">
                {!isEditing && (editApp || selectedApp).status !== 'Completed' && (
                  <div className="flex flex-col gap-3">
                    {/* Báo lỗi / Sai sót (Available for everyone) */}
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

                      // GĐ 1: Chuyển bàn giao
                      if (app.currentStep === 'GD1_ChuanBi' && role === 'PTT') {
                        if (app.isSelfService) {
                          return (
                            <button 
                              onClick={() => handleStepTransition('GD6_Cho_BG_Khach')}
                              className="w-full py-3 bg-cyan-600 text-white rounded-xl text-sm font-bold hover:bg-cyan-700 shadow-lg shadow-cyan-900/20 transition-all flex items-center justify-center gap-2"
                            >
                              Khách tự làm sổ &rarr; Bàn giao khách <ChevronRight size={16} />
                            </button>
                          );
                        }
                        return (
                          <button 
                            onClick={() => handleStepTransition('GD1_Cho_KT_TiepNhan')}
                            className="w-full py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2"
                          >
                            Bàn giao hồ sơ cho Kế toán <ChevronRight size={16} />
                          </button>
                        );
                      }

                      // GĐ 1: KT xác nhận
                      if (app.currentStep === 'GD1_Cho_KT_TiepNhan' && role === 'KT') {
                        return (
                          <button 
                            onClick={() => handleStepTransition('GD2_Cho_Nop_VPDK')}
                            className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-900/20 transition-all flex items-center justify-center gap-2"
                          >
                            Xác nhận tiếp nhận hồ sơ <CheckCircle2 size={16} />
                          </button>
                        );
                      }

                      // GĐ 2: KT đã nộp VPĐK
                      if (app.currentStep === 'GD2_Cho_Nop_VPDK' && role === 'KT' && app.submissionDate) {
                        return (
                          <button 
                            onClick={() => handleStepTransition('GD2_Cho_PTDA_TiepNhan')}
                            className="w-full py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2"
                          >
                            Đã nộp VPĐK &rarr; Chuyển PTDA <ChevronRight size={16} />
                          </button>
                        );
                      }

                      // GĐ 2: PTDA xác nhận
                      if (app.currentStep === 'GD2_Cho_PTDA_TiepNhan' && role === 'PTDA') {
                        return (
                          <button 
                            onClick={() => handleStepTransition('GD3_Cho_TBThue')}
                            className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-900/20 transition-all flex items-center justify-center gap-2"
                          >
                            Xác nhận tiếp nhận (GĐ3) <CheckCircle2 size={16} />
                          </button>
                        );
                      }

                      // GĐ 3: PTDA đã có TB Thuế
                      if (app.currentStep === 'GD3_Cho_TBThue' && role === 'PTDA' && app.taxNotificationDate) {
                        return (
                          <button 
                            onClick={() => handleStepTransition('GD4_Cho_Nop_NVTC')}
                            className="w-full py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2"
                          >
                            Đã có TB Thuế &rarr; Chuyển PTT <ChevronRight size={16} />
                          </button>
                        );
                      }

                      // GĐ 4: PTT đã nộp thuế
                      if (app.currentStep === 'GD4_Cho_Nop_NVTC' && role === 'PTT' && app.taxReceiptDate) {
                        return (
                          <button 
                            onClick={() => handleStepTransition('GD4_Cho_KT_TiepNhan_LaySo')}
                            className="w-full py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2"
                          >
                            Hoàn tất NVTC &rarr; Chuyển KT lấy sổ <ChevronRight size={16} />
                          </button>
                        );
                      }

                      // GĐ 4: KT xác nhận lấy sổ
                      if (app.currentStep === 'GD4_Cho_KT_TiepNhan_LaySo' && role === 'KT') {
                        return (
                          <button 
                            onClick={() => handleStepTransition('GD5_Cho_GCN')}
                            className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-900/20 transition-all flex items-center justify-center gap-2"
                          >
                            Xác nhận tiếp nhận (Lấy sổ) <CheckCircle2 size={16} />
                          </button>
                        );
                      }

                      // GĐ 5: KT đã nhận sổ
                      if (app.currentStep === 'GD5_Cho_GCN' && role === 'KT' && app.gcnReceivedDate) {
                        return (
                          <button 
                            onClick={() => handleStepTransition('GD5_Cho_PTT_TiepNhan_BG')}
                            className="w-full py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2"
                          >
                            Đã nhận sổ &rarr; Chuyển PTT bàn giao <ChevronRight size={16} />
                          </button>
                        );
                      }

                      // GĐ 5: PTT xác nhận nhận sổ
                      if (app.currentStep === 'GD5_Cho_PTT_TiepNhan_BG' && role === 'PTT') {
                        return (
                          <button 
                            onClick={() => handleStepTransition('GD6_Cho_BG_Khach')}
                            className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-900/20 transition-all flex items-center justify-center gap-2"
                          >
                            Xác nhận nhận sổ gốc <CheckCircle2 size={16} />
                          </button>
                        );
                      }

                      // GĐ 6: PTT bàn giao xong
                      if (app.currentStep === 'GD6_Cho_BG_Khach' && role === 'PTT' && app.customerHandoverDate) {
                        return (
                          <button 
                            onClick={() => handleStepTransition('Hoan_Tat')}
                            className="w-full py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2"
                          >
                            Hoàn tất quy trình bàn giao <CheckCircle2 size={16} />
                          </button>
                        );
                      }

                      return null;
                    })()}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <button className="w-full py-3 border border-slate-700 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-800 transition-colors">
                    Xuất phiếu BĐ
                  </button>
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
                      Sửa hồ sơ
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
              className="fixed inset-0 m-auto w-full max-w-2xl h-fit max-h-[90vh] bg-[#1E293B] z-[70] rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-700 flex flex-col overflow-hidden"
            >
              <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                <div>
                  <h3 className="text-2xl font-black text-white italic font-serif tracking-tight">Tạo mới Hồ sơ GCN</h3>
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
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Thông tin định danh</h4>
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
                            "w-full pl-10 pr-4 py-3 bg-slate-900 border rounded-2xl text-slate-200 text-sm focus:ring-2 transition-all outline-none",
                            formErrors.unitCode ? "border-rose-500 ring-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]" : "border-slate-800 focus:ring-emerald-500/20"
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
                          className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none appearance-none cursor-pointer"
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

                  <div className="space-y-1.5 w-full">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Tên khách hàng <span className="text-rose-500">*</span></label>
                    <div className="relative group">
                      <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                      <input 
                        type="text" 
                        placeholder="VD: Nguyễn Văn A"
                        className={cn(
                          "w-full pl-10 pr-4 py-3 bg-slate-900 border rounded-2xl text-slate-200 text-sm focus:ring-2 transition-all outline-none",
                          formErrors.customerName ? "border-rose-500 ring-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]" : "border-slate-800 focus:ring-emerald-500/20"
                        )}
                        value={newApp.customerName}
                        onChange={(e) => setNewApp({...newApp, customerName: e.target.value})}
                      />
                    </div>
                    {formErrors.customerName && <p className="text-[10px] text-rose-500 font-bold pl-1 italic">{formErrors.customerName}</p>}
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
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Ngân hàng</label>
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
                         >Tự có</button>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Quy trình */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Quy trình thực hiện</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Nơi nộp hồ sơ</label>
                      <div className="relative group">
                         <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                         <select 
                           className="w-full pl-4 pr-10 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none appearance-none cursor-pointer"
                           value={newApp.submissionLocation}
                           onChange={(e) => setNewApp({...newApp, submissionLocation: e.target.value as any})}
                         >
                           <option value="PHUONG">VPĐK Phường</option>
                           <option value="TP_DANANG">VPĐK TP Đà Nẵng</option>
                         </select>
                      </div>
                    </div>

                    <div className="space-y-1.5 flex flex-col justify-end">
                      <button 
                        onClick={() => setNewApp({...newApp, isSelfService: !newApp.isSelfService})}
                        className={cn(
                          "w-full py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-3",
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
                        Khách tự làm sổ
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-slate-800 bg-slate-900/50 flex gap-4">
                <button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-4 bg-slate-800 text-slate-400 hover:bg-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={handleCreateApp}
                  className="flex-1 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-emerald-400 transition-all"
                >
                  Khởi tạo hồ sơ
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
                      <option value="MANAGER">Lãnh đạo / Trưởng phòng</option>
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
                    {PROJECTS.map(project => {
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
                  <p className="text-[10px] text-slate-600 italic px-1">Lưu ý: Admin/Manager luôn có quyền xem tất cả dự án.</p>
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
    </div>
  );
}
