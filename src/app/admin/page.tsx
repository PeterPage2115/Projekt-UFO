import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import {
  users,
  operations,
  defenseCalls,
  snapshots,
  bugReports,
  systemLogs,
} from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function AdminPage() {
  await requireAdmin();

  const totalUsers = db.select({ count: count() }).from(users).get()!.count;

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

  const totalSnapshots = db
    .select({ count: count() })
    .from(snapshots)
    .get()!.count;

  const lastSnapshot = db
    .select()
    .from(snapshots)
    .orderBy(desc(snapshots.id))
    .limit(1)
    .get();

  const openBugs = db
    .select({ count: count() })
    .from(bugReports)
    .where(eq(bugReports.status, "new"))
    .get()!.count;

  const recentLogs = db
    .select()
    .from(systemLogs)
    .orderBy(desc(systemLogs.id))
    .limit(5)
    .all();

  const levelColors: Record<string, string> = {
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
            <h1 className="text-2xl font-bold">⚙️ Panel Administracji</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Zarządzanie systemem Projekt UFO
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  👥 Użytkownicy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalUsers}</div>
              </CardContent>
            </Card>

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
                  🛡️ Obrona (aktywne)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeDefense}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  📊 Snapshoty
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSnapshots}</div>
                {lastSnapshot && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Ostatni:{" "}
                    {new Date(lastSnapshot.fetchedAt).toLocaleString("pl-PL")}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  🐛 Otwarte błędy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{openBugs}</div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Szybkie akcje</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Link href="/admin/users">
                <Button variant="outline">👥 Użytkownicy</Button>
              </Link>
              <Link href="/admin/logs">
                <Button variant="outline">📋 Logi systemowe</Button>
              </Link>
              <Link href="/admin/bugs">
                <Button variant="outline">🐛 Zgłoszenia błędów</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Ostatnie logi</CardTitle>
            </CardHeader>
            <CardContent>
              {recentLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Brak logów w systemie.
                </p>
              ) : (
                <div className="space-y-2">
                  {recentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 text-sm border-b pb-2 last:border-0"
                    >
                      <Badge
                        variant={
                          levelColors[log.level] as
                            | "default"
                            | "secondary"
                            | "destructive"
                        }
                        className="text-[10px] mt-0.5"
                      >
                        {log.level}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] mt-0.5">
                        {log.category}
                      </Badge>
                      <span className="flex-1">{log.message}</span>
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
