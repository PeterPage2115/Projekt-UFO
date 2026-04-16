import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireAuth } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import {
  users,
  operations,
  defenseCalls,
  snapshots,
  systemLogs,
} from "@/lib/db/schema";
import { eq, desc, count, ne } from "drizzle-orm";

export default async function DashboardPage() {
  const session = await requireAuth();
  const isPrivileged = ['admin', 'leader'].includes(session.user.role);

  const activeOps = db
    .select({ count: count() })
    .from(operations)
    .where(eq(operations.status, "active"))
    .get()!.count;

  const activeDefense = db
    .select({ count: count() })
    .from(defenseCalls)
    .where(eq(defenseCalls.status, "active"))
    .get()!.count;

  const totalUsers = db.select({ count: count() }).from(users).get()!.count;

  const lastSnapshot = db
    .select()
    .from(snapshots)
    .orderBy(desc(snapshots.id))
    .limit(1)
    .get();

  const recentLogs = isPrivileged
    ? db.select().from(systemLogs).orderBy(desc(systemLogs.id)).limit(10).all()
    : db.select().from(systemLogs).where(ne(systemLogs.category, 'auth')).orderBy(desc(systemLogs.id)).limit(10).all();

  const levelColors: Record<string, "default" | "secondary" | "destructive"> = {
    info: "default",
    warn: "secondary",
    error: "destructive",
  };

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen md:max-h-screen md:overflow-auto">
        <Navbar />
        <main className="flex-1 p-4 sm:p-6 pt-16 md:pt-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold">🛸 Centrum Dowodzenia</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Sojusz UFOLODZY — Travian RoF x3
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  🗡️ Aktywne operacje
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeOps}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  🛡️ Wezwania obrony
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeDefense}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  👥 Członkowie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalUsers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  📊 Ostatni snapshot
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lastSnapshot ? (
                  <>
                    <div className="text-2xl font-bold">
                      {lastSnapshot.villageCount?.toLocaleString("pl-PL") ?? "—"}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      wiosek •{" "}
                      {new Date(lastSnapshot.fetchedAt).toLocaleString("pl-PL")}
                    </p>
                  </>
                ) : (
                  <div className="text-2xl font-bold">—</div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ostatnia aktywność</CardTitle>
            </CardHeader>
            <CardContent>
              {recentLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Brak danych — system właśnie wystartował. Skonfiguruj map.sql
                  collector, aby rozpocząć zbieranie danych.
                </p>
              ) : (
                <div className="space-y-2">
                  {recentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex flex-wrap items-start gap-x-3 gap-y-1 text-sm border-b pb-2 last:border-0"
                    >
                      <Badge
                        variant={levelColors[log.level]}
                        className="text-[10px] mt-0.5"
                      >
                        {log.level}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] mt-0.5">
                        {log.category}
                      </Badge>
                      <span className="flex-1 min-w-0 break-words">{log.message}</span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString("pl-PL")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}
