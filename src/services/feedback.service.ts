import api from './api';
import type { FeedbackForm, FeedbackResponse, QuestionType } from '../types';

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
  async getFeedbackByCampaign(campaignId: string): Promise<FeedbackForm> {
    const response = await api.get<FeedbackForm>(`/campaigns/${campaignId}/feedback`);
    return response.data;
  },

  async submitFeedback(
    formId: string,
    answers: Record<string, string | string[]>
  ): Promise<FeedbackResponse> {
    const response = await api.post<FeedbackResponse>(`/feedback/${formId}/submit`, { answers });
    return response.data;
  },

  async createFeedbackForm(data: {
    campaignId: string;
    title: string;
    questions: CreateFeedbackQuestionInput[];
  }): Promise<FeedbackForm> {
    const response = await api.post<FeedbackForm>('/feedback', data);
    return response.data;
  },
};
