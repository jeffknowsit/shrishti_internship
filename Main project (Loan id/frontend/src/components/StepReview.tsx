import type { FormState } from '../types';
import Button from './Button';

interface StepReviewProps {
  values: FormState;
  onSubmit: () => void;
  onBack: () => void;
  onEdit: (step: number) => void;
  loading: boolean;
  error?: string | null;
}

interface ReviewItem {
  label: string;
  value: string;
}

function ReviewGroup({
  title,
  items,
  step,
  onEdit,
}: {
  title: string;
  items: ReviewItem[];
  step: number;
  onEdit: (step: number) => void;
}) {
  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-widest">
          {title}
        </h3>
        <button
          type="button"
          onClick={() => onEdit(step)}
          className="
            text-xs text-accent font-medium font-mono-label uppercase tracking-wide
            hover:underline
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background
            rounded-sm
          "
          aria-label={`Edit ${title}`}
        >
          Edit
        </button>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
        {items.map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground font-mono-label uppercase tracking-wide">
              {label}
            </dt>
            <dd className="text-sm text-foreground font-medium">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function StepReview({ values, onSubmit, onBack, onEdit, loading, error }: StepReviewProps) {
  const creditLabel = values.creditHistory === '1' ? 'Good Standing' : values.creditHistory === '0' ? 'Issues / None' : '—';
  const selfEmpLabel = values.selfEmployed === 'Yes' ? 'Self-Employed' : values.selfEmployed === 'No' ? 'Salaried' : '—';

  const formatCurrency = (val: string) => val ? `₹${parseFloat(val).toLocaleString('en-IN')}` : '—';

  const personalItems: ReviewItem[] = [
    { label: 'Gender', value: values.gender || '—' },
    { label: 'Married', value: values.married === 'Yes' ? 'Yes' : values.married === 'No' ? 'No' : '—' },
    { label: 'Dependents', value: values.dependents || '—' },
    { label: 'Education', value: values.education || '—' },
  ];

  const employmentItems: ReviewItem[] = [
    { label: 'Employment', value: selfEmpLabel },
    { label: 'Applicant Income', value: `${formatCurrency(values.applicantIncome)}/mo` },
    { label: 'Co-applicant Income', value: `${formatCurrency(values.coapplicantIncome || '0')}/mo` },
  ];

  const loanItems: ReviewItem[] = [
    { label: 'Loan Amount', value: values.loanAmount ? `₹${parseFloat(values.loanAmount).toLocaleString('en-IN')}K` : '—' },
    { label: 'Term', value: values.loanAmountTerm ? `${values.loanAmountTerm} months` : '—' },
    { label: 'Credit History', value: creditLabel },
    { label: 'Property Area', value: values.propertyArea || '—' },
  ];

  return (
    <div className="step-enter-right flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-2xl font-semibold text-foreground tracking-tight">
          Review Your Application
        </h2>
        <p className="text-muted-foreground text-sm">
          Confirm your details below before submitting for assessment.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <ReviewGroup title="Personal" items={personalItems} step={1} onEdit={onEdit} />
        <ReviewGroup title="Employment" items={employmentItems} step={2} onEdit={onEdit} />
        <ReviewGroup title="Loan Details" items={loanItems} step={3} onEdit={onEdit} />
      </div>

      {error && (
        <div
          role="alert"
          className="p-4 rounded-lg border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.08)] text-sm text-danger flex items-start gap-3"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5" aria-hidden="true">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 5v3M8 10.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="
            inline-flex items-center gap-2 h-11 px-5 rounded-lg
            text-muted-foreground text-sm font-medium
            hover:text-foreground hover:bg-[rgba(255,255,255,0.05)]
            transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background
          "
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M13 8H3M7 12l-4-4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>

        <Button
          type="button"
          variant="primary"
          onClick={onSubmit}
          loading={loading}
          className="min-w-[160px]"
        >
          {loading ? 'Assessing...' : 'Submit Application'}
        </Button>
      </div>
    </div>
  );
}
