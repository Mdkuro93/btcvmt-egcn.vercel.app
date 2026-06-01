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
  selectedFlags?: string[]
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

    return applications.filter(a => {
      if (!a) return false;

      // Extract values with camelCase & snake_case support
      const submissionDate = getVal(a, 'submissionDate', 'submission_date');
      const taxNotificationDate = getVal(a, 'taxNotificationDate', 'tax_notification_date');
      const taxReceiptDate = getVal(a, 'taxReceiptDate', 'tax_receipt_date');
      const currentStep = getVal(a, 'currentStep', 'current_step');
      const accountingHandoverDate = getVal(a, 'accountingHandoverDate', 'accounting_handover_date');

      // Standardize currentStep
      const step = (currentStep || '').toUpperCase();
      const stepType = getStepType(currentStep);

      // ================= 0. FLAG FILTER =================
      if (Array.isArray(selectedFlags) && selectedFlags.length > 0) {
        const itemFlags = Array.isArray(a.flags) ? a.flags : [];
        if (!selectedFlags.every(flag => itemFlags.includes(flag))) return false;
      }

      // ================= 1. SEARCH =================
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
      if (activeStatus && a.status !== activeStatus) return false;

      // ================= 3. LOAN =================
      if (activeLoanStatus && a.loanStatus !== activeLoanStatus) return false;

      // ================= 4. SELF SERVICE =================
      if (filterSelfService !== 'ALL' && filterSelfService !== undefined) {
        const isSelf = filterSelfService === 'YES';
        if (a.isSelfService !== isSelf) return false;
      }

      // ================= 5. ISSUE =================
      const issueType = getVal(a, 'issueType', 'issue_type') || 'None';
      
      if (activeIssue === 'ERROR') {
        const hasIssue =
          a.status === 'Error' ||
          !!a.isRejected ||
          !!a.hasError ||
          !!a.has_error ||
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
        switch (activeDashboardFilter) {
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
            if (!(taxReceiptDate && !a.gcnSignedDate)) return false;
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
  }, [applications, dashboardFilter, search, filterStatus, filterLoanStatus, filterSelfService, filterIssue, filterSLAStatus, selectedFlags]);
}
