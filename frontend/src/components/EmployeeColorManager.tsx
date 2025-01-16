import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { Employee, updateEmployee, EmployeeCreate, mergeEmployees, deleteEmployee, getEmployeeWeapons, reassignWeapons, createEmployee } from '../services/api';
import { PencilIcon, TrashIcon, UserPlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

type Role = "EMPLOYEE" | "CO_PATRON" | "PATRON";

interface EmployeeColorManagerProps {
  open: boolean;
  onClose: () => void;
  employees: Employee[];
  onUpdate?: () => void;
}

interface ColorOption {
  color: string;
  name: string;
}

const DEFAULT_COLORS: ColorOption[] = [
  { color: '#EF4444', name: 'Rouge' },
  { color: '#F97316', name: 'Orange' },
  { color: '#F59E0B', name: 'Ambre' },
  { color: '#84CC16', name: 'Lime' },
  { color: '#10B981', name: 'Émeraude' },
  { color: '#06B6D4', name: 'Cyan' },
  { color: '#3B82F6', name: 'Bleu' },
  { color: '#6366F1', name: 'Indigo' },
  { color: '#8B5CF6', name: 'Violet' },
  { color: '#EC4899', name: 'Rose' },
];

interface RoleInfo {
    value: Role;
    label: string;
    description: string;
    commission: number;
}

const ROLES: RoleInfo[] = [
    {
        value: "EMPLOYEE",
        label: "Employé",
        description: "Vendeur standard avec accès aux fonctionnalités de base",
        commission: 20
    },
    {
        value: "CO_PATRON",
        label: "Co-Patron",
        description: "Accès étendu et commission majorée",
        commission: 30
    },
    {
        value: "PATRON",
        label: "Patron",
        description: "Accès complet à toutes les fonctionnalités",
        commission: 30
    }
];

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
        backgroundColor: "rgba(255, 255, 255, 0)",
        transition: {
            duration: 0.2
        }
    },
    hover: {
        backgroundColor: "rgba(243, 244, 246, 0.8)",
        transition: {
            duration: 0.1
        }
    }
};

