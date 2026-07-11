import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { campaignService } from '../../services/campaign.service';
import { questService } from '../../services/quest.service';
import { getCampaignStatusLabel } from '../../utils/campaignStatus';
import type { Campaign, Mission, MissionType } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import {
  Plus, Edit2, Trash2, ArrowUp, ArrowDown, RefreshCw,
  Globe, Link2, Layers, BarChart3
} from 'lucide-react';

type Tab = 'campaign' | 'global';

export const MissionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('campaign');

  // ─── Campaign tab ─────────────────────────────────────────────────────────
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);
  const [isLoadingMissions, setIsLoadingMissions] = useState(false);

  // ─── Global tab ───────────────────────────────────────────────────────────
  const [globalMissions, setGlobalMissions] = useState<Mission[]>([]);
  const [isLoadingGlobal, setIsLoadingGlobal] = useState(false);

  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Assign Modal ─────────────────────────────────────────────────────────
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [missionToAssign, setMissionToAssign] = useState<Mission | null>(null);
  const [assignTargetCampaignId, setAssignTargetCampaignId] = useState<string>('');

  // ─── Delete Modal ─────────────────────────────────────────────────────────
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [questToDelete, setQuestToDelete] = useState<Mission | null>(null);

  // ─── Loaders ─────────────────────────────────────────────────────────────

  const loadCampaigns = async () => {
    try {
      setIsLoadingCampaigns(true);
      setError(null);
      const list = await campaignService.getCampaigns();
      setCampaigns(list);

      const active = list.find(c => c.status === 'ACTIVE' || c.status === 'DRAWING' || c.status === 'PAUSED');
      const defaultId = active?.id ?? list[0]?.id ?? '';
      setSelectedCampaignId(defaultId);
      setAssignTargetCampaignId(defaultId);
    } catch (err: any) {
      setError('Falha ao carregar campanhas.');
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  const loadMissions = async (campaignId: string) => {
    if (!campaignId) return;
    try {
      setIsLoadingMissions(true);
      setError(null);
      const list = await questService.getAllCampaignQuestsAdmin(campaignId);
      setMissions(list.sort((a, b) => a.order - b.order));
    } catch (err: any) {
      setMissions([]);
      setError('Falha ao carregar missões da campanha.');
    } finally {
      setIsLoadingMissions(false);
    }
  };

  const loadGlobalMissions = async () => {
    try {
      setIsLoadingGlobal(true);
      setError(null);
      const list = await questService.getGlobalQuests();
      setGlobalMissions(list.sort((a, b) => a.order - b.order));
    } catch (err: any) {
      setGlobalMissions([]);
      setError('Falha ao carregar missões globais.');
    } finally {
      setIsLoadingGlobal(false);
    }
  };

  useEffect(() => { loadCampaigns(); }, []);

  useEffect(() => {
    if (activeTab === 'campaign' && selectedCampaignId) {
      loadMissions(selectedCampaignId);
    } else if (activeTab === 'global') {
      loadGlobalMissions();
    }
  }, [activeTab, selectedCampaignId]);

  // ─── Create / Edit navigation ─────────────────────────────────────────────

  const handleOpenCreate = (isGlobal: boolean) => {
    if (isGlobal) {
      navigate('/admin/missions/new?global=true');
    } else {
      navigate(`/admin/missions/new?campaignId=${selectedCampaignId}`);
    }
  };

  const handleOpenEdit = (mission: Mission) => {
    navigate(`/admin/missions/${mission.id}/edit`, { state: { mission } });
  };

  const handleViewFeedbackResults = (mission: Mission) => {
    navigate(`/admin/missions/${mission.id}/feedback-results`, { state: { missionTitle: mission.title } });
  };

  const handleViewSurveyResults = (mission: Mission) => {
    navigate(`/admin/missions/${mission.id}/survey-results`, { state: { missionTitle: mission.title } });
  };

  // ─── Delete ───────────────────────────────────────────────────────────────

  const handleOpenDelete = (mission: Mission) => {
    setQuestToDelete(mission);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!questToDelete) return;
    setIsActionLoading(true);
    try {
      await questService.deleteQuest(questToDelete.id);
      setIsDeleteOpen(false);
      activeTab === 'global' ? loadGlobalMissions() : loadMissions(selectedCampaignId);
    } catch (err: any) {
      setError('Erro ao excluir missão.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // ─── Toggle ───────────────────────────────────────────────────────────────

  const handleToggleActive = async (mission: Mission, isGlobal: boolean) => {
    setIsActionLoading(true);
    try {
      await questService.toggleQuest(mission.id, !mission.active);
      isGlobal ? loadGlobalMissions() : loadMissions(selectedCampaignId);
    } catch (err: any) {
      setError('Falha ao alterar ativação da missão.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // ─── Reorder ──────────────────────────────────────────────────────────────

  const handleMove = async (index: number, direction: 'up' | 'down', isGlobal: boolean) => {
    const list = isGlobal ? globalMissions : missions;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    setIsActionLoading(true);
    try {
      const sorted = [...list];
      const temp = sorted[index];
      sorted[index] = sorted[targetIndex];
      sorted[targetIndex] = temp;
      const payload = sorted.map((m, idx) => ({ id: m.id, order: idx + 1 }));
      await questService.reorderQuests(payload);
      isGlobal ? loadGlobalMissions() : loadMissions(selectedCampaignId);
    } catch (err) {
      setError('Erro ao reordenar missões.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // ─── Assign ───────────────────────────────────────────────────────────────

  const handleOpenAssign = (mission: Mission) => {
    setMissionToAssign(mission);
    setAssignTargetCampaignId(campaigns[0]?.id ?? '');
    setIsAssignOpen(true);
  };

  const handleAssignConfirm = async () => {
    if (!missionToAssign || !assignTargetCampaignId) return;
    setIsActionLoading(true);
    try {
      await questService.assignMissionToCampaign(missionToAssign.id, assignTargetCampaignId);
      setIsAssignOpen(false);
      loadGlobalMissions();
    } catch (err: any) {
      setError('Erro ao atribuir missão à campanha.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const getMissionTypeLabel = (type: MissionType) => {
    switch (type) {
      case 'PROOF_UPLOAD': return 'Envio de Comprovante';
      case 'QUIZ': return 'Quiz';
      case 'FEEDBACK_FORM': return 'Formulário de Feedback';
      case 'REFERRAL': return 'Indique um Amigo';
      case 'SURVEY': return 'Pesquisa';
      default: return type;
    }
  };

  // ─── Reusable mission table ───────────────────────────────────────────────

  const MissionsTable: React.FC<{ list: Mission[]; isGlobal: boolean; loading: boolean }> = ({ list, isGlobal, loading }) => {
    if (loading) return (
      <div className="flex flex-col items-center justify-center p-20 text-cyber-muted font-mono space-y-4">
        <RefreshCw size={24} className="animate-spin text-cyber-primary" />
        <span>CARREGANDO MISSÕES...</span>
      </div>
    );

    if (list.length === 0) return (
      <Card variant="default">
        <div className="text-center py-10 font-mono text-cyber-muted">
          {isGlobal
            ? 'NENHUMA MISSÃO GLOBAL. CRIE UMA MISSÃO SEM CAMPANHA PARA COMEÇAR.'
            : 'NENHUMA MISSÃO NESTA CAMPANHA. CLIQUE EM "CRIAR MISSÃO" PARA INICIAR.'}
        </div>
      </Card>
    );

    return (
      <div className="border border-cyber-border bg-cyber-surface/60 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-cyber-border bg-black/45 text-[11px] font-mono tracking-wider text-cyber-muted uppercase select-none">
                <th className="p-4 font-normal text-center w-16">Ordem</th>
                <th className="p-4 font-normal">Título / Descrição</th>
                <th className="p-4 font-normal">Tipo</th>
                <th className="p-4 font-normal text-center">Tickets</th>
                <th className="p-4 font-normal text-center">Status</th>
                <th className="p-4 font-normal text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border/40 text-xs font-rajdhani font-bold text-white tracking-wider">
              {list.map((mission, index) => (
                <tr key={mission.id} className="hover:bg-cyber-surface/30 transition-colors">
                  <td className="p-4 text-center font-mono">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm font-semibold">{mission.order}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleMove(index, 'up', isGlobal)}
                          disabled={index === 0 || isActionLoading}
                          className="p-1 rounded bg-black/40 border border-cyber-border/40 hover:border-cyber-primary disabled:opacity-30 disabled:pointer-events-none text-cyber-muted hover:text-cyber-primary cursor-pointer"
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          onClick={() => handleMove(index, 'down', isGlobal)}
                          disabled={index === list.length - 1 || isActionLoading}
                          className="p-1 rounded bg-black/40 border border-cyber-border/40 hover:border-cyber-primary disabled:opacity-30 disabled:pointer-events-none text-cyber-muted hover:text-cyber-primary cursor-pointer"
                        >
                          <ArrowDown size={12} />
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 max-w-sm">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-white">{mission.title}</span>
                      <span className="text-[10px] text-cyber-muted font-normal mt-0.5 line-clamp-2">{mission.description}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyber-primary/10 border border-cyber-primary/30 text-cyber-primary">
                      {getMissionTypeLabel(mission.type)}
                    </span>
                  </td>
                  <td className="p-4 text-center font-mono text-cyber-secondary text-sm">+{mission.reward}</td>
                  <td className="p-4 text-center">
                    {isGlobal ? (
                      <span
                        title="Ativo/inativo só se aplica quando a missão está vinculada a uma campanha"
                        className="px-2 py-0.5 rounded text-[10px] font-mono border bg-cyber-border/30 border-cyber-border/60 text-cyber-muted"
                      >
                        MODELO
                      </span>
                    ) : (
                      <button
                        onClick={() => handleToggleActive(mission, isGlobal)}
                        disabled={isActionLoading}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border cursor-pointer ${
                          mission.active
                            ? 'bg-cyber-success/15 border-cyber-success text-cyber-success hover:bg-cyber-success/25'
                            : 'bg-cyber-danger/15 border-cyber-danger text-cyber-danger hover:bg-cyber-danger/25'
                        }`}
                      >
                        {mission.active ? 'ATIVO' : 'INATIVO'}
                      </button>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex gap-2 justify-end flex-wrap">
                      {isGlobal && (
                        <Button
                          variant="accent"
                          size="sm"
                          icon={<Link2 size={13} />}
                          onClick={() => handleOpenAssign(mission)}
                          disabled={isActionLoading || campaigns.length === 0}
                          title="Atribuir a uma campanha"
                        >
                          Atribuir
                        </Button>
                      )}
                      {!isGlobal && mission.type === 'FEEDBACK_FORM' && (
                        <Button
                          variant="accent"
                          size="sm"
                          icon={<BarChart3 size={13} />}
                          onClick={() => handleViewFeedbackResults(mission)}
                          disabled={isActionLoading}
                          title="Ver resultados do formulário"
                        >
                          Resultados
                        </Button>
                      )}
                      {!isGlobal && mission.type === 'SURVEY' && (
                        <Button
                          variant="accent"
                          size="sm"
                          icon={<BarChart3 size={13} />}
                          onClick={() => handleViewSurveyResults(mission)}
                          disabled={isActionLoading}
                          title="Ver resultados da pesquisa"
                        >
                          Resultados
                        </Button>
                      )}
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<Edit2 size={13} />}
                        onClick={() => handleOpenEdit(mission)}
                        disabled={isActionLoading}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<Trash2 size={13} />}
                        onClick={() => handleOpenDelete(mission)}
                        disabled={isActionLoading}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 font-inter">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-cyber-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-orbitron font-extrabold text-white tracking-widest uppercase">
            GERENCIAR MISSÕES
          </h1>
          <p className="text-xs font-rajdhani font-bold text-cyber-secondary tracking-widest mt-1">
            Criação e configuração das missões dos participantes
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => handleOpenCreate(activeTab === 'global')}
            disabled={activeTab === 'campaign' && !selectedCampaignId}
          >
            {activeTab === 'global' ? 'Nova Missão Global' : 'Criar Missão'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw size={14} />}
            onClick={() => activeTab === 'global' ? loadGlobalMissions() : loadMissions(selectedCampaignId)}
          >
            Recarregar
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-cyber-danger/10 border border-cyber-danger/30 text-cyber-danger text-xs font-rajdhani font-bold uppercase rounded tracking-wider">
          ⚠ {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-cyber-surface/50 border border-cyber-border/40 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('campaign')}
          className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-orbitron font-bold tracking-widest uppercase transition-all cursor-pointer ${
            activeTab === 'campaign'
              ? 'bg-cyber-primary/20 border border-cyber-primary/40 text-cyber-primary'
              : 'text-cyber-muted hover:text-white'
          }`}
        >
          <Layers size={14} />
          Por Campanha
        </button>
        <button
          onClick={() => setActiveTab('global')}
          className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-orbitron font-bold tracking-widest uppercase transition-all cursor-pointer ${
            activeTab === 'global'
              ? 'bg-cyber-accent/20 border border-cyber-accent/40 text-cyber-accent'
              : 'text-cyber-muted hover:text-white'
          }`}
        >
          <Globe size={14} />
          Missões Globais
        </button>
      </div>

      {/* ─── TAB: POR CAMPANHA ─── */}
      {activeTab === 'campaign' && (
        <>
          <Card variant="default">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-orbitron font-bold text-white tracking-wider uppercase">
                  CAMPANHA SELECIONADA
                </h3>
                <p className="text-[10px] font-mono text-cyber-muted uppercase mt-0.5">
                  Selecione a campanha para visualizar e gerenciar suas missões
                </p>
              </div>
              <div className="w-full sm:w-72">
                <select
                  value={selectedCampaignId}
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                  className="w-full bg-cyber-bg border border-cyber-border rounded px-3 py-2 text-sm font-rajdhani font-bold text-white tracking-wide focus:border-cyber-secondary focus:outline-none"
                  disabled={isLoadingCampaigns}
                >
                  {isLoadingCampaigns ? (
                    <option>Carregando campanhas...</option>
                  ) : campaigns.length === 0 ? (
                    <option>Nenhuma campanha cadastrada</option>
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

          <MissionsTable list={missions} isGlobal={false} loading={isLoadingMissions} />
        </>
      )}

      {/* ─── TAB: MISSÕES GLOBAIS ─── */}
      {activeTab === 'global' && (
        <>
          <Card variant="default">
            <div className="flex items-start gap-3">
              <Globe size={18} className="text-cyber-accent shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-orbitron font-bold text-white tracking-wider uppercase">
                  MISSÕES SEM CAMPANHA VINCULADA
                </h3>
                <p className="text-[10px] font-mono text-cyber-muted uppercase mt-0.5 leading-relaxed">
                  Estas missões estão prontas mas não estão associadas a nenhuma campanha ativa.
                  Use o botão "Atribuir" para vinculá-las a uma campanha específica quando desejar.
                </p>
              </div>
            </div>
          </Card>

          <MissionsTable list={globalMissions} isGlobal={true} loading={isLoadingGlobal} />
        </>
      )}

      {/* ─── Modal: Atribuir a Campanha ─── */}
      <Modal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        title="Atribuir Missão a uma Campanha"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm font-inter text-cyber-text">
            Vincular <strong className="text-white">"{missionToAssign?.title}"</strong> a qual campanha?
          </p>
          <select
            value={assignTargetCampaignId}
            onChange={(e) => setAssignTargetCampaignId(e.target.value)}
            className="w-full bg-cyber-bg border border-cyber-border rounded px-3 py-2 text-sm font-rajdhani font-bold text-white tracking-wide focus:border-cyber-secondary focus:outline-none"
          >
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({getCampaignStatusLabel(c.status)})</option>
            ))}
          </select>
          <div className="flex justify-end gap-3 pt-4 border-t border-cyber-border/40">
            <Button type="button" variant="secondary" onClick={() => setIsAssignOpen(false)} disabled={isActionLoading}>
              Cancelar
            </Button>
            <Button type="button" variant="accent" isLoading={isActionLoading} onClick={handleAssignConfirm} icon={<Link2 size={14} />}>
              Confirmar Atribuição
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Modal: Confirmar Exclusão ─── */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirmar Exclusão de Missão"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm font-inter text-cyber-text">
            Tem certeza de que deseja excluir a missão{' '}
            <strong className="text-white">"{questToDelete?.title}"</strong>?
            Esta ação apagará todos os dados de completude e comprovantes associados.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-cyber-border/40">
            <Button type="button" variant="secondary" onClick={() => setIsDeleteOpen(false)} disabled={isActionLoading}>
              Cancelar
            </Button>
            <Button type="button" variant="danger" isLoading={isActionLoading} onClick={handleDeleteConfirm}>
              Excluir Permanentemente
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MissionsPage;
