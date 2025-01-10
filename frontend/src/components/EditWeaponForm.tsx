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
    }, [weapon, baseWeapons]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!weapon) return;
        
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
                prix: priceInCents
            });
            onWeaponUpdated();
            onClose();
        } catch (err) {
            console.error('Erreur lors de la mise à jour de l\'arme:', err);
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
                <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

                <div className="relative bg-white rounded-lg p-8 max-w-md w-full mx-4">
                    <Dialog.Title className="text-lg font-medium mb-4">
                        Modifier l'arme
                    </Dialog.Title>

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
                                Nom de l'arme
                            </label>
                            <input
                                type="text"
                                value={nomArme}
                                onChange={(e) => setNomArme(e.target.value)}
                                className="border p-2 rounded w-full"
                                required
                                readOnly={!!selectedBaseWeapon}
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
                                readOnly={!!selectedBaseWeapon}
                            />
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 mr-2"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                            >
                                Mettre à jour
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Dialog>
    );
}