import api from './api';
import type { FeedbackForm, FeedbackResponse, FeedbackFormStats, QuestionType } from '../types';

export interface CreateFeedbackQuestionInput {
  text: string;
  type: QuestionType;
  order: number;
  required: boolean;
  conditionKey?: string | null;
  conditionValue?: string | null;
  options?: { text: string; value: string }[];
}

export const feedbackService = {
  async getFeedbackByMission(missionId: string): Promise<FeedbackForm> {
    const response = await api.get<FeedbackForm>(`/missions/${missionId}/feedback`);
    return response.data;
  },

  async submitFeedback(
    formId: string,
    answers: Record<string, string | string[]>
  ): Promise<FeedbackResponse> {
    const response = await api.post<FeedbackResponse>(`/feedback/forms/${formId}/submit`, { answers });
    return response.data;
  },

  async createFeedbackForm(data: {
    missionId: string;
    title: string;
    questions: CreateFeedbackQuestionInput[];
  }): Promise<FeedbackForm> {
    const response = await api.post<FeedbackForm>('/feedback/forms', data);
    return response.data;
  },

  // Substitui título + perguntas de um formulário já existente (edição)
  async updateFeedbackForm(
    formId: string,
    data: { title: string; questions: CreateFeedbackQuestionInput[] }
  ): Promise<FeedbackForm> {
    const response = await api.patch<FeedbackForm>(`/feedback/forms/${formId}`, data);
    return response.data;
  },

  async getResponses(formId: string): Promise<FeedbackResponse[]> {
    const response = await api.get<FeedbackResponse[]>(`/feedback/forms/${formId}/responses`);
    return response.data;
  },

  async getStats(formId: string): Promise<FeedbackFormStats> {
    const response = await api.get<FeedbackFormStats>(`/feedback/forms/${formId}/stats`);
    return response.data;
  },
};
