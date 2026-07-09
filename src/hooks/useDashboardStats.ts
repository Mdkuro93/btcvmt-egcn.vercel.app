
import { useMemo } from 'react';
import { useDataStore } from '../stores/useDataStore';
import { getOverdueInfo, calculateDaysDiff, getRecordDept } from '../utils/appUtils';
import { diffDays } from '../utils/dateUtils';
import { Application, KPI, Project, Dept, UnitStatus } from '../types';
import { STEP_CONFIG as INITIAL_STEP_CONFIG } from '../constants';
import { RotateCcw, Clock, AlertTriangle, AlertCircle, History as HistoryIcon } from 'lucide-react';
import { getFinalStatus, isOverdue, computeUltimateStatus } from '../utils/statusEngine';

export function useDashboardStats(
  selectedProjectId: string | null,
  selectedProject: Project | undefined,
  dashboardTab: 'ALL' | 'SELF_SERVICE' | 'LOAN'
) {
  const { dashboardApps, stepConfig, slaConfig, applications } = useDataStore();
  
  // Tránh lỗi khi gọi
  const enrichedDashboardApps = useMemo(() => {
    return (dashboardApps || []).map((a: any) => ({
      ...a,
    }));
  }, [dashboardApps]);

  const stats = useMemo(() => {
    const apps = enrichedDashboardApps;
    const total = apps.length;
    const processing = apps.filter((a) => a.status === 'Processing').length;
    const waitingVPDK = apps.filter((a) => a.status === 'WaitingVPDK').length;
    const taxPending = apps.filter((a) => a.status === 'TaxPending').length;
    const waitingHandover = apps.filter((a) => a.status === 'WaitingHandover').length;
    const completed = apps.filter((a) => a.status === 'Completed').length;
    
    const overdue = apps.filter((a) => {
      if (a._sla) {
        return a._sla.isOverdue;
      }
      return isOverdue(a);
    }).length;

    return {
      total,
      processing,
      waitingVPDK,
      taxPending,
      waitingHandover,
      completed,
      overdue,
    };
  }, [enrichedDashboardApps]);

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
      submitted: dashboardApps.filter(a => computeUltimateStatus(a) === '3. ĐÃ NỘP VPĐK').length,
      taxPending: dashboardApps.filter(a => computeUltimateStatus(a) === '4. CHỜ THÔNG BÁO THUẾ').length,
      taxCompleted: dashboardApps.filter(a => (stepConfig[a.currentStep]?.status || INITIAL_STEP_CONFIG[a.currentStep]?.status) === 'TaxCompleted').length,
      gcnIssued: dashboardApps.filter(a => (stepConfig[a.currentStep]?.status || INITIAL_STEP_CONFIG[a.currentStep]?.status) === 'GCN_Issued').length,
      completed: dashboardApps.filter(a => (stepConfig[a.currentStep]?.status || INITIAL_STEP_CONFIG[a.currentStep]?.status) === 'Completed').length,
      error: dashboardApps.filter(a => a.status === 'Error' || a.isRejected || (a.issueType && a.issueType !== 'None')).length,
      overdue: dashboardApps.filter(a => getOverdueInfo(a, stepConfig, slaConfig).isOverdue).length,
      loanCount: dashboardApps.filter(a => a.loanStatus === 'Co_Vay').length,
      regularCount: dashboardApps.filter(a => a.loanStatus === 'Khong_Vay').length,
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
    // PTT Tax Pending: Matching "CHỜ HOÀN THÀNH NVTC"
    const pttTaxPending = apps.filter(a => 
      a.currentStep === 'S5_Tai_Chinh_Khach_Hang' || 
      a.currentStep === 'GD4_Cho_Nop_NVTC'
    ).length;
    
    const pttWaitingHandover = waitingHandoverCount;
    const pttSlowest = apps.filter(a => stepConfig[a.currentStep]?.dept === 'PTT')
        .map(a => ({ ...a, overdue: getOverdueInfo(a, stepConfig, slaConfig) }))
        .filter(a => a.overdue.isOverdue)
        .sort((a, b) => (b.overdue.daysLate || 0) - (a.overdue.daysLate || 0))
        .slice(0, 5);

    // KT
    // Tổng số lượng hồ sơ đang thực hiện chưa hoàn thành (all records not complete)
    const ktTotal = apps.filter(a => getRecordDept(a, stepConfig) === 'KT').length;
    // Hồ sơ cần tiếp nhận: PTT đã chuyển nhưng KT chưa tiếp nhận
    const ktNeedReceive = apps.filter(a => {
      const isSupportSpecial = (a.workflowType === 'Quy_trinh_1' || a.projectName?.includes('hỗ trợ')) && (a.currentStep === 'GD2_Cho_Nop_VPDK' || a.currentStep === 'S3_Nop_VPDK');
      return a.currentStep === 'S2_KT_Tiep_Nhan' || 
             a.currentStep === 'GD1_Cho_KT_TiepNhan' || 
             isSupportSpecial;
    }).length;
    // Hồ sơ đang xử lý: Đã tiếp nhận nhưng chưa bàn giao PTDA
    const ktProcessing = apps.filter(a => {
      const dept = getRecordDept(a, stepConfig);
      if (dept !== 'KT') return false;
      return a.currentStep === 'S2_KT_Tiep_Nhan' || 
             a.currentStep === 'GD1_Cho_KT_TiepNhan' || 
             a.currentStep === 'S2_KT_Ban_giao' ||
             a.currentStep === 'GD2_Cho_Nop_VPDK' ||
             a.currentStep === 'GD4_Cho_KT_TiepNhan_LaySo' || 
             a.currentStep === 'GD5_Cho_GCN';
    }).length;
    // Hồ sơ sai sót
    const ktIssues = apps.filter(a => (a.isRejected || a.status === 'Error' || (a.issueType && a.issueType !== 'None')) && getRecordDept(a, stepConfig) === 'KT').length;
    const ktTaxPending = apps.filter(a => a.taxNotificationDate && !a.taxReceiptDate).length;

    // PTDA
    const ptdaApps = apps.filter(a => getRecordDept(a, stepConfig) === 'PTDA');
    
    // User requested logic for daNopVPDK and choThue
    const daNopVPDK = apps.filter(app => app.submissionDate && !app.taxNotificationDate && diffDays(app.submissionDate) <= 7);
    const choThue = apps.filter(app => app.submissionDate && !app.taxNotificationDate && diffDays(app.submissionDate) > 7);

    // Hồ sơ đã tiếp nhận: Các hồ sơ tiếp nhận từ KT (đã bao gồm daNopVPDK)
    const ptdaReceived = apps.filter(a => {
      const dept = getRecordDept(a, stepConfig);
      return dept === 'PTDA' && (
        a.currentStep === 'S2_KT_Ban_giao' || 
        a.currentStep === 'S3_Nop_VPDK' ||
        a.currentStep === 'S5_1_PTDA_TiepNhan'
      );
    }).length;
    // Chờ TB Thuế: ChoThue must exclude S3_Nop_VPDK
    const ptdaNoTax = choThue.length;
    // Chờ hoàn thành NVTC:
    const ptdaTaxPending = apps.filter(a => 
      (a.currentStep === 'S5_1_PTDA_TiepNhan' || 
       a.currentStep === 'GD4_Cho_KT_TiepNhan_LaySo') && !a.taxReceiptDate
    ).length;
    // Chờ in/ký GCN -> CHỜ BÀN GIAO: 
    const ptdaGcnWaiting = apps.filter(a => a.status === 'WaitingHandover' || a.currentStep === 'GD5_Cho_PTT_TiepNhan_BG').length;
    const ptdaIssues = apps.filter(a => (a.isRejected || a.status === 'Error' || (a.issueType && a.issueType !== 'None')) && getRecordDept(a, stepConfig) === 'PTDA').length;
    
    const ptdaAppsWithTax = apps.filter(a => a.submissionDate && a.taxNotificationDate);
    const avgTaxWait = ptdaAppsWithTax.length > 0 
        ? ptdaAppsWithTax.reduce((acc, curr) => {
            const start = new Date(curr.submissionDate!).getTime();
            const end = new Date(curr.taxNotificationDate!).getTime();
            return acc + (end - start);
          }, 0) / ptdaAppsWithTax.length / (1000 * 60 * 60 * 24)
        : 0;
    const ptdaStuck = apps.filter(a => getRecordDept(a, stepConfig) === 'PTDA' && getOverdueInfo(a, stepConfig, slaConfig).isOverdue).length;

    // Simplified Bottleneck Stats by Department
    const depts: Dept[] = ['PTT', 'KT', 'PTDA'];
    const deptStats = depts.map(dept => {
        const appsInDept = apps.filter(a => getRecordDept(a, stepConfig) === dept);

        // Filter apps to exclude those with active issues (issueType != null/undefined and is not 'None')
        const appsInDeptForAvg = appsInDept.filter(a => !a.issueType || a.issueType === 'None');

        const avgDaysRaw = appsInDeptForAvg.length > 0 
            ? appsInDeptForAvg.reduce((acc, curr) => acc + (calculateDaysDiff(curr.receivedDate) || 0), 0) / appsInDeptForAvg.length
            : 0;
        const avgDays = isNaN(avgDaysRaw) ? 0 : avgDaysRaw;
            
        return {
            dept,
            label: dept === 'PTT' ? 'Thủ tục' : dept === 'KT' ? 'Kế toán' : 'PTDA',
            avgDays: Math.round(avgDays) || 0,
            count: appsInDept.length,
            issueExcludedCount: appsInDept.length - appsInDeptForAvg.length,
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
            totalAllVisibleRecords: dashboardApps.length,
            processing: pttProcessing, 
            issues: pttIssues, 
            taxPending: pttTaxPending, 
            slowest: pttSlowest, 
            waitingHandover: pttWaitingHandover 
        },
        kt: {
            total: ktTotal,
            totalAllVisibleRecords: dashboardApps.length,
            received: ktNeedReceive,
            processing: ktProcessing,
            issues: ktIssues,
            taxPending: ktTaxPending
        },
        ptda: {
            received: ptdaReceived,
            totalAllVisibleRecords: dashboardApps.length,
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

  

  const computeChartData = (appsList: Application[]) => {
    const groups: Record<string, Application[]> = {
      '1. ĐANG CHUẨN BỊ': [],
      '2. CHỜ NỘP VPĐK': [],
      '3. ĐÃ NỘP VPĐK': [],
      '4. CHỜ THÔNG BÁO THUẾ': [],
      '5. CHỜ HOÀN THÀNH NVTC': [],
      '6. ĐÃ NỘP THUẾ': [],
      '7. ĐÃ CÓ GCN': [],
      '8. CHỜ BÀN GIAO': [],
      '9. HOÀN TẤT': []
    };

    appsList.forEach(r => {
      const stageName = computeUltimateStatus(r);
      if (groups[stageName]) {
        groups[stageName].push(r);
      } else {
        groups['1. ĐANG CHUẨN BỊ'].push(r);
      }
    });

    const createStageItem = (name: string, list: Application[], color: string, statusId: UnitStatus, isSub: boolean = false) => {
      const errorCount = list.filter(a => {
        return (a.status as string) === 'Error' || a.isRejected || (a.issueType && a.issueType !== 'None');
      }).length;
      return {
        name,
        value: list.length,
        normal: list.length - errorCount,
        error: errorCount,
        labelAnchor: 0.01, // Giá trị ảo cực nhỏ, chỉ dùng để neo LabelList, không ảnh hưởng tỷ lệ trực quan
        color,
        statusId,
        list,
        isSub
      };
    };

    const waitVPDK = groups['2. CHỜ NỘP VPĐK'] || [];
    
    // PTDA only accounts for Quy trình 2 where active department is PTDA
    const waitVPDK_PTDA = waitVPDK.filter(a => getRecordDept(a, stepConfig) === 'PTDA');

    // Kế toán chứa toàn bộ phần còn lại để không bị hụt số liệu
    const waitVPDK_KT = waitVPDK.filter(a => getRecordDept(a, stepConfig) === 'KT');

    const hasQT2 = appsList.some(a => a.workflowType === 'Quy_trinh_2' || (a as any).workflow_type === 'Quy_trinh_2');

    const result = [
      createStageItem('1. ĐANG CHUẨN BỊ', groups['1. ĐANG CHUẨN BỊ'] || [], '#94a3b8', 'Processing'),
      createStageItem('2. CHỜ NỘP VPĐK', waitVPDK, '#f59e0b', 'WaitingVPDK')
    ];

    result.push(createStageItem('   ↳ 2A. HỒ SƠ TẠI KẾ TOÁN', waitVPDK_KT, '#fbbf24', 'WaitingVPDK', true)); // Lighter amber

    if (hasQT2) {
      result.push(createStageItem('   ↳ 2B. HỒ SƠ TẠI PTDA', waitVPDK_PTDA, '#fcd34d', 'WaitingVPDK', true)); // Even lighter amber
    }

    result.push(
      createStageItem('3. ĐÃ NỘP VPĐK', groups['3. ĐÃ NỘP VPĐK'] || [], '#3b82f6', 'Submitted'),
      createStageItem('4. CHỜ THÔNG BÁO THUẾ', groups['4. CHỜ THÔNG BÁO THUẾ'] || [], '#f97316', 'TaxPending'),
      createStageItem('5. CHỜ HOÀN THÀNH NVTC', groups['5. CHỜ HOÀN THÀNH NVTC'] || [], '#8b5cf6', 'TaxPending'),
      createStageItem('6. ĐÃ NỘP THUẾ', groups['6. ĐÃ NỘP THUẾ'] || [], '#10b981', 'TaxCompleted'),
      createStageItem('7. ĐÃ CÓ GCN', groups['7. ĐÃ CÓ GCN'] || [], '#06b6d4', 'GCN_Issued'),
      createStageItem('8. CHỜ BÀN GIAO', groups['8. CHỜ BÀN GIAO'] || [], '#6366f1', 'WaitingHandover'),
      createStageItem('9. HOÀN TẤT', groups['9. HOÀN TẤT'] || [], '#22c55e', 'Completed')
    );

    return result;
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
    return chartData.filter(d => !d.isSub).map(d => {
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
    return chartData.filter(d => !d.isSub).map(d => ({
      name: d.name,
      value: d.value,
      percentage: totalApps > 0 ? Math.round((d.value / totalApps) * 100) : 0,
      color: d.color
    })).filter(d => d.value > 0);
  }, [chartData, dashboardApps]);

  const overallPieTotal = useMemo(() => dashboardApps.length, [dashboardApps]);
  const loanRatioTotal = useMemo(() => roleKpis.loanRatioStats.reduce((acc: number, curr: any) => acc + curr.value, 0), [roleKpis.loanRatioStats]);

  

  return {
    kpis,
    roleKpis,
    stats,
    chartData,
    progressChartData,
    loanPieData,
    overallPieData,
    overallPieTotal,
    loanRatioTotal
  };
}
