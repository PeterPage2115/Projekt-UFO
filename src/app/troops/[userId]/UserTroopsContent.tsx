"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TroopBreakdown } from "@/components/troops/TroopBreakdown";

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

const TROOP_TYPE_LABELS: Record<string, string> = {
  off: "⚔️ Ofensywa",
  def: "🛡️ Defensywa",
  scout: "👁️ Zwiad",
  siege: "🏗️ Oblężenie",
};

function fmt(n: number): string {
  return n.toLocaleString("pl-PL");
}

export function UserTroopsContent({ userId }: { userId: string }) {
  const [reports, setReports] = useState<TroopReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReports() {
      setLoading(true);
      try {
        const res = await fetch(`/api/troops?userId=${encodeURIComponent(userId)}`);
        if (res.ok) {
          const data = await res.json();
          setReports(data.data ?? []);
        }
      } catch (e) {
        console.error("Failed to fetch user troops:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchReports();
  }, [userId]);

  const handleDelete = async (reportId: string) => {
    if (!confirm("Na pewno usunąć ten raport?")) return;
    setDeleting(reportId);
    try {
      const res = await fetch(`/api/troops/${reportId}`, { method: "DELETE" });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== reportId));
      }
    } catch (e) {
      console.error("Failed to delete report:", e);
    } finally {
      setDeleting(null);
    }
  };

  const userName =
    reports.length > 0
      ? reports[0].displayName || reports[0].username || userId
      : userId;

  // Aggregate user totals
  const totalOff = reports.reduce((s, r) => s + (r.offValue ?? 0), 0);
  const totalInfDef = reports.reduce((s, r) => s + (r.defInfValue ?? 0), 0);
  const totalCavDef = reports.reduce((s, r) => s + (r.defCavValue ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">🪖 Wojska — {userName}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {reports.length} raport{reports.length === 1 ? "" : "ów"}
          </p>
        </div>
        <Link href="/troops">
          <Button variant="outline">← Powrót</Button>
        </Link>
      </div>

      {loading && (
        <div className="text-muted-foreground text-sm">Ładowanie...</div>
      )}

      {/* Summary */}
      {!loading && reports.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                ⚔️ Łączny atak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">{fmt(totalOff)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                🛡️ Obrona piech.
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{fmt(totalInfDef)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                🐴 Obrona kaw.
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{fmt(totalCavDef)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Per-village reports */}
      {!loading && reports.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Brak raportów wojsk dla tego gracza.
          </CardContent>
        </Card>
      )}

      {reports.map((report) => {
        const troopsObj: Record<string, number> = report.troops
          ? JSON.parse(report.troops)
          : {};
        return (
          <Card key={report.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 flex-wrap">
                <span>
                  {report.villageName || `Wioska (${report.villageX}|${report.villageY})`}
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
            <CardContent className="space-y-3">
              <TroopBreakdown
                troops={troopsObj}
                offValue={report.offValue ?? undefined}
                defInfValue={report.defInfValue ?? undefined}
                defCavValue={report.defCavValue ?? undefined}
              />
              {report.notes && (
                <p className="text-xs text-muted-foreground italic">{report.notes}</p>
              )}
              <div className="flex items-center justify-between pt-2">
                {report.reportedAt && (
                  <span className="text-xs text-muted-foreground">
                    Zgłoszono: {new Date(report.reportedAt).toLocaleString("pl-PL")}
                  </span>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deleting === report.id}
                  onClick={() => handleDelete(report.id)}
                >
                  {deleting === report.id ? "Usuwanie..." : "🗑️ Usuń"}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
