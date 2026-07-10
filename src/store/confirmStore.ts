import { create } from 'zustand';

export type ConfirmVariant = 'danger' | 'primary' | 'secondary' | 'accent';

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  variant: ConfirmVariant;
  resolve: ((value: boolean) => void) | null;
}

export const useConfirmStore = create<ConfirmState>(() => ({
  isOpen: false,
  title: 'Confirmação',
  message: '',
  confirmLabel: 'Confirmar',
  cancelLabel: 'Cancelar',
  variant: 'danger',
  resolve: null,
}));
