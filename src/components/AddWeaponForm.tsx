import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectNative } from '@/components/ui/select-native';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Trash } from 'lucide-react';
import { useSession } from 'next-auth/react';
import type React from 'react';
import { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { createWeapon } from '../services/api';
import { logWeaponModification } from '../utils/discord';
import { motion } from 'framer-motion';

interface AddWeaponFormProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onWeaponAdded: () => void;
}

interface OrderItem {
  nom_arme: string;
  quantity: number;
  serigraphie: string;
  prix: number;
}

// Fonction pour notifier que la commande a été complétée
async function notifyOrderCompletion(orderName: string): Promise<boolean> {
  try {
    const response = await fetch('/api/discord/webhook/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderName,
      }),
    });

    if (!response.ok) {
      console.error(
        'Erreur lors de la notification de complétion:',
        await response.text()
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception lors de la notification de complétion:', error);
    return false;
  }
}

// Define animation variants for success message
const successVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

export default function AddWeaponForm({
  isOpen,
  onClose,
  onWeaponAdded,
}: AddWeaponFormProps) {
  const { users, baseWeapons, refreshUsers } = useData();
  const { toast } = useToast();
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<string>('single');

  // État pour l'ajout d'arme simple
  const [selectedUser, setSelectedUser] = useState<(typeof users)[0] | null>(
    null
  );
  const [selectedBaseWeapon, setSelectedBaseWeapon] = useState<
    (typeof baseWeapons)[0] | null
  >(null);
  const [detenteur, setDetenteur] = useState('');
  const [bp, setBp] = useState('');
  const [serigraphie, setSerigraphie] = useState('');
  const [prix, setPrix] = useState('');

  // État pour l'ajout d'armes groupé
  const [orderName, setOrderName] = useState('');
  const [orderItems, setOrderItems] = useState<
    Array<{
      baseWeapon: (typeof baseWeapons)[0];
      quantity: number;
      serialNumbers: string[];
    }>
  >([]);
  const [serialNumbers, setSerialNumbers] = useState<{
    [key: string]: string[];
  }>({});
  const [deleteOrderAfterAdd, setDeleteOrderAfterAdd] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Charger les utilisateurs si nécessaire à l'ouverture
  useEffect(() => {
    if (isOpen && users.length === 0) {
      refreshUsers().catch(error => {
        console.error("Failed to load users for AddWeaponForm:", error);
        toast({
          variant: 'destructive',
          title: 'Erreur de chargement',
          description: 'Impossible de charger la liste des utilisateurs.',
        });
      });
    }
  }, [isOpen, users.length, refreshUsers, toast]);

  const resetForm = () => {
    setSelectedUser(null);
    setDetenteur('');
    setBp('');
    setSelectedBaseWeapon(null);
    setSerigraphie('');
    setPrix('');
    setOrderName('');
    setOrderItems([]);
    setSerialNumbers({});
    setDeleteOrderAfterAdd(true);
    setError(null);
    setSuccess(false);
    setIsLoading(false);
    setActiveTab('single');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !selectedBaseWeapon) return;

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Conversion du prix de dollars (avec décimales) en centimes
      const prixEnCentimes = Math.round(Number.parseFloat(prix) * 100);

      const weaponData = {
        user_id: selectedUser.id,
        detenteur,
        bp,
        nom_arme: selectedBaseWeapon.nom,
        serigraphie,
        prix: prixEnCentimes, // Utiliser le prix saisi et converti en centimes
        cout_production: selectedBaseWeapon.cout_production_defaut,
        horodateur: new Date().toISOString(),
      };

      await createWeapon(weaponData);

      // Log the weapon creation to Discord
      const weaponForLog = {
        name: weaponData.nom_arme,
        model: weaponData.nom_arme,
        price: weaponData.prix,
        cost: weaponData.cout_production,
        description: weaponData.serigraphie,
      };

      // Utiliser le nom d'utilisateur de la session ou une valeur par défaut
      const username = session?.user?.name || 'Utilisateur inconnu';

      // Envoyer les logs à Discord
      logWeaponModification(weaponForLog, username, 'create').catch((error) => {
        console.error("Erreur lors de l'envoi des logs:", error);
      });

      setSuccess(true);
      onWeaponAdded();
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1000);
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'arme:", error);
      setError("Erreur lors de l'ajout de l'arme. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBaseWeaponSelect = (
    baseWeapon: (typeof baseWeapons)[0] | null
  ) => {
    setSelectedBaseWeapon(baseWeapon);
    if (baseWeapon) {
      setPrix((baseWeapon.prix_defaut / 100).toString());
    } else {
      setPrix('');
    }
  };

  // Fonction pour extraire les informations d'une commande depuis le presse-papiers
  const handleOrderPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData('text');
    try {
      // Essaie de parser le texte comme un webhook Discord
      const orderData = parseOrderFromText(text);
      if (orderData) {
        setOrderName(orderData.orderName);

        // Créer les éléments de commande
        const newOrderItems = orderData.items.map((item) => {
          const baseWeapon =
            baseWeapons.find((w) => w.nom === item.nom_arme) || baseWeapons[0];
          return {
            baseWeapon,
            quantity: item.quantity,
            serialNumbers: Array.from(
              { length: item.quantity },
              () => ''
            ) as string[],
          };
        });

        setOrderItems(newOrderItems);

        // Initialiser les numéros de série
        const newSerialNumbers: { [key: string]: string[] } = {};
        for (const [index, item] of newOrderItems.entries()) {
          newSerialNumbers[`item-${index}`] = Array.from(
            { length: item.quantity },
            () => ''
          ) as string[];
        }
        setSerialNumbers(newSerialNumbers);

        toast({
          title: 'Commande importée',
          description: `Commande "${orderData.orderName}" importée avec ${orderData.items.length} type(s) d'armes`,
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'analyse de la commande:", error);
      toast({
        variant: 'destructive',
        title: "Erreur d'importation",
        description:
          'Impossible de parser le format de la commande. Veuillez vérifier votre copie.',
      });
    }
  };

  // Fonction pour analyser le texte d'une commande Discord
  const parseOrderFromText = (
    text: string
  ): { orderName: string; items: OrderItem[] } | null => {
    // Simple heuristique pour extraire le titre et les éléments de la commande
    const lines = text.split('\n');

    // Trouve le titre de la commande (contenant "validée")
    const titleLine = lines.find((line) =>
      line.toLowerCase().includes('commande validée')
    );
    const orderName = titleLine
      ? titleLine.replace(/.*commande validée/i, '').trim()
      : 'Nouvelle commande';

    // Trouve les lignes avec format "- Nx NomArme"
    const itemRegex = /- (\d+)x (.+)/;
    const items: OrderItem[] = [];

    for (const line of lines) {
      const match = line.match(itemRegex);
      if (match) {
        const quantity = Number.parseInt(match[1], 10);
        const nom_arme = match[2].trim();

        // Trouve le prix par défaut de cette arme
        const baseWeapon = baseWeapons.find((w) => w.nom === nom_arme);
        const prix = baseWeapon ? baseWeapon.prix_defaut : 0;

        items.push({
          nom_arme,
          quantity,
          serigraphie: '',
          prix,
        });
      }
    }

    return items.length > 0 ? { orderName, items } : null;
  };

  // Fonction pour ajouter les armes groupées
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Préparer les armes à ajouter
      const weaponsToAdd: Array<{
        user_id: number;
        detenteur: string;
        bp: string;
        nom_arme: string;
        serigraphie: string;
        prix: number;
        cout_production: number;
        horodateur: string;
      }> = [];

      // Pour chaque type d'arme dans la commande
      for (const [itemIndex, item] of orderItems.entries()) {
        const serialNumbersForItem = serialNumbers[`item-${itemIndex}`] || [];

        // Pour chaque exemplaire de ce type d'arme
        for (let i = 0; i < item.quantity; i++) {
          const serialNumber = serialNumbersForItem[i] || '';
          weaponsToAdd.push({
            user_id: selectedUser.id,
            detenteur: detenteur || orderName,
            bp,
            nom_arme: item.baseWeapon.nom,
            serigraphie: serialNumber,
            prix: item.baseWeapon.prix_defaut,
            cout_production: item.baseWeapon.cout_production_defaut,
            horodateur: new Date().toISOString(),
          });
        }
      }

      // Utiliser le nom d'utilisateur de la session ou une valeur par défaut
      const username = session?.user?.name || 'Utilisateur inconnu';

      // Soumettre toutes les armes une par une
      for (const weapon of weaponsToAdd) {
        await createWeapon(weapon);

        // Log the weapon creation to Discord
        const weaponForLog = {
          name: weapon.nom_arme,
          model: weapon.nom_arme,
          price: weapon.prix,
          cost: weapon.cout_production,
          description: weapon.serigraphie,
        };

        // Envoyer les logs à Discord
        try {
          await logWeaponModification(weaponForLog, username, 'create');
        } catch (error) {
          console.error("Erreur lors de l'envoi des logs:", error);
        }
      }

      // Supprimer la commande du canal Discord si demandé
      if (deleteOrderAfterAdd) {
        try {
          await notifyOrderCompletion(orderName);
        } catch (error) {
          console.error(
            'Erreur lors de la notification de suppression:',
            error
          );
        }
      }

      setSuccess(true);
      onWeaponAdded();
      toast({
        title: 'Armes ajoutées',
        description: `${weaponsToAdd.length} armes ont été ajoutées avec succès.`,
      });

      setTimeout(() => {
        onClose();
        resetForm();
      }, 1000);
    } catch (error) {
      console.error("Erreur lors de l'ajout groupé d'armes:", error);
      setError("Erreur lors de l'ajout des armes. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour gérer la modification des numéros de série
  const handleSerialNumberChange = (
    itemIndex: number,
    serialIndex: number,
    value: string
  ) => {
    const key = `item-${itemIndex}`;
    setSerialNumbers((prev) => {
      const newSerialNumbers = { ...prev };
      if (!newSerialNumbers[key]) {
        newSerialNumbers[key] = Array.from(
          { length: orderItems[itemIndex].quantity },
          () => ''
        ) as string[];
      }
      const newArray = [...newSerialNumbers[key]];
      newArray[serialIndex] = value;
      newSerialNumbers[key] = newArray;
      return newSerialNumbers;
    });
  };

  // Pour ajouter une ligne de numéro de série
  const addSerialInput = (itemIndex: number) => {
    setOrderItems((prev) => {
      const newItems = [...prev];
      newItems[itemIndex] = {
        ...newItems[itemIndex],
        quantity: newItems[itemIndex].quantity + 1,
        serialNumbers: [...newItems[itemIndex].serialNumbers, ''],
      };
      return newItems;
    });

    const key = `item-${itemIndex}`;
    setSerialNumbers((prev) => {
      const newSerialNumbers = { ...prev };
      if (!newSerialNumbers[key]) {
        newSerialNumbers[key] = Array.from(
          { length: orderItems[itemIndex].quantity },
          () => ''
        ) as string[];
      }
      newSerialNumbers[key] = [...newSerialNumbers[key], ''];
      return newSerialNumbers;
    });
  };

  // Pour supprimer une ligne de numéro de série
  const removeSerialInput = (itemIndex: number, serialIndex: number) => {
    setOrderItems((prev) => {
      const newItems = [...prev];
      newItems[itemIndex] = {
        ...newItems[itemIndex],
        quantity: Math.max(1, newItems[itemIndex].quantity - 1),
        serialNumbers: newItems[itemIndex].serialNumbers.filter(
          (_, i) => i !== serialIndex
        ),
      };
      return newItems;
    });

    const key = `item-${itemIndex}`;
    setSerialNumbers((prev) => {
      const newSerialNumbers = { ...prev };
      if (newSerialNumbers[key]) {
        newSerialNumbers[key] = newSerialNumbers[key].filter(
          (_, i) => i !== serialIndex
        );
      }
      return newSerialNumbers;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay className="bg-black/30 backdrop-blur-sm dark:bg-neutral-900/40" />
        <DialogContent className="h-[90vh] max-w-[90vw] border border-neutral-800 bg-neutral-900 p-6 shadow-2xl sm:max-w-[600px] overflow-y-auto">
          <DialogTitle className="text-xl font-semibold text-neutral-100">
            Ajouter une arme
          </DialogTitle>

          {error && (
            <div className="mb-4 rounded border-l-4 border-red-700 bg-red-900/50 p-2 text-sm text-red-300">
              {error}
            </div>
          )}

          {success && (
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={successVariants}
              className="mb-4 rounded border-l-4 border-emerald-700 bg-emerald-900/50 p-2 text-sm text-emerald-300"
            >
              Arme ajoutée avec succès !
            </motion.div>
          )}

          <div className="mb-4">
            <label
              htmlFor="user"
              className="mb-1 block text-sm font-medium text-neutral-300"
            >
              Utilisateur
            </label>
            <SelectNative
              id="user"
              value={selectedUser?.id ?? ''}
              onChange={(e) => {
                const user = users.find(
                  (u) => u.id === Number.parseInt(e.target.value)
                );
                setSelectedUser(user || null);
              }}
              className="w-full rounded-md border border-neutral-600 bg-neutral-800 py-1.5 pl-4 pr-10 text-sm text-neutral-100 placeholder-neutral-400 focus:border-red-500 focus:ring-red-500"
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
            <label
              htmlFor="detenteur"
              className="mb-1 block text-sm font-medium text-neutral-300"
            >
              Détenteur
            </label>
            <Input
              id="detenteur"
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

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4 grid grid-cols-2 bg-neutral-800 text-neutral-400">
              <TabsTrigger value="single" className="data-[state=active]:bg-red-700 data-[state=active]:text-neutral-100">Arme individuelle</TabsTrigger>
              <TabsTrigger value="bulk" className="data-[state=active]:bg-red-700 data-[state=active]:text-neutral-100">Commande groupée</TabsTrigger>
            </TabsList>

            <TabsContent value="single">
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    required
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
                    htmlFor="serigraphie"
                    className="mb-1 block text-sm font-medium text-neutral-300"
                  >
                    Sérigraphie
                  </label>
                  <Input
                    id="serigraphie"
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
                    htmlFor="prix"
                    className="mb-1 block text-sm font-medium text-neutral-300"
                  >
                    Prix (en dollars)
                  </label>
                  <Input
                    id="prix"
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
                    onClick={() => {
                      onClose();
                      resetForm();
                    }}
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
                      isLoading ? 'bg-red-500/50' : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500'
                    } text-white`}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg
                          className="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <title>Chargement...</title>
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Ajout en cours...
                      </>
                    ) : (
                      'Ajouter'
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="bulk">
              <form onSubmit={handleBulkSubmit} className="space-y-4">
                <div className="mb-4">
                  <label
                    htmlFor="orderName"
                     className="mb-1 block text-sm font-medium text-neutral-300"
                  >
                    Nom de la commande
                  </label>
                  <Input
                    id="orderName"
                    type="text"
                    value={orderName}
                    onChange={(e) => setOrderName(e.target.value)}
                    className="w-full rounded-md border border-neutral-600 bg-neutral-800 py-1.5 px-4 text-sm text-neutral-100 placeholder-neutral-400 focus:border-red-500 focus:ring-red-500"
                    required
                    disabled={isLoading}
                    placeholder="Commande du client X"
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="orderData"
                    className="mb-1 block text-sm font-medium text-neutral-300"
                  >
                    Données de la commande (Collez le message Discord ici)
                  </label>
                  <Textarea
                    id="orderData"
                    className="min-h-[100px] w-full rounded-md border border-neutral-600 bg-neutral-800 py-1.5 px-4 text-sm text-neutral-100 placeholder-neutral-400 focus:border-red-500 focus:ring-red-500"
                    disabled={isLoading}
                    placeholder="Copiez et collez le message Discord contenant les détails de la commande ici..."
                    onPaste={handleOrderPaste}
                  />
                </div>

                {orderItems.length > 0 && (
                  <div className="mb-4 mt-6 space-y-4">
                    <h3 className="mb-2 text-lg font-semibold text-neutral-100">
                      Armes à ajouter
                    </h3>

                    {orderItems.map((item, itemIndex) => (
                      <Card
                        key={`${item.baseWeapon.nom}-${itemIndex}`}
                        className="mb-4 border border-neutral-700 bg-neutral-800/50"
                      >
                        <CardContent className="p-4">
                          <h4 className="mb-3 font-medium text-red-400">
                            {item.baseWeapon.nom} ({item.quantity})
                          </h4>

                          {
                            Array.from({ length: item.quantity }).map(
                              (_, serialIndex) => (
                                // biome-ignore lint/suspicious/noArrayIndexKey: <Index is needed for repeated serial inputs>
                                <div
                                  key={`serial-${itemIndex}-${serialIndex}`}
                                  className="mb-2 flex items-center"
                                >
                                  <Label className="mr-2 w-24 shrink-0 text-sm text-neutral-300">
                                    Numéro {serialIndex + 1}:
                                  </Label>
                                  <Input
                                    type="text"
                                    value={
                                      serialNumbers[`item-${itemIndex}`]?.[
                                        serialIndex
                                      ] || ''
                                    }
                                    onChange={(e) =>
                                      handleSerialNumberChange(
                                        itemIndex,
                                        serialIndex,
                                        e.target.value
                                      )
                                    }
                                    className="mr-2 flex-1 rounded-md border border-neutral-600 bg-neutral-700 py-1 px-2 text-sm text-neutral-100 placeholder-neutral-400 focus:border-red-500 focus:ring-red-500"
                                    placeholder="Numéro de série"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      removeSerialInput(itemIndex, serialIndex)
                                    }
                                    className="h-8 w-8 text-red-400 hover:bg-neutral-700 hover:text-red-300"
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              )
                            )
                          }

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addSerialInput(itemIndex)}
                            className="mt-2 border-neutral-600 text-neutral-300 hover:bg-neutral-800"
                          >
                            <Plus className="mr-1 h-4 w-4" /> Ajouter un numéro
                          </Button>
                        </CardContent>
                      </Card>
                    ))}

                    <div className="mt-4 flex items-center">
                      <Checkbox
                        id="deleteOrder"
                        checked={deleteOrderAfterAdd}
                        onCheckedChange={(checked) =>
                          setDeleteOrderAfterAdd(checked === true)
                        }
                        className="border-neutral-600 data-[state=checked]:bg-red-600 data-[state=checked]:text-white"
                      />
                      <Label htmlFor="deleteOrder" className="ml-2 text-sm text-neutral-300">
                        Supprimer la commande du canal Discord après l&apos;ajout
                      </Label>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-2">
                  <Button
                    type="button"
                    onClick={() => {
                      onClose();
                      resetForm();
                    }}
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
                      isLoading ? 'bg-red-500/50' : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500'
                    } text-white`}
                    disabled={isLoading || orderItems.length === 0}
                  >
                    {isLoading ? (
                      <>
                        <svg
                          className="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <title>Chargement...</title>
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Ajout en cours...
                      </>
                    ) : (
                      'Ajouter en groupe'
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
