"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TRIBES, type UnitDef } from "@/lib/game/tribes";

const ROF_TRIBE_IDS = [1, 2, 3, 6, 7, 8] as const;

const UNIT_TYPE_LABELS: Record<string, string> = {
  inf: "Piechota",
  cav: "Kawaleria",
  siege: "Oblężenie",
  special: "Specjalna",
};

// Base training times in seconds (level 1, speed 1x)
const BASE_TRAINING_TIMES: Record<number, number[]> = {
  // Romans
  1: [1600, 1760, 1920, 1360, 2640, 3520, 3600, 5000, 25200, 22700],
  // Teutons
  2: [960, 1120, 1280, 1080, 2160, 2880, 3600, 5000, 25200, 22700],
  // Gauls
  3: [1120, 1280, 1080, 1440, 2400, 3200, 3600, 5000, 25200, 22700],
  // Egyptians
  6: [860, 1120, 1600, 1040, 3200, 2400, 3600, 5000, 25200, 22700],
  // Huns — overridden by HUNS_TRAINING below
  7: [],
  // Spartans
  8: [1280, 1440, 1600, 2400, 3200, 3600, 3600, 5000, 25200, 22700],
};

// Huns have 10 units but indices differ — fix mapping
// Huns: Mercenary, Bowman, Spotter, Steppe Rider, Marksman, Marauder, Ram, Catapult, Logades, Settler
const HUNS_TRAINING: number[] = [960, 1120, 1360, 2400, 2880, 3600, 3600, 5000, 25200, 22700];

function getBaseTime(tribeId: number, unitIndex: number): number {
  if (tribeId === 7) return HUNS_TRAINING[unitIndex] ?? 0;
  return (BASE_TRAINING_TIMES[tribeId] ?? [])[unitIndex] ?? 0;
}

function calcTrainingTime(baseTime: number, buildingLevel: number, serverSpeed: number): number {
  if (baseTime <= 0) return 0;
  return (baseTime * Math.pow(0.9, buildingLevel - 1)) / serverSpeed;
}

function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return "--:--:--";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

interface UnitRow {
  unit: UnitDef;
  index: number;
  baseTime: number;
  trainingTime: number;
  unitsPerHour: number;
  unitsPerDay: number;
}

export function TrainingCalculator({ serverSpeed }: { serverSpeed: number }) {
  const [tribeId, setTribeId] = useState<number>(1);
  const [buildingLevel, setBuildingLevel] = useState<number>(10);

  const tribe = TRIBES[tribeId];

  const rows: UnitRow[] = useMemo(() => {
    if (!tribe) return [];
    return tribe.units.map((unit, index) => {
      const baseTime = getBaseTime(tribeId, index);
      const trainingTime = calcTrainingTime(baseTime, buildingLevel, serverSpeed);
      const unitsPerHour = trainingTime > 0 ? Math.floor(3600 / trainingTime) : 0;
      const unitsPerDay = trainingTime > 0 ? Math.floor(86400 / trainingTime) : 0;
      return { unit, index, baseTime, trainingTime, unitsPerHour, unitsPerDay };
    });
  }, [tribe, tribeId, buildingLevel, serverSpeed]);

  const handleLevelChange = (val: string) => {
    const n = parseInt(val, 10);
    if (!isNaN(n) && n >= 1 && n <= 20) setBuildingLevel(n);
    else if (val === "") setBuildingLevel(1);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Parametry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            {/* Tribe select */}
            <div className="space-y-2 min-w-[200px]">
              <Label htmlFor="tribe" className="text-xs uppercase text-muted-foreground">Plemię</Label>
              <select
                id="tribe"
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                value={tribeId}
                onChange={(e) => setTribeId(Number(e.target.value))}
              >
                {ROF_TRIBE_IDS.map((tid) => {
                  const t = TRIBES[tid];
                  return t ? (
                    <option key={tid} value={tid}>{t.emoji} {t.namePl}</option>
                  ) : null;
                })}
              </select>
            </div>

            {/* Building level */}
            <div className="space-y-2 min-w-[200px]">
              <Label htmlFor="level" className="text-xs uppercase text-muted-foreground">
                Poziom budynku szkoleniowego
              </Label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={buildingLevel}
                  onChange={(e) => setBuildingLevel(Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <Input
                  id="level"
                  type="number"
                  min={1}
                  max={20}
                  value={buildingLevel}
                  onChange={(e) => handleLevelChange(e.target.value)}
                  className="w-16 text-center"
                />
              </div>
            </div>

            {/* Server speed display */}
            <div className="space-y-2">
              <Label className="text-xs uppercase text-muted-foreground">Prędkość serwera</Label>
              <div className="flex h-8 items-center">
                <Badge variant="outline" className="text-sm font-mono">×{serverSpeed}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {tribe ? `${tribe.emoji} ${tribe.namePl}` : "—"} — poziom {buildingLevel}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-2 font-medium">Jednostka</th>
                  <th className="py-2 px-2 font-medium text-center">Typ</th>
                  <th className="py-2 px-2 font-medium text-center">Prędkość</th>
                  <th className="py-2 px-2 font-medium text-center">Atak</th>
                  <th className="py-2 px-2 font-medium text-center">Obr. piech.</th>
                  <th className="py-2 px-2 font-medium text-center">Obr. kaw.</th>
                  <th className="py-2 px-2 font-medium text-center">Czas szkolenia</th>
                  <th className="py-2 px-2 font-medium text-center">Na godzinę</th>
                  <th className="py-2 pl-2 font-medium text-right">Na dzień</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.unit.name} className="border-b border-border/50">
                    <td className="py-2 pr-2 font-medium">
                      {r.unit.namePl ?? r.unit.name}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span className="text-xs text-muted-foreground">
                        {UNIT_TYPE_LABELS[r.unit.unitType] ?? r.unit.unitType}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center font-mono">{r.unit.speed}</td>
                    <td className="py-2 px-2 text-center font-mono">{r.unit.att}</td>
                    <td className="py-2 px-2 text-center font-mono">{r.unit.defInf}</td>
                    <td className="py-2 px-2 text-center font-mono">{r.unit.defCav}</td>
                    <td className="py-2 px-2 text-center font-mono">
                      {formatDuration(r.trainingTime)}
                    </td>
                    <td className="py-2 px-2 text-center font-mono font-bold">
                      {r.unitsPerHour}
                    </td>
                    <td className="py-2 pl-2 text-right font-mono font-bold">
                      {r.unitsPerDay}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Wzór: czas = czas_bazowy × 0.9^(poziom−1) / prędkość_serwera · Czasy bazowe są przybliżone
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
