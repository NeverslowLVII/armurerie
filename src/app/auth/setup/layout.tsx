import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Configuration du compte | Armurerie',
  description: 'Configurez votre compte Armurerie',
};

export default function SetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 