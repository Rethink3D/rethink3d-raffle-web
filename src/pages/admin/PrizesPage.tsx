import React, { useEffect, useState } from 'react';
import { campaignService } from '../../services/campaign.service';
import { prizeService } from '../../services/prize.service';
import type { Campaign, Prize } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { 
  Plus, Edit2, Trash2, Gift, Image, 
  AlertTriangle, RefreshCw 
} from 'lucide-react';

export const PrizesPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  
  const [prizes, setPrizes] = useState<Prize[]>([]);
  
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);
  const [isLoadingPrizes, setIsLoadingPrizes] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: 1,
    imageUrl: '',
  });

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [prizeToDelete, setPrizeToDelete] = useState<Prize | null>(null);

  // Load campaigns
  const loadCampaigns = async () => {
    try {
      setIsLoadingCampaigns(true);
      setError(null);
      const list = await campaignService.getCampaigns();
      setCampaigns(list);
      
      const active = list.find(c => c.status === 'ACTIVE' || c.status === 'DRAWING');
      if (active) {
        setSelectedCampaignId(active.id);
      } else if (list.length > 0) {
        setSelectedCampaignId(list[0].id);
      } else {
        setSelectedCampaignId('');
        setPrizes([]);
      }
    } catch (err) {
      console.error('Failed to load campaigns:', err);
      setError('Falha ao carregar campanhas para gerenciamento de prêmios.');
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  // Load prizes for selected campaign
  const loadPrizes = async (campaignId: string) => {
    if (!campaignId) return;
    try {
      setIsLoadingPrizes(true);
      setError(null);
      const list = await prizeService.getCampaignPrizes(campaignId);
      setPrizes(list);
    } catch (err) {
      console.error('Failed to load prizes:', err);
      setPrizes([]);
      setError('Erro ao buscar prêmios da campanha.');
    } finally {
      setIsLoadingPrizes(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  useEffect(() => {
    if (selectedCampaignId) {
      loadPrizes(selectedCampaignId);
    } else {
      setPrizes([]);
    }
  }, [selectedCampaignId]);

  const handleOpenCreate = () => {
    setEditingPrize(null);
    setFormData({
      name: '',
      description: '',
      quantity: 1,
      imageUrl: '',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (prize: Prize) => {
    setEditingPrize(prize);
    setFormData({
      name: prize.name,
      description: prize.description || '',
      quantity: prize.quantity,
      imageUrl: prize.imageUrl || '',
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaignId || !formData.name) return;

    setIsActionLoading(true);
    setError(null);
    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        quantity: Number(formData.quantity),
        imageUrl: formData.imageUrl || null,
      };

      if (editingPrize) {
        await prizeService.updatePrize(selectedCampaignId, editingPrize.id, payload);
      } else {
        await prizeService.createPrize(selectedCampaignId, payload);
      }
      setIsFormOpen(false);
      loadPrizes(selectedCampaignId);
    } catch (err: any) {
      console.error('Prize form error:', err);
      setError('Erro ao salvar configurações do prêmio.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleOpenDelete = (prize: Prize) => {
    setPrizeToDelete(prize);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCampaignId || !prizeToDelete) return;
    setIsActionLoading(true);
    try {
      await prizeService.deletePrize(selectedCampaignId, prizeToDelete.id);
      setIsDeleteOpen(false);
      loadPrizes(selectedCampaignId);
    } catch (err) {
      console.error('Failed to delete prize:', err);
      setError('Erro ao excluir prêmio do banco.');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-inter">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-cyber-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-orbitron font-extrabold text-white tracking-widest uppercase">
            GESTOR DE PRÊMIOS
          </h1>
          <p className="text-xs font-rajdhani font-bold text-cyber-secondary tracking-widest mt-1">
            // CADASTRO E CONTROLE DOS PRÊMIOS DA CAMPANHA
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="primary" 
            size="sm" 
            icon={<Plus size={14} />} 
            onClick={handleOpenCreate}
            disabled={!selectedCampaignId}
          >
            Adicionar Prêmio
          </Button>
          <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={() => loadCampaigns()}>
            Recarregar
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-cyber-danger/10 border border-cyber-danger/30 text-cyber-danger text-xs font-rajdhani font-bold uppercase rounded tracking-wider">
          ⚠ TERMINAL_ERR // {error}
        </div>
      )}

      {/* Select Campaign Filter */}
      <Card variant="default">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-orbitron font-bold text-white tracking-wider uppercase">
              CAMPANHA ATIVA
            </h3>
            <p className="text-[10px] font-mono text-cyber-muted uppercase mt-0.5">
              Selecione a campanha para visualizar e gerenciar os prêmios disponíveis
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
        </div>
      </Card>

      {/* Prizes Listing */}
      {isLoadingPrizes ? (
        <div className="flex flex-col items-center justify-center p-20 text-cyber-muted font-mono space-y-4">
          <RefreshCw size={24} className="animate-spin text-cyber-primary" />
          <span>SYS_LOADING // CARREGANDO PRÊMIOS DA CAMPANHA...</span>
        </div>
      ) : !selectedCampaignId ? (
        <Card variant="default">
          <div className="text-center py-10 font-mono text-cyber-muted">
            SELECIONE OU CRIE UMA CAMPANHA PRIMEIRO PARA GERENCIAR PRÊMIOS.
          </div>
        </Card>
      ) : prizes.length === 0 ? (
        <Card variant="default">
          <div className="text-center py-10 font-mono text-cyber-muted">
            [SISTEMA VAZIO] NENHUM PRÊMIO CONTEXTUALIZADO NESTA CAMPANHA. ADICIONE UM PRÊMIO PARA SORTEAR.
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {prizes.map((prize) => (
            <Card
              key={prize.id}
              variant="default"
              title={prize.name}
              subtitle={`QUANTIDADE: ${prize.quantity} UN`}
              headerExtra={
                <div className="p-1 rounded bg-cyber-secondary/15 text-cyber-secondary border border-cyber-secondary/30">
                  <Gift size={16} />
                </div>
              }
            >
              <div className="flex flex-col gap-4 mt-2">
                {/* Image Container */}
                <div className="aspect-video relative rounded-md border border-cyber-border overflow-hidden bg-black/55 flex items-center justify-center">
                  {prize.imageUrl ? (
                    <img 
                      src={prize.imageUrl} 
                      alt={prize.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback on error
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-cyber-muted font-mono text-xs gap-2 select-none">
                      <Image size={24} />
                      <span>Sem Imagem Definida</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-cyber-text/80 line-clamp-3 min-h-[48px] font-inter">
                  {prize.description || 'Nenhuma descrição detalhada deste prêmio.'}
                </p>

                <div className="flex justify-between items-center border-t border-cyber-border/40 pt-3 text-[11px] font-mono text-cyber-muted">
                  <span>QTD EM ESTOQUE: <strong className="text-white font-bold">{prize.quantity}</strong></span>
                  <span className="truncate max-w-[150px] lowercase text-[9px]">ID: {prize.id}</span>
                </div>

                <div className="flex gap-2 justify-end pt-2 border-t border-cyber-border/20">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Edit2 size={13} />}
                    onClick={() => handleOpenEdit(prize)}
                    disabled={isActionLoading}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={<Trash2 size={13} />}
                    onClick={() => handleOpenDelete(prize)}
                    disabled={isActionLoading}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingPrize ? 'Editar Prêmio' : 'Cadastrar Novo Prêmio'}
        size="md"
      >
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          <Input
            label="Nome do Prêmio"
            placeholder="Ex: Impressora 3D Creality Ender 3"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            statusIndicator="[STR_NAME]"
          />

          <div className="flex flex-col gap-1.5 font-inter">
            <label className="text-xs font-rajdhani font-bold tracking-wider text-cyber-text uppercase px-1">
              Descrição / Características
            </label>
            <textarea
              className="w-full bg-cyber-bg border border-cyber-border rounded px-4 py-2.5 text-sm font-rajdhani font-semibold text-white tracking-wide placeholder-cyber-muted focus:border-cyber-secondary focus:ring-1 focus:ring-cyber-secondary focus:outline-none"
              rows={3}
              placeholder="Descreva detalhes como cor, voltagem, marca, etc."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <Input
                label="Quantidade"
                type="number"
                min={1}
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                required
                statusIndicator="[NUM_QTY]"
              />
            </div>
            <div className="sm:col-span-2">
              <Input
                label="URL da Imagem do Prêmio (Opcional)"
                placeholder="Ex: https://imgur.com/premio.png"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                statusIndicator="[URL_IMG]"
              />
            </div>
          </div>

          {/* Simple Image URL Preview */}
          {formData.imageUrl && (
            <div className="rounded border border-cyber-border p-2 bg-black/45 flex flex-col gap-2">
              <span className="text-[10px] font-mono text-cyber-muted uppercase tracking-wider">Pré-visualização do Link:</span>
              <img 
                src={formData.imageUrl} 
                alt="Preview" 
                className="max-h-40 object-contain rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/400x200?text=Link+Invalido';
                }}
              />
            </div>
          )}

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
              Salvar Prêmio
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirmar Exclusão de Prêmio"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-cyber-danger/10 border border-cyber-danger/30 rounded text-cyber-danger text-xs font-rajdhani font-bold tracking-wider uppercase">
            <AlertTriangle size={20} className="shrink-0" />
            <span>ALERTA DE SEGURANÇA</span>
          </div>

          <p className="text-sm font-inter text-cyber-text">
            Você tem certeza de que deseja excluir permanentemente o prêmio{' '}
            <strong className="text-white font-semibold">"{prizeToDelete?.name}"</strong>?
            Esta ação removerá todos os registros e pode causar conflitos se houver sorteios programados para este item.
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
              Confirmar Exclusão
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PrizesPage;
