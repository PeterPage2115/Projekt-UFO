'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TimelineTarget {
  id: string;
  targetX: number;
  targetY: number;
  targetVillageName: string | null;
  targetPlayerName: string | null;
  isReal: number | null;
  assignments: {
    id: string;
    userId: string;
    userName: string;
    sourceVillageName: string | null;
    sendTime: string | null;
    travelTime: number | null;
    status: string;
    waves: number | null;
  }[];
}

interface OperationTimelineProps {
  targets: TimelineTarget[];
  landingTime: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-400',
  confirmed: 'bg-blue-500',
  sent: 'bg-green-500',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Oczekuje',
  confirmed: 'Potwierdzone',
  sent: 'Wysłane',
};

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const fmt = new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return fmt.format(date);
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  const fmt = new Intl.DateTimeFormat('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return fmt.format(date);
}

export function OperationTimeline({
  targets,
  landingTime,
}: OperationTimelineProps) {
  if (targets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        <p className="text-sm">Brak celów — dodaj cele operacji</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {landingTime && (
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-3">
          <span className="text-lg">🎯</span>
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Czas lądowania
            </p>
            <p className="text-sm font-semibold">
              {formatDateTime(landingTime)}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {targets.map((target) => (
          <div key={target.id} className="flex flex-col gap-2">
            {/* Target header */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-medium">
                ({target.targetX}|{target.targetY})
              </span>
              {target.targetVillageName && (
                <span className="text-sm">{target.targetVillageName}</span>
              )}
              {target.targetPlayerName && (
                <span className="text-xs text-muted-foreground">
                  — {target.targetPlayerName}
                </span>
              )}
              <Badge
                variant={target.isReal ? 'destructive' : 'secondary'}
              >
                {target.isReal ? 'REAL' : 'FAKE'}
              </Badge>
            </div>

            {/* Assignments timeline */}
            <div className="relative ml-3 border-l-2 border-border pl-4">
              {target.assignments.length === 0 ? (
                <p className="py-2 text-xs text-muted-foreground">
                  Brak przypisań
                </p>
              ) : (
                target.assignments.map((assignment) => (
                  <div key={assignment.id} className="relative pb-4 last:pb-0">
                    {/* Dot on timeline */}
                    <div
                      className={cn(
                        'absolute -left-[calc(0.5rem+1px)] top-1.5 size-3 rounded-full ring-2 ring-background',
                        STATUS_COLORS[assignment.status] ?? 'bg-gray-400'
                      )}
                    />

                    <div className="flex flex-col gap-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">
                          {assignment.userName}
                        </span>
                        {assignment.sourceVillageName && (
                          <span className="text-xs text-muted-foreground">
                            z {assignment.sourceVillageName}
                          </span>
                        )}
                        {assignment.waves != null && assignment.waves > 1 && (
                          <span className="text-xs text-muted-foreground">
                            ({assignment.waves} fal)
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {assignment.sendTime && (
                          <span>
                            Wysyłka: {formatTime(assignment.sendTime)}
                          </span>
                        )}
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                            assignment.status === 'pending' &&
                              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
                            assignment.status === 'confirmed' &&
                              'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
                            assignment.status === 'sent' &&
                              'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          )}
                        >
                          {STATUS_LABELS[assignment.status] ?? assignment.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
