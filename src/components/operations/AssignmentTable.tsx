'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/game/calculators';

interface Assignment {
  id: string;
  targetId: string;
  userId: string;
  userName: string;
  sourceX: number | null;
  sourceY: number | null;
  sourceVillageName: string | null;
  targetX: number;
  targetY: number;
  targetVillageName: string | null;
  unitSpeed: number | null;
  waves: number | null;
  sendTime: string | null;
  travelTime: number | null;
  status: 'pending' | 'confirmed' | 'sent';
  notes: string | null;
}

interface AssignmentTableProps {
  assignments: Assignment[];
  canManage: boolean;
  currentUserId: string;
  onConfirm?: (assignmentId: string) => void;
  onMarkSent?: (assignmentId: string) => void;
  onDelete?: (assignmentId: string) => void;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  pending: {
    label: 'Oczekuje',
    className:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  confirmed: {
    label: 'Potwierdzone',
    className:
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  sent: {
    label: 'Wysłane',
    className:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
};

function formatSendTime(iso: string): string {
  const date = new Date(iso);
  const fmt = new Intl.DateTimeFormat('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    hour12: false,
  });
  return fmt.format(date);
}

export function AssignmentTable({
  assignments,
  canManage,
  currentUserId,
  onConfirm,
  onMarkSent,
  onDelete,
}: AssignmentTableProps) {
  if (assignments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        <p className="text-sm">Brak przypisań</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="whitespace-nowrap px-3 py-2 font-medium">Gracz</th>
            <th className="whitespace-nowrap px-3 py-2 font-medium">Źródło</th>
            <th className="whitespace-nowrap px-3 py-2 font-medium">Cel</th>
            <th className="whitespace-nowrap px-3 py-2 font-medium">
              Czas wysyłki
            </th>
            <th className="whitespace-nowrap px-3 py-2 font-medium">
              Czas podróży
            </th>
            <th className="whitespace-nowrap px-3 py-2 font-medium">Fale</th>
            <th className="whitespace-nowrap px-3 py-2 font-medium">Status</th>
            <th className="whitespace-nowrap px-3 py-2 font-medium">Akcje</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map((a) => {
            const isOwner = a.userId === currentUserId;
            const statusCfg = STATUS_CONFIG[a.status];

            return (
              <tr
                key={a.id}
                className="border-b last:border-b-0 hover:bg-muted/30"
              >
                <td className="whitespace-nowrap px-3 py-2 font-medium">
                  {a.userName}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  {a.sourceVillageName && (
                    <span>{a.sourceVillageName} </span>
                  )}
                  {a.sourceX != null && a.sourceY != null && (
                    <span className="font-mono text-xs text-muted-foreground">
                      ({a.sourceX}|{a.sourceY})
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  {a.targetVillageName && (
                    <span>{a.targetVillageName} </span>
                  )}
                  <span className="font-mono text-xs text-muted-foreground">
                    ({a.targetX}|{a.targetY})
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">
                  {a.sendTime ? formatSendTime(a.sendTime) : '—'}
                </td>
                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">
                  {a.travelTime != null ? formatDuration(a.travelTime) : '—'}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-center">
                  {a.waves ?? '—'}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                      statusCfg?.className
                    )}
                  >
                    {statusCfg?.label ?? a.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  <div className="flex items-center gap-1">
                    {isOwner && a.status === 'pending' && onConfirm && (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => onConfirm(a.id)}
                      >
                        Potwierdź
                      </Button>
                    )}
                    {isOwner && a.status === 'confirmed' && onMarkSent && (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => onMarkSent(a.id)}
                      >
                        Wysłane
                      </Button>
                    )}
                    {canManage && onDelete && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => onDelete(a.id)}
                      >
                        🗑️
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
