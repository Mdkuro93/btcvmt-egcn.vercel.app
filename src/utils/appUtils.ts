import { Application, StepName } from '../types';
import { calculateSLA } from './statusEngine';
import { WORKFLOW_1_STEPS, WORKFLOW_2_STEPS } from '../constants';

export const calculateDaysDiff = (dateStr: string) => {
  if (!dateStr) return 0;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 0;
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - date.getTime());
  const res = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return isNaN(res) ? 0 : res;
};

export const calculateDaysBetweenDates = (start: string, end: string) => {
  const d1 = new Date(start);
  const d2 = new Date(end);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
};

export const getPhaseIndex = (step: StepName): number => {
  // Quy trình 2 (7 bước)
  if (step === 'S1_ChuanBi') return 0;
  if (['S2_KT_Tiep_Nhan', 'S2_KT_Ban_giao'].includes(step)) return 1;
  if (step === 'S3_Nop_VPDK') return 2;
  if (['S5_Tai_Chinh_Khach_Hang', 'S5_1_PTDA_TiepNhan'].includes(step)) return 3;
  if (step === 'S6_Nhan_So_GCN') return 4;
  if (['S7_PTDA_Ban_Giao', 'S7_1_PTT_Tiep_Nhan', 'S7_2_Ban_Giao_Khach'].includes(step)) return 5;
  
  // Quy trình 1 (6 bước)
  if (['GD1_ChuanBi', 'GD1_Cho_KT_TiepNhan'].includes(step)) return 0;
  if (['GD2_Cho_Nop_VPDK'].includes(step)) return 1;
  if (step === 'GD3_Nop_VPDK') return 2;
  if (['GD4_Cho_Nop_NVTC', 'GD4_Cho_KT_TiepNhan_LaySo'].includes(step)) return 3;
  if (['GD5_Cho_Ky_In_GCN', 'GD5_Cho_GCN', 'GD5_Cho_PTT_TiepNhan_BG'].includes(step)) return 4;
  if (['GD6_Cho_BG_Khach'].includes(step)) return 5;

  if (step === 'Hoan_Tat') return 6;
  
  return -1;
};

export const getTaxStatus = (app: Application) => {
  if (app.status === 'Error') return { label: 'Sai sót/Vướng mắc', color: 'text-rose-500' };
  if (app.taxReceiptDate) return { label: 'Hoàn thành', color: 'text-emerald-500' };
  if (!app.taxNotificationDate && !app.taxNotificationReceivedDate) return { label: 'Chưa có TB thuế', color: 'text-slate-500' };
  return { label: 'Chưa hoàn thành', color: 'text-amber-500' };
};

export const getOverdueInfo = (app: any, stepConfig: Record<string, any>, slaConfig: Record<string, number>, bypassCache: boolean = false) => {
  if (app._sla && !bypassCache) {
    return app._sla;
  }
  return calculateSLA(app, stepConfig, slaConfig);
};

export const determineStatusFromStep = (currentStep: StepName, initialStepConfig: Record<string, any>): import('../types').UnitStatus => {
  if (currentStep === 'Hoan_Tat') return 'Completed';
  if (['S6_Nhan_So_GCN', 'GD5_Cho_Ky_In_GCN', 'GD5_Cho_GCN'].includes(currentStep)) return 'GCN_Issued';
  if (['S7_1_PTT_Tiep_Nhan', 'S7_PTDA_Ban_Giao', 'GD5_Cho_PTT_TiepNhan_BG', 'GD6_Cho_BG_Khach', 'S7_2_Ban_Giao_Khach'].includes(currentStep)) return 'WaitingHandover';
  return initialStepConfig[currentStep]?.status || 'Processing';
};

