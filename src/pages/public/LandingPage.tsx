import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { campaignService } from "../../services/campaign.service";
import { ticketService } from "../../services/ticket.service";
import { getCampaignStatusLabel } from "../../utils/campaignStatus";
import { getNextDrawTarget } from "../../utils/drawSchedule";
import type { Campaign, LeaderboardEntry } from "../../types";
import { useCountdown } from "../../hooks/useCountdown";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Leaderboard } from "../../components/ranking/Leaderboard";
import { useAuthStore } from "../../store/authStore";
import {
  HelpCircle,
  ShieldAlert,
  Zap,
  Clock,
  ChevronDown,
  ChevronUp,
  Compass,
  Trophy,
  PauseCircle,
  UserPlus,
  ListChecks,
  Ticket,
  Radio,
} from "lucide-react";

import step1 from "../../assets/Step1Icon.svg";
import step2 from "../../assets/Step2Icon.svg";
import step3 from "../../assets/Step3Icon.svg";
import step4 from "../../assets/Step4Icon.svg";

// Importação dos 7 GIFs para a seção Hero
import random1 from "../../assets/random1.gif";
import random2 from "../../assets/random2.gif";
import random3 from "../../assets/random3.gif";
import random4 from "../../assets/random4.gif";
import random5 from "../../assets/random5.gif";
import { THEME } from '../../theme/current';
import { ThemeAsset } from '../../theme/assets';
import { copy } from '../../theme/copy';

