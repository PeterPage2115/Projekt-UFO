import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { requireAuth } from "@/lib/auth/guards";
import { DistanceCalculator } from "@/components/tools/DistanceCalculator";

export default async function DistancePage() {
  await requireAuth();

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen md:max-h-screen md:overflow-auto">
        <Navbar />
        <main className="flex-1 p-4 sm:p-6 pt-16 md:pt-6 space-y-6">
          <div>
            <h1 className="text-xl font-bold">📏 Kalkulator dystansu</h1>
            <p className="text-sm text-muted-foreground">
              Oblicz dystans i czas podróży między dwoma polami na mapie
            </p>
          </div>
          <DistanceCalculator serverSpeed={3} />
        </main>
      </div>
    </>
  );
}