export const validateSkippedSteps = (
  app: Application,
  currentStep: StepName
): string[] => {
  const warnings: string[] = [];
  if (app.isSelfService) return warnings; // Khách tự làm → bỏ qua
  
  // Kiểm tra các bước bị nhảy cóc
  const missingSteps: string[] = [];

  // gcnReceivedDate có nhưng thiếu bước trung gian
  if (app.gcnReceivedDate && !app.submissionDate)
    missingSteps.push('Ngày nộp VPĐK');
  if (app.gcnReceivedDate && !app.taxNotificationDate)
    missingSteps.push('Ngày TB thuế');
  if (app.gcnReceivedDate && !app.taxReceiptDate)
    missingSteps.push('Ngày đóng thuế');
  if (app.gcnReceivedDate && !app.gcnSignedDate)
    missingSteps.push('Ngày ký GCN');

  // gcnSignedDate có nhưng thiếu bước trung gian
  if (app.gcnSignedDate && !app.submissionDate)
    missingSteps.push('Ngày nộp VPĐK');
  if (app.gcnSignedDate && !app.taxReceiptDate)
    missingSteps.push('Ngày đóng thuế');

  // taxReceiptDate có nhưng thiếu taxNotificationDate
  if (app.taxReceiptDate && !app.taxNotificationDate)
    missingSteps.push('Ngày TB thuế');
  if (app.taxReceiptDate && !app.submissionDate)
    missingSteps.push('Ngày nộp VPĐK');

  if (missingSteps.length > 0) {
    const uniqueMissing = [...new Set(missingSteps)];
    warnings.push(
      `⚠️ ${app.unitCode}: Hệ thống ghi nhận bước "${currentStep}" nhưng thiếu thông tin: ${uniqueMissing.join(', ')}. KT/PTDA cần bổ sung dữ liệu còn thiếu.`
    );
  }
  return warnings;
};

export const getStepIndex = (step: StepName, workflowType?: string): number => {
  const steps = workflowType === 'Quy_trinh_2' ? WORKFLOW_2_STEPS : WORKFLOW_1_STEPS;
  return steps.indexOf(step);
};

export const inferStepFromDates = (
  app: any,
  slaConfig?: Record<string, number>,
  mode: 'IMPORT' | 'RUNTIME' = 'RUNTIME'
): { currentStep: StepName; status: import('../types').UnitStatus } => {
  const isQT2 = app.workflowType === 'Quy_trinh_2';
  const defaultStep = isQT2 ? 'S1_ChuanBi' : 'GD1_ChuanBi';
  
  if (mode === 'RUNTIME') {
    return {
      currentStep: app.currentStep || defaultStep,
      status: app.status || 'Processing'
    };
  }

  console.log(`[inferStepFromDates] Running in mode=${mode} for unit ${app.unitCode}`);

  const steps = isQT2 ? WORKFLOW_2_STEPS : WORKFLOW_1_STEPS;
  const currentIdx = steps.indexOf(app.currentStep || defaultStep);

  const hasHandover = app.customerHandoverDate && app.customerHandoverDate !== '---' && app.customerHandoverDate !== 'None' && String(app.customerHandoverDate).trim() !== '';

  let inferred: { currentStep: StepName; status: import('../types').UnitStatus };

  if (app.isSelfService) {
    if (app.customerHandoverDate)
      inferred = { currentStep: 'Hoan_Tat', status: 'Completed' };
    else if (app.gcnReceivedDate)
      inferred = { 
        currentStep: isQT2 ? 'S7_1_PTT_Tiep_Nhan' : 'GD5_Cho_PTT_TiepNhan_BG',
        status: 'WaitingHandover' 
      };
    else
      inferred = { 
        currentStep: isQT2 ? 'S1_ChuanBi' : 'GD1_ChuanBi', 
        status: 'Processing' 
      };
  } else if (hasHandover) {
    inferred = { currentStep: 'Hoan_Tat', status: 'Completed' };
  } else if (isQT2) {
    if (app.gcnReceivedDate)        inferred = { currentStep: 'S7_1_PTT_Tiep_Nhan', status: 'WaitingHandover' };
    else if (app.ptdaHandoverDate)  inferred = { currentStep: 'S7_PTDA_Ban_Giao', status: 'WaitingHandover' };
    else if (app.gcnSignedDate)     inferred = { currentStep: 'S6_Nhan_So_GCN', status: 'GCN_Issued' };
    else if (app.taxReceiptDate)    inferred = { currentStep: 'S5_1_PTDA_TiepNhan', status: 'TaxCompleted' };
    else if (app.taxNotificationDate) inferred = { currentStep: 'S5_Tai_Chinh_Khach_Hang', status: 'TaxNotificationReceived' };
    else if (app.submissionDate) {
      inferred = { currentStep: 'S3_Nop_VPDK', status: 'Submitted' };
    }
    else if (app.vpdkCode)          inferred = { currentStep: 'S3_Nop_VPDK', status: 'Submitted' };
    else if (app.accountingHandoverDate) inferred = { currentStep: 'S2_KT_Tiep_Nhan', status: 'Processing' };
    else inferred = { currentStep: 'S1_ChuanBi', status: 'Processing' };
  } else {
    if (app.gcnReceivedDate)        inferred = { currentStep: 'GD5_Cho_PTT_TiepNhan_BG', status: 'WaitingHandover' };
    else if (app.gcnSignedDate)     inferred = { currentStep: 'GD5_Cho_GCN', status: 'GCN_Issued' };
    else if (app.taxReceiptDate)    inferred = { currentStep: 'GD4_Cho_KT_TiepNhan_LaySo', status: 'TaxCompleted' };
    else if (app.taxNotificationDate) inferred = { currentStep: 'GD4_Cho_Nop_NVTC', status: 'TaxNotificationReceived' };
    else if (app.submissionDate) {
      const subDate = new Date(app.submissionDate);
      const daysDiff = (new Date().getTime() - subDate.getTime()) / (1000 * 60 * 60 * 24);
      // Đồng nhất với Dashboard: > 7 ngày là Chờ TB Thuế
      if (daysDiff > 7) {
        inferred = { currentStep: 'GD3_Nop_VPDK', status: 'TaxPending' };
      } else {
        inferred = { currentStep: 'GD3_Nop_VPDK', status: 'Submitted' };
      }
    }
    else if (app.vpdkCode)          inferred = { currentStep: 'GD2_Cho_Nop_VPDK', status: 'WaitingVPDK' };
    else if (app.accountingHandoverDate) inferred = { currentStep: 'GD1_Cho_KT_TiepNhan', status: 'Processing' };
    else inferred = { currentStep: 'GD1_ChuanBi', status: 'Processing' };
  }

  // TRICT ANTI-ROLLBACK for IMPORT MODE:
  // Giữ nguyên step hiện tại nếu import thấp hơn, nâng step nếu import cao hơn
  const inferredIdx = steps.indexOf(inferred.currentStep);
  if (mode === 'IMPORT' && inferredIdx < currentIdx) {
    console.log(`[IMPORT SECURITY] Blocked step regression. app=${app.unitCode}, currentStep=${app.currentStep}, inferredStep=${inferred.currentStep}. Keeping current!`);
    return { currentStep: app.currentStep, status: app.status };
  }

  // Preserve existing fallback for other cases if any
  if (inferredIdx < currentIdx && app.status !== 'Error' && !app._forceRegression) {
    return { currentStep: app.currentStep, status: app.status };
  }

  return inferred;
};

