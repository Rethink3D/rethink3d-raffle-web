import api from './api';

export interface StandPairingCreated {
  pairingId: string;
  userCode: string;
  expiresAt: string;
}

export interface StandPairingStatus {
  status: 'pending' | 'approved' | 'expired';
  accessToken?: string;
  userCode?: string;
  expiresAt?: string;
}

export const STAND_PAIRING_POLL_MS = 3000;

export const standPairingService = {
  async create(): Promise<StandPairingCreated> {
    const response = await api.post<StandPairingCreated>('/auth/stand-pairing');
    return response.data;
  },

  async poll(pairingId: string): Promise<StandPairingStatus> {
    const response = await api.get<StandPairingStatus>(
      `/auth/stand-pairing/${pairingId}`
    );
    return response.data;
  },

  async approve(userCode: string): Promise<void> {
    await api.post('/auth/stand-pairing/approve', { userCode });
  },
};
