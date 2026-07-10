import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Lock, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';
import { campaignService } from '../../services/campaign.service';
import { questService } from '../../services/quest.service';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { QuestCard } from '../../components/quest/QuestCard';
import { PrintUpload } from '../../components/quest/PrintUpload';
import type { Campaign, Mission } from '../../types';

export const QuestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [quests, setQuests] = useState<Mission[]>([]);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const campaign = await campaignService.getActiveCampaign();
      if (campaign) {
        setActiveCampaign(campaign);
        const campaignQuests = await questService.getCampaignQuests(campaign.id);
        setQuests(campaignQuests);
      } else {
        setActiveCampaign(null);
        setQuests([]);
      }
    } catch (err: any) {
      console.error('Error fetching campaign quests:', err);
      if (err?.response?.status === 404) {
        setActiveCampaign(null);
      } else {
        setError('Falha ao carregar as missões da campanha da grade do sistema.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuests();
  }, []);

  const handleQuestAction = (mission: Mission) => {
    if (!activeCampaign) return;
    
    // Determine path based on quest type
    if (mission.type === 'QUIZ') {
      navigate(`/quiz/${activeCampaign.id}`);
    } else if (mission.type === 'FEEDBACK_FORM') {
      navigate(`/feedback/${activeCampaign.id}`);
    } else if (mission.type === 'PROOF_UPLOAD') {
      setSelectedMission(mission);
      setIsUploadModalOpen(true);
    }
  };

  const handleUploadSubmit = async (file: File) => {
    if (!selectedMission || !activeCampaign) return;
    try {
      await questService.uploadProof(selectedMission.id, file);
      // Refresh the quests to show status as PENDING
      const campaignQuests = await questService.getCampaignQuests(activeCampaign.id);
      setQuests(campaignQuests);
    } catch (err) {
      console.error('Failed upload proof submission:', err);
      throw err;
    }
  };

  const handleModalClose = () => {
    setIsUploadModalOpen(false);
    setSelectedMission(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] font-mono select-none">
        <div className="text-cyber-secondary animate-pulse text-lg font-bold tracking-widest">
          [SYS_ANALISANDO_MISSÕES...]
        </div>
        <div className="w-56 h-1 bg-cyber-border rounded overflow-hidden mt-4">
          <div className="h-full bg-cyber-secondary animate-pulse-glow" style={{ width: '50%' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-10 select-none">
        <Card variant="danger" title="ERRO DE RECUPERAÇÃO DE DADOS" glow>
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertTriangle size={48} className="text-cyber-danger" />
            <p className="text-sm font-rajdhani font-bold text-white tracking-wider">
              {error}
            </p>
            <button
              onClick={fetchQuests}
              className="px-4 py-2 bg-cyber-danger/25 border border-cyber-danger text-white rounded font-orbitron uppercase text-xs tracking-wider cursor-pointer"
            >
              Atualizar Sistema
            </button>
          </div>
        </Card>
      </div>
    );
  }

  if (!activeCampaign) {
    return (
      <div className="max-w-xl mx-auto my-10 select-none">
        <Card variant="default" title="R3D_CONTROLE_DE_MISSÕES" glow>
          <div className="flex flex-col items-center gap-6 text-center py-4">
            <div className="w-16 h-16 rounded border border-cyber-border flex items-center justify-center bg-cyber-border/10">
              <Target size={28} className="text-cyber-muted" />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-orbitron font-extrabold text-white tracking-widest uppercase">
                NENHUMA MISSÃO ATIVA
              </h3>
              <p className="text-xs font-mono text-cyber-muted uppercase tracking-wider">
                BANCO_DE_DADOS // OFFLINE
              </p>
              <p className="text-xs text-cyber-muted mt-2 leading-relaxed max-w-sm">
                A Rethink3D não tem campanhas ou missões ativas disponíveis no momento. Por favor, consulte novamente mais tarde.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Quests are read-only if campaign status is DRAWING or FINISHED
  const isLocked = activeCampaign.status === 'DRAWING' || activeCampaign.status === 'FINISHED';

  return (
    <div className="flex flex-col gap-6">
      {/* ─── PAGE HEADER HUD ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-cyber-surface/40 border border-cyber-border/60 rounded-lg p-5 relative overflow-hidden select-none">
        <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none opacity-5 bg-cyber-grid" />
        
        <div className="flex flex-col">
          <span className="text-[10px] font-mono tracking-widest text-cyber-secondary uppercase font-bold">
            // BANCO_DE_DADOS_DE_MISSÕES
          </span>
          <h2 className="text-xl font-orbitron font-extrabold text-white uppercase tracking-wider mt-0.5">
            MISSÕES DE CAMPANHA DISPONÍVEIS
          </h2>
          <p className="text-xs text-cyber-muted mt-1 leading-relaxed max-w-2xl">
            Verifique e realize as tarefas abaixo para ganhar créditos de entrada no sorteio. As missões que exigem comprovação de verificação são revisadas pelos operadores do sistema.
          </p>
        </div>

        {/* Quest Summary Badge */}
        <div className="shrink-0 flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-mono text-cyber-muted uppercase tracking-widest">
              STATUS_DO_BANCO_DE_DADOS
            </span>
            <span className="text-xs font-rajdhani font-bold text-white uppercase mt-0.5">
              {quests.length} DESAFIOS ATIVOS
            </span>
          </div>
        </div>
      </div>

      {/* ─── LOCKED SYSTEM BANNER ─── */}
      {isLocked && (
        <div className="flex items-center gap-3.5 bg-cyber-danger/10 border border-cyber-danger/40 rounded-lg p-4 select-none font-rajdhani font-bold uppercase tracking-wider text-cyber-danger">
          <Lock size={18} className="shrink-0 animate-pulse" />
          <div className="flex-1">
            <div className="text-sm font-black">BLOQUEIO DE SISTEMA ATIVO // MISSÕES SUSPENSAS</div>
            <div className="text-[11px] text-cyber-muted mt-0.5 normal-case font-inter leading-relaxed">
              O processo de seleção do sorteio foi iniciado ou concluído. O envio de missões está bloqueado. Participe da transmissão ao vivo para acompanhar o anúncio dos vencedores.
            </div>
          </div>
        </div>
      )}

      {/* ─── QUESTS LIST ─── */}
      <div className="flex flex-col gap-4">
        {quests.length === 0 ? (
          <Card className="text-center py-10 select-none">
            <HelpCircle size={36} className="text-cyber-muted mx-auto mb-2 animate-bounce" />
            <p className="text-sm font-rajdhani font-bold text-white uppercase tracking-wider">
              Nenhuma missão configurada para esta campanha.
            </p>
            <p className="text-xs text-cyber-muted mt-1">
              Volte em breve para novas operações agendadas.
            </p>
          </Card>
        ) : (
          quests.map((quest) => (
            <QuestCard
              key={quest.id}
              mission={quest}
              onAction={isLocked ? undefined : handleQuestAction}
            />
          ))
        )}
      </div>

      {/* ─── INSTRUCTION ACCENT CARD ─── */}
      <div className="bg-cyber-surface/30 border border-cyber-border/40 rounded-lg p-4 flex gap-3 select-none">
        <ShieldCheck size={16} className="text-cyber-secondary shrink-0 mt-0.5" />
        <div className="font-mono text-[10px] text-cyber-muted uppercase tracking-wider leading-relaxed">
          Protocolo de Segurança: As comprovações enviadas são verificadas contra manipulação do sistema. Qualquer comprovação falsificada ou reivindicação duplicada resultará em desclassificação imediata e bloqueio de PIN.
        </div>
      </div>

      {/* ─── PROOF UPLOAD MODAL ─── */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={handleModalClose}
        title="Enviar Comprovação de Verificação"
        size="md"
      >
        {selectedMission && (
          <PrintUpload
            missionId={selectedMission.id}
            missionTitle={selectedMission.title}
            onUpload={handleUploadSubmit}
            onCancel={handleModalClose}
          />
        )}
      </Modal>
    </div>
  );
};

export default QuestsPage;
