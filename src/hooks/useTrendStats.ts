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
  const { current: cur, previous: prev, loading } = queryResult;

  // ── TOTAL ─────────────────────────────────────────────
  const totalCur  = apps.filter(a => a.status !== 'Completed').length;
  // previous: ước tính tổng active kỳ trước
  // = kỳ này + hồ sơ đã hoàn tất kỳ này (đã "rời" danh sách active)
  //          - hồ sơ mới kỳ này (chưa có kỳ trước)
  //          + hồ sơ mới kỳ trước (đã được tạo kỳ trước)
  //          - hồ sơ đã hoàn tất kỳ trước (đã rời kỳ trước)
  const totalPrev = Math.max(0,
    totalCur
    + cur.completed   // cộng lại hồ sơ đã hoàn tất kỳ này
    - cur.newIn       // trừ hồ sơ mới tạo kỳ này
    + prev.newIn      // cộng hồ sơ mới tạo kỳ trước
    - prev.completed  // trừ hồ sơ đã hoàn tất kỳ trước
  );

  // ── OVERDUE ───────────────────────────────────────────
  const overdueCur  = apps.filter(a => a._sla?.isOverdue ?? false).length;
  // previous: không có query → dùng tỷ lệ hiện tại làm ước tính
  const overdueRate = totalCur > 0 ? overdueCur / totalCur : 0;
  const overduePrev = Math.max(0, Math.round(
    overdueRate * (totalCur + cur.completed - cur.newIn + prev.newIn - prev.completed)
  ));

  // ── ERROR ─────────────────────────────────────────────
  const errorCur  = apps.filter(a => a.status === 'Error').length;
  // newIn: từ query (hồ sơ mới trong kỳ có issue_type)
  // previous: errorCur - newIn_kỳNày + newIn_kỳTrước
  const errorPrev = Math.max(0,
    errorCur
    + cur.completed   // hồ sơ Error đã được resolve xong kỳ này
    - cur.newInError  // hồ sơ Error mới phát sinh kỳ này
    + prev.newInError // hồ sơ Error kỳ trước
  );

  // ── LOAN ──────────────────────────────────────────────
  const loanCur  = apps.filter(a => a.loanStatus === 'Co_Vay').length;
  const loanPrev = Math.max(0,
    loanCur
    + cur.completed   // proxy: hồ sơ vay đã hoàn tất kỳ này
    - cur.newInLoan   // hồ sơ vay mới kỳ này
    + prev.newInLoan  // hồ sơ vay mới kỳ trước
    - prev.completed  // hồ sơ vay đã hoàn tất kỳ trước
  );

  return {
    total:   makeTrendValue(totalCur,   totalPrev,   cur.newIn,       cur.completed),
    overdue: makeTrendValue(overdueCur, overduePrev, 0,               0),
    error:   makeTrendValue(errorCur,   errorPrev,   cur.newInError,  prev.newInError),
    loan:    makeTrendValue(loanCur,    loanPrev,    cur.newInLoan,   prev.newInLoan),
    loading,
  };
}
