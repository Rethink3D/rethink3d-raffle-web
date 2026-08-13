import api from './api';

export interface StandCode {
  code: string;
  periodSeconds: number;
  expiresAt: string;
  serverTime: string;
}

export const standCodeService = {
  async getCurrent(): Promise<StandCode> {
    const response = await api.get<StandCode>('/auth/stand-code');
    return response.data;
  },
};
