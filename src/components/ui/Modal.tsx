import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Prevent background scrolling when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop — CSS transition via opacity */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Modal Container — entrada via CSS animation */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`
          relative w-full ${sizeClasses[size]}
          bg-cyber-surface/95 border border-cyber-border rounded-lg
          shadow-2xl overflow-hidden z-10 flex flex-col clip-cyber-card
          animate-modal-in
        `}
      >
        {/* HUD Cyber Grid Background */}
        <div className="absolute inset-0 pointer-events-none bg-cyber-grid opacity-10" />

        {/* Corner Bracket Details */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyber-secondary" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyber-secondary" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyber-secondary" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyber-secondary" />

        {/* Header */}
        <div className="relative border-b border-cyber-border p-4 flex items-center justify-between bg-black/20">
          <div className="flex flex-col">
            <h2 id="modal-title" className="text-lg font-orbitron font-extrabold tracking-widest text-white uppercase">
              {title}
            </h2>
            <div className="text-[9px] font-mono text-cyber-secondary tracking-widest mt-0.5">
              SISTEMA_MODAL_ATIVO // ONLINE
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="Fechar modal"
            className="p-1.5 rounded border border-cyber-border/80 hover:border-cyber-danger text-cyber-muted hover:text-cyber-danger hover:bg-cyber-danger/10 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="relative p-6 overflow-y-auto max-h-[75vh] font-inter text-cyber-text/90">
          {children}
        </div>
      </div>
    </div>
  );
};
