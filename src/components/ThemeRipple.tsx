import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ThemeRippleProps {
  theme: 'light' | 'dark';
}

export const ThemeRipple: React.FC<ThemeRippleProps> = ({ theme }) => {
  const [rippling, setRippling] = useState(false);
  const [rippleColor, setRippleColor] = useState('');
  const [ripplePos, setRipplePos] = useState({ x: 0, y: 0 });
  const prevThemeRef = useRef(theme);

  useEffect(() => {
    if (prevThemeRef.current !== theme) {
      // Capture mouse position or use top right as default (where toggle usually is)
      const x = window.innerWidth - 40;
      const y = 40;
      
      setRipplePos({ x, y });
      setRippleColor(theme === 'dark' ? '#020617' : '#f8fafc');
      setRippling(true);
      
      const timer = setTimeout(() => {
        setRippling(false);
      }, 1000);
      
      prevThemeRef.current = theme;
      return () => clearTimeout(timer);
    }
  }, [theme]);

  return (
    <AnimatePresence>
      {rippling && (
        <motion.div
          initial={{ clipPath: `circle(0% at ${ripplePos.x}px ${ripplePos.y}px)` }}
          animate={{ clipPath: `circle(150% at ${ripplePos.x}px ${ripplePos.y}px)` }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[9999] pointer-events-none"
          style={{ backgroundColor: rippleColor }}
        />
      )}
    </AnimatePresence>
  );
};
