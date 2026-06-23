import { STEP_CONFIG } from '../constants';
import { calculateWorkingDays, SLA_CONFIG } from './dateUtils';

const DEFAULT_STEP_CONFIG = STEP_CONFIG;
const DEFAULT_SLA_CONFIG = Object.values(DEFAULT_STEP_CONFIG).reduce((acc: any, s: any) => {
  if (s && s.label) {
    acc[s.label] = s.slaDays || 10;
  }
  return acc;
}, {} as Record<string, number>);

export function calculateDaysDiff(dateStr: string) {
  if (!dateStr) return 0;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 0;
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - date.getTime());
  const res = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return isNaN(res) ? 0 : res;
}

// FIX #1: Đã xóa WeakMap slaCache.
// Lý do: WeakMap bind theo object reference. Khi app object không đổi reference
// (ví dụ Realtime trả cùng data, hoặc code mutate trực tiếp), kết quả SLA cũ
// được giữ lại vĩnh viễn → hồ sơ quá hạn hiển thị "NORMAL" sai.
// calculateSLA là hàm thuần (pure function của dữ liệu), chi phí tính toán nhỏ,
// không cần cache. Nếu cần tối ưu hiệu năng trong tương lai, dùng useMemo ở tầng
// component với dependency rõ ràng thay vì cache tại engine layer.

