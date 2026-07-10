import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, ArrowRight, Award, Gift, Copy, Share2, Check, Users, Ticket as TicketIcon } from 'lucide-react';
import { useCountdown } from '../../hooks/useCountdown';
import { useSocket } from '../../hooks/useSocket';
import { useAuthStore } from '../../store/authStore';
import { campaignService } from '../../services/campaign.service';
import { questService } from '../../services/quest.service';
import { prizeService } from '../../services/prize.service';
import { ticketService } from '../../services/ticket.service';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import type { Campaign, Mission, Prize, TicketHistoryEntry, User } from '../../types';
import nika from '../../assets/nika.gif';

// Mostra o código de indicação do participante, com botões de copiar e
// compartilhar — aparece sempre, mesmo sem campanha ativa, já que o código é
// permanente da conta (gerado uma vez no cadastro).
const ReferralCodeCard: React.FC<{ code: string }> = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const shareText = `Usa meu código de amigo "${code}" na Rethink3D e a gente ganha cupom os dois! 🎉`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Failed to copy referral code', e);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
      } catch (e) {
        // Usuário cancelou o share — não é um erro de verdade.
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Card variant="secondary" title="Seu Código de Amigo" subtitle="Compartilhe e ganhem cupons juntos" glow>
      <div className="flex flex-col sm:flex-row items-center gap-4 py-2">
        <div className="flex items-center gap-2 bg-cyber-bg border border-cyber-secondary/40 rounded-lg px-5 py-3 select-all">
          <Users size={18} className="text-cyber-secondary shrink-0" />
          <span className="font-orbitron font-black text-2xl text-white tracking-[0.3em]">
            {code}
          </span>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="secondary" size="md" icon={copied ? <Check size={14} /> : <Copy size={14} />} onClick={handleCopy} className="flex-1 sm:flex-none">
            {copied ? 'Copiado!' : 'Copiar'}
          </Button>
          <Button variant="primary" size="md" icon={<Share2 size={14} />} onClick={handleShare} className="flex-1 sm:flex-none">
            Compartilhar
          </Button>
        </div>
      </div>
      <p className="text-[11px] text-cyber-muted leading-relaxed mt-1">
        Passe esse código pra um amigo cumprir a missão "Indique um Amigo" — assim que ele usar, vocês dois ganham cupons na hora.
      </p>
    </Card>
  );
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const referralCode = (user as User | null)?.referralCode;
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [quests, setQuests] = useState<Mission[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [ticketHistory, setTicketHistory] = useState<TicketHistoryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Socket connection and register events
  useSocket(activeCampaign?.id);

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch active campaign (retorna null quando não há campanha ativa, não 404)
        const campaign = await campaignService.getActiveCampaign();
        if (!isMounted) return;
        setActiveCampaign(campaign);

        if (campaign) {
          // 2. Fetch quests for active campaign to calculate stats
          const campaignQuests = await questService.getCampaignQuests(campaign.id);
          if (!isMounted) return;
          setQuests(campaignQuests);

          // 3. Fetch prizes so the participant can see what's up for grabs
          try {
            const campaignPrizes = await prizeService.getCampaignPrizes(campaign.id);
            if (!isMounted) return;
            setPrizes(campaignPrizes.filter((p) => (p.available ?? p.quantity - p.claimed) > 0));
          } catch (e) {
            console.warn('Failed to load campaign prizes', e);
          }

          // 4. Fetch ticket history (missões cumpridas + indicações) pro painel
          try {
            const history = await ticketService.getMyTicketHistory(campaign.id);
            if (!isMounted) return;
            setTicketHistory(history);
          } catch (e) {
            console.warn('Failed to load ticket history', e);
          }
        }
      } catch (err: any) {
        console.error('Error loading dashboard data:', err);
        setError('Não conseguimos carregar seus dados agora. Verifique sua conexão e tente de novo.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Countdown hook using drawDate
  const countdown = useCountdown(activeCampaign?.drawDate);

  // Calculate Quest Stats
  const totalQuests = quests.length;
  const completedQuests = quests.filter(q => q.isCompleted).length;
  const progressPercent = totalQuests > 0 ? Math.round((completedQuests / totalQuests) * 100) : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] select-none pointer-events-none">
        <div
          style={{ width: 120, height: 120 }}
          dangerouslySetInnerHTML={{
            __html: `<lottie-player
              src="/Pokeball Loading.json"
              background="transparent"
              speed="1.2"
              style="width: 100%; height: 100%;"
              loop
              autoplay
            ></lottie-player>`
          }}
        />
        <div className="text-cyber-secondary animate-pulse text-xs font-bold tracking-widest mt-2 uppercase">
          Carregando sua aventura...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-10 select-none">
        <Card variant="danger" title="Ops, algo deu errado" glow>
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-sm font-rajdhani font-bold text-white tracking-wider">
              {error}
            </p>
            <Button variant="danger" size="md" onClick={() => window.location.reload()}>
              Tentar Novamente
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!activeCampaign) {
    return (
      <div className="max-w-xl mx-auto my-10 flex flex-col gap-6">
        <Card variant="default" title="Nenhum sorteio rolando agora" glow className="select-none">
          <div className="flex flex-col items-center gap-4 text-center py-4">
            <img src={nika} alt="Aguardando" className="w-24 h-auto" draggable={false} />
            <p className="text-sm font-inter text-cyber-muted max-w-sm">
              Ainda não temos uma campanha ativa. Fique de olho — assim que uma nova aventura começar, ela aparece bem aqui.
            </p>
          </div>
        </Card>
        {referralCode && <ReferralCodeCard code={referralCode} />}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 font-inter text-cyber-text">
      {/* ─── HEADER ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-cyber-surface/90 border border-cyber-border/80 rounded-lg p-5 relative overflow-hidden select-none">
        <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none opacity-5 bg-cyber-grid" />

        <div className="flex flex-col min-w-0">
          <h2 className="text-2xl font-orbitron font-extrabold text-white uppercase tracking-wider text-glow-primary break-words">
            {activeCampaign.name}
          </h2>
          <p className="text-xs text-cyber-muted mt-1 leading-relaxed max-w-2xl break-words">
            {activeCampaign.description || 'Cumpra missões, junte cupons e concorra a prêmios incríveis!'}
          </p>
        </div>

        {activeCampaign.status === 'DRAWING' && (
          <Button
            variant="accent"
            size="sm"
            onClick={() => navigate(`/watch/${activeCampaign.id}`)}
            className="glow-accent shrink-0"
          >
            Assistir Sorteio ao Vivo
          </Button>
        )}
      </div>

      {/* ─── SEU CÓDIGO DE AMIGO ─── */}
      {referralCode && <ReferralCodeCard code={referralCode} />}

      {/* ─── MAIN GRID ─── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Left Side: Countdown */}
        <div className="md:col-span-5 flex flex-col gap-6">

          {/* COUNTDOWN TIMER */}
          <Card
            variant="primary"
            title="Contagem para o Sorteio"
            glow
            className="flex-1"
          >
            <div className="py-4 select-none">
              {countdown.isExpired ? (
                <div className="flex flex-col items-center justify-center text-center gap-3">
                  <div className="font-orbitron font-black text-xl text-white uppercase tracking-wider">
                    O sorteio já começou!
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => navigate(`/watch/${activeCampaign.id}`)}
                    className="w-full mt-2 glow-primary animate-pulse"
                    icon={<Award size={16} />}
                  >
                    Entrar na Transmissão ao Vivo
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-cyber-surface border border-cyber-primary/30 rounded p-2.5">
                      <div className="font-orbitron font-black text-2xl text-white tracking-tighter">
                        {countdown.formatted.days}
                      </div>
                      <div className="text-[8px] font-mono text-cyber-muted uppercase tracking-widest mt-0.5">DIAS</div>
                    </div>
                    <div className="bg-cyber-surface border border-cyber-primary/30 rounded p-2.5">
                      <div className="font-orbitron font-black text-2xl text-white tracking-tighter">
                        {countdown.formatted.hours}
                      </div>
                      <div className="text-[8px] font-mono text-cyber-muted uppercase tracking-widest mt-0.5">HORAS</div>
                    </div>
                    <div className="bg-cyber-surface border border-cyber-primary/30 rounded p-2.5">
                      <div className="font-orbitron font-black text-2xl text-white tracking-tighter">
                        {countdown.formatted.minutes}
                      </div>
                      <div className="text-[8px] font-mono text-cyber-muted uppercase tracking-widest mt-0.5">MINS</div>
                    </div>
                    <div className="bg-cyber-surface border border-cyber-primary/30 rounded p-2.5">
                      <div className="font-orbitron font-black text-2xl text-cyber-primary text-glow-primary tracking-tighter">
                        {countdown.formatted.seconds}
                      </div>
                      <div className="text-[8px] font-mono text-cyber-muted uppercase tracking-widest mt-0.5">SEGS</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 bg-cyber-primary/5 border border-cyber-primary/30 rounded p-3 mt-1.5 text-xs text-cyber-primary">
                    <Calendar size={15} className="shrink-0" />
                    <span className="font-rajdhani font-bold tracking-wider">
                      Sorteio em: {activeCampaign.drawDate ? new Date(activeCampaign.drawDate).toLocaleString('pt-BR') : 'a definir'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Side: Quest Progress */}
        <div className="md:col-span-7 flex flex-col gap-6">

          {/* MISSION PROGRESS BAR */}
          <Card
            variant="secondary"
            title="Suas Missões"
            subtitle="Complete as missões restantes para ganhar mais cupons!"
          >
            <div className="flex flex-col gap-4 py-2 select-none">

              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono tracking-widest text-cyber-secondary uppercase">
                    Concluídas
                  </span>
                  <span className="font-orbitron font-extrabold text-2xl text-white mt-1">
                    {completedQuests} <span className="text-cyber-muted text-lg">/ {totalQuests}</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono tracking-widest text-cyber-secondary uppercase">
                    Progresso
                  </span>
                  <span className="font-orbitron font-extrabold text-2xl text-cyber-secondary text-glow-secondary block mt-1">
                    {progressPercent}%
                  </span>
                </div>
              </div>

              <div className="relative w-full h-3 bg-cyber-border rounded overflow-hidden p-0.5 border border-cyber-border/80">
                <div
                  className="h-full bg-gradient-to-r from-cyber-primary to-cyber-secondary rounded transition-all duration-500 ease-out glow-secondary"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="mt-1 pt-3 border-t border-cyber-border/40">
                <Link to="/quests" className="block w-full">
                  <Button variant="secondary" size="sm" icon={<ArrowRight size={13} />} fullWidth>
                    Ver Missões
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ─── PRÊMIOS EM JOGO ─── */}
      {prizes.length > 0 && (
        <Card
          variant="accent"
          title="Prêmios em Jogo"
          subtitle="Quem for sorteado leva um destes pra casa"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-2">
            {prizes.map((prize) => (
              <div
                key={prize.id}
                className="flex gap-3 bg-cyber-surface/70 border border-cyber-border/80 rounded-lg p-3 items-center"
              >
                <div className="w-16 h-16 shrink-0 rounded-md overflow-hidden border border-cyber-border/60 bg-black/40 flex items-center justify-center">
                  {prize.imageUrl ? (
                    <img
                      src={prize.imageUrl}
                      alt={prize.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Gift size={24} className="text-cyber-accent" />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-orbitron font-bold text-white uppercase tracking-wide break-words">
                    {prize.name}
                  </span>
                  {prize.description && (
                    <span className="text-[11px] text-cyber-muted leading-snug mt-0.5 break-words line-clamp-2">
                      {prize.description}
                    </span>
                  )}
                  {(prize.available ?? prize.quantity - prize.claimed) > 1 && (
                    <span className="text-[10px] font-mono text-cyber-accent uppercase tracking-wider mt-1">
                      {prize.available ?? prize.quantity - prize.claimed} unidades
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ─── HISTÓRICO DE CUPONS ─── */}
      {ticketHistory.length > 0 && (
        <Card title="Histórico de Cupons" subtitle="De onde vieram seus cupons nesta campanha">
          <div className="flex flex-col divide-y divide-cyber-border/40">
            {ticketHistory.map((entry) => {
              const isReferral = entry.missionType === 'REFERRAL';
              const label = isReferral
                ? entry.isReferralBonus
                  ? `${entry.relatedUserName ?? 'Um amigo'} usou seu código`
                  : `Você usou o código de ${entry.relatedUserName ?? 'um amigo'}`
                : entry.missionTitle ?? 'Cupom recebido';

              return (
                <div key={entry.id} className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-1">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-1.5 rounded shrink-0 ${isReferral ? 'bg-cyber-success/10 border border-cyber-success/30 text-cyber-success' : 'bg-cyber-secondary/10 border border-cyber-secondary/30 text-cyber-secondary'}`}>
                      {isReferral ? <Users size={14} /> : <TicketIcon size={14} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-rajdhani font-bold text-white truncate">{label}</p>
                      <p className="text-[10px] font-mono text-cyber-muted uppercase tracking-wider mt-0.5">
                        {new Date(entry.createdAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-orbitron font-extrabold text-cyber-success shrink-0">
                    +{entry.quantity}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

export default DashboardPage;
