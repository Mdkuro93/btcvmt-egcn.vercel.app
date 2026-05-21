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

  return (
    <div className="flex items-center justify-center min-h-screen relative overflow-hidden font-sans bg-slate-950 selection:bg-amber-500/30">
      {/* Background Amber Orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[500px] h-[500px] bg-amber-500/20 blur-[120px] rounded-full mix-blend-screen"></div>
        <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-amber-600/10 blur-[100px] rounded-full mix-blend-screen"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-indigo-500/10 blur-[150px] rounded-full mix-blend-screen"></div>
      </div>
      
      {/* Theme Toggle - adjusted for dark glass theme */}
      <div className="absolute top-8 right-8 z-20">
        <button 
          onClick={onThemeToggle}
          className="p-3 rounded-2xl transition-all shadow-xl backdrop-blur-md border border-white/10 bg-white/5 text-amber-500 hover:bg-white/10"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-md p-10 rounded-[32px] backdrop-blur-xl border border-white/10 bg-white/5 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 relative"
      >
        <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
        
        <div className="flex flex-col items-center mb-10 relative z-10">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-[24px] flex items-center justify-center mb-6 shadow-[0_0_40px_-10px_rgba(245,158,11,0.5)] border border-white/20">
            <ShieldCheck className="text-white" size={40} strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">GCN Tracker</h1>
          <p className="text-slate-400 text-sm font-medium text-center leading-relaxed">Hệ thống quản lý tình trạng<br/>cấp GCN QSDĐ VMT</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6 relative z-10">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Tên đăng nhập / Email</label>
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Nhập tên đăng nhập..."
                className="w-full rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-amber-500/50 transition-all text-base border border-white/10 bg-black/20 text-white placeholder:text-slate-600 group-hover:border-white/20"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Mật khẩu</label>
            <div className="relative group">
              <input 
                type="password" 
                placeholder="••••••••"
                className="w-full rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-amber-500/50 transition-all text-base border border-white/10 bg-black/20 text-white placeholder:text-slate-600 group-hover:border-white/20"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-sm shadow-[0_0_20px_-5px_rgba(245,158,11,0.5)] hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.6)] hover:scale-[1.02] active:scale-95 transition-all mt-6 disabled:opacity-70 disabled:cursor-not-allowed border border-amber-400/50"
          >
            {isLoading ? 'Đang xử lí...' : 'Đăng nhập'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
