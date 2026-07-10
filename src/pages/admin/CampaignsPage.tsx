import React, { useEffect, useState } from 'react';
import { campaignService } from '../../services/campaign.service';
import type { Campaign } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { 
  Edit2, Trash2, Calendar, 
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
    startDate: '',
    drawDate: '',
  });

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);

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
    if (!window.confirm('Deseja ativar esta campanha? Isso a tornará elegível para participação.')) return;
    setIsActionLoading(true);
    try {
      await campaignService.activateCampaign(id);
      loadCampaigns();
    } catch (err: any) {
      console.error('Activation error:', err);
      setError('Falha ao ativar campanha.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleFinish = async (id: string) => {
    if (!window.confirm('Deseja encerrar esta campanha? Esta operação impede novos tickets e participações.')) return;
    setIsActionLoading(true);
    try {
      await campaignService.finishCampaign(id);
      loadCampaigns();
    } catch (err: any) {
      console.error('Finish error:', err);
      setError('Falha ao encerrar campanha.');
    } finally {
      setIsActionLoading(false);
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
            // LISTA E CONFIGURAÇÃO DOS EVENTOS DE SORTEIO RETHINK3D
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
          ⚠ TERMINAL_ERR // {error}
        </div>
      )}

      {/* Campaigns Listing */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-20 text-cyber-muted font-mono space-y-4">
          <RefreshCw size={24} className="animate-spin text-cyber-primary" />
          <span>SYS_LOADING // BUSCANDO BANCO DE DADOS...</span>
        </div>
      ) : campaigns.length === 0 ? (
        <Card variant="default">
          <div className="text-center py-10 font-mono text-cyber-muted">
            [SISTEMA LIMPO] NENHUMA CAMPANHA CADASTRADA NO MOMENTO. CLIQUE EM "CRIAR CAMPANHA" PARA INICIAR.
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
                subtitle={`STATUS: ${campaign.status}`}
                headerExtra={
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                    isActive ? 'bg-cyber-success/10 border-cyber-success text-cyber-success' :
                    isDrawing ? 'bg-cyber-accent/10 border-cyber-accent text-cyber-accent animate-pulse' :
                    isFinished ? 'bg-cyber-muted/10 border-cyber-muted text-cyber-muted' :
                    'bg-cyber-primary/10 border-cyber-primary text-cyber-primary'
                  }`}>
                    {campaign.status}
                  </span>
                }
              >
                <div className="flex flex-col h-full gap-4 mt-2">
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
                        onClick={() => handleFinish(campaign.id)}
                        disabled={isActionLoading}
                      >
                        Encerrar
                      </Button>
                    )}

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
            statusIndicator="[STR_NAME]"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Data de Início"
              type="datetime-local"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              statusIndicator="[SYS_START_DATE]"
            />
            <Input
              label="Data de Sorteio"
              type="datetime-local"
              value={formData.drawDate}
              onChange={(e) => setFormData({ ...formData, drawDate: e.target.value })}
              statusIndicator="[SYS_DRAW_DATE]"
            />
          </div>

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
    </div>
  );
};

export default CampaignsPage;
