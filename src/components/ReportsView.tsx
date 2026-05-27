import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, Cell,
  PieChart, Pie, LabelList, Label, Legend, AreaChart, Area
} from 'recharts';
import { 
  Activity,
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  FileBarChart,
  Download,
  Calendar,
  MapPin,
  Building2,
  ShieldCheck,
  Zap,
  Filter,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Application, Project, StepName, UnitStatus } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { calculateSLA } from '../utils/statusEngine';
import { REGION_ORDER } from '../constants';
import ErrorReportView from './ErrorReportView';

const calculateDaysDiff = (dateStr: string) => {
  if (!dateStr) return 0;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 0;
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - date.getTime());
  const res = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return isNaN(res) ? 0 : res;
};

const calculateDaysBetweenDates = (start: string, end: string) => {
  const d1 = new Date(start);
  const d2 = new Date(end);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
};

const getOverdueInfo = (app: any, stepConfig: Record<string, any>, slaConfig: Record<string, number>) => {
  if (app._sla) {
    return app._sla;
  }
  return calculateSLA(app, stepConfig, slaConfig);
};

const StatusBadge = ({ status, app }: { status: UnitStatus | string; app?: Application }) => {
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
    <span className={cn("px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider whitespace-nowrap inline-block", config.classes)}>
      {config.label}
    </span>
  );
};

interface ReportsViewProps {
  applications: Application[];
  projects: Project[];
  regions: string[];
  theme: 'light' | 'dark';
  setActiveTab: (tab: any) => void;
  setDashboardFilter: (filter: any) => void;
  setFilterLoanStatus: (filter: any) => void;
  stepConfig: any;
  slaConfig: Record<string, number>;
  reportType: 'PROJECT' | 'REGION' | 'LOAN' | 'SLA' | 'PERFORMANCE' | 'ERROR';
  setReportType: (type: 'PROJECT' | 'REGION' | 'LOAN' | 'SLA' | 'PERFORMANCE' | 'ERROR') => void;
}

