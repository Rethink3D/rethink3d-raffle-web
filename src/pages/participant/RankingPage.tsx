import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { campaignService } from '../../services/campaign.service';
import { ticketService } from '../../services/ticket.service';
import { Card } from '../../components/ui/Card';
import { Leaderboard, MyPositionCard } from '../../components/ranking/Leaderboard';
import type { Campaign, LeaderboardResponse, User } from '../../types';
import { ThemeAsset } from '../../theme/assets';

export const RankingPage: React.FC = () => {
  const { user } = useAuthStore();
  const userId = (user as User | null)?.id;

  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const campaign = await campaignService.getActiveCampaign();
        if (!isMounted) return;
        setActiveCampaign(campaign);

        if (campaign) {
          const data = await ticketService.getLeaderboard(campaign.id);
          if (!isMounted) return;
          setLeaderboard(data);
        }
      } catch (err) {
        console.error('Failed to load ranking:', err);
        if (isMounted) setError('Não conseguimos carregar o ranking agora. Tente de novo.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] select-none pointer-events-none">
        <ThemeAsset kind="loader" size={120} />
        <div className="text-brand-secondary animate-pulse text-xs font-bold tracking-widest mt-2 uppercase">
          Carregando ranking...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-10">
        <Card variant="danger" title="Ops, algo deu errado" glow>
          <p className="text-sm font-ui font-bold text-brand-strong tracking-wider text-center">{error}</p>
        </Card>
      </div>
    );
  }

  if (!activeCampaign) {
    return (
      <div className="max-w-xl mx-auto my-10">
        <Card variant="default" title="Nenhum sorteio rolando agora" glow className="select-none">
          <div className="flex flex-col items-center gap-4 text-center py-4">
            <ThemeAsset kind="waiting" size={96} className="w-24" />
            <p className="text-sm font-body text-brand-muted max-w-sm">
              O ranking aparece assim que uma campanha estiver ativa.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const isMeInTop = leaderboard?.me && leaderboard.top.some((e) => e.userId === leaderboard.me?.userId);

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 font-body text-brand-text">
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-mono text-brand-muted hover:text-brand-secondary uppercase tracking-widest w-fit">
        <ArrowLeft size={14} /> Voltar
      </Link>

      <Card
        variant="primary"
        title="Ranking de Cupons"
        subtitle={activeCampaign.name}
        glow
        headerExtra={<Trophy size={22} className="text-brand-primary" />}
      >
        <Leaderboard entries={leaderboard?.top ?? []} highlightUserId={userId} />
      </Card>

      {leaderboard?.me && !isMeInTop && (
        <MyPositionCard entry={leaderboard.me} />
      )}
    </div>
  );
};

export default RankingPage;
