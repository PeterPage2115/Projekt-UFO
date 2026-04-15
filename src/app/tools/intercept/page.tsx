import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { requireAuth } from "@/lib/auth/guards";
import { InterceptCalculator } from "@/components/tools/InterceptCalculator";

export default async function InterceptPage() {
  await requireAuth();

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen md:max-h-screen md:overflow-auto">
        <Navbar />
        <main className="flex-1 p-4 sm:p-6 pt-16 md:pt-6 space-y-6">
          <div>
            <h1 className="text-xl font-bold">🎯 Kalkulator przechwycenia</h1>
            <p className="text-sm text-muted-foreground">
              Oblicz czas wysyłki obrony, aby dotarła przed atakiem
            </p>
          </div>
          <InterceptCalculator serverSpeed={3} />
        </main>
      </div>
    </>
  );
}
