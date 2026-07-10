import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, Info, Coins, ShieldAlert, 
  ArrowRight, Award, Zap 
} from 'lucide-react';
import { useCountdown } from '../../hooks/useCountdown';
import { useSocket } from '../../hooks/useSocket';
import { campaignService } from '../../services/campaign.service';
import { questService } from '../../services/quest.service';
import { api } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import type { Campaign, Mission } from '../../types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [quests, setQuests] = useState<Mission[]>([]);
  const [ticketCount, setTicketCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Socket connection and register events
  useSocket(activeCampaign?.id);

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch active campaign
        const campaign = await campaignService.getActiveCampaign();
        if (!isMounted) return;

        if (campaign) {
          setActiveCampaign(campaign);

          // 2. Fetch quests for active campaign to calculate stats
          const campaignQuests = await questService.getCampaignQuests(campaign.id);
          if (!isMounted) return;
          setQuests(campaignQuests);

          // 3. Fetch ticket count
          const ticketRes = await api.get('/tickets/me');
          if (!isMounted) return;
          if (Array.isArray(ticketRes.data)) {
            const total = ticketRes.data.reduce((acc: number, t: any) => acc + (t.quantity || 0), 0);
            setTicketCount(total);
          } else if (typeof ticketRes.data === 'number') {
            setTicketCount(ticketRes.data);
          } else if (ticketRes.data && typeof ticketRes.data.total === 'number') {
            setTicketCount(ticketRes.data.total);
          } else if (ticketRes.data && typeof ticketRes.data.quantity === 'number') {
            setTicketCount(ticketRes.data.quantity);
          }
        }
      } catch (err: any) {
        console.error('Error loading dashboard data:', err);
        // Active campaign endpoint might 404 if none is active
        if (err?.response?.status === 404) {
          setActiveCampaign(null);
        } else {
          setError('Falha ao sincronizar com a rede do sorteio. Por favor, verifique sua conexão.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Countdown hook using drawDate
  const countdown = useCountdown(activeCampaign?.drawDate);

  // Calculate Quest Stats
  const totalQuests = quests.length;
  const completedQuests = quests.filter(q => q.isCompleted).length;
  const progressPercent = totalQuests > 0 ? Math.round((completedQuests / totalQuests) * 100) : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] font-mono select-none pointer-events-none">
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
          [SYS_SINCRONIZANDO_DADOS_DO_PAINEL...]
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-10 select-none">
        <Card variant="danger" title="FALHA NA CONEXÃO DE REDE" glow>
          <div className="flex flex-col items-center gap-4 text-center">
            <ShieldAlert size={48} className="text-cyber-danger animate-bounce" />
            <p className="text-sm font-rajdhani font-bold text-white tracking-wider">
              {error}
            </p>
            <Button variant="danger" size="md" onClick={() => window.location.reload()}>
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
        <Card variant="default" title="STATUS" glow>
          <div className="flex flex-col items-center gap-6 text-center py-4">
            <div className="relative w-20 h-20 flex items-center justify-center rounded-full bg-cyber-border/20 border border-cyber-border">
              <Zap size={32} className="text-cyber-muted animate-pulse" />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-orbitron font-extrabold text-white tracking-widest uppercase">
                NENHUMA CAMPANHA ATIVA
              </h3>
              <p className="text-xs font-mono text-cyber-muted uppercase tracking-wider">
                STATUS // MODO_DE_ESPERA
              </p>
              <p className="text-xs font-inter text-cyber-muted max-w-sm mt-2 leading-relaxed">
                A Rethink3D não está realizando nenhuma campanha de sorteio ativa no momento. Volte mais tarde ou siga nossos canais sociais para anúncios.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 font-inter text-cyber-text">
      {/* ─── HUD HEADER SECTION ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-cyber-surface/40 border border-cyber-border/60 rounded-lg p-5 relative overflow-hidden select-none">
        <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none opacity-5 bg-cyber-grid" />
        
        <div className="flex flex-col">
          <span className="text-[10px] font-mono tracking-widest text-cyber-primary uppercase font-bold">
            // NÓ_DE_CAMPANHA_ATIVA
          </span>
          <h2 className="text-2xl font-orbitron font-extrabold text-white uppercase tracking-wider mt-1 text-glow-primary">
            {activeCampaign.name}
          </h2>
          <p className="text-xs text-cyber-muted mt-1 leading-relaxed max-w-2xl">
            {activeCampaign.description || 'Bem-vindo ao Sorteio Rethink3D. Realize missões, colete cupons de sorteio e tenha a chance de ganhar impressões 3D personalizadas exclusivas, ferramentas e acessórios.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="inline-flex items-center gap-1.5 border border-cyber-success/40 bg-cyber-success/5 text-cyber-success px-3 py-1 rounded text-xs font-mono tracking-widest uppercase font-bold animate-pulse-glow">
            <span className="w-1.5 h-1.5 rounded-full bg-cyber-success animate-ping" />
            CONEXÃO_ATIVA
          </span>
          
          {activeCampaign.status === 'DRAWING' && (
            <Button
              variant="accent"
              size="sm"
              onClick={() => navigate(`/watch/${activeCampaign.id}`)}
              className="glow-accent"
            >
              Assistir Sorteio ao Vivo
            </Button>
          )}
        </div>
      </div>

      {/* ─── MAIN GRID ─── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Side: Ticket Balance & Countdown */}
        <div className="md:col-span-5 flex flex-col gap-6">
          
          {/* TICKET BALANCE WITH COIN ANIMATION */}
          <Card 
            variant="accent" 
            title="SEU SALDO DE CRÉDITOS" 
            subtitle="R3D_COFRE_DE_CUPONS"
            glow
            className="flex-1"
          >
            <div className="flex flex-col items-center justify-center py-6 text-center select-none">
              {/* Spinning/floating 3D Neon Coin Container */}
              <div className="relative w-28 h-28 mx-auto mb-5 flex items-center justify-center rounded-full bg-cyber-accent/10 border-2 border-cyber-accent/60 glow-accent animate-float">
                <div 
                  className="absolute inset-1.5 rounded-full border border-dashed border-cyber-accent/30 animate-spin" 
                  style={{ animationDuration: '10s' }} 
                />
                <div 
                  className="absolute inset-3.5 rounded-full border border-dotted border-cyber-accent/20 animate-spin" 
                  style={{ animationDuration: '6s', animationDirection: 'reverse' }} 
                />
                <Coins size={44} className="text-cyber-accent animate-pulse" />
              </div>

              <div className="flex flex-col">
                <span className="font-orbitron font-black text-4xl text-cyber-accent text-glow-accent tracking-tighter">
                  {ticketCount}
                </span>
                <span className="text-[11px] font-mono tracking-widest text-cyber-accent font-black uppercase mt-1">
                  CUPONS DE SORTEIO GUARDADOS
                </span>
              </div>

              <p className="text-[11px] text-cyber-muted mt-3 max-w-xs leading-relaxed font-rajdhani font-semibold tracking-wide uppercase">
                Cada cupom representa uma entrada válida na seleção do sorteio ao vivo.
              </p>
            </div>
          </Card>

          {/* COUNTDOWN TIMER */}
          <Card 
            variant="primary" 
            title="CONTAGEM REGRESSIVA DO SORTEIO" 
            subtitle="CRONÔMETRO_DE_SELEÇÃO_DO_SISTEMA"
            glow
          >
            <div className="py-4 select-none">
              {countdown.isExpired ? (
                <div className="flex flex-col items-center justify-center text-center gap-3">
                  <div className="text-cyber-primary text-xs font-mono tracking-widest uppercase">
                    // CRONÔMETRO_DE_SORTEIO_EXPIRADO
                  </div>
                  <div className="font-orbitron font-black text-xl text-white uppercase tracking-wider">
                    SELEÇÃO EM ANDAMENTO
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => navigate(`/watch/${activeCampaign.id}`)}
                    className="w-full mt-2 glow-primary animate-pulse"
                    icon={<Award size={16} />}
                  >
                    Entrar na Sala do Sorteio ao Vivo
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Neon Countdown HUD */}
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-cyber-surface border border-cyber-primary/30 rounded p-2.5">
                      <div className="font-orbitron font-black text-2xl text-white tracking-tighter">
                        {countdown.formatted.days}
                      </div>
                      <div className="text-[8px] font-mono text-cyber-muted uppercase tracking-widest mt-0.5">DIAS</div>
                    </div>
                    <div className="bg-cyber-surface border border-cyber-primary/30 rounded p-2.5">
                      <div className="font-orbitron font-black text-2xl text-white tracking-tighter">
                        {countdown.formatted.hours}
                      </div>
                      <div className="text-[8px] font-mono text-cyber-muted uppercase tracking-widest mt-0.5">HORAS</div>
                    </div>
                    <div className="bg-cyber-surface border border-cyber-primary/30 rounded p-2.5">
                      <div className="font-orbitron font-black text-2xl text-white tracking-tighter">
                        {countdown.formatted.minutes}
                      </div>
                      <div className="text-[8px] font-mono text-cyber-muted uppercase tracking-widest mt-0.5">MINS</div>
                    </div>
                    <div className="bg-cyber-surface border border-cyber-primary/30 rounded p-2.5">
                      <div className="font-orbitron font-black text-2xl text-cyber-primary text-glow-primary tracking-tighter">
                        {countdown.formatted.seconds}
                      </div>
                      <div className="text-[8px] font-mono text-cyber-muted uppercase tracking-widest mt-0.5">SEGS</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 bg-cyber-primary/5 border border-cyber-primary/30 rounded p-3 mt-1.5 text-xs text-cyber-primary">
                    <Calendar size={15} className="shrink-0" />
                    <span className="font-rajdhani font-bold tracking-wider uppercase">
                      DATA DO SORTEIO: {activeCampaign.drawDate ? new Date(activeCampaign.drawDate).toLocaleString('pt-BR') : 'A DEFINIR'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Side: Quest Progress & Raffle Instructions */}
        <div className="md:col-span-7 flex flex-col gap-6">
          
          {/* MISSION PROGRESS BAR */}
          <Card 
            variant="secondary" 
            title="PROGRESSO DE CONCLUSÃO DE MISSÕES" 
            subtitle="ÍNDICE_DE_CONCLUSÃO_DO_USUÁRIO"
          >
            <div className="flex flex-col gap-4 py-2 select-none">
              
              {/* Completed vs Total Counts */}
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono tracking-widest text-cyber-secondary uppercase">
                    MISSÕES CONCLUÍDAS
                  </span>
                  <span className="font-orbitron font-extrabold text-2xl text-white mt-1">
                    {completedQuests} <span className="text-cyber-muted text-lg">/ {totalQuests}</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono tracking-widest text-cyber-secondary uppercase">
                    TAXA DE CONCLUSÃO
                  </span>
                  <span className="font-orbitron font-extrabold text-2xl text-cyber-secondary text-glow-secondary block mt-1">
                    {progressPercent}%
                  </span>
                </div>
              </div>

              {/* Progress Bar HUD */}
              <div className="relative w-full h-3 bg-cyber-border rounded overflow-hidden p-0.5 border border-cyber-border/80">
                <div 
                  className="h-full bg-gradient-to-r from-cyber-primary to-cyber-secondary rounded transition-all duration-500 ease-out glow-secondary"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Quick Prompt */}
              <div className="flex items-center justify-between mt-1 pt-3 border-t border-cyber-border/40">
                <p className="text-xs text-cyber-muted font-rajdhani font-semibold tracking-wide uppercase">
                  Conclua as tarefas restantes para maximizar seu saldo de cupons e suas chances.
                </p>
                <Link to="/quests">
                  <Button variant="secondary" size="sm" icon={<ArrowRight size={13} />}>
                    Missões
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* RAFFLE INSTRUCTIONS */}
          <Card 
            variant="default" 
            title="INSTRUÇÕES DA REDE R3D" 
            subtitle="DIRETRIZES_DE_PROTOCOLO"
          >
            <div className="flex flex-col gap-4 font-inter text-xs leading-relaxed">
              
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded border border-cyber-primary bg-cyber-primary/10 flex items-center justify-center font-orbitron font-bold text-white text-xs select-none">
                  01
                </div>
                <div>
                  <h4 className="font-orbitron font-bold text-white uppercase tracking-wider text-xs">
                    REALIZE MISSÕES
                  </h4>
                  <p className="text-cyber-muted mt-0.5">
                    Navegue até a interface de Missões. As missões variam de ações simples a formulários interativos, quizzes e envios de comprovações de impressões 3D. Cada missão concluída concede cupons instantaneamente.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded border border-cyber-secondary bg-cyber-secondary/10 flex items-center justify-center font-orbitron font-bold text-white text-xs select-none">
                  02
                </div>
                <div>
                  <h4 className="font-orbitron font-bold text-white uppercase tracking-wider text-xs">
                    ENVIE COMPROVAÇÃO VERIFICÁVEL
                  </h4>
                  <p className="text-cyber-muted mt-0.5">
                    Para tarefas de impressão 3D, tire uma foto do resultado e envie o arquivo de comprovação. Os administradores da rethink3D revisam e validam as submissões manualmente. Verifique seu índice de status regularmente.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded border border-cyber-accent bg-cyber-accent/10 flex items-center justify-center font-orbitron font-bold text-white text-xs select-none">
                  03
                </div>
                <div>
                  <h4 className="font-orbitron font-bold text-white uppercase tracking-wider text-xs">
                    PARTICIPE DA SALA DE TRANSMISSÃO AO VIVO
                  </h4>
                  <p className="text-cyber-muted mt-0.5">
                    Assim que a contagem regressiva terminar, o sistema mudará para o status de transmissão do sorteio ao vivo. Assista à roleta cyberpunk girar em tempo real. Deixe esta página aberta para descobrir se você ganhou!
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-cyber-border/30 border border-cyber-border rounded p-3 mt-1.5 select-none">
                <Info size={14} className="text-cyber-secondary shrink-0 mt-0.5" />
                <p className="text-[10px] font-mono text-cyber-muted uppercase tracking-wider leading-relaxed">
                  Aviso: Todas as transações, registros de sorteios e verificações de comprovação são registrados sob canais de auditoria seguros. Atualizações de PIN podem ser ajustadas pelo seu terminal.
                </p>
              </div>

            </div>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
