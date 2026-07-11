import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/admin.service';
import type { DashboardStats } from '../../services/admin.service';
import { campaignService } from '../../services/campaign.service';
import { getCampaignStatusLabel } from '../../utils/campaignStatus';
import { useSocket } from '../../hooks/useSocket';
import { useDrawStore } from '../../store/drawStore';
import type { Campaign } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  Users, Ticket, CheckSquare,
  Activity, Play, Plus, RefreshCw, Award
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  // Initialize WebSocket for admin updates
  useSocket();
  const { onlineCount } = useDrawStore();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch campaigns initially
  const loadCampaigns = async () => {
    try {
      setIsLoadingCampaigns(true);
      setError(null);
      const list = await campaignService.getCampaigns();
      setCampaigns(list);
      
      // Auto-select active campaign or first draft, if any
      const active = list.find(c => c.status === 'ACTIVE' || c.status === 'DRAWING' || c.status === 'PAUSED');
      if (active) {
        setSelectedCampaignId(active.id);
      } else if (list.length > 0) {
        setSelectedCampaignId(list[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load campaigns:', err);
      setError('Falha ao carregar campanhas do sistema.');
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  // Fetch stats when campaign changes
  useEffect(() => {
    if (!selectedCampaignId) return;

    const loadStats = async () => {
      try {
        setIsLoadingStats(true);
        const data = await adminService.getDashboardStats(selectedCampaignId);
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
        // Set fallback stats to avoid crashing if empty database
        setStats({
          totalParticipants: 0,
          totalTickets: 0,
          completedMissions: 0,
        });
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadStats();
  }, [selectedCampaignId]);

  const activeCampaign = campaigns.find(c => c.id === selectedCampaignId);

  return (
    <div className="space-y-8 font-inter">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-cyber-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-orbitron font-extrabold text-white tracking-widest uppercase">
            PAINEL DE CONTROLE
          </h1>
          <p className="text-xs font-rajdhani font-bold text-cyber-secondary tracking-widest mt-1">
            Status geral dos sorteios e participantes
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/campaigns">
            <Button variant="primary" size="sm" icon={<Plus size={14} />}>
              Nova Campanha
            </Button>
          </Link>
          <Button 
            variant="secondary" 
            size="sm" 
            icon={<RefreshCw size={14} />}
            onClick={() => {
              loadCampaigns();
              if (selectedCampaignId) {
                setIsLoadingStats(true);
                adminService.getDashboardStats(selectedCampaignId)
                  .then(setStats)
                  .finally(() => setIsLoadingStats(false));
              }
            }}
          >
            Sincronizar
          </Button>
        </div>
      </div>

      {/* Select Campaign Filter and Realtime WS State */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign Filter Card */}
        <Card variant="default" className="lg:col-span-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-orbitron font-bold text-white tracking-wider uppercase">
                FILTRO DE MÉTRICAS
              </h3>
              <p className="text-[10px] font-mono text-cyber-muted uppercase mt-0.5">
                Selecione uma campanha para visualizar o progresso
              </p>
            </div>
            
            <div className="w-full sm:w-64">
              <select
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                className="w-full bg-cyber-bg border border-cyber-border rounded px-3 py-2 text-sm font-rajdhani font-bold text-white tracking-wide focus:border-cyber-secondary focus:outline-none"
                disabled={isLoadingCampaigns}
              >
                {isLoadingCampaigns ? (
                  <option>Carregando campanhas...</option>
                ) : campaigns.length === 0 ? (
                  <option>Nenhuma campanha encontrada</option>
                ) : (
                  campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({getCampaignStatusLabel(c.status)})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </Card>

        {/* Real-time WS Status Card */}
        <Card variant="accent" glow={onlineCount > 0}>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-orbitron font-bold text-cyber-accent tracking-wider uppercase">
                MONITOR DE CONEXÕES
              </h3>
              <p className="text-[10px] font-mono text-cyber-muted uppercase mt-0.5">
                Membros online via WebSockets
              </p>
            </div>
            <div className="flex items-center gap-2 bg-cyber-accent/10 border border-cyber-accent/30 rounded px-2.5 py-1 text-cyber-accent">
              <Activity size={14} className="animate-pulse" />
              <span className="font-mono text-xs font-bold">AO VIVO</span>
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-orbitron font-extrabold text-white text-glow-accent">
              {onlineCount}
            </span>
            <span className="text-xs font-rajdhani font-bold text-cyber-muted uppercase tracking-widest">
              usuários conectados
            </span>
          </div>
        </Card>
      </div>

      {error && (
        <div className="p-3.5 bg-cyber-danger/10 border border-cyber-danger/30 text-cyber-danger text-xs font-rajdhani font-semibold tracking-wider rounded uppercase">
          ⚠ {error}
        </div>
      )}

      {/* Stats Dashboard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Participants */}
        <Card variant="default">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-rajdhani font-bold text-cyber-muted tracking-wider uppercase">
                PARTICIPANTES
              </p>
              <h2 className="text-2xl font-orbitron font-extrabold text-white mt-2">
                {isLoadingStats ? '---' : stats?.totalParticipants ?? 0}
              </h2>
            </div>
            <div className="p-2 rounded bg-cyber-border/40 text-cyber-muted">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-cyber-border/20 text-[10px] font-mono text-cyber-muted">
            INSCRITOS NESTA CAMPANHA
          </div>
        </Card>

        {/* Distributed Tickets */}
        <Card variant="secondary" glow={!isLoadingStats && (stats?.totalTickets ?? 0) > 0}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-rajdhani font-bold text-cyber-secondary tracking-wider uppercase">
                CUPONS EMITIDOS
              </p>
              <h2 className="text-2xl font-orbitron font-extrabold text-white mt-2 text-glow-secondary">
                {isLoadingStats ? '---' : stats?.totalTickets ?? 0}
              </h2>
            </div>
            <div className="p-2 rounded bg-cyber-secondary/10 text-cyber-secondary border border-cyber-secondary/30">
              <Ticket size={20} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-cyber-border/20 text-[10px] font-mono text-cyber-muted">
            TICKETS ACUMULADOS NO TOTAL
          </div>
        </Card>

        {/* Completed Quests */}
        <Card variant="primary">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-rajdhani font-bold text-cyber-primary tracking-wider uppercase">
                MISSÕES CONCLUÍDAS
              </p>
              <h2 className="text-2xl font-orbitron font-extrabold text-white mt-2">
                {isLoadingStats ? '---' : stats?.completedMissions ?? 0}
              </h2>
            </div>
            <div className="p-2 rounded bg-cyber-primary/10 text-cyber-primary border border-cyber-primary/30">
              <CheckSquare size={20} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-cyber-border/20 text-[10px] font-mono text-cyber-muted">
            TAREFAS ENVIADAS/VALIDADAS
          </div>
        </Card>
      </div>

      {/* Main Panel Content - Quick Actions and Campaign Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign Info Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <Award size={18} className="text-cyber-primary" />
            <h2 className="text-base font-orbitron font-bold text-white tracking-widest uppercase">
              CAMPANHAS DISPONÍVEIS
            </h2>
          </div>

          <div className="border border-cyber-border bg-cyber-surface/60 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-cyber-border bg-black/45 text-[11px] font-mono tracking-wider text-cyber-muted uppercase select-none">
                    <th className="p-4 font-normal">Nome</th>
                    <th className="p-4 font-normal">Status</th>
                    <th className="p-4 font-normal">Data Sorteio</th>
                    <th className="p-4 font-normal text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyber-border/40 text-xs font-rajdhani font-bold text-white tracking-wider">
                  {isLoadingCampaigns ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-cyber-muted font-mono select-none">
                        PROCURANDO CAMPANHAS NO BANCO DE DADOS...
                      </td>
                    </tr>
                  ) : campaigns.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-cyber-muted font-mono select-none">
                        NENHUMA CAMPANHA CADASTRADA.
                      </td>
                    </tr>
                  ) : (
                    campaigns.map((c) => (
                      <tr key={c.id} className="hover:bg-cyber-surface/30 transition-colors">
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold">{c.name}</span>
                            <span className="text-[10px] text-cyber-muted font-mono lowercase">ID: {c.id}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                            c.status === 'ACTIVE' ? 'bg-cyber-success/15 border border-cyber-success/40 text-cyber-success' :
                            c.status === 'DRAWING' ? 'bg-cyber-accent/15 border border-cyber-accent/40 text-cyber-accent animate-pulse' :
                            c.status === 'FINISHED' ? 'bg-cyber-muted/15 border border-cyber-muted/40 text-cyber-muted' :
                            'bg-cyber-border/40 border border-cyber-border text-white'
                          }`}>
                            {getCampaignStatusLabel(c.status)}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-[11px] text-cyber-text/80">
                          {c.drawDate ? new Date(c.drawDate).toLocaleDateString('pt-BR') : 'Sem data definida'}
                        </td>
                        <td className="p-4 text-right">
                          <Link to="/admin/campaigns">
                            <button className="text-[10px] font-mono text-cyber-secondary hover:underline cursor-pointer">
                              GERENCIAR
                            </button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick Operations Sidebar */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Play size={18} className="text-cyber-accent" />
            <h2 className="text-base font-orbitron font-bold text-white tracking-widest uppercase">
              AÇÕES RÁPIDAS
            </h2>
          </div>

          <Card variant="default">
            <div className="flex flex-col gap-4">
              <div className="text-xs font-mono text-cyber-muted leading-relaxed">
                Atalhos rápidos para o controle de sorteio da Rethink3D:
              </div>

              {activeCampaign ? (
                <div className="bg-black/35 rounded border border-cyber-border/60 p-3 flex flex-col gap-1 text-xs">
                  <span className="font-mono text-cyber-muted uppercase text-[10px]">CAMPANHA EM FOCO</span>
                  <span className="font-orbitron text-white text-sm uppercase truncate">{activeCampaign.name}</span>
                  <span className="font-mono text-cyber-secondary mt-1">Status: {getCampaignStatusLabel(activeCampaign.status)}</span>
                </div>
              ) : (
                <div className="text-xs text-cyber-danger font-mono bg-cyber-danger/5 border border-cyber-danger/25 p-3 rounded">
                  Nenhuma campanha selecionada ou ativa para controle.
                </div>
              )}

              <Link to="/admin/draw-control" className="w-full">
                <Button 
                  variant="accent" 
                  fullWidth 
                  icon={<Play size={15} />}
                  disabled={!activeCampaign}
                >
                  Painel de Sorteio
                </Button>
              </Link>

              <div className="border-t border-cyber-border/40 my-1" />

              <div className="grid grid-cols-2 gap-2">
                <Link to="/admin/missions" className="w-full">
                  <Button variant="primary" size="sm" fullWidth className="text-[11px]">
                    Editar Missões
                  </Button>
                </Link>
                <Link to="/admin/prizes" className="w-full">
                  <Button variant="primary" size="sm" fullWidth className="text-[11px]">
                    Editar Prêmios
                  </Button>
                </Link>
              </div>

              <Link to="/admin/participants" className="w-full">
                <Button variant="secondary" size="sm" fullWidth className="text-[11px]">
                  Ver Participantes
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
