import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Layout } from '../components/layout/Layout';

// Public & Main Participant Pages (Importação estática para evitar redirecionamento com tela de loading do Suspense)
import LandingPage from '../pages/public/LandingPage';
import LoginPage from '../pages/public/LoginPage';
import RegisterPage from '../pages/public/RegisterPage';
import ChangePinPage from '../pages/public/ChangePinPage';
import DashboardPage from '../pages/participant/DashboardPage';
const QuestsPage     = lazy(() => import('../pages/participant/QuestsPage'));
const QuizPage       = lazy(() => import('../pages/participant/QuizPage'));
const FeedbackPage   = lazy(() => import('../pages/participant/FeedbackPage'));
const SurveyPage     = lazy(() => import('../pages/participant/SurveyPage'));
const DrawWatchPage  = lazy(() => import('../pages/participant/DrawWatchPage'));
const RankingPage    = lazy(() => import('../pages/participant/RankingPage'));

// Admin Pages
const AdminLoginPage  = lazy(() => import('../pages/admin/AdminLoginPage'));
const AdminDashboard  = lazy(() => import('../pages/admin/AdminDashboard'));
const CampaignsPage   = lazy(() => import('../pages/admin/CampaignsPage'));
const MissionsPage    = lazy(() => import('../pages/admin/MissionsPage'));
const MissionFormPage = lazy(() => import('../pages/admin/MissionFormPage'));
const ParticipantsPage = lazy(() => import('../pages/admin/ParticipantsPage'));
const ParticipantProofsPage = lazy(() => import('../pages/admin/ParticipantProofsPage'));
const FeedbackResultsPage = lazy(() => import('../pages/admin/FeedbackResultsPage'));
const SurveyResultsPage = lazy(() => import('../pages/admin/SurveyResultsPage'));
const PrizesPage      = lazy(() => import('../pages/admin/PrizesPage'));
const DrawControlPage = lazy(() => import('../pages/admin/DrawControlPage'));
const AdminRankingPage = lazy(() => import('../pages/admin/RankingPage'));

// ─── Loading Fallback ────────────────────────────────────────────────────────
const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[60vh] select-none pointer-events-none">
    <div className="flex flex-col items-center gap-2">
      <div
        style={{ width: 100, height: 100 }}
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
      <span className="text-[10px] font-mono text-cyber-secondary tracking-widest uppercase animate-pulse">
        CARREGANDO RECURSOS...
      </span>
    </div>
  </div>
);

// ─── Route Guards ────────────────────────────────────────────────────────────
const LayoutWrapper: React.FC = () => (
  <Layout>
    <Suspense fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  </Layout>
);

const ParticipantRoute: React.FC = () => {
  const { token, role, mustChangePin } = useAuthStore();
  const location = useLocation();
  if (!token || role !== 'participant') return <Navigate to="/login" replace />;
  if (mustChangePin && location.pathname !== '/change-pin') {
    return <Navigate to="/change-pin" replace />;
  }
  return <Outlet />;
};

const AdminRoute: React.FC = () => {
  const { token, role } = useAuthStore();
  if (!token || role !== 'admin') return <Navigate to="/admin/login" replace />;
  return <Outlet />;
};

const HomeRedirect: React.FC = () => {
  const { token, role } = useAuthStore();
  if (token) return <Navigate to={role === 'admin' ? '/admin' : '/dashboard'} replace />;
  return <LandingPage />;
};

const PublicRoute: React.FC = () => {
  const { token, role } = useAuthStore();
  if (token) return <Navigate to={role === 'admin' ? '/admin' : '/dashboard'} replace />;
  return <Outlet />;
};

// ─── Router ──────────────────────────────────────────────────────────────────
export const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route element={<LayoutWrapper />}>
        {/* Página inicial */}
        <Route path="/" element={<HomeRedirect />} />

        {/* Rotas públicas (redireciona se já logado) */}
        <Route element={<PublicRoute />}>
          <Route path="/login"       element={<LoginPage />} />
          <Route path="/register"    element={<RegisterPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
        </Route>

        {/* Rotas de transmissão pública (acessível a qualquer visitante) */}
        <Route path="/watch/:campaignId"      element={<DrawWatchPage />} />
        <Route path="/draw/watch"             element={<DrawWatchPage />} />

        {/* Rotas protegidas — Participante */}
        <Route element={<ParticipantRoute />}>
          <Route path="/change-pin"             element={<ChangePinPage />} />
          <Route path="/dashboard"              element={<DashboardPage />} />
          <Route path="/quests"                 element={<QuestsPage />} />
          <Route path="/quiz/:missionId"        element={<QuizPage />} />
          <Route path="/feedback/:missionId"    element={<FeedbackPage />} />
          <Route path="/survey/:missionId"      element={<SurveyPage />} />
          <Route path="/ranking"                element={<RankingPage />} />
        </Route>

        {/* Rotas protegidas — Admin */}
        <Route element={<AdminRoute />}>
          <Route path="/admin"                  element={<AdminDashboard />} />
          <Route path="/admin/campaigns"        element={<CampaignsPage />} />
          <Route path="/admin/missions"         element={<MissionsPage />} />
          <Route path="/admin/missions/new"     element={<MissionFormPage />} />
          <Route path="/admin/missions/:missionId/edit" element={<MissionFormPage />} />
          <Route path="/admin/missions/:missionId/feedback-results" element={<FeedbackResultsPage />} />
          <Route path="/admin/missions/:missionId/survey-results" element={<SurveyResultsPage />} />
          <Route path="/admin/participants"     element={<ParticipantsPage />} />
          <Route path="/admin/participants/:userId/proofs" element={<ParticipantProofsPage />} />
          <Route path="/admin/prizes"           element={<PrizesPage />} />
          <Route path="/admin/draw-control"     element={<DrawControlPage />} />
          <Route path="/admin/ranking"          element={<AdminRankingPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default AppRouter;
