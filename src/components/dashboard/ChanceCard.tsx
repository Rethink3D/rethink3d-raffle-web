import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Users, ArrowRight, PartyPopper } from 'lucide-react';
import type { Mission } from '../../types';
import { Button } from '../ui/Button';

interface ChanceCardProps {
  myTickets: number;
  rank: number | null;
  totalTickets: number | null;
  totalParticipants: number | null;
  quests: Mission[];
  locked: boolean;
}

const pct = (value: number) => {
  if (value >= 10) return `${Math.round(value)}%`;
  if (value >= 1) return `${value.toFixed(1).replace('.', ',')}%`;
  return `${value.toFixed(2).replace('.', ',')}%`;
};

const useCountUp = (target: number, duration = 900) => {
  const [value, setValue] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const start = performance.now();
    const origin = from.current;
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(origin + (target - origin) * eased));
      if (t < 1) raf = requestAnimationFrame(step);
      else from.current = target;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
};

export const ChanceCard: React.FC<ChanceCardProps> = ({ myTickets, rank, totalTickets, totalParticipants, quests, locked }) => {
  const navigate = useNavigate();
  const shown = useCountUp(myTickets);
  const pending = quests
    .filter((q) => !q.isCompleted && q.type !== 'QUIZ')
    .sort((a, b) => b.reward - a.reward);
  const quizPending = quests.find((q) => !q.isCompleted && q.type === 'QUIZ');
  const next = pending[0] ?? quizPending;
  const chance = totalTickets && totalTickets > 0 ? (myTickets / totalTickets) * 100 : null;
  const nextGain = next && next.type !== 'QUIZ' ? next.reward : null;
  const chanceAfter =
    chance !== null && nextGain && totalTickets ? ((myTickets + nextGain) / (totalTickets + nextGain)) * 100 : null;
  const allDone = quests.length > 0 && quests.every((q) => q.isCompleted);

  return (
    <section className="anim-rise relative overflow-hidden rounded-theme border border-brand-primary/50 bg-brand-surface p-5 sm:p-6 theme-card">
      <div className="grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-brand-primary/15 border border-brand-primary/50 text-brand-primary shrink-0">
            <Ticket size={26} />
          </div>
          <div>
            <div className="font-display font-extrabold text-4xl sm:text-5xl text-brand-strong leading-none tabular-nums">{shown}</div>
            <div className="text-sm text-brand-muted mt-1">{myTickets === 1 ? 'cupom seu na roleta' : 'cupons seus na roleta'}</div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:border-l sm:border-brand-border sm:pl-6">
          {chance === null && rank !== null && (
            <p className="text-sm text-brand-text">
              Você está em <strong className="text-brand-strong font-display text-base">{rank}º lugar</strong> no ranking de cupons.
            </p>
          )}
          {chance !== null && (
            <p className="text-sm text-brand-text">
              Sua chance agora é de <strong className="text-brand-strong font-display text-base">{pct(chance)}</strong>
              {totalParticipants ? (
                <span className="text-brand-muted inline-flex items-center gap-1 ml-1">
                  <Users size={13} className="inline" /> {totalParticipants} {totalParticipants === 1 ? 'pessoa' : 'pessoas'} concorrendo
                </span>
              ) : null}
            </p>
          )}

          {locked ? null : allDone ? (
            <p className="inline-flex items-center gap-2 text-sm text-brand-success font-semibold">
              <PartyPopper size={16} /> Você fez todos os desafios. Agora é torcer!
            </p>
          ) : next ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <p className="text-sm text-brand-muted flex-1">
                Próximo passo: <span className="text-brand-strong font-semibold">{next.title}</span>{' '}
                <span className="text-brand-accent font-semibold whitespace-nowrap">
                  {next.type === 'QUIZ' ? `+${next.reward} por acerto` : `+${next.reward} cupons`}
                </span>
                {chanceAfter !== null && chance !== null && (
                  <span className="block text-xs mt-1">Sua chance sobe para {pct(chanceAfter)}.</span>
                )}
              </p>
              <Button variant="primary" size="md" className="anim-sheen shrink-0" icon={<ArrowRight size={15} />} onClick={() => navigate('/quests')}>
                Fazer agora
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default ChanceCard;
