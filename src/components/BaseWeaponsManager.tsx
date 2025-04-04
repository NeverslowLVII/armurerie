import React, { useState, useMemo, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { createBaseWeapon, updateBaseWeapon, deleteBaseWeapon } from '../services/api';
import { PencilIcon, TrashIcon, PlusIcon, XMarkIcon, CurrencyDollarIcon, FireIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useData } from '../context/DataContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';

interface BaseWeaponsManagerProps {
    open: boolean;
    onClose: () => void;
}

const calculateProfit = (price: number, cost: number): string => {
    return ((price - cost) / price * 100).toFixed(1);
};

const ROW_HEIGHT = 68;

const listItemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
        opacity: 1, 
        y: 0,
        scale: 1,
        backgroundColor: "rgb(255 255 255 / 0)",
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 30
        }
    },
    editing: {
        opacity: 1,
        y: 0,
        scale: 1,
        backgroundColor: "rgb(79 70 229 / 0.1)",
        transition: {
            duration: 0.2,
            backgroundColor: {
                duration: 0.3
            }
        }
    },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
};

const successVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: {
            type: "spring",
            stiffness: 500,
            damping: 30
        }
    },
    exit: { opacity: 0, y: 20, transition: { duration: 0.2 } }
};

const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
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
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
};

const textVariants = {
    initial: { opacity: 0, x: -10, display: "inline-block" },
    animate: { 
        opacity: 1,
        x: 0,
        display: "inline-block",
        transition: {
            type: "spring",
            stiffness: 500,
            damping: 30,
            mass: 0.5
        }
    }
};

