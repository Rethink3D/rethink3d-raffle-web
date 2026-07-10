import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/admin.service';
import { campaignService } from '../../services/campaign.service';
import type { Campaign, User, MissionProof } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { 
  Key, Image, Search, ShieldAlert, 
  ExternalLink, Calendar, Phone, Mail, RefreshCw, Globe 
} from 'lucide-react';

export const ParticipantsPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  
  const [participants, setParticipants] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [tempPin, setTempPin] = useState<string | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [selectedUserForPin, setSelectedUserForPin] = useState<User | null>(null);

  const [proofs, setProofs] = useState<MissionProof[]>([]);
  const [isProofsModalOpen, setIsProofsModalOpen] = useState(false);
  const [selectedUserForProofs, setSelectedUserForProofs] = useState<User | null>(null);
  const [isLoadingProofs, setIsLoadingProofs] = useState(false);

  // Load campaigns first
  const loadCampaigns = async () => {
    try {
      setIsLoadingCampaigns(true);
      const list = await campaignService.getCampaigns();
      setCampaigns(list);
      
      const active = list.find(c => c.status === 'ACTIVE' || c.status === 'DRAWING');
      if (active) {
        setSelectedCampaignId(active.id);
      } else if (list.length > 0) {
        setSelectedCampaignId(list[0].id);
      } else {
        // No campaigns in database, fetch participants globally
        setSelectedCampaignId('');
        loadParticipants('');
      }
    } catch (err) {
      console.error('Failed to load campaigns:', err);
      setError('Erro ao carregar campanhas para filtragem.');
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  const loadParticipants = async (campaignId?: string) => {
    try {
      setIsLoadingParticipants(true);
      setError(null);
      const list = await adminService.getParticipants(campaignId || undefined);
      setParticipants(list);
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

  useEffect(() => {
    // Whenever campaign filter changes, reload list
    loadParticipants(selectedCampaignId);
  }, [selectedCampaignId]);

  const handleResetPin = async (user: User) => {
    if (!window.confirm(`Deseja resetar o PIN de acesso de ${user.name}?`)) return;
    
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

  const handleViewProofs = async (user: User) => {
    setSelectedUserForProofs(user);
    setIsProofsModalOpen(true);
    setIsLoadingProofs(true);
    setProofs([]);
    
    try {
      const data = await adminService.getParticipantProofs(user.id);
      setProofs(data);
    } catch (err) {
      console.error('Failed to load participant proofs:', err);
      setError('Erro ao obter os comprovantes de impressão deste participante.');
    } finally {
      setIsLoadingProofs(false);
    }
  };

  // Client side search logic
  const filteredParticipants = participants.filter((user) => {
    const q = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(q) ||
      user.phone.includes(q) ||
      (user.email && user.email.toLowerCase().includes(q)) ||
      (user.instagram && user.instagram.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 font-inter">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-cyber-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-orbitron font-extrabold text-white tracking-widest uppercase">
            AUDITORIA DE PARTICIPANTES
          </h1>
          <p className="text-xs font-rajdhani font-bold text-cyber-secondary tracking-widest mt-1">
            // LISTAGEM, CONSULTA DE IMPRESSÕES E RESET DE CREDENCIAIS
          </p>
        </div>
        <div>
          <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={() => loadParticipants(selectedCampaignId)}>
            Sincronizar Lista
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-cyber-danger/10 border border-cyber-danger/30 text-cyber-danger text-xs font-rajdhani font-bold uppercase rounded tracking-wider">
          ⚠ TERMINAL_ERR // {error}
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
                  {c.name} ({c.status})
                </option>
              ))}
            </select>
          </div>
        </Card>

        {/* Client side Search Bar */}
        <Card variant="default" className="md:col-span-2">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-rajdhani font-bold text-cyber-muted uppercase tracking-wider">
              Pesquisar Registros
            </label>
            <Input
              placeholder="Pesquise por nome, telefone, email ou instagram..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search size={16} className="text-cyber-muted" />}
              statusIndicator="[SYS_QUERY]"
            />
          </div>
        </Card>
      </div>

      {/* Participants Table */}
      {isLoadingParticipants ? (
        <div className="flex flex-col items-center justify-center p-20 text-cyber-muted font-mono space-y-4">
          <RefreshCw size={24} className="animate-spin text-cyber-primary" />
          <span>SYS_LOADING // CARREGANDO BASE DE DADOS DOS USUÁRIOS...</span>
        </div>
      ) : filteredParticipants.length === 0 ? (
        <Card variant="default">
          <div className="text-center py-10 font-mono text-cyber-muted">
            [SISTEMA VAZIO] NENHUM PARTICIPANTE LOCALIZADO COM OS FILTROS SELECIONADOS.
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
                {filteredParticipants.map((user) => (
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
                        {(user as any).tickets ?? 0}
                      </td>
                    )}
                    <td className="p-4 text-center">
                      {user.mustChangePinOnNextLogin ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyber-accent/15 border border-cyber-accent/40 text-cyber-accent">
                          EXPIRADO (PENDENTE)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyber-success/15 border border-cyber-success/40 text-cyber-success">
                          DEFINIDO (SEGURO)
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
                          Prints
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

      {/* View Prints Gallery Modal */}
      <Modal
        isOpen={isProofsModalOpen}
        onClose={() => setIsProofsModalOpen(false)}
        title={`Comprovantes de ${selectedUserForProofs?.name || 'Participante'}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="text-xs font-mono text-cyber-muted pb-3 border-b border-cyber-border/40">
            Comprovantes de impressão 3D enviados para validação de recompensas S3.
          </div>

          {isLoadingProofs ? (
            <div className="flex flex-col items-center justify-center p-12 text-cyber-muted font-mono space-y-3">
              <RefreshCw size={20} className="animate-spin text-cyber-primary" />
              <span>SYS_DECRYPT // CARREGANDO ASSINATURAS S3 SECURE...</span>
            </div>
          ) : proofs.length === 0 ? (
            <div className="text-center py-10 font-mono text-cyber-muted bg-black/25 rounded border border-cyber-border/40">
              NENHUM PROJETO OU COMPROVANTE FOI ENVIADO POR ESTE USUÁRIO AINDA.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {proofs.map((proof) => (
                <div 
                  key={proof.id}
                  className="border border-cyber-border/80 bg-black/35 rounded overflow-hidden flex flex-col group hover:border-cyber-primary/60 transition-all duration-300"
                >
                  {/* Photo container */}
                  <div className="aspect-video relative overflow-hidden bg-black/60 flex items-center justify-center border-b border-cyber-border/60">
                    {proof.mimeType.startsWith('image/') ? (
                      <img 
                        src={(proof as any).signedUrl} 
                        alt={proof.mission?.title || 'Print Upload'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="p-4 text-center font-mono text-xs text-cyber-muted">
                        Arquivo: {proof.mimeType}
                      </div>
                    )}
                    <a 
                      href={(proof as any).signedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute top-2 right-2 p-1.5 rounded bg-black/70 border border-cyber-border hover:border-cyber-secondary text-white transition-colors cursor-pointer"
                      title="Abrir imagem original"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>

                  {/* Meta details */}
                  <div className="p-3 space-y-1.5 text-[11px] font-rajdhani font-semibold text-cyber-muted">
                    <div className="text-white font-bold truncate text-xs">
                      {proof.mission?.title || 'Missão Desconhecida'}
                    </div>
                    <div className="flex justify-between font-mono text-[9px]">
                      <span>FORMATO: {proof.mimeType.replace('image/', '').toUpperCase()}</span>
                      <span>TAMANHO: {(proof.fileSize / 1024).toFixed(1)} KB</span>
                    </div>
                    <div className="flex justify-between items-center pt-1.5 border-t border-cyber-border/30">
                      <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(proof.uploadedAt).toLocaleDateString('pt-BR')}</span>
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-cyber-success/15 border border-cyber-success/40 text-cyber-success">
                        {proof.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-cyber-border/40">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsProofsModalOpen(false)}
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