export function calculateSLA(app: any, stepConfig?: any, slaConfig?: any) {
  if (!app) return { isOverdue: false, daysLate: 0, daysLeft: 0, urgency: 'normal' as const };

  try {
    const currentStep = app.currentStep || app.current_step;
    if (!currentStep) return { isOverdue: false, daysLate: 0, daysLeft: 0, urgency: 'normal' as const };

    const finalStepConfig = stepConfig || (typeof window !== 'undefined' && (window as any).__STEP_CONFIG__) || DEFAULT_STEP_CONFIG;
    const finalSlaConfig = slaConfig || (typeof window !== 'undefined' && (window as any).__SLA_CONFIG__) || DEFAULT_SLA_CONFIG;

    const config = finalStepConfig[currentStep];
    if (!config || !config.label || currentStep === 'Hoan_Tat' || currentStep === 'HOAN_TAT') {
      return { isOverdue: false, daysLate: 0, daysLeft: 0, urgency: 'normal' as const };
    }

    const sla = finalSlaConfig[config.label] || config.slaDays || 10;
    let activeSla = sla;

    let stepStartTime: number = 0;
    const history = app.history || [];

    // Find the latest history entry for the current step config label
    const matchedHistory = history.find((h: any) => h.stepName === config.label);

    // Check if the current step is completed in system logs
    if (matchedHistory && matchedHistory.completedDate) {
      let sTime = 0;
      const idMatch = String(matchedHistory.id).match(/^hist-(\d+)-/);
      if (idMatch) {
        sTime = parseInt(idMatch[1], 10);
      } else if (matchedHistory.receivedDate) {
        sTime = new Date(matchedHistory.receivedDate).getTime();
      }

      if (sTime > 0) {
        const workingDays = calculateWorkingDays(new Date(sTime), new Date(matchedHistory.completedDate));
        if (workingDays > activeSla) {
          const daysLate = parseFloat((workingDays - activeSla).toFixed(1));
          return { isOverdue: true, daysLate, daysLeft: 0, urgency: 'overdue' as const, isStepCompleted: true };
        }
      }
      return { isOverdue: false, daysLate: 0, daysLeft: 0, urgency: 'normal' as const, isStepCompleted: true };
    }

    const isDateValid = (d: any) => d && d !== '---' && d !== 'None' && String(d).trim() !== '';

    // STEP COMPLETION GUARDS: Stop the clock if a destination milestone for the current step is already reached
    const handoverDate = app.ktHandoverToPtdaDate || app.kt_handover_to_ptda_date;
    const gcnReceived = app.gcnReceivedDate || app.gcn_received_date;
    const gcnSigned = app.gcnSignedDate || app.gcn_signed_date;
    const submissionDate = app.submissionDate || app.submission_date;
    const taxNotiDate = app.taxNotificationDate || app.tax_notification_date;
    const taxReceiptDate = app.taxNoticeProvisionDate || app.tax_notice_provision_date || app.taxReceiptDate || app.tax_receipt_date;

    const isKTHandoverStep = currentStep === 'S2_KT_Tiep_Nhan' || currentStep === 'S2_KT_Ban_giao' || currentStep === 'GD2_Cho_Nop_VPDK' || currentStep === 'GD1_Cho_KT_TiepNhan';
    const isSubmissionStep = currentStep === 'S3_Nop_VPDK' || currentStep === 'GD3_Nop_VPDK';
    const isTaxStep = currentStep === 'S5_Tai_Chinh_Khach_Hang' || currentStep === 'GD4_Cho_Nop_NVTC' || currentStep === 'GD4_Cho_KT_TiepNhan_LaySo';
    const isGCNIssuanceStep = currentStep === 'S6_Nhan_So_GCN' || currentStep === 'GD5_Cho_Ky_In_GCN' || currentStep === 'GD5_Cho_GCN' || currentStep === 'GD5_Cho_PTT_TiepNhan_BG';

    // SPECIAL LOGIC FOR STEP 2 (CHỜ NỘP VPĐK) - AS REQUESTED BY USER
    if (isKTHandoverStep) {
      const ktPtdaDate = app.ktHandoverToPtdaDate || app.kt_handover_to_ptda_date;
      activeSla = sla || 3;
      let targetStartDateStr: string | undefined;

      if (isDateValid(ktPtdaDate)) {
        // Giai đoạn 2: Đã bàn giao sang PTDA cho giai đoạn nộp hồ sơ
        targetStartDateStr = ktPtdaDate;
      } else {
        // Giai đoạn 1: Chưa bàn giao, tính theo loại hình sản phẩm
        const propType = app.propertyType || app.property_type;
        const loaiCH = app.productType || app.loaiCanHo || app.product_type;
        const isCanHo = propType === 'Can_Ho' || loaiCH === 'Căn hộ' || loaiCH === 'Can_Ho';

        if (isCanHo) {
          activeSla = 45;
          const handoverAptDate = app.handoverApartmentDate || app.handover_apartment_date;
          if (isDateValid(handoverAptDate)) {
            targetStartDateStr = handoverAptDate;
          } else {
            // Không trễ nếu chưa có ngày nghiệm thu
            return { isOverdue: false, daysLate: 0, daysLeft: 45, urgency: 'normal' as const };
          }
        } else {
          // Đất nền
          activeSla = 25;
          const signingDate = app.contractSigningDate || app.contract_signing_date;
          if (isDateValid(signingDate)) {
            targetStartDateStr = signingDate;
          } else {
            // Không trễ nếu chưa có ngày HĐMB
            return { isOverdue: false, daysLate: 0, daysLeft: 25, urgency: 'normal' as const };
          }
        }
      }

      if (targetStartDateStr) {
        const elapsedDays = calculateWorkingDays(targetStartDateStr, new Date());
        const daysLeft = Math.max(0, parseFloat((activeSla - Math.max(0, elapsedDays)).toFixed(1)));
        
        const urgency: 'overdue' | 'urgent' | 'warning' | 'normal' =
          elapsedDays > activeSla ? 'overdue' :
          daysLeft <= 1 ? 'urgent' :
          daysLeft <= 3 ? 'warning' : 'normal';

        if (elapsedDays > activeSla) {
          const daysLate = parseFloat((elapsedDays - activeSla).toFixed(1));
          return { isOverdue: true, daysLate, label: `Trễ ${config.label}`, daysLeft: 0, urgency: 'overdue' as const };
        }
        return { isOverdue: false, daysLate: 0, daysLeft, urgency };
      }
    }

    if (isSubmissionStep && isDateValid(submissionDate)) return { isOverdue: false, daysLate: 0, daysLeft: 0, urgency: 'normal' as const };
    if (isTaxStep && isDateValid(taxReceiptDate)) return { isOverdue: false, daysLate: 0, daysLeft: 0, urgency: 'normal' as const };
    if (isGCNIssuanceStep && (isDateValid(gcnReceived) || isDateValid(gcnSigned))) return { isOverdue: false, daysLate: 0, daysLeft: 0, urgency: 'normal' as const };

    // Step-specific custom SLA logic (GD1_ChuanBi / S1_ChuanBi)
    const isGD1ChuanBi = currentStep === 'GD1_ChuanBi' || currentStep === 'GĐ1_ChuanBi' || currentStep === 'S1_ChuanBi';
    
    if (isGD1ChuanBi) {
      activeSla = sla;
      let targetStartDateStr: string | undefined;

      const propType = app.propertyType || app.property_type;
      const isCanHo = propType === 'Can_Ho';

      if (isCanHo) {
        activeSla = 45;
        const handoverAptDate = app.handoverApartmentDate || app.handover_apartment_date;
        if (isDateValid(handoverAptDate)) {
          targetStartDateStr = handoverAptDate;
        } else {
          // No handover date -> Do not compute SLA, return normal
          return { isOverdue: false, daysLate: 0, daysLeft: 45, urgency: 'normal' as const };
        }
      } else {
        // Dat_Nen
        activeSla = 25;
        const signingDate = app.contract_signing_date || app.contractSigningDate;
        const rDate = app.receivedDate || app.received_date;
        if (isDateValid(signingDate)) {
          targetStartDateStr = signingDate;
        } else if (isDateValid(rDate)) {
          targetStartDateStr = rDate;
        } else {
          // No signing/received date -> Do not compute SLA, return normal
          return { isOverdue: false, daysLate: 0, daysLeft: 25, urgency: 'normal' as const };
        }
      }

      if (targetStartDateStr) {
        // Early exit for completion milestones: If user provided a completion date for current step, stop the clock.
        const isS6NhanSo = app.currentStep === 'S6_Nhan_So_GCN' || app.currentStep === 'GD5_Cho_GCN' || app.currentStep === 'GD5_Cho_PTT_TiepNhan_BG';
        if (isS6NhanSo) {
          if (isDateValid(app.gcnReceivedDate) || isDateValid(app.gcnSignedDate)) {
             return { isOverdue: false, daysLate: 0, urgency: 'normal' as const };
          }
        }

        stepStartTime = new Date(targetStartDateStr).getTime();

        const elapsedDays = calculateWorkingDays(targetStartDateStr, new Date());
        const daysLeft = Math.max(0, parseFloat((activeSla - Math.max(0, elapsedDays)).toFixed(1)));
        
        const urgency: 'overdue' | 'urgent' | 'warning' | 'normal' =
          elapsedDays > activeSla ? 'overdue' :
          daysLeft <= 1 ? 'urgent' :
          daysLeft <= 3 ? 'warning' : 'normal';

        if (elapsedDays > activeSla) {
          const daysLate = parseFloat((elapsedDays - activeSla).toFixed(1));
          return { isOverdue: true, daysLate, label: `Trễ ${config.label}`, daysLeft: 0, urgency: 'overdue' as const };
        }

        return { isOverdue: false, daysLate: 0, daysLeft, urgency };
      }
    }

    if (matchedHistory) {
      // Attempt to extract the absolute precise timestamp from record log ID to support minute-precise calculations
      const idMatch = String(matchedHistory.id).match(/^hist-(\d+)-/);
      if (idMatch) {
        stepStartTime = parseInt(idMatch[1], 10);
      } else if (matchedHistory.receivedDate) {
        // Fallback to received date string
        stepStartTime = new Date(matchedHistory.receivedDate).getTime();
      }
    }

    // Custom SLA logic for S3_Nop_VPDK in Quy trình 2 (always prioritize ktHandoverToPtdaDate if provided)
    if (currentStep === 'S3_Nop_VPDK' && (app.workflowType === 'Quy_trinh_2' || app.workflow_type === 'Quy_trinh_2')) {
      const ktPtdaDate = app.ktHandoverToPtdaDate || app.kt_handover_to_ptda_date;
      if (isDateValid(ktPtdaDate)) {
        stepStartTime = new Date(ktPtdaDate).getTime();
      }
    }

    // Fallback date-mapping logic if no specific entry is found in history (e.g. legacy/imported records)
    if (!stepStartTime) {
      const mapping: Record<string, string> = {
        // Workflow 2
        S1_ChuanBi: 'contract_signing_date',
        S2_KT_Tiep_Nhan: 'accounting_handover_date',
        S2_KT_Ban_giao: 'accounting_handover_date',
        S3_Nop_VPDK: (app.workflowType === 'Quy_trinh_2' || app.workflow_type === 'Quy_trinh_2') ? 'kt_handover_to_ptda_date' : 'accounting_handover_date',
        S5_Tai_Chinh_Khach_Hang: 'tax_notification_date',
        S5_1_PTDA_TiepNhan: 'tax_receipt_date',
        S6_Nhan_So_GCN: (app.gcnReceivedDate || app.gcn_received_date) ? 'gcn_received_date' : ((app.gcnSignedDate || app.gcn_signed_date) ? 'gcn_signed_date' : 'tax_receipt_date'),
        S7_PTDA_Ban_Giao: 'gcn_received_date',
        S7_1_PTT_Tiep_Nhan: 'gcn_received_date',
        S7_2_Ban_Giao_Khach: 'customer_handover_date',

        // Workflow 1
        GD1_ChuanBi: 'contract_signing_date',
        GD1_Cho_KT_TiepNhan: 'accounting_handover_date',
        GD2_Cho_Nop_VPDK: 'accounting_handover_date',
        GD3_Nop_VPDK: 'submission_date',
        GD4_Cho_Nop_NVTC: 'submission_date',
        GD4_Cho_KT_TiepNhan_LaySo: 'tax_notification_date',
        GD5_Cho_Ky_In_GCN: 'tax_receipt_date',
        GD5_Cho_GCN: (app.gcnSignedDate || app.gcn_signed_date) ? 'gcn_signed_date' : 'tax_receipt_date',
        GD5_Cho_PTT_TiepNhan_BG: (app.gcnReceivedDate || app.gcn_received_date) ? 'gcn_received_date' : 'gcn_signed_date',
        GD6_Cho_BG_Khach: 'ptda_handover_date',
        Hoan_Tat: 'customer_handover_date'
      };

      const milestoneOrder = [
        'contract_signing_date',
        'received_date',
        'accounting_handover_date',
        'kt_handover_to_ptda_date',
        'submission_date',
        'tax_notification_date',
        'tax_receipt_date',
        'gcn_signed_date',
        'gcn_received_date',
        'ptda_handover_date',
        'customer_handover_date'
      ];

      const fieldKey = mapping[currentStep] || 'received_date';
      
      // FIX: Improved Waterfall Logic
      // If we are past Step 1 but have no milestone date, DO NOT jump back to received_date.
      // This jump is what causes the "415 days late" error.
      let comparisonDate: string | undefined;
      const startIdx = milestoneOrder.indexOf(fieldKey);
      
      if (startIdx !== -1) {
        // Search backwards from the current step's milestone
        for (let i = startIdx; i >= 0; i--) {
          const k = milestoneOrder[i];
          const camelK = k.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
          const val = (app[k] || app[camelK]) as string | undefined;
          if (isDateValid(val)) {
            comparisonDate = val;
            break;
          } else {
            if (i > 0 && i < startIdx) {
              activeSla += SLA_CONFIG.MAC_DINH_BUOC;
            }
          }
        }
      }

      // Final Guard: If Step is > Step 1, and we only found contract_signing_date or received_date, 
      // but the step requires a later milestone that is missing, treat as normal (not overdue).
      const isEarlyMilestone = 
        comparisonDate === (app.contractSigningDate || app.contract_signing_date) ||
        comparisonDate === (app.receivedDate || app.received_date);
      if (isEarlyMilestone && startIdx >= 1) {
        return { isOverdue: false, daysLate: 0, daysLeft: activeSla, urgency: 'normal' as const };
      }

      // If still no date found, use received_date as last resort
      if (!comparisonDate) {
        comparisonDate = app.received_date || app.receivedDate;
      }

      if (comparisonDate) {
        stepStartTime = new Date(comparisonDate).getTime();
      } else {
        const createdTime = app.createdAt || app.created_at;
        if (createdTime) {
          stepStartTime = new Date(createdTime).getTime();
        } else {
          stepStartTime = new Date().getTime();
        }
      }
    }

    // Minute-precise duration elapsed
    const elapsedDays = calculateWorkingDays(new Date(stepStartTime), new Date());

    const daysLeft = Math.max(0, parseFloat((activeSla - Math.max(0, elapsedDays)).toFixed(1)));
    const urgency: 'overdue' | 'urgent' | 'warning' | 'normal' =
      elapsedDays > activeSla ? 'overdue' :
      daysLeft <= 1 ? 'urgent' :
      daysLeft <= 3 ? 'warning' : 'normal';

    if (elapsedDays > activeSla) {
      // Calculate float days late precisely
      const daysLate = parseFloat((elapsedDays - activeSla).toFixed(1));
      return { isOverdue: true, daysLate, label: `Trễ ${config.label}`, daysLeft: 0, urgency: 'overdue' as const };
    }

    return { isOverdue: false, daysLate: 0, daysLeft, urgency };
  } catch (error) {
    return { isOverdue: false, daysLate: 0, daysLeft: 0, urgency: 'normal' as const };
  }
}

