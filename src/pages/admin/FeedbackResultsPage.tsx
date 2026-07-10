import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { feedbackService } from '../../services/feedback.service';
import type { FeedbackForm, FeedbackFormStats, QuestionType } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { getApiErrorMessage } from '../../utils/apiError';
import { ArrowLeft, RefreshCw, Download, MessageSquare, Users, Star } from 'lucide-react';

const CHART_COLORS = ['#7c3aed', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#a855f7'];

const questionTypeLabels: Record<QuestionType, string> = {
  TEXT: 'Resposta Aberta',
  MULTIPLE_CHOICE: 'Escolha Única',
  CHECKBOX: 'Múltipla Escolha',
  SCALE: 'Escala de 1 a 5',
};

const TEXT_ANSWERS_PAGE_SIZE = 20;

export const FeedbackResultsPage: React.FC = () => {
  const { missionId } = useParams<{ missionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const missionTitle = (location.state as { missionTitle?: string } | null)?.missionTitle;

  const [form, setForm] = useState<FeedbackForm | null>(null);
  const [stats, setStats] = useState<FeedbackFormStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [textAnswerLimits, setTextAnswerLimits] = useState<Record<string, number>>({});

  const loadData = async () => {
    if (!missionId) return;
    try {
      setIsLoading(true);
      setError(null);
      const formData = await feedbackService.getFeedbackByMission(missionId);
      const statsData = await feedbackService.getStats(formData.id);
      setForm(formData);
      setStats(statsData);
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Erro ao carregar os resultados deste formulário.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionId]);

  const handleShowMoreText = (questionId: string) => {
    setTextAnswerLimits((prev) => ({
      ...prev,
      [questionId]: (prev[questionId] ?? TEXT_ANSWERS_PAGE_SIZE) + TEXT_ANSWERS_PAGE_SIZE,
    }));
  };

  const handleExportCsv = async () => {
    if (!form) return;
    setIsExporting(true);
    setError(null);
    try {
      const responses = await feedbackService.getResponses(form.id);
      const sortedQuestions = [...form.questions].sort((a, b) => a.order - b.order);

      const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;

      const headers = ['Participante', 'Telefone', 'Data de Envio', ...sortedQuestions.map((q) => q.text)];
      const rows = responses.map((r) => {
        const answerCells = sortedQuestions.map((q) => {
          const value = r.answers[q.id];
          const text = Array.isArray(value) ? value.join('; ') : value ?? '';
          return escapeCsv(String(text));
        });
        return [
          escapeCsv(r.user?.name ?? ''),
          escapeCsv(r.user?.phone ?? ''),
          escapeCsv(new Date(r.createdAt).toLocaleString('pt-BR')),
          ...answerCells,
        ].join(',');
      });

      const csvContent = [headers.map(escapeCsv).join(','), ...rows].join('\n');
      const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `feedback-${form.title.trim().replace(/\s+/g, '-').toLowerCase()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Erro ao exportar CSV.'));
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-cyber-muted font-mono space-y-4">
        <RefreshCw size={24} className="animate-spin text-cyber-primary" />
        <span>CARREGANDO RESULTADOS...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-inter">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-cyber-border/40 pb-5">
        <div className="flex items-center gap-4 min-w-0">
          <Button variant="secondary" size="sm" icon={<ArrowLeft size={14} />} onClick={() => navigate('/admin/missions')}>
            Voltar
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl font-orbitron font-extrabold text-white tracking-widest uppercase break-words">
              Resultados do Feedback
            </h1>
            <p className="text-xs font-rajdhani font-bold text-cyber-secondary tracking-widest mt-1 break-words">
              {stats?.title || missionTitle || 'Central de respostas'}
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="accent" size="sm" icon={<Download size={14} />} isLoading={isExporting} onClick={handleExportCsv} disabled={!form}>
            Exportar CSV
          </Button>
          <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={loadData}>
            Recarregar
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-cyber-danger/10 border border-cyber-danger/30 text-cyber-danger text-xs font-rajdhani font-bold uppercase rounded tracking-wider">
          ⚠ {error}
        </div>
      )}

      {stats && (
        <Card variant="primary" glow>
          <div className="flex items-center gap-3">
            <Users size={22} className="text-cyber-primary shrink-0" />
            <div>
              <div className="text-2xl font-orbitron font-extrabold text-white">{stats.totalResponses}</div>
              <div className="text-[10px] font-mono text-cyber-muted uppercase tracking-wider">Respostas Recebidas</div>
            </div>
          </div>
        </Card>
      )}

      {stats && stats.totalResponses === 0 && (
        <Card variant="default">
          <div className="text-center py-10 font-mono text-cyber-muted">
            NENHUMA RESPOSTA FOI ENVIADA PARA ESTE FORMULÁRIO AINDA.
          </div>
        </Card>
      )}

      {stats && stats.questions.map((question) => (
        <Card key={question.id} variant="default" title={question.text} subtitle={`${questionTypeLabels[question.type]} · ${question.answeredCount} resposta${question.answeredCount === 1 ? '' : 's'}`}>
          {(question.type === 'MULTIPLE_CHOICE' || question.type === 'CHECKBOX') && question.options && (
            <div className="w-full" style={{ height: Math.max(question.options.length * 48, 120) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={question.options} layout="vertical" margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e3a" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} stroke="#64748b" fontSize={11} />
                  <YAxis
                    type="category"
                    dataKey="text"
                    width={160}
                    stroke="#e2e8f0"
                    fontSize={11}
                    tick={{ fill: '#e2e8f0' }}
                  />
                  <Tooltip
                    contentStyle={{ background: '#12121e', border: '1px solid #1e1e3a', borderRadius: 6 }}
                    labelStyle={{ color: '#e2e8f0' }}
                    formatter={(value, _name, props: any) => [`${value} (${props.payload.percentage}%)`, 'Respostas']}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {question.options.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {question.type === 'SCALE' && question.scale && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Star size={16} className="text-cyber-accent" />
                <span className="text-sm font-rajdhani font-bold text-white">
                  Média: <span className="text-cyber-accent">{question.scale.average.toFixed(2)}</span> / 5
                </span>
              </div>
              <div className="w-full" style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={question.scale.distribution} margin={{ left: 0, right: 8, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e3a" vertical={false} />
                    <XAxis dataKey="value" stroke="#64748b" fontSize={11} />
                    <YAxis allowDecimals={false} stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{ background: '#12121e', border: '1px solid #1e1e3a', borderRadius: 6 }}
                      labelStyle={{ color: '#e2e8f0' }}
                      formatter={(value) => [`${value}`, 'Respostas']}
                      labelFormatter={(label) => `Nota ${label}`}
                    />
                    <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {question.type === 'TEXT' && question.textAnswers && (
            question.textAnswers.length === 0 ? (
              <div className="flex items-center gap-2 text-cyber-muted text-xs font-mono uppercase py-4 justify-center">
                <MessageSquare size={14} /> Nenhuma resposta de texto ainda.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
                  {question.textAnswers.slice(0, textAnswerLimits[question.id] ?? TEXT_ANSWERS_PAGE_SIZE).map((answer, idx) => (
                    <div key={idx} className="p-3 rounded bg-black/25 border border-cyber-border/50 text-xs font-rajdhani font-semibold text-cyber-text break-words">
                      {answer}
                    </div>
                  ))}
                </div>
                {question.textAnswers.length > (textAnswerLimits[question.id] ?? TEXT_ANSWERS_PAGE_SIZE) && (
                  <Button variant="secondary" size="sm" onClick={() => handleShowMoreText(question.id)}>
                    Mostrar Mais ({question.textAnswers.length - (textAnswerLimits[question.id] ?? TEXT_ANSWERS_PAGE_SIZE)} restantes)
                  </Button>
                )}
              </div>
            )
          )}
        </Card>
      ))}
    </div>
  );
};

export default FeedbackResultsPage;
