"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

export function CreateUserDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      color: formData.get('color') as string,
      contractUrl: formData.get('contractUrl') as string,
      commission: formData.get('commission') ? parseFloat(formData.get('commission') as string) : 0,
    };

    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      toast({
        title: 'Succès',
        description: 'Utilisateur créé avec succès',
      });
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: "Impossible de créer l'utilisateur",
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Ajouter un utilisateur</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">
              Créer un compte utilisateur
            </DialogTitle>
            <DialogDescription className="text-neutral-700 dark:text-neutral-300">
              Créez un nouveau compte pour un utilisateur. Un email avec ses identifiants lui sera envoyé.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="dark:text-neutral-200">Nom</Label>
              <Input
                id="name"
                name="name"
                placeholder="John Doe"
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email" className="dark:text-neutral-200">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john@exemple.com"
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password" className="dark:text-neutral-200">Mot de passe</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="color" className="dark:text-neutral-200">Couleur</Label>
              <Input
                id="color"
                name="color"
                type="color"
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="commission" className="dark:text-neutral-200">Commission (%)</Label>
              <Input
                id="commission"
                name="commission"
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="0"
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contractUrl" className="dark:text-neutral-200">URL du contrat</Label>
              <Input
                id="contractUrl"
                name="contractUrl"
                type="url"
                placeholder="https://..."
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Création...' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 