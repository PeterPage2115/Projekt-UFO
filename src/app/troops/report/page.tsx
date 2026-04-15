import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { requireAuth } from "@/lib/auth/guards";
import { TroopReportForm } from "@/components/troops/TroopReportForm";

export default async function TroopReportPage() {
  await requireAuth();

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen md:max-h-screen md:overflow-auto">
        <Navbar />
        <main className="flex-1 p-4 sm:p-6 pt-16 md:pt-6 space-y-6 max-w-3xl mx-auto w-full">
          <div>
            <h1 className="text-2xl font-bold">📋 Zgłoś wojska</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Wprowadź skład wojsk w wybranej wiosce
            </p>
          </div>
          <TroopReportForm />
        </main>
      </div>
    </>
  );
}
