import { create } from 'zustand';
import type { DrawStatus, Prize } from '../types';

export interface DrawWinner {
  userId: string;
  name: string;
  winnerName?: string;
  tickets: number;
}

export interface DrawDetails {
  drawId: string | null;
  campaignName: string | null;
  prize: Prize | null;
}

export interface DrawState {
  // State
  status: DrawStatus | null;
  drawId: string | null;
  campaignName: string | null;
  prize: Prize | null;
  winner: DrawWinner | null;
  isSpinning: boolean;
  participantCount: number;
  onlineCount: number;

  // Actions
  setStatus: (status: DrawStatus | null) => void;
  setDrawDetails: (details: DrawDetails) => void;
  setWinner: (winner: DrawWinner | null) => void;
  setIsSpinning: (isSpinning: boolean) => void;
  setStats: (stats: { participantCount?: number; onlineCount?: number }) => void;
  clearDraw: () => void;
}

export const useDrawStore = create<DrawState>((set) => ({
  // Initial State
  status: null,
  drawId: null,
  campaignName: null,
  prize: null,
  winner: null,
  isSpinning: false,
  participantCount: 0,
  onlineCount: 0,

  // Actions
  setStatus: (status) => set({ status }),
  setDrawDetails: (details) =>
    set({
      drawId: details.drawId,
      campaignName: details.campaignName,
      prize: details.prize,
    }),
  setWinner: (winner) => set({ winner }),
  setIsSpinning: (isSpinning) => set({ isSpinning }),
  setStats: (stats) =>
    set((state) => ({
      participantCount:
        stats.participantCount !== undefined ? stats.participantCount : state.participantCount,
      onlineCount: stats.onlineCount !== undefined ? stats.onlineCount : state.onlineCount,
    })),
  clearDraw: () =>
    set({
      status: null,
      drawId: null,
      campaignName: null,
      prize: null,
      winner: null,
      isSpinning: false,
      participantCount: 0,
      onlineCount: 0,
    }),
}));
