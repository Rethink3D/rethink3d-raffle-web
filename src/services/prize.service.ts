import api from './api';
import type { Prize } from '../types';

export const prizeService = {
  async getCampaignPrizes(campaignId: string): Promise<Prize[]> {
    const response = await api.get<Prize[]>(`/campaigns/${campaignId}/prizes`);
    return response.data;
  },

  async createPrize(campaignId: string, data: {
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    quantity: number;
  }): Promise<Prize> {
    const response = await api.post<Prize>(`/campaigns/${campaignId}/prizes`, { ...data, campaignId });
    return response.data;
  },

  async updatePrize(campaignId: string, id: string, data: Partial<{
    name: string;
    description: string | null;
    imageUrl: string | null;
    quantity: number;
  }>): Promise<Prize> {
    const response = await api.patch<Prize>(`/campaigns/${campaignId}/prizes/${id}`, data);
    return response.data;
  },

  async deletePrize(campaignId: string, id: string): Promise<void> {
    await api.delete(`/campaigns/${campaignId}/prizes/${id}`);
  },
};
