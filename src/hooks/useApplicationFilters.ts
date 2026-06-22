import { useMemo } from 'react';
import { isOverdue, getSLAStatus } from '../utils/statusEngine';
import { Application } from '../types';

const getVal = <K extends keyof Application>(
  obj: Application,
  camel: K,
  snake: string
): any => {
  // Sử dụng 'as unknown as Record<string, any>' vì một số thuộc tính của đối tượng Application 
  // có thể tồn tại ở định dạng snake_case khi được tải về từ Supabase, trong khi kiểu dữ liệu 
  // của Application trong TypeScript định nghĩa theo định dạng camelCase.
  const appMap = obj as unknown as Record<string, any>;
  return appMap[camel as string] ?? appMap[snake] ?? null;
};

const getStepType = (step: string) => {
  const s = (step || '').toUpperCase();

  if (s.includes('KT')) return 'KT';
  if (s.includes('PTT')) return 'PTT';
  if (s.includes('PTDA')) return 'PTDA';
  if (s.includes('VPDK')) return 'VPDK';
  if (s.includes('TBTHUE')) return 'TAX_NOTICE';
  if (s.includes('NVTC')) return 'TAX_COMPLETE';
  if (s.includes('GCN')) return 'GCN';
  if (s.includes('BAN_GIAO') || s.includes('BANGIAO')) return 'HANDOVER';

  return 'UNKNOWN';
};

function diffDays(date: string) {
  if (!date) return 0;
  const now = new Date();
  const d = new Date(date);
  
  const utcNow = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const utcTarget = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  
  return Math.floor((utcNow - utcTarget) / (1000 * 60 * 60 * 24));
}

// Helper to get raw stage name matching computeChartData in App.tsx
// Declared at module level to prevent recreating function instances and optimize performance.
export const getComputedStageName = (r: any): string => {
  const today = new Date();
  const submissionSLA = 7;

  const checkNotEmpty = (val: any) => {
    return val && val !== '---' && val !== 'None' && String(val).trim() !== '';
  };

  if (r.isSelfService) {
    const hasHandover = checkNotEmpty(r.customerHandoverDate);
    const hasGcn = checkNotEmpty(r.gcnReceivedDate);

    if (r.status === 'Completed' || r.currentStep === 'Hoan_Tat' || hasHandover) {
      return '9. HOÀN TẤT';
    }
    else if (hasGcn) {
      return '8. CHỜ BÀN GIAO';
    }
    else {
      return '1. ĐANG CHUẨN BỊ';
    }
  }

  // Priority 1: Completed
  if (r.status === 'Completed' || r.currentStep === 'Hoan_Tat') {
    return '9. HOÀN TẤT';
  }
  // Priority 2: WaitingHandover
  else if (r.status === 'WaitingHandover' || [
    'S7_PTDA_Ban_Giao', 'S7_1_PTT_Tiep_Nhan', 
    'S7_2_Ban_Giao_Khach', 'GD5_Cho_PTT_TiepNhan_BG', 
    'GD6_Cho_BG_Khach'
  ].includes(r.currentStep)) {
    return '8. CHỜ BÀN GIAO';
  }
  // Priority 3: GCN_Issued
  else if (r.status === 'GCN_Issued' || [
    'S6_Nhan_So_GCN', 'GD5_Cho_Ky_In_GCN', 'GD5_Cho_GCN'
  ].includes(r.currentStep)) {
    return '7. ĐÃ CÓ GCN';
  }
  // Priority 4: TaxCompleted / TaxPaid
  else if ((r.status === 'TaxPaid' || r.status === 'TaxCompleted' ||
           r.currentStep === 'S5_1_PTDA_TiepNhan') && !r.isRejected) {
    return '6. ĐÃ NỘP THUẾ';
  }
  // Priority 5: AWAITING_FINANCE (CHỜ HOÀN THÀNH NVTC)
  else if ((r.taxNotificationDate || r.taxNotificationReceivedDate) && !r.isRejected) {
    return '5. CHỜ HOÀN THÀNH NVTC';
  }
  else if ([
    'S5_Tai_Chinh_Khach_Hang', 'GD4_Cho_Nop_NVTC', 
    'GD4_Cho_KT_TiepNhan_LaySo'
  ].includes(r.currentStep)) {
    return '5. CHỜ HOÀN THÀNH NVTC';
  }
  // Priority 6: SUBMITTED / TAX_WARNING (phân loại theo SLA)
  else if ((r.status === 'Submitted' || r.status === 'TaxPending' || r.submissionDate) && !r.isRejected) {
    if (r.submissionDate && !r.taxNotificationDate && !r.taxNotificationReceivedDate) {
      const daysDiff = (today.getTime() - new Date(r.submissionDate).getTime()) / (1000*60*60*24);
      if (daysDiff > submissionSLA) {
        return '4. CHỜ THÔNG BÁO THUẾ';
      } else {
        return '3. ĐÃ NỘP VPĐK';
      }
    } else if (r.taxNotificationDate || r.taxNotificationReceivedDate) {
      return '5. CHỜ HOÀN THÀNH NVTC';
    } else {
      return '3. ĐÃ NỘP VPĐK';
    }
  }
  // Priority 7: AWAITING_SUBMISSION (CHỜ NỘP VPĐK / CHỜ KT TIẾP NHẬN)
  else if (
    r.status === 'WaitingVPDK' ||
    r.currentStep === 'GD2_Cho_Nop_VPDK' ||
    r.currentStep === 'S2_KT_Ban_giao' ||
    r.currentStep === 'S2_KT_Tiep_Nhan' ||
    r.currentStep === 'GD1_Cho_KT_TiepNhan' ||
    (r.accountingHandoverDate && !r.submissionDate && !r.isRejected)
  ) {
    return '2. CHỜ NỘP VPĐK';
  }
  // Default: PREPARING
  else {
    return '1. ĐANG CHUẨN BỊ';
  }
};

