import React, { useEffect, useState } from 'react';
import { campaignService } from '../../services/campaign.service';
import { prizeService } from '../../services/prize.service';
import { drawService } from '../../services/draw.service';
import { useSocket } from '../../hooks/useSocket';
import { useDrawStore } from '../../store/drawStore';
import api from '../../services/api';
import type { Campaign, Prize, Draw } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  Play, RefreshCw, AlertTriangle, ShieldCheck, 
  Gift, Users, Ticket, Activity 
} from 'lucide-react';

export const DrawControlPage: React.FC = () => {
  const { 
    status, drawId, campaignName, prize, winner, isSpinning, onlineCount,
    setDrawDetails, setStatus, clearDraw, setStats 
  } = useDrawStore();

  // Instantiate WebSocket connection and listeners for campaigns
  useSocket();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [selectedPrizeId, setSelectedPrizeId] = useState<string>('');

  const [campaignStats, setCampaignStats] = useState<{ totalTickets: number; totalParticipants: number } | null>(null);
  const [history, setHistory] = useState<Draw[]>([]);

  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);
  const [isLoadingPrizes, setIsLoadingPrizes] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load active campaigns
  const loadCampaigns = async () => {
    try {
      setIsLoadingCampaigns(true);
      setError(null);
      const list = await campaignService.getCampaigns();
      const activeOrDraft = list.filter(c => c.status !== 'FINISHED');
      setCampaigns(activeOrDraft);
      
      const active = activeOrDraft.find(c => c.status === 'ACTIVE' || c.status === 'DRAWING');
      if (active) {
        setSelectedCampaignId(active.id);
      } else if (activeOrDraft.length > 0) {
        setSelectedCampaignId(activeOrDraft[0].id);
      }
    } catch (err) {
      console.error('Failed to load campaigns:', err);
      setError('Falha ao obter campanhas de sorteio.');
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  // Load prizes for campaign
  const loadPrizes = async (campaignId: string) => {
    try {
      setIsLoadingPrizes(true);
      const list = await prizeService.getCampaignPrizes(campaignId);
      // Filter prizes with stock > 0
      const available = list.filter(p => p.quantity > 0);
      setPrizes(available);
      if (available.length > 0) {
        setSelectedPrizeId(available[0].id);
      } else {
        setSelectedPrizeId('');
      }
    } catch (err) {
      console.error('Failed to load prizes:', err);
      setPrizes([]);
      setSelectedPrizeId('');
    } finally {
      setIsLoadingPrizes(false);
    }
  };

  // Load ticket and participant summary for campaign
  const loadCampaignStats = async (campaignId: string) => {
    try {
      setIsLoadingStats(true);
      const response = await api.get<{ totalTickets: number; totalParticipants: number }>(`/campaigns/${campaignId}/stats`);
      setCampaignStats(response.data);
      // Synchronize with store metrics if available
      setStats({ participantCount: response.data.totalParticipants });
    } catch (err) {
      console.error('Failed to load campaign ticket stats:', err);
      setCampaignStats({ totalTickets: 0, totalParticipants: 0 });
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Load previous draws history
  const loadHistory = async (campaignId?: string) => {
    try {
      const data = await drawService.getHistory(campaignId);
      setHistory(data);
    } catch (err) {
      console.error('Failed to load draw history:', err);
    }
  };

  useEffect(() => {
    loadCampaigns();
    loadHistory();
  }, []);

  useEffect(() => {
    if (selectedCampaignId) {
      loadPrizes(selectedCampaignId);
      loadCampaignStats(selectedCampaignId);
      loadHistory(selectedCampaignId);
    } else {
      setPrizes([]);
      setSelectedPrizeId('');
      setCampaignStats(null);
    }
  }, [selectedCampaignId]);

  // Phase 1: Iniciar Sorteio (Create draw on backend)
  const handleStartDraw = async () => {
    if (!selectedCampaignId || !selectedPrizeId) {
      setError('Por favor, selecione a campanha e o prêmio correspondente.');
      return;
    }
    
    setIsActionLoading(true);
    setError(null);
    try {
      const res = await drawService.startDraw(selectedCampaignId, selectedPrizeId);
      const activeCampaignName = campaigns.find(c => c.id === selectedCampaignId)?.name || 'Campanha';
      const activePrize = prizes.find(p => p.id === selectedPrizeId) || null;
      
      setDrawDetails({
        drawId: res.id,
        campaignName: activeCampaignName,
        prize: activePrize,
      });
      setStatus('PENDING');
    } catch (err: any) {
      console.error('Failed to start draw:', err);
      const msg = err.response?.data?.message || 'Falha ao preparar o sorteio no servidor.';
      setError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Phase 2: Sortear Agora (Execute draw on backend)
  const handleExecuteDraw = async () => {
    if (!drawId) return;
    setIsActionLoading(true);
    setError(null);
    try {
      // Execute call to NestJS backend, which spins, selects winner, and emits WS updates
      await drawService.executeDraw(drawId);
    } catch (err: any) {
      console.error('Failed to execute draw:', err);
      const msg = err.response?.data?.message || 'Erro durante o sorteio de cupons.';
      setError(Array.isArray(msg) ? msg[0] : msg);
      setIsActionLoading(false);
    }
  };

  // Phase 3: Cancelar Sorteio
  const handleCancelDraw = async () => {
    if (!drawId) return;
    if (!window.confirm('Tem certeza de que deseja cancelar o sorteio atual?')) return;
    
    setIsActionLoading(true);
    try {
      await drawService.cancelDraw(drawId);
      clearDraw();
      loadHistory(selectedCampaignId);
    } catch (err) {
      console.error('Cancel draw error:', err);
      setError('Falha ao abortar o sorteio.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Phase 4: Finalize session / Start over
  const handleResetDrawDesk = () => {
    clearDraw();
    if (selectedCampaignId) {
      loadPrizes(selectedCampaignId);
      loadCampaignStats(selectedCampaignId);
      loadHistory(selectedCampaignId);
    }
  };

  const isRaffleReady = selectedCampaignId && selectedPrizeId && campaignStats && campaignStats.totalTickets > 0;

  return (
    <div className="space-y-8 font-inter">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-cyber-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-orbitron font-extrabold text-white tracking-widest uppercase">
            MESA DE CONTROLE DE SORTEIO
          </h1>
          <p className="text-xs font-rajdhani font-bold text-cyber-secondary tracking-widest mt-1">
            // TERMINAL DE CONTROLE DE SORTEIOS DE PRÊMIOS EM TEMPO REAL
          </p>
        </div>
        <div className="flex gap-2">
          {status && (
            <Button variant="danger" size="sm" onClick={handleCancelDraw} disabled={isSpinning}>
              Abortar Sorteio
            </Button>
          )}
          <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={() => loadCampaigns()} disabled={isSpinning}>
            Limpar Painel
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-cyber-danger/10 border border-cyber-danger/30 text-cyber-danger text-xs font-rajdhani font-bold uppercase rounded tracking-wider">
          ⚠ TERMINAL_ALARM // {error}
        </div>
      )}

      {/* Main Operational Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Control Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Phase 1: Setup Draw Selection */}
          {!status && (
            <Card 
              variant="default" 
              title="CONFIGURAR PRÓXIMO SORTEIO" 
              subtitle="SELECIONE OS PARÂMETROS E REQUISITOS"
            >
              <div className="flex flex-col gap-5 mt-2">
                <div className="text-xs font-mono text-cyber-muted leading-relaxed">
                  Selecione a campanha ativa do sorteio e associe a um prêmio físico registrado com quantidade em estoque. O sorteio recolherá todos os cupons elegíveis no banco.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Select Campaign */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-rajdhani font-bold text-cyber-text uppercase tracking-wider px-1">
                      Campanha de Destino
                    </label>
                    <select
                      value={selectedCampaignId}
                      onChange={(e) => setSelectedCampaignId(e.target.value)}
                      className="w-full bg-cyber-bg border border-cyber-border rounded px-3 py-2.5 text-sm font-rajdhani font-bold text-white tracking-wide focus:border-cyber-secondary focus:outline-none"
                      disabled={isLoadingCampaigns || isActionLoading}
                    >
                      {isLoadingCampaigns ? (
                        <option>Carregando campanhas...</option>
                      ) : campaigns.length === 0 ? (
                        <option>Nenhuma campanha disponível</option>
                      ) : (
                        campaigns.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.status})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Select Prize */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-rajdhani font-bold text-cyber-text uppercase tracking-wider px-1">
                      Prêmio a Sortear
                    </label>
                    <select
                      value={selectedPrizeId}
                      onChange={(e) => setSelectedPrizeId(e.target.value)}
                      className="w-full bg-cyber-bg border border-cyber-border rounded px-3 py-2.5 text-sm font-rajdhani font-bold text-white tracking-wide focus:border-cyber-secondary focus:outline-none"
                      disabled={isLoadingPrizes || isActionLoading || !selectedCampaignId}
                    >
                      {isLoadingPrizes ? (
                        <option>Carregando prêmios...</option>
                      ) : prizes.length === 0 ? (
                        <option>Nenhum prêmio em estoque</option>
                      ) : (
                        prizes.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (Qtd: {p.quantity})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                {!isRaffleReady && selectedCampaignId && !isLoadingStats && (
                  <div className="p-3 bg-cyber-danger/10 border border-cyber-danger/30 text-cyber-danger text-xs font-rajdhani font-bold uppercase rounded tracking-wider flex items-center gap-2 select-none">
                    <AlertTriangle size={16} />
                    <span>ALERTA: ESTA CAMPANHA NÃO POSSUI CUPONS DISTRIBUÍDOS. IMPOSSÍVEL SORTEAR.</span>
                  </div>
                )}

                <div className="pt-3 border-t border-cyber-border/40 flex justify-end">
                  <Button
                    variant="accent"
                    icon={<Play size={15} />}
                    onClick={handleStartDraw}
                    isLoading={isActionLoading}
                    disabled={!isRaffleReady}
                  >
                    Iniciar Preparação do Sorteio
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Phase 2: Drawing State Machine Panel */}
          {status && (
            <Card
              variant={status === 'COMPLETED' ? 'secondary' : isSpinning ? 'accent' : 'primary'}
              glow={true}
              title={`SORTEIO AO VIVO: ID ${drawId?.slice(0, 8)}`}
              subtitle={`${campaignName} // PRÊMIO: ${prize?.name}`}
            >
              <div className="mt-2 flex flex-col gap-6">
                
                {/* Pending Confirmation screen */}
                {status === 'PENDING' && !isSpinning && (
                  <div className="space-y-4">
                    <div className="p-4 bg-cyber-primary/10 border border-cyber-primary/40 rounded flex flex-col gap-1.5">
                      <span className="font-orbitron font-bold text-white text-xs uppercase tracking-wider">ESTADO: AGUARDANDO COMANDO</span>
                      <p className="text-xs font-inter text-cyber-text/90 leading-relaxed">
                        O terminal de sorteio está ativado. Todos os dispositivos dos participantes online foram notificados e estão assistindo à tela de sorteio ao vivo. Clique em "Sortear Agora" para girar.
                      </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-cyber-border/30">
                      <Button
                        variant="secondary"
                        onClick={handleCancelDraw}
                        disabled={isActionLoading}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="accent"
                        icon={<Play size={15} />}
                        onClick={handleExecuteDraw}
                        isLoading={isActionLoading}
                      >
                        Sortear Agora!
                      </Button>
                    </div>
                  </div>
                )}

                {/* Spinning Animation Screen */}
                {isSpinning && (
                  <div className="flex flex-col items-center justify-center py-12 space-y-6">
                    {/* Spinning HUD Graphics */}
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-4 border-cyber-accent border-t-transparent animate-spin glow-accent" />
                      <div className="absolute inset-2 rounded-full border-2 border-cyber-secondary border-b-transparent animate-spin-reverse glow-secondary" />
                      <Activity className="text-cyber-accent animate-pulse" size={32} />
                    </div>

                    <div className="text-center space-y-2 select-none">
                      <h3 className="font-orbitron font-extrabold text-white text-lg tracking-widest uppercase animate-pulse">
                        DECIFRANDO ALGORITMO
                      </h3>
                      <p className="text-xs font-mono text-cyber-muted tracking-widest uppercase">
                        GIRANDO ENVELOPE DE CUPONS DISPONÍVEIS...
                      </p>
                    </div>
                  </div>
                )}

                {/* Winner Revealed screen */}
                {status === 'COMPLETED' && winner && (
                  <div className="space-y-6 text-center">
                    <div className="p-3 bg-cyber-success/15 border border-cyber-success/40 rounded text-cyber-success text-xs font-rajdhani font-bold uppercase tracking-wider inline-flex items-center gap-1.5 mx-auto">
                      <ShieldCheck size={16} />
                      <span>VENCEDOR IDENTIFICADO PELO SISTEMA</span>
                    </div>

                    <div className="relative p-6 bg-black/45 border border-cyber-border rounded-lg max-w-lg mx-auto overflow-hidden">
                      <div className="absolute inset-0 pointer-events-none bg-cyber-grid opacity-15" />
                      <span className="text-[10px] font-mono text-cyber-muted block mb-1 uppercase tracking-widest">NOME DO SORTEADO</span>
                      <h2 className="text-3xl font-orbitron font-extrabold text-white text-glow-primary tracking-wide uppercase truncate">
                        {winner.winnerName || winner.name}
                      </h2>
                      <div className="mt-3 flex justify-center gap-4 text-xs font-mono text-cyber-muted">
                        <span>CUPONS TOTAIS: <strong className="text-cyber-secondary">{winner.tickets}</strong></span>
                        <span>•</span>
                        <span>CÓDIGO ID: {winner.userId?.slice(0, 8)}</span>
                      </div>
                    </div>

                    <div className="flex justify-center gap-3 pt-3 border-t border-cyber-border/30">
                      <Button
                        variant="secondary"
                        onClick={handleResetDrawDesk}
                      >
                        Concluir e Resetar Mesa
                      </Button>
                    </div>
                  </div>
                )}

              </div>
            </Card>
          )}
        </div>

        {/* Right Stats Column */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-cyber-border/40 pb-3">
            <Activity size={18} className="text-cyber-secondary" />
            <h2 className="text-sm font-orbitron font-extrabold text-white tracking-widest uppercase">
              MÉTRICAS DO CONTEXTO
            </h2>
          </div>

          {/* Realtime participants WS */}
          <Card variant="accent" glow={onlineCount > 0}>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-rajdhani font-bold text-cyber-muted tracking-wider uppercase">
                  USUÁRIOS CONECTADOS
                </p>
                <p className="text-[9px] font-mono text-cyber-muted uppercase mt-0.5">
                  Conexões WebSocket ativas
                </p>
              </div>
              <div className="p-2 rounded bg-cyber-accent/10 border border-cyber-accent/30 text-cyber-accent">
                <Activity size={18} className="animate-pulse" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-orbitron font-extrabold text-white text-glow-accent">
                {onlineCount}
              </span>
              <span className="text-[10px] font-mono text-cyber-muted uppercase tracking-widest">
                dispositivos ativos
              </span>
            </div>
          </Card>

          {/* Eligible participants count */}
          <Card variant="default">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-rajdhani font-bold text-cyber-muted tracking-wider uppercase">
                  PARTICIPANTES COM TICKET
                </p>
                <p className="text-[9px] font-mono text-cyber-muted uppercase mt-0.5">
                  Elegíveis nesta campanha
                </p>
              </div>
              <div className="p-2 rounded bg-cyber-border/40 text-cyber-muted">
                <Users size={18} />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-orbitron font-extrabold text-white">
                {isLoadingStats ? '...' : campaignStats?.totalParticipants ?? 0}
              </span>
              <span className="text-[10px] font-mono text-cyber-muted uppercase tracking-widest">
                usuários aptos
              </span>
            </div>
          </Card>

          {/* Total cumulative tickets */}
          <Card variant="secondary">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-rajdhani font-bold text-cyber-secondary tracking-wider uppercase">
                  CUPONS CONCORRENDO
                </p>
                <p className="text-[9px] font-mono text-cyber-muted uppercase mt-0.5">
                  Total de cupons acumulados
                </p>
              </div>
              <div className="p-2 rounded bg-cyber-secondary/10 border border-cyber-secondary/30 text-cyber-secondary">
                <Ticket size={18} />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-orbitron font-extrabold text-white text-glow-secondary">
                {isLoadingStats ? '...' : campaignStats?.totalTickets ?? 0}
              </span>
              <span className="text-[10px] font-mono text-cyber-muted uppercase tracking-widest">
                tickets válidos
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* History table */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Gift size={18} className="text-cyber-primary" />
          <h2 className="text-base font-orbitron font-bold text-white tracking-widest uppercase">
            HISTÓRICO RECENTE DE SORTEIOS
          </h2>
        </div>

        <div className="border border-cyber-border bg-cyber-surface/60 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-cyber-border bg-black/45 text-[11px] font-mono tracking-wider text-cyber-muted uppercase select-none">
                  <th className="p-4 font-normal">Data / Hora</th>
                  <th className="p-4 font-normal">Prêmio</th>
                  <th className="p-4 font-normal">Ganhador</th>
                  <th className="p-4 font-normal text-center">Cupons Concorrentes</th>
                  <th className="p-4 font-normal text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-border/40 text-xs font-rajdhani font-bold text-white tracking-wider">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-cyber-muted font-mono select-none">
                      NENHUM SORTEIO REGISTRADO NESTA CAMPANHA AINDA.
                    </td>
                  </tr>
                ) : (
                  history.map((draw) => (
                    <tr key={draw.id} className="hover:bg-cyber-surface/30 transition-colors">
                      <td className="p-4 font-mono text-[11px] text-cyber-text/85">
                        {draw.drawnAt ? new Date(draw.drawnAt).toLocaleString('pt-BR') : new Date(draw.createdAt).toLocaleString('pt-BR')}
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-semibold text-white">{draw.prize?.name || 'Prêmio'}</span>
                      </td>
                      <td className="p-4">
                        {draw.winnerName ? (
                          <div className="flex flex-col">
                            <span className="text-white font-semibold">{draw.winnerName}</span>
                            <span className="text-[9px] text-cyber-muted font-mono lowercase">ID: {draw.winnerId?.slice(0, 8)}</span>
                          </div>
                        ) : (
                          <span className="text-cyber-danger font-mono font-semibold">SEM GANHADOR</span>
                        )}
                      </td>
                      <td className="p-4 text-center font-mono text-cyber-text/80">
                        {draw.totalTickets || 0}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          draw.status === 'COMPLETED' ? 'bg-cyber-success/10 border-cyber-success text-cyber-success' :
                          draw.status === 'CANCELLED' ? 'bg-cyber-danger/10 border-cyber-danger text-cyber-danger' :
                          'bg-cyber-border/40 border border-cyber-border text-white'
                        }`}>
                          {draw.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrawControlPage;
