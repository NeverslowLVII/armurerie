import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { deleteWeapon, Weapon } from '../services/api';
import EmployeeManager from './EmployeeManager';
import AddWeaponForm from './AddWeaponForm';
import EditWeaponForm from './EditWeaponForm';
import { LoginDialog } from './LoginDialog';
import { MagnifyingGlassIcon, PencilIcon, TrashIcon, LockClosedIcon, LockOpenIcon, UserGroupIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { BaseWeaponsManager } from './BaseWeaponsManager';
import { useData } from '../context/DataContext';
import { hasPermission, getRoleName } from '@/utils/roles';
import { Role } from '@/services/api';
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';

const tableVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 }
};

export default function WeaponsTable() {
  const { weapons, employees, loading, error: apiError, refreshWeapons, refreshEmployees } = useData();
  const [isColorManagerOpen, setIsColorManagerOpen] = useState(false);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isPatronLoggedIn, setIsPatronLoggedIn] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('patronAuth') === 'true';
  });
  const [isBaseWeaponsOpen, setIsBaseWeaponsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  const handleLogin = async (password: string) => {
    setLoginError(null);
    if (password === 'patron123') {
      setIsPatronLoggedIn(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('patronAuth', 'true');
      }
      setIsLoginOpen(false);
    } else {
      setLoginError("Mot de passe incorrect.");
    }
  };

  const handleLogout = () => {
    setIsPatronLoggedIn(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('patronAuth');
    }
  };

  const handleEdit = (weapon: Weapon) => {
    if (!isPatronLoggedIn) {
      setIsLoginOpen(true);
      return;
    }
    setSelectedWeapon(weapon);
    setIsEditFormOpen(true);
  };

  const handleDelete = async (weapon: Weapon) => {
    if (!isPatronLoggedIn) {
      setIsLoginOpen(true);
      return;
    }
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette arme ?')) {
      try {
        await deleteWeapon(weapon.id);
        // Mettre à jour la liste localement avant de rafraîchir
        const updatedWeapons = weapons.filter(w => w.id !== weapon.id);
        const newTotalPages = Math.ceil(updatedWeapons.length / itemsPerPage);
        if (currentPage > newTotalPages) {
          setCurrentPage(Math.max(1, newTotalPages));
        }
        // Rafraîchir les données
        await refreshWeapons();
      } catch (error) {
        console.error('Error deleting weapon:', error);
        if (error instanceof Error) {
          alert(`Erreur lors de la suppression : ${error.message}`);
        } else {
          alert('Une erreur est survenue lors de la suppression');
        }
      }
    }
  };

  const handleManageEmployees = () => {
    if (!isPatronLoggedIn) {
      setIsLoginOpen(true);
      return;
    }
    setIsColorManagerOpen(true);
  };

  const filteredWeapons = weapons.filter(weapon => {
    const searchLower = searchTerm.toLowerCase();
    return (
      weapon.employee.name.toLowerCase().includes(searchLower) ||
      weapon.detenteur.toLowerCase().includes(searchLower) ||
      weapon.nom_arme.toLowerCase().includes(searchLower) ||
      weapon.serigraphie.toLowerCase().includes(searchLower)
    );
  });

  const sortedAndFilteredWeapons = filteredWeapons.sort((a, b) => 
    new Date(b.horodateur).getTime() - new Date(a.horodateur).getTime()
  );

  // Get current items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedAndFilteredWeapons.slice(indexOfFirstItem, indexOfLastItem);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div data-testid="loading-spinner" className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 dark:border-neutral-300"></div>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-600">{apiError}</div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <motion.div 
        className="sm:flex sm:items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Registre des armes</h1>
          <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
            Liste des armes enregistrées dans le système.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex space-x-3">
          <Button
            type="button"
            onClick={() => isPatronLoggedIn ? handleLogout() : setIsLoginOpen(true)}
            className="block rounded-md bg-white dark:bg-neutral-800 px-3 py-2 text-sm font-semibold text-neutral-900 dark:text-white shadow-sm ring-1 ring-inset ring-neutral-300 dark:ring-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors duration-200"
          >
            {isPatronLoggedIn ? (
              <>
                <LockOpenIcon className="inline-block h-5 w-5 mr-1" />
                Déconnexion
              </>
            ) : (
              <>
                <LockClosedIcon className="inline-block h-5 w-5 mr-1" />
                Connexion Patron
              </>
            )}
          </Button>
          <Button
            type="button"
            onClick={handleManageEmployees}
            className={`block rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset transition-colors duration-200 ${
              isPatronLoggedIn && hasPermission(Role.PATRON, 'canManageEmployees')
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ring-neutral-300 dark:ring-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-300 ring-neutral-200 dark:ring-neutral-500 cursor-not-allowed'
            }`}
            disabled={!isPatronLoggedIn || !hasPermission(Role.PATRON, 'canManageEmployees')}
          >
            <UserGroupIcon className="inline-block h-5 w-5 mr-1" />
            Gérer les employés
          </Button>
          <Button
            type="button"
            onClick={() => isPatronLoggedIn ? setIsBaseWeaponsOpen(true) : setIsLoginOpen(true)}
            className={`block rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset transition-colors duration-200 ${
              isPatronLoggedIn && hasPermission(Role.PATRON, 'canManageBaseWeapons')
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ring-neutral-300 dark:ring-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-300 ring-neutral-200 dark:ring-neutral-500 cursor-not-allowed'
            }`}
            disabled={!isPatronLoggedIn || !hasPermission(Role.PATRON, 'canManageBaseWeapons')}
          >
            <SparklesIcon className="inline-block h-5 w-5 mr-1" />
            Gérer les armes de base
          </Button>
          <Button
            type="button"
            onClick={() => setIsAddFormOpen(true)}
            className="block rounded-md bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-700 dark:to-orange-700 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:from-red-500 hover:to-orange-500 dark:hover:from-red-600 dark:hover:to-orange-600 transition-all duration-200"
          >
            Ajouter une arme
          </Button>
        </div>
      </motion.div>

      <motion.div 
        className="mt-8 mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-neutral-400" aria-hidden="true" />
          </div>
          <Input
            type="text"
            className="block w-full rounded-lg border-0 py-2 pl-10 pr-3 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ring-1 ring-inset ring-neutral-300 dark:ring-neutral-600 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:ring-2 focus:ring-inset focus:ring-red-600 sm:text-sm sm:leading-6 transition-all duration-200"
            placeholder="Rechercher une arme, un détenteur, un employé..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </motion.div>

      <motion.div 
        className="mt-8 flow-root"
        variants={tableVariants}
        initial="hidden"
        animate="show"
      >
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle">
            <div className="overflow-hidden shadow-lg ring-1 ring-black ring-opacity-5 sm:rounded-lg bg-white dark:bg-neutral-800">
              <table className="min-w-full divide-y divide-neutral-300 dark:divide-neutral-700">
                <thead className="bg-neutral-50 dark:bg-neutral-900">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-200 sm:pl-6">
                      Date et heure
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-200">
                      Employé
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-200">
                      Détenteur
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-200">
                      Nom de l'arme
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-200">
                      Sérigraphie
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-200">
                      Prix
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700 bg-white dark:bg-neutral-800">
                  <AnimatePresence>
                    {currentItems.map((weapon) => (
                      <motion.tr
                        key={weapon.id}
                        variants={rowVariants}
                        initial="hidden"
                        animate="show"
                        exit="hidden"
                        className="hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors duration-200"
                      >
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-neutral-900 dark:text-neutral-200 sm:pl-6">
                          {new Date(weapon.horodateur).toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <motion.span
                            whileHover={{ scale: 1.05 }}
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              weapon.employee.color ? 'text-white' : 'text-neutral-900 bg-neutral-100'
                            }`}
                            style={weapon.employee.color ? { backgroundColor: weapon.employee.color } : {}}
                          >
                            {weapon.employee.name}
                            {weapon.employee.role !== Role.EMPLOYEE && (
                              <span className="ml-1 text-xs">({getRoleName(weapon.employee.role as Role)})</span>
                            )}
                          </motion.span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-neutral-900 dark:text-neutral-200">{weapon.detenteur}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-neutral-900 dark:text-neutral-200">{weapon.nom_arme}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-neutral-900 dark:text-neutral-200">{weapon.serigraphie}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-neutral-900 dark:text-neutral-200">
                          {(weapon.prix / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex justify-end gap-2">
                            <Button
                              onClick={() => handleEdit(weapon)}
                              className={`text-red-600 hover:text-red-900 ${!isPatronLoggedIn && 'opacity-50 cursor-not-allowed'}`}
                              disabled={!isPatronLoggedIn || !hasPermission(Role.PATRON, 'canEditWeapons')}
                              title="Modifier l'arme"
                            >
                              <span className="sr-only">Modifier l'arme</span>
                              <PencilIcon className="h-5 w-5" aria-hidden="true" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(weapon)}
                              className={`text-red-600 hover:text-red-900 ${!isPatronLoggedIn && 'opacity-50 cursor-not-allowed'}`}
                              disabled={!isPatronLoggedIn || !hasPermission(Role.PATRON, 'canDeleteWeapons')}
                              title="Supprimer l'arme"
                            >
                              <span className="sr-only">Supprimer l'arme</span>
                              <TrashIcon className="h-5 w-5" aria-hidden="true" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Pagination */}
      <motion.div 
        className="mt-4 flex items-center justify-between"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center">
          <span className="text-sm text-neutral-700 dark:text-neutral-300">
            Affichage de {indexOfFirstItem + 1} à {Math.min(indexOfLastItem, sortedAndFilteredWeapons.length)} sur {sortedAndFilteredWeapons.length} entrées
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-md ${
              currentPage === 1
                ? 'bg-neutral-100 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-300 cursor-not-allowed'
                : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-700 border dark:border-neutral-600'
            }`}
          >
            Précédent
          </Button>
          {Array.from({ length: Math.ceil(sortedAndFilteredWeapons.length / itemsPerPage) }).map((_, index) => (
            <Button
              key={index + 1}
              onClick={() => paginate(index + 1)}
              className={`px-3 py-1 rounded-md ${
                currentPage === index + 1
                  ? 'bg-gradient-to-r from-red-600 to-orange-600 dark:bg-gradient-to-r dark:from-red-700 dark:to-orange-700 text-white'
                  : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-700 border dark:border-neutral-600'
              }`}
            >
              {index + 1}
            </Button>
          ))}
          <Button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === Math.ceil(sortedAndFilteredWeapons.length / itemsPerPage)}
            className={`px-3 py-1 rounded-md ${
              currentPage === Math.ceil(sortedAndFilteredWeapons.length / itemsPerPage)
                ? 'bg-neutral-100 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-300 cursor-not-allowed'
                : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-700 border dark:border-neutral-600'
            }`}
          >
            Suivant
          </Button>
        </div>
      </motion.div>

      <LoginDialog
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLogin={handleLogin}
        error={loginError}
      />

      <EmployeeManager
        open={isColorManagerOpen}
        onClose={() => setIsColorManagerOpen(false)}
        employees={employees}
        onUpdate={async () => {
          await Promise.all([
            refreshEmployees(),
            refreshWeapons()
          ]);
        }}
      />

      <AddWeaponForm
        isOpen={isAddFormOpen}
        onClose={() => setIsAddFormOpen(false)}
        onWeaponAdded={refreshWeapons}
      />

      <EditWeaponForm
        isOpen={isEditFormOpen}
        onClose={() => setIsEditFormOpen(false)}
        weapon={selectedWeapon}
        onWeaponUpdated={refreshWeapons}
      />

      <BaseWeaponsManager
        isOpen={isBaseWeaponsOpen}
        onClose={() => setIsBaseWeaponsOpen(false)}
      />
    </div>
  );
} 