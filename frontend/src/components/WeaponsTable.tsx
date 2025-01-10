import React, { useState } from 'react';
import { deleteWeapon, Role, Weapon } from '../services/api';
import EmployeeColorManager from './EmployeeColorManager';
import AddWeaponForm from './AddWeaponForm';
import EditWeaponForm from './EditWeaponForm';
import LoginDialog from './LoginDialog';
import { MagnifyingGlassIcon, PencilIcon, TrashIcon, LockClosedIcon, LockOpenIcon } from '@heroicons/react/24/outline';
import BaseWeaponsManager from './BaseWeaponsManager';
import { useData } from '../context/DataContext';

export default function WeaponsTable() {
  const { weapons, employees, loading, error, refreshWeapons } = useData();
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
  
  // Sorting
  const [sortField, setSortField] = useState<keyof Weapon>('horodateur');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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

  const handleSort = (field: keyof Weapon) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedAndFilteredWeapons = filteredWeapons.sort((a, b) => {
    if (sortField === 'horodateur') {
      return sortDirection === 'asc'
        ? new Date(a.horodateur).getTime() - new Date(b.horodateur).getTime()
        : new Date(b.horodateur).getTime() - new Date(a.horodateur).getTime();
    }
    return 0;
  });

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
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">Registre des armes</h1>
          <p className="mt-2 text-sm text-gray-700">
            Liste des armes enregistrées dans le système.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex space-x-3">
          <button
            type="button"
            onClick={() => isPatronLoggedIn ? handleLogout() : setIsLoginOpen(true)}
            className="block rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
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
          </button>
          <button
            type="button"
            onClick={handleManageEmployees}
            className={`block rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ${
              isPatronLoggedIn
                ? 'bg-white text-gray-900 ring-gray-300 hover:bg-gray-50'
                : 'bg-gray-100 text-gray-400 ring-gray-200 cursor-not-allowed'
            }`}
            disabled={!isPatronLoggedIn}
          >
            Gérer les employés
          </button>
          <button
            type="button"
            onClick={() => isPatronLoggedIn ? setIsBaseWeaponsOpen(true) : setIsLoginOpen(true)}
            className={`block rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ${
              isPatronLoggedIn
                ? 'bg-white text-gray-900 ring-gray-300 hover:bg-gray-50'
                : 'bg-gray-100 text-gray-400 ring-gray-200 cursor-not-allowed'
            }`}
            disabled={!isPatronLoggedIn}
          >
            Gérer les armes de base
          </button>
          <button
            type="button"
            onClick={() => setIsAddFormOpen(true)}
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Ajouter une arme
          </button>
        </div>
      </div>

      <div className="mt-8 mb-4">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            placeholder="Rechercher une arme, un détenteur, un employé..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      scope="col" 
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('horodateur')}
                    >
                      <div className="flex items-center">
                        Date et heure
                        {sortField === 'horodateur' && (
                          <span className="ml-2">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
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
                <tbody className="divide-y divide-gray-200 bg-white">
                  {currentItems.map((weapon) => (
                    <tr key={weapon.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">
                        {new Date(weapon.horodateur).toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            weapon.employee.color ? 'text-white' : 'text-gray-900 bg-gray-100'
                          }`}
                          style={weapon.employee.color ? { backgroundColor: weapon.employee.color } : undefined}
                        >
                          {weapon.employee.name}
                          {weapon.employee.role === Role.PATRON && (
                            <span className="ml-1 text-xs">(Patron)</span>
                          )}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{weapon.detenteur}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{weapon.nom_arme}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{weapon.serigraphie}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        {(weapon.prix / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(weapon)}
                            className={`text-indigo-600 hover:text-indigo-900 ${!isPatronLoggedIn && 'opacity-50 cursor-not-allowed'}`}
                            disabled={!isPatronLoggedIn}
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(weapon)}
                            className={`text-red-600 hover:text-red-900 ${!isPatronLoggedIn && 'opacity-50 cursor-not-allowed'}`}
                            disabled={!isPatronLoggedIn}
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-sm text-gray-700">
            Affichage de {indexOfFirstItem + 1} à {Math.min(indexOfLastItem, sortedAndFilteredWeapons.length)} sur {sortedAndFilteredWeapons.length} entrées
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-md ${
              currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 border'
            }`}
          >
            Précédent
          </button>
          {Array.from({ length: Math.ceil(sortedAndFilteredWeapons.length / itemsPerPage) }).map((_, index) => (
            <button
              key={index + 1}
              onClick={() => paginate(index + 1)}
              className={`px-3 py-1 rounded-md ${
                currentPage === index + 1
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border'
              }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === Math.ceil(sortedAndFilteredWeapons.length / itemsPerPage)}
            className={`px-3 py-1 rounded-md ${
              currentPage === Math.ceil(sortedAndFilteredWeapons.length / itemsPerPage)
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 border'
            }`}
          >
            Suivant
          </button>
        </div>
      </div>

      <LoginDialog
        open={isLoginOpen}
        setOpen={setIsLoginOpen}
        onLogin={handleLogin}
      />

      <EmployeeColorManager
        open={isColorManagerOpen}
        setOpen={setIsColorManagerOpen}
        employees={employees}
        onUpdate={refreshWeapons}
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