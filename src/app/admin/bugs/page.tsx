import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { requireAdmin } from "@/lib/auth/guards";
import { BugReportList } from "@/components/admin/BugReportList";

export default async function BugsPage() {
  await requireAdmin();

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen md:max-h-screen md:overflow-auto">
        <Navbar />
        <main className="flex-1 p-6 pt-16 md:pt-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold">🐛 Zgłoszenia błędów</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Zarządzaj zgłoszeniami błędów od użytkowników
            </p>
          </div>
          <BugReportList />
        </main>
      </div>
    </>
  );
}
