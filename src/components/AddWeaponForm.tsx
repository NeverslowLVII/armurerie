import React, { useState } from 'react';
import { createWeapon } from '../services/api';
import { useData } from '../context/DataContext';
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import { SelectNative } from "@/components/ui/select-native";
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface AddWeaponFormProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly onWeaponAdded: () => void;
}

export default function AddWeaponForm({ isOpen, onClose, onWeaponAdded }: AddWeaponFormProps) {
    const { users, baseWeapons } = useData();
    const [selectedUser, setSelectedUser] = useState<typeof users[0] | null>(null);
    const [selectedBaseWeapon, setSelectedBaseWeapon] = useState<typeof baseWeapons[0] | null>(null);
    const [detenteur, setDetenteur] = useState('');
    const [serigraphie, setSerigraphie] = useState('');
    const [prix, setPrix] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const resetForm = () => {
        setSelectedUser(null);
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
        if (!selectedUser || !selectedBaseWeapon) return;

        setIsLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await createWeapon({
                user_id: selectedUser.id,
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
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogTitle>
                    Ajouter une arme
                </DialogTitle>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-200 rounded">
                        Arme ajoutée avec succès !
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="user" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Utilisateur
                        </label>
                        <SelectNative
                            id="user"
                            value={selectedUser?.id ?? ''}
                            onChange={(e) => {
                                const user = users.find(u => u.id === parseInt(e.target.value));
                                setSelectedUser(user || null);
                            }}
                            className="border p-2 rounded w-full dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
                            required
                            disabled={isLoading}
                        >
                            <option value="">Sélectionner un utilisateur</option>
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.name}
                                </option>
                            ))}
                        </SelectNative>
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
                            className="border p-2 rounded w-full dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
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
                        <label htmlFor="detenteur" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Détenteur
                        </label>
                        <Input
                            id="detenteur"
                            type="text"
                            value={detenteur}
                            onChange={(e) => setDetenteur(e.target.value)}
                            className="border p-2 rounded w-full dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="serigraphie" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Sérigraphie
                        </label>
                        <Input
                            id="serigraphie"
                            type="text"
                            value={serigraphie}
                            onChange={(e) => setSerigraphie(e.target.value)}
                            className="border p-2 rounded w-full dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="prix" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Prix (en dollars)
                        </label>
                        <Input
                            id="prix"
                            type="number"
                            value={prix}
                            onChange={(e) => setPrix(e.target.value)}
                            className="border p-2 rounded w-full dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
                            required
                            min="0"
                            step="0.01"
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
                            variant="secondary"
                            className="mr-2"
                            disabled={isLoading}
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            variant="destructive"
                            className="flex items-center"
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
            </DialogContent>
        </Dialog>
    );
}