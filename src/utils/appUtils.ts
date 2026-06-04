import { Application, StepName } from '../types';
import { calculateSLA } from './statusEngine';

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
  if (step === 'S4_Cho_Thong_Bao_Thue') return 3;
  if (['S5_Tai_Chinh_Khach_Hang', 'S5_1_PTDA_TiepNhan'].includes(step)) return 4;
  if (step === 'S6_Nhan_So_GCN') return 5;
  if (['S7_PTDA_Ban_Giao', 'S7_1_PTT_Tiep_Nhan', 'S7_2_Ban_Giao_Khach'].includes(step)) return 6;
  
  // Quy trình 1 (6 bước)
  if (['GD1_ChuanBi', 'GD1_Cho_KT_TiepNhan'].includes(step)) return 0;
  if (['GD2_Cho_Nop_VPDK'].includes(step)) return 1;
  if (step === 'GD3_Cho_TBThue') return 2;
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

export const inferStepFromDates = (
  app: any,
  slaConfig?: Record<string, number>
): { currentStep: StepName; status: import('../types').UnitStatus } => {
  const isQT2 = app.workflowType === 'Quy_trinh_2';
  
  const hasHandover = app.customerHandoverDate && app.customerHandoverDate !== '---' && app.customerHandoverDate !== 'None' && String(app.customerHandoverDate).trim() !== '';

  if (app.isSelfService) {
    if (app.customerHandoverDate)
      return { currentStep: 'Hoan_Tat', status: 'Completed' };
    if (app.gcnReceivedDate)
      return { 
        currentStep: isQT2 ? 'S7_1_PTT_Tiep_Nhan' : 'GD5_Cho_PTT_TiepNhan_BG',
        status: 'WaitingHandover' 
      };
    return { 
      currentStep: isQT2 ? 'S1_ChuanBi' : 'GD1_ChuanBi', 
      status: 'Processing' 
    };
  }
  
  if (hasHandover) 
    return { currentStep: 'Hoan_Tat', status: 'Completed' };
  
  if (isQT2) {
    if (app.gcnReceivedDate)        return { currentStep: 'S7_1_PTT_Tiep_Nhan', status: 'WaitingHandover' };
    if (app.ptdaHandoverDate)       return { currentStep: 'S7_PTDA_Ban_Giao', status: 'WaitingHandover' };
    if (app.gcnSignedDate)          return { currentStep: 'S6_Nhan_So_GCN', status: 'GCN_Issued' };
    if (app.taxReceiptDate)         return { currentStep: 'S5_1_PTDA_TiepNhan', status: 'TaxCompleted' };
    if (app.taxNotificationDate)    return { currentStep: 'S5_Tai_Chinh_Khach_Hang', status: 'TaxPending' };
    
    if (app.submissionDate && !app.taxNotificationDate) {
      const subDate = new Date(app.submissionDate);
      const daysDiff = (new Date().getTime() - subDate.getTime()) / (1000 * 60 * 60 * 24);
      const sla = slaConfig?.['Nộp VPĐK'] ?? 5;
      return daysDiff > sla
        ? { currentStep: 'S4_Cho_Thong_Bao_Thue', status: 'TaxPending' }
        : { currentStep: 'S3_Nop_VPDK', status: 'Submitted' };
    }
    
    if (app.vpdkCode)               return { currentStep: 'S3_Nop_VPDK', status: 'Submitted' };
    
    if (app.accountingHandoverDate && !app.submissionDate) {
      return { currentStep: 'S2_KT_Tiep_Nhan', status: 'Processing' };
    }
    if (!app.accountingHandoverDate) {
      return { currentStep: 'S1_ChuanBi', status: 'Processing' };
    }
    
    return { currentStep: 'S1_ChuanBi', status: 'Processing' };
  } else {
    if (app.gcnReceivedDate)        return { currentStep: 'GD5_Cho_PTT_TiepNhan_BG', status: 'WaitingHandover' };
    if (app.gcnSignedDate)          return { currentStep: 'GD5_Cho_GCN', status: 'GCN_Issued' };
    if (app.taxReceiptDate)         return { currentStep: 'GD4_Cho_KT_TiepNhan_LaySo', status: 'TaxCompleted' };
    if (app.taxNotificationDate)    return { currentStep: 'GD4_Cho_Nop_NVTC', status: 'TaxPending' };

    if (app.submissionDate && !app.taxNotificationDate) {
      const subDate = new Date(app.submissionDate);
      const daysDiff = (new Date().getTime() - subDate.getTime()) / (1000 * 60 * 60 * 24);
      const sla = slaConfig?.['Nộp VPĐK'] ?? 5;
      return daysDiff > sla
        ? { currentStep: 'GD3_Cho_TBThue', status: 'TaxPending' }
        : { currentStep: 'GD3_Cho_TBThue', status: 'Submitted' };
    }

    if (app.vpdkCode)               return { currentStep: 'GD2_Cho_Nop_VPDK', status: 'WaitingVPDK' };
    
    if (app.accountingHandoverDate && !app.submissionDate) {
      return { currentStep: 'GD1_Cho_KT_TiepNhan', status: 'Processing' };
    }
    if (!app.accountingHandoverDate) {
      return { currentStep: 'GD1_ChuanBi', status: 'Processing' };
    }
    
  }
};

export function validateDateSequence(app: Partial<Application>): string | null {
  const chronoDates = [
    { key: 'receivedDate', label: 'Ngày nhận HS' },
    { key: 'accountingHandoverDate', label: 'Ngày KT tiếp nhận' },
    { key: 'submissionDate', label: 'Ngày nộp VPĐK' },
    { key: 'taxNotificationDate', label: 'Ngày TB Thuế' },
    { key: 'taxReceiptDate', label: 'Ngày nộp thuế/NVTC' },
    { key: 'gcnSignedDate', label: 'Ngày ký GCN' },
    { key: 'gcnReceivedDate', label: 'Ngày nhận GCN' },
    { key: 'ptdaHandoverDate', label: 'Ngày PTDA bàn giao' },
    { key: 'customerHandoverDate', label: 'Ngày BG Khách' }
  ];

  const isDateEmptyOrInvalid = (val: any) => {
    if (!val || val === '---' || typeof val !== 'string' || val.trim() === '') return true;
    return isNaN(new Date(val).getTime());
  };

  let maxFilledIdx = -1;
  for (let i = chronoDates.length - 1; i >= 0; i--) {
    if (!isDateEmptyOrInvalid(app[chronoDates[i].key as keyof Application])) {
      maxFilledIdx = i;
      break;
    }
  }

  if (maxFilledIdx > 0) {
    let hasBypass = false;
    for (let i = 0; i < maxFilledIdx; i++) {
      if (isDateEmptyOrInvalid(app[chronoDates[i].key as keyof Application])) {
        hasBypass = true;
        break;
      }
    }

    if (!hasBypass) {
      const activeDates = chronoDates
        .slice(0, maxFilledIdx + 1)
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

