import api from './api';
import type { TicketHistoryEntry, LeaderboardResponse } from '../types';

export const ticketService = {
  async getMyTicketHistory(campaignId: string): Promise<TicketHistoryEntry[]> {
    const response = await api.get<TicketHistoryEntry[]>(`/campaigns/${campaignId}/my-ticket-history`);
    return response.data;
  },

  // Top 10 da campanha + posição de quem está logado (participante ou admin,
  // já que o endpoint só exige um JWT válido).
  async getLeaderboard(campaignId: string): Promise<LeaderboardResponse> {
    const response = await api.get<LeaderboardResponse>(`/campaigns/${campaignId}/leaderboard`);
    return response.data;
  },

  // Mesmo top 10, sem exigir login — usado na landing page pra visitantes.
  async getPublicLeaderboard(campaignId: string): Promise<LeaderboardResponse> {
    const response = await api.get<LeaderboardResponse>(`/campaigns/${campaignId}/leaderboard/public`);
    return response.data;
  },
};
