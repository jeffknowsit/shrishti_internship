import { useState } from 'react';
import SegmentedControl from './SegmentedControl';
import CurrencyInput from './CurrencyInput';
import type { FormState } from '../types';

interface StepEmploymentProps {
  values: FormState;
  onChange: (field: keyof FormState, value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

interface Errors {
  selfEmployed?: string;
  applicantIncome?: string;
}

export default function StepEmployment({ values, onChange, onNext, onBack }: StepEmploymentProps) {
  const [errors, setErrors] = useState<Errors>({});

  const validate = (): boolean => {
    const newErrors: Errors = {};
    if (!values.selfEmployed) newErrors.selfEmployed = 'Please indicate employment type';
    const income = parseFloat(values.applicantIncome);
    if (!values.applicantIncome || isNaN(income) || income <= 0) {
      newErrors.applicantIncome = 'Please enter a valid monthly income greater than 0';
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
          Employment & Income
        </h2>
        <p className="text-muted-foreground text-sm">
          Your income details help determine loan eligibility and amount.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <SegmentedControl
          id="self-employed"
          label="Employment Type"
          value={values.selfEmployed}
          onChange={v => { onChange('selfEmployed', v); setErrors(e => ({ ...e, selfEmployed: undefined })); }}
          error={errors.selfEmployed}
          options={[
            { value: 'No', label: 'Salaried' },
            { value: 'Yes', label: 'Self-Employed' },
          ]}
        />

        <CurrencyInput
          id="applicant-income"
          label="Applicant Monthly Income"
          value={values.applicantIncome}
          onChange={v => { onChange('applicantIncome', v); setErrors(e => ({ ...e, applicantIncome: undefined })); }}
          placeholder="5000"
          prefix="₹"
          suffix="/ mo"
          error={errors.applicantIncome}
          hint="Your gross monthly income before taxes"
          required
        />

        <CurrencyInput
          id="coapplicant-income"
          label="Co-applicant Monthly Income"
          value={values.coapplicantIncome}
          onChange={v => onChange('coapplicantIncome', v)}
          placeholder="0"
          prefix="₹"
          suffix="/ mo"
          hint="Leave as 0 if there is no co-applicant"
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
          Continue
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
