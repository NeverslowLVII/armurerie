'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';
import armurerie from '@/assets/armurerie.webp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogContent, AlertDialogDescription } from '@/components/ui/alert-dialog';
import { LoadingButton } from '@/components/ui/loading';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || '/';
  const setup = searchParams?.get('setup');
  const reset = searchParams?.get('reset');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      setIsLoading(true);
      const result = await signIn('credentials', {
        identifier,
        password,
        redirect: false,
      });

      if (!result?.ok) {
        throw new Error('Identifiants invalides');
      }

      router.push(callbackUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container relative h-screen flex-col items-center justify-center grid bg-white dark:bg-neutral-900 lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={armurerie}
            alt="Armurerie background"
            fill
            className="object-cover transition-transform duration-500 hover:scale-105"
            priority
            quality={100}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30 backdrop-blur-[2px]" />
        </div>
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-20 flex items-center"
        >
          <span className="text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
            Armurerie
          </span>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative z-20 mt-auto"
        >
          <blockquote className="space-y-2">
            <p className="text-lg font-medium italic text-neutral-100">
              &ldquo;La meilleure armurerie de Saint-Denis, en même temps c&apos;est la seule&rdquo;
            </p>
            <footer className="text-sm text-neutral-300">
              <span className="font-semibold">Theodore Roosevelt</span>
              <span className="before:content-['—'] before:mx-2 text-neutral-400">1899</span>
            </footer>
          </blockquote>
        </motion.div>
      </div>
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="lg:p-8"
      >
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white"
            >
              Connexion
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-sm text-neutral-500 dark:text-neutral-400"
            >
              Entrez vos identifiants pour accéder à votre espace
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="grid gap-6">
              {setup && (
                <AlertDialog open={!!setup}>
                  <AlertDialogContent>
                    <AlertDialogDescription>
                      Votre compte a été configuré avec succès. Vous pouvez maintenant vous connecter.
                    </AlertDialogDescription>
                    <Button 
                      className="mt-4" 
                      onClick={() => router.replace('/auth/signin')}
                    >
                      Fermer
                    </Button>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {reset && (
                <AlertDialog open={!!reset}>
                  <AlertDialogContent>
                    <AlertDialogDescription>
                      Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.
                    </AlertDialogDescription>
                    <Button 
                      className="mt-4" 
                      onClick={() => router.replace('/auth/signin')}
                    >
                      Fermer
                    </Button>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <form onSubmit={onSubmit} className="space-y-4 bg-white dark:bg-neutral-900 p-4 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="identifier">Email ou nom d&apos;utilisateur</Label>
                  <Input
                    id="identifier"
                    name="identifier"
                    type="text"
                    placeholder="nom@exemple.fr"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    disabled={isLoading}
                    required
                    className="dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-400"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Link
                      href="/auth/reset"
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                    className="dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-400"
                  />
                </div>
                {error && (
                  <AlertDialog open={!!error}>
                    <AlertDialogContent>
                      <AlertDialogDescription>{error}</AlertDialogDescription>
                      <Button 
                        className="mt-4" 
                        onClick={() => setError(null)}
                      >
                        Fermer
                      </Button>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <Button
                  className="w-full dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"
                  type="submit"
                  disabled={isLoading}
                >
                  <LoadingButton loading={isLoading} spinnerSize="xs">
                    Se connecter
                  </LoadingButton>
                </Button>
              </form>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
} 