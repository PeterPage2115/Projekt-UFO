'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DefenseProgress } from './DefenseProgress';
import { DefenseResponseForm } from './DefenseResponseForm';
import { Shield, ArrowLeft, Clock, Users, MapPin } from 'lucide-react';

function canManageOpsClient(role: string): boolean {
  return ['admin', 'leader', 'officer'].includes(role);
}

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

const RESPONSE_STATUS_LABELS: Record<string, string> = {
  pledged: 'Zadeklarowane',
  sent: 'Wysłane',
  arrived: 'Na miejscu',
};

interface DefenseResponse {
  id: string;
  defenseCallId: string;
  userId: string;
  sourceX: number | null;
  sourceY: number | null;
  sourceVillageName: string | null;
  troops: string | null;
  infDefValue: number | null;
  cavDefValue: number | null;
  sendTime: string | null;
  status: string;
  createdAt: string | null;
  username: string | null;
  displayName: string | null;
}

interface DefenseCallDetail {
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
  description: string | null;
  collectedInfDef: number;
  collectedCavDef: number;
  responseCount: number;
  responses: DefenseResponse[];
}

interface DefenseDetailClientProps {
  callId: string;
}

export function DefenseDetailClient({ callId }: DefenseDetailClientProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const isOfficer = session?.user?.role
    ? canManageOpsClient(session.user.role)
    : false;

  const [editingStatus, setEditingStatus] = useState(false);

  const { data, isLoading, error } = useQuery<DefenseCallDetail>({
    queryKey: ['defenseCall', callId],
    queryFn: async () => {
      const res = await fetch(`/api/defense/${callId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  async function updateCallStatus(newStatus: string) {
    await fetch(`/api/defense/${callId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    queryClient.invalidateQueries({ queryKey: ['defenseCall', callId] });
    setEditingStatus(false);
  }

  async function cancelCall() {
    if (!confirm('Czy na pewno chcesz anulować to wezwanie?')) return;
    await fetch(`/api/defense/${callId}`, { method: 'DELETE' });
    queryClient.invalidateQueries({ queryKey: ['defenseCall', callId] });
  }

  async function updateResponseStatus(responseId: string, status: string) {
    await fetch(`/api/defense/${callId}/respond`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ responseId, status }),
    });
    queryClient.invalidateQueries({ queryKey: ['defenseCall', callId] });
  }

  async function withdrawResponse(responseId: string) {
    if (!confirm('Wycofać deklarację?')) return;
    await fetch(`/api/defense/${callId}/respond?responseId=${responseId}`, {
      method: 'DELETE',
    });
    queryClient.invalidateQueries({ queryKey: ['defenseCall', callId] });
  }

  if (isLoading) {
    return <div className="p-4 text-center text-muted-foreground">Ładowanie...</div>;
  }
  if (error || !data) {
    return <div className="p-4 text-center text-destructive">Nie znaleziono wezwania</div>;
  }

  const call = data;
  const responses = call.responses ?? [];

  return (
    <div className="mx-auto max-w-4xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/defense">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <Shield className="size-5 text-blue-400" />
        <h1 className="text-xl font-bold">Wezwanie do obrony</h1>
      </div>

      {/* Call info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="size-4 text-muted-foreground" />
              ({call.targetX}|{call.targetY})
              {call.targetVillageName && ` — ${call.targetVillageName}`}
            </CardTitle>
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge variant="outline">{TYPE_LABELS[call.type] || call.type}</Badge>
              <Badge variant={STATUS_VARIANTS[call.status] || 'outline'}>
                {STATUS_LABELS[call.status] || call.status}
              </Badge>
            </div>
          </div>
          {call.targetPlayerName && (
            <p className="text-sm text-muted-foreground">Gracz: {call.targetPlayerName}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {call.impactTime && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="size-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Czas uderzenia:</span>
              <span className="font-mono">{new Date(call.impactTime).toLocaleString('pl-PL')}</span>
            </div>
          )}

          {call.type === 'between_waves' && call.waveDelay && (
            <div className="text-sm text-muted-foreground">
              Opóźnienie między falami: {call.waveDelay}s
            </div>
          )}

          {call.description && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm whitespace-pre-wrap">{call.description}</div>
          )}

          <DefenseProgress
            label="Obrona piechoty"
            collected={call.collectedInfDef ?? 0}
            requested={call.requestedInfDef}
          />
          <DefenseProgress
            label="Obrona kawalerii"
            collected={call.collectedCavDef ?? 0}
            requested={call.requestedCavDef}
          />

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="size-3.5" />
            <span>{call.responseCount ?? 0} odpowiedzi</span>
          </div>

          {/* Officer actions */}
          {isOfficer && call.status === 'active' && (
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              {!editingStatus ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => setEditingStatus(true)}>
                    Zmień status
                  </Button>
                  <Button variant="destructive" size="sm" onClick={cancelCall}>
                    Anuluj wezwanie
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => updateCallStatus('fulfilled')}>
                    Wypełnione
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => updateCallStatus('expired')}>
                    Wygasłe
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditingStatus(false)}>
                    Anuluj
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Responses list */}
      <Card>
        <CardHeader>
          <CardTitle>Odpowiedzi ({responses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {responses.length === 0 ? (
            <p className="text-sm text-muted-foreground">Brak odpowiedzi</p>
          ) : (
            <div className="space-y-3">
              {responses.map((r) => {
                const troops: Record<string, number> = r.troops ? JSON.parse(r.troops) : {};
                const isOwn = r.userId === session?.user?.id;
                return (
                  <div
                    key={r.id}
                    className="rounded-lg border border-border p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-sm font-medium">
                          {r.displayName || r.username || 'Użytkownik'}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          z ({r.sourceX}|{r.sourceY})
                          {r.sourceVillageName && ` ${r.sourceVillageName}`}
                        </span>
                      </div>
                      <Badge variant="outline">
                        {RESPONSE_STATUS_LABELS[r.status] || r.status}
                      </Badge>
                    </div>

                    {/* Troops */}
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(troops).map(([name, count]) => (
                        <span key={name} className="text-xs bg-muted rounded px-1.5 py-0.5">
                          {name}: {count.toLocaleString('pl-PL')}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>🛡 Piech: {(r.infDefValue || 0).toLocaleString('pl-PL')}</span>
                      <span>🐴 Kaw: {(r.cavDefValue || 0).toLocaleString('pl-PL')}</span>
                      {r.sendTime && (
                        <span>⏰ Wyślij: {new Date(r.sendTime).toLocaleString('pl-PL')}</span>
                      )}
                    </div>

                    {/* Own response actions */}
                    {isOwn && (
                      <div className="flex items-center gap-2 pt-1">
                        {r.status === 'pledged' && (
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => updateResponseStatus(r.id, 'sent')}
                          >
                            Oznacz jako wysłane
                          </Button>
                        )}
                        {r.status === 'sent' && (
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => updateResponseStatus(r.id, 'arrived')}
                          >
                            Na miejscu
                          </Button>
                        )}
                        {r.status === 'pledged' && (
                          <Button
                            size="xs"
                            variant="destructive"
                            onClick={() => withdrawResponse(r.id)}
                          >
                            Wycofaj
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Response form (only if active) */}
      {call.status === 'active' && (
        <Card>
          <CardContent className="pt-6">
            <DefenseResponseForm
              callId={callId}
              targetX={call.targetX}
              targetY={call.targetY}
              impactTime={call.impactTime}
              onSubmitted={() => queryClient.invalidateQueries({ queryKey: ['defenseCall', callId] })}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
