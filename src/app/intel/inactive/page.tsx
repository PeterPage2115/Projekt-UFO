import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { requireAuth } from '@/lib/auth/guards';
import { InactiveFinder } from '@/components/intel/InactiveFinder';

export default async function InactivePage() {
  await requireAuth();
  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen md:max-h-screen md:overflow-auto">
        <Navbar />
        <main className="flex-1 p-4 sm:p-6 pt-16 md:pt-6 space-y-6">
          <InactiveFinder />
        </main>
      </div>
    </>
  );
}
