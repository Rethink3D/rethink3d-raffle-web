import React, { useCallback, useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, KeyRound, Clock, Trophy, RefreshCw } from 'lucide-react';
import { campaignService } from '../../services/campaign.service';
import { standCodeService } from '../../services/standCode.service';
import type { StandCode } from '../../services/standCode.service';
import { getNextDrawTarget } from '../../utils/drawSchedule';
import { useCountdown } from '../../hooks/useCountdown';
import type { CountdownDuration } from '../../hooks/useCountdown';
import type { Campaign } from '../../types';

const SIGNUP_URL = `${window.location.origin}/register`;

// Moldura branca em volta do QR, descontada da medida disponivel.
const QR_FRAME_PADDING = 24;

// Espera antes de tentar de novo quando a API falha, pra tela nao virar um
// gerador de requisicoes se a rede do evento cair.
const RETRY_BACKOFF_MS = 5000;

// hudDisplayShort do useCountdown omite os dias, então um sorteio a 47h vira
// "23h" na tela. Aqui os dias entram quando existem.
const formatDrawCountdown = (d: CountdownDuration): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  if (d.days > 0) {
    return `${d.days}d ${pad(d.hours)}h ${pad(d.minutes)}m`;
  }
  return `${pad(d.hours)}h ${pad(d.minutes)}m ${pad(d.seconds)}s`;
};

// Anel que esvazia conforme a janela do código corre. Fica grande de propósito:
// esta tela é vista de longe, em pé, por quem está na fila do estande.
// Todo o dimensionamento é relativo à viewport porque esta tela roda numa TV
// que pode estar em pé (1080x1920) ou deitada (1920x1080), e em nenhuma das
// duas pode sobrar rolagem. O viewBox fixo deixa o anel escalar sozinho.
const RING_RADIUS = 44;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const CountdownRing: React.FC<{
  progress: number;
  secondsLeft: number;
}> = ({ progress, secondsLeft }) => (
  <div className="relative shrink-0 w-[min(11vh,14vw)] aspect-square">
    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
      <circle
        cx="50"
        cy="50"
        r={RING_RADIUS}
        fill="none"
        strokeWidth="8"
        stroke="rgb(var(--c-border))"
      />
      <circle
        cx="50"
        cy="50"
        r={RING_RADIUS}
        fill="none"
        strokeWidth="8"
        strokeLinecap="round"
        stroke="rgb(var(--c-primary))"
        strokeDasharray={RING_CIRCUMFERENCE}
        strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress)}
        style={{ transition: 'stroke-dashoffset 1s linear' }}
      />
    </svg>
    <div className="absolute inset-0 flex items-center justify-center">
      <span className="text-[min(3.4vh,4.2vw)] font-display font-extrabold text-brand-strong leading-none tabular-nums">
        {secondsLeft}
      </span>
    </div>
  </div>
);

