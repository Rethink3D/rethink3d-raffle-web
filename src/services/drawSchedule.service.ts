import api from './api';
import type { DrawSchedule } from '../types';

export const drawScheduleService = {
  async getByCampaign(campaignId: string): Promise<DrawSchedule[]> {
    const response = await api.get<DrawSchedule[]>(`/campaigns/${campaignId}/draw-schedules`);
    return response.data;
  },

  async create(campaignId: string, data: { scheduledAt: string; label?: string | null }): Promise<DrawSchedule> {
    const response = await api.post<DrawSchedule>(`/campaigns/${campaignId}/draw-schedules`, data);
    return response.data;
  },

  async update(
    campaignId: string,
    id: string,
    data: Partial<{ scheduledAt: string; label: string | null }>
  ): Promise<DrawSchedule> {
    const response = await api.patch<DrawSchedule>(`/campaigns/${campaignId}/draw-schedules/${id}`, data);
    return response.data;
  },

  async remove(campaignId: string, id: string): Promise<void> {
    await api.delete(`/campaigns/${campaignId}/draw-schedules/${id}`);
  },
};
