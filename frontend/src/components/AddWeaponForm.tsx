import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { createWeapon } from '../services/api';
import { useData } from '../context/DataContext';

interface AddWeaponFormProps {
    isOpen: boolean;
    onClose: () => void;
    onWeaponAdded: () => void;
}

export default function AddWeaponForm({ isOpen, onClose, onWeaponAdded }: AddWeaponFormProps) {
    const { employees, baseWeapons } = useData();
    const [selectedEmployee, setSelectedEmployee] = useState<typeof employees[0] | null>(null);
    const [selectedBaseWeapon, setSelectedBaseWeapon] = useState<typeof baseWeapons[0] | null>(null);
    const [detenteur, setDetenteur] = useState('');
    const [serigraphie, setSerigraphie] = useState('');
    const [prix, setPrix] = useState('');

    const resetForm = () => {
        setSelectedEmployee(null);
        setSelectedBaseWeapon(null);
        setDetenteur('');
        setSerigraphie('');
        setPrix('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmployee || !selectedBaseWeapon) return;

        try {
            await createWeapon({
                employe_id: selectedEmployee.id,
                detenteur,
                nom_arme: selectedBaseWeapon.nom,
                serigraphie,
                prix: selectedBaseWeapon.prix_defaut,
                horodateur: new Date().toISOString()
            });
            onWeaponAdded();
            onClose();
            resetForm();
        } catch (error) {
            console.error('Erreur lors de l\'ajout de l\'arme:', error);
        }
    };

    const handleBaseWeaponSelect = (baseWeapon: typeof baseWeapons[0] | null) => {
        setSelectedBaseWeapon(baseWeapon);
        if (baseWeapon) {
            setPrix((baseWeapon.prix_defaut / 100).toString());
        } else {
            setPrix('');
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen">
                <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

                <div className="relative bg-white rounded-lg p-8 max-w-md w-full mx-4">
                    <Dialog.Title className="text-lg font-medium mb-4">
                        Ajouter une arme
                    </Dialog.Title>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Employé
                            </label>
                            <select
                                value={selectedEmployee?.id || ''}
                                onChange={(e) => {
                                    const employee = employees.find(emp => emp.id === parseInt(e.target.value));
                                    setSelectedEmployee(employee || null);
                                }}
                                className="border p-2 rounded w-full"
                                required
                            >
                                <option value="">Sélectionner un employé</option>
                                {employees.map((employee) => (
                                    <option key={employee.id} value={employee.id}>
                                        {employee.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Arme de base
                            </label>
                            <select
                                value={selectedBaseWeapon?.id || ''}
                                onChange={(e) => {
                                    const baseWeapon = baseWeapons.find(w => w.id === parseInt(e.target.value));
                                    handleBaseWeaponSelect(baseWeapon || null);
                                }}
                                className="border p-2 rounded w-full"
                                required
                            >
                                <option value="">Sélectionner une arme de base</option>
                                {baseWeapons.map((weapon) => (
                                    <option key={weapon.id} value={weapon.id}>
                                        {weapon.nom} - {new Intl.NumberFormat('en-US', {
                                            style: 'currency',
                                            currency: 'USD'
                                        }).format(weapon.prix_defaut / 100)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Détenteur
                            </label>
                            <input
                                type="text"
                                value={detenteur}
                                onChange={(e) => setDetenteur(e.target.value)}
                                className="border p-2 rounded w-full"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Sérigraphie
                            </label>
                            <input
                                type="text"
                                value={serigraphie}
                                onChange={(e) => setSerigraphie(e.target.value)}
                                className="border p-2 rounded w-full"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Prix (en dollars)
                            </label>
                            <input
                                type="number"
                                value={prix}
                                onChange={(e) => setPrix(e.target.value)}
                                className="border p-2 rounded w-full"
                                required
                                readOnly
                            />
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    resetForm();
                                }}
                                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 mr-2"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                            >
                                Ajouter
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Dialog>
    )
}