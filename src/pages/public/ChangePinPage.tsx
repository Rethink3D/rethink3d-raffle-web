import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/authStore';
import { getApiErrorMessage } from '../../utils/apiError';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { copy } from '../../theme/copy';
import { Lock } from 'lucide-react';
import { ThemeAsset } from '../../theme/assets';

export const ChangePinPage: React.FC = () => {
  const navigate = useNavigate();
  const setMustChangePin = useAuthStore((state) => state.setMustChangePin);
  const mustChangePin = useAuthStore((state) => state.mustChangePin);

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMap, setErrorMap] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!/^\d{4}$/.test(currentPin)) {
      errors.currentPin = 'Informe o PIN atual de 4 dígitos';
    }

    if (!/^\d{4}$/.test(newPin)) {
      errors.newPin = 'O novo PIN deve ter exatamente 4 dígitos';
    } else if (/^(0000|1234|1111|2222|3333|4444|5555|6666|7777|8888|9999)$/.test(newPin)) {
      errors.newPin = 'O novo PIN não pode ser uma sequência óbvia';
    }

    if (newPin !== confirmPin) {
      errors.confirmPin = 'Os códigos PIN não coincidem';
    }

    setErrorMap(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await authService.changePin({ currentPin, newPin });
      setMustChangePin(false);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error('Change PIN failed:', err);
      setServerError(getApiErrorMessage(err, 'Falha ao trocar o PIN.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      {isLoading && (
        <div className="fixed inset-0 bg-black/85 flex flex-col items-center justify-center z-50 pointer-events-auto select-none">
          <ThemeAsset kind="loader" size={120} />
          <span className="text-xs font-mono text-brand-secondary tracking-[0.2em] uppercase animate-pulse mt-2">
            ATUALIZANDO CREDENCIAIS...
          </span>
        </div>
      )}
      <Card
        title="TROCA DE PIN OBRIGATÓRIA"
        subtitle="SEU PIN FOI REDEFINIDO PELO ADMINISTRADOR"
        variant="secondary"
        glow
      >
        {mustChangePin && (
          <div className="mb-4 bg-brand-primary/10 border border-brand-primary/40 rounded p-3 text-xs font-mono text-brand-text uppercase">
            ⚠ Por segurança, defina um novo PIN antes de continuar.
          </div>
        )}

        {serverError && (
          <div className="mb-4 bg-brand-danger/10 border border-brand-danger rounded p-3 text-xs font-mono text-brand-danger uppercase">
            ⚡ ERRO // {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-mono">
          <Input
            label="PIN ATUAL (TEMPORÁRIO)"
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="••••"
            value={currentPin}
            onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
            error={errorMap.currentPin}
            icon={<Lock size={16} />}
            statusIndicator={currentPin.length === 4 ? copy.sysReady : copy.sysWaiting}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="NOVO PIN"
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              error={errorMap.newPin}
              icon={<Lock size={16} />}
              statusIndicator={newPin.length === 4 ? copy.sysReady : copy.sysWaiting}
              required
            />

            <Input
              label="CONFIRMAR NOVO PIN"
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              error={errorMap.confirmPin}
              icon={<Lock size={16} />}
              statusIndicator={confirmPin === newPin && newPin.length === 4 ? copy.sysReady : copy.sysWaiting}
              required
            />
          </div>

          <div className="mt-4 flex flex-col gap-4">
            <Button
              type="submit"
              variant="secondary"
              fullWidth
              isLoading={isLoading}
              icon={<Lock size={16} />}
            >
              SALVAR NOVO PIN
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ChangePinPage;
