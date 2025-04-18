'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog';
import { LoadingButton } from '@/components/ui/loading';

export default function SetupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    console.log('Form submitted');
    setError(null);

    if (!token) {
      setError('Token manquant. Veuillez utiliser le lien complet envoyé par email.');
      return;
    }

    // Utilisation d'une comparaison constante en temps pour éviter les attaques de timing
    const passwordsMatch = password === confirmPassword;
    if (!passwordsMatch) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Sending request to /api/auth/setup');
      const response = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      if (response.ok) {
        router.push('/auth/signin?setup=success');
      } else {
        const data = await response.json();
        setError(data.error || 'Une erreur est survenue lors de la configuration du compte.');
      }
    } catch {
      setError('Une erreur est survenue lors de la configuration du compte.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={onSubmit}>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          {error && (
            <AlertDialog open={!!error}>
              <AlertDialogContent>
                <AlertDialogDescription>{error}</AlertDialogDescription>
                <Button className="mt-4" onClick={() => setError(null)}>
                  Fermer
                </Button>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button className="w-full" type="submit" disabled={isLoading}>
            <LoadingButton loading={isLoading}>Configurer le compte</LoadingButton>
          </Button>
        </div>
      </form>
    </div>
  );
}
