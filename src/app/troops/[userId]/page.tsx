import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { requireAuth } from "@/lib/auth/guards";
import { canViewTroops } from "@/lib/auth/guards";
import { redirect } from "next/navigation";
import { UserTroopsContent } from "./UserTroopsContent";

export default async function UserTroopsPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await requireAuth();
  const { userId } = await params;

  // Members can only view own troops
  const isOfficer = canViewTroops(session.user.role);
  if (!isOfficer && session.user.id !== userId) {
    redirect("/troops");
  }

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen md:max-h-screen md:overflow-auto">
        <Navbar />
        <main className="flex-1 p-4 sm:p-6 pt-16 md:pt-6 space-y-6">
          <UserTroopsContent userId={userId} />
        </main>
      </div>
    </>
  );
}
