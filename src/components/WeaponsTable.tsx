import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Weapon } from '../services/api';
import UserManager from './UserManager';
import AddWeaponForm from './AddWeaponForm';
import EditWeaponForm from './EditWeaponForm';
import { MagnifyingGlassIcon, PencilIcon, TrashIcon, UserGroupIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { BaseWeaponsManager } from './BaseWeaponsManager';
import { useData, useShouldDisplayLoading } from '../context/DataContext';
import { hasPermission, getRoleName } from '@/utils/roles';
import { Role } from '@/services/api';
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { SkeletonLoading } from '@/components/ui/loading';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'react-hot-toast';

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
  const { weapons, users, loading, error: apiError, refreshWeapons, refreshUsers } = useData();
  const shouldDisplayLoading = useShouldDisplayLoading();
  const { data: session } = useSession();
  const [isColorManagerOpen, setIsColorManagerOpen] = useState(false);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isBaseWeaponsOpen, setIsBaseWeaponsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const isAdmin = session?.user.role === Role.PATRON || session?.user.role === Role.CO_PATRON;

  const handleEdit = (weapon: Weapon) => {
    if (!isAdmin) return;
    setSelectedWeapon(weapon);
    setIsEditFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      if (globalThis.confirm('Êtes-vous sûr de vouloir supprimer cette arme ?')) {
        const response = await fetch(`/api/weapons/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast.success('Arme supprimée avec succès');
          await refreshWeapons();
        } else {
          toast.error('Erreur lors de la suppression de l\'arme');
        }
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression de l\'arme');
    }
  };

  const handleManageUsers = () => {
    if (!isAdmin) return;
    setIsColorManagerOpen(true);
  };

  const filteredWeapons = weapons.filter(weapon => {
    const searchLower = searchTerm.toLowerCase();
    return (
      weapon.user.name.toLowerCase().includes(searchLower) ||
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

  // Only show loading spinner if we should display it (not using overlay)
  if (loading && shouldDisplayLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <SkeletonLoading isLoading={true} className="space-y-4">
          {/* Header skeleton */}
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex space-x-3">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-40" />
            </div>
          </div>
          
          {/* Search bar skeleton */}
          <Skeleton className="h-10 w-full mt-8 mb-4" />
          
          {/* Table skeleton */}
          <div className="mt-8 flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle">
                <div className="overflow-hidden shadow-lg ring-1 ring-black ring-opacity-5 sm:rounded-lg bg-white dark:bg-neutral-800">
                  <table className="min-w-full divide-y divide-neutral-300 dark:divide-neutral-700">
                    <thead>
                      <tr>
                        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                          <th key={i} className="px-3 py-3.5">
                            <Skeleton className="h-6 w-full" />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4, 5].map((row) => (
                        <tr key={row}>
                          {[1, 2, 3, 4, 5, 6, 7].map((cell) => (
                            <td key={cell} className="whitespace-nowrap px-3 py-4">
                              <Skeleton className="h-6 w-full" />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          
          {/* Pagination skeleton */}
          <div className="mt-4 flex items-center justify-between">
            <Skeleton className="h-6 w-64" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </SkeletonLoading>
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
            onClick={handleManageUsers}
            className={`block rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset transition-colors duration-200 ${
              isAdmin && hasPermission(Role.PATRON, 'canManageUsers')
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ring-neutral-300 dark:ring-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-300 ring-neutral-200 dark:ring-neutral-500 cursor-not-allowed'
            }`}
            disabled={!isAdmin || !hasPermission(Role.PATRON, 'canManageUsers')}
          >
            <UserGroupIcon className="inline-block h-5 w-5 mr-1" />
            Gérer les utilisateurs
          </Button>
          <Button
            type="button"
            onClick={() => setIsBaseWeaponsOpen(true)}
            className={`block rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset transition-colors duration-200 ${
              isAdmin && hasPermission(Role.PATRON, 'canManageBaseWeapons')
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ring-neutral-300 dark:ring-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-300 ring-neutral-200 dark:ring-neutral-500 cursor-not-allowed'
            }`}
            disabled={!isAdmin || !hasPermission(Role.PATRON, 'canManageBaseWeapons')}
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
                      Nom de l&apos;arme
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
                              weapon.user.color ? 'text-white' : 'text-neutral-900 bg-neutral-100'
                            }`}
                            style={weapon.user.color ? { backgroundColor: weapon.user.color } : {}}
                          >
                            {weapon.user.name}
                            {weapon.user.role !== Role.EMPLOYEE && (
                              <span className="ml-1 text-xs">({getRoleName(weapon.user.role as Role)})</span>
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
                              className={`text-red-600 hover:text-red-900 ${!isAdmin && 'opacity-50 cursor-not-allowed'}`}
                              disabled={!isAdmin || !hasPermission(Role.PATRON, 'canManageWeapons')}
                              title="Modifier l&apos;arme"
                            >
                              <span className="sr-only">Modifier l&apos;arme</span>
                              <PencilIcon className="h-5 w-5" aria-hidden="true" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(weapon.id)}
                              className={`text-red-600 hover:text-red-900 ${!isAdmin && 'opacity-50 cursor-not-allowed'}`}
                              disabled={!isAdmin || !hasPermission(Role.PATRON, 'canManageWeapons')}
                              title="Supprimer l&apos;arme"
                            >
                              <span className="sr-only">Supprimer l&apos;arme</span>
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
          
          {(() => {
            const totalPages = Math.ceil(sortedAndFilteredWeapons.length / itemsPerPage);
            const maxVisiblePages = 5; // Nombre maximum de boutons de page à afficher
            
            // Calculer les pages à afficher
            let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
            const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
            
            // Ajuster si on est proche de la fin
            if (endPage - startPage + 1 < maxVisiblePages) {
              startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }
            
            const pages = [];
            
            // Première page et ellipse si nécessaire
            if (startPage > 1) {
              pages.push(
                <Button
                  key={1}
                  onClick={() => paginate(1)}
                  className="px-3 py-1 rounded-md bg-white dark:bg-neutral-800 text-neutral-700 dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-700 border dark:border-neutral-600"
                >
                  1
                </Button>
              );
              if (startPage > 2) {
                pages.push(<span key="ellipsis-1" className="px-2 text-neutral-700 dark:text-neutral-300">...</span>);
              }
            }
            
            // Pages visibles
            for (let i = startPage; i <= endPage; i++) {
              pages.push(
                <Button
                  key={i}
                  onClick={() => paginate(i)}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === i
                      ? 'bg-gradient-to-r from-red-600 to-orange-600 dark:bg-gradient-to-r dark:from-red-700 dark:to-orange-700 text-white'
                      : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-700 border dark:border-neutral-600'
                  }`}
                >
                  {i}
                </Button>
              );
            }
            
            // Dernière page et ellipse si nécessaire
            if (endPage < totalPages) {
              if (endPage < totalPages - 1) {
                pages.push(<span key="ellipsis-2" className="px-2 text-neutral-700 dark:text-neutral-300">...</span>);
              }
              pages.push(
                <Button
                  key={totalPages}
                  onClick={() => paginate(totalPages)}
                  className="px-3 py-1 rounded-md bg-white dark:bg-neutral-800 text-neutral-700 dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-700 border dark:border-neutral-600"
                >
                  {totalPages}
                </Button>
              );
            }
            
            return pages;
          })()}
          
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

      <UserManager
        open={isColorManagerOpen}
        onClose={() => setIsColorManagerOpen(false)}
        users={users}
        onUpdate={async () => {
          await Promise.all([
            refreshUsers(),
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