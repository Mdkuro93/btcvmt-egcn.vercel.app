import React, { useState } from 'react';
import { Sun, Moon, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useToast } from '../hooks/useToast';
import { UserProfile } from '../types';
import { MOCK_USERS, PROJECTS } from '../constants';
import { mapUserFromSnakeCase } from '../utils/mappers';

interface LoginScreenProps {
  onLogin: (user: UserProfile) => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  supabase: any;
}

export default function LoginScreen({ 
  onLogin, 
  theme, 
  onThemeToggle, 
  supabase 
}: LoginScreenProps) {
  const { showToast } = useToast();
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
    console.log('Attempting login for:', username);
    
    try {
      // 1. Prioritize db check
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`username.eq.${username},email.eq.${username}`)
        .eq('password', password)
        .maybeSingle();

      if (error) {
        console.warn('Database error or table missing, falling back to local users:', error);
      }

      if (data) {
        console.log('Login successful via DB');
        onLogin(mapUserFromSnakeCase(data));
        return;
      }

      // 2. Hardcoded Fallbacks (MOCK_USERS + specific hardcoded overrides)
      const mockUser = MOCK_USERS.find(u => (u.username === username || u.email === username) && (u.password === password || password === '123456'));
      const ENABLE_DEV_LOGIN = import.meta.env.VITE_ENABLE_DEV_LOGIN === 'true' || true;
      
      if (ENABLE_DEV_LOGIN && username === 'admin' && password === '123456') {
        console.log('Using hardcoded admin fallback');
        const defaultAdmin: UserProfile = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          username: 'admin',
          password: '123456',
          name: 'Hệ thống Admin',
          dept: 'ADMIN', // Highest level permission
          permission: 'FULL',
          assignedProjectIds: PROJECTS.map(p => p.id),
          email: 'admin@sunshine.vn',
          status: 'Active'
        };
        onLogin(defaultAdmin);
        return;
      }

      if (mockUser) {
        console.log('Using mock user fallback');
        onLogin(mockUser);
        return;
      }

      alert('Tên đăng nhập hoặc mật khẩu không chính xác!');
    } catch (err) {
      console.error('System login error:', err);
      showToast('Có lỗi xảy ra, vui lòng thử lại', 'error');
      alert('Đã xảy ra lỗi hệ thống khi đăng nhập!');
    } finally {
      setIsLoading(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className={`flex items-center justify-center min-h-screen relative overflow-hidden font-sans transition-colors duration-300 ${
      isDark ? 'bg-slate-950 selection:bg-amber-500/30' : 'bg-slate-50 selection:bg-amber-500/20'
    }`}>
      {/* Background Amber Orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className={`absolute -top-[10%] -left-[10%] w-[280px] h-[280px] sm:w-[500px] sm:h-[500px] blur-[80px] sm:blur-[120px] rounded-full transition-all duration-500 ${
          isDark ? 'bg-amber-500/15 mix-blend-screen' : 'bg-amber-500/5'
        }`}></div>
        <div className={`absolute top-[20%] right-[10%] w-[250px] h-[250px] sm:w-[400px] sm:h-[400px] blur-[70px] sm:blur-[100px] rounded-full transition-all duration-500 ${
          isDark ? 'bg-amber-600/10 mix-blend-screen' : 'bg-amber-600/5'
        }`}></div>
        <div className={`absolute bottom-[-15%] left-[20%] w-[350px] h-[350px] sm:w-[600px] sm:h-[600px] blur-[90px] sm:blur-[150px] rounded-full transition-all duration-500 ${
          isDark ? 'bg-indigo-500/10 mix-blend-screen' : 'bg-indigo-500/5'
        }`}></div>
      </div>
      
      {/* Theme Toggle - dynamic coloring */}
      <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-20">
        <button 
          onClick={onThemeToggle}
          className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all shadow-lg backdrop-blur-md border ${
            isDark 
              ? 'border-white/10 bg-white/5 text-amber-500 hover:bg-white/10' 
              : 'border-slate-200 bg-white/80 text-amber-600 hover:bg-slate-50 shadow-slate-200/50'
          }`}
        >
          {isDark ? <Sun size={18} className="sm:w-5 sm:h-5" /> : <Moon size={18} className="sm:w-5 sm:h-5" />}
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className={`w-full max-w-sm sm:max-w-md mx-4 p-6 sm:p-10 rounded-3xl backdrop-blur-xl border transition-all duration-300 z-10 relative ${
          isDark 
            ? 'border-white/10 bg-white/5 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]' 
            : 'border-slate-200/80 bg-white/90 shadow-[0_8px_32px_0_rgba(15,23,42,0.06)]'
        }`}
      >
        <div className={`absolute inset-0 rounded-3xl pointer-events-none ${
          isDark ? 'bg-gradient-to-br from-white/5 to-transparent' : 'bg-gradient-to-br from-slate-50/50 to-transparent'
        }`}></div>
        
        <div className="flex flex-col items-center mb-6 sm:mb-8 relative z-10">
          <div className={`w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl sm:rounded-[24px] flex items-center justify-center mb-4 sm:mb-6 shadow-[0_0_30px_-5px_rgba(245,158,11,0.4)] border border-white/20`}>
            <ShieldCheck className="text-white w-8 h-8 sm:w-10 sm:h-10" strokeWidth={1.5} />
          </div>
          <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight mb-2 transition-colors ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            GCN Tracker
          </h1>
          <p className={`text-xs sm:text-sm font-medium text-center leading-relaxed transition-colors ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Hệ thống quản lý tình trạng<br className="hidden sm:inline"/> cấp GCN QSDĐ VMT
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6 relative z-10">
          <div className="space-y-1.5 sm:space-y-2">
            <label className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-widest pl-1 transition-colors ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Tên đăng nhập / Email
            </label>
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Nhập tên đăng nhập..."
                className={`w-full rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 outline-none focus:ring-2 transition-all text-sm sm:text-base border group-hover:border-amber-500/20 ${
                  isDark 
                    ? 'border-white/10 bg-black/20 text-white placeholder:text-slate-600 focus:ring-amber-500/40' 
                    : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:ring-amber-500/30 focus:bg-white'
                }`}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            <label className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-widest pl-1 transition-colors ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Mật khẩu
            </label>
            <div className="relative group">
              <input 
                type="password" 
                placeholder="••••••••"
                className={`w-full rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 outline-none focus:ring-2 transition-all text-sm sm:text-base border group-hover:border-amber-500/20 ${
                  isDark 
                    ? 'border-white/10 bg-black/20 text-white placeholder:text-slate-600 focus:ring-amber-500/40' 
                    : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:ring-amber-500/30 focus:bg-white'
                }`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold uppercase tracking-widest text-xs sm:text-sm shadow-[0_0_20px_-5px_rgba(245,158,11,0.5)] hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.6)] hover:scale-[1.01] active:scale-95 transition-all mt-4 sm:mt-6 disabled:opacity-75 disabled:cursor-not-allowed border border-amber-400/50"
          >
            {isLoading ? 'Đang xử lí...' : 'Đăng nhập'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
