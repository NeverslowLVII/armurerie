'use client';

import Navbar from '@/components/Navbar';

export default function EmployeeLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      <Navbar />
      <div className="pt-28">{children}</div>
    </div>
  );
}
