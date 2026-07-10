import api from './api';
import type { Quiz, QuizQuestion, QuizAnswer } from '../types';

export const quizService = {
  async getQuizByCampaign(campaignId: string): Promise<Quiz> {
    const response = await api.get<Quiz>(`/campaigns/${campaignId}/quiz`);
    return response.data;
  },

  async submitQuiz(
    quizId: string,
    answers: { questionId: string; optionId: string }[]
  ): Promise<QuizAnswer> {
    const response = await api.post<QuizAnswer>(`/quiz/${quizId}/submit`, { answers });
    return response.data;
  },

  async createQuiz(data: { campaignId: string; title: string }): Promise<Quiz> {
    const response = await api.post<Quiz>('/quiz', data);
    return response.data;
  },

  async createQuestion(data: {
    quizId: string;
    text: string;
    order: number;
    options: { text: string; isCorrect: boolean }[];
  }): Promise<QuizQuestion> {
    const response = await api.post<QuizQuestion>('/quiz/questions', data);
    return response.data;
  },
};
