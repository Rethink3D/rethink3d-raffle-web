import api from './api';
import type { Draw, DrawSession, SessionOrderStrategy } from '../types';

export const drawService = {
  // Sorteio único e avulso: sorteia o ganhador e o prêmio do cofre juntos.
  async startDraw(campaignId: string): Promise<Draw> {
    const response = await api.post<Draw>('/draws', { campaignId });
    return response.data;
  },

  async executeDraw(drawId: string): Promise<Draw> {
    const response = await api.post<Draw>(`/draws/${drawId}/execute`);
    return response.data;
  },

  async cancelDraw(drawId: string): Promise<Draw> {
    const response = await api.post<Draw>(`/draws/${drawId}/cancel`);
    return response.data;
  },

  async getHistory(campaignId?: string): Promise<Draw[]> {
    if (campaignId) {
      const response = await api.get<Draw[]>(`/draws/campaign/${campaignId}`);
      return response.data;
    }
    const response = await api.get<Draw[]>('/draws/history');
    return response.data;
  },

  // Itens já sorteados da campanha (só COMPLETED), pra exibir na dashboard do participante.
  async getCompletedHistory(campaignId: string): Promise<Draw[]> {
    const response = await api.get<Draw[]>(`/draws/campaign/${campaignId}/history`);
    return response.data;
  },

  // ─── Sorteio em Cadeia (sessão) ───────────────────────────────────────────
  async startSession(campaignId: string, orderStrategy: SessionOrderStrategy, prizeOrder?: string[]): Promise<DrawSession> {
    const response = await api.post<DrawSession>('/draws/sessions', { campaignId, orderStrategy, prizeOrder });
    return response.data;
  },

  async drawNextInSession(sessionId: string): Promise<Draw> {
    const response = await api.post<Draw>(`/draws/sessions/${sessionId}/draw-next`);
    return response.data;
  },

  async endSession(sessionId: string): Promise<DrawSession> {
    const response = await api.post<DrawSession>(`/draws/sessions/${sessionId}/end`);
    return response.data;
  },

  async getSession(sessionId: string): Promise<DrawSession> {
    const response = await api.get<DrawSession>(`/draws/sessions/${sessionId}`);
    return response.data;
  },

  async getSessionsByCampaign(campaignId: string): Promise<DrawSession[]> {
    const response = await api.get<DrawSession[]>(`/draws/sessions/campaign/${campaignId}`);
    return response.data;
  },
};
