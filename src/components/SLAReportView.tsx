import React, { useState, useMemo } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Application, Project } from '../types';
import { cn } from '../lib/utils';
import { calculateSLA } from '../utils/statusEngine';

// ─── Giai đoạn tiến độ chung (dùng cho cả QT1 và QT2) ───────────────────────
// Không phân biệt tên bước kỹ thuật, chỉ quan tâm ý nghĩa giai đoạn
const PROGRESS_STAGES: {
  key: string;
  label: string;
  dept: string;
  steps: string[];
}[] = [
  {
    key: 'CHUAN_BI',
    label: 'Chuẩn bị hồ sơ',
    dept: 'PTT',
    steps: ['S1_ChuanBi', 'GD1_ChuanBi'],
  },
  {
    key: 'KT_TIEP_NHAN',
    label: 'KT tiếp nhận',
    dept: 'KT',
    steps: ['S2_KT_Tiep_Nhan', 'S2_KT_Ban_giao', 'GD1_Cho_KT_TiepNhan', 'GD2_Cho_Nop_VPDK'],
  },
  {
    key: 'NOP_VPDK',
    label: 'Nộp VPĐK',
    dept: 'PTDA',
    steps: ['S3_Nop_VPDK', 'GD3_Nop_VPDK'],
  },
  {
    key: 'CHO_THUE',
    label: 'Chờ nghĩa vụ thuế',
    dept: 'PTT',
    steps: ['S4_Cho_Thong_Bao_Thue', 'S5_Tai_Chinh_Khach_Hang', 'GD4_Cho_Nop_NVTC'],
  },
  {
    key: 'TAI_CHINH',
    label: 'Hoàn thành tài chính',
    dept: 'KT',
    steps: ['S5_1_PTDA_TiepNhan', 'GD4_Cho_KT_TiepNhan_LaySo'],
  },
  {
    key: 'NHAN_GCN',
    label: 'Nhận kết quả GCN',
    dept: 'PTDA',
    steps: ['S6_Nhan_So_GCN', 'GD5_Cho_Ky_In_GCN', 'GD5_Cho_GCN'],
  },
  {
    key: 'BAN_GIAO',
    label: 'Bàn giao khách hàng',
    dept: 'PTT',
    steps: [
      'S7_PTDA_Ban_Giao',
      'S7_1_PTT_Tiep_Nhan',
      'S7_2_Ban_Giao_Khach',
      'GD5_Cho_PTT_TiepNhan_BG',
      'GD6_Cho_BG_Khach',
    ],
  },
];

// Map bước kỹ thuật → giai đoạn
const STEP_TO_STAGE: Record<string, string> = {};
PROGRESS_STAGES.forEach(s => s.steps.forEach(step => (STEP_TO_STAGE[step] = s.key)));

