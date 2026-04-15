'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { TRIBES, type TribeDef } from '@/lib/game/tribes';
import { calculateDistance, calculateSendTime } from '@/lib/game/calculators';
import { SERVER_SPEED, ROF_TRIBES } from '@/lib/game/constants';
import { Send } from 'lucide-react';

interface DefenseResponseFormProps {
  callId: string;
  targetX: number;
  targetY: number;
  impactTime: string | null;
  onSubmitted?: () => void;
}

export function DefenseResponseForm({
  callId,
  targetX,
  targetY,
  impactTime,
  onSubmitted,
}: DefenseResponseFormProps) {
  const [tribeId, setTribeId] = useState<number>(3);
  const [sourceX, setSourceX] = useState('');
  const [sourceY, setSourceY] = useState('');
  const [sourceVillageName, setSourceVillageName] = useState('');
  const [troopCounts, setTroopCounts] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const tribe: TribeDef | undefined = TRIBES[tribeId];
  const defUnits = useMemo(
    () => tribe?.units.filter(u => u.defInf > 10 || u.defCav > 10) ?? [],
    [tribe],
  );

  const { infDef, cavDef, slowestSpeed } = useMemo(() => {
    let inf = 0;
    let cav = 0;
    let slowest = Infinity;

    if (!tribe) return { infDef: 0, cavDef: 0, slowestSpeed: 3 };

    for (const unit of tribe.units) {
      const count = parseInt(troopCounts[unit.name] || '0', 10);
      if (count > 0) {
        inf += unit.defInf * count;
        cav += unit.defCav * count;
        if (unit.speed < slowest) slowest = unit.speed;
      }
    }

    return { infDef: inf, cavDef: cav, slowestSpeed: slowest === Infinity ? 3 : slowest };
  }, [tribe, troopCounts]);

  const sendTimeStr = useMemo(() => {
    const sx = parseInt(sourceX, 10);
    const sy = parseInt(sourceY, 10);
    if (isNaN(sx) || isNaN(sy) || !impactTime || slowestSpeed <= 0) return null;
    const distance = calculateDistance(sx, sy, targetX, targetY);
    if (distance === 0) return null;
    const sendDate = calculateSendTime(impactTime, distance, slowestSpeed, SERVER_SPEED);
    return sendDate.toLocaleString('pl-PL');
  }, [sourceX, sourceY, targetX, targetY, impactTime, slowestSpeed]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const sx = parseInt(sourceX, 10);
    const sy = parseInt(sourceY, 10);
    if (isNaN(sx) || isNaN(sy)) {
      setError('Podaj poprawne koordynaty źródła');
      return;
    }

    const troops: Record<string, number> = {};
    for (const [name, countStr] of Object.entries(troopCounts)) {
      const count = parseInt(countStr, 10);
      if (count > 0) troops[name] = count;
    }

    if (Object.keys(troops).length === 0) {
      setError('Wybierz przynajmniej jedną jednostkę');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/defense/${callId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceX: sx,
          sourceY: sy,
          sourceVillageName: sourceVillageName || undefined,
          troops,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Błąd podczas wysyłania');
        return;
      }
      setTroopCounts({});
      setSourceX('');
      setSourceY('');
      setSourceVillageName('');
      onSubmitted?.();
    } catch {
      setError('Błąd sieci');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-sm font-medium">Wyślij obronę</h3>

      {/* Tribe selector */}
      <div className="space-y-1.5">
        <Label>Plemię</Label>
        <select
          value={tribeId}
          onChange={e => {
            setTribeId(parseInt(e.target.value, 10));
            setTroopCounts({});
          }}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {ROF_TRIBES.map(tid => (
            <option key={tid} value={tid}>
              {TRIBES[tid]?.emoji} {TRIBES[tid]?.namePl}
            </option>
          ))}
        </select>
      </div>

      {/* Source coordinates */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="space-y-1.5">
          <Label>Źródło X</Label>
          <Input
            type="number"
            value={sourceX}
            onChange={e => setSourceX(e.target.value)}
            min={-200}
            max={200}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>Źródło Y</Label>
          <Input
            type="number"
            value={sourceY}
            onChange={e => setSourceY(e.target.value)}
            min={-200}
            max={200}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>Wioska (opcja)</Label>
          <Input
            type="text"
            value={sourceVillageName}
            onChange={e => setSourceVillageName(e.target.value)}
          />
        </div>
      </div>

      {/* Troop inputs */}
      {tribe && (
        <div className="space-y-2">
          <Label>Jednostki</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {defUnits.map(unit => (
              <div key={unit.name} className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  className="w-20 sm:w-24"
                  placeholder="0"
                  value={troopCounts[unit.name] || ''}
                  onChange={e =>
                    setTroopCounts(prev => ({ ...prev, [unit.name]: e.target.value }))
                  }
                />
                <div className="text-xs leading-tight">
                  <div>{unit.namePl || unit.name}</div>
                  <div className="text-muted-foreground">
                    🛡{unit.defInf}/{unit.defCav} ⚡{unit.speed}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calculated values */}
      <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Obrona piechoty:</span>
          <span className="font-mono">{infDef.toLocaleString('pl-PL')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Obrona kawalerii:</span>
          <span className="font-mono">{cavDef.toLocaleString('pl-PL')}</span>
        </div>
        {sendTimeStr && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Czas wysłania:</span>
            <span className="font-mono text-amber-400">{sendTimeStr}</span>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        <Send className="size-4 mr-1.5" />
        {submitting ? 'Wysyłanie...' : 'Wyślij obronę'}
      </Button>
    </form>
  );
}
