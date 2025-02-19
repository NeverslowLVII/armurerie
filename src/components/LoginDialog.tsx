import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Role } from '@prisma/client';

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: {
    id: number;
    email?: string;
    username?: string;
    name: string;
    role: Role;
    color?: string;
    contractUrl?: string;
  }) => void;
}

export function LoginDialog({ isOpen, onClose, onSuccess }: LoginDialogProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: identifier.includes('@') ? identifier : undefined,
          username: !identifier.includes('@') ? identifier : undefined,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onSuccess(data.user);
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-neutral-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-neutral-900 dark:text-white">
            Connexion
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="mb-4 p-2 bg-red-100 dark:bg-red-900 border-l-4 border-red-500 dark:border-red-700 text-red-700 dark:text-red-100 text-sm rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="identifier" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Email ou nom d'utilisateur
            </label>
            <Input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-neutral-300 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white rounded-md"
              required
              disabled={isSubmitting}
              placeholder="email@example.com ou username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Mot de passe
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-neutral-300 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white rounded-md"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Connexion...' : 'Se connecter'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 