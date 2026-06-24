import { ReactNode } from 'react';
import StepIndicator from './StepIndicator';

interface WizardShellProps {
  currentStep: number;
  totalSteps: number;
  showIndicator: boolean;
  direction: 'forward' | 'back';
  children: ReactNode;
}

export default function WizardShell({
  currentStep,
  totalSteps,
  showIndicator,
  children,
}: WizardShellProps) {
  return (
    <div className="relative z-10 w-full max-w-2xl mx-auto px-4 py-16 md:py-24 flex flex-col gap-10">
      {/* Progress indicator — only during wizard steps */}
      {showIndicator && (
        <div className="fade-in" style={{ animation: 'fadeIn 300ms ease-out' }}>
          <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
        </div>
      )}

      {/* Main content card */}
      <main
        className="card p-8"
        aria-label={showIndicator ? `Step ${currentStep} of ${totalSteps}` : 'Results'}
      >
        {children}
      </main>

      {/* Footer */}
      <footer className="text-center">
        <p className="text-xs text-muted-foreground font-mono-label">
          Predictions are based on historical data and should not be used as the sole basis for financial decisions.
        </p>
      </footer>
    </div>
  );
}
