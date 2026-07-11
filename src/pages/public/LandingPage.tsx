import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { campaignService } from "../../services/campaign.service";
import { getCampaignStatusLabel } from "../../utils/campaignStatus";
import { getNextDrawTarget } from "../../utils/drawSchedule";
import type { Campaign } from "../../types";
import { useCountdown } from "../../hooks/useCountdown";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { useAuthStore } from "../../store/authStore";
import {
  HelpCircle,
  ShieldAlert,
  Zap,
  Clock,
  ChevronDown,
  ChevronUp,
  Compass,
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

export const LandingPage: React.FC = () => {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    campaignService
      .getActiveCampaign()
      .then((data) => {
        if (isMounted) {
          setActiveCampaign(data);
          setLoading(false);
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

  const steps = [
    {
      title: "CRIAR CONTA",
      desc: "Crie sua identidade digital com nome, telefone e código PIN seguro de 4 dígitos.",
      icon: (
        <img src={step1} alt="Criar Conta" className="w-6 h-6 object-contain" />
      ),
    },
    {
      title: "CUMPRIR MISSÕES",
      desc: "Complete as missões disponíveis na campanha. Algumas podem exigir o envio de um comprovante, outras podem envolver questionários, formulários ou ações automáticas.",
      icon: (
        <img
          src={step2}
          alt="Cumprir Missões"
          className="w-6 h-6 object-contain"
        />
      ),
    },
    {
      title: "COLETE CUPONS",
      desc: "Cada missão concluída adiciona novos cupons à sua conta. Quanto mais cupons você tiver, maiores serão suas chances no sorteio.",
      icon: (
        <img
          src={step3}
          alt="Colete Cupons"
          className="w-6 h-6 object-contain"
        />
      ),
    },
    {
      title: "ASSISTIR AO SORTEIO AO VIVO",
      desc: "No horário marcado, acompanhe o sorteio ao vivo diretamente pela plataforma e descubra os vencedores em tempo real.",
      icon: (
        <img
          src={step4}
          alt="Assistir Sorteio"
          className="w-6 h-6 object-contain"
        />
      ),
    },
  ];

  const faqs = [
    {
      q: "Como funciona o sistema de cupons do sorteio?",
      a: "Cada missão concluída concede uma quantidade de cupons. No momento do sorteio, cada cupom representa uma chance adicional de ser sorteado.",
    },
    {
      q: "Que tipos de missões/tarefas existem?",
      a: "As missões variam conforme a campanha. Elas podem incluir envio de comprovantes, quizzes, formulários de feedback ou outras atividades definidas pelos organizadores.",
    },
    {
      q: "Como são verificadas as fotos?",
      a: "Caso uma missão exija um comprovante, siga as instruções exibidas na descrição da missão e envie a imagem solicitada. Após o envio, a missão será validada conforme as regras da campanha.",
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
    <div className="flex flex-col gap-12 font-inter text-cyber-text">
      {/* 1. HERO BANNER */}
      <section className="relative py-12 md:py-20 flex flex-col items-center justify-center text-center overflow-hidden border border-cyber-primary/40 rounded-lg bg-cyber-surface/60 px-4">
        {/* Elementos GIFs de fundo distribuídos nos cantos e laterais do Hero */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0 opacity-40">
          <img
            src={random1}
            alt="R1"
            className="absolute top-[8%] left-[6%] w-12 h-auto"
          />
          <img
            src={random2}
            alt="R2"
            className="absolute top-[18%] right-[10%] w-11 h-auto"
          />
          <img
            src={random3}
            alt="R3"
            className="absolute bottom-[10%] left-[8%] w-14 h-auto"
          />
          <img
            src={random4}
            alt="R4"
            className="absolute bottom-[18%] right-[12%] w-12 h-auto"
          />
          <img
            src={random5}
            alt="R5"
            className="absolute top-[50%] left-[3%] w-11 h-auto"
          />
        </div>

        {/* Abstract Cyber Grid overlay */}
        <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-cyber-bg via-transparent to-transparent pointer-events-none" />

        {/* Glow corners */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyber-primary" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyber-primary" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyber-primary" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyber-primary" />

        <div className="relative z-10 max-w-3xl flex flex-col items-center">
          <h1 className="font-orbitron text-3xl sm:text-5xl md:text-6xl font-black tracking-widest text-white uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.15)] leading-tight">
            RETHINK
            <span className="text-cyber-primary text-glow-primary">3D</span>
          </h1>

          <p className="font-inter text-sm sm:text-base text-cyber-muted mt-6 max-w-xl leading-relaxed">
            Participe das missões, acumule cupons e aumente suas chances de
            ganhar nos sorteios ao vivo. Cada missão concluída rende novos
            cupons para você aumentar suas chances.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full justify-center px-4 max-w-md">
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
                  Criar Personagem
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  className="sm:w-1/2"
                  onClick={() => navigate("/login")}
                >
                  Continuar História
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 2. DYNAMIC ACTIVE CAMPAIGN & COUNTDOWN */}
      <section className="flex flex-col gap-6">
        <h2 className="font-orbitron text-base sm:text-xl font-bold text-white tracking-widest uppercase border-b border-cyber-border pb-2">
          ⚡ CAMPANHAS ATIVAS
        </h2>

        {loading ? (
          <Card className="flex flex-col items-center justify-center py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyber-secondary mb-3" />
            <span className="font-mono text-xs text-cyber-muted tracking-widest">
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
                  <div className="aspect-video relative rounded-md border border-cyber-border overflow-hidden bg-black/55">
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

                <p className="text-sm leading-relaxed text-cyber-text/90">
                  {activeCampaign.description ||
                    "Nenhuma descrição fornecida para esta campanha."}
                </p>

                {/* Visual specs */}
                <div className="grid grid-cols-2 gap-4 bg-black/40 border border-cyber-border/40 p-4 rounded text-xs font-mono text-cyber-muted mt-2">
                  <div>
                    <span className="block text-white font-bold mb-1">
                      DATA DE LANÇAMENTO
                    </span>
                    {activeCampaign.startDate
                      ? new Date(activeCampaign.startDate).toLocaleDateString()
                      : "N/D"}
                  </div>
                  <div>
                    <span className="block text-white font-bold mb-1">
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
                    ? "Ir para Quests & Missões"
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
              <div className="flex items-center gap-2 text-cyber-accent mb-4 font-orbitron font-bold uppercase tracking-wider text-sm relative z-10">
                <Clock size={16} className="animate-pulse" />
                <span>Tempo Restante para o Sorteio</span>
              </div>

              <div className="relative z-10 w-full flex flex-col items-center">
                {!drawTarget ? (
                  <div className="text-cyber-muted font-mono text-sm py-4">
                    A DEFINIR // DATA DO SORTEIO NÃO CONFIGURADA
                  </div>
                ) : countdown.isExpired ? (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <span className="text-xl sm:text-2xl font-orbitron font-extrabold text-cyber-success tracking-widest animate-pulse">
                      SORTEIO EM ANDAMENTO
                    </span>
                    <p className="text-[10px] font-mono text-cyber-muted max-w-xs uppercase">
                      A fase de sorteio está ativa. Clique abaixo para entrar na
                      sala de transmissão.
                    </p>
                    <Button
                      variant="accent"
                      className="mt-2"
                      onClick={() => navigate(`/watch/${activeCampaign.id}`)}
                    >
                      Assistir ao Sorteio Ao Vivo
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    {/* Digital HUD Counter */}
                    <div className="flex gap-2 sm:gap-4 justify-center select-none">
                      <div className="flex flex-col">
                        <div className="w-14 sm:w-16 h-14 sm:h-16 bg-black/60 border border-cyber-accent rounded flex items-center justify-center text-2xl sm:text-3xl font-orbitron font-black text-cyber-accent text-glow-accent">
                          {countdown.formatted.days}
                        </div>
                        <span className="text-[9px] font-mono text-cyber-muted mt-1 uppercase tracking-widest">
                          Dias
                        </span>
                      </div>
                      <span className="text-2xl sm:text-3xl text-cyber-accent pt-2">
                        :
                      </span>
                      <div className="flex flex-col">
                        <div className="w-14 sm:w-16 h-14 sm:h-16 bg-black/60 border border-cyber-accent rounded flex items-center justify-center text-2xl sm:text-3xl font-orbitron font-black text-cyber-accent text-glow-accent">
                          {countdown.formatted.hours}
                        </div>
                        <span className="text-[9px] font-mono text-cyber-muted mt-1 uppercase tracking-widest">
                          Horas
                        </span>
                      </div>
                      <span className="text-2xl sm:text-3xl text-cyber-accent pt-2">
                        :
                      </span>
                      <div className="flex flex-col">
                        <div className="w-14 sm:w-16 h-14 sm:h-16 bg-black/60 border border-cyber-accent rounded flex items-center justify-center text-2xl sm:text-3xl font-orbitron font-black text-cyber-accent text-glow-accent">
                          {countdown.formatted.minutes}
                        </div>
                        <span className="text-[9px] font-mono text-cyber-muted mt-1 uppercase tracking-widest">
                          Minutos
                        </span>
                      </div>
                      <span className="text-2xl sm:text-3xl text-cyber-accent pt-2">
                        :
                      </span>
                      <div className="flex flex-col">
                        <div className="w-14 sm:w-16 h-14 sm:h-16 bg-black/60 border border-cyber-accent rounded flex items-center justify-center text-2xl sm:text-3xl font-orbitron font-black text-cyber-accent text-glow-accent">
                          {countdown.formatted.seconds}
                        </div>
                        <span className="text-[9px] font-mono text-cyber-muted mt-1 uppercase tracking-widest">
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
          <Card className="border-cyber-danger/40 bg-cyber-surface/40 py-12 flex flex-col items-center text-center">
            <h3 className="font-orbitron font-bold text-white text-lg uppercase tracking-wider">
              Nenhuma campanha ativa
            </h3>
            <p className="font-inter text-xs text-cyber-muted mt-2 max-w-sm">
              No momento, não há nenhuma campanha de recompensas ativa. Por
              favor, volte mais tarde ou registre-se para se preparar para a
              próxima temporada.
            </p>
            {!token && (
              <Button
                variant="danger"
                className="mt-5"
                onClick={() => navigate("/register")}
              >
                Pré-registrar
              </Button>
            )}
          </Card>
        )}
      </section>

      {/* 3. HOW TO EARN TICKETS */}
      <section className="flex flex-col gap-6">
        <h2 className="font-orbitron text-base sm:text-xl font-bold text-white tracking-widest uppercase border-b border-cyber-border pb-2">
          💡 COMO FUNCIONA
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <Card
              key={index}
              className="flex flex-col h-full justify-between hover:border-cyber-primary/70 transition-all duration-300"
            >
              <div className="flex flex-col gap-3">
                {/* Step header */}
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 border border-cyber-border flex items-center justify-center rounded bg-white p-1.5">
                    {step.icon}
                  </div>
                  <span className="font-mono text-xs text-cyber-muted font-bold">
                    PASSO_0{index + 1}
                  </span>
                </div>

                <h3 className="font-orbitron font-extrabold text-sm text-white uppercase tracking-wider mt-3">
                  {step.title}
                </h3>

                <p className="font-inter text-xs leading-relaxed text-cyber-muted">
                  {step.desc}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 4. FAQ ACCORDION */}
      <section className="flex flex-col gap-6">
        <h2 className="font-orbitron text-base sm:text-xl font-bold text-white tracking-widest uppercase border-b border-cyber-border pb-2">
          ❓ PERGUNTAS FREQUENTES
        </h2>

        <div className="flex flex-col gap-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="border border-cyber-border rounded overflow-hidden bg-cyber-surface/50"
              >
                {/* Header Toggle */}
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-4 text-left font-rajdhani font-bold text-sm sm:text-base text-white tracking-wide uppercase hover:bg-cyber-surface/60 transition-colors focus:outline-none cursor-pointer"
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle
                      size={16}
                      className="text-cyber-secondary flex-shrink-0"
                    />
                    {faq.q}
                  </span>
                  {isOpen ? (
                    <ChevronUp size={16} className="text-cyber-muted" />
                  ) : (
                    <ChevronDown size={16} className="text-cyber-muted" />
                  )}
                </button>

                {/* Body Content */}
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 border-t border-cyber-border/40 text-xs sm:text-sm text-cyber-muted leading-relaxed font-inter bg-black/25">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. RULES & SECURITY GUIDELINES */}
      <section className="flex flex-col gap-4 bg-cyber-surface/95 border border-cyber-danger/40 rounded p-6 shadow-lg">
        <div className="flex items-center gap-3 border-b border-cyber-danger/25 pb-2 text-cyber-danger">
          <ShieldAlert size={20} />
          <h2 className="font-orbitron font-extrabold text-base tracking-widest uppercase">
            REGULAMENTO E PROTOCOLO
          </h2>
        </div>

        <ul className="list-disc list-inside flex flex-col gap-2 font-inter text-xs leading-relaxed text-white text-justify">
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
        </ul>
      </section>

      {/* Footer System Specs */}
      <div className="text-[10px] text-center font-mono text-cyber-muted mt-8 border-t border-cyber-border/30 pt-4">
        <span>Copyright © 2026 Rethink3D</span>
      </div>
    </div>
  );
};

export default LandingPage;
