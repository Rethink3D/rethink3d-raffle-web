import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'default';
  glow?: boolean;
  title?: string;
  subtitle?: string;
  headerExtra?: React.ReactNode;
  footer?: React.ReactNode;
  clipCorner?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  glow = false,
  title,
  subtitle,
  headerExtra,
  footer,
  clipCorner = true,
  className = '',
  ...props
}) => {
  // Border colors matching the variant
  const borderColors = {
    default: 'border-cyber-border',
    primary: 'border-cyber-primary/60',
    secondary: 'border-cyber-secondary/60',
    accent: 'border-cyber-accent/60',
    danger: 'border-cyber-danger/60',
  };

  const glowEffects = {
    default: '',
    primary: 'glow-primary',
    secondary: 'glow-secondary',
    accent: 'glow-accent',
    danger: 'shadow-[0_0_15px_rgba(239,68,68,0.2)]',
  };

  const cornerTextColors = {
    default: 'border-cyber-muted',
    primary: 'border-cyber-primary',
    secondary: 'border-cyber-secondary',
    accent: 'border-cyber-accent',
    danger: 'border-cyber-danger',
  };

  return (
    <div
      className={`
        relative bg-cyber-surface/85 border ${borderColors[variant]} 
        rounded-lg p-5 transition-all duration-300
        ${glow ? glowEffects[variant] : ''}
        ${clipCorner ? 'clip-cyber-card' : ''}
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
        <div className="border-b border-cyber-border/40 pb-3 mb-4 flex justify-between items-start gap-4">
          <div>
            {title && (
              <h3 className="text-base font-orbitron font-bold tracking-widest text-white uppercase">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs font-rajdhani font-semibold text-cyber-muted tracking-wider mt-0.5 uppercase">
                // {subtitle}
              </p>
            )}
          </div>
          {headerExtra && <div className="flex-shrink-0 z-10">{headerExtra}</div>}
        </div>
      )}

      {/* Card Body */}
      <div className="relative z-10 text-sm font-inter text-cyber-text/90">
        {children}
      </div>

      {/* Card Footer */}
      {footer && (
        <div className="border-t border-cyber-border/40 pt-3 mt-4 flex justify-between items-center text-xs">
          {footer}
        </div>
      )}
    </div>
  );
};
