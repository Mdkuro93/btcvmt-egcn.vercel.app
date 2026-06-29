import { useMemo } from 'react';
import { Application } from '../types';
import { STEP_CONFIG } from '../constants';

export type TrendPeriod = 'week' | 'month' | 'quarter' | 'year';

export interface TrendValue {
  current: number;
  previous: number;
  delta: number;
  pctChange: number | null;
  newIn: number;      // Tăng mới trong kỳ
  resolvedIn: number; // Đã xử lý/hoàn tất trong kỳ
}

export interface TrendStats {
  total: TrendValue;
  overdue: TrendValue;
  error: TrendValue;
  loan: TrendValue;
}

function getPeriodBounds(period: TrendPeriod, offset: 0 | -1): { start: Date; end: Date } {
  const now = new Date();
  if (period === 'week') {
    const day = now.getDay();
    const diffToMon = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(now.getDate() + diffToMon + offset * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { start: monday, end: sunday };
  }
  if (period === 'month') {
    const m = now.getMonth() + offset;
    return {
      start: new Date(now.getFullYear(), m, 1, 0, 0, 0, 0),
      end: new Date(now.getFullYear(), m + 1, 0, 23, 59, 59, 999),
    };
  }
  if (period === 'quarter') {
    const q = Math.floor(now.getMonth() / 3) + offset;
    const sm = q * 3;
    return {
      start: new Date(now.getFullYear(), sm, 1, 0, 0, 0, 0),
      end: new Date(now.getFullYear(), sm + 3, 0, 23, 59, 59, 999),
    };
  }
  const y = now.getFullYear() + offset;
  return {
    start: new Date(y, 0, 1, 0, 0, 0, 0),
    end: new Date(y, 11, 31, 23, 59, 59, 999),
  };
}

function inRange(dateStr: string | undefined | null, start: Date, end: Date): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d >= start && d <= end;
}

// Ước tính ngày bắt đầu trễ = receivedDate + slaDays của bước hiện tại
function estimateOverdueStartDate(app: Application): Date | null {
  const slaDays = STEP_CONFIG[app.currentStep]?.slaDays;
  if (!slaDays || !app.receivedDate) return null;
  const d = new Date(app.receivedDate);
  d.setDate(d.getDate() + slaDays);
  return d;
}

// Hồ sơ được coi là "hoàn tất trong kỳ" nếu customerHandoverDate nằm trong kỳ
function resolvedInPeriod(app: Application, start: Date, end: Date): boolean {
  return inRange(app.customerHandoverDate, start, end);
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

export function useTrendStats(apps: Application[], period: TrendPeriod): TrendStats {
  return useMemo(() => {
    const cur  = getPeriodBounds(period, 0);
    const prev = getPeriodBounds(period, -1);

    // ── TOTAL ──────────────────────────────────────────────
    // current: tổng đang xử lý (không tính Completed)
    const totalCur = apps.filter(a => a.status !== 'Completed').length;
    // newIn: hồ sơ được tiếp nhận mới trong kỳ này
    const totalNewIn = apps.filter(a => inRange(a.receivedDate, cur.start, cur.end)).length;
    // resolvedIn: hồ sơ hoàn tất trong kỳ này
    const totalResolved = apps.filter(a => resolvedInPeriod(a, cur.start, cur.end)).length;
    // previous: ước tính = current + đã hoàn tất kỳ trước - tiếp nhận mới kỳ trước
    const totalNewPrev     = apps.filter(a => inRange(a.receivedDate, prev.start, prev.end)).length;
    const totalResolvedPrev = apps.filter(a => resolvedInPeriod(a, prev.start, prev.end)).length;
    const totalPrev = Math.max(0, totalCur + totalResolvedPrev - totalNewPrev);

    // ── OVERDUE ────────────────────────────────────────────
    const overdueCur = apps.filter(a => a._sla?.isOverdue ?? false).length;
    // newIn: hồ sơ ước tính bắt đầu trễ trong kỳ này
    const overdueNewIn = apps.filter(a => {
      if (!(a._sla?.isOverdue)) return false;
      const overdueStart = estimateOverdueStartDate(a);
      return overdueStart ? inRange(overdueStart.toISOString(), cur.start, cur.end) : false;
    }).length;
    // resolvedIn: hồ sơ trễ đã được hoàn tất trong kỳ này
    // (ước tính: hoàn tất trong kỳ VÀ thời gian xử lý > slaDays của bước đó)
    const overdueResolved = apps.filter(a => {
      if (!resolvedInPeriod(a, cur.start, cur.end)) return false;
      const slaDays = STEP_CONFIG[a.currentStep]?.slaDays ?? 999;
      const received = new Date(a.receivedDate);
      const handover = new Date(a.customerHandoverDate!);
      const elapsed = Math.round((handover.getTime() - received.getTime()) / 86400000);
      return elapsed > slaDays * 2; // ước tính: mất gấp đôi SLA = từng trễ
    }).length;
    // previous: ước tính tương tự
    const overdueNewPrev = apps.filter(a => {
      if (!(a._sla?.isOverdue)) return false;
      const overdueStart = estimateOverdueStartDate(a);
      return overdueStart ? inRange(overdueStart.toISOString(), prev.start, prev.end) : false;
    }).length;
    const overduePrev = Math.max(0, overdueCur + overdueResolved - overdueNewIn + overdueNewPrev);

    // ── ERROR ──────────────────────────────────────────────
    const errorCur = apps.filter(a => a.status === 'Error').length;
    // newIn: hồ sơ sai sót tiếp nhận trong kỳ này
    const errorNewIn = apps.filter(a =>
      a.status === 'Error' && inRange(a.receivedDate, cur.start, cur.end)
    ).length;
    // resolvedIn: hồ sơ từng Error nhưng đã hoàn tất trong kỳ
    const errorResolved = apps.filter(a =>
      resolvedInPeriod(a, cur.start, cur.end) && !!a.issueType
    ).length;
    const errorNewPrev = apps.filter(a =>
      a.status === 'Error' && inRange(a.receivedDate, prev.start, prev.end)
    ).length;
    const errorResolvedPrev = apps.filter(a =>
      resolvedInPeriod(a, prev.start, prev.end) && !!a.issueType
    ).length;
    const errorPrev = Math.max(0, errorCur + errorResolvedPrev - errorNewPrev);

    // ── LOAN ───────────────────────────────────────────────
    const loanCur    = apps.filter(a => a.loanStatus === 'Co_Vay').length;
    const loanNewIn  = apps.filter(a =>
      a.loanStatus === 'Co_Vay' && inRange(a.receivedDate, cur.start, cur.end)
    ).length;
    const loanResolved = apps.filter(a =>
      a.loanStatus === 'Co_Vay' && resolvedInPeriod(a, cur.start, cur.end)
    ).length;
    const loanNewPrev = apps.filter(a =>
      a.loanStatus === 'Co_Vay' && inRange(a.receivedDate, prev.start, prev.end)
    ).length;
    const loanPrev = Math.max(0, loanCur + loanResolved - loanNewIn + loanNewPrev);

    return {
      total:   makeTrendValue(totalCur,   totalPrev,   totalNewIn,    totalResolved),
      overdue: makeTrendValue(overdueCur, overduePrev, overdueNewIn,  overdueResolved),
      error:   makeTrendValue(errorCur,   errorPrev,   errorNewIn,    errorResolved),
      loan:    makeTrendValue(loanCur,    loanPrev,    loanNewIn,     loanResolved),
    };
  }, [apps, period]);
}