export function getSLAStatus(app: any, stepConfig?: any, slaConfig?: any): 'OVERDUE' | 'NORMAL' {
  const result = calculateSLA(app, stepConfig, slaConfig);
  return result.isOverdue ? 'OVERDUE' : 'NORMAL';
}

export function getFinalStatus(app: any) {
  if (app.customerHandoverDate || app.customer_handover_date) return 'Completed';

  // Check milestone dates in reverse order of the workflow to find the most advanced stage
  if (app.gcnReceivedDate || app.gcn_received_date) return 'WaitingHandover';
  if (app.gcnSignedDate || app.gcn_signed_date) return 'GCN_Issued';
  if (app.taxReceiptDate || app.tax_receipt_date) return 'TaxPaid';
  if (app.submissionDate || app.submission_date) return 'Submitted';
  if (app.accountingHandoverDate || app.accounting_handover_date || app.contractSigningDate || app.contract_signing_date) return 'WaitingVPDK';

  if (app.status === 'WAITING_HANDOVER' || app.current_step === 'CHỜ BÀN GIAO' || app.status === 'CHỜ BÀN GIAO' || app.currentStep === 'CHỜ BÀN GIAO') return 'WaitingHandover';
  if (app.status === 'AWAITING_FINANCE' || app.current_step === 'CHỜ HOÀN THÀNH NVTC' || app.status === 'CHỜ HOÀN THÀNH NVTC' || app.currentStep === 'CHỜ HOÀN THÀNH NVTC') return 'TaxPending';

  return 'Processing';
}

