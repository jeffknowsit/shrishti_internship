import { useReducer, useState } from 'react';
import WizardShell from './components/WizardShell';
import StepPersonal from './components/StepPersonal';
import StepEmployment from './components/StepEmployment';
import StepLoanDetails from './components/StepLoanDetails';
import StepReview from './components/StepReview';
import ResultScreen from './components/ResultScreen';
import type {
  FormState,
  FormAction,
  PredictionResult,
  WizardStep,
} from './types';
import { INITIAL_FORM_STATE } from './types';

// ── Reducer ──────────────────────────────────────────────────────────────────
function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'RESET':
      return INITIAL_FORM_STATE;
    default:
      return state;
  }
}

// ── API call ─────────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:8000';

async function submitPrediction(form: FormState): Promise<PredictionResult> {
  const body = {
    gender: form.gender,
    married: form.married,
    dependents: form.dependents,
    education: form.education,
    self_employed: form.selfEmployed,
    applicant_income: parseFloat(form.applicantIncome),
    coapplicant_income: parseFloat(form.coapplicantIncome || '0'),
    loan_amount: parseFloat(form.loanAmount),
    loan_amount_term: parseFloat(form.loanAmountTerm),
    credit_history: parseInt(form.creditHistory as string, 10) as 0 | 1,
    property_area: form.propertyArea,
  };

  const res = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err?.detail?.message ?? err?.error ?? `HTTP ${res.status}`);
  }

  return res.json();
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [form, dispatch] = useReducer(formReducer, INITIAL_FORM_STATE);
  const [step, setStep] = useState<WizardStep>(1);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const setField = (field: keyof FormState, value: string) => {
    dispatch({ type: 'SET_FIELD', field, value });
  };

  const goNext = () => {
    setDirection('forward');
    setStep(s => Math.min(s + 1, 4) as WizardStep);
  };

  const goBack = () => {
    setDirection('back');
    setStep(s => Math.max(s - 1, 1) as WizardStep);
  };

  const goToStep = (target: number) => {
    setDirection('back');
    setStep(target as WizardStep);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await submitPrediction(form);
      setResult(res);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    dispatch({ type: 'RESET' });
    setResult(null);
    setApiError(null);
    setStep(1);
    setDirection('forward');
  };

  return (
    <>
      {/* Single ambient orb — fixed, decorative */}
      <div className="ambient-orb" aria-hidden="true" />

      <div className="min-h-screen flex flex-col items-center">
        {/* Top branding bar */}
        <header className="w-full border-b border-[rgba(255,255,255,0.05)] bg-[rgba(10,10,15,0.8)] backdrop-blur-md sticky top-0 z-20">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M2 6h8M6 2l4 4-4 4" stroke="#0A0A0F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-display text-sm font-semibold text-foreground tracking-tight">
              LoanAssess
            </span>
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest ml-1 border border-[rgba(255,255,255,0.1)] rounded px-1.5 py-0.5">
              AI
            </span>
          </div>
        </header>

        <WizardShell
          currentStep={step}
          totalSteps={4}
          showIndicator={!result}
          direction={direction}
        >
          {result ? (
            <ResultScreen result={result} onReset={handleReset} />
          ) : (
            <>
              {step === 1 && (
                <StepPersonal values={form} onChange={setField} onNext={goNext} />
              )}
              {step === 2 && (
                <StepEmployment values={form} onChange={setField} onNext={goNext} onBack={goBack} />
              )}
              {step === 3 && (
                <StepLoanDetails values={form} onChange={setField} onNext={goNext} onBack={goBack} />
              )}
              {step === 4 && (
                <StepReview
                  values={form}
                  onSubmit={handleSubmit}
                  onBack={goBack}
                  onEdit={goToStep}
                  loading={loading}
                  error={apiError}
                />
              )}
            </>
          )}
        </WizardShell>
      </div>
    </>
  );
}
