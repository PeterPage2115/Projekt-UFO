import { requireAuth } from '@/lib/auth/guards';
import { DefenseListClient } from '@/components/defense/DefenseListClient';

export default async function DefensePage() {
  await requireAuth();
  return <DefenseListClient />;
}
