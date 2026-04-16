import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { requireAuth } from "@/lib/auth/guards";
import { canViewTroops } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { users, troopReports } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m temu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h temu`;
  const days = Math.floor(hours / 24);
  return `${days}d temu`;
}

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-500/20 text-red-400 border-red-500/30",
  leader: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  officer: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  member: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  leader: "Lider",
  officer: "Oficer",
  member: "Członek",
};

export default async function AlliancePage() {
  const session = await requireAuth();
  const canSeeTroopDetails = canViewTroops(session.user.role);

  const allUsers = db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      role: users.role,
      travianUid: users.travianUid,
      travianVillages: users.travianVillages,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(
      sql`CASE ${users.role} WHEN 'admin' THEN 1 WHEN 'leader' THEN 2 WHEN 'officer' THEN 3 ELSE 4 END`,
      users.username
    )
    .all();

  const latestReports = db
    .select({
      userId: troopReports.userId,
      offValue: sql<number>`COALESCE(SUM(${troopReports.offValue}), 0)`,
      defInfValue: sql<number>`COALESCE(SUM(${troopReports.defInfValue}), 0)`,
      defCavValue: sql<number>`COALESCE(SUM(${troopReports.defCavValue}), 0)`,
      reportCount: sql<number>`COUNT(*)`,
    })
    .from(troopReports)
    .groupBy(troopReports.userId)
    .all();

  const reportsByUser = new Map(latestReports.map((r) => [r.userId, r]));

  const totalOff = latestReports.reduce((sum, r) => sum + (r.offValue || 0), 0);
  const totalDefInf = latestReports.reduce((sum, r) => sum + (r.defInfValue || 0), 0);
  const totalDefCav = latestReports.reduce((sum, r) => sum + (r.defCavValue || 0), 0);

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen md:max-h-screen md:overflow-auto">
        <Navbar />
        <main className="flex-1 p-4 sm:p-6 pt-16 md:pt-6 space-y-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">👥 Sojusz UFOLODZY</h1>
            <Badge variant="outline" className="border-primary/30 text-primary">
              {allUsers.length} członków
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Członkowie</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{allUsers.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">⚔️ Łączny atak</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">{totalOff.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">🛡️ Obr. piechoty</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">{totalDefInf.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">🐴 Obr. kawalerii</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">{totalDefCav.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista członków</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-2 font-medium">Nick</th>
                      <th className="py-2 px-2 font-medium">Rola</th>
                      <th className="py-2 px-2 font-medium">Ostatni login</th>
                      <th className="py-2 px-2 font-medium text-center">Wioski</th>
                      {canSeeTroopDetails && (
                        <>
                          <th className="py-2 px-2 font-medium text-right">⚔️ Atak</th>
                          <th className="py-2 px-2 font-medium text-right">🛡️ Obr. piech.</th>
                          <th className="py-2 pl-2 font-medium text-right">🐴 Obr. kaw.</th>
                        </>
                      )}
                      {!canSeeTroopDetails && (
                        <th className="py-2 px-2 font-medium">Wojska</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map((user) => {
                      const report = reportsByUser.get(user.id);
                      let villageCount = 0;
                      try {
                        const vils = user.travianVillages
                          ? JSON.parse(user.travianVillages)
                          : [];
                        villageCount = Array.isArray(vils) ? vils.length : 0;
                      } catch {
                        villageCount = 0;
                      }

                      return (
                        <tr key={user.id} className="border-b border-border/50">
                          <td className="py-2 pr-2 font-medium">
                            {user.displayName || user.username}
                          </td>
                          <td className="py-2 px-2">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${ROLE_COLORS[user.role] ?? ROLE_COLORS.member}`}
                            >
                              {ROLE_LABELS[user.role] ?? user.role}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-muted-foreground">
                            {timeAgo(user.lastLoginAt)}
                          </td>
                          <td className="py-2 px-2 text-center font-mono">
                            {villageCount > 0 ? villageCount : "—"}
                          </td>
                          {canSeeTroopDetails && (
                            <>
                              <td className="py-2 px-2 text-right font-mono">
                                {report ? report.offValue.toLocaleString() : "—"}
                              </td>
                              <td className="py-2 px-2 text-right font-mono">
                                {report ? report.defInfValue.toLocaleString() : "—"}
                              </td>
                              <td className="py-2 pl-2 text-right font-mono">
                                {report ? report.defCavValue.toLocaleString() : "—"}
                              </td>
                            </>
                          )}
                          {!canSeeTroopDetails && (
                            <td className="py-2 px-2 text-muted-foreground">
                              {report
                                ? `${report.reportCount} raportów`
                                : "Brak raportu"}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}
