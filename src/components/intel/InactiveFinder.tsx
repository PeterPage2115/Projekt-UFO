"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TRIBE_NAMES } from "@/lib/game/constants";
import { TRIBES } from "@/lib/game/tribes";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface InactiveVillage {
  x: number;
  y: number;
  name: string | null;
  population: number | null;
}

interface InactivePlayer {
  uid: number;
  playerName: string | null;
  allianceName: string | null;
  tid: number | null;
  aid: number | null;
  totalPop: number;
  villageCount: number;
  distance: number | null;
  villages: InactiveVillage[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function tribeLabel(tid: number | null): string {
  if (!tid) return "—";
  const emoji = TRIBES[tid]?.emoji || "";
  const name = TRIBE_NAMES[tid]?.pl || "?";
  return `${emoji} ${name}`;
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function InactiveFinder() {
  // Form state
  const [fromX, setFromX] = useState("");
  const [fromY, setFromY] = useState("");
  const [maxDistance, setMaxDistance] = useState("");
  const [maxPop, setMaxPop] = useState("");
  const [minVillages, setMinVillages] = useState("");

  // Results
  const [results, setResults] = useState<InactivePlayer[]>([]);
  const [meta, setMeta] = useState<{
    earliestSnapshotId: number;
    latestSnapshotId: number;
    totalInactive: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState<"distance" | "totalPop">(
    "distance",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Expanded row
  const [expandedUid, setExpandedUid] = useState<number | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setSearched(true);
    setExpandedUid(null);

    const params = new URLSearchParams({ limit: "200" });
    if (fromX) params.set("fromX", fromX);
    if (fromY) params.set("fromY", fromY);
    if (maxDistance) params.set("maxDistance", maxDistance);
    if (maxPop) params.set("maxPop", maxPop);
    if (minVillages) params.set("minVillages", minVillages);

    try {
      const res = await fetch(`/api/inactive?${params}`);
      const json = await res.json();

      if (json.error) {
        setError(json.error);
        setResults([]);
        setMeta(null);
      } else {
        setResults(json.data || []);
        setMeta(json.meta || null);
      }
    } catch {
      setError("Błąd połączenia z serwerem");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Sort results
  const sorted = [...results].sort((a, b) => {
    let cmp = 0;
    if (sortField === "distance") {
      cmp = (a.distance ?? 9999) - (b.distance ?? 9999);
    } else {
      cmp = a.totalPop - b.totalPop;
    }
    return sortOrder === "asc" ? cmp : -cmp;
  });

  const handleSortToggle = (field: "distance" | "totalPop") => {
    if (sortField === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">💤 Wyszukiwarka nieaktywnych</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gracze, których populacja i liczba wiosek nie zmieniły się między
          snapshotami
        </p>
      </div>

      {/* Search form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtry wyszukiwania</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Centrum X
              </label>
              <Input
                type="number"
                placeholder="np. 0"
                value={fromX}
                onChange={(e) => setFromX(e.target.value)}
                className="h-8 text-sm"
                min={-200}
                max={200}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Centrum Y
              </label>
              <Input
                type="number"
                placeholder="np. 0"
                value={fromY}
                onChange={(e) => setFromY(e.target.value)}
                className="h-8 text-sm"
                min={-200}
                max={200}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Max dystans
              </label>
              <Input
                type="number"
                placeholder="np. 50"
                value={maxDistance}
                onChange={(e) => setMaxDistance(e.target.value)}
                className="h-8 text-sm"
                min={0}
                max={400}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Max populacja
              </label>
              <Input
                type="number"
                placeholder="np. 500"
                value={maxPop}
                onChange={(e) => setMaxPop(e.target.value)}
                className="h-8 text-sm"
                min={0}
                max={100000}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Min wiosek
              </label>
              <Input
                type="number"
                placeholder="np. 1"
                value={minVillages}
                onChange={(e) => setMinVillages(e.target.value)}
                className="h-8 text-sm"
                min={0}
                max={100}
              />
            </div>
            <div>
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="w-full h-8"
                size="sm"
              >
                {loading ? "Szukam..." : "🔍 Szukaj"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Meta info */}
      {meta && (
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>
            Snapshot: #{meta.earliestSnapshotId} → #{meta.latestSnapshotId}
          </span>
          <span>Znaleziono: {meta.totalInactive} nieaktywnych</span>
        </div>
      )}

      {/* Results */}
      {searched && !error && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              {sorted.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  {loading
                    ? "Szukam nieaktywnych graczy..."
                    : "Brak wyników — spróbuj zmienić filtry"}
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground w-10">
                        #
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                        Gracz
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                        Plemię
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                        Sojusz
                      </th>
                      <th
                        className="px-3 py-2 text-left text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                        onClick={() => handleSortToggle("totalPop")}
                      >
                        Populacja{" "}
                        {sortField === "totalPop"
                          ? sortOrder === "asc"
                            ? "↑"
                            : "↓"
                          : ""}
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                        Wioski
                      </th>
                      {fromX && fromY && (
                        <th
                          className="px-3 py-2 text-left text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                          onClick={() => handleSortToggle("distance")}
                        >
                          Dystans{" "}
                          {sortField === "distance"
                            ? sortOrder === "asc"
                              ? "↑"
                              : "↓"
                            : ""}
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {sorted.map((p, i) => (
                      <>
                        <tr
                          key={p.uid}
                          className="hover:bg-muted/30 cursor-pointer transition-colors"
                          onClick={() =>
                            setExpandedUid(
                              expandedUid === p.uid ? null : p.uid,
                            )
                          }
                        >
                          <td className="px-3 py-2 text-muted-foreground">
                            {i + 1}
                          </td>
                          <td className="px-3 py-2 font-medium">
                            {p.playerName || "—"}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground text-xs">
                            {tribeLabel(p.tid)}
                          </td>
                          <td className="px-3 py-2">
                            {p.allianceName ? (
                              <Badge variant="secondary" className="text-xs">
                                {p.allianceName}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2 font-mono">
                            {p.totalPop.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 font-mono">
                            {p.villageCount}
                          </td>
                          {fromX && fromY && (
                            <td className="px-3 py-2 font-mono">
                              {p.distance !== null ? p.distance.toFixed(1) : "—"}
                            </td>
                          )}
                        </tr>
                        {expandedUid === p.uid && (
                          <tr key={`exp-${p.uid}`}>
                            <td
                              colSpan={fromX && fromY ? 7 : 6}
                              className="bg-muted/20 px-6 py-3"
                            >
                              <div className="space-y-2">
                                <p className="text-xs font-medium">
                                  Wioski gracza {p.playerName}:
                                </p>
                                {p.villages.length > 0 ? (
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="border-b">
                                        <th className="px-2 py-1 text-left">
                                          Wioska
                                        </th>
                                        <th className="px-2 py-1 text-left">
                                          Koordynaty
                                        </th>
                                        <th className="px-2 py-1 text-left">
                                          Populacja
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                      {p.villages.map((v, vi) => (
                                        <tr
                                          key={vi}
                                          className="hover:bg-muted/20"
                                        >
                                          <td className="px-2 py-1">
                                            {v.name || "—"}
                                          </td>
                                          <td className="px-2 py-1 font-mono">
                                            ({v.x}|{v.y})
                                          </td>
                                          <td className="px-2 py-1 font-mono">
                                            {(v.population ?? 0).toLocaleString()}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                ) : (
                                  <p className="text-muted-foreground text-xs">
                                    Brak danych o wioskach
                                  </p>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
