import api from './api';
import type { TicketHistoryEntry } from '../types';

export const ticketService = {
  async getMyTicketHistory(campaignId: string): Promise<TicketHistoryEntry[]> {
    const response = await api.get<TicketHistoryEntry[]>(`/campaigns/${campaignId}/my-ticket-history`);
    return response.data;
  },
};