export function validateDateSequence(app: Partial<Application>): string | null {
  const chronoDates = [
    { key: 'receivedDate', label: 'Ngày nhận HS' },
    { key: 'accountingHandoverDate', label: 'Ngày KT tiếp nhận' },
    { key: 'ktHandoverToPtdaDate', label: 'Ngày KT bàn giao' },
    { key: 'submissionDate', label: 'Ngày nộp VPĐK' },
    { key: 'taxNotificationDate', label: 'Ngày TB Thuế' },
    { key: 'taxReceiptDate', label: 'Ngày nộp thuế/NVTC' },
    { key: 'gcnSignedDate', label: 'Ngày ký GCN' },
    { key: 'ptdaHandoverDate', label: 'Ngày PTDA bàn giao' },
    { key: 'gcnReceivedDate', label: 'Ngày nhận GCN' },
    { key: 'customerHandoverDate', label: 'Ngày BG Khách' }
  ];

  const isDateEmptyOrInvalid = (val: any) => {
    if (!val || val === '---' || typeof val !== 'string' || val.trim() === '') return true;
    return isNaN(new Date(val).getTime());
  };

  const activeDates = chronoDates
    .map(d => ({ ...d, value: app[d.key as keyof Application] }))
    .filter(d => !isDateEmptyOrInvalid(d.value));

  for (let i = 0; i < activeDates.length - 1; i++) {
    const d1 = activeDates[i];
    const d2 = activeDates[i+1];
    const date1 = new Date(d1.value as string);
    const date2 = new Date(d2.value as string);
    date1.setHours(0, 0, 0, 0);
    date2.setHours(0, 0, 0, 0);
    
    if (date2 < date1) {
      return `${d2.label} không được nhỏ hơn ${d1.label}`;
    }
  }

  if (!isDateEmptyOrInvalid(app.contractSigningDate) && !isDateEmptyOrInvalid(app.accountingHandoverDate)) {
    const ktDate = new Date(app.accountingHandoverDate!);
    const hdDate = new Date(app.contractSigningDate!);
    ktDate.setHours(0,0,0,0);
    hdDate.setHours(0,0,0,0);
    if (hdDate < ktDate) {
      return `⚠️ Ngày ký HĐCN (${app.contractSigningDate}) nhỏ hơn ngày KT tiếp nhận (${app.accountingHandoverDate}). Vui lòng kiểm tra lại nếu là hồ sơ đặc thù.`;
    }
  }

  return null;
}

