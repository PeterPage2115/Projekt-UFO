"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TRIBES, type TribeDef } from "@/lib/game/tribes";

const MAP_SIZE = 401;
const ROF_TRIBE_IDS = [1, 2, 3, 6, 7, 8] as const;

function calcDistance(x1: number, y1: number, x2: number, y2: number): number {
  let dx = Math.abs(x2 - x1);
  let dy = Math.abs(y2 - y1);
  if (dx > MAP_SIZE / 2) dx = MAP_SIZE - dx;
  if (dy > MAP_SIZE / 2) dy = MAP_SIZE - dy;
  return Math.sqrt(dx * dx + dy * dy);
}

function calcTravelTime(distance: number, unitSpeed: number, serverSpeed: number): number {
  if (unitSpeed <= 0) return Infinity;
  return (distance / (unitSpeed * serverSpeed)) * 3600;
}

function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "--:--:--";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const UNIT_TYPE_LABELS: Record<string, string> = {
  inf: "Piechota",
  cav: "Kawaleria",
  siege: "Oblężenie",
  special: "Specjalna",
};

export function DistanceCalculator({ serverSpeed }: { serverSpeed: number }) {
  const [x1, setX1] = useState("");
  const [y1, setY1] = useState("");
  const [x2, setX2] = useState("");
  const [y2, setY2] = useState("");
  const [tribeId, setTribeId] = useState<number>(1);
  const [calculated, setCalculated] = useState(false);

  const tribe: TribeDef | undefined = TRIBES[tribeId];

  const distance = useMemo(() => {
    if (x1 === "" || y1 === "" || x2 === "" || y2 === "") return null;
    return calcDistance(Number(x1), Number(y1), Number(x2), Number(y2));
  }, [x1, y1, x2, y2]);

  const results = useMemo(() => {
    if (distance === null || !tribe) return null;
    return tribe.units.map((unit) => {
      const time = calcTravelTime(distance, unit.speed, serverSpeed);
      return { unit, time };
    });
  }, [distance, tribe, serverSpeed]);

  const slowestIdx = useMemo(() => {
    if (!results) return -1;
    let maxTime = -1;
    let idx = -1;
    results.forEach((r, i) => {
      if (r.unit.unitType !== "special" && r.time > maxTime) {
        maxTime = r.time;
        idx = i;
      }
    });
    return idx;
  }, [results]);

  const handleCalculate = () => {
    setCalculated(true);
  };

  const isValid = x1 !== "" && y1 !== "" && x2 !== "" && y2 !== "";

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      {/* Input panel */}
      <Card>
        <CardHeader>
          <CardTitle>Parametry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* From coords */}
          <div className="space-y-2">
            <Label className="text-xs uppercase text-muted-foreground">Punkt startowy</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="x1" className="text-xs">X</Label>
                <Input
                  id="x1"
                  type="number"
                  min={-200}
                  max={200}
                  placeholder="0"
                  value={x1}
                  onChange={(e) => { setX1(e.target.value); setCalculated(false); }}
                />
              </div>
              <div>
                <Label htmlFor="y1" className="text-xs">Y</Label>
                <Input
                  id="y1"
                  type="number"
                  min={-200}
                  max={200}
                  placeholder="0"
                  value={y1}
                  onChange={(e) => { setY1(e.target.value); setCalculated(false); }}
                />
              </div>
            </div>
          </div>

          {/* To coords */}
          <div className="space-y-2">
            <Label className="text-xs uppercase text-muted-foreground">Punkt docelowy</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="x2" className="text-xs">X</Label>
                <Input
                  id="x2"
                  type="number"
                  min={-200}
                  max={200}
                  placeholder="0"
                  value={x2}
                  onChange={(e) => { setX2(e.target.value); setCalculated(false); }}
                />
              </div>
              <div>
                <Label htmlFor="y2" className="text-xs">Y</Label>
                <Input
                  id="y2"
                  type="number"
                  min={-200}
                  max={200}
                  placeholder="0"
                  value={y2}
                  onChange={(e) => { setY2(e.target.value); setCalculated(false); }}
                />
              </div>
            </div>
          </div>

          {/* Tribe select */}
          <div className="space-y-2">
            <Label htmlFor="tribe" className="text-xs uppercase text-muted-foreground">Plemię</Label>
            <select
              id="tribe"
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              value={tribeId}
              onChange={(e) => { setTribeId(Number(e.target.value)); setCalculated(false); }}
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

          <Button className="w-full" onClick={handleCalculate} disabled={!isValid}>
            Oblicz
          </Button>
        </CardContent>
      </Card>

      {/* Results panel */}
      <Card>
        <CardHeader>
          <CardTitle>Wyniki</CardTitle>
        </CardHeader>
        <CardContent>
          {calculated && distance !== null && results ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">Dystans:</span>
                <span className="font-mono font-bold text-lg">{distance.toFixed(2)}</span>
                <span className="text-muted-foreground">pól</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">Jednostka</th>
                      <th className="py-2 px-3 font-medium text-center">Typ</th>
                      <th className="py-2 px-3 font-medium text-center">Prędkość</th>
                      <th className="py-2 pl-3 font-medium text-right">Czas podróży</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr
                        key={r.unit.name}
                        className={`border-b border-border/50 ${i === slowestIdx ? "bg-destructive/10" : ""}`}
                      >
                        <td className="py-2 pr-3 font-medium">
                          {r.unit.namePl ?? r.unit.name}
                          {i === slowestIdx && (
                            <Badge variant="destructive" className="ml-2 text-[10px]">
                              najwolniejsza
                            </Badge>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="text-xs text-muted-foreground">
                            {UNIT_TYPE_LABELS[r.unit.unitType] ?? r.unit.unitType}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center font-mono">{r.unit.speed}</td>
                        <td className="py-2 pl-3 text-right font-mono">
                          {formatDuration(r.time)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-muted-foreground">
                Prędkość serwera: ×{serverSpeed} · Mapa: {MAP_SIZE}×{MAP_SIZE} (zawijanie krawędzi)
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Wprowadź koordynaty i kliknij &ldquo;Oblicz&rdquo;, aby zobaczyć wyniki.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
