import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, Users } from 'lucide-react';
import { Button } from '../ui/Button';
import { getApiErrorMessage } from '../../utils/apiError';

interface ReferralRedeemProps {
  missionId: string;
  missionTitle: string;
  onRedeem: (friendCode: string) => Promise<void>;
  onCancel: () => void;
}

export const ReferralRedeem: React.FC<ReferralRedeemProps> = ({
  missionTitle,
  onRedeem,
  onCancel,
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    setError(null);
  };

  const handleSubmit = async () => {
    if (code.length !== 6) {
      setError('O código do seu amigo tem 6 dígitos');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onRedeem(code);
      setSuccess(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Não foi possível validar esse código. Tente de novo.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 font-inter text-cyber-text">
      <div className="flex flex-col mb-1 select-none">
        <span className="text-[10px] font-mono tracking-widest text-cyber-secondary uppercase">
          Indique um Amigo
        </span>
        <h3 className="text-base font-orbitron font-extrabold text-white uppercase tracking-wider mt-0.5">
          {missionTitle}
        </h3>
      </div>

      {!success ? (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-cyber-muted leading-relaxed">
            Peça o código de 6 dígitos do seu amigo (ele encontra no painel dele) e digite abaixo. Os dois ganham cupons na hora!
          </p>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-rajdhani font-bold text-cyber-text uppercase tracking-wider px-1">
              Código do amigo
            </label>
            <input
              value={code}
              onChange={handleChange}
              inputMode="numeric"
              placeholder="000000"
              maxLength={6}
              disabled={submitting}
              className="w-full bg-cyber-bg border border-cyber-border rounded px-3 py-3 text-center text-2xl font-orbitron font-black tracking-[0.4em] text-white focus:border-cyber-secondary focus:outline-none"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-cyber-danger/10 border border-cyber-danger/30 rounded p-3 text-cyber-danger text-xs font-rajdhani font-bold uppercase tracking-wider">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button variant="danger" size="md" onClick={onCancel} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={handleSubmit}
              disabled={code.length !== 6 || submitting}
              isLoading={submitting}
            >
              Validar Código
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5 items-center justify-center p-8 bg-cyber-success/5 border border-cyber-success/30 rounded-lg text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none bg-cyber-grid opacity-5" />

          <div className="p-4 rounded-full bg-cyber-success/15 border border-cyber-success/40 text-cyber-success mb-2 animate-bounce">
            <CheckCircle size={36} />
          </div>

          <div className="flex flex-col gap-1.5 select-none">
            <h4 className="text-base font-orbitron font-extrabold text-white tracking-widest uppercase">
              Código validado!
            </h4>
            <p className="text-xs font-mono text-cyber-success tracking-widest uppercase flex items-center gap-1.5 justify-center">
              <Users size={13} /> Missão cumprida
            </p>
            <p className="text-xs text-cyber-muted max-w-sm mt-1 leading-relaxed">
              Seus cupons já foram creditados — e seu amigo também ganhou os dele.
            </p>
          </div>

          <Button variant="primary" size="md" onClick={onCancel} className="mt-2">
            Voltar para Missões
          </Button>
        </div>
      )}
    </div>
  );
};