export function isOverdue(app: any, stepConfig?: any, slaConfig?: any): boolean {
  return calculateSLA(app, stepConfig, slaConfig).isOverdue;
}

export const computeUltimateStatus = (app: any): string => {
  const isV = (val: any) => val && val !== '---' && val !== 'None' && String(val).trim() !== '';

  if (isV(app.customerHandoverDate) || app.status === 'Completed' || app.currentStep === 'Hoan_Tat') return '9. HOÀN TẤT';
  if (isV(app.gcnReceivedDate) || isV(app.ptdaHandoverDate)) return '8. CHỜ BÀN GIAO';
  if (isV(app.gcnSignedDate)) return '7. ĐÃ CÓ GCN';
  if (isV(app.taxReceiptDate)) return '6. ĐÃ NỘP THUẾ';
  if (isV(app.taxNotificationDate) || isV(app.taxNotificationReceivedDate)) return '5. CHỜ HOÀN THÀNH NVTC';
  if (isV(app.submissionDate)) return '3. ĐÃ NỘP VPĐK';
  if (isV(app.ktHandoverToPtdaDate) || isV(app.accountingHandoverDate) || app.status === 'WaitingVPDK') return '2. CHỜ NỘP VPĐK';

  return '1. ĐANG CHUẨN BỊ';
};