'use client';

interface DefenseProgressProps {
  label: string;
  collected: number;
  requested: number | null;
}

export function DefenseProgress({ label, collected, requested }: DefenseProgressProps) {
  const hasTarget = requested !== null && requested > 0;
  const percentage = hasTarget ? Math.min(100, Math.round((collected / requested!) * 100)) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono tabular-nums">
          {collected.toLocaleString('pl-PL')}
          {hasTarget && (
            <span className="text-muted-foreground"> / {requested!.toLocaleString('pl-PL')}</span>
          )}
          {hasTarget && (
            <span className={percentage >= 100 ? 'text-green-400 ml-1' : 'text-muted-foreground ml-1'}>
              ({percentage}%)
            </span>
          )}
        </span>
      </div>
      {hasTarget && (
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              percentage >= 100 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}
