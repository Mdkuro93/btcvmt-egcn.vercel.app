import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export type TrendPeriod = 'week' | 'month' | 'quarter' | 'year';

export interface PeriodStats {
  newIn: number;
  completed: number;
  newInOverdue: number;
  newInError: number;
  newInLoan: number;
  totalActive: number;
  totalOverdue: number;
  totalError: number;
  totalLoan: number;
}

export interface TrendQueryResult {
  current: PeriodStats;
  previous: PeriodStats;
  loading: boolean;
  error: string | null;
  hasSnapshot: boolean;
}

const EMPTY_STATS: PeriodStats = {
  newIn: 0, completed: 0, newInOverdue: 0,
  newInError: 0, newInLoan: 0,
  totalActive: 0, totalOverdue: 0, totalError: 0, totalLoan: 0,
};

function getCurrentPeriodLabel(period: TrendPeriod): string {
  const now = new Date();
  if (period === 'week') {
    // ISO week number
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2,'0')}`;
  }
  if (period === 'month') {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}`;
  }
  if (period === 'quarter') {
    return `${now.getFullYear()}-Q${Math.floor(now.getMonth() / 3) + 1}`;
  }
  return `${now.getFullYear()}`;
}

function getPreviousPeriodLabel(period: TrendPeriod): string {
  const now = new Date();
  if (period === 'week') {
    const prev = new Date(now);
    prev.setDate(now.getDate() - 7);
    const d = new Date(Date.UTC(prev.getFullYear(), prev.getMonth(), prev.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2,'0')}`;
  }
  if (period === 'month') {
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2,'0')}`;
  }
  if (period === 'quarter') {
    const currQ = Math.floor(now.getMonth() / 3);
    const prevQ = currQ === 0 ? 3 : currQ - 1;
    const prevYear = currQ === 0 ? now.getFullYear() - 1 : now.getFullYear();
    return `${prevYear}-Q${prevQ + 1}`;
  }
  return `${now.getFullYear() - 1}`;
}

async function fetchSnapshot(
  periodType: TrendPeriod,
  periodLabel: string,
  projectName?: string | null
): Promise<PeriodStats | null> {
  let query = supabase
    .from('kpi_snapshots')
    .select('*')
    .eq('period_type', periodType)
    .eq('period_label', periodLabel)
    .eq('project_name', projectName || 'ALL')
    .order('snapshot_date', { ascending: false })
    .limit(1);

  const { data, error } = await query;
  if (error || !data || data.length === 0) return null;

  const row = data[0];
  return {
    newIn: row.new_in || 0,
    completed: row.completed_in || 0,
    newInOverdue: 0,
    newInError: row.total_error || 0,
    newInLoan: row.total_loan || 0,
    totalActive: row.total_active || 0,
    totalOverdue: row.total_overdue || 0,
    totalError: row.total_error || 0,
    totalLoan: row.total_loan || 0,
  };
}

// Fallback: query trực tiếp cho kỳ hiện tại (chưa có snapshot)
async function fetchCurrentPeriodLive(
  period: TrendPeriod,
  projectName?: string | null
): Promise<PeriodStats> {
  const now = new Date();
  let startDate: string;

  if (period === 'week') {
    const day = now.getDay() || 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - day + 1);
    monday.setHours(0,0,0,0);
    startDate = monday.toISOString();
  } else if (period === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  } else if (period === 'quarter') {
    const qStart = Math.floor(now.getMonth() / 3) * 3;
    startDate = new Date(now.getFullYear(), qStart, 1).toISOString();
  } else {
    startDate = new Date(now.getFullYear(), 0, 1).toISOString();
  }

  let q = supabase
    .from('records')
    .select('id, status, loan_status, issue_type, created_at', { count: 'exact', head: false })
    .gte('created_at', startDate)
    .lte('created_at', now.toISOString());
  if (projectName) q = q.eq('project_name', projectName);

  const [allRes, loanRes, errorRes] = await Promise.all([
    q,
    supabase.from('records').select('id', { count: 'exact', head: false })
      .gte('created_at', startDate).lte('created_at', now.toISOString())
      .eq('loan_status', 'Co_Vay'),
    supabase.from('record_history').select('record_id', { count: 'exact', head: false })
      .ilike('note', '[BÁO SAI SÓT%')
      .gte('received_date', startDate).lte('received_date', now.toISOString()),
  ]);

  const uniqueErrorIds = new Set((errorRes.data ?? []).map(r => r.record_id));

  return {
    newIn: allRes.data?.length || 0,
    completed: 0,
    newInOverdue: 0,
    newInError: uniqueErrorIds.size,
    newInLoan: loanRes.data?.length || 0,
    totalActive: 0,
    totalOverdue: 0,
    totalError: 0,
    totalLoan: 0,
  };
}

export function useTrendQueries(
  period: TrendPeriod,
  projectName?: string | null
): TrendQueryResult {
  const [result, setResult] = useState<TrendQueryResult>({
    current: EMPTY_STATS,
    previous: EMPTY_STATS,
    loading: true,
    error: null,
    hasSnapshot: false,
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setResult(prev => ({ ...prev, loading: true, error: null }));
      try {
        const currentLabel  = getCurrentPeriodLabel(period);
        const previousLabel = getPreviousPeriodLabel(period);

        // Lấy snapshot kỳ trước (đã có trong DB)
        const prevSnapshot = await fetchSnapshot(period, previousLabel, projectName);

        // Kỳ hiện tại: ưu tiên snapshot nếu có, fallback query live
        const currSnapshot = await fetchSnapshot(period, currentLabel, projectName);
        const currentStats = currSnapshot || await fetchCurrentPeriodLive(period, projectName);

        setResult({
          current:  currentStats,
          previous: prevSnapshot || EMPTY_STATS,
          loading:  false,
          error:    null,
          hasSnapshot: !!prevSnapshot,
        });
      } catch (e) {
        console.warn('[useTrendQueries] Lỗi:', e);
        setResult(prev => ({ ...prev, loading: false, error: 'Không tải được dữ liệu' }));
      }
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [period, projectName]);

  return result;
}
