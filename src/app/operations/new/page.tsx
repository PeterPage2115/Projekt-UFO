import { requireOfficer } from "@/lib/auth/guards";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { NewOperationForm } from "./NewOperationForm";

export default async function NewOperationPage() {
  await requireOfficer();

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen md:max-h-screen md:overflow-auto">
        <Navbar />
        <main className="flex-1 p-6 pt-16 md:pt-6 space-y-6">
          <NewOperationForm />
        </main>
      </div>
    </>
  );
}
