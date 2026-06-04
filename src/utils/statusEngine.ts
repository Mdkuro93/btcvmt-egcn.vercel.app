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

const slaCache = new WeakMap<any, { isOverdue: boolean, daysLate: number, label?: string }>();

export function calculateSLA(app: any, stepConfig?: any, slaConfig?: any) {
  if (!app) return { isOverdue: false, daysLate: 0 };
  if (slaCache.has(app)) return slaCache.get(app)!;

  try {
    const currentStep = app.currentStep || app.current_step;
    if (!currentStep) return { isOverdue: false, daysLate: 0 };
    
    const finalStepConfig = stepConfig || (typeof window !== 'undefined' && (window as any).__STEP_CONFIG__) || DEFAULT_STEP_CONFIG;
    const finalSlaConfig = slaConfig || (typeof window !== 'undefined' && (window as any).__SLA_CONFIG__) || DEFAULT_SLA_CONFIG;
    
    const config = finalStepConfig[currentStep];
    if (!config || !config.label || currentStep === 'Hoan_Tat' || currentStep === 'HOAN_TAT') {
      const res = { isOverdue: false, daysLate: 0 };
      slaCache.set(app, res);
      return res;
    }

    const sla = finalSlaConfig[config.label] || config.slaDays || 10;
    
    let stepStartTime: number = 0;
    const history = app.history || [];
    
    // Find the latest history entry for the current step config label
    const matchedHistory = history.find((h: any) => h.stepName === config.label);
    
    // Check if the current step is completed in system logs
    if (matchedHistory && matchedHistory.completedDate) {
      // Step already completed: hide active warning from UI immediately
      const res = { isOverdue: false, daysLate: 0 };
      slaCache.set(app, res);
      return res;
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
        GD1_Cho_KT_TiepNhan: 'accountingHandoverDate',
        GD2_Cho_Nop_VPDK: 'accountingHandoverDate',
        GD3_Cho_TBThue: 'submissionDate',
        GD4_Cho_Nop_NVTC: 'taxNotificationDate',
        GD4_Cho_KT_TiepNhan_LaySo: 'taxReceiptDate',
        GD5_Cho_Ky_In_GCN: 'taxReceiptDate',
        GD5_Cho_GCN: 'gcnSignedDate',
        GD5_Cho_PTT_TiepNhan_BG: 'gcnReceivedDate',
        GD6_Cho_BG_Khach: 'ptdaHandoverDate',
        Hoan_Tat: 'customerHandoverDate'
      };

      const fieldKey = mapping[currentStep] || 'receivedDate';
      const camelKey = fieldKey;
      const snakeKey = fieldKey.replace(/([A-Z])/g, "_$1").toLowerCase();
      const comparisonDate = (app[camelKey] || app[snakeKey] || app.receivedDate || app.received_date) as string | undefined;
      
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
    
    if (elapsedDays > sla) {
      // Calculate float days late precisely
      const daysLate = parseFloat((elapsedDays - sla).toFixed(1));
      const res = { isOverdue: true, daysLate, label: `Trễ ${config.label}` };
      slaCache.set(app, res);
      return res;
    }

    const res = { isOverdue: false, daysLate: 0 };
    slaCache.set(app, res);
    return res;
  } catch (error) {
    const res = { isOverdue: false, daysLate: 0 };
    slaCache.set(app, res);
    return res;
  }
}

export function getSLAStatus(app: any, stepConfig?: any, slaConfig?: any): 'OVERDUE' | 'NORMAL' {
  const result = calculateSLA(app, stepConfig, slaConfig);
  return result.isOverdue ? 'OVERDUE' : 'NORMAL';
}

export function getFinalStatus(app: any) {
  if (app.customerHandoverDate || app.customer_handover_date) return 'Completed';
  
  if (app.isSelfService) {
    return 'Processing';
  }

  if (app.gcnSignedDate) return 'GCN_Issued';
  if (app.taxReceiptDate) return 'TaxPaid';
  if (app.submissionDate) return 'Submitted';
  
  if (app.status === 'WAITING_HANDOVER' || app.current_step === 'CHỜ BÀN GIAO' || app.status === 'CHỜ BÀN GIAO' || app.currentStep === 'CHỜ BÀN GIAO') return 'WaitingHandover';
  if (app.status === 'AWAITING_FINANCE' || app.current_step === 'CHỜ HOÀN THÀNH NVTC' || app.status === 'CHỜ HOÀN THÀNH NVTC' || app.currentStep === 'CHỜ HOÀN THÀNH NVTC') return 'TaxPending';
  
  return 'Processing';
}

export function isOverdue(app: any, stepConfig?: any, slaConfig?: any): boolean {
  return calculateSLA(app, stepConfig, slaConfig).isOverdue;
}