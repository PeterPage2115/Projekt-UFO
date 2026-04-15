"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TRIBE_NAMES } from "@/lib/game/constants";
import { TRIBES } from "@/lib/game/tribes";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Player {
  uid: number;
  name: string;
  tid: number | null;
  aid: number | null;
  allianceName: string | null;
  totalPop: number | null;
  villageCount: number | null;
  firstSeenAt: string | null;
  lastUpdatedAt: string | null;
}

interface Alliance {
  aid: number;
  name: string;
  memberCount: number | null;
  totalPop: number | null;
  firstSeenAt: string | null;
  lastUpdatedAt: string | null;
}

interface Village {
  id: number;
  x: number;
  y: number;
  name: string | null;
  playerName: string | null;
  allianceName: string | null;
  tid: number | null;
  aid: number | null;
  population: number | null;
  uid: number | null;
  isCapital: number | null;
  isCity: number | null;
  region: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type TabId = "players" | "alliances" | "villages";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function tribeEmoji(tid: number | null): string {
  if (!tid) return "";
  return TRIBES[tid]?.emoji || "";
}

function tribeName(tid: number | null): string {
  if (!tid) return "—";
  return TRIBE_NAMES[tid]?.pl || "?";
}

function exportToCsv(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers
      .map((h) => {
        const val = row[h];
        if (val == null) return "";
        const str = String(val);
        return str.includes(",") || str.includes('"')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      })
      .join(","),
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/*  SortHeader                                                         */
/* ------------------------------------------------------------------ */

function SortHeader({
  label,
  field,
  currentSort,
  currentOrder,
  onSort,
}: {
  label: string;
  field: string;
  currentSort: string;
  currentOrder: string;
  onSort: (field: string) => void;
}) {
  const isActive = currentSort === field;
  return (
    <th
      className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground select-none"
      onClick={() => onSort(field)}
    >
      {label}{" "}
      {isActive ? (currentOrder === "asc" ? "↑" : "↓") : ""}
    </th>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function DataBrowser() {
  const [tab, setTab] = useState<TabId>("players");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("totalPop");
  const [order, setOrder] = useState("desc");

  // Data stores
  const [players, setPlayers] = useState<Player[]>([]);
  const [alliances, setAlliances] = useState<Alliance[]>([]);
  const [villagesData, setVillagesData] = useState<Village[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);

  // Expanded row detail
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedData, setExpandedData] = useState<
    Player[] | Village[] | null
  >(null);
  const [expandedLoading, setExpandedLoading] = useState(false);

  // Default sort per tab
  const defaultSorts: Record<TabId, string> = {
    players: "totalPop",
    alliances: "totalPop",
    villages: "population",
  };

  const handleTabChange = (newTab: TabId) => {
    setTab(newTab);
    setSearch("");
    setPage(1);
    setSort(defaultSorts[newTab]);
    setOrder("desc");
    setExpandedId(null);
    setExpandedData(null);
  };

  const handleSort = useCallback(
    (field: string) => {
      if (sort === field) {
        setOrder((o) => (o === "asc" ? "desc" : "asc"));
      } else {
        setSort(field);
        setOrder("desc");
      }
      setPage(1);
    },
    [sort],
  );

  // Fetch data
  useEffect(() => {
    setLoading(true);
    setExpandedId(null);
    setExpandedData(null);

    const params = new URLSearchParams({
      search,
      sort,
      order,
      page: String(page),
      limit: tab === "villages" ? "100" : "50",
    });

    const endpoint =
      tab === "players"
        ? "/api/players"
        : tab === "alliances"
          ? "/api/alliances"
          : "/api/villages";

    fetch(`${endpoint}?${params}`)
      .then((r) => r.json())
      .then((json) => {
        if (tab === "players") setPlayers(json.data || []);
        else if (tab === "alliances") setAlliances(json.data || []);
        else setVillagesData(json.data || []);
        setPagination(
          json.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 },
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tab, search, sort, order, page]);

  // Expand player → show their villages
  const expandPlayer = (uid: number) => {
    if (expandedId === uid) {
      setExpandedId(null);
      setExpandedData(null);
      return;
    }
    setExpandedId(uid);
    setExpandedLoading(true);
    fetch(`/api/villages?uid=${uid}&limit=200&sort=population&order=desc`)
      .then((r) => r.json())
      .then((json) => {
        setExpandedData(json.data || []);
        setExpandedLoading(false);
      })
      .catch(() => setExpandedLoading(false));
  };

  // Expand alliance → show their members
  const expandAlliance = (aid: number) => {
    if (expandedId === aid) {
      setExpandedId(null);
      setExpandedData(null);
      return;
    }
    setExpandedId(aid);
    setExpandedLoading(true);
    fetch(`/api/players?aid=${aid}&limit=100&sort=totalPop&order=desc`)
      .then((r) => r.json())
      .then((json) => {
        setExpandedData(json.data || []);
        setExpandedLoading(false);
      })
      .catch(() => setExpandedLoading(false));
  };

  // CSV export
  const handleExport = () => {
    if (tab === "players") {
      exportToCsv(
        players.map((p) => ({
          Nazwa: p.name,
          Plemię: tribeName(p.tid),
          Sojusz: p.allianceName || "",
          Populacja: p.totalPop ?? 0,
          Wioski: p.villageCount ?? 0,
        })),
        "gracze.csv",
      );
    } else if (tab === "alliances") {
      exportToCsv(
        alliances.map((a) => ({
          Nazwa: a.name,
          Członkowie: a.memberCount ?? 0,
          Populacja: a.totalPop ?? 0,
        })),
        "sojusze.csv",
      );
    } else {
      exportToCsv(
        villagesData.map((v) => ({
          Nazwa: v.name || "",
          Gracz: v.playerName || "",
          Sojusz: v.allianceName || "",
          X: v.x,
          Y: v.y,
          Populacja: v.population ?? 0,
          Plemię: tribeName(v.tid),
        })),
        "wioski.csv",
      );
    }
  };

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">🔍 Wyszukiwarka</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Przeglądaj graczy, sojusze i wioski
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {(
          [
            ["players", "👤 Gracze"],
            ["alliances", "🏛️ Sojusze"],
            ["villages", "🏘️ Wioski"],
          ] as [TabId, string][]
        ).map(([id, label]) => (
          <Button
            key={id}
            variant={tab === id ? "default" : "outline"}
            size="sm"
            onClick={() => handleTabChange(id)}
          >
            {label}
          </Button>
        ))}

        <div className="flex-1" />

        <Button variant="outline" size="sm" onClick={handleExport}>
          📥 Eksport CSV
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder={
          tab === "players"
            ? "Szukaj gracza..."
            : tab === "alliances"
              ? "Szukaj sojuszu..."
              : "Szukaj wioski, gracza lub sojuszu..."
        }
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        className="max-w-md"
      />

      {/* Data table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                Ładowanie...
              </div>
            ) : tab === "players" ? (
              <PlayersTable
                data={players}
                sort={sort}
                order={order}
                onSort={handleSort}
                expandedId={expandedId}
                expandedData={expandedData as Village[] | null}
                expandedLoading={expandedLoading}
                onExpand={expandPlayer}
              />
            ) : tab === "alliances" ? (
              <AlliancesTable
                data={alliances}
                sort={sort}
                order={order}
                onSort={handleSort}
                expandedId={expandedId}
                expandedData={expandedData as Player[] | null}
                expandedLoading={expandedLoading}
                onExpand={expandAlliance}
              />
            ) : (
              <VillagesTable
                data={villagesData}
                sort={sort}
                order={order}
                onSort={handleSort}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground">
            Strona {pagination.page} z {pagination.totalPages} (
            {pagination.total.toLocaleString()} wyników)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Poprzednia
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Następna →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Players Table                                                      */
/* ------------------------------------------------------------------ */

function PlayersTable({
  data,
  sort,
  order,
  onSort,
  expandedId,
  expandedData,
  expandedLoading,
  onExpand,
}: {
  data: Player[];
  sort: string;
  order: string;
  onSort: (f: string) => void;
  expandedId: number | null;
  expandedData: Village[] | null;
  expandedLoading: boolean;
  onExpand: (uid: number) => void;
}) {
  if (data.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Brak wyników
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead className="border-b bg-muted/50">
        <tr>
          <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground w-10">
            #
          </th>
          <SortHeader
            label="Gracz"
            field="name"
            currentSort={sort}
            currentOrder={order}
            onSort={onSort}
          />
          <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
            Plemię
          </th>
          <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
            Sojusz
          </th>
          <SortHeader
            label="Populacja"
            field="totalPop"
            currentSort={sort}
            currentOrder={order}
            onSort={onSort}
          />
          <SortHeader
            label="Wioski"
            field="villageCount"
            currentSort={sort}
            currentOrder={order}
            onSort={onSort}
          />
        </tr>
      </thead>
      <tbody className="divide-y">
        {data.map((p, i) => (
          <>
            <tr
              key={p.uid}
              className="hover:bg-muted/30 cursor-pointer transition-colors"
              onClick={() => onExpand(p.uid)}
            >
              <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
              <td className="px-3 py-2 font-medium">
                {tribeEmoji(p.tid)} {p.name}
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {tribeName(p.tid)}
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
                {(p.totalPop ?? 0).toLocaleString()}
              </td>
              <td className="px-3 py-2 font-mono">{p.villageCount ?? 0}</td>
            </tr>
            {expandedId === p.uid && (
              <tr key={`exp-${p.uid}`}>
                <td colSpan={6} className="bg-muted/20 px-6 py-3">
                  <PlayerDetail
                    player={p}
                    villages={expandedData}
                    loading={expandedLoading}
                  />
                </td>
              </tr>
            )}
          </>
        ))}
      </tbody>
    </table>
  );
}

function PlayerDetail({
  player,
  villages,
  loading,
}: {
  player: Player;
  villages: Village[] | null;
  loading: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="font-medium text-lg">
          {tribeEmoji(player.tid)} {player.name}
        </span>
        <Badge variant="outline">{tribeName(player.tid)}</Badge>
        {player.allianceName && (
          <Badge variant="secondary">{player.allianceName}</Badge>
        )}
        <span className="text-muted-foreground">
          Pop: {(player.totalPop ?? 0).toLocaleString()} · Wioski:{" "}
          {player.villageCount ?? 0}
        </span>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-xs">Ładowanie wiosek...</p>
      ) : villages && villages.length > 0 ? (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b">
              <th className="px-2 py-1 text-left">Wioska</th>
              <th className="px-2 py-1 text-left">Koordynaty</th>
              <th className="px-2 py-1 text-left">Populacja</th>
              <th className="px-2 py-1 text-left">Region</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {villages.map((v, i) => (
              <tr key={i} className="hover:bg-muted/20">
                <td className="px-2 py-1">
                  {v.name || "—"}
                  {v.isCapital ? " ⭐" : ""}
                  {v.isCity ? " 🏙️" : ""}
                </td>
                <td className="px-2 py-1 font-mono">
                  ({v.x}|{v.y})
                </td>
                <td className="px-2 py-1 font-mono">
                  {(v.population ?? 0).toLocaleString()}
                </td>
                <td className="px-2 py-1 text-muted-foreground">
                  {v.region || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-muted-foreground text-xs">Brak wiosek</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Alliances Table                                                    */
/* ------------------------------------------------------------------ */

function AlliancesTable({
  data,
  sort,
  order,
  onSort,
  expandedId,
  expandedData,
  expandedLoading,
  onExpand,
}: {
  data: Alliance[];
  sort: string;
  order: string;
  onSort: (f: string) => void;
  expandedId: number | null;
  expandedData: Player[] | null;
  expandedLoading: boolean;
  onExpand: (aid: number) => void;
}) {
  if (data.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Brak wyników
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead className="border-b bg-muted/50">
        <tr>
          <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground w-10">
            #
          </th>
          <SortHeader
            label="Sojusz"
            field="name"
            currentSort={sort}
            currentOrder={order}
            onSort={onSort}
          />
          <SortHeader
            label="Członkowie"
            field="memberCount"
            currentSort={sort}
            currentOrder={order}
            onSort={onSort}
          />
          <SortHeader
            label="Populacja"
            field="totalPop"
            currentSort={sort}
            currentOrder={order}
            onSort={onSort}
          />
        </tr>
      </thead>
      <tbody className="divide-y">
        {data.map((a, i) => (
          <>
            <tr
              key={a.aid}
              className="hover:bg-muted/30 cursor-pointer transition-colors"
              onClick={() => onExpand(a.aid)}
            >
              <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
              <td className="px-3 py-2 font-medium">🏛️ {a.name}</td>
              <td className="px-3 py-2 font-mono">
                {(a.memberCount ?? 0).toLocaleString()}
              </td>
              <td className="px-3 py-2 font-mono">
                {(a.totalPop ?? 0).toLocaleString()}
              </td>
            </tr>
            {expandedId === a.aid && (
              <tr key={`exp-${a.aid}`}>
                <td colSpan={4} className="bg-muted/20 px-6 py-3">
                  <AllianceDetail
                    alliance={a}
                    members={expandedData}
                    loading={expandedLoading}
                  />
                </td>
              </tr>
            )}
          </>
        ))}
      </tbody>
    </table>
  );
}

function AllianceDetail({
  alliance,
  members,
  loading,
}: {
  alliance: Alliance;
  members: Player[] | null;
  loading: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-sm">
        <span className="font-medium text-lg">🏛️ {alliance.name}</span>
        <span className="text-muted-foreground">
          Członkowie: {(alliance.memberCount ?? 0).toLocaleString()} · Pop:{" "}
          {(alliance.totalPop ?? 0).toLocaleString()}
        </span>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-xs">
          Ładowanie członków...
        </p>
      ) : members && members.length > 0 ? (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b">
              <th className="px-2 py-1 text-left">#</th>
              <th className="px-2 py-1 text-left">Gracz</th>
              <th className="px-2 py-1 text-left">Plemię</th>
              <th className="px-2 py-1 text-left">Populacja</th>
              <th className="px-2 py-1 text-left">Wioski</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {members.map((m, i) => (
              <tr key={m.uid} className="hover:bg-muted/20">
                <td className="px-2 py-1 text-muted-foreground">{i + 1}</td>
                <td className="px-2 py-1 font-medium">
                  {tribeEmoji(m.tid)} {m.name}
                </td>
                <td className="px-2 py-1">{tribeName(m.tid)}</td>
                <td className="px-2 py-1 font-mono">
                  {(m.totalPop ?? 0).toLocaleString()}
                </td>
                <td className="px-2 py-1 font-mono">
                  {m.villageCount ?? 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-muted-foreground text-xs">Brak członków</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Villages Table                                                     */
/* ------------------------------------------------------------------ */

function VillagesTable({
  data,
  sort,
  order,
  onSort,
}: {
  data: Village[];
  sort: string;
  order: string;
  onSort: (f: string) => void;
}) {
  if (data.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Brak wyników
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead className="border-b bg-muted/50">
        <tr>
          <SortHeader
            label="Wioska"
            field="name"
            currentSort={sort}
            currentOrder={order}
            onSort={onSort}
          />
          <SortHeader
            label="Gracz"
            field="playerName"
            currentSort={sort}
            currentOrder={order}
            onSort={onSort}
          />
          <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
            Sojusz
          </th>
          <SortHeader
            label="Koordynaty"
            field="x"
            currentSort={sort}
            currentOrder={order}
            onSort={onSort}
          />
          <SortHeader
            label="Populacja"
            field="population"
            currentSort={sort}
            currentOrder={order}
            onSort={onSort}
          />
          <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
            Plemię
          </th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {data.map((v, i) => (
          <tr key={`${v.x}-${v.y}-${i}`} className="hover:bg-muted/30">
            <td className="px-3 py-2">
              {v.name || "—"}
              {v.isCapital ? " ⭐" : ""}
              {v.isCity ? " 🏙️" : ""}
            </td>
            <td className="px-3 py-2 font-medium">
              {tribeEmoji(v.tid)} {v.playerName || "—"}
            </td>
            <td className="px-3 py-2">
              {v.allianceName ? (
                <Badge variant="secondary" className="text-xs">
                  {v.allianceName}
                </Badge>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </td>
            <td className="px-3 py-2 font-mono">
              ({v.x}|{v.y})
            </td>
            <td className="px-3 py-2 font-mono">
              {(v.population ?? 0).toLocaleString()}
            </td>
            <td className="px-3 py-2 text-muted-foreground">
              {tribeName(v.tid)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
