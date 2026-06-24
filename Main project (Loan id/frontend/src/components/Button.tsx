import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base = `
    inline-flex items-center justify-center font-medium rounded-lg
    transition-all duration-200 ease-out
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background
    disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
    active:scale-[0.98] select-none
  `;

  const sizes = {
    sm: 'h-9 px-4 text-sm',
    md: 'h-11 px-6 text-sm',
    lg: 'h-12 px-8 text-base',
  };

  const variants = {
    primary: `
      bg-accent text-accent-foreground font-semibold
      hover:shadow-glow-md hover:brightness-110
      hover:shadow-[0_0_30px_rgba(245,158,11,0.35)]
    `,
    secondary: `
      bg-transparent text-foreground
      border border-[rgba(255,255,255,0.15)]
      hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.25)]
    `,
    ghost: `
      bg-transparent text-muted-foreground
      hover:bg-[rgba(255,255,255,0.05)] hover:text-foreground
    `,
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          {children}
        </span>
      ) : children}
    </button>
  );
}
