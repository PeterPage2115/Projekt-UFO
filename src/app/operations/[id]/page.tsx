import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { requireAuth } from "@/lib/auth/guards";
import { canManageOps } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import {
  operations,
  operationTargets,
  operationAssignments,
  users,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { OperationDetail } from "./OperationDetail";

export default async function OperationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth();
  const { id } = await params;
  const canManage = canManageOps(session.user.role);

  const operation = db
    .select()
    .from(operations)
    .where(eq(operations.id, id))
    .get();

  if (!operation) {
    notFound();
  }

  // Members must have assignments to view
  if (!canManage) {
    const hasAssignment = db
      .select({ id: operationAssignments.id })
      .from(operationAssignments)
      .where(
        and(
          eq(operationAssignments.operationId, id),
          eq(operationAssignments.userId, session.user.id)
        )
      )
      .get();

    if (!hasAssignment) {
      redirect("/operations");
    }
  }

  // Fetch all targets for this operation
  const targets = db
    .select()
    .from(operationTargets)
    .where(eq(operationTargets.operationId, id))
    .orderBy(operationTargets.sortOrder)
    .all();

  // Fetch all assignments with user display names
  const assignments = db
    .select({
      id: operationAssignments.id,
      targetId: operationAssignments.targetId,
      userId: operationAssignments.userId,
      userName: users.displayName,
      userUsername: users.username,
      sourceX: operationAssignments.sourceX,
      sourceY: operationAssignments.sourceY,
      sourceVillageName: operationAssignments.sourceVillageName,
      unitSpeed: operationAssignments.unitSpeed,
      waves: operationAssignments.waves,
      sendTime: operationAssignments.sendTime,
      travelTime: operationAssignments.travelTime,
      status: operationAssignments.status,
      notes: operationAssignments.notes,
    })
    .from(operationAssignments)
    .leftJoin(users, eq(operationAssignments.userId, users.id))
    .where(eq(operationAssignments.operationId, id))
    .all();

  // Group assignments by target
  const targetsWithAssignments = targets.map((target) => ({
    id: target.id,
    targetX: target.targetX,
    targetY: target.targetY,
    targetVillageName: target.targetVillageName,
    targetPlayerName: target.targetPlayerName,
    isReal: target.isReal,
    notes: target.notes,
    sortOrder: target.sortOrder,
    assignments: assignments
      .filter((a) => a.targetId === target.id)
      .map((a) => ({
        id: a.id,
        userId: a.userId,
        userName: a.userName || a.userUsername || "Nieznany",
        sourceX: a.sourceX,
        sourceY: a.sourceY,
        sourceVillageName: a.sourceVillageName,
        unitSpeed: a.unitSpeed,
        waves: a.waves,
        sendTime: a.sendTime,
        travelTime: a.travelTime,
        status: a.status,
        notes: a.notes,
      })),
  }));

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen md:max-h-screen md:overflow-auto">
        <Navbar />
        <main className="flex-1 p-4 sm:p-6 pt-16 md:pt-6 space-y-6">
          <OperationDetail
            operation={operation}
            targets={targetsWithAssignments}
            canManage={canManage}
            currentUserId={session.user.id}
          />
        </main>
      </div>
    </>
  );
}
