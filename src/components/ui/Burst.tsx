import React, { useMemo } from 'react';

const COLORS = ['rgb(var(--c-primary))', 'rgb(var(--c-accent))', 'rgb(var(--c-secondary))', 'rgb(var(--c-glow))', 'rgb(var(--c-success))'];

export const Burst: React.FC<{ pieces?: number; distance?: number }> = ({ pieces = 14, distance = 46 }) => {
  const parts = useMemo(
    () =>
      Array.from({ length: pieces }, (_, i) => ({
        r: `${(360 / pieces) * i + Math.random() * 14}deg`,
        d: `-${distance * (0.7 + Math.random() * 0.6)}px`,
        color: COLORS[i % COLORS.length],
        delay: `${Math.random() * 0.08}s`,
      })),
    [pieces, distance]
  );
  return (
    <span className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {parts.map((p, i) => (
        <span
          key={i}
          className="burst-piece"
          style={{ background: p.color, animationDelay: p.delay, ['--r' as string]: p.r, ['--d' as string]: p.d } as React.CSSProperties}
        />
      ))}
    </span>
  );
};

export default Burst;
