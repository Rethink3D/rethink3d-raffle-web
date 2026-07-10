import api from './api';
import type { Mission, MissionType, MissionProof } from '../types';

export const questService = {
  async getCampaignQuests(campaignId: string): Promise<Mission[]> {
    const response = await api.get<Mission[]>(`/campaigns/${campaignId}/missions`);
    return response.data;
  },

  async getAllCampaignQuestsAdmin(campaignId: string): Promise<Mission[]> {
    const response = await api.get<Mission[]>(`/campaigns/${campaignId}/missions/all`);
    return response.data;
  },

  // Buscar todas as missões do sistema (admin)
  async getAllMissions(): Promise<Mission[]> {
    const response = await api.get<Mission[]>('/missions');
    return response.data;
  },

  // Buscar missões globais (sem campanha vinculada) — admin
  async getGlobalQuests(): Promise<Mission[]> {
    const response = await api.get<Mission[]>('/missions/global');
    return response.data;
  },

  // Atribuir missão a uma campanha
  async assignMissionToCampaign(missionId: string, campaignId: string): Promise<Mission> {
    const response = await api.patch<Mission>(`/missions/${missionId}/assign/${campaignId}`);
    return response.data;
  },

  async createQuest(data: {
    campaignId?: string;
    title: string;
    description: string;
    reward: number;
    referrerReward?: number;
    type: MissionType;
    imageUrl?: string | null;
    links?: string[];
    order?: number;
    active?: boolean;
  }): Promise<Mission> {
    const response = await api.post<Mission>('/missions', data);
    return response.data;
  },

  async updateQuest(
    id: string,
    data: Partial<{
      campaignId: string;
      title: string;
      description: string;
      reward: number;
      referrerReward: number;
      type: MissionType;
      imageUrl: string | null;
      links: string[];
      order: number;
      active: boolean;
    }>
  ): Promise<Mission> {
    const response = await api.patch<Mission>(`/missions/${id}`, data);
    return response.data;
  },

  async toggleQuest(id: string, active: boolean): Promise<Mission> {
    const response = await api.patch<Mission>(`/missions/${id}/toggle`, { active });
    return response.data;
  },

  async reorderQuests(missions: { id: string; order: number }[]): Promise<void> {
    await api.patch('/missions/reorder', { missions });
  },

  async deleteQuest(id: string): Promise<void> {
    await api.delete(`/missions/${id}`);
  },

  async uploadProof(missionId: string, file: File): Promise<MissionProof> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<MissionProof>(`/missions/${missionId}/proof`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Usa o código de 6 dígitos de um amigo pra cumprir a missão REFERRAL
  async redeemReferral(missionId: string, friendCode: string): Promise<{
    message: string;
    ticketsEarned: number;
    totalTickets: number;
    missionCompleted: boolean;
  }> {
    const response = await api.post(`/missions/${missionId}/referral`, { friendCode });
    return response.data;
  },
};
