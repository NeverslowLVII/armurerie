import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { useAppDispatch } from '../redux/hooks';
import { updateUser, deleteUser } from '../redux/slices/userSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { PencilIcon, CheckIcon, XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import { SelectNative } from "@/components/ui/select-native";
import { Role } from '@/services/api';

interface Props {
  open: boolean;
  onClose: () => void;
  users: Record<string, any>;
  onUpdate: () => Promise<void>;
}

const modalVariants = {
  hidden: { 
    opacity: 0,
    scale: 0.95,
    y: 20
  },
  visible: { 
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      duration: 0.3,
      bounce: 0.25
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.2
    }
  }
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      duration: 0.2
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }
};

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

const textVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 }
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
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');

  const handleUserUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await dispatch(updateUser({ 
        id: users[editingUser]?.id,
        data: { 
          name: newUserName, 
          color: tempColor,
          role: tempRole,
          id: users[editingUser]?.id
        }
      }));
      await onUpdate();
      setSuccess('Informations mises à jour avec succès !');
      setEditingUser(null);
      // Reset form
      setNewUserName('');
      setTempColor('#000000');
      setTempRole(Role.EMPLOYEE);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Erreur lors de la mise à jour de l\'utilisateur');
      console.error('Error updating user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (name: string, user: any) => {
    setEditingUser(name);
    
    // Animation séquentielle des champs sans réinitialisation
    setTimeout(() => {
      setNewUserName(user.name);
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
    try {
      await dispatch(updateUser({ 
        data: { 
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword, 
          color: tempColor,
          role: tempRole,
        }
      }));
      await onUpdate();
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setTempColor('#000000');
      setTempRole(Role.EMPLOYEE);
      setSuccess('Utilisateur ajouté avec succès !');
      setTimeout(() => setSuccess(null), 3000);
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
    setNewUserEmail('');
    setNewUserPassword('');
    setTempColor('#000000');
    setTempRole(Role.EMPLOYEE);
  };

  const handleDeleteUser = async (user: any) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.name} ?`)) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await dispatch(deleteUser(user.id));
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

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onClose={onClose} className="fixed inset-0 z-10 overflow-hidden">
          <div className="flex items-center justify-center min-h-screen p-2">
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="fixed inset-0 bg-neutral-500 bg-opacity-75 transition-opacity backdrop-blur-sm dark:bg-neutral-900" />
            </motion.div>

            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-full max-w-7xl h-[85vh] flex flex-col"
            >
              <div className="p-3 border-b border-neutral-200 dark:border-neutral-700">
                <div className="flex justify-between items-center">
                  <Dialog.Title className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                    Gérer les utilisateurs
                  </Dialog.Title>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Rechercher un utilisateur..."
                        className="w-64 pl-4 pr-10 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-red-500 focus:border-red-500 dark:bg-neutral-700 dark:text-white"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <AnimatePresence>
                  {success && (
                    <motion.div
                      variants={successVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="mb-4 p-4 bg-green-100 text-green-700 rounded-md"
                    >
                      {success}
                    </motion.div>
                  )}
                  {error && (
                    <motion.div
                      variants={successVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="mb-4 p-4 bg-red-100 text-red-700 rounded-md"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleAddUser} className="mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Input
                      type="text"
                      placeholder="Nom de l'utilisateur"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      required
                      disabled={isSubmitting}
                      aria-label="nom de l'utilisateur"
                    />
                    <Input
                      type="email"
                      placeholder="Email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      required
                      disabled={isSubmitting}
                      aria-label="email"
                    />
                    <Input
                      type="password"
                      placeholder="Mot de passe"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      required
                      disabled={isSubmitting}
                      aria-label="mot de passe"
                    />
                    <SelectNative
                      value={tempRole}
                      onChange={(e) => setTempRole(e.target.value as Role)}
                      required
                      disabled={isSubmitting}
                      aria-label="rôle"
                    >
                      {Object.values(Role).map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </SelectNative>
                    <Input
                      type="color"
                      value={tempColor}
                      onChange={(e) => setTempColor(e.target.value)}
                      className="h-10"
                      disabled={isSubmitting}
                      aria-label="couleur"
                    />
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center justify-center gap-2"
                    >
                      <PlusIcon className="w-5 h-5" />
                      Ajouter
                    </Button>
                  </div>
                </form>

                <div className="space-y-4">
                  <AnimatePresence>
                    {Object.entries(users).map(([name, user]) => (
                      <motion.div
                        key={name}
                        variants={listItemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="bg-white dark:bg-neutral-700 p-4 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-600"
                      >
                        {editingUser === name ? (
                          <form onSubmit={handleUserUpdate} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <Input
                                type="text"
                                value={newUserName}
                                onChange={(e) => setNewUserName(e.target.value)}
                                required
                                disabled={isSubmitting}
                                aria-label="nom de l'utilisateur"
                              />
                              <SelectNative
                                value={tempRole}
                                onChange={(e) => setTempRole(e.target.value as Role)}
                                required
                                disabled={isSubmitting}
                                aria-label="rôle"
                              >
                                {Object.values(Role).map((role) => (
                                  <option key={role} value={role}>
                                    {role}
                                  </option>
                                ))}
                              </SelectNative>
                              <Input
                                type="color"
                                value={tempColor}
                                onChange={(e) => setTempColor(e.target.value)}
                                className="h-10"
                                disabled={isSubmitting}
                                aria-label="couleur"
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button
                                type="button"
                                onClick={handleCancel}
                                disabled={isSubmitting}
                                variant="outline"
                                className="flex items-center gap-2"
                              >
                                <XMarkIcon className="w-5 h-5" />
                                Annuler
                              </Button>
                              <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex items-center gap-2"
                              >
                                <CheckIcon className="w-5 h-5" />
                                Mettre à jour
                              </Button>
                            </div>
                          </form>
                        ) : (
                          <div className="flex items-center justify-between">
                            <motion.div variants={textVariants} className="flex items-center space-x-4">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: user.color || '#000000' }}
                              />
                              <span className="font-medium dark:text-white">{name}</span>
                              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                                {user.role}
                              </span>
                            </motion.div>
                            <div className="flex items-center space-x-2">
                              <Button
                                onClick={() => startEditing(name, user)}
                                variant="outline"
                                className="flex items-center gap-2"
                              >
                                <PencilIcon className="w-5 h-5" />
                                Modifier
                              </Button>
                              <Button
                                onClick={() => handleDeleteUser(user)}
                                variant="destructive"
                                className="flex items-center gap-2"
                              >
                                <TrashIcon className="w-5 h-5" />
                                Supprimer
                              </Button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}