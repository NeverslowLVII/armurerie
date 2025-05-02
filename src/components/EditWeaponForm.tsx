import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { LoadingButton } from '@/components/ui/loading';
import { SelectNative } from '@/components/ui/select-native';
import { useSession } from 'next-auth/react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import { type Weapon, updateWeapon } from '../services/api';
import { logWeaponModification } from '../utils/discord';

interface EditWeaponFormProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly weapon: Weapon | null;
  readonly onWeaponUpdated: () => void;
}

// Define animation variants for messages
const messageVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
};

export default function EditWeaponForm({
  isOpen,
  onClose,
  weapon,
  onWeaponUpdated,
}: EditWeaponFormProps) {
  const { baseWeapons, users, refreshUsers } = useData();
  const { data: session } = useSession();
  const [user, setUser] = useState(weapon?.user?.name ?? '');
  const [detenteur, setDetenteur] = useState(weapon?.detenteur ?? '');
  const [bp, setBp] = useState(weapon?.bp ?? '');
  const [nomArme, setNomArme] = useState(weapon?.nom_arme ?? '');
  const [serigraphie, setSerigraphie] = useState(weapon?.serigraphie ?? '');
  const [prix, setPrix] = useState(
    weapon ? (weapon.prix / 100).toString() : ''
  );
  const [selectedBaseWeapon, setSelectedBaseWeapon] = useState(
    baseWeapons.find((w) => w.nom === weapon?.nom_arme) || null
  );
  const [horodatage, setHorodatage] = useState(
    weapon ? new Date(weapon.horodateur).toISOString().slice(0, 16) : ''
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Charger les utilisateurs si nécessaire à l'ouverture
  useEffect(() => {
    if (isOpen && users.length === 0) {
      refreshUsers().catch(error => {
        console.error("Failed to load users for EditWeaponForm:", error);
        // Idéalement, afficher une erreur à l'utilisateur
        setError("Erreur: Impossible de charger la liste des utilisateurs pour l'édition.");
      });
    }
  }, [isOpen, users.length, refreshUsers]);

  useEffect(() => {
    if (weapon) {
      setUser(weapon.user.name);
      setDetenteur(weapon.detenteur);
      setBp(weapon.bp || '');
      setNomArme(weapon.nom_arme);
      setSerigraphie(weapon.serigraphie);
      setPrix((weapon.prix / 100).toString());
      setSelectedBaseWeapon(
        baseWeapons.find((w) => w.nom === weapon.nom_arme) || null
      );
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
      logWeaponModification(
        weaponForLog,
        username,
        'update',
        previousWeaponData
      ).catch((error) => {
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

  const handleBaseWeaponSelect = (
    baseWeapon: (typeof baseWeapons)[0] | null
  ) => {
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
        <DialogContent
          className="max-w-md border border-neutral-800 bg-neutral-900 p-6 shadow-2xl"
          data-testid="edit-weapon-form"
        >
          <DialogTitle className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
            {weapon ? 'Modifier une arme' : 'Créer une nouvelle arme'}
          </DialogTitle>

          {error && (
            <motion.div
              variants={messageVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="mb-4 rounded border-l-4 border-red-700 bg-red-900/50 p-2 text-sm text-red-300"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              variants={messageVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="mb-4 rounded border-l-4 border-emerald-700 bg-emerald-900/50 p-2 text-sm text-emerald-300"
            >
              Mise à jour réussie !
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="mb-4">
              <label
                htmlFor="datetime"
                className="mb-1 block text-sm font-medium text-neutral-300"
              >
                Date et heure
              </label>
              <Input
                id="datetime"
                type="datetime-local"
                value={horodatage}
                onChange={(e) => setHorodatage(e.target.value)}
                className="w-full rounded-md border border-neutral-600 bg-neutral-800 py-1.5 px-4 text-sm text-neutral-100 placeholder-neutral-400 focus:border-red-500 focus:ring-red-500"
                required
                disabled={isLoading}
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="user"
                className="mb-1 block text-sm font-medium text-neutral-300"
              >
                Utilisateur
              </label>
              <Input
                id="user"
                type="text"
                value={user}
                readOnly
                className="w-full rounded-md border border-neutral-600 bg-neutral-700 py-1.5 px-4 text-sm text-neutral-400 placeholder-neutral-500 focus:border-red-500 focus:ring-red-500 cursor-not-allowed"
                disabled
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="baseWeapon"
                className="mb-1 block text-sm font-medium text-neutral-300"
              >
                Arme de base
              </label>
              <SelectNative
                id="baseWeapon"
                value={selectedBaseWeapon?.id ?? ''}
                onChange={(e) => {
                  const baseWeapon = baseWeapons.find(
                    (w) => w.id === Number.parseInt(e.target.value)
                  );
                  handleBaseWeaponSelect(baseWeapon || null);
                }}
                className="w-full rounded-md border border-neutral-600 bg-neutral-800 py-1.5 pl-4 pr-10 text-sm text-neutral-100 placeholder-neutral-400 focus:border-red-500 focus:ring-red-500"
                disabled={isLoading}
              >
                <option value="">Sélectionner une arme de base</option>
                {baseWeapons.map((weapon) => (
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
                className="mb-1 block text-sm font-medium text-neutral-300"
              >
                Détenteur
              </label>
              <Input
                id="holder"
                type="text"
                value={detenteur}
                onChange={(e) => setDetenteur(e.target.value)}
                className="w-full rounded-md border border-neutral-600 bg-neutral-800 py-1.5 px-4 text-sm text-neutral-100 placeholder-neutral-400 focus:border-red-500 focus:ring-red-500"
                required
                disabled={isLoading}
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="bp"
                className="mb-1 block text-sm font-medium text-neutral-300"
              >
                BP (Boîte Postale)
              </label>
              <Input
                id="bp"
                type="text"
                value={bp}
                onChange={(e) => setBp(e.target.value)}
                className="w-full rounded-md border border-neutral-600 bg-neutral-800 py-1.5 px-4 text-sm text-neutral-100 placeholder-neutral-400 focus:border-red-500 focus:ring-red-500"
                disabled={isLoading}
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="weaponName"
                className="mb-1 block text-sm font-medium text-neutral-300"
              >
                Nom de l&apos;arme
              </label>
              <Input
                id="weaponName"
                type="text"
                value={nomArme}
                onChange={(e) => setNomArme(e.target.value)}
                className={`w-full rounded-md border border-neutral-600 py-1.5 px-4 text-sm placeholder-neutral-400 focus:border-red-500 focus:ring-red-500 ${
                  selectedBaseWeapon
                    ? 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
                    : 'bg-neutral-800 text-neutral-100'
                }`}
                required
                readOnly={!!selectedBaseWeapon}
                disabled={isLoading}
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="serigraphy"
                className="mb-1 block text-sm font-medium text-neutral-300"
              >
                Sérigraphie
              </label>
              <Input
                id="serigraphy"
                type="text"
                value={serigraphie}
                onChange={(e) => setSerigraphie(e.target.value)}
                className="w-full rounded-md border border-neutral-600 bg-neutral-800 py-1.5 px-4 text-sm text-neutral-100 placeholder-neutral-400 focus:border-red-500 focus:ring-red-500"
                required
                disabled={isLoading}
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="price"
                className="mb-1 block text-sm font-medium text-neutral-300"
              >
                Prix (en dollars)
              </label>
              <Input
                id="price"
                type="number"
                value={prix}
                onChange={(e) => setPrix(e.target.value)}
                className="w-full rounded-md border border-neutral-600 bg-neutral-800 py-1.5 px-4 text-sm text-neutral-100 placeholder-neutral-400 focus:border-red-500 focus:ring-red-500"
                required
                min="0"
                step="0.01"
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="border-neutral-600 text-neutral-300 hover:bg-neutral-800"
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="destructive"
                className={`flex items-center ${
                  isLoading
                    ? 'bg-red-500/50'
                    : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500'
                } text-white`}
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