export default function EmployeeColorManager({ open, onClose, employees, onUpdate }: EmployeeColorManagerProps) {
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [newName, setNewName] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeColor, setNewEmployeeColor] = useState<string | null>(null);

  useEffect(() => {
    setSelectedEmployees(new Set());
    setEditingEmployee(null);
    setNewName('');
    setError(null);
  }, [employees]);

  const handleColorChange = async (employee: Employee, color: string) => {
    try {
      const updateData: EmployeeCreate = {
        name: employee.name,
        ...(color && { color }),
      };
      await updateEmployee(employee.id, updateData);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating employee color:', error);
    }
  };

  const handleRename = async (employee: Employee) => {
    if (newName && newName !== employee.name) {
      try {
        const updateData: EmployeeCreate = {
          name: newName,
          ...(employee.color && { color: employee.color }),
          role: employee.role
        };
        await updateEmployee(employee.id, updateData);
        setEditingEmployee(null);
        setNewName('');
        if (onUpdate) onUpdate();
      } catch (error) {
        console.error('Error updating employee name:', error);
      }
    }
  };

  const handleRoleChange = async (employee: Employee, newRole: string) => {
    try {
        const updateData: EmployeeCreate = {
            name: employee.name,
            ...(employee.color && { color: employee.color }),
            role: newRole as Role
        };
        await updateEmployee(employee.id, updateData);
        if (onUpdate) onUpdate();
    } catch (error) {
        console.error('Error updating employee role:', error);
    }
  };

  const handleMerge = async () => {
    if (selectedEmployees.size > 1) {
      const employeesToMerge = Array.from(selectedEmployees)
        .map(id => employees.find(e => e.id === id))
        .filter((e): e is Employee => e !== undefined);

      if (employeesToMerge.length > 1) {
        try {
          const targetEmployee = employeesToMerge[0];
          const employeeIds = employeesToMerge.map(e => e.id);
          await mergeEmployees(employeeIds, targetEmployee.id);
          setSelectedEmployees(new Set());
          if (onUpdate) onUpdate();
        } catch (error) {
          console.error('Error merging employees:', error);
        }
      }
    }
  };

  const handleDelete = async (employee: Employee) => {
    try {
      const weapons = await getEmployeeWeapons(employee.id);
      
      if (weapons.length > 0) {
        const otherEmployees = employees.filter(e => e.id !== employee.id);
        if (otherEmployees.length === 0) {
          setError("Impossible de supprimer le dernier employé avec des armes.");
          return;
        }

        const targetEmployee = otherEmployees[0];
        const confirmMessage = `L'employé ${employee.name} a ${weapons.length} armes. Voulez-vous les réassigner à ${targetEmployee.name} avant de le supprimer ?`;
        
        if (window.confirm(confirmMessage)) {
          await reassignWeapons(employee.id, targetEmployee.id);
          await deleteEmployee(employee.id);
          if (onUpdate) onUpdate();
        }
      } else {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'employé ${employee.name} ?`)) {
          await deleteEmployee(employee.id);
          if (onUpdate) onUpdate();
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Erreur lors de la suppression');
      }
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleAddEmployee = async () => {
    if (!newEmployeeName.trim()) {
      setError("Le nom de l'employé est requis");
      return;
    }

    try {
      const newEmployee: EmployeeCreate = {
        name: newEmployeeName.trim(),
        ...(newEmployeeColor && { color: newEmployeeColor }),
        role: "EMPLOYEE"
      };
      await createEmployee(newEmployee);
      setNewEmployeeName('');
      setNewEmployeeColor(null);
      setIsAddingEmployee(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error creating employee:', error);
      setError("Erreur lors de la création de l'employé");
    }
  };

  return (
    <Dialog as="div" className="relative z-50" open={open} onClose={onClose}>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30"
            />

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl"
                >
                  <div className="flex items-center justify-between bg-white px-4 py-4 sm:px-6">
                    <Dialog.Title className="text-base font-semibold leading-6 text-gray-900">
                      Gestion des employés
                    </Dialog.Title>
                    <button
                      type="button"
                      className="rounded-md text-gray-400 hover:text-gray-500"
                      onClick={onClose}
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="px-4 pb-6 sm:px-6">
                    {error && (
                      <div className="mb-4 rounded-md bg-red-50 p-4">
                        <div className="text-sm text-red-700">{error}</div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <button
                          type="button"
                          onClick={() => setIsAddingEmployee(true)}
                          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                        >
                          <UserPlusIcon className="h-5 w-5" />
                          Nouvel employé
                        </button>
                      </div>

                      {isAddingEmployee && (
                        <motion.div
                          initial="hidden"
                          animate="visible"
                          variants={listItemVariants}
                          className="bg-gray-50 p-4 rounded-md space-y-4"
                        >
                          <h4 className="text-sm font-medium text-gray-900">Ajouter un nouvel employé</h4>
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={newEmployeeName}
                              onChange={(e) => setNewEmployeeName(e.target.value)}
                              placeholder="Nom de l'employé"
                              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                            />
                            <div className="flex items-center gap-2 flex-wrap">
                              {DEFAULT_COLORS.map(({ color, name }) => (
                                <button
                                  key={color}
                                  type="button"
                                  className={`group relative rounded-full p-0.5 ${
                                    newEmployeeColor === color
                                      ? 'ring-2 ring-gray-900'
                                      : 'hover:ring-2 hover:ring-gray-400'
                                  }`}
                                  onClick={() => setNewEmployeeColor(color)}
                                >
                                  <div
                                    className="h-8 w-8 rounded-full"
                                    style={{ backgroundColor: color }}
                                  />
                                  <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100">
                                    {name}
                                  </span>
                                </button>
                              ))}
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAddingEmployee(false);
                                  setNewEmployeeName('');
                                  setNewEmployeeColor(null);
                                }}
                                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                              >
                                Annuler
                              </button>
                              <button
                                type="button"
                                onClick={handleAddEmployee}
                                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                              >
                                Ajouter
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {selectedEmployees.size > 1 && (
                        <motion.div
                          initial="hidden"
                          animate="visible"
                          variants={listItemVariants}
                          className="mb-4 flex justify-between items-center bg-blue-50 p-4 rounded-md"
                        >
                          <span className="text-sm text-blue-700">
                            {selectedEmployees.size} employés sélectionnés
                          </span>
                          <button
                            type="button"
                            onClick={handleMerge}
                            className="text-sm font-medium text-blue-700 hover:text-blue-600"
                          >
                            Fusionner les employés
                          </button>
                        </motion.div>
                      )}

                      <AnimatePresence>
                        {employees.map((employee) => {
                          const isEditing = editingEmployee?.id === employee.id;
                          const isSelected = selectedEmployees.has(employee.id);

                          return (
                            <motion.div
                              key={employee.id}
                              initial="hidden"
                              animate="visible"
                              exit="hidden"
                              variants={listItemVariants}
                              whileHover="hover"
                              className="p-4 rounded-lg space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {
                                      const newSelection = new Set(selectedEmployees);
                                      if (newSelection.has(employee.id)) {
                                        newSelection.delete(employee.id);
                                      } else {
                                        newSelection.add(employee.id);
                                      }
                                      setSelectedEmployees(newSelection);
                                    }}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                  />
                                  {isEditing ? (
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="block rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                                        placeholder="Nouveau nom"
                                      />
                                      <button
                                        onClick={() => handleRename(employee)}
                                        className="text-sm text-indigo-600 hover:text-indigo-900"
                                      >
                                        Sauvegarder
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <span 
                                        className={`text-sm font-medium px-3 py-1 rounded-full ${
                                          employee.color ? 'text-white' : 'text-gray-900 bg-gray-100'
                                        }`}
                                        style={employee.color ? { backgroundColor: employee.color } : undefined}
                                      >
                                        {employee.name}
                                      </span>
                                      <div className="relative group">
                                        <select
                                          value={employee.role}
                                          onChange={(e) => handleRoleChange(employee, e.target.value)}
                                          className="text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        >
                                          {ROLES.map(role => (
                                            <option key={role.value} value={role.value}>
                                              {role.label}
                                            </option>
                                          ))}
                                        </select>
                                        <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-md shadow-lg p-4 hidden group-hover:block z-10">
                                          <div className="text-xs text-gray-500">
                                            {ROLES.find(r => r.value === employee.role)?.description}
                                            <div className="mt-1 font-medium text-indigo-600">
                                              Commission: {ROLES.find(r => r.value === employee.role)?.commission}%
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={() => {
                                            setEditingEmployee(employee);
                                            setNewName(employee.name);
                                          }}
                                          className="text-gray-400 hover:text-gray-600"
                                        >
                                          <PencilIcon className="h-4 w-4" />
                                        </button>
                                        <button
                                          onClick={() => handleDelete(employee)}
                                          className="text-red-400 hover:text-red-600"
                                        >
                                          <TrashIcon className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                {DEFAULT_COLORS.map(({ color, name }) => (
                                  <button
                                    key={color}
                                    type="button"
                                    className={`group relative rounded-full p-0.5 ${
                                      employee.color === color
                                        ? 'ring-2 ring-gray-900'
                                        : 'hover:ring-2 hover:ring-gray-400'
                                    }`}
                                    onClick={() => handleColorChange(employee, color)}
                                  >
                                    <div
                                      className="h-8 w-8 rounded-full"
                                      style={{ backgroundColor: color }}
                                    />
                                    <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100">
                                      {name}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </>
        )}
      </AnimatePresence>
    </Dialog>
  );
}