export default function BaseWeaponsManager({ open, onClose }: BaseWeaponsManagerProps) {
    const { baseWeapons, refreshBaseWeapons } = useData();
    const [editingWeapon, setEditingWeapon] = useState<typeof baseWeapons[0] | null>(null);
    const [newWeaponName, setNewWeaponName] = useState('');
    const [newWeaponPrice, setNewWeaponPrice] = useState('');
    const [newWeaponCostProduction, setNewWeaponCostProduction] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');

    const listContainerRef = React.useRef<HTMLDivElement>(null);
    
    const filteredWeapons = useMemo(() => {
        return baseWeapons
            .filter(weapon => 
                weapon.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
                weapon.prix_defaut.toString().includes(searchQuery)
            )
            .sort((a, b) => {
                const profitA = parseFloat(calculateProfit(a.prix_defaut, a.cout_production_defaut));
                const profitB = parseFloat(calculateProfit(b.prix_defaut, b.cout_production_defaut));
                return profitB - profitA;
            });
    }, [baseWeapons, searchQuery]);

    const itemsPerPage = useMemo(() => {
        if (!listContainerRef.current) return 5;
        const availableHeight = listContainerRef.current.clientHeight;
        return Math.max(Math.floor(availableHeight / ROW_HEIGHT), 1);
    }, [listContainerRef.current?.clientHeight]);

    const totalPages = Math.ceil(filteredWeapons.length / itemsPerPage);
    
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(Math.max(1, totalPages));
        }
    }, [totalPages, currentPage]);

    const paginatedWeapons = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredWeapons.slice(start, start + itemsPerPage);
    }, [filteredWeapons, currentPage, itemsPerPage]);

    const handleAddWeapon = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        try {
            await createBaseWeapon({
                nom: newWeaponName,
                prix_defaut: parseInt(newWeaponPrice) * 100,
                cout_production_defaut: parseInt(newWeaponCostProduction) * 100
            });
            setNewWeaponName('');
            setNewWeaponPrice('');
            setNewWeaponCostProduction('');
            setSuccess('Arme de base ajoutée avec succès !');
            refreshBaseWeapons();
            setTimeout(() => setSuccess(null), 3000);
        } catch (error) {
            setError('Erreur lors de l\'ajout de l\'arme de base');
            console.error('Erreur lors de l\'ajout de l\'arme de base:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateWeapon = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingWeapon) return;
        setIsSubmitting(true);
        setError(null);

        try {
            await updateBaseWeapon(editingWeapon.id, {
                nom: newWeaponName,
                prix_defaut: parseInt(newWeaponPrice) * 100,
                cout_production_defaut: parseInt(newWeaponCostProduction) * 100
            });
            setEditingWeapon(null);
            setNewWeaponName('');
            setNewWeaponPrice('');
            setNewWeaponCostProduction('');
            setSuccess('Arme de base mise à jour avec succès !');
            refreshBaseWeapons();
            setTimeout(() => setSuccess(null), 3000);
        } catch (error) {
            setError('Erreur lors de la mise à jour de l\'arme de base');
            console.error('Erreur lors de la mise à jour de l\'arme de base:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteWeapon = async (weaponId: number) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette arme de base ?')) {
            setIsSubmitting(true);
            setError(null);
            try {
                await deleteBaseWeapon(weaponId);
                setSuccess('Arme de base supprimée avec succès !');
                refreshBaseWeapons();
                setTimeout(() => setSuccess(null), 3000);
            } catch (error) {
                setError('Erreur lors de la suppression de l\'arme de base');
                console.error('Erreur lors de la suppression de l\'arme de base:', error);
            } finally {
            setIsSubmitting(false);
            }
        }
    };

    const startEditing = (weapon: typeof baseWeapons[0]) => {
        setEditingWeapon(weapon);
        setTimeout(() => {
            setNewWeaponName(weapon.nom);
            setTimeout(() => {
                setNewWeaponPrice((weapon.prix_defaut / 100).toString());
                setTimeout(() => {
                    setNewWeaponCostProduction((weapon.cout_production_defaut / 100).toString());
                }, 100);
            }, 100);
        }, 100);
    };

    const cancelEditing = () => {
        setEditingWeapon(null);
        setNewWeaponName('');
        setNewWeaponPrice('');
        setNewWeaponCostProduction('');
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
                            <div className="fixed inset-0 bg-neutral-500 bg-opacity-75 transition-opacity backdrop-blur-sm" />
                        </motion.div>

                        <motion.div
                            variants={modalVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="relative bg-white rounded-lg shadow-xl w-full max-w-7xl h-[85vh] flex flex-col"
                        >
                            <div className="p-3 border-b border-neutral-200">
                                <div className="flex justify-between items-center">
                                    <Dialog.Title className="text-xl font-semibold text-neutral-900">
                                        Gestionnaire d'armes de base
                    </Dialog.Title>
                                    <div className="flex items-center space-x-4">
                                        <div className="relative">
                                            <Input
                                                type="text"
                                                placeholder="Rechercher une arme..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-64 pl-4 pr-10 py-1.5 text-sm border border-neutral-300 rounded-md focus:ring-red-500 focus:border-red-500"
                                            />
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                <svg className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            onClick={onClose}
                                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-neutral-600 hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500"
                                        >
                                            Fermer
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-1 min-h-0">
                                {/* Panneau de gauche - Formulaire */}
                                <div className="w-1/3 border-r border-neutral-200 p-4 overflow-y-auto">
                                    {error && (
                                        <div className="mb-3 p-2 bg-red-100 border-l-4 border-red-500 text-red-700 text-sm rounded">
                                            {error}
                                        </div>
                                    )}

                                    {success && (
                                        <motion.div 
                                            initial="hidden"
                                            animate="visible"
                                            exit="exit"
                                            variants={successVariants}
                                            className="mb-3 p-2 bg-emerald-100 border-l-4 border-emerald-500 text-emerald-700 text-sm rounded"
                                        >
                                            {success}
                                        </motion.div>
                                    )}

                                    <form onSubmit={editingWeapon ? handleUpdateWeapon : handleAddWeapon} className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Nom de l'arme
                            </label>
                                            <motion.div
                                                initial="initial"
                                                animate="animate"
                                                variants={textVariants}
                                                className="block w-full"
                                            >
                            <Input
                                type="text"
                                value={newWeaponName}
                                onChange={(e) => setNewWeaponName(e.target.value)}
                                                    className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-neutral-300 rounded-md"
                                required
                                                    disabled={isSubmitting}
                            />
                                            </motion.div>
                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                                Prix par défaut ($)
                            </label>
                                            <motion.div
                                                initial="initial"
                                                animate="animate"
                                                variants={textVariants}
                                                className="block w-full"
                                            >
                            <Input
                                type="number"
                                value={newWeaponPrice}
                                onChange={(e) => setNewWeaponPrice(e.target.value)}
                                                    className="focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-neutral-300 rounded-md"
                                                    required
                                                    min="0"
                                                    step="0.01"
                                                    disabled={isSubmitting}
                                                />
                                            </motion.div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                                Coût de production ($)
                                            </label>
                                            <motion.div
                                                initial="initial"
                                                animate="animate"
                                                variants={textVariants}
                                                className="block w-full"
                                            >
                                                <Input
                                                    type="number"
                                                    value={newWeaponCostProduction}
                                                    onChange={(e) => setNewWeaponCostProduction(e.target.value)}
                                                    className="focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-neutral-300 rounded-md"
                                required
                                                    min="0"
                                                    step="0.01"
                                                    disabled={isSubmitting}
                            />
                                            </motion.div>
                        </div>

                                        <div className="pt-2">
                                            <div className="flex justify-between space-x-2">
                            {editingWeapon && (
                                <Button
                                    type="button"
                                    onClick={cancelEditing}
                                                        className="inline-flex items-center px-3 py-1.5 border border-neutral-300 shadow-sm text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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
                                                            ? 'bg-red-400'
                                                            : 'bg-red-600 hover:bg-red-700'
                                                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
                                                    disabled={isSubmitting}
                                                >
                                                    {isSubmitting ? (
                                                        <>
                                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            {editingWeapon ? 'Mise à jour...' : 'Ajout...'}
                                                        </>
                                                    ) : (
                                                        <>
                                                            {editingWeapon ? (
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
                                    <div className="px-4 py-2 bg-neutral-50 border-b border-neutral-200">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-sm font-medium text-neutral-900">
                                                Armes de base existantes
                                                <span className="ml-2 text-xs text-neutral-500">
                                                    ({filteredWeapons.length} résultats)
                                                </span>
                                            </h3>
                                            <div className="flex items-center space-x-1 text-sm">
                                                <Button
                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                    disabled={currentPage === 1}
                                                    className={`p-1 rounded ${
                                                        currentPage === 1
                                                            ? 'text-neutral-400 cursor-not-allowed'
                                                            : 'text-neutral-600 hover:bg-neutral-100'
                                                    }`}
                                                >
                                                    <ChevronLeftIcon className="h-4 w-4" />
                                                </Button>
                                                <span className="text-neutral-600">
                                                    {currentPage} / {totalPages}
                                                </span>
                                                <Button
                                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                    disabled={currentPage === totalPages}
                                                    className={`p-1 rounded ${
                                                        currentPage === totalPages
                                                            ? 'text-neutral-400 cursor-not-allowed'
                                                            : 'text-neutral-600 hover:bg-neutral-100'
                                                    }`}
                                                >
                                                    <ChevronRightIcon className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <div ref={listContainerRef} className="flex-1 overflow-y-auto">
                                        <div className="divide-y divide-neutral-100">
                                            <AnimatePresence mode="popLayout">
                                                {paginatedWeapons.map((weapon, index) => (
                                                    <motion.div
                                    key={weapon.id}
                                                        variants={listItemVariants}
                                                        initial="hidden"
                                                        animate={editingWeapon?.id === weapon.id ? "editing" : "visible"}
                                                        exit="exit"
                                                        custom={index}
                                                        layout
                                                        className="px-4 py-3 hover:bg-neutral-50 transition-colors duration-150 rounded-lg"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <motion.div 
                                                                className="flex-1 min-w-0"
                                                                whileHover={{ x: 5 }}
                                                                transition={{ type: "spring", stiffness: 400 }}
                                                            >
                                                                <p className="text-sm font-medium text-red-600 truncate">
                                                                    {weapon.nom}
                                                                </p>
                                                                <div className="mt-2 flex items-center text-sm text-neutral-500 space-x-4">
                                                                    <motion.div 
                                                                        className="flex items-center"
                                                                        whileHover={{ scale: 1.05 }}
                                                                    >
                                                                        <CurrencyDollarIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-neutral-400" />
                                                                        <span>
                                                                            {new Intl.NumberFormat('fr-FR', {
                                                style: 'currency',
                                                currency: 'USD'
                                            }).format(weapon.prix_defaut / 100)}
                                        </span>
                                                                    </motion.div>
                                                                    <motion.div 
                                                                        className="flex items-center"
                                                                        whileHover={{ scale: 1.05 }}
                                                                    >
                                                                        <FireIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-neutral-400" />
                                                                        <span>
                                                                            {new Intl.NumberFormat('fr-FR', {
                                                                                style: 'currency',
                                                                                currency: 'USD'
                                                                            }).format(weapon.cout_production_defaut / 100)}
                                                                        </span>
                                                                    </motion.div>
                                                                    <motion.div 
                                                                        className="flex items-center"
                                                                        whileHover={{ scale: 1.05 }}
                                                                    >
                                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                            parseFloat(calculateProfit(weapon.prix_defaut, weapon.cout_production_defaut)) >= 30
                                                                                ? 'bg-emerald-100 text-emerald-800'
                                                                                : parseFloat(calculateProfit(weapon.prix_defaut, weapon.cout_production_defaut)) >= 15
                                                                                ? 'bg-amber-100 text-amber-800'
                                                                                : 'bg-red-100 text-red-800'
                                                                        }`}>
                                                                            Marge: {calculateProfit(weapon.prix_defaut, weapon.cout_production_defaut)}%
                                                                        </span>
                                                                    </motion.div>
                                    </div>
                                                            </motion.div>
                                                            <div className="flex items-center space-x-2">
                                                                <Button
                                                                    onClick={() => startEditing(weapon)}
                                                                    className="p-2 text-red-600 hover:text-red-900 rounded-full hover:bg-red-50 transition-colors duration-150"
                                                                    disabled={isSubmitting}
                                        >
                                            <PencilIcon className="h-5 w-5" />
                                                                </Button>
                                                                <Button
                                                                    onClick={() => handleDeleteWeapon(weapon.id)}
                                                                    className="p-2 text-red-600 hover:text-red-900 rounded-full hover:bg-red-50 transition-colors duration-150"
                                                                    disabled={isSubmitting}
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                        {paginatedWeapons.length === 0 && (
                                            <motion.div 
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="p-4 text-center text-neutral-500"
                                            >
                                                Aucune arme trouvée
                                            </motion.div>
                                        )}
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