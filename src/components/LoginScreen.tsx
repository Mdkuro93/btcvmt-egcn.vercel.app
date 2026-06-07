import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  BarChart3, 
  Bell, 
  FileText,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
  Fingerprint,
  Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../hooks/useToast';
import { UserProfile } from '../types';
import { MOCK_USERS, PROJECTS } from '../constants';
import { mapUserFromSnakeCase } from '../utils/mappers';
import { ThemeToggle } from './ThemeToggle';
import { BackgroundParticles } from './BackgroundParticles';

interface LoginScreenProps {
  onLogin: (user: UserProfile) => void;
  theme: 'light' | 'dark';
  onThemeToggle: (event: React.MouseEvent<HTMLButtonElement>) => void;
  supabase: any;
  totalApplicationsCount?: number;
  totalProjectsCount?: number;
}

export default function LoginScreen({ 
  onLogin, 
  theme, 
  onThemeToggle, 
  supabase,
  totalApplicationsCount = 65,
  totalProjectsCount = 6
}: LoginScreenProps) {
  const { toast, showToast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      alert('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`username.eq.${username},email.eq.${username}`)
        .eq('password', password)
        .maybeSingle();

      if (data) {
        onLogin(mapUserFromSnakeCase(data));
        return;
      }

      // Nếu Supabase trả null (không tìm thấy) -> báo lỗi luôn, không fallback mock
      if (!error) {
        alert('Tên đăng nhập hoặc mật khẩu không chính xác!');
        return;
      }

      // Chỉ fallback mock khi có lỗi kết nối/Supabase
      throw error;

    } catch (err) {
      console.error('System login error:', err);
      
      const ENABLE_DEV_LOGIN = import.meta.env.VITE_ENABLE_DEV_LOGIN === 'true';
      if (ENABLE_DEV_LOGIN && username === 'admin' && password === '123456') {
        const defaultAdmin: UserProfile = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          username: 'admin',
          password: '123456',
          name: 'Hệ thống Admin',
          dept: 'ADMIN',
          permission: 'FULL',
          assignedProjectIds: PROJECTS.map(p => p.id),
          email: 'admin@sunshine.vn',
          status: 'Active'
        };
        onLogin(defaultAdmin);
        return;
      }

      // Fallback mock chỉ khi Supabase lỗi
      const mockUser = MOCK_USERS.find(u => 
        (u.username === username || u.email === username) && 
        u.password === password
      );
      if (mockUser) {
        onLogin(mockUser);
        return;
      }
      showToast('Có lỗi xảy ra, vui lòng thử lại', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const notice_message = "Tính năng tự động khôi phục mật khẩu đang được nâng cấp. Vui lòng liên hệ BTC VMT để hỗ trợ cấp lại.";
    showToast(notice_message, "warning");
    alert(notice_message);
  };

  const isDark = theme === 'dark';

  // Realistic statistics distribution from "THỐNG KÊ TIẾN ĐỘ"
  const stepStats = [
    { label: "1. ĐANG CHUẨN BỊ", value: 23, width: "35%", colorClass: "bg-slate-400" },
    { label: "2. CHỜ NỘP VPĐK", value: 10, width: "16%", colorClass: "bg-amber-500" },
    { label: "3. ĐÃ NỘP VPĐK", value: 0, width: "1%", colorClass: "bg-blue-500" },
    { label: "4. CHỜ THÔNG BÁO THUẾ", value: 1, width: "3%", colorClass: "bg-orange-500" },
    { label: "5. CHỜ HOÀN THÀNH NVTC", value: 1, width: "3%", colorClass: "bg-purple-500" },
    { label: "CHỜ BÀN GIAO", value: 11, width: "20%", colorClass: "bg-indigo-500 animate-pulse" },
    { label: "HOÀN TẤT", value: 18, width: "28%", colorClass: "bg-emerald-500" }
  ];

  return (
    <div className={`min-h-screen relative overflow-x-hidden font-sans transition-colors duration-700 flex flex-col lg:flex-row ${
      isDark ? 'bg-[#06070a] text-slate-100' : 'bg-[#f4f6fa] text-slate-900'
    }`}>
      {/* Dynamic Background */}
      <BackgroundParticles theme={theme} />
      
      {/* Soft Ambient Glows */}
      <div className={`absolute top-1/4 left-1/4 w-[35rem] h-[35rem] rounded-full blur-[140px] pointer-events-none -z-10 transition-opacity duration-700 ${
        isDark ? 'bg-amber-500/10 opacity-60' : 'bg-amber-500/[0.03] opacity-100'
      }`} />
      <div className={`absolute bottom-1/4 right-1/4 w-[35rem] h-[35rem] rounded-full blur-[140px] pointer-events-none -z-10 transition-opacity duration-700 ${
        isDark ? 'bg-indigo-500/10 opacity-50' : 'bg-indigo-500/[0.03] opacity-100'
      }`} />

      {/* LEFT SECTION (Branding, Features list, Stats Bar, and Bottom Aligned/Off-Screen Phone Mockup) */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 lg:p-16 pb-0 lg:pb-0 relative min-h-screen">
        
        {/* Brand Segment */}
        <div className="flex items-center gap-3.5 text-left pt-8 lg:pt-0">
          <div className="w-13 h-13 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-[18px] flex items-center justify-center shadow-[0_10px_20px_-4px_rgba(245,158,11,0.3)] border border-white/20 shrink-0">
            <ShieldCheck className="text-white w-7 h-7" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className={`text-xl font-black tracking-tight leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
              GCN Tracker
            </h1>
            <p className="text-[9px] font-black tracking-[0.2em] text-amber-500 uppercase mt-1">
              HỆ THỐNG QUẢN LÝ GCN
            </p>
          </div>
        </div>

        {/* Mid layout splitting Features + Grounded Mockkup */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-end mt-8 lg:mt-4 flex-1">
          
          {/* Main Copywriting & Features */}
          <div className="lg:col-span-7 flex flex-col justify-center h-full text-left space-y-4 py-2">
            
            {/* Title Block */}
            <div className="space-y-2.5">
              <span className={`inline-block text-[10px] font-extrabold uppercase tracking-[0.2em] px-2.5 py-0.5 rounded-full border ${
                isDark 
                  ? 'text-amber-500 bg-amber-500/5 border-amber-500/15' 
                  : 'text-amber-605 bg-amber-500/8 border-amber-500/15'
              }`}>
                NỀN TẢNG SỐ HÓA
              </span>
              <h2 className={`text-2xl sm:text-3xl lg:text-[2.2rem] font-bold leading-[1.12] tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                Quản lý hồ sơ<br />
                GCN QSDĐ<br />
                thông minh
              </h2>
              <p className={`text-[12.5px] leading-relaxed max-w-md ${
                isDark ? 'text-slate-400' : 'text-slate-550'
              }`}>
                Theo dõi tiến độ, tra cứu trạng thái và xử lý hồ sơ cấp GCN mọi lúc, mọi nơi. Tối ưu hóa hiệu suất làm việc số giữa các bộ phận.
              </p>
            </div>

            {/* Pristine Real Feature Cards */}
            <div className="space-y-2.5 max-w-md">
              {/* Feature 1 */}
              <div className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-300 ${
                isDark 
                  ? 'bg-[#121319]/45 border-white/[0.04] text-slate-100' 
                  : 'bg-white border-slate-200/55 shadow-[0_2px_8px_rgba(15,23,42,0.015)] text-slate-900'
              }`}>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/10">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold tracking-tight">Quản lý hồ sơ tập trung</h4>
                  <p className={`text-[10.5px] mt-0.5 leading-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Toàn bộ quy trình cấp GCN giữa các phòng ban được theo dõi trên một nền tảng duy nhất.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-300 ${
                isDark 
                  ? 'bg-[#121319]/45 border-white/[0.04] text-slate-100' 
                  : 'bg-white border-slate-200/55 shadow-[0_2px_8px_rgba(15,23,42,0.015)] text-slate-900'
              }`}>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/10">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold tracking-tight">Cảnh báo tiến độ thông minh</h4>
                  <p className={`text-[10.5px] mt-0.5 leading-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Nhận thông báo tự động khi hồ sơ cần bổ sung hoặc có nguy cơ chậm trễ.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-300 ${
                isDark 
                  ? 'bg-[#121319]/45 border-white/[0.04] text-slate-100' 
                  : 'bg-white border-slate-200/55 shadow-[0_2px_8px_rgba(15,23,42,0.015)] text-slate-900'
              }`}>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/10">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold tracking-tight">Báo cáo tự động hóa</h4>
                  <p className={`text-[10.5px] mt-0.5 leading-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Số hóa chỉ số hiệu suất làm việc của các bộ phận, xuất dữ liệu biểu đồ thông minh.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Real System Stats */}
            <div className={`border-t pt-4 grid grid-cols-3 gap-3 max-w-md ${
              isDark ? 'border-white/[0.06]' : 'border-slate-200'
            }`}>
              <div>
                <div className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {totalApplicationsCount !== undefined && totalApplicationsCount > 0 ? `${totalApplicationsCount}+` : "65+"}
                </div>
                <p className={`text-[9.5px] uppercase font-bold tracking-wider mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-440'}`}>
                  Hồ sơ đã xử lý
                </p>
              </div>
              <div>
                <div className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {totalProjectsCount !== undefined && totalProjectsCount > 0 ? totalProjectsCount : "6"}
                </div>
                <p className={`text-[9.5px] uppercase font-bold tracking-wider mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-440'}`}>
                  Dự án đang theo dõi
                </p>
              </div>
              <div>
                <div className={`text-xl font-black text-amber-500`}>
                  ~50%
                </div>
                <p className={`text-[9.5px] uppercase font-bold tracking-wider mt-0.5 ${isDark ? 'text-slate-505' : 'text-slate-440'}`}>
                  TIẾT KIỆM THỜI GIAN
                </p>
              </div>
            </div>
          </div>

          {/* COLUMN 2: Grounded / Under-Aligned Phone Mockup (Exactly mirroring reference image) */}
          <div className="lg:col-span-12 xl:col-span-5 flex justify-center items-end self-end h-[480px] overflow-hidden relative w-full">
            
            {/* BACK PHONE - Rotated and shifted to the left background */}
            <motion.div 
              initial={{ opacity: 0, y: 180, rotate: -2 }}
              animate={{ opacity: 0.35, y: 55, rotate: -8 }}
              transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={`absolute left-[10%] lg:left-[5%] bottom-0 rounded-t-[2.8rem] h-[490px] w-[240px] flex flex-col overflow-hidden select-none pointer-events-none ${
                isDark 
                  ? 'bg-[#06070a]/90 border-[#14151b]' 
                  : 'bg-white border-slate-300/80'
              } border-t-[8px] border-x-[8px] shadow-[0_20px_40px_rgba(0,0,0,0.4)] ring-1 ring-white/5 opacity-40`}
            >
              {/* Dynamic Island */}
              <div className="h-[16px] w-[80px] bg-black absolute top-0.5 left-1/2 transform -translate-x-1/2 rounded-full z-30" />
              
              {/* BACK PHONE SCREEN: Technical Folder records representation */}
              <div className={`flex-1 p-3 text-[10px] flex flex-col justify-start overflow-hidden text-left ${
                isDark ? 'bg-[#0c0d12]' : 'bg-[#f8fafc]'
              }`}>
                {/* Header widget */}
                <div className={`mb-2 pb-1.5 border-b ${isDark ? 'border-white/[0.04]' : 'border-slate-100'}`}>
                  <span className={`text-[9px] font-black tracking-tight ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                    HOẠT ĐỘNG KHU VỰC
                  </span>
                  <p className="text-[5.5px] text-slate-400 font-extrabold uppercase mt-0.5 font-sans">TIẾN ĐỘ THỜI GIAN THỰC</p>
                </div>
                
                {/* Visual miniature logs */}
                <div className="space-y-1.5 text-[7px]">
                  <div className={`p-1.5 rounded bg-white/[0.015] border ${isDark ? 'border-white/[0.03]' : 'border-slate-200/40'}`}>
                    <p className="font-extrabold text-amber-500">A1-2405 · Nộp bổ sung</p>
                    <span className="text-slate-505 font-medium">Phòng Tài Nguyên Môi Trường</span>
                  </div>
                  <div className={`p-1.5 rounded bg-white/[0.015] border ${isDark ? 'border-white/[0.03]' : 'border-slate-200/40'}`}>
                    <p className="font-extrabold text-indigo-500">B2-1205 · Đã ký GCN</p>
                    <span className="text-slate-505 font-medium">Văn phòng Đăng ký Đất đai</span>
                  </div>
                  <div className={`p-1.5 rounded bg-white/[0.015] border ${isDark ? 'border-white/[0.03]' : 'border-slate-200/40'}`}>
                    <p className="font-extrabold text-emerald-500">T3-4012 · Đã bàn giao KH</p>
                    <span className="text-slate-505 font-medium font-sans">Hệ thống bàn giao GCN</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* FRONT PHONE - Centered, sharp, high-depth primary mockup, grounded off-screen at bottom */}
            <motion.div 
              initial={{ opacity: 0, y: 150 }}
              animate={{ opacity: 1, y: 45 }}
              transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className={`relative rounded-t-[2.8rem] h-[520px] w-[265px] flex flex-col overflow-hidden z-10 ${
                isDark 
                  ? 'bg-[#0a0a0e] border-[#16171c]' 
                  : 'bg-[#ffffff] border-slate-200/90'
              } border-t-[8px] border-x-[8px] shadow-[0_30px_70px_-10px_rgba(0,0,0,0.85)] ring-1 ${
                isDark ? 'ring-white/10' : 'ring-slate-900/5'
              }`}
            >
              {/* Phone Dynamic Island */}
              <div className="h-[18px] w-[95px] bg-black absolute top-0.5 left-1/2 transform -translate-x-1/2 rounded-full z-30 flex items-center justify-center">
                <div className="w-1 h-1 bg-slate-900 rounded-full ml-auto mr-2.5" />
              </div>

              {/* Gloss Flare */}
              <div className="absolute top-0 right-0 w-[125px] h-[400px] bg-gradient-to-tr from-transparent via-white/[0.015] to-white/[0.04] rotate-[35deg] pointer-events-none z-20" />
              
              {/* Status Bar */}
              <div className={`h-7 flex justify-between items-center px-4 text-[8.5px] z-10 pt-2 shrink-0 select-none font-bold ${
                isDark ? 'bg-black/45 text-slate-350' : 'bg-slate-100/60 text-slate-600'
              }`}>
                <span className={isDark ? 'text-white/90' : 'text-slate-900/95'}>09:41</span>
                <div className="flex gap-1 items-center">
                  <span className={`text-[6px] px-1 py-0.2 rounded-xs leading-none ${isDark ? 'bg-[#ffffff]/10' : 'bg-slate-900/10'}`}>5G</span>
                  <div className={`w-3.5 h-1.5 rounded-2xs border p-0.2 flex items-center ${isDark ? 'border-[#ffffff]/20' : 'border-slate-500/20'}`}>
                    <div className="h-full w-full bg-amber-500 rounded-3xs" />
                  </div>
                </div>
              </div>

              {/* Nền DARK: Nguyễn Hoà Dashboard / Nền LIGHT: Danh sách hồ sơ table (using both images reference!) */}
              {isDark ? (
                /* NỀN TỐI: NGUYỄN HOÀ DASHBOARD WITH PROGRESS AT THE TOP */
                <div className="flex-1 bg-[#101116] p-3 text-xs select-none flex flex-col justify-start relative overflow-hidden text-left font-sans">
                  {/* User Profile Block */}
                  <div className="flex items-center justify-between mb-3 mt-1 bg-white/[0.02] border border-white/[0.04] p-2 rounded-xl font-sans shrink-0">
                    <div className="text-left">
                      <h4 className="text-[10px] font-black text-white leading-none">Nguyễn Hoà</h4>
                      <p className="text-[6px] font-bold text-slate-500 tracking-wider mt-1 font-sans">QUẢNG TRỊ · ADMIN</p>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-[7px] font-black text-black">
                      NH
                    </div>
                  </div>

                  {/* THỐNG KÊ TIẾN ĐỘ WIDGET - BROUGHT TO THE VERY TOP */}
                  <div className="mb-3 bg-[#171821] border border-white/[0.04] p-2.5 rounded-xl font-sans shrink-0">
                    <div className="flex justify-between items-center pb-1.5 border-b border-white/[0.03] mb-1.5">
                      <span className="text-[8.5px] font-black text-slate-100 tracking-tight flex items-center gap-1">
                        <BarChart3 size={9} className="text-amber-500" /> THỐNG KÊ TIẾN ĐỘ
                      </span>
                      <span className="text-[6px] font-black text-emerald-450 bg-emerald-500/10 px-1 py-0.2 rounded-xs">65 CĂN</span>
                    </div>
                    {/* Visual miniature progress lines (Compact layout mapping key levels) */}
                    <div className="space-y-1.5">
                      {stepStats.slice(0, 3).map((step, idx) => (
                        <div key={idx} className="space-y-0.5 font-sans">
                          <div className="flex justify-between items-center text-[6px]">
                            <span className="font-bold text-[#94a3b8] truncate max-w-[70%]">{step.label}</span>
                            <span className="font-mono text-amber-500 font-extrabold">{step.value}</span>
                          </div>
                          <div className="w-full h-1 bg-white/[0.03] rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${step.colorClass}`} style={{ width: step.width }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dịch vụ nhanh widget */}
                  <div className="mb-3 shrink-0">
                    <h5 className="text-[8px] font-bold text-[#64748b] tracking-widest uppercase mb-1.5 font-sans">DỊCH VỤ NHANH</h5>
                    <div className="grid grid-cols-4 gap-1.5 font-sans">
                      <div className="bg-[#181a22] border border-white/[0.02] p-1.5 rounded-lg flex flex-col items-center justify-center text-center">
                        <FileText size={10} className="text-amber-500 mb-0.5" />
                        <span className="text-[5.5px] font-bold text-slate-400 font-sans">Hồ sơ</span>
                      </div>
                      <div className="bg-[#181a22] border border-white/[0.02] p-1.5 rounded-lg flex flex-col items-center justify-center text-center font-sans">
                        <User size={10} className="text-amber-500 mb-0.5" />
                        <span className="text-[5.5px] font-bold text-slate-400 font-sans">Thu thập</span>
                      </div>
                      <div className="bg-[#181a22] border border-white/[0.02] p-1.5 rounded-lg flex flex-col items-center justify-center text-center">
                        <BarChart3 size={10} className="text-amber-500 mb-0.5" />
                        <span className="text-[5.5px] font-bold text-slate-400 font-sans">Báo cáo</span>
                      </div>
                      <div className="bg-[#181a22] border border-white/[0.02] p-1.5 rounded-lg flex flex-col items-center justify-center text-center">
                        <Bell size={10} className="text-amber-500 mb-0.5" />
                        <span className="text-[5.5px] font-bold text-slate-400 font-sans">Nhắc nhở</span>
                      </div>
                    </div>
                  </div>

                  {/* Hồ sơ gần đây widget */}
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex justify-between items-center mb-1.5 shrink-0">
                      <h5 className="text-[8px] font-bold text-[#64748b] tracking-widest uppercase font-sans">HỒ SƠ MỚI</h5>
                      <span className="text-[6.5px] text-amber-500 font-bold font-sans">Xem hết</span>
                    </div>

                    <div className="space-y-1.5 overflow-hidden flex-1 scrollbar-none">
                      {/* Card 1 */}
                      <div className="bg-[#16171f] border border-white/[0.03] p-2 rounded-xl flex flex-col gap-1 shrink-0">
                        <div className="flex justify-between items-center">
                          <span className="text-[7px] font-black text-amber-500">GCN-2401</span>
                          <span className="text-[5.5px] text-slate-500">Hôm nay</span>
                        </div>
                        <p className="text-[8px] font-bold text-slate-300 leading-none">Nguyễn Văn An</p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[6.5px] text-[#5c6978]">Lô T1-12A05</span>
                          <span className="text-[5.5px] font-bold text-emerald-450 bg-emerald-500/10 px-1.5 py-0.2 rounded-full font-sans">
                            Hoàn thành
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* NỀN SÁNG: DANH SÁCH HỒ SƠ WITH INTERACTIVE PROGRESS METRICS AT THE TOP OF THE CONTAINER */
                <div className="flex-1 bg-[#f8fafc] p-2.5 text-xs select-none flex flex-col justify-start relative overflow-hidden text-left font-sans">
                  {/* Top Bar with Search */}
                  <div className="mb-1.5 shrink-0">
                    <span className="text-[7.5px] font-black uppercase tracking-wider text-slate-400">QUẢN LÝ TIỀN ĐỘ GCN</span>
                    <h4 className="text-[10px] font-black text-slate-900 leading-none mt-0.5">DANH SÁCH HỒ SƠ</h4>
                    
                    {/* PROGRESS STATS TILES INSERTED ON TOP AS REQUESTED */}
                    <div className="grid grid-cols-3 gap-1 my-2">
                      <div className="bg-emerald-50 border border-emerald-100 p-1 rounded-lg text-center">
                        <p className="text-[5px] text-emerald-600 font-black uppercase">HOÀN TẤT</p>
                        <p className="text-[8px] font-black text-emerald-700 font-mono">18 căn</p>
                      </div>
                      <div className="bg-amber-50 border border-amber-100 p-1 rounded-lg text-center">
                        <p className="text-[5px] text-amber-600 font-black uppercase">CHỜ NỘP</p>
                        <p className="text-[8px] font-black text-amber-700 font-mono">10 căn</p>
                      </div>
                      <div className="bg-indigo-50 border border-indigo-100 p-1 rounded-lg text-center">
                        <p className="text-[5px] text-indigo-600 font-black uppercase">CHỜ GIAO</p>
                        <p className="text-[8px] font-black text-indigo-700 font-mono">11 căn</p>
                      </div>
                    </div>

                    {/* Simulated elegant search input */}
                    <div className="relative mt-1.5 font-sans">
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">
                        <span className="text-[6.5px]">🔍</span>
                      </div>
                      <div className="w-full bg-white border border-slate-200 rounded-lg pl-5 pr-2 py-0.5 text-[6.5px] text-slate-450 font-semibold shadow-3xs font-sans">
                        Tìm mã căn, tên chủ nhà...
                      </div>
                    </div>
                  </div>

                  {/* Interactive Tab headers */}
                  <div className="flex gap-1 mb-1.5 shrink-0 font-sans">
                    <span className="bg-slate-200 text-slate-800 font-extrabold text-[6px] px-1.5 py-0.3 rounded">Tất cả (65)</span>
                    <span className="bg-white border border-slate-200 text-slate-550 font-bold text-[6px] px-1.5 py-0.3 rounded">Vay vốn</span>
                  </div>

                  {/* Micro list mapping the user's uploaded Table Screen */}
                  <div className="flex-1 space-y-1 overflow-hidden font-sans">
                    {/* Header Row */}
                    <div className="grid grid-cols-12 gap-1.5 text-[6px] font-extrabold text-slate-400 uppercase py-0.5 border-b border-slate-200 font-sans">
                      <span className="col-span-3">Mã căn</span>
                      <span className="col-span-4">Chủ nhà</span>
                      <span className="col-span-5 text-right font-sans">Trạng thái</span>
                    </div>

                    {/* Table Row 1 (Real item modeled from screenshot) */}
                    <div className="grid grid-cols-12 gap-1.5 items-center p-1 bg-white border border-slate-200 rounded-lg shadow-3xs">
                      <span className="col-span-3 text-[6.5px] font-black text-slate-800 font-sans">B1-146-42</span>
                      <span className="col-span-4 text-[6.5px] font-bold text-slate-600 truncate font-sans">Trần Thị Vinh Hải</span>
                      <div className="col-span-5 text-right font-sans">
                        <span className="text-[5.5px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 px-1 py-0.2 rounded-xs font-sans">
                          Hoàn thành
                        </span>
                      </div>
                    </div>

                    {/* Table Row 2 */}
                    <div className="grid grid-cols-12 gap-1.5 items-center p-1 bg-white border border-slate-200 rounded-lg shadow-3xs">
                      <span className="col-span-3 text-[6.5px] font-black text-slate-800 font-sans">B1-139-28</span>
                      <span className="col-span-4 text-[6.5px] font-bold text-slate-600 truncate font-sans">Lê Cao Cường</span>
                      <div className="col-span-5 text-right font-sans">
                        <span className="text-[5.5px] font-black bg-amber-50 text-amber-600 border border-amber-100 px-1 py-0.2 rounded-xs font-sans">
                          Chờ nộp VPĐK
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Micro Live footer */}
                  <div className="p-1 px-2 bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1 mt-1 shrink-0">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="text-[5.5px] text-slate-500 font-bold truncate">Đã đồng bộ thời gian thực</span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

        </div>
      </div>

      {/* RIGHT SIDEBAR PANEL: FULL HEIGHT SOLID BACKGROUND LOGIN INTERFACE */}
      <motion.div 
        initial={{ opacity: 0, x: 25 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className={`w-full lg:w-[420px] xl:w-[460px] lg:min-h-screen flex flex-col justify-between p-8 sm:p-12 lg:p-16 relative border-t lg:border-t-0 lg:border-l transition-all duration-500 shrink-0 z-10 ${
          isDark 
            ? 'bg-[#0a0b0e] border-white/[0.04] shadow-2xl overflow-hidden' 
            : 'bg-[#ffffff] border-slate-200/80 shadow-2xl shadow-indigo-100/30 overflow-hidden'
        }`}
      >
        {/* Soft Background Flare inside block */}
        <div className={`absolute -inset-px opacity-60 pointer-events-none transition-all duration-700 ${
          isDark 
            ? 'bg-gradient-to-b from-amber-500/[0.03] to-transparent' 
            : 'bg-gradient-to-b from-amber-500/[0.01] to-transparent'
        }`} />

        {/* Theme Toggle shifted to top-right of the right panel, exactly as requested */}
        <div className="absolute top-6 right-6 lg:top-8 lg:right-8 z-35">
          <ThemeToggle theme={theme} onToggle={onThemeToggle} />
        </div>

        {/* Filler block at top of sidebar on desktop for alignment */}
        <div className="hidden lg:block h-10" />

        {/* Main Content Area */}
        <div className="w-full relative z-10 my-auto">
          
          <div className="text-left mb-8">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-500 border-b-2 border-amber-500/15 pb-1 ml-0.5 inline-block">
              ĐĂNG NHẬP HỆ THỐNG
            </span>
            <h3 className={`text-3xl font-black tracking-tight mt-4 mb-2 ${
              isDark ? 'text-white' : 'text-slate-900'
            } leading-[1.12]`}>
              Chào mừng<br />trở lại
            </h3>
            <p className={`text-[12.5px] leading-relaxed mt-2 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Nhập thông tin đăng nhập để tiếp tục quản lý hồ sơ GCN.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Field 1: User / Email */}
            <div className="space-y-2 text-left">
              <label className={`text-[10.5px] font-extrabold uppercase tracking-[0.2em] pl-1 ${
                isDark ? 'text-slate-400' : 'text-slate-700'
              }`}>
                Tên đăng nhập / Email
              </label>
              <div className="relative group/input">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-amber-500 transition-colors pointer-events-none">
                  <User size={15} />
                </div>
                <input 
                  type="text" 
                  placeholder="Nhập tên đăng nhập..."
                  className={`w-full rounded-2xl pl-11 pr-5 py-3.5 outline-none transition-all duration-300 text-sm font-bold border ${
                    isDark 
                      ? 'border-white/5 bg-[#121318] text-slate-200 placeholder:text-slate-600 focus:border-amber-500/50 focus:bg-[#121318]/90 focus:ring-1 focus:ring-amber-500/30' 
                      : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:shadow-sm focus:ring-1 focus:ring-amber-500/30'
                  }`}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Field 2: Password */}
            <div className="space-y-1.5 text-left">
              <label className={`text-[10.5px] font-extrabold uppercase tracking-[0.2em] pl-1 ${
                isDark ? 'text-slate-400' : 'text-slate-700'
              }`}>
                Mật khẩu
              </label>
              <div className="relative group/input">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-amber-500 transition-colors pointer-events-none">
                  <Lock size={15} />
                </div>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className={`w-full rounded-2xl pl-11 pr-5 py-3.5 outline-none transition-all duration-300 text-sm font-bold border ${
                    isDark 
                      ? 'border-white/5 bg-[#121318] text-slate-200 placeholder:text-slate-600 focus:border-amber-500/50 focus:bg-[#121318]/90 focus:ring-1 focus:ring-amber-500/30' 
                      : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:shadow-sm focus:ring-1 focus:ring-amber-500/30'
                  }`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="text-right pt-1">
                <a 
                  href="#forgot-password" 
                  onClick={handleForgotPasswordClick}
                  className="text-xs font-bold text-slate-505 hover:text-amber-500 dark:text-slate-400 transition-colors"
                >
                  Quên mật khẩu?
                </a>
              </div>
            </div>
            
            {/* Access Button */}
            <motion.button 
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 bg-[length:200%_auto] hover:bg-right text-slate-950 py-4 rounded-2xl font-black uppercase tracking-[0.16em] text-xs shadow-[0_12px_24px_-4px_rgba(245,158,11,0.2)] hover:shadow-[0_18px_36px_-4px_rgba(245,158,11,0.35)] transition-all duration-500 disabled:opacity-75 disabled:cursor-not-allowed border border-amber-400/20 flex items-center justify-center gap-3 mt-4"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              ) : (
                'ĐĂNG NHẬP'
              )}
            </motion.button>
          </form>

        </div>

        {/* Footer info at the absolute bottom of vertical pane */}
        <div className={`flex items-center justify-between pt-6 border-t mt-12 text-[8.5px] font-semibold ${
          isDark ? 'border-white/[0.04] text-[#4d576a]' : 'border-slate-200 text-slate-400'
        }`}>
          <span>GCN Tracker v2.4.1 · VMT</span>
          <div className="flex items-center gap-1.5 font-bold">
            <Radio size={8.5} className="animate-pulse text-emerald-500" />
            <span className={isDark ? 'text-emerald-500/80' : 'text-emerald-600'}>Hệ thống hoạt động</span>
          </div>
        </div>

      </motion.div>

      {/* Independent Toast Notifications Display Layer */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={`fixed bottom-8 left-1/2 z-[250] px-6 py-3.5 rounded-2xl shadow-3xl flex items-center gap-3 backdrop-blur-md border min-w-[320px] max-w-md justify-center ${
              toast.type === 'success' ? "bg-emerald-600 border-emerald-500/40 text-white" : 
              toast.type === 'error' ? "bg-rose-600 border-rose-500/40 text-white" : 
              "bg-[#11131c] border-amber-500/30 text-amber-500"
            }`}
          >
            <AlertCircle size={15} className="shrink-0" />
            <span className="text-[11px] font-bold text-left leading-normal">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
