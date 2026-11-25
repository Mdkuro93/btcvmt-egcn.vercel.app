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

export interface SLAResult {
  isOverdue: boolean;
  daysLate: number;
  daysLeft: number;
  urgency: 'overdue' | 'urgent' | 'warning' | 'normal';
  label?: string;
  isStepCompleted?: boolean;
  status?: string;
  isPaused?: boolean;
  pauseDays?: number;
  currentTurnDays?: number;
  cumulativeStepDays?: number;
  slaAnchorDate?: string;
  slaAnchorSource?: 'STEP_ENTRY_DATE' | 'HISTORY' | 'MILESTONE' | 'PAUSED' | 'COMPLETED';
}

const isDateValid = (d: any) => d && d !== '---' && d !== 'None' && String(d).trim() !== '';

const toYmd = (d: any): string | undefined => {
  if (!isDateValid(d)) return undefined;
  const s = String(d).trim();
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
  return s.split('T')[0].split(' ')[0];
};

const normalizeStepString = (s: string) =>
  s
    ? s
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, '')
    : '';

function getHistoryTimestamp(h: any): number {
  if (!h) return 0;
  const idMatch = String(h.id || '').match(/^hist-(\d+)-/);
  if (idMatch) return parseInt(idMatch[1], 10);
  const rDate = h.receivedDate || h.received_date;
  if (isDateValid(rDate)) {
    const t = new Date(rDate).getTime();
    if (!isNaN(t)) return t;
  }
  return 0;
}

function getPauseMetadata(app: any, now: Date) {
  const isRejectedFlag = Boolean(app.isRejected || app.is_rejected);
  const isErrorStatus = app.status === 'Error';
  const isPaused = isRejectedFlag || isErrorStatus;

  const issueCreatedAt = app.issueCreatedAt || app.issue_created_at;
  const issueResolvedAt = app.issueResolvedAt || app.issue_resolved_at;
  const stepEntryDate = app.stepEntryDate || app.step_entry_date;
  const updatedAt = app.updatedAt || app.updated_at || app.createdAt || app.created_at;

  let pauseDays = 0;
  if (isPaused) {
    const pauseAnchor = isDateValid(issueCreatedAt)
      ? issueCreatedAt
      : isDateValid(stepEntryDate)
        ? stepEntryDate
        : updatedAt;
    if (isDateValid(pauseAnchor)) {
      pauseDays = Math.max(0, calculateWorkingDays(pauseAnchor, now));
    }
  } else if (isDateValid(issueCreatedAt) && isDateValid(issueResolvedAt)) {
    const cTs = new Date(issueCreatedAt).getTime();
    const rTs = new Date(issueResolvedAt).getTime();
    if (!isNaN(cTs) && !isNaN(rTs) && rTs >= cTs) {
      pauseDays = Math.max(0, calculateWorkingDays(issueCreatedAt, issueResolvedAt));
    }
  }

  return { isPaused, pauseDays };
}

