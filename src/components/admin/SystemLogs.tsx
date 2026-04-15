"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type LogEntry = {
  id: number;
  level: string;
  category: string;
  message: string;
  details: string | null;
  userId: string | null;
  createdAt: string;
};

const levelColors: Record<string, "default" | "secondary" | "destructive"> = {
  info: "default",
  warn: "secondary",
  error: "destructive",
};

const categoryLabels: Record<string, string> = {
  auth: "Autoryzacja",
  map_sql: "Map SQL",
  operation: "Operacje",
  defense: "Obrona",
  system: "System",
};

export function SystemLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pageSize = 50;

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (level !== "all") params.set("level", level);
      if (category !== "all") params.set("category", category);
      params.set("limit", String(pageSize));
      params.set("offset", String(page * pageSize));

      const res = await fetch(`/api/admin/logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setTotal(data.total);
      }
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  }, [level, category, page]);

  useEffect(() => {
    setLoading(true);
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchLogs, 30000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, fetchLogs]);

  const totalPages = Math.ceil(total / pageSize);

  function parseDetails(details: string | null): string {
    if (!details) return "";
    try {
      return JSON.stringify(JSON.parse(details), null, 2);
    } catch {
      return details;
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtry</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 items-center">
          <Select value={level} onValueChange={(v) => { setLevel(v ?? "all"); setPage(0); }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Poziom" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warn">Warn</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>

          <Select value={category} onValueChange={(v) => { setCategory(v ?? "all"); setPage(0); }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Kategoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie</SelectItem>
              <SelectItem value="auth">Autoryzacja</SelectItem>
              <SelectItem value="map_sql">Map SQL</SelectItem>
              <SelectItem value="operation">Operacje</SelectItem>
              <SelectItem value="defense">Obrona</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? "⏸ Auto-refresh ON" : "▶ Auto-refresh OFF"}
          </Button>

          <Button variant="outline" size="sm" onClick={fetchLogs}>
            🔄 Odśwież
          </Button>

          <span className="text-xs text-muted-foreground ml-auto">
            {total} logów
          </span>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              Ładowanie...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Czas</TableHead>
                    <TableHead className="w-[80px]">Poziom</TableHead>
                    <TableHead className="w-[120px]">Kategoria</TableHead>
                    <TableHead>Wiadomość</TableHead>
                    <TableHead className="w-[100px]">User ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Brak logów
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <>
                        <TableRow
                          key={log.id}
                          className="cursor-pointer hover:bg-accent/50"
                          onClick={() =>
                            setExpandedId(expandedId === log.id ? null : log.id)
                          }
                        >
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(log.createdAt).toLocaleString("pl-PL")}
                          </TableCell>
                          <TableCell>
                            <Badge variant={levelColors[log.level] || "default"} className="text-[10px]">
                              {log.level}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">
                              {categoryLabels[log.category] || log.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{log.message}</TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono">
                            {log.userId ? log.userId.slice(0, 8) + "…" : "—"}
                          </TableCell>
                        </TableRow>
                        {expandedId === log.id && log.details && (
                          <TableRow key={`${log.id}-details`}>
                            <TableCell colSpan={5} className="bg-muted/50">
                              <pre className="text-xs whitespace-pre-wrap font-mono p-2 max-h-60 overflow-auto">
                                {parseDetails(log.details)}
                              </pre>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            ← Poprzednia
          </Button>
          <span className="text-sm text-muted-foreground">
            Strona {page + 1} z {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(page + 1)}
          >
            Następna →
          </Button>
        </div>
      )}
    </div>
  );
}
