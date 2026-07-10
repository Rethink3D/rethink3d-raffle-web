import type { CampaignStatus } from '../types';

const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  DRAFT: 'Rascunho',
  ACTIVE: 'Ativa',
  DRAWING: 'Em Sorteio',
  FINISHED: 'Encerrada',
};

export const getCampaignStatusLabel = (status: CampaignStatus): string =>
  CAMPAIGN_STATUS_LABELS[status] ?? status;
