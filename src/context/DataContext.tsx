'use client';

import { LoadingOverlay } from '@/components/ui/loading';
import { useSession } from 'next-auth/react';
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
  useRef,
} from 'react';
import {
  type BaseWeapon,
  type User,
  type Weapon,
  getBaseWeapons,
  getUsers,
  getWeapons,
} from '../services/api';

interface DataContextType {
  weapons: Weapon[];
  users: User[];
  baseWeapons: BaseWeapon[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  pageSize: number;
  totalWeapons: number;
  // État de pagination pour baseWeapons
  baseWeaponsCurrentPage: number;
  baseWeaponsPageSize: number;
  totalBaseWeapons: number;
  refreshWeapons: (page: number, pageSize: number) => Promise<void>;
  refreshUsers: () => Promise<void>;
  // Mettre à jour la signature de refreshBaseWeapons
  refreshBaseWeapons: (page: number, pageSize: number) => Promise<void>;
  refreshAll: () => Promise<void>;
  setCurrentPage: (page: number) => void;
  // Ajouter une fonction pour changer la page des armes de base
  setBaseWeaponsCurrentPage: (page: number) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// This context controls whether components should show their own loading indicators
const LoadingDisplayContext = createContext<boolean>(true);

export function DataProvider({
  children,
  useOverlay = true,
}: {
  children: ReactNode;
  useOverlay?: boolean;
}) {
  const { status } = useSession();
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [baseWeapons, setBaseWeapons] = useState<BaseWeapon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPageInternal] = useState(1);
  const [pageSize, setPageSize] = useState(10); // Default page size
  const [totalWeapons, setTotalWeapons] = useState(0);

  // Pagination state for baseWeapons
  const [baseWeaponsCurrentPage, setBaseWeaponsCurrentPageInternal] = useState(1);
  const [baseWeaponsPageSize, setBaseWeaponsPageSize] = useState(50); // Default page size for baseWeapons
  const [totalBaseWeapons, setTotalBaseWeapons] = useState(0);

  // Ref pour éviter les appels multiples au montage initial
  const initialLoadDone = useRef(false);

  // Modifier refreshWeapons pour accepter page/pageSize et mettre à jour l'état
  const refreshWeapons = useCallback(async (page: number, size: number) => {
    // Indiquer le chargement spécifiquement pour les armes
    setLoading(true);
    setError(null);
    try {
      const data = await getWeapons(page, size); // Appeler getWeapons avec les params
      setWeapons(data.weapons);
      setTotalWeapons(data.totalCount);
      setCurrentPageInternal(page); // Mettre à jour la page actuelle
      setPageSize(size); // Mettre à jour la taille de page si nécessaire
    } catch (error) {
      console.error(`Error fetching weapons page ${page}:`, error);
      setError('Error fetching weapons');
      // Garder les anciennes données ? Ou vider ?
      // setWeapons([]);
      // setTotalWeapons(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUsers = useCallback(async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Error fetching users');
    }
  }, []);

  const refreshBaseWeapons = useCallback(async (page: number, size: number) => {
    try {
      const data = await getBaseWeapons(page, size);
      setBaseWeapons(data.baseWeapons);
      setTotalBaseWeapons(data.totalCount);
      setBaseWeaponsCurrentPageInternal(page);
      setBaseWeaponsPageSize(size);
    } catch (error) {
      console.error(`Error fetching base weapons page ${page}:`, error);
      setError('Error fetching base weapons');
    }
  }, []);

  const refreshAll = useCallback(async () => {
    if (status !== 'authenticated') {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    initialLoadDone.current = true; // Marquer le début du chargement initial
    try {
      // Charger UNIQUEMENT la première page d'armes initialement
      await refreshWeapons(1, pageSize);
      // NE PAS charger users ou baseWeapons ici
      // await Promise.all([
      //   refreshUsers(),
      //   refreshWeapons(1, pageSize),
      //   // refreshBaseWeapons(1, baseWeaponsPageSize) // <- Commenté
      // ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError('Error refreshing data');
    } finally {
      setLoading(false);
    }
  }, [status, pageSize, refreshWeapons]); // Retirer refreshUsers des dépendances

  useEffect(() => {
    // Charger tout au montage initial si authentifié
    if (status === 'authenticated' && !initialLoadDone.current) {
    refreshAll();
    }
  }, [status, refreshAll]);

  // Fonction pour changer de page (déclenche refreshWeapons via useEffect dans le composant)
  const setCurrentPage = useCallback((page: number) => {
    setCurrentPageInternal(page);
    // Note: Le rechargement est géré par WeaponsTable via son propre useEffect
    // Alternativement, on pourrait appeler refreshWeapons ici:
    // refreshWeapons(page, pageSize);
  }, [pageSize]); // Retirer refreshWeapons des dépendances ici si le rechargement est externe

  // Fonction pour changer la page des armes de base
  const setBaseWeaponsCurrentPage = useCallback((page: number) => {
    setBaseWeaponsCurrentPageInternal(page);
    // Note: Le rechargement est généralement géré par un useEffect dans le composant utilisant ces données
  }, []);

  const content = (
    <DataContext.Provider
      value={{
        weapons,
        users,
        baseWeapons,
        loading,
        error,
        // Pagination pour weapons
        currentPage,
        pageSize,
        totalWeapons,
        // Pagination pour baseWeapons
        baseWeaponsCurrentPage,
        baseWeaponsPageSize,
        totalBaseWeapons,
        // Fonctions
        refreshWeapons,
        refreshUsers,
        refreshBaseWeapons,
        refreshAll,
        setCurrentPage,
        setBaseWeaponsCurrentPage
      }}
    >
      <LoadingDisplayContext.Provider value={!useOverlay}>
        {children}
      </LoadingDisplayContext.Provider>
    </DataContext.Provider>
  );

  return useOverlay ? (
    <LoadingOverlay loading={loading} text="Chargement des données...">
      {content}
    </LoadingOverlay>
  ) : (
    content
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

export function useShouldDisplayLoading() {
  return useContext(LoadingDisplayContext);
}
