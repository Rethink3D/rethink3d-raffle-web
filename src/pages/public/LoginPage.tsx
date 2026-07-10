import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/authStore';
import { getApiErrorMessage } from '../../utils/apiError';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Phone, Lock, LogIn } from 'lucide-react';
import nika from '../../assets/nika.gif';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const loginStore = useAuthStore((state) => state.login);

  // Form states
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMap, setErrorMap] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!phone.trim()) {
      errors.phone = 'Número de telefone é obrigatório';
    }

    if (!pin) {
      errors.pin = 'Código PIN é obrigatório';
    } else if (!/^\d{4}$/.test(pin)) {
      errors.pin = 'O PIN deve ter exatamente 4 dígitos';
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
      // Envia apenas os dígitos do telefone para o backend
      const cleanPhone = phone.replace(/\D/g, '');
      const response = await authService.login({ phone: cleanPhone, pin });
      
      // Store credentials and login type
      loginStore(response.token, response.user, 'participant');

      // Se o admin resetou o PIN do participante, força a troca antes de liberar o resto do app
      const mustChangePin = (response.user as { mustChangePinOnNextLogin?: boolean }).mustChangePinOnNextLogin;
      navigate(mustChangePin ? '/change-pin' : '/dashboard');
    } catch (err: any) {
      console.error('Login failed:', err);
      setServerError(getApiErrorMessage(err, 'Acesso Negado: Telefone ou PIN inválido.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      {/* Overlay de carregamento com a Pokeball */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/85 flex flex-col items-center justify-center z-50 pointer-events-auto select-none">
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
          <span className="text-xs font-mono text-cyber-secondary tracking-[0.2em] uppercase animate-pulse mt-2">
            AUTENTICANDO CREDENCIAIS...
          </span>
        </div>
      )}
      <Card 
        title="CONTINUAR HISTÓRIA" 
        subtitle="CONTINUE DE ONDE PAROU"
        variant="secondary"
        glow
      >

        {serverError && (
          <div className="mb-4 bg-cyber-danger/10 border border-cyber-danger rounded p-3 text-xs font-mono text-cyber-danger uppercase">
            ⚡ ERRO // {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-mono">
          {/* Phone Input */}
          <Input
            label="TELEFONE REGISTRADO"
            type="tel"
            placeholder="ex: (11) 99999-9999"
            value={phone}
            onChange={handlePhoneChange}
            error={errorMap.phone}
            icon={<Phone size={16} />}
            statusIndicator={phone.replace(/\D/g, '').length === 11 ? '[SYS_READY]' : '[SYS_WAITING]'}
            required
          />

          {/* PIN Input */}
          <Input
            label="PIN SECRETO"
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            error={errorMap.pin}
            icon={<Lock size={16} />}
            statusIndicator={pin.length === 4 ? '[SYS_READY]' : '[SYS_WAITING]'}
            required
          />

          <div className="mt-6 flex flex-col gap-4 relative">
            {/* Gatinho dormindo (Nika) posicionado acima e à direita do botão */}
            <img 
              src={nika} 
              alt="Gatinho Nika Dormindo" 
              className="absolute bottom-full right-2 w-14 h-auto pointer-events-none select-none z-20 mb-[-20px]"
              draggable={false}
            />
            <Button 
              type="submit" 
              variant="secondary" 
              fullWidth 
              isLoading={isLoading}
              icon={<LogIn size={16} />}
            >
              RETORNAR AO JOGO
            </Button>

            <div className="flex justify-center items-center gap-2 mt-4 text-xs font-mono text-cyber-muted uppercase">
              <span>
                SEM SAVE?{' '}
                <Link to="/register" className="text-cyber-primary hover:underline font-bold">
                  CRIAR NOVO &gt;
                </Link>
              </span>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;
