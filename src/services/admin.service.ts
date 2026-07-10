import api from './api';
import type { User, MissionProof } from '../types';

export interface DashboardStats {
  totalParticipants: number;
  totalTickets: number;
  completedMissions: number;
  activeCampaigns?: number;
}

// Linha de participante retornada pela listagem admin: "tickets" aqui é o total
// somado na campanha filtrada (número), não a lista de Ticket do participante.
export type AdminParticipant = Omit<User, 'tickets'> & { tickets?: number };

export interface PaginatedParticipants {
  data: AdminParticipant[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const adminService = {
  async getParticipants(params: {
    campaignId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<PaginatedParticipants> {
    const response = await api.get<PaginatedParticipants>('/admin/participants', {
      params: {
        campaignId: params.campaignId || undefined,
        search: params.search?.trim() || undefined,
        page: params.page,
        pageSize: params.pageSize,
      },
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
    const response = await api.get<any>('/admin/dashboard', {
      params: { campaignId },
    });
    return {
      totalParticipants: response.data.totalParticipants,
      totalTickets: response.data.totalTickets,
      completedMissions: response.data.totalCompletions ?? 0,
    };
  },

  async getParticipantProofs(userId: string): Promise<AdminProofWithUrl[]> {
    const response = await api.get<AdminProofWithUrl[]>(`/admin/participants/${userId}/proofs`);
    return response.data;
  },

  async getAllProofs(): Promise<MissionProof[]> {
    const response = await api.get<MissionProof[]>('/admin/proofs');
    return response.data;
  },
};

// Comprovante com a URL assinada da S3, já pronta pra exibir a imagem —
// só existe na resposta do endpoint de admin (nunca exposta ao participante).
export type AdminProofWithUrl = MissionProof & { signedUrl: string };
