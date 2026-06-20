import React from 'react';

import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { StatCard } from '../AppSubComponents';
import { 
  Building, Clock, FileText, CheckCircle, AlertTriangle, Play, FastForward, Inbox, ChevronDown, Check, Target, Activity, Zap,
  Building2, MapPin, Layers, Wallet, Filter, AlertCircle, CreditCard, ChevronRight, UserCheck, CheckCircle2, Files, BarChart3
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, Legend, PieChart, Pie, Cell, LabelList 
} from 'recharts';
import DashboardAlerts from '../DashboardAlerts';

export const DashboardTab = ({
  stats: dashboardStatsProps,
  activeTab,
  userRole,
  dashboardApps,
  applications,
  theme,
  dashboardFilter,
  handleDashboardClick,
  monthlySlaData,
  projectPerformance,
  selectedProject,
  setActiveTab,
  setFilterStatus,
  setDashboardFilter,
  setFilterSLAStatus,
  setFilterIssue,
  setSearch,
  projectRegionFilter,
  setProjectRegionFilter,
  REGION_ORDER,
  visibleProjects,
  setSelectedProjectId,
  selectedProjectId,
  isManagement,
  setReportType,
  dashboardTab,
  setDashboardTab,
  showToast
}: any) => {
  const {
    kpis,
    roleKpis,
    stats,
    chartData,
    progressChartData,
    loanPieData,
    overallPieData,
    overallPieTotal,
    loanRatioTotal
  } = dashboardStatsProps || {};

  return (
<>
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-7xl mx-auto space-y-8"
              >
                {/* Role-Based KPI Cards */}
                 {userRole === 'PTT' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard 
                      title="TỔNG SỐ LƯỢNG HỒ SƠ" 
                      value={roleKpis.ptt.totalAllVisibleRecords} 
                      icon={Files} 
                      colorClass="bg-blue-500 shadow-blue-500/40" 
                      delay={0.1} 
                      theme={theme} 
                      isActive={dashboardFilter === 'ALL' || !dashboardFilter}
                      onClick={() => handleDashboardClick('ALL')}
                    />
                    <StatCard 
                      title="HỒ SƠ CẦN XỬ LÝ" 
                      value={dashboardApps.filter((a: any) => a.currentStep === 'S1_ChuanBi' || a.currentStep === 'GD1_ChuanBi').length} 
                      icon={Activity} 
                      colorClass="bg-info shadow-info/40" 
                      delay={0.2} 
                      theme={theme} 
                      isActive={dashboardFilter === 'PTT_PROCESSING'}
                      onClick={() => handleDashboardClick('PTT_PROCESSING')}
                    />
                    <StatCard 
                      title="CHƯA NỘP NVTC" 
                      value={chartData.find(c => c.name === 'CHỜ HOÀN THÀNH NVTC')?.value || 0} 
                      icon={Clock} 
                      colorClass="bg-warning shadow-warning/40" 
                      delay={0.4} 
                      theme={theme} 
                      isActive={dashboardFilter === 'PTT_TAX_PENDING_COMPLETE'}
                      onClick={() => handleDashboardClick('PTT_TAX_PENDING_COMPLETE')}
                    />
                    <StatCard 
                      title="CHỜ BÀN GIAO KHÁCH" 
                      value={chartData.find(c => c.name === 'CHỜ BÀN GIAO')?.value || 0} 
                      icon={UserCheck} 
                      colorClass="bg-purple-500 shadow-purple-500/40" 
                      delay={0.5} 
                      theme={theme} 
                      isActive={dashboardFilter === 'PTT_WAITING_HANDOVER'}
                      onClick={() => handleDashboardClick('PTT_WAITING_HANDOVER')}
                    />
                  </div>
                )}

                {userRole === 'KT' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Tổng số lượng hồ sơ" value={roleKpis.kt.totalAllVisibleRecords} icon={Files} colorClass="bg-blue-500 shadow-blue-500/40" delay={0.1} theme={theme} isActive={dashboardFilter === 'ALL' || !dashboardFilter} onClick={() => handleDashboardClick('ALL')} />
                    <StatCard title="Hồ sơ cần tiếp nhận" value={roleKpis.kt.received} icon={Files} colorClass="bg-info shadow-info/40" delay={0.15} theme={theme} isActive={dashboardFilter === 'KT_NEED_RECEIVE'} onClick={() => handleDashboardClick('KT_NEED_RECEIVE')} />
                    <StatCard title="Hồ sơ đang xử lý" value={roleKpis.kt.processing} icon={Activity} colorClass="bg-cyan-500 shadow-cyan-500/40" delay={0.2} theme={theme} isActive={dashboardFilter === 'KT_PROCESSING'} onClick={() => handleDashboardClick('KT_PROCESSING')} />
                    <StatCard title="Chờ hoàn thành NVTC" value={roleKpis.kt.taxPending} icon={Clock} colorClass="bg-warning shadow-warning/40" delay={0.25} theme={theme} isActive={dashboardFilter === 'KT_TAX_PENDING_COMPLETE'} onClick={() => handleDashboardClick('KT_TAX_PENDING_COMPLETE')} />
                  </div>
                )}

                {userRole === 'PTDA' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    <StatCard title="Tổng số lượng hồ sơ" value={roleKpis.ptda.totalAllVisibleRecords} icon={Files} colorClass="bg-blue-500 shadow-blue-500/40" delay={0.02} theme={theme} isActive={dashboardFilter === 'ALL' || !dashboardFilter} onClick={() => handleDashboardClick('ALL')} />
                    <StatCard title="Hồ sơ cần tiếp nhận" value={roleKpis.ptda.received} icon={Files} colorClass="bg-indigo-500 shadow-indigo-500/40" delay={0.05} theme={theme} isActive={dashboardFilter === 'PTDA_NEED_RECEIVE'} onClick={() => handleDashboardClick('PTDA_NEED_RECEIVE')} />
                    <StatCard title="Đã nộp VPĐK" value={roleKpis.ptda.daNopVPDK} icon={CheckCircle2} colorClass="bg-emerald-500 shadow-emerald-500/40" delay={0.08} theme={theme} isActive={dashboardFilter === 'SUBMITTED_RECENT'} onClick={() => handleDashboardClick('SUBMITTED_RECENT')} />
                    <StatCard title="Chờ TB Thuế" value={roleKpis.ptda.noTax} icon={Clock} colorClass="bg-amber-500 shadow-amber-500/40" delay={0.12} theme={theme} isActive={dashboardFilter === 'WAIT_TAX_NOTICE_OVERDUE'} onClick={() => handleDashboardClick('WAIT_TAX_NOTICE_OVERDUE')} />
                    <StatCard title="Chờ hoàn thành NVTC" value={roleKpis.ptda.noTaxPaid} icon={CheckCircle2} colorClass="bg-warning shadow-warning/40" delay={0.15} theme={theme} isActive={dashboardFilter === 'PTDA_TAX_PENDING_COMPLETE'} onClick={() => handleDashboardClick('PTDA_TAX_PENDING_COMPLETE')} />
                    <StatCard title="CHỜ BÀN GIAO" value={roleKpis.ptda.gcnWaiting} icon={FileText} colorClass="bg-cyan-500 shadow-cyan-500/40" delay={0.2} theme={theme} isActive={dashboardFilter === 'PTDA_WAIT_GCN_SIGN'} onClick={() => handleDashboardClick('PTDA_WAIT_GCN_SIGN')} />
                  </div>
                )}

                 {(isManagement || !userRole) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <StatCard 
                      title="Tổng số hồ sơ đang xử lý" 
                      value={kpis.total} 
                      icon={Building2} 
                      colorClass="bg-indigo-600 shadow-indigo-600/40" 
                      delay={0.1} 
                      theme={theme} 
                      isActive={dashboardFilter === 'PROCESSING_TOTAL'}
                      onClick={() => handleDashboardClick('PROCESSING_TOTAL')}
                    />
                    <StatCard 
                      title="BÁO CÁO TRỄ HẠN" 
                      value={kpis.overdue} 
                      icon={AlertCircle} 
                      colorClass="bg-warning shadow-warning/40" 
                      delay={0.2} 
                      theme={theme} 
                      isActive={dashboardFilter === 'OVERDUE'}
                      onClick={() => {
                        setActiveTab('reports');
                        setReportType('SLA');
                      }}
                    />
                    <StatCard 
                      title="BÁO CÁO SAI SÓT" 
                      value={kpis.error} 
                      icon={AlertCircle} 
                      colorClass="bg-error shadow-error/40" 
                      delay={0.3} 
                      theme={theme} 
                      isActive={dashboardFilter === 'ERROR'}
                      onClick={() => {
                        setActiveTab('reports');
                        setReportType('ERROR');
                      }}
                    />
                    <StatCard 
                      title="BÁO CÁO HỒ SƠ VAY" 
                      value={kpis?.loanCount || 0} 
                      icon={CreditCard} 
                      colorClass="bg-blue-600 shadow-blue-600/40" 
                      delay={0.4} 
                      theme={theme} 
                      isActive={dashboardFilter === 'LOAN'}
                      onClick={() => {
                        setActiveTab('reports');
                        setReportType('LOAN');
                      }}
                    />
                  </div>
                )}

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className={cn(
                    "lg:col-span-3 p-8 rounded-[3rem] border transition-all duration-700 relative overflow-hidden group",
                    theme === 'light' ? "bg-white/70 border-slate-200/60 shadow-2xl shadow-indigo-100/50 backdrop-blur-xl" : "bg-slate-900/40 border-slate-800/50 shadow-2xl"
                  )}>
                    {theme === 'light' && (
                        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/50 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                    )}

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 relative z-10">
                      <div>
                         <h3 className={cn("font-black flex items-center gap-3 text-2xl uppercase tracking-tighter", theme === 'light' ? "text-slate-800" : "text-white")}>
                           <div className="p-2 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                             <BarChart3 size={20} className="text-amber-500" />
                           </div>
                           Thống kê Tiến độ
                         </h3>
                         <div className="flex flex-col gap-1 mt-2">
                            <div className="flex items-center gap-4">
                               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-70">
                                 {dashboardTab === 'ALL' ? 'Phân bổ theo giai đoạn thực tế' :
                                  dashboardTab === 'SELF_SERVICE' ? 'Tiến độ khách tự làm sổ' :
                                  'Tiến độ hồ sơ có gói vay ngân hàng'}
                               </p>
                               <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1.5">
                                     <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)] animate-pulse" />
                                     <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Phát hiện sai sót</span>
                                  </div>
                               </div>
                            </div>
                            {dashboardTab === 'SELF_SERVICE' && (
                              <p className="text-[9px] text-amber-500 font-bold mt-0.5">
                                {dashboardApps.filter(a => a.isSelfService).length} hồ sơ · {dashboardApps.filter(a => a.isSelfService && a.status === 'Completed').length} đã hoàn tất · {dashboardApps.filter(a => a.isSelfService && a.status !== 'Completed').length} đang xử lý
                              </p>
                            )}
                         </div>
                      </div>

                      <div className={cn(
                        "p-1.5 rounded-2xl flex items-center gap-1.5 border self-start md:self-auto",
                        theme === 'light' ? "bg-slate-100 border-slate-200 shadow-sm" : "bg-slate-950/65 border-slate-800/80"
                      )}>
                        <button
                          onClick={() => setDashboardTab('ALL')}
                          className={cn(
                            "px-4 py-1.5 rounded-xl text-xs font-black transition-all duration-300 uppercase tracking-wider flex items-center gap-2",
                            dashboardTab === 'ALL'
                              ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/10 scale-105"
                              : (theme === 'light' ? "text-slate-600 hover:bg-slate-200" : "text-slate-400 hover:bg-slate-900")
                          )}
                        >
                          Tất cả
                          <span className={cn(
                            "px-1.5 py-0.5 rounded-full text-[9px] font-black",
                            dashboardTab === 'ALL' ? "bg-slate-950/20 text-slate-950" : (theme === 'light' ? "bg-slate-200/50 text-slate-600" : "bg-slate-800 text-slate-400")
                          )}>
                            {dashboardApps.length}
                          </span>
                        </button>
                        <button
                          onClick={() => setDashboardTab('SELF_SERVICE')}
                          className={cn(
                            "px-4 py-1.5 rounded-xl text-xs font-black transition-all duration-300 uppercase tracking-wider flex items-center gap-2",
                            dashboardTab === 'SELF_SERVICE'
                              ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/10 scale-105"
                              : (theme === 'light' ? "text-slate-600 hover:bg-slate-200" : "text-slate-400 hover:bg-slate-900")
                          )}
                        >
                          Tự làm sổ
                          <span className={cn(
                            "px-1.5 py-0.5 rounded-full text-[9px] font-black",
                            dashboardTab === 'SELF_SERVICE' ? "bg-slate-950/20 text-slate-950" : "bg-amber-500/20 text-amber-500"
                          )}>
                            {dashboardApps.filter(a => a.isSelfService).length}
                          </span>
                        </button>
                        <button
                          onClick={() => setDashboardTab('LOAN')}
                          className={cn(
                            "px-4 py-1.5 rounded-xl text-xs font-black transition-all duration-300 uppercase tracking-wider flex items-center gap-2",
                            dashboardTab === 'LOAN'
                              ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/10 scale-105"
                              : (theme === 'light' ? "text-slate-600 hover:bg-slate-200" : "text-slate-400 hover:bg-slate-900")
                          )}
                        >
                          Vay vốn
                          <span className={cn(
                            "px-1.5 py-0.5 rounded-full text-[9px] font-black",
                            dashboardTab === 'LOAN' ? "bg-slate-950/20 text-slate-950" : "bg-blue-500/20 text-blue-500"
                          )}>
                            {dashboardApps.filter(a => a.loanStatus === 'Co_Vay').length}
                          </span>
                        </button>
                      </div>
                    </div>
                    <div className="h-[500px] w-full mt-4 relative z-10">
                        <ResponsiveContainer width="100%" height={500}>
                           <BarChart 
                             layout="vertical"
                             data={progressChartData?.map((d: any) => ({ ...d, labelAnchor: 0.01 }))} 
                             margin={{ top: 20, right: 60, left: 10, bottom: 5 }}
                             barGap={0}
                             onClick={(data: any) => {
                               if (data?.activePayload?.length > 0) {
                                 const stageName = data.activePayload[0].payload.name;
                                 handleDashboardClick(stageName);
                                 showToast(`Đang lọc: ${stageName}`, 'info');
                               }
                             }}
                             style={{ cursor: 'pointer' }}
                           >

                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={theme === 'light' ? "#f1f5f9" : "#ffffff08"} />
                            <XAxis type="number" hide domain={[0, (dataMax: number) => Math.ceil(dataMax + (dataMax * 0.1) + 1)]} />
                            <YAxis 
                               type="category"
                               dataKey="name"
                               axisLine={false} 
                               tickLine={false} 
                               width={140}
                               tick={{ fontSize: 11, fill: theme === 'light' ? '#475569' : '#94a3b8', fontWeight: 900, textAnchor: 'start' }} 
                               dx={-130}
                            />
                            <ReTooltip 
                              cursor={{ fill: theme === 'light' ? 'rgba(30, 41, 59, 0.05)' : 'rgba(255,255,255,0.05)' }}
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className={cn(
                                      "p-4 rounded-2xl shadow-2xl border backdrop-blur-xl",
                                      theme === 'light' ? "bg-white/95 border-slate-200 text-slate-800" : "bg-slate-900/95 border-slate-800 text-white"
                                    )}>
                                      <div className="font-black mb-2 uppercase text-[10px] tracking-widest border-b border-indigo-500/20 pb-1.5 flex items-center gap-2">
                                        <div className="w-1.5 h-3 bg-indigo-500 rounded-full" />
                                        {data.name}
                                      </div>
                                      <div className="space-y-1.5">
                                        <div className="flex justify-between gap-8 items-center">
                                          <span className="text-slate-500 font-bold uppercase text-[9px]">Tổng cộng:</span>
                                          <span className={cn("font-black text-lg", theme === 'light' ? "text-indigo-600" : "text-indigo-400")}>
                                            {data.value.toLocaleString()}
                                          </span>
                                        </div>
                                        <div className="flex justify-between gap-8 items-center">
                                          <span className="text-slate-500 font-bold uppercase text-[9px]">Bình thường:</span>
                                          <span className="font-bold text-emerald-500 text-xs">{data.normal.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between gap-8 items-center">
                                          <span className="text-slate-500 font-bold uppercase text-[9px]">Sai sót:</span>
                                          <span className="font-bold text-rose-500 text-xs">{data.error.toLocaleString()}</span>
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
                              minPointSize={5}
                              radius={[0, 0, 0, 0]} 
                            >
                              {progressChartData.map((entry: any, index: number) => (
                                <Cell key={`dashboard-progress-normal-cell-${entry.name || 'unnamed'}-${index}`} fill={entry.color} />
                              ))}

                            </Bar>
                            <Bar 
                              dataKey="error" 
                              stackId="a"
                              fill="#f43f5e"
                              barSize={24} 
                              radius={[0, 12, 12, 0]} 
                              className="shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                            />
                            <Bar dataKey="labelAnchor" stackId="a" fill="transparent" isAnimationActive={false}>
                              <LabelList
                                dataKey="value"
                                position="right"
                                offset={10}
                                style={{
                                  fontSize: 12,
                                  fontWeight: 900,
                                  fill: theme === 'dark' ? '#f8fafc' : '#1e293b'
                                }}
                              />
                            </Bar>
                          </BarChart>
             </ResponsiveContainer>
          </div>
                    </div>

                  <div className="lg:col-span-1 space-y-8">
                    <DashboardAlerts 
                      theme={theme}
                      stats={{
                        loanCount: kpis.loanCount,
                        regularCount: kpis.regularCount,
                        overdueCount: kpis.overdue,
                        errorCount: kpis.error,
                      }}
                      onFilterChange={(filter) => {
                        setActiveTab('applications');
                        setFilterStatus('ALL');
                        setDashboardFilter('ALL');
                        if (filter === 'SLA_OVERDUE') {
                          setFilterSLAStatus('OVERDUE');
                          setFilterIssue('ALL');
                        } else if (filter === 'HAS_ERROR') {
                          setFilterIssue('ERROR');
                          setFilterSLAStatus('ALL');
                        }
                        setSearch('');
                      }}
                    />

                    <div className={cn(
                      "p-8 rounded-[3rem] border transition-all duration-500 relative overflow-hidden group",
                      theme === 'light' ? "bg-[var(--color-bg-secondary)]/80 border-[var(--color-border-subtle)] shadow-md backdrop-blur-xl" : "bg-slate-900/40 border-slate-800/50 shadow-xl"
                    )}>
                      <div>
                        <h3 className={cn("font-black mb-6 font-serif text-sm italic flex items-center gap-3 uppercase tracking-widest", theme === 'light' ? "text-[var(--color-text-primary)]" : "text-white")}>
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                          Tỉ lệ Trạng thái
                        </h3>
                        <div className="h-[180px] w-full relative">
                          <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                              <Pie 
                                data={overallPieData} 
                                cx="50%" 
                                cy="50%" 
                                innerRadius={55} 
                                outerRadius={75} 
                                paddingAngle={6} 
                                dataKey="value"
                                stroke="none"
                              >
                                {overallPieData.map((entry: any, index: number) => (
                                  <Cell 
                                    key={`dashboard-overall-pie-cell-${entry.name || 'unnamed'}-${index}`} 
                                    fill={entry.color} 
                                    className="hover:opacity-80 transition-opacity cursor-pointer outline-none" 
                                  />
                                ))}
                              </Pie>
                              <ReTooltip content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className={cn(
                                       "p-3 rounded-xl text-[10px] font-black border backdrop-blur-md shadow-2xl", 
                                       theme === 'light' ? "bg-white border-slate-200 text-slate-800 shadow-indigo-100" : "bg-slate-900 border-slate-800 text-white"
                                    )}>
                                      <div className="flex items-center gap-2 mb-1">
                                         <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: data.color }} />
                                         {data.name}
                                      </div>
                                      <div className="flex justify-between gap-4">
                                         <span className="opacity-50 font-bold uppercase tracking-tighter">Phần trăm:</span>
                                         <span>{data.percentage}%</span>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">Tổng quy mô</p>
                              <p className={cn("text-xl font-black mt-1", theme === 'dark' ? "text-white" : "text-slate-800")}>
                                 {overallPieTotal}
                              </p>
                          </div>
                        </div>
                      </div>
                    </div>

                      <div className={cn("p-6 rounded-3xl border mt-4 overflow-hidden shadow-sm", theme === 'light' ? "bg-[var(--color-bg-secondary)] border-[var(--color-border-subtle)]" : "bg-slate-900/40 border-slate-800")}>
                         <h3 className={cn("font-bold mb-4 font-serif text-sm italic flex items-center gap-3", theme === 'light' ? "text-[var(--color-text-primary)]" : "text-white")}>
                           <Wallet size={14} className="text-emerald-500" />
                           Thống kê vay vốn
                         </h3>
                         
                          <div className="flex flex-col gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                               {/* Ratio Stats */}
                               <div className="flex flex-col gap-4">
                                  <div className="text-center text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Tỷ lệ Vay / Vốn tự có</div>
                                  {roleKpis.loanRatioStats.length > 0 ? (
                                    <div className="h-[150px] w-full relative">
                                       <ResponsiveContainer width="100%" height={150}>
                                         <PieChart>
                                           <Pie data={roleKpis.loanRatioStats} cx="50%" cy="50%" innerRadius={40} outerRadius={50} paddingAngle={2} dataKey="value" stroke="none">
                                             {roleKpis.loanRatioStats.map((entry: any, index: number) => (
                                               <Cell key={`dashboard-loan-ratio-cell-${entry.name || 'unnamed'}-${index}`} fill={entry.color} />
                                             ))}
                                           </Pie>
                                           <ReTooltip 
                                             contentStyle={{ backgroundColor: theme === 'light' ? '#fff' : '#0f172a', border: 'none', borderRadius: '8px', fontSize: '10px' }}
                                             itemStyle={{ color: theme === 'light' ? '#0f172a' : '#fff', fontWeight: 'bold' }}
                                           />
                                         </PieChart>
                                       </ResponsiveContainer>
                                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                           <p className={cn("text-xl font-black", theme === 'dark' ? "text-white" : "text-slate-800")}>
                                              {loanRatioTotal}
                                           </p>
                                           <p className="text-[8px] font-bold text-slate-500 uppercase">Căn</p>
                                       </div>
                                    </div>
                                  ) : (
                                    <p className="text-[9px] italic opacity-40 text-center mt-4">Không có dữ liệu</p>
                                  )}
                               </div>
                               
                               {/* Status Stats */}
                               <div className="flex flex-col gap-4 border-l border-slate-800/10 pl-4 w-full">
                                  <div className="text-center text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Tiến độ hồ sơ vay</div>
                                  {loanPieData.length > 0 ? (
                                    <div className="h-[150px] w-full relative">
                                       <ResponsiveContainer width="100%" height={150}>
                                         <PieChart>
                                           <Pie 
                                              data={loanPieData} 
                                              cx="50%" 
                                              cy="50%" 
                                              innerRadius={40} 
                                              outerRadius={50} 
                                              paddingAngle={2} 
                                              dataKey="value" 
                                              stroke="none"
                                           >
                                             {loanPieData.map((entry: any, index: number) => (
                                               <Cell 
                                                 key={`dashboard-loan-status-cell-${entry.name || 'unnamed'}-${index}`} 
                                                 fill={entry.color} 
                                                 className="hover:opacity-80 transition-opacity cursor-pointer outline-none" 
                                               />
                                             ))}
                                           </Pie>
                                           <ReTooltip 
                                              content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                  const data = payload[0].payload;
                                                  return (
                                                    <div className={cn(
                                                       "p-3 rounded-xl text-[10px] font-black border backdrop-blur-md shadow-2xl", 
                                                       theme === 'light' ? "bg-[var(--color-bg-secondary)] border-[var(--color-border-subtle)] text-[var(--color-text-primary)] shadow-lg shadow-indigo-500/5" : "bg-slate-900 border-slate-800 text-white"
                                                    )}>
                                                      <div className="flex items-center gap-2 mb-1">
                                                         <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: data.color }} />
                                                         {data.name}
                                                      </div>
                                                      <div className="flex justify-between gap-4">
                                                         <span className="opacity-50 font-bold uppercase tracking-tighter">Phần trăm:</span>
                                                         <span>{data.percentage}%</span>
                                                      </div>
                                                    </div>
                                                  );
                                                }
                                                return null;
                                              }} 
                                            />
                                         </PieChart>
                                       </ResponsiveContainer>
                                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                           <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">Căn vay</p>
                                           <p className={cn("text-xl font-black mt-1", theme === 'dark' ? "text-white" : "text-slate-800")}>
                                              {loanPieData.reduce((acc, curr) => acc + curr.value, 0)}
                                           </p>
                                       </div>
                                    </div>
                                  ) : (
                                    <p className="text-[9px] italic opacity-40 text-center mt-4">Không có dữ liệu</p>
                                   )}
                                </div>
                             </div>
                          </div>
                       </div>
                     </div>
                   </div>

                {(userRole === 'ADMIN' || userRole === 'DIRECTOR') && (
                  <div className={cn(
                    "backdrop-blur-xl rounded-3xl shadow-2xl border transition-all overflow-hidden",
                    theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900/20 shadow-2xl border-slate-800/50"
                  )}>
                    <div className={cn("p-5 border-b flex flex-wrap items-center justify-between gap-4", theme === 'light' ? "border-slate-100 bg-slate-50" : "border-slate-800/50")}>
                      <div className="flex items-center gap-4">
                        <h3 className={cn("font-bold font-serif text-lg italic", theme === 'light' ? "text-slate-900" : "text-white")}>Hiệu suất Xử lý theo Phòng ban</h3>
                        <div className="flex items-center gap-2 bg-slate-800/20 rounded-lg p-1 border border-slate-700/30">
                          <Clock size={10} className="text-slate-500 ml-1" />
                          <span className="text-[9px] font-black uppercase text-slate-400 px-2 italic">Chỉ số SLA trung bình</span>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold italic">
                        * Loại trừ hồ sơ có vướng mắc khỏi ngày trung bình để đảm bảo khách quan
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {roleKpis.admin.deptStats.map((dept: any, idx: number) => (
                          <div key={`dashboard-admin-dept-card-${dept.dept || dept.label}-${idx}`} className={cn(
                            "p-4 rounded-[2rem] border transition-all hover:bg-slate-800/10 duration-300",
                            theme === 'light' ? "bg-slate-50 border-slate-100 shadow-sm" : "bg-slate-800/40 border-slate-700/30 shadow-xl"
                          )}>
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                 <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", dept.color + " bg-opacity-10")}>
                                    <Layers size={14} className={dept.color.replace('bg-', 'text-')} />
                                 </div>
                                 <div>
                                   <p className={cn("text-[8px] font-black uppercase tracking-widest leading-none mb-0.5", theme === 'light' ? "text-slate-400" : "text-slate-500")}>Phòng ban</p>
                                   <h4 className={cn("text-sm font-black italic truncate max-w-[120px]", theme === 'light' ? "text-slate-900" : "text-white")}>{dept.label}</h4>
                                 </div>
                              </div>
                              <div className="text-right">
                                <span className={cn("text-2xl font-black italic font-serif", theme === 'light' ? "text-slate-900" : "text-white")}>
                                  {isNaN(Number(dept.avgDays)) ? 0 : (dept.avgDays || 0)}
                                </span>
                                <span className="text-[8px] font-bold text-slate-500 uppercase ml-1">Ngày</span>
                              </div>
                            </div>
                            
                            <div className="h-1.5 w-full bg-slate-800/10 rounded-full overflow-hidden mb-3">
                               <div className={cn("h-full rounded-full transition-all duration-1000", dept.color)} style={{ width: `${Math.min(100, ((isNaN(Number(dept.avgDays)) ? 0 : (dept.avgDays || 0)) / 15) * 100)}%` }} />
                            </div>
                            
                            <div className="flex justify-between items-center text-[9px]">
                               <span className="text-slate-500 font-bold uppercase">Xử lý: {dept.count}</span>
                               <span className={cn("font-black italic px-2 py-0.5 rounded-lg", (isNaN(Number(dept.avgDays)) ? 0 : (dept.avgDays || 0)) > 10 ? "text-rose-500 bg-rose-500/5" : "text-emerald-500 bg-emerald-500/5")}>
                                 {(isNaN(Number(dept.avgDays)) ? 0 : (dept.avgDays || 0)) > 10 ? 'Chậm' : 'Tốt'}
                               </span>
                            </div>

                            {dept.issueExcludedCount > 0 && (
                              <div className="mt-2 pt-2 border-t border-slate-800/10 dark:border-slate-800/40 flex justify-between items-center text-[8px]">
                                <span className="text-amber-500 dark:text-amber-400/80 font-bold uppercase tracking-wider flex items-center gap-1">
                                  <AlertCircle size={8} /> Vướng mắc hoãn SLA:
                                </span>
                                <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 dark:text-amber-400 font-black rounded">
                                  {dept.issueExcludedCount} hồ sơ
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className={cn(
                  "backdrop-blur-xl rounded-3xl shadow-2xl border transition-all overflow-hidden",
                  theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900/20 shadow-2xl border-slate-800/50"
                )}>
                  <div className={cn("p-6 border-b flex items-center justify-between", theme === 'light' ? "border-slate-100 bg-slate-50" : "border-slate-800/50")}>
                    <div className="flex items-center gap-4">
                      <h3 className={cn("font-bold font-serif text-xl italic", theme === 'light' ? "text-slate-900" : "text-white")}>Tình hình xử lý theo Dự án</h3>
                      <div className="flex items-center gap-2 bg-slate-800/20 rounded-lg p-1 border border-slate-700/30">
                        <Filter size={12} className="text-slate-500 ml-1" />
                        <select 
                          className="bg-transparent text-[10px] font-black uppercase text-slate-400 outline-none pr-2 cursor-pointer"
                          value={projectRegionFilter}
                          onChange={(e) => setProjectRegionFilter(e.target.value)}
                        >
                          <option value="ALL">Tất cả khu vực</option>
                          {REGION_ORDER.map((r: string, index: number) => (
                            <option key={`dashboard-region-option-${r}-${index}`} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button className="text-festive-gold text-xs font-bold hover:underline">Chi tiết báo cáo</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className={theme === 'light' ? "bg-slate-50" : "bg-slate-800/30"}>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono italic">Dự án & Khu vực</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono italic text-center">Quỹ căn</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono italic text-center">Đã xong</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono italic">Tiến độ pháp lý</th>
                        </tr>
                      </thead>
                      <tbody className={cn("divide-y", theme === 'light' ? "divide-slate-50" : "divide-slate-800/50")}>
                        {visibleProjects
                          .filter(p => projectRegionFilter === 'ALL' || p.region === projectRegionFilter)
                          .map((p: any, index: number) => {
                            const projectApps = dashboardApps.filter(a => a.projectName === p.name);
                            const completed = projectApps.filter(a => a.currentStep === 'Hoan_Tat' || a.customerHandoverDate || a.status === 'Completed').length;
                            const processing = projectApps.filter(a => a.status === 'Processing' || a.status === 'Submitted' || a.status === 'TaxPending').length;
                            const progress = p.totalUnits > 0 ? Math.round((completed / p.totalUnits) * 100) : 0;
                            
                            // Calculate colored progress bar
                            const barColor = progress > 80 ? 'bg-emerald-500' : progress > 30 ? 'bg-indigo-500' : 'bg-amber-500';
                            const shadowColor = progress > 80 ? 'shadow-emerald-500/30' : progress > 30 ? 'shadow-indigo-500/30' : 'shadow-amber-500/30';

                            return (
                              <tr 
                                key={`dashboard-project-row-${p.id || p.name || 'proj'}-${index}`} 
                                onClick={() => setSelectedProjectId(p.id)}
                                className={cn(
                                  "transition-colors cursor-pointer group border-b",
                                  theme === 'light' 
                                    ? (selectedProjectId === p.id ? "bg-festive-gold/10 border-festive-gold/30 text-slate-800" : "hover:bg-slate-50 border-slate-50 text-slate-700") 
                                    : (selectedProjectId === p.id ? "bg-slate-800/60 border-slate-700 text-white" : "hover:bg-slate-800/30 border-slate-800/20 text-slate-300")
                                )}
                              >
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className={cn(
                                      "w-8 h-8 rounded-lg flex items-center justify-center transition-colors border shadow-sm",
                                      theme === 'light' ? "bg-indigo-50 border-indigo-100 text-indigo-500" : "bg-slate-800/50 border-slate-700/50 text-slate-500"
                                    )}>
                                      <Building2 size={16} />
                                    </div>
                                    <div>
                                      <p className={cn("text-xs font-black uppercase tracking-tighter", theme === 'light' ? "text-slate-900" : "text-white")}>{p.name}</p>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <MapPin size={8} className="text-slate-400" />
                                        <p className="text-[9px] text-slate-400 tracking-[0.1em] font-bold uppercase">{p.region}</p>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center text-xs font-black text-slate-500 font-mono tracking-tighter">{p.totalUnits}</td>
                                <td className="px-6 py-4 text-center">
                                   <div className="flex flex-col items-center">
                                      <span className="text-sm font-black text-emerald-500 italic">{completed}</span>
                                      <span className="text-[8px] text-slate-400 font-bold uppercase">Xong</span>
                                   </div>
                                </td>
                                <td className="px-6 py-4 min-w-[200px]">
                                  <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-4">
                                      <div className="flex-1 h-2 bg-slate-800/10 rounded-full overflow-hidden border border-slate-800/5">
                                         <div className={cn("h-full rounded-full transition-all duration-1000", barColor, shadowColor)} style={{ width: `${progress}%` }} />
                                      </div>
                                      <span className="text-[10px] font-black min-w-[30px] text-indigo-500">{progress}%</span>
                                    </div>
                                    <div className="flex justify-between items-center px-1">
                                      <span className="text-[9px] font-bold text-slate-500 uppercase">
                                        Đã xong: <span className={theme === 'light' ? "text-slate-900" : "text-white"}>{completed}</span> | 
                                        Đang XL: <span className={theme === 'light' ? "text-slate-900" : "text-white"}>{processing}</span> | 
                                        Quỹ căn: <span className={theme === 'light' ? "text-slate-900" : "text-white"}>{p.totalUnits}</span>
                                      </span>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

</>
  );
};
