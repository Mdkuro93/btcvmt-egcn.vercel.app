import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, LabelList,
  PieChart, Pie
} from 'recharts';
import { Application } from '../types';
import { cn } from '../lib/utils';

interface DashboardChartsProps {
  theme: 'light' | 'dark';
  chartData: any[];
  pieData: any[];
  onChartClick: (status: string) => void;
}

export default function DashboardCharts({ 
  theme, 
  chartData,
  pieData,
  onChartClick 
}: DashboardChartsProps) {
  
  const totalUnits = useMemo(() => pieData.reduce((acc, curr) => acc + curr.value, 0), [pieData]);
  
  return (
    <div className={cn(
      "p-6 rounded-[2rem] border transition-all relative overflow-hidden",
      theme === 'dark' ? "bg-slate-900/40 border-white/5 shadow-2xl" : "bg-white/70 border-slate-200/60 shadow-xl backdrop-blur-xl shadow-indigo-100/50"
    )}>
      {theme === 'light' && (
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/50 via-transparent to-transparent opacity-50" />
      )}
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className={cn("text-lg font-black uppercase tracking-tight", theme === 'dark' ? "text-white" : "text-slate-800")}>Tiến độ pháp lý</h2>
          <div className="flex items-center gap-3 mt-1">
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Phân bổ theo giai đoạn thực tế</p>
             <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                   <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Sai sót</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 h-[450px]">
          <ResponsiveContainer width="100%" height={450}>
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 20, right: 60, left: 20, bottom: 5 }}
              onClick={(data) => {
                if (data && data.activeLabel) onChartClick(String(data.activeLabel));
              }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={theme === 'dark' ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"} />
              <XAxis 
                type="number" 
                hide 
                domain={[0, (dataMax: number) => Math.ceil(dataMax + dataMax * 0.15) || 10]} 
              />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={140}
                axisLine={false}
                tickLine={false}
                tick={{ 
                    fill: theme === 'dark' ? '#94a3b8' : '#334155', 
                    fontSize: 10, 
                    fontWeight: 800,
                    letterSpacing: '0.025em'
                }}
              />
              <Tooltip 
                cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className={cn(
                        "p-3 rounded-2xl border shadow-xl backdrop-blur-md",
                        theme === 'dark' ? "bg-slate-950/90 border-slate-800 text-white" : "bg-white/90 border-slate-200 text-slate-900"
                      )}>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-2 border-b border-white/5 pb-1">{label}</p>
                        <div className="space-y-1">
                          <div className="flex justify-between gap-4">
                            <span className="text-[10px] text-slate-500 font-bold">Bình thường:</span>
                            <span className="text-[10px] font-black">{(payload[0].value || 0)}</span>
                          </div>
                          {payload[1] && (
                            <div className="flex justify-between gap-4">
                              <span className="text-[10px] text-rose-500 font-bold">Sai sót:</span>
                              <span className="text-[10px] font-black text-rose-500">{(payload[1].value || 0)}</span>
                            </div>
                          )}
                          <div className="flex justify-between gap-4 pt-1 border-t border-white/5 mt-1">
                            <span className="text-[10px] font-black uppercase">Tổng:</span>
                            <span className="text-[11px] font-black">{((payload[0].value as number) + (payload[1]?.value as number || 0))}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="normal" 
                stackId="a" 
                barSize={24} 
                radius={[0, 0, 0, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-normal-${index}`} fill={entry.color} />
                ))}
              </Bar>
              <Bar 
                dataKey="error" 
                stackId="a" 
                barSize={24} 
                radius={[0, 12, 12, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-error-${index}`} fill="#ef4444" />
                ))}
                <LabelList 
                  dataKey="value" 
                  position="right" 
                  offset={15} 
                  content={(props: any) => {
                     const { x, y, width, height, value } = props;
                     return (
                        <text 
                           x={x + width + 10} 
                           y={y + height / 2 + 5} 
                           fill={theme === 'dark' ? '#f8fafc' : '#1e293b'} 
                           fontSize="12" 
                           fontWeight="900"
                           textAnchor="start"
                        >
                           {value}
                        </text>
                     );
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="h-[450px] flex flex-col items-center">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 w-full text-center py-2 border-y border-white/5">Tỉ trọng dự án</h3>
          {pieData && pieData.length > 0 ? (
          <div className="flex-1 w-full relative">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
                    />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                      fontSize: '11px',
                      fontWeight: 'bold'
                   }} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">Tổng cộng</p>
                <p className={cn("text-xl font-black mt-1", theme === 'dark' ? "text-white" : "text-slate-800")}>
                   {totalUnits}
                </p>
            </div>
          </div>
          ) : (
            <p className="text-[9px] italic opacity-40 text-center mt-4">Không có dữ liệu</p>
          )}
          <div className={cn(
             "mt-6 w-full grid grid-cols-2 gap-x-6 gap-y-3 p-4 rounded-2xl",
             theme === 'dark' ? "bg-slate-950/20" : "bg-slate-100/30"
          )}>
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
                  <span className={cn("text-[9px] font-black uppercase tracking-tight truncate", theme === 'dark' ? "text-slate-400" : "text-slate-600")}>{entry.name}</span>
                </div>
                <span className={cn("text-[11px] font-black ml-3.5", theme === 'dark' ? "text-slate-200" : "text-slate-800")}>{entry.value} <span className="text-[8px] text-slate-500 uppercase">Căn</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
