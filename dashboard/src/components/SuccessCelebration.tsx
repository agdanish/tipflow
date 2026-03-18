// Copyright 2026 Danish A. Licensed under Apache-2.0.
import { useEffect, useState, useRef } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: 'circle' | 'square' | 'star';
}

const COLORS = ['#22c55e', '#4ade80', '#3b82f6', '#a855f7', '#f59e0b', '#06b6d4'];

function createParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 50 + (Math.random() - 0.5) * 20, // cluster near center
    y: 50 + (Math.random() - 0.5) * 10,
    angle: Math.random() * Math.PI * 2,
    speed: 2 + Math.random() * 4,
    size: 4 + Math.random() * 6,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 10,
    opacity: 1,
    shape: (['circle', 'square', 'star'] as const)[Math.floor(Math.random() * 3)],
  }));
}

interface SuccessCelebrationProps {
  show: boolean;
  onComplete: () => void;
}

export function SuccessCelebration({ show, onComplete }: SuccessCelebrationProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const frameRef = useRef(0);

  useEffect(() => {
    if (!show) return;

    // Respect reduced motion
    const prefersReduced =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setTimeout(onComplete, 300);
      return;
    }

    const initial = createParticles(24);
    setParticles(initial);
    frameRef.current = 0;

    const maxFrames = 60; // ~1 second at 60fps

    const animate = () => {
      frameRef.current++;
      const progress = frameRef.current / maxFrames;

      setParticles((prev) =>
        prev.map((p) => ({
          ...p,
          x: p.x + Math.cos(p.angle) * p.speed * 0.4,
          y: p.y + Math.sin(p.angle) * p.speed * 0.4 + frameRef.current * 0.05, // gravity
          rotation: p.rotation + p.rotationSpeed,
          opacity: Math.max(0, 1 - progress * 1.2),
        })),
      );

      if (frameRef.current < maxFrames) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setParticles([]);
        onComplete();
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [show, onComplete]);

  if (!show || particles.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[300] pointer-events-none"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        {particles.map((p) => (
          <g
            key={p.id}
            transform={`translate(${p.x}, ${p.y}) rotate(${p.rotation})`}
            opacity={p.opacity}
          >
            {p.shape === 'circle' ? (
              <circle r={p.size / 10} fill={p.color} />
            ) : p.shape === 'square' ? (
              <rect
                x={-p.size / 20}
                y={-p.size / 20}
                width={p.size / 10}
                height={p.size / 10}
                fill={p.color}
                rx={0.5}
              />
            ) : (
              // Star shape
              <polygon
                points={`0,${-p.size / 10} ${p.size / 30},${-p.size / 30} ${p.size / 10},0 ${p.size / 30},${p.size / 30} 0,${p.size / 10} ${-p.size / 30},${p.size / 30} ${-p.size / 10},0 ${-p.size / 30},${-p.size / 30}`}
                fill={p.color}
              />
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