export const StandPage: React.FC = () => {
  const [stand, setStand] = useState<StandCode | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [qrSize, setQrSize] = useState(220);
  const qrBoxRef = useRef<HTMLDivElement>(null);

  const drawCountdown = useCountdown(getNextDrawTarget(campaign));

  // Duas travas, porque o tick de 1 segundo pede código novo assim que a janela
  // zera. Sem elas, uma resposta lenta geraria pedidos duplicados e — pior — uma
  // API fora do ar deixaria a TV batendo no servidor uma vez por segundo a noite
  // inteira, já que a falha não altera `stand` e o efeito nunca reexecuta.
  const fetchingRef = useRef(false);
  const retryAfterRef = useRef(0);

  const loadCode = useCallback(async (force = false) => {
    if (fetchingRef.current) return;
    if (!force && Date.now() < retryAfterRef.current) return;

    fetchingRef.current = true;
    try {
      const data = await standCodeService.getCurrent();
      setStand(data);
      setError(null);
      retryAfterRef.current = 0;
    } catch {
      setError('Não foi possível obter o código. Verifique a conexão com a API.');
      retryAfterRef.current = Date.now() + RETRY_BACKOFF_MS;
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadCode();
    campaignService
      .getActiveCampaign()
      .then(setCampaign)
      .catch(() => setCampaign(null));
  }, [loadCode]);

  // O relógio do navegador do estande pode estar adiantado ou atrasado em
  // relação ao servidor. A contagem usa a diferença medida na resposta, senão a
  // tela viraria o código em momento diferente do que a API aceita.
  useEffect(() => {
    if (!stand) return;

    const expiresAt = new Date(stand.expiresAt).getTime();
    const skew = Date.now() - new Date(stand.serverTime).getTime();

    const tick = () => {
      const remaining = Math.max(
        0,
        Math.round((expiresAt + skew - Date.now()) / 1000),
      );
      setSecondsLeft(remaining);
      if (remaining <= 0) loadCode();
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [stand, loadCode]);

  // O QR precisa do maior quadrado que couber na área livre. Medir é mais
  // confiável que calcular em vh/vw, que muda conforme a orientação da TV.
  useEffect(() => {
    const box = qrBoxRef.current;
    if (!box) return;

    const measure = () => {
      const { width, height } = box.getBoundingClientRect();
      const side = Math.floor(Math.min(width, height)) - QR_FRAME_PADDING;
      setQrSize(Math.max(120, side));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  const progress = stand ? secondsLeft / stand.periodSeconds : 0;

  return (
    <div className="h-screen w-screen overflow-hidden bg-brand-bg flex flex-col font-body">
      {/* Faixa de marca: a logo é branca e precisa do azul atrás dela. */}
      <header className="shrink-0 bg-brand-primary px-[2.5vw] py-[1.4vh] flex items-center justify-between gap-[2vw]">
        <div className="flex items-center gap-[2vw] min-w-0">
          <img
            src="/LogoRethink3D.webp"
            alt="Rethink3D"
            className="brand-logo h-[5vh] w-auto object-contain shrink-0"
          />
          <div className="h-[3.5vh] w-px bg-white/25 shrink-0" />
          <div className="min-w-0">
            <h1 className="text-[min(3vh,3.6vw)] font-display font-extrabold text-white leading-tight truncate">
              Participe do sorteio
            </h1>
            <p className="text-[min(1.7vh,2.1vw)] text-white/80 truncate">
              Cadastre-se aqui no evento e concorra aos prêmios
            </p>
          </div>
        </div>

        {/* Discreto de propósito: serve à equipe, não ao público. */}
        <button
          onClick={() => loadCode(true)}
          title="Atualizar código"
          className="shrink-0 p-[0.8vh] rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
        >
          <RefreshCw className="w-[2.2vh] h-[2.2vh]" />
        </button>
      </header>

      {error && (
        <div className="shrink-0 mx-[2.5vw] mt-[1.2vh] rounded-lg border border-brand-danger/40 bg-brand-danger/10 px-[1.5vw] py-[1vh] text-[min(1.8vh,2.2vw)] text-brand-danger">
          {error}
        </div>
      )}

      {/* min-h-0 é o que permite os filhos encolherem em vez de estourar a
          altura da tela e criar rolagem. */}
      <main className="flex-1 min-h-0 p-[2.5vw] flex flex-col gap-[1.6vh]">
        <div className="flex-1 min-h-0 flex flex-col landscape:flex-row gap-[1.6vh] landscape:gap-[2vw]">
          {/* 1 — QR */}
          <section className="flex-1 min-h-0 rounded-2xl border border-brand-border bg-brand-surface theme-card p-[1.6vh] flex flex-col items-center justify-center text-center gap-[1.2vh]">
            <div className="flex items-center gap-[0.8vw] text-brand-primary shrink-0">
              <Smartphone className="w-[2.4vh] h-[2.4vh]" />
              <h2 className="text-[min(2.4vh,3vw)] font-display font-extrabold">
                1. Aponte a câmera
              </h2>
            </div>

            {/* O QR é medido contra o espaço que sobra, não em unidades de
                viewport: em retrato a conta por vh estourava a altura e, com
                overflow-hidden, o corte aconteceria em silêncio. */}
            <div
              ref={qrBoxRef}
              className="flex-1 min-h-0 w-full flex items-center justify-center"
            >
              <div className="rounded-xl bg-white p-[1vh] border border-brand-border">
                <QRCodeSVG value={SIGNUP_URL} level="M" marginSize={0} size={qrSize} />
              </div>
            </div>

            <p className="text-[min(1.7vh,2.1vw)] font-bold text-brand-primary break-all shrink-0">
              {SIGNUP_URL}
            </p>
          </section>

          {/* 2 — código e tempos */}
          <section className="flex-1 min-h-0 flex flex-col gap-[1.6vh]">
            <div className="flex-1 min-h-0 rounded-2xl border-2 border-brand-primary bg-brand-highlight theme-card p-[1.6vh] flex flex-col items-center justify-center text-center gap-[0.8vh]">
              <div className="flex items-center gap-[0.8vw] text-brand-primary shrink-0">
                <KeyRound className="w-[2.4vh] h-[2.4vh]" />
                <h2 className="text-[min(2.4vh,3vw)] font-display font-extrabold">
                  2. Use este código
                </h2>
              </div>

              <div className="font-display font-black text-brand-strong tracking-[0.14em] leading-none tabular-nums text-[min(11vh,16vw)]">
                {stand ? stand.code : '····'}
              </div>

              <div className="flex items-center justify-center gap-[1.2vw] shrink-0">
                <CountdownRing progress={progress} secondsLeft={secondsLeft} />
                <div className="text-left">
                  <p className="text-[min(2vh,2.4vw)] font-bold text-brand-text leading-tight">
                    Novo código em
                  </p>
                  <p className="text-[min(1.6vh,2vw)] text-brand-muted leading-snug mt-[0.4vh] max-w-[22ch]">
                    Quando zerar, o código muda sozinho.
                  </p>
                </div>
              </div>
            </div>

            <div className="shrink-0 rounded-2xl border border-brand-border bg-brand-surface theme-card p-[1.4vh] flex items-center justify-between gap-[1.5vw]">
              <div className="flex items-center gap-[0.8vw] min-w-0">
                <Trophy className="w-[2.4vh] h-[2.4vh] text-brand-accent shrink-0" />
                <div className="min-w-0">
                  <h2 className="text-[min(2vh,2.4vw)] font-display font-extrabold text-brand-strong leading-tight">
                    Próximo sorteio
                  </h2>
                  {campaign && (
                    <p className="text-[min(1.5vh,1.9vw)] text-brand-muted truncate">
                      {campaign.name}
                    </p>
                  )}
                </div>
              </div>

              {campaign && !drawCountdown.isExpired ? (
                <div className="flex items-center gap-[0.6vw] text-brand-strong shrink-0">
                  <Clock className="w-[2.4vh] h-[2.4vh] text-brand-primary" />
                  <span className="font-display font-extrabold text-[min(3.4vh,4.2vw)] tabular-nums leading-none">
                    {formatDrawCountdown(drawCountdown.duration)}
                  </span>
                </div>
              ) : (
                <span className="text-[min(1.7vh,2.1vw)] text-brand-muted text-right shrink-0">
                  {campaign
                    ? 'Pode começar a qualquer momento'
                    : 'Nenhuma campanha ativa'}
                </span>
              )}
            </div>
          </section>
        </div>

        {/* 3 — passos */}
        <section className="shrink-0 rounded-2xl border border-brand-border bg-brand-surface theme-card p-[1.4vh]">
          <div className="grid grid-cols-3 gap-[1.2vw] text-[min(1.6vh,2vw)] text-brand-muted">
            <div className="rounded-xl bg-brand-highlight p-[1.2vh] leading-snug">
              <strong className="text-brand-text block mb-[0.4vh] text-[min(1.9vh,2.3vw)]">
                1. Escaneie
              </strong>
              Aponte a câmera do celular para o QR.
            </div>
            <div className="rounded-xl bg-brand-highlight p-[1.2vh] leading-snug">
              <strong className="text-brand-text block mb-[0.4vh] text-[min(1.9vh,2.3vw)]">
                2. Preencha
              </strong>
              Nome, telefone e um PIN de 4 dígitos.
            </div>
            <div className="rounded-xl bg-brand-highlight p-[1.2vh] leading-snug">
              <strong className="text-brand-text block mb-[0.4vh] text-[min(1.9vh,2.3vw)]">
                3. Digite o código
              </strong>
              O código desta tela confirma que você está aqui.
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default StandPage;
