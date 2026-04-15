"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TRIBES, type UnitDef } from "@/lib/game/tribes";

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

function formatDateTime(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function getCountdownColor(ms: number): string {
  if (ms <= 0) return "text-muted-foreground";
  if (ms < 5 * 60 * 1000) return "text-red-500";
  if (ms < 30 * 60 * 1000) return "text-yellow-500";
  return "text-green-500";
}

function getCountdownBadge(ms: number): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  if (ms <= 0) return { label: "Za późno", variant: "outline" };
  if (ms < 5 * 60 * 1000) return { label: "Pilne!", variant: "destructive" };
  if (ms < 30 * 60 * 1000) return { label: "Mało czasu", variant: "secondary" };
  return { label: "OK", variant: "default" };
}

const SPEED_MULTIPLIERS = [
  { label: "Brak (×1)", value: 1 },
  { label: "Mały artefakt (×1.5)", value: 1.5 },
  { label: "Duży artefakt (×2)", value: 2 },
  { label: "Jedyny artefakt (×3)", value: 3 },
];

interface InterceptResult {
  unit: UnitDef;
  distance: number;
  travelSeconds: number;
  sendTime: Date;
  msUntilSend: number;
}

export function InterceptCalculator({ serverSpeed }: { serverSpeed: number }) {
  const [targetX, setTargetX] = useState("");
  const [targetY, setTargetY] = useState("");
  const [landingTime, setLandingTime] = useState("");
  const [defX, setDefX] = useState("");
  const [defY, setDefY] = useState("");
  const [tribeId, setTribeId] = useState<number>(1);
  const [speedBonus, setSpeedBonus] = useState<number>(1);
  const [calculated, setCalculated] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // Live countdown ticker
  useEffect(() => {
    if (!calculated) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [calculated]);

  const tribe = TRIBES[tribeId];

  const results: InterceptResult[] | null = useMemo(() => {
    if (!calculated || targetX === "" || targetY === "" || defX === "" || defY === "" || !landingTime || !tribe) {
      return null;
    }

    const landing = new Date(landingTime);
    if (isNaN(landing.getTime())) return null;

    const distance = calcDistance(Number(targetX), Number(targetY), Number(defX), Number(defY));

    return tribe.units
      .filter((u) => u.unitType !== "special")
      .map((unit) => {
        const effectiveSpeed = unit.speed * speedBonus;
        const travelSeconds = calcTravelTime(distance, effectiveSpeed, serverSpeed);
        const sendTime = new Date(landing.getTime() - travelSeconds * 1000);
        const msUntilSend = sendTime.getTime() - now;
        return { unit, distance, travelSeconds, sendTime, msUntilSend };
      })
      .sort((a, b) => a.sendTime.getTime() - b.sendTime.getTime());
  }, [calculated, targetX, targetY, defX, defY, landingTime, tribe, speedBonus, serverSpeed, now]);

  const handleCalculate = useCallback(() => {
    setCalculated(true);
    setNow(Date.now());
  }, []);

  const isValid = targetX !== "" && targetY !== "" && defX !== "" && defY !== "" && landingTime !== "";

  // Set default landing time to +2 hours from now
  const setDefaultLandingTime = useCallback(() => {
    const d = new Date(Date.now() + 2 * 3600_000);
    const pad = (n: number) => n.toString().padStart(2, "0");
    const val = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setLandingTime(val);
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      {/* Input panel */}
      <Card>
        <CardHeader>
          <CardTitle>Parametry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Target (attacked village) */}
          <div className="space-y-2">
            <Label className="text-xs uppercase text-muted-foreground">Cel ataku (wioska atakowana)</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="tx" className="text-xs">X</Label>
                <Input id="tx" type="number" min={-200} max={200} placeholder="0" value={targetX} onChange={(e) => { setTargetX(e.target.value); setCalculated(false); }} />
              </div>
              <div>
                <Label htmlFor="ty" className="text-xs">Y</Label>
                <Input id="ty" type="number" min={-200} max={200} placeholder="0" value={targetY} onChange={(e) => { setTargetY(e.target.value); setCalculated(false); }} />
              </div>
            </div>
          </div>

          {/* Landing time */}
          <div className="space-y-2">
            <Label htmlFor="landing" className="text-xs uppercase text-muted-foreground">
              Czas uderzenia ataku
            </Label>
            <div className="flex gap-2">
              <Input
                id="landing"
                type="datetime-local"
                step="1"
                value={landingTime}
                onChange={(e) => { setLandingTime(e.target.value); setCalculated(false); }}
                className="flex-1"
              />
              <Button variant="outline" size="sm" onClick={setDefaultLandingTime} title="Za 2 godziny">
                +2h
              </Button>
            </div>
          </div>

          {/* Defense village */}
          <div className="space-y-2">
            <Label className="text-xs uppercase text-muted-foreground">Twoja wioska obronna</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="dx" className="text-xs">X</Label>
                <Input id="dx" type="number" min={-200} max={200} placeholder="0" value={defX} onChange={(e) => { setDefX(e.target.value); setCalculated(false); }} />
              </div>
              <div>
                <Label htmlFor="dy" className="text-xs">Y</Label>
                <Input id="dy" type="number" min={-200} max={200} placeholder="0" value={defY} onChange={(e) => { setDefY(e.target.value); setCalculated(false); }} />
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
                  <option key={tid} value={tid}>{t.emoji} {t.namePl}</option>
                ) : null;
              })}
            </select>
          </div>

          {/* Speed artifact */}
          <div className="space-y-2">
            <Label htmlFor="speed-bonus" className="text-xs uppercase text-muted-foreground">
              Bonus prędkości (artefakt)
            </Label>
            <select
              id="speed-bonus"
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              value={speedBonus}
              onChange={(e) => { setSpeedBonus(Number(e.target.value)); setCalculated(false); }}
            >
              {SPEED_MULTIPLIERS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <Button className="w-full" onClick={handleCalculate} disabled={!isValid}>
            Oblicz czas wysyłki
          </Button>
        </CardContent>
      </Card>

      {/* Results panel */}
      <Card>
        <CardHeader>
          <CardTitle>Wyniki — kiedy wysłać obronę</CardTitle>
        </CardHeader>
        <CardContent>
          {results && results.length > 0 ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="text-muted-foreground">Dystans:</span>
                <span className="font-mono font-bold">{results[0].distance.toFixed(2)} pól</span>
                <span className="text-muted-foreground">Uderzenie:</span>
                <span className="font-mono font-bold">{formatDateTime(new Date(landingTime))}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-2 font-medium">Jednostka</th>
                      <th className="py-2 px-2 font-medium text-center">Prędkość</th>
                      <th className="py-2 px-2 font-medium text-center">Czas podróży</th>
                      <th className="py-2 px-2 font-medium text-center">Czas wysyłki</th>
                      <th className="py-2 pl-2 font-medium text-right">Odliczanie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r) => {
                      const badge = getCountdownBadge(r.msUntilSend);
                      const countdownColor = getCountdownColor(r.msUntilSend);
                      const countdownSeconds = Math.max(0, Math.floor(r.msUntilSend / 1000));

                      return (
                        <tr key={r.unit.name} className="border-b border-border/50">
                          <td className="py-2 pr-2 font-medium">
                            {r.unit.namePl ?? r.unit.name}
                          </td>
                          <td className="py-2 px-2 text-center font-mono">
                            {r.unit.speed}{speedBonus > 1 ? ` (×${speedBonus})` : ""}
                          </td>
                          <td className="py-2 px-2 text-center font-mono">
                            {formatDuration(r.travelSeconds)}
                          </td>
                          <td className="py-2 px-2 text-center font-mono text-xs">
                            {formatDateTime(r.sendTime)}
                          </td>
                          <td className="py-2 pl-2 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className={`font-mono ${countdownColor}`}>
                                {r.msUntilSend <= 0 ? "—" : formatDuration(countdownSeconds)}
                              </span>
                              <Badge variant={badge.variant} className="text-[10px]">
                                {badge.label}
                              </Badge>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-muted-foreground">
                Prędkość serwera: ×{serverSpeed}
                {speedBonus > 1 ? ` · Artefakt: ×${speedBonus}` : ""}
                {" "}· Odliczanie aktualizuje się co sekundę
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Wprowadź koordynaty, czas uderzenia i kliknij &ldquo;Oblicz czas wysyłki&rdquo;.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
