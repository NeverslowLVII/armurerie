import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (password: string) => void;
  error?: string | null;
}

export function LoginDialog({ isOpen, onClose, onLogin, error }: LoginDialogProps) {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(password);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="mx-auto max-w-sm bg-white dark:bg-neutral-800 p-6">
        <DialogTitle className="text-lg font-medium leading-6 text-neutral-900 dark:text-white mb-4">
          Connexion Patron
        </DialogTitle>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Mot de passe
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-neutral-300 dark:bg-neutral-700 dark:border-neutral-600 dark:placeholder-neutral-400 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
              aria-label="Mot de passe"
            />
          </div>

          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm" role="alert">
              {error}
            </div>
          )}

          <div className="mt-4 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 dark:bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 dark:hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Se connecter
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 