import type { PredictionResult } from '../types';
import { FEATURE_LABELS } from '../types';
import FeatureBar from './FeatureBar';
import Button from './Button';

interface ResultScreenProps {
  result: PredictionResult;
  onReset: () => void;
}

export default function ResultScreen({ result, onReset }: ResultScreenProps) {
  const { approved, probability_approved, probability_rejected, threshold_used, feature_contributions, bias_note } = result;

  const probApprovedPct = (probability_approved * 100).toFixed(1);
  const probRejectedPct = (probability_rejected * 100).toFixed(1);

  // Top 5 financial features by importance (demographic ones already excluded by backend)
  const sortedFeatures = Object.entries(feature_contributions)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  const maxImportance = sortedFeatures[0]?.[1] ?? 1;

  const approvedGlow = '0 0 0 1px rgba(52, 211, 153, 0.35), 0 0 50px rgba(52, 211, 153, 0.2), 0 0 100px rgba(52, 211, 153, 0.08)';
  const rejectedGlow = '0 0 0 1px rgba(248, 113, 113, 0.35), 0 0 50px rgba(248, 113, 113, 0.2), 0 0 100px rgba(248, 113, 113, 0.08)';

  const thresholdPct = Math.round(threshold_used * 100);

  return (
    <div className="flex flex-col gap-6" style={{ animation: 'fadeIn 300ms ease-out' }}>

      {/* ── Fairness Badge ── */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg border border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.06)]">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-accent shrink-0" aria-hidden="true">
          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M4.5 7l1.8 1.8L9.5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p className="text-xs text-muted-foreground leading-snug">
          <span className="text-accent font-medium">Strict financial evaluation</span>
          {' '}— Gender, marital status, dependents &amp; education are neutralised.
          Requires <span className="font-mono text-foreground">{thresholdPct}%</span> confidence to approve.
        </p>
      </div>

      {/* ── Verdict Hero Card ── */}
      <div
        role="region"
        aria-label="Loan decision result"
        className="card p-8 flex flex-col items-center text-center gap-6"
        style={{ boxShadow: approved ? approvedGlow : rejectedGlow }}
      >
        {/* Icon */}
        <div
          className={`
            w-20 h-20 rounded-full flex items-center justify-center
            ${approved
              ? 'bg-[rgba(52,211,153,0.12)] text-success'
              : 'bg-[rgba(248,113,113,0.12)] text-danger'
            }
          `}
        >
          {approved ? (
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
              <path d="M8 18L15 25L28 11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
              <path d="M11 11L25 25M25 11L11 25" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          )}
        </div>

        {/* Verdict text */}
        <div className="flex flex-col gap-2">
          <h1
            className={`font-display text-4xl font-bold tracking-tight ${approved ? 'text-success' : 'text-danger'}`}
          >
            {approved ? 'Approved' : 'Not Approved'}
          </h1>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            {approved
              ? 'The financial profile meets the strict approval criteria.'
              : 'The financial profile does not meet the strict approval criteria.'}
          </p>
        </div>

        {/* Probability bar */}
        <div className="w-full max-w-sm flex flex-col gap-3" aria-label="Approval probability breakdown">
          <div className="flex justify-between text-xs font-mono-label uppercase tracking-wide text-muted-foreground">
            <span>Approved</span>
            <span>Not Approved</span>
          </div>

          {/* Bar track */}
          <div className="relative h-2.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
            {/* Approval fill */}
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-success transition-all duration-700 ease-out"
              style={{ width: `${probability_approved * 100}%` }}
            />
            {/* Threshold marker */}
            <div
              className="absolute top-0 bottom-0 w-px bg-accent/60"
              style={{ left: `${threshold_used * 100}%` }}
              title={`Approval threshold: ${thresholdPct}%`}
            />
          </div>

          <div className="flex justify-between items-end">
            <div className="flex flex-col items-start gap-0.5">
              <span className="font-mono text-xl font-semibold text-success">{probApprovedPct}%</span>
              <span className="text-[10px] text-muted-foreground font-mono-label uppercase tracking-wide">Approval chance</span>
            </div>

            {/* Threshold callout */}
            <div className="flex flex-col items-center gap-0.5">
              <div className="h-px w-6 bg-accent/50" />
              <span className="text-[10px] text-accent font-mono-label uppercase tracking-wide">
                {thresholdPct}% needed
              </span>
            </div>

            <div className="flex flex-col items-end gap-0.5">
              <span className="font-mono text-xl font-semibold text-danger">{probRejectedPct}%</span>
              <span className="text-[10px] text-muted-foreground font-mono-label uppercase tracking-wide">Rejection chance</span>
            </div>
          </div>
        </div>

        {/* Gap indicator — how far from threshold */}
        {(() => {
          const gap = probability_approved - threshold_used;
          const absPct = Math.abs(gap * 100).toFixed(1);
          const color = gap >= 0 ? 'text-success' : 'text-danger';
          const symbol = gap >= 0 ? '+' : '';
          return (
            <p className="text-xs text-muted-foreground font-mono-label">
              Score is{' '}
              <span className={`font-semibold ${color}`}>
                {symbol}{absPct}%
              </span>{' '}
              {gap >= 0 ? 'above' : 'below'} the {thresholdPct}% threshold
            </p>
          );
        })()}
      </div>

      {/* ── Feature Contributions (financial only) ── */}
      <div className="card p-6 flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-base font-semibold text-foreground">
              Financial factors analysed
            </h2>
            <span className="text-[10px] font-mono-label uppercase tracking-wide text-accent border border-accent/30 bg-[rgba(245,158,11,0.07)] rounded px-1.5 py-0.5">
              Unbiased
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Top 5 financial factors · demographic features excluded
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {sortedFeatures.map(([feat, imp], idx) => (
            <FeatureBar
              key={feat}
              label={FEATURE_LABELS[feat] ?? feat}
              value={imp}
              maxValue={maxImportance}
              rank={idx + 1}
            />
          ))}
        </div>
      </div>

      {/* ── Bias Note ── */}
      {bias_note && (
        <div className="px-4 py-3 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="inline mr-1.5 text-muted-foreground" aria-hidden="true">
              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M6 4v2.5M6 8h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            {bias_note}
          </p>
        </div>
      )}

      {/* ── Start Over ── */}
      <div className="flex justify-center pb-4">
        <Button variant="secondary" onClick={onReset} size="md">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mr-2" aria-hidden="true">
            <path d="M1 7A6 6 0 1 0 7 1M1 1v6h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Start Over
        </Button>
      </div>
    </div>
  );
}
