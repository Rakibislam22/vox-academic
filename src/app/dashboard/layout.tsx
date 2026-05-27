import type { ReactNode } from 'react';
import { auth } from '@/lib/auth';
import DashboardClient from '@/components/dashboard/DashboardClient';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  return <DashboardClient session={session}>{children}</DashboardClient>;
}