export default function ReportsView({ 
  applications, 
  projects, 
  regions, 
  theme,
  setActiveTab,
  setDashboardFilter,
  setFilterLoanStatus,
  stepConfig,
  slaConfig,
  reportType,
  setReportType
}: ReportsViewProps) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [selectedLoanProjectIds, setSelectedLoanProjectIds] = useState<string[]>(projects.map(p => p.id));
  const [isChartsReady, setIsChartsReady] = useState(false);

  useEffect(() => {
    setIsChartsReady(false);
    const id = setTimeout(() => setIsChartsReady(true), 200);
    return () => clearTimeout(id);
  }, []);

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
          id: p.id,
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
          id: reg,
          name: reg,
          total: apps.length,
          completed: apps.filter(a => a.currentStep === 'Hoan_Tat').length,
          processing: apps.filter(a => a.currentStep !== 'Hoan_Tat').length,
          overdue: apps.filter(a => a.status === 'Error').length
        };
      });
    } else if (reportType === 'LOAN') {
      return projects.filter(p => selectedLoanProjectIds.includes(p.id)).map(p => {
        const apps = applications.filter(a => a.projectName === p.name && a.loanStatus === 'Co_Vay');
        return {
          id: p.id,
          name: p.name,
          total: apps.length,
          completed: apps.filter(a => a.currentStep === 'Hoan_Tat' || a.customerHandoverDate).length,
          processing: apps.filter(a => a.currentStep !== 'Hoan_Tat' && !a.customerHandoverDate).length,
          overdue: apps.filter(a => calculateDaysDiff(a.receivedDate) > 10).length,
          efficiency: apps.length > 0 ? (apps.filter(a => a.currentStep === 'Hoan_Tat' || a.customerHandoverDate).length / apps.length) * 100 : 0
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
             // Simple approximation for bottleneck analysis
             return calculateDaysDiff(app.receivedDate) > 10;
           });
           return overdue[0];
        }).length;

        return {
          id: dept,
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
         id,
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
        stepKey: step,
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

  const loanPieData = useMemo(() => {
    const today = new Date();
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

    loanApps.forEach(r => {
      if (r.customerHandoverDate || r.currentStep === 'Hoan_Tat') stages.COMPLETED.push(r);
      else if (r.currentStep === 'S7_2_Ban_Giao_Khach' || r.currentStep === 'GD6_Cho_BG_Khach' || r.currentStep === 'S7_PTDA_Ban_Giao' || r.currentStep === 'S7_1_PTT_Tiep_Nhan') stages.WAITING_HANDOVER.push(r);
      else if (r.gcnSignedDate || r.currentStep === 'S6_Nhan_So_GCN' || r.currentStep === 'GD5_Cho_GCN' || r.currentStep === 'GD5_Cho_PTT_TiepNhan_BG' || r.currentStep === 'GD5_Cho_Ky_In_GCN') stages.GCN_READY.push(r);
      else if (r.taxReceiptDate || r.currentStep === 'S5_1_PTDA_TiepNhan' || r.currentStep === 'GD4_Cho_KT_TiepNhan_LaySo') stages.TAX_PAID.push(r);
      else if (r.taxNotificationDate || r.currentStep === 'S5_Tai_Chinh_Khach_Hang' || r.currentStep === 'GD4_Cho_Nop_NVTC') stages.AWAITING_FINANCE.push(r);
      else if (r.submissionDate || r.currentStep === 'S3_Nop_VPDK' || r.currentStep === 'GD3_Cho_TBThue') {
        const subDate = new Date(r.submissionDate || today);
        const daysDiff = (today.getTime() - subDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff > 7) stages.TAX_WARNING.push(r);
        else stages.SUBMITTED.push(r);
      }
      else if (
        r.currentStep === 'S2_KT_Tiep_Nhan' || 
        r.currentStep === 'S2_KT_Ban_giao' || 
        r.currentStep === 'GD2_Cho_Nop_VPDK' || 
        (r.accountingHandoverDate && r.currentStep !== 'GD1_Cho_KT_TiepNhan' && r.currentStep !== 'GD1_ChuanBi' && r.currentStep !== 'S1_ChuanBi')
      ) stages.AWAITING_SUBMISSION.push(r);
      else stages.PREPARING.push(r);
    });

    const createStageItem = (name: string, list: Application[], color: string) => {
      const errorCount = list.filter(a => (a.status as string) === 'Error' || a.isRejected || (a.issueType && a.issueType !== 'None')).length;
      return { name, value: list.length, normal: list.length - errorCount, error: errorCount, color };
    };

    return [
      createStageItem('ĐANG CHUẨN BỊ', stages.PREPARING, '#94a3b8'),
      createStageItem('CHỜ NỘP', stages.AWAITING_SUBMISSION, '#f59e0b'),
      createStageItem('ĐÃ NỘP VPĐK', stages.SUBMITTED, '#3b82f6'),
      createStageItem('CHỜ TB THUẾ', stages.TAX_WARNING, '#f97316'),
      createStageItem('CHỜ NVTC', stages.AWAITING_FINANCE, '#8b5cf6'),
      createStageItem('ĐÃ NỘP THUẾ', stages.TAX_PAID, '#10b981'),
      createStageItem('ĐÃ CÓ GCN', stages.GCN_READY, '#06b6d4'),
      createStageItem('CHỜ BÀN GIAO', stages.WAITING_HANDOVER, '#6366f1'),
      createStageItem('HOÀN TẤT', stages.COMPLETED, '#22c55e')
    ].filter(d => d.value > 0 || d.error > 0);
  }, [loanApps]);

  if (reportType === 'ERROR') {
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
        </header>

        {/* Report Navigation */}
        <div className="flex flex-wrap gap-2">
          {(Object.keys(reportConfig) as Array<keyof typeof reportConfig>).map(type => (
            <button
              key={type}
              onClick={() => { setReportType(type); setSelectedItem(null); }}
              className={cn(
                "px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all tracking-[0.15em] border flex items-center gap-2 group",
                (reportType as string) === type 
                  ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20" 
                  : theme === 'light' ? "bg-white border-slate-200 text-slate-500 hover:border-slate-300" : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300"
              )}
            >
              {type === 'LOAN' && <AlertTriangle size={12} className={(reportType as string) === type ? "text-white" : "text-rose-500"} />}
              {reportConfig[type].title}
            </button>
          ))}
          <button
            key="ERROR"
            onClick={() => { setReportType('ERROR'); setSelectedItem(null); }}
            className={cn(
              "px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all tracking-[0.15em] border flex items-center gap-2 group",
              (reportType as string) === 'ERROR' 
                ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20" 
                : theme === 'light' ? "bg-white border-slate-200 text-slate-500 hover:border-slate-300" : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300"
            )}
          >
            <AlertCircle size={12} className={(reportType as string) === 'ERROR' ? "text-white" : "text-rose-500"} />
            Báo cáo sai sót
          </button>
        </div>

        <ErrorReportView applications={applications} theme={theme} />
      </div>
    );
  }

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
              (reportType as string) === type 
                ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20" 
                : theme === 'light' ? "bg-white border-slate-200 text-slate-500 hover:border-slate-300" : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300"
            )}
          >
            {type === 'LOAN' && <AlertTriangle size={12} className={(reportType as string) === type ? "text-white" : "text-rose-500"} />}
            {reportConfig[type].title}
          </button>
        ))}
        <button
          key="ERROR"
          onClick={() => { setReportType('ERROR'); setSelectedItem(null); }}
          className={cn(
            "px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all tracking-[0.15em] border flex items-center gap-2 group",
            (reportType as string) === 'ERROR' 
              ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20" 
              : theme === 'light' ? "bg-white border-slate-200 text-slate-500 hover:border-slate-300" : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300"
          )}
        >
          <AlertCircle size={12} className={(reportType as string) === 'ERROR' ? "text-white" : "text-rose-500"} />
          Báo cáo sai sót
        </button>
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
                  {reportConfig[reportType].roles.map((r, idx) => (
                    <span key={`${r}-${idx}`} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 text-[8px] font-black rounded-lg border border-indigo-500/20">{r}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-8 mt-6">
               {reportConfig[reportType].kpis.map((kpi, i) => (
                 <div key={`kpi-${kpi}-${i}`} className="space-y-1">
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
                    {projects.map((p, pIdx) => {
                      const isSelected = selectedLoanProjectIds.includes(p.id);
                      return (
                        <button
                          key={`loan-proj-${p.id}-${pIdx}`}
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
                  <div className={cn("p-6 rounded-3xl border flex items-center gap-4 transition-all shadow-xl", theme === 'light' ? "bg-white border-slate-200" : "bg-slate-950/40 border-slate-800/50")}>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                      <TrendingUp className="text-indigo-500" size={24} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Tổng căn có vay</p>
                      <p className={cn("text-2xl font-black italic", theme === 'light' ? "text-slate-900" : "text-white")}>{loanApps.length}</p>
                    </div>
                  </div>
                  <div className={cn("p-6 rounded-3xl border flex items-center gap-4 transition-all shadow-xl", theme === 'light' ? "bg-white border-slate-200" : "bg-slate-950/40 border-slate-800/50")}>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle2 className="text-emerald-500" size={24} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Đã ra sổ / Hoàn tất</p>
                      <p className={cn("text-2xl font-black italic", theme === 'light' ? "text-slate-900" : "text-white")}>{loanApps.filter(a => a.status === 'Completed').length}</p>
                    </div>
                  </div>
                  <div className={cn("p-6 rounded-3xl border flex items-center gap-4 transition-all shadow-xl", theme === 'light' ? "bg-white border-slate-200" : "bg-slate-950/40 border-slate-800/50")}>
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                      <Clock className="text-amber-500" size={24} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Đang xử lý đúng hạn</p>
                      <p className={cn("text-2xl font-black italic", theme === 'light' ? "text-slate-900" : "text-white")}>{loanApps.filter(a => a.status !== 'Completed' && !getOverdueInfo(a, stepConfig, slaConfig).isOverdue).length}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <div className={cn(
                     "p-6 rounded-[2rem] border overflow-hidden",
                     theme === 'light' ? "bg-slate-50 border-slate-100" : "bg-slate-950/40 border-slate-800"
                   )}>
                      <h4 className="text-[10px] font-black uppercase text-slate-500 mb-6 tracking-widest text-center">Phân bổ trạng thái Hồ sơ vay</h4>
                      <div className="h-[250px] w-full relative">
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                               <Pie
                                 data={loanPieData}
                                 innerRadius={60}
                                 outerRadius={80}
                                 paddingAngle={5}
                                 dataKey="value"
                                 stroke="none"
                               >
                                 {loanPieData.map((entry: any, index: number) => (
                                   <Cell key={`cell-${index}`} fill={entry.color} />
                                 ))}
                                 <Label 
                                   value={loanApps.length} 
                                   position="center" 
                                   className={cn("text-2xl font-black italic", theme === 'light' ? "fill-slate-900" : "fill-white")} 
                                 />
                               </Pie>
                               <ReTooltip 
                                 content={({ active, payload }) => {
                                   if (active && payload && payload.length) {
                                     const data = payload[0].payload;
                                     return (
                                       <div className={cn(
                                         "p-3 rounded-xl border shadow-xl backdrop-blur-md",
                                         theme === 'light' ? "bg-white/90 border-slate-200 text-slate-800" : "bg-slate-900/90 border-slate-800 text-white"
                                       )}>
                                         <div className="flex items-center gap-2 mb-1">
                                           <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
                                           <span className="text-[10px] font-black uppercase tracking-tight">{data.name}</span>
                                         </div>
                                         <div className="flex justify-between items-center gap-4">
                                           <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Số lượng:</span>
                                           <span className="text-sm font-black italic">{data.value}</span>
                                         </div>
                                       </div>
                                     );
                                   }
                                   return null;
                                 }}
                               />
                               <Legend verticalAlign="bottom" height={40} iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                             </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none mb-1">Tổng căn</p>
                          </div>
                      </div>
                   </div>

                   <div className={cn(
                     "p-6 rounded-[2rem] border overflow-hidden",
                     theme === 'light' ? "bg-slate-50 border-slate-100" : "bg-slate-950/40 border-slate-800"
                   )}>
                      <h4 className="text-[10px] font-black uppercase text-slate-500 mb-6 tracking-widest text-center">Tiến độ hồ sơ vay theo giai đoạn</h4>
                      <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={loanPieData}>
                               <XAxis dataKey="name" stroke="#94a3b8" fontSize={8} tickLine={false} axisLine={false} tick={{ width: 60 }} interval={0} />
                               <YAxis stroke="#94a3b8" fontSize={8} tickLine={false} axisLine={false} />
                               <ReTooltip 
                                 cursor={{ fill: 'rgba(99,102,241,0.05)' }}
                                 contentStyle={{ backgroundColor: theme === 'light' ? '#fff' : '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px' }}
                                />
                               <Bar dataKey="value" fill="#4f46e5" barSize={20} radius={[0, 4, 4, 0]}>
                                 {loanPieData.map((entry: any, index: number) => (
                                   <Cell key={`cell-${index}`} fill={entry.color} />
                                 ))}
                                 <LabelList 
                                   dataKey="value" 
                                   position="top" 
                                   content={(props: any) => {
                                      const { x, y, width, value } = props;
                                      return (
                                        <text 
                                          x={isNaN(Number(x)) || isNaN(Number(width)) ? 0 : Number(x) + Number(width) / 2} 
                                          y={isNaN(Number(y)) ? 0 : Number(y) - 10} 
                                          opacity={isNaN(Number(x)) || isNaN(Number(y)) || isNaN(Number(width)) ? 0 : 1} 
                                          fill={theme === 'light' ? '#334155' : '#cbd5e1'} 
                                          fontSize="11" 
                                          fontWeight="900"
                                          textAnchor="middle"
                                        >
                                          {value}
                                        </text>
                                      );
                                   }}
                                 />
                               </Bar>
                             </BarChart>
                        </ResponsiveContainer>
                      </div>
                   </div>
                </div>

                <div className={cn("overflow-x-auto rounded-3xl border", theme === 'light' ? "border-slate-200" : "border-slate-800/50")}>
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead className={theme === 'light' ? "bg-slate-50 border-b border-slate-200" : "bg-slate-950/50 border-b border-slate-800"}>
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Dự án & Mã căn</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Gói vay</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Tiến độ cấp GCN</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Ngày chậm</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Rủi ro Cam kết</th>
                      </tr>
                    </thead>
                    <tbody className={cn("divide-y", theme === 'light' ? "divide-slate-100" : "divide-slate-800/50")}>
                      {loanApps.map((app, index) => {
                        const days = calculateDaysDiff(app.receivedDate);
                        const isHighRisk = days > 10;
                        const isMediumRisk = days > 5 && days <= 10;

                        return (
                          <tr 
                            key={`${app.id}-${index}`} 
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
                                 <span className={cn("text-xs font-bold", theme === 'light' ? "text-indigo-600" : "text-indigo-400")}>{app.loanStatus === 'Co_Vay' ? 'Có vay' : 'Không vay'}</span>
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
                      {isChartsReady && stats && stats.length > 0 ? (<div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height={350}>
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
                      </div>) : <div className="h-[350px] w-full flex items-center justify-center"><span className="text-xs text-slate-500 italic">Chưa có dữ liệu</span></div>}
                   </div>
                    <div className="p-6 rounded-[2rem] border bg-slate-50 border-slate-100 dark:bg-slate-950/40 dark:border-slate-800">
                       <h4 className="text-[10px] font-black uppercase text-slate-500 mb-6 tracking-widest text-center">Phân tích Tốc độ (TAT trung bình)</h4>
                      <div className="h-[350px] w-full">
                         <ResponsiveContainer width="100%" height={350}>
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
                         {stats.length > 0 ? stats.slice().sort((a:any, b:any) => b.total - a.total).map((user: any, i: number) => (
                           <div key={user.id} className={cn(
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
                    {stats.slice(0, 4).map((user: any) => (
                      <div key={`top-card-${user.id}`} className={cn(
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
                      <ResponsiveContainer width="100%" height={400}>
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
                              <Cell key={`cell-${entry.stepKey}`} fill={entry.isCritical ? '#f43f5e' : entry.avgDays > 5 ? '#f59e0b' : '#6366f1'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                   </div>
                   
                   <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Trách nhiệm Phòng ban & TAT</p>
                      <div className="space-y-3">
                         {slaStats.slice().sort((a,b) => b.avgDays - a.avgDays).map((item, i) => (
                           <div key={`${item.step}-${i}`} className={cn(
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
                <ResponsiveContainer width="100%" height={400}>
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
                  className="flex items-center justify-between p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20 cursor-pointer hover:bg-rose-500/20 transition-all"
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
              <button className={cn("w-full mt-6 py-3 rounded-2xl text-[9px] font-black uppercase transition-all", theme === 'light' ? "bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100" : "bg-slate-900 border border-slate-800 text-slate-500 hover:text-white")}>
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
                  <div key={p.id} className="flex items-center gap-4">
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
}
