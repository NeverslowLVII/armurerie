import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { createWeapon } from '../services/api';
import { useData } from '../context/DataContext';
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import { SelectNative } from "@/components/ui/select-native";
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
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const resetForm = () => {
        setSelectedEmployee(null);
        setSelectedBaseWeapon(null);
        setDetenteur('');
        setSerigraphie('');
        setPrix('');
        setError(null);
        setSuccess(false);
        setIsLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmployee || !selectedBaseWeapon) return;

        setIsLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await createWeapon({
                employe_id: selectedEmployee.id,
                detenteur,
                nom_arme: selectedBaseWeapon.nom,
                serigraphie,
                prix: selectedBaseWeapon.prix_defaut,
                cout_production: selectedBaseWeapon.cout_production_defaut,
                horodateur: new Date().toISOString()
            });
            setSuccess(true);
            onWeaponAdded();
            setTimeout(() => {
                onClose();
                resetForm();
            }, 1000);
        } catch (error) {
            console.error('Erreur lors de l\'ajout de l\'arme:', error);
            setError('Erreur lors de l\'ajout de l\'arme. Veuillez réessayer.');
        } finally {
            setIsLoading(false);
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
                <div className="fixed inset-0 bg-black opacity-30" />

                <div className="relative bg-white rounded-lg p-8 max-w-md w-full mx-4">
                    <Dialog.Title className="text-lg font-medium mb-4">
                        Ajouter une arme
                    </Dialog.Title>

                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                            Arme ajoutée avec succès !
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Employé
                            </label>
                            <SelectNative
                                value={selectedEmployee?.id || ''}
                                onChange={(e) => {
                                    const employee = employees.find(emp => emp.id === parseInt(e.target.value));
                                    setSelectedEmployee(employee || null);
                                }}
                                className="border p-2 rounded w-full"
                                required
                                disabled={isLoading}
                            >
                                <option value="">Sélectionner un employé</option>
                                {employees.map((employee) => (
                                    <option key={employee.id} value={employee.id}>
                                        {employee.name}
                                    </option>
                                ))}
                            </SelectNative>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Arme de base
                            </label>
                            <SelectNative
                                value={selectedBaseWeapon?.id || ''}
                                onChange={(e) => {
                                    const baseWeapon = baseWeapons.find(w => w.id === parseInt(e.target.value));
                                    handleBaseWeaponSelect(baseWeapon || null);
                                }}
                                className="border p-2 rounded w-full"
                                required
                                disabled={isLoading}
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
                            </SelectNative>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Détenteur
                            </label>
                            <Input
                                type="text"
                                value={detenteur}
                                onChange={(e) => setDetenteur(e.target.value)}
                                className="border p-2 rounded w-full"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Sérigraphie
                            </label>
                            <Input
                                type="text"
                                value={serigraphie}
                                onChange={(e) => setSerigraphie(e.target.value)}
                                className="border p-2 rounded w-full"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Prix (en dollars)
                            </label>
                            <Input
                                type="number"
                                value={prix}
                                onChange={(e) => setPrix(e.target.value)}
                                className="border p-2 rounded w-full"
                                required
                                readOnly
                                disabled={isLoading}
                            />
                        </div>

                        <div className="flex justify-end">
                            <Button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    resetForm();
                                }}
                                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 mr-2"
                                disabled={isLoading}
                            >
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                className={`${
                                    isLoading ? 'bg-red-300' : 'bg-red-500 hover:bg-red-600'
                                } text-white px-4 py-2 rounded flex items-center`}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Ajout en cours...
                                    </>
                                ) : 'Ajouter'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </Dialog>
    );
}