import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  angle: number;
  spin: number;
}

interface ConfettiProps {
  trigger: boolean;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#a855f7'];

export default function Confetti({ trigger }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!trigger) return;

    const newParticles: Particle[] = Array.from({ length: 40 }).map((_, i) => ({
      id: Date.now() + i,
      x: 50, // Center X percentage
      y: 50, // Center Y percentage
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 8 + 6,
      angle: Math.random() * 360,
      spin: Math.random() * 360 - 180,
    }));

    setParticles(newParticles);

    const timer = setTimeout(() => {
      setParticles([]);
    }, 1500);

    return () => clearTimeout(timer);
  }, [trigger]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      <AnimatePresence>
        {particles.map((p) => {
          const radian = (p.angle * Math.PI) / 180;
          const distance = Math.random() * 150 + 50; // pixels to travel
          const targetX = Math.cos(radian) * distance;
          const targetY = Math.sin(radian) * distance + 100; // gravity curve

          return (
            <motion.div
              key={p.id}
              initial={{ x: '50%', y: '50%', scale: 0, rotate: 0, opacity: 1 }}
              animate={{
                x: `calc(50% + ${targetX}px)`,
                y: `calc(50% + ${targetY}px)`,
                scale: [1, 1.2, 0.5],
                rotate: p.spin,
                opacity: [1, 1, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              }}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}
