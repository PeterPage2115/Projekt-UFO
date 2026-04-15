"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { AllianceArmyOverview } from "@/components/troops/AllianceArmyOverview";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TroopBreakdown } from "@/components/troops/TroopBreakdown";

function canViewTroopsClient(role: string): boolean {
  return ["admin", "leader", "officer"].includes(role);
}

interface TroopReport {
  id: string;
  userId: string;
  villageX: number | null;
  villageY: number | null;
  villageName: string | null;
  troopType: string | null;
  troops: string | null;
  offValue: number | null;
  defInfValue: number | null;
  defCavValue: number | null;
  reportedAt: string | null;
  notes: string | null;
  displayName: string | null;
  username: string | null;
}

interface OverviewData {
  totalOff: number;
  totalInfDef: number;
  totalCavDef: number;
  reportCount: number;
  perUser: Array<{
    userId: string;
    displayName: string;
    totalOff: number;
    totalInfDef: number;
    totalCavDef: number;
    reportCount: number;
  }>;
  perTribe: Array<{
    tribeId: number;
    tribeName: string;
    playerCount: number;
    totalOff: number;
    totalInfDef: number;
    totalCavDef: number;
  }>;
  topHammers: Array<{
    id: string;
    userId: string;
    displayName: string;
    villageName: string | null;
    villageX: number | null;
    villageY: number | null;
    offValue: number | null;
    troopType: string | null;
  }>;
}

const TROOP_TYPE_LABELS: Record<string, string> = {
  off: "⚔️ Ofensywa",
  def: "🛡️ Defensywa",
  scout: "👁️ Zwiad",
  siege: "🏗️ Oblężenie",
};

function fmt(n: number): string {
  return n.toLocaleString("pl-PL");
}

export function TroopsPageContent() {
  const { data: session } = useSession();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [myReports, setMyReports] = useState<TroopReport[]>([]);
  const [loading, setLoading] = useState(true);

  const role = (session?.user as { role?: string } | undefined)?.role;
  const isOfficer = role ? canViewTroopsClient(role) : false;

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        if (isOfficer) {
          const res = await fetch("/api/troops/overview");
          if (res.ok) setOverview(await res.json());
        }

        // Fetch own reports
        const myRes = await fetch("/api/troops");
        if (myRes.ok) {
          const data = await myRes.json();
          setMyReports(data.data ?? []);
        }
      } catch (e) {
        console.error("Failed to fetch troops data:", e);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user) fetchData();
  }, [session, isOfficer]);

  if (!session?.user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">🪖 Raporty wojsk</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isOfficer
              ? "Przegląd armii sojuszu"
              : "Twoje zgłoszone wojska"}
          </p>
        </div>
        <Link href="/troops/report">
          <Button>➕ Zgłoś wojska</Button>
        </Link>
      </div>

      {loading && (
        <div className="text-muted-foreground text-sm">Ładowanie...</div>
      )}

      {/* Officers: Alliance overview */}
      {isOfficer && overview && <AllianceArmyOverview data={overview} />}

      {/* Own reports */}
      {!isOfficer && !loading && (
        <div className="space-y-4">
          {myReports.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <p>Nie masz jeszcze żadnych raportów wojsk.</p>
                <Link href="/troops/report">
                  <Button className="mt-4">Zgłoś pierwsze wojska</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            myReports.map((report) => {
              const troopsObj: Record<string, number> = report.troops
                ? JSON.parse(report.troops)
                : {};
              return (
                <Card key={report.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span>
                        {report.villageName || `(${report.villageX}|${report.villageY})`}
                      </span>
                      <Badge variant="outline">
                        ({report.villageX}|{report.villageY})
                      </Badge>
                      {report.troopType && (
                        <Badge variant="secondary">
                          {TROOP_TYPE_LABELS[report.troopType] ?? report.troopType}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TroopBreakdown
                      troops={troopsObj}
                      offValue={report.offValue ?? undefined}
                      defInfValue={report.defInfValue ?? undefined}
                      defCavValue={report.defCavValue ?? undefined}
                    />
                    {report.notes && (
                      <p className="mt-2 text-xs text-muted-foreground italic">
                        {report.notes}
                      </p>
                    )}
                    {report.reportedAt && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Zgłoszono: {new Date(report.reportedAt).toLocaleString("pl-PL")}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
