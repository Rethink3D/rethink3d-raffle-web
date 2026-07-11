import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClipboardList, ArrowLeft, Send, CheckCircle2, ShieldAlert, AlertTriangle, HeartHandshake, ArrowRight } from 'lucide-react';
import { surveyService } from '../../services/survey.service';
import { questService } from '../../services/quest.service';
import { getApiErrorMessage } from '../../utils/apiError';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useTicketRefreshStore } from '../../store/ticketRefreshStore';
import type { Survey, SurveyQuestion } from '../../types';

export const SurveyPage: React.FC = () => {
  const { missionId } = useParams<{ missionId: string }>();
  const navigate = useNavigate();

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [rewardAmount, setRewardAmount] = useState<number>(0);

  // Só mostra as perguntas depois que o participante confirmar que leu o
  // aviso de honestidade/tempo — a pesquisa não é sobre "acertar" nada.
  const [introAcknowledged, setIntroAcknowledged] = useState(false);

  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSurveyAndQuest = async () => {
      if (!missionId) return;
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch pesquisa da missão específica
        const surveyData = await surveyService.getSurveyByMission(missionId);
        setSurvey(surveyData);

        if (surveyData && surveyData.questions) {
          const sorted = [...surveyData.questions].sort((a, b) => a.order - b.order);
          setQuestions(sorted);
        }

        // 2. Fetch quests para exibir a recompensa exata desta missão de pesquisa
        if (surveyData.campaignId) {
          try {
            const quests = await questService.getCampaignQuests(surveyData.campaignId);
            const surveyQuest = quests.find(q => q.id === missionId);
            if (surveyQuest) {
              setRewardAmount(surveyQuest.reward);
            }
          } catch (e) {
            console.warn('Failed to load quest reward amount', e);
          }
        }

      } catch (err: any) {
        console.error('Error loading survey:', err);
        if (err?.response?.status === 404) {
          setError('Nenhuma pesquisa está configurada para esta missão.');
        } else {
          setError('Falha ao carregar a pesquisa.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSurveyAndQuest();
  }, [missionId]);

  // Visbility logic helper for dynamic routing of conditional questions
  const isQuestionVisible = (q: SurveyQuestion, currentAnswers: Record<string, string | string[]>) => {
    if (!q.conditionKey) return true;

    const dependentAnswer = currentAnswers[q.conditionKey];
    if (!dependentAnswer) return false;

    if (Array.isArray(dependentAnswer)) {
      return dependentAnswer.includes(q.conditionValue || '');
    }
    return dependentAnswer === q.conditionValue;
  };

  const handleAnswerChange = (questionId: string, value: string | string[]) => {
    const updatedAnswers = { ...answers, [questionId]: value };

    if (validationErrors[questionId]) {
      const errs = { ...validationErrors };
      delete errs[questionId];
      setValidationErrors(errs);
    }

    // Dynamic clean-up of dependent questions when parent value changes
    let changed = true;
    while (changed) {
      changed = false;
      for (const q of questions) {
        if (q.conditionKey && updatedAnswers[q.id] !== undefined) {
          const parentVisible = isQuestionVisible(q, updatedAnswers);
          if (!parentVisible) {
            delete updatedAnswers[q.id];
            changed = true;
          }
        }
      }
    }

    setAnswers(updatedAnswers);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    questions.forEach((q) => {
      const visible = isQuestionVisible(q, answers);
      if (!visible) return;

      if (q.required) {
        const val = answers[q.id];

        if (val === undefined || val === null) {
          errors[q.id] = 'Esse campo é obrigatório.';
          return;
        }

        if (q.type === 'TEXT' && typeof val === 'string' && val.trim() === '') {
          errors[q.id] = 'Escreva uma resposta válida.';
        }

        if (q.type === 'CHECKBOX' && Array.isArray(val) && val.length === 0) {
          errors[q.id] = 'Selecione ao menos uma opção.';
        }

        if (q.type === 'NUMBER' && (typeof val !== 'string' || val.trim() === '')) {
          errors[q.id] = 'Digite um número.';
        }
      }

      // Mesmo em pergunta opcional, se algo foi digitado tem que ser um número válido.
      const val = answers[q.id];
      if (q.type === 'NUMBER' && typeof val === 'string' && val.trim() !== '' && !Number.isFinite(Number(val))) {
        errors[q.id] = 'Digite um número válido.';
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!survey) return;

    const isValid = validateForm();
    if (!isValid) {
      console.warn('Form validation failed:', validationErrors);
      return;
    }

    const payload: Record<string, string | string[]> = {};
    questions.forEach((q) => {
      if (isQuestionVisible(q, answers) && answers[q.id] !== undefined) {
        payload[q.id] = answers[q.id];
      }
    });

    try {
      setSubmitting(true);
      await surveyService.submitSurvey(survey.id, payload);
      setSubmittedSuccess(true);
      useTicketRefreshStore.getState().trigger();
    } catch (err: any) {
      console.error('Error submitting survey:', err);
      setError(getApiErrorMessage(err, 'Falha ao enviar a pesquisa. Tente novamente.'));
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
          Carregando pesquisa...
        </div>
      </div>
    );
  }

  if (error && !submittedSuccess) {
    return (
      <div className="max-w-md mx-auto my-10 select-none">
        <Card variant="danger" title="Ops, algo deu errado" glow>
          <div className="flex flex-col items-center gap-4 text-center">
            <ShieldAlert size={48} className="text-cyber-danger" />
            <p className="text-sm font-rajdhani font-bold text-white tracking-wider">
              {error}
            </p>
            <Button variant="danger" size="md" onClick={() => navigate('/dashboard')} icon={<ArrowLeft size={14} />}>
              Voltar ao Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ─── SUCCESS SCREEN VIEW ───
  if (submittedSuccess) {
    return (
      <div className="max-w-md mx-auto my-10 select-none font-inter">
        <Card variant="primary" title="Pesquisa enviada" glow>
          <div className="flex flex-col items-center py-5 text-center">

            <div className="p-4 rounded-full bg-cyber-success/10 border border-cyber-success text-cyber-success mb-4 animate-float">
              <CheckCircle2 size={40} />
            </div>

            <h3 className="text-lg font-orbitron font-extrabold uppercase tracking-wider text-white">
              Missão cumprida!
            </h3>

            <p className="text-[10px] font-mono text-cyber-muted uppercase tracking-widest mt-1">
              Suas respostas foram registradas
            </p>

            <div className="w-full bg-cyber-accent/15 border border-cyber-accent/40 rounded p-4 mt-5 flex items-center justify-center gap-2.5 animate-pulse-glow">
              <span className="font-orbitron font-black text-sm tracking-widest text-cyber-accent uppercase">
                +{rewardAmount} cupons ganhos
              </span>
            </div>

            <p className="text-xs text-cyber-muted mt-5 leading-relaxed max-w-xs">
              Muito obrigado pela sua honestidade e pelo seu tempo. Seus cupons já foram creditados na sua conta.
            </p>

            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/dashboard')}
              className="w-full mt-6 glow-primary"
              icon={<ArrowLeft size={14} />}
            >
              Voltar ao Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!survey || questions.length === 0) {
    return (
      <div className="max-w-md mx-auto my-10 select-none">
        <Card title="Nenhuma pesquisa disponível">
          <div className="text-center py-4 flex flex-col gap-4">
            <ClipboardList size={40} className="text-cyber-muted mx-auto" />
            <p className="text-sm text-cyber-muted">
              Não há pesquisa configurada para esta missão.
            </p>
            <Button variant="primary" size="md" onClick={() => navigate('/dashboard')}>
              Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ─── AVISO DE HONESTIDADE (antes de começar) ───
  if (!introAcknowledged) {
    return (
      <div className="max-w-md mx-auto my-10 select-none font-inter">
        <Card variant="secondary" title="Antes de começar" glow>
          <div className="flex flex-col items-center py-4 text-center gap-4">
            <div className="p-4 rounded-full bg-cyber-secondary/10 border border-cyber-secondary text-cyber-secondary animate-float">
              <HeartHandshake size={36} />
            </div>

            <p className="text-sm font-rajdhani font-semibold text-cyber-text leading-relaxed">
              Queremos conhecer melhor o público de impressão 3D! Fique à vontade
              para responder com total honestidade, pois não há respostas certas
              ou erradas por aqui. Como nosso "muito obrigado" pelo seu tempo,
              você receberá <strong className="text-cyber-accent">{rewardAmount} pontos</strong> ao
              finalizar a pesquisa. Agradecemos imensamente o seu apoio!
            </p>

            <Button
              variant="secondary"
              size="md"
              fullWidth
              icon={<ArrowRight size={14} />}
              onClick={() => setIntroAcknowledged(true)}
              className="mt-2"
            >
              Começar Pesquisa
            </Button>
            <Button variant="danger" size="sm" fullWidth onClick={() => navigate('/dashboard')}>
              Cancelar
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto my-6 font-inter">
      {/* Header Info */}
      <div className="flex flex-col gap-1 mb-4 select-none">
        <span className="text-[10px] font-mono tracking-widest text-cyber-secondary uppercase">
          Pesquisa
        </span>
        <h2 className="text-lg font-orbitron font-extrabold text-white uppercase tracking-wider break-words">
          {survey.title}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {questions.map((q) => {
          const visible = isQuestionVisible(q, answers);
          if (!visible) return null;

          const error = validationErrors[q.id];

          return (
            <Card
              key={q.id}
              variant={error ? "danger" : "default"}
              title={q.text}
              subtitle={q.required ? "Obrigatória" : "Opcional"}
              clipCorner={false}
            >
              <div className="mt-2 font-inter text-cyber-text">

                {/* 1. TEXT TYPE */}
                {q.type === 'TEXT' && (
                  <textarea
                    rows={4}
                    value={(answers[q.id] as string) || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    placeholder="Escreva sua resposta..."
                    className="w-full bg-cyber-bg border border-cyber-border/80 focus:border-cyber-secondary rounded p-3 text-sm font-rajdhani font-semibold text-white tracking-wide placeholder-cyber-muted/60 transition-all outline-none"
                  />
                )}

                {/* NUMBER TYPE (resposta numérica livre) */}
                {q.type === 'NUMBER' && (
                  <input
                    type="number"
                    inputMode="numeric"
                    value={(answers[q.id] as string) || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    placeholder="Digite um número..."
                    className="w-full bg-cyber-bg border border-cyber-border/80 focus:border-cyber-secondary rounded p-3 text-sm font-rajdhani font-semibold text-white tracking-wide placeholder-cyber-muted/60 transition-all outline-none"
                  />
                )}

                {/* 2. MULTIPLE_CHOICE TYPE */}
                {q.type === 'MULTIPLE_CHOICE' && (
                  <div className="flex flex-col gap-2.5">
                    {q.options.map((opt) => {
                      const isSelected = answers[q.id] === opt.value;
                      return (
                        <label
                          key={opt.id}
                          className={`flex items-center gap-3 p-3 rounded border transition-all duration-150 cursor-pointer select-none
                            ${isSelected
                              ? 'bg-cyber-secondary/10 border-cyber-secondary text-white glow-secondary'
                              : 'bg-cyber-surface/60 border-cyber-border text-cyber-muted hover:border-cyber-secondary/40 hover:text-white'}`}
                        >
                          <input
                            type="radio"
                            name={q.id}
                            value={opt.value}
                            checked={isSelected}
                            onChange={() => handleAnswerChange(q.id, opt.value)}
                            className="w-4 h-4 accent-cyber-secondary"
                          />
                          <span className="font-rajdhani font-bold text-sm tracking-wider uppercase">
                            {opt.text}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* 3. CHECKBOX TYPE */}
                {q.type === 'CHECKBOX' && (
                  <div className="flex flex-col gap-2.5">
                    {q.options.map((opt) => {
                      const currentSelection = (answers[q.id] as string[]) || [];
                      const isChecked = currentSelection.includes(opt.value);
                      return (
                        <label
                          key={opt.id}
                          className={`flex items-center gap-3 p-3 rounded border transition-all duration-150 cursor-pointer select-none
                            ${isChecked
                              ? 'bg-cyber-secondary/15 border-cyber-secondary text-white glow-secondary'
                              : 'bg-cyber-surface/60 border-cyber-border text-cyber-muted hover:border-cyber-secondary/40 hover:text-white'}`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const updated = e.target.checked
                                ? [...currentSelection, opt.value]
                                : currentSelection.filter((item) => item !== opt.value);
                              handleAnswerChange(q.id, updated);
                            }}
                            className="w-4 h-4 accent-cyber-secondary"
                          />
                          <span className="font-rajdhani font-bold text-sm tracking-wider uppercase">
                            {opt.text}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* 4. SCALE TYPE (1-5 click chips) */}
                {q.type === 'SCALE' && (
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between text-[10px] font-mono text-cyber-muted select-none uppercase tracking-widest px-1">
                      <span>Discordo</span>
                      <span>Concordo</span>
                    </div>

                    <div className="grid grid-cols-5 gap-2.5">
                      {[1, 2, 3, 4, 5].map((val) => {
                        const scoreStr = String(val);
                        const isSelected = answers[q.id] === scoreStr;
                        return (
                          <button
                            type="button"
                            key={val}
                            onClick={() => handleAnswerChange(q.id, scoreStr)}
                            className={`py-3.5 rounded border font-orbitron font-extrabold text-sm tracking-wider transition-all duration-150 cursor-pointer
                              ${isSelected
                                ? 'bg-cyber-primary/20 border-cyber-primary text-cyber-primary glow-primary'
                                : 'bg-cyber-surface/60 border-cyber-border text-cyber-muted hover:border-cyber-primary/45 hover:text-white'}`}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-1.5 mt-3 text-cyber-danger text-xs font-rajdhani font-bold uppercase tracking-wider">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

              </div>
            </Card>
          );
        })}

        {/* Action Row */}
        <div className="flex justify-end gap-3 mt-4 border-t border-cyber-border/40 pt-5">
          <Button
            type="button"
            variant="danger"
            size="md"
            onClick={() => navigate('/dashboard')}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="secondary"
            size="md"
            isLoading={submitting}
            icon={<Send size={14} />}
          >
            Enviar Pesquisa
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SurveyPage;