// Dept của user hiện tại (từ userRole)
function getDeptFromRole(userRole: string): string | null {
  if (userRole === 'MANAGER_PTT') return 'PTT';
  if (userRole === 'MANAGER_KT') return 'KT';
  if (userRole === 'MANAGER_PTDA') return 'PTDA';
  return null; // ADMIN, MANAGER, DIRECTOR → thấy tất cả
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface SLAReportViewProps {
  applications: Application[];
  projects: Project[];
  theme: 'light' | 'dark';
  stepConfig: Record<string, any>;
  slaConfig: Record<string, number>;
  userRole: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function SLAReportView({
  applications,
  projects,
  theme,
  stepConfig,
  slaConfig,
  userRole,
}: SLAReportViewProps) {
  // Tầng 1: chọn dự án (null = xem tổng)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  // Tầng 2: chọn giai đoạn tiến độ để drill-down
  const [selectedStageKey, setSelectedStageKey] = useState<string | null>(null);
  // Phân trang tầng 3
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;

  const myDept = getDeptFromRole(userRole);

  // ── Lọc ứng dụng theo dept nếu là MANAGER_* ────────────────────────────────
  const deptApps = useMemo(() => {
    if (!myDept) return applications;
    return applications.filter(a => {
      const stage = STEP_TO_STAGE[a.currentStep];
      if (!stage) return false;
      const stageInfo = PROGRESS_STAGES.find(s => s.key === stage);
      return stageInfo?.dept === myDept;
    });
  }, [applications, myDept]);

  // ── Lọc theo dự án đang chọn ──────────────────────────────────────────────
  const scopedApps = useMemo(() => {
    if (!selectedProjectId) return deptApps;
    const proj = projects.find(p => p.id === selectedProjectId);
    if (!proj) return deptApps;
    return deptApps.filter(a => a.projectName === proj.name);
  }, [deptApps, selectedProjectId, projects]);

  // ── Tính SLA cho từng app ─────────────────────────────────────────────────
  const appsWithSLA = useMemo(
    () =>
      scopedApps.map(a => ({
        ...a,
        _slaInfo: calculateSLA(a, stepConfig, slaConfig),
      })),
    [scopedApps, stepConfig, slaConfig]
  );

  // ── KPI tổng quan ─────────────────────────────────────────────────────────
  const kpi = useMemo(() => {
    const overdue = appsWithSLA.filter(a => a._slaInfo.isOverdue);
    const critical = appsWithSLA.filter(a => (a._slaInfo.daysLate || 0) > 15);
    const completedThisMonth = appsWithSLA.filter(a => {
      if (a.currentStep !== 'Hoan_Tat') return false;
      if (!a.customerHandoverDate) return false;
      const d = new Date(a.customerHandoverDate);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    return {
      total: appsWithSLA.length,
      overdue: overdue.length,
      critical: critical.length,
      completedMonth: completedThisMonth.length,
    };
  }, [appsWithSLA]);

  // ── Dữ liệu heatmap theo giai đoạn tiến độ ────────────────────────────────
  const stageStats = useMemo(() => {
    return PROGRESS_STAGES.map(stage => {
      const stageApps = appsWithSLA.filter(a => stage.steps.includes(a.currentStep));
      const overdueApps = stageApps.filter(a => a._slaInfo.isOverdue);
      const avgDays =
        stageApps.length > 0
          ? stageApps.reduce((sum, a) => sum + (a._slaInfo.daysLate || 0), 0) / stageApps.length
          : 0;
      const maxCount = Math.max(...PROGRESS_STAGES.map(s =>
        appsWithSLA.filter(a => s.steps.includes(a.currentStep)).length
      ), 1);
      return {
        ...stage,
        count: stageApps.length,
        overdueCount: overdueApps.length,
        avgDaysLate: parseFloat(avgDays.toFixed(1)),
        barPct: Math.round((stageApps.length / maxCount) * 100),
        isCritical: overdueApps.length > 0 && (overdueApps.length / stageApps.length) > 0.4,
      };
    }).filter(s => s.count > 0);
  }, [appsWithSLA]);

  // ── Tổng hợp theo từng dự án (tầng 1 — tổng quan) ────────────────────────
  const projectStats = useMemo(() => {
    return projects.map(proj => {
      const projApps = deptApps.filter(a => a.projectName === proj.name);
      const withSLA = projApps.map(a => ({
        ...a,
        _slaInfo: calculateSLA(a, stepConfig, slaConfig),
      }));
      const overdueApps = withSLA.filter(a => a._slaInfo.isOverdue);
      const criticalApps = withSLA.filter(a => (a._slaInfo.daysLate || 0) > 15);
      // Tìm bottleneck: giai đoạn có nhiều hồ sơ trễ nhất
      const bottleneck = PROGRESS_STAGES.reduce(
        (best, stage) => {
          const cnt = overdueApps.filter(a => stage.steps.includes(a.currentStep)).length;
          return cnt > best.cnt ? { label: stage.label, cnt } : best;
        },
        { label: '', cnt: 0 }
      );
      return {
        id: proj.id,
        name: proj.name,
        total: projApps.length,
        overdueCount: overdueApps.length,
        criticalCount: criticalApps.length,
        bottleneck: bottleneck.label || '—',
        healthPct: projApps.length > 0 ? Math.round(((projApps.length - overdueApps.length) / projApps.length) * 100) : 100,
      };
    }).filter(p => p.total > 0);
  }, [projects, deptApps, stepConfig, slaConfig]);

  // ── Danh sách drill-down tầng 3 ──────────────────────────────────────────
  const drillApps = useMemo(() => {
    if (!selectedStageKey) return [];
    const stage = PROGRESS_STAGES.find(s => s.key === selectedStageKey);
    if (!stage) return [];
    return appsWithSLA
      .filter(a => stage.steps.includes(a.currentStep))
      .sort((a, b) => (b._slaInfo.daysLate || 0) - (a._slaInfo.daysLate || 0));
  }, [appsWithSLA, selectedStageKey]);

  const totalPages = Math.ceil(drillApps.length / PAGE_SIZE);
  const pagedApps = drillApps.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // ── Helpers UI ────────────────────────────────────────────────────────────
  const light = theme === 'light';
  const card = cn(
    'rounded-2xl border p-5 transition-all',
    light ? 'bg-white border-slate-200' : 'bg-slate-900/50 border-slate-800'
  );
  const muted = light ? 'text-slate-500' : 'text-slate-400';
  const strong = light ? 'text-slate-900' : 'text-white';

  function deptBadge(dept: string) {
    const map: Record<string, string> = {
      PTT: 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20',
      KT: 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
      PTDA: 'bg-teal-500/10 text-teal-600 border border-teal-500/20',
    };
    return cn('px-2 py-0.5 rounded-lg text-[10px] font-black uppercase', map[dept] || 'bg-slate-500/10 text-slate-500');
  }

  function urgencyBadge(daysLate: number) {
    if (daysLate > 15) return 'bg-rose-500/10 text-rose-600 border border-rose-500/20';
    if (daysLate > 5) return 'bg-amber-500/10 text-amber-600 border border-amber-500/20';
    return 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20';
  }

  // ── Render: đang ở tầng 3 (drill-down hồ sơ) ────────────────────────────
  if (selectedStageKey) {
    const stageInfo = PROGRESS_STAGES.find(s => s.key === selectedStageKey)!;
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setSelectedStageKey(null); setPage(0); }}
            className={cn('flex items-center gap-1 text-xs font-black uppercase tracking-widest transition-all', muted, 'hover:text-indigo-500')}
          >
            <ChevronLeft size={14} /> Quay lại
          </button>
          <span className={cn('text-sm font-black uppercase tracking-widest', strong)}>{stageInfo.label}</span>
          <span className={deptBadge(stageInfo.dept)}>{stageInfo.dept}</span>
          <span className="ml-auto text-[10px] font-black text-slate-500 uppercase">{drillApps.length} hồ sơ</span>
        </div>

        {/* Bảng hồ sơ */}
        <div className={card}>
          <div className="grid grid-cols-[1fr_1fr_90px_70px_90px] gap-3 pb-3 border-b border-slate-800 mb-1">
            {['Mã hồ sơ', 'Dự án', 'Vào bước', 'Trễ', 'Trạng thái'].map(h => (
              <span key={h} className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</span>
            ))}
          </div>
          {pagedApps.length === 0 && (
            <p className={cn('text-xs italic py-4 text-center', muted)}>Không có hồ sơ nào ở giai đoạn này.</p>
          )}
          {pagedApps.map((app, index) => {
            const late = app._slaInfo.daysLate || 0;
            return (
              <div key={`sla-app-${app.id || 'none'}-${index}`} className="grid grid-cols-[1fr_1fr_90px_70px_90px] gap-3 py-3 border-b border-slate-800/50 last:border-0 items-center">
                <span className={cn('text-xs font-black', strong)}>{app.unitCode || app.id}</span>
                <span className={cn('text-xs truncate', muted)}>{app.projectName}</span>
                <span className={cn('text-xs', muted)}>{(app as any).stepEntryDate || '—'}</span>
                <span className={cn('text-xs font-black', late > 0 ? (late > 15 ? 'text-rose-500' : 'text-amber-500') : 'text-emerald-500')}>
                  {late > 0 ? `+${late} ngày` : 'Đúng hạn'}
                </span>
                <span className={cn('px-2 py-0.5 rounded-lg text-[10px] font-black border text-center', urgencyBadge(late))}>
                  {late > 15 ? 'Cần xử lý' : late > 0 ? 'Theo dõi' : 'Bình thường'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Phân trang */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
              className={cn('p-1 rounded-lg transition-all', page === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-800')}>
              <ChevronLeft size={16} className={muted} />
            </button>
            <span className={cn('text-xs font-black', muted)}>Trang {page + 1} / {totalPages}</span>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
              className={cn('p-1 rounded-lg transition-all', page >= totalPages - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-800')}>
              <ChevronRight size={16} className={muted} />
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Render: tầng 1 + 2 (tổng quan + heatmap) ─────────────────────────────
  return (
    <div className="space-y-8">

      {/* ── Tầng 1: KPI + header dự án ── */}
      <div>
        {/* Selector dự án */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <button
            onClick={() => setSelectedProjectId(null)}
            className={cn(
              'px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border',
              !selectedProjectId
                ? 'bg-indigo-500 text-white border-transparent'
                : cn('border-slate-700', muted, 'hover:border-slate-500')
            )}
          >
            Tất cả dự án
          </button>
          {projects.filter(p => deptApps.some(a => a.projectName === p.name)).map((proj, index) => (
            <button
              key={`sla-proj-${proj.id || 'none'}-${index}`}
              onClick={() => setSelectedProjectId(proj.id)}
              className={cn(
                'px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border',
                selectedProjectId === proj.id
                  ? 'bg-indigo-500 text-white border-transparent'
                  : cn('border-slate-700', muted, 'hover:border-slate-500')
              )}
            >
              {proj.name}
            </button>
          ))}
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Đang xử lý', val: kpi.total, color: strong },
            { label: 'Trễ SLA', val: kpi.overdue, color: kpi.overdue > 0 ? 'text-rose-500' : 'text-emerald-500' },
            { label: 'Trễ > 15 ngày', val: kpi.critical, color: kpi.critical > 0 ? 'text-amber-500' : 'text-emerald-500' },
            { label: 'Hoàn tất tháng', val: kpi.completedMonth, color: 'text-indigo-500' },
          ].map((k, index) => (
            <div key={`sla-kpi-${k.label}-${index}`} className={cn(card, 'text-center')}>
              <p className={cn('text-3xl font-black italic tracking-tighter', k.color)}>{k.val}</p>
              <p className={cn('text-[10px] font-black uppercase tracking-widest mt-1', muted)}>{k.label}</p>
            </div>
          ))}
        </div>

        {/* Cards tóm tắt theo dự án (chỉ hiện khi xem tất cả) */}
        {!selectedProjectId && projectStats.length > 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
            {projectStats.map((ps, index) => (
              <button
                key={`sla-ps-${ps.id || 'none'}-${index}`}
                onClick={() => setSelectedProjectId(ps.id)}
                className={cn(card, 'text-left hover:border-indigo-500/50 cursor-pointer w-full')}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={cn('text-xs font-black', strong)}>{ps.name}</span>
                  {ps.overdueCount > 0
                    ? <span className="px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[10px] font-black">{ps.overdueCount} trễ SLA</span>
                    : <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-black">Đúng hạn</span>
                  }
                </div>
                {/* Health bar */}
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${ps.healthPct}%`,
                      background: ps.healthPct > 80 ? '#10b981' : ps.healthPct > 50 ? '#f59e0b' : '#ef4444'
                    }}
                  />
                </div>
                <div className="flex gap-3 text-[10px]">
                  <span className={muted}>Tổng: <b className={strong}>{ps.total}</b></span>
                  {ps.criticalCount > 0 && <span className="text-amber-500">⚠ {ps.criticalCount} nguy cơ cao</span>}
                  {ps.bottleneck !== '—' && <span className={muted} style={{marginLeft:'auto'}}>Kẹt: <b className={strong}>{ps.bottleneck}</b></span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Tầng 2: Heatmap giai đoạn tiến độ ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={cn('text-sm font-black uppercase tracking-widest', strong)}>Tiến độ theo giai đoạn</h3>
            <p className={cn('text-[10px] mt-1 italic', muted)}>
              {myDept ? `Hiển thị giai đoạn bộ phận ${myDept} phụ trách — ` : ''}
              Click vào giai đoạn để xem danh sách hồ sơ cụ thể
            </p>
          </div>
          {myDept && (
            <span className={deptBadge(myDept)}>{myDept}</span>
          )}
        </div>

        <div className={card}>
          {stageStats.length === 0 && (
            <p className={cn('text-xs italic text-center py-4', muted)}>Không có hồ sơ nào trong phạm vi này.</p>
          )}
          {/* Header */}
          {stageStats.length > 0 && (
            <div className="grid grid-cols-[1fr_140px_70px_65px] gap-3 pb-3 border-b border-slate-800 mb-1">
              {['Giai đoạn / Bộ phận', 'Số hồ sơ đang kẹt', 'Trễ SLA', 'Avg trễ'].map(h => (
                <span key={h} className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</span>
              ))}
            </div>
          )}

          {stageStats.map((stage, idx) => (
            <button
              key={`sla-stage-${stage.key || 'stage'}-${idx}`}
              onClick={() => { setSelectedStageKey(stage.key); setPage(0); }}
              className={cn(
                'w-full grid grid-cols-[1fr_140px_70px_65px] gap-3 py-3 border-b border-slate-800/50 last:border-0 items-center',
                'hover:bg-slate-800/30 transition-all rounded-lg px-2 -mx-2 cursor-pointer text-left'
              )}
            >
              {/* Tên giai đoạn */}
              <div className="flex items-center gap-2">
                {stage.isCritical && <AlertTriangle size={12} className="text-rose-500 flex-shrink-0" />}
                <div>
                  <span className={cn('text-xs font-black', strong)}>{stage.label}</span>
                  <div className="mt-0.5">
                    <span className={deptBadge(stage.dept)}>{stage.dept}</span>
                  </div>
                </div>
              </div>

              {/* Bar */}
              <div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${stage.barPct}%`,
                      background: stage.isCritical ? '#ef4444' : stage.overdueCount > 0 ? '#f59e0b' : '#6366f1'
                    }}
                  />
                </div>
                <span className={cn('text-[10px] mt-0.5 block', muted)}>{stage.count} hồ sơ</span>
              </div>

              {/* Trễ SLA */}
              <span className={cn(
                'text-xs font-black text-right',
                stage.overdueCount > 0 ? (stage.isCritical ? 'text-rose-500' : 'text-amber-500') : 'text-slate-500'
              )}>
                {stage.overdueCount > 0 ? `${stage.overdueCount}/${stage.count}` : '—'}
              </span>

              {/* Avg */}
              <span className={cn(
                'text-xs font-black text-right',
                stage.avgDaysLate > 10 ? 'text-rose-500' : stage.avgDaysLate > 5 ? 'text-amber-500' : muted
              )}>
                {stage.avgDaysLate > 0 ? `${stage.avgDaysLate}ng` : '—'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
