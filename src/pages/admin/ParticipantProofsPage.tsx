import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { adminService, type AdminProofWithUrl } from '../../services/admin.service';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, ExternalLink, Calendar, RefreshCw, Image as ImageIcon } from 'lucide-react';

export const ParticipantProofsPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Nome do participante já vem da lista (state), evitando um fetch extra
  // só pra exibir o título — se faltar (ex: recarregou a página), mostra genérico.
  const participantName = (location.state as { participantName?: string } | null)?.participantName;

  const [proofs, setProofs] = useState<AdminProofWithUrl[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProofs = async () => {
    if (!userId) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await adminService.getParticipantProofs(userId);
      setProofs(data);
    } catch (err) {
      console.error('Failed to load participant proofs:', err);
      setError('Erro ao obter os comprovantes deste participante.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProofs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return (
    <div className="space-y-6 font-body">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-border/40 pb-5">
        <div className="flex items-center gap-4">
          <Button variant="secondary" size="sm" icon={<ArrowLeft size={14} />} onClick={() => navigate('/admin/participants')}>
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-display font-extrabold text-white tracking-widest uppercase">
              Comprovantes
            </h1>
            <p className="text-xs font-ui font-bold text-brand-secondary tracking-widest mt-1">
              {participantName ? `Enviados por ${participantName}` : 'Comprovantes do participante'}
            </p>
          </div>
        </div>
        <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={loadProofs}>
          Recarregar
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-brand-danger/10 border border-brand-danger/30 text-brand-danger text-xs font-ui font-bold uppercase rounded tracking-wider">
          ⚠ {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-20 text-brand-muted font-mono space-y-4">
          <RefreshCw size={24} className="animate-spin text-brand-primary" />
          <span>CARREGANDO COMPROVANTES...</span>
        </div>
      ) : proofs.length === 0 ? (
        <Card variant="default">
          <div className="text-center py-10 flex flex-col items-center gap-3 font-mono text-brand-muted">
            <ImageIcon size={32} className="text-brand-muted" />
            NENHUM COMPROVANTE FOI ENVIADO POR ESTE USUÁRIO AINDA.
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {proofs.map((proof) => (
            <div
              key={proof.id}
              className="border border-brand-border/80 bg-black/35 rounded overflow-hidden flex flex-col group hover:border-brand-primary/60 transition-all duration-300"
            >
              {/* Photo container */}
              <div className="aspect-video relative overflow-hidden bg-black/60 flex items-center justify-center border-b border-brand-border/60">
                {proof.mimeType.startsWith('image/') ? (
                  <img
                    src={proof.signedUrl}
                    alt={proof.mission?.title || 'Comprovante'}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="p-4 text-center font-mono text-xs text-brand-muted">
                    Arquivo: {proof.mimeType}
                  </div>
                )}
                <a
                  href={proof.signedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute top-2 right-2 p-1.5 rounded bg-black/70 border border-brand-border hover:border-brand-secondary text-white transition-colors cursor-pointer"
                  title="Abrir imagem original"
                >
                  <ExternalLink size={12} />
                </a>
              </div>

              {/* Meta details */}
              <div className="p-3 space-y-1.5 text-[11px] font-ui font-semibold text-brand-muted">
                <div className="text-white font-bold truncate text-xs">
                  {proof.mission?.title || 'Missão Desconhecida'}
                </div>
                <div className="flex justify-between font-mono text-[9px]">
                  <span>FORMATO: {proof.mimeType.replace('image/', '').toUpperCase()}</span>
                  <span>TAMANHO: {(proof.fileSize / 1024).toFixed(1)} KB</span>
                </div>
                <div className="flex justify-between items-center pt-1.5 border-t border-brand-border/30">
                  <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(proof.uploadedAt).toLocaleDateString('pt-BR')}</span>
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-brand-success/15 border border-brand-success/40 text-brand-success">
                    RECEBIDO
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ParticipantProofsPage;
