import React, { useRef, useEffect, useState } from 'react';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  id: string;
  label?: string;
  options: Option<T>[];
  value: T | '';
  onChange: (value: T) => void;
  error?: string;
  className?: string;
}

export default function SegmentedControl<T extends string>({
  id,
  label,
  options,
  value,
  onChange,
  error,
  className = '',
}: SegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderStyle, setSliderStyle] = useState<{ left: number; width: number; height: number } | null>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const idx = options.findIndex(o => o.value === value);
    if (idx === -1 || !containerRef.current) {
      setSliderStyle(null);
      return;
    }
    const btn = optionRefs.current[idx];
    if (!btn) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    setSliderStyle({
      left: btnRect.left - containerRect.left - 3, // offset by padding
      width: btnRect.width,
      height: btnRect.height,
    });
  }, [value, options]);

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = (idx + 1) % options.length;
      onChange(options[next].value);
      optionRefs.current[next]?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = (idx - 1 + options.length) % options.length;
      onChange(options[prev].value);
      optionRefs.current[prev]?.focus();
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label
          className="text-sm font-medium text-muted-foreground font-mono-label uppercase tracking-wider"
          id={`${id}-label`}
        >
          {label}
        </label>
      )}

      <div
        ref={containerRef}
        role="group"
        aria-labelledby={label ? `${id}-label` : undefined}
        className="seg-control-wrapper w-full"
        style={{ padding: '3px' }}
      >
        {/* Sliding indicator */}
        {sliderStyle && (
          <div
            className="seg-slider"
            style={{
              left: sliderStyle.left + 3,
              width: sliderStyle.width,
              height: sliderStyle.height,
              top: 3,
            }}
            aria-hidden="true"
          />
        )}

        {options.map((option, idx) => {
          const isActive = option.value === value;
          return (
            <button
              key={option.value}
              ref={el => { optionRefs.current[idx] = el; }}
              type="button"
              role="radio"
              aria-checked={isActive}
              id={`${id}-${option.value}`}
              className={`seg-control-option flex-1 ${isActive ? 'seg-active' : ''}`}
              onClick={() => onChange(option.value)}
              onKeyDown={e => handleKeyDown(e, idx)}
              tabIndex={isActive ? 0 : (value === '' && idx === 0 ? 0 : -1)}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="text-xs text-danger flex items-center gap-1.5" role="alert">
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
