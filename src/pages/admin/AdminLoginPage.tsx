import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/auth.service';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Shield, Lock, Mail } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const loginStore = useAuthStore((state) => state.login);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await authService.adminLogin({ email, password });
      loginStore(response.token, response.user, response.role);
      navigate('/admin');
    } catch (err: any) {
      console.error('Admin login error:', err);
      const msg = err.response?.data?.message || 'Falha na autenticação do painel administrativo.';
      setError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4 font-inter">
      <div className="w-full max-w-md">
        <Card
          variant="primary"
          glow={true}
          title="ACESSO RESTRITO"
          subtitle="AUTENTICAÇÃO DE OPERADOR"
          headerExtra={
            <div className="p-1 rounded bg-cyber-primary/10 text-cyber-primary border border-cyber-primary/30">
              <Shield size={16} />
            </div>
          }
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">

            {error && (
              <div className="p-3 bg-cyber-danger/10 border border-cyber-danger/50 text-cyber-danger text-xs font-rajdhani font-semibold tracking-wider uppercase rounded">
                ⚠ ACCESS_DENIED // {error}
              </div>
            )}

            <Input
              label="E-mail do Administrador"
              placeholder="operator@rethink3d.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail size={16} className="text-cyber-primary" />}
              required
              disabled={isLoading}
              statusIndicator="[SYS_EMAIL]"
            />

            <Input
              label="Chave de Acesso (Senha)"
              placeholder="••••••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={16} className="text-cyber-primary" />}
              required
              disabled={isLoading}
              statusIndicator="[SYS_PASSKEY]"
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
              icon={<Shield size={16} />}
              className="mt-2"
            >
              Autenticar
            </Button>

            <div className="text-center mt-2">
              <span className="text-[10px] font-mono text-cyber-muted uppercase tracking-widest">
                Sessões administrativas são auditadas e registradas.
              </span>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AdminLoginPage;
