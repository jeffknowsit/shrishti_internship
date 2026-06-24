import { useState } from 'react';
import SegmentedControl from './SegmentedControl';
import CurrencyInput from './CurrencyInput';
import type { FormState } from '../types';

interface StepLoanDetailsProps {
  values: FormState;
  onChange: (field: keyof FormState, value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

interface Errors {
  loanAmount?: string;
  loanAmountTerm?: string;
  creditHistory?: string;
  propertyArea?: string;
}

const TERM_PRESETS = [120, 180, 240, 300, 360];

export default function StepLoanDetails({ values, onChange, onNext, onBack }: StepLoanDetailsProps) {
  const [errors, setErrors] = useState<Errors>({});

  const validate = (): boolean => {
    const newErrors: Errors = {};
    const amount = parseFloat(values.loanAmount);
    if (!values.loanAmount || isNaN(amount) || amount <= 0) {
      newErrors.loanAmount = 'Please enter a valid loan amount greater than 0';
    }
    const term = parseFloat(values.loanAmountTerm);
    if (!values.loanAmountTerm || isNaN(term) || term <= 0) {
      newErrors.loanAmountTerm = 'Please enter the loan term in months';
    }
    if (values.creditHistory === '') {
      newErrors.creditHistory = 'Please select your credit history';
    }
    if (!values.propertyArea) {
      newErrors.propertyArea = 'Please select your property area';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  return (
    <div className="step-enter-right flex flex-col gap-8">
      <div aria-live="polite" className="sr-only">
        {Object.values(errors).filter(Boolean).join('. ')}
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="font-display text-2xl font-semibold text-foreground tracking-tight">
          Loan Details
        </h2>
        <p className="text-muted-foreground text-sm">
          Specify the loan parameters and your financial background.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <CurrencyInput
          id="loan-amount"
          label="Loan Amount"
          value={values.loanAmount}
          onChange={v => { onChange('loanAmount', v); setErrors(e => ({ ...e, loanAmount: undefined })); }}
          placeholder="150"
          prefix="₹"
          suffix="K"
          error={errors.loanAmount}
          hint="Amount in thousands (e.g. 150 = ₹1,50,000)"
          required
        />

        {/* Term with preset chips */}
        <div className="flex flex-col gap-2">
          <CurrencyInput
            id="loan-term"
            label="Loan Amount Term"
            value={values.loanAmountTerm}
            onChange={v => { onChange('loanAmountTerm', v); setErrors(e => ({ ...e, loanAmountTerm: undefined })); }}
            placeholder="360"
            prefix=""
            suffix="mo"
            error={errors.loanAmountTerm}
            required
          />

          {/* Quick-select chips */}
          <div className="flex flex-wrap gap-2 pt-1" role="group" aria-label="Quick-select loan term presets">
            {TERM_PRESETS.map(t => {
              const isActive = values.loanAmountTerm === String(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => { onChange('loanAmountTerm', String(t)); setErrors(e => ({ ...e, loanAmountTerm: undefined })); }}
                  aria-pressed={isActive}
                  className={`
                    h-8 px-4 rounded-full text-xs font-medium font-mono-label uppercase tracking-wide
                    transition-all duration-200 border
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background
                    ${isActive
                      ? 'bg-accent text-accent-foreground border-accent shadow-glow-sm'
                      : 'bg-transparent border-[rgba(255,255,255,0.1)] text-muted-foreground hover:border-[rgba(255,255,255,0.2)] hover:text-foreground hover:bg-[rgba(255,255,255,0.04)]'
                    }
                  `}
                >
                  {t} mo
                </button>
              );
            })}
          </div>
        </div>

        <SegmentedControl
          id="credit-history"
          label="Credit History"
          value={values.creditHistory}
          onChange={v => { onChange('creditHistory', v); setErrors(e => ({ ...e, creditHistory: undefined })); }}
          error={errors.creditHistory}
          options={[
            { value: '1', label: '✓ Good Standing' },
            { value: '0', label: '✗ Issues / None' },
          ]}
        />

        <SegmentedControl
          id="property-area"
          label="Property Area"
          value={values.propertyArea}
          onChange={v => { onChange('propertyArea', v); setErrors(e => ({ ...e, propertyArea: undefined })); }}
          error={errors.propertyArea}
          options={[
            { value: 'Urban', label: 'Urban' },
            { value: 'Semiurban', label: 'Semi-urban' },
            { value: 'Rural', label: 'Rural' },
          ]}
        />
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="
            inline-flex items-center gap-2 h-11 px-5 rounded-lg
            text-muted-foreground text-sm font-medium
            hover:text-foreground hover:bg-[rgba(255,255,255,0.05)]
            transition-all duration-200
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background
          "
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M13 8H3M7 12l-4-4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="
            inline-flex items-center gap-2 h-11 px-7 rounded-lg
            bg-accent text-accent-foreground font-semibold text-sm
            transition-all duration-200 ease-out
            hover:shadow-[0_0_30px_rgba(245,158,11,0.35)] hover:brightness-110
            active:scale-[0.98]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background
          "
        >
          Review
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
