import React, { useEffect, useState } from 'react';
import { campaignService } from '../../services/campaign.service';
import { vaultService } from '../../services/vault.service';
import { drawService } from '../../services/draw.service';
import { getCampaignStatusLabel } from '../../utils/campaignStatus';
import { getApiErrorMessage } from '../../utils/apiError';
import { confirmDialog } from '../../utils/confirm';
import { useSocket } from '../../hooks/useSocket';
import { useDrawStore } from '../../store/drawStore';
import api from '../../services/api';
import type { Campaign, Vault, Draw, DrawSession, SessionOrderStrategy } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import {
  Play, RefreshCw, AlertTriangle, ShieldCheck,
  Gift, Users, Ticket, Activity, Shuffle, Repeat, ListOrdered, Vault as VaultIcon, Square, X, PauseCircle, Hourglass, Undo2,
} from 'lucide-react';

// Sugestões rápidas de motivo — o admin ainda pode digitar um texto livre.
const REVOKE_REASON_PRESETS = [
  'Falta de contato',
  'Vencedor desistiu do prêmio',
  'Vencedor não compareceu para retirada',
];

// A roleta (PrizeWheel) que os espectadores veem desacelera por até 8.5s
// (MAX_DECELERATION_MS em PrizeWheel.tsx) depois que o vencedor é revelado —
// o admin não tem como saber quando cada tela terminou de girar localmente.
// Sem essa trava, o admin podia iniciar a próxima rodada antes disso, o que
// dispara um novo "draw:started" pra todo mundo e apaga o resultado anterior
// no meio da animação de quem ainda estava assistindo.
const RESULT_REVEAL_COOLDOWN_MS = 9000;

