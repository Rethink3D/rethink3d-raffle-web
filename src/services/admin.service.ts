import api from './api';
import type { User, MissionProof } from '../types';

export interface DashboardStats {
  totalParticipants: number;
  totalTickets: number;
  completedMissions: number;
  pendingProofs: number;
  activeCampaigns?: number;
}

export const adminService = {
  async getParticipants(campaignId?: string): Promise<User[]> {
    const response = await api.get<User[]>('/admin/participants', {
      params: campaignId ? { campaignId } : {},
    });
    return response.data;
  },

  async getParticipantDetail(id: string): Promise<User> {
    const response = await api.get<User>(`/admin/participants/${id}`);
    return response.data;
  },

  async resetPin(id: string): Promise<string> {
    const response = await api.post<{ tempPin: string }>(`/admin/participants/${id}/reset-pin`);
    return response.data.tempPin;
  },

  async deleteParticipant(id: string): Promise<void> {
    await api.delete(`/admin/participants/${id}`);
  },

  async getDashboardStats(campaignId: string): Promise<DashboardStats> {
    try {
      const response = await api.get<any>('/admin/dashboard', {
        params: { campaignId },
      });
      return {
        totalParticipants: response.data.totalParticipants,
        totalTickets: response.data.totalTickets,
        completedMissions: response.data.totalCompletions !== undefined ? response.data.totalCompletions : (response.data.completedMissions ?? 0),
        pendingProofs: response.data.approvedProofs !== undefined ? response.data.approvedProofs : (response.data.pendingProofs ?? 0),
      };
    } catch (e) {
      console.warn('Failed to fetch from /admin/dashboard, trying /admin/stats', e);
      const response = await api.get<DashboardStats>('/admin/stats', {
        params: { campaignId },
      });
      return response.data;
    }
  },

  async getParticipantProofs(userId: string): Promise<MissionProof[]> {
    const response = await api.get<MissionProof[]>(`/admin/participants/${userId}/proofs`);
    return response.data;
  },

  async getAllProofs(): Promise<MissionProof[]> {
    const response = await api.get<MissionProof[]>('/admin/proofs');
    return response.data;
  },
};
