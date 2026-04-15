"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface PerUser {
  userId: string;
  displayName: string;
  totalOff: number;
  totalInfDef: number;
  totalCavDef: number;
  reportCount: number;
}

interface PerTribe {
  tribeId: number;
  tribeName: string;
  playerCount: number;
  totalOff: number;
  totalInfDef: number;
  totalCavDef: number;
}

interface TopHammer {
  id: string;
  userId: string;
  displayName: string;
  villageName: string | null;
  villageX: number | null;
  villageY: number | null;
  offValue: number | null;
  troopType: string | null;
}

interface OverviewData {
  totalOff: number;
  totalInfDef: number;
  totalCavDef: number;
  reportCount: number;
  perUser: PerUser[];
  perTribe: PerTribe[];
  topHammers: TopHammer[];
}

function fmt(n: number): string {
  return n.toLocaleString("pl-PL");
}

export function AllianceArmyOverview({ data }: { data: OverviewData }) {
  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ⚔️ Łączny atak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{fmt(data.totalOff)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              🛡️ Obrona piech.
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{fmt(data.totalInfDef)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              🐴 Obrona kaw.
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{fmt(data.totalCavDef)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              📋 Raportów
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.reportCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 hammers */}
      {data.topHammers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>🔨 Top 5 Hammerów</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-left">
                    <th className="pb-2 pr-4">#</th>
                    <th className="pb-2 pr-4">Gracz</th>
                    <th className="pb-2 pr-4">Wioska</th>
                    <th className="pb-2 pr-4 text-right">⚔️ Atak</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topHammers.map((h, i) => (
                    <tr key={h.id} className="border-b border-border/50">
                      <td className="py-2 pr-4 font-bold text-muted-foreground">{i + 1}</td>
                      <td className="py-2 pr-4">
                        <Link
                          href={`/troops/${h.userId}`}
                          className="text-primary hover:underline"
                        >
                          {h.displayName}
                        </Link>
                      </td>
                      <td className="py-2 pr-4">
                        {h.villageName || `(${h.villageX}|${h.villageY})`}
                      </td>
                      <td className="py-2 text-right font-bold text-red-400">
                        {fmt(h.offValue ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Per-user table */}
      <Card>
        <CardHeader>
          <CardTitle>👥 Raporty wg gracza</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-left">
                  <th className="pb-2 pr-4">Gracz</th>
                  <th className="pb-2 pr-4 text-right">⚔️ Atak</th>
                  <th className="pb-2 pr-4 text-right">🛡️ Piech.</th>
                  <th className="pb-2 pr-4 text-right">🐴 Kaw.</th>
                  <th className="pb-2 text-right">Raporty</th>
                </tr>
              </thead>
              <tbody>
                {data.perUser.map((u) => (
                  <tr key={u.userId} className="border-b border-border/50">
                    <td className="py-2 pr-4">
                      <Link
                        href={`/troops/${u.userId}`}
                        className="text-primary hover:underline"
                      >
                        {u.displayName}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 text-right font-mono text-red-400">
                      {fmt(u.totalOff)}
                    </td>
                    <td className="py-2 pr-4 text-right font-mono text-blue-400">
                      {fmt(u.totalInfDef)}
                    </td>
                    <td className="py-2 pr-4 text-right font-mono text-green-400">
                      {fmt(u.totalCavDef)}
                    </td>
                    <td className="py-2 text-right">{u.reportCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Per-tribe breakdown */}
      {data.perTribe.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>🏰 Raporty wg plemienia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-left">
                    <th className="pb-2 pr-4">Plemię</th>
                    <th className="pb-2 pr-4 text-right">Graczy</th>
                    <th className="pb-2 pr-4 text-right">⚔️ Atak</th>
                    <th className="pb-2 pr-4 text-right">🛡️ Piech.</th>
                    <th className="pb-2 text-right">🐴 Kaw.</th>
                  </tr>
                </thead>
                <tbody>
                  {data.perTribe.map((t) => (
                    <tr key={t.tribeId} className="border-b border-border/50">
                      <td className="py-2 pr-4">{t.tribeName}</td>
                      <td className="py-2 pr-4 text-right">{t.playerCount}</td>
                      <td className="py-2 pr-4 text-right font-mono text-red-400">
                        {fmt(t.totalOff)}
                      </td>
                      <td className="py-2 pr-4 text-right font-mono text-blue-400">
                        {fmt(t.totalInfDef)}
                      </td>
                      <td className="py-2 text-right font-mono text-green-400">
                        {fmt(t.totalCavDef)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
