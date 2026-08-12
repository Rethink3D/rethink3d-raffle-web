import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, ArrowRight, Award, Gift, Copy, Share2, Check, Users, Ticket as TicketIcon, Sparkles, Trophy, ListChecks, Dices, ShieldCheck, Radio, PhoneCall } from 'lucide-react';
import { useCountdown } from '../../hooks/useCountdown';
import { useSocket } from '../../hooks/useSocket';
import { useAuthStore } from '../../store/authStore';
import { useDrawStore } from '../../store/drawStore';
import { campaignService } from '../../services/campaign.service';
import { questService } from '../../services/quest.service';
import { prizeService } from '../../services/prize.service';
import { ticketService } from '../../services/ticket.service';
import { drawService } from '../../services/draw.service';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { getCampaignStatusLabel } from '../../utils/campaignStatus';
import { getNextDrawTarget, getUpcomingSchedules } from '../../utils/drawSchedule';
import type { Campaign, Draw, Mission, Prize, TicketHistoryEntry, User } from '../../types';
import { ThemeAsset } from '../../theme/assets';
import { copy } from '../../theme/copy';

// Cores do badge de status — mesma paleta usada nos outros indicadores da
// campanha, pra reforçar visualmente ACTIVE (verde) vs DRAWING (roxo/aviso).
const STATUS_BADGE_CLASSES: Record<Campaign['status'], string> = {
  DRAFT: 'text-brand-muted border-brand-muted/40 bg-brand-muted/5',
  ACTIVE: 'text-brand-success border-brand-success/50 bg-brand-success/10',
  DRAWING: 'text-brand-primary border-brand-primary/50 bg-brand-primary/10 animate-pulse',
  PAUSED: 'text-brand-accent border-brand-accent/50 bg-brand-accent/10',
  FINISHED: 'text-brand-muted border-brand-muted/40 bg-brand-muted/5',
};

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
        <div className="flex items-center gap-2 bg-brand-bg border border-brand-secondary/40 rounded-lg px-5 py-3 select-all">
          <Users size={18} className="text-brand-secondary shrink-0" />
          <span className="font-display font-black text-2xl text-brand-strong tracking-[0.3em]">
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
      <p className="text-[11px] text-brand-muted leading-relaxed mt-1">
        {copy.referralHintProse}
      </p>
      <p className="text-[11px] text-brand-accent/90 leading-relaxed mt-1.5 flex items-center gap-1.5">
        <Users size={12} className="shrink-0" />
        Compartilhe com quantos amigos quiser — cada indicação gera cupons pra vocês dois!
      </p>
      <p className="text-[11px] text-brand-muted leading-relaxed mt-1.5">
        {copy.receivedCodeProse}{' '}
        <Link to="/quests" className="text-brand-secondary hover:underline font-bold">
          "Indique um Amigo"
        </Link>{' '}
        e digite o código dele pra ganhar cupons também.
      </p>
    </Card>
  );
};

