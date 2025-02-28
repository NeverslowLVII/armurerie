import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import { useAppDispatch } from '../redux/hooks';
import { updateUser } from '../redux/slices/userSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { PencilIcon, XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import { SelectNative } from "@/components/ui/select-native";
import { Role, User } from '@/services/api';

interface Props {
    open: boolean;
    onClose: () => void;
    users: User[];
    onUpdate: () => Promise<void>;
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
  },
  exit: { 
    opacity: 0,
    x: -20,
    transition: {
      duration: 0.2
    }
  }
};

const successVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 }
};

export default function UserManager({ open, onClose, users, onUpdate }: Props) {
  const dispatch = useAppDispatch();
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [tempColor, setTempColor] = useState('#000000');
  const [tempRole, setTempRole] = useState<Role>(Role.EMPLOYEE);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [setupLink, setSetupLink] = useState<string | null>(null);
  const [isSetupLinkDialogOpen, setIsSetupLinkDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleUserUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const user = users.find(u => u.name === editingUser);
      if (!user) return;

      // Validation côté client
      if (!newUserName.trim()) {
        setError('Le nom ne peut pas être vide');
        setIsSubmitting(false);
        return;
      }

      if (!newUsername.trim()) {
        setError('Le nom d\'utilisateur ne peut pas être vide');
        setIsSubmitting(false);
        return;
      }

      // Vérifier si le nom d'utilisateur est déjà utilisé par un autre utilisateur
      const usernameExists = users.some(u => 
        u.username === newUsername.trim() && u.id !== user.id
      );
      
      if (usernameExists) {
        setError('Ce nom d\'utilisateur est déjà utilisé par un autre utilisateur');
        setIsSubmitting(false);
        return;
      }

      const updateData: Partial<User> = {
        name: newUserName.trim(),
        username: newUsername.trim(),
        color: tempColor,
        role: tempRole,
        email: user.email // Conserver l'email existant
      };

      console.log('Updating user:', {
        id: user.id,
        currentUser: user,
        updateData
      });

      await dispatch(updateUser({ 
        id: user.id,
        data: updateData
      }));
      await onUpdate();
      setSuccess('Informations mises à jour avec succès !');
      setEditingUser(null);
      // Reset form
      setNewUserName('');
      setNewUsername('');
      setTempColor('#000000');
      setTempRole(Role.EMPLOYEE);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Update error details:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined
      });
      
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Erreur lors de la mise à jour de l\'utilisateur');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (name: string, user: User) => {
    setEditingUser(name);
    
    // Animation séquentielle des champs
    setTimeout(() => {
      setNewUserName(user.name);
      setNewUsername(user.username || '');
      setTimeout(() => {
        setTempColor(user.color || '#000000');
        setTimeout(() => {
          setTempRole(user.role as Role);
        }, 100);
      }, 100);
    }, 100);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSetupLink(null);
    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newUserName,
          username: newUsername,
          email: newUserEmail,
          color: tempColor,
          role: tempRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'ajout de l\'utilisateur');
      }

      await onUpdate();
      setNewUserName('');
      setNewUsername('');
      setNewUserEmail('');
      setTempColor('#000000');
      setTempRole(Role.EMPLOYEE);
      setSuccess('Utilisateur ajouté avec succès !');
      setSetupLink(data.setupLink);
      setIsSetupLinkDialogOpen(true);
    } catch (error) {
      setError('Erreur lors de l\'ajout de l\'utilisateur');
      console.error('Error adding user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditingUser(null);
    setNewUserName('');
    setNewUsername('');
    setNewUserEmail('');
    setTempColor('#000000');
    setTempRole(Role.EMPLOYEE);
    setSetupLink(null);
  };

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.name} ?`)) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/employees/${user.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400 && data.error === 'Cannot delete user with weapons') {
          setError(`Impossible de supprimer ${user.name} car il possède encore ${data.weapon_count} arme(s). Veuillez d'abord transférer ou supprimer ses armes.`);
        } else {
          setError(data.error || 'Erreur lors de la suppression de l\'utilisateur');
        }
        return;
      }

      await onUpdate();
      setSuccess('Utilisateur supprimé avec succès !');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Erreur lors de la suppression de l\'utilisateur');
      console.error('Error deleting user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay className="bg-black/30 backdrop-blur-sm" />
        <DialogContent className="max-w-[95vw] xl:max-w-[90vw] 2xl:max-w-[85vw] h-[85vh] p-0 bg-neutral-900 border border-neutral-800 shadow-2xl" aria-describedby="user-manager-description">
          <div className="flex flex-col h-full">
            <div className="p-3 border-b border-neutral-700">
              <div className="flex justify-between items-center">
                <DialogTitle className="text-xl font-semibold text-neutral-100">
                  Gérer les utilisateurs
                </DialogTitle>
                <div className="sr-only" id="user-manager-description">
                  Interface de gestion des utilisateurs permettant d&apos;ajouter, modifier et supprimer des utilisateurs
                </div>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Rechercher un utilisateur..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-64 pl-4 pr-10 py-1.5 text-sm border border-neutral-600 rounded-md focus:ring-red-500 focus:border-red-500 bg-neutral-800 text-neutral-100 placeholder-neutral-400"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="h-4 w-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={onClose}
                    variant="outline"
                    className="text-neutral-300 border-neutral-600 hover:bg-neutral-800"
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-1 min-h-0">
              {/* Left Panel - Form */}
              <div className="w-1/3 border-r border-neutral-700 bg-neutral-900 overflow-y-auto">
                <div className="p-4 space-y-4">
                  {error && (
                    <div className="p-2 bg-red-900/50 border-l-4 border-red-700 text-red-300 text-sm rounded">
                      {error}
                    </div>
                  )}

                  {success && (
                    <motion.div 
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={successVariants}
                      className="p-2 bg-emerald-900/50 border-l-4 border-emerald-700 text-emerald-300 text-sm rounded"
                    >
                      {success}
                    </motion.div>
                  )}

                  <form onSubmit={editingUser ? handleUserUpdate : handleAddUser} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-1">
                        Nom complet
                      </label>
                      <Input
                        type="text"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        className="w-full bg-neutral-800 border-neutral-600 text-neutral-100 placeholder-neutral-400"
                        placeholder="John Doe"
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-1">
                        Nom d&apos;utilisateur
                      </label>
                      <Input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="w-full bg-neutral-800 border-neutral-600 text-neutral-100 placeholder-neutral-400"
                        placeholder="johndoe"
                        required
                        disabled={isSubmitting}
                      />
                      <p className="mt-1 text-xs text-neutral-500">
                        Ce nom d&apos;utilisateur sera utilisé pour la connexion
                      </p>
                    </div>

                    {!editingUser && (
                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-1">
                          Email
                        </label>
                        <Input
                          type="email"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          className="w-full bg-neutral-800 border-neutral-600 text-neutral-100 placeholder-neutral-400"
                          placeholder="john.doe@example.com"
                          required
                          disabled={isSubmitting}
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-1">
                        Rôle
                      </label>
                      <SelectNative
                        value={tempRole}
                        onChange={(e) => setTempRole(e.target.value as Role)}
                        className="w-full bg-neutral-800 border-neutral-600 text-neutral-100"
                        required
                        disabled={isSubmitting}
                      >
                        {Object.values(Role).map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </SelectNative>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-1">
                        Couleur
                      </label>
                      <Input
                        type="color"
                        value={tempColor}
                        onChange={(e) => setTempColor(e.target.value)}
                        className="w-full h-10 bg-neutral-800 border-neutral-600"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="pt-2">
                      <div className="flex justify-between space-x-2">
                        {editingUser && (
                          <Button
                            type="button"
                            onClick={handleCancel}
                            variant="outline"
                            className="text-neutral-300 border-neutral-600 hover:bg-neutral-800"
                            disabled={isSubmitting}
                          >
                            <XMarkIcon className="h-4 w-4 mr-1.5" />
                            Annuler
                          </Button>
                        )}
                        <Button
                          type="submit"
                          className={`flex-1 ${
                            isSubmitting
                              ? 'bg-red-500/50'
                              : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500'
                          } text-white`}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              {editingUser ? 'Mise à jour...' : 'Ajout...'}
                            </>
                          ) : (
                            <>
                              {editingUser ? (
                                <>
                                  <PencilIcon className="h-4 w-4 mr-1.5" />
                                  Mettre à jour
                                </>
                              ) : (
                                <>
                                  <PlusIcon className="h-4 w-4 mr-1.5" />
                                  Ajouter
                                </>
                              )}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              {/* Right Panel - List */}
              <div className="flex-1 flex flex-col min-h-0 bg-neutral-900">
                <div className="px-4 py-2 bg-neutral-800 border-b border-neutral-700">
                  <h3 className="text-sm font-medium text-neutral-100">
                    Utilisateurs existants
                    <span className="ml-2 text-xs text-neutral-400">
                      ({filteredUsers.length} résultats)
                    </span>
                  </h3>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <div className="divide-y divide-neutral-800">
                    <AnimatePresence mode="popLayout">
                      {filteredUsers.map((user) => (
                        <motion.div
                          key={user.id}
                          variants={listItemVariants}
                          initial="hidden"
                          animate={editingUser === user.name ? "editing" : "visible"}
                          exit="exit"
                          className="px-4 py-3 hover:bg-neutral-800 transition-colors duration-150"
                        >
                          <div className="flex items-center justify-between">
                            <motion.div 
                              className="flex-1 min-w-0"
                              whileHover={{ x: 5 }}
                              transition={{ type: "spring", stiffness: 400 }}
                            >
                              <p className="text-sm font-medium text-red-400 truncate">
                                {user.name}
                              </p>
                              <div className="mt-2 flex items-center text-sm text-neutral-400 space-x-4">
                                <span className="text-neutral-500">{user.email}</span>
                                <span className="text-neutral-500">{user.role}</span>
                                <div
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: user.color || '#000000' }}
                                />
                              </div>
                            </motion.div>
                            <div className="flex items-center space-x-2">
                              <Button
                                onClick={() => startEditing(user.name, user)}
                                variant="ghost"
                                className="text-red-400 hover:text-red-300 hover:bg-neutral-800"
                                disabled={isSubmitting}
                              >
                                <PencilIcon className="h-5 w-5" />
                              </Button>
                              <Button
                                onClick={() => handleDeleteUser(user)}
                                variant="ghost"
                                className="text-red-400 hover:text-red-300 hover:bg-neutral-800"
                                disabled={isSubmitting}
                              >
                                <TrashIcon className="h-5 w-5" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {filteredUsers.length === 0 && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="p-4 text-center text-neutral-400"
                      >
                        Aucun utilisateur trouvé
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>

      {/* Dialog pour le lien de configuration */}
      <Dialog open={isSetupLinkDialogOpen} onOpenChange={() => setIsSetupLinkDialogOpen(false)}>
        <DialogPortal>
          <DialogOverlay className="bg-black/30 backdrop-blur-sm" />
          <DialogContent className="max-w-lg p-6 bg-neutral-900 border border-neutral-800 shadow-2xl">
            <div className="space-y-4">
              <DialogTitle className="text-xl font-semibold text-neutral-100">
                Lien de configuration
              </DialogTitle>
              <div className="space-y-4">
                <div className="p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={setupLink || ''}
                      readOnly
                      className="flex-1 bg-neutral-900 border-neutral-700 text-neutral-400 text-xs"
                    />
                    <Button
                      onClick={() => {
                        if (setupLink) {
                          navigator.clipboard.writeText(setupLink);
                          setSuccess('Lien copié !');
                          setTimeout(() => setSuccess(null), 3000);
                        }
                      }}
                      variant="outline"
                      className="text-neutral-300 border-neutral-600 hover:bg-neutral-700"
                    >
                      Copier
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-neutral-500">
                    Envoyez ce lien à l&apos;employé pour qu&apos;il puisse configurer son compte.
                    Le lien est valable pendant 24 heures.
                  </p>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={() => setIsSetupLinkDialogOpen(false)}
                    variant="outline"
                    className="text-neutral-300 border-neutral-600 hover:bg-neutral-800"
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </Dialog>
  );
}