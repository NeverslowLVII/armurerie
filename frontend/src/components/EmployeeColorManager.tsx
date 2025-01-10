import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { Employee, updateEmployee, EmployeeCreate, mergeEmployees, deleteEmployee, getEmployeeWeapons, reassignWeapons, createEmployee } from '../services/api';
import { PencilIcon, TrashIcon, UserPlusIcon } from '@heroicons/react/24/outline';

interface EmployeeColorManagerProps {
  open: boolean;
  setOpen: (open: boolean) => void;
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

export default function EmployeeColorManager({ open, setOpen, employees, onUpdate }: EmployeeColorManagerProps) {
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [newName, setNewName] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeColor, setNewEmployeeColor] = useState<string | null>(null);

  const handleColorChange = async (employee: Employee, color: string) => {
    try {
      const updateData: EmployeeCreate = {
        name: employee.name,
        color: color
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
          color: employee.color || undefined
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
      // Vérifier d'abord si l'employé a des armes
      const weapons = await getEmployeeWeapons(employee.id);
      
      if (weapons.length > 0) {
        // S'il y a des armes, demander à l'utilisateur de choisir un autre employé
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
        // Si pas d'armes, simplement confirmer et supprimer
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'employé ${employee.name} ?`)) {
          await deleteEmployee(employee.id);
          if (onUpdate) onUpdate();
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as { response?: { data?: { detail?: string } } };
        setError(axiosError.response?.data?.detail || 'Erreur lors de la suppression');
      } else {
        setError('Erreur lors de la suppression');
      }
      setTimeout(() => setError(null), 5000);
    }
  };

  const toggleEmployeeSelection = (employee: Employee) => {
    const newSelection = new Set(selectedEmployees);
    if (newSelection.has(employee.id)) {
      newSelection.delete(employee.id);
    } else {
      newSelection.add(employee.id);
    }
    setSelectedEmployees(newSelection);
  };

  const handleAddEmployee = async () => {
    if (!newEmployeeName.trim()) {
      setError("Le nom de l'employé est requis");
      return;
    }

    try {
      const newEmployee: EmployeeCreate = {
        name: newEmployeeName.trim(),
        color: newEmployeeColor || undefined
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
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div>
                  <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                      Gestion des employés
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Gérez les employés et leurs couleurs associées. Seuls les patrons peuvent effectuer ces modifications.
                      </p>
                    </div>
                  </div>
                  {error && (
                    <div className="mt-2 rounded-md bg-red-50 p-4">
                      <div className="text-sm text-red-700">{error}</div>
                    </div>
                  )}
                  <div className="mt-4 space-y-6">
                    <div className="flex justify-between items-center">
                      <button
                        type="button"
                        onClick={() => setIsAddingEmployee(true)}
                        className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                      >
                        <UserPlusIcon className="h-5 w-5" />
                        Nouvel employé
                      </button>
                    </div>

                    {isAddingEmployee && (
                      <div className="bg-gray-50 p-4 rounded-md space-y-4">
                        <h4 className="text-sm font-medium text-gray-900">Ajouter un nouvel employé</h4>
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={newEmployeeName}
                            onChange={(e) => setNewEmployeeName(e.target.value)}
                            placeholder="Nom de l'employé"
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
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
                              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            >
                              Ajouter
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedEmployees.size > 1 && (
                      <div className="mb-4 flex justify-between items-center bg-blue-50 p-4 rounded-md">
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
                      </div>
                    )}
                    {employees.map((employee) => {
                      const isEditing = editingEmployee?.id === employee.id;
                      const isSelected = selectedEmployees.has(employee.id);

                      return (
                        <div key={employee.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleEmployeeSelection(employee)}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                              />
                              {isEditing ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="block rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
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
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onClick={() => setOpen(false)}
                  >
                    Fermer
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 