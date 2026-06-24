import { useState } from 'react';
import SegmentedControl from './SegmentedControl';
import type { FormState } from '../types';

interface StepPersonalProps {
  values: FormState;
  onChange: (field: keyof FormState, value: string) => void;
  onNext: () => void;
}

interface Errors {
  gender?: string;
  married?: string;
  dependents?: string;
  education?: string;
}

export default function StepPersonal({ values, onChange, onNext }: StepPersonalProps) {
  const [errors, setErrors] = useState<Errors>({});

  const validate = (): boolean => {
    const newErrors: Errors = {};
    if (!values.gender) newErrors.gender = 'Please select your gender';
    if (!values.married) newErrors.married = 'Please select your marital status';
    if (!values.dependents) newErrors.dependents = 'Please select number of dependents';
    if (!values.education) newErrors.education = 'Please select your education level';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  return (
    <div className="step-enter-right flex flex-col gap-8">
      {/* Error announcer for screen readers */}
      <div aria-live="polite" className="sr-only">
        {Object.values(errors).filter(Boolean).join('. ')}
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="font-display text-2xl font-semibold text-foreground tracking-tight">
          Personal Information
        </h2>
        <p className="text-muted-foreground text-sm">
          Tell us about yourself so we can assess your application.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <SegmentedControl
          id="gender"
          label="Gender"
          value={values.gender}
          onChange={v => { onChange('gender', v); setErrors(e => ({ ...e, gender: undefined })); }}
          error={errors.gender}
          options={[
            { value: 'Male', label: 'Male' },
            { value: 'Female', label: 'Female' },
          ]}
        />

        <SegmentedControl
          id="married"
          label="Marital Status"
          value={values.married}
          onChange={v => { onChange('married', v); setErrors(e => ({ ...e, married: undefined })); }}
          error={errors.married}
          options={[
            { value: 'Yes', label: 'Married' },
            { value: 'No', label: 'Single' },
          ]}
        />

        <SegmentedControl
          id="dependents"
          label="Dependents"
          value={values.dependents}
          onChange={v => { onChange('dependents', v); setErrors(e => ({ ...e, dependents: undefined })); }}
          error={errors.dependents}
          options={[
            { value: '0', label: 'None' },
            { value: '1', label: '1' },
            { value: '2', label: '2' },
            { value: '3+', label: '3+' },
          ]}
        />

        <SegmentedControl
          id="education"
          label="Education"
          value={values.education}
          onChange={v => { onChange('education', v); setErrors(e => ({ ...e, education: undefined })); }}
          error={errors.education}
          options={[
            { value: 'Graduate', label: 'Graduate' },
            { value: 'Not Graduate', label: 'Not Graduate' },
          ]}
        />
      </div>

      <div className="flex justify-end pt-2">
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