export function useApplicationFilters(
  applications: Application[],
  dashboardFilter: string | null,
  search?: string,
  filterStatus?: string,
  filterLoanStatus?: string,
  filterSelfService?: string,
  filterIssue?: string,
  userDept?: string,
  filterSLAStatus?: string,
  filterDept?: string, // Added
  stepConfig?: any // Added
) {
  return useMemo(() => {
    if (!Array.isArray(applications)) {
      return [];
    }

    const normalizedSearch = search ? search.trim().toLowerCase() : '';
    const activeDashboardFilter = dashboardFilter && dashboardFilter !== 'ALL' ? dashboardFilter.trim() : null;
    const activeStatus = filterStatus && filterStatus !== 'ALL' ? filterStatus.trim() : null;
    const activeLoanStatus = filterLoanStatus && filterLoanStatus !== 'ALL' ? filterLoanStatus.trim() : null;
    const activeSLAStatus = filterSLAStatus && filterSLAStatus !== 'ALL' ? filterSLAStatus.trim() : null;
    const activeIssue = filterIssue && filterIssue !== 'ALL' ? filterIssue.trim() : null;
    const activeDept = filterDept && filterDept !== 'ALL' ? filterDept : null;

    return applications.filter(a => {
      if (!a) return false;

      // Extract values
      const submissionDate = a.submissionDate;
      const taxNotificationDate = a.taxNotificationDate;
      const taxReceiptDate = a.taxReceiptDate;
      const currentStep = a.currentStep;
      const accountingHandoverDate = a.accountingHandoverDate;

      // Standardize currentStep
      const step = (currentStep || '').toUpperCase();
      const stepType = getStepType(currentStep);

      // ================= 1. DEPT FILTER (NEW) =================
      if (activeDept) {
        const isSupportSpecial = (a.projectName?.includes('hỗ trợ') || a.workflowType === 'Quy_trinh_1') && (a.currentStep === 'GD2_Cho_Nop_VPDK' || a.currentStep === 'S3_Nop_VPDK');
        const config = (stepConfig || {})[a.currentStep];
        const dept = isSupportSpecial ? 'KT' : (config?.dept || '---');
        if (dept !== activeDept) return false;
      }

      // ================= 2. SEARCH =================
      if (normalizedSearch) {
        const unit = (a.unitCode || '').toLowerCase();
        const name = (a.customerName || '').toLowerCase();
        const phone = (a.phoneNumber || '').toLowerCase();
        const project = (a.projectName || '').toLowerCase();

        if (
          !unit.includes(normalizedSearch) &&
          !name.includes(normalizedSearch) &&
          !phone.includes(normalizedSearch) &&
          !project.includes(normalizedSearch)
        ) {
          return false;
        }
      }

      // ================= 2. STATUS FILTER =================
      if (activeStatus) {
        const computedStage = getComputedStageName(a);
        if (activeStatus === 'Processing' && computedStage !== '1. ĐANG CHUẨN BỊ') return false;
        if (activeStatus === 'WaitingVPDK' && computedStage !== '2. CHỜ NỘP VPĐK') return false;
        if (activeStatus === 'TaxNoticePending' && computedStage !== '4. CHỜ THÔNG BÁO THUẾ') return false;
        if (activeStatus === 'TaxPending' && computedStage !== '5. CHỜ HOÀN THÀNH NVTC') return false;
        if (activeStatus === 'WaitingHandover' && computedStage !== '8. CHỜ BÀN GIAO') return false;
        if (activeStatus === 'TaxPaid' && computedStage !== '6. ĐÃ NỘP THUẾ') return false;
        if (activeStatus === 'Submitted' && computedStage !== '3. ĐÃ NỘP VPĐK') return false;
        if (activeStatus === 'Completed' && computedStage !== '9. HOÀN TẤT') return false;
        if (!['Processing', 'WaitingVPDK', 'TaxPending', 'TaxNoticePending', 'WaitingHandover', 'TaxPaid', 'Submitted', 'Completed'].includes(activeStatus) && a.status !== activeStatus) return false;
      }

      // ================= 3. LOAN =================
      if (activeLoanStatus && a.loanStatus !== activeLoanStatus) return false;

      // ================= 4. SELF SERVICE =================
      if (filterSelfService !== 'ALL' && filterSelfService !== undefined) {
        const isSelf = filterSelfService === 'YES';
        if (a.isSelfService !== isSelf) return false;
      }

      // ================= 5. ISSUE =================
      const issueType = a.issueType || 'None';
      
      if (activeIssue === 'ERROR') {
        const hasIssue =
          a.status === 'Error' ||
          !!a.isRejected ||
          !!a.hasError ||
          (Array.isArray(a.errors) && a.errors.length > 0) ||
          (issueType !== 'None');

        if (!hasIssue) return false;
      }

      // ================= 6. SLA =================
      if (activeSLAStatus === 'OVERDUE') {
        let isOverdue = false;
        if (a._sla) {
          isOverdue = a._sla.isOverdue;
        } else {
          try {
            isOverdue = getSLAStatus(a) === 'OVERDUE';
          } catch (e) {
            console.error("SLA ERROR:", e);
          }
        }
        if (!isOverdue) return false;
      }

      // ================= 7. DASHBOARD FILTER (ROLE BASED) =================
      if (activeDashboardFilter) {
        const computedStage = getComputedStageName(a);

        switch (activeDashboardFilter) {
          // ===== DASHBOARD TIMELINE STAGES FILTER =====
          case '1. ĐANG CHUẨN BỊ':
          case '2. CHỜ NỘP VPĐK':
          case '3. ĐÃ NỘP VPĐK':
          case '4. CHỜ THÔNG BÁO THUẾ':
          case '5. CHỜ HOÀN THÀNH NVTC':
          case '6. ĐÃ NỘP THUẾ':
          case '7. ĐÃ CÓ GCN':
          case '8. CHỜ BÀN GIAO':
          case '9. HOÀN TẤT':
            if (computedStage !== activeDashboardFilter) return false;
            break;

          // ===== KTT =====
          case 'KT_NEED_RECEIVE':
            if (!(['GD1_Cho_KT_TiepNhan', 'S2_KT_Tiep_Nhan', 'GD2_Cho_Nop_VPDK', 'S3_Nop_VPDK'].includes(a.currentStep))) return false;
            break;

          case 'KT_PROCESSING':
            if (!(['GD1_Cho_KT_TiepNhan', 'S2_KT_Tiep_Nhan', 'GD2_Cho_Nop_VPDK', 'S3_Nop_VPDK', 'GD4_Cho_KT_TiepNhan_LaySo', 'GD5_Cho_GCN'].includes(a.currentStep))) return false;
            break;

          case 'KT_TAX_PENDING_COMPLETE':
            if (!(taxNotificationDate && !taxReceiptDate)) return false;
            break;

          // ===== PTT =====
          case 'PTT_PROCESSING':
            if (!(['S1_ChuanBi', 'GD1_ChuanBi', 'GD1_Cho_KT_TiepNhan', 'S2_KT_Tiep_Nhan'].includes(a.currentStep))) return false;
            break;

          case 'PTT_TAX_PENDING_COMPLETE':
            if (!(taxNotificationDate && !taxReceiptDate)) return false;
            break;

          case 'PTT_WAITING_HANDOVER':
            if (a.status !== 'WaitingHandover') return false;
            break;

          // ===== PTDA =====
          case 'PTDA_NEED_RECEIVE':
            if (!(['S2_KT_Ban_giao', 'S5_1_PTDA_TiepNhan', 'GD2_Cho_Nop_VPDK', 'S3_Nop_VPDK'].includes(a.currentStep))) return false;
            break;

          case 'PTDA_WAIT_TAX_NOTICE':
            if (!(stepType === 'VPDK' && !taxNotificationDate)) return false;
            break;

          case 'SUBMITTED_RECENT':
            if (!(submissionDate && !taxNotificationDate && diffDays(submissionDate) <= 7)) return false;
            break;

          case 'WAIT_TAX_NOTICE_OVERDUE':
            if (!(submissionDate && !taxNotificationDate && diffDays(submissionDate) > 7)) return false;
            break;

          case 'PTDA_TAX_PENDING_COMPLETE':
            if (!(taxNotificationDate && !taxReceiptDate)) return false;
            break;

          case 'PTDA_WAIT_GCN_SIGN':
            if (a.status !== 'WaitingHandover' && a.currentStep !== 'GD5_Cho_PTT_TiepNhan_BG') return false;
            break;

          // ===== GLOBAL =====
          case 'PROCESSING_TOTAL':
            if (a.status === 'Completed') return false;
            break;

          case 'OVERDUE': {
            let isOverdue = false;
            if (a._sla) {
              isOverdue = a._sla.isOverdue;
            } else {
              try {
                isOverdue = getSLAStatus(a) === 'OVERDUE';
              } catch (e) {
                console.error("SLA ERROR:", e);
              }
            }
            if (!isOverdue) return false;
            break;
          }

          case 'ERROR':
            if (!(issueType !== 'None' || a.isRejected || a.status === 'Error')) return false;
            break;

          case 'LOAN':
            if (a.loanStatus !== 'Co_Vay') return false;
            break;

          case 'SELF_SERVICE':
            if (!a.isSelfService) return false;
            break;

          default:
            break;
        }
      }

      return true;
    });
  }, [applications, dashboardFilter, search, filterStatus, filterLoanStatus, filterSelfService, filterIssue, filterSLAStatus, filterDept, stepConfig]);
}
