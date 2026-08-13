import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/authStore';
import { getApiErrorMessage } from '../../utils/apiError';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { copy } from '../../theme/copy';
import { User, Phone, Lock, MapPin } from 'lucide-react';
import agree from '../../assets/agree.gif';
import { ThemeAsset } from '../../theme/assets';
import { THEME } from '../../theme/current';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const loginStore = useAuthStore((state) => state.login);
  const setSignupBonusPopup = useAuthStore((state) => state.setSignupBonusPopup);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [standCode, setStandCode] = useState('');

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMap, setErrorMap] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!name.trim()) {
      errors.name = 'Nome é obrigatório';
    }
    
    if (!phone.trim()) {
      errors.phone = 'Número de telefone é obrigatório';
    } else {
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length !== 11) {
        errors.phone = 'O telefone deve conter DDD + 9 dígitos (total de 11 números)';
      }
    }

    if (!pin) {
      errors.pin = 'O PIN de 4 dígitos é obrigatório';
    } else if (!/^\d{4}$/.test(pin)) {
      errors.pin = 'O PIN deve ter exatamente 4 dígitos';
    }

    if (pin !== confirmPin) {
      errors.confirmPin = 'Os códigos PIN não coincidem';
    }

    if (!/^\d{4}$/.test(standCode)) {
      errors.standCode = 'Pegue o código de 4 dígitos na tela do estande';
    }

    setErrorMap(errors);
    return Object.keys(errors).length === 0;
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const limited = digits.slice(0, 11);
    if (limited.length <= 2) {
      return limited.length > 0 ? `(${limited}` : '';
    }
    if (limited.length <= 7) {
      return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
    }
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const response = await authService.register({
        standCode,
        name,
        phone: cleanPhone,
        pin,
      });

      // Login using zustand store
      loginStore(response.token, response.user, 'participant');

      // Se veio bônus de cadastro, sinaliza pro dashboard mostrar o popup de
      // boas-vindas assim que carregar.
      if (response.signupBonus) {
        setSignupBonusPopup(response.signupBonus);
      }

      // Redirect to participant dashboard
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Registration failed:', err);
      setServerError(getApiErrorMessage(err, 'Falha no registro. Verifique os dados e tente novamente.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8">
      {/* Overlay de carregamento com a Pokeball */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/85 flex flex-col items-center justify-center z-50 pointer-events-auto select-none">
          <ThemeAsset kind="loader" size={120} />
          <span className="text-xs font-mono text-brand-primary tracking-[0.2em] uppercase animate-pulse mt-2">
            {copy.registerOverlay}
          </span>
        </div>
      )}
      <Card 
        title={copy.registerTitle}
        subtitle={copy.registerSubtitle}
        variant="primary"
        glow
      >

        {serverError && (
          <div className="mb-4 bg-brand-danger/10 border border-brand-danger rounded p-3 text-xs font-mono text-brand-danger uppercase">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-mono">
          {/* Name Input */}
          <Input
            label="NOME"
            type="text"
            placeholder="ex: Deckard Shaw"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errorMap.name}
            icon={<User size={16} />}
            statusIndicator={name.trim().length >= 3 ? copy.sysReady : copy.sysWaiting}
            required
          />

          {/* Phone Input */}
          <Input
            label="TELEFONE"
            type="tel"
            placeholder="ex: (11) 99999-9999"
            value={phone}
            onChange={handlePhoneChange}
            error={errorMap.phone}
            icon={<Phone size={16} />}
            statusIndicator={phone.replace(/\D/g, '').length === 11 ? copy.sysReady : copy.sysWaiting}
            required
          />

          {/* PIN Input */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="PIN DE 4 DÍGITOS"
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              error={errorMap.pin}
              icon={<Lock size={16} />}
              statusIndicator={pin.length === 4 ? copy.sysReady : copy.sysWaiting}
              required
            />

            <Input
              label="CONFIRMAR PIN"
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              error={errorMap.confirmPin}
              icon={<Lock size={16} />}
              statusIndicator={confirmPin === pin && pin.length === 4 ? copy.sysReady : copy.sysWaiting}
              required
            />
          </div>

          <div className="mt-2 rounded-lg border border-brand-secondary/30 bg-brand-secondary/5 p-3 flex flex-col gap-2">
            <span className="text-xs font-bold text-brand-text flex items-center gap-1.5">
              <MapPin size={13} className="shrink-0" />
              Código do estande
            </span>
            <p className="text-[11px] text-brand-muted leading-relaxed">
              O cadastro só é liberado para quem está no evento. Pegue o código
              de 4 dígitos na tela do nosso estande — ele muda de tempos em
              tempos, então use o que estiver na tela agora.
            </p>
            <Input
              label="Código de 4 dígitos"
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="0000"
              value={standCode}
              onChange={(e) => setStandCode(e.target.value.replace(/\D/g, ''))}
              error={errorMap.standCode}
              icon={<MapPin size={16} />}
              statusIndicator={standCode.length === 4 ? copy.sysReady : copy.sysWaiting}
              required
            />
          </div>

          <div className="mt-4 flex flex-col gap-4">
            <Button
              type="submit" 
              variant="primary" 
              fullWidth 
              isLoading={isLoading}
              icon={THEME === 'cyber' ? <img src={agree} alt="" className="w-5 h-5 object-contain" /> : undefined}
            >
              {copy.registerSubmit}
            </Button>

            <div className="text-center text-xs font-mono text-brand-muted mt-2 uppercase">
              {copy.registerHasAccount}{' '}
              <Link to="/login" className="text-brand-secondary hover:underline tracking-wide">
                Acessar &gt;
              </Link>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default RegisterPage;
