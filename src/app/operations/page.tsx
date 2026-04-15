import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { requireAuth } from "@/lib/auth/guards";
import { canManageOps } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { operations, operationTargets, operationAssignments } from "@/lib/db/schema";
import { eq, desc, sql, count } from "drizzle-orm";
import { OperationCard } from "@/components/operations/OperationCard";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function OperationsPage() {
  const session = await requireAuth();
  const canManage = canManageOps(session.user.role);

  let ops: (typeof operations.$inferSelect)[];

  if (canManage) {
    ops = db.select().from(operations).orderBy(desc(operations.createdAt)).all();
  } else {
    // Members only see operations they are assigned to
    const assignedOpIds = db
      .selectDistinct({ operationId: operationAssignments.operationId })
      .from(operationAssignments)
      .where(eq(operationAssignments.userId, session.user.id))
      .all()
      .map((a) => a.operationId);

    if (assignedOpIds.length === 0) {
      ops = [];
    } else {
      ops = db
        .select()
        .from(operations)
        .where(
          sql`${operations.id} IN (${sql.join(
            assignedOpIds.map((id) => sql`${id}`),
            sql`, `
          )})`
        )
        .orderBy(desc(operations.createdAt))
        .all();
    }
  }

  // Get counts for each operation
  const opsWithCounts = ops.map((op) => {
    const targetCount = db
      .select({ value: count() })
      .from(operationTargets)
      .where(eq(operationTargets.operationId, op.id))
      .get()?.value ?? 0;

    const assignmentCounts = db
      .select({
        total: count(),
        confirmed: sql<number>`SUM(CASE WHEN ${operationAssignments.status} IN ('confirmed', 'sent') THEN 1 ELSE 0 END)`,
      })
      .from(operationAssignments)
      .where(eq(operationAssignments.operationId, op.id))
      .get();

    return {
      ...op,
      targetCount,
      assignmentCount: assignmentCounts?.total ?? 0,
      confirmedCount: assignmentCounts?.confirmed ?? 0,
    };
  });

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen md:max-h-screen md:overflow-auto">
        <Navbar />
        <main className="flex-1 p-4 sm:p-6 pt-16 md:pt-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">⚔️ Operacje</h1>
            {canManage && (
              <Link
                href="/operations/new"
                className={cn(buttonVariants(), "gap-2")}
              >
                + Nowa operacja
              </Link>
            )}
          </div>

          {opsWithCounts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">Brak operacji</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {opsWithCounts.map((op) => (
                <OperationCard key={op.id} operation={op} />
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
