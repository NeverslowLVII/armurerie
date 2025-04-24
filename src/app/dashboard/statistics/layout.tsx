import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Role } from '@prisma/client';

export default async function StatisticsLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  // Allow PATRON and DEVELOPER to access statistics page
  if (!session || (session.user.role !== Role.PATRON && session.user.role !== Role.DEVELOPER)) {
    redirect('/dashboard/weapons');
  }
  return <>{children}</>;
} 