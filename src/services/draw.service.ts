import api from './api';
import type { Draw } from '../types';

export const drawService = {
  async startDraw(campaignId: string, prizeId: string): Promise<Draw> {
    try {
      // Target NestJS POST /draws
      const response = await api.post<Draw>('/draws', { campaignId, prizeId });
      return response.data;
    } catch (err) {
      console.warn('Failed /draws, trying fallback /draws/start', err);
      const response = await api.post<Draw>('/draws/start', { campaignId, prizeId });
      return response.data;
    }
  },

  async executeDraw(drawId: string): Promise<Draw> {
    const response = await api.post<Draw>(`/draws/${drawId}/execute`);
    return response.data;
  },

  async confirmDraw(drawId: string): Promise<Draw> {
    try {
      const response = await api.post<Draw>(`/draws/${drawId}/confirm`);
      return response.data;
    } catch (err) {
      console.warn('Confirm draw failed or unneeded', err);
      return { id: drawId } as Draw;
    }
  },

  async cancelDraw(drawId: string): Promise<Draw> {
    try {
      const response = await api.post<Draw>(`/draws/${drawId}/cancel`);
      return response.data;
    } catch (err) {
      console.warn('Cancel draw failed', err);
      return { id: drawId } as Draw;
    }
  },

  async getHistory(campaignId?: string): Promise<Draw[]> {
    try {
      if (campaignId) {
        const response = await api.get<Draw[]>(`/draws/campaign/${campaignId}`);
        return response.data;
      }
      const response = await api.get<Draw[]>('/draws/history');
      return response.data;
    } catch (err) {
      console.warn('Failed campaign/history endpoint, returning empty history', err);
      try {
        const response = await api.get<Draw[]>('/draws/history');
        return response.data;
      } catch {
        return [];
      }
    }
  },
};