function computeCumulativeStepDays(app: any, currentStep: string, history: any[], stepLabel: string, now: Date): number {
  // Ưu tiên mốc nghiệp vụ gốc của bước để tham khảo tổng ngày tích lũy trên toàn bước
  const isKTHandoverStep =
    currentStep === 'S2_KT_Tiep_Nhan' ||
    currentStep === 'S2_KT_Ban_giao' ||
    currentStep === 'GD2_Cho_Nop_VPDK' ||
    currentStep === 'GD1_Cho_KT_TiepNhan';
  const isGD1ChuanBi = currentStep === 'GD1_ChuanBi' || currentStep === 'GĐ1_ChuanBi' || currentStep === 'S1_ChuanBi';

  const propType = app.propertyType || app.property_type;
  const loaiCH = app.productType || app.loaiCanHo || app.product_type;
  const isCanHo = propType === 'Can_Ho' || loaiCH === 'Căn hộ' || loaiCH === 'Can_Ho';

  let anchor: any = null;
  if (isKTHandoverStep) {
    anchor =
      app.ktHandoverToPtdaDate ||
      app.kt_handover_to_ptda_date ||
      app.accountingHandoverDate ||
      app.accounting_handover_date ||
      (isCanHo ? app.handoverApartmentDate || app.handover_apartment_date : app.contractSigningDate || app.contract_signing_date);
  } else if (isGD1ChuanBi) {
    anchor = isCanHo
      ? app.handoverApartmentDate || app.handover_apartment_date || app.receivedDate || app.received_date
      : app.contractSigningDate || app.contract_signing_date || app.receivedDate || app.received_date;
  } else {
    const normTarget = normalizeStepString(stepLabel);
    let earliestHistTs = Infinity;
    for (const h of history) {
      const match =
        h.stepKey === currentStep ||
        h.currentStep === currentStep ||
        normalizeStepString(h.stepName || h.step_name || '') === normTarget;
      if (match) {
        const ts = getHistoryTimestamp(h);
        if (ts > 0 && ts < earliestHistTs) earliestHistTs = ts;
      }
    }
    if (earliestHistTs < Infinity) {
      anchor = new Date(earliestHistTs);
    } else {
      anchor =
        app.gcnReceivedDate ||
        app.gcn_received_date ||
        app.gcnSignedDate ||
        app.gcn_signed_date ||
        app.taxReceiptDate ||
        app.tax_receipt_date ||
        app.taxNotificationDate ||
        app.tax_notification_date ||
        app.submissionDate ||
        app.submission_date ||
        app.ktHandoverToPtdaDate ||
        app.kt_handover_to_ptda_date ||
        app.accountingHandoverDate ||
        app.accounting_handover_date ||
        app.receivedDate ||
        app.received_date ||
        app.createdAt ||
        app.created_at;
    }
  }

  if (isDateValid(anchor)) {
    return Math.max(0, calculateWorkingDays(anchor, now));
  }
  const stepEntryDate = app.stepEntryDate || app.step_entry_date;
  return isDateValid(stepEntryDate) ? Math.max(0, calculateWorkingDays(stepEntryDate, now)) : 0;
}

