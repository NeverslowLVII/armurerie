import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { useAppDispatch } from '../redux/hooks';
import { updateEmployee, deleteEmployee } from '../redux/slices/employeeSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { PencilIcon, CheckIcon, XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import { SelectNative } from "@/components/ui/select-native";
interface Props {
  open: boolean;
  onClose: () => void;
  employees: Record<string, any>;
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

export default function EmployeeManager({ open, onClose, employees, onUpdate }: Props) {
  const dispatch = useAppDispatch();
  const [editingEmployee, setEditingEmployee] = useState<string | null>(null);
  const [tempColor, setTempColor] = useState('#000000');
  const [tempRole, setTempRole] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newEmployeeName, setNewEmployeeName] = useState('');

  const handleEmployeeUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await dispatch(updateEmployee({ 
        id: employees[editingEmployee]?.id,
        data: { 
          name: newEmployeeName, 
          color: tempColor,
          role: tempRole,
          id: employees[editingEmployee]?.employee_id
        }
      }));
      await onUpdate();
      setSuccess('Informations mises à jour avec succès !');
      setEditingEmployee(null);
      // Reset form
      setNewEmployeeName('');
      setTempColor('#000000');
      setTempRole('');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Erreur lors de la mise à jour de l\'employé');
      console.error('Error updating employee:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (name: string, employee: any) => {
    setEditingEmployee(name);
    
    // Animation séquentielle des champs sans réinitialisation
    setTimeout(() => {
      setNewEmployeeName(employee.name);
      setTimeout(() => {
        setTempColor(employee.color || '#000000');
        setTimeout(() => {
          setTempRole(employee.role || '');
        }, 100);
      }, 100);
    }, 100);
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await dispatch(updateEmployee({ 
        data: { 
          name: newEmployeeName, 
          color: tempColor,
          role: tempRole,
        }
      }));
      await onUpdate();
      setNewEmployeeName('');
      setTempColor('#000000');
      setTempRole('');
      setSuccess('Employé ajouté avec succès !');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Erreur lors de l\'ajout de l\'employé');
      console.error('Error adding employee:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditingEmployee(null);
    setNewEmployeeName('');
    setTempColor('#000000');
    setTempRole('');
  };

  const handleDeleteEmployee = async (employee: any) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'employé ${employee.name} ?`)) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await dispatch(deleteEmployee(employee.id));
      await onUpdate();
      setSuccess('Employé supprimé avec succès !');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Erreur lors de la suppression de l\'employé');
      console.error('Error deleting employee:', error);
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
                    Gérer les employés
                  </Dialog.Title>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Rechercher un employé..."
                        className="w-64 pl-4 pr-10 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-red-500 focus:border-red-500 dark:bg-neutral-700 dark:text-white"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="h-4 w-4 text-neutral-400 dark:text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                    <Button
                      onClick={onClose}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-neutral-600 dark:bg-neutral-700 hover:bg-neutral-700 dark:hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500"
                    >
                      Fermer
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex flex-1 min-h-0">
                {/* Panneau de gauche - Formulaire */}
                <div className="w-1/3 border-r border-neutral-200 dark:border-neutral-700 p-4 overflow-y-auto">
                  {error && (
                    <div className="mb-3 p-2 bg-red-100 dark:bg-red-800 border-l-4 border-red-500 dark:border-red-700 text-red-700 dark:text-red-300 text-sm rounded">
                      {error}
                    </div>
                  )}

                  {success && (
                    <motion.div 
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={successVariants}
                      className="mb-3 p-2 bg-green-100 dark:bg-green-800 border-l-4 border-green-500 dark:border-green-700 text-green-700 dark:text-green-300 text-sm rounded"
                    >
                      {success}
                    </motion.div>
                  )}

                  <form onSubmit={editingEmployee ? handleEmployeeUpdate : handleAddEmployee} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Nom de l'employé
                      </label>
                      <motion.div
                        initial="initial"
                        animate="animate"
                        variants={textVariants}
                        className="block w-full"
                      >
                        <Input
                          type="text"
                          value={newEmployeeName}
                          onChange={(e) => setNewEmployeeName(e.target.value)}
                          className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-neutral-300 dark:border-neutral-600 rounded-md dark:bg-neutral-700 dark:text-white"
                          required
                          disabled={isSubmitting}
                        />
                      </motion.div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Rôle
                      </label>
                      <motion.div
                        initial="initial"
                        animate="animate"
                        variants={textVariants}
                        className="block w-full"
                      >
                        <SelectNative
                          value={tempRole}
                          onChange={(e) => setTempRole(e.target.value)}
                          className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-neutral-300 dark:border-neutral-600 rounded-md dark:bg-neutral-700 dark:text-white"
                          required
                          disabled={isSubmitting}
                        >
                          <option value="">Sélectionner un rôle</option>
                          <option value="EMPLOYEE">Employé</option>
                          <option value="CO_PATRON">Co-Patron</option>
                          <option value="PATRON">Patron</option>
                        </SelectNative>
                      </motion.div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Couleur
                      </label>
                      <motion.div
                        initial="initial"
                        animate="animate"
                        variants={textVariants}
                        className="block w-full"
                      >
                        <Input
                          type="color"
                          value={tempColor}
                          onChange={(e) => setTempColor(e.target.value)}
                          className="w-full h-10 rounded cursor-pointer dark:bg-neutral-800 dark:border-neutral-600"
                          disabled={isSubmitting}
                        />
                      </motion.div>
                    </div>

                    <div className="pt-2">
                      <div className="flex justify-between space-x-2">
                        {editingEmployee && (
                          <Button
                            type="button"
                            onClick={handleCancel}
                            className="inline-flex items-center px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 shadow-sm text-sm font-medium rounded-md text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            disabled={isSubmitting}
                          >
                            <XMarkIcon className="h-4 w-4 mr-1.5" />
                            Annuler
                          </Button>
                        )}
                        <Button
                          type="submit"
                          className={`flex-1 inline-flex justify-center items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                            isSubmitting
                              ? 'bg-red-400 dark:bg-red-300'
                              : 'bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600'
                          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              {editingEmployee ? 'Mise à jour...' : 'Ajout...'}
                            </>
                          ) : (
                            <>
                              {editingEmployee ? (
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

                {/* Panneau de droite - Liste */}
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        Employés existants
                        <span className="ml-2 text-xs text-neutral-500 dark:text-neutral-400">
                          ({Object.keys(employees).length} résultats)
                        </span>
                      </h3>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {success && (
                      <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="m-4 p-2 bg-green-100 dark:bg-green-800 border-l-4 border-green-500 dark:border-green-700 text-green-700 dark:text-green-300 text-sm rounded"
                      >
                        {success}
                      </motion.div>
                    )}

                    <div className="space-y-2 p-4">
                      <AnimatePresence mode="popLayout">
                        {Object.entries(employees).map(([id, employee]: [string, any]) => (
                          <motion.div
                            key={id}
                            variants={listItemVariants}
                            initial="hidden"
                            animate={editingEmployee === id ? "editing" : "visible"}
                            exit="exit"
                            layout
                            className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors duration-150"
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                  <span className="text-lg font-medium text-red-600 dark:text-red-400">{employee.name}</span>
                                  <span className="text-sm text-neutral-500 dark:text-neutral-400">{employee.role}</span>
                                </div>
                                {editingEmployee === id ? (
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      onClick={(e) => handleEmployeeUpdate(e as React.FormEvent)}
                                      className="p-2 text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-500 rounded-full hover:bg-green-50 dark:hover:bg-green-800"
                                    >
                                      <CheckIcon className="h-5 w-5" />
                                    </Button>
                                    <Button
                                      onClick={() => setEditingEmployee(null)}
                                      className="p-2 text-neutral-400 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-full hover:bg-neutral-50 dark:hover:bg-neutral-800"
                                    >
                                      <XMarkIcon className="h-5 w-5" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      onClick={() => startEditing(id, employee)}
                                      className="p-2 text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-800"
                                    >
                                      <PencilIcon className="h-5 w-5" />
                                    </Button>
                                    <Button
                                      onClick={() => handleDeleteEmployee(employee)}
                                      className="p-2 text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-800"
                                    >
                                      <TrashIcon className="h-5 w-5" />
                                    </Button>
                                  </div>
                                )}
                              </div>

                              {editingEmployee === id ? (
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                      Rôle
                                    </label>
                                    <SelectNative
                                      value={tempRole}
                                      onChange={(e) => setTempRole(e.target.value)}
                                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 dark:bg-neutral-700 dark:text-white"
                                    >
                                      <option value="">Sélectionner un rôle</option>
                                      <option value="EMPLOYEE">Employé</option>
                                      <option value="CO_PATRON">Co-Patron</option>
                                      <option value="PATRON">Patron</option>
                                    </SelectNative>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                      Couleur
                                    </label>
                                    <Input
                                      type="color"
                                      value={tempColor}
                                      onChange={(e) => setTempColor(e.target.value)}
                                      className="w-full h-10 rounded cursor-pointer dark:bg-neutral-800 dark:border-neutral-600"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <div 
                                    className="w-4 h-4 rounded"
                                    style={{ backgroundColor: employee.color || '#000000' }}
                                  />
                                  <span className="text-sm text-neutral-500 dark:text-neutral-400">
                                    {employee.color || 'Couleur par défaut'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}