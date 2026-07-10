import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useConfirmStore } from '../../store/confirmStore';
import { Modal } from './Modal';
import { Button } from './Button';

// Host único do modal de confirmação global — renderizado uma vez na raiz do app.
// Páginas disparam o modal chamando confirmDialog() (src/utils/confirm.ts) em vez de window.confirm.
export const ConfirmDialogHost: React.FC = () => {
  const { isOpen, title, message, confirmLabel, cancelLabel, variant, resolve } = useConfirmStore();

  const handle = (result: boolean) => {
    resolve?.(result);
    useConfirmStore.setState({ isOpen: false, resolve: null });
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={() => handle(false)} title={title} size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3 text-sm font-inter text-cyber-text">
          <AlertTriangle
            size={18}
            className={`shrink-0 mt-0.5 ${variant === 'danger' ? 'text-cyber-danger' : 'text-cyber-accent'}`}
          />
          <p>{message}</p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-cyber-border/40">
          <Button type="button" variant="secondary" onClick={() => handle(false)}>
            {cancelLabel}
          </Button>
          <Button type="button" variant={variant === 'secondary' ? 'primary' : variant} onClick={() => handle(true)}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
