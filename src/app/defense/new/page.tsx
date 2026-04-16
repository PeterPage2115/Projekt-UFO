import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { requireOfficer } from '@/lib/auth/guards';
import { NewDefenseCallClient } from '@/components/defense/NewDefenseCallClient';

export default async function NewDefenseCallPage() {
  await requireOfficer();
  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen md:max-h-screen md:overflow-auto">
        <Navbar />
        <main className="flex-1 p-4 sm:p-6 pt-16 md:pt-6">
          <NewDefenseCallClient />
        </main>
      </div>
    </>
  );
}