export const DrawControlPage: React.FC = () => {
  const { drawId, winner, isSpinning, onlineCount, sessionEndedReason, clearDraw } = useDrawStore();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');

  const [vault, setVault] = useState<Vault | null>(null);

  // Setup do próximo sorteio: em cadeia ou avulso, e se em cadeia, com ordem
  // definida de antemão ou aleatória.
  const [chained, setChained] = useState(false);
  const [orderStrategy, setOrderStrategy] = useState<SessionOrderStrategy>('RANDOM');
  const [prizeOrder, setPrizeOrder] = useState<string[]>([]);

  const [pendingDraw, setPendingDraw] = useState<Draw | null>(null);
  const [activeSession, setActiveSession] = useState<DrawSession | null>(null);

  const [campaignStats, setCampaignStats] = useState<{ totalTickets: number; totalParticipants: number } | null>(null);
  const [history, setHistory] = useState<Draw[]>([]);

  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);
  const [isLoadingVault, setIsLoadingVault] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Segundos restantes até liberar a próxima rodada — evita cortar a
  // animação da roleta pra quem está assistindo (ver RESULT_REVEAL_COOLDOWN_MS acima).
  const [revealCooldownSecs, setRevealCooldownSecs] = useState(0);

  // Revogar um sorteio já concluído (ex: vencedor não responde) — devolve o
  // prêmio ao estoque e libera o vencedor pra próxima rodada.
  const [revokeTarget, setRevokeTarget] = useState<Draw | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [isRevoking, setIsRevoking] = useState(false);

  // Conecta ao socket da campanha selecionada pra receber os eventos ao vivo
  useSocket(selectedCampaignId || undefined);

  useEffect(() => {
    if (!winner) return;
    setRevealCooldownSecs(Math.ceil(RESULT_REVEAL_COOLDOWN_MS / 1000));
    const interval = setInterval(() => {
      setRevealCooldownSecs((secs) => Math.max(secs - 1, 0));
    }, 1000);
    const timeout = setTimeout(() => setRevealCooldownSecs(0), RESULT_REVEAL_COOLDOWN_MS);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [winner]);

  const loadCampaigns = async () => {
    try {
      setIsLoadingCampaigns(true);
      setError(null);
      const list = await campaignService.getCampaigns();
      const activeOrDraft = list.filter((c) => c.status !== 'FINISHED');
      setCampaigns(activeOrDraft);

      const active = activeOrDraft.find((c) => c.status === 'ACTIVE' || c.status === 'DRAWING' || c.status === 'PAUSED');
      if (active) setSelectedCampaignId(active.id);
      else if (activeOrDraft.length > 0) setSelectedCampaignId(activeOrDraft[0].id);
    } catch (err) {
      console.error('Failed to load campaigns:', err);
      setError('Falha ao obter campanhas de sorteio.');
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  const loadVault = async (campaignId: string) => {
    try {
      setIsLoadingVault(true);
      const result = await vaultService.getByCampaign(campaignId);
      setVault(result);
    } catch (err) {
      console.error('Failed to load vault:', err);
      setVault(null);
    } finally {
      setIsLoadingVault(false);
    }
  };

  const loadCampaignStats = async (campaignId: string) => {
    try {
      setIsLoadingStats(true);
      const response = await api.get<{ totalTickets: number; totalParticipants: number }>(`/campaigns/${campaignId}/stats`);
      setCampaignStats(response.data);
    } catch (err) {
      console.error('Failed to load campaign ticket stats:', err);
      setCampaignStats({ totalTickets: 0, totalParticipants: 0 });
    } finally {
      setIsLoadingStats(false);
    }
  };

  const loadHistory = async (campaignId?: string) => {
    try {
      const data = await drawService.getHistory(campaignId);
      setHistory(data);
    } catch (err) {
      console.error('Failed to load draw history:', err);
    }
  };

  // Ao trocar de campanha, verifica se já existe uma sessão em cadeia em
  // andamento (ex: admin recarregou a página no meio de uma sessão)
  const checkActiveSession = async (campaignId: string) => {
    try {
      const sessions = await drawService.getSessionsByCampaign(campaignId);
      const active = sessions.find((s) => s.status === 'ACTIVE') ?? null;
      setActiveSession(active);
      if (active) {
        setChained(true);
        setOrderStrategy(active.orderStrategy);
      }
    } catch (err) {
      console.error('Failed to load draw sessions:', err);
    }
  };

  useEffect(() => {
    loadCampaigns();
    loadHistory();
  }, []);

  useEffect(() => {
    if (selectedCampaignId) {
      loadVault(selectedCampaignId);
      loadCampaignStats(selectedCampaignId);
      loadHistory(selectedCampaignId);
      checkActiveSession(selectedCampaignId);
    } else {
      setVault(null);
      setCampaignStats(null);
      setActiveSession(null);
    }
  }, [selectedCampaignId]);

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId) ?? null;

  const handleResumeCampaign = async () => {
    if (!selectedCampaignId) return;
    setIsActionLoading(true);
    setError(null);
    try {
      await campaignService.resumeCampaign(selectedCampaignId);
      loadCampaigns();
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Falha ao retomar a campanha do intervalo.'));
    } finally {
      setIsActionLoading(false);
    }
  };

  const availablePrizes = (vault?.prizes ?? []).filter((p) => (p.available ?? p.quantity - p.claimed) > 0);
  const vaultHasAvailable = availablePrizes.length > 0;

  const isFixedOrderReady = orderStrategy === 'FIXED_ORDER' ? prizeOrder.length > 0 : true;

  const isSetupReady =
    !!selectedCampaignId &&
    !!campaignStats && campaignStats.totalTickets > 0 &&
    vaultHasAvailable &&
    (!chained || isFixedOrderReady);

  // ─── Sorteio avulso ──────────────────────────────────────────────────────

  const handleStartDraw = async () => {
    if (!selectedCampaignId) return;
    setIsActionLoading(true);
    setError(null);
    try {
      const draw = await drawService.startDraw(selectedCampaignId);
      setPendingDraw(draw);
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Falha ao preparar o sorteio no servidor.'));
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleExecuteDraw = async () => {
    if (!pendingDraw) return;
    setIsActionLoading(true);
    setError(null);
    try {
      await drawService.executeDraw(pendingDraw.id);
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Erro durante o sorteio de cupons.'));
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancelDraw = async () => {
    const targetId = pendingDraw?.id ?? drawId;
    if (!targetId) return;
    const confirmed = await confirmDialog('Tem certeza de que deseja cancelar o sorteio atual?', {
      title: 'Cancelar Sorteio',
      confirmLabel: 'Cancelar Sorteio',
      cancelLabel: 'Voltar',
    });
    if (!confirmed) return;

    setIsActionLoading(true);
    try {
      await drawService.cancelDraw(targetId);
      setPendingDraw(null);
      clearDraw();
      loadHistory(selectedCampaignId);
    } catch (err) {
      setError('Falha ao abortar o sorteio.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleResetDrawDesk = () => {
    setPendingDraw(null);
    clearDraw();
    if (selectedCampaignId) {
      loadVault(selectedCampaignId);
      loadCampaignStats(selectedCampaignId);
      loadHistory(selectedCampaignId);
    }
  };

  // ─── Sorteio em Cadeia ───────────────────────────────────────────────────

  const handleToggleOrderPrize = (prizeId: string, available: number) => {
    setPrizeOrder((prev) => {
      const used = prev.filter((id) => id === prizeId).length;
      if (used >= available) return prev;
      return [...prev, prizeId];
    });
  };

  const handleRemoveOrderEntry = (index: number) => {
    setPrizeOrder((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartChainSession = async () => {
    if (!selectedCampaignId) return;
    setIsActionLoading(true);
    setError(null);
    try {
      const session = await drawService.startSession(
        selectedCampaignId,
        orderStrategy,
        orderStrategy === 'FIXED_ORDER' ? prizeOrder : undefined,
      );
      setActiveSession(session);
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Falha ao iniciar o sorteio em cadeia.'));
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDrawNextInSession = async () => {
    if (!activeSession) return;
    setIsActionLoading(true);
    setError(null);
    clearDraw();
    try {
      await drawService.drawNextInSession(activeSession.id);
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Falha ao sortear a próxima rodada da cadeia.'));
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;
    const confirmed = await confirmDialog('Encerrar o sorteio em cadeia? Não será possível sortear mais nenhuma rodada nele.', {
      title: 'Encerrar Sorteio em Cadeia',
      confirmLabel: 'Encerrar',
      cancelLabel: 'Voltar',
    });
    if (!confirmed) return;

    setIsActionLoading(true);
    try {
      await drawService.endSession(activeSession.id);
      setActiveSession(null);
      setPrizeOrder([]);
      clearDraw();
      loadVault(selectedCampaignId);
      loadHistory(selectedCampaignId);
    } catch (err) {
      setError('Falha ao encerrar o sorteio em cadeia.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleFinishSessionUi = () => {
    setActiveSession(null);
    setPrizeOrder([]);
    clearDraw();
    loadVault(selectedCampaignId);
    loadHistory(selectedCampaignId);
  };

  // ─── Revogar sorteio concluído (vencedor não responde) ──────────────────

  const openRevokeModal = (draw: Draw) => {
    setRevokeTarget(draw);
    setRevokeReason(REVOKE_REASON_PRESETS[0]);
  };

  const closeRevokeModal = () => {
    setRevokeTarget(null);
    setRevokeReason('');
  };

  const handleConfirmRevoke = async () => {
    if (!revokeTarget || !revokeReason.trim()) return;
    setIsRevoking(true);
    setError(null);
    try {
      await drawService.revokeDraw(revokeTarget.id, revokeReason.trim());
      closeRevokeModal();
      loadVault(selectedCampaignId);
      loadCampaignStats(selectedCampaignId);
      loadHistory(selectedCampaignId);
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Falha ao revogar o sorteio.'));
    } finally {
      setIsRevoking(false);
    }
  };

  const isSessionMode = chained || !!activeSession;
  const isLiveDrawRunning = !!drawId && (isSpinning || (winner && !isSessionMode));
  const showSetupPanel = !isLiveDrawRunning && !pendingDraw && !activeSession;

  return (
    <div className="space-y-8 font-inter">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-cyber-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-orbitron font-extrabold text-white tracking-widest uppercase">
            CONTROLE DE SORTEIO
          </h1>
          <p className="text-xs font-rajdhani font-bold text-cyber-secondary tracking-widest mt-1">
            Inicie, execute e acompanhe os sorteios de prêmios em tempo real
          </p>
        </div>
        <div className="flex gap-2">
          {(pendingDraw || drawId) && !isSessionMode && (
            <Button variant="danger" size="sm" onClick={handleCancelDraw} disabled={isSpinning}>
              Cancelar Sorteio
            </Button>
          )}
          <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={() => loadCampaigns()} disabled={isSpinning}>
            Limpar Painel
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-cyber-danger/10 border border-cyber-danger/30 text-cyber-danger text-xs font-rajdhani font-bold uppercase rounded tracking-wider">
          ⚠ {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Campaign selector (always visible) */}
          <Card variant="default">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-rajdhani font-bold text-cyber-text uppercase tracking-wider px-1">
                Campanha de Destino
              </label>
              <select
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                className="w-full bg-cyber-bg border border-cyber-border rounded px-3 py-2.5 text-sm font-rajdhani font-bold text-white tracking-wide focus:border-cyber-secondary focus:outline-none"
                disabled={isLoadingCampaigns || isActionLoading || !!pendingDraw || !!drawId || !!activeSession}
              >
                {isLoadingCampaigns ? (
                  <option>Carregando campanhas...</option>
                ) : campaigns.length === 0 ? (
                  <option>Nenhuma campanha disponível</option>
                ) : (
                  campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({getCampaignStatusLabel(c.status)})
                    </option>
                  ))
                )}
              </select>
            </div>
          </Card>

          {/* Campanha em intervalo: retomar sinaliza a próxima rodada pro
              participante E reabre as missões, permitindo ganhar mais cupons
              antes da rodada seguinte. */}
          {selectedCampaign?.status === 'PAUSED' && (
            <Card variant="secondary" glow>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded bg-cyber-secondary/15 text-cyber-secondary border border-cyber-secondary/30 shrink-0">
                    <PauseCircle size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-orbitron font-bold text-white tracking-wider uppercase">
                      Campanha em intervalo
                    </h3>
                    <p className="text-[10px] text-cyber-muted mt-0.5 leading-relaxed max-w-md">
                      Já rolou uma rodada. Os participantes veem "sorteio em intervalo" no painel deles. Retome pra
                      "Ativa" pra sinalizar que a próxima rodada vem em breve e reabrir as missões, pra quem quiser
                      ganhar mais cupons antes da próxima rodada.
                    </p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Play size={13} />}
                  onClick={handleResumeCampaign}
                  isLoading={isActionLoading}
                  className="shrink-0"
                >
                  Retomar pra Ativa
                </Button>
              </div>
            </Card>
          )}

          {/* Phase 1: Setup — cadeia (com ordem opcional) ou sorteio avulso */}
          {showSetupPanel && (
            <Card variant="default" title="CONFIGURAR PRÓXIMO SORTEIO" subtitle="TODO SORTEIO ESCOLHE O GANHADOR E O PRÊMIO DO COFRE JUNTOS">
              <div className="flex flex-col gap-5 mt-2">
                <button
                  type="button"
                  onClick={() => setChained((v) => !v)}
                  className={`text-left p-3 rounded-lg border transition-colors cursor-pointer flex items-start gap-3 ${
                    chained ? 'border-cyber-accent bg-cyber-accent/10' : 'border-cyber-border bg-black/20 hover:border-cyber-accent/50'
                  }`}
                >
                  <div className={`mt-0.5 p-1.5 rounded shrink-0 ${chained ? 'bg-cyber-accent/20 text-cyber-accent' : 'bg-cyber-border/40 text-cyber-muted'}`}>
                    <Repeat size={14} />
                  </div>
                  <div>
                    <span className="text-xs font-orbitron font-bold text-white uppercase tracking-wider block mb-1">
                      Prêmio em Cadeia
                    </span>
                    <span className="text-[10px] text-cyber-muted leading-relaxed block">
                      Continua sorteando ganhadores diferentes, um prêmio do cofre por vez, sem sair da live — até o cofre esgotar ou você encerrar.
                    </span>
                  </div>
                </button>

                {chained && (
                  <button
                    type="button"
                    onClick={() => setOrderStrategy((s) => (s === 'FIXED_ORDER' ? 'RANDOM' : 'FIXED_ORDER'))}
                    className={`text-left p-3 rounded-lg border transition-colors cursor-pointer flex items-start gap-3 ${
                      orderStrategy === 'FIXED_ORDER' ? 'border-cyber-secondary bg-cyber-secondary/10' : 'border-cyber-border bg-black/20 hover:border-cyber-secondary/50'
                    }`}
                  >
                    <div className={`mt-0.5 p-1.5 rounded shrink-0 ${orderStrategy === 'FIXED_ORDER' ? 'bg-cyber-secondary/20 text-cyber-secondary' : 'bg-cyber-border/40 text-cyber-muted'}`}>
                      <ListOrdered size={14} />
                    </div>
                    <div>
                      <span className="text-xs font-orbitron font-bold text-white uppercase tracking-wider block mb-1">
                        Escolher Ordem
                      </span>
                      <span className="text-[10px] text-cyber-muted leading-relaxed block">
                        Você define de antemão a ordem em que os prêmios da cadeia vão saindo. Desligado: cada rodada sorteia um prêmio aleatório entre os disponíveis.
                      </span>
                    </div>
                  </button>
                )}

                {!vault && (
                  <div className="p-3 bg-cyber-danger/10 border border-cyber-danger/30 text-cyber-danger text-xs font-rajdhani font-bold uppercase rounded tracking-wider flex items-center gap-2">
                    <VaultIcon size={16} />
                    <span>ESTA CAMPANHA AINDA NÃO TEM UM COFRE. CADASTRE PRÊMIOS PRIMEIRO.</span>
                  </div>
                )}

                {vault && chained && orderStrategy === 'FIXED_ORDER' && (
                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-rajdhani font-bold text-cyber-text uppercase tracking-wider px-1">
                      Clique nos prêmios na ordem em que devem sair
                    </span>
                    {availablePrizes.length === 0 ? (
                      <span className="text-xs text-cyber-danger font-mono">Nenhum item disponível no cofre.</span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {availablePrizes.map((p) => {
                          const available = p.available ?? p.quantity - p.claimed;
                          const used = prizeOrder.filter((id) => id === p.id).length;
                          const exhausted = used >= available;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              disabled={exhausted || isLoadingVault}
                              onClick={() => handleToggleOrderPrize(p.id, available)}
                              className={`px-2.5 py-1.5 rounded text-[10px] font-mono border transition-colors ${
                                exhausted
                                  ? 'bg-cyber-border/20 border-cyber-border text-cyber-muted cursor-not-allowed'
                                  : 'bg-cyber-secondary/10 border-cyber-secondary/30 text-cyber-secondary hover:bg-cyber-secondary/20 cursor-pointer'
                              }`}
                            >
                              + {p.name} ({used}/{available})
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-rajdhani font-bold text-cyber-text uppercase tracking-wider px-1">
                        Ordem definida ({prizeOrder.length})
                      </span>
                      {prizeOrder.length === 0 ? (
                        <span className="text-[10px] font-mono text-cyber-muted px-1">Nenhum prêmio adicionado à ordem ainda.</span>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          {prizeOrder.map((prizeId, index) => {
                            const prize = availablePrizes.find((p) => p.id === prizeId) ?? vault?.prizes?.find((p) => p.id === prizeId);
                            return (
                              <div key={`${prizeId}-${index}`} className="flex items-center justify-between px-3 py-1.5 rounded bg-black/30 border border-cyber-border/40">
                                <span className="text-[11px] font-rajdhani font-bold text-white">
                                  {index + 1}º — {prize?.name ?? 'Prêmio'}
                                </span>
                                <button type="button" onClick={() => handleRemoveOrderEntry(index)} className="text-cyber-danger hover:text-cyber-danger/70 cursor-pointer">
                                  <X size={13} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {vault && (!chained || orderStrategy === 'RANDOM') && (
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-rajdhani font-bold text-cyber-text uppercase tracking-wider px-1">
                      Itens disponíveis no cofre
                    </span>
                    {availablePrizes.length === 0 ? (
                      <span className="text-xs text-cyber-danger font-mono">Nenhum item disponível no cofre.</span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {availablePrizes.map((p) => (
                          <span key={p.id} className="px-2 py-1 rounded text-[10px] font-mono bg-cyber-secondary/10 border border-cyber-secondary/30 text-cyber-secondary">
                            {p.name} × {p.available ?? p.quantity - p.claimed}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {vault && !isSetupReady && selectedCampaignId && !isLoadingStats && (
                  <div className="p-3 bg-cyber-danger/10 border border-cyber-danger/30 text-cyber-danger text-xs font-rajdhani font-bold uppercase rounded tracking-wider flex items-center gap-2 select-none">
                    <AlertTriangle size={16} />
                    <span>
                      {chained && orderStrategy === 'FIXED_ORDER' && prizeOrder.length === 0
                        ? 'ADICIONE PELO MENOS UM PRÊMIO À ORDEM ANTES DE INICIAR.'
                        : 'VERIFIQUE SE HÁ CUPONS DISTRIBUÍDOS E PRÊMIOS DISPONÍVEIS ANTES DE SORTEAR.'}
                    </span>
                  </div>
                )}

                <div className="pt-3 border-t border-cyber-border/40 flex justify-end">
                  {chained ? (
                    <Button variant="accent" icon={<Repeat size={15} />} onClick={handleStartChainSession} isLoading={isActionLoading} disabled={!isSetupReady}>
                      Iniciar Sorteio em Cadeia
                    </Button>
                  ) : (
                    <Button variant="accent" icon={<Play size={15} />} onClick={handleStartDraw} isLoading={isActionLoading} disabled={!isSetupReady}>
                      Iniciar Preparação do Sorteio
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Phase 2a: sorteio avulso — pendente/rodando/concluído */}
          {!isSessionMode && (pendingDraw || drawId) && (
            <Card
              variant={winner ? 'secondary' : isSpinning ? 'accent' : 'primary'}
              glow
              title="SORTEIO ÚNICO: ALEATÓRIO DO COFRE"
              subtitle={winner?.prize?.name ? `Prêmio: ${winner.prize.name}` : 'O sistema sorteia o ganhador e o prêmio juntos'}
            >
              <div className="mt-2 flex flex-col gap-6">
                {!drawId && pendingDraw && !winner && (
                  <div className="space-y-4">
                    <div className="p-4 bg-cyber-primary/10 border border-cyber-primary/40 rounded flex flex-col gap-1.5">
                      <span className="font-orbitron font-bold text-white text-xs uppercase tracking-wider">STATUS: AGUARDANDO INÍCIO</span>
                      <p className="text-xs font-inter text-cyber-text/90 leading-relaxed">
                        A tela de sorteio ao vivo já está aberta para os participantes conectados. Clique em "Sortear Agora" para iniciar.
                      </p>
                    </div>
                    <div className="flex justify-end gap-3 pt-3 border-t border-cyber-border/30">
                      <Button variant="secondary" onClick={handleCancelDraw} disabled={isActionLoading}>Cancelar</Button>
                      <Button variant="accent" icon={<Play size={15} />} onClick={handleExecuteDraw} isLoading={isActionLoading}>
                        Sortear Agora!
                      </Button>
                    </div>
                  </div>
                )}

                {isSpinning && (
                  <div className="flex flex-col items-center justify-center py-12 space-y-6">
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-4 border-cyber-accent border-t-transparent animate-spin glow-accent" />
                      <div className="absolute inset-2 rounded-full border-2 border-cyber-secondary border-b-transparent animate-spin-reverse glow-secondary" />
                      <Activity className="text-cyber-accent animate-pulse" size={32} />
                    </div>
                    <div className="text-center space-y-2 select-none">
                      <h3 className="font-orbitron font-extrabold text-white text-lg tracking-widest uppercase animate-pulse">
                        SELECIONANDO O VENCEDOR
                      </h3>
                      <p className="text-xs font-mono text-cyber-muted tracking-widest uppercase">
                        Sorteando entre os cupons disponíveis...
                      </p>
                    </div>
                  </div>
                )}

                {winner && !isSpinning && (
                  <div className="space-y-6 text-center">
                    <div className="p-3 bg-cyber-success/15 border border-cyber-success/40 rounded text-cyber-success text-xs font-rajdhani font-bold uppercase tracking-wider inline-flex items-center gap-1.5 mx-auto">
                      <ShieldCheck size={16} />
                      <span>VENCEDOR SELECIONADO</span>
                    </div>
                    <div className="relative p-6 bg-black/45 border border-cyber-border rounded-lg max-w-lg mx-auto overflow-hidden">
                      <div className="absolute inset-0 pointer-events-none bg-cyber-grid opacity-15" />
                      <span className="text-[10px] font-mono text-cyber-muted block mb-1 uppercase tracking-widest">NOME DO SORTEADO</span>
                      <h2 className="text-3xl font-orbitron font-extrabold text-white text-glow-primary tracking-wide uppercase truncate">
                        {winner.winnerName}
                      </h2>
                      <div className="mt-3 flex justify-center gap-4 text-xs font-mono text-cyber-muted">
                        <span>GANHOU COM: <strong className="text-cyber-secondary">{winner.winnerTickets} cupom{winner.winnerTickets === 1 ? '' : 's'}</strong></span>
                        <span>•</span>
                        <span>CUPONS NO TOTAL: {winner.totalTickets}</span>
                        <span>•</span>
                        <span>CÓDIGO ID: {winner.winnerId?.slice(0, 8)}</span>
                      </div>
                      {winner.prize && (
                        <div className="mt-3 text-xs font-rajdhani font-bold text-cyber-accent uppercase">
                          Prêmio: {winner.prize.name}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-center gap-3 pt-3 border-t border-cyber-border/30">
                      <Button variant="secondary" onClick={handleResetDrawDesk}>Concluir e Reiniciar</Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Phase 2b: sorteio em cadeia */}
          {isSessionMode && activeSession && (
            <Card
              variant={winner ? 'secondary' : isSpinning ? 'accent' : 'primary'}
              glow
              title="SORTEIO EM CADEIA"
              subtitle={`${activeSession.draws?.length ?? 0} rodada(s) já sorteada(s) · ${activeSession.orderStrategy === 'FIXED_ORDER' ? 'ordem definida' : 'prêmio aleatório por rodada'}`}
            >
              <div className="mt-2 flex flex-col gap-6">
                {sessionEndedReason === 'exhausted' && !winner && (
                  <div className="p-3 bg-cyber-accent/15 border border-cyber-accent/40 rounded text-cyber-accent text-xs font-rajdhani font-bold uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck size={16} />
                    <span>O COFRE ACABOU — A CADEIA SE ENCERROU SOZINHA.</span>
                  </div>
                )}

                {!drawId && !winner && !isSpinning && sessionEndedReason !== 'exhausted' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-cyber-primary/10 border border-cyber-primary/40 rounded flex flex-col gap-1.5">
                      <span className="font-orbitron font-bold text-white text-xs uppercase tracking-wider">CADEIA ATIVA</span>
                      <p className="text-xs font-inter text-cyber-text/90 leading-relaxed">
                        Clique em "Sortear Próxima Rodada" pra sortear mais um ganhador e prêmio. A cadeia continua até o cofre esgotar ou você encerrar.
                      </p>
                    </div>
                    <div className="flex justify-end gap-3 pt-3 border-t border-cyber-border/30">
                      <Button variant="secondary" icon={<Square size={13} />} onClick={handleEndSession} disabled={isActionLoading}>
                        Encerrar Cadeia
                      </Button>
                      <Button variant="accent" icon={<Shuffle size={15} />} onClick={handleDrawNextInSession} isLoading={isActionLoading} disabled={!vaultHasAvailable}>
                        Sortear Próxima Rodada
                      </Button>
                    </div>
                  </div>
                )}

                {isSpinning && (
                  <div className="flex flex-col items-center justify-center py-12 space-y-6">
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-4 border-cyber-accent border-t-transparent animate-spin glow-accent" />
                      <Activity className="text-cyber-accent animate-pulse" size={32} />
                    </div>
                    <h3 className="font-orbitron font-extrabold text-white text-lg tracking-widest uppercase animate-pulse">
                      SELECIONANDO A PRÓXIMA RODADA
                    </h3>
                  </div>
                )}

                {winner && !isSpinning && (
                  <div className="space-y-6 text-center">
                    <div className="p-3 bg-cyber-success/15 border border-cyber-success/40 rounded text-cyber-success text-xs font-rajdhani font-bold uppercase tracking-wider inline-flex items-center gap-1.5 mx-auto">
                      <ShieldCheck size={16} />
                      <span>RODADA CONCLUÍDA</span>
                    </div>
                    <div className="relative p-6 bg-black/45 border border-cyber-border rounded-lg max-w-lg mx-auto">
                      <span className="text-[10px] font-mono text-cyber-muted block mb-1 uppercase tracking-widest">GANHADOR DESTA RODADA</span>
                      <h2 className="text-3xl font-orbitron font-extrabold text-white uppercase tracking-wide truncate">{winner.winnerName}</h2>
                      <span className="text-xs font-mono text-cyber-muted">GANHOU COM: {winner.winnerTickets} cupom{winner.winnerTickets === 1 ? '' : 's'} (total: {winner.totalTickets})</span>
                      {winner.prize && (
                        <div className="mt-3 text-xs font-rajdhani font-bold text-cyber-accent uppercase">
                          Prêmio: {winner.prize.name}
                        </div>
                      )}
                    </div>

                    {revealCooldownSecs > 0 && !sessionEndedReason && (
                      <div className="flex items-center justify-center gap-2 text-cyber-accent text-[11px] font-rajdhani font-bold uppercase tracking-wider">
                        <Hourglass size={13} className="animate-pulse" />
                        <span>Aguarde a roleta parar pra quem está assistindo ({revealCooldownSecs}s)</span>
                      </div>
                    )}
                    <div className="flex justify-center gap-3 pt-3 border-t border-cyber-border/30">
                      {sessionEndedReason ? (
                        <Button variant="secondary" onClick={handleFinishSessionUi}>Concluir e Reiniciar</Button>
                      ) : (
                        <>
                          <Button variant="secondary" icon={<Square size={13} />} onClick={handleEndSession} disabled={isActionLoading}>
                            Encerrar Cadeia
                          </Button>
                          <Button
                            variant="accent"
                            icon={<Shuffle size={15} />}
                            onClick={handleDrawNextInSession}
                            isLoading={isActionLoading}
                            disabled={!vaultHasAvailable || revealCooldownSecs > 0}
                          >
                            {revealCooldownSecs > 0 ? `Aguarde (${revealCooldownSecs}s)` : 'Sortear Próxima Rodada'}
                          </Button>
                        </>
                      )}
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
              MÉTRICAS DA CAMPANHA
            </h2>
          </div>

          <Card variant="accent" glow={onlineCount > 0}>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-rajdhani font-bold text-cyber-muted tracking-wider uppercase">USUÁRIOS CONECTADOS</p>
                <p className="text-[9px] font-mono text-cyber-muted uppercase mt-0.5">Conexões em tempo real ativas</p>
              </div>
              <div className="p-2 rounded bg-cyber-accent/10 border border-cyber-accent/30 text-cyber-accent">
                <Activity size={18} className="animate-pulse" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-orbitron font-extrabold text-white text-glow-accent">{onlineCount}</span>
              <span className="text-[10px] font-mono text-cyber-muted uppercase tracking-widest">dispositivos ativos</span>
            </div>
          </Card>

          <Card variant="default">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-rajdhani font-bold text-cyber-muted tracking-wider uppercase">PARTICIPANTES COM TICKET</p>
                <p className="text-[9px] font-mono text-cyber-muted uppercase mt-0.5">Elegíveis nesta campanha</p>
              </div>
              <div className="p-2 rounded bg-cyber-border/40 text-cyber-muted">
                <Users size={18} />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-orbitron font-extrabold text-white">
                {isLoadingStats ? '...' : campaignStats?.totalParticipants ?? 0}
              </span>
              <span className="text-[10px] font-mono text-cyber-muted uppercase tracking-widest">usuários aptos</span>
            </div>
          </Card>

          <Card variant="secondary">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-rajdhani font-bold text-cyber-secondary tracking-wider uppercase">CUPONS CONCORRENDO</p>
                <p className="text-[9px] font-mono text-cyber-muted uppercase mt-0.5">Total de cupons acumulados</p>
              </div>
              <div className="p-2 rounded bg-cyber-secondary/10 border border-cyber-secondary/30 text-cyber-secondary">
                <Ticket size={18} />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-orbitron font-extrabold text-white text-glow-secondary">
                {isLoadingStats ? '...' : campaignStats?.totalTickets ?? 0}
              </span>
              <span className="text-[10px] font-mono text-cyber-muted uppercase tracking-widest">tickets válidos</span>
            </div>
          </Card>
        </div>
      </div>

      {/* History table */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Gift size={18} className="text-cyber-primary" />
          <h2 className="text-base font-orbitron font-bold text-white tracking-widest uppercase">HISTÓRICO RECENTE DE SORTEIOS</h2>
        </div>

        <div className="border border-cyber-border bg-cyber-surface/60 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-cyber-border bg-black/45 text-[11px] font-mono tracking-wider text-cyber-muted uppercase select-none">
                  <th className="p-4 font-normal">Data / Hora</th>
                  <th className="p-4 font-normal">Tipo</th>
                  <th className="p-4 font-normal">Prêmio</th>
                  <th className="p-4 font-normal">Ganhador</th>
                  <th className="p-4 font-normal text-center">Cupons do Ganhador</th>
                  <th className="p-4 font-normal text-center">Cupons Concorrentes</th>
                  <th className="p-4 font-normal text-center">Estado</th>
                  <th className="p-4 font-normal text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-border/40 text-xs font-rajdhani font-bold text-white tracking-wider">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-cyber-muted font-mono select-none">
                      NENHUM SORTEIO REGISTRADO NESTA CAMPANHA AINDA.
                    </td>
                  </tr>
                ) : (
                  history.map((draw) => (
                    <tr key={draw.id} className="hover:bg-cyber-surface/30 transition-colors">
                      <td className="p-4 font-mono text-[11px] text-cyber-text/85">
                        {draw.drawnAt ? new Date(draw.drawnAt).toLocaleString('pt-BR') : new Date(draw.createdAt).toLocaleString('pt-BR')}
                      </td>
                      <td className="p-4 text-[10px] font-mono text-cyber-secondary">{draw.sessionId ? 'Em cadeia' : 'Avulso'}</td>
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
                      <td className="p-4 text-center font-mono text-cyber-secondary">
                        {draw.winnerTickets ?? '—'}
                      </td>
                      <td className="p-4 text-center font-mono text-cyber-text/80">{draw.totalTickets || 0}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          draw.status === 'COMPLETED' ? 'bg-cyber-success/10 border-cyber-success text-cyber-success' :
                          draw.status === 'CANCELLED' ? 'bg-cyber-danger/10 border-cyber-danger text-cyber-danger' :
                          'bg-cyber-border/40 border border-cyber-border text-white'
                        }`}>
                          {draw.status}
                        </span>
                        {draw.status === 'CANCELLED' && draw.cancelReason && (
                          <div className="text-[9px] text-cyber-danger/80 font-mono mt-1 normal-case max-w-[160px] mx-auto">
                            Motivo: {draw.cancelReason}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {draw.status === 'COMPLETED' && (
                          <Button
                            variant="danger"
                            size="sm"
                            icon={<Undo2 size={12} />}
                            onClick={() => openRevokeModal(draw)}
                          >
                            Revogar
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal: revogar sorteio concluído */}
      <Modal
        isOpen={!!revokeTarget}
        onClose={closeRevokeModal}
        title="Revogar Sorteio"
        size="sm"
      >
        {revokeTarget && (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-cyber-text/90 leading-relaxed">
              O prêmio <strong className="text-white">{revokeTarget.prize?.name ?? 'sorteado'}</strong> volta pro
              estoque do cofre e <strong className="text-white">{revokeTarget.winnerName ?? 'o vencedor'}</strong> volta
              a ser elegível pra próxima rodada. Essa ação não pode ser desfeita.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-rajdhani font-bold text-cyber-text uppercase tracking-wider px-1">
                Motivo
              </label>
              <div className="flex flex-wrap gap-2">
                {REVOKE_REASON_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRevokeReason(preset)}
                    className={`px-2.5 py-1.5 rounded text-[10px] font-mono border transition-colors cursor-pointer ${
                      revokeReason === preset
                        ? 'bg-cyber-danger/15 border-cyber-danger text-cyber-danger'
                        : 'bg-cyber-border/20 border-cyber-border text-cyber-muted hover:border-cyber-danger/50'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <textarea
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                rows={3}
                maxLength={300}
                placeholder="Descreva o motivo da revogação..."
                className="w-full bg-cyber-bg border border-cyber-border rounded px-3 py-2.5 text-sm font-rajdhani font-bold text-white tracking-wide focus:border-cyber-danger focus:outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-cyber-border/40">
              <Button variant="secondary" onClick={closeRevokeModal} disabled={isRevoking}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                icon={<Undo2 size={14} />}
                onClick={handleConfirmRevoke}
                isLoading={isRevoking}
                disabled={!revokeReason.trim()}
              >
                Confirmar Revogação
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DrawControlPage;
