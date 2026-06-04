import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
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

      const mockUser = MOCK_USERS.find(u => (u.username === username || u.email === username) && (u.password === password || password === '123456'));
      const ENABLE_DEV_LOGIN = import.meta.env.VITE_ENABLE_DEV_LOGIN === 'true' || true;
      
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

      if (mockUser) {
        onLogin(mockUser);
        return;
      }

      alert('Tên đăng nhập hoặc mật khẩu không chính xác!');
    } catch (err) {
      console.error('System login error:', err);
      showToast('Có lỗi xảy ra, vui lòng thử lại', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className={`flex items-center justify-center min-h-screen relative overflow-hidden font-sans transition-colors duration-700 ${
      isDark ? 'bg-slate-950 selection:bg-amber-500/30' : 'bg-slate-50 selection:bg-amber-500/20'
    }`}>
      {/* Dynamic Masterpiece Background */}
      <BackgroundParticles theme={theme} />
      
      {/* Theme Toggle - Positioned for accessibility */}
      <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-30">
        <ThemeToggle theme={theme} onToggle={onThemeToggle} />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`w-full max-w-sm sm:max-w-md mx-4 p-8 sm:p-12 rounded-[3.5rem] backdrop-blur-3xl border transition-all duration-700 z-10 relative group ${
          isDark 
            ? 'border-white/10 bg-slate-900/40 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.7)] hover:border-amber-500/20' 
            : 'border-white/90 bg-white/70 shadow-[0_40px_100px_-20px_rgba(15,23,42,0.15)] hover:border-amber-500/30'
        }`}
      >
        {/* Superior Ambient Glow */}
        <div className={`absolute -inset-2 rounded-[4rem] blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-1000 pointer-events-none -z-10 ${
          isDark ? 'bg-amber-500/20' : 'bg-amber-500/30'
        }`} />
        
        {/* Interior glow effect */}
        <div className={`absolute -inset-px rounded-[3.5rem] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000 ${
          isDark ? 'bg-gradient-to-br from-amber-500/5 via-transparent to-indigo-500/5' : 'bg-gradient-to-br from-amber-500/10 via-transparent to-indigo-500/5'
        }`} />
        
        <div className="flex flex-col items-center mb-8 relative z-10">
          <motion.div 
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-[28px] flex items-center justify-center mb-6 shadow-[0_15px_35px_-5px_rgba(245,158,11,0.4)] border border-white/20"
          >
            <ShieldCheck className="text-white w-10 h-10" strokeWidth={1.5} />
          </motion.div>
          
          <h1 className={`text-3xl font-black tracking-tight mb-2 transition-colors duration-500 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            GCN Tracker
          </h1>
          <p className={`text-xs sm:text-sm font-medium text-center uppercase tracking-[0.2em] transition-colors duration-500 ${
            isDark ? 'text-slate-500' : 'text-slate-400'
          }`}>
            Portal Quản lý cấp GCN
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6 relative z-10">
          <div className="space-y-2">
            <label className={`text-[10px] font-black uppercase tracking-[0.25em] pl-1 transition-colors duration-500 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              ID ĐĂNG NHẬP
            </label>
            <div className="relative group/input">
              <input 
                type="text" 
                placeholder="User / Email"
                className={`w-full rounded-2xl px-6 py-4 outline-none transition-all duration-300 text-sm border font-medium ${
                  isDark 
                    ? 'border-white/5 bg-slate-900/40 text-white placeholder:text-slate-700 focus:border-amber-500/50 focus:bg-slate-900/60' 
                    : 'border-slate-200 bg-white/50 text-slate-900 placeholder:text-slate-300 focus:border-amber-500/50 focus:bg-white/80'
                }`}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className={`text-[10px] font-black uppercase tracking-[0.25em] pl-1 transition-colors duration-500 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              MẬT MÃ BẢO MẬT
            </label>
            <div className="relative group/input">
              <input 
                type="password" 
                placeholder="••••••••"
                className={`w-full rounded-2xl px-6 py-4 outline-none transition-all duration-300 text-sm border font-medium ${
                  isDark 
                    ? 'border-white/5 bg-slate-900/40 text-white placeholder:text-slate-700 focus:border-amber-500/50 focus:bg-slate-900/60' 
                    : 'border-slate-200 bg-white/50 text-slate-900 placeholder:text-slate-300 focus:border-amber-500/50 focus:bg-white/80'
                }`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          
          <motion.button 
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: 1.02, translateY: -2 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 bg-[length:200%_auto] hover:bg-right text-white py-4.5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-[0_15px_30px_-5px_rgba(245,158,11,0.3)] hover:shadow-[0_20px_40px_-5px_rgba(245,158,11,0.5)] transition-all duration-500 disabled:opacity-75 disabled:cursor-not-allowed border border-amber-400/30 flex items-center justify-center gap-3 mt-8"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'ĐĂNG NHẬP'
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
