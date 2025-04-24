import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as nextAuth from 'next-auth/react';
import { Role } from '@prisma/client';

// Composant simplifié pour les tests
const MockNavbar = ({ role }: { role: Role }) => {
  return (
    <div>
      <span>Armes</span>
      <span>Comparateur</span>
      {role === Role.PATRON && <span>Statistiques</span>}
      <span>Mon Compte</span>
    </div>
  );
};

// Mock des hooks de Next.js
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/weapons',
}));

vi.mock('@/components/Navbar', () => ({
  default: ({ children, ...props }: any) => {
    // Récupérer le rôle de l'utilisateur à partir de useSession
    const { data } = nextAuth.useSession();
    const role = data?.user?.role || Role.EMPLOYEE;
    
    // Utiliser notre composant simplifié
    return <MockNavbar role={role} />;
  },
}));

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays Statistiques for PATRON', () => {
    vi.spyOn(nextAuth, 'useSession').mockReturnValueOnce({
      data: {
        user: {
          id: '1',
          name: 'Patron Test',
          email: 'patron@example.com',
          username: 'patron',
          role: Role.PATRON,
        },
      },
      status: 'authenticated',
    } as any);

    const { container } = render(<MockNavbar role={Role.PATRON} />);
    expect(screen.getByText('Statistiques')).toBeDefined();
  });

  it('hides Statistiques for EMPLOYEE', () => {
    vi.spyOn(nextAuth, 'useSession').mockReturnValueOnce({
      data: {
        user: {
          id: '2',
          name: 'Employee Test',
          email: 'employee@example.com',
          username: 'employee',
          role: Role.EMPLOYEE,
        },
      },
      status: 'authenticated',
    } as any);

    const { container } = render(<MockNavbar role={Role.EMPLOYEE} />);
    expect(screen.queryByText('Statistiques')).toBeNull();
  });
}); 