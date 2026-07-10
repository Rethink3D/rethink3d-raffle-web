import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  // Styles for different variants
  const baseStyles = 'relative inline-flex items-center justify-center font-orbitron uppercase tracking-wider font-bold transition-all duration-200 border focus:outline-none clip-cyber-btn overflow-hidden select-none';
  
  const variantStyles = {
    primary: 'bg-cyber-primary/10 border-cyber-primary text-white hover:bg-cyber-primary hover:text-white hover:glow-primary focus:glow-primary',
    secondary: 'bg-cyber-secondary/10 border-cyber-secondary text-cyber-secondary hover:bg-cyber-secondary hover:text-black hover:glow-secondary focus:glow-secondary',
    accent: 'bg-cyber-accent/10 border-cyber-accent text-cyber-accent hover:bg-cyber-accent hover:text-black hover:glow-accent focus:glow-accent',
    danger: 'bg-cyber-danger/10 border-cyber-danger text-cyber-danger hover:bg-cyber-danger hover:text-white focus:shadow-[0_0_15px_rgba(239,68,68,0.4)]',
  };

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 border-t-2 border-b-2',
    md: 'text-sm px-5 py-2.5 border-t-2 border-b-2',
    lg: 'text-base px-8 py-3.5 border-t-2 border-b-2',
  };

  const widthStyle = fullWidth ? 'w-full flex' : '';
  
  // Custom disabled style with diagonal stripe styling / scanline overlay
  const disabledStyle = (disabled || isLoading)
    ? 'opacity-50 cursor-not-allowed pointer-events-none'
    : 'cursor-pointer active:scale-95';

  return (
    <button
      disabled={disabled || isLoading}
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${widthStyle}
        ${disabledStyle}
        ${className}
      `}
      {...props}
    >
      {/* Scanline pattern for disabled state */}
      {(disabled || isLoading) && (
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, #1e1e3a, #1e1e3a 5px, transparent 5px, transparent 10px)'
          }}
        />
      )}

      {/* Cyberpunk corner accents for non-disabled state */}
      {!disabled && !isLoading && (
        <>
          <span className="absolute top-0 left-0 w-1 h-1 bg-white opacity-40"></span>
          <span className="absolute bottom-0 right-0 w-1 h-1 bg-white opacity-40"></span>
        </>
      )}

      {/* Loading Spinner */}
      {isLoading && (
        <svg 
          className="animate-spin -ml-1 mr-3 h-4 w-4 text-current" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}

      {/* Button Content */}
      {!isLoading && icon && <span className="mr-2 inline-flex">{icon}</span>}
      <span className="relative z-10">{children}</span>
    </button>
  );
};
