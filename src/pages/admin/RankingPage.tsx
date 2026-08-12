import React, { useEffect, useState } from 'react';
import { Trophy, RefreshCw } from 'lucide-react';
import { campaignService } from '../../services/campaign.service';
import { ticketService } from '../../services/ticket.service';
import { getCampaignStatusLabel } from '../../utils/campaignStatus';
import type { Campaign, LeaderboardEntry } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Leaderboard } from '../../components/ranking/Leaderboard';

export const RankingPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);
  const [isLoadingRanking, setIsLoadingRanking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        setIsLoadingCampaigns(true);
        const list = await campaignService.getCampaigns();
        setCampaigns(list);

        const active = list.find((c) => c.status === 'ACTIVE' || c.status === 'DRAWING' || c.status === 'PAUSED');
        setSelectedCampaignId(active ? active.id : list[0]?.id ?? '');
      } catch (err) {
        console.error('Failed to load campaigns:', err);
        setError('Erro ao carregar campanhas.');
      } finally {
        setIsLoadingCampaigns(false);
      }
    };

    loadCampaigns();
  }, []);

  const loadRanking = async (campaignId: string) => {
    if (!campaignId) {
      setEntries([]);
      return;
    }
    try {
      setIsLoadingRanking(true);
      setError(null);
      const data = await ticketService.getLeaderboard(campaignId);
      setEntries(data.top);
    } catch (err) {
      console.error('Failed to load ranking:', err);
      setError('Falha ao obter o ranking da campanha.');
    } finally {
      setIsLoadingRanking(false);
    }
  };

  useEffect(() => {
    loadRanking(selectedCampaignId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampaignId]);

  return (
    <div className="space-y-6 font-body">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-brand-strong tracking-widest uppercase flex items-center gap-2">
            <Trophy size={22} className="text-brand-primary" />
            RANKING
          </h1>
          <p className="text-xs font-ui font-bold text-brand-secondary tracking-widest mt-1">
            Top 10 participantes por cupons na campanha
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={<RefreshCw size={14} />}
          onClick={() => loadRanking(selectedCampaignId)}
        >
          Sincronizar
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-brand-danger/10 border border-brand-danger/30 text-brand-danger text-xs font-ui font-bold uppercase rounded tracking-wider">
          ⚠ {error}
        </div>
      )}

      <Card variant="default">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-ui font-bold text-brand-muted uppercase tracking-wider">
            Campanha
          </label>
          <select
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            className="w-full bg-brand-bg border border-brand-border rounded px-3 py-2 text-sm font-ui font-bold text-brand-strong tracking-wide focus:border-brand-secondary focus:outline-none"
            disabled={isLoadingCampaigns}
          >
            <option value="">-- Selecione uma campanha --</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({getCampaignStatusLabel(c.status)})
              </option>
            ))}
          </select>
        </div>
      </Card>

      <Card variant="primary" title="Top 10" glow>
        {isLoadingRanking ? (
          <div className="flex flex-col items-center justify-center p-16 text-brand-muted font-mono space-y-4">
            <RefreshCw size={24} className="animate-spin text-brand-primary" />
            <span>CARREGANDO RANKING...</span>
          </div>
        ) : (
          <Leaderboard entries={entries} />
        )}
      </Card>
    </div>
  );
};

export default RankingPage;