export function calculateSLA(app: any, stepConfig?: any, slaConfig?: any): SLAResult {
  if (!app) return { isOverdue: false, daysLate: 0, daysLeft: 0, urgency: 'normal' as const };

  try {
    const now = new Date();
    const currentStep = app.currentStep || app.current_step;
    if (!currentStep) return { isOverdue: false, daysLate: 0, daysLeft: 0, urgency: 'normal' as const };

    const finalStepConfig = stepConfig || (typeof window !== 'undefined' && (window as any).__STEP_CONFIG__) || DEFAULT_STEP_CONFIG;
    const finalSlaConfig = slaConfig || (typeof window !== 'undefined' && (window as any).__SLA_CONFIG__) || DEFAULT_SLA_CONFIG;

    const config = finalStepConfig[currentStep];
    const { isPaused, pauseDays } = getPauseMetadata(app, now);

    if (
      !config ||
      !config.label ||
      currentStep === 'Hoan_Tat' ||
      currentStep === 'HOAN_TAT' ||
      app.status === 'Completed' ||
      isDateValid(app.customerHandoverDate || app.customer_handover_date)
    ) {
      return {
        isOverdue: false,
        daysLate: 0,
        daysLeft: 0,
        urgency: 'normal' as const,
        isPaused: false,
        pauseDays,
        currentTurnDays: 0,
        cumulativeStepDays: 0,
        slaAnchorSource: 'COMPLETED',
      };
    }

    const sla = finalSlaConfig[config.label] || config.slaDays || 10;
    let activeSla = sla;

    const history = Array.isArray(app.history) ? app.history : [];
    const stepEntryDate = app.stepEntryDate || app.step_entry_date;
    const hasStepEntry = isDateValid(stepEntryDate);
    const cumulativeStepDays = computeCumulativeStepDays(app, currentStep, history, config.label, now);

    const isGD1ChuanBi = currentStep === 'GD1_ChuanBi' || currentStep === 'GĐ1_ChuanBi' || currentStep === 'S1_ChuanBi';
    const isKTHandoverStep =
      currentStep === 'S2_KT_Tiep_Nhan' ||
      currentStep === 'S2_KT_Ban_giao' ||
      currentStep === 'GD2_Cho_Nop_VPDK' ||
      currentStep === 'GD1_Cho_KT_TiepNhan';
    const isSubmissionStep = currentStep === 'S3_Nop_VPDK' || currentStep === 'GD3_Nop_VPDK';
    const isTaxStep =
      currentStep === 'S5_Tai_Chinh_Khach_Hang' ||
      currentStep === 'GD4_Cho_Nop_NVTC' ||
      currentStep === 'GD4_Cho_KT_TiepNhan_LaySo';
    const isGCNIssuanceStep =
      currentStep === 'S6_Nhan_So_GCN' ||
      currentStep === 'GD5_Cho_Ky_In_GCN' ||
      currentStep === 'GD5_Cho_GCN' ||
      currentStep === 'GD5_Cho_PTT_TiepNhan_BG';

    // PHƯƠNG ÁN C — TẦNG 1: TẠM DỪNG ĐỒNG HỒ KHI HỒ SƠ ĐANG TRẢ VỀ / VƯỚNG MẮC
    if (isPaused) {
      const propType = app.propertyType || app.property_type;
      const isCanHo = propType === 'Can_Ho';
      const pausedSlaLimit = isGD1ChuanBi ? (isCanHo ? 45 : 25) : activeSla;
      const pauseAnchor = isDateValid(app.issueCreatedAt || app.issue_created_at)
        ? (app.issueCreatedAt || app.issue_created_at)
        : stepEntryDate;
      return {
        isOverdue: false,
        daysLate: 0,
        daysLeft: pausedSlaLimit,
        urgency: 'normal' as const,
        label: `Tạm dừng (${config.label})`,
        isPaused: true,
        pauseDays,
        currentTurnDays: 0,
        cumulativeStepDays,
        slaAnchorDate: toYmd(pauseAnchor),
        slaAnchorSource: 'PAUSED',
      };
    }

    // STEP COMPLETION GUARDS: Stop the clock if a destination milestone for the current step is already reached
    const gcnReceived = app.gcnReceivedDate || app.gcn_received_date;
    const gcnSigned = app.gcnSignedDate || app.gcn_signed_date;
    const submissionDate = app.submissionDate || app.submission_date;
    const taxNotiDate = app.taxNotificationDate || app.tax_notification_date;
    const taxReceiptDate = app.taxNoticeProvisionDate || app.tax_notice_provision_date || app.taxReceiptDate || app.tax_receipt_date;

    if (isDateValid(gcnSigned) || isDateValid(gcnReceived)) {
      const postGCNSteps = [
        'S7_1_PTT_Tiep_Nhan',
        'S7_PTDA_Ban_Giao',
        'S7_2_Ban_Giao_Khach',
        'GD5_Cho_PTT_TiepNhan_BG',
        'GD6_Cho_BG_Khach',
        'Hoan_Tat',
      ];
      if (!postGCNSteps.includes(currentStep)) {
        return {
          isOverdue: false,
          daysLate: 0,
          daysLeft: 0,
          urgency: 'normal' as const,
          status: 'In-Progress',
          isStepCompleted: true,
          isPaused: false,
          pauseDays,
          currentTurnDays: hasStepEntry ? Math.max(0, calculateWorkingDays(stepEntryDate, now)) : 0,
          cumulativeStepDays,
          slaAnchorDate: toYmd(stepEntryDate),
          slaAnchorSource: 'COMPLETED',
        };
      }
    }

    if (isSubmissionStep && isDateValid(submissionDate)) {
      return {
        isOverdue: false,
        daysLate: 0,
        daysLeft: 0,
        urgency: 'normal' as const,
        isStepCompleted: true,
        isPaused: false,
        pauseDays,
        currentTurnDays: hasStepEntry ? Math.max(0, calculateWorkingDays(stepEntryDate, now)) : 0,
        cumulativeStepDays,
        slaAnchorDate: toYmd(stepEntryDate || submissionDate),
        slaAnchorSource: 'COMPLETED',
      };
    }

    if (isTaxStep) {
      if (isDateValid(taxReceiptDate)) {
        return {
          isOverdue: false,
          daysLate: 0,
          daysLeft: 0,
          urgency: 'normal' as const,
          isStepCompleted: true,
          isPaused: false,
          pauseDays,
          currentTurnDays: hasStepEntry ? Math.max(0, calculateWorkingDays(stepEntryDate, now)) : 0,
          cumulativeStepDays,
          slaAnchorDate: toYmd(stepEntryDate || taxReceiptDate),
          slaAnchorSource: 'COMPLETED',
        };
      }
      if (!isDateValid(taxNotiDate)) {
        return {
          isOverdue: false,
          daysLate: 0,
          daysLeft: activeSla,
          urgency: 'normal' as const,
          isPaused: false,
          pauseDays,
          currentTurnDays: hasStepEntry ? Math.max(0, calculateWorkingDays(stepEntryDate, now)) : 0,
          cumulativeStepDays,
          slaAnchorDate: toYmd(stepEntryDate),
          slaAnchorSource: hasStepEntry ? 'STEP_ENTRY_DATE' : 'MILESTONE',
        };
      }
    }

    if (isGCNIssuanceStep && (isDateValid(gcnReceived) || isDateValid(gcnSigned))) {
      return {
        isOverdue: false,
        daysLate: 0,
        daysLeft: 0,
        urgency: 'normal' as const,
        isStepCompleted: true,
        isPaused: false,
        pauseDays,
        currentTurnDays: hasStepEntry ? Math.max(0, calculateWorkingDays(stepEntryDate, now)) : 0,
        cumulativeStepDays,
        slaAnchorDate: toYmd(stepEntryDate || gcnReceived || gcnSigned),
        slaAnchorSource: 'COMPLETED',
      };
    }

    // PHƯƠNG ÁN C — TẦNG 2: ƯU TIÊN MỐC stepEntryDate NẾU ĐÃ ĐƯỢC GHI NHẬN
    // (Hồ sơ từng trả về / khắc phục / chuyển bước mới theo Phương án C)
    if (hasStepEntry) {
      const propType = app.propertyType || app.property_type;
      const loaiCH = app.productType || app.loaiCanHo || app.product_type;
      const isCanHo = propType === 'Can_Ho' || loaiCH === 'Căn hộ' || loaiCH === 'Can_Ho';
      if (isGD1ChuanBi) {
        activeSla = isCanHo ? 45 : 25;
      } else if (isKTHandoverStep) {
        activeSla = sla || 3;
      }

      const elapsedDays = Math.max(0, calculateWorkingDays(stepEntryDate, now));
      const daysLeft = Math.max(0, parseFloat((activeSla - elapsedDays).toFixed(1)));
      const urgency: 'overdue' | 'urgent' | 'warning' | 'normal' =
        elapsedDays > activeSla ? 'overdue' : daysLeft <= 1 ? 'urgent' : daysLeft <= 3 ? 'warning' : 'normal';

      if (elapsedDays > activeSla) {
        const daysLate = parseFloat((elapsedDays - activeSla).toFixed(1));
        return {
          isOverdue: true,
          daysLate,
          label: `Trễ ${config.label}`,
          daysLeft: 0,
          urgency: 'overdue' as const,
          isPaused: false,
          pauseDays,
          currentTurnDays: elapsedDays,
          cumulativeStepDays,
          slaAnchorDate: toYmd(stepEntryDate),
          slaAnchorSource: 'STEP_ENTRY_DATE',
        };
      }

      return {
        isOverdue: false,
        daysLate: 0,
        daysLeft,
        urgency,
        isPaused: false,
        pauseDays,
        currentTurnDays: elapsedDays,
        cumulativeStepDays,
        slaAnchorDate: toYmd(stepEntryDate),
        slaAnchorSource: 'STEP_ENTRY_DATE',
      };
    }

    // TẦNG 3 (FALLBACK NGUYÊN BẢN): Dành cho 1.583 hồ sơ sạch chưa từng trả về (stepEntryDate = NULL)
    let stepStartTime: number = 0;

    // Chọn bản ghi lịch sử mới nhất khớp với bước hiện tại
    const normTarget = normalizeStepString(config.label);
    let matchedHistory: any = null;
    let matchedTs = -1;
    for (const h of history) {
      const isMatch =
        h.stepKey === currentStep ||
        h.currentStep === currentStep ||
        normalizeStepString(h.stepName || '') === normTarget;
      if (isMatch) {
        const ts = getHistoryTimestamp(h);
        if (!matchedHistory || ts > matchedTs) {
          matchedHistory = h;
          matchedTs = ts;
        }
      }
    }

    // Check if the current step is completed in system logs
    if (matchedHistory && matchedHistory.completedDate) {
      const sTime = getHistoryTimestamp(matchedHistory);
      if (sTime > 0) {
        const workingDays = calculateWorkingDays(new Date(sTime), new Date(matchedHistory.completedDate));
        if (workingDays > activeSla) {
          const daysLate = parseFloat((workingDays - activeSla).toFixed(1));
          return {
            isOverdue: true,
            daysLate,
            daysLeft: 0,
            urgency: 'overdue' as const,
            isStepCompleted: true,
            isPaused: false,
            pauseDays,
            currentTurnDays: workingDays,
            cumulativeStepDays: workingDays,
            slaAnchorDate: toYmd(new Date(sTime)),
            slaAnchorSource: 'HISTORY',
          };
        }
      }
      return {
        isOverdue: false,
        daysLate: 0,
        daysLeft: 0,
        urgency: 'normal' as const,
        isStepCompleted: true,
        isPaused: false,
        pauseDays,
        currentTurnDays: 0,
        cumulativeStepDays,
        slaAnchorSource: 'COMPLETED',
      };
    }

    // SPECIAL LOGIC FOR STEP 2 (CHỜ NỘP VPĐK) - LEGACY / UNTOUCHED RECORDS
    if (isKTHandoverStep) {
      const ktPtdaDate = app.ktHandoverToPtdaDate || app.kt_handover_to_ptda_date;
      activeSla = sla || 3;
      let targetStartDateStr: string | undefined;

      const accountingHandoverDate = app.accountingHandoverDate || app.accounting_handover_date;

      if (isDateValid(ktPtdaDate)) {
        targetStartDateStr = ktPtdaDate;
      } else if (isDateValid(accountingHandoverDate)) {
        activeSla = sla || 3;
        targetStartDateStr = accountingHandoverDate;
      } else {
        const propType = app.propertyType || app.property_type;
        const loaiCH = app.productType || app.loaiCanHo || app.product_type;
        const isCanHo = propType === 'Can_Ho' || loaiCH === 'Căn hộ' || loaiCH === 'Can_Ho';

        if (isCanHo) {
          const handoverAptDate = app.handoverApartmentDate || app.handover_apartment_date;
          if (isDateValid(handoverAptDate)) {
            activeSla = 45;
            targetStartDateStr = handoverAptDate;
          } else {
            return { isOverdue: false, daysLate: 0, daysLeft: 45, urgency: 'normal' as const, isPaused: false, pauseDays, currentTurnDays: 0, cumulativeStepDays: 0, slaAnchorSource: 'MILESTONE' };
          }
        } else {
          const signingDate = app.contractSigningDate || app.contract_signing_date;
          if (isDateValid(signingDate)) {
            activeSla = 25;
            targetStartDateStr = signingDate;
          } else {
            return { isOverdue: false, daysLate: 0, daysLeft: 25, urgency: 'normal' as const, isPaused: false, pauseDays, currentTurnDays: 0, cumulativeStepDays: 0, slaAnchorSource: 'MILESTONE' };
          }
        }
      }

      if (targetStartDateStr) {
        const elapsedDays = calculateWorkingDays(targetStartDateStr, now);
        const daysLeft = Math.max(0, parseFloat((activeSla - Math.max(0, elapsedDays)).toFixed(1)));

        const urgency: 'overdue' | 'urgent' | 'warning' | 'normal' =
          elapsedDays > activeSla ? 'overdue' : daysLeft <= 1 ? 'urgent' : daysLeft <= 3 ? 'warning' : 'normal';

        if (elapsedDays > activeSla) {
          const daysLate = parseFloat((elapsedDays - activeSla).toFixed(1));
          return {
            isOverdue: true,
            daysLate,
            label: `Trễ ${config.label}`,
            daysLeft: 0,
            urgency: 'overdue' as const,
            isPaused: false,
            pauseDays,
            currentTurnDays: Math.max(0, elapsedDays),
            cumulativeStepDays: Math.max(0, elapsedDays),
            slaAnchorDate: toYmd(targetStartDateStr),
            slaAnchorSource: 'MILESTONE',
          };
        }
        return {
          isOverdue: false,
          daysLate: 0,
          daysLeft,
          urgency,
          isPaused: false,
          pauseDays,
          currentTurnDays: Math.max(0, elapsedDays),
          cumulativeStepDays: Math.max(0, elapsedDays),
          slaAnchorDate: toYmd(targetStartDateStr),
          slaAnchorSource: 'MILESTONE',
        };
      }
    }

    // Step-specific custom SLA logic (GD1_ChuanBi / S1_ChuanBi)
    if (isGD1ChuanBi) {
      activeSla = sla;
      let targetStartDateStr: string | undefined;

      const propType = app.propertyType || app.property_type;
      const isCanHo = propType === 'Can_Ho';
      const rDate = matchedHistory && matchedHistory.receivedDate ? matchedHistory.receivedDate : app.receivedDate || app.received_date;

      if (isCanHo) {
        activeSla = 45;
        const handoverAptDate = app.handoverApartmentDate || app.handover_apartment_date;
        if (isDateValid(handoverAptDate)) {
          targetStartDateStr = handoverAptDate;
        } else if (isDateValid(rDate)) {
          targetStartDateStr = rDate;
        } else {
          return { isOverdue: false, daysLate: 0, daysLeft: 45, urgency: 'normal' as const, isPaused: false, pauseDays, currentTurnDays: 0, cumulativeStepDays: 0, slaAnchorSource: 'MILESTONE' };
        }
      } else {
        activeSla = 25;
        const signingDate = app.contract_signing_date || app.contractSigningDate;
        if (isDateValid(signingDate)) {
          targetStartDateStr = signingDate;
        } else if (isDateValid(rDate)) {
          targetStartDateStr = rDate;
        } else {
          return { isOverdue: false, daysLate: 0, daysLeft: 25, urgency: 'normal' as const, isPaused: false, pauseDays, currentTurnDays: 0, cumulativeStepDays: 0, slaAnchorSource: 'MILESTONE' };
        }
      }

      if (targetStartDateStr) {
        const elapsedDays = calculateWorkingDays(targetStartDateStr, now);
        const daysLeft = Math.max(0, parseFloat((activeSla - Math.max(0, elapsedDays)).toFixed(1)));

        const urgency: 'overdue' | 'urgent' | 'warning' | 'normal' =
          elapsedDays > activeSla ? 'overdue' : daysLeft <= 1 ? 'urgent' : daysLeft <= 3 ? 'warning' : 'normal';

        if (elapsedDays > activeSla) {
          const daysLate = parseFloat((elapsedDays - activeSla).toFixed(1));
          return {
            isOverdue: true,
            daysLate,
            label: `Trễ ${config.label}`,
            daysLeft: 0,
            urgency: 'overdue' as const,
            isPaused: false,
            pauseDays,
            currentTurnDays: Math.max(0, elapsedDays),
            cumulativeStepDays: Math.max(0, elapsedDays),
            slaAnchorDate: toYmd(targetStartDateStr),
            slaAnchorSource: 'MILESTONE',
          };
        }

        return {
          isOverdue: false,
          daysLate: 0,
          daysLeft,
          urgency,
          isPaused: false,
          pauseDays,
          currentTurnDays: Math.max(0, elapsedDays),
          cumulativeStepDays: Math.max(0, elapsedDays),
          slaAnchorDate: toYmd(targetStartDateStr),
          slaAnchorSource: 'MILESTONE',
        };
      }
    }

    let anchorSource: SLAResult['slaAnchorSource'] = 'MILESTONE';
    if (matchedHistory) {
      stepStartTime = getHistoryTimestamp(matchedHistory);
      if (stepStartTime > 0) anchorSource = 'HISTORY';
    }

    if (currentStep === 'S3_Nop_VPDK' && (app.workflowType === 'Quy_trinh_2' || app.workflow_type === 'Quy_trinh_2')) {
      const ktPtdaDate = app.ktHandoverToPtdaDate || app.kt_handover_to_ptda_date;
      if (isDateValid(ktPtdaDate)) {
        stepStartTime = new Date(ktPtdaDate).getTime();
        anchorSource = 'MILESTONE';
      }
    }

    if (!stepStartTime) {
      const mapping: Record<string, string> = {
        S1_ChuanBi: 'contract_signing_date',
        S2_KT_Tiep_Nhan: 'accounting_handover_date',
        S2_KT_Ban_giao: 'accounting_handover_date',
        S3_Nop_VPDK: app.workflowType === 'Quy_trinh_2' || app.workflow_type === 'Quy_trinh_2' ? 'kt_handover_to_ptda_date' : 'accounting_handover_date',
        S5_Tai_Chinh_Khach_Hang: 'tax_notification_date',
        S5_1_PTDA_TiepNhan: 'tax_receipt_date',
        S6_Nhan_So_GCN:
          app.gcnReceivedDate || app.gcn_received_date
            ? 'gcn_received_date'
            : app.gcnSignedDate || app.gcn_signed_date
              ? 'gcn_signed_date'
              : 'tax_receipt_date',
        S7_PTDA_Ban_Giao: 'gcn_received_date',
        S7_1_PTT_Tiep_Nhan: 'gcn_received_date',
        S7_2_Ban_Giao_Khach: 'customer_handover_date',

        GD1_ChuanBi: 'contract_signing_date',
        GD1_Cho_KT_TiepNhan: 'accounting_handover_date',
        GD2_Cho_Nop_VPDK: 'accounting_handover_date',
        GD3_Nop_VPDK: 'submission_date',
        GD4_Cho_Nop_NVTC: 'submission_date',
        GD4_Cho_KT_TiepNhan_LaySo: 'tax_notification_date',
        GD5_Cho_Ky_In_GCN: 'tax_receipt_date',
        GD5_Cho_GCN: app.gcnSignedDate || app.gcn_signed_date ? 'gcn_signed_date' : 'tax_receipt_date',
        GD5_Cho_PTT_TiepNhan_BG: app.gcnReceivedDate || app.gcn_received_date ? 'gcn_received_date' : 'gcn_signed_date',
        GD6_Cho_BG_Khach: 'ptda_handover_date',
        Hoan_Tat: 'customer_handover_date',
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
        'customer_handover_date',
      ];

      const fieldKey = mapping[currentStep] || 'received_date';
      let comparisonDate: string | undefined;
      const startIdx = milestoneOrder.indexOf(fieldKey);

      if (startIdx !== -1) {
        const toCamelCase = (str: string) => str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        for (let i = startIdx; i >= 0; i--) {
          const k = milestoneOrder[i];
          const camelK = toCamelCase(k);
          const val = app[k] || app[camelK];
          if (isDateValid(val)) {
            comparisonDate = val;
            break;
          }
        }
      }

      const isEarlyMilestone =
        !!comparisonDate &&
        (comparisonDate === (app.contractSigningDate || app.contract_signing_date) ||
          comparisonDate === (app.receivedDate || app.received_date));
      if (isEarlyMilestone && startIdx >= 1) {
        return {
          isOverdue: false,
          daysLate: 0,
          daysLeft: activeSla,
          urgency: 'normal' as const,
          isPaused: false,
          pauseDays,
          currentTurnDays: 0,
          cumulativeStepDays,
          slaAnchorSource: 'MILESTONE',
        };
      }

      if (!comparisonDate) {
        comparisonDate = app.received_date || app.receivedDate;
      }

      if (comparisonDate) {
        stepStartTime = new Date(comparisonDate).getTime();
      } else {
        const createdTime = app.createdAt || app.created_at;
        stepStartTime = createdTime ? new Date(createdTime).getTime() : now.getTime();
      }
      anchorSource = 'MILESTONE';
    }

    const elapsedDays = calculateWorkingDays(new Date(stepStartTime), now);
    const daysLeft = Math.max(0, parseFloat((activeSla - Math.max(0, elapsedDays)).toFixed(1)));
    const urgency: 'overdue' | 'urgent' | 'warning' | 'normal' =
      elapsedDays > activeSla ? 'overdue' : daysLeft <= 1 ? 'urgent' : daysLeft <= 3 ? 'warning' : 'normal';

    if (elapsedDays > activeSla) {
      const daysLate = parseFloat((elapsedDays - activeSla).toFixed(1));
      return {
        isOverdue: true,
        daysLate,
        label: `Trễ ${config.label}`,
        daysLeft: 0,
        urgency: 'overdue' as const,
        isPaused: false,
        pauseDays,
        currentTurnDays: Math.max(0, elapsedDays),
        cumulativeStepDays: Math.max(cumulativeStepDays, Math.max(0, elapsedDays)),
        slaAnchorDate: toYmd(new Date(stepStartTime)),
        slaAnchorSource: anchorSource,
      };
    }

    return {
      isOverdue: false,
      daysLate: 0,
      daysLeft,
      urgency,
      isPaused: false,
      pauseDays,
      currentTurnDays: Math.max(0, elapsedDays),
      cumulativeStepDays: Math.max(cumulativeStepDays, Math.max(0, elapsedDays)),
      slaAnchorDate: toYmd(new Date(stepStartTime)),
      slaAnchorSource: anchorSource,
    };
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

  // Fallback for lightweight select where major milestone dates are empty/missing but status is present
  const hasNoDates = !isV(app.customerHandoverDate) && 
                     !isV(app.gcnReceivedDate) && 
                     !isV(app.ptdaHandoverDate) && 
                     !isV(app.gcnSignedDate) && 
                     !isV(app.taxReceiptDate) && 
                     !isV(app.taxNotificationDate) && 
                     !isV(app.taxNotificationReceivedDate) && 
                     !isV(app.submissionDate) &&
                     !isV(app.ktHandoverToPtdaDate) &&
                     !isV(app.accountingHandoverDate);

  if (hasNoDates && app.status) {
    const s = app.status;
    if (s === 'Completed' || s === 'Hoan_Tat') return '9. HOÀN TẤT';
    if (s === 'WaitingHandover') return '8. CHỜ BÀN GIAO';
    if (s === 'GCN_Issued') return '7. ĐÃ CÓ GCN';
    if (s === 'TaxPaid' || s === 'TaxCompleted') return '6. ĐÃ NỘP THUẾ';
    if (s === 'TaxPending') return '4. CHỜ THÔNG BÁO THUẾ';
    if (s === 'Submitted') return '3. ĐÃ NỘP VPĐK';
    if (s === 'WaitingVPDK') return '2. CHỜ NỘP VPĐK';
    return '1. ĐANG CHUẨN BỊ';
  }

  // Nếu hồ sơ đang bị trả về (isRejected=true), ưu tiên dùng currentStep
  // để tránh bị xếp nhầm nhóm do các field ngày cột mốc cũ vẫn còn giá trị
  if (app.isRejected || app.is_rejected) {
    const step = app.currentStep || app.current_step || '';
    const PREPARING_STEPS = [
      'S1_ChuanBi', 'GD1_ChuanBi'
    ];
    const WAITING_VPDK_STEPS = [
      'S2_KT_Tiep_Nhan', 'S2_KT_Ban_giao',
      'GD1_Cho_KT_TiepNhan', 'GD2_Cho_Nop_VPDK'
    ];
    const SUBMITTED_STEPS = [
      'S3_Nop_VPDK', 'GD3_Nop_VPDK'
    ];
    const TAX_PENDING_STEPS = [
      'S5_Tai_Chinh_Khach_Hang', 'GD4_Cho_Nop_NVTC', 'GD4_Cho_KT_TiepNhan_LaySo'
    ];
    const TAX_COMPLETED_STEPS = [
      'S5_1_PTDA_TiepNhan'
    ];
    const GCN_STEPS = [
      'S6_Nhan_So_GCN', 'GD5_Cho_Ky_In_GCN', 'GD5_Cho_GCN'
    ];
    const HANDOVER_STEPS = [
      'S7_PTDA_Ban_Giao', 'S7_1_PTT_Tiep_Nhan', 'S7_2_Ban_Giao_Khach',
      'GD5_Cho_PTT_TiepNhan_BG', 'GD6_Cho_BG_Khach'
    ];

    if (PREPARING_STEPS.includes(step))     return '1. ĐANG CHUẨN BỊ';
    if (WAITING_VPDK_STEPS.includes(step))  return '2. CHỜ NỘP VPĐK';
    if (SUBMITTED_STEPS.includes(step))     return '3. ĐÃ NỘP VPĐK';
    if (TAX_PENDING_STEPS.includes(step))   return '4. CHỜ THÔNG BÁO THUẾ';
    if (TAX_COMPLETED_STEPS.includes(step)) return '6. ĐÃ NỘP THUẾ';
    if (GCN_STEPS.includes(step))           return '7. ĐÃ CÓ GCN';
    if (HANDOVER_STEPS.includes(step))      return '8. CHỜ BÀN GIAO';
    if (step === 'Hoan_Tat')                return '9. HOÀN TẤT';
    // Fallback nếu không map được step
    return '1. ĐANG CHUẨN BỊ';
  }

  if (isV(app.customerHandoverDate) || app.status === 'Completed' || app.currentStep === 'Hoan_Tat') return '9. HOÀN TẤT';
  if (isV(app.gcnReceivedDate) || isV(app.ptdaHandoverDate)) return '8. CHỜ BÀN GIAO';
  if (isV(app.gcnSignedDate)) return '7. ĐÃ CÓ GCN';
  if (isV(app.taxReceiptDate)) return '6. ĐÃ NỘP THUẾ';
  if (isV(app.taxNotificationDate) || isV(app.taxNotificationReceivedDate)) return '5. CHỜ HOÀN THÀNH NVTC';
  const subDate = app.submissionDate || app.submission_date;
  if (isV(subDate)) {
    const taxNoti = app.taxNotificationDate || app.tax_notification_date;
    const taxNotiReceived = app.taxNotificationReceivedDate || app.tax_notification_received_date;
    if (!taxNoti && !taxNotiReceived) {
      const daysDiff = (new Date().getTime() - new Date(subDate).getTime()) / (1000 * 60 * 60 * 24);
      // Nếu quá 7 ngày phân loại vào nhóm Chờ thông báo thuế, lưu ý không làm ảnh hưởng đến ngày tính SLA gốc của hồ sơ
      if (daysDiff > 7) return '4. CHỜ THÔNG BÁO THUẾ';
    }
    return '3. ĐÃ NỘP VPĐK';
  }
  if (isV(app.ktHandoverToPtdaDate) || isV(app.accountingHandoverDate) || app.status === 'WaitingVPDK') return '2. CHỜ NỘP VPĐK';

  return '1. ĐANG CHUẨN BỊ';
};