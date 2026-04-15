'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type DefenseType = 'normal' | 'permanent' | 'between_waves';

export function NewDefenseCallClient() {
  const router = useRouter();
  const [type, setType] = useState<DefenseType>('normal');
  const [targetX, setTargetX] = useState('');
  const [targetY, setTargetY] = useState('');
  const [impactTime, setImpactTime] = useState('');
  const [waveDelay, setWaveDelay] = useState('');
  const [requestedInfDef, setRequestedInfDef] = useState('');
  const [requestedCavDef, setRequestedCavDef] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const x = parseInt(targetX, 10);
    const y = parseInt(targetY, 10);
    if (isNaN(x) || isNaN(y)) {
      setError('Podaj poprawne koordynaty');
      return;
    }

    if (type === 'normal' && !impactTime) {
      setError('Czas uderzenia jest wymagany dla typu zwykłego');
      return;
    }

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        type,
        targetX: x,
        targetY: y,
      };
      if (impactTime) body.impactTime = new Date(impactTime).toISOString();
      if (type === 'between_waves' && waveDelay) body.waveDelay = parseInt(waveDelay, 10);
      if (requestedInfDef) body.requestedInfDef = parseInt(requestedInfDef, 10);
      if (requestedCavDef) body.requestedCavDef = parseInt(requestedCavDef, 10);
      if (description) body.description = description;

      const res = await fetch('/api/defense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Błąd podczas tworzenia');
        return;
      }

      const created = await res.json();
      router.push(`/defense/${created.id}`);
    } catch {
      setError('Błąd sieci');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/defense">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <Shield className="size-5 text-blue-400" />
        <h1 className="text-xl font-bold">Nowe wezwanie do obrony</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Szczegóły wezwania</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type */}
            <div className="space-y-1.5">
              <Label>Typ</Label>
              <select
                value={type}
                onChange={e => setType(e.target.value as DefenseType)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="normal">Zwykły</option>
                <option value="permanent">Stały</option>
                <option value="between_waves">Między falami</option>
              </select>
            </div>

            {/* Target coords */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Cel X</Label>
                <Input
                  type="number"
                  value={targetX}
                  onChange={e => setTargetX(e.target.value)}
                  min={-200}
                  max={200}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Cel Y</Label>
                <Input
                  type="number"
                  value={targetY}
                  onChange={e => setTargetY(e.target.value)}
                  min={-200}
                  max={200}
                  required
                />
              </div>
            </div>

            {/* Impact time */}
            {(type === 'normal' || type === 'between_waves') && (
              <div className="space-y-1.5">
                <Label>Czas uderzenia {type === 'normal' && '*'}</Label>
                <Input
                  type="datetime-local"
                  value={impactTime}
                  onChange={e => setImpactTime(e.target.value)}
                  required={type === 'normal'}
                  step={1}
                />
              </div>
            )}

            {/* Wave delay */}
            {type === 'between_waves' && (
              <div className="space-y-1.5">
                <Label>Opóźnienie między falami (sekundy)</Label>
                <Input
                  type="number"
                  value={waveDelay}
                  onChange={e => setWaveDelay(e.target.value)}
                  min={1}
                  placeholder="np. 3"
                />
              </div>
            )}

            {/* Requested defense */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Żądana obrona piechoty</Label>
                <Input
                  type="number"
                  value={requestedInfDef}
                  onChange={e => setRequestedInfDef(e.target.value)}
                  min={0}
                  placeholder="np. 50000"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Żądana obrona kawalerii</Label>
                <Input
                  type="number"
                  value={requestedCavDef}
                  onChange={e => setRequestedCavDef(e.target.value)}
                  min={0}
                  placeholder="np. 30000"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label>Opis</Label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                placeholder="Dodatkowe informacje..."
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Tworzenie...' : 'Utwórz wezwanie'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
