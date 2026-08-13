import React, { useCallback, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, KeyRound, Clock, Trophy, RefreshCw } from 'lucide-react';
import { campaignService } from '../../services/campaign.service';
import { standCodeService } from '../../services/standCode.service';
import type { StandCode } from '../../services/standCode.service';
import { getNextDrawTarget } from '../../utils/drawSchedule';
import { useCountdown } from '../../hooks/useCountdown';
import type { Campaign } from '../../types';

const SIGNUP_URL = `${window.location.origin}/register`;

// Anel que esvazia conforme a janela do código corre. Fica grande de propósito:
// esta tela é vista de longe, em pé, por quem está na fila do estande.
const CountdownRing: React.FC<{
  progress: number;
  secondsLeft: number;
  size?: number;
}> = ({ progress, secondsLeft, size = 132 }) => {
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          stroke="rgb(var(--c-border))"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke="rgb(var(--c-primary))"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-display font-extrabold text-brand-strong leading-none">
          {secondsLeft}
        </span>
        <span className="text-[11px] text-brand-muted mt-1">segundos</span>
      </div>
    </div>
  );
};

export const StandPage: React.FC = () => {
  const [stand, setStand] = useState<StandCode | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const drawCountdown = useCountdown(getNextDrawTarget(campaign));

  const loadCode = useCallback(async () => {
    try {
      const data = await standCodeService.getCurrent();
      setStand(data);
      setError(null);
    } catch {
      setError('Não foi possível obter o código. Verifique a conexão com a API.');
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

  const progress = stand ? secondsLeft / stand.periodSeconds : 0;

  return (
    <div className="flex flex-col gap-6 font-body">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-brand-border pb-4">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-brand-strong">
            Cadastro no estande
          </h1>
          <p className="text-sm text-brand-muted mt-1">
            Deixe esta tela aberta e visível para o público durante o evento.
          </p>
        </div>
        <button
          onClick={loadCode}
          className="self-start sm:self-auto inline-flex items-center gap-2 text-sm font-bold text-brand-primary hover:underline"
        >
          <RefreshCw size={15} />
          Atualizar agora
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-brand-danger/40 bg-brand-danger/10 p-3 text-sm text-brand-danger">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <section className="lg:col-span-3 rounded-2xl border border-brand-border bg-brand-surface theme-card p-8 flex flex-col items-center text-center gap-5">
          <div className="flex items-center gap-2 text-brand-primary">
            <Smartphone size={20} />
            <h2 className="text-lg font-display font-extrabold">
              1. Aponte a câmera do celular
            </h2>
          </div>

          <div className="rounded-2xl bg-white p-5 border border-brand-border">
            <QRCodeSVG value={SIGNUP_URL} size={300} level="M" marginSize={0} />
          </div>

          <p className="text-sm text-brand-muted max-w-sm leading-relaxed">
            O QR abre a página de cadastro. Se preferir, digite o endereço no
            navegador.
          </p>
          <p className="text-sm font-bold text-brand-primary break-all">
            {SIGNUP_URL}
          </p>
        </section>

        <div className="lg:col-span-2 flex flex-col gap-6">
          <section className="rounded-2xl border-2 border-brand-primary bg-brand-highlight theme-card p-7 flex flex-col items-center text-center gap-4">
            <div className="flex items-center gap-2 text-brand-primary">
              <KeyRound size={20} />
              <h2 className="text-lg font-display font-extrabold">
                2. Use este código
              </h2>
            </div>

            <div className="font-display font-black text-brand-strong tracking-[0.18em] leading-none text-6xl sm:text-7xl tabular-nums">
              {stand ? stand.code : '····'}
            </div>

            <p className="text-sm text-brand-muted leading-relaxed">
              Digite no campo <strong className="text-brand-text">Código do estande</strong>{' '}
              para concluir o cadastro.
            </p>

            <div className="w-full border-t border-brand-primary/20 pt-4 flex items-center justify-center gap-5">
              <CountdownRing progress={progress} secondsLeft={secondsLeft} />
              <div className="text-left">
                <p className="text-sm font-bold text-brand-text">
                  Novo código em
                </p>
                <p className="text-xs text-brand-muted leading-relaxed mt-1 max-w-[11rem]">
                  Quando zerar, o código muda sozinho. Quem já estava digitando
                  ainda consegue concluir.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-brand-border bg-brand-surface theme-card p-6 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-brand-accent">
              <Trophy size={18} />
              <h2 className="text-base font-display font-extrabold text-brand-strong">
                Próximo sorteio
              </h2>
            </div>

            {campaign && !drawCountdown.isExpired ? (
              <>
                <p className="text-sm text-brand-muted">{campaign.name}</p>
                <div className="flex items-end gap-2 text-brand-strong">
                  <Clock size={22} className="mb-1 text-brand-primary" />
                  <span className="font-display font-extrabold text-4xl tabular-nums leading-none">
                    {drawCountdown.hudDisplayShort}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-sm text-brand-muted">
                {campaign
                  ? 'O sorteio já pode começar a qualquer momento.'
                  : 'Nenhuma campanha ativa no momento.'}
              </p>
            )}
          </section>
        </div>
      </div>

      <section className="rounded-2xl border border-brand-border bg-brand-surface theme-card p-6">
        <h2 className="text-base font-display font-extrabold text-brand-strong mb-3">
          Como explicar para o visitante
        </h2>
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-brand-muted">
          <li className="rounded-xl bg-brand-highlight p-4 leading-relaxed">
            <strong className="text-brand-text block mb-1">1. Escaneie</strong>
            Aponte a câmera para o QR e abra a página de cadastro.
          </li>
          <li className="rounded-xl bg-brand-highlight p-4 leading-relaxed">
            <strong className="text-brand-text block mb-1">2. Preencha</strong>
            Nome, telefone e um PIN de 4 dígitos que você vai lembrar.
          </li>
          <li className="rounded-xl bg-brand-highlight p-4 leading-relaxed">
            <strong className="text-brand-text block mb-1">3. Digite o código</strong>
            O código desta tela confirma que você está aqui no evento.
          </li>
        </ol>
      </section>
    </div>
  );
};

export default StandPage;
