
export const buildErrorSummary = (apps: any[]) => {
  const result: Record<string, number> = {};

  apps.forEach(a => {
    const type = a.issue_type || 'Khác';
    result[type] = (result[type] || 0) + 1;
  });

  return result;
};

export const buildSeverityStats = (apps: any[]) => {
  const res: Record<string, number> = { Low: 0, Medium: 0, High: 0 };

  apps.forEach(a => {
    const s = a.issue_severity || 'Low';
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
    const type = a.issue_type || 'Khác';
    const severity = a.issue_severity || 'Low';

    if (!res[type]) res[type] = {};
    res[type][severity] = (res[type][severity] || 0) + 1;
  });

  return res;
};

export const buildStepStats = (apps: any[]) => {
  const res: Record<string, number> = {};

  apps.forEach(a => {
    const step = (a.current_step || '').toUpperCase();

    let stepType = 'OTHER';
    if (step.includes('KT')) stepType = 'KT';
    else if (step.includes('VPDK')) stepType = 'VPDK';
    else if (step.includes('TBTHUE')) stepType = 'TAX';
    else if (step.includes('GCN')) stepType = 'GCN';

    res[stepType] = (res[stepType] || 0) + 1;
  });

  return res;
};
