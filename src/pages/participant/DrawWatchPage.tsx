import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock, Tv, Users,
  ArrowLeft, PartyPopper, Gift, Clock,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useDrawStore } from '../../store/drawStore';
import { useSocket } from '../../hooks/useSocket';
import { useCountdown } from '../../hooks/useCountdown';
import { campaignService } from '../../services/campaign.service';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PrizeWheel } from '../../components/draw/PrizeWheel';
import type { Campaign } from '../../types';

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

    const colors = ['#7c3aed', '#06b6d4', '#f59e0b', '#10b981', '#ef4444'];
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

  const { winner, isSpinning, participants, totalTickets, othersTickets, othersCount, onlineCount, sessionEndedReason } = useDrawStore();

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
      } catch (err) {
        console.error('Failed to load active campaign on DrawWatchPage:', err);
      }
    };
    fetchActiveCampaign();
  }, []);

  const countdown = useCountdown(activeCampaign?.drawDate);

  const isWinnerState = winner !== null && wheelSettled;
  const isSpinningState = isSpinning || (winner !== null && !wheelSettled);
  const vaultPrizes = (activeCampaign?.vault?.prizes ?? []).filter(
    (p) => (p.available ?? p.quantity - p.claimed) > 0,
  );

  return (
    <div className="flex flex-col gap-6 font-inter text-cyber-text">
      {isWinnerState && <ConfettiCanvas />}

      {/* ─── Cabeçalho ao vivo ─── */}
      <div className="flex items-center justify-between bg-cyber-surface/60 border border-cyber-border rounded-lg p-4 select-none relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none opacity-5 bg-cyber-grid" />

        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded border border-cyber-primary bg-cyber-primary/10 flex items-center justify-center animate-pulse">
            <Tv size={16} className="text-cyber-primary" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-cyber-primary rounded-full animate-ping" />
          </div>
          <div>
            <h2 className="text-base font-orbitron font-extrabold uppercase text-white tracking-widest leading-none">
              Sorteio Ao Vivo
            </h2>
            <div className="text-[9px] font-mono text-cyber-secondary tracking-widest mt-1">
              Fique de olho, pode começar a qualquer momento
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-right">
          <div className="hidden sm:flex items-center gap-2">
            <Users size={14} className="text-cyber-secondary" />
            <div className="flex flex-col">
              <span className="text-[9px] font-mono text-cyber-muted uppercase">Assistindo</span>
              <span className="font-orbitron font-bold text-xs text-white">{onlineCount || 1}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full flex flex-col gap-6">
        {activeCampaign?.coverImageUrl && (
          <div className="aspect-video relative rounded-lg border border-cyber-border overflow-hidden bg-black/55 select-none">
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
          <Card variant="primary" title="Temos um vencedor! 🎉" subtitle="Parabéns pra quem levou" glow>
            <div className="flex flex-col items-center py-6 text-center select-none">
              <div className="relative w-28 h-28 mx-auto mb-6 flex items-center justify-center rounded-full bg-cyber-primary/15 border-2 border-cyber-primary glow-primary animate-float">
                <PartyPopper size={48} className="text-cyber-primary animate-pulse" />
              </div>

              <span className="text-[11px] font-mono text-cyber-secondary tracking-widest uppercase font-bold">
                O sorteado foi
              </span>

              <h3 className="text-3xl font-orbitron font-black text-white uppercase mt-2 tracking-wide text-glow-primary">
                {winner.winnerName}
              </h3>

              <div className="w-full max-w-sm border-t border-b border-cyber-border/40 py-3.5 my-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] font-mono text-cyber-muted uppercase block">Prêmio</span>
                    <span className="font-rajdhani font-bold text-sm text-white mt-0.5 block">
                      {winner.prize?.name || 'Grande Prêmio'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-cyber-muted uppercase block">Tickets acumulados</span>
                    <span className="font-rajdhani font-bold text-sm text-cyber-accent mt-0.5 block">
                      {winner.totalTickets}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-cyber-muted max-w-md leading-relaxed px-4">
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
                <span className="text-xs font-rajdhani font-bold text-white uppercase tracking-wider">
                  Cada fatia é uma chance real — quanto mais tickets, maior o pedaço
                </span>
                <span className="text-[10px] font-mono text-cyber-muted uppercase tracking-widest">
                  {participants.length + (othersCount > 0 ? othersCount : 0)} participante(s) concorrendo · {totalTickets + othersTickets} tickets no total
                </span>
              </div>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col gap-6">
            <Card variant="danger" title="O sorteio ainda não começou" subtitle="Prepare-se, tá quase!">
              <div className="flex flex-col items-center py-6 text-center select-none">
                <div className="w-16 h-16 rounded border border-cyber-danger bg-cyber-danger/10 flex items-center justify-center mb-5 animate-pulse text-cyber-danger">
                  <Lock size={28} />
                </div>

                <h3 className="text-lg font-orbitron font-extrabold uppercase text-white tracking-widest">
                  Missões congeladas por enquanto
                </h3>

                <p className="text-[10px] font-mono text-cyber-muted uppercase tracking-widest mt-1">
                  Inscrições encerradas pra esta campanha
                </p>

                {!countdown.isExpired ? (
                  <div className="mt-6 flex flex-col gap-2 items-center">
                    <span className="text-[10px] font-mono text-cyber-danger tracking-widest uppercase flex items-center gap-1.5">
                      <Clock size={12} /> Falta pouco pro sorteio
                    </span>
                    <div className="font-orbitron font-black text-3xl text-white tracking-widest">
                      {countdown.hudDisplay}
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 flex flex-col items-center gap-2">
                    <span className="text-[10px] font-mono text-cyber-primary tracking-widest uppercase animate-pulse">
                      Já já a organização começa o sorteio...
                    </span>
                    <div className="text-xs font-rajdhani font-bold text-white uppercase tracking-wider bg-cyber-border rounded px-4 py-1.5 mt-1 border border-cyber-border/80">
                      Fica ligado nesta tela
                    </div>
                  </div>
                )}

                <p className="text-xs text-cyber-muted mt-5 leading-relaxed max-w-sm">
                  Ninguém mais pode enviar comprovantes ou responder tarefas agora — mas seus tickets estão seguros e prontos pra concorrer. Mantenha essa página aberta.
                </p>
              </div>
            </Card>

            {vaultPrizes.length > 0 && (
              <Card title="O Que Está no Cofre" subtitle="Prêmios que podem ser seus">
                <div className="flex flex-col gap-3.5 select-none font-inter text-cyber-text">
                  {vaultPrizes.map((p) => (
                    <div key={p.id} className="flex justify-between items-center bg-cyber-surface/50 border border-cyber-border/40 rounded p-3">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded bg-cyber-secondary/10 border border-cyber-secondary/30 text-cyber-secondary shrink-0">
                          <Gift size={14} />
                        </div>
                        <div>
                          <h4 className="font-orbitron font-bold text-xs text-white uppercase tracking-wider">{p.name}</h4>
                          <p className="text-[10px] text-cyber-muted mt-0.5 normal-case font-inter">
                            {p.description || 'Recompensa exclusiva da campanha'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[9px] font-mono text-cyber-muted block uppercase">Disponível</span>
                        <span className="font-orbitron font-bold text-xs text-cyber-secondary">
                          {p.available ?? p.quantity - p.claimed} un.
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <div className="bg-cyber-surface/30 border border-cyber-border/40 rounded-lg p-4 flex gap-3 select-none">
              <PartyPopper size={16} className="text-cyber-secondary shrink-0 mt-0.5" />
              <div className="font-mono text-[10px] text-cyber-muted uppercase tracking-wider leading-relaxed">
                Sorteio transparente: cada ticket é uma chance real, e o resultado sai na hora, ao vivo — sem enrolação.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DrawWatchPage;
