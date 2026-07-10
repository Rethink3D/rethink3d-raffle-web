import { useConfirmStore, type ConfirmVariant } from '../store/confirmStore';

export interface ConfirmOptions {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
}

// Substitui window.confirm por um modal próprio da aplicação.
// Uso: const ok = await confirmDialog('Mensagem...', { title: 'Título', variant: 'danger' });
export const confirmDialog = (message: string, options: ConfirmOptions = {}): Promise<boolean> => {
  return new Promise((resolve) => {
    useConfirmStore.setState({
      isOpen: true,
      message,
      title: options.title ?? 'Confirmação',
      confirmLabel: options.confirmLabel ?? 'Confirmar',
      cancelLabel: options.cancelLabel ?? 'Cancelar',
      variant: options.variant ?? 'danger',
      resolve,
    });
  });
};
