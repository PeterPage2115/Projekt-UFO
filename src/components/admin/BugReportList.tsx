"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

type BugReport = {
  id: string;
  title: string;
  description: string | null;
  steps: string | null;
  priority: string;
  status: string;
  page: string | null;
  reportedBy: string | null;
  resolvedBy: string | null;
  adminNotes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  reporterName: string | null;
};

const priorityColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  low: "outline",
  medium: "secondary",
  high: "default",
  critical: "destructive",
};

const statusLabels: Record<string, string> = {
  new: "Nowy",
  in_progress: "W trakcie",
  resolved: "Rozwiązany",
  closed: "Zamknięty",
  wont_fix: "Nie naprawię",
};

const priorityLabels: Record<string, string> = {
  low: "Niski",
  medium: "Średni",
  high: "Wysoki",
  critical: "Krytyczny",
};

export function BugReportList() {
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<BugReport | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");

  const fetchReports = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (priorityFilter !== "all") params.set("priority", priorityFilter);

      const res = await fetch(`/api/bugs?${params}`);
      if (res.ok) {
        setReports(await res.json());
      }
    } catch (err) {
      console.error("Error fetching bug reports:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    setLoading(true);
    fetchReports();
  }, [fetchReports]);

  function openReport(report: BugReport) {
    setSelectedReport(report);
    setAdminNotes(report.adminNotes || "");
    setNewStatus(report.status);
  }

  async function handleUpdate() {
    if (!selectedReport) return;

    const res = await fetch(`/api/bugs/${selectedReport.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: newStatus,
        adminNotes,
      }),
    });

    if (res.ok) {
      setSelectedReport(null);
      fetchReports();
    } else {
      const data = await res.json();
      alert(data.error || "Błąd");
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
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie statusy</SelectItem>
              <SelectItem value="new">Nowy</SelectItem>
              <SelectItem value="in_progress">W trakcie</SelectItem>
              <SelectItem value="resolved">Rozwiązany</SelectItem>
              <SelectItem value="closed">Zamknięty</SelectItem>
              <SelectItem value="wont_fix">Nie naprawię</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v ?? "all")}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Priorytet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie priorytety</SelectItem>
              <SelectItem value="low">Niski</SelectItem>
              <SelectItem value="medium">Średni</SelectItem>
              <SelectItem value="high">Wysoki</SelectItem>
              <SelectItem value="critical">Krytyczny</SelectItem>
            </SelectContent>
          </Select>

          <span className="text-xs text-muted-foreground ml-auto">
            {reports.length} zgłoszeń
          </span>
        </CardContent>
      </Card>

      {/* Reports Table */}
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
                    <TableHead>Tytuł</TableHead>
                    <TableHead className="w-[100px]">Priorytet</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="w-[120px]">Zgłosił</TableHead>
                    <TableHead className="w-[100px]">Strona</TableHead>
                    <TableHead className="w-[160px]">Data</TableHead>
                    <TableHead className="w-[80px]">Akcja</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        Brak zgłoszeń
                      </TableCell>
                    </TableRow>
                  ) : (
                    reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.title}</TableCell>
                        <TableCell>
                          <Badge variant={priorityColors[report.priority] || "outline"} className="text-[10px]">
                            {priorityLabels[report.priority] || report.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {statusLabels[report.status] || report.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {report.reporterName || "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {report.page || "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {report.createdAt
                            ? new Date(report.createdAt).toLocaleString("pl-PL")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => openReport(report)}
                          >
                            Szczegóły
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedReport?.title}</DialogTitle>
            <DialogDescription>
              Zgłoszenie #{selectedReport?.id.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Badge variant={priorityColors[selectedReport?.priority || "medium"]}>
                {priorityLabels[selectedReport?.priority || "medium"]}
              </Badge>
              <Badge variant="outline">
                {statusLabels[selectedReport?.status || "new"]}
              </Badge>
            </div>

            {selectedReport?.description && (
              <div>
                <p className="text-sm font-medium mb-1">Opis:</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedReport.description}
                </p>
              </div>
            )}

            {selectedReport?.steps && (
              <div>
                <p className="text-sm font-medium mb-1">Kroki do odtworzenia:</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedReport.steps}
                </p>
              </div>
            )}

            {selectedReport?.page && (
              <div>
                <p className="text-sm font-medium mb-1">Strona:</p>
                <p className="text-sm text-muted-foreground">{selectedReport.page}</p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium mb-1">Zmień status:</p>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v ?? "new")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Nowy</SelectItem>
                  <SelectItem value="in_progress">W trakcie</SelectItem>
                  <SelectItem value="resolved">Rozwiązany</SelectItem>
                  <SelectItem value="closed">Zamknięty</SelectItem>
                  <SelectItem value="wont_fix">Nie naprawię</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Notatki admina:</p>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Dodaj notatkę..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReport(null)}>
              Anuluj
            </Button>
            <Button onClick={handleUpdate}>Zapisz zmiany</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
