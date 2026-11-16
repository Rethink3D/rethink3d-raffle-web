import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock, Tv, Users,
  ArrowLeft, PartyPopper, Gift, Clock, Trophy,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useDrawStore } from '../../store/drawStore';
import { useSocket } from '../../hooks/useSocket';
import { useCountdown } from '../../hooks/useCountdown';
import { campaignService } from '../../services/campaign.service';
import { drawService } from '../../services/draw.service';
import { getNextDrawTarget } from '../../utils/drawSchedule';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PrizeWheel } from '../../components/draw/PrizeWheel';
import type { Campaign, Draw } from '../../types';
import { copy } from '../../theme/copy';

const CAMPAIGN_REFRESH_MS = 60_000;

// Confete simples em canvas — só entra quando o vencedor é revelado
const ConfettiCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // O canvas não resolve var() em fillStyle — só o CSS resolve. Por isso os
    // tokens do tema são lidos aqui e convertidos em cor literal.
    const rootStyle = getComputedStyle(document.documentElement);
    const token = (name: string) => `rgb(${rootStyle.getPropertyValue(name).trim()})`;
    const colors = [
      token('--c-primary'),
      token('--c-secondary'),
      token('--c-accent'),
      token('--c-success'),
      token('--c-danger'),
    ];
    const particles = Array.from({ length: 120 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height - height,
      size: Math.random() * 6 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedX: Math.random() * 4 - 2,
      speedY: Math.random() * 5 + 3,
      rotation: Math.random() * 360,
      rotationSpeed: Math.random() * 4 - 2,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;
        if (p.y > height) {
          p.y = -20;
          p.x = Math.random() * width;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50 w-full h-full" />;
};

export const DrawWatchPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);

  useSocket(activeCampaign?.id);

  const { winner, isSpinning, participants, totalTickets, othersTickets, othersCount, onlineCount, sessionEndedReason, revokeVersion } = useDrawStore();

  // Rodadas já sorteadas nesta campanha (avulsas ou em cadeia) — busca pelo
  // histórico da própria campanha em vez do sessionId do socket, porque esse
  // sessionId é zerado sempre que a página carrega fora de uma rodada ao vivo
  // (ver clearDraw() abaixo, que existe pra não deixar a roleta travada de uma
  // visita anterior). Sem essa mudança, quem entrava na tela com a campanha já
  // em intervalo nunca via os ganhadores das rodadas anteriores.
  const [recentDraws, setRecentDraws] = useState<Draw[]>([]);

  useEffect(() => {
    if (!activeCampaign?.id) {
      setRecentDraws([]);
      return;
    }
    let isMounted = true;
    drawService
      .getCompletedHistory(activeCampaign.id)
      .then((draws) => {
        if (isMounted) setRecentDraws(draws);
      })
      .catch((err) => console.warn('Failed to load recent draw winners', err));
    return () => {
      isMounted = false;
    };
    // Refaz a busca a cada novo vencedor (rodada nova) ou revogação (admin
    // desfez um sorteio já concluído).
  }, [activeCampaign?.id, winner, revokeVersion]);

  // A roleta avisa quando termina de frear de verdade na fatia do vencedor —
  // só aí trocamos pro card de resultado, senão o card do vencedor aparece
  // assim que o servidor responde e a freada nunca chega a ser vista.
  const [wheelSettled, setWheelSettled] = useState(false);

  useEffect(() => {
    if (isSpinning) setWheelSettled(false);
  }, [isSpinning]);

  useEffect(() => {
    const fetchActiveCampaign = async () => {
      try {
        const campaign = await campaignService.getActiveCampaign();
        setActiveCampaign(campaign);

        // O status da campanha é a fonte da verdade sobre se tem sorteio ao
        // vivo rolando agora ou não. Sem isso, um "isSpinning"/"winner" que
        // ficou preso no store de uma visita anterior (ex: o participante saiu
        // da sala antes do resultado, ou a rodada já tinha terminado antes
        // dele entrar) deixava a roleta girando pra sempre sem nunca resolver.
        if (campaign?.status !== 'DRAWING') {
          useDrawStore.getState().clearDraw();
        }
      } catch (err) {
        console.error('Failed to load active campaign on DrawWatchPage:', err);
      }
    };
    fetchActiveCampaign();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const refreshCampaign = () => {
      campaignService
        .getActiveCampaign()
        .then((campaign) => {
          if (isMounted) setActiveCampaign(campaign);
        })
        .catch((err) => console.warn('Failed to refresh active campaign', err));
    };
    const interval = setInterval(refreshCampaign, CAMPAIGN_REFRESH_MS);
    if (winner || sessionEndedReason || revokeVersion > 0) refreshCampaign();
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [winner, sessionEndedReason, revokeVersion]);

  const countdown = useCountdown(getNextDrawTarget(activeCampaign));

  const missionsOpen = activeCampaign?.status === 'ACTIVE';
  const isWinnerState = winner !== null && wheelSettled;
  const isSpinningState = isSpinning || (winner !== null && !wheelSettled);
  const vaultPrizes = (activeCampaign?.vault?.prizes ?? []).filter(
    (p) => (p.available ?? p.quantity - p.claimed) > 0,
  );

  return (
    <div className="flex flex-col gap-6 font-body text-brand-text">
      {isWinnerState && <ConfettiCanvas />}

      <Button
        variant="secondary"
        size="sm"
        icon={<ArrowLeft size={14} />}
        onClick={() => navigate(user ? '/dashboard' : '/')}
        className="self-start"
      >
        Voltar
      </Button>

      {/* ─── Cabeçalho ao vivo ─── */}
      <div className="flex items-center justify-between bg-brand-surface/60 border border-brand-border rounded-lg p-4 select-none relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none opacity-5 bg-cyber-grid" />

        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded border border-brand-primary bg-brand-primary/10 flex items-center justify-center animate-pulse">
            <Tv size={16} className="text-brand-primary" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-brand-primary rounded-full animate-ping" />
          </div>
          <div>
            <h2 className="text-base font-display font-extrabold uppercase text-brand-strong tracking-widest leading-none">
              Sorteio Ao Vivo
            </h2>
            <div className="text-[9px] font-mono text-brand-secondary tracking-widest mt-1">
              Fique de olho, pode começar a qualquer momento
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-right">
          <div className="hidden sm:flex items-center gap-2">
            <Users size={14} className="text-brand-secondary" />
            <div className="flex flex-col">
              <span className="text-[9px] font-mono text-brand-muted uppercase">Assistindo</span>
              <span className="font-display font-bold text-xs text-brand-strong">{onlineCount || 1}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full flex flex-col gap-6">
        {activeCampaign?.coverImageUrl && (
          <div className="aspect-video relative rounded-lg border border-brand-border overflow-hidden bg-sunken-55 select-none">
            <img
              src={activeCampaign.coverImageUrl}
              alt={activeCampaign.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {isWinnerState ? (
          <Card variant="primary" title="Temos um vencedor! 🎉" subtitle="Parabéns pra quem levou" glow className="anim-reveal">
            <div className="flex flex-col items-center py-6 text-center select-none">
              <div className="relative w-28 h-28 mx-auto mb-6 flex items-center justify-center rounded-full overflow-hidden bg-brand-primary/15 border-2 border-brand-primary glow-primary animate-float">
                {winner.prize?.imageUrl ? (
                  <img src={winner.prize.imageUrl} alt={winner.prize.name} className="w-full h-full object-cover" />
                ) : (
                  <PartyPopper size={48} className="text-brand-primary animate-pulse" />
                )}
              </div>

              <span className="text-[11px] font-mono text-brand-secondary tracking-widest uppercase font-bold">
                O sorteado foi
              </span>

              <h3 className="anim-reveal text-3xl sm:text-4xl font-display font-black text-brand-strong uppercase mt-2 tracking-wide text-glow-primary" style={{ animationDelay: '0.25s' }}>
                {winner.winnerName}
              </h3>

              <div className="w-full max-w-sm border-t border-b border-brand-border/40 py-3.5 my-5">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-[9px] font-mono text-brand-muted uppercase block">Prêmio</span>
                    <span className="font-ui font-bold text-sm text-brand-strong mt-0.5 block">
                      {winner.prize?.name || 'Grande Prêmio'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-brand-muted uppercase block">Ganhou com</span>
                    <span className="font-ui font-bold text-sm text-brand-accent mt-0.5 block">
                      {winner.winnerTickets} {winner.winnerTickets === 1 ? 'cupom' : 'cupons'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-brand-muted uppercase block">Cupons na roleta</span>
                    <span className="font-ui font-bold text-sm text-brand-strong mt-0.5 block">
                      {winner.totalTickets}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-brand-muted max-w-md leading-relaxed px-4">
                {winner.sessionId && !sessionEndedReason
                  ? 'Fica ligado, o sorteio em cadeia continua — mais um prêmio pode sair a qualquer momento!'
                  : 'Nossa equipe vai entrar em contato com o vencedor em breve. Obrigado por participar e fica de olho na próxima campanha!'}
              </p>

              <div className="flex gap-3 w-full mt-6 justify-center">
                <Button variant="primary" size="md" onClick={() => navigate(user ? '/dashboard' : '/')} icon={<ArrowLeft size={14} />}>
                  {user ? 'Painel' : 'Início'}
                </Button>
              </div>
            </div>
          </Card>
        ) : isSpinningState ? (
          <Card variant="secondary" title="Girando a roleta..." subtitle="Não saia daqui, tá quase saindo o resultado!" glow>
            <div className="flex flex-col items-center py-8 text-center select-none gap-6">
              <PrizeWheel
                participants={participants}
                othersTickets={othersTickets}
                othersCount={othersCount}
                isSpinning={isSpinning}
                winnerId={winner?.winnerId ?? null}
                onSettled={() => setWheelSettled(true)}
              />

              <div className="flex flex-col gap-1 items-center">
                <span className="text-xs font-ui font-bold text-brand-strong uppercase tracking-wider">
                  Cada fatia é uma chance real — quanto mais cupons, maior o pedaço
                </span>
                <span className="text-[10px] font-mono text-brand-muted uppercase tracking-widest">
                  {participants.length + (othersCount > 0 ? othersCount : 0)} participante(s) concorrendo · {totalTickets} cupons na roleta
                </span>
              </div>

              {participants.length > 0 && totalTickets > 0 && (
                <ol className="w-full max-w-sm flex flex-col gap-1.5 text-left">
                  {[...participants]
                    .sort((a, b) => b.tickets - a.tickets)
                    .slice(0, 5)
                    .map((p, i) => {
                      const share = (p.tickets / totalTickets) * 100;
                      return (
                        <li key={p.userId} className="relative overflow-hidden rounded-theme border border-brand-border bg-sunken-30 px-3 py-2 text-sm">
                          <span
                            className="absolute inset-y-0 left-0 bg-brand-primary/20 anim-bar"
                            style={{ width: `${Math.max(share, 2)}%`, animationDelay: `${i * 80}ms` }}
                          />
                          <span className="relative flex items-center justify-between gap-3">
                            <span className="truncate text-brand-strong">{p.name}</span>
                            <span className="shrink-0 text-brand-muted tabular-nums">
                              {p.tickets} · {share >= 1 ? share.toFixed(1).replace('.', ',') : share.toFixed(2).replace('.', ',')}%
                            </span>
                          </span>
                        </li>
                      );
                    })}
                </ol>
              )}
            </div>
          </Card>
        ) : activeCampaign?.status === 'PAUSED' ? (
          <div className="flex flex-col gap-6">
            <Card variant="secondary" title="Sorteio em intervalo" subtitle="Já rolou uma rodada — aguarde a próxima" glow>
              <div className="flex flex-col items-center py-6 text-center select-none">
                <div className="w-16 h-16 rounded border border-brand-secondary bg-brand-secondary/10 flex items-center justify-center mb-5 text-brand-secondary">
                  <Clock size={28} />
                </div>

                <h3 className="text-lg font-display font-extrabold uppercase text-brand-strong tracking-widest">
                  Aguardando a próxima rodada
                </h3>

                <p className="text-xs text-brand-muted mt-3 leading-relaxed max-w-sm">
                  A organização já sorteou pelo menos um prêmio nesta campanha. Fica de olho — a próxima rodada pode
                  começar a qualquer momento. Se todos os prêmios já foram sorteados, o sorteio pode ser encerrado
                  por aqui mesmo.
                </p>
              </div>
            </Card>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <Card variant={missionsOpen ? 'secondary' : 'danger'} title="O sorteio ainda não começou" subtitle="Prepare-se, tá quase!">
              <div className="flex flex-col items-center py-6 text-center select-none">
                {missionsOpen ? (
                  <div className="w-16 h-16 rounded border border-brand-secondary bg-brand-secondary/10 flex items-center justify-center mb-5 text-brand-secondary">
                    <Gift size={28} />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded border border-brand-danger bg-brand-danger/10 flex items-center justify-center mb-5 animate-pulse text-brand-danger">
                    <Lock size={28} />
                  </div>
                )}

                <h3 className="text-lg font-display font-extrabold uppercase text-brand-strong tracking-widest">
                  {missionsOpen ? copy.missionsOpen : copy.missionsFrozen}
                </h3>

                <p className="text-[10px] font-mono text-brand-muted uppercase tracking-widest mt-1">
                  {missionsOpen ? 'Cadastro aberto no estande' : 'Inscrições encerradas pra esta campanha'}
                </p>

                {!countdown.isExpired ? (
                  <div className="mt-6 flex flex-col gap-2 items-center">
                    <span className="text-[10px] font-mono text-brand-danger tracking-widest uppercase flex items-center gap-1.5">
                      <Clock size={12} /> Falta pouco pro sorteio
                    </span>
                    <div className="font-display font-black text-3xl text-brand-strong tracking-widest">
                      {countdown.hudDisplay}
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 flex flex-col items-center gap-2">
                    <span className="text-[10px] font-mono text-brand-primary tracking-widest uppercase animate-pulse">
                      Já já a organização começa o sorteio...
                    </span>
                    <div className="text-xs font-ui font-bold text-brand-strong uppercase tracking-wider bg-brand-border rounded px-4 py-1.5 mt-1 border border-brand-border/80">
                      Fica ligado nesta tela
                    </div>
                  </div>
                )}

                <p className="text-xs text-brand-muted mt-5 leading-relaxed max-w-sm">
                  {missionsOpen
                    ? 'Complete os desafios no seu painel pra juntar mais cupons até o sorteio começar. Quanto mais cupons, mais chances.'
                    : 'Ninguém mais pode enviar comprovantes ou responder tarefas agora — mas seus tickets estão seguros e prontos pra concorrer. Mantenha essa página aberta.'}
                </p>
              </div>
            </Card>

            {vaultPrizes.length > 0 && (
              <Card title="O Que Está no Cofre" subtitle="Prêmios que podem ser seus">
                <div className="flex flex-col gap-3.5 select-none font-body text-brand-text">
                  {vaultPrizes.map((p) => (
                    <div key={p.id} className="flex justify-between items-center bg-brand-surface/50 border border-brand-border/40 rounded p-3">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded bg-brand-secondary/10 border border-brand-secondary/30 text-brand-secondary shrink-0">
                          <Gift size={14} />
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-xs text-brand-strong uppercase tracking-wider">{p.name}</h4>
                          <p className="text-[10px] text-brand-muted mt-0.5 normal-case font-body">
                            {p.description || 'Recompensa exclusiva da campanha'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[9px] font-mono text-brand-muted block uppercase">Disponível</span>
                        <span className="font-display font-bold text-xs text-brand-secondary">
                          {p.available ?? p.quantity - p.claimed} un.
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <div className="bg-brand-surface/30 border border-brand-border/40 rounded-lg p-4 flex gap-3 select-none">
              <PartyPopper size={16} className="text-brand-secondary shrink-0 mt-0.5" />
              <div className="font-mono text-[10px] text-brand-muted uppercase tracking-wider leading-relaxed">
                Sorteio transparente: cada ticket é uma chance real, e o resultado sai na hora, ao vivo — sem enrolação.
              </div>
            </div>
          </div>
        )}

        {/* ─── GANHADORES RECENTES DA CAMPANHA ─── */}
        {recentDraws.length > 0 && (
          <Card variant="secondary" title="Ganhadores Recentes" subtitle="Tudo que já saiu nesta campanha, até agora">
            <div className="flex flex-col divide-y divide-brand-border/40">
              {recentDraws.map((draw) => (
                <div key={draw.id} className="flex items-center gap-3 py-3 first:pt-1 last:pb-1">
                  <div className="p-1.5 rounded shrink-0 bg-brand-accent/10 border border-brand-accent/30 text-brand-accent">
                    <Trophy size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-ui font-bold text-brand-strong truncate">
                      {draw.winnerName ?? 'Ganhador'}
                    </p>
                    <p className="text-[10px] font-mono text-brand-muted uppercase tracking-wider mt-0.5 truncate">
                      {draw.prize?.name ?? 'Prêmio'}
                      {draw.winnerTickets != null ? ` · ganhou com ${draw.winnerTickets} ${draw.winnerTickets === 1 ? 'cupom' : 'cupons'}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DrawWatchPage;
