import type { CampaignStatus } from '../types';

const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  DRAFT: 'Rascunho',
  ACTIVE: 'Ativa',
  DRAWING: 'Em Sorteio',
  // Entre rodadas de sorteio (ou depois que a última termina) — setado e
  // removido automaticamente pelo backend, sem ação manual do admin.
  PAUSED: 'Intervalo',
  FINISHED: 'Encerrada',
};

export const getCampaignStatusLabel = (status: CampaignStatus): string =>
  CAMPAIGN_STATUS_LABELS[status] ?? status;
