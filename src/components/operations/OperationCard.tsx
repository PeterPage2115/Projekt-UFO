'use client';

import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const TYPE_LABELS: Record<string, string> = {
  attack: 'Atak',
  fake_and_real: 'Fejki + Reale',
  scout: 'Zwiad',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Szkic',
  active: 'Aktywna',
  completed: 'Zakończona',
  cancelled: 'Anulowana',
};

const STATUS_VARIANTS: Record<
  string,
  'secondary' | 'default' | 'outline' | 'destructive'
> = {
  draft: 'secondary',
  active: 'default',
  completed: 'outline',
  cancelled: 'destructive',
};

function formatLandingTime(iso: string): string {
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

interface OperationCardProps {
  operation: {
    id: string;
    name: string;
    type: 'attack' | 'fake_and_real' | 'scout';
    status: 'draft' | 'active' | 'completed' | 'cancelled';
    landingTime: string | null;
    description: string | null;
    createdAt: string | null;
    targetCount: number;
    assignmentCount: number;
    confirmedCount: number;
  };
}

export function OperationCard({ operation }: OperationCardProps) {
  return (
    <Link href={`/operations/${operation.id}`} className="block">
      <Card
        className={cn(
          'transition-shadow hover:ring-2 hover:ring-primary/30 hover:shadow-md'
        )}
      >
        <CardHeader>
          <CardTitle>{operation.name}</CardTitle>
          <CardAction>
            <Badge variant="outline">{TYPE_LABELS[operation.type]}</Badge>
          </CardAction>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={STATUS_VARIANTS[operation.status]}>
              {STATUS_LABELS[operation.status]}
            </Badge>

            {operation.landingTime && (
              <span className="text-xs text-muted-foreground">
                🕐 {formatLandingTime(operation.landingTime)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="flex flex-col items-center gap-0.5">
              <span>🎯</span>
              <span className="font-medium">{operation.targetCount}</span>
              <span className="text-muted-foreground">Cele</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span>⚔️</span>
              <span className="font-medium">{operation.assignmentCount}</span>
              <span className="text-muted-foreground">Ataki</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span>✅</span>
              <span className="font-medium">{operation.confirmedCount}</span>
              <span className="text-muted-foreground">Potwierdzone</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
