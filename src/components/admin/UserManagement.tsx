"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

type User = {
  id: string;
  username: string;
  displayName: string | null;
  role: string;
  travianUid: number | null;
  createdAt: string | null;
  lastLoginAt: string | null;
};

type UserManagementProps = {
  currentUserId: string;
  currentUserRole: string;
};

const roleColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  admin: "destructive",
  leader: "default",
  officer: "secondary",
  member: "outline",
};

export function UserManagement({ currentUserId, currentUserRole }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);
  const [travianDialog, setTravianDialog] = useState<User | null>(null);
  const [travianUidInput, setTravianUidInput] = useState("");

  const isAdmin = currentUserRole === "admin";

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleRoleChange(userId: string, role: string) {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    if (res.ok) {
      fetchUsers();
    } else {
      const data = await res.json();
      alert(data.error || "Błąd podczas zmiany roli");
    }
  }

  async function handleResetPassword(userId: string) {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset_password" }),
    });
    if (res.ok) {
      const data = await res.json();
      setTempPassword(data.tempPassword);
    } else {
      const data = await res.json();
      alert(data.error || "Błąd podczas resetowania hasła");
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    const res = await fetch(`/api/admin/users/${deleteConfirm.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setDeleteConfirm(null);
      fetchUsers();
    } else {
      const data = await res.json();
      alert(data.error || "Błąd podczas usuwania użytkownika");
    }
  }

  async function handleTravianUid() {
    if (!travianDialog) return;
    const uid = travianUidInput.trim() === "" ? null : parseInt(travianUidInput);
    const res = await fetch(`/api/admin/users/${travianDialog.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ travianUid: uid }),
    });
    if (res.ok) {
      setTravianDialog(null);
      setTravianUidInput("");
      fetchUsers();
    } else {
      const data = await res.json();
      alert(data.error || "Błąd");
    }
  }

  function canChangeRole(targetUser: User): boolean {
    if (targetUser.id === currentUserId) return false;
    if (isAdmin) return true;
    // Leader can only change officer/member
    return targetUser.role === "officer" || targetUser.role === "member";
  }

  function getAvailableRoles(): string[] {
    if (isAdmin) return ["admin", "leader", "officer", "member"];
    return ["officer", "member"];
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Ładowanie...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nazwa</TableHead>
                  <TableHead>Wyświetlana nazwa</TableHead>
                  <TableHead>Rola</TableHead>
                  <TableHead>Travian UID</TableHead>
                  <TableHead>Rejestracja</TableHead>
                  <TableHead>Ostatnie logowanie</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Brak użytkowników
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.displayName || "—"}</TableCell>
                      <TableCell>
                        {canChangeRole(user) ? (
                          <Select
                            value={user.role}
                            onValueChange={(v) => v && handleRoleChange(user.id, v)}
                          >
                            <SelectTrigger className="w-[120px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailableRoles().map((r) => (
                                <SelectItem key={r} value={r}>
                                  {r}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant={roleColors[user.role] || "outline"}>
                            {user.role}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            setTravianDialog(user);
                            setTravianUidInput(
                              user.travianUid ? String(user.travianUid) : "",
                            );
                          }}
                        >
                          {user.travianUid || "Ustaw"}
                        </Button>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString("pl-PL")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleString("pl-PL")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        {isAdmin && user.id !== currentUserId && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => handleResetPassword(user.id)}
                            >
                              Reset hasła
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="text-xs"
                              onClick={() => setDeleteConfirm(user)}
                            >
                              Usuń
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Temp Password Dialog */}
      <Dialog open={!!tempPassword} onOpenChange={() => setTempPassword(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tymczasowe hasło</DialogTitle>
            <DialogDescription>
              Przekaż to hasło użytkownikowi. Powinien je zmienić po zalogowaniu.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted p-4 rounded-md font-mono text-lg text-center select-all">
            {tempPassword}
          </div>
          <DialogFooter>
            <Button onClick={() => setTempPassword(null)}>Zamknij</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Potwierdź usunięcie</DialogTitle>
            <DialogDescription>
              Czy na pewno chcesz usunąć użytkownika{" "}
              <strong>{deleteConfirm?.username}</strong>? Tej operacji nie można
              cofnąć.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Anuluj
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Usuń
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Travian UID Dialog */}
      <Dialog open={!!travianDialog} onOpenChange={() => setTravianDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ustaw Travian UID</DialogTitle>
            <DialogDescription>
              Podaj UID konta Travian dla użytkownika{" "}
              <strong>{travianDialog?.username}</strong>. Pozostaw puste, aby usunąć
              powiązanie.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="number"
            placeholder="Travian UID"
            value={travianUidInput}
            onChange={(e) => setTravianUidInput(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setTravianDialog(null)}>
              Anuluj
            </Button>
            <Button onClick={handleTravianUid}>Zapisz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
