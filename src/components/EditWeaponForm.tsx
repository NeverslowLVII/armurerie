import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import { Weapon, updateWeapon } from '../services/api';
import { useData } from '../context/DataContext';
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import { SelectNative } from "@/components/ui/select-native";

interface EditWeaponFormProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly weapon: Weapon | null;
    readonly onWeaponUpdated: () => void;
}

export default function EditWeaponForm({ isOpen, onClose, weapon, onWeaponUpdated }: EditWeaponFormProps) {
    const { baseWeapons } = useData();
    const [employe, setEmploye] = useState(weapon?.employee?.name ?? '');
    const [detenteur, setDetenteur] = useState(weapon?.detenteur ?? '');
    const [nomArme, setNomArme] = useState(weapon?.nom_arme ?? '');
    const [serigraphie, setSerigraphie] = useState(weapon?.serigraphie ?? '');
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
        <Dialog open={isOpen}>
            <DialogPortal>
                <DialogOverlay />
                <DialogContent className="max-w-md">
                    <DialogTitle className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                        {weapon ? 'Modifier une arme' : 'Créer une nouvelle arme'}
                    </DialogTitle>
                    
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 rounded">
                            Mise à jour réussie !
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                        <div className="mb-4">
                            <label htmlFor="datetime" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                Date et heure
                            </label>
                            <Input
                                id="datetime"
                                type="datetime-local"
                                value={horodatage}
                                onChange={(e) => setHorodatage(e.target.value)}
                                className="border p-2 rounded w-full dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="employee" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                Employé
                            </label>
                            <Input
                                id="employee"
                                type="text"
                                value={employe}
                                readOnly
                                className="border p-2 rounded w-full bg-neutral-100 dark:bg-neutral-600 dark:border-neutral-500"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="baseWeapon" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                Arme de base
                            </label>
                            <SelectNative
                                id="baseWeapon"
                                value={selectedBaseWeapon?.id ?? ''}
                                onChange={(e) => {
                                    const baseWeapon = baseWeapons.find(w => w.id === parseInt(e.target.value));
                                    handleBaseWeaponSelect(baseWeapon || null);
                                }}
                                className="border p-2 rounded w-full dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
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
                            <label htmlFor="holder" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                Détenteur
                            </label>
                            <Input
                                id="holder"
                                type="text"
                                value={detenteur}
                                onChange={(e) => setDetenteur(e.target.value)}
                                className="border p-2 rounded w-full dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="weaponName" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                Nom de l'arme
                            </label>
                            <Input
                                id="weaponName"
                                type="text"
                                value={nomArme}
                                onChange={(e) => setNomArme(e.target.value)}
                                className="border p-2 rounded w-full dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                                required
                                readOnly={!!selectedBaseWeapon}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="serigraphy" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                Sérigraphie
                            </label>
                            <Input
                                id="serigraphy"
                                type="text"
                                value={serigraphie}
                                onChange={(e) => setSerigraphie(e.target.value)}
                                className="border p-2 rounded w-full dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="price" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                Prix (en dollars)
                            </label>
                            <Input
                                id="price"
                                type="number"
                                value={prix}
                                onChange={(e) => setPrix(e.target.value)}
                                className="border p-2 rounded w-full dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                                required
                                min="0"
                                step="0.01"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="flex justify-end">
                            <Button
                                type="button"
                                onClick={onClose}
                                className="bg-neutral-500 dark:bg-neutral-700 text-white px-4 py-2 rounded hover:bg-neutral-600 dark:hover:bg-neutral-800 mr-2"
                                disabled={isLoading}
                            >
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                className={`${
                                    isLoading ? 'bg-red-300 dark:bg-red-400' : 'bg-red-500 dark:bg-red-700 hover:bg-red-600 dark:hover:bg-red-800'
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
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </DialogPortal>
        </Dialog>
    );
}