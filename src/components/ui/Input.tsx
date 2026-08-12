import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  statusIndicator?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, statusIndicator, icon, className = '', ...props }, ref) => {
    const status = statusIndicator;

    return (
      <div className="w-full flex flex-col gap-1.5 font-body">
        {/* Label & Status Row */}
        {(label || status) && (
          <div className="flex justify-between items-baseline px-1 select-none">
            {label && (
              <label className="text-xs font-ui font-bold tracking-wider text-brand-text uppercase">
                {label}
              </label>
            )}
            {status && (
              <span className={`text-[10px] font-mono tracking-widest ${error ? 'text-brand-danger' : 'text-brand-secondary'}`}>
                {status}
              </span>
            )}
          </div>
        )}

        {/* Input Wrapper with Accents */}
        <div className="relative w-full">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            className={`
              w-full bg-brand-bg border ${error ? 'border-brand-danger focus:border-brand-danger focus:ring-1 focus:ring-brand-danger' : 'border-brand-border focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary'} 
              rounded px-4 py-2.5 text-sm font-ui font-semibold text-brand-strong tracking-wide placeholder-brand-muted transition-all duration-200
              ${icon ? 'pl-10' : ''}
              ${className}
            `}
            {...props}
          />

          {/* Cyberpunk corner visual details */}
          <div className={`absolute top-0 right-0 w-1.5 h-1.5 border-t border-r ${error ? 'border-brand-danger' : 'border-brand-secondary/50'} pointer-events-none`} />
          <div className={`absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l ${error ? 'border-brand-danger' : 'border-brand-secondary/50'} pointer-events-none`} />
        </div>

        {/* Error message */}
        {error && (
          <p className="text-xs font-ui font-semibold text-brand-danger tracking-wider mt-0.5 uppercase px-1">
            ⚠ {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
