import { create } from 'zustand';
import type { DrawStatus } from '../types';

export interface DrawParticipantPreview {
  userId: string;
  name: string;
  tickets: number;
}

export interface DrawWinnerPrize {
  id: string;
  name: string;
  imageUrl?: string | null;
}

export interface DrawWinner {
  winnerId: string;
  winnerName: string;
  winnerTickets: number;
  prize: DrawWinnerPrize | null;
  totalTickets: number;
  totalParticipants: number;
  sessionId?: string;
}

export interface DrawState {
  drawId: string | null;
  status: DrawStatus | null;
  sessionId: string | null;

  participants: DrawParticipantPreview[];
  totalTickets: number;
  othersTickets: number;
  othersCount: number;

  isSpinning: boolean;
  winner: DrawWinner | null;
  onlineCount: number;

  // Preenchido quando a sessão termina sozinha (cofre esgotado ou ordem
  // concluída) — distingue de um encerramento manual pelo admin.
  sessionEndedReason: 'exhausted' | 'manual' | null;

  setDrawStarted: (data: { drawId: string; sessionId?: string }) => void;
  setParticipants: (data: { participants: DrawParticipantPreview[]; totalTickets: number; othersTickets: number; othersCount: number }) => void;
  setWinner: (winner: DrawWinner) => void;
  setSessionEnded: (reason: 'exhausted' | 'manual') => void;
  setOnlineCount: (count: number) => void;
  clearDraw: () => void;
}

const initialDrawFields = {
  drawId: null,
  status: null,
  sessionId: null,
  participants: [],
  totalTickets: 0,
  othersTickets: 0,
  othersCount: 0,
  isSpinning: false,
  winner: null,
  sessionEndedReason: null,
};

export const useDrawStore = create<DrawState>((set) => ({
  ...initialDrawFields,
  onlineCount: 0,

  setDrawStarted: (data) =>
    set({
      drawId: data.drawId,
      sessionId: data.sessionId ?? null,
      status: 'IN_PROGRESS',
      isSpinning: true,
      winner: null,
      participants: [],
      totalTickets: 0,
      othersTickets: 0,
      othersCount: 0,
      sessionEndedReason: null,
    }),

  setParticipants: (data) =>
    set({
      participants: data.participants,
      totalTickets: data.totalTickets,
      othersTickets: data.othersTickets,
      othersCount: data.othersCount,
    }),

  setWinner: (winner) =>
    set({
      winner,
      isSpinning: false,
      status: 'COMPLETED',
    }),

  setSessionEnded: (reason) => set({ sessionEndedReason: reason }),

  setOnlineCount: (onlineCount) => set({ onlineCount }),

  clearDraw: () => set({ ...initialDrawFields }),
}));
