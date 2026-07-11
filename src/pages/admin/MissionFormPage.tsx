import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { questService } from '../../services/quest.service';
import { quizService } from '../../services/quiz.service';
import { feedbackService } from '../../services/feedback.service';
import { surveyService } from '../../services/survey.service';
import { getApiErrorMessage } from '../../utils/apiError';
import type { Mission, MissionType, QuestionType } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ImageUploadField } from '../../components/ui/ImageUploadField';
import { ArrowLeft, Globe, Plus, Trash2, CheckCircle2, RefreshCw } from 'lucide-react';

type FormStep = 'mission' | 'quiz' | 'feedback' | 'survey';

interface QuizQuestionDraft {
  text: string;
  imageUrl: string;
  options: [string, string, string];
  correctIndex: number;
}

const MIN_QUIZ_QUESTIONS = 3;
const MAX_QUIZ_QUESTIONS = 10;

const emptyQuizQuestion = (): QuizQuestionDraft => ({
  text: '',
  imageUrl: '',
  options: ['', '', ''],
  correctIndex: 0,
});

interface FeedbackQuestionDraft {
  text: string;
  type: QuestionType;
  required: boolean;
  options: string[];
}

const MIN_FEEDBACK_QUESTIONS = 3;
const MAX_FEEDBACK_QUESTIONS = 15;
const MIN_FEEDBACK_OPTIONS = 2;
const MAX_FEEDBACK_OPTIONS = 6;

const feedbackQuestionTypeLabels: Record<QuestionType, string> = {
  TEXT: 'Resposta Aberta (Texto)',
  MULTIPLE_CHOICE: 'Escolha Única',
  CHECKBOX: 'Múltipla Escolha',
  SCALE: 'Escala de 1 a 5',
  // Não aparece no dropdown do Feedback (filtrado abaixo) — só existe aqui
  // pra satisfazer o tipo, já que NUMBER é oferecido só em Pesquisa.
  NUMBER: 'Número (Resposta Numérica)',
};

const questionTypeNeedsOptions = (type: QuestionType) => type === 'MULTIPLE_CHOICE' || type === 'CHECKBOX';

const emptyFeedbackQuestion = (): FeedbackQuestionDraft => ({
  text: '',
  type: 'MULTIPLE_CHOICE',
  required: true,
  options: ['', ''],
});

// Pesquisa usa o mesmo formato de pergunta do Formulário de Feedback — só o
// tipo de missão (e a recompensa/aviso mostrados ao participante) é diferente.
// Além disso, Pesquisa ganha um tipo extra (NUMBER, resposta numérica livre)
// que não é oferecido no assistente de Feedback.
type SurveyQuestionDraft = FeedbackQuestionDraft;
const MIN_SURVEY_QUESTIONS = MIN_FEEDBACK_QUESTIONS;
const MAX_SURVEY_QUESTIONS = MAX_FEEDBACK_QUESTIONS;
const MIN_SURVEY_OPTIONS = MIN_FEEDBACK_OPTIONS;
const MAX_SURVEY_OPTIONS = MAX_FEEDBACK_OPTIONS;
const surveyQuestionTypeLabels: Record<QuestionType, string> = {
  ...feedbackQuestionTypeLabels,
  NUMBER: 'Número (Resposta Numérica)',
};
const emptySurveyQuestion = (): SurveyQuestionDraft => emptyFeedbackQuestion();

