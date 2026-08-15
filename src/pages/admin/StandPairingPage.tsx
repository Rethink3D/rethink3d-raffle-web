import React, { useState } from 'react';
import { MonitorSmartphone, ShieldCheck } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { standPairingService } from '../../services/standPairing.service';
import { getApiErrorMessage } from '../../utils/apiError';

const USER_CODE_LENGTH = 6;

const normalize = (raw: string): string =>
  raw.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, USER_CODE_LENGTH);

export const StandPairingPage: React.FC = () => {
  const [userCode, setUserCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approved, setApproved] = useState(false);

  const canSubmit = userCode.length === USER_CODE_LENGTH && !isLoading;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsLoading(true);
    setError(null);
    try {
      await standPairingService.approve(userCode);
      setApproved(true);
      setUserCode('');
    } catch (err) {
      setApproved(false);
      setError(
        getApiErrorMessage(err, 'Não foi possível liberar a tela do estande.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <MonitorSmartphone className="w-7 h-7 text-brand-primary shrink-0" />
        <div>
          <h1 className="text-2xl font-display font-extrabold text-brand-strong leading-tight">
            Liberar tela do estande
          </h1>
          <p className="text-sm text-brand-muted">
            Informe o código exibido na TV para liberá-la por 24 horas.
          </p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-1">
          <Input
            label="Código de liberação"
            placeholder="K7M2QP"
            value={userCode}
            onChange={(event) => {
              setUserCode(normalize(event.target.value));
              setApproved(false);
              setError(null);
            }}
            autoFocus
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            inputMode="text"
            statusIndicator={`${userCode.length}/${USER_CODE_LENGTH}`}
            error={error ?? undefined}
            className="text-center text-2xl font-display font-black tracking-[0.3em]"
          />

          {error && (
            <p className="text-sm text-brand-danger leading-snug">{error}</p>
          )}

          {approved && (
            <div className="flex items-start gap-2 rounded-lg border border-brand-primary/40 bg-brand-highlight p-3">
              <ShieldCheck className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
              <p className="text-sm text-brand-text leading-snug">
                Tela liberada. Em alguns segundos a TV sai do bloqueio sozinha.
              </p>
            </div>
          )}

          <Button type="submit" fullWidth isLoading={isLoading} disabled={!canSubmit}>
            Liberar estande
          </Button>
        </form>
      </Card>

      <p className="text-xs text-brand-muted leading-snug">
        O código muda a cada 5 minutos. Se expirar, a TV mostra um novo sozinha.
      </p>
    </div>
  );
};

export default StandPairingPage;
