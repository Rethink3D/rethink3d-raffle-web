import React from 'react';
import { CheckCircle2, AlertTriangle, Clock, Play, UploadCloud, HelpCircle, FileText } from 'lucide-react';
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
  const { title, description, reward, type, isCompleted, proofStatus } = mission;

  // Type Badges styling and icons
  const getTypeBadge = (type: MissionType) => {
    switch (type) {
      case 'PROOF_UPLOAD':
        return {
          label: 'PROOF UPLOAD',
          classes: 'text-cyber-primary border-cyber-primary/40 bg-cyber-primary/5',
          icon: <UploadCloud size={12} />,
        };
      case 'QUIZ':
        return {
          label: 'QUIZ CHALLENGE',
          classes: 'text-cyber-secondary border-cyber-secondary/40 bg-cyber-secondary/5',
          icon: <HelpCircle size={12} />,
        };
      case 'FEEDBACK_FORM':
        return {
          label: 'FEEDBACK FORM',
          classes: 'text-cyber-accent border-cyber-accent/40 bg-cyber-accent/5',
          icon: <FileText size={12} />,
        };
      case 'AUTOMATIC':
      default:
        return {
          label: 'AUTO SYSTEM',
          classes: 'text-cyber-success border-cyber-success/40 bg-cyber-success/5',
          icon: <CheckCircle2 size={12} />,
        };
    }
  };

  const badgeInfo = getTypeBadge(type);

  // Completion statuses
  const renderStatus = () => {
    if (isCompleted) {
      return (
        <div className="flex items-center gap-1.5 text-cyber-success font-mono text-xs font-bold bg-cyber-success/10 border border-cyber-success/40 px-2.5 py-1 rounded">
          <CheckCircle2 size={13} className="text-cyber-success animate-pulse" />
          <span>[MISSION_ACCOMPLISHED]</span>
        </div>
      );
    }

    if (type === 'PROOF_UPLOAD') {
      if (proofStatus === 'PENDING') {
        return (
          <div className="flex items-center gap-1.5 text-cyber-accent font-mono text-xs font-bold bg-cyber-accent/10 border border-cyber-accent/40 px-2.5 py-1 rounded">
            <Clock size={13} className="animate-spin text-cyber-accent" />
            <span>[SYS_PENDING_APPROVAL]</span>
          </div>
        );
      }
      if (proofStatus === 'REJECTED') {
        return (
          <div className="flex items-center gap-1.5 text-cyber-danger font-mono text-xs font-bold bg-cyber-danger/10 border border-cyber-danger/40 px-2.5 py-1 rounded">
            <AlertTriangle size={13} className="text-cyber-danger" />
            <span>[PROOF_DENIED_REUPLOAD]</span>
          </div>
        );
      }
    }

    return (
      <div className="flex items-center gap-1.5 text-cyber-muted font-mono text-xs bg-cyber-border/30 border border-cyber-border/80 px-2.5 py-1 rounded">
        <Clock size={13} />
        <span>[MISSION_ACTIVE]</span>
      </div>
    );
  };

  // Button text & action
  const getActionText = () => {
    if (isCompleted) return null;
    
    if (type === 'QUIZ') {
      return 'Start Quiz';
    }
    if (type === 'FEEDBACK_FORM') {
      return 'Fill Feedback';
    }
    if (type === 'PROOF_UPLOAD') {
      if (proofStatus === 'REJECTED') {
        return 'Reupload Proof';
      }
      if (proofStatus === 'PENDING') {
        return null;
      }
      return 'Upload Proof';
    }
    return null;
  };

  const actionText = getActionText();

  return (
    <div 
      className={`
        relative bg-cyber-surface/90 border rounded-lg p-5 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-5 clip-cyber-card
        ${isCompleted 
          ? 'border-cyber-success/30 bg-gradient-to-r from-cyber-success/5 to-transparent' 
          : proofStatus === 'PENDING'
          ? 'border-cyber-accent/30'
          : proofStatus === 'REJECTED'
          ? 'border-cyber-danger/30'
          : 'border-cyber-border hover:border-cyber-secondary/50'}
      `}
    >
      {/* Decorative vertical accent bar */}
      <div 
        className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg
          ${isCompleted 
            ? 'bg-cyber-success' 
            : proofStatus === 'PENDING'
            ? 'bg-cyber-accent'
            : proofStatus === 'REJECTED'
            ? 'bg-cyber-danger'
            : 'bg-cyber-secondary'}
        `}
      />

      {/* Quest Info */}
      <div className="flex-1 flex flex-col gap-2">
        {/* Top Badges Row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Quest Type Badge */}
          <span className={`inline-flex items-center gap-1.5 border px-2 py-0.5 rounded text-[10px] font-mono tracking-wider font-extrabold uppercase ${badgeInfo.classes}`}>
            {badgeInfo.icon}
            {badgeInfo.label}
          </span>

          {/* Reward Tickets Badge */}
          <span className="inline-flex items-center gap-1 text-cyber-accent font-orbitron font-black text-[11px] tracking-wide bg-cyber-accent/5 border border-cyber-accent/30 px-2 py-0.5 rounded">
            +{reward} TKTS
          </span>
        </div>

        {/* Quest Title & Desc */}
        <div>
          <h4 className="text-base font-orbitron font-bold text-white uppercase tracking-wide">
            {title}
          </h4>
          <p className="text-xs text-cyber-muted mt-1 font-inter leading-relaxed max-w-2xl">
            {description}
          </p>
        </div>

        {/* Monospace status tracker */}
        <div className="mt-1 flex items-center gap-3">
          {renderStatus()}
        </div>
      </div>

      {/* Action Button */}
      {actionText && onAction && (
        <div className="flex-shrink-0 flex items-center">
          <Button
            onClick={() => onAction(mission)}
            variant={type === 'QUIZ' ? 'secondary' : type === 'FEEDBACK_FORM' ? 'accent' : 'primary'}
            size="md"
            isLoading={isLoading}
            icon={type === 'PROOF_UPLOAD' ? <UploadCloud size={14} /> : <Play size={14} />}
            className="w-full md:w-auto"
          >
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
};
