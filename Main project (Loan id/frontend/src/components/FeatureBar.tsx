interface FeatureBarProps {
  label: string;
  value: number;       // raw importance (0–1)
  maxValue: number;    // maximum of displayed features for relative scaling
  rank: number;
}

export default function FeatureBar({ label, value, maxValue, rank }: FeatureBarProps) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  const displayPct = (value * 100).toFixed(1);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-muted-foreground w-4 text-right select-none">
            #{rank}
          </span>
          <span className="text-sm text-foreground font-medium">{label}</span>
        </div>
        <span className="font-mono text-xs text-accent font-medium">
          {displayPct}%
        </span>
      </div>

      <div className="relative h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden ml-6">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-accent transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={parseFloat(displayPct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label}: ${displayPct}% importance`}
        />
      </div>
    </div>
  );
}
