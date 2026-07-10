import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HelpCircle, ChevronRight, XCircle, ArrowLeft, Zap } from 'lucide-react';
import { quizService } from '../../services/quiz.service';
import { questService } from '../../services/quest.service';
import { getApiErrorMessage } from '../../utils/apiError';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useTicketRefreshStore } from '../../store/ticketRefreshStore';
import type { Quiz, QuizQuestion, QuizOption, QuizSubmitResult } from '../../types';
import agree from '../../assets/agree.gif';
import random3 from '../../assets/random3.gif';

export const QuizPage: React.FC = () => {
  const { missionId } = useParams<{ missionId: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [rewardAmount, setRewardAmount] = useState<number>(0);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ questionId: string; optionId: string }[]>([]);
  
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [quizResult, setQuizResult] = useState<QuizSubmitResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuizData = async () => {
      if (!missionId) return;
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch Quiz da missão específica
        const quizData = await quizService.getQuizByMission(missionId);
        setQuiz(quizData);

        if (quizData && quizData.questions) {
          // Embaralha a ordem das perguntas a cada tentativa (evita "cola" entre participantes)
          const shuffledQuestions = [...quizData.questions].sort(() => Math.random() - 0.5);
          setQuestions(shuffledQuestions);
        }

        // 2. Fetch quests para exibir a recompensa exata desta missão de quiz
        if (quizData.campaignId) {
          try {
            const quests = await questService.getCampaignQuests(quizData.campaignId);
            const quizQuest = quests.find(q => q.id === missionId);
            if (quizQuest) {
              setRewardAmount(quizQuest.reward);
            }
          } catch (e) {
            console.warn('Failed to load quest reward amount', e);
          }
        }

      } catch (err: any) {
        console.error('Error fetching quiz data:', err);
        if (err?.response?.status === 404) {
          setError('Nenhum desafio de quiz está configurado para esta missão.');
        } else {
          setError('Falha ao baixar as perguntas do quiz.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [missionId]);

  const handleOptionSelect = (optionId: string) => {
    setSelectedOptionId(optionId);
  };

  // Atualiza a resposta de uma pergunta específica, sem duplicar entradas —
  // necessário porque agora o usuário pode voltar e trocar uma escolha já feita.
  const upsertAnswer = (
    list: { questionId: string; optionId: string }[],
    questionId: string,
    optionId: string,
  ) => {
    const index = list.findIndex((a) => a.questionId === questionId);
    if (index === -1) return [...list, { questionId, optionId }];
    const copy = [...list];
    copy[index] = { questionId, optionId };
    return copy;
  };

  // Navega para uma pergunta e já pré-seleciona a alternativa escolhida antes,
  // caso o usuário esteja voltando para revisar/trocar uma resposta.
  const goToQuestion = (index: number, currentAnswers: { questionId: string; optionId: string }[]) => {
    setCurrentQuestionIndex(index);
    const existing = currentAnswers.find((a) => a.questionId === questions[index].id);
    setSelectedOptionId(existing ? existing.optionId : null);
  };

  const handleNext = () => {
    if (!selectedOptionId) return;

    const currentQuestion = questions[currentQuestionIndex];
    const newAnswers = upsertAnswer(answers, currentQuestion.id, selectedOptionId);
    setAnswers(newAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      goToQuestion(currentQuestionIndex + 1, newAnswers);
    } else {
      // Last question completed, trigger submit
      submitQuizAnswers(newAnswers);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex === 0) return;

    // Salva a seleção atual (se houver) antes de voltar, pra não perder a
    // resposta desta pergunta caso o usuário volte e volte de novo depois.
    let updatedAnswers = answers;
    if (selectedOptionId) {
      const currentQuestion = questions[currentQuestionIndex];
      updatedAnswers = upsertAnswer(answers, currentQuestion.id, selectedOptionId);
      setAnswers(updatedAnswers);
    }

    goToQuestion(currentQuestionIndex - 1, updatedAnswers);
  };

  const submitQuizAnswers = async (finalAnswers: { questionId: string; optionId: string }[]) => {
    if (!quiz) return;
    try {
      setSubmitting(true);
      const result = await quizService.submitQuiz(quiz.id, finalAnswers);
      setQuizResult(result);
      useTicketRefreshStore.getState().trigger();
    } catch (err: any) {
      console.error('Error submitting quiz answers:', err);
      setError(getApiErrorMessage(err, 'Falha ao enviar as respostas do quiz. Por favor, tente novamente.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] select-none">
        <div
          style={{ width: 120, height: 120 }}
          dangerouslySetInnerHTML={{
            __html: `<lottie-player
              src="/Pokeball Loading.json"
              background="transparent"
              speed="1.2"
              style="width: 100%; height: 100%;"
              loop
              autoplay
            ></lottie-player>`
          }}
        />
        <div className="text-cyber-secondary animate-pulse text-xs font-bold tracking-widest mt-2 uppercase">
          Carregando o quiz...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-10 select-none">
        <Card variant="danger" title="Ops, algo deu errado" glow>
          <div className="flex flex-col items-center gap-4 text-center">
            <XCircle size={48} className="text-cyber-danger" />
            <p className="text-sm font-rajdhani font-bold text-white tracking-wider">
              {error}
            </p>
            <Button variant="danger" size="md" onClick={() => navigate('/dashboard')} icon={<ArrowLeft size={14} />}>
              Voltar ao Painel
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="max-w-md mx-auto my-10 select-none">
        <Card title="Nenhum quiz disponível">
          <div className="text-center py-4 flex flex-col gap-4">
            <HelpCircle size={40} className="text-cyber-muted mx-auto" />
            <p className="text-sm text-cyber-muted">
              Não há perguntas configuradas para este quiz.
            </p>
            <Button variant="primary" size="md" onClick={() => navigate('/dashboard')}>
              Painel
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ─── SUBMITTING SCREEN ───
  if (submitting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] select-none">
        <div
          style={{ width: 120, height: 120 }}
          dangerouslySetInnerHTML={{
            __html: `<lottie-player
              src="/Pokeball Loading.json"
              background="transparent"
              speed="1.2"
              style="width: 100%; height: 100%;"
              loop
              autoplay
            ></lottie-player>`
          }}
        />
        <div className="text-cyber-accent animate-pulse text-xs font-bold tracking-widest mt-2 uppercase">
          Enviando suas respostas...
        </div>
      </div>
    );
  }

  // ─── RESULTS DISPLAY VIEW ───
  if (quizResult) {
    const totalQuestions = quizResult.totalQuestions;
    const score = quizResult.score;
    const errors = totalQuestions - score;
    const accuracy = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    const isPassing = accuracy >= 70;

    return (
      <div className="max-w-lg mx-auto my-6 select-none font-inter">
        <Card
          variant={isPassing ? "primary" : "secondary"}
          title={isPassing ? "Mandou bem!" : "Quiz concluído!"}
          glow={isPassing}
        >
          <div className="flex flex-col items-center py-4">

            <img
              src={isPassing ? agree : random3}
              alt={isPassing ? "Mandou bem" : "Quiz concluído"}
              className="w-24 h-auto animate-float"
              draggable={false}
            />

            <p className="text-xs text-cyber-muted text-center mt-3">
              Suas respostas foram registradas.
            </p>

            {/* Stats Block */}
            <div className="grid grid-cols-3 gap-3 w-full mt-6 text-center">
              <div className="bg-cyber-surface border border-cyber-border p-3 rounded">
                <span className="text-[9px] font-mono text-cyber-muted block uppercase">Acertos</span>
                <span className="font-orbitron font-bold text-lg text-white mt-1 block">
                  {accuracy}%
                </span>
              </div>
              <div className="bg-cyber-surface border border-cyber-border p-3 rounded">
                <span className="text-[9px] font-mono text-cyber-muted block uppercase">Certas</span>
                <span className="font-orbitron font-bold text-lg text-cyber-success mt-1 block">
                  {score}
                </span>
              </div>
              <div className="bg-cyber-surface border border-cyber-border p-3 rounded">
                <span className="text-[9px] font-mono text-cyber-muted block uppercase">Erradas</span>
                <span className="font-orbitron font-bold text-lg text-cyber-danger mt-1 block">
                  {errors}
                </span>
              </div>
            </div>

            {/* Tickets Earned Banner */}
            <div className="w-full bg-cyber-accent/10 border border-cyber-accent/30 rounded p-4 mt-5 text-center flex items-center justify-center gap-3 animate-pulse-glow">
              <Zap size={18} className="text-cyber-accent animate-bounce" />
              <div className="font-rajdhani font-bold text-sm tracking-widest text-cyber-accent uppercase">
                +{quizResult.ticketsEarned} cupons ganhos
              </div>
            </div>

            <p className="text-xs text-cyber-muted text-center mt-5 leading-relaxed">
              Seus cupons já foram creditados e você já está concorrendo no sorteio.
            </p>

            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/dashboard')}
              className="w-full mt-6 glow-primary"
              icon={<ArrowLeft size={14} />}
            >
              Voltar ao Painel
            </Button>

          </div>
        </Card>
      </div>
    );
  }

  // ─── ACTIVE QUIZ WORKFLOW ───
  const currentQuestion = questions[currentQuestionIndex];
  const progressPercent = Math.round(((currentQuestionIndex) / questions.length) * 100);

  return (
    <div className="max-w-2xl mx-auto my-6 font-inter">
      {/* Quiz Title Header */}
      <div className="flex flex-col gap-1 mb-4 select-none">
        <h2 className="text-lg font-orbitron font-extrabold text-white uppercase tracking-wider break-words">
          {quiz.title}
        </h2>
        {rewardAmount > 0 && (
          <span className="text-xs text-cyber-muted">
            Cada resposta certa vale {rewardAmount} cupom{rewardAmount === 1 ? '' : 's'}.
          </span>
        )}
      </div>

      <Card variant="secondary" glow>
        {/* Progress header */}
        <div className="flex justify-between items-baseline border-b border-cyber-border/40 pb-3 mb-5 select-none">
          <span className="text-xs font-rajdhani font-extrabold text-cyber-secondary tracking-widest uppercase">
            PERGUNTA {currentQuestionIndex + 1} DE {questions.length}
          </span>
          <span className="text-[10px] font-mono text-cyber-muted tracking-widest uppercase">
            {progressPercent}% concluído
          </span>
        </div>

        {/* Progress indicator bar */}
        <div className="w-full h-1 bg-cyber-border rounded overflow-hidden mb-6">
          <div 
            className="h-full bg-cyber-secondary transition-all duration-300 ease-out"
            style={{ width: `${((currentQuestionIndex) / questions.length) * 100}%` }}
          />
        </div>

        {/* Question Text */}
        <div className="mb-6">
          <h3 className="text-base font-orbitron font-bold text-white uppercase tracking-wide leading-relaxed break-words">
            {currentQuestion.text}
          </h3>
          {currentQuestion.imageUrl && (
            <div className="mt-4 border border-cyber-border rounded overflow-hidden max-h-48 flex justify-center bg-black/40">
              <img 
                src={currentQuestion.imageUrl} 
                alt="Pista visual da pergunta"
                className="object-contain max-h-48"
              />
            </div>
          )}
        </div>

        {/* Multiple Choice Options */}
        <div className="flex flex-col gap-3">
          {currentQuestion.options.map((option: QuizOption, index: number) => {
            const isSelected = selectedOptionId === option.id;
            return (
              <button
                key={option.id}
                onClick={() => handleOptionSelect(option.id)}
                className={`w-full text-left p-4 rounded border transition-all duration-200 font-rajdhani font-bold text-sm tracking-wide uppercase select-none cursor-pointer relative overflow-hidden
                  ${isSelected 
                    ? 'bg-cyber-secondary/15 border-cyber-secondary text-white glow-secondary' 
                    : 'bg-cyber-surface/60 border-cyber-border text-cyber-muted hover:border-cyber-secondary/40 hover:text-white'}`}
              >
                {/* Visual glow corner overlay when selected */}
                {isSelected && (
                  <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-cyber-secondary" />
                )}
                <span className="mr-3.5 font-mono text-cyber-secondary">[{index + 1}]</span>
                {option.text}
              </button>
            );
          })}
        </div>

        {/* Action Button Footer */}
        <div className="flex justify-between mt-8 border-t border-cyber-border/40 pt-4">
          <Button
            variant="secondary"
            size="md"
            onClick={handleBack}
            disabled={currentQuestionIndex === 0}
            icon={<ArrowLeft size={14} />}
          >
            Voltar
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={handleNext}
            disabled={!selectedOptionId}
            icon={<ChevronRight size={14} />}
          >
            {currentQuestionIndex === questions.length - 1 ? 'Finalizar e Enviar' : 'Próxima Pergunta'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default QuizPage;
