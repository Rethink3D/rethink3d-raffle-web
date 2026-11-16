import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, PauseCircle, KeyRound } from 'lucide-react';
import type { Campaign, Prize } from '../../types';
import { Button } from '../ui/Button';
import { TickNumber } from '../ui/TickNumber';
import { formatDrawWhen } from '../../utils/drawWhen';

interface Countdown {
  isExpired: boolean;
  formatted: { days: string; hours: string; minutes: string; seconds: string };
}

interface EventHeroProps {
  campaign: Campaign;
  prize: Prize;
  drawTarget: string;
  countdown: Countdown;
  loggedIn: boolean;
}

const OrbitFrame: React.FC<{ imageUrl?: string | null; alt: string }> = ({ imageUrl, alt }) => (
  <div className="relative mx-auto w-60 h-60 sm:w-72 sm:h-72 md:w-80 md:h-80 shrink-0">
    <svg viewBox="0 0 320 320" className="absolute inset-0 w-full h-full anim-orbit" aria-hidden="true">
      <defs>
        <linearGradient id="hero-orbit" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="rgb(var(--c-primary))" />
          <stop offset="0.55" stopColor="rgb(var(--c-glow))" />
          <stop offset="1" stopColor="rgb(var(--c-accent))" />
        </linearGradient>
      </defs>
      <circle cx="160" cy="160" r="150" fill="none" stroke="url(#hero-orbit)" strokeWidth="5" className="anim-orbit-draw" />
      <circle cx="266" cy="54" r="10" fill="rgb(var(--c-strong))" />
      <circle cx="54" cy="266" r="7" fill="rgb(var(--c-strong))" />
    </svg>
    <div className="absolute inset-[9%] rounded-full overflow-hidden border border-brand-border bg-brand-surface anim-rise">
      {imageUrl ? (
        <img src={imageUrl} alt={alt} className="w-full h-full object-cover" draggable={false} />
      ) : null}
    </div>
  </div>
);

export const EventHero: React.FC<EventHeroProps> = ({ campaign, prize, drawTarget, countdown, loggedIn }) => {
  const navigate = useNavigate();
  const status = campaign.status;
  const units: Array<[string, string]> = [
    [countdown.formatted.days, 'dias'],
    [countdown.formatted.hours, 'horas'],
    [countdown.formatted.minutes, 'min'],
    [countdown.formatted.seconds, 'seg'],
  ];
  const showDays = countdown.formatted.days !== '00';

  return (
    <section className="section-tint relative overflow-hidden border border-brand-primary/40 rounded-theme bg-brand-surface/60 px-5 py-10 md:px-10 md:py-14">
      <div className="relative z-10 grid md:grid-cols-[auto_minmax(0,1fr)] items-center gap-8 md:gap-12">
        <OrbitFrame imageUrl={prize.imageUrl} alt={prize.name} />

        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <p className="anim-rise anim-rise-2 inline-flex items-center gap-2 text-sm font-ui font-semibold text-brand-accent">
            <Radio size={16} />
            {status === 'DRAWING'
              ? 'O sorteio está acontecendo agora'
              : `Sorteio ao vivo ${formatDrawWhen(drawTarget)}`}
          </p>

          <h1 className="anim-rise anim-rise-2 mt-3 font-display font-extrabold text-brand-strong text-3xl sm:text-4xl md:text-5xl leading-[1.08] max-w-[18ch]">
            {prize.name}
          </h1>

          {prize.description && (
            <p className="anim-rise anim-rise-3 mt-4 text-sm sm:text-base text-brand-muted leading-relaxed max-w-[52ch]">
              {prize.description}
            </p>
          )}

          <div className="anim-rise anim-rise-3 mt-6">
            {status === 'DRAWING' ? null : status === 'PAUSED' ? (
              <p className="inline-flex items-center gap-2 text-sm text-brand-text">
                <PauseCircle size={16} className="text-brand-accent" />
                Já saiu uma rodada. A próxima pode começar a qualquer momento.
              </p>
            ) : !drawTarget ? null : countdown.isExpired ? (
              <p className="text-base font-display font-bold text-brand-success">Já é hora do sorteio</p>
            ) : (
              <div className="flex items-end gap-2 sm:gap-3" aria-label="Tempo até o sorteio">
                {units
                  .filter(([, label]) => showDays || label !== 'dias')
                  .map(([value, label]) => (
                    <div key={label} className="flex flex-col items-center">
                      <div className="min-w-[3.25rem] sm:min-w-[3.75rem] px-2 py-2 rounded-theme bg-sunken-55 border border-brand-border text-center">
                        <TickNumber value={value} className="font-display font-extrabold text-2xl sm:text-3xl text-brand-strong" />
                      </div>
                      <span className="mt-1 text-[11px] text-brand-muted">{label}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="anim-rise anim-rise-4 mt-7 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {status === 'DRAWING' ? (
              <Button variant="primary" size="lg" className="anim-sheen" onClick={() => navigate(`/watch/${campaign.id}`)} icon={<Radio size={18} />}>
                Assistir ao sorteio
              </Button>
            ) : loggedIn ? (
              <Button variant="primary" size="lg" className="anim-sheen" onClick={() => navigate('/quests')}>
                Ganhar mais cupons
              </Button>
            ) : (
              <>
                <Button variant="primary" size="lg" className="anim-sheen" onClick={() => navigate('/register')}>
                  Quero concorrer
                </Button>
                <Button variant="secondary" size="lg" onClick={() => navigate('/login')}>
                  Já tenho conta
                </Button>
              </>
            )}
          </div>

          {!loggedIn && status !== 'DRAWING' && (
            <p className="anim-rise anim-rise-4 mt-4 inline-flex items-center gap-2 text-xs text-brand-muted">
              <KeyRound size={14} className="shrink-0" />
              O cadastro pede o código de 4 dígitos da tela do estande.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default EventHero;
