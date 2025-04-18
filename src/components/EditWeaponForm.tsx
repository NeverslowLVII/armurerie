import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogPortal,
  DialogOverlay,
} from '@/components/ui/dialog';
import { Weapon, updateWeapon } from '../services/api';
import { useData } from '../context/DataContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SelectNative } from '@/components/ui/select-native';
import { LoadingButton } from '@/components/ui/loading';
import { logWeaponModification } from '../utils/discord';
import { useSession } from 'next-auth/react';

interface EditWeaponFormProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly weapon: Weapon | null;
  readonly onWeaponUpdated: () => void;
}

export default function EditWeaponForm({
  isOpen,
  onClose,
  weapon,
  onWeaponUpdated,
}: EditWeaponFormProps) {
  const { baseWeapons } = useData();
  const { data: session } = useSession();
  const [user, setUser] = useState(weapon?.user?.name ?? '');
  const [detenteur, setDetenteur] = useState(weapon?.detenteur ?? '');
  const [bp, setBp] = useState(weapon?.bp ?? '');
  const [nomArme, setNomArme] = useState(weapon?.nom_arme ?? '');
  const [serigraphie, setSerigraphie] = useState(weapon?.serigraphie ?? '');
  const [prix, setPrix] = useState(weapon ? (weapon.prix / 100).toString() : '');
  const [selectedBaseWeapon, setSelectedBaseWeapon] = useState(
    baseWeapons.find(w => w.nom === weapon?.nom_arme) || null
  );
  const [horodatage, setHorodatage] = useState(
    weapon ? new Date(weapon.horodateur).toISOString().slice(0, 16) : ''
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (weapon) {
      setUser(weapon.user.name);
      setDetenteur(weapon.detenteur);
      setBp(weapon.bp || '');
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
        : Number.parseInt(prix) * 100;

      // Créer une copie des données précédentes pour comparer plus tard
      const previousWeaponData = {
        name: weapon.nom_arme,
        model: weapon.nom_arme,
        price: weapon.prix,
        cost: weapon.cout_production || 0,
        description: weapon.serigraphie,
      };

      const updatedData = {
        horodateur: new Date(horodatage).toISOString(),
        user_id: weapon.user_id,
        detenteur,
        bp,
        nom_arme: selectedBaseWeapon ? selectedBaseWeapon.nom : nomArme,
        serigraphie,
        prix: priceInCents,
        cout_production: 0,
      };

      await updateWeapon(weapon.id, updatedData);

      // Envoyer la notification de modification à Discord
      const weaponForLog = {
        name: updatedData.nom_arme,
        model: updatedData.nom_arme,
        price: updatedData.prix,
        cost: updatedData.cout_production,
        description: updatedData.serigraphie,
      };

      // Utiliser le nom d'utilisateur de la session ou une valeur par défaut
      const username = session?.user?.name || 'Utilisateur inconnu';

      // Envoyer les logs à Discord
      logWeaponModification(weaponForLog, username, 'update', previousWeaponData).catch(error => {
        console.error("Erreur lors de l'envoi des logs:", error);
      });

      setSuccess(true);
      onWeaponUpdated();
      setTimeout(() => {
        onClose();
      }, 1000); // Fermer après 1 seconde pour montrer le message de succès
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'arme:", error);
      setError("Erreur lors de la mise à jour de l'arme. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBaseWeaponSelect = (baseWeapon: (typeof baseWeapons)[0] | null) => {
    setSelectedBaseWeapon(baseWeapon);
    if (baseWeapon) {
      setNomArme(baseWeapon.nom);
      setPrix((baseWeapon.prix_defaut / 100).toString());
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent className="sm:max-w-[425px]" data-testid="edit-weapon-form">
          <DialogTitle className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
            {weapon ? 'Modifier une arme' : 'Créer une nouvelle arme'}
          </DialogTitle>

          {error && (
            <div className="mb-4 rounded border border-red-400 bg-red-100 p-3 text-red-700 dark:border-red-700 dark:bg-red-900 dark:text-red-300">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded border border-green-400 bg-green-100 p-3 text-green-700 dark:border-green-700 dark:bg-green-900 dark:text-green-300">
              Mise à jour réussie !
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="mb-4">
              <label
                htmlFor="datetime"
                className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                Date et heure
              </label>
              <Input
                id="datetime"
                type="datetime-local"
                value={horodatage}
                onChange={e => setHorodatage(e.target.value)}
                className="w-full rounded border p-2 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                required
                disabled={isLoading}
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="user"
                className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                Utilisateur
              </label>
              <Input
                id="user"
                type="text"
                value={user}
                readOnly
                className="w-full rounded border bg-neutral-100 p-2 dark:border-neutral-500 dark:bg-neutral-600"
                disabled={isLoading}
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="baseWeapon"
                className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                Arme de base
              </label>
              <SelectNative
                id="baseWeapon"
                value={selectedBaseWeapon?.id ?? ''}
                onChange={e => {
                  const baseWeapon = baseWeapons.find(
                    w => w.id === Number.parseInt(e.target.value)
                  );
                  handleBaseWeaponSelect(baseWeapon || null);
                }}
                className="w-full rounded border p-2 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                disabled={isLoading}
              >
                <option value="">Sélectionner une arme de base</option>
                {baseWeapons.map(weapon => (
                  <option key={weapon.id} value={weapon.id}>
                    {weapon.nom} -{' '}
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(weapon.prix_defaut / 100)}
                  </option>
                ))}
              </SelectNative>
            </div>

            <div className="mb-4">
              <label
                htmlFor="holder"
                className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                Détenteur
              </label>
              <Input
                id="holder"
                type="text"
                value={detenteur}
                onChange={e => setDetenteur(e.target.value)}
                className="w-full rounded border p-2 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                required
                disabled={isLoading}
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="bp"
                className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                BP (Boîte Postale)
              </label>
              <Input
                id="bp"
                type="text"
                value={bp}
                onChange={e => setBp(e.target.value)}
                className="w-full rounded border p-2 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                disabled={isLoading}
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="weaponName"
                className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                Nom de l&apos;arme
              </label>
              <Input
                id="weaponName"
                type="text"
                value={nomArme}
                onChange={e => setNomArme(e.target.value)}
                className="w-full rounded border p-2 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                required
                readOnly={!!selectedBaseWeapon}
                disabled={isLoading}
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="serigraphy"
                className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                Sérigraphie
              </label>
              <Input
                id="serigraphy"
                type="text"
                value={serigraphie}
                onChange={e => setSerigraphie(e.target.value)}
                className="w-full rounded border p-2 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                required
                disabled={isLoading}
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="price"
                className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                Prix (en dollars)
              </label>
              <Input
                id="price"
                type="number"
                value={prix}
                onChange={e => setPrix(e.target.value)}
                className="w-full rounded border p-2 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
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
                className="mr-2 rounded bg-neutral-500 px-4 py-2 text-white hover:bg-neutral-600 dark:bg-neutral-700 dark:hover:bg-neutral-800"
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className={`${
                  isLoading
                    ? 'bg-red-300 dark:bg-red-400'
                    : 'bg-red-500 hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-800'
                } flex items-center rounded px-4 py-2 text-white`}
                disabled={isLoading}
              >
                <LoadingButton loading={isLoading}>Mettre à jour</LoadingButton>
              </Button>
            </div>
          </form>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
