import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { createWeapon } from '../services/api';
import { useData } from '../context/DataContext';
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Ajouter une arme</DialogTitle>
                </DialogHeader>

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert>
                        <AlertDescription>Arme ajoutée avec succès !</AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">Employé</label>
                        <Select
                            value={selectedEmployee?.id?.toString() || ''}
                            onValueChange={(value) => {
                                const employee = employees.find(emp => emp.id === parseInt(value));
                                setSelectedEmployee(employee || null);
                            }}
                            disabled={isLoading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un employé" />
                            </SelectTrigger>
                            <SelectContent>
                                {employees.map((employee) => (
                                    <SelectItem key={employee.id} value={employee.id.toString()}>
                                        {employee.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">Arme de base</label>
                        <Select
                            value={selectedBaseWeapon?.id?.toString() || ''}
                            onValueChange={(value) => {
                                const baseWeapon = baseWeapons.find(w => w.id === parseInt(value));
                                handleBaseWeaponSelect(baseWeapon || null);
                            }}
                            disabled={isLoading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une arme de base" />
                            </SelectTrigger>
                            <SelectContent>
                                {baseWeapons.map((weapon) => (
                                    <SelectItem key={weapon.id} value={weapon.id.toString()}>
                                        {weapon.nom} - {new Intl.NumberFormat('en-US', {
                                            style: 'currency',
                                            currency: 'USD'
                                        }).format(weapon.prix_defaut / 100)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">Détenteur</label>
                        <Input
                            type="text"
                            value={detenteur}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDetenteur(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">Sérigraphie</label>
                        <Input
                            type="text"
                            value={serigraphie}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSerigraphie(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">Prix (en dollars)</label>
                        <Input
                            type="number"
                            value={prix}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrix(e.target.value)}
                            required
                            readOnly
                            disabled={isLoading}
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                onClose();
                                resetForm();
                            }}
                            disabled={isLoading}
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
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