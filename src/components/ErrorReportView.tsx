import React, { useMemo, useState } from 'react';
import { 
  AlertTriangle, ShieldAlert, CheckCircle2, 
  BarChart2, PieChart as PieIcon, Layers, FileText,
  AlertCircle, ChevronRight, Activity, TrendingUp
} from 'lucide-react';
import { Application } from '../types';
import { cn } from '../lib/utils';
import { 
  buildErrorSummary, 
  buildSeverityStats, 
  buildMatrix, 
  buildStepStats,
  getActiveErrors,
  getAllErrors
} from '../utils/reportUtils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as ReTooltip, ResponsiveContainer, Cell, Legend,
  PieChart, Pie, AreaChart, Area
} from 'recharts';


interface ErrorReportViewProps {
  applications: Application[];
  theme?: 'light' | 'dark';
}

export default function ErrorReportView({ applications, theme = 'light' }: ErrorReportViewProps) {
  const [mode, setMode] = useState<'LIVE' | 'HISTORY'>('LIVE');

  // Pre-process and normalize applications with default fallbacks for legacy records
  const normalizedApps = useMemo(() => {
    return applications.map(app => {
      const hasActiveError = app.status === 'Error' || (app.issueType && app.issueType !== 'None');
      const status = hasActiveError ? 'OPEN' : 'RESOLVED';
      
      return {
        ...app,
        issueStatus: app.issueStatus || status as 'OPEN' | 'RESOLVED',
        issueType: app.issueType || 'None',
        issueSeverity: app.issueSeverity || 'Minor',
        issueNotes: app.issueNotes || '',
      };
    });
  }, [applications]);

  // Select target dataset based on current report mode using custom filters
  const filteredReportApps = useMemo(() => {
    if (mode === 'LIVE') {
      return getActiveErrors(normalizedApps);
    } else {
      return getAllErrors(normalizedApps);
    }
  }, [normalizedApps, mode]);

  // Pre-process applications for reportUtils compatibility
  const mappedAppsForIssues = useMemo(() => {
    return filteredReportApps
      .map(app => {
        let severityEng: 'High' | 'Medium' | 'Low' = 'Low';
        const sev = app.issueSeverity || 'Minor';
        if (sev === 'Critical' || (sev as any) === 'High' || (sev as any) === 'Nghiêm trọng' || (sev as any) === 'Cao') {
          severityEng = 'High';
        } else if (sev === 'Moderate' || (sev as any) === 'Medium' || (sev as any) === 'Trung bình') {
          severityEng = 'Medium';
        } else {
          severityEng = 'Low';
        }
        return {
          ...app,
          issueType: app.issueType || 'Khác',
          issueSeverity: severityEng as any,
          currentStep: app.currentStep || '',
        };
      });
  }, [filteredReportApps]);

  // Compute stats using reportUtils helpers
  const errorSummary = useMemo(() => buildErrorSummary(mappedAppsForIssues), [mappedAppsForIssues]);
  const severityStats = useMemo(() => buildSeverityStats(mappedAppsForIssues), [mappedAppsForIssues]);
  const stepStats = useMemo(() => buildStepStats(mappedAppsForIssues), [mappedAppsForIssues]);
  const matrix = useMemo(() => buildMatrix(mappedAppsForIssues), [mappedAppsForIssues]);

  // Total statistics
  const totalIssuesCount = mappedAppsForIssues.length;
  const highSeverityCount = mappedAppsForIssues.filter(app => (app.issueSeverity as any) === 'High').length;
  const mediumSeverityCount = mappedAppsForIssues.filter(app => (app.issueSeverity as any) === 'Medium').length;
  const lowSeverityCount = mappedAppsForIssues.filter(app => (app.issueSeverity as any) === 'Low').length;

  // Format data for Recharts
  const severityChartData = useMemo(() => {
    return [
      { name: 'Nghiêm trọng/Cao', value: severityStats.High || 0, color: '#f43f5e' },
      { name: 'Trung bình', value: severityStats.Medium || 0, color: '#f59e0b' },
      { name: 'Thấp', value: severityStats.Low || 0, color: '#10b981' }
    ].filter(d => d.value > 0);
  }, [severityStats]);

  const typeChartData = useMemo(() => {
    return Object.entries(errorSummary).map(([key, value]) => ({
      name: key,
      value: Number(value)
    })).sort((a, b) => b.value - a.value);
  }, [errorSummary]);

  const stepChartData = useMemo(() => {
    const labels: Record<string, string> = {
      KT: 'Kế toán Thuế',
      VPDK: 'Nộp VPĐK',
      TAX: 'Thông báo Thuế',
      GCN: 'Phê duyệt GCN',
      OTHER: 'Các bước khác'
    };
    return Object.entries(stepStats).map(([key, value]) => ({
      name: labels[key] || key,
      value
    }));
  }, [stepStats]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      {/* Control Toggle for Error Mode */}
      <div className={cn(
        "flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 rounded-2xl border gap-4 transition-all shadow-md",
        theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-800" : "bg-slate-900 border-slate-850 text-slate-200"
      )}>
        <div className="flex gap-2">
          <button
            onClick={() => setMode('LIVE')}
            className={cn(
              "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border",
              mode === 'LIVE'
                ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                : theme === 'light' ? "bg-white border-slate-200 text-slate-500 hover:border-slate-300" : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
            )}
          >
            <Activity size={12} className={mode === 'LIVE' ? "text-white animate-pulse" : "text-indigo-400"} />
            Lỗi hiện tại (Live)
          </button>
          <button
            onClick={() => setMode('HISTORY')}
            className={cn(
              "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border",
              mode === 'HISTORY'
                ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                : theme === 'light' ? "bg-white border-slate-200 text-slate-500 hover:border-slate-300" : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
            )}
          >
            <TrendingUp size={12} className={mode === 'HISTORY' ? "text-white" : "text-amber-400"} />
            Lịch sử lỗi (History)
          </button>
        </div>
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-3">
          {mode === 'LIVE' 
            ? `Đang hiển thị ${mappedAppsForIssues.length} sự vụ lỗi chưa khắc phục` 
            : `Đang phân tích tổng cộng ${mappedAppsForIssues.length} sự vụ sai sót (lịch sử + hiện hành)`
          }
        </div>
      </div>

      {/* Top Warning banner / overall overview if there are high-severity errors */}
      {highSeverityCount > 0 && (
        <div className={cn(
          "p-5 rounded-[2rem] border flex items-center justify-between gap-4 shadow-lg animate-pulse",
          theme === 'light' ? "bg-rose-50 border-rose-100 text-rose-800" : "bg-rose-950/20 border-rose-500/20 text-rose-300"
        )}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-500">
              <ShieldAlert size={20} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider">Cảnh báo rủi ro vận hành bổ sung</p>
              <p className="text-[11px] font-medium opacity-80 mt-0.5">Phát hiện {highSeverityCount} lỗi có mức độ nghiêm trọng cao cần xử lý khẩn cấp.</p>
            </div>
          </div>
        </div>
      )}

      {/* Grid of Key Performance Indicators (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={cn(
          "p-6 rounded-[2rem] border flex items-center gap-4 transition-all shadow-xl", 
          theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-800/60"
        )}>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Tổng lỗi sai sót</p>
            <p className={cn("text-2xl font-black italic", theme === 'light' ? "text-slate-900" : "text-white")}>
              {totalIssuesCount} <span className="text-xs font-normal text-slate-500">hồ sơ</span>
            </p>
          </div>
        </div>

        <div className={cn(
          "p-6 rounded-[2rem] border flex items-center gap-4 transition-all shadow-xl", 
          theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-800/60"
        )}>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
            <ShieldAlert size={24} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Nghiêm trọng / Cao</p>
            <p className={cn("text-2xl font-black italic text-rose-500")}>
              {highSeverityCount} <span className="text-xs font-normal text-slate-500">hồ sơ</span>
            </p>
          </div>
        </div>

        <div className={cn(
          "p-6 rounded-[2rem] border flex items-center gap-4 transition-all shadow-xl", 
          theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-800/60"
        )}>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Trung bình</p>
            <p className={cn("text-2xl font-black italic text-amber-500")}>
              {mediumSeverityCount} <span className="text-xs font-normal text-slate-500">hồ sơ</span>
            </p>
          </div>
        </div>

        <div className={cn(
          "p-6 rounded-[2rem] border flex items-center gap-4 transition-all shadow-xl", 
          theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-800/60"
        )}>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Mức độ Thấp</p>
            <p className={cn("text-2xl font-black italic text-emerald-500")}>
              {lowSeverityCount} <span className="text-xs font-normal text-slate-500">hồ sơ</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Severity & Distribution Breakdown */}
        <div className={cn(
          "p-8 rounded-[2.5rem] border shadow-2xl relative overflow-hidden",
          theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900/40 border-slate-800"
        )}>
          <h3 className={cn("text-sm font-black uppercase tracking-widest mb-6", theme === 'light' ? "text-slate-800" : "text-slate-200")}>Phân bộ mức độ nghiêm trọng</h3>
          <div className="h-[280px] w-full relative flex items-center justify-center">
            {severityChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={severityChartData}
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={6}
                    dataKey="value"
                    stroke="none"
                  >
                    {severityChartData.map((entry, index) => (
                      <Cell key={`err-severity-cell-item-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ReTooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className={cn(
                            "p-3 rounded-xl border shadow-xl backdrop-blur-md",
                            theme === 'light' ? "bg-white/95 border-slate-200 text-slate-800" : "bg-slate-900/95 border-slate-800 text-white"
                          )}>
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                              <span className="text-[10px] font-black uppercase tracking-tight">{data.name}</span>
                            </div>
                            <div className="flex justify-between items-center gap-4">
                              <span className="text-[9px] text-slate-500 font-bold uppercase">Số lượng:</span>
                              <span className="text-xs font-black italic">{data.value} HS</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-500 italic">Không có dữ liệu lỗi</p>
            )}
            <div className="absolute top-[40%] text-center pointer-events-none">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Tổng sự vụ</p>
              <p className={cn("text-2xl font-black italic", theme === 'light' ? "text-slate-900" : "text-white")}>{totalIssuesCount}</p>
            </div>
          </div>
        </div>

        {/* Breakdown by Error Category Group */}
        <div className={cn(
          "p-8 rounded-[2.5rem] border shadow-2xl relative overflow-hidden",
          theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900/40 border-slate-800"
        )}>
          <h3 className={cn("text-sm font-black uppercase tracking-widest mb-6", theme === 'light' ? "text-slate-800" : "text-slate-200")}>Phân nhóm Sai sót chính</h3>
          <div className="h-[280px] w-full">
            {typeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={typeChartData} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={9} width={120} axisLine={false} tickLine={false} />
                  <ReTooltip 
                    cursor={{ fill: 'rgba(99,102,241,0.03)' }}
                    contentStyle={{ 
                      backgroundColor: theme === 'light' ? '#fff' : '#0f172a', 
                      border: 'none', 
                      borderRadius: '16px',
                      fontSize: '11px'
                    }}
                  />
                  <Bar dataKey="value" name="Số hồ sơ" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={16}>
                    {typeChartData.map((entry, index) => (
                      <Cell key={`err-type-cell-item-${index}`} fill={index === 0 ? '#ef4444' : index === 1 ? '#f59e0b' : '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-500 italic flex items-center justify-center h-full">Không có dữ liệu loại sai sót</p>
            )}
          </div>
        </div>
      </div>

      {/* Matrix correlation with heatmap styling */}
      <div className={cn(
        "p-8 rounded-[2.5rem] border shadow-2xl overflow-hidden",
        theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900/40 border-slate-800"
      )}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className={cn("text-sm font-black uppercase tracking-widest", theme === 'light' ? "text-slate-800" : "text-slate-200")}>Ma trận tương quan (Loại lỗi vs Mức độ)</h3>
            <p className="text-[10px] text-slate-500 mt-1">Sự phối hợp phân tích phân bố mật độ sai sót toàn diện.</p>
          </div>
          <Activity size={18} className="text-indigo-500" />
        </div>

        <div className="overflow-x-auto rounded-2xl">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className={theme === 'light' ? "bg-slate-50 border-b border-slate-200" : "bg-slate-950/40 border-b border-slate-800"}>
                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Loại sai sót</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center text-rose-500">Cao / Nghiêm trọng</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center text-amber-500">Trung bình</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center text-emerald-500">Thấp</th>
              </tr>
            </thead>
            <tbody className={cn("divide-y", theme === 'light' ? "divide-slate-100" : "divide-slate-800/40")}>
              {Object.keys(errorSummary).length > 0 ? (
                Object.keys(errorSummary).map((type, idx) => {
                  const high = matrix[type]?.['High'] || 0;
                  const med = matrix[type]?.['Medium'] || 0;
                  const low = matrix[type]?.['Low'] || 0;

                  return (
                    <tr key={`error-matrix-row-${type}-${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="px-5 py-4">
                        <span className={cn("text-xs font-black", theme === 'light' ? "text-slate-800" : "text-slate-200")}>{type}</span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={cn(
                          "px-2.5 py-1 rounded-xl text-xs font-black transition-all inline-block min-w-[32px]", 
                          high > 0 
                            ? "bg-rose-500/10 text-rose-500 font-extrabold" 
                            : "text-slate-400 opacity-30 font-medium"
                        )}>
                          {high}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={cn(
                          "px-2.5 py-1 rounded-xl text-xs font-black transition-all inline-block min-w-[32px]", 
                          med > 0 
                            ? "bg-amber-500/10 text-amber-500 font-extrabold" 
                            : "text-slate-400 opacity-30 font-medium"
                        )}>
                          {med}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={cn(
                          "px-2.5 py-1 rounded-xl text-xs font-black transition-all inline-block min-w-[32px]", 
                          low > 0 
                            ? "bg-emerald-500/10 text-emerald-500 font-extrabold" 
                            : "text-slate-400 opacity-30 font-medium"
                        )}>
                          {low}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-xs text-slate-500 italic">Ma trận trống</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Step and stage breakdown chart */}
      <div className={cn(
        "p-8 rounded-[2.5rem] border shadow-2xl relative overflow-hidden",
        theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900/40 border-slate-800"
      )}>
        <h3 className={cn("text-sm font-black uppercase tracking-widest mb-6", theme === 'light' ? "text-slate-800" : "text-slate-200")}>Sự phân bố sai sót tại các chặng</h3>
        <div className="h-[250px] w-full">
          {stepChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stepChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? "#e2e8f0" : "#ffffff10"} vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <ReTooltip cursor={{ fill: 'rgba(99,102,241,0.02)' }} />
                <Bar dataKey="value" name="Sai sót chặng" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={28}>
                  {stepChartData.map((entry, index) => (
                    <Cell key={`err-step-cell-item-${index}`} fill={index % 2 === 0 ? '#8b5cf6' : '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-slate-500 italic flex items-center justify-center h-full">Không có dữ liệu chặng sai sót</p>
          )}
        </div>
      </div>

      {/* Detailed list of applications containing unresolved issues */}
      <div className={cn(
        "p-8 rounded-[2.5rem] border shadow-2xl relative overflow-hidden",
        theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900/40 border-slate-800"
      )}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className={cn("text-sm font-black uppercase tracking-widest", theme === 'light' ? "text-slate-800" : "text-slate-200")}>
              {mode === 'LIVE' ? "Danh sách chi tiết hồ sơ có sai sót (Đang mở)" : "Lịch sử chi tiết sai sót & vướng mắc"}
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">
              {mode === 'LIVE' 
                ? "Theo dõi tình trạng ghi chú và mức độ ảnh hưởng của từng hồ sơ chưa qua xử lý." 
                : "Bản phân tích lưu trữ cho phép đối chiếu tỷ lệ lỗi và vướng nghẽn vận hành."
              }
            </p>
          </div>
          <span className={cn(
            "px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider",
            mode === 'LIVE' ? "bg-rose-500/10 text-rose-500" : "bg-indigo-500/10 text-indigo-500"
          )}>
            {mappedAppsForIssues.length} Sự cố {mode === 'LIVE' ? "chưa xử lý" : "trong lịch sử"}
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200/60 dark:border-slate-800/40">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className={theme === 'light' ? "bg-slate-50/80 border-b border-slate-200" : "bg-slate-950/40 border-b border-slate-800"}>
                <th className="px-5 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Mã lô/căn & Dự án</th>
                <th className="px-5 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Khách hàng</th>
                <th className="px-5 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Loại sai sót</th>
                <th className="px-5 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Trạng thái</th>
                <th className="px-5 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Độ nghiêm trọng</th>
                <th className="px-5 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Ghi chú sự vụ</th>
              </tr>
            </thead>
            <tbody className={cn("divide-y divide-slate-100/70 dark:divide-slate-850/40", theme === 'light' ? 'bg-white' : '')}>
              {mappedAppsForIssues.length > 0 ? (
                mappedAppsForIssues.map((app, index) => (
                  <tr 
                    key={`${app.id || 'issue-row'}-${index}`} 
                    className="hover:bg-indigo-50/10 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <p className={cn("text-xs font-bold", theme === 'light' ? "text-slate-900" : "text-slate-100")}>{app.unitCode}</p>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">{app.projectName}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className={cn("text-xs font-bold", theme === 'light' ? "text-slate-800" : "text-slate-200")}>{app.customerName}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">{app.issueType}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                        app.issueStatus === 'OPEN' 
                          ? "bg-rose-500/10 text-rose-500 border-rose-500/20" 
                          : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      )}>
                        {app.issueStatus === 'OPEN' ? 'Đang mở' : 'Đã xử lý'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
                        (app.issueSeverity as any) === 'High'
                          ? "bg-rose-500/10 text-rose-500" 
                          : (app.issueSeverity as any) === 'Medium'
                            ? "bg-amber-500/10 text-amber-500" 
                            : "bg-emerald-500/10 text-emerald-500"
                      )}>
                        {(app.issueSeverity as any) === 'High' ? 'Nghiêm trọng' : (app.issueSeverity as any) === 'Medium' ? 'Trung bình' : 'Nhẹ'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-[11px] text-slate-500 max-w-[280px] truncate-2-lines line-clamp-2" title={app.issueNotes}>
                        {app.issueNotes || <span className="opacity-30 italic">Chưa cập nhật ghi chú vụ việc</span>}
                      </p>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-xs text-slate-500 italic">
                    Tuyệt vời! Không phát hiện hồ sơ sai sót hoặc rủi ro nào ở thời điểm hiện tại.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