export const LandingPage: React.FC = () => {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [rankingEntries, setRankingEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    let isMounted = true;
    campaignService
      .getActiveCampaign()
      .then((data) => {
        if (!isMounted) return;
        setActiveCampaign(data);
        setLoading(false);

        if (data) {
          ticketService
            .getPublicLeaderboard(data.id)
            .then((leaderboard) => {
              if (isMounted) setRankingEntries(leaderboard.top);
            })
            .catch((err) => console.warn("Failed to load public ranking:", err));
        }
      })
      .catch((err) => {
        console.error("Failed to fetch active campaign:", err);
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Mira o próximo horário agendado (cai pro campo único `drawDate` só em
  // campanhas antigas sem nenhum horário cadastrado ainda).
  const drawTarget = getNextDrawTarget(activeCampaign) || "";
  const countdown = useCountdown(drawTarget);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const isCyber = THEME === 'cyber';

  const steps = [
    {
      title: copy.step1Title,
      desc: copy.step1Desc,
      icon: isCyber ? (
        <img src={step1} alt="" className="w-6 h-6 object-contain" />
      ) : (
        <UserPlus size={20} />
      ),
    },
    {
      title: copy.step2Title,
      desc: copy.step2Desc,
      icon: isCyber ? (
        <img src={step2} alt="" className="w-6 h-6 object-contain" />
      ) : (
        <ListChecks size={20} />
      ),
    },
    {
      title: copy.step3Title,
      desc: copy.step3Desc,
      icon: isCyber ? (
        <img src={step3} alt="" className="w-6 h-6 object-contain" />
      ) : (
        <Ticket size={20} />
      ),
    },
    {
      title: copy.step4Title,
      desc: copy.step4Desc,
      icon: isCyber ? (
        <img src={step4} alt="" className="w-6 h-6 object-contain" />
      ) : (
        <Radio size={20} />
      ),
    },
  ];

  const faqs = [
    {
      q: copy.faq1Q,
      a: copy.faq1A,
    },
    {
      q: copy.faq2Q,
      a: copy.faq2A,
    },
    {
      q: "Como são verificadas as fotos?",
      a: copy.faq3A,
    },
    {
      q: "Como sei quando o sorteio está ao vivo?",
      a: "Nossa página inicial exibe uma contagem regressiva. Quando ela chega a zero ou o administrador inicia o sorteio, o site muda automaticamente para a página de transmissão ao vivo. Você verá uma roleta selecionando vencedores em tempo real!",
    },
    {
      q: "E se eu esquecer meu PIN de login de 4 dígitos?",
      a: "Como usamos autenticação via telefone-pin para um registro instantâneo, você precisará entrar em contato com um administrador da Rethink3D para solicitar a redefinição do PIN.",
    },
  ];

  return (
    <div className="flex flex-col gap-12 font-body text-brand-text">
      {/* 1. HERO BANNER */}
      <section className="section-tint relative py-12 md:py-20 flex flex-col items-center justify-center text-center overflow-hidden border border-brand-primary/40 rounded-lg bg-brand-surface/60 px-4">
        {/* Elementos GIFs de fundo distribuídos nos cantos e laterais do Hero */}
        {THEME === 'cyber' && (
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0 opacity-40">
            <img
              src={random1}
              alt=""
              className="absolute top-[8%] left-[6%] w-12 h-auto"
            />
            <img
              src={random2}
              alt=""
              className="absolute top-[18%] right-[10%] w-11 h-auto"
            />
            <img
              src={random3}
              alt=""
              className="absolute bottom-[10%] left-[8%] w-14 h-auto"
            />
            <img
              src={random4}
              alt=""
              className="absolute bottom-[18%] right-[12%] w-12 h-auto"
            />
            <img
              src={random5}
              alt=""
              className="absolute top-[50%] left-[3%] w-11 h-auto"
            />
          </div>
        )}

        <ThemeAsset
          kind="heroDecor"
          className="absolute -right-4 -bottom-4 w-1/3 max-w-[220px] opacity-60 pointer-events-none select-none z-0"
        />

        {/* Abstract Cyber Grid overlay */}
        <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-transparent to-transparent pointer-events-none" />

        {/* Glow corners */}
        <div className="hud-corner absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-brand-primary" />
        <div className="hud-corner absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-brand-primary" />
        <div className="hud-corner absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-brand-primary" />
        <div className="hud-corner absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-brand-primary" />

        <div className="relative z-10 max-w-3xl flex flex-col items-center">
          <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-black tracking-widest text-brand-strong uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.15)] leading-tight">
            RETHINK
            <span className="text-brand-primary text-glow-primary">3D</span>
          </h1>

          <p className="font-body text-sm sm:text-base text-brand-muted mt-6 max-w-xl leading-relaxed">
            {copy.heroParagraph}
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full justify-center px-4 max-w-lg">
            {token ? (
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => navigate("/dashboard")}
                icon={<Compass size={18} />}
              >
                Acessar Painel
              </Button>
            ) : (
              <>
                <Button
                  variant="primary"
                  size="lg"
                  className="sm:w-1/2"
                  onClick={() => navigate("/register")}
                >
                  {copy.ctaRegister}
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  className="sm:w-1/2"
                  onClick={() => navigate("/login")}
                >
                  {copy.ctaLogin}
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 2. DYNAMIC ACTIVE CAMPAIGN & COUNTDOWN */}
      <section className="flex flex-col gap-6">
        <h2 className="font-display text-base sm:text-xl font-bold text-brand-strong tracking-widest uppercase border-b border-brand-border pb-2">
          {copy.landingCampaigns}
        </h2>

        {loading ? (
          <Card className="flex flex-col items-center justify-center py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-secondary mb-3" />
            <span className="font-mono text-xs text-brand-muted tracking-widest">
              CONECTANDO AO NÓ...
            </span>
          </Card>
        ) : activeCampaign ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Campaign info */}
            <Card
              className="lg:col-span-7 flex flex-col justify-between"
              title={activeCampaign.name}
              subtitle={`STATUS: ${getCampaignStatusLabel(activeCampaign.status)}`}
            >
              <div className="flex flex-col gap-4 mt-2">
                {activeCampaign.coverImageUrl && (
                  <div className="aspect-video relative rounded-md border border-brand-border overflow-hidden bg-sunken-55">
                    <img
                      src={activeCampaign.coverImageUrl}
                      alt={activeCampaign.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}

                <p className="text-sm leading-relaxed text-brand-text/90">
                  {activeCampaign.description ||
                    "Nenhuma descrição fornecida para esta campanha."}
                </p>

                {/* Visual specs */}
                <div className="grid grid-cols-2 gap-4 bg-sunken-40 border border-brand-border/40 p-4 rounded text-xs font-mono text-brand-muted mt-2">
                  <div>
                    <span className="block text-brand-strong font-bold mb-1">
                      DATA DE LANÇAMENTO
                    </span>
                    {activeCampaign.startDate
                      ? new Date(activeCampaign.startDate).toLocaleDateString()
                      : "N/D"}
                  </div>
                  <div>
                    <span className="block text-brand-strong font-bold mb-1">
                      DATA DO SORTEIO
                    </span>
                    {drawTarget
                      ? new Date(drawTarget).toLocaleString()
                      : "N/D"}
                  </div>
                </div>
              </div>

              {/* Action Button inside active campaign */}
              <div className="mt-6">
                <Button
                  variant="accent"
                  fullWidth
                  onClick={() =>
                    token ? navigate("/quests") : navigate("/register")
                  }
                  icon={<Zap size={16} />}
                >
                  {token
                    ? copy.goToMissions
                    : "Registrar-se para Participar"}
                </Button>
              </div>
            </Card>

            {/* Countdown timer */}
            <Card
              className="lg:col-span-5 flex flex-col justify-center items-center text-center py-8 relative overflow-hidden"
              variant="accent"
              glow
            >
              <div className="flex items-center gap-2 text-brand-accent mb-4 font-display font-bold uppercase tracking-wider text-sm relative z-10">
                <Clock size={16} className="animate-pulse" />
                <span>Tempo Restante para o Sorteio</span>
              </div>

              <div className="relative z-10 w-full flex flex-col items-center">
                {activeCampaign.status === "DRAWING" ? (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <span className="text-xl sm:text-2xl font-display font-extrabold text-brand-primary tracking-widest animate-pulse">
                      🔴 SORTEIO AO VIVO AGORA!
                    </span>
                    <p className="text-[10px] font-mono text-brand-muted max-w-xs uppercase">
                      A transmissão está rolando agora. Clique abaixo para
                      entrar na sala.
                    </p>
                    <Button
                      variant="accent"
                      className="mt-2"
                      onClick={() => navigate(`/watch/${activeCampaign.id}`)}
                    >
                      Assistir ao Sorteio Ao Vivo
                    </Button>
                  </div>
                ) : activeCampaign.status === "PAUSED" ? (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <div className="flex items-center gap-2 text-brand-accent">
                      <PauseCircle size={18} />
                      <span className="text-lg sm:text-xl font-display font-extrabold tracking-widest uppercase">
                        Sorteio em Intervalo
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-brand-muted max-w-xs uppercase">
                      Já rolou uma rodada — a próxima pode começar a qualquer
                      momento. Se todos os prêmios já foram sorteados, o
                      sorteio pode ser encerrado por aqui mesmo.
                    </p>
                  </div>
                ) : !drawTarget ? (
                  <div className="text-brand-muted font-mono text-sm py-4">
                    A DEFINIR // DATA DO SORTEIO NÃO CONFIGURADA
                  </div>
                ) : countdown.isExpired ? (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <span className="text-xl sm:text-2xl font-display font-extrabold text-brand-success tracking-widest animate-pulse">
                      JÁ É HORA DO SORTEIO
                    </span>
                    <p className="text-[10px] font-mono text-brand-muted max-w-xs uppercase">
                      A organização já pode começar a qualquer momento. Fique
                      de olho.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    {/* Digital HUD Counter */}
                    <div className="flex gap-2 sm:gap-4 justify-center select-none">
                      <div className="flex flex-col">
                        <div className="w-14 sm:w-16 h-14 sm:h-16 bg-sunken-60 border border-brand-accent rounded flex items-center justify-center text-2xl sm:text-3xl font-display font-black text-brand-accent text-glow-accent">
                          {countdown.formatted.days}
                        </div>
                        <span className="text-[9px] font-mono text-brand-muted mt-1 uppercase tracking-widest">
                          Dias
                        </span>
                      </div>
                      <span className="text-2xl sm:text-3xl text-brand-accent pt-2">
                        :
                      </span>
                      <div className="flex flex-col">
                        <div className="w-14 sm:w-16 h-14 sm:h-16 bg-sunken-60 border border-brand-accent rounded flex items-center justify-center text-2xl sm:text-3xl font-display font-black text-brand-accent text-glow-accent">
                          {countdown.formatted.hours}
                        </div>
                        <span className="text-[9px] font-mono text-brand-muted mt-1 uppercase tracking-widest">
                          Horas
                        </span>
                      </div>
                      <span className="text-2xl sm:text-3xl text-brand-accent pt-2">
                        :
                      </span>
                      <div className="flex flex-col">
                        <div className="w-14 sm:w-16 h-14 sm:h-16 bg-sunken-60 border border-brand-accent rounded flex items-center justify-center text-2xl sm:text-3xl font-display font-black text-brand-accent text-glow-accent">
                          {countdown.formatted.minutes}
                        </div>
                        <span className="text-[9px] font-mono text-brand-muted mt-1 uppercase tracking-widest">
                          Minutos
                        </span>
                      </div>
                      <span className="text-2xl sm:text-3xl text-brand-accent pt-2">
                        :
                      </span>
                      <div className="flex flex-col">
                        <div className="w-14 sm:w-16 h-14 sm:h-16 bg-sunken-60 border border-brand-accent rounded flex items-center justify-center text-2xl sm:text-3xl font-display font-black text-brand-accent text-glow-accent">
                          {countdown.formatted.seconds}
                        </div>
                        <span className="text-[9px] font-mono text-brand-muted mt-1 uppercase tracking-widest">
                          Segundos
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        ) : (
          <Card className="border-brand-danger/40 bg-brand-surface/40 py-12 flex flex-col items-center text-center">
            <h3 className="font-display font-bold text-brand-strong text-lg uppercase tracking-wider">
              Nenhuma campanha ativa
            </h3>
            <p className="font-body text-xs text-brand-muted mt-2 max-w-sm">
              No momento, não há nenhuma campanha de recompensas ativa. Por
              favor, volte mais tarde ou registre-se para se preparar para a
              próxima temporada.
            </p>
            {!token && (
              <Button
                variant="primary"
                className="mt-5"
                onClick={() => navigate("/register")}
              >
                Pré-registrar
              </Button>
            )}
          </Card>
        )}
      </section>

      {/* 2.5 RANKING PÚBLICO */}
      {activeCampaign && rankingEntries.length > 0 && (
        <section className="section-band flex flex-col gap-6">
          <h2 className="font-display text-base sm:text-xl font-bold text-brand-strong tracking-widest uppercase border-b border-brand-border pb-2">
            {copy.landingRanking}
          </h2>

          <Card
            variant="primary"
            title="Top 10"
            subtitle={activeCampaign.name}
            glow
            headerExtra={<Trophy size={20} className="text-brand-primary" />}
          >
            <Leaderboard entries={rankingEntries} />
            <div className="mt-4 pt-4 border-t border-brand-border/40">
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={() => navigate(token ? "/dashboard" : "/register")}
                icon={<Zap size={14} />}
              >
                {token ? copy.seeMyMissions : "Cadastre-se e Entre no Ranking"}
              </Button>
            </div>
          </Card>
        </section>
      )}

      {/* 3. HOW TO EARN TICKETS */}
      <section className="flex flex-col gap-6">
        <h2 className="font-display text-base sm:text-xl font-bold text-brand-strong tracking-widest uppercase border-b border-brand-border pb-2">
          {copy.landingHowItWorks}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <Card
              key={index}
              className="flex flex-col h-full justify-between hover:border-brand-primary/70 transition-all duration-300"
            >
              <div className="flex flex-col gap-3">
                {/* Step header */}
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 border flex items-center justify-center rounded p-1.5 ${
                    isCyber
                      ? 'border-brand-border bg-white'
                      : 'border-brand-primary/20 bg-brand-highlight text-brand-primary'
                  }`}>
                    {step.icon}
                  </div>
                  <span className="font-mono text-xs text-brand-muted font-bold">
                    {isCyber ? `PASSO_0${index + 1}` : `Passo ${index + 1}`}
                  </span>
                </div>

                <h3 className="font-display font-extrabold text-sm text-brand-strong uppercase tracking-wider mt-3">
                  {step.title}
                </h3>

                <p className="font-body text-xs leading-relaxed text-brand-muted">
                  {step.desc}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 4. FAQ ACCORDION */}
      <section className="flex flex-col gap-6">
        <h2 className="font-display text-base sm:text-xl font-bold text-brand-strong tracking-widest uppercase border-b border-brand-border pb-2">
          {copy.landingFaq}
        </h2>

        <div className="flex flex-col gap-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="border border-brand-border rounded overflow-hidden bg-brand-surface/50"
              >
                {/* Header Toggle */}
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-4 text-left font-ui font-bold text-sm sm:text-base text-brand-strong tracking-wide uppercase hover:bg-brand-surface/60 transition-colors focus:outline-none cursor-pointer"
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle
                      size={16}
                      className="text-brand-secondary flex-shrink-0"
                    />
                    {faq.q}
                  </span>
                  {isOpen ? (
                    <ChevronUp size={16} className="text-brand-muted" />
                  ) : (
                    <ChevronDown size={16} className="text-brand-muted" />
                  )}
                </button>

                {/* Body Content */}
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 border-t border-brand-border/40 text-xs sm:text-sm text-brand-muted leading-relaxed font-body bg-sunken-25">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. RULES & SECURITY GUIDELINES */}
      <section className="flex flex-col gap-4 bg-brand-surface/95 border border-brand-danger/40 rounded p-6 shadow-lg">
        <div className="flex items-center gap-3 border-b border-brand-danger/25 pb-2 text-brand-danger">
          <ShieldAlert size={20} />
          <h2 className="font-display font-extrabold text-base tracking-widest uppercase">
            REGULAMENTO E PROTOCOLO
          </h2>
        </div>

        <ul className="list-disc list-inside flex flex-col gap-2 font-body text-xs leading-relaxed text-brand-strong text-justify">
          <li>
            <strong>Contas Únicas Apenas:</strong> Os participantes estão
            estritamente limitados a uma conta associada ao seu número de
            telefone ativo. Múltiplas contas duplicadas acionarão o isolamento
            do sistema e a perda de todos os cupons.
          </li>
          <li>
            <strong>Verificação de Comprovação:</strong> Quando uma missão
            exigir um comprovante, envie uma imagem nítida seguindo exatamente
            as orientações da descrição da missão. Envios incorretos poderão ser
            desconsiderados.
          </li>
          <li>
            <strong>Detalhes de Segurança:</strong> Seu PIN de 4 dígitos protege
            o saldo de seus cupons. Não o compartilhe com operadores,
            administradores ou terceiros. A equipe da Rethink3D nunca solicitará
            o seu PIN.
          </li>
          <li>
            <strong>Transmissão Ao Vivo:</strong> Os sorteios ocorrem em tempo
            real. Se você não estiver online durante o evento ao vivo, ainda
            poderá ganhar, mas perderá a celebração ao vivo. Entraremos em
            contato com os vencedores.
          </li>
          <li>
            <strong>Prazo de Contato:</strong> Após o sorteio, tentaremos
            contato com o vencedor por até 2 dias. Se não houver resposta
            nesse prazo, o prêmio será sorteado novamente entre os demais
            participantes.
          </li>
        </ul>
      </section>

      {/* Footer System Specs */}
      <div className="text-[10px] text-center font-mono text-brand-muted mt-8 border-t border-brand-border/30 pt-4">
        <span>Copyright © 2026 Rethink3D</span>
      </div>
    </div>
  );
};

export default LandingPage;
