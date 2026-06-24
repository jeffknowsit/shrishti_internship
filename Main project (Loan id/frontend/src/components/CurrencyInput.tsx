import React, { useId } from 'react';

interface CurrencyInputProps {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  min?: number;
  className?: string;
}

export default function CurrencyInput({
  id,
  label,
  value,
  onChange,
  placeholder = '0',
  prefix = '₹',
  suffix,
  error,
  hint,
  required = false,
  min,
  className = '',
}: CurrencyInputProps) {
  const uid = useId();
  const inputId = id ?? uid;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only digits and one decimal point
    const raw = e.target.value.replace(/[^\d.]/g, '');
    // Prevent multiple dots
    const parts = raw.split('.');
    const cleaned = parts.length > 2 ? `${parts[0]}.${parts[1]}` : raw;
    onChange(cleaned);
  };

  const ariaDescribedBy = [error ? errorId : '', hint ? hintId : ''].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-muted-foreground font-mono-label uppercase tracking-wider"
      >
        {label}{required && <span className="text-accent ml-1" aria-hidden="true">*</span>}
      </label>

      <div className="relative">
        {prefix && (
          <span
            className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-muted-foreground text-sm pointer-events-none select-none"
            aria-hidden="true"
          >
            {prefix}
          </span>
        )}

        <input
          id={inputId}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={ariaDescribedBy}
          className={`input-base font-mono ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-16' : ''} ${error ? 'input-error' : ''}`}
          style={{ fontFamily: '"JetBrains Mono", monospace' }}
        />

        {suffix && (
          <span
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none select-none uppercase tracking-wide"
            aria-hidden="true"
          >
            {suffix}
          </span>
        )}
      </div>

      {hint && !error && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} className="text-xs text-danger flex items-center gap-1.5" role="alert">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <circle cx="6" cy="6" r="5.5" stroke="currentColor"/>
            <path d="M6 3.5V6.5M6 8h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
