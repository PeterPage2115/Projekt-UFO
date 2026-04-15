import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { requireAdmin } from "@/lib/auth/guards";
import { SystemLogs } from "@/components/admin/SystemLogs";

export default async function LogsPage() {
  await requireAdmin();

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen md:max-h-screen md:overflow-auto">
        <Navbar />
        <main className="flex-1 p-6 pt-16 md:pt-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold">📋 Logi systemowe</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Przegląd logów aktywności systemu
            </p>
          </div>
          <SystemLogs />
        </main>
      </div>
    </>
  );
}
