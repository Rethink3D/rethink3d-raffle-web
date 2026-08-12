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
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-24 sm:pt-28 pb-8 overflow-y-auto">
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
          bg-brand-surface/95 border border-brand-border rounded-lg
          shadow-2xl overflow-hidden z-10 flex flex-col
          animate-modal-in
        `}
      >
        {/* HUD Cyber Grid Background */}
        <div className="absolute inset-0 pointer-events-none bg-cyber-grid opacity-10" />

        {/* Corner Bracket Details */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-brand-secondary" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-brand-secondary" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-brand-secondary" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-brand-secondary" />

        {/* Header */}
        <div className="relative border-b border-brand-border p-4 flex items-center justify-between bg-sunken-20">
          <div className="flex flex-col">
            <h2 id="modal-title" className="text-lg font-display font-extrabold tracking-widest text-brand-strong uppercase">
              {title}
            </h2>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="Fechar modal"
            className="p-1.5 rounded border border-brand-border/80 hover:border-brand-danger text-brand-muted hover:text-brand-danger hover:bg-brand-danger/10 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="relative p-6 overflow-y-auto max-h-[75vh] font-body text-brand-text/90">
          {children}
        </div>
      </div>
    </div>
  );
};
