import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, HelpCircle, ArrowLeft, PartyPopper } from 'lucide-react';
import { campaignService } from '../../services/campaign.service';
import { questService } from '../../services/quest.service';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { QuestCard } from '../../components/quest/QuestCard';
import { PrintUpload } from '../../components/quest/PrintUpload';
import { ReferralRedeem } from '../../components/quest/ReferralRedeem';
import { useTicketRefreshStore } from '../../store/ticketRefreshStore';
import type { Campaign, Mission } from '../../types';
import nika from '../../assets/nika.gif';
import agree from '../../assets/agree.gif';

export const QuestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [quests, setQuests] = useState<Mission[]>([]);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState<boolean>(false);
  const [justEarnedTickets, setJustEarnedTickets] = useState<boolean>(false);
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
      setError('Não conseguimos carregar suas missões agora. Tente de novo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuests();
  }, []);

  const handleQuestAction = (mission: Mission) => {
    if (!activeCampaign) return;

    if (mission.type === 'QUIZ') {
      navigate(`/quiz/${mission.id}`);
    } else if (mission.type === 'FEEDBACK_FORM') {
      navigate(`/feedback/${mission.id}`);
    } else if (mission.type === 'PROOF_UPLOAD') {
      setSelectedMission(mission);
      setIsUploadModalOpen(true);
    } else if (mission.type === 'REFERRAL') {
      setSelectedMission(mission);
      setIsReferralModalOpen(true);
    }
  };

  const handleUploadSubmit = async (file: File) => {
    if (!selectedMission || !activeCampaign) return;
    try {
      await questService.uploadProof(selectedMission.id, file);
      const campaignQuests = await questService.getCampaignQuests(activeCampaign.id);
      setQuests(campaignQuests);
      setJustEarnedTickets(true);
    } catch (err) {
      console.error('Failed upload proof submission:', err);
      throw err;
    }
  };

  const handleReferralRedeem = async (friendCode: string) => {
    if (!selectedMission || !activeCampaign) return;
    await questService.redeemReferral(selectedMission.id, friendCode);
    const campaignQuests = await questService.getCampaignQuests(activeCampaign.id);
    setQuests(campaignQuests);
    setJustEarnedTickets(true);
  };

  const handleModalClose = () => {
    setIsUploadModalOpen(false);
    setIsReferralModalOpen(false);
    setSelectedMission(null);
    // Só dispara a animação do contador de tickets ao fechar o modal — o
    // modal cobre o Header enquanto aberto, então animar antes disso faria o
    // participante nunca ver o efeito.
    if (justEarnedTickets) {
      useTicketRefreshStore.getState().trigger();
      setJustEarnedTickets(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] select-none pointer-events-none">
        <div
          style={{ width: 120, height: 120 }}
          dangerouslySetInnerHTML={{
            __html: `<lottie-player
              src="/Pokeball Loading.json"
              background="transparent"
              speed="1.2"
              style="width: 100%; height: 100%;"
              loop
              autoplay
            ></lottie-player>`
          }}
        />
        <div className="text-cyber-secondary animate-pulse text-xs font-bold tracking-widest mt-2 uppercase">
          Carregando suas missões...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-10 select-none">
        <Card variant="danger" title="Ops, algo deu errado" glow>
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-sm font-rajdhani font-bold text-white tracking-wider">
              {error}
            </p>
            <Button variant="danger" size="md" onClick={fetchQuests}>
              Tentar Novamente
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!activeCampaign) {
    return (
      <div className="max-w-xl mx-auto my-10 select-none">
        <Card variant="default" title="Nenhuma missão disponível" glow>
          <div className="flex flex-col items-center gap-4 text-center py-4">
            <img src={nika} alt="Aguardando" className="w-24 h-auto" draggable={false} />
            <p className="text-sm font-inter text-cyber-muted max-w-sm">
              Ainda não temos uma campanha ativa. Assim que uma nova começar, suas missões aparecem aqui.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Missões ficam somente leitura durante e depois do sorteio
  const isLocked = activeCampaign.status === 'DRAWING' || activeCampaign.status === 'FINISHED';
  const allCompleted = quests.length > 0 && quests.every((q) => q.isCompleted);

  return (
    <div className="flex flex-col gap-6">
      <Button
        variant="secondary"
        size="sm"
        icon={<ArrowLeft size={14} />}
        onClick={() => navigate('/dashboard')}
        className="self-start"
      >
        Voltar
      </Button>

      {/* ─── HEADER ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-cyber-surface/90 border border-cyber-border/80 rounded-lg p-5 relative overflow-hidden select-none">
        <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none opacity-5 bg-cyber-grid" />

        <div className="flex flex-col">
          <h2 className="text-xl font-orbitron font-extrabold text-white uppercase tracking-wider">
            Suas Missões
          </h2>
          <p className="text-xs text-cyber-muted mt-1 leading-relaxed max-w-2xl">
            Complete as missões abaixo para ganhar cupons e aumentar suas chances no sorteio.
          </p>
        </div>

        <div className="shrink-0">
          {allCompleted ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-rajdhani font-bold text-cyber-success uppercase bg-cyber-success/15 border border-cyber-success/50 px-3 py-1.5 rounded">
              <PartyPopper size={14} />
              Todas concluídas!
            </span>
          ) : (
            <span className="text-xs font-rajdhani font-bold text-white uppercase bg-cyber-border/80 border border-cyber-border/90 px-3 py-1.5 rounded">
              {quests.length} missõe{quests.length === 1 ? '' : 's'} disponíve{quests.length === 1 ? 'l' : 'is'}
            </span>
          )}
        </div>
      </div>

      {/* ─── PARABÉNS: TODAS AS MISSÕES CONCLUÍDAS ─── */}
      {allCompleted && (
        <Card variant="secondary" glow className="text-center">
          <div className="flex flex-col items-center gap-3 py-4 select-none">
            <img src={agree} alt="Parabéns" className="w-20 h-auto" draggable={false} />
            <h3 className="text-lg font-orbitron font-extrabold text-white uppercase tracking-wider">
              Parabéns, você completou todas as missões!
            </h3>
            <p className="text-sm text-cyber-muted max-w-md">
              Seus cupons já estão garantidos. Agora é só aguardar o sorteio — boa sorte!
            </p>
          </div>
        </Card>
      )}

      {/* ─── AVISO DE BLOQUEIO ─── */}
      {isLocked && (
        <div className="flex items-center gap-3.5 bg-cyber-danger/10 border border-cyber-danger/40 rounded-lg p-4 select-none">
          <Lock size={18} className="shrink-0 text-cyber-danger" />
          <div className="flex-1">
            <div className="text-sm font-rajdhani font-bold uppercase tracking-wider text-cyber-danger">
              Missões encerradas
            </div>
            <div className="text-[11px] text-cyber-muted mt-0.5 font-inter leading-relaxed">
              O sorteio já começou, então não dá mais pra enviar missões. Acompanhe a transmissão ao vivo para saber o resultado!
            </div>
          </div>
        </div>
      )}

      {/* ─── LISTA DE MISSÕES ─── */}
      <div className="flex flex-col gap-4">
        {quests.length === 0 ? (
          <Card className="text-center py-10 select-none">
            <HelpCircle size={36} className="text-cyber-muted mx-auto mb-2" />
            <p className="text-sm font-rajdhani font-bold text-white uppercase tracking-wider">
              Nenhuma missão cadastrada ainda
            </p>
            <p className="text-xs text-cyber-muted mt-1">
              Volte em breve, novas missões podem aparecer a qualquer momento.
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

      {/* ─── MODAL DE ENVIO DE COMPROVANTE ─── */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={handleModalClose}
        title="Enviar Comprovante"
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

      {/* ─── MODAL DE INDICAR UM AMIGO ─── */}
      <Modal
        isOpen={isReferralModalOpen}
        onClose={handleModalClose}
        title="Indique um Amigo"
        size="md"
      >
        {selectedMission && (
          <ReferralRedeem
            missionId={selectedMission.id}
            missionTitle={selectedMission.title}
            onRedeem={handleReferralRedeem}
            onCancel={handleModalClose}
          />
        )}
      </Modal>
    </div>
  );
};

export default QuestsPage;
