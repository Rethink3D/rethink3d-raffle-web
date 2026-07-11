import api from './api';
import type { Survey, SurveyResponse, SurveyStats, QuestionType } from '../types';

export interface CreateSurveyQuestionInput {
  text: string;
  type: QuestionType;
  order: number;
  required: boolean;
  conditionKey?: string | null;
  conditionValue?: string | null;
  options?: { text: string; value: string }[];
}

export const surveyService = {
  async getSurveyByMission(missionId: string): Promise<Survey> {
    const response = await api.get<Survey>(`/missions/${missionId}/survey`);
    return response.data;
  },

  async submitSurvey(
    surveyId: string,
    answers: Record<string, string | string[]>
  ): Promise<SurveyResponse> {
    const response = await api.post<SurveyResponse>(`/survey/forms/${surveyId}/submit`, { answers });
    return response.data;
  },

  async createSurvey(data: {
    missionId: string;
    title: string;
    questions: CreateSurveyQuestionInput[];
  }): Promise<Survey> {
    const response = await api.post<Survey>('/survey/forms', data);
    return response.data;
  },

  // Substitui título + perguntas de uma pesquisa já existente (edição)
  async updateSurvey(
    surveyId: string,
    data: { title: string; questions: CreateSurveyQuestionInput[] }
  ): Promise<Survey> {
    const response = await api.patch<Survey>(`/survey/forms/${surveyId}`, data);
    return response.data;
  },

  async getResponses(surveyId: string): Promise<SurveyResponse[]> {
    const response = await api.get<SurveyResponse[]>(`/survey/forms/${surveyId}/responses`);
    return response.data;
  },

  async getStats(surveyId: string): Promise<SurveyStats> {
    const response = await api.get<SurveyStats>(`/survey/forms/${surveyId}/stats`);
    return response.data;
  },
};
