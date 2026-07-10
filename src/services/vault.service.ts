import api from './api';
import type { Vault } from '../types';

export const vaultService = {
  // Retorna null se a campanha ainda não tiver cofre criado
  async getByCampaign(campaignId: string): Promise<Vault | null> {
    const response = await api.get<Vault | null>(`/campaigns/${campaignId}/vault`);
    return response.data;
  },

  async createVault(campaignId: string): Promise<Vault> {
    const response = await api.post<Vault>(`/campaigns/${campaignId}/vault`);
    return response.data;
  },
};
