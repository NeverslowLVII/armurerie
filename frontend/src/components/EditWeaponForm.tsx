import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { Weapon, updateWeapon } from '../services/api';
import { useData } from '../context/DataContext';

interface EditWeaponFormProps {
    isOpen: boolean;
    onClose: () => void;
    weapon: Weapon | null;
    onWeaponUpdated: () => void;
}

export default function EditWeaponForm({ isOpen, onClose, weapon, onWeaponUpdated }: EditWeaponFormProps) {
    const { baseWeapons } = useData();
    const [employe, setEmploye] = useState(weapon?.employee?.name || '');
    const [detenteur, setDetenteur] = useState(weapon?.detenteur || '');
    const [nomArme, setNomArme] = useState(weapon?.nom_arme || '');
    const [serigraphie, setSerigraphie] = useState(weapon?.serigraphie || '');
    const [prix, setPrix] = useState(weapon ? (weapon.prix / 100).toString() : '');
    const [selectedBaseWeapon, setSelectedBaseWeapon] = useState(baseWeapons.find(w => w.nom === weapon?.nom_arme) || null);
    const [horodatage, setHorodatage] = useState(weapon ? new Date(weapon.horodateur).toISOString().slice(0, 16) : '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (weapon) {
            setEmploye(weapon.employee.name);
            setDetenteur(weapon.detenteur);
            setNomArme(weapon.nom_arme);
            setSerigraphie(weapon.serigraphie);
            setPrix((weapon.prix / 100).toString());
            setSelectedBaseWeapon(baseWeapons.find(w => w.nom === weapon.nom_arme) || null);
            setHorodatage(new Date(weapon.horodateur).toISOString().slice(0, 16));
        }
        // Réinitialiser les états
        setError(null);
        setSuccess(false);
        setIsLoading(false);
    }, [weapon, baseWeapons]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!weapon) return;
        
        setIsLoading(true);
        setError(null);
        setSuccess(false);
        
        try {
            const priceInCents = selectedBaseWeapon 
                ? selectedBaseWeapon.prix_defaut 
                : parseInt(prix) * 100;

            await updateWeapon(weapon.id, {
                horodateur: new Date(horodatage).toISOString(),
                employe_id: weapon.employe_id,
                detenteur,
                nom_arme: selectedBaseWeapon ? selectedBaseWeapon.nom : nomArme,
                serigraphie,
                prix: priceInCents,
                cout_production: 0
            });
            setSuccess(true);
            onWeaponUpdated();
            setTimeout(() => {
                onClose();
            }, 1000); // Fermer après 1 seconde pour montrer le message de succès
        } catch (err) {
            console.error('Erreur lors de la mise à jour de l\'arme:', err);
            setError('Erreur lors de la mise à jour de l\'arme. Veuillez réessayer.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBaseWeaponSelect = (baseWeapon: typeof baseWeapons[0] | null) => {
        setSelectedBaseWeapon(baseWeapon);
        if (baseWeapon) {
            setNomArme(baseWeapon.nom);
            setPrix((baseWeapon.prix_defaut / 100).toString());
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen">
                <div className="fixed inset-0 bg-black opacity-30" />

                <div className="relative bg-white rounded-lg p-8 max-w-md w-full mx-4">
                    <Dialog.Title className="text-lg font-medium mb-4">
                        Modifier l'arme
                    </Dialog.Title>

                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                            Mise à jour réussie !
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Date et heure
                            </label>
                            <input
                                type="datetime-local"
                                value={horodatage}
                                onChange={(e) => setHorodatage(e.target.value)}
                                className="border p-2 rounded w-full"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Employé
                            </label>
                            <input
                                type="text"
                                value={employe}
                                readOnly
                                className="border p-2 rounded w-full bg-gray-100"
                                disabled={isLoading}
                            />
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
                                disabled={isLoading}
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nom de l'arme
                            </label>
                            <input
                                type="text"
                                value={nomArme}
                                onChange={(e) => setNomArme(e.target.value)}
                                className="border p-2 rounded w-full"
                                required
                                readOnly={!!selectedBaseWeapon}
                                disabled={isLoading}
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
                                disabled={isLoading}
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
                                readOnly={!!selectedBaseWeapon}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 mr-2"
                                disabled={isLoading}
                            >
                                Annuler
                            </button>
                            <button
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
                                        Mise à jour...
                                    </>
                                ) : 'Mettre à jour'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Dialog>
    );
}