"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const selectClassName =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

// --- Types ---

interface Assignment {
  id: string;
  userId: string;
  userName: string;
  sourceX: number | null;
  sourceY: number | null;
  sourceVillageName: string | null;
  unitSpeed: number | null;
  waves: number | null;
  sendTime: string | null;
  travelTime: number | null;
  status: string;
  notes: string | null;
}

interface Target {
  id: string;
  targetX: number;
  targetY: number;
  targetVillageName: string | null;
  targetPlayerName: string | null;
  isReal: number | null;
  notes: string | null;
  sortOrder: number | null;
  assignments: Assignment[];
}

interface Operation {
  id: string;
  name: string;
  type: string;
  status: string;
  landingTime: string | null;
  description: string | null;
  createdBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface User {
  id: string;
  username: string;
  displayName: string | null;
}

interface OperationDetailProps {
  operation: Operation;
  targets: Target[];
  canManage: boolean;
  currentUserId: string;
  users: User[];
}

// --- Helpers ---

const typeLabels: Record<string, string> = {
  attack: "Atak",
  fake_and_real: "Fejki + Reale",
  scout: "Zwiad",
};

const statusLabels: Record<string, string> = {
  draft: "Szkic",
  active: "Aktywna",
  completed: "Zakończona",
  cancelled: "Anulowana",
};

const statusVariants: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  draft: "secondary",
  active: "default",
  completed: "outline",
  cancelled: "destructive",
};

function formatCountdown(landingTime: string): string {
  const diff = new Date(landingTime).getTime() - Date.now();
  if (diff <= 0) return "Czas minął";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `za ${hours} godzin ${minutes} minut`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pl-PL");
  } catch {
    return iso;
  }
}

// --- Component ---

