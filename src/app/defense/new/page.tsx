import { requireOfficer } from '@/lib/auth/guards';
import { NewDefenseCallClient } from '@/components/defense/NewDefenseCallClient';

export default async function NewDefenseCallPage() {
  await requireOfficer();
  return <NewDefenseCallClient />;
}
