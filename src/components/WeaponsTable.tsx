import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { deleteWeapon, Weapon } from '../services/api';
import EmployeeColorManager from './EmployeeManager';
import AddWeaponForm from './AddWeaponForm';
import EditWeaponForm from './EditWeaponForm';
import LoginDialog from './LoginDialog';
import {
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  LockClosedIcon,
  LockOpenIcon,
  UserGroupIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import BaseWeaponsManager from './BaseWeaponsManager';
import { useData } from '../context/DataContext';
import { hasPermission, getRoleName } from '@/utils/roles';
import { Role } from '@/services/api';
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

const tableVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 },
};

export default function WeaponsTable() {
  const {
    weapons,
    employees,
    loading,
    error,
    refreshWeapons,
    refreshEmployees,
  } = useData();

  const [patronLoggedIn, setPatronLoggedIn] = useState(false);
  const [currentWeapon, setCurrentWeapon] = useState<Weapon | null>(null);

  const [isColorManagerOpen, setIsColorManagerOpen] = useState(false);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isBaseWeaponsOpen, setIsBaseWeaponsOpen] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const handleLogin = (password: string) => {
    if (password === 'patron123') {
      setPatronLoggedIn(true);
      localStorage.setItem('patronAuth', 'true');
      setIsLoginOpen(false);
    }
  };

  const handleLogout = () => {
    setPatronLoggedIn(false);
    localStorage.removeItem('patronAuth');
  };

  const handleEdit = (weapon: Weapon) => {
    if (!patronLoggedIn) {
      setIsLoginOpen(true);
      return;
    }
    setCurrentWeapon(weapon);
    setIsEditFormOpen(true);
  };

  const handleDelete = async (weapon: Weapon) => {
    if (!patronLoggedIn) {
      setIsLoginOpen(true);
      return;
    }
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette arme ?')) {
      try {
        await deleteWeapon(weapon.id);
        const updatedWeapons = weapons.filter(w => w.id !== weapon.id);
        const newTotalPages = Math.ceil(updatedWeapons.length / itemsPerPage);
        if (currentPage > newTotalPages) {
          setCurrentPage(Math.max(1, newTotalPages));
        }
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
    if (!patronLoggedIn) {
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

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedAndFilteredWeapons.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div 
        className="sm:flex sm:items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold">Registre des armes</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Liste des armes enregistrées dans le système.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex gap-2">
          <Button
            variant="outline"
            onClick={() => 
              patronLoggedIn ? handleLogout() : setIsLoginOpen(true)
            }
          >
            {patronLoggedIn ? (
              <>
                <LockOpenIcon className="h-5 w-5 mr-1" />
                Déconnexion
              </>
            ) : (
              <>
                <LockClosedIcon className="h-5 w-5 mr-1" />
                Connexion Patron
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleManageEmployees}
            disabled={!patronLoggedIn || !hasPermission(Role.PATRON, 'canManageEmployees')}
          >
            <UserGroupIcon className="h-5 w-5 mr-1" />
            Gérer les employés
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              patronLoggedIn ? setIsBaseWeaponsOpen(true) : setIsLoginOpen(true)
            }
            disabled={!patronLoggedIn || !hasPermission(Role.PATRON, 'canManageBaseWeapons')}
          >
            <SparklesIcon className="h-5 w-5 mr-1" />
            Gérer les armes de base
          </Button>
          <Button
            onClick={() => setIsAddFormOpen(true)}
            className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500"
          >
            Ajouter une arme
          </Button>
        </div>
      </motion.div>

      {/* Search Input */}
      <motion.div 
        className="mt-8 mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <Input
            type="text"
            className="pl-10"
            placeholder="Rechercher une arme, un détenteur, un employé..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </motion.div>

      {/* Table */}
      <motion.div 
        className="mt-8 flow-root"
        variants={tableVariants}
        initial="hidden"
        animate="show"
      >
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date et heure</TableHead>
                <TableHead>Employé</TableHead>
                <TableHead>Détenteur</TableHead>
                <TableHead>Nom de l'arme</TableHead>
                <TableHead>Sérigraphie</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead className="sr-only">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <tbody className="divide-y divide-gray-200 bg-white/50">
              <AnimatePresence>
                {currentItems.map((weapon) => (
                  <motion.tr
                    key={weapon.id}
                    variants={rowVariants}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                    whileHover={{ backgroundColor: 'rgba(249, 250, 251, 0.5)' }}
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
                        {weapon.employee.role !== Role.EMPLOYEE && (
                          <span className="ml-1 text-xs">
                            ({getRoleName(weapon.employee.role as Role)})
                          </span>
                        )}
                      </motion.span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      {weapon.detenteur}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      {weapon.nom_arme}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      {weapon.serigraphie}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      {(weapon.prix / 100).toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      })}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => handleEdit(weapon)}
                          variant="ghost"
                          size="sm"
                          className={`inline-flex items-center justify-center rounded-md px-2 py-1 hover:bg-accent hover:text-accent-foreground ${
                            !patronLoggedIn && 'opacity-50 cursor-not-allowed'
                          }`}
                          disabled={!patronLoggedIn || !hasPermission(Role.PATRON, 'canEditWeapons')}
                        >
                          <PencilIcon className="h-5 w-5" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(weapon)}
                          variant="ghost"
                          size="sm"
                          className={`inline-flex items-center justify-center rounded-md px-2 py-1 hover:bg-accent hover:text-accent-foreground ${
                            !patronLoggedIn && 'opacity-50 cursor-not-allowed'
                          }`}
                          disabled={!patronLoggedIn || !hasPermission(Role.PATRON, 'canDeleteWeapons')}
                        >
                          <TrashIcon className="h-5 w-5" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </Table>
        </Card>
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
          <Button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-md ${
              currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 border'
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
                  ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border'
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
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 border'
            }`}
          >
            Suivant
          </Button>
        </div>
      </motion.div>

      <LoginDialog open={isLoginOpen} onClose={() => setIsLoginOpen(false)} onLogin={handleLogin} />

      <EmployeeColorManager
        open={isColorManagerOpen}
        onClose={() => setIsColorManagerOpen(false)}
        employees={employees}
        onUpdate={async () => {
          await Promise.all([refreshEmployees(), refreshWeapons()]);
        }}
      />

      <AddWeaponForm
        isOpen={isAddFormOpen}
        onClose={() => setIsAddFormOpen(false)}
        onWeaponAdded={refreshWeapons}
      />

      <EditWeaponForm
        open={isEditFormOpen}
        onClose={() => setIsEditFormOpen(false)}
        weapon={currentWeapon}
        onWeaponUpdated={refreshWeapons}
      />

      <BaseWeaponsManager
        open={isBaseWeaponsOpen}
        onClose={() => setIsBaseWeaponsOpen(false)}
      />
    </div>
  );
} 