import React, { useState, useRef } from 'react';
import { Upload, FileImage, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { getApiErrorMessage } from '../../utils/apiError';

interface PrintUploadProps {
  missionId: string;
  missionTitle: string;
  onUpload: (file: File) => Promise<void>;
  onCancel: () => void;
}

export const PrintUpload: React.FC<PrintUploadProps> = ({
  missionId,
  missionTitle,
  onUpload,
  onCancel,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  const validateFile = (selectedFile: File): boolean => {
    setError(null);

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError('Tipo de arquivo inválido. Apenas imagens JPEG, PNG e WebP são permitidas.');
      return false;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('O arquivo é muito grande. O tamanho máximo permitido é de 5MB.');
      return false;
    }

    return true;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleUploadSubmit = async () => {
    if (!file) return;

    console.log('Uploading proof for mission:', missionId);
    setUploading(true);
    setError(null);
    try {
      await onUpload(file);
      setUploadSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(getApiErrorMessage(err, 'Falha ao enviar comprovação. Por favor, tente novamente.'));
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setError(null);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full flex flex-col gap-4 font-body text-brand-text">
      {/* Header Info */}
      <div className="flex flex-col mb-1 select-none">
        <span className="text-[10px] font-mono tracking-widest text-brand-secondary uppercase">
          // INTERFACE DE ENVIO DE COMPROVAÇÃO
        </span>
        <h3 className="text-base font-display font-extrabold text-white uppercase tracking-wider mt-0.5">
          {missionTitle}
        </h3>
      </div>

      {!uploadSuccess ? (
        <div className="flex flex-col gap-4">
          {/* Drag & Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`
              relative min-h-[220px] rounded-lg border-2 border-dashed flex flex-col items-center justify-center p-6 text-center transition-all duration-300
              ${dragActive 
                ? 'border-brand-secondary bg-brand-secondary/5 glow-secondary' 
                : 'border-brand-border bg-brand-surface/40 hover:border-brand-secondary/40 hover:bg-brand-surface/60'}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={ALLOWED_TYPES.join(',')}
              onChange={handleFileChange}
              disabled={uploading}
            />

            {/* Background Cyber Grid */}
            <div className="absolute inset-0 pointer-events-none bg-cyber-grid opacity-5" />

            {!file ? (
              <div className="flex flex-col items-center gap-3 relative z-10 select-none">
                <div className="p-4 rounded bg-brand-border/40 border border-brand-border/80 text-brand-muted animate-float">
                  <Upload size={32} />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-ui font-bold text-white tracking-wide">
                    ARRASTE E SOLTE A IMAGEM AQUI OU{' '}
                    <span 
                      onClick={onButtonClick} 
                      className="text-brand-secondary hover:text-white underline cursor-pointer transition-colors"
                    >
                      PROCURAR ARQUIVOS
                    </span>
                  </p>
                  <p className="text-[10px] font-mono text-brand-muted uppercase tracking-wider">
                    JPEG, PNG, WEBP (MÁX 5.0 MB)
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-md flex flex-col items-center gap-4 relative z-10">
                <div className="w-full flex items-center gap-3 bg-brand-surface border border-brand-border rounded p-3 select-none">
                  <div className="p-2.5 rounded bg-brand-secondary/10 border border-brand-secondary/30 text-brand-secondary">
                    <FileImage size={24} />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-ui font-bold text-white truncate uppercase tracking-wider">
                      {file.name}
                    </p>
                    <p className="text-xs font-mono text-brand-muted">
                      {formatBytes(file.size)}
                    </p>
                  </div>
                  <button
                    onClick={removeFile}
                    disabled={uploading}
                    className="p-1 rounded hover:bg-brand-danger/10 text-brand-muted hover:text-brand-danger transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {uploading && (
                  <div className="w-full flex flex-col gap-1">
                    <div className="flex justify-between text-xs font-mono text-brand-secondary">
                      <span>ENVIANDO_DADOS...</span>
                      <span className="animate-pulse">SYS_OCUPADO</span>
                    </div>
                    {/* Barra indeterminada (não temos progresso real de upload) —
                        antes ficava travada numa largura fixa de 60%, o que parecia
                        que o envio tinha travado em vez de estar em andamento. */}
                    <div className="w-full h-1.5 bg-brand-border rounded overflow-hidden">
                      <div className="h-full w-1/3 bg-brand-secondary rounded animate-upload-indeterminate" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Validation Error Message */}
          {error && (
            <div className="flex items-start gap-2 bg-brand-danger/10 border border-brand-danger/30 rounded p-3 text-brand-danger text-xs font-ui font-bold uppercase tracking-wider">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span>AVISO_DE_SEGURANÇA // {error}</span>
            </div>
          )}

          {/* Action Row */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="danger"
              size="md"
              onClick={onCancel}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={handleUploadSubmit}
              disabled={!file || uploading}
              isLoading={uploading}
            >
              Enviar Comprovação
            </Button>
          </div>
        </div>
      ) : (
        /* Success State Display */
        <div className="flex flex-col gap-5 items-center justify-center p-8 bg-brand-success/5 border border-brand-success/30 rounded-lg text-center relative overflow-hidden">
          {/* Decorative scanline success overlay */}
          <div className="absolute inset-0 pointer-events-none bg-cyber-grid opacity-5" />
          
          <div className="p-4 rounded-full bg-brand-success/15 border border-brand-success/40 text-brand-success mb-2 animate-bounce">
            <CheckCircle size={36} />
          </div>

          <div className="flex flex-col gap-1.5 select-none">
            <h4 className="text-base font-display font-extrabold text-white tracking-widest uppercase">
              ENVIO REALIZADO COM SUCESSO
            </h4>
            <p className="text-xs font-mono text-brand-success tracking-widest uppercase">
              MISSÃO CUMPRIDA
            </p>
            <p className="text-xs text-brand-muted max-w-sm mt-1 leading-relaxed">
              Seu comprovante foi enviado e seus tickets já foram creditados na sua conta.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={onCancel}
            className="mt-2"
          >
            Voltar para Missões
          </Button>
        </div>
      )}
    </div>
  );
};
