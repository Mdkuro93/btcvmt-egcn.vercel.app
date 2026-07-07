import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
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
import { REGION_ORDER, STEP_CONFIG as INITIAL_STEP_CONFIG } from '../constants';
import { determineStatusFromStep } from '../utils/appUtils';
import ErrorReportView from './ErrorReportView';
import SLAReportView from './SLAReportView';
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
  return calculateSLA(app, stepConfig, slaConfig);
};

const StatusBadge = ({ status, app }: { status: UnitStatus | string; app?: Application }) => {
  let effectiveStatus: string = status;
  if (app) {
    let baseStatus = app.status;
    if (baseStatus === 'Error') {
      baseStatus = determineStatusFromStep(app.currentStep, INITIAL_STEP_CONFIG);
    }

    if (baseStatus === 'WaitingHandover' || baseStatus === 'Completed') {
      effectiveStatus = app.customerHandoverDate ? 'Completed' : 'WaitingHandover';
    } else if (app.currentStep === 'S3_Nop_VPDK' || app.currentStep === 'GD2_Cho_Nop_VPDK') {
      effectiveStatus = (app.vpdkCode && app.submissionLocation && app.submissionDate) ? 'Submitted' : 'WaitingVPDK';
      if (effectiveStatus === 'Submitted' && app.submissionDate) {
        const subDate = new Date(app.submissionDate);
        const daysDiff = (new Date().getTime() - subDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff > 7 && !app.taxNotificationDate) effectiveStatus = 'TaxPending';
      }
    } else if (app.currentStep === 'GD3_Nop_VPDK') {
      effectiveStatus = 'TaxPending';
    } else if (app.currentStep === 'S5_Tai_Chinh_Khach_Hang' || app.currentStep === 'GD4_Cho_Nop_NVTC' || app.currentStep === 'GD4_Cho_KT_TiepNhan_LaySo') {
      effectiveStatus = app.taxReceiptDate ? 'TaxPaid' : 'TaxPaymentPending_Dynamic';
    } else if (app.currentStep === 'S5_1_PTDA_TiepNhan') {
       effectiveStatus = 'TaxPaid';
    } else if (['S6_Nhan_So_GCN', 'GD5_Cho_Ky_In_GCN'].includes(app.currentStep)) {
      effectiveStatus = app.gcnSignedDate ? 'GCN_Issued' : 'GCN_SignPending_Dynamic';
    } else if (['S7_PTDA_Ban_Giao', 'S7_1_PTT_Tiep_Nhan', 'S7_2_Ban_Giao_Khach', 'GD6_Cho_BG_Khach', 'GD5_Cho_PTT_TiepNhan_BG'].includes(app.currentStep)) {
       effectiveStatus = app.customerHandoverDate ? 'Completed' : 'WaitingHandover';
    } else {
       effectiveStatus = baseStatus;
    }
  }

  if (effectiveStatus === 'Error' && app) {
    effectiveStatus = determineStatusFromStep(app.currentStep, INITIAL_STEP_CONFIG);
  }

  const configs: Record<string, { label: string, classes: string }> = {
    Processing: { label: 'Đang chuẩn bị', classes: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' },
    WaitingVPDK: { label: 'Chờ nộp VPĐK', classes: 'bg-amber-500/10 text-amber-600 border border-amber-500/20' },
    Submitted: { label: 'Đã nộp VPĐK', classes: 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20' },
    TaxPending: { label: 'Chờ thông báo thuế', classes: 'bg-rose-500/10 text-rose-600 border border-rose-500/20' },
    TaxPaymentPending_Dynamic: { label: 'Chờ nộp thuế', classes: 'bg-rose-500/10 text-rose-600 border border-rose-500/20' },
    TaxCompleted: { label: 'Đã hoàn thành NVTC', classes: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' },
    TaxPaid: { label: 'ĐÃ NỘP THUẾ', classes: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]' },
    GCN_SignPending_Dynamic: { label: 'CHỜ BÀN GIAO', classes: 'bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-[-1px_1px_10px_rgba(245,158,11,0.15)] animate-pulse' },
    GCN_Issued: { label: 'Đã ra GCN', classes: 'bg-sky-500/10 text-sky-600 border border-sky-500/20' },
    WaitingHandover: { label: 'CHỜ BÀN GIAO', classes: 'bg-amber-500/10 text-amber-600 border border-amber-500/20 animate-pulse' },
    Completed: { label: 'Hoàn tất', classes: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' },
    Error: { label: 'Sai sót/Vướng', classes: 'bg-rose-500/10 text-rose-600 border border-rose-500/20' },
    Draft: { label: 'Nháp', classes: 'bg-slate-500/10 text-slate-600 border border-slate-500/20' },
  };

  let config = configs[effectiveStatus] || configs.Processing;

  if (app) {
    const slaResult = calculateSLA(app);
    const hasIssue = app.status === 'Error' || (app.issueType && app.issueType !== 'None') || app.isRejected;
    const isOverdue = slaResult.isOverdue;

    if (hasIssue || isOverdue) {
      config = {
        label: config.label,
        classes: 'bg-rose-500/12 text-rose-500 border border-rose-500/30 font-black animate-pulse'
      };
    }
  }

  return (
    <span className={cn("px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider whitespace-nowrap inline-block", config.classes)}>
      {config.label}
    </span>
  );
};

interface ReportsViewProps {
  allApplications?: Application[];
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
  userRole?: string;
  onExportExcel?: (type: string, month?: string, projectId?: string) => void;
}

export default function ReportsView({ 
  allApplications,
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
  setReportType,
  userRole = 'ADMIN',
  onExportExcel
}: ReportsViewProps) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [selectedLoanProjectIds, setSelectedLoanProjectIds] = useState<string[]>(projects.map(p => p.id));
  const [isChartsReady, setIsChartsReady] = useState(false);
  const [exportProjectId, setExportProjectId] = useState<string>('ALL');
  const [exportDept, setExportDept] = useState<string>('ALL');

  const handleExportExcel = () => {
    // Helper to format date as dd/mm/yyyy
    const formatDate = (dateValue: any) => {
      if (!dateValue) return '';
      const d = new Date(dateValue);
      if (isNaN(d.getTime())) return String(dateValue);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    // If the external onExportExcel is provided, call it
    if (onExportExcel) {
      onExportExcel(reportType, undefined, exportProjectId);
      return;
    }

    // Otherwise, use internal implementation
    const exportApps = allApplications && allApplications.length > 0 ? allApplications : applications;
    
    // Lọc theo dự án
    const byProject = exportProjectId === 'ALL'
      ? exportApps
      : exportApps.filter(a => {
          const proj = projects.find(p => p.id === exportProjectId);
          return proj ? a.projectName === proj.name : true;
        });

    // Lọc thêm theo bộ phận nếu chọn — dùng CHÍNH stepConfig đang sống (đồng bộ với
    // Cài đặt hệ thống > Cấu hình bước), không hard-code riêng một bảng nữa để tránh
    // lệch dữ liệu giữa Dashboard/SLA và file Excel xuất ra.
    // Hồ sơ đã "Hoàn tất" (dept cấu hình là ADMIN) được quy về bộ phận đã xử lý bước
    // cuối cùng trước khi hoàn tất (tra trong lịch sử xử lý), để không bị rơi mất khỏi
    // báo cáo của cả 3 phòng ban.
    const getAppDept = (a: Application): string | undefined => {
      const currentDept = stepConfig[a.currentStep || '']?.dept;
      if (currentDept && currentDept !== 'ADMIN') return currentDept;

      // Hồ sơ đã hoàn tất hoặc bước không xác định dept nghiệp vụ cụ thể
      // -> lấy bộ phận PTT/KT/PTDA gần nhất đã xử lý trong lịch sử
      const lastBusinessHistory = [...(a.history || [])]
        .reverse()
        .find(h => h.dept === 'PTT' || h.dept === 'KT' || h.dept === 'PTDA');
      return lastBusinessHistory?.dept;
    };

    const filteredApps = exportDept === 'ALL'
      ? byProject
      : byProject.filter(a => getAppDept(a) === exportDept);

    const projectName = exportProjectId === 'ALL'
      ? 'Tất cả dự án'
      : projects.find(p => p.id === exportProjectId)?.name 
        || '';

    const deptLabel = exportDept === 'ALL' ? '' 
      : exportDept === 'PTT' ? ' | Bộ phận: Thủ tục (PTT)'
      : exportDept === 'KT'  ? ' | Bộ phận: Kế toán (KT)'
      : ' | Bộ phận: Phát triển DA (PTDA)';

    const today = new Date().toLocaleDateString('vi-VN');

    // Tạo data Excel theo từng loại báo cáo
    let rows: any[][] = [];
    let sheetName = 'BáoCáo';
    let fileName = '';

    if (reportType === 'PROJECT') {
      fileName = `BaoCao_DuAn_${today.replace(/\//g,'-')}`;
      sheetName = 'Theo Dự Án';
      rows = [
        [`BÁO CÁO TIẾN ĐỘ THEO DỰ ÁN`],
        [`Dự án: ${projectName} | Xuất ngày: ${today}`],
        [],
        ['Dự án', 'Tổng hồ sơ', 'Hoàn tất', 
         'Đang xử lý', 'Vướng mắc', 'Tỷ lệ HT (%)'],
        ...(exportProjectId === 'ALL' ? projects : 
           projects.filter(p => p.id === exportProjectId)
        ).map(p => {
          const pApps = filteredApps.filter(
            a => a.projectName === p.name
          );
          const done = pApps.filter(
            a => a.status === 'Completed'
          ).length;
          const err = pApps.filter(
            a => a.status === 'Error' || a.isRejected
          ).length;
          const rate = pApps.length > 0
            ? `${Math.round(done/pApps.length*100)}%` : '0%';
          return [
            p.name, pApps.length, done,
            pApps.length - done - err, err, rate
          ];
        }),
        [],
        ['TỔNG CỘNG',
          filteredApps.length,
          filteredApps.filter(a => a.status==='Completed').length,
          filteredApps.filter(a => 
            a.status!=='Completed' && a.status!=='Error' && 
            !a.isRejected
          ).length,
          filteredApps.filter(a => 
            a.status==='Error' || a.isRejected
          ).length,
          filteredApps.length > 0
            ? `${Math.round(
                filteredApps.filter(
                  a=>a.status==='Completed'
                ).length/filteredApps.length*100
              )}%` : '0%'
        ]
      ];
    }

    else if (reportType === 'SLA') {
      fileName = `BaoCao_SLA_${today.replace(/\//g,'-')}`;
      sheetName = 'Phân tích SLA';
      rows = [
        ['BÁO CÁO SLA & TIẾN ĐỘ XỬ LÝ'],
        [`Dự án: ${projectName} | Xuất ngày: ${today}`],
        [],
        ['Mã lô', 'Dự án', 'Khách hàng', 'Trạng thái',
         'Bước hiện tại',
         'Ngày ký HĐ', 'Ngày nộp VPĐK', 'Ngày hoàn tất',
         'Số ngày XL', 'SLA (ngày)', 'Tình trạng SLA', 'Số ngày trễ'],
        ...filteredApps.map(app => {
          const start = app.contractSigningDate
            ? new Date(app.contractSigningDate) : null;
          const end = app.customerHandoverDate
            ? new Date(app.customerHandoverDate) : null;
          const days = start && end
            ? Math.round(
                (end.getTime()-start.getTime())
                /(1000*60*60*24)
              ) : '';
          const sla = slaConfig?.totalSLA || 90;

          // Lấy thông tin SLA real-time từ hệ thống
          const slaInfo = app._sla || calculateSLA(app, stepConfig, slaConfig);
          const currentStepLabel = (stepConfig?.[app.currentStep] || INITIAL_STEP_CONFIG?.[app.currentStep])?.label || app.currentStep || '';

          // Phân loại tình trạng SLA rõ ràng hơn
          let slaStatus: string;
          let daysLate: number | string = '';

          if (app.status === 'Completed' || app.customerHandoverDate) {
            // Hồ sơ đã hoàn tất: so sánh tổng số ngày xử lý vs SLA cam kết
            slaStatus = days !== '' && Number(days) <= sla ? '✓ Đúng hạn' : '✗ Trễ hạn';
          } else if (slaInfo?.isOverdue) {
            // Hồ sơ đang xử lý và đã trễ hạn tại bước hiện tại
            slaStatus = '⚠ Đang trễ hạn';
            daysLate = slaInfo.daysLate || '';
          } else {
            // Hồ sơ đang xử lý, chưa trễ
            const daysLeft = slaInfo?.daysLeft;
            slaStatus = daysLeft !== undefined && daysLeft <= 3
              ? `⏳ Sắp trễ (còn ${daysLeft} ngày)`
              : '✓ Đang xử lý';
          }

          return [
            app.unitCode,
            app.projectName,
            app.customerName,
            app.status,
            currentStepLabel,
            formatDate(app.contractSigningDate),
            formatDate(app.submissionDate),
            formatDate(app.customerHandoverDate),
            days !== '' ? days : '',
            sla,
            slaStatus,
            daysLate
          ];
        })
      ];
    }

    else if (reportType === 'ERROR') {
      fileName = `BaoCao_SaiSot_VuongMac_${today.replace(/\//g,'-')}`;
      sheetName = 'Báo cáo Sai sót';

      const normalizedErrors = filteredApps.map(app => {
        const hasActiveError = app.status === 'Error' || (app.issueType && app.issueType !== 'None');
        const status = hasActiveError ? 'OPEN' : 'RESOLVED';
        const rawNotes = app.issueNotes ?? 
                         (app as any).issue_notes ?? 
                         (app as any).ghi_chu ?? 
                         (app as any).ghi_chu_sai_sot ?? 
                         (app as any).note ?? 
                         (app as any).notes ?? 
                         (app as any).error_description ?? 
                         (app as any).incident_note ?? 
                         '';
        return {
          ...app,
          issueStatus: app.issueStatus || (status as 'OPEN' | 'RESOLVED'),
          issueType: app.issueType || 'None',
          issueSeverity: app.issueSeverity || 'Minor',
          issueNotes: typeof rawNotes === 'string' ? rawNotes.trim() : String(rawNotes ?? ''),
        };
      }).filter(app => app.issueType && app.issueType !== 'None');

      rows = [
        ['BÁO CÁO CHI TIẾT SAI SÓT & VƯỚNG MẮC HỒ SƠ'],
        [`Dự án: ${projectName} | Xuất ngày: ${today}`],
        [],
        [
          'STT', 'Mã lô/căn', 'Dự án', 'Khách hàng', 'Loại tài sản', 
          'Vay vốn', 'Tự làm sổ', 'Giai đoạn hiện tại', 'Trạng thái hồ sơ',
          'Loại sai sót', 'Trạng thái xử lý', 'Mức độ nghiêm trọng', 'Chi tiết ghi chú sự vụ',
          'Số lần từ chối', 'Lý do từ chối cuối'
        ],
        ...normalizedErrors.map((app, i) => [
          i + 1,
          app.unitCode || '',
          app.projectName || '',
          app.customerName || '',
          app.propertyType === 'Can_Ho' ? 'Căn hộ' : 'Đất nền',
          app.loanStatus === 'Co_Vay' ? 'Có' : 'Không',
          app.isSelfService ? 'Có' : 'Không',
          app.currentStep || '',
          app.status || '',
          app.issueType || 'Khác',
          app.issueStatus === 'OPEN' ? 'Đang mở (Chưa XL)' : 'Đã xử lý / Đóng',
          (app.issueSeverity as any) === 'High' || app.issueSeverity === 'Critical' ? 'Nghiêm trọng/Cao' : (app.issueSeverity as any) === 'Medium' || app.issueSeverity === 'Moderate' ? 'Trung bình' : 'Nhẹ',
          app.issueNotes || '',
          app.rejectionCount || 0,
          app.rejectionReason || ''
        ])
      ];
    }

    else {
      // Tổng hợp cho PROJECT, REGION, LOAN, PERFORMANCE
      fileName = `BaoCao_TongHop_${today.replace(/\//g,'-')}`;
      sheetName = 'Báo cáo Tổng hợp';
      rows = [
        ['BÁO CÁO TỔNG HỢP HỒ SƠ GCN'],
        [`Dự án: ${projectName}${deptLabel} | Xuất ngày: ${today}`],
        [],
        ['STT', 'Mã lô/căn', 'Dự án', 'Khách hàng',
         'Loại tài sản', 'Vay vốn', 'Tự làm sổ',
         'Ngày nhận hồ sơ', 'Ngày ký HĐ', 'Ngày bàn giao căn hộ',
         'Ngày bàn giao sang KT', 'Ngày KT bàn giao PTDA',
         'Ngày nộp VPĐK', 'Ngày nộp hồ sơ NVTC vào VPĐK',
         'Ngày TB Thuế', 'Ngày nhận TB Thuế', 'Ngày cấp TB Thuế', 'Ngày đóng thuế',
         'Ngày trình ký/in GCN', 'Ngày nhận GCN', 'Ngày PTDA bàn giao PTT',
         'Giai đoạn', 'Trạng thái', 'Ngày bàn giao KH',
         'Bước hiện tại', 'Tình trạng SLA', 'Số ngày trễ', 'Sai sót'],
        ...filteredApps.map((app, i) => {
          const slaInfo = app._sla || calculateSLA(app, stepConfig, slaConfig);
          const currentStepLabel = (stepConfig?.[app.currentStep] 
            || INITIAL_STEP_CONFIG?.[app.currentStep])?.label 
            || app.currentStep || '';

          let slaStatus: string;
          let daysLate: number | string = '';
          if (app.status === 'Completed' || app.customerHandoverDate) {
            slaStatus = '✓ Hoàn tất';
          } else if (slaInfo?.isOverdue) {
            slaStatus = '⚠ Đang trễ hạn';
            daysLate = slaInfo.daysLate || '';
          } else {
            const daysLeft = slaInfo?.daysLeft;
            slaStatus = daysLeft !== undefined && daysLeft <= 3
              ? `⏳ Sắp trễ (còn ${daysLeft} ngày)`
              : '✓ Đang xử lý';
          }

          const hasIssue = app.status === 'Error' || 
            (app.issueType && app.issueType !== 'None');
          const issueText = hasIssue
            ? `${app.issueType || 'Sai sót'}: ${app.issueNotes || app.issueType || ''}`
            : '';

          return [
            i+1,
            app.unitCode,
            app.projectName,
            app.customerName,
            app.propertyType === 'Can_Ho' ? 'Căn hộ' : 'Đất nền',
            app.loanStatus === 'Co_Vay' ? 'Có' : 'Không',
            app.isSelfService ? 'Có' : 'Không',
            formatDate(app.receivedDate),
            formatDate(app.contractSigningDate),
            formatDate(app.handoverApartmentDate),
            formatDate(app.accountingHandoverDate),
            formatDate(app.ktHandoverToPtdaDate),
            formatDate(app.submissionDate),
            formatDate(app.taxVpdkSubmissionDate),
            formatDate(app.taxNotificationDate),
            formatDate(app.taxNotificationReceivedDate),
            formatDate(app.taxNoticeProvisionDate),
            formatDate(app.taxReceiptDate),
            formatDate(app.gcnSignedDate),
            formatDate(app.gcnReceivedDate),
            formatDate(app.ptdaHandoverDate),
            app.currentStep,
            app.status,
            formatDate(app.customerHandoverDate),
            currentStepLabel,
            slaStatus,
            daysLate,
            issueText
          ];
        })
      ];
    }

    // Tạo worksheet và auto-width
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const colWidths = (rows[3] || []).map((_: any, i: number) => ({
      wch: Math.max(
        12,
        ...rows.slice(3).map((r: any) => 
          String(r[i] ?? '').length + 2
        )
      )
    }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

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
      else if (r.submissionDate || r.currentStep === 'S3_Nop_VPDK' || r.currentStep === 'GD3_Nop_VPDK') {
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
      createStageItem('CHỜ NỘP VPĐK', stages.AWAITING_SUBMISSION, '#f59e0b'),
      createStageItem('ĐÃ NỘP VPĐK', stages.SUBMITTED, '#3b82f6'),
      createStageItem('CHỜ TB THUẾ', stages.TAX_WARNING, '#f97316'),
      createStageItem('CHỜ HOÀN THÀNH NVTC', stages.AWAITING_FINANCE, '#8b5cf6'),
      createStageItem('ĐÃ NỘP THUẾ', stages.TAX_PAID, '#10b981'),
      createStageItem('ĐÃ CÓ GCN', stages.GCN_READY, '#06b6d4'),
      createStageItem('CHỜ BÀN GIAO', stages.WAITING_HANDOVER, '#6366f1'),
      createStageItem('HOÀN TẤT', stages.COMPLETED, '#22c55e')
    ].filter(d => d.value > 0 || d.error > 0);
  }, [loanApps]);

  if (reportType === 'ERROR') {
    const errorDisplayApps = exportProjectId === 'ALL'
      ? applications
      : applications.filter(a => {
          const proj = projects.find(p => p.id === exportProjectId);
          return proj ? a.projectName === proj.name : true;
        });

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
          {(Object.keys(reportConfig) as Array<keyof typeof reportConfig>).map((type, idx) => (
            <button
              key={`report-nav-err-${type}-${idx}`}
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
            key="nav-error-ERROR"
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

        {/* Toolbar Export */}
        <div className={cn(
          "flex flex-wrap items-center gap-3 p-4 rounded-2xl border mb-6",
          theme === 'light'
            ? "bg-slate-50 border-slate-100"
            : "bg-slate-800/50 border-slate-700/50"
        )}>
          <span className={cn(
            "text-[10px] font-black uppercase tracking-wider",
            theme === 'light' ? "text-slate-500" : "text-slate-400"
          )}>
            Xuất báo cáo:
          </span>

          {/* Chọn dự án */}
          <select
            value={exportProjectId}
            onChange={e => setExportProjectId(e.target.value)}
            className={cn(
              "text-xs px-3 py-2 rounded-xl border outline-none",
              "font-semibold transition-all",
              theme === 'light'
                ? "bg-white border-slate-200 text-slate-700"
                : "bg-slate-700/50 border-slate-600 text-white"
            )}
          >
            <option value="ALL">📊 Tất cả dự án</option>
            {projects.map((p, pIdx) => (
              <option key={`report-export-proj-opt-err-${p.id}-${pIdx}`} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Chọn bộ phận */}
          <select
            value={exportDept}
            onChange={e => setExportDept(e.target.value)}
            className={cn(
              "text-xs px-3 py-2 rounded-xl border outline-none",
              "font-semibold transition-all",
              theme === 'light'
                ? "bg-white border-slate-200 text-slate-700"
                : "bg-slate-700/50 border-slate-600 text-white"
            )}
          >
            <option value="ALL">🏢 Tất cả bộ phận</option>
            <option value="PTT">📋 PTT — Thủ tục</option>
            <option value="KT">💰 KT — Kế toán</option>
            <option value="PTDA">🏗️ PTDA — Phát triển DA</option>
          </select>

          {/* Số hồ sơ sẽ xuất */}
          <span className={cn(
            "text-[10px] font-bold",
            theme === 'light' ? "text-slate-400" : "text-slate-500"
          )}>
            {exportProjectId === 'ALL'
              ? `${applications.length} hồ sơ`
              : `${applications.filter(a => {
                  const p = projects.find(
                    x => x.id === exportProjectId
                  );
                  return p ? a.projectName === p.name : false;
                }).length} hồ sơ`
            }
          </span>

          {/* Nút Export */}
          <button
            onClick={handleExportExcel}
            className={cn(
              "ml-auto flex items-center gap-2",
              "px-4 py-2 rounded-xl font-bold text-xs text-white",
              "bg-emerald-600 hover:bg-emerald-500",
              "transition-all shadow-md shadow-emerald-500/20",
              "active:scale-95"
            )}
          >
            <Download size={14} />
            Xuất Excel
          </button>
        </div>

        <ErrorReportView applications={errorDisplayApps} theme={theme} />
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
          <button 
            onClick={handleExportExcel}
            className={cn(
              "flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 border",
              theme === 'light' ? "bg-white border-slate-200 text-slate-700" : "bg-slate-900 border-slate-800 text-slate-300"
            )}
          >
            <Download size={14} className="text-indigo-500" /> Export Business Intelligence
          </button>
        </div>
      </header>

      {/* Report Navigation */}
        <div className="flex flex-wrap gap-2">
          {(Object.keys(reportConfig) as Array<keyof typeof reportConfig>).map((type, idx) => (
            <button
              key={`report-nav-main-${type}-${idx}`}
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
          key="nav-main-ERROR"
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

      {/* Toolbar Export */}
      <div className={cn(
        "flex flex-wrap items-center gap-3 p-4 rounded-2xl border mb-6",
        theme === 'light'
          ? "bg-slate-50 border-slate-100"
          : "bg-slate-800/50 border-slate-700/50"
      )}>
        <span className={cn(
          "text-[10px] font-black uppercase tracking-wider",
          theme === 'light' ? "text-slate-500" : "text-slate-400"
        )}>
          Xuất báo cáo:
        </span>

        {/* Chọn dự án */}
        <select
          value={exportProjectId}
          onChange={e => setExportProjectId(e.target.value)}
          className={cn(
            "text-xs px-3 py-2 rounded-xl border outline-none",
            "font-semibold transition-all",
            theme === 'light'
              ? "bg-white border-slate-200 text-slate-700"
              : "bg-slate-700/50 border-slate-600 text-white"
          )}
        >
          <option value="ALL">📊 Tất cả dự án</option>
          {projects.map((p, pIdx) => (
            <option key={`report-export-proj-opt-${p.id}-${pIdx}`} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* Chọn bộ phận */}
        <select
          value={exportDept}
          onChange={e => setExportDept(e.target.value)}
          className={cn(
            "text-xs px-3 py-2 rounded-xl border outline-none",
            "font-semibold transition-all",
            theme === 'light'
              ? "bg-white border-slate-200 text-slate-700"
              : "bg-slate-700/50 border-slate-600 text-white"
          )}
        >
          <option value="ALL">🏢 Tất cả bộ phận</option>
          <option value="PTT">📋 PTT — Thủ tục</option>
          <option value="KT">💰 KT — Kế toán</option>
          <option value="PTDA">🏗️ PTDA — Phát triển DA</option>
        </select>

        {/* Số hồ sơ sẽ xuất */}
        <span className={cn(
          "text-[10px] font-bold",
          theme === 'light' ? "text-slate-400" : "text-slate-500"
        )}>
          {exportProjectId === 'ALL'
            ? `${applications.length} hồ sơ`
            : `${applications.filter(a => {
                const p = projects.find(
                  x => x.id === exportProjectId
                );
                return p ? a.projectName === p.name : false;
              }).length} hồ sơ`
          }
        </span>

        {/* Nút Export */}
        <button
          onClick={handleExportExcel}
          className={cn(
            "ml-auto flex items-center gap-2",
            "px-4 py-2 rounded-xl font-bold text-xs text-white",
            "bg-emerald-600 hover:bg-emerald-500",
            "transition-all shadow-md shadow-emerald-500/20",
            "active:scale-95"
          )}
        >
          <Download size={14} />
          Xuất Excel
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
                  {reportConfig[reportType].roles.map((roleText, idx) => (
                    <span key={`report-role-badge-${roleText || 'r'}-${idx}`} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 text-[8px] font-black rounded-lg border border-indigo-500/20">{roleText}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-8 mt-6">
               {reportConfig[reportType].kpis.map((kpiText, i) => (
                 <div key={`report-kpi-bar-${kpiText || 'k'}-${i}`} className="space-y-1">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">{kpiText}</p>
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
                      onClick={handleExportExcel}
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
                          key={`report-loan-proj-btn-${p.id}-${pIdx}`}
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                      <p className={cn("text-2xl font-black italic", theme === 'light' ? "text-slate-900" : "text-white")}>{loanApps.filter(a => a.status === 'Completed' || a.currentStep === 'Hoan_Tat' || !!a.customerHandoverDate).length}</p>
                    </div>
                  </div>
                  <div className={cn("p-6 rounded-3xl border flex items-center gap-4 transition-all shadow-xl", theme === 'light' ? "bg-white border-slate-200" : "bg-slate-950/40 border-slate-800/50")}>
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                      <Clock className="text-amber-500" size={24} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Đang xử lý đúng hạn</p>
                      <p className={cn("text-2xl font-black italic", theme === 'light' ? "text-slate-900" : "text-white")}>{loanApps.filter(a => !(a.status === 'Completed' || a.currentStep === 'Hoan_Tat' || !!a.customerHandoverDate) && !getOverdueInfo(a, stepConfig, slaConfig).isOverdue).length}</p>
                    </div>
                  </div>
                  <div className={cn("p-6 rounded-3xl border flex items-center gap-4 transition-all shadow-xl", theme === 'light' ? "bg-white border-slate-200" : "bg-slate-950/40 border-slate-800/50")}>
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                      <AlertTriangle className="text-rose-500" size={24} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Trễ cam kết</p>
                      <p className={cn("text-2xl font-black italic", theme === 'light' ? "text-slate-900" : "text-white")}>{loanApps.filter(a => !(a.status === 'Completed' || a.currentStep === 'Hoan_Tat' || !!a.customerHandoverDate) && getOverdueInfo(a, stepConfig, slaConfig).isOverdue).length}</p>
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
                                   <Cell key={`report-loan-pie-cell-${index}-${entry.name || 'e'}`} fill={entry.color} />
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
                                   <Cell key={`report-loan-bar-cell-${index}-${entry.name || 'e'}`} fill={entry.color} />
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
                        const overdueInfo = getOverdueInfo(app, stepConfig, slaConfig);
                        const isCompleted = app.status === 'Completed' || app.currentStep === 'Hoan_Tat' || !!app.customerHandoverDate;
                        const daysLate = isCompleted ? 0 : overdueInfo.daysLate;
                        const isHighRisk = !isCompleted && overdueInfo.isOverdue;
                        const isMediumRisk = !isCompleted && !overdueInfo.isOverdue && overdueInfo.urgency === 'urgent';

                        return (
                          <tr 
                            key={`report-loan-row-${app.id || 'new'}-${index}`} 
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
                                 isCompleted ? "text-slate-400" :
                                 isHighRisk ? "bg-rose-500/10 text-rose-500 shadow-[inset_0_0_10px_rgba(244,63,94,0.1)]" : isMediumRisk ? "bg-amber-500/10 text-amber-500" : theme === 'light' ? "bg-slate-100 text-slate-500" : "bg-slate-900 text-slate-600"
                               )}>
                                 {isCompleted ? "-" : `${daysLate} Ngày ${isHighRisk ? "!!" : ""}`}
                               </span>
                            </td>
                            <td className="px-6 py-5">
                               <div className="flex items-center justify-center">
                                 {isCompleted ? (
                                   <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[9px] font-black uppercase tracking-tighter">
                                     <CheckCircle2 size={10} /> An Toàn
                                   </div>
                                 ) : isHighRisk ? (
                                   <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-500 text-white rounded-full text-[9px] font-black uppercase tracking-tighter animate-pulse">
                                     <AlertTriangle size={10} /> Trễ cam kết
                                   </div>
                                 ) : isMediumRisk ? (
                                   <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-[9px] font-black uppercase tracking-tighter">
                                     Gần hạn chót
                                   </div>
                                 ) : (
                                   <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-500/10 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-tighter">
                                     Bình thường
                                   </div>
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
                          <BarChart data={stats as any} layout="vertical" margin={{ left: 20 }}>
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
                            <AreaChart data={(stats as any).slice().sort((a:any, b:any) => a.avgTime - b.avgTime)}>
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
                           <div key={`report-perf-usr-card-${user.id || 'u'}-${i}`} className={cn(
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
                    {stats.slice(0, 4).map((user: any, index: number) => (
                      <div key={`report-top-user-kpi-${user.id || 'n'}-${index}`} className={cn(
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
              <SLAReportView
                applications={applications}
                projects={projects}
                theme={theme}
                stepConfig={stepConfig}
                slaConfig={slaConfig}
                userRole={userRole}
              />
            ) : (
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={stats as any} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
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
                   <span className="text-sm font-black text-rose-500">
                     {applications.filter(a => {
                       const info = getOverdueInfo(a, stepConfig, slaConfig);
                       return info.isOverdue && (info.daysLate || 0) > 15;
                     }).length}
                   </span>
                </div>
                <div 
                  onClick={() => { setActiveTab('applications'); setFilterLoanStatus('Co_Vay'); }}
                  className="flex items-center justify-between p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 cursor-pointer hover:bg-amber-500/20 transition-all"
                >
                   <span className="text-[10px] font-black text-amber-500 uppercase">Vi phạm Cam kết cấp GCN</span>
                   <span className="text-sm font-black text-amber-500">
                     {loanApps.filter(a => {
                       const info = getOverdueInfo(a, stepConfig, slaConfig);
                       return info.isOverdue && (info.daysLate || 0) > 10;
                     }).length}
                   </span>
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
                  <div key={`proj-ranking-list-${p.id || p.name || 'e'}-${i}`} className="flex items-center gap-4">
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
