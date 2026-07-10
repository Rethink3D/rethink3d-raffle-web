import api from './api';
import type { Quiz, QuizSubmitResult } from '../types';

export const quizService = {
  async getQuizByMission(missionId: string): Promise<Quiz> {
    const response = await api.get<Quiz>(`/missions/${missionId}/quiz`);
    return response.data;
  },

  // Como o de cima, mas com o gabarito incluso (isCorrect) — só para o admin editar.
  async getQuizByMissionAdmin(missionId: string): Promise<Quiz> {
    const response = await api.get<Quiz>(`/missions/${missionId}/quiz/admin`);
    return response.data;
  },

  async submitQuiz(
    quizId: string,
    answers: { questionId: string; optionId: string }[]
  ): Promise<QuizSubmitResult> {
    const response = await api.post<QuizSubmitResult>(`/quiz/${quizId}/submit`, { answers });
    return response.data;
  },

  // Cria o quiz inteiro (perguntas + alternativas) em uma única chamada
  async createFullQuiz(data: {
    missionId: string;
    title: string;
    questions: {
      text: string;
      imageUrl?: string;
      options: { text: string; isCorrect: boolean }[];
    }[];
  }): Promise<Quiz> {
    const response = await api.post<Quiz>('/quiz/full', data);
    return response.data;
  },

  // Substitui título + perguntas de um quiz já existente (edição)
  async updateFullQuiz(
    quizId: string,
    data: {
      title: string;
      questions: {
        text: string;
        imageUrl?: string;
        options: { text: string; isCorrect: boolean }[];
      }[];
    }
  ): Promise<Quiz> {
    const response = await api.patch<Quiz>(`/quiz/${quizId}/full`, data);
    return response.data;
  },
};
