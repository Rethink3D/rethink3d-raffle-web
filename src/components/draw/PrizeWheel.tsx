import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { DrawParticipantPreview } from '../../store/drawStore';

const SLICE_COLORS = ['#7c3aed', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#a855f7'];
const MIN_LABEL_DEGREES = 10;
const SPIN_SPEED_DEG_PER_SEC = 300;
const EXTRA_SPINS = 3;
// Piso/teto de duração da freada — a duração "natural" (ver cálculo abaixo)
// varia pouco fora dessa faixa, então isso só evita casos extremos.
const MIN_DECELERATION_MS = 5500;
const MAX_DECELERATION_MS = 8500;

interface Slice {
  key: string;
  label: string;
  tickets: number;
  startDeg: number;
  endDeg: number;
  midDeg: number;
  color: string;
}

interface PrizeWheelProps {
  participants: DrawParticipantPreview[];
  othersTickets: number;
  othersCount: number;
  isSpinning: boolean;
  winnerId: string | null;
  // Chamado quando a roleta termina de frear de verdade na fatia do
  // vencedor — o card de resultado só deve trocar depois disso, senão a
  // freada nunca chega a ser vista.
  onSettled?: () => void;
}

const normalizeAngle = (angle: number) => ((angle % 360) + 360) % 360;

export const PrizeWheel: React.FC<PrizeWheelProps> = ({
  participants,
  othersTickets,
  othersCount,
  isSpinning,
  winnerId,
  onSettled,
}) => {
  const rotationRef = useRef(0);
  const [displayRotation, setDisplayRotation] = useState(0);
  const phaseRef = useRef<'idle' | 'spinning' | 'decelerating'>('idle');
  const decelRef = useRef<{ start: number; from: number; to: number; duration: number } | null>(null);
  const rafRef = useRef<number | undefined>(undefined);
  const lastFrameRef = useRef<number | null>(null);
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;

  const slices = useMemo<Slice[]>(() => {
    const items = [
      ...participants.map((p) => ({ key: p.userId, label: p.name, tickets: p.tickets })),
      ...(othersCount > 0 ? [{ key: '__others__', label: `+${othersCount} outros`, tickets: othersTickets }] : []),
    ].filter((i) => i.tickets > 0);

    const total = items.reduce((sum, i) => sum + i.tickets, 0);
    if (total === 0) return [];

    let cursor = 0;
    return items.map((item, idx) => {
      const sliceDeg = (item.tickets / total) * 360;
      const startDeg = cursor;
      const endDeg = cursor + sliceDeg;
      cursor = endDeg;
      return {
        key: item.key,
        label: item.label,
        tickets: item.tickets,
        startDeg,
        endDeg,
        midDeg: startDeg + sliceDeg / 2,
        color: SLICE_COLORS[idx % SLICE_COLORS.length],
      };
    });
  }, [participants, othersTickets, othersCount]);

  const conicGradient = useMemo(() => {
    if (slices.length === 0) return '#1e1e3a';
    const stops = slices.map((s) => `${s.color} ${s.startDeg}deg ${s.endDeg}deg`);
    return `conic-gradient(from 0deg, ${stops.join(', ')})`;
  }, [slices]);

  // Loop único de animação: gira continuamente enquanto isSpinning, depois
  // desacelera suavemente até a fatia do vencedor quando ele é revelado.
  useEffect(() => {
    const loop = (now: number) => {
      if (lastFrameRef.current === null) lastFrameRef.current = now;
      const dt = (now - lastFrameRef.current) / 1000;
      lastFrameRef.current = now;

      if (phaseRef.current === 'spinning') {
        rotationRef.current += SPIN_SPEED_DEG_PER_SEC * dt;
        setDisplayRotation(rotationRef.current);
      } else if (phaseRef.current === 'decelerating' && decelRef.current) {
        const { start, from, to, duration } = decelRef.current;
        const elapsed = now - start;
        const t = Math.min(elapsed / duration, 1);
        // Ease-out quadrático = desaceleração constante (física real de uma
        // roleta freando): a velocidade cai de forma linear até zero, sem
        // nenhum "pulo" em relação à velocidade do giro contínuo anterior.
        const eased = 1 - Math.pow(1 - t, 2);
        rotationRef.current = from + (to - from) * eased;
        setDisplayRotation(rotationRef.current);
        if (t >= 1) {
          phaseRef.current = 'idle';
          decelRef.current = null;
          onSettledRef.current?.();
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    if (isSpinning && phaseRef.current === 'idle') {
      phaseRef.current = 'spinning';
    }
  }, [isSpinning]);

  useEffect(() => {
    if (!winnerId || slices.length === 0 || phaseRef.current !== 'spinning') return;
    const winnerSlice = slices.find((s) => s.key === winnerId) ?? slices[slices.length - 1];
    // O ponteiro fica fixo no topo (0deg); rotacionar a roleta em R faz o ponto
    // que estava no ângulo A aparecer em (A + R) mod 360. Queremos que o meio
    // da fatia do vencedor caia em 0deg, então R = (360 - midDeg) mod 360.
    const targetRestAngle = normalizeAngle(360 - winnerSlice.midDeg);
    const currentMod = normalizeAngle(rotationRef.current);
    const forwardDelta = normalizeAngle(targetRestAngle - currentMod);
    const distance = forwardDelta + EXTRA_SPINS * 360;
    const finalRotation = rotationRef.current + distance;

    // Duração calculada a partir da velocidade atual do giro, pra freada
    // começar suave (sem pulo) e ainda assim dar tempo de ver a roleta indo
    // cada vez mais devagar até parar.
    const naturalDurationMs = (2 * distance * 1000) / SPIN_SPEED_DEG_PER_SEC;
    const duration = Math.min(Math.max(naturalDurationMs, MIN_DECELERATION_MS), MAX_DECELERATION_MS);

    decelRef.current = { start: performance.now(), from: rotationRef.current, to: finalRotation, duration };
    phaseRef.current = 'decelerating';
  }, [winnerId, slices]);

  if (slices.length === 0) {
    return (
      <div className="w-64 h-64 rounded-full border-4 border-cyber-border bg-cyber-surface/60 flex items-center justify-center text-cyber-muted text-xs font-mono text-center px-6">
        Aguardando participantes com tickets...
      </div>
    );
  }

  return (
    <div className="relative w-72 h-72 select-none">
      {/* Ponteiro fixo no topo */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[18px] border-l-transparent border-r-transparent border-t-cyber-accent drop-shadow-lg" />

      <div
        className="w-full h-full rounded-full border-4 border-cyber-border relative overflow-hidden shadow-[0_0_30px_rgba(124,58,237,0.35)]"
        style={{ background: conicGradient, transform: `rotate(${displayRotation}deg)` }}
      >
        {slices.map((s) => {
          const sliceDeg = s.endDeg - s.startDeg;
          if (sliceDeg < MIN_LABEL_DEGREES) return null;
          return (
            <div
              key={s.key}
              className="absolute inset-0 flex justify-center"
              style={{ transform: `rotate(${s.midDeg}deg)` }}
            >
              <span
                className="mt-3 text-[9px] font-orbitron font-bold text-white uppercase tracking-wide truncate max-w-[70px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                title={s.label}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Centro decorativo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-10 h-10 rounded-full bg-cyber-bg border-2 border-cyber-accent shadow-lg" />
      </div>
    </div>
  );
};

export default PrizeWheel;
