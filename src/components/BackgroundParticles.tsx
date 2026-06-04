import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';

interface BackgroundParticlesProps {
  theme: 'light' | 'dark';
}

export const BackgroundParticles: React.FC<BackgroundParticlesProps> = ({ theme }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const isDark = theme === 'dark';

  // Smooth mouse tracking for parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 2 + 1;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > canvas!.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas!.height) this.vy *= -1;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? 'rgba(245, 158, 11, 0.4)' : 'rgba(245, 158, 11, 0.2)';
        ctx.fill();
      }
    }

    const init = () => {
      particles = [];
      const count = Math.floor((canvas.width * canvas.height) / 15000);
      for (let i = 0; i < Math.min(count, 100); i++) {
        particles.push(new Particle());
      }
    };

    const drawLine = (p1: Particle, p2: Particle) => {
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 150) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = `rgba(245, 158, 11, ${(isDark ? 0.2 : 0.15) * (1 - distance / 150)})`;
        ctx.stroke();
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.update();
        p.draw();
        for (let j = i + 1; j < particles.length; j++) {
          drawLine(p, particles[j]);
        }
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    resize();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDark]);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Layer 1: Mesh Gradient */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          animate={{ x: -mousePos.x * 1.5, y: -mousePos.y * 1.5 }}
          className={`absolute top-[-20%] left-[-20%] w-[140%] h-[140%] opacity-40 mix-blend-soft-light transition-colors duration-700 ${
            isDark ? 'bg-slate-950' : 'bg-slate-50'
          }`}
        >
          <div className={`absolute top-1/4 left-1/4 w-1/2 h-1/2 rounded-full blur-[120px] animate-mesh bg-indigo-600/20`}></div>
          <div className={`absolute bottom-1/4 right-1/4 w-1/2 h-1/2 rounded-full blur-[120px] animate-mesh-slow bg-teal-500/15`}></div>
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 rounded-full blur-[120px] animate-mesh bg-amber-500/10`}></div>
        </motion.div>
      </div>

      {/* Layer 2: Topology Grid */}
      <motion.div 
        animate={{ x: -mousePos.x * 0.5, y: -mousePos.y * 0.5 }}
        className="absolute inset-0 z-1 opacity-[0.06] dark:opacity-[0.08]"
      >
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke={isDark ? "white" : "black"} strokeWidth="0.5" strokeDasharray="4,2"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </motion.div>

      {/* Layer 3: Particles Canvas */}
      <motion.canvas
        ref={canvasRef}
        animate={{ x: mousePos.x, y: mousePos.y }}
        className="absolute inset-0 z-2"
      />

      {/* Vignette Overlay */}
      <div className={`absolute inset-0 z-3 pointer-events-none transition-all duration-700 ${
        isDark 
          ? 'bg-[radial-gradient(circle_at_50%_50%,transparent_20%,rgba(2,6,23,0.6)_100%)]' 
          : 'bg-[radial-gradient(circle_at_50%_50%,transparent_40%,rgba(248,250,252,0.4)_100%)]'
      }`} />
    </div>
  );
};
