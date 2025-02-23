"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

export default function SignInForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || '/';

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const identifier = formData.get('identifier') as string;
    const password = formData.get('password') as string;

    try {
      console.log('Attempting sign in with:', { identifier, callbackUrl });
      
      const result = await signIn('credentials', {
        identifier,
        password,
        redirect: false,
        callbackUrl: callbackUrl
      });

      console.log('Sign in result:', result);

      if (!result) {
        throw new Error('Received null result from signIn');
      }

      if (result.error) {
        console.error('Sign in error:', result.error);
        toast({
          title: 'Erreur',
          description: 'Identifiants invalides',
          variant: 'destructive',
        });
        return;
      }

      if (result.url) {
        router.push(result.url);
      } else {
        router.push(callbackUrl);
      }
      
      toast({
        title: 'Succès',
        description: 'Connexion réussie',
      });
    } catch (error) {
      console.error('Sign in error:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 bg-white dark:bg-neutral-900 p-4 rounded-lg">
      <div className="space-y-2">
        <Input
          id="identifier"
          name="identifier"
          type="text"
          placeholder="Email ou nom d'utilisateur"
          required
          disabled={isLoading}
          className="dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-400"
        />
      </div>
      <div className="space-y-2">
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          disabled={isLoading}
          className="dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-400"
        />
      </div>
      <Button
        className="w-full dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"
        type="submit"
        disabled={isLoading}
      >
        {isLoading ? 'Connexion...' : 'Se connecter'}
      </Button>
    </form>
  );
}