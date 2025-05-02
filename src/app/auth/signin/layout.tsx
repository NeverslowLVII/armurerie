import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connexion - Armurerie',
  description: 'Connectez-vous à votre espace',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