export const MissionFormPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { missionId } = useParams<{ missionId: string }>();
  const [searchParams] = useSearchParams();

  const isEditing = Boolean(missionId);
  const stateMission = (location.state as { mission?: Mission } | null)?.mission ?? null;

  // Ao editar, a missão pode chegar já carregada via navigate(state) (caminho normal,
  // vindo da lista) ou precisar ser buscada de novo (ex: usuário recarregou a página).
  const [editingQuest, setEditingQuest] = useState<Mission | null>(stateMission);
  const [loadingMission, setLoadingMission] = useState(isEditing && !stateMission);
  const [notFound, setNotFound] = useState(false);

  const campaignIdFromQuery = searchParams.get('campaignId') || '';
  const isGlobalFromQuery = searchParams.get('global') === 'true';

  const formIsGlobal = isEditing ? !editingQuest?.campaignId : isGlobalFromQuery;
  const campaignId = isEditing ? editingQuest?.campaignId || '' : campaignIdFromQuery;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reward: 10,
    // Só se aplica ao tipo REFERRAL: bônus de tickets pro dono do código
    // usado (vazio = mesmo valor de `reward`).
    referrerReward: '' as number | '',
    type: 'PROOF_UPLOAD' as MissionType,
    imageUrl: '',
    links: ['', '', ''],
    active: true,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // ─── Assistente de perguntas do Quiz (criação OU edição, campanha ou global) ──
  const [formStep, setFormStep] = useState<FormStep>('mission');
  const [quizId, setQuizId] = useState<string | null>(null);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestionDraft[]>([
    emptyQuizQuestion(),
    emptyQuizQuestion(),
    emptyQuizQuestion(),
  ]);

  // ─── Assistente de perguntas do Formulário de Feedback (idem) ──
  const [feedbackFormId, setFeedbackFormId] = useState<string | null>(null);
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackQuestions, setFeedbackQuestions] = useState<FeedbackQuestionDraft[]>([
    emptyFeedbackQuestion(),
    emptyFeedbackQuestion(),
    emptyFeedbackQuestion(),
  ]);

  // ─── Assistente de perguntas da Pesquisa (idem) ──
  const [surveyId, setSurveyId] = useState<string | null>(null);
  const [surveyTitle, setSurveyTitle] = useState('');
  const [surveyQuestions, setSurveyQuestions] = useState<SurveyQuestionDraft[]>([
    emptySurveyQuestion(),
    emptySurveyQuestion(),
    emptySurveyQuestion(),
  ]);

  // Ao editar uma missão de Quiz/Feedback já configurada, busca as perguntas
  // existentes pra popular o assistente (permite editar, não só criar do zero).
  const [isLoadingWizardData, setIsLoadingWizardData] = useState(false);

  useEffect(() => {
    if (!isEditing || !editingQuest) return;

    if (editingQuest.type === 'QUIZ') {
      setIsLoadingWizardData(true);
      quizService
        .getQuizByMissionAdmin(editingQuest.id)
        .then((quiz) => {
          setQuizId(quiz.id);
          setQuizTitle(quiz.title);
          setQuizQuestions(
            (quiz.questions || []).map((q) => ({
              text: q.text,
              imageUrl: q.imageUrl || '',
              options: [0, 1, 2].map((i) => q.options[i]?.text || '') as [string, string, string],
              correctIndex: Math.max(q.options.findIndex((o) => o.isCorrect), 0),
            }))
          );
        })
        .catch(() => {
          // Missão de Quiz sem quiz configurado ainda (não deveria acontecer,
          // mas mantém os defaults do assistente nesse caso)
        })
        .finally(() => setIsLoadingWizardData(false));
    } else if (editingQuest.type === 'FEEDBACK_FORM') {
      setIsLoadingWizardData(true);
      feedbackService
        .getFeedbackByMission(editingQuest.id)
        .then((form) => {
          setFeedbackFormId(form.id);
          setFeedbackTitle(form.title);
          setFeedbackQuestions(
            (form.questions || []).map((q) => ({
              text: q.text,
              type: q.type,
              required: q.required,
              options: q.options.map((o) => o.text),
            }))
          );
        })
        .catch(() => {
          // Missão de Feedback sem formulário configurado ainda
        })
        .finally(() => setIsLoadingWizardData(false));
    } else if (editingQuest.type === 'SURVEY') {
      setIsLoadingWizardData(true);
      surveyService
        .getSurveyByMission(editingQuest.id)
        .then((survey) => {
          setSurveyId(survey.id);
          setSurveyTitle(survey.title);
          setSurveyQuestions(
            (survey.questions || []).map((q) => ({
              text: q.text,
              type: q.type,
              required: q.required,
              options: q.options.map((o) => o.text),
            }))
          );
        })
        .catch(() => {
          // Missão de Pesquisa sem pesquisa configurada ainda
        })
        .finally(() => setIsLoadingWizardData(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, editingQuest]);

  useEffect(() => {
    if (!isEditing || stateMission || !missionId) return;
    const fetchMission = async () => {
      try {
        setLoadingMission(true);
        const all = await questService.getAllMissions();
        const found = all.find((m) => m.id === missionId) || null;
        if (!found) setNotFound(true);
        else setEditingQuest(found);
      } catch {
        setNotFound(true);
      } finally {
        setLoadingMission(false);
      }
    };
    fetchMission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, missionId]);

  useEffect(() => {
    if (!editingQuest) return;
    const existingLinks = editingQuest.links || [];
    setFormData({
      title: editingQuest.title,
      description: editingQuest.description,
      reward: editingQuest.reward,
      referrerReward: editingQuest.referrerReward ?? '',
      type: editingQuest.type,
      imageUrl: editingQuest.imageUrl || '',
      links: [0, 1, 2].map((i) => existingLinks[i] || ''),
      active: editingQuest.active,
    });
  }, [editingQuest]);

  const handleLinkChange = (index: number, value: string) => {
    setFormData((prev) => {
      const links = [...prev.links];
      links[index] = value;
      return { ...prev, links };
    });
  };

  const goBackToList = () => navigate('/admin/missions');

  // Missão de Quiz ou Formulário de Feedback (criando do zero, editando, global
  // ou de campanha) sempre passa pelo assistente de perguntas em vez de salvar
  // direto — os dois tipos de missão podem existir globalmente e ganhar a
  // campanha (e a árvore de perguntas copiada) só quando forem atribuídas.
  const isQuizWizard = formData.type === 'QUIZ';
  const isFeedbackWizard = formData.type === 'FEEDBACK_FORM';
  const isSurveyWizard = formData.type === 'SURVEY';

  const handleGoToQuizStep = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.title.trim() || !formData.description.trim()) {
      setFormError('Preencha o título e a descrição da missão.');
      return;
    }
    if (!formData.reward || Number(formData.reward) < 1) {
      setFormError('Defina quantos tickets valem cada resposta certa.');
      return;
    }
    if (isFeedbackWizard) {
      setFeedbackTitle((prev) => prev || formData.title);
      setFormStep('feedback');
      return;
    }
    if (isSurveyWizard) {
      setSurveyTitle((prev) => prev || formData.title);
      setFormStep('survey');
      return;
    }
    setQuizTitle((prev) => prev || formData.title);
    setFormStep('quiz');
  };

  const updateQuestionField = (index: number, field: 'text' | 'imageUrl', value: string) => {
    setQuizQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, [field]: value } : q)));
  };

  const updateOptionText = (qIndex: number, oIndex: number, value: string) => {
    setQuizQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        const options = [...q.options] as [string, string, string];
        options[oIndex] = value;
        return { ...q, options };
      })
    );
  };

  const setCorrectOption = (qIndex: number, oIndex: number) => {
    setQuizQuestions((prev) => prev.map((q, i) => (i === qIndex ? { ...q, correctIndex: oIndex } : q)));
  };

  const addQuizQuestion = () => {
    if (quizQuestions.length >= MAX_QUIZ_QUESTIONS) return;
    setQuizQuestions((prev) => [...prev, emptyQuizQuestion()]);
  };

  const removeQuizQuestion = (index: number) => {
    if (quizQuestions.length <= MIN_QUIZ_QUESTIONS) return;
    setQuizQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const isQuizStepValid =
    quizTitle.trim().length > 0 &&
    quizQuestions.length >= MIN_QUIZ_QUESTIONS &&
    quizQuestions.length <= MAX_QUIZ_QUESTIONS &&
    quizQuestions.every((q) => q.text.trim() && q.options.every((o) => o.trim()));

  const buildQuizQuestionsPayload = () =>
    quizQuestions.map((q) => ({
      text: q.text.trim(),
      imageUrl: q.imageUrl || undefined,
      options: q.options.map((text, idx) => ({ text: text.trim(), isCorrect: idx === q.correctIndex })),
    }));

  const handleFinalizeQuizMission = async () => {
    if (!isQuizStepValid) return;
    setIsSaving(true);
    setFormError(null);

    // Editando uma missão de Quiz já existente: salva os campos da missão e
    // substitui (ou cria, se ainda não existir) o quiz vinculado a ela.
    if (isEditing && editingQuest) {
      try {
        await questService.updateQuest(editingQuest.id, {
          title: formData.title,
          description: formData.description,
          reward: Number(formData.reward),
          type: 'QUIZ',
          imageUrl: formData.imageUrl || undefined,
          active: formIsGlobal ? undefined : formData.active,
        });

        if (quizId) {
          await quizService.updateFullQuiz(quizId, {
            title: quizTitle.trim(),
            questions: buildQuizQuestionsPayload(),
          });
        } else {
          await quizService.createFullQuiz({
            missionId: editingQuest.id,
            title: quizTitle.trim(),
            questions: buildQuizQuestionsPayload(),
          });
        }
        goBackToList();
      } catch (err: any) {
        setFormError(getApiErrorMessage(err, 'Erro ao salvar o quiz da missão.'));
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // Criando uma missão de Quiz nova (de campanha ou global) — o quiz é
    // vinculado à missão, então a missão precisa existir primeiro.
    let createdMissionId: string | null = null;
    try {
      const list = formIsGlobal
        ? await questService.getGlobalQuests()
        : await questService.getAllCampaignQuestsAdmin(campaignId);
      const maxOrder = list.reduce((max, m) => (m.order > max ? m.order : max), 0);
      const mission = await questService.createQuest({
        campaignId: formIsGlobal ? undefined : campaignId,
        title: formData.title,
        description: formData.description,
        reward: Number(formData.reward),
        type: 'QUIZ',
        imageUrl: formData.imageUrl || undefined,
        active: formIsGlobal ? undefined : formData.active,
        order: maxOrder + 1,
      });
      createdMissionId = mission.id;

      await quizService.createFullQuiz({
        missionId: mission.id,
        title: quizTitle.trim(),
        questions: buildQuizQuestionsPayload(),
      });

      goBackToList();
    } catch (err: any) {
      // Se o quiz falhar depois da missão já ter sido criada, desfaz a missão
      // pra não deixar uma missão de Quiz órfã sem perguntas.
      if (createdMissionId) {
        await questService.deleteQuest(createdMissionId).catch(() => {});
      }
      setFormError(getApiErrorMessage(err, 'Erro ao criar o quiz da missão.'));
    } finally {
      setIsSaving(false);
    }
  };

  const updateFeedbackQuestionField = (
    index: number,
    field: 'text' | 'required',
    value: string | boolean
  ) => {
    setFeedbackQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, [field]: value } : q)));
  };

  const updateFeedbackQuestionType = (index: number, type: QuestionType) => {
    setFeedbackQuestions((prev) =>
      prev.map((q, i) =>
        i === index
          ? { ...q, type, options: questionTypeNeedsOptions(type) ? (q.options.length >= MIN_FEEDBACK_OPTIONS ? q.options : ['', '']) : q.options }
          : q
      )
    );
  };

  const updateFeedbackOptionText = (qIndex: number, oIndex: number, value: string) => {
    setFeedbackQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        const options = [...q.options];
        options[oIndex] = value;
        return { ...q, options };
      })
    );
  };

  const addFeedbackOption = (qIndex: number) => {
    setFeedbackQuestions((prev) =>
      prev.map((q, i) => (i === qIndex && q.options.length < MAX_FEEDBACK_OPTIONS ? { ...q, options: [...q.options, ''] } : q))
    );
  };

  const removeFeedbackOption = (qIndex: number, oIndex: number) => {
    setFeedbackQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex && q.options.length > MIN_FEEDBACK_OPTIONS
          ? { ...q, options: q.options.filter((_, idx) => idx !== oIndex) }
          : q
      )
    );
  };

  const addFeedbackQuestion = () => {
    if (feedbackQuestions.length >= MAX_FEEDBACK_QUESTIONS) return;
    setFeedbackQuestions((prev) => [...prev, emptyFeedbackQuestion()]);
  };

  const removeFeedbackQuestion = (index: number) => {
    if (feedbackQuestions.length <= MIN_FEEDBACK_QUESTIONS) return;
    setFeedbackQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const isFeedbackStepValid =
    feedbackTitle.trim().length > 0 &&
    feedbackQuestions.length >= MIN_FEEDBACK_QUESTIONS &&
    feedbackQuestions.length <= MAX_FEEDBACK_QUESTIONS &&
    feedbackQuestions.every(
      (q) => q.text.trim() && (!questionTypeNeedsOptions(q.type) || q.options.every((o) => o.trim()))
    );

  const buildFeedbackQuestionsPayload = () =>
    feedbackQuestions.map((q, idx) => ({
      text: q.text.trim(),
      type: q.type,
      order: idx,
      required: q.required,
      options: questionTypeNeedsOptions(q.type)
        ? q.options.map((text) => ({ text: text.trim(), value: text.trim() }))
        : undefined,
    }));

  const handleFinalizeFeedbackMission = async () => {
    if (!isFeedbackStepValid) return;
    setIsSaving(true);
    setFormError(null);

    // Editando uma missão de Feedback já existente: salva os campos da missão e
    // substitui (ou cria, se ainda não existir) o formulário vinculado a ela.
    if (isEditing && editingQuest) {
      try {
        await questService.updateQuest(editingQuest.id, {
          title: formData.title,
          description: formData.description,
          reward: Number(formData.reward),
          type: 'FEEDBACK_FORM',
          imageUrl: formData.imageUrl || undefined,
          active: formIsGlobal ? undefined : formData.active,
        });

        if (feedbackFormId) {
          await feedbackService.updateFeedbackForm(feedbackFormId, {
            title: feedbackTitle.trim(),
            questions: buildFeedbackQuestionsPayload(),
          });
        } else {
          await feedbackService.createFeedbackForm({
            missionId: editingQuest.id,
            title: feedbackTitle.trim(),
            questions: buildFeedbackQuestionsPayload(),
          });
        }
        goBackToList();
      } catch (err: any) {
        setFormError(getApiErrorMessage(err, 'Erro ao salvar o formulário de feedback da missão.'));
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // Criando uma missão de Feedback nova (de campanha ou global) — o formulário
    // é vinculado à missão, então a missão precisa existir primeiro.
    let createdMissionId: string | null = null;
    try {
      const list = formIsGlobal
        ? await questService.getGlobalQuests()
        : await questService.getAllCampaignQuestsAdmin(campaignId);
      const maxOrder = list.reduce((max, m) => (m.order > max ? m.order : max), 0);
      const mission = await questService.createQuest({
        campaignId: formIsGlobal ? undefined : campaignId,
        title: formData.title,
        description: formData.description,
        reward: Number(formData.reward),
        type: 'FEEDBACK_FORM',
        imageUrl: formData.imageUrl || undefined,
        active: formIsGlobal ? undefined : formData.active,
        order: maxOrder + 1,
      });
      createdMissionId = mission.id;

      await feedbackService.createFeedbackForm({
        missionId: mission.id,
        title: feedbackTitle.trim(),
        questions: buildFeedbackQuestionsPayload(),
      });

      goBackToList();
    } catch (err: any) {
      // Se o formulário falhar depois da missão já ter sido criada, desfaz a
      // missão pra não deixar uma missão de Feedback órfã sem perguntas.
      if (createdMissionId) {
        await questService.deleteQuest(createdMissionId).catch(() => {});
      }
      setFormError(getApiErrorMessage(err, 'Erro ao criar o formulário de feedback da missão.'));
    } finally {
      setIsSaving(false);
    }
  };

  const updateSurveyQuestionField = (
    index: number,
    field: 'text' | 'required',
    value: string | boolean
  ) => {
    setSurveyQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, [field]: value } : q)));
  };

  const updateSurveyQuestionType = (index: number, type: QuestionType) => {
    setSurveyQuestions((prev) =>
      prev.map((q, i) =>
        i === index
          ? { ...q, type, options: questionTypeNeedsOptions(type) ? (q.options.length >= MIN_SURVEY_OPTIONS ? q.options : ['', '']) : q.options }
          : q
      )
    );
  };

  const updateSurveyOptionText = (qIndex: number, oIndex: number, value: string) => {
    setSurveyQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        const options = [...q.options];
        options[oIndex] = value;
        return { ...q, options };
      })
    );
  };

  const addSurveyOption = (qIndex: number) => {
    setSurveyQuestions((prev) =>
      prev.map((q, i) => (i === qIndex && q.options.length < MAX_SURVEY_OPTIONS ? { ...q, options: [...q.options, ''] } : q))
    );
  };

  const removeSurveyOption = (qIndex: number, oIndex: number) => {
    setSurveyQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex && q.options.length > MIN_SURVEY_OPTIONS
          ? { ...q, options: q.options.filter((_, idx) => idx !== oIndex) }
          : q
      )
    );
  };

  const addSurveyQuestion = () => {
    if (surveyQuestions.length >= MAX_SURVEY_QUESTIONS) return;
    setSurveyQuestions((prev) => [...prev, emptySurveyQuestion()]);
  };

  const removeSurveyQuestion = (index: number) => {
    if (surveyQuestions.length <= MIN_SURVEY_QUESTIONS) return;
    setSurveyQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const isSurveyStepValid =
    surveyTitle.trim().length > 0 &&
    surveyQuestions.length >= MIN_SURVEY_QUESTIONS &&
    surveyQuestions.length <= MAX_SURVEY_QUESTIONS &&
    surveyQuestions.every(
      (q) => q.text.trim() && (!questionTypeNeedsOptions(q.type) || q.options.every((o) => o.trim()))
    );

  const buildSurveyQuestionsPayload = () =>
    surveyQuestions.map((q, idx) => ({
      text: q.text.trim(),
      type: q.type,
      order: idx,
      required: q.required,
      options: questionTypeNeedsOptions(q.type)
        ? q.options.map((text) => ({ text: text.trim(), value: text.trim() }))
        : undefined,
    }));

  const handleFinalizeSurveyMission = async () => {
    if (!isSurveyStepValid) return;
    setIsSaving(true);
    setFormError(null);

    // Editando uma missão de Pesquisa já existente: salva os campos da missão e
    // substitui (ou cria, se ainda não existir) a pesquisa vinculada a ela.
    if (isEditing && editingQuest) {
      try {
        await questService.updateQuest(editingQuest.id, {
          title: formData.title,
          description: formData.description,
          reward: Number(formData.reward),
          type: 'SURVEY',
          imageUrl: formData.imageUrl || undefined,
          active: formIsGlobal ? undefined : formData.active,
        });

        if (surveyId) {
          await surveyService.updateSurvey(surveyId, {
            title: surveyTitle.trim(),
            questions: buildSurveyQuestionsPayload(),
          });
        } else {
          await surveyService.createSurvey({
            missionId: editingQuest.id,
            title: surveyTitle.trim(),
            questions: buildSurveyQuestionsPayload(),
          });
        }
        goBackToList();
      } catch (err: any) {
        setFormError(getApiErrorMessage(err, 'Erro ao salvar a pesquisa da missão.'));
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // Criando uma missão de Pesquisa nova (de campanha ou global) — a pesquisa
    // é vinculada à missão, então a missão precisa existir primeiro.
    let createdMissionId: string | null = null;
    try {
      const list = formIsGlobal
        ? await questService.getGlobalQuests()
        : await questService.getAllCampaignQuestsAdmin(campaignId);
      const maxOrder = list.reduce((max, m) => (m.order > max ? m.order : max), 0);
      const mission = await questService.createQuest({
        campaignId: formIsGlobal ? undefined : campaignId,
        title: formData.title,
        description: formData.description,
        reward: Number(formData.reward),
        type: 'SURVEY',
        imageUrl: formData.imageUrl || undefined,
        active: formIsGlobal ? undefined : formData.active,
        order: maxOrder + 1,
      });
      createdMissionId = mission.id;

      await surveyService.createSurvey({
        missionId: mission.id,
        title: surveyTitle.trim(),
        questions: buildSurveyQuestionsPayload(),
      });

      goBackToList();
    } catch (err: any) {
      // Se a pesquisa falhar depois da missão já ter sido criada, desfaz a
      // missão pra não deixar uma missão de Pesquisa órfã sem perguntas.
      if (createdMissionId) {
        await questService.deleteQuest(createdMissionId).catch(() => {});
      }
      setFormError(getApiErrorMessage(err, 'Erro ao criar a pesquisa da missão.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;

    setIsSaving(true);
    setFormError(null);
    try {
      const payload = {
        campaignId: formIsGlobal ? undefined : campaignId,
        title: formData.title,
        description: formData.description,
        reward: Number(formData.reward),
        referrerReward: formData.type === 'REFERRAL' && formData.referrerReward !== '' ? Number(formData.referrerReward) : undefined,
        type: formData.type,
        imageUrl: formData.imageUrl || undefined,
        links: formData.type === 'PROOF_UPLOAD' ? formData.links.map((l) => l.trim()).filter(Boolean) : [],
        // Ativo/inativo só se aplica a missões de campanha; missões globais são
        // apenas modelos e ficam sempre ativas por padrão (default do banco).
        active: formIsGlobal ? undefined : formData.active,
      };

      if (isEditing && editingQuest) {
        await questService.updateQuest(editingQuest.id, payload);
      } else {
        const list = formIsGlobal
          ? await questService.getGlobalQuests()
          : await questService.getAllCampaignQuestsAdmin(campaignId);
        const maxOrder = list.reduce((max, m) => (m.order > max ? m.order : max), 0);
        await questService.createQuest({ ...payload, order: maxOrder + 1 });
      }
      goBackToList();
    } catch (err: any) {
      setFormError(getApiErrorMessage(err, 'Erro ao salvar missão.'));
    } finally {
      setIsSaving(false);
    }
  };

  if (loadingMission) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-cyber-muted font-mono space-y-4">
        <RefreshCw size={24} className="animate-spin text-cyber-primary" />
        <span>CARREGANDO MISSÃO...</span>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-md mx-auto my-10">
        <Card variant="danger" title="Missão não encontrada">
          <div className="flex flex-col items-center gap-4 text-center py-4">
            <p className="text-sm text-cyber-muted">Esta missão não existe mais ou foi removida.</p>
            <Button variant="primary" size="md" icon={<ArrowLeft size={14} />} onClick={goBackToList}>
              Voltar para Missões
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-inter max-w-3xl mx-auto">
      {/* Top Banner */}
      <div className="flex items-center gap-4 border-b border-cyber-border/40 pb-5">
        <Button variant="secondary" size="sm" icon={<ArrowLeft size={14} />} onClick={goBackToList}>
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-orbitron font-extrabold text-white tracking-widest uppercase">
            {formStep === 'quiz'
              ? `${isEditing ? 'Editar' : 'Criar'} Perguntas do Quiz`
              : formStep === 'feedback'
              ? `${isEditing ? 'Editar' : 'Criar'} Perguntas do Feedback`
              : formStep === 'survey'
              ? `${isEditing ? 'Editar' : 'Criar'} Perguntas da Pesquisa`
              : isEditing
              ? `Editar Missão${formIsGlobal ? ' (Global)' : ''}`
              : `Criar ${formIsGlobal ? 'Missão Global' : 'Missão na Campanha'}`}
          </h1>
          <p className="text-xs font-rajdhani font-bold text-cyber-secondary tracking-widest mt-1">
            {formStep === 'quiz'
              ? 'Monte as perguntas e alternativas do questionário'
              : formStep === 'feedback'
              ? 'Monte as perguntas do formulário de feedback'
              : formStep === 'survey'
              ? 'Monte as perguntas da pesquisa'
              : 'Configuração da missão do participante'}
          </p>
        </div>
      </div>

      {formError && (
        <div className="p-3 bg-cyber-danger/10 border border-cyber-danger/30 text-cyber-danger text-xs font-rajdhani font-bold uppercase rounded tracking-wider">
          ⚠ {formError}
        </div>
      )}

      <Card variant="default">
        {formStep === 'mission' ? (
          <form onSubmit={(isQuizWizard || isFeedbackWizard || isSurveyWizard) ? handleGoToQuizStep : handleFormSubmit} className="flex flex-col gap-4">
            {formIsGlobal && (
              <div className="flex items-center gap-2 bg-cyber-accent/10 border border-cyber-accent/30 rounded p-3 text-xs font-mono text-cyber-accent">
                <Globe size={14} />
                Esta missão será criada sem campanha vinculada (global).
                Você poderá atribuí-la a uma campanha depois
                {(isQuizWizard || isFeedbackWizard || isSurveyWizard) ? ', junto com todas as perguntas já configuradas.' : '.'}
              </div>
            )}

            <Input
              label="Título da Missão"
              placeholder="Ex: Seguir a Rethink3D no Instagram"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />

            <div className="flex flex-col gap-1.5 font-inter">
              <label className="text-xs font-rajdhani font-bold tracking-wider text-cyber-text uppercase px-1">
                Descrição do Desafio
              </label>
              <textarea
                className="w-full bg-cyber-bg border border-cyber-border rounded px-4 py-2.5 text-sm font-rajdhani font-semibold text-white tracking-wide placeholder-cyber-muted focus:border-cyber-secondary focus:ring-1 focus:ring-cyber-secondary focus:outline-none"
                rows={3}
                placeholder="Explique o que o participante precisa fazer para receber a recompensa."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={formData.type === 'QUIZ' ? 'Tickets por Resposta Certa' : 'Recompensa (Tickets)'}
                type="number"
                min={1}
                value={formData.reward}
                onChange={(e) => setFormData({ ...formData, reward: Number(e.target.value) })}
                required
              />

              <div className="flex flex-col gap-1.5 font-inter">
                <label className="text-xs font-rajdhani font-bold tracking-wider text-cyber-text uppercase px-1">
                  Tipo da Missão
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as MissionType })}
                  className="w-full bg-cyber-bg border border-cyber-border rounded px-4 py-2.5 text-sm font-rajdhani font-bold text-white tracking-wide focus:border-cyber-secondary focus:outline-none h-[42px]"
                >
                  <option value="PROOF_UPLOAD">Envio de Comprovante</option>
                  <option value="QUIZ">Questionário (Quiz)</option>
                  <option value="FEEDBACK_FORM">Formulário de Feedback</option>
                  <option value="SURVEY">Pesquisa</option>
                  <option value="REFERRAL">Indique um Amigo</option>
                </select>
              </div>
            </div>

            {formData.type === 'QUIZ' && (
              <p className="text-[11px] text-cyber-muted -mt-2 px-1">
                Cada resposta certa vale essa quantidade de tickets. Quem acerta tudo ganha o máximo possível.
              </p>
            )}

            {formData.type === 'SURVEY' && (
              <p className="text-[11px] text-cyber-muted -mt-2 px-1">
                Recompensa única e fixa ao concluir a pesquisa inteira — não é por pergunta. O participante vê um
                aviso pedindo honestidade e avisando a recompensa antes de começar a responder.
              </p>
            )}

            {formData.type === 'REFERRAL' && (
              <>
                <p className="text-[11px] text-cyber-muted -mt-2 px-1">
                  A recompensa acima vai pra quem usa o código de um amigo. Não há limite de quantas vezes um código pode ser usado nesta campanha.
                </p>
                <Input
                  label="Bônus pro Dono do Código (Opcional)"
                  type="number"
                  min={1}
                  placeholder={`Padrão: ${formData.reward} (igual à recompensa acima)`}
                  value={formData.referrerReward}
                  onChange={(e) => setFormData({ ...formData, referrerReward: e.target.value === '' ? '' : Number(e.target.value) })}
                />
              </>
            )}

            <ImageUploadField
              label="Imagem Decorativa (Opcional)"
              placeholder="Cole uma URL ou envie um arquivo"
              value={formData.imageUrl}
              onChange={(url) => setFormData({ ...formData, imageUrl: url })}
            />

            {formData.type === 'PROOF_UPLOAD' && (
              <div className="flex flex-col gap-1.5 font-inter">
                <label className="text-xs font-rajdhani font-bold tracking-wider text-cyber-text uppercase px-1">
                  Links da Missão (Opcional, até 3)
                </label>
                <div className="flex flex-col gap-2">
                  {formData.links.map((link, index) => (
                    <Input
                      key={index}
                      placeholder="Ex: https://instagram.com/rethink3d"
                      value={link}
                      onChange={(e) => handleLinkChange(index, e.target.value)}
                    />
                  ))}
                </div>
              </div>
            )}

            {!formIsGlobal && (
              <div className="flex items-center gap-2 p-1">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="accent-cyber-secondary rounded bg-cyber-bg border border-cyber-border w-4 h-4 cursor-pointer"
                />
                <label htmlFor="active" className="text-xs font-rajdhani font-bold text-cyber-text uppercase tracking-wider cursor-pointer">
                  Ativar missão imediatamente
                </label>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-4 border-t border-cyber-border/40 pt-4">
              <Button type="button" variant="secondary" onClick={goBackToList} disabled={isSaving}>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSaving}
                disabled={(isQuizWizard || isFeedbackWizard || isSurveyWizard) && isLoadingWizardData}
              >
                {(isQuizWizard || isFeedbackWizard || isSurveyWizard)
                  ? isLoadingWizardData
                    ? 'Carregando Perguntas...'
                    : `Próximo: ${isEditing ? 'Editar' : 'Criar'} Perguntas`
                  : 'Salvar Missão'}
              </Button>
            </div>
          </form>
        ) : formStep === 'quiz' ? (
          <div className="flex flex-col gap-4">
            <Input
              label="Título do Quiz"
              placeholder="Ex: Quiz Rethink3D"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              required
            />

            <div className="flex items-center gap-2 bg-cyber-accent/10 border border-cyber-accent/30 rounded p-3 text-xs font-rajdhani font-semibold text-cyber-accent">
              <CheckCircle2 size={14} className="shrink-0" />
              Cada pergunta vale {formData.reward} ticket{formData.reward === 1 ? '' : 's'} por acerto.
              Com {quizQuestions.length} pergunta{quizQuestions.length === 1 ? '' : 's'}, quem acertar tudo ganha até{' '}
              <strong>{formData.reward * quizQuestions.length} tickets</strong>.
            </div>

            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-rajdhani font-bold text-cyber-text uppercase tracking-wider">
                Perguntas ({quizQuestions.length}/{MAX_QUIZ_QUESTIONS}, mínimo {MIN_QUIZ_QUESTIONS})
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<Plus size={13} />}
                onClick={addQuizQuestion}
                disabled={quizQuestions.length >= MAX_QUIZ_QUESTIONS}
              >
                Adicionar Pergunta
              </Button>
            </div>

            <div className="flex flex-col gap-4">
              {quizQuestions.map((question, qIndex) => (
                <div key={qIndex} className="border border-cyber-border rounded-lg p-4 flex flex-col gap-3 bg-black/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-orbitron font-bold text-white uppercase tracking-wider">
                      Pergunta {qIndex + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeQuizQuestion(qIndex)}
                      disabled={quizQuestions.length <= MIN_QUIZ_QUESTIONS}
                      title={quizQuestions.length <= MIN_QUIZ_QUESTIONS ? `O quiz precisa de ao menos ${MIN_QUIZ_QUESTIONS} perguntas` : 'Remover pergunta'}
                      className="p-1 rounded text-cyber-muted hover:text-cyber-danger disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <Input
                    placeholder="Digite a pergunta"
                    value={question.text}
                    onChange={(e) => updateQuestionField(qIndex, 'text', e.target.value)}
                  />

                  <ImageUploadField
                    label="Imagem da Pergunta (Opcional)"
                    placeholder="Cole uma URL ou envie um arquivo"
                    value={question.imageUrl}
                    onChange={(url) => updateQuestionField(qIndex, 'imageUrl', url)}
                  />

                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-mono text-cyber-muted uppercase tracking-wider">
                      Alternativas (marque a correta)
                    </span>
                    {question.options.map((optionText, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCorrectOption(qIndex, oIndex)}
                          title="Marcar como resposta correta"
                          className={`shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors ${
                            question.correctIndex === oIndex
                              ? 'bg-cyber-success border-cyber-success text-black'
                              : 'border-cyber-border text-transparent hover:border-cyber-success/60'
                          }`}
                        >
                          <CheckCircle2 size={14} />
                        </button>
                        <Input
                          placeholder={`Alternativa ${oIndex + 1}`}
                          value={optionText}
                          onChange={(e) => updateOptionText(qIndex, oIndex, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between gap-3 mt-2 border-t border-cyber-border/40 pt-4">
              <Button
                type="button"
                variant="secondary"
                icon={<ArrowLeft size={14} />}
                onClick={() => setFormStep('mission')}
                disabled={isSaving}
              >
                Voltar
              </Button>
              <Button
                type="button"
                variant="primary"
                isLoading={isSaving}
                disabled={!isQuizStepValid}
                onClick={handleFinalizeQuizMission}
              >
                {isEditing ? 'Salvar Alterações' : 'Concluir e Criar Missão'}
              </Button>
            </div>
          </div>
        ) : formStep === 'feedback' ? (
          <div className="flex flex-col gap-4">
            <Input
              label="Título do Formulário"
              placeholder="Ex: O que você achou da campanha?"
              value={feedbackTitle}
              onChange={(e) => setFeedbackTitle(e.target.value)}
              required
            />

            <div className="flex items-center gap-2 bg-cyber-accent/10 border border-cyber-accent/30 rounded p-3 text-xs font-rajdhani font-semibold text-cyber-accent">
              <CheckCircle2 size={14} className="shrink-0" />
              Quem responder o formulário completo ganha {formData.reward} ticket{formData.reward === 1 ? '' : 's'}.
            </div>

            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-rajdhani font-bold text-cyber-text uppercase tracking-wider">
                Perguntas ({feedbackQuestions.length}/{MAX_FEEDBACK_QUESTIONS}, mínimo {MIN_FEEDBACK_QUESTIONS})
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<Plus size={13} />}
                onClick={addFeedbackQuestion}
                disabled={feedbackQuestions.length >= MAX_FEEDBACK_QUESTIONS}
              >
                Adicionar Pergunta
              </Button>
            </div>

            <div className="flex flex-col gap-4">
              {feedbackQuestions.map((question, qIndex) => (
                <div key={qIndex} className="border border-cyber-border rounded-lg p-4 flex flex-col gap-3 bg-black/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-orbitron font-bold text-white uppercase tracking-wider">
                      Pergunta {qIndex + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFeedbackQuestion(qIndex)}
                      disabled={feedbackQuestions.length <= MIN_FEEDBACK_QUESTIONS}
                      title={feedbackQuestions.length <= MIN_FEEDBACK_QUESTIONS ? `O formulário precisa de ao menos ${MIN_FEEDBACK_QUESTIONS} perguntas` : 'Remover pergunta'}
                      className="p-1 rounded text-cyber-muted hover:text-cyber-danger disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <Input
                    placeholder="Digite a pergunta"
                    value={question.text}
                    onChange={(e) => updateFeedbackQuestionField(qIndex, 'text', e.target.value)}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5 font-inter">
                      <label className="text-[10px] font-mono text-cyber-muted uppercase tracking-wider">
                        Tipo de Pergunta
                      </label>
                      <select
                        value={question.type}
                        onChange={(e) => updateFeedbackQuestionType(qIndex, e.target.value as QuestionType)}
                        className="w-full bg-cyber-bg border border-cyber-border rounded px-3 py-2 text-xs font-rajdhani font-bold text-white tracking-wide focus:border-cyber-secondary focus:outline-none h-[38px]"
                      >
                        {(Object.keys(feedbackQuestionTypeLabels) as QuestionType[])
                          .filter((type) => type !== 'NUMBER')
                          .map((type) => (
                          <option key={type} value={type}>{feedbackQuestionTypeLabels[type]}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 pt-5">
                      <input
                        type="checkbox"
                        id={`required-${qIndex}`}
                        checked={question.required}
                        onChange={(e) => updateFeedbackQuestionField(qIndex, 'required', e.target.checked)}
                        className="accent-cyber-secondary rounded bg-cyber-bg border border-cyber-border w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor={`required-${qIndex}`} className="text-[10px] font-mono text-cyber-muted uppercase tracking-wider cursor-pointer">
                        Resposta obrigatória
                      </label>
                    </div>
                  </div>

                  {questionTypeNeedsOptions(question.type) && (
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-mono text-cyber-muted uppercase tracking-wider">
                        Alternativas
                      </span>
                      {question.options.map((optionText, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-2">
                          <Input
                            placeholder={`Alternativa ${oIndex + 1}`}
                            value={optionText}
                            onChange={(e) => updateFeedbackOptionText(qIndex, oIndex, e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => removeFeedbackOption(qIndex, oIndex)}
                            disabled={question.options.length <= MIN_FEEDBACK_OPTIONS}
                            title={question.options.length <= MIN_FEEDBACK_OPTIONS ? `São necessárias ao menos ${MIN_FEEDBACK_OPTIONS} alternativas` : 'Remover alternativa'}
                            className="shrink-0 p-1.5 rounded text-cyber-muted hover:text-cyber-danger disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addFeedbackOption(qIndex)}
                        disabled={question.options.length >= MAX_FEEDBACK_OPTIONS}
                        className="self-start flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-cyber-secondary hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer mt-1"
                      >
                        <Plus size={11} /> Adicionar Alternativa
                      </button>
                    </div>
                  )}

                  {question.type === 'SCALE' && (
                    <p className="text-[10px] font-mono text-cyber-muted uppercase tracking-wider">
                      O participante escolherá uma nota de 1 (pior) a 5 (melhor).
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between gap-3 mt-2 border-t border-cyber-border/40 pt-4">
              <Button
                type="button"
                variant="secondary"
                icon={<ArrowLeft size={14} />}
                onClick={() => setFormStep('mission')}
                disabled={isSaving}
              >
                Voltar
              </Button>
              <Button
                type="button"
                variant="primary"
                isLoading={isSaving}
                disabled={!isFeedbackStepValid}
                onClick={handleFinalizeFeedbackMission}
              >
                {isEditing ? 'Salvar Alterações' : 'Concluir e Criar Missão'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Input
              label="Título da Pesquisa"
              placeholder="Ex: Pesquisa sobre o público de impressão 3D"
              value={surveyTitle}
              onChange={(e) => setSurveyTitle(e.target.value)}
              required
            />

            <div className="flex items-center gap-2 bg-cyber-accent/10 border border-cyber-accent/30 rounded p-3 text-xs font-rajdhani font-semibold text-cyber-accent">
              <CheckCircle2 size={14} className="shrink-0" />
              Quem responder a pesquisa inteira ganha {formData.reward} ticket{formData.reward === 1 ? '' : 's'}.
              O participante verá um aviso de honestidade e a recompensa antes de começar.
            </div>

            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-rajdhani font-bold text-cyber-text uppercase tracking-wider">
                Perguntas ({surveyQuestions.length}/{MAX_SURVEY_QUESTIONS}, mínimo {MIN_SURVEY_QUESTIONS})
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<Plus size={13} />}
                onClick={addSurveyQuestion}
                disabled={surveyQuestions.length >= MAX_SURVEY_QUESTIONS}
              >
                Adicionar Pergunta
              </Button>
            </div>

            <div className="flex flex-col gap-4">
              {surveyQuestions.map((question, qIndex) => (
                <div key={qIndex} className="border border-cyber-border rounded-lg p-4 flex flex-col gap-3 bg-black/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-orbitron font-bold text-white uppercase tracking-wider">
                      Pergunta {qIndex + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSurveyQuestion(qIndex)}
                      disabled={surveyQuestions.length <= MIN_SURVEY_QUESTIONS}
                      title={surveyQuestions.length <= MIN_SURVEY_QUESTIONS ? `A pesquisa precisa de ao menos ${MIN_SURVEY_QUESTIONS} perguntas` : 'Remover pergunta'}
                      className="p-1 rounded text-cyber-muted hover:text-cyber-danger disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <Input
                    placeholder="Digite a pergunta"
                    value={question.text}
                    onChange={(e) => updateSurveyQuestionField(qIndex, 'text', e.target.value)}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5 font-inter">
                      <label className="text-[10px] font-mono text-cyber-muted uppercase tracking-wider">
                        Tipo de Pergunta
                      </label>
                      <select
                        value={question.type}
                        onChange={(e) => updateSurveyQuestionType(qIndex, e.target.value as QuestionType)}
                        className="w-full bg-cyber-bg border border-cyber-border rounded px-3 py-2 text-xs font-rajdhani font-bold text-white tracking-wide focus:border-cyber-secondary focus:outline-none h-[38px]"
                      >
                        {(Object.keys(surveyQuestionTypeLabels) as QuestionType[]).map((type) => (
                          <option key={type} value={type}>{surveyQuestionTypeLabels[type]}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 pt-5">
                      <input
                        type="checkbox"
                        id={`survey-required-${qIndex}`}
                        checked={question.required}
                        onChange={(e) => updateSurveyQuestionField(qIndex, 'required', e.target.checked)}
                        className="accent-cyber-secondary rounded bg-cyber-bg border border-cyber-border w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor={`survey-required-${qIndex}`} className="text-[10px] font-mono text-cyber-muted uppercase tracking-wider cursor-pointer">
                        Resposta obrigatória
                      </label>
                    </div>
                  </div>

                  {questionTypeNeedsOptions(question.type) && (
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-mono text-cyber-muted uppercase tracking-wider">
                        Alternativas
                      </span>
                      {question.options.map((optionText, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-2">
                          <Input
                            placeholder={`Alternativa ${oIndex + 1}`}
                            value={optionText}
                            onChange={(e) => updateSurveyOptionText(qIndex, oIndex, e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => removeSurveyOption(qIndex, oIndex)}
                            disabled={question.options.length <= MIN_SURVEY_OPTIONS}
                            title={question.options.length <= MIN_SURVEY_OPTIONS ? `São necessárias ao menos ${MIN_SURVEY_OPTIONS} alternativas` : 'Remover alternativa'}
                            className="shrink-0 p-1.5 rounded text-cyber-muted hover:text-cyber-danger disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addSurveyOption(qIndex)}
                        disabled={question.options.length >= MAX_SURVEY_OPTIONS}
                        className="self-start flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-cyber-secondary hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer mt-1"
                      >
                        <Plus size={11} /> Adicionar Alternativa
                      </button>
                    </div>
                  )}

                  {question.type === 'SCALE' && (
                    <p className="text-[10px] font-mono text-cyber-muted uppercase tracking-wider">
                      O participante escolherá uma nota de 1 (pior) a 5 (melhor).
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between gap-3 mt-2 border-t border-cyber-border/40 pt-4">
              <Button
                type="button"
                variant="secondary"
                icon={<ArrowLeft size={14} />}
                onClick={() => setFormStep('mission')}
                disabled={isSaving}
              >
                Voltar
              </Button>
              <Button
                type="button"
                variant="primary"
                isLoading={isSaving}
                disabled={!isSurveyStepValid}
                onClick={handleFinalizeSurveyMission}
              >
                {isEditing ? 'Salvar Alterações' : 'Concluir e Criar Missão'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default MissionFormPage;
