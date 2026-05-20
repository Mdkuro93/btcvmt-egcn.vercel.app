import { useMemo } from 'react';
import { getFinalStatus, isOverdue } from '../../utils/statusEngine';

export function useDashboardStats(applications: any[]) {
  return useMemo(() => {
    const total = applications.length;
    const processing = applications.filter((a) => a.status === 'Processing').length;
    const waitingVPDK = applications.filter((a) => a.status === 'WaitingVPDK').length;
    const taxPending = applications.filter((a) => a.status === 'TaxPending').length;
    const waitingHandover = applications.filter((a) => a.status === 'WaitingHandover').length;
    const completed = applications.filter((a) => a.status === 'Completed').length;
    
    const overdue = applications.filter((a) => isOverdue(a)).length;

    return {
      total,
      processing,
      waitingVPDK,
      taxPending,
      waitingHandover,
      completed,
      overdue,
    };
  }, [applications]);
}