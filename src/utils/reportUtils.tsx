
export const buildErrorSummary = (apps: any[]) => {
  const result: Record<string, number> = {};

  apps.forEach(a => {
    const type = a.issueType || 'Khác';
    result[type] = (result[type] || 0) + 1;
  });

  return result;
};

export const buildSeverityStats = (apps: any[]) => {
  const res: Record<string, number> = { Low: 0, Medium: 0, High: 0 };

  apps.forEach(a => {
    const s = a.issueSeverity || 'Low';
    if (res[s] !== undefined) {
      res[s]++;
    } else {
      res[s] = 1;
    }
  });

  return res;
};

export const buildMatrix = (apps: any[]) => {
  const res: Record<string, Record<string, number>> = {};

  apps.forEach(a => {
    const type = a.issueType || 'Khác';
    const severity = a.issueSeverity || 'Low';

    if (!res[type]) res[type] = {};
    res[type][severity] = (res[type][severity] || 0) + 1;
  });

  return res;
};

export const getStageKeyForApp = (r: any): string => {
  const checkNotEmpty = (val: any) => {
    return val && val !== '---' && val !== 'None' && String(val).trim() !== '';
  };

  const today = new Date();
  const submissionSLA = 7;

  if (r.isSelfService) {
    const hasHandover = checkNotEmpty(r.customerHandoverDate);
    const hasGcn = checkNotEmpty(r.gcnReceivedDate);

    if (r.status === 'Completed' || r.currentStep === 'Hoan_Tat' || hasHandover) {
      return 'HOAN_TAT';
    }
    else if (hasGcn) {
      return 'CHO_BAN_GIAO';
    }
    else {
      return 'CHUAN_BI';
    }
  }

  // Priority 1: Completed
  if (r.status === 'Completed' || r.currentStep === 'Hoan_Tat') {
    return 'HOAN_TAT';
  }
  // Priority 2: WaitingHandover
  else if (r.status === 'WaitingHandover' || [
    'S7_PTDA_Ban_Giao', 'S7_1_PTT_Tiep_Nhan', 
    'S7_2_Ban_Giao_Khach', 'GD5_Cho_PTT_TiepNhan_BG', 
    'GD6_Cho_BG_Khach'
  ].includes(r.currentStep)) {
    return 'CHO_BAN_GIAO';
  }
  // Priority 3: GCN_Issued
  else if (r.status === 'GCN_Issued' || [
    'S6_Nhan_So_GCN', 'GD5_Cho_Ky_In_GCN', 'GD5_Cho_GCN'
  ].includes(r.currentStep)) {
    return 'DA_CO_GCN';
  }
  // Priority 4: TaxCompleted / TaxPaid
  else if (r.status === 'TaxPaid' || r.status === 'TaxCompleted' ||
           r.currentStep === 'S5_1_PTDA_TiepNhan') {
    return 'DA_NOP_THUE';
  }
  // Priority 5: AWAITING_FINANCE (CHỜ HOÀN THÀNH NVTC)
  else if (r.taxNotificationDate || r.taxNotificationReceivedDate) {
    return 'CHO_HT_NVTC';
  }
  else if ([
    'S5_Tai_Chinh_Khach_Hang', 'GD4_Cho_Nop_NVTC', 
    'GD4_Cho_KT_TiepNhan_LaySo'
  ].includes(r.currentStep)) {
    return 'CHO_HT_NVTC';
  }
  // Priority 6: SUBMITTED / TAX_WARNING (phân loại theo SLA)
  else if (r.status === 'Submitted' || r.status === 'TaxPending' || r.submissionDate) {
    if (r.submissionDate && !r.taxNotificationDate && !r.taxNotificationReceivedDate) {
      const daysDiff = (today.getTime() - new Date(r.submissionDate).getTime()) / (1000*60*60*24);
      if (daysDiff > submissionSLA) {
        return 'CHO_TB_THUE';
      } else {
        return 'DA_NOP_VPDK';
      }
    } else if (r.taxNotificationDate || r.taxNotificationReceivedDate) {
      return 'CHO_HT_NVTC';
    } else {
      return 'DA_NOP_VPDK';
    }
  }
  // Priority 7: AWAITING_SUBMISSION (CHỜ NỘP VPĐK / CHỜ KT TIẾP NHẬN)
  else if (
    r.status === 'WaitingVPDK' ||
    r.currentStep === 'GD2_Cho_Nop_VPDK' ||
    r.currentStep === 'S2_KT_Ban_giao' ||
    r.currentStep === 'S2_KT_Tiep_Nhan' ||
    r.currentStep === 'GD1_Cho_KT_TiepNhan' ||
    (r.accountingHandoverDate && !r.submissionDate)
  ) {
    return 'CHO_NOP_VPDK';
  }
  // Default: PREPARING
  else {
    return 'CHUAN_BI';
  }
};

export const buildStepStats = (apps: any[]) => {
  const res: Record<string, number> = {
    CHUAN_BI: 0,
    CHO_NOP_VPDK: 0,
    DA_NOP_VPDK: 0,
    CHO_TB_THUE: 0,
    CHO_HT_NVTC: 0,
    DA_NOP_THUE: 0,
    DA_CO_GCN: 0,
    CHO_BAN_GIAO: 0
  };

  apps.forEach(a => {
    const key = getStageKeyForApp(a);
    if (res[key] !== undefined) {
      res[key]++;
    }
  });

  return res;
};

export const getActiveErrors = (apps: any[]) => {
  return apps.filter(a => {
    const status = a.issueStatus;
    return status === 'OPEN';
  });
};

export const getAllErrors = (apps: any[]) => {
  return apps.filter(a => {
    const type = a.issueType;
    return type && type !== 'None';
  });
};
