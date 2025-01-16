import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { deleteWeapon, Weapon } from '../services/api';
import EmployeeColorManager from './EmployeeColorManager';
import AddWeaponForm from './AddWeaponForm';
import EditWeaponForm from './EditWeaponForm';
import LoginDialog from './LoginDialog';
import { MagnifyingGlassIcon, PencilIcon, TrashIcon, LockClosedIcon, LockOpenIcon, UserGroupIcon, SparklesIcon } from '@heroicons/react/24/outline';
import BaseWeaponsManager from './BaseWeaponsManager';
import { useData } from '../context/DataContext';

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
  const { weapons, employees, loading, error, refreshWeapons, refreshEmployees } = useData();
  const [isColorManagerOpen, setIsColorManagerOpen] = useState(false);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isPatronLoggedIn, setIsPatronLoggedIn] = useState(false);
  const [isBaseWeaponsOpen, setIsBaseWeaponsOpen] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const handleLogin = (password: string) => {
    if (password === 'patron123') {
      setIsPatronLoggedIn(true);
    }
  };

  const handleLogout = () => {
    setIsPatronLoggedIn(false);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-600">{error}</div>
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
          <h1 className="text-2xl font-semibold text-gray-900">Registre des armes</h1>
          <p className="mt-2 text-sm text-gray-700">
            Liste des armes enregistrées dans le système.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => isPatronLoggedIn ? handleLogout() : setIsLoginOpen(true)}
            className="block rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors duration-200"
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
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={handleManageEmployees}
            className={`block rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset transition-colors duration-200 ${
              isPatronLoggedIn
                ? 'bg-white text-gray-900 ring-gray-300 hover:bg-gray-50'
                : 'bg-gray-100 text-gray-400 ring-gray-200 cursor-not-allowed'
            }`}
            disabled={!isPatronLoggedIn}
          >
            <UserGroupIcon className="inline-block h-5 w-5 mr-1" />
            Gérer les employés
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => isPatronLoggedIn ? setIsBaseWeaponsOpen(true) : setIsLoginOpen(true)}
            className={`block rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset transition-colors duration-200 ${
              isPatronLoggedIn
                ? 'bg-white text-gray-900 ring-gray-300 hover:bg-gray-50'
                : 'bg-gray-100 text-gray-400 ring-gray-200 cursor-not-allowed'
            }`}
            disabled={!isPatronLoggedIn}
          >
            <SparklesIcon className="inline-block h-5 w-5 mr-1" />
            Gérer les armes de base
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setIsAddFormOpen(true)}
            className="block rounded-md bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:from-indigo-500 hover:to-purple-500 transition-all duration-200"
          >
            Ajouter une arme
          </motion.button>
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
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            className="block w-full rounded-lg border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-all duration-200"
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
            <div className="overflow-hidden shadow-lg ring-1 ring-black ring-opacity-5 sm:rounded-lg bg-white/80 backdrop-blur-sm">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Date et heure
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Employé
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Détenteur
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Nom de l'arme
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Sérigraphie
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Prix
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white/50">
                  <AnimatePresence>
                    {currentItems.map((weapon) => (
                      <motion.tr
                        key={weapon.id}
                        variants={rowVariants}
                        initial="hidden"
                        animate="show"
                        exit="hidden"
                        whileHover={{ backgroundColor: "rgba(249, 250, 251, 0.5)" }}
                        className="transition-colors duration-200"
                      >
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">
                          {new Date(weapon.horodateur).toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <motion.span
                            whileHover={{ scale: 1.05 }}
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              weapon.employee.color ? 'text-white' : 'text-gray-900 bg-gray-100'
                            }`}
                            style={weapon.employee.color ? { backgroundColor: weapon.employee.color } : {}}
                          >
                            {weapon.employee.name}
                            {weapon.employee.role === "PATRON" && (
                              <span className="ml-1 text-xs">(Patron)</span>
                            )}
                          </motion.span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{weapon.detenteur}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{weapon.nom_arme}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{weapon.serigraphie}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          {(weapon.prix / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex justify-end gap-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleEdit(weapon)}
                              className={`text-indigo-600 hover:text-indigo-900 ${!isPatronLoggedIn && 'opacity-50 cursor-not-allowed'}`}
                              disabled={!isPatronLoggedIn}
                            >
                              <PencilIcon className="h-5 w-5" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDelete(weapon)}
                              className={`text-red-600 hover:text-red-900 ${!isPatronLoggedIn && 'opacity-50 cursor-not-allowed'}`}
                              disabled={!isPatronLoggedIn}
                            >
                              <TrashIcon className="h-5 w-5" />
                            </motion.button>
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
          <span className="text-sm text-gray-700">
            Affichage de {indexOfFirstItem + 1} à {Math.min(indexOfLastItem, sortedAndFilteredWeapons.length)} sur {sortedAndFilteredWeapons.length} entrées
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-md ${
              currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 border'
            }`}
          >
            Précédent
          </motion.button>
          {Array.from({ length: Math.ceil(sortedAndFilteredWeapons.length / itemsPerPage) }).map((_, index) => (
            <motion.button
              key={index + 1}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => paginate(index + 1)}
              className={`px-3 py-1 rounded-md ${
                currentPage === index + 1
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border'
              }`}
            >
              {index + 1}
            </motion.button>
          ))}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === Math.ceil(sortedAndFilteredWeapons.length / itemsPerPage)}
            className={`px-3 py-1 rounded-md ${
              currentPage === Math.ceil(sortedAndFilteredWeapons.length / itemsPerPage)
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 border'
            }`}
          >
            Suivant
          </motion.button>
        </div>
      </motion.div>

      <LoginDialog
        open={isLoginOpen}
        setOpen={setIsLoginOpen}
        onLogin={handleLogin}
      />

      <EmployeeColorManager
        open={isColorManagerOpen}
        onClose={() => setIsColorManagerOpen(false)}
        employees={employees}
        onUpdate={async () => {
          // Attendre que les deux mises à jour soient terminées
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