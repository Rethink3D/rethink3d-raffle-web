import React, { useEffect, useState } from 'react';
import { campaignService } from '../../services/campaign.service';
import { drawScheduleService } from '../../services/drawSchedule.service';
import { getCampaignStatusLabel } from '../../utils/campaignStatus';
import { getApiErrorMessage } from '../../utils/apiError';
import { confirmDialog } from '../../utils/confirm';
import type { Campaign, DrawSchedule } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ImageUploadField } from '../../components/ui/ImageUploadField';
import { Modal } from '../../components/ui/Modal';
import {
  Edit2, Trash2, Calendar, Clock, X,
  ToggleLeft, CheckCircle2, AlertTriangle, Plus, RefreshCw
} from 'lucide-react';

export const CampaignsPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    coverImageUrl: '',
    startDate: '',
    drawDate: '',
  });

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);

  const [isFinishOpen, setIsFinishOpen] = useState(false);
  const [campaignToFinish, setCampaignToFinish] = useState<Campaign | null>(null);
  const [finishPassword, setFinishPassword] = useState('');
  const [finishError, setFinishError] = useState<string | null>(null);

  // ─── Horários de Sorteio ────────────────────────────────────────────────
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleCampaign, setScheduleCampaign] = useState<Campaign | null>(null);
  const [schedules, setSchedules] = useState<DrawSchedule[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [scheduleForm, setScheduleForm] = useState({ scheduledAt: '', label: '' });
  const [isScheduleActionLoading, setIsScheduleActionLoading] = useState(false);

  const [isActionLoading, setIsActionLoading] = useState(false);

  const loadCampaigns = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await campaignService.getCampaigns();
      setCampaigns(data);
    } catch (err: any) {
      console.error('Failed to load campaigns:', err);
      setError('Falha ao carregar a lista de campanhas.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  // Format date helper for datetime-local input
  const formatDatetimeForInput = (isoString?: string | null) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const tzoffset = date.getTimezoneOffset() * 60000; //offset in milliseconds
    const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
    return localISOTime;
  };

  const handleOpenCreate = () => {
    setEditingCampaign(null);
    setFormData({
      name: '',
      description: '',
      coverImageUrl: '',
      startDate: '',
      drawDate: '',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      description: campaign.description || '',
      coverImageUrl: campaign.coverImageUrl || '',
      startDate: formatDatetimeForInput(campaign.startDate),
      drawDate: formatDatetimeForInput(campaign.drawDate),
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    setIsActionLoading(true);
    setError(null);
    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        coverImageUrl: formData.coverImageUrl || null,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        drawDate: formData.drawDate ? new Date(formData.drawDate).toISOString() : null,
      };

      if (editingCampaign) {
        await campaignService.updateCampaign(editingCampaign.id, payload);
      } else {
        await campaignService.createCampaign(payload);
      }
      setIsFormOpen(false);
      loadCampaigns();
    } catch (err: any) {
      console.error('Form submit error:', err);
      setError('Falha ao salvar campanha. Verifique os dados inseridos.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleOpenDelete = (campaign: Campaign) => {
    setCampaignToDelete(campaign);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!campaignToDelete) return;
    setIsActionLoading(true);
    try {
      await campaignService.deleteCampaign(campaignToDelete.id);
      setIsDeleteOpen(false);
      loadCampaigns();
    } catch (err: any) {
      console.error('Delete error:', err);
      setError('Falha ao excluir a campanha.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleActivate = async (id: string) => {
    const confirmed = await confirmDialog(
      'Deseja ativar esta campanha? Isso a tornará elegível para participação.',
      { title: 'Ativar Campanha', confirmLabel: 'Ativar', variant: 'primary' }
    );
    if (!confirmed) return;
setIsActionLoading(true);
    try {
      await campaignService.activateCampaign(id);
      loadCampaigns();
    } catch (err: any) {
      console.error('Activation error:', err);
      setError(getApiErrorMessage(err, 'Falha ao ativar campanha.'));
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleOpenFinish = (campaign: Campaign) => {
    setCampaignToFinish(campaign);
    setFinishPassword('');
    setFinishError(null);
    setIsFinishOpen(true);
  };

  const handleFinishConfirm = async () => {
    if (!campaignToFinish || !finishPassword) return;
    setIsActionLoading(true);
    setFinishError(null);
    try {
      await campaignService.finishCampaign(campaignToFinish.id, finishPassword);
      setIsFinishOpen(false);
      loadCampaigns();
    } catch (err: any) {
      console.error('Finish error:', err);
      setFinishError(getApiErrorMessage(err, 'Falha ao encerrar campanha.'));
    } finally {
      setIsActionLoading(false);
    }
  };

  // ─── Horários de Sorteio ────────────────────────────────────────────────

  const loadSchedules = async (campaignId: string) => {
    try {
      setIsLoadingSchedules(true);
      setScheduleError(null);
      const list = await drawScheduleService.getByCampaign(campaignId);
      setSchedules(list);
    } catch (err: any) {
      setScheduleError(getApiErrorMessage(err, 'Falha ao carregar os horários agendados.'));
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  const handleOpenSchedule = (campaign: Campaign) => {
    setScheduleCampaign(campaign);
    setEditingScheduleId(null);
    setScheduleForm({ scheduledAt: '', label: '' });
    setScheduleError(null);
    setIsScheduleOpen(true);
    loadSchedules(campaign.id);
  };

  const handleEditScheduleClick = (schedule: DrawSchedule) => {
    setEditingScheduleId(schedule.id);
    setScheduleForm({
      scheduledAt: formatDatetimeForInput(schedule.scheduledAt),
      label: schedule.label || '',
    });
  };

  const handleCancelScheduleEdit = () => {
    setEditingScheduleId(null);
    setScheduleForm({ scheduledAt: '', label: '' });
  };

  const handleSubmitSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleCampaign || !scheduleForm.scheduledAt) return;

    setIsScheduleActionLoading(true);
    setScheduleError(null);
    try {
      const payload = {
        scheduledAt: new Date(scheduleForm.scheduledAt).toISOString(),
        label: scheduleForm.label.trim() || null,
      };
      if (editingScheduleId) {
        await drawScheduleService.update(scheduleCampaign.id, editingScheduleId, payload);
      } else {
        await drawScheduleService.create(scheduleCampaign.id, payload);
      }
      handleCancelScheduleEdit();
      loadSchedules(scheduleCampaign.id);
    } catch (err: any) {
      setScheduleError(getApiErrorMessage(err, 'Falha ao salvar o horário de sorteio.'));
    } finally {
      setIsScheduleActionLoading(false);
    }
  };

  const handleDeleteSchedule = async (schedule: DrawSchedule) => {
    if (!scheduleCampaign) return;
    const confirmed = await confirmDialog('Remover este horário de sorteio agendado?', {
      title: 'Remover Horário',
      confirmLabel: 'Remover',
      cancelLabel: 'Voltar',
    });
    if (!confirmed) return;

    setIsScheduleActionLoading(true);
    try {
      await drawScheduleService.remove(scheduleCampaign.id, schedule.id);
      if (editingScheduleId === schedule.id) handleCancelScheduleEdit();
      loadSchedules(scheduleCampaign.id);
    } catch (err: any) {
      setScheduleError(getApiErrorMessage(err, 'Falha ao remover o horário de sorteio.'));
    } finally {
      setIsScheduleActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-inter">
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-cyber-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-orbitron font-extrabold text-white tracking-widest uppercase">
            GESTOR DE CAMPANHAS
          </h1>
          <p className="text-xs font-rajdhani font-bold text-cyber-secondary tracking-widest mt-1">
            Lista e configuração das campanhas de sorteio Rethink3D
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={handleOpenCreate}>
            Criar Campanha
          </Button>
          <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={loadCampaigns}>
            Recarregar
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-cyber-danger/10 border border-cyber-danger/30 text-cyber-danger text-xs font-rajdhani font-bold uppercase rounded tracking-wider">
          ⚠ {error}
        </div>
      )}

      {/* Campaigns Listing */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-20 text-cyber-muted font-mono space-y-4">
          <RefreshCw size={24} className="animate-spin text-cyber-primary" />
          <span>CARREGANDO CAMPANHAS...</span>
        </div>
      ) : campaigns.length === 0 ? (
        <Card variant="default">
          <div className="text-center py-10 font-mono text-cyber-muted">
            NENHUMA CAMPANHA CADASTRADA NO MOMENTO. CLIQUE EM "CRIAR CAMPANHA" PARA INICIAR.
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {campaigns.map((campaign) => {
            const isDraft = campaign.status === 'DRAFT';
            const isActive = campaign.status === 'ACTIVE';
            const isDrawing = campaign.status === 'DRAWING';
            const isFinished = campaign.status === 'FINISHED';

            return (
              <Card 
                key={campaign.id}
                variant={isActive ? 'secondary' : isDrawing ? 'accent' : isFinished ? 'default' : 'primary'}
                glow={isActive || isDrawing}
                title={campaign.name}
                subtitle={`STATUS: ${getCampaignStatusLabel(campaign.status)}`}
                headerExtra={
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                    isActive ? 'bg-cyber-success/10 border-cyber-success text-cyber-success' :
                    isDrawing ? 'bg-cyber-accent/10 border-cyber-accent text-cyber-accent animate-pulse' :
                    isFinished ? 'bg-cyber-muted/10 border-cyber-muted text-cyber-muted' :
                    'bg-cyber-primary/10 border-cyber-primary text-cyber-primary'
                  }`}>
                    {getCampaignStatusLabel(campaign.status)}
                  </span>
                }
              >
                <div className="flex flex-col h-full gap-4 mt-2">
                  {campaign.coverImageUrl && (
                    <div className="aspect-video relative rounded-md border border-cyber-border overflow-hidden bg-black/55">
                      <img
                        src={campaign.coverImageUrl}
                        alt={campaign.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <p className="text-xs text-cyber-text/80 line-clamp-3 min-h-[48px] font-inter">
                    {campaign.description || 'Nenhuma descrição fornecida.'}
                  </p>

                  <div className="space-y-2 border-t border-b border-cyber-border/40 py-3 text-xs font-rajdhani font-bold text-cyber-muted tracking-wide">
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1 uppercase"><Calendar size={12} /> INÍCIO:</span>
                      <span className="font-mono text-white">
                        {campaign.startDate ? new Date(campaign.startDate).toLocaleString('pt-BR') : 'IMEDIATO'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1 uppercase"><Calendar size={12} /> SORTEIO:</span>
                      <span className="font-mono text-white">
                        {campaign.drawDate ? new Date(campaign.drawDate).toLocaleString('pt-BR') : 'NÃO AGENDADO'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-end mt-auto pt-2">
                    {isDraft && (
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<CheckCircle2 size={13} />}
                        onClick={() => handleActivate(campaign.id)}
                        disabled={isActionLoading}
                      >
                        Ativar
                      </Button>
                    )}

                    {(isActive || isDrawing) && (
                      <Button
                        variant="accent"
                        size="sm"
                        icon={<ToggleLeft size={13} />}
                        onClick={() => handleOpenFinish(campaign)}
                        disabled={isActionLoading}
                      >
                        Encerrar
                      </Button>
                    )}

                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Clock size={13} />}
                      onClick={() => handleOpenSchedule(campaign)}
                      disabled={isActionLoading}
                      title="Configurar horários de sorteio"
                    >
                      Horários
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Edit2 size={13} />}
                      onClick={() => handleOpenEdit(campaign)}
                      disabled={isActionLoading}
                    />

                    <Button
                      variant="danger"
                      size="sm"
                      icon={<Trash2 size={13} />}
                      onClick={() => handleOpenDelete(campaign)}
                      disabled={isActionLoading}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingCampaign ? 'Editar Campanha' : 'Criar Nova Campanha'}
        size="md"
      >
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          <Input
            label="Nome da Campanha"
            placeholder="Ex: Natal Rethink3D 2026"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div className="flex flex-col gap-1.5 font-inter">
            <label className="text-xs font-rajdhani font-bold tracking-wider text-cyber-text uppercase px-1">
              Descrição
            </label>
            <textarea
              className="w-full bg-cyber-bg border border-cyber-border rounded px-4 py-2.5 text-sm font-rajdhani font-semibold text-white tracking-wide placeholder-cyber-muted focus:border-cyber-secondary focus:ring-1 focus:ring-cyber-secondary focus:outline-none"
              rows={4}
              placeholder="Descreva a campanha, regras de participação, prêmios especiais..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <ImageUploadField
            label="Foto de Capa (Opcional)"
            placeholder="Cole uma URL ou envie um arquivo"
            value={formData.coverImageUrl}
            onChange={(url) => setFormData({ ...formData, coverImageUrl: url })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Data de Início"
              type="datetime-local"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
            <Input
              label="Data de Sorteio"
              type="datetime-local"
              value={formData.drawDate}
              onChange={(e) => setFormData({ ...formData, drawDate: e.target.value })}
            />
          </div>

          <p className="text-[11px] text-cyber-muted -mt-2 px-1">
            "Data de Sorteio" é só um horário de referência único. Pra agendar vários horários de sorteio (um por
            rodada) use o botão "Horários" no card da campanha, depois de salvá-la.
          </p>

          <div className="flex justify-end gap-3 mt-4 border-t border-cyber-border/40 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsFormOpen(false)}
              disabled={isActionLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isActionLoading}
            >
              Salvar Campanha
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirmar Exclusão"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-cyber-danger/10 border border-cyber-danger/30 rounded text-cyber-danger text-xs font-rajdhani font-bold tracking-wider uppercase">
            <AlertTriangle size={20} className="shrink-0" />
            <span>ALERTA: ESTA AÇÃO NÃO PODE SER DESFEITA!</span>
          </div>

          <p className="text-sm font-inter text-cyber-text">
            Você tem certeza de que deseja deletar permanentemente a campanha{' '}
            <strong className="text-white font-semibold">"{campaignToDelete?.name}"</strong>? 
            Esta operação apagará todos os dados, missões, prêmios e cupons associados a esta campanha.
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t border-cyber-border/40">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsDeleteOpen(false)}
              disabled={isActionLoading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={isActionLoading}
              onClick={handleDeleteConfirm}
            >
              Excluir Definitivamente
            </Button>
          </div>
        </div>
      </Modal>

      {/* Finish Confirmation Modal (exige senha do admin) */}
      <Modal
        isOpen={isFinishOpen}
        onClose={() => setIsFinishOpen(false)}
        title="Encerrar Campanha"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-cyber-accent/10 border border-cyber-accent/30 rounded text-cyber-accent text-xs font-rajdhani font-bold tracking-wider uppercase">
            <AlertTriangle size={20} className="shrink-0" />
            <span>ESTA AÇÃO NÃO PODE SER DESFEITA</span>
          </div>

          <p className="text-sm font-inter text-cyber-text">
            Encerrar <strong className="text-white font-semibold">"{campaignToFinish?.name}"</strong> impede
            novos cupons e participações. Digite sua senha para confirmar.
          </p>

          <Input
            label="Sua Senha"
            type="password"
            value={finishPassword}
            onChange={(e) => setFinishPassword(e.target.value)}
            error={finishError || undefined}
            autoFocus
            required
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-cyber-border/40">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsFinishOpen(false)}
              disabled={isActionLoading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="accent"
              isLoading={isActionLoading}
              disabled={!finishPassword}
              onClick={handleFinishConfirm}
            >
              Confirmar Encerramento
            </Button>
          </div>
        </div>
      </Modal>

      {/* Horários de Sorteio Modal */}
      <Modal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        title={`Horários de Sorteio — ${scheduleCampaign?.name ?? ''}`}
        size="md"
      >
        <div className="space-y-5">
          <p className="text-xs text-cyber-muted leading-relaxed">
            Defina quando cada sorteio deve acontecer. Isso só agenda o horário mostrado pro participante — o que
            será sorteado (prêmio, avulso ou em cadeia) continua sendo configurado por você na tela de Controle de
            Sorteio, na hora de executar.
          </p>

          {scheduleError && (
            <div className="p-3 bg-cyber-danger/10 border border-cyber-danger/30 text-cyber-danger text-xs font-rajdhani font-bold uppercase rounded tracking-wider">
              ⚠ {scheduleError}
            </div>
          )}

          {/* Formulário de adicionar/editar */}
          <form onSubmit={handleSubmitSchedule} className="flex flex-col gap-3 p-3 border border-cyber-border/60 rounded-lg bg-black/20">
            <span className="text-[10px] font-mono text-cyber-secondary uppercase tracking-widest">
              {editingScheduleId ? 'Editando horário' : 'Novo horário'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Data e Hora"
                type="datetime-local"
                value={scheduleForm.scheduledAt}
                onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledAt: e.target.value })}
                required
              />
              <Input
                label="Nota (Opcional)"
                placeholder="Ex: Prêmio principal"
                value={scheduleForm.label}
                onChange={(e) => setScheduleForm({ ...scheduleForm, label: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              {editingScheduleId && (
                <Button type="button" variant="secondary" size="sm" onClick={handleCancelScheduleEdit} disabled={isScheduleActionLoading}>
                  Cancelar Edição
                </Button>
              )}
              <Button type="submit" variant="primary" size="sm" isLoading={isScheduleActionLoading} disabled={!scheduleForm.scheduledAt}>
                {editingScheduleId ? 'Salvar Alterações' : 'Adicionar Horário'}
              </Button>
            </div>
          </form>

          {/* Lista de horários já agendados */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-rajdhani font-bold text-cyber-text uppercase tracking-wider px-1">
              Horários agendados ({schedules.length})
            </span>
            {isLoadingSchedules ? (
              <div className="text-center py-6 text-cyber-muted font-mono text-xs flex items-center justify-center gap-2">
                <RefreshCw size={14} className="animate-spin" /> CARREGANDO...
              </div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-6 text-cyber-muted font-mono text-xs">
                NENHUM HORÁRIO AGENDADO AINDA.
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                {schedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 rounded bg-black/25 border border-cyber-border/50"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-rajdhani font-bold text-white flex items-center gap-1.5">
                        <Clock size={12} className="text-cyber-secondary shrink-0" />
                        {new Date(schedule.scheduledAt).toLocaleString('pt-BR')}
                      </div>
                      {schedule.label && (
                        <div className="text-[10px] text-cyber-muted mt-0.5 truncate">{schedule.label}</div>
                      )}
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditScheduleClick(schedule)}
                        disabled={isScheduleActionLoading}
                        className="p-1.5 rounded text-cyber-muted hover:text-cyber-primary hover:bg-cyber-primary/10 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSchedule(schedule)}
                        disabled={isScheduleActionLoading}
                        className="p-1.5 rounded text-cyber-muted hover:text-cyber-danger hover:bg-cyber-danger/10 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2 border-t border-cyber-border/40">
            <Button type="button" variant="secondary" onClick={() => setIsScheduleOpen(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CampaignsPage;
