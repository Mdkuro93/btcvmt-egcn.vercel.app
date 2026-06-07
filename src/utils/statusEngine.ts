import { STEP_CONFIG } from '../constants';

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
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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

    let stepStartTime: number = 0;
    const history = app.history || [];

    // Find the latest history entry for the current step config label
    const matchedHistory = history.find((h: any) => h.stepName === config.label);

    // Check if the current step is completed in system logs
    if (matchedHistory && matchedHistory.completedDate) {
      // Step already completed: hide active warning from UI immediately
      return { isOverdue: false, daysLate: 0, daysLeft: 0, urgency: 'normal' as const };
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

    // Fallback date-mapping logic if no specific entry is found in history (e.g. legacy/imported records)
    if (!stepStartTime) {
      const mapping: Record<string, string> = {
        // Workflow 2
        S1_ChuanBi: 'contractSigningDate',
        S2_KT_Tiep_Nhan: 'receivedDate',
        S2_KT_Ban_giao: 'receivedDate',
        S3_Nop_VPDK: 'accountingHandoverDate',
        S5_Tai_Chinh_Khach_Hang: 'taxNotificationDate',
        S5_1_PTDA_TiepNhan: 'taxReceiptDate',
        S6_Nhan_So_GCN: 'taxReceiptDate',
        S7_PTDA_Ban_Giao: 'gcnReceivedDate',
        S7_1_PTT_Tiep_Nhan: 'gcnReceivedDate',
        S7_2_Ban_Giao_Khach: 'customerHandoverDate',

        // Workflow 1
        GD1_ChuanBi: 'contractSigningDate',
        GD1_Cho_KT_TiepNhan: 'contractSigningDate',
        GD2_Cho_Nop_VPDK: 'accountingHandoverDate',
        GD3_Nop_VPDK: 'accountingHandoverDate',
        GD4_Cho_Nop_NVTC: 'submissionDate',
        GD4_Cho_KT_TiepNhan_LaySo: 'taxNotificationDate',
        GD5_Cho_Ky_In_GCN: 'taxReceiptDate',
        GD5_Cho_GCN: 'gcnSignedDate',
        GD5_Cho_PTT_TiepNhan_BG: 'gcnReceivedDate',
        GD6_Cho_BG_Khach: 'ptdaHandoverDate',
        Hoan_Tat: 'customerHandoverDate'
      };

      const milestoneOrder = [
        'receivedDate',
        'accountingHandoverDate',
        'submissionDate',
        'taxNotificationDate',
        'taxReceiptDate',
        'gcnSignedDate',
        'gcnReceivedDate',
        'ptdaHandoverDate',
        'customerHandoverDate'
      ];

      const fieldKey = mapping[currentStep] || 'receivedDate';
      
      // FIX #2: Smart Waterfall Fallback
      // Thay vì nhảy thẳng về receivedDate nếu fieldKey trống, ta sẽ rà ngược danh sách
      // milestone để tìm mốc thời gian gần nhất đã được ghi nhận.
      let comparisonDate: string | undefined;
      const startIdx = milestoneOrder.indexOf(fieldKey);
      
      if (startIdx !== -1) {
        // Rà ngược từ mốc của step hiện tại về đầu
        for (let i = startIdx; i >= 0; i--) {
          const k = milestoneOrder[i];
          const snakeK = k.replace(/([A-Z])/g, "_$1").toLowerCase();
          const val = (app[k] || app[snakeK]) as string | undefined;
          if (val && val !== '---' && val !== 'None' && String(val).trim() !== '') {
            comparisonDate = val;
            break;
          }
        }
      }

      // Nếu vẫn không tìm thấy mốc nào trong sequence, dùng fallback cuối cùng
      if (!comparisonDate) {
        comparisonDate = (app.receivedDate || app.received_date) as string | undefined;
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

    const now = new Date().getTime();
    // Minute-precise duration elapsed
    const elapsedDays = Math.max(0, now - stepStartTime) / (1000 * 60 * 60 * 24);

    const daysLeft = Math.max(0, parseFloat((sla - elapsedDays).toFixed(1)));
    const urgency: 'overdue' | 'urgent' | 'warning' | 'normal' =
      elapsedDays > sla ? 'overdue' :
      daysLeft <= 1 ? 'urgent' :
      daysLeft <= 3 ? 'warning' : 'normal';

    if (elapsedDays > sla) {
      // Calculate float days late precisely
      const daysLate = parseFloat((elapsedDays - sla).toFixed(1));
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