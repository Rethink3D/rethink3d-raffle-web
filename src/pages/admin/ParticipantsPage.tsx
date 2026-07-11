import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService, type AdminParticipant } from '../../services/admin.service';
import { campaignService } from '../../services/campaign.service';
import { getCampaignStatusLabel } from '../../utils/campaignStatus';
import { confirmDialog } from '../../utils/confirm';
import type { Campaign } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import {
  Key, Image, Search, ShieldAlert, ChevronLeft, ChevronRight,
  ExternalLink, Phone, Mail, RefreshCw, Globe
} from 'lucide-react';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 400;

export const ParticipantsPage: React.FC = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');

  const [participants, setParticipants] = useState<AdminParticipant[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [tempPin, setTempPin] = useState<string | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [selectedUserForPin, setSelectedUserForPin] = useState<AdminParticipant | null>(null);

  // Load campaigns first
  const loadCampaigns = async () => {
    try {
      setIsLoadingCampaigns(true);
      const list = await campaignService.getCampaigns();
      setCampaigns(list);
      
      const active = list.find(c => c.status === 'ACTIVE' || c.status === 'DRAWING' || c.status === 'PAUSED');
      if (active) {
        setSelectedCampaignId(active.id);
      } else if (list.length > 0) {
        setSelectedCampaignId(list[0].id);
      } else {
        // No campaigns in database, fetch participants globally
        setSelectedCampaignId('');
      }
    } catch (err) {
      console.error('Failed to load campaigns:', err);
      setError('Erro ao carregar campanhas para filtragem.');
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  const loadParticipants = async (campaignId: string, search: string, targetPage: number) => {
    try {
      setIsLoadingParticipants(true);
      setError(null);
      const result = await adminService.getParticipants({
        campaignId: campaignId || undefined,
        search: search || undefined,
        page: targetPage,
        pageSize: PAGE_SIZE,
      });
      setParticipants(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err: any) {
      console.error('Failed to load participants:', err);
      setError('Falha ao obter lista de participantes.');
    } finally {
      setIsLoadingParticipants(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  // Debounce: só dispara a busca ao backend 400ms após o usuário parar de digitar,
  // evitando uma requisição a cada tecla pressionada.
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  // Campanha ou busca mudou: volta para a página 1
  useEffect(() => {
    setPage(1);
  }, [selectedCampaignId, debouncedSearch]);

  useEffect(() => {
    loadParticipants(selectedCampaignId, debouncedSearch, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampaignId, debouncedSearch, page]);

  const handleResetPin = async (user: AdminParticipant) => {
    const confirmed = await confirmDialog(`Deseja resetar o PIN de acesso de ${user.name}?`, {
      title: 'Resetar PIN',
      confirmLabel: 'Resetar PIN',
      variant: 'primary',
    });
    if (!confirmed) return;

    setIsActionLoading(true);
    setError(null);
    try {
      const pin = await adminService.resetPin(user.id);
      setSelectedUserForPin(user);
      setTempPin(pin);
      setIsPinModalOpen(true);
      
      // Update local array user state
      setParticipants(prev => prev.map(u => u.id === user.id ? { ...u, mustChangePinOnNextLogin: true } : u));
    } catch (err) {
      console.error('Failed to reset pin:', err);
      setError('Falha ao redefinir PIN do participante.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleViewProofs = (user: AdminParticipant) => {
    navigate(`/admin/participants/${user.id}/proofs`, { state: { participantName: user.name } });
  };

  return (
    <div className="space-y-6 font-inter">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-cyber-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-orbitron font-extrabold text-white tracking-widest uppercase">
            PARTICIPANTES
          </h1>
          <p className="text-xs font-rajdhani font-bold text-cyber-secondary tracking-widest mt-1">
            Listagem, consulta de comprovantes e redefinição de PIN
          </p>
        </div>
        <div>
          <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={() => loadParticipants(selectedCampaignId, debouncedSearch, page)}>
            Sincronizar Lista
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-cyber-danger/10 border border-cyber-danger/30 text-cyber-danger text-xs font-rajdhani font-bold uppercase rounded tracking-wider">
          ⚠ {error}
        </div>
      )}

      {/* Filter and Search controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Campaign Filter */}
        <Card variant="default" className="md:col-span-1">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-rajdhani font-bold text-cyber-muted uppercase tracking-wider">
              Filtrar por Campanha (Visualiza Tickets)
            </label>
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="w-full bg-cyber-bg border border-cyber-border rounded px-3 py-2 text-sm font-rajdhani font-bold text-white tracking-wide focus:border-cyber-secondary focus:outline-none"
              disabled={isLoadingCampaigns}
            >
              <option value="">-- Todos (Geral, Sem dados de cupons) --</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({getCampaignStatusLabel(c.status)})
                </option>
              ))}
            </select>
          </div>
        </Card>

        {/* Search Bar (server-side, com debounce) */}
        <Card variant="default" className="md:col-span-2">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-rajdhani font-bold text-cyber-muted uppercase tracking-wider">
              Pesquisar Registros
            </label>
            <Input
              placeholder="Pesquise por nome, telefone, email ou instagram..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              icon={<Search size={16} className="text-cyber-muted" />}
            />
          </div>
        </Card>
      </div>

      {/* Participants Table */}
      {isLoadingParticipants ? (
        <div className="flex flex-col items-center justify-center p-20 text-cyber-muted font-mono space-y-4">
          <RefreshCw size={24} className="animate-spin text-cyber-primary" />
          <span>CARREGANDO PARTICIPANTES...</span>
        </div>
      ) : participants.length === 0 ? (
        <Card variant="default">
          <div className="text-center py-10 font-mono text-cyber-muted">
            NENHUM PARTICIPANTE ENCONTRADO COM OS FILTROS SELECIONADOS.
          </div>
        </Card>
      ) : (
        <div className="border border-cyber-border bg-cyber-surface/60 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-cyber-border bg-black/45 text-[11px] font-mono tracking-wider text-cyber-muted uppercase select-none">
                  <th className="p-4 font-normal">Participante</th>
                  <th className="p-4 font-normal">Contatos</th>
                  <th className="p-4 font-normal">Mídias</th>
                  {selectedCampaignId && <th className="p-4 font-normal text-center">Cupons</th>}
                  <th className="p-4 font-normal text-center">PIN Estado</th>
                  <th className="p-4 font-normal text-right w-64">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-border/40 text-xs font-rajdhani font-bold text-white tracking-wider">
                {participants.map((user) => (
                  <tr key={user.id} className="hover:bg-cyber-surface/30 transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{user.name}</span>
                        <span className="text-[9px] text-cyber-muted font-mono mt-0.5 lowercase">ID: {user.id}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 text-[11px] font-mono text-cyber-text/80">
                        <span className="flex items-center gap-1.5"><Phone size={11} className="text-cyber-muted" /> {user.phone}</span>
                        {user.email && <span className="flex items-center gap-1.5"><Mail size={11} className="text-cyber-muted" /> {user.email}</span>}
                      </div>
                    </td>
                    <td className="p-4 font-mono text-[11px] text-cyber-text/80">
                      {user.instagram ? (
                        <a 
                          href={`https://instagram.com/${user.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-cyber-secondary hover:underline"
                        >
                          <Globe size={11} /> {user.instagram} <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span className="text-cyber-muted">Sem Instagram</span>
                      )}
                    </td>
                    {selectedCampaignId && (
                      <td className="p-4 text-center font-mono text-cyber-secondary text-sm">
                        {user.tickets ?? 0}
                      </td>
                    )}
                    <td className="p-4 text-center">
                      {user.mustChangePinOnNextLogin ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyber-accent/15 border border-cyber-accent/40 text-cyber-accent">
                          TROCA PENDENTE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyber-success/15 border border-cyber-success/40 text-cyber-success">
                          PIN DEFINIDO
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Image size={13} />}
                          onClick={() => handleViewProofs(user)}
                        >
                          Fotos
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={<Key size={13} />}
                          onClick={() => handleResetPin(user)}
                          disabled={isActionLoading}
                        >
                          Reset PIN
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-cyber-border/40 px-4 py-3">
            <span className="text-[11px] font-mono text-cyber-muted uppercase tracking-wider">
              {total} participante{total === 1 ? '' : 's'} · página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<ChevronLeft size={14} />}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isLoadingParticipants}
              >
                Anterior
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isLoadingParticipants}
              >
                <span className="flex items-center gap-2">
                  Próxima
                  <ChevronRight size={14} />
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reset PIN Result Popup Modal */}
      <Modal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        title="PIN Redefinido com Sucesso"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-cyber-accent/10 border border-cyber-accent/30 rounded text-cyber-accent text-xs font-rajdhani font-bold tracking-wider uppercase">
            <ShieldAlert size={20} className="shrink-0" />
            <span>NOVO PIN DE ACESSO GERADO</span>
          </div>

          <p className="text-sm font-inter text-cyber-text">
            O PIN de acesso do participante <strong className="text-white">{selectedUserForPin?.name}</strong> foi redefinido.
          </p>

          <div className="bg-black/45 border border-cyber-border rounded-lg p-5 text-center my-4 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none bg-cyber-grid opacity-10" />
            <span className="text-[10px] font-mono text-cyber-muted block mb-1 uppercase tracking-widest">PIN TEMPORÁRIO</span>
            <span className="text-3xl font-orbitron font-extrabold tracking-widest text-cyber-secondary text-glow-secondary select-all px-2">
              {tempPin}
            </span>
          </div>

          <p className="text-xs font-inter text-cyber-muted leading-relaxed">
            Compartilhe este PIN temporário com o participante. Por motivos de segurança, o sistema exigirá que o usuário modifique este código em seu próximo login.
          </p>

          <div className="flex justify-end pt-4 border-t border-cyber-border/40">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsPinModalOpen(false)}
            >
              Fechar
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default ParticipantsPage;
