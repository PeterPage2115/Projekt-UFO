'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DefenseProgress } from './DefenseProgress';
import { Shield, Clock, Users } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  normal: 'Zwykły',
  permanent: 'Stały',
  between_waves: 'Między falami',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Aktywne',
  fulfilled: 'Wypełnione',
  expired: 'Wygasłe',
  cancelled: 'Anulowane',
};

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  fulfilled: 'secondary',
  expired: 'outline',
  cancelled: 'destructive',
};

interface DefenseCallCardProps {
  call: {
    id: string;
    type: string;
    status: string;
    targetX: number;
    targetY: number;
    targetVillageName: string | null;
    targetPlayerName: string | null;
    impactTime: string | null;
    waveDelay: number | null;
    requestedInfDef: number | null;
    requestedCavDef: number | null;
    responseCount: number;
    collectedInfDef: number;
    collectedCavDef: number;
  };
  isOfficer: boolean;
}

function Countdown({ targetTime }: { targetTime: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    function update() {
      const diff = new Date(targetTime).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Czas minął!');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(
        `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`,
      );
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  return <span className="font-mono tabular-nums text-amber-400">{timeLeft}</span>;
}

export function DefenseCallCard({ call, isOfficer }: DefenseCallCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Shield className="size-4 shrink-0 text-blue-400" />
            <CardTitle className="truncate">
              ({call.targetX}|{call.targetY})
              {call.targetVillageName && ` — ${call.targetVillageName}`}
            </CardTitle>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="outline">{TYPE_LABELS[call.type] || call.type}</Badge>
            <Badge variant={STATUS_VARIANTS[call.status] || 'outline'}>
              {STATUS_LABELS[call.status] || call.status}
            </Badge>
          </div>
        </div>
        {call.targetPlayerName && (
          <p className="text-xs text-muted-foreground mt-0.5">Gracz: {call.targetPlayerName}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {call.impactTime && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Uderzenie:</span>
            <span className="font-mono text-xs">
              {new Date(call.impactTime).toLocaleString('pl-PL')}
            </span>
            <span className="text-muted-foreground">—</span>
            <Countdown targetTime={call.impactTime} />
          </div>
        )}

        {call.type === 'between_waves' && call.waveDelay && (
          <div className="text-xs text-muted-foreground">
            Opóźnienie między falami: {call.waveDelay}s
          </div>
        )}

        <DefenseProgress
          label="Obrona piechoty"
          collected={call.collectedInfDef}
          requested={call.requestedInfDef}
        />
        <DefenseProgress
          label="Obrona kawalerii"
          collected={call.collectedCavDef}
          requested={call.requestedCavDef}
        />

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="size-3.5" />
            <span>{call.responseCount} odpowiedzi</span>
          </div>
          <div className="flex items-center gap-2">
            {isOfficer && (
              <Link href={`/defense/${call.id}`}>
                <Button variant="outline" size="sm">Edytuj</Button>
              </Link>
            )}
            {call.status === 'active' && (
              <Link href={`/defense/${call.id}`}>
                <Button size="sm">Odpowiedz</Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
