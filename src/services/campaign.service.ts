import api from './api';
import type { Campaign } from '../types';

export const campaignService = {
  async getActiveCampaign(): Promise<Campaign> {
    const response = await api.get<Campaign>('/campaigns/active');
    return response.data;
  },

  async getCampaigns(): Promise<Campaign[]> {
    const response = await api.get<Campaign[]>('/campaigns');
    return response.data;
  },

  async createCampaign(data: {
    name: string;
    description?: string | null;
    startDate?: string | null;
    drawDate?: string | null;
  }): Promise<Campaign> {
    const response = await api.post<Campaign>('/campaigns', data);
    return response.data;
  },

  async updateCampaign(
    id: string,
    data: Partial<{
      name: string;
      description: string | null;
      startDate: string | null;
      drawDate: string | null;
    }>
  ): Promise<Campaign> {
    const response = await api.patch<Campaign>(`/campaigns/${id}`, data);
    return response.data;
  },

  async deleteCampaign(id: string): Promise<void> {
    await api.delete(`/campaigns/${id}`);
  },

  async activateCampaign(id: string): Promise<Campaign> {
    const response = await api.patch<Campaign>(`/campaigns/${id}/activate`);
    return response.data;
  },

  async finishCampaign(id: string): Promise<Campaign> {
    const response = await api.patch<Campaign>(`/campaigns/${id}/finish`);
    return response.data;
  },
};
