"use client";

import { useState, useMemo, useCallback } from "react";
import { TRIBES, type TribeDef, type UnitDef, calculateAttackValue, calculateDefenseValue } from "@/lib/game/tribes";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const TROOP_TYPE_OPTIONS = [
  { value: "off", label: "⚔️ Ofensywa" },
  { value: "def", label: "🛡️ Defensywa" },
  { value: "scout", label: "👁️ Zwiad" },
  { value: "siege", label: "🏗️ Oblężenie" },
] as const;

const tribeList = Object.values(TRIBES).sort((a, b) => a.tid - b.tid);

interface TroopReportFormProps {
  initialData?: {
    villageX?: number;
    villageY?: number;
    villageName?: string;
    troopType?: string;
    tribeId?: number;
    troops?: Record<string, number>;
    notes?: string;
  };
  onSuccess?: () => void;
}

export function TroopReportForm({ initialData, onSuccess }: TroopReportFormProps) {
  const [villageX, setVillageX] = useState(initialData?.villageX?.toString() ?? "");
  const [villageY, setVillageY] = useState(initialData?.villageY?.toString() ?? "");
  const [villageName, setVillageName] = useState(initialData?.villageName ?? "");
  const [troopType, setTroopType] = useState(initialData?.troopType ?? "off");
  const [tribeId, setTribeId] = useState<number>(initialData?.tribeId ?? 0);
  const [unitCounts, setUnitCounts] = useState<Record<string, number>>(initialData?.troops ?? {});
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedTribe = tribeId ? TRIBES[tribeId] : null;

  const handleTribeChange = useCallback((newTribeId: number) => {
    setTribeId(newTribeId);
    setUnitCounts({});
  }, []);

  const handleUnitChange = useCallback((unitName: string, value: string) => {
    const count = parseInt(value, 10);
    setUnitCounts((prev) => {
      const next = { ...prev };
      if (isNaN(count) || count <= 0) {
        delete next[unitName];
      } else {
        next[unitName] = count;
      }
      return next;
    });
  }, []);

  const calculatedValues = useMemo(() => {
    if (!tribeId || Object.keys(unitCounts).length === 0) {
      return { offValue: 0, defInfValue: 0, defCavValue: 0 };
    }
    const offValue = calculateAttackValue(tribeId, unitCounts);
    const { infDef, cavDef } = calculateDefenseValue(tribeId, unitCounts);
    return { offValue, defInfValue: infDef, defCavValue: cavDef };
  }, [tribeId, unitCounts]);

  const totalUnits = useMemo(
    () => Object.values(unitCounts).reduce((s, c) => s + c, 0),
    [unitCounts],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!villageX || !villageY) {
      setError("Podaj współrzędne wioski.");
      return;
    }
    if (!tribeId) {
      setError("Wybierz plemię.");
      return;
    }
    if (Object.keys(unitCounts).length === 0) {
      setError("Wpisz liczbę przynajmniej jednej jednostki.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/troops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          villageX: parseInt(villageX, 10),
          villageY: parseInt(villageY, 10),
          villageName: villageName || undefined,
          troopType,
          troops: unitCounts,
          tribeId,
          notes: notes || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Błąd zapisu");
      }

      const data = await res.json();
      setSuccess(data.updated ? "Raport zaktualizowany!" : "Raport zapisany!");
      onSuccess?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Step 1: Village coordinates */}
      <Card>
        <CardHeader>
          <CardTitle>📍 Wioska</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="villageX">Współrzędna X</Label>
              <Input
                id="villageX"
                type="number"
                value={villageX}
                onChange={(e) => setVillageX(e.target.value)}
                placeholder="-200 ... 200"
                required
              />
            </div>
            <div>
              <Label htmlFor="villageY">Współrzędna Y</Label>
              <Input
                id="villageY"
                type="number"
                value={villageY}
                onChange={(e) => setVillageY(e.target.value)}
                placeholder="-200 ... 200"
                required
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <Label htmlFor="villageName">Nazwa wioski</Label>
              <Input
                id="villageName"
                type="text"
                value={villageName}
                onChange={(e) => setVillageName(e.target.value)}
                placeholder="(opcjonalnie)"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Troop type */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 Typ wojsk</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {TROOP_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTroopType(opt.value)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  troopType === opt.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border hover:bg-muted"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step 3: Tribe selection */}
      <Card>
        <CardHeader>
          <CardTitle>🏰 Plemię</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {tribeList.map((tribe) => (
              <button
                key={tribe.tid}
                type="button"
                onClick={() => handleTribeChange(tribe.tid)}
                className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors text-left ${
                  tribeId === tribe.tid
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border hover:bg-muted"
                }`}
              >
                <span className="mr-2">{tribe.emoji}</span>
                {tribe.namePl}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step 4: Unit inputs */}
      {selectedTribe && (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedTribe.emoji} Jednostki — {selectedTribe.namePl}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {selectedTribe.units.map((unit) => (
                <div key={unit.name} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">
                        {unit.namePl || unit.name}
                      </span>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {unit.unitType}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ⚔️{unit.att} 🛡️{unit.defInf}/{unit.defCav} 💨{unit.speed}
                    </div>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    className="w-28"
                    placeholder="0"
                    value={unitCounts[unit.name] ?? ""}
                    onChange={(e) => handleUnitChange(unit.name, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Calculated values */}
      {totalUnits > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Obliczone wartości</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs text-muted-foreground">⚔️ Atak</div>
                <div className="text-xl font-bold text-red-400">
                  {calculatedValues.offValue.toLocaleString("pl-PL")}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">🛡️ Obr. piechoty</div>
                <div className="text-xl font-bold text-blue-400">
                  {calculatedValues.defInfValue.toLocaleString("pl-PL")}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">🐴 Obr. kawalerii</div>
                <div className="text-xl font-bold text-green-400">
                  {calculatedValues.defCavValue.toLocaleString("pl-PL")}
                </div>
              </div>
            </div>
            <div className="mt-3 text-center text-sm text-muted-foreground">
              Łącznie jednostek: {totalUnits.toLocaleString("pl-PL")}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>📝 Notatki</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Dodatkowe informacje (np. poziom kuźni, HD)..."
          />
        </CardContent>
      </Card>

      {/* Submit */}
      {error && (
        <div className="rounded-lg bg-destructive/10 text-destructive px-4 py-2 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-500/10 text-green-400 px-4 py-2 text-sm">
          {success}
        </div>
      )}

      <Button type="submit" disabled={submitting} className="w-full h-10">
        {submitting ? "Zapisywanie..." : "💾 Zapisz raport"}
      </Button>
    </form>
  );
}
