import React from 'react';
import { motion } from 'motion/react';
import { Sun, Moon } from 'lucide-react';
import { cn } from '../lib/utils';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  onToggle: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "relative flex items-center w-16 h-8 p-1 rounded-full transition-colors duration-500",
        theme === 'light' ? "bg-amber-100" : "bg-slate-800"
      )}
      aria-label="Toggle Theme"
    >
      <motion.div
        layout
        className={cn(
          "z-10 flex items-center justify-center w-6 h-6 rounded-full shadow-lg",
          theme === 'light' ? "bg-amber-400" : "bg-indigo-400"
        )}
        animate={{
          x: theme === 'light' ? 0 : 32,
          rotate: theme === 'light' ? 0 : 360
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20
        }}
      >
        {theme === 'light' ? (
          <Sun size={14} className="text-white" />
        ) : (
          <Moon size={14} className="text-white" />
        )}
      </motion.div>
      <div className="absolute inset-0 flex justify-between px-2 items-center pointer-events-none">
        <Sun size={12} className={cn("transition-opacity duration-300", theme === 'light' ? "opacity-0" : "opacity-20 text-slate-400")} />
        <Moon size={12} className={cn("transition-opacity duration-300", theme === 'light' ? "opacity-20 text-amber-600" : "opacity-0")} />
      </div>
    </button>
  );
};
