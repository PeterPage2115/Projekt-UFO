"use client";

import { TRIBES } from "@/lib/game/tribes";
import { Badge } from "@/components/ui/badge";

interface TroopBreakdownProps {
  troops: Record<string, number>;
  tribeId?: number | null;
  offValue?: number;
  defInfValue?: number;
  defCavValue?: number;
}

function detectTribeFromUnits(unitNames: string[]): number | null {
  for (const [tidStr, tribe] of Object.entries(TRIBES)) {
    const tribeUnitNames = tribe.units.flatMap((u) =>
      [u.name, u.namePl].filter(Boolean),
    );
    if (unitNames.some((name) => tribeUnitNames.includes(name))) {
      return parseInt(tidStr, 10);
    }
  }
  return null;
}

function fmt(n: number): string {
  return n.toLocaleString("pl-PL");
}

export function TroopBreakdown({
  troops,
  tribeId,
  offValue,
  defInfValue,
  defCavValue,
}: TroopBreakdownProps) {
  const resolvedTribeId = tribeId ?? detectTribeFromUnits(Object.keys(troops));
  const tribe = resolvedTribeId ? TRIBES[resolvedTribeId] : null;

  const entries = Object.entries(troops).filter(([, count]) => count > 0);

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Brak jednostek w raporcie.</p>
    );
  }

  return (
    <div className="space-y-3">
      {tribe && (
        <div className="text-xs text-muted-foreground">
          {tribe.emoji} {tribe.namePl}
        </div>
      )}

      <div className="space-y-1">
        {entries.map(([unitName, count]) => {
          const unit = tribe?.units.find(
            (u) => u.name === unitName || u.namePl === unitName,
          );
          const unitAttContrib = unit ? unit.att * count : 0;
          const unitDefInfContrib = unit ? unit.defInf * count : 0;
          const unitDefCavContrib = unit ? unit.defCav * count : 0;

          return (
            <div
              key={unitName}
              className="flex items-center justify-between gap-2 text-sm py-1 border-b border-border/30"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-medium truncate">
                  {unit?.namePl || unit?.name || unitName}
                </span>
                {unit && (
                  <Badge variant="outline" className="text-xs shrink-0">
                    {unit.unitType}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0 text-xs">
                <span className="font-mono">{fmt(count)}</span>
                {unit && (
                  <span className="text-muted-foreground">
                    ⚔️{fmt(unitAttContrib)} 🛡️{fmt(unitDefInfContrib)}/{fmt(unitDefCavContrib)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Totals */}
      {(offValue != null || defInfValue != null || defCavValue != null) && (
        <div className="grid grid-cols-3 gap-2 pt-2 border-t text-center text-xs">
          <div>
            <div className="text-muted-foreground">⚔️ Atak</div>
            <div className="font-bold text-red-400">{fmt(offValue ?? 0)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">🛡️ Piech.</div>
            <div className="font-bold text-blue-400">{fmt(defInfValue ?? 0)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">🐴 Kaw.</div>
            <div className="font-bold text-green-400">{fmt(defCavValue ?? 0)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
