'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { DefenseCallCard } from './DefenseCallCard';
import { Button } from '@/components/ui/button';
import { Shield, Plus } from 'lucide-react';

function canManageOpsClient(role: string): boolean {
  return ['admin', 'leader', 'officer'].includes(role);
}

type StatusFilter = 'active' | 'fulfilled' | 'expired' | 'cancelled' | '';

interface DefenseCallSummary {
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
  createdAt: string | null;
}

export function DefenseListClient() {
  const { data: session } = useSession();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const isOfficer = session?.user?.role ? canManageOpsClient(session.user.role) : false;

  const { data, isLoading } = useQuery<{ data: DefenseCallSummary[] }>({
    queryKey: ['defenseCalls', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      params.set('limit', '50');
      const res = await fetch(`/api/defense?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  const calls = data?.data ?? [];

  // Sort active calls by impact time (closest first), then by creation date
  const sortedCalls = [...calls].sort((a, b) => {
    if (a.impactTime && b.impactTime) {
      return new Date(a.impactTime).getTime() - new Date(b.impactTime).getTime();
    }
    if (a.impactTime) return -1;
    if (b.impactTime) return 1;
    return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
  });

  const filters: { value: StatusFilter; label: string }[] = [
    { value: 'active', label: 'Aktywne' },
    { value: 'fulfilled', label: 'Wypełnione' },
    { value: 'cancelled', label: 'Anulowane' },
    { value: 'expired', label: 'Wygasłe' },
    { value: '', label: 'Wszystkie' },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="size-5 text-blue-400" />
          <h1 className="text-xl font-bold">Obrona</h1>
        </div>
        {isOfficer && (
          <Link href="/defense/new">
            <Button>
              <Plus className="size-4 mr-1.5" />
              Nowe wezwanie
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 flex-wrap">
        {filters.map(f => (
          <Button
            key={f.value}
            variant={statusFilter === f.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Call list */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Ładowanie...</div>
      ) : sortedCalls.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Brak wezwań do obrony
        </div>
      ) : (
        <div className="space-y-3">
          {sortedCalls.map((call) => (
            <DefenseCallCard
              key={call.id}
              call={call}
              isOfficer={isOfficer}
            />
          ))}
        </div>
      )}
    </div>
  );
}
