import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { requireAuth } from '@/lib/auth/guards';

const InteractiveMap = dynamic(
  () => import('@/components/intel/InteractiveMap'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        Ładowanie mapy...
      </div>
    ),
  },
);

export default async function MapPage() {
  await requireAuth();
  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen md:max-h-screen md:overflow-auto">
        <Navbar />
        <main className="flex-1 p-6 pt-16 md:pt-6 space-y-6">
          <InteractiveMap />
        </main>
      </div>
    </>
  );
}
