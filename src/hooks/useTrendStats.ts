import { Application } from '../types';
import { TrendPeriod, TrendQueryResult } from './useTrendQueries';

export type { TrendPeriod };

export interface TrendValue {
  current: number;
  previous: number;
  delta: number;
  pctChange: number | null;
  newIn: number;
  resolvedIn: number;
}

export interface TrendStats {
  total: TrendValue;
  overdue: TrendValue;
  error: TrendValue;
  loan: TrendValue;
  loading: boolean;
  hasSnapshot: boolean;
}

function makeTrendValue(
  current: number,
  previous: number,
  newIn: number,
  resolvedIn: number
): TrendValue {
  const delta = current - previous;
  const pctChange = previous === 0 ? null : Math.round((delta / previous) * 100);
  return { current, previous, delta, pctChange, newIn, resolvedIn };
}

export function buildTrendStats(
  apps: Application[],
  queryResult: TrendQueryResult
): TrendStats {
  const { current: cur, previous: prev, loading, hasSnapshot } = queryResult;

  // Số liệu hiện tại từ RAM (chính xác, real-time)
  const totalCur   = apps.filter(a => a.status !== 'Completed').length;
  const overdueCur = apps.filter(a => a._sla?.isOverdue ?? false).length;
  const errorCur   = apps.filter(a => a.status === 'Error').length;
  const loanCur    = apps.filter(a => a.loanStatus === 'Co_Vay').length;

  // Số liệu kỳ trước từ snapshot DB (chính xác)
  // Nếu chưa có snapshot → tính nhẩm từ current, newIn, completed để ra số tương đối
  const totalPrev   = hasSnapshot ? prev.totalActive  : Math.max(0, totalCur - cur.newIn + cur.completed);
  const overduePrev = hasSnapshot ? prev.totalOverdue : Math.max(0, overdueCur - cur.newInOverdue);
  const errorPrev   = hasSnapshot ? prev.totalError   : Math.max(0, errorCur - cur.newInError);
  const loanPrev    = hasSnapshot ? prev.totalLoan    : Math.max(0, loanCur - cur.newInLoan);

  return {
    total:   makeTrendValue(totalCur,   totalPrev,   cur.newIn,       cur.completed),
    overdue: makeTrendValue(overdueCur, overduePrev, cur.newInOverdue, 0),
    error:   makeTrendValue(errorCur,   errorPrev,   cur.newInError,  0),
    loan:    makeTrendValue(loanCur,    loanPrev,    cur.newInLoan,   0),
    loading,
    hasSnapshot,
  };
}
