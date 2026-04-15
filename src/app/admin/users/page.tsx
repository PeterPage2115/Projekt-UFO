import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { requireLeader } from "@/lib/auth/guards";
import { UserManagement } from "@/components/admin/UserManagement";

export default async function UsersPage() {
  const session = await requireLeader();

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen md:max-h-screen md:overflow-auto">
        <Navbar />
        <main className="flex-1 p-4 sm:p-6 pt-16 md:pt-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold">👥 Zarządzanie użytkownikami</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Zarządzaj kontami użytkowników systemu
            </p>
          </div>
          <UserManagement
            currentUserId={session.user.id}
            currentUserRole={session.user.role}
          />
        </main>
      </div>
    </>
  );
}
