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
  email?: string | null;
  instagram?: string | null;
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
export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'DRAWING' | 'FINISHED';

export interface Campaign {
  id: string;
  name: string;
  description?: string | null;
  status: CampaignStatus;
  startDate?: string | null;
  drawDate?: string | null;
  createdAt: string;
  updatedAt: string;
  missions?: Mission[];
  prizes?: Prize[];
  draws?: Draw[];
  tickets?: Ticket[];
  quiz?: Quiz | null;
  feedbackForm?: FeedbackForm | null;
}

// ─── MISSION TYPES ───────────────────────────────────────────────
export type MissionType = 'PROOF_UPLOAD' | 'QUIZ' | 'FEEDBACK_FORM' | 'AUTOMATIC';

export interface Mission {
  id: string;
  campaignId: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  reward: number;
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
  proofStatus?: ProofStatus;
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
  campaignId: string;
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
export type QuestionType = 'TEXT' | 'MULTIPLE_CHOICE' | 'CHECKBOX' | 'SCALE';

export interface FeedbackForm {
  id: string;
  campaignId: string;
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

// ─── PRIZE TYPES ─────────────────────────────────────────────────
export interface Prize {
  id: string;
  campaignId: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  campaign?: Campaign;
  draws?: Draw[];
}

// ─── DRAW TYPES ──────────────────────────────────────────────────
export type DrawStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Draw {
  id: string;
  campaignId: string;
  prizeId: string;
  status: DrawStatus;
  winnerId?: string | null;
  winnerName?: string | null;
  totalTickets?: number | null;
  drawnAt?: string | null;
  createdAt: string;
  campaign?: Campaign;
  prize?: Prize;
  participants?: DrawParticipant[];
  auditLog?: AuditLog | null;
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
  prizeId: string;
  winnerId?: string | null;
  totalParticipants: number;
  totalTickets: number;
  snapshot: any;
  createdAt: string;
  draw?: Draw;
}
