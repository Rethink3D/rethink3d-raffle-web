import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/authStore';
import { getApiErrorMessage } from '../../utils/apiError';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { User, Phone, Mail, Globe, Lock } from 'lucide-react';
import agree from '../../assets/agree.gif';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const loginStore = useAuthStore((state) => state.login);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [instagram, setInstagram] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

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

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Insira um e-mail válido';
    }

    if (!pin) {
      errors.pin = 'O PIN de 4 dígitos é obrigatório';
    } else if (!/^\d{4}$/.test(pin)) {
      errors.pin = 'O PIN deve ter exatamente 4 dígitos';
    }

    if (pin !== confirmPin) {
      errors.confirmPin = 'Os códigos PIN não coincidem';
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
        name,
        phone: cleanPhone,
        pin,
        email: email ? email : undefined,
        instagram: instagram ? instagram : undefined,
      });

      // Login using zustand store
      loginStore(response.token, response.user, 'participant');
      
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
          <span className="text-xs font-mono text-cyber-primary tracking-[0.2em] uppercase animate-pulse mt-2">
            INICIALIZANDO REGISTRO...
          </span>
        </div>
      )}
      <Card 
        title="CRIAR SAVEPOINT" 
        subtitle="CRIE SEU AVATAR E INICIE A JORNADA"
        variant="primary"
        glow
      >

        {serverError && (
          <div className="mb-4 bg-cyber-danger/10 border border-cyber-danger rounded p-3 text-xs font-mono text-cyber-danger uppercase">
            ⚡ CADASTRO REJEITADO // {serverError}
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
            statusIndicator={name.trim().length >= 3 ? '[SYS_READY]' : '[SYS_WAITING]'}
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
            statusIndicator={phone.replace(/\D/g, '').length === 11 ? '[SYS_READY]' : '[SYS_WAITING]'}
            required
          />

          {/* Email Input (Optional) */}
          <Input
            label="E-MAIL"
            type="email"
            placeholder="ex: deckard@rethink3d.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errorMap.email}
            icon={<Mail size={16} />}
            statusIndicator={!email.trim() ? '[SYS_OPTIONAL]' : (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '[SYS_READY]' : '[SYS_WAITING]')}
          />

          {/* Instagram Input (Optional) */}
          <Input
            label="PERFIL DO INSTAGRAM"
            type="text"
            placeholder="ex: rethink3d_prints"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            error={errorMap.instagram}
            icon={<Globe size={16} />}
            statusIndicator={!instagram.trim() ? '[SYS_OPTIONAL]' : '[SYS_READY]'}
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
              statusIndicator={pin.length === 4 ? '[SYS_READY]' : '[SYS_WAITING]'}
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
              statusIndicator={confirmPin === pin && pin.length === 4 ? '[SYS_READY]' : '[SYS_WAITING]'}
              required
            />
          </div>

          <div className="mt-4 flex flex-col gap-4">
            <Button 
              type="submit" 
              variant="primary" 
              fullWidth 
              isLoading={isLoading}
              icon={<img src={agree} alt="Agree" className="w-5 h-5 object-contain" />}
            >
              CRIAR PERSONAGEM
            </Button>

            <div className="text-center text-xs font-mono text-cyber-muted mt-2 uppercase">
              Já possui save?{' '}
              <Link to="/login" className="text-cyber-secondary hover:underline tracking-wide">
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
