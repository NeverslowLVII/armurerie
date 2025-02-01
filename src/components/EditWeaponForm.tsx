"use client"

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Weapon, updateWeapon } from '../services/api';
import { useData } from '../context/DataContext';
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EditWeaponFormProps {
    readonly open: boolean;
    readonly onClose: () => void;
    readonly weapon: Weapon | null;
    readonly onWeaponUpdated: () => void;
}

export default function EditWeaponForm({ open, onClose, weapon, onWeaponUpdated }: EditWeaponFormProps) {
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
            }, 1000);
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
        <Dialog open={open} onOpenChange={(openState) => { if (!openState) onClose() }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Modifier l'arme</DialogTitle>
                </DialogHeader>

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert>
                        <AlertDescription>Mise à jour réussie !</AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Date et heure</Label>
                        <Input
                            type="datetime-local"
                            value={horodatage}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHorodatage(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Employé</Label>
                        <Input
                            type="text"
                            value={employe}
                            readOnly
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Arme de base</Label>
                        <Select
                            value={selectedBaseWeapon?.id.toString() ?? ''}
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
                        <Label>Détenteur</Label>
                        <Input
                            type="text"
                            value={detenteur}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDetenteur(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Nom de l'arme</Label>
                        <Input
                            type="text"
                            value={nomArme}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNomArme(e.target.value)}
                            required
                            readOnly={!!selectedBaseWeapon}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Sérigraphie</Label>
                        <Input
                            type="text"
                            value={serigraphie}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSerigraphie(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Prix (en dollars)</Label>
                        <Input
                            type="number"
                            value={prix}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrix(e.target.value)}
                            required
                            readOnly={!!selectedBaseWeapon}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
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
                                    Mise à jour...
                                </>
                            ) : 'Mettre à jour'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}