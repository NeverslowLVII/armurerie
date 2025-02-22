import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface Developer {
  id: number;
  username: string;
  name: string;
}

const listItemVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  }
};

export default function DeveloperManager({ open, onClose }: Props) {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [editingDeveloper, setEditingDeveloper] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchDevelopers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/developers');
      if (!response.ok) throw new Error('Failed to fetch developers');
      const data = await response.json();
      setDevelopers(data);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les développeurs",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    if (open) {
      fetchDevelopers();
    }
  }, [open, fetchDevelopers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/developers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          name: newName,
        }),
      });

      if (!response.ok) throw new Error('Failed to create developer');

      toast({
        title: "Succès",
        description: "Développeur créé avec succès",
      });

      await fetchDevelopers();
      setNewUsername('');
      setNewPassword('');
      setNewName('');
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le développeur",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (developerId: number) => {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/developers/${developerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: newUsername,
          name: newName,
          ...(newPassword && { password: newPassword }),
        }),
      });

      if (!response.ok) throw new Error('Failed to update developer');

      toast({
        title: "Succès",
        description: "Développeur mis à jour avec succès",
      });

      await fetchDevelopers();
      setEditingDeveloper(null);
      setNewUsername('');
      setNewPassword('');
      setNewName('');
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le développeur",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (developerId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce développeur ?')) return;

    try {
      const response = await fetch(`/api/admin/developers/${developerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete developer');

      toast({
        title: "Succès",
        description: "Développeur supprimé avec succès",
      });

      await fetchDevelopers();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le développeur",
        variant: "destructive",
      });
    }
  };

  const startEditing = (developer: Developer) => {
    setEditingDeveloper(developer.id);
    setNewUsername(developer.username);
    setNewName(developer.name);
    setNewPassword('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] bg-white dark:bg-neutral-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-neutral-900 dark:text-white">
            Gérer les développeurs
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {/* Form Panel */}
          <div className="space-y-4">
            <form onSubmit={editingDeveloper ? (e) => { e.preventDefault(); handleUpdate(editingDeveloper); } : handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Nom d&apos;utilisateur
                  </label>
                  <Input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Nom complet
                  </label>
                  <Input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    {editingDeveloper ? "Nouveau mot de passe (optionnel)" : "Mot de passe"}
                  </label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full"
                    required={!editingDeveloper}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  {editingDeveloper && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingDeveloper(null);
                        setNewUsername('');
                        setNewPassword('');
                        setNewName('');
                      }}
                      disabled={isSubmitting}
                    >
                      Annuler
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {editingDeveloper ? 'Mise à jour...' : 'Création...'}
                      </>
                    ) : (
                      editingDeveloper ? 'Mettre à jour' : 'Créer'
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>

          {/* List Panel */}
          <div className="border-l border-neutral-200 dark:border-neutral-700 pl-6">
            <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-4">
              Développeurs existants
            </h3>
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {developers.map((developer) => (
                  <motion.div
                    key={developer.id}
                    variants={listItemVariants}
                    initial="hidden"
                    animate="visible"
                    className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-neutral-900 dark:text-white">
                          {developer.name}
                        </h4>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          {developer.username}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => startEditing(developer)}
                          variant="ghost"
                          size="sm"
                          className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(developer.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 