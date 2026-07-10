import { create } from 'zustand';

// Store mínimo só pra avisar o Header "recarregue os tickets agora" assim que
// uma missão é concluída, sem esperar o polling periódico de 15s.
interface TicketRefreshState {
  version: number;
  trigger: () => void;
}

export const useTicketRefreshStore = create<TicketRefreshState>((set) => ({
  version: 0,
  trigger: () => set((s) => ({ version: s.version + 1 })),
}));
