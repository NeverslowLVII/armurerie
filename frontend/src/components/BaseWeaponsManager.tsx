import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { createBaseWeapon, updateBaseWeapon, deleteBaseWeapon } from '../services/api';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useData } from '../context/DataContext';

interface BaseWeaponsManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function BaseWeaponsManager({ isOpen, onClose }: BaseWeaponsManagerProps) {
    const { baseWeapons, refreshBaseWeapons } = useData();
    const [editingWeapon, setEditingWeapon] = useState<typeof baseWeapons[0] | null>(null);
    const [newWeaponName, setNewWeaponName] = useState('');
    const [newWeaponPrice, setNewWeaponPrice] = useState('');

    const handleAddWeapon = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createBaseWeapon({
                nom: newWeaponName,
                prix_defaut: parseInt(newWeaponPrice) * 100
            });
            setNewWeaponName('');
            setNewWeaponPrice('');
            refreshBaseWeapons();
        } catch (error) {
            console.error('Erreur lors de l\'ajout de l\'arme de base:', error);
        }
    };

    const handleUpdateWeapon = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingWeapon) return;

        try {
            await updateBaseWeapon(editingWeapon.id, {
                nom: newWeaponName,
                prix_defaut: parseInt(newWeaponPrice) * 100
            });
            setEditingWeapon(null);
            setNewWeaponName('');
            setNewWeaponPrice('');
            refreshBaseWeapons();
        } catch (error) {
            console.error('Erreur lors de la mise à jour de l\'arme de base:', error);
        }
    };

    const handleDeleteWeapon = async (weaponId: number) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette arme de base ?')) {
            try {
                await deleteBaseWeapon(weaponId);
                refreshBaseWeapons();
            } catch (error) {
                console.error('Erreur lors de la suppression de l\'arme de base:', error);
            }
        }
    };

    const startEditing = (weapon: typeof baseWeapons[0]) => {
        setEditingWeapon(weapon);
        setNewWeaponName(weapon.nom);
        setNewWeaponPrice((weapon.prix_defaut / 100).toString());
    };

    const cancelEditing = () => {
        setEditingWeapon(null);
        setNewWeaponName('');
        setNewWeaponPrice('');
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen">
                <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

                <div className="relative bg-white rounded-lg p-8 max-w-md w-full mx-4">
                    <Dialog.Title className="text-lg font-medium mb-4">
                        Gérer les armes de base
                    </Dialog.Title>

                    <form onSubmit={editingWeapon ? handleUpdateWeapon : handleAddWeapon} className="mb-6">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nom de l'arme
                            </label>
                            <input
                                type="text"
                                value={newWeaponName}
                                onChange={(e) => setNewWeaponName(e.target.value)}
                                className="border p-2 rounded w-full"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Prix par défaut (en dollars)
                            </label>
                            <input
                                type="number"
                                value={newWeaponPrice}
                                onChange={(e) => setNewWeaponPrice(e.target.value)}
                                className="border p-2 rounded w-full"
                                required
                            />
                        </div>

                        <div className="flex justify-end space-x-2">
                            {editingWeapon && (
                                <button
                                    type="button"
                                    onClick={cancelEditing}
                                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                                >
                                    Annuler
                                </button>
                            )}
                            <button
                                type="submit"
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                            >
                                {editingWeapon ? 'Mettre à jour' : 'Ajouter'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Armes de base existantes</h3>
                        <div className="space-y-2">
                            {baseWeapons.map((weapon) => (
                                <div
                                    key={weapon.id}
                                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                >
                                    <div>
                                        <span className="font-medium">{weapon.nom}</span>
                                        <span className="ml-2 text-gray-500">
                                            {new Intl.NumberFormat('en-US', {
                                                style: 'currency',
                                                currency: 'USD'
                                            }).format(weapon.prix_defaut / 100)}
                                        </span>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => startEditing(weapon)}
                                            className="text-indigo-600 hover:text-indigo-900"
                                        >
                                            <PencilIcon className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteWeapon(weapon.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        </Dialog>
    );
}