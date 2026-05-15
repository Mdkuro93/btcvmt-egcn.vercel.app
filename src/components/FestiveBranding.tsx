import React from 'react';
import { motion } from 'motion/react';

export default function FestiveBranding() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
      {/* Subtle festive accents could go here if needed, or leave empty for generic branding */}
      <div className="absolute top-0 right-0 p-8 flex flex-col items-end opacity-20">
         <div className="text-[10px] font-black uppercase tracking-[0.4em] rotate-90 origin-right text-indigo-500">
           Sunshine Group • Legal Management System
         </div>
      </div>
    </div>
  );
}
