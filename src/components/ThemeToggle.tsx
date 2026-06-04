import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon } from 'lucide-react';
import { cn } from '../lib/utils';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  onToggle: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onToggle }) => {
  const isDark = theme === 'dark';

  return (
    <button
      onClick={onToggle}
      className={cn(
        "relative flex items-center w-20 h-10 p-1.5 rounded-full transition-all duration-700 group overflow-hidden shadow-sm",
        isDark ? "bg-slate-900 border border-slate-800 shadow-indigo-500/10" : "bg-amber-50 border border-amber-100 shadow-amber-500/10"
      )}
      aria-label="Toggle Theme"
    >
      {/* Background glow effects */}
      <div className={cn(
        "absolute inset-0 opacity-20 transition-opacity duration-1000",
        isDark ? "bg-[radial-gradient(circle_at_center,_#6366f1,transparent)]" : "bg-[radial-gradient(circle_at_center,_#f59e0b,transparent)]"
      )} />

      <motion.div
        layout
        className={cn(
          "z-10 flex items-center justify-center w-7 h-7 rounded-full shadow-2xl relative",
          isDark ? "bg-indigo-500" : "bg-amber-400"
        )}
        animate={{
          x: isDark ? 40 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 25
        }}
      >
        <AnimatePresence mode="wait">
          {isDark ? (
            <motion.div
              key="moon"
              initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.4 }}
            >
              <Moon size={16} className="text-white fill-white/20" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.4 }}
            >
              <Sun size={16} className="text-white fill-white/20" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic particles around the toggle */}
        <div className="absolute inset-[-10px] pointer-events-none">
           {[...Array(6)].map((_, i) => (
             <motion.div
               key={`toggle-particle-${i}`}
               initial={{ opacity: 0 }}
               animate={{ 
                 opacity: [0, 0.4, 0],
                 scale: [0, 1, 0],
                 x: Math.cos(i * 60 * Math.PI/180) * 15,
                 y: Math.sin(i * 60 * Math.PI/180) * 15
               }}
               transition={{ 
                 duration: 1.5, 
                 repeat: Infinity, 
                 delay: i * 0.2,
                 ease: "easeInOut"
               }}
               className={cn(
                 "absolute top-1/2 left-1/2 w-1 h-1 rounded-full",
                 isDark ? "bg-indigo-400" : "bg-amber-300"
               )}
               style={{ marginLeft: -2, marginTop: -2 }}
             />
           ))}
        </div>
      </motion.div>

      <div className="absolute inset-0 flex justify-between px-3.5 items-center pointer-events-none">
        <Sun size={12} className={cn("transition-all duration-700", isDark ? "opacity-20 translate-x-1" : "opacity-0 -translate-x-2")} />
        <Moon size={12} className={cn("transition-all duration-700", isDark ? "opacity-0 translate-x-2" : "opacity-20 -translate-x-1")} />
      </div>
    </button>
  );
};
