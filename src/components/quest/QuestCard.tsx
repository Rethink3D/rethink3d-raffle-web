import React from 'react';
import { CheckCircle2, Clock, Play, UploadCloud, HelpCircle, FileText, ExternalLink, Users } from 'lucide-react';
import type { Mission, MissionType } from '../../types';
import { Button } from '../ui/Button';

interface QuestCardProps {
  mission: Mission;
  onAction?: (mission: Mission) => void;
  isLoading?: boolean;
}

export const QuestCard: React.FC<QuestCardProps> = ({
  mission,
  onAction,
  isLoading = false,
}) => {
  const { title, description, reward, type, isCompleted, links, imageUrl } = mission;

  // Type Badges styling and icons
  const getTypeBadge = (type: MissionType) => {
    switch (type) {
      case 'PROOF_UPLOAD':
        return {
          label: 'Comprovante',
          classes: 'text-cyber-primary border-cyber-primary/40 bg-cyber-primary/5',
          icon: <UploadCloud size={12} />,
        };
      case 'QUIZ':
        return {
          label: 'Quiz',
          classes: 'text-cyber-secondary border-cyber-secondary/40 bg-cyber-secondary/5',
          icon: <HelpCircle size={12} />,
        };
      case 'FEEDBACK_FORM':
        return {
          label: 'Feedback',
          classes: 'text-cyber-accent border-cyber-accent/40 bg-cyber-accent/5',
          icon: <FileText size={12} />,
        };
      case 'REFERRAL':
        return {
          label: 'Indicação',
          classes: 'text-cyber-success border-cyber-success/40 bg-cyber-success/5',
          icon: <Users size={12} />,
        };
      default:
        return {
          label: 'Missão',
          classes: 'text-cyber-success border-cyber-success/40 bg-cyber-success/5',
          icon: <CheckCircle2 size={12} />,
        };
    }
  };

  const badgeInfo = getTypeBadge(type);

  // Completion statuses — o envio de comprovante é liberado na hora (sem espera
  // de revisão manual), então só existem dois estados possíveis pro participante.
  const renderStatus = () => {
    if (isCompleted) {
      return (
        <div className="flex items-center gap-1.5 text-cyber-success font-mono text-xs font-bold bg-cyber-success/10 border border-cyber-success/40 px-2.5 py-1 rounded">
          <CheckCircle2 size={13} className="text-cyber-success" />
          <span>Concluída</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1.5 text-cyber-muted font-mono text-xs bg-cyber-border/30 border border-cyber-border/80 px-2.5 py-1 rounded">
        <Clock size={13} />
        <span>Disponível</span>
      </div>
    );
  };

  // Button text & action
  const getActionText = () => {
    if (isCompleted) return null;

    if (type === 'QUIZ') {
      return 'Iniciar Quiz';
    }
    if (type === 'FEEDBACK_FORM') {
      return 'Responder Feedback';
    }
    if (type === 'PROOF_UPLOAD') {
      return 'Enviar Comprovante';
    }
    if (type === 'REFERRAL') {
      return 'Usar Código de Amigo';
    }
    return null;
  };

  const actionText = getActionText();

  return (
    <div
      className={`
        relative bg-cyber-surface/90 border rounded-lg p-5 transition-all duration-300 flex flex-col gap-4 clip-cyber-card
        ${isCompleted
          ? 'border-cyber-success/30 bg-gradient-to-r from-cyber-success/5 to-transparent'
          : 'border-cyber-border hover:border-cyber-secondary/50'}
      `}
    >
      {/* Decorative vertical accent bar */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg
          ${isCompleted ? 'bg-cyber-success' : 'bg-cyber-secondary'}
        `}
      />

      {/* Top row: image (esquerda) + badges/título + botão de ação (desktop) */}
      <div className="flex flex-row items-start gap-4">
        {imageUrl && (
          <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 self-start rounded-md overflow-hidden border border-cyber-border/60 bg-black/40 flex items-center justify-center">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {/* Top Badges Row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Quest Type Badge */}
            <span className={`inline-flex items-center gap-1.5 border px-2 py-0.5 rounded text-[10px] font-mono tracking-wider font-extrabold uppercase ${badgeInfo.classes}`}>
              {badgeInfo.icon}
              {badgeInfo.label}
            </span>

            {/* Reward Tickets Badge */}
            <span className="inline-flex items-center gap-1 text-cyber-accent font-orbitron font-black text-[11px] tracking-wide bg-cyber-accent/5 border border-cyber-accent/30 px-2 py-0.5 rounded">
              {type === 'QUIZ' ? `+${reward} por acerto` : `+${reward} cupons`}
            </span>
          </div>

          {/* Quest Title */}
          <h4 className="text-base font-orbitron font-bold text-white uppercase tracking-wide break-words">
            {title}
          </h4>
        </div>

        {/* Action Button (desktop) */}
        {actionText && onAction && (
          <div className="hidden md:flex flex-shrink-0 items-center">
            <Button
              onClick={() => onAction(mission)}
              variant={type === 'QUIZ' ? 'secondary' : type === 'FEEDBACK_FORM' ? 'accent' : 'primary'}
              size="md"
              isLoading={isLoading}
              icon={type === 'PROOF_UPLOAD' ? <UploadCloud size={14} /> : <Play size={14} />}
            >
              {actionText}
            </Button>
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-cyber-muted font-inter leading-relaxed break-words">
        {description}
      </p>

      {/* Mission links (ex: post pra curtir, perfil pra seguir) — só para missões de comprovante */}
      {type === 'PROOF_UPLOAD' && links && links.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {links.map((link, index) => (
            <a
              key={index}
              href={link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-rajdhani font-bold text-cyber-secondary border border-cyber-secondary/40 bg-cyber-secondary/5 px-2.5 py-1 rounded hover:bg-cyber-secondary/15 transition-colors"
            >
              <ExternalLink size={11} />
              Abrir Link {links.length > 1 ? index + 1 : ''}
            </a>
          ))}
        </div>
      )}

      {/* Status tracker */}
      <div className="flex items-center gap-3">
        {renderStatus()}
      </div>

      {/* Action Button (mobile, ocupa a largura toda) */}
      {actionText && onAction && (
        <div className="md:hidden">
          <Button
            onClick={() => onAction(mission)}
            variant={type === 'QUIZ' ? 'secondary' : type === 'FEEDBACK_FORM' ? 'accent' : 'primary'}
            size="md"
            isLoading={isLoading}
            icon={type === 'PROOF_UPLOAD' ? <UploadCloud size={14} /> : <Play size={14} />}
            fullWidth
          >
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
};