export function OperationDetail({
  operation,
  targets,
  canManage,
  currentUserId,
  users,
}: OperationDetailProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(
    operation.landingTime ? formatCountdown(operation.landingTime) : null
  );

  // Countdown timer
  useEffect(() => {
    if (!operation.landingTime) return;
    const interval = setInterval(() => {
      setCountdown(formatCountdown(operation.landingTime!));
    }, 30_000);
    return () => clearInterval(interval);
  }, [operation.landingTime]);

  // --- API helpers ---

  async function updateStatus(newStatus: string) {
    await fetch(`/api/operations/${operation.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    router.refresh();
  }

  async function addTarget(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    await fetch(`/api/operations/${operation.id}/targets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetX: Number(formData.get("targetX")),
        targetY: Number(formData.get("targetY")),
      }),
    });
    form.reset();
    router.refresh();
  }

  async function deleteTarget(targetId: string) {
    await fetch(`/api/operations/${operation.id}/targets`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId }),
    });
    router.refresh();
  }

  async function toggleTargetReal(targetId: string, currentIsReal: number | null) {
    await fetch(`/api/operations/${operation.id}/targets`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId, isReal: currentIsReal ? 0 : 1 }),
    });
    router.refresh();
  }

  async function addAssignment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    await fetch(`/api/operations/${operation.id}/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetId: formData.get("targetId"),
        userId: formData.get("userId"),
        sourceX: formData.get("sourceX")
          ? Number(formData.get("sourceX"))
          : undefined,
        sourceY: formData.get("sourceY")
          ? Number(formData.get("sourceY"))
          : undefined,
        unitSpeed: formData.get("unitSpeed")
          ? Number(formData.get("unitSpeed"))
          : undefined,
        waves: formData.get("waves")
          ? Number(formData.get("waves"))
          : undefined,
      }),
    });
    form.reset();
    router.refresh();
  }

  async function deleteAssignment(assignmentId: string) {
    await fetch(`/api/operations/${operation.id}/assignments`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentId }),
    });
    router.refresh();
  }

  async function updateAssignmentStatus(
    assignmentId: string,
    status: string
  ) {
    await fetch(`/api/operations/${operation.id}/assignments`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentId, status }),
    });
    router.refresh();
  }

  // All assignments flattened for member view
  const myAssignments = targets.flatMap((t) =>
    t.assignments
      .filter((a) => a.userId === currentUserId)
      .map((a) => ({ ...a, targetX: t.targetX, targetY: t.targetY }))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{operation.name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="outline">{typeLabels[operation.type] ?? operation.type}</Badge>
            <Badge variant={statusVariants[operation.status] ?? "secondary"}>
              {statusLabels[operation.status] ?? operation.status}
            </Badge>
          </div>
        </div>
        {canManage && (
          <div className="flex gap-2 flex-wrap">
            {operation.status === "draft" && (
              <Button size="sm" onClick={() => updateStatus("active")}>
                Aktywuj
              </Button>
            )}
            {operation.status === "active" && (
              <Button size="sm" onClick={() => updateStatus("completed")}>
                Zakończ
              </Button>
            )}
            {(operation.status === "draft" || operation.status === "active") && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => updateStatus("cancelled")}
              >
                Anuluj
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Landing time & description */}
      {(operation.landingTime || operation.description) && (
        <Card>
          <CardContent className="space-y-2 pt-1">
            {operation.landingTime && (
              <div>
                <p className="text-sm text-muted-foreground">Czas lądowania</p>
                <p className="text-lg font-semibold">
                  {formatDateTime(operation.landingTime)}
                </p>
                <p className="text-sm text-muted-foreground">{countdown}</p>
              </div>
            )}
            {operation.description && (
              <div>
                <p className="text-sm text-muted-foreground">Opis</p>
                <p className="text-sm">{operation.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* === OFFICER VIEW === */}
      {canManage && (
        <>
          {/* Add Target Form */}
          <Card>
            <CardHeader>
              <CardTitle>🎯 Cele ({targets.length})</CardTitle>
              <CardDescription>Dodaj cele operacji</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={addTarget} className="flex flex-wrap gap-2 items-end">
                <div className="space-y-1">
                  <Label htmlFor="targetX">X</Label>
                  <Input
                    id="targetX"
                    name="targetX"
                    type="number"
                    required
                    className="w-20"
                    placeholder="X"
                    min={-200}
                    max={200}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="targetY">Y</Label>
                  <Input
                    id="targetY"
                    name="targetY"
                    type="number"
                    required
                    className="w-20"
                    placeholder="Y"
                    min={-200}
                    max={200}
                  />
                </div>
                <Button type="submit" size="sm">
                  Dodaj cel
                </Button>
                <span className="text-xs text-muted-foreground self-center">
                  Nazwa wioski i gracza zostanie uzupełniona automatycznie
                </span>
              </form>

              {/* Target list */}
              {targets.length === 0 ? (
                <p className="text-sm text-muted-foreground">Brak celów</p>
              ) : (
                <div className="space-y-2">
                  {targets.map((target) => (
                    <div
                      key={target.id}
                      className="flex items-center gap-3 rounded-lg border p-2 text-sm flex-wrap"
                    >
                      <span className="font-mono font-medium">
                        ({target.targetX}|{target.targetY})
                      </span>
                      {target.targetVillageName && (
                        <span>{target.targetVillageName}</span>
                      )}
                      {target.targetPlayerName && (
                        <span className="text-muted-foreground">
                          — {target.targetPlayerName}
                        </span>
                      )}
                      <Badge
                        variant={target.isReal ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => toggleTargetReal(target.id, target.isReal)}
                      >
                        {target.isReal ? "Real" : "Fejk"}
                      </Badge>
                      <span className="text-muted-foreground">
                        {target.assignments.length} przypisań
                      </span>
                      <Button
                        size="xs"
                        variant="destructive"
                        onClick={() => deleteTarget(target.id)}
                      >
                        Usuń
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Assignment Form */}
          <Card>
            <CardHeader>
              <CardTitle>📋 Przypisania</CardTitle>
              <CardDescription>
                Przypisz graczy do celów
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {targets.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Najpierw dodaj cele operacji
                </p>
              ) : (
                <form
                  onSubmit={addAssignment}
                  className="flex flex-wrap gap-2 items-end"
                >
                  <div className="space-y-1">
                    <Label htmlFor="assignTargetId">Cel</Label>
                    <select
                      id="assignTargetId"
                      name="targetId"
                      required
                      className={selectClassName}
                    >
                      {targets.map((t) => (
                        <option key={t.id} value={t.id}>
                          ({t.targetX}|{t.targetY}){" "}
                          {t.targetVillageName ?? ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="assignUserId">Gracz</Label>
                    <select
                      id="assignUserId"
                      name="userId"
                      required
                      className="h-8 w-40 min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <option value="">Wybierz gracza</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.displayName || u.username}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="assignSourceX">Źr. X</Label>
                    <Input
                      id="assignSourceX"
                      name="sourceX"
                      type="number"
                      className="w-20"
                      min={-200}
                      max={200}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="assignSourceY">Źr. Y</Label>
                    <Input
                      id="assignSourceY"
                      name="sourceY"
                      type="number"
                      className="w-20"
                      min={-200}
                      max={200}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="assignUnitSpeed">Prędkość</Label>
                    <Input
                      id="assignUnitSpeed"
                      name="unitSpeed"
                      type="number"
                      step="any"
                      className="w-24"
                      min={1}
                      max={100}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="assignWaves">Fale</Label>
                    <Input
                      id="assignWaves"
                      name="waves"
                      type="number"
                      className="w-20"
                      defaultValue="1"
                      min={1}
                      max={20}
                    />
                  </div>
                  <Button type="submit" size="sm">
                    Przypisz
                  </Button>
                </form>
              )}

              {/* Assignment table per target */}
              {targets.map(
                (target) =>
                  target.assignments.length > 0 && (
                    <div key={target.id} className="space-y-2">
                      <h4 className="text-sm font-medium">
                        Cel: ({target.targetX}|{target.targetY}){" "}
                        {target.targetVillageName ?? ""}
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-left text-muted-foreground">
                              <th className="py-1 pr-3">Gracz</th>
                              <th className="py-1 pr-3">Źródło</th>
                              <th className="py-1 pr-3">Prędkość</th>
                              <th className="py-1 pr-3">Fale</th>
                              <th className="py-1 pr-3">Czas wysłania</th>
                              <th className="py-1 pr-3">Status</th>
                              <th className="py-1">Akcje</th>
                            </tr>
                          </thead>
                          <tbody>
                            {target.assignments.map((a) => (
                              <tr key={a.id} className="border-b">
                                <td className="py-1.5 pr-3">{a.userName}</td>
                                <td className="py-1.5 pr-3 font-mono">
                                  {a.sourceX != null && a.sourceY != null
                                    ? `(${a.sourceX}|${a.sourceY})`
                                    : "—"}
                                </td>
                                <td className="py-1.5 pr-3">
                                  {a.unitSpeed ?? "—"}
                                </td>
                                <td className="py-1.5 pr-3">
                                  {a.waves ?? 1}
                                </td>
                                <td className="py-1.5 pr-3">
                                  {a.sendTime
                                    ? formatDateTime(a.sendTime)
                                    : "—"}
                                </td>
                                <td className="py-1.5 pr-3">
                                  <Badge
                                    variant={
                                      a.status === "confirmed"
                                        ? "default"
                                        : a.status === "sent"
                                          ? "outline"
                                          : "secondary"
                                    }
                                  >
                                    {a.status}
                                  </Badge>
                                </td>
                                <td className="py-1.5">
                                  <div className="flex gap-1">
                                    {a.status === "pending" && (
                                      <Button
                                        size="xs"
                                        variant="outline"
                                        onClick={() =>
                                          updateAssignmentStatus(
                                            a.id,
                                            "confirmed"
                                          )
                                        }
                                      >
                                        Potwierdź
                                      </Button>
                                    )}
                                    {a.status === "confirmed" && (
                                      <Button
                                        size="xs"
                                        variant="outline"
                                        onClick={() =>
                                          updateAssignmentStatus(a.id, "sent")
                                        }
                                      >
                                        Wysłano
                                      </Button>
                                    )}
                                    <Button
                                      size="xs"
                                      variant="destructive"
                                      onClick={() => deleteAssignment(a.id)}
                                    >
                                      Usuń
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* === MEMBER VIEW === */}
      {!canManage && (
        <Card>
          <CardHeader>
            <CardTitle>Twoje przypisania</CardTitle>
          </CardHeader>
          <CardContent>
            {myAssignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Brak przypisań do tej operacji
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-1 pr-3">Cel</th>
                      <th className="py-1 pr-3">Źródło</th>
                      <th className="py-1 pr-3">Prędkość</th>
                      <th className="py-1 pr-3">Fale</th>
                      <th className="py-1 pr-3">Czas wysłania</th>
                      <th className="py-1 pr-3">Status</th>
                      <th className="py-1">Akcje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myAssignments.map((a) => (
                      <tr key={a.id} className="border-b">
                        <td className="py-1.5 pr-3 font-mono">
                          ({a.targetX}|{a.targetY})
                        </td>
                        <td className="py-1.5 pr-3 font-mono">
                          {a.sourceX != null && a.sourceY != null
                            ? `(${a.sourceX}|${a.sourceY})`
                            : "—"}
                        </td>
                        <td className="py-1.5 pr-3">{a.unitSpeed ?? "—"}</td>
                        <td className="py-1.5 pr-3">{a.waves ?? 1}</td>
                        <td className="py-1.5 pr-3">
                          {a.sendTime ? formatDateTime(a.sendTime) : "—"}
                        </td>
                        <td className="py-1.5 pr-3">
                          <Badge
                            variant={
                              a.status === "confirmed"
                                ? "default"
                                : a.status === "sent"
                                  ? "outline"
                                  : "secondary"
                            }
                          >
                            {a.status}
                          </Badge>
                        </td>
                        <td className="py-1.5">
                          {a.status === "pending" && (
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() =>
                                updateAssignmentStatus(a.id, "confirmed")
                              }
                            >
                              Potwierdź
                            </Button>
                          )}
                          {a.status === "confirmed" && (
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() =>
                                updateAssignmentStatus(a.id, "sent")
                              }
                            >
                              Wysłano
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Meta info */}
      <div className="text-xs text-muted-foreground">
        Utworzono: {formatDateTime(operation.createdAt)} · Ostatnia
        aktualizacja: {formatDateTime(operation.updatedAt)}
      </div>
    </div>
  );
}
