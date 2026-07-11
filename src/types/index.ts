// ─── ADMIN & AUTH TYPES ──────────────────────────────────────────
export type AdminRole = 'SUPER_ADMIN' | 'OPERATOR';

export interface Admin {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  // Código de 6 dígitos gerado no cadastro, usado por outros participantes
  // pra cumprir a missão de indicar um amigo.
  referralCode?: string;
  mustChangePinOnNextLogin: boolean;
  createdAt: string;
  updatedAt: string;
  completions?: MissionCompletion[];
  proofs?: MissionProof[];
  quizAnswers?: QuizAnswer[];
  feedbackResponses?: FeedbackResponse[];
  tickets?: Ticket[];
  drawParticipations?: DrawParticipant[];
}

// ─── CAMPAIGN TYPES ──────────────────────────────────────────────
export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'DRAWING' | 'PAUSED' | 'FINISHED';

export interface Campaign {
  id: string;
  name: string;
  description?: string | null;
  coverImageUrl?: string | null;
  status: CampaignStatus;
  startDate?: string | null;
  drawDate?: string | null;
  createdAt: string;
  updatedAt: string;
  missions?: Mission[];
  vault?: Vault | null;
  draws?: Draw[];
  drawSessions?: DrawSession[];
  tickets?: Ticket[];
  quiz?: Quiz | null;
  feedbackForm?: FeedbackForm | null;
  drawSchedules?: DrawSchedule[];
}

// ─── HORÁRIOS DE SORTEIO ─────────────────────────────────────────
// Só define QUANDO um sorteio deve acontecer — o que será sorteado continua
// 100% manual, configurado pelo admin na hora de executar. Livremente
// editável: uma campanha pode ter vários horários agendados.
export interface DrawSchedule {
  id: string;
  campaignId: string;
  scheduledAt: string;
  label?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── MISSION TYPES ───────────────────────────────────────────────
export type MissionType = 'PROOF_UPLOAD' | 'QUIZ' | 'FEEDBACK_FORM' | 'REFERRAL' | 'SURVEY';

export interface Mission {
  id: string;
  campaignId: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  links?: string[];
  reward: number;
  // Só se aplica ao tipo REFERRAL: bônus de tickets pro dono do código usado.
  // Nulo = usa o mesmo valor de `reward`.
  referrerReward?: number | null;
  type: MissionType;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  campaign?: Campaign;
  completions?: MissionCompletion[];
  proofs?: MissionProof[];

