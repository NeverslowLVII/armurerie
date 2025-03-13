"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Search, X, Plus, Minus, FileSpreadsheet, BarChart4 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import axios from 'axios';

interface WeaponComponent {
  id?: string;
  name: string;
  category: string;
  puissance: number;
  cadence: number;
  precision: number;
  portee: number;
  capacite: number;
  recharge: number;
  cout: number;
  vente: number;
  canon_precision: number;
  canon_long: number;
  canon: number;
  canon_court: number;
  ressort: number;
  mire: number;
  detente: number;
  chien: number;
  armature_legere: number;
  armature: number;
  armature_lourde: number;
  armature_precision: number;
  crosse: number;
  total_ressort: number;
  total_acier: number;
}

interface OrderItem {
  weapon: WeaponComponent;
  quantity: number;
}

/**
 * Helper function to generate clean IDs from weapon names
 */
const cleanId = (name: string): string => {
  return name.replaceAll(/[^a-zA-Z0-9]/g, '-').toLowerCase();
};

/**
 * WeaponOrderCalculator Component
 * Allows users to select weapons and quantities to calculate necessary components and costs
 */
export function WeaponOrderCalculator() {
  const [weapons, setWeapons] = useState<WeaponComponent[]>([]);
  const [selectedWeapons, setSelectedWeapons] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string>('components');

  // Fetch weapons data
  useEffect(() => {
    const fetchWeapons = async () => {
      try {
        setLoading(true);
        setHasError(false);
        const response = await axios.get('/weapons/catalog');
        setWeapons(response.data);
      } catch (error_) {
        console.error('Error fetching weapons:', error_);
        setHasError(true);
        toast({
          variant: "destructive",
          title: "Erreur de chargement",
          description: "Impossible de charger le catalogue d'armes. Veuillez réessayer ultérieurement.",
          duration: 5000,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWeapons();
  }, [toast]);

  // Memoize weapon categories for better organization and filtering
  const weaponsByCategory = useMemo(() => {
    const categorized = new Map<string, WeaponComponent[]>();
    
    for (const weapon of weapons) {
      if (!categorized.has(weapon.category)) {
        categorized.set(weapon.category, []);
      }
      categorized.get(weapon.category)!.push(weapon);
    }
    
    // Convert to array of [category, weapons] pairs and sort alphabetically
    return [...categorized.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [weapons]);

  // Filter weapons based on search term
  const filteredWeapons = useMemo(() => {
    if (!searchTerm.trim()) return weapons;
    
    const term = searchTerm.toLowerCase();
    return weapons.filter(weapon => 
      weapon.name.toLowerCase().includes(term) ||
      weapon.category.toLowerCase().includes(term)
    );
  }, [weapons, searchTerm]);

  const handleCheckboxChange = (weapon: WeaponComponent, checked: boolean) => {
    if (checked) {
      setSelectedWeapons(prev => [...prev, { weapon, quantity: 1 }]);
      toast({
        title: "Arme ajoutée",
        description: `${weapon.name} a été ajouté à la commande`,
        duration: 2000,
      });
    } else {
      setSelectedWeapons(prev => prev.filter(item => item.weapon.name !== weapon.name));
      toast({
        title: "Arme retirée",
        description: `${weapon.name} a été retiré de la commande`,
        duration: 2000,
      });
    }
  };

  const handleQuantityChange = (weaponName: string, quantity: number) => {
    // Valider et limiter la quantité
    const validQuantity = Math.max(1, Math.min(999, quantity));
    
    setSelectedWeapons(prev => 
      prev.map(item => 
        item.weapon.name === weaponName ? { ...item, quantity: validQuantity } : item
      )
    );
  };

  const incrementQuantity = (weaponName: string) => {
    setSelectedWeapons(prev => 
      prev.map(item => 
        item.weapon.name === weaponName 
          ? { ...item, quantity: Math.min(999, item.quantity + 1) }
          : item
      )
    );
  };

  const decrementQuantity = (weaponName: string) => {
    setSelectedWeapons(prev => 
      prev.map(item => 
        item.weapon.name === weaponName && item.quantity > 1 
          ? { ...item, quantity: item.quantity - 1 } 
          : item
      )
    );
  };

  const handleClearSelection = () => {
    if (selectedWeapons.length > 0) {
      setSelectedWeapons([]);
      toast({
        title: "Commande effacée",
        description: "Toutes les armes ont été retirées de la commande",
        duration: 3000,
      });
    }
  };

  // Calculate totals from selected weapons
  const totals = useMemo(() => {
    return selectedWeapons.reduce(
      (acc, { weapon, quantity }) => {
        acc.canon_precision += weapon.canon_precision * quantity;
        acc.canon_long += weapon.canon_long * quantity;
        acc.canon += weapon.canon * quantity;
        acc.canon_court += weapon.canon_court * quantity;
        acc.ressort += weapon.ressort * quantity;
        acc.mire += weapon.mire * quantity;
        acc.detente += weapon.detente * quantity;
        acc.chien += weapon.chien * quantity;
        acc.armature_legere += weapon.armature_legere * quantity;
        acc.armature += weapon.armature * quantity;
        acc.armature_lourde += weapon.armature_lourde * quantity;
        acc.armature_precision += weapon.armature_precision * quantity;
        acc.crosse += weapon.crosse * quantity;
        acc.total_ressort += weapon.total_ressort * quantity;
        acc.total_acier += weapon.total_acier * quantity;
        acc.cout += weapon.cout * quantity;
        acc.vente += weapon.vente * quantity;
        acc.total_items += quantity;
        return acc;
      },
      {
        canon_precision: 0,
        canon_long: 0,
        canon: 0,
        canon_court: 0,
        ressort: 0,
        mire: 0,
        detente: 0,
        chien: 0,
        armature_legere: 0,
        armature: 0,
        armature_lourde: 0,
        armature_precision: 0,
        crosse: 0,
        total_ressort: 0,
        total_acier: 0,
        cout: 0,
        vente: 0,
        total_items: 0
      }
    );
  }, [selectedWeapons]);

  // Calculate profit margin and percentage
  const profit = totals.vente - totals.cout;
  const profitPercentage = totals.cout > 0 ? (profit / totals.cout) * 100 : 0;

  // Loading state with skeleton UI
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="max-h-60 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-2 py-1 border-b">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-5 w-full max-w-[200px]" />
            </div>
          ))}
        </div>
        <Skeleton className="h-[320px] w-full rounded-md" />
      </div>
    );
  }

  // Error state shown inline if the toast didn't display
  if (hasError && weapons.length === 0) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 dark:bg-red-900/20 rounded-md text-red-800 dark:text-red-200">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <p className="font-medium">Erreur de chargement</p>
        </div>
        <p className="mt-1 text-sm">Impossible de charger le catalogue d&apos;armes. Veuillez réessayer ultérieurement.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500 dark:text-neutral-400" />
        <Input
          type="text"
          placeholder="Rechercher une arme..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
            aria-label="Effacer la recherche"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weapon selection list */}
        <Card>
          <CardHeader className="pb-3 flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              Catalogue d&apos;Armes
            </CardTitle>
            {selectedWeapons.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleClearSelection}
                className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              >
                Tout effacer ({totals.total_items})
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[32rem]">
              <div className="p-4 space-y-6">
                {searchTerm 
                  ? (
                    <div className="space-y-2">
                      {filteredWeapons.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8">
                          <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center">
                            Aucune arme trouvée pour &quot;{searchTerm}&quot;
                          </p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setSearchTerm('')}
                            className="mt-2"
                          >
                            Effacer la recherche
                          </Button>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            {filteredWeapons.length} résultat{filteredWeapons.length > 1 ? 's' : ''}
                          </p>
                          {filteredWeapons.map((weapon) => (
                            <WeaponListItem
                              key={weapon.name}
                              weapon={weapon}
                              isSelected={selectedWeapons.some(item => item.weapon.name === weapon.name)}
                              selectedItem={selectedWeapons.find(item => item.weapon.name === weapon.name)}
                              onCheckboxChange={handleCheckboxChange}
                              onQuantityChange={handleQuantityChange}
                              onIncrement={incrementQuantity}
                              onDecrement={decrementQuantity}
                              showCategory
                            />
                          ))}
                        </>
                      )}
                    </div>
                  ) 
                  : (
                    weaponsByCategory.map(([category, categoryWeapons]) => (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                            {category}
                          </h4>
                          <Badge variant="secondary" className="text-xs">
                            {categoryWeapons.length}
                          </Badge>
                        </div>
                        <div className="space-y-1.5">
                          {categoryWeapons.map((weapon) => (
                            <WeaponListItem
                              key={weapon.name}
                              weapon={weapon}
                              isSelected={selectedWeapons.some(item => item.weapon.name === weapon.name)}
                              selectedItem={selectedWeapons.find(item => item.weapon.name === weapon.name)}
                              onCheckboxChange={handleCheckboxChange}
                              onQuantityChange={handleQuantityChange}
                              onIncrement={incrementQuantity}
                              onDecrement={decrementQuantity}
                            />
                          ))}
                        </div>
                      </div>
                    ))
                  )
                }
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Order summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg font-semibold">
                <FileSpreadsheet className="mr-2 h-5 w-5" />
                Récapitulatif
              </CardTitle>
              {selectedWeapons.length > 0 && (
                <CardDescription>
                  {totals.total_items} arme{totals.total_items > 1 ? 's' : ''} sélectionnée{totals.total_items > 1 ? 's' : ''}
                </CardDescription>
              )}
            </CardHeader>
            
            {selectedWeapons.length === 0 ? (
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="p-3.5 border-2 border-dashed rounded-full mb-4 border-neutral-200 dark:border-neutral-700">
                  <FileSpreadsheet className="h-7 w-7 text-neutral-400 dark:text-neutral-500" />
                </div>
                <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
                  Sélectionnez des armes pour calculer les ressources nécessaires
                </p>
              </CardContent>
            ) : (
              <>
                <CardContent className="pt-0">
                  <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full grid grid-cols-2">
                      <TabsTrigger value="components" className="flex items-center">
                        <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
                        Composants
                      </TabsTrigger>
                      <TabsTrigger value="financial" className="flex items-center">
                        <BarChart4 className="mr-1.5 h-3.5 w-3.5" />
                        Finances
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="components" className="mt-4">
                      <ScrollArea className="h-[28rem] pr-4 -mr-4">
                        <div className="space-y-6">
                          <div>
                            <h4 className="font-medium text-sm text-neutral-800 dark:text-neutral-300 mb-3">
                              Composants nécessaires
                            </h4>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                              {[
                                { name: 'Canon de précision', value: totals.canon_precision },
                                { name: 'Canon long', value: totals.canon_long },
                                { name: 'Canon', value: totals.canon },
                                { name: 'Canon court', value: totals.canon_court },
                                { name: 'Ressort', value: totals.ressort },
                                { name: 'Mire', value: totals.mire },
                                { name: 'Détente', value: totals.detente },
                                { name: 'Chien', value: totals.chien },
                                { name: 'Armature légère', value: totals.armature_legere },
                                { name: 'Armature', value: totals.armature },
                                { name: 'Armature lourde', value: totals.armature_lourde },
                                { name: 'Armature de précision', value: totals.armature_precision },
                                { name: 'Crosse', value: totals.crosse }
                              ].filter(item => item.value > 0).map(item => (
                                <div key={item.name} className="flex justify-between items-center py-1.5 px-3 bg-neutral-50 dark:bg-neutral-900 rounded-md">
                                  <span className="text-neutral-700 dark:text-neutral-300">{item.name}</span>
                                  <Badge variant="secondary" className="tabular-nums">{item.value}</Badge>
                                </div>
                              ))}
                              
                              {[
                                { name: 'Canon de précision', value: totals.canon_precision },
                                { name: 'Canon long', value: totals.canon_long },
                                { name: 'Canon', value: totals.canon },
                                { name: 'Canon court', value: totals.canon_court },
                                { name: 'Ressort', value: totals.ressort },
                                { name: 'Mire', value: totals.mire },
                                { name: 'Détente', value: totals.detente },
                                { name: 'Chien', value: totals.chien },
                                { name: 'Armature légère', value: totals.armature_legere },
                                { name: 'Armature', value: totals.armature },
                                { name: 'Armature lourde', value: totals.armature_lourde },
                                { name: 'Armature de précision', value: totals.armature_precision },
                                { name: 'Crosse', value: totals.crosse }
                              ].every(item => item.value === 0) && (
                                <p className="col-span-2 text-center text-sm text-neutral-500 dark:text-neutral-400">
                                  Aucun composant nécessaire
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-sm text-neutral-800 dark:text-neutral-300 mb-3">
                              Matériaux nécessaires
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                              <Card className="bg-neutral-50 dark:bg-neutral-900">
                                <CardContent className="p-3">
                                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Ressort</p>
                                  <p className="text-lg font-semibold mt-0.5 tabular-nums">{totals.total_ressort}</p>
                                </CardContent>
                              </Card>
                              <Card className="bg-neutral-50 dark:bg-neutral-900">
                                <CardContent className="p-3">
                                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Acier</p>
                                  <p className="text-lg font-semibold mt-0.5 tabular-nums">{totals.total_acier}</p>
                                </CardContent>
                              </Card>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-sm text-neutral-800 dark:text-neutral-300 mb-3">
                              Armes sélectionnées
                            </h4>
                            <div className="space-y-2">
                              {selectedWeapons.map(({ weapon, quantity }) => (
                                <div key={weapon.name} className="flex justify-between items-center py-2 px-3 bg-neutral-50 dark:bg-neutral-900 rounded-md">
                                  <span className="text-sm text-neutral-700 dark:text-neutral-300">{weapon.name}</span>
                                  <Badge variant="secondary">× {quantity}</Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </ScrollArea>
                    </TabsContent>
                    
                    <TabsContent value="financial" className="mt-4">
                      <ScrollArea className="h-[28rem] pr-4 -mr-4">
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                            <Card className="bg-neutral-50 dark:bg-neutral-900">
                              <CardContent className="p-4">
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">Coût d&apos;achat</p>
                                <p className="text-xl font-bold mt-1 tabular-nums">{totals.cout.toFixed(2)}$</p>
                              </CardContent>
                            </Card>
                            
                            <Card className="bg-neutral-50 dark:bg-neutral-900">
                              <CardContent className="p-4">
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">Prix de vente</p>
                                <p className="text-xl font-bold mt-1 tabular-nums">{totals.vente.toFixed(2)}$</p>
                              </CardContent>
                            </Card>
                          </div>
                          
                          <Card className="bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/50">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-sm text-green-700 dark:text-green-300">Marge bénéficiaire</p>
                                  <p className="text-2xl font-bold text-green-600 dark:text-green-500 mt-1 tabular-nums">
                                    {profit.toFixed(2)}$
                                  </p>
                                </div>
                                <div className="bg-green-100 dark:bg-green-800/30 px-3 py-1.5 rounded-full">
                                  <p className="text-sm font-medium text-green-700 dark:text-green-400 tabular-nums">
                                    +{profitPercentage.toFixed(0)}%
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <div>
                            <h4 className="font-medium text-sm text-neutral-800 dark:text-neutral-300 mb-3">
                              Détail par arme
                            </h4>
                            <div className="space-y-2">
                              {selectedWeapons.map(({ weapon, quantity }) => (
                                <Card key={weapon.name} className="bg-neutral-50 dark:bg-neutral-900">
                                  <CardContent className="p-3">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="text-sm font-medium">{weapon.name}</p>
                                        <div className="flex items-center text-xs mt-1">
                                          <Badge variant="secondary" className="text-xs">× {quantity}</Badge>
                                          <span className="mx-1.5 text-neutral-300 dark:text-neutral-600">•</span>
                                          <span className="text-neutral-500 dark:text-neutral-400 tabular-nums">{weapon.cout.toFixed(2)}$/unité</span>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm font-medium tabular-nums">{(weapon.vente * quantity).toFixed(2)}$</p>
                                        <p className="text-xs text-green-600 dark:text-green-500 mt-1 tabular-nums">
                                          +{((weapon.vente - weapon.cout) * quantity).toFixed(2)}$
                                        </p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </CardContent>
                
                <CardFooter className="flex justify-end border-t border-neutral-200 dark:border-neutral-800">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSelection}
                  >
                    Réinitialiser
                  </Button>
                </CardFooter>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

// Composant pour les éléments de la liste d'armes
interface WeaponListItemProps {
  weapon: WeaponComponent;
  isSelected: boolean;
  selectedItem: OrderItem | undefined;
  onCheckboxChange: (weapon: WeaponComponent, checked: boolean) => void;
  onQuantityChange: (weaponName: string, quantity: number) => void;
  onIncrement: (weaponName: string) => void;
  onDecrement: (weaponName: string) => void;
  showCategory?: boolean;
}

function WeaponListItem({
  weapon,
  isSelected,
  selectedItem,
  onCheckboxChange,
  onQuantityChange,
  onIncrement,
  onDecrement,
  showCategory
}: WeaponListItemProps) {
  const weaponId = cleanId(weapon.name);
  
  return (
    <div 
      className={`flex items-center gap-3 py-2 px-3 rounded-md transition-colors ${
        isSelected ? 'bg-neutral-100 dark:bg-neutral-800' : 'hover:bg-neutral-50 dark:hover:bg-neutral-900'
      }`}
    >
      <Checkbox 
        id={`order-${weaponId}`} 
        checked={isSelected}
        onCheckedChange={(checked) => onCheckboxChange(weapon, checked === true)}
        className="border-neutral-300 dark:border-neutral-600"
      />
      <label 
        htmlFor={`order-${weaponId}`} 
        className="flex-grow cursor-pointer min-w-0"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-neutral-800 dark:text-neutral-200">
          <span className="truncate">{weapon.name}</span>
          {showCategory && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              {weapon.category}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
          <span className="tabular-nums">{weapon.cout.toFixed(2)}$</span>
          <span>•</span>
          <span className="text-green-600 dark:text-green-500 tabular-nums">+{(weapon.vente - weapon.cout).toFixed(2)}$</span>
        </div>
      </label>
      {isSelected && (
        <div className="flex items-center gap-1 p-0.5 bg-neutral-200 dark:bg-neutral-700 rounded">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => onDecrement(weapon.name)}
            disabled={selectedItem?.quantity === 1}
            aria-label="Diminuer la quantité"
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Input
            id={`quantity-${weaponId}`}
            type="number"
            min={1}
            max={999}
            value={selectedItem?.quantity || 1}
            onChange={(e) => {
              const value = e.target.value === '' ? 1 : Number.parseInt(e.target.value);
              if (!Number.isNaN(value)) {
                onQuantityChange(weapon.name, value);
              }
            }}
            className="w-12 h-7 text-sm text-center tabular-nums bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            aria-label={`Quantité de ${weapon.name}`}
          />
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => onIncrement(weapon.name)}
            aria-label="Augmenter la quantité"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
} 