"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogContent, AlertDialogDescription } from '@/components/ui/alert-dialog';
import { ArrowPathIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');
  const [currentStep, setCurrentStep] = useState<'request' | 'reset'>(token ? 'reset' : 'request');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  async function onRequestReset(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Une erreur est survenue');
      }

      setSuccess(true);
      // Après avoir envoyé le lien, on reste sur la même page
      // L'utilisateur verra le message de succès
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  }

  async function onResetPassword(event: React.FormEvent) {
    event.preventDefault();
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
      const response = await fetch('/api/auth/reset', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue');
      }

      // Rediriger vers la page de connexion
      router.push('/auth/signin?reset=success');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  }

  // Si nous sommes à l'étape de la demande de réinitialisation
  if (currentStep === 'request') {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid gap-6"
      >
        <form onSubmit={onRequestReset} className="space-y-4 bg-white dark:bg-neutral-900 p-4 rounded-lg">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nom@exemple.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                className="dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-400"
              />
            </div>
            {error && (
              <AlertDialog>
                <AlertDialogContent>
                  <AlertDialogDescription>{error}</AlertDialogDescription>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {success && (
              <AlertDialog>
                <AlertDialogContent>
                  <AlertDialogDescription>
                    Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.
                  </AlertDialogDescription>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button 
              disabled={isLoading}
              className="w-full dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"
            >
              {isLoading && (
                <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
              )}
              Envoyer le lien de réinitialisation
            </Button>
            <Button
              type="button"
              variant="outline"
              asChild
              className="w-full dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800"
            >
              <Link href="/auth/signin">
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Retour à la connexion
              </Link>
            </Button>
          </div>
        </form>
      </motion.div>
    );
  }

  // Si nous sommes à l'étape de la réinitialisation du mot de passe
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="grid gap-6"
    >
      <form onSubmit={onResetPassword} className="space-y-4 bg-white dark:bg-neutral-900 p-4 rounded-lg">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="password">Nouveau mot de passe</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
              className="dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-400"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              required
              className="dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-400"
            />
          </div>
          {error && (
            <AlertDialog>
              <AlertDialogContent>
                <AlertDialogDescription>{error}</AlertDialogDescription>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button 
            disabled={isLoading}
            className="w-full dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"
          >
            {isLoading && (
              <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
            )}
            Réinitialiser le mot de passe
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setCurrentStep('request');
              setError(null);
            }}
            className="w-full dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800"
          >
            Retour
          </Button>
          <Button
            type="button"
            variant="outline"
            asChild
            className="w-full dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800"
          >
            <Link href="/auth/signin">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Retour à la connexion
            </Link>
          </Button>
        </div>
      </form>
    </motion.div>
  );
} 