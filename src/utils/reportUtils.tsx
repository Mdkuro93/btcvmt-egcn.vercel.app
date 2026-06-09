
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

export const buildStepStats = (apps: any[]) => {
  const res: Record<string, number> = {};

  apps.forEach(a => {
    const step = (a.currentStep || '').toUpperCase();

    let stepType = 'OTHER';
    if (step.includes('KT')) stepType = 'KT';
    else if (step.includes('VPDK')) stepType = 'VPDK';
    else if (step.includes('TBTHUE')) stepType = 'TAX';
    else if (step.includes('GCN')) stepType = 'GCN';

    res[stepType] = (res[stepType] || 0) + 1;
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
