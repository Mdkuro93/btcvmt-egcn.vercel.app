import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export type TrendPeriod = 'week' | 'month' | 'quarter' | 'year';

export interface PeriodStats {
  newIn: number;        // Hồ sơ tiếp nhận mới trong kỳ
  completed: number;    // Hồ sơ hoàn tất trong kỳ
  newInOverdue: number; // Hồ sơ mới có trễ hạn trong kỳ (proxy: thời gian xử lý dài)
  newInError: number;   // Hồ sơ mới có sai sót trong kỳ
  newInLoan: number;    // Hồ sơ vay mới trong kỳ
}

export interface TrendQueryResult {
  current: PeriodStats;
  previous: PeriodStats;
  loading: boolean;
  error: string | null;
}

function getPeriodBounds(period: TrendPeriod, offset: 0 | -1): { start: string; end: string } {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  if (period === 'week') {
    const day = now.getDay();
    const diffToMon = day === 0 ? -6 : 1 - day;
    startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(now.getDate() + diffToMon + offset * 7);
    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
  } else if (period === 'month') {
    const m = now.getMonth() + offset;
    startDate = new Date(now.getFullYear(), m, 1, 0, 0, 0, 0);
    endDate = new Date(now.getFullYear(), m + 1, 0, 23, 59, 59, 999);
  } else if (period === 'quarter') {
    const q = Math.floor(now.getMonth() / 3) + offset;
    const sm = q * 3;
    startDate = new Date(now.getFullYear(), sm, 1, 0, 0, 0, 0);
    endDate = new Date(now.getFullYear(), sm + 3, 0, 23, 59, 59, 999);
  } else {
    const y = now.getFullYear() + offset;
    startDate = new Date(y, 0, 1, 0, 0, 0, 0);
    endDate = new Date(y, 11, 31, 23, 59, 59, 999);
  }

  return {
    start: startDate.toISOString(),
    end: endDate.toISOString(),
  };
}

async function fetchPeriodStats(
  period: TrendPeriod,
  offset: 0 | -1,
  projectName?: string | null
): Promise<PeriodStats> {
  const { start, end } = getPeriodBounds(period, offset);

  // Query 1: Hồ sơ được tạo trong kỳ (dùng created_at)
  const baseQuery = () => {
    let q = supabase
      .from('records')
      .select('id, status, loan_status, issue_type, created_at', { count: 'exact', head: false })
      .gte('created_at', start)
      .lte('created_at', end);
    if (projectName) q = q.eq('project_name', projectName);
    return q;
  };

  // Query 2: Hồ sơ sai sót phát sinh trong kỳ (dùng record_history)
  // Tìm history entry có note chứa '[BÁO SAI SÓT' và receivedDate trong kỳ
  const errorHistoryQuery = async (): Promise<number> => {
    try {
      let q = supabase
        .from('record_history')
        .select('record_id', { count: 'exact', head: false })
        .ilike('note', '[BÁO SAI SÓT%')
        .gte('received_date', start)
        .lte('received_date', end);
      const { data, error } = await q;
      if (error) {
        console.warn('[useTrendQueries] Lỗi query record_history:', error);
        return 0;
      }
      // Đếm số record_id duy nhất (tránh đếm trùng nếu 1 hồ sơ bị báo nhiều lần)
      const uniqueIds = new Set((data ?? []).map(r => r.record_id));
      return uniqueIds.size;
    } catch (e) {
      console.warn('[useTrendQueries] Lỗi query record_history:', e);
      return 0;
    }
  };

  // Chạy song song tất cả queries
  const [allRes, completedRes, loanRes, errorCount] = await Promise.all([
    baseQuery(),
    baseQuery().eq('status', 'Completed'),
    baseQuery().eq('loan_status', 'Co_Vay'),
    errorHistoryQuery(),
  ]);

  const allRows = allRes.data ?? [];
  const completedRows = completedRes.data ?? [];
  const loanRows = loanRes.data ?? [];

  return {
    newIn: allRows.length,
    completed: completedRows.length,
    newInOverdue: 0,
    newInError: errorCount,  // Từ record_history — chính xác theo thời điểm báo sai sót
    newInLoan: loanRows.length,
  };
}

export function useTrendQueries(
  period: TrendPeriod,
  projectName?: string | null
): TrendQueryResult {
  const [result, setResult] = useState<TrendQueryResult>({
    current: { newIn: 0, completed: 0, newInOverdue: 0, newInError: 0, newInLoan: 0 },
    previous: { newIn: 0, completed: 0, newInOverdue: 0, newInError: 0, newInLoan: 0 },
    loading: true,
    error: null,
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setResult(prev => ({ ...prev, loading: true, error: null }));
      try {
        const [current, previous] = await Promise.all([
          fetchPeriodStats(period, 0, projectName),
          fetchPeriodStats(period, -1, projectName),
        ]);
        setResult({ current, previous, loading: false, error: null });
      } catch (e) {
        console.warn('[useTrendQueries] Lỗi fetch trend:', e);
        setResult(prev => ({ ...prev, loading: false, error: 'Không tải được dữ liệu so sánh' }));
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [period, projectName]);

  return result;
}
