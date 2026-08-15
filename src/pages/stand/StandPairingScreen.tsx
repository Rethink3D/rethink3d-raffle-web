import React, { useCallback, useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { MonitorSmartphone, RefreshCw, ShieldCheck } from 'lucide-react';
import {
  STAND_PAIRING_POLL_MS,
  standPairingService,
} from '../../services/standPairing.service';
import type { StandPairingCreated } from '../../services/standPairing.service';
import { useStandStore } from '../../store/standStore';

const APPROVE_URL = `${window.location.origin}/admin/estande`;

const RETRY_BACKOFF_MS = 5000;

const formatUserCode = (code: string): string =>
  `${code.slice(0, 3)}-${code.slice(3)}`;

export const StandPairingScreen: React.FC = () => {
  const setToken = useStandStore((state) => state.setToken);

  const [pairing, setPairing] = useState<StandPairingCreated | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const requestingRef = useRef(false);
  const retryAfterRef = useRef(0);

  const requestPairing = useCallback(async (force = false) => {
    if (requestingRef.current) return;
    if (!force && Date.now() < retryAfterRef.current) return;

    requestingRef.current = true;
    try {
      const data = await standPairingService.create();
      setPairing(data);
      setError(null);
      retryAfterRef.current = 0;
    } catch {
      setPairing(null);
      setError(
        'Não foi possível falar com a API. Verifique a conexão e tente de novo.'
      );
      retryAfterRef.current = Date.now() + RETRY_BACKOFF_MS;
    } finally {
      requestingRef.current = false;
    }
  }, []);

  useEffect(() => {
    void requestPairing();
  }, [requestPairing]);

  useEffect(() => {
    if (!pairing) return;

    let cancelled = false;

    const interval = setInterval(() => {
      standPairingService
        .poll(pairing.pairingId)
        .then((status) => {
          if (cancelled) return;
          if (status.status === 'approved' && status.accessToken) {
            setToken(status.accessToken);
            return;
          }
          if (status.status === 'expired') {
            void requestPairing(true);
          }
        })
        .catch(() => undefined);
    }, STAND_PAIRING_POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pairing, setToken, requestPairing]);

  useEffect(() => {
    if (!pairing) return;

    const expiresAt = new Date(pairing.expiresAt).getTime();

    const tick = () => {
      const remaining = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) void requestPairing(true);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [pairing, requestPairing]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div className="h-screen w-screen overflow-hidden bg-brand-bg flex flex-col font-body">
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
              Tela do estande bloqueada
            </h1>
            <p className="text-[min(1.7vh,2.1vw)] text-white/80 truncate">
              Libere pelo painel administrativo no celular
            </p>
          </div>
        </div>

        <button
          onClick={() => void requestPairing(true)}
          title="Gerar novo código de liberação"
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

      <main className="flex-1 min-h-0 p-[2.5vw] flex flex-col gap-[1.6vh]">
        <div className="flex-1 min-h-0 flex flex-col landscape:flex-row gap-[1.6vh] landscape:gap-[2vw]">
          <section className="flex-1 min-h-0 rounded-2xl border-2 border-brand-primary bg-brand-highlight theme-card p-[1.6vh] flex flex-col items-center justify-center text-center gap-[1vh]">
            <div className="flex items-center gap-[0.8vw] text-brand-primary shrink-0">
              <ShieldCheck className="w-[2.4vh] h-[2.4vh]" />
              <h2 className="text-[min(2.4vh,3vw)] font-display font-extrabold">
                Código de liberação
              </h2>
            </div>

            <div className="font-display font-black text-brand-strong tracking-[0.12em] leading-none text-[min(11vh,15vw)]">
              {pairing ? formatUserCode(pairing.userCode) : '···-···'}
            </div>

            <p className="text-[min(1.9vh,2.3vw)] text-brand-muted leading-snug max-w-[34ch]">
              {pairing
                ? `Expira em ${minutes}:${String(seconds).padStart(2, '0')} — depois um código novo aparece sozinho.`
                : 'Gerando código…'}
            </p>
          </section>

          <section className="flex-1 min-h-0 rounded-2xl border border-brand-border bg-brand-surface theme-card p-[1.6vh] flex flex-col items-center justify-center text-center gap-[1.2vh]">
            <div className="flex items-center gap-[0.8vw] text-brand-primary shrink-0">
              <MonitorSmartphone className="w-[2.4vh] h-[2.4vh]" />
              <h2 className="text-[min(2.4vh,3vw)] font-display font-extrabold">
                Abra no celular
              </h2>
            </div>

            <div className="rounded-xl bg-white p-[1vh] border border-brand-border">
              <QRCodeSVG
                value={APPROVE_URL}
                level="M"
                marginSize={0}
                size={Math.round(
                  Math.min(window.innerHeight * 0.26, window.innerWidth * 0.26)
                )}
              />
            </div>

            <p className="text-[min(1.7vh,2.1vw)] font-bold text-brand-primary break-all shrink-0">
              {APPROVE_URL}
            </p>
          </section>
        </div>

        <section className="shrink-0 rounded-2xl border border-brand-border bg-brand-surface theme-card p-[1.4vh]">
          <div className="grid grid-cols-3 gap-[1.2vw] text-[min(1.6vh,2vw)] text-brand-muted">
            <div className="rounded-xl bg-brand-highlight p-[1.2vh] leading-snug">
              <strong className="text-brand-text block mb-[0.4vh] text-[min(1.9vh,2.3vw)]">
                1. No celular
              </strong>
              Entre no painel como administrador.
            </div>
            <div className="rounded-xl bg-brand-highlight p-[1.2vh] leading-snug">
              <strong className="text-brand-text block mb-[0.4vh] text-[min(1.9vh,2.3vw)]">
                2. Liberar estande
              </strong>
              Informe o código exibido nesta tela.
            </div>
            <div className="rounded-xl bg-brand-highlight p-[1.2vh] leading-snug">
              <strong className="text-brand-text block mb-[0.4vh] text-[min(1.9vh,2.3vw)]">
                3. Pronto
              </strong>
              A tela libera sozinha e vale por 24 horas.
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default StandPairingScreen;
