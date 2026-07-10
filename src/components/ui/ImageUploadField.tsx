import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { Input } from './Input';
import { Button } from './Button';
import { uploadService } from '../../services/upload.service';
import { getApiErrorMessage } from '../../utils/apiError';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
}

// Campo de imagem reutilizável: aceita colar uma URL diretamente ou enviar um
// arquivo (que sobe pro S3 via /uploads/image e preenche a URL automaticamente).
export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Formato inválido. Use JPG, PNG ou WebP.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('Arquivo muito grande (máximo 5MB).');
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const { url } = await uploadService.uploadImage(file);
      onChange(url);
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Falha ao enviar imagem.'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            label={label}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="secondary"
          size="md"
          icon={<Upload size={14} />}
          isLoading={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          Enviar
        </Button>
      </div>

      {error && (
        <span className="text-xs font-rajdhani font-semibold text-cyber-danger">⚠ {error}</span>
      )}

      {value && (
        <div className="rounded border border-cyber-border p-2 bg-black/45 flex flex-col gap-2">
          <span className="text-[10px] font-mono text-cyber-muted uppercase tracking-wider">Pré-visualização:</span>
          <img
            src={value}
            alt="Preview"
            className="max-h-40 w-full object-contain rounded"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://placehold.co/400x200?text=Link+Invalido';
            }}
          />
        </div>
      )}
    </div>
  );
};