  // Custom UI helper attributes
  isCompleted?: boolean;
}

export interface MissionCompletion {
  id: string;
  userId: string;
  missionId: string;
  completedAt: string;
  user?: User;
  mission?: Mission;
}

export type ProofStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface MissionProof {
  id: string;
  userId: string;
  missionId: string;
  s3Key: string;
  mimeType: string;
  fileSize: number;
  status: ProofStatus;
  uploadedAt: string;
  user?: User;
  mission?: Mission;
}

// ─── QUIZ TYPES ──────────────────────────────────────────────────
export interface Quiz {
  id: string;
  missionId: string;
  campaignId?: string | null;
  title: string;
  createdAt: string;
  updatedAt: string;
  campaign?: Campaign;
  questions?: QuizQuestion[];
  answers?: QuizAnswer[];
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  text: string;
  imageUrl?: string | null;
  order: number;
  createdAt: string;
  quiz?: Quiz;
  options: QuizOption[];
}

export interface QuizOption {
  id: string;
  questionId: string;
  text: string;
  isCorrect?: boolean;
  question?: QuizQuestion;
}

// Resposta do endpoint de submissão do quiz (não é a linha do banco QuizAnswer)
export interface QuizSubmitResult {
  score: number;
  totalQuestions: number;
  percentage: number;
  ticketsEarned: number;
}

export interface QuizAnswer {
  id: string;
  userId: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  answeredAt: string;
  user?: User;
  quiz?: Quiz;
}

// ─── FEEDBACK TYPES ──────────────────────────────────────────────
export type QuestionType = 'TEXT' | 'MULTIPLE_CHOICE' | 'CHECKBOX' | 'SCALE' | 'NUMBER';

export interface FeedbackForm {
  id: string;
  missionId: string;
  campaignId?: string | null;
  title: string;
  createdAt: string;
  updatedAt: string;
  campaign?: Campaign;
  questions: FeedbackQuestion[];
  responses?: FeedbackResponse[];
}

export interface FeedbackQuestion {
  id: string;
  formId: string;
  text: string;
  type: QuestionType;
  order: number;
  required: boolean;
  conditionKey?: string | null;
  conditionValue?: string | null;
  createdAt: string;
  form?: FeedbackForm;
  options: FeedbackOption[];
}

export interface FeedbackOption {
  id: string;
  questionId: string;
  text: string;
  value: string;
  question?: FeedbackQuestion;
}

export interface FeedbackResponse {
  id: string;
  userId: string;
  formId: string;
  answers: Record<string, string | string[]>;
  createdAt: string;
  user?: User;
  form?: FeedbackForm;
}

// ─── FEEDBACK STATS (central de resultados) ──────────────────────
export interface FeedbackOptionStat {
  value: string;
  text: string;
  count: number;
  percentage: number;
}

export interface FeedbackScaleStat {
  average: number;
  distribution: { value: number; count: number }[];
}

export interface FeedbackQuestionStat {
  id: string;
  text: string;
  type: QuestionType;
  order: number;
  answeredCount: number;
  options?: FeedbackOptionStat[];
  scale?: FeedbackScaleStat;
  textAnswers?: string[];
}

export interface FeedbackFormStats {
  formId: string;
  title: string;
  totalResponses: number;
  questions: FeedbackQuestionStat[];
}

// ─── PESQUISA (SURVEY) TYPES ──────────────────────────────────────
// Mesma estrutura do Formulário de Feedback, mas tipo de missão separado:
// mostra um aviso de honestidade antes de começar e paga uma recompensa
// fixa única ao concluir (sem pontuação por pergunta).
export interface Survey {
  id: string;
  missionId: string;
  campaignId?: string | null;
  title: string;
  createdAt: string;
  updatedAt: string;
  campaign?: Campaign;
  questions: SurveyQuestion[];
  responses?: SurveyResponse[];
}

export interface SurveyQuestion {
  id: string;
  surveyId: string;
  text: string;
  type: QuestionType;
  order: number;
  required: boolean;
  conditionKey?: string | null;
  conditionValue?: string | null;
  createdAt: string;
  survey?: Survey;
  options: SurveyOption[];
}

export interface SurveyOption {
  id: string;
  questionId: string;
  text: string;
  value: string;
  question?: SurveyQuestion;
}

export interface SurveyResponse {
  id: string;
  userId: string;
  surveyId: string;
  answers: Record<string, string | string[]>;
  createdAt: string;
  user?: User;
  survey?: Survey;
}

// ─── SURVEY STATS (central de resultados) ─────────────────────────
export interface SurveyOptionStat {
  value: string;
  text: string;
  count: number;
  percentage: number;
}

export interface SurveyScaleStat {
  average: number;
  distribution: { value: number; count: number }[];
}

// Estatística de perguntas do tipo NUMBER (resposta numérica livre, sem o
// range fixo de 1-5 do SCALE) — só disponível em Pesquisa, não em Feedback.
export interface SurveyNumberStat {
  average: number;
  min: number;
  max: number;
}

export interface SurveyQuestionStat {
  id: string;
  text: string;
  type: QuestionType;
  order: number;
  answeredCount: number;
  options?: SurveyOptionStat[];
  scale?: SurveyScaleStat;
  number?: SurveyNumberStat;
  textAnswers?: string[];
}

export interface SurveyStats {
  surveyId: string;
  title: string;
  totalResponses: number;
  questions: SurveyQuestionStat[];
}

// ─── TICKET TYPES ────────────────────────────────────────────────
export interface Ticket {
  id: string;
  userId: string;
  campaignId: string;
  missionId?: string | null;
  quantity: number;
  createdAt: string;
  user?: User;
  campaign?: Campaign;
}

// Entrada do histórico de cupons do participante (GET /campaigns/:id/my-ticket-history)
export interface TicketHistoryEntry {
  id: string;
  quantity: number;
  createdAt: string;
  missionTitle: string | null;
  missionType: MissionType | null;
  // true só no ticket de bônus creditado a quem é DONO do código usado.
  isReferralBonus: boolean;
  // Pra tickets de missão REFERRAL: nome da pessoa do outro lado da indicação.
  relatedUserName: string | null;
}

// ─── COFRE (VAULT) & PRIZE TYPES ──────────────────────────────────
export interface Vault {
  id: string;
  campaignId: string;
  createdAt: string;
  updatedAt: string;
  campaign?: Campaign;
  prizes?: Prize[];
}

export interface Prize {
  id: string;
  vaultId: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  quantity: number;
  claimed: number;
  // Conveniência calculada pelo backend: quantity - claimed
  available?: number;
  createdAt: string;
  updatedAt: string;
  vault?: Vault;
  draws?: Draw[];
}

// ─── DRAW TYPES ──────────────────────────────────────────────────
// Todo sorteio decide o ganhador e o prêmio do cofre juntos. Sem sessão =
// sorteio avulso; com sessão = uma rodada de um sorteio em cadeia.
export type DrawStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type DrawSessionStatus = 'ACTIVE' | 'ENDED';
export type SessionOrderStrategy = 'RANDOM' | 'FIXED_ORDER';

export interface Draw {
  id: string;
  campaignId: string;
  prizeId?: string | null;
  sessionId?: string | null;
  status: DrawStatus;
  winnerId?: string | null;
  winnerName?: string | null;
  totalTickets?: number | null;
  drawnAt?: string | null;
  createdAt: string;
  campaign?: Campaign;
  prize?: Prize | null;
  session?: DrawSession | null;
  participants?: DrawParticipant[];
  auditLog?: AuditLog | null;
}

export interface DrawSession {
  id: string;
  campaignId: string;
  status: DrawSessionStatus;
  orderStrategy: SessionOrderStrategy;
  prizeOrder?: string[] | null;
  nextOrderIndex: number;
  createdAt: string;
  endedAt?: string | null;
  campaign?: Campaign;
  draws?: Draw[];
}

export interface DrawParticipant {
  id: string;
  drawId: string;
  userId: string;
  tickets: number;
  draw?: Draw;
  user?: User;
}

export interface AuditLog {
  id: string;
  drawId: string;
  campaignId: string;
  prizeId?: string | null;
  winnerId?: string | null;
  totalParticipants: number;
  totalTickets: number;
  snapshot: any;
  createdAt: string;
  draw?: Draw;
}
