"use client";

import { useState, useMemo, Fragment } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TRIBES, type UnitDef, type UnitType } from "@/lib/game/tribes";

const ROF_TRIBE_IDS = [1, 2, 3, 6, 7, 8] as const;

const TRIBE_CDN_NAMES: Record<number, string> = {
  1: "roman",
  2: "teuton",
  3: "gaul",
  6: "egyptian",
  7: "hun",
  8: "spartan",
};

const UNIT_TYPE_LABELS: Record<string, string> = {
  inf: "Piechota",
  cav: "Kawaleria",
  siege: "Oblężenie",
  special: "Specjalna",
};

const UNIT_TYPE_ICONS: Record<string, string> = {
  inf: "⚔️",
  cav: "🐴",
  siege: "🔨",
  special: "⭐",
};

const BUILDING_LABELS: Record<string, string> = {
  inf: "🏛️ Koszary",
  cav: "🐴 Stajnia",
  siege: "⚙️ Warsztat",
};

// Base training times in seconds (level 1, speed 1x)
const BASE_TRAINING_TIMES: Record<number, number[]> = {
  1: [1600, 1760, 1920, 1360, 2640, 3520, 3600, 5000, 25200, 22700],
  2: [960, 1120, 1280, 1080, 2160, 2880, 3600, 5000, 25200, 22700],
  3: [1120, 1280, 1080, 1440, 2400, 3200, 3600, 5000, 25200, 22700],
  6: [860, 1120, 1600, 1040, 3200, 2400, 3600, 5000, 25200, 22700],
  7: [],
  8: [1280, 1440, 1600, 2400, 3200, 3600, 3600, 5000, 25200, 22700],
};

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
  const [barracksLevel, setBarracksLevel] = useState<number>(10);
  const [stableLevel, setStableLevel] = useState<number>(10);
  const [workshopLevel, setWorkshopLevel] = useState<number>(10);

  const tribe = TRIBES[tribeId];

  const getBuildingLevel = (unitType: UnitType): number => {
    switch (unitType) {
      case "inf": return barracksLevel;
      case "cav": return stableLevel;
      case "siege": return workshopLevel;
      default: return 1;
    }
  };

  const rows: UnitRow[] = useMemo(() => {
    if (!tribe) return [];
    return tribe.units.map((unit, index) => {
      const baseTime = getBaseTime(tribeId, index);
      const level = getBuildingLevel(unit.unitType);
      const trainingTime = calcTrainingTime(baseTime, level, serverSpeed);
      const unitsPerHour = trainingTime > 0 ? Math.floor(3600 / trainingTime) : 0;
      const unitsPerDay = trainingTime > 0 ? Math.floor(86400 / trainingTime) : 0;
      return { unit, index, baseTime, trainingTime, unitsPerHour, unitsPerDay };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tribe, tribeId, barracksLevel, stableLevel, workshopLevel, serverSpeed]);

  const grouped = useMemo(() => {
    const groups: Record<string, UnitRow[]> = { inf: [], cav: [], siege: [], special: [] };
    rows.forEach((r) => {
      const key = r.unit.unitType in groups ? r.unit.unitType : "special";
      groups[key].push(r);
    });
    return groups;
  }, [rows]);

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
              <Label htmlFor="tribe" className="text-xs uppercase text-muted-foreground">
                Plemię
              </Label>
              <select
                id="tribe"
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                value={tribeId}
                onChange={(e) => setTribeId(Number(e.target.value))}
              >
                {ROF_TRIBE_IDS.map((tid) => {
                  const t = TRIBES[tid];
                  return t ? (
                    <option key={tid} value={tid}>
                      {t.emoji} {t.namePl}
                    </option>
                  ) : null;
                })}
              </select>
            </div>

            {/* Building levels */}
            {(["inf", "cav", "siege"] as const).map((type) => {
              const level =
                type === "inf" ? barracksLevel : type === "cav" ? stableLevel : workshopLevel;
              const setLevel =
                type === "inf" ? setBarracksLevel : type === "cav" ? setStableLevel : setWorkshopLevel;
              return (
                <div key={type} className="space-y-2 min-w-[200px]">
                  <Label className="text-xs uppercase text-muted-foreground">
                    {BUILDING_LABELS[type]} (lv. {level})
                  </Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={1}
                      max={20}
                      value={level}
                      onChange={(e) => setLevel(Number(e.target.value))}
                      className="flex-1 accent-primary"
                    />
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={level}
                      onChange={(e) => {
                        const n = parseInt(e.target.value, 10);
                        if (!isNaN(n) && n >= 1 && n <= 20) setLevel(n);
                      }}
                      className="w-16 text-center"
                    />
                  </div>
                </div>
              );
            })}

            {/* Server speed */}
            <div className="space-y-2">
              <Label className="text-xs uppercase text-muted-foreground">Prędkość serwera</Label>
              <div className="flex h-8 items-center">
                <Badge variant="outline" className="text-sm font-mono">
                  ×{serverSpeed}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>{tribe ? `${tribe.emoji} ${tribe.namePl}` : "—"}</CardTitle>
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
                {(["inf", "cav", "siege", "special"] as const).map((type) => {
                  const typeRows = grouped[type];
                  if (!typeRows || typeRows.length === 0) return null;
                  const level = getBuildingLevel(type as UnitType);
                  const buildingName =
                    type === "inf"
                      ? "Koszary"
                      : type === "cav"
                        ? "Stajnia"
                        : type === "siege"
                          ? "Warsztat"
                          : "Specjalne";
                  return (
                    <Fragment key={type}>
                      <tr>
                        <td colSpan={9} className="pt-4 pb-2">
                          <span className="text-sm font-semibold text-primary">
                            {UNIT_TYPE_ICONS[type]} {UNIT_TYPE_LABELS[type]}
                            {type !== "special" && ` — ${buildingName} lv. ${level}`}
                          </span>
                        </td>
                      </tr>
                      {typeRows.map((r) => (
                        <tr key={r.unit.name} className="border-b border-border/50">
                          <td className="py-2 pr-2 font-medium">
                            <div className="flex items-center gap-2">
                              <img
                                src={`https://cdn.legends.travian.com/gpack/417.4/img_ltr/global/units/${TRIBE_CDN_NAMES[tribeId] ?? "roman"}/full/t${r.index + 1}.png`}
                                alt={r.unit.namePl ?? r.unit.name}
                                className="w-6 h-6 object-contain"
                                loading="lazy"
                              />
                              <span>{r.unit.namePl ?? r.unit.name}</span>
                            </div>
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
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Wzór: czas = czas_bazowy × 0.9^(poziom−1) / prędkość_serwera · Czasy bazowe są
            przybliżone
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
