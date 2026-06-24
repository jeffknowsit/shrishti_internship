interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const STEP_LABELS = ['Personal', 'Employment', 'Loan Details', 'Review'];

export default function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <nav aria-label="Wizard progress" className="w-full">
      <ol className="flex items-center justify-between relative">
        {/* Connecting line */}
        <div
          className="absolute top-[18px] left-0 right-0 h-px bg-[rgba(255,255,255,0.08)] mx-8"
          aria-hidden="true"
        >
          {/* Progress fill */}
          <div
            className="h-full bg-accent transition-all duration-500 ease-out"
            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          />
        </div>

        {Array.from({ length: totalSteps }, (_, i) => {
          const step = i + 1;
          const isCompleted = step < currentStep;
          const isCurrent = step === currentStep;
          const isUpcoming = step > currentStep;

          return (
            <li
              key={step}
              className="relative flex flex-col items-center gap-2 z-10"
              aria-current={isCurrent ? 'step' : undefined}
            >
              {/* Node */}
              <div
                className={`
                  flex items-center justify-center rounded-full transition-all duration-300 ease-out
                  font-mono text-xs font-medium
                  ${isCompleted
                    ? 'w-9 h-9 bg-accent text-accent-foreground'
                    : isCurrent
                    ? 'w-10 h-10 bg-transparent border-2 border-accent text-accent'
                    : 'w-9 h-9 bg-transparent border border-[rgba(255,255,255,0.15)] text-muted-foreground'
                  }
                `}
                style={isCurrent ? { boxShadow: 'var(--glow-sm), 0 0 0 4px rgba(245,158,11,0.08)' } : undefined}
              >
                {isCompleted ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <span>{step}</span>
                )}
              </div>

              {/* Label */}
              <span
                className={`
                  text-[10px] font-mono-label uppercase tracking-widest whitespace-nowrap
                  transition-colors duration-300
                  ${isCurrent ? 'text-accent' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}
                `}
              >
                {STEP_LABELS[i]}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
