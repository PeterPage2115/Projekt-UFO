import { requireAuth } from '@/lib/auth/guards';
import { DefenseDetailClient } from '@/components/defense/DefenseDetailClient';

export default async function DefenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  return <DefenseDetailClient callId={id} />;
}