// Popup de boas-vindas exibido uma única vez, assim que o participante recém-
// cadastrado chega no dashboard — lê o próprio estado do store (em vez de
// receber props) pra poder ser inserido em qualquer um dos `return`s abaixo
// (loading/erro/sem campanha/painel completo) sem precisar prop-drilling.
const SignupBonusModal: React.FC = () => {
  const signupBonusPopup = useAuthStore((state) => state.signupBonusPopup);
  const setSignupBonusPopup = useAuthStore((state) => state.setSignupBonusPopup);
  const navigate = useNavigate();

  if (!signupBonusPopup) return null;

  return (
    <Modal isOpen title="Bônus de Boas-vindas" onClose={() => setSignupBonusPopup(null)} size="sm">
      <div className="flex flex-col items-center text-center gap-4 py-2">
        <div className="p-3 rounded-full bg-brand-success/10 border border-brand-success/40 text-brand-success">
          <Gift size={32} />
        </div>
        <div>
          <p className="font-display font-black text-3xl text-brand-success text-glow-secondary">
            +{signupBonusPopup} cupons
          </p>
          <p className="text-sm font-ui font-bold text-brand-strong mt-1 uppercase tracking-wide">
            Só por se cadastrar!
          </p>
        </div>
        <p className="text-xs text-brand-muted leading-relaxed max-w-xs">
          {copy.completeMoreProse}
        </p>
        <Button
          variant="primary"
          size="md"
          fullWidth
          icon={<ArrowRight size={16} />}
          onClick={() => {
            setSignupBonusPopup(null);
            navigate('/quests');
          }}
        >
          {copy.seeMissions}
        </Button>
      </div>
    </Modal>
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
  const [drawHistory, setDrawHistory] = useState<Draw[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Socket connection and register events
  useSocket(activeCampaign?.id);
  const revokeVersion = useDrawStore((s) => s.revokeVersion);

  // Um sorteio revogado pelo admin (vencedor não respondeu) devolve o prêmio
  // ao estoque e some da lista de "já sorteados" — recarrega os dois sem
  // precisar dar reload na página inteira.
  useEffect(() => {
    if (revokeVersion === 0 || !activeCampaign) return;
    prizeService
      .getCampaignPrizes(activeCampaign.id)
      .then((campaignPrizes) => {
        setPrizes(campaignPrizes.filter((p) => (p.available ?? p.quantity - p.claimed) > 0));
      })
      .catch((e) => console.warn('Failed to reload campaign prizes after revoke', e));
    drawService
      .getCompletedHistory(activeCampaign.id)
      .then(setDrawHistory)
      .catch((e) => console.warn('Failed to reload draw history after revoke', e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revokeVersion]);

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

          // 5. Fetch itens já sorteados nesta campanha
          try {
            const completedDraws = await drawService.getCompletedHistory(campaign.id);
            if (!isMounted) return;
            setDrawHistory(completedDraws);
          } catch (e) {
            console.warn('Failed to load draw history', e);
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

  // Conta pro próximo horário de sorteio agendado livremente pelo admin (cai
  // pro campo único `drawDate` só em campanhas antigas sem nenhum agendamento).
  const countdown = useCountdown(getNextDrawTarget(activeCampaign));
  const upcomingSchedules = getUpcomingSchedules(activeCampaign);

  // Calculate Quest Stats
  const totalQuests = quests.length;
  const completedQuests = quests.filter(q => q.isCompleted).length;
  const progressPercent = totalQuests > 0 ? Math.round((completedQuests / totalQuests) * 100) : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] select-none pointer-events-none">
        <ThemeAsset kind="loader" size={120} />
        <div className="text-brand-secondary animate-pulse text-xs font-bold tracking-widest mt-2 uppercase">
          {copy.dashboardLoading}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-10 select-none">
        <SignupBonusModal />
        <Card variant="danger" title="Ops, algo deu errado" glow>
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-sm font-ui font-bold text-brand-strong tracking-wider">
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
        <SignupBonusModal />
        <Card variant="default" title="Nenhum sorteio rolando agora" glow className="select-none">
          <div className="flex flex-col items-center gap-4 text-center py-4">
            <ThemeAsset kind="waiting" size={96} className="w-24" />
            <p className="text-sm font-body text-brand-muted max-w-sm">
              {copy.noCampaignProse}
            </p>
          </div>
        </Card>
        {referralCode && <ReferralCodeCard code={referralCode} />}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 font-body text-brand-text">
      <SignupBonusModal />
      {/* ─── HEADER ─── */}
      <div className="relative rounded-lg border border-brand-border/80 overflow-hidden select-none bg-brand-surface/90">
        {/* Capa da campanha ao fundo (se houver), esmaecida atrás de um gradiente
            pra manter o texto legível — antes essa área não usava a capa nem tinha
            nenhum destaque visual além do texto puro. */}
        {activeCampaign.coverImageUrl && (
          <div className="absolute inset-0">
            <img
              src={activeCampaign.coverImageUrl}
              alt=""
              className="w-full h-full object-cover opacity-20"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-surface via-brand-surface/90 to-brand-surface/50" />
          </div>
        )}
        <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none opacity-5 bg-cyber-grid" />
        <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-brand-primary to-brand-secondary" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5 p-6">
          <div className="flex flex-col min-w-0 gap-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono tracking-[0.2em] text-brand-secondary uppercase">
                <Sparkles size={12} />
                Campanha
              </span>
              <span className={`inline-flex items-center gap-1 text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded border ${STATUS_BADGE_CLASSES[activeCampaign.status]}`}>
                {getCampaignStatusLabel(activeCampaign.status)}
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-display font-black text-brand-strong uppercase tracking-wide text-glow-primary break-words leading-tight">
              {activeCampaign.name}
            </h2>

            <p className="text-sm text-brand-text/80 font-body leading-relaxed max-w-2xl break-words border-l-2 border-brand-primary/40 pl-3">
              {activeCampaign.description || copy.campaignFallbackProse}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              icon={<ListChecks size={14} />}
              onClick={() => navigate('/quests')}
            >
              {copy.missions}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Trophy size={14} />}
              onClick={() => navigate('/ranking')}
            >
              Ver Ranking
            </Button>
            {activeCampaign.status === 'DRAWING' && (
              <Button
                variant="accent"
                size="sm"
                onClick={() => navigate(`/watch/${activeCampaign.id}`)}
                className="glow-accent"
              >
                Assistir Sorteio ao Vivo
              </Button>
            )}
          </div>
        </div>
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
              {activeCampaign.status === 'DRAWING' ? (
                <div className="flex flex-col items-center justify-center text-center gap-3">
                  <div className="font-display font-black text-xl text-brand-primary uppercase tracking-wider animate-pulse">
                    🔴 Sorteio ao vivo agora!
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
              ) : activeCampaign.status === 'PAUSED' ? (
                <div className="flex flex-col items-center justify-center text-center gap-3">
                  <div className="font-display font-black text-lg text-brand-strong uppercase tracking-wider">
                    Sorteio em intervalo
                  </div>
                  <p className="text-xs text-brand-muted max-w-xs">
                    Já rolou uma rodada — fica de olho, a próxima pode começar a qualquer momento. Se todos os
                    prêmios já foram sorteados, o sorteio pode ser encerrado por aqui mesmo.
                  </p>
                </div>
              ) : countdown.isExpired ? (
                <div className="flex flex-col items-center justify-center text-center gap-3">
                  <div className="font-display font-black text-xl text-brand-strong uppercase tracking-wider">
                    Já é hora do sorteio!
                  </div>
                  <p className="text-xs text-brand-muted max-w-xs">
                    A organização já pode começar a qualquer momento — fica de olho.
                  </p>
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
                    <div className="bg-brand-surface border border-brand-primary/30 rounded p-2.5">
                      <div className="font-display font-black text-2xl text-brand-strong tracking-tighter">
                        {countdown.formatted.days}
                      </div>
                      <div className="text-[8px] font-mono text-brand-muted uppercase tracking-widest mt-0.5">DIAS</div>
                    </div>
                    <div className="bg-brand-surface border border-brand-primary/30 rounded p-2.5">
                      <div className="font-display font-black text-2xl text-brand-strong tracking-tighter">
                        {countdown.formatted.hours}
                      </div>
                      <div className="text-[8px] font-mono text-brand-muted uppercase tracking-widest mt-0.5">HORAS</div>
                    </div>
                    <div className="bg-brand-surface border border-brand-primary/30 rounded p-2.5">
                      <div className="font-display font-black text-2xl text-brand-strong tracking-tighter">
                        {countdown.formatted.minutes}
                      </div>
                      <div className="text-[8px] font-mono text-brand-muted uppercase tracking-widest mt-0.5">MINS</div>
                    </div>
                    <div className="bg-brand-surface border border-brand-primary/30 rounded p-2.5">
                      <div className="font-display font-black text-2xl text-brand-primary text-glow-primary tracking-tighter">
                        {countdown.formatted.seconds}
                      </div>
                      <div className="text-[8px] font-mono text-brand-muted uppercase tracking-widest mt-0.5">SEGS</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 bg-brand-primary/5 border border-brand-primary/30 rounded p-3 mt-1.5 text-xs text-brand-primary">
                    <Calendar size={15} className="shrink-0" />
                    <span className="font-ui font-bold tracking-wider">
                      Sorteio em: {upcomingSchedules[0]
                        ? new Date(upcomingSchedules[0].scheduledAt).toLocaleString('pt-BR')
                        : activeCampaign.drawDate
                        ? new Date(activeCampaign.drawDate).toLocaleString('pt-BR')
                        : 'a definir'}
                    </span>
                  </div>

                  {upcomingSchedules.length > 1 && (
                    <p className="text-[10px] font-mono text-brand-muted uppercase tracking-wider text-center">
                      + {upcomingSchedules.length - 1} outro{upcomingSchedules.length - 1 === 1 ? '' : 's'} sorteio{upcomingSchedules.length - 1 === 1 ? '' : 's'} agendado{upcomingSchedules.length - 1 === 1 ? '' : 's'} depois desse
                    </p>
                  )}
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
            title={copy.yourMissions}
            subtitle={copy.remainingMissionsSubtitle}
          >
            <div className="flex flex-col gap-4 py-2 select-none">

              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono tracking-widest text-brand-secondary uppercase">
                    Concluídas
                  </span>
                  <span className="font-display font-extrabold text-2xl text-brand-strong mt-1">
                    {completedQuests} <span className="text-brand-muted text-lg">/ {totalQuests}</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono tracking-widest text-brand-secondary uppercase">
                    Progresso
                  </span>
                  <span className="font-display font-extrabold text-2xl text-brand-secondary text-glow-secondary block mt-1">
                    {progressPercent}%
                  </span>
                </div>
              </div>

              <div className="relative w-full h-3 bg-brand-border rounded overflow-hidden p-0.5 border border-brand-border/80">
                <div
                  className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary rounded transition-all duration-500 ease-out glow-secondary"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="mt-1 pt-3 border-t border-brand-border/40">
                <Link to="/quests" className="block w-full">
                  <Button variant="secondary" size="sm" icon={<ArrowRight size={13} />} fullWidth>
                    {copy.seeMissions}
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
          title={copy.prizesTitle}
          subtitle="Quem for sorteado leva um destes pra casa"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-2">
            {prizes.map((prize) => (
              <div
                key={prize.id}
                className="flex gap-3 bg-brand-surface/70 border border-brand-border/80 rounded-lg p-3 items-center"
              >
                <div className="w-16 h-16 shrink-0 rounded-md overflow-hidden border border-brand-border/60 bg-sunken-40 flex items-center justify-center">
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
                    <Gift size={24} className="text-brand-accent" />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-display font-bold text-brand-strong uppercase tracking-wide break-words">
                    {prize.name}
                  </span>
                  {prize.description && (
                    <span className="text-[11px] text-brand-muted leading-snug mt-0.5 break-words line-clamp-2">
                      {prize.description}
                    </span>
                  )}
                  {(prize.available ?? prize.quantity - prize.claimed) > 1 && (
                    <span className="text-[10px] font-mono text-brand-accent uppercase tracking-wider mt-1">
                      {prize.available ?? prize.quantity - prize.claimed} unidades
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ─── ITENS JÁ SORTEADOS ─── */}
      {drawHistory.length > 0 && (
        <Card title="Itens Já Sorteados" subtitle="O que já saiu nesta campanha">
          <div className="flex flex-col divide-y divide-brand-border/40">
            {drawHistory.map((draw) => {
              const isMe = !!user && draw.winnerId === (user as User).id;
              return (
                <div key={draw.id} className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-1">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 shrink-0 rounded-md overflow-hidden border border-brand-border/60 bg-sunken-40 flex items-center justify-center">
                      {draw.prize?.imageUrl ? (
                        <img
                          src={draw.prize.imageUrl}
                          alt={draw.prize.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Gift size={18} className="text-brand-accent" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-ui font-bold text-brand-strong truncate">
                        {draw.prize?.name ?? 'Prêmio'}
                      </p>
                      <p className="text-[10px] font-mono text-brand-muted uppercase tracking-wider mt-0.5">
                        {draw.drawnAt ? new Date(draw.drawnAt).toLocaleString('pt-BR') : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className={`text-xs font-display font-extrabold ${isMe ? 'text-brand-success' : 'text-brand-muted'}`}>
                      {isMe ? 'Você ganhou! 🎉' : draw.winnerName ?? 'Sorteado'}
                    </span>
                    {draw.winnerTickets != null && (
                      <span className="text-[10px] font-mono text-brand-accent uppercase tracking-wider mt-0.5">
                        ganhou com {draw.winnerTickets} cupom{draw.winnerTickets === 1 ? '' : 's'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ─── HISTÓRICO DE CUPONS ─── */}
      {ticketHistory.length > 0 && (
        <Card title="Histórico de Cupons" subtitle="De onde vieram seus cupons nesta campanha">
          <div className="flex flex-col divide-y divide-brand-border/40">
            {ticketHistory.map((entry) => {
              const isReferral = entry.missionType === 'REFERRAL';
              const isSignup = entry.isSignupBonus;
              const label = entry.note
                ? entry.note
                : isSignup
                ? 'Bônus de boas-vindas (cadastro)'
                : isReferral
                ? entry.isReferralBonus
                  ? `${entry.relatedUserName ?? 'Um amigo'} usou seu código`
                  : `Você usou o código de ${entry.relatedUserName ?? 'um amigo'}`
                : entry.missionTitle ?? 'Cupom recebido';

              return (
                <div key={entry.id} className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-1">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-1.5 rounded shrink-0 ${isSignup ? 'bg-brand-accent/10 border border-brand-accent/30 text-brand-accent' : isReferral ? 'bg-brand-success/10 border border-brand-success/30 text-brand-success' : 'bg-brand-secondary/10 border border-brand-secondary/30 text-brand-secondary'}`}>
                      {isSignup ? <Gift size={14} /> : isReferral ? <Users size={14} /> : <TicketIcon size={14} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-ui font-bold text-brand-strong truncate">{label}</p>
                      <p className="text-[10px] font-mono text-brand-muted uppercase tracking-wider mt-0.5">
                        {new Date(entry.createdAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-display font-extrabold text-brand-success shrink-0">
                    +{entry.quantity}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ─── REGRAS DO SORTEIO ─── */}
      <Card title="Como Funciona o Sorteio" subtitle="Regras gerais — leia antes de torcer 😉">
        <div className="flex flex-col gap-4 py-1">
          {[
            {
              icon: <Dices size={16} />,
              title: 'Mais cupons = mais chances, mas nunca garantia',
              text: 'Cada cupom é um número a mais na roleta. Ter 1000 cupons te dá muito mais chance do que quem tem 10 — mas é um sorteio de verdade: quem tem só 10 também pode ser o sorteado. Sorte é sorte.',
            },
            {
              icon: <ShieldCheck size={16} />,
              title: 'Um prêmio por pessoa',
              text: 'Quem já ganhou algo nesta campanha sai do pool das próximas rodadas — assim mais gente diferente tem chance de levar um prêmio pra casa.',
            },
            {
              icon: <Radio size={16} />,
              title: 'Sorteio ao vivo e transparente',
              text: 'O resultado é sorteado na hora, na transmissão pública — qualquer pessoa pode acompanhar em tempo real e ver a roleta girar até o resultado final.',
            },
            {
              icon: <Gift size={16} />,
              title: 'Prêmios saem do cofre da campanha',
              text: 'A cada rodada, um prêmio disponível é sorteado (aleatório ou em ordem definida pela organização) e vinculado ao ganhador daquela rodada.',
            },
            {
              icon: <PhoneCall size={16} />,
              title: 'Prazo de contato com o vencedor',
              text: 'Depois do sorteio, tentamos contato com quem ganhou por até 2 dias. Se não houver resposta nesse prazo, o prêmio é sorteado novamente entre os demais participantes.',
            },
          ].map((rule, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="p-1.5 rounded shrink-0 bg-brand-secondary/10 border border-brand-secondary/30 text-brand-secondary mt-0.5">
                {rule.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-ui font-bold text-brand-strong">{rule.title}</p>
                <p className="text-xs text-brand-muted leading-relaxed mt-0.5">{rule.text}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage;
