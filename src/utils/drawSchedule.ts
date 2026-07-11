import type { Campaign, DrawSchedule } from '../types';

// Horários de sorteio agendados que ainda não passaram, em ordem crescente.
export const getUpcomingSchedules = (campaign: Campaign | null | undefined): DrawSchedule[] => {
  if (!campaign?.drawSchedules) return [];
  const now = Date.now();
  return campaign.drawSchedules
    .filter((s) => new Date(s.scheduledAt).getTime() > now)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
};

// Horário do próximo sorteio a contar — prioriza os horários agendados
// livremente pelo admin; cai pro campo único `drawDate` só se a campanha
// ainda não tiver nenhum horário cadastrado (compatibilidade com campanhas
// criadas antes desse recurso existir).
export const getNextDrawTarget = (campaign: Campaign | null | undefined): string | null | undefined => {
  const upcoming = getUpcomingSchedules(campaign);
  if (upcoming.length > 0) return upcoming[0].scheduledAt;
  return campaign?.drawDate;
};
