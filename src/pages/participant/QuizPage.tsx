import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HelpCircle, ChevronRight, XCircle, ArrowLeft, Award, Zap } from 'lucide-react';
import { quizService } from '../../services/quiz.service';
import { questService } from '../../services/quest.service';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import type { Quiz, QuizQuestion, QuizOption, QuizAnswer } from '../../types';

export const QuizPage: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [rewardAmount, setRewardAmount] = useState<number>(0);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ questionId: string; optionId: string }[]>([]);
  
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [quizResult, setQuizResult] = useState<QuizAnswer | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuizData = async () => {
      if (!campaignId) return;
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch Quiz for active campaign
        const quizData = await quizService.getQuizByCampaign(campaignId);
        setQuiz(quizData);

        if (quizData && quizData.questions) {
          // Sort questions by order ascending
          const sortedQuestions = [...quizData.questions].sort((a, b) => a.order - b.order);
          setQuestions(sortedQuestions);
        }

        // 2. Fetch quests to display exact ticket reward
        try {
          const quests = await questService.getCampaignQuests(campaignId);
          const quizQuest = quests.find(q => q.type === 'QUIZ');
          if (quizQuest) {
            setRewardAmount(quizQuest.reward);
          }
        } catch (e) {
          console.warn('Failed to load quest reward amount', e);
        }

      } catch (err: any) {
        console.error('Error fetching quiz data:', err);
        if (err?.response?.status === 404) {
          setError('Nenhum desafio de quiz está configurado para esta campanha.');
        } else {
          setError('Falha ao baixar as perguntas do quiz do servidor seguro R3D.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [campaignId]);

  const handleOptionSelect = (optionId: string) => {
    setSelectedOptionId(optionId);
  };

  const handleNext = () => {
    if (!selectedOptionId) return;

    const currentQuestion = questions[currentQuestionIndex];
    const newAnswer = {
      questionId: currentQuestion.id,
      optionId: selectedOptionId,
    };

    const newAnswers = [...answers, newAnswer];
    setAnswers(newAnswers);
    setSelectedOptionId(null);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Last question completed, trigger submit
      submitQuizAnswers(newAnswers);
    }
  };

  const submitQuizAnswers = async (finalAnswers: { questionId: string; optionId: string }[]) => {
    if (!quiz) return;
    try {
      setSubmitting(true);
      const result = await quizService.submitQuiz(quiz.id, finalAnswers);
      setQuizResult(result);
    } catch (err: any) {
      console.error('Error submitting quiz answers:', err);
      setError(err?.response?.data?.message || 'Falha ao enviar as respostas do quiz. Por favor, tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] font-mono select-none">
        <div className="text-cyber-secondary animate-pulse text-lg font-bold tracking-widest">
          [SYS_BAIXANDO_INTEGRIDADE_DO_QUIZ...]
        </div>
        <div className="w-56 h-1 bg-cyber-border rounded overflow-hidden mt-4">
          <div className="h-full bg-cyber-secondary animate-pulse-glow" style={{ width: '40%' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-10 select-none">
        <Card variant="danger" title="EXCEÇÃO DO SISTEMA DE QUIZ" glow>
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
        <Card title="NENHUM QUIZ CONFIGURADO">
          <div className="text-center py-4 flex flex-col gap-4">
            <HelpCircle size={40} className="text-cyber-muted mx-auto" />
            <p className="text-sm text-cyber-muted">
              Não há perguntas configuradas para o quiz desta campanha.
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] font-mono select-none">
        <div className="text-cyber-accent animate-pulse text-lg font-bold tracking-widest">
          [ENVIANDO_DADOS_DO_QUIZ...]
        </div>
        <div className="w-56 h-1 bg-cyber-border rounded overflow-hidden mt-4">
          <div className="h-full bg-cyber-accent animate-pulse-glow" style={{ width: '80%' }} />
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
          title="DESAFIO DE QUIZ CONCLUÍDO" 
          subtitle="ÍNDICE_DE_TRANSAÇÃO // SUCESSO"
          glow={isPassing}
        >
          <div className="flex flex-col items-center py-4">
            
            {/* Success icon */}
            <div className={`p-4 rounded-full border mb-4 animate-float
              ${isPassing 
                ? 'bg-cyber-primary/10 border-cyber-primary text-cyber-primary text-glow-primary' 
                : 'bg-cyber-secondary/10 border-cyber-secondary text-cyber-secondary text-glow-secondary'}`}
            >
              <Award size={40} />
            </div>

            <h3 className="text-xl font-orbitron font-extrabold uppercase tracking-widest text-white text-center">
              {isPassing ? 'DESAFIO VENCIDO' : 'DESAFIO ENVIADO'}
            </h3>
            
            <p className="text-[10px] font-mono text-cyber-muted uppercase tracking-widest mt-1">
              RESULTADOS REGISTRADOS COM SEGURANÇA NO BANCO DE DADOS DE CUPONS
            </p>

            {/* Stats Block */}
            <div className="grid grid-cols-3 gap-3 w-full mt-6 text-center">
              <div className="bg-cyber-surface border border-cyber-border p-3 rounded">
                <span className="text-[9px] font-mono text-cyber-muted block uppercase">PRECISÃO</span>
                <span className="font-orbitron font-bold text-lg text-white mt-1 block">
                  {accuracy}%
                </span>
              </div>
              <div className="bg-cyber-surface border border-cyber-border p-3 rounded">
                <span className="text-[9px] font-mono text-cyber-muted block uppercase">CORRETAS</span>
                <span className="font-orbitron font-bold text-lg text-cyber-success mt-1 block">
                  {score}
                </span>
              </div>
              <div className="bg-cyber-surface border border-cyber-border p-3 rounded">
                <span className="text-[9px] font-mono text-cyber-muted block uppercase">ERROS</span>
                <span className="font-orbitron font-bold text-lg text-cyber-danger mt-1 block">
                  {errors}
                </span>
              </div>
            </div>

            {/* Tickets Earned Banner */}
            <div className="w-full bg-cyber-accent/10 border border-cyber-accent/30 rounded p-4 mt-5 text-center flex items-center justify-center gap-3 animate-pulse-glow">
              <Zap size={18} className="text-cyber-accent animate-bounce" />
              <div className="font-rajdhani font-bold text-sm tracking-widest text-cyber-accent uppercase">
                CUPONS CONCEDIDOS: +{rewardAmount} CUPONS
              </div>
            </div>

            <p className="text-xs text-cyber-muted text-center mt-5 leading-relaxed">
              Seu cartão de pontuação foi registrado. Suas credenciais participarão do protocolo de sorteio ao vivo automaticamente.
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
        <span className="text-[10px] font-mono tracking-widest text-cyber-secondary uppercase">
          // MÓDULO DE DESAFIO INTERATIVO
        </span>
        <h2 className="text-lg font-orbitron font-extrabold text-white uppercase tracking-wider">
          {quiz.title}
        </h2>
      </div>

      <Card variant="secondary" glow>
        {/* Progress header */}
        <div className="flex justify-between items-baseline border-b border-cyber-border/40 pb-3 mb-5 select-none">
          <span className="text-xs font-rajdhani font-extrabold text-cyber-secondary tracking-widest uppercase">
            PERGUNTA {currentQuestionIndex + 1} DE {questions.length}
          </span>
          <span className="text-[10px] font-mono text-cyber-muted tracking-widest uppercase">
            ÍNDICE_DE_CONCLUSÃO: {progressPercent}%
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
          <h3 className="text-base font-orbitron font-bold text-white uppercase tracking-wide leading-relaxed">
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
        <div className="flex justify-end mt-8 border-t border-cyber-border/40 pt-4">
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
