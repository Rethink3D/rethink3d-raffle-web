import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'default';
  glow?: boolean;
  title?: string;
  subtitle?: string;
  headerExtra?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  glow = false,
  title,
  subtitle,
  headerExtra,
  footer,
  className = '',
  ...props
}) => {
  // Border colors matching the variant
  const borderColors = {
    default: 'border-brand-border',
    primary: 'border-brand-primary/60',
    secondary: 'border-brand-secondary/60',
    accent: 'border-brand-accent/60',
    danger: 'border-brand-danger/60',
  };

  const glowEffects = {
    default: '',
    primary: 'glow-primary',
    secondary: 'glow-secondary',
    accent: 'glow-accent',
    danger: 'shadow-[0_0_15px_rgba(239,68,68,0.2)]',
  };

  const cornerTextColors = {
    default: 'border-brand-muted',
    primary: 'border-brand-primary',
    secondary: 'border-brand-secondary',
    accent: 'border-brand-accent',
    danger: 'border-brand-danger',
  };

  return (
    <div
      className={`
        relative bg-brand-surface/85 border ${borderColors[variant]} 
        rounded-lg p-5 transition-all duration-300
        ${glow ? glowEffects[variant] : ''}
        ${className}
      `}
      {...props}
    >
      {/* Decorative scanline overlay */}
      <div className="absolute inset-0 pointer-events-none bg-cyber-grid opacity-10" />

      {/* Cyberpunk HUD Corner Brackets */}
      <div className={`absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 ${cornerTextColors[variant]}`} />
      <div className={`absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 ${cornerTextColors[variant]}`} />
      <div className={`absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 ${cornerTextColors[variant]}`} />
      <div className={`absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 ${cornerTextColors[variant]}`} />

      {/* Card Header */}
      {(title || subtitle || headerExtra) && (
        <div className="border-b border-brand-border/40 pb-3 mb-4 flex justify-between items-start gap-4">
          <div className="min-w-0">
            {title && (
              <h3 className="text-base font-display font-bold tracking-widest text-white uppercase break-words">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs font-ui font-semibold text-brand-muted tracking-wider mt-0.5 uppercase break-words">
                {subtitle}
              </p>
            )}
          </div>
          {headerExtra && <div className="flex-shrink-0 z-10">{headerExtra}</div>}
        </div>
      )}

      {/* Card Body */}
      <div className="relative z-10 text-sm font-body text-brand-text/90">
        {children}
      </div>

      {/* Card Footer */}
      {footer && (
        <div className="border-t border-brand-border/40 pt-3 mt-4 flex justify-between items-center text-xs">
          {footer}
        </div>
      )}
    </div>
  );
};
